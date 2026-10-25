'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'../game/assets/combat-audio.js'),'utf8');
const pulse=Buffer.alloc(20);pulse.writeInt16LE(16000,0);
const b={COMBAT_SOUND_RATE:1000,COMBAT_SOUND_BANK:{rifle:[pulse.toString('base64'),pulse.toString('base64')]},atob:s=>Buffer.from(s,'base64').toString('binary'),
 combatAudio:{buffers:new Map(),enabled:true,queue:[],seen:new WeakSet()},sound:true,document:{hidden:false},skipAIAnimations:()=>false,
 ensureCombatAudio:()=>({createBuffer:(channels,n)=>{const data=new Float32Array(n);return{length:n,getChannelData:()=>data}}}),
 fx:[],launchShot:()=>true,performance:{now:()=>1000},pxy:()=>({x:40,y:80})};
vm.createContext(b);const run=code=>vm.runInContext(code,b);
run(source.slice(source.indexOf('function combatBuffer('),source.indexOf('function stopCombatAudio(')));
run(source.slice(source.indexOf('function queueCombatSound('),source.indexOf('function playCombatVoice(')));
run(source.slice(source.indexOf('function combatWeaponProfile('),source.indexOf('function combatImpactProfile(')));
run(source.slice(source.indexOf('const combatLaunchShot='),source.indexOf('const combatTargetExplosions=')));
for(let f=0;f<7;f++){
 b.f=f;b.combatAudio.queue=[];run('launchShot({type:0,f}, {},1000)');
 assert.equal(b.combatAudio.queue.length,3);assert.deepEqual(b.combatAudio.queue.map(e=>e.start),[1000,1090,1180]);assert(b.combatAudio.queue.every(e=>e.echo));
}
const dry=run("combatBuffer('rifle',0)"),echo=run("combatBuffer('rifle',0,true)");
assert.equal(dry.length,10);assert.equal(echo.length,660);const data=echo.getChannelData(0);
for(const i of [110,230,390,580])assert(data[i]>0,'audible reflection at '+i);
assert(data[110]>data[230]&&data[230]>data[390]&&data[390]>data[580],'reflection decay');
assert.equal(run("combatBuffer('rifle',0,true)"),echo,'echo PCM cached');assert.notEqual(dry,echo);
b.sound=false;b.combatAudio.queue=[];run('launchShot({type:0,f:0},{},1000)');assert.equal(b.combatAudio.queue.length,0);
console.log('PASS: all seven rifle factions use 3 shots at 90ms, decaying cached PCM echoes, dry audio isolation and mute');
