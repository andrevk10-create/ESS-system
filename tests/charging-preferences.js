const assert = require('node:assert/strict');
const flows = require('../flows.json');
const {chargingPreferences} = require('../scripts/lib/charging-preferences');
const get = id => flows.find(n => n.id === id);
const fixture = () => {
    const values = {}, errors = [];
    const flow = {get:key=>values[key],set:(key,value)=>values[key]=value};
    const node = {status(){},warn(){},error:e=>errors.push(e)};
    const run = (id,msg={}) => new Function('flow','node','msg',get(id).func)(flow,node,msg);
    const init = id => new Function('flow',get(id).initialize)(flow);
    return {values,flow,errors,run,init};
};
let f = fixture();
f.values.ess_audi_settings = {departureSoc:95,solarSoc:90,departureTime:'09:35'};
f.values.ess_audi_smart_enabled = false;
f.values.ess_wit_grid_charge_mode = 'off';
f.values.ess_wit_grid_charge_target_soc = 95;
f.values.ess_wit_audi_buffer_mode = 'eco';
f.values.ess_wit_export_mode = 'off';
f.values.ess_charging_preferences_ready = true;
f.values.ess_audi_force_full = true;
f.values.ess_wit_command_fault = {attempts:2};
const saved = f.run('essprefs_save').payload;
assert(!saved.includes('sessionOwned') && !saved.includes('force_full') && !saved.includes('command_fault'));
const expected = chargingPreferences(f.flow);
// All setting initializers must preserve in-memory choices on redeploy.
for (const n of flows.filter(n => /ess_wit_grid_charge_mode|ess_wit_export_mode|ess_wit_audi_buffer_mode|ess_audi_smart_enabled/.test(n.initialize || ''))) {
    f.init(n.id);
}
assert.deepEqual(chargingPreferences(f.flow), expected);
// HA reconnect must preserve values and sync the stored departure time.
let output = f.run('essaudi_defaults1',{payload:'running'});
assert.equal(output[1].payload.time,'09:35:00');
assert.deepEqual(chargingPreferences(f.flow),expected);
assert.equal(f.values.ess_audi_force_full,false);

// Cold Node-RED restart: restore from disk before any controls may run.
f = fixture();
f.init('essprefs_restore');
assert.equal(f.run('essaudi_defaults1',{payload:'running'}),null);
for (const id of ['esswitgrid_ctrl1','esswitaudi_ctrl1','esswitexport_ctrl','ess00000000000d']) {
    assert.equal(f.run(id),null,'No actuator commands while loading preferences');
}
output = f.run('essprefs_restore',{payload:saved});
assert.equal(f.values.ess_charging_preferences_ready,true);
assert.deepEqual(chargingPreferences(f.flow),expected);
f.run('essaudi_defaults1',output[0]);
assert.deepEqual(chargingPreferences(f.flow),expected);
assert.equal(f.values.ess_audi_force_full,false);
assert(!f.values.ess_wit_grid_charge_status?.sessionOwned,'Never restore ownership/lease');
// A delayed second restore must not overwrite a user's newer edit.
f.values.ess_audi_settings.departureSoc = 70;
assert.equal(f.run('essprefs_restore',{payload:saved}),null);
assert.equal(f.values.ess_audi_settings.departureSoc,70);

// First installation migrates existing settings and otherwise uses defaults.
f = fixture(); f.init('essprefs_restore');
f.values.ess_audi_settings = {departureSoc:75,solarSoc:85,departureTime:'08:10'};
assert(f.run('essprefs_restore',{error:{message:'ENOENT',source:{id:'essprefs_read'}}})[1]);
output = f.run('essprefs_restore',{error:{message:'ENOENT',source:{id:'essprefs_backup_read'}}});
f.run('essaudi_defaults1',output[0]);
assert.equal(f.values.ess_audi_settings.departureSoc,75);
assert.equal(chargingPreferences(f.flow).wit.targetSoc,80);

// Corrupt main file uses backup; unreadable files never silently become defaults.
f = fixture(); f.init('essprefs_restore');
assert(f.run('essprefs_restore',{payload:'{ broken'})[1]);
assert.equal(f.values.ess_charging_preferences_ready,false);
f.run('essprefs_restore',{filename:get('essprefs_backup_read').filename,payload:saved});
assert.deepEqual(chargingPreferences(f.flow),expected);
f = fixture(); f.init('essprefs_restore');
f.run('essprefs_restore',{payload:'{ broken'});
assert.equal(f.run('essprefs_restore',{error:{message:'ENOENT',source:{id:'essprefs_backup_read'}}}),null);
assert.equal(f.values.ess_charging_preferences_ready,false);
assert(f.values.ess_charging_preferences_error);
assert.equal(f.run('essprefs_save'),null,'Do not overwrite broken files with defaults');

f = fixture(); f.init('essprefs_restore');
const invalid = JSON.parse(saved); invalid.wit.targetSoc = 999;
assert(f.run('essprefs_restore',{payload:JSON.stringify(invalid)})[1]);
assert.equal(f.values.ess_wit_grid_charge_target_soc,undefined,'Validate before applying any fields');
f.run('essprefs_warn'); assert(f.values.ess_charging_preferences_error);
f.run('essprefs_saved'); assert.equal(f.values.ess_charging_preferences_error,null);
for (const id of ['essprefs_write','essprefs_backup_write','essprefs_read','essprefs_backup_read']) {
    assert(get(id).filename.startsWith('/config/node-red/ess-charging-preferences'));
}
assert.deepEqual(get('essprefs_write').wires,[['essprefs_backup_write']]);
console.log('Charging preferences: HA reconnect, cold restart, migration, backup, validation and write errors OK');
