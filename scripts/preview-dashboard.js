// Isolated local preview with synthetic data. Outgoing UI commands only appear
// on-screen; no HA/Node-RED endpoints or credentials are used.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {parse,compileTemplate} = require('@vue/compiler-sfc');
const demo = require('../tests/fixtures/dashboard-demo');
const {pages} = require('./lib/dashboard-presentation');
const vue = fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'));
const root = path.resolve(__dirname,'..');
const server = http.createServer((req,res)=>{
    const url = new URL(req.url,'http://localhost');
    res.setHeader('Cache-Control','no-store');
    if (url.pathname==='/vue.js') {res.setHeader('Content-Type','text/javascript');res.end(vue);return;}
    if (url.pathname==='/viewport') {
        const width = Math.max(320,Math.min(1600,Number(url.searchParams.get('width'))||390));
        const route = pages.some(page=>page[1]===url.searchParams.get('page'))?url.searchParams.get('page'):'overzicht';
        const scenario = ['normal','empty','offline'].includes(url.searchParams.get('scenario'))?url.searchParams.get('scenario'):'normal';
        res.setHeader('Content-Type','text/html; charset=utf-8');
        res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lokale test ${width}px</title></head><body style="margin:0;background:#e5ecef"><output id="viewport-report" style="display:block;height:48px;font:12px system-ui;overflow-wrap:anywhere">Testweergave wordt geladen…</output><iframe title="Dashboard testweergave" src="/${route}?scenario=${scenario}" width="${width}" height="680" style="border:0;display:block;transform-origin:top left"></iframe><script>const f=document.querySelector('iframe');function size(){const scale=Math.min(1,innerWidth/${width});f.style.transform='scale('+scale+')';f.height=(innerHeight-48)/scale;document.body.style.height=innerHeight+'px'}addEventListener('resize',size);addEventListener('message',event=>{if(event.origin===location.origin&&event.source===f.contentWindow&&event.data.layoutReport)document.querySelector('#viewport-report').textContent=event.data.layoutReport});size()</script></body></html>`);
        return;
    }
    const page = pages.find(page=>'/'+page[1]===url.pathname) || (url.pathname==='/'?pages[0]:null);
    if (!page) {res.writeHead(404);res.end('Not found');return;}
    const flows = JSON.parse(fs.readFileSync(path.join(root,'flows.json'),'utf8'));
    const node = flows.find(node=>node.id===page[0]);
    const {descriptor,errors} = parse(node.format);
    const compiled = compileTemplate({source:descriptor.template.content,filename:page[1]+'.vue',id:page[0]});
    if(errors.length||compiled.errors.length){res.writeHead(500);res.end(String([...errors,...compiled.errors]));return;}
    const data = demo(flows,url.searchParams.get('scenario'));
    const script = descriptor.script.content.replace('export default','const component =');
    const style = descriptor.styles.map(item=>item.content).join('\n');
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${page[2]} · lokale test</title><style>body{margin:0;background:#f5f8f9}#preview-note{font:12px system-ui;padding:8px 24px;color:#52666e}#preview-action{display:block;white-space:pre-wrap;font:14px monospace;overflow-wrap:anywhere;padding:8px} ${style}</style></head><body><div id="preview-note">Lokale test · voorbeeldgegevens · geen apparaatbediening</div><div id="app"></div><output id="preview-action" aria-label="Testopdracht"></output><script src="/vue.js"></script><script>${script};component.template=${JSON.stringify(descriptor.template.content)};const oldData=component.data;component.data=function(){return {...oldData.call(this),msg:{payload:${JSON.stringify(data)}}}};component.methods.send=function(msg){document.getElementById('preview-action').textContent=JSON.stringify(msg);};const app=Vue.createApp(component);app.config.errorHandler=(error)=>{document.getElementById('preview-action').textContent='FOUT: '+error.message};app.component('v-icon',{props:['icon','size'],template:'<span aria-hidden="true" :title="icon" style="font-size:18px;line-height:1">◇</span>'});app.mount('#app');function reportLayout(){const overflow=document.documentElement.scrollWidth>innerWidth;parent.postMessage({layoutReport:JSON.stringify({page:location.pathname,width:innerWidth,overflow,error:document.querySelector('#preview-action').textContent,nav:getComputedStyle(document.querySelector('.ess-nav')).position,overflowing:[...document.querySelectorAll('.panel,.plan-grid,.config-grid,.control-row,.battery-hero')].filter(el=>el.getClientRects().length&&el.getBoundingClientRect().right>innerWidth).map(el=>el.className)})},location.origin)}Vue.nextTick(reportLayout);addEventListener('resize',reportLayout);</script></body></html>`);
});
server.listen(8776,'127.0.0.1',()=>console.log('Local dashboard preview: http://127.0.0.1:8776/overzicht'));
