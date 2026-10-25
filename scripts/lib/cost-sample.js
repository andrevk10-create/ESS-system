function costSample(states,config,dashboard,pvRoles,pvFresh,night,snapshot,now){
    const stamp=e=>Date.parse(e?.last_reported||e?.last_updated||e?.last_changed);
    const read=(role,age=120000)=>{const e=states[role];return e&&now-stamp(e)>=0&&now-stamp(e)<=age&&!['unknown','unavailable',''].includes(e.state)?e:null;};
    const power=role=>{const e=read(role),unit=String(e?.attributes?.unit_of_measurement||'').toLowerCase();return e&&Number.isFinite(Number(e.state))&&['w','kw'].includes(unit)?Number(e.state)*(unit==='kw'?1000:1):null;};
    const car=(name,suffix)=>{
        const role='sensor.ev_charger'+suffix+'_status';
        const current=states[role],state=String(current?.state||'').toLowerCase();
        const online='binary_sensor.ev_charger'+suffix+'_online';
        const roles=[role,'sensor.ev_charger'+suffix+'_power','sensor.ev_charger'+suffix+'_current',online];
        const id=JSON.stringify(roles.map(r=>Object.hasOwn(config.entities||{},r)?config.entities[r]:r));
        const observed=roles.every(r=>{const a=snapshot?.entities?.[config.entities?.[r]||r],e=states[r];return a&&e&&a.state===e.state&&stamp(a)===stamp(e);});
        const idle=['disconnected','no_car_connected','awaiting_start','awaiting_authorization','ready_to_charge','completed','paused','stopped','idle','standby','finished'].includes(state);
        const p=states[roles[1]],amps=states[roles[2]];
        const idleConfirmed=now-snapshot?.at>=0&&now-snapshot.at<=90000&&observed&&idle&&states[online]?.state==='on'&&Number(p?.state)===0&&Number.isFinite(Number(amps?.state))&&Number(amps.state)>=0&&Number(amps.state)<=1;
        const valid=read(role)||idleConfirmed;
        const connected=!valid?null:['disconnected','no_car_connected'].includes(state)?false:['charging','awaiting_start','awaiting_authorization','ready_to_charge','completed','paused','stopped','idle','standby','finished'].includes(state)?true:null;
        let measured=idleConfirmed?0:power(roles[1]);
        const currentReading=read(roles[2]),currentA=currentReading?.attributes?.unit_of_measurement==='A'?Number(currentReading.state):null;
        if(measured!==null&&(measured<0||state==='charging'&&measured<=100||idle&&measured>100||idle&&currentA>1))measured=null;
        return {binding:id,connected,power:measured,directPowerKw:Number(config.specs?.[name==='audi'?'evGridChargePowerKw':'ev2GridChargePowerKw'])||11};
    };
    const batteryRole='sensor.growatt_battery_battery_power',outputRole='sensor.growatt_solar_system_output_power';
    const configuredPv=pvRoles.filter(r=>states[r]||config.entities?.[r]&&config.entities[r]!==r);
    const allPvKnown=night||configuredPv.every(r=>{const e=read(r,900000);return e&&['w','kw'].includes(String(e.attributes?.unit_of_measurement||'').toLowerCase())&&Number.isFinite(Number(e.state));});
    const houseOk=read('sensor.p1_meter_vermogen',15000)&&read(outputRole)&&allPvKnown;
    return {binding:JSON.stringify([config.entities?.['sensor.p1_meter_vermogen'],config.entities?.[batteryRole],config.entities?.[outputRole],...pvRoles.map(r=>config.entities?.[r]||r)]),
        house:houseOk?dashboard.house.power:null,grid:read('sensor.p1_meter_vermogen',15000)?dashboard.grid.power:null,
        battery:read(batteryRole)?dashboard.battery.power:null,audi:car('audi',''),jeep:car('jeep','_2')};
}
module.exports={costSample};
