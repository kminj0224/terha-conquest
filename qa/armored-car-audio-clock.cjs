'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'../game/assets/combat-audio.js'),'utf8');
let sourceNode,stopTime,startTime;
const param=()=>({value:0,setTargetAtTime(){}}),node=()=>({connect(){},disconnect(){}});
const context={state:'running',currentTime:10,createBufferSource(){return sourceNode={...node(),playbackRate:param(),start(t){startTime=t},stop(t){stopTime=t}}},createGain:()=>({...node(),gain:param()}),createBiquadFilter:()=>({...node(),frequency:param(),Q:param()})};
const b={ensureCombatAudio:()=>context,combatBuffer:()=>({}),combatAudio:{variation:0,voices:[],input:{}},screenW:1280,cam:{x:0,y:0,z:1},nearWorldPoint:p=>p};
vm.createContext(b);vm.runInContext(source.slice(source.indexOf('function playCombatVoice('),source.indexOf('function combatWeaponProfile(')),b);
for(const variation of [0,1,9,10,17]){
 b.combatAudio.variation=variation;
 b.event={name:'armored_autocannon',position:{x:0,y:0},start:1100,end:2100,volume:.78,playbackRate:1,fixedRate:true};
 vm.runInContext('playCombatVoice(event,1000)',b);
 assert.equal(sourceNode.playbackRate.value,1);assert(Math.abs(startTime-10.1)<1e-9);
 // The shared audio engine permits an 8 ms stop guard after the exact end envelope.
 assert(Math.abs(stopTime-11.108)<1e-9);assert(sourceNode.buffer);
}
console.log('PASS: spatial audio preserves exact cannon playback rate and scheduled 1.0 s firing window across all variation counters');
