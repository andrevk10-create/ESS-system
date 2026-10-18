// Power-derived compressor activity, never a physical compressor feedback signal.
function heatPumpSettings(v={}) {
    const number=(key,fallback,min,max)=>typeof v[key]==='number'&&Number.isFinite(v[key])&&v[key]>=min&&v[key]<=max?v[key]:fallback;
    const offW=number('offW',150,0,2000),onW=Math.max(offW+50,number('onW',300,50,5000));
    return {offW,onW,highW:Math.max(onW+100,number('highW',3000,500,15000))};
}
function heatPumpHistoryValid(v) {
    const valid=r=>r&&['seconds','highSeconds','kwh','runningKwh','unknownSeconds','starts','stops'].every(k=>Number.isFinite(r[k])&&r[k]>=0);
    return v?.version===1&&Number.isFinite(v.since)&&valid(v.total)&&v.days&&Object.keys(v.days).length<=400&&Object.values(v.days).every(valid)?v:null;
}
function heatPumpHistoryStep(previous,sample,now,options) {
    if(previous!=null&&!heatPumpHistoryValid(previous))throw Error('Warmtepompregistratie ongeldig; bewaard voor herstel');
    const zero=()=>({seconds:0,highSeconds:0,kwh:0,runningKwh:0,unknownSeconds:0,starts:0,stops:0});
    const v=previous||{version:1,since:now,total:zero(),days:{},last:null,running:null,pending:null};
    const settings=heatPumpSettings(options);
    const day=at=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at));
    const add=(from,to,values)=>{for(let t=from;t<to;){const end=Math.min(to,(Math.floor(t/60000)+1)*60000),fraction=(end-t)/(to-from),date=day(t);v.days[date]??=zero();for(const [key,value]of Object.entries(values)){v.days[date][key]+=value*fraction;v.total[key]+=value*fraction;}t=end;}};
    const fresh=sample&&typeof sample.w==='number'&&Number.isFinite(sample.w)&&sample.w>=0&&sample.w<=50000&&Number.isFinite(sample.at)&&sample.at<=now&&now-sample.at<=120000&&sample.binding;
    if(!fresh){
        if(v.last&&now>v.last.accountedUntil){add(v.last.accountedUntil,now,{unknownSeconds:(now-v.last.accountedUntil)/1000});v.last.accountedUntil=now;}
        v.running=null;v.pending=null;v.status='Geen actuele vermogensmeting';return v;
    }
    const last=v.last;
    if(last&&sample.at<=last.at&&sample.binding===last.binding){v.status=v.running===null?'Compressorstatus bepalen':v.running?'Compressor vermoedelijk actief':'Compressor vermoedelijk uit';return v;}
    const continuous=last&&last.binding===sample.binding&&sample.at>last.at&&sample.at-last.at<=120000&&last.accountedUntil<=sample.at;
    if(!continuous){
        if(last&&sample.at>last.accountedUntil)add(last.accountedUntil,sample.at,{unknownSeconds:(sample.at-last.accountedUntil)/1000});
        v.running=null;v.pending=null;
    }
    const desired=sample.w>=settings.onW?true:sample.w<=settings.offW?false:v.running;
    if(desired!==null&&desired!==v.running){
        if(v.pending?.value!==desired)v.pending={value:desired,at:sample.at};
        else if(sample.at-v.pending.at>=30000){
            // Reconnection into an already running compressor is not a new start.
            if(v.running!==null){const counter=desired?'starts':'stops';v.days[day(sample.at)]??=zero();v.days[day(sample.at)][counter]++;v.total[counter]++;}
            v.running=desired;v.pending=null;
        }
    }else v.pending=null;
    if(continuous){
        const seconds=(sample.at-last.accountedUntil)/1000,kwh=(last.w+sample.w)/2*seconds/3600000;
        const running=last.running===true&&v.running===true;
        add(last.accountedUntil,sample.at,{kwh,seconds:running?seconds:0,runningKwh:running?kwh:0,highSeconds:running&&last.w>=settings.highW&&sample.w>=settings.highW?seconds:0,unknownSeconds:last.running===null||v.running===null?seconds:0});
    }
    v.last={...sample,running:v.running,accountedUntil:sample.at};
    v.status=v.running===null?'Compressorstatus bepalen':v.running?(sample.w>=settings.highW?'Hoog vermogen · mogelijk warm water':'Compressor vermoedelijk actief'):'Compressor vermoedelijk uit';
    for(const key of Object.keys(v.days).sort().slice(0,-400))delete v.days[key];
    return v;
}
module.exports=function apply(flows){
    const get=id=>flows.find(n=>n.id===id),mapper=get('ess00000000000a');
    const helpers='// BEGIN HEAT PUMP HELPERS\n'+[heatPumpSettings,heatPumpHistoryValid,heatPumpHistoryStep].map(f=>f.toString()).join('\n')+'\n// END HEAT PUMP HELPERS\n';
    mapper.func=helpers+mapper.func;
    mapper.func=mapper.func.replace("flow.set('ess_dashboard_live', dashboard);",`// BEGIN HEAT PUMP HISTORY
if(flow.get('ess_charging_preferences_ready')===true){
const role='sensor.flex_load_4_power',binding=flow.get('ess_system_config')?.entities?.[role],item=global.get('homeassistant')?.homeAssistant?.states?.[binding];
const unit=String(item?.attributes?.unit_of_measurement||'').toLowerCase(),at=Date.parse(item?.last_reported||item?.last_updated||item?.last_changed);
const w=item&&!['','unknown','unavailable'].includes(String(item.state).toLowerCase())&&['w','kw'].includes(unit)&&Number.isFinite(Number(item.state))?Number(item.state)*(unit==='kw'?1000:1):null;
try{
const history=heatPumpHistoryStep(flow.get('ess_heat_pump_history'),{w,at,binding},Date.now(),flow.get('ess_heat_pump_settings'));
flow.set('ess_heat_pump_history',history);
const date=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
dashboard.heatPumpHistory={status:history.status,running:history.running,powerW:w,today:history.days[date]||null,total:history.total,since:history.since,settings:heatPumpSettings(flow.get('ess_heat_pump_settings')),days:Object.entries(history.days).sort(([a],[b])=>b.localeCompare(a)).slice(0,14).map(([date,row])=>({date,...row}))};
}catch(e){dashboard.heatPumpHistory={status:e.message};}
}
// END HEAT PUMP HISTORY
flow.set('ess_dashboard_live', dashboard);`);
    for(const id of ['essprefs_save','essprefs_restore']){
        const n=get(id);n.func=helpers+'\n'+n.func;
        if(id==='essprefs_save')n.func=n.func.replace('    return result;',"    const hp=heatPumpHistoryValid(flow.get('ess_heat_pump_history'));if(hp)result.heatPumpHistory={...hp,last:null,running:null,pending:null};\n    result.heatPumpSettings=heatPumpSettings(flow.get('ess_heat_pump_settings'));\n    return result;");
        else n.func=n.func.replace('    for (const [key,value] of Object.entries(candidate))',"    const hp=heatPumpHistoryValid(saved.heatPumpHistory);if(hp&&!flow.get('ess_heat_pump_history'))flow.set('ess_heat_pump_history',{...hp,last:null,running:null,pending:null});\n    if(saved.heatPumpSettings)flow.set('ess_heat_pump_settings',heatPumpSettings(saved.heatPumpSettings));\n    for (const [key,value] of Object.entries(candidate))");
    }
    const ui=get('esstpl_climate01');
    const tile=`<article class="panel span-12" aria-label="Compressorregistratie"><div class="panel-head"><b>Warmtepomp · compressorregistratie</b><span>{{d.heatPumpHistory?.status||'Nog geen metingen'}}</span></div><div class="metric-grid"><div class="metric"><span>LOOPTIJD VANDAAG · GESCHAT</span><b>{{((d.heatPumpHistory?.today?.seconds||0)/3600).toLocaleString('nl-NL',{maximumFractionDigits:2})}} uur</b></div><div class="metric"><span>VERBRUIK VANDAAG</span><b>{{energy(d.heatPumpHistory?.today?.kwh)}}</b></div><div class="metric"><span>STARTS / STOPS VANDAAG · GEDETECTEERD</span><b>{{d.heatPumpHistory?.today?.starts??0}} / {{d.heatPumpHistory?.today?.stops??0}}</b></div><div class="metric"><span>HOOG VERMOGEN VANDAAG</span><b>{{((d.heatPumpHistory?.today?.highSeconds||0)/3600).toLocaleString('nl-NL',{maximumFractionDigits:2})}} uur</b></div></div><details class="ess-slot-list"><summary>Historie en meetgrenzen</summary><p>Looptijd is afgeleid uit elektrisch vermogen. Hoog vermogen kan warm water zijn, maar ook verwarming of ontdooien. Elektrische bijverwarming is volgens jouw instelling uitgeschakeld. Verbruik omvat ook het stand-byverbruik. Meetgaten worden niet als looptijd ingevuld.</p><p>Totaal: {{((d.heatPumpHistory?.total?.seconds||0)/3600).toLocaleString('nl-NL',{maximumFractionDigits:2})}} uur · {{energy(d.heatPumpHistory?.total?.kwh)}} · {{d.heatPumpHistory?.total?.starts??0}} starts · {{d.heatPumpHistory?.total?.stops??0}} stops. Onbekende meettijd: {{((d.heatPumpHistory?.total?.unknownSeconds||0)/3600).toLocaleString('nl-NL',{maximumFractionDigits:2})}} uur.</p><div class="control-row"><label v-for="field in [{key:'onW',label:'Compressor aan vanaf W'},{key:'offW',label:'Compressor uit onder W'},{key:'highW',label:'Hoog vermogen vanaf W'}]" :key="field.key">{{field.label}} <input type="number" min="0" max="15000" step="50" :value="d.heatPumpHistory?.settings?.[field.key]" @change="send({topic:'ess/heat-pump/settings',payload:{...d.heatPumpHistory.settings,[field.key]:Number($event.target.value)}})"></label></div><table><thead><tr><th>Dag</th><th>Looptijd</th><th>Hoog vermogen</th><th>Verbruik</th><th>Starts / stops</th></tr></thead><tbody><tr v-for="row in d.heatPumpHistory?.days||[]" :key="row.date"><td>{{row.date}}</td><td>{{(row.seconds/3600).toFixed(2)}} uur</td><td>{{(row.highSeconds/3600).toFixed(2)}} uur</td><td>{{energy(row.kwh)}}</td><td>{{row.starts}} / {{row.stops}}</td></tr></tbody></table></details></article>`;
    ui.format=ui.format.replace(/<article class="panel span-12"[^>]*><div class="panel-head"><b>Warmtepomp<\/b>/,match=>tile+match);
    if(!ui.format.includes('aria-label="Compressorregistratie"'))throw Error('Warmtepomp-paneel ontbreekt');
    flows.push({id:'esshp_settings',type:'function',z:mapper.z,g:'esseditor_climate',name:'Meetgrenzen compressor instellen',func:heatPumpSettings.toString()+"\nif(msg.topic!=='ess/heat-pump/settings'||!msg.payload||typeof msg.payload!=='object')return null;flow.set('ess_heat_pump_settings',heatPumpSettings(msg.payload));return {payload:Date.now()};",outputs:1,wires:[['essprefs_save','ess00000000000a']]});
    ui.wires[0].push('esshp_settings');
};
module.exports.heatPumpHistoryStep=heatPumpHistoryStep;
module.exports.heatPumpSettings=heatPumpSettings;
module.exports.unapply=function(flows){
    for(const n of flows){
        if(n.func)n.func=n.func.replace(/\/\/ BEGIN HEAT PUMP HELPERS[\s\S]*?\/\/ END HEAT PUMP HELPERS\n/g,'').replace(/\/\/ BEGIN HEAT PUMP HISTORY[\s\S]*?\/\/ END HEAT PUMP HISTORY\n/g,'');
        if(n.wires)n.wires=n.wires.map(w=>w.filter(id=>id!=='esshp_settings'));
    }
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id==='esshp_settings')flows.splice(i,1);
};
