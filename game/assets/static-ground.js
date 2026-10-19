'use strict';
// Terrain and river geometry are baked into APK PNGs. No sprite painter runs here.
const GROUND_BUDGET=48*1024*1024,groundChunks=new Map();
let groundBytes=0,groundRevision=0,groundView=null,groundViewKey='',groundViewBuilds=0,groundChunkBuilds=0;
function terrainTintColor(f){const h=factions[f].color.slice(1),rgb=[0,2,4].map(n=>parseInt(h.slice(n,n+2),16)),gray=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;return '#'+rgb.map(v=>Math.round(gray+(v-gray)*.42).toString(16).padStart(2,'0')).join('')}
function terrainBiome(i){const f=MAP.tiles[i][0];return f===3?'cactus':f===4||f===5?'palm':'forest'}
const groundOverview={name:'ground-overview',x:0,y:0,w:WW,h:HH,tiles:MAP.tiles.map((_,i)=>i).filter(i=>MAP.tiles[i][0]>=0)};
function groundSignature(meta){return meta.tiles.map(i=>tiles[i].owner).join(',')}
function releaseGroundEntry(entry){entry.disposed=true;for(const image of entry.images||[]){campaignImages.delete(image);image.onload=image.onerror=null;image.src=''}entry.images=null;if(entry.canvas)entry.canvas.width=entry.canvas.height=0;groundBytes-=entry.bytes}
function trimGroundCache(){while(groundBytes>GROUND_BUDGET&&groundChunks.size>1){const name=groundChunks.keys().next().value,entry=groundChunks.get(name);groundChunks.delete(name);releaseGroundEntry(entry)}}
function groundColorPixels(m,meta,w,h){
 const pixels=m.createImageData(w,h),output=new Uint32Array(pixels.data.buffer),little=new Uint8Array(new Uint32Array([1]).buffer)[0]===1;
 const palette=factions.map((_,f)=>{const hex=terrainTintColor(f),r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return little?(r|g<<8|b<<16|255<<24)>>>0:(255|b<<8|g<<16|r<<24)>>>0});
 const encoded=GROUND_COLOR_RUNS[meta.name];if(!encoded)throw Error('Missing terrain colors: '+meta.name);
 const runs=atob(encoded);let cursor=0;
 for(let n=0;n<runs.length;n+=4){const id=runs.charCodeAt(n)|(runs.charCodeAt(n+1)<<8),count=runs.charCodeAt(n+2)|(runs.charCodeAt(n+3)<<8),owner=tiles[id]?.owner;
  if(!count||owner===undefined||cursor+count>output.length)throw Error('Invalid terrain color data: '+meta.name);
  output.fill(owner<0?(little?0xff493412:0x123449ff):palette[owner],cursor,cursor+count);cursor+=count;
 }
 if(cursor!==output.length)throw Error('Terrain color size mismatch: '+meta.name);
 m.putImageData(pixels,0,0);
}
function loadGroundChunk(entry){
 entry.loading=true;entry.failed=false;entry.colorFallback=false;const images=[new Image(),new Image()];entry.images=images;let ready=0;
 const finish=()=>{if(entry.disposed||++ready!==2)return;const meta=entry.meta,w=images[0].naturalWidth,h=images[0].naturalHeight,canvas=document.createElement('canvas'),mask=document.createElement('canvas');canvas.width=mask.width=w;canvas.height=mask.height=h;
  const g=canvas.getContext('2d'),m=mask.getContext('2d');g.drawImage(images[0],0,0);
  try{groundColorPixels(m,meta,w,h);g.globalCompositeOperation='color';g.drawImage(mask,0,0);g.globalCompositeOperation='destination-in';g.drawImage(images[0],0,0)}
  catch(error){g.globalCompositeOperation='copy';g.drawImage(images[0],0,0);entry.colorFallback=true;console.warn('Terrain tint fallback',meta.name,String(error))}
  g.globalCompositeOperation='source-over';g.drawImage(images[1],0,0);mask.width=mask.height=0;
  if(entry.canvas)entry.canvas.width=entry.canvas.height=0;entry.canvas=canvas;entry.signature=groundSignature(meta);entry.generation=territoryGeneration;entry.loading=false;entry.images=null;for(const image of images){campaignImages.delete(image);image.onload=image.onerror=null;image.removeAttribute?image.removeAttribute('src'):image.src=''}groundChunkBuilds++;groundRevision++;
 };
 images.forEach((image,n)=>{image.onload=finish;image.onerror=()=>{campaignImages.delete(image);if(entry.disposed)return;entry.failed=true;entry.loading=false;groundRevision++};image.src=entry.meta.name+(n?'-detail.png':'-terrain.png')});
}
function getGroundChunk(meta){
 let entry=groundChunks.get(meta.name);
 if(entry){groundChunks.delete(meta.name);groundChunks.set(meta.name,entry);if(!entry.loading&&!entry.failed&&entry.generation!==territoryGeneration){const signature=groundSignature(meta);entry.generation=territoryGeneration;if(signature!==entry.signature)loadGroundChunk(entry)}return entry.canvas}
 const scale=meta===groundOverview?GROUND_DATA.overviewScale:GROUND_DATA.scale,bytes=Math.ceil(meta.w*scale)*Math.ceil(meta.h*scale)*4;
 entry={meta,bytes,generation:territoryGeneration,signature:groundSignature(meta),canvas:null,loading:false,disposed:false};groundChunks.set(meta.name,entry);groundBytes+=bytes;trimGroundCache();loadGroundChunk(entry);return null;
}
function drawStaticGround(){
 refreshTerritory();
 const key=[cam.x,cam.y,cam.z,c.width,c.height,coastArtwork.ready,territoryGeneration,groundRevision].join(':');
 if(!groundView||groundViewKey!==key){
  const left=cam.x-screenW/2/cam.z,right=cam.x+screenW/2/cam.z,top=cam.y-screenH/2/cam.z,bottom=cam.y+screenH/2/cam.z;
  let visible=GROUND_DATA.chunks.filter(q=>q.x+q.w>left&&q.x<right&&q.y+q.h>top&&q.y<bottom);if(cam.z<.55||visible.length>14)visible=[groundOverview];
  const images=visible.map(meta=>({meta,image:getGroundChunk(meta)}));
  groundView??=document.createElement('canvas');const d=Math.min(c.width/screenW,Math.sqrt(6*1024*1024/(screenW*screenH)));groundView.width=Math.ceil(screenW*d);groundView.height=Math.ceil(screenH*d);const g=groundView.getContext('2d');g.scale(d,d);g.translate(screenW/2,screenH/2);g.scale(cam.z,cam.z);g.translate(-cam.x,-cam.y);
  g.drawImage(worldImg,0,0,WW,HH);drawCoastArtwork(g,0,0,WW,HH);/* Neutral land underlay, current owner supplies the sole plain-color hue. */if(territoryCanvas){g.save();g.globalAlpha=.74;g.drawImage(territoryCanvas,0,0,WW,HH);g.restore()}
  paintStaticGroundConnections(g);for(const {meta,image}of images)if(image)g.drawImage(image,meta.x,meta.y,meta.w,meta.h);
  groundViewKey=key;groundViewBuilds++;
 }
 ctx.save();ctx.setTransform(1,0,0,1,0,0);nativeMapDrawImage(groundView,0,0,c.width,c.height);ctx.restore();
}
Object.assign(window.Terha,{terrainBiome});

function paintStaticGroundConnections(g){const xmin=Math.max(0,Math.floor((cam.x-screenW/2/cam.z)/S)-2),xmax=Math.min(W-1,Math.ceil((cam.x+screenW/2/cam.z)/S)+2),ymin=Math.max(0,Math.floor((cam.y-screenH/2/cam.z)/V)-2),ymax=Math.min(H-1,Math.ceil((cam.y+screenH/2/cam.z)/V)+2);if(cam.z>.38){g.strokeStyle='#ddd4b54a';g.lineWidth=1.3;g.setLineDash([3,4]);for(const q of cities){if(tiles[q.tile].x<xmin-8||tiles[q.tile].x>xmax+8||tiles[q.tile].y<ymin-8||tiles[q.tile].y>ymax+8)continue;const others=cachedCityConnections(q);for(const a of others){if(distance(q.tile,a.tile)>16)continue;const p=pxy(q.tile),r=pxy(a.tile);g.beginPath();g.moveTo(p.x,p.y);g.lineTo(r.x,r.y);g.stroke()}}g.setLineDash([])}const hansa=cities.find(q=>q.origin===0&&q.capital);if(hansa&&cam.z>.45){const o=tiles[hansa.tile],p=pxy(hansa.tile);for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){let water=false;for(let n=1;n<15;n++){let i=index(o.x+d[0]*n,o.y+d[1]*n);if(i<0)break;if(tiles[i].owner<0)water=true;else if(water){let r=pxy(i);g.strokeStyle='#233a38';g.lineWidth=7;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(r.x,r.y);g.stroke();g.strokeStyle='#a9b4a0';g.lineWidth=3;g.stroke();break}}}}}
