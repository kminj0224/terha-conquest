'use strict';
// Ballistic crack + muzzle pressure + mechanical noise + baked outdoor reflections.
// PCM ships inside the APK as JS: no network, file:// fetch, or decoder dependency.
const combatAudio={context:null,input:null,master:null,buffers:new Map(),voices:[],queue:[],seen:new WeakSet(),variation:0,enabled:true};
function ensureCombatAudio(){
 if(!sound||document.hidden)return null;
 try{
  if(!combatAudio.context){
   audio??=new (window.AudioContext||window.webkitAudioContext)();
   const limiter=audio.createDynamicsCompressor(),master=audio.createGain();
   limiter.threshold.value=-15;limiter.knee.value=16;limiter.ratio.value=6;limiter.attack.value=.002;limiter.release.value=.2;
   master.gain.value=.58;limiter.connect(master);master.connect(audio.destination);
   Object.assign(combatAudio,{context:audio,input:limiter,master});
  }
  const context=combatAudio.context;if(context.state==='suspended')context.resume().catch(()=>{});return context;
 }catch(error){combatAudio.enabled=false;return null}
}
function combatBuffer(name,variant){
 const key=name+':'+variant;if(combatAudio.buffers.has(key))return combatAudio.buffers.get(key);
 const context=ensureCombatAudio(),encoded=COMBAT_SOUND_BANK[name]?.[variant];if(!context||!encoded)return null;
 const bytes=atob(encoded),buffer=context.createBuffer(1,bytes.length/2,COMBAT_SOUND_RATE),out=buffer.getChannelData(0);
 for(let i=0;i<out.length;i++){let value=bytes.charCodeAt(i*2)|(bytes.charCodeAt(i*2+1)<<8);if(value&32768)value-=65536;out[i]=value/32768}
 combatAudio.buffers.set(key,buffer);return buffer;
}
function stopCombatAudio(includeUI=true){
 combatAudio.queue.length=0;
 const context=combatAudio.context;
 for(const voice of [...combatAudio.voices]){if(!includeUI&&voice.ui)continue;try{if(context){voice.gain.gain.cancelScheduledValues(context.currentTime);voice.gain.gain.setTargetAtTime(0,context.currentTime,.008);voice.source.stop(context.currentTime+.04)}}catch(error){}}
 combatAudio.voices=includeUI?[]:combatAudio.voices.filter(v=>v.ui);
}
function queueCombatSound(name,position,start=performance.now(),volume=1){
 if(!sound||document.hidden||!combatAudio.enabled||skipAIAnimations()||!COMBAT_SOUND_BANK[name])return;
 combatAudio.queue.push({name,position:{x:position.x,y:position.y},start,volume});
 // A corrupt or very old FX list cannot accumulate an unbounded sound backlog.
 if(combatAudio.queue.length>96)combatAudio.queue.splice(0,combatAudio.queue.length-96);
}
function playCombatVoice(event,now){
 const context=ensureCombatAudio();if(!context||context.state!=='running')return;
 const sequence=combatAudio.variation++,variant=sequence%2,buffer=combatBuffer(event.name,variant);if(!buffer)return;
 const source=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter();source.buffer=buffer;
 source.playbackRate.value=1+((sequence*17%11)-5)*.004;
 const viewWidth=Math.max(640,screenW/cam.z),dx=(event.position.x-cam.x)/viewWidth,dy=(event.position.y-cam.y)/viewWidth;
 const distance=event.ui?0:Math.hypot(dx,dy),attenuation=Math.max(.22,1/(1+distance*.65));
 filter.type='lowpass';filter.frequency.value=Math.max(1800,14500/(1+distance*.6));filter.Q.value=.5;
 gain.gain.value=event.loop?0:event.volume*attenuation;if(event.loop)gain.gain.setTargetAtTime(event.volume*attenuation,context.currentTime,.018);source.loop=!!event.loop;
 source.connect(filter);filter.connect(gain);
 let panner=null;if(typeof context.createStereoPanner==='function'){panner=context.createStereoPanner();panner.pan.value=event.ui?0:Math.max(-.7,Math.min(.7,dx*1.3));gain.connect(panner);panner.connect(combatAudio.input)}else gain.connect(combatAudio.input);
 const voice={source,gain,filter,panner,ui:!!event.ui,ended:false};
 // Limit overlap during rocket salvos and several AI attacks in quick succession.
 while(combatAudio.voices.length>=20){const index=Math.max(0,combatAudio.voices.findIndex(v=>!v.ui)),old=combatAudio.voices.splice(index,1)[0];try{old.gain.gain.setTargetAtTime(0,context.currentTime,.008);old.source.stop(context.currentTime+.035)}catch(error){}}
 combatAudio.voices.push(voice);
 source.onended=()=>{voice.ended=true;const i=combatAudio.voices.indexOf(voice);if(i>=0)combatAudio.voices.splice(i,1);source.disconnect();gain.disconnect();filter.disconnect();if(panner)panner.disconnect()};
 source.start(context.currentTime+Math.max(0,(event.start-now)/1000));
 if(Number.isFinite(event.end)){const remaining=Math.max(.02,(event.end-now)/1000);gain.gain.setTargetAtTime(0,context.currentTime+Math.max(0,remaining-.025),.006);source.stop(context.currentTime+remaining+.008)}
 return voice;
}
function combatWeaponProfile(u){
 const type=u.type,f=u.f;
 if(type===26)return null;
 if(type===17||type===18||f===2&&[1,13,14].includes(type))return{name:'laser',shots:1,step:0,volume:.66};
 const defs={0:['rifle',1,0,.62],6:['rifle',10,70,.32],8:['grenade_launch',1,0,.72],9:['rocket',1,0,.72],10:['machinegun',8,70,.38],11:['rifle',8,70,.34],12:['autocannon',6,70,.4],13:['light_cannon',1,0,.8],1:['tank',1,0,.86],14:['heavy_tank',1,0,.92],15:['mortar',1,0,.8],16:['artillery',1,0,.92],2:['artillery',1,0,.92],3:['rocket',f===0?5:6,f===0?120:95,.44],22:['autocannon',6,65,.4],5:['missile',1,0,.72],23:['missile',1,0,.76],24:['missile',1,0,.84],25:['jet',1,0,.58],4:['jet',1,0,.58],7:['jet',1,0,.66],19:['jet',1,0,.72],20:['autocannon',6,75,.34],21:['rocket',4,100,.42]};
 const [name,shots,step,volume]=defs[type]||['rifle',1,0,.6];return{name,shots,step,volume};
}
function combatImpactProfile(u){
 if(u.type===17||u.type===18||u.f===2&&[1,13,14].includes(u.type))return'energy_hit';
 if([0,6,10,11,12,20,22].includes(u.type))return'bullet_hit';
 if(u.type===8)return'explosion_small';
 if([9,15,3,21].includes(u.type))return'explosion_medium';
 return'explosion_heavy';
}
const combatLaunchShot=launchShot;
launchShot=function(u,target,start=performance.now(),duration=520){
 const before=fx.length,result=combatLaunchShot(u,target,start,duration);
 for(const event of fx.slice(before))combatAudio.seen.add(event);
 const profile=combatWeaponProfile(u);if(profile)for(let j=0;j<profile.shots;j++)queueCombatSound(profile.name,pxy(u.tile),start+j*profile.step,profile.volume);
 return result;
};
const combatTargetExplosions=targetExplosions;
targetExplosions=function(u,p,d,now=performance.now(),...rest){
 const before=fx.length,result=combatTargetExplosions(u,p,d,now,...rest),profile=combatImpactProfile(u);
 for(const event of fx.slice(before))if(['blast','baekArtilleryBlast','baekImpact','infantrySpark','infantryDust','infantryExplosion','devilImpact'].includes(event.kind))event.combatImpact=event.kind==='infantryDust'&&profile==='bullet_hit'?'dirt_hit':profile;
 return result;
};
const COMBAT_FX_SOUNDS={blast:'explosion_small',baekArtilleryBlast:'explosion_heavy',baekImpact:'explosion_medium',infantrySpark:'bullet_hit',infantryDust:'dirt_hit',infantryExplosion:'explosion_medium',devilImpact:'energy_hit',defenseHit:'explosion_heavy',defenseFlame:'missile',samIntercept:'missile',missile:'missile',navalMissile:'missile',airraid:'jet',nuclear:'explosion_huge',laser:'laser'};
function processCombatAudio(now){
 if(!sound||document.hidden||skipAIAnimations()){stopCombatAudio(!sound||!!document.hidden);for(const event of fx)combatAudio.seen.add(event);return}
 for(const event of fx){
  if(combatAudio.seen.has(event)||event.start>now+60)continue;
  combatAudio.seen.add(event);if(now-event.start>250)continue;
  const name=event.combatImpact||COMBAT_FX_SOUNDS[event.kind];if(!name)continue;
  const volume=name==='bullet_hit'||name==='dirt_hit'?.24:event.kind==='samIntercept'?.32:event.kind==='nuclear'?1.05:.63;
  queueCombatSound(name,{x:event.x,y:event.y},event.start,volume);
 }
 const future=[];for(const event of combatAudio.queue){if(event.start>now+60){future.push(event);continue}if(now-event.start<=250)playCombatVoice(event,now)}combatAudio.queue=future;
}
// All legacy oscillator calls and delayed duplicate launch/impact calls are silent.
// The actual weapon animation and impact FX above now own the audio timing.
audioShot=function(){};
const combatDraw=draw;draw=function(now){processCombatAudio(now);return combatDraw(now)};
function resetCombatAudio(){stopCombatAudio();combatAudio.seen=new WeakSet()}
const combatSetup=setup;setup=function(...args){resetCombatAudio();return combatSetup(...args)};
const combatMigration=migrateArmy;migrateArmy=function(...args){resetCombatAudio();return combatMigration(...args)};
const combatFastForward=enableAIFastForward;enableAIFastForward=function(){const result=combatFastForward();if(result)stopCombatAudio(false);return result};$('aiFastForward').onclick=enableAIFastForward;
document.addEventListener('pointerdown',()=>{if(sound)ensureCombatAudio()},{passive:true});
document.addEventListener('keydown',()=>{if(sound)ensureCombatAudio()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopCombatAudio();if(combatAudio.context?.state==='running')combatAudio.context.suspend().catch(()=>{})}});
Object.assign(window.Terha,{launchShot,targetExplosions,setup,migrateArmy,enableAIFastForward,combatWeaponProfile,combatImpactProfile});
