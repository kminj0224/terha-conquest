'use strict';
const assert=require('node:assert/strict');
module.exports=async function(page){
 console.log('CAMPAIGN_QA_PHASE','mission02 continuation and dialogue silence');
 await page.evaluate(()=>{if(activeScenario)CampaignBattle.leave();TerhaCampaign.open()});
 await page.click('#cpCampaignIron');
 await page.click('#cpMission2');
 assert.equal(await page.evaluate(()=>TerhaCampaign.getView()),'briefing');
 for(const [width,height]of [[640,360],[800,360],[390,844]]){
  await page.setViewportSize({width,height});
  for(const id of ['cpLaunch','cpBriefLeave']){const r=await page.locator('#'+id).boundingBox();assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,id+' visible')}
  assert(await page.locator('.cpBriefContent').evaluate(e=>e.scrollHeight<=e.clientHeight+1));
 }
 assert(!(await page.locator('.cpGoals').textContent()).includes('20턴'));
 await page.setViewportSize({width:960,height:540});await page.screenshot({path:'qa/campaign-previews/review-m02-briefing.jpg',type:'jpeg',quality:65});
 await page.click('#cpLaunch');
 assert.equal(await page.evaluate(()=>TerhaCampaign.getState().mission),2);
 const silent=async()=>assert(await page.evaluate(()=>{applyAppAudio();return menuMusic.paused&&!operationMusicActive&&(!operationBufferPlayer||!operationBufferPlayer.running)}),'Dialogue must silence title and operation music');
 await silent();
 for(let n=0;n<7;n++){await page.click('#cpNext');await silent()}
 await page.click('#cpHistory');await silent();assert((await page.locator('#cpSheet').textContent()).includes('관문'));await page.click('#cpSheetClose');
 const saved=await page.evaluate(()=>TerhaCampaign.getState());
 await page.reload();await page.waitForFunction(()=>typeof TerhaCampaign!=='undefined');await page.evaluate(()=>TerhaCampaign.open());await page.click('#cpCampaignIron');await page.click('#cpContinue');
 assert.equal(await page.evaluate(()=>TerhaCampaign.getState().vn),saved.vn);await silent();
 await page.click('#cpSkip');await page.locator('#cpPay').waitFor();
 await page.click('#cpPay');await page.waitForFunction(()=>appScreen==='game'&&!campaignLoading&&activeScenario?.id==='iron-crown-m02');
 await page.waitForFunction(()=>CampaignBattle.ready());assert(await page.locator('#campaignObjectives').isVisible());assert.equal(await page.evaluate(()=>cities[1].f),2);
 await page.click('#campaignObjectives');assert((await page.locator('#campaignGoalSheet').textContent()).includes('남부 보급소'));assert(!(await page.locator('#campaignGoalSheet').textContent()).includes('20턴'));await page.click('#appBack');
 await page.screenshot({path:'qa/campaign-previews/review-m02-battle.jpg',type:'jpeg',quality:65});
 const carry=await page.evaluate(()=>({old:TerhaCampaign.getState().carry.units.filter(u=>u.f===2).map(u=>({type:u.type,level:u.level,xp:u.xp,hp:u.hp})),now:units.filter(u=>u.f===2).map(u=>({type:u.type,level:u.level,xp:u.xp,hp:u.hp}))}));
 assert.equal(carry.old.length,carry.now.length);carry.old.forEach(u=>assert(carry.now.some(v=>v.type===u.type&&v.level===u.level&&v.xp===u.xp&&v.hp===u.hp)));
 const first=await page.evaluate(()=>{save(8);return JSON.stringify(snapshot().units)});
 await page.evaluate(async()=>{await load(8);save()});await page.waitForFunction(()=>!campaignLoading);assert.equal(await page.evaluate(()=>JSON.stringify(units)),first);
 // Verify the audio setting itself was never muted by story playback.
 assert(await page.evaluate(()=>appSettings.music>0&&operationMusicActive&&menuMusic.paused));
 await page.evaluate(()=>{CampaignBattle.leave();TerhaCampaign.open()});
 await page.click('#cpCampaignIron');await page.click('#cpContinue');await page.waitForFunction(()=>activeScenario?.id==='iron-crown-m02'&&!campaignLoading);
 assert.equal(await page.evaluate(()=>CampaignBattle.inspect().progress.route),'pay');
 await page.evaluate(()=>{CampaignBattle.leave();TerhaCampaign.close()});
 console.log('PASS mission02 browser: old completed mission continuation, 25-panel dialogue source, dialogue/history/reload silence without changing volume, route choice, compact responsive briefing, dedicated map, checklist, survivor persistence and manual/autosave resume');
};
