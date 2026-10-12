module.exports=function apply(flows) {
    const get=id=>flows.find(n=>n.id===id),z='ess000000000001';
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('essclimateev_'))flows.splice(i,1);
    const control=get('ess00000000000c');
    control.func=control.func.replace("msg.topic === 'ess/audi/climate-start' && msg.payload === true","msg.topic === 'ess/audi/climate-start' && typeof msg.payload === 'boolean'")
        .replace('climateMessage = request;','climateMessage = request;\n        climateMessage.climateStop=msg.payload===false;');
    const guard=get('essaudi_guard001');guard.outputs=2;
    guard.wires=[['essaudi_climate01'],['essclimateev_audi_stop']];
    guard.func=guard.func.replace(/return msg;\s*$/,"return msg.climateStop ? [null,msg] : [msg,null];");
    flows.push({id:'essclimateev_audi_stop',type:'function',z,name:'Bereid Audi-klimaatstop voor',outputs:1,wires:[['essclimateev_audi_stop_api']],func:`msg.payload={data:{type:'call_service',domain:'audiconnect',service:'execute_vehicle_action',service_data:{device_id:msg.payload.deviceId,action:'stop_climatisation'}}};return msg;`});
    flows.push({id:'essclimateev_audi_stop_api',type:'ha-api',z,name:'Stop Audi-klimaat',server:'ess00000000000b',version:1,protocol:'websocket',method:'get',path:'',data:'',dataType:'json',responseType:'json',outputProperties:[],wires:[['essclimateev_audi_release']]});
    flows.push({id:'essclimateev_audi_release',type:'function',z,name:'Beëindig Audi-klimaatvoeding',outputs:1,wires:[['ess00000000000d']],func:`flow.set('ess_audi_climate_power_support',null);flow.set('ess_audi_climate_status',{available:true,pending:true,active:false,status:'Klimaatstop aangevraagd',updatedAt:new Date().toISOString()});return {payload:Date.now()};`});
    get('essaudi_power001').func=get('essaudi_power001').func.replace('minimumCurrentA:6,','minimumCurrentA:6,\n    minimumPowerW:1000,');
    // A climate-only lease must pass the Jeep's later dispatch/recovery guards,
    // even with a full battery, missing SOC or smart charging disabled.
    for(const n of flows.filter(n=>n.id.startsWith('essjeep_')&&n.func)) {
        if(n.id.startsWith('essjeep_guard_')) n.func=n.func.replace("if(flow.get('ess_jeep_smart_enabled')!==true || !manual || now-manual.at<0 || now-manual.at>43200000 || right.state==='disconnected')return null;",`const climateLease=Number(flow.get('ess_jeep_climate_power_support')?.expiresAt)>now;
    if(right.state==='disconnected'||!climateLease&&(flow.get('ess_jeep_smart_enabled')!==true||!manual||now-manual.at<0||now-manual.at>43200000))return null;`);
        if(n.id==='essjeep_ess000000000019')n.func=n.func.replace("flow.get('ess_jeep_smart_enabled')!==true || !manual || Date.now()-manual.at<0 || Date.now()-manual.at>43200000", "!(Number(flow.get('ess_jeep_climate_power_support')?.expiresAt)>Date.now()) && (flow.get('ess_jeep_smart_enabled')!==true || !manual || Date.now()-manual.at<0 || Date.now()-manual.at>43200000)");
    }
    for(const ui of flows.filter(n=>n.type==='ui-template'&&n.format)) {
        ui.format=ui.format.replace("startClimate(){this.send({topic:'ess/audi/climate-start',payload:true})}","startClimate(){this.send({topic:'ess/audi/climate-start',payload:!(this.d.audiClimate?.active||this.d.audiSmart?.climatePowerSupportActive)})}");
        ui.format=ui.format.replace('<b>Klimaat starten</b>',"<b>{{d.audiClimate?.active||d.audiSmart?.climatePowerSupportActive?'Klimaat stoppen':'Klimaat starten'}}</b>");
    }
};
