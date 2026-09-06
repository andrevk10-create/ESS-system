const assert = require('node:assert/strict');
const jsonata = require('jsonata');
const flows = require('../flows.json');
const { witSolarWindow, witHouseReserve, witBatteryLimit, witFresh } = require('../scripts/lib/wit-runtime');
const { witHealthModel } = require('../scripts/lib/wit-dashboard');
require('./house-learning');
const get = id => flows.find(n => n.id === id);
const date = (day, hour) => new Date(2026, 8, day, hour).getTime();
const reading = (state, unit = 'kWh', at = date(6, 20), entity_id) => ({ state:String(state), entity_id,
    attributes:{ unit_of_measurement:unit }, last_updated:new Date(at).toISOString() });
const solar = (now, today = 40, tomorrow = 1) => ({
    'sensor.energy_production_today':reading(today, 'kWh', now),
    'sensor.energy_production_today_remaining':reading(today / 2, 'kWh', now),
    'sensor.energy_production_tomorrow':reading(tomorrow, 'kWh', now)
});

async function main() {
    // Midnight: this morning's sun, not the following day's weather.
    let now = date(7, 2);
    let states = solar(now);
    assert.equal(witSolarWindow(states, {}, now, null, false).inputKwh, 40);
    assert.equal(witSolarWindow(states, {}, now, null, true).inputKwh, 40);
    // If Forecast.Solar has not rolled over, yesterday's tomorrow is today's forecast.
    states = solar(date(6, 20), 2, 40);
    let window = witSolarWindow(states, {}, now, null, false);
    assert.equal(window.inputKwh, 40);
    assert.equal(window.forecastDate, '2026-09-07');
    assert.equal(window.tomorrowKwh, null, 'Do not corrupt tomorrow error history with today forecast');
    assert.equal(witSolarWindow(states, {}, date(7, 12), null, true).valid, false, 'Old daylight forecasts must fail closed');
    states = solar(now);
    states['sensor.unrelated_with_same_len__2'] = reading(999, 'kWh', now);
    states['sensor.energy_production_today_2'] = states['sensor.energy_production_today'];
    states['sensor.energy_production_tomorrow_2'] = states['sensor.energy_production_tomorrow'];
    const duplicateConfig = {entities:{'sensor.energy_production_tomorrow':'sensor.array_forecast', 'sensor.energy_production_tomorrow_2':'sensor.array_forecast'}};
    assert.equal(witSolarWindow(states, duplicateConfig, now, null, false).inputKwh, 40, 'Aliases must not double solar budget');
    window = witSolarWindow(solar(date(7, 12), 40, 20), {}, date(7, 12), null, true);
    assert.equal(window.inputKwh, 30, 'Rolling window includes remaining today and only part of tomorrow');
    assert.equal(witSolarWindow(solar(date(7, 12), 40, 20), {}, date(7, 12), null, false).inputKwh, 40, 'Daytime EV support may refill from remaining today plus tomorrow');
    assert.equal(witHouseReserve({schemaVersion:2, forecastKwh:29, recentDays:[{kwh:29}]}, 10), 29);
    assert.equal(witHouseReserve({forecastKwh:29, recentDays:[{kwh:29}]}, 10), 10, 'Old EV-contaminated reserves must not survive deploy');
    assert.equal(witHouseReserve({forecastKwh:29, recentDays:[]}, 10), 10);
    assert(witFresh({...reading(0, 'W', now - 3600000), last_reported:new Date(now).toISOString()}, now, 120000));

    const caps = {entities:{'sensor.battery_charge_current_limit':'sensor.bms_charge', 'sensor.battery_discharge_power_limit':'sensor.bms_discharge'}};
    states = {'sensor.battery_charge_current_limit':reading(150, 'A', now),
        'sensor.growatt_battery_battery_voltage':reading(52, 'V', now),
        'sensor.battery_discharge_power_limit':reading(2, 'kW', now)};
    assert.equal(witBatteryLimit(states, caps, 'charge', 12000, now), 7800);
    assert.equal(witBatteryLimit(states, caps, 'discharge', 8000, now), 2000);
    states['sensor.battery_charge_current_limit'] = reading(0, 'A', now);
    assert.equal(witBatteryLimit(states, caps, 'charge', 12000, now), 0);
    states['sensor.battery_charge_current_limit'] = reading('unavailable', 'A', now);
    assert.equal(witBatteryLimit(states, caps, 'charge', 12000, now), 0);

    // Exercise the actual generated Node-RED functions with a deterministic clock.
    now = date(6, 20);
    class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
    const fixture = () => {
        const s = {...solar(now, 5, 60),
            'sensor.growatt_battery_battery_soc':reading(35, '%', now),
            'sensor.growatt_battery_battery_power':reading(0, 'W', now),
            'sensor.growatt_solar_solar_total_power':reading(0, 'W', now),
            'sensor.p1_meter_vermogen':reading(4000, 'W', now),
            'select.growatt_grid_control_authority':reading('Enabled', '', now),
            'select.growatt_grid_vpp_export_limit_enable':reading('Disabled', '', now),
            'number.growatt_grid_vpp_export_limit_power_rate':reading(1, '%', now),
            'select.growatt_grid_remote_power_control_enable':reading('Disabled', '', now),
            'number.growatt_grid_remote_power_control_charging_time':reading(2, 'min', now),
            'number.growatt_vpp_power_rate':reading(67, '%', now),
            'number.growatt_battery_remote_charge_and_discharge_power':reading(0, '%', now),
            'select.growatt_mode_vpp':{...reading('Charge', '', now), attributes:{options:['Charge','Discharge','Hold']}},
            'sensor.ev_charger_status':reading('charging', '', now),
            'sensor.ev_charger_power':reading(11000, 'W', now)
        };
        for (const phase of [1,2,3]) s['sensor.p1_meter_vermogen_fase_' + phase] = reading(500, 'W', now);
        const values = {ess_wit_grid_charge_mode:'auto', ess_wit_grid_charge_target_soc:80,
            ess_nordpool_forecast_meta:{updatedAt:new Date(now).toISOString()},
            ess_nordpool_forecast:[0.10,0.30,0.40,0.45].map((p,i)=>({start:new Date(now+i*900000).toISOString(), end:new Date(now+(i+1)*900000).toISOString(), allInPrice:p})),
            ess_audi_control_status:{controlled:true, targetCurrent:16, actualCharging:true, updatedAt:new Date(now).toISOString(), selectedSlots:[]}
        };
        const flow = {get:k=>values[k],set:(k,v)=>values[k]=v};
        const run = id => new Function('global','flow','node','msg','Date',get(id).func)({get:()=>({homeAssistant:{states:s}})},flow,{status(){}},{},Clock);
        return {s, values, flow, run};
    };
    let f = fixture();
    assert.equal(f.run('esswitgrid_ctrl1'), null, 'No net charge when sun covers target');
    f.values.ess_house_consumption_learning = {schemaVersion:2, forecastKwh:29, recentDays:[{kwh:29}]};
    assert(f.run('esswitgrid_ctrl1')[0], 'Learned full household reserve must increase needed net energy');
    assert(f.values.ess_wit_grid_charge_status.gridEnergyNeededKwh > 0);

    f = fixture();
    f.s['sensor.energy_production_tomorrow'] = reading(2, 'kWh', now);
    f.values.ess_nordpool_forecast_meta.updatedAt = new Date(now - 12 * 3600000).toISOString();
    assert(f.run('esswitgrid_ctrl1')[0], 'Known dated day-ahead prices remain usable overnight without cloud refresh');
    f.values.ess_wit_grid_charge_status = {};
    f.values.ess_nordpool_forecast_meta.updatedAt = new Date(now - 37 * 3600000).toISOString();
    assert.equal(f.run('esswitgrid_ctrl1'), null, 'Old or absent price cache must block automatic net charging');

    f = fixture();
    f.s['sensor.energy_production_tomorrow'] = reading(2, 'kWh', now);
    f.run('esswitgrid_ctrl1');
    f.s['sensor.growatt_battery_battery_power'] = reading(5000, 'W', now);
    f.s['sensor.growatt_solar_solar_total_power'] = reading(5000, 'W', now);
    f.s['select.growatt_grid_remote_power_control_enable'] = reading('Enabled', '', now);
    f.s['number.growatt_battery_remote_charge_and_discharge_power'] = reading(30, '%', now);
    for (const phase of [1,2,3]) f.s['sensor.p1_meter_vermogen_fase_'+phase] = reading(4000, 'W', now);
    f.run('esswitgrid_ctrl1');
    assert(f.values.ess_wit_grid_charge_status.targetPowerW <= 3180, 'Direct PV charging must not create imaginary net headroom');

    f = fixture();
    f.s['sensor.energy_production_tomorrow'] = reading(2, 'kWh', now);
    f.s['select.growatt_grid_vpp_export_limit_enable'] = reading('Enabled', '', now);
    assert.equal(f.run('esswitgrid_ctrl1')[4].payload.option, 'Disabled');
    assert(f.values.ess_wit_grid_charge_status.pendingUntil > now);
    f.s['select.growatt_grid_vpp_export_limit_enable'] = reading('Disabled', '', now);
    assert.equal(f.run('esswitexport_ctrl'), null, 'Export loop must respect pending charge handover');
    let output = f.run('esswitgrid_ctrl1');
    const percent = output[0].payload.powerPercent;
    f.s['select.growatt_grid_remote_power_control_enable'] = reading('Enabled', '', now);
    f.s['number.growatt_battery_remote_charge_and_discharge_power'] = reading(percent, '%', now);
    assert(f.run('esswitgrid_ctrl1')[2]);
    assert.equal(f.values.ess_wit_grid_charge_status.active, false);
    assert.equal(f.values.ess_wit_grid_charge_status.commandConfirmed, true);
    assert.equal(f.values.ess_wit_grid_charge_status.powerConfirmed, false);
    assert.equal(witHealthModel(f.s, f.flow, now).powerConfirmed, false);
    f.run('ess00000000000a');
    assert(f.values.ess_dashboard_live.alarms.some(a=>/niet bevestigd/.test(a.text)), 'Unconfirmed WIT action must also appear in system alerts');
    f.s['sensor.growatt_battery_battery_power'] = reading(percent * 180, 'W', now);
    f.run('esswitgrid_ctrl1');
    assert.equal(f.values.ess_wit_grid_charge_status.active, true);
    // An overloaded phase must lower power even while a previous command is active.
    f.s['sensor.p1_meter_vermogen_fase_1'] = reading(7000, 'W', now);
    output = f.run('esswitgrid_ctrl1');
    assert(output[1].payload.value < percent);
    assert(f.values.ess_wit_grid_charge_status.targetPowerW <= 3 * (22 * 230 - 7000 + percent * 180 / 3));
    assert.deepEqual(get('esswitgrid_live1').wires, [['esswitgrid_renew']], 'Power change must renew lease after success');
    f.values.ess_wit_grid_charge_mode = 'off';
    assert.equal(f.run('esswitgrid_ctrl1')[3].payload.option, 'Disabled', 'Stop override, never select Hold/Standby');
    f.s['select.growatt_grid_remote_power_control_enable'] = reading('Disabled', '', now);
    assert.equal(f.run('esswitgrid_ctrl1'), null);
    assert.equal(f.values.ess_wit_grid_charge_status.sessionOwned, false);

    f = fixture();
    f.s['sensor.growatt_battery_battery_soc'] = reading(85, '%', now);
    f.s['select.growatt_grid_vpp_export_limit_enable'] = reading('Enabled', '', now);
    assert.equal(f.run('esswitaudi_ctrl1')[4].payload.option, 'Disabled');
    f.s['select.growatt_grid_vpp_export_limit_enable'] = reading('Disabled', '', now);
    assert.equal(f.run('esswitexport_ctrl'), null, 'Pending discharge handover owns export control');
    assert.equal(f.run('esswitaudi_ctrl1')[0].payload.powerPercent, 21, 'Watt-based EV power must be supported');
    f.values.ess_wit_audi_discharge_status = {};
    f.s['select.growatt_mode_vpp'].state = 'unknown';
    assert(f.run('esswitaudi_ctrl1')[0], 'An unknown optimistic mode after HA startup must not block a new timed session');
    f.values.ess_wit_audi_discharge_status = {};
    f.values.ess_house_consumption_learning = {schemaVersion:2, forecastKwh:40, recentDays:[{kwh:40}]};
    assert.equal(f.run('esswitaudi_ctrl1'), null, 'No surplus after house and refill means no extra discharge');
    f.values.ess_house_consumption_learning = {};
    f.values.ess_system_config = caps;
    f.s['sensor.bms_discharge'] = reading(0, 'kW', now);
    assert.equal(f.run('esswitaudi_ctrl1'), null, 'BMS zero discharge cap must block start');

    // Fail-safe target mapping: no accidental writes to the default device.
    const actions = flows.filter(n=>n.type==='api-call-service'&&n.essCanonicalTarget);
    assert(actions.length >= 12);
    for (const action of actions) {
        assert.equal(action.blockInputOverrides, true);
        assert.deepEqual(action.entityId, []);
        const evalAction = async config => {
            const expr = jsonata(action.data);
            expr.registerFunction('flowContext', key=>key==='ess_system_config'?config:undefined);
            return expr.evaluate({payload:{value:25,option:'Enabled',powerPercent:25,durationMinutes:2,entity_id:'switch.not_allowed'}});
        };
        const canonical = action.essCanonicalTarget;
        const mapped = canonical.split('.')[0] + '.configured_wit';
        assert.equal((await evalAction(undefined)).entity_id, canonical);
        assert.equal((await evalAction({entities:{[canonical]:mapped}})).entity_id, mapped);
        for (const config of [{entities:{}},{entities:{[canonical]:''}},{entities:{[canonical]:'switch.not_allowed'}}]) {
            await assert.rejects(evalAction(config), error => /WIT doelentiteit ontbreekt/.test(error.message));
        }
    }
    // Run each Vue script, compile its JS, and exercise missing-value formatters.
    for (const template of flows.filter(n=>n.type==='ui-template'&&n.format&&n.format.includes('export default'))) {
        const script = template.format.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
        const component = new Function(script.replace('export default', 'return'))();
        if (!component.methods.power) continue;
        for (const name of ['power','energy','temperature','percent','money']) {
            assert.equal(component.methods[name](null), '—', name+' must not show zero for missing data');
        }
        if (component.computed.healthChecks) {
            const checks = component.computed.healthChecks.call({d:{},modules:{nas:false,climate:false},stale:false});
            assert(!checks.some(x=>x.key==='nas'||x.key==='climate'));
            assert.equal(checks.find(x=>x.key==='prices').level, 'error');
        }
    }
    console.log('WIT regression: forecast dates, reserves, BMS, handover, lease, readback, mapped writes and dashboard OK');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
