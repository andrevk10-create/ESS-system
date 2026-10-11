const assert=require('node:assert/strict');
const runtime=require('../scripts/lib/climate-runtime');
const {tadoHysteresis,tadoCommandAllowed}=require('../scripts/lib/tado-hysteresis-runtime');
Object.assign(global,runtime);
const flows=require('../flows.json'),get=id=>flows.find(n=>n.id===id);
function fixture(local=false) {
    const config=runtime.climateDefaults();
    Object.assign(config.heatSource,{enabled:true,adapter:local?'switch':'tado-zone',entity:local?'switch.heat_contact':'climate.control_zone',roomRoles:['climate.heating_zone_1','climate.heating_zone_2'],roomsDetached:true,offScheduleConfirmed:true,relayTested:true,watchdogConfirmed:true});
    const f={now:1800000000000,config:runtime.climateValidate(config),system:{modules:{climate:true},climateRegistry:{'climate.control_zone':{platform:'tado'}},entities:{'climate.heating_zone_1':'climate.room1','climate.heating_zone_2':'climate.room2'}},states:{},ledger:{},local};
    f.room=(n,temp,target,mode='heat',preset='home')=>{f.states['climate.room'+n]={state:mode,last_updated:new Date(f.now).toISOString(),attributes:{current_temperature:temp,temperature:target,preset_mode:preset,friendly_name:'Room '+n}};};
    f.source=(on,temp=18,target=25)=>{f.states[f.config.heatSource.entity]={state:local?(on?'on':'off'):(on?'heat':'off'),last_updated:new Date(f.now).toISOString(),attributes:local?{}:{current_temperature:temp,temperature:on?target:5,min_temp:5,max_temp:25,hvac_modes:['off','heat','auto'],hvac_action:on?'heating':'off'}};};
    f.advance=(ms=60000)=>{f.now+=ms;for(const e of Object.values(f.states))e.last_updated=new Date(f.now).toISOString();};
    f.step=()=>{const r=tadoHysteresis(f);f.ledger=r.ledger;return r;};
    f.accept=()=>{f.ledger.source.serviceAcceptedAt=f.ledger.source.pending.at;};
    f.room(1,19.4,20);f.room(2,21,21);f.source(false);return f;
}
let f=fixture(),r=f.step();assert.equal(r.actions.length,0,'Initial five minute rest');
f.advance(300000);r=f.step();assert.equal(r.actions[0].on,true);assert.equal(r.actions[0].entity,'climate.control_zone');
assert.equal(f.step().actions.length,0,'Single pending operation');
f.accept();f.advance();f.source(true);r=f.step();assert.equal(r.sourceStatus.confirmed,true);
f.room(1,19.8,20);assert.equal(f.step().status[0].active,true,'Keep demand inside deadband');
f.room(1,20,20);r=f.step();assert.equal(r.actions.length,0,'Ten minute minimum on time');
f.room(2,20.4,21);r=f.step();assert.equal(r.sourceStatus.requested,true,'A second cold room keeps shared source active');
f.advance(600000);r=f.step();assert.equal(r.actions[0].renew,true,'Renew bounded lease only while demand remains');
const initialSwitch=f.ledger.source.lastSwitch;f.accept();f.advance();f.source(true);f.step();assert.equal(f.ledger.source.lastSwitch,initialSwitch,'Renewal does not reset minimum runtime');
f.room(2,21,21);r=f.step();assert.equal(r.actions[0].on,false);f.accept();f.advance();f.source(false);f.step();
assert.equal(f.ledger.source.owned,false);assert.equal(f.ledger.source.fault,undefined,'Normal OFF is not a manual override');
f.advance(300000);f.room(1,19.5,20);r=f.step();assert.equal(r.actions[0].on,true,'Exact 0.5 degree threshold');
f.accept();f.advance();f.source(true);f.step();
f.room(1,19.5,19);r=f.step();assert.equal(r.status[0].target,19);assert.equal(r.status[0].active,false,'Lower physical setpoint wins');
f.room(2,20,21,'off');assert.equal(f.step().status[1].active,false,'Physical OFF cancels room demand');
f.room(1,18,20,'heat','away');assert.equal(f.step().sourceStatus.requested,false,'Away respected');
f.room(1,18,20);f.states['climate.room2'].last_updated=new Date(f.now-11*60000).toISOString();r=f.step();assert.equal(r.actions[0].on,false,'Missing selected room forces owned request OFF');
assert.equal(r.sourceStatus.requested,false);f.accept();f.advance();f.source(false);f.step();
f.ledger=JSON.parse(JSON.stringify(f.ledger));f.advance(300000);f.room(1,18,20);f.room(2,20.8,21);r=f.step();assert.equal(r.actions[0].on,true,'Persistent source and room latches survive restart');
f.accept();f.advance();f.source(true);f.step();f.advance();f.source(false);r=f.step();assert.equal(r.sourceStatus.fault,true,'Unexpected source OFF cannot be restarted automatically');
f.advance(600000);assert.equal(f.step().actions.length,0);
// A failed or never delivered command must not count as an accepted timer.
f=fixture();f.step();f.advance(300000);f.step();f.advance();f.source(true);assert.equal(f.step().sourceStatus.confirmed,false);
f.advance(720000);r=f.step();assert.equal(r.sourceStatus.fault,true);assert.equal(r.actions.length,0,'No repeated ON after missing confirmation');
// A native OFF schedule after the complete lease is normal, but still requires rest.
f=fixture();f.step();f.advance(300000);f.step();f.accept();f.advance();f.source(true);f.step();
f.advance(1200000);f.source(false);r=f.step();assert.equal(r.sourceStatus.fault,false);assert.equal(r.actions.length,0);
f.advance(300000);assert.equal(f.step().actions[0].on,true);
// Dedicated measuring device must stay sufficiently below the request target.
f=fixture();f.source(false,24);f.step();f.advance(300000);r=f.step();assert.equal(r.actions.length,0);assert.match(r.sourceStatus.reason,/te warm/);
f.states[f.config.heatSource.entity].attributes.min_temp=30;f.states[f.config.heatSource.entity].attributes.max_temp=45;assert.equal(f.step().actions.length,0,'Never treat EHS water circuit as Tado control zone');
f=fixture();f.config.heatSource.entity='climate.room1';f.step();f.advance(300000);assert.equal(f.step().actions.length,0,'Actuator cannot also be a room input');
f=fixture();f.system.entities['climate.heating_zone_2']='climate.room1';f.step();f.advance(300000);assert.equal(f.step().actions.length,0,'Duplicate mappings are incomplete');
f=fixture();f.config.heatSource.enabled=false;f.step();f.advance(300000);assert.equal(f.step().actions.length,0);
// Local contact path consumes the same thermostat inputs; no Tado service is needed.
f=fixture(true);f.step();f.advance(300000);r=f.step();assert.equal(r.actions[0].adapter,'switch');f.accept();f.advance();f.source(true);assert.equal(f.step().sourceStatus.confirmed,true);
f.config.mode='off';r=f.step();assert.equal(r.actions[0].on,false,'Disabling stops owned contact immediately');
f.accept();f.advance();f.source(false);f.step();assert.equal(f.ledger.source.owned,false);
f=fixture(true);f.config.heatSource.watchdogConfirmed=false;f.step();f.advance(300000);assert.equal(f.step().actions.length,0,'Hardware timeout must be commissioned');
// Generated persisted dispatch and actual HA routes.
for(const local of [false,true]) {
    f=fixture(local);f.step();f.advance(300000);const command=f.step().actions[0];
    assert.equal(tadoCommandAllowed({...f,command}),true);
    const context={ess_charging_preferences_ready:true,ess_climate_config:f.config,ess_system_config:f.system,ess_climate_registry:{entities:f.system.climateRegistry},ess_climate_ledger:{hysteresis:f.ledger},ess_tado_hysteresis_boot:f.now-1000,ess_tado_hysteresis_outbox:{at:f.now,actions:[command]}};
    const flow={get:k=>context[k],set:(k,v)=>context[k]=v},globalContext={get:()=>({homeAssistant:{states:f.states}})};
    const run=new Function('msg','flow','global','Date',get('essclim_hyst_dispatch').func),clock=class extends Date{static now(){return f.now;}};
    const msg={payload:JSON.stringify({climate:{config:f.config,ledger:{hysteresis:f.ledger}}})};
    const result=run(msg,flow,globalContext,clock);assert.equal(result[local?2:0][0].payload.entity,f.config.heatSource.entity);
    assert.equal(run(msg,flow,globalContext,clock),null,'Intent consumed once');
    context.ess_tado_hysteresis_outbox={at:f.now,actions:[command]};f.room(1,19.4,18);
    assert.deepEqual(run(msg,flow,globalContext,clock),[null,null,null,null],'Last-second knob change drops queued heat');
    f.room(1,19.4,20);context.ess_tado_hysteresis_outbox={at:f.now,actions:[command]};
    assert.deepEqual(run({payload:JSON.stringify({climate:{config:f.config,ledger:{}}})},flow,globalContext,clock),[null,null,null,null],'Primary and backup must contain intent');
    const accepted=new Function('msg','flow',get('essclim_hyst_accepted').func);
    accepted({payload:command},flow);assert.equal(f.ledger.source.serviceAcceptedAt,command.at);
    const preferences=require('../scripts/lib/charging-preferences').chargingPreferences(flow);
    assert.equal(preferences.climate.config.heatSource.entity,f.config.heatSource.entity);assert.deepEqual(preferences.climate.ledger.hysteresis,f.ledger);
}
// Reconfiguring a running contact cannot orphan it.
f=fixture();f.step();f.advance(300000);f.step();
const context={ess_charging_preferences_ready:true,ess_climate_config:f.config,ess_climate_ledger:{hysteresis:f.ledger}},warnings=[];
const flow={get:k=>context[k],set:(k,v)=>context[k]=v},node={warn:t=>warnings.push(t)};
const settings=new Function('msg','flow','node','global',get('essclim_settings').func);
settings({topic:'ess/climate/automation-save',payload:{...f.config,heatSource:{...f.config.heatSource,entity:'climate.other'}}},flow,node,{});
assert.equal(context.ess_climate_config.heatSource.entity,'climate.control_zone');assert.match(warnings[0],/eerst uit/);
assert.equal(get('essclim_hyst_heat').action,'tado.set_climate_timer');assert.equal(get('essclim_hyst_switch_on').action,'switch.turn_on');
assert.equal(get('essclim_hyst_off').action,'climate.set_hvac_mode');assert.equal(get('essclim_hyst_heat').queue,'none');
assert.equal(get('essclim_hyst_auto'),undefined,'No write to room or AUTO overlay remains');
assert.ok(get('essclim_hyst_heat').data.includes('payload.duration'));
const missing=runtime.climateDefaults();missing.heatSource.enabled=true;assert.throws(()=>runtime.climateValidate(missing));
assert.equal(runtime.climateValidate({version:1}).heatSource.enabled,false,'Old backups migrate without activating unknown hardware');
console.log('Separate heat source: shared hysteresis, read-only knobs, device leases, local contact, persistence and dispatch passed');
