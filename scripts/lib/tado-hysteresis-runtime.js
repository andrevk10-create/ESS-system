// Separate-source adapters read room goals only; homekit-room controls its room.
const {homekitRoomHysteresis,homekitRoomCommandAllowed}=require('./homekit-room-hysteresis');
function tadoHysteresis({config,system,states,ledger={},now}) {
    if(config.heatSource.adapter==='homekit-room') return homekitRoomHysteresis({config,system,states,ledger,now});
    const h=config.heatSource;
    const next=ledger.version===2?JSON.parse(JSON.stringify(ledger)):{version:2,rooms:{},source:{}};
    const actions=[],status=[],seen=new Set();
    let complete=true;
    for(const role of h.roomRoles) {
        const entity=system.entities?.[role],e=states[entity],a=e?.attributes||{};
        const current=climateNumber(a.current_temperature),target=climateNumber(a.temperature);
        const mapped=/^climate\.[a-z0-9_]+$/.test(entity||'')&&entity!==h.entity&&!seen.has(entity);
        if(mapped) seen.add(entity);
        const feedback=climateRoomFeedback(e,now,600000,system.localClimateConnected===true&&system.climateRegistry?.[entity]?.platform==='homekit_controller');
        const localRoom=system.climateRegistry?.[entity]?.platform==='homekit_controller';
        const valid=mapped&&feedback.valid&&(!localRoom||system.localClimateConnected===true);
        const previous=next.rooms[role],room=previous?.entity===entity?previous:{entity,active:false};
        if(valid) {
            if(e.state==='off'||a.preset_mode==='away') room.active=false;
            else if(target!==room.target) room.active=current<=target-(config.hysteresisDegrees??0.5);
            else if(current<=target-(config.hysteresisDegrees??0.5)) room.active=true;
            else if(current>=target) room.active=false;
            room.target=e.state==='off'?null:target;
        }
        next.rooms[role]=room;
        complete=complete&&valid;
        status.push({role,entity:entity||null,label:a.friendly_name||'Tado-zone '+role.slice(-1),current,target:e?.state==='off'?null:target,
            active:valid&&room.active,valid,mode:e?.state||null,preset:a.preset_mode||null,
            reason:!mapped?'Kamerkoppeling ontbreekt, is dubbel of is de regelzone':localRoom&&!system.localClimateConnected?'Lokale HA-verbinding niet bevestigd':!valid?feedback.reason:e.state==='off'?'Handmatig uit':a.preset_mode==='away'?'Afwezig':room.active?'Warmtevraag tot thermostaatdoel':'Wacht tot '+(config.hysteresisDegrees??0.5)+' °C onder thermostaatdoel'});
    }
    const e=states[h.entity],a=e?.attributes||{},local=h.adapter==='switch';
    const controlTemp=climateNumber(a.current_temperature),target=climateNumber(a.temperature);
    const fresh=climateFresh(e,now,local?12*60000:10*60000)&& (local?['on','off']:['heat','auto','off']).includes(e?.state);
    const observedOn=local?e?.state==='on':e?.state==='heat';
    const observedOff=e?.state==='off'||!local&&e?.state==='auto'&&a.hvac_action==='off';
    const supported=local?fresh:fresh&&Array.isArray(a.hvac_modes)&&a.hvac_modes.includes('heat')&&a.hvac_modes.includes('off')&&
        climateNumber(a.min_temp)!==null&&climateNumber(a.max_temp)!==null&&Number(a.max_temp)<=30&&
        h.heatTarget>=Number(a.min_temp)&&h.heatTarget<=Number(a.max_temp)&&controlTemp!==null&&a.temperature_unit!=='°F';
    const separated=h.entity&&!h.roomRoles.some(r=>system.entities?.[r]===h.entity);
    const timerSupported=local||system.climateRegistry?.[h.entity]?.platform==='tado';
    const commissioned=h.enabled&&h.roomsDetached&&h.relayTested&&separated&&timerSupported&&(local?h.watchdogConfirmed:h.offScheduleConfirmed);
    const enabled=commissioned&&config.tadoHysteresis&&config.mode==='auto'&&system.modules?.climate===true;
    const requested=enabled&&complete&&status.some(r=>r.active);
    let s=next.source;
    const identity=JSON.stringify([h.adapter,h.entity,h.heatTarget,h.leaseMinutes]);
    if(s.identity&&s.identity!==identity&&(s.owned||s.pending)) {
        return {ledger:next,actions,status,sourceStatus:{requested:false,confirmed:false,fault:true,reason:'Oude verwarmingsbediening eerst stoppen vóór koppeling wijzigen'}};
    }
    if(s.identity!==identity) s=next.source={identity,entity:h.entity,owned:false,lastSwitch:now};
    const stamp=new Date(e?.last_reported||e?.last_updated||e?.last_changed||0).getTime();
    if(s.pending) {
        const p=s.pending,ack=s.serviceAcceptedAt===p.at&&fresh&&(p.renew||stamp>=p.at)&&(p.on?observedOn&&(local||target===p.target):observedOff);
        if(ack) {
            s.pending=null;s.lastSwitch=p.renew?s.lastSwitch:p.at;
            s.owned=p.on;s.until=p.on?p.at+h.leaseMinutes*60000:0;s.confirmedAt=now;
        } else if(now-p.at>=(local?120000:12*60000)) {s.pending=null;s.fault=true;if(!p.on)s.stopFailed=true;}
    }
    // Never overwrite manual changes. A verified device timer reaching its OFF
    // baseline is a lease expiry; an early OFF blocks automatic restarts.
    if(s.owned&&!s.pending&&fresh) {
        if(observedOff) {
            if(now<Number(s.until||0)-60000) s.fault=true;
            s.owned=false;s.until=0;s.lastSwitch=now;
        } else if(!local&&(observedOn&&target!==h.heatTarget||e.state==='auto'&&!observedOff)) {s.fault=true;s.owned=false;s.until=0;}
    }
    const headroom=local||supported&&h.heatTarget-controlTemp>=2;
    const stopping=!requested||!supported||!headroom||s.fault;
    let reason=!h.enabled?'Aparte verwarmingsbediening nog niet vrijgegeven':!separated?'Kies aparte bediening, geen kamer':!timerSupported?'Tado-timer vereist een gecontroleerde Tado-cloudregelzone':!commissioned?'Controleer zonekoppeling en terugval bij uitval':!enabled?'Automatische warmtevraag uit':!complete?'Warmtevraag gestopt: kamergegevens ontbreken':!fresh?'Verwarmingsbediening niet beschikbaar':!supported?'Regelzone ondersteunt deze bediening niet':!headroom?'Regelsensor te warm voor betrouwbare warmtevraag':s.fault?'Niet bevestigd of handmatig gewijzigd; controleer bediening':requested?'Gezamenlijke warmtevraag':'Alle kamers op doel of handmatig uit';
    const queue=(on,renew=false)=>{
        const command={entity:h.entity,adapter:h.adapter,on,target:h.heatTarget,at:now,renew,leaseMinutes:h.leaseMinutes,identity,
            observedMode:e.state,observedTarget:target,rooms:status.map(r=>({role:r.role,entity:r.entity,current:r.current,target:r.target,mode:r.mode,preset:r.preset,valid:r.valid,active:r.active}))};
        s.pending=command;actions.push(command);
    };
    if(!s.pending&&fresh&&separated&&h.entity) {
        if(s.owned&&observedOn&&stopping&&!s.stopFailed) {
            const urgent=!enabled||!complete||!supported||!headroom||s.fault;
            if(urgent||now-s.lastSwitch>=h.minimumOnMinutes*60000) queue(false);
            else reason='Doel bereikt; minimale draaitijd loopt nog';
        } else if(!stopping&&!s.fault) {
            if(observedOn&&!s.owned) reason='Bediening staat buiten ESS aan; eerst handmatig uitzetten';
            else if(observedOff&&now-s.lastSwitch>=h.minimumOffMinutes*60000) queue(true);
            else if(s.owned&&observedOn&&now>=Number(s.until||0)-h.leaseMinutes*30000) queue(true,true);
            else if(observedOff) reason='Warmtevraag wacht op minimale rusttijd';
        }
    }
    return {ledger:next,actions,status,sourceStatus:{entity:h.entity||null,adapter:h.adapter,requested,confirmed:fresh&&observedOn&&s.owned&&!s.pending,
        reportedHeating:!local&&a.hvac_action==='heating',pending:!!s.pending,fault:!!s.fault,reason,until:s.until||0}};
}

function tadoCommandAllowed({command,config,system,states,ledger,now}) {
    if(config.heatSource.adapter==='homekit-room') return homekitRoomCommandAllowed({command,config,system,states,ledger,now});
    const h=config.heatSource,s=ledger?.source,local=h.adapter==='switch';
    if(!s||JSON.stringify(s.pending)!==JSON.stringify(command)||command.entity!==h.entity||command.adapter!==h.adapter||
        command.identity!==JSON.stringify([h.adapter,h.entity,h.heatTarget,h.leaseMinutes])||now-command.at<0||now-command.at>60000||
        h.roomRoles.some(r=>system.entities?.[r]===command.entity)) return false;
    const e=states[command.entity],a=e?.attributes||{};
    if(!climateFresh(e,now,local?12*60000:600000)||e.state!==command.observedMode||climateNumber(a.temperature)!==command.observedTarget) return false;
    if(!command.on) return s.owned===true&&(local||a.hvac_modes?.includes('off'));
    if(!h.enabled||!h.roomsDetached||!h.relayTested||!(local?h.watchdogConfirmed:h.offScheduleConfirmed)||!config.tadoHysteresis||config.mode!=='auto'||system.modules?.climate!==true||s.fault||!local&&system.climateRegistry?.[h.entity]?.platform!=='tado') return false;
    if(!local&&(!a.hvac_modes?.includes('heat')||climateNumber(a.min_temp)===null||climateNumber(a.max_temp)===null||Number(a.max_temp)>30||
        h.heatTarget<Number(a.min_temp)||h.heatTarget>Number(a.max_temp)||climateNumber(a.current_temperature)===null||h.heatTarget-Number(a.current_temperature)<2||a.temperature_unit==='°F')) return false;
    const check=tadoHysteresis({config,system,states,ledger,now});
    if(!check.sourceStatus.requested||check.ledger.source.fault) return false;
    const rooms=check.status.map(r=>({role:r.role,entity:r.entity,current:r.current,target:r.target,mode:r.mode,preset:r.preset,valid:r.valid,active:r.active}));
    return JSON.stringify(command.rooms)===JSON.stringify(rooms)&&command.leaseMinutes===h.leaseMinutes&&command.target===h.heatTarget;
}
module.exports={tadoHysteresis,tadoCommandAllowed};
