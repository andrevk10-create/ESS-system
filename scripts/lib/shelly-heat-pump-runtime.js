// Read-only commissioning preparation. No actuator commands leave this model.
function shellyHeatDefaults(){
    return {mode:'off',pumpEntity:'',demandEntity:'',temperatureEntities:['','',''],
        temperatureLocations:['','',''],blu:{temperature:'',humidity:'',battery:''},display:{temperature:'',humidity:'',battery:''},
        pumpLeadSeconds:30,pumpRunOnSeconds:180,probeMaxAgeMinutes:15,roomMaxAgeMinutes:120};
}
function shellyHeatValidate(input){
    const d=shellyHeatDefaults();
    if(input!==undefined&&(!input||typeof input!=='object'||Array.isArray(input)))throw Error('Ongeldige Shelly-voorbereiding');
    const c={...d,...input,blu:{...d.blu,...input?.blu},display:{...d.display,...input?.display}};
    const entity=(value,domain)=>typeof value==='string'&&(value===''||new RegExp('^'+domain+'\\.[a-z0-9_]+$').test(value));
    if(!['off','shadow'].includes(c.mode)||![c.pumpEntity,c.demandEntity].every(v=>entity(v,'switch')))throw Error('Shelly ondersteunt hier alleen uit of schaduwmodus met switch-koppelingen');
    if(c.pumpEntity&&c.pumpEntity===c.demandEntity)throw Error('Radiatorpomp en warmtevraag moeten twee afzonderlijke contacten zijn');
    if(!Array.isArray(c.temperatureEntities)||c.temperatureEntities.length!==3||!c.temperatureEntities.every(v=>entity(v,'sensor'))||
        new Set(c.temperatureEntities.filter(Boolean)).size!==c.temperatureEntities.filter(Boolean).length)throw Error('Kies drie afzonderlijke Shelly-temperatuursensoren');
    if(!Array.isArray(c.temperatureLocations)||c.temperatureLocations.length!==3||c.temperatureLocations.some(v=>typeof v!=='string'||v.length>60))throw Error('Geef de drie meetlocaties op, maximaal 60 tekens per locatie');
    for(const group of [c.blu,c.display])for(const key of ['temperature','humidity','battery'])if(!entity(group[key],'sensor'))throw Error('Ongeldige BLU- of display-sensor');
    const range=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
    if(!range(c.pumpLeadSeconds,10,300)||!range(c.pumpRunOnSeconds,30,900)||!range(c.probeMaxAgeMinutes,1,60)||!range(c.roomMaxAgeMinutes,5,360))throw Error('Controleer pompvolgorde en maximale meetleeftijd');
    return {mode:c.mode,pumpEntity:c.pumpEntity,demandEntity:c.demandEntity,temperatureEntities:c.temperatureEntities.slice(),temperatureLocations:c.temperatureLocations.slice(),
        blu:{temperature:c.blu.temperature,humidity:c.blu.humidity,battery:c.blu.battery},display:{temperature:c.display.temperature,humidity:c.display.humidity,battery:c.display.battery},
        pumpLeadSeconds:c.pumpLeadSeconds,pumpRunOnSeconds:c.pumpRunOnSeconds,probeMaxAgeMinutes:c.probeMaxAgeMinutes,roomMaxAgeMinutes:c.roomMaxAgeMinutes};
}
function shellyHeatPreview(input,states,request,previous,now){
    const c=shellyHeatValidate(input),identity=JSON.stringify(c);
    const memory=previous?.identity===identity&&now>=previous.at&&now-previous.at<=90000?{...previous}:{};
    const fresh=(e,minutes)=>{
        const at=Date.parse(e?.last_reported||e?.last_updated||e?.last_changed||'');
        return !!e&&!['unknown','unavailable',''].includes(String(e.state))&&Number.isFinite(at)&&now-at>=0&&now-at<=minutes*60000;
    };
    const contact=id=>{const e=states[id];return {entity:id||null,on:e?.state==='on',valid:!!id&&fresh(e,2)&&['on','off'].includes(e.state)};};
    const measurement=(id,kind,maxAge)=>{
        const e=states[id],unit=String(e?.attributes?.unit_of_measurement||''),raw=e?.state;
        const numeric=['number','string'].includes(typeof raw)&&String(raw).trim()!==''&&Number.isFinite(Number(raw));
        const n=numeric?Number(raw):null,range=kind==='probe'?[-40,125]:kind==='temperature'?[-20,60]:[0,100];
        const valid=!!id&&fresh(e,maxAge)&&numeric&&n>=range[0]&&n<=range[1]&&(kind==='probe'||kind==='temperature'?['°C','C'].includes(unit):unit==='%');
        return {entity:id||null,value:valid?n:null,unit,valid,reason:!id?'Nog niet gekoppeld':!fresh(e,maxAge)?'Niet beschikbaar of meetdata te oud':valid?'Meetwaarde beschikbaar':'Controleer meeteenheid en waarde'};
    };
    const pump=contact(c.pumpEntity),demand=contact(c.demandEntity);
    const probes=c.temperatureEntities.map((id,i)=>({...measurement(id,'probe',c.probeMaxAgeMinutes),location:c.temperatureLocations[i]||'Meetlocatie nog invullen',channel:i+1}));
    const room=group=>Object.fromEntries(['temperature','humidity','battery'].map(k=>[k,measurement(group[k],k,c.roomMaxAgeMinutes)]));
    const readingsReady=pump.valid&&demand.valid&&probes.every(p=>p.valid)&&c.temperatureLocations.every(v=>v.trim());
    const requestValid=request?.valid===true&&Number.isFinite(request.at)&&now-request.at>=0&&now-request.at<=90000;
    const requested=c.mode==='shadow'&&requestValid&&request.on===true;
    const pumpSeenAt=pump.valid&&pump.on?(memory.pumpSeenAt??now):null;
    const stoppedAt=memory.requested&&!requested?now:memory.stoppedAt;
    const runOn=Number.isFinite(stoppedAt)&&now-stoppedAt>=0&&now-stoppedAt<c.pumpRunOnSeconds*1000;
    const heatIntent=!!(requested&&readingsReady&&pumpSeenAt!==null&&now-pumpSeenAt>=c.pumpLeadSeconds*1000);
    // Display devices only supply measurements. A room target is never inferred
    // from an H&T sensor, and no fallback target is fabricated here.
    return {mode:c.mode,at:now,readOnly:true,commissionable:false,requested,requestValid,pump,demand,probes,blu:room(c.blu),display:room(c.display),
        pumpIntent:c.mode==='shadow'&&readingsReady&&(requested||runOn),heatIntent,
        reason:c.mode==='off'?'Shelly-voorbereiding staat uit':!readingsReady?'Schaduwmodus · vul koppelingen en meetlocaties aan':!requestValid?'Schaduwmodus · geen actuele bevestigde kamervraag':requested&&!heatIntent?'Schaduwmodus · eerst radiatorpomp en voorlooptijd bevestigen':heatIntent?'Schaduwmodus · radiatorpomp en warmtevraag voorgesteld':runOn?'Schaduwmodus · radiatorpomp zou nalopen':'Schaduwmodus · geen warmtevraag',
        memory:{identity,at:now,requested,pumpSeenAt,stoppedAt}};
}
module.exports={shellyHeatDefaults,shellyHeatValidate,shellyHeatPreview};
