// Hourly measurements use the same validated, EV-free samples as daily learning.
function houseTimeProfileValid(v){
    return v?.version===1&&v.days&&Object.keys(v.days).length<=31&&Object.entries(v.days).every(([day,rows])=>/^\d{4}-\d{2}-\d{2}$/.test(day)&&Array.isArray(rows)&&rows.length===24&&rows.every(r=>r&&Number.isFinite(r.kwh)&&r.kwh>=0&&Number.isFinite(r.seconds)&&r.seconds>=0&&r.seconds<=7500))?v:null;
}
function houseTimeProfileStep(previous,sample,now){
    if(previous!=null&&!houseTimeProfileValid(previous))throw Error('Woning-uurprofiel ongeldig; bestaande gegevens behouden');
    const model=previous||{version:1,days:{},last:null};
    // An old delivery must neither add energy nor erase a newer valid anchor.
    if(Number.isFinite(model.updatedAt)&&now<model.updatedAt)return model;
    const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'});
    const parts=t=>Object.fromEntries(fmt.formatToParts(new Date(t)).map(p=>[p.type,p.value]));
    const today=parts(now),cutoff=new Date(Date.UTC(Number(today.year),Number(today.month)-1,Number(today.day)-29)).toISOString().slice(0,10);
    for(const key of Object.keys(model.days))if(key<cutoff)delete model.days[key];
    const power=sample?.basePowerW;
    if(typeof power!=='number'||!Number.isFinite(power)||power<0||power>100000){model.last=null;model.updatedAt=now;return model;}
    const last=model.last;
    if(last&&now<=last.at)return model;
    if(last&&now-last.at<=300000){
        for(let from=last.at;from<now;){
            const to=Math.min(now,(Math.floor(from/3600000)+1)*3600000),p=parts(from),day=p.year+'-'+p.month+'-'+p.day;
            model.days[day]??=Array.from({length:24},()=>({kwh:0,seconds:0}));
            const a=last.w+(power-last.w)*(from-last.at)/(now-last.at),b=last.w+(power-last.w)*(to-last.at)/(now-last.at);
            const row=model.days[day][Number(p.hour)];row.kwh+=(a+b)/2*(to-from)/3600000000;row.seconds+=(to-from)/1000;from=to;
        }
    }
    model.last={at:now,w:power};model.updatedAt=now;return model;
}
function houseTimeProfileForecast(model,now,end,fallbackDayKwh){
    const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'});
    const parts=t=>Object.fromEntries(fmt.formatToParts(new Date(t)).map(p=>[p.type,p.value]));
    const p=parts(now),today=p.year+'-'+p.month+'-'+p.day;
    const cutoff=new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day)-29)).toISOString().slice(0,10);
    const weekend=day=>[0,6].includes(new Date(day+'T12:00:00Z').getUTCDay());
    const days=houseTimeProfileValid(model)?Object.entries(model.days).filter(([date])=>date>=cutoff&&date<=today):[];
    const measuredDays=days.filter(([,rows])=>rows.some(r=>r.seconds>=900)).length;
    const segments=[];let learnedHours=0,pooledHours=0;
    for(let from=now;from<end;){
        const to=Math.min(end,(Math.floor(from/3600000)+1)*3600000),local=parts(from),date=local.year+'-'+local.month+'-'+local.day,hour=Number(local.hour);
        const available=days.filter(([,rows])=>rows[hour].seconds>=2700);
        const partial=days.filter(([,rows])=>rows[hour].seconds>=900);
        const similar=available.filter(([d])=>weekend(d)===weekend(date));
        const similarPartial=partial.filter(([d])=>weekend(d)===weekend(date));
        // Repeated valid partial measurements can teach an hour even when
        // outages prevent 45 minutes on one day. Never bridge those gaps.
        // Require three distinct days, each >=15 min and >=90 min in total.
        const sufficient=rows=>rows.length>=3&&rows.reduce((s,[,r])=>s+r[hour].seconds,0)>=5400;
        let chosen=similar.length>=3?similar:available,pooled=false;
        if(similar.length<3&&sufficient(similarPartial)){chosen=similarPartial;pooled=true;}
        else if(chosen.length<3&&sufficient(partial)){chosen=partial;pooled=true;}
        const kwhPerHour=chosen.length?(pooled
            ?chosen.reduce((s,[,r])=>s+r[hour].kwh,0)*3600/chosen.reduce((s,[,r])=>s+r[hour].seconds,0)
            :chosen.reduce((sum,[,rows])=>sum+rows[hour].kwh*3600/rows[hour].seconds,0)/chosen.length):Math.max(0,fallbackDayKwh)/24;
        const learned=chosen.length>0;
        if(learned)learnedHours+=(to-from)/3600000;
        if(pooled)pooledHours+=(to-from)/3600000;
        segments.push({start:from,end:to,kwhPerHour,days:chosen.length,learned,pooled,measuredMinutes:chosen.reduce((s,[,r])=>s+r[hour].seconds/60,0)});from=to;
    }
    return {segments,days:measuredDays,windowDays:30,learnedHours,pooledHours,hours:Math.max(0,end-now)/3600000,
        source:learnedHours?'Uurgemiddelden over maximaal 30 dagen, zonder beide laadpunten'+(pooledHours?' · herhaalde deelmetingen benut':''):'Uurprofiel wordt opgebouwd; ontbrekende uren gebruiken het daggemiddelde'};
}
module.exports=function apply(flows){
    const get=id=>flows.find(n=>n.id===id),history=get('esswithist_prep1');
    const helpers=[houseTimeProfileValid,houseTimeProfileStep,houseTimeProfileForecast].map(f=>f.toString()).join('\n');
    const anchor="flow.set('ess_house_consumption_learning', houseLearning);";
    if(!history.func.includes(anchor))throw Error('EV-free household learning anchor missing');
    history.func=history.func.replace(anchor,helpers+'\n'+anchor+`\nif(flow.get('ess_charging_preferences_ready')===true){try{flow.set('ess_house_time_profile',houseTimeProfileStep(flow.get('ess_house_time_profile'),houseSample,now.getTime()));}catch(e){node.warn(e.message);}}`);
    const grid=get('esswitgrid_ctrl1');grid.func=houseTimeProfileValid.toString()+'\n'+houseTimeProfileForecast.toString()+'\n'+grid.func;
    const call="const knownPricePlan=mode==='auto'?witKnownPricePlan(slots,now,reserveInputs,solarWindow,states,wearCostPerKwh,minimumBenefitPerKwh):null;";
    if(!grid.func.includes(call))throw Error('Known-price planner anchor missing');
    grid.func=grid.func.replace(call,`const houseTimeProfile=houseTimeProfileForecast(flow.get('ess_house_time_profile'),now,horizonEnd,reserveInputs.houseKwh);
const knownPricePlan=mode==='auto'?witKnownPricePlan(slots,now,{...reserveInputs,hourlyProfile:houseTimeProfile},solarWindow,states,wearCostPerKwh,minimumBenefitPerKwh):null;`);
    grid.func=grid.func.replace('    knownPriceUntil:',`    houseTimeProfile:{source:houseTimeProfile.source,days:houseTimeProfile.days,learnedHours:houseTimeProfile.learnedHours,hours:houseTimeProfile.hours,windowDays:30,reserveFloorSoc:20,hardwareFloorSoc:10},
    knownPriceUntil:`);
    for(const id of ['essprefs_save','essprefs_restore']){
        const n=get(id);n.func=houseTimeProfileValid.toString()+'\n'+n.func;
        if(id==='essprefs_save')n.func=n.func.replace('    return result;',"    const hourly=houseTimeProfileValid(flow.get('ess_house_time_profile'));if(hourly)result.houseTimeProfile={...hourly,last:null};\n    const daily=flow.get('ess_house_consumption_learning');if(daily?.schemaVersion===2)result.houseDailyLearning={...daily,lastBasePowerW:null,lastSampleAt:null};\n    return result;");
        else n.func=n.func.replace('    for (const [key,value] of Object.entries(candidate))',"    const hourly=houseTimeProfileValid(saved.houseTimeProfile);if(hourly&&!flow.get('ess_house_time_profile'))flow.set('ess_house_time_profile',{...hourly,last:null});\n    if(saved.houseDailyLearning?.schemaVersion===2&&!flow.get('ess_house_consumption_learning'))flow.set('ess_house_consumption_learning',{...saved.houseDailyLearning,lastBasePowerW:null,lastSampleAt:null});\n    for (const [key,value] of Object.entries(candidate))");
    }
    const mapper=get('ess00000000000a');mapper.func=mapper.func.replace('            knownPriceUntil:witGridChargeStored.knownPriceUntil||null,','            houseTimeProfile:witGridChargeStored.houseTimeProfile||null,\n            knownPriceUntil:witGridChargeStored.knownPriceUntil||null,');
    for(const n of flows.filter(n=>n.type==='ui-template'&&n.format))n.format=n.format.replace(/(<div class="panel-head"><b>WIT slim netladen<\/b><span>[^<]*<\/span><\/div>)/,
        '$1<p class="subtle">{{d.wit?.gridCharge?.houseTimeProfile?.source}} · {{d.wit?.gridCharge?.houseTimeProfile?.days||0}} dagen met uurmetingen · {{Number(d.wit?.gridCharge?.houseTimeProfile?.learnedHours||0).toFixed(1)}} van {{Number(d.wit?.gridCharge?.houseTimeProfile?.hours||0).toFixed(1)}} uur geleerd · 10 procentpunt reserve boven de ondergrens</p>');
};
module.exports.houseTimeProfileStep=houseTimeProfileStep;
module.exports.houseTimeProfileForecast=houseTimeProfileForecast;
module.exports.houseTimeProfileValid=houseTimeProfileValid;
