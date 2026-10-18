// HomeKit does not expose the native Tado schedule. Respect the configured night window locally.
function homekitRoomNightOff(config,now) {
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Amsterdam',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(now));
    const minutes=Number(parts.find(p=>p.type==='hour').value)*60+Number(parts.find(p=>p.type==='minute').value);
    const value=t=>Number(t.split(':')[0])*60+Number(t.split(':')[1]);
    const start=value(config.heatSource.nightOffStart||'22:30'),end=value(config.heatSource.nightOffEnd||'07:00');
    return start>end?minutes>=start||minutes<end:minutes>=start&&minutes<end;
}
// Direct room control: keep the physical goal while our own OFF hides it.
function homekitRoomHysteresis({config,system,states,ledger={},now}) {
    const h=config.heatSource,next=ledger.version===2?JSON.parse(JSON.stringify(ledger)):{version:2,rooms:{},source:{}};
    const identity=JSON.stringify([h.adapter,h.entity,h.heatTarget,h.leaseMinutes]);
    let s=next.source;
    if(s.identity!==identity) s=next.source={identity,entity:h.entity,lastSwitch:now};
    const e=states[h.entity],a=e?.attributes||{},role=h.roomRoles[0];
    const local=system.localClimateConnected===true&&system.climateRegistry?.[h.entity]?.platform==='homekit_controller';
    const feedback=climateRoomFeedback(e,now,600000,local);
    const valid=local&&feedback.valid&&['heat','off'].includes(e?.state)&&a.hvac_modes?.includes('heat')&&a.hvac_modes?.includes('off')&&
        h.roomRoles.length===1&&system.entities?.[role]===h.entity;
    const current=climateNumber(a.current_temperature),observedTarget=climateNumber(a.temperature);
    const stamp=new Date(e?.last_reported||e?.last_updated||e?.last_changed||0).getTime();
    const actions=[];
    if(s.pending) {
        const p=s.pending;
        if(valid&&s.serviceAcceptedAt===p.at&&stamp>=p.at&&e.state===(p.on?'heat':'off')&&(!p.on||observedTarget===p.target)) {
            s.pending=null;s.lastSwitch=p.at;s.autoOff=!p.on;s.owned=p.on;s.confirmedAt=now;
        } else if(now-p.at>=120000) {s.pending=null;s.fault=true;}
    }
    // A changed physical goal or native schedule wins over the saved goal.
    // An external OFF while HEAT is active cancels automatic restarting.
    if(valid&&!s.pending) {
        if(e.state==='heat') {
            if(observedTarget!==s.goal||s.autoOff) s.lastSwitch=now;
            s.goal=observedTarget;s.autoOff=false;s.manualOff=false;
        } else if(!s.autoOff) {s.goal=null;s.manualOff=true;s.owned=false;}
    }
    const nightOff=homekitRoomNightOff(config,now);
    const enabled=h.enabled&&config.tadoHysteresis&&config.mode==='auto'&&system.modules?.climate===true;
    const goal=climateNumber(s.goal),bounds=goal!==null&&goal>=Number(a.min_temp)&&goal<=Number(a.max_temp);
    let reason=nightOff?'Woonkamer nachtstand UIT tot '+h.nightOffEnd:!enabled?'Woonkamerhysterese uit':!valid?'HomeKit-woonkamer niet beschikbaar':s.fault?'HomeKit-opdracht niet bevestigd; controleer woonkamer':s.manualOff?'Woonkamer UIT zonder actief bewaard doel; stel het doel met de Tado-knop in':!bounds?'Wacht op temperatuurinstelling van de fysieke Tado-knop':e.state==='heat'?'Woonkamer verwarmt tot thermostaatdoel':'Wacht tot '+(config.hysteresisDegrees??0.5)+' °C onder bewaard thermostaatdoel';
    const queue=on=>{
        const command={entity:h.entity,adapter:h.adapter,on,target:goal,at:now,identity,observedMode:e.state,observedTarget,current};
        s.pending=command;actions.push(command);
    };
    if(enabled&&valid&&bounds&&!s.fault&&!s.pending&&!s.manualOff) {
        if(e.state==='heat'&&(current>=goal||nightOff&&s.owned)) {
            if(nightOff||now-s.lastSwitch>=h.minimumOnMinutes*60000) queue(false);
            else reason='Doel bereikt; minimale aan-tijd loopt nog';
        } else if(!nightOff&&e.state==='off'&&s.autoOff&&current<=goal-(config.hysteresisDegrees??0.5)) {
            if(now-s.lastSwitch>=h.minimumOffMinutes*60000) queue(true);
            else reason='Warmtevraag wacht op minimale rusttijd';
        }
    }
    const active=valid&&e.state==='heat'&&!s.manualOff;
    return {ledger:next,actions,status:[{role,entity:h.entity,label:a.friendly_name||'Woonkamer',current,target:goal,active,valid,mode:e?.state||null,reason}],
        sourceStatus:{entity:h.entity,adapter:h.adapter,requested:enabled&&!nightOff&&active,confirmed:active&&!s.pending,reportedHeating:a.hvac_action==='heating',pending:!!s.pending,fault:!!s.fault,reason,target:goal,autoOff:!!s.autoOff,until:0}};
}

function homekitRoomCommandAllowed({command,config,system,states,ledger,now}) {
    const h=config.heatSource,s=ledger?.source,e=states[command.entity],a=e?.attributes||{};
    if(!h.enabled||!config.tadoHysteresis||config.mode!=='auto'||system.modules?.climate!==true||s?.fault||
        h.adapter!=='homekit-room'||h.entity!==command.entity||h.roomRoles.length!==1||system.entities?.[h.roomRoles[0]]!==command.entity||
        !system.localClimateConnected||system.climateRegistry?.[command.entity]?.platform!=='homekit_controller'||
        JSON.stringify(s?.pending)!==JSON.stringify(command)||command.identity!==s.identity||now-command.at<0||now-command.at>60000||
        !climateRoomFeedback(e,now,600000,true).valid||e.state!==command.observedMode||climateNumber(a.temperature)!==command.observedTarget||
        climateNumber(a.current_temperature)!==command.current||command.target!==s.goal) return false;
    return command.on?!homekitRoomNightOff(config,now)&&s.autoOff===true&&e.state==='off'&&command.current<=command.target-(config.hysteresisDegrees??0.5)&&command.target>=Number(a.min_temp)&&command.target<=Number(a.max_temp):
        e.state==='heat'&&(command.current>=command.target||homekitRoomNightOff(config,now)&&s.owned===true);
}
module.exports={homekitRoomNightOff,homekitRoomHysteresis,homekitRoomCommandAllowed};
