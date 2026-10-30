const assert=require('node:assert/strict');
const {witIdleRecoveryReady:ready}=require('../scripts/lib/wit-idle-recovery');
const {witChargeAudit}=require('../scripts/lib/wit-charge-audit');
const now=Date.now();
function fixture(){
    const remoteEntity='select.growatt_grid_remote_power_control_enable',authorityEntity='select.growatt_grid_control_authority';
    const v={ess_wit_grid_charge_mode:'auto',
        ess_wit_command_fault:{at:now-600000,reason:'WIT-vrijgave niet bevestigd',deviceId:'wit'},
        ess_wit_grid_write_ack:{at:now-660000,deviceId:'wit',configEntryId:'entry',remoteEntity,authorityEntity},
        ess_wit_control_readback:{at:now,deviceId:'wit',configEntryId:'entry',remoteEntity,authorityEntity,remote:0,authority:1,periods:0,duration:2}};
    return {v,get:k=>v[k],set:(k,value)=>v[k]=value};
}
const f=fixture();
assert.equal(ready(f,now),false);
assert.equal(ready(f,now+20000),false,'One register snapshot cannot authorize release');
f.v.ess_wit_control_readback.at=now+60000;
assert.equal(ready(f,now+60000),true,'Two fresh OFF lease readings permit recovery of proven ESS authority');
assert.equal(ready(f,now+120000),false,'Throttle release attempts');
assert.ok(f.v.ess_wit_command_fault,'Release readiness must never clear a fault or start charging');
for(const mutate of [
    f=>delete f.v.ess_wit_grid_write_ack,
    f=>f.v.ess_wit_grid_write_ack.at=now-2000000,
    f=>f.v.ess_wit_grid_write_ack.configEntryId='other',
    f=>f.v.ess_wit_control_readback.deviceId='other',
    f=>f.v.ess_wit_command_fault.deviceId='other',
    f=>f.v.ess_wit_control_readback.remote=1,
    f=>f.v.ess_wit_control_readback.periods=1,
    f=>f.v.ess_wit_control_readback.duration=60,
    f=>f.v.ess_wit_control_readback.remoteEntity='select.other',
    f=>f.v.ess_wit_grid_charge_mode='off',
    f=>f.v.ess_wit_grid_transport={},
    f=>f.v.ess_wit_manual_recovery={},
    f=>f.v.ess_wit_grid_charge_status={sessionOwned:true},
    f=>f.v.ess_wit_audi_discharge_status={active:true},
    f=>f.v.ess_wit_command_fault.reason='Ongeldige WIT-schrijfstap',
    f=>f.v.ess_wit_command_fault.at=now-200000
]){
    const q=fixture();mutate(q);assert.equal(ready(q,now),false);
    q.v.ess_wit_control_readback.at=now+60000;
    assert.equal(ready(q,now+60000),false,'Unsafe or unproven states cannot authorize release');
}
const messages=[];
for(let i=0;i<600;i++)witChargeAudit(f,{mode:'auto',status:'Wacht op laden '+i},now+i*1000,{send:m=>messages.push(m)});
assert.equal(f.v.ess_wit_charge_audit.length,512);
assert.equal(messages.length,600,'Disk journal retains events beyond the in-memory limit');
const record=JSON.parse(messages[0][6].payload);
assert.equal(record.faultReason,'WIT-vrijgave niet bevestigd');
assert.equal(record.readback.remote,0);
assert.match(messages[0][6].filename,/^\/config\/node-red\/ess-wit-audit-\d{4}-\d{2}-\d{2}\.jsonl$/);
const flows=require('../flows.json');
assert.deepEqual(flows.find(n=>n.id==='esswitgrid_ctrl1').wires[6],['esswit_audit_write']);
assert.equal(flows.find(n=>n.id==='esswit_audit_write').overwriteFile,'false');
console.log('WIT idle recovery: expired ESS lease, independent readings, external ownership, schedules, throttle and durable audit passed');
