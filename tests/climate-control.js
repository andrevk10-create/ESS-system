const assert=require('node:assert/strict');
const {climateDefaults,climateValidate,climatePlan,climateDecide}=require('../scripts/lib/climate-runtime');
const flows=require('../flows.json');
const get=id=>flows.find(n=>n.id===id);
const now=new Date(2026,0,10,12).getTime();
const copy=x=>JSON.parse(JSON.stringify(x));
function fixture(water=false) {
    const config=climateDefaults();
    config.maximumPowerW=4500;config.phaseWeights=[1/3,1/3,1/3];
    config.rooms[0].role='climate.heating_zone_1';config.rooms[0].enabled=!water;
    config.water={enabled:water,normal:53,buffer:60,minimum:45,litres:260,lossKwhPerDay:1,boostMinutes:60,restoreAcknowledged:true};
    const states={},system={modules:{climate:true},entities:{},specs:{mainFuseA:25,voltage:230,batteryCapacityKwh:30}};
    function add(role,state,attributes={}) {
        if(/vermogen|_power$/.test(role)) attributes={unit_of_measurement:'W',...attributes};
        system.entities[role]=role;states[role]={state:String(state),attributes,last_updated:new Date(now).toISOString()};
    }
    for(let i=1;i<=3;i++) add('sensor.p1_meter_vermogen_fase_'+i,100);
    add('sensor.p1_meter_vermogen',300);add('sensor.flex_load_4_power',500,{unit_of_measurement:'W'});
    add('sensor.growatt_battery_battery_soc',50);add('sensor.growatt_battery_battery_power',0);
    add('sensor.outdoor_temperature',10);
    add('weather.home','cloudy',{temperature_unit:'°C'});
    add('climate.heating_zone_1','auto',{current_temperature:21.1,temperature:21,min_temp:5,max_temp:25,target_temp_step:0.5,hvac_modes:['off','heat','auto'],hvac_action:'idle'});
    add('water_heater.domestic_hot_water','eco',{current_temperature:48,temperature:53,min_temp:40,max_temp:60});
    add('binary_sensor.dhw_hygiene_active','off');
    const prices=Array.from({length:32},(_,i)=>({start:new Date(now+i*900000).toISOString(),end:new Date(now+(i+1)*900000).toISOString(),allInPrice:i===0?.15:.35}));
    return {config,system,states,prices,weather:{at:now,hours:[{at:now+3600000,temperature:5}]},energy:{solarStable:false},now};
}
function command(f,ledger={}) {const plan=climatePlan(f);return {...climateDecide(plan,ledger,f.config,f.now),plan};}
function refresh(f,at) {f.now=at;for(const s of Object.values(f.states)) s.last_updated=new Date(at).toISOString();}

let f=fixture(),r=command(f);
assert.equal(r.actions[0].target,21.5);
assert.equal(r.actions[0].type,'room');
assert.equal(r.plan.signals.netReady,true);
assert.equal(command(f,r.ledger).actions.length,0,'Never resend a pending goal');
f.states['climate.heating_zone_1'].attributes.temperature=21.5;
r=command(f,r.ledger);
assert(r.ledger.room1.lastConfirmed);
assert.equal(r.actions.length,0,'Confirmed leases must not restart every minute');
f.states['climate.heating_zone_1'].attributes.temperature=20;
r=command(f,r.ledger);
assert(r.ledger.room1.manualUntil>now,'Respect an externally changed goal');
assert.equal(r.actions.length,0);

for(const mutate of [
    f=>{f.states['sensor.flex_load_4_power'].state='4501';},
    f=>{f.states['sensor.flex_load_4_power'].state='unknown';},
    f=>{f.states['sensor.flex_load_4_power'].attributes.unit_of_measurement='A';},
    f=>{f.states['sensor.p1_meter_vermogen_fase_2'].state='5000';},
    f=>{f.states['sensor.p1_meter_vermogen_fase_1'].last_updated=new Date(now-16000).toISOString();},
    f=>{f.states['climate.heating_zone_1'].state='heat';},
    f=>{f.states['climate.heating_zone_1'].attributes.preset_mode='away';},
    f=>{f.states['climate.heating_zone_1'].attributes.current_temperature=null;},
    f=>{delete f.states['climate.heating_zone_1'].attributes.min_temp;},
    f=>{f.states['climate.heating_zone_1'].last_updated=new Date(now-21*60000).toISOString();},
    f=>{f.config.mode='off';}, f=>{f.config.mode='advice';},
    f=>{f.system.modules.climate=false;},
    f=>{f.config.maximumPowerW=0;},
    f=>{f.weather=null;},f=>{f.prices=[];},
    f=>{delete f.system.entities['climate.heating_zone_1'];},
]) {f=fixture();mutate(f);assert.equal(command(f).actions.length,0,String(mutate));}
f=fixture();f.states['sensor.flex_load_4_power'].state='4.6';f.states['sensor.flex_load_4_power'].attributes.unit_of_measurement='kW';
assert(climatePlan(f).signals.meterOverLimit);
f=fixture();f.states['climate.heating_zone_1'].attributes.temperature=18;
assert.equal(command(f).actions.length,0,'Do not replace native night setback with invented times');
f.states['climate.heating_zone_1'].attributes.current_temperature=17;
f.states['climate.heating_zone_1'].attributes.temperature=16;
assert.equal(command(f).actions[0].target,18,'Minimum protection within native auto mode');
f=fixture();r=command(f);refresh(f,now+11*60000);r=command(f,r.ledger);
assert(r.ledger.room1.fault);assert.equal(r.actions.length,0,'No endless retry on missing goal feedback');

f=fixture(true);r=command(f);assert.equal(r.actions[0].target,60);
f.states['water_heater.domestic_hot_water'].attributes.temperature=60;
r=command(f,r.ledger);assert(r.ledger.water.lastConfirmed);
refresh(f,now+61*60000);
r=command(f,r.ledger);assert.equal(r.actions[0].target,53);assert.equal(r.actions[0].expectedBefore,60);
f.states['water_heater.domestic_hot_water'].attributes.temperature=53;
r=command(f,r.ledger);assert.equal(r.actions.length,0,'Avoid immediate boost after restoring');
for(const state of ['on','unavailable']) {f=fixture(true);f.states['binary_sensor.dhw_hygiene_active'].state=state;assert.equal(command(f).actions.length,0);}
f=fixture(true);delete f.system.entities['binary_sensor.dhw_hygiene_active'];assert.equal(command(f).actions.length,0,'Unknown hygiene state must not be invented');
f=fixture(true);r=command(f);f.states['water_heater.domestic_hot_water'].attributes.temperature=60;r=command(f,r.ledger);
refresh(f,now+61*60000);f.states['binary_sensor.dhw_hygiene_active'].state='on';
assert.equal(command(f,r.ledger).actions.length,0,'Never lower goal during hygiene cycle');
f.states['binary_sensor.dhw_hygiene_active'].state='off';f.states['water_heater.domestic_hot_water'].attributes.temperature=65;
assert.equal(command(f,r.ledger).actions.length,0,'External higher goal is not ours');

f=fixture();f.prices=[];f.states['sensor.p1_meter_vermogen'].state='-6000';
assert.equal(command(f).actions.length,0,'A single export measurement is not sustained surplus');
f.energy.solarStable=true;assert.equal(command(f).actions.length,1);
f.states['sensor.growatt_battery_battery_power'].state='-6000';assert.equal(command(f).actions.length,0,'Battery export is not free solar');
f=fixture();f.prices=[];f.config.houseReserveKwh=0;f.config.batteryFloorSoc=10;
assert.equal(command(f).actions.length,1,'Genuinely spare energy can preheat');
f.energy.gridChargeOwned=true;assert.equal(command(f).actions.length,0,'Do not consume reserve being filled by grid charging');
f.energy.gridChargeOwned=false;f.states['sensor.growatt_battery_battery_soc'].last_updated=new Date(now-6*60000).toISOString();
assert.equal(command(f).actions.length,0,'Fresh power does not make stale SOC valid');
f=fixture();f.prices[1].allInPrice=.10;f.prices[2].allInPrice=.10;
assert.equal(climatePlan(f).signals.cheap,false,'Wait for the lower priced future quarter when comfort allows');
f=fixture();f.states['sensor.growatt_battery_battery_soc'].state='80';
assert.equal(climatePlan(f).signals.spareKwh,9,'House reserve and SOC floor are overlapping protections, not duplicate energy');

assert.throws(()=>climateValidate({...climateDefaults(),maximumPowerW:4500}),/Faseverdeling/);
f=fixture();f.config.rooms[1]={...f.config.rooms[0],key:'room2'};assert.throws(()=>climateValidate(f.config),/dezelfde rol/);
f=fixture(true);f.config.water.buffer=61;assert.throws(()=>climateValidate(f.config),/tapwater/);

// Exercise generated functions and the actual disk-before-command route.
f=fixture();let clock=now;
class FixedDate extends Date {constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}}
const values={ess_system_config:f.system,ess_climate_config:f.config,ess_charging_preferences_ready:true,ess_nordpool_forecast:f.prices,ess_nordpool_forecast_meta:{updatedAt:new Date(now).toISOString()},ess_climate_weather:f.weather};
const flow={get:k=>values[k],set:(k,v)=>values[k]=v},global={get:()=>({homeAssistant:{states:f.states}})},node={status(){},warn(){},error(){}};
const run=(id,msg={})=>new Function('flow','global','node','msg','Date',get(id).func)(flow,global,node,msg,FixedDate);
new Function('flow','Date',get('essclim_plan').initialize)(flow,FixedDate);
assert.equal(run('essclim_dispatch',{payload:'{}'}),null);
const output=run('essclim_plan');assert(output[0]);assert(values.ess_climate_outbox.actions.length);
assert.deepEqual(get('essclim_plan').wires,[['essprefs_save'],['esswithist_api001']]);
assert(get('essprefs_backup_write').wires[0].includes('essclim_dispatch'));
const saved=run('essprefs_save');assert(JSON.parse(saved.payload).climate);
assert.equal(run('essclim_dispatch',{payload:'{}'}),null);
let dispatched=run('essclim_dispatch',saved);
assert.equal(dispatched[0][0].payload.target,21.5);assert.equal(dispatched[1],null);
assert.equal(run('essclim_dispatch',saved),null,'A saved message cannot repeat a command');
values.ess_climate_outbox={at:now-1,actions:[]};assert.equal(run('essclim_dispatch',saved),null,'No old outbox replay after restart');
values.ess_charging_preferences_ready=false;assert.equal(run('essclim_plan'),null);
values.ess_climate_config=null;values.ess_climate_ledger=null;
run('essprefs_restore',saved);assert.deepEqual(values.ess_climate_config,climateValidate(f.config));assert(values.ess_climate_ledger.room1.pending);
for(const id of ['essclim_tado','essclim_water']) {assert.equal(get(id).blockInputOverrides,true);assert.equal(get(id).queue,'none');assert(get(id).data.includes('$assert'));}
assert.equal(get('essclim_tado').action,'tado.set_climate_timer');assert(get('essclim_tado').data.includes('00:30:00'));
assert.equal(get('essclim_water').action,'water_heater.set_temperature');
assert(get('esstpl_climate01').format.includes('Bestaand Tado-schema volgen'));
assert(get('esstpl_climate01').format.includes('Slim klimaat'));
assert.equal(run('essclim_weather_request').payload.data.return_response,true);
run('essclim_weather_parse',{forecast:{response:{'weather.home':{forecast:[{datetime:new Date(now+3600000).toISOString(),temperature:7}]}}}});
assert.equal(values.ess_climate_weather.hours[0].temperature,7);
const forecastBefore=copy(values.ess_climate_weather);
run('essclim_weather_parse',{forecast:{response:{'weather.home':{forecast:[{datetime:'invalid',temperature:999}]}}}});
assert.deepEqual(values.ess_climate_weather,forecastBefore);
async function actionContracts() {
    const jsonata=require('jsonata');
    const bindings={flowContext:key=>values[key]};
    const room=await jsonata(get('essclim_tado').data).evaluate({payload:{entity:'climate.heating_zone_1',target:21.5}},bindings);
    assert.deepEqual(room,{entity_id:'climate.heating_zone_1',temperature:21.5,time_period:'00:30:00'});
    await assert.rejects(()=>jsonata(get('essclim_tado').data).evaluate({payload:{entity:'climate.heat_pump',target:21}},bindings));
    const water=await jsonata(get('essclim_water').data).evaluate({payload:{entity:'water_heater.domestic_hot_water',target:60}},bindings);
    assert.deepEqual(water,{entity_id:'water_heater.domestic_hot_water',temperature:60});
    await assert.rejects(()=>jsonata(get('essclim_water').data).evaluate({payload:{entity:'water_heater.unmapped',target:60}},bindings));
    console.log('Climate control: safety gates, native schedules, leases, manual overrides, hygiene guard, persisted dispatch and action allowlists passed.');
}
actionContracts().catch(error=>{console.error(error);process.exitCode=1;});
