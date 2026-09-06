// Self-contained helpers, embedded in the Node-RED history function at build time.
function housePowerSample(rawStates, config, dashboard, control, now) {
    const states = rawStates || {};
    const mapping = config.entities || {};
    const number = value => value === null || value === undefined || value === '' || typeof value === 'boolean'
        ? null : Number.isFinite(Number(value)) ? Number(value) : null;
    const id = role => Object.prototype.hasOwnProperty.call(mapping, role) ? mapping[role] : role;
    const entity = role => id(role) ? states[id(role)] : null;
    const ageOk = (stamp, limit) => {
        const age = now - new Date(stamp || 0).getTime();
        return Number.isFinite(age) && age >= -60000 && age <= limit;
    };
    const fresh = (item, limit = 120000) => !!item && number(item.state) !== null
        && ageOk(item.last_reported || item.last_updated || item.last_changed, limit);
    const statusFresh = item => !!item && !['', 'unknown', 'unavailable'].includes(String(item.state).toLowerCase())
        && ageOk(item.last_reported || item.last_updated || item.last_changed, 120000);
    const watts = item => {
        const value = item && number(item.state);
        const unit = String(item && item.attributes && item.attributes.unit_of_measurement || 'kW').trim().toLowerCase();
        return value === null || value === undefined || value < 0 ? null
            : unit === 'w' ? value : unit === 'kw' ? value * 1000 : null;
    };
    const chargers = [];
    const seen = new Set();
    for (const suffix of ['', '_2']) {
        const prefix = 'sensor.ev_charger' + suffix;
        const roles = [prefix + '_power', prefix + '_status', prefix + '_energy_today'];
        const installed = roles.some(role => !!entity(role) || !!id(role) && id(role) !== role);
        if (!installed) { chargers.push({ powerW:0, source:'Niet gekoppeld' }); continue; }
        const identity = id(prefix + '_power') || id(prefix + '_status');
        if (identity && seen.has(identity)) { chargers.push({ powerW:0, source:'Zelfde laadpunt' }); continue; }
        if (identity) seen.add(identity);
        const power = entity(prefix + '_power');
        const state = entity(prefix + '_status');
        const current = entity(prefix + '_current');
        const powerW = watts(power);
        const stateText = String(state && state.state || '').toLowerCase();
        const controllerActive = suffix === '' && ageOk(control.updatedAt, 120000)
            && (control.actualCharging === true || control.chargingConfirmed === true || number(control.chargerPowerW) > 100);
        const currentActive = fresh(current) && number(current.state) > 0.5;
        const charging = stateText === 'charging' || controllerActive || currentActive;
        const idle = statusFresh(state) && ['disconnected', 'no_car_connected', 'awaiting_start', 'awaiting_authorization',
            'ready_to_charge', 'completed', 'finished', 'paused', 'standby', 'idle'].includes(stateText);
        // P1-based controller estimates include household demand: never subtract
        // them as measured EV power. They can only disqualify an apparent zero.
        if (fresh(power) && powerW !== null && !(powerW <= 100 && charging) && !(powerW > 100 && idle)) {
            chargers.push({ powerW, source:'Vermogensmeter' });
        } else if (idle && !controllerActive && !currentActive && !(fresh(power) && powerW > 100)) {
            chargers.push({ powerW:0, source:'Bevestigd niet laden' });
        } else {
            chargers.push({ powerW:null, source:'Laadmeting ontbreekt, is oud of spreekt laadstatus tegen' });
        }
    }
    const invalid = reason => ({ basePowerW:null, evPowerW:null, chargers, reason });
    if (chargers.some(charger => charger.powerW === null)) return invalid('Geen betrouwbare meting van beide laadpunten');
    const totalW = number(dashboard.house && dashboard.house.power);
    // A refreshed dashboard may still contain old source values or a partial
    // backup-load fallback. Neither is suitable for learning whole-house demand.
    if (totalW === null || totalW < 0 || !ageOk(dashboard.updatedAt, 30000)
        || !fresh(entity('sensor.p1_meter_vermogen'), 30000)
        || !fresh(entity('sensor.growatt_solar_system_output_power'))) return invalid('Totale woningbalans ontbreekt of is oud');
    const night = states['sun.sun'] && states['sun.sun'].state === 'below_horizon';
    if (!night) {
        for (const role of ['sensor.pv_array_1_power', 'sensor.pv_array_2_power', 'sensor.pv_array_3_power']) {
            if ((entity(role) || id(role) && id(role) !== role) && !fresh(entity(role), 15 * 60000)) {
                return invalid('Zonmeting voor de woningbalans ontbreekt of is oud');
            }
        }
    }
    const evPowerW = chargers.reduce((sum, charger) => sum + charger.powerW, 0);
    if (evPowerW > totalW + 100) return invalid('Laadvermogen is groter dan de totale woningbalans');
    return { basePowerW:Math.max(0, totalW - evPowerW), evPowerW, chargers, reason:'Beide laadpunten uitgesloten' };
}

function houseLearningStep(previous, restored, sample, now, fallback, profileLabel) {
    const number = value => value === null || value === undefined || value === '' || typeof value === 'boolean'
        ? null : Number.isFinite(Number(value)) ? Number(value) : null;
    const dayKey = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
    const today = dayKey(new Date(now));
    // Restore one complete, compatible model. Never mix new samples with old
    // HA attributes: version 1 could include EV energy in its household history.
    const model = previous && previous.schemaVersion === 2 ? previous
        : restored && restored.model_version === 2 ? {
            recentDays:restored.recent_days, currentDate:restored.current_date,
            currentValueKwh:restored.current_value_kwh, coverageHours:restored.coverage_hours,
            lastBasePowerW:restored.last_base_power_w, lastSampleAt:restored.last_sample_at
        } : {};
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    const recent = new Map((Array.isArray(model.recentDays) ? model.recentDays : [])
        .filter(day => day && /^\d{4}-\d{2}-\d{2}$/.test(day.date) && day.date >= dayKey(cutoff) && day.date < today
            && number(day.kwh) !== null && number(day.kwh) >= 0.5 && number(day.kwh) <= 200)
        .map(day => [day.date, { date:day.date, kwh:number(day.kwh) }]));
    let currentValueKwh = number(model.currentValueKwh) || 0;
    let coverageHours = number(model.coverageHours) || 0;
    let lastBasePowerW = number(model.lastBasePowerW);
    let lastSampleAt = new Date(model.lastSampleAt || 0).getTime();
    if (model.currentDate !== today) {
        const normalized = coverageHours >= 18 ? currentValueKwh * 24 / Math.min(24, coverageHours) : null;
        if (model.currentDate >= dayKey(cutoff) && model.currentDate < today && normalized >= 0.5 && normalized <= 200) {
            recent.set(model.currentDate, { date:model.currentDate, kwh:normalized });
        }
        currentValueKwh = 0;
        coverageHours = 0;
        lastBasePowerW = null;
        lastSampleAt = 0;
    }
    const elapsedHours = lastSampleAt > 0 ? (now - lastSampleAt) / 3600000 : null;
    if (sample.basePowerW !== null && lastBasePowerW !== null && elapsedHours > 0 && elapsedHours <= 5 / 60) {
        currentValueKwh += (lastBasePowerW + sample.basePowerW) / 2 * elapsedHours / 1000;
        coverageHours += elapsedHours;
    }
    const recentDays = [...recent.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
    const values = recentDays.map(day => day.kwh).sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    const forecastKwh = values.length ? values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2 : fallback;
    return {
        schemaVersion:2, recentDays, currentDate:today, currentValueKwh, coverageHours,
        lastBasePowerW:sample.basePowerW, lastSampleAt:new Date(now).toISOString(), forecastKwh,
        source:values.length ? 'Mediaan van ' + values.length + ' afgeronde dag(en), zonder beide laadpunten'
            : 'Startwaarde van reserveprofiel ' + profileLabel + ' · woningverbruik opnieuw leren',
        sampleValid:sample.basePowerW !== null, sampleReason:sample.reason,
        excludedEVPowerW:sample.evPowerW, chargers:sample.chargers, updatedAt:new Date(now).toISOString()
    };
}

module.exports = { housePowerSample, houseLearningStep };
