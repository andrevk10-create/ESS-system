// Recover a proven ESS command whose lease ended with authority still enabled.
// Never take over an active external command or a hardware time schedule.
function witIdleRecoveryReady(flow, now) {
    const fault = flow.get('ess_wit_command_fault');
    const ack = flow.get('ess_wit_grid_write_ack');
    const rb = flow.get('ess_wit_control_readback');
    const config = flow.get('ess_system_config') || {};
    const mapped = role => config.entities ? config.entities[role] : role;
    const reset = () => { flow.set('ess_wit_idle_recovery_probe', null); return false; };
    const transient = /^(WIT-opdracht mislukt: |WIT-registerterugmelding ontbreekt of is ongeldig$|Geen laad- of ontlaadvermogen na herstelpoging$|WIT neemt de laadopdracht niet over|WIT-opdracht blijft onderweg$|WIT-vrijgave niet bevestigd$|Verse WIT-registerterugmelding of koppeling ontbreekt$|Verse WIT-devicebinding ontbreekt tijdens fasecontrole$|Power Imbalance niet (tijdig|recent) uit bevestigd)/;
    const busy = ['ess_wit_grid_charge_status', 'ess_wit_audi_discharge_status']
        .some(key => { const s = flow.get(key) || {}; return s.sessionOwned || s.active || s.releasing || s.pendingUntil > now; });
    const last = flow.get('ess_wit_idle_recovery_audit');
    if (!fault || !transient.test(fault.reason || '') || fault.resetRequested ||
        !['auto', 'on'].includes(flow.get('ess_wit_grid_charge_mode')) ||
        !Number.isFinite(fault.at) || now - fault.at < 300000 ||
        !ack?.deviceId || !Number.isFinite(ack.at) || ack.at > fault.at || fault.at - ack.at > 1200000 ||
        !rb?.deviceId || rb.deviceId !== ack.deviceId || (fault.deviceId && fault.deviceId !== rb.deviceId) ||
        !ack.configEntryId || ack.configEntryId !== rb.configEntryId ||
        rb.remoteEntity !== mapped('select.growatt_grid_remote_power_control_enable') ||
        rb.authorityEntity !== mapped('select.growatt_grid_control_authority') ||
        ack.remoteEntity !== rb.remoteEntity || ack.authorityEntity !== rb.authorityEntity ||
        rb.at <= fault.at || now - rb.at < 0 || now - rb.at > 120000 ||
        rb.remote !== 0 || rb.authority !== 1 || rb.periods !== 0 || rb.duration !== 2 ||
        busy || flow.get('ess_wit_grid_transport') || flow.get('ess_wit_manual_recovery') ||
        (last && now - last.at < 900000)) return reset();
    const signature = JSON.stringify([fault.at, ack.at, rb.deviceId, rb.configEntryId, rb.remoteEntity, rb.authorityEntity]);
    const probe = flow.get('ess_wit_idle_recovery_probe');
    if (!probe || probe.signature !== signature || now - probe.lastAt > 120000) {
        flow.set('ess_wit_idle_recovery_probe', {signature, since:rb.at, lastAt:rb.at});
        return false;
    }
    flow.set('ess_wit_idle_recovery_probe', {...probe, lastAt:rb.at});
    if (rb.at - probe.since < 15000) return false;
    flow.set('ess_wit_idle_recovery_audit', {at:now, faultAt:fault.at, deviceId:rb.deviceId, reason:fault.reason});
    reset();
    return true;
}

module.exports = function apply(flows) {
    const grid = flows.find(n => n.id === 'esswitgrid_ctrl1');
    const marker = "const recovery = flow.get('ess_wit_manual_recovery');";
    if (!grid.func.includes(marker)) throw Error('Idle recovery anchor missing');
    grid.func = witIdleRecoveryReady.toString() + '\n' + grid.func.replace(marker, `if (witIdleRecoveryReady(flow, now)) {
    flow.set('ess_wit_manual_recovery', {startedAt:now, deviceId:flow.get('ess_wit_control_readback').deviceId, sentSteps:[]});
}
${marker}`);
    // Keep retry throttling across restarts, without restoring an active session.
    const save = flows.find(n => n.id === 'essprefs_save');
    save.func = save.func.replace('    return result;', "    if(flow.get('ess_wit_idle_recovery_audit')) result.witIdleRecovery=flow.get('ess_wit_idle_recovery_audit');\n    return result;");
    const restore = flows.find(n => n.id === 'essprefs_restore');
    restore.func = restore.func.replace('    for (const [key,value] of Object.entries(candidate))', "    if(Number.isFinite(saved.witIdleRecovery?.at)) candidate.ess_wit_idle_recovery_audit=saved.witIdleRecovery;\n    for (const [key,value] of Object.entries(candidate))");
};
module.exports.witIdleRecoveryReady = witIdleRecoveryReady;
