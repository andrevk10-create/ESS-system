// Explicit installation opt-in: the Growatt meter owns grid load balancing.
// Battery limits, SOC, register ownership and command confirmation stay active.
module.exports = function applyHardwareGridGuard(flows) {
    const baseFlag = "flow.get('ess_wit_hardware_grid_guard') === true";
    const flag = "(flow.get('ess_wit_hardware_grid_guard') === true && flow.get('ess_wit_meter_includes_ev') === true)";
    for(const cleanupFlag of [flag,baseFlag])
    for(const n of flows.filter(n=>n.func)) n.func=n.func
        .replaceAll(`if (!(${cleanupFlag}) && !phaseIds.every`, 'if (!phaseIds.every')
        .replaceAll(`if (!(${cleanupFlag}) && phasePowers.some`, 'if (phasePowers.some')
        .replaceAll(`const gridCommandLimitW = ${cleanupFlag} ? Math.min(8000,planLimitW) : `,'const gridCommandLimitW = ')
        .replaceAll(`const headroom=${cleanupFlag} ? 8000 : `,'const headroom=')
        .replace(/if\(msg.topic==='ess\/wit\/(?:hardware-grid-guard|meter-includes-ev)'\) \{[\s\S]*?\n\}\n/g,'')
        .replaceAll("result.witHardwareGridGuard=flow.get('ess_wit_hardware_grid_guard')===true;\n    ",'')
        .replaceAll('candidate.ess_wit_hardware_grid_guard=saved.witHardwareGridGuard===true;\n    ','');
    const grid = flows.find(n => n.id === 'esswitgrid_ctrl1');
    grid.func = grid.func.replace("if (!phaseIds.every((id) => fresh(id, 15000)))", `if (!(${flag}) && !phaseIds.every((id) => fresh(id, 15000)))`)
        .replace("if (phasePowers.some((reading) => reading === null))", `if (!(${flag}) && phasePowers.some((reading) => reading === null))`)
        .replace(/const gridCommandLimitW = ([^\n]+);/, `const gridCommandLimitW = ${flag} ? Math.min(8000,planLimitW) : $1;`);
    for (const node of flows.filter(n => n.type === 'function' && n.func?.includes('function witGridTransport('))) {
        node.func = node.func.replace('phase.some(n=>n===null) || !telemetryFresh', `(!(${flag}) && phase.some(n=>n===null)) || !telemetryFresh`)
            .replace(/const headroom=([^\n]+);/, `const headroom=${flag} ? 8000 : $1;`);
    }
    const settings = flows.find(n => n.id === 'esswitgrid_set01');
    settings.func = `if(msg.topic==='ess/wit/meter-includes-ev') {
 if(typeof msg.payload!=='boolean') return null;
 flow.set('ess_wit_meter_includes_ev',msg.payload);
 return {payload:Date.now()};
}
` + settings.func;
    settings.func = `if(msg.topic==='ess/wit/hardware-grid-guard') {
 if(typeof msg.payload!=='boolean') return null;
 flow.set('ess_wit_hardware_grid_guard',msg.payload);
 return {payload:Date.now()};
}
` + settings.func;
    const save = flows.find(n => n.id === 'essprefs_save');
    save.func = save.func.replace('return result;', "result.witMeterIncludesEV=flow.get('ess_wit_meter_includes_ev')===true;\n    result.witHardwareGridGuard=flow.get('ess_wit_hardware_grid_guard')===true;\n    return result;");
    const restore = flows.find(n => n.id === 'essprefs_restore');
    restore.func = restore.func.replace('for (const [key,value] of Object.entries(candidate))', "candidate.ess_wit_meter_includes_ev=saved.witMeterIncludesEV===true;\n    candidate.ess_wit_hardware_grid_guard=saved.witHardwareGridGuard===true;\n    for (const [key,value] of Object.entries(candidate))");
};
