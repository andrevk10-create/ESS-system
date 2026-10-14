module.exports = function overviewLayout(flows) {
    const ui=flows.find(n=>n.id==='ess000000000004');
    const start=ui.format.indexOf('<section class="metric-grid" aria-label="Kosten en besparing">');
    const end=ui.format.indexOf('</section>',start);
    if(start<0||end<0)throw Error('Overview cost cards missing');
    const cards=ui.format.slice(start,end).match(/<article[\s\S]*?<\/article>/g);
    if(cards?.length!==5)throw Error('Unexpected overview cost cards');
    const concise=card=>card.replace('NETAFNAMEKOSTEN VANDAAG','Netafname')
        .replace('ACCUBESPARING VANDAAG · GESCHAT','Accubesparing · geschat')
        .replace("{{car.toUpperCase()}} · LAADKOSTEN VANDAAG · NET GESCHAT","{{car==='audi'?'Audi':'Jeep'}} · laadkosten")
        .replace('TERUGLEVEROPBRENGST VANDAAG','Teruglevering')
        .replace('<span>ERE-OPBRENGST · GESCHAT</span>','<span aria-label="ERE-OPBRENGST · geschat">ERE · totaal geschat</span>')
        .replace(' sinds registratie','').replace('Besparing direct laden:','Besparing:');
    const section=`<section class="overview-finances" aria-label="Kosten en besparing">
 <article class="panel finance-group"><div class="panel-head"><b>Woning · vandaag</b></div><div class="finance-metrics">${[cards[0],cards[1],cards[3]].map(concise).join('\n')}</div></article>
 <article class="panel finance-group"><div class="panel-head"><b>Auto’s & ERE</b><span>Laadkosten vandaag · net geschat</span></div><div class="finance-metrics">${[cards[2],cards[4]].map(concise).join('\n')}</div></article>
</section>`;
    ui.format=ui.format.slice(0,start)+section+ui.format.slice(end+10);
    ui.format=ui.format.replace('<summary>Kosten en opbrengsten</summary>','<summary>Details & instellingen kosten</summary>');
    ui.format=ui.format.replace('</style>',`
.overview-finances{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0 10px}
.finance-group{padding:16px;min-width:0}.finance-group .panel-head{margin-bottom:12px;flex-wrap:wrap;gap:4px}
.finance-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.finance-metrics .metric{padding:12px;box-shadow:none;border-radius:12px;background:var(--wash,var(--paper));min-height:105px}
.finance-metrics .metric span{font-size:11px;text-transform:none;line-height:1.4}
.finance-metrics .metric b{font-size:26px;margin:8px 0 6px}
.finance-metrics .metric small{white-space:normal;line-height:1.5;font-size:11px}
.mp-shell>.quick-actions{margin-top:16px}
@media(max-width:1100px){.overview-finances{grid-template-columns:1fr}}
@media(max-width:500px){.finance-group{padding:12px}.finance-metrics{grid-template-columns:1fr}.finance-metrics .metric{min-height:0}.finance-metrics .metric b{font-size:24px}}
</style>`);
};
