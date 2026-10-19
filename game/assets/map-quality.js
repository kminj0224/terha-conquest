'use strict';
// World-wide, deterministic atmospheric overlay: one prerendered bitmap, no per-frame noise.
// The coastline is inferred from the actual world artwork, not hex borders.
const MAP_WATER_DETAIL_SCALE=5;
let mapWaterDetail=null,mapWaterDetailFailed=false;
function mapWaterHash(x,y){
 let v=Math.sin(x*127.1+y*311.7)*43758.5453123;
 return v-Math.floor(v);
}
function mapWaterNoise(x,y){
 const ix=Math.floor(x),iy=Math.floor(y),a=x-ix,b=y-iy;
 const u=a*a*(3-2*a),v=b*b*(3-2*b);
 const n00=mapWaterHash(ix,iy),n10=mapWaterHash(ix+1,iy);
 const n01=mapWaterHash(ix,iy+1),n11=mapWaterHash(ix+1,iy+1);
 return (n00+(n10-n00)*u)*(1-v)+(n01+(n11-n01)*u)*v;
}
function prepareMapWaterDetail(){
 if(mapWaterDetail||mapWaterDetailFailed||!worldImg.complete||!worldImg.naturalWidth)return;
 try{
  const scale=MAP_WATER_DETAIL_SCALE,w=Math.ceil(WW/scale),h=Math.ceil(HH/scale),count=w*h;
  const source=document.createElement('canvas');source.width=w;source.height=h;
  const sg=source.getContext('2d',{willReadFrequently:true});
  sg.drawImage(worldImg,0,0,w,h);
  const raw=sg.getImageData(0,0,w,h),src=raw.data;
  const water=new Uint8Array(count),distance=new Uint16Array(count);
  // Snow, sand, greenery and stone must never receive a marine overlay.
  // Work from the painted geography so surf follows bays and small islands.
  for(let k=0,p=0;k<count;k++,p+=4){
   const r=src[p],g=src[p+1],b=src[p+2];
   const sea=r<111&&g<192&&b>47&&b-r>12&&b>=g*.84&&(g-r>10||b-r>28);
   water[k]=sea?1:0;distance[k]=sea?32000:0;
  }
  // Two-pass chamfer distance field keeps the foam aligned with the shore,
  // even across adjacent 512px scenery chunks.
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const k=y*w+x;if(!water[k])continue;let d=distance[k];
   if(x)d=Math.min(d,distance[k-1]+3);
   if(y){d=Math.min(d,distance[k-w]+3);if(x)d=Math.min(d,distance[k-w-1]+4);
    if(x+1<w)d=Math.min(d,distance[k-w+1]+4);}
   distance[k]=d;
  }
  for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){
   const k=y*w+x;if(!water[k])continue;let d=distance[k];
   if(x+1<w)d=Math.min(d,distance[k+1]+3);
   if(y+1<h){d=Math.min(d,distance[k+w]+3);if(x)d=Math.min(d,distance[k+w-1]+4);
    if(x+1<w)d=Math.min(d,distance[k+w+1]+4);}
   distance[k]=d;
  }
  const out=sg.createImageData(w,h),pixels=out.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const k=y*w+x;if(!water[k])continue;
   const p=k*4,shore=distance[k]/3;
   const broad=mapWaterNoise(x*.021,y*.023);
   const small=mapWaterNoise(x*.12+21.3,y*.11);
   const ripples=Math.sin(x*.095+y*.054+broad*4.6)*.5+.5;
   let r=19+18*broad+7*small,g=74+34*broad+12*small,b=99+36*broad+11*small;
   let alpha=42+20*ripples+11*small;
   if(shore<22){
    const fade=Math.max(0,1-shore/22);
    const shallows=fade*(.64+.36*broad);
    r+=22*shallows;g+=42*shallows;b+=41*shallows;alpha+=16*fade;
    // Intermittent lace-like foam bands, with irregular width and gaps.
    const bend=(broad-.5)*5.2+(small-.5)*1.7;
    const d=shore+bend;
    const band=Math.max(0,1-Math.abs(d-2.0)/1.55)*.98+
     Math.max(0,1-Math.abs(d-7.5)/1.25)*.72+
     Math.max(0,1-Math.abs(d-14)/.85)*.32;
    const breaks=.42+.58*mapWaterNoise(x*.054+37,y*.069-6);
    const foam=Math.min(1,band*breaks*fade*1.9);
    r+=(226-r)*foam;g+=(241-g)*foam;b+=(240-b)*foam;
    alpha=Math.min(226,alpha+foam*172);
   }else{
    // Long, muted surface ripples at sea, without sharp repeating stripes.
    const cap=Math.max(0,ripples-.85)*mapWaterNoise(x*.052+8,y*.051-7);
    r+=60*cap;g+=80*cap;b+=79*cap;alpha+=35*cap;
   }
   pixels[p]=r;pixels[p+1]=g;pixels[p+2]=b;pixels[p+3]=alpha;
  }
  sg.clearRect(0,0,w,h);sg.putImageData(out,0,0);
  mapWaterDetail=source;
 }catch(e){mapWaterDetailFailed=true;console.warn('Map water detail unavailable',String(e));}
}
function paintMapAtmosphere(g){
 prepareMapWaterDetail();
 if(mapWaterDetail){
  g.save();g.imageSmoothingEnabled=true;
  g.drawImage(mapWaterDetail,0,0,WW,HH);g.restore();
 }
}
// The detailed drainage geometry is independent of territory ownership.
// Draw after the baked earth/vegetation: river water covers stray clipped
// foliage pixels along its channel while preserving the original terrain.
function paintMapRiverFinish(g){
 if(typeof paintRiverReaches!=='function')return;
 g.save();paintRiverReaches(g,false,1);g.restore();
}
Object.assign(window.Terha,{paintMapAtmosphere,paintMapRiverFinish});
