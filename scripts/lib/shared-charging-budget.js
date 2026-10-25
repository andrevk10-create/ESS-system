function sharedSiteBudget(flow){
    const spec=flow.get('ess_system_config')?.specs||{},phases=Number(spec.phases)||3,voltage=Number(spec.voltage)||230;
    const fuse=Number(spec.mainFuseA)||25,house=flow.get('ess_house_consumption_learning');
    const houseKw=house?.schemaVersion===2&&Number.isFinite(house.forecastKwh)?Math.max(0,house.forecastKwh)/24:10/24;
    const phaseKw=Math.max(0,(fuse-1)*voltage/1000-houseKw/phases);
    return {phases,voltage,phaseKw,totalKw:phaseKw*phases,houseKw};
}
function sharedEvPlanningKw(flow,car,maximum,now){
    const config=flow.get('ess_system_config')||{},spec=config.specs||{},site=sharedSiteBudget(flow),peer=car==='audi'?'jeep':'audi';
    const own=flow.get('ess_'+car+'_control_status'),other=flow.get('ess_'+peer+'_control_status');
    const ownPhases=own?.phaseCount===1?1:Math.min(3,site.phases),peerPhases=other?.phaseCount===1?1:Math.min(3,site.phases);
    const role=peer==='audi'?'sensor.ev_charger_status':'sensor.ev_charger_2_status';
    const ownRole=car==='audi'?'sensor.ev_charger_status':'sensor.ev_charger_2_status';
    const installed=!!config.entities?.[role]&&config.entities[role]!==config.entities[ownRole];
    const age=now-Date.parse(other?.updatedAt||''),fresh=Number.isFinite(age)&&age>=0&&age<=150000;
    const enabled=flow.get('ess_'+peer+'_smart_enabled')!==false&&(peer==='audi'||flow.get('ess_jeep_smart_enabled')===true);
    const peerNeeds=installed&&enabled&&(!fresh||other.forceFull||other.energyNeeded>0||other.targetCurrent>=6);
    const ownCap=Math.min(maximum,site.phaseKw*ownPhases);
    if(!peerNeeds)return ownCap;
    const peerMax=Number(spec[peer==='audi'?'evGridChargePowerKw':'ev2GridChargePowerKw'])||11;
    const reservedPerPhase=Math.min(peerMax/peerPhases,site.phaseKw/2);
    return Math.max(0,Math.min(ownCap,(site.phaseKw-reservedPerPhase)*ownPhases));
}
function sharedWitSlotKw(flow,start,end,maximum,now){
    const site=sharedSiteBudget(flow);let phaseReserved=0;
    for(const car of ['audi','jeep']){
        const plan=flow.get('ess_'+car+'_control_status');
        if(!plan||plan.enabled===false||flow.get('ess_'+car+'_smart_enabled')===false)continue;
        const age=now-Date.parse(plan.updatedAt||'');
        if(!Number.isFinite(age)||age<0||age>150000){
            // Do not assume a stale pending car request has released its share.
            if(plan.energyNeeded>0)phaseReserved+=site.phaseKw/2;
            continue;
        }
        const phases=plan.phaseCount===1?1:Math.min(3,site.phases);
        const overlap=(plan.selectedSlots||[]).filter(s=>Date.parse(s.start)<end&&Date.parse(s.end)>start);
        let kw=Math.max(0,...overlap.map(s=>Number(s.powerKw)||Number(plan.plannedChargePowerKw)||11));
        if(plan.forceFull||plan.controlled&&['force-full','deadline','ultra-cheap','climate-support'].includes(plan.controlMode)){
            const requested=Math.max(Number(plan.plannedChargePowerKw)||11,(Number(plan.targetCurrent)||0)*site.voltage*phases/1000);
            const until=now+Math.max(900000,(Number(plan.energyNeeded)||0)/requested*3600000);
            if(start<until&&end>now)kw=Math.max(kw,requested);
        }
        phaseReserved+=kw/phases;
    }
    return Math.max(0,Math.min(maximum,(site.phaseKw-phaseReserved)*site.phases));
}
function sharedManualSlots(flow,prices,now,maximum){
    const result=[];
    for(let start=now;start<now+86400000;){
        const end=Math.min(now+86400000,(Math.floor(start/900000)+1)*900000),known=prices.find(p=>p.start<=start&&p.end>=end);
        result.push({start,end,allInPrice:known?.allInPrice??null,marketPrice:known?.marketPrice??null,sharedChargeKw:sharedWitSlotKw(flow,start,end,maximum,now)});
        start=end;
    }
    return result;
}
module.exports=function apply(flows){
    for(const [id,car,field]of [['ess00000000000d','audi','evGridChargePowerKw'],['essjeep_ess00000000000d','jeep','ev2GridChargePowerKw']]){
        const n=flows.find(n=>n.id===id),anchor=`const netChargePowerKw = Number((flow.get('ess_system_config') || {}).specs?.${field}) || 11;`;
        if(!n.func.includes(anchor))throw Error('Shared EV planning anchor missing');
        n.func=sharedSiteBudget.toString()+'\n'+sharedEvPlanningKw.toString()+'\n'+n.func.replace(anchor,`const configuredChargePowerKw = Number((flow.get('ess_system_config') || {}).specs?.${field}) || 11;
const netChargePowerKw=Math.max(.001,sharedEvPlanningKw(flow,'${car}',configuredChargePowerKw,Date.now()));`);
        n.func=n.func.replace("    plannedChargePowerKw: netChargePowerKw,","    plannedChargePowerKw: netChargePowerKw,\n    sharedPowerBudget:true,\n    configuredChargePowerKw,");
        n.func=n.func.replace('Math.ceil(netChargePowerKw*1000/(230*3))','Math.ceil(configuredChargePowerKw*1000/(230*3))');
    }
    const grid=flows.find(n=>n.id==='esswitgrid_ctrl1');
    const anchor="const knownPricePlan=mode==='auto'?witKnownPricePlan(slots,now,";
    if(!grid.func.includes(anchor))throw Error('Shared battery planning anchor missing');
    grid.func=sharedSiteBudget.toString()+'\n'+sharedWitSlotKw.toString()+'\n'+sharedManualSlots.toString()+'\n'+grid.func.replace(anchor,"const sharedPriceSlots=slots.map(s=>({...s,sharedChargeKw:sharedWitSlotKw(flow,s.start,s.end,reserveInputs.chargeKw,now)}));\nconst knownPricePlan=mode==='auto'?witKnownPricePlan(sharedPriceSlots,now,");
    grid.func=grid.func.replace('witManualChargePlan(slots,now,remainingEnergyKwh,planLimitW/1000)','witManualChargePlan(sharedManualSlots(flow,slots,now,planLimitW/1000),now,remainingEnergyKwh,planLimitW/1000)');
    for(const n of flows.filter(n=>n.type==='ui-template'&&n.format))n.format=n.format.replace('Eigen laadplanning in detail','Eigen laadplanning in detail · gedeelde aansluiting')
        .replace('<span>GEPLAND VERMOGEN</span>','<span>GEPLAND VERMOGEN · GEDEELDE AANSLUITING</span>');
};
module.exports.sharedSiteBudget=sharedSiteBudget;
module.exports.sharedEvPlanningKw=sharedEvPlanningKw;
module.exports.sharedWitSlotKw=sharedWitSlotKw;
module.exports.sharedManualSlots=sharedManualSlots;
module.exports.unapply=function unapply(flows){
    for(const n of flows.filter(n=>n.func)){
        n.func=n.func.replace(/^function (?:sharedSiteBudget|sharedEvPlanningKw|sharedWitSlotKw|sharedManualSlots)\([\s\S]*?^\}\r?\n/gm,'')
            .replace(/const configuredChargePowerKw = ([^\n]+);\r?\nconst netChargePowerKw=Math\.max\(\.001,sharedEvPlanningKw\([^\n]+\);/g,'const netChargePowerKw = $1;')
            .replace(/    sharedPowerBudget:true,\r?\n    configuredChargePowerKw,\r?\n/g,'')
            .replaceAll('Math.ceil(configuredChargePowerKw*1000/(230*3))','Math.ceil(netChargePowerKw*1000/(230*3))');
    }
};
