// Resolve one vehicle only; ambiguous discovery must never address another car.
function jeepVehicle(states, entities = {}, now = Date.now()) {
    const configured = entities['sensor.ev_2_state_of_charge'];
    const candidates = Object.keys(states).filter(id => /^sensor\..*jeep.*_hvbattery_charge$/.test(id));
    const anchor = configured && configured!=='sensor.ev_2_state_of_charge' ? configured : candidates.length === 1 ? candidates[0] : null;
    if (!anchor || !/_hvbattery_charge$/.test(anchor)) return { available:false, fresh:false, soc:null, actions:[] };
    const stem = anchor.slice(7).replace(/_hvbattery_charge$/, '');
    const entity = (suffix, domain = 'sensor') => states[domain+'.'+stem+'_'+suffix];
    const read = suffix => { const e=entity(suffix); return e && !['unknown','unavailable',''].includes(e.state) && Number.isFinite(Number(e.state)) ? Number(e.state) : null; };
    const updatedAt = entity('last_info_update_at')?.state;
    const age = now-Date.parse(updatedAt);
    const soc=read('hvbattery_charge');
    const fresh=Number.isFinite(age)&&age>=0&&age<=1800000&&soc!==null&&soc>=0&&soc<=100;
    const warnings=['front_left','front_right','rear_left','rear_right'].filter(side=>entity('tire_pressure_'+side+'_warning','binary_sensor')?.state==='on');
    return {available:soc!==null,anchor,stem,soc,fresh,updatedAt,range:read('driving_range'),odometer:read('odometer'),battery12v:read('12v_battery'),remainingMinutes:read('time_to_charge_l2'),serviceKm:read('distance_to_service'),serviceDays:read('days_till_service_needed'),charging:entity('charging','binary_sensor')?.state==='on',plugged:entity('ev_charger','binary_sensor')?.state==='on',ignition:entity('ignition','binary_sensor')?.state==='on',tireWarningCount:warnings.length};
}
function jeepSoc(states, entities, remembered, now) {
    const vehicle=jeepVehicle(states,entities,now);
    const configured=entities?.['sensor.ev_2_state_of_charge'];
    const ambiguous=Object.keys(states).filter(id=>/^sensor\..*jeep.*_hvbattery_charge$/.test(id)).length>1;
    const anchor=vehicle.anchor||(configured&&configured!=='sensor.ev_2_state_of_charge'?configured:!ambiguous?remembered?.anchor:null);
    const valid=sample=>anchor&&sample&&sample.anchor===anchor&&Number.isFinite(sample.soc)&&sample.soc>=0&&sample.soc<=100&&Number.isFinite(sample.reportedAt)&&sample.reportedAt<=now;
    const reportedAt=Date.parse(vehicle.updatedAt);
    if(anchor&&vehicle.soc!==null&&vehicle.soc>=0&&vehicle.soc<=100&&Number.isFinite(reportedAt)&&reportedAt<=now&&(!valid(remembered)||reportedAt>=remembered.reportedAt))return {anchor,soc:vehicle.soc,reportedAt,at:now,source:'auto'};
    return valid(remembered)?{...remembered,at:now,source:'last-known'}:null;
}
module.exports=function apply(flows) {
    const helper=jeepVehicle.toString()+'\n'+jeepSoc.toString()+`\nfunction currentJeepSoc(){const sample=jeepSoc(global.get('homeassistant')?.homeAssistant?.states||{},flow.get('ess_system_config')?.entities||{},flow.get('ess_jeep_last_soc'),Date.now());if(sample)flow.set('ess_jeep_last_soc',sample);return sample;}\n`;
    const mapper=flows.find(n=>n.id==='ess00000000000a');
    mapper.func=mapper.func.replace("dashboard.jeepManualSoc=flow.get('ess_jeep_manual_soc')||null;",'');
    mapper.func=mapper.func.replace(/\/\/ BEGIN JEEP VEHICLE[\s\S]*?\/\/ END JEEP VEHICLE\n/g,'');
    mapper.func=mapper.func.replace("flow.set('ess_dashboard_live', dashboard);",`// BEGIN JEEP VEHICLE
${helper}
dashboard.jeepVehicle=jeepVehicle(global.get('homeassistant')?.homeAssistant?.states||{},flow.get('ess_system_config')?.entities||{});
const lastJeepSoc=currentJeepSoc();
if(lastJeepSoc){dashboard.jeepVehicle.soc=lastJeepSoc.soc;dashboard.jeepVehicle.available=true;dashboard.jeepVehicle.updatedAt=new Date(lastJeepSoc.reportedAt).toISOString();}
const jeepServices=global.get('homeassistant')?.homeAssistant?.services?.uconnect||{};
dashboard.jeepVehicle.actions=['update','precond_on','precond_off','doors_lock','doors_unlock','lights'].filter(action=>jeepServices[action]);
dashboard.jeepVehicle.command=flow.get('ess_jeep_vehicle_command')||null;
const jeepRequested=flow.get('ess_jeep_vehicle_requested')||{};
dashboard.jeepVehicle.climateRequested=jeepRequested.anchor===dashboard.jeepVehicle.anchor&&Number(flow.get('ess_jeep_climate_power_support')?.expiresAt)>Date.now();
dashboard.jeepVehicle.lockRequested=jeepRequested.anchor===dashboard.jeepVehicle.anchor?jeepRequested.locked:null;
// END JEEP VEHICLE
flow.set('ess_dashboard_live', dashboard);`);
    for(const n of flows.filter(n=>n.id.startsWith('essjeep_')&&n.func)) {
        n.func=n.func.replace(/\}else if\(topic==='ess\/jeep\/manual-soc'\)\{[\s\S]*?(?=\}else if\(topic==='ess\/jeep\/smart-enabled')/,'');
        if(!n.func.includes("flow.get('ess_jeep_manual_soc')"))continue;
        n.func=helper+n.func;
        n.func=n.func.replaceAll("flow.get('ess_jeep_manual_soc')","currentJeepSoc()");
        n.func=n.func.replace("flow.set('ess_jeep_manual_soc',null);",'');
        n.func=n.func.replace(/const previousSocEstimator = flow\.get\('ess_jeep_soc_estimator'\)[\s\S]*?flow\.set\('ess_jeep_soc_estimator', \{[\s\S]*?\n\}\);/,"const estimatedEVSoc=reportedEVSoc;\nconst audiSoc=reportedEVSoc;\nconst audiSocSource='Laatst gemeld door Jeep';");
        n.func=n.func.replace(/\}else if\(topic==='ess\/jeep\/manual-soc'\)\{[\s\S]*?(?=\}else if\(topic==='ess\/jeep\/smart-enabled')/,'');
        n.func=n.func.replace("'Vul de actuele Jeep-accustand in'","'Wacht op eerste Jeep-accustand'");
    }
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('essjvehicle_'))flows.splice(i,1);
    const z='ess000000000001',ui=flows.find(n=>n.id==='esstpl_ev0000001');
    flows.push({id:'essjvehicle_soc_tick',type:'inject',z,name:'Bewaar laatst gemelde Jeep-accustand',props:[],repeat:'60',once:false,wires:[['essjvehicle_soc_save']]});
    flows.push({id:'essjvehicle_soc_save',type:'function',z,name:'Bewaar alleen gewijzigde Jeep-meting',func:helper+`if(flow.get('ess_charging_preferences_ready')===false)return null;const sample=currentJeepSoc();if(!sample)return null;const signature=JSON.stringify([sample.anchor,sample.soc,sample.reportedAt]);if(flow.get('ess_jeep_soc_saved')===signature)return null;flow.set('ess_jeep_soc_saved',signature);return {payload:Date.now()};`,outputs:1,wires:[['essprefs_save']]});
    ui.wires[0].push('essjvehicle_request');
    const fn=(id,name,func,next)=>({id,type:'function',z,name,func,outputs:1,wires:[[next]]});
    const api=(id,data,next)=>({id,type:'ha-api',z,name:'Jeep Uconnect',server:'ess00000000000b',version:1,protocol:'websocket',method:'get',path:'',data,dataType:'json',responseType:'json',outputProperties:[{property:'jeepReply',propertyType:'msg',value:'',valueType:'results'}],wires:[[next]]});
    flows.push(fn('essjvehicle_request','Controleer Jeep-bediening',helper+`
if(msg.topic!=='ess/jeep/vehicle-action')return null;
let action=String(msg.payload);const ha=global.get('homeassistant')?.homeAssistant;
const vehicle=jeepVehicle(ha?.states||{},flow.get('ess_system_config')?.entities||{});
const requested=flow.get('ess_jeep_vehicle_requested')||{};
if(action==='climate-toggle')action=requested.anchor===vehicle.anchor&&Number(flow.get('ess_jeep_climate_power_support')?.expiresAt)>Date.now()?'precond_off':'precond_on';
if(action==='lock-toggle')action=requested.anchor===vehicle.anchor&&requested.locked===true?'doors_unlock':'doors_lock';
if(!vehicle.anchor||!['update','precond_on','precond_off','doors_lock','doors_unlock','lights'].includes(action)||!ha?.services?.uconnect?.[action])return null;
const previous=flow.get('ess_jeep_vehicle_command');
if(previous&&Date.now()-previous.at<10000)return null;
msg.jeepAction=action;msg.jeepAnchor=vehicle.anchor;
flow.set('ess_jeep_vehicle_command',{action,at:Date.now(),status:'Verzenden…'});return msg;`,'essjvehicle_registry'));
    flows.push(api('essjvehicle_registry','{"type":"config/entity_registry/list"}','essjvehicle_dispatch'));
    flows.push(fn('essjvehicle_dispatch','Adresseer uitsluitend deze Jeep',helper+`
const vehicle=jeepVehicle(global.get('homeassistant')?.homeAssistant?.states||{},flow.get('ess_system_config')?.entities||{});
const entry=Array.isArray(msg.jeepReply)?msg.jeepReply.find(e=>e.entity_id===msg.jeepAnchor&&e.platform==='uconnect'&&!e.disabled_by):null;
if(!entry?.device_id||vehicle.anchor!==msg.jeepAnchor){flow.set('ess_jeep_vehicle_command',{action:msg.jeepAction,at:Date.now(),status:'Jeep-koppeling niet bevestigd'});return null;}
msg.payload={data:{type:'call_service',domain:'uconnect',service:msg.jeepAction,service_data:{device_id:entry.device_id}}};return msg;`,'essjvehicle_action'));
    flows.push(api('essjvehicle_action','','essjvehicle_result'));
    const result=fn('essjvehicle_result','Jeep-opdracht geaccepteerd',`const now=Date.now();
flow.set('ess_jeep_vehicle_command',{action:msg.jeepAction,at:now,status:'Opdracht geaccepteerd · wacht op auto'});
const previous=flow.get('ess_jeep_vehicle_requested')||{};
const requested=previous.anchor===msg.jeepAnchor?previous:{anchor:msg.jeepAnchor};
if(msg.jeepAction==='doors_lock')requested.locked=true;
if(msg.jeepAction==='doors_unlock')requested.locked=false;
flow.set('ess_jeep_vehicle_requested',requested);
if(msg.jeepAction==='precond_on')flow.set('ess_jeep_climate_power_support',{requestedAt:now,expiresAt:now+1800000,minimumCurrentA:6,minimumPowerW:1000,source:'jeep-climate'});
if(msg.jeepAction==='precond_off')flow.set('ess_jeep_climate_power_support',null);
return msg;`,'ess00000000000a');
    result.wires=[['ess00000000000a','essjeep_ess00000000000d']];flows.push(result);
    flows.push({id:'essjvehicle_catch',type:'catch',z,name:'Jeep-opdracht mislukt',scope:['essjvehicle_registry','essjvehicle_action'],uncaught:false,wires:[['essjvehicle_error']]});
    flows.push(fn('essjvehicle_error','Toon Jeep-fout',`flow.set('ess_jeep_vehicle_command',{action:msg.jeepAction,at:Date.now(),status:'Opdracht mislukt · controleer Uconnect'});return null;`,'ess00000000000a'));
    const manual=ui.format.match(/<div class="ess-ev-manual">[\s\S]*?<\/div>/)?.[0];
    if(!manual)throw Error('Missing Jeep manual SOC panel');
    const metrics=[['BEREIK','range',' km'],['KILOMETERSTAND','odometer',' km'],['12V-ACCU','battery12v',' V']].map(([label,key,unit])=>`<div><span>${label}</span><b>{{d.jeepVehicle?.${key}==null?'—':d.jeepVehicle.${key}+'${unit}'}}</b></div>`).join('');
    const labels={update:'Verversen',lights:'Lichtsignaal'};
    const buttons=Object.entries(labels).map(([action,label])=>`<button class="touch-button" v-if="d.jeepVehicle?.actions?.includes('${action}')" @click="send({topic:'ess/jeep/vehicle-action',payload:'${action}'})">${label}</button>`).join('');
    const vehicle=`<div class="vehicle" v-if="d.jeepVehicle?.available"><div class="vehicle-main"><div><span>VERGRENDELING</span><b>{{d.jeepVehicle.lockRequested==null?'Onbekend':d.jeepVehicle.lockRequested?'Vergrendelen aangevraagd':'Ontgrendelen aangevraagd'}}</b></div><div><span>SOC</span><b>{{d.jeepVehicle.soc??'—'}}%</b></div><div><span>VANDAAG GELADEN</span><b>{{energy(d.ev?.[1]?.today)}}</b></div><div><span>HUIDIG VERMOGEN</span><b>{{power(d.ev?.[1]?.power)}}</b></div><div><span>AANSLUITING</span><b>{{d.ev?.[1]?.status||'—'}}</b></div><div><span>KLIMAAT</span><b>{{d.jeepVehicle.climateRequested?'Start aangevraagd':'Geen actieve opdracht'}}</b></div></div><div class="quick-actions"><button class="quick-action" v-if="d.jeepVehicle.actions?.includes('doors_lock')&&d.jeepVehicle.actions?.includes('doors_unlock')" @click="send({topic:'ess/jeep/vehicle-action',payload:'lock-toggle'})"><div><div class="nav-icon"><v-icon icon="mdi-car-door-lock" size="21"></v-icon></div><span><b>{{d.jeepVehicle.lockRequested?'Ontgrendelen':'Vergrendelen'}}</b><small>{{d.jeepVehicle.lockRequested==null?'Status onbekend':'Laatste opdracht'}}</small></span></div></button><button class="quick-action" v-if="d.jeepVehicle.actions?.includes('precond_on')&&d.jeepVehicle.actions?.includes('precond_off')" @click="send({topic:'ess/jeep/vehicle-action',payload:'climate-toggle'})"><div><div class="nav-icon" style="color:var(--blue);background:var(--blue-soft)"><v-icon icon="mdi-car-defrost-front" size="21"></v-icon></div><span><b>{{d.jeepVehicle.climateRequested?'Klimaat stoppen':'Klimaat starten'}}</b><small>{{d.jeepVehicle.climateRequested?'Start aangevraagd':'Gereed'}}</small></span></div></button></div><details class="ess-slot-list"><summary>Extra auto-informatie</summary><div class="vehicle-main">${metrics}<div><span>RESTERENDE LAADTIJD · AUTO</span><b>{{d.jeepVehicle.remainingMinutes??'—'}} min</b></div></div><p>{{d.jeepVehicle.serviceKm??'—'}} km / {{d.jeepVehicle.serviceDays??'—'}} dagen tot onderhoud</p><p v-if="d.jeepVehicle.tireWarningCount">Bandenspanning: {{d.jeepVehicle.tireWarningCount}} waarschuwing(en)</p><small>Autogegevens: {{d.jeepVehicle.updatedAt?new Date(d.jeepVehicle.updatedAt).toLocaleString('nl-NL'):'Onbekend'}}{{d.jeepVehicle.fresh?'':' · verouderd'}}</small><div class="quick-actions">${buttons}</div></details><small v-if="d.jeepVehicle.command">{{d.jeepVehicle.command.status}}</small></div>`;
    ui.format=ui.format.replace(manual,'');
    const originalExtra=vehicle.match(/<details class="ess-slot-list">[\s\S]*?<\/details>/)[0];
    const extra=originalExtra.replace('<details class="ess-slot-list">','<details class="ess-slot-list" v-if="d.jeepVehicle?.available">');
    const command='<small v-if="d.jeepVehicle.command">{{d.jeepVehicle.command.status}}</small>';
    const mainVehicle=vehicle.replace(originalExtra,'').replace(command,'');
    const reason="{{d.jeepSmart?.reason||d.jeepSmart?.status||'Wacht op actuele gegevens'}}</p>";
    ui.format=ui.format.replace(reason,reason+mainVehicle);
    ui.format=ui.format.replace(/(<article[^>]*aria-label="Jeep Avenger laadregeling"[\s\S]*?)(<\/article>)/,(_,body,end)=>body+extra.replace('</details>',command+'</details>')+end);
    ui.format=ui.format.replace('</style>',`.ess-refresh .ess-ev-control>.vehicle .vehicle-main>div{min-height:88px}
.ess-refresh .ess-ev-control>.vehicle .quick-action{min-height:88px}
.ess-refresh .ess-ev-control>.vehicle .quick-action small{min-height:30px}
</style>`);
};
module.exports.jeepVehicle=jeepVehicle;
module.exports.jeepSoc=jeepSoc;
