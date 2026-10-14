// Effective export value. Saldering is explicitly enabled per installation and
// expires at the end of 2026. The user's additional 2 cent export bonus applies
// only to exported kWh; import/charging tariffs are never increased here.
function essExportPrice(marketPrice, allInPrice, at, saldering2026) {
    const stamp=typeof at==='number'?at:Date.parse(at);
    if(saldering2026===true && Number.isFinite(stamp) && stamp<Date.parse('2027-01-01T00:00:00+01:00') &&
        typeof allInPrice==='number' && Number.isFinite(allInPrice))return allInPrice+0.02;
    return typeof marketPrice==='number' && Number.isFinite(marketPrice)?marketPrice*1.21+0.02:null;
}
module.exports={essExportPrice};
