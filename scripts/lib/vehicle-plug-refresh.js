function vehiclePlugEdge(previous,status,anchor,now){
 const connected=['awaiting_start','awaiting_authorization','ready_to_charge','charging','completed'].includes(status);
 const disconnected=['disconnected','not_connected','unplugged'].includes(status);
 let p=previous?.anchor===anchor?{...previous}:{anchor,connected:false};
 if(disconnected)return {state:{...p,connected:false},request:false};
 if(!connected||!anchor)return {state:p,request:false};
 const request=!p.connected;
 return {state:{...p,connected:true,...(request?{at:now,status:'Accustand opvragen'}:{})},request};
}
module.exports=function apply(flows){
 for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('essevrefresh_'))flows.splice(i,1);
 const mapper=flows.find(n=>n.id==='ess00000000000a');
 mapper.func=mapper.func.replace(/\/\/ BEGIN PLUG REFRESH[\s\S]*?\/\/ END PLUG REFRESH\n/g,'');
 mapper.func=mapper.func.replace("flow.set('ess_dashboard_live', dashboard);",`// BEGIN PLUG REFRESH
dashboard.vehiclePlugRefresh={};
for(const car of ['audi','jeep']){
 const request=flow.get('ess_'+car+'_plug_refresh');
 const anchor=request?.anchor||essRuntimeConfig.entities?.[car==='audi'?'sensor.ev_state_of_charge':'sensor.ev_2_state_of_charge'];
 const item=rawStates[anchor],reported=car==='jeep'?rawStates[anchor?.replace('_hvbattery_charge','_last_info_update_at')]?.state:item?.last_reported||item?.last_updated;
 dashboard.vehiclePlugRefresh[car]={status:request?.status||null,reportedAt:reported||null};
}
// END PLUG REFRESH
flow.set('ess_dashboard_live', dashboard);`);
 const ui=flows.find(n=>n.id==='esstpl_ev0000001');
 ui.format=ui.format.replace(/<!-- PLUG REFRESH -->[\s\S]*?<!-- END PLUG REFRESH -->/g,'');
 ui.format=ui.format.replace(/<details class="ess-soc-details"><summary>(<b>[\s\S]*?<\/b>)<\/summary>[\s\S]*?<\/details>/g,'$1');
 let socIndex=0;
 ui.format=ui.format.replace(/<div><span>SOC<\/span>(<b>[\s\S]*?<\/b>)<\/div>/g,(_,value)=>{
  const car=socIndex++===0?'audi':'jeep';
  return `<div><span>SOC</span><details class="ess-soc-details"><summary>${value}</summary><small>SOC ontvangen: {{d.vehiclePlugRefresh?.${car}?.reportedAt?new Date(d.vehiclePlugRefresh.${car}.reportedAt).toLocaleString('nl-NL'):'Onbekend'}}</small><button type="button" @click="send({topic:'ess/vehicle/soc-refresh',payload:'${car}'})">SOC verversen</button><small v-if="d.vehiclePlugRefresh?.${car}?.status">{{d.vehiclePlugRefresh.${car}.status}}</small></details></div>`;
 });
 if(!ui.wires[0].includes('essevrefresh_edge'))ui.wires[0].push('essevrefresh_edge');
 const z='ess000000000001',server='ess00000000000b';
 const fn=(id,name,func,wires)=>({id:'essevrefresh_'+id,type:'function',z,name,func,outputs:1,wires:[wires]});
 const api=(id,name,data,next)=>({id:'essevrefresh_'+id,type:'ha-api',z,name,server,version:1,protocol:'websocket',method:'get',path:'',data,dataType:'json',responseType:'json',outputProperties:[{property:'refreshReply',propertyType:'msg',value:'',valueType:'results'}],wires:[['essevrefresh_'+next]]});
 flows.push({id:'essevrefresh_tick',type:'inject',z,name:'Controleer aansluiten voertuigen',props:[],repeat:'10',once:true,onceDelay:8,wires:[['essevrefresh_edge']]});
 flows.push(fn('edge','Vraag eenmaal SOC op bij aansluiten',vehiclePlugEdge.toString()+`
if(msg.topic&&msg.topic!=='ess/vehicle/soc-refresh')return null;
const manual=msg.topic==='ess/vehicle/soc-refresh';
if(manual&&!['audi','jeep'].includes(msg.payload))return null;
const ha=global.get('homeassistant')?.homeAssistant,config=flow.get('ess_system_config')||{},states=ha?.states||{},messages=[];
for(const car of ['audi','jeep']){
 if(manual&&car!==msg.payload)continue;
 const role=car==='audi'?'sensor.ev_state_of_charge':'sensor.ev_2_state_of_charge';
 let anchor=config.entities?.[role];
 if(car==='jeep'&&(!anchor||anchor===role)){const candidates=Object.keys(states).filter(id=>/^sensor\\..*jeep.*_hvbattery_charge$/.test(id));anchor=candidates.length===1?candidates[0]:null;}
 const charger=config.entities?.[car==='audi'?'sensor.ev_charger_status':'sensor.ev_charger_2_status'];
 if(!charger||!anchor||anchor===role)continue;
 const key='ess_'+car+'_plug_refresh',previous=flow.get(key),now=Date.now(),result=vehiclePlugEdge(previous,states[charger]?.state,anchor,now);
 if(manual){if(previous&&now>=previous.at&&now-previous.at<30000)continue;result.request=true;result.state={...result.state,at:now,status:'Accustand opvragen'};}
 flow.set(key,result.state);
 if(result.request)messages.push({refreshCar:car,refreshAnchor:anchor,refreshAt:result.state.at,refreshManual:manual});
}
return messages.length?[messages]:null;`,['essevrefresh_registry']));
 flows.push(api('registry','Vind gekoppeld voertuig','{"type":"config/entity_registry/list"}','dispatch'));
 flows.push(fn('dispatch','Adresseer SOC-verversing aan juiste auto',`
const car=msg.refreshCar,key='ess_'+car+'_plug_refresh',saved=flow.get(key),ha=global.get('homeassistant')?.homeAssistant;
if(!saved||saved.at!==msg.refreshAt||saved.anchor!==msg.refreshAnchor||(!msg.refreshManual&&!saved.connected))return null;
const config=flow.get('ess_system_config')||{},states=ha?.states||{};
let anchor=config.entities?.[car==='audi'?'sensor.ev_state_of_charge':'sensor.ev_2_state_of_charge'];
if(car==='jeep'&&(!anchor||anchor==='sensor.ev_2_state_of_charge')){const candidates=Object.keys(states).filter(id=>/^sensor\\..*jeep.*_hvbattery_charge$/.test(id));anchor=candidates.length===1?candidates[0]:null;}
const charger=config.entities?.[car==='audi'?'sensor.ev_charger_status':'sensor.ev_charger_2_status'];
if(anchor!==msg.refreshAnchor||(!msg.refreshManual&&!['awaiting_start','awaiting_authorization','ready_to_charge','charging','completed'].includes(states[charger]?.state)))return null;
const domain=car==='audi'?'audiconnect':'uconnect',service=car==='audi'?'refresh_vehicle_data':'update';
const entry=Array.isArray(msg.refreshReply)?msg.refreshReply.find(e=>e.entity_id===msg.refreshAnchor&&e.platform===domain&&!e.disabled_by):null;
if(!entry?.device_id||!ha?.services?.[domain]?.[service]){flow.set(key,{...saved,status:'SOC-verversing niet beschikbaar'});return null;}
msg.payload={data:{type:'call_service',domain,service,service_data:{device_id:entry.device_id}}};
return msg;`,['essevrefresh_action']));
 flows.push(api('action','Vraag actuele voertuiggegevens op','','result'));
 flows.push(fn('result','Bewaar resultaat SOC-verversing',`
const key='ess_'+msg.refreshCar+'_plug_refresh',p=flow.get(key);
if(!p||p.at!==msg.refreshAt)return null;
flow.set(key,{...p,status:msg.refreshReply?.success===false?'SOC-verversing mislukt':'SOC aangevraagd · wacht op voertuig',acceptedAt:Date.now()});
return {payload:Date.now()};`,['ess00000000000a','ess00000000000d','essjeep_ess00000000000d']));
 flows.push({id:'essevrefresh_catch',type:'catch',z,name:'SOC-verversing fout',scope:['essevrefresh_action','essevrefresh_registry'],uncaught:false,wires:[['essevrefresh_error']]});
 flows.push(fn('error','Meld mislukte SOC-verversing',`const key='ess_'+msg.refreshCar+'_plug_refresh',p=flow.get(key);if(p&&p.at===msg.refreshAt)flow.set(key,{...p,status:'SOC-verversing mislukt'});return null;`,[]));
};
module.exports.vehiclePlugEdge=vehiclePlugEdge;
