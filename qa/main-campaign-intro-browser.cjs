'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8779','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8779/game/assets/index.html');await page.locator('#appStart:not([disabled])').waitFor();await page.click('#appStart');await page.click('#battle');
  const saves=await page.evaluate(()=>JSON.stringify(localStorage));
  await page.click('#campaignMode');await page.click('#mainCampaign');await page.evaluate(()=>document.fonts.load('20px TerhaTypewriter'));assert(await page.evaluate(()=>document.fonts.check('20px TerhaTypewriter')));
  assert(await page.evaluate(()=>menuMusic.paused));await page.clock.install();await page.clock.pauseAt(new Date(Date.now()+1000));await page.evaluate(()=>MainCampaign.open());
  const index=()=>page.evaluate(()=>MainCampaign.getPage()),opacity=()=>page.locator('#mcVisible').evaluate(e=>+getComputedStyle(e).opacity);
  const ignoreManual=async n=>{await page.locator('#mainIntro').click({position:{x:40,y:80}});for(const key of ['ArrowRight','ArrowLeft','Enter',' '])await page.keyboard.press(key);await page.evaluate(()=>window.terhaBack());assert.equal(await index(),n)};
  assert.equal(await opacity(),0);assert.equal(await page.locator('#mainIntro button').count(),1);await ignoreManual(0);
  await page.clock.fastForward(1000);assert.equal(await opacity(),0);await page.clock.fastForward(450);assert((await opacity())>0&&(await opacity())<1);await page.clock.fastForward(450);assert.equal(await opacity(),1);
  fs.mkdirSync('qa/campaign-previews',{recursive:true});await page.screenshot({path:'qa/campaign-previews/main-intro-center.png'});
  await page.clock.fastForward(2900);assert.equal(await opacity(),1);assert.equal(await index(),0);await page.clock.fastForward(500);assert((await opacity())>0&&(await opacity())<1);assert.equal(await index(),0);await page.clock.fastForward(450);assert.equal(await index(),1);
  assert.equal(await page.locator('#mcNext').isVisible(),false);assert(await page.locator('#mcNext').isDisabled());await ignoreManual(1);await page.evaluate(()=>document.getElementById('mcNext').onclick());assert.equal(await index(),1);
  const before=await page.locator('#mcVisible').textContent();await page.clock.fastForward(350);const partial=await page.locator('#mcVisible').textContent();assert(partial.length>before.length);assert.equal(await page.locator('#mcNext').isVisible(),false);
  await page.clock.fastForward(12000);assert.equal(await page.locator('#mcVisible').textContent(),await page.locator('.mcMeasure').textContent());assert(await page.locator('#mcNext').isVisible());assert(await page.locator('#mcNext').isEnabled());
  const b=await page.locator('#mcNext').boundingBox();assert(b.x>800&&b.y>450);assert.equal(await page.locator('#mcPrev,#mcPage').count(),0);await page.screenshot({path:'qa/campaign-previews/main-intro-banner.png'});
  await page.locator('#mainIntro').click({position:{x:40,y:80}});assert.equal(await index(),1);await page.click('#mcNext');assert.equal(await index(),2);assert.equal(await page.locator('#mcNext').isVisible(),false);
  await page.click('#mcSkip');assert(await page.locator('#mainCampaignSelection').isVisible());await page.clock.fastForward(10000);assert(await page.locator('#mainCampaignSelection').isVisible());
  await page.click('#mcWar');assert(await page.locator('#mcCampaignDetails').isVisible());assert(await page.locator('#mcCampaignDetails button').isDisabled());
  const lines=await page.evaluate(()=>MAIN_CAMPAIGN_INTRO);assert.equal(lines.length,45);assert.equal(lines.filter(l=>l.layout==='center').length,6);assert.equal(lines.filter(l=>l.image).length,41);
  for(const [width,height]of [[960,540],[640,360],[390,844],[844,390],[2400,1080]]){
   await page.setViewportSize({width,height});await page.click('#mcReplay');let font;
   for(let n=0;n<lines.length;n++){
    assert.equal(await index(),n);const line=lines[n];
    const m=await page.locator('.mcText').evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,size:getComputedStyle(e).fontSize}});
    assert(m.x>=0&&m.y>=0&&m.x+m.w<=width+1&&m.y+m.h<height-48,`Text fits ${width}x${height} page ${n+1}`);
    if(line.image){await page.locator('.mcImage').evaluate(e=>e.decode());assert.equal(await page.locator('.mcImage').getAttribute('src'),line.image);assert.equal(await page.locator('.mcImage').evaluate(e=>getComputedStyle(e).objectFit),'cover')}else assert.equal(await page.locator('.mcImage').count(),0);
    assert.equal(await page.locator('#mcPrev,#mcPage').count(),0);
    if(line.layout==='center'){
     assert.equal(await page.locator('#mainIntro button').count(),1);await ignoreManual(n);
     await page.clock.fastForward(line.image?1800:800);assert.equal(await opacity(),0);
     await page.clock.fastForward(1200);assert.equal(await opacity(),1);await page.clock.fastForward(2700);assert.equal(await opacity(),1);assert.equal(await index(),n);
     for(let step=0;step<15&&await index()===n;step++)await page.clock.fastForward(100);
     if(n<lines.length-1)assert.equal(await index(),n+1);
    }else{
     if(!font)font=m.size;assert.equal(m.size,font);assert((await page.locator('.mcTextArea').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('90%'));
     assert.equal(await page.locator('#mcNext').isVisible(),false);await ignoreManual(n);await page.clock.fastForward(Array.from(line.text).length*42+32);assert(await page.locator('#mcNext').isVisible());
     const r=await page.locator('#mcNext').boundingBox();assert(r.x>width/2&&r.y>height/2&&r.x+r.width<=width+1&&r.y+r.height<=height+1);await page.click('#mcNext');
    }
   }
   assert(await page.locator('#mainCampaignSelection').isVisible(),'Last center page automatically opens selection');
  }
  // Pausing the app must not consume an unseen center page or its display time.
  await page.click('#mcReplay');await page.clock.fastForward(500);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await page.clock.fastForward(10000);assert.equal(await index(),0);assert.equal(await opacity(),0);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await page.clock.fastForward(400);assert.equal(await opacity(),0);await page.clock.fastForward(5500);assert.equal(await index(),1);
  await page.click('#mcSkip');await page.click('#mcBack');await page.click('#campaignMode');await page.click('#subCampaign');assert(await page.locator('#cpCampaignIron').isVisible());await page.evaluate(()=>TerhaCampaign.close());
  await page.click('#campaignMode');await page.click('#mainCampaign');await page.click('#mcSkip');await page.clock.fastForward(10000);assert(await page.locator('#mainCampaignSelection').isVisible());await page.click('#mcBack');
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),saves);assert.deepEqual(errors,[]);
  console.log('PASS main campaign pacing: 45 pages/four viewports, black 1s and illustrated center 2s delay, fade in/3s hold/fade out/automatic next, no manual center progression, typing-gated lower-right next, Skip cleanup, visibility pause, unchanged saves/subcampaign');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
