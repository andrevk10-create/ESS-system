const assert = require('node:assert/strict');
const flows = require('../flows.json');
const {resolveNasMappings, dashboardHealth, dashboardAlerts} = require('../scripts/lib/dashboard-diagnostics');
const state = (value, unit, attributes = {}) => ({state:String(value), attributes:{unit_of_measurement:unit, ...attributes}, last_updated:new Date().toISOString()});
const roles = {
    cpu:'sensor.nas_cpu_gebruik_totaal', memory:'sensor.nas_geheugengebruik_fysiek',
    disk:'sensor.nas_drive_2_status', diskTemp:'sensor.nas_drive_2_temperatuur',
    volume:'sensor.nas_volume_1_status', percent:'sensor.nas_volume_1_volume_gebruikt'
};
const states = {
    'sensor.lab_nas_cpu_total':state(15, '%'),
    'sensor.lab_nas_memory_usage_real':state(52, '%'),
    'sensor.lab_nas_memory_available_real':state(800, 'MB'),
    'sensor.lab_nas_memory_total_real':state(1600, 'MB'),
    'sensor.lab_nas_memory_usage_swap':state(2, '%'),
    'sensor.lab_nas_drive_1_status':state('normal'),
    'sensor.lab_nas_drive_2_status':state('normal'),
    'sensor.lab_nas_drive_1_temperature':state(36, '°C'),
    'sensor.lab_nas_drive_2_temperature':state(29, '°C'),
    'sensor.lab_nas_volume_1_status':state('normal'),
    'sensor.lab_nas_volume_1_used_space':state(0.2, 'TB'),
    'sensor.lab_nas_volume_1_volume_used':state(11.3, '%'),
    'sensor.lab_nas_volume_2_volume_used':state(90, '%'),
    'sensor.lab_nas_backup_memory_usage_real':state(80, '%'),
    'binary_sensor.lab_nas_drive_2_below_min_remaining_life':state('off'),
    'binary_sensor.lab_nas_drive_2_exceeded_max_bad_sectors':state('on')
};
const mapping = {[roles.cpu]:'sensor.lab_nas_cpu_total', [roles.disk]:'sensor.lab_nas_drive_2_status', [roles.volume]:'sensor.lab_nas_volume_1_status'};
const snapshot = JSON.stringify(mapping);
let found = resolveNasMappings(states, mapping, {requireAnchor:true, displayOnly:true});
assert.deepEqual(found, {
    [roles.memory]:'sensor.lab_nas_memory_usage_real',
    [roles.diskTemp]:'sensor.lab_nas_drive_2_temperature',
    [roles.percent]:'sensor.lab_nas_volume_1_volume_used'
});
assert.equal(JSON.stringify(mapping), snapshot, 'Read-only fallbacks must not change saved choices');
assert.deepEqual(resolveNasMappings(states, {}, {requireAnchor:true, displayOnly:true}), {}, 'No spontaneous NAS selection on startup');
assert.deepEqual(resolveNasMappings(states, {...mapping, [roles.cpu]:'sensor.missing_cpu'}, {requireAnchor:true}), {}, 'Missing selected NAS must not switch to a different NAS');
assert(!resolveNasMappings(states, {...mapping, [roles.memory]:'sensor.missing_memory'})[roles.memory], 'A saved but missing selection must survive');
assert(!resolveNasMappings({...states, 'sensor.lab_nas_memory_physical_usage':state(50,'%')}, mapping)[roles.memory], 'Ambiguous same-NAS metrics must remain unselected');
assert(!resolveNasMappings({...states, 'sensor.other_nas_cpu_total':state(8,'%')}, {})[roles.cpu], 'Multiple NAS devices require user selection');
assert.equal(resolveNasMappings({...states, 'sensor.lab_nas_cpu_total':state('unavailable','%')}, mapping)[roles.memory], found[roles.memory], 'Offline anchor retains its identity');
assert.equal(resolveNasMappings(states, {...mapping, [roles.percent]:roles.percent})[roles.percent], found[roles.percent], 'Missing canonical placeholders can be filled');
const warnings = resolveNasMappings(states, mapping);
assert.equal(warnings['binary_sensor.nas_drive_2_maximum_slechte_sectoren_overschreden'], 'binary_sensor.lab_nas_drive_2_exceeded_max_bad_sectors');
assert.equal(warnings['binary_sensor.nas_drive_2_onder_de_minimale_resterende_levensduur'], 'binary_sensor.lab_nas_drive_2_below_min_remaining_life');

const configNode = flows.find(item => item.id === 'essconfig_control');
const runConfig = (states, config, topic) => {
    const data = {ess_system_config:config};
    const output = new Function('global','flow','node','msg',configNode.func)(
        {get:()=>({homeAssistant:{states}})}, {get:key=>data[key],set:(key,value)=>data[key]=value}, {status(){},warn(){}}, {topic,payload:config});
    return {data,output};
};
const modules = {energy:false,battery:false,inverter:false,ev:false,loads:false,lighting:false,climate:true,nas:false};
const saved = {version:2,modules,specs:{},entities:{...mapping, 'climate.heating_zone_2':'climate.lab_heat_b'}};
const climateStates = {
    'climate.lab_heat_a':state('unavailable', null, {hvac_modes:['heat','auto'],friendly_name:'Tado zone A'}),
    'climate.lab_heat_b':state('heat', null, {hvac_modes:['heat','auto'],friendly_name:'Tado zone B'}),
    'climate.lab_heat_c':state('heat', null, {hvac_modes:['heat','auto'],friendly_name:'Tado zone C'})
};
const discovered = runConfig({...states,...climateStates}, saved, 'ess/config/discover');
assert.equal(discovered.output[1], null, 'Discovery remains a proposal, not a disk write');
const discoveredMap = discovered.data.ess_system_config.entities;
assert.equal(discoveredMap['climate.heating_zone_2'], 'climate.lab_heat_b');
assert.equal(discoveredMap['climate.heating_zone_1'], 'climate.lab_heat_a');
assert.equal(discoveredMap['climate.heating_zone_3'], 'climate.lab_heat_c');
assert.equal(discoveredMap[roles.memory], found[roles.memory], 'Existing CPU must anchor explicit discovery too');
assert.equal(discovered.data.ess_system_config_status.valid, true, 'Heating-only installation needs no airco');
assert(discovered.data.ess_system_config_status.unavailable.includes('climate.heating_zone_1'));
const restored = runConfig(states, saved, 'ess/config/restore');
assert.equal(restored.output[1], null, 'Restoring a current profile must not rewrite it');
assert.equal(restored.data.ess_system_config.entities['climate.heating_zone_2'], 'climate.lab_heat_b');
const absentCustom = runConfig({...states,...climateStates,[roles.memory]:state(99,'%'),'climate.heating_zone_2':climateStates['climate.lab_heat_c']},
    {...saved,entities:{...saved.entities,[roles.memory]:'sensor.missing_memory','climate.heating_zone_2':'climate.missing_zone'}}, 'ess/config/discover');
assert.equal(absentCustom.data.ess_system_config.entities[roles.memory], 'sensor.missing_memory');
assert.equal(absentCustom.data.ess_system_config.entities['climate.heating_zone_2'], 'climate.missing_zone', 'Canonical fallback must not overwrite a custom climate selection');

const mapper = flows.find(item => item.id === 'ess00000000000a');
const runMapper = new Function('global','flow','node','msg',mapper.func);
const currentConfig = {...saved,modules:{...modules,nas:true},entities:{...mapping,'climate.heating_zone_1':'climate.lab_heat_a'}};
const values = {ess_system_config:currentConfig};
const original = JSON.stringify(currentConfig);
const mapperFlow = {get:key=>values[key],set:(key,value)=>values[key]=value};
runMapper({get:()=>({homeAssistant:{states:{...states,...climateStates}}})},mapperFlow,{status(){}},{});
let dashboard = values.ess_dashboard_live;
assert.equal(dashboard.nas.memory, 52);
assert.equal(dashboard.nas.drive.temperature, 29);
assert.equal(dashboard.nas.volume.usedPercent, 11.3);
assert.equal(JSON.stringify(currentConfig), original, 'Dashboard must not change profile or actuator selections');
assert.equal(dashboard.climate.aircos[0].status, 'Niet gekoppeld · Configuratie');
assert.equal(dashboard.climate.aircos[0].available, false);
assert.equal(dashboard.climate.tado[0].configured, true);
assert.equal(dashboard.climate.tado[0].available, false);
assert.equal(dashboard.climate.unmappedCount, 2);
runMapper({get:()=>({homeAssistant:{states:{}}})},mapperFlow,{status(){}},{});
assert.equal(values.ess_dashboard_live.nas.memory, null, 'HA disconnect must not retain stale fallback values');
runMapper({get:()=>({homeAssistant:{states}})},mapperFlow,{status(){}},{});
assert.equal(values.ess_dashboard_live.nas.memory, 52, 'Read-only fallback recovers without a reset or save');

const healthModel = {
    grid:{power:0},solar:{power:0},battery:{soc:60},alarms:[],
    wit:{runtime:{p1Fresh:true,pricesFresh:true,level:'ok',status:'Normale regeling'}},
    audiSmart:{enabled:true,scheduleComplete:true},
    climate:{aircos:[{configured:true,available:true,name:'Airco'}],tado:[{configured:true,available:false,name:'Verwarming'}],heatPump:{configured:false}},
    nas:{available:true,ok:true}
};
let checks = dashboardHealth(healthModel, {}, false, '12:00');
assert.match(checks.find(item=>item.key==='climate').detail, /1 van 2 gekoppelde zones/);
assert.match(dashboardAlerts(healthModel, checks, {})[0].text, /Klimaat/);
assert.equal(dashboardHealth(healthModel, {}, true, '12:00')[0].level, 'error', 'Stale dashboard must not downgrade to a P1 warning');
assert.equal(dashboardAlerts({...healthModel,alarms:[{level:'warning',text:'test'},{level:'warning',text:'test'}]}, [], {}).length, 1);
const witWarning = {...healthModel, alarms:[{level:'warning',text:'Niet bevestigd'}],wit:{runtime:{p1Fresh:true,pricesFresh:true,level:'warn',status:'Niet bevestigd'}}};
assert.equal(dashboardAlerts(witWarning,dashboardHealth(witWarning,{climate:false,nas:false},false,''),{}).length, 1, 'Identical WIT readback warning should not be repeated');
assert(!dashboardAlerts({alarms:[{module:'nas',level:'error',text:'NAS offline'}]},[],{nas:false}).length);
checks = dashboardHealth(healthModel,{energy:false,battery:false,climate:false,nas:false,ev:false},false,'');
assert.deepEqual(checks.map(item=>item.key), ['data'], 'Disabled modules cannot create faults');
healthModel.climate.tado[0].available = true;
assert.deepEqual(dashboardAlerts(healthModel,dashboardHealth(healthModel,{},false,''),{}), [], 'Healthy configured system can show no warnings');

// Exercise the emitted Vue component, not only the source helpers.
for (const template of flows.filter(item=>item.type==='ui-template' && item.format && item.format.includes('activeAlerts()'))) {
    const script = template.format.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
    const component = new Function(script.replace('export default','return'))();
    const context = {d:{...healthModel,climate:dashboard.climate},modules:{},stale:false,updated:'12:00'};
    context.healthChecks = component.computed.healthChecks.call(context);
    assert(component.computed.activeAlerts.call(context).some(item=>item.text.includes('Klimaat')));
    assert(!template.format.includes('in d.alarms"'));
    assert(!template.format.includes('(d.alarms||[]).length'));
}
console.log('Dashboard regression: NAS identity/units, offline climate, profile restore, read-only recovery and consistent alerts OK');
