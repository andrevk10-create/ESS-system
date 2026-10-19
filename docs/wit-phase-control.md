# WIT 18 kW and phase loading

## Automatic Power Imbalance control

ESS-owned grid charging takes priority over the household imbalance thresholds:
Power Imbalance (holding 947) is disabled during pending, active and releasing
grid-charge sessions. The charge transport reads this register before each
start/update/renewal; if enabled, it writes 0 and verifies 0 before sending the
charge command. Invalid or refused readback blocks charging through the existing
fault/release path. This provides balanced inverter currents, not necessarily
equal P1 imports, because household loads and other PV differ by phase.

After the session ends, Power Imbalance is enabled again only after fresh,
device-matched readback confirms both authority and remote control disabled.
The pending restoration stays in flow context until register 947 confirms 1;
normal household threshold control then resumes. Uncertain release or failed
register access delays restoration rather than assuming that charging stopped.

The flow includes a controller with a strict difference greater than 4 A
between the highest and lowest signed P1 phase currents (or signed phase
power divided by configured nominal voltage). Enable requires 30 seconds
above that threshold. Disable requires 120 seconds below 2 A and at least
five minutes enabled. Missing or stale readings never trigger a write.
These delays limit switching; compensated net readings can still create a
feedback cycle, so this is not proof of uncompensated household imbalance.

The controller uses the existing growatt_modbus integration directly, without
requiring a new HA select entity. The manufacturer protocol supplied by Growatt
support, Growatt Inverter Modbus RTU Protocol II V1.39 (2024-04-16), page 31,
defines holding register 947 (uwPowerUnblanceCtrlEnable), R/W, 0=disable and
1=enable. The WIT TL3 scope includes holding 875-999 (page 6). On 2026-10-12
a read through the installed integration successfully returned 1 for the
configured WIT device. The original document stays private under .npm.

Each cycle resolves the WIT from the private remote-control and authority
entity bindings, checks that both belong to the same Growatt device/config
entry, and reads register 947. Only a valid fresh 0/1 read enables a write.
Writes use growatt_modbus.write_register exclusively at address 947 with 0/1,
then read the register again to verify the requested state. No other settings
or fuse/charging limits are changed. Runtime diagnostics remain in
ess_wit_imbalance_status.

The official WIT 17–25K-HU user manual (202606), printed page 94
(PDF pages 97–98), documents:
Control → Single machine anti backflow setting → Single phase anti backflow enable.
This is a phase-specific export/load control setting, not a licence to exceed a
main fuse. The 4–15K-HU product introduction calls the corresponding feature
Smart Phase-level Power Control; its numeric phase limits must not be copied
to an 18 kW inverter.

Source: https://en.growatt.com/upload/file/WIT_17-25K-HU_User_Manual_EN_202606.pdf

The current Home Assistant integration does not expose this setting, and the
original investigation had not yet identified its address for this
installation; the subsequent Power Imbalance register identification is above. On 2026-10-11 the owner clarified that the phase-specific setting
could not be found. The screenshots show Disable for general Set Exportlimit,
not for Single phase anti backflow enable. The phase-specific enabled state
therefore remains unknown. The expanded Advanced Setting and Regulation
parameter setting screenshots do not expose it either.
This setting alone does not establish independent
phase compensation during forced charging; interaction with the total-power
interface must be verified before changing the controller's assumptions.

The owner subsequently found Power Imbalance Enable in Key parameter settings,
corrected the installation's phase order and confirmed this option enabled.
This is a different label from Single phase anti backflow enable; equivalence
has not been established. A live check on 2026-10-11 during remote net charging
showed approximately 7.4 kW battery charging, P1 phase imports of 2.9 / 2.3 /
3.1 kW, and inverter phase currents of 9.4 / 9.3 / 9.4 A. Thus this check did
not demonstrate asymmetric charging. Enabled status alone must not replace the
most-loaded-phase guard with a sum-of-phase headroom calculation. The inverter
phase power sensors can be unsigned voltage-times-current estimates, so they
must not be treated as signed independent phase charging measurements.
No guessed register is written and no extra capacity is credited from this mode.
The WIT forced-charge interface
continues to receive a total power target; it is not three independent targets.

For a configured 3×25 A connection the design ceiling is 24 A
per phase, leaving 1 A below each fuse. WIT planning and write transport
evaluate the most loaded phase. Easee retains its own Equalizer control. Signed
P1 power is still evaluated per phase: export on one phase does not compensate
the fuse loading on another. Battery charging remains capped at 8 kW.

Hardware-only WIT grid guarding now requires both explicit private flags:
`ess_wit_hardware_grid_guard` and `ess_wit_meter_includes_ev` must be true.
The latter defaults to false and is persisted as `witMeterIncludesEV` in the
private charging preferences. A meter that excludes the charging circuits is
insufficient to bypass the whole-site P1 check, even if its own protection is
enabled. The planner and the final transport write both check phase headroom.
The optional `ess/wit/meter-includes-ev` boolean settings topic can record a
confirmed complete meter boundary; it does not modify inverter wiring/settings.

Excluding a balanced three-phase EV load from a meter reduces the measured total
but does not explain a difference between phases. Diagnose imbalance separately:
use actual Easee phase currents, synchronized P1 readings, meter phase assignment
and inverter operating mode. A configured Easee phase mode alone is not proof
of actual charging on all phases. The native setting and remaining P1 imbalance
are separate status fields (`enabled` and `remainingImbalance`).
