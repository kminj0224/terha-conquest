'use strict';
const assert=require('node:assert/strict');
module.exports=async function(page){
 const original=await page.evaluate(()=>localStorage.getItem(TerhaCampaign.storageKey));
 await page.evaluate(()=>TerhaCampaign.open());
 assert.equal(await page.locator('.cpCampaignBanner').count(),8);
 assert.equal(await page.locator('.cpEmptyBanner').count(),7);
 for(const [width,height] of [[960,540],[640,360],[390,844]]){
  await page.setViewportSize({width,height});
  assert(await page.locator('#cpCampaignIron').isVisible());
  const boxes=await page.locator('.cpCampaignBanner').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width}}));
  assert(boxes.every(r=>r.x>=0&&r.x+r.w<=width+1));
  if(width===960){assert.equal(boxes[0].y,boxes[2].y);assert(boxes[3].y>boxes[0].y)}
 }
 await page.setViewportSize({width:960,height:540});
 await page.screenshot({path:'qa/campaign-previews/review-library.jpg',type:'jpeg',quality:80});
 await page.click('#cpCampaignIron');
 assert.equal(await page.locator('.cpMissionTile').count(),8);
 assert(await page.locator('#cpMission1').isEnabled());
 for(let n=3;n<=8;n++)assert(await page.locator('#cpMission'+n).isDisabled());
 for(const [width,height] of [[960,540],[640,360]]){
  await page.setViewportSize({width,height});
  for(const b of await page.locator('.cpMissionTile').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})))assert(b.x>=0&&b.y>=0&&b.x+b.w<=width+1&&b.y+b.h<=height+1);
 }
 await page.setViewportSize({width:960,height:540});
 await page.screenshot({path:'qa/campaign-previews/review-missions.jpg',type:'jpeg',quality:80});
 await page.click('#cpMission1');
 assert.equal(await page.evaluate(()=>TerhaCampaign.getView()),'briefing');
 assert.equal(await page.locator('.cpVN').count(),0);
 assert((await page.evaluate(()=>TerhaCampaign.getState().completed)).includes(1));
 await page.click('#cpLaunch');assert.equal(await page.evaluate(()=>TerhaCampaign.getView()),'intro');
 await page.evaluate(()=>TerhaCampaign.back());
 await page.click('#cpMission2');
 assert.equal(await page.evaluate(()=>TerhaCampaign.getView()),'briefing');
 assert.equal(await page.evaluate(()=>TerhaCampaign.getState().battle),null,'Mission card opens a fresh briefing');
 await page.click('#cpResumeMission');await page.waitForFunction(()=>activeScenario?.id==='iron-crown-m02'&&!campaignLoading);
 assert(await page.evaluate(()=>!!TerhaCampaign.getState().battle),'Explicit Continue restores the other mission');
 await page.evaluate(original=>{if(activeScenario)CampaignBattle.leave();localStorage.setItem(TerhaCampaign.storageKey,original);TerhaCampaign.open()},original);
 console.log('PASS campaign library: seven empty banners, eight mission cards, responsive layout, locked future missions, completed replay, briefing before VN and other mission save retained');
};
