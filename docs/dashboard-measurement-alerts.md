# Meetdata en korte vertragingen

De dashboardtijd is de tijd waarop Node-RED het dashboard heeft samengesteld.
Voorheen gebruikte die tijd de laatste wijziging van de P1-waarde. Daardoor
kon een onveranderd vermogen de algemene melding over verouderde meetdata
oproepen terwijl de dashboardverbinding nog werkte.

De originele P1-brontijd blijft apart beschikbaar in `sourceTimestamps.p1`.
Deze gebruikt `last_reported`, met terugval op `last_updated` / `last_changed`.
Geen enkele bronmeting krijgt door het bijwerken een nieuw tijdstip.

Alleen de dashboardwaarschuwing krijgt een kleine marge:

| Meting | Strikte versheid blijft | Dashboardwaarschuwing bij ouder dan |
|---|---:|---:|
| P1 | 15 seconden | 45 seconden |
| WIT-accuvermogen | 120 seconden | 150 seconden |

Gedurende de extra marge toont de status dat een meting tijdelijk vertraagd
is. `p1Fresh` en `telemetryFresh` blijven hun strikte betekenis houden;
ongemeten vermogen wordt niet ingevuld. Expliciet ontbrekende/onbeschikbare
metingen en echte bedieningsfouten blijven zichtbaar. Een P1-uitval wordt in
de meldingenlijst niet ook nog onder Meetdata en WIT herhaald.

Na 30 seconden zonder dashboardupdate blijft de browser de dashboardverbinding
als verouderd melden. Een verbroken Home Assistant-verbinding krijgt een eigen
melding, ook wanneer Node-RED het dashboard nog kan bijwerken.

De laadregelaars, hun grenswaarden, native terugmelding en veiligheidscontroles
zijn niet gewijzigd. Deze wijziging corrigeert meldingen; zij herstelt geen
offline meter, overbelaste server of netwerkonderbreking.
