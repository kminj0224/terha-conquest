'use strict';
// Deterministic faction livery for the game renderer; the supplied Baek PNG stays byte-identical.
const fs=require('fs'),path=require('path'),vm=require('vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.join(__dirname,'../game/assets');
function transportStripePixel(r,g,b,a,y,height){
 return a>0&&y>=height*.78&&y<=height*.93&&g>r*1.12&&g>b*1.8&&b<65;
}
function factionPalette(){
 const source=fs.readFileSync(path.join(root,'game.js'),'utf8');
 return vm.runInNewContext(source.slice(source.indexOf('const factions=')+15,source.indexOf(';',source.indexOf('const factions='))));
}
async function prepare(){
 const image=await loadImage(path.join(root,'transport-ship.png'));
 const canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');
 ctx.drawImage(image,0,0);const original=ctx.getImageData(0,0,image.width,image.height);
 for(const [f,faction]of factionPalette().entries()){
  if(f===0)continue;
  const data=new Uint8ClampedArray(original.data),rgb=faction.color.slice(1).match(/../g).map(v=>parseInt(v,16));
  for(let i=0;i<data.length;i+=4){
   const y=Math.floor(i/4/image.width),[r,g,b,a]=data.subarray(i,i+4);
   if(!transportStripePixel(r,g,b,a,y,image.height))continue;
   const shade=Math.max(.35,Math.min(1.2,g/76));
   for(let c=0;c<3;c++)data[i+c]=Math.round(Math.min(255,rgb[c]*shade));
  }
  const pixels=ctx.createImageData(image.width,image.height);pixels.data.set(data);ctx.putImageData(pixels,0,0);
  fs.writeFileSync(path.join(root,'transport-ship-'+f+'.png'),canvas.toBuffer('image/png'));
 }
}
module.exports={transportStripePixel,factionPalette};
if(require.main===module)prepare().catch(e=>{console.error(e);process.exit(1)});
