# WIT control and diagnostics

[English](#english) · [Nederlands](#nederlands)

## English

### What the controller now checks

- A new temporary session first reserves control and disables export limitation. The export controller respects this pending handover, including between timer ticks.
- Charge and Discharge use **Mode (VPP)**, a positive VPP strength and a two-minute duration. An active session adjusts signed remote power and then renews its lease. Every successful power adjustment also renews that lease.
- Stopping disables the temporary **Remote Power Control** override. It does **not** select Hold or legacy Standby. The normal inverter configuration must already be Load First/self-consumption; the dashboard does not prove that underlying setting by reading an optimistic selector.
- After an integration restart, an unknown last-command Mode (VPP) does not prevent starting a new session if its supported options and the required hardware telemetry are available. An externally owned active remote session is not taken over.
- The dashboard separates requested power, measured signed battery power and command confirmation. A positive/negative measurement confirms charging/discharging, not necessarily delivery of the full setpoint or that all that power was caused by ESS. It must not be used as a calibrated savings measurement.
- Current SOC and fresh local telemetry are checked on each minute cycle. Household reserve uses the learned completed-day forecast, with the profile's bootstrap reserve as a minimum. ECO/SOC safety floors and recharge targets remain in force.
- Before sunrise, the upcoming solar day is **today**, not tomorrow. Date-aware overnight fallback supports Forecast.Solar values that have not rolled over yet. During the day, EV support can use remaining sunlight today plus tomorrow for refilling; grid charging uses an approximate rolling 24-hour solar budget. With daily forecasts, the share of tomorrow inside that horizon is a conservative daylight approximation, not an hourly production model.
- Only the three configured forecast roles are counted, and shared entity mappings are deduplicated. Stale or unavailable forecasts block automatic action; they are not treated as zero solar. Forecast dates are kept distinct in the historical comparison.
- Dated day-ahead price intervals remain usable from a cache up to 36 hours old. Expired intervals are discarded, missing intervals are never invented, and the economics check still includes charging loss and wear. A fresh cloud request is not required for every already-known quarter.
- The most heavily loaded P1 phase limits grid charging, with a 3 A margin below the configured fuse. Only measured battery charging after subtracting direct PV can be credited as existing net charge. An unconfirmed setpoint cannot create imaginary connection headroom. Downward power limits take effect without upward hysteresis.

### Installation limits and optional BMS telemetry

`maximumBatteryChargePowerKw` is the grid-charge ceiling (default 12 kW). `maximumBatteryPowerKw` remains the extra-discharge ceiling. Set both to verified installation limits; neither overrides the inverter/BMS.

Optional entity roles on Configuration:

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

The control semantics were checked against the [Growatt WIT guide](https://0xaha.github.io/Growatt_ModbusTCP/controls/wit-guide/) and the [integration's v1.9.8 implementation](https://github.com/0xAHA/Growatt_ModbusTCP/blob/v1.9.8/custom_components/growatt_modbus/select.py).

## Nederlands

De WIT-regeling reserveert nu ook tijdens het uitschakelen van exportbegrenzing de bediening. Vermogen bijstellen vernieuwt daarna de opdracht van twee minuten. Stoppen schakelt alleen de tijdelijke afstandsbediening uit: **geen Hold/Standby-opdracht**. De omvormer moet zelf normaal op Load First staan.

De planning gebruikt actuele SOC, een geleerde woningreserve, het juiste zonnedagvenster na middernacht en beschikbare gedateerde kwartierprijzen. Reeds bekende prijzen mogen maximaal 36 uur uit de cache komen; verlopen of ontbrekende kwartieren niet. Zonneprognoses blijven conservatief en dagtotalen geven nog geen exacte uurvoorspelling.

Op Accu & WIT zie je **gevraagd vermogen**, **werkelijk accuvermogen** en **bevestiging** afzonderlijk. Een ingestelde Charge/Discharge-stand bewijst geen werkelijk vermogen. Een gemeten laad-/ontlaadrichting bewijst bovendien niet dat het volledige gevraagde vermogen wordt gehaald.

De configuratie heeft nu een afzonderlijke bovengrens voor netladen. Optionele BMS-grenzen staan in de tabel hierboven: bij een stroomgrens in A hoort ook accuspanning in V. Een gekoppelde grens die nul, onbekend of te oud is blokkeert die richting. Laat niet-gebruikte grensrollen leeg; verhoog nooit hardwaregrenzen om een regelprobleem te omzeilen.

De systeempagina toont ook WIT- en prijsproblemen. Ontbrekende meetwaarden zijn `—` in plaats van schijnbaar geldige nullen. De historie bewaart ook opdrachtbevestiging, gemeten richting, prognosedatum en woningreserve.

Voor problemen buiten de regelcode: controleer bij fouten in meerdere integraties eerst netwerk/DNS, bij lokale P1/Modbus-time-outs ook het LAN en bij Tado een eventuele herauthenticatie. Houd de tijdzones van HA en Node-RED gelijk. Logbestanden en persoonlijke entiteiten horen niet in de openbare repository.

Na een pull moet de aangepaste flow nog via de bestaande werkwijze worden gedeployed. Deze Git-wijziging schakelt live niets. Pas na een gecontroleerde laad-/ontlaadperiode is de volledige werking op de installatie bevestigd.
