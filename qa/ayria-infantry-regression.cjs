'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),assets=path.resolve(__dirname,'../game/assets');
async function main(){
 const decoded=new Map();
 for(const suffix of ['rifle-idle','rifle-fire','grenadier-idle','grenadier-fire','machinegun','antitank']){
  const name='ayria-'+suffix+'.webp',bytes=fs.readFileSync(path.join(assets,name));assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  let lossless=false;for(let o=12;o+8<=bytes.length;){const kind=bytes.toString('ascii',o,o+4),n=bytes.readUInt32LE(o+4);if(kind==='VP8L')lossless=true;assert.notEqual(kind,'VP8 ',name+' is lossy');o+=8+n+n%2}assert(lossless,name+' must preserve source pixels');
  const im=await loadImage(bytes);assert.deepEqual([im.width,im.height],suffix.endsWith('-idle')?[1448,1086]:[1536,1024]);assert(im.width>=72*2.7*2&&im.height>=48*2.7*2);decoded.set(name,im);
 }
 const canvas=createCanvas(640,480),g=canvas.getContext('2d'),painted=[],flashes=[];
 const ctx=new Proxy(g,{get(o,k){if(k==='drawImage')return(im,...args)=>{painted.push({im,args});o.drawImage(im.native,...args)};const v=o[k];return typeof v==='function'?v.bind(o):v},set(o,k,v){o[k]=v;return true}});
 class Img{set src(name){this.native=decoded.get(name);this.naturalWidth=this.native?.width||0;this.naturalHeight=this.native?.height||0;this.complete=!!this.native;if(this.complete)this.onload?.()}}
 const noop=()=>{},b={Image:Img,ctx,beginAim:noop,moveUnit:noop,launchShot:()=>({x:0,y:0}),targetExplosions:noop,sprite:()=>{throw Error('Fallback sprite')},setup:noop,migrateArmy:noop,movingAnimation:()=>null,fireMotions:new Map(),fx:[],pxy:()=>({x:120,y:180}),performance:{now:()=>1000},sound:false,setTimeout:noop,audioShot:noop,save:noop,poly:()=>{const m=g.getTransform();flashes.push({x:m.e,y:m.f})},circle:noop,line:noop,rect:noop,cam:{z:1},TYPES:Array.from({length:12},()=>({branch:'infantry',name:'Infantry'})),factions:[{},{},{},{color:'#cca'}],unitMaxHp:()=>100,Terha:{}};
 b.window=b;vm.createContext(b);for(const file of ['rifle-art.js','infantry-fire.js'])vm.runInContext(fs.readFileSync(path.join(assets,file),'utf8'),b,{filename:file});const run=s=>vm.runInContext(s,b),close=(a,c,label)=>assert(Math.abs(a-c)<1e-5,label+': '+a+' != '+c);
 const figureHeights={0:{idle:[897,945,896],fire:[854,907,869]},8:{idle:[897,945,896],fire:[855,874,857]}};
 const renderedHeights={};
 const expected={0:[[607,250],[1086,234],[1529,264]],8:[[571,94],[1037,77],[1524,88]],9:[[951,149],[1294,433]],10:[[1173,133],[1527,415]]};
 for(const type of [0,8,9,10])for(const facing of [-1,1]){
  b.u={id:42,type,f:3,tile:0,rifleFacing:facing,hp:100,level:1};b.fireMotions.clear();painted.length=flashes.length=0;run('sprite(u,pxy(u.tile),999)');let frame=painted.at(-1),profile=run('infantryArtProfile(u)');
  close(frame.args[2]/frame.args[3],frame.im.naturalWidth/frame.im.naturalHeight,'Idle aspect');close(frame.args[1]+frame.args[3]*profile.idleFoot,[0,8].includes(type)?14:20,'Idle feet');
  if(facing===1&&figureHeights[type])renderedHeights[type]={idle:figureHeights[type].idle.reduce((a,c)=>a+c,0)/3*frame.args[3]/frame.im.naturalHeight};
  b.fx=[];b.target={x:120+facing*200,y:180};run('launchShot(u,target,1000)');assert.equal(run('baekRifleFacing(u)'),facing);painted.length=flashes.length=0;run('sprite(u,pxy(u.tile),1000)');frame=painted.at(-1);
  close(frame.args[2]/frame.args[3],frame.im.naturalWidth/frame.im.naturalHeight,'Fire aspect');close(frame.args[1]+frame.args[3]*profile.fireFoot,[0,8].includes(type)?14:20,'Firing feet');
  if(facing===1&&figureHeights[type])renderedHeights[type].fire=figureHeights[type].fire.reduce((a,c)=>a+c,0)/3*frame.args[3]/frame.im.naturalHeight;
  expected[type].forEach(([x,y],j)=>{b.m=profile.muzzles[j];const m=run('infantryMuzzleWorld(u,pxy(u.tile),m)');close(m.x,120+facing*(x/1536-.5)*frame.args[2],'Source muzzle x');close(m.y,177+([0,8].includes(type)?14:20)+frame.args[3]*(y/1024-profile.fireFoot),'Source muzzle y');const effect=type===9?b.fx.filter(e=>e.kind==='infantrySmoke')[j]:type===8?b.fx.filter(e=>e.kind==='baekGrenade')[j]:flashes[j];assert(effect);close(effect.x,m.x,'Effect x');close(effect.y,m.y,'Effect y');if(type===8){close(flashes[j].x,m.x,'Grenade flash x');close(flashes[j].y,m.y,'Grenade flash y')}});
  if(type===9){assert.equal(flashes.length,0);assert(b.fx.filter(e=>e.kind==='infantrySmoke').every(e=>e.angle===(facing===1?0:Math.PI)))}
  if(type===10){assert.equal(flashes.length,2);flashes.length=0;run('sprite(u,pxy(u.tile),1060)');assert.equal(flashes.length,0);run('sprite(u,pxy(u.tile),1070)');assert.equal(flashes.length,2)}
  flashes.length=0;painted.length=0;run('sprite(u,pxy(u.tile),1600)');assert.equal(flashes.length,0);assert.equal(painted.at(-1).im,profile.art.idle);
 }
 for(const pose of ['idle','fire'])close(renderedHeights[8][pose],renderedHeights[0][pose],'Grenadier/rifle visible soldier height '+pose);
 assert.equal(run('infantryArtBottom(infantryArtProfile({f:0,type:0}))'),14,'Baek baseline unchanged');
 assert.equal(run('infantryArtBottom(infantryArtProfile({f:1,type:0}))'),14,'Dante baseline unchanged');
 assert.equal(run('infantryArtProfile({f:0,type:0}).art===baekRifleArt'),true);
 console.log('PASS: original-resolution lossless Ayria art; idle/fire aspect and feet; matched visible rifle/grenade figure sizes at raised infantry baseline; mirrored rifle/grenade/MG flashes and AT smoke; burst timing and idle reset');
}
main().catch(e=>{console.error(e);process.exitCode=1});
