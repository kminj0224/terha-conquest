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
   check($('toast').textContent==='소총수만 점령할 수 있습니다','Exact rifle-only entry message');
   const enemy=q.f;armor.tile=q.tile;capture(armor);check(q.f===enemy,'Armor direct capture rejected');armor.tile=from;
   const rifle=makeUnit(0,0,q.tile,1);capture(rifle);check(q.f===0,'Rifle capture through real wrappers');units=units.filter(u=>u!==rifle);
   check(reachable(armor).costs.has(q.tile),'Other troop can enter friendly occupied city');
   q.f=enemy;for(const i of regionTiles[q.id])tiles[i].owner=enemy;q.hp=500;
   units=[];const artillery=makeUnit(0,2,from,1);freshOrders(artillery);
   delay=async()=>{};finishMovingBeforeFire=async()=>{};beginAim=()=>{};launchShot=()=>{};targetExplosions=(u,p,d)=>damage.push(d);
   check(await attackCity(artillery,q,true),'Live artillery attack');check(q.hp===1&&damage.at(-1)===499,'Live 500-to-1 clamp and popup');
   freshOrders(artillery);check(await attackCity(artillery,q,true),'Live 1 HP artillery attack');check(q.hp===1&&damage.at(-1)===0,'Live 1-to-1 and zero popup');
   const shooter=makeUnit(0,0,from,1);freshOrders(shooter);check(await attackCity(shooter,q,true)&&q.hp===0,'Rifle can finish fortification');
   units=[];q.f=0;q.level=5;q.hp=1000;for(const i of regionTiles[q.id])tiles[i].owner=0;
   const home=cities.find(v=>v.f===0&&v.origin===0);home.level=5;home.queue=null;home.produced=false;home.nukeUntil=0;cityProfile(home);
   check(requestSupply(q,home,1,1,false),'Other troop requested from homeland');
   const start=turn;turn=start+1;deploy(home);check(home.queue?.remaining===1,'Homeland transport waits one turn');
   turn=start+2;deploy(home);check(!home.queue&&unitAt(q.tile)?.type===1,'Non-rifle transport can deploy onto own occupied city');
   return {floor:1,actualDamage:damage.slice(0,2),rifleCapture:true,entryMessage:true,friendlyArmor:true,transportTurns:2};
  }finally{
   ({delay,finishMovingBeforeFire,beginAim,launchShot,targetExplosions}=old);
   const state=JSON.parse(original);({units,cities,money,tech,food,oil,turn,player,difficulty,uid,cam}=state);tiles.forEach((t,i)=>t.owner=state.owners[i]);migrateArmy(state);busy=false;selected=null;panelOpen=false;save();
  }
 })()`);
 assert.equal(report.floor,1);assert.equal(report.transportTurns,2);console.log('PASS live world siege/capture and friendly deployment:',report);
};
