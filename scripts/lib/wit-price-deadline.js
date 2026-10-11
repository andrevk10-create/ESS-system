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
    grid.func=witSolarBeforeDeadline.toString()+'\n'+witPriceDeadline.toString()+'\n'+grid.func;
    grid.func=grid.func.replace('const targetSoc = Math.max(20,', "const targetSoc = mode === 'auto' ? 100 : Math.max(20,");
    // Credit only a conservative daylight fraction before the deadline.
    grid.func=grid.func.replace('const gridEnergyNeededKwh = mode', 'let gridEnergyNeededKwh = mode');
    const start=grid.func.indexOf('const economicSlots = slots.filter(');
    const end=grid.func.indexOf('const planLimitW =', start);
    if(start<0||end<0) throw Error('WIT planner anchor missing');
    grid.func=grid.func.slice(0,start)+`const expensivePeriodStart = witPriceDeadline(slots, now, {
    storedKwh:currentStoredKwh, capacityKwh:batteryCapacityKwh,
    houseKwh:reserveProfile.houseReserveKwh, efficiency:chargeEfficiency,
    chargeKw:directBatteryLimitW()/1000
});
const deadlineHouseKwh = expensivePeriodStart === null ? 0 : reserveProfile.houseReserveKwh * Math.max(0, expensivePeriodStart-now) / 86400000;
const solarBeforeDeadlineKwh = witSolarBeforeDeadline(solarWindow, states, now, expensivePeriodStart) * reserveProfile.conservativeForecastFactor * chargeEfficiency;
if (mode === 'auto') gridEnergyNeededKwh = currentStoredKwh === null || expensivePeriodStart === null ? null
    : Math.max(0, batteryCapacityKwh-currentStoredKwh+deadlineHouseKwh-solarBeforeDeadlineKwh) / chargeEfficiency;
const economicSlots = slots.filter(slot => expensivePeriodStart !== null && slot.start < expensivePeriodStart && slot.end <= expensivePeriodStart)
    .sort((a,b)=>a.allInPrice-b.allInPrice || a.start-b.start);
`+grid.func.slice(end);
    grid.func=grid.func.replace('    reserveMode,', `    chargeDeadline:expensivePeriodStart === null ? null : new Date(expensivePeriodStart).toISOString(),
    planningGoal:'100% vóór de dure periode',
    deadlineHouseKwh:round(deadlineHouseKwh),
    solarCreditKwh:mode === 'auto' ? round(solarBeforeDeadlineKwh) : round(expectedSolarChargeKwh),
    reserveMode,`);
    grid.func=grid.func.replace("if (mode === 'auto' && !forecastValid) return stopOwned('Zonverwachting voor de komende laadperiode ontbreekt of is te oud', details);",'');
    grid.func=grid.func.replace("if (gridEnergyNeededKwh === null ||", "if (mode === 'auto' && expensivePeriodStart === null) return stopOwned('Nog geen volgende dure periode in de beschikbare prijzen', details);\nif (gridEnergyNeededKwh === null ||");
    grid.func=grid.func.replace("'Geen rendabel laadkwartier binnen 24 uur'", "'Geen laadruimte vóór de dure periode'");
    // Show the active deadline and feasibility without hiding safety limits.
    grid.func=grid.func.replace('    planComplete:remainingEnergyKwh <= 0.05,', '    planComplete:remainingEnergyKwh <= 0.05,\n    deadlineWarning:remainingEnergyKwh > 0.05 ? \'Onvoldoende geplande laadruimte om vóór de dure periode vol te zijn\' : null,');
    for(const n of flows.filter(n=>n.type==='ui-template'&&n.format)) {
        n.format=n.format.replace('Geen vaste deadline; steeds 24 uur vooruit', "{{d.wit&&d.wit.gridCharge&&d.wit.gridCharge.chargeDeadline?'Vol vóór '+slotRange(d.wit.gridCharge.chargeDeadline,d.wit.gridCharge.chargeDeadline):'Wacht op volgende dure periode'}}");
        n.format=n.format.replace('Doorlopende planning voor de komende 24 uur','100% vóór de volgende dure periode');
        n.format=n.format.replace('Conservatief volgens reserveprofiel','Werkelijke zonnelading verlaagt de netbehoefte');
        n.format=n.format.replace(':value="d.wit&&d.wit.gridCharge&&d.wit.gridCharge.targetSoc||80"', ':disabled="d.wit&&d.wit.gridCharge&&d.wit.gridCharge.mode===\'auto\'" :value="d.wit&&d.wit.gridCharge&&d.wit.gridCharge.mode===\'auto\'?100:d.wit&&d.wit.gridCharge&&d.wit.gridCharge.targetSoc||80"');
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
