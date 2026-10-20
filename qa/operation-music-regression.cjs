'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
for(const entry of require('./operation-music-files.json'))assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.resolve(__dirname,'../game/assets',entry.file))).digest('hex'),entry.sha256,'Original MP3 bytes changed: '+entry.file);
let clock=0,nextTimer=1,finishLoading,failLoading=false;
const timers=new Map();
class AudioStub{
 constructor(src){this.src=src;this.paused=true;this.currentTime=0;this.plays=0}
 play(){this.paused=false;this.plays++;return Promise.resolve()}
 pause(){this.paused=true}
}
const b={Audio:AudioStub,started:true,appScreen:'game',campaignLoading:false,appSettings:{music:.65},
 document:{hidden:false,addEventListener(){}},performance:{now:()=>clock},
 setTimeout:(fn,ms)=>{const id=nextTimer++;timers.set(id,{fn,at:clock+ms});return id},clearTimeout:id=>timers.delete(id),
 appFront:()=>['title','hub','country'].includes(b.appScreen),applyAppAudio(){},
 runCampaignLoading:async()=>{b.campaignLoading=true;await new Promise(r=>finishLoading=r);b.campaignLoading=false;return !failLoading}
};
vm.createContext(b);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../game/assets/operation-music.js'),'utf8'),b);
const run=s=>vm.runInContext(s,b),audio=run('operationMusic');
function tick(ms){clock+=ms;for(const [id,t]of [...timers])if(t.at<=clock){timers.delete(id);t.fn()}}
function ended(){audio.paused=true;audio.onended()}
(async()=>{
 b.applyAppAudio();assert.equal(audio.plays,0,'Must not start before loading completes');
 const loading=b.runCampaignLoading();assert.equal(b.campaignLoading,true);assert.equal(audio.plays,0);
 assert.equal(await b.runCampaignLoading(),false,'Duplicate loading must not reset the active loader');
 finishLoading();assert.equal(await loading,true);assert.equal(audio.src,'operation-music-1.mp3');assert.equal(audio.paused,false);
 assert.equal(audio.plays,1,'First track starts immediately after map loading');
 assert.equal(run('OPERATION_MUSIC_TRACKS.map(t=>t.name).join("|")'),'Shadow Pulse|Tension Rising|War-Drum Pulse|Marcha de Tensión|Lopsided Pulse');
 for(const next of [2,3,4,5,1]){
  ended();b.applyAppAudio();b.applyAppAudio();assert.equal(timers.size,1,'One gap timer only');
  const before=audio.plays;tick(3999);assert.equal(audio.plays,before,'No early next track');
  tick(1);assert.equal(audio.src,`operation-music-${next}.mp3`);assert.equal(audio.plays,before+1);
 }
 audio.currentTime=17;b.appScreen='menu';b.applyAppAudio();assert.equal(audio.paused,true);
 b.appScreen='game';b.applyAppAudio();assert.equal(audio.currentTime,17,'Resume without restarting track');
 b.appSettings.music=.2;b.applyAppAudio();assert.equal(audio.volume,.2);
 b.appSettings.music=0;b.applyAppAudio();assert.equal(audio.paused,true);
 b.appSettings.music=.65;b.applyAppAudio();assert.equal(audio.paused,false);
 ended();tick(1000);b.document.hidden=true;b.applyAppAudio();assert.equal(timers.size,0);
 tick(10000);b.document.hidden=false;b.applyAppAudio();tick(2999);assert.equal(audio.src,'operation-music-1.mp3');
 tick(1);assert.equal(audio.src,'operation-music-2.mp3','Resume remaining gap after background');
 ended();b.appScreen='hub';b.applyAppAudio();const stoppedPlays=audio.plays;
 assert.equal(timers.size,0);assert.equal(audio.paused,true);assert.equal(audio.currentTime,0);assert.equal(audio.src,'operation-music-1.mp3');
 tick(10000);audio.onended();assert.equal(timers.size,0);assert.equal(audio.plays,stoppedPlays,'Exit cancels all future tracks');
 b.appScreen='game';const restart=b.runCampaignLoading();finishLoading();await restart;
 assert.equal(audio.src,'operation-music-1.mp3');assert.equal(audio.paused,false,'New operation starts at first track');
 const failure=b.runCampaignLoading();failLoading=true;finishLoading();assert.equal(await failure,false);assert.equal(audio.paused,true);assert.equal(run('operationMusicActive'),false);
 console.log('PASS operation music: map-ready start, upload order, 4000ms gaps, wraparound, volume, menu/background resume, exit cancellation and failed loads');
})().catch(e=>{console.error(e);process.exitCode=1});
