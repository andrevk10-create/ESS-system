function witChargeAudit(flow,status,now,node){
    const previous=flow.get('ess_wit_charge_audit');
    const events=Array.isArray(previous)?previous:[];
    const event={at:now,mode:status.mode,status:status.status,active:status.active===true,scheduled:status.scheduledNow===true,confirmed:status.commandConfirmed===true,powerConfirmed:status.powerConfirmed===true,fault:status.commandFault===true,soc:status.reportedBatteryLimits?.reportedSoc??null,target:status.targetSoc,nextStart:status.nextScheduledStart||null,requestedW:status.requestedPowerW||0,measuredW:status.measuredBatteryPowerW??null};
    const key=JSON.stringify([event.mode,event.status,event.active,event.scheduled,event.confirmed,event.powerConfirmed,event.fault,event.soc,event.target]);
    const last=events.at(-1);
    if(last?.key===key&&now-last.at<300000)return;
    const rb=flow.get('ess_wit_control_readback'), fault=flow.get('ess_wit_command_fault');
    const record={...event,key, faultReason:fault?.reason||null,
        readback:rb?{at:rb.at,authority:rb.authority,remote:rb.remote,periods:rb.periods,duration:rb.duration}:null};
    flow.set('ess_wit_charge_audit',[...events,record].slice(-512));
    if(typeof node?.send==='function')node.send([null,null,null,null,null,null,{payload:JSON.stringify(record),filename:'/config/node-red/ess-wit-audit-'+new Date(now).toISOString().slice(0,10)+'.jsonl'}]);
}
module.exports=function apply(flows){
    const grid=flows.find(n=>n.id==='esswitgrid_ctrl1');
    const anchor="    flow.set('ess_wit_grid_charge_status', next);";
    if(!grid.func.includes(anchor))throw Error('WIT audit insertion point missing');
    grid.func=witChargeAudit.toString()+'\n'+grid.func.replace(anchor,anchor+"\n    witChargeAudit(flow,next,now,node);");
    grid.outputs=7;
    grid.wires[6]=['esswit_audit_write'];
    const old=flows.findIndex(n=>n.id==='esswit_audit_write');
    if(old>=0)flows.splice(old,1);
    flows.push({id:'esswit_audit_write',type:'file',z:grid.z,name:'Bewaar WIT-laadbeslissingen per dag',
        filename:'filename',filenameType:'msg',appendNewline:true,createDir:true,overwriteFile:'false',encoding:'none',
        x:1200,y:1800,wires:[[]]});
};
module.exports.witChargeAudit=witChargeAudit;
