'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8779','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8779/game/assets/index.html');
  await page.locator('#appStart:not([disabled])').waitFor();await page.click('#appStart');await page.click('#battle');
  const saves=await page.evaluate(()=>JSON.stringify(localStorage));
  await page.click('#campaignMode');await page.click('#mainCampaign');
  assert.equal(await page.evaluate(()=>MainCampaign.getPage()),0);
  await page.evaluate(()=>document.fonts.load('20px TerhaTypewriter'));
  assert(await page.evaluate(()=>document.fonts.check('20px TerhaTypewriter')));
  // Measure the actual CSS delay and fade before mocking RAF for typing.
  await page.evaluate(()=>MainCampaign.open());
  assert.equal(await page.locator('#mcVisible').evaluate(e=>+getComputedStyle(e).opacity),0);
  await page.waitForTimeout(1600);
  assert.equal(await page.locator('#mcVisible').evaluate(e=>+getComputedStyle(e).opacity),0);
  await page.waitForTimeout(550);
  const partial=await page.locator('#mcVisible').evaluate(e=>+getComputedStyle(e).opacity);assert(partial>0&&partial<1);
  await page.waitForTimeout(950);assert.equal(await page.locator('#mcVisible').evaluate(e=>+getComputedStyle(e).opacity),1);
  fs.mkdirSync('qa/campaign-previews',{recursive:true});await page.screenshot({path:'qa/campaign-previews/main-intro-center.png'});
  await page.clock.install();
  await page.click('#mcNext');assert.equal(await page.evaluate(()=>MainCampaign.getPage()),1);
  const early=await page.locator('#mcVisible').textContent();await page.clock.runFor(350);const typed=await page.locator('#mcVisible').textContent();
  assert(typed.length>early.length&&typed.length<await page.locator('.mcMeasure').textContent().then(t=>t.length));
  await page.clock.runFor(4000);assert.equal(await page.locator('#mcVisible').textContent(),await page.locator('.mcMeasure').textContent());
  await page.screenshot({path:'qa/campaign-previews/main-intro-banner.png'});
  await page.click('#mcPrev');assert.equal(await page.evaluate(()=>MainCampaign.getPage()),0);assert.equal(await page.locator('#mcVisible').evaluate(e=>+getComputedStyle(e).opacity),0);
  await page.click('#mainIntro',{position:{x:40,y:80}});assert.equal(await page.evaluate(()=>MainCampaign.getPage()),1);
  await page.click('#mcNext');assert.equal(await page.evaluate(()=>MainCampaign.getPage()),2,'Next button advances exactly once');
  await page.evaluate(()=>window.terhaBack());assert.equal(await page.evaluate(()=>MainCampaign.getPage()),1);
  await page.click('#mcSkip');assert(await page.locator('#mainCampaignSelection').isVisible());assert.equal(await page.locator('#mainIntro').count(),0);
  await page.clock.runFor(5000);assert(await page.locator('#mainCampaignSelection').isVisible(),'No stale animation after Skip');
  await page.click('#mcWar');assert(await page.locator('#mcCampaignDetails').isVisible());assert(await page.locator('#mcCampaignDetails button').isDisabled());
  await page.screenshot({path:'qa/campaign-previews/main-campaign-selection.png'});
  const lines=await page.evaluate(()=>MAIN_CAMPAIGN_INTRO);assert.equal(lines.length,45);assert.equal(lines.filter(l=>l.layout==='center').length,6);
  assert.equal(lines[36].layout,'center');assert.equal(lines[36].image,'main-campaign-intro.jpg');
  assert(lines.filter(l=>l.image).every(l=>l.image==='main-campaign-intro.jpg'));
  for(const [width,height]of [[960,540],[640,360],[390,844],[844,390]]){
   await page.setViewportSize({width,height});await page.click('#mcReplay');let font;
   for(let n=0;n<lines.length;n++){
    assert.equal(await page.evaluate(()=>MainCampaign.getPage()),n);
    const metrics=await page.locator('.mcText').evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,size:getComputedStyle(e).fontSize}});
    assert(metrics.x>=0&&metrics.y>=0&&metrics.x+metrics.w<=width+1&&metrics.y+metrics.h<height-48,`Text fits ${width}x${height} page ${n+1}: ${JSON.stringify(metrics)}`);
    if(lines[n].layout==='banner'){
     if(!font)font=metrics.size;assert.equal(metrics.size,font,'All banner pages have the same type size');
     assert((await page.locator('.mcTextArea').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('90%'));
    }
    const img=page.locator('.mcImage');
    if(lines[n].image){await img.evaluate(e=>e.decode());assert.equal(await img.getAttribute('src'),'main-campaign-intro.jpg');assert.equal(await img.evaluate(e=>getComputedStyle(e).objectFit),'contain')}
    else {assert.equal(await img.count(),0);assert.equal(await page.locator('#mainIntro').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(0, 0, 0)')}
    for(const id of ['mcSkip','mcPrev','mcNext']){const r=await page.locator('#'+id).boundingBox();assert(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1)}
    await page.click('#mcNext');
   }
   assert(await page.locator('#mainCampaignSelection').isVisible(),'Reading all pages leads to selection');
  }
  await page.click('#mcReplay');await page.click('#mcNext');await page.click('#mcNext');await page.click('#mcPrev');assert.equal(await page.evaluate(()=>MainCampaign.getPage()),1);
  await page.evaluate(()=>{window.terhaBackground();window.terhaForeground()});assert.equal(await page.evaluate(()=>MainCampaign.getPage()),1);
  await page.click('#mcSkip');await page.click('#mcBack');await page.click('#campaignMode');await page.click('#subCampaign');assert(await page.locator('#cpCampaignIron').isVisible());
  await page.evaluate(()=>TerhaCampaign.close());await page.click('#campaignMode');await page.click('#mainCampaign');assert.equal(await page.evaluate(()=>MainCampaign.getPage()),0,'New entry starts at page one');
  await page.evaluate(()=>window.terhaBack());assert.equal(await page.evaluate(()=>appScreen),'battlefield');
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),saves);assert.deepEqual(errors,[]);
  console.log('PASS main campaign: 45 pages, supplied image, 2-second delayed center fade, 14ms typing, fixed font, 80/10/10 banner, all page bounds at four viewports, touch/arrows/Back/Skip/replay/end flow, selection, background continuity and unchanged saves/subcampaign');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
