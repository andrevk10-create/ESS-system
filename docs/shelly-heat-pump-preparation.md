# Shelly voorbereiden voor radiatorpomp en warmtevraag

De Git-flow bevat een voorbereiding onder **Klimaat → Klimaatinstellingen**.
Deze staat standaard uit. **Schaduwmodus** leest de contacten en sensoren en
toont een voorgestelde volgorde; zij verstuurt geen Shelly-opdrachten. Het is
nog geen in bedrijf gestelde pomp-/warmtepompregelaar. De bestaande
HomeKit/Tado-regeling, thermostaatdoelen en tapwaterregeling blijven leidend.

## Voorbereide koppelingen

| Functie | Verwachte HA-entiteit | Gebruik |
|---|---|---|
| Radiatorcirculatiepomp | `switch.*` | Afzonderlijk pompcontact; geen compressorvoeding |
| Warmtevraag | andere `switch.*` | Afzonderlijk contact voor de geschikte warmtevraag-ingang |
| Temperatuurkanaal 1–3 | drie verschillende `sensor.*`, °C | Meetlocatie per kanaal expliciet invullen |
| Shelly BLU | `sensor.*` voor temperatuur, vocht en batterij | Alleen metingen; ontbrekende velden mogen leeg blijven |
| H&T / display | `sensor.*` voor temperatuur, vocht en batterij | Alleen metingen, geen fictief thermostaatdoel of display-opdracht |

Entity-ID's, namen en locaties blijven in de private klimaatvoorkeuren met
primaire/reservekopie. Een oud profiel krijgt lege koppelingen en de stand uit.
Er worden geen Shelly's op naam, volgorde of IP-adres automatisch toegewezen.
Aanvoer, retour, vat of andere locaties worden niet gegokt.

## Schaduwcontrole

De schaduw volgt uitsluitend de actuele bevestigde warmtevraag uit de bestaande
kamerregeling. BLU/display vervangen die thermostaat en zijn doel niet. Bij
complete koppelingen stelt de schaduw eerst de radiatorpomp voor. Warmtevraag
wordt pas voorgesteld na verse pomp-aan-terugmelding en de ingestelde voorloop
(voorlopig 30 seconden). Na wegvallen van de vraag wordt een naloop voorgesteld
(voorlopig 180 seconden). Een procesgat, herstart of gewijzigde koppeling mag
geen oude pompbevestiging overnemen. Dit is een softwarevoorbeeld van de
volgorde; een relais-aan-terugmelding bewijst geen debiet.

Alle drie de watermetingen en hun locaties zijn nodig voor deze schaduwcontrole.
Waarden zonder °C, buiten het meetbereik of ouder dan standaard 15 minuten
worden als ontbrekend getoond. BLU/H&T gebruiken een aparte, instelbare
meetleeftijd van standaard 120 minuten omdat batterijapparaten kunnen slapen.
Daaruit volgt geen toestemming voor automatische warmtevraag.

## Nog nodig vóór echte bediening

- Exacte Shelly-modellen, contacttype en passende belastbaarheid vaststellen.
- Vastleggen welk contact de radiatorpomp bedient en welk contact de EHS-
  warmtevraag-ingang; geen schakeling van de warmtepompnetvoeding.
- Locatie en type van de drie temperatuurkanalen vastleggen. Voor automatische
  temperatuurgrenzen is deze betekenis nodig; generieke probegrenzen zijn geen
  installatiebeveiliging.
- Minimale doorstroming, beschikbare radiatorkleppen, voor-/naloop,
  compressorbeveiliging en tapwaterprioriteit op de installatie afstemmen.
- Lokale, geteste uitschakeltimers en gedrag bij verlies van HA/Node-RED
  vastleggen. Eerst een afzonderlijke live adapter implementeren en testen.
- Verifiëren welk BLU/H&T/display-model aanwezig is en of alleen metingen of
  ook een echte bedienbare thermostaat wordt gewenst. Een H&T-display is niet
  automatisch een thermostaat.

## Home Assistant-koppeling

Wi-Fi-Shelly-relais worden normaal via de lokale
[Shelly-integratie](https://www.home-assistant.io/integrations/shelly/) gekoppeld.
Shelly BLU H&T gebruikt via Bluetooth de
[BTHome-integratie](https://www.home-assistant.io/integrations/bthome/).
De [BLU H&T Display ZB](https://shelly-api-docs.shelly.cloud/docs-ble/Devices/BLU_ZB/ht_display/)
heeft temperatuur/vocht/lichtmetingen en BLE/Zigbee; de gekozen HA-koppeling
hangt van het werkelijke model en protocol af. Batterijapparaten worden niet
geforceerd gepolld om een ontbrekende meting kunstmatig vers te maken.

Controle: `tests/shelly-heat-pump.js`, de bestaande klimaattests en de volledige
flow-/dashboardvalidatie. Fysieke werking is niet getest en er is niet live
uitgerold.
