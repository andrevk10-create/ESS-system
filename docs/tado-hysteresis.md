# Woonkamer via HomeKit met hysterese 0,5 °C

De adapter `homekit-room` schakelt uitsluitend de gekozen woonkamerthermostaat via lokale HomeKit-bediening. Alleen de woonkamer vraagt de Extension Kit om warmte; badkamer en bijkeuken houden hun eigen thermostaatbediening en starten de warmtepomp niet. De overige adapters hieronder blijven beschikbaar voor installaties met een aparte actuator.

Configuratie → Verwarming · hysterese biedt een temperatuurverschil van 0,1 tot 2 °C, standaard 0,5 °C. Deze keuze wordt afzonderlijk gevalideerd en in de private klimaatvoorkeuren met reservekopie opgeslagen. De instellingen op Klimaat gebruiken dezelfde waarde. Aanpassen verandert het fysieke doel niet.

Controleer de HomeKit-entiteit met een echte wijziging aan de fysieke wandthermostaat en terugzetten naar het vorige doel. Een meetapparaat kan via HomeKit UIT blijven melden terwijl andere apparaten in dezelfde Tado-woonkamerzone het nieuwe doel wel tonen. De Tado-zoneleider is daarom niet automatisch de beste HomeKit-bedienentiteit. Een aantoonbaar bij dezelfde native woonkamerzone horende verwarmingsdriver kan het kamerdoel correct terugmelden. Controleer de zone-indeling, de fysieke wijzigingen in beide richtingen en de bediening voordat die entiteit de woonkamerrol én directe warmtebron wordt. Installatie-identiteiten en deze koppeling blijven uitsluitend in het private profiel. Neem hiervoor nooit een apparaat uit badkamer of bijkeuken.

Een controle met gekopieerde toestanden bewijst de grensberekening en opdrachtselectie, niet een echte contact- of compressorstart. Bij doel 21 °C en hysterese 0,5 °C blijft een eigen UIT bij 20,6 °C behouden en volgt bij 20,5 °C een HEAT-opdracht met doel 21 °C. Op 21 °C volgt UIT nadat de minimale aan-tijd verstreken is. Registreer bij een echte cyclus de gemeten kamertemperatuur, opdracht, HA-terugmelding en zo mogelijk het fysieke contact apart; zet geen nagebootste kamertemperaturen in HA.

De fysieke Tado-knop of het native schema bepaalt het doel. Bij bereiken van dat doel schakelt ESS de woonkamer UIT, na minimaal tien minuten aan. HomeKit verbergt in UIT het doel: ESS bewaart daarom het laatste werkelijk gelezen doel in de private klimaatbackup. Bij doel minus 0,5 °C schakelt ESS terug naar HEAT met dat bewaarde doel, na minimaal vijf minuten uit. Een nieuw zichtbaar fysiek doel of native schema krijgt voorrang; er wordt nooit een comfortdoel verzonnen. Begin daarom door de woonkamer op de fysieke knop in te stellen. UIT bij de eerste start blijft UIT.

Handmatig UIT terwijl de woonkamer op HEAT staat stopt automatisch herstarten. Nogmaals fysiek UIT kiezen terwijl ESS hem al UIT heeft gezet levert via HomeKit geen onderscheidbare wijziging op: zet dan de automatische hysterese in het dashboard uit. Bij een nieuwe fysieke temperatuurinstelling wordt het doel weer gelezen. Bij uitval van HA, ongeldige metingen of een niet bevestigde opdracht worden geen nieuwe schakelopdrachten verstuurd. HomeKit biedt geen zelfstandige timer: bij uitval blijft de laatst ingestelde stand gelden, met de eigen Tado-thermostaatregeling en EHS-beveiligingen. Dit schakelt alleen warmtevraag, nooit de netvoeding of het tapwater.

Controle: `tests/homekit-room-hysteresis.js` test de 0,5 °C-band, doelbehoud over herstart, fysieke wijzigingen, handmatig UIT, verbinding en integratieherkomst.

# Fysiek Tado-doel en afzonderlijke warmtevraag

De afzonderlijke warmtebronbediening is voorbereid en staat standaard uit; fysieke commissioning is nog nodig. De lokale HomeKit-kamerkoppelingen kunnen los daarvan in gebruik worden genomen. De fysieke Tado-knop en het eigen schema leveren de gewenste kamertemperatuur. ESS leest die instelling zonder de kamer aan of uit te zetten of haar doel te overschrijven. Bij een doel van 20 °C ontstaat warmtevraag vanaf 19,5 °C en vervalt die vanaf 20 °C. Binnen deze band blijft de vorige vraag behouden. Een gewijzigd doel wordt opnieuw beoordeeld. Geselecteerde kamers delen één warmtebron; één vragende kamer is voldoende.

De nieuwe warmtebron staat standaard uit. Selecteer expliciet de kamers en een aparte actuator. Normaal gelden minimaal tien minuten aan en vijf minuten uit. Ontbrekende of ongeldige kamerdata, handmatig uitschakelen en fouten stoppen een eigen warmtevraag zonder die normale wachttijd. Tapwater blijft apart geregeld. Oude economische kamerboosts worden bij deze regeling niet verzonden.

## Extension Kit met extra Tado

Maak met de extra Tado een afzonderlijke regelkamer. Wijs uitsluitend deze kamer aan de Extension Kit toe. Ontkoppel alle andere warmtevraaggevers van die Zone Controller via Tado → Instellingen → Kamers en apparaten → kamer → Verwarmingszone → Zone Controller → NONE. Controleer alle kamers, kleppen en noodzakelijke doorstroming fysiek; de software kan deze inrichting niet verifiëren.

De aparte regelkamer moet een native schema hebben dat altijd UIT is. ESS geeft alleen aan deze aparte cloudentiteit een tijdgebonden tado.set_climate_timer-opdracht, standaard twintig minuten, en vernieuwt die zolang warmtevraag bestaat. Na afloop keert Tado naar het UIT-schema terug. Een apart doel van standaard 25 °C dient als warmtevraag; de gemeten temperatuur van deze regelkamer moet minstens 2 °C lager zijn. Plaats de extra sensor dus niet in een warme technische ruimte. Tado bepaalt uiteindelijk zelf het contact: controleer het echte aan/uit-contact naar de Samsung EHS. De instellingen vragen expliciete bevestiging van ontkoppelde kamers, UIT-schema en een geslaagde contacttest.

Deze adapter vereist de Tado-cloudintegratie: een HomeKit-entiteit ondersteunt tado.set_climate_timer niet. De bron wordt op integratieherkomst gecontroleerd. Cloudpolling en quota kunnen bediening vertragen. Een succesvolle serviceoproep en HA-terugmelding bewijzen geen fysieke compressorstart. De normale EHS-beveiligingen blijven noodzakelijk.

## Lokale variant

HomeKit Apparaat kan de kamertemperaturen en fysieke doelen lokaal leveren. Kies voor de warmtebron een afzonderlijk lokaal potentiaalvrij relais met een switch-entiteit en een onafhankelijk ingestelde, geteste uitschakeltimer. Deze timer moet bij herhaald inschakelen opnieuw starten. De software stelt die apparaattimer niet zelf in; bevestig de watchdog pas na een echte uitvaltest. Zonder die bevestiging wordt niets ingeschakeld. De software vernieuwt de aanvraag halverwege haar lease.

Gebruik een passend laagspanningscontact voor de bestaande EHS-aan/uit-ingang, met de juiste aansluiting en minimale doorstroming. Dit is geen schakelaar voor de netvoeding van de warmtepomp. De Tado-integratie kan pas weg als alle gebruikte functies lokaal zijn overgenomen; de Extension Kit-adapter heeft haar nog nodig.

## HomeKit in het dashboard

Een alleen-lezen HA-entiteitenregister bepaalt of een kamer via HomeKit of Tado-cloud is gekoppeld. Het dashboard toont beschikbare lokale thermostaten, meetkwaliteit en de bestaande kamerkoppelingen. Er wordt niet automatisch op serienummer of volgorde gemigreerd. Controleer de identiteit met de fysieke knop voordat je een lokale entiteit koppelt. Niet beschikbaar, 100 °C, een koelmelding of verouderde data geldt niet als bruikbare verwarmingsmeting. De migratie verandert uitsluitend gecontroleerde kamerrollen in de private installatieconfiguratie. Internet Bridge- en thermostaatgegevens blijven buiten Git. Als alle gebruikte functies lokaal zijn overgenomen en de cloudadapter niet actief is, kan de HA Tado-cloudintegratie reversibel worden uitgeschakeld. Native Tado-schemas en de Tado-app worden daarmee niet vervangen door een lokaal schema. HomeKit biedt HEAT/OFF en geen aparte AUTO-stand of Tado-timerdienst.

## Opdrachten en storingen

Een intentie en eigenaarschap worden vóór verzending in de private klimaatbackup opgeslagen. Vlak vóór verzending worden koppeling, doel, actuele vraag en terugmelding opnieuw gecontroleerd. Er is maximaal één open opdracht; herstarts spelen oude buffers niet opnieuw af. Een gewijzigde bron kan pas worden opgeslagen nadat een eigen opdracht is gestopt. Niet bevestigde bediening blokkeert nieuwe opdrachten. Zet de bron na controle handmatig uit en bevestig de fout in het dashboard. Het aparte UIT-schema of de fysieke watchdog verzorgt de terugval wanneer HA of Node-RED wegvalt.

Controle: de volledige testsuite inclusief tests/tado-hysteresis.js en tests/homekit-climate.js. Deze tests verifiëren softwaregedrag; de fysieke installatie is nog niet in bedrijf gesteld.

Bronnen: [HA Tado](https://www.home-assistant.io/integrations/tado/), [HomeKit Apparaat](https://www.home-assistant.io/integrations/homekit_controller/), [Tado Zone Controller](https://support.tado.com/en/articles/4689126-how-does-tado-control-heating-zones-how-can-i-change-the-zone-controller-of-a-room).

HomeKit push-metingen hoeven niet iedere tien minuten te veranderen. Onveranderde lokale waarden blijven bruikbaar bij een verbonden HA-cache, actuele integratieherkomst en een beschikbare entiteit. Verbinding weg of ongeldige meting blokkeert bediening. Een ontbrekend doel in UIT wordt als ontbrekend weergegeven, niet als 0 °C. Een ongekoppelde buitenvoeler kan voor weersignalen terugvallen op de ingestelde weerentiteit.
