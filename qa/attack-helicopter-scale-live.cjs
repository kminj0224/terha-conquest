'use strict';
const assert=require('assert');
module.exports=function({run}){
 const report=run(`(()=>{
  const draw=ctx.drawImage,scale=ctx.scale,images=[],scales=[],originalFx=fx;
  const oldSkip=skipAIAnimations;skipAIAnimations=()=>false;
  try{
   ctx.drawImage=function(im,...args){if(baekAttackHeliArt.some(a=>a.idle===im))images.push(args);return draw.call(this,im,...args)};
   ctx.scale=function(x,y){scales.push([x,y]);return scale.call(this,x,y)};
   const tile=cities[0].tile,u={id:-46,f:0,type:21,tile,level:1,hp:100,angle:0},p=pxy(tile);
   sprite(u,p,1000);fx=[];const muzzle=launchShot(u,{x:p.x+100,y:p.y},1000);
   const width=images.at(-1)?.[2],muzzleX=muzzle.x-p.x,muzzleY=muzzle.y-p.y;
   sprite({...u,id:-47,f:1},p,1000);
   return {width,muzzleX,muzzleY,procedural:scales.some(v=>v[0]===1.3&&v[1]===1.3),lightScale:largeUnitVisual({type:20}),heavyScale:unitBodyVisualScale({type:1}),rockets:fx.filter(e=>e.baekHelicopterRocket&&e.kind==='baekRocket').length};
  }finally{ctx.drawImage=draw;ctx.scale=scale;fx=originalFx;skipAIAnimations=oldSkip}
 })()`);
 assert(Math.abs(report.width-96*1.3)<1e-8);assert(Math.abs(report.muzzleX-23*1.3)<1e-8);assert(Math.abs(report.muzzleY+6*1.3)<1e-8);
 assert(report.procedural);assert(!report.lightScale);assert.equal(report.heavyScale,1.4);assert.equal(report.rockets,8);
 console.log('PASS: actual Canvas attack helicopter width +30%, other factions +30%, aligned rocket origins and unchanged light/heavy scales:',report);
};
