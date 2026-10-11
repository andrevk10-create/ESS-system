const runtime=require('./climate-runtime');
const hysteresis=require('./tado-hysteresis-runtime');
const source=[...Object.values(runtime),...Object.values(hysteresis)].map(f=>f.toString()).join('\n');
module.exports=function buildTadoHysteresis(flows) {
    const get=id=>flows.find(n=>n.id===id),base={z:'ess000000000001',x:850,y:1920};
    const fn=(id,name,func,wires,initialize='')=>({...base,id,type:'function',name,func,outputs:wires.length,timeout:0,noerr:0,initialize,finalize:'',libs:[],wires});
    const context=`const now=Date.now(),system={...(flow.get('ess_system_config')||{}),climateRegistry:flow.get('ess_climate_registry')?.entities||{}};
const states=global.get('homeassistant')?.homeAssistant?.states||{};
const config=climateValidate(flow.get('ess_climate_config')||climateDefaults());
const ledger=flow.get('ess_climate_ledger')||{};`;
    get('essclim_tick').wires[0].push('essclim_hyst_plan');
    get('essprefs_backup_write').wires[0].push('essclim_hyst_dispatch');
    flows.push(fn('essclim_hyst_plan','Gezamenlijke warmtevraag uit fysieke thermostaten',`${source}
if(flow.get('ess_charging_preferences_ready')!==true) return null;
${context}
const decision=tadoHysteresis({config,system,states,ledger:ledger.hysteresis,now});
flow.set('ess_tado_hysteresis_status',decision.status);
flow.set('ess_heat_source_status',decision.sourceStatus);
flow.set('ess_climate_config',config);
flow.set('ess_climate_ledger',{...ledger,hysteresis:decision.ledger});
if(decision.actions.length) flow.set('ess_tado_hysteresis_outbox',{at:now,actions:decision.actions});
node.status({fill:decision.sourceStatus.fault?'red':'blue',shape:'dot',text:decision.sourceStatus.reason});
return [JSON.stringify(ledger.hysteresis)!==JSON.stringify(decision.ledger)||decision.actions.length?{topic:'ess/climate/persist'}:null,
 {payload:{path:'states/sensor.ess_heat_request',data:{state:decision.sourceStatus.requested?'heating':'idle',attributes:{friendly_name:'ESS gezamenlijke warmtevraag',updated_at:new Date(now).toISOString(),...decision.sourceStatus,rooms:decision.status}}}}];`,[['essprefs_save'],['esswithist_api001']],"flow.set('ess_tado_hysteresis_boot',Date.now());flow.set('ess_tado_hysteresis_outbox',null);"),
    fn('essclim_hyst_dispatch','Controleer opgeslagen aparte warmteopdracht',`${source}
if(flow.get('ess_charging_preferences_ready')!==true) return null;
${context}
const outbox=flow.get('ess_tado_hysteresis_outbox');
if(!outbox||outbox.at<Number(flow.get('ess_tado_hysteresis_boot'))||now-outbox.at<0||now-outbox.at>60000) return null;
let saved;try{saved=JSON.parse(msg.payload).climate;}catch{return null;}
if(!saved||JSON.stringify(saved.config)!==JSON.stringify(config)) return null;
const result=[[],[],[],[]];
for(const command of outbox.actions) {
 const persisted=saved.ledger?.hysteresis?.source?.pending;
 if(JSON.stringify(persisted)!==JSON.stringify(command)) continue;
 if(!tadoCommandAllowed({command,config,system,states,ledger:ledger.hysteresis,now})) continue;
 const index=command.adapter==='switch'?(command.on?2:3):(command.on?0:1);
 result[index].push({payload:{...command,duration:'00:'+String(command.leaseMinutes).padStart(2,'0')+':00'}});
}
flow.set('ess_tado_hysteresis_outbox',null);
return result.map(a=>a.length?a:null);`,[['essclim_hyst_heat'],['essclim_hyst_off'],['essclim_hyst_switch_on'],['essclim_hyst_switch_off']]),
    fn('essclim_hyst_accepted','Bewaar geaccepteerde warmteopdracht',`const ledger=flow.get('ess_climate_ledger')||{},s=ledger.hysteresis?.source;
if(s?.pending?.at!==msg.payload?.at||s.pending.entity!==msg.payload.entity) return null;
s.serviceAcceptedAt=msg.payload.at;flow.set('ess_climate_ledger',ledger);
return {topic:'ess/climate/persist'};`,[['essprefs_save']]),
    fn('essclim_hyst_error','Meld fout aparte verwarmingsbediening',`const ledger=flow.get('ess_climate_ledger')||{};
const s=ledger.hysteresis?.source;
if(s&&s.pending?.entity===msg.payload?.entity){s.fault=true;s.stopFailed=msg.payload.on===false;s.pending=null;flow.set('ess_climate_ledger',ledger);}
return {topic:'ess/climate/persist'};`,[['essprefs_save']]),
    {...base,id:'essclim_hyst_catch',type:'catch',name:'Fout aparte verwarmingsbediening',scope:['essclim_hyst_heat','essclim_hyst_off','essclim_hyst_switch_on','essclim_hyst_switch_off'],uncaught:false,wires:[['essclim_hyst_error']]});
    const services=[['heat','tado.set_climate_timer','tado-zone','"temperature":payload.target,"time_period":payload.duration'],
        ['off','climate.set_hvac_mode','tado-zone','"hvac_mode":"off"'],
        ['switch_on','switch.turn_on','switch',''],['switch_off','switch.turn_off','switch','']];
    for(const [suffix,action,adapter,data] of services) {
        const guard=`$assert(payload.entity=$flowContext('ess_climate_config').heatSource.entity and $flowContext('ess_climate_config').heatSource.adapter='${adapter}','Verwarmingsbediening gewijzigd')`;
        flows.push({...get('essclim_tado'),id:'essclim_hyst_'+suffix,name:'Aparte warmtevraag '+suffix,action,domain:action.split('.')[0],service:action.split('.')[1],
            data:`(${guard}; {"entity_id":payload.entity${data?','+data:''}})`,wires:[['essclim_hyst_accepted']]});
    }
    // Reconfiguration may not orphan an active timer/contact or change its lease.
    const settings=get('essclim_settings');
    settings.func=settings.func.replace("flow.set('ess_climate_config',config);",`const owned=flow.get('ess_climate_ledger')?.hysteresis?.source;
        const previous=climateValidate(flow.get('ess_climate_config')||climateDefaults());
        const identity=h=>JSON.stringify([h.adapter,h.entity,h.heatTarget,h.leaseMinutes]);
        if((owned?.owned||owned?.pending)&&identity(config.heatSource)!==identity(previous.heatSource)) throw new Error('Zet de aparte verwarmingsbediening eerst uit en wacht op bevestiging voordat je de koppeling wijzigt');
        flow.set('ess_climate_config',config);`);
    settings.func=settings.func.replace("} else return null;",`} else if(msg.topic==='ess/climate/heat-source-acknowledge') {
    const ledger=flow.get('ess_climate_ledger')||{},s=ledger.hysteresis?.source;
    const config=climateValidate(flow.get('ess_climate_config')||climateDefaults());
    const e=global.get('homeassistant')?.homeAssistant?.states?.[config.heatSource.entity];
    if(!s||s.pending||s.owned||!climateFresh(e,Date.now(),config.heatSource.adapter==='switch'?12*60000:600000)||
        !(e.state==='off'||config.heatSource.adapter==='tado-zone'&&e.state==='auto'&&e.attributes?.hvac_action==='off')) return null;
    s.fault=false;s.stopFailed=false;s.lastSwitch=Date.now();flow.set('ess_climate_ledger',ledger);
} else return null;`);
};
