module.exports=function compactOverview(flows){
    const ui=flows.find(n=>n.id==='ess000000000004');
    ui.format=ui.format.replace('<span>App-stand + bijgehouden kwartieren</span>','')
        .replace('<small>Exclusief ERE · app-afronding behouden</small>','<small>Exclusief ERE</small>')
        .replace('<summary>Details & instellingen kosten</summary>','<summary>Kostendetails</summary>')
        .replaceAll("'Met Easee- en fasebeveiliging'","''")
        .replace('<small>Actueel totaalverbruik</small>','')
        .replace(' · beide laadpunten','')
        .replace(/<p>Vanaf ([\s\S]*?)<\/p>/,(_,body)=>'<p>Registratie vanaf '+body.split('. Kwartierprijzen')[0]+'.</p>')
        .replace(/<p>Laadkosten volgens deze berekening[\s\S]*?<\/p>/,'<p>Autokosten betreffen het netaandeel en zijn onderdeel van de netkosten.</p>')
        .replace(/<p>Totaal teruglevering:[\s\S]*?<\/p>/,"<p>Teruglevering totaal: {{money(d.energyCosts?.total?.exportUnpricedKwh>0?null:d.energyCosts?.total?.exportRevenue)}} · {{d.energyCosts?.exportBasis}}.</p>")
        .replace(/<p>Accubesparing is[\s\S]*?<\/p>/,'<p>Accubesparing en besparing tegenover direct laden zijn schattingen.</p>')
        .replace(/<p>ERE is een schatting[\s\S]*?<\/p>/,"<p>ERE: geschatte vergoeding van Lekkerladen. Meetgaten: {{Number(d.energyCosts?.total?.missingHours||0).toLocaleString('nl-NL',{maximumFractionDigits:1})}} uur.</p>")
        .replace('Dit bedrag blijft apart van de nieuwe schatting.','');
};
