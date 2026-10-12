function imbalanceDecision(previous, currents, enabled, now) {
    if(!currents || currents.some(v=>!Number.isFinite(v))) return {desired:null,aboveSince:0,belowSince:0,reason:'Fasemetingen ontbreken of zijn te oud'};
    const difference=Math.max(...currents)-Math.min(...currents);
    const aboveSince=difference>2?(previous.aboveSince||now):0;
    const belowSince=difference<1?(previous.belowSince||now):0;
    let desired=null;
    if(!enabled && aboveSince && now-aboveSince>=30000) desired=true;
    if(enabled && belowSince && now-belowSince>=120000 && now-(previous.enabledSince||now)>=300000) desired=false;
    return {difference,aboveSince,belowSince,desired,reason:desired===null?'Wacht op stabiel faseverschil':desired?'Faseverschil groter dan 2 A':'Faseverschil langdurig kleiner dan 1 A'};
}
module.exports=function apply(flows) {
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('essimbalance_'))flows.splice(i,1);
    const z='ess000000000001';
    flows.push({id:'essimbalance_tick',type:'inject',z,name:'WIT faseverschil elke 10 seconden',props:[{p:'payload'}],payload:'',payloadType:'date',repeat:'10',once:false,wires:[['essimbalance_control']]});
    flows.push({id:'essimbalance_control',type:'function',z,name:'WIT Power Imbalance > 2 A',outputs:1,wires:[['essimbalance_action']],func:imbalanceDecision.toString()+`
const now=Date.now(),config=flow.get('ess_system_config')||{};
const states=global.get('homeassistant')?.homeAssistant?.states||{};
const previous=flow.get('ess_wit_imbalance_status')||{};
const fresh=e=>e && !['unknown','unavailable',''].includes(String(e.state)) && now-Date.parse(e.last_reported||e.last_updated||e.last_changed)>=0 && now-Date.parse(e.last_reported||e.last_updated||e.last_changed)<=30000;
const currents=[1,2,3].map(i=>{const role='sensor.p1_meter_vermogen_fase_'+i;
const e=states[config.entities?.[role]||role];
if(!fresh(e)||!Number.isFinite(Number(e.state)))return NaN;
const unit=String(e.attributes?.unit_of_measurement||'').toLowerCase();
return unit==='a'?Number(e.state):unit==='w'?Number(e.state)/(Number(config.specs?.voltage)||230):unit==='kw'?Number(e.state)*1000/(Number(config.specs?.voltage)||230):NaN;});
const binding=config.entities?.['select.growatt_power_imbalance_enable'];
const entity=binding && states[binding];
const options=entity?.attributes?.options||[];
const on=options.find(v=>['enable','enabled','on'].includes(String(v).toLowerCase()));
const off=options.find(v=>['disable','disabled','off'].includes(String(v).toLowerCase()));
const bound=typeof binding==='string'&&/^select\\.[a-z0-9_]+$/.test(binding)&&fresh(entity)&&on!==undefined&&off!==undefined&&[on,off].includes(entity.state);
const enabled=bound&&entity.state===on;
const enabledSince=enabled?(previous.entity===binding&&previous.enabled?previous.enabledSince||now:now):0;
const base=previous.entity===binding?{...previous,enabledSince}:{};
const decision=imbalanceDecision(base,currents,enabled,now);
const status={...decision,entity:binding||null,enabled,enabledSince,at:now,blocked:!bound,commandAt:previous.entity===binding?previous.commandAt||0:0};
if(!bound){status.reason='Power Imbalance-bediening ontbreekt of is niet bevestigd';status.aboveSince=0;status.belowSince=0;}
flow.set('ess_wit_imbalance_status',status);
if(!bound||decision.desired===null||config.modules?.inverter===false)return null;
if(previous.entity===binding&&previous.commandAt&&now-previous.commandAt<60000)return null;
status.commandAt=now;flow.set('ess_wit_imbalance_status',status);
return {payload:{target:{entity_id:[binding]},data:{entity_id:binding,option:decision.desired?on:off}}};`});
    flows.push({id:'essimbalance_action',type:'api-call-service',z,name:'Stel bevestigde WIT-onbalansoptie in',server:'ess00000000000b',version:7,action:'select.select_option',domain:'select',service:'select_option',entityId:[],floorId:[],areaId:[],deviceId:[],labelId:[],data:'{}',dataType:'json',mergeContext:'',blockInputOverrides:false,queue:'none',outputProperties:[],wires:[[]]});
};
module.exports.imbalanceDecision=imbalanceDecision;
