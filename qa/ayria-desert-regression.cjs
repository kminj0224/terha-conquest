'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas'),root=path.resolve(__dirname,'../game/assets');
async function main(){
 const names=['tank','tank-light','tank-elite','sp-idle','sp-fire','ml-idle','ml-fire','towed-idle','towed-move','mortar-idle','mortar-move'].map(n=>'dante-'+n+'.png');
 const decoded=new Map();for(const n of names)decoded.set(n,await loadImage(path.join(root,n)));
 let created=0;const nativeContexts=new WeakMap(),draws=[];
 function canvas(w=640,h=480){const c=createCanvas(w,h),g=c.getContext('2d');nativeContexts.set(c,g);c.getContext=()=>new Proxy(g,{get(o,k){if(k==='getImageData')return()=>{throw Error('Runtime pixel read')};if(k==='drawImage')return(im,...args)=>{draws.push({im,args});o.drawImage(im.native||im,...args)};const v=o[k];return typeof v==='function'?v.bind(o):v},set(o,k,v){o[k]=v;return true}});return c}
 const scene=canvas(),g=scene.getContext('2d'),noop=()=>{},moves=new Map();
 function loadBaekArt(idle,fire=idle){const frame=n=>{const native=decoded.get(n);return{native,src:n,complete:!!native,naturalWidth:native?.width||0,naturalHeight:native?.height||0,addEventListener:noop}};const i=frame(idle);return{idle:i,fire:fire===idle?i:frame(fire),idleReady:!!i.native,fireReady:!!decoded.get(fire)}}
 const b={loadBaekArt,document:{createElement:()=>{created++;return canvas()}},ctx:g,beginAim:noop,moveUnit:noop,launchShot:()=>({x:0,y:0}),targetExplosions:noop,sprite:()=>{throw Error('Unexpected fallback')},setup:noop,migrateArmy:noop,pxy:()=>({x:120,y:180}),movingAnimation:id=>moves.get(id),fireMotions:new Map(),fx:[],performance:{now:()=>1000},sound:false,setTimeout:noop,audioShot:noop,save:noop,baekTankFacing:u=>u.tankFacing||1,baekTankRecoil:()=>0,beginLargeUnitBody:noop,endLargeUnitBody:noop,poly:noop,circle:noop,rect:noop,line:noop,cam:{z:.4},Terha:{}};b.window=b;vm.createContext(b);const run=s=>vm.runInContext(s,b);
 for(const n of ['dante-tank-art.js','artillery-art.js','towed-art.js','artillery-alignment.js','mortar-art.js','ayria-desert-art.js'])vm.runInContext(fs.readFileSync(path.join(root,n),'utf8'),b,{filename:n});
 assert.equal(created,11,'One cached canvas per source frame');
 const arts=run('[...Object.values(ayriaTankArt),ayriaSPArt,ayriaMLArt,TOWED_ART[3].idle,TOWED_ART[3].move,MORTAR_ART[3].idle,MORTAR_ART[3].move]');
 const frames=new Set(arts.flatMap(a=>[a.idle,a.fire]));assert.equal(frames.size,11);
 for(const frame of frames){const source=decoded.get(frame.src);assert(source,frame.src);assert.equal(frame.width,source.width);assert.equal(frame.height,source.height);const original=createCanvas(source.width,source.height),p=original.getContext('2d');p.drawImage(source,0,0);const a=p.getImageData(0,0,source.width,source.height).data,c=nativeContexts.get(frame).getImageData(0,0,frame.width,frame.height).data;let gray=0,warm=0;
  for(let i=0;i<a.length;i+=4*113){assert(Math.abs(a[i+3]-c[i+3])<=1,frame.src+' alpha changed');const range=Math.max(a[i],a[i+1],a[i+2])-Math.min(a[i],a[i+1],a[i+2]);if(a[i+3]>=240&&range<20&&a[i]>30&&a[i]<100){gray++;if(c[i]>c[i+1]&&c[i+1]>c[i+2]&&c[i]>a[i])warm++}}
  assert(gray>20&&warm/gray>.9,frame.src+' lacks sand paint');b.frameSource=run('danteTankArt[1].idle');assert.equal(run('ayriaDesertFrame(frameSource)'),run('ayriaTankArt[1].idle'));
 }
 assert.equal(created,11,'Repeated use must reuse cached paint');
 for(const type of [1,13,14,2,3,16,15])for(const facing of [-1,1])for(const pose of ['idle','fire','move']){
  const painted=[];for(const faction of [1,3]){b.u={id:42,f:faction,type,tile:0,tankFacing:facing,artilleryFacing:facing,hp:100,level:1};b.fireMotions.clear();moves.clear();if(pose==='fire')b.fireMotions.set(42,{start:1000,duration:1450});if(pose==='move')moves.set(42,{start:1000,duration:1000,from:{x:120,y:180},to:{x:200,y:180}});draws.length=0;run('sprite(u,pxy(0),1100)');assert.equal(draws.length,1);painted.push(draws[0]);}
  assert.deepEqual(painted[1].args,painted[0].args,'Dante/Ayria geometry '+type+'/'+pose);assert.equal(painted[1].im.src,painted[0].im.src);assert.notEqual(painted[1].im,painted[0].im,'Ayria requires separate sand frame');
  const fn=[1,13,14].includes(type)?'danteTankMuzzle':type===16?'towedMuzzle':type===15?'mortarMuzzle':'baekArtilleryMuzzle';const points=[];for(const faction of [1,3]){b.u.f=faction;points.push(JSON.stringify(run(fn+'(u,pxy(0))')))}assert.equal(points[1],points[0],'Dante/Ayria muzzle '+type);
 }
 assert(!run('isDanteTank({f:0,type:1})'));assert(!run('isDanteTank({f:2,type:1})'));
 console.log('PASS: 11 cached desert frames retain source alpha/dimensions; 3 tank and 4 artillery types reuse Dante geometry/muzzles in both facings and idle/fire/travel; no runtime pixel reads');
}
main().catch(e=>{console.error(e);process.exitCode=1});
