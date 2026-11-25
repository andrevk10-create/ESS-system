// For each slot count, start count and on/off state, retain the cheapest prefix.
// Freeze partial quarters so switching full quarters preserves planned energy.
module.exports = function compactEvSlots(candidates, selected, currentSlot) {
    if (!selected.length || selected.length === candidates.length) return selected;
    const slots = candidates.slice().sort((a,b) => a.start-b.start);
    const baseline = new Set(selected);
    const ceiling = selected.reduce((sum,s) => sum+s.energy*s.allInPrice, 0) + 0.05/3;
    const count = selected.length;
    const stride = 2*(count+1);
    let states = new Map([[0, {cost:0, mask:0n}]]);
    for (let i=0; i<slots.length; i++) {
        const s = slots[i];
        const locked = s === currentSlot || s.usableEnd-s.usableStart !== 900000;
        const contiguous = i>0 && slots[i-1].usableEnd === s.usableStart;
        const next = new Map();
        function retain(key,cost,mask) {
            if (!next.has(key) || cost < next.get(key).cost) next.set(key,{cost,mask});
        }
        for (const [key,state] of states) {
            const used = Math.floor(key/stride);
            const starts = Math.floor((key%stride)/2);
            const on = key%2 === 1;
            if ((!locked || !baseline.has(s)) && used+slots.length-i-1 >= count)
                retain(used*stride+2*starts,state.cost,state.mask);
            if (used<count && (!locked || baseline.has(s))) {
                const continues = (on && contiguous) || s === currentSlot;
                retain((used+1)*stride+2*(starts+Number(!continues))+1,
                    state.cost+s.energy*s.allInPrice,state.mask | (1n<<BigInt(i)));
            }
        }
        states = next;
    }
    let best, fewest = Infinity;
    for (const [key,state] of states) {
        const starts = Math.floor((key%stride)/2);
        if (state.cost <= ceiling+1e-9 && (starts<fewest || (starts===fewest && state.cost<best.cost))) {
            best=state;
            fewest=starts;
        }
    }
    return best ? slots.filter((s,i) => best.mask & (1n<<BigInt(i))) : selected;
};
