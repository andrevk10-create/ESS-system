module.exports=function prepareShellyHeatPump(flows){
    const get=id=>flows.find(n=>n.id===id);
    const plan=get('essclim_hyst_plan'),anchor="flow.set('ess_heat_source_status',decision.sourceStatus);";
    if(!plan.func.includes(anchor))throw Error('Shelly warmtevraag-aansluiting ontbreekt');
    plan.func=plan.func.replace(anchor,`${anchor}
const preview=shellyHeatPreview(config.shelly,states,{at:now,
 valid:system.modules?.climate===true&&config.mode==='auto'&&decision.status.length>0&&decision.status.every(s=>s.valid)&&!decision.sourceStatus.fault,
 on:decision.sourceStatus.requested===true},flow.get('ess_shelly_heat_preview')?.memory,now);
flow.set('ess_shelly_heat_preview',preview);`);
    // No new service nodes, action outputs or contact writes: commissioning
    // can be prepared without taking over the working HomeKit/Tado control.
    const mapper=get('ess00000000000a');
    mapper.func=mapper.func.replace("dashboard.climate.preferences=", "dashboard.climate.shelly=flow.get('ess_shelly_heat_preview')||{mode:'off',readOnly:true,reason:'Shelly-voorbereiding staat uit'};\ndashboard.climate.preferences=");
    const ui=get('esstpl_climate01');
    if(!ui)throw Error('Klimaatdashboard ontbreekt');
    ui.format=ui.format.replace('heatSource:{...defaults.heatSource,...saved.heatSource}',
        'heatSource:{...defaults.heatSource,...saved.heatSource},shelly:{...defaults.shelly,...saved.shelly,blu:{...defaults.shelly.blu,...saved.shelly?.blu},display:{...defaults.shelly.display,...saved.shelly?.display}}');
    const fields=`<h3>Shelly · voorbereiding warmtepomp</h3>
<p>Alleen uitlezen en schaduwadvies. De twee contacten worden hier nog niet bediend; de bestaande warmteregeling blijft actief.</p>
<div class="config-grid"><label class="config-field"><span>VOORBEREIDING</span><select v-model="climateDraft.shelly.mode"><option value="off">Uit</option><option value="shadow">Schaduwmodus · geen contactbediening</option></select></label>
<label class="config-field"><span>RADIATORPOMP · SWITCH-ENTITEIT</span><input v-model="climateDraft.shelly.pumpEntity" placeholder="switch.radiatorpomp"></label>
<label class="config-field"><span>WARMTEVRAAG · SWITCH-ENTITEIT</span><input v-model="climateDraft.shelly.demandEntity" placeholder="switch.warmtevraag"></label>
<label class="config-field"><span>POMPVOORLOOP · VOORLOPIG (s)</span><input type="number" min="10" max="300" v-model.number="climateDraft.shelly.pumpLeadSeconds"></label>
<label class="config-field"><span>POMPNALOOP · VOORLOPIG (s)</span><input type="number" min="30" max="900" v-model.number="climateDraft.shelly.pumpRunOnSeconds"></label></div>
<div class="config-grid" v-for="(entity,i) in climateDraft.shelly.temperatureEntities" :key="'shelly-probe-'+i"><label class="config-field"><span>TEMPERATUUR KANAAL {{i+1}} · SENSOR</span><input v-model="climateDraft.shelly.temperatureEntities[i]" placeholder="sensor.temperatuur"></label>
<label class="config-field"><span>MEETLOCATIE KANAAL {{i+1}}</span><input maxlength="60" v-model="climateDraft.shelly.temperatureLocations[i]" placeholder="Na controle invullen"></label></div>
<div v-for="group in ['blu','display']" :key="group"><h4>{{group==='blu'?'Shelly BLU':'Shelly H&T / display'}}</h4><p>Metingen voor inzicht. Dit maakt geen thermostaatdoel en schrijft niets naar het display.</p><div class="config-grid"><label class="config-field" v-for="key in ['temperature','humidity','battery']" :key="key"><span>{{({temperature:'TEMPERATUUR',humidity:'LUCHTVOCHTIGHEID',battery:'BATTERIJ'})[key]}} · SENSOR</span><input v-model="climateDraft.shelly[group][key]" placeholder="sensor.kies_entiteit"></label></div></div>
<div class="config-grid"><label class="config-field"><span>MAXIMALE LEEFTIJD WATERMETING (min)</span><input type="number" min="1" max="60" v-model.number="climateDraft.shelly.probeMaxAgeMinutes"></label>
<label class="config-field"><span>MAXIMALE LEEFTIJD BLU / DISPLAY (min)</span><input type="number" min="5" max="360" v-model.number="climateDraft.shelly.roomMaxAgeMinutes"></label></div>
<p>Voor echte bediening moeten modellen, aansluitingen, minimale doorstroming, apparaattimers en meetlocaties eerst worden vastgesteld. Een terugmelding van een relais bewijst geen waterstroming.</p>`;
    if(!ui.format.includes('<h3>Warm water</h3>'))throw Error('Shelly configuratie-invoegpunt ontbreekt');
    ui.format=ui.format.replace('<h3>Warm water</h3>',fields+'<h3>Warm water</h3>');
    const status=`<article class="panel span-12"><div class="panel-head"><b>Shelly · warmtepomp voorbereiden</b><span>Alleen uitlezen</span></div>
<p>{{d.climate?.shelly?.reason||'Voorbereiding nog niet ingesteld'}}. Vul de koppelingen in via Klimaatinstellingen.</p>
<div class="plan-grid" v-if="d.climate?.shelly?.probes"><div class="plan-card" v-for="p in d.climate.shelly.probes" :key="p.channel"><span>TEMPERATUUR {{p.channel}} · {{p.location}}</span><b>{{temperature(p.value)}}</b><small>{{p.reason}}</small></div></div>
<p v-if="d.climate?.shelly?.mode==='shadow'">Schaduwadvies: radiatorpomp {{d.climate.shelly.pumpIntent?'aan':'uit'}} · warmtevraag {{d.climate.shelly.heatIntent?'aan':'uit'}}. Er worden geen opdrachten verstuurd.</p>
<div class="plan-grid" v-if="d.climate?.shelly?.blu"><div class="plan-card" v-for="group in ['blu','display']" :key="group"><span>{{group==='blu'?'SHELLY BLU':'H&T / DISPLAY'}}</span><b>{{temperature(d.climate.shelly[group].temperature.value)}}</b><small>{{humidity(d.climate.shelly[group].humidity.value)}} · batterij {{d.climate.shelly[group].battery.value===null?'—':d.climate.shelly[group].battery.value+'%'}}</small><small>{{d.climate.shelly[group].temperature.reason}}</small></div></div></article>`;
    ui.format=ui.format.replace('</section>',status+'</section>');
};
