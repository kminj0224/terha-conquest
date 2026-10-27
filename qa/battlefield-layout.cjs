'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/game/assets/index.html');
  await page.locator('#appStart:not([disabled])').waitFor();
  await page.click('#appStart');await page.click('#battle');
  fs.mkdirSync('qa/battlefield-previews',{recursive:true});
  for(const [width,height]of [[1440,810],[800,360],[640,360],[390,844]]){
   await page.setViewportSize({width,height});
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.modeIllustration')].map(e=>e.decode()))});
   const actual=await page.evaluate(()=>({labels:[...document.querySelectorAll('.modePlay')].map(e=>e.textContent),rects:[...document.querySelectorAll('.battlefieldMode')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}}),overflow:document.getElementById('modal').scrollWidth>innerWidth,text:document.getElementById('modal').textContent}));
   assert.deepEqual(actual.labels,['플레이','플레이']);assert.equal(actual.overflow,false);
   assert(actual.rects.every(r=>r.height>=200&&r.bottom<=height),JSON.stringify(actual.rects));
   assert(!actual.text.includes('→'));assert(!actual.text.includes('이야기를 따라'));assert(!actual.text.includes('국가를 선택하고'));
   await page.screenshot({path:'qa/battlefield-previews/battlefield-'+width+'.png'});
   console.log('PASS battlefield layout '+width+'x'+height);
  }
  await page.click('#conquestMode');await page.locator('#factions').waitFor();
  await page.click('#countryBack');await page.click('#campaignMode');
  await page.locator('.campaignEmpty').waitFor();await page.evaluate(()=>window.terhaBack());
  await page.locator('#conquestMode').waitFor();assert.deepEqual(errors,[]);
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
