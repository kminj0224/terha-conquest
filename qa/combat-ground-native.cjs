'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8'),at=source.indexOf("assert.equal(run('appScreen'),'title');");
new Function('require','__dirname',source.slice(0,at)+`
(async()=>{
 await Promise.all(pending);run('setup();started=true;setAppScreen("game");sound=false;cam.z=1');
 assert.equal(run('Object.keys(IMPACT_GROUND_DATA).length'),7*run('TYPES.length'));
 assert(run('Object.values(IMPACT_GROUND_DATA).every(levels=>levels.length===4&&levels.every(v=>v.length===32&&v.every(Number.isFinite)))'),'four levels, two poses and sixteen directions');
 // Real impact factories snapshot the victim foot, including splash and already
 // destroyed air-strike victims. Source blood/spark anchors remain unchanged.
 for(let f=0;f<7;f++)for(const type of [0,1,2,9,11,14,18,22,23,28]){
  run('(()=>{units=[];fx=[];const tile=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)),v=makeUnit('+f+','+type+',tile),u=makeUnit((v.f+1)%7,1,tile);targetExplosions(u,pxy(tile),20,performance.now(),false,v);const hit=fx.find(e=>e.burstDuration!=null);if(!hit||Math.abs(hit.explosionGroundY-unitExplosionGroundY(v,hit.start))>.001)throw Error("victim foot mismatch");fx=[];addAreaImpact(u,v,15);if(Math.abs(fx[0].explosionGroundY-unitExplosionGroundY(v,fx[0].start))>.001)throw Error("splash foot mismatch")})()');
 }
 run('(()=>{units=[];fx=[];const tile=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)),v=makeUnit(5,28,tile),p=pxy(tile);const foot=unitExplosionGroundY(v);kill(v);targetExplosions({type:3,strategic:true},p,20);const e=fx.find(e=>e.burstDuration!=null);if(!e||Math.abs(e.explosionGroundY-foot)>.001)throw Error("dead victim lost foot")})()');
 run('globalThis.layers69=[];const dirt69=drawDirtImpact,frame69=effectFrame,smoke69=drawImpactSmoke;drawDirtImpact=function(x,y,t,size,bottom){layers69.push({kind:"dirt",y,bottom});return dirt69(x,y,t,size,bottom)};effectFrame=function(row,t,x,y,size,bottom){layers69.push({kind:row===0?"spark":row===1?"blood":"fire",y,bottom});return frame69(row,t,x,y,size,bottom)};drawImpactSmoke=function(x,y,size,t,density,bottom){layers69.push({kind:"smoke",y,bottom,t});return smoke69(x,y,size,t,density,bottom)};try{paintImpact({x:640,y:400,explosionGroundY:425,layers:["armorSmoke","blood"],burstDuration:975,duration:3000},0);paintImpact({x:640,y:400,explosionGroundY:425,layers:["explosion"],burstDuration:975,duration:3000},.1)}finally{drawDirtImpact=dirt69;effectFrame=frame69;drawImpactSmoke=smoke69}');
 const paints=run('layers69');assert.equal(paints[0].kind,'smoke');assert.equal(paints[0].t,0,'smoke starts with burst');
 for(const p of paints){if(['dirt','fire','smoke'].includes(p.kind))assert.equal(p.bottom,425);if(p.kind==='blood'||p.kind==='spark'){assert.equal(p.y,400);assert(p.bottom==null)}}
 // Verify every visible explosion frame's actual opaque foot maps to the victim.
 const vm=require('vm'),illustrated=fs.readFileSync(path.join(root,'illustrated-combat.js'),'utf8'),animation=fs.readFileSync(path.join(root,'combat-animation.js'),'utf8');
 function extract(text,name){const a=text.indexOf('function '+name+'(');let n=0,b=text.indexOf('{',a);for(let i=b;i<text.length;i++){if(text[i]==='{')n++;if(text[i]==='}'&&!--n)return text.slice(a,i+1)}throw Error(name)}
 const box={ctx:{globalAlpha:1,save(){},restore(){}},explosionFramesArt:run('explosionFramesArt'),dirtImpactArt:run('dirtImpactArt'),softEffectTexture:a=>a.idle};let call;
 box.nativeMapDrawImage=(...args)=>call=args;vm.createContext(box);vm.runInContext(illustrated.slice(illustrated.indexOf('const DIRT_FRAME_FEET='),illustrated.indexOf('function effectFrame')),box);vm.runInContext(extract(illustrated,'effectFrame'),box);vm.runInContext(extract(animation,'drawDirtImpact'),box);
 for(const [kind,count]of [['dirt',5],['fire',7]])for(let j=0;j<count;j++){
  if(kind==='dirt')box.drawDirtImpact(640,400,(j+.1)/count,90,425);else box.effectFrame(2,(j+.1)/count,640,400,90,425);
  const feet=vm.runInContext(kind==='dirt'?'DIRT_FRAME_FEET':'FIRE_FRAME_FEET',box);assert(Math.abs(call[6]+call[8]*feet[j]-425)<.001);
 }
 // The new artwork is a steady plume in every keyframe, not a growing sequence.
 const {loadImage,createCanvas}=require('@napi-rs/canvas'),im=await loadImage(path.join(root,'smoke-loop.webp')),areas=[],heights=[];
 for(let j=0;j<5;j++){const c=createCanvas(192,192),g=c.getContext('2d');g.drawImage(im,j*192,0,192,192,0,0,192,192);const p=g.getImageData(0,0,192,192).data;let area=0,top=192,bottom=0;for(let y=0;y<192;y++)for(let x=0;x<192;x++)if(p[(y*192+x)*4+3]>=32){area++;top=Math.min(top,y);bottom=Math.max(bottom,y)}areas.push(area);heights.push(bottom-top)}
 assert(Math.max(...areas)/Math.min(...areas)<1.25,'all phases keep plume size');assert(Math.max(...heights)-Math.min(...heights)<15);
 assert.deepEqual(errors,[]);console.log('PASS v1.11.69: 217 national/type foot lookups; 70 real victim/splash factories; destroyed target feet; burst+smoke simultaneous; unchanged blood/sparks; exact opaque feet in all 12 blast frames; steady-size smoke keyframes.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
