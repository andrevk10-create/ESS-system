const runtime=require('./climate-runtime');
const helpers=[runtime.climateNumber,runtime.climateFresh,runtime.climateRoomFeedback].map(f=>f.toString()).join('\n');
function homekitClimate(states,entities,registry,now) {
    const records=registry?.entities||{},validRegistry=Number.isFinite(registry?.at)&&now-registry.at>=0&&now-registry.at<=4*3600000;
    const roles=['climate.heating_zone_1','climate.heating_zone_2','climate.heating_zone_3'];
    const local=Object.entries(records).filter(([id,r])=>id.startsWith('climate.')&&r.platform==='homekit_controller').map(([id])=>{
        const e=states[id],feedback=climateRoomFeedback(e,now),role=roles.find(r=>entities[r]===id)||null;
        return {entity:id,label:e?.attributes?.friendly_name||'Lokale thermostaat',role,current:feedback.current,target:feedback.target,
            valid:validRegistry&&feedback.valid,reason:!validRegistry?'Wacht op actuele integratiegegevens':feedback.reason};
    });
    const mapped=roles.filter(r=>entities[r]).map(role=>({role,entity:entities[role],platform:validRegistry?records[entities[role]]?.platform||'unknown':'unknown'}));
    return {registryReady:validRegistry,local,validCount:local.filter(r=>r.valid).length,mapped,
        allMappedLocal:mapped.length>0&&mapped.every(r=>r.platform==='homekit_controller'&&local.some(l=>l.entity===r.entity&&l.valid)),
        reason:!validRegistry?'Wacht op integratiecontrole':!local.length?'Geen lokale thermostaten via HomeKit gevonden':local.some(r=>!r.valid)?'HomeKit gekoppeld; meetwaarden nog niet allemaal bruikbaar':'Lokale thermostaten beschikbaar; controleer de kamerkoppelingen'};
}
function apply(flows) {
    const get=id=>flows.find(n=>n.id===id),base={z:'ess000000000001',x:600,y:2220};
    flows.push({...base,id:'essclim_hk_tick',type:'inject',name:'Lees herkomst klimaatzones',props:[{p:'payload'}],payload:'',payloadType:'date',repeat:'3600',once:true,onceDelay:65,crontab:'',wires:[['essclim_hk_registry']]},
        {...get('essclim_weather_api'),...base,id:'essclim_hk_registry',name:'Lees HA klimaat-entiteitenregister',data:JSON.stringify({type:'config/entity_registry/list'}),dataType:'json',outputProperties:[{property:'registryReply',propertyType:'msg',value:'',valueType:'results'}],wires:[['essclim_hk_parse']]},
        {...base,id:'essclim_hk_parse',type:'function',name:'Bewaar geverifieerde klimaatintegraties',outputs:0,timeout:0,noerr:0,initialize:'',finalize:'',libs:[],wires:[],func:`const result=msg.registryReply?.result||msg.registryReply;
if(!Array.isArray(result)) return null;
const entities={};for(const e of result) if(/^climate\\.[a-z0-9_]+$/.test(e.entity_id||'')) entities[e.entity_id]={platform:e.platform};
flow.set('ess_climate_registry',{at:Date.now(),entities});return null;`});
    const mapper=get('ess00000000000a');
    mapper.func=mapper.func.replace(/\/\/ BEGIN HOMEKIT CLIMATE[\s\S]*?\/\/ END HOMEKIT CLIMATE\n/g,'');
    const code=`// BEGIN HOMEKIT CLIMATE
${helpers}
${homekitClimate.toString()}
const climateRegistry=flow.get('ess_climate_registry');
dashboard.climate.homekit=homekitClimate(rawStates,essRuntimeConfig.entities||{},climateRegistry,Date.now());
for(const zone of dashboard.climate.tado||[]) {
 const actual=essRuntimeConfig.entities?.[zone.entityId],item=rawStates[actual],feedback=climateRoomFeedback(item,Date.now());
 zone.connection=climateRegistry?.entities?.[actual]?.platform==='homekit_controller'?'Lokaal via HomeKit':climateRegistry?.entities?.[actual]?.platform==='tado'?'Tado-cloud':'Integratie nog niet gecontroleerd';
 if(zone.configured && !feedback.valid) {zone.available=false;zone.active=false;zone.current=null;zone.status=feedback.reason;zone.modeLabel=feedback.reason;}
}
// END HOMEKIT CLIMATE
`;
    const pos=mapper.func.lastIndexOf("flow.set('ess_dashboard_live', dashboard);");
    mapper.func=mapper.func.slice(0,pos)+code+mapper.func.slice(pos);
    const control=get('essclimate_ctrl1');
    control.func=helpers+'\n'+control.func;
    control.func=control.func.replace("const outputs = [null, null, null, null];",`if(selected.entityId.startsWith('climate.heating_zone_')&&!climateRoomFeedback(current,Date.now()).valid) return null;
const outputs = [null, null, null, null];`);
    control.func=control.func.replace("const mode = String(current.state).toLowerCase() === 'off' ? selected.onMode : 'off';",`let mode = String(current.state).toLowerCase() === 'off' ? selected.onMode : 'off';
    if(selected.domain==='climate'&&selected.entityId.startsWith('climate.heating_zone_')) {
        const modes=current.attributes?.hvac_modes||[];
        if(mode==='auto'&&!modes.includes('auto')&&selected.entityId.startsWith('climate.heating_zone_')&&modes.includes('heat')) mode='heat';
        if(!modes.includes(mode)) return null;
    }`);
    // Broken HomeKit startup readings must never become heating-room proposals.
    const config=get('essconfig_control');
    config.func=config.func.replace("const heating = ranked(climateEntries.filter((entry) =>", "const heating = ranked(climateEntries.filter((entry) => !(Number(entry.attributes.current_temperature)>50 || Number(entry.attributes.current_temperature)<-10 || entry.attributes.hvac_action==='cooling') &&");
    const ui=get('esstpl_climate01');
    ui.format=ui.format.replace('<div v-if="climateDraft">',`<details v-if="d.climate&&d.climate.homekit" class="panel"><summary>Lokale thermostaten via HomeKit · {{d.climate.homekit.validCount}} bruikbaar</summary><p>{{d.climate.homekit.reason}}</p><p class="subtle">Koppel de juiste lokale thermostaat aan de kamer via Configuratie. Controleer daarbij de fysieke knop. De Tado-cloudintegratie pas uitschakelen nadat alle kamerkoppelingen en overige functies zijn gecontroleerd.</p><div class="plan-grid"><div class="plan-card" v-for="z in d.climate.homekit.local" :key="z.entity"><span>{{z.label}}</span><b>{{z.valid?temperature(z.current):'Geen geldige meting'}} → {{temperature(z.target)}}</b><small>{{z.reason}}</small><small>{{z.role?'Gekoppeld aan verwarmingszone '+z.role.slice(-1):'Nog geen kamer gekoppeld'}}</small></div></div><p v-for="z in d.climate.homekit.mapped" :key="z.role" class="subtle">Verwarmingszone {{z.role.slice(-1)}}: {{z.platform==='homekit_controller'?'Lokaal via HomeKit':z.platform==='tado'?'Tado-cloud':'Integratie nog niet gecontroleerd'}}</p></details>
<div v-if="climateDraft">`);
}
module.exports={homekitClimate,apply};
