const assert=require('assert');
module.exports=async function({run}){
 const report=await run(`(async()=>{
 const check=(v,m)=>{if(!v)throw Error(m)};
 check(NAKWOL_COMMANDO===28&&TYPES.length===29,'New Nakwol special ID must append to original 28 types');
 const t=TYPES[NAKWOL_COMMANDO];
 check(t.name==='낙월 특공대'&&t.hp===170&&t.atk===52&&t.range===2&&t.special===5,'Incorrect commando level-one stats');
 for(const [name,img,w,h] of [
  ['idle',nakwolCommandoArt.idle,480,360],
  ['fire',nakwolCommandoArt.fire,480,360],
  ['mecha',MECHA_KNIGHT_ART.idle,480,288]
 ]){
  check(img.complete&&img.naturalWidth===w&&img.naturalHeight===h,'Sprite failed loading: '+name);
 }
 check(infantryArtProfile({type:NAKWOL_COMMANDO,f:5})===NAKWOL_INFANTRY_PROFILES[NAKWOL_COMMANDO],'Nakwol commandos missing sprite profile');
 const savedTech=tech[5];tech[5]=0;
 const u={type:NAKWOL_COMMANDO,f:5,level:1,tile:1,hp:170};
 check(unitMaxHp(u)===170&&unitAttack(u)===52,'Commando must have HP 170 and attack 52 at tier one');
 const target={type:1,f:0,level:1,tile:1,hp:500};
 check(damage(u,target)===52,'Commando must ignore armor and all city defenses');
 const capital=cities.find(q=>q.origin===5&&q.capital);
 check(capital&&canProduce(capital,NAKWOL_COMMANDO,1),'Nakwol capital cannot recruit commandos');
 check(!canProduce(cities.find(q=>q.origin===0&&q.capital),NAKWOL_COMMANDO,1),'Other nation can recruit Nakwol commandos');
 const formerState={cities:JSON.parse(JSON.stringify(cities)),units,money:money.slice(),oil:oil.slice(),turn,player,selected,panelOpen};
 try{
  setup();started=true;setAppScreen('game');player=5;
  const q=cities.find(q=>q.f===5&&q.capital);
  q.level=5;q.lab=true;q.nukeUntil=0;
  units=[];money[5]=100000;oil[5]=10000;food[5]=100000;selected={kind:'city',id:q.id};panelOpen=true;
  cityProfile(q);showPanel();
  check($('strategicResearch').textContent.includes('연비 개선')||$('strategicResearch').innerHTML.includes('연비 개선'),'Fuel research missing from science panel');
  const oldUnit=makeUnit(5,1,q.tile,1),beforeCost=attackOil(oldUnit);
  const balance=money[5],startTurn=turn;
  check(studyFuelEfficiency(q),'Research could not start');
  check(money[5]===balance-20000&&q.fuelResearchJob?.remaining===2&&!q.fuelEfficiency,'Fuel research must cost 20k and take two turns');
  turn++;await industryTurn();
  check(q.fuelResearchJob?.remaining===1&&!q.fuelEfficiency,'Fuel research finished too early');
  turn++;await industryTurn();
  check(q.fuelEfficiency&&!q.fuelResearchJob,'Fuel research must finish on turn 2');
  check(attackOil(oldUnit)===beforeCost,'Existing unit must not gain new fuel bonus retroactively');
  units=[];q.queue={type:1,level:1,aa:false};
  deploy(q);
  const newUnit=units.find(v=>v.type===1&&v.f===5);
  check(newUnit&&newUnit.fuelEfficient&&newUnit.producedAtCityId===q.id,'Unit must inherit efficiency from source city');
  check(moveOil(newUnit)===0&&attackOil(newUnit)===0,'Ground units must move and fire for zero oil');
  for(const type of [0,8,9,10,11,12,13,1,14,15,16,2,3,18,NAKWOL_COMMANDO]){
   const test={type,level:1,f:5,tile:q.tile,hp:100,fuelEfficient:true};
   check(moveOil(test)===0&&attackOil(test)===0,'Ground unit free oil: '+type);
  }
  for(const type of [22,5,23,24,25,26]){
   const test={type,level:1,f:5,tile:q.tile,hp:100,fuelEfficient:true};
   check(moveOil(test)===Math.floor(baselineMoveOil(test)/2),'Navy move oil half: '+type);
   check(attackOil(test)===Math.floor(baselineAttackOil(test)/2),'Navy attack oil half: '+type);
  }
  check(efficiencyCost(newUnit,1)===0&&efficiencyCost({...newUnit,type:25},1)===0,'One oil must round to zero');
  const saved=snapshot();
  check(saved.cities[q.id].fuelEfficiency&&saved.units.some(v=>v.fuelEfficient),'Research and production flags must survive save');
  // Reload through the real migration pipeline, including the new source-city tags.
  migrateArmy(saved);
  check(cities[q.id].fuelEfficiency&&units.some(v=>v.fuelEfficient),'Fuel flags lost in load migration');
  return{commandoId:NAKWOL_COMMANDO,artSize:[480,360],mechaSize:[480,288],fuelCost:FUEL_RESEARCH_COST,researchTurns:2};
 }finally{
  tech[5]=savedTech;
  money=formerState.money;oil=formerState.oil;units=formerState.units;turn=formerState.turn;player=formerState.player;selected=formerState.selected;panelOpen=formerState.panelOpen;
  cities=formerState.cities;buildRegions();
 }
 })()`);
 assert.equal(report.commandoId,28);
 console.log('PASS v1.10.82 Nakwol commando/Mecha sprite, capital recruitment, city-only 20k two-turn fuel research and saved fuel bonuses:',report);
};
