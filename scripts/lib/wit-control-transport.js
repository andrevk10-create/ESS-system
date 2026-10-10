// WIT VPP addresses: integration's WIT guide and v1.9.8 diagnostic/select code.
// No SOC, BMS, base mode, TOU schedule or installation limit is written here.
const {witBatteryLimit} = require('./wit-runtime');
function witApplyReadback(states, config, snapshot, enabled, now) {
    if (!enabled || !states) return;
    const remoteRole = 'select.growatt_grid_remote_power_control_enable';
    const authorityRole = 'select.growatt_grid_control_authority';
    const mapping = config?.entities;
    const mapped = role => mapping ? mapping[role] : role;
    const valid = snapshot && snapshot.remoteEntity === mapped(remoteRole) && snapshot.authorityEntity === mapped(authorityRole) &&
        now - snapshot.at >= 0 && now - snapshot.at <= 120000;
    const readings = {
        [authorityRole]:valid ? (snapshot.authority ? 'Enabled' : 'Disabled') : 'unavailable',
        [remoteRole]:valid ? (snapshot.remote ? 'Enabled' : 'Disabled') : 'unavailable',
        'number.growatt_grid_remote_power_control_charging_time':valid ? snapshot.duration : 'unavailable',
        'number.growatt_battery_remote_charge_and_discharge_power':valid ? snapshot.percent : 'unavailable'
    };
    for (const [role, value] of Object.entries(readings)) {
        if (!mapped(role) || !states[role]) continue;
        states[role] = {...states[role], state:String(value), last_reported:new Date(valid ? snapshot.at : now).toISOString()};
    }
}

function witReadbackResult(authority, remote, binding, now) {
    if (authority?.success !== true || remote?.success !== true || authority.values?.length !== 1 || remote.values?.length !== 5) return null;
    const [a] = authority.values;
    const [enable, duration, raw, ac, periods] = remote.values;
    const percent = raw > 32767 ? raw - 65536 : raw;
    if (![0,1].includes(a) || ![0,1].includes(enable) || ![0,1].includes(ac) ||
        !Number.isInteger(duration) || duration < 0 || duration > 1440 ||
        !Number.isInteger(raw) || raw < 0 || raw > 65535 || Math.abs(percent) > 100 ||
        !Number.isInteger(periods) || periods < 0 || periods > 20) return null;
    return {...binding, authority:a, remote:enable, duration, percent, ac, periods, at:now};
}

function witGridTransport(flow, global, msg, reply, now) {
    const key = 'ess_wit_grid_transport';
    const fail = reason => {
        flow.set(key, null);
        flow.set('ess_wit_command_fault', {at:now,attempts:2,reason});
        return [null,{payload:now}];
    };
    const config = flow.get('ess_system_config') || {};
    const snapshot = flow.get('ess_wit_control_readback');
    const mapping = config.entities;
    const mapped = role => mapping ? mapping[role] : role;
    let op = flow.get(key);
    if (reply && msg.witReadbackTick) {
        if (!op || !['power','authorityRead','remoteRead','awaitReadback'].includes(op.stage) || !op.powerSentAt ||
            flow.get('ess_wit_command_fault') || flow.get('ess_wit_grid_charge_status')?.releasing ||
            !flow.get('ess_wit_grid_charge_status')?.sessionOwned) return null;
        if (!snapshot || snapshot.at < op.powerSentAt || snapshot.remoteEntity !== op.binding.remoteEntity || snapshot.authorityEntity !== op.binding.authorityEntity) return null;
        if (now-snapshot.at<0 || now-snapshot.at>120000 || snapshot.deviceId!==op.binding.deviceId) return null;
        if (op.stage!=='awaitReadback' && (snapshot.authority!==1 || snapshot.remote!==1 || snapshot.ac!==1 || snapshot.duration!==2 ||
            snapshot.periods!==0 || snapshot.percent!==op.powerPercent)) return null;
        msg = {witOperationId:op.id,witReply:{success:true,values:[snapshot.remote,snapshot.duration,(snapshot.percent+65536)%65536,snapshot.ac,snapshot.periods]}};
        op.stage = 'remoteRead';
        op.authorityResult = {success:true,values:[snapshot.authority]};
    }
    if (reply) {
        if (!op || op.id !== msg.witOperationId) return null;
        if (msg.error) return fail('WIT-opdracht mislukt: '+String(msg.error.message || 'Modbus'));
        if (op.stage === 'authorityRead') op.authorityResult = msg.witReply?.response || msg.witReply;
        if (op.stage === 'remoteRead') {
            const readback = witReadbackResult(op.authorityResult, msg.witReply?.response || msg.witReply, op.binding, now);
            if (!readback) return fail('WIT-registerterugmelding ontbreekt of is ongeldig');
            flow.set('ess_wit_control_readback', readback);
            if (readback.authority !== 1 || readback.remote !== 1 || readback.ac !== 1 || readback.duration !== 2 || readback.percent !== op.powerPercent) {
                if (now - op.powerSentAt < 90000 && !flow.get('ess_wit_command_fault') && flow.get('ess_wit_grid_charge_status')?.sessionOwned && flow.get('ess_wit_grid_charge_mode') !== 'off') {
                    op.stage = 'awaitReadback';
                    flow.set(key,op);
                    return null;
                }
                return fail('WIT neemt de laadopdracht niet over · registerterugmelding wijkt af');
            }
            flow.set(key, null);
            const watch = flow.get('ess_wit_charge_watch');
            if (op.kind === 'start' && watch && watch.attempts === op.attempt) flow.set('ess_wit_charge_watch', {...watch,waitingSince:now});
            flow.set('ess_wit_grid_write_ack', {at:now,sentAt:op.powerSentAt,powerPercent:op.powerPercent,...op.binding});
            return [null,{payload:now}];
        }
        op.next += 1;
    } else {
        if (op) return null; // One request on the bus; timers cannot build a queue.
        if (flow.get('ess_wit_command_fault')) return null;
        if (msg.payload?.option !== 'Charge' && msg.payload?.option !== 'Enabled' && msg.payload?.value === undefined) return null;
        const kind = msg.payload?.option === 'Charge' ? 'start' : msg.payload?.value !== undefined ? 'update' : 'renew';
        const status = flow.get('ess_wit_grid_charge_status') || {};
        const percent = kind === 'update' ? Number(msg.payload.value) : kind === 'start' ? Number(msg.payload.powerPercent) : Number(status.powerPercent);
        if (!status.sessionOwned || !Number.isInteger(percent) || percent < 3 || percent > 100 ||
            !snapshot || now - snapshot.at < 0 || now - snapshot.at > 120000 ||
            snapshot.remoteEntity !== mapped('select.growatt_grid_remote_power_control_enable') ||
            snapshot.authorityEntity !== mapped('select.growatt_grid_control_authority')) return fail('Verse WIT-registerterugmelding of koppeling ontbreekt');
        if (snapshot.periods !== 0) return fail('Externe WIT-tijdplanning actief · netladen geblokkeerd');
        const ack = flow.get('ess_wit_grid_write_ack');
        if (kind === 'renew' && ack && now - ack.sentAt < 45000) return null;
        // A verified start immediately wakes the planner. Fresh measurements
        // can then suggest more power before the inverter accepts another
        // setpoint. Hold upward adjustments during this settling interval;
        // downward safety reductions must still be sent immediately.
        if (kind === 'update' && ack && now - ack.sentAt < 45000 && percent >= ack.powerPercent) return null;
        const steps = [];
        if (!snapshot.authority) steps.push('authority');
        if (!snapshot.ac) steps.push('ac');
        steps.push('power','authorityRead','remoteRead');
        op = {id:now,kind,powerPercent:percent,attempt:flow.get('ess_wit_charge_watch')?.attempts,
            startedAt:now,next:0,steps,binding:{deviceId:snapshot.deviceId,remoteEntity:snapshot.remoteEntity,authorityEntity:snapshot.authorityEntity}};
    }
    const status = flow.get('ess_wit_grid_charge_status') || {};
    if (op.binding.remoteEntity !== mapped('select.growatt_grid_remote_power_control_enable') ||
        op.binding.authorityEntity !== mapped('select.growatt_grid_control_authority')) return fail('WIT-koppeling gewijzigd tijdens opdracht');
    if (flow.get('ess_wit_command_fault') || !status.sessionOwned || flow.get('ess_wit_grid_charge_mode') === 'off') {
        flow.set(key,null);
        return [null,{payload:now}];
    }
    const stage = op.steps[op.next];
    if (!stage) return fail('Ongeldige WIT-schrijfstap');
    let data;
    if (stage === 'authority') {
        data = {domain:'select',service:'select_option',service_data:{entity_id:op.binding.authorityEntity,option:'Enabled'}};
    } else if (stage === 'ac') {
        data = {domain:'growatt_modbus',service:'write_registers',service_data:{device_id:op.binding.deviceId,register:30410,values:[1]}};
    } else if (stage === 'power') {
        const raw = global.get('homeassistant')?.homeAssistant?.states;
        const role = id => raw?.[mapped(id)];
        const freshNumber = (id,maxAge=15000) => {
            const item=role(id),stamp=new Date(item?.last_reported || item?.last_updated || item?.last_changed || 0).getTime();
            if (!item || ['unknown','unavailable',''].includes(String(item.state)) || now-stamp<0 || now-stamp>maxAge) return null;
            const n=Number(item.state);return Number.isFinite(n)?n:null;
        };
        const phaseRoles=[1,2,3].map(n=>'sensor.p1_meter_vermogen_fase_'+n);
        const phase=phaseRoles.map(id=>{const n=freshNumber(id);return n===null?null:n*(String(role(id)?.attributes?.unit_of_measurement).toLowerCase()==='kw'?1000:1);});
        const socItem=role('sensor.growatt_battery_battery_soc');
        const soc=Number(socItem?.state),target=Number(flow.get('ess_wit_grid_charge_target_soc'))||80;
        const telemetryFresh = ['sensor.growatt_battery_battery_power','sensor.growatt_solar_solar_total_power'].some(id => {
            const item=role(id), stamp=new Date(item?.last_reported || item?.last_updated || item?.last_changed || 0).getTime();
            return item && !['unknown','unavailable',''].includes(String(item.state)) && now-stamp>=0 && now-stamp<=120000;
        });
        if (phase.some(n=>n===null) || !telemetryFresh || !socItem || !Number.isFinite(soc) || soc<0 || soc>=target-0.2) {
            flow.set(key,null);return [null,{payload:now}];
        }
        const spec=config.specs||{},rated=(Number(spec.inverterRatedPowerKw)||18)*1000;
        const limit=(Math.max(0,(Number(spec.mainFuseA)||25)-3))*(Number(spec.voltage)||230);
        // Credit only measured charging that was already on the grid. A queued
        // command is never connection headroom. Direct PV alone is not credited.
        // Growatt polling is slower than P1. Use the same two-minute telemetry
        // window as the planner, while keeping the P1 safety check at 15 s.
        // Power and PV must belong to a coherent poll; subtracting unrelated
        // samples could turn direct solar charging into fictitious grid credit.
        const growattPower = id => {
            const n=freshNumber(id,120000),unit=String(role(id)?.attributes?.unit_of_measurement||'').toLowerCase();
            return n===null?null:unit==='kw'?n*1000:unit==='w'?n:null;
        };
        const powerRole='sensor.growatt_battery_battery_power',pvRole='sensor.growatt_solar_solar_total_power';
        const power=growattPower(powerRole),pv=growattPower(pvRole);
        const stamp=id=>new Date(role(id)?.last_reported||role(id)?.last_updated||role(id)?.last_changed||0).getTime();
        const coherent=Math.abs(stamp(powerRole)-stamp(pvRole))<=15000;
        const scale=Number(flow.get('ess_growatt_battery_power_scale'))===0.1?0.1:1;
        const credited=snapshot?.remote && snapshot.percent>0 && coherent && power!==null && pv!==null ? Math.min(Math.max(0,power*scale-Math.max(0,pv)),snapshot.percent/100*rated) : 0;
        const headroom=3*Math.min(...phase.map(w=>limit-w+credited/3));
        const bmsLimit=witBatteryLimit(Object.fromEntries(Object.entries(mapping||{}).map(([id,actual])=>[id,raw?.[actual]])),config,'charge',(Number(spec.maximumBatteryChargePowerKw)||12)*1000,now);
        op.powerPercent=Math.min(op.powerPercent,Math.floor(Math.max(0,Math.min(headroom,bmsLimit))/rated*100));
        flow.set('ess_wit_grid_applied_limit',{at:now,powerPercent:op.powerPercent,headroomW:headroom,batteryLimitW:bmsLimit,creditedNetChargeW:credited,phasePowerW:phase});
        if (op.powerPercent<3) {flow.set(key,null);return [null,{payload:now}];}
        // FC16 commits enable, two-minute lease and positive setpoint together.
        // This avoids activating an old negative setpoint between writes.
        data={domain:'growatt_modbus',service:'write_registers',service_data:{device_id:op.binding.deviceId,register:30407,values:[1,2,op.powerPercent]}};
        op.powerSentAt=now;
    } else {
        data={domain:'growatt_modbus',service:'get_register_data',service_data:{device_id:op.binding.deviceId,register_type:'holding',start_address:stage==='authorityRead'?30100:30407,count:stage==='authorityRead'?1:5},return_response:true};
    }
    op.stage=stage;
    flow.set(key,op);
    return [{witOperationId:op.id,payload:{data:{type:'call_service',...data}}},null];
}

module.exports={witApplyReadback,witReadbackResult,witGridTransport};
