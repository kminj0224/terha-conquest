'use strict';
// Offline only. Every variant is a pure function of its existing gameplay tile.
const {createCanvas}=require('@napi-rs/canvas'),crypto=require('crypto');
const clamp=n=>Math.max(0,Math.min(1,n));
function noise(id,salt){let x=Math.imul(id+1,374761393)^Math.imul(salt+7,668265263);x=Math.imul(x^(x>>>13),1274126177);return((x^(x>>>16))>>>0)/4294967295}
module.exports=function(geo,assets,{sdf,riverDistance,cities}){
 const cache=new Map(),records=new Map();
 function make(p){
  if(cache.has(p.tile)){const hit=cache.get(p.tile);cache.delete(p.tile);cache.set(p.tile,hit);return hit}
  const tile=geo.tiles[p.tile],dense=p.terrain===2&&tile.owner===4;
  const paint=dense?{...p,x:tile.x,y:tile.y+27.715,w:85.3334,h:55.43}:p;
  const w=256,h=Math.max(96,Math.min(320,Math.round(w*paint.h/paint.w))),raw=createCanvas(w,h),g=raw.getContext('2d');
  const names=p.biome==='snow'?['mountain-snow-low','mountain-snow-high']:['mountain-low','mountain-high','mountain-ridge'];
  const sourceName=p.terrain===3?names[Math.floor(noise(p.tile,1)*names.length)%names.length]:p.asset,a=assets[sourceName];
  const mirror=noise(p.tile,2)>.5,phase=noise(p.tile,3)*Math.PI*2,warp=.02+noise(p.tile,4)*.045;
  function stamp(asset,x,y,ww,hh,flip){g.save();if(flip){g.translate(x+ww,y);g.scale(-1,1);g.drawImage(asset.im,...asset.crop,0,0,ww,hh)}else g.drawImage(asset.im,...asset.crop,x,y,ww,hh);g.restore()}
  const extraGroups=p.terrain===2&&!dense?1+Math.floor(noise(p.tile,410)*3):0;
  if(dense){
   // Broadleaf understorey closes gaps; palm crowns rise through the canopy.
   for(let row=0;row<5;row++)for(let col=0;col<7;col++){
    const n=row*7+col,xx=(col+.12+noise(p.tile,n+20)*.72)/7*w,yy=(row+.2+noise(p.tile,n+70)*.7)/5*h;
    const ww=w*(.24+noise(p.tile,n+110)*.17),hh=ww*(.54+noise(p.tile,n+150)*.24);
    stamp(assets.temperate,xx-ww/2,yy-hh/2,ww,hh,noise(p.tile,n+190)>.5);
   }
   for(let n=0;n<13;n++){const ww=w*(.22+noise(p.tile,n+250)*.14),hh=ww*.92,x=noise(p.tile,n+280)*w,y=noise(p.tile,n+310)*h;stamp(assets.palm,x-ww/2,y-hh/2,ww,hh,noise(p.tile,n+350)>.5)}
  }else{
   g.save();if(mirror){g.translate(w,0);g.scale(-1,1)}
   const strips=64;
   function u(t){return t+warp*Math.sin(Math.PI*t)*Math.sin(t*Math.PI*2+phase)}
   for(let n=0;n<strips;n++){const x=n/strips,x1=(n+1)/strips,sx=u(x),sw=u(x1)-sx,relief=p.terrain===3?.04+.055*(1+Math.sin(x*Math.PI*2+phase)):.015+.025*(1+Math.sin(x*Math.PI*3+phase)),dy=h*relief;
    g.drawImage(a.im,a.crop[0]+sx*a.crop[2],a.crop[1],sw*a.crop[2],a.crop[3],x*w,dy,w/strips,h-dy);
   }g.restore();
   for(let n=0;n<extraGroups;n++){const ww=w*(.40+noise(p.tile,n+430)*.25),hh=h*ww/w,x=(w-ww)*noise(p.tile,n+460),y=(h-hh)*(.2+.8*noise(p.tile,n+490));stamp(a,x,y,ww,hh,noise(p.tile,n+520)>.5)}
  }
  const d=g.getImageData(0,0,w,h),snow=createCanvas(w,h),sg=snow.getContext('2d'),sd=sg.createImageData(w,h);
  const base=p.biome==='barren'?[140,132,121]:p.biome==='desert'?[184,171,131]:p.biome==='tropical'?[166,178,145]:[178,179,157];
  const nearCities=dense?cities.filter(q=>Math.abs(q.x-tile.x)<150&&Math.abs(q.cy-tile.y)<150):[];
  let coverage=0,snowPixels=0,eligible=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;let opacity=d.data[i+3];
   if(dense){const wx=paint.x-paint.w/2+(x+.5)/w*paint.w,wy=paint.y-paint.h+(y+.5)/h*paint.h,dx=Math.abs(wx-tile.x),dy=Math.abs(wy-tile.y),inside=dx<=42.6667&&dy<=27.715&&dx/42.6667+dy/55.43<=1;
    if(!inside||sdf(wx,wy)<3||riverDistance(wx,wy)<4||nearCities.some(q=>((wx-q.x)/q.rx)**2+((wy-q.cy)/q.ry)**2<1.08)){d.data[i+3]=0;continue}eligible++;
    const edge=Math.min(27.715-dy,(1-dx/42.6667-dy/55.43)*38);opacity*=clamp(edge/.65);d.data[i+3]=opacity;
   }
   if(!opacity)continue;
   const r=d.data[i],gg=d.data[i+1],b=d.data[i+2],lum=r*.2126+gg*.7152+b*.0722,lo=Math.min(r,gg,b),hi=Math.max(r,gg,b);
   let ice=p.biome==='snow'?clamp((lo-145)/55)*clamp((58-hi+lo)/25):0;if(ice>.9)ice=1;
   const shade=p.terrain===3?.54+lum/255*.70:.63+lum/255*.51;
   for(let k=0;k<3;k++)d.data[i+k]=base[k]*shade*(1-ice)+(238+lum*.05)*ice;
   sd.data[i]=sd.data[i+1]=sd.data[i+2]=255;sd.data[i+3]=opacity*ice;
   if(opacity>64)coverage++;if(ice===1&&opacity>240)snowPixels++;
  }
  g.putImageData(d,0,0);sg.putImageData(sd,0,0);
  const art={im:raw,crop:[0,0,w,h],snowMask:snow},result={paint,art};
  records.set(p.tile,{tile:p.tile,terrain:p.terrain,source:sourceName,mirror,warp,phase,dense,foliageGroups:dense?48:1+extraGroups,coverage,eligible,snowPixels,hash:crypto.createHash('sha256').update(d.data).digest('hex'),paint:{x:paint.x,y:paint.y,w:paint.w,h:paint.h},anchorX:p.anchorX,anchorY:p.anchorY});
  cache.set(p.tile,result);if(cache.size>96){const id=cache.keys().next().value,e=cache.get(id);e.art.im.width=e.art.im.height=e.art.snowMask.width=e.art.snowMask.height=0;cache.delete(id)}return result;
 }
 return{make,report:()=>Array.from(records.values()).sort((a,b)=>a.tile-b.tile)};
};
