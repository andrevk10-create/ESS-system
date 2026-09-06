# Dashboard interface / Dashboardbediening

## English

The presentation refresh covers all nine pages, without changing charging strategies, electrical limits, device mappings or command topics.

- Desktop: shared navigation and compact headers. Mobile: fixed bottom navigation, with secondary pages under **Meer** (More).
- Overview: solar, whole-home consumption, grid, battery and primary EV status, quick actions and the next charging period.
- Solar & grid: directional energy overview, separate daily totals and tomorrow's forecast, with phase details collapsed. Charger power is a **part of** total household power, not an additional load to add again.
- Battery: SOC, actual power, current strategy and next charge together. Requested and measured power remain separate; technical diagnostics are available on demand.
- EV: readable actual SOC/power, existing immediate-charge and climate controls, departure settings and plan summaries.
- Planning: EV grid/solar charging selections, home-battery grid-charge selections and available all-in prices share a rolling 24-hour axis. Adjacent selected quarters form a readable block. This view displays the existing plans; it neither replans nor issues commands. A coloured slot is not confirmation of actual charging. Missing/stale prices are not substituted with zero.
- Loads, lights and climate: unused zones are hidden; explicitly selected offline devices remain distinguishable from devices that are off. Active loads sort first, followed by power. Filters do not change saved mappings.
- System: attention items first; NAS and technical details are expandable.
- Configuration: searchable entity groups, missing/offline filter, sticky save controls and a dirty-state indicator. “Changes sent” means a save request was issued, not that storage or an appliance has confirmed it.

Normal pages grow with their content. Only the optional detailed timeline scrolls horizontally. Focus indicators, touch-sized controls and reduced-motion support are shared across pages. The interface itself remains Dutch; this documentation is bilingual.

### Safe local preview

With Node.js and the development dependencies installed:

```sh
npm install
node scripts/build-multipage-dashboard.js
npm test
npm run preview
```

Open <http://127.0.0.1:8776/overzicht>. The preview binds only to the local computer, uses **synthetic data**, substitutes simple icon placeholders, and intercepts outgoing commands as on-screen text. It never connects to Home Assistant or Node-RED. Append `?scenario=offline` or `?scenario=empty` to test unavailable data. `/viewport?page=autos&width=390` embeds a mobile-width test page; this is layout testing, not a simulation of real phone hardware or the complete FlowFuse shell. Stop the preview process when finished.

The generated templates use the existing [FlowFuse ui-template component lifecycle](https://dashboard.flowfuse.com/nodes/widgets/ui-template.html) and [content-sized grid layout](https://dashboard.flowfuse.com/layouts/types/grid.html). Do not deploy the preview server or replace real measurements with its fixtures.

## Nederlands

De opschoning geldt voor **alle negen pagina’s**. Laadstrategie, elektrische grenzen, apparaatkoppelingen en opdrachten blijven behouden.

Dezelfde navigatie staat op iedere pagina; op mobiel staan de overige pagina’s onder **Meer**. Op Overzicht staan de belangrijkste metingen en de volgende laadstap. Zon & net maakt onderscheid tussen actuele vermogens, dagtotalen en morgen. Het laadpuntvermogen is onderdeel van het totale woningverbruik, geen extra post om opnieuw op te tellen.

Op Accu blijven gevraagd en gemeten vermogen afzonderlijk zichtbaar. De gecombineerde tijdlijn toont bestaande laadplannen en beschikbare prijzen, maar stuurt zelf niets aan. Een ingekleurd kwartier bewijst dus niet dat een apparaat werkelijk laadt. Gedetailleerde eigen tijdlijnen en technische informatie blijven bereikbaar via de uitklapvelden.

Actieve verbruikers staan bovenaan. Ongebruikte licht- en klimaatzones verdwijnen, maar gekoppelde offline apparaten blijven herkenbaar. Configuratie groepeert de koppelingen en biedt zoeken, een ontbrekend/offline-filter en een melding bij niet-opgeslagen wijzigingen. Na opslaan verschijnt eerst dat de wijzigingen verstuurd zijn; dat is geen bevestiging van daadwerkelijke opslag of apparaatbediening.

De lokale testweergave hierboven gebruikt uitsluitend voorbeeldgegevens en onderschept alle opdrachten. `npm test` controleert de bestaande regelingen plus de vernieuwde weergaven. De lokale mobiele test controleert de breedte; de echte FlowFuse-omgeving en apparaten worden daarmee niet live getest.
