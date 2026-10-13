# Laden met reserve, zon en stroomprijs

In Automatisch is het WIT-doel 100%. De planner bepaalt de volgende dure
periode uit het bovenste kwart van de beschikbare all-in kwartierprijzen,
maximaal 24 uur vooruit. Een lopende dure periode wordt overgeslagen totdat
goedkopere kwartieren en daarna een volgende dure periode beschikbaar zijn.
Bij vrijwel vlakke prijzen (spreiding minder dan 1 cent/kWh) wacht hij op een
duidelijke volgende dure periode.

Een ochtendpiek verplicht niet langer tot nachtelijk laden naar 100%. De planner
controleert of de huidige energie, verminderd met het verwachte woningverbruik
tot het volgende laadmoment, boven de reserve blijft. Die reserve is het hoogste
van 30% accucapaciteit en de woningreserve van het gekozen profiel.

Bij voldoende reserve mag hij wachten op latere kwartieren, ook in de volgende nacht,
die minimaal 1 cent/kWh goedkoper zijn dan de goedkoopste voorafgaande uren,
of op voldoende conservatief berekende zon. Voor wachten op zon gebruikt hij
een geldig gedateerd forecast en bekende zonopkomst en zonsondergang; de
verwachting moet twee uur na zonsopkomst minimaal 1 kWh bruikbare acculading
opleveren. Ook controleert hij of zon en goedkopere laadruimte samen voldoende
zijn om het latere doel te halen. Een tweede grote prijspiek is daarvoor niet nodig.

Bij uitstel worden alle kwartieren vóór het gekozen dagmoment uitgesloten.
De nieuwe eindtijd ligt binnen de beschikbare prijzen en maximaal 24 uur vooruit.
Alleen zon vóór die eindtijd telt mee, met de veiligheidsfactor van het profiel
en laadverlies. Is de reserve tot het volgende goedkopere of zonnemoment te laag,
dan plant hij alleen dat tekort. Het tijdelijke SOC-doel omvat de beschermde
reserve plus het verwachte verbruik tot dat moment, omhoog afgerond op 5% voor
een kleine buffer. Pas op het goedkopere moment wordt opnieuw berekend of meer
laden nodig is. Zonder betrouwbaar volgend laadmoment of met te weinig
bijlaadcapaciteit blijft de oorspronkelijke tijdige planning gelden.

Nu laden behoudt het handmatig gekozen SOC-doel. Uit blijft uit.
BMS-limieten, laadstop-SOC, actuele fasebelasting en bevestigde WIT-bediening
houden voorrang. 100% is een doel, geen garantie bij onvoldoende laadruimte.
Het dashboard vermeldt de eindtijd en een waarschuwing bij te weinig geplande
capaciteit. Ontbrekende of oude prijzen blokkeren automatisch netladen.
