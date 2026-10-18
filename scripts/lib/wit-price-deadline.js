// The upper price quartile defines an expensive period. Skip the current
// expensive run: charging for that run is already too late.
function witPriceDeadline(slots, now, reserve) {
    const ordered = slots.filter(s => s.end > now).slice().sort((a,b) => a.start-b.start);
    const prices = ordered.map(s => s.allInPrice).sort((a,b)=>a-b);
    if (!prices.length || prices[prices.length-1]-prices[0] < 0.01) return null;
    const index=(prices.length-1)*0.75, lower=Math.floor(index);
    const threshold = prices[lower]+(prices[Math.ceil(index)]-prices[lower])*(index-lower);
    let cheaperSeen = false;
    for (const slot of ordered) {
        if (slot.allInPrice < threshold) cheaperSeen = true;
        else if (cheaperSeen && slot.start > now) {
            const first = slot.start;
            if (!reserve || !Number.isFinite(reserve.storedKwh)) return first;
            const before = ordered.filter(s => s.end <= first);
            const cheapestBefore = Math.min(...before.map(s => s.allInPrice));
            let inExpensiveRun = true;
            for (const later of ordered.filter(s => s.start >= first)) {
                if (later.allInPrice < threshold) inExpensiveRun = false;
                else if (!inExpensiveRun) {
                    const cheaper = ordered.filter(s => s.start >= first && s.end <= later.start && s.allInPrice < cheapestBefore - 0.01);
                    if (cheaper.length) {
                        const rechargeStart = cheaper[0].start;
                        const consumption = reserve.houseKwh * Math.max(0, rechargeStart-now) / 86400000;
                        const floor = Math.max(reserve.capacityKwh * 0.30, reserve.houseKwh);
                        const needed = Math.max(0, reserve.capacityKwh-reserve.storedKwh + reserve.houseKwh*(later.start-now)/86400000) / reserve.efficiency;
                        const available = cheaper.reduce((sum,s)=>sum + (s.end-s.start)/3600000 * reserve.chargeKw, 0);
                        if (reserve.storedKwh-consumption >= floor && available >= needed) return later.start;
                    }
                    inExpensiveRun = true;
                }
            }
            return first;
        }
    }
    return null;
}

module.exports = function applyDeadline(flows) {
    const grid=flows.find(n=>n.id==='esswitgrid_ctrl1');
    grid.func=witLearnedHouse.toString()+'\n'+witReserveSlots.toString()+'\n'+witSolarBeforeDeadline.toString()+'\n'+witReserveOpportunity.toString()+'\n'+witPriceDeadline.toString()+'\n'+grid.func;
    const reserveAnchor="const reserveProfile = { ...reserveProfiles[reserveMode], houseReserveKwh:witHouseReserve(flow.get('ess_house_consumption_learning'), reserveProfiles[reserveMode].houseReserveKwh) + climateExtraReserve };";
    if(!grid.func.includes(reserveAnchor))throw Error('WIT learned reserve anchor missing');
    grid.func=grid.func.replace(reserveAnchor, `const houseConsumption=witLearnedHouse(flow.get('ess_house_consumption_learning'),now,reserveProfiles[reserveMode].houseReserveKwh);
const reserveProfile = {...reserveProfiles[reserveMode],houseReserveKwh:houseConsumption.kwh+climateExtraReserve};`);
    grid.func=grid.func.replace('const targetSoc = Math.max(20,', 'let targetSoc = Math.max(20,');
    // Credit only a conservative daylight fraction before the deadline.
    grid.func=grid.func.replace('const gridEnergyNeededKwh = mode', 'let gridEnergyNeededKwh = mode');
    grid.func=grid.func.replace('const powerKw = energyKwh / durationHours;', 'const powerKw = planLimitW / 1000;\n        const chargeEnd = usableStart + energyKwh / powerKw * 3600000;');
    grid.func=grid.func.replace('selectedSlots.push({ start:slot.start, end:slot.end, allInPrice:', 'selectedSlots.push({ start:usableStart, end:chargeEnd, allInPrice:');
    grid.func=grid.func.replace('powerKw:Math.min(planLimitW / 1000, remainingEnergyKwh / durationHours)', 'powerKw:planLimitW / 1000');
    const start=grid.func.indexOf('const economicSlots = slots.filter(');
    const end=grid.func.indexOf('const planLimitW =', start);
    if(start<0||end<0) throw Error('WIT planner anchor missing');
    grid.func=grid.func.slice(0,start)+`const reserveInputs={
    storedKwh:currentStoredKwh, capacityKwh:batteryCapacityKwh,
    houseKwh:reserveProfile.houseReserveKwh, efficiency:chargeEfficiency,
    chargeKw:directBatteryLimitW()/1000,solarFactor:reserveProfile.conservativeForecastFactor,targetSoc
};
const originalDeadline=witPriceDeadline(slots,now,reserveInputs);
const reserveWait=mode==='auto'?witReserveOpportunity(slots,now,originalDeadline,reserveInputs,solarWindow,states):null;
const bridgeDeadline=reserveWait?.bridge?reserveWait.deadline:null;
const refillDeadline=bridgeDeadline===null?null:(witPriceDeadline(slots,bridgeDeadline)||Math.min(now+86400000,...slots.map(s=>s.end)));
const expensivePeriodStart=refillDeadline??reserveWait?.deadline??originalDeadline;
const configuredTargetSoc=targetSoc;
const deadlineHouseKwh = expensivePeriodStart === null ? 0 : reserveProfile.houseReserveKwh * Math.max(0, expensivePeriodStart-now) / 86400000;
const solarBeforeDeadlineKwh = witSolarBeforeDeadline(solarWindow, states, now, expensivePeriodStart) * Math.min(.35,reserveProfile.conservativeForecastFactor) * chargeEfficiency;
if (mode === 'auto') gridEnergyNeededKwh = currentStoredKwh === null || expensivePeriodStart === null ? null
    : Math.max(0, targetSoc/100*batteryCapacityKwh-currentStoredKwh+deadlineHouseKwh-solarBeforeDeadlineKwh) / chargeEfficiency;
if(mode==='auto'&&reserveWait?.bridge)gridEnergyNeededKwh=Math.max(gridEnergyNeededKwh,Math.max(0,Math.min(configuredTargetSoc,reserveWait.targetSoc)/100*batteryCapacityKwh-currentStoredKwh)/chargeEfficiency);
const economicSlots = slots.filter(slot => expensivePeriodStart !== null && slot.start < expensivePeriodStart && slot.end <= expensivePeriodStart && (!reserveWait||slot.start>=reserveWait.waitUntil)
    && priceBenchmark!==null && priceBenchmark-slot.allInPrice/chargeEfficiency-wearCostPerKwh>=minimumBenefitPerKwh)
    .sort((a,b)=>a.allInPrice-b.allInPrice || a.start-b.start);
`+grid.func.slice(end);
    const allocationStart=grid.func.indexOf("    for (const slot of economicSlots) {");
    const allocationEnd=grid.func.indexOf("} else if (mode === 'on'",allocationStart);
    grid.func=grid.func.slice(0,allocationStart)+`    if(reserveWait?.bridge){
        const bridgeEnergy=Math.min(remainingEnergyKwh,Math.max(0,Math.min(configuredTargetSoc,reserveWait.targetSoc)/100*batteryCapacityKwh-currentStoredKwh)/chargeEfficiency);
        selectedSlots=witReserveSlots(economicSlots.filter(s=>s.end<=bridgeDeadline),bridgeEnergy,planLimitW/1000,now,bridgeDeadline,currentStoredKwh,batteryCapacityKwh,reserveProfile.houseReserveKwh,chargeEfficiency);
        const already=selectedSlots.reduce((sum,s)=>sum+s.energyKwh,0);
        const refillSlots=economicSlots.map(s=>({...s,start:Math.max(s.start,...selectedSlots.filter(p=>p.start<s.end&&p.end>s.start).map(p=>p.end))})).filter(s=>s.end>s.start);
        selectedSlots.push(...witReserveSlots(refillSlots,Math.max(0,remainingEnergyKwh-already),planLimitW/1000,now,expensivePeriodStart,0,0,0,chargeEfficiency));
        const uncovered=remainingEnergyKwh-selectedSlots.reduce((sum,s)=>sum+s.energyKwh,0);
        if(uncovered>.01){
            const spare=economicSlots.filter(s=>s.end<=bridgeDeadline).map(s=>({...s,start:Math.max(s.start,...selectedSlots.filter(p=>p.start<s.end&&p.end>s.start).map(p=>p.end))})).filter(s=>s.end>s.start);
            selectedSlots.push(...witReserveSlots(spare,uncovered,planLimitW/1000,now,bridgeDeadline,0,0,0,chargeEfficiency));
        }
        selectedSlots.sort((a,b)=>a.start-b.start);
    }else selectedSlots=witReserveSlots(economicSlots,remainingEnergyKwh,planLimitW/1000,now,expensivePeriodStart,currentStoredKwh,batteryCapacityKwh,reserveProfile.houseReserveKwh,chargeEfficiency);
    remainingEnergyKwh=Math.max(0,remainingEnergyKwh-selectedSlots.reduce((sum,s)=>sum+s.energyKwh,0));
`+grid.func.slice(allocationEnd);
    grid.func=grid.func.replace('    reserveMode,', `    houseConsumptionSource:houseConsumption.source,
    houseConsumptionDays:houseConsumption.days,
    bridgeDeadline:bridgeDeadline===null?null:new Date(bridgeDeadline).toISOString(),
    configuredTargetSoc,
    reserveTargetLimited:reserveWait?.bridge===true&&reserveWait.targetSoc>configuredTargetSoc,
    chargeDeadline:expensivePeriodStart === null ? null : new Date(expensivePeriodStart).toISOString(),
    planningGoal:reserveWait?.bridge?'Overbrugging en daarna naar het ingestelde SOC-doel vóór de dure periode':reserveWait?'Voldoende reserve · wacht op zon of goedkopere uren':'Laden vóór de dure periode',
    reserveWaitUntil:reserveWait?new Date(reserveWait.waitUntil).toISOString():null,
    reserveBridge:reserveWait?.bridge===true,
    projectedReserveKwh:reserveWait?round(reserveWait.projectedReserveKwh):null,
    deadlineHouseKwh:round(deadlineHouseKwh),
    solarCreditKwh:mode === 'auto' ? round(solarBeforeDeadlineKwh) : round(expectedSolarChargeKwh),
    reserveMode,`);
    grid.func=grid.func.replace("if (mode === 'auto' && !forecastValid) return stopOwned('Zonverwachting voor de komende laadperiode ontbreekt of is te oud', details);",'');
    grid.func=grid.func.replace("if (gridEnergyNeededKwh === null ||", "if (mode === 'auto' && expensivePeriodStart === null) return stopOwned('Nog geen volgende dure periode in de beschikbare prijzen', details);\nif (gridEnergyNeededKwh === null ||");
    grid.func=grid.func.replace("'Geen rendabel laadkwartier binnen 24 uur'", "'Geen rendabel laadmoment · woning gebruikt zo nodig rechtstreeks het net'");
    // Show the active deadline and feasibility without hiding safety limits.
    grid.func=grid.func.replace('    planComplete:remainingEnergyKwh <= 0.05,', '    planComplete:remainingEnergyKwh <= 0.05,\n    deadlineWarning:remainingEnergyKwh > 0.05 ? \'Onvoldoende geplande laadruimte om vóór de dure periode vol te zijn\' : null,');
    const mapper=flows.find(n=>n.id==='ess00000000000a');
    mapper.func=mapper.func.replace(/\/\/ BEGIN WIT RESERVE PLAN[\s\S]*?\/\/ END WIT RESERVE PLAN\n/g,'');
    mapper.func=mapper.func.replace('            planComplete:witGridChargeStored.planComplete === true,',`// BEGIN WIT RESERVE PLAN
            chargeDeadline:witGridChargeStored.chargeDeadline||null,
            reserveWaitUntil:witGridChargeStored.reserveWaitUntil||null,
            reserveBridge:witGridChargeStored.reserveBridge===true,
            planningGoal:witGridChargeStored.planningGoal||null,
            projectedReserveKwh:witGridChargeStored.projectedReserveKwh??null,
            deadlineWarning:witGridChargeStored.deadlineWarning||null,
// END WIT RESERVE PLAN
            planComplete:witGridChargeStored.planComplete === true,`);
    mapper.func=mapper.func.replace('targetSoc:witGridChargeTargetSoc,','targetSoc:witGridChargeTargetSoc,\n            effectiveTargetSoc:witGridChargeStored.targetSoc??witGridChargeTargetSoc,');
    for(const n of flows.filter(n=>n.type==='ui-template'&&n.format)) {
        n.format=n.format.replace('Geen vaste deadline; steeds 24 uur vooruit', "{{d.wit?.gridCharge?.reserveBridge?'Alleen reservetekort tot goedkoper moment laden':d.wit?.gridCharge?.reserveWaitUntil?'Voldoende reserve · wacht op zon of goedkopere uren':d.wit?.gridCharge?.chargeDeadline?'Laaddoel vóór '+slotRange(d.wit.gridCharge.chargeDeadline,d.wit.gridCharge.chargeDeadline):'Wacht op volgende dure periode'}}");
        n.format=n.format.replace('Doorlopende planning voor de komende 24 uur','Reserve, zon en stroomprijs');
        n.format=n.format.replace('Conservatief volgens reserveprofiel','Werkelijke zonnelading verlaagt de netbehoefte');
        n.format=n.format.replace('<div class="plan-clock"><div class="plan-clock-summary">', '<p v-if="d.wit&&d.wit.gridCharge&&d.wit.gridCharge.deadlineWarning" class="subtle">{{d.wit.gridCharge.deadlineWarning}}</p><div class="plan-clock"><div class="plan-clock-summary">');
    }
};
module.exports.witPriceDeadline=witPriceDeadline;

function witSolarBeforeDeadline(window, states, now, deadline) {
    if (!window.valid || !Number.isFinite(deadline)) return 0;
    const local = stamp => new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(stamp));
    const day = local(deadline);
    if (day !== window.forecastDate) return 0;
    const sun = states['sun.sun']?.attributes || {};
    const rise = Date.parse(sun.next_rising), set = Date.parse(sun.next_setting);
    // Only count a dated forecast with a known solar window for that day.
    if (!Number.isFinite(rise) || !Number.isFinite(set) || local(set) !== day) return 0;
    const start = local(rise) === day ? Math.max(now,rise) : now;
    if (set <= start) return 0;
    const total = day === local(now) ? window.todayRemainingKwh : window.tomorrowKwh;
    if (!Number.isFinite(total) || total < 0) return 0;
    return total * Math.max(0,Math.min(1,(deadline-start)/(set-start)));
}
module.exports.witSolarBeforeDeadline=witSolarBeforeDeadline;

// A reserve bridge does not require a second upper-quartile price peak.
// Prove both the energy available until recharge and refill feasibility.
function witReserveOpportunity(slots,now,firstDeadline,reserve,solar,states) {
    if(!Number.isFinite(firstDeadline)||!reserve||!Number.isFinite(reserve.storedKwh)||reserve.storedKwh<0||!(reserve.capacityKwh>0)||!(reserve.houseKwh>0)||!(reserve.efficiency>0)||!(reserve.chargeKw>0))return null;
    const ordered=slots.filter(s=>s.start>=now&&s.end>s.start&&Number.isFinite(s.allInPrice)).slice().sort((a,b)=>a.start-b.start);
    const before=ordered.filter(s=>s.end<=firstDeadline);
    if(!before.length)return null;
    const nightPrice=Math.min(...before.map(s=>s.allInPrice));
    const horizon=Math.min(now+86400000,...[ordered.at(-1)?.end||now]);
    const floor=Math.max(reserve.capacityKwh*.30,reserve.houseKwh);
    const cheaper=ordered.filter(s=>s.start>=firstDeadline&&s.end<=horizon&&s.allInPrice<nightPrice-.01);
    const candidates=cheaper.slice().sort((a,b)=>a.allInPrice-b.allInPrice||a.start-b.start).map(s=>s.start);
    const rise=Date.parse(states?.['sun.sun']?.attributes?.next_rising),set=Date.parse(states?.['sun.sun']?.attributes?.next_setting);
    const solarStart=rise+2*3600000;
    // A known cheaper price window remains the bridge destination. Solar may
    // cover that bridge as it arrives, but must not move its deadline earlier.
    if(!candidates.length&&solarStart>=firstDeadline&&solarStart<horizon&&solarStart<set&&witSolarBeforeDeadline(solar,states,now,solarStart)*(reserve.solarFactor||0)*reserve.efficiency>=1)candidates.push(solarStart);
    for(const waitUntil of [...new Set(candidates)]) {
        const projectedReserveKwh=reserve.storedKwh-reserve.houseKwh*(waitUntil-now)/86400000;
        if(projectedReserveKwh<floor){
            const bridgeCapacity=ordered.filter(s=>s.end<=waitUntil).reduce((sum,s)=>sum+(s.end-s.start)/3600000*reserve.chargeKw,0);
            const targetStored=floor+reserve.houseKwh*(waitUntil-now)/86400000;
            const targetSoc=Math.ceil(targetStored/reserve.capacityKwh*20)*5;
            const bridgeEnergyKwh=(targetSoc/100*reserve.capacityKwh-reserve.storedKwh)/reserve.efficiency;
            if(bridgeEnergyKwh<=bridgeCapacity&&targetSoc<=100)return {bridge:true,waitUntil:now,deadline:waitUntil,projectedReserveKwh,bridgeEnergyKwh,targetSoc};
            continue;
        }
        // The visible horizon is an energy deadline when no later price peak exists.
        const deadline=horizon;
        const solarCredit=witSolarBeforeDeadline(solar,states,now,deadline)*(reserve.solarFactor||0)*reserve.efficiency;
        const needed=Math.max(0,(reserve.targetSoc??100)/100*reserve.capacityKwh-reserve.storedKwh+reserve.houseKwh*(deadline-now)/86400000-solarCredit)/reserve.efficiency;
        const capacity=cheaper.filter(s=>s.start>=waitUntil&&s.end<=deadline).reduce((sum,s)=>sum+(s.end-s.start)/3600000*reserve.chargeKw,0);
        if(needed>.05&&capacity<needed)continue;
        return {waitUntil,deadline,projectedReserveKwh};
    }
    return null;
}
module.exports.witReserveOpportunity=witReserveOpportunity;

// Meet each intermediate reserve deadline before allocating the remaining cheapest energy.
function witReserveSlots(slots,budget,powerKw,now,deadline,stored,capacity,house,efficiency){
    const chosen=new Map();
    let remaining=budget;
    const allocate=(eligible,needed,wholeQuarter=false)=>{
        for(const s of eligible.slice().sort((a,b)=>a.allInPrice-b.allInPrice||a.start-b.start)){
            const start=Math.max(now,s.start),used=chosen.get(s)||0;
            const available=Math.max(0,(s.end-start)/3600000*powerKw-used);
            // Fill a useful charging quarter ahead of the next reserve deadline,
            // instead of restarting for every minute-sized consumption increment.
            const add=Math.min(available,remaining,wholeQuarter?Math.max(needed,powerKw*.25):needed);
            if(add<=0)continue;
            chosen.set(s,used+add);remaining-=add;needed-=add;
            if(needed<=.001||remaining<=.001)break;
        }
    };
    const floor=capacity*.20;
    const checkpoints=[...new Set(slots.map(s=>s.start).filter(t=>t>now).concat(deadline))].sort((a,b)=>a-b);
    for(const t of checkpoints){
        const eligible=slots.filter(s=>s.end<=t);
        const credited=[...chosen].filter(([s])=>s.end<=t).reduce((sum,[s,e])=>sum+e,0);
        const required=Math.max(0,(floor+house*1.25*(t-now)/86400000-stored)/efficiency-credited);
        if(required>.001)allocate(eligible,required,true);
    }
    allocate(slots,remaining);
    return [...chosen].map(([s,energyKwh])=>({...s,start:Math.max(now,s.start),end:Math.max(now,s.start)+energyKwh/powerKw*3600000,energyKwh,powerKw})).sort((a,b)=>a.start-b.start);
}
module.exports.witReserveSlots=witReserveSlots;

function witLearnedHouse(model,now,fallback){
    const initial={kwh:fallback,days:0,source:'Startwaarde reserveprofiel'};
    const age=now-Date.parse(model?.updatedAt);
    if(model?.schemaVersion!==2||!Number.isFinite(age)||age< -60000||age>7200000)return initial;
    const day=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(t));
    const today=day(now),cutoff=day(now-30*86400000);
    const values=[...new Map((Array.isArray(model.recentDays)?model.recentDays:[])
        .filter(d=>d&&/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&d.date>=cutoff&&d.date<today&&typeof d.kwh==='number'&&Number.isFinite(d.kwh)&&d.kwh>=.5&&d.kwh<=200)
        .map(d=>[d.date,d.kwh])).values()].sort((a,b)=>a-b);
    if(!values.length)return initial;
    const mean=values.reduce((sum,value)=>sum+value,0)/values.length;
    return {kwh:Math.max(fallback,mean),days:values.length,source:'Gemiddeld woningverbruik over '+values.length+' meetdagen (maximaal 30), zonder beide laadpunten; minimaal reserveprofiel'};
}
module.exports.witLearnedHouse=witLearnedHouse;
