// Offline finishing only. Runtime never reads pixels or reconstructs geography.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');process.chdir(root);
(async()=>{
 const painted=await loadImage('art/world-natural-source.png'),w=painted.width,h=painted.height;
 const canvas=createCanvas(w,h),g=canvas.getContext('2d');
 for(const name of ['world-clean.png','coast-overlay.png'])g.drawImage(await loadImage('game/assets/'+name),0,0,w,h);
 const original=g.getImageData(0,0,w,h).data,land=new Uint8Array(w*h);
 // The original composite has warm/neutral land and blue-dominant water.
 for(let i=0;i<land.length;i++){const j=i*4,r=original[j],gg=original[j+1],b=original[j+2];land[i]=!(r<50&&b>r*1.6&&b>gg*1.25)}
 fs.copyFileSync('art/world-natural-source.png','game/assets/world-natural.png');
 const mask=createCanvas(w,h),mg=mask.getContext('2d'),md=mg.createImageData(w,h);for(let i=0;i<land.length;i++){md.data[i*4]=md.data[i*4+1]=md.data[i*4+2]=land[i]*255;md.data[i*4+3]=255}mg.putImageData(md,0,0);fs.writeFileSync('art/original-land-mask.png',mask.toBuffer('image/png'));
 for(let i=0;i<land.length;i++)md.data[i*4+3]=land[i]*255;mg.putImageData(md,0,0);fs.writeFileSync('game/assets/world-natural-land.png',mask.toBuffer('image/png'));
 const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
 const report={width:w,height:h,originalLandPixels:land.reduce((a,b)=>a+b,0),coastlineMaskSHA256:hash('art/original-land-mask.png'),mapDataSHA256:hash('game/assets/mapdata.js'),riverDataSHA256:hash('game/assets/river-data.js'),source:'Built-in image generation: original coast artwork + user reference, then original river guide refinement',geometry:'Original silhouette supplied to both image edits. MAP and RIVER_NETWORK unchanged; no runtime clipping of vegetation.'};
 fs.writeFileSync('art/natural-map-report.json',JSON.stringify(report,null,2)+'\n');console.log(report);
})().catch(e=>{console.error(e);process.exit(1)});
