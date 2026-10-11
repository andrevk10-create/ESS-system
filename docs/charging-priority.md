# Laadprioriteit

1. Gepland, direct, noodzakelijk vertrek- en klimaatondersteuningsladen van beide auto's.
2. WIT-accu: mag tegelijk laden met de resterende netruimte per fase.
3. Extra zonneladen van de auto's, nadat het WIT-doel bereikt is.

Beide auto's publiceren hun actuele laadbehoefte, ook als ze nog op een fasewissel of ruimte wachten. De WIT reserveert daarvoor het ingestelde EV-netlaadvermogen (begrensd op maximale EV-stroom). De gemeten EV-belasting zit al in de P1-meting; uitsluitend de nog niet gemeten extra vraag wordt gereserveerd. Zo wordt EV-verbruik niet dubbel afgetrokken. Reserveringen verlopen na twee minuten.

De laagste resterende ruimte van de drie fasen bepaalt het toegestane WIT-netlaadvermogen. De berekening wordt bij planning en vlak vóór de Modbus-laadopdracht uitgevoerd. BMS- en installatiegrenzen blijven gelden, evenals de ontwerpgrens van 24 A bij 3×25 A. De Easee Equalizer blijft zelfstandig beveiligen.

Als onvoldoende ruimte resteert, vermindert of pauzeert WIT-netladen. De prijsplanning en het doel vóór de dure periode blijven bestaan, maar kunnen bij langdurige EV-voorrang niet worden gegarandeerd.

Auto-zonneladen wacht wanneer de WIT nog energie nodig heeft of de andere auto prioriteit-1-laden vraagt. Een onbekende WIT-SOC reserveert de prioriteit; uitgeschakelde WIT-net- én zonregeling of een verse nul-laadgrens geeft deze vrij. Ook minimale zonnelaadduur mag de hogere prioriteit niet vasthouden.

Validatie: prioriteitstests inclusief gelijktijdig laden, geen dubbel tellen van P1-belasting, beide auto's, verlopen reserveringen, WIT-vol en nulruimte; bestaande EV-, WIT-, transport- en flowtests.
