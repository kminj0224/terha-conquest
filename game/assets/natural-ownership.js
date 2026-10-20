'use strict';
// No pixel reads: offline runs connect visible scenery to its anchor tile.
const NATURAL_OWNERSHIP_COLORS=['#87998b','#aa7871','#7b9eb2','#b6a377','#b88f9e','#a58eae','#b6c5c6'];
let naturalTerritory=null,naturalTerritoryGeneration=-1,naturalOwnershipWork=null;
const ownershipLittleEndian=new Uint8Array(new Uint32Array([1]).buffer)[0]===1;
function fillNaturalOwnership(canvas,meta){
 canvas.width=meta.w;canvas.height=meta.h;const g=canvas.getContext('2d'),pixels=g.createImageData(meta.w,meta.h),out=new Uint32Array(pixels.data.buffer);
 const colors=NATURAL_OWNERSHIP_COLORS.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))),runs=atob(meta.runs),ids=meta.tileIds?null:new Set();let cursor=0;
 for(let n=0;n<runs.length;n+=5){const id=runs.charCodeAt(n)|(runs.charCodeAt(n+1)<<8),alpha=runs.charCodeAt(n+2),count=runs.charCodeAt(n+3)|(runs.charCodeAt(n+4)<<8),owner=id?tiles[id-1]?.owner:-1;if(id&&alpha)ids?.add(id-1);let color=0;if(owner>=0&&alpha){const[r,bg,b]=colors[owner];color=ownershipLittleEndian?(r|bg<<8|b<<16|alpha<<24)>>>0:(alpha|b<<8|bg<<16|r<<24)>>>0}out.fill(color,cursor,cursor+count);cursor+=count}
 if(cursor!==out.length)throw Error('Invalid scenery ownership run length');g.putImageData(pixels,0,0);if(ids)meta.tileIds=Array.from(ids);
}
function tintNaturalOwnership(g,canvas,x,y,w,h){g.save();g.globalCompositeOperation='color';g.globalAlpha=.98;g.drawImage(canvas,x,y,w,h);g.globalCompositeOperation='source-over';g.globalAlpha=.04;g.drawImage(canvas,x,y,w,h);g.restore()}
function drawNaturalOverviewOwnership(g){if(!naturalTerritory||naturalTerritoryGeneration!==territoryGeneration){naturalTerritory??=document.createElement('canvas');fillNaturalOwnership(naturalTerritory,NATURAL_OWNERSHIP.far);naturalTerritoryGeneration=territoryGeneration}tintNaturalOwnership(g,naturalTerritory,0,0,WW,HH)}
let naturalOverviewCanvas=null,naturalOverviewGeneration=-1;
function drawNaturalOwnedOverview(g){
 if(!naturalOverviewCanvas||naturalOverviewGeneration!==territoryGeneration){naturalOverviewCanvas??=document.createElement('canvas');naturalOverviewCanvas.width=NATURAL_OWNERSHIP.far.w;naturalOverviewCanvas.height=NATURAL_OWNERSHIP.far.h;const p=naturalOverviewCanvas.getContext('2d');p.scale(naturalOverviewCanvas.width/WW,naturalOverviewCanvas.height/HH);p.drawImage(coastArtwork.image,0,0,WW,HH);drawNaturalOverviewOwnership(p);naturalOverviewGeneration=territoryGeneration}
 g.drawImage(naturalOverviewCanvas,0,0,WW,HH);
}
// Cache the finished bitmap with its source. Camera motion only draws this bitmap.
// Invalidate by semantic anchor owners, including objects extending into adjacent regions.
let naturalOwnershipBuilds=0;
function naturalOwnedDetail(e,q){
 if(e.ownedCanvas&&e.ownedGeneration===territoryGeneration)return e.ownedCanvas;
 const name=q.name.replace('natural-mid','detail').replace('natural-detail','detail'),meta=NATURAL_OWNERSHIP.regions[name]?.[q.name.startsWith('natural-mid')?'mid':'near'];if(!meta)return e.canvas;
 const signature=meta.tileIds?.map(i=>tiles[i].owner).join(',');
 e.ownedGeneration=territoryGeneration;
 if(e.ownedCanvas&&signature===e.ownedSignature)return e.ownedCanvas;
 if(!e.ownedCanvas){e.ownedCanvas=document.createElement('canvas');const bytes=e.canvas.width*e.canvas.height*4;e.bytes+=bytes;naturalDetailBytes+=bytes}
 const image=e.ownedCanvas;image.width=e.canvas.width;image.height=e.canvas.height;const g=image.getContext('2d');g.drawImage(e.canvas,0,0);
 naturalOwnershipWork??=document.createElement('canvas');fillNaturalOwnership(naturalOwnershipWork,meta);tintNaturalOwnership(g,naturalOwnershipWork,0,0,image.width,image.height);naturalOwnershipWork.width=naturalOwnershipWork.height=0;
 // Original feather alpha remains authoritative at every resolution.
 g.globalCompositeOperation='destination-in';g.drawImage(e.canvas,0,0);g.globalCompositeOperation='source-over';
 e.ownedSignature=meta.tileIds.map(i=>tiles[i].owner).join(',');naturalOwnershipBuilds++;return image;
}
