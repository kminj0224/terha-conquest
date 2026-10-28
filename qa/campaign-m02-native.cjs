'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run,nodes,click,drain,settle,stored}){
 run('busy=false;aiTurnActive=false');
 const mission1Keys=['terha-campaign-iron-crown-v2',...Array.from({length:10},(_,i)=>'terha-campaign-iron-crown-slot-'+(i+1))],mission1Before=mission1Keys.map(k=>stored.get(k));
 const original=run('JSON.stringify({units,cities,money,food,oil,tech,owners:tiles.map(t=>t.owner),map:MAP.tiles,appRunId,appRunWon})');
 run("CampaignBattle.start(null,1,{id:'iron-crown-m02',route:'recapture'})");
 assert.equal(run('saveKey()'),'terha-campaign-iron-crown-m02-v2');
 assert.equal(run('cities.length'),5);assert.equal(run('cities[1].f'),1);
 assert.equal(run('CampaignBattle.valid(snapshot())'),true);
 const gold=run('money[2]');
 assert.equal(run('CampaignBattle.inspect().progress.waves.length'),0);
 // A lone hero rush cannot complete a battle with unsecured objectives.
 run('units.find(u=>u.missionRole===\'iron-crown\').tile=CampaignBattle.inspect().progress.exit;CampaignBattle.check()');
 assert.equal(run('CampaignBattle.inspect().progress.result'),null);
 run('CampaignBattle.leave();CampaignBattle.start(null,1,{id:"iron-crown-m02",route:"pay"})');
 assert.equal(run('money[2]'),gold-600);assert.equal(run('cities[1].f'),2);
 run('CampaignPresentation.showGoals()');assert(nodes.get('modal').textContent.includes('남부 보급소'));assert(!nodes.get('modal').textContent.includes('20턴'));await click('appBack');
 // Early objective capture accelerates every counterattack; no turn-count lock.
 run('cities[1].f=2;cities[2].f=2;units.find(u=>u.missionRole===\'iron-crown\').tile=CampaignBattle.inspect().progress.exit;save()');
 assert.equal(run('CampaignBattle.inspect().progress.waves.length'),5);
 assert.equal(run('CampaignBattle.inspect().progress.result'),null);
 assert(run('units.filter(u=>u.missionWave).length+CampaignBattle.inspect().progress.pending.length>=26'));
 assert(run('units.filter(u=>u.missionWave).every(u=>units.every(v=>v.f!==2||distance(u.tile,v.tile)>2))'));
 assert(run('save(9)'));const waveIds=run('JSON.stringify(units.filter(u=>u.missionWave).map(u=>u.id))');
 await drain(run('load(9)'));run('save();save()');assert.equal(run('JSON.stringify(units.filter(u=>u.missionWave).map(u=>u.id))'),waveIds,'No duplicated waves after loading');
 // Isolated victory fixture: prove there is no minimum turn or mandatory wait.
 run('for(let n=0;n<5;n++){units=units.filter(u=>u.f===2);save()}CampaignBattle.check()');
 assert.equal(run('turn'),1);assert.equal(run('CampaignBattle.inspect().progress.result'),'won');
 run('CampaignBattle.leave()');
 assert.equal(run('JSON.stringify({units,cities,money,food,oil,tech,owners:tiles.map(t=>t.owner),map:MAP.tiles,appRunId,appRunWon})'),original);
 // An enemy army keeps its orders when its last production city falls.
 run('CampaignBattle.start(null,1,{id:"iron-crown-m02",route:"recapture"});cities.forEach(q=>{q.f=2;tiles[q.tile].owner=2});save()');
 const before=run('JSON.stringify(units.filter(u=>u.f===1).map(u=>[u.id,u.tile]))');
 const p=run('endTurn()');run('enableAIFastForward()');await p;assert.equal(run('turn'),2);assert.notEqual(run('JSON.stringify(units.filter(u=>u.f===1).map(u=>[u.id,u.tile]))'),before);
 run('CampaignBattle.leave();showHub()');
 mission1Keys.forEach((k,i)=>assert.equal(stored.get(k),mission1Before[i],k+' preserved'));
 console.log('PASS mission02 native: two routes, 600-gold cost, native AI after city loss, objective rush blocked by actual enemies, reactive multi-front waves, safe entry, save/load no duplication, turn-one objective victory without time lock, exact conquest restoration');
};
