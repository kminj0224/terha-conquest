'use strict';
const assert=require('assert');
module.exports=async function({run}){
 const report=await run(`(async()=>{
  const original=JSON.stringify(snapshot()),old={delay,finishMovingBeforeFire,beginAim,launchShot,targetExplosions},damage=[];
  const check=(v,m)=>{if(!v)throw Error(m)};
  try{
   busy=false;menuMode=false;started=true;player=0;food.fill(1000000);money.fill(1000000);oil.fill(1000000);
   units=[];for(const q of cities){q.queue=null;q.produced=false}
   const q=cities.find(q=>atWar(0,q.f)&&regionTiles[q.id].some(i=>neighbors(i).some(j=>tiles[j].owner<0))&&neighbors(q.tile).some(i=>tiles[i].owner>=0&&!cityAt(i)&&!baseAt(i)));
   check(q,'Missing live capture fixture');q.nukeUntil=0;q.hp=0;
   const from=neighbors(q.tile).find(i=>tiles[i].owner>=0&&!cityAt(i)&&!baseAt(i));
   const armor=makeUnit(0,1,from,1);freshOrders(armor);
   check(!reachable(armor).costs.has(q.tile),'Armor must not enter unclaimed breached city');
   selectUnit(armor);const p=pxy(q.tile);cam.x=p.x;cam.y=p.y;tap(screenW/2,screenH/2);
   check($('toast').textContent==='소총수와 란나·백양·단테·낙월 특수유닛만 점령할 수 있습니다','Exact rifle-only entry message');
   const enemy=q.f;armor.tile=q.tile;capture(armor);check(q.f===enemy,'Armor direct capture rejected');armor.tile=from;
   const rifle=makeUnit(0,0,q.tile,1);capture(rifle);check(q.f===0,'Rifle capture through real wrappers');units=units.filter(u=>u!==rifle);
   check(reachable(armor).costs.has(q.tile),'Other troop can enter friendly occupied city');
   q.f=enemy;for(const i of regionTiles[q.id])tiles[i].owner=enemy;q.hp=500;
   units=[];const artillery=makeUnit(0,2,from,1);freshOrders(artillery);
   delay=async()=>{};finishMovingBeforeFire=async()=>{};beginAim=()=>{};launchShot=()=>{};targetExplosions=(u,p,d)=>damage.push(d);
   check(await attackCity(artillery,q,true),'Live artillery attack');check(q.hp===1&&damage.at(-1)===499,'Live 500-to-1 clamp and popup');
   freshOrders(artillery);check(await attackCity(artillery,q,true),'Live 1 HP artillery attack');check(q.hp===1&&damage.at(-1)===0,'Live 1-to-1 and zero popup');
   // Exercise the final wrapped unit-target attack, including a surviving and killed garrison.
   for(const type of [0,1,6,8,9,10,11,12,13,14,17,18,DEKPHUING_GUERRILLA,NAKWOL_COMMANDO,2,3,4,7,19,20,21,5,22,23,24,25])for(const hp of [1,500])for(const lethal of [false,true]){
    units=[];q.hp=hp;fx=[];
    const attacker=makeUnit(0,type,from,1),defender=makeUnit(enemy,0,q.tile,1);freshOrders(attacker);
    defender.hp=lethal?1:100000;
    const expected=Math.min(Math.max(0,hp-cityDamageFloor(attacker)),siegeDamage(attacker,q)),before=defender.hp;
    check(await attack(attacker,defender,true),'Wrapped garrison attack type '+type);
    check(q.hp===hp-expected&&q.hp>=cityDamageFloor(attacker),'Garrison city floor type '+type+' hp '+hp);
    check(defender.hp<before,'Garrison unit still takes damage type '+type);
    check(fx.some(e=>e.kind==='blast'&&e.damage===expected),'Actual garrison city damage popup type '+type);
   }
   const airHome={...cities.find(v=>v.f===0)};airHome.tile=from;airHome.airport=true;airHome.level=5;airHome.nukeUntil=0;
   for(const type of ['fighter','bomber','strategic'])for(const hp of [1,500])for(const lethal of [false,true]){
    units=[];q.hp=hp;fx=[];const defender=makeUnit(enemy,0,q.tile,1);defender.hp=lethal?1:100000;
    const before=defender.hp;check(await airStrike(airHome,type,q.tile,true),'Wrapped garrison air mission '+type);
    check(q.hp===Math.max(1,hp-cityAirStrikeDamage(type,q)),'Air mission garrison city floor '+type);
    check(defender.hp<before,'Air mission still hits garrison '+type);
   }
   // Every named national special gets the same real movement/capture/AI path as riflemen.
   for(const type of [6,17,DEKPHUING_GUERRILLA,NAKWOL_COMMANDO]){
    units=[];q.f=enemy;q.hp=0;for(const i of regionTiles[q.id])tiles[i].owner=enemy;
    const special=makeUnit(0,type,from,1);freshOrders(special);
    check(canCaptureCityUnit(special)&&reachable(special).costs.has(q.tile),'Special entry '+type);
    check(moveUnit(special,q.tile,true)&&q.f===0,'Special capture '+type);
    q.f=0;q.hp=0;units=[];const ai=makeUnit(enemy,type,from,1);freshOrders(ai);
    check(aiStep(ai,[q])?.move===q.tile,'AI special takes breached city '+type);
    check(moveUnit(ai,q.tile,true)&&q.f===enemy,'AI special capture '+type);
   }
   units=[];q.f=enemy;q.hp=1;
   const shooter=makeUnit(0,0,from,1);freshOrders(shooter);check(await attackCity(shooter,q,true)&&q.hp===0,'Rifle can finish fortification');
   units=[];q.f=0;q.level=5;q.hp=1000;for(const i of regionTiles[q.id])tiles[i].owner=0;
   const home=cities.find(v=>v.f===0&&v.origin===0);home.level=5;home.queue=null;home.produced=false;home.nukeUntil=0;cityProfile(home);
   check(requestSupply(q,home,1,1,false),'Other troop requested from homeland');
   const start=turn,total=supplyTurns(home,q);turn=start+1;deploy(home);
   if(total===2)check(home.queue?.remaining===1,'Long-distance homeland transport waits another turn');
   turn=start+total;deploy(home);check(!home.queue&&unitAt(q.tile)?.type===1,'Non-rifle transport can deploy onto own occupied city');
   return {floor:1,actualDamage:damage.slice(0,2),rifleCapture:true,entryMessage:true,friendlyArmor:true,transportTurns:total};
  }finally{
   ({delay,finishMovingBeforeFire,beginAim,launchShot,targetExplosions}=old);
   const state=JSON.parse(original);({units,cities,money,tech,food,oil,turn,player,difficulty,uid,cam}=state);tiles.forEach((t,i)=>t.owner=state.owners[i]);migrateArmy(state);busy=false;selected=null;panelOpen=false;save();
  }
 })()`);
 assert.equal(report.floor,1);assert([1,2].includes(report.transportTurns));console.log('PASS live world siege/capture and friendly deployment:',report);
};


