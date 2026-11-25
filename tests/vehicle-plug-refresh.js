const assert=require('assert'),{vehiclePlugEdge:edge}=require('../scripts/lib/vehicle-plug-refresh');
let p;function tick(s){const r=edge(p,s,'sensor.car_soc',1000);p=r.state;return r.request;}
assert(tick('ready_to_charge'));assert(!tick('charging'));assert(!tick('completed'));assert(!tick('unavailable'));assert(!tick('charging'));assert(!tick('disconnected'));assert(tick('awaiting_start'));
const f=require('../flows.json'),ctx={},flow={get:k=>ctx[k],set:(k,v)=>ctx[k]=v};
const ha={states:{'sensor.left':{state:'ready_to_charge'},'sensor.right':{state:'ready_to_charge'},'sensor.a_soc':{state:'43'},'sensor.jeep_test_hvbattery_charge':{state:'50'}},services:{audiconnect:{refresh_vehicle_data:{}},uconnect:{update:{}}}};
ctx.ess_system_config={entities:{'sensor.ev_charger_status':'sensor.left','sensor.ev_charger_2_status':'sensor.right','sensor.ev_state_of_charge':'sensor.a_soc'}};
const global={get:()=>({homeAssistant:ha})};const run=(id,msg)=>new Function('msg','flow','global',f.find(n=>n.id==='essevrefresh_'+id).func)(msg,flow,global);
const requests=run('edge',{})[0];assert.equal(requests.length,2);assert.equal(run('edge',{}),null,'Do not poll vehicle services repeatedly');
for(const r of requests){r.refreshReply=[{entity_id:r.refreshAnchor,platform:r.refreshCar==='audi'?'audiconnect':'uconnect',device_id:r.refreshCar+'-device'}];const out=run('dispatch',r);assert.equal(out.payload.data.service_data.device_id,r.refreshCar+'-device');assert.equal(out.payload.data.service,r.refreshCar==='audi'?'refresh_vehicle_data':'update');}
ctx.ess_system_config.entities['sensor.ev_state_of_charge']='sensor.rebound';assert.equal(run('dispatch',requests[0]),null,'A configuration change cannot refresh the old car');
ha.states['sensor.right'].state='disconnected';assert.equal(run('dispatch',requests[1]),null,'Do not refresh after unplugging');
console.log('Plug refresh: one request per connection, unknown gaps, correct integration/device and rebind checks passed');
// Explicit refresh also works while unplugged and is rate-limited.
ctx.ess_system_config.entities['sensor.ev_state_of_charge']='sensor.a_soc';ha.states['sensor.left'].state='disconnected';
ctx.ess_audi_plug_refresh.at=Date.now()-31000;
const manual=run('edge',{topic:'ess/vehicle/soc-refresh',payload:'audi'})[0];assert.equal(manual.length,1);assert(manual[0].refreshManual);
manual[0].refreshReply=[{entity_id:'sensor.a_soc',platform:'audiconnect',device_id:'audi-device'}];
assert(run('dispatch',manual[0]),'A manual refresh does not require a charging cable');
assert.equal(run('edge',{topic:'ess/vehicle/soc-refresh',payload:'audi'}),null,'Repeated clicks cannot flood the cloud service');
assert.equal(run('edge',{topic:'ess/vehicle/soc-refresh',payload:'other'}),null);
const template=f.find(n=>n.id==='esstpl_ev0000001').format;
assert.equal((template.match(/class="ess-soc-details"/g)||[]).length,2);
assert(!template.includes('<p class="subtle ess-ev-reason">'),'Hide routine waiting and priority messages from vehicle cards');
assert(!template.includes('Geen actieve opdracht'));
