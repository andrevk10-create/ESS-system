const assert=require('node:assert/strict');
const {jointWitKw,jointOwnChargeW}=require('../scripts/lib/joint-charging');
const now=Date.now(),v={ess_joint_charging_16kw:true},flow={get:k=>v[k]};
const state=(kw)=>({state:String(kw),attributes:{unit_of_measurement:'kW'},last_updated:new Date(now).toISOString()});
for(const [a,b,expected]of [[0,0,8],[5,3,8],[8,0,8],[8.1,0,0],[11,0,0],[6,6,0]]){
 const states={'sensor.ev_charger_status':{state:'charging'},'sensor.ev_charger_2_status':{state:'charging'},'sensor.ev_charger_power':state(a),'sensor.ev_charger_2_power':state(b)};
 assert.equal(jointWitKw(flow,states,now,8),expected);
}
v.ess_wit_control_readback={at:now,deviceId:'wit',authority:1,remote:1,percent:44,remoteEntity:'select.growatt_grid_remote_power_control_enable',authorityEntity:'select.growatt_grid_control_authority'};
assert.equal(jointOwnChargeW(flow,{sessionOwned:true},now,7514),7514,'Own measured charge must not count as external load');
assert.equal(jointOwnChargeW(flow,{sessionOwned:false},now,7514),0);
v.ess_wit_control_readback.at=now-120001;assert.equal(jointOwnChargeW(flow,{sessionOwned:true},now,7514),0);
const flows=require('../flows.json');
for(const car of ['audi','jeep']){
 const n=flows.find(n=>n.id===(car==='audi'?'ess00000000000d':'essjeep_ess00000000000d'));
 const from=n.func.indexOf('const witRequest='),to=n.func.indexOf('const requestedTargetCurrent',from);
 const cap=new Function('flow','states','now','phaseCount','minimumCurrent','targetCurrent',require('../scripts/lib/joint-charging').jointCarKw.toString()+'\n'+n.func.slice(from,to)+'return targetCurrent;');
 v.ess_wit_grid_charge_status={sessionOwned:true,targetPowerW:8000};
 const result=cap(flow,{},now,3,6,16);assert.equal(result,11);assert(result*690+8000<=16000);
}
assert(flows.find(n=>n.id==='esswitgrid_ctrl1').initialize.includes("ess_joint_charging_16kw', true"));
console.log('Joint 16 kW: both cars, full-power WIT, requested EV current cap, own charging and stale readback passed');
