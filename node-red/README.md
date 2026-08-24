# Node-RED

## GitHub-monitor voor Home Assistant Core

Importeer `flows/github-monitor.json` via **Node-RED → Import → Clipboard/File**. Open daarna iedere Home Assistant-servicenode en selecteer de bestaande Home Assistant-serverconfiguratie.

Stel lokaal de environment variable `ESS_GITHUB_REPOSITORY` in als `owner/repository`. De repositorynaam wordt bewust niet in de openbare flow opgeslagen. Als alternatief kan een eigen lokale flow vooraf `flow.ess_github_repository` vullen.

De flow:

- controleert bij het starten en daarna iedere vijf minuten de laatste commit op `main`;
- bewaart de laatst bekende en laatst toegepaste commit in de Node-RED-flowcontext;
- toont een permanente Home Assistant-melding wanneer een nieuwe commit beschikbaar is;
- overschrijft of herstart Home Assistant niet automatisch;
- heeft een handmatige knop om een gecontroleerde commit als toegepast te markeren.

Bij de eerste succesvolle controle wordt de actuele commit als uitgangspunt opgeslagen. Pas een volgende commit veroorzaakt dus een melding.

### Benodigd

- Home Assistant Core;
- een werkende Node-RED-installatie;
- `node-red-contrib-home-assistant-websocket`;
- internettoegang vanuit Node-RED naar `api.github.com`.

### Privérepository

De huidige HTTP-aanroep werkt zonder token wanneer de repository openbaar is. Maak de repository bij voorkeur niet openbaar uitsluitend voor deze flow. Voor een privérepository moet later een GitHub-token met alleen leesrechten worden toegevoegd via een lokale environment variable of beveiligde credential store. Sla het token nooit op in de flow of repository op.

### Vervolgstap

Automatisch ophalen en installeren wordt pas toegevoegd nadat de Home Assistant-configuratiemap, de Python/HA-opdracht voor `check_config`, het back-uppad en de herstelprocedure op de Core-host zijn bevestigd en getest.
