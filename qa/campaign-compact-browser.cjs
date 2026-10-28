'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8771','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:800,height:360}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__gateEvents=[];let last=null;
   new MutationObserver(()=>{
    const node=document.getElementById('cpOperationStart');
    if(node&&node!==last){last=node;window.__gateEvents.push({loading:campaignLoading,map:CampaignBattle.ready(),frames:campaignRenderedFrames,scenario:activeScenario?.id})}
   }).observe(document,{childList:true,subtree:true});
  });
  await page.goto('http://127.0.0.1:8771/game/assets/index.html');await page.locator('#appStart:not([disabled])').waitFor();
  await page.click('#appStart');await page.click('#battle');await page.click('#campaignMode');await page.click('#cpCampaignIron');await page.click('#cpMission1');await page.click('#cpLaunch');await page.click('#cpSkip');await page.locator('#cpOperationStart').waitFor();
  let event=await page.evaluate(()=>window.__gateEvents.at(-1));assert(event&&!event.loading&&event.map&&event.frames>0&&event.scenario==='iron-crown-m01','Loading and map rendering must precede the card');
  const before=await page.evaluate(()=>({turn,units:JSON.stringify(units)}));
  await page.evaluate(()=>{window.terhaBackground();window.terhaForeground()});
  assert.equal(await page.evaluate(()=>TerhaCampaign.getState().phase),'deployment');
  await page.reload();await page.locator('#appStart:not([disabled])').waitFor();await page.evaluate(()=>TerhaCampaign.open());await page.click('#cpCampaignIron');await page.click('#cpContinue');await page.locator('#cpOperationStart').waitFor();
  assert.deepEqual(await page.evaluate(()=>({turn,units:JSON.stringify(units)})),before);
  event=await page.evaluate(()=>window.__gateEvents.at(-1));assert(event&&!event.loading&&event.map&&event.frames>0);
  fs.mkdirSync('qa/campaign-previews',{recursive:true});
  await page.screenshot({path:'qa/campaign-previews/compact-map-start-800.png'});
  await page.evaluate(()=>{window.__battleStarts=0;const start=CampaignBattle.start;CampaignBattle.start=(...args)=>{window.__battleStarts++;return start(...args)}});
  await require('./campaign-rating-browser.cjs').deployment(page);assert.equal(await page.evaluate(()=>window.__battleStarts),0);
  await page.evaluate(()=>{turn=3;CampaignBattle.complete(true)});await page.locator('#cpResultConfirm').waitFor();await require('./campaign-rating-browser.cjs').result(page);
  await page.setViewportSize({width:800,height:360});await page.screenshot({path:'qa/campaign-previews/compact-result-800.png'});
  assert.deepEqual(errors,[]);console.log('PASS compact rating: loader/map rendering before card, no left box, background save and gate reload preserve prepared battle, one-check dismissal without second start/loading, small start/result cards and visible controls in landscape/portrait');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
