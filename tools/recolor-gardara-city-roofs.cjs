'use strict';
// Derive city variants from the original pixels. No geometry, alpha or layout changes.
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../game/assets');
(async()=>{
 for(const key of ['small','3','4','5']){
  const image=await loadImage(path.join(root,`baek-city-${key}.png`)),canvas=createCanvas(image.width,image.height),g=canvas.getContext('2d');g.drawImage(image,0,0);
  const pixels=g.getImageData(0,0,image.width,image.height),d=pixels.data;let changed=0;
  const candidate=new Uint8Array(image.width*image.height),seen=new Uint8Array(candidate.length),roofMask=new Uint8Array(candidate.length);
  for(let p=0;p<candidate.length;p++){const i=p*4,r=d[i],green=d[i+1],b=d[i+2];candidate[p]=d[i+3]>240&&green>r*1.08&&green>b*1.04&&b>=green*.43?1:0}
  for(let p=0;p<candidate.length;p++){if(seen[p]||!candidate[p])continue;const q=[p];seen[p]=1;for(let k=0;k<q.length;k++){const v=q[k],x=v%image.width,y=Math.floor(v/image.width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=image.width||yy<0||yy>=image.height)continue;const j=yy*image.width+xx;if(!seen[j]&&candidate[j]){seen[j]=1;q.push(j)}}}if(q.length>=200)for(const v of q)roofMask[v]=1}
  for(let i=0;i<d.length;i+=4){const r=d[i],green=d[i+1],b=d[i+2];
   const roof=roofMask[i/4];
   if(!roof)continue;
   const l=.2126*r+.7152*green+.0722*b,v=Math.round(l*.55);d[i]=Math.max(0,v-1);d[i+1]=v;d[i+2]=Math.min(255,v+3);changed++;
  }
  g.putImageData(pixels,0,0);fs.writeFileSync(path.join(root,`gardara-city-${key}.png`),canvas.toBuffer('image/png'));console.log(key,{changed,width:image.width,height:image.height});
 }
})().catch(e=>{console.error(e);process.exit(1)});
