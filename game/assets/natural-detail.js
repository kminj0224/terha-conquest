'use strict';
const NATURAL_DETAIL_BUDGET=80*1024*1024,naturalDetailCache=new Map();
let naturalDetailBytes=0,naturalDetailRevision=0,naturalDetailBuilds=0,naturalDetailEnabled=true,naturalDetailPinned=new Set();
// Selection follows physical output pixels, including high-density displays.
const NATURAL_MID=NATURAL_DETAIL.regions.map(q=>({...q,name:q.name.replace('natural-detail','natural-mid'),pixelWidth:627,pixelHeight:627}));
function naturalDetailLevel(){
 if(!naturalDetailEnabled)return 'far';
 const d=Math.min(c.width/screenW,Math.sqrt(6*1024*1024/(screenW*screenH))),pitch=cam.z*d;
 if(pitch<=.27)return 'far';
 return pitch>.54&&naturalVisibleRegions(NATURAL_DETAIL.regions).length<=6?'near':'mid';
}
function naturalVisibleRegions(regions){const l=cam.x-screenW/2/cam.z,r=cam.x+screenW/2/cam.z,t=cam.y-screenH/2/cam.z,b=cam.y+screenH/2/cam.z;return regions.filter(q=>q.x+q.w>l&&q.x<r&&q.y+q.h>t&&q.y<b)}
function naturalDetailVisible(){const level=naturalDetailLevel();return level==='far'?[]:naturalVisibleRegions(level==='near'?NATURAL_DETAIL.regions:NATURAL_MID)}
function disposeNaturalDetail(e){e.disposed=true;if(e.image){campaignImages.delete(e.image);e.image.onload=e.image.onerror=null;e.image.src='';e.image=null}if(e.ownedCanvas){e.ownedCanvas.width=e.ownedCanvas.height=0;e.ownedCanvas=null}if(e.canvas){e.canvas.width=e.canvas.height=0;naturalDetailBytes-=e.bytes;e.bytes=0;e.canvas=null}}
function trimNaturalDetails(){for(const[n,e]of naturalDetailCache){if(naturalDetailBytes<=NATURAL_DETAIL_BUDGET)break;if(naturalDetailPinned.has(n)||e.loading)continue;naturalDetailCache.delete(n);disposeNaturalDetail(e)}}
function getNaturalDetail(meta){let e=naturalDetailCache.get(meta.name);if(e){naturalDetailCache.delete(meta.name);naturalDetailCache.set(meta.name,e);return e}e={meta,image:new Image(),canvas:null,bytes:0,loading:true,failed:false,disposed:false};naturalDetailCache.set(meta.name,e);const im=e.image;im.onload=()=>{if(e.disposed)return;const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);for(const a of [g.createLinearGradient(0,0,c.width,0),g.createLinearGradient(0,0,0,c.height)]){a.addColorStop(0,'#0000');a.addColorStop(meta.feather,'#000');a.addColorStop(1-meta.feather,'#000');a.addColorStop(1,'#0000');g.globalCompositeOperation='destination-in';g.fillStyle=a;g.fillRect(0,0,c.width,c.height)}g.globalCompositeOperation='source-over';e.canvas=c;e.bytes=c.width*c.height*4;naturalDetailBytes+=e.bytes;e.loading=false;e.image=null;campaignImages.delete(im);im.onload=im.onerror=null;im.src='';naturalDetailBuilds++;naturalDetailRevision++;trimNaturalDetails()};im.onerror=()=>{if(e.disposed)return;e.loading=false;e.failed=true;e.image=null;campaignImages.delete(im);im.onload=im.onerror=null;im.src='';naturalDetailRevision++};im.src=meta.name+'.jpg';return e}
function drawNaturalDetails(g){const v=naturalDetailVisible();naturalDetailPinned=new Set(v.map(q=>q.name));g.save();g.beginPath();g.rect(0,0,WW,HH);g.clip();for(const q of v){const e=getNaturalDetail(q);if(e.canvas){g.save();g.beginPath();g.rect(q.x+q.w*q.feather,q.y+q.h*q.feather,q.w*(1-2*q.feather),q.h*(1-2*q.feather));g.clip();g.drawImage(naturalOwnedDetail(e,q),q.x,q.y,q.w,q.h);g.restore()}}g.restore();trimNaturalDetails()}
function naturalDetailsReady(){return naturalDetailVisible().every(q=>{const e=naturalDetailCache.get(q.name);return e&&!e.loading&&(!!e.canvas||e.failed)})}
