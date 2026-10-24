// Persist evidence, never a command queue or an assumed active session.
function witSessionEvidence(input){
    if(!input||input.version!==1)return null;
    const stamp=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
    const text=v=>typeof v==='string'&&v.length>0&&v.length<=512;
    let writeAck=null,fault=null;
    if(input.writeAck!=null){
        const a=input.writeAck;
        if(!stamp(a.at)||!stamp(a.sentAt)||a.at<a.sentAt||!text(a.deviceId)||!text(a.configEntryId)||
            !/^select\.[a-z0-9_]+$/.test(a.remoteEntity||'')||!/^select\.[a-z0-9_]+$/.test(a.authorityEntity||'')||
            !Number.isInteger(a.powerPercent)||a.powerPercent<3||a.powerPercent>100)return null;
        writeAck={at:a.at,sentAt:a.sentAt,deviceId:a.deviceId,configEntryId:a.configEntryId,remoteEntity:a.remoteEntity,authorityEntity:a.authorityEntity,powerPercent:a.powerPercent};
    }
    const releaseAck={};
    for(const step of ['authority','remote'])if(input.releaseAck?.[step]!==undefined){
        if(!stamp(input.releaseAck[step]))return null;
        releaseAck[step]=input.releaseAck[step];
    }
    if(input.fault!=null){
        const f=input.fault;
        if(!stamp(f.at)||!text(f.reason))return null;
        fault={at:f.at,reason:f.reason,attempts:Number.isInteger(f.attempts)?f.attempts:2,...(text(f.deviceId)?{deviceId:f.deviceId}:{})};
    }
    return {version:1,writeAck,releaseAck,fault};
}
module.exports=function apply(flows){
    const get=id=>flows.find(n=>n.id===id);
    for(const id of ['essprefs_save','essprefs_restore']){
        const n=get(id);n.func=witSessionEvidence.toString()+'\n'+n.func;
        if(id==='essprefs_save')n.func=n.func.replace('    return result;',`    const ack=flow.get('ess_wit_grid_write_ack');
    const evidence=witSessionEvidence({version:1,writeAck:ack?.configEntryId?ack:null,releaseAck:flow.get('ess_wit_release_ack')||{},fault:flow.get('ess_wit_command_fault')||null});
    if(evidence)result.witSessionEvidence=evidence;
    return result;`);
        else n.func=n.func.replace('    for (const [key,value] of Object.entries(candidate))',`    const evidence=witSessionEvidence(saved.witSessionEvidence);
    if(evidence){
        if(evidence.writeAck&&!flow.get('ess_wit_grid_write_ack'))candidate.ess_wit_grid_write_ack=evidence.writeAck;
        candidate.ess_wit_release_ack={};
        for(const step of ['authority','remote']){
            const at=Math.max(evidence.releaseAck[step]||0,Number(flow.get('ess_wit_release_ack')?.[step])||0);
            if(at>0)candidate.ess_wit_release_ack[step]=at;
        }
        if(evidence.fault&&!flow.get('ess_wit_command_fault'))candidate.ess_wit_command_fault=evidence.fault;
    }
    for (const [key,value] of Object.entries(candidate))`);
    }
    // Save the verified result promptly, not only on the periodic backup tick.
    for(const id of ['esswitgrid_transport_dispatch','esswitgrid_transport_reply'])get(id).wires[1].push('essprefs_save');
    const release=get('esswit_release_ack');
    release.outputs=1;release.wires=[['essprefs_save']];
    release.func=release.func.replace(/return null;\s*$/, 'return {payload:Date.now()};');
    // A restore is only a candidate. Existing fresh native-readback, lease,
    // release, target and fault checks still decide whether to adopt it.
    const grid=get('esswitgrid_ctrl1');
    const marker='chargeReadback.deviceId===chargeAck.deviceId &&';
    if(!grid.func.includes(marker))throw Error('WIT ownership proof anchor missing');
    grid.func=grid.func.replace(marker,marker+"\n    (!chargeAck.configEntryId||chargeReadback.configEntryId===chargeAck.configEntryId) &&");
};
module.exports.witSessionEvidence=witSessionEvidence;
