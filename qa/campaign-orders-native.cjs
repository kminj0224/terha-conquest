'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run,nodes,drain}){
 run('busy=false;aiTurnActive=false;if(activeScenario)CampaignBattle.leave();setup();started=true;setAppScreen("game");window.ordersWorld=JSON.stringify(snapshot())');
 run(`CampaignBattle.start(null,1);window.ordersPrevious=JSON.parse(JSON.stringify(snapshot()));ordersPrevious.missionProgress.result='won';ordersPrevious.units.find(u=>u.missionRole).hp=300;ordersPrevious.units.find(u=>u.missionRole).xp=123;for(let n=0;n<20;n++)ordersPrevious.units.push({...ordersPrevious.units[1],id:500+n,type:18,producedAtCityId:0});CampaignBattle.leave()`);
 for(const id of ['iron-crown-m01','iron-crown-m02','iron-crown-m03']){
  if(id==='iron-crown-m03')run("ordersPrevious.scenario='iron-crown-m02'");
  run(`CampaignBattle.start(null,1,{id:'${id}',route:'recapture',carry:ordersPrevious});money[2]=100000;food[2]=100000;oil[2]=100000`);
  assert.equal(run('cities[0].level'),3);
  assert.equal(run('units.filter(u=>u.f===2).length'),run('CampaignOrders.data().friendly.length+1'));
  assert(!run('units.some(u=>u.f===2&&u.type===18)'));
  if(id!=='iron-crown-m01'){assert.equal(run('units.find(u=>u.missionRole).hp'),300);assert.equal(run('units.find(u=>u.missionRole).xp'),123)}
  assert(!run('canProduce(cities[0],18,1)'),'No capital exception for mechanic knight');
  assert(!run('canProduce(cities[0],14,1)'),'No elite tank');
  assert(run('produce(cities[0],0,1,false)'),'Basic production remains available');
  run('deploy(cities[0]);selectCity(cities[0],true)');
  assert(nodes.get('cityExpandGold').disabled);
  const gold=run('money[2]');assert.equal(run('upgradeCity(cities[0])'),false);assert.equal(run('money[2]'),gold);assert.equal(run('cities[0].level'),3);
  run('money[1]=100000;aiUpgradeCities(1,cities.filter(q=>q.f===1))');
  assert(run('cities.every(q=>q.level===CampaignOrders.data().cities[q.id][5])'));
  // Old saves remain readable but cannot restore the level-five loophole.
  run('window.ordersSave=JSON.parse(JSON.stringify(snapshot()));ordersSave.cities[0].level=5;ordersSave.cities[0].hp=999999;CampaignBattle.restore(ordersSave)');
  assert.equal(run('cities[0].level'),3);assert(run('cities[0].hp<=cityMaxHp(cities[0])'));
  run('units=units.filter(u=>u.f===1);cities.forEach(q=>{q.f=1});cities[0].f=2;buildRegions()');
  assert(run('units.filter(u=>u.f===1).every(u=>CampaignOrders.goal(u).id!==0)'));
  assert.notEqual(run('chooseObjective(1)?.id'),0,'Ignore lone hostile departure city');
  // A capture-capable unit near the undefended departure base must move back
  // toward the operation, rather than shelling/capturing that city.
  run('units=[];window.ordersRifle=makeUnit(1,0,CampaignBattle.tile(3,8),1);freshOrders(ordersRifle)');
  const act=run('aiStep(ordersRifle,cities)');assert(!act?.city||act.city.id!==0);
  assert(act?.move!==undefined,'Defender returns to mission points');
  run('moveUnit(ordersRifle,aiStep(ordersRifle,cities).move,true)');
  assert(run('distance(ordersRifle.tile,CampaignOrders.goal(ordersRifle).tile)<distance(CampaignBattle.tile(3,8),CampaignOrders.goal(ordersRifle).tile)'));
  run('cities[1].f=2;cities[1].hp=0;units=[];ordersRifle=makeUnit(1,0,neighbors(cities[1].tile).find(i=>CampaignBattle.contains(i)),1);freshOrders(ordersRifle);buildRegions()');
  assert.equal(run('CampaignOrders.goal(ordersRifle).id'),1);
  assert.equal(run('aiStep(ordersRifle,cities).move'),run('cities[1].tile'),'Recapture breached mission point');
  run('moveUnit(ordersRifle,aiStep(ordersRifle,cities).move,true)');assert.equal(run('cities[1].f'),1);
  run('CampaignBattle.leave()');
 }
 // Shared conquest city expansion still works after leaving a campaign.
 run('busy=false;money[player]=100000;window.ordersCity=cities.find(q=>q.f===player);ordersCity.level=3;selectCity(ordersCity,true)');
 assert(!nodes.get('cityExpandGold').disabled);assert(run('upgradeCity(ordersCity)'));nodes.get('expandNo').onclick();
 console.log('PASS campaign restrictions: mission-local armies, hero continuity, all staging bases level3, no city upgrades or capital-only production, old save clamp, defense/recapture orders and unchanged conquest expansion');
};
