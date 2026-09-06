// Synthetic data only: this fixture never contacts Home Assistant or a device.
module.exports = function dashboardDemo(flows, scenario = 'normal') {
    let config;
    new Function('flow', flows.find(node=>node.id==='essconfig_control').initialize)({get:()=>null,set:(_,value)=>config=value});
    config.modules = Object.fromEntries(Object.keys(config.modules).map(key=>[key,true]));
    config.siteName = 'Smart ESS';
    const now = Math.floor(Date.now()/900000)*900000;
    const slots = (offset,count,power) => Array.from({length:count},(_,i)=>({start:new Date(now+(offset+i)*900000).toISOString(),end:new Date(now+(offset+i+1)*900000).toISOString(),allInPrice:.16,energy:power/4,energyKwh:power/4,powerKw:power}));
    const zone = (key,name,entityId,active=true) => ({key,name,entityId,configured:true,available:true,active,current:21.5,target:22,humidity:48,mode:active?'heat':'off',modeLabel:active?'Verwarmen':'Uit',status:active?'Verwarmen':'Uit',min:5,max:30,step:.5});
    const data = {
        updatedAt:new Date().toISOString(),mode:'Automatisch',configuration:{config,status:{valid:true,missing:[],unavailable:[]}},
        grid:{power:-350,l1:8,l2:5,l3:7,importToday:8.4,exportToday:2.6,daySource:'P1-dagmeting'},
        solar:{power:3200,today:16,actualToday:26.4,forecastToday:29,forecastTomorrow:24.6},
        house:{power:1850,forecastBaseTomorrow:18,audiPlannedTomorrow:12,witPlannedTomorrow:4,forecastTomorrow:34},
        battery:{soc:68,power:2400,state:'Laden'},
        audiSmart:{enabled:true,forceFull:false,active:false,status:'Wacht op het geplande laadmoment',targetCurrent:0,phaseMode:3,controlMode:'departure-plan',departureSoc:80,solarSoc:80,departureTime:'06:00',allInPrice:.27,plannedChargePowerKw:11,plannedGridEnergyKwh:16.5,plannedGridCost:2.64,departureEnergyNeeded:19,solarEnergyReservedKwh:2.5,scheduleComplete:true,selectedSlots:slots(8,6,11),departureAt:new Date(now+24*3600000).toISOString(),nextScheduledStart:slots(8,1,11)[0].start,nextScheduledEnd:slots(13,1,11)[0].end,requiredSlots:6,scheduledSlots:6},
        audiClimate:{active:false,status:'Uit'},
        ev:[{name:'EV',soc:56,power:0,today:4.2,locked:'Op slot',status:'Wacht op autorisatie'},{name:'EV 2',power:0,today:0,status:'Niet aangesloten'}],
        wit:{power:2400,systemOutputPower:1600,solarPower:1400,today:10.4,exportLimitEnabled:true,exportLimitRate:1,exportLimitMode:'auto',audiBufferMode:'normal',audiDischargeActive:false,audiDischargePower:0,audiDischargeBudgetKwh:3.6,audiDischargeStatus:'EV laadt niet; extra ontladen niet nodig',
            runtime:{direction:'Normale regeling',requestedPowerW:0,measuredPowerW:2400,powerConfirmed:false,commandConfirmed:false,level:'ok',status:'Geen tijdelijke WIT-opdracht actief',p1Fresh:true,pricesFresh:true,houseReserveKwh:18,batteryRechargeTargetSoc:100,safetyFloorSoc:30,forecastWindow:'Komende 24 uur'},
            gridCharge:{mode:'auto',targetSoc:80,status:'Wacht op goedkoop laadblok',expectedSolarChargeKwh:11,expectedHouseKwh:18,gridEnergyNeededKwh:4,plannedPowerKw:8,plannedEnergyKwh:4,plannedCost:.64,selectedSlots:slots(20,2,8),scheduledNow:false,nextScheduledStart:slots(20,1,8)[0].start,nextScheduledEnd:slots(21,1,8)[0].end}},
        loads:[{name:'Werkplek',power:210,status:'Actief',active:true},{name:'Wasruimte',power:1250,status:'Actief',active:true},{name:'Warmtepomp',power:350,status:'Actief',active:true},{name:'Koeling',power:0,status:'Uit',active:false},{name:'Ongebruikt',power:null,status:'Niet beschikbaar',active:false},{name:'Flexibele last',power:40,status:'Actief',active:true,controlKey:'compressor',controlType:'switch'},{name:'Buiten',power:null,status:'Niet beschikbaar',active:false}],
        lighting:{rooms:Array.from({length:4},(_,i)=>({key:'zone-'+(i+1),entityId:'light.zone_'+(i+1),name:['Woonkamer','Keuken','Werkkamer','Hal'][i],available:true,active:i<2,brightness:i<2?65:0,status:i<2?'Aan':'Uit'})),onCount:2,totalCount:4},
        climate:{outside:{temperature:18.2,humidity:60},aircos:[zone('cooling-zone-1','Werkkamer','climate.cooling_zone_1',false),zone('cooling-zone-2','Boven','climate.cooling_zone_2',false)],tado:[zone('heating-zone-1','Woonkamer','climate.heating_zone_1'),zone('heating-zone-2','Keuken','climate.heating_zone_2',false)],heatPump:zone('heat-pump','Warmtepomp','climate.heat_pump'),hotWater:{...zone('hot-water','Tapwater','water_heater.domestic_hot_water'),current:49,target:55,min:40,max:60},unmappedCount:0},
        nas:{name:'NAS',available:true,ok:true,summary:'Alles in orde',cpu:15,memory:52,temperature:34,download:10,upload:2,fanModeLabel:'Stil',drive:{temperature:29,statusLabel:'Normaal',healthLabel:'Gezond',ok:true},volume:{used:.2,usedPercent:11.3,statusLabel:'Normaal'},securitySafe:true,securityLabel:'Veilig',updateLabel:'DSM up-to-date',issues:[]},
        alarms:[],details:{grid:[],solar:[],battery:[],ev:[],loads:[],system:[]},
        presentation:{configuredRoles:Object.keys(config.entities).filter(role=>!['sensor.flex_load_6_power','sensor.flex_load_7_power','climate.heating_zone_3'].includes(role)),pricesFresh:true,priceSlots:Array.from({length:96},(_,i)=>({...slots(i,1,0)[0],allInPrice:i>=8&&i<24?.16:.22+Math.sin(i/11)*.09}))}
    };
    if (scenario === 'offline') {
        data.climate.tado[0]={...data.climate.tado[0],available:false,status:'Niet beschikbaar',active:false};
        data.wit.runtime={...data.wit.runtime,p1Fresh:false,pricesFresh:false,level:'error',status:'P1-meetdata ontbreekt of is te oud'};
        data.presentation.pricesFresh=false;
        data.configuration.status.unavailable=['climate.heating_zone_1'];
    }
    if (scenario === 'empty') {
        data.presentation.configuredRoles=[];data.ev=[];data.loads=[];data.lighting.rooms=[];
        data.climate={aircos:[],tado:[],heatPump:{configured:false},hotWater:{configured:false}};
        data.solar={};data.house={};data.battery={};data.grid={};data.wit={gridCharge:{selectedSlots:[]},runtime:{}};
        data.audiSmart={};data.nas={available:false,drive:{},volume:{}};
        data.configuration.status={valid:false,missing:['sensor.p1_meter_vermogen'],unavailable:[]};
    }
    return data;
};
