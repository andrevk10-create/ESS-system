const fs = require('fs');
const path = require('path');

const flowPath = path.join(__dirname, '..', 'flows.json');
const flows = JSON.parse(fs.readFileSync(flowPath, 'utf8'));

const dashboard = flows.find((node) => node.id === 'ess000000000004');
const settings = flows.find((node) => node.id === 'ess000000000011');
const page = flows.find((node) => node.id === 'ess000000000006');

if (!dashboard || !page) {
  throw new Error('De verwachte dashboardonderdelen zijn niet gevonden.');
}

if (dashboard.format.includes('class="mp-shell"')) {
  dashboard.height = '13';
  fs.writeFileSync(flowPath, `${JSON.stringify(flows, null, 2)}\n`);
  process.exit(0);
}

if (!settings) throw new Error('De verwachte EV-instellingen ontbreken.');

const dashboardMarker = '/* Samsung Galaxy Tab A8: touchvriendelijk in liggende en staande stand. */';
const dashboardCss = `
${dashboardMarker}
.ess-shell{max-width:1400px;margin:0 auto;padding:8px 10px 14px;-webkit-tap-highlight-color:transparent}
.ess-shell button,.ess-shell input{touch-action:manipulation}
.smart-control button{min-width:78px;min-height:44px;padding:0 15px;font-size:12px}
.summary article,.card,.flow-panel{border-radius:16px}
.live,.mode{min-height:36px;padding:0 13px;font-size:11px}
@media (min-width:760px) and (max-width:1280px){
  .ess-shell{font-size:14px}
  .ess-head{align-items:center;margin-bottom:10px}
  .ess-head h1{font-size:30px}
  .dashboard-grid{grid-template-columns:repeat(12,minmax(0,1fr));gap:10px}
  .energy-card{grid-column:span 6}
  .phase-card,.battery-card{grid-column:span 3}
  .charger-card,.loads-card,.dashboard-grid .loads-card{grid-column:span 6}
  .dashboard-grid .card{min-height:148px;padding:11px}
  .mini-energy-map{height:119px}
  .mini-node{height:35px;padding:4px 7px}
  .mini-node span{font-size:10px}
  .mini-node b{font-size:12px}
  .dashboard-grid .card-head b{font-size:14px}
  .dashboard-grid .device{min-height:37px;padding:5px 0}
  .dashboard-grid .device b,.dashboard-grid .device>span{font-size:13px}
  .dashboard-grid .device small{font-size:11px}
  .phase-card .phase{margin:11px 0}
  .phase-card .phase>span,.phase-card .phase>b{font-size:12px}
}
@media (min-width:760px) and (max-width:1280px) and (orientation:portrait){
  .energy-card{grid-column:span 12}
  .phase-card,.battery-card{grid-column:span 6}
  .charger-card,.loads-card,.dashboard-grid .loads-card{grid-column:span 12}
  .mini-energy-map{height:130px}
}
@media (max-width:759px){
  .ess-shell{padding:6px}
  .head-status{width:100%}
  .live,.mode{flex:1;justify-content:center}
  .smart-control button{min-height:46px}
}`;

const settingsMarker = '/* Samsung Galaxy Tab A8: ruime invoervelden en aanraakdoelen. */';
const settingsCss = `
${settingsMarker}
.ev-config{max-width:1400px;margin:0 auto;border-radius:16px}
.config-grid input{min-height:44px;font-size:16px}
.config-grid label,.price-info,.plan-info{padding:11px}
@media (min-width:760px) and (max-width:1280px){
  .ev-config{padding:15px}
  .config-head b{font-size:17px}
  .config-head span,.config-grid label>span,.price-info span,.price-info small,.plan-info span,.plan-info small{font-size:11px}
  .config-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
}
@media (min-width:760px) and (max-width:900px) and (orientation:portrait){
  .config-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}`;

function addCss(template, marker, css) {
  if (template.includes(marker)) return template;
  return template.replace('</style>', `${css}\n</style>`);
}

dashboard.format = addCss(dashboard.format, dashboardMarker, dashboardCss);
settings.format = addCss(settings.format, settingsMarker, settingsCss);
// De hoofdtegel moet hoog genoeg zijn voor beide kaart-rijen en de meldingsbalk.
// Zo scrolt de pagina als geheel en ontstaat er geen scrollbar binnen de tegel.
dashboard.height = '9';
page.breakpoints = [
  { name: 'Mobiel', px: '0', cols: '3' },
  { name: 'Tablet staand', px: '600', cols: '12' },
  { name: 'Tab A8', px: '760', cols: '12' },
  { name: 'Desktop', px: '1281', cols: '12' }
];
page.className = 'tab-a8-dashboard';

fs.writeFileSync(flowPath, `${JSON.stringify(flows, null, 2)}\n`);
