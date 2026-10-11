const assert=require('assert'),{evPriorityDemand,witChargingPriority,evPriorityReservation}=require('../scripts/lib/charging-priority');
const now=Date.now(),v={},flow={get:k=>v[k]},states={'sensor.growatt_battery_battery_soc':{state:'70',last_reported:new Date(now).toISOString()}};
assert(witChargingPriority(flow,states,now));
states['sensor.growatt_battery_battery_soc'].state='100';assert(!witChargingPriority(flow,states,now));
states['sensor.growatt_battery_battery_soc'].state='unknown';assert(witChargingPriority(flow,states,now));
v.ess_system_config={entities:{'select.growatt_grid_remote_power_control_enable':'select.wit'}};
v.ess_wit_battery_limits={remoteEntity:'select.wit',at:now,reportedSoc:100};
assert(!witChargingPriority(flow,states,now),'Fresh Modbus SOC releases solar priority when HA SOC is unavailable');
v.ess_wit_battery_limits.at=now-120001;assert(witChargingPriority(flow,states,now));
delete v.ess_wit_battery_limits;delete v.ess_system_config;
v.ess_wit_grid_charge_mode='off';v.ess_wit_export_mode='off';assert(!witChargingPriority(flow,states,now));
for(const car of ['audi','jeep']) {
 v['ess_'+car+'_priority_request']={requested:true,at:now};assert(evPriorityDemand(flow,now));assert(!evPriorityDemand(flow,now,car));
 v['ess_'+car+'_priority_request'].at=now-120001;assert(!evPriorityDemand(flow,now));delete v['ess_'+car+'_priority_request'];
 v['ess_'+car+'_control_status']={controlled:true,targetCurrent:6,controlMode:'solar',updatedAt:new Date(now).toISOString()};assert(!evPriorityDemand(flow,now));
 v['ess_'+car+'_control_status'].controlMode='departure-plan';assert(evPriorityDemand(flow,now));delete v['ess_'+car+'_control_status'];
}
const f=require('../flows.json');
for(const id of ['ess00000000000d','essjeep_ess00000000000d']) {
const n=f.find(n=>n.id===id);assert(n.func.includes('Zonneladen wacht: WIT-accu heeft voorrang'));assert.strictEqual((n.func.match(/const priorityRequest=/g)||[]).length,1);
}
assert(f.find(n=>n.id==='esswitexport_ctrl').func.includes('soc < 100 && !evPriorityDemand'));
v.ess_audi_priority_request={at:now,requested:true,currentA:16};
assert.strictEqual(evPriorityReservation(flow,{},now,230),3680);
const power={state:'6',last_reported:new Date(now).toISOString(),attributes:{unit_of_measurement:'kW'}};
assert.strictEqual(evPriorityReservation(flow,{'sensor.ev_charger_power':power},now,230),1680,'Measured EV load is already in P1 and must not be reserved twice');
v.ess_jeep_priority_request={at:now,requested:true,currentA:16};assert.strictEqual(evPriorityReservation(flow,{},now,230),7360);
const binding={deviceId:'wit',remoteEntity:'select.growatt_grid_remote_power_control_enable',authorityEntity:'select.growatt_grid_control_authority'};
const values={ess_system_config:{specs:{mainFuseA:25,voltage:230}},ess_wit_grid_charge_mode:'on',ess_wit_grid_charge_target_soc:100,
ess_wit_grid_charge_status:{sessionOwned:true},ess_wit_control_readback:{...binding,authority:1,remote:0,duration:2,percent:0,ac:1,periods:0,at:now},ess_audi_priority_request:{at:now,requested:true,currentA:16}};
const reading=n=>({state:String(n),last_reported:new Date(now).toISOString(),attributes:{unit_of_measurement:'W'}});
const telemetry={'sensor.growatt_battery_battery_soc':reading(40),'sensor.growatt_battery_battery_power':reading(0),'sensor.growatt_solar_solar_total_power':reading(0)};
for(const i of [1,2,3])telemetry['sensor.p1_meter_vermogen_fase_'+i]=reading(500);
const dispatch=new Function('flow','global','msg',f.find(n=>n.id==='esswitgrid_transport_dispatch').func);
const context={get:k=>values[k],set:(k,val)=>values[k]=val},global={get:()=>({homeAssistant:{states:telemetry}})};
const result=dispatch(context,global,{payload:{value:44}});
assert.strictEqual(result[0].payload.data.service_data.values[2],22,'WIT may charge concurrently using only the 4.02 kW remaining after reserving EV demand');
values.ess_wit_grid_transport=null;values.ess_jeep_priority_request={at:now,requested:true,currentA:16};
const blocked=dispatch(context,global,{payload:{value:44}});
assert.strictEqual(blocked[0],null,'Both cars consume the available space: do not write a WIT charging setpoint');
delete values.ess_jeep_priority_request;values.ess_wit_grid_transport=null;
values.ess_wit_control_readback.authority=0;values.ess_wit_control_readback.ac=0;
const queued=dispatch(context,global,{payload:{value:44}}),operation=queued[0].witOperationId;
const reply=new Function('flow','global','msg',f.find(n=>n.id==='esswitgrid_transport_reply').func);
reply(context,global,{witOperationId:operation,witReply:{}});
const committed=reply(context,global,{witOperationId:operation,witReply:{}});
assert.strictEqual(committed[0].payload.data.service_data.values[2],22,'Reservation is also applied after queued authority/AC writes');
console.log('Charging priority: both cars, solar exclusion, stale requests, battery target and disabled battery OK');
