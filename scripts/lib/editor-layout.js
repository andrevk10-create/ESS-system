// Editor metadata only. Keep all nodes in the same flow to preserve flow context.
module.exports=function editorLayout(flows){
    const tab='ess000000000001';
    const sections=[
        ['dash01','Dashboard en pagina’s','#dbeafe'],
        ['config','Configuratie en opgeslagen voorkeuren','#e2e8f0'],
        ['prices1','Stroomprijzen','#fef3c7'],
        ['audi01','Audi · laden links','#dcfce7'],
        ['jeep01','Jeep · laden rechts','#dcfce7'],
        ['vehicle','Auto’s · klimaat, sloten en SOC','#dcfce7'],
        ['climate','Klimaat en warm water','#fee2e2'],
        ['homekit','HomeKit · temperatuur en hysterese','#fee2e2'],
        ['lights1','Verlichting','#fef3c7'],
        ['loads1','Overige verbruikers','#fef3c7'],
        ['wit001','WIT · netladen, export en EV-buffer','#ede9fe'],
        ['witread','WIT · registermetingen en BMS-grenzen','#ede9fe'],
        ['witwrite','WIT · laadopdrachten en bevestiging','#ede9fe'],
        ['imbalance','WIT · fasecompensatie','#ede9fe'],
        ['history','Verbruik leren en historie','#dbeafe'],
        ['other','Overige verbindingen','#e2e8f0']
    ];
    const keys=new Set(sections.map(s=>'esseditor_'+s[0]));
    const category=n=>{
        const id=n.id;
        if(/^esshk_|^essclim_hk|^essclim_hyst/.test(id))return 'homekit';
        if(/^essimbalance/.test(id))return 'imbalance';
        if(/^esswit_readback|^esswit_limits|^esswit_current/.test(id))return 'witread';
        if(/^esswitgrid_transport|^esswit_release_ack/.test(id))return 'witwrite';
        if(/^esswithist|^essp1hist/.test(id))return 'history';
        if(/^essjvehicle|^essmanualsoc|^essclimateev|^essaudi_device|^essaudi_guard|^essaudi_climate|^essaudi_vehicle|^essaudi_power/.test(id))return 'vehicle';
        if(/^essjeep/.test(id))return 'jeep01';
        if(/^essprefs|^essconfig|^esstpl_config/.test(id))return 'config';
        if(/^esslights/.test(id))return 'lights1';
        if(/^essclim|^esswater/.test(id))return 'climate';
        if(/^esswit/.test(id))return 'wit001';
        if(/^ess_easee|^essaudi/.test(id))return 'audi01';
        if(keys.has(n.g))return n.g.slice('esseditor_'.length);
        return 'other';
    };
    const nodes=flows.filter(n=>n.z===tab&&n.type!=='group');
    const buckets=new Map(sections.map(s=>[s[0],[]]));
    for(const n of nodes)buckets.get(category(n)).push(n);
    for(let i=flows.length-1;i>=0;i--)if(flows[i].z===tab&&flows[i].type==='group')flows.splice(i,1);
    let top=40;
    sections.forEach(([key,label,fill],index)=>{
        const members=buckets.get(key);
        if(!members.length)return;
        // Follow connections where possible; feedback loops stay in a stable order.
        const ids=new Set(members.map(n=>n.id)),incoming=new Map(members.map(n=>[n.id,0]));
        for(const n of members)for(const to of (n.wires||[]).flat())if(ids.has(to))incoming.set(to,incoming.get(to)+1);
        const queue=members.filter(n=>incoming.get(n.id)===0),ordered=[];
        const seen=new Set();
        while(queue.length){const n=queue.shift();if(seen.has(n.id))continue;seen.add(n.id);ordered.push(n);
            for(const to of (n.wires||[]).flat())if(ids.has(to)){incoming.set(to,incoming.get(to)-1);if(incoming.get(to)===0)queue.push(members.find(m=>m.id===to));}}
        ordered.push(...members.filter(n=>!seen.has(n.id)));
        const groupId='esseditor_'+key,rows=Math.ceil(ordered.length/4),height=80+rows*90;
        ordered.forEach((n,i)=>{n.g=groupId;n.x=350+(i%4)*520;n.y=top+80+Math.floor(i/4)*90;});
        flows.push({id:groupId,type:'group',z:tab,name:String(index+1).padStart(2,'0')+' · '+label,
            style:{stroke:'#94a3b8',fill,'fill-opacity':'0.28',label:true,'label-position':'nw',color:'#334155'},
            nodes:ordered.map(n=>n.id),x:40,y:top,w:2180,h:height});
        top+=height+50;
    });
};
