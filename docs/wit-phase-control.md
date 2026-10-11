# WIT 18 kW and phase loading

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
installation. On 2026-10-11 the owner confirmed that the setting in
ShineTools/ShinePhone is Disable / Uit. Phase-specific anti-backflow control is
therefore currently disabled. This setting alone does not establish independent
phase compensation during forced charging; interaction with the total-power
interface must be verified before changing the controller's assumptions.
No guessed register is written and no extra capacity is credited from this mode.
The WIT forced-charge interface
continues to receive a total power target; it is not three independent targets.

For the installed 3×25 A connection the requested design ceiling is now 24 A
per phase, leaving 1 A below each fuse. WIT planning and write transport, both EV
controllers, climate headroom and the phase dashboard use this ceiling. Signed
P1 power is still evaluated per phase: export on one phase does not compensate
the fuse loading on another. Battery charging remains capped at 8 kW.
