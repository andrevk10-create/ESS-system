# Controle van metingen, prognoses en kosten

## Gecorrigeerd

- **Verbruiksverwachting morgen:** woning plus gepland netladen van Audi en Jeep.
  Extra zonneladen van de auto's is niet in die gedeeltelijke raming opgenomen.
  Geplande WIT-opslag
  staat apart; het is geen extra eindverbruik en geen berekende netafname.
  Laadblokken worden op werkelijke overlap met de kalenderdag verdeeld,
  inclusief de 25-uurs wintertijddag. Verouderde plannen blijven onbekend.
- **Autokosten:** de weergave benoemt het bekende, geschatte netaandeel en
  toont daarnaast laadpaal-kWh, gewaardeerde kWh en niet gewaardeerde kWh.
  Ontbrekende historische metingen of tarieven worden niet aangevuld met
  fictieve prijzen. Opgeslagen bedragen en ERE-beginstanden blijven behouden.
- **Dagmeting laadpaal:** een Easee-kostensensor kan een afzonderlijk attribuut
  `cost_day_totalEnergyUsage` bevatten. Dat attribuut wordt apart behandeld;
  de euro-waarde wordt nooit als energie gebruikt. Generieke sessie- of
  levensduurtellers worden niet automatisch als dagteller ontdekt.
- **Accusaldo:** de huidige schatting is vermeden netafname minus geregistreerde
  netlaadkosten. Een minbedrag kan ontstaan vóór latere ontlading. Het is geen
  complete rendementsberekening; verliezen en gemiste terugleververgoeding
  zijn niet volledig verwerkt. Een streepje betekent onbekend, niet nul.
- **Dekking:** meetgaten worden voortaan ook per auto en voor het accusaldo
  bijgehouden. Lange onderbrekingen verschijnen op de betreffende kalenderdag,
  zonder energie of kosten over het gat te interpoleren. Oude registratie
  krijgt niet achteraf het predicaat volledig.
- **Controle koppelingen:** het dashboard beoordeelt de aanwezige entiteiten
  opnieuw, zodat een oude controle tijdens een HA-herstart niet blijft staan.
  Dagenergiemeters met onbruikbare eenheden worden herkend. Bestaande private
  koppelingen worden niet automatisch vervangen.
- **Dashboardopbouw:** dubbele kopieën en herhaalde aanroepen van dezelfde
  kwaliteitsberekening worden verwijderd. Opnieuw opbouwen houdt één kopie.
- **Gedeeld laadvermogen:** de laadtijd van beide auto’s gebruikt een gedeeld
  budget op basis van aansluiting, één ampère marge per fase en verwacht
  woningverbruik. De WIT-planning trekt per kwartier de autoplannen hiervan af.
  Ook een directe laadopdracht en éénfasige auto worden conservatief meegenomen.
  Handmatig acculaden kan daardoor later beginnen en langer duren. De werkelijke
  faseverdeling, pieken, zon en terugregeling blijven onder de bestaande
  Equalizer-, P1- en BMS-beveiliging vallen; de voorspelling is geen garantie.

De betekenis van de Easee-attributen is gecontroleerd in de
[integratiebron](https://github.com/nordicopen/easee_hass/blob/master/custom_components/easee/const.py).
Easee meldt energie en bedragen apart in zijn
[verbruiks-API](https://developer.easee.com/reference/chargingsessionscharger_gettotalkwhamountbycharger).
Een bedrag uit die API gebruikt niet vanzelf de eigen dynamische ESS-prijzen.

## Grenzen van de controle

De bestaande WIT-, net-, BMS-, SOC-, fase-, klimaat- en EV-regressies zijn
meegenomen. Deze controle bewijst geen fysieke kalibratie van meters. De
laatst uitgelezen configuratie bevatte ook ontbrekende Audi-voertuigbronnen;
die HA-integratie of private koppeling moet bij de bron hersteld worden.
Software mag daarvoor geen actuele SOC verzinnen.

De bestaande kostenhistorie is gedeeltelijk. Zonder volledige historische
laadmetingen, tariefkwartieren en bronverdeling is geen exact laadtotaal
achteraf vast te stellen. Deze update bewaart de historie en maakt die
onzekerheid zichtbaar, in plaats van een sluitend bedrag te suggereren.

Controle: volledige testsuite, `measurement-accounting-audit.js`, weergave van
alle dashboardpagina's met normale/lege/offline gegevens en herhaalde opbouw.
Geen actieve HA-instellingen of fysieke apparaten zijn gewijzigd.
