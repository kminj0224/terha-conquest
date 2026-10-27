'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run,click,nodes}){
 const musicPosition=run('menuMusic.currentTime');
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
 await click('campaignMode');assert.equal(run('appScreen'),'campaign');
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
 console.log('PASS battlefield: both PLAY labels, no subtitles/arrows, campaign placeholder, conquest/country, hardware and visible Back, Korean/English, uninterrupted music');
};
