// Reuse the proven charging controller while keeping vehicle state and commands separate.
function evPeerReservation(peer, measuredW, phaseCount, now, voltage) {
    if (!peer || now-new Date(peer.updatedAt||0).getTime()<0 || now-new Date(peer.updatedAt||0).getTime()>120000) return 0;
    const requested=Math.max(0,Number(peer.targetCurrent)||0)*voltage;
    const measured=Number.isFinite(measuredW)?Math.max(0,measuredW)/Math.max(1,phaseCount):0;
    return Math.max(0,requested-measured);
}

function jeepWitLoad(states, control, now) {
    const age=now-new Date(control?.updatedAt||0).getTime();
    if(!control?.controlled || Number(control.targetCurrent)<6 || age<0 || age>120000 ||
        String(states?.['sensor.ev_charger_2_status']?.state).toLowerCase()!=='charging')return {active:false,powerW:0};
    const read=role=>{
        const e=states[role],stamp=new Date(e?.last_reported||e?.last_updated||e?.last_changed||0).getTime();
        if(!e || now-stamp<0 || now-stamp>120000 || ['unknown','unavailable',''].includes(String(e.state).toLowerCase()))return null;
        const value=Number(e.state);return Number.isFinite(value)?{value,unit:String(e.attributes?.unit_of_measurement||'').toLowerCase()}:null;
    };
    const current=read('sensor.ev_charger_2_current'),power=read('sensor.ev_charger_2_power');
    const phases=Number(control.phaseCount)===1?1:3;
    const w=current?.unit==='a' && current.value>=4?current.value*230*phases:
        power && ['w','kw'].includes(power.unit)?power.value*(power.unit==='kw'?1000:1):0;
    return {active:w>=1000,powerW:Math.max(0,w)};
}

module.exports=function secondEV(flows) {
    const get=id=>flows.find(n=>n.id===id),z='ess000000000001';
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('essjeep_'))flows.splice(i,1);
    const ids=['ess00000000000d','ess00000000000e','ess00000000000f','ess000000000017','ess000000000018','ess000000000019','ess000000000020','ess000000000021','essaudi_recovery_delay','essaudi_recovery_note'];
    const mapped=Object.fromEntries(ids.map(id=>[id,'essjeep_'+id]));
    const remap=text=>String(text||'').replace(/ess_audi_/g,'ess_jeep_').replace(/ess\/audi\//g,'ess/jeep/')
        .replace(/sensor\.ev_charger_(status|power|current|energy_today)\b/g,'sensor.ev_charger_2_$1')
        .replace(/binary_sensor\.ev_charger_online\b/g,'binary_sensor.ev_charger_2_online')
        .replace(/sensor\.ev_(state_of_charge|target_state_of_charge|climate_state)\b/g,'sensor.ev_2_$1')
        .replace(/switch\.ev_smart_charging\b/g,'switch.ev_2_smart_charging')
        .replace(/evBatteryCapacityKwh/g,'ev2BatteryCapacityKwh').replace(/evMaximumCurrentA/g,'ev2MaximumCurrentA')
        .replace(/evGridChargePowerKw/g,'ev2GridChargePowerKw').replace(/Easee Links/g,'Easee Rechts').replace(/Audi/g,'Jeep');
    for(const id of ids){
        const source=get(id);if(!source)throw Error('Missing EV controller node '+id);
        const n=JSON.parse(JSON.stringify(source));n.id=mapped[id];delete n.g;n.name='Jeep rechts · '+n.name;n.y=(n.y||0)+1500;
        for(const key of ['func','initialize','data'])if(typeof n[key]==='string')n[key]=remap(n[key]);
        n.wires=n.wires.map(output=>output.map(target=>mapped[target]||target));
        flows.push(n);
    }
    const jeep=get(mapped['ess00000000000d']);
    jeep.func=jeep.func.replace('specs?.ev2BatteryCapacityKwh) || 86','specs?.ev2BatteryCapacityKwh) || 54')
        .replace('specs?.ev2MaximumCurrentA) || 25','specs?.ev2MaximumCurrentA) || 16')
        .replace('const chargerId = statusAttributes.id || previous.chargerId || null;',`const chargerId = statusAttributes.id || null;
const primary=rawStates && rawStates[essRuntimeConfig.entities?.['sensor.ev_charger_status']||'sensor.ev_charger_status'];
if(chargerId && primary?.attributes?.id===chargerId) {
    flow.set('ess_jeep_control_status',{enabled:false,targetCurrent:0,reason:'Koppel rechts aan een andere laadpaal dan de Audi',updatedAt:new Date(now).toISOString()});return null;
}`)
        .replace("const chargerPower = value('sensor.ev_charger_2_power', 1000);",`const jeepPowerUnit=String(entity('sensor.ev_charger_2_power')?.attributes?.unit_of_measurement||'').toLowerCase();
const chargerPower=['w','kw'].includes(jeepPowerUnit)?value('sensor.ev_charger_2_power',jeepPowerUnit==='kw'?1000:1):null;`);
    jeep.initialize=jeep.initialize.replace("flow.set('ess_jeep_smart_enabled', true)","flow.set('ess_jeep_smart_enabled', false)");
    jeep.func=jeep.func.replace("const reportedEVSoc = value('sensor.ev_2_state_of_charge');",`const manualSoc=flow.get('ess_jeep_manual_soc');
const manualSocFresh=manualSoc && Number.isFinite(manualSoc.soc) && manualSoc.soc>=0 && manualSoc.soc<=100 && now-manualSoc.at>=0 && now-manualSoc.at<=43200000;
const reportedEVSoc=manualSocFresh ? manualSoc.soc : null;`)
        .replace('const audiSoc = Number.isFinite(Number(estimatedEVSoc))','const audiSoc = manualSocFresh && Number.isFinite(Number(estimatedEVSoc))')
        .replace("const audiTargetSoc = value('sensor.ev_2_target_state_of_charge');",'const audiTargetSoc = 100;')
        .replace("const chargerStatus = state('sensor.ev_charger_2_status');",`const chargerStatus = state('sensor.ev_charger_2_status');
if(chargerStatus==='disconnected') { flow.set('ess_jeep_manual_soc',null); flow.set('ess_jeep_soc_estimator',null); }`)
        .replace("'Veilige stop: EV-SOC niet beschikbaar'","'Vul de actuele Jeep-accustand in'");
    // Never route a retry or delayed stop to a newly mapped charger.
    for(const id of [mapped['ess000000000019']]) {
        const n=get(id),marker="const statusEntity = states && states['sensor.ev_charger_2_status'];";
        n.func=n.func.replace(marker,marker+"\nconst manual=flow.get('ess_jeep_manual_soc');if(!statusEntity?.attributes?.id || statusEntity.attributes.id!==chargerId || flow.get('ess_jeep_smart_enabled')!==true || !manual || Date.now()-manual.at<0 || Date.now()-manual.at>43200000)return null;");
        n.func=n.func.replace('Number(powerEntity.state) * 1000',"Number(powerEntity.state) * (String(powerEntity.attributes?.unit_of_measurement).toLowerCase()==='kw'?1000:1)");
    }
    // Recheck the current mapping at dispatch time, including delayed retries.
    for(const id of ['ess00000000000e','ess00000000000f','ess000000000017']) {
        const action=mapped[id],guard='essjeep_guard_'+id;
        for(const n of flows.filter(n=>n.id.startsWith('essjeep_')))n.wires=n.wires.map(output=>output.map(target=>target===action?guard:target));
        flows.push({id:guard,type:'function',z,name:'Controleer actuele rechter laadpaal',outputs:1,noerr:0,initialize:'',finalize:'',libs:[],x:600,y:2400,wires:[[action]],func:`
const ha=global.get('homeassistant')?.homeAssistant,config=flow.get('ess_system_config')||{},states=ha?.states;
if(!states || ha.isConnected===false)return null;
const right=states[config.entities?.['sensor.ev_charger_2_status']||'sensor.ev_charger_2_status'];
const left=states[config.entities?.['sensor.ev_charger_status']||'sensor.ev_charger_status'];
const id=right?.attributes?.id;
if(!id || id===left?.attributes?.id || msg.payload?.chargerId!==id)return null;
const stopping=msg.payload.command==='stop' || msg.payload.current===0;
if(!stopping){const manual=flow.get('ess_jeep_manual_soc'),now=Date.now();
    if(flow.get('ess_jeep_smart_enabled')!==true || !manual || now-manual.at<0 || now-manual.at>43200000 || right.state==='disconnected')return null;
    if((msg.payload.command==='start' || Number(msg.payload.current)>0) && !(flow.get('ess_jeep_control_status')?.targetCurrent>=6))return null;
}
return msg;`});
    }
    for(const [controller,peerKey,peerRole] of [[get('ess00000000000d'),'ess_jeep_control_status','sensor.ev_charger_2_power'],[jeep,'ess_audi_control_status','sensor.ev_charger_power']]) {
        controller.func=controller.func.replace(/\/\/ BEGIN SECOND EV RESERVATION[\s\S]*?\/\/ END SECOND EV RESERVATION\n/g,'');
        const marker='const requestedTargetCurrent = targetCurrent;';
        const block=`// BEGIN SECOND EV RESERVATION
${evPeerReservation.toString()}
const voltage=Number(essRuntimeConfig.specs?.voltage)||230;
const peerStatus=flow.get('${peerKey}');
const peerPowerEntity=entity('${peerRole}');
const peerUnit=String(peerPowerEntity?.attributes?.unit_of_measurement||'').toLowerCase();
const peerPower=peerPowerEntity && fresh('${peerRole}',15000) && ['w','kw'].includes(peerUnit) ? value('${peerRole}',peerUnit==='kw'?1000:1) : null;
const peerReservation=evPeerReservation(peerStatus,peerPower,Number(peerStatus?.phaseCount)||3,now,voltage);
if(targetCurrent>0) {
    const ownMeasured=chargerStatus==='charging' ? chargerCurrent!==null ? Math.max(0,chargerCurrent) : Math.max(0,Number(chargerPowerForControl)||0)/(voltage*phases) : 0;
    const fuseLimit=Math.max(0,(Number(essRuntimeConfig.specs?.mainFuseA)||25)-3);
    const limits=[1,2,3].map(index=>{const role='sensor.p1_meter_vermogen_fase_'+index;
        const p=value(role),ownCredit=usedPhases(outputPhase).includes(index-1)?ownMeasured:0;
        return p===null || !fresh(role,15000)?0:Math.floor(ownCredit+fuseLimit-p/voltage-peerReservation/voltage);});
    safeCurrentLimit=Math.min(safeCurrentLimit,...limits);
    targetCurrent=Math.min(targetCurrent,safeCurrentLimit);
    if(targetCurrent<minimumCurrent){targetCurrent=0;reason='Wacht op gezamenlijke faseruimte voor beide auto’s';}
}
// END SECOND EV RESERVATION
`;
        if(!controller.func.includes(marker))throw Error('Missing EV reservation insertion point');
        controller.func=controller.func.replace(marker,block+marker);
    }
    const tick=get('ess000000000002');tick.wires[0]=[...new Set([...tick.wires[0],mapped['ess00000000000d'],mapped['ess000000000020']])];
    // One shared WIT session supplies measured EV demand from either charger.
    const wit=get('esswitaudi_ctrl1');
    wit.func=wit.func.replace('const chargerPowerForControlW =','let chargerPowerForControlW =')
        .replace('const chargerPowerSource =','let chargerPowerSource =')
        .replace("const chargerTelemetryActive = chargerPowerSource !== 'none';","let chargerTelemetryActive = chargerPowerSource !== 'none';")
        .replace('const audiCharging =','let audiCharging =');
    const loadMarker="    && ['charging','awaiting_start','awaiting_authorization','ready_to_charge'].includes(chargerState);";
    if(!wit.func.includes(loadMarker))throw Error('Missing WIT EV demand insertion point');
    wit.func=wit.func.replace(loadMarker,loadMarker+`
${jeepWitLoad.toString()}
const jeepLoad=jeepWitLoad(states,flow.get('ess_jeep_control_status'),now);
const audiLoadActive=audiCharging;
if(jeepLoad.active){chargerPowerForControlW=(audiCharging?chargerPowerForControlW:0)+jeepLoad.powerW;
    chargerPowerSource=audiCharging?'beide_laadpalen':'easee_rechts';chargerTelemetryActive=true;audiCharging=true;}
`);
    wit.func=wit.func.replace('    audiChargingDetected:audiCharging','    audiChargingDetected:audiLoadActive,\n    jeepChargingDetected:jeepLoad.active');
    const controls=get('ess00000000000c');
    controls.func=controls.func.replace("if(String(msg.topic||'').startsWith('ess/jeep/'))return null;\n",'');
    controls.func="if(String(msg.topic||'').startsWith('ess/jeep/'))return null;\n"+controls.func;
    flows.push({id:'essjeep_settings',type:'function',z,name:'Bedien Jeep-laadplanning rechts',outputs:1,noerr:0,initialize:"if(flow.get('ess_jeep_smart_enabled')===undefined)flow.set('ess_jeep_smart_enabled',false);",finalize:'',libs:[],x:400,y:2200,wires:[[mapped['ess00000000000d'],'essprefs_save']],func:`
if(flow.get('ess_charging_preferences_ready')!==true)return null;
const topic=String(msg.topic||''),value=msg.payload,s={departureSoc:80,solarSoc:80,departureTime:'06:00',...flow.get('ess_jeep_settings')};
if(['ess/jeep/departure-soc','ess/jeep/solar-soc'].includes(topic)){
    if(value===null || value==='' || !Number.isFinite(Number(value)) || Number(value)<20 || Number(value)>100)return null;
    s[topic.endsWith('departure-soc')?'departureSoc':'solarSoc']=Math.round(Number(value));
}else if(topic==='ess/jeep/departure-time'){
    if(!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(String(value)))return null;s.departureTime=String(value);
}else if(topic==='ess/jeep/manual-soc'){
    if(value===null || value==='' || !Number.isFinite(Number(value)) || Number(value)<0 || Number(value)>100)return null;
    flow.set('ess_jeep_manual_soc',{soc:Number(value),at:Date.now()});
    flow.set('ess_jeep_soc_estimator',null);
}else if(topic==='ess/jeep/smart-enabled' && typeof value==='boolean'){
    flow.set('ess_jeep_smart_enabled',value);if(!value)flow.set('ess_jeep_force_full',false);
}else if(topic==='ess/jeep/force-full' && typeof value==='boolean'){
    flow.set('ess_jeep_force_full',value);if(value)flow.set('ess_jeep_smart_enabled',true);
}else return null;
flow.set('ess_jeep_settings',s);return {payload:Date.now()};`});
    for(const ui of flows.filter(n=>n.type==='ui-template'&&n.format)) {
        if(ui.id==='esstpl_ev0000001')ui.wires[0]=[...new Set([...ui.wires[0],'essjeep_settings'])];
        else ui.wires[0]=ui.wires[0].filter(id=>id!=='essjeep_settings');
        ui.format=ui.format.replace("evBatteryCapacityKwh:'EV-accu (kWh)'","evBatteryCapacityKwh:'Audi-accu (kWh)',ev2BatteryCapacityKwh:'Jeep-accu (kWh)',ev2MaximumCurrentA:'Maximale Jeep-stroom (A)',ev2GridChargePowerKw:'Jeep-netlaadvermogen (kW)'");
        ui.format=ui.format.replace('<span>Auto · gepland laden</span>','<span>Audi links · gepland laden</span>');
        const next='<div class="ess-timeline-row" v-if="navigationModules.battery!==false">';
        ui.format=ui.format.replace(next,`<div class="ess-timeline-row" v-if="roleConfigured('sensor.ev_charger_2_status')"><span>Jeep rechts · gepland laden</span><div class="ess-timeline-track" aria-hidden="true"><i v-for="cell in combinedPlan.cells" :key="'jeep-'+cell.key" :class="{ev:cell.ev2,now:cell.now}" :title="cell.time+(cell.ev2?' · Jeep gepland':' · Niet gepland')"></i></div></div>`+next);
    }
    const mapper=get('ess00000000000a');
    mapper.func=mapper.func.replace(/\/\/ BEGIN JEEP DASHBOARD[\s\S]*?\/\/ END JEEP DASHBOARD\n/g,'');
    mapper.func=mapper.func.replace("flow.set('ess_dashboard_live', dashboard);",`// BEGIN JEEP DASHBOARD
dashboard.jeepSmart={...(flow.get('ess_jeep_control_status')||{}),enabled:flow.get('ess_jeep_smart_enabled')===true,forceFull:flow.get('ess_jeep_force_full')===true};
dashboard.jeepSettings={departureSoc:80,solarSoc:80,departureTime:'06:00',...(flow.get('ess_jeep_settings')||{})};
dashboard.jeepManualSoc=flow.get('ess_jeep_manual_soc')||null;
if(dashboard.ev?.[1])dashboard.ev[1].name='Jeep Avenger · rechts';
// END JEEP DASHBOARD
flow.set('ess_dashboard_live', dashboard);`);
    const ui=get('esstpl_ev0000001');
    const panel=`<article class="panel span-12" v-if="roleConfigured('sensor.ev_charger_2_status')"><div class="panel-head"><b>Jeep Avenger · Easee rechts</b><span>54 kWh · eigen laadplanning</span></div>
<div class="charge-status"><div><span>REGELING</span><b>{{d.jeepSmart?.reason||'Vul de accustand in'}}</b></div><div><span>GESCHATTE ACCUSTAND</span><b>{{d.jeepSmart?.estimatedEVSoc==null?'—':Math.round(d.jeepSmart.estimatedEVSoc)+'%'}}</b></div><div><span>LAADVERMOGEN</span><b>{{power(d.ev?.[1]?.power)}}</b></div></div>
<div class="plan-grid"><label class="setting"><span>HUIDIGE ACCUSTAND (%)</span><select :value="d.jeepManualSoc?.soc??''" @change="send({topic:'ess/jeep/manual-soc',payload:$event.target.value})"><option value="" disabled>Vul in bij aansluiten</option><option v-for="value in 101" :key="value" :value="value-1">{{value-1}}%</option></select></label>
<label class="setting"><span>SOC BIJ VERTREK (%)</span><select :value="d.jeepSettings?.departureSoc||80" @change="send({topic:'ess/jeep/departure-soc',payload:$event.target.value})"><option v-for="value in [20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]" :key="value" :value="value">{{value}}%</option></select></label>
<label class="setting"><span>EXTRA LADEN OP ZON TOT (%)</span><select :value="d.jeepSettings?.solarSoc||80" @change="send({topic:'ess/jeep/solar-soc',payload:$event.target.value})"><option v-for="value in [20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]" :key="value" :value="value">{{value}}%</option></select></label>
<label class="setting"><span>VERTREKTIJD</span><input type="time" :value="d.jeepSettings?.departureTime||'06:00'" @change="send({topic:'ess/jeep/departure-time',payload:$event.target.value})"></label></div>
<div class="quick-actions"><button class="quick-action" @click="send({topic:'ess/jeep/smart-enabled',payload:!d.jeepSmart?.enabled})">{{d.jeepSmart?.enabled?'Slim laden uitzetten':'Slim laden aanzetten'}}</button><button class="quick-action" @click="send({topic:'ess/jeep/force-full',payload:!d.jeepSmart?.forceFull})">{{d.jeepSmart?.forceFull?'Direct laden stoppen':'Nu laden tot 100%'}}</button></div>
<p class="subtle">Vul bij elke aansluiting de actuele accustand in. De schatting gebruikt het gemeten laadvermogen en blijft maximaal 12 uur geldig. De laadgrens die in de Jeep zelf staat blijft leidend.</p>
<div class="plan-clock-summary"><div><span>GEPLAND NETLADEN</span><b>{{energy(d.jeepSmart?.plannedGridEnergyKwh)}}</b></div><div><span>GEPLANDE LAADKOSTEN</span><b>{{money(d.jeepSmart?.plannedGridCost)}}</b></div><div><span>VANDAAG GELADEN</span><b>{{energy(d.ev?.[1]?.today)}}</b></div></div>
<details class="ess-slot-list"><summary>Jeep-laadplanning in detail</summary><p v-if="!d.jeepSmart?.selectedSlots?.length" class="subtle">Geen laadkwartieren gepland.</p><ul><li v-for="slot in d.jeepSmart?.selectedSlots||[]" :key="slot.start"><span>{{slotRange(slot.start,slot.end)}}</span><b>{{priceLabel(slot.allInPrice)}}</b></li></ul></details></article>`;
    const pattern=/<article class="panel span-12" v-if="d\.ev&&d\.ev\[1\][\s\S]*?<\/article>/;
    if(!pattern.test(ui.format))throw Error('Missing second EV dashboard panel');
    ui.format=ui.format.replace(pattern,panel);
};
module.exports.evPeerReservation=evPeerReservation;
module.exports.jeepWitLoad=jeepWitLoad;
