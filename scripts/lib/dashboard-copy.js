// Keep measurements, controls and actionable warnings; remove repeated help copy.
module.exports=function compactDashboardCopy(flows) {
    const redundant=[
        'Groen: accu · paars: auto · omlijning: huidig kwartier. Planning is geen bevestiging van werkelijk laden.',
        'De pijlen tonen de stroomrichting. De verdeling per energiebron wordt niet afzonderlijk gemeten.',
        'Totaal berekend verbruik, inclusief laadpunten',
        'Gemeten laadvermogen · onderdeel van het totaal',
        'Gemeten laadvermogens · onderdeel van het totaal',
        'Som van de drie Forecast.Solar-installaties',
        'Laadinstellingen blijven bewaard · laadverlies en slijtage meegerekend',
        'Werkelijke zonnelading verlaagt de netbehoefte',
        'Met Easee- en fasebeveiliging',
        'De elektrische grens is een softwarematige startvoorwaarde, geen fysieke vermogensbegrenzer. De gekoppelde warmtepompmeter en alle P1-fasen moeten actueel zijn.',
        'De fysieke thermostaten bepalen temperatuur en doel. De aparte bediening verzorgt de gezamenlijke warmtevraag; de kamerthermostaten blijven onder hun eigen bediening.',
        'Koppel de juiste lokale thermostaat aan de kamer via Configuratie. Controleer daarbij de fysieke knop. De Tado-cloudintegratie pas uitschakelen nadat alle kamerkoppelingen en overige functies zijn gecontroleerd.',
        'Temperatuurinstelling en schema blijven op de kamerthermostaat. Kamerboosts zijn uitgeschakeld.',
        'Beschikbare metingen buiten de ingestelde verbruikersrollen. Een apparaat kan meerdere meters hebben; deze waarden worden niet extra bij het woningverbruik opgeteld.',
        'Ook optionele rollen staan hieronder. Niet gekoppeld betekent dat de bron nog gekozen moet worden of niet aanwezig is. Geen bruikbare waarde betekent dat de gekoppelde HA-entiteit ontbreekt, onbekend of niet beschikbaar is.',
        'Het fysieke Tado-doel blijft leidend. Alleen de woonkamer start de warmtepomp. Inschakelen bij het doel minus dit verschil; uitschakelen bij het doel.',
        'Alle persoonlijke koppelingen blijven lokaal',
        'Niet-gebruikte onderdelen verdwijnen van het overzicht',
        'Veilige fysieke maxima blijven altijd leidend',
        'Zoek op onderdeel, rol of entiteit',
        'Drie configureerbare zones',
        'Werkelijke meters en verwachting',
        'Inclusief geplande laadenergie',
        'Laadinstellingen blijven bewaard',
        'Gemeten stromen en ontwerpgrens',
        'Metingen en apparaatstatus',
        'WIT-opdracht en terugmelding'
    ];
    for(const n of flows.filter(n=>n.type==='ui-template'&&n.format)) {
        n.format=n.format.replace(/<(p|small|span)\b[^>]*>([^<>]*)<\/\1>/g,(tag,kind,text)=>redundant.includes(text)?'':tag);
        n.format=n.format.replace(/<p>Regelstand: [^<]*<\/p>/g,'');
        n.format=n.format.replace('Bij HomeKit-woonkamer: kies de woonkamerthermostaat en uitsluitend die kamer hieronder. Het fysieke doel blijft leidend; ESS bewaart het tijdens eigen UIT. Andere adapters gebruiken een aparte regelzone of contact.','Kies alleen de woonkamer bij HomeKit.');
        n.format=n.format.replace('Actuele, aan deze WIT gekoppelde registerterugmelding. De stroominstelling is niet hetzelfde als een door de BMS toegestane stroom.','Stroominstelling ≠ BMS-limiet.');
        n.format=n.format.replace('Geschat: {{d.jeepSmart?.estimatedEVSoc==null?\'—\':Math.round(d.jeepSmart.estimatedEVSoc)+\'%\'}} · 54 kWh. Vul de stand opnieuw in bij elke aansluiting.','Geschat: {{d.jeepSmart?.estimatedEVSoc==null?\'—\':Math.round(d.jeepSmart.estimatedEVSoc)+\'%\'}} · Bij aansluiten opnieuw invullen.');
        n.format=n.format.replace(/<p class="subtle">\{\{d\.wit\?\.gridCharge\?\.houseTimeProfile\?\.source\}\}[\s\S]*?<\/p>/,
            '<details class="ess-slot-list"><summary>Verbruiksprofiel · {{d.wit?.gridCharge?.houseTimeProfile?.days||0}} meetdagen</summary><p>{{Number(d.wit?.gridCharge?.houseTimeProfile?.learnedHours||0).toFixed(1)}} van {{Number(d.wit?.gridCharge?.houseTimeProfile?.hours||0).toFixed(1)}} uur geleerd. Overige uren: daggemiddelde. Reserve: 20% SOC.</p></details>');
        n.format=n.format.replace('Looptijd is afgeleid uit elektrisch vermogen. Hoog vermogen kan warm water zijn, maar ook verwarming of ontdooien. Elektrische bijverwarming is volgens jouw instelling uitgeschakeld. Verbruik omvat ook het stand-byverbruik. Meetgaten worden niet als looptijd ingevuld.',
            'Looptijd geschat uit vermogen. Hoog vermogen: mogelijk warm water. Verbruik inclusief stand-by.');
        n.format=n.format.replace(' stops. Onbekende meettijd:',' stops · zonder meting:')
            .replace('STARTS / STOPS VANDAAG · GEDETECTEERD','STARTS / STOPS VANDAAG')
            .replace('Warmtepomp · compressorregistratie','Compressor')
            .replace('Compressor vermoedelijk actief','Compressor actief · geschat')
            .replace('Compressor vermoedelijk uit','Compressor uit · geschat')
            .replace('Warmtepomp gemeten:','Warmtepomp:')
            .replace('Extra accureserve:','Accureserve:')
            .replace('Alleen reservetekort tot goedkoper moment laden','Overbrugging tot goedkoper moment')
            .replace('Voldoende reserve · wacht op zon of goedkopere uren','Wacht op zon of lagere prijs')
            .replace('Aan tot 100% thuisaccu-SOC; uit voor aangesloten EV onder zonne-SOC','Automatisch · accu eerst, EV-voorrang');
    }
};
