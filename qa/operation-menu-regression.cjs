'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run,click,nodes}){
 run('operationMusic.currentTime=17');
 const plays=run('operationMusic.plays'),menuPlays=run('menuMusic.plays');
 const uninterrupted=label=>{
  assert.equal(run('operationMusicActive'),true,label+' keeps the operation session');
  assert.equal(run('operationMusic.paused'),false,label+' keeps music playing');
  assert.equal(run('operationMusic.currentTime'),17,label+' preserves playback position');
  assert.equal(run('operationMusic.plays'),plays,label+' does not restart playback');
  assert.equal(run('menuMusic.paused'),true,label+' suppresses title music');
  assert.equal(run('menuMusic.plays'),menuPlays,label+' never starts title music');
 };
 run('showMenu()');uninterrupted('Hamburger menu');
 await click('operationSettings');uninterrupted('Operation settings');
 nodes.get('musicVolume').oninput({target:{value:'25'}});
 assert.equal(run('operationMusic.volume'),.25);uninterrupted('Operation music slider');
 run('window.terhaBack()');uninterrupted('Returning from settings');
 await click('manualSave');uninterrupted('Save slots');
 await click('slotBack');uninterrupted('Returning from save slots');
 const leaving=nodes.get('leaveOperation').onclick();await Promise.resolve();
 assert(nodes.has('confirmNo'));uninterrupted('Exit confirmation before answering');
 await click('confirmNo');await leaving;uninterrupted('Declining exit');
 run("setAppScreen('game')");uninterrupted('Returning to map');
 console.log('PASS operation menu music: hamburger, settings, slider, slots and exit confirmation never pause/restart or play title music');
};
