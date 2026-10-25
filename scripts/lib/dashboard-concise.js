// Presentation only: retain values, controls and actionable device status.
module.exports=function conciseDashboard(flows){
    for(const n of flows.filter(n=>n.type==='ui-template'&&n.format)){
        const end=n.format.indexOf('</template>');
        if(end<0)continue;
        let t=n.format.slice(0,end);
        t=t.replace(/<p>([\s\S]*?)<\/p>/g,(all,body)=>{
            if(body.includes('{{')||/<(?:input|button|select|label)\b/.test(body)||/^(?:Geen |Niet beschikbaar|Wacht |Fout)/.test(body.trim()))return all;
            return '';
        });
        t=t.replace(/<small>([^<]*?)<\/small>/g,(all,body)=>!body.includes('{{')&&body.length>45?'':all);
        t=t.replace(/<p[^>]*>Nu laden vult de accu[\s\S]*?<\/p><p v-else>De netenergie omvat[\s\S]*?<\/p>/g,'');
        t=t.replace(/<small>Apart gepland acculaden:[\s\S]*?<\/small>/g,'<small>Accu {{energy(d.house&&d.house.witPlannedTomorrow)}}</small>');
        t=t.replaceAll("'volledige registratie':'gedeeltelijk bekend'","'Compleet':'Deels'")
            .replace('Geschat netaandeel · ','')
            .replaceAll('Laadpaal meldt ','Geladen ')
            .replaceAll('Nog zonder kostenwaardering: ','Niet gewaardeerd: ')
            .replaceAll('Bekend sinds start: ','Totaal: ')
            .replaceAll('Totaal geregistreerd ','Totaal ')
            .replaceAll('Energiemeters spreken elkaar tegen; controleer periode en koppeling.','Energiemetingen verschillen.')
            .replaceAll("'Volledige registratie vandaag':'Onvolledige registratie; geen bewezen dagwinst of verlies'","'Compleet':'Deels'")
            .replaceAll("'Volledige registratie':'Gedeeltelijke gegevens; bedrag is geen volledig laadtotaal'","'Compleet':'Deels'")
            .replace('Laadpaal vandaag: ','Geladen: ')
            .replaceAll('nog zonder waardering: ','niet gewaardeerd: ')
            .replace(' · niet opgeteld bij eindverbruik of gelijk aan netafname. Autoplannen gelden mits aangesloten; extra zonneladen zit niet in deze optelling.','')
            .replace(' Alle laadhoeveelheden zijn netenergie, inclusief het ingestelde laadverlies.','')
            .replace('daggemiddelde woning · zie laadbudget hieronder','daggemiddelde woning')
            .replace('Woning en beide auto’s · opslag apart','Woning en auto’s')
            .replace('GEPLAND VERMOGEN · GEDEELDE AANSLUITING','GEPLAND VERMOGEN')
            .replace('Eigen laadplanning in detail · gedeelde aansluiting','Laadplanning');
        n.format=t+n.format.slice(end);
    }
};
