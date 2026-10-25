function localTomorrowDay(now){
    const f=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'});
    return f.format(new Date(Date.parse(f.format(new Date(now))+'T12:00:00Z')+86400000));
}
function plannedDayEnergy(plan,day,now){
    if(!plan||plan.enabled===false||plan.mode==='off')return 0;
    const at=Date.parse(plan.updatedAt||'');
    if(plan.updatedAt&&(!Number.isFinite(at)||now<at||now-at>150000))return null;
    const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'});
    let total=0;
    for(const s of plan.selectedSlots||[]){
        const a=Date.parse(s.start),b=Date.parse(s.end),energy=s.energyKwh??s.energy;
        if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a||b-a>72*3600000)return null;
        const kwh=typeof energy==='number'&&Number.isFinite(energy)?energy:typeof s.powerKw==='number'&&Number.isFinite(s.powerKw)?s.powerKw*(b-a)/3600000:null;
        if(kwh===null||kwh<0)return null;
        for(let from=a;from<b;){const to=Math.min(b,(Math.floor(from/3600000)+1)*3600000);if(fmt.format(new Date(from))===day)total+=kwh*(to-from)/(b-a);from=to;}
    }
    return total;
}
module.exports=function apply(flows){
    const mapper=flows.find(n=>n.id==='ess00000000000a');
    mapper.func=mapper.func.replace(/^function (?:plannedDayEnergy|localTomorrowDay)\([\s\S]*?^\}\r?\n/gm,'').replace(/\/\/ BEGIN END USE FORECAST[\s\S]*?\/\/ END END USE FORECAST\n/g,'');
    mapper.func=localTomorrowDay.toString()+'\n'+plannedDayEnergy.toString()+'\n'+mapper.func;
    const anchor="flow.set('ess_dashboard_live', dashboard);";
    mapper.func=mapper.func.replace(anchor,`// BEGIN END USE FORECAST
const forecastDay=localTomorrowDay(Date.now());
const forecastAudi=plannedDayEnergy(flow.get('ess_audi_control_status'),forecastDay,Date.now());
const forecastJeep=plannedDayEnergy(flow.get('ess_jeep_control_status'),forecastDay,Date.now());
const forecastStorage=plannedDayEnergy(flow.get('ess_wit_grid_charge_status'),forecastDay,Date.now());
dashboard.house.audiPlannedTomorrow=forecastAudi;dashboard.house.jeepPlannedTomorrow=forecastJeep;dashboard.house.witPlannedTomorrow=forecastStorage;
dashboard.house.forecastTomorrow=Number.isFinite(dashboard.house.forecastBaseTomorrow)&&forecastAudi!==null&&forecastJeep!==null?dashboard.house.forecastBaseTomorrow+forecastAudi+forecastJeep:null;
dashboard.house.forecastIncludesStorage=false;dashboard.house.forecastConditionalEV=true;
// END END USE FORECAST
${anchor}`);
    for(const ui of flows.filter(n=>n.type==='ui-template'&&n.format)){
        ui.format=ui.format.replace('Inclusief geplande laadenergie','Woning en beide auto’s · opslag apart')
            .replace(' · EV {{energy(d.house&&d.house.audiPlannedTomorrow)}} · WIT {{energy(d.house&&d.house.witPlannedTomorrow)}}',' · Audi {{energy(d.house&&d.house.audiPlannedTomorrow)}} · Jeep {{energy(d.house&&d.house.jeepPlannedTomorrow)}}')
            .replace('<span>VERBRUIK VERWACHT MORGEN</span>','<span>WONING + GEPLAND AUTOLADEN MORGEN</span>')
            .replace(' · Jeep {{energy(d.house&&d.house.jeepPlannedTomorrow)}}</small>',' · Jeep {{energy(d.house&&d.house.jeepPlannedTomorrow)}}</small><small>Apart gepland acculaden: {{energy(d.house&&d.house.witPlannedTomorrow)}} · niet opgeteld bij eindverbruik of gelijk aan netafname. Autoplannen gelden mits aangesloten; extra zonneladen zit niet in deze optelling.</small>');
    }
};
module.exports.plannedDayEnergy=plannedDayEnergy;
module.exports.localTomorrowDay=localTomorrowDay;
