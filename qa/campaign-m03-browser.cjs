'use strict';
const assert=require('node:assert/strict');
module.exports=async function(page){
 console.log('CAMPAIGN_QA_PHASE','mission03 briefing, story, priorities and saves');
 await page.evaluate(()=>{if(activeScenario)CampaignBattle.leave();const r=TerhaCampaign.getState();r.completed=[1,2];r.phase='won';r.battle.missionProgress.result='won';localStorage.setItem(TerhaCampaign.storageKey,JSON.stringify(r));TerhaCampaign.open()});
 await page.click('#cpCampaignIron');assert(await page.locator('#cpMission3').isEnabled());
 for(let id=4;id<=8;id++)assert(await page.locator('#cpMission'+id).isDisabled());
 await page.click('#cpMission3');assert.equal(await page.evaluate(()=>TerhaCampaign.getView()),'briefing');assert.equal(await page.locator('.cpVN').count(),0);
 for(const [width,height]of [[640,360],[800,360],[390,844]]){
  await page.setViewportSize({width,height});
  for(const id of ['cpLaunch','cpBriefLeave']){const r=await page.locator('#'+id).boundingBox();assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1)}
  assert(await page.locator('.cpBriefContent').evaluate(e=>e.scrollHeight<=e.clientHeight+1));
 }
 await page.setViewportSize({width:960,height:540});await page.screenshot({path:'qa/campaign-previews/review-m03-briefing.jpg',type:'jpeg',quality:80});
 await page.click('#cpLaunch');
 for(let n=0;n<25;n++){
  assert(await page.evaluate(()=>{applyAppAudio();return menuMusic.paused&&!operationMusicActive&&(!operationBufferPlayer||!operationBufferPlayer.running)}));
  const p=page.locator('img.cpPortrait');if(await p.count()){assert((await p.getAttribute('src')).endsWith('-v3.webp'));await p.evaluate(e=>e.decode())}
  if(n===6)await page.screenshot({path:'qa/campaign-previews/review-m03-vn.jpg',type:'jpeg',quality:80});
  await page.click('#cpNext');
 }
 await page.locator('#cpTroops').waitFor();await page.click('#cpCargo');
 await page.waitForFunction(()=>activeScenario?.id==='iron-crown-m03'&&!campaignLoading);
 assert(await page.evaluate(()=>CampaignBattle.ready()&&CampaignBattle.valid(snapshot())));
 assert.equal(await page.evaluate(()=>saveKey()),'terha-campaign-iron-crown-m03-v2');
 const expected=await page.evaluate(()=>IRON_CROWN_CAMPAIGN.battle3.friendly.length+1);assert.equal(await page.evaluate(()=>units.filter(u=>u.f===2).length),expected);
 await page.click('#campaignObjectives');assert((await page.locator('#campaignGoalSheet').textContent()).includes('5턴'));await page.click('#appBack');
 await page.evaluate(()=>{const p=pxy(cities[1].tile);cam.x=p.x;cam.y=p.y;cam.z=.85;CampaignBattle.constrainCamera()});
 await page.screenshot({path:'qa/campaign-previews/review-m03-battle.jpg',type:'jpeg',quality:80});
 const before=await page.evaluate(()=>{save(8);return JSON.stringify(snapshot().units)});
 await page.evaluate(()=>load(8));assert.equal(await page.evaluate(()=>JSON.stringify(units)),before);
 await page.reload();await page.waitForFunction(()=>typeof TerhaCampaign!=='undefined');await page.evaluate(()=>TerhaCampaign.open());await page.click('#cpCampaignIron');await page.click('#cpContinue');await page.waitForFunction(()=>activeScenario?.id==='iron-crown-m03'&&!campaignLoading);
 assert.equal(await page.evaluate(()=>CampaignBattle.inspect().progress.route),'cargo');assert(await page.evaluate(()=>appSettings.music>0));
 await page.evaluate(()=>{CampaignBattle.leave();TerhaCampaign.close()});
 console.log('PASS mission03 browser: completed mission02 unlock, briefing before 25-panel silent VN, three new character costumes, cargo route, responsive briefing, native battle HUD/goals, carry and manual/reload persistence');
};
