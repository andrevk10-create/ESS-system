// Presentation only: never changes learning acceptance or charging decisions.
function chargingDashboardQuality(daily,hourly,grid,now){
    const num=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
    const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'});
    const parts=t=>Object.fromEntries(fmt.formatToParts(new Date(t)).map(p=>[p.type,p.value]));
    const date=t=>{const p=parts(t);return p.year+'-'+p.month+'-'+p.day;};
    const today=date(now),midday=Date.parse(today+'T12:00:00Z');
    const coverage=[];
    for(let n=4;n>=1;n--){
        const day=date(midday-n*86400000),rows=hourly?.version===1?hourly.days?.[day]:null;
        // Count the actual local clock hours, including 23/25-hour DST days.
        const noon=Date.parse(day+'T12:00:00Z');let expectedHours=0;
        for(let t=noon-18*3600000;t<noon+18*3600000;t+=3600000)if(date(t)===day)expectedHours++;
        const seconds=Array.isArray(rows)?rows.reduce((s,r)=>s+Math.max(0,num(r?.seconds)||0),0):0;
        coverage.push({date:day,hours:Math.min(expectedHours,seconds/3600),expectedHours,percent:Math.min(100,seconds/36/expectedHours)});
    }
    const stamp=Date.parse(daily?.updatedAt||''),fresh=Number.isFinite(stamp)&&now>=stamp&&now-stamp<=150000;
    const lastValid=Date.parse(daily?.lastValidSampleAt||'');
    const planStamp=Date.parse(grid?.updatedAt||''),planFresh=Number.isFinite(planStamp)&&now>=planStamp&&now-planStamp<=150000;
    const periods=new Map();let total=0;
    if(planFresh)for(const s of grid.selectedSlots||[]){
        const a=Date.parse(s.start),b=Date.parse(s.end),energy=num(s.energyKwh);
        if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a||energy===null||energy<0)continue;
        // Keep the controller snapshot intact: subtracting elapsed seconds here
        // would incorrectly turn already scheduled energy into an unmet need.
        for(let from=a;from<b;){
            const to=Math.min(b,(Math.floor(from/3600000)+1)*3600000),p=parts(from),day=date(from),night=Number(p.hour)<7;
            const key=day+'-'+(night?'night':'day'),kwh=energy*(to-from)/(b-a);
            const item=periods.get(key)||{key,date:day,label:(day===today?'Vandaag':day===date(midday+86400000)?'Morgen':day)+(night?' · 00–07 uur':' · 07–24 uur'),kwh:0};
            item.kwh+=kwh;periods.set(key,item);total+=kwh;from=to;
        }
    }
    return {learning:{fresh,active:fresh&&daily?.sampleValid===true,
        reason:!fresh?'Geen recente leercontrole':daily.sampleReason||'Wacht op leergegevens',
        lastValidAt:Number.isFinite(lastValid)&&lastValid<=now?new Date(lastValid).toISOString():null,
        completeDays:Array.isArray(daily?.recentDays)?daily.recentDays.length:0,
        dayAverageKwh:num(daily?.forecastKwh),coverage,
        coveragePercent:coverage.reduce((s,r)=>s+r.hours,0)/coverage.reduce((s,r)=>s+r.expectedHours,0)*100,
        chargers:Array.isArray(daily?.chargers)?daily.chargers:[]},
        budget:{fresh:planFresh,manual:grid?.mode==='on',at:planFresh?new Date(planStamp).toISOString():null,periods:[...periods.values()],scheduledKwh:planFresh?total:null,
            unplannedKwh:planFresh&&num(grid.gridEnergyNeededKwh)!==null?Math.max(0,grid.gridEnergyNeededKwh-total):null,
            houseKwh:planFresh&&grid.mode!=='on'?num(grid.deadlineHouseKwh):null,solarKwh:planFresh?num(grid.expectedSolarChargeKwh):null,
            storedKwh:planFresh?num(grid.currentStoredKwh):null,deadline:planFresh?grid.chargeDeadline||null:null}};
}
module.exports=function apply(flows){
    const get=id=>flows.find(n=>n.id===id),mapper=get('ess00000000000a');
    mapper.func=mapper.func.replace(/^function chargingDashboardQuality\([\s\S]*?^\}\r?\n/gm,'')
        .replace(/^dashboard\.chargingQuality=chargingDashboardQuality\([^\n]*\);\r?\n/gm,'');
    mapper.func=chargingDashboardQuality.toString()+'\n'+mapper.func;
    const anchor="flow.set('ess_dashboard_live', dashboard);";
    mapper.func=mapper.func.replace(anchor,`dashboard.chargingQuality=chargingDashboardQuality(flow.get('ess_house_consumption_learning'),flow.get('ess_house_time_profile'),flow.get('ess_wit_grid_charge_status'),Date.now());\n${anchor}`);
    const learning=`<article class="panel span-12"><div class="panel-head"><b>Hoe goed leert de regeling?</b><span>{{d.chargingQuality?.learning?.active?'Leert nu':'Leren gepauzeerd'}}</span></div>
<p>{{d.chargingQuality?.learning?.reason||'Wacht op leergegevens'}}</p>
<div class="plan-grid"><div class="plan-card"><span>GOEDGEKEURDE DAGEN</span><b>{{d.chargingQuality?.learning?.completeDays??0}}</b><small>Minstens 18 uur meetdekking per dag · maximaal 30 dagen</small></div><div class="plan-card"><span>MEETDEKKING LAATSTE VIER DAGEN</span><b>{{d.chargingQuality?.learning?Math.round(d.chargingQuality.learning.coveragePercent)+'%':'—'}}</b><small>Vier afgeronde kalenderdagen</small></div><div class="plan-card"><span>LAATSTE GELDIGE LEERMETING</span><b>{{d.chargingQuality?.learning?.lastValidAt?new Date(d.chargingQuality.learning.lastValidAt).toLocaleString('nl-NL',{timeZone:'Europe/Amsterdam'}):'Nog niet geregistreerd'}}</b><small>Woningverbruik exclusief beide auto’s</small></div></div>
<details><summary>Meetdekking en laadpunten</summary><p v-for="row in d.chargingQuality?.learning?.coverage||[]" :key="row.date">{{row.date}}: {{row.hours.toFixed(1)}} van {{row.expectedHours}} uur · {{Math.round(row.percent)}}%</p><p v-for="(charger,i) in d.chargingQuality?.learning?.chargers||[]" :key="i">Laadpunt {{i+1}}: {{charger.source}} · {{power(charger.powerW)}}</p><p>Onbekende of tegenstrijdige laadmetingen pauzeren het leren. Controleer dan de vermogens-, stroom-, status- en online-koppelingen van dat laadpunt in Home Assistant en Configuratie.</p></details></article>`;
    const budget=`<article class="panel span-12"><div class="panel-head"><b>Opbouw van het laadbudget</b><span>{{d.chargingQuality?.budget?.fresh?'Actuele planning':'Wacht op recente planning'}}</span></div>
<p v-if="d.chargingQuality?.budget?.manual">Nu laden vult de accu doorlopend aan tot het ingestelde SOC-doel. Dit plan wordt bij elke meting bijgewerkt; netruimte, accugrenzen en tussentijds verbruik bepalen de werkelijke eindtijd.</p><p v-else>De netenergie omvat aanvullen én tussentijds woningverbruik tot {{d.chargingQuality?.budget?.deadline?new Date(d.chargingQuality.budget.deadline).toLocaleString('nl-NL',{timeZone:'Europe/Amsterdam'}):'de planningsgrens'}}. Daarom kan het totaal groter zijn dan de accucapaciteit.</p><small>Planning van {{d.chargingQuality?.budget?.at?new Date(d.chargingQuality.budget.at).toLocaleTimeString('nl-NL',{timeZone:'Europe/Amsterdam'}):'—'}}.</small>
<div class="plan-grid"><div class="plan-card"><span>NU OPGESLAGEN</span><b>{{energy(d.chargingQuality?.budget?.storedKwh)}}</b></div><div class="plan-card"><span>WONING TOT LAADDOEL</span><b>{{energy(d.chargingQuality?.budget?.houseKwh)}}</b></div><div class="plan-card"><span>ZON DIE MEETELT</span><b>{{energy(d.chargingQuality?.budget?.solarKwh)}}</b><small>Conservatief, vóór het laaddoel</small></div></div>
<p v-for="period in d.chargingQuality?.budget?.periods||[]" :key="period.key">{{period.label}}: <b>{{energy(period.kwh)}}</b> gepland netladen</p><p>Ingepland: {{energy(d.chargingQuality?.budget?.scheduledKwh)}} · nog niet ingepland: {{energy(d.chargingQuality?.budget?.unplannedKwh)}}. Alle laadhoeveelheden zijn netenergie, inclusief het ingestelde laadverlies.</p></article>`;
    const battery=get('esstpl_battery01');
    const panelEnd=battery.format.lastIndexOf('</section>',battery.format.indexOf('</template>'));
    if(panelEnd<0)throw Error('Battery panel layout missing');
    battery.format=battery.format.slice(0,panelEnd)+budget+learning+battery.format.slice(panelEnd);
    // The existing daily reserve card must not look like demand until deadline.
    battery.format=battery.format.replace('voor de woning gereserveerd','daggemiddelde woning · zie laadbudget hieronder');
    const overview=get('ess000000000004');
    overview.format=overview.format.replace('<summary>Details & instellingen kosten</summary>',`<summary>Details & instellingen kosten</summary><p>Beoordeel besparing over meerdere dagen met complete metingen. Vandaag kan tussentijds negatief zijn doordat laadkosten vóór de latere opbrengst vallen. Meetgaten maken de vergelijking onvolledig. Accubesparing blijft een schatting zonder slijtage en gemiste terugleververgoeding.</p>`);
};
module.exports.chargingDashboardQuality=chargingDashboardQuality;
