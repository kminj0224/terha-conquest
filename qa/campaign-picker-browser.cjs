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
  assert.equal(await page.locator('#modal h1').textContent(),'테르하 : 낙원의 기억');
  await page.click('#appStart');
  assert.equal(await page.locator('#modal h1').textContent(),'테르하 : 낙원의 기억');
  await page.evaluate(()=>{appSettings.language='en';showHub()});
  assert.equal(await page.locator('#modal h1').textContent(),'TERHA: MEMORIES OF PARADISE');
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
