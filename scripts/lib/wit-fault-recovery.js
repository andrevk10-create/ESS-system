// A failed ESS command is retried after release; it must not disable later plans.
function witFaultRecovery(flow, now) {
    const fault = flow.get('ess_wit_command_fault');
    const reset = () => flow.set('ess_wit_fault_recovery_probe', null);
    if (!fault || !Number.isFinite(fault.at) || fault.resetRequested) { reset(); return false; }
    const transient = ['WIT-registerterugmelding ontbreekt of is ongeldig',
        'Geen laad- of ontlaadvermogen na herstelpoging',
        'WIT neemt de laadopdracht niet over · registerterugmelding wijkt af',
        'WIT-opdracht blijft onderweg', 'WIT-vrijgave niet bevestigd'];
    const released = flow.get('ess_wit_release_ack') || {};
    // Legacy faults had no classification. Require both explicit release ACKs.
    const legacy = !fault.reason && released.authority >= fault.at && released.remote >= fault.at;
    const config = flow.get('ess_system_config') || {};
    const mapped = role => config.entities ? config.entities[role] : role;
    const rb = flow.get('ess_wit_control_readback');
    const status = ['ess_wit_grid_charge_status', 'ess_wit_audi_discharge_status'].map(k => flow.get(k) || {});
    const audit = flow.get('ess_wit_fault_recovery_audit');
    const noPower = fault.reason === 'Geen laad- of ontlaadvermogen na herstelpoging';
    if ((!legacy && !transient.includes(fault.reason)) || now - fault.at < (noPower ? 300000 : 600000) ||
        (audit && (audit.faultAt === fault.at || (!noPower && now - audit.at < 3600000))) ||
        flow.get('ess_wit_manual_recovery') || flow.get('ess_wit_grid_transport') ||
        status.some(s => s.sessionOwned || s.active || s.releasing || s.pendingUntil > now) ||
        !rb?.deviceId || rb.remoteEntity !== mapped('select.growatt_grid_remote_power_control_enable') ||
        rb.authorityEntity !== mapped('select.growatt_grid_control_authority') ||
        (fault.deviceId && fault.deviceId !== rb.deviceId) || rb.at <= fault.at ||
        now - rb.at < 0 || now - rb.at > 120000 || rb.authority !== 0 || rb.remote !== 0 || rb.periods !== 0) {
        reset(); return false;
    }
    const probe = flow.get('ess_wit_fault_recovery_probe');
    if (!probe || probe.faultAt !== fault.at || probe.deviceId !== rb.deviceId || now - probe.at > 180000) {
        flow.set('ess_wit_fault_recovery_probe', {faultAt:fault.at,deviceId:rb.deviceId,at:rb.at});
        return false;
    }
    if (rb.at - probe.at < 15000) return false;
    flow.set('ess_wit_fault_recovery_audit', {at:now,faultAt:fault.at,reason:fault.reason || 'Oude vrijgegeven opdracht',deviceId:rb.deviceId});
    flow.set('ess_wit_command_fault', null);
    flow.set('ess_wit_charge_watch', null);
    flow.set('ess_wit_discharge_watch', null);
    reset(); return true;
}

module.exports = function apply(flows) {
    const grid = flows.find(n => n.id === 'esswitgrid_ctrl1');
    const marker = "const commandFault = flow.get('ess_wit_command_fault');";
    if (!grid.func.includes(marker)) throw Error('WIT fault recovery insertion point missing');
    grid.func = witFaultRecovery.toString() + '\n' + grid.func.replace(marker,
        "if (witFaultRecovery(flow, now)) node.send([null,null,null,null,null,{payload:now}]);\n" + marker);
    grid.outputs=6; grid.wires.push(['essprefs_save']);
};
module.exports.witFaultRecovery = witFaultRecovery;
