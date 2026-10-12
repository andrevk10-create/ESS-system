// The site uses Easee's Equalizer for EV phase/load balancing. Node-RED owns
// charging intent and schedules; WIT keeps its independent P1 safety limits.
module.exports=function apply(flows) {
    for(const id of ['ess00000000000d','essjeep_ess00000000000d']) {
        const n=flows.find(n=>n.id===id);
        const start=n.func.indexOf('    if (targetCurrent > 0) {\n        const phaseIds = [');
        const end=n.func.indexOf('// BEGIN SECOND EV RESERVATION',start);
        if(start>=0&&end>=0) n.func=n.func.slice(0,start)+'}\n\n'+n.func.slice(end);
        else if(!n.func.includes("loadBalancingOwner:'Easee Equalizer'")) throw Error('EV phase guard anchor missing: '+id);
        n.func=n.func.replace(/\/\/ BEGIN SECOND EV RESERVATION[\s\S]*?\/\/ END SECOND EV RESERVATION\n/g,'');
        if(!n.func.includes('const gridDemand =')) n.func=n.func.replace('const preflightIssues = [];',`const gridDemand = forceFull || deadlineCharge || ultraCheapQuarter || scheduledNow || climatePowerSupportActive;
const preflightIssues = [];`);
        n.func=n.func.replace(/    loadBalancingOwner:'Easee Equalizer',\n/g,'')
            .replace("if (!fresh('sensor.p1_meter_vermogen', 15000) || gridPower === null) preflightIssues.push", "if (!gridDemand && (!fresh('sensor.p1_meter_vermogen', 15000) || gridPower === null)) preflightIssues.push")
            .replace("} else if (!fresh('sensor.p1_meter_vermogen', 15000)) {", "} else if (!gridDemand && !fresh('sensor.p1_meter_vermogen', 15000)) {")
            .replace('} else if (gridPower === null || chargerPowerForControl === null) {','} else if ((!gridDemand && gridPower === null) || chargerPowerForControl === null) {')
            .replace("const directChargeBypassesRamp = controlMode === 'force-full';", "const directChargeBypassesRamp = controlMode !== 'solar';")
            .replace('    safeCurrentLimit,',"    safeCurrentLimit,\n    loadBalancingOwner:'Easee Equalizer',");
    }
};
