const assert=require('node:assert/strict');
const lib=require('../scripts/lib/joint-charging');const {jointAllocate, jointWitKw,jointCarKw,jointEvLimit,jointEvPlanningKw}=lib;
const now=Date.now(),step=.69,ev={kw:11,step,min:4.14,phases:3},off={...ev,kw:0};
for(const [a,b,w]of [[ev,off,8],[ev,ev,0],[ev,ev,8],[off,off,8]]){
 const x=jointAllocate(a,b,w);assert(x.audi+x.jeep+x.wit<=16+1e-8);if(a.kw)assert(x.audi>=4.14);if(b.kw)assert(x.jeep>=4.14);if(w&&!(a.kw&&b.kw))assert(x.wit>7.5);if(a.kw&&b.kw)assert.equal(x.wit,0);
}
assert.equal(jointAllocate(ev,off,8).wit,8);assert(jointAllocate(ev,ev,0).audi+jointAllocate(ev,ev,0).jeep>15.8);
const v={ess_joint_charging_16kw:true,ess_audi_smart_enabled:true,ess_jeep_smart_enabled:true,ess_system_config:{specs:{maximumBatteryChargePowerKw:8,voltage:230},entities:{'select.growatt_grid_remote_power_control_enable':'select.wit','select.growatt_grid_control_authority':'select.authority'}}};
const flow={get:k=>v[k]},states={};
for(const [car,suffix]of [['audi',''],['jeep','_2']]){
 states['sensor.ev_charger'+suffix+'_status']={state:'ready_to_charge'};
 states['sensor.ev_charger'+suffix+'_power']={state:'0',last_reported:new Date(now).toISOString(),attributes:{unit_of_measurement:'kW'}};
 v['ess_'+car+'_control_status']={updatedAt:new Date(now).toISOString(),energyNeeded:20,phaseCount:3,selectedSlots:[{start:now,end:now+900000,powerKw:11}]};
 v['ess_'+car+'_priority_request']={at:now,requested:true,currentA:16};
}
assert.equal(jointWitKw(flow,states,now,8,now,now+900000),0,'Two cars take the window; WIT is the third consumer');
v.ess_jeep_control_status.selectedSlots=[];
assert(jointWitKw(flow,states,now,8,now,now+900000)>7.5,'One planned car leaves the full WIT share');
v.ess_jeep_control_status.selectedSlots=[{start:now,end:now+900000,powerKw:11}];
v.ess_wit_grid_charge_status={updatedAt:new Date(now).toISOString(),selectedSlots:[{start:now,end:now+900000}],sessionOwned:false};
let amps={audi:0,jeep:0};
for(let round=0;round<4;round++){
 for(const car of ['jeep','audi']){amps[car]=jointEvLimit(flow,states,car,now,16,3);v['ess_'+car+'_control_status'].targetCurrent=amps[car];}
 const kw=jointWitKw(flow,states,now,8);v.ess_wit_grid_charge_status.sessionOwned=true;v.ess_wit_grid_charge_status.targetPowerW=Math.floor(kw/18*100)*180;
 assert(amps.audi*step+amps.jeep*step+v.ess_wit_grid_charge_status.targetPowerW/1000<=16+1e-8);
}
assert(amps.audi>=6&&amps.jeep>=6&&v.ess_wit_grid_charge_status.targetPowerW===0,'Two cars converge to shared charging without a third consumer');
v.ess_audi_control_status.targetCurrent=25;v.ess_audi_control_status.updatedAt=new Date(now-180000).toISOString();assert.equal(jointCarKw(flow,states,'audi',now),0,'Expired setpoints do not block forever');
states['sensor.ev_charger_power'].state='11';assert.equal(jointCarKw(flow,states,'audi',now),11,'Actual load remains reserved despite stale command');
assert(jointWitKw(flow,states,now,8)<5,'Wait for real peer reductions before increasing WIT');
states['sensor.ev_charger_power'].state='0';states['sensor.growatt_battery_battery_soc']={state:'30'};
assert(jointEvPlanningKw(flow,states,'jeep',11,now)<9,'EV duration includes the other car sharing the window');
v.ess_wit_control_readback={at:now,deviceId:'test',authority:1,remote:1,percent:44,remoteEntity:'select.wit',authorityEntity:'select.authority'};
assert.equal(lib.jointOwnChargeW(flow,{sessionOwned:true},now,7500),7500);
v.ess_wit_control_readback.remote=0;
const flows=require('../flows.json');for(const n of flows.filter(n=>n.func))new Function('msg','flow','global','node',n.func);
for(const [id,car]of [['ess00000000000d','audi'],['essjeep_ess00000000000d','jeep']]){
 const n=flows.find(n=>n.id===id),start=n.func.indexOf('const witRequest='),end=n.func.indexOf('const requestedTargetCurrent',start);
 const run=new Function('flow','states','now','phaseCount','minimumCurrent','targetCurrent',lib.jointHelpers+'\n'+n.func.slice(start,end)+'return targetCurrent');
 assert(run(flow,states,now,3,6,16)>=6);
}
console.log('Joint allocation: both EVs, WIT overlap, two-consumer maximum, transition limits, stale reservations and planner capacity passed');

// Existing 9 kW configurations migrate once; smaller explicit limits survive.
{
 const n=flows.find(n=>n.initialize?.includes('migrated.version = 4'));
 for(const [old,expected]of [[9,8],[6,6],[8,8]]){
  const values={ess_system_config:{version:3,specs:{maximumBatteryChargePowerKw:old,evGridChargePowerKw:10}}};
  new Function('flow',n.initialize)({get:k=>values[k],set:(k,v)=>values[k]=v});
  assert.equal(values.ess_system_config.specs.maximumBatteryChargePowerKw,expected);
  assert.equal(values.ess_system_config.specs.evGridChargePowerKw,10,'Unrelated EV settings stay unchanged');
 }
}
