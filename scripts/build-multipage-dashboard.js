const fs = require('fs');
const path = require('path');

const flowPath = path.join(__dirname, '..', 'flows.json');
const flows = JSON.parse(fs.readFileSync(flowPath, 'utf8'));

function sanitizePublicFlowText(input) {
  return String(input);
}

for (let index = 0; index < flows.length; index += 1) {
  flows[index] = JSON.parse(sanitizePublicFlowText(JSON.stringify(flows[index])));
}

const FLOW_ID = 'ess000000000001';
const BASE_ID = 'ess000000000007';
const THEME_ID = 'ess000000000008';
const OVERVIEW_PAGE_ID = 'ess000000000006';
const OVERVIEW_GROUP_ID = 'ess000000000005';
const OVERVIEW_TEMPLATE_ID = 'ess000000000004';
const SETTINGS_TEMPLATE_ID = 'ess000000000011';
const MODEL_ID = 'ess000000000003';
const MAPPER_ID = 'ess00000000000a';
const CONTROL_ID = 'ess00000000000c';

const DEFAULT_SYSTEM_CONFIG = {
  version: 1,
  siteName: 'Smart ESS',
  modules: {
    energy: true,
    battery: true,
    inverter: true,
    ev: true,
    loads: false,
    lighting: false,
    climate: false,
    nas: false
  },
  specs: {
    phases: 3,
    voltage: 230,
    mainFuseA: 25,
    batteryCapacityKwh: 30,
    inverterRatedPowerKw: 18,
    maximumBatteryPowerKw: 8,
    evBatteryCapacityKwh: 86,
    evMaximumCurrentA: 25,
    evGridChargePowerKw: 10,
    gridImportBufferW: 200
  },
  entities: {
    'sensor.p1_meter_vermogen':'sensor.p1_meter_vermogen',
    'sensor.p1_meter_vermogen_fase_1':'sensor.p1_meter_vermogen_fase_1',
    'sensor.p1_meter_vermogen_fase_2':'sensor.p1_meter_vermogen_fase_2',
    'sensor.p1_meter_vermogen_fase_3':'sensor.p1_meter_vermogen_fase_3',
    'sensor.p1_meter_energie_import':'sensor.p1_meter_energie_import',
    'sensor.p1_meter_energie_export':'sensor.p1_meter_energie_export',
    'sensor.growatt_battery_battery_soc':'sensor.growatt_battery_battery_soc',
    'sensor.growatt_battery_battery_power':'sensor.growatt_battery_battery_power',
    'sensor.growatt_load_house_consumption':'sensor.growatt_load_house_consumption',
    'sensor.growatt_solar_solar_total_power':'sensor.growatt_solar_solar_total_power',
    'sensor.growatt_solar_system_output_power':'sensor.growatt_solar_system_output_power',
    'sensor.growatt_solar_energy_today':'sensor.growatt_solar_energy_today',
    'sensor.growatt_grid_grid_power':'sensor.growatt_grid_grid_power',
    'sensor.ev_charger_status':'sensor.ev_charger_status',
    'sensor.ev_charger_power':'sensor.ev_charger_power',
    'sensor.ev_charger_current':'sensor.ev_charger_current',
    'sensor.ev_charger_energy_today':'sensor.ev_charger_energy_today',
    'binary_sensor.ev_charger_online':'binary_sensor.ev_charger_online',
    'sensor.ev_state_of_charge':'sensor.ev_state_of_charge',
    'sensor.ev_target_state_of_charge':'sensor.ev_target_state_of_charge',
    'device_tracker.ev_position':'device_tracker.ev_position',
    'lock.ev':'lock.ev',
    'sensor.ev_temperature':'sensor.ev_temperature',
    'sensor.ev_charger_2_status':'sensor.ev_charger_2_status',
    'sensor.ev_charger_2_power':'sensor.ev_charger_2_power',
    'sensor.ev_charger_2_energy_today':'sensor.ev_charger_2_energy_today',
    'sensor.energy_production_today':'sensor.energy_production_today',
    'sensor.energy_production_today_2':'sensor.energy_production_today_2',
    'sensor.energy_production_today_3':'sensor.energy_production_today_3',
    'sensor.energy_production_tomorrow':'sensor.energy_production_tomorrow',
    'sensor.energy_production_tomorrow_2':'sensor.energy_production_tomorrow_2',
    'sensor.energy_production_tomorrow_3':'sensor.energy_production_tomorrow_3',
    'sensor.nord_pool_nl_huidige_prijs':'sensor.nord_pool_nl_huidige_prijs',
    'select.growatt_grid_control_authority':'select.growatt_grid_control_authority',
    'select.growatt_grid_vpp_export_limit_enable':'select.growatt_grid_vpp_export_limit_enable',
    'number.growatt_grid_vpp_export_limit_power_rate':'number.growatt_grid_vpp_export_limit_power_rate',
    'select.growatt_grid_remote_power_control_enable':'select.growatt_grid_remote_power_control_enable',
    'number.growatt_grid_remote_power_control_charging_time':'number.growatt_grid_remote_power_control_charging_time',
    'number.growatt_vpp_power_rate':'number.growatt_vpp_power_rate',
    'select.growatt_mode_vpp':'select.growatt_mode_vpp',
    'number.growatt_battery_remote_charge_and_discharge_power':'number.growatt_battery_remote_charge_and_discharge_power',
    'select.growatt_work_mode':'select.growatt_work_mode',
    'number.growatt_discharge_cutoff_soc':'number.growatt_discharge_cutoff_soc',
    'number.growatt_charge_cutoff_soc':'number.growatt_charge_cutoff_soc',
    'sensor.pv_array_1_power':'sensor.pv_array_1_power',
    'sensor.pv_array_2_power':'sensor.pv_array_2_power',
    'sensor.pv_array_3_power':'sensor.pv_array_3_power',
    'sensor.pv_array_1_energy_today':'sensor.pv_array_1_energy_today',
    'sensor.pv_array_2_energy_today':'sensor.pv_array_2_energy_today',
    'sensor.pv_array_3_energy_today':'sensor.pv_array_3_energy_today',
    'sensor.site_solar_energy_today':'sensor.site_solar_energy_today',
    'switch.flex_load_1':'switch.flex_load_1',
    'sensor.flex_load_1_power':'sensor.flex_load_1_power',
    'sensor.flex_load_2_power':'sensor.flex_load_2_power',
    'sensor.flex_load_3_power':'sensor.flex_load_3_power',
    'sensor.flex_load_4_power':'sensor.flex_load_4_power',
    'sensor.flex_load_5_power':'sensor.flex_load_5_power',
    'sensor.flex_load_6_power':'sensor.flex_load_6_power',
    'sensor.flex_load_7_power':'sensor.flex_load_7_power',
    'weather.home':'weather.home',
    'sensor.outdoor_temperature':'sensor.outdoor_temperature',
    'climate.cooling_zone_1':'climate.cooling_zone_1',
    'climate.cooling_zone_2':'climate.cooling_zone_2',
    'climate.cooling_zone_3':'climate.cooling_zone_3',
    'climate.cooling_zone_4':'climate.cooling_zone_4',
    'sensor.cooling_zone_1_temperature':'sensor.cooling_zone_1_temperature',
    'sensor.cooling_zone_2_temperature':'sensor.cooling_zone_2_temperature',
    'sensor.cooling_zone_3_temperature':'sensor.cooling_zone_3_temperature',
    'sensor.cooling_zone_4_temperature':'sensor.cooling_zone_4_temperature',
    'climate.heating_zone_1':'climate.heating_zone_1',
    'climate.heating_zone_2':'climate.heating_zone_2',
    'climate.heating_zone_3':'climate.heating_zone_3',
    'climate.heat_pump':'climate.heat_pump',
    'water_heater.domestic_hot_water':'water_heater.domestic_hot_water',
    'light.zone_1':'light.zone_1',
    'light.zone_2':'light.zone_2',
    'light.zone_3':'light.zone_3',
    'light.zone_4':'light.zone_4',
    'light.zone_5':'light.zone_5',
    'light.zone_6':'light.zone_6',
    'light.zone_7':'light.zone_7',
    'light.zone_8':'light.zone_8',
    'sensor.nas_cpu_gebruik_totaal':'sensor.nas_cpu_gebruik_totaal',
    'sensor.nas_geheugengebruik_fysiek':'sensor.nas_geheugengebruik_fysiek',
    'sensor.nas_temperatuur':'sensor.nas_temperatuur',
    'sensor.nas_download_doorvoer':'sensor.nas_download_doorvoer',
    'sensor.nas_upload_doorvoer':'sensor.nas_upload_doorvoer',
    'sensor.nas_drive_2_status':'sensor.nas_drive_2_status',
    'sensor.nas_drive_2_temperatuur':'sensor.nas_drive_2_temperatuur',
    'sensor.nas_volume_1_status':'sensor.nas_volume_1_status',
    'sensor.nas_volume_1_gebruikte_ruimte':'sensor.nas_volume_1_gebruikte_ruimte',
    'sensor.nas_volume_1_volume_gebruikt':'sensor.nas_volume_1_volume_gebruikt',
    'binary_sensor.nas_drive_2_maximum_slechte_sectoren_overschreden':'binary_sensor.nas_drive_2_maximum_slechte_sectoren_overschreden',
    'binary_sensor.nas_drive_2_onder_de_minimale_resterende_levensduur':'binary_sensor.nas_drive_2_onder_de_minimale_resterende_levensduur',
    'binary_sensor.nas_beveiligingsstatus':'binary_sensor.nas_beveiligingsstatus',
    'update.nas_dsm_update':'update.nas_dsm_update',
    'select.nas_fan_speed_mode':'select.nas_fan_speed_mode'
  }
};

const SYSTEM_CONFIG_PATH = '/config/node-red/ess-system-config.json';
const SYSTEM_CONFIG_BACKUP_PATH = '/config/node-red/ess-system-config.backup.json';

const ids = {
  energyPage: 'esspage_energy01', energyGroup: 'essgroup_energy1', energyTemplate: 'esstpl_energy001',
  batteryPage: 'esspage_battery1', batteryGroup: 'essgroup_battery', batteryTemplate: 'esstpl_battery01',
  evPage: 'esspage_ev000001', evGroup: 'essgroup_ev00001', evTemplate: 'esstpl_ev0000001',
  loadsPage: 'esspage_loads001', loadsGroup: 'essgroup_loads01', loadsTemplate: 'esstpl_loads0001',
  lightingPage: 'esspage_lighting', lightingGroup: 'essgroup_lights1', lightingTemplate: 'esstpl_lights001',
  climatePage: 'esspage_climate1', climateGroup: 'essgroup_climate', climateTemplate: 'esstpl_climate01',
  systemPage: 'esspage_system01', systemGroup: 'essgroup_system1', systemTemplate: 'esstpl_system001',
  configPage: 'esspage_config01', configGroup: 'essgroup_config1', configTemplate: 'esstpl_config001',
  configControl: 'essconfig_control', configReadInject: 'essconfig_readin', configFileRead: 'essconfig_fileread',
  configRestore: 'essconfig_restore', configFileWrite: 'essconfig_filewrite', configReadDelay:'essconfig_readdelay',
  configBackupRead:'essconfig_bakread', configBackupWrite:'essconfig_bakwrite',
  climateDevice: 'essaudi_device001', vehicleDevice: 'essaudi_device002',
  climateAction: 'essaudi_climate01', vehicleAction: 'essaudi_vehicle01',
  audiDefaultsInject: 'essaudi_defaults_inj', audiHaEvents: 'essaudi_ha_events', audiDefaults: 'essaudi_defaults1',
  audiRecoveryDelay: 'essaudi_recovery_delay', audiRecoveryNotification: 'essaudi_recovery_note',
  loadsControl: 'essloads_control1', compressorAction: 'essloads_comp001',
  coolingZone2Action: 'essloads_airco01', coolingZone3Action: 'essloads_airco02',
  climateControl: 'essclimate_ctrl1',
  lightingControl: 'esslights_ctrl01', lightingTurnOnAction: 'esslights_on001', lightingTurnOffAction: 'esslights_off01',
  p1HistoryInject: 'essp1hist_inject', p1HistoryPrepare: 'essp1hist_prepare', p1History: 'essp1hist_get001', p1HistoryStore: 'essp1hist_store1',
  p1HistoryCatch: 'essp1hist_catch1',
  witExportInject: 'esswitexport_inj1', witExportModeControl: 'esswitexport_mode', witExportControl: 'esswitexport_ctrl',
  witExportAuthorityAction: 'esswitexport_auth', witExportRateAction: 'esswitexport_rate', witExportToggleAction: 'esswitexport_sel1',
  witEVInject: 'esswitaudi_inj01', witEVControl: 'esswitaudi_ctrl1', witEVDurationAction: 'esswitaudi_time1',
  witEVRateAction: 'esswitaudi_rate1', witEVModeAction: 'esswitaudi_mode1', witEVStopAction: 'esswitaudi_stop1',
  witEVBufferModeControl: 'esswitaudi_profile',
  witGridChargeInject: 'esswitgrid_inj01', witGridChargeSettingsControl: 'esswitgrid_set01', witGridChargeControl: 'esswitgrid_ctrl1',
  witGridChargeDurationAction: 'esswitgrid_time1', witGridChargePowerAction: 'esswitgrid_power', witGridChargeModeAction: 'esswitgrid_mode1',
  witGridChargeLivePowerAction: 'esswitgrid_live1', witGridChargeRenewAction: 'esswitgrid_renew',
  witHistoryInject: 'esswithist_inject', witHistoryPrepare: 'esswithist_prep1', witHistoryPublish: 'esswithist_api001',
  climateTemperatureAction: 'essclimate_temp1', climateModeAction: 'essclimate_mode1',
  waterTemperatureAction: 'esswater_temp001', waterModeAction: 'esswater_mode001',
  dashboardEditorGroup: 'esseditor_dash01', audiEditorGroup: 'esseditor_audi01',
  configEditorGroup: 'esseditor_config',
  vehicleEditorGroup: 'esseditor_vehicle', loadsEditorGroup: 'esseditor_loads1',
  climateEditorGroup: 'esseditor_climate', lightingEditorGroup: 'esseditor_lights1', pricesEditorGroup: 'esseditor_prices1',
  witEditorGroup: 'esseditor_wit001'
};

const climateZones = [
  { key:'cooling-zone-1', name:'Koelzone 1', entityId:'climate.cooling_zone_1', domain:'climate', min:16, max:30, step:1, onMode:'cool', tempAction:'esscltemp_zone01', modeAction:'essclmode_zone01' },
  { key:'cooling-zone-2', name:'Koelzone 2', entityId:'climate.cooling_zone_2', domain:'climate', min:7, max:35, step:1, onMode:'cool', tempAction:'esscltemp_zone02', modeAction:'essclmode_zone02' },
  { key:'cooling-zone-3', name:'Koelzone 3', entityId:'climate.cooling_zone_3', domain:'climate', min:7, max:35, step:1, onMode:'cool', tempAction:'esscltemp_zone03', modeAction:'essclmode_zone03' },
  { key:'cooling-zone-4', name:'Koelzone 4', entityId:'climate.cooling_zone_4', domain:'climate', min:7, max:35, step:1, onMode:'cool', tempAction:'esscltemp_zone04', modeAction:'essclmode_zone04' },
  { key:'heating-zone-1', name:'Verwarmingszone 1', entityId:'climate.heating_zone_1', domain:'climate', min:5, max:25, step:0.5, onMode:'auto', tempAction:'esscltemp_heat01', modeAction:'essclmode_heat01' },
  { key:'heating-zone-2', name:'Verwarmingszone 2', entityId:'climate.heating_zone_2', domain:'climate', min:5, max:25, step:0.5, onMode:'auto', tempAction:'esscltemp_heat02', modeAction:'essclmode_heat02' },
  { key:'heating-zone-3', name:'Verwarmingszone 3', entityId:'climate.heating_zone_3', domain:'climate', min:5, max:25, step:0.5, onMode:'auto', tempAction:'esscltemp_heat03', modeAction:'essclmode_heat03' },
  { key:'heat-pump', name:'Warmtepomp', entityId:'climate.heat_pump', domain:'climate', min:30, max:45, step:1, onMode:'heat', tempAction:'esscltemp_heatpump', modeAction:'essclmode_heatpump' },
  { key:'hot-water', name:'Tapwater', entityId:'water_heater.domestic_hot_water', domain:'water_heater', min:40, max:60, step:1, onMode:'eco', tempAction:'esscltemp_water', modeAction:'essclmode_water' }
];

const lightRooms = [
  { key:'zone-1', name:'Lichtzone 1', entityId:'light.zone_1' },
  { key:'zone-2', name:'Lichtzone 2', entityId:'light.zone_2' },
  { key:'zone-3', name:'Lichtzone 3', entityId:'light.zone_3' },
  { key:'zone-4', name:'Lichtzone 4', entityId:'light.zone_4' },
  { key:'zone-5', name:'Lichtzone 5', entityId:'light.zone_5' },
  { key:'zone-6', name:'Lichtzone 6', entityId:'light.zone_6' },
  { key:'zone-7', name:'Lichtzone 7', entityId:'light.zone_7' },
  { key:'zone-8', name:'Lichtzone 8', entityId:'light.zone_8' }
];

const managedIds = new Set([...Object.values(ids), ...climateZones.flatMap((zone) => [zone.tempAction, zone.modeAction])]);
for (let index = flows.length - 1; index >= 0; index -= 1) {
  if (managedIds.has(flows[index].id)) flows.splice(index, 1);
}

function node(id) {
  const found = flows.find((item) => item.id === id);
  if (!found) throw new Error(`Node ${id} ontbreekt.`);
  return found;
}

const commonCss = `
/* Samsung Galaxy Tab A8: touchvriendelijk in liggende en staande stand. */
:root{--ink:#14252b;--muted:#66767c;--line:#dce6e7;--paper:#fff;--canvas:#f2f6f5;--teal:#0a7c72;--teal-soft:#e2f5f1;--blue:#2365a8;--blue-soft:#eaf2fb;--sun:#d9900b;--sun-soft:#fff6da;--green:#2b8b57;--green-soft:#eaf7ef;--violet:#7356b6;--violet-soft:#f1edfb;--danger:#ba3d36}
.mp-shell{box-sizing:border-box;display:flex;width:100%;max-width:1400px;min-height:calc(100dvh - 12px);flex-direction:column;margin:0 auto;padding:10px;color:var(--ink);font:500 14px/1.4 Inter,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
.mp-shell *{box-sizing:border-box}.mp-hero,.mp-page-head{position:relative;overflow:hidden;border-radius:22px;background:linear-gradient(125deg,#102d35,#174c50 62%,#14776d);color:#fff;box-shadow:0 12px 28px rgba(16,45,53,.16)}
.mp-hero{display:flex;min-height:92px;align-items:center;justify-content:space-between;gap:20px;padding:17px 24px}.mp-hero:after,.mp-page-head:after{content:'';position:absolute;right:-55px;bottom:-75px;width:210px;height:210px;border:38px solid rgba(255,255,255,.06);border-radius:50%}
.mp-kicker{margin-bottom:4px;color:#9ee5dc;font-size:10px;font-weight:900;letter-spacing:.18em}.mp-hero h1,.mp-page-head h1{margin:0;font-size:31px;line-height:1.05;letter-spacing:-.04em}.mp-live{position:relative;z-index:1;display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(255,255,255,.1);padding:9px 13px;font-size:11px;font-weight:850;white-space:nowrap}.mp-live i{width:8px;height:8px;border-radius:50%;background:#5ee0a0;box-shadow:0 0 0 5px rgba(94,224,160,.13)}.mp-live.stale i{background:#ffc857}
.mp-page-head{display:flex;min-height:94px;align-items:center;justify-content:space-between;gap:14px;padding:16px 20px}.mp-title{display:flex;align-items:center;gap:13px}.mp-icon{display:grid;width:44px;height:44px;place-items:center;border:1px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(255,255,255,.1)}.mp-back{position:relative;z-index:2;display:inline-flex;min-width:44px;min-height:44px;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.2);border-radius:13px;color:#fff;text-decoration:none}
.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:10px}.metric{position:relative;min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:17px;background:var(--paper);padding:13px 14px;box-shadow:0 5px 16px rgba(20,37,43,.045)}.metric:before{content:'';position:absolute;inset:0 auto 0 0;width:4px;background:var(--tone,var(--teal))}.metric span{display:block;color:var(--muted);font-size:10px;font-weight:750}.metric b{display:block;overflow:hidden;margin:3px 0 1px;font-size:22px;letter-spacing:-.035em;text-overflow:ellipsis;white-space:nowrap}.metric small{display:block;overflow:hidden;color:var(--muted);font-size:10px;text-overflow:ellipsis;white-space:nowrap}.tone-sun{--tone:var(--sun)}.tone-grid{--tone:var(--blue)}.tone-battery{--tone:var(--green)}.tone-ev{--tone:var(--violet)}
.quick-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}.quick-action{display:flex;min-height:64px;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--line);border-radius:17px;background:#fff;padding:10px 12px;color:var(--ink);text-align:left;box-shadow:0 5px 16px rgba(20,37,43,.045)}.quick-action>div{display:flex;min-width:0;align-items:center;gap:10px}.quick-action b{display:block;font-size:12px}.quick-action small{display:block;overflow:hidden;color:var(--muted);font-size:9px;text-overflow:ellipsis;white-space:nowrap}.quick-action.force{border-color:#ead5a9;background:#fffaf0}.quick-action.active{border-color:#7fcba6;background:#edf9f3}.quick-action .nav-icon{flex:0 0 auto}.quick-action:disabled{opacity:.55}
.nav-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;margin-top:10px}.nav-tile{display:flex;min-height:104px;flex-direction:column;justify-content:space-between;border:1px solid var(--line);border-radius:18px;background:var(--paper);padding:14px;color:var(--ink);text-decoration:none;box-shadow:0 5px 18px rgba(20,37,43,.045);transition:transform .16s ease,box-shadow .16s ease}.nav-tile:active{transform:scale(.985)}.nav-top{display:flex;align-items:center;justify-content:space-between}.nav-icon{display:grid;width:38px;height:38px;place-items:center;border-radius:12px;background:var(--tile-soft,var(--teal-soft));color:var(--tile,var(--teal))}.nav-arrow{color:#94a4a8}.nav-tile b{display:block;margin-top:11px;font-size:14px}.nav-tile.sun{--tile:var(--sun);--tile-soft:var(--sun-soft)}.nav-tile.battery{--tile:var(--green);--tile-soft:var(--green-soft)}.nav-tile.ev{--tile:var(--violet);--tile-soft:var(--violet-soft)}.nav-tile.grid{--tile:var(--blue);--tile-soft:var(--blue-soft)}.nav-tile.climate{--tile:#237ca8;--tile-soft:#e7f5fb}.nav-tile.light{--tile:#b67600;--tile-soft:#fff4cf}
.charge-strip{display:grid;grid-template-columns:minmax(0,1.6fr) repeat(2,minmax(0,1fr)) 38px;align-items:center;gap:10px;margin-top:10px;border:1px solid #d8cef3;border-radius:17px;background:linear-gradient(90deg,#f8f5ff,#fff);padding:10px 12px;color:var(--ink);text-decoration:none;box-shadow:0 5px 16px rgba(20,37,43,.04)}.charge-strip>div{min-width:0}.charge-strip span{display:block;color:var(--muted);font-size:8px;font-weight:800;letter-spacing:.06em}.charge-strip b{display:block;overflow:hidden;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.charge-strip .nav-icon{justify-self:end}
.notice{display:flex;min-height:46px;align-items:center;gap:9px;margin-top:10px;border:1px solid #bce7d2;border-radius:15px;background:#edf9f2;padding:9px 13px;color:#236a45;font-size:11px}.notice.warn{border-color:#f0d39a;background:#fff8e7;color:#8a5b08}.notice strong{white-space:nowrap}.notice span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.panel-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px;margin-top:10px}.panel{min-width:0;border:1px solid var(--line);border-radius:18px;background:var(--paper);padding:14px;box-shadow:0 5px 18px rgba(20,37,43,.045)}.span-3{grid-column:span 3}.span-4{grid-column:span 4}.span-5{grid-column:span 5}.span-6{grid-column:span 6}.span-7{grid-column:span 7}.span-8{grid-column:span 8}.span-12{grid-column:span 12}.panel-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.panel-head b{font-size:13px}.panel-head span{color:var(--muted);font-size:10px}.big-value{font-size:29px;font-weight:850;letter-spacing:-.045em}.subtle{color:var(--muted);font-size:10px}
.flow-stage{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.flow-unit{min-height:108px;border:1px solid var(--line);border-radius:15px;background:#f8fbfa;padding:11px}.flow-unit .nav-icon{width:34px;height:34px}.flow-unit span{display:block;margin-top:9px;color:var(--muted);font-size:9px}.flow-unit b{display:block;margin-top:2px;font-size:17px}.flow-unit small{display:block;margin-top:2px;color:var(--muted);font-size:9px}
.phase-row{display:grid;grid-template-columns:30px 1fr 55px;align-items:center;gap:8px;margin:13px 0}.phase-row>span,.phase-row>b{font-size:11px}.phase-row>b{text-align:right}.phase-track{height:8px;overflow:hidden;border-radius:99px;background:#e7edef}.phase-track i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#1ba99a,#e4a320,#db5148)}
.sensor-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.sensor{display:grid;min-width:0;grid-template-columns:1fr auto;gap:3px 10px;border:1px solid #e6eded;border-radius:12px;background:#fafcfc;padding:9px 10px}.sensor b{overflow:hidden;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.sensor strong{font-size:11px}.sensor small{grid-column:1/-1;overflow:hidden;color:#829095;font-size:8px;text-overflow:ellipsis;white-space:nowrap}
.battery-hero{display:flex;align-items:center;gap:18px}.battery-ring{display:grid;width:112px;height:112px;flex:0 0 auto;place-items:center;border-radius:50%;position:relative}.battery-ring:after{content:'';position:absolute;inset:10px;border-radius:50%;background:#fff}.battery-ring div{position:relative;z-index:1;text-align:center}.battery-ring b{display:block;font-size:24px}.battery-ring span{color:var(--muted);font-size:9px}
.vehicle-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.load-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.vehicle,.load-card{border:1px solid var(--line);border-radius:16px;background:#fafcfc;padding:13px}.vehicle-title,.load-title{display:flex;align-items:center;justify-content:space-between;gap:8px}.vehicle-title>div,.load-title>div{display:flex;align-items:center;gap:8px}.vehicle-main{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:12px}.vehicle-main div{border-radius:11px;background:#fff;padding:8px}.vehicle-main span{display:block;color:var(--muted);font-size:8px}.vehicle-main b{font-size:13px}.control-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;border-radius:14px;background:var(--violet-soft);padding:11px 12px}.control-row b{font-size:11px}.control-row small{display:block;color:var(--muted);font-size:9px}.touch-button{min-width:86px;min-height:44px;border:1px solid #c6b8ec;border-radius:999px;background:#fff;color:#5a4198;font:850 11px Inter,system-ui,sans-serif}.touch-button.active{border-color:#75c79d;background:#e3f6eb;color:#23754a}.wit-mode-control{display:grid;grid-template-columns:repeat(3,minmax(96px,1fr));gap:8px}
.charge-status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-bottom:10px}.charge-status div,.plan-card,.setting{min-width:0;border:1px solid #e5e1f1;border-radius:12px;background:#faf9fe;padding:9px}.charge-status span,.plan-card span,.setting span{display:block;color:var(--muted);font-size:8px;font-weight:800;letter-spacing:.04em}.charge-status b,.plan-card b{display:block;overflow:hidden;margin-top:2px;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.charge-actions{display:grid;grid-template-columns:1fr;gap:8px}.charge-actions .quick-action{margin:0}.plan-grid{display:grid;grid-template-columns:minmax(124px,.72fr) minmax(124px,.72fr) minmax(160px,.92fr) minmax(210px,1.25fr) minmax(145px,.85fr);gap:8px}.setting input,.setting select{box-sizing:border-box;width:100%;min-height:44px;margin-top:5px;border:1px solid #cfd8da;border-radius:9px;background:#fff;padding:0 9px;color:var(--ink);font:800 15px Inter,system-ui,sans-serif}.setting select{cursor:pointer}.soc-setting{padding-right:7px;padding-left:7px}.plan-card small{display:block;overflow:hidden;margin-top:3px;color:var(--muted);font-size:9px;text-overflow:ellipsis;white-space:nowrap}.plan-clock{margin-top:9px;border:1px solid #ded6f3;border-radius:13px;background:#fbfaff;padding:8px 10px}.plan-clock-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-bottom:8px}.plan-clock-summary div{border-radius:9px;background:#fff;padding:6px 8px}.plan-clock-summary span{display:block;color:var(--muted);font-size:7px;font-weight:850;letter-spacing:.05em}.plan-clock-summary b{display:block;margin-top:1px;font-size:12px}.plan-clock-scroll{overflow-x:auto;padding:2px 0}.plan-clock-face{position:relative;min-width:720px;padding-bottom:18px}.plan-clock-cells{display:grid;gap:2px;height:25px}.plan-clock-cell{position:relative;min-width:4px;border:1px solid #e1e5e8;border-radius:3px;background:#eef1f2}.plan-clock-cell.scheduled{border-color:#8f72d5;background:#9b7fdd}.plan-clock-cell.current{box-shadow:0 0 0 2px #e59b18}.plan-clock-cell.scheduled.current{border-color:#27845a;background:#43ad75}.plan-clock-label{position:absolute;bottom:0;transform:translateX(-50%);color:var(--muted);font-size:7px;font-weight:750;white-space:nowrap}.plan-clock-legend{display:flex;align-items:center;gap:12px;margin-top:5px;color:var(--muted);font-size:8px}.plan-clock-legend i{display:inline-block;width:10px;height:10px;margin-right:4px;border-radius:3px;background:#9b7fdd;vertical-align:-2px}.plan-clock-legend i.now{background:#43ad75;box-shadow:0 0 0 1px #e59b18}.plan-slots{display:flex;gap:7px;overflow-x:auto;margin-top:9px;padding-bottom:2px}.plan-slot{flex:0 0 auto;border:1px solid #d8cef3;border-radius:999px;background:#f7f3ff;padding:6px 9px;color:#5a4198;font-size:9px;font-weight:800}
.load-card{display:flex;min-height:116px;flex-direction:column;justify-content:space-between}.load-card strong{font-size:21px}.load-reading{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin-top:12px}.load-reading small{color:var(--muted);font-size:9px}.mini-toggle{display:grid;width:48px;height:44px;flex:0 0 auto;place-items:center;border:1px solid #cfdcdd;border-radius:13px;background:#fff;color:#607378}.mini-toggle.active{border-color:#75c79d;background:#e3f6eb;color:#23754a}.status-dot{display:inline-flex;align-items:center;gap:6px;color:var(--muted);font-size:9px}.status-dot i{width:7px;height:7px;border-radius:50%;background:#9eaaad}.status-dot.on i{background:#36a76b;box-shadow:0 0 0 4px #e6f6ed}
.climate-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.climate-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.climate-card{min-width:0;border:1px solid var(--line);border-radius:16px;background:#f9fcfc;padding:12px}.climate-card.unavailable{opacity:.62}.climate-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.climate-card-head b{font-size:12px}.climate-card-head small{display:block;color:var(--muted);font-size:8px}.climate-now{display:flex;align-items:flex-end;justify-content:space-between;gap:8px;margin:13px 0 10px}.climate-now strong{font-size:26px;letter-spacing:-.04em}.climate-now span{color:var(--muted);font-size:9px;text-align:right}.target-control{display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:7px}.target-control button,.climate-power{display:grid;min-width:44px;min-height:44px;place-items:center;border:1px solid #cad9dc;border-radius:12px;background:#fff;color:#345f69}.target-control button:disabled,.climate-power:disabled{opacity:.45}.target-value{min-width:0;text-align:center}.target-value span{display:block;color:var(--muted);font-size:8px}.target-value b{font-size:14px}.climate-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px}.climate-footer small{overflow:hidden;color:var(--muted);font-size:8px;text-overflow:ellipsis;white-space:nowrap}.climate-power.active{border-color:#74c7a0;background:#e5f7ed;color:#24784d}.heat-pump-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
.climate-power.pending{position:relative}.climate-power.pending:after{content:'';position:absolute;inset:-5px;border:2px solid transparent;border-top-color:#2b8b57;border-right-color:#2b8b57;border-radius:50%;animation:climate-wait .8s linear infinite}@keyframes climate-wait{to{transform:rotate(360deg)}}
.light-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.light-card{min-width:0;border:1px solid var(--line);border-radius:16px;background:#fffdf7;padding:12px}.light-card.unavailable{opacity:.58}.light-card-head,.light-footer{display:flex;align-items:center;justify-content:space-between;gap:9px}.light-card-head>div:first-child{min-width:0}.light-card-head b{display:block;overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.light-card-head small,.light-footer small{display:block;color:var(--muted);font-size:8px}.light-level{display:flex;align-items:flex-end;justify-content:space-between;margin:13px 0 8px}.light-level strong{font-size:25px;letter-spacing:-.04em}.light-level span{color:var(--muted);font-size:9px}.light-slider{width:100%;height:34px;margin:0;accent-color:#d9900b}.light-toggle{position:relative;display:grid;min-width:44px;min-height:44px;place-items:center;border:1px solid #d9d1bd;border-radius:12px;background:#fff;color:#766b50}.light-toggle.active{border-color:#e7bb58;background:#fff4cf;color:#9a6500}.light-toggle:disabled{opacity:.45}.light-toggle.pending:after{content:'';position:absolute;inset:-5px;border:2px solid transparent;border-top-color:#d9900b;border-right-color:#d9900b;border-radius:50%;animation:climate-wait .8s linear infinite}
.alarm-list{display:flex;flex-direction:column;gap:7px}.alarm-item{display:flex;align-items:flex-start;gap:8px;border:1px solid #f0d49c;border-radius:12px;background:#fff9e9;padding:9px 10px;color:#7b530a;font-size:10px}.alarm-item.error{border-color:#e9b8b4;background:#fff1f0;color:#9d342e}
.health-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.health-card{display:flex;min-height:92px;align-items:flex-start;gap:10px;border:1px solid var(--line);border-radius:15px;background:#fafcfc;padding:11px}.health-card .nav-icon{width:36px;height:36px;flex:0 0 auto}.health-card b{display:block;font-size:12px}.health-card small{display:block;margin-top:3px;color:var(--muted);font-size:9px;line-height:1.35}.health-card.ok{border-color:#bce7d2;background:#f1faf5}.health-card.warn{border-color:#f0d39a;background:#fffaf0}.health-card.error{border-color:#e9b8b4;background:#fff4f3}.health-card.ok .nav-icon{background:var(--green-soft);color:var(--green)}.health-card.warn .nav-icon{background:var(--sun-soft);color:var(--sun)}.health-card.error .nav-icon{background:#fde9e7;color:var(--danger)}
.config-modules{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.config-toggle{display:flex;min-height:48px;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--line);border-radius:13px;background:#fafcfc;padding:8px 11px}.config-toggle input{width:22px;height:22px;accent-color:var(--teal)}.config-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.config-field{display:block;min-width:0;border:1px solid var(--line);border-radius:13px;background:#fafcfc;padding:8px 10px}.config-field span{display:block;overflow:hidden;color:var(--muted);font-size:8px;font-weight:800;text-overflow:ellipsis;white-space:nowrap}.config-field input,.config-field select{box-sizing:border-box;width:100%;min-height:40px;margin-top:5px;border:1px solid #cfd8da;border-radius:9px;background:#fff;padding:0 8px;color:var(--ink);font:700 12px Inter,system-ui,sans-serif}.config-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.config-status{display:flex;align-items:flex-start;gap:8px;border:1px solid #bce7d2;border-radius:13px;background:#f1faf5;padding:10px;color:#236a45;font-size:10px}.config-status.warn{border-color:#f0d39a;background:#fff8e7;color:#8a5b08}.config-map{max-height:430px;overflow:auto;padding-right:3px}.privacy-note{border:1px solid #d8cef3;border-radius:13px;background:#f8f5ff;padding:10px;color:#5a4198;font-size:10px}
.nas-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}.nas-card{min-width:0;border:1px solid var(--line);border-radius:14px;background:#f8fbfc;padding:11px}.nas-card>div{display:flex;align-items:center;gap:7px;color:var(--muted);font-size:9px;font-weight:800}.nas-card b{display:block;overflow:hidden;margin-top:8px;font-size:17px;text-overflow:ellipsis;white-space:nowrap}.nas-card small{display:block;overflow:hidden;margin-top:2px;color:var(--muted);font-size:8px;text-overflow:ellipsis;white-space:nowrap}.nas-card.warn{border-color:#f0d39a;background:#fffaf0}.nas-card.error{border-color:#e9b8b4;background:#fff4f3}
@media(max-width:1000px){.health-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.nas-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:700px){.health-grid,.nas-grid{grid-template-columns:1fr}}
@media(max-width:1000px){.nav-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.load-grid,.climate-grid,.light-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.span-3,.span-4{grid-column:span 6}.span-5,.span-6,.span-7,.span-8{grid-column:span 12}.flow-stage{grid-template-columns:repeat(3,minmax(0,1fr))}.plan-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.mp-shell{min-height:calc(100dvh - 8px);padding:6px}.mp-hero{align-items:flex-start;flex-direction:column}.nav-grid,.vehicle-grid,.load-grid,.sensor-list,.quick-actions,.plan-grid,.climate-grid,.light-grid,.heat-pump-grid,.climate-summary,.config-grid,.config-modules{grid-template-columns:1fr}.charge-strip{grid-template-columns:1fr 1fr}.charge-strip>:first-child{grid-column:1/-1}.nav-tile{min-height:90px}.panel-grid{grid-template-columns:1fr}.panel-grid>*{grid-column:1!important}.flow-stage{grid-template-columns:repeat(2,minmax(0,1fr))}.mp-page-head h1,.mp-hero h1{font-size:25px}}
`;

const sharedScript = `
export default {
  data(){return {pendingClimate:{},pendingLights:{}}},
  watch:{msg:{handler(){this.resolveClimatePending();this.resolveLightPending()},deep:true}},
  computed:{
    d(){return this.msg&&this.msg.payload?this.msg.payload:{configuration:{config:{siteName:'Smart ESS',modules:{energy:true,battery:true,inverter:true,ev:true,loads:false,lighting:false,climate:false,nas:false}},status:{}},grid:{},solar:{},wit:{gridCharge:{selectedSlots:[]}},house:{},battery:{},audiSmart:{selectedSlots:[]},audiClimate:{},ev:[],loads:[],lighting:{rooms:[],onCount:0,totalCount:0},climate:{outside:{},aircos:[],tado:[],heatPump:{},hotWater:{}},nas:{drive:{},volume:{}},alarms:[],details:{grid:[],solar:[],battery:[],ev:[],loads:[],system:[]}}},
    modules(){return this.d&&this.d.configuration&&this.d.configuration.config&&this.d.configuration.config.modules||{}},
    stale(){const t=new Date(this.d.updatedAt||0).getTime();return !Number.isFinite(t)||Date.now()-t>30000},
    updated(){const t=new Date(this.d.updatedAt||0);return Number.isNaN(t.getTime())?'wacht op data':t.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit',second:'2-digit'})},
    gridLabel(){const v=Number(this.d.grid&&this.d.grid.power);return !Number.isFinite(v)?'Niet beschikbaar':v<0?'Teruglevering':'Netafname'},
    soc(){const v=Number(this.d.battery&&this.d.battery.soc);return Number.isFinite(v)?Math.round(v)+'%':'—'},
    phases(){return {L1:this.d.grid&&this.d.grid.l1,L2:this.d.grid&&this.d.grid.l2,L3:this.d.grid&&this.d.grid.l3}},
    ringStyle(){const v=Number(this.d.battery&&this.d.battery.soc);const p=Number.isFinite(v)?Math.max(0,Math.min(100,v)):0;return {background:'conic-gradient(#2b8b57 '+p+'%,#e5eceb '+p+'%)'}},
    evPower(){return (this.d.ev||[]).reduce((sum,item)=>sum+(Number(item.power)||0),0)},
    loadPower(){return (this.d.loads||[]).reduce((sum,item)=>sum+(Number(item.power)||0),0)},
    planText(){const s=this.d.audiSmart||{};if(!s.enabled)return 'Slim laden uit';if(s.scheduledNow)return 'Netladen volgens planning';if(s.nextScheduledStart)return this.slotRange(s.nextScheduledStart,s.nextScheduledEnd);if(s.solarOnlyExpected)return 'Alleen zonneladen';if(s.departureEnergyNeeded!==null&&s.departureEnergyNeeded!==undefined&&Number(s.departureEnergyNeeded)<=0)return 'Vertrekdoel bereikt';return 'Nog geen laadkwartier'},
    planTimeline(){const smart=this.d.audiSmart||{},slots=Array.isArray(smart.selectedSlots)?smart.selectedSlots:[],quarter=15*60*1000,now=Date.now(),startDate=new Date(now);startDate.setMinutes(Math.floor(startDate.getMinutes()/15)*15,0,0);const start=startDate.getTime(),departure=new Date(smart.departureAt||0).getTime(),fallbackEnd=start+24*60*60*1000,end=Number.isFinite(departure)&&departure>start?Math.min(departure,fallbackEnd):fallbackEnd,count=Math.max(16,Math.min(96,Math.ceil((end-start)/quarter))),cells=[];for(let index=0;index<count;index+=1){const cellStart=start+index*quarter,cellEnd=cellStart+quarter,slot=slots.find(item=>{const a=new Date(item.start).getTime(),b=new Date(item.end).getTime();return Number.isFinite(a)&&Number.isFinite(b)&&a<cellEnd&&b>cellStart});cells.push({key:cellStart,start:cellStart,end:cellEnd,scheduled:!!slot,current:now>=cellStart&&now<cellEnd,title:this.slotRange(cellStart,cellEnd)+(slot?' · '+this.price(slot.allInPrice)+' · '+(Number(slot.powerKw)||Number(smart.plannedChargePowerKw)||0).toLocaleString('nl-NL',{maximumFractionDigits:1})+' kW':'')})}const labelStep=Math.max(1,Math.ceil(count/8)),labels=cells.filter((_,index)=>index%labelStep===0).map((cell)=>({key:'label-'+cell.key,left:(cell.start-start)/((count-1)*quarter)*100,text:new Date(cell.start).toLocaleString('nl-NL',{weekday:'short',hour:'2-digit',minute:'2-digit'})}));return {cells,labels}},
    witChargeTimeline(){const smart=this.d.wit&&this.d.wit.gridCharge||{},slots=Array.isArray(smart.selectedSlots)?smart.selectedSlots:[],quarter=15*60*1000,now=Date.now(),startDate=new Date(now);startDate.setMinutes(Math.floor(startDate.getMinutes()/15)*15,0,0);const start=startDate.getTime(),count=96,cells=[];for(let index=0;index<count;index+=1){const cellStart=start+index*quarter,cellEnd=cellStart+quarter,slot=slots.find(item=>{const a=new Date(item.start).getTime(),b=new Date(item.end).getTime();return Number.isFinite(a)&&Number.isFinite(b)&&a<cellEnd&&b>cellStart});cells.push({key:'wit-'+cellStart,start:cellStart,end:cellEnd,scheduled:!!slot,current:now>=cellStart&&now<cellEnd,title:this.slotRange(cellStart,cellEnd)+(slot?' · '+this.price(slot.allInPrice)+' · '+(Number(slot.powerKw)||0).toLocaleString('nl-NL',{maximumFractionDigits:1})+' kW':'')})}const labels=cells.filter((_,index)=>index%12===0).map(cell=>({key:'wit-label-'+cell.start,left:(cell.start-start)/((count-1)*quarter)*100,text:new Date(cell.start).toLocaleString('nl-NL',{weekday:'short',hour:'2-digit',minute:'2-digit'})}));return {cells,labels}},
    healthChecks(){const d=this.d||{},missing=[],present=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));if(!present(d.grid&&d.grid.power))missing.push('net');if(!present(d.solar&&d.solar.power))missing.push('zon');if(!present(d.battery&&d.battery.soc))missing.push('accu');const climates=[...((d.climate&&d.climate.aircos)||[]),...((d.climate&&d.climate.tado)||[]),d.climate&&d.climate.heatPump,d.climate&&d.climate.hotWater].filter(Boolean);const climateAvailable=climates.filter(item=>item.available).length;const smart=d.audiSmart||{},nas=d.nas||{};return [{key:'data',title:'Meetdata',level:this.stale?'error':'ok',icon:this.stale?'mdi-clock-alert-outline':'mdi-check-circle-outline',detail:this.stale?'Geen actuele update; controleer Home Assistant en Node-RED':'Actueel om '+this.updated},{key:'core',title:'Kernmetingen',level:missing.length?'error':'ok',icon:missing.length?'mdi-access-point-off':'mdi-access-point-check',detail:missing.length?'Ontbreekt: '+missing.join(', '):'Net, zon en accu beschikbaar'},{key:'charging',title:'EV-laadregeling',level:smart.enabled?(smart.scheduleComplete===false?'warn':'ok'):'warn',icon:'mdi-ev-station',detail:smart.enabled?(smart.scheduleComplete===false?'Planning is nog niet compleet':(smart.status||'Regeling actief')):'Slim laden staat uit'},{key:'climate',title:'Klimaat',level:climates.length&&climateAvailable===climates.length?'ok':climateAvailable?'warn':'error',icon:'mdi-home-thermometer-outline',detail:climates.length?climateAvailable+' van '+climates.length+' zones beschikbaar':'Geen klimaatzones gevonden'},{key:'nas',title:'Synology NAS',level:!nas.available?'warn':nas.ok?'ok':'error',icon:!nas.available?'mdi-nas-off':'mdi-nas',detail:nas.available?(nas.summary||'NAS beschikbaar'):'NAS niet beschikbaar'}]},
    healthOkCount(){return this.healthChecks.filter(check=>check.level==='ok').length}
  },
  methods:{
    power(v){const n=Number(v);if(!Number.isFinite(n))return '—';return Math.abs(n)>=1000?(n/1000).toLocaleString('nl-NL',{maximumFractionDigits:1})+' kW':Math.round(n).toLocaleString('nl-NL')+' W'},
    energy(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('nl-NL',{maximumFractionDigits:1})+' kWh':'—'},
    current(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('nl-NL',{maximumFractionDigits:1})+' A':'—'},
    temperature(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('nl-NL',{maximumFractionDigits:1})+' °C':'—'},
    humidity(v){const n=Number(v);return Number.isFinite(n)?Math.round(n)+'%':'—'},
    phaseWidth(v){const n=Number(v);return Number.isFinite(n)?Math.min(100,Math.abs(n)/25*100)+'%':'0%'},
    sensorValue(item){return item&&item.value!==null&&item.value!==undefined?String(item.value)+(item.unit?' '+item.unit:''):'—'},
    price(v){const n=Number(v);return Number.isFinite(n)?'€'+n.toLocaleString('nl-NL',{minimumFractionDigits:3,maximumFractionDigits:3}):'—'},
    money(v){const n=Number(v);return Number.isFinite(n)?'€ '+n.toLocaleString('nl-NL',{minimumFractionDigits:2,maximumFractionDigits:2}):'—'},
    percent(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('nl-NL',{maximumFractionDigits:1})+'%':'—'},
    storage(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('nl-NL',{maximumFractionDigits:2})+' TB':'—'},
    dataRate(v){const n=Number(v);return Number.isFinite(n)?n.toLocaleString('nl-NL',{maximumFractionDigits:1})+' kB/s':'—'},
    slotRange(start,end){const a=new Date(start),b=new Date(end);if(Number.isNaN(a.getTime()))return '—';const day=a.toLocaleDateString('nl-NL',{weekday:'short'});const t=d=>d.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});return day+' '+t(a)+(Number.isNaN(b.getTime())?'':'–'+t(b))},
    modeLabel(value){return ({'none':'Uit','solar':'Zon','departure-plan':'Planning','deadline':'Noodplanning','ultra-cheap':'Spotgoedkoop','force-full':'Direct 100%'})[String(value||'none')]||String(value)},
    socSetting(topic,event){const value=Number(event.target.value);if(Number.isFinite(value))this.send({topic,payload:value})},
    timeSetting(event){this.send({topic:'ess/audi/departure-time',payload:event.target.value})},
    toggleEV(){this.send({topic:'ess/audi/smart-enabled',payload:!(this.d.audiSmart&&this.d.audiSmart.enabled===true)})},
    toggleForceFull(){this.send({topic:'ess/audi/force-full',payload:!(this.d.audiSmart&&this.d.audiSmart.forceFull===true)})},
    startClimate(){this.send({topic:'ess/audi/climate-start',payload:true})},
    toggleEVLock(){const audi=(this.d.ev||[]).find(item=>item.name==='EV')||{};const locked=String(audi.locked||'').toLowerCase().includes('op slot');this.send({topic:'ess/audi/vehicle-action',payload:locked?'unlock':'lock'})},
    toggleLoad(item){if(item&&item.controlKey)this.send({topic:'ess/load/toggle',payload:item.controlKey})},
    setWitExportMode(mode){if(['auto','on','off'].includes(mode))this.send({topic:'ess/wit/export-mode',payload:mode})},
    setWitEVBufferMode(mode){if(['eco','normal','audi'].includes(mode))this.send({topic:'ess/wit/audi-buffer-mode',payload:mode})},
    setWitGridChargeMode(mode){if(['auto','on','off'].includes(mode))this.send({topic:'ess/wit/grid-charge-mode',payload:mode})},
    setWitGridChargeTargetSoc(event){const value=Number(event&&event.target&&event.target.value);if(Number.isFinite(value))this.send({topic:'ess/wit/grid-charge-target-soc',payload:value})},
    lightPending(item){return item&&this.pendingLights?this.pendingLights[item.key]:null},
    lightIsPending(item){return !!this.lightPending(item)},
    lightIsActive(item){const pending=this.lightPending(item);return pending?pending.active:!!(item&&item.active)},
    lightBrightness(item){const pending=this.lightPending(item);const value=pending&&pending.brightness!=null?pending.brightness:item&&item.brightness;const number=Number(value);return Number.isFinite(number)?Math.max(0,Math.min(100,Math.round(number))):0},
    lightStatus(item){return this.lightIsPending(item)?'Wachten op verlichting':item&&item.status||'Niet beschikbaar'},
    resolveLightPending(){const rooms=this.d&&this.d.lighting&&this.d.lighting.rooms||[];const next={...this.pendingLights};let changed=false;for(const item of rooms){const pending=next[item.key];if(!pending||!!item.active!==pending.active)continue;if(pending.brightness!=null&&Math.abs(Number(item.brightness)-pending.brightness)>2)continue;delete next[item.key];changed=true}if(changed)this.pendingLights=next},
    queueLightPending(item,active,brightness){const token=Date.now();this.pendingLights={...this.pendingLights,[item.key]:{active,brightness,token}};setTimeout(()=>{const pending=this.pendingLights[item.key];if(!pending||pending.token!==token)return;const next={...this.pendingLights};delete next[item.key];this.pendingLights=next},30000)},
    toggleLight(item){if(!item||!item.available)return;const active=!this.lightIsActive(item);this.queueLightPending(item,active,null);this.send({topic:'ess/light/toggle',payload:{key:item.key}})},
    setLightBrightness(item,event){if(!item||!item.available)return;const brightness=Math.max(1,Math.min(100,Math.round(Number(event&&event.target&&event.target.value))));if(!Number.isFinite(brightness))return;item.brightness=brightness;this.queueLightPending(item,true,brightness);this.send({topic:'ess/light/brightness',payload:{key:item.key,brightness}})},
    climatePending(item){return item&&this.pendingClimate?this.pendingClimate[item.key]:null},
    climateIsPending(item){return !!this.climatePending(item)},
    climateIsActive(item){const pending=this.climatePending(item);return pending?pending.active:!!(item&&item.active)},
    climateModeLabel(item){const pending=this.climatePending(item);return pending?'Wachten op apparaat':item&&item.modeLabel},
    resolveClimatePending(){const climate=this.d&&this.d.climate||{};const items=[...(climate.aircos||[]),...(climate.tado||[]),climate.heatPump,climate.hotWater].filter(Boolean);const next={...this.pendingClimate};let changed=false;for(const item of items){const pending=next[item.key];if(pending&&!!item.active===pending.active){delete next[item.key];changed=true}}if(changed)this.pendingClimate=next},
    changeClimateTemperature(item,direction){if(!item||!item.available)return;const target=Number(item.target);const step=Number(item.step)||.5;if(!Number.isFinite(target))return;const min=Number.isFinite(Number(item.min))?Number(item.min):-100;const max=Number.isFinite(Number(item.max))?Number(item.max):100;const next=Math.max(min,Math.min(max,Math.round((target+direction*step)/step)*step));item.target=next;this.send({topic:'ess/climate/set-temperature',payload:{key:item.key,temperature:next}})},
    toggleClimate(item){if(!item||!item.available)return;const active=!this.climateIsActive(item);const token=Date.now();this.pendingClimate={...this.pendingClimate,[item.key]:{active,token}};this.send({topic:'ess/climate/toggle',payload:{key:item.key}});setTimeout(()=>{const pending=this.pendingClimate[item.key];if(!pending||pending.token!==token)return;const next={...this.pendingClimate};delete next[item.key];this.pendingClimate=next},30000)}
  }
}`;

function wrap(body, extraCss = '', script = sharedScript) {
  return `<template>${body}</template>\n<script>${script}</script>\n<style>${commonCss}${extraCss}</style>`;
}

const header = (icon, title) => `<header class="mp-page-head"><div class="mp-title"><div class="mp-icon"><v-icon icon="${icon}" size="24"></v-icon></div><h1>${title}</h1></div><a class="mp-back" href="./overzicht" aria-label="Terug naar overzicht"><v-icon icon="mdi-home-outline" size="23"></v-icon></a></header>`;

const overview = wrap(`
<div class="mp-shell">
  <header class="mp-hero"><h1>{{d.configuration&&d.configuration.config&&d.configuration.config.siteName||'Smart ESS'}}</h1><div class="mp-live" :class="{stale:stale}"><i></i>{{stale?'Controleer data':'Live'}} · {{updated}}</div></header>
  <section class="metric-grid">
    <article class="metric tone-sun"><span>ZON NU</span><b>{{power(d.solar&&d.solar.power)}}</b><small>{{energy(d.solar&&d.solar.actualToday)}} opgewekt vandaag</small></article>
    <article class="metric"><span>WONING</span><b>{{power(d.house&&d.house.power)}}</b><small>Actueel totaalverbruik</small></article>
    <article class="metric tone-grid"><span>{{gridLabel.toUpperCase()}}</span><b>{{power(d.grid&&d.grid.power)}}</b><small>{{energy(d.grid&&d.grid.importToday)}} in · {{energy(d.grid&&d.grid.exportToday)}} uit · {{d.grid&&d.grid.daySource||'dagmeting'}}</small></article>
    <article class="metric tone-battery"><span>THUISACCU</span><b>{{soc}}</b><small>{{d.battery&&d.battery.state||'Niet beschikbaar'}} · {{power(d.battery&&d.battery.power)}}</small></article>
  </section>
  <section class="quick-actions" aria-label="EV-snelbediening" v-if="modules.ev!==false">
    <button class="quick-action" @click="startClimate"><div><div class="nav-icon" style="color:var(--blue);background:var(--blue-soft)"><v-icon icon="mdi-car-defrost-front" size="22"></v-icon></div><span><b>EV klimaat · 21 °C</b><small>{{d.audiClimate&&d.audiClimate.status||'Start de klimaatbeheersing'}}</small></span></div><v-icon icon="mdi-play" size="22"></v-icon></button>
    <button class="quick-action force" :class="{active:d.audiSmart&&d.audiSmart.forceFull}" @click="toggleForceFull"><div><div class="nav-icon" style="color:var(--violet);background:var(--violet-soft)"><v-icon icon="mdi-battery-charging-100" size="22"></v-icon></div><span><b>{{d.audiSmart&&d.audiSmart.forceFull?'Direct laden stoppen':'EV direct naar 100%'}}</b><small>{{d.audiSmart&&d.audiSmart.forceFull?(d.audiSmart.status||'Direct laden actief'):'Met Easee- en fasebeveiliging'}}</small></span></div><v-icon :icon="d.audiSmart&&d.audiSmart.forceFull?'mdi-stop':'mdi-flash'" size="22"></v-icon></button>
  </section>
  <a class="charge-strip" href="./autos" v-if="modules.ev!==false"><div><span>EV-LAADREGELING</span><b>{{d.audiSmart&&d.audiSmart.status||'Uit'}}</b></div><div><span>VERTREKDOEL</span><b>{{d.audiSmart&&d.audiSmart.departureSoc||'—'}}% · {{d.audiSmart&&d.audiSmart.departureTime||'—'}}</b></div><div><span>VOLGEND LAADMOMENT</span><b>{{planText}}</b></div><div class="nav-icon" style="color:var(--violet);background:var(--violet-soft)"><v-icon icon="mdi-calendar-clock" size="20"></v-icon></div></a>
  <nav class="nav-grid" aria-label="ESS detailpagina's">
    <a class="nav-tile sun" href="./energie" v-if="modules.energy!==false"><div class="nav-top"><div class="nav-icon"><v-icon icon="mdi-solar-power-variant-outline" size="22"></v-icon></div><v-icon class="nav-arrow" icon="mdi-arrow-right" size="20"></v-icon></div><b>Zon & net</b></a>
    <a class="nav-tile battery" href="./accu" v-if="modules.battery!==false||modules.inverter!==false"><div class="nav-top"><div class="nav-icon"><v-icon icon="mdi-battery-charging-70" size="22"></v-icon></div><v-icon class="nav-arrow" icon="mdi-arrow-right" size="20"></v-icon></div><b>Accu & omvormer</b></a>
    <a class="nav-tile ev" href="./autos" v-if="modules.ev!==false"><div class="nav-top"><div class="nav-icon"><v-icon icon="mdi-car-electric" size="22"></v-icon></div><v-icon class="nav-arrow" icon="mdi-arrow-right" size="20"></v-icon></div><b>EV & laden</b></a>
    <a class="nav-tile" href="./verbruikers" v-if="modules.loads"><div class="nav-top"><div class="nav-icon"><v-icon icon="mdi-home-lightning-bolt-outline" size="22"></v-icon></div><v-icon class="nav-arrow" icon="mdi-arrow-right" size="20"></v-icon></div><b>Verbruikers</b></a>
    <a class="nav-tile light" href="./verlichting" v-if="modules.lighting"><div class="nav-top"><div class="nav-icon"><v-icon icon="mdi-lightbulb-group-outline" size="22"></v-icon></div><v-icon class="nav-arrow" icon="mdi-arrow-right" size="20"></v-icon></div><b>Verlichting</b></a>
    <a class="nav-tile climate" href="./klimaat" v-if="modules.climate"><div class="nav-top"><div class="nav-icon"><v-icon icon="mdi-home-thermometer-outline" size="22"></v-icon></div><v-icon class="nav-arrow" icon="mdi-arrow-right" size="20"></v-icon></div><b>Klimaat</b></a>
    <a class="nav-tile grid" href="./systeem"><div class="nav-top"><div class="nav-icon"><v-icon icon="mdi-shield-check-outline" size="22"></v-icon></div><v-icon class="nav-arrow" icon="mdi-arrow-right" size="20"></v-icon></div><b>Systeem</b></a>
    <a class="nav-tile" href="./configuratie"><div class="nav-top"><div class="nav-icon"><v-icon icon="mdi-tune-variant" size="22"></v-icon></div><v-icon class="nav-arrow" icon="mdi-arrow-right" size="20"></v-icon></div><b>Configuratie</b></a>
  </nav>
  <div class="notice" :class="{warn:(d.alarms||[]).length}"><v-icon :icon="(d.alarms||[]).length?'mdi-alert-circle-outline':'mdi-check-circle-outline'" size="20"></v-icon><strong>{{(d.alarms||[]).length?(d.alarms.length+' melding(en)'):'Geen meldingen'}}</strong><span v-if="(d.alarms||[]).length">{{d.alarms[0].text||d.alarms[0]}}</span></div>
</div>`);

const energy = wrap(`
<div class="mp-shell">${header('mdi-solar-power','Zon & net','Alle elektrische stromen, opbrengst en fasebelasting bij elkaar.')}
  <section class="panel-grid">
    <article class="panel span-12"><div class="panel-head"><b>Actuele energiestroom</b><span>Positief netvermogen = import</span></div><div class="flow-stage">
      <div class="flow-unit"><div class="nav-icon" style="color:var(--sun);background:var(--sun-soft)"><v-icon icon="mdi-white-balance-sunny" size="20"></v-icon></div><span>LOSSE PV</span><b>{{power(d.solar&&d.solar.power)}}</b><small>{{energy(d.solar&&d.solar.today)}} vandaag</small></div>
      <div class="flow-unit"><div class="nav-icon"><v-icon icon="mdi-solar-panel-large" size="20"></v-icon></div><span>WIT ZON</span><b>{{power(d.wit&&d.wit.solarPower)}}</b><small>{{energy(d.wit&&d.wit.today)}} vandaag</small></div>
      <div class="flow-unit"><div class="nav-icon"><v-icon icon="mdi-home-lightning-bolt-outline" size="20"></v-icon></div><span>WONING</span><b>{{power(d.house&&d.house.power)}}</b><small>Totaal berekend verbruik</small></div>
      <div class="flow-unit"><div class="nav-icon" style="color:var(--blue);background:var(--blue-soft)"><v-icon icon="mdi-transmission-tower" size="20"></v-icon></div><span>{{gridLabel.toUpperCase()}}</span><b>{{power(d.grid&&d.grid.power)}}</b><small>{{energy(d.grid&&d.grid.importToday)}} in · {{energy(d.grid&&d.grid.exportToday)}} uit</small></div>
      <div class="flow-unit"><div class="nav-icon" style="color:var(--green);background:var(--green-soft)"><v-icon icon="mdi-battery-high" size="20"></v-icon></div><span>ACCUSTROOM</span><b>{{power(d.battery&&d.battery.power)}}</b><small>{{d.battery&&d.battery.state||'—'}}</small></div>
    </div></article>
    <article class="panel span-5"><div class="panel-head"><b>Netbelasting per fase</b><span>Veilige ontwerpgrens 22 A</span></div><div class="phase-row" v-for="(value,key) in phases" :key="key"><span>{{key}}</span><div class="phase-track"><i :style="{width:phaseWidth(value)}"></i></div><b>{{current(value)}}</b></div></article>
    <article class="panel span-7"><div class="panel-head"><b>Dagtotalen</b><span>Werkelijke meters en verwachting</span></div><div class="metric-grid" style="margin:0"><div class="metric tone-sun"><span>ZON WERKELIJK</span><b>{{energy(d.solar&&d.solar.actualToday)}}</b><small>Totale productie vandaag</small></div><div class="metric"><span>ZON VERWACHT</span><b>{{energy(d.solar&&d.solar.forecastToday)}}</b><small>Forecast.Solar</small></div><div class="metric tone-grid"><span>NET AFGENOMEN</span><b>{{energy(d.grid&&d.grid.importToday)}}</b><small>{{d.grid&&d.grid.daySource||'Dagmeting'}}</small></div><div class="metric tone-grid"><span>TERUGGELEVERD</span><b>{{energy(d.grid&&d.grid.exportToday)}}</b><small>{{d.grid&&d.grid.daySource||'Dagmeting'}}</small></div></div></article>
    <article class="panel span-12"><div class="panel-head"><b>Verwachting morgen</b><span>Inclusief geplande laadenergie</span></div><div class="metric-grid" style="margin:0;grid-template-columns:repeat(2,minmax(0,1fr))"><div class="metric tone-sun"><span>ZON VERWACHT MORGEN</span><b>{{energy(d.solar&&d.solar.forecastTomorrow)}}</b><small>Som van de drie Forecast.Solar-installaties</small></div><div class="metric tone-grid"><span>VERBRUIK VERWACHT MORGEN</span><b>{{energy(d.house&&d.house.forecastTomorrow)}}</b><small>Woning {{energy(d.house&&d.house.forecastBaseTomorrow)}} · EV {{energy(d.house&&d.house.audiPlannedTomorrow)}} · WIT {{energy(d.house&&d.house.witPlannedTomorrow)}}</small></div></div></article>
  </section>
</div>`);

const battery = wrap(`
<div class="mp-shell">${header('mdi-battery-charging-70','Accu & WIT','Opslag, laadstatus en hybride omvormer zonder ruis.')}
  <section class="panel-grid">
    <article class="panel span-5"><div class="panel-head"><b>Thuisaccu</b><span>circa 30 kWh</span></div><div class="battery-hero"><div class="battery-ring" :style="ringStyle"><div><b>{{soc}}</b><span>STATE OF CHARGE</span></div></div><div><div class="big-value">{{power(d.battery&&d.battery.power)}}</div><div class="subtle">{{d.battery&&d.battery.state||'Niet beschikbaar'}}</div><div class="notice" style="margin-top:12px"><v-icon icon="mdi-shield-check-outline" size="18"></v-icon><span>De bekende Growatt ×10-schaalfout wordt veilig gecorrigeerd; overige extreme waarden blijven verborgen.</span></div></div></div></article>
    <article class="panel span-7"><div class="panel-head"><b>Growatt WIT</b><span>Hybride omvormer</span></div><div class="metric-grid" style="margin:0"><div class="metric tone-battery"><span>WIT POWER</span><b>{{power(d.wit&&d.wit.power)}}</b><small>Negatief = leveren</small></div><div class="metric"><span>SYSTEM OUTPUT</span><b>{{power(d.wit&&d.wit.systemOutputPower)}}</b><small>Terugvalwaarde woning</small></div><div class="metric tone-sun"><span>WIT ZON</span><b>{{power(d.wit&&d.wit.solarPower)}}</b><small>{{energy(d.wit&&d.wit.today)}} vandaag</small></div><div class="metric tone-grid"><span>EXPORT LIMIT</span><b style="font-size:17px">{{!d.wit||d.wit.exportLimitEnabled==null?'—':d.wit.exportLimitEnabled?'AAN':'UIT'}}</b><small>{{d.wit&&d.wit.exportLimitRate!=null?percent(d.wit.exportLimitRate)+' · circa 180 W':'Geen grenswaarde beschikbaar'}}</small></div></div><div class="control-row" style="margin-top:10px"><div><b>EV-accubuffer · {{d.wit&&d.wit.audiDischargeActive?'ACTIEF':'STAND-BY'}}</b><small>{{d.wit&&d.wit.audiDischargeStatus||'Wacht op regeldata'}}</small></div><div style="text-align:right"><b>{{power(d.wit&&d.wit.audiDischargePower)}}</b><small>{{d.wit&&d.wit.audiDischargeBudgetKwh!=null?energy(d.wit.audiDischargeBudgetKwh)+' veilig beschikbaar':'Geen prognosebudget'}}</small></div></div></article>
    <article class="panel span-12"><div class="panel-head"><b>Reserveprofiel EV-accubuffer</b><span>Na een herstart: Normaal</span></div><div class="control-row" style="margin:0"><div><b>{{(d.wit&&d.wit.audiBufferMode)==='eco'?'Eco':(d.wit&&d.wit.audiBufferMode)==='audi'?'EV voorrang':'Normaal'}}</b><small>{{(d.wit&&d.wit.audiBufferMode)==='eco'?'14 kWh woning · accu naar 100% · minimaal 50% SOC':(d.wit&&d.wit.audiBufferMode)==='audi'?'6 kWh woning · accu naar 90% · minimaal 30% SOC':'10 kWh woning · accu naar 100% · minimaal 30% SOC'}}</small></div><div class="wit-mode-control"><button class="touch-button" :class="{active:d.wit&&d.wit.audiBufferMode==='eco'}" @click="setWitEVBufferMode('eco')">Eco</button><button class="touch-button" :class="{active:!d.wit||!d.wit.audiBufferMode||d.wit.audiBufferMode==='normal'}" @click="setWitEVBufferMode('normal')">Normaal</button><button class="touch-button" :class="{active:d.wit&&d.wit.audiBufferMode==='audi'}" @click="setWitEVBufferMode('audi')">EV voorrang</button></div></div></article>
    <article class="panel span-12"><div class="panel-head"><b>WIT slim netladen</b><span>Doorlopende planning voor de komende 24 uur</span></div><div class="control-row" style="margin:0 0 10px"><div><b>{{d.wit&&d.wit.gridCharge&&d.wit.gridCharge.status||'Wacht op regeldata'}}</b><small>Na een herstart: Automatisch · laadverlies en slijtage meegerekend</small></div><div class="wit-mode-control"><button class="touch-button" :class="{active:!d.wit||!d.wit.gridCharge||d.wit.gridCharge.mode==='auto'}" @click="setWitGridChargeMode('auto')">Automatisch</button><button class="touch-button" :class="{active:d.wit&&d.wit.gridCharge&&d.wit.gridCharge.mode==='on'}" @click="setWitGridChargeMode('on')">Nu laden</button><button class="touch-button" :class="{active:d.wit&&d.wit.gridCharge&&d.wit.gridCharge.mode==='off'}" @click="setWitGridChargeMode('off')">Uit</button></div></div><div class="plan-grid"><label class="setting soc-setting"><span>GEWENST SOC</span><select :value="d.wit&&d.wit.gridCharge&&d.wit.gridCharge.targetSoc||80" @change="setWitGridChargeTargetSoc($event)" aria-label="Gewenste WIT SOC"><option v-for="value in [20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]" :key="'wit-target-'+value" :value="value">{{value}}%</option></select></label><div class="plan-card"><span>VERWACHT ZONNELADEN</span><b>{{energy(d.wit&&d.wit.gridCharge&&d.wit.gridCharge.expectedSolarChargeKwh)}}</b><small>Conservatief volgens reserveprofiel</small></div><div class="plan-card energy-needed"><span>NOG VIA NET</span><b>{{energy(d.wit&&d.wit.gridCharge&&d.wit.gridCharge.gridEnergyNeededKwh)}}</b><small>{{energy(d.wit&&d.wit.gridCharge&&d.wit.gridCharge.expectedHouseKwh)}} voor de woning gereserveerd</small></div><div class="plan-card next-charge"><span>VOLGEND LAADMOMENT</span><b>{{d.wit&&d.wit.gridCharge&&d.wit.gridCharge.scheduledNow?'Nu actief':d.wit&&d.wit.gridCharge&&d.wit.gridCharge.nextScheduledStart?slotRange(d.wit.gridCharge.nextScheduledStart,d.wit.gridCharge.nextScheduledEnd):'Geen netlaadkwartier'}}</b><small>Geen vaste deadline; steeds 24 uur vooruit</small></div></div><div class="plan-clock"><div class="plan-clock-summary"><div><span>GEPLAND VERMOGEN</span><b>{{Number(d.wit&&d.wit.gridCharge&&d.wit.gridCharge.plannedPowerKw||0).toLocaleString('nl-NL',{maximumFractionDigits:1})}} kW</b></div><div><span>GEPLANDE NETENERGIE</span><b>{{energy(d.wit&&d.wit.gridCharge&&d.wit.gridCharge.plannedEnergyKwh)}}</b></div><div><span>VERWACHTE KOSTEN</span><b>{{money(d.wit&&d.wit.gridCharge&&d.wit.gridCharge.plannedCost)}}</b></div></div><div class="plan-clock-scroll"><div class="plan-clock-face"><div class="plan-clock-cells" :style="{gridTemplateColumns:'repeat('+witChargeTimeline.cells.length+',minmax(5px,1fr))'}"><i class="plan-clock-cell" v-for="cell in witChargeTimeline.cells" :key="cell.key" :class="{scheduled:cell.scheduled,current:cell.current}" :title="cell.title"></i></div><span class="plan-clock-label" v-for="label in witChargeTimeline.labels" :key="label.key" :style="{left:label.left+'%'}">{{label.text}}</span></div></div><div class="plan-clock-legend"><span><i></i>Gepland netladen</span><span><i class="now"></i>Huidig kwartier</span></div></div></article>
    <article class="panel span-12"><div class="panel-head"><b>Bediening exportbegrenzing</b><span>Na een herstart: Automatisch</span></div><div class="control-row" style="margin:0"><div><b>{{(d.wit&&d.wit.exportLimitMode)==='on'?'Handmatig aan':(d.wit&&d.wit.exportLimitMode)==='off'?'Handmatig uit':'Automatisch'}}</b><small>{{(d.wit&&d.wit.exportLimitMode)==='on'?'Begrensd op 1% · circa 180 W terugleverbuffer':(d.wit&&d.wit.exportLimitMode)==='off'?'Exportbegrenzing uitgeschakeld':'Aan onder 90% thuisaccu-SOC; uit voor aangesloten EV onder zonne-SOC'}}</small></div><div class="wit-mode-control"><button class="touch-button" :class="{active:!d.wit||!d.wit.exportLimitMode||d.wit.exportLimitMode==='auto'}" @click="setWitExportMode('auto')">Automatisch</button><button class="touch-button" :class="{active:d.wit&&d.wit.exportLimitMode==='on'}" @click="setWitExportMode('on')">Handmatig aan</button><button class="touch-button" :class="{active:d.wit&&d.wit.exportLimitMode==='off'}" @click="setWitExportMode('off')">Handmatig uit</button></div></div></article>
  </section>
</div>`);

const ev = wrap(`
<div class="mp-shell">${header('mdi-car-electric','Auto’s & laden')}
  <section class="panel-grid">
    <article class="panel span-7"><div class="panel-head"><b>Elektrische auto</b><span>{{(d.ev&&d.ev[0]&&d.ev[0].status)||'Niet beschikbaar'}}</span></div><div class="vehicle" v-if="d.ev&&d.ev[0]"><div class="vehicle-main"><div><span>VERGRENDELING</span><b>{{d.ev[0].locked||'—'}}</b></div><div><span>SOC</span><b>{{d.ev[0].soc==null?'—':Math.round(Number(d.ev[0].soc))+'%'}}</b></div><div><span>VANDAAG GELADEN</span><b>{{energy(d.ev[0].today)}}</b></div><div><span>HUIDIG VERMOGEN</span><b>{{power(d.ev[0].power)}}</b></div><div><span>AANSLUITING</span><b>{{d.ev[0].status||'—'}}</b></div><div><span>TEMPERATUUR</span><b>{{d.ev[0].temperature||'—'}}</b></div></div><div class="quick-actions"><button class="quick-action" @click="toggleEVLock"><div><div class="nav-icon"><v-icon icon="mdi-car-door-lock" size="21"></v-icon></div><span><b>{{String(d.ev[0].locked||'').toLowerCase().includes('op slot')?'Ontgrendelen':'Vergrendelen'}}</b><small>{{d.ev[0].locked||'Status onbekend'}}</small></span></div></button><button class="quick-action" @click="startClimate"><div><div class="nav-icon" style="color:var(--blue);background:var(--blue-soft)"><v-icon icon="mdi-car-defrost-front" size="21"></v-icon></div><span><b>Klimaat · 21 °C</b><small>{{d.audiClimate&&d.audiClimate.status||'Gereed'}}</small></span></div></button></div></div></article>
    <article class="panel span-5"><div class="panel-head"><b>Laadbediening</b><span>{{d.audiSmart&&d.audiSmart.status||'Uit'}}</span></div><div class="charge-status"><div><span>DOELSTROOM</span><b>{{d.audiSmart&&d.audiSmart.targetCurrent||0}} A</b></div><div><span>FASEN</span><b>{{d.audiSmart&&d.audiSmart.phaseMode||1}}</b></div><div><span>MODUS</span><b>{{modeLabel(d.audiSmart&&d.audiSmart.controlMode)}}</b></div></div><div class="charge-actions"><button class="quick-action" :class="{active:d.audiSmart&&d.audiSmart.enabled}" @click="toggleEV"><div><div class="nav-icon" style="color:var(--violet);background:var(--violet-soft)"><v-icon icon="mdi-ev-station" size="21"></v-icon></div><span><b>ESS slim laden</b><small>{{d.audiSmart&&d.audiSmart.enabled?'AAN':'UIT'}}</small></span></div><v-icon :icon="d.audiSmart&&d.audiSmart.enabled?'mdi-toggle-switch':'mdi-toggle-switch-off-outline'" size="25"></v-icon></button><button class="quick-action force" :class="{active:d.audiSmart&&d.audiSmart.forceFull}" @click="toggleForceFull"><div><div class="nav-icon" style="color:var(--sun);background:var(--sun-soft)"><v-icon icon="mdi-battery-charging-100" size="21"></v-icon></div><span><b>{{d.audiSmart&&d.audiSmart.forceFull?'Direct laden stoppen':'Direct naar 100%'}}</b><small>Met Easee- en fasebeveiliging</small></span></div><v-icon :icon="d.audiSmart&&d.audiSmart.forceFull?'mdi-stop':'mdi-flash'" size="23"></v-icon></button></div></article>
    <article class="panel span-12"><div class="panel-head"><b>Laadplanning</b><span>All-in {{price(d.audiSmart&&d.audiSmart.allInPrice)}}/kWh</span></div><div class="plan-grid"><label class="setting soc-setting"><span>SOC BIJ VERTREK</span><select :value="d.audiSmart&&d.audiSmart.departureSoc||80" @change="socSetting('ess/audi/departure-soc',$event)" aria-label="SOC bij vertrek"><option v-for="value in [20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]" :key="'departure-'+value" :value="value">{{value}}%</option></select></label><label class="setting"><span>VERTREKTIJD</span><input type="time" :value="d.audiSmart&&d.audiSmart.departureTime||'06:00'" @change="timeSetting($event)"></label><div class="plan-card next-charge"><span>VOLGEND LAADMOMENT</span><b>{{planText}}</b><small>{{d.audiSmart&&d.audiSmart.scheduledSlots||0}} van {{d.audiSmart&&d.audiSmart.requiredSlots||0}} kwartieren gepland</small></div><div class="plan-card energy-needed"><span>NOG NODIG</span><b>{{energy(d.audiSmart&&d.audiSmart.departureEnergyNeeded)}}</b><small>{{energy(d.audiSmart&&d.audiSmart.solarEnergyReservedKwh)}} uit verwachte zon</small></div></div><div class="plan-clock"><div class="plan-clock-summary"><div><span>GEPLAND VERMOGEN</span><b>{{Number(d.audiSmart&&d.audiSmart.plannedChargePowerKw||0).toLocaleString('nl-NL',{maximumFractionDigits:1})}} kW</b></div><div><span>GEPLANDE ENERGIE</span><b>{{energy(d.audiSmart&&d.audiSmart.plannedGridEnergyKwh)}}</b></div><div><span>VERWACHTE LAADKOSTEN</span><b>{{money(d.audiSmart&&d.audiSmart.plannedGridCost)}}</b></div></div><div class="plan-clock-scroll"><div class="plan-clock-face"><div class="plan-clock-cells" :style="{gridTemplateColumns:'repeat('+planTimeline.cells.length+',minmax(5px,1fr))'}"><i class="plan-clock-cell" v-for="cell in planTimeline.cells" :key="cell.key" :class="{scheduled:cell.scheduled,current:cell.current}" :title="cell.title"></i></div><span class="plan-clock-label" v-for="label in planTimeline.labels" :key="label.key" :style="{left:label.left+'%'}">{{label.text}}</span></div></div><div class="plan-clock-legend"><span><i></i>Gepland laden</span><span><i class="now"></i>Actief kwartier</span></div></div></article>
    <article class="panel span-12" v-if="d.ev&&d.ev[1]"><div class="panel-head"><b>EV 2</b><span>{{d.ev[1].status||'Niet beschikbaar'}}</span></div><div class="metric-grid" style="margin:0"><div class="metric tone-ev"><span>VERMOGEN</span><b>{{power(d.ev[1].power)}}</b><small>Easee Rechts</small></div><div class="metric"><span>VANDAAG GELADEN</span><b>{{energy(d.ev[1].today)}}</b><small>{{d.ev[1].status||'—'}}</small></div></div></article>
  </section>
</div>`).replace('<label class="setting"><span>VERTREKTIJD</span>', '<label class="setting soc-setting"><span>MAX SOC OP ZON</span><select :value="d.audiSmart&&d.audiSmart.solarSoc||100" @change="socSetting(\'ess/audi/solar-soc\',$event)" aria-label="Maximale SOC op zon"><option v-for="value in [20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100]" :key="\'solar-\'+value" :value="value">{{value}}%</option></select></label><label class="setting"><span>VERTREKTIJD</span>');

const loads = wrap(`
<div class="mp-shell">${header('mdi-home-lightning-bolt-outline','Verbruikers','Flexibele woninglasten en hun actuele bijdrage.')}
  <section class="panel-grid"><article class="panel span-12"><div class="panel-head"><b>Verbruikers</b><span>Totaal gemeten {{power(loadPower)}}</span></div><div class="load-grid"><div class="load-card" v-for="item in d.loads" :key="item.name"><div class="load-title"><div><div class="nav-icon"><v-icon :icon="item.controlType==='climate'?'mdi-air-conditioner':'mdi-flash-outline'" size="20"></v-icon></div><b>{{item.name}}</b></div><span class="status-dot" :class="{on:item.active}"><i></i>{{item.status||'Onbekend'}}</span></div><div class="load-reading"><div><strong>{{item.power==null?(item.temperature||'—'):power(item.power)}}</strong><small v-if="item.power==null&&item.temperature">Temperatuur</small></div><button v-if="item.controlKey" class="mini-toggle" :class="{active:item.active}" @click="toggleLoad(item)" :aria-label="item.name+' schakelen'"><v-icon :icon="item.active?'mdi-power':'mdi-power-off'" size="23"></v-icon></button></div></div></div></article>
  </section>
</div>`);

const climate = wrap(`
<div class="mp-shell">
  <header class="mp-page-head"><div class="mp-title"><div class="mp-icon"><v-icon icon="mdi-home-thermometer-outline" size="24"></v-icon></div><h1>Klimaat</h1></div><div style="display:flex;align-items:center;gap:8px;position:relative;z-index:2"><div class="mp-live"><v-icon icon="mdi-weather-partly-cloudy" size="18"></v-icon><span>{{temperature(d.climate&&d.climate.outside&&d.climate.outside.temperature)}} · {{humidity(d.climate&&d.climate.outside&&d.climate.outside.humidity)}}</span></div><a class="mp-back" href="./overzicht" aria-label="Terug naar overzicht"><v-icon icon="mdi-home-outline" size="23"></v-icon></a></div></header>
  <section class="panel-grid">
    <article class="panel span-12"><div class="panel-head"><b>Airco's</b><span>Temperatuur per ruimte</span></div><div class="climate-grid"><div class="climate-card" :class="{unavailable:!item.available}" v-for="item in (d.climate&&d.climate.aircos)||[]" :key="item.key"><div class="climate-card-head"><div><b>{{item.name}}</b><small>{{item.status}}</small></div><div class="nav-icon"><v-icon icon="mdi-air-conditioner" size="20"></v-icon></div></div><div class="climate-now"><strong>{{temperature(item.current)}}</strong><span v-if="item.humidity!=null">{{humidity(item.humidity)}}<br>luchtvochtigheid</span><span v-else>ruimte</span></div><div class="target-control"><button :disabled="!item.available||item.target==null" @click="changeClimateTemperature(item,-1)" :aria-label="item.name+' lager'"><v-icon icon="mdi-minus" size="22"></v-icon></button><div class="target-value"><span>INGESTELD</span><b>{{temperature(item.target)}}</b></div><button :disabled="!item.available||item.target==null" @click="changeClimateTemperature(item,1)" :aria-label="item.name+' hoger'"><v-icon icon="mdi-plus" size="22"></v-icon></button></div><div class="climate-footer"><small>{{item.modeLabel}}</small><button class="climate-power" :class="{active:item.active}" :disabled="!item.available" @click="toggleClimate(item)" :aria-label="item.name+' aan of uit'"><v-icon :icon="item.active?'mdi-power':'mdi-power-off'" size="22"></v-icon></button></div></div></div></article>
    <article class="panel span-12"><div class="panel-head"><b>Verwarming</b><span>Drie configureerbare zones</span></div><div class="climate-grid"><div class="climate-card" :class="{unavailable:!item.available}" v-for="item in (d.climate&&d.climate.tado)||[]" :key="item.key"><div class="climate-card-head"><div><b>{{item.name}}</b><small>{{item.status}}</small></div><div class="nav-icon" style="color:var(--sun);background:var(--sun-soft)"><v-icon icon="mdi-radiator" size="20"></v-icon></div></div><div class="climate-now"><strong>{{temperature(item.current)}}</strong><span>{{item.humidity==null?'—':humidity(item.humidity)}}<br>luchtvochtigheid</span></div><div class="target-control"><button :disabled="!item.available||item.target==null" @click="changeClimateTemperature(item,-1)" :aria-label="item.name+' lager'"><v-icon icon="mdi-minus" size="22"></v-icon></button><div class="target-value"><span>INGESTELD</span><b>{{temperature(item.target)}}</b></div><button :disabled="!item.available||item.target==null" @click="changeClimateTemperature(item,1)" :aria-label="item.name+' hoger'"><v-icon icon="mdi-plus" size="22"></v-icon></button></div><div class="climate-footer"><small>{{item.modeLabel}}</small><button class="climate-power" :class="{active:item.active}" :disabled="!item.available" @click="toggleClimate(item)" :aria-label="item.name+' aan of uit'"><v-icon :icon="item.active?'mdi-power':'mdi-power-off'" size="22"></v-icon></button></div></div></div></article>
    <article class="panel span-12"><div class="panel-head"><b>Warmtepomp</b><span>Buiten {{temperature(d.climate&&d.climate.outside&&d.climate.outside.temperature)}}</span></div><div class="heat-pump-grid"><div class="climate-card" :class="{unavailable:!item.available}" v-for="item in [d.climate&&d.climate.heatPump,d.climate&&d.climate.hotWater].filter(Boolean)" :key="item.key"><div class="climate-card-head"><div><b>{{item.name}}</b><small>{{item.status}}</small></div><div class="nav-icon" style="color:var(--green);background:var(--green-soft)"><v-icon :icon="item.key==='hot-water'?'mdi-water-boiler':'mdi-heat-pump-outline'" size="20"></v-icon></div></div><div class="climate-now"><strong>{{temperature(item.current)}}</strong><span>actuele<br>watertemperatuur</span></div><div class="target-control"><button :disabled="!item.available||item.target==null" @click="changeClimateTemperature(item,-1)" :aria-label="item.name+' lager'"><v-icon icon="mdi-minus" size="22"></v-icon></button><div class="target-value"><span>INSTELWAARDE</span><b>{{temperature(item.target)}}</b></div><button :disabled="!item.available||item.target==null" @click="changeClimateTemperature(item,1)" :aria-label="item.name+' hoger'"><v-icon icon="mdi-plus" size="22"></v-icon></button></div><div class="climate-footer"><small>{{item.modeLabel}}</small><button class="climate-power" :class="{active:item.active}" :disabled="!item.available" @click="toggleClimate(item)" :aria-label="item.name+' aan of uit'"><v-icon :icon="item.active?'mdi-power':'mdi-power-off'" size="22"></v-icon></button></div></div></div></article>
  </section>
</div>`)
  .replaceAll('<small>{{item.modeLabel}}</small><button class="climate-power" :class="{active:item.active}"', '<small>{{climateModeLabel(item)}}</small><button class="climate-power" :class="{active:climateIsActive(item),pending:climateIsPending(item)}"')
  .replaceAll('<v-icon :icon="item.active?\'mdi-power\':\'mdi-power-off\'" size="22"></v-icon></button>', '<v-icon :icon="climateIsActive(item)?\'mdi-power\':\'mdi-power-off\'" size="22"></v-icon></button>');

const lighting = wrap(`
<div class="mp-shell">${header('mdi-lightbulb-group-outline','Verlichting')}
  <section class="panel-grid">
    <article class="panel span-12"><div class="panel-head"><b>Verlichting per ruimte</b><span>{{d.lighting&&d.lighting.onCount||0}} van {{d.lighting&&d.lighting.totalCount||0}} ruimtes aan</span></div>
      <div class="light-grid"><div class="light-card" :class="{unavailable:!item.available}" v-for="item in (d.lighting&&d.lighting.rooms)||[]" :key="item.key">
        <div class="light-card-head"><div><b>{{item.name}}</b><small>{{lightStatus(item)}}</small></div><div class="nav-icon" style="color:#b67600;background:#fff4cf"><v-icon :icon="lightIsActive(item)?'mdi-lightbulb-on-outline':'mdi-lightbulb-outline'" size="20"></v-icon></div></div>
        <div class="light-level"><strong>{{lightBrightness(item)}}%</strong><span>HELDERHEID</span></div>
        <input class="light-slider" type="range" min="1" max="100" step="1" :value="lightBrightness(item)" :disabled="!item.available||lightIsPending(item)" @change="setLightBrightness(item,$event)" :aria-label="item.name+' helderheid'">
        <div class="light-footer"><small>{{item.available?'Kamerzone in Hue':'Niet beschikbaar in Home Assistant'}}</small><button class="light-toggle" :class="{active:lightIsActive(item),pending:lightIsPending(item)}" :disabled="!item.available||lightIsPending(item)" @click="toggleLight(item)" :aria-label="item.name+' aan of uit'"><v-icon :icon="lightIsActive(item)?'mdi-power':'mdi-power-off'" size="22"></v-icon></button></div>
      </div></div>
    </article>
  </section>
</div>`);

const system = wrap(`
<div class="mp-shell">${header('mdi-shield-check-outline','Systeem','Datakwaliteit, bedrijfsmodus en gerichte diagnose.')}
  <section class="panel-grid"><article class="panel span-12"><div class="panel-head"><b>Gezondheidscheck</b><span>{{healthOkCount}} van {{healthChecks.length}} in orde</span></div><div class="health-grid"><div class="health-card" :class="check.level" v-for="check in healthChecks" :key="check.key"><div class="nav-icon"><v-icon :icon="check.icon" size="20"></v-icon></div><div><b>{{check.title}}</b><small>{{check.detail}}</small></div></div></div></article>
    <article class="panel span-12"><div class="panel-head"><b>Synology NAS · {{d.nas&&d.nas.name||'NAS'}}</b><span>{{d.nas&&d.nas.available?(d.nas.summary||'Beschikbaar'):'Niet beschikbaar'}}</span></div><div class="nas-grid">
      <div class="nas-card" :class="{warn:d.nas&&d.nas.volume&&d.nas.volume.usedPercent>=80,error:d.nas&&d.nas.volume&&d.nas.volume.usedPercent>=90}"><div><v-icon icon="mdi-database-outline" size="17"></v-icon>OPSLAG</div><b>{{percent(d.nas&&d.nas.volume&&d.nas.volume.usedPercent)}}</b><small>{{storage(d.nas&&d.nas.volume&&d.nas.volume.used)}} gebruikt · {{d.nas&&d.nas.volume&&d.nas.volume.statusLabel||'—'}}</small></div>
      <div class="nas-card" :class="{error:d.nas&&d.nas.drive&&!d.nas.drive.ok}"><div><v-icon icon="mdi-harddisk" size="17"></v-icon>SCHIJF 2</div><b>{{d.nas&&d.nas.drive&&d.nas.drive.statusLabel||'—'}}</b><small>{{temperature(d.nas&&d.nas.drive&&d.nas.drive.temperature)}} · {{d.nas&&d.nas.drive&&d.nas.drive.healthLabel||'Geen status'}}</small></div>
      <div class="nas-card"><div><v-icon icon="mdi-thermometer" size="17"></v-icon>SYSTEEM</div><b>{{temperature(d.nas&&d.nas.temperature)}}</b><small>Ventilator {{d.nas&&d.nas.fanModeLabel||'—'}}</small></div>
      <div class="nas-card"><div><v-icon icon="mdi-cpu-64-bit" size="17"></v-icon>BELASTING</div><b>{{percent(d.nas&&d.nas.cpu)}}</b><small>Geheugen {{percent(d.nas&&d.nas.memory)}}</small></div>
      <div class="nas-card"><div><v-icon icon="mdi-lan" size="17"></v-icon>NETWERK</div><b>↓ {{dataRate(d.nas&&d.nas.download)}}</b><small>↑ {{dataRate(d.nas&&d.nas.upload)}}</small></div>
      <div class="nas-card" :class="{error:d.nas&&d.nas.securitySafe===false,warn:d.nas&&d.nas.updateAvailable}"><div><v-icon icon="mdi-shield-check-outline" size="17"></v-icon>VEILIGHEID</div><b>{{d.nas&&d.nas.securityLabel||'—'}}</b><small>{{d.nas&&d.nas.updateLabel||'DSM-status onbekend'}}</small></div>
    </div></article>
    <article class="panel span-4"><div class="panel-head"><b>Bedrijfsmodus</b><span>Node-RED</span></div><div class="big-value" style="font-size:20px">{{d.mode||'Alleen meten'}}</div><div class="notice" :class="{warn:stale}"><v-icon :icon="stale?'mdi-clock-alert-outline':'mdi-check-circle-outline'" size="18"></v-icon><span>{{stale?'Meetdata is ouder dan 30 seconden':'Meetdata actueel om '+updated}}</span></div></article>
    <article class="panel span-8"><div class="panel-head"><b>Actieve meldingen</b><span>{{(d.alarms||[]).length}}</span></div><div class="notice" v-if="!(d.alarms||[]).length" style="margin:0"><v-icon icon="mdi-check-circle-outline" size="19"></v-icon><span>Geen actieve waarschuwingen of storingen.</span></div><div class="alarm-list" v-else><div class="alarm-item" :class="alarm.level" v-for="(alarm,index) in d.alarms" :key="index"><v-icon icon="mdi-alert-outline" size="18"></v-icon><span>{{alarm.text||alarm}}</span></div></div></article>
  </section>
</div>`);

const configScript = `
export default {
  data(){return {draft:null,dirty:false,importText:'',message:''}},
  watch:{msg:{handler(){if(!this.dirty)this.load()},deep:true,immediate:true}},
  computed:{
    d(){return this.msg&&this.msg.payload?this.msg.payload:{}},
    configuration(){return this.d.configuration||{}},
    status(){return this.configuration.status||{}},
    moduleRows(){const labels={energy:'Energie en P1',battery:'Thuisaccu',inverter:'Omvormerbediening',ev:'Elektrische auto',loads:'Flexibele verbruikers',lighting:'Verlichting',climate:'Klimaat',nas:'NAS'};return Object.keys((this.draft&&this.draft.modules)||{}).map(key=>({key,label:labels[key]||key}))},
    specRows(){const labels={phases:'Aantal fasen',voltage:'Netspanning (V)',mainFuseA:'Hoofdzekering (A)',batteryCapacityKwh:'Accucapaciteit (kWh)',inverterRatedPowerKw:'Omvormervermogen (kW)',maximumBatteryPowerKw:'Maximaal accu-P (kW)',evBatteryCapacityKwh:'EV-accu (kWh)',evMaximumCurrentA:'Maximale EV-stroom (A)',evGridChargePowerKw:'EV-netlaadvermogen (kW)',gridImportBufferW:'Netafnamebuffer (W)'};return Object.keys((this.draft&&this.draft.specs)||{}).map(key=>({key,label:labels[key]||key}))},
    entityRows(){return Object.entries((this.draft&&this.draft.entities)||{}).map(([canonical,actual])=>({canonical,actual})).sort((a,b)=>a.canonical.localeCompare(b.canonical))},
    missing(){return Array.isArray(this.status.missing)?this.status.missing:[]},
    unavailable(){return Array.isArray(this.status.unavailable)?this.status.unavailable:[]},
    jsonText(){return this.draft?JSON.stringify(this.draft,null,2):''}
  },
  methods:{
    clone(value){return JSON.parse(JSON.stringify(value||{}))},
    load(){const config=this.configuration.config;if(config)this.draft=this.clone(config)},
    changed(){this.dirty=true;this.message='Niet-opgeslagen wijzigingen'},
    setEntity(canonical,event){if(!this.draft)return;this.draft.entities[canonical]=String(event.target.value||'').trim();this.changed()},
    save(){if(!this.draft)return;this.send({topic:'ess/config/save',payload:this.clone(this.draft)});this.dirty=false;this.message='Configuratie opgeslagen'},
    validate(){if(!this.draft)return;this.send({topic:'ess/config/validate',payload:this.clone(this.draft)});this.message='Configuratie gecontroleerd'},
    discover(){if(!this.draft)return;this.dirty=false;this.message='Home Assistant-entiteiten worden automatisch gezocht';this.send({topic:'ess/config/discover',payload:this.clone(this.draft)})},
    reset(){if(!confirm('Neutrale standaardconfiguratie herstellen?'))return;this.send({topic:'ess/config/reset',payload:true});this.dirty=false;this.message='Standaardconfiguratie hersteld'},
    copyJson(){if(navigator.clipboard)navigator.clipboard.writeText(this.jsonText);this.message='Configuratie gekopieerd'},
    importJson(){try{const parsed=JSON.parse(this.importText);const next=this.clone(this.draft||{});if(parsed.siteName!==undefined)next.siteName=parsed.siteName;if(parsed.modules&&typeof parsed.modules==='object')next.modules=Object.assign({},next.modules||{},parsed.modules);if(parsed.specs&&typeof parsed.specs==='object')next.specs=Object.assign({},next.specs||{},parsed.specs);if(parsed.entities&&typeof parsed.entities==='object')next.entities=Object.assign({},next.entities||{},parsed.entities);this.draft=next;this.dirty=true;this.message='Deelconfiguratie geladen; controleer en sla op'}catch(error){this.message='Ongeldige JSON: '+error.message}}
  }
}`;

const configuration = wrap(`
<div class="mp-shell">${header('mdi-tune-variant','Configuratie')}
  <section class="panel-grid" v-if="draft">
    <article class="panel span-12"><div class="panel-head"><b>Installatieprofiel</b><span>Alle persoonlijke koppelingen blijven lokaal</span></div><label class="config-field"><span>NAAM OP HET DASHBOARD</span><input v-model="draft.siteName" @input="changed" maxlength="60" autocomplete="off"></label><div class="privacy-note" style="margin-top:9px">Gebruik geen adres, persoonsnaam, serienummer of kenteken. De volledige configuratie en automatische lokale back-up staan in <code>${SYSTEM_CONFIG_PATH}</code> en <code>${SYSTEM_CONFIG_BACKUP_PATH}</code>; beide horen niet in Git.</div></article>
    <article class="panel span-12"><div class="panel-head"><b>Onderdelen</b><span>Niet-gebruikte onderdelen verdwijnen van het overzicht</span></div><div class="config-modules"><label class="config-toggle" v-for="item in moduleRows" :key="item.key"><span>{{item.label}}</span><input type="checkbox" v-model="draft.modules[item.key]" @change="changed"></label></div></article>
    <article class="panel span-12"><div class="panel-head"><b>Installatiegrenzen</b><span>Veilige fysieke maxima blijven altijd leidend</span></div><div class="config-grid"><label class="config-field" v-for="item in specRows" :key="item.key"><span>{{item.label}}</span><input type="number" v-model.number="draft.specs[item.key]" @input="changed" min="0" step="0.1"></label></div></article>
    <article class="panel span-12"><div class="panel-head"><b>Home Assistant-entiteiten</b><span>Links de neutrale rol, rechts jouw lokale entiteit</span></div><div class="config-grid config-map"><label class="config-field" v-for="item in entityRows" :key="item.canonical"><span :title="item.canonical">{{item.canonical}}</span><input :value="draft.entities[item.canonical]" @input="setEntity(item.canonical,$event)" placeholder="domain.entity"></label></div></article>
    <article class="panel span-12"><div class="panel-head"><b>Controle</b><span>{{status.valid?(unavailable.length?'Gekoppeld':'Gereed'):'Aandacht nodig'}}</span></div><div class="config-status" :class="{warn:!status.valid||unavailable.length}"><v-icon :icon="status.valid&&!unavailable.length?'mdi-check-circle-outline':'mdi-alert-outline'" size="20"></v-icon><div><b>{{status.valid?'Alle verplichte koppelingen zijn ingesteld':missing.length+' verplichte koppeling(en) ontbreken'}}</b><div v-if="missing.length" style="margin-top:4px">{{missing.join(', ')}}</div><div v-if="unavailable.length" style="margin-top:4px">Tijdelijk zonder geldige status: {{unavailable.join(', ')}}</div><div v-if="status.discovery" style="margin-top:4px">Automatisch gekoppeld: {{status.discovery.matched}} · behouden: {{status.discovery.kept}} · nog niet gevonden: {{status.discovery.unmatched}}</div><div v-if="status.discovery&&status.discovery.warnings&&status.discovery.warnings.length" style="margin-top:4px">{{status.discovery.warnings.join(' · ')}}</div><div v-if="message" style="margin-top:4px">{{message}}</div></div></div><div class="privacy-note" style="margin-top:9px">Automatisch koppelen vult alleen overtuigende matches in. Controleer vooral WIT-, laadpunt- en schakelentiteiten voordat je opslaat.</div><div class="config-actions" style="margin-top:10px"><button class="touch-button" @click="discover">Automatisch koppelen</button><button class="touch-button" @click="validate">Controleren</button><button class="touch-button" @click="copyJson">JSON kopiëren</button><button class="touch-button" @click="reset">Standaard</button><button class="touch-button active" @click="save">Opslaan</button></div></article>
    <article class="panel span-12"><div class="panel-head"><b>Configuratie importeren</b><span>Plak uitsluitend een lokaal, gecontroleerd profiel</span></div><label class="config-field"><span>JSON</span><textarea v-model="importText" style="box-sizing:border-box;width:100%;min-height:130px;margin-top:5px;border:1px solid #cfd8da;border-radius:9px;padding:9px;font:12px ui-monospace,monospace"></textarea></label><div class="config-actions" style="margin-top:8px"><button class="touch-button" @click="importJson">Import laden</button></div></article>
  </section>
  <div class="notice warn" v-else><v-icon icon="mdi-loading" size="19"></v-icon><span>Configuratie wordt geladen.</span></div>
</div>`, '', configScript);

function page(id, name, route, icon, order) {
  return { id, type:'ui-page', name, ui:BASE_ID, path:`/${route}`, icon, layout:'grid', theme:THEME_ID,
    breakpoints:[{name:'Mobiel',px:'0',cols:'3'},{name:'Tablet staand',px:'600',cols:'12'},{name:'Tab A8',px:'760',cols:'12'},{name:'Desktop',px:'1281',cols:'12'}],
    order, className:'ess-detail-page', visible:'true', disabled:'false' };
}

function group(id, pageId, name) {
  return { id, type:'ui-group', name, page:pageId, width:12, height:1, order:1, showTitle:false, className:'', visible:'true', disabled:'false', groupType:'default' };
}

function template(id, groupId, name, order, height, format, wires = []) {
  return { id, type:'ui-template', z:FLOW_ID, group:groupId, page:'', ui:'', name, order, width:'12', height:String(height), head:'', format,
    storeOutMessages:false, passthru:false, resendOnRefresh:true, templateScope:'local', className:'', topic:'topic', topicType:'msg', x:860, y:260+order*40, wires:[wires] };
}

const overviewPage = node(OVERVIEW_PAGE_ID);
const dashboardBase = node(BASE_ID);
dashboardBase.headerContent = 'none';
dashboardBase.titleBarStyle = 'hidden';
overviewPage.name = 'Overzicht'; overviewPage.path = '/overzicht'; overviewPage.icon = 'view-dashboard-outline'; overviewPage.order = 1; overviewPage.className = 'ess-overview-page';
const overviewGroup = node(OVERVIEW_GROUP_ID); overviewGroup.name = 'Overzicht'; overviewGroup.page = OVERVIEW_PAGE_ID;
const overviewTemplate = node(OVERVIEW_TEMPLATE_ID); overviewTemplate.name = 'ESS beknopt overzicht'; overviewTemplate.format = overview; overviewTemplate.height = '13'; overviewTemplate.order = 1; overviewTemplate.wires = [[CONTROL_ID]];

flows.push(
  page(ids.energyPage,'Zon & net','energie','solar-power-variant-outline',2), group(ids.energyGroup,ids.energyPage,'Zon & net'), template(ids.energyTemplate,ids.energyGroup,'Zon en net details',1,13,energy),
  page(ids.batteryPage,'Accu & WIT','accu','battery-charging-70',3), group(ids.batteryGroup,ids.batteryPage,'Accu & WIT'), template(ids.batteryTemplate,ids.batteryGroup,'Accu en WIT details',1,13,battery,[ids.witExportModeControl,ids.witEVBufferModeControl,ids.witGridChargeSettingsControl]),
  page(ids.evPage,"Auto's & laden",'autos','car-electric',4), group(ids.evGroup,ids.evPage,"Auto's & laden"), template(ids.evTemplate,ids.evGroup,'Autos en laden details',1,13,ev,[CONTROL_ID]),
  page(ids.loadsPage,'Verbruikers','verbruikers','home-lightning-bolt-outline',5), group(ids.loadsGroup,ids.loadsPage,'Verbruikers'), template(ids.loadsTemplate,ids.loadsGroup,'Verbruikers details',1,13,loads,[ids.loadsControl]),
  page(ids.lightingPage,'Verlichting','verlichting','lightbulb-group-outline',6), group(ids.lightingGroup,ids.lightingPage,'Verlichting'), template(ids.lightingTemplate,ids.lightingGroup,'Verlichting per ruimte',1,13,lighting,[ids.lightingControl]),
  page(ids.climatePage,'Klimaat','klimaat','home-thermometer-outline',7), group(ids.climateGroup,ids.climatePage,'Klimaat'), template(ids.climateTemplate,ids.climateGroup,'Klimaat per ruimte',1,13,climate,[ids.climateControl]),
  page(ids.systemPage,'Systeem','systeem','shield-check-outline',8), group(ids.systemGroup,ids.systemPage,'Systeem'), template(ids.systemTemplate,ids.systemGroup,'Systeem en diagnose',1,13,system),
  page(ids.configPage,'Configuratie','configuratie','tune-variant',9), group(ids.configGroup,ids.configPage,'Configuratie'), template(ids.configTemplate,ids.configGroup,'Lokale installatieconfiguratie',1,18,configuration,[ids.configControl])
);

const systemConfigJson = JSON.stringify(DEFAULT_SYSTEM_CONFIG);
flows.push({
  id: ids.configControl, type:'function', z:FLOW_ID, name:'Beheer lokale ESS-configuratie',
  func:`const defaults = ${systemConfigJson};
const states = ((global.get('homeassistant') || {}).homeAssistant || {}).states || {};
const clone = (value) => JSON.parse(JSON.stringify(value));
const entityPattern = /^(?:sensor|binary_sensor|select|number|switch|light|climate|water_heater|weather|sun|device_tracker|lock|update|input_number|input_boolean|input_select)\.[a-z0-9_]+$/;
const ranges = {
    phases:[1,3], voltage:[100,260], mainFuseA:[6,100], batteryCapacityKwh:[1,500], inverterRatedPowerKw:[1,500],
    maximumBatteryPowerKw:[0.1,500], evBatteryCapacityKwh:[1,500], evMaximumCurrentA:[6,80], evGridChargePowerKw:[1,100], gridImportBufferW:[0,5000]
};
function normalize(input) {
    const source = input && typeof input === 'object' ? input : {};
    const config = clone(defaults);
    config.siteName = String(source.siteName || defaults.siteName).replace(/[<>]/g, '').trim().slice(0, 60) || defaults.siteName;
    for (const key of Object.keys(config.modules)) config.modules[key] = source.modules && typeof source.modules[key] === 'boolean' ? source.modules[key] : defaults.modules[key];
    for (const [key, fallback] of Object.entries(config.specs)) {
        const value = Number(source.specs && source.specs[key]);
        const [minimum, maximum] = ranges[key];
        config.specs[key] = Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value)) : fallback;
    }
    for (const canonical of Object.keys(config.entities)) {
        const value = String(source.entities && source.entities[canonical] || '').trim().toLowerCase();
        config.entities[canonical] = entityPattern.test(value) ? value : '';
    }
    return config;
}
function validate(config, discovery) {
    const required = [];
    if (config.modules.energy) required.push('sensor.p1_meter_vermogen','sensor.p1_meter_energie_import','sensor.p1_meter_energie_export');
    if (config.modules.battery) required.push('sensor.growatt_battery_battery_soc','sensor.growatt_battery_battery_power');
    if (config.modules.inverter) required.push(
        'sensor.growatt_solar_system_output_power',
        'select.growatt_mode_vpp',
        'number.growatt_vpp_power_rate',
        'number.growatt_battery_remote_charge_and_discharge_power',
        'number.growatt_grid_remote_power_control_charging_time',
        'select.growatt_grid_remote_power_control_enable'
    );
    if (config.modules.ev) required.push('sensor.ev_charger_status','sensor.ev_state_of_charge');
    if (config.modules.lighting) required.push('light.zone_1');
    if (config.modules.climate) required.push('climate.cooling_zone_1');
    if (config.modules.nas) required.push('sensor.nas_cpu_gebruik_totaal');
    const missing = required.filter((canonical) => {
        const actual = config.entities[canonical];
        return !actual || !states[actual];
    });
    const unavailable = required.filter((canonical) => {
        const actual = config.entities[canonical];
        return actual && states[actual] && ['unknown','unavailable',''].includes(String(states[actual].state).toLowerCase());
    });
    if (config.modules.ev) {
        const current = config.entities['sensor.ev_charger_current'];
        const power = config.entities['sensor.ev_charger_power'];
        const currentOk = current && states[current];
        const powerOk = power && states[power];
        if (!currentOk && !powerOk) missing.push('sensor.ev_charger_current of sensor.ev_charger_power');
    }
    const uniqueMissing = [...new Set(missing)];
    if (discovery) discovery.unmatched = uniqueMissing.length;
    return { valid:uniqueMissing.length === 0, missing:uniqueMissing, unavailable:[...new Set(unavailable)], checkedAt:new Date().toISOString(), configuredEntities:Object.values(config.entities).filter(Boolean).length, discovery:discovery || null };
}

function discoverEntities(input) {
    const config = normalize(input);
    const simplify = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const entries = Object.entries(states).map(([id, item]) => {
        const attributes = item && item.attributes || {};
        const nameText = simplify(id+' '+(attributes.friendly_name || ''));
        return { id, item:item || {}, attributes, domain:id.split('.')[0], nameText, text:simplify(nameText+' '+(attributes.device_class || '')+' '+(attributes.unit_of_measurement || '')) };
    }).sort((left, right) => left.id.localeCompare(right.id));
    const byId = new Map(entries.map((entry) => [entry.id, entry]));
    const used = new Set();
    const kept = new Set();
    const matches = [];
    const warnings = [];
    const present = (id) => Boolean(id && byId.has(id));
    const available = (entry) => entry && !['unknown','unavailable',''].includes(String(entry.item.state || '').toLowerCase());
    const assign = (role, actual, reason, allowShared) => {
        if (!actual || !present(actual)) return false;
        const current = config.entities[role];
        if (present(current)) { kept.add(role); used.add(current); return false; }
        if (!allowShared && used.has(actual)) return false;
        config.entities[role] = actual;
        used.add(actual);
        matches.push({ role, reason });
        return true;
    };
    const candidates = (domain, predicate) => entries.filter((entry) => entry.domain === domain && available(entry) && (!predicate || predicate(entry)));
    const ranked = (list, score, minimum) => list.map((entry) => ({ entry, score:score(entry) })).filter((item) => item.score >= (minimum || 1)).sort((left, right) => right.score-left.score || left.entry.id.localeCompare(right.entry.id));
    const choose = (list, score, minimum, exclude) => {
        const found = ranked(list.filter((entry) => !used.has(entry.id) && (!exclude || !exclude.has(entry.id))), score, minimum);
        return found.length ? found[0].entry : null;
    };
    const powerSensor = (entry) => entry.domain === 'sensor' && (simplify(entry.attributes.device_class) === 'power' || /(?:^|\s)(?:w|kw)(?:\s|$)/.test(' '+simplify(entry.attributes.unit_of_measurement)+' '));
    const tempSensor = (entry) => entry.domain === 'sensor' && (simplify(entry.attributes.device_class) === 'temperature' || /(?:temperatuur|temperature)/.test(entry.text));

    // Een WIT-totaal of losse fase is nooit een losse PV-omvormer.
    for (let index=1; index<=3; index+=1) {
        const role = 'sensor.pv_array_'+index+'_power';
        const current = byId.get(config.entities[role]);
        if (current && /(?:growatt|phase_[rst]|fase_[123]|ac.power.phase)/.test(current.text)) config.entities[role] = '';
    }

    // Exact bestaande entiteiten zijn altijd de veiligste koppeling.
    for (const role of Object.keys(config.entities)) {
        const current = config.entities[role];
        if (present(current)) { kept.add(role); used.add(current); }
        else if (present(role)) assign(role, role, 'exact');
    }

    // Laadpunten: status plus entiteiten met dezelfde apparaatstam.
    const chargerStates = new Set(['charging','awaiting_start','ready_to_charge','completed','disconnected','paused','stopped']);
    const chargerStatusCandidates = candidates('sensor', (entry) => {
        const attrs = entry.attributes;
        return attrs.state_outputPhase !== undefined || attrs.config_phaseMode !== undefined || (/(?:easee|charger|laadpunt|laadpaal|evse)/.test(entry.text) && (/(?:status|state)/.test(entry.text) || chargerStates.has(simplify(entry.item.state))));
    });
    const chargerScore = (entry) => (/easee/.test(entry.text)?7:0)+(/(?:charger|laadpunt|laadpaal|evse)/.test(entry.text)?5:0)+(/(?:status|state)/.test(entry.text)?3:0)+(chargerStates.has(simplify(entry.item.state))?4:0)+(entry.attributes.state_outputPhase !== undefined?4:0)+(entry.attributes.config_phaseMode !== undefined?4:0)+(entry.attributes.id !== undefined?2:0)+(!['disconnected','stopped'].includes(simplify(entry.item.state))?3:0);
    const chargerRanked = ranked(chargerStatusCandidates, chargerScore, 7).map((item) => item.entry);
    function chargerSibling(statusEntry, pattern, domains) {
        if (!statusEntry) return null;
        const root = statusEntry.id.replace(/^sensor\./, '').replace(/_(?:status|state)$/, '');
        const siblings = entries.filter((entry) => domains.includes(entry.domain) && entry.id.replace(/^[^.]+\./, '').startsWith(root));
        return choose(siblings, (entry) => (pattern.test(entry.text)?8:0)+(entry.id.includes(root)?4:0)+(available(entry)?3:0), 8);
    }
    const activeChargers = chargerRanked.filter((entry) => !['disconnected','stopped','completed'].includes(simplify(entry.item.state)));
    const chargerOrderIsClear = chargerRanked.length <= 1 || activeChargers.length === 1;
    const firstCharger = chargerOrderIsClear ? (activeChargers[0] || chargerRanked[0] || null) : null;
    if (firstCharger) {
        assign('sensor.ev_charger_status', firstCharger.id, 'charger-status');
        const chargerPower = chargerSibling(firstCharger, /(?:vermogen|power)/, ['sensor']);
        const chargerCurrent = chargerSibling(firstCharger, /(?:laadstroom|stroom|current|ampere)/, ['sensor']);
        const chargerEnergy = chargerSibling(firstCharger, /(?:kosten.*dag|cost.*day|energy.*today|energie.*vandaag|session.*energy|sessie.*energie|total.*energy)/, ['sensor']);
        const chargerOnline = chargerSibling(firstCharger, /(?:online|connect)/, ['binary_sensor']);
        if (chargerPower) assign('sensor.ev_charger_power', chargerPower.id, 'charger-sibling');
        if (chargerCurrent) assign('sensor.ev_charger_current', chargerCurrent.id, 'charger-sibling');
        if (chargerEnergy) assign('sensor.ev_charger_energy_today', chargerEnergy.id, 'charger-sibling');
        if (chargerOnline) assign('binary_sensor.ev_charger_online', chargerOnline.id, 'charger-sibling');
    }
    const secondCharger = chargerOrderIsClear ? (chargerRanked.find((entry) => !firstCharger || entry.id !== firstCharger.id) || null) : null;
    if (chargerRanked.length > 1) warnings.push(chargerOrderIsClear ? 'Meerdere laadpunten gevonden; controleer welk laadpunt primair is.' : 'Meerdere inactieve laadpunten gevonden; koppel primair en tweede laadpunt handmatig.');
    if (secondCharger) {
        assign('sensor.ev_charger_2_status', secondCharger.id, 'second-charger-status');
        const secondPower = chargerSibling(secondCharger, /(?:vermogen|power)/, ['sensor']);
        const secondEnergy = chargerSibling(secondCharger, /(?:kosten.*dag|cost.*day|energy.*today|energie.*vandaag|session.*energy|sessie.*energie|total.*energy)/, ['sensor']);
        if (secondPower) assign('sensor.ev_charger_2_power', secondPower.id, 'second-charger-sibling');
        if (secondEnergy) assign('sensor.ev_charger_2_energy_today', secondEnergy.id, 'second-charger-sibling');
    }

    // Voertuig: een SOC-sensor is alleen bruikbaar als batterij-, omvormer- en laadpuntmetingen zijn uitgesloten.
    const vehicleSoc = choose(candidates('sensor', (entry) => /(?:state.of.charge|\bsoc\b)/.test(entry.nameText) && !/(?:growatt|home.?battery|thuisaccu|charger|laadpunt|evse|target|doel|pv|solar|zonne)/.test(entry.nameText)), (entry) => (/state.of.charge/.test(entry.nameText)?9:4)+(/(?:vehicle|car|auto|audi|volkswagen|skoda|bmw|mercedes|tesla)/.test(entry.nameText)?5:0)+(/%/.test(simplify(entry.attributes.unit_of_measurement))?2:0), 12);
    if (vehicleSoc) {
        assign('sensor.ev_state_of_charge', vehicleSoc.id, 'vehicle-soc');
        const stem = vehicleSoc.id.replace(/^sensor\./, '').replace(/_(?:state_of_charge|soc)$/, '');
        const stemEntries = entries.filter((entry) => entry.id.replace(/^[^.]+\./, '').startsWith(stem));
        const targetSoc = choose(candidates('sensor', (entry) => /(?:target|doel).*(?:state.of.charge|soc)|(?:state.of.charge|soc).*(?:target|doel)/.test(entry.text)), (entry) => (entry.id.includes(stem)?6:0)+8, 8);
        const vehicleTemp = choose(stemEntries.filter(tempSensor), () => 8, 8);
        const vehicleLock = choose(stemEntries.filter((entry) => entry.domain === 'lock'), () => 8, 8);
        const vehicleTracker = choose(stemEntries.filter((entry) => entry.domain === 'device_tracker'), () => 8, 8);
        if (targetSoc) assign('sensor.ev_target_state_of_charge', targetSoc.id, 'vehicle-target-soc');
        if (vehicleTemp) assign('sensor.ev_temperature', vehicleTemp.id, 'vehicle-sibling');
        if (vehicleLock) assign('lock.ev', vehicleLock.id, 'vehicle-sibling');
        if (vehicleTracker) assign('device_tracker.ev_position', vehicleTracker.id, 'vehicle-sibling');
    }

    // Verlichting: groepen en kamers krijgen voorrang boven losse lampen.
    const lightEntries = candidates('light');
    const lightRanked = ranked(lightEntries, (entry) => (entry.attributes.is_hue_group===true?10:0)+(/(?:group|groep|room|ruimte|zone)/.test(entry.text)?5:0)+((entry.attributes.supported_color_modes || []).length?1:0), 1).map((item) => item.entry);
    for (let index=0; index<Math.min(8, lightRanked.length); index+=1) assign('light.zone_'+(index+1), lightRanked[index].id, 'light-group');
    if (lightRanked.length > 8) warnings.push('Meer dan acht lichtzones gevonden; controleer de selectie.');

    // Klimaat: capabilities bepalen de hoofdindeling; namen dienen alleen als extra aanwijzing.
    const climateEntries = candidates('climate');
    const modes = (entry) => (entry.attributes.hvac_modes || []).map(simplify);
    const heatPump = choose(climateEntries, (entry) => (/(?:warmtepomp|heat.?pump)/.test(entry.text)?10:0)+(modes(entry).includes('heat')?2:0), 10);
    if (heatPump) assign('climate.heat_pump', heatPump.id, 'heat-pump');
    const cooling = ranked(climateEntries.filter((entry) => !heatPump || entry.id !== heatPump.id), (entry) => (modes(entry).includes('cool')?7:0)+(/(?:airco|cooling|koel)/.test(entry.text)?6:0), 7).map((item) => item.entry);
    for (let index=0; index<Math.min(4, cooling.length); index+=1) {
        const role = 'climate.cooling_zone_'+(index+1);
        if (assign(role, cooling[index].id, 'cooling-zone')) {
            const climateStem = cooling[index].id.replace(/^climate\./, '');
            const temperature = choose(entries.filter((entry) => tempSensor(entry) && (entry.id.includes(climateStem) || climateStem.includes(entry.id.replace(/^sensor\./, '').replace(/_(?:temperature|temperatuur).*$/, '')))), () => 8, 8);
            if (temperature) assign('sensor.cooling_zone_'+(index+1)+'_temperature', temperature.id, 'cooling-temperature');
        }
    }
    const coolingIds = new Set(cooling.map((entry) => entry.id));
    const heating = ranked(climateEntries.filter((entry) => (!heatPump || entry.id !== heatPump.id) && !coolingIds.has(entry.id)), (entry) => (modes(entry).includes('heat')||modes(entry).includes('auto')?5:0)+(/(?:tado|verwarm|heating|radiator|thermost)/.test(entry.text)?6:0), 5).map((item) => item.entry);
    for (let index=0; index<Math.min(3, heating.length); index+=1) assign('climate.heating_zone_'+(index+1), heating[index].id, 'heating-zone');
    const waterHeater = candidates('water_heater')[0];
    if (waterHeater) assign('water_heater.domestic_hot_water', waterHeater.id, 'water-heater');
    const weather = candidates('weather')[0];
    if (weather) assign('weather.home', weather.id, 'weather');
    const outdoorTemperature = choose(candidates('sensor', tempSensor), (entry) => (/(?:buiten|outdoor|outside)/.test(entry.text)?10:0)+(/(?:temperatuur|temperature)/.test(entry.text)?3:0), 10);
    if (outdoorTemperature) assign('sensor.outdoor_temperature', outdoorTemperature.id, 'outdoor-temperature');

    // Configureerbare verbruikers: koppel alleen unieke, herkenbare vermogensmetingen.
    const loadPatterns = [/(?:compressor)/,/(?:office|kantoor)/,/(?:laundry|wasmachine|droger|wassen)/,/(?:warmtepomp|heat.?pump)/,/(?:airco|cooling).*(?:office|kantoor)|(?:office|kantoor).*(?:airco|cooling)/,/(?:airco|cooling).*(?:attic|zolder)|(?:attic|zolder).*(?:airco|cooling)/,/(?:jacuzzi|spa)/];
    const loadPowerEntries = entries.filter((entry) => powerSensor(entry));
    for (let index=0; index<loadPatterns.length; index+=1) {
        const pattern = loadPatterns[index];
        const options = loadPowerEntries.filter((entry) => pattern.test(entry.text) && !/(?:total|totaal|grid|net|battery|accu|solar|pv)/.test(entry.text));
        if (options.length === 1) assign('sensor.flex_load_'+(index+1)+'_power', options[0].id, 'flex-load-power');
        if (index === 0) {
            const switches = candidates('switch', (entry) => pattern.test(entry.text));
            if (switches.length === 1) assign('switch.flex_load_1', switches[0].id, 'flex-load-switch');
        }
    }

    // Losse PV-omvormers, zonder net-, accu- of WIT-totaalmetingen mee te nemen.
    const pvPower = ranked(entries.filter((entry) => powerSensor(entry) && /(?:pv|solar|zonne|inverter|omvormer)/.test(entry.text) && !/(?:growatt|grid|net|battery|accu|load|house|woning|charger|laad|system.output|solar.total|phase_[rst]|fase_[123])/i.test(entry.text)), (entry) => (/(?:uitgangsvermogen|output.power)/.test(entry.text)?10:0)+(/(?:system.power|inverter.power|omvormer.*vermogen)/.test(entry.text)?6:0), 6).map((item) => item.entry);
    for (let index=0; index<Math.min(3, pvPower.length); index+=1) assign('sensor.pv_array_'+(index+1)+'_power', pvPower[index].id, 'pv-power');
    if (pvPower.length > 3) warnings.push('Meer dan drie losse PV-vermogens gevonden; controleer de selectie.');
    const siteSolarToday = choose(candidates('sensor', (entry) => /(?:total|totaal).*(?:energy|energie).*(?:today|vandaag)|(?:energy|energie).*(?:today|vandaag).*(?:total|totaal)/.test(entry.text) && /(?:pv|solar|zonne)/.test(entry.text) && !/^sensor\.ess_/.test(entry.id)), () => 8, 8);
    if (siteSolarToday) assign('sensor.site_solar_energy_today', siteSolarToday.id, 'site-solar-today');

    // NAS: eerst de apparaatstam uit een expliciete NAS/DSM/Synology CPU-meting afleiden.
    const nasCpu = choose(candidates('sensor', (entry) => /(?:nas|synology|dsm)/.test(entry.text) && /(?:cpu|processor)/.test(entry.text)), (entry) => (/(?:nas|synology|dsm)/.test(entry.text)?8:0)+(/(?:cpu|processor)/.test(entry.text)?7:0)+(/(?:total|totaal|usage|gebruik)/.test(entry.text)?2:0), 15);
    if (nasCpu) {
        assign('sensor.nas_cpu_gebruik_totaal', nasCpu.id, 'nas-cpu');
        const raw = nasCpu.id.replace(/^sensor\./, '');
        const marker = raw.search(/_(?:cpu|processor)/);
        const prefix = marker > 0 ? raw.slice(0, marker) : raw.split('_')[0];
        const nasEntries = entries.filter((entry) => entry.id.replace(/^[^.]+\./, '').startsWith(prefix+'_') || entry.id.replace(/^[^.]+\./, '') === prefix);
        const nasRules = [
            ['sensor.nas_geheugengebruik_fysiek','sensor',/(?:memory|geheugen).*(?:physical|fysiek|usage|gebruik)|(?:physical|fysiek).*(?:memory|geheugen)/],
            ['sensor.nas_temperatuur','sensor',/(?:system|systeem).*(?:temperature|temperatuur)|^(?=.*(?:temperature|temperatuur))(?!.*(?:drive|disk|schijf)).*$/],
            ['sensor.nas_download_doorvoer','sensor',/(?:download|receive|ontvang).*(?:throughput|doorvoer|rate|speed)?/],
            ['sensor.nas_upload_doorvoer','sensor',/(?:upload|send|verzend).*(?:throughput|doorvoer|rate|speed)?/],
            ['sensor.nas_drive_2_status','sensor',/(?:drive|disk|schijf).*(?:status|health|gezondheid)/],
            ['sensor.nas_drive_2_temperatuur','sensor',/(?:drive|disk|schijf).*(?:temperature|temperatuur)/],
            ['sensor.nas_volume_1_status','sensor',/(?:volume).*(?:status|health|gezondheid)/],
            ['sensor.nas_volume_1_gebruikte_ruimte','sensor',/(?:volume).*(?:used|gebruikte).*(?:space|ruimte)/],
            ['sensor.nas_volume_1_volume_gebruikt','sensor',/(?:volume).*(?:used|gebruikt|percentage|percent)/],
            ['binary_sensor.nas_beveiligingsstatus','binary_sensor',/(?:security|beveilig).*(?:status)?/],
            ['update.nas_dsm_update','update',/(?:dsm|system|systeem|firmware|update)/],
            ['select.nas_fan_speed_mode','select',/(?:fan|ventilator).*(?:speed|snelheid|mode|modus)/]
        ];
        for (const [role, domain, pattern] of nasRules) {
            const options = nasEntries.filter((entry) => entry.domain === domain && pattern.test(entry.text));
            if (options.length === 1) assign(role, options[0].id, 'nas-sibling');
        }
        const securityEntries = nasEntries.filter((entry) => entry.domain === 'binary_sensor' && /(?:drive|disk|schijf).*(?:sector|life|levensduur)/.test(entry.text));
        if (securityEntries[0]) assign('binary_sensor.nas_drive_2_maximum_slechte_sectoren_overschreden', securityEntries[0].id, 'nas-drive-warning');
        if (securityEntries[1]) assign('binary_sensor.nas_drive_2_onder_de_minimale_resterende_levensduur', securityEntries[1].id, 'nas-drive-warning');
    }

    return { config, discovery:{ matched:matches.length, kept:kept.size, unmatched:0, warnings } };
}

let config = flow.get('ess_system_config') || defaults;
let persist = false;
let discovery = null;
if (msg.topic === 'ess/config/reset' && msg.payload === true) {
    config = clone(defaults);
    persist = true;
} else if (msg.topic === 'ess/config/save' || msg.topic === 'ess/config/validate') {
    config = normalize(msg.payload);
    persist = msg.topic === 'ess/config/save';
} else if (msg.topic === 'ess/config/discover') {
    const result = discoverEntities(msg.payload);
    config = result.config;
    discovery = result.discovery;
} else if (msg.topic === 'ess/config/restore' || [${JSON.stringify(SYSTEM_CONFIG_PATH)}, ${JSON.stringify(SYSTEM_CONFIG_BACKUP_PATH)}].includes(String(msg.filename || ''))) {
    try { config = normalize(typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload); }
    catch (error) { node.warn('Lokale ESS-configuratie kon niet worden gelezen: '+error.message); config = normalize(config); }
} else {
    config = normalize(config);
}
const status = validate(config, discovery);
flow.set('ess_system_config', config);
flow.set('ess_system_config_status', status);
if (config.modules.ev === false) {
    flow.set('ess_audi_smart_enabled', false);
    flow.set('ess_audi_force_full', false);
}
if (config.modules.battery === false || config.modules.inverter === false) {
    flow.set('ess_wit_export_mode', 'off');
    flow.set('ess_wit_grid_charge_mode', 'off');
}
node.status({ fill:status.valid?'green':'yellow', shape:status.valid?'dot':'ring', text:status.valid?'configuratie geldig':status.missing.length+' koppeling(en) ontbreken' });
const refresh = { payload:Date.now(), topic:'ess/config/updated' };
const write = persist ? { payload:JSON.stringify(config, null, 2) } : null;
return [refresh, write];`,
  outputs:2, timeout:0, noerr:0,
  initialize:`if (!flow.get('ess_system_config')) flow.set('ess_system_config', ${systemConfigJson});`, finalize:'', libs:[],
  x:520, y:740, wires:[[MAPPER_ID, CONTROL_ID, 'ess00000000000d', ids.witExportControl, ids.witEVControl, ids.witGridChargeControl],[ids.configFileWrite, ids.configBackupWrite]]
});
flows.push({
  id:ids.configReadInject, type:'inject', z:FLOW_ID, name:'Herstel lokale ESS-configuratie',
  props:[{p:'payload'},{p:'topic',vt:'str'}], repeat:'', crontab:'', once:true, onceDelay:0.8,
  topic:'ess/config/restore', payload:'', payloadType:'date', x:170, y:740, wires:[[ids.configBackupRead, ids.configReadDelay]]
});
flows.push({
  id:ids.configReadDelay, type:'delay', z:FLOW_ID, name:'Hoofdconfiguratie heeft voorrang',
  pauseType:'delay', timeout:'0.4', timeoutUnits:'seconds', rate:'1', nbRateUnits:'1', rateUnits:'second', randomFirst:'1', randomLast:'5', randomUnits:'seconds', drop:false, allowrate:false,
  x:390, y:780, wires:[[ids.configFileRead]]
});
flows.push({
  id:ids.configBackupRead, type:'file in', z:FLOW_ID, name:'Lees lokale configuratieback-up',
  filename:SYSTEM_CONFIG_BACKUP_PATH, filenameType:'str', format:'utf8', chunk:false, sendError:false, encoding:'none', allProps:true,
  x:400, y:700, wires:[[ids.configControl]]
});
flows.push({
  id:ids.configFileRead, type:'file in', z:FLOW_ID, name:'Lees privéconfiguratie buiten Git',
  filename:SYSTEM_CONFIG_PATH, filenameType:'str', format:'utf8', chunk:false, sendError:false, encoding:'none', allProps:true,
  x:350, y:700, wires:[[ids.configControl]]
});
flows.push({
  id:ids.configFileWrite, type:'file', z:FLOW_ID, name:'Bewaar privéconfiguratie buiten Git',
  filename:SYSTEM_CONFIG_PATH, filenameType:'str', appendNewline:false, createDir:true, overwriteFile:'true', encoding:'none',
  x:830, y:740, wires:[[]]
});
flows.push({
  id:ids.configBackupWrite, type:'file', z:FLOW_ID, name:'Bewaar automatische configuratieback-up',
  filename:SYSTEM_CONFIG_BACKUP_PATH, filenameType:'str', appendNewline:false, createDir:true, overwriteFile:'true', encoding:'none',
  x:850, y:790, wires:[[]]
});

flows.push({
  id: ids.climateDevice, type: 'api-render-template', z: FLOW_ID,
  name: 'Vind gekoppelde EV voor klimaat', server: 'ess00000000000b', version: 0,
  template: "{{ device_id('device_tracker.ev_position') or '' }}",
  resultsLocation: 'payload.deviceId', resultsLocationType: 'msg', templateLocation: '', templateLocationType: 'none',
  x: 1170, y: 210, wires: [[ids.climateAction]]
});
flows.push({
  id: ids.climateAction, type: 'api-call-service', z: FLOW_ID,
  name: 'Start EV klimaat op 21 graden', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'audiconnect.start_climate_control', floorId: [], areaId: [], deviceId: [], entityId: [], labelId: [],
  data: '{"device_id": payload.deviceId, "temp_c": payload.tempC, "glass_heating": false}', dataType: 'jsonata', mergeContext: '', mustacheAltTags: false,
  outputProperties: [], queue: 'none', blockInputOverrides: true, domain: 'audiconnect', service: 'start_climate_control',
  x: 1420, y: 210, wires: [[]]
});
flows.push({
  id: ids.vehicleDevice, type: 'api-render-template', z: FLOW_ID,
  name: 'Vind gekoppelde EV voor slot', server: 'ess00000000000b', version: 0,
  template: "{{ device_id('device_tracker.ev_position') or '' }}",
  resultsLocation: 'payload.deviceId', resultsLocationType: 'msg', templateLocation: '', templateLocationType: 'none',
  x: 1170, y: 250, wires: [[ids.vehicleAction]]
});
flows.push({
  id: ids.vehicleAction, type: 'api-call-service', z: FLOW_ID,
  name: 'Vergrendel of ontgrendel EV', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'audiconnect.execute_vehicle_action', floorId: [], areaId: [], deviceId: [], entityId: [], labelId: [],
  data: '{"device_id": payload.deviceId, "action": payload.action}', dataType: 'jsonata', mergeContext: '', mustacheAltTags: false,
  outputProperties: [], queue: 'none', blockInputOverrides: true, domain: 'audiconnect', service: 'execute_vehicle_action',
  x: 1420, y: 250, wires: [[]]
});

flows.push({
  id: ids.loadsControl, type: 'function', z: FLOW_ID, name: 'Veilige bediening verbruikers',
  func: `const moduleConfig = flow.get('ess_system_config') || ${systemConfigJson};
if (moduleConfig.modules && moduleConfig.modules.loads === false) return null;
if (msg.topic !== 'ess/load/toggle') return null;
const key = String(msg.payload || '');
if (key !== 'compressor') {
    node.warn('Onbekende verbruikersopdracht geweigerd.');
    return null;
}
const config = moduleConfig;
const entityId = config.entities && config.entities['switch.flex_load_1'];
if (!entityId) return null;
return { payload: { target:{ entity_id:[entityId] } } };`,
  outputs: 1, timeout: 0, noerr: 0, initialize: '', finalize: '', libs: [], x: 1110, y: 360,
  wires: [[ids.compressorAction]]
});
flows.push({
  id: ids.compressorAction, type: 'api-call-service', z: FLOW_ID, name: 'Schakel compressor', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'switch.toggle', floorId: [], areaId: [], deviceId: [], entityId: [], labelId: [],
  data: '{}', dataType: 'json', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: false,
  domain: 'switch', service: 'toggle', x: 1390, y: 330, wires: [[]]
});

flows.push({
  id: ids.p1HistoryInject, type: 'inject', z: FLOW_ID, name: 'Controleer P1-dagstart',
  props: [{ p:'payload' },{ p:'topic', vt:'str' }], repeat: '60', crontab: '', once: true, onceDelay: 20,
  topic: '', payload: '', payloadType: 'date', x: 180, y: 280, wires: [[ids.p1HistoryPrepare]]
});
flows.push({
  id: ids.p1HistoryPrepare, type: 'function', z: FLOW_ID, name: 'Bereid P1-daghistorie voor',
  func: `const now = new Date();
const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const end = new Date(Math.min(now.getTime(), start.getTime() + 5 * 60 * 1000));
msg.p1DayKey = [start.getFullYear(), String(start.getMonth() + 1).padStart(2, '0'), String(start.getDate()).padStart(2, '0')].join('-');
const config = flow.get('ess_system_config') || ${systemConfigJson};
const importEntityId = config.entities && config.entities['sensor.p1_meter_energie_import'] || 'sensor.p1_meter_energie_import';
const exportEntityId = config.entities && config.entities['sensor.p1_meter_energie_export'] || 'sensor.p1_meter_energie_export';
msg.p1HistoryEntityIds = { importEntityId, exportEntityId };
const stored = flow.get('ess_p1_daily_baseline') || {};
if (stored.dayKey === msg.p1DayKey && Number.isFinite(Number(stored.importStart)) && Number.isFinite(Number(stored.exportStart))) {
    return null;
}
msg.payload = {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    entityId: importEntityId+','+exportEntityId,
    entityIdType: 'equals',
    flatten: false
};
return msg;`,
  outputs: 1, timeout: 0, noerr: 0, initialize: '', finalize: '', libs: [], x: 430, y: 280,
  wires: [[ids.p1History]]
});
flows.push({
  id: ids.p1History, type: 'api-get-history', z: FLOW_ID, name: 'Lees P1-standen bij middernacht', server: 'ess00000000000b', version: 1,
  startDate: '', endDate: '', entityId: '', entityIdType: 'equals', useRelativeTime: false, relativeTime: '', flatten: false,
  outputType: 'array', outputLocationType: 'msg', outputLocation: 'payload', x: 720, y: 280,
  wires: [[ids.p1HistoryStore]]
});
flows.push({
  id: ids.p1HistoryCatch, type: 'catch', z: FLOW_ID, name: 'Vang P1-verbindingsfout op', scope: [ids.p1History], uncaught: false,
  x: 430, y: 325, wires: []
});
flows.push({
  id: ids.p1HistoryStore, type: 'function', z: FLOW_ID, name: 'Bewaar P1-dagstart',
  func: `const groups = Array.isArray(msg.payload) ? msg.payload : [];
const entries = groups.flatMap((group) => Array.isArray(group) ? group : [group]).filter(Boolean);
const first = {};
for (const item of entries) {
    const entityId = String(item.entity_id || '');
    const state = Number(item.state);
    if (!Number.isFinite(state) || first[entityId] !== undefined) continue;
    first[entityId] = state;
}
const importEntityId = msg.p1HistoryEntityIds && msg.p1HistoryEntityIds.importEntityId || 'sensor.p1_meter_energie_import';
const exportEntityId = msg.p1HistoryEntityIds && msg.p1HistoryEntityIds.exportEntityId || 'sensor.p1_meter_energie_export';
const importStart = first[importEntityId];
const exportStart = first[exportEntityId];
if (!Number.isFinite(importStart) || !Number.isFinite(exportStart) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(String(msg.p1DayKey || ''))) {
    node.warn('P1-dagstart kon niet uit Home Assistant-historie worden gelezen.');
    return null;
}
flow.set('ess_p1_daily_baseline', { dayKey: msg.p1DayKey, importStart, exportStart, updatedAt: new Date().toISOString() });
node.status({ fill:'green', shape:'dot', text:'P1-dagstart '+msg.p1DayKey });
return null;`,
  outputs: 0, timeout: 0, noerr: 0, initialize: '', finalize: '', libs: [], x: 1010, y: 280,
  wires: []
});

flows.push({
  id: ids.witExportInject, type: 'inject', z: FLOW_ID, name: 'Bewaak WIT-exportlimiet',
  props: [{ p:'payload' },{ p:'topic', vt:'str' }], repeat: '60', crontab: '', once: true, onceDelay: 30,
  topic: '', payload: '', payloadType: 'date', x: 180, y: 980, wires: [[ids.witExportControl]]
});
flows.push({
  id: ids.witExportModeControl, type: 'function', z: FLOW_ID, name: 'Handmatige WIT-exportstand',
  func: `if (msg.topic !== 'ess/wit/export-mode') return null;
const mode = String(msg.payload || '').toLowerCase();
if (!['auto','on','off'].includes(mode)) {
    node.warn('Ongeldige WIT-exportstand geweigerd');
    return null;
}
flow.set('ess_wit_export_mode', mode);
const label = mode === 'on' ? 'handmatig aan' : mode === 'off' ? 'handmatig uit' : 'automatisch';
node.status({ fill:mode === 'auto' ? 'blue' : 'yellow', shape:'dot', text:label });
return { payload:Date.now() };`,
  outputs: 1, timeout: 0, noerr: 0, initialize: "flow.set('ess_wit_export_mode', 'auto');", finalize: '', libs: [], x: 190, y: 1040,
  wires: [[ids.witExportControl]]
});
flows.push({
  id: ids.witExportControl, type: 'function', z: FLOW_ID, name: 'Regel WIT-exportlimiet',
  func: `const ha = global.get('homeassistant');
const states = ha && ha.homeAssistant && ha.homeAssistant.states;
if (!states) {
    node.status({ fill:'red', shape:'ring', text:'Home Assistant niet beschikbaar' });
    return null;
}

const socEntity = states['sensor.growatt_battery_battery_soc'];
const authorityEntity = states['select.growatt_grid_control_authority'];
const exportEntity = states['select.growatt_grid_vpp_export_limit_enable'];
const rateEntity = states['number.growatt_grid_vpp_export_limit_power_rate'];
const unavailable = (item) => !item || ['unknown','unavailable',''].includes(String(item.state).toLowerCase());
const fresh = (item, maxAge) => {
    if (!item) return false;
    const timestamp = new Date(item.last_updated || item.last_changed || 0).getTime();
    const age = Date.now() - timestamp;
    return Number.isFinite(timestamp) && age >= -60000 && age <= maxAge;
};
if (unavailable(exportEntity)) {
    node.status({ fill:'red', shape:'ring', text:'WIT-bediening niet beschikbaar' });
    return null;
}

const exportState = String(exportEntity.state).toLowerCase();
if (!['enabled','disabled'].includes(exportState)) {
    node.status({ fill:'red', shape:'ring', text:'Exportstatus onbekend' });
    return null;
}
const exportEnabled = exportState === 'enabled';
const storedMode = String(flow.get('ess_wit_export_mode') || 'auto').toLowerCase();
const mode = ['on','off'].includes(storedMode) ? storedMode : 'auto';
let soc = null;
let audiNeedsSolar = false;
let solarSoc = null;
let audiSoc = null;
if (mode === 'auto') {
    if (unavailable(socEntity)) {
        node.status({ fill:'yellow', shape:'ring', text:'SOC-data niet beschikbaar' });
        return null;
    }
    soc = Number(socEntity.state);
    const growattTelemetryFresh = [
        'sensor.growatt_battery_battery_power',
        'sensor.growatt_solar_system_output_power',
        'sensor.growatt_grid_grid_power'
    ].some((id) => fresh(states[id], 2 * 60 * 1000));
    const socUsable = fresh(socEntity, 20 * 60 * 1000) || growattTelemetryFresh;
    if (!Number.isFinite(soc) || soc < 0 || soc > 100 || !socUsable) {
        node.status({ fill:'yellow', shape:'ring', text:'SOC-data ongeldig of te oud' });
        return null;
    }

    const audiStatusEntity = states['sensor.ev_charger_status'];
    const audiSocEntity = states['sensor.ev_state_of_charge'];
    const vehicleTargetEntity = states['sensor.ev_target_state_of_charge'];
    const audiStatus = audiStatusEntity ? String(audiStatusEntity.state).toLowerCase() : '';
    const connectedStatuses = ['awaiting_start','awaiting_authorization','ready_to_charge','charging','paused','completed'];
    const storedEVSettings = flow.get('ess_audi_settings') || {};
    const configuredSolarSoc = Number(storedEVSettings.solarSoc);
    const vehicleTargetSoc = vehicleTargetEntity && Number.isFinite(Number(vehicleTargetEntity.state)) ? Number(vehicleTargetEntity.state) : 100;
    solarSoc = Math.min(Number.isFinite(configuredSolarSoc) ? Math.max(20, Math.min(100, configuredSolarSoc)) : 100, vehicleTargetSoc);
    audiSoc = audiSocEntity && !unavailable(audiSocEntity) ? Number(audiSocEntity.state) : null;
    audiNeedsSolar = connectedStatuses.includes(audiStatus) && Number.isFinite(audiSoc) && audiSoc >= 0 && audiSoc < solarSoc;
}

const targetRate = 1; // 1% van 18 kW is circa 180 W toegestane teruglevering.
const audiDischargeStatus = flow.get('ess_wit_audi_discharge_status') || {};
const audiDischargeBusy = audiDischargeStatus.sessionOwned === true;
const gridChargeStatus = flow.get('ess_wit_grid_charge_status') || {};
const gridChargeBusy = gridChargeStatus.sessionOwned === true;
const targetEnabled = !audiDischargeBusy && !gridChargeBusy && (mode === 'on' || (mode === 'auto' && soc < 90 && !audiNeedsSolar));
const label = mode === 'on'
    ? 'Handmatig aan'
    : mode === 'off'
        ? 'Handmatig uit'
        : audiNeedsSolar
            ? 'Automatisch · EV '+Math.round(audiSoc)+'/'+Math.round(solarSoc)+'%'
            : audiDischargeBusy
                ? 'Automatisch · EV-accubuffer actief'
                : gridChargeBusy
                    ? 'Automatisch · WIT-netladen actief'
                : 'Automatisch · thuisaccu '+Math.round(soc)+'%';

if (targetEnabled) {
    if (unavailable(authorityEntity)) {
        node.status({ fill:'red', shape:'ring', text:'Growatt-hoofdtoestemming niet beschikbaar' });
        return null;
    }
    const authorityState = String(authorityEntity.state).toLowerCase();
    if (!['enabled','disabled'].includes(authorityState)) {
        node.status({ fill:'red', shape:'ring', text:'Growatt-hoofdtoestemming onbekend' });
        return null;
    }
    if (authorityState !== 'enabled') {
        node.status({ fill:'yellow', shape:'dot', text:label+' · hoofdtoestemming inschakelen' });
        return [{ payload:{ option:'Enabled' } }, null, null];
    }
    if (unavailable(rateEntity)) {
        node.status({ fill:'red', shape:'ring', text:'Exportgrens niet beschikbaar' });
        return null;
    }
    const rate = Number(rateEntity.state);
    if (!Number.isFinite(rate)) {
        node.status({ fill:'red', shape:'ring', text:'Exportgrens niet beschikbaar' });
        return null;
    }
    if (Math.abs(rate - targetRate) >= 0.01) {
        node.status({ fill:'yellow', shape:'dot', text:label+' · grens instellen' });
        return [null, { payload:{ value:targetRate } }, null];
    }
    if (exportEnabled && Math.abs(rate - targetRate) < 0.01) {
        node.status({ fill:'green', shape:'dot', text:label+' · limiet aan' });
        return null;
    }
    node.status({ fill:'yellow', shape:'dot', text:label+' · inschakelen' });
    return [null, null, { payload:{ option:'Enabled' } }];
}

if (exportEnabled) {
    node.status({ fill:'yellow', shape:'dot', text:label+' · uitschakelen' });
    return [null, null, { payload:{ option:'Disabled' } }];
}
node.status({ fill:'grey', shape:'dot', text:label+' · limiet uit' });
return null;`,
  outputs: 3, timeout: 0, noerr: 0, initialize: '', finalize: '', libs: [], x: 440, y: 980,
  wires: [[ids.witExportAuthorityAction],[ids.witExportRateAction],[ids.witExportToggleAction]]
});
flows.push({
  id: ids.witExportAuthorityAction, type: 'api-call-service', z: FLOW_ID, name: 'Schakel Growatt-hoofdtoestemming in', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'select.select_option', floorId: [], areaId: [], deviceId: [], entityId: ['select.growatt_grid_control_authority'], labelId: [],
  data: '{"option":"Enabled"}', dataType: 'json', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'select', service: 'select_option', x: 760, y: 950, wires: [[]]
});
flows.push({
  id: ids.witExportRateAction, type: 'api-call-service', z: FLOW_ID, name: 'Stel WIT-exportgrens op circa 180 W', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'number.set_value', floorId: [], areaId: [], deviceId: [], entityId: ['number.growatt_grid_vpp_export_limit_power_rate'], labelId: [],
  data: '{"value":1}', dataType: 'json', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'number', service: 'set_value', x: 760, y: 1010, wires: [[]]
});
flows.push({
  id: ids.witExportToggleAction, type: 'api-call-service', z: FLOW_ID, name: 'Schakel WIT-exportlimiet', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'select.select_option', floorId: [], areaId: [], deviceId: [], entityId: ['select.growatt_grid_vpp_export_limit_enable'], labelId: [],
  data: '{"option":payload.option}', dataType: 'jsonata', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'select', service: 'select_option', x: 760, y: 1070, wires: [[]]
});

flows.push({
  id: ids.witEVBufferModeControl, type: 'function', z: FLOW_ID, name: 'Kies reserveprofiel EV-accubuffer',
  func: `if (msg.topic !== 'ess/wit/audi-buffer-mode') return null;
const mode = String(msg.payload || '').toLowerCase();
if (!['eco','normal','audi'].includes(mode)) {
    node.warn('Ongeldig reserveprofiel voor EV-accubuffer geweigerd');
    return null;
}
flow.set('ess_wit_audi_buffer_mode', mode);
const label = mode === 'eco' ? 'Eco' : mode === 'audi' ? 'EV voorrang' : 'Normaal';
node.status({ fill:mode === 'normal' ? 'blue' : 'yellow', shape:'dot', text:label });
return { payload:Date.now() };`,
  outputs: 1, timeout: 0, noerr: 0, initialize: "flow.set('ess_wit_audi_buffer_mode', 'normal');", finalize: '', libs: [], x: 190, y: 1230,
  wires: [[ids.witEVControl]]
});

flows.push({
  id: ids.witEVInject, type: 'inject', z: FLOW_ID, name: 'Bewaak EV-accubuffer',
  props: [{ p:'payload' },{ p:'topic', vt:'str' }], repeat: '60', crontab: '', once: true, onceDelay: 65,
  topic: '', payload: '', payloadType: 'date', x: 170, y: 1140, wires: [[ids.witEVControl]]
});
flows.push({
  id: ids.witEVControl, type: 'function', z: FLOW_ID, name: 'Regel WIT-ontlading voor EV',
  func: `const ha = global.get('homeassistant');
const states = ha && ha.homeAssistant && ha.homeAssistant.states;
const now = Date.now();
const previous = flow.get('ess_wit_audi_discharge_status') || {};
const batteryCapacityKwh = 30;
const batteryChargeEfficiency = 0.92;
const reserveProfiles = {
    eco: { label:'Eco', conservativeForecastFactor:0.60, houseReserveKwh:14, batteryRechargeTargetSoc:100, safetyFloorSoc:50, minimumBudgetKwh:1.5 },
    normal: { label:'Normaal', conservativeForecastFactor:0.65, houseReserveKwh:10, batteryRechargeTargetSoc:100, safetyFloorSoc:30, minimumBudgetKwh:0.75 },
    audi: { label:'EV voorrang', conservativeForecastFactor:0.75, houseReserveKwh:6, batteryRechargeTargetSoc:90, safetyFloorSoc:30, minimumBudgetKwh:0.5 }
};
const storedReserveMode = String(flow.get('ess_wit_audi_buffer_mode') || 'normal').toLowerCase();
const reserveMode = Object.prototype.hasOwnProperty.call(reserveProfiles, storedReserveMode) ? storedReserveMode : 'normal';
const reserveProfile = reserveProfiles[reserveMode];
const conservativeForecastFactor = reserveProfile.conservativeForecastFactor;
const houseReserveKwh = reserveProfile.houseReserveKwh;
const batteryRechargeTargetSoc = reserveProfile.batteryRechargeTargetSoc;
const inverterRatedPowerW = 18000;
const maximumBatteryPowerW = 8000;
const gridImportBufferW = 200;
const durationMinutes = 2;

function entity(id) { return states && states[id] ? states[id] : null; }
function unavailable(item) { return !item || ['unknown','unavailable',''].includes(String(item.state).toLowerCase()); }
function value(id) {
    const item = entity(id);
    if (unavailable(item)) return null;
    const number = Number(item.state);
    return Number.isFinite(number) ? number : null;
}
function fresh(id, maxAge) {
    const item = entity(id);
    if (!item) return false;
    const timestamp = new Date(item.last_updated || item.last_changed || 0).getTime();
    const age = now - timestamp;
    return Number.isFinite(timestamp) && age >= -60000 && age <= maxAge;
}
function energyKwh(item) {
    if (unavailable(item)) return null;
    const number = Number(item.state);
    if (!Number.isFinite(number)) return null;
    const unit = String((item.attributes || {}).unit_of_measurement || 'kWh').toLowerCase();
    if (unit === 'wh') return number / 1000;
    if (unit === 'mwh') return number * 1000;
    return number;
}
function save(status, fields = {}) {
    const next = {
        ...previous,
        ...fields,
        active: status === 'active',
        status: fields.status || previous.status || 'Stand-by',
        updatedAt: new Date(now).toISOString()
    };
    flow.set('ess_wit_audi_discharge_status', next);
    const fill = status === 'active' ? 'green' : status === 'blocked' ? 'yellow' : status === 'error' ? 'red' : 'grey';
    node.status({ fill, shape:status === 'error' ? 'ring' : 'dot', text:next.status });
    return next;
}
function stopOwnedSession(reason, details = {}) {
    const remoteState = String((entity('select.growatt_grid_remote_power_control_enable') || {}).state || '').toLowerCase();
    if (previous.sessionOwned === true && remoteState === 'enabled') {
        save('blocked', { ...details, sessionOwned:true, status:reason+' · ontlading stoppen' });
        return [null, null, null, { payload:{ option:'Disabled' } }, null];
    }
    save('blocked', { ...details, sessionOwned:false, powerPercent:0, targetPowerW:0, status:reason });
    return null;
}

if (!states) {
    save('error', { sessionOwned:previous.sessionOwned === true, status:'Home Assistant niet beschikbaar · korte opdracht loopt vanzelf af' });
    return null;
}

const soc = value('sensor.growatt_battery_battery_soc');
const gridPower = value('sensor.p1_meter_vermogen');
const audiControl = flow.get('ess_audi_control_status') || {};
const chargerPowerKw = value('sensor.ev_charger_power');
const chargerPowerW = chargerPowerKw === null ? null : chargerPowerKw * 1000;
const chargerCurrentA = value('sensor.ev_charger_current');
const chargerPhaseCount = Number(audiControl.phaseCount) === 1 ? 1 : 3;
const chargerState = String((entity('sensor.ev_charger_status') || {}).state || '').toLowerCase();
const dischargeCutoffSoc = value('number.growatt_discharge_cutoff_soc');
const remoteEntity = entity('select.growatt_grid_remote_power_control_enable');
const remoteState = unavailable(remoteEntity) ? '' : String(remoteEntity.state).toLowerCase();
const remotePowerPercent = value('number.growatt_battery_remote_charge_and_discharge_power');
const durationEntity = entity('number.growatt_grid_remote_power_control_charging_time');
const modeEntity = entity('select.growatt_mode_vpp');
const vppRateEntity = entity('number.growatt_vpp_power_rate');
const modeState = unavailable(modeEntity) ? '' : String(modeEntity.state).toLowerCase();
const exportEntity = entity('select.growatt_grid_vpp_export_limit_enable');
const exportState = unavailable(exportEntity) ? '' : String(exportEntity.state).toLowerCase();
const audiControlAge = now - new Date(audiControl.updatedAt || 0).getTime();
const commandedChargerPowerW = Math.max(0, Number(audiControl.targetCurrent) || 0) * 230 * chargerPhaseCount;
const currentForcedPowerW = previous.sessionOwned === true && remoteState === 'enabled' && remotePowerPercent !== null && remotePowerPercent < 0
    ? -remotePowerPercent / 100 * inverterRatedPowerW
    : 0;
const p1Fresh = gridPower !== null && fresh('sensor.p1_meter_vermogen', 15000);
const p1ObservedLoadW = p1Fresh ? Math.max(0, gridPower + currentForcedPowerW) : null;
const p1ChargingActive = chargerState === 'charging' && p1ObservedLoadW !== null && p1ObservedLoadW >= 1000;
const chargerPowerSource = chargerCurrentA !== null && chargerCurrentA >= 4
    ? 'easee_current'
    : chargerPowerW !== null && chargerPowerW >= 1000
        ? 'easee_power'
        : p1ChargingActive
            ? 'p1'
            : 'none';
const chargerPowerForControlW = chargerPowerSource === 'easee_current'
    ? chargerCurrentA * 230 * chargerPhaseCount
    : chargerPowerSource === 'easee_power'
        ? chargerPowerW
        : chargerPowerSource === 'p1'
            ? Math.min(commandedChargerPowerW, p1ObservedLoadW)
            : 0;
const chargerTelemetryActive = chargerPowerSource !== 'none';
const audiCharging = audiControl.controlled === true && Number(audiControl.targetCurrent) >= 6 && audiControlAge >= -60000 && audiControlAge <= 2 * 60 * 1000
    && (audiControl.actualCharging === true || chargerTelemetryActive)
    && ['charging','awaiting_start','awaiting_authorization','ready_to_charge'].includes(chargerState);
const exportMode = String(flow.get('ess_wit_export_mode') || 'auto').toLowerCase();
const gridChargeStatus = flow.get('ess_wit_grid_charge_status') || {};
const growattTelemetryFresh = [
    'sensor.growatt_battery_battery_power',
    'sensor.growatt_solar_system_output_power',
    'sensor.growatt_grid_grid_power'
].some((id) => fresh(id, 2 * 60 * 1000));
const socUsable = fresh('sensor.growatt_battery_battery_soc', 2 * 60 * 1000) || growattTelemetryFresh;

const tomorrowPrefix = 'sensor.energy_production_tomorrow';
const tomorrowItems = Object.entries(states).filter(([id]) => id === tomorrowPrefix || /^_[0-9]+$/.test(id.slice(tomorrowPrefix.length)));
const tomorrowReadings = tomorrowItems.map(([id, item]) => ({ id, value:energyKwh(item), fresh:fresh(id, 2 * 60 * 60 * 1000) }));
const forecastValid = tomorrowReadings.length > 0 && tomorrowReadings.every((item) => item.value !== null && item.value >= 0 && item.fresh);
const tomorrowForecastKwh = forecastValid ? tomorrowReadings.reduce((sum, item) => sum + item.value, 0) : null;
const conservativeForecastKwh = tomorrowForecastKwh === null ? null : tomorrowForecastKwh * conservativeForecastFactor;
const batteryMissingKwh = soc === null ? null : Math.max(0, batteryRechargeTargetSoc - Math.max(0, Math.min(100, soc))) / 100 * batteryCapacityKwh;
const batteryRefillInputKwh = batteryMissingKwh === null ? null : batteryMissingKwh / batteryChargeEfficiency;
const forecastHeadroomInputKwh = conservativeForecastKwh === null || batteryRefillInputKwh === null
    ? null
    : Math.max(0, conservativeForecastKwh - houseReserveKwh - batteryRefillInputKwh);
const forecastDischargeBudgetKwh = forecastHeadroomInputKwh === null ? null : forecastHeadroomInputKwh * batteryChargeEfficiency;
const safetyFloorSoc = Math.max(reserveProfile.safetyFloorSoc, (dischargeCutoffSoc === null ? 10 : dischargeCutoffSoc) + 5);
const floorBudgetKwh = soc === null ? null : Math.max(0, soc - safetyFloorSoc) / 100 * batteryCapacityKwh;
const safeDischargeBudgetKwh = forecastDischargeBudgetKwh === null || floorBudgetKwh === null
    ? null
    : Math.min(forecastDischargeBudgetKwh, floorBudgetKwh);
const details = {
    tomorrowForecastKwh,
    conservativeForecastKwh,
    houseReserveKwh,
    batteryRefillInputKwh,
    safeDischargeBudgetKwh,
    safetyFloorSoc,
    batterySoc:soc,
    reserveMode,
    reserveLabel:reserveProfile.label,
    batteryRechargeTargetSoc,
    minimumBudgetKwh:reserveProfile.minimumBudgetKwh,
    chargerCurrentA,
    chargerPowerW,
    chargerPowerForControlW,
    chargerPowerSource,
    chargerTelemetryActive,
    p1ObservedLoadW,
    p1ChargingActive,
    audiChargingDetected:audiCharging
};

if (previous.sessionOwned === true && remoteState === 'disabled') {
    previous.sessionOwned = false;
}
if (previous.sessionOwned === true && Number(previous.leaseUntil) > 0 && now > Number(previous.leaseUntil) + 2 * 60 * 1000 && remoteState !== 'enabled') {
    previous.sessionOwned = false;
}

if (exportMode === 'on') return stopOwnedSession('Handmatige exportbegrenzing heeft voorrang', details);
if (gridChargeStatus.sessionOwned === true) return stopOwnedSession('WIT slim netladen heeft voorrang', details);
if (!audiCharging) return stopOwnedSession('EV wordt niet actief door ESS geladen', details);
if (soc === null || soc < 0 || soc > 100) return stopOwnedSession('Accu-SOC ontbreekt of is ongeldig', details);
if (!socUsable) return stopOwnedSession('Growatt-telemetrie is te oud om de SOC veilig te gebruiken', details);
if (gridPower === null || !fresh('sensor.p1_meter_vermogen', 15000)) return stopOwnedSession('P1-meetdata ontbreekt of is te oud', details);
if (!forecastValid) return stopOwnedSession('Zonverwachting voor morgen ontbreekt of is te oud', details);
if (safeDischargeBudgetKwh === null || safeDischargeBudgetKwh < reserveProfile.minimumBudgetKwh) return stopOwnedSession('Geen veilig energieoverschot voor profiel '+reserveProfile.label, details);
if (!['enabled','disabled'].includes(remoteState) || unavailable(durationEntity) || unavailable(modeEntity) || unavailable(vppRateEntity)) {
    return stopOwnedSession('WIT VPP-bediening niet beschikbaar', details);
}
if (!['enabled','disabled'].includes(exportState)) return stopOwnedSession('Status exportbegrenzing niet beschikbaar', details);
const modeOptions = Array.isArray(modeEntity.attributes && modeEntity.attributes.options) ? modeEntity.attributes.options : [];
if (!modeOptions.includes('Discharge')) return stopOwnedSession('WIT Mode (VPP) ondersteunt ontladen niet', details);
if (remoteState === 'enabled' && previous.sessionOwned !== true) {
    save('blocked', { ...details, sessionOwned:false, status:'Externe WIT-bediening actief · EV-buffer wacht' });
    return null;
}
if (exportState === 'enabled') {
    save('blocked', { ...details, sessionOwned:previous.sessionOwned === true, status:'Exportbegrenzing eerst veilig uitschakelen' });
    return [null, null, null, null, { payload:{ option:'Disabled' } }];
}

let targetPowerW = currentForcedPowerW + gridPower - gridImportBufferW;
targetPowerW = Math.min(maximumBatteryPowerW, Math.max(0, chargerPowerForControlW - 500), Math.max(0, targetPowerW));
let powerPercent = Math.max(0, Math.min(44, Math.floor(targetPowerW / inverterRatedPowerW * 100)));
const previousPowerPercent = Number(previous.powerPercent) || 0;
if (previous.sessionOwned === true && Math.abs(powerPercent - previousPowerPercent) <= 1) powerPercent = previousPowerPercent;
targetPowerW = powerPercent / 100 * inverterRatedPowerW;
if (powerPercent < 3) return stopOwnedSession('Netafname is te laag voor extra WIT-ontlading', details);

const liveDetails = {
    ...details,
    sessionOwned:true,
    leaseUntil:now + durationMinutes * 60 * 1000,
    powerPercent,
    targetPowerW,
};
if (previous.sessionOwned !== true || remoteState !== 'enabled' || modeState !== 'discharge') {
    save('blocked', { ...liveDetails, status:reserveProfile.label+' · veilige ontlaadsessie starten op '+powerPercent+'%' });
    return [{ payload:{ durationMinutes, powerPercent, option:'Discharge' } }, null, null, null, null];
}
if (remotePowerPercent === null || Math.abs(remotePowerPercent + powerPercent) >= 0.5) {
    save('blocked', { ...liveDetails, status:reserveProfile.label+' · ontlaadvermogen bijstellen naar '+powerPercent+'%' });
    return [null, { payload:{ value:-powerPercent } }, null, null, null];
}
save('active', { ...liveDetails, status:reserveProfile.label+' · actief '+powerPercent+'% ('+Math.round(targetPowerW)+' W) · morgen '+tomorrowForecastKwh.toFixed(1)+' kWh' });
return [null, null, { payload:{ option:'Enabled' } }, null, null];`,
  outputs: 5, timeout: 0, noerr: 0, initialize: "flow.set('ess_wit_audi_discharge_status', { sessionOwned:false, active:false, status:'Stand-by na herstart', updatedAt:new Date().toISOString() });", finalize: '', libs: [], x: 440, y: 1140,
  wires: [[ids.witEVDurationAction],[ids.witGridChargeLivePowerAction],[ids.witGridChargeRenewAction],[ids.witEVStopAction],[ids.witExportToggleAction]]
});
flows.push({
  id: ids.witEVDurationAction, type: 'api-call-service', z: FLOW_ID, name: 'Zet WIT-opdracht op 2 minuten', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'number.set_value', floorId: [], areaId: [], deviceId: [], entityId: ['number.growatt_grid_remote_power_control_charging_time'], labelId: [],
  data: '{"value":payload.durationMinutes}', dataType: 'jsonata', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'number', service: 'set_value', x: 760, y: 1140, wires: [[ids.witEVRateAction]]
});
flows.push({
  id: ids.witEVRateAction, type: 'api-call-service', z: FLOW_ID, name: 'Stel veilige WIT-ontlaadsterkte', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'number.set_value', floorId: [], areaId: [], deviceId: [], entityId: ['number.growatt_vpp_power_rate'], labelId: [],
  data: '{"value":payload.powerPercent}', dataType: 'jsonata', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'number', service: 'set_value', x: 1040, y: 1140, wires: [[ids.witEVModeAction]]
});
flows.push({
  id: ids.witEVModeAction, type: 'api-call-service', z: FLOW_ID, name: 'Start WIT Mode (VPP) ontladen', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'select.select_option', floorId: [], areaId: [], deviceId: [], entityId: ['select.growatt_mode_vpp'], labelId: [],
  data: '{"option":"Discharge"}', dataType: 'json', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'select', service: 'select_option', x: 1300, y: 1140, wires: [[]]
});
flows.push({
  id: ids.witEVStopAction, type: 'api-call-service', z: FLOW_ID, name: 'Stop tijdelijke WIT-ontlading', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'select.select_option', floorId: [], areaId: [], deviceId: [], entityId: ['select.growatt_grid_remote_power_control_enable'], labelId: [],
  data: '{"option":"Disabled"}', dataType: 'json', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'select', service: 'select_option', x: 780, y: 1200, wires: [[]]
});

flows.push({
  id: ids.witGridChargeSettingsControl, type: 'function', z: FLOW_ID, name: 'Bedien WIT slim netladen',
  func: `const topic = String(msg.topic || '');
if (topic === 'ess/wit/grid-charge-mode') {
    const mode = String(msg.payload || '').toLowerCase();
    if (!['auto','on','off'].includes(mode)) {
        node.warn('Ongeldige stand voor WIT slim netladen geweigerd');
        return null;
    }
    flow.set('ess_wit_grid_charge_mode', mode);
} else if (topic === 'ess/wit/grid-charge-target-soc') {
    const targetSoc = Number(msg.payload);
    if (!Number.isFinite(targetSoc) || targetSoc < 20 || targetSoc > 100) {
        node.warn('Ongeldige gewenste WIT-SOC geweigerd');
        return null;
    }
    flow.set('ess_wit_grid_charge_target_soc', Math.round(targetSoc / 5) * 5);
} else {
    return null;
}
const mode = String(flow.get('ess_wit_grid_charge_mode') || 'auto');
const targetSoc = Number(flow.get('ess_wit_grid_charge_target_soc')) || 80;
node.status({ fill:mode === 'auto' ? 'blue' : 'yellow', shape:'dot', text:mode+' · '+targetSoc+'%' });
return { payload:Date.now() };`,
  outputs: 1, timeout: 0, noerr: 0,
  initialize: "flow.set('ess_wit_grid_charge_mode', 'auto'); flow.set('ess_wit_grid_charge_target_soc', 80); flow.set('ess_wit_grid_charge_status', { sessionOwned:false, active:false, mode:'auto', targetSoc:80, status:'Automatisch na herstart', selectedSlots:[], updatedAt:new Date().toISOString() });",
  finalize: '', libs: [], x: 210, y: 1340, wires: [[ids.witGridChargeControl]]
});
flows.push({
  id: ids.witGridChargeInject, type: 'inject', z: FLOW_ID, name: 'Herplan WIT-netladen',
  props: [{ p:'payload' },{ p:'topic', vt:'str' }], repeat: '60', crontab: '', once: true, onceDelay: 70,
  topic: '', payload: '', payloadType: 'date', x: 180, y: 1400, wires: [[ids.witGridChargeControl]]
});
flows.push({
  id: ids.witGridChargeControl, type: 'function', z: FLOW_ID, name: 'Plan en regel WIT-netladen',
  func: `const ha = global.get('homeassistant');
const states = ha && ha.homeAssistant && ha.homeAssistant.states;
const now = Date.now();
const previous = flow.get('ess_wit_grid_charge_status') || {};
const modeStored = String(flow.get('ess_wit_grid_charge_mode') || 'auto').toLowerCase();
const mode = ['on','off'].includes(modeStored) ? modeStored : 'auto';
const targetSoc = Math.max(20, Math.min(100, Number(flow.get('ess_wit_grid_charge_target_soc')) || 80));
const batteryCapacityKwh = 30;
const chargeEfficiency = 0.90;
const inverterRatedPowerW = 18000;
const installationChargeLimitW = 12000;
const designPhaseCurrentA = 22;
const nominalVoltageV = 230;
const wearCostPerKwh = 0.04;
const minimumBenefitPerKwh = 0.01;
const planningHorizonMs = 24 * 60 * 60 * 1000;
const reserveProfiles = {
    eco: { label:'Eco', conservativeForecastFactor:0.60, houseReserveKwh:14 },
    normal: { label:'Normaal', conservativeForecastFactor:0.65, houseReserveKwh:10 },
    audi: { label:'EV voorrang', conservativeForecastFactor:0.75, houseReserveKwh:6 }
};
const reserveModeStored = String(flow.get('ess_wit_audi_buffer_mode') || 'normal').toLowerCase();
const reserveMode = Object.prototype.hasOwnProperty.call(reserveProfiles, reserveModeStored) ? reserveModeStored : 'normal';
const reserveProfile = reserveProfiles[reserveMode];

function entity(id) { return states && states[id] ? states[id] : null; }
function unavailable(item) { return !item || ['unknown','unavailable',''].includes(String(item.state).toLowerCase()); }
function value(id) {
    const item = entity(id);
    if (unavailable(item)) return null;
    const number = Number(item.state);
    return Number.isFinite(number) ? number : null;
}
function fresh(id, maxAge) {
    const item = entity(id);
    if (!item) return false;
    const timestamp = new Date(item.last_updated || item.last_changed || 0).getTime();
    const age = now - timestamp;
    return Number.isFinite(timestamp) && age >= -60000 && age <= maxAge;
}
function energyKwh(item) {
    if (unavailable(item)) return null;
    const number = Number(item.state);
    if (!Number.isFinite(number)) return null;
    const unit = String((item.attributes || {}).unit_of_measurement || 'kWh').toLowerCase();
    if (unit === 'wh') return number / 1000;
    if (unit === 'mwh') return number * 1000;
    return number;
}
function phasePowerW(id) {
    const item = entity(id);
    const reading = value(id);
    if (reading === null) return null;
    const unit = String((item.attributes || {}).unit_of_measurement || 'W').toLowerCase();
    if (unit === 'a') return reading * nominalVoltageV;
    if (unit === 'kw') return reading * 1000;
    return reading;
}
function round(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Number.isFinite(Number(value)) ? Math.round(Number(value) * factor) / factor : null;
}
function save(level, fields = {}) {
    const next = {
        ...previous,
        ...fields,
        mode,
        targetSoc,
        active:fields.active === true,
        status:String(fields.status || previous.status || 'Stand-by'),
        updatedAt:new Date(now).toISOString()
    };
    flow.set('ess_wit_grid_charge_status', next);
    const fill = level === 'active' ? 'green' : level === 'error' ? 'red' : level === 'blocked' ? 'yellow' : 'grey';
    node.status({ fill, shape:level === 'error' ? 'ring' : 'dot', text:next.status });
    return next;
}
function stopOwned(reason, details = {}) {
    const remoteState = String((entity('select.growatt_grid_remote_power_control_enable') || {}).state || '').toLowerCase();
    if (previous.sessionOwned === true && remoteState === 'enabled') {
        save('blocked', { ...details, active:false, sessionOwned:true, status:reason+' · terug naar normale regeling' });
        return [null, null, null, { payload:{ option:'Disabled' } }, null];
    }
    save(levelForReason(reason), { ...details, active:false, sessionOwned:false, powerPercent:0, targetPowerW:0, status:reason });
    return null;
}
function levelForReason(reason) {
    return /ontbreekt|oud|onbekend|niet beschikbaar/i.test(reason) ? 'error' : /wacht|voorrang|onvoldoende|extern/i.test(reason) ? 'blocked' : 'idle';
}
function overlaps(left, right) { return left.start < right.end && left.end > right.start; }
function quantile(values, fraction) {
    const sorted = values.filter(Number.isFinite).sort((a,b) => a-b);
    if (!sorted.length) return null;
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * fraction)))];
}
function directBatteryLimitW() {
    const limits = [];
    for (const [id, item] of Object.entries(states || {})) {
        const name = String((item.attributes || {}).friendly_name || id);
        const haystack = (id+' '+name).toLowerCase();
        if (!/(growatt|battery|bms|accu)/.test(haystack) || !/(charg|laad)/.test(haystack) || !/(limit|max|allow|toegestaan)/.test(haystack)) continue;
        if (id === 'number.growatt_battery_remote_charge_and_discharge_power' || unavailable(item)) continue;
        const reading = Number(item.state);
        const unit = String((item.attributes || {}).unit_of_measurement || '').toLowerCase();
        if (!Number.isFinite(reading) || reading <= 0) continue;
        if (unit === 'w') limits.push(reading);
        else if (unit === 'kw') limits.push(reading * 1000);
    }
    return limits.length ? Math.min(installationChargeLimitW, ...limits) : installationChargeLimitW;
}

if (!states) return stopOwned('Home Assistant niet beschikbaar');
const soc = value('sensor.growatt_battery_battery_soc');
const growattTelemetryFresh = [
    'sensor.growatt_battery_battery_power',
    'sensor.growatt_solar_system_output_power',
    'sensor.growatt_grid_grid_power'
].some((id) => fresh(id, 2 * 60 * 1000));
const socUsable = fresh('sensor.growatt_battery_battery_soc', 2 * 60 * 1000) || growattTelemetryFresh;
const vppEntity = entity('select.growatt_mode_vpp');
const vppRateEntity = entity('number.growatt_vpp_power_rate');
const durationEntity = entity('number.growatt_grid_remote_power_control_charging_time');
const remoteEntity = entity('select.growatt_grid_remote_power_control_enable');
const exportEntity = entity('select.growatt_grid_vpp_export_limit_enable');
const vppState = unavailable(vppEntity) ? '' : String(vppEntity.state).toLowerCase();
const vppRatePercent = value('number.growatt_vpp_power_rate');
const durationMinutes = value('number.growatt_grid_remote_power_control_charging_time');
const remoteState = unavailable(remoteEntity) ? '' : String(remoteEntity.state).toLowerCase();
const remotePercent = value('number.growatt_battery_remote_charge_and_discharge_power');
const exportState = unavailable(exportEntity) ? '' : String(exportEntity.state).toLowerCase();
const vppOptions = Array.isArray(vppEntity && vppEntity.attributes && vppEntity.attributes.options) ? vppEntity.attributes.options : [];
const chargeOption = vppOptions.find((option) => String(option).toLowerCase() === 'charge') || null;
const holdOption = vppOptions.find((option) => String(option).toLowerCase() === 'hold') || null;
const currentStoredKwh = soc === null ? null : Math.max(0, Math.min(100, soc)) / 100 * batteryCapacityKwh;

const tomorrowPrefix = 'sensor.energy_production_tomorrow';
const tomorrowItems = Object.entries(states).filter(([id]) => id === tomorrowPrefix || /^_[0-9]+$/.test(id.slice(tomorrowPrefix.length)));
const tomorrowReadings = tomorrowItems.map(([id,item]) => ({ id, value:energyKwh(item), fresh:fresh(id, 2 * 60 * 60 * 1000) }));
const forecastValid = tomorrowReadings.length > 0 && tomorrowReadings.every((item) => item.value !== null && item.value >= 0 && item.fresh);
const tomorrowForecastKwh = forecastValid ? tomorrowReadings.reduce((total,item) => total + item.value, 0) : null;
const expectedSolarInputKwh = tomorrowForecastKwh === null ? null : tomorrowForecastKwh * reserveProfile.conservativeForecastFactor;
const expectedSolarChargeKwh = expectedSolarInputKwh === null ? null : expectedSolarInputKwh * chargeEfficiency;
const usableStoredAfterHouseKwh = currentStoredKwh === null ? null : Math.max(0, currentStoredKwh - reserveProfile.houseReserveKwh);
const targetStoredKwh = targetSoc / 100 * batteryCapacityKwh;
const storedEnergyShortfallKwh = usableStoredAfterHouseKwh === null || expectedSolarChargeKwh === null
    ? null
    : Math.max(0, targetStoredKwh - usableStoredAfterHouseKwh - expectedSolarChargeKwh);
const automaticGridEnergyNeededKwh = storedEnergyShortfallKwh === null ? null : storedEnergyShortfallKwh / chargeEfficiency;
const directGridEnergyNeededKwh = currentStoredKwh === null ? null : Math.max(0, targetStoredKwh - currentStoredKwh) / chargeEfficiency;
const gridEnergyNeededKwh = mode === 'on' ? directGridEnergyNeededKwh : automaticGridEnergyNeededKwh;

const rawForecast = flow.get('ess_nordpool_forecast') || [];
const priceMeta = flow.get('ess_nordpool_forecast_meta') || {};
const priceAge = now - new Date(priceMeta.updatedAt || 0).getTime();
const priceFresh = Number.isFinite(priceAge) && priceAge >= -60000 && priceAge <= 3 * 60 * 60 * 1000;
const horizonEnd = now + planningHorizonMs;
const slots = rawForecast.map((slot) => {
    const start = new Date(slot.start).getTime();
    const end = new Date(slot.end).getTime();
    return { start, end, allInPrice:Number(slot.allInPrice), marketPrice:Number(slot.marketPrice) };
}).filter((slot) => Number.isFinite(slot.start) && Number.isFinite(slot.end) && slot.end > now && slot.start < horizonEnd && Number.isFinite(slot.allInPrice));
const audiStatus = flow.get('ess_audi_control_status') || {};
const audiSlots = (Array.isArray(audiStatus.selectedSlots) ? audiStatus.selectedSlots : []).map((slot) => ({ start:new Date(slot.start).getTime(), end:new Date(slot.end).getTime() })).filter((slot) => Number.isFinite(slot.start) && Number.isFinite(slot.end));
const priceBenchmark = quantile(slots.map((slot) => slot.allInPrice), 0.75);
const economicSlots = slots.filter((slot) => {
    if (audiSlots.some((audiSlot) => overlaps(slot, audiSlot))) return false;
    if (priceBenchmark === null) return false;
    const benefit = priceBenchmark - slot.allInPrice / chargeEfficiency - wearCostPerKwh;
    return benefit >= minimumBenefitPerKwh;
}).sort((a,b) => a.allInPrice - b.allInPrice || a.start - b.start);
const planLimitW = directBatteryLimitW();
let remainingEnergyKwh = Math.max(0, Number(gridEnergyNeededKwh) || 0);
let selectedSlots = [];
if (mode === 'auto') {
    for (const slot of economicSlots) {
        if (remainingEnergyKwh <= 0.01) break;
        const usableStart = Math.max(now, slot.start);
        const usableEnd = Math.min(horizonEnd, slot.end);
        const durationHours = Math.max(0, usableEnd - usableStart) / 3600000;
        const energyKwh = Math.min(remainingEnergyKwh, planLimitW / 1000 * durationHours);
        if (energyKwh <= 0.01) continue;
        const powerKw = energyKwh / durationHours;
        selectedSlots.push({ start:slot.start, end:slot.end, allInPrice:slot.allInPrice, marketPrice:slot.marketPrice, energyKwh, powerKw });
        remainingEnergyKwh -= energyKwh;
    }
    selectedSlots.sort((a,b) => a.start - b.start);
} else if (mode === 'on' && remainingEnergyKwh > 0.01) {
    const currentSlot = slots.find((slot) => now >= slot.start && now < slot.end) || { start:now, end:Math.min(horizonEnd, now + 15 * 60 * 1000), allInPrice:null, marketPrice:null };
    const durationHours = Math.max(60000, currentSlot.end - now) / 3600000;
    const energyKwh = Math.min(remainingEnergyKwh, planLimitW / 1000 * durationHours);
    selectedSlots = [{ ...currentSlot, energyKwh, powerKw:Math.min(planLimitW / 1000, remainingEnergyKwh / durationHours) }];
}
const scheduledSlot = selectedSlots.find((slot) => now >= slot.start && now < slot.end) || null;
const nextScheduled = selectedSlots.find((slot) => slot.end > now) || null;
const plannedEnergyKwh = selectedSlots.reduce((total,slot) => total + slot.energyKwh, 0);
const plannedCost = selectedSlots.reduce((total,slot) => total + (Number.isFinite(slot.allInPrice) ? slot.energyKwh * slot.allInPrice : 0), 0);
const details = {
    reserveMode,
    reserveLabel:reserveProfile.label,
    currentStoredKwh:round(currentStoredKwh),
    expectedHouseKwh:reserveProfile.houseReserveKwh,
    tomorrowForecastKwh:round(tomorrowForecastKwh),
    expectedSolarInputKwh:round(expectedSolarInputKwh),
    expectedSolarChargeKwh:round(expectedSolarChargeKwh),
    gridEnergyNeededKwh:round(gridEnergyNeededKwh),
    plannedEnergyKwh:round(plannedEnergyKwh),
    plannedCost:round(plannedCost),
    priceBenchmark:round(priceBenchmark, 4),
    chargeEfficiency,
    wearCostPerKwh,
    minimumBenefitPerKwh,
    plannedPowerKw:scheduledSlot ? round(scheduledSlot.powerKw, 1) : 0,
    scheduledNow:!!scheduledSlot,
    nextScheduledStart:nextScheduled ? new Date(nextScheduled.start).toISOString() : null,
    nextScheduledEnd:nextScheduled ? new Date(nextScheduled.end).toISOString() : null,
    selectedSlots:selectedSlots.map((slot) => ({ start:new Date(slot.start).toISOString(), end:new Date(slot.end).toISOString(), allInPrice:Number.isFinite(slot.allInPrice) ? slot.allInPrice : null, marketPrice:Number.isFinite(slot.marketPrice) ? slot.marketPrice : null, energyKwh:round(slot.energyKwh), powerKw:round(slot.powerKw, 1) })),
    planComplete:remainingEnergyKwh <= 0.05,
    batteryLimitW:planLimitW
};

if (mode === 'off') return stopOwned('Slim netladen staat uit', details);
if (soc === null || soc < 0 || soc > 100) return stopOwned('Accu-SOC ontbreekt of is ongeldig', details);
if (!socUsable) return stopOwned('Growatt-telemetrie is te oud om de SOC veilig te gebruiken', details);
if (soc >= targetSoc - 0.2) return stopOwned('Gewenste SOC bereikt', details);
if (mode === 'auto' && !forecastValid) return stopOwned('Zonverwachting voor morgen ontbreekt of is te oud', details);
if (mode === 'auto' && (!priceFresh || slots.length === 0)) return stopOwned('Nord Pool-kwartierprijzen ontbreken of zijn te oud', details);
if (gridEnergyNeededKwh === null || gridEnergyNeededKwh <= 0.05) return stopOwned(mode === 'auto' ? 'Zon en huidige acculading dekken het doel' : 'Gewenste SOC bereikt', details);
if (!chargeOption || !holdOption || vppRatePercent === null || durationMinutes === null || remotePercent === null || !['enabled','disabled'].includes(remoteState)) {
    return stopOwned('WIT Mode (VPP)-bediening niet beschikbaar', details);
}
if (!['enabled','disabled'].includes(exportState)) return stopOwned('Status exportbegrenzing niet beschikbaar', details);
const audiDischarge = flow.get('ess_wit_audi_discharge_status') || {};
if (audiDischarge.sessionOwned === true) return stopOwned('EV-accubuffer heeft voorrang', details);
if (String(flow.get('ess_wit_export_mode') || 'auto').toLowerCase() === 'on') return stopOwned('Handmatige exportbegrenzing heeft voorrang', details);
if (!scheduledSlot) return stopOwned(mode === 'auto' && selectedSlots.length === 0 ? 'Geen rendabel laadkwartier binnen 24 uur' : 'Wacht op goedkoop gepland laadkwartier', details);
if (remoteState === 'enabled' && previous.sessionOwned !== true) {
    save('blocked', { ...details, active:false, sessionOwned:false, status:'Externe WIT-laadopdracht actief · regelaar wacht' });
    return null;
}
if (exportState === 'enabled') {
    save('blocked', { ...details, active:false, sessionOwned:previous.sessionOwned === true, status:'Exportbegrenzing eerst uitschakelen' });
    return [null, null, null, null, { payload:{ option:'Disabled' } }];
}

const phaseIds = ['sensor.p1_meter_vermogen_fase_1','sensor.p1_meter_vermogen_fase_2','sensor.p1_meter_vermogen_fase_3'];
if (!phaseIds.every((id) => fresh(id, 15000))) return stopOwned('P1-fasemeting ontbreekt of is te oud', details);
const phasePowers = phaseIds.map(phasePowerW);
if (phasePowers.some((reading) => reading === null)) return stopOwned('P1-fasemeting niet beschikbaar', details);
const currentForcedPowerW = previous.sessionOwned === true && remoteState === 'enabled' && remotePercent > 0 ? Math.max(0, Number(previous.targetPowerW) || 0) : 0;
const phaseAdditionalHeadroomW = Math.max(0, 3 * Math.min(...phasePowers.map((power) => designPhaseCurrentA * nominalVoltageV - Math.max(0, power))));
const gridCommandLimitW = Math.max(0, currentForcedPowerW + phaseAdditionalHeadroomW);
const rawBatteryPowerW = value('sensor.growatt_battery_battery_power');
const batteryScale = Number(flow.get('ess_growatt_battery_power_scale')) === 0.1 ? 0.1 : 1;
const actualBatteryChargeW = rawBatteryPowerW === null ? 0 : Math.max(0, rawBatteryPowerW * batteryScale);
const externalBatteryChargeW = Math.max(0, actualBatteryChargeW - currentForcedPowerW);
const batteryCommandLimitW = Math.max(0, planLimitW - externalBatteryChargeW);
let targetPowerW = Math.min(scheduledSlot.powerKw * 1000, planLimitW, gridCommandLimitW, batteryCommandLimitW);
let powerPercent = Math.max(0, Math.min(67, Math.floor(targetPowerW / inverterRatedPowerW * 100)));
if (previous.sessionOwned === true && Math.abs(powerPercent - Number(previous.powerPercent || 0)) <= 1) powerPercent = Number(previous.powerPercent || 0);
targetPowerW = powerPercent / 100 * inverterRatedPowerW;
const liveDetails = { ...details, phaseHeadroomW:round(gridCommandLimitW, 0), externalBatteryChargeW:round(externalBatteryChargeW, 0), powerPercent, targetPowerW:round(targetPowerW, 0), plannedPowerKw:round(targetPowerW / 1000, 1) };
if (powerPercent < 3) return stopOwned('Onvoldoende veilige laadruimte op net of accu', liveDetails);
if (previous.sessionOwned !== true || remoteState !== 'enabled' || vppState !== 'charge') {
    save('blocked', { ...liveDetails, active:false, sessionOwned:true, status:'Veilige WIT-laadsessie starten op '+powerPercent+'%' });
    return [{ payload:{ durationMinutes:2, powerPercent, option:chargeOption } }, null, null, null, null];
}
if (Math.abs(remotePercent - powerPercent) >= 0.5) {
    save('blocked', { ...liveDetails, active:false, sessionOwned:true, status:'Laadvermogen bijstellen naar '+powerPercent+'%' });
    return [null, { payload:{ value:powerPercent } }, null, null, null];
}
save('active', { ...liveDetails, active:true, sessionOwned:true, status:(mode === 'on' ? 'Handmatig' : 'Automatisch')+' netladen · '+powerPercent+'% ('+Math.round(targetPowerW)+' W)' });
return [null, null, { payload:{ option:'Enabled' } }, null, null];`,
  outputs: 5, timeout: 0, noerr: 0, initialize: '', finalize: '', libs: [], x: 470, y: 1370,
  wires: [[ids.witGridChargeDurationAction],[ids.witGridChargeLivePowerAction],[ids.witGridChargeRenewAction],[ids.witEVStopAction],[ids.witExportToggleAction]]
});
flows.push({
  id: ids.witGridChargeDurationAction, type: 'api-call-service', z: FLOW_ID, name: 'Zet veilige WIT-netlaadduur', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'number.set_value', floorId: [], areaId: [], deviceId: [], entityId: ['number.growatt_grid_remote_power_control_charging_time'], labelId: [],
  data: '{"value":payload.durationMinutes}', dataType: 'jsonata', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'number', service: 'set_value', x: 760, y: 1320, wires: [[ids.witGridChargePowerAction]]
});
flows.push({
  id: ids.witGridChargePowerAction, type: 'api-call-service', z: FLOW_ID, name: 'Stel WIT VPP-laadsterkte', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'number.set_value', floorId: [], areaId: [], deviceId: [], entityId: ['number.growatt_vpp_power_rate'], labelId: [],
  data: '{"value":payload.powerPercent}', dataType: 'jsonata', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'number', service: 'set_value', x: 1010, y: 1320, wires: [[ids.witGridChargeModeAction]]
});
flows.push({
  id: ids.witGridChargeModeAction, type: 'api-call-service', z: FLOW_ID, name: 'Start atomaire WIT Mode (VPP) Charge', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'select.select_option', floorId: [], areaId: [], deviceId: [], entityId: ['select.growatt_mode_vpp'], labelId: [],
  data: '{"option":"Charge"}', dataType: 'json', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'select', service: 'select_option', x: 1280, y: 1320, wires: [[]]
});
flows.push({
  id: ids.witGridChargeLivePowerAction, type: 'api-call-service', z: FLOW_ID, name: 'Regel lopend WIT-netlaadvermogen', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'number.set_value', floorId: [], areaId: [], deviceId: [], entityId: ['number.growatt_battery_remote_charge_and_discharge_power'], labelId: [],
  data: '{"value":payload.value}', dataType: 'jsonata', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'number', service: 'set_value', x: 790, y: 1380, wires: [[]]
});
flows.push({
  id: ids.witGridChargeRenewAction, type: 'api-call-service', z: FLOW_ID, name: 'Vernieuw veilige WIT-netlaadlease', server: 'ess00000000000b', version: 7,
  debugenabled: false, action: 'select.select_option', floorId: [], areaId: [], deviceId: [], entityId: ['select.growatt_grid_remote_power_control_enable'], labelId: [],
  data: '{"option":"Enabled"}', dataType: 'json', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: true,
  domain: 'select', service: 'select_option', x: 790, y: 1440, wires: [[]]
});

// Publiceer de beslissingen en de bijbehorende werkelijke metingen als vaste
// Home Assistant-sensoren. Home Assistant Recorder kan deze waarden daarna
// historisch bewaren zonder de optionele Node-RED custom integration.
flows.push({
  id: ids.witHistoryInject, type: 'inject', z: FLOW_ID, name: 'Bewaar ESS-regel- en zonhistorie',
  props: [{ p:'payload' },{ p:'topic', vt:'str' }], repeat: '60', crontab: '', once: true, onceDelay: 75,
  topic: '', payload: '', payloadType: 'date', x: 170, y: 1280, wires: [[ids.witHistoryPrepare]]
});
flows.push({
  id: ids.witHistoryPrepare, type: 'function', z: FLOW_ID, name: 'Maak historische ESS-meetpunten',
  func: `const ha = global.get('homeassistant');
const states = ha && ha.homeAssistant && ha.homeAssistant.states;
if (!states) {
    node.status({ fill:'red', shape:'ring', text:'Home Assistant niet beschikbaar' });
    return null;
}

const status = flow.get('ess_wit_audi_discharge_status') || {};
const gridChargeStatus = flow.get('ess_wit_grid_charge_status') || {};
const audiControlStatus = flow.get('ess_audi_control_status') || {};
const mode = String(flow.get('ess_wit_audi_buffer_mode') || status.reserveMode || 'normal').toLowerCase();
const profiles = {
    eco: { label:'Eco', forecastFactor:60, houseReserveKwh:14, rechargeTargetSoc:100, minimumSoc:50 },
    normal: { label:'Normaal', forecastFactor:65, houseReserveKwh:10, rechargeTargetSoc:100, minimumSoc:30 },
    audi: { label:'EV voorrang', forecastFactor:75, houseReserveKwh:6, rechargeTargetSoc:90, minimumSoc:30 }
};
const profile = profiles[mode] || profiles.normal;

function value(id, scale = 1) {
    const item = states[id];
    if (!item || ['unknown','unavailable',''].includes(String(item.state).toLowerCase())) return null;
    const number = Number(item.state);
    return Number.isFinite(number) ? number * scale : null;
}
function finite(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}
function rounded(value, decimals = 0) {
    const number = finite(value);
    if (number === null) return 'unknown';
    const factor = 10 ** decimals;
    return Math.round(number * factor) / factor;
}
function sensor(entityId, state, attributes) {
    return {
        payload: {
            protocol:'http', method:'post', path:'states/' + entityId,
            data: { state, attributes }
        }
    };
}
function measurement(name, unit, deviceClass, icon) {
    const attributes = {
        friendly_name:name,
        state_class:'measurement',
        icon
    };
    if (unit) attributes.unit_of_measurement = unit;
    if (deviceClass) attributes.device_class = deviceClass;
    return attributes;
}
function energyKwh(id) {
    const item = states[id];
    const reading = value(id);
    if (reading === null) return null;
    const unit = String((item && item.attributes && item.attributes.unit_of_measurement) || 'kWh').toLowerCase();
    if (unit === 'wh') return reading / 1000;
    if (unit === 'mwh') return reading * 1000;
    return reading;
}
function sumEnergy(entityIds) {
    const readings = entityIds.map(energyKwh).filter((reading) => reading !== null);
    return readings.length ? readings.reduce((total, reading) => total + reading, 0) : null;
}
function localDayKey(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
function plannedEnergyForDay(planStatus, dayKey) {
    const slots = Array.isArray(planStatus && planStatus.selectedSlots) ? planStatus.selectedSlots : [];
    return slots.reduce((total, slot) => {
        const start = new Date(slot && slot.start);
        const end = new Date(slot && slot.end);
        if (Number.isNaN(start.getTime()) || localDayKey(start) !== dayKey) return total;
        const directEnergy = finite(slot.energyKwh === undefined ? slot.energy : slot.energyKwh);
        if (directEnergy !== null && directEnergy >= 0) return total + directEnergy;
        const powerKw = finite(slot.powerKw);
        const durationHours = Number.isNaN(end.getTime()) ? null : Math.max(0, end.getTime() - start.getTime()) / 3600000;
        return powerKw !== null && durationHours !== null ? total + powerKw * durationHours : total;
    }, 0);
}

const active = status.active === true && status.sessionOwned === true;
const requestedPowerW = active ? Math.max(0, finite(status.targetPowerW) || 0) : 0;
const rawBatteryPowerW = value('sensor.growatt_battery_battery_power');
const storedScale = Number(flow.get('ess_growatt_battery_power_scale'));
const batteryScale = storedScale === 0.1 ? 0.1 : 1;
const scaledBatteryPowerW = rawBatteryPowerW === null ? null : rawBatteryPowerW * batteryScale;
const plausibleBatteryPowerW = scaledBatteryPowerW !== null && Math.abs(scaledBatteryPowerW) <= 15000 ? scaledBatteryPowerW : null;
// Growatt gebruikt negatief voor ontladen. Alleen tijdens een eigen actieve
// buffersessie telt dit als werkelijk door de EV-buffer geleverd vermogen.
const actualBufferDischargeW = active && plausibleBatteryPowerW !== null ? Math.max(0, -plausibleBatteryPowerW) : active ? null : 0;
const gridChargeActive = gridChargeStatus.active === true && gridChargeStatus.sessionOwned === true;
const requestedGridChargeW = gridChargeActive ? Math.max(0, finite(gridChargeStatus.targetPowerW) || 0) : 0;
const actualGridChargeW = gridChargeActive && plausibleBatteryPowerW !== null ? Math.max(0, plausibleBatteryPowerW) : gridChargeActive ? null : 0;
const audiPowerW = value('sensor.ev_charger_power', 1000);
const audiReliability = flow.get('ess_audi_charge_reliability') || {};
const audiRequestedCurrentA = Math.max(0, finite(audiControlStatus.targetCurrent) || 0);
const audiActualPowerW = finite(audiControlStatus.chargerPowerW) === null ? audiPowerW : finite(audiControlStatus.chargerPowerW);
const audiEstimatedSoc = finite(audiControlStatus.estimatedEVSoc);
const audiPhaseMode = finite(audiControlStatus.phaseMode);
const audiFailedMinutes = finite(audiControlStatus.failedChargingMinutes) === null
    ? Math.round((finite(audiReliability.failedSeconds) || 0) / 6) / 10
    : finite(audiControlStatus.failedChargingMinutes);
const audiChargeState = audiControlStatus.chargingConfirmed === true
    ? 'Actief'
    : String(audiControlStatus.recoveryStage || '') === 'failed'
        ? 'Storing'
        : audiControlStatus.requestedActive === true
            ? 'Starten'
            : 'Stand-by';
const gridPowerW = value('sensor.p1_meter_vermogen');
const batterySoc = value('sensor.growatt_battery_battery_soc');
const safeBudgetKwh = finite(status.safeDischargeBudgetKwh);
const tomorrowForecastKwh = finite(status.tomorrowForecastKwh);
const now = new Date();
const todayKey = localDayKey(now);
const tomorrowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
const tomorrowKey = localDayKey(tomorrowDate);
const previousSolarEVt = flow.get('ess_solar_forecast_audit') || {};
const restoredReference = states['sensor.ess_zon_referentieverwachting_vandaag'];
const restoredReferenceDate = String((restoredReference && restoredReference.attributes && restoredReference.attributes.referentiedatum) || '');
const restoredReferenceKwh = restoredReferenceDate === todayKey ? finite(restoredReference.state) : null;
const referenceTodayKwh = previousSolarEVt.todayDate === todayKey
    ? finite(previousSolarEVt.todayForecastKwh)
    : previousSolarEVt.tomorrowDate === todayKey
        ? finite(previousSolarEVt.tomorrowForecastKwh)
        : restoredReferenceKwh;
const rememberedTomorrowKwh = previousSolarEVt.tomorrowDate === tomorrowKey ? finite(previousSolarEVt.tomorrowForecastKwh) : null;
const forecastForTomorrowKwh = tomorrowForecastKwh === null ? rememberedTomorrowKwh : tomorrowForecastKwh;
const pvSouthToday = energyKwh('sensor.pv_array_1_energy_today');
const pvEastToday = energyKwh('sensor.pv_array_2_energy_today');
const pvWestToday = energyKwh('sensor.pv_array_3_energy_today');
const witSolarToday = energyKwh('sensor.growatt_solar_energy_today');
const siteSolarToday = energyKwh('sensor.site_solar_energy_today');
const fallbackSolarParts = [pvSouthToday, pvEastToday, pvWestToday, witSolarToday].filter((reading) => reading !== null);
const actualSolarTodayKwh = siteSolarToday === null
    ? fallbackSolarParts.length ? fallbackSolarParts.reduce((total, reading) => total + reading, 0) : null
    : siteSolarToday;
const forecastDeviationKwh = referenceTodayKwh !== null && actualSolarTodayKwh !== null ? actualSolarTodayKwh - referenceTodayKwh : null;
const forecastRealizationPct = referenceTodayKwh !== null && referenceTodayKwh > 0 && actualSolarTodayKwh !== null
    ? actualSolarTodayKwh / referenceTodayKwh * 100
    : null;
const forecastCorrectionFactor = forecastRealizationPct === null ? null : forecastRealizationPct / 100;
flow.set('ess_solar_forecast_audit', {
    todayDate:todayKey,
    todayForecastKwh:referenceTodayKwh,
    todayActualKwh:actualSolarTodayKwh,
    tomorrowDate:tomorrowKey,
    tomorrowForecastKwh:forecastForTomorrowKwh,
    updatedAt:now.toISOString()
});

// Leer het normale woningverbruik van dezelfde totale woningbalans die het
// dashboard toont. De Growatt Load-dagteller blijft alleen als vergelijking
// bewaard, omdat nog niet bevestigd is of die de hele woning of alleen de
// WIT-loadkant omvat. Werkelijk EV-laadvermogen wordt uit de basis gehaald;
// de planning voor morgen wordt daarna bewust apart toegevoegd.
const loadEnergyTodayKwh = energyKwh('sensor.growatt_load_load_energy_today');
const dashboardLive = flow.get('ess_dashboard_live') || {};
const totalHousePowerW = finite(dashboardLive.house && dashboardLive.house.power);
const baseHousePowerW = totalHousePowerW === null
    ? null
    : Math.max(0, totalHousePowerW - Math.max(0, audiPowerW || 0));
const restoredHouseForecast = states['sensor.ess_woningverbruik_basis_verwacht_morgen'];
const restoredHouseAttributes = restoredHouseForecast && restoredHouseForecast.attributes || {};
const previousHouseLearning = flow.get('ess_house_consumption_learning') || {};
const restoredRecentDays = Array.isArray(restoredHouseAttributes.recent_days) ? restoredHouseAttributes.recent_days : [];
let recentHouseDays = Array.isArray(previousHouseLearning.recentDays) ? previousHouseLearning.recentDays : restoredRecentDays;
recentHouseDays = recentHouseDays
    .map((day) => ({ date:String(day && day.date || ''), kwh:finite(day && day.kwh) }))
    .filter((day) => /^\\d{4}-\\d{2}-\\d{2}$/.test(day.date) && day.kwh !== null && day.kwh >= 0.5 && day.kwh <= 200);
let houseLearningDate = String(previousHouseLearning.currentDate || restoredHouseAttributes.current_date || todayKey);
let currentHouseKwh = finite(previousHouseLearning.currentValueKwh);
if (currentHouseKwh === null) currentHouseKwh = finite(restoredHouseAttributes.current_value_kwh);
let coverageHours = finite(previousHouseLearning.coverageHours);
if (coverageHours === null) coverageHours = finite(restoredHouseAttributes.coverage_hours) || 0;
let previousBasePowerW = finite(previousHouseLearning.lastBasePowerW);
if (previousBasePowerW === null) previousBasePowerW = finite(restoredHouseAttributes.last_base_power_w);
let lastSampleAt = new Date(previousHouseLearning.lastSampleAt || restoredHouseAttributes.last_sample_at || 0).getTime();
if (houseLearningDate !== todayKey) {
    const normalizedHouseKwh = coverageHours >= 18 && currentHouseKwh !== null
        ? currentHouseKwh * 24 / Math.min(24, coverageHours)
        : null;
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(houseLearningDate) && normalizedHouseKwh !== null && normalizedHouseKwh >= 0.5 && normalizedHouseKwh <= 200) {
        recentHouseDays = recentHouseDays.filter((day) => day.date !== houseLearningDate);
        recentHouseDays.push({ date:houseLearningDate, kwh:normalizedHouseKwh });
    }
    houseLearningDate = todayKey;
    currentHouseKwh = 0;
    coverageHours = 0;
    previousBasePowerW = null;
    lastSampleAt = 0;
}
const sampleAt = now.getTime();
const elapsedHours = lastSampleAt > 0 ? (sampleAt - lastSampleAt) / 3600000 : null;
if (baseHousePowerW !== null && previousBasePowerW !== null && elapsedHours !== null && elapsedHours > 0 && elapsedHours <= 5 / 60) {
    currentHouseKwh = (currentHouseKwh || 0) + ((previousBasePowerW + baseHousePowerW) / 2) * elapsedHours / 1000;
    coverageHours += elapsedHours;
}
previousBasePowerW = baseHousePowerW;
lastSampleAt = sampleAt;
recentHouseDays.sort((left, right) => left.date.localeCompare(right.date));
recentHouseDays = recentHouseDays.slice(-7);
const completedHouseValues = recentHouseDays.map((day) => day.kwh).sort((left, right) => left - right);
const middle = Math.floor(completedHouseValues.length / 2);
const learnedHouseForecastKwh = completedHouseValues.length === 0
    ? null
    : completedHouseValues.length % 2
        ? completedHouseValues[middle]
        : (completedHouseValues[middle - 1] + completedHouseValues[middle]) / 2;
const houseForecastBaseKwh = learnedHouseForecastKwh === null ? profile.houseReserveKwh : learnedHouseForecastKwh;
const houseForecastSource = learnedHouseForecastKwh === null
    ? 'Startwaarde van reserveprofiel ' + profile.label
    : 'Mediaan van ' + completedHouseValues.length + ' afgeronde dag(en)';
const audiPlannedTomorrowKwh = plannedEnergyForDay(audiControlStatus, tomorrowKey);
const witPlannedTomorrowKwh = plannedEnergyForDay(gridChargeStatus, tomorrowKey);
const totalConsumptionTomorrowKwh = houseForecastBaseKwh + audiPlannedTomorrowKwh + witPlannedTomorrowKwh;
flow.set('ess_house_consumption_learning', {
    recentDays:recentHouseDays,
    currentDate:houseLearningDate,
    currentValueKwh:currentHouseKwh,
    coverageHours,
    lastBasePowerW:previousBasePowerW,
    lastSampleAt:new Date(lastSampleAt).toISOString(),
    forecastKwh:houseForecastBaseKwh,
    source:houseForecastSource,
    updatedAt:now.toISOString()
});
const decisionState = active
    ? 'Actief'
    : status.sessionOwned === true
        ? 'Stoppen'
        : String(status.status || '').includes('niet beschikbaar')
            ? 'Niet beschikbaar'
            : 'Stand-by';
const decision = String(status.status || 'Nog niet beoordeeld').slice(0, 255);

const messages = [
    sensor('sensor.ess_audi_laadregeling_status', audiChargeState, {
        friendly_name:'ESS EV laadregeling status', icon:audiChargeState === 'Actief' ? 'mdi:ev-station' : audiChargeState === 'Storing' ? 'mdi:car-electric-outline' : 'mdi:car-clock',
        reden:String(audiControlStatus.status || 'Nog niet beoordeeld').slice(0, 255),
        regelmodus:String(audiControlStatus.controlMode || 'none'),
        gevraagd_actief:audiControlStatus.requestedActive === true,
        werkelijk_laden:audiControlStatus.actualCharging === true,
        laden_bevestigd:audiControlStatus.chargingConfirmed === true,
        voorbereiding_gereed:audiControlStatus.preflightReady === true,
        voorbereidingsproblemen:Array.isArray(audiControlStatus.preflightIssues) ? audiControlStatus.preflightIssues : [],
        herstelstatus:String(audiControlStatus.recoveryStage || 'idle'),
        regelaar_bijgewerkt:audiControlStatus.updatedAt || null
    }),
    sensor('sensor.ess_audi_laadstroom_gevraagd', rounded(audiRequestedCurrentA, 1), measurement('ESS EV laadstroom gevraagd','A','current','mdi:current-ac')),
    sensor('sensor.ess_audi_laadvermogen_werkelijk', rounded(audiActualPowerW), measurement('ESS EV laadvermogen werkelijk','W','power','mdi:ev-plug-type2')),
    sensor('sensor.ess_audi_soc_geschat', rounded(audiEstimatedSoc, 2), {
        ...measurement('ESS EV SOC geschat','%','battery','mdi:battery-sync-outline'),
        audi_soc_pct:rounded(audiControlStatus.reportedEVSoc, 2),
        bron:String(audiControlStatus.audiSocSource || 'onbekend')
    }),
    sensor('sensor.ess_audi_startpogingen', rounded(audiControlStatus.startAttempts), {
        ...measurement('ESS EV startpogingen','','','mdi:restart-alert'),
        huidige_pogingen:rounded(audiControlStatus.recoveryAttempts),
        volledige_herstellen:rounded(audiControlStatus.fullRecoveries),
        herstelstatus:String(audiControlStatus.recoveryStage || 'idle')
    }),
    sensor('sensor.ess_audi_fase', rounded(audiPhaseMode), measurement('ESS EV fase','','','mdi:sine-wave')),
    sensor('sensor.ess_audi_mislukte_laadminuten', rounded(audiFailedMinutes, 1), {
        ...measurement('ESS EV mislukte laadminuten','min','','mdi:timer-alert-outline'),
        geplande_laadminuten:rounded(audiControlStatus.plannedChargingMinutes, 1),
        werkelijke_laadminuten:rounded(audiControlStatus.actualChargingMinutes, 1)
    }),
    sensor('sensor.ess_wit_audi_buffer_gevraagd_vermogen', rounded(requestedPowerW), measurement('ESS WIT EV-buffer gevraagd vermogen','W','power','mdi:battery-arrow-up-outline')),
    sensor('sensor.ess_wit_audi_buffer_werkelijk_accuvermogen', rounded(actualBufferDischargeW), measurement('ESS WIT EV-buffer werkelijk accuvermogen','W','power','mdi:battery-arrow-down-outline')),
    sensor('sensor.ess_wit_audi_buffer_audi_vermogen', rounded(audiPowerW), measurement('ESS WIT EV-buffer EV-vermogen','W','power','mdi:ev-station')),
    sensor('sensor.ess_wit_audi_buffer_netvermogen', rounded(gridPowerW), measurement('ESS WIT EV-buffer netvermogen','W','power','mdi:transmission-tower')),
    sensor('sensor.ess_wit_audi_buffer_veilig_budget', rounded(safeBudgetKwh, 2), measurement('ESS WIT EV-buffer veilig budget','kWh','energy','mdi:battery-lock-open-outline')),
    sensor('sensor.ess_wit_audi_buffer_zonverwachting_morgen', rounded(tomorrowForecastKwh, 2), measurement('ESS WIT EV-buffer zonverwachting morgen','kWh','energy','mdi:weather-sunny')),
    sensor('sensor.ess_wit_audi_buffer_accu_soc', rounded(batterySoc, 1), measurement('ESS WIT EV-buffer accu-SOC','%','battery','mdi:battery-heart-variant')),
    sensor('sensor.ess_wit_audi_buffer_profiel', profile.label, {
        friendly_name:'ESS WIT EV-buffer profiel', icon:'mdi:tune-variant',
        prognose_meegenomen_pct:profile.forecastFactor,
        woningreserve_kwh:profile.houseReserveKwh,
        accu_herlaaddoel_pct:profile.rechargeTargetSoc,
        minimum_soc_pct:profile.minimumSoc
    }),
    sensor('sensor.ess_wit_audi_buffer_status', decisionState, {
        friendly_name:'ESS WIT EV-buffer status', icon:active ? 'mdi:battery-sync' : 'mdi:battery-clock-outline',
        actief:active,
        eigen_sessie:status.sessionOwned === true,
        reden:decision,
        profiel:profile.label,
        gevraagd_vermogen_w:rounded(requestedPowerW),
        werkelijk_accuvermogen_w:rounded(actualBufferDischargeW),
        accu_signed_vermogen_w:rounded(plausibleBatteryPowerW),
        audi_vermogen_w:rounded(audiPowerW),
        netvermogen_w:rounded(gridPowerW),
        accu_soc_pct:rounded(batterySoc, 1),
        veilig_budget_kwh:rounded(safeBudgetKwh, 2),
        zonverwachting_morgen_kwh:rounded(tomorrowForecastKwh, 2),
        regelaar_bijgewerkt:status.updatedAt || null
    }),
    sensor('sensor.ess_wit_netladen_gevraagd_vermogen', rounded(requestedGridChargeW), measurement('ESS WIT netladen gevraagd vermogen','W','power','mdi:battery-arrow-down-outline')),
    sensor('sensor.ess_wit_netladen_werkelijk_accuvermogen', rounded(actualGridChargeW), measurement('ESS WIT netladen werkelijk accuvermogen','W','power','mdi:battery-charging-outline')),
    sensor('sensor.ess_wit_netladen_netenergie_nodig', rounded(gridChargeStatus.gridEnergyNeededKwh, 2), measurement('ESS WIT netladen netenergie nodig','kWh','energy','mdi:transmission-tower-import')),
    sensor('sensor.ess_wit_netladen_zonverwachting', rounded(gridChargeStatus.expectedSolarChargeKwh, 2), measurement('ESS WIT netladen verwachte zonnelading','kWh','energy','mdi:solar-power')),
    sensor('sensor.ess_wit_netladen_geplande_kosten', rounded(gridChargeStatus.plannedCost, 2), measurement('ESS WIT netladen geplande kosten','EUR','','mdi:cash-clock')),
    sensor('sensor.ess_wit_netladen_status', gridChargeActive ? 'Actief' : String(gridChargeStatus.mode || 'auto') === 'off' ? 'Uit' : 'Stand-by', {
        friendly_name:'ESS WIT netladen status', icon:gridChargeActive ? 'mdi:battery-charging-high' : 'mdi:battery-clock-outline',
        actief:gridChargeActive,
        eigen_sessie:gridChargeStatus.sessionOwned === true,
        modus:gridChargeStatus.mode || 'auto',
        gewenst_soc_pct:rounded(gridChargeStatus.targetSoc, 0),
        reden:String(gridChargeStatus.status || 'Nog niet beoordeeld').slice(0, 255),
        gevraagd_vermogen_w:rounded(requestedGridChargeW),
        werkelijk_accuvermogen_w:rounded(actualGridChargeW),
        netenergie_nodig_kwh:rounded(gridChargeStatus.gridEnergyNeededKwh, 2),
        verwachte_zonnelading_kwh:rounded(gridChargeStatus.expectedSolarChargeKwh, 2),
        geplande_kosten_eur:rounded(gridChargeStatus.plannedCost, 2),
        regelaar_bijgewerkt:gridChargeStatus.updatedAt || null
    }),
    sensor('sensor.ess_woningverbruik_basis_verwacht_morgen', rounded(houseForecastBaseKwh, 2), {
        ...measurement('ESS woningverbruik basis verwacht morgen','kWh','energy','mdi:home-lightning-bolt-outline'),
        bron:houseForecastSource,
        recent_days:recentHouseDays,
        current_date:houseLearningDate,
        current_value_kwh:rounded(currentHouseKwh, 2),
        coverage_hours:rounded(coverageHours, 2),
        last_base_power_w:rounded(previousBasePowerW),
        last_sample_at:new Date(lastSampleAt).toISOString(),
        growatt_load_energy_today_kwh:rounded(loadEnergyTodayKwh, 2),
        meetmethode:'Integraal van totale dashboard-woningbalans minus werkelijk EV-laadvermogen'
    }),
    sensor('sensor.ess_audi_gepland_verbruik_morgen', rounded(audiPlannedTomorrowKwh, 2), measurement('ESS EV gepland verbruik morgen','kWh','energy','mdi:car-electric')),
    sensor('sensor.ess_wit_gepland_verbruik_morgen', rounded(witPlannedTomorrowKwh, 2), measurement('ESS WIT gepland verbruik morgen','kWh','energy','mdi:battery-charging-outline')),
    sensor('sensor.ess_totaal_verbruik_verwacht_morgen', rounded(totalConsumptionTomorrowKwh, 2), {
        ...measurement('ESS totaal verbruik verwacht morgen','kWh','energy','mdi:chart-timeline-variant'),
        woning_basis_kwh:rounded(houseForecastBaseKwh, 2),
        audi_gepland_kwh:rounded(audiPlannedTomorrowKwh, 2),
        wit_gepland_kwh:rounded(witPlannedTomorrowKwh, 2)
    }),
    sensor('sensor.ess_zon_referentieverwachting_vandaag', rounded(referenceTodayKwh, 2), {
        ...measurement('ESS zon referentieverwachting vandaag','kWh','energy','mdi:weather-sunny-alert'),
        referentiedatum:todayKey,
        bron:'Laatste verwachting voor morgen van de vorige kalenderdag'
    }),
    sensor('sensor.ess_zonproductie_werkelijk_vandaag', rounded(actualSolarTodayKwh, 2), {
        ...measurement('ESS zonproductie werkelijk vandaag','kWh','energy','mdi:solar-power-variant'),
        meetdatum:todayKey,
        bron:siteSolarToday === null ? 'Som van beschikbare omvormerdagmeters' : 'Totale Growatt-plantmeter'
    }),
    sensor('sensor.ess_zonverwachting_afwijking_vandaag', rounded(forecastDeviationKwh, 2), {
        ...measurement('ESS zonverwachting afwijking vandaag','kWh','energy','mdi:chart-bell-curve-cumulative'),
        meetdatum:todayKey,
        uitleg:'Positief is meer productie dan verwacht; negatief is minder'
    }),
    sensor('sensor.ess_zonverwachting_realisatie_vandaag', rounded(forecastRealizationPct, 1), {
        ...measurement('ESS zonverwachting realisatie vandaag','%','','mdi:percent-outline'),
        meetdatum:todayKey,
        uitleg:'Werkelijke productie gedeeld door de vooraf vastgezette verwachting'
    }),
    sensor('sensor.ess_zonverwachting_correctiefactor_vandaag', rounded(forecastCorrectionFactor, 3), {
        ...measurement('ESS zonverwachting correctiefactor vandaag','','','mdi:tune-vertical-variant'),
        meetdatum:todayKey,
        uitleg:'1,000 is exact; gebruik later een robuust gemiddelde van volledige dagen'
    })
];
node.status({ fill:'green', shape:'dot', text:decisionState+' · '+profile.label });
return [messages];`,
  outputs: 1, timeout: 0, noerr: 0, initialize: '', finalize: '', libs: [], x: 450, y: 1280,
  wires: [[ids.witHistoryPublish]]
});
flows.push({
  id: ids.witHistoryPublish, type: 'ha-api', z: FLOW_ID, name: 'Publiceer ESS-historie in Home Assistant',
  server: 'ess00000000000b', version: 1, debugenabled: false,
  protocol: 'http', method: 'post', path: '', data: '', dataType: 'jsonata', responseType: 'json', outputProperties: [],
  x: 790, y: 1280, wires: [[]]
});

const lightingControlConfig = Object.fromEntries(lightRooms.map((room) => [room.key, room.entityId]));
flows.push({
  id: ids.lightingControl, type: 'function', z: FLOW_ID, name: 'Veilige bediening verlichting',
  func: `const moduleConfig = flow.get('ess_system_config') || ${systemConfigJson};
if (moduleConfig.modules && moduleConfig.modules.lighting === false) return null;
const rooms = ${JSON.stringify(lightingControlConfig)};
const request = msg && msg.payload && typeof msg.payload === 'object' ? msg.payload : {};
const entityId = rooms[String(request.key || '')];
if (!entityId || !['ess/light/toggle','ess/light/brightness'].includes(msg.topic)) {
    node.warn('Onbekende verlichtingsopdracht geweigerd.');
    return null;
}
const ha = global.get('homeassistant');
const states = ha && ha.homeAssistant ? ha.homeAssistant.states || {} : {};
const config = moduleConfig;
const targetEntityId = config.entities && config.entities[entityId] || entityId;
const current = states[entityId];
const state = current ? String(current.state).toLowerCase() : 'unavailable';
if (!current || ['unknown','unavailable',''].includes(state)) return null;
const outputs = [null, null];
if (msg.topic === 'ess/light/brightness') {
    const requested = Number(request.brightness);
    if (!Number.isFinite(requested)) return null;
    const brightness = Math.max(1, Math.min(100, Math.round(requested)));
    outputs[0] = { payload: { brightness, target: { entity_id: [targetEntityId] } } };
} else if (state === 'on') {
    outputs[1] = { payload: { target: { entity_id: [targetEntityId] } } };
} else {
    const rawBrightness = Number(current.attributes && current.attributes.brightness);
    const brightness = Number.isFinite(rawBrightness) && rawBrightness > 0 ? Math.max(1, Math.min(100, Math.round(rawBrightness / 255 * 100))) : 100;
    outputs[0] = { payload: { brightness, target: { entity_id: [targetEntityId] } } };
}
return outputs;`,
  outputs: 2, timeout: 0, noerr: 0, initialize: '', finalize: '', libs: [], x: 1110, y: 420,
  wires: [[ids.lightingTurnOnAction],[ids.lightingTurnOffAction]]
});
for (const [id, name, service, data] of [
  [ids.lightingTurnOnAction, 'Schakel kamerlicht in of dim', 'turn_on', '{"brightness_pct": payload.brightness}'],
  [ids.lightingTurnOffAction, 'Schakel kamerlicht uit', 'turn_off', '{}']
]) flows.push({
  id, type: 'api-call-service', z: FLOW_ID, name, server: 'ess00000000000b', version: 7,
  debugenabled: false, action: `light.${service}`, floorId: [], areaId: [], deviceId: [], entityId: [], labelId: [],
  data, dataType: 'jsonata', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: false,
  domain: 'light', service, x: 1430, y: 420, wires: [[]]
});

const climateControlConfig = Object.fromEntries(climateZones.map((zone) => [zone.key, {
  entityId: zone.entityId, domain: zone.domain,
  min: zone.min, max: zone.max, step: zone.step, onMode: zone.onMode
}]));
flows.push({
  id: ids.climateControl, type: 'function', z: FLOW_ID, name: 'Veilige klimaatbediening',
  func: `const moduleConfig = flow.get('ess_system_config') || ${systemConfigJson};
if (moduleConfig.modules && moduleConfig.modules.climate === false) return null;
const zones = ${JSON.stringify(climateControlConfig)};
const request = msg && msg.payload && typeof msg.payload === 'object' ? msg.payload : {};
const selected = zones[String(request.key || '')];
if (!selected || !['ess/climate/set-temperature','ess/climate/toggle'].includes(msg.topic)) {
    node.warn('Onbekende klimaatopdracht geweigerd.');
    return null;
}
const ha = global.get('homeassistant');
const states = ha && ha.homeAssistant ? ha.homeAssistant.states || {} : {};
const entityId = selected.entityId;
const config = moduleConfig;
const targetEntityId = config.entities && config.entities[entityId] || entityId;
const current = entityId ? states[entityId] : null;
if (!current || ['unknown','unavailable',''].includes(String(current.state).toLowerCase())) return null;
const outputs = [null, null, null, null];
if (msg.topic === 'ess/climate/set-temperature') {
    const requested = Number(request.temperature);
    if (!Number.isFinite(requested)) return null;
    const rounded = Math.round(requested / selected.step) * selected.step;
    const temperature = Math.max(selected.min, Math.min(selected.max, rounded));
    const output = selected.domain === 'water_heater' ? 2 : 0;
    outputs[output] = { payload: { temperature, target: { entity_id: [targetEntityId] } } };
} else {
    const mode = String(current.state).toLowerCase() === 'off' ? selected.onMode : 'off';
    const output = selected.domain === 'water_heater' ? 3 : 1;
    outputs[output] = { payload: { mode, target: { entity_id: [targetEntityId] } } };
}
return outputs;`,
  outputs: 4, timeout: 0, noerr: 0, initialize: '', finalize: '', libs: [], x: 1110, y: 470,
  wires: [[ids.climateTemperatureAction],[ids.climateModeAction],[ids.waterTemperatureAction],[ids.waterModeAction]]
});

for (const [id, name, domain, service, data] of [
  [ids.climateTemperatureAction, 'Stel ruimtetemperatuur in', 'climate', 'set_temperature', '{"temperature": payload.temperature}'],
  [ids.climateModeAction, 'Schakel ruimteklimaat', 'climate', 'set_hvac_mode', '{"hvac_mode": payload.mode}'],
  [ids.waterTemperatureAction, 'Stel EHS tapwater in', 'water_heater', 'set_temperature', '{"temperature": payload.temperature}'],
  [ids.waterModeAction, 'Schakel EHS tapwater', 'water_heater', 'set_operation_mode', '{"operation_mode": payload.mode}']
]) flows.push({
  id, type: 'api-call-service', z: FLOW_ID, name, server: 'ess00000000000b', version: 7,
  debugenabled: false, action: `${domain}.${service}`, floorId: [], areaId: [], deviceId: [], entityId: [], labelId: [],
  data, dataType: 'jsonata', mergeContext: '', mustacheAltTags: false, outputProperties: [], queue: 'none', blockInputOverrides: false,
  domain, service, x: 1410, y: 470, wires: [[]]
});

const settingsTemplateIndex = flows.findIndex((item) => item.id === SETTINGS_TEMPLATE_ID);
if (settingsTemplateIndex >= 0) flows.splice(settingsTemplateIndex, 1);
node('ess000000000010').wires = [[]];

const audiControl = node(CONTROL_ID);
const overviewActionsMarker = '// Veilige snelacties vanaf het overzicht.';
if (!audiControl.func.includes(overviewActionsMarker)) {
  audiControl.func = audiControl.func.replace('let persistTime = null;', `let persistTime = null;
let climateMessage = null;
let vehicleActionMessage = null;

${overviewActionsMarker}`);

  audiControl.func = audiControl.func.replace(
    "if (msg.topic === 'ess/audi/smart-enabled' && typeof msg.payload === 'boolean') {\n    flow.set('ess_audi_smart_enabled', msg.payload);",
    `if (msg.topic === 'ess/audi/climate-start' && msg.payload === true) {
    const now = Date.now();
    const lastCommandAt = Number(flow.get('ess_audi_last_climate_at')) || 0;
    if (now - lastCommandAt < 60000) {
        flow.set('ess_audi_climate_status', { available: true, status: 'Opdracht al verzonden · even wachten', updatedAt: new Date(now).toISOString() });
    } else {
        flow.set('ess_audi_last_climate_at', now);
        flow.set('ess_audi_climate_status', { available: true, active: true, status: 'Klimaat gestart op 21 °C', updatedAt: new Date(now).toISOString() });
        climateMessage = { payload: { tempC: 21 } };
    }
} else if (msg.topic === 'ess/audi/vehicle-action' && ['lock','unlock'].includes(String(msg.payload))) {
    const now = Date.now();
    const lastCommandAt = Number(flow.get('ess_audi_last_vehicle_action_at')) || 0;
    if (now - lastCommandAt < 15000) {
        flow.set('ess_audi_vehicle_status', { available: true, status: 'Opdracht al verzonden · even wachten', updatedAt: new Date(now).toISOString() });
    } else {
        const action = String(msg.payload);
        flow.set('ess_audi_last_vehicle_action_at', now);
        flow.set('ess_audi_vehicle_status', { available: true, pending: true, status: action === 'lock' ? 'Vergrendelen aangevraagd' : 'Ontgrendelen aangevraagd', updatedAt: new Date(now).toISOString() });
        vehicleActionMessage = { payload: { action } };
    }
} else if (msg.topic === 'ess/audi/force-full' && typeof msg.payload === 'boolean') {
    flow.set('ess_audi_force_full', msg.payload);
    if (msg.payload) flow.set('ess_audi_smart_enabled', true);
} else if (msg.topic === 'ess/audi/smart-enabled' && typeof msg.payload === 'boolean') {
    flow.set('ess_audi_smart_enabled', msg.payload);
    if (!msg.payload) flow.set('ess_audi_force_full', false);`);

  audiControl.func = audiControl.func.replace(
    'return [{ payload: { changed: true, enabled, settings } }, persistTime];',
    'return [{ payload: { changed: true, enabled, settings } }, persistTime, climateMessage, vehicleActionMessage];');
}
audiControl.func = audiControl.func
  .replace(/function findEVDeviceId\(\) \{[\s\S]*?\n\}/, '')
  .replace(/function normaliseEVVin\(value\) \{[\s\S]*?return null;\n\}\n?/, '')
  .replace(
    /if \(msg\.topic === 'ess\/audi\/climate-start'[\s\S]*?\} else if \(msg\.topic === 'ess\/audi\/force-full'/,
    `if (msg.topic === 'ess/audi/climate-start' && msg.payload === true) {
    const now = Date.now();
    const lastCommandAt = Number(flow.get('ess_audi_last_climate_at')) || 0;
    if (now - lastCommandAt < 60000) {
        flow.set('ess_audi_climate_status', { available: true, status: 'Opdracht al verzonden · even wachten', updatedAt: new Date(now).toISOString() });
    } else {
        flow.set('ess_audi_last_climate_at', now);
        flow.set('ess_audi_climate_status', { available: true, active: true, status: 'Klimaat gestart op 21 °C', updatedAt: new Date(now).toISOString() });
        climateMessage = { payload: { tempC: 21 } };
    }
} else if (msg.topic === 'ess/audi/vehicle-action' && ['lock','unlock'].includes(String(msg.payload))) {
    const now = Date.now();
    const lastCommandAt = Number(flow.get('ess_audi_last_vehicle_action_at')) || 0;
    if (now - lastCommandAt < 15000) {
        flow.set('ess_audi_vehicle_status', { available: true, status: 'Opdracht al verzonden · even wachten', updatedAt: new Date(now).toISOString() });
    } else {
        const action = String(msg.payload);
        flow.set('ess_audi_last_vehicle_action_at', now);
        flow.set('ess_audi_vehicle_status', { available: true, pending: true, status: action === 'lock' ? 'Vergrendelen aangevraagd' : 'Ontgrendelen aangevraagd', updatedAt: new Date(now).toISOString() });
        vehicleActionMessage = { payload: { action } };
    }
    } else if (msg.topic === 'ess/audi/force-full'`);
audiControl.func = audiControl.func.replace(
  "    departureSoc: Number.isFinite(Number(stored.departureSoc)) ? Number(stored.departureSoc) : legacyTarget\n};",
  "    departureSoc: Number.isFinite(Number(stored.departureSoc)) ? Number(stored.departureSoc) : legacyTarget,\n    solarSoc: Number.isFinite(Number(stored.solarSoc)) ? Number(stored.solarSoc) : 100\n};");

const solarSocSettingBranch = `} else if (msg.topic === 'ess/audi/solar-soc') {
    const value = Number(msg.payload);
    if (!Number.isFinite(value) || value < 20 || value > 100) return reject();
    settings.solarSoc = Math.round(value);
    flow.set('ess_audi_settings', settings);
`;
if (audiControl.func.includes("msg.topic === 'ess/audi/solar-soc'")) {
  audiControl.func = audiControl.func.replace(
    /} else if \(msg\.topic === 'ess\/audi\/solar-soc'\)[\s\S]*?(?=} else if \(msg\.topic === 'ess\/audi\/departure-time')/,
    solarSocSettingBranch);
} else {
  audiControl.func = audiControl.func.replace(
    "} else if (msg.topic === 'ess/audi/departure-time' &&",
    `${solarSocSettingBranch}} else if (msg.topic === 'ess/audi/departure-time' &&`);
}
audiControl.outputs = 4;
audiControl.wires = [
  ['ess00000000000a','ess00000000000d'],
  ['ess000000000012'],
  [ids.climateDevice],
  [ids.vehicleDevice]
];

const model = node(MODEL_ID);
const detailIds = [OVERVIEW_TEMPLATE_ID,ids.energyTemplate,ids.batteryTemplate,ids.evTemplate,ids.loadsTemplate,ids.lightingTemplate,ids.climateTemplate,ids.systemTemplate,ids.configTemplate];
model.wires = [detailIds];
if (!model.func.includes('details: { grid: []')) {
  model.func = model.func.replace("    alarms: [{ level: 'info', text: 'Home Assistant-entiteiten moeten nog worden gekoppeld.' }]",
    "    details: { grid: [], solar: [], battery: [], ev: [], loads: [], system: [] },\n    alarms: [{ level: 'info', text: 'Home Assistant-entiteiten moeten nog worden gekoppeld.' }]");
}
model.func = model.func
  .replace("audiSmart: { enabled: false, active: false, status: 'Uit', targetCurrent: 0, phaseMode: 1 },",
    "audiSmart: { enabled: false, active: false, forceFull: false, status: 'Uit', targetCurrent: 0, phaseMode: 1 },\n    audiClimate: { available: false, active: false, status: 'Nog niet gekoppeld' },\n    lighting: { rooms: [], onCount: 0, totalCount: 0 },\n    climate: { outside: {}, aircos: [], tado: [], heatPump: {}, hotWater: {} },");
if (!model.func.includes('lighting: { rooms: []')) {
  model.func = model.func.replace(
    "    climate: { outside: {}, aircos: [], tado: [], heatPump: {}, hotWater: {} },",
    "    lighting: { rooms: [], onCount: 0, totalCount: 0 },\n    climate: { outside: {}, aircos: [], tado: [], heatPump: {}, hotWater: {} },");
}
if (!model.func.includes('nas: { name:')) {
  model.func = model.func.replace(
    "    lighting: { rooms: [], onCount: 0, totalCount: 0 },",
    "    nas: { name: 'NAS', model: 'DS223j', available: false, ok: false, drive: {}, volume: {} },\n    lighting: { rooms: [], onCount: 0, totalCount: 0 },");
}
if (!model.func.includes('climate: { outside: {}')) {
  model.func = model.func.replace(
    "    audiClimate: { available: false, active: false, status: 'Nog niet gekoppeld' },",
    "    audiClimate: { available: false, active: false, status: 'Nog niet gekoppeld' },\n    climate: { outside: {}, aircos: [], tado: [], heatPump: {}, hotWater: {} },");
}
model.func = model.func
  .replace(
    "    solar: { power: null, today: null },",
    "    solar: { power: null, today: null, actualToday: null, forecastToday: null, forecastTomorrow: null },")
  .replace(
    "    house: { power: null },",
    "    house: { power: null, forecastBaseTomorrow: null, audiPlannedTomorrow: 0, witPlannedTomorrow: 0, forecastTomorrow: null },");

const mapper = node(MAPPER_ID);
mapper.func = mapper.func.replaceAll('NASty', 'NAS');
const normalizedNasMarker = '// Bevestigde Synology DSM-entiteiten van NAS.';
const firstNasMarkerAt = mapper.func.indexOf(normalizedNasMarker);
const duplicateNasMarkerAt = firstNasMarkerAt < 0 ? -1 : mapper.func.indexOf(normalizedNasMarker, firstNasMarkerAt + normalizedNasMarker.length);
if (duplicateNasMarkerAt >= 0) {
  const duplicateNasEndAt = mapper.func.indexOf('function audiDashboardReading(pattern) {', duplicateNasMarkerAt);
  if (duplicateNasEndAt >= 0) mapper.func = mapper.func.slice(0, duplicateNasMarkerAt) + mapper.func.slice(duplicateNasEndAt);
}
mapper.func = mapper.func
  .replace(/(?:const nasStatus = nasDashboardModel\(\);\n){2,}/g, 'const nasStatus = nasDashboardModel();\n')
  .replace(/(?:for \(const issue of nasStatus\.issues \|\| \[\]\) alarms\.push\(issue\);\n){2,}/g, 'for (const issue of nasStatus.issues || []) alarms.push(issue);\n')
  .replace(/(?:    nas: nasStatus,\n){2,}/g, '    nas: nasStatus,\n');
const forecastSolarStrictMarker = 'const forecastSolarTodayEntityIds = [';
if (!mapper.func.includes(forecastSolarStrictMarker)) {
  mapper.func = mapper.func.replace(
    /function forecastSolarToday\(\) \{[\s\S]*?\n\}/,
    `function forecastSolarToday() {
    // Alleen de drie echte Forecast.Solar-dagtotalen. Zo kan een eigen
    // historiesensor met "zonproductie vandaag" in de naam nooit als
    // verwachting worden dubbelgeteld.
    const forecastSolarTodayEntityIds = [
        'sensor.energy_production_today',
        'sensor.energy_production_today_2',
        'sensor.energy_production_today_3'
    ];
    const readings = forecastSolarTodayEntityIds
        .map((id) => energyKwh(entity(id)))
        .filter((reading) => reading !== null);
    return readings.length ? readings.reduce((total, reading) => total + reading, 0) : null;
}`);
}
const forecastSolarTomorrowMarker = 'const forecastSolarTomorrowEntityIds = [';
if (!mapper.func.includes(forecastSolarTomorrowMarker)) {
  mapper.func = mapper.func.replace(
    'function chargerDayEnergy(chargerName) {',
    `function forecastSolarTomorrow() {
    const forecastSolarTomorrowEntityIds = [
        'sensor.energy_production_tomorrow',
        'sensor.energy_production_tomorrow_2',
        'sensor.energy_production_tomorrow_3'
    ];
    const readings = forecastSolarTomorrowEntityIds
        .map((id) => energyKwh(entity(id)))
        .filter((reading) => reading !== null);
    return readings.length ? readings.reduce((total, reading) => total + reading, 0) : null;
}

function chargerDayEnergy(chargerName) {`);
}
if (!mapper.func.includes('const directCharger = entity(chargerName);')) {
  mapper.func = mapper.func.replace(
    'function chargerDayEnergy(chargerName) {\n    const wanted = String(chargerName).toLowerCase();',
    `function chargerDayEnergy(chargerName) {
    const directCharger = entity(chargerName);
    if (directCharger) {
        const directAttributes = directCharger.attributes || {};
        const directReading = directAttributes.cost_day_totalEnergyUsage
            ?? directAttributes.cost_day_total_energy_usage
            ?? directAttributes.totalEnergyUsage
            ?? directAttributes.total_energy_usage;
        const directNumber = Number(directReading);
        if (Number.isFinite(directNumber) && directNumber >= 0) return directNumber;
        return energyKwh(directCharger);
    }
    const wanted = String(chargerName).toLowerCase();`);
}
const batteryScaleCorrectionMarker = 'const batteryPowerScaleVersion = 2;';
if (!mapper.func.includes(batteryScaleCorrectionMarker)) {
  const batteryPowerLegacyBlock = "const batteryPowerReading = value('sensor.growatt_wit_battery_battery_power');\nconst batteryPower = batteryPowerReading !== null && Math.abs(batteryPowerReading) <= 15000 ? batteryPowerReading : null;\nconst systemOutputPower = value('sensor.growatt_wit_solar_system_output_power');";
  const batteryPowerV1Block = `const batteryPowerReading = value('sensor.growatt_wit_battery_battery_power');
// Growatt Modbus kan bij de WIT 4-15kW de VPP-waarde door een verkeerde
// stroombron en schaal exact tien keer te hoog publiceren. Corrigeer uitsluitend
// boven de fysieke 15kW-grens en alleen wanneer delen door tien geldig wordt.
const batteryPowerScaleCorrected = batteryPowerReading !== null
    && Math.abs(batteryPowerReading) > 15000
    && Math.abs(batteryPowerReading / 10) <= 15000;
const batteryPowerCandidate = batteryPowerScaleCorrected ? batteryPowerReading / 10 : batteryPowerReading;
const batteryPower = batteryPowerCandidate !== null && Math.abs(batteryPowerCandidate) <= 15000
    ? batteryPowerCandidate
    : null;
const systemOutputPower = value('sensor.growatt_wit_solar_system_output_power');`;
  const batteryPowerV2Block = `const batteryPowerReading = value('sensor.growatt_wit_battery_battery_power');
const systemOutputPower = value('sensor.growatt_wit_solar_system_output_power');
// Growatt Modbus kan bij de WIT-HU-serie de VPP-waarde exact tien keer te hoog
// publiceren. Herken dit 's nachts aan de onafhankelijke WIT-metingen, onthoud
// de schaal en schakel vanzelf terug zodra Growatt weer correcte waarden levert.
// De 15 kW plausibiliteitsgrens hieronder hoort bij de twee AXE-stacks
// (circa 12 kW continu) en is dus niet de 18 kW AC-grens van de omvormer.
const batteryPowerScaleVersion = 2;
const storedBatteryPowerScale = Number(flow.get('ess_growatt_battery_power_scale'));
let batteryPowerScale = storedBatteryPowerScale === 0.1 ? 0.1 : 1;
const batteryReferenceCandidates = [witMeterPower, systemOutputPower]
    .filter((reading) => reading !== null && Number.isFinite(Number(reading)))
    .map((reading) => Math.abs(Number(reading)));
const batteryReferencePower = batteryReferenceCandidates.length ? Math.max(...batteryReferenceCandidates) : null;
const batteryScaleCanCompare = batteryPowerReading !== null
    && witSolarPower !== null && Math.abs(witSolarPower) < 100
    && batteryReferencePower !== null && batteryReferencePower >= 200;
if (batteryScaleCanCompare) {
    const batteryPowerRatio = Math.abs(batteryPowerReading) / batteryReferencePower;
    if (batteryPowerRatio >= 7 && batteryPowerRatio <= 13) batteryPowerScale = 0.1;
    else if (batteryPowerRatio >= 0.5 && batteryPowerRatio <= 1.5) batteryPowerScale = 1;
}
if (batteryPowerReading !== null && Math.abs(batteryPowerReading) > 15000 && Math.abs(batteryPowerReading / 10) <= 15000) {
    batteryPowerScale = 0.1;
}
flow.set('ess_growatt_battery_power_scale', batteryPowerScale);
const batteryPowerScaleCorrected = batteryPowerReading !== null && batteryPowerScale === 0.1;
const batteryPowerCandidate = batteryPowerReading === null ? null : Math.round(batteryPowerReading * batteryPowerScale * 10) / 10;
const batteryPower = batteryPowerCandidate !== null && Math.abs(batteryPowerCandidate) <= 15000
    ? batteryPowerCandidate
    : null;`;
  mapper.func = mapper.func.replace(
    mapper.func.includes('const batteryPowerScaleCorrected =') ? batteryPowerV1Block : batteryPowerLegacyBlock,
    batteryPowerV2Block);
  mapper.func = mapper.func.replace(
    "if (batteryPowerReading !== null && Math.abs(batteryPowerReading) > 15000) {\n    alarms.push({ level: 'warning', text: 'Growatt meldt een onwaarschijnlijk accuvermogen van ' + Math.round(batteryPowerReading / 100) / 10 + ' kW; accuwaarde wordt verborgen.' });\n}",
    `if (batteryPowerScaleCorrected) {
    alarms.push({ level: 'warning', text: 'Growatt accuvermogen is automatisch gecorrigeerd van ' + Math.round(batteryPowerReading / 100) / 10 + ' naar ' + Math.round(batteryPower / 100) / 10 + ' kW (bekende WIT ×10-schaalfout).' });
} else if (batteryPowerReading !== null && Math.abs(batteryPowerReading) > 15000) {
    alarms.push({ level: 'warning', text: 'Growatt meldt een onwaarschijnlijk accuvermogen van ' + Math.round(batteryPowerReading / 100) / 10 + ' kW; accuwaarde wordt verborgen.' });
}`);
}
mapper.func = mapper.func.replace(
  "// Growatt Modbus kan bij de WIT 4-15kW de VPP-waarde exact tien keer te hoog\n// publiceren. Herken dit 's nachts aan de onafhankelijke WIT-metingen, onthoud\n// de schaal en schakel vanzelf terug zodra Growatt weer correcte waarden levert.",
  "// Growatt Modbus kan bij de WIT-HU-serie de VPP-waarde exact tien keer te hoog\n// publiceren. Herken dit 's nachts aan de onafhankelijke WIT-metingen, onthoud\n// de schaal en schakel vanzelf terug zodra Growatt weer correcte waarden levert.\n// De 15 kW plausibiliteitsgrens hieronder hoort bij de twee AXE-stacks\n// (circa 12 kW continu) en is dus niet de 18 kW AC-grens van de omvormer."
);
mapper.func = mapper.func.replace(
  'const batteryPowerCandidate = batteryPowerReading === null ? null : batteryPowerReading * batteryPowerScale;',
  'const batteryPowerCandidate = batteryPowerReading === null ? null : Math.round(batteryPowerReading * batteryPowerScale * 10) / 10;');
mapper.func = mapper.func.replace(
  "const witMeterPower = value('sensor.accu_vermogen');\nconst batteryPowerReading = value('sensor.growatt_wit_battery_battery_power');\nconst systemOutputPower = value('sensor.growatt_wit_solar_system_output_power');",
  "const backupLoadPower = value('sensor.accu_vermogen');\nconst batteryPowerReading = value('sensor.growatt_wit_battery_battery_power');\nconst systemOutputPower = value('sensor.growatt_wit_solar_system_output_power');\n// De HomeWizard meet sinds de plaatsing van de 18K-HU uitsluitend de back-upuitgang.\n// Gebruik Growatt System Output voor het totale, signed WIT-vermogen.\nconst witPower = systemOutputPower === null ? null : -systemOutputPower;"
);
mapper.func = mapper.func.replace(
  'const batteryReferenceCandidates = [witMeterPower, systemOutputPower]',
  'const batteryReferenceCandidates = [systemOutputPower]');
mapper.func = mapper.func.replace(
  "const housePower = witMeterPower !== null && gridPower !== null\n    ? Math.max(0, (pvExtraPower || 0) + gridPower - witMeterPower)\n    : systemOutputPower !== null && gridPower !== null\n        ? Math.max(0, systemOutputPower + (pvExtraPower || 0) + gridPower)\n        : houseBasePower === null ? null : Math.max(0, houseBasePower + (pvExtraPower || 0));",
  "const housePower = systemOutputPower !== null && gridPower !== null\n    ? Math.max(0, systemOutputPower + (pvExtraPower || 0) + gridPower)\n    : houseBasePower === null ? null : Math.max(0, houseBasePower + (pvExtraPower || 0));"
);
mapper.func = mapper.func.replace("['HomeWizard WIT-meter', witMeterPower]", "['Growatt WIT-uitgang', witPower]");
mapper.func = mapper.func.replace(
  'wit: { power: witMeterPower, systemOutputPower, solarPower: witSolarPower, today: witToday }',
  'wit: { power: witPower, systemOutputPower, backupLoadPower, solarPower: witSolarPower, today: witToday }');
const witExportDashboardMarker = "const witExportLimitEntity = entity('select.growatt_grid_vpp_export_limit_enable');";
if (!mapper.func.includes(witExportDashboardMarker)) {
  mapper.func = mapper.func.replace(
    "const witPower = systemOutputPower === null ? null : -systemOutputPower;",
    `const witPower = systemOutputPower === null ? null : -systemOutputPower;
const witExportLimitEntity = entity('select.growatt_grid_vpp_export_limit_enable');
const witExportLimitState = witExportLimitEntity ? String(witExportLimitEntity.state).toLowerCase() : '';
const witExportLimitEnabled = witExportLimitState === 'enabled' ? true : witExportLimitState === 'disabled' ? false : null;
const witExportLimitRate = value('number.growatt_grid_vpp_export_limit_power_rate');`);
  mapper.func = mapper.func.replace(
    'wit: { power: witPower, systemOutputPower, backupLoadPower, solarPower: witSolarPower, today: witToday }',
    'wit: { power: witPower, systemOutputPower, backupLoadPower, solarPower: witSolarPower, today: witToday, exportLimitEnabled: witExportLimitEnabled, exportLimitRate: witExportLimitRate }');
}
const witExportModeMarker = "const witExportLimitModeStored = String(flow.get('ess_wit_export_mode') || 'auto').toLowerCase();";
if (!mapper.func.includes(witExportModeMarker)) {
  mapper.func = mapper.func.replace(
    "const witExportLimitRate = value('number.growatt_grid_vpp_export_limit_power_rate');",
    `const witExportLimitRate = value('number.growatt_grid_vpp_export_limit_power_rate');
const witExportLimitModeStored = String(flow.get('ess_wit_export_mode') || 'auto').toLowerCase();
const witExportLimitMode = ['on','off'].includes(witExportLimitModeStored) ? witExportLimitModeStored : 'auto';`);
  mapper.func = mapper.func.replace(
    'wit: { power: witPower, systemOutputPower, backupLoadPower, solarPower: witSolarPower, today: witToday, exportLimitEnabled: witExportLimitEnabled, exportLimitRate: witExportLimitRate }',
    'wit: { power: witPower, systemOutputPower, backupLoadPower, solarPower: witSolarPower, today: witToday, exportLimitEnabled: witExportLimitEnabled, exportLimitRate: witExportLimitRate, exportLimitMode: witExportLimitMode }');
}
const witEVDashboardMarker = "const witEVDischargeStored = flow.get('ess_wit_audi_discharge_status') || {};";
if (!mapper.func.includes(witEVDashboardMarker)) {
  mapper.func = mapper.func.replace(
    "const witExportLimitMode = ['on','off'].includes(witExportLimitModeStored) ? witExportLimitModeStored : 'auto';",
    `const witExportLimitMode = ['on','off'].includes(witExportLimitModeStored) ? witExportLimitModeStored : 'auto';
const witEVDischargeStored = flow.get('ess_wit_audi_discharge_status') || {};
const witEVDischargePower = Number.isFinite(Number(witEVDischargeStored.targetPowerW)) ? Number(witEVDischargeStored.targetPowerW) : 0;
const witEVDischargeBudgetKwh = Number.isFinite(Number(witEVDischargeStored.safeDischargeBudgetKwh)) ? Number(witEVDischargeStored.safeDischargeBudgetKwh) : null;
const witEVBufferModeStored = String(flow.get('ess_wit_audi_buffer_mode') || 'normal').toLowerCase();
const witEVBufferMode = ['eco','audi'].includes(witEVBufferModeStored) ? witEVBufferModeStored : 'normal';`);
  mapper.func = mapper.func.replace(
    'wit: { power: witPower, systemOutputPower, backupLoadPower, solarPower: witSolarPower, today: witToday, exportLimitEnabled: witExportLimitEnabled, exportLimitRate: witExportLimitRate, exportLimitMode: witExportLimitMode }',
    `wit: { power: witPower, systemOutputPower, backupLoadPower, solarPower: witSolarPower, today: witToday, exportLimitEnabled: witExportLimitEnabled, exportLimitRate: witExportLimitRate, exportLimitMode: witExportLimitMode,
        audiDischargeActive: witEVDischargeStored.active === true,
        audiDischargeStatus: String(witEVDischargeStored.status || 'Stand-by'),
        audiDischargePower: witEVDischargePower,
        audiDischargeBudgetKwh: witEVDischargeBudgetKwh,
        audiBufferMode: witEVBufferMode }`);
}
if (!mapper.func.includes('const witEVBufferModeStored =')) {
  mapper.func = mapper.func.replace(
    'const witEVDischargeBudgetKwh = Number.isFinite(Number(witEVDischargeStored.safeDischargeBudgetKwh)) ? Number(witEVDischargeStored.safeDischargeBudgetKwh) : null;',
    `const witEVDischargeBudgetKwh = Number.isFinite(Number(witEVDischargeStored.safeDischargeBudgetKwh)) ? Number(witEVDischargeStored.safeDischargeBudgetKwh) : null;
const witEVBufferModeStored = String(flow.get('ess_wit_audi_buffer_mode') || 'normal').toLowerCase();
const witEVBufferMode = ['eco','audi'].includes(witEVBufferModeStored) ? witEVBufferModeStored : 'normal';`);
  mapper.func = mapper.func.replace(
    'audiDischargeBudgetKwh: witEVDischargeBudgetKwh }',
    'audiDischargeBudgetKwh: witEVDischargeBudgetKwh,\n        audiBufferMode: witEVBufferMode }');
}
const witGridChargeDashboardMarker = "const witGridChargeStored = flow.get('ess_wit_grid_charge_status') || {};";
if (!mapper.func.includes(witGridChargeDashboardMarker)) {
  mapper.func = mapper.func.replace(
    "const witEVBufferMode = ['eco','audi'].includes(witEVBufferModeStored) ? witEVBufferModeStored : 'normal';",
    `const witEVBufferMode = ['eco','audi'].includes(witEVBufferModeStored) ? witEVBufferModeStored : 'normal';
const witGridChargeStored = flow.get('ess_wit_grid_charge_status') || {};
const witGridChargeModeStored = String(flow.get('ess_wit_grid_charge_mode') || 'auto').toLowerCase();
const witGridChargeMode = ['on','off'].includes(witGridChargeModeStored) ? witGridChargeModeStored : 'auto';
const witGridChargeTargetSoc = Math.max(20, Math.min(100, Number(flow.get('ess_wit_grid_charge_target_soc')) || 80));`);
  mapper.func = mapper.func.replace(
    'audiBufferMode: witEVBufferMode }',
    `audiBufferMode: witEVBufferMode,
        gridCharge: {
            mode:witGridChargeMode,
            targetSoc:witGridChargeTargetSoc,
            active:witGridChargeStored.active === true,
            sessionOwned:witGridChargeStored.sessionOwned === true,
            status:String(witGridChargeStored.status || 'Wacht op regeldata'),
            currentStoredKwh:Number.isFinite(Number(witGridChargeStored.currentStoredKwh)) ? Number(witGridChargeStored.currentStoredKwh) : null,
            expectedHouseKwh:Number.isFinite(Number(witGridChargeStored.expectedHouseKwh)) ? Number(witGridChargeStored.expectedHouseKwh) : null,
            expectedSolarChargeKwh:Number.isFinite(Number(witGridChargeStored.expectedSolarChargeKwh)) ? Number(witGridChargeStored.expectedSolarChargeKwh) : null,
            gridEnergyNeededKwh:Number.isFinite(Number(witGridChargeStored.gridEnergyNeededKwh)) ? Number(witGridChargeStored.gridEnergyNeededKwh) : null,
            plannedPowerKw:Number(witGridChargeStored.plannedPowerKw) || 0,
            plannedEnergyKwh:Number(witGridChargeStored.plannedEnergyKwh) || 0,
            plannedCost:Number(witGridChargeStored.plannedCost) || 0,
            scheduledNow:witGridChargeStored.scheduledNow === true,
            nextScheduledStart:witGridChargeStored.nextScheduledStart || null,
            nextScheduledEnd:witGridChargeStored.nextScheduledEnd || null,
            selectedSlots:Array.isArray(witGridChargeStored.selectedSlots) ? witGridChargeStored.selectedSlots : [],
            planComplete:witGridChargeStored.planComplete === true,
            reserveLabel:String(witGridChargeStored.reserveLabel || 'Normaal')
        } }`);
}
const tomorrowDashboardMarker = 'const forecastSolarTomorrowKwh = forecastSolarTomorrow();';
if (!mapper.func.includes(tomorrowDashboardMarker)) {
  mapper.func = mapper.func.replace(
    "const audiControlStatus = flow.get('ess_audi_control_status') || {};",
    `const audiControlStatus = flow.get('ess_audi_control_status') || {};
const forecastSolarTomorrowKwh = forecastSolarTomorrow();
function dashboardLocalDayKey(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
function plannedDashboardEnergyForDay(planStatus, dayKey) {
    const slots = Array.isArray(planStatus && planStatus.selectedSlots) ? planStatus.selectedSlots : [];
    return slots.reduce((total, slot) => {
        const start = new Date(slot && slot.start);
        const end = new Date(slot && slot.end);
        if (Number.isNaN(start.getTime()) || dashboardLocalDayKey(start) !== dayKey) return total;
        const directValue = slot && slot.energyKwh !== undefined ? slot.energyKwh : slot && slot.energy;
        const directEnergy = directValue === null || directValue === undefined || directValue === '' ? null : Number(directValue);
        if (Number.isFinite(directEnergy) && directEnergy >= 0) return total + directEnergy;
        const powerKw = Number(slot && slot.powerKw);
        const durationHours = Number.isNaN(end.getTime()) ? null : Math.max(0, end.getTime() - start.getTime()) / 3600000;
        return Number.isFinite(powerKw) && durationHours !== null ? total + powerKw * durationHours : total;
    }, 0);
}
const dashboardTomorrowDate = new Date();
dashboardTomorrowDate.setDate(dashboardTomorrowDate.getDate() + 1);
const dashboardTomorrowKey = dashboardLocalDayKey(dashboardTomorrowDate);
const audiPlannedTomorrowKwh = plannedDashboardEnergyForDay(audiControlStatus, dashboardTomorrowKey);
const witPlannedTomorrowKwh = plannedDashboardEnergyForDay(witGridChargeStored, dashboardTomorrowKey);
const houseConsumptionLearning = flow.get('ess_house_consumption_learning') || {};
const learnedHouseForecastValue = houseConsumptionLearning.forecastKwh;
const learnedHouseForecastKwh = learnedHouseForecastValue === null || learnedHouseForecastValue === undefined || learnedHouseForecastValue === ''
    ? null
    : Number(learnedHouseForecastValue);
const restoredHouseForecastKwh = value('sensor.ess_woningverbruik_basis_verwacht_morgen');
const houseForecastFallbacks = { eco:14, normal:10, audi:6 };
const houseForecastBaseTomorrowKwh = Number.isFinite(learnedHouseForecastKwh)
    ? learnedHouseForecastKwh
    : restoredHouseForecastKwh !== null
        ? restoredHouseForecastKwh
        : houseForecastFallbacks[witEVBufferMode] || houseForecastFallbacks.normal;
const houseForecastTomorrowKwh = houseForecastBaseTomorrowKwh + audiPlannedTomorrowKwh + witPlannedTomorrowKwh;`);
  mapper.func = mapper.func.replace(
    '        forecastToday: forecastSolarTodayKwh\n    },',
    '        forecastToday: forecastSolarTodayKwh,\n        forecastTomorrow: forecastSolarTomorrowKwh\n    },');
  mapper.func = mapper.func.replace(
    '    house: { power: housePower },',
    `    house: {
        power:housePower,
        forecastBaseTomorrow:houseForecastBaseTomorrowKwh,
        audiPlannedTomorrow:audiPlannedTomorrowKwh,
        witPlannedTomorrow:witPlannedTomorrowKwh,
        forecastTomorrow:houseForecastTomorrowKwh
    },`);
}
const staleExtraPvMarker = 'const loosePvPowerIds = [';
if (!mapper.func.includes(staleExtraPvMarker)) {
  mapper.func = mapper.func.replace(
    `const pvExtraPower = sum([
    ['sensor.pv_array_1_power'],
    ['sensor.pv_array_2_power'],
    ['sensor.pv_array_3_power']
]);`,
    `const loosePvPowerIds = [
    'sensor.pv_array_1_power',
    'sensor.pv_array_2_power',
    'sensor.pv_array_3_power'
];
const loosePvAfterSunset = String((entity('sun.sun') || {}).state || '').toLowerCase() === 'below_horizon';
const freshLoosePvPowers = loosePvPowerIds.map((id) => {
    const item = entity(id);
    const reading = value(id);
    const updatedAt = new Date(item && (item.last_updated || item.last_changed) || 0).getTime();
    const fresh = Number.isFinite(updatedAt) && Date.now() - updatedAt <= 15 * 60 * 1000;
    return reading !== null && fresh ? Math.max(0, reading) : null;
}).filter((reading) => reading !== null);
// Sommige cloudomvormers houden 's nachts hun laatste dagvermogen vast.
// Na zonsondergang is losse PV daarom altijd nul; overdag tellen uitsluitend
// waarden mee die Home Assistant de afgelopen vijftien minuten heeft vernieuwd.
const pvExtraPower = loosePvAfterSunset
    ? 0
    : freshLoosePvPowers.length
        ? freshLoosePvPowers.reduce((total, reading) => total + reading, 0)
        : null;`);
}
// De nieuwe WIT 18K-HU is in Home Assistant als `growatt` aangemaakt; de oude
// omvormer gebruikte het voorvoegsel `growatt_wit`. Houd de kernmapping expliciet
// op het bevestigde nieuwe apparaat zodat ontbrekende waarden direct opvallen.
mapper.func = mapper.func
  .replaceAll('sensor.growatt_wit_', 'sensor.growatt_')
  .replaceAll('binary_sensor.growatt_wit_', 'binary_sensor.growatt_');
const discoveryMarker = '// Aanvullende sensoren worden één keer ingedeeld voor de detailpagina’s.';
if (!mapper.func.includes(discoveryMarker)) {
  const discoveryCode = String.raw`
${discoveryMarker}
const dashboardCoreEntities = new Set([
    'sensor.p1_meter_vermogen','sensor.p1_meter_vermogen_fase_1','sensor.p1_meter_vermogen_fase_2','sensor.p1_meter_vermogen_fase_3',
    'sensor.accu_vermogen','sensor.growatt_wit_battery_battery_power','sensor.growatt_wit_battery_battery_soc',
    'sensor.growatt_wit_load_house_consumption','sensor.growatt_wit_solar_energy_today','sensor.growatt_wit_solar_solar_total_power','sensor.growatt_wit_solar_system_output_power',
    'sensor.ev_charger_status','sensor.ev_charger_power','sensor.1_status','sensor.1_vermogen','sensor.ev_state_of_charge',
    'sensor.flex_load_2_power','sensor.flex_load_3_power','sensor.flex_load_4_power','sensor.flex_load_5_power','sensor.flex_load_6_power','sensor.flex_load_7_power',
    'sensor.nas_cpu_gebruik_totaal','sensor.nas_geheugengebruik_fysiek','sensor.nas_temperatuur','sensor.nas_download_doorvoer','sensor.nas_upload_doorvoer',
    'sensor.nas_drive_2_status','sensor.nas_drive_2_temperatuur','sensor.nas_volume_1_status','sensor.nas_volume_1_gebruikte_ruimte','sensor.nas_volume_1_volume_gebruikt'
]);

function discoverDetailSensors() {
    const groups = { grid: [], solar: [], battery: [], ev: [], loads: [], system: [] };
    const usefulUnit = /^(w|kw|wh|kwh|a|v|hz|%|°c|c|eur\/kwh|€\/kwh)$/i;
    for (const [id, item] of Object.entries(states)) {
        if (dashboardCoreEntities.has(id) || !item || !item.attributes) continue;
        if (!id.startsWith('sensor.') && !id.startsWith('binary_sensor.')) continue;
        const label = String(item.attributes.friendly_name || id.replace(/^(sensor|binary_sensor)\./, '').replace(/_/g, ' '));
        const haystack = (id + ' ' + label).toLowerCase();
        const unit = String(item.attributes.unit_of_measurement || '');
        const isBinary = id.startsWith('binary_sensor.');
        if (!isBinary && !usefulUnit.test(unit) && !['on','off','online','offline','available','unavailable'].includes(String(item.state).toLowerCase())) continue;
        let category = null;
        if (/easee|audi|kia|laad|charger|links/.test(haystack)) category = 'ev';
        else if (/warmtepomp|airco|jacuzzi|boiler|heat.?pump/.test(haystack)) category = 'loads';
        else if (/battery|bms|accu|axe/.test(haystack)) category = 'battery';
        else if (/p1|homewizard|grid|netvermogen|slimme.?meter|fase/.test(haystack)) category = 'grid';
        else if (/pv|solar|zonne|opbrengst|production/.test(haystack)) category = 'solar';
        else if (/growatt|wit|inverter|omvormer|warning|fault|online|frequency|temperatuur|temperature/.test(haystack)) category = 'system';
        if (!category || groups[category].length >= 18) continue;
        const numeric = Number(item.state);
        groups[category].push({ id, label, value: Number.isFinite(numeric) ? Math.round(numeric * 100) / 100 : item.state, unit, updatedAt: item.last_updated || item.last_changed || null });
    }
    for (const values of Object.values(groups)) values.sort((a,b) => a.label.localeCompare(b.label, 'nl'));
    return groups;
}

const detailSensors = discoverDetailSensors();
`;
  mapper.func = mapper.func.replace('const alarms = [];', `${discoveryCode}\nconst alarms = [];`);
  mapper.func = mapper.func.replace('    alarms\n};', '    details: detailSensors,\n    alarms\n};');
}
// Herstel ook eerder gegenereerde versies waarin JavaScript string-escaping de
// slash of punt uit de reguliere expressie heeft verwijderd.
mapper.func = mapper.func
  .replace('eur/kwh|€/kwh', String.raw`eur\/kwh|€\/kwh`)
  .replace('/^(sensor|binary_sensor)./', String.raw`/^(sensor|binary_sensor)\./`);

if (!mapper.func.includes("const audiForceFull = flow.get('ess_audi_force_full')")) {
  mapper.func = mapper.func.replace(
    "const audiSmartEnabled = flow.get('ess_audi_smart_enabled') === true;",
    "const audiSmartEnabled = flow.get('ess_audi_smart_enabled') === true;\nconst audiForceFull = flow.get('ess_audi_force_full') === true;\nconst audiClimateStatus = flow.get('ess_audi_climate_status') || { available: false, active: false, status: 'Klimaat beschikbaar na koppeling' };");
  mapper.func = mapper.func.replace(
    '        enabled: audiSmartEnabled,\n        active:',
    '        enabled: audiSmartEnabled,\n        forceFull: audiForceFull,\n        active:');
  mapper.func = mapper.func.replace(
    '    ev: [',
    '    audiClimate: audiClimateStatus,\n    ev: [');
}

if (!mapper.func.includes('departureSoc: Number.isFinite(Number(audiControlStatus.departureSoc))')) {
  mapper.func = mapper.func.replace(
    '        phaseMode: Number(audiControlStatus.phaseMode) === 3 ? 3 : 1',
    `        phaseMode: Number(audiControlStatus.phaseMode) === 3 ? 3 : 1,
        controlMode: String(audiControlStatus.controlMode || 'uit'),
        departureSoc: Number.isFinite(Number(audiControlStatus.departureSoc)) ? Number(audiControlStatus.departureSoc) : 80,
        solarSoc: Number.isFinite(Number(audiControlStatus.solarSoc)) ? Number(audiControlStatus.solarSoc) : 100,
        departureTime: String(audiControlStatus.departureTime || '06:00').slice(0, 5),
        targetSoc: Number.isFinite(Number(audiControlStatus.targetSoc)) ? Number(audiControlStatus.targetSoc) : null,
        allInPrice: audiControlStatus.allInPrice !== null && Number.isFinite(Number(audiControlStatus.allInPrice)) ? Number(audiControlStatus.allInPrice) : null,
        departureEnergyNeeded: audiControlStatus.departureEnergyNeeded !== null && Number.isFinite(Number(audiControlStatus.departureEnergyNeeded)) ? Number(audiControlStatus.departureEnergyNeeded) : null,
        gridDepartureEnergyNeeded: audiControlStatus.gridDepartureEnergyNeeded !== null && Number.isFinite(Number(audiControlStatus.gridDepartureEnergyNeeded)) ? Number(audiControlStatus.gridDepartureEnergyNeeded) : null,
        solarEnergyReservedKwh: Number(audiControlStatus.solarEnergyReservedKwh) || 0,
        solarOnlyExpected: audiControlStatus.solarOnlyExpected === true,
        requiredSlots: Number(audiControlStatus.requiredDepartureSlots) || 0,
        scheduledSlots: Number(audiControlStatus.scheduledSlots) || 0,
        scheduleComplete: audiControlStatus.scheduleComplete === true,
        scheduledNow: audiControlStatus.scheduledNow === true,
        nextScheduledStart: audiControlStatus.nextScheduledStart || null,
        nextScheduledEnd: audiControlStatus.nextScheduledEnd || null,
        selectedSlots: Array.isArray(audiControlStatus.selectedSlots) ? audiControlStatus.selectedSlots : []`);
}
if (!mapper.func.includes('solarSoc: Number.isFinite(Number(audiControlStatus.solarSoc))')) {
  mapper.func = mapper.func.replace(
    '        departureSoc: Number.isFinite(Number(audiControlStatus.departureSoc)) ? Number(audiControlStatus.departureSoc) : 80,',
    '        departureSoc: Number.isFinite(Number(audiControlStatus.departureSoc)) ? Number(audiControlStatus.departureSoc) : 80,\n        solarSoc: Number.isFinite(Number(audiControlStatus.solarSoc)) ? Number(audiControlStatus.solarSoc) : 100,');
}
const audiPlanningClockMarker = 'plannedChargePowerKw: Number(audiControlStatus.plannedChargePowerKw) || 0';
if (!mapper.func.includes(audiPlanningClockMarker)) {
  mapper.func = mapper.func.replace(
    '        allInPrice: audiControlStatus.allInPrice !== null && Number.isFinite(Number(audiControlStatus.allInPrice)) ? Number(audiControlStatus.allInPrice) : null,',
    `        allInPrice: audiControlStatus.allInPrice !== null && Number.isFinite(Number(audiControlStatus.allInPrice)) ? Number(audiControlStatus.allInPrice) : null,
        plannedChargePowerKw: Number(audiControlStatus.plannedChargePowerKw) || 0,
        plannedGridEnergyKwh: Number(audiControlStatus.plannedGridEnergyKwh) || 0,
        plannedGridCost: Number(audiControlStatus.plannedGridCost) || 0,
        departureAt: audiControlStatus.departureAt || null,`);
}

const audiReliabilityDashboardMarker = 'chargingConfirmed: audiControlStatus.chargingConfirmed === true';
if (!mapper.func.includes(audiReliabilityDashboardMarker)) {
  mapper.func = mapper.func.replace(
    '        active: audiControlStatus.active === true,',
    `        active: audiControlStatus.active === true,
        requestedActive: audiControlStatus.requestedActive === true,
        actualCharging: audiControlStatus.actualCharging === true,
        chargingConfirmed: audiControlStatus.chargingConfirmed === true,`);
  mapper.func = mapper.func.replace(
    '        targetCurrent: Number(audiControlStatus.targetCurrent) || 0,',
    `        targetCurrent: Number(audiControlStatus.targetCurrent) || 0,
        requestedTargetCurrent: Number(audiControlStatus.requestedTargetCurrent) || 0,
        actualPowerW: Number(audiControlStatus.chargerPowerW) || 0,
        reportedSoc: audiControlStatus.reportedEVSoc === null || audiControlStatus.reportedEVSoc === undefined ? null : Number(audiControlStatus.reportedEVSoc),
        estimatedSoc: audiControlStatus.estimatedEVSoc === null || audiControlStatus.estimatedEVSoc === undefined ? null : Number(audiControlStatus.estimatedEVSoc),
        socSource: String(audiControlStatus.audiSocSource || 'onbekend'),
        preflightReady: audiControlStatus.preflightReady === true,
        preflightIssues: Array.isArray(audiControlStatus.preflightIssues) ? audiControlStatus.preflightIssues : [],
        recoveryStage: String(audiControlStatus.recoveryStage || 'idle'),
        recoveryAttempts: Number(audiControlStatus.recoveryAttempts) || 0,
        startAttempts: Number(audiControlStatus.startAttempts) || 0,
        fullRecoveries: Number(audiControlStatus.fullRecoveries) || 0,
        failedChargingMinutes: Number(audiControlStatus.failedChargingMinutes) || 0,`);
}

if (!mapper.func.includes("const officePower = value('sensor.flex_load_2_power')")) {
  mapper.func = mapper.func.replace(
    `const heatPumpPower = value('sensor.flex_load_4_power');
const aircoPower = sum([
    ['sensor.flex_load_5_power'],
    ['sensor.flex_load_6_power']
]);
const jacuzziPower = value('sensor.flex_load_7_power');`,
    `const officePower = value('sensor.flex_load_2_power');
const laundryPower = value('sensor.flex_load_3_power');
const heatPumpPower = value('sensor.flex_load_4_power');
const aircoOfficePower = value('sensor.flex_load_5_power');
const aircoAtticPower = value('sensor.flex_load_6_power');
const jacuzziPower = value('sensor.flex_load_7_power');`);
  mapper.func = mapper.func.replace(
    `    loads: [
        { name: 'Warmtepomp', power: heatPumpPower, status: loadStatus(heatPumpPower) },
        { name: 'Airco', power: aircoPower, status: loadStatus(aircoPower) },
        { name: 'Flexibele last 7', power: jacuzziPower, status: loadStatus(jacuzziPower) }
    ],`,
    `    loads: [
        { name: 'Zone 1', power: officePower, status: loadStatus(officePower) },
        { name: 'Flexibele last 3', power: laundryPower, status: loadStatus(laundryPower) },
        { name: 'Warmtepomp', power: heatPumpPower, status: loadStatus(heatPumpPower) },
        { name: 'Koelzone 1', power: aircoOfficePower, status: loadStatus(aircoOfficePower) },
        { name: 'Koelzone 4', power: aircoAtticPower, status: loadStatus(aircoAtticPower) },
        { name: 'Flexibele last 7', power: jacuzziPower, status: loadStatus(jacuzziPower) }
    ],`);
  mapper.func = mapper.func.replace(
    "'sensor.flex_load_4_power','sensor.flex_load_5_power','sensor.flex_load_6_power','sensor.flex_load_7_power'",
    "'sensor.flex_load_2_power','sensor.flex_load_3_power','sensor.flex_load_4_power','sensor.flex_load_5_power','sensor.flex_load_6_power','sensor.flex_load_7_power'");
}

if (!mapper.func.includes('function audiDashboardReading(')) {
  mapper.func = mapper.func.replace(
    "function loadStatus(power) {\n    if (power === null) return 'Niet beschikbaar';\n    return Math.abs(power) >= 25 ? 'Actief' : 'Stand-by';\n}",
    `function loadStatus(power) {
    if (power === null) return 'Niet beschikbaar';
    return Math.abs(power) >= 25 ? 'Actief' : 'Stand-by';
}

function audiDashboardReading(pattern) {
    const item = entity(pattern);
    return item ? { value:item.state, unit:String((item.attributes || {}).unit_of_measurement || '') } : null;
}

function audiLockLabel(reading) {
    if (!reading) return 'Niet beschikbaar';
    const value = String(reading.value).toLowerCase();
    if (['locked','lock','on','true','gesloten','vergrendeld'].includes(value)) return 'Op slot';
    if (['unlocked','unlock','off','false','open','ontgrendeld'].includes(value)) return 'Ontgrendeld';
    return String(reading.value);
}`);
  mapper.func = mapper.func.replace(
    "const audiSoc = value('sensor.ev_state_of_charge');",
    `const audiSoc = value('sensor.ev_state_of_charge');
const audiLockReading = audiDashboardReading('lock.ev');
const audiTemperatureReading = audiDashboardReading('sensor.ev_temperature');
const audiVehicleCommand = flow.get('ess_audi_vehicle_status') || {};
const audiVehicleCommandAge = Date.now() - new Date(audiVehicleCommand.updatedAt || 0).getTime();
const audiLockState = audiVehicleCommand.pending === true && audiVehicleCommandAge < 2 * 60 * 1000
    ? audiVehicleCommand.status
    : audiLockLabel(audiLockReading);
const audiTemperature = audiTemperatureReading
    ? String(audiTemperatureReading.value) + (audiTemperatureReading.unit ? ' ' + audiTemperatureReading.unit : '')
    : 'Niet beschikbaar';`);
  mapper.func = mapper.func.replace(
    "{ name: 'EV', power: audiPower, today: audiTodayEnergy, soc: audiSoc, status: chargeStatus('sensor.ev_charger_status') }",
    "{ name: 'EV', power: audiPower, today: audiTodayEnergy, soc: audiSoc, locked: audiLockState, temperature: audiTemperature, status: chargeStatus('sensor.ev_charger_status') }");
}

if (!mapper.func.includes("const gridImportToday = value('sensor.growatt_wit_grid_grid_import_energy_today')")
    && !mapper.func.includes('// Exacte netdagtotalen vanaf de HomeWizard P1-hoofdmeter.')) {
  mapper.func = mapper.func.replace(
    "const gridPower = value('sensor.p1_meter_vermogen');",
    `const gridPower = value('sensor.p1_meter_vermogen');
const gridImportToday = value('sensor.growatt_wit_grid_grid_import_energy_today');
const gridExportToday = value('sensor.growatt_wit_grid_energy_to_grid_today');`);
  mapper.func = mapper.func.replace(
    /const pvExtraToday = sum\(\[[\s\S]*?\n\]\);\nconst witToday = value\('sensor\.growatt_wit_solar_energy_today'\);/,
    `const pvSouthToday = value('sensor.pv_array_1_energy_today');
const pvEastToday = value('sensor.pv_array_2_energy_today');
const pvWestToday = value('sensor.pv_array_3_energy_today');
const pvExtraToday = [pvSouthToday, pvEastToday, pvWestToday].some((reading) => reading !== null)
    ? (pvSouthToday || 0) + (pvEastToday || 0) + (pvWestToday || 0)
    : null;
const witToday = value('sensor.growatt_wit_solar_energy_today');`);
  mapper.func = mapper.func.replace(
    "const actualSolarToday = pvExtraToday === null && witToday === null ? null : (pvExtraToday || 0) + (witToday || 0);",
    `const siteSolarToday = value('sensor.site_solar_energy_today');
const actualSolarToday = siteSolarToday !== null
    ? siteSolarToday
    : pvExtraToday === null && witToday === null ? null : (pvExtraToday || 0) + (witToday || 0);`);
  mapper.func = mapper.func.replace(
    '        power: gridPower,\n        l1:',
    '        power: gridPower,\n        importToday: gridImportToday,\n        exportToday: gridExportToday,\n        l1:');
}
const p1DailyMarker = '// Exacte netdagtotalen vanaf de HomeWizard P1-hoofdmeter.';
if (!mapper.func.includes(p1DailyMarker)) {
  mapper.func = mapper.func.replace(
    "const gridImportToday = value('sensor.growatt_wit_grid_grid_import_energy_today');\nconst gridExportToday = value('sensor.growatt_wit_grid_energy_to_grid_today');",
    `${p1DailyMarker}
const growattGridImportToday = value('sensor.growatt_wit_grid_grid_import_energy_today');
const growattGridExportToday = value('sensor.growatt_wit_grid_energy_to_grid_today');
const p1ImportTotal = value('sensor.p1_meter_energie_import');
const p1ExportTotal = value('sensor.p1_meter_energie_export');
const p1Now = new Date();
const p1DayKey = [p1Now.getFullYear(), String(p1Now.getMonth() + 1).padStart(2, '0'), String(p1Now.getDate()).padStart(2, '0')].join('-');
const p1DailyBaseline = flow.get('ess_p1_daily_baseline') || {};
const p1DailyReady = p1DailyBaseline.dayKey === p1DayKey
    && Number.isFinite(Number(p1DailyBaseline.importStart)) && Number.isFinite(Number(p1DailyBaseline.exportStart))
    && p1ImportTotal !== null && p1ExportTotal !== null;
const gridImportToday = p1DailyReady ? Math.max(0, Math.round((p1ImportTotal - Number(p1DailyBaseline.importStart)) * 1000) / 1000) : growattGridImportToday;
const gridExportToday = p1DailyReady ? Math.max(0, Math.round((p1ExportTotal - Number(p1DailyBaseline.exportStart)) * 1000) / 1000) : growattGridExportToday;
const gridDaySource = p1DailyReady ? 'P1 hoofdmeter' : 'Growatt terugval';`);
  mapper.func = mapper.func.replace(
    '        exportToday: gridExportToday,\n        l1:',
    '        exportToday: gridExportToday,\n        daySource: gridDaySource,\n        l1:');
  mapper.func = mapper.func.replace(
    "'sensor.p1_meter_vermogen','sensor.p1_meter_vermogen_fase_1'",
    "'sensor.p1_meter_vermogen','sensor.p1_meter_energie_import','sensor.p1_meter_energie_export','sensor.p1_meter_vermogen_fase_1'");
}
mapper.func = mapper.func.replace(
  "const gridImportToday = value('sensor.growatt_wit_grid_grid_import_energy_today');\nconst gridExportToday = value('sensor.growatt_wit_grid_energy_to_grid_today');\n" + p1DailyMarker,
  p1DailyMarker);

if (!mapper.func.includes('function climateDashboardLoad(')) {
  mapper.func = mapper.func.replace(
    "function loadStatus(power) {\n    if (power === null) return 'Niet beschikbaar';\n    return Math.abs(power) >= 25 ? 'Actief' : 'Stand-by';\n}",
    `function loadStatus(power) {
    if (power === null) return 'Niet beschikbaar';
    return Math.abs(power) >= 25 ? 'Actief' : 'Stand-by';
}

function loadActive(power) {
    return power !== null && Math.abs(power) >= 25;
}

function climateDashboardLoad(name, entityId, temperatureEntityId, controlKey) {
    const climate = entity(entityId);
    const state = climate ? String(climate.state).toLowerCase() : 'unavailable';
    const available = climate && !['unknown','unavailable',''].includes(state);
    const active = available && state !== 'off';
    const temperature = value(temperatureEntityId);
    const labels = { cool: 'Koelen', heat: 'Verwarmen', dry: 'Drogen', fan_only: 'Ventileren', auto: 'Automatisch' };
    return {
        name,
        power: null,
        temperature: temperature === null ? null : Math.round(temperature * 10) / 10 + ' °C',
        status: !available ? 'Niet beschikbaar' : active ? (labels[state] || 'Actief') : 'Uit',
        active,
        controlKey,
        controlType: 'climate'
    };
}`);
  mapper.func = mapper.func.replace(
    "const jacuzziPower = value('sensor.flex_load_7_power');",
    `const jacuzziPower = value('sensor.flex_load_7_power');
const compressorPower = value('sensor.flex_load_1_power');
const compressorSwitch = entity('switch.flex_load_1');
const compressorAvailable = compressorSwitch && !['unknown','unavailable',''].includes(String(compressorSwitch.state).toLowerCase());
const compressorActive = compressorAvailable && String(compressorSwitch.state).toLowerCase() === 'on';`);
  mapper.func = mapper.func.replace(
    `    loads: [
        { name: 'Zone 1', power: officePower, status: loadStatus(officePower) },
        { name: 'Flexibele last 3', power: laundryPower, status: loadStatus(laundryPower) },
        { name: 'Warmtepomp', power: heatPumpPower, status: loadStatus(heatPumpPower) },
        { name: 'Koelzone 1', power: aircoOfficePower, status: loadStatus(aircoOfficePower) },
        { name: 'Koelzone 4', power: aircoAtticPower, status: loadStatus(aircoAtticPower) },
        { name: 'Flexibele last 7', power: jacuzziPower, status: loadStatus(jacuzziPower) }
    ],`,
    `    loads: [
        { name: 'Zone 1', power: officePower, status: loadStatus(officePower), active: loadActive(officePower) },
        { name: 'Flexibele last 3', power: laundryPower, status: loadStatus(laundryPower), active: loadActive(laundryPower) },
        { name: 'Warmtepomp', power: heatPumpPower, status: loadStatus(heatPumpPower), active: loadActive(heatPumpPower) },
        { name: 'Koelzone 1', power: aircoOfficePower, status: loadStatus(aircoOfficePower), active: loadActive(aircoOfficePower) },
        { name: 'Koelzone 4', power: aircoAtticPower, status: loadStatus(aircoAtticPower), active: loadActive(aircoAtticPower) },
        { name: 'Flexibele last 1', power: compressorPower, status: !compressorAvailable ? 'Niet beschikbaar' : compressorActive ? 'Actief' : 'Uit', active: compressorActive, controlKey: 'compressor', controlType: 'switch' },
        { name: 'Flexibele last 7', power: jacuzziPower, status: loadStatus(jacuzziPower), active: loadActive(jacuzziPower) }
    ],`);
  mapper.func = mapper.func.replace(
    "'sensor.flex_load_2_power','sensor.flex_load_3_power','sensor.flex_load_4_power','sensor.flex_load_5_power','sensor.flex_load_6_power','sensor.flex_load_7_power'",
    "'sensor.flex_load_1_power','sensor.flex_load_2_power','sensor.flex_load_3_power','sensor.flex_load_4_power','sensor.flex_load_5_power','sensor.flex_load_6_power','sensor.cooling_zone_2_temperature','sensor.cooling_zone_3_temperature','sensor.flex_load_7_power'");
}
mapper.func = mapper.func
  .replace("        climateDashboardLoad('Koelzone 2', 'climate.cooling_zone_2', 'sensor.cooling_zone_2_temperature', 'cooling-zone-2'),\n", '')
  .replace("        climateDashboardLoad('Koelzone 3', 'climate.cooling_zone_3', 'sensor.cooling_zone_3_temperature', 'cooling-zone-3'),\n", '');

const climateMappingMarker = '// Bevestigde klimaatentiteiten per ruimte en voor de EHS.';
if (!mapper.func.includes(climateMappingMarker)) {
  mapper.func = mapper.func.replace(
    'function audiDashboardReading(pattern) {',
    `${climateMappingMarker}
function firstValue(entityIds) {
    for (const entityId of entityIds || []) {
        const reading = value(entityId);
        if (reading !== null) return reading;
    }
    return null;
}

function numericAttribute(item, name) {
    const reading = item && item.attributes ? Number(item.attributes[name]) : NaN;
    return Number.isFinite(reading) ? reading : null;
}

function climateZone(key, name, entityId, fallbackTemperatureIds, humidityEntityId, defaults) {
    const item = entity(entityId);
    const mode = item ? String(item.state).toLowerCase() : 'unavailable';
    const available = Boolean(item) && !['unknown','unavailable',''].includes(mode);
    const labels = { off:'Uit', auto:'Automatisch', cool:'Koelen', heat:'Verwarmen', dry:'Drogen', fan_only:'Ventileren', eco:'Eco', heat_pump:'Warmtepomp', high_demand:'Snel verwarmen' };
    const currentAttribute = numericAttribute(item, 'current_temperature');
    const current = currentAttribute === null ? firstValue(fallbackTemperatureIds) : currentAttribute;
    const target = numericAttribute(item, 'temperature');
    const humidityAttribute = numericAttribute(item, 'current_humidity');
    const humidity = humidityAttribute === null && humidityEntityId ? value(humidityEntityId) : humidityAttribute;
    return {
        key, name, entityId, available, active: available && mode !== 'off',
        current, target, humidity, mode,
        modeLabel: available ? (labels[mode] || mode) : 'Niet beschikbaar',
        status: available ? (labels[mode] || mode) : 'Niet beschikbaar',
        min: numericAttribute(item, 'min_temp') ?? defaults.min,
        max: numericAttribute(item, 'max_temp') ?? defaults.max,
        step: defaults.step
    };
}

function normalizedClimateName(value) {
    return String(value || '').trim().toLowerCase();
}

function climateEntityByName(friendlyName) {
    const wanted = normalizedClimateName(friendlyName);
    let unavailableMatch = null;
    for (const [entityId, item] of Object.entries(states)) {
        if (!entityId.startsWith('climate.') || normalizedClimateName(item && item.attributes && item.attributes.friendly_name) !== wanted) continue;
        if (!['unknown','unavailable',''].includes(normalizedClimateName(item.state))) return entityId;
        unavailableMatch = unavailableMatch || entityId;
    }
    return unavailableMatch;
}

function namedClimateZone(key, name, friendlyName, defaults) {
    const entityId = climateEntityByName(friendlyName);
    const humidityEntityId = entityId && entityId.startsWith('climate.')
        ? 'sensor.' + entityId.slice('climate.'.length) + '_current_humidity'
        : null;
    return climateZone(key, name, entityId, [], humidityEntityId, defaults);
}

function outsideClimate() {
    const ehsOutside = value('sensor.outdoor_temperature');
    const weather = entity('weather.home');
    const weatherTemperature = numericAttribute(weather, 'temperature');
    return {
        temperature: ehsOutside === null ? weatherTemperature : ehsOutside,
        humidity: numericAttribute(weather, 'humidity'),
        source: ehsOutside === null ? 'Weerstation' : 'EHS buitenvoeler'
    };
}

function climateDashboardModel() {
    return {
        outside: outsideClimate(),
        aircos: [
            climateZone('cooling-zone-1','Zone 1','climate.cooling_zone_1',['sensor.cooling_zone_1_temperature'],null,{min:16,max:30,step:1}),
            climateZone('cooling-zone-2','Zone 2','climate.cooling_zone_2',['sensor.cooling_zone_2_temperature'],null,{min:7,max:35,step:1}),
            climateZone('cooling-zone-3','Zone 3','climate.cooling_zone_3',['sensor.cooling_zone_3_temperature'],null,{min:7,max:35,step:1}),
            climateZone('cooling-zone-4','Zone 4','climate.cooling_zone_4',['sensor.cooling_zone_4_temperature'],null,{min:7,max:35,step:1})
        ],
        tado: [
            climateZone('heating-zone-1','Verwarmingszone 1','climate.heating_zone_1',[],null,{min:5,max:25,step:.5}),
            climateZone('heating-zone-2','Verwarmingszone 2','climate.heating_zone_2',[],null,{min:5,max:25,step:.5}),
            climateZone('heating-zone-3','Verwarmingszone 3','climate.heating_zone_3',[],null,{min:5,max:25,step:.5})
        ],
        heatPump: climateZone('heat-pump','Verwarming','climate.heat_pump',[],null,{min:30,max:45,step:1}),
        hotWater: climateZone('hot-water','Tapwater','water_heater.domestic_hot_water',[],null,{min:40,max:60,step:1})
    };
}

function audiDashboardReading(pattern) {`);
  mapper.func = mapper.func.replace(
    '    audiClimate: audiClimateStatus,',
    '    climate: climateDashboardModel(),\n    audiClimate: audiClimateStatus,');
}

const lightingMappingMarker = '// Uitsluitend vaste Hue-kamerzones; geen losse lampen of apparaten.';
if (!mapper.func.includes(lightingMappingMarker)) {
  mapper.func = mapper.func.replace(
    'function audiDashboardReading(pattern) {',
    `${lightingMappingMarker}
function lightRoom(key, name, entityId) {
    const item = entity(entityId);
    const state = item ? String(item.state).toLowerCase() : 'unavailable';
    const available = Boolean(item) && !['unknown','unavailable',''].includes(state);
    const active = available && state === 'on';
    const rawBrightness = numericAttribute(item, 'brightness');
    const brightness = rawBrightness === null ? 0 : Math.max(0, Math.min(100, Math.round(rawBrightness / 255 * 100)));
    return { key, name, entityId, available, active, brightness, status: available ? (active ? 'Aan' : 'Uit') : 'Niet beschikbaar' };
}

function lightingDashboardModel() {
    const rooms = ${JSON.stringify(lightRooms)}.map((room) => lightRoom(room.key, room.name, room.entityId));
    return { rooms, onCount: rooms.filter((room) => room.active).length, totalCount: rooms.length };
}

function audiDashboardReading(pattern) {`);
  mapper.func = mapper.func.replace(
    '    climate: climateDashboardModel(),',
    '    lighting: lightingDashboardModel(),\n    climate: climateDashboardModel(),');
}

const nasMappingMarker = '// Bevestigde Synology DSM-entiteiten van NAS.';
if (!mapper.func.includes(nasMappingMarker)) {
  mapper.func = mapper.func.replace(
    'function audiDashboardReading(pattern) {',
    `${nasMappingMarker}
function nasText(entityId) {
    const item = entity(entityId);
    if (!item || ['unknown','unavailable',''].includes(String(item.state).toLowerCase())) return null;
    return String(item.state);
}

function nasDashboardModel() {
    const cpu = value('sensor.nas_cpu_gebruik_totaal');
    const memory = value('sensor.nas_geheugengebruik_fysiek');
    const temperature = value('sensor.nas_temperatuur');
    const download = value('sensor.nas_download_doorvoer');
    const upload = value('sensor.nas_upload_doorvoer');
    const volumeUsed = value('sensor.nas_volume_1_gebruikte_ruimte');
    const volumeUsedPercent = value('sensor.nas_volume_1_volume_gebruikt');
    const volumeStatus = nasText('sensor.nas_volume_1_status');
    const driveStatus = nasText('sensor.nas_drive_2_status');
    const driveTemperature = value('sensor.nas_drive_2_temperatuur');
    const badSectors = nasText('binary_sensor.nas_drive_2_maximum_slechte_sectoren_overschreden') === 'on';
    const lowLife = nasText('binary_sensor.nas_drive_2_onder_de_minimale_resterende_levensduur') === 'on';
    const securityState = nasText('binary_sensor.nas_beveiligingsstatus');
    const updateEntity = entity('update.nas_dsm_update');
    const updateState = updateEntity ? String(updateEntity.state).toLowerCase() : 'unavailable';
    const fanMode = nasText('select.nas_fan_speed_mode');
    const available = [cpu,memory,temperature,volumeUsedPercent].some((reading) => reading !== null);
    const securitySafe = securityState === null ? null : securityState === 'off';
    const updateAvailable = updateState === 'on';
    const normal = (state) => state === null || ['normal','healthy','available'].includes(String(state).toLowerCase());
    const labels = { normal:'Normaal', healthy:'Gezond', available:'Beschikbaar', quiet:'Stil', cool:'Koel', full_speed:'Vol vermogen', low_power:'Energiezuinig' };
    const issues = [];
    if (securitySafe === false) issues.push({ level:'error', text:'Synology NAS meldt een beveiligingsprobleem.' });
    if (badSectors) issues.push({ level:'error', text:'Synology Drive 2 heeft te veel slechte sectoren.' });
    if (lowLife) issues.push({ level:'error', text:'Synology Drive 2 zit onder de minimale resterende levensduur.' });
    if (!normal(driveStatus)) issues.push({ level:'error', text:'Synology Drive 2 status: '+driveStatus+'.' });
    if (!normal(volumeStatus)) issues.push({ level:'error', text:'Synology Volume 1 status: '+volumeStatus+'.' });
    if (volumeUsedPercent !== null && volumeUsedPercent >= 90) issues.push({ level:'error', text:'Synology Volume 1 is voor '+Math.round(volumeUsedPercent)+'% gevuld.' });
    else if (volumeUsedPercent !== null && volumeUsedPercent >= 80) issues.push({ level:'warning', text:'Synology Volume 1 raakt vol ('+Math.round(volumeUsedPercent)+'%).' });
    if (temperature !== null && temperature >= 55) issues.push({ level:'warning', text:'Synology NAS is warm ('+Math.round(temperature)+' °C).' });
    if (driveTemperature !== null && driveTemperature >= 50) issues.push({ level:'warning', text:'Synology Drive 2 is warm ('+Math.round(driveTemperature)+' °C).' });
    if (updateAvailable) issues.push({ level:'warning', text:'Er is een DSM-update beschikbaar voor Synology NAS.' });
    return {
        name:'NAS', model:'DS223j', available, ok:available && issues.length === 0,
        summary:!available ? 'Niet beschikbaar' : issues.length ? issues.length+' aandachtspunt(en)' : 'Alles in orde',
        cpu, memory, temperature, download, upload,
        fanMode, fanModeLabel:labels[fanMode] || fanMode,
        securitySafe, securityLabel:securitySafe === null ? 'Onbekend' : securitySafe ? 'Veilig' : 'Controle nodig',
        updateAvailable, updateLabel:updateState === 'unavailable' ? 'DSM-status onbekend' : updateAvailable ? 'DSM-update beschikbaar' : 'DSM up-to-date',
        installedVersion:updateEntity && updateEntity.attributes ? updateEntity.attributes.installed_version || null : null,
        drive:{ status:driveStatus, statusLabel:labels[driveStatus] || driveStatus || 'Onbekend', temperature:driveTemperature, badSectors, lowLife, ok:normal(driveStatus) && !badSectors && !lowLife, healthLabel:badSectors ? 'Slechte sectoren' : lowLife ? 'Levensduur laag' : 'Gezond' },
        volume:{ status:volumeStatus, statusLabel:labels[volumeStatus] || volumeStatus || 'Onbekend', used:volumeUsed, usedPercent:volumeUsedPercent },
        issues
    };
}

function audiDashboardReading(pattern) {`);
  mapper.func = mapper.func.replace(
    'const alarms = [];',
    `const nasStatus = nasDashboardModel();
const alarms = [];
for (const issue of nasStatus.issues || []) alarms.push(issue);`);
  mapper.func = mapper.func.replace(
    '    lighting: lightingDashboardModel(),',
    '    nas: nasStatus,\n    lighting: lightingDashboardModel(),');
}
if (!mapper.func.includes("'sensor.nas_cpu_gebruik_totaal','sensor.nas_geheugengebruik_fysiek'")) {
  mapper.func = mapper.func.replace(
    "'sensor.flex_load_1_power','sensor.flex_load_2_power','sensor.flex_load_3_power','sensor.flex_load_4_power','sensor.flex_load_5_power','sensor.flex_load_6_power','sensor.cooling_zone_2_temperature','sensor.cooling_zone_3_temperature','sensor.flex_load_7_power'",
    "'sensor.flex_load_1_power','sensor.flex_load_2_power','sensor.flex_load_3_power','sensor.flex_load_4_power','sensor.flex_load_5_power','sensor.flex_load_6_power','sensor.cooling_zone_2_temperature','sensor.cooling_zone_3_temperature','sensor.flex_load_7_power',\n    'sensor.nas_cpu_gebruik_totaal','sensor.nas_geheugengebruik_fysiek','sensor.nas_temperatuur','sensor.nas_download_doorvoer','sensor.nas_upload_doorvoer',\n    'sensor.nas_drive_2_status','sensor.nas_drive_2_temperatuur','sensor.nas_volume_1_status','sensor.nas_volume_1_gebruikte_ruimte','sensor.nas_volume_1_volume_gebruikt'");
}
if (!mapper.func.includes('function namedClimateZone(')) {
  mapper.func = mapper.func.replace('function outsideClimate() {', `function normalizedClimateName(value) {
    return String(value || '').trim().toLowerCase();
}

function climateEntityByName(friendlyName) {
    const wanted = normalizedClimateName(friendlyName);
    let unavailableMatch = null;
    for (const [entityId, item] of Object.entries(states)) {
        if (!entityId.startsWith('climate.') || normalizedClimateName(item && item.attributes && item.attributes.friendly_name) !== wanted) continue;
        if (!['unknown','unavailable',''].includes(normalizedClimateName(item.state))) return entityId;
        unavailableMatch = unavailableMatch || entityId;
    }
    return unavailableMatch;
}

function namedClimateZone(key, name, friendlyName, defaults) {
    const entityId = climateEntityByName(friendlyName);
    const humidityEntityId = entityId && entityId.startsWith('climate.')
        ? 'sensor.' + entityId.slice('climate.'.length) + '_current_humidity'
        : null;
    return climateZone(key, name, entityId, [], humidityEntityId, defaults);
}

function outsideClimate() {`);
}
mapper.func = mapper.func
  .replace("    const humidity = humidityEntityId ? value(humidityEntityId) : null;", "    const humidityAttribute = numericAttribute(item, 'current_humidity');\n    const humidity = humidityAttribute === null && humidityEntityId ? value(humidityEntityId) : humidityAttribute;")
  .replace("            namedClimateZone('tado-beneden','Benedenverdieping','benedenverdieping',{min:5,max:25,step:.5}),", "            climateZone('heating-zone-1','Verwarmingszone 1','climate.heating_zone_1',[],null,{min:5,max:25,step:.5}),")
  .replace("            namedClimateZone('heating-zone-2','Verwarmingszone 2','badkamer',{min:5,max:25,step:.5}),", "            climateZone('heating-zone-2','Verwarmingszone 2','climate.heating_zone_2',[],null,{min:5,max:25,step:.5}),")
  .replace("            namedClimateZone('heating-zone-3','Verwarmingszone 3','bijkeuken',{min:5,max:25,step:.5})", "            climateZone('heating-zone-3','Verwarmingszone 3','climate.heating_zone_3',[],null,{min:5,max:25,step:.5})")
  .replace("            climateZone('tado-beneden','Benedenverdieping','climate.heating_zone_1',['sensor.woonkamer_temperatuur'],'sensor.woonkamer_luchtvochtigheid',{min:5,max:25,step:.5}),", "            climateZone('heating-zone-1','Verwarmingszone 1','climate.heating_zone_1',[],null,{min:5,max:25,step:.5}),")
  .replace("            climateZone('heating-zone-2','Verwarmingszone 2','climate.heating_zone_2',['sensor.badkamer_temperatuur'],'sensor.badkamer_luchtvochtigheid',{min:5,max:25,step:.5}),", "            climateZone('heating-zone-2','Verwarmingszone 2','climate.heating_zone_2',[],null,{min:5,max:25,step:.5}),")
  .replace("            climateZone('heating-zone-3','Verwarmingszone 3','climate.heating_zone_3',['sensor.bijkeuken_temperatuur','sensor.bijkeuken_temperatuur_2'],'sensor.bijkeuken_luchtvochtigheid',{min:5,max:25,step:.5})", "            climateZone('heating-zone-3','Verwarmingszone 3','climate.heating_zone_3',[],null,{min:5,max:25,step:.5})");

const regulator = node('ess00000000000d');
// Na een Home Assistant/Node-RED-herstart moet de EV-regelaar vanzelf weer
// vrijgegeven zijn. De regelcyclus zelf blijft veilig stoppen zolang HA-, P1-
// of Easee-data ontbreekt.
regulator.initialize = "flow.set('ess_audi_smart_enabled', true); flow.set('ess_audi_restart_grace_until', Date.now() + 120000);";

// Herstel de gewenste standaardplanning bij een Node-RED-deploy en iedere keer
// dat de Home Assistant-client na een herstart weer volledig draait. De
// vertrektijd wordt tegelijk naar de HA-helper geschreven, zodat dashboard,
// regelaar en helper dezelfde waarde tonen.
flows.push({
  id: ids.audiDefaultsInject, type: 'inject', z: FLOW_ID, name: 'Standaard laadplanning bij opstart',
  props: [{ p:'topic', vt:'str' }], repeat: '', crontab: '', once: true, onceDelay: '3',
  topic: 'ess/audi/apply-defaults', x: 170, y: 420, wires: [[ids.audiDefaults]]
});
flows.push({
  id: ids.audiHaEvents, type: 'server-events', z: FLOW_ID, name: 'Home Assistant weer actief',
  server: 'ess00000000000b', version: 3, exposeAsEntityConfig: '', eventType: 'home_assistant_client', eventData: '',
  waitForRunning: false,
  outputProperties: [{ property:'payload', propertyType:'msg', value:'', valueType:'eventData' }],
  x: 170, y: 455, wires: [[ids.audiDefaults]]
});
flows.push({
  id: ids.audiDefaults, type: 'function', z: FLOW_ID, name: 'Herstel standaard laadplanning',
  func: `const startupRequest = msg.topic === 'ess/audi/apply-defaults';
const homeAssistantRunning = String(msg.payload || '').toLowerCase() === 'running';
if (!startupRequest && !homeAssistantRunning) return null;

const settings = {
    ...(flow.get('ess_audi_settings') || {}),
    departureSoc: 80,
    solarSoc: 80,
    departureTime: '06:00'
};
delete settings.minimumSoc;
delete settings.desiredSoc;
delete settings.cheapPriceLimit;
delete settings.daySoc;
flow.set('ess_audi_settings', settings);
flow.set('ess_audi_smart_enabled', true);
flow.set('ess_audi_force_full', false);
flow.set('ess_audi_restart_grace_until', Date.now() + 120000);
node.status({ fill:'green', shape:'dot', text:'80% · zon 80% · vertrek 06:00' });
return [
    { topic:'ess/audi/defaults-applied', payload:{ settings } },
    { payload:{ time:'06:00:00' } }
];`,
  outputs: 2, timeout: 0, noerr: 0, initialize: '', finalize: '', libs: [], x: 360, y: 625,
  wires: [['ess00000000000d'], ['ess000000000012']]
});
const forceFullMarker = '// Tijdelijke handmatige 100%-modus vanaf het overzicht.';
if (!regulator.func.includes(forceFullMarker)) {
  regulator.func = regulator.func.replace(
    "const enabled = flow.get('ess_audi_smart_enabled') === true;",
    "const enabled = flow.get('ess_audi_smart_enabled') === true;\nlet forceFull = flow.get('ess_audi_force_full') === true;\n" + forceFullMarker);
  regulator.func = regulator.func.replace(
    'const targetSoc = Math.min(ultraCheapQuarter ? 100 : departureSoc, vehicleTargetSoc);',
    'const targetSoc = forceFull ? 100 : Math.min(ultraCheapQuarter ? 100 : departureSoc, vehicleTargetSoc);');
  regulator.func = regulator.func.replace(
    'const fastChargeMode = deadlineCharge || ultraCheapQuarter || scheduledNow;',
    'const fastChargeMode = forceFull || deadlineCharge || ultraCheapQuarter || scheduledNow;');
  regulator.func = regulator.func.replace(
    'if (!enabled) {',
    "if (forceFull && audiSoc !== null && audiSoc >= 99.5) {\n    forceFull = false;\n    flow.set('ess_audi_force_full', false);\n}\n\nif (!enabled) {");
  regulator.func = regulator.func.replace(
    '} else if (audiSoc >= vehicleTargetSoc) {',
    '} else if (audiSoc >= vehicleTargetSoc && !forceFull) {');
  regulator.func = regulator.func.replace(
    '    if (deadlineCharge) {',
    "    if (forceFull) {\n        targetCurrent = maximumCurrent;\n        controlMode = 'force-full';\n        reason = vehicleTargetSoc < 100\n            ? 'Direct laden actief · EV zelf begrenst op ' + vehicleTargetSoc + '%'\n            : 'Direct laden actief tot 100%';\n    } else if (deadlineCharge) {");
  regulator.func = regulator.func.replace(
    '    controlMode,\n    solarReadySince,',
    '    controlMode,\n    forceFull,\n    vehicleTargetSoc,\n    solarReadySince,');
}
const solarSocDeclaration = 'const solarSoc = Math.min(clamp(Number(settings.solarSoc) || 100, 20, 100), vehicleTargetSoc);';
const automaticTargetSocDeclaration = 'const targetSoc = forceFull || ultraCheapQuarter ? 100 : Math.min(deadlineCharge || scheduledNow ? departureSoc : solarSoc, vehicleTargetSoc);';
regulator.func = regulator.func.replace(solarSocDeclaration + '\n' + solarSocDeclaration, solarSocDeclaration);
regulator.func = regulator.func.replace(automaticTargetSocDeclaration + '\n' + automaticTargetSocDeclaration, automaticTargetSocDeclaration);
if (!regulator.func.includes(solarSocDeclaration)) regulator.func = regulator.func
  .replace(
    'const settings = { ...storedSettings, departureSoc: Number.isFinite(Number(storedSettings.departureSoc)) ? Number(storedSettings.departureSoc) : legacyTarget };',
    'const settings = { ...storedSettings, departureSoc: Number.isFinite(Number(storedSettings.departureSoc)) ? Number(storedSettings.departureSoc) : legacyTarget, solarSoc: Number.isFinite(Number(storedSettings.solarSoc)) ? Number(storedSettings.solarSoc) : 100 };')
  .replace(
    'const departureSoc = Math.min(clamp(Number(settings.departureSoc) || 80, 20, 100), vehicleTargetSoc);',
    'const departureSoc = Math.min(clamp(Number(settings.departureSoc) || 80, 20, 100), vehicleTargetSoc);\nconst solarSoc = Math.min(clamp(Number(settings.solarSoc) || 100, 20, 100), vehicleTargetSoc);')
  .replace('const ultraCheapQuarter = priceIsFresh && allInPrice < 0.07;', 'const ultraCheapQuarter = priceIsFresh && allInPrice < 0;')
  .replace(/const targetSoc = forceFull \? 100 : Math\.min\(ultraCheapQuarter \? 100 : departureSoc, vehicleTargetSoc\);\n/, '')
  .replace(
    'const deadlineCharge = departureEnergyNeeded !== null && departureEnergyNeeded > 0 && remainingHours !== null && remainingHours <= hoursNeeded + 0.75 && (!departurePlan.complete || solarDeadlineRisk);',
    'const deadlineCharge = departureEnergyNeeded !== null && departureEnergyNeeded > 0 && remainingHours !== null && remainingHours <= hoursNeeded + 0.75 && (!departurePlan.complete || solarDeadlineRisk);\nconst targetSoc = forceFull || ultraCheapQuarter ? 100 : Math.min(deadlineCharge || scheduledNow ? departureSoc : solarSoc, vehicleTargetSoc);')
  .replace(
    "        reason = 'Spotgoedkoop Zonneplan-kwartier onder €0,07: laden tot 100%';",
    "        reason = 'Negatieve netto all-in prijs: laden tot 100%';")
  .replace(
    "    } else if (scheduledNow && audiSoc < departureSoc) {\n        targetCurrent = maximumCurrent;\n        controlMode = 'departure-plan';\n        reason = 'Vertrekplanning: goedkoop kwartier tot ' + departureSoc + '%';\n    } else {",
    "    } else if (scheduledNow && audiSoc < departureSoc) {\n        targetCurrent = maximumCurrent;\n        controlMode = 'departure-plan';\n        reason = 'Vertrekplanning: goedkoop kwartier tot ' + departureSoc + '%';\n    } else if (audiSoc >= solarSoc) {\n        reason = 'Zonne-SOC van ' + solarSoc + '% bereikt';\n    } else {")
  .replace('    departureSoc,\n    departureTime,', '    departureSoc,\n    solarSoc,\n    departureTime,');
regulator.func = regulator.func
  .replace('const ultraCheapQuarter = priceIsFresh && allInPrice < 0.07;', 'const ultraCheapQuarter = priceIsFresh && allInPrice < 0;')
  .replace(
    "        reason = 'Spotgoedkoop Zonneplan-kwartier onder €0,07: laden tot 100%';",
    "        reason = 'Negatieve netto all-in prijs: laden tot 100%';");
const plannedChargeClockMarker = 'const plannedGridEnergyKwh = selectedSlots.reduce';
if (!regulator.func.includes(plannedChargeClockMarker)) {
  regulator.func = regulator.func
    .replace(
      'const selectedSlots = departurePlan.selected;',
      `const selectedSlots = departurePlan.selected;
const plannedGridEnergyKwh = selectedSlots.reduce((sum, slot) => sum + (Number(slot.energy) || 0), 0);
const plannedGridCost = selectedSlots.reduce((sum, slot) => sum + (Number(slot.energy) || 0) * (Number(slot.allInPrice) || 0), 0);`)
    .replace(
      '    scheduleComplete,\n    scheduledNow,',
      `    scheduleComplete,
    plannedChargePowerKw: netChargePowerKw,
    plannedGridEnergyKwh,
    plannedGridCost,
    departureAt: departure ? departure.toISOString() : null,
    scheduledNow,`)
    .replace(
      'selectedSlots: selectedSlots.map((slot) => ({ start: new Date(slot.start).toISOString(), end: new Date(slot.end).toISOString(), allInPrice: slot.allInPrice }))',
      'selectedSlots: selectedSlots.map((slot) => ({ start: new Date(slot.start).toISOString(), end: new Date(slot.end).toISOString(), allInPrice: slot.allInPrice, energyKwh: Number(slot.energy) || 0, powerKw: netChargePowerKw }))');
}

// De EV hervat na veel korte onderbrekingen of fasewissels niet altijd
// vanzelf. Plan daarom een enkel aaneengesloten laadblok van minimaal dertig
// minuten en houd een al gestart blok vast terwijl het doel nog niet is bereikt.
const contiguousEVBlockMarker = 'const minimumBlockDurationMs = 30 * 60 * 1000;';
if (!regulator.func.includes(contiguousEVBlockMarker)) {
  const legacyEVPlanner = `function planCheapestSlots(forecast, windowEnd, energyNeeded, excludedStarts = new Set()) {
    const windowEndMs = windowEnd instanceof Date ? windowEnd.getTime() : Number(windowEnd);
    if (!Number.isFinite(windowEndMs) || energyNeeded === null || energyNeeded <= 0) {
        return { selected: [], selectedEnergy: 0, complete: energyNeeded !== null };
    }
    const candidates = (Array.isArray(forecast) ? forecast : []).map((slot) => {
        const start = new Date(slot.start).getTime();
        const end = new Date(slot.end).getTime();
        const allInPrice = Number(slot.allInPrice);
        const usableStart = Math.max(start, now);
        const usableEnd = Math.min(end, windowEndMs);
        const durationHours = (usableEnd - usableStart) / 3600000;
        return { start, end, allInPrice, marketPrice: Number(slot.marketPrice), energy: netChargePowerKw * durationHours };
    }).filter((slot) => Number.isFinite(slot.start) && Number.isFinite(slot.end) && Number.isFinite(slot.allInPrice) && slot.energy > 0.01 && !excludedStarts.has(slot.start));

    candidates.sort((a, b) => a.allInPrice - b.allInPrice || a.start - b.start);
    const selected = [];
    let selectedEnergy = 0;
    for (const slot of candidates) {
        if (selectedEnergy + 0.01 >= energyNeeded) break;
        selected.push(slot);
        selectedEnergy += slot.energy;
    }
    selected.sort((a, b) => a.start - b.start);
    return { selected, selectedEnergy, complete: selectedEnergy + 0.05 >= energyNeeded };
}`;
  const contiguousEVPlanner = `function planCheapestSlots(forecast, windowEnd, energyNeeded, excludedStarts = new Set(), keepCurrentBlock = false) {
    const windowEndMs = windowEnd instanceof Date ? windowEnd.getTime() : Number(windowEnd);
    if (!Number.isFinite(windowEndMs) || energyNeeded === null || energyNeeded <= 0) {
        return { selected: [], selectedEnergy: 0, complete: energyNeeded !== null };
    }
    const minimumBlockDurationMs = 30 * 60 * 1000;
    const candidates = (Array.isArray(forecast) ? forecast : []).map((slot) => {
        const start = new Date(slot.start).getTime();
        const end = new Date(slot.end).getTime();
        const allInPrice = Number(slot.allInPrice);
        const usableStart = Math.max(start, now);
        const usableEnd = Math.min(end, windowEndMs);
        const durationHours = (usableEnd - usableStart) / 3600000;
        return { start, end, usableStart, usableEnd, allInPrice, marketPrice: Number(slot.marketPrice), energy: netChargePowerKw * durationHours };
    }).filter((slot) => Number.isFinite(slot.start) && Number.isFinite(slot.end) && Number.isFinite(slot.allInPrice) && slot.energy > 0.01 && !excludedStarts.has(slot.start));

    candidates.sort((a, b) => a.start - b.start);
    let best = null;
    for (let startIndex = 0; startIndex < candidates.length; startIndex += 1) {
        const selected = [];
        let selectedEnergy = 0;
        let selectedCost = 0;
        let durationMs = 0;
        let previousEnd = null;
        for (let index = startIndex; index < candidates.length; index += 1) {
            const slot = candidates[index];
            if (previousEnd !== null && Math.abs(slot.start - previousEnd) > 1000) break;
            selected.push(slot);
            selectedEnergy += slot.energy;
            selectedCost += slot.energy * slot.allInPrice;
            durationMs += Math.max(0, slot.usableEnd - slot.usableStart);
            previousEnd = slot.end;
            if (durationMs + 1000 < minimumBlockDurationMs) continue;

            const complete = selectedEnergy + 0.05 >= energyNeeded;
            const continuesNow = keepCurrentBlock && selected.some((entry) => now >= entry.start && now < entry.end);
            const averagePrice = selectedEnergy > 0 ? selectedCost / selectedEnergy : Infinity;
            const option = { selected:[...selected], selectedEnergy, complete, continuesNow, averagePrice };
            const better = !best
                || option.continuesNow !== best.continuesNow && option.continuesNow
                || option.continuesNow === best.continuesNow && option.complete !== best.complete && option.complete
                || option.continuesNow === best.continuesNow && option.complete === best.complete && option.complete && option.averagePrice < best.averagePrice - 0.0000001
                || option.continuesNow === best.continuesNow && !option.complete && !best.complete && option.selectedEnergy > best.selectedEnergy + 0.05
                || option.continuesNow === best.continuesNow && option.complete === best.complete && Math.abs(option.selectedEnergy - best.selectedEnergy) <= 0.05 && Math.abs(option.averagePrice - best.averagePrice) <= 0.0000001 && option.selected[0].start < best.selected[0].start;
            if (better) best = option;
            if (complete) break;
        }
    }
    return best || { selected: [], selectedEnergy: 0, complete: false };
}`;
  if (!regulator.func.includes(legacyEVPlanner)) throw new Error('Oude EV-kwartierplanner niet gevonden.');
  regulator.func = regulator.func
    .replace(legacyEVPlanner, contiguousEVPlanner)
    .replace(
      'const departurePlan = planCheapestSlots(forecast, departure, gridDepartureEnergyNeeded);',
      "const departurePlan = planCheapestSlots(forecast, departure, gridDepartureEnergyNeeded, new Set(), previous.controlMode === 'departure-plan' && Number(previous.targetCurrent) >= 6);");
}

// Laat de Easee-fase staan zolang er niet daadwerkelijk een andere fase nodig
// is. Voor gepland netladen wordt eenmaal naar drie fasen voorbereid; voor
// zonneladen alleen naar één fase als drie fasen niet kunnen starten, of naar
// drie fasen als één fase het beschikbare overschot niet meer kan verwerken.
const necessaryEVPhaseSwitchMarker = 'const onePhaseStartThresholdW = 6 * 230;';
if (!regulator.func.includes(necessaryEVPhaseSwitchMarker)) {
  const legacyEVPhaseLogic = `const phaseUpThresholdW = 4700;
const phaseDownThresholdW = 3500;
const phaseUpStableMs = 2 * 60 * 1000;
const phaseDownStableMs = 5 * 60 * 1000;
const minimumPhaseDwellMs = 10 * 60 * 1000;
let solarPhaseMode = Number(previous.solarPhaseMode) === 3 ? 3 : 1;
let solarHighSince = Number(previous.solarHighSince) || 0;
let solarLowSince = Number(previous.solarLowSince) || 0;
let lastPhaseChangeAt = Number(previous.lastPhaseChangeAt) || 0;

if (potentialSolarSurplus !== null && potentialSolarSurplus >= phaseUpThresholdW) {
    solarHighSince = solarHighSince || now;
    solarLowSince = 0;
    if (now - solarHighSince >= phaseUpStableMs && now - lastPhaseChangeAt >= minimumPhaseDwellMs) solarPhaseMode = 3;
} else if (potentialSolarSurplus !== null && potentialSolarSurplus <= phaseDownThresholdW) {
    solarLowSince = solarLowSince || now;
    solarHighSince = 0;
    if (now - solarLowSince >= phaseDownStableMs && now - lastPhaseChangeAt >= minimumPhaseDwellMs) solarPhaseMode = 1;
} else {
    solarHighSince = 0;
    solarLowSince = 0;
}

const fastChargeMode = forceFull || deadlineCharge || ultraCheapQuarter || scheduledNow;
const dwellActive = lastPhaseChangeAt > 0 && now - lastPhaseChangeAt < minimumPhaseDwellMs;
const desiredPhaseMode = fastChargeMode ? 3 : dwellActive && configuredPhaseMode ? configuredPhaseMode : solarPhaseMode;`;
  const necessaryEVPhaseLogic = `const onePhaseStartThresholdW = 6 * 230;
const threePhaseStartThresholdW = 6 * 230 * 3;
const onePhaseMaximumPowerW = 25 * 230;
const phaseUpThresholdW = onePhaseMaximumPowerW;
const phaseDownThresholdW = threePhaseStartThresholdW;
const phaseUpStableMs = 2 * 60 * 1000;
const phaseDownStableMs = 5 * 60 * 1000;
const minimumPhaseDwellMs = 10 * 60 * 1000;
const actualPhaseMode = configuredPhaseMode || (phases === 1 ? 1 : 3);
let solarPhaseMode = actualPhaseMode;
let solarHighSince = Number(previous.solarHighSince) || 0;
let solarLowSince = Number(previous.solarLowSince) || 0;
let lastPhaseChangeAt = Number(previous.lastPhaseChangeAt) || 0;
const nextScheduledStartMs = nextScheduled ? Number(nextScheduled.start) : NaN;
const scheduledBlockPreparation = Number.isFinite(nextScheduledStartMs) && audiSoc !== null && audiSoc < departureSoc && now >= nextScheduledStartMs - 10 * 60 * 1000;
const gridChargeRequiresThreePhase = forceFull || deadlineCharge || ultraCheapQuarter || scheduledNow || scheduledBlockPreparation;
const solarPhaseAdjustmentAllowed = enabled && audiSoc !== null && audiSoc < solarSoc && !gridChargeRequiresThreePhase
    && potentialSolarSurplus !== null && potentialSolarSurplus >= onePhaseStartThresholdW;

if (solarPhaseAdjustmentAllowed && actualPhaseMode === 1 && potentialSolarSurplus > phaseUpThresholdW) {
    solarHighSince = solarHighSince || now;
    solarLowSince = 0;
    if (now - solarHighSince >= phaseUpStableMs && now - lastPhaseChangeAt >= minimumPhaseDwellMs) solarPhaseMode = 3;
} else if (solarPhaseAdjustmentAllowed && actualPhaseMode === 3 && potentialSolarSurplus < phaseDownThresholdW) {
    solarLowSince = solarLowSince || now;
    solarHighSince = 0;
    if (now - solarLowSince >= phaseDownStableMs && now - lastPhaseChangeAt >= minimumPhaseDwellMs) solarPhaseMode = 1;
} else {
    solarHighSince = 0;
    solarLowSince = 0;
}

const dwellActive = lastPhaseChangeAt > 0 && now - lastPhaseChangeAt < minimumPhaseDwellMs;
const desiredPhaseMode = gridChargeRequiresThreePhase
    ? 3
    : solarPhaseAdjustmentAllowed && !dwellActive
        ? solarPhaseMode
        : actualPhaseMode;`;
  if (!regulator.func.includes(legacyEVPhaseLogic)) throw new Error('Oude automatische EV-faselogica niet gevonden.');
  regulator.func = regulator.func.replace(legacyEVPhaseLogic, necessaryEVPhaseLogic);
}

// De EV/Easee-combinatie kan een startopdracht accepteren zonder werkelijk
// te gaan laden. Gebruik daarom werkelijk vermogen als waarheid, schat de SOC
// tussen trage EV-cloudupdates door en verander de laadstroom rustig.
const robustEVChargingMarker = 'const reportedEVSoc = value(\'sensor.ev_state_of_charge\');';
if (!regulator.func.includes(robustEVChargingMarker)) {
  regulator.func = regulator.func.replace(
    `const chargerPower = value('sensor.ev_charger_power', 1000);
const audiSoc = value('sensor.ev_state_of_charge');
const audiTargetSoc = value('sensor.ev_target_state_of_charge');`,
    `const chargerPower = value('sensor.ev_charger_power', 1000);
const reportedEVSoc = value('sensor.ev_state_of_charge');
const audiTargetSoc = value('sensor.ev_target_state_of_charge');
const previousSocEstimator = flow.get('ess_audi_soc_estimator') || {};
const previousEstimatedSoc = Number(previousSocEstimator.estimatedSoc);
const previousReportedSoc = Number(previousSocEstimator.reportedSoc);
const previousSocSampleAt = new Date(previousSocEstimator.lastSampleAt || 0).getTime();
const socElapsedHours = Number.isFinite(previousSocSampleAt) && previousSocSampleAt > 0
    ? Math.min(120000, Math.max(0, now - previousSocSampleAt)) / 3600000
    : 0;
let estimatedEVSoc = Number.isFinite(previousEstimatedSoc)
    ? previousEstimatedSoc
    : reportedEVSoc;
const reportedSocChanged = reportedEVSoc !== null && (!Number.isFinite(previousReportedSoc) || Math.abs(reportedEVSoc - previousReportedSoc) >= 0.2);
if (reportedSocChanged || estimatedEVSoc === null || !Number.isFinite(Number(estimatedEVSoc))) {
    estimatedEVSoc = reportedEVSoc;
} else if (chargerPower !== null && chargerPower > 100 && socElapsedHours > 0) {
    estimatedEVSoc = clamp(Number(estimatedEVSoc) + chargerPower / 1000 * socElapsedHours * 0.92 / batteryCapacityKwh * 100, 0, 100);
}
const socEstimatorFresh = previousSocSampleAt > 0 && now - previousSocSampleAt <= 12 * 60 * 60 * 1000;
const audiSoc = Number.isFinite(Number(estimatedEVSoc)) && (reportedEVSoc !== null || socEstimatorFresh)
    ? clamp(Number(estimatedEVSoc), 0, 100)
    : reportedEVSoc;
const audiSocSource = reportedEVSoc === null ? 'geschat' : Number.isFinite(Number(estimatedEVSoc)) && Math.abs(Number(estimatedEVSoc) - reportedEVSoc) >= 0.05 ? 'geschat sinds EV-update' : 'EV';
flow.set('ess_audi_soc_estimator', {
    reportedSoc:reportedEVSoc,
    estimatedSoc:audiSoc,
    lastSampleAt:new Date(now).toISOString(),
    chargerPowerW:chargerPower,
    source:audiSocSource,
    updatedAt:new Date(now).toISOString()
});`);

  regulator.func = regulator.func.replace(
    `const controllableStatuses = ['awaiting_start', 'awaiting_authorization', 'ready_to_charge', 'charging'];`,
    `const controllableStatuses = ['awaiting_start', 'awaiting_authorization', 'ready_to_charge', 'charging'];
const chargerPowerFresh = fresh('sensor.ev_charger_power', 30000);
const actualChargingNow = chargerStatus === 'charging' && chargerPowerFresh && chargerPower !== null && chargerPower >= 1000;
let actualChargeSince = actualChargingNow
    ? previous.actualCharging === true ? Number(previous.actualChargeSince) || now : now
    : 0;
const chargingConfirmed = actualChargingNow && now - actualChargeSince >= 30000;
const restartGraceUntil = Number(flow.get('ess_audi_restart_grace_until')) || 0;
const restartGraceActive = now < restartGraceUntil;
const preflightWindowActive = scheduledBlockPreparation || scheduledNow || forceFull || deadlineCharge;
const preflightIssues = [];
if (!enabled) preflightIssues.push('slim laden staat uit');
if (evSmartChargingActive) preflightIssues.push('EV Smart Charging staat aan');
if (!chargerOnline || !chargerId) preflightIssues.push('Easee is niet online');
if (!controllableStatuses.includes(chargerStatus)) preflightIssues.push('EV is niet laadgereed');
if (!fresh('sensor.p1_meter_vermogen', 15000) || gridPower === null) preflightIssues.push('P1-data ontbreekt of is oud');
if (!chargerPowerFresh || chargerPower === null) preflightIssues.push('Easee-vermogen ontbreekt of is oud');
if (audiSoc === null) preflightIssues.push('EV-SOC ontbreekt');
if (preflightWindowActive && gridChargeRequiresThreePhase && configuredPhaseMode !== 3) preflightIssues.push('wacht op 3 fasen');
const preflightReady = preflightIssues.length === 0;`);

  regulator.func = regulator.func.replace(
    `        targetCurrent = Math.min(targetCurrent, ...safeCurrents);
        if (targetCurrent < minimumCurrent) {`,
    `        safeCurrentLimit = Math.min(maximumCurrent, ...safeCurrents);
        targetCurrent = Math.min(targetCurrent, safeCurrentLimit);
        if (targetCurrent < minimumCurrent) {`);
  regulator.func = regulator.func.replace(
    `const maximumCurrent = 25;
const controllableStatuses`,
    `const maximumCurrent = 25;
let safeCurrentLimit = maximumCurrent;
const controllableStatuses`);

  regulator.func = regulator.func.replace(
    `if (controlMode === 'solar' && targetCurrent >= minimumCurrent && previous.controlMode !== 'solar') solarStartedAt = now;`,
    `const requestedTargetCurrent = targetCurrent;
let lastIncreaseAt = Number(previous.lastIncreaseAt) || 0;
const safetyDecrease = safeCurrentLimit < lastTarget;
if (targetCurrent >= minimumCurrent) {
    if (lastTarget < minimumCurrent) {
        targetCurrent = minimumCurrent;
        lastIncreaseAt = now;
    } else if (targetCurrent > lastTarget) {
        if (targetCurrent - lastTarget <= 1) {
            targetCurrent = lastTarget;
        } else if (now - lastIncreaseAt >= 60000) {
            targetCurrent = Math.min(targetCurrent, lastTarget + 2);
            lastIncreaseAt = now;
        } else {
            targetCurrent = lastTarget;
        }
    } else if (targetCurrent < lastTarget && !safetyDecrease && lastTarget - targetCurrent <= 1) {
        targetCurrent = lastTarget;
    }
}

if (controlMode === 'solar' && targetCurrent >= minimumCurrent && previous.controlMode !== 'solar') solarStartedAt = now;`);

  regulator.func = regulator.func.replace(
    `const changed = targetCurrent !== lastTarget;`,
    `const requestedActive = targetCurrent >= minimumCurrent;
let chargeRequestedSince = requestedActive
    ? previous.requestedActive === true ? Number(previous.chargeRequestedSince) || now : now
    : 0;
const recoveryStatus = flow.get('ess_audi_start_recovery') || {};
if (requestedActive && !chargingConfirmed) {
    if (recoveryStatus.stage === 'failed') {
        reason = 'Storing: EV start niet · ' + reason;
    } else if (['cooldown','recovering'].includes(String(recoveryStatus.stage || ''))) {
        reason = 'Automatisch herstel ' + String(recoveryStatus.stage) + ' · ' + reason;
    } else {
        reason = 'Start controleren · ' + reason;
    }
}

const todayKey = new Date(now).toLocaleDateString('sv-SE');
let reliability = flow.get('ess_audi_charge_reliability') || {};
if (reliability.date !== todayKey) reliability = { date:todayKey, plannedSeconds:0, actualSeconds:0, failedSeconds:0, startAttempts:0, fullRecoveries:0, failures:0 };
const previousUpdatedAt = new Date(previous.updatedAt || 0).getTime();
const reliabilityElapsedSeconds = previousUpdatedAt > 0 ? Math.min(15, Math.max(0, now - previousUpdatedAt) / 1000) : 0;
if (previous.requestedActive === true && reliabilityElapsedSeconds > 0) {
    reliability.plannedSeconds = Number(reliability.plannedSeconds || 0) + reliabilityElapsedSeconds;
    if (actualChargingNow) reliability.actualSeconds = Number(reliability.actualSeconds || 0) + reliabilityElapsedSeconds;
    else if (Number(previous.chargeRequestedSince) > 0 && now - Number(previous.chargeRequestedSince) >= 30000) reliability.failedSeconds = Number(reliability.failedSeconds || 0) + reliabilityElapsedSeconds;
}
reliability.updatedAt = new Date(now).toISOString();
flow.set('ess_audi_charge_reliability', reliability);

const changed = targetCurrent !== lastTarget;`);

  regulator.func = regulator.func.replace(
    `    active: targetCurrent >= minimumCurrent,
    controlled: targetCurrent >= minimumCurrent,`,
    `    active: chargingConfirmed,
    controlled: requestedActive,
    requestedActive,
    actualCharging:actualChargingNow,
    chargingConfirmed,
    chargeRequestedSince,
    actualChargeSince,
    requestedTargetCurrent,
    safeCurrentLimit,
    lastIncreaseAt,`);
  regulator.func = regulator.func.replace(
    `    vehicleTargetSoc,
    solarReadySince,`,
    `    vehicleTargetSoc,
    reportedEVSoc,
    estimatedEVSoc:audiSoc,
    audiSocSource,
    chargerPowerW:chargerPower,
    preflightWindowActive,
    preflightReady,
    preflightIssues,
    restartGraceActive,
    restartGraceUntil:restartGraceUntil || null,
    recoveryStage:String(recoveryStatus.stage || 'idle'),
    recoveryAttempts:Number(recoveryStatus.attempts) || 0,
    fullRecoveries:Number(reliability.fullRecoveries) || 0,
    failedChargingMinutes:Math.round(Number(reliability.failedSeconds || 0) / 6) / 10,
    plannedChargingMinutes:Math.round(Number(reliability.plannedSeconds || 0) / 6) / 10,
    actualChargingMinutes:Math.round(Number(reliability.actualSeconds || 0) / 6) / 10,
    startAttempts:Number(reliability.startAttempts) || 0,
    solarReadySince,`);
}

// Direct naar 100% is bewust een eenmalige aangesloten laadsessie. Zodra de
// EV wordt losgekoppeld mag deze handmatige stand niet gewapend blijven voor
// een volgende rit of aansluiting.
const cancelDirectChargeOnDisconnectMarker = '// Direct laden vervalt bij ontkoppelen.';
if (!regulator.func.includes(cancelDirectChargeOnDisconnectMarker)) {
  regulator.func = regulator.func.replace(
    `const chargerStatus = state('sensor.ev_charger_status');
const chargerOnline`,
    `const chargerStatus = state('sensor.ev_charger_status');
${cancelDirectChargeOnDisconnectMarker}
if (forceFull && chargerStatus === 'disconnected') {
    forceFull = false;
    flow.set('ess_audi_force_full', false);
    flow.set('ess_audi_force_full_cancelled_at', new Date(now).toISOString());
}
const chargerOnline`);
}

// Handmatig direct laden moet direct reageren. De automatische regeling houdt
// een rustige start, maar loopt daarna met vier ampère per minuut op.
const steeperEVRampMarker = 'const currentRampStepA = 4;';
if (!regulator.func.includes(steeperEVRampMarker)) {
  const legacyEVRamp = `const requestedTargetCurrent = targetCurrent;
let lastIncreaseAt = Number(previous.lastIncreaseAt) || 0;
const safetyDecrease = safeCurrentLimit < lastTarget;
if (targetCurrent >= minimumCurrent) {
    if (lastTarget < minimumCurrent) {
        targetCurrent = minimumCurrent;
        lastIncreaseAt = now;
    } else if (targetCurrent > lastTarget) {
        if (targetCurrent - lastTarget <= 1) {
            targetCurrent = lastTarget;
        } else if (now - lastIncreaseAt >= 60000) {
            targetCurrent = Math.min(targetCurrent, lastTarget + 2);
            lastIncreaseAt = now;
        } else {
            targetCurrent = lastTarget;
        }
    } else if (targetCurrent < lastTarget && !safetyDecrease && lastTarget - targetCurrent <= 1) {
        targetCurrent = lastTarget;
    }
}`;
  const steeperEVRamp = `const requestedTargetCurrent = targetCurrent;
const currentRampStepA = 4;
const directChargeBypassesRamp = controlMode === 'force-full';
let lastIncreaseAt = Number(previous.lastIncreaseAt) || 0;
const safetyDecrease = safeCurrentLimit < lastTarget;
if (targetCurrent >= minimumCurrent) {
    if (directChargeBypassesRamp) {
        // Direct naar 100% gebruikt meteen het maximaal veilige vermogen.
        lastIncreaseAt = now;
    } else if (lastTarget < minimumCurrent) {
        targetCurrent = minimumCurrent;
        lastIncreaseAt = now;
    } else if (targetCurrent > lastTarget) {
        if (targetCurrent - lastTarget <= 1) {
            targetCurrent = lastTarget;
        } else if (now - lastIncreaseAt >= 60000) {
            targetCurrent = Math.min(targetCurrent, lastTarget + currentRampStepA);
            lastIncreaseAt = now;
        } else {
            targetCurrent = lastTarget;
        }
    } else if (targetCurrent < lastTarget && !safetyDecrease && lastTarget - targetCurrent <= 1) {
        targetCurrent = lastTarget;
    }
}`;
  if (!regulator.func.includes(legacyEVRamp)) throw new Error('Oude EV-stroomcurve niet gevonden.');
  regulator.func = regulator.func.replace(legacyEVRamp, steeperEVRamp);
}

// Een gelijkblijvend Easee-vermogen krijgt in Home Assistant geen nieuwe
// last_updated-tijd. Bovendien kan het vermogenssignaal kort 0 zijn terwijl de
// laadstroom wel doorloopt. Gebruik daarom de echte laadstroom als primaire
// terugkoppeling en de door Easee toegewezen stroom bij de fasecompensatie.
const stableEVTelemetryMarker = "const chargerCurrent = value('sensor.ev_charger_current');";
if (!regulator.func.includes(stableEVTelemetryMarker)) {
  regulator.func = regulator.func.replace(
    `const chargerPower = value('sensor.ev_charger_power', 1000);
const reportedEVSoc`,
    `const chargerPower = value('sensor.ev_charger_power', 1000);
const chargerCurrentEntity = entity('sensor.ev_charger_current');
const chargerCurrentAttributes = chargerCurrentEntity && chargerCurrentEntity.attributes ? chargerCurrentEntity.attributes : {};
const chargerCurrent = value('sensor.ev_charger_current');
const reportedEVSoc`);

  regulator.func = regulator.func.replace(
    `} else if (chargerPower !== null && chargerPower > 100 && socElapsedHours > 0) {
    estimatedEVSoc = clamp(Number(estimatedEVSoc) + chargerPower / 1000 * socElapsedHours * 0.92 / batteryCapacityKwh * 100, 0, 100);`,
    `} else if (chargerStatus === 'charging' && chargerPower !== null && chargerPower > 100 && socElapsedHours > 0) {
    estimatedEVSoc = clamp(Number(estimatedEVSoc) + chargerPower / 1000 * socElapsedHours * 0.92 / batteryCapacityKwh * 100, 0, 100);`);

  regulator.func = regulator.func.replace(
    `const chargerPowerFresh = fresh('sensor.ev_charger_power', 30000);
const actualChargingNow = chargerStatus === 'charging' && chargerPowerFresh && chargerPower !== null && chargerPower >= 1000;`,
    `const chargingTelemetryActive = (chargerCurrent !== null && chargerCurrent >= 4) || (chargerPower !== null && chargerPower >= 1000);
const actualChargingNow = chargerStatus === 'charging' && chargingTelemetryActive;`);

  regulator.func = regulator.func.replace(
    `if (!chargerPowerFresh || chargerPower === null) preflightIssues.push('Easee-vermogen ontbreekt of is oud');`,
    `if (chargerPower === null && chargerCurrent === null) preflightIssues.push('Easee-meetwaarden ontbreken');`);

  regulator.func = regulator.func.replace(
    `        const existingEvCurrent = Math.max(0, chargerPower / (voltage * phases));`,
    `        const allocatedPhaseCurrents = [
            chargerCurrentAttributes.state_circuitTotalAllocatedPhaseConductorCurrentL1,
            chargerCurrentAttributes.state_circuitTotalAllocatedPhaseConductorCurrentL2,
            chargerCurrentAttributes.state_circuitTotalAllocatedPhaseConductorCurrentL3
        ].map(Number).filter(Number.isFinite);
        const allocatedEvCurrent = allocatedPhaseCurrents.length ? Math.max(...allocatedPhaseCurrents) : maximumCurrent;
        const measuredEvCurrent = chargerStatus === 'charging'
            ? chargerCurrent !== null
                ? Math.max(0, chargerCurrent)
                : Math.max(0, chargerPower / (voltage * phases))
            : 0;
        const expectedEvCurrent = chargerStatus === 'charging' && lastTarget >= minimumCurrent
            ? Math.min(lastTarget, allocatedEvCurrent)
            : 0;
        const existingEvCurrent = Math.max(measuredEvCurrent, expectedEvCurrent);`);

  regulator.func = regulator.func.replace(
    `    chargerPowerW:chargerPower,
    preflightWindowActive,`,
    `    chargerPowerW:chargerPower,
    chargerCurrentA:chargerCurrent,
    chargingTelemetryActive,
    preflightWindowActive,`);
}
const activeEVCurrentOnlyMarker = "const measuredEvCurrent = chargerStatus === 'charging'";
if (!regulator.func.includes(activeEVCurrentOnlyMarker)) {
  regulator.func = regulator.func.replace(
    `        const measuredEvCurrent = chargerCurrent !== null
            ? Math.max(0, chargerCurrent)
            : Math.max(0, chargerPower / (voltage * phases));`,
    `        const measuredEvCurrent = chargerStatus === 'charging'
            ? chargerCurrent !== null
                ? Math.max(0, chargerCurrent)
                : Math.max(0, chargerPower / (voltage * phases))
            : 0;`);
}
const derivedEVPowerMarker = 'const chargerPowerForControl = chargerStatus === \'charging\'';
if (!regulator.func.includes(derivedEVPowerMarker)) {
  regulator.func = regulator.func.replace(
    `const chargerCurrent = value('sensor.ev_charger_current');
const reportedEVSoc`,
    `const chargerCurrent = value('sensor.ev_charger_current');
const chargerPowerForControl = chargerStatus === 'charging' && chargerCurrent !== null
    ? chargerCurrent * 230 * phaseCount(Number(statusAttributes.state_outputPhase) || 0)
    : chargerPower;
const reportedEVSoc`);
  regulator.func = regulator.func.replace(
    `} else if (chargerStatus === 'charging' && chargerPower !== null && chargerPower > 100 && socElapsedHours > 0) {
    estimatedEVSoc = clamp(Number(estimatedEVSoc) + chargerPower / 1000 * socElapsedHours * 0.92 / batteryCapacityKwh * 100, 0, 100);`,
    `} else if (chargerStatus === 'charging' && chargerPowerForControl !== null && chargerPowerForControl > 100 && socElapsedHours > 0) {
    estimatedEVSoc = clamp(Number(estimatedEVSoc) + chargerPowerForControl / 1000 * socElapsedHours * 0.92 / batteryCapacityKwh * 100, 0, 100);`);
  regulator.func = regulator.func.replace(
    `const potentialSolarSurplus = gridPower === null || chargerPower === null ? null : Math.max(0, chargerPower - gridPower);`,
    `const potentialSolarSurplus = gridPower === null || chargerPowerForControl === null ? null : Math.max(0, chargerPowerForControl - gridPower);`);
  regulator.func = regulator.func.replace(
    `} else if (gridPower === null || chargerPower === null) {
    reason = 'Veilige stop: meetwaarde ontbreekt';`,
    `} else if (gridPower === null || chargerPowerForControl === null) {
    reason = 'Veilige stop: meetwaarde ontbreekt';`);
  regulator.func = regulator.func.replace(
    `        const desiredPower = chargerPower + (150 - gridPower);`,
    `        const desiredPower = chargerPowerForControl + (150 - gridPower);`);
  regulator.func = regulator.func.replace(
    `                : Math.max(0, chargerPower / (voltage * phases))`,
    `                : Math.max(0, chargerPowerForControl / (voltage * phases))`);
  regulator.func = regulator.func.replace(
    `    chargerPowerW:chargerPower,
    chargerCurrentA:chargerCurrent,`,
    `    chargerPowerW:chargerPower,
    chargerPowerForControlW:chargerPowerForControl,
    chargerCurrentA:chargerCurrent,`);
}

const audiInitialAttemptMarker = '// Tel ook de eerste geplande start mee, niet alleen herstelpogingen.';
if (!regulator.func.includes(audiInitialAttemptMarker)) {
  regulator.func = regulator.func.replace(
    `    if (targetCurrent >= minimumCurrent && !wasControlled) {
        commandMessage = { payload: { chargerId, command: 'start' } };`,
    `    if (targetCurrent >= minimumCurrent && !wasControlled) {
        commandMessage = { payload: { chargerId, command: 'start' } };
        ${audiInitialAttemptMarker}
        reliability.startAttempts = Number(reliability.startAttempts || 0) + 1;
        flow.set('ess_audi_charge_reliability', reliability);`);
}

// Controleer na 35 seconden of er werkelijk ten minste 1 kW loopt. Maximaal
// drie gewone startpogingen, daarna vijf minuten rust, één volledige stop/start
// en bij opnieuw falen een HA-melding met tien minuten afkoeltijd.
const audiVerifyDelay = node('ess000000000018');
audiVerifyDelay.timeout = '35';
audiVerifyDelay.timeoutUnits = 'seconds';
audiVerifyDelay.wires = [['ess000000000019']];
const audiStartRetry = node('ess000000000019');
audiStartRetry.outputs = 3;
audiStartRetry.func = `const requestedCurrent = Number(msg.payload && msg.payload.current);
const chargerId = msg.payload && msg.payload.chargerId;
if (!chargerId || !Number.isFinite(requestedCurrent) || requestedCurrent < 6) return [null, null, null];

const ha = global.get('homeassistant');
const states = ha && ha.homeAssistant && ha.homeAssistant.states;
const statusEntity = states && states['sensor.ev_charger_status'];
const powerEntity = states && states['sensor.ev_charger_power'];
const currentEntity = states && states['sensor.ev_charger_current'];
const status = statusEntity ? String(statusEntity.state) : '';
const powerW = powerEntity && Number.isFinite(Number(powerEntity.state)) ? Number(powerEntity.state) * 1000 : null;
const currentA = currentEntity && Number.isFinite(Number(currentEntity.state)) ? Number(currentEntity.state) : null;
const blockedStatuses = ['disconnected', 'completed', 'error'];
const now = Date.now();
let recovery = flow.get('ess_audi_start_recovery') || {};
let reliability = flow.get('ess_audi_charge_reliability') || {};
const todayKey = new Date(now).toLocaleDateString('sv-SE');
if (reliability.date !== todayKey) reliability = { date:todayKey, plannedSeconds:0, actualSeconds:0, failedSeconds:0, startAttempts:0, fullRecoveries:0, failures:0 };

if (status === 'charging' && ((powerW !== null && powerW >= 1000) || (currentA !== null && currentA >= 4))) {
    recovery = { stage:'idle', attempts:0, chargerId, lastSuccessAt:now, updatedAt:new Date(now).toISOString() };
    flow.set('ess_audi_start_recovery', recovery);
    node.status({ fill:'green', shape:'dot', text:'Laden bevestigd' });
    return [null, null, null];
}
if (blockedStatuses.includes(status)) {
    flow.set('ess_audi_start_recovery', { stage:'blocked', attempts:0, chargerId, status, updatedAt:new Date(now).toISOString() });
    node.status({ fill:'grey', shape:'ring', text:'Niet laadgereed: ' + status });
    return [null, null, null];
}

if (recovery.chargerId !== chargerId) recovery = { stage:'retrying', attempts:0, chargerId };
if (recovery.stage === 'failed' && now < Number(recovery.cooldownUntil || 0)) return [null, null, null];
if (recovery.stage === 'failed') recovery = { stage:'retrying', attempts:0, chargerId };

if (recovery.stage === 'recovering') {
    if (now - Number(recovery.recoverySentAt || 0) < 90000) return [null, null, null];
    recovery.stage = 'failed';
    recovery.cooldownUntil = now + 10 * 60 * 1000;
    recovery.failureNotifiedAt = now;
    recovery.updatedAt = new Date(now).toISOString();
    reliability.failures = Number(reliability.failures || 0) + 1;
    flow.set('ess_audi_charge_reliability', reliability);
    flow.set('ess_audi_start_recovery', recovery);
    node.status({ fill:'red', shape:'dot', text:'EV start niet' });
    return [null, null, { payload:{ title:'EV laden niet gestart', message:'ESS heeft drie startpogingen en één volledige stop/start geprobeerd. Controleer EV en Easee.' } }];
}

if (recovery.stage === 'cooldown') {
    if (now < Number(recovery.cooldownUntil || 0)) return [null, null, null];
    recovery.stage = 'recovering';
    recovery.recoverySentAt = now;
    recovery.fullRecoveries = Number(recovery.fullRecoveries || 0) + 1;
    recovery.updatedAt = new Date(now).toISOString();
    reliability.fullRecoveries = Number(reliability.fullRecoveries || 0) + 1;
    reliability.startAttempts = Number(reliability.startAttempts || 0) + 1;
    flow.set('ess_audi_charge_reliability', reliability);
    flow.set('ess_audi_start_recovery', recovery);
    node.status({ fill:'yellow', shape:'dot', text:'Volledig stop/start-herstel' });
    return [{ payload:{ chargerId, command:'stop' } }, { payload:{ chargerId, command:'start' } }, null];
}

const attempts = Number(recovery.attempts) || 0;
const lastRetryAt = Number(recovery.lastRetryAt) || 0;
if (attempts >= 3) {
    recovery.stage = 'cooldown';
    recovery.cooldownUntil = now + 5 * 60 * 1000;
    recovery.updatedAt = new Date(now).toISOString();
    flow.set('ess_audi_start_recovery', recovery);
    node.status({ fill:'yellow', shape:'ring', text:'5 minuten rust voor herstel' });
    return [null, null, null];
}
if (now - lastRetryAt < 45000) return [null, null, null];

recovery = { ...recovery, stage:'retrying', attempts:attempts + 1, chargerId, lastRetryAt:now, updatedAt:new Date(now).toISOString() };
reliability.startAttempts = Number(reliability.startAttempts || 0) + 1;
flow.set('ess_audi_charge_reliability', reliability);
flow.set('ess_audi_start_recovery', recovery);
node.status({ fill:'blue', shape:'dot', text:'Startpoging ' + recovery.attempts + ' van 3' });
return [{ payload:{ chargerId, command:'start' } }, null, null];`;
audiStartRetry.wires = [['ess00000000000f'], [ids.audiRecoveryDelay], [ids.audiRecoveryNotification]];

flows.push({
  id: ids.audiRecoveryDelay, type:'delay', z:FLOW_ID, name:'Wacht voor volledige herstart', pauseType:'delay', timeout:'20', timeoutUnits:'seconds',
  rate:'1', nbRateUnits:'1', rateUnits:'second', randomFirst:'1', randomLast:'5', randomUnits:'seconds', drop:false, allowrate:false, outputs:1,
  x:1040, y:625, wires:[['ess00000000000f']]
});
flows.push({
  id:ids.audiRecoveryNotification, type:'api-call-service', z:FLOW_ID, name:'Meld EV-laadstoring', server:'ess00000000000b', version:7,
  debugenabled:false, action:'persistent_notification.create', floorId:[], areaId:[], deviceId:[], entityId:[], labelId:[],
  data:'{"title":payload.title,"message":payload.message,"notification_id":"ess_audi_laadprobleem"}', dataType:'jsonata', mergeContext:'', mustacheAltTags:false,
  outputProperties:[], queue:'none', blockInputOverrides:true, domain:'persistent_notification', service:'create', x:1060, y:665, wires:[[]]
});

const audiUnplannedGuard = node('ess000000000021');
if (!audiUnplannedGuard.func.includes('ess_audi_restart_grace_until')) {
  audiUnplannedGuard.func = audiUnplannedGuard.func.replace(
    `if (flow.get('ess_audi_smart_enabled') !== true) return null;`,
    `if (flow.get('ess_audi_smart_enabled') !== true) return null;
if (Date.now() < (Number(flow.get('ess_audi_restart_grace_until')) || 0)) {
    node.status({ fill:'blue', shape:'ring', text:'Herstartrespijt' });
    return null;
}`);
}

// Houd de Node-RED-editor leesbaar. Deze indeling wordt bij iedere generatie
// opnieuw toegepast, zodat functionele wijzigingen geen wirwar van nodes maken.
const editorGroupIds = new Set([
  ids.dashboardEditorGroup, ids.configEditorGroup, ids.audiEditorGroup, ids.vehicleEditorGroup,
  ids.loadsEditorGroup, ids.lightingEditorGroup, ids.climateEditorGroup, ids.pricesEditorGroup, ids.witEditorGroup
]);
for (const item of flows) {
  if (editorGroupIds.has(item.g)) delete item.g;
}

const editorGroups = [
  {
    id: ids.dashboardEditorGroup, name: '1 · Dashboarddata en pagina’s', color: '#dbeafe', x: 50, y: 40, w: 1410, h: 340,
    positions: {
      'ess000000000002':[160,105], 'ess00000000000a':[420,105], 'ess000000000003':[690,105],
      [ids.p1HistoryInject]:[160,285], [ids.p1HistoryPrepare]:[410,285], [ids.p1History]:[690,285], [ids.p1HistoryStore]:[980,285],
      [ids.p1HistoryCatch]:[410,325],
      [OVERVIEW_TEMPLATE_ID]:[990,80], [ids.energyTemplate]:[990,125], [ids.batteryTemplate]:[990,170], [ids.evTemplate]:[990,215],
      [ids.loadsTemplate]:[1250,80], [ids.lightingTemplate]:[1250,125], [ids.climateTemplate]:[1250,170], [ids.systemTemplate]:[1250,215]
    }
  },
  {
    id: ids.audiEditorGroup, name: '2 · EV slim laden', color: '#ede9fe', x: 50, y: 380, w: 930, h: 340,
    positions: {
      [ids.audiDefaultsInject]:[170,420], [ids.audiHaEvents]:[170,455], [ids.audiDefaults]:[360,625],
      'ess000000000009':[350,415], 'ess00000000000d':[280,485], 'ess000000000020':[280,555], 'ess000000000021':[560,555],
      'ess000000000010':[560,450], 'ess00000000000e':[800,470], 'ess00000000000f':[800,520], 'ess000000000017':[800,570],
      'ess000000000018':[560,625], 'ess000000000019':[800,625],
      [ids.audiRecoveryDelay]:[560,675], [ids.audiRecoveryNotification]:[800,675]
    }
  },
  {
    id: ids.vehicleEditorGroup, name: '3 · EV instellingen en voertuigacties', color: '#fef3c7', x: 1040, y: 380, w: 880, h: 260,
    positions: {
      [CONTROL_ID]:[1220,450], 'ess000000000012':[1580,410], [ids.climateDevice]:[1480,470], [ids.climateAction]:[1760,470],
      [ids.vehicleDevice]:[1480,540], [ids.vehicleAction]:[1760,540]
    }
  },
  {
    id: ids.loadsEditorGroup, name: '4 · Schakelbare verbruikers', color: '#dcfce7', x: 1040, y: 670, w: 720, h: 140,
    positions: { [ids.loadsControl]:[1220,740], [ids.compressorAction]:[1550,740] }
  },
  {
    id: ids.pricesEditorGroup, name: '6 · Nord Pool-planning', color: '#fef9c3', x: 50, y: 740, w: 930, h: 160,
    positions: { 'ess000000000013':[170,820], 'ess000000000014':[410,820], 'ess000000000015':[660,820], 'ess000000000016':[880,820] }
  },
  {
    id: ids.lightingEditorGroup, name: '5 · Verlichting per ruimte', color: '#fef3c7', x: 1040, y: 850, w: 880, h: 170,
    positions: { [ids.lightingControl]:[1220,930], [ids.lightingTurnOnAction]:[1590,900], [ids.lightingTurnOffAction]:[1590,960] }
  },
  {
    id: ids.climateEditorGroup, name: '7 · Klimaatbediening', color: '#cffafe', x: 1040, y: 1050, w: 880, h: 280,
    positions: {
      [ids.climateControl]:[1220,1180], [ids.climateTemperatureAction]:[1600,1100], [ids.climateModeAction]:[1600,1150],
      [ids.waterTemperatureAction]:[1600,1210], [ids.waterModeAction]:[1600,1260]
    }
  },
  {
    id:ids.configEditorGroup, name:'9 · Lokale configuratie en privacy', color:'#f3e8ff', x:1480, y:40, w:960, h:360,
    positions:{
      [ids.configTemplate]:[2080,100], [ids.configReadInject]:[1580,180], [ids.configBackupRead]:[1800,150],
      [ids.configReadDelay]:[1780,230], [ids.configFileRead]:[1980,230], [ids.configControl]:[2180,190],
      [ids.configFileWrite]:[2380,160], [ids.configBackupWrite]:[2380,230]
    }
  },
  {
    id: ids.witEditorGroup, name: '8 · WIT export, netladen en EV-buffer', color: '#dbeafe', x: 50, y: 920, w: 1400, h: 650,
    positions: {
      [ids.witExportInject]:[170,980], [ids.witExportModeControl]:[170,1060], [ids.witExportControl]:[450,1020],
      [ids.witExportAuthorityAction]:[760,960], [ids.witExportRateAction]:[760,1020], [ids.witExportToggleAction]:[760,1080],
      [ids.witEVInject]:[170,1140], [ids.witEVControl]:[450,1140], [ids.witEVDurationAction]:[760,1140],
      [ids.witEVRateAction]:[1010,1140], [ids.witEVModeAction]:[1270,1140], [ids.witEVStopAction]:[760,1200],
      [ids.witEVBufferModeControl]:[260,1230],
      [ids.witGridChargeSettingsControl]:[230,1340], [ids.witGridChargeInject]:[170,1400], [ids.witGridChargeControl]:[470,1370],
      [ids.witGridChargePowerAction]:[790,1340], [ids.witGridChargeModeAction]:[800,1400],
      [ids.witHistoryInject]:[170,1500], [ids.witHistoryPrepare]:[450,1500], [ids.witHistoryPublish]:[790,1500]
    }
  }
];

for (const spec of editorGroups) {
  const nodeIds = [];
  for (const [nodeId, position] of Object.entries(spec.positions)) {
    const item = flows.find((candidate) => candidate.id === nodeId);
    if (!item) throw new Error(`Editorindeling mist node ${nodeId}.`);
    item.x = position[0];
    item.y = position[1];
    item.g = spec.id;
    nodeIds.push(nodeId);
  }
  flows.push({
    id:spec.id, type:'group', z:FLOW_ID, name:spec.name,
    style:{stroke:'#94a3b8','stroke-opacity':'1',fill:spec.color,'fill-opacity':'0.28',label:true,'label-position':'nw',color:'#334155'},
    nodes:nodeIds, x:spec.x, y:spec.y, w:spec.w, h:spec.h
  });
}

// Normaliseer oudere PV-dagtotalen naar configureerbare, neutrale rollen.
mapper.func = mapper.func.replace(
  /const pvSouthToday = sum\(\[[\s\S]*?const pvWestToday = value\('[^']+'\);/,
  `const pvSouthToday = value('sensor.pv_array_1_energy_today');
const pvEastToday = value('sensor.pv_array_2_energy_today');
const pvWestToday = value('sensor.pv_array_3_energy_today');`);
mapper.func = mapper.func.replace(
  /const siteSolarToday = value\('[^']+'\);\nconst actualSolarToday =/,
  `const siteSolarToday = value('sensor.site_solar_energy_today');
const actualSolarToday =`);
mapper.func = mapper.func
  .replace("climateZone('cooling-zone-1','Kantoor'", "climateZone('cooling-zone-1','Koelzone 1'")
  .replace("climateZone('cooling-zone-2','Zone 2'", "climateZone('cooling-zone-2','Koelzone 2'")
  .replace("climateZone('cooling-zone-3','Zone 3'", "climateZone('cooling-zone-3','Koelzone 3'")
  .replace("climateZone('cooling-zone-4','Zolder'", "climateZone('cooling-zone-4','Koelzone 4'");
mapper.func = mapper.func.replace(
  /function audiDashboardReading\(pattern\) \{[\s\S]*?\n\}\n\nfunction audiLockLabel/,
  `function audiDashboardReading(entityId) {
    const item = entity(entityId);
    return item ? { value:item.state, unit:String((item.attributes || {}).unit_of_measurement || '') } : null;
}

function audiLockLabel`);
mapper.func = mapper.func
  .replace('const audiLockReading = audiDashboardReading(/lock|vergrendel|door.?lock/);', "const audiLockReading = audiDashboardReading('lock.ev');")
  .replace('const audiTemperatureReading = audiDashboardReading(/temperature|temperatuur/);', "const audiTemperatureReading = audiDashboardReading('sensor.ev_temperature');");
mapper.func = mapper.func
  .replace("const audiTodayEnergy = chargerDayEnergy('Links');", "const audiTodayEnergy = chargerDayEnergy('sensor.ev_charger_energy_today');")
  .replace("const kiaTodayEnergy = chargerDayEnergy('1');", "const kiaTodayEnergy = chargerDayEnergy('sensor.ev_charger_2_energy_today');")
  .replace("const audiTodayEnergy = energyKwh(entity('sensor.ev_charger_energy_today'));", "const audiTodayEnergy = chargerDayEnergy('sensor.ev_charger_energy_today');")
  .replace("const kiaTodayEnergy = energyKwh(entity('sensor.ev_charger_2_energy_today'));", "const kiaTodayEnergy = chargerDayEnergy('sensor.ev_charger_2_energy_today');")
  .replace("const kiaPower = value('sensor.1_vermogen', 1000);", "const kiaPower = value('sensor.ev_charger_2_power');")
  .replace("status: chargeStatus('sensor.1_status')", "status: chargeStatus('sensor.ev_charger_2_status')");
if (!mapper.func.includes('function configuredFriendlyName(')) {
  mapper.func = mapper.func.replace(
    'function loadStatus(power) {',
    `function configuredFriendlyName(entityId, fallback) {
    const item = entity(entityId);
    const name = item && item.attributes ? String(item.attributes.friendly_name || '').trim() : '';
    return name || fallback;
}

function loadStatus(power) {`);
}
mapper.func = mapper.func
  .replace("{ name: 'Kantoor', power: officePower", "{ name: configuredFriendlyName('sensor.flex_load_2_power','Flexibele last 2'), power: officePower")
  .replace("{ name: 'Flexibele last 3', power: laundryPower", "{ name: configuredFriendlyName('sensor.flex_load_3_power','Flexibele last 3'), power: laundryPower")
  .replace("{ name: 'Warmtepomp', power: heatPumpPower", "{ name: configuredFriendlyName('sensor.flex_load_4_power','Flexibele last 4'), power: heatPumpPower")
  .replace("{ name: 'Airco kantoor', power: aircoOfficePower", "{ name: configuredFriendlyName('sensor.flex_load_5_power','Flexibele last 5'), power: aircoOfficePower")
  .replace("{ name: 'Airco zolder', power: aircoAtticPower", "{ name: configuredFriendlyName('sensor.flex_load_6_power','Flexibele last 6'), power: aircoAtticPower")
  .replace("{ name: 'Compressor', power: compressorPower", "{ name: configuredFriendlyName('switch.flex_load_1','Flexibele last 1'), power: compressorPower")
  .replace("{ name: 'Jacuzzi', power: jacuzziPower", "{ name: configuredFriendlyName('sensor.flex_load_7_power','Flexibele last 7'), power: jacuzziPower");
if (!mapper.func.includes('const configuredZoneName = configuredFriendlyName(entityId, name);')) {
  mapper.func = mapper.func.replace(
    'function climateZone(key, name, entityId, fallbackTemperatureIds, humidityEntityId, defaults) {\n    const item = entity(entityId);',
    'function climateZone(key, name, entityId, fallbackTemperatureIds, humidityEntityId, defaults) {\n    const item = entity(entityId);\n    const configuredZoneName = configuredFriendlyName(entityId, name);');
  mapper.func = mapper.func.replace('        key, name, entityId, available, active:', '        key, name:configuredZoneName, entityId, available, active:');
  mapper.func = mapper.func.replace(
    'function lightRoom(key, name, entityId) {\n    const item = entity(entityId);',
    'function lightRoom(key, name, entityId) {\n    const item = entity(entityId);\n    const configuredZoneName = configuredFriendlyName(entityId, name);');
  mapper.func = mapper.func.replace('    return { key, name, entityId, available, active, brightness, status:', '    return { key, name:configuredZoneName, entityId, available, active, brightness, status:');
}

// Houd generieke Growatt-rollen compatibel met oudere WIT-prefixen.
for (let index = 0; index < flows.length; index += 1) {
  const serialized = JSON.stringify(flows[index])
    .replaceAll('sensor.growatt_wit_', 'sensor.growatt_')
    .replaceAll('binary_sensor.growatt_wit_', 'binary_sensor.growatt_')
    .replaceAll('number.growatt_wit_', 'number.growatt_');
  flows[index] = JSON.parse(serialized);
}

// Iedere regelfunctie leest dezelfde lokale rolmapping. Daardoor kan de hele
// flow neutrale entiteitsnamen gebruiken terwijl de echte Home Assistant-ID's
// uitsluitend in het lokale, door Git genegeerde configuratiebestand staan.
const configAliasMarker = '// ESS configureerbare entiteitsrollen.';
const configAliasCode = `const rawStates = ha && ha.homeAssistant && ha.homeAssistant.states;
${configAliasMarker}
const essRuntimeConfig = flow.get('ess_system_config') || ${systemConfigJson};
const states = rawStates ? { ...rawStates } : rawStates;
if (states) {
    for (const [canonicalId, configuredId] of Object.entries(essRuntimeConfig.entities || {})) {
        if (configuredId && rawStates[configuredId]) states[canonicalId] = rawStates[configuredId];
    }
}`;
const configAliasCodeWithFallback = `const rawStates = ha && ha.homeAssistant ? ha.homeAssistant.states || {} : {};
${configAliasMarker}
const essRuntimeConfig = flow.get('ess_system_config') || ${systemConfigJson};
const states = { ...rawStates };
for (const [canonicalId, configuredId] of Object.entries(essRuntimeConfig.entities || {})) {
    if (configuredId && rawStates[configuredId]) states[canonicalId] = rawStates[configuredId];
}`;
for (const item of flows) {
  if (item.type !== 'function' || typeof item.func !== 'string' || item.func.includes(configAliasMarker)) continue;
  item.func = item.func
    .replace('const states = ha && ha.homeAssistant && ha.homeAssistant.states;', configAliasCode)
    .replace('const states = ha && ha.homeAssistant ? ha.homeAssistant.states || {} : {};', configAliasCodeWithFallback);

  // Centrale installatiegrenzen vervangen de vroegere vaste waarden. Iedere
  // waarde behoudt een veilige standaard wanneer een lokaal profiel ontbreekt.
  item.func = item.func
    .replace('const batteryCapacityKwh = 86;', "const batteryCapacityKwh = Number((flow.get('ess_system_config') || {}).specs?.evBatteryCapacityKwh) || 86;")
    .replace('const batteryCapacityKwh = 30;', "const batteryCapacityKwh = Number((flow.get('ess_system_config') || {}).specs?.batteryCapacityKwh) || 30;")
    .replace('const inverterRatedPowerW = 18000;', "const inverterRatedPowerW = (Number((flow.get('ess_system_config') || {}).specs?.inverterRatedPowerKw) || 18) * 1000;")
    .replace('const maximumBatteryPowerW = 8000;', "const maximumBatteryPowerW = (Number((flow.get('ess_system_config') || {}).specs?.maximumBatteryPowerKw) || 8) * 1000;")
    .replace('const gridImportBufferW = 200;', "const gridImportBufferW = Number((flow.get('ess_system_config') || {}).specs?.gridImportBufferW) || 200;")
    .replace('const maximumCurrent = 25;', "const maximumCurrent = Number((flow.get('ess_system_config') || {}).specs?.evMaximumCurrentA) || 25;")
    .replace('const netChargePowerKw = 10;', "const netChargePowerKw = Number((flow.get('ess_system_config') || {}).specs?.evGridChargePowerKw) || 10;");
}

const dashboardMapper = flows.find((item) => item.id === MAPPER_ID);
if (dashboardMapper && !dashboardMapper.func.includes('dashboard.configuration =')) {
  dashboardMapper.func = dashboardMapper.func.replace(
    "flow.set('ess_dashboard_live', dashboard);",
    `dashboard.configuration = {
    config:flow.get('ess_system_config') || ${systemConfigJson},
    status:flow.get('ess_system_config_status') || { valid:false, missing:['Configuratie nog niet gecontroleerd'] }
};
flow.set('ess_dashboard_live', dashboard);`);
}

fs.writeFileSync(flowPath, `${JSON.stringify(flows, null, 2)}\n`);
