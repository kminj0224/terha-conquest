'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const assets='game/assets/',created=[];
class AudioStub{
 constructor(src){this.src=src;this.paused=true;this.currentTime=0;created.push(this)}
 play(){this.paused=false;return Promise.resolve()}
 pause(){this.paused=true}
}
const b={Audio:AudioStub};b.window=b;vm.createContext(b);
for(const file of ['operation-music-data.js','game-music.js'])vm.runInContext(fs.readFileSync(assets+file,'utf8'),b);
const run=code=>vm.runInContext(code,b);
const tracks=run('Object.keys(OPERATION_MUSIC_DATA)');
assert.equal(tracks.length,7);
for(const name of tracks){
 const embedded=Buffer.from(run(`OPERATION_MUSIC_DATA[${JSON.stringify(name)}].data`),'base64');
 assert.equal(crypto.createHash('sha256').update(embedded).digest('hex'),crypto.createHash('sha256').update(fs.readFileSync(assets+name)).digest('hex'),name);
}
(async()=>{
 const player=run("createGameMusic('menu-music.mp3')");
 player.volume=.25;player.loop=true;player.preload='none';player.pause();
 assert.equal(created.length,0,'Unused fallback must not create a media element');
 await player.play();assert.equal(created.length,1);assert.equal(player.paused,false);
 const audio=created[0];assert.equal(audio.volume,.25);assert.equal(audio.loop,true);assert.equal(audio.preload,'none');
 assert(audio.src.startsWith('data:audio/mpeg;base64,'));
 assert.deepEqual(Buffer.from(audio.src.split(',')[1],'base64'),fs.readFileSync(assets+'menu-music.mp3'));
 player.currentTime=17;player.pause();assert.equal(player.currentTime,17);assert(player.paused);
 await player.play();assert.equal(player.currentTime,17);assert.equal(created.length,1);
 player.volume=.8;player.loop=false;assert.equal(audio.volume,.8);assert.equal(audio.loop,false);
 let ends=0;player.onended=()=>ends++;audio.onended();assert.equal(ends,1);player.onended=null;audio.onended();assert.equal(ends,1);
 for(const name of tracks){player.src=name;assert.equal(player.src,name);assert(player.paused);assert.deepEqual(Buffer.from(audio.src.split(',')[1],'base64'),fs.readFileSync(assets+name));await player.play();player.pause()}
 // A supported device uses the existing decoder without creating any Audio element.
 b.AudioContext=class {};
 assert.equal(run("createGameMusic('menu-music.mp3') instanceof GameMusicPlayer"),true);
 const before=created.length,legacy=run("new EmbeddedMusicAudio('operation-music-1.mp3')");legacy.pause();legacy.currentTime=0;legacy.preload='none';
 assert.equal(created.length,before,'Inactive legacy operation path must remain lazy');
 console.log('PASS seven byte-identical music payloads, lazy embedded fallback, playlist source changes, loop/volume/seek, pause/resume and completion callbacks');
})().catch(error=>{console.error(error);process.exitCode=1});
