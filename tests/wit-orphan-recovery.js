const assert=require('node:assert/strict');
const {witManualRecoveryReady}=require('../scripts/lib/wit-manual-recovery');
let now=Date.parse('2026-10-13T14:00:00Z');
const values={ess_wit_grid_charge_mode:'on',ess_wit_control_readback:{deviceId:'wit-test',remoteEntity:'select.growatt_grid_remote_power_control_enable',authorityEntity:'select.growatt_grid_control_authority',authority:1,remote:1,duration:2,percent:-10,ac:1,periods:0,at:now}};
const flow={get:k=>values[k],set:(k,v)=>values[k]=v};
assert.equal(witManualRecoveryReady(flow,now),false);
for(let i=1;i<=3;i++){now+=60000;values.ess_wit_control_readback.at=now;assert.equal(witManualRecoveryReady(flow,now),i===3,'Fresh stable register reads permit a bounded manual recovery');}
values.ess_wit_grid_charge_mode='auto';assert.equal(witManualRecoveryReady(flow,now),false,'Auto never takes over external control');
values.ess_wit_grid_charge_mode='on';values.ess_wit_control_readback.periods=1;assert.equal(witManualRecoveryReady(flow,now),false,'External schedules are preserved');
values.ess_wit_control_readback.periods=0;values.ess_wit_control_readback.at=now-120001;assert.equal(witManualRecoveryReady(flow,now),false,'Stale hardware feedback cannot authorize recovery');
values.ess_wit_control_readback.at=now;values.ess_wit_grid_transport={};assert.equal(witManualRecoveryReady(flow,now),false,'Pending writes prevent concurrent recovery');
console.log('WIT orphan recovery: fresh hardware confirmation, explicit manual mode, schedules and pending writes checked');
