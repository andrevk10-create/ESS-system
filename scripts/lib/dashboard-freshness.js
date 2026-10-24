module.exports=function dashboardFreshness(flows){
    const mapper=flows.find(n=>n.id==='ess00000000000a');
    const previous='const updatedAt = gridEntity ? (gridEntity.last_updated || gridEntity.last_changed || null) : null;';
    const clock='const updatedAt = new Date().toISOString(); // Dashboard heartbeat, not a sensor change';
    if(mapper.func.includes(previous))mapper.func=mapper.func.replace(previous,clock);
    else if(!mapper.func.includes(clock))throw Error('Dashboard heartbeat anchor missing');
    mapper.func=mapper.func.replace(/\/\/ BEGIN DASHBOARD SOURCE TIMES[\s\S]*?\/\/ END DASHBOARD SOURCE TIMES\n/g,'');
    const anchor="flow.set('ess_dashboard_live', dashboard);";
    mapper.func=mapper.func.replace(anchor,`// BEGIN DASHBOARD SOURCE TIMES
dashboard.connection={homeAssistant:typeof ha?.homeAssistant?.isConnected==='boolean'?ha.homeAssistant.isConnected:null};
dashboard.sourceTimestamps={p1:gridEntity?.last_reported||gridEntity?.last_updated||gridEntity?.last_changed||null};
// END DASHBOARD SOURCE TIMES
${anchor}`);
};
