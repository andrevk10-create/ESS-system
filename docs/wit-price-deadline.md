# Vol vóór dure uren

In Automatisch is het WIT-doel 100%. De planner bepaalt de volgende dure
periode uit het bovenste kwart van de beschikbare all-in kwartierprijzen,
maximaal 24 uur vooruit. Een lopende dure periode wordt overgeslagen totdat
goedkopere kwartieren en daarna een volgende dure periode beschikbaar zijn.
Bij vrijwel vlakke prijzen (spreiding minder dan 1 cent/kWh) wacht hij op een
duidelijke volgende dure periode.

Alle kwartieren vóór die periode worden op prijs gesorteerd, ook nachturen.
Het tekort tot 100%, laadverlies en de naar de eindtijd geschaalde woningreserve
bepalen de netbehoefte. Dagtotalen voor verwachte zon worden niet vooraf
afgetrokken: ze bewijzen niet wanneer die energie beschikbaar komt. Gemeten
zonnelading verhoogt de SOC en verlaagt bij iedere nieuwe berekening het tekort.

Nu laden behoudt het handmatig gekozen SOC-doel. Uit blijft uit.
BMS-limieten, laadstop-SOC, actuele fasebelasting en bevestigde WIT-bediening
houden voorrang. 100% is een doel, geen garantie bij onvoldoende laadruimte.
Het dashboard vermeldt de eindtijd en een waarschuwing bij te weinig geplande
capaciteit. Ontbrekende of oude prijzen blokkeren automatisch netladen.
