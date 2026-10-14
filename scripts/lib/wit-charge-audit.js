function witChargeAudit(flow,status,now){
    const previous=flow.get('ess_wit_charge_audit');
    const events=Array.isArray(previous)?previous:[];
    const event={at:now,mode:status.mode,status:status.status,active:status.active===true,scheduled:status.scheduledNow===true,confirmed:status.commandConfirmed===true,powerConfirmed:status.powerConfirmed===true,fault:status.commandFault===true,soc:status.reportedBatteryLimits?.reportedSoc??null,target:status.targetSoc,nextStart:status.nextScheduledStart||null,requestedW:status.requestedPowerW||0,measuredW:status.measuredBatteryPowerW??null};
    const key=JSON.stringify([event.mode,event.status,event.active,event.scheduled,event.confirmed,event.powerConfirmed,event.fault,event.soc,event.target]);
    const last=events.at(-1);
    if(last?.key===key&&now-last.at<300000)return;
    flow.set('ess_wit_charge_audit',[...events,{...event,key}].slice(-512));
}
module.exports=function apply(flows){
    const grid=flows.find(n=>n.id==='esswitgrid_ctrl1');
    const anchor="    flow.set('ess_wit_grid_charge_status', next);";
    if(!grid.func.includes(anchor))throw Error('WIT audit insertion point missing');
    grid.func=witChargeAudit.toString()+'\n'+grid.func.replace(anchor,anchor+"\n    witChargeAudit(flow,next,now);");
};
module.exports.witChargeAudit=witChargeAudit;
