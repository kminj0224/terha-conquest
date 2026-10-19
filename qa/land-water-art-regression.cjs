'use strict';
/* Prevent a regression where cold-coloured NATIONAL LAND becomes navy ocean. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {loadImage,createCanvas}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../game/assets');
const map=JSON.parse(fs.readFileSync(path.join(root,'map.json'),'utf8'));
const names=['Baekyang','Dante','Stetopia','Airia','Ranna','Nakwol','Cielrun'];
assert.equal(map.w,112);assert.equal(map.h,84);assert.equal(map.tiles.length,112*84);

const network=vm.runInNewContext(fs.readFileSync(path.join(root,'river-data.js'),'utf8')+';RIVER_NETWORK',{});
const riverSegments=[];
for(const reach of network.reaches)for(let i=0;i<reach.points.length-1;i++){
 const [ax,ay]=reach.points[i],[bx,by]=reach.points[i+1];
 const r=Math.max(reach.widths[i],reach.widths[i+1])+28;
 riverSegments.push({ax,ay,dx:bx-ax,dy:by-ay,r2:r*r,
  minX:Math.min(ax,bx)-r,maxX:Math.max(ax,bx)+r,
  minY:Math.min(ay,by)-r,maxY:Math.max(ay,by)+r});
}
function nearPaintedRiver(x,y){
 for(const s of riverSegments){
  if(x<s.minX||x>s.maxX||y<s.minY||y>s.maxY)continue;
  const a=x-s.ax,b=y-s.ay,t=Math.max(0,Math.min(1,(a*s.dx+b*s.dy)/(s.dx*s.dx+s.dy*s.dy||1)));
  const dx=a-t*s.dx,dy=b-t*s.dy;
  if(dx*dx+dy*dy<=s.r2)return true;
 }
 return false;
}
(async()=>{
 const [old,changed]=await Promise.all(['world-clean.png','world-painted.png'].map(n=>loadImage(path.join(root,n))));
 const ww=112*64+64/3,hh=84*55.43+55.43/2;
 const w=changed.width,h=changed.height;
 assert(w>5000&&h>3000,'The full world map must be painted at high resolution');
 const c=createCanvas(w,h),g=c.getContext('2d',{willReadFrequently:true});
 g.drawImage(old,0,0,w,h);
 const orig=g.getImageData(0,0,w,h).data;
 g.clearRect(0,0,w,h);g.drawImage(changed,0,0,w,h);
 const dst=g.getImageData(0,0,w,h).data;
 const stats=names.map(name=>({name,original:0,unchanged:0,changed:0,riverPixels:0,unexplained:0}));
 let seaChanged=0,seaChecked=0,overall=0,match=0;
 const unexpected=[];
 // Sample nine spots strictly inside each immutable land polygon.
 // Major rivers are correctly painted as water on land, so the allowable
 // 1-2% of mismatches represents real river beds, never entire countries.
 const positions=[[0,0],[9,0],[-9,0],[0,9],[0,-9],[13,6],[-13,6],[13,-6],[-13,-6]];
 for(let i=0;i<map.tiles.length;i++){
  const faction=map.tiles[i][0],x=(i%112+2/3)*64,y=(Math.floor(i/112)+.5+.5*((i%112)&1))*55.43;
  if(faction<-1||faction>6)throw Error('Invalid owner '+faction+' at '+i);
  for(const [ox,oy] of positions){
   const px=Math.round((x+ox)*w/ww),py=Math.round((y+oy)*h/hh);
   if(px<0||py<0||px>=w||py>=h)continue;
   const p=(py*w+px)*4;
   const same=Math.max(Math.abs(orig[p]-dst[p]),Math.abs(orig[p+1]-dst[p+1]),Math.abs(orig[p+2]-dst[p+2]))<=2;
   if(faction>=0){
    stats[faction].original++;overall++;
    if(same){stats[faction].unchanged++;match++}
    else{
     stats[faction].changed++;
     // River banks may deliberately recolor land; ocean may never do so.
     if(nearPaintedRiver(x+ox,y+oy))stats[faction].riverPixels++;
     else{stats[faction].unexplained++;if(unexpected.length<24)unexpected.push({faction,i,x:x+ox,y:y+oy});}
    }
   }else{seaChecked++;if(!same)seaChanged++}
  }
 }
 for(const stat of stats){
  const untouched=stat.original-stat.riverPixels;
  assert(stat.original>900,'Too few land samples: '+stat.name);
  assert(stat.unexplained===0,stat.name+' has WATER-coloured LAND pixels outside rivers: '+JSON.stringify({stat,unexpected}));
 }
 assert(unexpected.length===0,'Sea paint contaminated national land outside real rivers');
 assert(seaChanged>600,'Ocean paint was lost');
 console.log('PASS nation land pigments protected: '+JSON.stringify({
  landSamples:overall,landUnchanged:match,landUnchangedPct:Math.round(match/overall*10000)/100,
  seaPaintedCenters:seaChanged,seaChecked,nations:stats.map(s=>({
   name:s.name,landColorPreservedPct:Math.round((s.unchanged+s.riverPixels)/s.original*10000)/100,
   riverOnlyDifferences:s.riverPixels,
   landSamples:s.original
  }))
 }));
})().catch(e=>{console.error(e);process.exitCode=1});
