const assert=require('node:assert/strict'),fs=require('fs');const {configurationAudit}=require('../scripts/lib/configuration-audit');
const result=configurationAudit({'sensor.good':{state:'0',attributes:{unit_of_measurement:'W'}},'sensor.bad':{state:'unavailable'}},{'sensor.role1':'sensor.good','sensor.role2':'sensor.bad','sensor.optional':''});assert.deepEqual(result.map(r=>r.status),['Beschikbaar','Geen bruikbare waarde','Niet gekoppeld']);
const flows=require('../flows.json'),control=flows.find(n=>n.id==='essconfig_control');assert(control.func.includes('pv-daily-sibling'));assert(control.func.includes('wasplein'));assert(control.func.includes('jaccuzi'));
console.log('All-role configuration audit and discovery coverage passed');

assert(flows.find(n=>n.id==='esstpl_config001').format.includes('Controle van alle koppelingen'));
const values=[1,30044,1,61904,531,65535,65300,87,94,0,5666,0,5083,200,220,1,6,512,0];
const cache=new Map([['ess_wit_readback_pending',1]]),context={get:k=>cache.get(k),set:(k,v)=>cache.set(k,v)};
const save=new Function('msg','flow',flows.find(n=>n.id==='esswit_limits_save').func);
save({witReadId:1,witBinding:{remoteEntity:'select.test'},witLimits:{success:true,values},witReply:{success:true,values:[1500,1500]},witRemote:{}},context);
assert.equal(cache.get('ess_wit_battery_limits').chargePowerW,9558,'Unused 0xffff does not hide valid limits');
assert.equal(cache.get('ess_wit_battery_limits').chargeCurrentA,150);
values[0]=65535;values[1]=65535;
save({witReadId:1,witBinding:{remoteEntity:'select.test'},witLimits:{success:true,values},witReply:{success:true,values:[1500,1500]},witRemote:{}},context);
assert.equal(cache.get('ess_wit_battery_limits'),null,'Invalid power still rejected');

const {consumerMeterInventory}=require('../scripts/lib/configuration-audit');
const meter=(name,value='2',unit='kW')=>({state:value,attributes:{friendly_name:name,unit_of_measurement:unit,device_class:'power'}});
const inventory=consumerMeterInventory({'sensor.socket':meter('Extra socket'),'sensor.pv':meter('PV output'),'sensor.phase':meter('Socket fase 1'),'sensor.import':meter('Import vermogen'),'sensor.configured':meter('Configured load'),'sensor.offline':meter('Unconfigured socket','unavailable')},{'sensor.flex_load_2_power':'sensor.configured'});
assert.deepEqual(inventory.map(m=>m.entity),['sensor.socket','sensor.offline']);assert.equal(inventory[0].power,2000);assert.equal(inventory[1].power,null);
