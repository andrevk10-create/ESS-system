function providerYearBalance(snapshot,ledger,now) {
    if(!snapshot||!ledger||snapshot.year!==Number(new Intl.DateTimeFormat('en',{timeZone:'Europe/Amsterdam',year:'numeric'}).format(new Date(now))))return null;
    const fields=['importKwh','importEuros','exportKwh','exportEuros','netEuros'];
    if(!fields.every(k=>typeof snapshot[k]==='number'&&Number.isFinite(snapshot[k]))||snapshot.importKwh<0||snapshot.exportKwh<0)return null;
    const anchor=snapshot.anchor;
    if(!anchor||!['gridKwh','gridCost','exportKwh','exportRevenue'].every(k=>Number.isFinite(anchor[k]))||snapshot.ledgerStartedAt!==ledger.startedAt)return null;
    const t=ledger.total;
    return {year:snapshot.year,at:snapshot.at,importKwh:snapshot.importKwh+t.gridKwh-anchor.gridKwh,
        importEuros:snapshot.importEuros+t.gridCost-anchor.gridCost,exportKwh:snapshot.exportKwh+t.exportKwh-anchor.exportKwh,
        exportEuros:snapshot.exportEuros+t.exportRevenue-anchor.exportRevenue,
        netEuros:snapshot.netEuros+t.gridCost-anchor.gridCost-(t.exportRevenue-anchor.exportRevenue)};
}
module.exports=function apply(flows){
    for(let i=flows.length-1;i>=0;i--)if(flows[i].id.startsWith('essprovider_year_'))flows.splice(i,1);
    const get=id=>flows.find(n=>n.id===id),mapper=get('ess00000000000a'),ui=get('ess000000000004');
    mapper.func=providerYearBalance.toString()+'\n'+mapper.func.replace(/^function providerYearBalance\([\s\S]*?^\}\r?\n/gm,'')
        .replace(/\/\/ BEGIN PROVIDER YEAR[\s\S]*?\/\/ END PROVIDER YEAR\n/g,'');
    mapper.func=mapper.func.replace("flow.set('ess_dashboard_live', dashboard);",`// BEGIN PROVIDER YEAR
if(dashboard.energyCosts)dashboard.energyCosts.providerYear=providerYearBalance(flow.get('ess_provider_year_balance'),flow.get('ess_energy_cost_ledger'),Date.now());
// END PROVIDER YEAR
flow.set('ess_dashboard_live', dashboard);`);
    for(const id of ['essprefs_save','essprefs_restore']){
        const n=get(id);
        if(id==='essprefs_save')n.func=n.func.replace('    return result;',"    const provider=flow.get('ess_provider_year_balance');if(provider)result.providerYearBalance=provider;\n    return result;");
        else n.func=n.func.replace('    for (const [key,value] of Object.entries(candidate))',"    if(saved.providerYearBalance&&!flow.get('ess_provider_year_balance'))flow.set('ess_provider_year_balance',saved.providerYearBalance);\n    for (const [key,value] of Object.entries(candidate))");
    }
    const block=`<article class="panel finance-group" v-if="d.energyCosts?.providerYear" style="grid-column:1/-1"><div class="panel-head"><b>Zonneplan · {{d.energyCosts.providerYear.year}}</b><span>App-stand + bijgehouden kwartieren</span></div><div class="finance-metrics"><div class="metric tone-grid"><span>Afname · jaar</span><b>{{money(d.energyCosts.providerYear.importEuros)}}</b><small>{{energy(d.energyCosts.providerYear.importKwh)}}</small></div><div class="metric tone-sun"><span>Teruglevering · jaar</span><b>{{money(d.energyCosts.providerYear.exportEuros)}}</b><small>{{energy(d.energyCosts.providerYear.exportKwh)}}</small></div><div class="metric"><span>Netto verbruikskosten · jaar</span><b>{{money(d.energyCosts.providerYear.netEuros)}}</b><small>Exclusief ERE · app-afronding behouden</small></div></div></article>`;
    ui.format=ui.format.replace('<section class="overview-finances" aria-label="Kosten en besparing">','<section class="overview-finances" aria-label="Kosten en besparing">'+block);
    const z=mapper.z,g='esseditor_history';
    flows.push({id:'essprovider_year_tick',type:'inject',z,g,name:'Lees privé Zonneplan-jaarstand',props:[{p:'payload'}],once:true,onceDelay:25,wires:[['essprovider_year_read']]},
        {id:'essprovider_year_read',type:'file in',z,g,name:'Lees jaarstand buiten Git',filename:'/config/node-red/ess-provider-year-balance.json',filenameType:'str',format:'utf8',allProps:true,sendError:false,wires:[['essprovider_year_save']]},
        {id:'essprovider_year_save',type:'function',z,g,name:'Herstel jaarstand zonder overlap',outputs:1,func:providerYearBalance.toString()+`\nlet s;try{s=JSON.parse(msg.payload);}catch{return null;}
if(flow.get('ess_provider_year_balance')||!providerYearBalance(s,flow.get('ess_energy_cost_ledger'),Date.now()))return null;
flow.set('ess_provider_year_balance',s);return {payload:Date.now()};`,wires:[['essprefs_save','ess00000000000a']]});
};
module.exports.providerYearBalance=providerYearBalance;
