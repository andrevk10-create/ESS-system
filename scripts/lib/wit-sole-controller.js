// This installation gives HA/ESS sole ownership of WIT remote power control.
// Solar charging is native inverter operation, not another remote controller.
function witSoleControllerSession(flow, previous, now) {
    if (previous.sessionOwned || previous.releasing || flow.get('ess_wit_manual_recovery') ||
        flow.get('ess_wit_grid_transport')) return;
    const ev = flow.get('ess_wit_audi_discharge_status') || {};
    if (ev.sessionOwned || ev.active || ev.releasing || ev.pendingUntil > now) return;
    const rb = flow.get('ess_wit_control_readback'), config = flow.get('ess_system_config') || {};
    const mapped = role => config.entities ? config.entities[role] : role;
    if (!rb?.deviceId || !rb.configEntryId || !Number.isFinite(rb.at) ||
        now - rb.at < 0 || now - rb.at > 120000 || rb.periods !== 0 ||
        ![0, 1].includes(rb.remote) || ![0, 1].includes(rb.authority) ||
        !(rb.remote === 1 || rb.authority === 1) || !Number.isFinite(rb.percent) || Math.abs(rb.percent) > 100 ||
        rb.remoteEntity !== mapped('select.growatt_grid_remote_power_control_enable') ||
        rb.authorityEntity !== mapped('select.growatt_grid_control_authority')) return;
    // Claim for supervision and stop as well as start: outside planned quarters,
    // at target SOC, in Off mode or on a fault, normal stopOwned releases it.
    previous.sessionOwned = true;
    previous.powerPercent = rb.remote === 1 ? Math.max(0, rb.percent) : 0;
    previous.targetPowerW = previous.powerPercent / 100 * (Number(config.specs?.inverterRatedPowerKw) || 18) * 1000;
    flow.set('ess_wit_grid_charge_status', {...previous});
}

module.exports = function apply(flows) {
    for (const id of ['esswitgrid_ctrl1', 'esswitaudi_ctrl1']) {
        const n = flows.find(n => n.id === id);
        const start = n.func.indexOf("if (remoteState === 'enabled' && previous.sessionOwned !== true) {");
        const end = n.func.indexOf("if (exportState === 'enabled') {", start);
        if (start < 0 || end < start) throw Error('Sole-controller gate anchor missing: '+id);
        n.func = n.func.slice(0, start) + n.func.slice(end);
    }
    const grid = flows.find(n => n.id === 'esswitgrid_ctrl1');
    const marker = "const previous = flow.get('ess_wit_grid_charge_status') || {};";
    if (!grid.func.includes(marker)) throw Error('Sole-controller session anchor missing');
    grid.func = witSoleControllerSession.toString()+'\n'+grid.func.replace(marker,
        marker+'\nwitSoleControllerSession(flow, previous, Date.now());');
    // Present the actual action without suggesting an external system exists.
    for (const n of flows.filter(n => n.func)) n.func = n.func
        .replaceAll('externe WIT-regeling vrijgeven', 'WIT-aansturing vrijgeven');
};
module.exports.witSoleControllerSession = witSoleControllerSession;
