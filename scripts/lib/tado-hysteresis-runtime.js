// Pure runtime embedded into Node-RED. Never infer a goal from an OFF overlay.
function tadoHysteresis({config,system,states,ledger={},now}) {
    const next=JSON.parse(JSON.stringify(ledger)), actions=[], status=[];
    const enabled=config.tadoHysteresis && config.mode==='auto' && system.modules?.climate===true;
    const seen=new Set();
    for(const role of ['climate.heating_zone_1','climate.heating_zone_2','climate.heating_zone_3']) {
        const entity=system.entities?.[role];
        if(!/^climate\.[a-z0-9_]+$/.test(entity||'') || seen.has(entity)) continue;
        seen.add(entity);
        const e=states[entity], a=e?.attributes||{}, current=climateNumber(a.current_temperature), target=climateNumber(a.temperature);
        let s=next[role];
        if(s?.entity!==entity) s=null;
        s=s||{entity,owned:false,active:false};
        next[role]=s;
        const report=new Date(e?.last_reported||e?.last_updated||e?.last_changed||0).getTime();
        const fresh=climateFresh(e,now,10*60000) && current!==null && a.temperature_unit!=='°F';
        const activeMode=['heat','auto'].includes(e?.state);
        const validTarget=target!==null && target>=5 && target<=30;
        const manualChange=activeMode && validTarget && (!s.owned || s.goal!==target || s.lastMode==='off' && s.pending?.mode!==e.state);
        if(fresh && manualChange) {
            // A physical knob or native schedule is authoritative, including a lower goal.
            s.goal=target;s.originalMode=e.state;s.active=current<=target-0.5;
            s.owned=true;s.pending=null;s.fault=false;s.lastSwitch=0;
        }
        if(s.pending && fresh && !manualChange) {
            const p=s.pending;
            if(report>=p.at && e.state===p.mode && (p.mode!=='heat'||target===p.target)) {
                s.pending=null;s.lastSwitch=p.at;
                if(p.release) s.owned=false;
            } else if(now-p.at>15*60000) {s.pending=null;s.fault=true;}
        }
        // A manual OFF while we allowed heating relinquishes control. Do not turn it back on.
        if(fresh && e.state==='off' && ['heat','auto'].includes(s.lastMode) && s.active && !s.pending && !s.fault) {
            s.owned=false;s.active=false;
        }
        let reason=!fresh?'Tado-meetdata ontbreekt of is te oud':s.fault?'Geen bevestiging; wijzig Tado-knop om opnieuw vrij te geven':!s.owned?'Handmatige uitstand respecteren':'Hysterese 0,5 °C';
        if(fresh && s.owned && !s.pending && !s.fault && a.preset_mode!=='away') {
            let mode=null,release=false;
            if(!enabled) {
                if(e.state==='off') {mode=s.originalMode==='auto'?'auto':'heat';release=true;}
                else {s.owned=false;}
                reason='Eigen Tado-regeling';
            } else {
                if(current>=s.goal) s.active=false;
                else if(current<=s.goal-0.5) s.active=true;
                const wanted=s.active?'heat':'off';
                if((wanted==='off'&&activeMode)||(wanted==='heat'&&e.state==='off')) mode=wanted;
                reason=s.active?'Verwarmen tot Tado-doel':'Wacht tot 0,5 °C onder Tado-doel';
            }
            const canHeat=Array.isArray(a.hvac_modes)&&a.hvac_modes.includes('heat') &&
                climateNumber(a.min_temp)!==null && climateNumber(a.max_temp)!==null && s.goal>=Number(a.min_temp)&&s.goal<=Number(a.max_temp);
            if(mode && (mode!=='heat'||canHeat) && a.hvac_modes?.includes(mode) && (release || !s.lastSwitch || now-s.lastSwitch>=300000)) {
                const command={role,entity,mode,target:s.goal,at:now,release,observedMode:e.state,observedTarget:target,current};
                s.pending=command;actions.push(command);
            }
        }
        status.push({role,entity,label:a.friendly_name||'Tado-zone '+role.slice(-1),current,target:s.goal??null,active:s.active,reason,pending:!!s.pending,fault:!!s.fault});
        if(fresh) s.lastMode=e.state;
    }
    return {ledger:next,actions,status};
}
module.exports={tadoHysteresis};
