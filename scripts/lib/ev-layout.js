module.exports=function evLayout(flows) {
    const ui=flows.find(n=>n.id==='esstpl_ev0000001');
    const articles=[...ui.format.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(m=>m[0]);
    const controls=articles.find(a=>a.includes('<b>Laadbediening</b>'));
    const planning=articles.find(a=>a.includes('<b>Laadplanning</b>'));
    const oldJeep=articles.find(a=>a.includes('<b>Jeep Avenger · Easee rechts</b>'));
    const vehicle=articles.find(a=>a.includes('<b>Elektrische auto</b>'));
    if(!controls||!planning||!oldJeep||!vehicle)throw Error('Missing vehicle panels for shared charging layout');
    const content=a=>a.replace(/^<article[^>]*><div class="panel-head">[\s\S]*?<\/div>/,'').replace(/<\/article>$/,'');
    const timeline=planning.match(/<section class="ess-timeline"[\s\S]*?<\/section>/)?.[0]||'';
    const body=content(controls)+'<h3>Laadplanning</h3>'+content(planning).replace(timeline,'');
    const card=(title,side,smart,contents)=>`<article class="panel ess-ev-control" aria-label="${title} laadregeling"><div class="panel-head"><b>${title}</b><span>Easee ${side}</span></div><p class="subtle ess-ev-reason">{{d.${smart}?.reason||d.${smart}?.status||'Wacht op actuele gegevens'}}</p>${contents}</article>`;
    const audi=card('Audi','links','audiSmart',content(vehicle)+body);
    let jeepBody=body.replaceAll('d.audiSmart','d.jeepSmart').replaceAll('ess/audi/','ess/jeep/')
        .replace('@click="toggleEV"',`@click="send({topic:'ess/jeep/smart-enabled',payload:!d.jeepSmart?.enabled})"`)
        .replace('@click="toggleForceFull"',`@click="send({topic:'ess/jeep/force-full',payload:!d.jeepSmart?.forceFull})"`)
        .replace('@change="timeSetting($event)"',`@change="send({topic:'ess/jeep/departure-time',payload:$event.target.value})"`)
        .replaceAll('planTimeline.','jeepPlanTimeline.')
        .replace('{{planText}}','{{jeepPlanText}}')
        .replace('d.jeepSmart&&d.jeepSmart.departureSoc||80','d.jeepSettings?.departureSoc||80')
        .replace('d.jeepSmart&&d.jeepSmart.solarSoc||100','d.jeepSettings?.solarSoc||80')
        .replace('d.jeepSmart&&d.jeepSmart.departureTime||\'06:00\'','d.jeepSettings?.departureTime||\'06:00\'');
    const manual=`<div class="ess-ev-manual"><label class="setting soc-setting"><span>HUIDIGE JEEP-ACCUSTAND</span><select :value="d.jeepManualSoc?.soc??''" @change="send({topic:'ess/jeep/manual-soc',payload:$event.target.value})"><option value="" disabled>Vul in bij aansluiten</option><option v-for="value in 101" :key="value" :value="value-1">{{value-1}}%</option></select></label><p class="subtle">Geschat: {{d.jeepSmart?.estimatedEVSoc==null?'—':Math.round(d.jeepSmart.estimatedEVSoc)+'%'}} · 54 kWh. Vul de stand opnieuw in bij elke aansluiting.</p></div>`;
    jeepBody=jeepBody.replace('<div class="plan-grid">',manual+'<div class="plan-grid">');
    const jeep=card('Jeep Avenger','rechts','jeepSmart',jeepBody);
    ui.format=ui.format.replace(controls,'').replace(planning,'').replace(oldJeep,'').replace(vehicle,'');
    ui.format=ui.format.replace('<section class="panel-grid">',`<section class="panel-grid"><div class="ess-ev-controls span-12">${audi}${jeep}</div>`);
    if(timeline)ui.format=ui.format.replace('</section>\n</div>',`<article class="panel span-12"><div class="panel-head"><b>Gezamenlijke laadplanning</b><span>Audi, Jeep en thuisaccu</span></div>${timeline}</article></section>\n</div>`);
    const getter=ui.format.match(/planTimeline\(\)\{[^\n]+/);
    if(!getter)throw Error('Missing shared charge timeline');
    ui.format=ui.format.replace(getter[0],getter[0].replace('planTimeline()','jeepPlanTimeline()').replaceAll('this.d.audiSmart','this.d.jeepSmart')+'\n'+getter[0]);
    const textGetter=ui.format.match(/planText\(\)\{[^\n]+/);
    if(!textGetter)throw Error('Missing charging plan label');
    ui.format=ui.format.replace(textGetter[0],textGetter[0].replace('planText()','jeepPlanText()').replaceAll('this.d.audiSmart','this.d.jeepSmart')+'\n'+textGetter[0]);
    const css=`
.ess-refresh .ess-ev-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:start}
.ess-refresh .ess-ev-control{min-width:0;margin:0}
.ess-refresh .ess-ev-control .plan-grid{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:16px}
.ess-refresh .ess-ev-control .plan-clock-summary{grid-template-columns:repeat(3,minmax(0,1fr))}
.ess-refresh .ess-ev-reason{min-height:40px;margin:0 0 12px}
.ess-refresh .ess-ev-manual{margin-top:16px}
@media(max-width:760px){.ess-refresh .ess-ev-controls{grid-template-columns:minmax(0,1fr)}}
@media(max-width:420px){.ess-refresh .ess-ev-control .plan-grid,.ess-refresh .ess-ev-control .plan-clock-summary{grid-template-columns:minmax(0,1fr)}}
`;
    ui.format=ui.format.replace('</style>',css+'</style>');
};
