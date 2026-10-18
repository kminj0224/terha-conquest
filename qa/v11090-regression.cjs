const assert=require('assert');
module.exports=async function({run}){
 const r=run(`(function(){
  const check=(v,m)=>{if(!v)throw Error(m)};
  setup();started=true;setAppScreen('game');player=0;busy=false;menuMode=false;
  const base=missileBases.find(b=>b.f===0&&b.kind==='sea');
  const unit=units.find(u=>u.f===0&&!u.carriedBy&&u.hp>0);
  const city=cities.find(q=>q.f===0);
  check(base&&unit&&city,'Missing unit or base to test inspection');
  // Selecting a coastal battery legitimately redirects i to its base stats.
  selectedDefenseId=base.id;selected=null;panelOpen=false;navalMode=null;
  refreshSelection();
  check($('selectionInfo').style.display==='inline-block','Coastal defense i button missing');
  $('selectionInfo').onclick();
  check($('modal').textContent.includes('지대함 포대'),'Battery i action must open its own information');
  $('baseClose').onclick();
  // Re-select a field unit and make sure the previously captured base
  // is forgotten and its handler is no longer attached.
  selectUnit(unit);
  check(selectedDefenseId===null,'Stale coastal-defense ID persisted after unit selection');
  $('selectionInfo').onclick();
  check(panelOpen,'Unit information should open its unit panel');
  refreshWindowChrome();
  check($('panel').textContent.includes(TYPES[unit.type].name),'Field unit i must display selected unit name');
  check(!$('panel').textContent.includes('지대함 포대'),'Field unit i incorrectly shows anti-ship battery');
  check(!$('modal').style.display||$('modal').style.display==='none','Field unit i must not open the defense modal');
  // The same repair must hold for cities and switching back to another unit.
  selectCity(city,false);$('selectionInfo').onclick();
  check(panelOpen&&$('panel').textContent.includes(city.name),'City i must show selected city');
  selectUnit(unit);$('selectionInfo').onclick();
  check(panelOpen&&$('panel').textContent.includes(TYPES[unit.type].name),'Revisiting unit must keep unit i action');
  return{battery:base.id,unit:TYPES[unit.type].name,city:city.name,restored:true};
 })()`);
 assert(r.restored);
 console.log('PASS v1.10.90 coastal battery info never persists after selecting field unit or city:',r);
};
