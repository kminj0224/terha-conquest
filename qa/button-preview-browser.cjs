'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {chromium} = require('playwright');
const out = path.resolve(__dirname,'button-previews');
const server = spawn('python3',['-m','http.server','8766','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});
const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
  let browser;
  try {
    fs.mkdirSync(out,{recursive:true});
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await pause(700);
    const origin='http://127.0.0.1:8766/game/assets/index.html';
    for (const theme of ['silver','dark']) {
      await page.goto(origin+'?button-preview='+theme);
      await page.locator('#appStart:not([disabled])').waitFor({timeout:90000});
      await page.click('#appStart');
      await page.waitForFunction(()=>document.fonts.status==='loaded');
      await page.evaluate(async()=>{await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})))});
      await page.screenshot({path:path.join(out,theme+'-hub.png')});
      await page.click('#battle');await page.click('#conquestMode');
      await page.screenshot({path:path.join(out,theme+'-country.png')});
      assert.equal(await page.locator('#start').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(173, 45, 53)');
      await page.click('#start');
      await page.waitForFunction(()=>appScreen==='game'&&!campaignLoading,{},{timeout:90000});
      await page.evaluate(()=>{const city=cities.find(c=>c.origin===player&&c.capital),p=pxy(city.tile);cam.x=p.x;cam.y=p.y-70;cam.z=1.1;selectCity(city,true)});
      await pause(1200);
      const turn=await page.locator('#turn').evaluate(e=>{const s=getComputedStyle(e);return {bg:s.backgroundColor,r:s.borderRadius,b:s.borderTopWidth}});
      assert.deepEqual(turn,{bg:'rgb(173, 45, 53)',r:'0px',b:'0px'});
      assert.equal(await page.locator('#next').evaluate(e=>getComputedStyle(e).backgroundColor),theme==='silver'?'rgb(217, 221, 225)':'rgb(53, 56, 61)');
      await page.screenshot({path:path.join(out,theme+'-game.png')});
      // Same live game, same city and controls, then open the existing operation menu.
      await page.click('#menu');await page.screenshot({path:path.join(out,theme+'-menu.png')});
      console.log('PASS actual UI rendering:',theme);
    }
    await page.goto(origin);await page.locator('#appStart:not([disabled])').waitFor({timeout:90000});
    assert.equal(await page.evaluate(()=>document.body.hasAttribute('data-button-preview')),false);
    assert.deepEqual(errors,[]);
    console.log('PASS opt-in styles, original screen navigation, production/city selection, unchanged default UI; screenshots are Chromium page.screenshot output');
  } finally {await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1});
