// Learn sustained battery-side delivery without changing the full-power command.
function witDeliveredRate(previous, now, requestedW, deliveredW, efficiency, valid) {
 const p=previous&&previous.requestedW===requestedW?previous:{};
 let samples=Array.isArray(p.samples)?p.samples.filter(s=>now>=s.at&&now-s.at<=600000):[];
 let learnedW=now>=p.learnedAt&&now-p.learnedAt<=7200000?p.learnedW:null;
 if(valid&&Number.isFinite(deliveredW)&&deliveredW>=200&&requestedW>0&&efficiency>0){
  const last=samples.at(-1);
  if(last&&now-last.at>120000)samples=[];
  if(!samples.length||now-samples.at(-1).at>=30000)samples.push({at:now,w:Math.min(requestedW,deliveredW/efficiency)});
  if(samples.length>=6&&now-samples[0].at>=300000){
   let energy=0,time=0;
   for(let i=1;i<samples.length;i++){const dt=samples[i].at-samples[i-1].at;energy+=(samples[i].w+samples[i-1].w)/2*dt;time+=dt;}
   learnedW=energy/time;
   return {requestedW,samples,learnedW,learnedAt:now,planningW:Math.min(requestedW,learnedW)};
  }
 }else samples=[];
 return {requestedW,samples,learnedW,learnedAt:p.learnedAt,planningW:Math.min(requestedW,learnedW??requestedW)};
}
module.exports=function apply(flows){
 const grid=flows.find(n=>n.id==='esswitgrid_ctrl1');
 grid.func=witDeliveredRate.toString()+'\n'+grid.func;
 const marker='const reserveInputs=';
 if(!grid.func.includes(marker))throw Error('Delivered charging planner anchor missing');
 grid.func=grid.func.replace(marker,`const deliveryPower=value('sensor.growatt_battery_battery_power');
const deliveryPv=value('sensor.growatt_solar_solar_total_power');
const deliveryRb=flow.get('ess_wit_control_readback');
const deliveryConfig=flow.get('ess_system_config')||{};
const deliveryLimit=directBatteryLimitW();
const deliveryValid=previous.sessionOwned===true&&previous.commandConfirmed===true&&previous.powerConfirmed===true&&
 deliveryRb?.remoteEntity===deliveryConfig.entities?.['select.growatt_grid_remote_power_control_enable']&&deliveryRb?.authority===1&&deliveryRb?.remote===1&&now>=deliveryRb.at&&now-deliveryRb.at<=120000&&
 Math.abs(deliveryRb.percent/100*inverterRatedPowerW-deliveryLimit)<inverterRatedPowerW/100&&
 fresh('sensor.growatt_battery_battery_power',120000)&&(deliveryPv===0||fresh('sensor.growatt_solar_solar_total_power',120000))&&deliveryPower!==null&&deliveryPv!==null;
const deliveryRate=witDeliveredRate(flow.get('ess_wit_delivered_rate'),now,deliveryLimit,
 Math.max(0,deliveryPower*(Number(flow.get('ess_growatt_battery_power_scale'))===.1?.1:1)-Math.max(0,deliveryPv)),chargeEfficiency,deliveryValid);
flow.set('ess_wit_delivered_rate',deliveryRate);
${marker}`);
 grid.func=grid.func.replace('chargeKw:directBatteryLimitW()/1000','chargeKw:deliveryRate.planningW/1000');
 // The budget reserves commanded power, even when delivery is lower.
 grid.func=grid.func.replace('jointWitKw(flow,states,now,reserveInputs.chargeKw,s.start,s.end)','jointWitKw(flow,states,now,deliveryLimit/1000,s.start,s.end)');
 grid.func=grid.func.replace('Math.min(scheduledSlot.powerKw * 1000, planLimitW,','Math.min(planLimitW,');
 grid.func=grid.func.replace('    knownPriceGoal:', '    expectedChargePowerW:deliveryRate.planningW,\n    learnedChargePowerW:deliveryRate.learnedW,\n    knownPriceGoal:');
};
module.exports.witDeliveredRate=witDeliveredRate;
