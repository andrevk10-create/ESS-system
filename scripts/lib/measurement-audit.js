module.exports=function apply(flows){
    const mapper=flows.find(n=>n.id==='ess00000000000a'),control=flows.find(n=>n.id==='essconfig_control');
    const match=control.func.match(/function validate\(config, discovery\) \{[\s\S]*?^\}/m);
    if(!match)throw Error('Configuration validation source missing');
    mapper.func=mapper.func.replace(/^function configurationLiveStatus\([\s\S]*?^\}\r?\n/gm,'').replace(/\/\/ BEGIN LIVE MEASUREMENT AUDIT[\s\S]*?\/\/ END LIVE MEASUREMENT AUDIT\n/g,'');
    mapper.func=match[0].replace('function validate(config, discovery)','function configurationLiveStatus(states,config,discovery)')+'\n'+mapper.func;
    const anchor="flow.set('ess_dashboard_live', dashboard);";
    mapper.func=mapper.func.replace(anchor,`// BEGIN LIVE MEASUREMENT AUDIT
dashboard.configuration.status=configurationLiveStatus(rawStates,{...essRuntimeConfig,modules:essRuntimeConfig.modules||{},entities:essRuntimeConfig.entities||{}},null);
// END LIVE MEASUREMENT AUDIT
${anchor}`);
    mapper.func=mapper.func.replace("const unit = String((item.attributes || {}).unit_of_measurement || 'kWh').toLowerCase();\n    if (unit === 'wh') return number / 1000;\n    if (unit === 'mwh') return number * 1000;\n    return number;", "const unit = String((item.attributes || {}).unit_of_measurement || '').toLowerCase();\n    if (unit === 'wh') return number / 1000;\n    if (unit === 'mwh') return number * 1000;\n    return unit === 'kwh' ? number : null;");
    mapper.func=mapper.func.replaceAll('directAttributes.cost_day_total_energy_usage\n            ?? directAttributes.totalEnergyUsage\n            ?? directAttributes.total_energy_usage','directAttributes.cost_day_total_energy_usage')
        .replaceAll('attributes.cost_day_total_energy_usage\n            ?? attributes.totalEnergyUsage\n            ?? attributes.total_energy_usage','attributes.cost_day_total_energy_usage');
};
