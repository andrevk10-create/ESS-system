const assert=require('node:assert/strict');
const flows=require('../flows.json');
const {evPeerReservation}=require('../scripts/lib/second-ev');
const {chargingPreferences}=require('../scripts/lib/charging-preferences');
const get=id=>flows.find(n=>n.id===id);
let now=Date.parse('2026-10-10T12:30:00Z');
class Clock extends Date {constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
const reading=(state,unit='',attributes={})=>({state:String(state),attributes:{unit_of_measurement:unit,...attributes},last_updated:new Clock().toISOString()});
function fixture(){
    const values={ess_charging_preferences_ready:true,ess_jeep_smart_enabled:true,ess_jeep_force_full:true,
        ess_jeep_manual_soc:{soc:40,at:now},ess_jeep_settings:{departureSoc:80,solarSoc:90,departureTime:'07:00'},
        ess_system_config:{specs:{ev2BatteryCapacityKwh:54,ev2MaximumCurrentA:16,mainFuseA:25,voltage:230}},
        ess_nordpool_forecast:[{start:new Clock().toISOString(),end:new Clock(now+900000).toISOString(),allInPrice:.1,marketPrice:.02}]
    };
    const states={
        'sensor.ev_charger_status':reading('ready_to_charge','',{id:'left'}),
        'sensor.ev_charger_2_status':reading('ready_to_charge','',{id:'right',state_outputPhase:30,config_phaseMode:3}),
        'sensor.ev_charger_2_power':reading(0,'kW'),'sensor.ev_charger_2_current':reading(0,'A'),
        'binary_sensor.ev_charger_2_online':reading('on'),
        'sensor.p1_meter_vermogen':reading(0,'W'),'sensor.ev_charger_power':reading(0,'kW')
    };
    for(let i=1;i<=3;i++)states['sensor.p1_meter_vermogen_fase_'+i]=reading(0,'W');
    const flow={get:k=>values[k],set:(k,v)=>values[k]=v};
    const run=(id,msg={})=>new Function('flow','global','node','msg','Date',get(id).func)(flow,{get:()=>({homeAssistant:{states}})},{status(){},warn(){}},msg,Clock);
    return {values,states,flow,run};
}
let f=fixture();let out=f.run('essjeep_ess00000000000d');
assert.equal(f.values.ess_jeep_control_status.targetCurrent,16,'Direct Jeep charging respects 16 A maximum');
assert.equal(out[0].payload.chargerId,'right');
assert.equal(out[1].payload.chargerId,'right');
assert.equal(f.values.ess_jeep_control_status.estimatedEVSoc,40);
assert.equal(f.values.ess_audi_control_status,undefined,'Jeep never changes Audi state');
{
    const live=fixture();delete live.values.ess_jeep_manual_soc;
    live.states['sensor.jeep_test_hvbattery_charge']=reading(65,'%');
    live.states['sensor.jeep_test_last_info_update_at']=reading(new Clock().toISOString());
    live.run('essjeep_ess00000000000d');
    assert.equal(live.values.ess_jeep_control_status.estimatedEVSoc,65,'Real vehicle SOC replaces manual input');
    assert.equal(live.values.ess_jeep_control_status.targetCurrent,16);
    assert(live.run('essjeep_guard_ess00000000000f',{payload:{chargerId:'right',command:'start'}}),'Real SOC also passes the dispatch guard');
    live.states['sensor.jeep_test_last_info_update_at'].state=new Clock(now-1800001).toISOString();
    live.run('essjeep_ess00000000000d');
    assert.equal(live.values.ess_jeep_control_status.targetCurrent,0,'Old vehicle data without manual fallback stops charging');
}
f.run('essjeep_settings',{topic:'ess/jeep/departure-soc',payload:85});
assert.equal(f.values.ess_jeep_settings.departureSoc,85);
assert.equal(chargingPreferences(f.flow).ev2.departureSoc,85);
f.run('essjeep_settings',{topic:'ess/jeep/manual-soc',payload:''});
assert.equal(f.values.ess_jeep_manual_soc.soc,40,'Empty SOC is not zero');
f.run('essjeep_settings',{topic:'ess/jeep/manual-soc',payload:0});
assert.equal(f.values.ess_jeep_manual_soc.soc,0,'A real zero is allowed');
for(const condition of ['missing-soc','expired-soc','unplugged','same-charger']){
    f=fixture();
    if(condition==='missing-soc')delete f.values.ess_jeep_manual_soc;
    if(condition==='expired-soc')f.values.ess_jeep_manual_soc.at=now-43200001;
    if(condition==='unplugged')f.states['sensor.ev_charger_2_status'].state='disconnected';
    if(condition==='same-charger')f.states['sensor.ev_charger_2_status'].attributes.id='left';
    if(condition==='stale-p1')f.states['sensor.p1_meter_vermogen_fase_1'].last_updated=new Clock(now-15001).toISOString();
    f.run('essjeep_ess00000000000d');
    assert.equal(f.values.ess_jeep_control_status.targetCurrent,0,condition+' prevents charging');
}
f=fixture();delete f.states['sensor.p1_meter_vermogen'];for(let i=1;i<=3;i++)delete f.states['sensor.p1_meter_vermogen_fase_'+i];f.run('essjeep_ess00000000000d');assert.equal(f.values.ess_jeep_control_status.targetCurrent,16,'Direct charging does not require P1 phase data when Easee owns protection');
f=fixture();f.values.ess_audi_control_status={targetCurrent:16,phaseCount:3,updatedAt:new Clock().toISOString()};
f.run('essjeep_ess00000000000d');
assert.equal(f.values.ess_jeep_control_status.targetCurrent,16,'Both charging intents are sent; Easee allocates the phase capacity');
f=fixture();f.values.ess_audi_control_status={targetCurrent:16,phaseCount:3,updatedAt:new Clock().toISOString()};
f.states['sensor.ev_charger_power']=reading(11040,'W');
for(let i=1;i<=3;i++)f.states['sensor.p1_meter_vermogen_fase_'+i]=reading(3680,'W');
f.run('essjeep_ess00000000000d');
assert.equal(f.values.ess_jeep_control_status.targetCurrent,16,'Measured Audi load does not create a second ESS phase limit');
assert.equal(evPeerReservation({targetCurrent:16,updatedAt:new Clock().toISOString()},11040,3,now,230),0);
f=fixture();f.run('essjeep_ess00000000000d');now+=60000;
f.states['sensor.ev_charger_2_status'].state='charging';
f.states['sensor.ev_charger_2_current']=reading(16,'A');f.states['sensor.ev_charger_2_power']=reading(11.04,'kW');
for(const id of Object.keys(f.states))f.states[id].last_updated=new Clock().toISOString();
f.run('essjeep_ess00000000000d');
assert(f.values.ess_jeep_control_status.estimatedEVSoc>40,'Manual SOC advances using measured charging');
assert(Math.abs(f.values.ess_jeep_control_status.estimatedEVSoc-(40+11.04/60*.92/54*100))<.0001,'SOC estimation uses the Jeep’s 54 kWh battery');
assert(f.run('essjeep_guard_ess00000000000f',{payload:{chargerId:'right',command:'start'}}));
assert.equal(f.run('essjeep_guard_ess00000000000f',{payload:{chargerId:'left',command:'start'}}),null,'A queued command cannot switch cars');
f.values.ess_jeep_smart_enabled=false;
assert.equal(f.run('essjeep_guard_ess00000000000f',{payload:{chargerId:'right',command:'start'}}),null,'A delayed retry cannot restart a disabled controller');
assert(f.run('essjeep_guard_ess00000000000f',{payload:{chargerId:'right',command:'stop'}}),'Stopping remains available');
for(const n of flows.filter(n=>n.id.startsWith('essjeep_'))){
    assert(!n.wires.flat().some(id=>['ess00000000000e','ess00000000000f','ess000000000017','essaudi_climate01','essaudi_vehicle01'].includes(id)),'Jeep commands never enter Audi adapters');
}
{
    const climate=fixture();delete climate.values.ess_jeep_manual_soc;
    climate.values.ess_jeep_smart_enabled=false;climate.values.ess_jeep_force_full=false;
    climate.values.ess_jeep_climate_power_support={requestedAt:now,expiresAt:now+1800000,minimumCurrentA:6,minimumPowerW:1000};
    climate.run('essjeep_ess00000000000d');
    const amps=climate.values.ess_jeep_control_status.targetCurrent;
    assert(amps>=6&&amps*230>=1000,'Jeep climate-only request reserves at least 1 kW without SOC or smart charging');
    assert(climate.run('essjeep_guard_ess00000000000f',{payload:{chargerId:'right',command:'start'}}),'Climate-only dispatch is permitted');
    climate.values.ess_jeep_climate_power_support=null;
    climate.run('essjeep_ess00000000000d');
    assert.equal(climate.values.ess_jeep_control_status.targetCurrent,0,'Stopping climate releases the temporary request');
}
console.log('Second EV: independent Jeep controls, manual SOC lifecycle, 54 kWh estimation, charger isolation and shared phase reservations OK');
