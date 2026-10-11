function homekitRefreshRequest(flow, global, now) {
    const c=flow.get('ess_climate_config'),h=c?.heatSource,ha=global.get('homeassistant')?.homeAssistant;
    const registry=flow.get('ess_climate_registry');
    if(flow.get('ess_charging_preferences_ready')!==true || !h?.enabled || h.adapter!=='homekit-room' ||
        !c.tadoHysteresis || c.mode!=='auto' || !ha?.isConnected ||
        !/^climate\.[a-z0-9_]+$/.test(h.entity || '') || registry?.entities?.[h.entity]?.platform!=='homekit_controller' ||
        now-registry.at<0 || now-registry.at>4*3600000) return null;
    const pending=flow.get('ess_homekit_refresh_pending');
    if(pending && now-pending.at<90000) return null;
    const request={entity:h.entity,at:now};
    flow.set('ess_homekit_refresh_pending',request);
    return {refresh:request,payload:{entity:h.entity}};
}
function homekitRefreshResult(flow, global, msg, now) {
    const pending=flow.get('ess_homekit_refresh_pending'),h=flow.get('ess_climate_config')?.heatSource;
    if(!pending || pending.at!==msg.refresh?.at || pending.entity!==msg.refresh.entity) return null;
    flow.set('ess_homekit_refresh_pending',null);
    const e=msg.actual,cache=global.get('homeassistant');
    if(h?.adapter!=='homekit-room' || h.entity!==pending.entity || e?.entity_id!==pending.entity ||
        !['off','heat'].includes(e.state) || !Number.isFinite(e.attributes?.current_temperature) ||
        e.attributes.current_temperature< -10 || e.attributes.current_temperature>50 || !cache?.homeAssistant?.isConnected) {
        flow.set('ess_homekit_refresh_status',{at:now,ok:false,reason:'Geen geldige lokale temperatuur ontvangen'});return null;
    }
    // This is the actual HA API response, including its original timestamps.
    // Do not invent freshness or overwrite a newer push received in flight.
    const stamp=x=>new Date(x?.last_reported||x?.last_updated||0).getTime();
    const previous=cache.homeAssistant.states[e.entity_id];
    if(stamp(e)>=stamp(previous)) {
        cache.homeAssistant.states[e.entity_id]=e;global.set('homeassistant',cache);
    }
    flow.set('ess_homekit_refresh_status',{at:now,checkedAt:now,ok:true,entity:e.entity_id,temperature:e.attributes.current_temperature,reportedAt:e.last_reported||e.last_updated,
        changed:previous?.state!==e.state || previous?.attributes?.current_temperature!==e.attributes.current_temperature,
        verification:'ha-state-after-update-request'});
    return {payload:now};
}
module.exports=function apply(flows) {
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('esshk_refresh_'))flows.splice(i,1);
    const get=id=>flows.find(n=>n.id===id),base={z:'ess000000000001',x:850,y:2200};
    const fn=(id,name,func,wires)=>({...base,id,type:'function',name,func,outputs:wires.length,noerr:0,initialize:'',finalize:'',libs:[],wires});
    const mapper=get('ess00000000000a');
    const marker="flow.set('ess_dashboard_live', dashboard);";
    mapper.func=mapper.func.replace(/if\(dashboard\.climate\) dashboard\.climate\.homekitRefresh=flow\.get\('ess_homekit_refresh_status'\)\|\|null;\n/g,'');
    mapper.func=mapper.func.replace(marker,"if(dashboard.climate) dashboard.climate.homekitRefresh=flow.get('ess_homekit_refresh_status')||null;\n"+marker);
    const ui=get('esstpl_climate01');
    ui.format=ui.format.replace('<div v-if="climateDraft">',`<small v-if="d.climate&&d.climate.homekitRefresh" role="status">HomeKit-controle: {{new Date(d.climate.homekitRefresh.at).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Amsterdam'})}} · {{d.climate.homekitRefresh.ok?'HA-waarde uitgelezen':d.climate.homekitRefresh.reason}}</small><div v-if="climateDraft">`);
    flows.push({...base,id:'esshk_refresh_tick',type:'inject',name:'Ververs lokale woonkamer elke 5 minuten',props:[{p:'payload'}],payload:'',payloadType:'date',repeat:'300',once:true,onceDelay:90,wires:[['esshk_refresh_request']]},
        fn('esshk_refresh_request','Vraag actuele HomeKit-temperatuur',homekitRefreshRequest.toString()+'\nreturn homekitRefreshRequest(flow,global,Date.now());',[['esshk_refresh_update']]),
        {...get('essclim_tado'),id:'esshk_refresh_update',name:'Lees HomeKit-apparaat opnieuw uit',action:'homeassistant.update_entity',domain:'homeassistant',service:'update_entity',
            data:"($assert(payload.entity=$flowContext('ess_climate_config').heatSource.entity and $flowContext('ess_climate_config').heatSource.adapter='homekit-room','HomeKit-koppeling gewijzigd'); {\"entity_id\":payload.entity})",wires:[['esshk_refresh_wait']]},
        {...base,id:'esshk_refresh_wait',type:'delay',name:'Wacht op HomeKit-uitlezing na debounce',pauseType:'delay',timeout:'12',timeoutUnits:'seconds',rate:'1',nbRateUnits:'1',rateUnits:'second',randomFirst:'1',randomLast:'5',randomUnits:'seconds',drop:false,allowrate:false,wires:[['esshk_refresh_read']]},
        {...get('esswithist_api001'),id:'esshk_refresh_read',name:'Lees echte HA-woonkamermeting',method:'get',path:'states/{{refresh.entity}}',data:'',outputProperties:[{property:'actual',propertyType:'msg',value:'',valueType:'results'}],wires:[['esshk_refresh_save']]},
        fn('esshk_refresh_save','Beoordeel hysterese na verse uitlezing',homekitRefreshResult.toString()+'\nreturn homekitRefreshResult(flow,global,msg,Date.now());',[['essclim_hyst_plan']]),
        {...base,id:'esshk_refresh_catch',type:'catch',name:'Meld mislukte HomeKit-uitlezing',scope:['esshk_refresh_update','esshk_refresh_read'],uncaught:false,wires:[['esshk_refresh_error']]},
        fn('esshk_refresh_error','Bewaar uitleesfout zonder temperatuur te wijzigen',"const p=flow.get('ess_homekit_refresh_pending');if(p?.at!==msg.refresh?.at)return null;flow.set('ess_homekit_refresh_pending',null);flow.set('ess_homekit_refresh_status',{at:Date.now(),ok:false,reason:'HomeKit-uitlezing mislukt'});return null;",[]));
};
module.exports.homekitRefreshRequest=homekitRefreshRequest;
module.exports.homekitRefreshResult=homekitRefreshResult;
