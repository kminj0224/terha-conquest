'use strict';
// Offline only: measure actual national sprite transforms and opaque image feet.
// The game uses the resulting tiny lookup; it never reads pixels at runtime.
const fs=require('fs'),path=require('path'),assert=require('assert');
const qa=path.resolve(__dirname,'../qa'),source=fs.readFileSync(qa+'/native-test.cjs','utf8'),at=source.indexOf("assert.equal(run('appScreen'),'title');");
new Function('require','__dirname',source.slice(0,at)+`
(async()=>{
 await Promise.all(pending);run('setup();units=[];moving=[];fx=[];sound=false;cam.z=.4');
 const cache=new Map();let bottom=null;const raw=Object.getPrototypeOf(main).getContext.call(main,'2d');
 b.recordGround69=(image,args,m)=>{
  const native=image?._native||image;if(!native?.width)return;
  let box=cache.get(native);
  if(!box){const c=createCanvas(native.width,native.height),g=c.getContext('2d');g.drawImage(native,0,0);const p=g.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(p[(y*c.width+x)*4+3]>=32){x0=Math.min(x0,x);x1=Math.max(x1,x+1);y0=Math.min(y0,y);y1=Math.max(y1,y+1)}box=[x0,y0,x1,y1];cache.set(native,box)}
  let sx=0,sy=0,sw=native.width,sh=native.height,dx,dy,dw,dh;
  if(args.length===8)[sx,sy,sw,sh,dx,dy,dw,dh]=args;else if(args.length===4)[dx,dy,dw,dh]=args;else return;
  const left=Math.max(sx,box[0]),right=Math.min(sx+sw,box[2]),top=Math.max(sy,box[1]),foot=Math.min(sy+sh,box[3]);if(left>=right||top>=foot)return;
  for(const x of [left,right])for(const y of [top,foot]){const lx=dx+(x-sx)/sw*dw,ly=dy+(y-sy)/sh*dh,world=m.b*lx+m.d*ly+m.f-96;bottom=bottom==null?world:Math.max(bottom,world)}
 };
 run('globalThis.groundDraw69=ctx.drawImage;globalThis.groundEllipse69=ctx.ellipse;globalThis.groundFirstEllipse69=true;ctx.ellipse=function(...args){if(groundFirstEllipse69){groundFirstEllipse69=false;return}return groundEllipse69(...args)};ctx.drawImage=function(image,...args){recordGround69(image,args,ctx.getTransform())}');
 const data={};
 try{for(let f=0;f<7;f++)for(let type=0;type<run('TYPES.length');type++){
  const levels=[];for(let level=1;level<=4;level++){const values=[];
  for(const firing of [false,true])for(let angle=0;angle<16;angle++){
   bottom=null;raw.setTransform(1,0,0,1,0,0);raw.clearRect(0,0,256,192);run('(()=>{units=[];const u=makeUnit('+f+','+type+',cities.find(q=>q.f==='+f+').tile,'+level+'),a='+angle+'*Math.PI/8,dir=Math.cos(a)<0?-1:1;u.angle=a;for(const k of ["tankFacing","artilleryFacing","rifleFacing","destroyerFacing","carrierFacing","danteFleetFacing"])u[k]=dir;fireMotions.clear();if('+firing+')fireMotions.set(u.id,{start:performance.now()-20,duration:1000,burst:true});const p=unitVisualPosition(u,performance.now());ctx.setTransform(1,0,0,1,128-p.x,96-p.y);groundFirstEllipse69=true;sprite(u,p,performance.now())})()');if(bottom==null){const pixels=raw.getImageData(0,0,256,192).data;bottom=11;for(let y=191;y>=0;y--){let found=false;for(let x=0;x<256;x++)if(pixels[(y*256+x)*4+3]>=32){bottom=y+1-96;found=true;break}if(found)break}}values.push(Math.round(bottom*100)/100);
  }
  levels.push(values);if(global.gc)global.gc()}data[f+':'+type]=levels;
 }}finally{run('ctx.drawImage=groundDraw69;ctx.ellipse=groundEllipse69')}
 fs.writeFileSync(path.join(root,'impact-ground-data.js'),'// Offline opaque sprite feet, indexed by faction:type, four formation levels, firing state and 16 directions.\\nconst IMPACT_GROUND_DATA='+JSON.stringify(data)+';\\n');
 console.log('Measured '+Object.keys(data).length+' national/type combinations, '+cache.size+' source images; no runtime pixel reads.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,qa);
