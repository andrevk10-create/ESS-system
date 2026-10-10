# Jeep Avenger op Easee rechts

De rechter laadpaal heeft een eigen regeling, naast de Audi op links. Beide gebruiken dezelfde vertrekplanning op kwartierprijzen, extra laden op zon, fasekeuze, controle op werkelijk laden en tijdelijke modus om direct tot 100% te laden. De rechter regeling gebruikt een accu van 54 kWh, maximaal 16 A en een gepland netlaadvermogen van 11 kW. Deze grenzen zijn apart instelbaar op Configuratie.

## Koppelen en gebruiken

1. Koppel op Configuratie de rollen `sensor.ev_charger_2_status`, `sensor.ev_charger_2_power`, `sensor.ev_charger_2_current`, `binary_sensor.ev_charger_2_online` en eventueel `sensor.ev_charger_2_energy_today` aan Easee rechts. Controleer dat de statusentiteit een andere Easee-ID bevat dan links.
2. Sla de configuratie op. De regeling voor rechts begint uitgeschakeld.
3. Sluit de Jeep aan en vul op Auto de actuele accustand in.
4. Kies vertrek-SOC, vertrektijd en maximale SOC voor extra laden op zon. Zet daarna slim laden aan of kies direct laden tot 100%.

Jeep-inloggegevens zijn niet nodig. De accustand is een schatting op basis van de ingevulde stand en het gemeten laadvermogen, met 92% laadefficiëntie. Vul bij elke aansluiting een nieuwe stand in. Loskoppelen wist de stand; na 12 uur moet deze opnieuw worden bevestigd. Ook na een koude Node-RED-herstart is een nieuwe stand nodig. De laadgrens in de auto blijft leidend: de regeling past geen Jeep-instellingen aan.

Vertrekdoel, zonne-SOC, vertrektijd en de keuze voor slim laden worden per auto buiten Git opgeslagen in het bestaande laadvoorkeurenbestand. Oudere bestanden zonder tweede auto blijven bruikbaar. De tijdelijke 100%-modus en de handmatige SOC worden niet op schijf bewaard.

## Beide auto's tegelijk

Extra WIT-ontlading kan zowel de Audi als de Jeep ondersteunen. Eén gezamenlijke WIT-sessie gebruikt de gemeten laadbehoefte van beide auto's. De bestaande reserveprofielen, minimale thuisaccureserve, BMS-grenzen en ingestelde maximale ontlaadsterkte blijven gelden. Alleen aangesloten auto's die aantoonbaar onder ESS-regeling laden tellen mee; oude Jeep-metingen geven geen extra ontlaadvraag.

De Easee Equalizer blijft de beschikbare stroom bewaken. De regeling gebruikt daarnaast de getekende P1-fasemetingen en reserveert nog niet gemeten, aangevraagd vermogen voor de andere auto. Zo vragen twee starts niet dezelfde vrije stroomruimte aan. Gemeten verbruik wordt eenmaal meegeteld; onbekend verbruik geeft geen extra ruimte. De ingestelde hoofdzekering wordt gebruikt met 3 A marge per fase.

Vertraagde Jeep-opdrachten worden opnieuw gecontroleerd op de actuele koppeling. Ze mogen niet naar links gaan en mogen een uitgeschakelde regeling niet opnieuw starten. Audi-voertuigacties voor klimaat en vergrendeling blijven bij de Audi.
