'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8786','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.TERHA_CHROME_EXECUTABLE||undefined,headless:true});const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8786/game/assets/index.html');await page.locator('#appStart:not([disabled])').waitFor();await page.click('#appStart');await page.click('#battle');
  const saves=await page.evaluate(()=>JSON.stringify(localStorage));
  await page.click('#campaignMode');await page.click('#mainCampaign');await page.click('#mcSkip');
  assert.equal(await page.locator('#mcWar img').getAttribute('src'),'main-campaign-scene-7.png');
  const stages=async()=>{await page.click('#mcWar');assert.equal(await page.locator('.mcStageCard[aria-disabled="false"]').count(),1);assert.equal(await page.locator('.mcStageCard[aria-disabled="true"]').count(),9);assert.equal(await page.locator('.mcStageCard strong').first().textContent(),'아이리아 전역.');};
  await stages();await page.locator('.mcStageCard').nth(1).click();assert.equal(await page.evaluate(()=>MainCampaign.getView()),'stages');
  await page.locator('.mcStageCard').first().click();
  const lines=await page.evaluate(()=>MAIN_AIRIA.intro);assert.equal(lines.length,25);assert.deepEqual([...new Set(lines.map(l=>l.speaker))].sort(),['adjutant','nagorn','scout']);assert.equal(lines[24].speaker,'scout');assert(lines[24].text.includes('증원병력'));
  fs.mkdirSync('qa/campaign-previews',{recursive:true});
  for(const [width,height] of [[960,540],[640,360],[390,844],[844,390]]){
   await page.setViewportSize({width,height});
   for(let n=0;n<25;n++){
    assert.equal(await page.evaluate(()=>MainCampaign.getStagePage()),n);
    assert.equal(await page.locator('#maLine').textContent(),lines[n].text);
    await page.locator('.maPortrait').evaluate(e=>e.decode());
    assert.equal(await page.locator('#maPage').textContent(),`${n+1} / 25`);
    assert(await page.evaluate(()=>menuMusic.paused));
    const fit=await page.locator('.cpDialogue').evaluate(e=>{const b=e.getBoundingClientRect();return b.x>=0&&b.y>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1&&e.scrollHeight<=e.clientHeight+1;});assert(fit,`dialogue fits ${width}x${height} page ${n+1}`);
    const next=await page.locator('#maNext').boundingBox();assert(next.y>=0&&next.y+next.height<=height+1);
    if([0,1,24].includes(n))await page.screenshot({path:`qa/campaign-previews/airia-${width}-${n+1}.png`});
    await page.click('#maNext');
   }
   assert.equal(await page.evaluate(()=>MainCampaign.getView()),'stage-start');assert.equal(await page.locator('.maStartCard h1').textContent(),'아이리아 전역.');
   assert.equal(await page.locator('.maStartCard').innerText(),'OPERATION 01\n아이리아 전역.\n플레이');
   await page.click('#maPlay');assert.equal(await page.evaluate(()=>MainCampaign.getView()),'stage-play');
   assert(await page.evaluate(()=>activeScenario===null));assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),saves);
   await page.evaluate(()=>terhaBack());await page.locator('.mcStageCard').first().click();
  }
  await page.click('#maNext');await page.click('#maPrev');assert.equal(await page.evaluate(()=>MainCampaign.getStagePage()),0);
  await page.click('#maHistory');assert.equal(await page.locator('.cpHistoryItem').count(),1);assert(await page.locator('.maField').evaluate(e=>e.inert));await page.keyboard.press('Escape');assert.equal(await page.locator('#maHistorySheet').count(),0);
  await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));await page.click('#maAuto');await page.clock.fastForward(15000);assert((await page.evaluate(()=>MainCampaign.getStagePage()))>0);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});const n=await page.evaluate(()=>MainCampaign.getStagePage());await page.clock.fastForward(30000);assert.equal(await page.evaluate(()=>MainCampaign.getStagePage()),n);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.click('#maSkip');assert.equal(await page.evaluate(()=>MainCampaign.getView()),'stage-start');await page.clock.fastForward(30000);assert.equal(await page.evaluate(()=>MainCampaign.getView()),'stage-start');await page.click('#maStartBack');await page.click('#mcStagesBack');await page.click('#mcBack');
  await page.click('#campaignMode');await page.click('#subCampaign');assert(await page.locator('#cpCampaignIron').isVisible());await page.evaluate(()=>TerhaCampaign.close());
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),saves);assert.deepEqual(errors,[]);
  console.log('PASS Airia 25 dialogue pages at four viewports, original portraits, pyramid banner, locks, previous/history/auto/visibility/skip/exit, mission start/play stub, no scenario or save mutation, subcampaign preserved');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
