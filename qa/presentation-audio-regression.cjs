'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 let now=0,serial=0;const frames=new Map(),listeners=new Map();
 const element=()=>({isConnected:true,children:[],textContent:'',setAttribute(){},appendChild(e){this.children.push(e)}});
 const document={hidden:false,createElement:element,addEventListener(k,f){if(!listeners.has(k))listeners.set(k,new Set());listeners.get(k).add(f)},removeEventListener(k,f){listeners.get(k)?.delete(f)}};
 const c={document,performance:{now:()=>now},requestAnimationFrame:f=>{frames.set(++serial,f);return serial},cancelAnimationFrame:id=>frames.delete(id)};
 vm.createContext(c);vm.runInContext(fs.readFileSync('game/assets/dialogue-typewriter.js','utf8'),c);
 c.line=element();c.next={};c.text='가나다😀 마침.';
 const writer=vm.runInContext('DialogueTypewriter.start(line,next,text)',c);
 const tick=ms=>{now+=ms;const fs=[...frames.values()];frames.clear();for(const f of fs)f(now)};
 assert(c.next.hidden&&c.next.disabled);tick(41);assert.equal(c.line.children[1].textContent,'');tick(1);assert.equal(c.line.children[1].textContent,'가');tick(42*3);assert.equal(c.line.children[1].textContent,'가나다😀');
 document.hidden=true;for(const f of listeners.get('visibilitychange'))f();tick(30000);assert(!writer.ready);document.hidden=false;for(const f of listeners.get('visibilitychange'))f();tick(42*4);assert(writer.ready);assert.equal(c.line.children[1].textContent,c.text);assert(!c.next.hidden&&!c.next.disabled);assert.equal(frames.size,0);assert.equal(listeners.get('visibilitychange').size,0);
 const w2=vm.runInContext('DialogueTypewriter.start(line,next,text)',c);w2.cancel();tick(5000);assert(!w2.ready&&c.next.hidden);assert.equal(frames.size,0);
 for(const type of ['contextmenu','selectstart','dragstart']){let prevented=0;for(const f of listeners.get(type))f({target:{closest:()=>null},preventDefault(){prevented++}});assert.equal(prevented,1);for(const f of listeners.get(type))f({target:{closest:()=>({})},preventDefault(){throw Error('Editable field blocked')}})}
 console.log('PASS 42ms Unicode typing, next hidden/disabled until completion, background pause, cancellation, selection/context menu blocking with editable exception');
 class Context{
  constructor(){this.state='running';this.currentTime=0;this.handlers={};this.nodes=[]}
  createGain(){return {gain:{value:1},connect(){}}}
  addEventListener(k,f){this.handlers[k]=f}
  resume(){this.state='running';return Promise.resolve()}
  suspend(){this.state='suspended';return Promise.resolve()}
  decodeAudioData(){return Promise.resolve({duration:100})}
  createBufferSource(){const node={connect(){},disconnect(){},start(at,offset){this.offset=offset},stop(){this.stopped=true}};this.nodes.push(node);return node}
 }
 const a={console,document:{hidden:false},AudioContext:Context,atob:s=>Buffer.from(s,'base64').toString('binary'),OPERATION_MUSIC_DATA:{'one.mp3':{data:'YWJj'},'two.mp3':{data:'ZGVm'}}};a.window=a;vm.createContext(a);vm.runInContext(fs.readFileSync('game/assets/game-music.js','utf8'),a);
 const player=vm.runInContext("createGameMusic('one.mp3')",a);player.loop=true;player.volume=.3;await player.play();assert(!player.paused);assert.equal(player.node.loop,true);assert.equal(player.gain.gain.value,.3);
 player.context.currentTime=12;player.pause();assert.equal(player.currentTime,12);assert(player.paused);await player.play();assert.equal(player.node.offset,12);
 player.context.state='interrupted';player.context.handlers.statechange();assert.equal(player.context.state,'running');assert.equal(player.node.offset,12);
 player.pause();player.context.handlers.statechange();assert.equal(player.context.state,'suspended','Intentional pause stays paused');
 player.src='two.mp3';const pending=player.play();player.pause();await pending;assert.equal(player.node,null,'Late decode must not restart paused music');
 await player.play();assert.equal(player.node.offset,0);player.currentTime=5;await Promise.resolve();await Promise.resolve();await Promise.resolve();await Promise.resolve();assert.equal(player.node.offset,5);
 player.volume=.8;assert.equal(player.gain.gain.value,.8);player.pause();
 console.log('PASS Web Audio mixing without media elements, loop/volume, pause/resume position, interruption recovery, intentional silence, decode race and source switch');
})().catch(e=>{console.error(e);process.exitCode=1});
