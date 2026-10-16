'use strict';
const globalTerrainArt={};
for(const name of ['mountain-low','mountain-high','mountain-ridge','forest-a','forest-b','cactus','palm'])globalTerrainArt[name]=loadBaekArt('trial-'+name+'.png');
// Biome is determined by the immutable original map, never the current occupier.
function terrainBiome(i){const origin=MAP.tiles[i][0];return origin===3?'cactus':origin===4||origin===5?'palm':'forest'}
function globalTerrainTile(i){const t=tiles[i];return !!t&&t.owner>=0&&t.city<0&&(t.terrain===2||t.terrain===3)}
function globalTerrainProfile(i){const t=tiles[i],seed=(Math.imul(i,1103515245)+12345)>>>0,forest=t.terrain===2,biome=terrainBiome(i);return{seed,forest,biome,name:forest?(biome==='forest'?(seed%3?'forest-a':'forest-b'):biome):seed%4===0?'mountain-high':'mountain-low',variant:seed%4}}
function globalTerrainMountainMask(i){let mask=0;neighbors(i).forEach((j,n)=>{if(tiles[j].owner>=0&&tiles[j].city<0&&tiles[j].terrain===3)mask|=1<<n});return mask}
function globalTerrainBitmap(i){const t=tiles[i],profile=globalTerrainProfile(i),mask=profile.forest?0:globalTerrainMountainMask(i),d=c.width/screenW||1,scale=Math.max(1,Math.min(4,Math.ceil(cam.z*d))),key=['terrain57',t.terrain,t.owner,profile.biome,profile.variant,mask,scale].join(':');let bitmap=getRaster(key);if(bitmap)return bitmap;
 const required=profile.forest?(profile.biome==='forest'?['forest-a','forest-b']:[profile.name]):['mountain-low','mountain-high','mountain-ridge'];if(required.some(n=>!globalTerrainArt[n].idleReady))return null;
 bitmap=document.createElement('canvas');bitmap.width=144*scale;bitmap.height=120*scale;const g=bitmap.getContext('2d');g.scale(scale,scale);g.translate(72,88);
 const stamp=(name,x,y,w)=>{const crop=GLOBAL_TERRAIN_CROPS[name],h=w*crop[3]/crop[2];g.drawImage(globalTerrainArt[name].idle,...crop,x-w/2,y-h,w,h)};
 g.save();g.filter='none';
 if(profile.forest){if(profile.biome==='forest'){stamp(profile.name,-16,3,43);stamp(profile.variant%2?'forest-a':'forest-b',18,21,38)}else{stamp(profile.name,(profile.variant-1.5)*2,22,profile.biome==='palm'?64:56)}}
 else{stamp('mountain-low',0,30,140)}g.restore();
 if(!profile.forest){g.filter='none';stamp(profile.name,(profile.variant-1.5)*2,22,profile.name==='mountain-high'?108:114)}
 g.filter='none';const maskCanvas=document.createElement('canvas');maskCanvas.width=bitmap.width;maskCanvas.height=bitmap.height;maskCanvas.getContext('2d').drawImage(bitmap,0,0);g.save();g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='color';g.fillStyle=factions[t.owner].color;g.fillRect(0,0,bitmap.width,bitmap.height);g.globalCompositeOperation='destination-in';g.drawImage(maskCanvas,0,0);g.restore();maskCanvas.width=maskCanvas.height=0;rememberRaster(key,bitmap);return bitmap;
}
const globalTerrainOriginalDraw=drawCachedTerrain;
drawCachedTerrain=function(i,p){if(!globalTerrainTile(i)||tiles[i].terrain===2&&cam.z<=.55)return globalTerrainOriginalDraw(i,p);const bitmap=globalTerrainBitmap(i);if(!bitmap)return globalTerrainOriginalDraw(i,p);ctx.drawImage(bitmap,p.x-72,p.y-88,144,120)};

Object.assign(window.Terha,{terrainBiome,globalTerrainTile,globalTerrainProfile});
