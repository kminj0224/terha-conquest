'use strict';
// Schedule decoded PCM on the audio thread. Rendering/AI timers cannot stretch
// a transition, and the next song is ready before the current song finishes.
class OperationBufferPlayer{
 constructor(){this.context=null;this.gain=null;this.cache=new Map();this.loading=new Map();this.nodes=[];this.generation=0;this.starting=false;this.running=false;this.error=null}
 ensure(){
  if(!this.context){const AudioContext=window.AudioContext||window.webkitAudioContext;this.context=new AudioContext();this.gain=this.context.createGain();this.gain.connect(this.context.destination)}
  return this.context;
 }
 async load(index){
  if(this.cache.has(index))return this.cache.get(index);
  if(this.loading.has(index))return this.loading.get(index);
  const context=this.ensure(),entry=OPERATION_MUSIC_DATA[OPERATION_MUSIC_TRACKS[index].src];
  const job=(async()=>{
   const binary=atob(entry.data),bytes=new Uint8Array(binary.length);
   for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   const buffer=await context.decodeAudioData(bytes.buffer);
   const clip={buffer,start:entry.start,end:Math.min(entry.end,buffer.duration)};
   if(clip.end<=clip.start)throw Error('Empty operation music clip');
   this.cache.set(index,clip);return clip;
  })();
  this.loading.set(index,job);
  try{return await job}finally{this.loading.delete(index)}
 }
 prepare(){return Promise.all([this.load(0),this.load(1)])}
 async append(index,at,generation){
  const clip=await this.load(index);
  if(generation!==this.generation||!operationMusicActive)return;
  const context=this.context,node=context.createBufferSource(),duration=clip.end-clip.start;
  node.buffer=clip.buffer;node.connect(this.gain);
  const item={node,index,start:at,end:at+duration};this.nodes.push(item);
  node.onended=()=>{
   node.disconnect();
   if(generation!==this.generation)return;
   this.nodes=this.nodes.filter(n=>n!==item);this.cache.delete(index);
   const tail=this.nodes.at(-1);
   if(tail)this.append((tail.index+1)%OPERATION_MUSIC_TRACKS.length,tail.end+OPERATION_MUSIC_GAP/1000,generation).catch(error=>this.fail(error));
  };
  node.start(at,clip.start,duration);
  return item;
 }
 fail(error){this.error=error;console.error('Operation music decode failed',error);this.stop()}
 stop(){
  this.generation++;this.starting=false;this.running=false;
  for(const item of this.nodes){item.node.onended=null;try{item.node.stop()}catch{}item.node.disconnect()}
  this.nodes=[];
  // Release decoded PCM on actual operation exit. MP3 sources remain immutable.
  this.cache.clear();
  if(this.context&&this.context.state!=='closed')this.context.suspend().catch(()=>{});
 }
 pause(){if(this.context&&this.context.state!=='closed')this.context.suspend().catch(()=>{})}
 sync(){
  if(!operationMusicWanted()){this.pause();return}
  menuMusic.pause(); // Never let title music overlap the operation.
  const context=this.ensure();this.gain.gain.value=appSettings.music;
  context.resume().catch(()=>{});
  if(this.running||this.starting)return;
  const generation=this.generation;this.starting=true;
  this.prepare().then(async()=>{
   if(generation!==this.generation||!operationMusicActive)return;
   const at=context.currentTime+.025;
   const first=await this.append(0,at,generation);
   if(!first||generation!==this.generation)return;
   await this.append(1,first.end+OPERATION_MUSIC_GAP/1000,generation);
   if(generation!==this.generation)return;
   this.running=true;this.starting=false;
   // If the app was hidden/muted while decoding, keep the audio clock paused.
   if(!operationMusicWanted())this.pause();
  }).catch(error=>{if(generation===this.generation)this.fail(error)});
 }
}
const operationBufferSupported=!!(window.AudioContext||window.webkitAudioContext)&&typeof OPERATION_MUSIC_DATA!=='undefined';
const operationBufferPlayer=operationBufferSupported?new OperationBufferPlayer():null;
if(operationBufferPlayer){
 const bufferedStop=stopOperationMusic;
 stopOperationMusic=function(){operationBufferPlayer.stop();bufferedStop()};
 pauseOperationMusic=function(){operationMusic.pause();operationBufferPlayer.pause()};
 syncOperationMusic=function(){
  if(operationMusicActive&&appFront())stopOperationMusic();
  operationBufferPlayer.sync();
 };
 // Remove the legacy streaming element's completion path entirely.
 operationMusic.onended=null;operationMusic.pause();operationMusic.preload='none';
 document.addEventListener('visibilitychange',()=>syncOperationMusic());
 const bufferedLoading=runCampaignLoading;
 runCampaignLoading=async function(...args){
  if(campaignLoading)return false;
  // Decode alongside map loading rather than at the song boundary.
  // The inner loader resets the player before activating the new session.
  const result=bufferedLoading(...args);
  operationBufferPlayer.prepare().catch(error=>operationBufferPlayer.fail(error));
  return result;
 };
}
