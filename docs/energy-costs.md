# Kwartierkosten en opbrengsten

Het overzicht toont netafnamekosten, geschatte accubesparing, afzonderlijke
laadkosten voor Audi en Jeep, basis-terugleveropbrengst en geschatte ERE-opbrengst.
Dagbedragen en cumulatieve bedragen beginnen bij de eerste geldige registratie.
Er worden geen historische bedragen ingevuld zonder historische metingen.

## Berekening

De dashboardmapper integreert vers gemeten vermogen tussen opeenvolgende
meetmomenten. Intervallen langer dan twee minuten worden niet ingevuld. Elk
interval wordt op kwartiergrenzen gesplitst en tegen de prijs van dat kwartier
afgerekend. Negatieve prijzen blijven negatief. Vermogensintegratie is een
berekening, geen vervanging voor de factuur of een gecertificeerde kWh-meter.
Ontbrekende prijzen of metingen worden als ontbrekende dekking geregistreerd.

Netafnamekosten omvatten alle afgenomen elektriciteit, inclusief autoladen en
netladen van de accu. Laadkosten schatten het netaandeel per laadpunt: positieve
netafname wordt evenredig over het totale actuele woningverbruik verdeeld.
Direct verbruikte zon en accu-ontlading krijgen geen actueel nettarief. Bij
teruglevering zijn de laadkosten nul. Het betreft een schatting van de verdeling,
omdat de bron van stroom per laadpunt niet afzonderlijk wordt gemeten.
Tel deze bedragen niet nog eens bij netafnamekosten op. Ontbrekende bronmetingen
geven onbekende laadkosten; de totale laadenergie blijft wel geregistreerd.

Bij overgang van registerversie 1 naar 2 blijven energie, netkosten en ERE behouden.
De oude laadwaarderingen blijven apart bewaard als `legacyChargingCosts`.
Nieuwe laadkostentellers beginnen bij `chargingCostStartedAt`; historische
laadbedragen kunnen zonder bronmetingen niet betrouwbaar worden herberekend.

Accubesparing vergelijkt de gemeten netafname met berekende netafname zonder de
gemeten accustroom. Extra netafname voor acculaden verlaagt de besparing. Dit is
een schatting: slijtage, omvormerverliezen en de gemiste terugleververgoeding
zijn niet opgenomen. Energie uit de accu die al vóór registratie geladen was
heeft geen historische laadkosten in dit overzicht.

## Direct laden versus slim laden

Per laadpunt wordt een waargenomen overgang van losgekoppeld naar aangesloten
vastgelegd, met de op dat moment beschikbare kwartiertarieven. De vergelijking
gebruikt dezelfde werkelijk geregistreerde geladen energie, maar rekent die
vanaf de aansluiting door tegen het ingestelde laadvermogen van de auto.
Dit referentiescenario veronderstelt volledig netladen. Het betreft de huidige of laatst geregistreerde sessie, geen gegarandeerd
historisch resultaat. Een auto die bij de start al aangesloten is, ontbrekende
prijzen en gemiste aansluitovergangen geven geen fictieve besparing.

## Teruglevering en ERE

De basis-terugleveropbrengst voor Zonneplan gebruikt de Nord Pool-marktprijs
inclusief 21% btw plus €0,02/kWh. Dit omvat geen jaarlijkse saldering en geen
voorwaardelijke 10%-bonus. De [Zonneplan-uitleg](https://www.zonneplan.nl/energie/informatie-over-energiecontracten/terugleververgoeding-bij-zonnepanelen)
vermeldt deze verschillen; de extra bonus kent onder meer een jaargrens.

ERE wordt voor beide laadpunten geschat tegen een instelbaar **netto** tarief,
aanvankelijk €0,10/kWh. Servicekosten worden niet nogmaals afgetrokken.
[Lekkerladen](https://www.lekkerladen.com/) vermeldt dat koersen en uiteindelijke
opbrengsten variëren. Deze weergave is geen bevestigde inboeking, MID-registratie
of uitbetaling, en importeert geen bestaande Lekkerladen-opbrengsten.
Een bestaande Lekkerladen-stand kan wel expliciet worden ingevoerd via
`Kosten en opbrengsten` (kWh en eurobedrag), of eenmalig worden ingelezen uit
`/config/node-red/ess-ere-opening-balance.json`. Het privébestand bevat `at`
(ISO-tijdstip), `kwh` en `euros` en hoort niet in Git. Plaats het bij deployment
naast het privévoorkeurenbestand. Opnieuw inlezen overschrijft geen al opgeslagen
beginstand. Het oorspronkelijke bedrag blijft behouden; alleen nieuwe gemeten
laadenergie wordt tegen het netto schattingstarief toegevoegd. Er wordt geen
servicefee opnieuw afgetrokken en geen verdeling van de historische beginstand
over Audi en Jeep verzonnen. Bij een beginstand midden in een al geregistreerd
kwartier telt pas het volgende volledige kwartier mee, om dubbeltelling te voorkomen.

De autokaarten tonen dagkosten en cumulatieve laadkosten sinds registratie.
Ontbrekende kwartierprijzen worden niet vervangen door nulprijzen.

## Bewaren

Het compacte register wordt elke minuut via het bestaande privévoorkeurenbestand
en de reservekopie bewaard. Cumulatieve totalen blijven behouden; de laatste
32 dagtotalen en 192 kwartieren zijn beschikbaar in `ess_energy_cost_ledger`.
Na een herstart begint een nieuwe meetreeks zonder de offline periode op te vullen.
Er worden geen kosten, prijzen of privégegevens terug naar Git geschreven.
