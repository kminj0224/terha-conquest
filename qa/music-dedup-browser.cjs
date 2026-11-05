'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
// Use the actual staged release scripts without providing standalone MP3 files.
(async()=>{
 const root=path.resolve(process.env.TERHA_TEST_ROOT||'.','game/assets');
 const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage(),requests=[],errors=[];
  page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.abort());
  await page.setContent('<button id="play">play</button>');
  for(const file of ['operation-music-data.js','game-music.js'])await page.addScriptTag({content:fs.readFileSync(path.join(root,file),'utf8')});
  const result=await page.evaluate(async()=>{
   const normal=createGameMusic('menu-music.mp3');normal.loop=true;normal.volume=.2;
   await normal.play();if(normal.paused||normal.node?.loop!==true)throw Error('Web Audio menu did not play');
   normal.currentTime=12;normal.pause();await normal.play();if(normal.currentTime<12)throw Error('Web Audio position reset');normal.pause();await normal.context.close();
   // The legacy operation placeholder must not create any HTML media element.
   const placeholder=new EmbeddedMusicAudio('operation-music-1.mp3');placeholder.pause();placeholder.preload='none';
   if(placeholder.audio!==null)throw Error('Inactive operation media element created');
   // Force the no-Web-Audio factory branch, then play every embedded track.
   window.AudioContext=undefined;window.webkitAudioContext=undefined;
   const fallback=createGameMusic('menu-music.mp3');fallback.volume=.3;fallback.loop=true;
   const durations={};
   for(const name of Object.keys(OPERATION_MUSIC_DATA)){
    fallback.src=name;await fallback.play();
    if(!fallback.audio.src.startsWith('data:audio/mpeg;base64,')||fallback.paused)throw Error('Fallback did not play '+name);
    if(!Number.isFinite(fallback.audio.duration)||fallback.audio.duration<=30)throw Error('Invalid decoded duration '+name);
    durations[name]=fallback.audio.duration;
    fallback.currentTime=10;fallback.pause();await fallback.play();
    if(fallback.currentTime<9.9||fallback.audio.volume!==.3||!fallback.audio.loop)throw Error('Fallback state reset '+name);
    fallback.pause();
   }
   fallback.audio.removeAttribute('src');fallback.audio.load();
   return durations;
  });
  assert.deepEqual(requests,[],'Music must work without fetching MP3s or any other resource');assert.deepEqual(errors,[]);
  console.log('PASS actual Chromium Web Audio and no-Web-Audio fallback, seven original tracks, offline playback, loop/volume/seek and resume:',result);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
