const {witApplyReadback,witReadbackResult,witGridTransport}=require('./wit-control-transport');
const runtime=require('./wit-runtime');
module.exports=function applyWitControlReadback(flows) {
    const get=id=>flows.find(n=>n.id===id),grid=get('esswitgrid_ctrl1'),z=grid.z;
    // A nodes/full deployment retains flow context. Do not orphan a hardware
    // session by overwriting its ownership when its settings node restarts.
    for(const [id,key] of [['esswitgrid_set01','ess_wit_grid_charge_status'],['esswitaudi_ctrl1','ess_wit_audi_discharge_status']]) {
        const n=get(id),marker=`flow.set('${key}',`;
        if(!n.initialize.includes(marker))throw new Error('WIT initialization insertion point missing: '+id);
        n.initialize=n.initialize.replace(marker,`if (flow.get('${key}') === undefined) ${marker}`);
    }
    const add=n=>{const i=flows.findIndex(x=>x.id===n.id);if(i<0)flows.push(n);else flows[i]=n;};
    const fn=(id,name,func,wires,initialize='')=>({id,type:'function',z,name,func,outputs:wires.length,noerr:0,initialize,finalize:'',libs:[],wires,x:750,y:1800});
    const api=(id,name,data,wires,property='witReply')=>({id,type:'ha-api',z,name,server:'ess00000000000b',version:1,debugenabled:false,protocol:'websocket',method:'get',path:'',data,dataType:'json',responseType:'json',outputProperties:[{property,propertyType:'msg',value:'',valueType:'results'}],wires:[wires],x:450,y:1800});
    add({id:'esswit_readback_inj',type:'inject',z,name:'Lees echte WIT-bediening (60 s)',props:[{p:'payload'}],repeat:'60',once:true,onceDelay:5,wires:[['esswit_readback_request']],x:150,y:1800});
    add(fn('esswit_readback_request','Reserveer WIT-terugmelding',`const now=Date.now(),pending=flow.get('ess_wit_readback_pending');
if(pending && now-pending<120000)return null;
flow.set('ess_wit_readback_pending',now);msg.witReadId=now;return msg;`,[['esswit_readback_registry']],"flow.set('ess_wit_readback_enabled',true);"));
    add(api('esswit_readback_registry','Zoek lokaal gekoppelde WIT','{"type":"config/entity_registry/list"}',['esswit_readback_prepare']));
    add(fn('esswit_readback_prepare','Koppel WIT-registerterugmelding',`const config=flow.get('ess_system_config'),entities=config?.entities;
const remoteRole='select.growatt_grid_remote_power_control_enable',authorityRole='select.growatt_grid_control_authority';
const remoteEntity=entities?entities[remoteRole]:remoteRole,authorityEntity=entities?entities[authorityRole]:authorityRole;
const entries=msg.witReply?.result||msg.witReply;
const remote=Array.isArray(entries)?entries.find(e=>e.entity_id===remoteEntity&&e.platform==='growatt_modbus'):null;
const authority=Array.isArray(entries)?entries.find(e=>e.entity_id===authorityEntity&&e.platform==='growatt_modbus'):null;
if(!remote?.device_id || !authority || remote.config_entry_id!==authority.config_entry_id){flow.set('ess_wit_control_readback',null);flow.set('ess_wit_readback_pending',null);return null;}
msg.witBinding={deviceId:remote.device_id,remoteEntity,authorityEntity};
msg.payload={data:{type:'call_service',domain:'growatt_modbus',service:'get_register_data',service_data:{device_id:remote.device_id,register_type:'holding',start_address:30100,count:1},return_response:true}};return msg;`,[['esswit_readback_authority']]));
    add(api('esswit_readback_authority','Lees WIT-bedieningsbevoegdheid','',['esswit_readback_remote_prepare']));
    add(fn('esswit_readback_remote_prepare','Vraag afstandsbediening en netlaadtoestemming',`msg.witAuthority=msg.witReply?.response||msg.witReply;
msg.payload={data:{type:'call_service',domain:'growatt_modbus',service:'get_register_data',service_data:{device_id:msg.witBinding.deviceId,register_type:'holding',start_address:30407,count:5},return_response:true}};return msg;`,[['esswit_readback_remote']]));
    add(api('esswit_readback_remote','Lees echte WIT-laadopdracht','',['esswit_readback_save']));
    add(fn('esswit_readback_save','Bewaar gevalideerde WIT-registers',witReadbackResult.toString()+`
if(flow.get('ess_wit_readback_pending')!==msg.witReadId)return null;
flow.set('ess_wit_control_readback',witReadbackResult(msg.witAuthority,msg.witReply?.response||msg.witReply,msg.witBinding,Date.now()));
flow.set('ess_wit_readback_pending',null);return {payload:Date.now(),witReadbackTick:true};`,[['esswitgrid_transport_reply','esswitgrid_ctrl1']]));
    add({id:'esswit_readback_catch',type:'catch',z,name:'WIT-terugmelding niet beschikbaar',scope:['esswit_readback_registry','esswit_readback_authority','esswit_readback_remote'],uncaught:false,wires:[['esswit_readback_error']],x:450,y:1840});
    add(fn('esswit_readback_error','Blokkeer bij ontbrekende WIT-registers',"flow.set('ess_wit_control_readback',null);flow.set('ess_wit_readback_pending',null);return {payload:Date.now()};",[['esswitgrid_ctrl1']]));
    for(const [id,marker] of [['esswitgrid_ctrl1',"const previous = flow.get('ess_wit_grid_charge_status')"],['esswitaudi_ctrl1',"const previous = flow.get('ess_wit_audi_discharge_status')"],['esswitexport_ctrl','const socEntity =']]) {
        const n=get(id);
        if(!n.func.includes(marker))throw new Error('WIT readback insertion point missing: '+id);
        n.func=witApplyReadback.toString()+'\n'+n.func.replace(marker,`witApplyReadback(states, flow.get('ess_system_config'), flow.get('ess_wit_control_readback'), flow.get('ess_wit_readback_enabled'), Date.now());\n${marker}`);
        if(id!=='esswitexport_ctrl')n.func=n.func.replace('        pendingUntil:0,','        pendingUntil:0,\n        commandFault:!!flow.get(\'ess_wit_command_fault\'),');
    }
    const previousMarker="const previous = flow.get('ess_wit_grid_charge_status') || {};";
    grid.func=grid.func.replace(previousMarker,`${previousMarker}
const chargeAck=flow.get('ess_wit_grid_write_ack'), chargeReadback=flow.get('ess_wit_control_readback');
if(previous.sessionOwned && chargeAck && chargeReadback && Date.now()-chargeAck.at>=0 && Date.now()-chargeAck.at<=120000 && chargeReadback.remote===1 && chargeReadback.percent===chargeAck.powerPercent) {
    // The transport can lower a requested target using newer P1 measurements.
    // Supervise that verified applied command, not the older planner target.
    previous.powerPercent=chargeAck.powerPercent;
    previous.targetPowerW=chargeAck.powerPercent/100*(Number(flow.get('ess_system_config')?.specs?.inverterRatedPowerKw)||18)*1000;
}
`);
    const guardMarker="if (!chargeOption ||";
    grid.func=grid.func.replace(guardMarker,`const transport=flow.get('ess_wit_grid_transport');
if(transport) {
    if(now-transport.startedAt>=240000) {
        flow.set('ess_wit_command_fault',{at:now,attempts:2,reason:'WIT-opdracht blijft onderweg'});
        return stopOwned('WIT-opdracht duurt te lang · veilig stoppen',details);
    }
    save('blocked',{...details,sessionOwned:true,powerPercent:previous.powerPercent,targetPowerW:previous.targetPowerW,status:'WIT-laadopdracht onderweg · wacht op registerbevestiging'});
    return null;
}
${guardMarker}`);
    // Stop and release still use the existing adapter; only charge writes change.
    grid.wires[0]=['esswitgrid_transport_dispatch'];grid.wires[1]=['esswitgrid_transport_dispatch'];grid.wires[2]=['esswitgrid_transport_dispatch'];
    const helperSource=[runtime.witNumber,runtime.witFresh,runtime.witBatteryLimit,witReadbackResult,witGridTransport].map(f=>f.toString()).join('\n');
    add(fn('esswitgrid_transport_dispatch','Stuur één veilige WIT-laadopdracht',helperSource+"\nreturn witGridTransport(flow,global,msg,false,Date.now());",[['esswitgrid_transport_api'],['esswitgrid_ctrl1']]));
    add(api('esswitgrid_transport_api','Schrijf en controleer WIT-laadregisters','',['esswitgrid_transport_reply']));
    add(fn('esswitgrid_transport_reply','Bevestig echte WIT-laadopdracht',helperSource+"\nreturn witGridTransport(flow,global,msg,true,Date.now());",[['esswitgrid_transport_api'],['esswitgrid_ctrl1']]));
    add({id:'esswitgrid_transport_catch',type:'catch',z,name:'WIT-schrijfopdracht mislukt',scope:['esswitgrid_transport_api'],uncaught:false,wires:[['esswitgrid_transport_reply']],x:450,y:1900});
};
