'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run,nodes,drain}){
 run('busy=false;aiTurnActive=false;if(activeScenario)CampaignBattle.leave();setup();started=true;setAppScreen("game");CampaignBattle.start(null,1,{id:"iron-crown-m03"})');
 assert.equal(run('CampaignBattle.defenseStatus().held'),false);
 assert(!nodes.has('campaignDefenseStatus'));assert(nodes.has('campaignObjectives'));
 assert(run('IRON_CROWN_CAMPAIGN.battle3.waves.every(w=>w.troops.filter(k=>k===0).length>=2)'));
 assert(run('units.filter(u=>u.f===1).every(u=>[1,2].includes(CampaignOrders.goal(u).id))'));
 run('cities[1].f=2;cities[2].f=2;buildRegions();save()');
 assert.equal(run('CampaignBattle.inspect().progress.holdTurns'),0);
 assert(run('CampaignBattle.defenseStatus().title').includes('연속 방어 0 / 5턴'));
 run('turn++;save();save()');assert.equal(run('CampaignBattle.inspect().progress.holdTurns'),1);
 run('cities[2].f=1;save()');assert.equal(run('CampaignBattle.inspect().progress.holdTurns'),0);
 assert(run('CampaignBattle.defenseStatus().title').includes('방어 중단'));
 assert(run('logs.some(s=>s.includes("0/5턴으로 초기화"))'));
 run('cities[2].f=2;save();turn+=4;save()');
 assert.equal(run('CampaignBattle.inspect().progress.holdTurns'),4);
 assert.equal(run('CampaignBattle.inspect().progress.result'),null);
 run('CampaignPresentation.showGoals()');
 const text=nodes.get('campaignGoalSheet').textContent;
 for(const s of ['점령한 턴은 0턴','한 곳이라도 잃으면','연속 방어'])assert(text.includes(s),s);
 assert(!text.includes('반격 격퇴'));
 // Alive and not-yet-spawned enemies cannot delay a five-turn defense victory.
 run('setAppScreen("game");window.unfinished=JSON.parse(JSON.stringify(snapshot()));unfinished.missionProgress.waves=[];unfinished.missionProgress.pending=[{type:0,edge:"east",wave:11,serial:999}];CampaignBattle.restore(unfinished);turn++;save();CampaignBattle.check()');
 assert(run('units.some(u=>u.f===1&&u.hp>0)'));
 assert.equal(run('CampaignBattle.inspect().progress.result'),'won');
 assert(run('CampaignBattle.defenseStatus().title').includes('5턴 방어 완료'));
 // A real rifle enters a breached target instead of wandering to other cities.
 run('CampaignBattle.leave();CampaignBattle.start(null,1,{id:"iron-crown-m03"});cities[1].f=2;cities[1].hp=0;cities[2].f=1;units=units.filter(u=>u.missionRole);window.raider=makeUnit(1,0,neighbors(cities[1].tile).find(i=>!CampaignTerrain.blocked(i,CampaignOrders.data())),1);freshOrders(raider)');
 assert.equal(run('CampaignOrders.goal(raider).id'),1);
 assert.equal(run('aiStep(raider,cities).move'),run('cities[1].tile'));
 run('moveUnit(raider,cities[1].tile,true)');assert.equal(run('cities[1].f'),1);
 // Harmless empty areas cannot become movement objectives or lure artillery away.
 run('cities[1].f=2;cities[1].hp=500;cities[2].f=2;buildRegions();units=units.filter(u=>u.missionRole);window.siege=makeUnit(1,2,CampaignBattle.tile(22,8),1);freshOrders(siege);window.siegeGoal=CampaignOrders.goal(siege);window.before=rifleRoute(1,siegeGoal)[siege.tile]');
 const action=run('aiStep(siege,cities)');assert(action&&action.move!==undefined);
 assert(run(`rifleRoute(1,siegeGoal)[${action.move}]<before`));
 run('CampaignBattle.leave();CampaignBattle.start(null,1,{id:"iron-crown-m03"});cities[1].f=2;cities[2].f=2;for(const q of [cities[1],cities[2]])q.hp=Math.round(cityMaxHp(q)*.35);units=units.filter(u=>u.f===1||u.missionRole);buildRegions();save()');
 let recaptured=false;
 for(let n=0;n<5;n++){
  await run('(async()=>{const p=endTurn();enableAIFastForward();await p})()');
  if(run('cities[1].f===1||cities[2].f===1')){recaptured=true;break}
 }
 assert(recaptured,'Undefended captured objectives must actually fall to native enemy orders within five turns');
 assert.notEqual(run('CampaignBattle.inspect().progress.result'),'won');
 run('CampaignBattle.leave()');
 console.log('PASS actual mission03 enemy turns: abandoned captured objectives are attacked and recaptured before five-turn victory');
 console.log('PASS mission03 defense: five-turn victory with live/pending enemy waves, reset on point loss, objective checklist counter with no left HUD overlay, >=2 riflemen per counterwave, only two mission-point objectives, actual native rifle recapture and artillery advance');
};
