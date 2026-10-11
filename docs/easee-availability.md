# Easee availability and unchanged readings

On 2026-10-11 both chargers initially reported unknown online flags and the
integration's stream-connected attribute was false. After reloading the Easee
integration, live updates returned; left reported online and charging at about
6.6 kW with a 10 A limit. The app could issue commands during the interruption.
This does not prove the cloud command API itself was unavailable.

The EV controller's freshness check used last_updated, so an unchanged reading
could expire even when HA reported it again. Both EV controllers now prefer
last_reported, fall back to last_updated/last_changed and reject future samples.
The existing 30-second power and 15-second P1 guards remain in force.

An unknown online flag can be supplemented only by fresh valid power and status
readings. Explicit offline still blocks commands. No cached reading is refreshed
artificially and no access-control setting is changed.

Easee v0.9.74 services accept both charger_id and device_id. The previous
conclusion that charger_id was no longer supported was incorrect. The registry
based device routing is supported but was not established as the root cause.

Sources:
- https://github.com/nordicopen/easee_hass/blob/v0.9.74/custom_components/easee/services.py
- https://github.com/nordicopen/easee_hass/blob/v0.9.74/custom_components/easee/controller.py
