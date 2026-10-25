'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {transportStripePixel,factionPalette}=require('../tools/prepare-transport-art.cjs');
const root=path.join(__dirname,'../game/assets');
(async()=>{
 const original=fs.readFileSync(path.join(root,'transport-ship.png'));
 assert.equal(crypto.createHash('sha256').update(original).digest('hex'),'6aa94ff46a4358d1c03cee2d2ba7f66bcab4a9c50703fed90554143b169cdb0c');
 const factions=factionPalette(),images=await Promise.all(factions.map((_,f)=>loadImage(path.join(root,f?'transport-ship-'+f+'.png':'transport-ship.png'))));
 const [w,h]=[images[0].width,images[0].height],canvas=createCanvas(w,h),ctx=canvas.getContext('2d');
 const pixels=image=>{ctx.clearRect(0,0,w,h);ctx.drawImage(image,0,0);return ctx.getImageData(0,0,w,h).data};
 const base=pixels(images[0]);
 for(let f=1;f<7;f++){
  assert.equal(images[f].width,w);assert.equal(images[f].height,h);const data=pixels(images[f]);let changed=0;
  for(let i=0;i<base.length;i+=4){
   const y=Math.floor(i/4/w),stripe=transportStripePixel(...base.subarray(i,i+4),y,h);
   assert.equal(data[i+3],base[i+3],'alpha preserved');
   if(!stripe){for(let c=0;c<3;c++)assert.equal(data[i+c],base[i+c],'only the green hull stripe may change')}
   else if(data[i]!==base[i]||data[i+1]!==base[i+1]||data[i+2]!==base[i+2])changed++;
  }
  assert(changed>50000,'full hull stripe recolored for faction '+f);
 }
 const s={Math,Number,factions,loadBaekArt:file=>({idle:images[file==='transport-ship.png'?0:Number(file.match(/-(\d)\.png/)[1])],idleReady:true}),
  NAVAL_VISUAL_SCALE:1.45,ctx:createCanvas(512,256).getContext('2d'),cam:{z:1},window:{Terha:{}},
  unitVisualPosition:()=>({x:256,y:128}),unitMaxHp:()=>100,rect:()=>{},sprite:()=>{s.fallback++},drawShip:()=>{s.sinkFallback++},fallback:0,sinkFallback:0};
 vm.createContext(s);vm.runInContext(fs.readFileSync(path.join(root,'transport-art.js'),'utf8'),s);
 const painted=[],scales=[],draw=s.ctx.drawImage.bind(s.ctx),scale=s.ctx.scale.bind(s.ctx);
 s.ctx.drawImage=(...args)=>{painted.push(args);return draw(...args)};s.ctx.scale=(...args)=>{scales.push(args);return scale(...args)};
 for(let f=0;f<7;f++)for(const angle of [0,Math.PI]){
  s.u={f,type:26,angle,hp:100};vm.runInContext('sprite(u,{x:0,y:0},0)',s);
  assert.equal(painted.at(-1)[0],images[f]);assert.equal(scales.at(-1)[0],angle? -1:1);
 }
 vm.runInContext('sprite({f:0,type:0},{x:0,y:0},0)',s);assert.equal(s.fallback,1);
 s.ctx.globalAlpha=.4;vm.runInContext('drawShip({f:5,type:26},0,-1)',s);assert.equal(painted.at(-1)[0],images[5]);assert(Math.abs(s.ctx.globalAlpha-.4)<.01);
 console.log('PASS: exact uploaded Baek artwork, six faction stripe palettes, untouched hull/deck/alpha, every faction in both directions, movement positioning and sinking artwork');
})().catch(e=>{console.error(e);process.exit(1)});
