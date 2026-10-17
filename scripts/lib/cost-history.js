// Reconstruct only battery savings and EV net costs, leaving metered kWh,
// provider openings and ERE untouched. Recorder state changes are step values.
function costHistory(rows,mapped,start,end){
    const reverse=Object.fromEntries(Object.entries(mapped).map(([r,id])=>[id,r]));
    const events=rows.map(e=>({...e,role:reverse[e.id],time:Date.parse(e.at)})).filter(e=>e.role&&Number.isFinite(e.time)&&e.time<=end).sort((a,b)=>a.time-b.time);
    const states={},days={},sessions={audi:[],jeep:[]},active={};
    const day=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t));
    const number=r=>{const e=states[r];return e&&!['unknown','unavailable',''].includes(e.state)&&Number.isFinite(Number(e.state))?Number(e.state):null;};
    const watts=r=>{const n=number(r),u=String(states[r]?.unit||'').toLowerCase();return n===null||!['w','kw'].includes(u)?null:n*(u==='kw'?1000:1);};
    const slotPrices=new Map();
    const priceEvents=events.filter(e=>e.role==='sensor.nord_pool_nl_huidige_prijs');
    for(let i=0;i<priceEvents.length;i++){
        const p=priceEvents[i],n=Number(p.state);if(!Number.isFinite(n)||p.state==='')continue;
        for(let t=Math.floor(p.time/900000)*900000;t<Math.min(end,priceEvents[i+1]?.time??end);t+=900000)
            slotPrices.set(t,n*1.21+.11085+.02);
    }
    for(let i=0;i<events.length;i++){
        const e=events[i],old=states[e.role];states[e.role]=e;
        for(const [car,suffix] of [['audi',''],['jeep','_2']])if(e.role==='sensor.ev_charger'+suffix+'_status'){
            const disconnected=s=>['disconnected','no_car_connected'].includes(s);
            const connected=s=>['charging','awaiting_start','awaiting_authorization','ready_to_charge','completed','paused','stopped'].includes(s);
            if(old&&disconnected(old.state)&&connected(e.state)){const s={at:e.time,kwh:0,cost:0,powerKw:null};sessions[car].push(s);active[car]=s;}
            if(disconnected(e.state))delete active[car];
        }
        const a=Math.max(start,e.time),b=Math.min(end,events[i+1]?.time??end);if(b<=a)continue;
        const key=day(a),d=days[key]??={batterySaving:0,batteryHours:0,audiCost:0,jeepCost:0,audiPricedKwh:0,jeepPricedKwh:0};
        const h=(b-a)/3600000,market=number('sensor.nord_pool_nl_huidige_prijs');
        const price=market===null?null:market*1.21+.11085+.02;
        if(price!==null)slotPrices.set(Math.floor(a/900000)*900000,price);
        const grid=watts('sensor.p1_meter_vermogen'),battery=watts('sensor.growatt_battery_battery_power');
        if(grid!==null&&battery!==null&&Math.abs(battery)<=15000&&price!==null){d.batterySaving+=(Math.max(0,grid-battery)-Math.max(0,grid))/1000*h*price;d.batteryHours+=h;}
        const output=watts('sensor.growatt_solar_system_output_power');
        const night=states['sun.sun']?.state==='below_horizon';
        const pv=[1,2,3].map(n=>watts('sensor.pv_array_'+n+'_power'));
        const house=grid===null||output===null||!night&&pv.some(v=>v===null)?null:Math.max(0,grid+output+(night?0:pv.reduce((s,v)=>s+v,0)));
        for(const [car,suffix]of [['audi',''],['jeep','_2']]){
            const status=states['sensor.ev_charger'+suffix+'_status']?.state;
            const measured=watts('sensor.ev_charger'+suffix+'_power');
            const power=['disconnected','no_car_connected','awaiting_start','awaiting_authorization','ready_to_charge','completed','paused','stopped'].includes(status)?0:status==='charging'?measured:null;
            if(power===null||grid===null||house===null||price===null)continue;
            const energy=Math.max(0,power)/1000*h,cost=energy*Math.min(1,Math.max(0,grid)/Math.max(house,power,1))*price;
            d[car+'Cost']+=cost;d[car+'PricedKwh']+=energy;
            if(active[car]){active[car].kwh+=energy;active[car].cost+=cost;}
        }
    }
    return {start,end,days,sessions,prices:[...slotPrices].map(([start,price])=>({start,end:start+900000,price})),method:'HA Recorder state changes; no interpolation across unknown states'};
}
module.exports={costHistory};
