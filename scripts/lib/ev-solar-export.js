const {essExportPrice}=require('./export-price');
function evSolarExportWait(forecast, now, deadline, neededKwh, chargeKw, exportPrice, updatedAt) {
    const end = Number(deadline), stamp = new Date(updatedAt).getTime();
    if (!Number.isFinite(end) || end-now<=3600000 || !Number.isFinite(neededKwh) || neededKwh<0 ||
        !Number.isFinite(chargeKw) || chargeKw<=0 || !Number.isFinite(exportPrice) ||
        !Number.isFinite(stamp) || now-stamp<0 || now-stamp>2*3600000) return false;
    // Reserve an hour at the end and 25% capacity for delays/shared charging.
    const slots = (Array.isArray(forecast)?forecast:[]).map(s=>({
        start:Math.max(now+15*60000,new Date(s.start).getTime()),
        end:Math.min(end-3600000,new Date(s.end).getTime()), price:Number(s.allInPrice)
    })).filter(s=>Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.end>s.start&&
        Number.isFinite(s.price)&&s.price<exportPrice-0.01).sort((a,b)=>a.start-b.start);
    let capacity=0, previousEnd=now;
    for(const s of slots){const start=Math.max(s.start,previousEnd);if(s.end>start)capacity+=(s.end-start)/3600000*chargeKw*0.75;previousEnd=Math.max(previousEnd,s.end);}
    return slots.length>0 && capacity>=Math.max(1,neededKwh/0.92);
}
function unapply(flows) {
    for(const id of ['ess00000000000d','essjeep_ess00000000000d']) {
        const n=flows.find(n=>n.id===id);
        n.func=n.func.replace(/function evSolarExportWait\([\s\S]*?\n\}\n/g,'')
            .replace(/function essExportPrice\([\s\S]*?\n\}\n/g,'')
            .replace(/const solarExportWait = [^\n]*;\n/g,'')
            .replace(/const solarPhaseAdjustmentAllowed = (?:!solarExportWait && )+/g,'const solarPhaseAdjustmentAllowed = ')
            .replace(/\} else if \(solarExportWait\) \{[\s\S]*?\} else if \(audiSoc >= solarSoc\) \{/g,'} else if (audiSoc >= solarSoc) {');
    }
}
module.exports = function applySolarExport(flows) {
    unapply(flows);
    for(const id of ['ess00000000000d','essjeep_ess00000000000d']) {
        const n=flows.find(n=>n.id===id);
        n.func=essExportPrice.toString()+'\n'+evSolarExportWait.toString()+'\n'+n.func;
        n.func=n.func.replace('const solarPhaseAdjustmentAllowed =', `const solarExportWait = priceIsFresh && evSolarExportWait(forecast,now,departure?.getTime(),departureEnergyNeeded,netChargePowerKw,essExportPrice(marketPrice,allInPrice,now,flow.get('ess_export_saldering_2026')!==false),(flow.get('ess_nordpool_forecast_meta')||{}).updatedAt);
const solarPhaseAdjustmentAllowed = !solarExportWait &&`);
        n.func=n.func.replace('} else if (audiSoc >= solarSoc) {', `} else if (solarExportWait) {
        solarReadySince=0;solarInsufficientSince=0;solarStartedAt=0;
        reason='Zonnestroom terugleveren: later goedkoper laden vóór vertrek';
    } else if (audiSoc >= solarSoc) {`);
    }
};
module.exports.evSolarExportWait=evSolarExportWait;
module.exports.unapply=unapply;
