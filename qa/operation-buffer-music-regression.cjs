'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let deferred=[],nodes=[],resumes=0,suspends=0,legacyPlays=0;
class Context{
 constructor(){this.currentTime=10;this.state='running';this.destination={}}
 createGain(){return{gain:{value:0},connect(){}}}
 createBufferSource(){const node={connect(){},disconnect(){},stop(){this.stopped=true},start(...args){this.args=args}};nodes.push(node);return node}
 decodeAudioData(){return new Promise(resolve=>deferred.push(()=>resolve({duration:180})))}
 resume(){resumes++;this.state='running';return Promise.resolve()}
 suspend(){suspends++;this.state='suspended';return Promise.resolve()}
}
const b={console,AudioContext:Context,Uint8Array,atob:()=>'',OPERATION_MUSIC_GAP:4000,
 OPERATION_MUSIC_TRACKS:['a','b','c','d'].map(src=>({src})),
 OPERATION_MUSIC_DATA:Object.fromEntries(['a','b','c','d'].map(src=>[src,{data:'',start:.5,end:179}])),
 operationMusicActive:true,appSettings:{music:.65},wanted:true,front:false,
 operationMusic:{pause(){},play(){legacyPlays++}},menuMusic:{pause(){this.paused=true}},
 operationMusicWanted:()=>b.wanted&&b.operationMusicActive,appFront:()=>b.front,
 stopOperationMusic(){b.operationMusicActive=false},pauseOperationMusic(){},syncOperationMusic(){},
 campaignLoading:false,runCampaignLoading:async()=>true,document:{addEventListener(){}}
};b.window=b;vm.createContext(b);
vm.runInContext(fs.readFileSync('game/assets/operation-buffer-music.js','utf8'),b);
const run=s=>vm.runInContext(s,b),flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve()};
async function decode(){deferred.splice(0).forEach(f=>f());await flush()}
(async()=>{
 b.syncOperationMusic();b.syncOperationMusic();assert.equal(nodes.length,0,'No playback before decode');
 await decode();assert.equal(nodes.length,2,'Current and next song scheduled once');
 const [first,second]=nodes;
 assert.equal(first.args[1],.5,'Skip measured leading silence only');assert.equal(first.args[2],178.5);
 assert.equal(second.args[0]-(first.args[0]+first.args[2]),4,'Exactly four seconds on audio clock');
 assert.equal(b.menuMusic.paused,true);assert.equal(legacyPlays,0,'Streaming element cannot overlap');
 for(let i=0;i<20;i++)b.syncOperationMusic();assert.equal(nodes.length,2,'Touch/settings cannot duplicate voices');
 const context=run('operationBufferPlayer.context');
 context.currentTime=first.args[0]+first.args[2]+9;
 // Simulate a very late JS completion event: the next song was already scheduled.
 first.ended=true;first.onended();await decode();assert.equal(nodes.length,3);
 assert.equal(nodes[2].args[0]-(second.args[0]+second.args[2]),4,'Delayed JS cannot stretch scheduled gap');
 b.wanted=false;b.syncOperationMusic();assert.equal(context.state,'suspended');
 const schedule=nodes.map(n=>n.args[0]);b.wanted=true;b.syncOperationMusic();assert.equal(context.state,'running');assert.deepEqual(nodes.map(n=>n.args[0]),schedule,'Background resume preserves exact timeline');
 b.appSettings.music=.2;b.syncOperationMusic();assert.equal(run('operationBufferPlayer.gain.gain.value'),.2);
 b.front=true;b.syncOperationMusic();assert(nodes.every(n=>n.stopped||n.ended));assert.equal(run('operationBufferPlayer.cache.size'),0);
 b.front=false;b.operationMusicActive=true;b.syncOperationMusic();await decode();
 assert.equal(nodes.length,5,'Fresh operation restarts at first pair');
 b.stopOperationMusic();b.operationMusicActive=true;b.syncOperationMusic();b.stopOperationMusic();await decode();
 assert(nodes.every(n=>n.stopped||n.ended),'Late decode cannot resurrect a stopped session');
 assert.equal(legacyPlays,0);assert(resumes>0&&suspends>0);
 console.log('PASS: predecode, sample-clock 4s gaps, edge offsets, no overlap/restarts, delayed JS, pause/resume, volume, exit and stale async cancellation');
})().catch(error=>{console.error(error);process.exit(1)});
