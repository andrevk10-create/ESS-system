const assert=require('assert'),jsonata=require('jsonata'),vm=require('vm');
const apply=require('../scripts/lib/easee-service-compat');
async function main(){
const flows=[{id:'service',type:'api-call-service',domain:'easee',data:'{"charger_id": payload.chargerId, "current": payload.current, "time_to_live": payload.timeToLive}'},{id:'controller',type:'function',func:"const chargerOnline = state('binary_sensor.ev_charger_online') === 'on'; return chargerOnline;"}];
apply(flows);
const expr=jsonata(flows[0].data);expr.registerFunction('flowContext',()=>({LEFT:'ha-left',RIGHT:'ha-right'}));
assert.deepStrictEqual(await expr.evaluate({payload:{chargerId:'LEFT',current:6,timeToLive:2}}),{device_id:'ha-left',current:6,time_to_live:2});
await assert.rejects(()=>expr.evaluate({payload:{chargerId:'MISSING',current:6}}));
const fn=flows.find(n=>n.id==='controller').func;
const online=(flag,freshPower,freshStatus)=>vm.runInNewContext('(function(){'+fn+'})()',{state:id=>id.includes('online')?flag:'charging',fresh:id=>id.includes('power')?freshPower:freshStatus});
assert.strictEqual(online('unknown',true,true),true);
assert.strictEqual(online('unknown',false,true),false);
assert.strictEqual(online('unknown',true,false),false);
assert.strictEqual(online('off',true,true),false);
assert.strictEqual(online('on',false,false),true);
console.log('Easee: HA device routing, missing mapping rejection, fresh polling fallback and offline guard OK');
}
main().catch(e=>{console.error(e);process.exitCode=1});
