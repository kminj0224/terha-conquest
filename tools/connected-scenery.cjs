'use strict';
module.exports=function(geo,assets,{sdf,riverDistance,cities},createCanvas){
 const cache=new Map(),audit=[],clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const noise=(id,s)=>{let x=Math.imul(id+1,374761393)^Math.imul(s+17,668265263);x=Math.imul(x^(x>>>13),1274126177);return((x^(x>>>16))>>>0)/4294967295};
 const sizes=[null,{mw:1.18,mh:1.35,fw:1.40,fh:1.35},{mw:1.32,mh:1.65,fw:1.70,fh:1.60},{mw:1.48,mh:1.95,fw:1.95,fh:1.85}];
 const riverCache=new Map();function riverNear(x,y){const ix=Math.floor(x/3),iy=Math.floor(y/3),key=(ix+2048)*4096+iy+2048;if(!riverCache.has(key))riverCache.set(key,riverDistance(ix*3+1.5,iy*3+1.5));return riverCache.get(key);}
 const recipesM=['tall-peak','twin-peaks','broad-ridge','three-peak-range','asymmetric-ridge','high-massif','low-foothills','stepped-range'];
 const recipesF=['tall-cluster','broad-canopy','uneven-twins','dense-copse','high-low-mix','low-thicket','layered-grove','diagonal-canopy'];
 const neighbors=t=>{const x=t.id%112,y=Math.floor(t.id/112),d=x&1;return [[x,y-1],[x,y+1],[x-1,y-1+d],[x-1,y+d],[x+1,y-1+d],[x+1,y+d]].filter(([xx,yy])=>xx>=0&&xx<112&&yy>=0&&yy<84).map(([xx,yy])=>geo.tiles[yy*112+xx]).filter(n=>n.owner>=0&&n.city<0&&n.terrain===t.terrain)};
 function make(p,option){const key=option+':'+p.tile;if(cache.has(key))return cache.get(key);const t=geo.tiles[p.tile],s=sizes[option],recipe=Math.floor(noise(p.tile,87)*8),adj=neighbors(t);
  const sx=p.terrain===3?s.mw:s.fw,sy=p.terrain===3?s.mh:s.fh;
  // Grow about the exact released scenery root; the gameplay anchor and root do not move.
  let paint={...p,w:p.w*sx,h:p.h*sy};
  const w=320,h=Math.max(112,Math.min(400,Math.round(w*paint.h/paint.w))),raw=createCanvas(w,h),g=raw.getContext('2d');
  const names=p.biome==='snow'?['mountain-snow-low','mountain-snow-high','mountain-snow-low']:['mountain-low','mountain-high','mountain-ridge'];
  function stamp(name,x,y,ww,hh,salt){x=.05+x*.90;y=.02+y*.94;ww*=.90;hh*=.94;if(p.terrain===2)hh*=.91+.08*noise(p.tile,salt+5);const a=assets[name],phase=noise(p.tile,salt)*Math.PI*2,warp=.02+noise(p.tile,salt+1)*.025,flip=noise(p.tile,salt+2)>.5;
   g.save();g.translate(x*w,y*h);if(flip){g.translate(ww*w,0);g.scale(-1,1)}
   const n=80,u=t=>t+warp*Math.sin(Math.PI*t)*Math.sin(t*Math.PI*2+phase);
   for(let j=0;j<n;j++){const q=j/n,z=(j+1)/n,aa=u(q),bb=u(z),rise=(.01+.015*Math.sin(q*Math.PI*3+phase))*hh*h;g.drawImage(a.im,a.crop[0]+aa*a.crop[2],a.crop[1],(bb-aa)*a.crop[2],a.crop[3],q*ww*w,rise,ww*w/n+.35,hh*h-rise);}
   g.restore();
  }
  let groups=0;
  if(p.terrain===3){
   // Broad interlocking mountain feet, followed by one of eight peak compositions.
   stamp(names[0],-.04,.39,1.08,.61,310);groups++;
   const recipes=[
    [[1,.08,.00,.84,1.00],[0,.00,.53,.53,.47]],
    [[1,.00,.08,.61,.92],[1,.42,.20,.58,.80]],
    [[2,-.03,.12,1.06,.88],[1,.30,.10,.46,.82]],
    [[1,.02,.23,.49,.77],[1,.29,.00,.52,1.00],[0,.59,.35,.43,.65]],
    [[2,.00,.28,1,.72],[1,.04,.00,.58,1.00],[0,.55,.48,.45,.52]],
    [[0,-.01,.33,1.02,.67],[1,.18,.00,.76,1.00],[1,.00,.30,.50,.70]],
    [[0,-.03,.13,.74,.87],[0,.34,.25,.69,.75],[2,.02,.47,.98,.53]],
    [[2,-.04,.22,1.08,.78],[1,.46,.00,.54,1.00],[0,.00,.37,.58,.63]]
   ];for(let n=0;n<recipes[recipe].length;n++){const [i,x,y,ww,hh]=recipes[recipe][n];stamp(names[i],x,y,ww,hh,400+n*11);groups++;}
   if(adj.length>1){stamp(names[0],-.04,.60,1.08,.40,460);groups++;}
  }else{
   // Eight different crown arrangements; all remain rooted in the original forest tile.
   const layouts=[
    [[.00,.25,.62,.75],[.35,.00,.65,1.00],[.43,.35,.57,.65]],
    [[-.03,.20,.72,.80],[.35,.17,.70,.83],[.16,.02,.66,.98],[.00,.50,.55,.50]],
    [[.00,.00,.70,1.00],[.43,.26,.57,.74],[.18,.38,.64,.62]],
    [[-.03,.15,.62,.85],[.37,.00,.63,1.00],[.05,.43,.66,.57],[.42,.44,.62,.56]],
    [[.01,.00,.62,1.00],[.40,.35,.63,.65],[.10,.40,.69,.60],[.47,.08,.52,.92]],
    [[-.03,.29,.70,.71],[.33,.24,.70,.76],[.12,.14,.65,.86],[.00,.50,.54,.50]],
    [[.08,.00,.64,1.00],[.40,.13,.60,.87],[-.02,.35,.62,.65],[.22,.40,.66,.60]],
    [[-.02,.40,.54,.60],[.19,.22,.59,.78],[.46,.00,.54,1.00],[.43,.48,.60,.52]]
   ];const items=layouts[recipe].map((v,n)=>({v,n})).sort((a,b)=>(a.v[1]+a.v[3])-(b.v[1]+b.v[3]));for(const {v,n}of items){stamp(p.asset,...v,600+n*11);groups++;}
   // Close small canopy holes within the same enlarged tile crown, without extra terrain tiles.
   if(option>=2){stamp(p.asset,.10,.47,.57,.53,700);stamp(p.asset,.44,.43,.53,.57,720);groups+=2;}
  }
  const d=g.getImageData(0,0,w,h),snow=createCanvas(w,h),sg=snow.getContext('2d'),sd=sg.createImageData(w,h),base=p.biome==='barren'?[158,150,139]:p.biome==='desert'?[184,171,131]:p.biome==='tropical'?[159,172,140]:[178,179,157];
  const cityBoxes=cities.filter(q=>Math.abs(q.x-p.x)<250&&Math.abs(q.cy-p.y)<250);let coverage=0,white=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;let alpha=d.data[i+3];if(!alpha)continue;const wx=paint.x-paint.w/2+(x+.5)/w*paint.w,wy=paint.y-paint.h+(y+.5)/h*paint.h;
   // Keep original land roots; allow full scenery silhouettes across river and sea. Protect cities.
   const cityDistance=cityBoxes.reduce((best,q)=>Math.min(best,Math.sqrt(((wx-q.x)/(q.rx+2))**2+((wy-q.cy)/(q.ry+2))**2)),10);
   if(cityDistance<1.02){d.data[i+3]=0;continue;}
   const smooth=q=>{q=clamp(q);return q*q*(3-2*q)};alpha*=smooth(Math.min(x,w-1-x)/14)*smooth((h-1-y)/18)*smooth(y/4)*smooth((cityDistance-1.02)/.12);d.data[i+3]=alpha;
   const r=d.data[i],gg=d.data[i+1],b=d.data[i+2],lum=r*.2126+gg*.7152+b*.0722,ice=p.biome==='snow'?clamp((Math.min(r,gg,b)-140)/65)*clamp((65-Math.max(r,gg,b)+Math.min(r,gg,b))/35):0,shade=p.terrain===3?.12+lum/255*1.10:.30+lum/255*.86;
   for(let k=0;k<3;k++)d.data[i+k]=base[k]*shade*(1-ice)+(232+lum*.07)*ice;
   sd.data[i]=sd.data[i+1]=sd.data[i+2]=255;sd.data[i+3]=Math.round(alpha*ice);if(alpha>48)coverage++;if(ice>.95&&alpha>220)white++;
  }
  g.putImageData(d,0,0);sg.putImageData(sd,0,0);let fallback=false;
  if(!coverage){
   // Keep the exact released footprint where a coast/city clearing prevents safe enlargement.
   fallback=true;paint=p;const a=assets[p.asset];g.clearRect(0,0,w,h);g.drawImage(a.im,...a.crop,0,0,w,h);const f=g.getImageData(0,0,w,h),fd=sg.createImageData(w,h);
   for(let i=0;i<f.data.length;i+=4){const alpha=f.data[i+3];if(!alpha)continue;const r=f.data[i],gg=f.data[i+1],b=f.data[i+2],lum=r*.2126+gg*.7152+b*.0722,ice=p.biome==='snow'?clamp((Math.min(r,gg,b)-140)/65)*clamp((65-Math.max(r,gg,b)+Math.min(r,gg,b))/35):0,shade=p.terrain===3?.12+lum/255*1.10:.30+lum/255*.86;for(let k=0;k<3;k++)f.data[i+k]=base[k]*shade*(1-ice)+(232+lum*.07)*ice;fd.data[i]=fd.data[i+1]=fd.data[i+2]=255;fd.data[i+3]=Math.round(alpha*ice);if(alpha>48)coverage++;}g.putImageData(f,0,0);sg.putImageData(fd,0,0);
  }
  const result={paint,art:{im:raw,crop:[0,0,w,h],snowMask:snow}};if(!coverage)throw Error('Scenery missing '+p.tile);
  audit.push({option,tile:p.tile,terrain:p.terrain,recipe,recipeName:(p.terrain===3?recipesM:recipesF)[recipe],groups,coverage,white,fallback,rootX:p.x,rootY:p.y,anchorX:p.anchorX,anchorY:p.anchorY,scaleX:sx,scaleY:sy,neighbors:adj.length});cache.set(key,result);if(cache.size>220){const k=cache.keys().next().value,z=cache.get(k);z.art.im.width=z.art.im.height=z.art.snowMask.width=z.art.snowMask.height=0;cache.delete(k);}return result;
 }
 return{make,audit};
};
