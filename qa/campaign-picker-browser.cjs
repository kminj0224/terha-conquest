'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8767','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8767/game/assets/index.html');
  await page.locator('#appStart:not([disabled])').waitFor();
  assert.equal(await page.title(),'테르하 : 낙원의 기억');
  assert.equal(await page.locator('body[data-screen="title"] #modal h1').count(),0);
  assert.equal(await page.locator('body[data-screen="title"] #modal .subtitle').count(),0);
  assert.equal(await page.locator('#titleLogo').getAttribute('src'),'title-logo.png');
  assert(await page.locator('#titleLogo').evaluate(img=>img.complete&&img.naturalWidth===700&&img.naturalHeight===173),'Title image is loaded');
  const logoBox=await page.locator('#titleLogo').boundingBox(),startBox=await page.locator('#appStart').boundingBox();
  assert(logoBox&&startBox&&logoBox.x>=0&&logoBox.y>=0&&logoBox.x+logoBox.width<=1280&&logoBox.y+logoBox.height<=startBox.y+4,'Title image stays visible above START');
  assert.equal((await page.locator('#appStart').textContent()).trim(),'','START button shows art, no visible text');
  assert.equal(await page.locator('#appStart .startArt').getAttribute('src'),'start-button.png');
  assert(await page.locator('#appStart .startArt').evaluate(img=>img.complete&&img.naturalWidth===700),'START artwork loads');
  await page.click('#appStart');
  // The masthead must never resize or jump between the opening and hub pages.
  for(const [width,height]of [[1280,720],[960,540],[640,360],[390,844]]){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>showTitle());
   const initial=await page.locator('#titleLogo').boundingBox();
   const startArt=await page.locator('#appStart').boundingBox();
   const prior=height<=470?Math.min(240,Math.max(175,width*.29)):width<=600&&height>width?Math.min(width*.55,240):Math.min(265,Math.max(175,width*.23));
   assert(Math.abs(startArt.width-prior*.6)<1,'START must be exactly 40% smaller than v1.11.91 at '+width+'x'+height);
   await page.click('#appStart');
   const hub=await page.locator('#titleLogo').boundingBox();
   for(const k of ['x','y','width','height'])assert(Math.abs(initial[k]-hub[k])<1,'Logo '+k+' must match exactly across title and hub '+width+'x'+height);
   const banners=await page.locator('#modal .hubLanding .mainButtons').boundingBox();
   assert(banners&&banners.y<height*.45,'Hub banner selection is not pushed down by the image header');
   const shift=await page.locator('#modal .hubLanding .mainButtons').evaluate(e=>parseFloat(getComputedStyle(e).marginTop));
   assert(shift<=65,'No artificial 20vh banner offset');
  }
  await page.setViewportSize({width:1280,height:720});
  assert.equal(await page.locator('#modal h1').count(),0,'Hub does not recreate title text');
  assert.equal(await page.locator('#modal .subtitle').count(),0,'Hub does not recreate English subtitle');
  assert.equal(await page.locator('body[data-screen="hub"] #titleLogo').getAttribute('src'),'title-logo.png');
  assert(await page.locator('body[data-screen="hub"] #titleLogo').evaluate(img=>img.complete&&img.naturalWidth===700),'Hub displays original title logo');
  await page.evaluate(()=>{appSettings.language='en';showHub()});
  assert.equal(await page.locator('#modal h1').count(),0);
  assert.equal(await page.locator('#titleLogo').getAttribute('src'),'title-logo.png');
  await page.evaluate(()=>{appSettings.language='ko';showHub()});await page.click('#battle');
  const saves=await page.evaluate(()=>JSON.stringify(localStorage));
  for(const [width,height]of [[960,540],[640,360],[390,844]]){
   await page.setViewportSize({width,height});await page.click('#campaignMode');
   assert.equal(await page.evaluate(()=>appScreen),'battlefield');
   assert.equal(await page.locator('#cpCampaignIron').count(),0);
   assert(await page.locator('#modal').evaluate(e=>e.inert));
   const box=await page.locator('.campaignPickerBox').boundingBox();
   assert(box.width<=380&&box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height);
   assert(Math.abs(box.x+box.width/2-width/2)<1&&Math.abs(box.y+box.height/2-height/2)<1);
   await page.click('#mainCampaign');assert(await page.locator('#mainIntro').isVisible());
   await page.click('#mcSkip');assert(await page.locator('#mainCampaignSelection').isVisible());
   await page.click('#mcBack');await page.click('#campaignMode');
   await page.click('#subCampaign');assert(await page.locator('#cpCampaignIron').isVisible());
   await page.click('#cpCampaignIron');assert.equal(await page.locator('.cpMissionTile').count(),8);
   await page.evaluate(()=>{TerhaCampaign.close()});
  }
  for(const close of ['button','back','escape','outside']){
   await page.click('#campaignMode');
   if(close==='button')await page.click('#campaignPickerClose');
   if(close==='back')await page.evaluate(()=>window.terhaBack());
   if(close==='escape')await page.keyboard.press('Escape');
   if(close==='outside')await page.locator('#campaignPicker').click({position:{x:2,y:2}});
   assert.equal(await page.locator('#campaignPicker').count(),0);
   assert.equal(await page.evaluate(()=>appScreen),'battlefield');
   assert.equal(await page.locator('#modal').evaluate(e=>e.inert),false);
  }
  await page.evaluate(()=>{appSettings.language='en';showBattlefield()});await page.click('#campaignMode');
  assert.equal(await page.locator('#mainCampaign').textContent(),'MAIN CAMPAIGN');
  assert.equal(await page.locator('#subCampaign').textContent(),'SUB CAMPAIGN');
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'campaignPickerClose');
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'subCampaign');
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'campaignPickerClose');
  await page.keyboard.press('Escape');await page.click('#conquestMode');assert(await page.locator('#factions').isVisible());
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),saves);assert.deepEqual(errors,[]);
  console.log('PASS campaign picker: centered at three viewport sizes, both branches, main prologue and selection, subcampaign missions, all close controls, focus loop, English labels, conquest and unchanged saves');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
