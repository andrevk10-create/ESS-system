const assert=require('node:assert/strict');
const {witApplyReadback,witReadbackResult,witGridTransport}=require('../scripts/lib/wit-control-transport');
let now=1791100000000;
const remoteRole='select.growatt_grid_remote_power_control_enable',authorityRole='select.growatt_grid_control_authority';
const binding={deviceId:'configured-device',remoteEntity:remoteRole,authorityEntity:authorityRole};
let snapshot=witReadbackResult({success:true,values:[1]},{success:true,values:[1,2,65492,1,0]},binding,now);
assert.equal(snapshot.percent,-44);
assert.equal(witReadbackResult({success:false,values:[1]},{success:true,values:[1,2,10,1,0]},binding,now),null);
assert.equal(witReadbackResult({success:true,values:[1]},{success:true,values:[1,2,101,1,0]},binding,now),null);
const selectors={[remoteRole]:{state:'Enabled'},[authorityRole]:{state:'Enabled'},'number.growatt_battery_remote_charge_and_discharge_power':{state:'-44'}};
witApplyReadback(selectors,{}, {...snapshot,remote:0},true,now);
assert.equal(selectors[remoteRole].state,'Disabled','Real expired lease overrides a cached Enabled label');
witApplyReadback(selectors,{},snapshot,true,now+120001);
assert.equal(selectors[remoteRole].state,'unavailable','Expired readback fails closed');
witApplyReadback(selectors,{entities:{[remoteRole]:'select.other_device',[authorityRole]:authorityRole}},snapshot,true,now);
assert.equal(selectors[remoteRole].state,'unavailable','A snapshot cannot migrate to another device');

const fixture=()=>{
    const values={ess_system_config:{specs:{mainFuseA:23}},ess_wit_grid_charge_mode:'on',ess_wit_grid_charge_target_soc:80,
        ess_wit_grid_charge_status:{sessionOwned:true,powerPercent:25},ess_wit_charge_watch:{attempts:1,waitingSince:now-60000},
        ess_wit_control_readback:{...binding,authority:0,remote:0,duration:2,percent:-44,ac:0,periods:0,at:now}};
    const state=n=>({state:String(n),attributes:{unit_of_measurement:'W'},last_updated:new Date(now).toISOString()});
    const states={'sensor.growatt_battery_battery_soc':state(35),'sensor.growatt_battery_battery_power':state(0),'sensor.growatt_solar_solar_total_power':state(0)};
    for(const n of [1,2,3])states['sensor.p1_meter_vermogen_fase_'+n]=state(500);
    const flow={get:k=>values[k],set:(k,v)=>values[k]=v},global={get:()=>({homeAssistant:{states}})};
    const run=(msg,reply=false)=>witGridTransport(flow,global,msg,reply,now);
    return {values,states,flow,global,run,state};
};
for(const mode of ['auto','on']) {
    const high=fixture();high.values.ess_wit_grid_charge_mode=mode;
    high.states['sensor.growatt_battery_battery_soc']=high.state(85);
    Object.assign(high.values.ess_wit_control_readback,{authority:1,ac:1});
    const command=high.run({payload:{value:25}});
    assert.equal(!!command?.[0],false,'Both modes stop at the configured 80% target');
}
{
 const f=fixture();f.values.ess_wit_hardware_grid_guard=true;
 Object.assign(f.values.ess_wit_control_readback,{authority:1,ac:1});
 for(const phase of [1,2,3])delete f.states['sensor.p1_meter_vermogen_fase_'+phase];
 const sent=f.run({payload:{value:100}});
 assert(sent[0],'Hardware grid guarding does not depend on HA phase readings');
 assert(sent[0].payload.data.service_data.values[2]<=44,'The 8 kW ceiling stays active');
 f.values.ess_wit_grid_transport=null;
 f.values.ess_system_config.entities={[remoteRole]:remoteRole,[authorityRole]:authorityRole};
 f.values.ess_wit_battery_limits={remoteEntity:remoteRole,at:now,chargePowerW:0,chargeCurrentA:150,reportedVoltageV:52};
 assert.equal(f.run({payload:{value:100}})?.[0],null,'Hardware grid guarding still respects a zero BMS charging limit');
 delete f.values.ess_wit_battery_limits;
 delete f.values.ess_system_config.entities;
 f.states['sensor.growatt_battery_battery_soc']=f.state(80);
 assert.equal(f.run({payload:{value:100}})?.[0],null,'Hardware grid guarding still stops at target SOC');
}
{
 const f=fixture();f.values.ess_wit_grid_charge_mode='auto';f.values.ess_wit_grid_charge_status.targetSoc=40;
 Object.assign(f.values.ess_wit_control_readback,{authority:1,ac:1});
 f.states['sensor.growatt_battery_battery_soc']=f.state(41);
 assert.equal(f.run({payload:{value:25}})?.[0],null,'Transport respects a lower temporary reserve target');
}
{
 const {witReadbackFailure}=require('../scripts/lib/wit-control-readback');
 const f=fixture();f.values.ess_wit_readback_pending=now;
 const original=f.values.ess_wit_control_readback;
 assert.equal(witReadbackFailure(f.flow,{witReadId:now-60000},now),null,'Old failed read cannot cancel a newer request');
 assert.equal(f.values.ess_wit_readback_pending,now);
 assert.equal(f.values.ess_wit_control_readback,original);
 assert(witReadbackFailure(f.flow,{witReadId:now},now));
 assert.equal(f.values.ess_wit_readback_pending,null);
 assert.equal(f.values.ess_wit_control_readback,null);
 assert.equal(f.values.ess_wit_readback_health.ok,false);
 for(const id of ['esswit_readback_prepare','esswit_readback_remote_prepare','esswit_limits_prepare','esswit_current_prepare']){
  const code=require('../flows.json').find(n=>n.id===id).func;
  f.values.ess_wit_readback_pending=now;
  assert.equal(new Function('flow','msg',code)(f.flow,{witReadId:now-60000}),null,'Late intermediate reply must not start another register request: '+id);
 }
}
{
    const design=fixture();design.values.ess_system_config={specs:{mainFuseA:25}};
    Object.assign(design.values.ess_wit_control_readback,{authority:1,ac:1});
    for(const phase of [1,2,3])design.states['sensor.p1_meter_vermogen_fase_'+phase]=design.state(4800);
    assert.equal(design.run({payload:{value:44}})[0].payload.data.service_data.values[2],12,'25 A fuse leaves a 24 A design ceiling, checked again before writing');
}
for(const stage of ['power','authorityRead','remoteRead']){
    const lost=fixture();lost.values.ess_wit_control_readback.authority=1;lost.values.ess_wit_control_readback.ac=1;
    const dispatched=lost.run({payload:{option:'Charge',powerPercent:25}});
    const op=lost.values.ess_wit_grid_transport;op.stage=stage;
    lost.values.ess_wit_control_readback={...binding,authority:1,remote:1,duration:2,percent:25,ac:1,periods:0,at:now};
    const confirmed=lost.run({witReadbackTick:true},true);
    assert(confirmed[1],'Hardware readback repairs lost service reply at '+stage);
    assert.equal(lost.values.ess_wit_grid_transport,null);
    assert.equal(lost.run({witOperationId:dispatched[0].witOperationId,witReply:{}},true),null,'Late service response cannot reopen a completed operation');
}
{
    const gap=fixture();Object.assign(gap.values.ess_wit_control_readback,{authority:1,ac:1});
    const sent=gap.run({payload:{option:'Charge',powerPercent:25}}),operation=sent[0].witOperationId;
    gap.run({witOperationId:operation,witReply:{}},true);
    gap.run({witOperationId:operation,witReply:{success:true,values:[1]}},true);
    const reread=gap.run({witOperationId:operation,witReply:{success:false}},true);
    assert(reread[2],'An invalid reply requests one fresh read without another power write');
    assert.equal(gap.values.ess_wit_grid_transport.stage,'awaitReadback');
    assert(!gap.values.ess_wit_command_fault,'One invalid read reply does not latch a permanent fault');
    gap.values.ess_wit_control_readback={...binding,authority:1,remote:1,duration:2,percent:25,ac:1,periods:0,at:now};
    assert(gap.run({witReadbackTick:true},true)[1],'Fresh real registers recover a transient read error');
}
let f=fixture(),out=f.run({payload:{option:'Charge',powerPercent:25,durationMinutes:2}}),id=out[0].witOperationId;
assert.equal(out[0].payload.data.service,'write_registers');
assert.deepEqual(out[0].payload.data.service_data,{device_id:binding.deviceId,register:30100,values:[1]},'Enable actual authority without relying on an optimistic HA selector');
assert.equal(f.run({payload:{option:'Charge',powerPercent:99}}),null,'Do not queue another start');
out=f.run({witOperationId:id,witReply:{}},true);
assert.deepEqual(out[0].payload.data.service_data,{device_id:binding.deviceId,register:30410,values:[1]});
for(const n of [1,2,3])f.states['sensor.p1_meter_vermogen_fase_'+n]=f.state(4800);
out=f.run({witOperationId:id,witReply:{}},true);
assert.deepEqual(out[0].payload.data.service_data,{device_id:binding.deviceId,register:30407,values:[1,2,4]},'Recheck current phase headroom before the actual atomic command');
out=f.run({witOperationId:id,witReply:{}},true);
assert.equal(out[0].payload.data.service_data.start_address,30100);
out=f.run({witOperationId:id,witReply:{response:{success:true,values:[1]}}},true);
assert.equal(out[0].payload.data.service_data.start_address,30407);
now+=30000;
out=f.run({witOperationId:id,witReply:{response:{success:true,values:[1,2,4,1,0]}}},true);
assert(out[1]);assert.equal(f.values.ess_wit_grid_transport,null);
assert.equal(f.values.ess_wit_control_readback.percent,4);
assert.equal(f.values.ess_wit_charge_watch.waitingSince,now,'Response window begins after completed and verified start');
assert.equal(f.run({payload:{option:'Enabled'}}),null,'No rapid lease writes after a fast completion');
assert.equal(f.run({payload:{value:25}}),null,'A planner callback cannot immediately increase a verified setpoint');
for (const item of Object.values(f.states)) item.last_updated=new Date(now).toISOString();
assert.deepEqual(f.run({payload:{value:3}})[0].payload.data.service_data.values,[1,2,3],'A downward safety adjustment bypasses the upward settling interval');

f=fixture();f.values.ess_wit_control_readback.authority=1;f.values.ess_wit_control_readback.ac=1;
out=f.run({payload:{option:'Charge',powerPercent:25}});id=out[0].witOperationId;
assert.equal(out[0].payload.data.service_data.register,30407,'Skip already-enabled prerequisites');
f.run({witOperationId:id,witReply:{}},true);
f.run({witOperationId:id,witReply:{response:{success:true,values:[1]}}},true);
f.run({witOperationId:id,witReply:{response:{success:true,values:[0,2,25,1,0]}}},true);
assert.equal(f.values.ess_wit_grid_transport.stage,'awaitReadback','A service acknowledgement can precede physical register application');
assert(!f.values.ess_wit_command_fault,'Wait for bounded readback instead of faulting immediately');
now+=90000;
f.values.ess_wit_control_readback.at=now;
f.run({witReadbackTick:true},true);
assert(f.values.ess_wit_command_fault,'A service success alone cannot confirm a rejected hardware command');

f=fixture();f.values.ess_wit_control_readback.authority=1;f.values.ess_wit_control_readback.ac=1;
out=f.run({payload:{option:'Charge',powerPercent:25}});id=out[0].witOperationId;
f.run({witOperationId:id,witReply:{}},true);
f.run({witOperationId:id,witReply:{success:true,values:[1]}},true);
f.run({witOperationId:id,witReply:{success:true,values:[1,2,10,1,0]}},true);
now+=30000;
f.values.ess_wit_control_readback={...f.values.ess_wit_control_readback,percent:25,at:now};
assert(f.run({witReadbackTick:true},true)[1],'Periodic hardware readback completes a delayed command');
assert.equal(f.values.ess_wit_grid_transport,null);
assert(!f.values.ess_wit_command_fault);

f=fixture();out=f.run({payload:{option:'Charge',powerPercent:25}});id=out[0].witOperationId;
f.values.ess_wit_command_fault={at:now,attempts:2};
out=f.run({witOperationId:id,witReply:{}},true);
assert.equal(out[0],null,'Stop pending pipeline after a fault; never enable a late command');
assert.equal(f.values.ess_wit_grid_transport,null);
f=fixture();out=f.run({payload:{option:'Charge',powerPercent:25}});id=out[0].witOperationId;
out=f.run({witOperationId:id,error:{message:'write rejected'}},true);
assert(f.values.ess_wit_command_fault);assert.equal(out[0],null);
f=fixture();f.values.ess_wit_control_readback.periods=1;
assert.equal(f.run({payload:{option:'Charge',powerPercent:25}})[0],null,'Never silently erase an external TOU plan');
f=fixture();f.values.ess_wit_control_readback.authority=1;f.values.ess_wit_control_readback.ac=1;
f.states['sensor.p1_meter_vermogen_fase_1'].last_updated=new Date(now-20000).toISOString();
assert.equal(f.run({payload:{option:'Charge',powerPercent:25}})[0],null,'Fresh P1 is mandatory at write time');
f=fixture();f.states['sensor.growatt_battery_battery_soc']=f.state(100);
f.values.ess_wit_control_readback.authority=1;f.values.ess_wit_control_readback.ac=1;
assert.equal(f.run({payload:{option:'Charge',powerPercent:25}})[0],null,'Do not write a charge command into a full battery');

// Reproduce the slower Growatt poll while P1 continues updating each second.
const runningCharge = () => {
    const f=fixture();
    Object.assign(f.values.ess_wit_control_readback,{authority:1,remote:1,ac:1,percent:44});
    for(const n of [1,2,3])f.states['sensor.p1_meter_vermogen_fase_'+n]=f.state(3000);
    f.states['sensor.growatt_battery_battery_power']=f.state(7920);
    for(const id of ['sensor.growatt_battery_battery_power','sensor.growatt_solar_solar_total_power'])f.states[id].last_updated=new Date(now-30000).toISOString();
    return f;
};
f=runningCharge();
assert.deepEqual(f.run({payload:{value:44}})[0].payload.data.service_data.values,[1,2,44],'A 30-second Growatt sample must not count existing charging twice and reduce 8 kW to 6 kW');
assert.equal(f.values.ess_wit_grid_applied_limit.creditedNetChargeW,7920);
f=runningCharge();f.states['sensor.p1_meter_vermogen_fase_3']=f.state(6000);
assert.equal(f.run({payload:{value:44}})[0].payload.data.service_data.values[2],28,'A newly overloaded P1 phase still forces an immediate reduction with slower Growatt telemetry');
f=runningCharge();f.states['sensor.growatt_battery_battery_power'].last_updated=new Date(now-120001).toISOString();
assert.equal(f.run({payload:{value:44}})[0].payload.data.service_data.values[2],34,'Expired Growatt data cannot create headroom');
f=runningCharge();f.states['sensor.growatt_solar_solar_total_power'].state='7920';
assert.equal(f.run({payload:{value:44}})[0].payload.data.service_data.values[2],34,'Charging supplied entirely by direct PV creates no existing grid-charge credit');
f=runningCharge();f.states['sensor.growatt_solar_solar_total_power'].last_updated=new Date(now).toISOString();
assert.equal(f.run({payload:{value:44}})[0].payload.data.service_data.values[2],34,'Unrelated battery and PV polls cannot create imaginary grid credit');
f=runningCharge();f.states['sensor.growatt_battery_battery_power'].state='7.92';f.states['sensor.growatt_battery_battery_power'].attributes.unit_of_measurement='kW';
assert.equal(f.run({payload:{value:44}})[0].payload.data.service_data.values[2],44,'Growatt W and kW readings give the same headroom');
f=runningCharge();
for(const id of ['sensor.growatt_battery_battery_power','sensor.growatt_solar_solar_total_power'])f.states[id].last_updated=new Date(now-120000).toISOString();
assert.equal(f.run({payload:{value:44}})[0].payload.data.service_data.values[2],44,'The planner and transport use the same inclusive two-minute Growatt window');
f=runningCharge();f.states['sensor.growatt_solar_solar_total_power'].state='unavailable';
assert.equal(f.run({payload:{value:44}})[0].payload.data.service_data.values[2],34,'Missing direct PV readings cannot create charging credit');
f=runningCharge();f.states['sensor.p1_meter_vermogen_fase_1'].last_updated=new Date(now-15001).toISOString();
assert.equal(f.run({payload:{value:44}})[0],null,'The larger Growatt window must never relax the P1 freshness requirement');
f=fixture();Object.assign(f.values.ess_wit_control_readback,{authority:1,ac:1});
for(const [index,w]of [-7000,0,4000].entries())f.states['sensor.p1_meter_vermogen_fase_'+(index+1)]=f.state(w);
assert.equal(f.run({payload:{value:66}})[0].payload.data.service_data.values[2],17,'Export on one phase cannot compensate a loaded phase');
f=fixture();Object.assign(f.values.ess_wit_control_readback,{authority:1,ac:1});
f.values.ess_system_config={specs:{maximumBatteryChargePowerKw:18}};
for(const [index,w]of [-1000,-2000,-3000].entries())f.states['sensor.p1_meter_vermogen_fase_'+(index+1)]=f.state(w);
assert.equal(f.run({payload:{value:100}})[0].payload.data.service_data.values[2],44,'Even an old 18 kW setting and ample export headroom cannot exceed the 8 kW installation ceiling');
console.log('WIT transport: real readback, atomic lease/setpoint, single pending request, current fuse limits, delayed acknowledgements and failed writes OK');
