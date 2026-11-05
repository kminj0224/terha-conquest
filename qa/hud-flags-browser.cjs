'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8791','--bind','127.0.0.1'],{cwd:process.env.TERHA_TEST_ROOT||path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:960,height:540}}),errors=[],missing=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.request().resourceType()==='image'&&r.status()>=400)missing.push(r.url())});
  await page.goto('http://127.0.0.1:8791/game/assets/index.html');await page.locator('#appStart:not([disabled])').waitFor();
  await page.evaluate(()=>{player=0;setup();started=true;setAppScreen('game');updateHUD()});
  const suffix=process.env.TERHA_TEST_ROOT?'webp':'png';
  fs.mkdirSync('qa/campaign-previews',{recursive:true});
  for(let f=0;f<8;f++){
   await page.evaluate(f=>{player=f;setAppScreen('game');updateHUD()},f);
   const expected=`flag-${f}.${f===7?'jpg':[3,6].includes(f)?'svg':suffix}`;
   const hud=page.locator('#resources .hudCountry img');
   assert.equal(await hud.getAttribute('src'),expected);
   await hud.evaluate(async e=>{await e.decode();if(!e.naturalWidth)throw Error('HUD flag failed to decode')});
   assert((await hud.boundingBox()).width>0);
   if(f===0)await page.screenshot({path:'qa/campaign-previews/fixed-baekyang-hud.png'});
   await page.evaluate(()=>showMenu());const menu=page.locator('.operationNation img');
   assert.equal(await menu.getAttribute('src'),expected);await menu.evaluate(e=>e.decode());
  }
  await page.evaluate(()=>showStart());assert.equal(await page.locator('#factions .choiceFlag').count(),8);
  for(const image of await page.locator('#factions .choiceFlag').all())await image.evaluate(e=>e.decode());
  assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);
  console.log('PASS all eight national flags: actual HUD and operation menu URLs, visible decoded images, country selection and no failed image responses');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
