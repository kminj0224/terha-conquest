'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8'),at=source.indexOf("assert.equal(run('appScreen'),'title');");
new Function('require','__dirname',source.slice(0,at)+`
(async()=>{
 await Promise.all(pending);run('setup();started=true;setAppScreen("game");sound=false;cam.x=640;cam.y=400;cam.z=1');
 const crypto=require('crypto');const {createCanvas,loadImage}=require('@napi-rs/canvas');
 for(const [name,count]of [['dirt-sequence.webp',5],['smoke-sequence.webp',5],['explosion-sequence.webp',7]]){
  const image=await loadImage(path.join(root,name));assert.equal(image.width,192*count);assert.equal(image.height,192);
  const hashes=[];for(let j=0;j<count;j++){const c=createCanvas(192,192),g=c.getContext('2d');g.drawImage(image,j*192,0,192,192,0,0,192,192);hashes.push(crypto.createHash('sha256').update(c.toBuffer('image/png')).digest('hex'));const pixels=g.getImageData(0,191,192,1).data;for(let k=3;k<pixels.length;k+=4)assert(pixels[k]<=2,name+' soft foot')}
  assert.equal(new Set(hashes).size,count,name+' distinct frames');
 }
 // Normal weapons keep their old burst length scaled by exactly 1.5; artillery
 // keeps its previous timing. Only explosion layers gain a silent 3-second tail.
 for(const type of [1,8,9,12,18,2,3,4,7,15,16,19,20,21,23]){
  const art=run('TYPES['+type+'].branch==="artillery"'),e=run('configureImpactTimeline({duration:650,layers:impactLayers({type:'+type+'},{type:1})},{type:'+type+'})');
  assert.equal(e.burstDuration,art?650:975);assert.equal(e.duration-e.burstDuration,3000);
 }
 for(const type of [0,6,10,11])assert.equal(run('configureImpactTimeline({duration:650,layers:impactLayers({type:'+type+'},{type:0})},{type:'+type+'}).duration'),650,'gunfire must stay gunfire');
 const smokeText68=fs.readFileSync(path.join(root,'illustrated-combat.js'),'utf8'),draws=[];
 const smokeBox68={smokeFramesArt:run('smokeFramesArt'),ctx:{globalAlpha:1,save(){this.old=this.globalAlpha},restore(){this.globalAlpha=this.old}}};
 smokeBox68.nativeMapDrawImage=(image,...args)=>draws.push({args,alpha:smokeBox68.ctx.globalAlpha});vm.createContext(smokeBox68);vm.runInContext(smokeText68.slice(smokeText68.indexOf('function drawImpactSmoke('),smokeText68.indexOf('function configureImpactTimeline(')),smokeBox68);
 for(const t of [.01,.2,.45,.65,.8,.98])smokeBox68.drawImpactSmoke(640,400,90,t);
 assert.equal(draws.length,6);for(const d of draws)assert.deepEqual(d.args.slice(-4),draws[0].args.slice(-4),'smoke foot must stay fixed');assert(draws.at(-1).alpha<draws[2].alpha*.1,'smoke fades away');
 // Restore the small original anti-tank muzzle plume, including angle and seven
 // puffs. This explicit exception does not affect impact illustrations.
 run('globalThis.puffs68=0;const oldCircle68=circle;circle=function(...args){puffs68++;return oldCircle68(...args)};try{drawIllustratedEffect({kind:"infantrySmoke",x:640,y:400,angle:Math.PI},.4)}finally{circle=oldCircle68}');assert.equal(run('puffs68'),7);
 run('fx=[];globalThis.smokeTiles68=tiles.map((t,i)=>i).filter(i=>tiles[i].owner>=0).slice(0,60);const p=pxy(smokeTiles68[0]);cam.x=p.x;cam.y=p.y;screenW=100000;screenH=100000;for(const tile of smokeTiles68){const p=pxy(tile);fx.push(configureImpactTimeline({kind:"blast",x:p.x,y:p.y,targetTile:tile,layers:["dustBurst"],start:1000,duration:650},{type:8}))}globalThis.smokeScene68=[];addImpactDepthEffects(smokeScene68,2500)');
 assert.equal(run('smokeScene68.length'),24,'smoke overload bounded at 24 visible tile plumes');
 run('fx=fx.slice(0,1);fx.push({...fx[0],start:1100});globalThis.smokeScene68=[];addImpactDepthEffects(smokeScene68,2500)');assert.equal(run('smokeScene68.length'),1,'overlapping smoke merges by target tile');assert.equal(run('smokeScene68[0].id'),1);
 run('globalThis.canvas68=document.createElement;globalThis.alloc68=0;document.createElement=function(...a){alloc68++;return canvas68(...a)};try{for(let j=0;j<100;j++){drawImpactSmoke(640,400,90,j/100);drawDirtImpact(640,400,j/100,90);effectFrame(2,j/100,640,400,90)}}finally{document.createElement=canvas68}');assert.equal(run('alloc68'),0);
 // Read the actual rendered burst peak, then smoke-only tail: no repeat sound or
 // new effect objects are created by drawing it.
 run('fx=[];const e=configureImpactTimeline({kind:"blast",x:cam.x,y:cam.y,layers:["explosion"],start:1000,duration:650},{type:23});fx.push(e);for(const time of [1100,1400,1900,2200,3200,4900])drawIllustratedEffect(e,(time-e.start)/e.duration)');assert.equal(run('fx.length'),1);
 assert.deepEqual(errors,[]);console.log('PASS v1.11.68: distinct 5/5/7 frames; fixed bases and soft alpha; exact 1.5x non-artillery bursts; 3-second fading smoke; original AT muzzle; same-tile merge/24-plume bound; zero steady-state canvas allocations.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
