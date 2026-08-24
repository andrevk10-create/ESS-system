# Dashboard-datamodel en entiteitsrollen

## Principe

De flow vertaalt lokale Home Assistant-entiteiten eerst naar neutrale rollen. Dashboard- en regelcode gebruiken daarna alleen die rollen. Daardoor kunnen andere installaties dezelfde flow gebruiken zonder entiteitsnamen in de repository te wijzigen.

De lokale mapping staat in `ess-system-config.json` en wordt via `/endpoint/ess/configuratie` beheerd. Het bestand blijft buiten Git. De automatische koppelwizard kan op basis van de actuele Home Assistant-status een voorstel maken. Bestaande geldige mappings blijven staan en een voorstel wordt pas persistent nadat de gebruiker **Opslaan** kiest.

## Hoofdmodel

Het centrale dashboardbericht bevat conceptueel:

```json
{
  "updatedAt": "ISO-datum",
  "configuration": { "config": {}, "status": {} },
  "grid": { "power": 0, "importing": 0, "exporting": 0, "phases": [] },
  "solar": { "power": 0, "today": 0, "forecastToday": 0, "forecastTomorrow": 0 },
  "house": { "power": 0, "forecastBaseTomorrow": 0, "evPlannedTomorrow": 0, "witPlannedTomorrow": 0, "forecastTomorrow": 0 },
  "battery": { "soc": 0, "power": 0 },
  "wit": { "power": 0, "gridCharge": {}, "exportLimit": {} },
  "chargers": [],
  "loads": [],
  "lights": [],
  "climate": [],
  "system": { "issues": [], "dataQuality": [] }
}
```

Sommige interne velden hebben om migratieredenen nog oudere namen. Externe configuratie hoort daar niet van afhankelijk te zijn; gebruik de dashboardbediening en de gedocumenteerde Home Assistant-historiesensoren.

## Configureerbare rollen

### Net en P1

| Neutrale rol | Betekenis |
| --- | --- |
| `sensor.p1_meter_vermogen` | Totaal netvermogen; positief is import. |
| `sensor.p1_meter_vermogen_fase_1..3` | Vermogen per fase met dezelfde tekenrichting. |
| `sensor.p1_meter_energie_import` | Cumulatieve afgenomen energie. |
| `sensor.p1_meter_energie_export` | Cumulatieve teruggeleverde energie. |

### Accu en omvormer

| Neutrale rol | Betekenis |
| --- | --- |
| `sensor.growatt_battery_battery_soc` | Thuisaccu-SOC in procent. |
| `sensor.growatt_battery_battery_power` | Actueel accuvermogen. |
| `sensor.growatt_load_house_consumption` | Omvormer-loadmeting; niet zonder controle als totale woningmeting gebruiken. |
| `sensor.growatt_solar_solar_total_power` | PV-vermogen op de hybride omvormer. |
| `sensor.growatt_solar_system_output_power` | Actueel omvormeruitgangsvermogen. |
| `sensor.growatt_solar_energy_today` | Omvormer-PV-energie vandaag. |
| `sensor.growatt_grid_grid_power` | Snelle lokale netmeting van de omvormer. |

De WIT-schrijfroutes gebruiken daarnaast configureerbare rollen voor control authority, export limit, remote power, werkmodus, VPP-modus, opdrachtduur en laad/ontlaad-SOC-grenzen. De gekozen echte entiteiten moeten de keuzen en eenheden van de gebruikte Growatt-integratie volgen.

### EV-laadpunt en auto

| Neutrale rol | Betekenis |
| --- | --- |
| `sensor.ev_charger_status` | Aangesloten/laadt/gestopt-status. |
| `sensor.ev_charger_power` | Werkelijk laadvermogen. |
| `sensor.ev_charger_current` | Werkelijke of gerapporteerde laadstroom. |
| `binary_sensor.ev_charger_online` | Bereikbaarheid laadpunt. |
| `sensor.ev_state_of_charge` | Actuele voertuig-SOC. |
| `sensor.ev_target_state_of_charge` | Doel-SOC uit de voertuigkoppeling. |
| `device_tracker.ev_position` | Optioneel; alleen nodig voor locatieafhankelijke voertuigacties. |

### Zon en prijzen

- `sensor.pv_array_1_power..3`: actueel vermogen van aanvullende PV-omvormers.
- `sensor.energy_production_today`, `_2`, `_3`: Forecast.Solar voor vandaag.
- `sensor.energy_production_tomorrow`, `_2`, `_3`: Forecast.Solar voor morgen.
- `sensor.nord_pool_nl_huidige_prijs`: actuele prijs en prijsattributen.

Ontbrekende tweede of derde bronnen mogen op een niet-bestaande neutrale entiteit blijven staan; de flow telt alleen geldige metingen.

### Overige modules

- één configureerbare `switch.flex_load_1` en zeven vermogensrollen;
- vier koelzones, drie verwarmingszones, een warmtepomp en tapwater;
- acht lichtzones;
- optionele buiten-/weersensoren;
- optionele CPU-, geheugen-, temperatuur-, netwerk-, opslag-, schijf-, beveiligings- en update-entiteiten voor een NAS.

## Eenheden en tekens

- vermogen wordt intern in watt verwerkt;
- energie in kWh;
- stroom in ampère;
- SOC en limieten in procent;
- prijs in euro per kWh;
- positief P1-netvermogen betekent import en negatief betekent export;
- de accutekenrichting moet tijdens inbedrijfstelling worden gecontroleerd.

Een bron met kW wordt waar nodig naar watt omgerekend. Een onrealistische omvormerschaal wordt alleen gecorrigeerd wanneer onafhankelijke metingen dit ondersteunen; de correctie verschijnt als datakwaliteitsmelding.

## Totale woningbalans

De totale woningvraag wordt afgeleid uit de energiebalans rond de P1-meter, PV, accu en EV. De losse omvormer-loadsensor wordt als diagnostische vergelijking bewaard, omdat die in sommige installaties alleen het backup/load-circuit ziet.

De verwachting voor morgen bestaat uit:

```text
geleerde normale woningvraag
+ geplande EV-laadenergie van morgen
+ geplande WIT-netlaadenergie van morgen
```

Werkelijk EV-laden wordt uit de leerbasis gehaald om dubbeltelling te voorkomen. Alleen dagen met voldoende geldige meetdekking tellen mee; tot die tijd wordt een conservatieve profielreserve gebruikt.

## EV-planning

De EV-regelaar beoordeelt minimaal iedere minuut:

- aansluiting en online-status;
- actuele of geschatte SOC;
- vertrekdoel, zonnedoel en vertrektijd;
- netto zonne-overschot;
- all-in kwartierprijzen;
- P1-faseruimte en hoofdzekering;
- werkelijk bevestigd laadvermogen;
- minimale blokduur en herstelstatus.

De prijsplanning kiest de goedkoopste benodigde kwartieren. Het zonne-aandeel wordt conservatief afgetrokken van wat nog nodig is. Direct laden omzeilt de prijsselectie maar nooit elektrische limieten. Een opdracht geldt pas als werkelijk laadvermogen of een passende laadstatus haar bevestigt.

## WIT-exportbegrenzing

In automatisch bedrijf wordt de begrenzing onder de ingestelde SOC-grens gebruikt en bij voldoende SOC weer uitgeschakeld. De volgorde is bewust gespreid over regelcycli:

1. control authority inschakelen;
2. exportpercentage instellen;
3. export limit inschakelen.

Een aangesloten EV die zijn zonnedoel nog niet heeft bereikt kan voorrang krijgen, waardoor de automatische exportlimiet tijdelijk uit blijft. Handmatige aan/uit-bediening overschrijft dit totdat **Automatisch** wordt gekozen. Oude accu- én omvormertelemetrie blokkeren automatische opdrachten.

## WIT slim netladen

De energiebalans is:

```text
energie nodig voor doel-SOC
- bruikbare actuele accu-energie na woningreserve
- conservatief verwacht zonneladen na laadverlies
= nog via het net te laden energie
```

Alleen dit tekort wordt over rendabele goedkope kwartieren in het komende etmaal verdeeld. Laadverlies, slijtage, beschikbare P1-faseruimte, de configureerbare installatiegrens en lagere live BMS/WIT-limieten blijven leidend. EV-kwartieren worden uitgesloten. De planner kan ook overdag laden voor de daaropvolgende nacht en rekent bij nieuwe gegevens opnieuw.

Starten gebeurt gecontroleerd: conflicterende exportregeling uit, laadpercentage zetten, daarna werkmodus `Charge`. Stoppen zet een door Smart ESS gestarte sessie terug naar `Standby` en vervolgens naar 0%. Een externe sessie wordt niet overgenomen.

## Extra accu-ondersteuning tijdens EV-laden

De WIT mag alleen extra ontladen wanneer:

- Smart ESS de EV-laadsessie aanstuurt;
- slim netladen niet actief is;
- de accu boven de veilige profielgrens zit;
- de voorspelde zon voldoende energie laat om de accu weer tot het profieldoel te laden;
- het resterende budget na woningreserve positief is;
- P1-, SOC-, laad- en omvormerdata vers zijn.

**Eco** bewaart de grootste reserve, **Normaal** een gemiddelde reserve en **EV voorrang** de kleinste toegestane reserve. Opdrachten zijn kort geldig en moeten worden vernieuwd, zodat uitval vanzelf stopt.

## Historie en effectmeting

Node-RED publiceert sensoren voor:

- gevraagd en werkelijk WIT-vermogen;
- werkelijk EV- en P1-vermogen;
- veilig ontlaadbudget en actief reserveprofiel;
- gepland netlaadtekort, verwachte zonnebijdrage en kosten;
- verwachte woningbasis en geplande EV-/WIT-energie voor morgen;
- gisteren vastgezette zonverwachting, werkelijke productie, afwijking, realisatie en correctiefactor;
- status en beslisreden van de regelingen.

Home Assistant Recorder bepaalt de bewaartermijn. De numerieke sensoren gebruiken waar mogelijk `state_class: measurement` voor langetermijnstatistieken.

## Datakwaliteit en veilige fallback

Elke relevante bron krijgt een ouderdomscontrole. Automatische bediening stopt of start niet wanneer benodigde waarden ontbreken, te oud, onbekend of fysiek onwaarschijnlijk zijn. Het dashboard toont dan **Niet beschikbaar** en een concrete reden in plaats van nul als geldige meting te suggereren.

De volgende situaties blokkeren in elk geval een schrijfopdracht:

- ongeldige doelentiteit;
- ontbrekende SOC of installatiegrens;
- geen verse net-/fase-informatie wanneer die voor de limiet nodig is;
- conflicterende actieve WIT-regeling;
- laadpunt offline of voertuig losgekoppeld;
- geen bevestiging na het beperkte herstelpad.
