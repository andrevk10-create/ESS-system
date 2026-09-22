// Deliberately separate from entity mappings and outside the Git project.
const FILE = '/config/node-red/ess-charging-preferences.json';
const BACKUP = '/config/node-red/ess-charging-preferences.backup.json';

function chargingPreferences(flow) {
    const s = flow.get('ess_audi_settings') || {};
    const soc = (v, fallback) => Number.isFinite(Number(v)) && Number(v) >= 20 && Number(v) <= 100 ? Number(v) : fallback;
    const choice = (v, choices, fallback) => choices.includes(v) ? v : fallback;
    const result = { version:1,
        ev:{ departureSoc:soc(s.departureSoc, 80), solarSoc:soc(s.solarSoc, 80),
            departureTime:/^([01]\d|2[0-3]):[0-5]\d$/.test(s.departureTime) ? s.departureTime : '06:00',
            enabled:flow.get('ess_audi_smart_enabled') !== false },
        wit:{ mode:choice(flow.get('ess_wit_grid_charge_mode'), ['auto','on','off'], 'auto'),
            targetSoc:soc(flow.get('ess_wit_grid_charge_target_soc'), 80),
            reserve:choice(flow.get('ess_wit_audi_buffer_mode'), ['eco','normal','audi'], 'normal'),
            exportMode:choice(flow.get('ess_wit_export_mode'), ['auto','on','off'], 'auto') }
    };
    if (flow.get('ess_climate_config')) result.climate = {config:flow.get('ess_climate_config'),ledger:flow.get('ess_climate_ledger') || {}};
    return result;
}

module.exports = function chargingPersistence(flows) {
    for (let i = flows.length - 1; i >= 0; i--) if (flows[i].id.startsWith('essprefs_')) flows.splice(i, 1);
    const get = id => flows.find(n => n.id === id);
    const guard = "if (flow.get('ess_charging_preferences_ready') === false) { node.status({fill:'yellow',shape:'ring',text:'Laadinstellingen worden hersteld'}); return null; }\n";
    for (const id of ['ess00000000000d','esswitgrid_ctrl1','esswitaudi_ctrl1','esswitexport_ctrl','essaudi_defaults1','ess00000000000c','esswitgrid_set01']) {
        const n = get(id);
        n.func = guard + n.func.replaceAll(guard, '');
    }
    const controls = [get('ess00000000000c'), get('esswitgrid_set01'),
        flows.find(n => n.name === 'Kies reserveprofiel EV-accubuffer'),
        flows.find(n => n.initialize && n.initialize.includes("flow.set('ess_wit_export_mode', 'auto')"))];
    // Defaults only fill missing fields; never overwrite settings on redeploy.
    for (const n of [...controls, get('ess00000000000d')]) {
        n.initialize = (n.initialize || '').replace(/flow\.set\('(ess_wit_grid_charge_mode|ess_wit_grid_charge_target_soc|ess_wit_audi_buffer_mode|ess_wit_export_mode|ess_audi_smart_enabled)', ([^;]+)\);/g,
            (all, key) => `if (flow.get('${key}') === undefined) ${all}`);
    }
    for (const n of controls) {
        n.func = guard + n.func.replaceAll(guard, '');
        if (!n.wires[0].includes('essprefs_save')) n.wires[0].push('essprefs_save');
    }
    const defaults = get('essaudi_defaults1');
    defaults.name = 'Herstel opgeslagen laadplanning';
    get('esswitgrid_set01').initialize = get('esswitgrid_set01').initialize
        .replace("mode:'auto', targetSoc:80, status:'Automatisch na herstart'", "mode:flow.get('ess_wit_grid_charge_mode'), targetSoc:flow.get('ess_wit_grid_charge_target_soc'), status:'Wacht op actuele metingen'");
    get('essaudi_defaults_inj').name = 'Herstel laadplanning bij opstart';
    for (const n of flows.filter(n => n.type === 'ui-template' && n.format)) {
        n.format = n.format.replaceAll('Na een herstart: Automatisch', 'Laadinstellingen blijven bewaard');
    }
    const mapper = get('ess00000000000a');
    const report = `// BEGIN CHARGING PREFERENCES HEALTH
const preferencesError = flow.get('ess_charging_preferences_error');
if (preferencesError) dashboard.alarms.push({level:'error',text:preferencesError});
// END CHARGING PREFERENCES HEALTH
`;
    mapper.func = mapper.func.replace(/\/\/ BEGIN CHARGING PREFERENCES HEALTH[\s\S]*?\/\/ END CHARGING PREFERENCES HEALTH\n/g, '');
    mapper.func = mapper.func.replace("flow.set('ess_dashboard_live', dashboard);", report + "flow.set('ess_dashboard_live', dashboard);");
    // The load completion invokes defaults explicitly; early HA events wait.
    const base = {z:'ess000000000001', x:600, y:1700};
    const fn = (id, name, func, wires, initialize = '') => ({...base,id,type:'function',name,func,outputs:wires.length,timeout:0,noerr:0,initialize,finalize:'',libs:[],wires});
    flows.push(
        {...base,id:'essprefs_inject',type:'inject',name:'Lees bewaarde laadinstellingen',props:[{p:'payload'}],payload:'',payloadType:'str',repeat:'',crontab:'',once:true,onceDelay:0.2,wires:[['essprefs_read']]},
        {...base,id:'essprefs_read',type:'file in',name:'Lees laadinstellingen buiten Git',filename:FILE,filenameType:'str',format:'utf8',chunk:false,sendError:false,encoding:'none',allProps:true,wires:[['essprefs_restore']]},
        {...base,id:'essprefs_backup_read',type:'file in',name:'Lees reservekopie laadinstellingen',filename:BACKUP,filenameType:'str',format:'utf8',chunk:false,sendError:false,encoding:'none',allProps:true,wires:[['essprefs_restore']]},
        {...base,id:'essprefs_read_error',type:'catch',name:'Vang leesfout laadinstellingen op',scope:['essprefs_read','essprefs_backup_read'],uncaught:false,wires:[['essprefs_restore']]},
        fn('essprefs_restore','Herstel laadvoorkeuren veilig', `${chargingPreferences.toString()}
if (flow.get('ess_charging_preferences_ready') === true) return null;
const backup = msg.filename === '${BACKUP}' || msg.error?.source?.id === 'essprefs_backup_read';
let saved;
let missing = false;
try {
    if (msg.error) throw new Error(msg.error.message || 'Leesfout');
    saved = JSON.parse(msg.payload);
    if (saved?.version !== 1 || !saved.ev || !saved.wit) throw new Error('Ongeldig laadinstellingenbestand');
    const candidate = {ess_audi_settings:saved.ev,ess_audi_smart_enabled:saved.ev.enabled,
        ess_wit_grid_charge_mode:saved.wit.mode,ess_wit_grid_charge_target_soc:saved.wit.targetSoc,
        ess_wit_audi_buffer_mode:saved.wit.reserve,ess_wit_export_mode:saved.wit.exportMode};
    const normalized = chargingPreferences({get:key=>candidate[key]});
    if (!['ev','wit'].every(group => Object.entries(normalized[group]).every(([key,value]) => saved[group][key] === value))) throw new Error('Ongeldige laadvoorkeuren');
    for (const [key,value] of Object.entries(candidate)) flow.set(key,value);
} catch (error) {
    missing = /ENOENT/.test(error.message);
    if (!backup) { flow.set('ess_charging_primary_missing', missing); return [null, {}]; }
    if (!missing || flow.get('ess_charging_primary_missing') !== true) {
        flow.set('ess_charging_preferences_error', 'Laadinstellingen niet leesbaar; automatische regeling wacht. Herstel het lokale voorkeurenbestand.');
        node.error('Laadinstellingen niet leesbaar; automatische regeling wacht. Herstel het lokale voorkeurenbestand.');
        return null;
    }
    // First installation: migrate in-memory choices, do not replace them.
}
flow.set('ess_charging_preferences_ready', true);
flow.set('ess_charging_preferences_error', null);
flow.set('ess_audi_force_full', false);
return [{topic:'ess/audi/apply-defaults'}, null];`, [['essaudi_defaults1','essprefs_save'],['essprefs_backup_read']], "flow.set('ess_charging_preferences_ready', false);"),
        fn('essprefs_save','Bewaar alleen laadvoorkeuren', `${chargingPreferences.toString()}
if (flow.get('ess_charging_preferences_ready') !== true) return null;
return {payload:JSON.stringify(chargingPreferences(flow))};`, [['essprefs_write']]),
        {...base,id:'essprefs_write',type:'file',name:'Bewaar laadinstellingen buiten Git',filename:FILE,filenameType:'str',appendNewline:false,createDir:true,overwriteFile:'true',encoding:'none',wires:[['essprefs_backup_write']]},
        {...base,id:'essprefs_backup_write',type:'file',name:'Bewaar reservekopie laadinstellingen',filename:BACKUP,filenameType:'str',appendNewline:false,createDir:true,overwriteFile:'true',encoding:'none',wires:[['essprefs_saved']]},
        fn('essprefs_saved','Bevestig opgeslagen laadinstellingen', "flow.set('ess_charging_preferences_error', null); return null;", []),
        {...base,id:'essprefs_write_error',type:'catch',name:'Meld niet bewaarde laadinstellingen',scope:['essprefs_write','essprefs_backup_write'],uncaught:false,wires:[['essprefs_warn']]},
        fn('essprefs_warn','Waarschuw bij opslagfout', "flow.set('ess_charging_preferences_error', 'Laadinstellingen niet opgeslagen op schijf; controleer schrijfrechten en vrije ruimte.'); node.error('Laadinstellingen niet opgeslagen op schijf; controleer schrijfrechten en vrije ruimte.'); return null;", [])
    );
};
module.exports.chargingPreferences = chargingPreferences;
