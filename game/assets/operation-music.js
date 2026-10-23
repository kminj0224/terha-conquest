'use strict';
const OPERATION_MUSIC_TRACKS=[
 {src:'operation-music-1.mp3',name:'Shadow Pulse'},
 {src:'operation-last-light.mp3',name:'Last light'},
 {src:'operation-ghost-trail.mp3',name:'유령의 등산로'},
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
 return operationMusicActive&&started&&!appFront()&&!campaignLoading&&!document.hidden&&appSettings.music>0;
}
function syncOperationMusic(){
 if(operationMusicActive&&appFront())stopOperationMusic();
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
// Operation overlays are part of the same music session, including settings.
const operationAppUsesMenuMusic=appUsesMenuMusic;
appUsesMenuMusic=function(){return !operationMusicActive&&operationAppUsesMenuMusic()};
const operationApplyAppAudio=applyAppAudio;
// End the operation session before deciding whether front-screen music can start.
applyAppAudio=function(){syncOperationMusic();operationApplyAppAudio()};
document.addEventListener('visibilitychange',()=>syncOperationMusic());
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


