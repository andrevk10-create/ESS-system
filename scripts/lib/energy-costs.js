function costLedgerValid(v){
    if(!v||v.version!==1||!Number.isFinite(v.startedAt)||!v.total||!v.days||!v.cars)return null;
    const fields=['gridKwh','gridCost','batterySaving','audiKwh','audiCost','jeepKwh','jeepCost','coveredHours','missingHours','audiUnpricedKwh','jeepUnpricedKwh','exportKwh','exportRevenue','exportUnpricedKwh'];
    if(!fields.every(k=>Number.isFinite(v.total[k]))||Object.keys(v.days).length>32)return null;
    if(!Object.values(v.days).every(d=>fields.every(k=>Number.isFinite(d[k]))))return null;
    if(!Array.isArray(v.quarters)||v.quarters.length>192)return null;
    for(const car of ['audi','jeep']){
        const c=v.cars[car];if(!c||!Number.isFinite(c.kwh)||!Number.isFinite(c.cost))return null;
        if(c.session&&(!Number.isFinite(c.session.kwh)||!Number.isFinite(c.session.cost)||!Array.isArray(c.session.prices)||c.session.prices.length>200))return null;
    }
    return v;
}
function costLedgerStep(previous,sample,prices,now){
    const zero=()=>({gridKwh:0,gridCost:0,batterySaving:0,audiKwh:0,audiCost:0,jeepKwh:0,jeepCost:0,coveredHours:0,missingHours:0,audiUnpricedKwh:0,jeepUnpricedKwh:0,exportKwh:0,exportRevenue:0,exportUnpricedKwh:0});
    const ledger=costLedgerValid(previous)||{version:1,startedAt:now,total:zero(),days:{},quarters:[],cars:{audi:{kwh:0,cost:0},jeep:{kwh:0,cost:0}}};
    const slots=prices.map(s=>({start:Date.parse(s.start),end:Date.parse(s.end),price:typeof s.allInPrice==='number'?s.allInPrice:NaN,exportPrice:typeof s.marketPrice==='number'&&Number.isFinite(s.marketPrice)?s.marketPrice*1.21+.02:null})).filter(s=>Number.isFinite(s.start)&&s.end>s.start&&Number.isFinite(s.price));
    const date=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t));
    const finite=v=>typeof v==='number'&&Number.isFinite(v);
    const positiveIntegral=(a,b,h)=>a>=0&&b>=0?(a+b)/2*h:a<=0&&b<=0?0:Math.max(a,b)*h*Math.abs((a>0?a:b)/(b-a))/2;
    for(const car of ['audi','jeep']){
        const c=ledger.cars[car],s=sample[car];
        if(c.binding!==s.binding){c.session=null;c.connected=null;c.binding=s.binding;}
        if(s.connected!==null){
            if(s.connected&&c.connected===false&&ledger.last&&now-ledger.last.at<=120000){
                c.session={at:now,kwh:0,cost:0,powerKw:s.directPowerKw,prices:slots.slice(0,200)};
            }else if(s.connected&&c.connected!==true&&!c.session)c.session={at:null,kwh:0,cost:0,powerKw:s.directPowerKw,prices:[]};
            c.connected=s.connected;
        }
    }
    const prior=ledger.last,elapsed=prior?now-prior.at:0;
    if(prior&&elapsed>0&&elapsed<=120000&&prior.binding===sample.binding){
        let cursor=prior.at;
        while(cursor<now){
            const end=Math.min(now,(Math.floor(cursor/900000)+1)*900000);
            const h=(end-cursor)/3600000,ratio=t=>(t-prior.at)/elapsed;
            const interpolate=(a,b,t)=>a+(b-a)*ratio(t);
            const slot=slots.find(s=>s.start<=cursor&&s.end>=end),price=slot?.price;
            const value=zero(),gridOk=finite(prior.grid)&&finite(sample.grid)&&finite(price);
            if(finite(prior.grid)&&finite(sample.grid)){
                const a=interpolate(prior.grid,sample.grid,cursor),b=interpolate(prior.grid,sample.grid,end);
                value.exportKwh=positiveIntegral(-a,-b,h)/1000;
                if(finite(slot?.exportPrice))value.exportRevenue=value.exportKwh*slot.exportPrice;
                else value.exportUnpricedKwh=value.exportKwh;
            }
            if(gridOk){
                const a=interpolate(prior.grid,sample.grid,cursor),b=interpolate(prior.grid,sample.grid,end);
                value.gridKwh=positiveIntegral(a,b,h)/1000;value.gridCost=value.gridKwh*price;value.coveredHours=h;
                if(finite(prior.battery)&&finite(sample.battery)){
                    const ba=interpolate(prior.battery,sample.battery,cursor),bb=interpolate(prior.battery,sample.battery,end);
                    value.batterySaving=(positiveIntegral(a-ba,b-bb,h)/1000-value.gridKwh)*price;
                }
            }else value.missingHours=h;
            for(const car of ['audi','jeep']){
                if(finite(prior[car]?.power)&&finite(sample[car]?.power)&&prior[car].binding===sample[car].binding){
                    const a=interpolate(prior[car].power,sample[car].power,cursor),b=interpolate(prior[car].power,sample[car].power,end);
                    value[car+'Kwh']=positiveIntegral(a,b,h)/1000;value[car+'Cost']=finite(price)?value[car+'Kwh']*price:0;
                    if(!finite(price))value[car+'UnpricedKwh']=value[car+'Kwh'];
                    const c=ledger.cars[car];c.kwh+=value[car+'Kwh'];c.cost+=value[car+'Cost'];
                    if(c.session){c.session.kwh+=value[car+'Kwh'];c.session.cost+=value[car+'Cost'];if(!finite(price))c.session.unpriced=true;}
                }
            }
            const day=date(cursor),daily=ledger.days[day]||(ledger.days[day]=zero());
            const quarterStart=Math.floor(cursor/900000)*900000;
            let q=ledger.quarters.find(q=>q.start===quarterStart);
            if(!q){q={start:quarterStart,...zero()};ledger.quarters.push(q);}
            for(const k of Object.keys(value)){ledger.total[k]+=value[k];daily[k]+=value[k];q[k]+=value[k];}
            cursor=end;
        }
    }else if(prior&&elapsed>120000){ledger.total.missingHours+=elapsed/3600000;}
    ledger.last={...sample,at:now};ledger.quarters=ledger.quarters.slice(-192);
    ledger.days=Object.fromEntries(Object.entries(ledger.days).sort(([a],[b])=>a.localeCompare(b)).slice(-32));
    ledger.updatedAt=now;return ledger;
}
function costDirectBaseline(session){
    if(!session||session.unpriced||!Number.isFinite(session.at)||!(session.powerKw>0)||!(session.kwh>=0))return null;
    let remaining=session.kwh,cost=0,cursor=session.at;
    for(const s of session.prices.slice().sort((a,b)=>a.start-b.start)){
        if(s.end<=cursor)continue;if(s.start>cursor)return null;
        if(!Number.isFinite(s.price))return null;
        const energy=Math.min(remaining,(s.end-cursor)/3600000*session.powerKw);
        cost+=energy*s.price;remaining-=energy;cursor=s.end;if(remaining<=.000001)return cost;
    }
    return remaining<=.000001?cost:null;
}
function costEreOpening(snapshot,ledger,now){
    const at=typeof snapshot?.at==='number'?snapshot.at:Date.parse(snapshot?.at);
    if(!Number.isFinite(at)||at>now||typeof snapshot?.kwh!=='number'||!Number.isFinite(snapshot.kwh)||snapshot.kwh<0||typeof snapshot?.euros!=='number'||!Number.isFinite(snapshot.euros)||snapshot.euros<0)return null;
    const total=(ledger?.cars?.audi?.kwh||0)+(ledger?.cars?.jeep?.kwh||0);
    const after=!ledger||ledger.startedAt>=at?total:(ledger.quarters||[]).filter(q=>q.start>=at).reduce((sum,q)=>sum+q.audiKwh+q.jeepKwh,0);
    return {at,kwh:snapshot.kwh,euros:snapshot.euros,trackedKwh:Math.max(0,total-after)};
}
module.exports=function apply(flows){
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('esscosts_'))flows.splice(i,1);
    const get=id=>flows.find(n=>n.id===id),mapper=get('ess00000000000a');
    const helpers=[costLedgerValid,costLedgerStep,costDirectBaseline].map(f=>f.toString()).join('\n');
    mapper.func=helpers+'\n'+mapper.func.replace(/^function cost(?:LedgerValid|LedgerStep|DirectBaseline)\([\s\S]*?^\}\r?\n/gm,'').replace(/\/\/ BEGIN ENERGY COSTS[\s\S]*?\/\/ END ENERGY COSTS\n/g,'');
    mapper.func=mapper.func.replace("flow.set('ess_dashboard_live', dashboard);",`// BEGIN ENERGY COSTS
if(flow.get('ess_charging_preferences_ready')===true){
 const now=Date.now(),config=flow.get('ess_system_config')||{};
 const read=(role,age=120000)=>{const e=states[role];const stamp=Date.parse(e?.last_reported||e?.last_updated||e?.last_changed);return e&&now-stamp>=0&&now-stamp<=age&&!['unknown','unavailable',''].includes(e.state)?e:null;};
 const power=role=>{const e=read(role),unit=String(e?.attributes?.unit_of_measurement||'').toLowerCase();return e&&Number.isFinite(Number(e.state))&&['w','kw'].includes(unit)?Number(e.state)*(unit==='kw'?1000:1):null;};
 const car=(name,suffix)=>{const role='sensor.ev_charger'+suffix+'_status',e=read(role);const state=String(e?.state||'').toLowerCase();const connected=state==='disconnected'?false:['charging','awaiting_start','ready_to_charge','completed','paused','stopped'].includes(state)?true:null;return {binding:config.entities?.[role]||role,connected,power:power('sensor.ev_charger'+suffix+'_power'),directPowerKw:Number(config.specs?.[name==='audi'?'evGridChargePowerKw':'ev2GridChargePowerKw'])||11};};
 const sample={binding:JSON.stringify([config.entities?.['sensor.p1_meter_vermogen'],config.entities?.['sensor.growatt_wit_battery_battery_power']]),grid:read('sensor.p1_meter_vermogen',15000)?dashboard.grid.power:null,battery:read('sensor.growatt_wit_battery_battery_power')?dashboard.battery.power:null,audi:car('audi',''),jeep:car('jeep','_2')};
 const ledger=costLedgerStep(flow.get('ess_energy_cost_ledger'),sample,flow.get('ess_nordpool_forecast')||[],now);
 flow.set('ess_energy_cost_ledger',ledger);
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 const ere=flow.get('ess_ere_net_rate');
 const netRate=typeof ere==='number'&&Number.isFinite(ere)&&ere>=0&&ere<=2?ere:.10;
 const opening=flow.get('ess_ere_opening_balance');
 const newEreKwh=Math.max(0,ledger.cars.audi.kwh+ledger.cars.jeep.kwh-(opening?.trackedKwh||0));
 dashboard.energyCosts={total:ledger.total,today:ledger.days[day]||null,since:new Date(ledger.startedAt).toISOString(),ereOpening:opening||null,ereNetRate:netRate,ereEstimated:(opening?.euros||0)+netRate*newEreKwh,ereKwh:(opening?.kwh||0)+newEreKwh,cars:{}};
 for(const name of ['audi','jeep']){const c=ledger.cars[name],baseline=costDirectBaseline(c.session);dashboard.energyCosts.cars[name]={kwh:c.kwh,cost:c.cost,sessionCost:c.session?.cost??null,directCost:baseline,saving:baseline===null?null:baseline-c.session.cost,ereEstimated:c.kwh*netRate};}
}
// END ENERGY COSTS
flow.set('ess_dashboard_live', dashboard);`);
    // Reuse the private preference file and its backup; never write costs to Git.
    for(const id of ['essprefs_save','essprefs_restore']){
        const n=get(id);n.func=costLedgerValid.toString()+'\n'+n.func;
        n.func=n.func.replace('    return result;',"    const ledger=costLedgerValid(flow.get('ess_energy_cost_ledger'));if(ledger)result.energyCosts={...ledger,last:null};\n    const rate=flow.get('ess_ere_net_rate');if(typeof rate==='number'&&Number.isFinite(rate)&&rate>=0&&rate<=2)result.ereNetRate=rate;\n    return result;");
        if(id==='essprefs_restore')n.func=n.func.replace('    for (const [key,value] of Object.entries(candidate))',"    const ledger=costLedgerValid(saved.energyCosts);if(ledger&&!flow.get('ess_energy_cost_ledger'))flow.set('ess_energy_cost_ledger',{...ledger,last:null});\n    if(typeof saved.ereNetRate==='number'&&Number.isFinite(saved.ereNetRate)&&saved.ereNetRate>=0&&saved.ereNetRate<=2)flow.set('ess_ere_net_rate',saved.ereNetRate);\n    for (const [key,value] of Object.entries(candidate))");
        if(id==='essprefs_save')n.func=n.func.replace('    return result;',"    const opening=flow.get('ess_ere_opening_balance');if(opening&&['at','kwh','euros','trackedKwh'].every(k=>typeof opening[k]==='number'&&Number.isFinite(opening[k])&&opening[k]>=0))result.ereOpening=opening;\n    return result;");
        else n.func=n.func.replace('    for (const [key,value] of Object.entries(candidate))',"    if(saved.ereOpening&&['at','kwh','euros','trackedKwh'].every(k=>typeof saved.ereOpening[k]==='number'&&Number.isFinite(saved.ereOpening[k])&&saved.ereOpening[k]>=0)&&!flow.get('ess_ere_opening_balance'))flow.set('ess_ere_opening_balance',saved.ereOpening);\n    for (const [key,value] of Object.entries(candidate))");
    }
    const z=mapper.z;
    flows.push({id:'esscosts_save_tick',type:'inject',z,g:'esseditor_history',name:'Bewaar kwartierkosten (60 s)',props:[{p:'payload'}],repeat:'60',once:false,wires:[['essprefs_save']]});
    const ui=get('ess000000000004');
    const tile=`<section class="metric-grid" aria-label="Kosten en besparing">
 <article class="metric tone-grid"><span>NETAFNAMEKOSTEN VANDAAG</span><b>{{money(d.energyCosts?.today?.gridCost)}}</b><small>Totaal {{money(d.energyCosts?.total?.gridCost)}} sinds registratie</small></article>
 <article class="metric tone-battery"><span>ACCUBESPARING VANDAAG · GESCHAT</span><b>{{money(d.energyCosts?.today?.batterySaving)}}</b><small>Totaal {{money(d.energyCosts?.total?.batterySaving)}}</small></article>
 <article class="metric tone-ev" v-for="car in ['audi','jeep']" :key="'cost-'+car"><span>{{car.toUpperCase()}} · LAADKOSTEN VANDAAG</span><b>{{money(d.energyCosts?.today?.[car+'UnpricedKwh']>0?null:d.energyCosts?.today?.[car+'Cost'])}}</b><small>Totaal {{money(d.energyCosts?.total?.[car+'UnpricedKwh']>0?null:d.energyCosts?.total?.[car+'Cost'])}}</small><small>Besparing direct laden: {{money(d.energyCosts?.cars?.[car]?.saving)}}</small></article>
 <article class="metric tone-sun"><span>TERUGLEVEROPBRENGST VANDAAG</span><b>{{money(d.energyCosts?.today?.exportUnpricedKwh>0?null:d.energyCosts?.today?.exportRevenue)}}</b><small>Zonneplan basis · {{energy(d.energyCosts?.today?.exportKwh)}}</small></article>
 <article class="metric tone-sun"><span>ERE-OPBRENGST · GESCHAT</span><b>{{money(d.energyCosts?.ereEstimated)}}</b><small>Beide laadpunten · {{price(d.energyCosts?.ereNetRate)}} netto/kWh</small></article>
 </section>
 <details class="panel" style="margin-top:10px"><summary>Kosten en opbrengsten</summary><p>Vanaf {{d.energyCosts?.since?new Date(d.energyCosts.since).toLocaleString('nl-NL'):'start registratie'}}. Kwartierprijzen × gemeten vermogen; geen vaste kosten. Laadkosten waarderen alle geladen stroom tegen de kwartierprijs, ook zon en accu. Ze worden niet bij netkosten opgeteld.</p><p>Totaal teruglevering: {{money(d.energyCosts?.total?.exportUnpricedKwh>0?null:d.energyCosts?.total?.exportRevenue)}}. Basis Zonneplan: marktprijs incl. btw + €0,02/kWh, zonder jaarlijkse saldering of voorwaardelijke 10% bonus. Audi totaal: {{money(d.energyCosts?.total?.audiUnpricedKwh>0?null:d.energyCosts?.total?.audiCost)}} · Jeep totaal: {{money(d.energyCosts?.total?.jeepUnpricedKwh>0?null:d.energyCosts?.total?.jeepCost)}}.</p><p>Accubesparing is vermeden netafname minus extra netafname voor laden; zonder slijtage, omzettingsverliescorrectie of gemiste terugleververgoeding. Direct laden vergelijkt dezelfde energie vanaf een waargenomen aansluiting op het ingestelde laadvermogen. Ontbrekende aansluiting of prijzen geeft —.</p><p>ERE is een schatting voor Lekkerladen met netto circa €0,10/kWh; geen bevestigde inboeking of uitbetaling. Ontbrekende metingen: {{Number(d.energyCosts?.total?.missingHours||0).toLocaleString('nl-NL',{maximumFractionDigits:1})}} uur.</p><label>ERE netto €/kWh <input type="number" min="0" max="2" step="0.001" :value="d.energyCosts?.ereNetRate??0.10" @change="send({topic:'ess/costs/ere-net-rate',payload:Number($event.target.value)})"></label></details>`;
    ui.format=ui.format.replace('  <section class="quick-actions"',tile+'\n  <section class="quick-actions"');
    ui.format=ui.format.replace('Beide laadpunten · {{price(d.energyCosts?.ereNetRate)}} netto/kWh','{{energy(d.energyCosts?.ereKwh)}} · beide laadpunten');
    ui.format=ui.format.replace('</label></details>',`</label><p>ERE-beginstand: {{money(d.energyCosts?.ereOpening?.euros)}} voor {{energy(d.energyCosts?.ereOpening?.kwh)}}. Dit bedrag blijft apart van de nieuwe schatting.</p><div class="control-row"><label>Beginstand kWh <input ref="ereOpeningKwh" type="number" min="0" step="0.001"></label><label>Beginstand € <input ref="ereOpeningEuros" type="number" min="0" step="0.01"></label><button class="touch-button" @click="send({topic:'ess/costs/ere-opening',payload:{kwh:$refs.ereOpeningKwh.value===''?null:Number($refs.ereOpeningKwh.value),euros:$refs.ereOpeningEuros.value===''?null:Number($refs.ereOpeningEuros.value),at:new Date().toISOString()}})">Beginstand opslaan</button></div></details>`);
    const openingCode=costEreOpening.toString()+`\nif(msg.topic!=='ess/costs/ere-opening'&&!msg.ereOpeningFile)return null;
if(msg.ereOpeningFile&&flow.get('ess_ere_opening_balance'))return null;
let data=msg.payload;try{if(typeof data==='string')data=JSON.parse(data);}catch{return null;}
const balance=costEreOpening(data,flow.get('ess_energy_cost_ledger'),Date.now());if(!balance)return null;
flow.set('ess_ere_opening_balance',balance);return {payload:Date.now()};`;
    flows.push({id:'esscosts_opening',type:'function',z,g:'esseditor_config',name:'ERE beginstand zonder dubbeltelling',func:openingCode,outputs:1,wires:[['essprefs_save','ess00000000000a']]});
    flows.push({id:'esscosts_opening_tick',type:'inject',z,g:'esseditor_config',name:'Lees privé ERE-beginstand',props:[{p:'ereOpeningFile',v:'true',vt:'bool'}],once:true,onceDelay:20,wires:[['esscosts_opening_read']]});
    flows.push({id:'esscosts_opening_read',type:'file in',z,g:'esseditor_config',name:'Lees ERE-beginstand buiten Git',filename:'/config/node-red/ess-ere-opening-balance.json',filenameType:'str',format:'utf8',allProps:true,sendError:false,wires:[['esscosts_opening']]});
    flows.push({id:'esscosts_settings',type:'function',z,g:'esseditor_config',name:'ERE netto vergoeding instellen',func:"if(msg.topic!=='ess/costs/ere-net-rate'||typeof msg.payload!=='number'||!Number.isFinite(msg.payload)||msg.payload<0||msg.payload>2)return null;flow.set('ess_ere_net_rate',msg.payload);return {payload:Date.now()};",outputs:1,wires:[['essprefs_save','ess00000000000a']]});
    ui.wires[0].push('esscosts_settings','esscosts_opening');
    const ev=get('esstpl_ev0000001');
    // Each vehicle card uses only its own cost counters.
    ev.format=ev.format.replace(/<article class="panel ess-ev-control"[\s\S]*?<\/article>/g,card=>{
        const car=card.includes('aria-label="Audi laadregeling"')?'audi':'jeep';
        return card.replace('<h3>Laadplanning</h3>',`<div class="metric-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="metric"><span>LAADKOSTEN VANDAAG</span><b>{{money(d.energyCosts?.today?.${car}UnpricedKwh>0?null:d.energyCosts?.today?.${car}Cost)}}</b></div><div class="metric"><span>TOTALE LAADKOSTEN</span><b>{{money(d.energyCosts?.total?.${car}UnpricedKwh>0?null:d.energyCosts?.total?.${car}Cost)}}</b></div></div><h3>Laadplanning</h3>`);
    });
};
module.exports.costLedgerStep=costLedgerStep;
module.exports.costLedgerValid=costLedgerValid;
module.exports.costDirectBaseline=costDirectBaseline;
module.exports.costEreOpening=costEreOpening;
