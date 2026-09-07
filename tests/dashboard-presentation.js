const assert = require('node:assert/strict');
const {parse,compileTemplate} = require('@vue/compiler-sfc');
const {createSSRApp} = require('vue');
const {renderToString} = require('vue/server-renderer');
const flows = require('../flows.json');
const demo = require('./fixtures/dashboard-demo');
const {pages,planView,configurationGroups,numberOrNull} = require('../scripts/lib/dashboard-presentation');

const quarter = 900000;
const now = Date.parse('2026-01-10T22:15:00Z');
const slot = (offset,rate=.2) => ({start:new Date(now+offset*quarter).toISOString(),end:new Date(now+(offset+1)*quarter).toISOString(),allInPrice:rate});
const data = {audiSmart:{selectedSlots:[slot(0),slot(1),slot(3)]},wit:{gridCharge:{selectedSlots:[slot(1),slot(2)]}},presentation:{pricesFresh:true,priceSlots:[slot(0,-.1),slot(1,0),slot(2,.3),slot(3,null)]}};
const before = JSON.stringify(data);
const plan = planView(data,now);
assert.equal(plan.cells.length,96);
assert.equal(plan.cells[0].ev,true);
assert.equal(plan.cells[1].wit,true);
assert.equal(plan.cells[2].ev,false);
assert.equal(plan.cells[0].rate,-.1);
assert.equal(plan.cells[1].rate,0);
assert.equal(plan.cells[3].rate,null);
assert.equal(plan.cells[95].rate,null);
assert.equal(plan.cells.filter(cell=>cell.now).length,1);
assert.equal(plan.blocks.length,3,'Adjacent selected quarters should be one readable block');
assert.equal(plan.blocks[0].end,slot(1).end);
assert.equal(JSON.stringify(data),before,'Rendering must never replan or mutate the controller model');
assert(plan.cells.every(cell=>Number.isFinite(cell.height)&&cell.height>=0&&cell.height<=100));
assert(planView({...data,presentation:{pricesFresh:false,priceSlots:data.presentation.priceSlots}},now).cells.every(cell=>cell.rate===null),'Stale prices must not be presented as current');
assert.equal(planView({},now).blocks.length,0);
assert(planView({presentation:{pricesFresh:true,priceSlots:[slot(0,0),slot(1,0)]}},now).cells.every(cell=>Number.isFinite(cell.height)),'Equal/zero prices must not divide by zero');
assert.equal(planView({audiSmart:{selectedSlots:[{start:'invalid',end:'invalid'},slot(-1)]}},now).blocks.length,0);
assert.equal(numberOrNull(null),null);
assert.equal(numberOrNull(''),null);
assert.equal(numberOrNull('unavailable'),null);
assert.equal(numberOrNull(0),0);

const rows = [{canonical:'sensor.p1_meter_vermogen',actual:'sensor.lab_grid'}, {canonical:'sensor.growatt_battery_battery_soc',actual:''}, {canonical:'climate.heating_zone_1',actual:'climate.lab_zone'}];
assert.equal(configurationGroups(rows,'P1',false,[],[])[0].name,'Net & P1');
assert.equal(configurationGroups(rows,'lab_zone',false,[],[])[0].name,'Klimaat');
assert.equal(configurationGroups(rows,'',true,[],['climate.heating_zone_1']).length,2);
assert.equal(configurationGroups(rows,'does-not-exist',false,[],[]).length,0);

function componentFor(node) {
    const {descriptor,errors}=parse(node.format);
    assert.deepEqual(errors,[],node.id+' SFC parse');
    const compiled=compileTemplate({source:descriptor.template.content,filename:node.id+'.vue',id:node.id});
    assert.deepEqual(compiled.errors,[],node.id+' Vue template compile');
    const component=new Function(descriptor.script.content.replace('export default','return'))();
    component.template=descriptor.template.content;
    return component;
}
function modelFor(component,model) {
    const sent=[];
    const vm={...component.data(),msg:{payload:model},send:message=>sent.push(message)};
    for(const [key,fn] of Object.entries(component.methods)) vm[key]=fn.bind(vm);
    for(const [key,fn] of Object.entries(component.computed)) Object.defineProperty(vm,key,{get:()=>fn.call(vm)});
    return {vm,sent};
}

async function main() {
    for(const [id,route] of pages) {
        const node=flows.find(node=>node.id===id);
        assert.equal(node.height,'0');
        assert.equal(node.className,'ess-dashboard-widget');
        assert.equal((node.format.match(/aria-label="Hoofdnavigatie"/g)||[]).length,1);
        assert(node.format.includes(`href="./${route}" aria-current="page"`));
        assert(node.format.includes('prefers-reduced-motion'));
        assert(!node.format.includes('ess-status-summary'),'No repeated global alarm banners');
        assert(node.format.includes('linear-gradient(125deg,#102d35,#174c50 62%,#14776d)'),'Keep the original gradient visual style');
        const component=componentFor(node);
        for(const scenario of ['normal','offline','empty']) {
            const model=demo(flows,scenario);
            const originalData=component.data;
            const errors=[];
            const app=createSSRApp({...component,data(){return {...originalData.call(this),msg:{payload:model}}},methods:{...component.methods,send(){throw new Error('A render must never send a device command');}}});
            app.component('v-icon',{props:['icon','size'],template:'<span aria-hidden="true"></span>'});
            app.config.warnHandler=message=>errors.push(message);
            app.config.errorHandler=error=>errors.push(error.message);
            const html=await renderToString(app);
            const alarmClasses=Array.from(html.matchAll(/class="([^"]*)"/g),match=>match[1].split(/\s+/)).filter(classes=>classes.includes('alarm-item'));
            assert.deepEqual(errors,[],route+' '+scenario+' render');
            assert(html.includes('ess-refresh'),route+' renders its shell');
            if(route==='systeem'&&scenario==='offline') {
                assert(html.includes('class="panel span-12 ess-alerts"'));
                assert(alarmClasses.some(classes=>classes.includes('error')),'System must retain actual error details');
                assert(html.includes('WIT-regeling: P1-meetdata ontbreekt of is te oud'));
            } else if(route!=='systeem') {
                assert.equal(alarmClasses.length,0,'Global alarm lists belong only on System');
                assert(!html.includes('aandachtspunten'),'No global alarm summary on working pages');
            }
        }
        if(route!=='configuratie') {
            assert.equal(typeof component.mounted,'function');
            assert.equal(typeof component.unmounted,'function');
            assert(component.unmounted.toString().includes('clearInterval'),'Page clock must be cleaned up');
            const {vm}=modelFor(component,demo(flows));
            assert.equal(vm.power(null),'—');
            assert.equal(vm.power(0),'0 W');
            vm.presentationNow=Date.parse(vm.d.updatedAt)+31000;
            assert.equal(vm.stale,true,'Staleness should advance even without a new dashboard message');
        }
    }
    const {vm,sent}=modelFor(componentFor(flows.find(n=>n.id==='esstpl_ev0000001')),demo(flows));
    vm.toggleEV();vm.toggleForceFull();vm.startClimate();vm.setWitExportMode('auto');vm.setWitGridChargeMode('on');vm.setWitEVBufferMode('eco');
    assert.deepEqual(sent,[
        {topic:'ess/audi/smart-enabled',payload:false}, {topic:'ess/audi/force-full',payload:true},
        {topic:'ess/audi/climate-start',payload:true}, {topic:'ess/wit/export-mode',payload:'auto'},
        {topic:'ess/wit/grid-charge-mode',payload:'on'}, {topic:'ess/wit/audi-buffer-mode',payload:'eco'}
    ],'Presentation must retain existing command topics and payloads');
    const fixtureBefore=JSON.stringify(vm.d);
    assert.equal(vm.visibleLoads.length,5,'Unmapped loads must be hidden');
    assert.equal(vm.visibleLoads[0].name,'Wasruimte','Active highest-power load comes first');
    assert.equal(vm.visibleLoads.at(-1).active,false);
    assert.equal(vm.visibleLoadPower,1850);
    assert.equal(vm.totalPvPower,4600,'PV summary includes loose PV plus WIT PV');
    assert.equal(JSON.stringify(vm.d),fixtureBefore,'Presentation lists must not sort or annotate the live arrays');
    vm.msg.payload=demo(flows,'empty');
    assert.equal(vm.visibleLights.length,0);
    assert.equal(vm.visibleCooling.length,0);
    assert.equal(vm.visibleHeating.length,0);
    assert.equal(vm.visibleHeatPump.length,0);
    assert.equal(vm.visibleLoadPower,null);
    assert.equal(vm.measuredEvPower,null,'Missing charger measurements must not look like zero watts');
    assert.equal(vm.totalPvPower,null);

    const mapper=flows.find(n=>n.id==='ess00000000000a').func;
    const fragment=mapper.match(/\/\/ BEGIN PRESENTATION DATA([\s\S]*?)\/\/ END PRESENTATION DATA/)[1];
    const model={wit:{runtime:{pricesFresh:true}}};
    new Function('dashboard','essRuntimeConfig','rawStates','flow',fragment)(model,{entities:{'light.zone_1':'light.saved_but_offline','light.zone_2':'light.zone_2','light.zone_3':'light.zone_3'}},{'light.zone_3':{state:'unavailable'}},{get:()=>[]});
    assert.deepEqual(model.presentation.configuredRoles,['light.zone_1','light.zone_3'],'Keep selected/offline roles but hide unused defaults');
    console.log('Dashboard presentation: nine pages, normal/offline/empty rendering, read-only timelines, mappings and command contracts OK');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
