'use strict';
/*
 * Terha Conquest: geographically exact, *baked* world illustration.
 *
 * Repaints the original source map itself at near-native resolution.  It does
 * not place a hex halo/FX canvas over the running game.  The saved PNG owns
 * the pigments of the sea, wet beaches, snow and rivers at every world pixel.
 * Gameplay topology, borders, settlement coordinates and land occupancy do
 * not change.  Deterministic output: identical input => identical artwork.
 */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.resolve(__dirname,'../game/assets');
const W_WORLD=112*64+64/3,H_WORLD=84*55.43+55.43/2;
const SCALE=.84, MAX=65530;
const clamp=(a,l=0,h=255)=>a<l?l:a>h?h:a;
const mix=(a,b,t)=>a*(1-t)+b*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const hash=(x,y,seed=0)=>{let v=Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(seed|0,1274126177);v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967295};
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy);
 return mix(mix(hash(ix,iy),hash(ix+1,iy),u),mix(hash(ix,iy+1),hash(ix+1,iy+1),u),v)}
function ridge(v){return 1-Math.abs(v*2-1)}
function distanceField(mask,w,h,nearestSea){
 const d=new Uint16Array(w*h);
 for(let k=0;k<d.length;k++)d[k]=(mask[k]===nearestSea)?0:MAX;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=y*w+x;if(!d[k])continue;let a=d[k];
  if(x)a=Math.min(a,d[k-1]+3);
  if(y){a=Math.min(a,d[k-w]+3);
   if(x)a=Math.min(a,d[k-w-1]+4);
   if(x+1<w)a=Math.min(a,d[k-w+1]+4)}
  d[k]=a;
 }
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){
  const k=y*w+x;if(!d[k])continue;let a=d[k];
  if(x+1<w)a=Math.min(a,d[k+1]+3);
  if(y+1<h){a=Math.min(a,d[k+w]+3);
   if(x)a=Math.min(a,d[k+w-1]+4);
   if(x+1<w)a=Math.min(a,d[k+w+1]+4)}
  d[k]=a;
 }
 return d;
}
function colorize(base,mask,seaDist,landDist,w,h){
 const original=base.data,out=new Uint8ClampedArray(original.length);
 let shorePixels=0,waterPixels=0,snowPixels=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const k=y*w+x,p=k*4,wet=mask[k]===1,r=original[p],g=original[p+1],b=original[p+2];
  const X=x/SCALE,Y=y/SCALE;
  const big=noise(X*.0047,Y*.0045),mid=noise(X*.017+11,Y*.019+3),fine=noise(X*.072,Y*.083),
       tiny=noise(X*.31+49,Y*.26-19),flow=noise(X*.009+3,Y*.011+7);
  let R=r,G=g,B=b;
  if(wet){
   waterPixels++;
   const d=landDist[k]/(3*SCALE);
   const depth=smooth((d-2)/95);
   // Painted navy swells: broad flowing shapes, crosscurrents and broken capillary highlights.
   const folded=X*.020+14*flow+Math.sin(Y*.012+big*4)*2;
   const current=Math.sin(folded+Y*.018+7*mid)*.52+Math.sin(Y*.028-X*.009+mid*7)*.24;
   const wave=ridge(noise(X*.08+4*mid,Y*.025+3*flow));
   const swell=(big-.5)*27+(mid-.5)*19+current*8+(fine-.5)*8;
   const baseR=18+swell*.49,baseG=91+swell,baseB=122+swell*1.15;
   const deepR=9+swell*.55,deepG=54+swell*.80,deepB=82+swell*.96;
   R=mix(baseR,deepR,depth);G=mix(baseG,deepG,depth);B=mix(baseB,deepB,depth);
   const shoal=(1-depth)*(.65+.35*mid);
   R+=shoal*13;G+=shoal*27;B+=shoal*28;
   // Dark wave troughs and light slivers are pigmented directly into this PNG.
   const shimmer=(Math.pow(Math.max(0,current*.75+wave*.35-.47),3))*32;
   R+=shimmer*.68;G+=shimmer;B+=shimmer*1.2;
   if(d<51){
    // An irregular wet shoreline, never a white outline stroke or glow.
    const warp=(noise(X*.035,Y*.041)-.5)*8+(fine-.5)*2.8;
    const warped=d+warp*(.25+.75*smooth(d/5));
    const bands=[
      [2.0,1.7,.82],[7.8,1.55,.56],[14.6,1.3,.44],[23.9,1.0,.22],[36,.85,.1]
    ];
    const gap=smooth((noise(X*.078+51,Y*.071-36)-.25)/.53);
    const lace=smooth((noise(X*.19,Y*.21)-.25)/.68);
    let foam=0;
    for(const [at,width,power] of bands){
      let t=Math.max(0,1-Math.abs(warped-at)/width);
      foam=Math.max(foam,t*power*(.36+.64*gap)*(.72+.28*lace));
    }
    const flecks=(fine>.73&&tiny>.48?(.12+.2*gap)*(1-smooth(d/42)):0);
    foam=clamp(foam+flecks,0,.94);
    R=mix(R,227+10*mid,foam);G=mix(G,238+9*mid,foam);B=mix(B,237+11*mid,foam);
    shorePixels++;
   }
   // Long, delicate offshore crests rather than periodic parallel contours.
   if(d>24&&d<380){
    const z=Math.sin(Y*.041+X*.014+big*10+mid*4);
    const crest=Math.pow(Math.max(0,z-.83),3)*21*ridge(fine);
    R+=crest;G+=crest*1.25;B+=crest*1.1;
   }
  }else{
   // Keep the existing continent/biome colors.  Paint fine relief and
   // ground-grain *into* them rather than changing gameplay territory masks.
   const variation=(big-.5)*17+(mid-.5)*10+(fine-.5)*5+(tiny-.5)*2.3;
   const snowy=r>140&&g>143&&b>143&&Math.abs(r-g)<42;
   if(snowy){
    snowPixels++;R=clamp(r+variation*.92+3);G=clamp(g+variation*.92+5);B=clamp(b+variation*.9+8);
   }else{R=clamp(r+variation*.6);G=clamp(g+variation*.66);B=clamp(b+variation*.78)}
   const d=seaDist[k]/(3*SCALE);
   if(d<16){
    shorePixels++;
    // Shoreline sand/snow meet in a thin, broken, earth-toned bank.
    // It is a part of the *ground* illustration, not drawn over sea.
    const irregular=(mid-.5)*6+(fine-.5)*2;
    const beach=smooth((13+irregular-d)/6.5)*(.55+.25*big);
    const sand=snowy?[187,182,168]:[160,147,116];
    R=mix(R,sand[0]+variation*.5,beach);
    G=mix(G,sand[1]+variation*.5,beach);
    B=mix(B,sand[2]+variation*.4,beach);
    const snowLip=Math.max(0,1-Math.abs(d-(12+irregular)) / 4.8)*(snowy?.28:.16);
    R=mix(R,232,snowLip);G=mix(G,237,snowLip);B=mix(B,239,snowLip);
    // Minute dark stones break up the uniform beach, never a continuous band.
    if(d<12&&hash(x,y,31)>.995&&mid<.54){R*=.77;G*=.80;B*=.83}
   }
  }
  out[p]=clamp(R);out[p+1]=clamp(G);out[p+2]=clamp(B);out[p+3]=255;
 }
 return {out,stats:{waterPixels,shorePixels,snowPixels}};
}
function rivers(g,w,h){
 const content=fs.readFileSync(path.join(ROOT,'river-data.js'),'utf8');
 const data=vm.runInNewContext(content+';RIVER_NETWORK',{});
 g.save();g.scale(w/W_WORLD,h/H_WORLD);g.lineCap='round';g.lineJoin='round';
 let painted=0;
 for(const reach of data.reaches){
  if(!reach.points||reach.points.length<2)continue;
  const P=reach.points.map(([x,y])=>({x,y}));
  const samples=[];for(let j=0;j<P.length-1;j++){
   const a=P[Math.max(0,j-1)],b=P[j],c=P[j+1],d=P[Math.min(P.length-1,j+2)];
   for(let n=0;n<14;n++){
    const t=n/14,t2=t*t,t3=t2*t,h0=2*t3-3*t2+1,h1=t3-2*t2+t,h2=-2*t3+3*t2,h3=t3-t2;
    const x=h0*b.x+h1*(c.x-a.x)*.28+h2*c.x+h3*(d.x-b.x)*.28;
    const y=h0*b.y+h1*(c.y-a.y)*.28+h2*c.y+h3*(d.y-b.y)*.28;
    const width=mix(reach.widths[j],reach.widths[j+1],t);
    samples.push({x,y,w:Math.max(.8,width)*(1+.055*Math.sin(x*.037+y*.029+reach.id))});
   }
  }
  samples.push({x:P[P.length-1].x,y:P[P.length-1].y,w:reach.widths.at(-1)});
  if(samples.length<5)continue;
  const draw=extra=>{
   g.beginPath();
   for(let n=0;n<samples.length;n++){
    const a=samples[Math.max(0,n-1)],b=samples[Math.min(samples.length-1,n+1)],p=samples[n];
    const len=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
    const bend=1.25*Math.sin(n*.24+reach.id)*Math.min(1,p.w/5);
    const x=p.x+nx*(p.w+extra+bend),y=p.y+ny*(p.w+extra+bend);
    n?g.lineTo(x,y):g.moveTo(x,y);
   }
   for(let n=samples.length-1;n>=0;n--){
    const a=samples[Math.max(0,n-1)],b=samples[Math.min(samples.length-1,n+1)],p=samples[n];
    const len=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;
    const bend=1.25*Math.sin(n*.24+reach.id)*Math.min(1,p.w/5);
    g.lineTo(p.x-nx*(p.w+extra+bend),p.y-ny*(p.w+extra+bend));
   }
   g.closePath();
  };
  for(const [extra,col] of [[5,'rgba(55,69,70,.27)'],[3,'rgba(85,114,116,.37)'],[1.5,'rgba(40,97,111,.9)'],[0,'rgba(45,123,143,.94)']]){
   draw(extra);g.fillStyle=col;g.fill();
  }
  g.save();draw(0);g.clip();
  for(let n=10;n<samples.length-8;n+=13){const p=samples[n],q=samples[n+2],dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy)||1;
   g.strokeStyle=n%4?'rgba(198,228,222,.17)':'rgba(226,242,237,.32)';
   g.lineWidth=Math.min(.9,p.w*.25);g.beginPath();
   g.moveTo(p.x,p.y);g.lineTo(p.x+dx/len*Math.min(4,p.w*.8),p.y+dy/len*Math.min(4,p.w*.8));g.stroke();
  }
  g.restore();painted++;
 }
 g.restore();return painted;
}
(async()=>{
 const src=await loadImage(path.join(ROOT,'world-clean.png'));
 const w=Math.ceil(W_WORLD*SCALE),h=Math.ceil(H_WORLD*SCALE),n=w*h;
 const sc=createCanvas(w,h),sg=sc.getContext('2d',{willReadFrequently:true});
 sg.drawImage(src,0,0,w,h);
 const input=sg.getImageData(0,0,w,h);
 const mask=new Uint8Array(n),srcp=input.data;
 for(let k=0,p=0;k<n;k++,p+=4){
  const r=srcp[p],g=srcp[p+1],b=srcp[p+2];
  // Use original geographic pigment, never tile ownership, to classify water.
  mask[k]=r<111&&g<192&&b>47&&b-r>12&&b>=g*.84&&(g-r>10||b-r>28)?1:0;
 }
 const distanceToLand=distanceField(mask,w,h,0);
 const distanceToSea=distanceField(mask,w,h,1);
 const {out,stats}=colorize(input,mask,distanceToSea,distanceToLand,w,h);
 const image=sg.createImageData(w,h);image.data.set(out);sg.putImageData(image,0,0);
 const riverCount=rivers(sg,w,h);
 const target=path.join(ROOT,'world-painted.png');
 fs.writeFileSync(target,sc.toBuffer('image/png'));
 if(stats.waterPixels<n*.05||stats.waterPixels>n*.93||stats.shorePixels<20000)throw Error('Map geographic segmentation failed: '+JSON.stringify(stats));
 const preview=createCanvas(1200,Math.ceil(h*1200/w));preview.getContext('2d').drawImage(sc,0,0,preview.width,preview.height);
 fs.writeFileSync(path.join(ROOT,'world-painted-preview.jpg'),preview.toBuffer('image/jpeg',{quality:84}));
 console.log('BAKED_MAP_ART',JSON.stringify({dimensions:[w,h],original:[src.width,src.height],rivers:riverCount,bytes:fs.statSync(target).size,...stats}));
})().catch(e=>{console.error(e);process.exitCode=1});