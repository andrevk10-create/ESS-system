# Node-RED-project installeren en beheren

## Vereisten

- een werkende Home Assistant-verbinding in Node-RED;
- `@flowfuse/node-red-dashboard`;
- `node-red-contrib-home-assistant-websocket`;
- recente Node.js/Node-RED-versies die moderne JavaScript-syntaxis ondersteunen.

## Installeren

1. Maak een Node-RED-back-up.
2. Installeer de vereiste nodes via **Manage palette**.
3. Importeer [../flows.json](../flows.json), of gebruik dit bestand als projectflow.
4. Open de Home Assistant-configuratienode en selecteer de lokale Home Assistant-server.
5. Deploy.
6. Open `/endpoint/ess/configuratie` op de Node-RED-host.
7. Schakel alleen aanwezige modules in, vul de fysieke grenzen in en kies eventueel **Automatisch koppelen**.
8. Controleer het voorstel, vul de resterende entiteitsrollen handmatig in en sla de configuratie op.
9. Controleer eerst alle metingen zonder automatische schrijfregeling.

## Lokale configuratie

De configuratiepagina bewaart de installatiegegevens standaard in:

```text
/config/node-red/ess-system-config.json
/config/node-red/ess-system-config.backup.json
```

Beide bestanden horen niet in Git. Ze kunnen lokale entiteits-ID's en daarmee indirect apparaat- of ruimtenamen bevatten. Het tweede bestand is een automatisch bijgewerkte volledige back-up van het eerste. De repository bevat alleen [../examples/ess-system-config.example.json](../examples/ess-system-config.example.json).

Bij deploy of herstart leest de flow eerst de back-up en daarna de hoofdconfiguratie. Het hoofdprofiel heeft daardoor voorrang; ontbreekt het, dan blijft het back-upprofiel actief. Een `git pull` raakt deze bestanden niet, zodat een eenmaal opgeslagen installatieprofiel automatisch terugkomt zonder herconfiguratie. Bij nieuwe configuratierollen vult de normalisatiestap alleen de ontbrekende neutrale standaardwaarde aan.

De configuratie bevat:

- zichtbare/actieve modules;
- netaansluiting en spanning;
- accu-, omvormer- en EV-grenzen;
- de gewenste netbuffer;
- een mapping van neutrale rollen naar echte Home Assistant-entiteiten.

Bij opslaan valideert Node-RED het formaat en controleert het of gekoppelde entiteiten in Home Assistant bestaan. Ontbrekende optionele modules mogen uitgeschakeld blijven. Automatische schrijfregelingen mogen pas worden ingeschakeld nadat de bijbehorende adapter en alle grenswaarden zijn getest.

**Automatisch koppelen** zoekt lokaal in de beschikbare Home Assistant-entiteiten. Exacte en bestaande koppelingen krijgen voorrang; daarna gebruikt de wizard apparaatkenmerken, domein, capabilities en meeteenheid. De wizard overschrijft geen bestaande geldige koppeling en schrijft het voorstel niet naar het configuratiebestand. Controleer de resultaten en gebruik **Opslaan** alleen wanneer de schrijfentiteiten en installatiegrenzen kloppen.

**Configuratie importeren** accepteert een volledig profiel of een deelprofiel. Een deelprofiel met alleen `entities`, `modules`, `specs` of `siteName` wordt met het geopende profiel samengevoegd. Zo kunnen enkele lokale koppelingen worden gecorrigeerd zonder de rest te wissen. Ook een deelimport wordt pas persistent na **Opslaan**.

## Flowindeling

De editor is in negen groepen verdeeld:

1. dashboarddata;
2. lokale configuratie;
3. EV slim laden;
4. optionele voertuigacties;
5. schakelbare verbruikers;
6. verlichting;
7. Nord Pool-prijzen;
8. klimaatbediening;
9. WIT-export, netladen en EV-buffer.

De dashboardgenerator staat in [../scripts/build-multipage-dashboard.js](../scripts/build-multipage-dashboard.js). Wijzig bij voorkeur de generator en genereer daarna `flows.json`, zodat een volgende generatie handmatige flowwijzigingen niet overschrijft.

## Veilig in bedrijf nemen

Controleer vóór automatisch regelen:

- of positief P1-vermogen werkelijk import betekent;
- of het accuvermogen het verwachte teken voor laden en ontladen heeft;
- of fasewaarden en totaalvermogen dezelfde richting gebruiken;
- of accucapaciteit, omvormerlimiet, BMS-limiet en hoofdzekering correct zijn;
- of de ingestelde laadpaalstroom daadwerkelijk wordt bevestigd;
- of stoppen, Standby en communicatiestoring veilig terugvallen;
- of de exportlimiet zich gedraagt zoals het exacte omvormermodel voorschrijft.

Begin met lage vermogens en toezicht. Home Assistant en Node-RED zijn geen elektrische beveiliging.

## Merkadapters

De dashboardmetingen zijn configureerbaar. Schrijfopdrachten zijn nu gericht op:

- Growatt WIT-entiteiten voor werkmodus, VPP, remote power en exportbegrenzing;
- Easee-services voor laadstroom, start/stop en fasekeuze;
- standaard Home Assistant-services voor switch, light, climate en water_heater.

Andere merken kunnen de neutrale dashboardrollen hergebruiken. Vervang voor bediening de actienodes door een adapter met dezelfde interne berichten en bevestigingsstatus. Laat een niet-passende schrijfmodule uitgeschakeld.

## Bijwerken

1. Maak een back-up van flows en lokale configuratie.
2. Haal de nieuwe commit op.
3. Bekijk de wijzigingen en voer `npm test` uit.
4. Genereer `flows.json` alleen als de generator gewijzigd is.
5. Deploy en controleer de configuratiestatus.
6. Test de belangrijkste stop- en fallbackpaden.

De optionele flow in [../node-red/flows/github-monitor.json](../node-red/flows/github-monitor.json) kan een nieuwe commit melden. Stel lokaal de repository in; de flow installeert niets automatisch.

## Problemen oplossen

- **Geen dashboarddata:** controleer de configuratiepagina, Home Assistant-servernode en ouderdom van de bronentiteiten.
- **Automatisch koppelen vindt niet alles:** dit is bewust; onzekere of dubbele kandidaten worden niet gekoppeld. Kies de echte entiteit handmatig en sla daarna op.
- **Waarde blijft oud:** controleer of de echte entiteit nog updates publiceert; oude data wordt bewust niet als actuele regeling gebruikt.
- **Opdracht zichtbaar maar apparaat reageert niet:** controleer adapter, apparaatmodus en bevestigingsentiteit. Het dashboard toont geen succesvolle opdracht zonder terugmelding.
- **Configuratie verdwijnt na herstart:** controleer of Node-RED beide configuratiepaden mag lezen en schrijven en of ten minste één JSON-bestand geldig is.
- **Automatische regeling blijft uit:** lees de getoonde beslisreden; ontbrekende SOC, prijzen, fasewaarden of verouderde telemetrie blokkeren veilig.

## Privacy

Voer vóór publicatie `npm test` uit. De privacycontrole zoekt onder meer naar lokale IP-adressen, e-mailadressen, Windows-gebruikerspaden, mogelijke voertuig-ID's en bekende niet-neutrale entiteitsnamen. Controleer daarnaast handmatig screenshots, Git-metadata en oude commits. Een nieuwe opgeschoonde repository is de veiligste publicatieroute wanneer eerdere commits privégegevens bevatten.
