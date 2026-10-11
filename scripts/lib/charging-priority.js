function evPriorityDemand(flow,now,exclude) {
    return ['audi','jeep'].some(car=>{
        if(car===exclude)return false;
        const request=flow.get('ess_'+car+'_priority_request');
        if(request&&now>=request.at&&now-request.at<=120000)return request.requested===true;
        const status=flow.get('ess_'+car+'_control_status'),age=now-new Date(status?.updatedAt||0).getTime();
        return age>=0&&age<=120000&&status?.controlled===true&&Number(status.targetCurrent)>=6&&
            ['force-full','departure-plan','deadline','ultra-cheap','climate-support'].includes(status.controlMode);
    });
}
function witChargingPriority(flow,states,now) {
    const config=flow.get('ess_system_config')||{};
    if(config.modules?.battery===false||config.modules?.inverter===false)return false;
    const grid=flow.get('ess_wit_grid_charge_mode')||'auto',solar=flow.get('ess_wit_export_mode')||'auto';
    if(grid==='off'&&solar==='off')return false;
    const limits=flow.get('ess_wit_battery_limits');
    const reportedFresh=limits&&limits.remoteEntity===config.entities?.['select.growatt_grid_remote_power_control_enable']&&now>=limits.at&&now-limits.at<=120000;
    const item=states?.['sensor.growatt_battery_battery_soc'];
    const age=now-new Date(item?.last_reported||item?.last_updated||item?.last_changed||0).getTime();
    const reportedSoc=reportedFresh&&Number.isFinite(limits.reportedSoc)&&limits.reportedSoc>=0&&limits.reportedSoc<=100?limits.reportedSoc:null;
    const soc=reportedSoc!==null?reportedSoc:item&&!['','unknown','unavailable'].includes(String(item.state).toLowerCase())?Number(item.state):NaN;
    if(!Number.isFinite(soc)||soc<0||soc>100||(reportedSoc===null&&(age<0||age>120000)))return true;
    const target=solar!=='off'||grid==='auto'?100:Number(flow.get('ess_wit_grid_charge_target_soc'))||80;
    if(soc>=target-0.2)return false;
    if(reportedFresh&&
        (limits.chargePowerW===0||limits.chargeCurrentA===0))return false;
    return true;
}
function evPriorityReservation(flow,states,now,voltage) {
    return ['audi','jeep'].reduce((total,car)=>{
        const r=flow.get('ess_'+car+'_priority_request');
        if(!r?.requested||now<r.at||now-r.at>120000||!Number.isFinite(r.currentA))return total;
        const item=states?.[car==='audi'?'sensor.ev_charger_power':'sensor.ev_charger_2_power'];
        const age=now-new Date(item?.last_reported||item?.last_updated||item?.last_changed||0).getTime();
        const unit=String(item?.attributes?.unit_of_measurement||'').toLowerCase();
        const n=Number(item?.state);
        const measured=item&&age>=0&&age<=15000&&Number.isFinite(n)&&['w','kw'].includes(unit)?Math.max(0,n*(unit==='kw'?1000:1)):0;
        return total+Math.max(0,r.currentA*voltage-measured/3);
    },0);
}
module.exports=function chargingPriority(flows){
    for(const n of flows.filter(n=>n.type==='function')) {
        n.func=n.func.replace(/function evPriorityDemand[\s\S]*?\n}\n/g,'').replace(/function witChargingPriority[\s\S]*?\n}\n/g,'').replace(/function evPriorityReservation[\s\S]*?\n}\n/g,'')
            .replace(/const priorityRequest=[\s\S]*?flow\.set\('ess_(?:audi|jeep)_priority_request',[^\n]*\n/g,'')
            .replace(/const lowerPriorityBlocked=[^\n]*\n/g,'')
            .replace('const solarPhaseAdjustmentAllowed = !lowerPriorityBlocked && enabled','const solarPhaseAdjustmentAllowed = enabled')
            .replace(/} else if \(lowerPriorityBlocked\) \{[\s\S]*?} else if \(audiSoc >= solarSoc\) \{/g,'} else if (audiSoc >= solarSoc) {')
            .replace(/if\(evPriorityDemand\(flow,now\)\)return stopOwned\('WIT laden wacht: beide auto’s hebben voorrang',details\);\n/g,'')
            .replace(/        if\(evPriorityDemand\(flow,now\)\)\{flow\.set\(key,null\);return \[null,\{payload:now\}\];}\n/g,'');
    }
    for(const [id,car,peer]of [['ess00000000000d','audi','jeep'],['essjeep_ess00000000000d','jeep','audi']]) {
        const n=flows.find(n=>n.id===id);
        const marker='const preflightReady = preflightIssues.length === 0;';
        if(!n.func.includes(marker))throw Error('EV priority insertion point missing');
        n.func=evPriorityDemand.toString()+'\n'+witChargingPriority.toString()+'\n'+n.func.replace(marker,marker+`
const priorityRequest=(enabled||climatePowerSupportActive)&&!evSmartChargingActive&&chargerOnline&&!!chargerId&&chargerReadyForControl&&
    ((audiSoc!==null&&audiSoc<targetSoc&&(forceFull||deadlineCharge||ultraCheapQuarter||scheduledNow))||climatePowerSupportActive);
flow.set('ess_${car}_priority_request',{at:now,requested:priorityRequest,currentA:Math.min(maximumCurrent,Math.floor(netChargePowerKw*1000/(230*3)))});`);
        n.func=n.func.replace('const solarPhaseAdjustmentAllowed = enabled',`const lowerPriorityBlocked=witChargingPriority(flow,states,now)||evPriorityDemand(flow,now,'${car}');
const solarPhaseAdjustmentAllowed = !lowerPriorityBlocked && enabled`);
        n.func=n.func.replace('} else if (audiSoc >= solarSoc) {',`} else if (lowerPriorityBlocked) {
        solarReadySince=0;solarInsufficientSince=0;solarStartedAt=0;
        reason=evPriorityDemand(flow,now,'${car}')?'Zonneladen wacht: gepland laden van de andere auto heeft voorrang':'Zonneladen wacht: WIT-accu heeft voorrang';
    } else if (audiSoc >= solarSoc) {`);
    }
    const grid=flows.find(n=>n.id==='esswitgrid_ctrl1'),marker="if (mode === 'off') return stopOwned('Slim netladen staat uit', details);";
    if(!grid.func.includes(marker))throw Error('WIT priority insertion point missing');
    grid.func=evPriorityReservation.toString()+'\n'+grid.func.replace(/const gridCommandLimitW = [^\n]*;/,
        'const gridCommandLimitW = Math.max(0, 3 * Math.min(...phasePowers.map(power => designPhaseCurrentA * nominalVoltageV - power + currentForcedPowerW / 3 - evPriorityReservation(flow,states,now,nominalVoltageV))));');
    // Account for queued EV demand again immediately before the WIT write.
    for(const id of ['esswitgrid_transport_dispatch','esswitgrid_transport_reply']) {
    const transport=flows.find(n=>n.id===id);
    transport.func=evPriorityReservation.toString()+'\n'+transport.func.replace(/const headroom=3\*Math\.min[^\n]*;/,
        "const headroom=3*Math.min(...phase.map(w=>limit-w+credited/3-evPriorityReservation(flow,Object.fromEntries(Object.entries(mapping||{}).map(([id,actual])=>[id,raw?.[actual]])),now,Number(spec.voltage)||230))); ");
    }
    const solar=flows.find(n=>n.id==='esswitexport_ctrl');
    solar.func=evPriorityDemand.toString()+'\n'+solar.func
        .replace('&& soc < 100 && !audiNeedsSolar','&& soc < 100 && !evPriorityDemand(flow,Date.now())')
        .replace(': audiNeedsSolar',': evPriorityDemand(flow,Date.now())')
        .replace("? 'Automatisch · EV '+Math.round(audiSoc)+'/'+Math.round(solarSoc)+'%'","? 'Automatisch · gepland autoladen heeft voorrang'");
};
module.exports.evPriorityDemand=evPriorityDemand;
module.exports.witChargingPriority=witChargingPriority;
module.exports.evPriorityReservation=evPriorityReservation;
