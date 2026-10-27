const assert=require('node:assert/strict');
const {witFaultRecovery:recover}=require('../scripts/lib/wit-fault-recovery');
const now=1800000000000;
function fixture(reason='WIT-registerterugmelding ontbreekt of is ongeldig') {
    const v={ess_wit_command_fault:{at:now-700000,reason,deviceId:'device'},
        ess_wit_control_readback:{deviceId:'device',remoteEntity:'select.growatt_grid_remote_power_control_enable',authorityEntity:'select.growatt_grid_control_authority',at:now,remote:0,authority:0,periods:0}};
    return {v,get:k=>v[k],set:(k,x)=>v[k]=x};
}
const f=fixture();assert.equal(recover(f,now),false);
assert.equal(recover(f,now+20000),false,'Repeated evaluation of one snapshot is not two readings');
f.v.ess_wit_control_readback.at=now+60000;
assert.equal(recover(f,now+60000),true);assert.equal(f.v.ess_wit_command_fault,null);
f.v.ess_wit_command_fault={at:now-650000,reason:'WIT-registerterugmelding ontbreekt of is ongeldig'};
assert.equal(recover(f,now+60000),false,'One recovery per hour');
for(const reason of ['WIT-opdracht mislukt: Modbus','Externe WIT-tijdplanning actief · netladen geblokkeerd']) {
    const q=fixture(reason);recover(q,now);q.v.ess_wit_control_readback.at+=60000;
    assert.equal(recover(q,now+60000),false);assert.ok(q.v.ess_wit_command_fault);
}
const noPower=fixture('Geen laad- of ontlaadvermogen na herstelpoging');
noPower.v.ess_wit_command_fault.at=now-299000;
assert.equal(recover(noPower,now),false,'Wait between failed starts');
noPower.v.ess_wit_control_readback.at=now+20000;
assert.equal(recover(noPower,now+20000),false,'First independent OFF observation');
noPower.v.ess_wit_control_readback.at=now+40000;
assert.equal(recover(noPower,now+40000),true,'No-power failure automatically permits the next start');
noPower.v.ess_wit_command_fault={at:now+50000,reason:'Geen laad- of ontlaadvermogen na herstelpoging'};
noPower.v.ess_wit_control_readback.at=now+360000;
assert.equal(recover(noPower,now+360000),false);
noPower.v.ess_wit_control_readback.at=now+380000;
assert.equal(recover(noPower,now+380000),true,'A second failed start cannot block the rest of the night');
for(const reason of ['WIT-vrijgave niet bevestigd','WIT-opdracht blijft onderweg']){
 const q=fixture(reason);assert.equal(recover(q,now),false);q.v.ess_wit_control_readback.at+=60000;
 assert.equal(recover(q,now+60000),true,'Transient timeout clears only after cooldown and two real OFF observations');
}
for(const mutate of [q=>q.v.ess_wit_control_readback.remote=1,q=>q.v.ess_wit_control_readback.authority=1,
    q=>q.v.ess_wit_control_readback.periods=1,q=>q.v.ess_wit_control_readback.deviceId='other',
    q=>q.v.ess_wit_control_readback.remoteEntity='select.other',q=>q.v.ess_wit_grid_transport={},
    q=>q.v.ess_wit_grid_charge_status={sessionOwned:true},q=>q.v.ess_wit_audi_discharge_status={active:true},
    q=>q.v.ess_wit_control_readback.at=now-130000]) {
    const q=fixture();recover(q,now);mutate(q);assert.equal(recover(q,now+60000),false);
    assert.ok(q.v.ess_wit_command_fault);assert.equal(q.v.ess_wit_fault_recovery_probe,null);
}
const legacy=fixture();delete legacy.v.ess_wit_command_fault.reason;
assert.equal(recover(legacy,now),false);
legacy.v.ess_wit_release_ack={authority:now-500000,remote:now-400000};
recover(legacy,now);legacy.v.ess_wit_control_readback.at+=60000;
assert.equal(recover(legacy,now+60000),true);
console.log('WIT recovery: repeated automatic no-power retries, independent readings, cooldown, binding and ownership passed');
