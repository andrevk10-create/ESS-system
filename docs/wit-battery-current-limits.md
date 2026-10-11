# WIT-stroomgrenzen

De controle van 11 oktober 2026 vond twee afzonderlijke grenzen:

- VPP-input 31210–31213: maximaal toegestaan laad- en ontlaadvermogen, twee unsigned 32-bit waarden met schaal 0,1 W. Gemeten: beide 13.056 W.
- Native holding 910/911: ingestelde maximale laad- en ontlaadstroom, schaal 0,1 A. Gemeten: beide 150 A.

Het grotere toegestane vermogen heft de ingestelde stroomgrens niet op. Daarnaast stond deze installatie in ESS op maximaal 8 kW laden en ontladen. De combinatie verklaart waarom een opdracht vanuit ESS niet richting 240 A ging. Nog niet vastgesteld is of de firmware/BMS een wijziging van de native instelling terugzet naar 150 A. Er is geen stroomgrens geschreven tijdens deze controle.

De vervolguitlezing bij 89% SOC liet een dynamische verlaging zien: maximaal laadvermogen ongeveer 8.070–8.130 W, terwijl ontladen ongeveer 12.912–13.008 W bleef. Tegelijk veranderde legacy input 3219 van 2400 naar 1500, terwijl 3220 op 2400 bleef. Vermogen gedeeld door de bijbehorende accuspanning correspondeert nu met 150 A laden en 240 A ontladen. Daarmee is de veronderstelling dat de accu voortdurend 240 A laden toestaat onjuist. Temperatuur: 24 °C; de uitgelezen legacy fout-/beperkingsvelden waren nul. Die nulwaarden bewijzen niet dat alle firmware-specifieke beperkingsredenen beschikbaar zijn. SOC/celbalancering is een mogelijke verklaring, geen vastgestelde oorzaak.

Holding 974/975 stonden beide op 180 (18 kW): de afzonderlijke ingestelde vermogensgrens was dus niet de beperkende 8 kW. De gebruiker koos expliciet eerst verdere verificatie; holding 910/911 zijn ongewijzigd gebleven.

De regeling leest beide soorten grenzen iedere 60 seconden via de bestaande Home Assistant Modbus-verbinding. Zowel de planner als de laatste controle vóór het schrijven gebruiken het minimum van de installatiegrens, het toegestane vermogen en de ingestelde stroom maal de actuele accuspanning. De 24 A-fasegrens blijft afzonderlijk van toepassing.

Zonder verse, passend gekoppelde registerwaarden blijft maximaal 8 kW toegestaan. Een verse nulgrens blokkeert; ongeldige of ontbrekende spanningsinformatie blokkeert toepassing van de registerwaarden. Een hoger installatievermogen geeft daarmee geen onvoorwaardelijke toestemming om harder te laden.

De legacy input-registers 3219/3220 gaven beide 2400. De algemene protocolhandleiding vermeldt daarvoor 0,01 A, maar de live vermogenslimiet correspondeert met 240 A. Deze schalingsafwijking is niet opgelost; deze legacy waarden worden niet gebruikt om een stroomgrens te verhogen. De VPP-vermogenslimiet is evenmin bewijs dat alle kabels en accucomponenten voor 240 A zijn vrijgegeven.

Bron voor de door de integratie gebruikte native en VPP-registermapping: https://github.com/0xAHA/Growatt_ModbusTCP/blob/main/custom_components/growatt_modbus/profiles/wit.py

Validatie: `node tests/wit-reported-limits.js`, transport-, planner- en WIT-regressietests, flowvalidatie en privacycontrole.

## SOC versus firmware

Een vervolguitlezing bij 91% SOC bevestigde circa 150 A toegestaan laden en 240 A toegestaan ontladen (8.145 W / 54,3 V en 13.032 W / 54,3 V). De gemelde celtemperatuur bleef 24 °C. Hoogste celspanning in legacy input 3230: 3,391 V; laagste celspanning 3231 bleef nul, zodat hieruit geen betrouwbare celspreiding kan worden bepaald. Niet alle registers hoeven door deze firmware te worden gevuld.

Growatts AXE-datasheet noemt stroom-/vermogensverlaging door temperatuur en SOC. Appendix II van de AXE 5.0L-C1-handleiding van december 2024 beschrijft daarnaast opeenvolgende laadstappen op basis van de hoogste celspanning (3,5 / 3,53 / 3,55 V). Die laadprocedure is geen bewijs van een vaste 89%-drempel of de exacte stroomcurve van QAAB-10 in een installatie met twee stacks.

- Fabrikantdatasheet: https://www.growatt.tech/wp-content/uploads/2024/07/AXE_5.0L_Modular_Battery_Datasheet_EN_202401.pdf
- Fabrikanthandleiding (kopie): https://device.report/m/cc333ac38c03271801a8e21db965a51f2c33cc3aae7df67ad445cc3d8ba65cfb

Conclusie: de waarnemingen passen bij SOC-afhankelijke laadbegrenzing, maar bewijzen niet of SOC, een afzonderlijke cel/module of een firmwarefout de specifieke verlaging veroorzaakt. De eerste meting was bij 79%, de volgende bij 89%; het omslagpunt is dus niet gemeten. Geen openbaar QAAB-10 wijzigingslog of bevestigde oplossing gevonden. De reactie van Growatt van 1 september kondigt R&D-navraag aan en bevestigt geen oplossing.

De read-only terugmelding bewaart nu maximaal 1.440 meetpunten in lokale flow-context: SOC, spanning, temperatuur, toegestane vermogens, daaruit afgeleide stromen en ingestelde WIT-stroomgrenzen. Daarmee kan de volgende normale laadcyclus een herhaalbare SOC-drempel tonen. Context is geen gegarandeerd duurzaam archief; de Node-RED-contextopslag bepaalt of deze een herstart overleeft. Geen ontlaadproef, firmwareupdate of hardwarelimietwijziging wordt hiervoor uitgevoerd.
