// Resolve the HA device identifier from its registry, never from a private
// installation-specific ID committed to the public flow.
module.exports = function easeeServiceCompat(flows) {
    const z='ess000000000001', server='ess00000000000b';
    const ids=['ess_easee_registry','ess_easee_registry_save','ess_easee_registry_inj'];
    for(let i=flows.length-1;i>=0;i--)if(ids.includes(flows[i].id))flows.splice(i,1);
    flows.push({id:ids[0],type:'ha-api',z,name:'Koppel Easee aan HA-apparaten',server,version:1,protocol:'websocket',method:'get',path:'',data:'{"type":"config/entity_registry/list"}',dataType:'json',responseType:'json',outputProperties:[{property:'easeeRegistry',propertyType:'msg',value:'',valueType:'results'}],wires:[[ids[1]]],x:450,y:2700});
    flows.push({id:ids[1],type:'function',z,name:'Bewaar actuele Easee-apparaatkoppeling',outputs:0,wires:[],func:"const entries=msg.easeeRegistry?.result||msg.easeeRegistry;const states=global.get('homeassistant')?.homeAssistant?.states;if(!Array.isArray(entries)||!states)return null;const map={};for(const e of entries){const charger=states[e.entity_id]?.attributes?.id;if(e.platform==='easee'&&!e.disabled_by&&charger&&e.device_id)map[charger]=e.device_id;}flow.set('ess_easee_device_ids',map);return null;",x:800,y:2700});
    flows.push({id:ids[2],type:'inject',z,name:'Ververs Easee-apparaatkoppeling',props:[{p:'payload'}],once:true,onceDelay:5,repeat:'300',wires:[[ids[0]]],x:150,y:2700});
    for(const n of flows){
        if(n.type==='api-call-service'&&(n.domain==='easee'||String(n.action||'').startsWith('easee.'))&&String(n.data).includes('payload.chargerId')){
            n.data=n.data.replace('"charger_id": payload.chargerId','"device_id": $lookup($flowContext("ess_easee_device_ids"), payload.chargerId)');
            n.data='($device := $lookup($flowContext("ess_easee_device_ids"), payload.chargerId); $assert($type($device) = "string" and $length($device) > 0, "Easee-apparaatkoppeling ontbreekt"); '+n.data+')';
        }
        if(n.type==='function'&&String(n.func).includes("const chargerOnline = state('binary_sensor.ev_charger")){
            n.func=n.func.replace(/const chargerOnline = state\('(binary_sensor\.ev_charger(?:_2)?_online)'\) === 'on';/g,(_,online)=>{
                const second=online.includes('_2_'),power=second?'sensor.ev_charger_2_power':'sensor.ev_charger_power',status=second?'sensor.ev_charger_2_status':'sensor.ev_charger_status';
                return `const chargerOnlineState = state('${online}');\n// An unknown stream flag can coexist with fresh successful REST polling.\n// A known offline flag or stale telemetry must still block all commands.\nconst chargerOnline = chargerOnlineState === 'on' || (['unknown','unavailable',''].includes(chargerOnlineState) && fresh('${power}',30000) && fresh('${status}',120000) && ['charging','awaiting_start','awaiting_authorization','ready_to_charge','disconnected'].includes(state('${status}')));`;
            });
        }
    }
};
