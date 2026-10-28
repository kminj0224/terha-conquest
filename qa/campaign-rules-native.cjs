'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run,nodes,click,drain,stored}){
 run('busy=false;aiTurnActive=false;if(activeScenario)CampaignBattle.leave();setup();started=true;setAppScreen("game")');
 for(const [turn,stars]of [[1,3],[16,3],[17,2],[26,2],[27,1],[40,1],[41,0]])assert.equal(run(`CampaignRules.stars(${turn})`),stars);
 assert.equal(run('CampaignRules.stars(1,false)'),0);
 const world=run('JSON.stringify({units,cities,map:MAP.tiles,owners:tiles.map(t=>t.owner)})');
 for(const id of ['iron-crown-m01','iron-crown-m02','iron-crown-m03']){
  run(`CampaignBattle.start(null,1,{id:'${id}'})`);
  assert(run('cities.every(q=>!CampaignTerrain.blocked(q.tile,CampaignOrders.data()))'));
  assert(run('units.every(u=>!CampaignTerrain.blocked(u.tile,CampaignOrders.data()))'));
  assert(run('cities.every(q=>!q.harbor)'));
  assert(!run('canProduce(cities[0],26,1)'));
  assert(run(`(()=>{const d=CampaignOrders.data(),seen=new Set([cities[0].tile]),open=[cities[0].tile];for(let n=0;n<open.length;n++)for(const i of neighbors(open[n]))if(!seen.has(i)&&!CampaignTerrain.blocked(i,d)){seen.add(i);open.push(i)}return cities.every(q=>seen.has(q.tile))})()`),'Illustrated land connects every objective');
  run('window.cliff=tiles.findIndex((t,i)=>CampaignBattle.contains(i)&&CampaignTerrain.blocked(i,CampaignOrders.data()))');assert(run('cliff>=0'));
  assert.equal(run('MAP.tiles[cliff][0]'),-1);assert.equal(run('tiles[cliff].owner'),-1);
  assert(run('moveCost(units.find(u=>u.f===2),cliff)>=99999'));
  assert(run('moveCost({type:26,f:2},cliff)>=99999'),'Cliff cannot be sailed');
  assert(!run('reachable(units.find(u=>u.f===2)).costs.has(cliff)'));
  run('window.legacyCliff=JSON.parse(JSON.stringify(snapshot()));legacyCliff.units.find(u=>u.f===2).tile=cliff;legacyCliff.owners[cliff]=2;CampaignBattle.restore(legacyCliff)');
  assert(run('units.every(u=>!CampaignTerrain.blocked(u.tile,CampaignOrders.data()))'));
  assert.equal(run('tiles[cliff].owner'),-1);
  run('window.lastAllowed=CampaignRules.rules(CampaignOrders.data())[0];turn=lastAllowed;CampaignBattle.check()');assert.equal(run('CampaignBattle.inspect().progress.result'),null,'All forty player turns are usable');
  run('turn=lastAllowed+1;CampaignBattle.check()');assert.equal(run('CampaignBattle.inspect().progress.result'),'lost');assert.equal(run('CampaignBattle.inspect().progress.failure'),'timeout');
  run('CampaignBattle.leave()');
 }
 assert.equal(run('JSON.stringify({units,cities,map:MAP.tiles,owners:tiles.map(t=>t.owner)})'),world);
 // A win on the last allowed turn counts, and best medals never regress.
 run('CampaignBattle.start(null,1);turn=40;units.find(u=>u.missionRole).tile=CampaignBattle.inspect().progress.exit;CampaignBattle.check()');
 assert.equal(run('CampaignBattle.inspect().progress.result'),'won');
 run('CampaignRules.award(1,16,1,IRON_CROWN_CAMPAIGN.battle);CampaignRules.award(1,39,1,IRON_CROWN_CAMPAIGN.battle)');
 assert.equal(run('CampaignRules.records()[1].stars'),3);assert.equal(run('CampaignRules.records()[1].turns'),16);
 run('CampaignBattle.leave();TerhaCampaign.open()');await click('cpCampaignIron');await click('cpMission1');await click('cpLaunch');await click('cpSkip');
 assert.equal(run('TerhaCampaign.getView()'),'deployment');assert.equal(run('activeScenario'),null);
 assert(nodes.has('cpOperationStart'));assert.equal(run('TerhaCampaign.getState().phase'),'deployment');
 run('TerhaCampaign.open()');await click('cpCampaignIron');await click('cpContinue');assert.equal(run('TerhaCampaign.getView()'),'deployment');
 await drain(Promise.resolve(nodes.get('cpOperationStart').onclick()));assert.equal(run('activeScenario.id'),'iron-crown-m01');
 run('turn=26;CampaignBattle.complete(true)');assert(nodes.has('cpResultConfirm'));assert.equal(run('TerhaCampaign.getState().phase'),'won');assert.equal(run('CampaignRules.records()[1].stars'),3);
 await click('cpResultConfirm');assert.equal(nodes.get('cpResultActions').hidden,false);
 run('CampaignBattle.leave();showHub()');
 console.log('PASS campaign terrain/rating: connected native non-land masks, no cliff movement/sailing, safe legacy relocation, inclusive medal thresholds and per-mission deadline loss, last-turn win, deployment confirmation/reload, result confirmation and persistent best medals');
};
