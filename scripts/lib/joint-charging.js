function jointDeparture(flow,car,now){
 const settings=flow.get('ess_'+car+'_settings')||{},status=flow.get('ess_'+car+'_control_status')||{};
 const time=String(settings.departureTime||status.departureTime||'');
 const match=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
 if(match){const date=new Date(now);date.setHours(Number(match[1]),Number(match[2]),0,0);if(date.getTime()<=now)date.setDate(date.getDate()+1);return date.getTime();}
 const at=Date.parse(status.departureAt||'');return Number.isFinite(at)&&at>now?at:Infinity;
}
function jointFresh(at,now){const t=typeof at==='number'?at:Date.parse(at||'');return now>=t&&now-t<=150000;}
function jointMeasured(flow,states,car,now){
 const suffix=car==='audi'?'':'_2',p=states?.['sensor.ev_charger'+suffix+'_power'];
 const unit=String(p?.attributes?.unit_of_measurement||'').toLowerCase();
 return jointFresh(p?.last_reported||p?.last_updated,now)&&['w','kw'].includes(unit)?Math.max(0,Number(p.state)||0)*(unit==='kw'?1:.001):0;
}
function jointCarDemand(flow,states,car,now,start,end,planning=false){
 const suffix=car==='audi'?'':'_2',status=states?.['sensor.ev_charger'+suffix+'_status']?.state;
 const p=flow.get('ess_'+car+'_control_status')||{},r=flow.get('ess_'+car+'_priority_request')||{},spec=flow.get('ess_system_config')?.specs||{};
 const phases=p.phaseCount===1?1:3,voltage=Number(spec.voltage)||230,step=voltage*phases/1000;
 const measured=jointMeasured(flow,states,car,now);
 const connected=['awaiting_start','awaiting_authorization','ready_to_charge','charging','completed'].includes(status);
 const enabled=flow.get('ess_'+car+'_smart_enabled')===true;
 if(!connected&&!measured)return {kw:0,step,min:6*step,phases};
 if(!enabled)return {kw:measured,step,min:measured,phases,fixed:true};
 const maximum=Math.min(Number(spec[car==='audi'?'evGridChargePowerKw':'ev2GridChargePowerKw'])||11,(Number(spec[car==='audi'?'evMaximumCurrentA':'ev2MaximumCurrentA'])||16)*step);
 let needed=false;
 if(planning){needed=p.energyNeeded>0||p.forceFull||p.targetCurrent>=6;}
 else if(start!==undefined){
  needed=(p.selectedSlots||[]).some(s=>(typeof s.start==='number'?s.start:Date.parse(s.start))<end&&(typeof s.end==='number'?s.end:Date.parse(s.end))>start);
  if(jointFresh(p.updatedAt,now)&&(p.forceFull||['deadline','climate-support','ultra-cheap'].includes(p.controlMode))){const until=now+Math.max(900000,(Number(p.energyNeeded)||0)/Math.max(.1,p.plannedChargePowerKw||maximum)*3600000);needed=needed||start<until;}
 }else needed=jointFresh(r.at,now)&&r.requested||jointFresh(p.updatedAt,now)&&p.targetCurrent>=6;
 return {kw:needed?maximum:0,step,min:6*step,phases,deadline:jointDeparture(flow,car,now)};
}
function jointAllocate(a,b,wit){
 const result={audi:0,jeep:0,wit:0};let remaining=16;
 const list=[['audi',a],['jeep',b]].sort((x,y)=>(x[1].deadline??Infinity)-(y[1].deadline??Infinity)||0);
 for(const [id,d]of list)if(d.fixed){result[id]=d.kw;remaining-=d.kw;}
 for(const [id,d]of list)if(!d.fixed&&d.kw>=d.min&&remaining>=d.min){result[id]=d.min;remaining-=d.min;}
 // At most two charging consumers: two requesting cars use the shared window.
 if(a.kw>=a.min&&a.kw>0&&b.kw>=b.min&&b.kw>0)wit=0;
 // One car can share with the full-power WIT.
 result.wit=Math.max(0,Math.min(8,wit,remaining));remaining-=result.wit;
 // Earliest departure gets spare amperes first; equal/unknown deadlines share fairly.
 for(let i=0;i<100;i++){
  const next=list.filter(([id,d])=>!d.fixed&&result[id]>0&&result[id]+d.step<=d.kw+1e-8&&d.step<=remaining+1e-8).sort((x,y)=>(x[1].deadline??Infinity)-(y[1].deadline??Infinity)||result[x[0]]-result[y[0]])[0];
  if(!next)break;result[next[0]]+=next[1].step;remaining-=next[1].step;
 }
 return result;
}
function jointWitDemand(flow,now){
 const s=flow.get('ess_wit_grid_charge_status')||{},mode=flow.get('ess_wit_grid_charge_mode')||'auto';
 if(mode==='off')return 0;
 const active=jointFresh(s.updatedAt,now)&&(s.sessionOwned&&!s.releasing||(s.selectedSlots||[]).some(x=>(typeof x.start==='number'?x.start:Date.parse(x.start))<=now&&(typeof x.end==='number'?x.end:Date.parse(x.end))>now));
 return active?Math.min(8,Number(flow.get('ess_system_config')?.specs?.maximumBatteryChargePowerKw)||8):0;
}
function jointCarKw(flow,states,car,now){
 const p=flow.get('ess_'+car+'_control_status')||{},phases=p.phaseCount===1?1:3,voltage=Number(flow.get('ess_system_config')?.specs?.voltage)||230;
 const state=states?.[car==='audi'?'sensor.ev_charger_status':'sensor.ev_charger_2_status']?.state;
 if(['disconnected','not_connected','unplugged','idle'].includes(state))return jointMeasured(flow,states,car,now);
 return Math.max(jointMeasured(flow,states,car,now),jointFresh(p.updatedAt,now)?Math.max(0,Number(p.targetCurrent)||0)*voltage*phases/1000:0);
}
function jointWitKw(flow,states,now,maximum,start,end){
 if(flow.get('ess_joint_charging_16kw')!==true)return maximum;
 const a=jointCarDemand(flow,states,'audi',now,start,end),b=jointCarDemand(flow,states,'jeep',now,start,end);
 const step=(Number(flow.get('ess_system_config')?.specs?.inverterRatedPowerKw)||18)/100;
 const kw=Math.floor((jointAllocate(a,b,maximum).wit+1e-8)/step)*step;
 // Before a real increase, wait for peer reductions to be reflected in telemetry.
 return start!==undefined?kw:Math.max(0,Math.min(kw,16-jointCarKw(flow,states,'audi',now)-jointCarKw(flow,states,'jeep',now)));
}
function jointEvPlanningKw(flow,states,car,maximum,now){
 const a=jointCarDemand(flow,states,'audi',now,undefined,undefined,true),b=jointCarDemand(flow,states,'jeep',now,undefined,undefined,true);
 const own=car==='audi'?a:b;own.kw=maximum;
 const soc=Number(states?.['sensor.growatt_battery_battery_soc']?.state),target=Number(flow.get('ess_wit_grid_charge_target_soc'))||100;
 const mode=flow.get('ess_wit_grid_charge_mode')||'auto';
 const wit=mode!=='off'&&Number.isFinite(soc)&&soc<target-.2?Math.min(8,Number(flow.get('ess_system_config')?.specs?.maximumBatteryChargePowerKw)||8):jointWitDemand(flow,now);
 return jointAllocate(a,b,wit)[car];
}
function jointEvLimit(flow,states,car,now,target,phases){
 if(flow.get('ess_joint_charging_16kw')!==true)return target;
 const a=jointCarDemand(flow,states,'audi',now),b=jointCarDemand(flow,states,'jeep',now),own=car==='audi'?a:b;
 const step=(Number(flow.get('ess_system_config')?.specs?.voltage)||230)*(phases===1?1:3)/1000;
 own.kw=Math.max(0,target)*step;own.step=step;own.min=6*step;own.fixed=false;
 const share=jointAllocate(a,b,jointWitDemand(flow,now))[car];
 const w=flow.get('ess_wit_grid_charge_status')||{},rb=flow.get('ess_wit_control_readback');
 const requested=jointFresh(w.updatedAt,now)&&w.sessionOwned&&!w.releasing?Math.max(0,Number(w.targetPowerW)||0)/1000:0;
 const binding=flow.get('ess_system_config')?.entities?.['select.growatt_grid_remote_power_control_enable'];
 const native=jointFresh(rb?.at,now)&&rb.remoteEntity===binding&&rb.authority===1&&rb.remote===1?Math.max(0,Number(rb.percent)||0)/100*(Number(flow.get('ess_system_config')?.specs?.inverterRatedPowerKw)||18):0;
 // Do not start a third consumer during a WIT-to-two-cars handover.
 const peerDemand=car==='audi'?b:a,ownStatus=flow.get('ess_'+car+'_control_status')||{};
 if(peerDemand.kw>=peerDemand.min&&peerDemand.kw>0&&Math.max(requested,native)>.2&&jointCarKw(flow,states,car,now)<.2)return 0;
 const remaining=Math.max(0,16-Math.max(requested,native)-jointCarKw(flow,states,car==='audi'?'jeep':'audi',now));
 const amps=Math.floor((Math.min(share,remaining)+1e-8)/step);return amps>=6?Math.min(target,amps):0;
}

function jointOwnChargeW(flow,previous,now,actual){
 const rb=flow.get('ess_wit_control_readback'),c=flow.get('ess_system_config'),m=role=>c?.entities?c.entities[role]:role;
 return previous.sessionOwned===true&&rb?.deviceId&&now>=rb.at&&now-rb.at<=120000&&rb.authority===1&&rb.remote===1&&rb.percent>0&&
 rb.remoteEntity===m('select.growatt_grid_remote_power_control_enable')&&rb.authorityEntity===m('select.growatt_grid_control_authority')
 ?Math.min(actual,rb.percent/100*(Number(c?.specs?.inverterRatedPowerKw)||18)*1000):0;
}
module.exports=function apply(flows){
 for(const n of flows.filter(n=>n.func))n.func=n.func.replace('function evPriorityReservation(flow,states,now,voltage) {',"function evPriorityReservation(flow,states,now,voltage) {\n    if(flow.get('ess_joint_charging_16kw')===true)return 0;");
 const helpers=[jointDeparture,jointFresh,jointMeasured,jointCarDemand,jointAllocate,jointWitDemand,jointCarKw,jointWitKw,jointEvPlanningKw,jointEvLimit,jointOwnChargeW].map(f=>f.toString()).join('\n')+'\n';
 const grid=flows.find(n=>n.id==='esswitgrid_ctrl1');
 grid.initialize=(grid.initialize||'')+"\nflow.set('ess_joint_charging_16kw', true);";
 grid.initialize=grid.initialize.replace("flow.set('ess_wit_ev_only', true);","flow.set('ess_wit_ev_only', false);");
 grid.func=helpers+grid.func.replace("if (flow.get('ess_wit_ev_only') === true && witCarCharging(states, now)) return stopOwned('Netladen wacht: auto laadt', details);",'')
 .replace('sharedChargeKw:sharedWitSlotKw(flow,s.start,s.end,reserveInputs.chargeKw,now,states)','sharedChargeKw:jointWitKw(flow,states,now,reserveInputs.chargeKw,s.start,s.end)')
 .replace('const currentForcedPowerW = previous.sessionOwned', 'const ownedMeasuredNetW=directSolarW!==null?jointOwnChargeW(flow,previous,now,Math.max(0,measuredChargeW-Math.max(0,directSolarW))):0;\nconst currentForcedPowerW = previous.sessionOwned').replace('Math.min(measuredNetChargeW, Math.max(0, Number(previous.targetPowerW) || 0))','Math.max(ownedMeasuredNetW,Math.min(measuredNetChargeW, Math.max(0, Number(previous.targetPowerW) || 0)))')
 .replaceAll('measuredNetChargeW >= 200', '(solarUsable ? measuredNetChargeW : directSolarW === 0 ? measuredChargeW : 0) >= 200')
 .replace("if (!chargeOption || vppRatePercent === null || durationMinutes === null", "if (durationMinutes === null")
 .replace('const externalBatteryChargeW = Math.max(0, actualBatteryChargeW - currentForcedPowerW);','const externalBatteryChargeW = Math.max(0, actualBatteryChargeW - Math.max(currentForcedPowerW,jointOwnChargeW(flow,previous,now,actualBatteryChargeW)));')
 .replace('const gridCommandLimitW = ', 'const jointLimitW=jointWitKw(flow,states,now,planLimitW/1000)*1000;\nconst gridCommandLimitW = Math.min(jointLimitW, ')
 .replace(/(const gridCommandLimitW = [^\n]+);/,'$1);');

 // Manual estimates use the same per-quarter 16 kW envelope.
 grid.func=grid.func.replace('sharedChargeKw:sharedWitSlotKw(flow,start,end,maximum,now,states)','sharedChargeKw:jointWitKw(flow,states,now,maximum,start,end)');
 for(const id of ['esswitgrid_transport_dispatch','esswitgrid_transport_reply']){
  const n=flows.find(n=>n.id===id);
  n.func=helpers+n.func.replace(/if \(flow.get\('ess_wit_ev_only'\) === true && witCarCharging\([\s\S]*?\},now\)\) \{flow.set\(key,null\);return \[null,\{payload:now\}\];\}/,'')
   .replace('const headroom=', 'const ownedStatus=flow.get(\'ess_wit_grid_charge_status\')||{};\n        const rawPv=Number(role(pvRole)?.state);\n        const ownCredit=Number.isFinite(rawPv)&&rawPv>=0&&power!==null?jointOwnChargeW(flow,ownedStatus,now,Math.max(0,power*scale-rawPv*(String(role(pvRole)?.attributes?.unit_of_measurement).toLowerCase()===\'kw\'?1000:1))):0;\n        const creditedOwn=Math.max(credited,ownCredit);\n        const headroom=').replace('limit-w+credited/3','limit-w+creditedOwn/3')
   .replace('const bmsLimit=','const jointStates=Object.fromEntries(Object.entries(mapping||{}).map(([id,actual])=>[id,raw?.[actual]]));\n        if(jointWitKw(flow,jointStates,now,(Number(spec.maximumBatteryChargePowerKw)||8))<.2){flow.set(key,null);return [null,{payload:now}];}\n        const jointBudgetW=jointWitKw(flow,jointStates,now,(Number(spec.maximumBatteryChargePowerKw)||8))*1000;\n        const bmsLimit=')
   .replace('Math.min(headroom,bmsLimit', 'Math.min(jointBudgetW,headroom,bmsLimit');
 }
 for(const [id,car]of [['ess00000000000d','audi'],['essjeep_ess00000000000d','jeep']]){
  const n=flows.find(n=>n.id===id),peer=car==='audi'?'jeep':'audi';
  n.func=helpers+n.func.replace('const requestedTargetCurrent = targetCurrent;',`const witRequest=flow.get('ess_wit_grid_charge_status')||{};
const witKw=witRequest.sessionOwned&&!witRequest.releasing?Math.max(0,Number(witRequest.targetPowerW)||0)/1000:0;

const jointPhases=phaseCount===1?1:3;
const jointAmps=jointEvLimit(flow,states,'${car}',now,targetCurrent,jointPhases);
if(targetCurrent>jointAmps)targetCurrent=jointAmps>=minimumCurrent?jointAmps:0;
const requestedTargetCurrent = targetCurrent;`).replace('const refreshNeeded =', 'if(targetCurrent>jointAmps)targetCurrent=jointAmps>=minimumCurrent?jointAmps:0;\nconst refreshNeeded =');
 }
};
module.exports.jointCarKw=jointCarKw;
module.exports.jointWitKw=jointWitKw;
module.exports.jointOwnChargeW=jointOwnChargeW;

// EV controllers are retained as source by the dashboard builder. Remove the
// previous generated budget before applying it again, including old exports.
module.exports.unapply=function unapply(flows){
 for(const n of flows.filter(n=>n.func)){
  n.func=n.func.replace(/^function (?:jointDeparture|jointFresh|jointMeasured|jointCarDemand|jointAllocate|jointWitDemand|jointCarKw|jointWitKw|jointEvPlanningKw|jointEvLimit|jointOwnChargeW)\([\s\S]*?^}\r?\n/gm,'')
   .replace(/const witRequest=flow.get\('ess_wit_grid_charge_status'\)[\s\S]*?(?=const requestedTargetCurrent = targetCurrent;)/g,'')
   .replace(/if\(targetCurrent>jointAmps\)targetCurrent=jointAmps>=minimumCurrent\?jointAmps:0;\r?\n/g,'');
 }
};

module.exports.jointHelpers=[jointDeparture,jointFresh,jointMeasured,jointCarDemand,jointAllocate,jointWitDemand,jointCarKw,jointWitKw,jointEvPlanningKw,jointEvLimit,jointOwnChargeW].map(f=>f.toString()).join("\n");
module.exports.jointFresh=jointFresh;
module.exports.jointMeasured=jointMeasured;
module.exports.jointCarDemand=jointCarDemand;
module.exports.jointAllocate=jointAllocate;
module.exports.jointWitDemand=jointWitDemand;
module.exports.jointCarKw=jointCarKw;
module.exports.jointWitKw=jointWitKw;
module.exports.jointEvPlanningKw=jointEvPlanningKw;
module.exports.jointEvLimit=jointEvLimit;
module.exports.jointOwnChargeW=jointOwnChargeW;

module.exports.jointDeparture=jointDeparture;
