module.exports=function apply(flows){
 const ui=flows.find(n=>n.id==='esstpl_ev0000001');
 ui.format=ui.format.replace(/<p class="subtle ess-ev-reason">[\s\S]*?<\/p>/g,'')
  .replaceAll("d.audiClimate&&d.audiClimate.status||'Niet beschikbaar'", "d.audiClimate?.available?(d.audiClimate.active?'Aan':'Uit'):'Onbekend'")
  .replaceAll("'Geen actieve opdracht'","'Uit'")
  .replace(/<small>\{\{d\.audiClimate&&d\.audiClimate\.status\|\|'Gereed'\}\}<\/small>/g,'')
  .replace(/<small>\{\{d\.jeepVehicle\.climateRequested\?'Start aangevraagd':'Gereed'\}\}<\/small>/g,'');
};
