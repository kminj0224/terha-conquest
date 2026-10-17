const assert=require('assert');
module.exports=async function({run}){
 const result=await run(`(async()=>{
 const check=(v,message)=>{if(!v)throw Error(message)};
 // Ordinary cities use new maximum HP without modifying the capital formula.
 const hp=[0,6000,10000,15000,20000,30000];
 for(let n=1;n<=5;n++)check(cityMaxHp({level:n,capital:false})===hp[n],'City health level '+n);
 for(let n=1;n<=5;n++)check(cityMaxHp({level:n,capital:true})===120000+(n-3)*30000,'Capital must be unchanged');
 check(cityAirStrikeDamage('fighter',{aa:false,f:1,tile:0})===2000,'Fighter city damage');
 check(cityAirStrikeDamage('bomber',{aa:false,f:1,tile:0})===5000,'Bomber city damage');
 check(cityAirStrikeDamage('strategic',{aa:false,f:1,tile:0})===15000,'Strategic bomber city damage');
 check(siegeDamage({type:2,f:0,tile:0,level:1,hp:unitMaxHp({type:2,f:0,level:1})},{level:2,capital:false,aa:false,f:1,tile:1})===
  Math.round(unitAttack({type:2,f:0,tile:0,level:1,hp:unitMaxHp({type:2,f:0,level:1})})*32),'Artillery city multiplier must be x32');
 // Board only from ships physically touching the coast and within 2 hexes.
 const oldUnits=units,oldOil=oil[0];
 let boardingChecked=false;
 try{
  units=[];oil[0]=10000;
  for(let shore=0;shore<tiles.length&&!boardingChecked;shore++){
   if(tiles[shore].owner!==0)continue;
   const near=neighbors(shore).find(i=>tiles[i].owner<0);
   if(near===undefined)continue;
   const offshore=tiles.findIndex((t,i)=>t.owner<0&&distance(i,shore)<=2&&!neighbors(i).some(j=>tiles[j].owner>=0));
   if(offshore<0)continue;
   const soldier=makeUnit(0,0,shore,1),ship=makeUnit(0,26,near,1);
   check(boardableShips(soldier).includes(ship),'Adjacent shore boarding should work');
   ship.tile=offshore;
   check(distance(ship.tile,soldier.tile)<=2,'Test has to be within 2 hexes');
   check(!boardableShips(soldier).includes(ship),'Offshore ship must reject boarding');
   ship.tile=near;
   soldier.tile=tiles.findIndex((t,i)=>t.owner===0&&distance(i,ship.tile)>2);
   check(!boardableShips(soldier).includes(ship),'Ship beyond 2 hexes must reject boarding');
   boardingChecked=true;
  }
  check(boardingChecked,'Need a suitable coast to test boarding');
 }finally{units=oldUnits;oil[0]=oldOil}
 check(AIR_MISSIONS.transport.range===60,'Keep long range aircraft transport');
 setup();started=true;setAppScreen('game');player=0;
 money[0]=100000;oil[0]=10000;
 const b=missileBases.find(v=>v.f===0&&v.kind==='sea'&&v.remaining<=0&&!unitAt(v.tile));
 check(b,'Own anti-ship battery missing');
 const p=pxy(b.tile);cam.x=p.x;cam.y=p.y;cam.z=1;
 navalMode=null;coastBuildMode=false;airTarget=null;strategicTarget=null;menuMode=false;busy=false;
 tap(screenW/2,screenH/2);
 check(!menuMode,'Clicking own missile battery must not open a modal');
 check(selectedDefenseId===b.id,'Must focus selected missile battery');
 check($('selectionInfo').style.display==='inline-block','Battery info button must be visible');
 $('selectionInfo').onclick();
 check(menuMode&&$('baseClose'),'Info button must open a closable information window');
 check($('modal').textContent.includes('공격력')&&$('modal').textContent.includes('내구도'),'Battery details need attack and HP');
 $('baseClose').onclick();
 check(!menuMode,'Close X must close defense information');
 navalMode=null;selectedDefenseId=null;
 const q=cities.find(q=>q.f===0&&!q.capital);
 selectCity(q,true);
 const originalTech=tech[0],cost=militaryResearchCost(0),startMoney=money[0];
 check(research()===true,'Military research should start');
 check(militaryResearchJobs[0]?.remaining===2,'Research must begin at 2 turns');
 check(tech[0]===originalTech&&money[0]===startMoney-cost,'Start must charge resources, but not upgrade immediately');
 check(snapshot().militaryResearchJobs[0]?.remaining===2,'Pending research must persist in saves');
 turn++;await industryTurn();
 check(militaryResearchJobs[0]?.remaining===1&&tech[0]===originalTech,'One turn must not complete research');
 turn++;await industryTurn();
 check(militaryResearchJobs[0]===null&&tech[0]===originalTech+1,'Military research must finish after 2 turns');
 return {cityHp:hp.slice(1),air:[2000,5000,15000],boarding:boardingChecked,researchTurns:2};
 })()`);
 assert.equal(result.researchTurns,2);
 console.log('PASS v1.10.78 cities, artillery, air damage, coastal boarding, missile battery UI and two-turn research:',result);
};
