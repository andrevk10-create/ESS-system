function jointCarKw(flow,states,car,now,start,end){
 const suffix=car==='audi'?'':'_2',status=states?.['sensor.ev_charger'+suffix+'_status'];
 if(!['awaiting_start','awaiting_authorization','ready_to_charge','charging','completed'].includes(status?.state))return 0;
 const p=flow.get('ess_'+car+'_control_status')||{},phases=p.phaseCount===1?1:3;
 const power=states?.['sensor.ev_charger'+suffix+'_power'],age=now-Date.parse(power?.last_reported||power?.last_updated||'');
 const measured=age>=0&&age<=120000?Math.max(0,Number(power?.state)||0)*(String(power?.attributes?.unit_of_measurement).toLowerCase()==='kw'?1:.001):0;
 const current=Math.max(0,Number(p.targetCurrent)||0)*230*phases/1000;
 if(start===undefined)return Math.max(measured,current);
 const overlap=(p.selectedSlots||[]).filter(s=>Date.parse(s.start)<end&&Date.parse(s.end)>start);
 let kw=Math.max(0,...overlap.map(s=>Number(s.powerKw)||Number(p.plannedChargePowerKw)||11));
 if(start<now+900000)kw=Math.max(kw,measured,current);
 return kw;
}
function jointWitKw(flow,states,now,maximum,start,end){
 if(flow.get('ess_joint_charging_16kw')!==true)return maximum;
 const remaining=16-jointCarKw(flow,states,'audi',now,start,end)-jointCarKw(flow,states,'jeep',now,start,end);
 // Preserve full configured WIT charging power rather than stretching low-power blocks.
 return remaining>=maximum-.001?maximum:0;
}
function jointOwnChargeW(flow,previous,now,actual){
 const rb=flow.get('ess_wit_control_readback'),c=flow.get('ess_system_config'),m=role=>c?.entities?c.entities[role]:role;
 return previous.sessionOwned===true&&rb?.deviceId&&now>=rb.at&&now-rb.at<=120000&&rb.authority===1&&rb.remote===1&&rb.percent>0&&
 rb.remoteEntity===m('select.growatt_grid_remote_power_control_enable')&&rb.authorityEntity===m('select.growatt_grid_control_authority')
 ?Math.min(actual,rb.percent/100*(Number(c?.specs?.inverterRatedPowerKw)||18)*1000):0;
}
module.exports=function apply(flows){
 const helpers=[jointCarKw,jointWitKw,jointOwnChargeW].map(f=>f.toString()).join('\n')+'\n';
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
   .replace('const bmsLimit=','const jointStates=Object.fromEntries(Object.entries(mapping||{}).map(([id,actual])=>[id,raw?.[actual]]));\n        if(jointWitKw(flow,jointStates,now,(Number(spec.maximumBatteryChargePowerKw)||9))===0){flow.set(key,null);return [null,{payload:now}];}\n        const bmsLimit=');
 }
 for(const [id,car]of [['ess00000000000d','audi'],['essjeep_ess00000000000d','jeep']]){
  const n=flows.find(n=>n.id===id),peer=car==='audi'?'jeep':'audi';
  n.func=helpers+n.func.replace('const requestedTargetCurrent = targetCurrent;',`const witRequest=flow.get('ess_wit_grid_charge_status')||{};
const witKw=witRequest.sessionOwned&&!witRequest.releasing?Math.max(0,Number(witRequest.targetPowerW)||0)/1000:0;
const availableKw=flow.get('ess_joint_charging_16kw')===true?Math.max(0,16-witKw-jointCarKw(flow,states,'${peer}',now)):Infinity;
const jointPhases=phaseCount===1?1:3;
const jointAmps=Math.floor(availableKw*1000/(230*jointPhases));
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
  n.func=n.func.replace(/^function (?:jointCarKw|jointWitKw|jointOwnChargeW)\([\s\S]*?^}\r?\n/gm,'')
   .replace(/const witRequest=flow.get\('ess_wit_grid_charge_status'\)[\s\S]*?(?=const requestedTargetCurrent = targetCurrent;)/g,'')
   .replace(/if\(targetCurrent>jointAmps\)targetCurrent=jointAmps>=minimumCurrent\?jointAmps:0;\r?\n/g,'');
 }
};
