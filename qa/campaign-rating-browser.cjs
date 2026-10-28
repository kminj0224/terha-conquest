'use strict';
const assert=require('node:assert/strict');
exports.deployment=async page=>{
 await page.locator('#cpOperationStart').waitFor();
 assert.equal(await page.evaluate(()=>TerhaCampaign.getView()),'deployment');
 assert.equal(await page.locator('.cpRatingTier').count(),3);
 assert(await page.evaluate(()=>!!activeScenario&&!campaignLoading&&CampaignBattle.ready()&&campaignRenderedFrames>0&&appScreen==='game'));
 assert.equal(await page.locator('.cpAwardBackdrop').count(),0);
 assert.equal(await page.locator('#campaignDefenseStatus').count(),0);
 const before=await page.evaluate(()=>({turn,army:JSON.stringify(units),loading:localStorage.getItem(CAMPAIGN_LOADING_ART_KEY)}));
 const limits=await page.evaluate(()=>{const id=TerhaCampaign.getState().mission;return CampaignRules.rules(id===1?IRON_CROWN_CAMPAIGN.battle:IRON_CROWN_CAMPAIGN['battle'+id])});assert.deepEqual(await page.locator('.cpRatingTier strong').allTextContents(),limits.map(n=>n+'턴 이내'));
 for(const [width,height]of [[640,360],[390,844],[960,540]]){
  await page.setViewportSize({width,height});const b=await page.locator('#cpOperationStart').boundingBox();
  assert(b&&b.x>=0&&b.y>=0&&b.x+b.width<=width+1&&b.y+b.height<=height+1,'Start check remains visible');
  const r=await page.locator('.cpAwardCard').boundingBox();assert(r&&r.width<=391&&r.height<310&&r.y>=0&&r.y+r.height<=height+1,'Compact card without scroll');
 }
 await page.screenshot({path:'qa/campaign-previews/review-rating-start.jpg',type:'jpeg',quality:85});
 await page.click('#cpOperationStart');
 assert.deepEqual(await page.evaluate(()=>({turn,army:JSON.stringify(units),loading:localStorage.getItem(CAMPAIGN_LOADING_ART_KEY)})),before,'Confirmation must not reload or recreate battle');
};
exports.result=async page=>{
 assert.equal(await page.locator('.cpResultStars .cpStar').count(),3);
 const info=await page.evaluate(()=>({turns:TerhaCampaign.getState().battle.turn,stars:CampaignRules.stars(TerhaCampaign.getState().battle.turn),best:CampaignRules.records()[TerhaCampaign.getState().mission]}));
 assert.equal(await page.locator('.cpResultStars .earned').count(),info.stars);
 assert.equal(await page.locator('.cpResultTurn strong').textContent(),String(info.turns));
 assert(info.best&&info.best.stars>=info.stars);
 for(const [width,height]of [[640,360],[390,844],[960,540]]){
  await page.setViewportSize({width,height});const r=await page.locator('#cpResultConfirm').boundingBox();assert(r&&r.y>=0&&r.y+r.height<=height+1);const card=await page.locator('.cpAwardCard').boundingBox();assert(card.width<=391&&card.height<310);
 }
 await page.screenshot({path:'qa/campaign-previews/review-rating-result.jpg',type:'jpeg',quality:85});
};
