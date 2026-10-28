'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run}){
 run('busy=false;aiTurnActive=false;if(activeScenario)CampaignBattle.leave();setup();started=true;setAppScreen("game")');
 const world=run('JSON.stringify({units,cities,money,food,oil,owners:tiles.map(t=>t.owner),map:MAP.tiles})');
 for(const id of ['iron-crown-m01','iron-crown-m02','iron-crown-m03']){
  run('CampaignBattle.start(null,1,{id:'+JSON.stringify(id)+'})');
  assert(!run('units.some(isNaval)'),'No starting navy');
  run('money[2]=food[2]=oil[2]=100000');
  for(const type of [22,5,23,24,25,26]){
   assert(!run('canProduce(cities[0],'+type+',1)'));
   assert(!run('produce(cities[0],'+type+',1,false)'),'No naval production '+type);
  }
  // Force even the old transport-grant prerequisites. Campaign entry must
  // prevent the generator from running, rather than depend on map geometry.
  run('window.navySea=aiSeaComponents;aiSeaComponents=()=>{throw Error("Campaign invoked ocean transport generation")};try{for(let n=0;n<5;n++){turn++;aiTransportGrantTurn[1]=-1;prepareAITransports(1,cities.filter(q=>q.f===1))}}finally{aiSeaComponents=navySea}');
  assert(!run('units.some(isNaval)'),'No automatically granted AI transports');
  run('fx.push({kind:"whale",x:cam.x,y:cam.y,start:40000,duration:8000});window.navyScene=[];addAmbientScene(navyScene,41000)');
  assert(!run('fx.some(e=>e.kind==="whale")'));assert(!run('navyScene.some(e=>e.kind==="whale")'));
  run('lastWhaleAt=0;drawNavalOverlays(100000)');
  assert(!run('fx.some(e=>e.kind==="whale")'),'No timed whale generation on non-land cliff tiles');
  assert.equal(run('lastWhaleAt'),0,'Conquest whale clock remains untouched');
  // Recover any old automatically granted transport and its cargo safely.
  run('window.legacyNavy=JSON.parse(JSON.stringify(snapshot()));window.shipId=legacyNavy.uid++;window.shipTile=tiles.findIndex((t,i)=>CampaignBattle.contains(i)&&CampaignTerrain.blocked(i,CampaignOrders.data()));window.ship={...legacyNavy.units[0],id:shipId,type:26,tile:shipTile,f:2,cargo:[legacyNavy.units[1].id]};delete ship.missionRole;delete ship.missionName;legacyNavy.units.push(ship);legacyNavy.units[1].carriedBy=shipId;legacyNavy.units[1].tile=shipTile;legacyNavy.cities[0].queue={type:26,level:1};window.cargoId=legacyNavy.units[1].id');
  assert(run('CampaignBattle.valid(legacyNavy)'));
  assert(run('CampaignBattle.restore(legacyNavy)'));
  assert(!run('units.some(isNaval)'));assert.equal(run('cities[0].queue'),null);
  assert(run('units.some(u=>u.id===cargoId&&!u.carriedBy&&!CampaignTerrain.blocked(u.tile,CampaignOrders.data()))'),'Old cargo survives on safe ground');
  run('CampaignBattle.leave()');
 }
 assert.equal(run('JSON.stringify({units,cities,money,food,oil,owners:tiles.map(t=>t.owner),map:MAP.tiles})'),world);
 run('window.navyPort=cities.find(q=>q.f===player&&q.origin===player&&q.harbor);navyPort.level=Math.max(3,navyPort.level);cityProfile(navyPort)');
 assert(run('canProduce(navyPort,26,1)'),'Conquest transport production still works');
 console.log('PASS land campaign: no ship production, no automatic AI transports, no timed/existing whale effects, legacy navy/queues removed with cargo preserved, exact conquest restore and normal naval production retained');
};
