'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run,nodes,click,drain,settle,stored}){
 run('busy=false;aiTurnActive=false');
 const original=run('JSON.stringify({units,cities,money,food,oil,tech,owners:tiles.map(t=>t.owner),map:MAP.tiles,appRunId,appRunWon})');
 const keys=['terha-v1','terha-conquests',...Array.from({length:10},(_,i)=>'terha-slot-'+(i+1))],before=keys.map(k=>stored.get(k));
 run('window.sharedCombatRefs=[moveUnit,attack,reachable,endTurn,produce,selectUnit,showPanel,tap,sprite,drawUnitFocus,updateHUD,refreshSelection,launchShot,beginAim];CampaignBattle.start(null,1)');
 assert.equal(run('appScreen'),'game');assert.equal(run('activeScenario.id'),'iron-crown-m01');assert.equal(run('relationName(player,player)'),'자국');
 assert(run('[moveUnit,attack,reachable,endTurn,produce,selectUnit,showPanel,tap,sprite,drawUnitFocus,updateHUD,refreshSelection,launchShot,beginAim].every((fn,i)=>fn===sharedCombatRefs[i])'),'Scenario must use identical engine/UI functions');

 for(const [x,y,z]of [[-1e6,-1e6,.12],[1e6,1e6,.12],[-1e6,1e6,2.7],[1e6,-1e6,2.7]]){
  run('cam={x:'+x+',y:'+y+',z:'+z+'};CampaignBattle.constrainCamera()');
  assert(run('(()=>{const b=CampaignBattle.bounds(),hx=screenW/(2*cam.z),hy=screenH/(2*cam.z);return cam.x-hx>=b.x-1e-6&&cam.x+hx<=b.x+b.w+1e-6&&cam.y-hy>=b.y-1e-6&&cam.y+hy<=b.y+b.h+1e-6})()'),'Campaign viewport stays inside artwork');
 }
 run('CampaignPresentation.showGoals()');assert(nodes.has('campaignGoalSheet'));assert(nodes.get('modal').textContent.includes('회랑 보급소'));run('window.terhaBack()');assert.equal(run('appScreen'),'game');
 assert.equal(nodes.has('campaignCanvas'),false);assert.equal(run('saveKey()'),'terha-campaign-iron-crown-v2');
 run('selectUnit(units[1]);openSelectionPanel()');assert(nodes.get('panel').textContent.includes('체력'));assert(nodes.get('panel').innerHTML.includes('windowHeader'));
 run('selectCity(cities[0],true);cityCommandOpen("units")');assert(nodes.get('panel').textContent.includes('부대 생산'));assert(run('produce(cities[0],0,1,false)'));
 assert(run('moveUnit(units.find(u=>u.id===2),CampaignBattle.tile(5,7))'));assert(run('moving.some(a=>a.id===2)'),'Native movement animation');assert.equal(run('unitFocusId'),2);
 const max=run('unitMaxHp(units.find(u=>u.id===1))');assert.equal(max,run('TYPES[14].hp'));
 const turn=run('endTurn()');run('enableAIFastForward()');await turn;assert.equal(run('turn'),2);assert.equal(run('cities[0].queue'),null);assert(run('units.filter(u=>u.f===2).length>=6'));
 assert(run('save(10)'));const saved=run('JSON.stringify(readSave(10).units)');
 await drain(run('load(10)'));assert.equal(run('JSON.stringify(units)'),saved);assert.equal(run('activeSlot'),10);assert.equal(run('appScreen'),'game');
 run('showMenu()');assert(nodes.get('modal').textContent.includes('작전 현황')||nodes.get('modal').textContent.includes('OPERATION STATUS'));assert(nodes.get('modal').textContent.includes('철관'));
 run('CampaignBattle.leave();showHub()');assert.equal(run('activeScenario'),null);
 assert.equal(run('JSON.stringify({units,cities,money,food,oil,tech,owners:tiles.map(t=>t.owner),map:MAP.tiles,appRunId,appRunWon})'),original);
 keys.forEach((k,i)=>assert.equal(stored.get(k),before[i],k+' preserved'));
 await settle();console.log('PASS shared campaign native: exact combat/UI function identities, native information/production panels, movement animation/focus, AI turn/deployment, slots and exact conquest-state restoration');
};
