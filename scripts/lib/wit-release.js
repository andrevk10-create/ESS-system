// Apply after harden-wit: compatible with 0xAHA 2.0.4 and 2.0.5 betas.
// Keep the session reserved until BOTH VPP switches confirm release.
module.exports = function applyWitRelease(flows) {
    const get = id => flows.find(n => n.id === id);
    for (const [id, stop, key] of [
        ['esswitgrid_ctrl1', 'stopOwned', 'ess_wit_grid_charge_status'],
        ['esswitaudi_ctrl1', 'stopOwnedSession', 'ess_wit_audi_discharge_status']
    ]) {
        const n = get(id);
        const begin = n.func.indexOf(`function ${stop}(reason, details = {}) {`);
        const end = n.func.indexOf('\n}\n', begin) + 3;
        if (begin < 0 || end < 3) throw new Error('Missing WIT stop function');
        n.func = n.func.slice(0, begin) + `function ${stop}(reason, details = {}) {
    flow.set('${id === 'esswitgrid_ctrl1' ? 'ess_wit_charge_watch' : 'ess_wit_discharge_watch'}', null);
    if (previous.sessionOwned !== true) {
        save('blocked', { ...details, active:false, sessionOwned:false, releasing:false, powerPercent:0, targetPowerW:0, status:reason });
        return null;
    }
    const authority = entity('select.growatt_grid_control_authority');
    const remote = entity('select.growatt_grid_remote_power_control_enable');
    const disabled = (item, role) => item && String(item.state).toLowerCase() === 'disabled' && fresh(role, 120000);
    const since = Number(previous.releaseRequestedAt) || 0;
    const observedAfter = item => !since || new Date(item?.last_reported || item?.last_updated || item?.last_changed || 0).getTime() >= since;
    const authorityOff = disabled(authority, 'select.growatt_grid_control_authority') && observedAfter(authority);
    const remoteOff = disabled(remote, 'select.growatt_grid_remote_power_control_enable') && observedAfter(remote);
    if (authorityOff && remoteOff) {
        save('blocked', { ...details, active:false, sessionOwned:false, releasing:false, releaseRequestedAt:0, releaseLastWriteAt:0, powerPercent:0, targetPowerW:0, status:reason });
        return null;
    }
    const firstRequest = since || now;
    save('blocked', { ...details, active:false, sessionOwned:true, releasing:true, releaseReason:reason, releaseRequestedAt:firstRequest, status:reason+' · externe WIT-regeling vrijgeven' });
    // No start, renewal or opposite session may race the release. Retry failed
    // writes only on a subsequent minute cycle, never in a tight loop.
    if (previous.releaseLastWriteAt && now - previous.releaseLastWriteAt < 35000) return null;
    if (authorityOff && now - firstRequest < 35000) return null;
    const releaseStep = authorityOff ? 'remote' : 'authority';
    flow.set('${key}', { ...flow.get('${key}'), releaseLastWriteAt:now });
    return [null, null, null, { payload:{ option:'Disabled', releaseStep } }, null];
}` + n.func.slice(end);
        // A lease expiring only disables 30407; that is NOT proof of release.
        n.func = n.func.replace(/if \(previous.sessionOwned === true && remoteState === 'disabled'\) \{[\s\S]*?\n\}\nif \(previous.sessionOwned === true && Number\(previous.leaseUntil\)[\s\S]*?\n\}\n/, '');
        n.func = n.func.replace('Home Assistant niet beschikbaar · korte opdracht loopt vanzelf af', 'Home Assistant niet beschikbaar · korte opdracht begrensd; volledige vrijgave nog niet bevestigd');
        const marker = 'const commandFault = flow.get(\'ess_wit_command_fault\');';
        n.func = n.func.replace(marker, `if (previous.releasing === true) return ${stop}(previous.releaseReason || 'Tijdelijke WIT-sessie stoppen', details);
${marker}`);
        n.func = n.func.replace("commandFault.resetRequested && fresh('select.growatt_grid_remote_power_control_enable', 120000) && remoteState === 'disabled'", "commandFault.resetRequested && fresh('select.growatt_grid_control_authority', 120000) && String(entity('select.growatt_grid_control_authority')?.state).toLowerCase() === 'disabled' && fresh('select.growatt_grid_remote_power_control_enable', 120000) && remoteState === 'disabled'");
    }
    const grid = get('esswitgrid_ctrl1');
    grid.func = grid.func.replace("remoteState === 'disabled' && fresh('select.growatt_grid_remote_power_control_enable', 120000)", "remoteState === 'disabled' && fresh('select.growatt_grid_remote_power_control_enable', 120000) && fresh('select.growatt_grid_control_authority', 120000) && String(entity('select.growatt_grid_control_authority')?.state).toLowerCase() === 'disabled'");
    // One allowlisted action, two explicit targets. Works without the newer
    // set_battery_mode release option; local role mappings remain authoritative.
    const action = get('esswitaudi_stop1');
    action.name = 'Geef externe WIT-aansturing volledig vrij';
    action.data = `($c := $flowContext('ess_system_config'); $role := payload.releaseStep = 'remote' ? 'select.growatt_grid_remote_power_control_enable' : 'select.growatt_grid_control_authority'; $id := $exists($c) ? $lookup($c.entities, $role) : $role; $assert(payload.releaseStep in ['authority','remote'], 'Ongeldige WIT-vrijgavestap'); $assert($type($id) = 'string' and $contains($id, /^select\\.[a-z0-9_]+$/), 'WIT doelentiteit ontbreekt'); {"entity_id":$id,"option":"Disabled"})`;
};
