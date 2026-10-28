'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8769','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8769/game/assets/index.html');await page.locator('#appStart:not([disabled])').waitFor();
  await page.evaluate(async()=>{await runCampaignLoading(()=>{setup();started=true;setAppScreen('game');CampaignBattle.start(null,1,{id:'iron-crown-m03'})})});
  fs.mkdirSync('qa/campaign-previews',{recursive:true});
  for(const [width,height]of [[640,360],[800,360],[960,540],[390,844]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>updateHUD());
   assert(await page.locator('#campaignDefenseStatus').isVisible());
   let r=await page.locator('#campaignDefenseStatus').boundingBox();assert(r.x>=0&&r.y>=0&&r.x+r.width<=width&&r.y+r.height<=height);
   await page.click('#campaignObjectives');const sheet=page.locator('#campaignGoalSheet');assert((await sheet.textContent()).includes('출현 전'));
   const back=await page.locator('#appBack').boundingBox();assert(back&&back.y>=0&&back.y+back.height<=height,'continue button immediately visible');
   assert(await sheet.evaluate(e=>e.scrollHeight<=e.clientHeight+1));
   await page.screenshot({path:'qa/campaign-previews/defense-goals-'+width+'.png'});await page.click('#appBack');
  }
  await page.setViewportSize({width:800,height:360});
  await page.evaluate(()=>{cities[1].f=2;cities[2].f=2;buildRegions();save();clearWorldNotices()});
  assert((await page.locator('#campaignDefenseStatus').textContent()).includes('연속 방어 0 / 5턴'));
  await page.evaluate(()=>{turn++;save();cities[2].f=1;save();clearWorldNotices()});
  assert((await page.locator('#campaignDefenseStatus').textContent()).includes('방어 중단'));
  await page.evaluate(()=>{cities[2].f=2;save();turn+=5;save();clearWorldNotices()});
  assert((await page.locator('#campaignDefenseStatus').textContent()).includes('방어 완료 · 반격 격퇴 중'));
  await page.screenshot({path:'qa/campaign-previews/defense-hud-800.png'});await page.click('#campaignObjectives');await page.screenshot({path:'qa/campaign-previews/defense-complete-800.png'});
  assert.deepEqual(errors,[]);console.log('PASS mission03 defense UI: visible ongoing HUD, distinct reset/completed states, explicit wave conditions and counts, 640/800/960 landscape and 390 portrait checklist with visible continue button');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
