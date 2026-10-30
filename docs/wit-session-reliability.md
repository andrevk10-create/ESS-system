# Laadsessies herstellen en Nu laden laten doorlopen

## Achtergebleven besturingsbevoegdheid

Een verlopen ESS-laadopdracht kan afstandsbediening uit laten staan terwijl de
besturingsbevoegdheid nog aan staat. Een tijdelijke fout kon daardoor blijven
wachten op volledige vrijgave. Automatisch en Nu laden mogen deze toestand nu
vrijgeven als een bevestigde ESS-opdracht van hetzelfde apparaat en dezelfde
integratie vlak voor de fout is opgeslagen. Twee afzonderlijke verse
registermetingen moeten afstandsbediening uit, bevoegdheid aan, een lease van
twee minuten en geen externe tijdplanning bevestigen. De fout moet minimaal
vijf minuten oud zijn; vrijgavepogingen liggen minimaal vijftien minuten uiteen.

De bestaande vrijgaveprocedure controleert daarna beide uit-standen met nieuwe
registermetingen. Pas daarna kan het bestaande foutherstel de fout wissen.
Vervolgens bepaalt de actuele planning of laden nodig en toegestaan is.
Onbekende opdrachten, actieve externe bediening, gewijzigde koppelingen en
externe tijdplanningen geven geen toestemming voor deze automatische vrijgave.

Laadbeslissingen worden daarnaast direct als JSON-regels opgeslagen in
`/config/node-red/ess-wit-audit-YYYY-MM-DD.jsonl` (UTC-datum), buiten Git.
Deze dagbestanden bevatten ook foutreden en de relevante besturingsregisters.
Ze blijven bij herstart beschikbaar, ook wanneer de laatste 512 gebeurtenissen
in het geheugen zijn overschreven. Dagbestanden worden toegevoegd en niet
automatisch verwijderd; neem ze mee in lokaal opslagbeheer en back-ups.

## Expliciet Nu laden

Nu laden toont een aaneengesloten plan voor de benodigde netenergie tot het
ingestelde SOC-doel, in plaats van alleen het lopende kwartier. De raming wordt
steeds opnieuw berekend met de werkelijke SOC. Laadvermogen, BMS, netruimte,
zon en woningverbruik bepalen de werkelijke eindtijd. Een onbekend tarief
wordt niet als gratis laden weergegeven. De raming is maximaal 24 uur lang.

Bij een onbekende, korte externe sessie kan deze expliciete laadkeuze een
overdracht aanvragen. Daarvoor zijn twee verschillende registeruitlezingen
van hetzelfde gekoppelde apparaat nodig, minstens 15 seconden uit elkaar,
met een lease van twee minuten en zonder externe tijdplanning. Een veranderend
vermogenspercentage laat die controle niet langer telkens opnieuw beginnen.
Met de bestaande uitlezing om de minuut duurt die observatie normaal één minuut.

De overdracht schakelt eerst de besturingsbevoegdheid uit en vervolgens de
afstandsbediening. Bij ingeschakelde registercontrole zijn nieuwe echte
uit-metingen nodig; een succesvolle service-aanroep alleen volstaat niet.
Tijdens overdracht wordt niet geladen. Er is één begrensde herstelpoging per
handmatige keuze; mislukte vrijgave leidt niet tot eindeloos herschrijven.
Een gewijzigd apparaat of een verschenen tijdplanning stopt de overdracht.

## Herstart en Automatisch

De private laadvoorkeuren en reservekopie bewaren nu de bevestiging van een
door ESS geschreven laadopdracht, de integratie- en apparaatidentiteit,
vrijgavebevestigingen en geclassificeerde fouten. Schrijf- en vrijgaveresultaten
vragen direct opslag aan. Er wordt geen opdrachtwachtrij, actieve sessie of
verondersteld eigenaarschap van schijf hersteld.

Alleen een recente bevestigde ESS-opdracht mag opnieuw worden herkend bij
overeenkomende verse registers, dezelfde koppeling en hetzelfde vermogen,
zonder latere vrijgave, externe tijdplanning, fout of andere actieve ESS-regelaar.
De bestaande leeftijdsgrens van twintig minuten blijft gelden. Automatisch
neemt geen onbewezen externe opdracht over. Het blijft economische laaduren
kiezen; het garandeert niet dat de accu iedere kalenderdag 100% bereikt.

Een timeout van transport of vrijgave mag, net als een tijdelijke ontbrekende
terugmelding, herstellen nadat de hardware aantoonbaar vrij is: tien minuten
afkoeling, twee afzonderlijke verse uit-metingen en maximaal één automatisch
herstel per uur. Geen gemeten laadvermogen, Modbus-schrijfproblemen,
fasecontrolefouten, externe schema's en gewijzigde koppelingen vallen daar
niet onder. Fouten en beschermingen worden niet blind gewist.

## Controle

Tests omvatten koude herstart, opgeslagen bewijs, gewijzigde identiteit en
vermogen, latere vrijgave, harde fouten, wisselende setpoints, twee native
uit-bevestigingen, doorlopend handmatig plannen, onbekende prijzen en de
bestaande SOC-, BMS-, net- en Power Imbalance-controles. Ook is de eerder
gelezen privésituatie lokaal vergeleken: de nieuwe code begint met vrijgeven
waar de vorige code bleef wachten. Dit is geen fysieke inbedrijfstelling;
er is alleen in Git gewijzigd.
