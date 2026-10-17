function imbalanceDecision(previous, currents, enabled, now) {
    if(!currents || currents.some(v=>!Number.isFinite(v))) return {desired:null,aboveSince:0,belowSince:0,reason:'Fasemetingen ontbreken of zijn te oud'};
    const difference=Math.max(...currents)-Math.min(...currents);
    const aboveSince=difference>4?(previous.aboveSince||now):0;
    const belowSince=difference<2?(previous.belowSince||now):0;
    let desired=null;
    if(!enabled && aboveSince && now-aboveSince>=30000) desired=true;
    if(enabled && belowSince && now-belowSince>=120000 && now-(previous.enabledSince||now)>=300000) desired=false;
    return {difference,aboveSince,belowSince,desired,reason:desired===null?'Wacht op stabiel faseverschil':desired?'Faseverschil groter dan 4 A':'Faseverschil langdurig kleiner dan 2 A'};
}
module.exports=function apply(flows) {
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('essimbalance_'))flows.splice(i,1);
    const z='ess000000000001';
    flows.push({id:'essimbalance_tick',type:'inject',z,name:'WIT faseverschil elke 10 seconden',props:[{p:'payload'}],payload:'',payloadType:'date',repeat:'10',once:false,wires:[['essimbalance_registry']]});
    flows.push({id:'essimbalance_control',type:'function',z,name:'WIT Power Imbalance > 4 A',outputs:1,wires:[['essimbalance_action']],func:imbalanceDecision.toString()+`
const now=Date.now(),config=flow.get('ess_system_config')||{};
const states=global.get('homeassistant')?.homeAssistant?.states||{};
const previous=flow.get('ess_wit_imbalance_status')||{};
const fresh=e=>e && !['unknown','unavailable',''].includes(String(e.state)) && now-Date.parse(e.last_reported||e.last_updated||e.last_changed)>=0 && now-Date.parse(e.last_reported||e.last_updated||e.last_changed)<=30000;
const currents=[1,2,3].map(i=>{const role='sensor.p1_meter_vermogen_fase_'+i;
const e=states[config.entities?.[role]||role];
if(!fresh(e)||!Number.isFinite(Number(e.state)))return NaN;
const unit=String(e.attributes?.unit_of_measurement||'').toLowerCase();
return unit==='a'?Number(e.state):unit==='w'?Number(e.state)/(Number(config.specs?.voltage)||230):unit==='kw'?Number(e.state)*1000/(Number(config.specs?.voltage)||230):NaN;});
const native=msg.witImbalanceNative;
const nativeValid=native && native.binding.remoteEntity===config.entities?.['select.growatt_grid_remote_power_control_enable'] && native.binding.authorityEntity===config.entities?.['select.growatt_grid_control_authority'] && now-native.at>=0 && now-native.at<=30000 && [0,1].includes(native.value);
const bound=!!nativeValid;
const identity=nativeValid?native.binding.deviceId+':holding947':null;
const enabled=nativeValid&&native.value===1;
const enabledSince=enabled?(previous.entity===identity&&previous.enabled?previous.enabledSince||now:now):0;
const base=previous.entity===identity?{...previous,enabledSince}:{};
const decision=imbalanceDecision(base,currents,enabled,now);
const status={...decision,entity:identity||null,enabled,enabledSince,at:now,blocked:!bound,commandAt:previous.entity===identity?previous.commandAt||0:0};
status.meterIncludesEV=flow.get('ess_wit_meter_includes_ev')===true;
status.remainingImbalance=enabled&&Number.isFinite(decision.difference)&&decision.difference>4;
if(bound&&enabled)status.reason=status.meterIncludesEV?'Fasecompensatie ingeschakeld':'Fasecompensatie ingeschakeld; laadpunten buiten Growatt-meting, WIT-netladen volgt P1';
if(!bound){status.reason='Power Imbalance-bediening ontbreekt of is niet bevestigd';status.aboveSince=0;status.belowSince=0;}
flow.set('ess_wit_imbalance_status',status);
if(msg.imbalanceVerify!==undefined){status.commandConfirmed=enabled===msg.imbalanceVerify;status.reason=status.commandConfirmed?'Power Imbalance-register bevestigd':'Power Imbalance-schrijfopdracht niet bevestigd';flow.set('ess_wit_imbalance_status',status);return null;}
if(!bound||decision.desired===null||config.modules?.inverter===false)return null;
if(previous.entity===identity&&previous.commandAt&&now-previous.commandAt<60000)return null;
status.commandAt=now;flow.set('ess_wit_imbalance_status',status);
if(nativeValid){msg.imbalanceVerify=decision.desired;msg.payload={data:{type:'call_service',domain:'growatt_modbus',service:'write_register',service_data:{device_id:native.binding.deviceId,register:947,value:decision.desired?1:0}}};return msg;}
return null;`});
    const api=(id,name,data,next)=>({id,type:'ha-api',z,name,server:'ess00000000000b',version:1,protocol:'websocket',method:'get',path:'',data,dataType:'json',responseType:'json',outputProperties:[{property:'imbalanceReply',propertyType:'msg',value:'',valueType:'results'}],wires:[[next]]});
    const fn=(id,name,func,next)=>({id,type:'function',z,name,func,outputs:1,wires:[[next]]});
    flows.push(api('essimbalance_registry','Zoek gekoppelde Growatt WIT','{"type":"config/entity_registry/list"}','essimbalance_prepare'));
    flows.push(fn('essimbalance_prepare','Bind register 947 aan eigen WIT',`const config=flow.get('ess_system_config')||{};
const entries=msg.imbalanceReply?.result||msg.imbalanceReply;
const remoteEntity=config.entities?.['select.growatt_grid_remote_power_control_enable'],authorityEntity=config.entities?.['select.growatt_grid_control_authority'];
const remote=Array.isArray(entries)?entries.find(e=>e.entity_id===remoteEntity&&e.platform==='growatt_modbus'):null;
const authority=Array.isArray(entries)?entries.find(e=>e.entity_id===authorityEntity&&e.platform==='growatt_modbus'):null;
if(!remote?.device_id||!authority||remote.device_id!==authority.device_id||remote.config_entry_id!==authority.config_entry_id){flow.set('ess_wit_imbalance_status',{at:Date.now(),blocked:true,reason:'WIT-devicebinding niet bevestigd'});return null;}
msg.imbalanceBinding={deviceId:remote.device_id,remoteEntity,authorityEntity};return msg;`,'essimbalance_read_request'));
    flows.push(fn('essimbalance_read_request','Vraag actuele Power Imbalance',`msg.payload={data:{type:'call_service',domain:'growatt_modbus',service:'get_register_data',service_data:{device_id:msg.imbalanceBinding.deviceId,register_type:'holding',start_address:947,count:1},return_response:true}};return msg;`,'essimbalance_read'));
    flows.push(api('essimbalance_read','Lees Power Imbalance holding 947','','essimbalance_result'));
    flows.push(fn('essimbalance_result','Valideer echte registerterugmelding',`const r=msg.imbalanceReply?.response||msg.imbalanceReply;
if(r?.success!==true||!Array.isArray(r.values)||r.values.length!==1||![0,1].includes(r.values[0])){flow.set('ess_wit_imbalance_status',{at:Date.now(),blocked:true,reason:'Register 947 niet geldig uitgelezen'});return null;}
msg.witImbalanceNative={at:Date.now(),binding:msg.imbalanceBinding,value:r.values[0]};return msg;`,'essimbalance_control'));
    flows.push(api('essimbalance_action','Schrijf alleen Power Imbalance register 947','','essimbalance_read_request'));
};
module.exports.imbalanceDecision=imbalanceDecision;
