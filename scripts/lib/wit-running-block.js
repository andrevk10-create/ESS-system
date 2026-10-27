// Keep a running, still affordable block until its original end. Replanning
// from rounded SOC must not move that end forward or turn it into short pulses.
function witRunningBlock(selected, previous, slots, now, chargeKw) {
    if (!previous?.sessionOwned || previous.releasing || !(chargeKw > 0)) return selected;
    if (selected.some(s => s.start <= now && s.end > now)) return selected;
    const running = (previous.selectedSlots || []).find(s => s.start <= now && s.end > now);
    const price = slots.find(s => s.start <= now && s.end > now);
    if (!running || !price || !Number.isFinite(price.allInPrice) ||
        !Number.isFinite(running.allInPrice) || Math.abs(price.allInPrice - running.allInPrice) > .000001) return selected;
    const needed = selected.reduce((sum,s) => sum+s.energyKwh, 0);
    if (!(needed > 0)) return selected;
    const powerKw = Math.min(chargeKw, running.powerKw,
        Number.isFinite(price.sharedChargeKw) ? Math.max(0, price.sharedChargeKw) : chargeKw);
    if (!(powerKw > 0)) return selected;
    const end = Math.min(running.end, price.end, now+needed/powerKw*3600000);
    if (!(end > now)) return selected;
    const remainder = selected.filter(s => s.end > end).map(s => {
        if (s.start >= end) return s;
        const start = end;
        return {...s, start, energyKwh:s.energyKwh * (s.end-start)/(s.end-s.start)};
    });
    const energyKwh = powerKw*(end-now)/3600000;
    const total = energyKwh+remainder.reduce((sum,s)=>sum+s.energyKwh,0);
    if (total < needed-1e-9) return selected;
    let excess = Math.max(0,total-needed);
    // Move energy forward from the last planned blocks; never buy extra energy
    // merely to keep the current command running.
    for (let i=remainder.length-1;i>=0 && excess>1e-9;i--) {
        const s=remainder[i], remove=Math.min(excess,s.energyKwh);
        excess-=remove;
        if (remove>=s.energyKwh) remainder.splice(i,1);
        else remainder[i]={...s,energyKwh:s.energyKwh-remove,
            end:s.start+(s.end-s.start)*(s.energyKwh-remove)/s.energyKwh};
    }
    return [{...running, start:now, end, powerKw, energyKwh}, ...remainder];
}
module.exports = function apply(flows) {
    const grid = flows.find(n => n.id === 'esswitgrid_ctrl1');
    const marker = 'const scheduledSlot = selectedSlots.find(';
    if (!grid.func.includes(marker)) throw Error('Running charge block anchor missing');
    grid.func = witRunningBlock.toString()+'\n'+grid.func.replace(marker,
        "if (mode === 'auto') selectedSlots = witRunningBlock(selectedSlots, previous, slots, now, reserveInputs.chargeKw);\n"+marker);
};
module.exports.witRunningBlock = witRunningBlock;
