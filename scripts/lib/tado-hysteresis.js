const runtime=require('./climate-runtime');
const hysteresis=require('./tado-hysteresis-runtime');
const source=[...Object.values(runtime),...Object.values(hysteresis)].map(f=>f.toString()).join('\n');
module.exports=function buildTadoHysteresis(flows) {
    const get=id=>flows.find(n=>n.id===id);
    const base={z:'ess000000000001',x:850,y:1920};
    const fn=(id,name,func,wires,initialize='')=>({...base,id,type:'function',name,func,outputs:wires.length,timeout:0,noerr:0,initialize,finalize:'',libs:[],wires});
    const context=`const now=Date.now(),system=flow.get('ess_system_config')||{};
const states=global.get('homeassistant')?.homeAssistant?.states||{};
const config=climateValidate(flow.get('ess_climate_config')||climateDefaults());
const ledger=flow.get('ess_climate_ledger')||{};`;
    get('essclim_tick').wires[0].push('essclim_hyst_plan');
    get('essprefs_backup_write').wires[0].push('essclim_hyst_dispatch');
    flows.push(fn('essclim_hyst_plan','Tado-knop met hysterese 0,5 °C',`${source}
if(flow.get('ess_charging_preferences_ready')!==true) return null;
${context}
const decision=tadoHysteresis({config,system,states,ledger:ledger.hysteresis,now});
flow.set('ess_tado_hysteresis_status',decision.status);
flow.set('ess_climate_config',config);
flow.set('ess_climate_ledger',{...ledger,hysteresis:decision.ledger});
if(decision.actions.length) flow.set('ess_tado_hysteresis_outbox',{at:now,actions:decision.actions});
node.status({fill:decision.status.some(s=>s.fault)?'red':'blue',shape:'dot',text:decision.status.map(s=>s.target+' °C · '+s.reason).join(' / ').slice(0,120)});
return JSON.stringify(ledger.hysteresis)!==JSON.stringify(decision.ledger)||decision.actions.length?{topic:'ess/climate/persist'}:null;`,[['essprefs_save']],"flow.set('ess_tado_hysteresis_boot',Date.now());flow.set('ess_tado_hysteresis_outbox',null);"),
    fn('essclim_hyst_dispatch','Bevestig opgeslagen Tado-schakelopdracht',`${source}
if(flow.get('ess_charging_preferences_ready')!==true) return null;
${context}
const outbox=flow.get('ess_tado_hysteresis_outbox');
if(!outbox || outbox.at<Number(flow.get('ess_tado_hysteresis_boot')) || now-outbox.at>60000) return null;
let saved;try{saved=JSON.parse(msg.payload).climate;}catch{return null;}
if(!saved || JSON.stringify(saved.config)!==JSON.stringify(config)) return null;
const result=[[],[],[]];
for(const command of outbox.actions) {
 const pending=ledger.hysteresis?.[command.role]?.pending, e=states[command.entity],a=e?.attributes||{};
 if(JSON.stringify(pending)!==JSON.stringify(command) || JSON.stringify(saved.ledger?.hysteresis?.[command.role]?.pending)!==JSON.stringify(command)) continue;
 if(system.entities?.[command.role]!==command.entity || !climateFresh(e,now,600000) || a.preset_mode==='away') continue;
 if(e.state!==command.observedMode || climateNumber(a.temperature)!==command.observedTarget || climateNumber(a.current_temperature)!==command.current) continue;
 const enabled=config.tadoHysteresis && config.mode==='auto' && system.modules?.climate===true;
 if(command.release===enabled || !a.hvac_modes?.includes(command.mode)) continue;
 if(command.mode==='heat' && (climateNumber(a.min_temp)===null || climateNumber(a.max_temp)===null || command.target<Number(a.min_temp)||command.target>Number(a.max_temp))) continue;
 result[command.mode==='heat'?0:command.mode==='off'?1:2].push({payload:command});
}
// Consume once: a second backup or another controller's persistence cannot resend it.
flow.set('ess_tado_hysteresis_outbox',null);
return result.map(a=>a.length?a:null);`,[['essclim_hyst_heat'],['essclim_hyst_off'],['essclim_hyst_auto']]),
    fn('essclim_hyst_error','Blokkeer onbevestigde Tado-opdracht',`const ledger=flow.get('ess_climate_ledger')||{};
const s=ledger.hysteresis?.[msg.payload?.role];
if(s){s.fault=true;s.pending=null;flow.set('ess_climate_ledger',ledger);}
return {topic:'ess/climate/persist'};`,[['essprefs_save']]),
    {...base,id:'essclim_hyst_catch',type:'catch',name:'Tado-hysteresefout',scope:['essclim_hyst_heat','essclim_hyst_off','essclim_hyst_auto'],uncaught:false,wires:[['essclim_hyst_error']]});
    for(const mode of ['heat','off','auto']) {
        const template=get('essclim_tado'),action=mode==='heat'?'climate.set_temperature':'climate.set_hvac_mode';
        flows.push({...template,id:'essclim_hyst_'+mode,name:'Tado hysterese '+mode,action,domain:'climate',service:action.split('.')[1],
            data:`($assert(payload.entity=$lookup($flowContext('ess_system_config').entities,payload.role),'Tado-zone gewijzigd'); {"entity_id":payload.entity,"hvac_mode":"${mode}"${mode==='heat'?',"temperature":payload.target':''}})`,wires:[[]]});
    }
};
