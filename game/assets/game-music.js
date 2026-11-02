'use strict';
// Buffered music has no HTMLMediaElement / media-session focus ownership.
// Keep the same Web Audio mixing path as in-game effects and operation music.
class GameMusicPlayer {
 constructor(src='') {
  this._src=src;this._volume=1;this._loop=false;this._paused=true;
  this.offset=0;this.startedAt=0;this.node=null;this.generation=0;this.loading=null;this.buffer=null;
  this.context=null;this.gain=null;
 }
 get src(){return this._src}
 set src(value){if(value===this._src)return;this.pause();this._src=value;this.offset=0;this.buffer=null;this.loading=null}
 get volume(){return this._volume}
 set volume(value){this._volume=value;if(this.gain)this.gain.gain.value=value}
 get loop(){return this._loop}
 set loop(value){this._loop=value;if(this.node)this.node.loop=value}
 get paused(){return this._paused}
 get currentTime(){return this.offset+(this.node?Math.max(0,this.context.currentTime-this.startedAt):0)}
 set currentTime(value){const resume=!this.paused;this.pause();this.offset=Math.max(0,value);if(resume)this.play().catch(()=>{})}
 ensure(){
  if(this.context)return this.context;
  const Context=window.AudioContext||window.webkitAudioContext;
  this.context=new Context();this.gain=this.context.createGain();this.gain.gain.value=this.volume;this.gain.connect(this.context.destination);
  this.context.addEventListener('statechange',()=>{
   // A system interruption must not leave the active foreground player silent.
   if(!this.paused&&!document.hidden&&['suspended','interrupted'].includes(this.context.state))this.context.resume().catch(()=>{});
  });
  return this.context;
 }
 async decode(){
  if(this.buffer)return this.buffer;
  if(this.loading)return this.loading;
  const src=this.src,entry=OPERATION_MUSIC_DATA[src];
  if(!entry)throw Error('Missing offline music: '+src);
  const raw=atob(entry.data),bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const pending=this.ensure().decodeAudioData(bytes.buffer);this.loading=pending;
  try{const buffer=await pending;if(this.src===src)this.buffer=buffer;return buffer}
  finally{if(this.loading===pending)this.loading=null}
 }
 async play(){
  if(!this.paused){await this.ensure().resume();return;}
  this._paused=false;const generation=++this.generation;
  try{
   const context=this.ensure();await context.resume();const buffer=await this.decode();
   if(this.paused||generation!==this.generation)return;
   const node=context.createBufferSource();node.buffer=buffer;node.loop=this.loop;node.connect(this.gain);
   this.offset=this.loop?this.offset%buffer.duration:Math.min(this.offset,buffer.duration);
   this.startedAt=context.currentTime;this.node=node;
   node.onended=()=>{if(this.node!==node)return;this.node=null;this.offset=0;this._paused=true;node.disconnect();this.onended?.()};
   node.start(0,this.offset);
  }catch(error){if(generation===this.generation)this._paused=true;throw error;}
 }
 pause(){
  if(this.node)this.offset=this.currentTime;
  this._paused=true;this.generation++;
  if(this.node){const node=this.node;this.node=null;node.onended=null;try{node.stop()}catch{}node.disconnect()}
  // Suspend only this player's idle clock; other music/effects have their own contexts.
  if(this.context&&this.context.state!=='closed')this.context.suspend().catch(()=>{});
 }
}
function createGameMusic(src){
 return (window.AudioContext||window.webkitAudioContext)&&typeof OPERATION_MUSIC_DATA!=='undefined'?new GameMusicPlayer(src):new Audio(src);
}
