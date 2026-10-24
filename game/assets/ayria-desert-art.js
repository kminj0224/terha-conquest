'use strict';
// Reuse Dante's exact source geometry and alpha. Cache the sand paint once per
// source frame; battle rendering performs no pixel reads or repeated filtering.
const AYRIA_DESERT_FILTER='brightness(1.7) sepia(1) saturate(1.4)';
const ayriaDesertFrames=new WeakMap();
function ayriaDesertFrame(image){
 if(ayriaDesertFrames.has(image))return ayriaDesertFrames.get(image);
 const canvas=document.createElement('canvas');
 canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
 const paint=canvas.getContext('2d');paint.filter=AYRIA_DESERT_FILTER;
 paint.drawImage(image,0,0);paint.filter='none';
 // Artillery's transparency crop table is keyed by the original source name.
 canvas.src=image.src;canvas.naturalWidth=canvas.width;canvas.naturalHeight=canvas.height;
 ayriaDesertFrames.set(image,canvas);return canvas;
}
function ayriaDesertArt(source){
 const result={idle:null,fire:null,idleReady:false,fireReady:false};
 for(const pose of ['idle','fire']){
  const image=source[pose],ready=()=>{result[pose]=ayriaDesertFrame(image);result[pose+'Ready']=true};
  if(image.complete&&image.naturalWidth>0)ready();else image.addEventListener('load',ready,{once:true});
 }
 return result;
}
const ayriaTankArt=Object.fromEntries(Object.entries(danteTankArt).map(([type,art])=>[type,ayriaDesertArt(art)]));
const ayriaSPArt=ayriaDesertArt(danteSPArt),ayriaMLArt=ayriaDesertArt(danteMLArt);
TOWED_ART[3]={...TOWED_ART[1],idle:ayriaDesertArt(TOWED_ART[1].idle),move:ayriaDesertArt(TOWED_ART[1].move)};
MORTAR_ART[3]={...MORTAR_ART[1],idle:ayriaDesertArt(MORTAR_ART[1].idle),move:ayriaDesertArt(MORTAR_ART[1].move)};
