module.exports = function apply(flows) {
    for(let i=flows.length-1;i>=0;i--) if(flows[i].id.startsWith('esslights_retry')) flows.splice(i,1);
    const control=flows.find(n=>n.id==='esslights_ctrl01');
    control.func=control.func.replace('return outputs;',`const commands=flow.get('ess_light_commands')||{};
const previous=commands[targetEntityId];
if (request.requestId && previous && previous.requestId===request.requestId) return null;
const token=(Number(flow.get('ess_light_command_sequence'))||0)+1;
flow.set('ess_light_command_sequence',token);
const selected=outputs.find(Boolean);
commands[targetEntityId]={token,requestId:request.requestId||null,role:entityId,entity:targetEntityId,active:!!outputs[0],brightness:outputs[0]?.payload.brightness??null,payload:selected.payload,attempts:1,at:Date.now(),status:'pending'};
flow.set('ess_light_commands',commands);
return [...outputs,{lightEntity:targetEntityId,lightToken:token}];`);
    control.outputs=3;
    control.wires.push(['esslights_retry_delay']);
    flows.push({id:'esslights_retry_delay',type:'delay',z:control.z,name:'Controleer licht na 2 seconden',pauseType:'delay',timeout:'2',timeoutUnits:'seconds',rate:'1',nbRateUnits:'1',rateUnits:'second',randomFirst:'1',randomLast:'5',randomUnits:'seconds',drop:false,allowrate:false,outputs:1,wires:[['esslights_retry_check']]});
    flows.push({id:'esslights_retry_check',type:'function',z:control.z,name:'Bevestig licht of herhaal vaste opdracht',outputs:3,wires:[['esslights_on001'],['esslights_off01'],['esslights_retry_delay']],func:`const commands=flow.get('ess_light_commands')||{};
const command=commands[msg.lightEntity];
if (!command || command.token!==msg.lightToken || command.status!=='pending') return null;
const config=flow.get('ess_system_config')||{};
const mapped=config.entities?.[command.role]??command.role;
if (config.modules?.lighting===false || mapped!==command.entity) return null;
const item=global.get('homeassistant')?.homeAssistant?.states?.[command.entity];
const state=item?.state;
const brightness=Number(item?.attributes?.brightness)/255*100;
const confirmed=state===(command.active?'on':'off') && (command.brightness===null || Math.abs(brightness-command.brightness)<=2);
if (confirmed) {command.status='confirmed';command.confirmedAt=Date.now();flow.set('ess_light_commands',commands);return null;}
if (command.attempts>=3) {command.status='failed';flow.set('ess_light_commands',commands);node.warn('Lichtopdracht niet bevestigd: '+command.entity);return null;}
command.attempts++;
flow.set('ess_light_commands',commands);
const outputs=[null,null,{lightEntity:command.entity,lightToken:command.token}];
outputs[command.active?0:1]={payload:command.payload};
return outputs;`});
    for(const template of flows.filter(n=>n.type==='ui-template'&&n.format)) {
        template.format=template.format.replace("this.send({topic:'ess/light/toggle',payload:{key:item.key,active}})","this.sendLightIntent(item,'ess/light/toggle',{key:item.key,role:item.entityId,active:active})")
            .replace("this.send({topic:'ess/light/brightness',payload:{key:item.key,brightness}})","this.sendLightIntent(item,'ess/light/brightness',{key:item.key,role:item.entityId,brightness:brightness})")
            .replace('    toggleLight(item){',`    sendLightIntent(item,topic,payload){const token=this.pendingLights[item.key].token;const message={topic,payload:{...payload,requestId:String(token)+':'+item.key}};this.send(message);setTimeout(()=>{if(this.pendingLights[item.key]?.token===token)this.send(message)},1500)},
    toggleLight(item){`);
    }
};
