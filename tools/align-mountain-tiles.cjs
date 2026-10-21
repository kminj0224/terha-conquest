'use strict';
// Measure the released artwork; never regenerate scenery from the expanded gameplay terrain.
const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
process.chdir(root);
const threshold=.30,alphaThreshold=48;
async function measure(){
 const geo=JSON.parse(fs.readFileSync('art/terrain-alignment-geography.json'));
 const manifest=JSON.parse(fs.readFileSync('art/aligned-map-manifest.json'));
 const cities=JSON.parse(fs.readFileSync('art/city-footprints.json')).cities;
 const assets={};
 for(const [name,s] of Object.entries(manifest.sprites))assets[name]={im:await loadImage(s.file),crop:s.crop};
 const scenery=require('./connected-scenery.cjs')(geo,assets,{sdf:()=>1,riverDistance:()=>Infinity,cities},createCanvas);
 const width=Math.ceil(geo.width),height=Math.ceil(geo.height),mask=createCanvas(width,height),g=mask.getContext('2d');
 // Same order and silhouettes as bake-aligned-map. Foreground trees erase hidden mountains.
 for(const p of manifest.placements){
  const {paint:v,art:a}=scenery.make(p,2);
  g.globalCompositeOperation=p.terrain===3?'source-over':'destination-out';
  g.drawImage(a.im,...a.crop,v.x-v.w/2,v.y-v.h,v.w,v.h);
 }
 const pixels=g.getImageData(0,0,width,height).data;
 const total=new Uint32Array(geo.tiles.length),covered=new Uint32Array(geo.tiles.length);
 // This is the exact worldTileAt cube rounding used by the game.
 function tileAt(wx,wy){const q=(wx-64*2/3)/64,r=(wy-55.43*.5)/55.43-q*.5,z=-q-r;let x=Math.round(q),y=Math.round(r),v=Math.round(z);const a=Math.abs(x-q),b=Math.abs(y-r),c=Math.abs(v-z);if(a>b&&a>c)x=-y-v;else if(b>c)y=-x-v;const row=y+(x-(x&1))/2;return x>=0&&x<112&&row>=0&&row<84?row*112+x:-1;}
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=tileAt(x+.5,y+.5);if(i<0)continue;total[i]++;if(pixels[(y*width+x)*4+3]>alphaThreshold)covered[i]++;}
 const box={};vm.runInNewContext(fs.readFileSync('game/assets/mapdata.js','utf8')+';this.map=MAP',box);
 const map=box.map,cityTiles=new Set([...manifest.cities.map(c=>c.tile),...geo.tiles.filter(t=>t.city>=0).map(t=>t.id)]);
 const eligible=t=>map.tiles[t.id][0]>=0&&t.owner>=0&&!cityTiles.has(t.id)&&t.terrain<3;
 const rows=geo.tiles.map(t=>({tile:t.id,from:t.terrain,owner:map.tiles[t.id][0],covered:covered[t.id],total:total[t.id],fraction:covered[t.id]/total[t.id]}));
 const changed=rows.filter(r=>eligible(geo.tiles[r.tile])&&r.fraction>=threshold);
 const report={threshold,alphaThreshold,sampleSpacing:1,source:'released option B scenery, with foreground forest occlusion',changes:changed,seaOverlapsPreserved:rows.filter(r=>r.owner<0&&r.fraction>=threshold).length,minorLandOverlapsPreserved:rows.filter(r=>eligible(geo.tiles[r.tile])&&r.fraction>0&&r.fraction<threshold).length};
 return {report,map,mask,geo};
}
async function main(){
 const {report,map,mask,geo}=await measure();
 fs.mkdirSync('previews',{recursive:true});
 const summary={...report,changes:report.changes.map(r=>[r.tile,Math.round(r.fraction*100)])};
 console.log('MOUNTAIN_ALIGNMENT '+JSON.stringify(summary));
 // Overview with changed hexes for visual review; images remain build artifacts only.
 const overview=await loadImage('game/assets/world-natural.png'),preview=createCanvas(1800,1173),g=preview.getContext('2d');
 g.drawImage(overview,0,0,preview.width,preview.height);g.scale(preview.width/geo.width,preview.height/geo.height);
 for(const r of report.changes){const t=geo.tiles[r.tile];g.beginPath();[[42.6667,0],[21.3333,27.715],[-21.3333,27.715],[-42.6667,0],[-21.3333,-27.715],[21.3333,-27.715]].forEach(([x,y],j)=>j?g.lineTo(t.x+x,t.y+y):g.moveTo(t.x+x,t.y+y));g.closePath();g.fillStyle='#ff680044';g.fill();g.strokeStyle='#ff9b27';g.lineWidth=2;g.stroke();}
 fs.writeFileSync('previews/mountain-alignment.png',preview.toBuffer('image/png'));
 if(process.argv.includes('--apply')){
  for(const r of report.changes)map.tiles[r.tile][1]=3;
  fs.writeFileSync('game/assets/mapdata.js','const MAP='+JSON.stringify(map)+';\n');
  fs.writeFileSync('art/mountain-tile-alignment.json',JSON.stringify(report,null,2)+'\n');
 }
 mask.width=mask.height=0;
}
module.exports={measure};
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
