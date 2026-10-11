function configurationAudit(states,entities) {
    return Object.entries(entities||{}).map(([role,entity])=>{
        const e=states[entity], unavailable=!e||['unknown','unavailable',''].includes(String(e.state).toLowerCase());
        return {role,entity:entity||null,name:e?.attributes?.friendly_name||role,unit:e?.attributes?.unit_of_measurement||'',
            status:!entity?'Niet gekoppeld':unavailable?'Geen bruikbare waarde':'Beschikbaar'};
    });
}
function consumerMeterInventory(states,entities) {
    const mapped=new Set(Object.values(entities||{}));
    return Object.entries(states||{}).filter(([id,e])=>id.startsWith('sensor.')&&!mapped.has(id)&&e.attributes?.device_class==='power'&&
        /^(?:w|kw)$/i.test(e.attributes.unit_of_measurement||'')&&
        !/(?:pv|solar|zonne|growatt|grid|p1_meter|accu|battery|productie|production|reactief|reactive|fase|phase|netvermogen|gevraagd|audi|ess_|import|export|total|totaal)/i.test(id+' '+(e.attributes.friendly_name||'')))
        .map(([id,e])=>{
            const raw=['unknown','unavailable',''].includes(String(e.state).toLowerCase())?null:Number(e.state);
            const power=raw!==null&&Number.isFinite(raw)?raw*(String(e.attributes.unit_of_measurement).toLowerCase()==='kw'?1000:1):null;
            return {entity:id,name:e.attributes.friendly_name||id,power};
        });
}
function apply(flows) {
    const mapper=flows.find(n=>n.id==='ess00000000000a');
    mapper.func=mapper.func.replace(/function configurationAudit\(states,entities\) \{[\s\S]*?dashboard\.wit\.batteryLimits=[^\n]*\n/g,'');
    const pos=mapper.func.lastIndexOf("flow.set('ess_dashboard_live', dashboard);");
    mapper.func=mapper.func.slice(0,pos)+configurationAudit.toString()+'\n'+consumerMeterInventory.toString()+`\ndashboard.configuration.audit=configurationAudit(rawStates,essRuntimeConfig.entities);
dashboard.configuration.consumerMeters=consumerMeterInventory(rawStates,essRuntimeConfig.entities);
const nativeBatteryLimits=flow.get('ess_wit_battery_limits');
dashboard.wit.batteryLimits=nativeBatteryLimits&&nativeBatteryLimits.remoteEntity===essRuntimeConfig.entities?.['select.growatt_grid_remote_power_control_enable']&&Date.now()-nativeBatteryLimits.at>=0&&Date.now()-nativeBatteryLimits.at<=120000?nativeBatteryLimits:null;
`+mapper.func.slice(pos);
    const battery=flows.find(n=>n.id==='esstpl_battery01');
    battery.format=battery.format.replace('</nav>',`</nav><details class="panel"><summary>Accugrenzen rechtstreeks via Modbus</summary><div v-if="d.wit&&d.wit.batteryLimits"><p>Toegestaan laadvermogen: {{(d.wit.batteryLimits.chargePowerW/1000).toFixed(1)}} kW · toegestaan ontlaadvermogen: {{(d.wit.batteryLimits.dischargePowerW/1000).toFixed(1)}} kW</p><p>Ingestelde laadstroom: {{d.wit.batteryLimits.chargeCurrentA}} A · ingestelde ontlaadstroom: {{d.wit.batteryLimits.dischargeCurrentA}} A</p><small>Actuele, aan deze WIT gekoppelde registerterugmelding. De stroominstelling is niet hetzelfde als een door de BMS toegestane stroom.</small></div><p v-else>Geen actuele Modbus-terugmelding van de accugrenzen.</p></details>`);
    const ui=flows.find(n=>n.id==='esstpl_config001');
    const loads=flows.find(n=>n.id==='esstpl_loads0001');
    if(loads) loads.format=loads.format.replace('</nav>',`</nav><details v-if="d.configuration&&d.configuration.consumerMeters&&d.configuration.consumerMeters.length" class="panel"><summary>Overige vermogensmetingen · {{d.configuration.consumerMeters.length}}</summary><p>Beschikbare metingen buiten de ingestelde verbruikersrollen. Een apparaat kan meerdere meters hebben; deze waarden worden niet extra bij het woningverbruik opgeteld.</p><div class="plan-card" v-for="m in d.configuration.consumerMeters" :key="m.entity"><b>{{m.name}}</b><span>{{power(m.power)}}</span><small>{{m.entity}}</small></div></details>`);
    ui.format=ui.format.replace('</nav>',`</nav><details v-if="d.configuration&&d.configuration.audit" class="panel"><summary>Controle van alle koppelingen · {{d.configuration.audit.filter(r=>r.status!=='Beschikbaar').length}} zonder bruikbare waarde</summary><p>Ook optionele rollen staan hieronder. Niet gekoppeld betekent dat de bron nog gekozen moet worden of niet aanwezig is. Geen bruikbare waarde betekent dat de gekoppelde HA-entiteit ontbreekt, onbekend of niet beschikbaar is.</p><div class="plan-card" v-for="r in d.configuration.audit.filter(r=>r.status!=='Beschikbaar')" :key="r.role"><b>{{r.role}}</b><span>{{r.status}}</span><small>{{r.entity||'Geen entiteit gekozen'}}</small></div></details>`);
    const config=flows.find(n=>n.id==='essconfig_control');
    config.func=config.func.replace('(?:warmtepomp|heat.?pump)/.test(entry.text)?10:0','(?:warmtepomp|heat.?pump|eco.heating.system)/.test(entry.text)?10:0');
    config.func=config.func.replace('laundry|wasmachine|droger|wassen','laundry|wasmachine|droger|wassen|wasplein').replace('jacuzzi|spa','jacuzzi|jaccuzi|spa');
    config.func=config.func.replace('(?:total|totaal|grid|net|battery|accu|solar|pv)/.test(entry.text)','(?:total|totaal|grid|net|battery|accu|solar|pv|fase|phase|reactief|reactive|productie)/.test(entry.text)');
    const marker='    // Losse PV-omvormers';
    // Match daily yield to the already configured power meter; never map a
    // forecast, lifetime counter or another inverter's meter to this role.
    const code=`    for(let i=1;i<=3;i++) {
        const power=byId.get(config.entities['sensor.pv_array_'+i+'_power']);
        if(!power) continue;
        const stem=power.id.replace(/^sensor\\./,'').replace(/_(?:uitgangsvermogen|output_power|power)$/,'');
        const daily=entries.filter(e=>e.domain==='sensor'&&e.id.startsWith('sensor.'+stem+'_')&&
            /^(?:kwh|wh)$/i.test(e.attributes.unit_of_measurement||'')&&
            /(?:energie_opgewekt_vandaag|energy_today)$/.test(e.id)&&available(e));
        if(daily.length===1) assign('sensor.pv_array_'+i+'_energy_today',daily[0].id,'pv-daily-sibling');
    }
`;
    // Append after PV power discovery, immediately before returning proposals.
    const end=config.func.indexOf('return { config, discovery:');
    if(end>=0) config.func=config.func.slice(0,end)+code+config.func.slice(end);
}
module.exports={configurationAudit,consumerMeterInventory,apply};
