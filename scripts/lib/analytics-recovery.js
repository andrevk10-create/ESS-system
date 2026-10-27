// Analytics only. HA Recorder holds a state until its next change; explicit
// unknown/unavailable states break coverage. This never supplies control data.
function analyticsDayBounds(now,offset=0){
    const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'});
    const today=fmt.format(new Date(now));
    const key=new Date(Date.parse(today+'T12:00:00Z')-offset*86400000).toISOString().slice(0,10);
    const noon=Date.parse(key+'T12:00:00Z');
    let start=noon-18*3600000,end=noon+18*3600000;
    while(fmt.format(new Date(start))!==key)start+=60000;
    end=start;while(fmt.format(new Date(end))===key)end+=3600000;
    return {key,start,end};
}
function analyticsReplay(rows,mapped,start,end,archive=[]){
    const reverse=Object.fromEntries(Object.entries(mapped).filter(([,id])=>id).map(([role,id])=>[id,role]));
    const events=rows.map(e=>({role:reverse[e.entity_id],state:e.state,attributes:e.attributes||{},at:Date.parse(e.last_updated||e.last_changed)}))
        .filter(e=>e.role&&Number.isFinite(e.at)&&e.at<=end).sort((a,b)=>a.at-b.at);
    const states={},hours=Array.from({length:24},()=>({kwh:0,seconds:0})),quarters={};
    const cars={audi:{kwh:0,cost:0,unpriced:0,seconds:0},jeep:{kwh:0,cost:0,unpriced:0,seconds:0}};
    const hourFormat=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Amsterdam',hour:'2-digit',hourCycle:'h23'});
    const localHour=t=>Number(hourFormat.format(new Date(t)));
    const prices=archive.filter(s=>s&&Number.isFinite(s.start)&&Number.isFinite(s.end)&&Number.isFinite(s.price)&&s.end>start&&s.start<end).sort((a,b)=>a.start-b.start);
    let priceIndex=0;
    const numeric=role=>{const s=states[role];return s&&s.state!==''&&!['unknown','unavailable'].includes(s.state)&&Number.isFinite(Number(s.state))?Number(s.state):null;};
    const watts=role=>{const n=numeric(role),unit=String(states[role]?.attributes?.unit_of_measurement||'').toLowerCase();return n===null?null:unit==='w'?n:unit==='kw'?n*1000:null;};
    const charger=suffix=>{
        const prefix='sensor.ev_charger'+suffix;
        if(!mapped[prefix+'_power']&&!mapped[prefix+'_status'])return 0;
        const status=String(states[prefix+'_status']?.state||'').toLowerCase(),p=watts(prefix+'_power');
        if(['disconnected','no_car_connected','awaiting_start','awaiting_authorization','ready_to_charge','completed','finished','paused','stopped','standby','idle'].includes(status))return p===0?0:null;
        return status==='charging'&&p>100&&p<=44000?p:null;
    };
    let cursor=start,index=0,seconds=0,kwh=0;
    while(cursor<end){
        while(index<events.length&&events[index].at<=cursor){const e=events[index++];states[e.role]=e;}
        const to=Math.min(end,events[index]?.at??end,(Math.floor(cursor/900000)+1)*900000);
        if(to<=cursor)break;
        const dt=(to-cursor)/1000,a=charger(''),j=charger('_2'),grid=watts('sensor.p1_meter_vermogen'),output=watts('sensor.growatt_solar_system_output_power');
        const night=states['sun.sun']?.state==='below_horizon';
        const pv=[1,2,3].map(n=>{const r='sensor.pv_array_'+n+'_power';return mapped[r]?watts(r):0;});
        const house=grid===null||output===null||!night&&pv.some(p=>p===null)?null:Math.max(0,grid+output+(night?0:pv.reduce((s,p)=>s+p,0)));
        const base=house!==null&&a!==null&&j!==null&&a+j<=house+100?Math.max(0,house-a-j):null;
        if(base!==null&&base<=100000){const e=base*dt/3600000;hours[localHour(cursor)].kwh+=e;hours[localHour(cursor)].seconds+=dt;kwh+=e;seconds+=dt;}
        while(priceIndex<prices.length&&prices[priceIndex].end<=cursor)priceIndex++;
        const tariff=prices[priceIndex];
        let price=tariff?.start<=cursor&&tariff?.end>=to?tariff.price:null;
        if(!Number.isFinite(price)){
            const role='sensor.nord_pool_nl_huidige_prijs',market=numeric(role),s=states[role];
            const unit=String(s?.attributes?.unit_of_measurement||'').toLowerCase();
            // Same supplier calculation as the live planner. Never carry a
            // current-price state over a missing tariff quarter.
            if(market!==null&&/eur|€/.test(unit)&&/kwh|mwh/.test(unit)&&Math.floor(s.at/900000)===Math.floor(cursor/900000))
                price=market*(unit.includes('mwh')?.001:1)*1.21+.11085+.02;
        }
        for(const [name,p] of [['audi',a],['jeep',j]]){
            const c=cars[name];if(p===null)continue;
            const quarter=quarters[Math.floor(cursor/900000)*900000]??={};
            const q=quarter[name]??={kwh:0,cost:0,unpriced:0,seconds:0};
            const energy=p*dt/3600000;c.kwh+=energy;c.seconds+=dt;
            q.kwh+=energy;q.seconds+=dt;
            const allocation=house!==null&&grid!==null&&a!==null&&j!==null&&a+j<=house+100;
            if(energy>0&&(!allocation||!Number.isFinite(price)&&grid>0)){c.unpriced+=energy;q.unpriced+=energy;}
            else if(energy>0&&grid>0){const cost=energy*Math.min(1,grid/Math.max(house,a+j,p,1))*price;c.cost+=cost;q.cost+=cost;}
        }
        cursor=to;
    }
    return {start,end,seconds,kwh,hours,cars,quarters};
}
function analyticsRecoveryRequest(flow,now){
    if(flow.get('ess_charging_preferences_ready')!==true)return null;
    const pending=flow.get('ess_analytics_pending');if(pending&&now-pending.at<120000)return null;
    const config=flow.get('ess_system_config')||{},mapping=config.entities||{};
    const roles=['sensor.p1_meter_vermogen','sensor.growatt_solar_system_output_power','sensor.nord_pool_nl_huidige_prijs','sun.sun',
        ...[1,2,3].map(n=>'sensor.pv_array_'+n+'_power'),...['','_2'].flatMap(s=>['power','status'].map(r=>'sensor.ev_charger'+s+'_'+r))];
    const mapped=Object.fromEntries(roles.map(r=>[r,Object.hasOwn(mapping,r)?mapping[r]:r]).filter(([,id])=>id));
    const binding=JSON.stringify(mapped),done=flow.get('ess_energy_cost_ledger')?.analyticsRecovered||flow.get('ess_analytics_recovered')||{};
    // Recover one day per request. Yesterday first, then older missing days;
    // once caught up, refresh today's finished quarters every five minutes.
    let bounds;
    for(let n=1;n<=30;n++){const b=analyticsDayBounds(now,n);if(done[b.key]?.binding!==binding){bounds=b;break;}}
    const sequence=flow.get('ess_analytics_sequence')||0;
    if(sequence%2===1)bounds=null;
    flow.set('ess_analytics_sequence',sequence+1);
    bounds??=analyticsDayBounds(now);
    const end=Math.min(bounds.end,Math.floor(now/900000)*900000);
    if(end<=bounds.start)return null;
    const request={...bounds,end,mapped,binding,at:now};flow.set('ess_analytics_pending',request);
    return {analyticsRequest:request,payload:{startDate:new Date(bounds.start).toISOString(),endDate:new Date(end).toISOString(),entityId:[...new Set(Object.values(mapped))].join(','),entityIdType:'equals',flatten:false}};
}
function analyticsRecoveryApply(flow,msg,now){
    const r=msg.analyticsRequest,pending=flow.get('ess_analytics_pending');
    if(!r||r.at!==pending?.at||r.binding!==pending.binding)return null;
    flow.set('ess_analytics_pending',null);
    const config=flow.get('ess_system_config')||{};
    if(Object.entries(r.mapped).some(([role,id])=>(Object.hasOwn(config.entities||{},role)?config.entities[role]:role)!==id))return null;
    const rows=Array.isArray(msg.payload)?msg.payload.flat():null;
    if(!rows||!rows.length||rows.length>250000)return null;
    const ledger=flow.get('ess_energy_cost_ledger');
    const recovered=analyticsReplay(rows,r.mapped,r.start,r.end,ledger?.priceArchive||[]);
    const complete=r.end===analyticsDayBounds(r.start).end;
    const profile=flow.get('ess_house_time_profile'),learning=flow.get('ess_house_consumption_learning');
    if(complete&&recovered.seconds>=18*3600&&learning?.schemaVersion===2&&profile?.version===1){
        const prior=profile.days[r.key]||[];
        const oldSeconds=prior.reduce((s,h)=>s+h.seconds,0);
        if(recovered.seconds>=oldSeconds){
            profile.days[r.key]=recovered.hours;
            profile.days=Object.fromEntries(Object.entries(profile.days).sort(([a],[b])=>a.localeCompare(b)).slice(-31));
            const value=recovered.kwh*(r.end-r.start)/1000/recovered.seconds;
            if(value>=.5&&value<=200){
                learning.recentDays=[...(learning.recentDays||[]).filter(d=>d.date!==r.key),{date:r.key,kwh:value,source:'HA Recorder'}].sort((a,b)=>a.date.localeCompare(b.date)).slice(-30);
                learning.forecastKwh=learning.recentDays.reduce((s,d)=>s+d.kwh,0)/learning.recentDays.length;
                flow.set('ess_house_consumption_learning',learning);flow.set('ess_house_time_profile',profile);
            }
        }
    }
    // Replace a completed day only when charger, source allocation and price
    // history are complete. Delta booking makes repeated recovery idempotent.
    if(ledger?.version===2&&!ledger.days[r.key]&&r.start>=ledger.startedAt){
        ledger.days[r.key]=Object.fromEntries(Object.keys(ledger.total).map(k=>[k,0]));
    }
    if(ledger?.version===2&&ledger.days[r.key]){
        const daily=ledger.days[r.key];
        const prefix=ledger.quarters.filter(q=>q.start>=r.start&&q.start<r.end);
        for(const car of ['audi','jeep']){
            const c=recovered.cars[car];
            if(r.start>=now-48*3600000){
                for(const [stamp,data]of Object.entries(recovered.quarters)){
                    const t=Number(stamp),value=data[car];
                    if(!value||value.seconds<900||value.unpriced>1e-6)continue;
                    let q=ledger.quarters.find(q=>q.start===t);
                    if(!q){q={start:t,...Object.fromEntries(Object.keys(ledger.total).map(k=>[k,0]))};ledger.quarters.push(q);}
                    if(value.kwh<q[car+'Kwh']*.95)continue;
                    const dk=value.kwh-q[car+'Kwh'],dc=value.cost-q[car+'Cost'],du=-q[car+'UnpricedKwh'];
                    for(const target of [ledger.total,daily]){target[car+'Kwh']+=dk;target[car+'Cost']+=dc;target[car+'UnpricedKwh']=Math.max(0,target[car+'UnpricedKwh']+du);}
                    ledger.cars[car].kwh+=dk;ledger.cars[car].cost+=dc;
                    if(Math.abs(dk)>1e-8||Math.abs(dc)>1e-8)ledger.cars[car].session=null;
                    q[car+'Kwh']=value.kwh;q[car+'Cost']=value.cost;q[car+'UnpricedKwh']=0;
                }
                continue;
            }
            const oldEnergy=complete?daily[car+'Kwh']:prefix.reduce((s,q)=>s+q[car+'Kwh'],0);
            const oldCost=complete?daily[car+'Cost']:prefix.reduce((s,q)=>s+q[car+'Cost'],0);
            const oldUnpriced=complete?daily[car+'UnpricedKwh']:prefix.reduce((s,q)=>s+q[car+'UnpricedKwh'],0);
            if(c.seconds<(r.end-r.start)/1000||c.unpriced>1e-6||c.kwh<oldEnergy*.95)continue;
            const deltaEnergy=c.kwh-oldEnergy,deltaCost=c.cost-oldCost;
            ledger.total[car+'Kwh']+=deltaEnergy;ledger.total[car+'Cost']+=deltaCost;
            ledger.total[car+'UnpricedKwh']=Math.max(0,ledger.total[car+'UnpricedKwh']-oldUnpriced);
            ledger.cars[car].kwh+=deltaEnergy;ledger.cars[car].cost+=deltaCost;
            daily[car+'Kwh']+=deltaEnergy;daily[car+'Cost']+=deltaCost;daily[car+'UnpricedKwh']=Math.max(0,daily[car+'UnpricedKwh']-oldUnpriced);
            // Preserve live measurements after the recovery boundary. Populate
            // the same closed-quarter records used for the next reconciliation.
            for(const [stamp,data]of Object.entries(recovered.quarters)){
                const t=Number(stamp);if(t<now-48*3600000)continue;
                let q=ledger.quarters.find(q=>q.start===t);
                if(!q){q={start:t,...Object.fromEntries(Object.keys(ledger.total).map(k=>[k,0]))};ledger.quarters.push(q);}
                q[car+'Kwh']=data[car]?.kwh||0;q[car+'Cost']=data[car]?.cost||0;q[car+'UnpricedKwh']=0;
            }
            ledger.cars[car].session=null;
            if(complete&&ledger.quality?.days?.[r.key]){
                const key=car+'MissingHours',old=ledger.quality.days[r.key][key]||0;
                ledger.quality.days[r.key][key]=0;ledger.quality.total[key]=Math.max(0,ledger.quality.total[key]-old);
            }
        }
        ledger.quarters.sort((a,b)=>a.start-b.start);ledger.quarters=ledger.quarters.slice(-192);
        ledger.days=Object.fromEntries(Object.entries(ledger.days).sort(([a],[b])=>a.localeCompare(b)).slice(-32));
        flow.set('ess_energy_cost_ledger',ledger);
    }
    const done=flow.get('ess_analytics_recovered')||{};done[r.key]={binding:r.binding,at:now,seconds:recovered.seconds};
    flow.set('ess_analytics_recovered',Object.fromEntries(Object.entries(done).sort(([a],[b])=>a.localeCompare(b)).slice(-31)));
    if(ledger){ledger.analyticsRecovered=flow.get('ess_analytics_recovered');flow.set('ess_energy_cost_ledger',ledger);}
    flow.set('ess_analytics_recovery_status',{at:now,date:r.key,seconds:recovered.seconds,cars:recovered.cars});
    return {payload:now};
}
module.exports=function apply(flows){
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('essanalytics_'))flows.splice(i,1);
    const get=id=>flows.find(n=>n.id===id),z='ess000000000001',g='esseditor_history';
    flows.push({id:'essanalytics_tick',type:'inject',z,g,name:'Herstel leren en laadkosten uit Recorder',props:[{p:'payload'}],repeat:'300',once:true,onceDelay:110,wires:[['essanalytics_request']]},
        {id:'essanalytics_request',type:'function',z,g,name:'Eén dag historie per herstelverzoek',outputs:1,func:analyticsDayBounds.toString()+'\n'+analyticsRecoveryRequest.toString()+'\nreturn analyticsRecoveryRequest(flow,Date.now());',wires:[['essanalytics_history']]},
        {...get('essp1hist_get001'),id:'essanalytics_history',name:'Lees meet- en prijshistorie',wires:[['essanalytics_apply']]},
        {id:'essanalytics_apply',type:'function',z,g,name:'Herstel zonder dubbelboeken',outputs:1,func:[analyticsDayBounds,analyticsReplay,analyticsRecoveryApply].map(f=>f.toString()).join('\n')+'\nreturn analyticsRecoveryApply(flow,msg,Date.now());',wires:[['essprefs_save']]});
};
module.exports.analyticsDayBounds=analyticsDayBounds;
module.exports.analyticsReplay=analyticsReplay;
module.exports.analyticsRecoveryRequest=analyticsRecoveryRequest;
module.exports.analyticsRecoveryApply=analyticsRecoveryApply;
