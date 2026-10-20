'use strict';
const OPERATION_MUSIC_TRACKS=[
 {src:'operation-music-1.mp3',name:'Shadow Pulse'},
 {src:'operation-music-2.mp3',name:'Tension Rising'},
 {src:'operation-music-3.mp3',name:'War-Drum Pulse'},
 {src:'operation-music-4.mp3',name:'Marcha de Tensión'},
 {src:'operation-music-5.mp3',name:'Lopsided Pulse'}
];
const OPERATION_MUSIC_GAP=4000;
const operationMusic=new Audio(OPERATION_MUSIC_TRACKS[0].src);
operationMusic.preload='auto';operationMusic.loop=false;
let operationMusicActive=false,operationMusicIndex=0,operationMusicWaiting=false;
let operationMusicTimer=null,operationMusicRemaining=0,operationMusicDeadline=0;
function pauseOperationMusic(){
 operationMusic.pause();
 if(operationMusicTimer!==null){
  operationMusicRemaining=Math.max(0,operationMusicDeadline-performance.now());
  clearTimeout(operationMusicTimer);operationMusicTimer=null;
 }
}
function stopOperationMusic(){
 pauseOperationMusic();operationMusicActive=false;operationMusicIndex=0;
 operationMusicWaiting=false;operationMusicRemaining=0;
 if(operationMusic.src.split('/').pop()!==OPERATION_MUSIC_TRACKS[0].src)operationMusic.src=OPERATION_MUSIC_TRACKS[0].src;
 try{operationMusic.currentTime=0}catch{}
}
function operationMusicWanted(){
 return operationMusicActive&&started&&appScreen==='game'&&!campaignLoading&&!document.hidden&&appSettings.music>0;
}
function syncOperationMusic(){
 if(operationMusicActive&&(appFront()||appScreen==='result'))stopOperationMusic();
 operationMusic.volume=appSettings.music;
 if(!operationMusicWanted()){pauseOperationMusic();return}
 if(operationMusicWaiting){
  if(operationMusicTimer===null){
   operationMusicDeadline=performance.now()+operationMusicRemaining;
   operationMusicTimer=setTimeout(()=>{
    operationMusicTimer=null;
    if(!operationMusicWanted()){operationMusicRemaining=0;return}
    operationMusicWaiting=false;operationMusicRemaining=0;
    operationMusicIndex=(operationMusicIndex+1)%OPERATION_MUSIC_TRACKS.length;
    operationMusic.src=OPERATION_MUSIC_TRACKS[operationMusicIndex].src;
    syncOperationMusic();
   },operationMusicRemaining);
  }
  return;
 }
 if(operationMusic.paused)operationMusic.play()?.catch(()=>{});
}
operationMusic.onended=function(){
 if(!operationMusicActive||operationMusicWaiting)return;
 operationMusicWaiting=true;operationMusicRemaining=OPERATION_MUSIC_GAP;
 syncOperationMusic();
};
const operationApplyAppAudio=applyAppAudio;
applyAppAudio=function(){operationApplyAppAudio();syncOperationMusic()};
document.addEventListener('visibilitychange',syncOperationMusic);
// The loading cover is removed only after the map has rendered successfully.
const operationRunCampaignLoading=runCampaignLoading;
runCampaignLoading=async function(...args){
 if(campaignLoading)return false;
 stopOperationMusic();
 const ok=await operationRunCampaignLoading(...args);
 if(ok!==false&&started&&appScreen==='game'){
  operationMusicActive=true;syncOperationMusic();
 }
 return ok;
};
