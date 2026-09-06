const fs = require('node:fs');
const path = require('node:path');

const pages = [
    ['ess000000000004','overzicht','Overzicht','mdi-view-dashboard-outline',''],
    ['esstpl_energy001','energie','Zon & net','mdi-solar-power','energy'],
    ['esstpl_battery01','accu','Accu','mdi-battery-charging-70','battery'],
    ['esstpl_ev0000001','autos','Auto','mdi-car-electric','ev'],
    ['esstpl_loads0001','verbruikers','Verbruikers','mdi-home-lightning-bolt-outline','loads'],
    ['esstpl_lights001','verlichting','Verlichting','mdi-lightbulb-outline','lighting'],
    ['esstpl_climate01','klimaat','Klimaat','mdi-home-thermometer-outline','climate'],
    ['esstpl_system001','systeem','Systeem','mdi-shield-check-outline',''],
    ['esstpl_config001','configuratie','Configuratie','mdi-tune-variant','']
];

function numberOrNull(value) {
    return value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
}

function planView(d, now) {
    const num = value => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
    const quarter = 900000, start = Math.floor(now / quarter) * quarter;
    const read = slots => (Array.isArray(slots) ? slots : []).map(slot => ({...slot,
        a:new Date(slot.start).getTime(), b:new Date(slot.end).getTime()
    })).filter(slot => Number.isFinite(slot.a) && slot.b > slot.a && slot.b > now && slot.a < start + 96 * quarter);
    const ev = read((d.audiSmart || {}).selectedSlots);
    const wit = read((d.wit && d.wit.gridCharge || {}).selectedSlots);
    const prices = d.presentation && d.presentation.pricesFresh ? read(d.presentation.priceSlots) : [];
    const priceValues = prices.map(slot=>num(slot.allInPrice)).filter(value=>value!==null);
    const min = priceValues.length ? Math.min(...priceValues) : 0, max = priceValues.length ? Math.max(...priceValues) : 0;
    const cells = Array.from({length:96}, (_,i) => {
        const a = start + i * quarter, b = a + quarter;
        const price = prices.find(slot=>slot.a<=a && slot.b>=b);
        const rate = price ? num(price.allInPrice) : null;
        const time = new Date(a).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
        return {key:a,time,now:now>=a && now<b,ev:ev.some(slot=>slot.a<b && slot.b>a),wit:wit.some(slot=>slot.a<b && slot.b>a),rate,
            height:rate===null?4:max===min?50:15+85*(rate-min)/(max-min)};
    });
    const blocks = (slots, name) => {
        const result = [];
        for (const slot of [...slots].sort((a,b)=>a.a-b.a)) {
            const last = result[result.length-1];
            if (last && last.end === slot.start) last.end = slot.end;
            else result.push({name,start:slot.start,end:slot.end});
        }
        return result;
    };
    return {cells, labels:[0,24,48,72,95].map(i=>({key:i,text:(i===0||i===95?new Date(cells[i].key).toLocaleDateString('nl-NL',{weekday:'short'})+' ':'')+cells[i].time})),
        blocks:[...blocks(ev,'Auto'),...blocks(wit,'Thuisaccu')].sort((a,b)=>new Date(a.start)-new Date(b.start))};
}

function configurationGroups(rows, search, onlyMissing, missing, unavailable) {
    const text = String(search || '').toLowerCase().trim();
    const group = role => role.includes('.nas_')?'NAS':/climate\.|water_heater\.|cooling_zone|outdoor_temperature|weather\./.test(role)?'Klimaat':
        role.startsWith('light.')?'Verlichting':role.includes('flex_load')?'Verbruikers':/ev_|\.ev$/.test(role)?'Auto & laden':
        /growatt|battery_/.test(role)?'Accu & WIT':/p1_meter/.test(role)?'Net & P1':'Zon & prijzen';
    const buckets = new Map();
    for (const row of rows) {
        const absent = !row.actual || missing.includes(row.canonical);
        const offline = unavailable.includes(row.canonical);
        const label = group(row.canonical);
        if (onlyMissing && !absent && !offline) continue;
        if (text && !(label+' '+row.canonical+' '+row.actual).toLowerCase().includes(text)) continue;
        if (!buckets.has(label)) buckets.set(label, []);
        buckets.get(label).push({...row,absent,offline});
    }
    return [...buckets].map(([name,items])=>({name,items}));
}

const viewComputed = {
    navigationModules() {return (this.d.configuration && this.d.configuration.config || {}).modules || {};},
    pageNow() {return this.presentationNow || Date.now();},
    combinedPlan() {return this.makePlanView(this.d, this.pageNow);},
    visibleLoads() {
        const roles = [2,3,4,5,6,1,7];
        return (this.d.loads || []).map((item,index)=>({...item,role:'sensor.flex_load_'+roles[index]+'_power'}))
            .filter(item=>this.roleConfigured(item.role) || item.controlKey && this.roleConfigured('switch.flex_load_1'))
            .sort((a,b)=>Number(!!b.active)-Number(!!a.active) || (Number(b.power)||0)-(Number(a.power)||0));
    },
    visibleLights() {return (this.d.lighting && this.d.lighting.rooms || []).filter(item=>this.roleConfigured(item.entityId));},
    visibleCooling() {return (this.d.climate && this.d.climate.aircos || []).filter(item=>item.configured!==false);},
    visibleHeating() {return (this.d.climate && this.d.climate.tado || []).filter(item=>item.configured!==false);},
    visibleHeatPump() {return [this.d.climate && this.d.climate.heatPump,this.d.climate && this.d.climate.hotWater].filter(item=>item && item.configured!==false);},
    primaryEv() {return (this.d.ev || [])[0] || {};},
    measuredEvPower() {const values=(this.d.ev||[]).filter((item,index)=>index===0||this.roleConfigured('sensor.ev_charger_2_status')).map(item=>this.numberOrNull(item.power)).filter(value=>value!==null);return values.length?values.reduce((a,b)=>a+b,0):null;},
    visibleLoadPower() {const values=this.visibleLoads.map(item=>this.numberOrNull(item.power)).filter(value=>value!==null);return values.length?values.reduce((a,b)=>a+b,0):null;},
    totalPvPower() {const a=this.numberOrNull((this.d.solar||{}).power),b=this.numberOrNull((this.d.wit||{}).solarPower);return a===null&&b===null?null:(a||0)+(b||0);},
    loadScale() {return Math.max(1,...this.visibleLoads.map(item=>Math.max(0,Number(item.power)||0)));}
};
const viewMethods = {
    roleConfigured(role) {const roles=this.d.presentation && this.d.presentation.configuredRoles;return !Array.isArray(roles) || roles.includes(role);},
    loadBar(power) {return this.numberOrNull(power)===null?0:Math.max(0,Math.min(100,Number(power)/this.loadScale*100));},
    absolutePower(power) {return this.power(this.numberOrNull(power)===null?null:Math.abs(Number(power)));},
    priceLabel(rate) {return rate===null?'Prijs niet beschikbaar':this.price(rate)+'/kWh';}
};
function serializeMethods(methods) {return Object.entries(methods).map(([name,fn])=>`${name}(...args){return (${fn.toString().replace(new RegExp('^'+name+'\\('),'function(')}).apply(this,args)}`).join(',\n');}

function navigation(route) {
    const link = ([,target,label,icon,module], mobile=false) => `<a href="./${target}"${target===route?' aria-current="page"':''}${module?` v-if="navigationModules.${module}!==false${module==='battery'?'||navigationModules.inverter!==false':''}"`:''} class="${!mobile&&pages.findIndex(page=>page[1]===target)>3?'ess-nav-secondary':''}"><v-icon icon="${icon}" size="20"></v-icon><span>${label}</span></a>`;
    return `<nav class="ess-nav" aria-label="Hoofdnavigatie">${pages.map(page=>link(page)).join('')}<details class="ess-more"><summary><v-icon icon="mdi-dots-horizontal" size="20"></v-icon><span>Meer</span></summary><div class="ess-more-menu">${pages.slice(4).map(page=>link(page,true)).join('')}</div></details></nav>`;
}
const alertSummary = `<aside class="ess-status-summary" :class="{warn:activeAlerts.length,error:activeAlerts.some(item=>item.level==='error')}" v-if="activeAlerts.length" role="status"><div><b>{{activeAlerts.length}} aandachtspunt{{activeAlerts.length===1?'':'en'}}</b><div>{{activeAlerts[0].text}}</div></div><a href="./systeem">Bekijken</a></aside>`;
const timeline = `<section class="ess-timeline" aria-label="Gezamenlijke laadplanning"><h3>Komende 24 uur</h3><div class="ess-timeline-row" v-if="navigationModules.ev!==false"><span>Auto · gepland laden</span><div class="ess-timeline-track"><i v-for="cell in combinedPlan.cells" :key="'ev-'+cell.key" :class="{ev:cell.ev,now:cell.now}" :title="cell.time+(cell.ev?' · Auto gepland':' · Niet gepland')"></i></div></div><div class="ess-timeline-row" v-if="navigationModules.battery!==false"><span>Thuisaccu · gepland netladen</span><div class="ess-timeline-track"><i v-for="cell in combinedPlan.cells" :key="'wit-'+cell.key" :class="{wit:cell.wit,now:cell.now}" :title="cell.time+(cell.wit?' · Accu gepland':' · Niet gepland')"></i></div></div><div class="ess-timeline-row"><span>Stroomprijs · all-in per kWh</span><div class="ess-timeline-track ess-price-bars"><i v-for="cell in combinedPlan.cells" :key="'price-'+cell.key" :class="{missing:cell.rate===null,negative:cell.rate!==null&&cell.rate<0,now:cell.now}" :style="{height:cell.height+'%'}" :title="cell.time+' · '+priceLabel(cell.rate)"></i></div></div><div class="ess-timeline-axis"><span v-for="label in combinedPlan.labels" :key="label.key">{{label.text}}</span></div><p class="subtle">Groen: accu · paars: auto · omlijning: huidig kwartier. Planning is geen bevestiging van werkelijk laden.</p><details class="ess-slot-list"><summary>Laadblokken en kwartierprijzen</summary><p v-if="!combinedPlan.blocks.length" class="subtle">Geen laadblokken gepland.</p><ul><li v-for="(block,index) in combinedPlan.blocks" :key="index"><b>{{block.name}}</b><span>{{slotRange(block.start,block.end)}}</span></li></ul><details><summary>Alle kwartierprijzen</summary><ul><li v-for="cell in combinedPlan.cells" :key="cell.key"><span>{{cell.time}}</span><b>{{priceLabel(cell.rate)}}</b></li></ul></details></details></section>`;
const empty = text => `<div class="ess-empty">${text} <a href="./configuratie">Naar Configuratie</a></div>`;

function details(panel, title, subtitle='') {
    return `<details class="panel ess-details"><summary>${title}${subtitle?'<small>'+subtitle+'</small>':''}</summary>${panel}</details>`;
}
function panelsOf(template) {return template.match(/<article\b[\s\S]*?<\/article>/g) || [];}
function replacePanel(template, title, transform) {
    const panel = panelsOf(template).find(panel=>panel.includes('<b>'+title+'</b>'));
    if (!panel) throw new Error('Presentation panel not found: '+title);
    return template.replace(panel, transform(panel));
}

// Locate one nested div without matching > characters inside Vue attributes.
function divElement(source, marker) {
    const start = source.indexOf(marker);
    if (start < 0) throw new Error('Presentation element missing: '+marker);
    const tags = /<\/?div\b(?:[^>"']|"[^"]*"|'[^']*')*>/g;
    tags.lastIndex = start;
    let depth = 0, match;
    while ((match=tags.exec(source))) {
        depth += match[0].startsWith('</')?-1:1;
        if (depth===0) return source.slice(start,tags.lastIndex);
    }
    throw new Error('Unclosed dashboard div: '+marker);
}
function compactOwnTimeline(panel) {
    const clock = divElement(panel,'<div class="plan-clock">');
    const summary = divElement(clock,'<div class="plan-clock-summary">');
    return panel.replace(clock,summary+`<details class="ess-slot-list"><summary>Eigen laadplanning in detail</summary>${clock.replace(summary,'')}</details>`);
}
const energyFlow = `<article class="panel span-12" id="energie-nu"><div class="panel-head"><b>Actuele energiestroom</b><span>Nu · vermogen in W / kW</span></div><div class="ess-flow-grid">
<div class="ess-flow-node" v-if="modules.energy!==false"><span>Zonnepanelen</span><b>{{power(totalPvPower)}}</b><small>Losse PV {{power(d.solar&&d.solar.power)}} · WIT {{power(d.wit&&d.wit.solarPower)}}</small><span class="ess-flow-direction">↓ Naar de installatie</span></div>
<div class="ess-flow-node" v-if="modules.energy!==false"><span>Elektriciteitsnet</span><b>{{absolutePower(d.grid&&d.grid.power)}}</b><small>{{gridLabel}}</small><span class="ess-flow-direction">{{numberOrNull(d.grid&&d.grid.power)===null?'Richting onbekend':Number(d.grid.power)<0?'↑ Naar het net':Number(d.grid.power)>0?'↓ Vanuit het net':'Geen netto stroom'}}</span></div>
<div class="ess-flow-node" v-if="modules.battery!==false"><span>Thuisaccu · {{soc}}</span><b>{{absolutePower(d.battery&&d.battery.power)}}</b><small>{{d.battery&&d.battery.state||'Niet beschikbaar'}}</small><span class="ess-flow-direction">{{numberOrNull(d.battery&&d.battery.power)===null?'Richting onbekend':Number(d.battery.power)>0?'↑ Laden vanuit de installatie':Number(d.battery.power)<0?'↓ Leveren aan de installatie':'Geen accustroom'}}</span></div>
<div class="ess-flow-bus"><span>Elektrische installatie</span></div>
<div class="ess-flow-node house"><span>↓ Woning totaal</span><b>{{power(d.house&&d.house.power)}}</b><small>Totaal berekend verbruik, inclusief laadpunten</small></div>
<div class="ess-flow-node" v-if="modules.ev!==false"><span>Waarvan auto / laadpunten</span><b>{{power(measuredEvPower)}}</b><small>Gemeten laadvermogen · onderdeel van het totaal</small></div>
</div><p class="subtle">De pijlen tonen de stroomrichting. De verdeling per energiebron wordt niet afzonderlijk gemeten.</p></article>`;

function apply(flows) {
    const css = fs.readFileSync(path.join(__dirname,'../ui/dashboard.css'),'utf8');
    for (const [id,route] of pages) {
        const node = flows.find(item=>item.id===id);
        if (!node) throw new Error('Dashboard page missing: '+id);
        const scriptStart = node.format.indexOf('<script>'), templateEnd = node.format.lastIndexOf('</template>',scriptStart);
        let template = node.format.slice('<template>'.length,templateEnd);
        let rest = node.format.slice(templateEnd);
        template = template.replace('class="mp-shell"',`class="mp-shell ess-refresh ess-page-${route}"`);
        template = template.replace('</header>','</header>'+navigation(route)+(route!=='systeem'&&route!=='configuratie'?alertSummary:''));
        const computed = {...viewComputed};
        rest = rest.replace('computed:{','computed:{\n'+serializeMethods(computed)+',');
        rest = rest.replace('methods:{',`methods:{\nnumberOrNull:${numberOrNull.toString()},makePlanView:${planView.toString()},\n`+serializeMethods(viewMethods)+',');
        if (route!=='configuratie') {
            rest = rest.replace('pendingClimate:{},pendingLights:{}','pendingClimate:{},pendingLights:{},presentationNow:Date.now(),presentationTimer:null');
            rest = rest.replace('  watch:',"  mounted(){this.presentationTimer=setInterval(()=>{this.presentationNow=Date.now()},5000)},\n  unmounted(){clearInterval(this.presentationTimer)},\n  watch:");
            rest = rest.replace('Date.now()-t>30000','this.pageNow-t>30000');
        }
        if (route==='overzicht') {
            template = template.replace(/<nav class="nav-grid"[\s\S]*?<\/nav>/,'');
            template = template.replace(/  <div class="notice" :class="\{warn:activeAlerts.length\}"[\s\S]*?<\/div>/,'');
            template = template.replace('class="metric-grid"','class="metric-grid ess-overview-metrics"');
            template = template.replace('{{power(d.solar&&d.solar.power)}}','{{power(totalPvPower)}}');
            template = template.replace('{{power(d.grid&&d.grid.power)}}','{{absolutePower(d.grid&&d.grid.power)}}');
            template = template.replace('<article class="metric tone-sun">','<article class="metric tone-sun" v-if="modules.energy!==false">')
                .replace('<article class="metric">','<article class="metric" v-if="modules.energy!==false">')
                .replace('<article class="metric tone-grid">','<article class="metric tone-grid" v-if="modules.energy!==false">')
                .replace('<article class="metric tone-battery">','<article class="metric tone-battery" v-if="modules.battery!==false">');
            template = template.replace('  </section>',`<article class="metric tone-ev" v-if="modules.ev!==false"><span>AUTO</span><b>{{percent(primaryEv.soc)}}</b><small>{{absolutePower(primaryEv.power)}} · {{primaryEv.status||'Niet beschikbaar'}}</small></article></section>`);
            template = template.replace(/\n<\/div>\s*$/,`<article class="panel" v-if="modules.ev!==false||modules.battery!==false"><div class="panel-head"><b>Laadplanning</b><span>Auto en thuisaccu</span></div>${timeline}</article>\n</div>`);
        }
        if (route==='energie') {
            template = replacePanel(template,'Actuele energiestroom',()=>energyFlow);
            template = replacePanel(template,'Dagtotalen',panel=>panel.replace('span-7','span-12').replace('<b>Dagtotalen</b>','<b>Dagtotalen · vandaag</b>'));
            template = replacePanel(template,'Netbelasting per fase',panel=>details(panel,'Netbelasting per fase','Gemeten stromen en ontwerpgrens'));
            template = moveDetailsLast(template);
        }
        if (route==='accu') {
            template = template.replace(/<div class="notice" style="margin-top:12px">[\s\S]*?<\/div>/,'');
            template = template.replace('STATE OF CHARGE','Laadniveau').replace('WIT POWER','Accuvermogen').replace('SYSTEM OUTPUT','Omvormeruitgang').replace('EXPORT LIMIT','Exportbegrenzing').replace('WIT ZON','Zon op WIT').replace('Terugvalwaarde woning','Niet gelijk aan totaal woningverbruik');
            template = template.replace('circa 30 kWh',"{{energy(d.configuration&&d.configuration.config&&d.configuration.config.specs&&d.configuration.config.specs.batteryCapacityKwh)}} capaciteit");
            template = replacePanel(template,'WIT: opdracht en meting',panel=>details(panel,'Technische details','WIT-opdracht en terugmelding'));
            template = replacePanel(template,'Growatt WIT',panel=>details(panel,'Omvormer en EV-accubuffer'));
            template = replacePanel(template,'Thuisaccu',panel=>panel+`<article class="panel span-7"><div class="panel-head"><b>Regeling en volgende stap</b><span>{{d.wit&&d.wit.runtime&&d.wit.runtime.direction||'Wacht op gegevens'}}</span></div><div class="ess-battery-now"><b>{{d.wit&&d.wit.gridCharge&&d.wit.gridCharge.status||'Wacht op planning'}}</b><span class="subtle">Volgend netlaadmoment: {{d.wit&&d.wit.gridCharge&&d.wit.gridCharge.nextScheduledStart?slotRange(d.wit.gridCharge.nextScheduledStart,d.wit.gridCharge.nextScheduledEnd):'Geen laadblok gepland'}}</span><span class="subtle">Gevraagd: {{power(d.wit&&d.wit.runtime&&d.wit.runtime.requestedPowerW)}} · gemeten: {{power(d.wit&&d.wit.runtime&&d.wit.runtime.measuredPowerW)}}</span></div></article>`);
            template = replacePanel(template,'WIT slim netladen',panel=>compactOwnTimeline(panel).replace('</article>',timeline+'</article>'));
            // Put direct operation before the optional diagnostics.
            template = moveDetailsLast(template);
        }
        if (route==='autos') {
            template = template.replace('DOELSTROOM','GEVRAAGDE STROOM');
            template = template.replace('v-if="d.ev&&d.ev[1]"','v-if="d.ev&&d.ev[1]&&roleConfigured(\'sensor.ev_charger_2_status\')"');
            template = replacePanel(template,'Laadplanning',panel=>compactOwnTimeline(panel).replace('</article>',`${timeline}</article>`));
        }
        if (route==='verbruikers') {
            template = template.replace('v-for="item in d.loads"','v-for="item in visibleLoads"')
                .replace('{{power(loadPower)}}','{{power(visibleLoadPower)}}')
                .replace('<small v-if="item.power==null&&item.temperature">Temperatuur</small>',`<small>{{item.power==null?'Geen vermogensmeting':'Gemeten vermogen'}}</small>`)
                .replace('<button v-if="item.controlKey"','<button :disabled="item.status===\'Niet beschikbaar\'" v-if="item.controlKey"');
            template = template.replace('</div></div></div></article>',`</div><div class="ess-load-bar" :aria-label="item.name+' relatief vermogen'"><i :style="{width:loadBar(item.power)+'%'}"></i></div></div></div><div v-if="!visibleLoads.length">${empty('Nog geen verbruikers gekoppeld.')}</div></article>`);
        }
        if (route==='verlichting') {
            template = template.replace('(d.lighting&&d.lighting.rooms)||[]','visibleLights')
                .replace("{{d.lighting&&d.lighting.onCount||0}} van {{d.lighting&&d.lighting.totalCount||0}}", "{{visibleLights.filter(item=>item.active).length}} van {{visibleLights.length}}")
                .replace('</section>',`<div v-if="!visibleLights.length">${empty('Nog geen lichtzones gekoppeld.')}</div></section>`);
        }
        if (route==='klimaat') {
            template = template.replace('(d.climate&&d.climate.aircos)||[]','visibleCooling')
                .replace('(d.climate&&d.climate.tado)||[]','visibleHeating')
                .replace('[d.climate&&d.climate.heatPump,d.climate&&d.climate.hotWater].filter(Boolean)','visibleHeatPump');
            for (const [title,rows] of [["Airco's",'visibleCooling'],['Verwarming','visibleHeating'],['Warmtepomp','visibleHeatPump']]) {
                template = replacePanel(template,title,panel=>panel.replace('<article class="panel span-12">',`<article class="panel span-12" v-if="${rows}.length">`));
            }
            template = template.replace('</section>',`<div v-if="!visibleCooling.length&&!visibleHeating.length&&!visibleHeatPump.length">${empty('Nog geen klimaatzones gekoppeld.')}</div></section>`);
        }
        if (route==='systeem') {
            const alerts = panelsOf(template).find(panel=>panel.includes('<b>Actieve meldingen</b>'));
            template = template.replace(alerts,'').replace('<section class="panel-grid">','<section class="panel-grid">'+alerts.replace('span-8','span-12'));
            const nas = panelsOf(template).find(panel=>panel.includes('<b>Synology NAS'));
            template = template.replace(nas,details(nas,'NAS-details','Metingen en apparaatstatus').replace('<details class="panel ess-details">','<details class="panel ess-details" v-if="modules.nas!==false">'));
            template = replacePanel(template,'Bedrijfsmodus',panel=>details(panel,'Technische bedrijfsmodus'));
            template = moveDetailsLast(template);
        }
        if (route==='configuratie') {
            ({template,rest} = improveConfiguration(template,rest));
        }
        // Equivalent text lives in the expandable lists; avoid 288 chart cells
        // crowding the screen-reader navigation on every planning page.
        template = template.replace(/class="ess-timeline-track([^"]*)"/g,'class="ess-timeline-track$1" aria-hidden="true"');
        node.format = '<template>'+template+rest.replace('</style>',css+'\n</style>');
        node.className = 'ess-dashboard-widget';
        node.height = '0';
    }
    attachPresentationData(flows);
}

function moveDetailsLast(template) {
    const folded = template.match(/<details class="panel ess-details"[\s\S]*?<\/details>/g) || [];
    for (const item of folded) template = template.replace(item,'');
    return template.replace('</section>\n</div>',folded.join('\n')+'</section>\n</div>');
}

function improveConfiguration(template,rest) {
    rest = rest.replace("draft:null,dirty:false,importText:'',message:''", "draft:null,dirty:false,importText:'',message:'',entitySearch:'',missingOnly:false");
    rest = rest.replace('computed:{',`computed:{\nentityGroups(){return (${configurationGroups.toString()})(this.entityRows,this.entitySearch,this.missingOnly,this.missing,this.unavailable)},`);
    rest = rest.replace("this.message='Configuratie opgeslagen'", "this.message='Wijzigingen verstuurd; controle wordt bijgewerkt'");
    template = template.replace('<section class="panel-grid" v-if="draft">',`<div class="ess-savebar" :class="{dirty:dirty}" v-if="draft"><span role="status">{{dirty?'Niet-opgeslagen wijzigingen':message||'Lokaal installatieprofiel'}}</span><div class="config-actions"><button class="touch-button" @click="validate">Controleren</button><button class="touch-button active" @click="save">Opslaan</button></div></div><section class="panel-grid" v-if="draft">`);
    template = replacePanel(template,'Home Assistant-entiteiten',()=>`<article class="panel span-12"><div class="panel-head"><b>Home Assistant-entiteiten</b><span>Zoek op onderdeel, rol of entiteit</span></div><div class="ess-config-tools"><label class="config-field"><span>Zoeken in koppelingen</span><input type="search" v-model="entitySearch" placeholder="Bijvoorbeeld accu, klimaat of sensor…" aria-label="Zoeken in koppelingen"></label><label><input type="checkbox" v-model="missingOnly">Alleen ontbrekend of niet beschikbaar</label></div><section class="ess-config-group" v-for="group in entityGroups" :key="group.name"><h3>{{group.name}} <small>{{group.items.length}} koppelingen</small></h3><div class="config-grid config-map"><label class="config-field" v-for="item in group.items" :key="item.canonical"><span>{{item.canonical}}</span><input :value="draft.entities[item.canonical]" @input="setEntity(item.canonical,$event)" placeholder="domain.entity"><small v-if="item.absent">Niet gekoppeld / ontbreekt</small><small v-else-if="item.offline">Niet beschikbaar in Home Assistant</small></label></div></section><p v-if="!entityGroups.length" class="ess-empty">Geen koppelingen gevonden met deze filters.</p></article>`);
    template = replacePanel(template,'Installatiegrenzen',panel=>details(panel,'Installatiegrenzen','Geavanceerd · fysieke maxima'));
    template = template.replace('<section class="ess-config-group"','<details class="ess-config-group" :open="!!entitySearch.trim()||missingOnly"')
        .replace('<h3>{{group.name}} <small>{{group.items.length}} koppelingen</small></h3>','<summary>{{group.name}} <small>· {{group.items.length}} koppelingen</small></summary>')
        .replace('</label></div></section><p v-if="!entityGroups.length"','</label></div></details><p v-if="!entityGroups.length"');
    template = replacePanel(template,'Configuratie importeren',panel=>details(panel,'Configuratie importeren','Lokaal JSON-profiel'));
    return {template,rest};
}

function attachPresentationData(flows) {
    const mapper = flows.find(item=>item.id==='ess00000000000a');
    mapper.func = mapper.func.replace(/\/\/ BEGIN PRESENTATION DATA[\s\S]*?\/\/ END PRESENTATION DATA\n/g,'');
    const source = `// BEGIN PRESENTATION DATA
dashboard.presentation = {
    configuredRoles:Object.entries(essRuntimeConfig.entities || {}).filter(([role,actual]) => actual && (actual !== role || rawStates[actual])).map(([role])=>role),
    pricesFresh:dashboard.wit.runtime.pricesFresh,
    priceSlots:(flow.get('ess_nordpool_forecast') || []).filter(slot => new Date(slot.end).getTime() > Date.now() && new Date(slot.start).getTime() < Date.now()+86400000)
        .slice(0,192).map(slot=>({start:slot.start,end:slot.end,allInPrice:slot.allInPrice}))
};
// END PRESENTATION DATA
`;
    const at = mapper.func.lastIndexOf("flow.set('ess_dashboard_live', dashboard);");
    if (at<0) throw new Error('Dashboard model return missing');
    mapper.func = mapper.func.slice(0,at)+source+mapper.func.slice(at);
}

module.exports = {apply,pages,planView,configurationGroups,numberOrNull};
