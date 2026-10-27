function dailyChargerEnergy(item,now){
    if(!item||['unknown','unavailable',''].includes(String(item.state)))return null;
    const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'});
    const at=Date.parse(item.last_reported||item.last_updated||item.last_changed||'');
    if(!Number.isFinite(at)||at>now+60000||fmt.format(new Date(at))!==fmt.format(new Date(now)))return null;
    const attr=item.attributes||{},raw=attr.cost_day_totalEnergyUsage??attr.cost_day_total_energy_usage;
    if(raw!==undefined&&raw!==null&&raw!==''&&typeof raw!=='boolean'&&Number.isFinite(Number(raw))&&Number(raw)>=0)return Number(raw);
    const unit=String(attr.unit_of_measurement||'').toLowerCase(),value=Number(item.state);
    return ['wh','kwh'].includes(unit)&&Number.isFinite(value)&&value>=0?value*(unit==='wh'?.001:1):null;
}
function financialQuality(ledger,states,config,now){
    const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}),day=fmt.format(new Date(now));
    const today=ledger?.days?.[day],quality=ledger?.quality?.days?.[day];
    const num=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
    const qualityFullDay=Number.isFinite(ledger?.quality?.since)&&fmt.format(new Date(ledger.quality.since))<day;
    const cars={};
    for(const [car,suffix]of [['audi',''],['jeep','_2']]){
        const role='sensor.ev_charger'+suffix+'_energy_today',id=Object.hasOwn(config.entities||{},role)?config.entities[role]:role;
        const native=dailyChargerEnergy(states[id],now),recorded=num(today?.[car+'Kwh']),unpriced=num(today?.[car+'UnpricedKwh']);
        const disagreement=native!==null&&recorded!==null&&native+.05<recorded;
        const gap=native!==null&&recorded!==null?Math.max(0,native-recorded):null;
        const unvalued=unpriced!==null?unpriced+(gap||0):native;
        const missingHours=num(quality?.[car+'MissingHours']);
        cars[car]={nativeTodayKwh:native,recordedTodayKwh:recorded,valuedTodayKwh:recorded!==null&&unpriced!==null?Math.max(0,recorded-unpriced):null,
            unvaluedTodayKwh:unvalued,knownTodayCost:num(today?.[car+'Cost']),knownTotalCost:num(ledger?.total?.[car+'Cost']),
            recordedTotalKwh:num(ledger?.total?.[car+'Kwh']),unpricedTotalKwh:num(ledger?.total?.[car+'UnpricedKwh']),
            missingPowerHours:missingHours,complete:qualityFullDay&&missingHours===0&&!disagreement&&(unvalued??1)<=.05,
            disagreement,sourceUpdatedAt:states[id]?.last_reported||states[id]?.last_updated||null};
    }
    return {cars,qualitySince:ledger?.quality?.since||null,battery:{balance:num(today?.batterySaving),missingHours:num(quality?.batteryMissingHours),
        complete:qualityFullDay&&quality?.batteryMissingHours===0&&(today?.missingHours||0)===0},
        missingGridHours:num(today?.missingHours)};
}
module.exports=function apply(flows){
    const get=id=>flows.find(n=>n.id===id),mapper=get('ess00000000000a');
    mapper.func=mapper.func.replace(/^function (?:dailyChargerEnergy|financialQuality)\([\s\S]*?^\}\r?\n/gm,'').replace(/\/\/ BEGIN FINANCIAL QUALITY[\s\S]*?\/\/ END FINANCIAL QUALITY\n/g,'');
    mapper.func=dailyChargerEnergy.toString()+'\n'+financialQuality.toString()+'\n'+mapper.func;
    const anchor="flow.set('ess_dashboard_live', dashboard);";
    mapper.func=mapper.func.replace(anchor,`// BEGIN FINANCIAL QUALITY
dashboard.financialQuality=financialQuality(flow.get('ess_energy_cost_ledger'),rawStates,essRuntimeConfig,Date.now());
// END FINANCIAL QUALITY
${anchor}`);
    const overview=get('ess000000000004');
    overview.format=overview.format.replace(/<article class="metric tone-ev" v-for="car in \['audi','jeep'\]"[\s\S]*?<\/article>/,`<article class="metric tone-ev" v-for="car in ['audi','jeep']" :key="'cost-'+car"><span>{{car==='audi'?'Audi':'Jeep'}} · bekende netkosten vandaag</span><b>{{money(d.financialQuality?.cars?.[car]?.knownTodayCost)}}</b></article>`);
    overview.format=overview.format.replace('Accubesparing · geschat','Accu · geregistreerd dagsaldo')
        .replace('<small>Totaal {{money(d.energyCosts?.total?.batterySaving)}}</small>','<small>Totaal geregistreerd {{money(d.energyCosts?.total?.batterySaving)}}</small><small>Geschat: vermeden netafname minus netlaadkosten. Een minbedrag kan vóór latere ontlading ontstaan.</small><small>{{d.financialQuality?.battery?.complete?\'Volledige registratie vandaag\':\'Onvolledige registratie; geen bewezen dagwinst of verlies\'}}</small>');
    overview.format=overview.format.replace('<summary>Kostendetails</summary>','<summary>Kostendetails</summary><p>— betekent onbekend, niet nul. Een negatief accusaldo betekent dat de geregistreerde laadkosten vandaag hoger zijn dan de geregistreerde vermeden netafname. Kosten van eerder opgeslagen energie, omzettingsverliezen en gemiste terugleververgoeding zijn niet volledig gewaardeerd. Dit is geen bewezen rendementsberekening.</p><p>Autokosten zijn alleen het geschatte netaandeel, geen volledige waardering van alle laadenergie. Ontbrekende kWh of tarieven worden niet gratis gerekend. De laadpaal-kWh en de kostenregistratie blijven daarom apart zichtbaar.</p>');
    const ev=get('esstpl_ev0000001');
    ev.format=ev.format.replace(/<article class="panel ess-ev-control"[\s\S]*?<\/article>/g,card=>{
        const car=card.includes('aria-label="Audi laadregeling"')?'audi':'jeep';
        card=card.replace('<span>LAADKOSTEN VANDAAG</span>','<span>BEKENDE NETKOSTEN VANDAAG · GESCHAT</span>').replace('<span>TOTALE LAADKOSTEN</span>','<span>BEKENDE NETKOSTEN SINDS START</span>');
        return card.replace('<h3>Laadplanning</h3>',`<p>Laadpaal vandaag: {{energy(d.financialQuality?.cars?.${car}?.nativeTodayKwh)}} · gewaardeerd: {{energy(d.financialQuality?.cars?.${car}?.valuedTodayKwh)}} · nog zonder waardering: {{energy(d.financialQuality?.cars?.${car}?.unvaluedTodayKwh)}}. {{d.financialQuality?.cars?.${car}?.complete?'Volledige registratie':'Gedeeltelijke gegevens; bedrag is geen volledig laadtotaal'}}.</p><h3>Laadplanning</h3>`);
    });
};
module.exports.dailyChargerEnergy=dailyChargerEnergy;
module.exports.financialQuality=financialQuality;
