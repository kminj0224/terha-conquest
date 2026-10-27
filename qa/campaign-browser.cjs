'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');const {spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8766','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const enter=async()=>{await page.goto('http://127.0.0.1:8766/game/assets/index.html');await page.locator('#appStart:not([disabled])').waitFor();await page.click('#appStart');await page.click('#battle');await page.click('#campaignMode');await page.locator('#cpNew').waitFor()};
  await enter();await page.evaluate(()=>{localStorage.setItem('terha-v1','CONQUEST-PRESERVED');for(let n=1;n<=10;n++)localStorage.setItem('terha-slot-'+n,'SLOT-'+n)});
  await page.click('#cpNew');assert.equal(await page.locator('.cpVNFooter>span').textContent(),'1 / 25');
  fs.mkdirSync('qa/campaign-previews',{recursive:true});await page.screenshot({path:'qa/campaign-previews/01-intro.png'});
  for(let n=0;n<7;n++)await page.click('#cpNext');await page.click('#cpHistory');assert.equal(await page.locator('.cpHistoryItem').count(),8);await page.click('#cpSheetClose');await page.click('#cpVNLeave');await page.click('#cpContinue');assert.equal(await page.locator('.cpVNFooter>span').textContent(),'8 / 25');
  await enter();await page.click('#cpContinue');assert.equal(await page.locator('.cpVNFooter>span').textContent(),'8 / 25');await page.screenshot({path:'qa/campaign-previews/02-portrait.png'});await page.screenshot({path:'qa/campaign-previews/review-vn.jpg',type:'jpeg',quality:70});
  await page.click('#cpSkip');await page.click('#cpReadAgain');const lines=[];for(let n=0;n<25;n++){lines.push(await page.locator('#cpLine').textContent());await page.click('#cpNext')}assert.equal(new Set(lines).size,25);await page.locator('#cpLaunch').waitFor();await page.screenshot({path:'qa/campaign-previews/03-briefing.png'});
  await page.click('#cpLaunch');await page.locator('#campaignCanvas').waitFor();await page.waitForTimeout(700);
  const target=await page.evaluate(()=>TerhaCampaign.screenPoint({q:3,r:6})),box=await page.locator('#campaignCanvas').boundingBox();await page.mouse.click(box.x+target.x,box.y+target.y);assert.equal(await page.evaluate(()=>TerhaCampaign.getState().battle.units.find(u=>u.kind==='fortress').q),3);
  await page.click('#cpProduce');await page.locator('#cpCatalogue [data-kind="rifle"]').click();assert(await page.evaluate(()=>!!TerhaCampaign.getState().battle.facilities.find(f=>f.id==='base').queue));await page.click('#cpEnd');await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>TerhaCampaign.getState().battle.produced),1);
  await page.screenshot({path:'qa/campaign-previews/04-battle.png'});
  const saved=await page.evaluate(()=>JSON.stringify(TerhaCampaign.getState().battle));await enter();await page.click('#cpContinue');assert.equal(await page.evaluate(()=>JSON.stringify(TerhaCampaign.getState().battle)),saved);
  for(const [width,height]of [[800,360],[640,360],[390,844]]){await page.setViewportSize({width,height});await page.waitForTimeout(80);assert(await page.locator('#cpEnd').isVisible());const overflow=await page.evaluate(()=>document.getElementById('campaignRoot').scrollWidth>innerWidth);assert.equal(overflow,false);await page.screenshot({path:'qa/campaign-previews/battle-'+width+'.png'});if(width===800)await page.screenshot({path:'qa/campaign-previews/review-battle.jpg',type:'jpeg',quality:70})}
  await page.setViewportSize({width:960,height:540});
  const result=await page.evaluate(()=>{
   const R=CampaignRules,A=TerhaCampaign;let count=0;
   for(let round=0;round<35&&A.getState().phase==='battle';round++){
    let s=A.getState().battle;const ids=s.units.filter(u=>u.side===0).map(u=>u.id);
    for(const id of ids){if(A.getState().phase!=='battle')break;s=A.getState().battle;let u=s.units.find(u=>u.id===id);if(!u)continue;let t=s.units.filter(v=>R.canFire(s,u,v)).sort((a,b)=>a.hp-b.hp)[0];
     if(u.kind==='fortress'){
      const p=[...R.paths(s,u).keys()].map(k=>{const[q,r]=k.split(',').map(Number);return{q,r}}).filter(p=>!R.at(s,p)).sort((a,b)=>R.distance(a,R.EXIT)-R.distance(b,R.EXIT))[0];if(p&&A.act({type:'move',id,...p}))count++;
     }else if(t){if(A.act({type:'attack',id,target:t.id}))count++}
     else{const enemy=s.units.filter(v=>v.side===1).sort((a,b)=>R.distance(u,a)-R.distance(u,b))[0];if(enemy){const p=[...R.paths(s,u).keys()].map(k=>{const[q,r]=k.split(',').map(Number);return{q,r}}).filter(p=>!R.at(s,p)).sort((a,b)=>R.distance(a,enemy)-R.distance(b,enemy))[0];if(p&&A.act({type:'move',id,...p}))count++}}
     if(A.getState().phase!=='battle')break;s=A.getState().battle;u=s.units.find(u=>u.id===id);if(!u)continue;t=s.units.filter(v=>R.canFire(s,u,v)).sort((a,b)=>a.hp-b.hp)[0];if(t&&A.act({type:'attack',id,target:t.id}))count++;
    }
    if(A.getState().phase==='battle')A.act({type:'end'});
   }
   return{phase:A.getState().phase,state:A.getState().battle,count};
  });assert.equal(result.phase,'won');assert(result.count>5);assert(result.state.produced>0);await page.locator('#cpResultMenu').waitFor();await page.screenshot({path:'qa/campaign-previews/05-complete.png'});await page.screenshot({path:'qa/campaign-previews/review-complete.jpg',type:'jpeg',quality:70});
  assert.equal(await page.evaluate(()=>localStorage.getItem('terha-v1')),'CONQUEST-PRESERVED');for(let n=1;n<=10;n++)assert.equal(await page.evaluate(n=>localStorage.getItem('terha-slot-'+n),n),'SLOT-'+n);
  await page.click('#cpResultMenu');await page.click('#cpContinue');await page.locator('#cpResultRetry').waitFor();await page.click('#cpResultRetry');await page.click('#confirmYes');assert.equal(await page.evaluate(()=>TerhaCampaign.getState().battle.turn),1);assert.equal(await page.evaluate(()=>TerhaCampaign.getState().phase),'battle');
  await page.evaluate(()=>window.terhaBack());await page.locator('#cpNew').waitFor();await page.click('#appBack');await page.locator('#conquestMode').waitFor();assert.deepEqual(errors,[]);
  console.log('PASS actual browser campaign: 25 VN panels, history/skip/resume/reload, pointer movement, production/deployment, 4 viewport sizes, legal full victory, result/retry, all conquest saves unchanged',JSON.stringify({turn:result.state.turn,actions:result.count,produced:result.state.produced}));
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
