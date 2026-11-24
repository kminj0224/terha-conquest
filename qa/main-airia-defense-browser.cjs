'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');

(async()=>{
 const server=spawn('python3',['-m','http.server','8788','--bind','127.0.0.1'],{
  cwd:process.env.TERHA_TEST_ROOT||path.resolve(__dirname,'..'),stdio:'ignore'
 });
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.TERHA_CHROME_EXECUTABLE||undefined,headless:true});
  const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const selectStage=async()=>{
   await page.goto('http://127.0.0.1:8788/game/assets/index.html');
   await page.locator('#appStart:not([disabled])').click();
   await page.click('#battle');
   await page.click('#campaignMode');
   await page.click('#mainCampaign');
   await page.click('#mcSkip');
   await page.click('#mcWar');
  };
  const waitForBattle=()=>page.waitForFunction(()=>activeScenario?.id==='main-airia-m01'&&!campaignLoading&&appScreen==='game');
  await selectStage();
  await page.evaluate(()=>{localStorage.setItem('terha-v1','conquest fixture');localStorage.setItem('terha-campaign-iron-crown-v1','side campaign fixture');});
  await page.locator('.mcStageCard').first().click();
  await page.click('#maSkip');
  await page.click('#maPlay');
  await waitForBattle();
  const initial=await page.evaluate(()=>{
   rngSeed=74123;
   const d=MAIN_AIRIA.battle,s=snapshot();
   return {turn,player,valid:CampaignBattle.valid(s),navy:canProduce(cities[0],22),
    impassable:[CampaignBattle.tile(20,6),CampaignBattle.tile(12,5)].every(i=>tiles[i].owner===-1&&moveCost(units[0],i)>=99999),
    goals:d.defenseSites.map(id=>cities[id].f),attackers:CampaignOrders.points().map(c=>c.id)};
  });
  assert.deepEqual(initial,{turn:1,player:3,valid:true,navy:false,impassable:true,goals:[3,3],attackers:[0,1]});
  await page.click('#campaignObjectives');
  assert.match(await page.locator('#campaignGoalSheet').innerText(),/방어 0 \/ 8턴/);
  await page.click('#appBack');
  const enemyTurn=()=>page.evaluate(async()=>{
   const ending=endTurn();
   enableAIFastForward();
   await ending;
   return {turn,progress:CampaignBattle.inspect().progress};
  });
  const first=await enemyTurn();
  assert.deepEqual(first.progress.waves,[2]);
  assert.equal(first.progress.result,null);
  const lead=await page.evaluate(()=>units.filter(u=>u.missionWave===2).map(u=>u.id));
  assert.equal(lead.length,4);
  await selectStage();
  await page.locator('.mcStageCard').first().click();
  await page.click('#maResume');
  await waitForBattle();
  assert.deepEqual(await page.evaluate(()=>({turn,lead:units.filter(u=>u.missionWave===2).map(u=>u.id)})),{turn:2,lead});

  // Use the shared commands to produce reserves, engage the enemy, and keep both garrisons.
  let built=0,shots=0,final;
  for(let round=2;round<=8;round++){
   const orders=await page.evaluate(async()=>{
    let built=0,shots=0;
    for(const q of cities.filter(q=>q.f===player)){
     const roster=q.level===3?[2,9,1,0]:[9,0];
     if(roster.some(type=>produce(q,type,2,false)))built++;
    }
    aiTurnActive=true;
    enableAIFastForward();
    try{
     const own=units.filter(u=>u.f===player).sort((a,b)=>TYPES[a.type].branch==='artillery'?-1:Number(TYPES[b.type].branch==='artillery'));
     for(const u of own){
      if(!units.includes(u))continue;
      if(u.hp<unitMaxHp(u)*.65&&canResupply(u))repair(u);
      const enemies=()=>units.filter(v=>atWar(u.f,v.f)&&!v.carriedBy);
      const score=v=>Number(damage(u,v)>=v.hp)*100+Number(TYPES[v.type].branch==='artillery')*28+Number(canCaptureCityUnit(v))*9-v.hp*.04;
      const target=()=>enemies().filter(v=>canAttack(u,v)).sort((a,b)=>score(b)-score(a))[0];
      let v=target();
      if(!v&&mayMove(u)&&!MAIN_AIRIA.battle.defenseSites.some(id=>cities[id].tile===u.tile)){
       const spotValue=i=>{
        if(tiles[i].x<46)return -100;
        const nearby=enemies(),range=TYPES[u.type].range;
        const available=nearby.filter(v=>distance(v.tile,i)<=range);
        const risk=nearby.filter(v=>distance(v.tile,i)<=TYPES[v.type].range).length;
        return (available.length?10+Math.max(...available.map(score))*.1:0)-risk*2-Math.min(8,...nearby.map(v=>distance(v.tile,i)))*.3;
       };
       const best=[...reachable(u).costs.keys()].sort((a,b)=>spotValue(b)-spotValue(a))[0];
       if(best!==undefined&&spotValue(best)>spotValue(u.tile))moveUnit(u,best,true);
       v=target();
      }
      if(v){await attack(u,v,true);shots++;}
     }
    }finally{aiTurnActive=false;aiFastForward=false;}
    return {built,shots};
   });
   built+=orders.built;shots+=orders.shots;
   final=await enemyTurn();
   if(round<8)assert.equal(final.progress.result,null,`Turn ${round}`);
  }
  assert(built>0&&shots>0);
  assert.equal(final.turn,9);
  assert.equal(final.progress.result,'won');
  assert.deepEqual(final.progress.waves,[2,4,6]);
  await page.locator('#maPage').waitFor();
  assert.equal(await page.evaluate(()=>MainCampaign.getView()),'stage-outro');
  assert.equal(await page.evaluate(()=>activeScenario),null);
  assert.match(await page.locator('#maPage').textContent(),/^1 \/ 14$/);
  await page.click('#maNext');
  await page.click('#maLeave');
  assert.match(await page.locator('.mcStageProgress b').textContent(),/^1/);
  assert.equal(await page.locator('.mcStageCard[aria-disabled="true"]').count(),9);
  await selectStage();
  await page.locator('.mcStageCard').first().click();
  await page.click('#maEnding');
  assert.equal(await page.locator('#maPage').textContent(),'2 / 14');
  await page.click('#maSkip');
  await page.locator('.mcStageCard').first().click();
  await page.click('#maEnding');
  assert.equal(await page.locator('#maPage').textContent(),'1 / 14');
  await page.click('#maLeave');

  // A breached harbor occupied through the native capture command must fail.
  await page.locator('.mcStageCard').first().click();
  await page.click('#maPlay');
  await waitForBattle();
  const captured=await page.evaluate(()=>{
   const q=cities[0];
   kill(unitAt(q.tile));
   q.hp=0;
   const site=neighbors(q.tile).find(i=>tiles[i].owner>=0&&!unitAt(i));
   const rifle=makeUnit(1,0,site,1);
   freshOrders(rifle);
   moveUnit(rifle,q.tile,true);
   checkEnd();
   return q.f;
  });
  assert.equal(captured,1);
  await page.locator('#maRetry').click();
  await waitForBattle();
  assert.equal(await page.evaluate(()=>turn),1);
  assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('terha-v1'),localStorage.getItem('terha-campaign-iron-crown-v1')]),['conquest fixture','side campaign fixture']);
  assert.deepEqual(errors,[]);
  console.log(`PASS Golden Harbor: eight actual enemy turns, three waves, ${built} reserve orders, ${shots} shots, battle reload, outro resume/replay, native capture loss and retry`);
 }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
