// Inventory planning over the complete published tariff horizon. Only known
// prices can justify grid charging; unknown intervals still consume energy.
const {witPriceDeadline,witSolarBeforeDeadline}=require('./wit-price-deadline');
function witManualChargePlan(slots,now,neededKwh,chargeKw){
    if(!Number.isFinite(now)||!Number.isFinite(neededKwh)||neededKwh<=0||!Number.isFinite(chargeKw)||chargeKw<=0)return [];
    const quarter=900000,horizon=now+86400000,result=[];
    let cursor=now,remaining=neededKwh;
    const prices=slots.filter(s=>Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.end>s.start&&s.end>now);
    while(remaining>.000001&&cursor<horizon&&result.length<512){
        const known=prices.find(s=>s.start<=cursor&&s.end>cursor);
        const boundary=Math.min(horizon,(Math.floor(cursor/quarter)+1)*quarter,...prices.flatMap(s=>[s.start,s.end]).filter(t=>t>cursor));
        const availableKw=Math.min(chargeKw,Number.isFinite(known?.sharedChargeKw)?Math.max(0,known.sharedChargeKw):chargeKw);
        if(availableKw<=0){cursor=boundary;continue;}
        const energyKwh=Math.min(remaining,availableKw*(boundary-cursor)/3600000),end=cursor+energyKwh/availableKw*3600000;
        if(!(end>cursor)||!Number.isFinite(end))break;
        result.push({start:cursor,end,energyKwh,powerKw:availableKw,allInPrice:Number.isFinite(known?.allInPrice)?known.allInPrice:null,marketPrice:Number.isFinite(known?.marketPrice)?known.marketPrice:null});
        remaining-=energyKwh;cursor=end;
    }
    return result;
}
function witKnownPricePlan(input,now,r,solar,states,wear=.04,minimumBenefit=.01){
    const ordered=input.filter(s=>Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.end>now&&s.end>s.start&&Number.isFinite(s.allInPrice))
        .map(s=>({...s,start:Math.max(now,s.start)})).sort((a,b)=>a.start-b.start);
    const horizon=ordered.at(-1)?.end??now;
    const empty={selectedSlots:[],deadline:null,horizon,bridgeDeadline:null,bridgeEnergyKwh:0,refillEnergyKwh:0,remainingEnergyKwh:0,reserveShortfallKwh:0,projectedSoc:null,minimumSoc:null,houseKwh:0,solarKwh:0};
    if(!ordered.length||!Number.isFinite(r.storedKwh)||!(r.capacityKwh>0)||!(r.efficiency>0)||!Number.isFinite(r.chargeKw)||r.chargeKw<0)return empty;
    const cheapest=ordered.slice().sort((a,b)=>a.allInPrice-b.allInPrice||a.start-b.start)[0];
    const nominalDeadline=witPriceDeadline(ordered,cheapest.start)??horizon;
    const opportunities=ordered.map(s=>{
        const future=ordered.filter(p=>p.start>=s.end).map(p=>p.allInPrice);
        const benefit=future.length?Math.max(...future)-s.allInPrice/r.efficiency-wear:-Infinity;
        const chargeKw=Math.min(r.chargeKw,Number.isFinite(s.sharedChargeKw)?Math.max(0,s.sharedChargeKw):r.chargeKw);
        return {...s,chargeKw,eligible:benefit>=minimumBenefit&&chargeKw>0};
    });
    // Finish at the end of the affordable window. Holding 100% through an
    // already unprofitable quarter would demand precisely the expensive
    // last-minute top-ups this planner must avoid.
    const lastAffordable=opportunities.filter(s=>s.eligible&&s.end<=nominalDeadline).at(-1);
    const deadline=lastAffordable&&lastAffordable.end>=cheapest.end?lastAffordable.end:nominalDeadline;
    const target=Math.min(r.capacityKwh,Math.max(0,r.targetSoc/100*r.capacityKwh));
    const reserveFloor=Math.min(target,r.capacityKwh*.20),hardwareFloor=r.capacityKwh*.10;
    const houseRate=r.houseKwh/86400000;
    const demandCache=new Map();
    const demandAt=at=>{
        if(!demandCache.has(at))demandCache.set(at,Array.isArray(r.hourlyProfile?.segments)
            ?r.hourlyProfile.segments.reduce((sum,s)=>sum+Math.max(0,Math.min(at,s.end)-s.start)/3600000*s.kwhPerHour,0)
            :houseRate*Math.max(0,at-now));
        return demandCache.get(at);
    };
    const solarCache=new Map();
    const solarAt=at=>{if(!solarCache.has(at))solarCache.set(at,witSolarBeforeDeadline(solar,states,now,at)*Math.min(.35,r.solarFactor||0)*r.efficiency);return solarCache.get(at);};
    const candidates=opportunities.filter(s=>s.start<deadline&&s.end<=deadline);
    const sunPoints=['next_rising','next_setting'].map(k=>Date.parse(states?.['sun.sun']?.attributes?.[k])).filter(t=>Number.isFinite(t)&&t>now&&t<deadline);
    const hourPoints=(r.hourlyProfile?.segments||[]).flatMap(s=>[s.start,s.end]).filter(t=>t>now&&t<deadline);
    const points=[...new Set([now,deadline,...sunPoints,...hourPoints,...candidates.flatMap(s=>[s.start,s.end])])].sort((a,b)=>a-b);
    const chosen=new Map();
    const simulate=()=>{
        const starts=[...chosen].map(([s,e])=>s.end-e/s.chargeKw*3600000);
        const times=[...new Set([...points,...starts])].filter(t=>t>=now&&t<=deadline).sort((a,b)=>a-b);
        let stored=Math.min(r.capacityKwh,Math.max(0,r.storedKwh)),overflow=0,directGrid=0,min=stored;
        const trace=[];
        for(let i=1;i<times.length;i++){
            const from=times[i-1],to=times[i];
            let input=0;
            for(const [s,e]of chosen){const start=s.end-e/s.chargeKw*3600000;input+=Math.max(0,Math.min(to,s.end)-Math.max(from,start))/3600000*s.chargeKw;}
            const raw=stored+input*r.efficiency-(demandAt(to)-demandAt(from))+Math.max(0,solarAt(to)-solarAt(from));
            overflow+=Math.max(0,raw-(input>1e-9?target:r.capacityKwh));
            directGrid+=Math.max(0,hardwareFloor-raw);
            stored=Math.min(r.capacityKwh,Math.max(hardwareFloor,raw));min=Math.min(min,stored);
            trace.push({at:to,stored,raw});
        }
        return {trace,stored,overflow,directGrid,min};
    };
    const stateAt=(simulation,t)=>simulation.trace.filter(p=>p.at<=t).at(-1)?.stored??r.storedKwh;
    // Additional grid energy must not overflow storage, including a shortened
    // full-power final quarter. Future solar clipping is not credited as storage.
    const room=(s,maximum)=>{
        const previous=chosen.get(s)||0,before=simulate().overflow;
        let low=0,high=maximum;
        chosen.set(s,previous+high);
        if(simulate().overflow<=before+1e-7){chosen.set(s,previous);return high;}
        for(let i=0;i<18;i++){const mid=(low+high)/2;chosen.set(s,previous+mid);if(simulate().overflow<=before+1e-7)low=mid;else high=mid;}
        chosen.set(s,previous);return low;
    };
    const allocate=(until,need,wholeQuarter)=>{
        let remaining=need;
        const eligible=candidates.filter(s=>s.eligible&&s.end<=until).sort((a,b)=>a.allInPrice-b.allInPrice||a.start-b.start);
        for(const s of eligible){
            const used=chosen.get(s)||0,available=(s.end-s.start)/3600000*s.chargeKw-used;
            if(available<=.001)continue;
            const wanted=Math.min(available,wholeQuarter?Math.max(remaining,s.chargeKw*.25):remaining);
            const add=room(s,wanted);
            if(add<=.001)continue;
            chosen.set(s,used+add);remaining-=add;
            if(remaining<=.001)break;
        }
    };
    let reserveShortfallKwh=0;
    for(const t of points.filter(t=>t>now)){
        const state=simulate(),row=state.trace.find(p=>p.at===t);
        const deficit=Math.max(0,reserveFloor-Math.min(row?.raw??stateAt(state,t),stateAt(state,t)));
        if(deficit>.001)allocate(t,deficit/r.efficiency,true);
        const after=simulate(),actual=after.trace.find(p=>p.at===t);
        reserveShortfallKwh=Math.max(reserveShortfallKwh,reserveFloor-(actual?.raw??stateAt(after,t)));
    }
    // Earlier input can replace direct grid use in a previously uncovered gap.
    // Re-evaluate the actual final stock instead of treating every input kWh as
    // an equal increase of the final SOC.
    for(let pass=0;pass<=candidates.length;pass++){
        const need=Math.max(0,target-simulate().stored)/r.efficiency;
        if(need<=.001)break;
        const before=[...chosen.values()].reduce((a,b)=>a+b,0);
        allocate(deadline,need,false);
        if([...chosen.values()].reduce((a,b)=>a+b,0)-before<=.001)break;
    }
    const projected=simulate();
    const selectedSlots=[...chosen].filter(([,e])=>e>.001).map(([s,energyKwh])=>({start:s.end-energyKwh/s.chargeKw*3600000,end:s.end,allInPrice:s.allInPrice,marketPrice:s.marketPrice,energyKwh,powerKw:s.chargeKw})).sort((a,b)=>a.start-b.start);
    const bridgeEnergyKwh=selectedSlots.filter(s=>s.end<=cheapest.start).reduce((sum,s)=>sum+s.energyKwh,0);
    return {selectedSlots,deadline,horizon,bridgeDeadline:cheapest.start>now?cheapest.start:null,bridgeEnergyKwh,
        refillEnergyKwh:selectedSlots.reduce((sum,s)=>sum+s.energyKwh,0)-bridgeEnergyKwh,
        remainingEnergyKwh:Math.max(0,target-projected.stored)/r.efficiency,
        reserveShortfallKwh:Math.max(0,reserveShortfallKwh),projectedSoc:projected.stored/r.capacityKwh*100,
        minimumSoc:projected.min/r.capacityKwh*100,houseKwh:demandAt(deadline),solarKwh:solarAt(deadline)};
}
module.exports=function apply(flows){
    const grid=flows.find(n=>n.id==='esswitgrid_ctrl1');
    grid.func=witManualChargePlan.toString()+'\n'+witKnownPricePlan.toString()+'\n'+grid.func;
    grid.func=grid.func.replace('const horizonEnd = now + planningHorizonMs;',"const horizonEnd = Math.max(now,...(flow.get('ess_nordpool_forecast')||[]).map(s=>Date.parse(s.end)).filter(Number.isFinite));");
    for(const name of ['reserveWait','bridgeDeadline','expensivePeriodStart','deadlineHouseKwh','solarBeforeDeadlineKwh'])grid.func=grid.func.replace('const '+name+'=','let '+name+'=').replace('const '+name+' =','let '+name+' =');
    const marker='const scheduledSlot = selectedSlots.find(';
    if(!grid.func.includes(marker))throw Error('WIT allocation insertion point missing');
    const manualStart=grid.func.indexOf("} else if (mode === 'on' && remainingEnergyKwh > 0.01) {");
    const manualEnd=grid.func.indexOf(marker,manualStart);
    if(manualStart<0||manualEnd<0)throw Error('WIT manual planning anchor missing');
    grid.func=grid.func.slice(0,manualStart)+`} else if (mode === 'on' && remainingEnergyKwh > 0.01) {
    selectedSlots=witManualChargePlan(slots,now,remainingEnergyKwh,planLimitW/1000);
    remainingEnergyKwh=Math.max(0,remainingEnergyKwh-selectedSlots.reduce((sum,s)=>sum+s.energyKwh,0));
    expensivePeriodStart=selectedSlots.at(-1)?.end??null;
    deadlineHouseKwh=0;solarBeforeDeadlineKwh=0;
}
`+grid.func.slice(manualEnd);
    grid.func=grid.func.replace(marker,`const knownPricePlan=mode==='auto'?witKnownPricePlan(slots,now,reserveInputs,solarWindow,states,wearCostPerKwh,minimumBenefitPerKwh):null;
if(knownPricePlan){
selectedSlots=knownPricePlan.selectedSlots;remainingEnergyKwh=knownPricePlan.remainingEnergyKwh;
expensivePeriodStart=knownPricePlan.deadline;bridgeDeadline=knownPricePlan.bridgeDeadline;
reserveWait=bridgeDeadline?{bridge:knownPricePlan.bridgeEnergyKwh>.001,deadline:bridgeDeadline,waitUntil:knownPricePlan.selectedSlots[0]?.start??bridgeDeadline,projectedReserveKwh:knownPricePlan.minimumSoc/100*batteryCapacityKwh,targetSoc:configuredTargetSoc}:null;
deadlineHouseKwh=knownPricePlan.houseKwh;solarBeforeDeadlineKwh=knownPricePlan.solarKwh;
gridEnergyNeededKwh=selectedSlots.reduce((sum,s)=>sum+s.energyKwh,0)+remainingEnergyKwh;
}
${marker}`);
    grid.func=grid.func.replace('    houseConsumptionSource:',`    knownPriceUntil:new Date(horizonEnd).toISOString(),
    bridgeGridEnergyKwh:knownPricePlan?.bridgeEnergyKwh??null,
    refillGridEnergyKwh:knownPricePlan?.refillEnergyKwh??null,
    reserveShortfallKwh:knownPricePlan?.reserveShortfallKwh??null,
    projectedSocAtDeadline:knownPricePlan?.projectedSoc??null,
    projectedMinimumSoc:knownPricePlan?.minimumSoc??null,
    houseConsumptionSource:`);
    grid.func=grid.func.replace('planComplete:remainingEnergyKwh <= 0.05','planComplete:remainingEnergyKwh <= 0.05 && (!knownPricePlan || knownPricePlan.reserveShortfallKwh <= 0.05)');
    grid.func=grid.func.replace('const plannedCost = selectedSlots.reduce(', 'const plannedCost = selectedSlots.every(s=>Number.isFinite(s.allInPrice)) ? selectedSlots.reduce(')
        .replace('slot.energyKwh * slot.allInPrice : 0), 0);','slot.energyKwh * slot.allInPrice : 0), 0) : null;');
    grid.func=grid.func.replace('plannedCost:round(plannedCost)','plannedCost:plannedCost===null?null:round(plannedCost)');
    // Show the same conservative, deadline-limited solar credit that the
    // inventory planner actually subtracts, even if tomorrow is unavailable.
    grid.func=grid.func.replace('expectedSolarChargeKwh:round(expectedSolarChargeKwh)', "expectedSolarChargeKwh:round(mode==='auto'?solarBeforeDeadlineKwh:0)");
    grid.func=grid.func.replace("solarCreditKwh:mode === 'auto' ? round(solarBeforeDeadlineKwh) : round(expectedSolarChargeKwh)","solarCreditKwh:mode === 'auto' ? round(solarBeforeDeadlineKwh) : 0");
    grid.func=grid.func.replace("planningGoal:reserveWait?.bridge?", "planningGoal:mode==='on'?'Nu doorladen tot het ingestelde SOC-doel':reserveWait?.bridge?");
    grid.func=grid.func.replace("deadlineWarning:remainingEnergyKwh > 0.05 ? 'Onvoldoende geplande laadruimte om vóór de dure periode vol te zijn' : null", "deadlineWarning:remainingEnergyKwh > 0.05 ? 'Onvoldoende rendabele laadruimte om vóór de dure periode vol te zijn' : knownPricePlan?.reserveShortfallKwh > 0.05 ? 'Overbrugging niet volledig gedekt; rechtstreeks netverbruik kan nodig zijn' : null");
    grid.func=grid.func.replace("forecastWindow:solarWindow.label","forecastWindow:'Alle bekende kwartierprijzen'");
    const mapper=flows.find(n=>n.id==='ess00000000000a');
    mapper.func=mapper.func.replace('            chargeDeadline:witGridChargeStored.chargeDeadline||null,',`            chargeDeadline:witGridChargeStored.chargeDeadline||null,
            knownPriceUntil:witGridChargeStored.knownPriceUntil||null,
            bridgeGridEnergyKwh:witGridChargeStored.bridgeGridEnergyKwh??null,
            refillGridEnergyKwh:witGridChargeStored.refillGridEnergyKwh??null,
            reserveShortfallKwh:witGridChargeStored.reserveShortfallKwh??null,
            projectedSocAtDeadline:witGridChargeStored.projectedSocAtDeadline??null,
            projectedMinimumSoc:witGridChargeStored.projectedMinimumSoc??null,`);
    for(const n of flows.filter(n=>n.type==='ui-template'&&n.format)){
        n.format=n.format.replace('const start=startDate.getTime(),count=96,cells=[];',"const start=startDate.getTime(),knownEnd=Date.parse(smart.knownPriceUntil||''),count=Math.max(1,Math.ceil(((Number.isFinite(knownEnd)?knownEnd:start+86400000)-start)/quarter)),cells=[];");
        n.format=n.format.replaceAll('left:(cell.start-start)/((count-1)*quarter)*100','left:(cell.start-start)/Math.max(quarter,(count-1)*quarter)*100');
        n.format=n.format.replace('Doorlopende planning voor de komende 24 uur','Planning over alle bekende kwartierprijzen');
        n.format=n.format.replace('<span>Reserve, zon en stroomprijs</span>','<span>Alle bekende kwartierprijzen</span>');
    }
};
module.exports.witKnownPricePlan=witKnownPricePlan;
module.exports.witManualChargePlan=witManualChargePlan;
