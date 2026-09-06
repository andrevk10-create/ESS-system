const helpers = require('./wit-runtime');
const helperSource = Object.values(helpers).map(fn => fn.toString()).join('\n');

module.exports = function hardenWit(flows) {
    const get = id => flows.find(n => n.id === id);
    const grid = get('esswitgrid_ctrl1');
    const ev = get('esswitaudi_ctrl1');
    const exportControl = get('esswitexport_ctrl');
    for (const n of [grid, ev]) {
        n.func = n.func.replace('item.last_updated || item.last_changed', 'item.last_reported || item.last_updated || item.last_changed');
        n.func = helperSource + '\n' + n.func;
        n.func = n.func.replace(/const tomorrowPrefix = 'sensor.energy_production_tomorrow';[\s\S]*?const tomorrowForecastKwh = [^;]*;/,
            `const solarWindow = witSolarWindow(states, flow.get('ess_system_config') || {}, now, flow.get('ess_solar_forecast_audit'), ${n === grid});
const forecastValid = solarWindow.valid;
const tomorrowForecastKwh = solarWindow.inputKwh;`);
        n.func = n.func.replace('const details = {', `const details = {
    forecastWindow:solarWindow.label,
    forecastDate:solarWindow.forecastDate,
    forecastSourceCount:solarWindow.sourceCount,
    forecastTomorrowKwh:solarWindow.tomorrowKwh,
    requestedPowerW:0,
    commandConfirmed:false,
    powerConfirmed:false,
    measuredBatteryPowerW: (() => { const raw = value('sensor.growatt_battery_battery_power'); return raw === null ? null : raw * (Number(flow.get('ess_growatt_battery_power_scale')) === 0.1 ? 0.1 : 1); })(),`);
        n.func = n.func.replaceAll('Zonverwachting voor morgen ontbreekt of is te oud', 'Zonverwachting voor de komende laadperiode ontbreekt of is te oud');
        // A pending export-off handover also reserves the controller. The export
        // loop must not re-enable the limit in the minute before the next tick.
        n.func = n.func.replace(/sessionOwned:previous.sessionOwned === true, status:'Exportbegrenzing/, "sessionOwned:previous.sessionOwned === true, pendingUntil:now + 90000, status:'Exportbegrenzing");
        n.func = n.func.replace('...previous,\n        ...fields,', '...previous,\n        pendingUntil:0,\n        ...fields,');
    }
    exportControl.func = exportControl.func
        .replace('audiDischargeStatus.sessionOwned === true;', 'audiDischargeStatus.sessionOwned === true || Number(audiDischargeStatus.pendingUntil) > Date.now();')
        .replace('gridChargeStatus.sessionOwned === true;', 'gridChargeStatus.sessionOwned === true || Number(gridChargeStatus.pendingUntil) > Date.now();');
    ev.func = ev.func.replace('if (gridChargeStatus.sessionOwned === true)', 'if (gridChargeStatus.sessionOwned === true || Number(gridChargeStatus.pendingUntil) > now)');
    grid.func = grid.func.replace('if (audiDischarge.sessionOwned === true)', 'if (audiDischarge.sessionOwned === true || Number(audiDischarge.pendingUntil) > now)');

    ev.func = ev.func.replace('const houseReserveKwh = reserveProfile.houseReserveKwh;',
        "const houseReserveKwh = witHouseReserve(flow.get('ess_house_consumption_learning'), reserveProfile.houseReserveKwh);");
    grid.func = grid.func.replace('const reserveProfile = reserveProfiles[reserveMode];',
        "const reserveProfile = { ...reserveProfiles[reserveMode], houseReserveKwh:witHouseReserve(flow.get('ess_house_consumption_learning'), reserveProfiles[reserveMode].houseReserveKwh) };");
    grid.func = grid.func.replace('const installationChargeLimitW = 12000;',
        "const installationChargeLimitW = (Number((flow.get('ess_system_config') || {}).specs?.maximumBatteryChargePowerKw) || 12) * 1000;");
    grid.func = grid.func.replace('const designPhaseCurrentA = 22;',
        "const designPhaseCurrentA = Math.max(0, (Number((flow.get('ess_system_config') || {}).specs?.mainFuseA) || 25) - 3);");
    grid.func = grid.func.replace('const nominalVoltageV = 230;',
        "const nominalVoltageV = Number((flow.get('ess_system_config') || {}).specs?.voltage) || 230;");
    // Day-ahead prices belong to explicit intervals and do not become wrong
    // after three hours. Reuse a recent cache during a cloud interruption, but
    // still discard expired intervals and never invent missing quarters.
    grid.func = grid.func.replace('priceAge <= 3 * 60 * 60 * 1000', 'priceAge <= 36 * 60 * 60 * 1000');
    grid.func = grid.func.replace(/function directBatteryLimitW\(\) \{[\s\S]*?\n\}\n\nif \(!states\)/,
        `function directBatteryLimitW() {
    return witBatteryLimit(states, flow.get('ess_system_config') || {}, 'charge', installationChargeLimitW, now);
}

if (!states)`);
    grid.func = grid.func.replace('return Number.isFinite(Number(value)) ?', "return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ?");
    // Household demand must also be subtracted from incoming solar; clamping
    // stored energy to zero first used to make that demand disappear entirely.
    grid.func = grid.func.replace('const expectedSolarChargeKwh = expectedSolarInputKwh === null ? null : expectedSolarInputKwh * chargeEfficiency;',
        `const houseAfterStoredKwh = currentStoredKwh === null ? 0 : Math.max(0, reserveProfile.houseReserveKwh - currentStoredKwh);
const expectedSolarChargeKwh = expectedSolarInputKwh === null ? null : Math.max(0, expectedSolarInputKwh * chargeEfficiency - houseAfterStoredKwh);`);
    grid.func = grid.func.replace("if (soc >= targetSoc - 0.2)", "if (soc >= Math.min(targetSoc, value('number.growatt_charge_cutoff_soc') ?? 100) - 0.2)");
    // Live safety room is calculated from measured load, never an unconfirmed
    // setpoint. In particular a falling BMS cap must not create fictitious room.
    grid.func = grid.func.replace(/const currentForcedPowerW = previous.sessionOwned[^;]*;/,
        `const measuredChargeW = Math.max(0, (value('sensor.growatt_battery_battery_power') || 0) * (Number(flow.get('ess_growatt_battery_power_scale')) === 0.1 ? 0.1 : 1));
const currentForcedPowerW = previous.sessionOwned === true && remoteState === 'enabled' && remotePercent > 0 ? Math.min(measuredChargeW, Math.max(0, Number(previous.targetPowerW) || 0)) : 0;`);
    grid.func = grid.func.replace('Math.max(0, currentForcedPowerW + phaseAdditionalHeadroomW)',
        'Math.max(0, 3 * Math.min(...phasePowers.map(power => designPhaseCurrentA * nominalVoltageV - power + currentForcedPowerW / 3)))');
    grid.func = grid.func.replace('Math.min(67, Math.floor(targetPowerW', 'Math.min(100, Math.floor(targetPowerW');
    // Downward changes always apply; hysteresis must not hold an unsafe limit.
    grid.func = grid.func.replace("Math.abs(powerPercent - Number(previous.powerPercent || 0)) <= 1", "powerPercent > Number(previous.powerPercent || 0) && powerPercent - Number(previous.powerPercent || 0) <= 1");
    ev.func = ev.func.replace('Math.abs(powerPercent - previousPowerPercent) <= 1', 'powerPercent > previousPowerPercent && powerPercent - previousPowerPercent <= 1');
    ev.func = ev.func.replace('Math.min(44, Math.floor(targetPowerW', 'Math.min(100, Math.floor(targetPowerW');
    ev.func = ev.func.replace('targetPowerW = Math.min(maximumBatteryPowerW,',
        "targetPowerW = Math.min(witBatteryLimit(states, flow.get('ess_system_config') || {}, 'discharge', maximumBatteryPowerW, now), safeDischargeBudgetKwh * 1000 / (durationMinutes / 60),");
    ev.func = ev.func.replace('const chargerPowerW = chargerPowerKw === null ? null : chargerPowerKw * 1000;',
        "const chargerPowerW = chargerPowerKw === null ? null : chargerPowerKw * (String(entity('sensor.ev_charger_power')?.attributes?.unit_of_measurement || 'kW').toLowerCase() === 'w' ? 1 : 1000);");
    ev.func = ev.func.replace(/const currentForcedPowerW = previous.sessionOwned[\s\S]*?\n    : 0;/,
        `const measuredDischargeW = fresh('sensor.growatt_battery_battery_power', 120000) ? Math.max(0, -(value('sensor.growatt_battery_battery_power') || 0) * (Number(flow.get('ess_growatt_battery_power_scale')) === 0.1 ? 0.1 : 1)) : 0;
const currentForcedPowerW = previous.sessionOwned === true && remoteState === 'enabled' && remotePowerPercent < 0
    ? Math.min(measuredDischargeW, -remotePowerPercent / 100 * inverterRatedPowerW) : 0;`);
    grid.func = grid.func.replace("if (!chargeOption || !holdOption ||", "if (!chargeOption ||");
    // Mode (VPP) is an optimistic command selector and may be unknown after
    // integration startup. Its supported options, not a cached command, decide
    // whether a new session can be started.
    ev.func = ev.func.replace('unavailable(modeEntity) || unavailable(vppRateEntity)', '!modeEntity || unavailable(vppRateEntity)');
    grid.func = grid.func.replace("const measuredChargeW = Math.max", "const measuredChargeW = fresh('sensor.growatt_battery_battery_power', 120000) ? Math.max")
        .replace("=== 0.1 ? 0.1 : 1));\nconst currentForcedPowerW", "=== 0.1 ? 0.1 : 1)) : 0;\nconst currentForcedPowerW");
    grid.func = grid.func.replace('const currentForcedPowerW = previous.sessionOwned',
        `const directSolarW = value('sensor.growatt_solar_solar_total_power');
const solarUsable = directSolarW !== null && (fresh('sensor.growatt_solar_solar_total_power', 120000) || (directSolarW === 0 && String(entity('sun.sun')?.state) === 'below_horizon'));
// Battery charging from direct PV is not evidence of net charging. Crediting
// it as already present on the grid would overestimate available fuse headroom.
const measuredNetChargeW = solarUsable ? Math.max(0, measuredChargeW - Math.max(0, directSolarW)) : 0;
const currentForcedPowerW = previous.sessionOwned`).replace('Math.min(measuredChargeW,', 'Math.min(measuredNetChargeW,');
    ev.func = ev.func.replace("+' W) · morgen '+tomorrowForecastKwh", "+' W) · '+solarWindow.label+' '+tomorrowForecastKwh");
    get('esswithist_prep1').func = get('esswithist_prep1').func.replace('finite(status.tomorrowForecastKwh)',
        "finite(Object.prototype.hasOwnProperty.call(status, 'forecastTomorrowKwh') ? status.forecastTomorrowKwh : status.tomorrowForecastKwh)");
    get('esswithist_prep1').func = get('esswithist_prep1').func
        .replace('const requestedPowerW = active ?', 'const requestedPowerW = status.sessionOwned === true ?')
        .replace('const requestedGridChargeW = gridChargeActive ?', 'const requestedGridChargeW = gridChargeStatus.sessionOwned === true ?')
        .replace('regelaar_bijgewerkt:status.updatedAt', "opdracht_bevestigd:status.commandConfirmed === true,\n        accuvermogen_bevestigd:status.powerConfirmed === true,\n        prognosedatum:status.forecastDate || null,\n        woningreserve_kwh:rounded(status.houseReserveKwh, 2),\n        regelaar_bijgewerkt:status.updatedAt")
        .replace('regelaar_bijgewerkt:gridChargeStatus.updatedAt', "opdracht_bevestigd:gridChargeStatus.commandConfirmed === true,\n        accuvermogen_bevestigd:gridChargeStatus.powerConfirmed === true,\n        prognosevenster:gridChargeStatus.forecastWindow || null,\n        woningreserve_kwh:rounded(gridChargeStatus.expectedHouseKwh, 2),\n        regelaar_bijgewerkt:gridChargeStatus.updatedAt");

    // A power adjustment renews the two-minute lease only AFTER it succeeded.
    get('esswitgrid_live1').wires = [['esswitgrid_renew']];
    // Publish observed power separately: the Mode (VPP) select is only the last
    // command and is not proof the inverter or BMS accepted the request.
    for (const [n, direction] of [[grid, 1], [ev, -1]]) {
        n.func = n.func.replace('const liveDetails = {', 'details.requestedPowerW = targetPowerW;\nconst liveDetails = {');
        const marker = "save('active', { ...liveDetails";
        const pos = n.func.indexOf(marker);
        if (pos < 0) throw new Error('WIT confirmation insertion point missing');
        const confirmation = `const commandConfirmed = remoteState === 'enabled' && (${direction} * ${n === grid ? 'remotePercent' : 'remotePowerPercent'}) >= 3;
const measuredPowerW = liveDetails.measuredBatteryPowerW;
const powerConfirmed = commandConfirmed && fresh('sensor.growatt_battery_battery_power', 120000) && measuredPowerW !== null && ${direction} * measuredPowerW >= 200;
liveDetails.commandConfirmed = commandConfirmed;
liveDetails.powerConfirmed = powerConfirmed;
liveDetails.requestedPowerW = targetPowerW;
if (!powerConfirmed) {
    save('blocked', { ...liveDetails, sessionOwned:true, active:false, status:'Opdracht ingesteld; nog geen ${direction > 0 ? 'laden' : 'ontladen'} gemeten · controleer BMS/Modbus' });
    return [null, null, { payload:{ option:'Enabled' } }, null, null];
}
`;
        n.func = n.func.slice(0, pos) + confirmation + n.func.slice(pos);
    }

    // Preserve role mapping for writes too. JSONata reads the existing local
    // allowlisted role, without letting a dashboard message choose any target.
    for (const n of flows) {
        if (n.type !== 'api-call-service' || !n.id.startsWith('esswit') || !Array.isArray(n.entityId) || n.entityId.length !== 1) continue;
        const canonical = n.entityId[0];
        if (!/^(select|number)\.growatt_/.test(canonical)) continue;
        n.essCanonicalTarget = canonical;
        n.entityId = [];
        n.dataType = 'jsonata';
        const body = n.data.trim().slice(1, -1);
        n.data = `($c := $flowContext('ess_system_config'); $id := $exists($c) ? $lookup($c.entities, '${canonical}') : '${canonical}'; $assert($type($id) = 'string' and $contains($id, /^${canonical.split('.')[0]}\\.[a-z0-9_]+$/), 'WIT doelentiteit ontbreekt'); {"entity_id":$id,${body}})`;
    }
};
