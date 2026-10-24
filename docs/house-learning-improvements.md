# Betere benutting van geldige woningmetingen

Het uurprofiel gebruikt nog steeds uitsluitend metingen waarbij het verbruik
van beide laadpunten betrouwbaar is uitgesloten. Ontbrekende laadmetingen
worden niet vervangen door nul en meetgaten worden niet geïnterpoleerd.

Voorheen werd een uur van een dag alleen gebruikt bij minstens 45 gemeten
minuten. Daardoor konden herhaalde, bruikbare deelmetingen volledig verloren
gaan. Naast die bestaande route is nu een tweede route beschikbaar:

- Minstens drie afzonderlijke dagen voor hetzelfde klokuur.
- Per gebruikte dag minstens 15 werkelijk gemeten minuten.
- Samen minstens 90 gemeten minuten.
- Het gemiddelde wordt gewogen naar de werkelijk gemeten tijd.
- Werkdagen en weekend krijgen waar voldoende gegevens bestaan hun eigen
  patroon. Onvoldoende gegevens blijven terugvallen op het daggemiddelde.

Deze route werkt ook op al opgeslagen geldige uurmetingen. Het systeem maakt
hiervan geen volledige meetdagen: meetdekking en goedgekeurde dagen blijven
apart. De bronvermelding toont wanneer herhaalde deelmetingen worden benut.
Dit kan de laadplanning veranderen omdat meer uren een gemeten verbruiksprofiel
krijgen. SOC-doel, reservegrenzen en voorwaarden voor rendabel laden blijven
gelijk. Beperkte of selectieve dekking blijft onzekerheid geven; de drempels
garanderen niet dat een meting representatief is voor ieder toekomstig uur.

Het dagmodel verdeelt een geldig meetinterval van maximaal vijf minuten nu
over middernacht in Europe/Amsterdam. Zo gaat de laatste/eerste minuut van
een dag niet verloren. Lange of ongeldige intervallen worden niet aangevuld.
Een te laat ontvangen uurmeting wist geen nieuwere meetbasis.

De uitsluiting van autoladen controleert nu ook een tegenstrijdige nulmeting
tegen de tweede autoregelaar. Een laadpunt met alleen een stroom- of
online-koppeling wordt niet meer aangezien voor een afwezig laadpunt.

Getest: tijdgewogen deelmetingen, minimale dekking, hergebruik zonder wijziging
van historie, daggrens, ongeldige meetgaten, late berichten, beide laadpunten,
bestaande laadplannen en de volledige regressiesuite. Live meetdekking moet
na installatie worden beoordeeld; deze wijziging herstelt geen offline apparaat.
