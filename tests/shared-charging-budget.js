const assert=require('node:assert/strict');
const {sharedSiteBudget:site,sharedEvPlanningKw,sharedWitSlotKw,sharedManualSlots}=require('../scripts/lib/shared-charging-budget');
const {witManualChargePlan:manual,witKnownPricePlan:automatic}=require('../scripts/lib/wit-known-price-plan');
const now=Date.parse('2026-10-25T00:00:00Z'),hour=3600000;
const values={ess_system_config:{specs:{phases:3,voltage:230,mainFuseA:25,evGridChargePowerKw:11,ev2GridChargePowerKw:11},entities:{'sensor.ev_charger_status':'sensor.left','sensor.ev_charger_2_status':'sensor.right'}},
    ess_house_consumption_learning:{schemaVersion:2,forecastKwh:48},ess_audi_smart_enabled:true,ess_jeep_smart_enabled:true};
for(const car of ['audi','jeep'])values['ess_'+car+'_control_status']={enabled:true,energyNeeded:30,phaseCount:3,updatedAt:new Date(now).toISOString(),selectedSlots:[]};
const flow={get:k=>values[k]};
const states={
    'sensor.ev_charger_status':{state:'ready_to_charge'},
    'sensor.ev_charger_2_status':{state:'ready_to_charge'}
};
const ev=(...args)=>sharedEvPlanningKw(...args,states);
const wit=(...args)=>sharedWitSlotKw(...args,states);
const manualSlots=(...args)=>sharedManualSlots(...args,states);
const capacity=site(flow),a=ev(flow,'audi',11,now),b=ev(flow,'jeep',11,now);
assert(a<11&&b<11);assert(a+b<=capacity.totalKw+.000001,'Both cars share one site budget after household reserve');
assert(30/a>30/11,'Shared power increases the required charging time');
for(const car of ['audi','jeep'])values['ess_'+car+'_control_status'].selectedSlots=[{start:new Date(now).toISOString(),end:new Date(now+hour).toISOString(),powerKw:car==='audi'?a:b}];
assert(wit(flow,now,now+900000,8,now)<.000001,'Battery cannot also claim 8 kW while EVs consume the budget');
assert.equal(wit(flow,now+hour,now+2*hour,8,now),8,'Battery can use freed capacity after the car blocks');
for(const [role,other] of [['sensor.ev_charger_status','jeep'],['sensor.ev_charger_2_status','audi']]){
    states[role].state='disconnected';
    assert.equal(ev(flow,other,11,now),11,'A disconnected peer cannot reserve power');
    assert(wit(flow,now,now+900000,8,now)>0,'A disconnected car releases its stale slots immediately');
    states[role].state='ready_to_charge';
}
for(const state of Object.values(states))state.state='disconnected';
assert.equal(wit(flow,now,now+900000,8,now),8,'The full battery budget is available with both cars disconnected');
for(const state of Object.values(states))state.state='ready_to_charge';
const prepared=manualSlots(flow,[],now,8),plan=manual(prepared,now,8,8);
assert(plan[0].start>=now+hour,'Manual battery estimate includes waiting for both EV blocks');
assert(plan.at(-1).end>=now+2*hour-1);
values.ess_jeep_smart_enabled=false;assert.equal(ev(flow,'audi',11,now),11,'An inactive peer does not reserve capacity');
values.ess_jeep_smart_enabled=true;values.ess_jeep_control_status.phaseCount=1;
const one=ev(flow,'jeep',11,now),three=ev(flow,'audi',11,now);
assert(one+three/3<=capacity.phaseKw+.000001,'Unknown single-phase placement is treated conservatively');
values.ess_jeep_smart_enabled=false;
values.ess_audi_control_status={enabled:true,energyNeeded:22,phaseCount:3,forceFull:true,updatedAt:new Date(now).toISOString(),selectedSlots:[],plannedChargePowerKw:11};
assert(wit(flow,now,now+900000,8,now)<8,'An immediate full-charge request reserves power outside its cheap scheduled blocks');
const slots=Array.from({length:16},(_,i)=>({start:now+i*900000,end:now+(i+1)*900000,allInPrice:i<12?.1:.5,sharedChargeKw:i<4?0:4}));
const result=automatic(slots,now,{storedKwh:15,capacityKwh:30,efficiency:.9,chargeKw:8,houseKwh:0,targetSoc:80,solarFactor:0},{valid:false},{});
assert(result.selectedSlots.length>0);
assert(result.selectedSlots.every(s=>s.start>=now+hour&&s.powerKw<=4),'Inventory planning respects each quarter capacity instead of assuming constant 8 kW');
const flows=require('../flows.json');
for(const id of ['ess00000000000d','essjeep_ess00000000000d'])assert(flows.find(n=>n.id===id).func.includes('sharedEvPlanningKw(flow,'));
assert(flows.find(n=>n.id==='esswitgrid_ctrl1').func.includes('witKnownPricePlan(sharedPriceSlots'));
console.log('Shared charging: site/house reserve, both EVs, single phase, forced charging, delayed manual battery plan and varying quarter power passed');
// Exclusive EV/WIT planning must match the runtime interlock.
{
 values.ess_wit_ev_only=true;
 values.ess_jeep_smart_enabled=true;
 for(const car of ['audi','jeep'])values['ess_'+car+'_control_status']={enabled:true,energyNeeded:2,updatedAt:new Date(now).toISOString(),selectedSlots:[{start:new Date(now+(car==='audi'?0:1)*hour).toISOString(),end:new Date(now+(car==='audi'?1:2)*hour).toISOString(),powerKw:1.4}]};
 assert.equal(wit(flow,now,now+900000,8,now),0,'Even a small EV load excludes WIT charging');
 assert.equal(wit(flow,now+hour,now+hour+900000,8,now),0,'Jeep reservations also exclude WIT');
 assert.equal(wit(flow,now+2*hour,now+3*hour,8,now),8,'Free quarters retain full power');
 const prices=Array.from({length:20},(_,i)=>({start:now+i*900000,end:now+(i+1)*900000,allInPrice:i<16?.1:.6}));
 const prepare=()=>prices.map(s=>({...s,sharedChargeKw:wit(flow,s.start,s.end,8,now)}));
 const inputs={storedKwh:15,capacityKwh:30,efficiency:.9,chargeKw:8,houseKwh:0,targetSoc:80,solarFactor:0};
 const planned=automatic(prepare(),now,inputs,{valid:false},{});
 assert(planned.selectedSlots.length>0);
 assert(planned.selectedSlots.every(s=>s.start>=now+2*hour&&s.powerKw===8),'Automatic plan excludes both EVs and keeps full power');
 const blocked=automatic(prices.map(s=>({...s,sharedChargeKw:0})),now,inputs,{valid:false},{});
 assert.equal(blocked.selectedSlots.length,0,'No fictitious charging when EVs occupy every cheap slot');
 assert(blocked.remainingEnergyKwh>0,'Insufficient charging opportunity remains visible as a shortfall');
 const manualPlan=manual(manualSlots(flow,prices,now,8),now,8,8);
 assert.equal(manualPlan[0].start,now+2*hour,'Manual plan also counts waiting time');
 for(const state of Object.values(states))state.state='disconnected';
 const freed=automatic(prepare(),now,inputs,{valid:false},{});
 assert(freed.selectedSlots.some(s=>s.start<now+2*hour),'Disconnect releases the cheap windows on replanning');
 states['sensor.ev_charger_status']={state:'charging',last_updated:new Date(now).toISOString()};
 values.ess_audi_smart_enabled=false;
 assert.equal(wit(flow,now,now+900000,8,now),0,'Measured charging blocks current quarter even with smart control off');
 assert.equal(wit(flow,now+900000,now+1800000,8,now),8,'Unplanned charging does not reserve the whole day');
 values.ess_audi_smart_enabled=true;
 values.ess_audi_control_status={enabled:true,energyNeeded:8,plannedChargePowerKw:8,forceFull:true,updatedAt:new Date(now).toISOString()};
 assert.equal(wit(flow,now+1800000,now+2700000,8,now),0,'Immediate charging reserves its expected duration');
 values.ess_audi_control_status.updatedAt=new Date(now-300000).toISOString();
 assert.equal(wit(flow,now+1800000,now+2700000,8,now),8,'Stale immediate requests do not freeze future planning');
 const grid=flows.find(n=>n.id==='esswitgrid_ctrl1').func;
 assert(!grid.includes("ess_wit_ev_only') === true ? slots :"),'Exported flow must not bypass reservations');
 assert(grid.includes('witRunningBlock(selectedSlots, previous, sharedPriceSlots,'),'Running blocks cannot restore occupied quarters');
 assert(grid.includes(require('../scripts/lib/shared-charging-budget').exclusiveWitSlotKw.toString().replace(/\r\n/g,'\n')));
 console.log('Exclusive charging: both cars, full power, manual/automatic, disconnect, unexpected charging and stale requests passed');
}
