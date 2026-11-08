function witCarCharging(states, now) {
    return ['', '_2'].some(suffix => {
        const status = states?.['sensor.ev_charger' + suffix + '_status'];
        const power = states?.['sensor.ev_charger' + suffix + '_power'];
        if (witFresh(status, now, 120000) && String(status.state).toLowerCase() === 'charging') return true;
        const unit = String(power?.attributes?.unit_of_measurement || '').toLowerCase();
        return witFresh(power, now, 120000) &&
            ((unit === 'w' && Number(power.state) >= 300) || (unit === 'kw' && Number(power.state) >= 0.3));
    });
}

module.exports = function apply(flows) {
    const mode = "flow.get('ess_wit_ev_only') === true";
    const grid = flows.find(n => n.id === 'esswitgrid_ctrl1');
    grid.initialize = (grid.initialize || '').replace(/\n?flow\.set\('ess_wit_ev_only', true\);/g, '') +
        "\nflow.set('ess_wit_ev_only', true);";
    const stop = "if (mode === 'off') return stopOwned('Slim netladen staat uit', details);";
    if (!grid.func.includes(stop)) throw Error('WIT EV interlock anchor missing');
    grid.func = witCarCharging.toString() + '\n' + grid.func.replace(stop, stop +
        `\nif (${mode} && witCarCharging(states, now)) return stopOwned('Netladen wacht: auto laadt', details);`)
        .replaceAll("if (!((flow.get('ess_wit_hardware_grid_guard')", `if (!(${mode}) && !((flow.get('ess_wit_hardware_grid_guard')`)
        .replace('const gridCommandLimitW = ', `const gridCommandLimitW = ${mode} ? planLimitW : `)
        .replace('const sharedPriceSlots=slots.map', `const sharedPriceSlots=${mode} ? slots : slots.map`)
        .replace('witManualChargePlan(sharedManualSlots(flow,slots,now,planLimitW/1000,states),', `witManualChargePlan(${mode} ? slots : sharedManualSlots(flow,slots,now,planLimitW/1000,states),`);
    for (const id of ['esswitgrid_transport_dispatch', 'esswitgrid_transport_reply']) {
        const node = flows.find(n => n.id === id);
        const anchor = 'const phaseRoles=';
        if (!node.func.includes(anchor)) throw Error('WIT write interlock anchor missing');
        node.func = witCarCharging.toString() + '\n' + node.func
            .replace(anchor, `if (${mode} && witCarCharging({
            'sensor.ev_charger_status':role('sensor.ev_charger_status'),
            'sensor.ev_charger_power':role('sensor.ev_charger_power'),
            'sensor.ev_charger_2_status':role('sensor.ev_charger_2_status'),
            'sensor.ev_charger_2_power':role('sensor.ev_charger_2_power')
        },now)) {flow.set(key,null);return [null,{payload:now}];}
        ${anchor}`)
            .replace('&& phase.some(n=>n===null)', `&& !(${mode}) && phase.some(n=>n===null)`)
            .replace('const headroom=', `const headroom=(${mode}) ? 8000 : `);
    }
};
module.exports.witCarCharging = witCarCharging;
