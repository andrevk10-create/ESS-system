const assert=require('node:assert/strict');
const {witKnownPricePlan:plan}=require('../scripts/lib/wit-known-price-plan');
{
 const {witRunningBlock:keep}=require('../scripts/lib/wit-running-block');
 const now=1800000000000, end=now+120000;
 const current={start:now-60000,end,powerKw:8,energyKwh:.4,allInPrice:.2};
 const previous={sessionOwned:true,selectedSlots:[current]};
 const prices=[{start:now-60000,end:now+600000,allInPrice:.2,sharedChargeKw:5}];
 const future=[{start:now+60000,end:now+900000,powerKw:8,energyKwh:8*840000/3600000,allInPrice:.2}];
 const held=keep(future,previous,prices,now,8);
 assert.equal(held[0].start,now);assert.equal(held[0].end,end,'Never extend the original block');
 assert.equal(held[0].powerKw,5,'Respect shared capacity');
 assert.equal(held[1].start,end,'No overlapping purchased energy');
 assert(Math.abs(held.reduce((sum,s)=>sum+s.energyKwh,0)-future[0].energyKwh)<1e-9,'Holding a block never increases purchases');
 const tiny=keep([{...future[0],energyKwh:.01}],previous,prices,now,8);
 assert(Math.abs(tiny[0].energyKwh-.01)<1e-9,'Small remaining demand shortens the held block');
 assert.deepEqual(keep([],previous,prices,now,8),[],'No charge when the new plan needs no energy');
 for(const p of [{...previous,sessionOwned:false},{...previous,releasing:true}])assert.equal(keep(future,p,prices,now,8),future);
 assert.equal(keep(future,previous,[{...prices[0],allInPrice:.5}],now,8),future,'Do not retain a changed price');
 assert.equal(keep(future,previous,[{...prices[0],sharedChargeKw:0}],now,8),future);
 assert.equal(keep(future,previous,prices,end,8),future,'Expired blocks cannot restart');
 assert.equal(keep([current],previous,prices,now,8)[0],current,'Do not replace an already running new plan');
}
const now=Date.parse('2026-10-18T18:00:00Z'),hour=3600000;
const prices=Array.from({length:30*4},(_,i)=>{const h=i/4;return h<4?.45:h<12?.34:h<17?.48:h<21?.26+(i%4)*.001:h<25?.52:.38;});
const slots=prices.map((allInPrice,i)=>({start:now+i*hour/4,end:now+(i+1)*hour/4,allInPrice}));
const r={storedKwh:18,capacityKwh:30,houseKwh:36,efficiency:.9,chargeKw:8,targetSoc:100,solarFactor:.65};
const forecast={valid:false};
{
 const {witSolarWindow}=require('../scripts/lib/wit-runtime');
 const at=new Date(2026,9,19,21).getTime();
 const s={'sun.sun':{state:'below_horizon',attributes:{next_rising:new Date(2026,9,20,8).toISOString(),next_setting:new Date(2026,9,20,18).toISOString()}}};
 const value=(n,age)=>({state:String(n),attributes:{unit_of_measurement:'kWh'},last_updated:new Date(at-age).toISOString()});
 for(const [i,n]of [15.103,14.781,14.153].entries()){
  const suffix=i?'_'+(i+1):'';
  s['sensor.energy_production_today'+suffix]=value(7,8*hour);
  s['sensor.energy_production_tomorrow'+suffix]=value(n,8*hour);
 }
 const good=witSolarWindow(s,{},at,null,true);
 assert(good.tomorrowValid);
 assert(Math.abs(good.tomorrowKwh-44.037)<1e-8,'Unchanged same-day tomorrow totals survive the old 3-hour threshold');
 const daytime=witSolarWindow({...s,'sun.sun':{...s['sun.sun'],state:'above_horizon'}},{},at,null,true);
 assert.equal(daytime.tomorrowKwh,good.tomorrowKwh,'Validity cannot flip just because the sun crosses the horizon');
 const nextDay=new Date(2026,9,20,12).getTime();
 assert.equal(witSolarWindow(s,{},nextDay,null,true).tomorrowValid,false,'Yesterday tomorrow is not silently relabelled as a new tomorrow');
 const dawn=new Date(2026,9,20,4).getTime();
 const rolled=witSolarWindow(s,{},dawn,null,true);
 assert(Math.abs(rolled.todayRemainingKwh-44.037)<1e-8,'Before sunrise yesterday tomorrow describes today');
 assert.equal(rolled.tomorrowValid,false);
 s['sensor.energy_production_tomorrow'].state='unavailable';
 assert.equal(witSolarWindow(s,{},at,null,true).tomorrowValid,false,'Unavailable values cannot be kept alive by a date');
 s['sensor.energy_production_tomorrow']=value(15,40*hour);
 assert.equal(witSolarWindow(s,{},at,null,true).tomorrowValid,false,'Old daily data beyond the age bound is rejected');
}
let result=plan(slots,now,r,forecast,{});
assert.equal(result.horizon,now+30*hour,'All published prices beyond 24 hours remain known');
assert.equal(result.deadline,now+21*hour,'Refill deadline is the afternoon price rise, not the morning peak');
assert(result.bridgeEnergyKwh>0,'Winter consumption requires a real reserve bridge');
assert(result.refillEnergyKwh>0,'Plan a separate final refill');
assert(result.selectedSlots.some(s=>s.start>=now+17*hour),'Cheap afternoon charging must be visible immediately');
assert(result.selectedSlots.every(s=>s.allInPrice<.35),'No scattered expensive charging');
assert(result.targetReachedSoc>=99.99);
assert(result.reserveShortfallKwh<.001,'The bridge covers every intervening reserve checkpoint');
assert(result.minimumSoc>=20-.001);
assert(result.selectedSlots.every(s=>s.powerKw===8),'Every selected block charges at full available power');
assert(result.selectedSlots.every(s=>s.energyKwh<=8*(s.end-s.start)/hour+1e-8));
// Independently replay the physical energy balance at minute resolution,
// including partial final quarters and the hardware lower limit.
function replay(p,reserve){let stored=reserve.storedKwh,min=stored,max=stored;for(let t=now;t<p.deadline;t+=60000){const end=Math.min(t+60000,p.deadline),energy=p.selectedSlots.reduce((sum,s)=>sum+Math.max(0,Math.min(end,s.end)-Math.max(t,s.start))/hour*s.powerKw,0);const chargeMs=p.selectedSlots.reduce((sum,s)=>sum+Math.max(0,Math.min(end,s.end)-Math.max(t,s.start)),0);stored+=energy*reserve.efficiency-reserve.houseKwh*((end-t)-chargeMs)/86400000;min=Math.min(min,stored);max=Math.max(max,stored);}return {stored,min,max};}
const physical=replay(result,r);
assert(physical.max<=30.0001,'Plan never promises energy beyond physical storage');
assert(physical.min>=6-.001);
assert(physical.max>=29.999,'Reach the target once; later consumption does not demand top-ups');
const full=plan(slots,now,{...r,storedKwh:30,houseKwh:10},forecast,{});
assert.equal(full.bridgeEnergyKwh,0,'Enough existing reserve avoids night charging');
assert(full.selectedSlots.every(s=>s.start>=now+17*hour));
const solarStates={'sun.sun':{attributes:{next_rising:'2026-10-19T06:00:00Z',next_setting:'2026-10-19T16:30:00Z'}}};
const sunny=plan(slots,now,r,{valid:true,forecastDate:'2026-10-19',tomorrowKwh:30,todayRemainingKwh:0},solarStates);
const sum=p=>p.selectedSlots.reduce((n,s)=>n+s.energyKwh,0);
assert(sum(sunny)<sum(result),'Conservative forecast solar reduces grid purchases');
{
 const {witSolarWindow}=require('../scripts/lib/wit-runtime');
 const {witSolarBeforeDeadline}=require('../scripts/lib/wit-price-deadline');
 const at=new Date(2026,9,19,12).getTime(),day='2026-10-19';
 const s={'sun.sun':{state:'above_horizon',attributes:{next_rising:new Date(2026,9,20,8).toISOString(),next_setting:new Date(2026,9,19,18).toISOString()}}};
 const remaining=[5.008,5.308,3.819];
 for(const [i,v]of remaining.entries()){
  const suffix=i?'_'+(i+1):'';
  const item=(n,age)=>({state:String(n),attributes:{unit_of_measurement:'kWh'},last_updated:new Date(at-age).toISOString()});
  s['sensor.energy_production_today'+suffix]=item(v+2,hour);
  s['sensor.energy_production_today_remaining'+suffix]=item(v,hour);
  s['sensor.energy_production_tomorrow'+suffix]=item(15,27*hour);
 }
 const solar=witSolarWindow(s,{},at,null,true);
 assert.equal(solar.valid,false,'Rolling tomorrow input remains honestly unavailable');
 assert.equal(solar.todayValid,true);
 assert(Math.abs(solar.todayRemainingKwh-14.135)<1e-8);
 assert.equal(solar.tomorrowKwh,null);
 const deadline=at+4*hour;
 assert(witSolarBeforeDeadline(solar,s,at,deadline)>0,'Fresh today survives stale tomorrow');
 assert.equal(witSolarBeforeDeadline({...solar,todayValid:false},s,at,deadline),0,'Missing today cannot earn credit from tomorrow');
 const prices=Array.from({length:24},(_,i)=>({start:at+i*hour/4,end:at+(i+1)*hour/4,allInPrice:i<16?.25:.5}));
 const reserve={...r,storedKwh:12,houseKwh:40};
 const withSun=plan(prices,at,reserve,solar,s),withoutSun=plan(prices,at,reserve,{valid:false},s);
 assert(withSun.solarKwh>0);
 assert(sum(withSun)<sum(withoutSun),'Known afternoon solar must reduce planned net charging');
 const fillEnd=withSun.selectedSlots.at(-1).end;
 const sunUntilFill=witSolarBeforeDeadline(solar,s,at,fillEnd)*.35*r.efficiency;
 const expectedStored=reserve.storedKwh+sum(withSun)*r.efficiency-reserve.houseKwh*((fillEnd-at)-withSun.selectedSlots.reduce((total,s)=>total+s.end-s.start,0))/(24*hour)+sunUntilFill;
 assert(Math.abs(expectedStored-30)<.01,'Independently balance purchases, consumption and one solar credit at refill completion');
 assert(withSun.targetReachedSoc>=99.99,'Solar-aware charging reaches the target during the refill window');
 assert(withSun.projectedSoc<=withSun.targetReachedSoc+.001,'Deadline SOC honestly includes consumption after filling');
}
assert(sunny.targetReachedSoc>=99.99);
{
 const at=Date.parse('2026-10-19T13:00:00Z');
 const prices=Array.from({length:33*4},(_,i)=>{const h=i/4;return {start:at+i*hour/4,end:at+(i+1)*hour/4,allInPrice:h<2?.34:h<7?.50:h<17?.33:h<21?.48:h<26?.25:.52};});
 const reserve={...r,storedKwh:27.6,houseKwh:40.236,chargeKw:3.246};
 const s={'sun.sun':{attributes:{next_rising:'2026-10-20T06:00:00Z',next_setting:'2026-10-19T16:00:00Z'}}};
 const sun={valid:true,todayDate:'2026-10-19',tomorrowDate:'2026-10-20',todayValid:true,tomorrowValid:true,todayRemainingKwh:7,tomorrowKwh:42};
 const tomorrow=plan(prices,at,reserve,sun,s),todayOnly=plan(prices,at,reserve,{...sun,tomorrowValid:false},s);
 const night=p=>p.selectedSlots.filter(s=>s.start< Date.parse('2026-10-20T06:00:00Z')).reduce((n,s)=>n+s.energyKwh,0);
 assert(tomorrow.solarKwh>todayOnly.solarKwh,'Daytime replan must include tomorrow before tomorrow deadline');
 assert(sum(tomorrow)<sum(todayOnly)-5,'Tomorrow sun substantially reduces total net purchases');
 assert(night(tomorrow)<night(todayOnly),'A near-full tapered battery must not plan an oversized night bridge because tomorrow sun was discarded');
 assert(tomorrow.targetReachedSoc>=99.99);
 assert(tomorrow.minimumSoc>=20-.001);
}
const restricted=plan(slots,now,{...r,chargeKw:.1},forecast,{});
assert(restricted.remainingEnergyKwh>0&&restricted.reserveShortfallKwh>0,'Insufficient power is reported rather than inventing a feasible schedule');
const flat=plan(slots.map(s=>({...s,allInPrice:.35})),now,r,forecast,{});
assert.equal(flat.selectedSlots.length,0,'Unprofitable flat rates use the grid directly rather than forced cycling');
const earlier=slots.map(s=>({...s,allInPrice:s.start>=now+17*hour&&s.start<now+19*hour?.20:s.allInPrice}));
const early=plan(earlier,now,{...r,houseKwh:10},forecast,{});
assert(early.selectedSlots.some(s=>s.start<now+19*hour&&s.allInPrice===.20),'Earlier cheaper daytime quarters are actually used');
const lateCheap=slots.map(s=>({...s,allInPrice:s.start>=now+27*hour?.52:s.start>=now+25*hour?.18:s.allInPrice}));
const late=plan(lateCheap,now,{...r,houseKwh:10},forecast,{});
assert(late.selectedSlots.some(s=>s.start>=now+25*hour),'Known cheap prices outside 24 hours can be selected');
assert.equal(plan([],now,r,forecast,{}).selectedSlots.length,0);
const lower=plan(slots,now,{...r,targetSoc:80},forecast,{});
assert(lower.targetReachedSoc>=79.99&&lower.targetReachedSoc<=80.001,'The chosen target is reached without holding it until the deadline');
assert(replay(lower,{...r,targetSoc:80}).max<=24.001,'Bridge charging also respects a lower configured target');
const zeroPower=plan(slots,now,{...r,chargeKw:0},forecast,{});
assert(zeroPower.remainingEnergyKwh>0&&zeroPower.selectedSlots.length===0,'A zero BMS limit is never reported as a complete plan');
const gap=plan(slots.filter(s=>s.start>=now+16*hour),now,r,forecast,{});
assert(gap.reserveShortfallKwh>0,'Unknown early prices cannot produce fictitious bridge slots');
for(const shift of [86400000,7*86400000,13*86400000]){
    const moved=plan(slots.map(s=>({...s,start:s.start+shift,end:s.end+shift})),now+shift,r,forecast,{});
    assert(Math.abs(sum(moved)-sum(result))<.001,'Other dates and the daylight-saving boundary do not change the energy arithmetic');
}
// A full cheap refill may fall with household use afterwards: no costly
// maintenance pulses, including on the next controller tick.
{
 const prices=Array.from({length:16},(_,i)=>({start:now+i*hour/4,end:now+(i+1)*hour/4,allInPrice:i<4?.2:i<12?.3:.6}));
 const reserve={...r,storedKwh:27,houseKwh:48};
 const p=plan(prices,now,reserve,forecast,{});
 assert(p.selectedSlots.every(s=>s.allInPrice===.2),'Use available cheap quarters instead of later expensive top-ups');
 assert(p.selectedSlots.some(s=>s.end-s.start===hour/4),'Fill complete cheap quarters where capacity allows');
 assert(p.targetReachedSoc>=99.99&&p.projectedSoc<99,'Target is reached before the boundary and may subsequently fall');
 assert(p.remainingEnergyKwh<.001);
 const reached=plan(prices,now,{...reserve,storedKwh:30},forecast,{});
 assert(reached.goal.reached);
 assert(plan(prices,now,{...reserve,storedKwh:29.95},forecast,{}).goal.reached,'A virtually full battery needs no automatic refill');
 const rearmed=plan(prices,now+60000,{...reserve,storedKwh:26.9,previousGoal:reached.goal},forecast,{});
 assert(!rearmed.goal.reached&&rearmed.selectedSlots.length>0,'A ten-point SOC drop rearms a genuine refill');
 const next=plan(prices,now+60000,{...reserve,storedKwh:29.8,previousGoal:reached.goal},forecast,{});
 assert.equal(next.selectedSlots.length,0,'Replanning after reaching the target must not restart top-ups');
 const changed=plan(prices,now+60000,{...reserve,storedKwh:28.9,previousGoal:{...reached.goal,deadline:reached.goal.deadline-1}},forecast,{});
 assert.equal(changed.goal.reached,false,'A different deadline resets the achieved goal');
 const rescue=plan(prices,now+60000,{...reserve,storedKwh:6,previousGoal:reached.goal},forecast,{});
 assert(rescue.selectedSlots.length>0,'An achieved target never disables minimum-reserve protection');
 assert(rescue.minimumSoc>=20-.01);
 const congested=prices.map((s,i)=>({...s,sharedChargeKw:i<4?0:8}));
 const waiting=plan(congested,now,reserve,forecast,{});
 assert(waiting.selectedSlots.every(s=>s.start>=now+hour),'Cheap EV-occupied quarters cannot be claimed by the battery');
}
const code=require('../flows.json').find(n=>n.id==='esswitgrid_ctrl1').func;
assert(code.includes('witKnownPricePlan(sharedPriceSlots,now,{...reserveInputs,hourlyProfile:houseTimeProfile}'));
assert(!code.includes('const horizonEnd = now + planningHorizonMs;'));
assert(code.includes('projectedSocAtDeadline:'));
assert(require('../flows.json').find(n=>n.id==='esstpl_battery01').format.includes('knownEnd=Date.parse(smart.knownPriceUntil'),'The timeline also displays the extended horizon');
console.log('Known WIT prices: full horizon, winter bridge, afternoon refill, physical capacity, full power, solar, economics and infeasibility passed');

for(const shift of [0,86400000,7*86400000]){
 const t=Date.parse('2026-11-09T08:00:00Z')+shift;
 const prices=Array.from({length:60},(_,i)=>({start:t+i*900000,end:t+(i+1)*900000,allInPrice:i<12?.62:i<24?.49:i<44?.89:.40}));
 const p=plan(prices,t,{...r,storedKwh:28.5,houseKwh:58,chargeKw:8},forecast,{});
 assert(p.selectedSlots.length>0,'A full morning battery must prepare for the evening');
 assert(p.selectedSlots.every(s=>s.allInPrice===.49),'Use midday cheap prices, not the expensive morning');
 assert(p.deadline<=t+24*900000,'Refill before evening, not after it');
 assert(p.targetReachedSoc>99.9);
}

// 30 kWh battery at 10%: 27 kWh stored / 90% efficiency = 30 kWh,
// hence 3.75 charging hours at 8 kW, regardless of separately supplied house load.
{
 const t=Date.parse('2026-11-18T08:00:00Z');
 const prices=Array.from({length:32},(_,i)=>({start:t+i*900000,end:t+(i+1)*900000,allInPrice:i<24?.2:.6}));
 for(const houseKwh of [0,24,72,120]){
  const p=plan(prices,t,{...r,storedKwh:3,houseKwh},forecast,{});
  const purchased=p.selectedSlots.reduce((total,s)=>total+s.energyKwh,0);
  assert(Math.abs(purchased-30)<.01,'House supplied during charging must not lengthen a 30 kWh fill: '+houseKwh);
  assert(Math.abs(p.selectedSlots.reduce((total,s)=>total+(s.end-s.start)/hour,0)-3.75)<.002);
  assert(p.targetReachedSoc>99.99);
 }
}
// Compact fragments by joining neighbours; retain tariff boundaries for costing.
{
 const t=Date.parse('2026-11-18T08:00:00Z');
 const tariffs=[.202,.206,.207,.207,.206,.207,.203,.201,.201,.204,.205,.208,.203,.206,.203,.2,.201,.207,.208,.206,.201,.203,.202,.204,.6,.6,.6,.6,.6,.6,.6,.6];
 const prices=tariffs.map((allInPrice,i)=>({start:t+i*900000,end:t+(i+1)*900000,allInPrice}));
 const reserve={...r,storedKwh:19.819232847,houseKwh:78.826090140,solarFactor:0};
 const p=plan(prices,t,reserve,forecast,{});
 let runs=0,end=-1;
 for(const s of p.selectedSlots){if(s.start>end+1)runs++;assert(s.start>=end,'No overlaps');end=s.end;assert.equal(s.powerKw,8);}
 assert(runs<=6,'Former seven-start plan must consolidate at least one restart');
 assert(sum(p)<=22.80510215,'Compaction does not buy extra energy');
 const oldCost=2*(.202+.203+.201+.201+.203+.203+.2+.201+.201+.203+.202)+(.178572026+.626530124)*.204;
 assert(p.selectedSlots.reduce((total,s)=>total+s.energyKwh*s.allInPrice,0)<=oldCost+1e-6,'Compaction must not increase costs');
 const fragment=p.selectedSlots.find(s=>s.start===t+9*900000);
 assert(fragment&&fragment.end<t+10*900000,'Partial quarter joins the previous block instead of starting at the end');
 // Independent exact event replay, including the newly front-aligned partial end.
 let stored=reserve.storedKwh,peak=stored,min=stored;
 const events=[...new Set([t,p.deadline,...p.selectedSlots.flatMap(s=>[s.start,s.end])])].sort((a,b)=>a-b);
 for(let i=1;i<events.length;i++){
  const from=events[i-1],to=events[i];
  const charge=p.selectedSlots.find(s=>s.start<=from&&s.end>=to);
  stored+=(to-from)/hour*(charge?charge.powerKw*reserve.efficiency:-reserve.houseKwh/24);
  min=Math.min(min,stored);peak=Math.max(peak,stored);
 }
 assert(min>=6-.001&&peak<=30.001&&peak>=29.999,'Compaction preserves physical reserve and target');
 const blocked=prices.map((s,i)=>({...s,sharedChargeKw:i===9?0:8}));
 const evPlan=plan(blocked,t,reserve,forecast,{});
 assert(evPlan.selectedSlots.every(s=>s.end<=t+9*900000||s.start>=t+10*900000),'Consolidation never crosses EV reservations');
}
// Once the target is physically attained, the allocator must stop inside its
// current pass, rather than consuming the rest of an outdated energy deficit.
{
 const t=Date.parse('2026-11-18T08:00:00Z');
 const prices=Array.from({length:32},(_,i)=>({start:t+i*900000,end:t+(i+1)*900000,allInPrice:i<20?.26+(i%3)*.001:.6}));
 const p=plan(prices,t,{...r,storedKwh:3.3,houseKwh:67,solarFactor:0},forecast,{});
 assert(p.targetReachedSoc>=99.99);
 const end=p.selectedSlots.at(-1).end;
 const again=plan(prices,end,{...r,storedKwh:29.9,houseKwh:67,previousGoal:{...p.goal,reached:true,reachedAt:end}},forecast,{});
 assert.equal(again.selectedSlots.length,0,'A small SOC dip after filling cannot restart maintenance pulses');
}
