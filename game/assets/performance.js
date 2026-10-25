'use strict';
// Frame-only indices must never escape into turn logic or movement mutations.
let renderIndex=null;
const renderUnitLookup=unitAt;unitAt=function(i){return renderIndex&&units===renderIndex.unitsSource?renderIndex.units.get(i):renderUnitLookup(i)};
const renderBaseLookup=baseAt;baseAt=function(i){return renderIndex&&missileBases===renderIndex.basesSource?renderIndex.bases.get(i):renderBaseLookup(i)};
function movingAnimation(id){return renderIndex&&moving===renderIndex.movingSource?renderIndex.moves.get(id):moving.find(m=>m.id===id)}
const renderVisualPosition=unitVisualPosition;unitVisualPosition=function(u,now){if(!renderIndex)return renderVisualPosition(u,now);let p=renderIndex.positions.get(u.id);if(!p){p=renderVisualPosition(u,now);renderIndex.positions.set(u.id,p)}return p};
// The Android WebView spends most frame time repainting large map layers and
// transparent unit sprites. Cap the expensive world pass at 30 FPS there,
// while leaving desktop rendering and turn simulation at their original rate.
const androidFrameInterval=typeof navigator!=='undefined'&&/Android/i.test(navigator.userAgent||'')?1000/30:0;
let lastWorldPaint=-Infinity;
const indexedDraw=draw;draw=function(now){
 if(androidFrameInterval&&now>=lastWorldPaint&&now-lastWorldPaint<androidFrameInterval){
  requestAnimationFrame(draw);
  return;
 }
 lastWorldPaint=now;
 const unitsByTile=new Map(),basesByTile=new Map(),movesById=new Map();
 for(const u of units)if(!u.carriedBy&&u.hp>0&&!unitsByTile.has(u.tile))unitsByTile.set(u.tile,u);
 for(const b of missileBases)if(!basesByTile.has(b.tile))basesByTile.set(b.tile,b);
 for(const m of moving)if(!movesById.has(m.id))movesById.set(m.id,m);
 renderIndex={units:unitsByTile,bases:basesByTile,moves:movesById,positions:new Map(),unitsSource:units,basesSource:missileBases,movingSource:moving};
 try{return indexedDraw(now)}finally{renderIndex=null}
};
let roadSignature='',roadConnections=new Map(),roadBuilds=0;
function cachedCityConnections(q){
 const signature=renderIndex?(renderIndex.roadSignature??=cities.map(c=>c.id+':'+c.origin+':'+c.tile).join('|')):cities.map(c=>c.id+':'+c.origin+':'+c.tile).join('|');
 if(signature!==roadSignature){roadSignature=signature;roadConnections.clear();roadBuilds++;const groups=new Map();for(const c of cities){if(!groups.has(c.origin))groups.set(c.origin,[]);groups.get(c.origin).push(c)}for(const c of cities)roadConnections.set(c.id,groups.get(c.origin).filter(v=>v.id!==c.id).sort((a,b)=>distance(c.tile,a.tile)-distance(c.tile,b.tile)).slice(0,2))}
 return roadConnections.get(q.id)||[];
}
function hasMapScenery(i){const t=tiles[i];return t.city<0&&(t.terrain===3||cam.z>.55&&(t.terrain===2||i%47===0&&MAP.tiles[i][0]>=0))}
// Small shared tree/mountain rasters, not one bitmap per map tile.
const rasterCache=new Map(),imageRasterIds=new WeakMap();let rasterBytes=0,rasterNextId=1;
const RASTER_BUDGET=20*1024*1024;
function rememberRaster(key,canvas){const bytes=canvas.width*canvas.height*4;if(bytes>RASTER_BUDGET)return;while(rasterBytes+bytes>RASTER_BUDGET&&rasterCache.size){const first=rasterCache.keys().next().value,old=rasterCache.get(first);rasterBytes-=old.bytes;rasterCache.delete(first);old.canvas.width=old.canvas.height=0}rasterCache.set(key,{canvas,bytes});rasterBytes+=bytes}
function getRaster(key){const hit=rasterCache.get(key);if(hit){rasterCache.delete(key);rasterCache.set(key,hit);return hit.canvas}return null}
function drawCachedTerrain(i,p){
 const t=tiles[i];if(t.city>=0||t.terrain!==3&&(t.terrain!==2||cam.z<=.55))return;
 const d=c.width/screenW||1,scale=Math.max(1,Math.min(6,Math.ceil(cam.z*d))),key='terrain:'+t.terrain+':'+(t.terrain===2?i%13:0)+':'+scale;
 let bitmap=getRaster(key);if(!bitmap){bitmap=document.createElement('canvas');bitmap.width=80*scale;bitmap.height=64*scale;const g=bitmap.getContext('2d');g.scale(scale,scale);g.translate(40,36);paintTerrainShape(i,{x:0,y:0},g);rememberRaster(key,bitmap)}ctx.drawImage(bitmap,p.x-40,p.y-36,80,64);
}
// Preserve source PNGs; bounded runtime rasters are sized for the current transform.
const nativeMapDrawImage=ctx.drawImage.bind(ctx);ctx.drawImage=function(image,...args){
 if(!image||!image.naturalWidth||![4,8].includes(args.length)||typeof ctx.getTransform!=='function')return nativeMapDrawImage(image,...args);
 const matrix=ctx.getTransform();if(!matrix)return nativeMapDrawImage(image,...args);
 const dest=args.slice(-4),sx=Math.hypot(matrix.a,matrix.b),sy=Math.hypot(matrix.c,matrix.d);
 if(!Number.isFinite(sx)||!Number.isFinite(sy)||sx<=0||sy<=0)return nativeMapDrawImage(image,...args);
 const crop=args.length===8?args.slice(0,4):[0,0,image.naturalWidth,image.naturalHeight];
 const width=Math.max(1,Math.ceil(Math.abs(dest[2])*sx/32)*32),height=Math.max(1,Math.ceil(Math.abs(dest[3])*sy/32)*32);
 if(crop[2]*crop[3]<width*height*4||width*height>1024*1024)return nativeMapDrawImage(image,...args);
 let id=imageRasterIds.get(image);if(!id){id=rasterNextId++;imageRasterIds.set(image,id)}const key='image:'+id+':'+crop.join(',')+':'+width+':'+height;
 let bitmap=getRaster(key);if(!bitmap){bitmap=document.createElement('canvas');bitmap.width=width;bitmap.height=height;bitmap.getContext('2d').drawImage(image,...crop,0,0,width,height);rememberRaster(key,bitmap)}return nativeMapDrawImage(bitmap,...dest);
};
let mapBackground=null,mapBackgroundKey='',backgroundBuilds=0;
function drawCachedMapBackground(){
 const key=[cam.x,cam.y,cam.z,c.width,c.height,coastArtwork.ready].join(':');
 if(c.width*c.height>6*1024*1024){nativeMapDrawImage(worldImg,0,0,WW,HH);drawCoastArtwork(ctx,0,0,WW,HH);return}
 if(!mapBackground||key!==mapBackgroundKey){mapBackgroundKey=key;mapBackground??=document.createElement('canvas');mapBackground.width=c.width;mapBackground.height=c.height;const g=mapBackground.getContext('2d'),d=c.width/screenW;g.setTransform(d,0,0,d,0,0);g.translate(screenW/2,screenH/2);g.scale(cam.z,cam.z);g.translate(-cam.x,-cam.y);g.drawImage(worldImg,0,0,WW,HH);drawCoastArtwork(g,0,0,WW,HH);backgroundBuilds++}
 ctx.save();ctx.setTransform(1,0,0,1,0,0);nativeMapDrawImage(mapBackground,0,0);ctx.restore();
}
function occupiedNavalTiles(now){const occupied=new Set();for(const u of units)if(!u.carriedBy&&u.hp>0&&isNaval(u)){occupied.add(u.tile);const p=unitVisualPosition(u,now);occupied.add(worldTileAt(p.x,p.y))}return occupied}
let threatCache=null,threatCacheTime=-Infinity,threatUnits=null,threatCities=null;
function resetThreatCache(){threatCache=null;threatCacheTime=-Infinity;threatUnits=threatCities=null}
function cachedHansaThreat(now){if(!threatCache||now<threatCacheTime||now-threatCacheTime>=200||threatUnits!==units||threatCities!==cities){threatCache=hansaThreat();threatCacheTime=now;threatUnits=units;threatCities=cities}return threatCache}
let territoryGeneration=0;const performanceTerritory=refreshTerritory;refreshTerritory=function(){const dirty=territoryDirty;performanceTerritory();if(dirty)territoryGeneration++};
const uncachedMini=drawMini;let miniBase=null,miniSignature='',miniTerrain=null;
drawMini=function(){if($('mini').style.display!=='block')return;const m=$('mini');if(m.width!==166)m.width=166;if(m.height!==119)m.height=119;const key=cities.map(q=>q.tile+':'+q.f).join('|')+':'+coastArtwork.ready+':'+territoryGeneration;
 if(!miniBase||miniSignature!==key||miniTerrain!==territoryCanvas||territoryDirty){refreshTerritory();miniSignature=key;miniTerrain=territoryCanvas;miniBase??=document.createElement('canvas');miniBase.width=166;miniBase.height=119;const g=miniBase.getContext('2d');g.drawImage(worldImg,0,0,166,119);drawCoastArtwork(g,0,0,166,119);if(territoryCanvas){g.globalAlpha=.5;g.drawImage(coastArtwork.natural&&naturalTerritory?naturalTerritory:territoryCanvas,0,0,166,119);g.globalAlpha=1}for(const q of cities){const p=pxy(q.tile);g.fillStyle=factions[q.f].color;g.fillRect(p.x/WW*166,p.y/HH*119,2,2)}}const g=m.getContext('2d');g.clearRect(0,0,166,119);g.drawImage(miniBase,0,0);g.strokeStyle='#f3e8bd';g.lineWidth=1;g.strokeRect((cam.x-screenW/2/cam.z)/WW*166,(cam.y-screenH/2/cam.z)/HH*119,screenW/cam.z/WW*166,screenH/cam.z/HH*119);
};
Object.assign(window.Terha,{draw,unitAt,baseAt,unitVisualPosition,movingAnimation,occupiedNavalTiles});
