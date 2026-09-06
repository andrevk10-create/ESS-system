// These pure helpers are embedded in the Node-RED functions at build time.
// No extra runtime module or local installation data is shipped with the flow.
function witNumber(value) {
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function witFresh(item, now, maxAge) {
    if (!item || ['unknown', 'unavailable', ''].includes(String(item.state).toLowerCase())) return false;
    const stamp = new Date(item.last_reported || item.last_updated || item.last_changed || 0).getTime();
    return stamp > 0 && now - stamp >= -60000 && now - stamp <= maxAge;
}

function witSolarWindow(states, config, now, audit, rolling) {
    const date = new Date(now);
    const dayKey = d => [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
    const today = dayKey(date);
    const tomorrow = dayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1));
    const hour = date.getHours() + date.getMinutes() / 60;
    const sun = states['sun.sun'];
    const sunAttributes = sun && sun.attributes || {};
    const nextRise = new Date(sunAttributes.next_rising || 0);
    const nextSet = new Date(sunAttributes.next_setting || 0);
    const beforeSunrise = sun && sun.state === 'below_horizon'
        ? dayKey(nextRise) === today : hour < 6;
    const afterSunset = sun && sun.state === 'below_horizon' ? !beforeSunrise : hour >= 18 && !sun;
    // At 02:00 the next solar day is TODAY, not the day after tomorrow.
    const forecastDate = afterSunset ? tomorrow : today;
    const maxAge = beforeSunrise || afterSunset ? 18 * 3600000 : 3 * 3600000;
    const seen = new Set();
    const groups = [];
    for (const suffix of ['', '_2', '_3']) {
        const todayRole = 'sensor.energy_production_today' + suffix;
        const tomorrowRole = 'sensor.energy_production_tomorrow' + suffix;
        const remainingRole = 'sensor.energy_production_today_remaining' + suffix;
        const mapping = config.entities || {};
        const explicitlyDisabled = Object.prototype.hasOwnProperty.call(mapping, tomorrowRole) && !mapping[tomorrowRole];
        if (explicitlyDisabled) continue;
        const next = states[tomorrowRole];
        const current = states[todayRole];
        if (!next && !current) continue;
        const identity = (next || current).entity_id || mapping[tomorrowRole] || tomorrowRole;
        if (seen.has(identity)) continue;
        seen.add(identity);
        const kwh = item => {
            if (!witFresh(item, now, maxAge)) return null;
            const n = witNumber(item.state);
            const unit = String(item.attributes && item.attributes.unit_of_measurement || 'kWh').toLowerCase();
            return n === null || n < 0 ? null : unit === 'wh' ? n / 1000 : unit === 'mwh' ? n * 1000 : n;
        };
        // The remaining sensor is paired through the configured today entity;
        // it is never found by summing arbitrary similarly named entities.
        const actualTodayId = mapping[todayRole] || todayRole;
        const remainingId = actualTodayId.replace('energy_production_today', 'energy_production_today_remaining');
        const remaining = states[remainingId] || states[remainingRole];
        let todayRemaining = beforeSunrise ? kwh(current) : kwh(remaining);
        if (beforeSunrise && current && dayKey(new Date(current.last_reported || current.last_updated || 0)) !== today) {
            const nextDate = next && dayKey(new Date(next.last_reported || next.last_updated || 0));
            todayRemaining = nextDate !== today ? kwh(next) : null;
        }
        if (afterSunset) todayRemaining = 0;
        if (todayRemaining === null && !afterSunset && !beforeSunrise) {
            // Without a remaining forecast use a conservative daylight fraction.
            const total = kwh(current);
            const sunsetHour = dayKey(nextSet) === today ? nextSet.getHours() + nextSet.getMinutes() / 60 : 18;
            todayRemaining = total === null ? null : total * Math.max(0, Math.min(1, (sunsetHour - hour) / 12));
        }
        groups.push({ today: todayRemaining, tomorrow: kwh(next) });
    }
    const sum = key => groups.length && groups.every(g => g[key] !== null) ? groups.reduce((n, g) => n + g[key], 0) : null;
    let todayRemaining = sum('today');
    // Forecast.Solar can keep yesterday's update overnight. The date-stamped
    // reference recorded before midnight is the safe fallback for this morning.
    if (beforeSunrise && todayRemaining === null && audit) {
        const cached = audit.todayDate === today ? audit.todayForecastKwh : audit.tomorrowDate === today ? audit.tomorrowForecastKwh : null;
        const age = now - new Date(audit.updatedAt || 0).getTime();
        if (witNumber(cached) !== null && age >= 0 && age < 18 * 3600000) todayRemaining = Math.max(0, Number(cached));
    }
    // A pre-midnight "tomorrow" reading now describes TODAY. Do not relabel
    // it as tomorrow in the forecast error history.
    const nextDatesValid = !beforeSunrise || ['', '_2', '_3'].every(suffix => {
        const item = states['sensor.energy_production_tomorrow' + suffix];
        return !item || dayKey(new Date(item.last_reported || item.last_updated || 0)) === today;
    });
    const tomorrowTotal = nextDatesValid ? sum('tomorrow') : null;
    let inputKwh = afterSunset ? tomorrowTotal : todayRemaining;
    if (rolling && !afterSunset && !beforeSunrise) {
        // Only the fraction of tomorrow's daylight inside the rolling horizon.
        // Today remaining is preferred over the already-produced daily total.
        const tomorrowFraction = Math.max(0, Math.min(1, (hour - 6) / 12));
        inputKwh = todayRemaining === null || tomorrowTotal === null ? null : todayRemaining + tomorrowTotal * tomorrowFraction;
    } else if (!rolling && !afterSunset && !beforeSunrise) {
        // EV support aims to refill by the NEXT solar day, not necessarily
        // before sunset today. After midnight that next solar day is today.
        inputKwh = todayRemaining === null || tomorrowTotal === null ? null : todayRemaining + tomorrowTotal;
    }
    return { valid: inputKwh !== null, inputKwh, forecastDate, todayRemainingKwh: todayRemaining,
        tomorrowKwh: tomorrowTotal, sourceCount: groups.length,
        label: rolling ? 'Komende 24 uur' : (!beforeSunrise && !afterSunset ? 'Rest vandaag + morgen' : forecastDate === today ? 'Vandaag / komende ochtend' : 'Morgen') };
}

function witHouseReserve(learning, fallback) {
    const learned = learning && witNumber(learning.forecastKwh);
    // Only a completed-day model may override the bootstrap reserve.
    return learned !== null && learned !== undefined && Array.isArray(learning.recentDays) && learning.recentDays.length
        ? Math.max(fallback, Math.min(200, learned)) : fallback;
}

function witBatteryLimit(states, config, direction, fallbackW, now) {
    const roles = direction === 'charge'
        ? ['sensor.battery_charge_power_limit', 'sensor.battery_charge_current_limit']
        : ['sensor.battery_discharge_power_limit', 'sensor.battery_discharge_current_limit'];
    let limit = fallbackW;
    const voltageItem = states['sensor.growatt_battery_battery_voltage'];
    const voltage = voltageItem && witNumber(voltageItem.state);
    for (const role of roles) {
        const mapped = config.entities && config.entities[role];
        if (!mapped) continue;
        const item = states[role];
        const n = item && witNumber(item.state);
        // A configured BMS limit at zero or unavailable must never be ignored.
        if (n === null || n === undefined || n < 0 || !witFresh(item, now, 5 * 60000)) return 0;
        const unit = String(item.attributes && item.attributes.unit_of_measurement || '').toLowerCase();
        if (unit === 'kw') limit = Math.min(limit, n * 1000);
        else if (unit === 'w') limit = Math.min(limit, n);
        else if (unit === 'a' && voltage !== null && voltage > 0 && witFresh(voltageItem, now, 5 * 60000)) limit = Math.min(limit, n * voltage);
        else return 0;
    }
    return Math.max(0, limit);
}

module.exports = { witNumber, witFresh, witSolarWindow, witHouseReserve, witBatteryLimit };
