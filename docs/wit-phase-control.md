# WIT 18 kW and phase loading

## Automatic Power Imbalance control

The flow includes a controller with a strict difference greater than 2 A
between the highest and lowest signed P1 phase currents (or signed phase
power divided by configured nominal voltage). Enable requires 30 seconds
above that threshold. Disable requires 120 seconds below 1 A and at least
five minutes enabled. Missing or stale readings never trigger a write.
These delays limit switching; compensated net readings can still create a
feedback cycle, so this is not proof of uncompensated household imbalance.

Operation is blocked until the private system configuration explicitly maps
`select.growatt_power_imbalance_enable` to a verified HA select entity for this
exact setting. Its current state and Enable/Disable options must be available
and fresh. No default entity, assumed register or Modbus write is used.
The installed integration currently offers no such entity, so the automation
cannot yet switch the WIT. Growatt's confirmed register/API mapping is still
required to finish the hardware connection. Runtime diagnostics are stored in
`ess_wit_imbalance_status`. The controller does not change fuse or charging limits.

The official WIT 17–25K-HU user manual (202606), printed page 94
(PDF pages 97–98), documents:
Control → Single machine anti backflow setting → Single phase anti backflow enable.
This is a phase-specific export/load control setting, not a licence to exceed a
main fuse. The 4–15K-HU product introduction calls the corresponding feature
Smart Phase-level Power Control; its numeric phase limits must not be copied
to an 18 kW inverter.

Source: https://en.growatt.com/upload/file/WIT_17-25K-HU_User_Manual_EN_202606.pdf

The current Home Assistant integration does not expose this setting, and the
available documented register map does not identify its address for this
installation. On 2026-10-11 the owner clarified that the phase-specific setting
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

For the installed 3×25 A connection the requested design ceiling is now 24 A
per phase, leaving 1 A below each fuse. WIT planning and write transport, both EV
controllers, climate headroom and the phase dashboard use this ceiling. Signed
P1 power is still evaluated per phase: export on one phase does not compensate
the fuse loading on another. Battery charging remains capped at 8 kW.
