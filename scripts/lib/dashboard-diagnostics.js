// These pure helpers are embedded in the generated Node-RED / Vue code.
// Never persist installation-specific IDs in the public flow.
function resolveNasMappings(states, entities, options = {}) {
    const cpuRole = 'sensor.nas_cpu_gebruik_totaal';
    const text = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const entries = Object.entries(states || {}).map(([id, item]) => ({
        id, domain:id.split('.')[0], stem:id.split('.')[1],
        text:text(id + ' ' + (item.attributes || {}).friendly_name),
        unit:text((item.attributes || {}).unit_of_measurement)
    }));
    const byId = new Map(entries.map(entry => [entry.id, entry]));
    const assigned = { ...entities };
    const result = {};
    const canFill = role => !assigned[role] || assigned[role] === role && !byId.has(role);
    let nasCpu = byId.get(assigned[cpuRole]);
    if (!nasCpu && !options.requireAnchor && canFill(cpuRole)) {
        const candidates = entries.filter(entry => entry.domain === 'sensor' && entry.unit === '%' &&
            /nas|synology|dsm/.test(entry.text) && /cpu|processor/.test(entry.text) && /total|totaal|usage|gebruik/.test(entry.text));
        if (candidates.length === 1) nasCpu = candidates[0];
    }
    if (!nasCpu || nasCpu.domain !== 'sensor') return result;
    const marker = nasCpu.stem.search(/_(?:cpu|processor)/);
    if (marker <= 0) return result;
    const prefix = nasCpu.stem.slice(0, marker) + '_';
    // A second NAS with a longer name must not become a sibling of this NAS.
    const siblings = entries.filter(entry => entry.stem.startsWith(prefix) &&
        /^(?:cpu|processor|memory|geheugen|temperature|temperatuur|system|systeem|download|upload|network|receive|send|drive|disk|schijf|volume|security|beveilig|dsm|update|fan|ventilator)/.test(entry.stem.slice(prefix.length)));
    const fill = (role, candidates) => {
        if (!canFill(role) || candidates.length !== 1) return;
        const id = candidates[0].id;
        if (Object.entries(assigned).some(([other, actual]) => other !== role && actual === id)) return;
        assigned[role] = result[role] = id;
    };
    if (!options.displayOnly) fill(cpuRole, [nasCpu]);
    const rules = [
        ['sensor.nas_geheugengebruik_fysiek', /memory|geheugen/, entry => entry.unit === '%' && !/swap|free|available|beschikbaar|vrij/.test(entry.text)],
        ['sensor.nas_temperatuur', /temperature|temperatuur/, entry => !/drive|disk|schijf|volume/.test(entry.text)],
        ['sensor.nas_download_doorvoer', /download|receive|ontvang/],
        ['sensor.nas_upload_doorvoer', /upload|send|verzend/],
        ['sensor.nas_drive_2_status', /(?:drive|disk|schijf).*?(?:status|health|gezondheid)/],
        ['sensor.nas_volume_1_status', /volume.*?(?:status|health|gezondheid)/],
        ['sensor.nas_volume_1_gebruikte_ruimte', /volume.*?(?:used|gebruik).*?(?:space|ruimte)/, entry => entry.unit === 'tb'],
        ['binary_sensor.nas_beveiligingsstatus', /security|beveilig/],
        ['update.nas_dsm_update', /dsm|system|systeem|firmware|update/],
        ['select.nas_fan_speed_mode', /fan|ventilator/]
    ];
    for (const [role, pattern, predicate] of rules) {
        if (options.displayOnly && role !== 'sensor.nas_geheugengebruik_fysiek') continue;
        fill(role, siblings.filter(entry => entry.domain === role.split('.')[0] && pattern.test(entry.text) && (!predicate || predicate(entry))));
    }
    // Disk and volume readings follow the already selected status entity, not
    // the first disk/volume in alphabetical order. Ambiguity remains unmapped.
    const scoped = (roles, pattern) => {
        const anchors = roles.map(role => assigned[role]).filter(Boolean).map(id => byId.get(id)).filter(Boolean);
        const roots = [...new Set(anchors.map(entry => (entry.stem.match(pattern) || [])[0]).filter(Boolean))];
        return roots.length === 1 && roots[0].startsWith(prefix)
            ? siblings.filter(entry => entry.stem.startsWith(roots[0] + '_')) : [];
    };
    const disks = scoped(['sensor.nas_drive_2_status'], /^.*_(?:drive|disk|schijf)_\d+/);
    const volumes = scoped(['sensor.nas_volume_1_status','sensor.nas_volume_1_gebruikte_ruimte'], /^.*_volume_\d+/);
    fill('sensor.nas_drive_2_temperatuur', disks.filter(entry => entry.domain === 'sensor' && /temperature|temperatuur/.test(entry.text) && /°c|celsius/.test(entry.unit)));
    fill('sensor.nas_volume_1_volume_gebruikt', volumes.filter(entry => entry.domain === 'sensor' && entry.unit === '%' && /used|gebruik/.test(entry.text)));
    if (!options.displayOnly) {
        fill('binary_sensor.nas_drive_2_maximum_slechte_sectoren_overschreden', disks.filter(entry => entry.domain === 'binary_sensor' && /bad.*sector|slechte.*sector/.test(entry.text)));
        fill('binary_sensor.nas_drive_2_onder_de_minimale_resterende_levensduur', disks.filter(entry => entry.domain === 'binary_sensor' && /remaining.*life|resterende.*levensduur/.test(entry.text)));
    }
    return result;
}

function dashboardHealth(d, modules, stale, updated) {
    const present = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
    const missing = [];
    if (modules.energy !== false) {
        if (!present(d.grid && d.grid.power)) missing.push('net');
        if (!present(d.solar && d.solar.power)) missing.push('zon');
    }
    if (modules.battery !== false && !present(d.battery && d.battery.soc)) missing.push('accu');
    const climate = d.climate || {};
    const zones = [...(climate.aircos || []), ...(climate.tado || []), climate.heatPump, climate.hotWater]
        .filter(item => item && item.configured !== false);
    const offline = zones.filter(item => !item.available);
    const unlinked = Number(climate.unmappedCount) || 0;
    const smart = d.audiSmart || {}, nas = d.nas || {}, runtime = d.wit && d.wit.runtime || {};
    const checks = [{key:'data', title:'Meetdata', level:stale?'error':'ok', icon:'mdi-clock-check-outline',
        detail:stale?'Geen actuele update; controleer Home Assistant en Node-RED':'Actueel om '+updated}];
    if (modules.energy !== false && !stale && !runtime.p1Fresh) {
        checks[0] = {...checks[0], level:'warn', detail:'Dashboard bereikbaar; P1-brondata ontbreekt of is te oud'};
    }
    if (modules.energy !== false || modules.battery !== false) checks.push({key:'core', title:'Kernmetingen', level:missing.length?'error':'ok', icon:'mdi-access-point-check',
        detail:missing.length?'Ontbreekt: '+missing.join(', '):'Ingeschakelde kernmetingen beschikbaar'});
    if (modules.ev !== false) checks.push({key:'charging', title:'EV-laadregeling', level:smart.enabled&&smart.scheduleComplete===false?'warn':'ok', icon:'mdi-ev-station',
        detail:smart.enabled?(smart.scheduleComplete===false?'Planning is nog niet compleet':smart.status||'Regeling actief'):'Slim laden staat uit'});
    if (modules.climate !== false) checks.push({key:'climate', title:'Klimaat', icon:'mdi-home-thermometer-outline',
        level:offline.length===zones.length&&zones.length?'error':offline.length||unlinked||!zones.length?'warn':'ok',
        detail:(zones.length ? (zones.length-offline.length)+' van '+zones.length+' gekoppelde zones beschikbaar' : 'Geen klimaatzones gekoppeld') +
            (offline.length ? ' · Niet beschikbaar: '+offline.map(item=>item.name||'Zone').join(', ')+'. Controleer de integratie in Home Assistant.' : '') +
            (unlinked ? ' · '+unlinked+' niet gekoppeld; controleer Configuratie' : '')});
    if (modules.nas !== false) checks.push({key:'nas', title:'Synology NAS', level:!nas.available?'warn':nas.ok?'ok':(nas.issues||[]).some(item=>item.level==='error')?'error':'warn', icon:'mdi-nas',
        detail:nas.available?nas.summary||'NAS beschikbaar':'NAS niet beschikbaar'});
    if (modules.battery !== false) checks.push({key:'wit', title:'WIT-regeling', level:runtime.level||'warn', icon:'mdi-battery-alert-variant-outline', detail:runtime.status||'Wacht op regeldata'});
    if (modules.ev !== false || modules.battery !== false) checks.push({key:'prices', title:'Stroomprijzen', level:runtime.pricesFresh?'ok':'error', icon:'mdi-currency-eur',
        detail:runtime.pricesFresh?'Recente prijzen beschikbaar':'Geen recente prijsgegevens; automatisch netladen geblokkeerd'});
    return checks;
}

function dashboardAlerts(d, checks, modules) {
    const alerts = [], seen = new Set();
    const add = (level, text) => {
        if (!text || seen.has(text)) return;
        seen.add(text);
        alerts.push({level:level==='error'?'error':'warning', text});
    };
    for (const item of d.alarms || []) {
        if (item.module && modules[item.module] === false) continue;
        add(item.level, item.text || (typeof item === 'string' ? item : ''));
    }
    for (const check of checks) {
        if (check.level === 'ok' || seen.has(check.detail)) continue;
        // A NAS issue already contains the exact reason; don't repeat its count.
        if (check.key === 'nas' && modules.nas !== false && (d.nas && d.nas.issues || []).some(item=>seen.has(item.text))) continue;
        add(check.level, check.title+': '+check.detail);
    }
    return alerts.sort((left, right)=>(left.level==='error'?0:1)-(right.level==='error'?0:1));
}

function apply(flows) {
    const mapper = flows.find(item => item.id === 'ess00000000000a');
    mapper.func = mapper.func
        .replace(/\/\/ BEGIN DASHBOARD NAS FALLBACK[\s\S]*?\/\/ END DASHBOARD NAS FALLBACK\n/g, '')
        .replace(/\/\/ BEGIN DASHBOARD DIAGNOSTICS[\s\S]*?\/\/ END DASHBOARD DIAGNOSTICS\n/g, '');
    // Read-only fallbacks run again when HA reconnects. No actuator mapping or
    // saved profile is changed and no new NAS is chosen without a saved anchor.
    const fallback = `// BEGIN DASHBOARD NAS FALLBACK
${resolveNasMappings.toString()}
if ((essRuntimeConfig.modules || {}).nas === true) {
    const readings = resolveNasMappings(rawStates, essRuntimeConfig.entities || {}, {requireAnchor:true, displayOnly:true});
    for (const [role, actual] of Object.entries(readings)) states[role] = rawStates[actual];
}
// END DASHBOARD NAS FALLBACK
`;
    if (!mapper.func.includes('function entity(id) {')) throw new Error('Dashboard entity helper not found');
    mapper.func = mapper.func.replace('function entity(id) {', fallback+'function entity(id) {');
    mapper.func = mapper.func.replace('for (const issue of nasStatus.issues || []) alarms.push(issue);',
        "for (const issue of nasStatus.issues || []) alarms.push({...issue, module:'nas'});");
    const suffix = `// BEGIN DASHBOARD DIAGNOSTICS
const climateRoles = Object.entries(essRuntimeConfig.entities || {}).filter(([role]) => role.startsWith('climate.') || role.startsWith('water_heater.'));
const mappedClimateIds = new Set(climateRoles.map(([, actual]) => actual).filter(Boolean));
for (const zone of [...dashboard.climate.aircos, ...dashboard.climate.tado, dashboard.climate.heatPump, dashboard.climate.hotWater].filter(Boolean)) {
    const actual = (essRuntimeConfig.entities || {})[zone.entityId];
    zone.configured = Boolean(actual && (actual !== zone.entityId || rawStates[actual]));
    if (!zone.configured) {
        zone.available = false;
        zone.active = false;
        zone.status = 'Niet gekoppeld · Configuratie';
        zone.modeLabel = 'Niet gekoppeld';
    }
}
dashboard.climate.unmappedCount = Object.keys(rawStates).filter(id =>
    (id.startsWith('climate.') || id.startsWith('water_heater.')) && !mappedClimateIds.has(id)).length;
dashboard.nas.missingReadings = ['cpu','memory','temperature'].filter(key => dashboard.nas[key] == null);
if (dashboard.nas.drive.temperature == null) dashboard.nas.missingReadings.push('driveTemperature');
if (dashboard.nas.volume.usedPercent == null) dashboard.nas.missingReadings.push('volumeUsedPercent');
if (dashboard.nas.available && dashboard.nas.ok && dashboard.nas.missingReadings.length) {
    dashboard.nas.ok = false;
    dashboard.nas.summary = dashboard.nas.missingReadings.length+' meting(en) ontbreken; controleer de NAS-koppelingen';
}
if (dashboard.nas.drive.status == null) {
    dashboard.nas.drive.ok = false;
    dashboard.nas.drive.healthLabel = 'Onbekend';
}
// END DASHBOARD DIAGNOSTICS
`;
    const position = mapper.func.lastIndexOf("flow.set('ess_dashboard_live', dashboard);");
    if (position < 0) throw new Error('Dashboard return not found');
    mapper.func = mapper.func.slice(0, position)+suffix+mapper.func.slice(position);
    for (const item of flows.filter(item => item.type === 'ui-template' && item.format)) {
        item.format = item.format.replace(/healthChecks\(\)\{[\s\S]*?\},\n    healthOkCount/,
            `healthChecks(){return (${dashboardHealth.toString()})(this.d||{},this.modules||{},this.stale,this.updated)},
    activeAlerts(){return (${dashboardAlerts.toString()})(this.d||{},this.healthChecks,this.modules||{})},
    healthOkCount`);
        item.format = item.format.replaceAll('(d.alarms||[]).length', 'activeAlerts.length')
            .replaceAll('d.alarms.length', 'activeAlerts.length')
            .replaceAll('d.alarms[0]', 'activeAlerts[0]')
            .replaceAll('in d.alarms"', 'in activeAlerts"');
    }
}

module.exports = { resolveNasMappings, dashboardHealth, dashboardAlerts, apply };
