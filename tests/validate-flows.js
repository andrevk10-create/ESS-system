const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const flows = JSON.parse(fs.readFileSync(path.join(root, 'flows.json'), 'utf8'));
const ids = flows.map((node) => node.id);
const knownIds = new Set(ids);

assert.strictEqual(knownIds.size, ids.length, 'Node-RED bevat dubbele node-id’s');

for (const node of flows) {
    for (const output of node.wires || []) {
        for (const target of output) {
            assert(knownIds.has(target), `Node ${node.id} verwijst naar ontbrekende node ${target}`);
        }
    }
    if (node.type === 'function') {
        // Compileren zonder uitvoeren controleert de JavaScript-syntaxis van de function-node.
        new Function('global', 'flow', 'node', 'msg', node.func);
    }
}

const ui = flows.find((node) => node.type === 'ui-template');
assert(ui, 'Dashboard ui-template ontbreekt');
assert(ui.format.includes("config.siteName||'Smart ESS'"), 'Configureerbare neutrale dashboardnaam ontbreekt');
assert.strictEqual(ui.height, '13', 'Beknopt overzicht moet de beschikbare tablethoogte vullen');
for (const route of ['energie', 'accu', 'autos', 'verbruikers', 'verlichting', 'klimaat', 'systeem', 'configuratie']) {
    assert(ui.format.includes(`href="./${route}"`), `Overzicht mist een klikbare link naar ${route}`);
}

const pages = flows.filter((node) => node.type === 'ui-page');
const pagePaths = pages.map((page) => page.path);
assert.strictEqual(new Set(pagePaths).size, pagePaths.length, 'Dashboardpagina’s mogen geen dubbele route hebben');
for (const route of ['/overzicht', '/energie', '/accu', '/autos', '/verbruikers', '/verlichting', '/klimaat', '/systeem', '/configuratie']) {
    assert(pagePaths.includes(route), `Dashboardpagina ${route} ontbreekt`);
}

const detailTemplates = {
    energy: flows.find((node) => node.id === 'esstpl_energy001'),
    battery: flows.find((node) => node.id === 'esstpl_battery01'),
    ev: flows.find((node) => node.id === 'esstpl_ev0000001'),
    loads: flows.find((node) => node.id === 'esstpl_loads0001'),
    lighting: flows.find((node) => node.id === 'esstpl_lights001'),
    climate: flows.find((node) => node.id === 'esstpl_climate01'),
    system: flows.find((node) => node.id === 'esstpl_system001')
};
const configTemplate = flows.find((node) => node.id === 'esstpl_config001');
assert(configTemplate, 'Configureerbare installatiepagina ontbreekt');
assert(configTemplate.format.includes('Installatiegrenzen') && configTemplate.format.includes('Home Assistant-entiteiten'), 'Configuratiepagina mist installatiegrenzen of entiteitsrollen');
assert(configTemplate.format.includes("ess/config/save") && configTemplate.format.includes("ess/config/validate") && configTemplate.format.includes("ess/config/reset"), 'Configuratiepagina mist opslaan, controleren of herstellen');
assert(configTemplate.format.includes("ess/config/discover") && configTemplate.format.includes('Automatisch koppelen'), 'Configuratiepagina mist de automatische entiteitskoppeling');
assert(configTemplate.format.includes("Object.assign({},next.entities||{},parsed.entities)"), 'JSON-import moet een deelconfiguratie kunnen samenvoegen zonder bestaande koppelingen te wissen');
const configScript = configTemplate.format.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
assert(configScript, 'Configuratiescript ontbreekt');
new Function(configScript[1].replace(/export default/, 'return'));
const configControl = flows.find((node) => node.id === 'essconfig_control');
const configRead = flows.find((node) => node.id === 'essconfig_fileread');
const configWrite = flows.find((node) => node.id === 'essconfig_filewrite');
const configBackupRead = flows.find((node) => node.id === 'essconfig_bakread');
const configBackupWrite = flows.find((node) => node.id === 'essconfig_bakwrite');
const configReadDelay = flows.find((node) => node.id === 'essconfig_readdelay');
const configRetryDelay = flows.find((node) => node.id === 'essconfig_retrydelay');
assert(configControl && configRead && configWrite && configBackupRead && configBackupWrite && configReadDelay && configRetryDelay, 'Lokale configuratiecontroller, hercontrole, back-up of bestandsopslag ontbreekt');
assert.strictEqual(configRead.filename, '/config/node-red/ess-system-config.json');
assert.strictEqual(configWrite.filename, '/config/node-red/ess-system-config.json');
assert.strictEqual(configBackupRead.filename, '/config/node-red/ess-system-config.backup.json');
assert.strictEqual(configBackupWrite.filename, '/config/node-red/ess-system-config.backup.json');
assert.strictEqual(configRead.allProps, true, 'Hoofdconfiguratie moet het herstelonderwerp bij het lezen behouden');
assert.strictEqual(configBackupRead.allProps, true, 'Configuratieback-up moet het herstelonderwerp bij het lezen behouden');
assert(configControl.wires[1].includes(configWrite.id) && configControl.wires[1].includes(configBackupWrite.id), 'Opslaan moet hoofdconfiguratie en lokale back-up samen bijwerken');
assert(configReadDelay.wires[0].includes(configRead.id), 'De hoofdconfiguratie moet na de back-up worden verwerkt en dus voorrang krijgen');
assert.strictEqual(configRetryDelay.timeout, '10', 'De configuratie moet na de Home Assistant-start opnieuw worden gecontroleerd');
assert(configRetryDelay.wires[0].includes(configRead.id), 'De vertraagde hercontrole moet de opgeslagen hoofdconfiguratie opnieuw valideren');
assert(configControl.func.includes("msg.filename || ''") && configControl.func.includes('/config/node-red/ess-system-config.backup.json'), 'Configuratieherstel moet ook robuust op de gelezen bestandsnaam reageren');
assert(configControl.func.includes('parseStoredConfig') && configControl.func.includes('Buffer.from(payload)'), 'Configuratieherstel moet ook een Node-RED Buffer als JSON kunnen lezen');
assert(configControl.func.includes('ess_system_config_status') && configControl.func.includes('missing'), 'Configuratiecontroller moet entiteiten valideren en status publiceren');
assert(configControl.func.includes('siteName') && configControl.func.includes('modules') && configControl.func.includes('specs') && configControl.func.includes('entities'), 'Configuratiecontroller mist een configuratieonderdeel');
assert(configControl.func.includes('discoverEntities') && configControl.func.includes('chargerStatusCandidates') && configControl.func.includes('nasCpu'), 'Configuratiecontroller mist veilige apparaatherkenning');
assert(configControl.func.includes("ess_wit_grid_charge_mode', 'off") && configControl.func.includes("ess_audi_smart_enabled', false"), 'Uitgeschakelde modules moeten actieve automatische regeling veilig beëindigen');
for (const [name, template] of Object.entries(detailTemplates)) {
    assert(template, `Detailtemplate ${name} ontbreekt`);
    assert(template.format.includes('href="./overzicht"'), `Detailtemplate ${name} mist de terugkoppeling naar het overzicht`);
    const detailScript = template.format.match(/<script>\s*([\s\S]*?)\s*<\/script>/);
    assert(detailScript, `Dashboard-script ontbreekt in ${name}`);
    new Function(detailScript[1].replace(/export default/, 'return'));
}
const dashboardModel = flows.find((node) => node.id === 'ess000000000003');
assert(dashboardModel, 'Centraal dashboardmodel ontbreekt');
for (const template of [ui, configTemplate, ...Object.values(detailTemplates)]) {
    assert(dashboardModel.wires[0].includes(template.id), `Dashboardupdates worden niet naar ${template.name} gestuurd`);
}
assert(detailTemplates.energy.format.includes('Netbelasting per fase'), 'Energiepagina mist fasebelasting');
assert(detailTemplates.energy.format.includes('Dagtotalen'), 'Energiepagina mist de werkelijke dagtotalen');
assert(detailTemplates.energy.format.includes('Verwachting morgen') && detailTemplates.energy.format.includes('ZON VERWACHT MORGEN') && detailTemplates.energy.format.includes('VERBRUIK VERWACHT MORGEN'), 'Energiepagina mist de zon- en verbruiksverwachting voor morgen');
assert(detailTemplates.energy.format.includes('audiPlannedTomorrow') && detailTemplates.energy.format.includes('witPlannedTomorrow'), 'Morgenverwachting moet de geplande EV- en WIT-lading afzonderlijk tonen');
assert(detailTemplates.energy.format.includes('NET AFGENOMEN') && detailTemplates.energy.format.includes('TERUGGELEVERD'), 'Energiepagina mist de net-dagmeters');
assert(detailTemplates.battery.format.includes('Growatt WIT'), 'Accupagina mist WIT-details');
assert(detailTemplates.battery.format.includes('Automatisch') && detailTemplates.battery.format.includes('Handmatig aan') && detailTemplates.battery.format.includes('Handmatig uit'), 'Accupagina mist de driestandenbediening voor de WIT-exportbegrenzing');
assert(detailTemplates.battery.format.includes("ess/wit/export-mode") && detailTemplates.battery.format.includes('setWitExportMode'), 'WIT-exportknoppen moeten de beveiligde modusbediening gebruiken');
assert(detailTemplates.battery.format.includes('EV-accubuffer') && detailTemplates.battery.format.includes('audiDischargeBudgetKwh'), 'Accupagina mist de prognosegestuurde WIT-ontlaadstatus voor de EV');
assert(detailTemplates.battery.format.includes('Eco') && detailTemplates.battery.format.includes('Normaal') && detailTemplates.battery.format.includes('EV voorrang'), 'Accupagina mist een of meer reserveprofielen');
assert(detailTemplates.battery.format.includes("ess/wit/audi-buffer-mode") && detailTemplates.battery.format.includes('setWitEVBufferMode'), 'Reserveprofielknoppen moeten de beveiligde profielbediening gebruiken');
assert(detailTemplates.battery.format.includes('WIT slim netladen') && detailTemplates.battery.format.includes('witChargeTimeline.cells'), 'Accupagina mist de WIT-netlaadplanning voor 24 uur');
assert(detailTemplates.battery.format.includes('GEWENST SOC') && detailTemplates.battery.format.includes('VERWACHT ZONNELADEN') && detailTemplates.battery.format.includes('NOG VIA NET'), 'WIT-netlaadplanning mist doel-SOC of energieberekening');
assert(detailTemplates.battery.format.includes("ess/wit/grid-charge-mode") && detailTemplates.battery.format.includes('setWitGridChargeTargetSoc'), 'WIT-netladen moet veilig handmatig en automatisch bediend kunnen worden');
for (const label of ['VERGRENDELING', 'SOC', 'VANDAAG GELADEN', 'HUIDIG VERMOGEN', 'AANSLUITING', 'TEMPERATUUR']) {
    assert(detailTemplates.ev.format.includes(label), `Autopagina mist ${label}`);
}
assert(detailTemplates.ev.format.includes('toggleEVLock'), 'Autopagina mist de vergrendelknop');
assert(detailTemplates.ev.format.includes('startClimate'), 'Autopagina mist de klimaatknop');
assert(detailTemplates.ev.format.includes('MAX SOC OP ZON') && detailTemplates.ev.format.includes('ess/audi/solar-soc'), 'Laadplanning mist de afzonderlijke maximale zonne-SOC');
assert(detailTemplates.ev.format.includes('<select') && detailTemplates.ev.format.includes('socSetting'), 'SOC-instellingen moeten compacte keuzelijsten gebruiken');
assert(!detailTemplates.ev.format.includes('type="number"'), 'SOC-instellingen mogen geen onhandige numerieke invoervelden gebruiken');
assert(detailTemplates.ev.format.includes('.plan-grid{display:grid;grid-template-columns:minmax(124px'), 'Laadplanning moet op tabletbreedte vijf compacte kolommen gebruiken');
assert(detailTemplates.ev.format.includes('plan-clock-cells') && detailTemplates.ev.format.includes('planTimeline.cells'), 'Laadplanning mist de visuele kwartierklok');
assert(detailTemplates.ev.format.includes('GEPLAND VERMOGEN') && detailTemplates.ev.format.includes('GEPLANDE ENERGIE') && detailTemplates.ev.format.includes('VERWACHTE LAADKOSTEN'), 'Laadplanning mist vermogen, energie of totale verwachte kosten');
assert(detailTemplates.loads.format.includes('toggleLoad'), 'Verbruikerspagina mist veilige schakelbediening');
assert(!detailTemplates.loads.format.includes('Airco appartement'), 'Een niet bevestigde airco voor het appartement mag niet worden gekoppeld');
assert(detailTemplates.lighting.format.includes('type="range"') && detailTemplates.lighting.format.includes('setLightBrightness'), 'Verlichtingspagina mist dimbediening per ruimte');
assert(detailTemplates.lighting.format.includes('toggleLight') && detailTemplates.lighting.format.includes('lightIsPending'), 'Verlichtingspagina mist veilige aan-uitbediening met bevestiging');
assert(detailTemplates.lighting.format.includes('Wachten op verlichting') && detailTemplates.lighting.format.includes('animation:climate-wait'), 'Verlichtingsknoppen moeten wachten op de echte Home Assistant-status');
for (const label of ["airco's", 'verwarming', 'warmtepomp', 'drie configureerbare zones']) {
    assert(detailTemplates.climate.format.toLowerCase().includes(label), `Klimaatpagina mist ${label}`);
}
assert(detailTemplates.climate.format.includes('changeClimateTemperature'), 'Klimaatpagina mist temperatuurbediening');
assert(detailTemplates.climate.format.includes('toggleClimate'), 'Klimaatpagina mist aan-uitbediening');
assert(detailTemplates.climate.format.includes('climateIsPending') && detailTemplates.climate.format.includes('Wachten op apparaat'), 'Klimaatknoppen moeten tot de apparaatbevestiging een wachtstatus tonen');
assert.strictEqual((detailTemplates.climate.format.match(/pending:climateIsPending/g) || []).length, 3, 'Airco, Tado en EHS moeten dezelfde directe knopfeedback gebruiken');
assert(detailTemplates.climate.format.includes('resolveClimatePending') && detailTemplates.climate.format.includes('30000'), 'Klimaatfeedback moet verdwijnen na apparaatbevestiging en een veilige time-out hebben');
assert(detailTemplates.climate.format.includes('@keyframes climate-wait') && detailTemplates.climate.format.includes('animation:climate-wait'), 'Klimaatknoppen missen de draaiende wachtring');
assert(detailTemplates.system.format.includes('Actieve meldingen'), 'Systeempagina mist meldingen');
assert(detailTemplates.system.format.includes('Gezondheidscheck'), 'Systeempagina mist de compacte gezondheidscheck');
assert(detailTemplates.system.format.includes('Kernmetingen') && detailTemplates.system.format.includes('EV-laadregeling') && detailTemplates.system.format.includes('Klimaat'), 'Systeempagina mist essentiële diagnosegroepen');
for (const label of ['Synology NAS', 'OPSLAG', 'SCHIJF 2', 'SYSTEEM', 'BELASTING', 'NETWERK', 'VEILIGHEID']) {
    assert(detailTemplates.system.format.includes(label), `Systeempagina mist NAS-onderdeel ${label}`);
}
assert(detailTemplates.system.format.includes('d.nas&&d.nas.volume') && detailTemplates.system.format.includes('d.nas&&d.nas.drive'), 'Systeempagina mist live Synology-volume- of schijfdata');
assert(!detailTemplates.system.format.includes('button.nas_restart') && !detailTemplates.system.format.includes('button.nas_shutdown'), 'NAS-overzicht mag geen risicovolle herstart- of uitschakknop bevatten');
assert.strictEqual((detailTemplates.ev.format.match(/<button /g) || []).length, 4, 'Autopagina moet twee voertuigknoppen en twee laadknoppen tonen');
for (const template of Object.values(detailTemplates)) {
    assert.strictEqual(template.height, '13', 'Iedere detailpagina moet de beschikbare tablethoogte vullen');
    assert(!template.format.includes('Aanvullende systeemdiagnose') && !template.format.includes('Aanvullende verbruikssensoren') && !template.format.includes('Extra zonnesensoren'), 'Detailpagina bevat nog onnodige sensorinventarisatie');
}

const mapper = flows.find((node) => node.id === 'ess00000000000a');
assert(mapper, 'Home Assistant-sensormapping ontbreekt');
assert(mapper.func.includes("flow.get('ess_wit_audi_discharge_status')") && mapper.func.includes('audiDischargeBudgetKwh'), 'Dashboardmapping mist de live EV-accubufferstatus');
assert(mapper.func.includes("flow.get('ess_wit_grid_charge_status')") && mapper.func.includes('expectedSolarChargeKwh') && mapper.func.includes('selectedSlots'), 'Dashboardmapping mist de live WIT-netlaadplanning');

const homeAssistantServer = flows.find((node) => node.id === 'ess00000000000b');
assert(homeAssistantServer, 'Home Assistant Server Config ontbreekt');
assert.strictEqual(homeAssistantServer.type, 'server');
assert.strictEqual(homeAssistantServer.name, 'Home Assistant');
assert.strictEqual(homeAssistantServer.addon, true, 'Server Config moet de Home Assistant-add-on gebruiken');
assert.strictEqual(homeAssistantServer.version, 6, 'Server Config moet het actuele Home Assistant-schema gebruiken');
assert.deepStrictEqual(homeAssistantServer.ha_boolean, ['y', 'yes', 'true', 'on', 'home', 'open'], 'Home Assistant-booleans moeten het schema-6 arrayformaat gebruiken');
assert.strictEqual(homeAssistantServer.heartbeat, true, 'De Home Assistant-WebSocket moet met heartbeat automatisch herstellen');
assert.strictEqual(homeAssistantServer.enableGlobalContextStore, true, 'Globale Home Assistant-context moet aanstaan');
assert.strictEqual(homeAssistantServer.url, undefined, 'Add-onconfiguratie mag geen vaste Home Assistant-URL bevatten');
assert.strictEqual(homeAssistantServer.access_token, undefined, 'Een toegangstoken hoort niet in flows.json');

const state = (value, attributes = {}) => ({ state: String(value), attributes, last_updated: new Date().toISOString() });
const states = {
    'sensor.growatt_grid_grid_power': state(-100),
    'sensor.p1_meter_vermogen': state(100),
    'sensor.growatt_grid_grid_import_energy_today': state(4.2, { unit_of_measurement: 'kWh' }),
    'sensor.growatt_grid_energy_to_grid_today': state(6.7, { unit_of_measurement: 'kWh' }),
    'sensor.p1_meter_energie_import': state(15048.66, { unit_of_measurement: 'kWh', state_class: 'total_increasing' }),
    'sensor.p1_meter_energie_export': state(18001.622, { unit_of_measurement: 'kWh', state_class: 'total_increasing' }),
    'sensor.growatt_solar_solar_total_power': state(1000),
    'sensor.growatt_solar_system_output_power': state(1300),
    'sensor.pv_array_1_power': state(200),
    'sensor.pv_array_2_power': state(300),
    'sensor.pv_array_3_power': state(400),
    'sensor.growatt_load_house_consumption': state(500),
    'sensor.growatt_load_load_energy_today': state(18, { unit_of_measurement: 'kWh', state_class: 'total_increasing' }),
    'sensor.growatt_battery_battery_power': state(-600),
    'sensor.accu_vermogen': state(-1300),
    'sensor.growatt_battery_battery_soc': state(83),
    'select.growatt_grid_vpp_export_limit_enable': state('Disabled'),
    'number.growatt_grid_vpp_export_limit_power_rate': state(1),
    'sensor.ev_charger_power': state(1.2, { unit_of_measurement: 'kW', device_class: 'power' }),
    'sensor.ev_charger_2_power': state(2.3, { unit_of_measurement: 'kW', device_class: 'power' }),
    'sensor.ev_charger_energy_today': state(0, { unit_of_measurement: 'EUR', cost_day_totalEnergyUsage:8.4 }),
    'sensor.ev_charger_2_energy_today': state(3.2, { unit_of_measurement: 'kWh' }),
    'sensor.ev_charger_status': state('charging', { id: 'TEST-CHARGER', state_outputPhase: 30 }),
    'sensor.ev_charger_current': state(16, {
        state_circuitTotalAllocatedPhaseConductorCurrentL1: 0,
        state_circuitTotalAllocatedPhaseConductorCurrentL2: 0,
        state_circuitTotalAllocatedPhaseConductorCurrentL3: 16
    }),
    'binary_sensor.ev_charger_online': state('on'),
    'switch.ev_smart_charging_smart_charging_activated': state('off'),
    'sensor.ev_state_of_charge': state(61),
    'device_tracker.ev_position': state('home', { vehicle_id: 'test-vehicle' }),
    'sensor.ev_target_state_of_charge': state(80),
    'lock.ev': state('locked', { friendly_name: 'EV-vergrendeling' }),
    'sensor.ev_temperature': state(19.5, { friendly_name: 'EV-temperatuur', unit_of_measurement: '°C' }),
    'sensor.nord_pool_nl_huidige_prijs': state(0.2),
    'sensor.energy_production_today': state(10, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production today' }),
    'sensor.energy_production_today_2': state(12, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production today' }),
    'sensor.energy_production_today_3': state(8, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production today' }),
    'sensor.ess_zonproductie_werkelijk_vandaag': state(63.5, { unit_of_measurement: 'kWh', friendly_name: 'ESS zonproductie werkelijk vandaag' }),
    'sensor.energy_production_today_remaining': state(0, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production remaining today' }),
    'sensor.energy_production_today_remaining_2': state(0, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production remaining today' }),
    'sensor.energy_production_today_remaining_3': state(0, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production remaining today' }),
    'sensor.energy_production_tomorrow': state(14, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production tomorrow' }),
    'sensor.energy_production_tomorrow_2': state(12, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production tomorrow' }),
    'sensor.energy_production_tomorrow_3': state(10, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production tomorrow' }),
    'sun.sun': state('above_horizon', { next_setting: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() }),
    'input_datetime.vertrektijd_ev': state('06:00:00'),
    'sensor.ev_charger_2_status': state('disconnected'),
    'sensor.flex_load_4_power': state(100),
    'sensor.flex_load_2_power': state(180),
    'sensor.flex_load_3_power': state(640),
    'sensor.flex_load_5_power': state(50),
    'sensor.flex_load_6_power': state(25),
    'sensor.cooling_zone_1_temperature': state(21, { unit_of_measurement: '°C' }),
    'sensor.cooling_zone_2_temperature': state(25, { unit_of_measurement: '°C' }),
    'sensor.cooling_zone_3_temperature': state(24, { unit_of_measurement: '°C' }),
    'sensor.cooling_zone_4_temperature': state(21.8, { unit_of_measurement: '°C' }),
    'climate.cooling_zone_1': state('cool', { current_temperature: 21, temperature: 22, min_temp: 16, max_temp: 30 }),
    'climate.cooling_zone_2': state('off', { current_temperature: 25, temperature: 24, min_temp: 7, max_temp: 35 }),
    'climate.cooling_zone_3': state('cool', { current_temperature: 24, temperature: 22, min_temp: 7, max_temp: 35 }),
    'climate.cooling_zone_4': state('off', { current_temperature: 21.8, temperature: 19, min_temp: 7, max_temp: 35 }),
    'climate.heating_zone_1': state('auto', { friendly_name: 'Verwarmingszone 1', current_temperature: 21.5, temperature: 20, current_humidity: 46, min_temp: 5, max_temp: 25 }),
    'climate.heating_zone_2': state('auto', { friendly_name: 'Verwarmingszone 2', current_temperature: 22.1, temperature: 21, current_humidity: 58, min_temp: 5, max_temp: 25 }),
    'climate.heating_zone_3': state('off', { friendly_name: 'Verwarmingszone 3', current_temperature: 20.4, temperature: 18, current_humidity: 51, min_temp: 5, max_temp: 25 }),
    'climate.heat_pump': state('heat', { current_temperature: 36.7, temperature: 45, min_temp: 30, max_temp: 45 }),
    'water_heater.domestic_hot_water': state('eco', { current_temperature: 45.6, temperature: 60, min_temp: 40, max_temp: 60 }),
    'sensor.outdoor_temperature': state('unavailable', { unit_of_measurement: '°C' }),
    'weather.home': state('partlycloudy', { temperature: 20.6, humidity: 50 }),
    'sensor.flex_load_1_power': state(850, { unit_of_measurement: 'W' }),
    'switch.flex_load_1': state('on'),
    'binary_sensor.nas_beveiligingsstatus': state('off', { malware: 'safe', network: 'safe', systemCheck: 'safe', update: 'safe' }),
    'binary_sensor.nas_drive_2_maximum_slechte_sectoren_overschreden': state('off'),
    'binary_sensor.nas_drive_2_onder_de_minimale_resterende_levensduur': state('off'),
    'select.nas_fan_speed_mode': state('quiet'),
    'sensor.nas_cpu_gebruik_totaal': state(9, { unit_of_measurement: '%' }),
    'sensor.nas_geheugengebruik_fysiek': state(55, { unit_of_measurement: '%' }),
    'sensor.nas_temperatuur': state(34, { unit_of_measurement: '°C' }),
    'sensor.nas_download_doorvoer': state(4.455, { unit_of_measurement: 'kB/s' }),
    'sensor.nas_upload_doorvoer': state(4.731, { unit_of_measurement: 'kB/s' }),
    'sensor.nas_drive_2_status': state('normal'),
    'sensor.nas_drive_2_temperatuur': state(26, { unit_of_measurement: '°C' }),
    'sensor.nas_volume_1_status': state('normal'),
    'sensor.nas_volume_1_gebruikte_ruimte': state(0.21323464704, { unit_of_measurement: 'TB' }),
    'sensor.nas_volume_1_volume_gebruikt': state(11.2, { unit_of_measurement: '%' }),
    'update.nas_dsm_update': state('off', { installed_version: 'DSM 7.3.2-86009 Update 4', latest_version: 'DSM 7.3.2-86009 Update 4' }),
    'light.zone_1': state('on', { brightness: 204, is_hue_group: true }),
    'light.zone_2': state('on', { brightness: 128, is_hue_group: true }),
    'light.zone_3': state('off', { brightness: null, is_hue_group: true }),
    'light.zone_4': state('off', { brightness: null, is_hue_group: true }),
    'light.zone_5': state('off', { brightness: null, is_hue_group: true }),
    'light.zone_6': state('on', { brightness: 255, is_hue_group: true }),
    'light.zone_7': state('off', { brightness: null, is_hue_group: true }),
    'light.zone_8': state('off', { brightness: null, is_hue_group: true }),
    'sensor.flex_load_7_power': state(0),
    'sensor.p1_meter_vermogen_fase_1': state(230),
    'sensor.p1_meter_vermogen_fase_2': state(-460),
    'sensor.p1_meter_vermogen_fase_3': state(0),
    'sensor.growatt_solar_energy_today': state(10),
    'sensor.pv_array_1_energy_today': state(1),
    'sensor.pv_array_2_energy_today': state(2),
    'sensor.pv_array_3_energy_today': state(3),
    'sensor.site_solar_energy_today': state(16, { unit_of_measurement: 'kWh' }),
    'binary_sensor.growatt_inverter_online': state('on'),
    'sensor.growatt_warning_code': state(0)
};

const discoveryStates = {
    'sensor.p1_meter_vermogen': state(120),
    'sensor.p1_meter_energie_import': state(1000),
    'sensor.p1_meter_energie_export': state(500),
    'sensor.growatt_battery_battery_soc': state(50),
    'sensor.growatt_battery_battery_power': state(-500),
    'sensor.growatt_solar_system_output_power': state(1500),
    'select.growatt_mode_vpp': state('Hold', { options:['Hold','Charge','Discharge'] }),
    'select.growatt_work_mode': state('unknown'),
    'number.growatt_vpp_power_rate': state(100),
    'number.growatt_battery_remote_charge_and_discharge_power': state(0),
    'number.growatt_grid_remote_power_control_charging_time': state(2),
    'select.growatt_grid_remote_power_control_enable': state('Disabled'),
    'sensor.primary_charger_status': state('charging', { friendly_name:'Primary status', id:'TEST', state_outputPhase:30, config_phaseMode:3 }),
    'sensor.primary_charger_power': state(7.4, { friendly_name:'Primary vermogen', unit_of_measurement:'kW', device_class:'power' }),
    'sensor.primary_charger_current': state(16, { friendly_name:'Primary laadstroom', unit_of_measurement:'A' }),
    'sensor.primary_charger_energy_today': state(12, { friendly_name:'Primary energie vandaag', unit_of_measurement:'kWh' }),
    'binary_sensor.primary_charger_online': state('on', { friendly_name:'Primary online' }),
    'sensor.test_vehicle_state_of_charge': state(64, { friendly_name:'Vehicle state of charge', unit_of_measurement:'%', device_class:'battery' }),
    'sensor.test_vehicle_target_state_of_charge': state(80, { friendly_name:'Vehicle target state of charge', unit_of_measurement:'%' }),
    'sensor.test_vehicle_temperature': state(18, { friendly_name:'Vehicle temperature', device_class:'temperature' }),
    'lock.test_vehicle': state('locked', { friendly_name:'Vehicle lock' }),
    'device_tracker.test_vehicle': state('home', { friendly_name:'Vehicle position' }),
    'light.living_area': state('on', { friendly_name:'Living room group', is_hue_group:true }),
    'light.kitchen_area': state('off', { friendly_name:'Kitchen room group', is_hue_group:true }),
    'climate.office_cooling': state('cool', { friendly_name:'Office cooling', hvac_modes:['off','cool'] }),
    'climate.main_heating': state('heat', { friendly_name:'Tado heating zone', hvac_modes:['off','heat','auto'] }),
    'climate.system_heat_pump': state('heat', { friendly_name:'Heat pump', hvac_modes:['off','heat'] }),
    'water_heater.hot_water': state('eco', { friendly_name:'Domestic hot water' }),
    'weather.local_station': state('sunny', { friendly_name:'Local weather' }),
    'sensor.local_outdoor_temperature': state(19, { friendly_name:'Outdoor temperature', device_class:'temperature' }),
    'sensor.workshop_compressor_power': state(900, { friendly_name:'Compressor power', unit_of_measurement:'W', device_class:'power' }),
    'switch.workshop_compressor': state('on', { friendly_name:'Compressor' }),
    'sensor.roof_pv_output_power': state(2200, { friendly_name:'PV roof output power', unit_of_measurement:'W', device_class:'power' }),
    'sensor.growatt_solar_ac_power': state(1800, { friendly_name:'Growatt Solar AC Power', unit_of_measurement:'W', device_class:'power' }),
    'sensor.growatt_solar_ac_power_phase_r': state(600, { friendly_name:'Growatt Solar AC Power Phase R', unit_of_measurement:'W', device_class:'power' }),
    'sensor.synology_cpu_total': state(9, { friendly_name:'Synology NAS CPU total', unit_of_measurement:'%' }),
    'sensor.synology_memory_usage': state(55, { friendly_name:'Synology NAS physical memory usage', unit_of_measurement:'%' }),
    'sensor.synology_system_temperature': state(35, { friendly_name:'Synology NAS system temperature', unit_of_measurement:'°C' }),
    'sensor.synology_download_throughput': state(4, { friendly_name:'Synology NAS download throughput', unit_of_measurement:'kB/s' }),
    'sensor.synology_upload_throughput': state(3, { friendly_name:'Synology NAS upload throughput', unit_of_measurement:'kB/s' })
};
const discoveredValues = {};
const discoveryGlobal = { get:() => ({ homeAssistant:{ states:discoveryStates } }) };
const discoveryFlow = {
    get:(key) => discoveredValues[key],
    set:(key, value) => { discoveredValues[key] = value; }
};
const discoveryPayload = {
    modules:{ energy:true, battery:true, inverter:true, ev:true, loads:true, lighting:true, climate:true, nas:true },
    entities:{
        'sensor.pv_array_1_power':'sensor.growatt_solar_ac_power',
        'sensor.pv_array_2_power':'sensor.growatt_solar_ac_power_phase_r'
    }
};
const discoveryResult = new Function('global', 'flow', 'node', 'msg', configControl.func)(
    discoveryGlobal,
    discoveryFlow,
    { warn:() => undefined, status:() => undefined },
    { topic:'ess/config/discover', payload:discoveryPayload }
);
const discovered = discoveredValues.ess_system_config;
const discoveryStatus = discoveredValues.ess_system_config_status;
assert(discovered && discoveryStatus && discoveryStatus.discovery, 'Automatische koppeling moet een controleerbaar voorstel opleveren');
assert.strictEqual(discoveryResult[1], null, 'Automatische koppeling mag het voorstel niet meteen op schijf opslaan');
assert.strictEqual(discovered.entities['sensor.ev_charger_status'], 'sensor.primary_charger_status');
assert.strictEqual(discovered.entities['sensor.ev_charger_power'], 'sensor.primary_charger_power');
assert.strictEqual(discovered.entities['sensor.ev_state_of_charge'], 'sensor.test_vehicle_state_of_charge');
assert.strictEqual(discovered.entities['lock.ev'], 'lock.test_vehicle');
assert.strictEqual(discovered.entities['light.zone_1'], 'light.kitchen_area');
assert.strictEqual(discovered.entities['climate.cooling_zone_1'], 'climate.office_cooling');
assert.strictEqual(discovered.entities['climate.heating_zone_1'], 'climate.main_heating');
assert.strictEqual(discovered.entities['climate.heat_pump'], 'climate.system_heat_pump');
assert.strictEqual(discovered.entities['sensor.flex_load_1_power'], 'sensor.workshop_compressor_power');
assert.strictEqual(discovered.entities['switch.flex_load_1'], 'switch.workshop_compressor');
assert.strictEqual(discovered.entities['sensor.pv_array_1_power'], 'sensor.roof_pv_output_power');
assert(!Object.values(discovered.entities).includes('sensor.growatt_solar_ac_power_phase_r'), 'Een WIT-fasewaarde mag niet als losse PV-omvormer worden gekoppeld');
assert.strictEqual(discovered.entities['sensor.nas_cpu_gebruik_totaal'], 'sensor.synology_cpu_total');
assert(discoveryStatus.discovery.matched >= 15, 'Automatische koppeling heeft te weinig overtuigende matches gevonden');
assert(discoveryStatus.valid, 'Een bestaande schrijfentiteit met tijdelijk onbekende status moet wel als gekoppeld gelden');
assert(!discoveryStatus.unavailable.includes('select.growatt_work_mode'), 'De oude Growatt-werkmodus mag de configuratie niet meer blokkeren');
const bufferStoredConfig = { ...discovered, siteName:'Buffer hersteltest' };
new Function('global', 'flow', 'node', 'msg', configControl.func)(
    discoveryGlobal,
    discoveryFlow,
    { status:() => undefined, warn:() => undefined },
    { payload:Buffer.from(JSON.stringify(bufferStoredConfig), 'utf8') }
);
assert.strictEqual(discoveredValues.ess_system_config.siteName, 'Buffer hersteltest', 'Lokale configuratie moet ook zonder behouden onderwerp of bestandsnaam uit een Buffer worden hersteld');
assert.strictEqual(discoveredValues.ess_system_config.entities['sensor.ev_charger_power'], 'sensor.primary_charger_power', 'Bufferherstel mag opgeslagen entiteitskoppelingen niet wissen');

let dashboard = null;
const mapperTodaySlotStart = new Date();
mapperTodaySlotStart.setHours(10, 0, 0, 0);
const mapperTomorrowSlotStart = new Date(mapperTodaySlotStart);
mapperTomorrowSlotStart.setDate(mapperTomorrowSlotStart.getDate() + 1);
const mapperSlotEnd = (start) => new Date(start.getTime() + 15 * 60 * 1000).toISOString();
const flowValues = {
    ess_wit_export_mode:'auto',
    ess_house_consumption_learning:{ forecastKwh:21 },
    ess_audi_control_status:{ selectedSlots:[
        { start:mapperTodaySlotStart.toISOString(), end:mapperSlotEnd(mapperTodaySlotStart), energy:9 },
        { start:mapperTomorrowSlotStart.toISOString(), end:mapperSlotEnd(mapperTomorrowSlotStart), energy:4 }
    ] },
    ess_wit_grid_charge_status:{ selectedSlots:[
        { start:mapperTodaySlotStart.toISOString(), end:mapperSlotEnd(mapperTodaySlotStart), energyKwh:8 },
        { start:mapperTomorrowSlotStart.toISOString(), end:mapperSlotEnd(mapperTomorrowSlotStart), energyKwh:3 }
    ] }
};
const globalContext = { get: () => ({ homeAssistant: { states } }) };
const flowContext = {
    get: (key) => flowValues[key],
    set: (key, value) => {
        flowValues[key] = value;
        if (key === 'ess_dashboard_live') dashboard = value;
    }
};

const runMapper = new Function('global', 'flow', 'node', 'msg', mapper.func);
runMapper(
    globalContext,
    flowContext,
    { status: () => undefined },
    {}
);

assert(dashboard, 'Sensormapping heeft geen dashboardmodel gemaakt');
assert.strictEqual(dashboard.grid.power, 100, 'Netimport moet positief zijn');
assert.strictEqual(dashboard.solar.power, 900, 'Zon moet uitsluitend de drie losse PV-omvormers optellen');
states['sun.sun'] = state('below_horizon');
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(dashboard.solar.power, 0, 'Losse PV moet na zonsondergang nul zijn als cloudomvormers hun dagwaarde vasthouden');
states['sun.sun'] = state('above_horizon', { next_setting: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() });
states['sensor.pv_array_2_power'].last_updated = new Date(Date.now() - 16 * 60 * 1000).toISOString();
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(dashboard.solar.power, 600, 'Verouderde losse-PV-waarden mogen overdag niet meetellen');
states['sensor.pv_array_2_power'] = state(300);
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(dashboard.solar.power, 900, 'Verse losse-PV-waarden moeten overdag weer meetellen');
assert.strictEqual(dashboard.wit.power, -1300, 'WIT Power moet signed van Growatt System Output komen');
assert.strictEqual(dashboard.wit.backupLoadPower, -1300, 'De HomeWizard-meter moet uitsluitend als back-up-load worden bewaard');
assert.strictEqual(dashboard.wit.exportLimitEnabled, false, 'Dashboard moet de actuele WIT-exportbegrenzing tonen');
assert.strictEqual(dashboard.wit.exportLimitRate, 1, 'Dashboard moet de ingestelde WIT-exportgrens tonen');
assert.strictEqual(dashboard.wit.exportLimitMode, 'auto', 'Dashboard moet de gekozen WIT-exportstand tonen');
assert.strictEqual(dashboard.house.power, 2300, 'Woningbalans moet de WIT-systeemuitgang, losse PV en P1-netimport gebruiken');
assert.strictEqual(dashboard.battery.power, -600, 'Dashboard moet de officiële Growatt Battery Power gebruiken');
assert.strictEqual(dashboard.battery.state, 'Ontladen');
assert.strictEqual(dashboard.ev[0].power, 1200, 'EV kW-naar-W-conversie klopt niet');
assert.strictEqual(dashboard.ev[0].soc, 61, 'EV-SOC moet in het laadpuntenmodel beschikbaar zijn');
assert.strictEqual(dashboard.ev[0].locked, 'Op slot', 'EV-vergrendeling moet begrijpelijk worden weergegeven');
assert.strictEqual(dashboard.ev[0].temperature, '19.5 °C', 'EV-temperatuur moet met eenheid beschikbaar zijn');
assert.strictEqual(dashboard.ev[0].today, 8.4, 'EV-dagenergie moet uit de Easee-dagsensor komen');
assert.strictEqual(dashboard.ev[1].power, 2300, 'EV 2 kW-naar-W-conversie klopt niet');
assert.strictEqual(dashboard.ev[1].today, 3.2, 'EV 2-dagenergie moet uit de Easee-dagsensor komen');
states['sensor.ev_charger_2_power'] = state(2300, { unit_of_measurement: 'W', device_class: 'power' });
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(dashboard.ev[1].power, 2300, 'Een EV 2-vermogenssensor in watt mag niet nogmaals worden vermenigvuldigd');
states['sensor.ev_charger_2_power'] = state(2.3, { unit_of_measurement: 'kW', device_class: 'power' });
assert.strictEqual(dashboard.grid.l1, 1);
assert.strictEqual(dashboard.grid.l2, -2, 'Negatieve P1-fase betekent teruglevering en moet negatief blijven');
assert.strictEqual(dashboard.grid.importToday, 4.2, 'Growatt-dagteller moet alleen als tijdelijke terugval beschikbaar blijven');
assert.strictEqual(dashboard.grid.exportToday, 6.7, 'Growatt-teruglevering moet alleen als tijdelijke terugval beschikbaar blijven');
assert.strictEqual(dashboard.grid.daySource, 'Growatt terugval', 'Dashboard moet duidelijk maken wanneer de P1-dagstart nog niet is opgehaald');
assert.strictEqual(dashboard.solar.today, 6);
assert.strictEqual(dashboard.solar.actualToday, 16, 'Werkelijke dagopbrengst moet de bevestigde totale productiemeter gebruiken');
assert.strictEqual(dashboard.solar.forecastToday, 30, 'Forecast.Solar moet uitsluitend de drie echte dagverwachtingen optellen en nooit de werkelijke historiesensor');
assert.strictEqual(dashboard.solar.forecastTomorrow, 36, 'Zon verwacht morgen moet de drie echte Forecast.Solar-installaties optellen');
assert.strictEqual(dashboard.house.forecastBaseTomorrow, 21, 'De geleerde woningbasis moet in de morgenverwachting staan');
assert.strictEqual(dashboard.house.audiPlannedTomorrow, 4, 'Alleen EV-laadkwartieren van morgen mogen meetellen');
assert.strictEqual(dashboard.house.witPlannedTomorrow, 3, 'Alleen WIT-laadkwartieren van morgen mogen meetellen');
assert.strictEqual(dashboard.house.forecastTomorrow, 28, 'Verbruik verwacht morgen moet woning, EV en WIT optellen');
assert.strictEqual(dashboard.wit.today, 10);
assert.strictEqual(dashboard.audiSmart.enabled, false, 'EV-regeling moet na een veilige start uitstaan');
assert.strictEqual(dashboard.audiSmart.solarSoc, 100, 'Dashboard moet standaard 100% als maximale zonne-SOC tonen');
assert.deepStrictEqual(dashboard.loads.map((item) => item.name), ['Flexibele last 2', 'Flexibele last 3', 'Flexibele last 4', 'Flexibele last 5', 'Flexibele last 6', 'Flexibele last 1', 'Flexibele last 7'], 'Alle configureerbare vermogensmeters moeten afzonderlijk worden getoond');
assert.strictEqual(dashboard.loads.find((item) => item.name === 'Flexibele last 2').power, 180, 'De tweede flexibele vermogensmeter moet worden gebruikt');
assert.strictEqual(dashboard.loads.find((item) => item.name === 'Flexibele last 3').power, 640, 'De derde flexibele vermogensmeter moet worden gebruikt');
assert.strictEqual(dashboard.loads.find((item) => item.name === 'Flexibele last 1').power, 850, 'De schakelbare flexibele last moet zijn vermogensmeter gebruiken');
assert.strictEqual(dashboard.loads.find((item) => item.name === 'Flexibele last 1').controlKey, 'compressor', 'De schakelbare last moet een vaste veilige schakelroute hebben');
assert(!dashboard.loads.some((item) => ['Airco Zone 2', 'Airco Zone 3'].includes(item.name)), 'Airco’s zonder vermogensmeter horen niet op de verbruikerspagina');
assert.deepStrictEqual(dashboard.lighting.rooms.map((item) => item.name), ['Lichtzone 1', 'Keuken', 'Bijkeuken', 'Kantoor', 'Lichtzone 5', 'Slaapkamer Zone 2', 'Lichtzone 7', 'Voorzolder'], 'Verlichting moet uitsluitend de acht bevestigde kamerzones tonen');
assert.deepStrictEqual(dashboard.lighting.rooms.map((item) => item.entityId), ['light.zone_1', 'light.zone_2', 'light.zone_3', 'light.zone_4', 'light.zone_5', 'light.zone_6', 'light.zone_7', 'light.zone_8'], 'Verlichting mag geen losse apparaten of lampen koppelen');
assert.strictEqual(dashboard.lighting.onCount, 3, 'Aantal ingeschakelde kamerzones klopt niet');
assert.strictEqual(dashboard.lighting.rooms[0].brightness, 80, 'Hue-helderheid moet naar een percentage worden omgerekend');
assert.strictEqual(dashboard.climate.outside.temperature, 20.6, 'Buitentemperatuur moet terugvallen op de weerentiteit wanneer de EHS-buitenvoeler niet beschikbaar is');
assert.strictEqual(dashboard.climate.outside.humidity, 50, 'Beschikbare luchtvochtigheid buiten moet worden getoond');
assert.deepStrictEqual(dashboard.climate.aircos.map((item) => item.name), ['Koelzone 1', 'Koelzone 2', 'Koelzone 3', 'Koelzone 4'], 'Alle configureerbare koelzones moeten op de klimaatpagina staan');
assert.deepStrictEqual(dashboard.climate.tado.map((item) => item.name), ['Verwarmingszone 1', 'Verwarmingszone 2', 'Verwarmingszone 3'], 'Alle configureerbare verwarmingszones moeten op de klimaatpagina staan');
assert.strictEqual(dashboard.climate.tado[1].humidity, 58, 'Tado-luchtvochtigheid moet per ruimte beschikbaar zijn');
assert.strictEqual(dashboard.climate.heatPump.current, 36.7, 'De actuele EHS-verwarmingstemperatuur ontbreekt');
assert.strictEqual(dashboard.climate.heatPump.target, 45, 'De EHS-instelwaarde ontbreekt');
assert.strictEqual(dashboard.climate.hotWater.current, 45.6, 'De actuele tapwatertemperatuur ontbreekt');
assert.strictEqual(dashboard.climate.hotWater.target, 60, 'De tapwater-instelwaarde ontbreekt');
assert.strictEqual(dashboard.nas.name, 'NAS', 'Synology NAS-naam ontbreekt');
assert.strictEqual(dashboard.nas.model, 'DS223j', 'Synology model ontbreekt');
assert.strictEqual(dashboard.nas.available, true, 'Beschikbare Synology NAS wordt niet herkend');
assert.strictEqual(dashboard.nas.ok, true, 'Gezonde Synology NAS moet als in orde worden gemeld');
assert.strictEqual(dashboard.nas.volume.usedPercent, 11.2, 'Volumegebruik van NAS ontbreekt');
assert.strictEqual(dashboard.nas.drive.temperature, 26, 'Temperatuur van Drive 2 ontbreekt');
assert.strictEqual(dashboard.nas.securityLabel, 'Veilig', 'Veilige Synology-status wordt niet goed vertaald');
assert.strictEqual(dashboard.nas.updateLabel, 'DSM up-to-date', 'DSM-updatestatus ontbreekt');
assert(!dashboard.alarms.some((alarm) => String(alarm.text).includes('Synology')), 'Gezonde NAS mag geen systeemmelding veroorzaken');
states['sensor.nas_volume_1_volume_gebruikt'] = state(91, { unit_of_measurement: '%' });
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});
assert(dashboard.alarms.some((alarm) => String(alarm.text).includes('Volume 1') && String(alarm.text).includes('91%')), 'Bijna volle Synology-opslag moet een systeemmelding geven');
states['sensor.nas_volume_1_volume_gebruikt'] = state(11.2, { unit_of_measurement: '%' });
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});
assert(mapper.func.includes("const batteryPowerReading = value('sensor.growatt_battery_battery_power')"), 'Accu moet de officiële Growatt Battery Power-entiteit gebruiken');
assert(mapper.func.includes('const batteryPowerScaleVersion = 2;'), 'Bekende Growatt WIT ×10-schaalfout moet veilig en blijvend worden herkend');
assert(!mapper.func.includes("const batteryPower = value('sensor.accu_vermogen')"), 'Accu mag niet meer de WIT-uitgangshulpsensor gebruiken');
assert(mapper.func.includes("const backupLoadPower = value('sensor.accu_vermogen')"), 'HomeWizard Batterij moet als back-up-loadmeter worden gebruikt');
assert(mapper.func.includes('const witPower = systemOutputPower === null ? null : -systemOutputPower'), 'WIT Power moet van Growatt System Output komen');
assert(!mapper.func.includes('Netmeting Growatt wijkt'), 'Growatt en HomeWizard P1 mogen niet worden vergeleken omdat Easee Links buiten de Growatt-meting valt');

const p1Now = new Date();
const p1DayKey = [p1Now.getFullYear(), String(p1Now.getMonth() + 1).padStart(2, '0'), String(p1Now.getDate()).padStart(2, '0')].join('-');
flowValues.ess_p1_daily_baseline = { dayKey: p1DayKey, importStart: 15038, exportStart: 18000 };
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(dashboard.grid.importToday, 10.66, 'P1-dagafname moet ook verbruik van de lader buiten de Growatt-meter meenemen');
assert.strictEqual(dashboard.grid.exportToday, 1.622, 'P1-dagteruglevering moet vanaf de echte hoofdmeterstand worden berekend');
assert.strictEqual(dashboard.grid.daySource, 'P1 hoofdmeter', 'P1 moet zichtbaar als bron van de netdagtotalen worden gemeld');

const p1HistoryInject = flows.find((node) => node.id === 'essp1hist_inject');
const p1HistoryPrepare = flows.find((node) => node.id === 'essp1hist_prepare');
const p1History = flows.find((node) => node.id === 'essp1hist_get001');
const p1HistoryStore = flows.find((node) => node.id === 'essp1hist_store1');
const p1HistoryCatch = flows.find((node) => node.id === 'essp1hist_catch1');
assert(p1HistoryInject && p1HistoryPrepare && p1History && p1HistoryStore && p1HistoryCatch, 'Automatische P1-dagstart ontbreekt');
assert.strictEqual(p1History.type, 'api-get-history', 'P1-dagstart moet via de bestaande Home Assistant-historieverbinding worden opgehaald');
assert.strictEqual(p1History.server, homeAssistantServer.id, 'P1-historie mag geen eigen URL of token gebruiken');
assert.strictEqual(p1HistoryInject.repeat, '60', 'Een ontbrekende P1-dagstart moet iedere minuut opnieuw worden gecontroleerd');
assert(p1HistoryInject.onceDelay >= 20, 'P1-historie mag niet starten voordat Home Assistant tijd heeft gehad om te verbinden');
assert(p1HistoryPrepare.func.includes("config.entities['sensor.p1_meter_energie_import']") && p1HistoryPrepare.func.includes("config.entities['sensor.p1_meter_energie_export']"), 'Configureerbare P1-import en -export moeten samen vanaf middernacht worden opgehaald');
assert.deepStrictEqual(p1HistoryInject.wires, [[p1HistoryPrepare.id]]);
assert.deepStrictEqual(p1HistoryPrepare.wires, [[p1History.id]]);
assert.deepStrictEqual(p1History.wires, [[p1HistoryStore.id]]);
assert.deepStrictEqual(p1HistoryCatch.scope, [p1History.id], 'Alleen fouten van het P1-historieverzoek mogen worden opgevangen');
assert.deepStrictEqual(p1HistoryCatch.wires, [], 'Een verbindingsfout mag geen stapelende herhaalroute starten');
const storedP1Baseline = flowValues.ess_p1_daily_baseline;
delete flowValues.ess_p1_daily_baseline;
const preparedP1History = new Function('global', 'flow', 'node', 'msg', p1HistoryPrepare.func)(globalContext, flowContext, { warn: () => undefined }, {});
assert.strictEqual(preparedP1History.payload.entityId, 'sensor.p1_meter_energie_import,sensor.p1_meter_energie_export');
assert(new Date(preparedP1History.payload.endDate) - new Date(preparedP1History.payload.startDate) <= 5 * 60 * 1000, 'P1-historieverzoek moet klein blijven');
flowValues.ess_p1_daily_baseline = storedP1Baseline;
const skippedP1History = new Function('global', 'flow', 'node', 'msg', p1HistoryPrepare.func)(globalContext, flowContext, { warn: () => undefined }, {});
assert.strictEqual(skippedP1History, null, 'Na een geldige dagstart mag geen overbodig historieverzoek meer worden gedaan');
new Function('global', 'flow', 'node', 'msg', p1HistoryStore.func)(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, {
    p1DayKey,
    payload: [[{ entity_id: 'sensor.p1_meter_energie_import', state: '15038' }],[{ entity_id: 'sensor.p1_meter_energie_export', state: '18000' }]]
});
assert.deepStrictEqual({ ...flowValues.ess_p1_daily_baseline, updatedAt: undefined }, { dayKey: p1DayKey, importStart: 15038, exportStart: 18000, updatedAt: undefined }, 'P1-dagstart moet veilig uit Home Assistant-historie worden opgeslagen');

states['sensor.growatt_battery_battery_power'] = state(-19973);
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(dashboard.battery.power, -1997.3, 'Growatt WIT-vermogen met de bekende ×10-schaalfout moet worden gecorrigeerd');
assert(dashboard.alarms.some((alarm) => alarm.text.includes('×10-schaalfout')), 'Correctie van het Growatt-accuvermogen moet zichtbaar worden gemeld');

states['sensor.growatt_battery_battery_power'] = state(-8000);
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(dashboard.battery.power, -800, 'Herkende Growatt-schaalcorrectie moet ook onder de 15kW-grens actief blijven');

states['sensor.growatt_battery_battery_power'] = state(-200000);
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(dashboard.battery.power, null, 'Extreme Growatt-waarden die ook na delen door tien onmogelijk zijn moeten verborgen blijven');

states['sensor.growatt_battery_battery_power'] = state(-2000);
states['sensor.growatt_solar_solar_total_power'] = state(0);
states['sensor.growatt_solar_system_output_power'] = state(2050);
states['sensor.accu_vermogen'] = state(-1800);
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(dashboard.battery.power, -2000, 'Dashboard moet de correctie automatisch uitschakelen zodra Growatt weer juiste waarden levert');

states['sensor.growatt_battery_battery_power'] = state(-600);
states['sensor.growatt_solar_solar_total_power'] = state(1000);
states['sensor.growatt_solar_system_output_power'] = state(1300);
states['sensor.accu_vermogen'] = state(-1300);
delete flowValues.ess_growatt_battery_power_scale;
dashboard = null;
runMapper(globalContext, flowContext, { status: () => undefined }, {});

const audiControl = flows.find((node) => node.id === 'ess00000000000c');
assert(audiControl, 'Veilige EV-hoofdschakelaar ontbreekt');
assert.strictEqual((audiControl.func.match(/msg\.topic === 'ess\/audi\/solar-soc'/g) || []).length, 1, 'De EV-regeling mag de zonne-SOC-instelling maar één keer verwerken');
assert.deepStrictEqual(detailTemplates.ev.wires, [[audiControl.id]], 'EV-bediening moet vanaf de autopagina naar de beveiligingsfunctie gaan');
assert.deepStrictEqual(ui.wires, [[audiControl.id]], 'EV-snelbediening op het overzicht moet naar de beveiligingsfunctie gaan');
const runEVControl = new Function('global', 'flow', 'node', 'msg', audiControl.func);
const rejected = runEVControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic: 'verboden', payload: true });
assert.strictEqual(rejected, null, 'Onbekende dashboardopdracht moet worden geweigerd');
runEVControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic: 'ess/audi/smart-enabled', payload: true });
assert.strictEqual(flowValues.ess_audi_smart_enabled, true, 'EV-hoofdschakelaar is niet opgeslagen');
runEVControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic: 'ess/audi/departure-soc', payload: 70 });
assert.strictEqual(flowValues.ess_audi_settings.departureSoc, 70, 'SOC-doel bij vertrek is niet opgeslagen');
runEVControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic: 'ess/audi/solar-soc', payload: 90 });
assert.strictEqual(flowValues.ess_audi_settings.solarSoc, 90, 'Afzonderlijke maximale zonne-SOC is niet opgeslagen');
assert.strictEqual(flowValues.ess_audi_settings.daySoc, undefined, 'Het overbodige dagdoel moet worden verwijderd');
assert.strictEqual(flowValues.ess_audi_settings.desiredSoc, undefined, 'Het oude enkele SOC-doel moet zijn gemigreerd');
assert.strictEqual(flowValues.ess_audi_settings.cheapPriceLimit, undefined, 'De vaste goedkope-prijsgrens moet zijn verwijderd');
const timeResult = runEVControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic: 'ess/audi/departure-time', payload: '07:15' });
assert.strictEqual(timeResult[1].payload.time, '07:15:00', 'Vertrektijd moet naar de Home Assistant-helper worden geschreven');
const climateResult = runEVControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic: 'ess/audi/climate-start', payload: true });
assert.strictEqual(climateResult.length, 4, 'EV-bediening moet aparte uitgangen voor instellingen, tijd, klimaat en voertuigactie hebben');
assert.strictEqual(climateResult[2].payload.tempC, 21, 'EV-klimaat moet op 21 graden starten');
assert.strictEqual(climateResult[2].payload.vin, undefined, 'De lokale EV Connect-versie accepteert geen VIN in de actie');
const lockResult = runEVControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic: 'ess/audi/vehicle-action', payload: 'lock' });
assert.strictEqual(lockResult[3].payload.action, 'lock', 'EV-vergrendelopdracht ontbreekt');
assert.strictEqual(lockResult[3].payload.vin, undefined, 'Vergrendelopdracht mag geen VIN naar EV Connect sturen');
runEVControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic: 'ess/audi/force-full', payload: true });
assert.strictEqual(flowValues.ess_audi_force_full, true, 'Direct laden tot 100% moet als tijdelijke modus worden opgeslagen');
assert.strictEqual(flowValues.ess_audi_smart_enabled, true, 'Direct laden moet de beveiligde EV-regelaar vrijgeven');
runEVControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic: 'ess/audi/force-full', payload: false });

const nordPoolRequest = flows.find((node) => node.id === 'ess000000000014');
const nordPoolHttp = flows.find((node) => node.id === 'ess000000000015');
const nordPoolParser = flows.find((node) => node.id === 'ess000000000016');
assert(nordPoolRequest && nordPoolHttp && nordPoolParser, 'Rechtstreekse Nord Pool-kwartierkoppeling ontbreekt');
const requestMessages = new Function('global', 'flow', 'node', 'msg', nordPoolRequest.func)(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(requestMessages[0].length, 2, 'Vandaag en morgen moeten afzonderlijk bij Nord Pool worden opgevraagd');
assert(requestMessages[0].every((item) => item.url.includes('deliveryArea=NL')), 'Nord Pool-verzoek moet de Nederlandse biedzone gebruiken');
const currentQuarterStart = Math.floor(Date.now() / 900000) * 900000;
new Function('global', 'flow', 'node', 'msg', nordPoolParser.func)(
    globalContext,
    flowContext,
    { status: () => undefined },
    {
        nordPoolDay: 'test',
        payload: {
            multiAreaEntries: [{
                deliveryStart: new Date(currentQuarterStart).toISOString(),
                deliveryEnd: new Date(currentQuarterStart + 900000).toISOString(),
                entryPerArea: { NL: 50 }
            }]
        }
    }
);
assert.strictEqual(flowValues.ess_nordpool_forecast[0].marketPrice, 0.05, 'Nord Pool-prijs moet van €/MWh naar €/kWh worden omgerekend');
assert(Math.abs(flowValues.ess_nordpool_forecast[0].allInPrice - 0.19135) < 0.00001, 'Geplande prijs moet btw, energiebelasting en Zonneplan-opslag bevatten');

const safeDeparture = new Date(Date.now() + 12 * 60 * 60 * 1000);
flowValues.ess_audi_settings.departureTime = String(safeDeparture.getHours()).padStart(2, '0') + ':' + String(safeDeparture.getMinutes()).padStart(2, '0');

const audiRegulator = flows.find((node) => node.id === 'ess00000000000d');
assert(audiRegulator, 'EV-zonnestroomregelaar ontbreekt');
assert(audiRegulator.func.includes('const minimumCurrent = 6;'), 'Minimale EV-laadstroom moet 6 A zijn');
assert(audiRegulator.func.includes('Direct laden vervalt bij ontkoppelen'), 'Direct naar 100% moet bij ontkoppelen automatisch vervallen');
assert(audiRegulator.initialize.includes("flow.set('ess_audi_smart_enabled', true)"), 'ESS slim laden moet na een Home Assistant/Node-RED-herstart automatisch aan staan');
const audiDefaults = flows.find((node) => node.id === 'essaudi_defaults1');
const audiHaEvents = flows.find((node) => node.id === 'essaudi_ha_events');
const audiDefaultsInject = flows.find((node) => node.id === 'essaudi_defaults_inj');
assert(audiDefaults && audiHaEvents && audiDefaultsInject, 'Automatisch herstel van de EV-laadplanning ontbreekt');
assert.strictEqual(audiHaEvents.eventType, 'home_assistant_client', 'Laadplanning moet op de Home Assistant-clientstatus reageren');
assert.deepStrictEqual(audiDefaults.wires, [['ess00000000000d'], ['ess000000000012']], 'Standaardplanning moet de regelaar en vertrektijdhelper bijwerken');
const settingsBeforeDefaultReset = { ...flowValues.ess_audi_settings };
const smartEnabledBeforeDefaultReset = flowValues.ess_audi_smart_enabled;
const forceFullBeforeDefaultReset = flowValues.ess_audi_force_full;
flowValues.ess_audi_settings = { departureSoc: 95, solarSoc: 100, departureTime: '23:15' };
flowValues.ess_audi_smart_enabled = false;
flowValues.ess_audi_force_full = true;
const runEVDefaults = new Function('flow', 'node', 'msg', audiDefaults.func);
const defaultOutputs = runEVDefaults(flowContext, { status: () => undefined }, { payload: 'running' });
assert.strictEqual(flowValues.ess_audi_settings.departureSoc, 80, 'Vertrek-SOC moet na een herstart standaard 80% zijn');
assert.strictEqual(flowValues.ess_audi_settings.solarSoc, 80, 'Maximale zonne-SOC moet na een herstart standaard 80% zijn');
assert.strictEqual(flowValues.ess_audi_settings.departureTime, '06:00', 'Vertrektijd moet na een herstart standaard 06:00 zijn');
assert.strictEqual(flowValues.ess_audi_smart_enabled, true, 'Slim laden moet bij herstel worden ingeschakeld');
assert.strictEqual(flowValues.ess_audi_force_full, false, 'Tijdelijk direct laden mag een herstart niet overleven');
assert(Number(flowValues.ess_audi_restart_grace_until) > Date.now(), 'Na een herstart moet de EV-regeling twee minuten respijt krijgen om de planning te herstellen');
assert.strictEqual(defaultOutputs[1].payload.time, '06:00:00', 'Home Assistant-vertrektijdhelper moet naar 06:00 worden gesynchroniseerd');
flowValues.ess_audi_settings = settingsBeforeDefaultReset;
flowValues.ess_audi_smart_enabled = smartEnabledBeforeDefaultReset;
flowValues.ess_audi_force_full = forceFullBeforeDefaultReset;
const runEVRegulator = new Function('global', 'flow', 'node', 'msg', audiRegulator.func);
flowValues.ess_nordpool_forecast = [];
states['sensor.p1_meter_vermogen'] = state(-6000);
states['sensor.accu_vermogen'] = state(-5000);
states['sensor.ev_charger_power'] = state(0);
states['sensor.ev_charger_status'] = state('awaiting_authorization', { id: 'TEST-CHARGER', state_outputPhase: 10, config_phaseMode: 1 });
let regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(Array.isArray(regulatorOutput) && regulatorOutput.length === 3, 'Regelaar moet limiet-, start/stop- en fase-uitgangen hebben');
assert.strictEqual(regulatorOutput[0], null, 'Zonneladen mag niet starten voordat het overschot twee minuten stabiel is');
assert(flowValues.ess_audi_control_status.status.includes('2 minuten stabiele zon'), 'Wachtstatus voor stabiele zon ontbreekt');
flowValues.ess_audi_control_status.solarReadySince = Date.now() - 121000;
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(regulatorOutput[0], 'Na twee minuten stabiel zonnestroomoverschot moet een dynamische laadlimiet volgen');
assert(regulatorOutput[0].payload.current >= 6 && regulatorOutput[0].payload.current <= 25, 'Laadstroom van Easee Links moet tussen 6 en 25 A blijven');
assert.strictEqual(regulatorOutput[0].payload.timeToLive, 2, 'Easee-watchdog moet twee minuten zijn');
assert.strictEqual(regulatorOutput[1].payload.command, 'start', 'Eerste geldige regelcyclus moet de EV starten');
assert.notStrictEqual(flowValues.ess_audi_control_status.status, 'Wacht op aangesloten EV', 'Easee awaiting_authorization moet als aangesloten EV worden herkend');
assert.strictEqual(flowValues.ess_audi_control_status.phaseMode, 1, 'Zonneladen moet op één fase starten');
assert(!flowValues.ess_audi_control_status.status.includes('thuisaccu'), 'Thuisaccu mag de EV-regeling niet blokkeren');
const initialEVLimitMessage = regulatorOutput[0];
assert.strictEqual(flowValues.ess_audi_control_status.active, false, 'Een startopdracht alleen mag nog niet als werkelijk actief gelden');
assert.strictEqual(flowValues.ess_audi_control_status.requestedActive, true, 'De gevraagde laadstatus moet apart worden bijgehouden');
assert(flowValues.ess_audi_control_status.status.includes('Start controleren'), 'De eerste 30 seconden moet de regeling de werkelijke start controleren');
assert.strictEqual(flowValues.ess_audi_control_status.startAttempts, 1, 'Ook de eerste geplande start moet in de effectiviteitsmeting worden geteld');

states['sensor.p1_meter_vermogen'] = state(0);
states['sensor.ev_charger_power'] = state(1.38);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(flowValues.ess_audi_control_status.targetCurrent >= 6, 'De regeling moet het EV-laadvermogen bij de P1-meting optellen zodat het oorspronkelijke zonneoverschot zichtbaar blijft');
states['sensor.p1_meter_vermogen'] = state(-6000);
states['sensor.ev_charger_power'] = state(0);

const startRetry = flows.find((node) => node.id === 'ess000000000019');
assert(startRetry, 'Controle op een werkelijk gestarte EV ontbreekt');
const runStartRetry = new Function('global', 'flow', 'node', 'msg', startRetry.func);
let retryOutput = runStartRetry(globalContext, flowContext, { status: () => undefined }, initialEVLimitMessage);
assert.strictEqual(retryOutput[0].payload.command, 'start', 'Easee moet opnieuw worden gestart zolang werkelijk laadvermogen uitblijft');
retryOutput = runStartRetry(globalContext, flowContext, { status: () => undefined }, initialEVLimitMessage);
assert.deepStrictEqual(retryOutput, [null, null, null], 'Startopdrachten moeten worden begrensd om Easee niet te belasten');
states['sensor.ev_charger_status'] = state('charging', { id: 'TEST-CHARGER', state_outputPhase: 10, config_phaseMode: 1 });
states['sensor.ev_charger_power'] = state(2.3);
retryOutput = runStartRetry(globalContext, flowContext, { status: () => undefined }, initialEVLimitMessage);
assert.deepStrictEqual(retryOutput, [null, null, null], 'Bij werkelijk laden mag geen nieuwe startopdracht volgen');
assert.strictEqual(flowValues.ess_audi_start_recovery.stage, 'idle', 'Werkelijk laden moet de herstelstatus wissen');
states['sensor.ev_charger_power'] = state(0);
states['sensor.ev_charger_current'] = state(15.6);
retryOutput = runStartRetry(globalContext, flowContext, { status: () => undefined }, initialEVLimitMessage);
assert.deepStrictEqual(retryOutput, [null, null, null], 'Een tijdelijk 0 W-signaal mag bij 15,6 A werkelijke laadstroom geen nieuwe startpoging veroorzaken');
states['sensor.ev_charger_status'] = state('awaiting_start', { id: 'TEST-CHARGER', state_outputPhase: 10, config_phaseMode: 1 });
states['sensor.ev_charger_power'] = state(0);

const recoveryDelay = flows.find((node) => node.id === 'essaudi_recovery_delay');
const recoveryNotification = flows.find((node) => node.id === 'essaudi_recovery_note');
assert(recoveryDelay && recoveryNotification, 'Volledige EV-herstart en Home Assistant-storingsmelding ontbreken');
assert.strictEqual(flows.find((node) => node.id === 'ess000000000018').timeout, '35', 'Werkelijk laadvermogen moet pas na een rustige startperiode worden gecontroleerd');
assert.strictEqual(recoveryDelay.timeout, '20', 'Een volledige EV-herstart moet twintig seconden tussen stop en start wachten');
assert.strictEqual(startRetry.outputs, 3, 'Startbewaking moet losse uitgangen voor herhaling, herstel en melding hebben');
assert.strictEqual(recoveryNotification.action, 'persistent_notification.create', 'Een definitief mislukte start moet in Home Assistant worden gemeld');

flowValues.ess_audi_start_recovery = { stage:'retrying', attempts:2, lastRetryAt:Date.now() - 46000, chargerId:'TEST-CHARGER' };
retryOutput = runStartRetry(globalContext, flowContext, { status: () => undefined }, initialEVLimitMessage);
assert.strictEqual(retryOutput[0].payload.command, 'start', 'De derde en laatste gewone startpoging moet worden uitgevoerd');
assert.strictEqual(flowValues.ess_audi_start_recovery.attempts, 3, 'Gewone startpogingen moeten exact worden geteld');
flowValues.ess_audi_start_recovery.lastRetryAt = Date.now() - 46000;
retryOutput = runStartRetry(globalContext, flowContext, { status: () => undefined }, initialEVLimitMessage);
assert.deepStrictEqual(retryOutput, [null, null, null], 'Na drie startpogingen moet eerst een afkoelperiode volgen');
assert.strictEqual(flowValues.ess_audi_start_recovery.stage, 'cooldown');
assert(Number(flowValues.ess_audi_start_recovery.cooldownUntil) >= Date.now() + 299000, 'De herstelrust moet vijf minuten duren');
flowValues.ess_audi_start_recovery.cooldownUntil = Date.now() - 1;
retryOutput = runStartRetry(globalContext, flowContext, { status: () => undefined }, initialEVLimitMessage);
assert.strictEqual(retryOutput[0].payload.command, 'stop', 'Volledig herstel moet eerst stoppen');
assert.strictEqual(retryOutput[1].payload.command, 'start', 'Volledig herstel moet via de vertraagde uitgang weer starten');
assert.strictEqual(flowValues.ess_audi_start_recovery.stage, 'recovering');
flowValues.ess_audi_start_recovery.recoverySentAt = Date.now() - 91000;
retryOutput = runStartRetry(globalContext, flowContext, { status: () => undefined }, initialEVLimitMessage);
assert.strictEqual(retryOutput[2].payload.title, 'EV laden niet gestart', 'Na het volledige herstel moet een duidelijke storingsmelding volgen');
assert.strictEqual(flowValues.ess_audi_start_recovery.stage, 'failed');
assert(Number(flowValues.ess_audi_start_recovery.cooldownUntil) >= Date.now() + 599000, 'Na een gemelde storing moet tien minuten worden gewacht');
flowValues.ess_audi_start_recovery = { stage:'idle', attempts:0, chargerId:'TEST-CHARGER' };

const unplannedGuard = flows.find((node) => node.id === 'ess000000000021');
assert(unplannedGuard, 'Bewaking tegen ongepland laden ontbreekt');
const runUnplannedGuard = new Function('global', 'flow', 'node', 'msg', unplannedGuard.func);
const controlBeforeGuardTest = flowValues.ess_audi_control_status;
flowValues.ess_audi_control_status = { ...controlBeforeGuardTest, targetCurrent: 0, chargerId: 'TEST-CHARGER' };
states['sensor.ev_charger_status'] = state('charging', { id: 'TEST-CHARGER', state_outputPhase: 10, config_phaseMode: 1 });
states['sensor.ev_charger_power'] = state(2.3);
flowValues.ess_audi_restart_grace_until = Date.now() + 120000;
let guardOutput = runUnplannedGuard(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(guardOutput, null, 'Tijdens de herstartrespijt mag bestaand EV-laden niet voortijdig worden gestopt');
flowValues.ess_audi_restart_grace_until = 0;
guardOutput = runUnplannedGuard(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(guardOutput.payload.command, 'stop', 'Ongepland laden na insteken moet automatisch worden gestopt');
guardOutput = runUnplannedGuard(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(guardOutput, null, 'Herhaalde stopopdrachten moeten worden begrensd');
flowValues.ess_audi_control_status = { ...controlBeforeGuardTest, targetCurrent: 6 };
flowValues.ess_audi_last_unplanned_stop_at = 0;
guardOutput = runUnplannedGuard(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(guardOutput, null, 'Door ESS gepland laden mag niet door de bewaking worden gestopt');
flowValues.ess_audi_control_status = controlBeforeGuardTest;
states['sensor.ev_charger_power'] = state(0);
states['sensor.ev_charger_status'] = state('awaiting_start', { id: 'TEST-CHARGER', state_outputPhase: 10, config_phaseMode: 1 });

flowValues.ess_audi_control_status.solarHighSince = Date.now() - 121000;
flowValues.ess_audi_control_status.lastPhaseChangeAt = 0;
states['sensor.p1_meter_vermogen'] = state(-4700);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(flowValues.ess_audi_control_status.targetCurrent >= 6, 'Bij 4,7 kW overschot kan één fase blijven laden zonder fasewissel');
assert.strictEqual(regulatorOutput[2], null, 'De Easee mag niet naar drie fasen zolang één fase het zonneoverschot kan verwerken');
assert.strictEqual(flowValues.ess_audi_control_status.pendingPhaseMode, 0, 'Een niet-noodzakelijke fasewissel mag niet worden voorbereid');

flowValues.ess_audi_control_status.solarHighSince = Date.now() - 121000;
states['sensor.p1_meter_vermogen'] = state(-6000);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(regulatorOutput[0].payload.current, 0, 'Voor een fasewissel moet de laadstroom eerst naar 0 A');
assert.strictEqual(regulatorOutput[1].payload.command, 'stop', 'Voor een fasewissel moet de EV eerst stoppen');
assert.strictEqual(flowValues.ess_audi_control_status.pendingPhaseMode, 3, 'Pas boven het maximale eenfasevermogen moet 3-fasen worden voorbereid');
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(regulatorOutput[2].payload.phaseMode, '3_phase', 'Na de veilige stop moet Easee naar 3-fasen schakelen');
states['sensor.ev_charger_status'] = state('awaiting_start', { id: 'TEST-CHARGER', state_outputPhase: 30, config_phaseMode: 3 });
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(flowValues.ess_audi_control_status.targetCurrent >= 6, 'Na bevestiging van 3-fasen moet zonneladen opnieuw starten');
assert.strictEqual(flowValues.ess_audi_control_status.phaseMode, 3, 'Regelstatus moet de actieve 3-fasenmodus tonen');

const activeThreePhaseControl = flowValues.ess_audi_control_status;
states['sensor.p1_meter_vermogen'] = state(0);
states['sensor.ev_charger_power'] = state(0);
flowValues.ess_audi_control_status = { ...activeThreePhaseControl, controlled:false, targetCurrent:0, controlMode:'none', pendingPhaseMode:0, lastPhaseChangeAt:0, solarLowSince:Date.now() - 301000 };
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.pendingPhaseMode, 0, 'Zonder voldoende zon mag een stilstaande Easee niet automatisch van fase wisselen');
assert.strictEqual(flowValues.ess_audi_control_status.phaseMode, 3, 'De bestaande Easee-fase moet buiten een noodzakelijke laadregeling behouden blijven');
assert.strictEqual(regulatorOutput[2], null, 'Zonder laadmogelijkheid mag geen faseopdracht worden verzonden');
flowValues.ess_audi_control_status = activeThreePhaseControl;

states['sensor.p1_meter_vermogen'] = state(0);
states['sensor.accu_vermogen'] = state(-5000);
states['sensor.ev_charger_power'] = state(2.3);
flowValues.ess_nordpool_forecast = [];
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(flowValues.ess_audi_control_status.targetCurrent >= 6, 'Zonneladen moet na de start minimaal vijf minuten actief blijven');
assert(flowValues.ess_audi_control_status.status.includes('minimaal 5 minuten'), 'Status van de minimale laadduur ontbreekt');
flowValues.ess_audi_control_status.solarStartedAt = Date.now() - 301000;
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(flowValues.ess_audi_control_status.targetCurrent >= 6, 'Na de minimale laadduur moet twee minuten onvoldoende vermogen worden afgewacht');
assert(flowValues.ess_audi_control_status.status.includes('2 minuten voor zonnestop'), 'Status van de vertraagde zonnestop ontbreekt');
flowValues.ess_audi_control_status.solarInsufficientSince = Date.now() - 121000;
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(regulatorOutput[0].payload.current, 0, 'Na vijf minuten laden en twee minuten onvoldoende zon moet de laadlimiet naar 0 A');
assert.strictEqual(regulatorOutput[1].payload.command, 'stop', 'Na de vertraging moet een stopopdracht volgen');

const departure = new Date(Date.now() + 12 * 60 * 60 * 1000);
const departureTime = String(departure.getHours()).padStart(2, '0') + ':' + String(departure.getMinutes()).padStart(2, '0');
runEVControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic: 'ess/audi/departure-time', payload: departureTime });
const plannedPrices = Array.from({ length: 48 }, (_, index) => index === 0 ? 0.19135 : 0.25 + index / 1000);
flowValues.ess_nordpool_forecast = plannedPrices.map((allInPrice, index) => ({
    start: new Date(currentQuarterStart + index * 900000).toISOString(),
    end: new Date(currentQuarterStart + (index + 1) * 900000).toISOString(),
    marketPrice: (allInPrice - 0.13085) / 1.21,
    allInPrice
}));
states['sensor.nord_pool_nl_huidige_prijs'] = state(0.05);
states['sensor.p1_meter_vermogen'] = state(1000);
states['sensor.ev_charger_power'] = state(0);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(flowValues.ess_audi_control_status.targetCurrent >= 6, 'Een geselecteerd goedkoopste kwartier moet automatisch laden starten');
assert(flowValues.ess_audi_control_status.status.includes('Vertrekplanning'), 'Regelstatus moet de vertrekplanning tonen');
assert(Math.abs(flowValues.ess_audi_control_status.allInPrice - 0.19135) < 0.00001, 'All-in prijs moet btw, energiebelasting en Zonneplan-opslag bevatten');
assert.strictEqual(flowValues.ess_audi_control_status.departureSoc, 70, 'Vertrekplanning moet 70% als gegarandeerd niveau gebruiken');
assert.strictEqual(flowValues.ess_audi_control_status.daySoc, undefined, 'Regelstatus mag geen dagdoel meer bevatten');
assert.strictEqual(flowValues.ess_audi_control_status.targetSoc, 70, 'Gepland laden moet tot het vertrekdoel van 70% begrensd zijn');
assert(flowValues.ess_audi_control_status.scheduledSlots >= 4, 'De planning moet genoeg kwartieren kiezen voor de benodigde vertrekenergie');
assert(flowValues.ess_audi_control_status.departureScheduledSlots > 0, 'Vertrekdoel moet eigen laadkwartieren krijgen');
assert.strictEqual(flowValues.ess_audi_control_status.dayScheduledSlots, undefined, 'Dagkwartieren moeten uit de planning zijn verwijderd');
assert.strictEqual(flowValues.ess_audi_control_status.plannedChargePowerKw, 10, 'De laadklok moet het geplande laadvermogen tonen');
assert(flowValues.ess_audi_control_status.plannedGridEnergyKwh > 0, 'De laadklok moet de totale geplande energie berekenen');
const expectedPlannedCost = flowValues.ess_audi_control_status.selectedSlots.reduce((sum, slot) => sum + slot.energyKwh * slot.allInPrice, 0);
assert(Math.abs(flowValues.ess_audi_control_status.plannedGridCost - expectedPlannedCost) < 0.00001, 'De totale laadprijs moet per gepland kwartier uit energie maal all-in prijs worden berekend');
assert(flowValues.ess_audi_control_status.selectedSlots.every((slot) => slot.powerKw === 10 && slot.energyKwh > 0), 'Ieder laadvlak moet vermogen en geplande energie bevatten');
const audiPlannedBlock = flowValues.ess_audi_control_status.selectedSlots;
assert(new Date(audiPlannedBlock.at(-1).end).getTime() - Math.max(Date.now(), new Date(audiPlannedBlock[0].start).getTime()) >= 15 * 60 * 1000 - 1000, 'Een gepland EV-laadblok moet minimaal vijftien minuten duren');
assert(audiPlannedBlock.slice(1).every((slot, index) => new Date(slot.start).getTime() === new Date(audiPlannedBlock[index].end).getTime()), 'Geplande EV-kwartieren moeten één aaneengesloten laadblok vormen');
assert(!Number.isNaN(new Date(flowValues.ess_audi_control_status.departureAt).getTime()), 'De laadklok mist de absolute vertrektijd');
assert(new Date(flowValues.ess_audi_control_status.activeDepartureBlockEnd).getTime() > Date.now(), 'Een gestart vertreklaadblok moet een vaste eindtijd krijgen');

const almostFinishedQuarterEnd = Date.now() + 1000;
flowValues.ess_nordpool_forecast = Array.from({ length: 48 }, (_, index) => ({
    start: new Date(index === 0 ? currentQuarterStart : almostFinishedQuarterEnd + (index - 1) * 900000).toISOString(),
    end: new Date(index === 0 ? almostFinishedQuarterEnd : almostFinishedQuarterEnd + index * 900000).toISOString(),
    marketPrice: 0.05 + index / 1000,
    allInPrice: 0.19135 + index / 1000
}));
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.plannerScheduledNow, false, 'De regressietest moet het bijna afgelopen, te kleine kwartier uit het nieuwe plan filteren');
assert.strictEqual(flowValues.ess_audi_control_status.scheduledNow, true, 'Een reeds gestart laadblok mag in de laatste seconden van een kwartier niet wegvallen');
assert(flowValues.ess_audi_control_status.targetCurrent >= 6, 'De laadstroom moet over de kwartiergrens actief blijven');
assert(!regulatorOutput[1] || regulatorOutput[1].payload.command !== 'stop', 'De Easee mag op de kwartiergrens geen stopopdracht ontvangen');
flowValues.ess_nordpool_forecast = plannedPrices.map((allInPrice, index) => ({
    start: new Date(currentQuarterStart + index * 900000).toISOString(),
    end: new Date(currentQuarterStart + (index + 1) * 900000).toISOString(),
    marketPrice: (allInPrice - 0.13085) / 1.21,
    allInPrice
}));

states['sensor.energy_production_today_remaining'] = state(6.8, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production remaining today' });
states['sensor.energy_production_today_remaining_2'] = state(8.2, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production remaining today' });
states['sensor.energy_production_today_remaining_3'] = state(4.6, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production remaining today' });
states['sensor.growatt_battery_battery_soc'] = state(100);
states['sun.sun'] = state('above_horizon', { next_setting: new Date(departure.getTime() - 60 * 60 * 1000).toISOString() });
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(Math.abs(flowValues.ess_audi_control_status.solarForecastRemainingKwh - 19.6) < 0.001, 'De resterende zonverwachting moet de drie Forecast.Solar-vlakken optellen');
assert.strictEqual(flowValues.ess_audi_control_status.solarOnlyExpected, true, 'Voldoende zonverwachting moet netladen voor het vertrekdoel uitstellen');
assert.strictEqual(flowValues.ess_audi_control_status.scheduledSlots, 0, 'Bij voldoende verwachte zon mogen geen netkwartieren worden gepland');
assert(flowValues.ess_audi_control_status.solarEnergyReservedKwh >= flowValues.ess_audi_control_status.departureEnergyNeeded - 0.05, 'De verwachte zon moet de benodigde vertrekenergie afdekken');
assert(flowValues.ess_audi_control_status.status.includes('alleen zonneladen'), 'Regelstatus moet uitleggen dat alleen zon wordt verwacht');

states['sensor.growatt_battery_battery_soc'] = state(50);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(Math.abs(flowValues.ess_audi_control_status.witBatteryReserveKwh - (15 / 0.92)) < 0.01, 'De prognose moet eerst de ontbrekende energie voor 30 kWh WIT-opslag reserveren');
assert.strictEqual(flowValues.ess_audi_control_status.solarOnlyExpected, false, 'Een halfvolle WIT-accu mag de verwachte zon niet volledig aan de EV toewijzen');
assert(flowValues.ess_audi_control_status.scheduledSlots > 0, 'Na de WIT-reserve moeten zo nodig goedkope netkwartieren voor het vertrekdoel blijven staan');
states['sensor.energy_production_today_remaining'] = state(0, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production remaining today' });
states['sensor.energy_production_today_remaining_2'] = state(0, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production remaining today' });
states['sensor.energy_production_today_remaining_3'] = state(0, { unit_of_measurement: 'kWh', friendly_name: 'Estimated energy production remaining today' });

states['sensor.ev_state_of_charge'] = state(75);
runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.departureScheduledSlots, 0, 'Boven het vertrekdoel zijn geen gegarandeerde vertrekkwartieren meer nodig');
states['sensor.p1_meter_vermogen'] = state(-2000);
states['sensor.ev_charger_power'] = state(0);
states['sensor.ev_charger_status'] = state('awaiting_start', { id: 'TEST-CHARGER', state_outputPhase: 10, config_phaseMode: 1 });
flowValues.ess_audi_control_status = { ...flowValues.ess_audi_control_status, controlled: false, targetCurrent: 0, controlMode: 'none', pendingPhaseMode: 0, lastPhaseChangeAt: 0, solarPhaseMode: 1, solarReadySince: Date.now() - 121000 };
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(flowValues.ess_audi_control_status.targetCurrent >= 6, 'Zonne-overschot moet ook boven het vertrekdoel worden benut');
assert.strictEqual(flowValues.ess_audi_control_status.controlMode, 'solar', 'Boven het vertrekdoel mag uitsluitend zonneladen actief worden');
states['sensor.ev_state_of_charge'] = state(90);
states['sensor.ev_target_state_of_charge'] = state(100);
flowValues.ess_audi_control_status = { ...flowValues.ess_audi_control_status, controlled: true, targetCurrent: 6, controlMode: 'solar', pendingPhaseMode: 0 };
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(regulatorOutput[0].payload.current, 0, 'Zonneladen moet stoppen zodra de afzonderlijke zonne-SOC is bereikt');
assert(flowValues.ess_audi_control_status.status.includes('Zonne-SOC van 90% bereikt'), 'De reden voor de zonne-SOC-grens ontbreekt');
states['sensor.ev_state_of_charge'] = state(61);
states['sensor.ev_target_state_of_charge'] = state(80);
states['sensor.p1_meter_vermogen'] = state(1000);
states['sensor.ev_charger_power'] = state(0);
states['sensor.ev_charger_status'] = state('awaiting_start', { id: 'TEST-CHARGER', state_outputPhase: 30, config_phaseMode: 3 });

flowValues.ess_nordpool_forecast = plannedPrices.map((_, index) => ({
    start: new Date(currentQuarterStart + index * 900000).toISOString(),
    end: new Date(currentQuarterStart + (index + 1) * 900000).toISOString(),
    marketPrice: 0.2,
    allInPrice: index === 0 ? 0.5 : index <= 8 ? 0.18 + index / 1000 : 0.4 + index / 1000
}));
flowValues.ess_audi_control_status = { ...flowValues.ess_audi_control_status, controlled: false, targetCurrent: 0, controlMode: 'none', pendingPhaseMode: 0 };
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.targetCurrent, 0, 'Een duur huidig kwartier mag niet starten als goedkopere blokken voldoende zijn');
assert.strictEqual(flowValues.ess_audi_control_status.scheduledNow, false, 'Het dure huidige kwartier mag niet in de planning staan');

flowValues.ess_audi_control_status = { ...flowValues.ess_audi_control_status, controlled: true, targetCurrent: 6, controlMode: 'departure-plan', pendingPhaseMode: 0 };
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(flowValues.ess_audi_control_status.targetCurrent >= 6, 'Een eenmaal gestart EV-laadblok mag niet voor een iets goedkoper kwartier worden onderbroken');
assert.strictEqual(flowValues.ess_audi_control_status.scheduledNow, true, 'Een actief aaneengesloten laadblok moet tijdens herplanning behouden blijven');

states['sensor.ev_state_of_charge'] = state(20);
flowValues.ess_audi_soc_estimator = {};
flowValues.ess_audi_control_status = { ...flowValues.ess_audi_control_status, controlled:false, requestedActive:false, targetCurrent:0, controlMode:'none', activeDepartureBlockStart:null, activeDepartureBlockEnd:null, pendingPhaseMode:0 };
flowValues.ess_nordpool_forecast = Array.from({ length:48 }, (_, index) => ({
    start:new Date(currentQuarterStart + index * 900000).toISOString(),
    end:new Date(currentQuarterStart + (index + 1) * 900000).toISOString(),
    marketPrice:index < 4 ? 0.03 : index < 24 ? 0.36 : 0.11,
    allInPrice:index < 4 ? 0.20 : index < 24 ? 0.60 : 0.30
}));
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.scheduledNow, false, 'Het volledige lange laadblok vanaf nu moet duurder zijn dan de latere planning');
assert.strictEqual(flowValues.ess_audi_control_status.cheapNowActive, true, 'Een huidig halfuur dat goedkoper is dan alle geplande kwartieren moet als voordelig blok worden benut');
assert.strictEqual(flowValues.ess_audi_control_status.controlMode, 'cheap-now', 'Een voordelig huidig blok moet een herkenbare regelmodus gebruiken');
assert.strictEqual(flowValues.ess_audi_control_status.requestedTargetCurrent, flowValues.ess_audi_control_status.safeCurrentLimit, 'Een voordelig huidig blok moet het maximaal veilige laadvermogen aanvragen');
assert(new Date(flowValues.ess_audi_control_status.cheapNowBlockEnd).getTime() - Date.now() >= 15 * 60 * 1000 - 1000, 'Een voordelig huidig laadblok moet minimaal vijftien minuten vaststaan');
assert(flowValues.ess_audi_control_status.cheapNowAveragePrice + 0.005 < flowValues.ess_audi_control_status.plannedReferencePrice, 'Het huidige blok moet aantoonbaar goedkoper zijn dan de latere planning');
const fixedCheapNowBlockEnd = flowValues.ess_audi_control_status.cheapNowBlockEnd;
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.cheapNowBlockEnd, fixedCheapNowBlockEnd, 'Een gestart voordelig blok mag bij herplanning niet steeds opschuiven');
assert(!regulatorOutput[1] || regulatorOutput[1].payload.command !== 'stop', 'Een voordelig blok mag niet op de volgende regelcyclus worden onderbroken');
flowValues.ess_nordpool_forecast = plannedPrices.map((allInPrice, index) => ({
    start: new Date(currentQuarterStart + index * 900000).toISOString(),
    end: new Date(currentQuarterStart + (index + 1) * 900000).toISOString(),
    marketPrice: (allInPrice - 0.13085) / 1.21,
    allInPrice
}));

states['sensor.ev_target_state_of_charge'] = state(100);
states['sensor.ev_state_of_charge'] = state(85);
states['sensor.nord_pool_nl_huidige_prijs'] = state(-0.10);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(flowValues.ess_audi_control_status.allInPrice > 0, 'Testprijs moet na belasting en opslag netto positief blijven');
assert.strictEqual(flowValues.ess_audi_control_status.targetSoc, 90, 'Bij een niet-negatieve netto all-in prijs mag het doel niet automatisch 100% worden');
states['sensor.nord_pool_nl_huidige_prijs'] = state(-0.11);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert(flowValues.ess_audi_control_status.allInPrice < 0, 'Testprijs moet inclusief belasting en opslag netto negatief zijn');
assert.strictEqual(flowValues.ess_audi_control_status.targetSoc, 100, 'Alleen bij een negatieve netto all-in prijs moet het laaddoel 100% zijn');
assert(flowValues.ess_audi_control_status.status.includes('Negatieve netto all-in prijs'), 'Negatieve-prijsstatus moet de netto all-in grens benoemen');

states['sensor.nord_pool_nl_huidige_prijs'] = state(0.05);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.targetSoc, 90, 'Na het negatieve kwartier moet het doel terug naar de zonne-SOC');
assert.strictEqual(regulatorOutput[0].payload.current, 0, 'Boven het vertrekdoel moet netladen stoppen als er geen zonne-overschot is');
assert.strictEqual(regulatorOutput[1].payload.command, 'stop', 'Terugschakelen naar het vertrekdoel moet Easee stoppen');

flowValues.ess_audi_force_full = true;
states['sensor.ev_state_of_charge'] = state(85);
states['sensor.ev_target_state_of_charge'] = state(100);
flowValues.ess_audi_control_status = { ...flowValues.ess_audi_control_status, controlled:false, requestedActive:false, targetCurrent:0, controlMode:'none', pendingPhaseMode:0 };
states['sensor.ev_charger_status'] = state('completed', { id: 'TEST-CHARGER', state_outputPhase: 30, config_phaseMode: 3 });
states['sensor.ev_charger_power'] = state(0);
states['sensor.ev_charger_current'] = state(0);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.directChargeResumeCompleted, true, 'Direct naar 100% moet een door een eerdere stop achtergebleven completed-status herkennen');
assert.strictEqual(flowValues.ess_audi_control_status.controlMode, 'force-full', 'Direct naar 100% moet vanuit completed opnieuw regelbaar zijn');
assert.strictEqual(regulatorOutput[1].payload.command, 'start', 'Direct naar 100% moet Easee vanuit completed opnieuw starten');
flowValues.ess_audi_start_recovery = { stage:'blocked', attempts:0, chargerId:'TEST-CHARGER', status:'completed' };
const completedDirectRetry = runStartRetry(globalContext, flowContext, { status: () => undefined }, { payload:{ chargerId:'TEST-CHARGER', current:25 } });
assert.strictEqual(completedDirectRetry[0].payload.command, 'start', 'De startbewaking moet completed tijdens een expliciete directe opdracht opnieuw proberen');
flowValues.ess_audi_start_recovery = { stage:'idle', attempts:0, chargerId:'TEST-CHARGER' };

states['sensor.ev_charger_status'] = state('charging', { id: 'TEST-CHARGER', state_outputPhase: 30, config_phaseMode: 3 });
delete states['sensor.ev_charger_current'];
states['sensor.p1_meter_vermogen'] = state(0);
states['sensor.ev_charger_power'] = state(2.3);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.controlMode, 'force-full', 'Direct laden moet een herkenbare tijdelijke regelmodus gebruiken');
assert.strictEqual(flowValues.ess_audi_control_status.targetSoc, 100, 'Direct laden moet 100% als doel tonen');
assert.strictEqual(flowValues.ess_audi_control_status.targetCurrent, flowValues.ess_audi_control_status.safeCurrentLimit, 'Direct laden moet zonder rustige opbouw meteen de maximale veilige faselimiet gebruiken');
assert(flowValues.ess_audi_control_status.targetCurrent >= 20, 'Direct laden mag niet op de opstartwaarde van 6 A blijven hangen');

flowValues.ess_audi_soc_estimator = { reportedSoc:85, estimatedSoc:85, lastSampleAt:new Date(Date.now() - 60000).toISOString() };
flowValues.ess_audi_control_status = {
    ...flowValues.ess_audi_control_status,
    targetCurrent:6,
    requestedActive:true,
    controlled:true,
    actualCharging:true,
    actualChargeSince:Date.now() - 31000,
    chargeRequestedSince:Date.now() - 40000,
    lastIncreaseAt:Date.now() - 61000,
    controlMode:'force-full',
    pendingPhaseMode:0
};
states['sensor.ev_charger_power'] = state(10.8);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.active, true, 'Pas na 30 seconden en minstens 1 kW werkelijk vermogen mag EV-laden actief zijn');
assert.strictEqual(flowValues.ess_audi_control_status.chargingConfirmed, true, 'Werkelijk stabiel EV-laadvermogen moet expliciet worden bevestigd');
assert(flowValues.ess_audi_control_status.estimatedEVSoc > 85.15, 'De EV-SOC moet tussen cloudmetingen uit werkelijk laadvermogen worden doorgerekend');
assert.strictEqual(flowValues.ess_audi_control_status.targetCurrent, 25, 'Direct laden moet ook tijdens een lopende sessie de stroomcurve overslaan');

states['sensor.ev_charger_power'] = state(0);
states['sensor.ev_charger_power'].last_updated = new Date(Date.now() - 15 * 60 * 1000).toISOString();
states['sensor.ev_charger_current'] = state(15.6, {
    state_circuitTotalAllocatedPhaseConductorCurrentL1:18,
    state_circuitTotalAllocatedPhaseConductorCurrentL2:18,
    state_circuitTotalAllocatedPhaseConductorCurrentL3:18
});
states['sensor.p1_meter_vermogen'] = state(10000);
states['sensor.p1_meter_vermogen_fase_1'] = state(3500);
states['sensor.p1_meter_vermogen_fase_2'] = state(3600);
states['sensor.p1_meter_vermogen_fase_3'] = state(3400);
flowValues.ess_audi_control_status = {
    ...flowValues.ess_audi_control_status,
    targetCurrent:21,
    requestedActive:true,
    controlled:true,
    actualCharging:true,
    actualChargeSince:Date.now() - 61000,
    chargeRequestedSince:Date.now() - 61000,
    pendingPhaseMode:0
};
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.active, true, 'Een gelijkblijvend of oud vermogenssignaal mag laden niet meer als mislukt markeren wanneer 15,6 A loopt');
assert(flowValues.ess_audi_control_status.targetCurrent >= 18, 'Een tijdelijk 0 W-signaal mag de faseregeling niet opnieuw naar 6 A laten terugvallen');
assert.strictEqual(flowValues.ess_audi_control_status.chargerCurrentA, 15.6, 'De regelaar moet de werkelijke Easee-laadstroom als terugkoppeling gebruiken');

flowValues.ess_audi_force_full = false;
states['sensor.ev_state_of_charge'] = state(50);
states['sensor.ev_charger_status'] = state('awaiting_start', { id:'TEST-CHARGER', state_outputPhase:10, config_phaseMode:1 });
states['sensor.ev_charger_power'] = state(0);
states['sensor.p1_meter_vermogen'] = state(-5000);
states['sensor.p1_meter_vermogen_fase_1'] = state(230);
states['sensor.p1_meter_vermogen_fase_2'] = state(-460);
states['sensor.p1_meter_vermogen_fase_3'] = state(0);
flowValues.ess_nordpool_forecast = [];
flowValues.ess_audi_control_status = {
    ...flowValues.ess_audi_control_status,
    targetCurrent:6,
    requestedActive:true,
    controlled:true,
    actualCharging:false,
    chargeRequestedSince:Date.now() - 40000,
    lastIncreaseAt:Date.now() - 61000,
    controlMode:'solar',
    solarReadySince:Date.now() - 121000,
    solarStartedAt:Date.now() - 301000,
    solarHighSince:0,
    pendingPhaseMode:0
};
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.targetCurrent, 10, `Automatisch laden mag met 4 A per minuut oplopen: ${flowValues.ess_audi_control_status.status}`);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.targetCurrent, 10, 'Binnen één minuut mag geen volgende automatische stroomstap worden gezet');
flowValues.ess_audi_control_status.lastIncreaseAt = Date.now() - 61000;
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.targetCurrent, 14, 'Na één minuut mag de volgende automatische stap van 4 A volgen');
states['sensor.p1_meter_vermogen_fase_1'] = state(3450);
states['sensor.p1_meter_vermogen_fase_2'] = state(3450);
states['sensor.p1_meter_vermogen_fase_3'] = state(3450);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.targetCurrent, 7, 'Een lagere veilige faselimiet moet ondanks de steilere curve onmiddellijk worden toegepast');
states['sensor.p1_meter_vermogen_fase_1'] = state(230);
states['sensor.p1_meter_vermogen_fase_2'] = state(-460);
states['sensor.p1_meter_vermogen_fase_3'] = state(0);

flowValues.ess_audi_force_full = true;
flowValues.ess_audi_control_status = { ...flowValues.ess_audi_control_status, controlled:false, requestedActive:false, targetCurrent:0, pendingPhaseMode:0 };
states['sensor.ev_charger_status'] = state('awaiting_start', { id:'TEST-CHARGER', state_outputPhase:10, config_phaseMode:1 });
states['sensor.ev_charger_power'] = state(0);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_control_status.preflightWindowActive, true, 'Tien minuten voor gepland of direct laden moet de startcontrole actief zijn');
assert(flowValues.ess_audi_control_status.preflightIssues.includes('wacht op 3 fasen'), 'De startcontrole moet een nog ontbrekende driefasenstand tonen');
assert.strictEqual(flowValues.ess_audi_control_status.preflightReady, false, 'Met een onjuiste fasestand mag de voorbereiding niet gereed melden');
states['sensor.ev_charger_status'] = state('disconnected', { id:'TEST-CHARGER', state_outputPhase:30, config_phaseMode:3 });
states['sensor.ev_charger_current'] = state(0);
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.strictEqual(flowValues.ess_audi_force_full, false, 'Ontkoppelen moet Direct naar 100% automatisch uitschakelen');
assert.strictEqual(flowValues.ess_audi_control_status.forceFull, false, 'De status mag Direct naar 100% na ontkoppelen niet actief houden');
states['sensor.ev_charger_status'] = state('awaiting_start', { id:'TEST-CHARGER', state_outputPhase:30, config_phaseMode:3 });
regulatorOutput = runEVRegulator(globalContext, flowContext, { status: () => undefined }, {});
assert.notStrictEqual(flowValues.ess_audi_control_status.controlMode, 'force-full', 'Een volgende aansluiting mag Direct naar 100% niet opnieuw starten');
flowValues.ess_audi_force_full = false;

const currentAction = flows.find((node) => node.id === 'ess00000000000e');
const commandAction = flows.find((node) => node.id === 'ess00000000000f');
const phaseAction = flows.find((node) => node.id === 'ess000000000017');
const departureAction = flows.find((node) => node.id === 'ess000000000012');
const climateDevice = flows.find((node) => node.id === 'essaudi_device001');
const vehicleDevice = flows.find((node) => node.id === 'essaudi_device002');
const climateAction = flows.find((node) => node.id === 'essaudi_climate01');
const vehicleAction = flows.find((node) => node.id === 'essaudi_vehicle01');
assert(!flows.some((node) => node.id === 'ess000000000011'), 'Uitgebreide EV-instellingen horen niet meer op het vereenvoudigde dashboard');
assert.strictEqual(departureAction.action, 'input_datetime.set_datetime');
assert.strictEqual(currentAction.action, 'easee.set_charger_dynamic_limit');
assert.strictEqual(commandAction.action, 'easee.action_command');
assert.strictEqual(phaseAction.action, 'easee.set_charger_phase_mode');
assert.strictEqual(climateDevice.type, 'api-render-template');
assert.strictEqual(vehicleDevice.type, 'api-render-template');
assert(climateDevice.template.includes("device_id('device_tracker.ev_position')"), 'Home Assistant moet het EV-device-ID tijdens runtime opzoeken');
assert.deepStrictEqual(audiControl.wires[2], [climateDevice.id], 'Klimaatopdracht moet eerst het actuele EV-device-ID ophalen');
assert.deepStrictEqual(audiControl.wires[3], [vehicleDevice.id], 'Voertuigopdracht moet eerst het actuele EV-device-ID ophalen');
assert.strictEqual(climateAction.action, 'audiconnect.start_climate_control');
assert.strictEqual(vehicleAction.action, 'audiconnect.execute_vehicle_action');
assert(climateAction.data.includes('"device_id": payload.deviceId'), 'EV-klimaatactie moet het door v2.3.1 vereiste device_id versturen');
assert(vehicleAction.data.includes('"device_id": payload.deviceId'), 'EV-voertuigactie moet het door v2.3.1 vereiste device_id versturen');
assert(!climateAction.data.includes('vin') && !vehicleAction.data.includes('vin'), 'EV Connect v2.3.1 accepteert geen VIN-veld in deze acties');
assert.strictEqual(climateAction.blockInputOverrides, true, 'Klimaatopdracht mag geen dashboardoverschrijving van de vaste service toestaan');
assert.strictEqual(vehicleAction.blockInputOverrides, true, 'Vergrendelopdracht mag geen dashboardoverschrijving van de vaste service toestaan');
assert.strictEqual(currentAction.blockInputOverrides, true, 'Dashboardbericht mag de vaste Easee-actie niet overschrijven');
assert.strictEqual(commandAction.blockInputOverrides, true, 'Dashboardbericht mag de vaste Easee-opdracht niet overschrijven');
assert.strictEqual(phaseAction.blockInputOverrides, true, 'Dashboardbericht mag de vaste Easee-faseactie niet overschrijven');
assert(!JSON.stringify(flows).includes('EMF87EUS'), 'Persoonlijk Easee-apparaat-ID mag niet in Git worden opgeslagen');

const loadsControl = flows.find((node) => node.id === 'essloads_control1');
const compressorAction = flows.find((node) => node.id === 'essloads_comp001');
const coolingZone2Action = flows.find((node) => node.id === 'essloads_airco01');
const coolingZone3Action = flows.find((node) => node.id === 'essloads_airco02');
assert(loadsControl && compressorAction, 'Bediening voor de compressor ontbreekt');
assert(!coolingZone2Action && !coolingZone3Action, 'Dubbele aircobediening hoort niet meer op de verbruikerspagina');
assert.deepStrictEqual(detailTemplates.loads.wires, [[loadsControl.id]], 'Verbruikerspagina moet uitsluitend via de beveiligingsfunctie schakelen');
flowValues.ess_system_config = {
    modules:{ loads:true, lighting:true, climate:true },
    entities:Object.fromEntries([
        'switch.flex_load_1',
        ...Array.from({ length:8 }, (_, index) => `light.zone_${index + 1}`),
        ...Array.from({ length:4 }, (_, index) => `climate.cooling_zone_${index + 1}`),
        ...Array.from({ length:3 }, (_, index) => `climate.heating_zone_${index + 1}`),
        'climate.heat_pump', 'water_heater.domestic_hot_water'
    ].map((entityId) => [entityId, entityId]))
};
assert.deepStrictEqual(compressorAction.entityId, [], 'De flexibele last moet via de lokaal geconfigureerde entiteit schakelen');
assert.strictEqual(compressorAction.blockInputOverrides, false, 'Alleen de beveiligingsfunctie mag de gevalideerde lokale entiteit doorgeven');
const runLoadsControl = new Function('global', 'flow', 'node', 'msg', loadsControl.func);
assert.strictEqual(runLoadsControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/load/toggle', payload: 'onbekend' }), null, 'Onbekende verbruiker moet worden geweigerd');
const compressorToggle = runLoadsControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/load/toggle', payload: 'compressor' });
assert.deepStrictEqual(compressorToggle.payload.target.entity_id, ['switch.flex_load_1'], 'De standaardmapping moet uitsluitend flexibele last 1 activeren');
assert.strictEqual(runLoadsControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/load/toggle', payload: 'cooling-zone-2' }), null, 'Koelzone 2 moet alleen via de klimaatpagina worden bediend');

const lightingControl = flows.find((node) => node.id === 'esslights_ctrl01');
const lightingActionIds = ['esslights_on001', 'esslights_off01'];
const lightingActions = lightingActionIds.map((id) => flows.find((item) => item.id === id));
assert(lightingControl && lightingActions.every(Boolean), 'Beveiligde verlichtingbediening ontbreekt');
assert.deepStrictEqual(detailTemplates.lighting.wires, [[lightingControl.id]], 'Verlichtingspagina moet uitsluitend via de beveiligingsfunctie bedienen');
assert.strictEqual(lightingControl.outputs, 2, 'Verlichting moet aparte vaste uitgangen voor inschakelen/dimmen en uitschakelen gebruiken');
for (const entityId of ['light.zone_1', 'light.zone_2', 'light.zone_3', 'light.zone_4', 'light.zone_5', 'light.zone_6', 'light.zone_7', 'light.zone_8']) {
    assert(lightingControl.func.includes(entityId), `Kamerzone ${entityId} ontbreekt in de vaste allowlist`);
}
for (const individual of ['light.bank', 'light.zone_3_1', 'light.zone_6_2', 'light.1_led_strip']) {
    assert(!lightingControl.func.includes(individual), `Los apparaat ${individual} mag niet door de verlichtingspagina worden gekoppeld`);
}
assert.deepStrictEqual(lightingControl.wires, lightingActionIds.map((id) => [id]), 'Verlichting mag alleen naar de twee vaste lichtacties lopen');
assert(lightingActions.every((item) => item.blockInputOverrides === false && item.entityId.length === 0), 'Alleen de beveiligingsfunctie mag een gevalideerde kamerzone doorgeven');
const lightingUpstreams = flows.filter((item) => (item.wires || []).some((output) => output.some((target) => lightingActionIds.includes(target))));
assert.deepStrictEqual(lightingUpstreams.map((item) => item.id), [lightingControl.id], 'Geen andere node mag de dynamische lichtacties aansturen');
const runLightingControl = new Function('global', 'flow', 'node', 'msg', lightingControl.func);
assert.strictEqual(runLightingControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/light/toggle', payload: { key: 'losse-lamp' } }), null, 'Onbekende of losse lamp moet worden geweigerd');
const zone2Off = runLightingControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/light/toggle', payload: { key: 'zone-2' } });
assert.deepStrictEqual(zone2Off[1].payload.target.entity_id, ['light.zone_2'], 'Actieve lichtzone 2 moet via de vaste uit-uitgang schakelen');
const zone4On = runLightingControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/light/toggle', payload: { key: 'zone-4' } });
assert.deepStrictEqual(zone4On[0].payload.target.entity_id, ['light.zone_4'], 'Lichtzone 4 moet rechtstreeks als kamerzone worden ingeschakeld');
assert.strictEqual(zone4On[0].payload.brightness, 100, 'Een kamerzone zonder dimstatus moet veilig op 100% starten');
const dimmed = runLightingControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/light/brightness', payload: { key: 'zone-1', brightness: 125 } });
assert.strictEqual(dimmed[0].payload.brightness, 100, 'Dimniveau moet tot 100% worden begrensd');
assert.deepStrictEqual(dimmed[0].payload.target.entity_id, ['light.zone_1']);

const climateControl = flows.find((node) => node.id === 'essclimate_ctrl1');
const climateActionIds = ['essclimate_temp1','essclimate_mode1','esswater_temp001','esswater_mode001'];
const climateActions = climateActionIds.map((id) => flows.find((item) => item.id === id));
assert(climateControl, 'Beveiligde klimaatbediening ontbreekt');
assert.deepStrictEqual(detailTemplates.climate.wires, [[climateControl.id]], 'Klimaatpagina moet uitsluitend via de beveiligingsfunctie bedienen');
assert(climateActions.every(Boolean), 'De vier generieke klimaatacties ontbreken');
assert.strictEqual(climateControl.outputs, 4, 'Klimaatbediening moet vier overzichtelijke uitgangen gebruiken');
for (const entityId of ['climate.heating_zone_1', 'climate.heating_zone_2', 'climate.heating_zone_3']) {
    assert(climateControl.func.includes(`\"entityId\":\"${entityId}\"`), `Tado-zone ${entityId} ontbreekt in de vaste allowlist`);
}
assert(!climateControl.func.includes('friendlyName') && !climateControl.func.includes('Object.entries(states)'), 'Klimaatbediening mag niet dynamisch naar losse Tado-apparaten zoeken');
assert.deepStrictEqual(climateControl.wires, climateActionIds.map((id) => [id]), 'Klimaatbediening moet uitsluitend naar de vier vaste actietypen lopen');
assert(climateActions.every((item) => item.blockInputOverrides === false && item.entityId.length === 0), 'Alleen de beveiligingsfunctie mag het gevalideerde klimaatdoel doorgeven');
const actionUpstreams = flows.filter((item) => (item.wires || []).some((output) => output.some((target) => climateActionIds.includes(target))));
assert.deepStrictEqual(actionUpstreams.map((item) => item.id), [climateControl.id], 'Geen andere node mag de dynamische klimaatacties aansturen');
assert(!JSON.stringify(flows).includes('VA0609631744') && !JSON.stringify(flows).includes('RU1761427200'), 'Tado-serienummers horen niet in Git');
const runClimateControl = new Function('global', 'flow', 'node', 'msg', climateControl.func);
assert.strictEqual(runClimateControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/climate/toggle', payload: { key: 'onbekend' } }), null, 'Onbekende klimaatruimte moet worden geweigerd');
const officeTemperature = runClimateControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/climate/set-temperature', payload: { key: 'cooling-zone-1', temperature: 31 } });
assert.strictEqual(officeTemperature[0].payload.temperature, 30, 'Airco-instelwaarde moet binnen de vaste veilige grens blijven');
assert.deepStrictEqual(officeTemperature[0].payload.target.entity_id, ['climate.cooling_zone_1']);
const bathroomTemperature = runClimateControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/climate/set-temperature', payload: { key: 'heating-zone-2', temperature: 20.7 } });
assert.strictEqual(bathroomTemperature[0].payload.temperature, 20.5, 'Tado-instelwaarde moet op halve graden worden afgerond');
assert.deepStrictEqual(bathroomTemperature[0].payload.target.entity_id, ['climate.heating_zone_2'], 'De bediening moet rechtstreeks naar de Tado-zone gaan');
const officeMode = runClimateControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/climate/toggle', payload: { key: 'cooling-zone-1' } });
assert.strictEqual(officeMode[1].payload.mode, 'off', 'Actieve airco moet via de vaste uitgang uitschakelen');
const utilityMode = runClimateControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/climate/toggle', payload: { key: 'heating-zone-3' } });
assert.strictEqual(utilityMode[1].payload.mode, 'auto', 'Uitgeschakelde Tado-zone moet naar de normale automatische zonemodus schakelen');
assert.deepStrictEqual(utilityMode[1].payload.target.entity_id, ['climate.heating_zone_3']);
const hotWaterMode = runClimateControl(globalContext, flowContext, { warn: () => undefined }, { topic: 'ess/climate/toggle', payload: { key: 'hot-water' } });
assert.strictEqual(hotWaterMode[3].payload.mode, 'off', 'Actief EHS-tapwater moet via de vaste water-heater-uitgang uitschakelen');

const witExportInject = flows.find((node) => node.id === 'esswitexport_inj1');
const witExportModeControl = flows.find((node) => node.id === 'esswitexport_mode');
const witExportControl = flows.find((node) => node.id === 'esswitexport_ctrl');
const witExportAuthorityAction = flows.find((node) => node.id === 'esswitexport_auth');
const witExportRateAction = flows.find((node) => node.id === 'esswitexport_rate');
const witExportToggleAction = flows.find((node) => node.id === 'esswitexport_sel1');
const witEVBufferModeControl = flows.find((node) => node.id === 'esswitaudi_profile');
const witGridChargeSettingsControl = flows.find((node) => node.id === 'esswitgrid_set01');
assert(witExportInject && witExportModeControl && witExportControl && witExportAuthorityAction && witExportRateAction && witExportToggleAction, 'WIT-exportbegrenzing of handmatige bediening ontbreekt');
assert.strictEqual(witExportInject.repeat, '60', 'WIT-exportbegrenzing moet iedere minuut worden gecontroleerd');
assert.strictEqual(witExportInject.once, true, 'WIT-exportbegrenzing moet na een herstart automatisch beginnen');
assert(witExportModeControl.initialize.includes("ess_wit_export_mode', 'auto"), 'Na een Node-RED-herstart moet de WIT-exportstand weer Automatisch zijn');
assert(witEVBufferModeControl, 'Bediening voor het reserveprofiel van de EV-accubuffer ontbreekt');
assert.deepStrictEqual(detailTemplates.battery.wires, [[witExportModeControl.id,witEVBufferModeControl.id,witGridChargeSettingsControl.id]], 'Alleen de drie beveiligde WIT-bedienfuncties mogen dashboardopdrachten ontvangen');
assert.deepStrictEqual(witExportModeControl.wires, [[witExportControl.id]], 'Een handmatige moduswijziging moet direct worden toegepast');
assert.deepStrictEqual(witExportControl.wires, [[witExportAuthorityAction.id],[witExportRateAction.id],[witExportToggleAction.id]], 'WIT-regelaar moet per cyclus hoogstens één Growatt-opdracht geven');
assert.deepStrictEqual(witExportAuthorityAction.entityId, ['select.growatt_grid_control_authority']);
assert.strictEqual(JSON.parse(witExportAuthorityAction.data).option, 'Enabled', 'De VPP-hoofdtoestemming moet vóór de exportbegrenzing worden ingeschakeld');
assert.deepStrictEqual(witExportAuthorityAction.wires, [[]], 'Growatt-opdrachten moeten door de minuutcyclus worden gescheiden');
assert.deepStrictEqual(witExportRateAction.wires, [[]], 'Growatt-opdrachten moeten door de minuutcyclus worden gescheiden');
assert.deepStrictEqual(witExportRateAction.entityId, ['number.growatt_grid_vpp_export_limit_power_rate']);
assert.strictEqual(JSON.parse(witExportRateAction.data).value, 1, '1% van de 18 kW-WIT moet circa 180 W terugleverbuffer geven');
assert.deepStrictEqual(witExportToggleAction.entityId, ['select.growatt_grid_vpp_export_limit_enable']);
assert.strictEqual(witExportAuthorityAction.blockInputOverrides, true, 'De Growatt-hoofdtoestemming mag niet vanuit een bericht worden overschreven');
assert.strictEqual(witExportRateAction.blockInputOverrides, true, 'De WIT-exportgrens mag niet vanuit een bericht worden overschreven');
assert.strictEqual(witExportToggleAction.blockInputOverrides, true, 'De WIT-exportschakelaar mag niet vanuit een bericht worden overschreven');
const runWitExportModeControl = new Function('global', 'flow', 'node', 'msg', witExportModeControl.func);
assert.strictEqual(runWitExportModeControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/export-mode', payload:'invalid' }), null, 'Een onbekende handmatige WIT-stand moet worden geweigerd');
assert.strictEqual(flowValues.ess_wit_export_mode, 'auto');
let modeTrigger = runWitExportModeControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/export-mode', payload:'on' });
assert(Number.isFinite(modeTrigger.payload), 'Handmatig aan moet de WIT-regelaar direct activeren');
assert.strictEqual(flowValues.ess_wit_export_mode, 'on');
const runWitExportControl = new Function('global', 'flow', 'node', 'msg', witExportControl.func);
const witControlStates = {
    'sensor.growatt_battery_battery_soc': state(89),
    'select.growatt_grid_control_authority': state('Disabled'),
    'select.growatt_grid_vpp_export_limit_enable': state('Disabled'),
    'number.growatt_grid_vpp_export_limit_power_rate': state(0)
};
const witGlobalContext = { get: () => ({ homeAssistant: { states: witControlStates } }) };
const witNode = { status: () => undefined };
witControlStates['sensor.growatt_battery_battery_soc'].last_updated = new Date(Date.now() - 21 * 60 * 1000).toISOString();
let witOutput = runWitExportControl(witGlobalContext, flowContext, witNode, {});
assert.strictEqual(witOutput[0].payload.option, 'Enabled', 'Handmatig aan moet ook zonder actuele SOC de exportbegrenzing inschakelen');
assert.strictEqual(witOutput[1], null);
assert.strictEqual(witOutput[2], null);
witControlStates['select.growatt_grid_control_authority'] = state('Enabled');
witOutput = runWitExportControl(witGlobalContext, flowContext, witNode, {});
assert.strictEqual(witOutput[1].payload.value, 1, 'Na de hoofdtoestemming moet 1% in een afzonderlijke cyclus worden ingesteld');
assert.strictEqual(witOutput[2], null);
modeTrigger = runWitExportModeControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/export-mode', payload:'off' });
assert(Number.isFinite(modeTrigger.payload));
witControlStates['select.growatt_grid_vpp_export_limit_enable'] = state('Enabled');
witControlStates['number.growatt_grid_vpp_export_limit_power_rate'] = state(1);
witOutput = runWitExportControl(witGlobalContext, flowContext, witNode, {});
assert.strictEqual(witOutput[2].payload.option, 'Disabled', 'Handmatig uit moet ook zonder actuele SOC de exportbegrenzing uitschakelen');
runWitExportModeControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/export-mode', payload:'auto' });
witControlStates['sensor.growatt_battery_battery_soc'] = state(89);
witControlStates['select.growatt_grid_vpp_export_limit_enable'] = state('Disabled');
witControlStates['number.growatt_grid_vpp_export_limit_power_rate'] = state(0);
witOutput = runWitExportControl(witGlobalContext, flowContext, witNode, {});
assert.strictEqual(witOutput[1].payload.value, 1, 'Onder 90% SOC moet eerst de exportgrens worden ingesteld');
assert.strictEqual(witOutput[2], null);
witControlStates['number.growatt_grid_vpp_export_limit_power_rate'] = state(1);
witOutput = runWitExportControl(witGlobalContext, flowContext, witNode, {});
assert.strictEqual(witOutput[2].payload.option, 'Enabled', 'Na de hoofdtoestemming en grens moet de exportbegrenzing worden ingeschakeld');
witControlStates['select.growatt_grid_vpp_export_limit_enable'] = state('Enabled');
assert.strictEqual(runWitExportControl(witGlobalContext, flowContext, witNode, {}), null, 'Correct ingestelde exportbegrenzing mag geen herhaalde opdracht geven');
flowValues.ess_audi_settings = { ...flowValues.ess_audi_settings, solarSoc:90 };
witControlStates['sensor.ev_charger_status'] = state('charging');
witControlStates['sensor.ev_state_of_charge'] = state(61);
witControlStates['sensor.ev_target_state_of_charge'] = state(100);
witOutput = runWitExportControl(witGlobalContext, flowContext, witNode, {});
assert.strictEqual(witOutput[2].payload.option, 'Disabled', 'Een aangesloten EV onder de zonne-SOC moet in Automatisch voorrang krijgen op de exportbegrenzing');
runWitExportModeControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/export-mode', payload:'on' });
witControlStates['select.growatt_grid_vpp_export_limit_enable'] = state('Disabled');
witOutput = runWitExportControl(witGlobalContext, flowContext, witNode, {});
assert.strictEqual(witOutput[2].payload.option, 'Enabled', 'Handmatig aan moet de automatische EV-prioriteit bewust kunnen overschrijven');
runWitExportModeControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/export-mode', payload:'auto' });
witControlStates['select.growatt_grid_vpp_export_limit_enable'] = state('Enabled');
witControlStates['sensor.ev_state_of_charge'] = state(90);
assert.strictEqual(runWitExportControl(witGlobalContext, flowContext, witNode, {}), null, 'Na het bereiken van de zonne-SOC mag de normale exportbegrenzing weer gelden');
witControlStates['sensor.ev_charger_status'] = state('disconnected');
witControlStates['sensor.ev_state_of_charge'] = state(61);
assert.strictEqual(runWitExportControl(witGlobalContext, flowContext, witNode, {}), null, 'Een niet-aangesloten EV mag de exportbegrenzing niet uitschakelen');
delete witControlStates['sensor.ev_charger_status'];
delete witControlStates['sensor.ev_state_of_charge'];
delete witControlStates['sensor.ev_target_state_of_charge'];
witControlStates['sensor.growatt_battery_battery_soc'] = state(90);
witOutput = runWitExportControl(witGlobalContext, flowContext, witNode, {});
assert.strictEqual(witOutput[0], null);
assert.strictEqual(witOutput[1], null);
assert.strictEqual(witOutput[2].payload.option, 'Disabled', 'Vanaf 90% SOC moet de exportbegrenzing worden uitgeschakeld');
witControlStates['sensor.growatt_battery_battery_soc'] = state(89);
witControlStates['sensor.growatt_battery_battery_soc'].last_updated = new Date(Date.now() - 21 * 60 * 1000).toISOString();
witControlStates['select.growatt_grid_vpp_export_limit_enable'] = state('Disabled');
witControlStates['sensor.growatt_battery_battery_power'] = state(-1100);
witOutput = runWitExportControl(witGlobalContext, flowContext, witNode, {});
assert.strictEqual(witOutput[2].payload.option, 'Enabled', 'Actuele Growatt-telemetrie moet een onveranderde geldige SOC veilig valideren');
delete witControlStates['sensor.growatt_battery_battery_power'];
assert.strictEqual(runWitExportControl(witGlobalContext, flowContext, witNode, {}), null, 'Verouderde SOC-data mag nooit een WIT-opdracht veroorzaken');
flowValues.ess_wit_audi_discharge_status = { sessionOwned:true, active:true };
runWitExportModeControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/export-mode', payload:'on' });
assert.strictEqual(runWitExportControl(witGlobalContext, flowContext, witNode, {}), null, 'Ook Handmatig aan moet wachten tot een eigen EV-ontlaadsessie veilig is gestopt');
flowValues.ess_wit_audi_discharge_status = { sessionOwned:false, active:false };

const witEVInject = flows.find((node) => node.id === 'esswitaudi_inj01');
const witEVControl = flows.find((node) => node.id === 'esswitaudi_ctrl1');
const witEVDurationAction = flows.find((node) => node.id === 'esswitaudi_time1');
const witEVRateAction = flows.find((node) => node.id === 'esswitaudi_rate1');
const witEVModeAction = flows.find((node) => node.id === 'esswitaudi_mode1');
const witEVStopAction = flows.find((node) => node.id === 'esswitaudi_stop1');
const witRemoteLivePowerAction = flows.find((node) => node.id === 'esswitgrid_live1');
const witRemoteRenewAction = flows.find((node) => node.id === 'esswitgrid_renew');
assert(witEVInject && witEVControl && witEVDurationAction && witEVRateAction && witEVModeAction && witEVStopAction && witRemoteLivePowerAction && witRemoteRenewAction, 'Prognosegestuurde WIT-ontlading voor de EV ontbreekt');
assert.strictEqual(witEVInject.repeat, '60', 'De EV-accubuffer moet iedere minuut opnieuw worden beoordeeld');
assert.strictEqual(witEVInject.once, true, 'De EV-accubuffer moet na een herstart vanzelf gaan bewaken');
assert(witEVControl.func.includes("eco: { label:'Eco'") && witEVControl.func.includes("normal: { label:'Normaal'") && witEVControl.func.includes("audi: { label:'EV voorrang'"), 'De EV-accubuffer mist een of meer reserveprofielen');
assert(witEVControl.func.includes('houseReserveKwh:14') && witEVControl.func.includes('houseReserveKwh:10') && witEVControl.func.includes('houseReserveKwh:6'), 'De reserveprofielen moeten verschillende woningreserves gebruiken');
assert(witEVControl.func.includes('batteryRechargeTargetSoc:90') && witEVControl.func.includes('batteryRechargeTargetSoc:100'), 'De reserveprofielen moeten ook de accureserve aanpassen');
assert(witEVControl.func.includes('durationMinutes = 2'), 'Een WIT-ontlaadopdracht moet binnen twee minuten vanzelf aflopen');
assert(witEVControl.func.includes('specs?.maximumBatteryPowerKw') && witEVControl.func.includes('specs?.gridImportBufferW'), 'De EV-accubuffer mist de configureerbare vermogensgrens of netafnamebuffer');
assert(witEVControl.func.includes('growattTelemetryFresh') && witEVControl.func.includes('socUsable'), 'Een onveranderde SOC moet via actuele Growatt-telemetrie veilig bruikbaar blijven');
assert(witEVControl.func.includes("value('sensor.ev_charger_current')") && witEVControl.func.includes('audiControl.actualCharging === true'), 'De WIT moet EV-laden via de actuele laadstroom en regelaarstatus herkennen');
assert(!witEVControl.func.includes("fresh('sensor.ev_charger_power', 30000)"), 'Een stilstaande Easee-vermogenssensor mag de WIT-ontlading niet blokkeren');
assert(witEVControl.func.includes("chargerPowerSource =") && witEVControl.func.includes("? 'p1'"), 'De snelle P1-meting moet als veilige reservebron voor EV-laadvermogen beschikbaar zijn');
assert.strictEqual(witEVControl.outputs, 5);
assert.deepStrictEqual(witEVControl.wires, [[witEVDurationAction.id],[witRemoteLivePowerAction.id],[witRemoteRenewAction.id],[witEVStopAction.id],[witExportToggleAction.id]]);
assert.deepStrictEqual(witEVDurationAction.entityId, ['number.growatt_grid_remote_power_control_charging_time']);
assert.deepStrictEqual(witEVRateAction.entityId, ['number.growatt_vpp_power_rate']);
assert.deepStrictEqual(witEVModeAction.entityId, ['select.growatt_mode_vpp']);
assert.deepStrictEqual(witEVStopAction.entityId, ['select.growatt_grid_remote_power_control_enable']);
assert.deepStrictEqual(witEVDurationAction.wires, [[witEVRateAction.id]], 'Eerst moet de veilige looptijd worden ingesteld');
assert.deepStrictEqual(witEVRateAction.wires, [[witEVModeAction.id]], 'Daarna moet de lokale VPP-sterkte vóór de atomaire modus worden ingesteld');
assert.strictEqual(JSON.parse(witEVModeAction.data).option, 'Discharge', 'De nieuwe atomaire Mode (VPP) moet voor extra ontlading worden gebruikt');
assert.strictEqual(JSON.parse(witEVStopAction.data).option, 'Disabled', 'Een eigen tijdelijke ontlaadsessie moet expliciet kunnen stoppen');

const runWitEVControl = new Function('global', 'flow', 'node', 'msg', witEVControl.func);
const runWitEVBufferModeControl = new Function('global', 'flow', 'node', 'msg', witEVBufferModeControl.func);
assert(witEVBufferModeControl.initialize.includes("ess_wit_audi_buffer_mode', 'normal"), 'Na een herstart moet Normaal het reserveprofiel zijn');
assert.deepStrictEqual(witEVBufferModeControl.wires, [[witEVControl.id]], 'Een profielkeuze moet de EV-accubuffer direct opnieuw beoordelen');
const witEVStates = {
    'sensor.growatt_battery_battery_soc': state(85),
    'sensor.growatt_battery_battery_power': state(-1000),
    'sensor.p1_meter_vermogen': state(4000),
    'sensor.ev_charger_power': state(11),
    'sensor.ev_charger_status': state('charging'),
    'number.growatt_discharge_cutoff_soc': state(10),
    'select.growatt_grid_remote_power_control_enable': state('Disabled'),
    'number.growatt_battery_remote_charge_and_discharge_power': state(0),
    'number.growatt_grid_remote_power_control_charging_time': state(0),
    'select.growatt_mode_vpp': state('Hold', { options:['Hold','Charge','Discharge'] }),
    'number.growatt_vpp_power_rate': state(100),
    'select.growatt_grid_vpp_export_limit_enable': state('Disabled'),
    'sensor.energy_production_tomorrow': state(14, { unit_of_measurement:'kWh' }),
    'sensor.energy_production_tomorrow_2': state(12, { unit_of_measurement:'kWh' }),
    'sensor.energy_production_tomorrow_3': state(10, { unit_of_measurement:'kWh' })
};
const witEVGlobalContext = { get: () => ({ homeAssistant: { states:witEVStates } }) };
flowValues.ess_wit_export_mode = 'auto';
flowValues.ess_wit_audi_buffer_mode = 'normal';
flowValues.ess_audi_control_status = { controlled:true, targetCurrent:16, updatedAt:new Date().toISOString() };
flowValues.ess_wit_audi_discharge_status = { sessionOwned:false, active:false };
witEVStates['sensor.growatt_battery_battery_soc'].last_updated = new Date(Date.now() - 10 * 60 * 1000).toISOString();
let witEVOutput = runWitEVControl(witEVGlobalContext, flowContext, witNode, {});
assert.strictEqual(witEVOutput[0].payload.durationMinutes, 2, 'Een geldige prognose moet een korte WIT-opdracht starten');
assert.strictEqual(witEVOutput[0].payload.powerPercent, 21, '4 kW netafname met 200 W buffer moet circa 21% WIT-ontlading vragen');
assert.strictEqual(flowValues.ess_wit_audi_discharge_status.sessionOwned, true);
assert(flowValues.ess_wit_audi_discharge_status.safeDischargeBudgetKwh > 0.75, 'Er moet aantoonbaar prognosebudget zijn voordat ontladen start');
const normalBudgetKwh = flowValues.ess_wit_audi_discharge_status.safeDischargeBudgetKwh;

witEVStates['select.growatt_grid_remote_power_control_enable'] = state('Enabled');
witEVStates['select.growatt_mode_vpp'] = state('Discharge', { options:['Hold','Charge','Discharge'] });
witEVStates['number.growatt_battery_remote_charge_and_discharge_power'] = state(-21);
witEVStates['sensor.p1_meter_vermogen'] = state(200);
witEVOutput = runWitEVControl(witEVGlobalContext, flowContext, witNode, {});
assert.strictEqual(witEVOutput[2].payload.option, 'Enabled', 'Een lopende ontlaadsessie moet alleen de korte veilige lease vernieuwen');
assert.strictEqual(flowValues.ess_wit_audi_discharge_status.active, true, 'De EV-buffer mag pas actief melden nadat Discharge werkelijk is bevestigd');
witEVStates['number.growatt_battery_remote_charge_and_discharge_power'] = state(-16);
witEVStates['sensor.p1_meter_vermogen'] = state(1100);
witEVOutput = runWitEVControl(witEVGlobalContext, flowContext, witNode, {});
assert.strictEqual(witEVOutput[1].payload.value, -21, 'Een lopende ontlaadsessie moet via het EEPROM-veilige remote register worden bijgeregeld');
witEVStates['sensor.p1_meter_vermogen'] = state(4000);
witEVStates['select.growatt_mode_vpp'] = state('Hold', { options:['Hold','Charge','Discharge'] });

flowValues.ess_wit_audi_discharge_status = { sessionOwned:false, active:false };
witEVStates['select.growatt_grid_remote_power_control_enable'] = state('Disabled');
witEVStates['sensor.ev_charger_power'] = state(0);
witEVStates['sensor.ev_charger_power'].last_updated = new Date(Date.now() - 15 * 60 * 1000).toISOString();
witEVStates['sensor.ev_charger_current'] = state(15.6);
flowValues.ess_audi_control_status = { controlled:true, actualCharging:true, targetCurrent:18, phaseCount:3, updatedAt:new Date().toISOString() };
witEVOutput = runWitEVControl(witEVGlobalContext, flowContext, witNode, {});
assert(witEVOutput && witEVOutput[0], 'Actueel EV-laden moet ook met een oude 0 W-vermogenssensor WIT-ontlading starten');
assert(witEVOutput[0].payload.powerPercent >= 20, 'De laadstroom moet voldoende WIT-ontlaadvermogen opleveren');
assert.strictEqual(flowValues.ess_wit_audi_discharge_status.audiChargingDetected, true, 'De WIT-status moet de robuuste EV-laaddetectie tonen');

flowValues.ess_wit_audi_discharge_status = { sessionOwned:false, active:false };
witEVStates['select.growatt_grid_remote_power_control_enable'] = state('Disabled');
witEVStates['sensor.ev_charger_current'] = state('unavailable');
witEVStates['sensor.ev_charger_power'] = state(0);
witEVStates['sensor.p1_meter_vermogen'] = state(5200);
flowValues.ess_audi_control_status = { controlled:true, actualCharging:false, targetCurrent:16, phaseCount:3, updatedAt:new Date().toISOString() };
witEVOutput = runWitEVControl(witEVGlobalContext, flowContext, witNode, {});
assert(witEVOutput && witEVOutput[0], 'De P1-meting moet WIT-ontlading kunnen starten wanneer beide Easee-vermogensmetingen ontbreken');
assert.strictEqual(flowValues.ess_wit_audi_discharge_status.chargerPowerSource, 'p1', 'De status moet zichtbaar maken dat de P1-reservebron is gebruikt');
assert.strictEqual(flowValues.ess_wit_audi_discharge_status.p1ChargingActive, true, 'De P1-reservedetectie moet actief zijn tijdens een bevestigde EV-laadsessie');

assert.strictEqual(runWitEVBufferModeControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/audi-buffer-mode', payload:'invalid' }), null, 'Een onbekend reserveprofiel moet worden geweigerd');
assert.strictEqual(flowValues.ess_wit_audi_buffer_mode, 'normal');
runWitEVBufferModeControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/audi-buffer-mode', payload:'eco' });
flowValues.ess_wit_audi_discharge_status = { sessionOwned:false, active:false };
witEVStates['select.growatt_grid_remote_power_control_enable'] = state('Disabled');
runWitEVControl(witEVGlobalContext, flowContext, witNode, {});
const ecoBudgetKwh = flowValues.ess_wit_audi_discharge_status.safeDischargeBudgetKwh;
assert.strictEqual(flowValues.ess_wit_audi_discharge_status.batteryRechargeTargetSoc, 100);
assert.strictEqual(flowValues.ess_wit_audi_discharge_status.safetyFloorSoc, 50);

runWitEVBufferModeControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/audi-buffer-mode', payload:'audi' });
flowValues.ess_wit_audi_discharge_status = { sessionOwned:false, active:false };
runWitEVControl(witEVGlobalContext, flowContext, witNode, {});
const audiPriorityBudgetKwh = flowValues.ess_wit_audi_discharge_status.safeDischargeBudgetKwh;
assert.strictEqual(flowValues.ess_wit_audi_discharge_status.batteryRechargeTargetSoc, 90);
assert(ecoBudgetKwh < normalBudgetKwh && normalBudgetKwh < audiPriorityBudgetKwh, 'Eco, Normaal en EV voorrang moeten oplopend meer energie voor de EV vrijgeven');

runWitEVBufferModeControl(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/audi-buffer-mode', payload:'normal' });

flowValues.ess_wit_audi_discharge_status = { sessionOwned:false, active:false };
witEVStates['sensor.energy_production_tomorrow'] = state(5, { unit_of_measurement:'kWh' });
witEVStates['sensor.energy_production_tomorrow_2'] = state(5, { unit_of_measurement:'kWh' });
witEVStates['sensor.energy_production_tomorrow_3'] = state(5, { unit_of_measurement:'kWh' });
assert.strictEqual(runWitEVControl(witEVGlobalContext, flowContext, witNode, {}), null, 'Onvoldoende zon voor volledig herladen mag nooit extra WIT-ontlading starten');
assert(flowValues.ess_wit_audi_discharge_status.status.includes('Geen veilig energieoverschot'));

flowValues.ess_wit_audi_discharge_status = { sessionOwned:true, active:true, powerPercent:20, leaseUntil:Date.now()+120000 };
witEVStates['select.growatt_grid_remote_power_control_enable'] = state('Enabled');
witEVOutput = runWitEVControl(witEVGlobalContext, flowContext, witNode, {});
assert.strictEqual(witEVOutput[3].payload.option, 'Disabled', 'Bij weggevallen prognosebudget moet alleen de eigen tijdelijke sessie direct stoppen');

flowValues.ess_wit_audi_discharge_status = { sessionOwned:false, active:false };
witEVStates['sensor.energy_production_tomorrow'] = state(14, { unit_of_measurement:'kWh' });
witEVStates['sensor.energy_production_tomorrow_2'] = state(12, { unit_of_measurement:'kWh' });
witEVStates['sensor.energy_production_tomorrow_3'] = state(10, { unit_of_measurement:'kWh' });
assert.strictEqual(runWitEVControl(witEVGlobalContext, flowContext, witNode, {}), null, 'Een externe actieve WIT-sessie mag nooit door de EV-regelaar worden overgenomen');
assert(flowValues.ess_wit_audi_discharge_status.status.includes('Externe WIT-bediening'));

witEVStates['select.growatt_grid_remote_power_control_enable'] = state('Disabled');
witEVStates['select.growatt_grid_vpp_export_limit_enable'] = state('Enabled');
witEVOutput = runWitEVControl(witEVGlobalContext, flowContext, witNode, {});
assert.strictEqual(witEVOutput[4].payload.option, 'Disabled', 'De exportbegrenzing moet vóór extra WIT-ontlading worden uitgezet');

const witGridChargeInject = flows.find((node) => node.id === 'esswitgrid_inj01');
const witGridChargeControl = flows.find((node) => node.id === 'esswitgrid_ctrl1');
const witGridChargeDurationAction = flows.find((node) => node.id === 'esswitgrid_time1');
const witGridChargePowerAction = flows.find((node) => node.id === 'esswitgrid_power');
const witGridChargeModeAction = flows.find((node) => node.id === 'esswitgrid_mode1');
const witGridChargeLivePowerAction = witRemoteLivePowerAction;
const witGridChargeRenewAction = witRemoteRenewAction;
assert(witGridChargeSettingsControl && witGridChargeInject && witGridChargeControl && witGridChargeDurationAction && witGridChargePowerAction && witGridChargeModeAction && witGridChargeLivePowerAction && witGridChargeRenewAction, 'WIT slim netladen ontbreekt');
assert.strictEqual(witGridChargeInject.repeat, '60', 'WIT-netladen moet iedere minuut opnieuw plannen');
assert.strictEqual(witGridChargeInject.once, true, 'WIT-netladen moet na een herstart automatisch starten');
assert(witGridChargeSettingsControl.initialize.includes("ess_wit_grid_charge_mode', 'auto") && witGridChargeSettingsControl.initialize.includes("ess_wit_grid_charge_target_soc', 80"), 'Na een herstart moet WIT-netladen Automatisch met 80% als doel starten');
assert(!witGridChargeControl.func.includes('departureTime') && !witGridChargeControl.func.includes('nextDeparture'), 'WIT-netladen mag geen vertrekdeadline vereisen');
assert(witGridChargeControl.func.includes('planningHorizonMs = 24 * 60 * 60 * 1000'), 'WIT-netladen moet steeds 24 uur vooruitkijken');
assert(witGridChargeControl.func.includes('chargeEfficiency = 0.90') && witGridChargeControl.func.includes('wearCostPerKwh'), 'Laadverlies en accuslijtage moeten in de prijsselectie meetellen');
assert(witGridChargeControl.func.includes('installationChargeLimitW = 12000') && witGridChargeControl.func.includes('directBatteryLimitW'), 'WIT-netladen moet de installatie- en BMS-vermogensgrens respecteren');
assert(witGridChargeControl.func.includes('growattTelemetryFresh') && witGridChargeControl.func.includes('socUsable'), 'WIT-netladen moet een onveranderde SOC via actuele Growatt-telemetrie valideren');
assert.strictEqual(witGridChargeControl.outputs, 5);
assert.deepStrictEqual(witGridChargeControl.wires, [[witGridChargeDurationAction.id],[witGridChargeLivePowerAction.id],[witGridChargeRenewAction.id],[witEVStopAction.id],[witExportToggleAction.id]], 'De WIT-netlaadregelaar moet starten, bijregelen, vernieuwen, stoppen en exportbegrenzing afzonderlijk aansturen');
assert.deepStrictEqual(witGridChargeDurationAction.entityId, ['number.growatt_grid_remote_power_control_charging_time']);
assert.deepStrictEqual(witGridChargePowerAction.entityId, ['number.growatt_vpp_power_rate']);
assert.deepStrictEqual(witGridChargeModeAction.entityId, ['select.growatt_mode_vpp']);
assert.deepStrictEqual(witGridChargeLivePowerAction.entityId, ['number.growatt_battery_remote_charge_and_discharge_power']);
assert.deepStrictEqual(witGridChargeRenewAction.entityId, ['select.growatt_grid_remote_power_control_enable']);
assert.deepStrictEqual(witGridChargeDurationAction.wires, [[witGridChargePowerAction.id]], 'De veilige looptijd moet vóór de VPP-laadsterkte worden ingesteld');
assert.deepStrictEqual(witGridChargePowerAction.wires, [[witGridChargeModeAction.id]], 'De VPP-laadsterkte moet vóór de atomaire Charge-opdracht worden ingesteld');
assert.deepStrictEqual(witGridChargeModeAction.wires, [[]], 'De atomaire Charge-opdracht mag geen verborgen vervolgopdracht starten');
assert.strictEqual(JSON.parse(witGridChargeModeAction.data).option, 'Charge');
const runWitGridChargeSettings = new Function('global', 'flow', 'node', 'msg', witGridChargeSettingsControl.func);
const runWitGridCharge = new Function('global', 'flow', 'node', 'msg', witGridChargeControl.func);
assert.strictEqual(runWitGridChargeSettings(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/grid-charge-mode', payload:'invalid' }), null, 'Onbekende WIT-netlaadstand moet worden geweigerd');
runWitGridChargeSettings(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/grid-charge-target-soc', payload:83 });
assert.strictEqual(flowValues.ess_wit_grid_charge_target_soc, 85, 'Gewenste WIT-SOC moet op veilige stappen van 5% worden afgerond');
runWitGridChargeSettings(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/grid-charge-target-soc', payload:80 });
runWitGridChargeSettings(globalContext, flowContext, { warn: () => undefined, status: () => undefined }, { topic:'ess/wit/grid-charge-mode', payload:'auto' });

const priceStart = Date.now() - 5 * 60 * 1000;
const quarter = 15 * 60 * 1000;
const priceSlots = [-0.20,0.20,0.30,0.40].map((allInPrice,index) => ({
    start:new Date(priceStart + index * quarter).toISOString(),
    end:new Date(priceStart + (index + 1) * quarter).toISOString(),
    marketPrice:allInPrice - 0.13,
    allInPrice
}));
const witGridStates = {
    'sensor.growatt_battery_battery_soc': state(35),
    'sensor.growatt_battery_battery_power': state(0, { unit_of_measurement:'W' }),
    'sensor.p1_meter_vermogen_fase_1': state(-500, { unit_of_measurement:'W' }),
    'sensor.p1_meter_vermogen_fase_2': state(-400, { unit_of_measurement:'W' }),
    'sensor.p1_meter_vermogen_fase_3': state(-300, { unit_of_measurement:'W' }),
    'select.growatt_mode_vpp': state('Hold', { options:['Hold','Charge','Discharge'] }),
    'number.growatt_vpp_power_rate': state(100, { unit_of_measurement:'%' }),
    'number.growatt_grid_remote_power_control_charging_time': state(2, { unit_of_measurement:'min' }),
    'select.growatt_grid_remote_power_control_enable': state('Disabled', { options:['Disabled','Enabled'] }),
    'number.growatt_battery_remote_charge_and_discharge_power': state(0, { unit_of_measurement:'%' }),
    'select.growatt_grid_vpp_export_limit_enable': state('Enabled', { options:['Disabled','Enabled'] }),
    'sensor.energy_production_tomorrow': state(2, { unit_of_measurement:'kWh' }),
    'sensor.energy_production_tomorrow_2': state(2, { unit_of_measurement:'kWh' }),
    'sensor.energy_production_tomorrow_3': state(2, { unit_of_measurement:'kWh' })
};
const witGridGlobalContext = { get: () => ({ homeAssistant: { states:witGridStates } }) };
flowValues.ess_wit_audi_buffer_mode = 'normal';
flowValues.ess_wit_audi_discharge_status = { sessionOwned:false, active:false };
flowValues.ess_wit_export_mode = 'auto';
flowValues.ess_audi_control_status = { selectedSlots:[] };
flowValues.ess_nordpool_forecast = priceSlots;
flowValues.ess_nordpool_forecast_meta = { updatedAt:new Date().toISOString() };
flowValues.ess_wit_grid_charge_status = { sessionOwned:false, active:false };
witGridStates['sensor.growatt_battery_battery_soc'].last_updated = new Date(Date.now() - 10 * 60 * 1000).toISOString();
witGridStates['sensor.growatt_battery_battery_power'].last_updated = new Date(Date.now() - 10 * 60 * 1000).toISOString();
assert.strictEqual(runWitGridCharge(witGridGlobalContext, flowContext, witNode, {}), null, 'Oude SOC én oude Growatt-telemetrie moeten WIT-bediening blokkeren');
assert(flowValues.ess_wit_grid_charge_status.status.includes('Growatt-telemetrie is te oud'));
witGridStates['sensor.growatt_battery_battery_power'] = state(0, { unit_of_measurement:'W' });
let witGridOutput = runWitGridCharge(witGridGlobalContext, flowContext, witNode, {});
assert.strictEqual(witGridOutput[4].payload.option, 'Disabled', 'Exportbegrenzing moet vóór echt WIT-netladen worden uitgeschakeld');
assert(flowValues.ess_wit_grid_charge_status.gridEnergyNeededKwh > 10, 'De planner moet huidige accu, woningreserve en zonneverwachting tot een netto energietekort combineren');
assert(flowValues.ess_wit_grid_charge_status.selectedSlots.length > 0, 'Een rendabel goedkoop kwartier moet worden gepland');
assert(flowValues.ess_wit_grid_charge_status.selectedSlots.every((slot) => slot.powerKw <= 12), 'Geen gepland laadkwartier mag boven 12 kW komen');

witGridStates['select.growatt_grid_vpp_export_limit_enable'] = state('Disabled', { options:['Disabled','Enabled'] });
witGridOutput = runWitGridCharge(witGridGlobalContext, flowContext, witNode, {});
assert(witGridOutput[0].payload.powerPercent >= 3 && witGridOutput[0].payload.powerPercent <= 67, 'Een veilige getimede VPP-laadsessie moet met een positief laadpercentage worden gestart');
assert.strictEqual(witGridOutput[0].payload.durationMinutes, 2, 'De WIT-opdracht moet vanzelf binnen twee minuten vervallen als de regeling uitvalt');
const requestedChargePercent = witGridOutput[0].payload.powerPercent;
assert(witGridOutput.slice(1).every((output) => output === null), 'Het starten van de VPP-laadsessie moet via één geordende actieketen lopen');
witGridStates['number.growatt_vpp_power_rate'] = state(requestedChargePercent, { unit_of_measurement:'%' });
witGridStates['number.growatt_battery_remote_charge_and_discharge_power'] = state(requestedChargePercent, { unit_of_measurement:'%' });
witGridStates['select.growatt_mode_vpp'] = state('Charge', { options:['Hold','Charge','Discharge'] });
witGridStates['select.growatt_grid_remote_power_control_enable'] = state('Enabled', { options:['Disabled','Enabled'] });
witGridOutput = runWitGridCharge(witGridGlobalContext, flowContext, witNode, {});
assert.strictEqual(witGridOutput[2].payload.option, 'Enabled', 'Een bevestigde eigen Charge-opdracht moet alleen de veilige lease vernieuwen');
assert.strictEqual(flowValues.ess_wit_grid_charge_status.active, true, 'Dashboardstatus moet pas na echte Charge-bevestiging actief worden');

witGridStates['number.growatt_battery_remote_charge_and_discharge_power'] = state(requestedChargePercent - 5, { unit_of_measurement:'%' });
witGridOutput = runWitGridCharge(witGridGlobalContext, flowContext, witNode, {});
assert.strictEqual(witGridOutput[1].payload.value, requestedChargePercent, 'Een lopende sessie moet het laadvermogen via het EEPROM-veilige remote register kunnen bijregelen');
witGridStates['number.growatt_battery_remote_charge_and_discharge_power'] = state(requestedChargePercent, { unit_of_measurement:'%' });

witGridStates['sensor.growatt_battery_battery_soc'] = state(80);
witGridOutput = runWitGridCharge(witGridGlobalContext, flowContext, witNode, {});
assert.strictEqual(witGridOutput[3].payload.option, 'Disabled', 'Na het bereiken van het doel moet de tijdelijke remote sessie worden beëindigd');
witGridStates['select.growatt_grid_remote_power_control_enable'] = state('Disabled', { options:['Disabled','Enabled'] });
assert.strictEqual(runWitGridCharge(witGridGlobalContext, flowContext, witNode, {}), null);
assert.strictEqual(flowValues.ess_wit_grid_charge_status.sessionOwned, false, 'Na het beëindigen van de lease moet de eigen sessie volledig vrijgegeven zijn en Load First weer gelden');

witGridStates['sensor.growatt_battery_battery_soc'] = state(35);
for (const id of ['sensor.energy_production_tomorrow','sensor.energy_production_tomorrow_2','sensor.energy_production_tomorrow_3']) {
    witGridStates[id] = state(20, { unit_of_measurement:'kWh' });
}
assert.strictEqual(runWitGridCharge(witGridGlobalContext, flowContext, witNode, {}), null, 'Als de zon het doel dekt mag automatisch netladen niet starten');
assert(flowValues.ess_wit_grid_charge_status.status.includes('dekken het doel'));

for (const id of ['sensor.energy_production_tomorrow','sensor.energy_production_tomorrow_2','sensor.energy_production_tomorrow_3']) {
    witGridStates[id] = state(2, { unit_of_measurement:'kWh' });
}
flowValues.ess_audi_control_status = { selectedSlots:[priceSlots[0]] };
runWitGridCharge(witGridGlobalContext, flowContext, witNode, {});
assert(flowValues.ess_wit_grid_charge_status.selectedSlots.every((slot) => new Date(slot.start).getTime() >= new Date(priceSlots[0].end).getTime()), 'Voor de EV gereserveerde kwartieren moeten uit de WIT-planning blijven');

const witHistoryInject = flows.find((node) => node.id === 'esswithist_inject');
const witHistoryPrepare = flows.find((node) => node.id === 'esswithist_prep1');
const witHistoryPublish = flows.find((node) => node.id === 'esswithist_api001');
assert(witHistoryInject && witHistoryPrepare && witHistoryPublish, 'Historische meetpunten voor de WIT EV-buffer ontbreken');
assert.strictEqual(witHistoryInject.repeat, '60', 'De WIT EV-bufferhistorie moet iedere minuut worden bijgewerkt');
assert.strictEqual(witHistoryInject.once, true, 'De historie moet na een herstart vanzelf weer starten');
assert.strictEqual(witHistoryPublish.type, 'ha-api');
assert.strictEqual(witHistoryPublish.protocol, 'http');
assert.strictEqual(witHistoryPublish.method, 'post');
assert.deepStrictEqual(witHistoryPrepare.wires, [[witHistoryPublish.id]]);
const runWitHistoryPrepare = new Function('global', 'flow', 'node', 'msg', witHistoryPrepare.func);
witEVStates['sensor.growatt_battery_battery_power'] = state(-3800);
witEVStates['sensor.growatt_battery_battery_soc'] = state(84.5);
witEVStates['sensor.p1_meter_vermogen'] = state(210);
witEVStates['sensor.ev_charger_power'] = state(4.1);
witEVStates['sensor.site_solar_energy_today'] = state(24, { unit_of_measurement:'kWh' });
witEVStates['sensor.growatt_load_load_energy_today'] = state(4.2, { unit_of_measurement:'kWh', state_class:'total_increasing' });
flowValues.ess_growatt_battery_power_scale = 1;
flowValues.ess_wit_audi_buffer_mode = 'normal';
const historyNow = new Date();
const historyTodayKey = [historyNow.getFullYear(), String(historyNow.getMonth() + 1).padStart(2, '0'), String(historyNow.getDate()).padStart(2, '0')].join('-');
const historyDayKey = (date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const historyYesterday = new Date(historyNow.getFullYear(), historyNow.getMonth(), historyNow.getDate() - 1);
const historyTwoDaysAgo = new Date(historyNow.getFullYear(), historyNow.getMonth(), historyNow.getDate() - 2);
const historyTomorrowSlotStart = new Date(historyNow.getFullYear(), historyNow.getMonth(), historyNow.getDate() + 1, 2, 0, 0, 0);
const historyTomorrowSlotEnd = new Date(historyTomorrowSlotStart.getTime() + 15 * 60 * 1000);
flowValues.ess_solar_forecast_audit = { tomorrowDate:historyTodayKey, tomorrowForecastKwh:30 };
flowValues.ess_house_consumption_learning = {
    recentDays:[{ date:historyDayKey(historyTwoDaysAgo), kwh:18 }],
    currentDate:historyDayKey(historyYesterday),
    currentValueKwh:22,
    coverageHours:24,
    lastBasePowerW:1800,
    lastSampleAt:new Date(historyNow.getTime() - 60 * 1000).toISOString()
};
flowValues.ess_audi_control_status = {
    selectedSlots:[{ start:historyTomorrowSlotStart.toISOString(), end:historyTomorrowSlotEnd.toISOString(), energy:4 }],
    requestedActive:true, actualCharging:true, chargingConfirmed:true, targetCurrent:16, chargerPowerW:10800,
    reportedEVSoc:62, estimatedEVSoc:62.4, audiSocSource:'geschat sinds EV-update', phaseMode:3,
    status:'Vertrekplanning actief', controlMode:'departure-plan', preflightReady:true, preflightIssues:[],
    recoveryStage:'idle', recoveryAttempts:0, startAttempts:2, fullRecoveries:1,
    failedChargingMinutes:3.5, plannedChargingMinutes:120, actualChargingMinutes:116.5
};
flowValues.ess_wit_audi_discharge_status = {
    active:true, sessionOwned:true, targetPowerW:3600, safeDischargeBudgetKwh:4.25,
    tomorrowForecastKwh:31.5, status:'Normaal · actief 20%', updatedAt:new Date().toISOString()
};
flowValues.ess_wit_grid_charge_status = {
    active:true, sessionOwned:true, mode:'auto', targetSoc:80, targetPowerW:7200,
    gridEnergyNeededKwh:8.5, expectedSolarChargeKwh:11.2, plannedCost:1.37,
    selectedSlots:[{ start:historyTomorrowSlotStart.toISOString(), end:historyTomorrowSlotEnd.toISOString(), energyKwh:3 }],
    status:'Automatisch netladen', updatedAt:new Date().toISOString()
};
const historyOutput = runWitHistoryPrepare(witEVGlobalContext, flowContext, { status: () => undefined }, {});
assert(Array.isArray(historyOutput) && Array.isArray(historyOutput[0]), 'Historiefunctie moet een reeks Home Assistant-updates maken');
assert.strictEqual(historyOutput[0].length, 31, 'Alle buffer-, netlaad-, EV-diagnose- en prognosewaarden moeten als afzonderlijke Home Assistant-sensor worden gepubliceerd');
const historyByPath = Object.fromEntries(historyOutput[0].map((message) => [message.payload.path, message.payload.data]));
assert.strictEqual(historyByPath['states/sensor.ess_audi_laadregeling_status'].state, 'Actief');
assert.strictEqual(historyByPath['states/sensor.ess_audi_laadregeling_status'].attributes.reden, 'Vertrekplanning actief');
assert.strictEqual(historyByPath['states/sensor.ess_audi_laadstroom_gevraagd'].state, 16);
assert.strictEqual(historyByPath['states/sensor.ess_audi_laadvermogen_werkelijk'].state, 10800);
assert.strictEqual(historyByPath['states/sensor.ess_audi_soc_geschat'].state, 62.4);
assert.strictEqual(historyByPath['states/sensor.ess_audi_startpogingen'].state, 2);
assert.strictEqual(historyByPath['states/sensor.ess_audi_fase'].state, 3);
assert.strictEqual(historyByPath['states/sensor.ess_audi_mislukte_laadminuten'].state, 3.5);
assert.strictEqual(historyByPath['states/sensor.ess_wit_audi_buffer_gevraagd_vermogen'].state, 3600);
assert.strictEqual(historyByPath['states/sensor.ess_wit_audi_buffer_werkelijk_accuvermogen'].state, 3800, 'Negatief Growatt-vermogen moet als positieve werkelijke ontlading worden opgeslagen');
assert.strictEqual(historyByPath['states/sensor.ess_wit_audi_buffer_audi_vermogen'].state, 4100);
assert.strictEqual(historyByPath['states/sensor.ess_wit_audi_buffer_netvermogen'].state, 210);
assert.strictEqual(historyByPath['states/sensor.ess_wit_audi_buffer_veilig_budget'].state, 4.25);
assert.strictEqual(historyByPath['states/sensor.ess_wit_audi_buffer_zonverwachting_morgen'].state, 31.5);
assert.strictEqual(historyByPath['states/sensor.ess_wit_audi_buffer_accu_soc'].state, 84.5);
assert.strictEqual(historyByPath['states/sensor.ess_wit_audi_buffer_profiel'].state, 'Normaal');
assert.strictEqual(historyByPath['states/sensor.ess_wit_audi_buffer_status'].state, 'Actief');
assert.strictEqual(historyByPath['states/sensor.ess_wit_audi_buffer_status'].attributes.reden, 'Normaal · actief 20%');
assert.strictEqual(historyByPath['states/sensor.ess_wit_netladen_gevraagd_vermogen'].state, 7200);
assert.strictEqual(historyByPath['states/sensor.ess_wit_netladen_werkelijk_accuvermogen'].state, 0, 'Negatief accuvermogen mag niet als werkelijk netladen tellen');
assert.strictEqual(historyByPath['states/sensor.ess_wit_netladen_netenergie_nodig'].state, 8.5);
assert.strictEqual(historyByPath['states/sensor.ess_wit_netladen_zonverwachting'].state, 11.2);
assert.strictEqual(historyByPath['states/sensor.ess_wit_netladen_geplande_kosten'].state, 1.37);
assert.strictEqual(historyByPath['states/sensor.ess_wit_netladen_status'].state, 'Actief');
assert.strictEqual(historyByPath['states/sensor.ess_wit_netladen_status'].attributes.reden, 'Automatisch netladen');
assert.strictEqual(historyByPath['states/sensor.ess_woningverbruik_basis_verwacht_morgen'].state, 20, 'Woningbasis moet de mediaan van afgeronde dagen gebruiken');
assert.strictEqual(historyByPath['states/sensor.ess_woningverbruik_basis_verwacht_morgen'].attributes.recent_days.length, 2, 'Een afgeronde dag moet aan de leerhistorie worden toegevoegd');
assert.strictEqual(historyByPath['states/sensor.ess_woningverbruik_basis_verwacht_morgen'].attributes.growatt_load_energy_today_kwh, 4.2, 'De onzekere Growatt Load-dagteller moet alleen als vergelijking worden bewaard');
assert(historyByPath['states/sensor.ess_woningverbruik_basis_verwacht_morgen'].attributes.meetmethode.includes('totale dashboard-woningbalans'), 'De woningbasis mag niet rechtstreeks uit de onzekere Growatt Load-dagteller komen');
assert.strictEqual(historyByPath['states/sensor.ess_audi_gepland_verbruik_morgen'].state, 4, 'Geplande EV-laadenergie van morgen ontbreekt');
assert.strictEqual(historyByPath['states/sensor.ess_wit_gepland_verbruik_morgen'].state, 3, 'Geplande WIT-laadenergie van morgen ontbreekt');
assert.strictEqual(historyByPath['states/sensor.ess_totaal_verbruik_verwacht_morgen'].state, 27, 'Totaal morgen moet woningbasis, EV en WIT optellen');
assert.strictEqual(historyByPath['states/sensor.ess_zon_referentieverwachting_vandaag'].state, 30, 'De laatste verwachting van de vorige dag moet als vaste dagreferentie gelden');
assert.strictEqual(historyByPath['states/sensor.ess_zonproductie_werkelijk_vandaag'].state, 24);
assert.strictEqual(historyByPath['states/sensor.ess_zonverwachting_afwijking_vandaag'].state, -6);
assert.strictEqual(historyByPath['states/sensor.ess_zonverwachting_realisatie_vandaag'].state, 80);
assert.strictEqual(historyByPath['states/sensor.ess_zonverwachting_correctiefactor_vandaag'].state, 0.8);
assert.strictEqual(historyByPath['states/sensor.ess_zon_referentieverwachting_vandaag'].attributes.referentiedatum, historyTodayKey);
for (const entityId of [
    'sensor.ess_audi_laadstroom_gevraagd', 'sensor.ess_audi_laadvermogen_werkelijk',
    'sensor.ess_audi_soc_geschat', 'sensor.ess_audi_startpogingen', 'sensor.ess_audi_fase',
    'sensor.ess_audi_mislukte_laadminuten',
    'sensor.ess_wit_audi_buffer_gevraagd_vermogen', 'sensor.ess_wit_audi_buffer_werkelijk_accuvermogen',
    'sensor.ess_wit_audi_buffer_audi_vermogen', 'sensor.ess_wit_audi_buffer_netvermogen',
    'sensor.ess_wit_audi_buffer_veilig_budget', 'sensor.ess_wit_audi_buffer_zonverwachting_morgen',
    'sensor.ess_wit_audi_buffer_accu_soc', 'sensor.ess_zon_referentieverwachting_vandaag',
    'sensor.ess_wit_netladen_gevraagd_vermogen', 'sensor.ess_wit_netladen_werkelijk_accuvermogen',
    'sensor.ess_wit_netladen_netenergie_nodig', 'sensor.ess_wit_netladen_zonverwachting',
    'sensor.ess_wit_netladen_geplande_kosten',
    'sensor.ess_woningverbruik_basis_verwacht_morgen', 'sensor.ess_audi_gepland_verbruik_morgen',
    'sensor.ess_wit_gepland_verbruik_morgen', 'sensor.ess_totaal_verbruik_verwacht_morgen',
    'sensor.ess_zonproductie_werkelijk_vandaag', 'sensor.ess_zonverwachting_afwijking_vandaag',
    'sensor.ess_zonverwachting_realisatie_vandaag', 'sensor.ess_zonverwachting_correctiefactor_vandaag'
]) {
    assert.strictEqual(historyByPath['states/' + entityId].attributes.state_class, 'measurement', `${entityId} mist metadata voor historische statistieken`);
}

const editorGroups = flows.filter((item) => item.type === 'group' && item.id.startsWith('esseditor_'));
assert.strictEqual(editorGroups.length, 9, 'De Node-RED-editor moet negen duidelijke functiegroepen tonen');
assert(editorGroups.every((group) => group.style.label === true && group.nodes.length > 0), 'Iedere editorgroep moet een zichtbaar label en nodes hebben');
for (const group of editorGroups) {
    for (const nodeId of group.nodes) {
        assert.strictEqual(flows.find((item) => item.id === nodeId).g, group.id, `Node ${nodeId} staat niet in de bedoelde editorgroep`);
    }
}
const pageTemplatePositions = [ui, ...Object.values(detailTemplates)].map((item) => `${item.x},${item.y}`);
assert.strictEqual(new Set(pageTemplatePositions).size, pageTemplatePositions.length, 'Dashboardpagina’s mogen in de editor niet meer over elkaar liggen');
assert(!flows.some((item) => item.id.startsWith('esscltemp_') || item.id.startsWith('essclmode_')), 'De oude achttien klimaatacties moeten uit de editor verdwijnen');

const dashboardUi = flows.find((node) => node.id === 'ess000000000004');
const dashboardPage = flows.find((node) => node.id === 'ess000000000006');
assert(dashboardUi.format.includes('Samsung Galaxy Tab A8'), 'Tab A8-stijlen ontbreken op het hoofddashboard');
assert(dashboardUi.format.includes('min-height:44px'), 'Dashboardbediening moet een ruim aanraakdoel hebben');
assert(dashboardUi.format.includes('min-height:calc(100dvh - 12px)'), 'Dashboard moet zonder standaardbalk de beschikbare schermhoogte vullen');
assert.strictEqual(dashboardUi.height, '13', 'Het hoofddashboard moet schermvullend zijn op de tablet');
assert(dashboardPage.breakpoints.some((breakpoint) => breakpoint.name === 'Tab A8' && breakpoint.cols === '12'), 'De Tab A8 moet een raster van twaalf kolommen gebruiken');
const dashboardBase = flows.find((node) => node.id === 'ess000000000007');
assert.strictEqual(dashboardBase.headerContent, 'none', 'De standaard paginatitel moet verborgen zijn');
assert.strictEqual(dashboardBase.titleBarStyle, 'hidden', 'De bovenste Node-RED-dashboardbalk moet verborgen zijn');
assert(!dashboardUi.format.includes('Alles wat nu belangrijk is'), 'Vullingstekst hoort niet op het overzicht');
assert(!dashboardUi.format.includes('ENERGIE MANAGEMENT SYSTEEM'), 'Overbodige uitlegtekst hoort niet boven de dashboardnaam');
assert(Object.values(detailTemplates).every((template) => !template.format.includes('SMART ESS · ESS')), 'Detailpagina’s mogen geen herhaalde vultekst boven hun titel tonen');
assert(dashboardUi.format.includes('VOLGEND LAADMOMENT'), 'Het overzicht moet de laadplanning samenvatten');
assert(dashboardUi.format.includes('grid.importToday') && dashboardUi.format.includes('grid.exportToday'), 'Het overzicht moet de werkelijke net-dagtotalen tonen');
assert(detailTemplates.ev.format.includes('Laadplanning'), 'De autopagina moet de laadplanning tonen');
assert(detailTemplates.ev.format.includes('ESS slim laden'), 'De autopagina moet de slimme laadbediening tonen');
assert(detailTemplates.ev.format.includes('Direct naar 100%'), 'De autopagina moet de directe laadknop tonen');

console.log('Node-RED-flow, dashboardscript en Home Assistant-sensormapping: OK');
