// Recover an orphaned optimistic remote selector only in manual charge mode.
// Automatic planning never takes over an external session.
function witManualRecoveryReady(flow,now){
    const config=flow.get('ess_system_config')||{},rb=flow.get('ess_wit_control_readback');
    const statuses=['ess_wit_grid_charge_status','ess_wit_audi_discharge_status'].map(k=>flow.get(k)||{});
    const safe=flow.get('ess_wit_grid_charge_mode')==='on'&&rb?.deviceId&&
        rb.remoteEntity===(config.entities?.['select.growatt_grid_remote_power_control_enable']||'select.growatt_grid_remote_power_control_enable')&&
        rb.authorityEntity===(config.entities?.['select.growatt_grid_control_authority']||'select.growatt_grid_control_authority')&&
        now-rb.at>=0&&now-rb.at<=120000&&rb.remote===1&&rb.periods===0&&rb.duration===2&&
        !flow.get('ess_wit_grid_transport')&&!flow.get('ess_wit_manual_recovery')&&
        !statuses.some(s=>s.sessionOwned||s.active||s.releasing||s.pendingUntil>now);
    if(!safe){flow.set('ess_wit_orphan_probe',null);return false;}
    const signature=JSON.stringify([rb.deviceId,rb.remoteEntity,rb.authorityEntity,rb.authority,rb.remote,rb.duration,rb.percent,rb.ac,rb.periods]);
    const previous=flow.get('ess_wit_orphan_probe');
    if(!previous||previous.signature!==signature||now-previous.lastAt>120000){flow.set('ess_wit_orphan_probe',{signature,since:rb.at,lastAt:rb.at});return false;}
    flow.set('ess_wit_orphan_probe',{...previous,lastAt:rb.at});
    return rb.at-previous.since>=180000;
}
module.exports = function applyManualRecovery(flows) {
    const grid = flows.find(n => n.id === 'esswitgrid_ctrl1');
    const setter = flows.find(n => n.id === 'esswitgrid_set01');
    grid.func=witManualRecoveryReady.toString()+'\n'+grid.func;
    const marker = "const commandFault = flow.get('ess_wit_command_fault');";
    if (!grid.func.includes(marker)) throw new Error('WIT recovery insertion point missing');
    grid.func = grid.func.replace(marker, `const recovery = flow.get('ess_wit_manual_recovery');
if (recovery) {
    const observedOff = role => {
        const item = entity(role);
        const stamp = new Date(item?.last_reported || item?.last_updated || item?.last_changed || 0).getTime();
        const step = role === 'select.growatt_grid_control_authority' ? 'authority' : 'remote';
        const acknowledgedAt = Number(flow.get('ess_wit_release_ack')?.[step]) || 0;
        // HA does not emit state_changed when a successful Disabled write
        // leaves an already-disabled optimistic selector unchanged.
        return String(item?.state).toLowerCase() === 'disabled' &&
            ((fresh(role, 120000) && stamp >= recovery.startedAt) || acknowledgedAt >= recovery.startedAt);
    };
    const authorityOff = observedOff('select.growatt_grid_control_authority');
    const remoteOff = observedOff('select.growatt_grid_remote_power_control_enable');
    if (authorityOff && remoteOff) {
        flow.set('ess_wit_manual_recovery', null);
        flow.set('ess_wit_charge_watch', null);
        save('blocked', { ...details, sessionOwned:false, status:'Achtergebleven WIT-sessie vrijgegeven · laadstart wordt gecontroleerd' });
        return null;
    }
    if (now - recovery.startedAt >= 180000) {
        flow.set('ess_wit_manual_recovery', null);
        flow.set('ess_wit_command_fault', { at:now, attempts:1, reason:'WIT-vrijgave niet bevestigd' });
        save('error', { ...details, sessionOwned:false, commandFault:true, status:'WIT-vrijgave niet bevestigd · controleer Modbus' });
        return null;
    }
    const step = authorityOff ? 'remote' : 'authority';
    save('blocked', { ...details, sessionOwned:false, pendingUntil:now + 90000, status:'Achtergebleven WIT-sessie vrijgeven · wacht op bevestiging' });
    if (authorityOff) {
        const authority = entity('select.growatt_grid_control_authority');
        const stamp = Math.max(Number(flow.get('ess_wit_release_ack')?.authority) || 0,
            new Date(authority.last_changed || authority.last_updated || 0).getTime());
        if (now - stamp < 35000) return null;
    }
    if (recovery.sentSteps.includes(step) && now - (Number(recovery.lastSentAt) || recovery.startedAt) < 35000) return null;
    flow.set('ess_wit_manual_recovery', { ...recovery, lastSentAt:now, sentSteps:[...new Set([...recovery.sentSteps, step])] });
    return [null, null, null, { payload:{ option:'Disabled', releaseStep:step } }, null];
}
${marker}
// A queued retry can arrive after the initial stop completed. During the
// settling window, free that late ESS command once; never restart charging.
if (commandFault && commandFault.reason !== 'WIT-vrijgave niet bevestigd' && now - commandFault.at >= 0 && now - commandFault.at < 600000 && previous.sessionOwned !== true &&
    flow.get('ess_wit_fault_cleanup_attempted') !== commandFault.at &&
    (remoteState === 'enabled' || String(entity('select.growatt_grid_control_authority')?.state).toLowerCase() === 'enabled')) {
    flow.set('ess_wit_fault_cleanup_attempted', commandFault.at);
    flow.set('ess_wit_manual_recovery', { startedAt:now, sentSteps:['authority'] });
    save('blocked', { ...details, sessionOwned:false, commandFault:true, pendingUntil:now + 90000, status:'Vertraagde WIT-opdracht na fout vrijgeven' });
    return [null, null, null, { payload:{ option:'Disabled', releaseStep:'authority' } }, null];
}`);
    const external = "if (remoteState === 'enabled' && previous.sessionOwned !== true) {";
    if (!grid.func.includes(external)) throw new Error('WIT external-session gate missing');
    grid.func = grid.func.replace(external, `${external}
    const authority = entity('select.growatt_grid_control_authority');
    const staleControls = [remoteEntity, authority, entity('number.growatt_battery_remote_charge_and_discharge_power')].every(item => {
        const stamp = new Date(item?.last_reported || item?.last_updated || item?.last_changed || 0).getTime();
        return item && !unavailable(item) && stamp > 0 && now - stamp > 300000;
    });
    // An old selector is not proof of a running hardware lease. Free both
    // control layers and require new Disabled observations before any start.
    const hardwareRecoveryReady=witManualRecoveryReady(flow,now);
    if (mode === 'on' && (hardwareRecoveryReady||flow.get('ess_wit_readback_enabled')!==true&&staleControls) && !flow.get('ess_wit_manual_recovery_attempted')) {
        flow.set('ess_wit_manual_recovery_attempted', true);
        flow.set('ess_wit_manual_recovery', { startedAt:now, sentSteps:['authority'] });
        save('blocked', { ...details, sessionOwned:false, pendingUntil:now + 90000, status:'Achtergebleven WIT-sessie vrijgeven voor Nu laden' });
        return [null, null, null, { payload:{ option:'Disabled', releaseStep:'authority' } }, null];
    }`);
    grid.func = grid.func.replace(/if \(commandFault\.resetRequested &&[^\n]+\) \{/, `if (commandFault.resetRequested && [
        ['select.growatt_grid_control_authority','authority'],
        ['select.growatt_grid_remote_power_control_enable','remote']
    ].every(([role, step]) => String(entity(role)?.state).toLowerCase() === 'disabled' &&
        (fresh(role, 120000) || Number(flow.get('ess_wit_release_ack')?.[step]) >= commandFault.at))) {`);
    setter.func = setter.func.replace("flow.set('ess_wit_grid_charge_mode', mode);", "flow.set('ess_wit_grid_charge_mode', mode);\n    if (mode === 'on') flow.set('ess_wit_manual_recovery_attempted', false);");
    setter.func = setter.func.replace("flow.set('ess_wit_command_fault', { ...fault, resetRequested:true });", "{ flow.set('ess_wit_command_fault', { ...fault, resetRequested:true }); flow.set('ess_wit_manual_recovery',{startedAt:Date.now(),sentSteps:[]}); }");
    // The release service selects one of two fixed, configured roles.
    const stop = flows.find(n => n.id === 'esswitaudi_stop1');
    stop.name = 'Geef externe WIT-aansturing vrij';
    if (!stop.data.includes('Ongeldige WIT-vrijgavestap')) stop.data = "($c := $flowContext('ess_system_config'); $role := payload.releaseStep = 'authority' ? 'select.growatt_grid_control_authority' : 'select.growatt_grid_remote_power_control_enable'; $id := $exists($c) ? $lookup($c.entities, $role) : $role; $assert($type($id) = 'string' and $contains($id, /^select\\.[a-z0-9_]+$/), 'WIT doelentiteit ontbreekt'); {\"entity_id\":$id,\"option\":\"Disabled\"})";
    const ackId = 'esswit_release_ack';
    if (!flows.some(n => n.id === ackId)) flows.push({id:ackId,type:'function',z:grid.z,name:'Bevestig geslaagde WIT-vrijgave',
        func:"const step = msg.payload?.releaseStep || 'remote'; if (!['authority','remote'].includes(step)) return null; flow.set('ess_wit_release_ack', { ...(flow.get('ess_wit_release_ack') || {}), [step]:Date.now() }); return null;",
        outputs:0,noerr:0,initialize:'',finalize:'',libs:[],wires:[],x:1050,y:1200});
    stop.wires = [[...new Set([...(stop.wires?.[0] || []), ackId])]];
    const exportControl = flows.find(n => n.id === 'esswitexport_ctrl');
    const exportGate = 'if (targetEnabled) {';
    if (!exportControl.func.includes(exportGate)) throw new Error('WIT export interlock insertion point missing');
    exportControl.func = exportControl.func.replace(exportGate, `const solarReadback=flow.get('ess_wit_control_readback'), solarConfig=flow.get('ess_system_config');
const solarRole=role=>solarConfig?.entities ? solarConfig.entities[role] : role;
const solarSafe=!flow.get('ess_wit_manual_recovery') && !flow.get('ess_wit_command_fault')?.resetRequested && solarReadback && Date.now()-solarReadback.at>=0 && Date.now()-solarReadback.at<=120000 &&
    solarReadback.remoteEntity===solarRole('select.growatt_grid_remote_power_control_enable') &&
    solarReadback.authorityEntity===solarRole('select.growatt_grid_control_authority') &&
    solarReadback.remote===0 && solarReadback.periods===0 && !flow.get('ess_wit_grid_transport') &&
    !audiDischargeBusy && !gridChargeBusy &&
    Date.now()-Math.max(Number(flow.get('ess_wit_release_ack')?.authority)||0,Number(flow.get('ess_wit_release_ack')?.remote)||0)>=35000;
if (flow.get('ess_wit_command_fault') && !solarSafe) {
    node.status({fill:'yellow',shape:'ring',text:'WIT-fout · exportregeling wacht op herstel'});
    return exportEnabled ? [null, null, {payload:{option:'Disabled'}}] : null;
}
${exportGate}`);
};
module.exports.witManualRecoveryReady=witManualRecoveryReady;
