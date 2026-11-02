const assert=require('node:assert/strict');
const {witSoleControllerSession:claim}=require('../scripts/lib/wit-sole-controller');
const now=Date.now();
function fixture(){
    const v={ess_wit_control_readback:{deviceId:'wit',configEntryId:'integration',at:now,
        remoteEntity:'select.growatt_grid_remote_power_control_enable',authorityEntity:'select.growatt_grid_control_authority',
        remote:1,authority:1,periods:0,percent:26}};
    return {v,get:k=>v[k],set:(k,x)=>v[k]=x};
}
for(const remote of [0,1]){
    const f=fixture(),previous={};f.v.ess_wit_control_readback.remote=remote;
    claim(f,previous,now);
    assert.equal(previous.sessionOwned,true,'No old write acknowledgement is needed to supervise HA-only controls');
    assert.equal(previous.powerPercent,remote?26:0);
}
for(const change of [f=>f.v.ess_wit_control_readback.at=now-120001,
    f=>f.v.ess_wit_control_readback.remoteEntity='select.other',
    f=>f.v.ess_wit_control_readback.periods=1,
    f=>f.v.ess_wit_control_readback.percent=NaN,
    f=>delete f.v.ess_wit_control_readback.deviceId,
    f=>f.v.ess_wit_audi_discharge_status={sessionOwned:true},
    f=>f.v.ess_wit_grid_transport={},f=>f.v.ess_wit_manual_recovery={}]){
    const f=fixture(),previous={};change(f);claim(f,previous,now);assert.equal(previous.sessionOwned,undefined);
}
const f=fixture(),previous={};f.v.ess_wit_command_fault={at:now,reason:'WIT-vrijgave niet bevestigd'};
claim(f,previous,now);assert.equal(previous.sessionOwned,true,'Even a faulted session must be claimed for a verified stop');
assert.ok(f.v.ess_wit_command_fault,'Claiming control never clears a hardware fault');
const flows=require('../flows.json');
for(const id of ['esswitgrid_ctrl1','esswitaudi_ctrl1']){
    assert(!/Externe WIT-(laadopdracht|bediening) actief/.test(flows.find(n=>n.id===id).func));
}
console.log('HA-only WIT control: no external-command wait; fresh mapped supervision, fault release and internal interlocks passed');
