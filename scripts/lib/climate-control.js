const runtime=require('./climate-runtime');
const source=Object.values(runtime).map(f=>f.toString()).join('\n');

module.exports=function buildClimateControl(flows) {
    for(let i=flows.length-1;i>=0;i--) if(flows[i].id.startsWith('essclim_')) flows.splice(i,1);
    const get=id=>flows.find(n=>n.id===id), base={z:'ess000000000001',x:600,y:1920};
    const fn=(id,name,func,wires,initialize='')=>({...base,id,type:'function',name,func,outputs:wires.length,timeout:0,noerr:0,initialize,finalize:'',libs:[],wires});
    const context=`const now=Date.now();
const system=flow.get('ess_system_config')||{};
const states=global.get('homeassistant')?.homeAssistant?.states||{};
const config=climateValidate(flow.get('ess_climate_config')||climateDefaults());
const grid=flow.get('ess_wit_grid_charge_status')||{}, ev=flow.get('ess_wit_audi_discharge_status')||{};
const priceAge=now-new Date((flow.get('ess_nordpool_forecast_meta')||{}).updatedAt||0).getTime();
const prices=priceAge>=0&&priceAge<=36*3600000?flow.get('ess_nordpool_forecast')||[]:[];
const input={config,system,states,prices,weather:flow.get('ess_climate_weather'),now,
energy:{solarStable:now-Number(flow.get('ess_climate_solar_since')||now)>=300000,gridChargeOwned:!!grid.sessionOwned,houseReserveKwh:Math.max(Number(grid.expectedHouseKwh)||0,Number(ev.houseReserveKwh)||0),evReservedKwh:ev.sessionOwned?Number(ev.safeDischargeBudgetKwh)||0:0}};`;
    flows.push(
        {...base,id:'essclim_tick',type:'inject',name:'Bewaak klimaat en tapwater',props:[{p:'payload'}],payload:'',payloadType:'date',repeat:'60',once:true,onceDelay:80,crontab:'',wires:[['essclim_plan']]},
        fn('essclim_plan','Plan woonkamer badkamer en tapwater',`${source}
if(flow.get('ess_charging_preferences_ready')!==true) return null;
${context}
const plan=climatePlan(input);
const p1=states[system.entities?.['sensor.p1_meter_vermogen']], battery=states[system.entities?.['sensor.growatt_battery_battery_power']];
const watts=item=>{const unit=String(item?.attributes?.unit_of_measurement||'').toLowerCase(),n=climateNumber(item?.state);return n!==null&&['w','kw'].includes(unit)?n*(unit==='kw'?1000:1):null;};
const solarNow=climateFresh(p1,now,15000)&&watts(p1)!==null&&-watts(p1)>=config.maximumPowerW&&config.maximumPowerW>0&&climateFresh(battery,now,120000)&&watts(battery)!==null&&Math.abs(watts(battery))<=200;
if(!solarNow) flow.set('ess_climate_solar_since',null);
else if(!flow.get('ess_climate_solar_since')) flow.set('ess_climate_solar_since',now);
const ledger=flow.get('ess_climate_ledger')||{};
const decision=climateDecide(plan,ledger,config,now);
for(const z of plan.zones) { const lease=decision.ledger[z.key];z.confirmed=!!lease?.lastConfirmed&&!!lease.owned&&!lease.pending&&z.feedbackFresh&&Math.abs(z.observedTarget-lease.target)<0.2; z.fault=!!lease?.fault; z.manualUntil=lease?.manualUntil||0; }
plan.measuredPowerW=plan.signals.measuredPowerW;
plan.reservationKwh=Math.max(plan.reservationKwh,...Object.values(decision.ledger).map(s=>s.owned&&s.until>now?config.maximumPowerW/1000*(s.until-now)/3600000:0));
flow.set('ess_climate_status',plan);
flow.set('ess_climate_reservation',{at:now,kwh:plan.reservationKwh,powerW:decision.actions.some(a=>!a.restore)?config.maximumPowerW:0});
flow.set('ess_climate_ledger',decision.ledger);
if(decision.actions.length) flow.set('ess_climate_outbox',{at:now,actions:decision.actions});
node.status({fill:decision.actions.length?'green':'blue',shape:'dot',text:plan.mode+' · '+plan.zones.map(z=>z.reason).join(' / ').slice(0,110)});
// Persist intent before any write. Empty ticks only persist ledger changes.
return [JSON.stringify(ledger)!==JSON.stringify(decision.ledger)||decision.actions.length?{topic:'ess/climate/persist'}:null,
{payload:{path:'states/sensor.ess_climate_control',data:{state:plan.mode,attributes:{friendly_name:'ESS Klimaatregeling',updated_at:new Date(now).toISOString(),reservation_kwh:plan.reservationKwh,measured_power_w:plan.measuredPowerW,zones:plan.zones.map(z=>({zone:z.key,temperature:z.current,target:z.target,reason:z.reason,confirmed:z.confirmed,fault:z.fault})),signals:plan.signals}}}}];`,[['essprefs_save'],['esswithist_api001']],"flow.set('ess_climate_boot_at',Date.now()); flow.set('ess_climate_outbox',null);"),
        fn('essclim_settings','Bewaar klimaatvoorkeuren',`${source}
if(flow.get('ess_charging_preferences_ready')!==true) return null;
if(msg.topic==='ess/climate/automation-save') {
    try {
        const config=climateValidate(msg.payload);
        flow.set('ess_climate_config',config);
        flow.set('ess_climate_config_error',null);
    } catch(error) {flow.set('ess_climate_config_error',error.message);node.warn(error.message);return null;}
} else if(msg.topic==='ess/climate/acknowledge' && ['room1','room2','water'].includes(msg.payload)) {
    const ledger=flow.get('ess_climate_ledger')||{};
    // Do not lose an owned water baseline when acknowledging a fault.
    if(ledger[msg.payload]) {ledger[msg.payload].fault=false;ledger[msg.payload].pending=null;ledger[msg.payload].manualUntil=Date.now()+60000;}
    flow.set('ess_climate_ledger',ledger);
} else return null;
return {topic:'ess/climate/persist'};`,[['essprefs_save']]),
        fn('essclim_dispatch','Controleer opgeslagen klimaatopdracht',`${source}
if(flow.get('ess_charging_preferences_ready')!==true) return null;
${context}
const outbox=flow.get('ess_climate_outbox');
if(!outbox || outbox.at<Number(flow.get('ess_climate_boot_at')) || now-outbox.at>60000) return null;
let saved;try {saved=JSON.parse(msg.payload).climate;} catch {return null;}
if(!saved || JSON.stringify(saved.config)!==JSON.stringify(config)) return null;
const plan=climatePlan(input), results=[[],[]];
for(const command of outbox.actions) {
    const z=plan.zones.find(z=>z.key===command.key), lease=flow.get('ess_climate_ledger')?.[command.key];
    if(!lease || JSON.stringify(saved.ledger?.[command.key])!==JSON.stringify(lease)) continue;
    if(!z || command.entity!==z.entity || !z.feedbackFresh) continue;
    if(!command.restore && (!plan.allowed || !plan.signals.netReady || z.target!==command.target)) continue;
    if(command.restore && (command.key!=='water'||!z.hygieneClear||!['eco','heat_pump'].includes(z.mode)||command.target!==lease.baseline||z.observedTarget!==command.expectedBefore||z.observedTarget>config.water.buffer||z.observedTarget<command.target)) continue;
    if(!command.restore && (z.observedTarget!==lease.baseline || (command.type==='room'&&z.mode!=='auto'))) continue;
    const item=states[command.entity];
    if(climateNumber(item.attributes.min_temp)===null||climateNumber(item.attributes.max_temp)===null||command.target<Number(item.attributes.min_temp)||command.target>Number(item.attributes.max_temp)) continue;
    results[command.type==='water'?1:0].push({payload:{entity:command.entity,target:command.target,key:command.key}});
}
flow.set('ess_climate_outbox',null);
return results.map(a=>a.length?a:null);`,[['essclim_tado'],['essclim_water']]),
        fn('essclim_error','Meld mislukte klimaatopdracht',`const ledger=flow.get('ess_climate_ledger')||{};
const key=msg.payload?.key;
if(key&&ledger[key]) ledger[key].fault=true;
flow.set('ess_climate_ledger',ledger);
flow.set('ess_climate_config_error','Klimaatopdracht mislukt; controleer verbinding en doelterugmelding');
return {topic:'ess/climate/persist'};`,[['essprefs_save']]),
        {...base,id:'essclim_catch',type:'catch',name:'Vang klimaatbedienfout op',scope:['essclim_tado','essclim_water'],uncaught:false,wires:[['essclim_error']]}
    );
    for(const [id,action,data] of [['essclim_tado','tado.set_climate_timer','"temperature":payload.target,"time_period":"00:30:00"'],['essclim_water','water_heater.set_temperature','"temperature":payload.target']]) {
        const allowed=id==='essclim_water'?"[$lookup($flowContext('ess_system_config').entities,'water_heater.domestic_hot_water')]":"$map($flowContext('ess_climate_config').rooms,function($r){$lookup($flowContext('ess_system_config').entities,$r.role)})";
        flows.push({...base,id,type:'api-call-service',name:action,server:'ess00000000000b',version:7,debugenabled:false,action,
            floorId:[],areaId:[],deviceId:[],entityId:[],labelId:[],dataType:'jsonata',data:`($assert(payload.entity in ${allowed},'Klimaatdoel niet toegestaan'); {"entity_id":payload.entity,${data}})`,
            mergeContext:'',mustacheAltTags:false,outputProperties:[],queue:'none',blockInputOverrides:true,domain:action.split('.')[0],service:action.split('.')[1],wires:[[]]});
    }
    // Forecast retrieval is read-only and cached, with no new polling of Tado.
    flows.push({...base,id:'essclim_weather_tick',type:'inject',name:'Lees uurverwachting',props:[{p:'payload'}],payload:'',payloadType:'date',repeat:'3600',once:true,onceDelay:90,crontab:'',wires:[['essclim_weather_request']]},
        fn('essclim_weather_request','Vraag gekoppelde uurverwachting',`const entity=flow.get('ess_system_config')?.entities?.['weather.home'];
if(!/^weather\\.[a-z0-9_]+$/.test(entity||'')) return null;
return {payload:{data:{type:'call_service',domain:'weather',service:'get_forecasts',target:{entity_id:entity},service_data:{type:'hourly'},return_response:true}}};`,[['essclim_weather_api']]),
        {...base,id:'essclim_weather_api',type:'ha-api',name:'Lees HA-uurverwachting',server:'ess00000000000b',version:1,debugenabled:false,protocol:'websocket',method:'get',path:'',data:'',dataType:'json',responseType:'json',outputProperties:[{property:'forecast',propertyType:'msg',value:'',valueType:'results'}],wires:[['essclim_weather_parse']]},
        fn('essclim_weather_parse','Bewaar gevalideerde uurverwachting',`const entity=flow.get('ess_system_config')?.entities?.['weather.home'];
const result=msg.forecast?.response||msg.forecast;
const unit=global.get('homeassistant')?.homeAssistant?.states?.[entity]?.attributes?.temperature_unit;
if(unit!=='°C') return null;
const hours=(result?.[entity]?.forecast||[]).map(h=>({at:new Date(h.datetime).getTime(),temperature:h.temperature})).filter(h=>Number.isFinite(h.at)&&typeof h.temperature==='number'&&h.temperature>=-50&&h.temperature<=60);
if(hours.length) flow.set('ess_climate_weather',{at:Date.now(),hours});
return null;`,[]));

    // Extend the existing private, ordered primary+backup persistence pipeline.
    const restore=get('essprefs_restore');
    restore.func=source+'\n'+restore.func;
    restore.func=restore.func.replace("const candidate =", "if(saved.climate) { climateValidate(saved.climate.config); if(!saved.climate.ledger||typeof saved.climate.ledger!=='object'||Array.isArray(saved.climate.ledger)) throw new Error('Ongeldig klimaatlogboek'); }\n    const candidate =");
    restore.func=restore.func.replace('for (const [key,value] of Object.entries(candidate)) flow.set(key,value);', `for (const [key,value] of Object.entries(candidate)) flow.set(key,value);
    if(saved.climate) {flow.set('ess_climate_config',climateValidate(saved.climate.config));flow.set('ess_climate_ledger',saved.climate.ledger);}`);
    get('essprefs_backup_write').wires[0].push('essclim_dispatch');
    // Reserving only incremental boost demand avoids double counting base heat.
    for(const id of ['esswitgrid_ctrl1','esswitaudi_ctrl1']) {
        const n=get(id),marker="// BEGIN CLIMATE RESERVE\n";
        n.func=n.func.replace(/\/\/ BEGIN CLIMATE RESERVE[\s\S]*?\/\/ END CLIMATE RESERVE\n/g,'');
        const code=`${marker}const climateReservation=flow.get('ess_climate_reservation');
const climateExtraReserve=climateReservation && now-climateReservation.at>=0 && now-climateReservation.at<150000 ? Math.max(0,Number(climateReservation.kwh)||0) : 0;
// END CLIMATE RESERVE
`;
        const pos=n.func.indexOf('const reserveProfiles =');
        n.func=n.func.slice(0,pos)+code+n.func.slice(pos);
        n.func=n.func.replace('witHouseReserve(flow.get(\'ess_house_consumption_learning\'), reserveProfile.houseReserveKwh);',"witHouseReserve(flow.get('ess_house_consumption_learning'), reserveProfile.houseReserveKwh) + climateExtraReserve;")
            .replace("houseReserveKwh:witHouseReserve(flow.get('ess_house_consumption_learning'), reserveProfiles[reserveMode].houseReserveKwh)","houseReserveKwh:witHouseReserve(flow.get('ess_house_consumption_learning'), reserveProfiles[reserveMode].houseReserveKwh) + climateExtraReserve");
    }
    const mapper=get('ess00000000000a');
    mapper.func=mapper.func.replace(/\/\/ BEGIN CLIMATE AUTOMATION[\s\S]*?\/\/ END CLIMATE AUTOMATION\n/g,'');
    mapper.func=mapper.func.replace("flow.set('ess_dashboard_live', dashboard);",`// BEGIN CLIMATE AUTOMATION
dashboard.climate.automation=flow.get('ess_climate_status')||{zones:[]};
dashboard.climate.preferences=flow.get('ess_climate_config')||${JSON.stringify(runtime.climateDefaults())};
dashboard.climate.configurationError=flow.get('ess_climate_config_error')||null;
if(dashboard.climate.configurationError) dashboard.alarms.push({level:'warning',text:dashboard.climate.configurationError});
if(dashboard.climate.automation.signals?.meterOverLimit) dashboard.alarms.push({level:'warning',text:'Warmtepomp boven ingestelde elektrische regelgrens; extra voorverwarmen geblokkeerd'});
const configuredOutside=(flow.get('ess_system_config')||{}).entities?.['sensor.outdoor_temperature'];
dashboard.climate.outside.source=states[configuredOutside]?.attributes?.friendly_name||'Gekoppelde buitenbron';
// END CLIMATE AUTOMATION
flow.set('ess_dashboard_live', dashboard);`);
    const ui=get('esstpl_climate01');
    ui.wires[0].push('essclim_settings');
    ui.format=ui.format.replace('data(){return {','data(){return {climateDraft:null,');
    ui.format=ui.format.replace('methods:{',`methods:{
    editClimate(){this.climateDraft=JSON.parse(JSON.stringify(this.d.climate?.preferences||${JSON.stringify(runtime.climateDefaults())}))},
    saveClimate(){this.send({topic:'ess/climate/automation-save',payload:this.climateDraft});this.climateDraft=null},
`);
    const panel=`<article class="panel span-12"><div class="panel-head"><b>Slim klimaat · woonkamer, badkamer en warm water</b><button class="touch-button" @click="editClimate()">Instellen</button></div>
<p>Regelstand: {{d.climate&&d.climate.automation&&d.climate.automation.mode||'Wacht op instellingen'}} · Tado regelt de kamers, EHS levert warmte.</p>
<p class="subtle">De elektrische grens is een softwarematige startvoorwaarde, geen fysieke vermogensbegrenzer. De gekoppelde warmtepompmeter en alle P1-fasen moeten actueel zijn.</p>
<p class="subtle">Bij uitschakelen worden geen nieuwe Tado-opdrachten gegeven; een lopende timer mag nog maximaal 30 minuten aflopen. Terugzetten van tapwater vereist verbinding en een veilige hygiënestatus.</p>
<p v-if="d.climate&&d.climate.automation&&d.climate.automation.signals" class="subtle">Warmtepomp gemeten: {{power(d.climate.automation.measuredPowerW)}} · {{d.climate.automation.signals.netReady?'Netruimte beschikbaar':'Geen extra warmtevraag: meter of netruimte controleren'}} · Extra accureserve: {{Number(d.climate.automation.reservationKwh||0).toFixed(1)}} kWh</p>
<p v-if="d.climate&&d.climate.configurationError">{{d.climate.configurationError}}</p>
<div class="plan-grid"><div class="plan-card" v-for="z in (d.climate&&d.climate.automation&&d.climate.automation.zones||[])" :key="z.key"><span>{{z.label}}</span><b>{{temperature(z.current)}} → {{temperature(z.target===null?z.observedTarget:z.target)}}</b><small>{{z.reason}}</small><small>{{z.confirmed?'Doel teruggemeld':'Geen bevestigde ESS-opdracht'}}</small><button v-if="z.fault" class="touch-button" @click="send({topic:'ess/climate/acknowledge',payload:z.key})">Opnieuw vrijgeven</button></div></div>
<div v-if="climateDraft"><div class="config-grid">
<label class="config-field"><span>REGELSTAND</span><select v-model="climateDraft.mode"><option value="auto">Automatisch · echt schakelen</option><option value="advice">Alleen advies</option><option value="off">Eigen apparaatregeling</option></select></label>
<label class="config-field"><span>PROFIEL</span><select v-model="climateDraft.profile"><option value="eco">Eco</option><option value="normal">Normaal</option><option value="comfort">Comfort</option></select></label>
<label class="config-field"><span>MAXIMALE ELEKTRISCHE OPNAME EHS (W, NIET WARMTEVERMOGEN)</span><input type="number" v-model.number="climateDraft.maximumPowerW"></label>
<label class="config-field"><span>MINIMAAL PRIJSVOORDEEL (€/kWh)</span><input type="number" min="0" step="0.01" v-model.number="climateDraft.minimumBenefit"></label>
<label class="config-field"><span>WONINGRESERVE (kWh)</span><input type="number" min="0" step="0.5" v-model.number="climateDraft.houseReserveKwh"></label>
<label class="config-field"><span>MINIMAAL ACCU-SOC VOOR EXTRA WARMTE (%)</span><input type="number" min="10" max="100" v-model.number="climateDraft.batteryFloorSoc"></label>
<label class="config-field" v-for="(weight,i) in climateDraft.phaseWeights" :key="i"><span>VERMOGENSAANDEEL FASE {{i+1}} (0–1)</span><input type="number" min="0" max="1" step="0.01" v-model.number="climateDraft.phaseWeights[i]"></label>
</div><div v-for="z in climateDraft.rooms" :key="z.key"><h3>{{z.label}}</h3><label><input type="checkbox" v-model="z.enabled">Automatisch regelen</label><div class="config-grid">
<label class="config-field"><span>TADO-ROL</span><select v-model="z.role"><option value="">Kies juiste zone</option><option v-for="zone in d.climate.tado" :key="zone.entityId" :value="zone.entityId">{{zone.name}}</option></select></label>
<label class="config-field"><span>TIJDEN</span><select v-model="z.schedule"><option value="native">Bestaand Tado-schema volgen</option><option value="custom">Eigen comforttijden</option></select></label>
<label class="config-field" v-for="field in ['minimum','comfort','maximum']" :key="field"><span>{{({minimum:'Minimum',comfort:'Normaal',maximum:'Maximum'})[field]}} °C</span><input type="number" min="5" max="25" step="0.5" v-model.number="z[field]"></label>
<label v-if="z.schedule==='custom'" class="config-field"><span>VAN</span><input type="time" v-model="z.start"></label><label v-if="z.schedule==='custom'" class="config-field"><span>TOT</span><input type="time" v-model="z.end"></label>
</div></div><h3>Warm water</h3><label><input type="checkbox" v-model="climateDraft.water.enabled">Automatisch plannen</label><div class="config-grid">
<label class="config-field" v-for="field in ['minimum','normal','buffer','litres','lossKwhPerDay','boostMinutes']" :key="field"><span>{{({minimum:'Ondergrens (°C)',normal:'Normaal doel (°C)',buffer:'Bufferdoel (°C)',litres:'Vatinhoud (liter)',lossKwhPerDay:'Geschat stilstandsverlies (kWh/dag)',boostMinutes:'Bufferperiode (minuten)'})[field]}}</span><input type="number" step="0.5" v-model.number="climateDraft.water[field]"></label></div>
<p>Automatisch tapwater vereist een betrouwbaar gekoppeld signaal “hygiënecyclus actief”. Zonder dat signaal blijft de eigen EHS-tapwaterregeling actief; zet geen fictief signaal vast op uit.</p>
<p><label><input type="checkbox" v-model="climateDraft.water.restoreAcknowledged">Bevestigd: gekozen temperatuurgrenzen zijn geschikt; bij HA/cloud-uitval kan het bufferdoel blijven staan tot de verbinding terug is. Bestaande hygiënecyclus blijft leidend.</label></p>
<button class="touch-button" @click="saveClimate()">Opslaan en toepassen</button><button class="touch-button" @click="climateDraft=null">Annuleren</button></div></article>`;
    ui.format=ui.format.replace('<section class="panel-grid">','<section class="panel-grid">'+panel);
    // Keep the new nodes readable in the editor, outside the existing groups.
    flows.filter(n=>n.id.startsWith('essclim_')).forEach((n,i)=>{n.x=200+(i%4)*320;n.y=1900+Math.floor(i/4)*100;});
};
