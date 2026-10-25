'use strict';
const assert=require('assert');
module.exports=async function({run}){
 run(`globalThis.supplyFixture=JSON.stringify(snapshot());busy=false;selected=null;supplyChoice=null;
 globalThis.supplyHomes=cities.filter(q=>q.origin===player&&q.f===player);
 globalThis.supplyHome=supplyHomes.find(h=>cities.some(q=>q.id!==h.id&&supplyTurns(h,q)===2));globalThis.supplyTarget=cities.find(q=>q.id!==supplyHome.id&&supplyTurns(supplyHome,q)===2);
 if(!supplyTarget)throw Error('Missing mainland delivery fixture');
 supplyHome.queue=null;supplyHome.produced=false;supplyHome.level=2;supplyHome.nukeUntil=0;
 supplyTarget.origin=(player+1)%7;supplyTarget.f=player;supplyTarget.level=3;supplyTarget.queue=null;supplyTarget.nukeUntil=0;tiles[supplyTarget.tile].owner=player;
 food[player]=1000000;money[player]=1000000;oil[player]=1000000;
 globalThis.supplyBefore=units.length;globalThis.supplyFood=food[player];globalThis.supplyStart=turn;
 `);
 try{
  assert.equal(run('TYPES[11].atk'),33);assert.equal(run('TYPES[18].atk'),96);assert.equal(run('TYPES[18].branch'),'armor');assert(run('TYPES[18].tank'));assert.equal(run('unitPrice(18,1)'),1000);assert.equal(run('unitOil(18,1)'),40);
  assert(run('homelandSources(supplyTarget).some(q=>q.id===supplyHome.id)'),'lower level homeland included');
  run('supplyHome.level=3');assert(run('homelandSources(supplyTarget).includes(supplyHome)'),'equal level included');
  run('supplyHome.level=4');assert(!run('homelandSources(supplyTarget).includes(supplyHome)'),'higher level excluded');
  assert(!run('requestSupply(supplyTarget,supplyHome,0,1,false)'),'reject bypassed level');run('supplyHome.level=2');
  assert(!run('produce(supplyTarget,0,1,false)'),'no local occupied production');
  if(run("typeof document!=='undefined'")){
   run("selectCity(supplyTarget,true);cityCommandOpen('units')");
   assert(run("!!$('supplyHome'+supplyHome.id)"),'homeland picker opens');
   run("$('supplyHome'+supplyHome.id).onclick()");
   assert(run("!!$('production')&&$('supplyHomeName').textContent.includes(supplyHome.name)"),'source catalogue opens inside destination');
   assert.equal(run('selected.id'),run('supplyTarget.id'));
  }
  assert(run('requestSupply(supplyTarget,supplyHome,0,2,true)'));
  assert.equal(run('supplyHome.queue.remaining'),2);assert.equal(run('supplyTarget.queue'),null);
  if(run("typeof document!=='undefined'")){
   assert(run("$('cityCommandContent').textContent.includes('에서 출항 후 도착 예정입니다')"),'incoming status shown');
   assert(run("$('cityCommandContent').textContent.includes(TYPES[0].name)"),'unit name shown');
   assert(run("$('cityCommandContent').innerHTML.includes('meter')"),'remaining turns bar shown');
  }
  assert.equal(run('food[player]'),run('supplyFood-unitPrice(0,2)'));
  assert(!run('requestSupply(supplyTarget,supplyHomes.find(q=>q.id!==supplyHome.id),0,1,false)'),'one incoming order');
  run('deploy(supplyHome);turn++;deploy(supplyHome);deploy(supplyHome)');
  assert.equal(run('supplyHome.queue.remaining'),1,'same turn cannot tick twice');
  assert.equal(run('units.length'),run('supplyBefore'));
  // JSON round trip exercises the real legacy normalization chain.
  run('globalThis.supplySaved=JSON.parse(JSON.stringify(snapshot()));({units,cities,money,tech,food,oil,turn,player,difficulty,uid,cam}=supplySaved);migrateArmy(supplySaved);supplyHome=cities.find(q=>q.id===supplyHome.id);supplyTarget=cities.find(q=>q.id===supplyTarget.id)');
  assert.equal(run('supplyHome.queue.remaining'),1,'saved order retained');
  run('supplyHome.fuelEfficiency=true;turn++;globalThis.supplySites=new Set([supplyTarget.tile,...neighbors(supplyTarget.tile),...neighbors(supplyTarget.tile).flatMap(neighbors)]);globalThis.beforeBlock=units.slice();for(const tile of supplySites)if(!unitAt(tile))makeUnit(player,0,tile,1);deploy(supplyHome)');
  assert.equal(run('supplyHome.queue.remaining'),0,'blocked destination waits');
  run('units=beforeBlock.filter(u=>!supplySites.has(u.tile));globalThis.beforeDelivery=new Set(units.map(u=>u.id));deploy(supplyHome);globalThis.delivered=units.find(u=>!beforeDelivery.has(u.id))');
  assert.equal(run('supplyHome.queue'),null);assert.equal(run('delivered.type'),0);assert.equal(run('delivered.level'),2);
  assert(run('delivered.aa&&delivered.fuelEfficient&&delivered.producedAtCityId===supplyHome.id'));
  assert(run('supplySites.has(delivered.tile)'),'delivered near destination');
  run('supplyHome.produced=false;globalThis.islandTarget=cities.find(q=>q.id!==supplyHome.id&&supplyTurns(supplyHome,q)===3);if(!islandTarget)throw Error("Missing sea delivery fixture");islandTarget.f=player;islandTarget.origin=(player+1)%7;islandTarget.level=5;islandTarget.queue=null;islandTarget.nukeUntil=0;for(const i of regionTiles[islandTarget.id])tiles[i].owner=player');
  assert(run('requestSupply(islandTarget,supplyHome,0,1,false)'));assert.equal(run('supplyHome.queue.remaining'),3);
  run('turn++;deploy(supplyHome);turn++;deploy(supplyHome)');assert.equal(run('supplyHome.queue.remaining'),1);
  run('globalThis.seaSites=new Set([islandTarget.tile,...neighbors(islandTarget.tile),...neighbors(islandTarget.tile).flatMap(neighbors)]);units=units.filter(u=>!seaSites.has(u.tile));turn++;deploy(supplyHome)');assert.equal(run('supplyHome.queue'),null,'sea delivery after exactly 3 turns');
  run('supplyHome.produced=false');assert(run('requestSupply(islandTarget,supplyHome,0,1,false)'));
  run('islandTarget.f=(player+1)%7;deploy(supplyHome)');assert.equal(run('supplyHome.queue'),null,'lost destination cancels');
  run('islandTarget.f=player;supplyHome.produced=false');assert(run('requestSupply(islandTarget,supplyHome,0,1,false)'));
  run('supplyHome.f=(player+1)%7;deploy(supplyHome)');assert.equal(run('supplyHome.queue'),null,'lost training city cancels');
  run('globalThis.supplyRepairUnit=units.find(u=>u.f===player&&!u.carriedBy);supplyRepairUnit.hp=1;supplyRepairUnit.repairUsed=true;globalThis.repairGold=money[player];globalThis.repairFood=food[player];globalThis.repairOil=oil[player];globalThis.repairCost=resupplyCost(supplyRepairUnit)');
  assert(run('repair(supplyRepairUnit)'));assert.equal(run('supplyRepairUnit.hp'),run('unitMaxHp(supplyRepairUnit)'));run('supplyRepairUnit.hp=1');assert(run('repair(supplyRepairUnit)'));
  assert.equal(run('money[player]'),run('repairGold-2*repairCost.gold'),'each repeat supply charged');
  assert.equal(run('food[player]'),run('repairFood-2*repairCost.food'));assert.equal(run('oil[player]'),run('repairOil-2*repairCost.oil'));
  run('food[player]=repairCost.food-1');assert(!run('repair(supplyRepairUnit)'),'no free supply');
 }finally{
  run('globalThis.supplyRestore=JSON.parse(supplyFixture);({units,cities,money,tech,food,oil,turn,player,difficulty,uid,cam}=supplyRestore);tiles.forEach((t,i)=>t.owner=supplyRestore.owners[i]);migrateArmy(supplyRestore);selected=null;panelOpen=false;supplyChoice=null;save()');
 }
 console.log('PASS: occupied-city homeland level filtering, source costs/queue, 2/3-turn delivery, repeated tick guard, save migration, blocked delivery, source research, capture cancellation and repeat resupply');
};
