const assert=require('node:assert/strict');
const {homekitRefreshRequest:request,homekitRefreshResult:result}=require('../scripts/lib/homekit-refresh');
const now=1800000000000,id='climate.living_room';
function fixture(){const v={ess_charging_preferences_ready:true,ess_climate_config:{mode:'auto',tadoHysteresis:true,heatSource:{enabled:true,adapter:'homekit-room',entity:id}},ess_climate_registry:{at:now,entities:{[id]:{platform:'homekit_controller'}}}},g={homeassistant:{homeAssistant:{isConnected:true,states:{[id]:{last_updated:new Date(now-60000).toISOString()}}}}};return {v,g,flow:{get:k=>v[k],set:(k,x)=>v[k]=x},global:{get:k=>g[k],set:(k,x)=>g[k]=x}};}
const f=fixture(),msg=request(f.flow,f.global,now);assert.equal(msg.payload.entity,id);
assert.equal(request(f.flow,f.global,now+30000),null,'Do not queue requests');
msg.actual={entity_id:id,state:'off',attributes:{current_temperature:20.5},last_reported:new Date(now+1000).toISOString()};
assert(result(f.flow,f.global,msg,now+2000));assert.equal(f.g.homeassistant.homeAssistant.states[id],msg.actual);
assert.equal(f.v.ess_homekit_refresh_pending,null);assert.equal(result(f.flow,f.global,msg,now+3000),null,'Ignore late duplicate');
for(const change of [q=>q.v.ess_climate_config.heatSource.adapter='tado-zone',q=>q.g.homeassistant.homeAssistant.isConnected=false,q=>q.v.ess_climate_registry.entities[id].platform='tado',q=>q.v.ess_climate_config.heatSource.enabled=false]){const q=fixture();change(q);assert.equal(request(q.flow,q.global,now),null);}
for(const change of [m=>m.actual.entity_id='climate.other',m=>m.actual.attributes.current_temperature=100,m=>m.actual.state='unavailable']){const q=fixture(),m=request(q.flow,q.global,now);m.actual=JSON.parse(JSON.stringify(msg.actual));change(m);assert.equal(result(q.flow,q.global,m,now+2000),null);assert.equal(q.g.homeassistant.homeAssistant.states[id].last_updated,new Date(now-60000).toISOString());}
const q=fixture(),m=request(q.flow,q.global,now);m.actual=msg.actual;
q.g.homeassistant.homeAssistant.states[id]={last_reported:new Date(now+5000).toISOString(),attributes:{current_temperature:20.4}};
result(q.flow,q.global,m,now+6000);assert.equal(q.g.homeassistant.homeAssistant.states[id].attributes.current_temperature,20.4,'Preserve newer push');
const unchanged=fixture(),same=request(unchanged.flow,unchanged.global,now);
same.actual={entity_id:id,state:'off',attributes:{current_temperature:20.9},last_reported:new Date(now-3600000).toISOString()};
unchanged.g.homeassistant.homeAssistant.states[id]=same.actual;
result(unchanged.flow,unchanged.global,same,now+12000);
assert.equal(unchanged.v.ess_homekit_refresh_status.checkedAt,now+12000,'Track the actual HA check separately');
assert.equal(unchanged.v.ess_homekit_refresh_status.changed,false);
assert.equal(unchanged.g.homeassistant.homeAssistant.states[id].last_reported,same.actual.last_reported,'Never fabricate a new sensor timestamp');
console.log('HomeKit refresh: local binding, one pending request, real temperatures and newer push preservation passed');
