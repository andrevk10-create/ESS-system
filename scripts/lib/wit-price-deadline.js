// The upper price quartile defines an expensive period. Skip the current
// expensive run: charging for that run is already too late.
function witPriceDeadline(slots, now) {
    const ordered = slots.filter(s => s.end > now).slice().sort((a,b) => a.start-b.start);
    const prices = ordered.map(s => s.allInPrice).sort((a,b)=>a-b);
    if (!prices.length || prices[prices.length-1]-prices[0] < 0.01) return null;
    const index=(prices.length-1)*0.75, lower=Math.floor(index);
    const threshold = prices[lower]+(prices[Math.ceil(index)]-prices[lower])*(index-lower);
    let cheaperSeen = false;
    for (const slot of ordered) {
        if (slot.allInPrice < threshold) cheaperSeen = true;
        else if (cheaperSeen && slot.start > now) return slot.start;
    }
    return null;
}

module.exports = function applyDeadline(flows) {
    const grid=flows.find(n=>n.id==='esswitgrid_ctrl1');
    grid.func=witPriceDeadline.toString()+'\n'+grid.func;
    grid.func=grid.func.replace('const targetSoc = Math.max(20,', "const targetSoc = mode === 'auto' ? 100 : Math.max(20,");
    // Do not credit solar from after the deadline, or an uncertain daily total.
    // Actual solar charging is reflected in measured SOC on the next tick.
    grid.func=grid.func.replace('const gridEnergyNeededKwh = mode', 'let gridEnergyNeededKwh = mode');
    const start=grid.func.indexOf('const economicSlots = slots.filter(');
    const end=grid.func.indexOf('const planLimitW =', start);
    if(start<0||end<0) throw Error('WIT planner anchor missing');
    grid.func=grid.func.slice(0,start)+`const expensivePeriodStart = witPriceDeadline(slots, now);
const deadlineHouseKwh = expensivePeriodStart === null ? 0 : reserveProfile.houseReserveKwh * Math.max(0, expensivePeriodStart-now) / 86400000;
if (mode === 'auto') gridEnergyNeededKwh = currentStoredKwh === null || expensivePeriodStart === null ? null
    : Math.max(0, batteryCapacityKwh-currentStoredKwh+deadlineHouseKwh) / chargeEfficiency;
const economicSlots = slots.filter(slot => expensivePeriodStart !== null && slot.start < expensivePeriodStart && slot.end <= expensivePeriodStart)
    .sort((a,b)=>a.allInPrice-b.allInPrice || a.start-b.start);
`+grid.func.slice(end);
    grid.func=grid.func.replace('    reserveMode,', `    chargeDeadline:expensivePeriodStart === null ? null : new Date(expensivePeriodStart).toISOString(),
    planningGoal:'100% vóór de dure periode',
    deadlineHouseKwh:round(deadlineHouseKwh),
    solarCreditKwh:mode === 'auto' ? 0 : round(expectedSolarChargeKwh),
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
