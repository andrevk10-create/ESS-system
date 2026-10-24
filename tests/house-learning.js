const assert = require('node:assert/strict');
const flows = require('../flows.json');
const { housePowerSample, houseLearningStep } = require('../scripts/lib/house-learning');

const start = new Date(2026, 8, 7, 12).getTime();
let now = start;
class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
}
const reading = (value, unit = 'W', at = now) => ({ state:String(value),
    attributes:{ unit_of_measurement:unit }, last_reported:new Date(at).toISOString() });
const runHistory = new Function('global', 'flow', 'node', 'msg', 'Date', flows.find(n => n.id === 'esswithist_prep1').func);
const primary = 'sensor.ev_charger_power';
const secondary = 'sensor.ev_charger_2_power';
const fixture = () => ({
    states:{
        'sensor.p1_meter_vermogen':reading(13000),
        'sensor.growatt_solar_system_output_power':reading(0),
        [primary]:reading(11, 'kW'), [secondary]:reading(1000),
        'sensor.ev_charger_status':reading('charging', ''),
        'sensor.ev_charger_2_status':reading('charging', '')
    },
    values:{ ess_system_config:{ entities:{} }, ess_dashboard_live:{ house:{power:13000}, updatedAt:new Date(now).toISOString() } }
});
function run(f) {
    const output = runHistory({get:()=>({homeAssistant:{states:f.states}})},
        {get:key=>f.values[key], set:(key,value)=>{f.values[key]=value;}}, {status:()=>{}}, {}, Clock);
    return { model:f.values.ess_house_consumption_learning,
        sensor:output[0].find(m=>m.payload.path === 'states/sensor.ess_woningverbruik_basis_verwacht_morgen').payload.data };
}
function refresh(f, elapsed = 60000) {
    now += elapsed;
    f.values.ess_dashboard_live.updatedAt = new Date(now).toISOString();
    for (const value of Object.values(f.states)) value.last_reported = new Date(now).toISOString();
}

let f = fixture();
let result = run(f);
assert.equal(result.model.lastBasePowerW, 1000, 'Both chargers must be excluded, accepting W and kW');
assert.equal(result.sensor.attributes.excluded_ev_power_w, 12000);
refresh(f);
result = run(f);
assert(Math.abs(result.model.currentValueKwh - 1 / 60) < 1e-10, 'Only 1 kW of actual household demand is integrated');

// The controller can detect charging while the primary meter is missing or
// frozen at zero. It is not itself a trustworthy household-subtraction meter.
for (const badPower of ['unavailable', 'unknown', '', '0']) {
    f = fixture();
    f.states[primary] = reading(badPower, 'kW');
    f.values.ess_audi_control_status = { actualCharging:true, chargerPowerW:11000, updatedAt:new Date(now).toISOString() };
    result = run(f);
    assert.equal(result.model.lastBasePowerW, null, 'An unknown or contradicted zero must not become household consumption');
    assert.equal(result.sensor.attributes.sample_valid, false);
    assert.equal(result.model.coverageHours, 0);
}
f = fixture();
f.states[primary] = reading(0, 'kW', now - 900000);
assert.equal(run(f).model.lastBasePowerW, null, 'A stale zero must not include the Audi');
f.states[primary] = reading(11, 'kW', now - 900000);
assert.equal(run(f).model.lastBasePowerW, null, 'A stale nonzero reading is unsuitable for learning too');
f = fixture();
f.states[secondary] = reading('unavailable');
assert.equal(run(f).model.lastBasePowerW, null, 'A missing second-charger reading must not leak into the household');

// Resume after bad data without integrating across the gap, including a restart
// with an explicit null previous sample and unrelated old HA attributes.
f = fixture();
run(f);
refresh(f);
f.states[primary] = reading('unavailable');
run(f);
refresh(f);
f.states[primary] = reading(11, 'kW');
f.states['sensor.ess_woningverbruik_basis_verwacht_morgen'] = { state:'29.2', attributes:{last_base_power_w:13000} };
assert.equal(run(f).model.currentValueKwh, 0, 'Do not bridge an invalid interval with an old HA sample');
refresh(f);
assert(Math.abs(run(f).model.currentValueKwh - 1 / 60) < 1e-10);
refresh(f, 3600000);
assert(Math.abs(run(f).model.currentValueKwh - 1 / 60) < 1e-10, 'Do not integrate across a long restart gap');

f = fixture();
f.states[primary] = reading(0, 'kW', now - 3600000);
f.states['sensor.ev_charger_status'] = reading('awaiting_authorization', '');
f.values.ess_dashboard_live.house.power = 2000;
assert.equal(run(f).model.lastBasePowerW, 1000, 'Fresh idle status may confirm zero when a parked meter does not change');
f.states['sensor.ev_charger_current'] = reading(16, 'A');
assert.equal(run(f).model.lastBasePowerW, null, 'Measured charging current must invalidate contradictory idle/zero');
f.states['sensor.ev_charger_current'] = reading(0.59, 'A');
assert.equal(run(f).model.lastBasePowerW,1000,'A zero power meter and idle status tolerate a sub-ampere residual');
{
 const {houseLearningRefreshResult}=require('../scripts/lib/house-learning-refresh');
 const config={entities:{}},values={},cache={homeAssistant:{isConnected:true,states:{}}};
 const flow={get:k=>k==='ess_system_config'?config:values[k],set:(k,v)=>values[k]=v};
 const global={get:()=>cache,set:()=>{}};
 const old=reading(0,'kW',now-3600000);
 old.entity_id=secondary;
 houseLearningRefreshResult(flow,global,{actual:[old]},now);
 assert.equal(cache.homeAssistant.states[secondary].last_reported,old.last_reported,'REST reads preserve actual old timestamps');
 const states={...fixture().states,[secondary]:old,'sensor.ev_charger_2_status':{...reading('disconnected','',now-3600000),entity_id:'sensor.ev_charger_2_status'},
 'sensor.ev_charger_2_current':{...reading(0,'A',now-3600000),entity_id:'sensor.ev_charger_2_current'},
 'binary_sensor.ev_charger_2_online':{...reading('on','',now-3600000),entity_id:'binary_sensor.ev_charger_2_online'}};
 const snapshot={at:now,entities:states};
 assert.equal(housePowerSample(states,config,fixture().values.ess_dashboard_live,{},now,snapshot).evPowerW,11000,'An online disconnected charger with matching REST zero readings is excluded');
 assert.equal(housePowerSample(states,config,fixture().values.ess_dashboard_live,{},now,{...snapshot,at:now-120000}).basePowerW,null,'Expired REST confirmation cannot validate stale readings');
 const mismatch={...snapshot,entities:{...states,[secondary]:{...old,state:'4'}}};
 assert.equal(housePowerSample(states,config,fixture().values.ess_dashboard_live,{},now,mismatch).basePowerW,null,'Conflicting snapshots cannot confirm idle');
}

f = fixture();
f.values.ess_dashboard_live.updatedAt = new Date(now - 60000).toISOString();
assert.equal(run(f).model.lastBasePowerW, null, 'Reject an old dashboard snapshot');
f = fixture();
f.states['sensor.p1_meter_vermogen'] = reading(13000, 'W', now - 900000);
assert.equal(run(f).model.lastBasePowerW, null, 'Dashboard refresh cannot make old P1 telemetry fresh');
f = fixture();
delete f.states['sensor.growatt_solar_system_output_power'];
assert.equal(run(f).model.lastBasePowerW, null, 'Do not learn from the partial backup-load fallback');
f = fixture();
f.states['sensor.pv_array_1_power'] = reading(2000, 'W', now - 3600000);
assert.equal(run(f).model.lastBasePowerW, null, 'Reject incomplete daytime solar balance');
f.states['sun.sun'] = reading('below_horizon', '');
assert.equal(run(f).model.lastBasePowerW, 1000, 'At night the dashboard correctly treats external solar as zero');

f = fixture();
f.values.ess_system_config.entities[primary] = 'sensor.missing_custom_power';
assert.equal(run(f).model.lastBasePowerW, null, 'A missing explicit mapping must not fall back to another canonical charger');
f.states['sensor.missing_custom_power'] = reading(11, 'kW');
assert.equal(run(f).model.lastBasePowerW, 1000, 'Use the configured live meter');
f = fixture();
f.values.ess_system_config.entities[secondary] = primary;
f.values.ess_dashboard_live.house.power = 12000;
assert.equal(run(f).model.lastBasePowerW, 1000, 'A duplicate mapping must only be subtracted once');
f = fixture();
delete f.states[secondary];
delete f.states['sensor.ev_charger_2_status'];
f.values.ess_dashboard_live.house.power = 12000;
assert.equal(run(f).model.lastBasePowerW, 1000, 'An absent optional charger is not missing telemetry');
f = fixture();
f.states[primary] = reading(11, 'A');
assert.equal(run(f).model.lastBasePowerW, null, 'Unsupported units must not be assumed to be watts');
f = fixture();
f.values.ess_dashboard_live.house.power = 1000;
assert.equal(run(f).model.lastBasePowerW, null, 'A contradictory energy balance must not be clamped into valid learning');

now = start;
const oldModel = { recentDays:[{date:'2026-09-05', kwh:29.2}], currentDate:'2026-09-06', currentValueKwh:44,
    coverageHours:24, lastBasePowerW:12000, lastSampleAt:new Date(now - 60000).toISOString(), forecastKwh:29.2 };
f = fixture();
f.values.ess_house_consumption_learning = oldModel;
f.states['sensor.ess_woningverbruik_basis_verwacht_morgen'] = { state:'29.2', attributes:{
    recent_days:oldModel.recentDays, current_date:oldModel.currentDate, current_value_kwh:44, coverage_hours:24 } };
result = run(f);
assert.equal(result.model.schemaVersion, 2);
assert.equal(result.model.forecastKwh, 10, 'Version 1 must be replaced by the profile bootstrap');
assert.equal(result.model.currentValueKwh, 0);
assert.deepEqual(result.model.recentDays, [], 'Old current-day samples must not be promoted to a clean completed day');
delete f.values.ess_house_consumption_learning;
assert.equal(run(f).model.forecastKwh, 10, 'A restart must not restore version 1 from HA');

f = fixture();
f.values.ess_house_consumption_learning = { ...oldModel, schemaVersion:2, currentValueKwh:18, coverageHours:24,
    recentDays:[{date:'2026-09-05', kwh:20}] };
result = run(f);
assert.equal(result.model.forecastKwh, 19, 'Clean completed days determine the median');
assert.equal(result.model.recentDays.length, 2);
f.states['sensor.ess_woningverbruik_basis_verwacht_morgen'] = { state:String(result.sensor.state), attributes:result.sensor.attributes };
delete f.values.ess_house_consumption_learning;
assert.equal(run(f).model.forecastKwh, 19, 'Clean version 2 persists through Home Assistant restoration');

f = fixture();
f.values.ess_house_consumption_learning = { ...oldModel, schemaVersion:2, recentDays:[], coverageHours:17 };
assert.equal(run(f).model.recentDays.length, 0, 'Insufficient coverage must not create a completed day');
f = fixture();
f.values.ess_house_consumption_learning = { ...oldModel, schemaVersion:2, recentDays:[], currentValueKwh:18, coverageHours:18 };
assert.equal(run(f).model.forecastKwh, 24, 'Sufficiently measured days retain the existing 24-hour normalization');

const runMapper = new Function('global', 'flow', 'node', 'msg', 'Date', flows.find(n => n.id === 'ess00000000000a').func);
f = fixture();
f.values.ess_house_consumption_learning = oldModel;
f.states['sensor.ess_woningverbruik_basis_verwacht_morgen'] = { state:'29.2', attributes:{} };
const map = () => {
    runMapper({get:()=>({homeAssistant:{states:f.states}})},
        {get:key=>f.values[key], set:(key,value)=>{f.values[key]=value;}}, {status:()=>{}}, {}, Clock);
    return f.values.ess_dashboard_live;
};
assert.equal(map().house.forecastBaseTomorrow, 10, 'Dashboard must not resurrect the old learned reserve before the first history tick');
delete f.values.ess_house_consumption_learning;
f.states['sensor.ess_woningverbruik_basis_verwacht_morgen'].attributes.model_version = 2;
assert.equal(map().house.forecastBaseTomorrow, 29.2, 'Dashboard can restore a compatible published forecast');

// Ensure generation embeds these exact tested helpers, without divergent copies.
{
 const t=Date.parse('2026-10-24T23:59:00+02:00');
 const previous={schemaVersion:2,currentDate:'2026-10-24',recentDays:[],currentValueKwh:18,coverageHours:18,lastBasePowerW:1000,lastSampleAt:new Date(t).toISOString()};
 const next=houseLearningStep(previous,null,{basePowerW:3000,reason:'OK'},t+120000,10,'normal');
 assert.equal(next.currentDate,'2026-10-25');
 assert(Math.abs(next.currentValueKwh-2.5/60)<1e-9,'The post-midnight minute is retained with interpolated power');
 assert(Math.abs(next.coverageHours-1/60)<1e-9);
 assert(Math.abs(next.recentDays[0].kwh-(18+1.5/60)*24/(18+1/60))<1e-9,'The pre-midnight minute belongs to the completed day');
 const gap=houseLearningStep(previous,null,{basePowerW:3000,reason:'OK'},t+600000,10,'normal');
 assert.equal(gap.currentValueKwh,0,'Midnight never bridges a long measurement gap');
 const invalid=houseLearningStep(previous,null,{basePowerW:null,reason:'Missing'},t+120000,10,'normal');
 assert.equal(invalid.currentValueKwh,0,'Midnight never interpolates through an invalid sample');
}
{
 const f=fixture();f.states[secondary]=reading(0);f.states['sensor.ev_charger_2_status']=reading('idle','');
 const active={actualCharging:true,updatedAt:new Date(now).toISOString()};
 assert.equal(housePowerSample(f.states,{},f.values.ess_dashboard_live,{},now,null,active).basePowerW,null,'Second controller can veto a contradictory zero meter too');
 delete f.states[secondary];delete f.states['sensor.ev_charger_2_status'];
 f.states['sensor.ev_charger_2_current']=reading(16,'A');
 assert.equal(housePowerSample(f.states,{},f.values.ess_dashboard_live,{},now).basePowerW,null,'A current-only charger is installed, not an absent optional charger');
}
const generated = flows.find(n=>n.id === 'esswithist_prep1').func;
assert(generated.includes(housePowerSample.toString()));
assert(generated.includes(houseLearningStep.toString()));
console.log('Household learning: both chargers, stale/unknown data, units, mappings, gaps, coverage and versioned restoration OK');
