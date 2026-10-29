// Component benchmark. These Canvas timings are not Android device FPS.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(root+'/node_modules/@napi-rs/canvas');
const text=fs.readFileSync(root+'/game/assets/illustrated-combat.js','utf8');
function fn(name){const start=text.indexOf('function '+name+'(');let at=text.indexOf('{',start),depth=1;for(let i=at+1;i<text.length;i++){if(text[i]==='{')depth++;if(text[i]==='}'&&!--depth)return text.slice(start,i+1);}throw Error(name)}
(async()=>{
 const atlas=await loadImage(root+'/game/assets/battlefield-effects.webp');const extras={};for(const name of ['city-flame-soft.webp','wreck-smoke.webp'])extras[name]=await loadImage(root+'/game/assets/'+name);const c=createCanvas(1280,800),ctx=c.getContext('2d'),body=createCanvas(256,192);
 body.getContext('2d').drawImage(atlas,0,0,256,192);
 const b={ctx,S:64,cam:{x:640,y:400,z:1},screenW:1280,screenH:800,battlefieldEffects:{idle:atlas,idleReady:true},cityMaxHp:()=>1000,document:{createElement:()=>createCanvas(128,128)},loadBaekArt:name=>({idle:extras[name]||atlas,idleReady:true})};
 b.nativeMapDrawImage=(...args)=>ctx.drawImage(...args);vm.createContext(b);
 if(text.includes('const EFFECT_ROWS='))vm.runInContext(text.slice(text.indexOf('const EFFECT_ROWS='),text.indexOf('function impactLayers')),b);
 for(const name of ['softEffectTexture','effectFrame','drawImpactSmoke','paintImpact','drawIllustratedWreck'])if(text.includes('function '+name+'('))vm.runInContext(fn(name),b);
 const a=text.indexOf('drawCityFire=function('),end=text.indexOf('\n};',a);vm.runInContext(text.slice(a,end+3),b);
 b.city={hp:0,id:1};b.point={x:640,y:400};b.wreck={x:640,y:400,unitArt:body,wreckArt:body};b.event={x:640,y:400,layers:['explosion']};
 const out={};
 for(const [name,call]of [['cityFire','drawCityFire(city,point,1000+i*33)'],['wreck','drawIllustratedWreck(wreck,.3,1000+i*33)'],['impact','paintImpact(event,.4)']]){
  let calls=0;const original=ctx.drawImage.bind(ctx);ctx.drawImage=(...args)=>{calls++;return original(...args)};
  b.i=0;vm.runInContext(call,b);ctx.getImageData(0,0,1,1);calls=0;
  const times=[];for(let batch=0;batch<7;batch++){
   const t=process.hrtime.bigint();vm.runInContext('for(let i=0;i<100;i++){'+call+'}',b);ctx.getImageData(0,0,1,1);times.push(Number(process.hrtime.bigint()-t)/1e6/100);
  }
  times.sort((a,b)=>a-b);out[name]={microsecondsPerEffect:Math.round(times[3]*1000),drawsPerEffect:calls/700};ctx.drawImage=original;
 }
 console.log(JSON.stringify(out));
})().catch(e=>{console.error(e);process.exit(1)});
