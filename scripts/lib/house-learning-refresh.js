function houseLearningRefreshResult(flow,global,msg,now) {
    const cache=global.get('homeassistant'),config=flow.get('ess_system_config')||{};
    if(!cache?.homeAssistant?.isConnected || !Array.isArray(msg.actual))return null;
    const roles=['sensor.p1_meter_vermogen','sensor.growatt_solar_system_output_power',
        ...[1,2,3].map(n=>'sensor.pv_array_'+n+'_power'),
        ...['','_2'].flatMap(s=>['power','status','current'].map(r=>'sensor.ev_charger'+s+'_'+r)),
        ...['','_2'].map(s=>'binary_sensor.ev_charger'+s+'_online')];
    const ids=new Set(roles.map(r=>Object.hasOwn(config.entities||{},r)?config.entities[r]:r).filter(Boolean));
    const stamp=e=>Date.parse(e?.last_reported||e?.last_updated||e?.last_changed);
    let received=0;
    for(const e of msg.actual){
        if(!ids.has(e?.entity_id)||typeof e.state!=='string'||!Number.isFinite(stamp(e))||stamp(e)>now+60000)continue;
        const previous=cache.homeAssistant.states[e.entity_id];
        if(!previous||!Number.isFinite(stamp(previous))||stamp(e)>=stamp(previous)){
            cache.homeAssistant.states[e.entity_id]=e;received++;
        }
    }
    global.set('homeassistant',cache);
    flow.set('ess_house_learning_snapshot',{at:now,entities:Object.fromEntries(msg.actual.filter(e=>ids.has(e?.entity_id)).map(e=>[e.entity_id,e]))});
    flow.set('ess_house_learning_refresh',{at:now,ok:true,received});
    return {payload:now};
}
module.exports=function apply(flows){
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('esshouse_refresh_'))flows.splice(i,1);
    const get=id=>flows.find(n=>n.id===id),z='ess000000000001',g='esseditor_history';
    get('esswithist_inject').wires=[['esshouse_refresh_api']];
    flows.push({...get('esswithist_api001'),id:'esshouse_refresh_api',name:'Lees echte HA-tijdstempels voor woningleren',method:'get',path:'states',data:'',
        outputProperties:[{property:'actual',propertyType:'msg',value:'',valueType:'results'}],wires:[['esshouse_refresh_save']]},
        {id:'esshouse_refresh_save',type:'function',z,g,name:'Behoud echte metingen en sluit beide auto’s uit',outputs:1,func:houseLearningRefreshResult.toString()+'\nreturn houseLearningRefreshResult(flow,global,msg,Date.now());',wires:[['esswithist_prep1']]},
        {id:'esshouse_refresh_catch',type:'catch',z,g,name:'Geen woningleren met mislukte uitlezing',scope:['esshouse_refresh_api'],uncaught:false,wires:[['esshouse_refresh_error']]},
        {id:'esshouse_refresh_error',type:'function',z,g,name:'Registreer gemiste uitlezing',outputs:1,func:"flow.set('ess_house_learning_refresh',{at:Date.now(),ok:false}); return {payload:Date.now()};",wires:[['esswithist_prep1']]});
};
module.exports.houseLearningRefreshResult=houseLearningRefreshResult;
