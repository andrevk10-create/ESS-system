const assert=require('node:assert/strict');
const {witChargeSoc}=require('../scripts/lib/wit-soc');
const now=Date.now(),values={},flow={get:k=>values[k],set:(k,v)=>values[k]=v};
const soc='sensor.growatt_battery_battery_soc',power='sensor.growatt_battery_battery_power';
const reading=state=>({state:String(state),last_updated:new Date(now).toISOString()});
const states={[soc]:reading(74),[power]:reading(6800)};
assert.deepEqual(witChargeSoc(flow,states,{},now),{soc:74,cached:false});
states[soc]=reading('unavailable');
assert.deepEqual(witChargeSoc(flow,states,{},now+20000),{soc:74,cached:true});
assert.equal(witChargeSoc(flow,states,{},now+30001).soc,null,'Long gaps stop charging');
assert.equal(witChargeSoc(flow,states,{entities:{[soc]:'sensor.other_battery'}},now+10000).soc,null,'Mapping changes invalidate cache');
states[power]=reading('unavailable');
assert.equal(witChargeSoc(flow,states,{},now+10000).soc,null,'No fresh power means no grace');
states[power]=reading(6800);states[soc]=reading(99);
witChargeSoc(flow,states,{},now);states[soc]=reading('unknown');
assert.equal(witChargeSoc(flow,states,{},now+10000).soc,null,'No near-full fallback');
states[soc]=reading(101);witChargeSoc(flow,states,{},now);
assert.equal(values.ess_wit_last_valid_soc,null,'Invalid numeric SOC clears cache');
const remote='select.growatt_grid_remote_power_control_enable',authority='select.growatt_grid_control_authority';
const native={deviceId:'own',remoteEntity:remote,authorityEntity:authority,socEntity:soc,at:now,reportedSoc:38};
const nativeFixture=()=>{
 const memory={ess_wit_battery_limits:{...native},ess_wit_control_readback:{...native}};
 const fl={get:k=>memory[k],set:(k,v)=>memory[k]=v};
 return {memory,run:(s={},c={},at=now)=>witChargeSoc(fl,s,c,at)};
};
{
 const f=nativeFixture();
 assert.deepEqual(f.run(),{soc:38,cached:false,source:'register',at:now},'Simultaneously missing HA SOC and power use verified local SOC');
 assert.equal(f.run({}, {}, now+120000).soc,38);
 assert.equal(f.run({}, {}, now+120001).soc,null,'Repeated use never refreshes register freshness');
 assert.equal(f.memory.ess_wit_last_valid_soc,undefined,'Register fallback must not refresh the HA grace cache');
 assert.equal(f.run({[soc]:reading(101)}).soc,null,'An explicit invalid sensor must not be masked');
 assert.equal(f.run({[soc]:reading(39)}).soc,39,'An equally recent valid HA sample takes precedence');
 assert.equal(f.run({[soc]:{...reading(37),last_updated:new Date(now-300000).toISOString()}}).soc,38,'An unchanged HA SOC must not override newer hardware SOC');
 for(const value of [0,99,100]){f.memory.ess_wit_battery_limits.reportedSoc=value;assert.equal(f.run().soc,value,'Real hardware SOC remains authoritative near full');}
}
for(const [field,value] of [['deviceId','other'],['socEntity','sensor.other'],['socEntity',undefined],['remoteEntity','select.other'],['authorityEntity','select.other'],['at',now+1],['at',now-120001],['reportedSoc',101],['reportedSoc',-1],['reportedSoc',null],['reportedSoc','38']]){
 const f=nativeFixture();f.memory.ess_wit_battery_limits[field]=value;
 assert.equal(f.run().soc,null,'Reject unproven register SOC: '+field+'='+value);
}
for(const patch of [{deviceId:'other'},{remoteEntity:'select.other'},{authorityEntity:'select.other'},{at:now-120001}]){
 const f=nativeFixture();Object.assign(f.memory.ess_wit_control_readback,patch);
 assert.equal(f.run().soc,null,'Reject changed/stale control binding');
}
for(const role of [soc,remote,authority]){
 const f=nativeFixture();assert.equal(f.run({}, {entities:{[role]:''}}).soc,null,'An explicitly disabled role must block native fallback');
 assert.equal(f.run({}, {entities:{[role]:'other'}}).soc,null,'A changed mapping must invalidate native fallback');
}
// Battery and Grid may be sibling devices, but must share the inverter entry.
const prepare=new Function('flow','msg',require('../flows.json').find(n=>n.id==='esswit_readback_prepare').func);
for(const kind of ['matching','other-soc-device','other-soc-entry','missing-soc','other-authority-device']){
 const memory={ess_wit_readback_pending:1};const fl={get:k=>memory[k],set:(k,v)=>memory[k]=v};
 const entries=[remote,authority,soc].map(entity_id=>({entity_id,device_id:'own',config_entry_id:'entry',platform:'growatt_modbus'}));
 if(kind==='other-soc-device')entries[2].device_id='other';
 if(kind==='other-soc-entry')entries[2].config_entry_id='other';
 if(kind==='missing-soc')entries.pop();
 if(kind==='other-authority-device')entries[1].device_id='other';
 const out=prepare(fl,{witReadId:1,witReply:entries});
 if(kind==='other-authority-device')assert.equal(out,null);
 else assert.equal(out.witBinding.socEntity,['matching','other-soc-device'].includes(kind)?soc:undefined,'Only same-entry SOC is attached to readback');
}
{
 const f=nativeFixture();
 const binding={...native,configEntryId:'entry',socConfigEntryId:'entry',socDeviceId:'battery-child'};
 const prepareCurrent=new Function('msg','flow',require('../flows.json').find(n=>n.id==='esswit_current_prepare').func);
 f.memory.ess_wit_readback_pending=1;
 const fl={get:k=>f.memory[k],set:(k,v)=>f.memory[k]=v};
 const values=Array(19).fill(0);values[7]=38;
 prepareCurrent({witReadId:1,witBinding:binding,witReply:{success:true,values}},fl);
 const recorded=f.memory.ess_wit_soc_readback.at;
 require('../scripts/lib/wit-control-readback').witReadbackFailure(fl,{witReadId:1},recorded);
 assert.equal(f.run({}, {}, recorded).soc,38,'A later control/current failure must not erase independently measured SOC');
 assert.equal(f.run({}, {}, recorded+120001).soc,null,'Independent readback cannot be refreshed by reuse');
 f.memory.ess_wit_soc_readback.socConfigEntryId='other';
 assert.equal(f.run({}, {}, recorded).soc,null,'Independent SOC requires proven same-entry identity');
 f.memory.ess_wit_soc_readback.socConfigEntryId='entry';
 f.memory.ess_wit_control_readback={...native,deviceId:'replacement'};
 assert.equal(f.run({}, {}, recorded).soc,null,'Changed control device invalidates independent SOC');
}
console.log('WIT SOC: simultaneous HA gaps, native freshness/identity, near-full, remapping and registry proof checked');
