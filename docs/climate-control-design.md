# Ontwerp: voorspellende klimaatregeling

Status: ontwerp plus eerste begrensde implementatie, nog niet live vrijgegeven. Gebaseerd op een alleen-lezen inventarisatie van Home Assistant, de lokale Node-RED-context en de bestaande dashboardcode, bijgewerkt op 22 september 2026. Logica en bedienroutes worden lokaal getest; fysieke werking en terugval bij echte cloudstoringen zijn nog niet bewezen. Persoonlijke namen, locaties, apparaat-ID's en netwerkadressen zijn bewust weggelaten.

## Implementatiestatus

De onderstaande hoofdstukken beschrijven het bredere ontwerp, niet uitsluitend reeds gebouwde functies. De eerste implementatie in `scripts/lib/climate-runtime.js` en `scripts/lib/climate-control.js` omvat:

- Twee expliciet gekoppelde Tado-zones, standaard niet vrijgegeven. Instelbare band 18–22 °C met normaal 21 °C; het huidige Tado-schemadoel bepaalt standaard of het een comfortperiode is. Een lager nachtdoel wordt niet automatisch verhoogd naar 21 °C. Eigen comforttijden zijn optioneel.
- Echte, begrensde opdrachten via `tado.set_climate_timer` voor 30 minuten en `water_heater.set_temperature`. Geen netvoedingsschakeling, stooklijnwijziging of elektrische bijverwarming.
- Prijsvergelijking van volledige blokken (30 minuten voor kamers, ingestelde bufferduur voor tapwater) met toekomstige blokken binnen acht uur, met minimale prijswinst. Geen garantie op een wereldwijd optimaal energieplan of bewezen besparing.
- Vijf minuten aanhoudend netoverschot, zonder substantiële accu-activiteit, als conservatieve zonvoorwaarde. Actuele SOC minus de grootste bescherming van veiligheidsvloer of woning-/EV-reserve. Tijdens een WIT-netlaadsessie geen accugebaseerde boost.
- Uurlijkse weerverwachting, maximaal drie uur oud, voor beperkte voorverwarming. Geen geleerd gebouwmodel, nauwkeurige COP, weerscorrectie of voorspelde kamertemperatuurcurve.
- Verse P1-metingen per fase en een aparte warmtepompmeter. Onbekend of hoger dan ingesteld vermogen blokkeert nieuwe extra warmtevraag. Dit is een startvoorwaarde, **geen fysieke vermogensbegrenzing**; de bestaande toestel- en installatiebeveiligingen blijven noodzakelijk.
- Eerst lokaal de opdracht en terugzetwaarde bewaren, daarna opnieuw actuele voorwaarden controleren en pas dan verzenden. Wachten op doelterugmelding, geen automatische herhaalstorm. Na tien minuten zonder bevestiging moet de zone opnieuw worden gecontroleerd/vrijgegeven.
- Handmatige wijzigingen krijgen voorrang. Tijdelijke Tado-doelen verlopen via Tado; ook na het uitzetten van ESS kan een bestaande timer nog maximaal 30 minuten doorlopen. Herstel van een tapwaterdoel vereist een werkende verbinding. Opnieuw opstarten speelt geen oude opdrachtqueue af.
- Tapwaterbufferen en terugzetten vereisen een vers, betrouwbaar signaal `binary_sensor.dhw_hygiene_active` dat uit staat. Deze rol is standaard leeg. Ontbreekt dat signaal, dan blijft de eigen tapwaterregeling leidend. Maak geen fictief 'uit'-signaal om deze voorwaarde te omzeilen.
- Klimaatvoorkeuren en opdrachtlogboek in hetzelfde private primaire/reservebestand als de laadvoorkeuren. Extra klimaatenergie wordt als reserve aan de WIT-regelaars doorgegeven; dit is nog geen centrale vermogensverdeler die toekomstige EV/WIT-acties onderling vergrendelt.
- Status, redenen, doelbevestiging en gemeten totaalvermogen op het dashboard en via `sensor.ess_climate_control`. Home Assistant Recorder moet die sensor opnemen om de historie te bewaren. Een doelbevestiging is **geen** bewijs dat de compressor daadwerkelijk draait.

Nog niet gebouwd: een geleerd thermisch model, gebruiksvoorspelling voor tapwater, volledige gezamenlijke kostenoptimalisatie, een geoptimaliseerde klimaattijdlijn en een gevalideerde besparingsanalyse. De bestaande prijs-/comfortvensters zijn geen belofte dat de warmtepomp op die momenten draait.

### Vrijgave per installatie

1. Verifieer de twee Tado-koppelingen en de dedicated meterrol `sensor.flex_load_4_power`. Gebruik niet het thermische typeplaatvermogen als elektrische opname.
2. Stel elektrische regelgrens en faseverdeling in op basis van de installatie. Een voorlopig opgegeven grens blijft voorlopig en vervangt de fabrikantgegevens niet.
3. Controleer comfortband en schema. Een bestaande handmatige Tado-stand wordt niet stilzwijgend vervangen door automatisch bedrijf.
4. Geef eerst een kamer gecontroleerd vrij, controleer het doel in HA/Tado en controleer de terugkeer na de timer. Houd de andere kamer en tapwater zo nodig nog uit.
5. Geef tapwater pas vrij na controle van vatgrenzen, actuele meting, het hygiënesignaal en het terugzetten. Bij ontbrekende informatie blijft alleen dit onderdeel geblokkeerd.

De publieke standaard bevat geen installatie-identiteiten en activeert geen zones bij een pull. Persoonlijke koppelingen en vrijgave blijven lokaal bewaard.

## 1. Doel en grenzen

Een comfortabel binnenklimaat tegen zo laag mogelijke kosten, met gebruik van verwachte buitentemperatuur, zon, kwartierprijzen en de energievoorraad van de thuisaccu. Het systeem verschuift flexibel verbruik, niet het noodzakelijke comfort. Het moet samenwerken met de bestaande WIT- en EV-planners zonder dezelfde energie of netruimte dubbel te reserveren.

Home Assistant levert metingen en apparaatbediening. Node-RED maakt de planning en bewaakt opdrachten. De thermostaat en de interne apparaatbeveiligingen blijven de snelle temperatuurregeling, vorstbeveiliging en compressorbeveiliging uitvoeren. Geen regeling die netvoeding van een warmtepomp onderbreekt.

Voertuigklimaat blijft een aparte functie; het valt niet onder deze woningregeling.

### Bevestigde eerste scope

De gebruiker heeft bevestigd: **Tado is de ruimtethermostaat en stuurt de EHS-warmtepomp aan. Alleen Tado kent de ruimtetemperatuur.** De eerste automatische regeling omvat uitsluitend **woonkamer, badkamer en warm tapwater**. Andere Tado-zones en airco's blijven ongewijzigd onder hun bestaande bediening. Hun aanwezige mogelijkheden staan hieronder uitsluitend als inventarisatie voor eventuele latere uitbreiding.

De hoofdregel is daarmee: **ESS verschuift de Tado-ruimtevraag binnen comfortgrenzen; EHS verzorgt de warmteproductie. ESS plant tapwater apart.** EHS-ruimteverwarming niet los aan/uit zetten op iedere prijsgrens. EHS-watermetingen worden nooit als kamertemperatuur gebruikt en er wordt nooit een kamerdoel van bijvoorbeeld 21 °C naar een watercircuit geschreven.

## 2. Wat nu aantoonbaar beschikbaar is

| Onderdeel | Gevonden | Bruikbaarheid en beperking |
|---|---|---|
| Airco's | Vier klimaatentiteiten, alle met heat/cool/off; actuele en gewenste temperatuur, ventilatorstanden | Geschikt voor beperkte voorverwarming/voorkoeling. Alleen kantoor- en zolderunit hebben gevonden W/kWh-metingen; bij de twee andere units is individueel energieverbruik niet aangetoond. |
| Tado | Drie verwarmingszones; temperatuur, luchtvochtigheid, doel, heat/auto/off, home/away en hvac_action | Geschikt voor comfortbanden en tijdelijke afwijkingen van het schema. Alle drie waren beschikbaar in de momentopname, maar dat bewijst geen continue bereikbaarheid. |
| Raamsignalen | Drie raam-entiteiten bij verwarmingszones | Eerst bepalen of dit fysieke contacten of afgeleide openraamdetectie zijn. Geen gegarandeerde raamdetectie voor alle aircozones. |
| Beweging | Enkele bewegingssensoren | Eerst ruimte toewijzen. Geen beweging betekent niet dat een slapende of stilzittende persoon afwezig is. |
| Warmtepomp | EHS-klimaatentiteit met heat/cool/auto/off; doelbereik 30–45 °C | Bevestigd: dit toestel kent de ruimtetemperatuur niet. De exacte water-/circuitgrootheid blijft te verifiëren. De dashboardrol voor de warmtepomp is nu leeg. |
| Tapwater | Een water_heater; actuele/doeltemperatuur; eco, heat_pump, high_demand en off | Apart thermisch opslagvat. Afzonderlijk plannen; hygiëne- en veiligheidsprogramma's blijven leidend. |
| Warmtepompenergie | Een externe vermogens-/kWh-meter met fasemetingen én EHS-vermogens-/energiesensoren | De twee bronnen rapporteerden verschillende vermogens. Meetgrenzen en updatevertraging eerst vaststellen; niet bij elkaar optellen. |
| EHS-bedrijf | Kleppositie room aangetroffen | Mogelijk bruikbaar om ruimteverwarming en tapwater te onderscheiden; betekenis en overige standen eerst valideren. |
| Buiten/weer | Weerentiteit met temperatuur, wind, bewolking, vocht en dauwpunt; aparte Tado-buitentemperatuur | Een uurverwachting is nog niet aangetoond in de ESS-context. Hiervoor een forecastadapter toevoegen en de daadwerkelijke response controleren. |
| Energie | P1-totaal en drie fasen; WIT-SOC/-vermogen; PV en zonneprognoses; gedateerde all-in kwartierprijzen | Genoeg voor netruimtebewaking en een eerste energieplanning. De gelezen prijscache bevatte ook volgende-dagprijzen. |
| Nog niet aangetoond | Waterdebiet, onafhankelijke aanvoer/retour, geleverde warmte, betrouwbare COP, CO₂/ventilatiebediening, volledige zonebezetting | Geen nauwkeurige COP-berekening of automatische ventilatieregeling claimen. Ontwerp moet zonder deze gegevens conservatief werken. |

Extra bevindingen uit de huidige code en gegevens:

- Een Tado-zone in `auto` met `hvac_action: idle` wordt op het dashboard toch als actief gemarkeerd. Splits daarom **regeling ingeschakeld**, **warmtevraag** en **gemeten verbruik**.
- Het dashboard noemt de buitenbron een EHS-buitenvoeler, terwijl de gekoppelde entiteit een Tado-buitentemperatuur is. Toon de werkelijke bron; fysieke sensormeting en weerschatting zijn niet hetzelfde.
- De huidige klimaatbediening kan handmatig temperatuur en modus wijzigen, maar heeft nog geen voorspellende klimaatplanner of bevestigde uitvoeringsketen.
- Een aanwezige warmtepompschakelaar en cloud-verbindingsschakelaar zijn geen geschikte standaardingang voor prijssturing. Eerst functie vaststellen; gebruik de ondersteunde klimaatbediening.
- Niet alle temperatuurbronnen hebben `last_reported` in de Node-RED-cache. Oud `last_changed` of `last_updated` is op zichzelf geen bewijs van offline zijn.

## 3. Regelstrategie

### Comfortprofielen en handbediening

Globaal: **Uit / Alleen advies / Automatisch**. Uit betekent dat ESS de optimalisatie loslaat en, indien mogelijk, de oorspronkelijke regeling herstelt; niet dat alle verwarmingen hard worden uitgezet.

Per zone: **Eco / Normaal / Comfort / Handmatig**, plus een gebruiksschema. Profiel bepaalt de toegestane temperatuurband, hoeveelheid voorverwarming/-koeling, stiltevoorkeur en prijsgevoeligheid. De bewoner stelt de daadwerkelijke temperaturen en tijden in; er wordt geen universele comforttemperatuur opgelegd.

Een handmatige wijziging vanuit HA, de merkapp of het apparaat pauzeert de zoneoptimalisatie voor een instelbare duur, bijvoorbeeld twee uur. Wijzigingen van ESS worden met opdracht-ID en tijd herkend, zodat de regelaar zijn eigen wijzigingen niet als handmatige override ziet. Bij twijfel wint de gebruiker.

Voor de eerste versie zijn er slechts drie regelkaarten: **Woonkamer**, **Badkamer** en **Warm water**. Woonkamer en badkamer krijgen een eigen weekprogramma, comfortband en eventuele tijdelijke boost. De bestaande Tado-instellingen zijn uitgangspunt totdat de gebruiker andere temperaturen/tijden vastlegt; de regelaar introduceert niet zelfstandig nieuwe comfortdoelen. De badkamer mag een gerichte warmtevraag rond gebruiksmomenten krijgen; de woonkamer een langere comfortabele periode. Vochtmeting in de badkamer is extra informatie, geen vervanging voor temperatuur- of ventilatieregeling.

### Vooruitkijken en leren

Plan een rollend venster van 24–36 uur in kwartieren. Vernieuw minstens ieder kwartier en na nieuwe prijzen, een nieuwe weersverwachting, gewijzigd comfort, relevante SOC-verandering of een storings-/aanwezigheidsmelding. Een herberekening is nadrukkelijk geen schakelopdracht op iedere kwartiergrens.

Leer per zone de temperatuurtrend tijdens verwarmen, koelen en uitstaan, afhankelijk van buitentemperatuur en tijdstip. Start met een eenvoudige, begrensde schatting en toon de onzekerheid. Zoninstraling op een kamer is niet hetzelfde als PV-opbrengst: bewolking, oriëntatie en geobserveerde kamerrespons bepalen de correctie.

Voorbeeldbeslissingen:

- Morgen kouder en vóór de ochtendpiek goedkope stroom: eerder beperkt verwarmen, mits de warmte tot het gebruiksmoment behouden blijft.
- Later warmer en ruime zon: eventueel vooraf koelen, maar alleen binnen de ingestelde ondergrens en als de kamer gebruikt zal worden.
- Hoge SOC met aannemelijk PV-overschot: comfort voorbereiden kan gunstig zijn, zonder energie te verbruiken als geen warmte-/koelvraag wordt verwacht.
- Lage SOC: geen extra accuverbruik voor comfortboosts. Noodzakelijke verwarming mag wel netstroom gebruiken; een lage SOC schakelt basiscomfort niet uit.

### Kosten en gezamenlijke energiebegroting

Gebruik all-in importprijzen en de werkelijke waarde van teruglevering. PV en accustroom zijn niet gratis: vergelijk direct klimaatverbruik met bewaren voor later, inclusief laadverlies, slijtage, reserve en onzekerheid. Bij een warmtepomp telt ook het verwachte rendement mee: een warmer, iets duurder uur kan goedkoper warmte leveren dan een kouder, goedkoper uur. Zonder gevalideerde COP-curve zijn dit scenario's met een onzekerheidsmarge, geen exacte warmtekosten.

Eén centrale energiebegroting per kwartier bevat woningbasisverbruik, klimaat, tapwater, EV, WIT-netladen, PV en resterende batterijreserve. De klimaatplanner publiceert zijn verwachte elektrische vraag vóór de WIT- en EV-planners energie reserveren. De WIT mag 'extra ontladen voor de EV' alleen berekenen ná reservering voor verwacht woning- en klimaatverbruik.

Voorkom dubbeltelling: het bestaande geleerde woningverbruik bevat waarschijnlijk al klimaatverbruik. Trek dat alleen af als afzonderlijke metingen voldoende dekking hebben. Zolang dat niet kan, reserveer uitsluitend het geschatte extra verbruik boven de bestaande basis, met een conservatieve marge.

Een aparte snelle netruimtebewaker gebruikt verse P1-fasemetingen, de werkelijke netzekering en bestaande veiligheidsmarge. De planner kiest momenten; deze bewaker verleent of begrenst vermogen. Flexibele WIT-netlading en klimaatboosts wijken vóór noodzakelijk comfort. EV-vertrekdoelen worden als deadlinevoorwaarden meegenomen. Onhaalbare combinaties worden zichtbaar gemeld, niet stilzwijgend opgelost met overbelasting.

Airco's zijn vaak eenfasige verbruikers: faseaansluiting en maximaal elektrisch vermogen per apparaat moeten daarom worden vastgelegd. Een totaal in kW is onvoldoende. Ontbreekt de fasekaart, dan geen gelijktijdige grote boosts; gebruik een conservatieve gedeelde bovengrens en observeer de gemeten belasting.

## 4. Apparaatspecifieke uitvoering

**Airco's:** expliciete heat- of cool-modus, met setpoint binnen live apparaatgrenzen. Niet voortdurend wisselen via auto. Gebruik per apparaat minimale aan-/uitduur en hysterese op basis van fabrikantgegevens; voorlopige simulatie kan met blokken van 30 minuten werken, maar dat is geen universele compressorveiligheidsgrens. Houd rekening met een eventuele gedeelde buitenunit: aangesloten units mogen niet tegenstrijdig verwarmen en koelen.

**Tado:** gebruik bij bewezen ondersteuning een tijdelijke timer/overlay en keer terug naar het eigen schema. De aangetroffen standaardoverlay was MANUAL; een onbeperkte setpointwijziging is dus geen veilige automatische terugval. Geen extra snelle polling. Controleer lees-/schrijflimieten en pas alleen aan bij een betekenisvol verschil. Tado is bevestigd de ruimteregelaar voor de EHS. Plan beide geselecteerde zones samen rond dezelfde warmtebron, zonder twee afzonderlijke warmtepompverbruiken te tellen.

**EHS-ruimteverwarming:** Tado blijft master voor ruimtevraag. In versie 1 geen directe economische verandering van de waterinstelling of het aan/uit-signaal: de EHS volgt de bestaande Tado-aansturing. Eerst vaststellen wat de 30–45 °C precies vertegenwoordigt, hoe weersafhankelijke regeling werkt en welke circuits/minimale doorstroming vereist zijn. Niet alle afgiftezones tegelijk dichtzetten terwijl het toestel warmte moet leveren. Ook warmtevraag van niet door ESS geregelde zones blijft geldig: 'alleen woonkamer en badkamer optimaliseren' geeft geen toestemming om een andere zone of de hele EHS uit te schakelen. Eigen stooklijn en beveiligingen blijven intact. Vloerkoeling valt buiten versie 1.

**Tapwater:** apart tijd-/comfortdoel en een gedeelde-capaciteitsvergrendeling met ruimteverwarming indien hetzelfde toestel wordt gebruikt. Geen automatische keuze voor high_demand zonder te weten of een elektrisch element wordt ingeschakeld. Bestaande hygiënecycli, grenzen en apparaatbeveiligingen nooit onderdrukken; geen eigen universele vattemperatuur als veilige standaard verzinnen.

### Warm tapwater eerder verwarmen

Tapwater hoort expliciet bij versie 1. De actuele vattemperatuur en het ingestelde doel zijn beschikbaar. In de inspectie waren dat ongeveer 44,8 °C en 53 °C; dit zijn observaties, geen nieuw voorgeschreven temperatuurbeleid. Het geadverteerde bereik 40–60 °C is een technische bediengrens, geen verklaring dat elk doel in dat bereik geschikt is voor deze installatie.

Configureer afzonderlijk:

- Het normale tapwaterdoel en de gewenste beschikbaarheidsmomenten, aanvankelijk overeenkomstig de bestaande regeling.
- Een toegestane hogere buffertemperatuur en maximale duur van voorverwarming, pas na bevestiging van toestel-/vatinstellingen en comfort-/veiligheidsgrenzen.
- Een bruikbaarheidsgrens die verplicht bijverwarmen vraagt ongeacht prijs/SOC, afgeleid van de geverifieerde installatie-instellingen. Geen extra afkoeling onder deze grens forceren om op een goedkoop kwartier te wachten.
- Vatinformatie, maximale elektrische opname, al dan niet elektrisch bijverwarmen en de relatie met ruimteverwarming. Ontbrekende parameters krijgen geen verzonnen waarden.

De planner vergelijkt **nu verwarmen** met **later verwarmen**, inclusief verlies door het eerder en warmer opslaan, verwacht warmwatergebruik, onzekerheid en batterijwaarde. Drie omstandigheden maken eerder verwarmen kandidaat, maar zijn geen onvoorwaardelijke aan-opdracht:

1. **Goedkopere stroom:** binnen de toegestane tijd vóór verwacht gebruik is eerder verwarmen naar verwachting voordeliger. Niet telkens een cyclus onderbreken voor één duur kwartier.
2. **Bruikbaar zonoverschot:** er is na actuele woninglast, afgesproken EV-behoefte en accureserve voldoende overschot; een korte PV-piek is niet genoeg. Bevestig overschot enige tijd en plan een uitvoerbaar blok.
3. **Ruim voldoende accu:** bereken beschikbare energie boven de veiligheidsvloer, trek woning-/klimaatvraag tot de volgende betrouwbare laadmogelijkheid en afgesproken EV-ondersteuning af, en houd een onzekerheidsmarge over. Alleen deze resterende kWh mag een optionele tapwaterboost ondersteunen. Een vast criterium als 'SOC boven 80%' is op zichzelf onvoldoende.

De tapwaterplanner vraagt niet zelf een extra WIT-ontlaadopdracht. Hij reserveert zijn verbruik bij de centrale energieregeling. De WIT blijft de bestaande normale regeling en goedgekeurde batterijstrategie volgen, zodat de ene planner niet laadt terwijl de andere dezelfde energie direct probeert te ontladen.

Ruimteverwarming en tapwater delen de EHS. Groepeer tapwater in rustige blokken, bij voorkeur vóór of na de belangrijkste ruimtevraag. Gebruik na validatie de klepstand als extra terugmelding. Laat bij onvoldoende capaciteit noodzakelijk kamercomfort of dreigend tekort aan bruikbaar warm water vóór een optionele bufferboost gaan. Zorg voor een instelbare prioriteit bij een werkelijke botsing; meld een onhaalbare planning.

Bedien via ondersteunde `water_heater`-doeltemperatuur/bedrijfsmodus, niet via de netvoedingsschakelaar. Laat de EHS-compressor zijn eigen cyclus afmaken binnen de normale regeling. Een dalend boostdoel na het venster is géén koelopdracht en geen reden om een verwarmingscyclus hard af te breken. Bewaak doelterugmelding, bedrijf/klepstand, elektrisch vermogen en temperatuurtrend met passende thermische vertraging. Een moment zonder temperatuurstijging is geen bewijs van een fout.

Zonder vatinhoud, bruikbare temperatuurverdeling en een geleerd warmteverlies wordt de beschikbare tapwaterenergie alleen als onzekere schatting getoond. Eén vatsensor bewijst niet hoeveel liter op de gewenste temperatuur beschikbaar is. Herken ook handmatige tapwateraanpassingen; bescherm bestaande hygiënecycli tegen terugzetten van een lager ESS-doel.

**Vocht en ventilatie:** vochttrends tonen en waar aanwezig openraamsignalen benutten. Eén hoge vochtmeting is geen reden om onbeperkt te ontvochtigen of verwarmen. Zonder geschikte ventilatiebediening blijft ventilatie een adviesfunctie.

## 5. Robuustheid en terugval

| Gebeurtenis | Gedrag |
|---|---|
| Prijzen of weersverwachting ontbreken | Stop economisch vooruitsturen; houd het lokale comfortprogramma aan. Ontbrekende prijzen niet als nul beschouwen. |
| SOC ontbreekt | Geen accugebaseerde boosts; basiscomfort en apparaatregeling blijven mogelijk. |
| P1 onvoldoende actueel | Geen nieuwe flexibele vermogenstoename; geen blinde aannames over fasecapaciteit. |
| Ruimtetemperatuur onbetrouwbaar | Geen zelfbedachte thermostaatbeslissing; apparaatthermostaat/native schema leidend, waarschuwing per zone. |
| Cloudverbinding weg | Niet blijven schrijven of toggelen; toon laatst bevestigde status en verlies van bestuurbaarheid. |
| Opdracht niet bevestigd | Eén begrensde herhaling waar veilig, daarna zone blokkeren voor optimalisatie. Geen automatische netvoedingsreset. |
| Modus bevestigd, geen vermogensreactie | Niet meteen fout: het toestel kan zijn doel bereikt hebben of intern wachten. Beoordeel vraag, tijd, hvac_action en beschikbare vermogensmeting samen. |
| Handmatige wijziging | Tijdelijke handmatige voorrang; geen terugschrijfgevecht met de bewoner/merkapp. |
| Herstart HA/Node-RED | Herstel lokale voorkeuren en nog geldige handmatige eindtijden; lees nieuwe toestanden; bereken opnieuw. Geen oude actiequeue afspelen. |

Een recente waarde is iets anders dan een veranderde waarde. Bewaar waar mogelijk bevestigde bronupdates, integratiebeschikbaarheid en tijdstempels apart. Stel geldigheid af op de bron: P1 is snel, weersverwachtingen en Tado zijn langzamer.

Cloudgestuurde apparaten hebben niet automatisch een harde lokale terugval. Een Node-RED-timer kan bij volledige uitval geen herstelopdracht meer geven. Gebruik daarom apparaat-eigen tijdelijke overrides als die daadwerkelijk getest zijn; anders kan een blijvend setpoint achterblijven. Dit risico moet vóór automatische inzet per adapter zichtbaar en geaccepteerd zijn. ESS vervangt geen hardwarebeveiliging.

## 6. Dashboardontwerp

Behoud de huidige navigatie en compacte vormgeving. Alleen op **Systeem** uitgebreide alarmen; op **Klimaat** een korte status bij de betreffende zone.

- Bovenaan: regelstand, comfortprofiel, eerstvolgende actie, verwachte klimaat-kWh/kosten en weertrend.
- Per kamer: huidige temperatuur, gewenste band, trend, vocht indien aanwezig, handmatige eindtijd, status en reden. Bijvoorbeeld: 'Wacht tot 14:00: goedkoper uur; temperatuur blijft binnen comfortband'.
- Afzonderlijke kaarten voor warmtepompwater en tapwater, niet tussen kamertemperaturen. Warmtepompwater is in versie 1 voornamelijk informatief.
- Warmwaterkaart: actuele temperatuur, normaal doel, eventueel bufferdoel, volgende verwarmingsperiode, aanleiding (goedkoop/zon/accureserve/comfort), bevestiging en bron van de energieschatting. Toon 'Wacht op goedkope periode' los van 'Op temperatuur'.
- Eén gezamenlijke tijdlijn met prijs, buitenverwachting, geplande zones, tapwater en beschikbare accureserve. Detailniveaus inklapbaar.
- Duidelijk onderscheid tussen **gepland**, **opdracht verzonden**, **apparaatstand bevestigd**, **gemeten actief** en **onbekend**.
- Geen exact kWh-bedrag per ongemeten kamer suggereren: markeer schattingen en gedeelde metingen.
- Voorkeuren, schema's en installatiegrenzen lokaal buiten Git met reservekopie; neutrale rollen in publieke bestanden.

## 7. Historie en beoordeling

Bewaar per besluit: prognose-uitgiftetijd, temperatuurverwachting, all-in prijs, SOC, energiebudget, gekozen comfortband, actie en reden. Houd daarnaast temperatuurtrend, hvac_action, beschikbaarheid, daadwerkelijke stroom/energie, overrides en schakelmomenten bij.

Beoordeel ten minste: tijd buiten comfortband, temperatuurfout op gebruiksmoment, elektrische kWh, kosten, aantal starts/moduswissels, mislukte opdrachten en verschil tussen voorspelde en gemeten buitentemperatuur. Leer weerscorrectie afzonderlijk van de bestaande PV-correctie. Vergelijkingen van besparing moeten rekening houden met weer, bezetting en comfort; een dalende rekening is geen zelfstandig bewijs van regelwinst.

## 8. Bouwvolgorde en acceptatie

1. **Meetbasis herstellen:** bronlabels, werkelijke activiteit, informatieve warmtepomprol, vermogensmetergrenzen en koppeling van woonkamer/badkamer. Warmwatergrenzen, hygiënecyclus en bestaande EHS-/Tado-prioriteit vastleggen. Alleen-lezen gegevens gedurende meerdere dagen vastleggen.
2. **Schaduwmodus:** minstens een representatieve week plannen en loggen zonder opdrachten. Comfortbanden, prijs-/weerfouten en accubudget gezamenlijk beoordelen.
3. **Woonkamer en badkamer via Tado:** één zone tegelijk gecontroleerd vrijgeven, daarna gezamenlijk plannen. Eerst tijdelijke overrides en terugkeer naar het eigen schema testen. EHS volgt de normale ruimtevraag; geen afzonderlijke prijssturing van de stooklijn.
4. **Tapwater:** eerder verwarmen bij goedkope stroom/zon/ruime accureserve na verificatie van vatinstellingen, hygiënecyclus en gedeelde capaciteit. Eerst normale doeltemperatuur in tijd verschuiven; pas daarna eventueel een hoger bevestigd bufferdoel toelaten. Dit kan deels advies blijven als benodigde terugmeldingen ontbreken.
5. **Latere uitbreiding, niet in de eerste opdracht:** airco's, overige ruimten of adaptieve stooklijnregeling. Hiervoor opnieuw scope en apparaatvoorwaarden bevestigen.

Acceptatietests vóór vrijgave: goedkope stroom maar geen warmtevraag; hoge SOC maar weinig zon morgen; gelijktijdig EV/WIT/klimaat; overvolle individuele fase; terugkerende cloudfouten; stilstaande maar geldige temperatuur; raam open; handmatige wijziging; ontbrekende volgende-dagprijzen; zomer-/wintertijd; HA-herstart midden in een override; geen reactie op een setpoint; verboden tegengestelde modi op één buitenunit; behoud van instellingen na pull en koude herstart.

## 9. Nog te bevestigen

- Bevestigd: Tado stuurt de EHS aan en kent de kamertemperatuur; eerste scope is woonkamer, badkamer en tapwater.
- Welke afgiftezones/minimale doorstroming horen bij de twee ruimten, en wat is de bestaande prioriteit ten opzichte van tapwater? Bewegings-/raamsensoren alleen gebruiken na correcte ruimtekoppeling.
- Comfortband bevestigd voor beide kamers: minimaal 18, normaal 21, maximaal 22 °C. Gebruikstijden volgen voorlopig Tado; er is geen nieuw dag-/nachtschema afgesproken.
- Betekent de EHS-temperatuur aanvoerwater, retourwater of een andere water-/circuitgrootheid? Wat omvatten de twee energiemeters? Welk warmtepomp-/vatmodel en welke vatinhoud horen bij deze installatie?
- Zijn tijdelijke opdrachten en apparaat-eigen terugval beschikbaar en getest? Zijn de apparaatbeveiligingen en eventuele hygiënecycli gedocumenteerd?

Deze antwoorden blokkeren niet de inventarisatie en schaduwmodus, maar wel veilige automatische aansturing van de betreffende onderdelen.

## Bronnen

De lokale inventarisatie is de bron voor aangetroffen mogelijkheden en ontbrekende koppelingen. De volgende officiële documentatie onderbouwt de interfaces, niet de fysieke werking van deze installatie:

- [Home Assistant Climate](https://www.home-assistant.io/integrations/climate/): onderscheid modus/actie en beschikbare klimaatopdrachten.
- [Home Assistant Weather](https://www.home-assistant.io/integrations/weather/): uurverwachtingen ophalen via `weather.get_forecasts`; actuele weersattributen zijn niet de forecastreeks.
- [Home Assistant Tado](https://www.home-assistant.io/integrations/tado/): cloudintegratie, zonefuncties, polling en tijdelijke klimaatbediening.
- [Home Assistant SmartThings](https://www.home-assistant.io/integrations/smartthings/): mogelijkheden verschillen per gerapporteerde apparaatcapability; een heat-pump-zone is niet automatisch een kamertemperatuurregelaar.
