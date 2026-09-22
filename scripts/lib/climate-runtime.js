// Pure, embedded runtime. Installation identities remain in the private profile.
function climateDefaults() {
    return {version:1,mode:'auto',profile:'normal',maximumPowerW:0,phaseWeights:[0,0,0],
        minimumBenefit:0.04,houseReserveKwh:14,batteryFloorSoc:50,manualMinutes:120,
        rooms:[{key:'room1',label:'Woonkamer',role:'',enabled:false,comfort:21,minimum:18,maximum:22,schedule:'native',start:'07:00',end:'22:00',preheatMinutes:60},
            {key:'room2',label:'Badkamer',role:'',enabled:false,comfort:21,minimum:18,maximum:22,schedule:'native',start:'07:00',end:'09:00',preheatMinutes:60}],
        water:{enabled:false,normal:0,buffer:0,minimum:0,litres:0,lossKwhPerDay:0,boostMinutes:60,restoreAcknowledged:false}};
}

function climateValidate(input) {
    const fail = message => { throw new Error(message); };
    if (!input || input.version !== 1) fail('Ongeldige klimaatconfiguratie');
    const d = climateDefaults(), c = {...d,...input,water:{...d.water,...input.water}};
    if (!['auto','advice','off'].includes(c.mode) || !['eco','normal','comfort'].includes(c.profile)) fail('Ongeldige klimaatstand');
    const num = (v,min,max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
    if (!num(c.maximumPowerW,0,30000) || !num(c.minimumBenefit,0,2) || !num(c.houseReserveKwh,0,200) || !num(c.batteryFloorSoc,10,100) || !num(c.manualMinutes,30,1440)) fail('Ongeldige installatiegrenzen');
    if (!Array.isArray(c.phaseWeights) || c.phaseWeights.length !== 3 || c.phaseWeights.some(x=>!num(x,0,1))) fail('Ongeldige faseverdeling');
    if (c.maximumPowerW > 0 && Math.abs(c.phaseWeights.reduce((a,b)=>a+b,0)-1)>0.001) fail('Faseverdeling moet samen 1 zijn');
    if (!Array.isArray(c.rooms) || c.rooms.length !== 2) fail('Kies precies twee ruimten');
    const used = new Set();
    c.rooms = c.rooms.map((r,i)=>{
        const z = {...d.rooms[i],...r,key:d.rooms[i].key};
        if (typeof z.enabled !== 'boolean' || !['','climate.heating_zone_1','climate.heating_zone_2','climate.heating_zone_3'].includes(z.role)) fail('Kies een gekoppelde Tado-verwarmingszone');
        if (z.role && used.has(z.role)) fail('Ruimten mogen niet dezelfde rol gebruiken');
        if (z.role) used.add(z.role);
        if (!['native','custom'].includes(z.schedule) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(z.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(z.end) || !num(z.preheatMinutes,0,180)) fail('Ongeldige comforttijden');
        if (z.enabled && (!z.role || !num(z.minimum,5,25) || !num(z.comfort,z.minimum,25) || !num(z.maximum,z.comfort,25))) fail('Stel eerst de comfortband in');
        return {key:z.key,label:d.rooms[i].label,role:z.role,enabled:z.enabled,comfort:z.comfort,minimum:z.minimum,maximum:z.maximum,schedule:z.schedule,start:z.start,end:z.end,preheatMinutes:z.preheatMinutes};
    });
    const w = c.water;
    if (typeof w.enabled !== 'boolean' || typeof w.restoreAcknowledged !== 'boolean') fail('Ongeldige tapwatertoestemming');
    if (w.enabled && (!num(w.minimum,40,60) || !num(w.normal,w.minimum,60) || !num(w.buffer,w.normal,60) || !num(w.litres,30,2000) || !num(w.lossKwhPerDay,0,15) || !num(w.boostMinutes,30,180))) fail('Controleer vatinhoud en tapwatergrenzen');
    return {version:1,mode:c.mode,profile:c.profile,maximumPowerW:c.maximumPowerW,phaseWeights:c.phaseWeights.slice(),minimumBenefit:c.minimumBenefit,
        houseReserveKwh:c.houseReserveKwh,batteryFloorSoc:c.batteryFloorSoc,manualMinutes:c.manualMinutes,rooms:c.rooms,
        water:{enabled:w.enabled,normal:w.normal,buffer:w.buffer,minimum:w.minimum,litres:w.litres,lossKwhPerDay:w.lossKwhPerDay,boostMinutes:w.boostMinutes,restoreAcknowledged:w.restoreAcknowledged}};
}

function climateNumber(v) { return v === null || v === undefined || v === '' || typeof v === 'boolean' || !Number.isFinite(Number(v)) ? null : Number(v); }
function climateFresh(item, now, maxAge) {
    if (!item || ['unknown','unavailable',''].includes(String(item.state).toLowerCase())) return false;
    const age = now - new Date(item.last_reported || item.last_updated || item.last_changed || 0).getTime();
    return age >= -60000 && age <= maxAge;
}
function climateSchedule(z, at) {
    const d=new Date(at), t=d.getHours()*60+d.getMinutes();
    const minutes=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
    const a=minutes(z.start),b=minutes(z.end);
    return a === b || (a < b ? t >= a && t < b : t >= a || t < b);
}

function climateCheapBlock(prices,now,minutes,benefit) {
    const duration=minutes*60000;
    const average=start=>{
        const end=start+duration;let cursor=start,total=0;
        for(const p of prices) {
            if(p.end<=cursor) continue;
            if(p.start>cursor) return null;
            const stop=Math.min(end,p.end);
            total+=(stop-cursor)*p.price;cursor=stop;
            if(cursor>=end) return total/duration;
        }
        return null;
    };
    const current=average(now);
    const future=prices.filter(p=>p.start>now&&p.start<now+8*3600000).map(p=>average(p.start)).filter(p=>p!==null).sort((a,b)=>a-b);
    if(current===null||!future.length) return false;
    return current<=future[0]+0.000001 && future[Math.floor(future.length*0.7)]-current>=benefit;
}

function climatePlan({config,system,states,prices,weather,energy,now}) {
    const c=climateValidate(config), mapping=system.entities || {}, specs=system.specs || {};
    const entity=role=>mapping[role] ? states[mapping[role]] : null;
    const value=role=>climateNumber(entity(role)?.state);
    const watts=role=>{const unit=String(entity(role)?.attributes?.unit_of_measurement||'').toLowerCase(),n=value(role);return n!==null&&['w','kw'].includes(unit)?n*(unit==='kw'?1000:1):null;};
    const phaseRoles=[1,2,3].map(i=>'sensor.p1_meter_vermogen_fase_'+i);
    const phaseReadings=phaseRoles.map(watts);
    const freshPhases=phaseRoles.every(r=>climateFresh(entity(r),now,15000));
    const phaseLimit=(Number(specs.mainFuseA)||25)-3, volts=Number(specs.voltage)||230;
    const meter=entity('sensor.flex_load_4_power'), meterUnit=String(meter?.attributes?.unit_of_measurement||'').toLowerCase();
    const meterValue=climateNumber(meter?.state);
    const measuredPowerW=climateFresh(meter,now,120000) && meterValue!==null && ['w','kw'].includes(meterUnit) ? meterValue*(meterUnit==='kw'?1000:1) : null;
    const meterReady=measuredPowerW!==null && measuredPowerW>=0 && measuredPowerW<=c.maximumPowerW;
    const netReady=c.maximumPowerW>0 && meterReady && freshPhases && phaseReadings.every((p,i)=>p!==null && p+c.maximumPowerW*c.phaseWeights[i] <= phaseLimit*volts);
    // Full EHS power is reserved conservatively; unknown existing load is never
    // subtracted to manufacture headroom. No phase map means no new boost.
    const ps=(prices || []).map(p=>({start:new Date(p.start).getTime(),end:new Date(p.end).getTime(),price:climateNumber(p.allInPrice)}))
        .filter(p=>p.price!==null && p.start<now+36*3600000 && p.end>now && p.end>p.start).sort((a,b)=>a.start-b.start);
    const current=ps.find(p=>p.start<=now && p.end>now);
    const cheap=climateCheapBlock(ps,now,30,c.minimumBenefit);
    const waterCheap=climateCheapBlock(ps,now,c.water.boostMinutes,c.minimumBenefit);
    const grid=watts('sensor.p1_meter_vermogen');
    const batteryPower=watts('sensor.growatt_battery_battery_power');
    // Export alone is not proof of solar surplus: a battery may be exporting.
    // Requiring near-zero battery power avoids relying on a vendor sign convention.
    const solarSurplus=climateFresh(entity('sensor.p1_meter_vermogen'),now,15000) && grid!==null && -grid>=c.maximumPowerW && c.maximumPowerW>0 &&
        climateFresh(entity('sensor.growatt_battery_battery_power'),now,120000) && batteryPower!==null && Math.abs(batteryPower)<=200 && energy?.solarStable===true;
    const soc=value('sensor.growatt_battery_battery_soc');
    const batteryFresh=climateFresh(entity('sensor.growatt_battery_battery_soc'),now,300000);
    const capacity=Number(specs.batteryCapacityKwh)||30;
    const reserve=Math.max(c.houseReserveKwh,Number(energy?.houseReserveKwh)||0);
    const protectedKwh=Math.max(c.batteryFloorSoc/100*capacity,reserve+Math.max(0,Number(energy?.evReservedKwh)||0));
    const spare=batteryFresh && soc!==null && soc>=0 && soc<=100 && !energy?.gridChargeOwned ? Math.max(0,soc/100*capacity-protectedKwh) : 0;
    const weatherFresh=weather && now-weather.at>=0 && now-weather.at<=3*3600000 && Array.isArray(weather.hours) && weather.hours.some(h=>h.at>=now&&h.at<=now+8*3600000&&Number.isFinite(h.temperature));
    const hours=weatherFresh && Array.isArray(weather.hours) ? weather.hours.filter(h=>h.at>=now-3600000 && h.at<=now+8*3600000) : [];
    const outside=climateNumber(entity('sensor.outdoor_temperature')?.state);
    const coldAhead=outside!==null && hours.some(h=>h.temperature<outside-2);
    const signals={cheap,waterCheap,solarSurplus,spareKwh:spare,soc:batteryFresh?soc:null,protectedKwh,coldAhead,outsideTemperature:outside,weatherFresh:!!weatherFresh,netReady,meterReady,measuredPowerW,meterOverLimit:measuredPowerW!==null&&measuredPowerW>c.maximumPowerW,currentPrice:current?.price??null};
    const candidates=[];
    for (const z of c.rooms) {
        const e=entity(z.role), a=e?.attributes||{}, temp=climateNumber(a.current_temperature), target=climateNumber(a.temperature);
        // Native schedule: only its current target is exposed by HA. Do not
        // invent future comfort periods or override a native night setback.
        const active=z.schedule==='native' ? target!==null && target>=z.comfort : climateSchedule(z,now);
        const upcoming=z.schedule==='custom' && climateSchedule(z,now+z.preheatMinutes*60000);
        let reason='Eigen Tado-regeling', requested=null, kind='native';
        if (!z.enabled) reason='Niet vrijgegeven';
        else if (!climateFresh(e,now,20*60000) || temp===null || target===null) reason='Tado-meetdata ontbreekt of is te oud';
        else if (!['heat','auto'].includes(e.state) || a.preset_mode==='away') reason='Apparaat uit/afwezig: handmatige stand respecteren';
        else if (temp<z.minimum-0.1) {requested=z.minimum;reason='Onder minimumtemperatuur';kind='comfort';}
        else if (active && temp<z.comfort-0.3) {requested=z.comfort;reason='Comfortperiode';kind='comfort';}
        else if ((active||upcoming) && weatherFresh && temp<z.maximum-0.3 && (cheap||solarSurplus||spare>=c.maximumPowerW/1000)) {
            const offset=c.profile==='eco'?0:c.profile==='comfort'?1:0.5;
            requested=Math.min(z.maximum,z.comfort+(active||coldAhead?offset:0));
            reason=cheap?'Goedkope warmte voorbereiden':solarSurplus?'Zonoverschot benutten':'Beschikbare accureserve benutten';kind='boost';
        }
        if (requested!==null && (!netReady || c.maximumPowerW===0)) {requested=null;reason='Wacht op bevestigde EHS-grens en veilige P1-netruimte';}
        const step=climateNumber(a.target_temp_step)||0.5;
        if (requested!==null) requested=Math.floor(requested/step)*step;
        if (kind==='boost' && requested!==null && temp>=requested-0.1) {requested=null;reason='Ruimte al op voorverwarmtemperatuur';}
        if (requested!==null && (climateNumber(a.min_temp)===null || climateNumber(a.max_temp)===null || requested<climateNumber(a.min_temp) || requested>climateNumber(a.max_temp) || !Array.isArray(a.hvac_modes)||!a.hvac_modes.includes('heat'))) {requested=null;reason='Doel buiten apparaatmogelijkheden';}
        candidates.push({key:z.key,label:z.label,role:z.role,entity:mapping[z.role]||null,current:temp,observedTarget:target,target:requested,reason,kind,heating:a.hvac_action==='heating',normal:z.comfort,mode:e?.state,feedbackFresh:climateFresh(e,now,20*60000)});
    }
    const w=c.water, e=entity('water_heater.domestic_hot_water'),a=e?.attributes||{};
    const hygiene=entity('binary_sensor.dhw_hygiene_active');
    const hygieneClear=climateFresh(hygiene,now,120000) && hygiene.state==='off';
    const temp=climateNumber(a.current_temperature), target=climateNumber(a.temperature);
    let requested=null,reason='Eigen tapwaterregeling',kind='native';
    const boostKwh=(w.buffer-w.normal)*w.litres*0.001163+ w.lossKwhPerDay*w.boostMinutes/1440;
    if (!w.enabled) reason='Tapwatergrenzen nog niet vrijgegeven';
    else if (!climateFresh(e,now,20*60000)||temp===null||target===null) reason='Tapwatermeting ontbreekt of is te oud';
    else if (!['eco','heat_pump'].includes(e.state) || target>w.buffer) reason='Apparaatstand / hogere cyclus respecteren';
    else if (!hygieneClear) reason='Hygiënecyclus actief of status onbekend; eigen tapwaterregeling behouden';
    else if (temp<w.minimum && target<w.normal && netReady) {requested=w.normal;kind='comfort';reason='Normaal warmwaterdoel herstellen';}
    else if (temp<w.buffer-0.5 && w.buffer>w.normal && w.restoreAcknowledged && netReady && (waterCheap||solarSurplus||spare>=Math.max(boostKwh,c.maximumPowerW/1000*w.boostMinutes/60))) {
        requested=w.buffer;kind='boost';reason=waterCheap?'Warm water bij goedkope stroom':solarSurplus?'Warm water uit zonoverschot':'Warm water uit ruime accureserve';
    }
    if (requested!==null && (climateNumber(a.min_temp)===null||climateNumber(a.max_temp)===null||requested<climateNumber(a.min_temp)||requested>climateNumber(a.max_temp))) {requested=null;reason='Tapwaterdoel buiten apparaatgrenzen';}
    // The EHS is one heat source: do not issue a discretionary water boost
    // while either selected room needs comfort heating.
    if (kind==='boost' && candidates.some(r=>r.kind==='comfort'&&r.target!==null)) {requested=null;reason='Ruimtecomfort heeft voorrang op tapwaterbuffer';}
    candidates.push({key:'water',label:'Warm water',role:'water_heater.domestic_hot_water',entity:mapping['water_heater.domestic_hot_water']||null,current:temp,observedTarget:target,target:requested,reason,kind,normal:w.normal,estimatedBufferKwh:boostKwh,mode:e?.state,hygieneClear,feedbackFresh:climateFresh(e,now,20*60000)});
    const allowed=c.mode==='auto' && system.modules?.climate===true;
    const selected=candidates.filter(z=>z.target!==null && z.entity && Math.abs(z.target-z.observedTarget)>=0.2);
    // Only incremental worst-case demand is reserved, not all household energy.
    const reservationKwh=allowed && selected.some(z=>z.kind==='boost') ? c.maximumPowerW/1000*0.5 : 0;
    return {at:now,mode:c.mode,profile:c.profile,signals,zones:candidates,allowed,reservationKwh,
        timeline:ps.slice(0,144).map(p=>({start:new Date(p.start).toISOString(),end:new Date(p.end).toISOString(),price:p.price,
            comfortRooms:c.rooms.filter(z=>z.enabled&&z.schedule==='custom'&&climateSchedule(z,p.start)).map(z=>z.key)}))};
}

// Per-target command ledger: persisted before dispatch. Tado timers expire in
// the device; water restores require connectivity and explicit acceptance.
function climateDecide(plan, ledger, config, now) {
    const next=JSON.parse(JSON.stringify(ledger||{}));
    const actions=[];
    for (const z of plan.zones) {
        const s=next[z.key]||{}; next[z.key]=s;
        if (!z.entity || z.observedTarget===null || !z.feedbackFresh) continue;
        if (s.entity && s.entity!==z.entity) {z.reason='Koppeling gewijzigd: eerst oude opdracht controleren';continue;}
        if (s.fault) {z.reason='Opdracht niet bevestigd; controleer apparaat en geef zone opnieuw vrij';continue;}
        if (s.until && now>=s.until && z.key!=='water') {s.pending=null;s.owned=false;s.until=0;delete s.lastObserved;}
        if (s.pending) {
            if (Math.abs(z.observedTarget-s.pending.target)<0.2) {
                s.lastConfirmed=now;s.pending=null;s.owned=s.until>now;
            } else if (now-s.pending.at>=10*60000) {
                s.fault=true;s.pending=null;z.reason='Doel niet bevestigd binnen 10 minuten';continue;
            } else {z.reason='Opdracht verzonden; wacht op doelterugmelding';continue;}
        }
        if (s.owned && (Math.abs(z.observedTarget-s.target)>=0.2 || z.mode==='off')) {
            s.owned=false;s.until=0;s.manualUntil=now+config.manualMinutes*60000;s.pending=null;
        } else if (!s.owned && s.lastObserved!==undefined && Math.abs(z.observedTarget-s.lastObserved)>=0.2) {
            s.manualUntil=now+config.manualMinutes*60000;
        }
        s.lastObserved=z.observedTarget;
        if (s.manualUntil>now) {z.reason='Handmatige instelling heeft voorrang';continue;}
        if (z.key==='water' && s.owned && ['eco','heat_pump'].includes(z.mode) && (now>=s.until||!plan.allowed)) {
            if (!z.hygieneClear) {z.reason='Terugzetten wacht op aantoonbaar inactieve hygiënecyclus';continue;}
            // Restore only our exact target and never override a higher external
            // hygiene/manual cycle or changed device state.
            if (Math.abs(z.observedTarget-s.target)<0.2) {
                const target=s.baseline;
                actions.push({key:z.key,entity:z.entity,target,expectedBefore:z.observedTarget,type:'water',restore:true});
                s.pending={at:now,target};s.target=target;s.owned=false;s.until=0;s.cooldownUntil=now+60*60000;
            }
            continue;
        }
        if (!plan.allowed || z.target===null || s.until>now || s.cooldownUntil>now || (s.lastCommand && now-s.lastCommand<30*60000) || Math.abs(z.target-z.observedTarget)<0.2) continue;
        if (z.key!=='water' && z.mode!=='auto') {z.reason='Tado staat handmatig; eigen schema eerst hervatten';continue;}
        // A timer cannot safely return to a pre-existing indefinite manual
        // override. Rooms are commissioned in native schedule mode first.
        const action={key:z.key,entity:z.entity,target:z.target,type:z.key==='water'?'water':'room',restore:false};
        actions.push(action);s.entity=z.entity;s.baseline=z.observedTarget;s.target=z.target;s.lastCommand=now;
        s.until=now+(z.key==='water'?config.water.boostMinutes:30)*60000;
        s.pending={at:now,target:z.target};s.owned=true;
        break; // one shared heat-source change per evaluation
    }
    return {ledger:next,actions};
}

module.exports={climateDefaults,climateValidate,climateNumber,climateFresh,climateSchedule,climateCheapBlock,climatePlan,climateDecide};
