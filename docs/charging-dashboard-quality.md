# Inzicht in laden en leren

Het overzicht toont de actuele laadstatus en het volgende laadmoment vóór de
kostenblokken. De accupagina toont daarnaast:

- Goedgekeurde dagen voor het daggemiddelde, apart van dagen met enkele uurmetingen.
- Meetdekking van de laatste vier afgeronde kalenderdagen, inclusief ontbrekende
  dagen en de werkelijke 23 of 25 uur bij zomer-/wintertijd.
- Laatste geldige leermeting en de reden waarom het leren pauzeert. Dit tijdstip
  wordt vanaf deze update geregistreerd; ontbrekende historische tijden worden
  niet ingevuld.
- De laatst beoordeelde laadpuntmetingen, met uitleg welke koppelingen moeten
  worden gecontroleerd wanneer de gegevens ontbreken.
- Een laadbudget per kalenderdag, verdeeld in 00–07 en 07–24 uur. Dit verdeelt
  de gekozen laadblokken; het verandert de planning niet.
- Huidige opslag, verwacht woningverbruik tot het laaddoel en de conservatieve
  zonbijdrage vóór dat doel. Netenergie kan groter zijn dan de accucapaciteit
  doordat tussentijds ook woningverbruik moet worden aangevuld.

Het budget gebruikt één momentopname van de regelaar, met het tijdstip erbij.
Verouderde planning of leercontrole (ouder dan 150 seconden) wordt niet als
actueel getoond. Onbekende laadmetingen worden niet vervangen door nul.
Ontbrekende HA-metingen moeten bij de bron of koppeling worden hersteld.

Besparingen blijven schattingen. Beoordeel meerdere complete dagen; laden kan
de geschatte dagbesparing tijdelijk negatief maken vóór de latere ontlading.
Deze wijziging wijzigt geen laadbeslissingen, minimumreserve of sensoracceptatie.

Controle: `tests/charging-dashboard-quality.js`, volledige testsuite en
Vue-weergavecontrole voor normale, lege en offline gegevens.
