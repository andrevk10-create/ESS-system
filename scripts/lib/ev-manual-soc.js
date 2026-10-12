function manualCarSoc(manual,anchor,actual,reportedAt,now) {
    if(!manual||manual.anchor!==anchor||!Number.isFinite(manual.soc)||manual.soc<0||manual.soc>100||!Number.isFinite(manual.at)||manual.at>now)return {soc:null,clear:!!manual};
    if(actual!==null&&Number.isFinite(actual)&&actual>=0&&actual<=100&&Number.isFinite(reportedAt)&&reportedAt>manual.at&&reportedAt<=now)return {soc:null,clear:true};
    return {soc:manual.soc,clear:false};
}
module.exports=function apply(flows){
    for(const n of flows.filter(n=>n.func))n.func=n.func.replace(/\/\/ BEGIN EXPLICIT SOC[\s\S]*?\/\/ END EXPLICIT SOC\n/g,'');
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('essmanualsoc_'))flows.splice(i,1);
    const helper='// BEGIN EXPLICIT SOC\n'+manualCarSoc.toString()+`
function explicitCarSoc(car){
const config=flow.get('ess_system_config')||{},states=global.get('homeassistant')?.homeAssistant?.states||{};
let anchor=config.entities?.[car==='audi'?'sensor.ev_state_of_charge':'sensor.ev_2_state_of_charge'];
if(car==='jeep'&&(!anchor||anchor==='sensor.ev_2_state_of_charge')){const ids=Object.keys(states).filter(id=>/^sensor\\..*jeep.*_hvbattery_charge$/.test(id));anchor=ids.length===1?ids[0]:null;}
const e=states[anchor],value=e&&!['unknown','unavailable',''].includes(e.state)?Number(e.state):null;
const stamp=car==='jeep'?Date.parse(states[anchor?.replace('_hvbattery_charge','_last_info_update_at')]?.state):Date.parse(e?.last_reported||e?.last_updated);
const key='ess_'+car+'_explicit_soc',result=manualCarSoc(flow.get(key),anchor,value,stamp,Date.now());
if(result.clear){flow.set(key,null);flow.set('ess_'+car+'_soc_estimator',null);flow.set('ess_manual_soc_dirty',true);}
return {soc:result.soc,anchor};
}
// END EXPLICIT SOC
`;
    const audi=flows.find(n=>n.id==='ess00000000000d');audi.func=helper+audi.func;
    audi.func=audi.func.replace("const reportedEVSoc = value('sensor.ev_state_of_charge');","const explicitSoc=explicitCarSoc('audi');\nconst reportedEVSoc=explicitSoc.soc??value('sensor.ev_state_of_charge');");
    // Prefer the explicitly entered value only until a newer vehicle report.
    for(const n of flows.filter(n=>n.func&&n.func.includes('function currentJeepSoc()'))){
        n.func=helper+n.func;
        n.func=n.func.replace('function currentJeepSoc(){','function currentJeepSoc(){const explicit=explicitCarSoc(\'jeep\');if(explicit.soc!==null)return {soc:explicit.soc,at:Date.now(),reportedAt:flow.get(\'ess_jeep_explicit_soc\').at,source:\'manual\',anchor:explicit.anchor};');
    }
    const mapper=flows.find(n=>n.id==='ess00000000000a');
    mapper.func=mapper.func.replace(/dashboard\.manualSoc=\{[^\n]*\};\n/g,'');
    mapper.func=mapper.func.replace("flow.set('ess_dashboard_live', dashboard);",`dashboard.manualSoc={audi:flow.get('ess_audi_explicit_soc')||null,jeep:flow.get('ess_jeep_explicit_soc')||null};\nflow.set('ess_dashboard_live', dashboard);`);
    const ui=flows.find(n=>n.id==='esstpl_ev0000001');ui.wires[0].push('essmanualsoc_set');
    for(const [label,car]of [['Audi','audi'],['Jeep Avenger','jeep']]){
        const panel=`<details class="ess-slot-list"><summary>Handmatige noodstand accustand</summary><label class="setting"><span>ALLEEN NA ZELF INVULLEN</span><select aria-label="${label} handmatige accustand" :value="d.manualSoc?.${car}?.soc??''" @change="send({topic:'ess/${car}/explicit-soc',payload:$event.target.value})"><option value="" disabled>Geen handmatige stand</option><option v-for="n in 101" :key="n" :value="n-1">{{n-1}}%</option></select></label><p>{{d.manualSoc?.${car}?'Handmatige stand actief · vervalt bij nieuwe autometing':'Alleen de autometing wordt gebruikt'}}</p><button class="touch-button" v-if="d.manualSoc?.${car}" @click="send({topic:'ess/${car}/explicit-soc',payload:null})">Handmatige stand wissen</button></details>`;
        const re=new RegExp('(<article[^>]*aria-label="'+label+' laadregeling"[\\s\\S]*?)(</article>)');ui.format=ui.format.replace(re,(_,body,end)=>body+panel+end);
    }
    const z='ess000000000001';
    flows.push({id:'essmanualsoc_set',type:'function',z,name:'Stel expliciete noodstand voor auto in',outputs:1,wires:[['essprefs_save','ess00000000000a','ess00000000000d','essjeep_ess00000000000d']],func:helper+`
const match=/^ess\\/(audi|jeep)\\/explicit-soc$/.exec(String(msg.topic));if(!match)return null;
const car=match[1],key='ess_'+car+'_explicit_soc';
if(msg.payload===null){flow.set(key,null);return {payload:Date.now()};}
if(msg.payload===''||typeof msg.payload==='boolean'||!Number.isFinite(Number(msg.payload))||Number(msg.payload)<0||Number(msg.payload)>100)return null;
const binding=explicitCarSoc(car);if(!binding.anchor)return null;
flow.set(key,{soc:Number(msg.payload),at:Date.now(),anchor:binding.anchor});
flow.set('ess_'+car+'_soc_estimator',null);return {payload:Date.now()};`});
    flows.push({id:'essmanualsoc_tick',type:'inject',z,name:'Bewaar automatisch vervallen noodstand',props:[],repeat:'60',once:false,wires:[['essmanualsoc_save']]});
    flows.push({id:'essmanualsoc_save',type:'function',z,name:'Bewaar wijziging noodstand',outputs:1,wires:[['essprefs_save']],func:`if(!flow.get('ess_manual_soc_dirty')||flow.get('ess_charging_preferences_ready')===false)return null;flow.set('ess_manual_soc_dirty',false);return {payload:Date.now()};`});
};
module.exports.manualCarSoc=manualCarSoc;
module.exports.unapply=function(flows){
for(const n of flows.filter(n=>n.func))n.func=n.func.replace(/\/\/ BEGIN EXPLICIT SOC[\s\S]*?\/\/ END EXPLICIT SOC\n/g,'');
const audi=flows.find(n=>n.id==='ess00000000000d');
if(audi)audi.func=audi.func.replace("const explicitSoc=explicitCarSoc('audi');\nconst reportedEVSoc=explicitSoc.soc??value('sensor.ev_state_of_charge');","const reportedEVSoc = value('sensor.ev_state_of_charge');");
};
