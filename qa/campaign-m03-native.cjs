'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run,drain,stored}){
 run('busy=false;aiTurnActive=false');
 const oldKeys=[...stored.entries()].filter(([k])=>/terha-(v1|slot-|campaign-iron-crown(-m02)?-(v2|slot-))/.test(k));
 const original=run('JSON.stringify({units,cities,money,food,oil,tech,owners:tiles.map(t=>t.owner),map:MAP.tiles})');
 run(`CampaignBattle.start(null,1,{id:'iron-crown-m02'});window.m03Previous=JSON.parse(JSON.stringify(snapshot()));m03Previous.missionProgress.result='won';m03Previous.tech[2]=2;m03Previous.units.find(u=>u.missionRole).hp=300;CampaignBattle.leave();CampaignBattle.start(null,1,{id:'iron-crown-m03',route:'troops',carry:m03Previous})`);
 // The predecessor fixture writes its own autosave; exclude that setup write.
 oldKeys.forEach(([k,v])=>stored.set(k,v));
 assert.equal(run('saveKey()'),'terha-campaign-iron-crown-m03-v2');
 assert.equal(run('cities.length'),6);assert(run('CampaignBattle.valid(snapshot())'));
 assert.equal(run('tech[2]'),2);assert.equal(run('units.find(u=>u.missionRole).hp'),300);
 assert.equal(run('units.filter(u=>u.f===2).length'),run('m03Previous.units.filter(u=>u.f===2).length'));
 assert.equal(run('money[2]'),run('950+Math.floor(m03Previous.money[2]*.25)'));
 run('cities[1].f=2;cities[2].f=2;buildRegions();save();save()');
 assert.equal(run('CampaignBattle.inspect().progress.holdTurns'),0);
 assert.equal(run('CampaignBattle.inspect().progress.result'),null);
 assert(run('units.filter(u=>u.missionWave).every(u=>units.every(v=>v.f!==2||distance(u.tile,v.tile)>2))'));
 run('turn++;save();save()');assert.equal(run('CampaignBattle.inspect().progress.holdTurns'),1);
 run('turn++;save()');assert(run('CampaignBattle.inspect().progress.delivered'));
 assert.equal(run('units.filter(u=>u.f===2).length'),run('m03Previous.units.filter(u=>u.f===2).length+3'));
 const progress=run('JSON.stringify(CampaignBattle.inspect().progress)');assert(run('save(7)'));await drain(run('load(7)'));run('save();save()');assert.equal(run('JSON.stringify(CampaignBattle.inspect().progress)'),progress);
 run('cities[2].f=1;save()');assert.equal(run('CampaignBattle.inspect().progress.holdTurns'),0);
 run('cities[2].f=2;save()');assert.equal(run('CampaignBattle.inspect().progress.holdTurns'),0);
 // Isolated objective fixture verifies five actual turn boundaries, not repeat saves.
 for(let n=0;n<5;n++){run('units=units.filter(u=>u.f===2);turn++;save();save()');assert.equal(run('CampaignBattle.inspect().progress.holdTurns'),n+1)}
 run('units=units.filter(u=>u.f===2);save();CampaignBattle.check()');
 assert.equal(run('CampaignBattle.inspect().progress.result'),'won');assert(run('turn<20'));
 run('CampaignBattle.leave();CampaignBattle.start(null,1,{id:"iron-crown-m03",route:"cargo"});cities[1].f=2;save()');
 const money=run('money[2]'),army=run('units.filter(u=>u.f===2).length');
 for(let n=0;n<4;n++)run('turn++;save()');
 assert(run('CampaignBattle.inspect().progress.cargoSecured'));assert.equal(run('money[2]'),money+800);assert.equal(run('units.filter(u=>u.f===2).length'),army+2);
 const delivered=run('units.filter(u=>u.f===2).length');run('save();save()');assert.equal(run('units.filter(u=>u.f===2).length'),delivered);
 run('window.bad3=JSON.parse(JSON.stringify(snapshot()));bad3.missionProgress.holdTurns=-1');assert(!run('CampaignBattle.valid(bad3)'));
 run('units=units.filter(u=>!u.missionRole);CampaignBattle.check()');assert.equal(run('CampaignBattle.inspect().progress.result'),'lost');
 run('CampaignBattle.leave();CampaignBattle.start(null,1,{id:"iron-crown-m03",route:"troops"});cities.forEach(q=>q.f=1);CampaignBattle.check()');assert.equal(run('CampaignBattle.inspect().progress.result'),'lost');
 run('CampaignBattle.leave()');
 assert.equal(run('JSON.stringify({units,cities,money,food,oil,tech,owners:tiles.map(t=>t.owner),map:MAP.tiles})'),original);
 oldKeys.forEach(([k,v])=>assert.equal(stored.get(k),v,k+' preserved'));
 console.log('PASS mission03 native: previous survivors/research/resources, independent saves, continuous five-turn defense/reset, safe reactive waves, reload deduplication, both delivery priorities, defeat conditions and exact conquest restoration');
};
