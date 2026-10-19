# WIT control and diagnostics

[English](#english) · [Nederlands](#nederlands)

## English

### What the controller now checks

- A new temporary session first reserves control and disables export limitation. The export controller respects this pending handover, including between timer ticks.
- Grid charging writes the enable, two-minute lease and positive power together with FC16 to registers 30407–30409. This prevents briefly enabling an old discharge setpoint. Control authority and AC charging permission are enabled first only when necessary. Discharge retains the existing Mode (VPP) path.
- The controller reads actual authority, remote enable, duration, signed power, AC permission and schedule count through `get_register_data`. Cached Home Assistant labels do not establish hardware state. Unavailable or outdated readback blocks control; an external TOU schedule is never erased. Each completed charge command must match actual registers. Only one command can be pending; a four-minute timeout stops it, and the response watchdog begins after the initial write is verified.
- Stopping first disables **Control Authority**, waits at least 35 seconds and for fresh Disabled feedback, then disables **Remote Power Control**. The minute controller performs the steps, so release can take multiple minute cycles. Ownership remains reserved until both controls report fresh Disabled; failed writes are retried without allowing a start or renewal to race the release. It does **not** select Hold or legacy Standby, and does not require the newer `set_battery_mode` release option. The normal inverter configuration must already be Load First/self-consumption; the dashboard does not prove that underlying setting by reading an optimistic selector.
- After an integration restart, an unknown last-command Mode (VPP) does not prevent starting a new session if its supported options and the required hardware telemetry are available. An externally owned active remote session is not taken over.
- The dashboard separates requested power, measured signed battery power and command confirmation. A positive/negative measurement confirms charging/discharging, not necessarily delivery of the full setpoint or that all that power was caused by ESS. It must not be used as a calibrated savings measurement.
- Current SOC and fresh local telemetry are checked on each minute cycle. Household reserve uses the learned completed-day forecast, with the profile's bootstrap reserve as a minimum. ECO/SOC safety floors and recharge targets remain in force.
- Before sunrise, the upcoming solar day is **today**, not tomorrow. Date-aware overnight fallback supports Forecast.Solar values that have not rolled over yet. During the day, EV support can use remaining sunlight today plus tomorrow for refilling; grid charging uses an approximate rolling 24-hour solar budget. With daily forecasts, the share of tomorrow inside that horizon is a conservative daylight approximation, not an hourly production model.
- Only the three configured forecast roles are counted, and shared entity mappings are deduplicated. Stale or unavailable forecasts block automatic action; they are not treated as zero solar. Forecast dates are kept distinct in the historical comparison.
- Dated day-ahead price intervals remain usable from a cache up to 36 hours old. Expired intervals are discarded, missing intervals are never invented, and the economics check still includes charging loss and wear. A fresh cloud request is not required for every already-known quarter.
- The most heavily loaded P1 phase limits grid charging, with a 1 A margin below the configured fuse (24 A on this 3×25 A connection). Only measured battery charging after subtracting direct PV can be credited as existing net charge. An unconfirmed setpoint cannot create imaginary connection headroom. Downward power limits take effect without upward hysteresis.
- WIT grid charging is independent of Easee availability and EV slot reservations. Both plans may use the same economical quarter; actual P1 phase headroom limits WIT power. Simultaneous WIT charge/discharge remains prohibited. A stale discharge reservation is released only with fresh Disabled readback from both authority and remote control.
- A command gets two minutes to produce matching remote feedback and measured power. There is at most **one complete retry** per session, then a shared fault blocks temporary charge/discharge and requests full release of Control Authority and Remote Power Control. No Hold command is sent. The two-minute lease bounds the direct power command if communication is lost; expiry alone does not prove that VPP authority has been released. Inspect BMS/Modbus first, then explicitly reselect a grid-charge mode or reserve profile; reset is allowed only after fresh Disabled feedback from both controls. Merely entering another price quarter does not clear a fault. Mode labels alone, target changes and renewals cannot indefinitely extend the response window.
- Recovery attempts and the latched fault are included in historical sensor attributes. Direct PV alone is not accepted as confirmation of grid charging. The watchdog detects missing response, not the exact cause of a hardware/BMS refusal, nor delivery of the full requested power.

### Installation limits and optional BMS telemetry

`maximumBatteryChargePowerKw` is the charge ceiling (default and installation maximum 8 kW). Both the planner and write transport clamp older, higher settings to 8 kW; lower configured or BMS limits take precedence. `maximumBatteryPowerKw` remains the extra-discharge ceiling. Neither overrides the inverter/BMS.

Charge confirmation tolerates one missing register response for up to 90 seconds
after the original write. The periodic actual readback can complete that request;
no extra command is queued and persistent failures still stop the session.
Release writes zero directly to 30100 (authority) and then 30407 (remote), on
the device proven by a fresh readback matching both configured control entities.
The existing release order and hardware confirmation checks remain mandatory.
Bij expliciet **Nu laden** mag een niet door ESS gereserveerde twee-minutenopdracht
begrensd worden vrijgegeven nadat de echte registerwaarden drie minuten stabiel
zijn teruggelezen. Verse HA-tijdstempels door Modbus-polling blokkeren dit herstel
niet meer. De terugmelding moet bij de gekoppelde WIT horen; een extern
tijdschema, een lopende schrijfactie of een actieve ESS-sessie blokkeert herstel.
Automatisch laden neemt externe bediening niet over. Dit is een expliciete
handmatige overname, geen bewijs dat een andere regelaar niet meer actief is.
An explicit fault reset starts a bounded release recovery even if an earlier
cleanup attempt has already completed.

Optional entity roles on Configuration:

Grid-charge SOC can also come from the existing local Modbus battery readback
when the Home Assistant SOC/power cache briefly disappears. This is a real
measurement, not an extended cache grace: the battery readback must be at most
two minutes old, and entity-registry proof must bind the mapped SOC sensor and
both control entities to the same Growatt config entry. Battery and Grid may be
separate Home Assistant devices inside that entry; the two control entities
must still share their Grid device. An independently validated SOC snapshot
keeps its original timestamp if a later current/control read fails. Missing
control feedback still blocks control through the existing hardware guards;
it does not turn an already measured SOC into a missing SOC.
The planner records `socSource=register`; the final write transport checks the
same source and still stops at the SOC target. Missing identity, stale readings
or an explicitly out-of-range sensor block this fallback. A release already
underway still completes before another charging session starts.

Forecast validity is tracked separately for today and tomorrow. A stale or
missing tomorrow forecast cannot discard fresh remaining production today when
the charging deadline is today. Only production before the deadline receives
the existing conservative factor and charging efficiency. The displayed
expected solar charging uses the same credit as the inventory/net-energy plan;
unknown days are never filled with invented forecast energy.

For a deadline tomorrow, solar credit accumulates today's remaining production
and tomorrow's dated forecast. It is not capped at today's sunset and never
decreases at midnight. With daily forecasts, tomorrow's hourly shape is an
approximation: a solar boundary still dated today is projected 24 hours ahead,
using tomorrow's actual next sunrise when available. No tomorrow production is
credited before that sunrise; the existing maximum 35% forecast credit and
charging efficiency still apply. Current BMS/fuse limits remain authoritative.

| Role | Accepted unit |
| --- | --- |
| `sensor.battery_charge_power_limit` | W or kW |
| `sensor.battery_discharge_power_limit` | W or kW |
| `sensor.battery_charge_current_limit` | A |
| `sensor.battery_discharge_current_limit` | A |
| `sensor.growatt_battery_battery_voltage` | V; needed when using a current limit |

Map **actual permitted BMS limits**, not current measured charge/discharge power. Leave unused roles blank. Once a limit is mapped, zero, unavailable or older-than-five-minute telemetry blocks that direction. Unmapped limits use the installation ceiling; hardware BMS protection remains authoritative. Charge and discharge limits are never mixed by fuzzy name matching.

WIT write commands use the same local role mapping as readings. A missing target or wrong entity domain fails closed. Local configuration/backups remain outside Git and new optional roles do not require resetting existing mappings.

### Diagnose an apparent failure

1. On Battery & WIT, read the decision reason before expecting power: SOC target reached, insufficient forecast surplus, no economical price slot, EV not charging, manual export priority and another remote session can all legitimately prevent an action.
2. Compare **requested** and **measured** battery power. A Mode (VPP) label by itself is only the last command. Check BMS limits and Modbus errors if a command is visible but no response is measured.
3. Inspect System: WIT control and price availability now appear alongside the existing checks. Missing values display `—`, not zero. Disabled optional modules do not count as failed health checks.
4. In HA logs, simultaneous DNS/timeouts across several integrations suggest a shared network/resolver problem. Local P1 and inverter timeouts require checking local connectivity too. Do not solve this by endlessly restarting Node-RED or increasing polling.
5. Tado authentication failures require reauthentication; network retries cannot repair an expired login. Cloud PV data and forecasts are not a replacement for fresh local control measurements.
6. Ensure HA and Node-RED use the same local timezone. Recorder retains requested/actual power, decision reasons, confirmation flags, forecast dates and household reserve for later analysis. Remove private identifiers before sharing diagnostics.

After pulling, deploy the updated flow through the existing workflow. No live installation is changed merely by this Git update. Validate one safe charge/discharge period under supervision before declaring end-to-end success.

The control semantics were checked against the [Growatt WIT guide](https://0xaha.github.io/Growatt_ModbusTCP/controls/wit-guide/) and the [integration's v2.0.4 implementation](https://github.com/0xAHA/Growatt_ModbusTCP/blob/v2.0.4/custom_components/growatt_modbus/select.py).

## Nederlands

Bij **Nu laden** kan de regeling een achtergebleven externe sessie herstellen als zowel de afstandsbediening, de bedieningsbevoegdheid als het vermogenssetpoint langer dan vijf minuten niet zijn bijgewerkt. Eerst wordt de bedieningsbevoegdheid uitgeschakeld, na minimaal 35 seconden de afstandsbediening. Beide moeten Disabled melden, met een nieuwe terugmelding of een geslaagde uitschakelopdracht uit deze herstelpoging, voordat een laadstart mogelijk is. Een ongewijzigde Home Assistant-selector hoeft bij een geslaagde opdracht geen nieuwe statusdatum te krijgen; dit bewijst nog geen werkelijk laadvermogen. Iedere vrijgavestap wordt eenmaal verstuurd; zonder bevestiging binnen drie minuten blijft een foutmelding staan. Automatisch laden neemt externe sessies niet over. Een recente externe opdracht en een door ESS beheerde ontlaadsessie blijven beschermd. Opnieuw **Nu laden** kiezen maakt na controle een nieuwe herstelpoging mogelijk; de bestaande foutblokkering blijft bevestigde vrijgave vereisen.

Netladen schrijft inschakelen, de looptijd van twee minuten en het positieve laadvermogen samen naar de WIT. Zo kan een achtergebleven negatief vermogenssetpoint niet tussendoor ontladen starten. De regeling leest de echte bedieningsregisters terug; oude Home Assistant-labels gelden niet als bevestiging. Er kan één opdracht tegelijk onderweg zijn. De reactietijd begint na de gecontroleerde laadstart; na vier minuten zonder afronding stopt de regeling. Actuele P1-fasemetingen en BMS-grenzen worden vlak vóór de schrijfopdracht opnieuw gecontroleerd. Een bestaande externe tijdplanning wordt niet gewist.

Een geslaagde schrijfaanroep kan eerder terugkomen dan het nieuwe setpoint in de registers zichtbaar is. Bij afwijkende terugmelding wacht de regeling daarom maximaal 90 seconden op de periodieke registercontrole. Tot die bevestiging wordt geen volgende schrijfopdracht gestart. Na een bevestigde opdracht blijven vermogensverhogingen 45 seconden geblokkeerd; veiligheidsverlagingen blijven direct mogelijk. Dit voorkomt onterechte foutblokkering door een snelle vervolgopdracht met nog oude terugmelding.

Als nieuwe P1-metingen vlak vóór het schrijven een lager vermogen vereisen, beoordeelt de reactiebewaking dat werkelijk toegepaste en bevestigde setpoint. Een hoger oorspronkelijk plandoel mag dan geen herstelpoging of foutmelding veroorzaken terwijl de accu aantoonbaar laadt.

P1-fasemetingen moeten bij iedere schrijfopdracht maximaal 15 seconden oud zijn. Growatt-accuvermogen en direct zonnevermogen gebruiken hetzelfde venster van twee minuten als de planner, omdat deze metingen langzamer worden bijgewerkt. Voor het meerekenen van bestaand netladen mogen de accuvermogens- en zonnemetingen hoogstens 15 seconden uiteen liggen. Direct zonnevermogen wordt afgetrokken; verlopen, onbekende of niet samenhangende metingen leveren geen extra laadruimte op. Teruglevering vergroot de ruimte op de eigen fase; de zwaarst belaste fase blijft bepalend. De begrenzingsdiagnose bewaart de gebruikte fasevermogens en het meegerekende netlaadvermogen.

Automatische exportbegrenzing blijft actief zolang de thuisaccu onder 100% SOC staat en stopt bij een volle accu, in plaats van al bij 90%. EV-zonprioriteit, handmatig uit, lopende WIT-sessies en foutblokkering blijven gelden. De ingestelde hardware- en BMS-grenzen worden niet verhoogd.

De WIT-regeling reserveert nu ook tijdens het uitschakelen van exportbegrenzing de bediening. Vermogen bijstellen vernieuwt daarna de opdracht van twee minuten. Stoppen schakelt eerst **Control Authority** uit. Na minimaal 35 seconden en actuele uit-bevestiging wordt ook **Remote Power Control** uitgezet. Dit verloopt via de minuutcyclus; de sessie blijft gereserveerd totdat beide schakelaars aantoonbaar uit staan. Tijdens vrijgave worden geen nieuwe sessie of verlengopdracht verstuurd. Mislukte opdrachten worden begrensd opnieuw geprobeerd. **Geen Hold/Standby-opdracht**, en geen afhankelijkheid van de nieuwere `release`-optie. De omvormer moet zelf normaal op Load First staan.

De planning gebruikt actuele SOC, een geleerde woningreserve, het juiste zonnedagvenster na middernacht en beschikbare gedateerde kwartierprijzen. Reeds bekende prijzen mogen maximaal 36 uur uit de cache komen; verlopen of ontbrekende kwartieren niet. Zonneprognoses blijven conservatief en dagtotalen geven nog geen exacte uurvoorspelling.

Op Accu & WIT zie je **gevraagd vermogen**, **werkelijk accuvermogen** en **bevestiging** afzonderlijk. Een ingestelde Charge/Discharge-stand bewijst geen werkelijk vermogen. Een gemeten laad-/ontlaadrichting bewijst bovendien niet dat het volledige gevraagde vermogen wordt gehaald.

De configuratie heeft nu een afzonderlijke bovengrens voor netladen. Optionele BMS-grenzen staan in de tabel hierboven: bij een stroomgrens in A hoort ook accuspanning in V. Een gekoppelde grens die nul, onbekend of te oud is blokkeert die richting. Laat niet-gebruikte grensrollen leeg; verhoog nooit hardwaregrenzen om een regelprobleem te omzeilen.

De systeempagina toont ook WIT- en prijsproblemen. Ontbrekende meetwaarden zijn `—` in plaats van schijnbaar geldige nullen. De historie bewaart ook opdrachtbevestiging, gemeten richting, prognosedatum en woningreserve.

Netladen werkt onafhankelijk van Easee en de EV-laadplanning. Beide mogen in hetzelfde goedkope kwartier laden; actuele P1-fasemetingen begrenzen het WIT-vermogen. De blokkering tegen tegelijk laden en extra ontladen blijft gelden.

Bij geen reactie krijgt de WIT na twee minuten één volledige herstelpoging. Volgt weer twee minuten geen bevestigde reactie, dan stopt de tijdelijke opdracht en blijft een waarschuwing staan. Controleer BMS/Modbus en kies daarna de gewenste netlaadstand of het reserveprofiel opnieuw. De blokkering wordt pas opgeheven wanneer zowel Control Authority als Remote Power Control aantoonbaar uit staan. Het verlopen van de korte opdracht bewijst op zichzelf niet dat de externe toestemming is vrijgegeven. Een nieuw kwartier wist de fout niet.

EV- en WIT-laadvoorkeuren worden lokaal buiten Git opgeslagen en vóór het regelen hersteld. SOC-doelen, vertrektijd, reserveprofiel en gekozen standen blijven behouden na HA-/Node-RED-herstart en pull. Tijdelijk EV Direct 100% en lopende Modbus-sessies worden niet teruggezet; de planning wordt met actuele metingen opnieuw berekend.

Bij een Node-RED-deployment waarbij de bestaande flowcontext behouden blijft, worden het eigenaarschap van een lopende WIT-sessie en een nog lopende vrijgave niet gewist. Anders kan de eigen opdracht na een update ten onrechte als extern worden behandeld. Zonder bestaande context begint de regeling zonder eigenaarschap; onbekende externe sessies blijven beschermd.

Voor problemen buiten de regelcode: controleer bij fouten in meerdere integraties eerst netwerk/DNS, bij lokale P1/Modbus-time-outs ook het LAN en bij Tado een eventuele herauthenticatie. Houd de tijdzones van HA en Node-RED gelijk. Logbestanden en persoonlijke entiteiten horen niet in de openbare repository.

Na een pull moet de aangepaste flow nog via de bestaande werkwijze worden gedeployed. Deze Git-wijziging schakelt live niets. Pas na een gecontroleerde laad-/ontlaadperiode is de volledige werking op de installatie bevestigd.

## Begrensd herstel van vertraagde registerterugmelding

Een ontbrekende of afwijkende registerterugmelding vraagt eenmaal een nieuwe uitlezing aan, zonder de laadopdracht opnieuw te schrijven. De bestaande bevestigingstermijn van 90 seconden blijft gelden.

Alleen deze terugmeldingsfouten kunnen na tien minuten automatisch vervallen. Daarvoor zijn twee onafhankelijke, verse Modbus-metingen nodig, minimaal 15 seconden uiteen: remote en authority uit, geen tijdplanning, dezelfde gekoppelde WIT en geen actieve, wachtende of vrijgevende ESS-sessie. Oude ongeclassificeerde fouten vereisen daarnaast bevestiging van beide vrijgavestappen na de fout. Hoogstens één herstel per uur; de herstelregistratie blijft bewaard in het private laadvoorkeurenbestand. Een herstart herstelt geen sessie-eigendom.

Schrijffouten, onbevestigde vrijgave en uitblijvend laad- of ontlaadvermogen blijven geblokkeerd. De foutmelding toont oorzaak en tijdstip. Een gewiste terugmeldingsfout doorloopt opnieuw alle gewone SOC-, BMS-, fase- en laadplanningscontroles.
### Betrouwbare uitleesrondes en SOC-stop

Elke native WIT-uitleesronde heeft een eigen aanvraagnummer. Late tussenantwoorden
en fouten van een eerdere ronde worden genegeerd en kunnen een nieuwere ronde
niet annuleren of extra Modbus-verzoeken starten. Een actuele uitleesfout maakt
de registerterugmelding en BMS-grenzen ongeldig; de bestaande periodieke uitlezing
kan ze daarna opnieuw bevestigen. `ess_wit_readback_health` bewaart de echte uitkomst.

De laatste vermogenscontrole vóór een laadsetpoint respecteert zowel het ingestelde
SOC-doel als een lager tijdelijk reserve-doel van de automatische planner.
Dit voorkomt dat de transportlaag nog 100% als doel gebruikt. Bevestiging van
registers blijft gescheiden van werkelijk gemeten laadvermogen. Hardwarefouten
en het uitblijven van laadvermogen worden niet onbeperkt opnieuw geprobeerd.
