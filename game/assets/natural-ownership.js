'use strict';
// No pixel reads: offline runs connect visible scenery to its anchor tile.
const NATURAL_OWNERSHIP_COLORS=['#469650','#ba4943','#318fd2','#d2a13c','#93b639','#ae74c5','#74babc'];
let naturalTerritory=null,naturalTerritoryGeneration=-1,naturalOwnershipWork=null;
const ownershipLittleEndian=new Uint8Array(new Uint32Array([1]).buffer)[0]===1;
function fillNaturalOwnership(canvas,meta){
 canvas.width=meta.w;canvas.height=meta.h;const g=canvas.getContext('2d'),pixels=g.createImageData(meta.w,meta.h),out=new Uint32Array(pixels.data.buffer);
 const colors=NATURAL_OWNERSHIP_COLORS.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))),runs=meta.decoded??=atob(meta.runs);let cursor=0;
 for(let n=0;n<runs.length;n+=5){const id=runs.charCodeAt(n)|(runs.charCodeAt(n+1)<<8),alpha=runs.charCodeAt(n+2),count=runs.charCodeAt(n+3)|(runs.charCodeAt(n+4)<<8),owner=id?tiles[id-1]?.owner:-1;let color=0;if(owner>=0&&alpha){const[r,bg,b]=colors[owner];color=ownershipLittleEndian?(r|bg<<8|b<<16|alpha<<24)>>>0:(alpha|b<<8|bg<<16|r<<24)>>>0}out.fill(color,cursor,cursor+count);cursor+=count}
 if(cursor!==out.length)throw Error('Invalid scenery ownership run length');g.putImageData(pixels,0,0);
}
function tintNaturalOwnership(g,canvas,x,y,w,h){g.save();g.globalCompositeOperation='color';g.globalAlpha=.94;g.drawImage(canvas,x,y,w,h);g.globalCompositeOperation='source-over';g.globalAlpha=.10;g.drawImage(canvas,x,y,w,h);g.restore()}
function drawNaturalOverviewOwnership(g){if(!naturalTerritory||naturalTerritoryGeneration!==territoryGeneration){naturalTerritory??=document.createElement('canvas');fillNaturalOwnership(naturalTerritory,NATURAL_OWNERSHIP.far);naturalTerritoryGeneration=territoryGeneration}tintNaturalOwnership(g,naturalTerritory,0,0,WW,HH)}
function drawNaturalRegionOwnership(g,q){const name=q.name.replace('natural-mid','detail').replace('natural-detail','detail'),meta=NATURAL_OWNERSHIP.regions[name]?.[q.name.startsWith('natural-mid')?'mid':'near'];if(!meta)return;naturalOwnershipWork??=document.createElement('canvas');fillNaturalOwnership(naturalOwnershipWork,meta);tintNaturalOwnership(g,naturalOwnershipWork,q.x,q.y,q.w,q.h)}
