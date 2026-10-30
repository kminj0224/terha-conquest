'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run,click,nodes}){
 let musicPosition=run('menuMusic.currentTime');
 assert.equal(run('appScreen'),'battlefield');
 const checkModeScreen=()=>{
  const modal=nodes.get('modal');
  assert.equal(modal.querySelectorAll('button').length,3,'Back plus exactly two mode choices');
  assert(!nodes.has('factions'),'Country list waits for conquest');
  for(const id of ['campaignMode','conquestMode']){
   const button=nodes.get(id);assert(button);
   assert.equal(button.children[0].tagName,'IMG');
   assert.equal(button.children[1].children.at(-1).textContent,run('appSettings.language')==='en'?'PLAY':'플레이');
  }
  assert(!modal.textContent.includes('이야기를 따라 전장으로'));
  assert(!modal.textContent.includes('국가를 선택하고 테르하를 정복하라'));
  assert(!modal.textContent.includes('→'));
  assert.equal(run('menuMusic.paused'),false);
  assert.equal(run('menuMusic.currentTime'),musicPosition,'Mode navigation preserves menu music');
 };
 checkModeScreen();
 await click('campaignMode');assert.equal(run('appScreen'),'battlefield');
 assert(nodes.has('campaignPicker'));assert.equal(nodes.get('modal').inert,true);
 assert.equal(nodes.get('mainCampaign').textContent,run('appSettings.language')==='en'?'MAIN CAMPAIGN':'메인캠페인');
 await click('mainCampaign');assert.equal(run('appScreen'),'mainIntro');assert.equal(run('MainCampaign.getPage()'),0);assert.equal(run('menuMusic.paused'),true);musicPosition=0;
 await click('mcSkip');assert(nodes.has('mainCampaignSelection'));await click('mcBack');
 await click('campaignMode');
 assert(!nodes.has('cpCampaignIron'));
 await click('subCampaign');assert.equal(run('appScreen'),'campaign');
 assert(!nodes.has('campaignPicker'));assert.equal(nodes.get('modal').inert,false);
 assert(!nodes.has('factions'));assert.equal(run('menuMusic.paused'),false);
 await click('appBack');assert.equal(run('appScreen'),'battlefield');checkModeScreen();
 await click('campaignMode');run('window.terhaBack()');assert.equal(run('appScreen'),'battlefield');
 await click('conquestMode');assert.equal(run('appScreen'),'country');
 await click('countryBack');assert.equal(run('appScreen'),'battlefield');checkModeScreen();
 await click('conquestMode');run('window.terhaBack()');assert.equal(run('appScreen'),'battlefield');
 run('window.terhaBack()');assert.equal(run('appScreen'),'hub');
 await click('battle');await click('battlefieldBack');assert.equal(run('appScreen'),'hub');
 run("appSettings.language='ko'");await click('battle');checkModeScreen();
 run("appSettings.language='en';showBattlefield()");checkModeScreen();
 console.log('PASS campaign branch picker, main prologue and selection, subcampaign library, battlefield: both PLAY labels, no subtitles/arrows, campaign placeholder, conquest/country, hardware and visible Back, Korean/English, menu music stops in main campaign and resumes on exit');
};
