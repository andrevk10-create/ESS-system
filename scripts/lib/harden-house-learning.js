const { housePowerSample, houseLearningStep } = require('./house-learning');

module.exports = function hardenHouseLearning(flows) {
    const history = flows.find(node => node.id === 'esswithist_prep1');
    const start = history.func.indexOf('// Leer het normale woningverbruik');
    const end = history.func.indexOf('const decisionState =', start);
    if (start < 0 || end < 0) throw new Error('Household learning insertion point missing');
    history.func = history.func.slice(0, start) + `// Leer het normale woningverbruik zonder beide laadpunten.
${housePowerSample.toString()}
${houseLearningStep.toString()}
const loadEnergyTodayKwh = energyKwh('sensor.growatt_load_load_energy_today');
const restoredHouseForecast = states['sensor.ess_woningverbruik_basis_verwacht_morgen'];
const houseSample = housePowerSample(rawStates, essRuntimeConfig, flow.get('ess_dashboard_live') || {}, audiControlStatus, now.getTime());
const houseLearning = houseLearningStep(flow.get('ess_house_consumption_learning'), restoredHouseForecast && restoredHouseForecast.attributes,
    houseSample, now.getTime(), profile.houseReserveKwh, profile.label);
flow.set('ess_house_consumption_learning', houseLearning);
const { recentDays:recentHouseDays, currentDate:houseLearningDate, currentValueKwh:currentHouseKwh, coverageHours,
    lastBasePowerW:previousBasePowerW, forecastKwh:houseForecastBaseKwh, source:houseForecastSource } = houseLearning;
const lastSampleAt = now.getTime();
const audiPlannedTomorrowKwh = plannedEnergyForDay(audiControlStatus, tomorrowKey);
const witPlannedTomorrowKwh = plannedEnergyForDay(gridChargeStatus, tomorrowKey);
const totalConsumptionTomorrowKwh = houseForecastBaseKwh + audiPlannedTomorrowKwh + witPlannedTomorrowKwh;
` + history.func.slice(end);
    history.func = history.func.replace('bron:houseForecastSource,', `bron:houseForecastSource,
        model_version:2,
        sample_valid:houseLearning.sampleValid,
        sample_reason:houseLearning.sampleReason,
        excluded_ev_power_w:rounded(houseLearning.excludedEVPowerW),
        charger_measurements:houseLearning.chargers,`)
        .replace("meetmethode:'Integraal van totale dashboard-woningbalans minus werkelijk EV-laadvermogen'",
            "meetmethode:'Integraal van totale dashboard-woningbalans minus beide laadpunten; alleen geldige meetmomenten'");
    // Preserve the historical primary-charger sensor while respecting its unit.
    history.func = history.func.replace("const audiPowerW = value('sensor.ev_charger_power', 1000);",
        "const audiPowerUnit = String(states['sensor.ev_charger_power']?.attributes?.unit_of_measurement || 'kW').trim().toLowerCase();\nconst audiPowerW = ['w','kw'].includes(audiPowerUnit) ? value('sensor.ev_charger_power', audiPowerUnit === 'kw' ? 1000 : 1) : null;");

    const mapper = flows.find(node => node.id === 'ess00000000000a');
    mapper.func = mapper.func.replace('const learnedHouseForecastValue = houseConsumptionLearning.forecastKwh;',
        'const learnedHouseForecastValue = houseConsumptionLearning.schemaVersion === 2 ? houseConsumptionLearning.forecastKwh : null;');
    mapper.func = mapper.func.replace("const restoredHouseForecastKwh = value('sensor.ess_woningverbruik_basis_verwacht_morgen');",
        "const restoredHouseForecastKwh = states['sensor.ess_woningverbruik_basis_verwacht_morgen']?.attributes?.model_version === 2 ? value('sensor.ess_woningverbruik_basis_verwacht_morgen') : null;");
};
