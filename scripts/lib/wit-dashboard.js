function witHealthModel(states, flow, now) {
    const numeric = v => v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v);
    const fresh = (id, maxAge) => {
        const item = states[id];
        const age = now - new Date(item && (item.last_reported || item.last_updated || item.last_changed) || 0).getTime();
        return !!item && !['unknown', 'unavailable', ''].includes(String(item.state).toLowerCase()) && age >= -60000 && age <= maxAge;
    };
    const grid = flow.get('ess_wit_grid_charge_status') || {};
    const ev = flow.get('ess_wit_audi_discharge_status') || {};
    const fault = flow.get('ess_wit_command_fault');
    const current = s => now - new Date(s.updatedAt || 0).getTime() <= 150000;
    const observed = states['sensor.growatt_battery_battery_power'];
    const raw = observed && numeric(observed.state);
    const measured = fresh('sensor.growatt_battery_battery_power', 120000) && raw !== null
        ? raw * (Number(flow.get('ess_growatt_battery_power_scale')) === 0.1 ? 0.1 : 1) : null;
    const active = current(grid) && grid.sessionOwned ? grid : current(ev) && ev.sessionOwned ? ev : null;
    const telemetryFresh = measured !== null;
    const p1Fresh = fresh('sensor.p1_meter_vermogen', 15000);
    const priceMeta = flow.get('ess_nordpool_forecast_meta') || {};
    const prices = flow.get('ess_nordpool_forecast') || [];
    const priceAge = now - new Date(priceMeta.updatedAt || 0).getTime();
    const pricesFresh = priceAge >= -60000 && priceAge <= 36 * 3600000 &&
        prices.some(s => new Date(s.end).getTime() > now && numeric(s.allInPrice) !== null);
    const blocked = [grid, ev].find(s => current(s) && /ontbreekt|te oud|niet beschikbaar|ongeldig/.test(s.status || ''));
    const problem = fault ? 'WIT reageert niet na herstelpoging; tijdelijke regeling geblokkeerd. Controleer BMS/Modbus en bevestig de stand opnieuw.' :
        !telemetryFresh ? 'WIT-meetdata ontbreekt of is te oud; controleer Modbus' :
        !p1Fresh ? 'P1-meetdata ontbreekt of is te oud' :
        active && !active.powerConfirmed ? 'Opdracht verstuurd; accuvermogen nog niet bevestigd' :
        !current(grid) || !current(ev) ? 'WIT-regelaar heeft geen recente update' : blocked ? blocked.status : null;
    return {
        telemetryFresh, p1Fresh, pricesFresh, measuredPowerW:measured,
        requestedPowerW:active ? numeric(active.requestedPowerW) : 0,
        commandConfirmed:!!active && active.commandConfirmed === true,
        powerConfirmed:!!active && active.powerConfirmed === true,
        direction:active === grid ? 'Laden' : active === ev ? 'Ontladen' : 'Normale regeling',
        status:problem || (active ? 'Accuvermogen gemeten; dit bewijst niet de volledige vermogensvraag' : 'Geen tijdelijke WIT-opdracht actief'),
        level:problem ? (!telemetryFresh || !p1Fresh ? 'error' : 'warn') : 'ok',
        forecastWindow:grid.forecastWindow || 'Komende 24 uur',
        forecastDate:grid.forecastDate || null,
        houseReserveKwh:numeric(ev.houseReserveKwh),
        batteryRechargeTargetSoc:numeric(ev.batteryRechargeTargetSoc),
        safetyFloorSoc:numeric(ev.safetyFloorSoc),
        exportStatus:String((flow.get('ess_wit_export_status') || {}).status || '')
    };
}

module.exports = function improveWitDashboard(flows) {
    const mapper = flows.find(n => n.id === 'ess00000000000a');
    // Rebuild this isolated suffix on every run; never duplicate generated code.
    mapper.func = mapper.func.replace(/\/\/ BEGIN WIT HEALTH[\s\S]*?\/\/ END WIT HEALTH\n/g, '');
    const insert = `// BEGIN WIT HEALTH
${witHealthModel.toString()}
dashboard.wit.runtime = witHealthModel(states, flow, Date.now());
if ((dashboard.configuration.config.modules || {}).battery !== false && dashboard.wit.runtime.level !== 'ok') {
    dashboard.alarms.push({level:dashboard.wit.runtime.level === 'error' ? 'error' : 'warning', text:dashboard.wit.runtime.status});
}
for (const field of ['currentStoredKwh','expectedHouseKwh','expectedSolarChargeKwh','gridEnergyNeededKwh','plannedCost']) {
    const source = (flow.get('ess_wit_grid_charge_status') || {})[field];
    if (source === null || source === undefined || source === '') dashboard.wit.gridCharge[field] = null;
}
// END WIT HEALTH
`;
    const position = mapper.func.lastIndexOf("flow.set('ess_dashboard_live', dashboard);");
    if (position < 0) throw new Error('Dashboard return not found');
    mapper.func = mapper.func.slice(0, position) + insert + mapper.func.slice(position);
    for (const n of flows.filter(n => n.type === 'ui-template')) {
        if (!n.format) continue;
        n.format = n.format.replaceAll('const n=Number(v);', "const n=v===null||v===undefined||v===''?NaN:Number(v);")
            .replaceAll('const v=Number(this.d.battery&&this.d.battery.soc);', "const raw=this.d.battery&&this.d.battery.soc;const v=raw==null?NaN:Number(raw);")
            .replaceAll('const v=Number(this.d.grid&&this.d.grid.power);', "const raw=this.d.grid&&this.d.grid.power;const v=raw==null?NaN:Number(raw);");
        n.format = n.format.replace("scheduledNow?'Nu actief'", "scheduledNow?'Nu gepland'");
        n.format = n.format.replace('<article class="panel span-12"><div class="panel-head"><b>Synology NAS', '<article class="panel span-12" v-if="modules.nas!==false"><div class="panel-head"><b>Synology NAS');
        n.format = n.format.replace("maximumBatteryPowerKw:'Maximaal accu-P (kW)'", "maximumBatteryPowerKw:'Maximaal ontladen (kW)',maximumBatteryChargePowerKw:'Maximaal netladen (kW)'");
        n.format = n.format.replace(/healthChecks\(\)\{([\s\S]*?)\},\n    healthOkCount/, (_, body) => {
            body = body.replace('return [', 'const checks = [');
            return `healthChecks(){${body};const runtime=d.wit&&d.wit.runtime||{};const modules=this.modules;
            return checks.filter(item=>!((item.key==='climate'&&modules.climate===false)||(item.key==='nas'&&modules.nas===false)||(item.key==='charging'&&modules.ev===false)))
            .map(item=>item.key==='data'&&!runtime.p1Fresh?{...item,level:'warn',detail:'Dashboard bereikbaar; P1-brondata ontbreekt of is te oud'}:item)
            .concat(modules.battery===false?[]:[{key:'wit',title:'WIT-regeling',level:runtime.level||'warn',icon:'mdi-battery-alert-variant-outline',detail:runtime.status||'Wacht op regeldata'}])
            .concat([{key:'prices',title:'Stroomprijzen',level:runtime.pricesFresh?'ok':'error',icon:'mdi-currency-eur',detail:runtime.pricesFresh?'Recente prijzen beschikbaar':'Geen recente prijsgegevens; automatisch netladen geblokkeerd'}])},\n    healthOkCount`;
        });
        if (!n.format.includes('<b>WIT slim netladen</b>')) continue;
        n.format = n.format.replace('.battery-hero{', '.battery-hero>div:last-child{min-width:0}.battery-hero .notice span{white-space:normal;overflow-wrap:anywhere}.battery-hero{')
            .replace(/\.plan-grid\{display:grid;grid-template-columns:[^;]+;/, '.plan-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));');
        n.format = n.format.replace(/\{\{\(d.wit&&d.wit.audiBufferMode\)==='eco'\?'14 kWh woning[^}]*\}\}/,
            "{{energy(d.wit&&d.wit.runtime&&d.wit.runtime.houseReserveKwh)}} woningreserve · accu naar {{percent(d.wit&&d.wit.runtime&&d.wit.runtime.batteryRechargeTargetSoc)}} · minimaal {{percent(d.wit&&d.wit.runtime&&d.wit.runtime.safetyFloorSoc)}} SOC");
        const panel = `<article class="panel span-12"><div class="panel-head"><b>WIT: opdracht en meting</b><span>{{d.wit&&d.wit.runtime&&d.wit.runtime.direction}}</span></div>
<div class="plan-grid"><div class="plan-card"><span>GEVRAAGD VERMOGEN</span><b>{{power(d.wit&&d.wit.runtime&&d.wit.runtime.requestedPowerW)}}</b><small>Geen bewijs van werkelijk laden</small></div>
<div class="plan-card"><span>WERKELIJK ACCUVERMOGEN</span><b>{{power(d.wit&&d.wit.runtime&&d.wit.runtime.measuredPowerW)}}</b><small>+ laden · − ontladen</small></div>
<div class="plan-card"><span>CONTROLE</span><b>{{d.wit&&d.wit.runtime&&d.wit.runtime.powerConfirmed?'Accuvermogen gemeten':'Niet bevestigd'}}</b><small>{{d.wit&&d.wit.runtime&&d.wit.runtime.status}}</small></div>
<div class="plan-card"><span>PROGNOSEVENSTER</span><b>{{d.wit&&d.wit.runtime&&d.wit.runtime.forecastWindow}}</b><small>Na middernacht telt de komende ochtend mee</small></div></div></article>\n`;
        n.format = n.format.replace('    <article class="panel span-12"><div class="panel-head"><b>Reserveprofiel', panel + '    <article class="panel span-12"><div class="panel-head"><b>Reserveprofiel');
    }
};

module.exports.witHealthModel = witHealthModel;
