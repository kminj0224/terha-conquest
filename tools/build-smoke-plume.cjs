'use strict';
// Bake illustrated smoke transport offline; never execute this in the game.
const fs=require('fs'),path=require('path'),vm=require('vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../game/assets');
(async()=>{
 const source=await loadImage(root+'/smoke-column.webp');
 const box={smokeFramesArt:{idle:source,idleReady:true},document:{createElement:()=>createCanvas(80,192)}};vm.createContext(box);
 vm.runInContext(fs.readFileSync(root+'/smoke-plume-data.js','utf8'),box);
 const program=fs.readFileSync(path.join(__dirname,'smoke-plume-bake-source.js'),'utf8');
 vm.runInContext(program,box);
 const sheet=createCanvas(640,1920),g=sheet.getContext('2d');box.bakedFrames.forEach((f,i)=>g.drawImage(f,(i%8)*80,Math.floor(i/8)*192));
 fs.writeFileSync(root+'/smoke-flow.png',sheet.toBuffer('image/png'));
 console.log('Baked',box.bakedFrames.length,'frames into 640x1920 atlas');
})().catch(e=>{console.error(e);process.exit(1)});
