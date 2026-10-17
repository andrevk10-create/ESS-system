const assert=require('node:assert/strict');
const {costSample}=require('../scripts/lib/cost-sample');
const {costLedgerStep}=require('../scripts/lib/energy-costs');
const now=Date.parse('2026-10-17T08:00:00Z');
const e=(state,unit='W',at=now)=>({state:String(state),attributes:{unit_of_measurement:unit},last_reported:new Date(at).toISOString()});
const states={'sensor.p1_meter_vermogen':e(1000),'sensor.growatt_solar_system_output_power':e(2000),'sensor.growatt_battery_battery_power':e(-1000)};
for(const suffix of ['','_2']){
 states['sensor.ev_charger'+suffix+'_status']=e('charging','');
 states['sensor.ev_charger'+suffix+'_power']=e(suffix?1:2,'kW');
}
const dashboard={house:{power:6000},grid:{power:1000},battery:{power:-1000}};
const sample=costSample(states,{},dashboard,[],[],true,null,now);
assert.equal(sample.battery,-1000);assert.equal(sample.house,6000);assert.equal(sample.audi.power,2000);assert.equal(sample.jeep.power,1000);
const prices=[{start:new Date(now-60000).toISOString(),end:new Date(now+3600000).toISOString(),allInPrice:.3}];
let ledger=costLedgerStep(null,sample,prices,now);ledger=costLedgerStep(ledger,sample,prices,now+60000);
assert(Math.abs(ledger.total.batterySaving-.3/60)<1e-8,'Correct battery role accumulates avoided import');
assert(ledger.total.audiCost>0,'Correct inverter role enables actual net cost allocation');
assert.equal(ledger.total.audiUnpricedKwh,0);
delete states['sensor.growatt_battery_battery_power'];
assert.equal(costSample(states,{},dashboard,[],[],true,null,now).battery,null,'Missing battery data stays unknown');
const stale=now-3600000;
Object.assign(states,{'sensor.ev_charger_status':e('awaiting_authorization','',stale),'sensor.ev_charger_power':e(0,'kW',stale),'sensor.ev_charger_current':e(.59,'A',stale),'binary_sensor.ev_charger_online':e('on','',stale)});
const snapshot={at:now,entities:{...states}};
const idle=costSample(states,{},dashboard,[],[],true,snapshot,now);
assert.equal(idle.audi.connected,true,'Confirmed awaiting authorization records a real plug-in state');
assert.equal(idle.audi.power,0,'A parked meter can retain an old timestamp with confirmed zero');
assert.equal(costSample(states,{},dashboard,[],[],true,{...snapshot,at:now-120000},now).audi.power,null,'Expired confirmation is rejected');
console.log('Cost sampling: canonical mappings, battery saving, both EVs and confirmed idle passed');
