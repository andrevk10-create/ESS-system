function witChargeSoc(flow, states, config, now) {
    const role='sensor.growatt_battery_battery_soc', powerRole='sensor.growatt_battery_battery_power';
    const binding=JSON.stringify([config?.entities?.[role]||role,config?.entities?.[powerRole]||powerRole]);
    const item=states?.[role], power=states?.[powerRole];
    const fresh=entity=>{const age=now-new Date(entity?.last_reported||entity?.last_updated||entity?.last_changed||0).getTime();return age>=0&&age<=120000;};
    const numeric=entity=>entity && !['','unknown','unavailable'].includes(String(entity.state).toLowerCase()) && Number.isFinite(Number(entity.state));
    if(numeric(item)) {
        const soc=Number(item.state);
        if(soc<0||soc>100){flow.set('ess_wit_last_valid_soc',null);return {soc:null,cached:false};}
        if(fresh(item)||(numeric(power)&&fresh(power)))flow.set('ess_wit_last_valid_soc',{soc,at:now,binding});
        return {soc,cached:false};
    }
    const cached=flow.get('ess_wit_last_valid_soc');
    // Bounded reconnect grace, only with live battery telemetry on the same
    // mapped battery. Never use the grace near full or after a prolonged gap.
    if(cached?.binding===binding&&cached.soc>=0&&cached.soc<99&&now-cached.at>=0&&now-cached.at<=30000&&numeric(power)&&fresh(power))
        return {soc:cached.soc,cached:true};
    flow.set('ess_wit_soc_gap', {at:now,state:item?.state??null,powerState:power?.state??null,powerAt:power?.last_reported||power?.last_updated||null,cacheAt:cached?.at??null,bindingMatches:cached?.binding===binding});
    return {soc:null,cached:false};
}
module.exports=function applySoc(flows){
    const grid=flows.find(n=>n.id==='esswitgrid_ctrl1');
    grid.func=witChargeSoc.toString()+'\n'+grid.func.replace("const soc = value('sensor.growatt_battery_battery_soc');", "const socReading = witChargeSoc(flow, states, flow.get('ess_system_config'), now);\nconst soc = socReading.soc;");
    grid.func=grid.func.replace('    planningGoal:', '    socTemporarilyCached:socReading.cached,\n    planningGoal:');
};
module.exports.witChargeSoc=witChargeSoc;
