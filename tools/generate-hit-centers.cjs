'use strict';
// Offline only: measure opaque unit body centers for directional blood/sparks.
// The game uses the resulting tiny lookup; it never reads pixels at runtime.
const fs=require('fs'),path=require('path'),assert=require('assert');
const qa=path.resolve(__dirname,'../qa'),source=fs.readFileSync(qa+'/native-test.cjs','utf8'),at=source.indexOf("assert.equal(run('appScreen'),'title');");
new Function('require','__dirname',source.slice(0,at)+`
(async()=>{
 await Promise.all(pending);run('setup();units=[];moving=[];fx=[];sound=false;cam.z=.4');
 function encodeHitCenters(data){
  const points=[],poses=[],pointIds=new Map(),poseIds=new Map(),index={};
  for(const [key,levels] of Object.entries(data))index[key]=levels.map(states=>{
   const ids=states.map(point=>{const key=JSON.stringify(point);if(!pointIds.has(key)){pointIds.set(key,points.length);points.push(point)}return pointIds.get(key)});
   const key=JSON.stringify(ids);if(!poseIds.has(key)){poseIds.set(key,poses.length);poses.push(ids)}return poseIds.get(key);
  });
  return 'const HIT_CENTER_POINTS='+JSON.stringify(points)+';const HIT_CENTER_POSES='+JSON.stringify(poses)+';const HIT_CENTER_INDEX='+JSON.stringify(index)+';const HIT_CENTER_DATA=Object.fromEntries(Object.entries(HIT_CENTER_INDEX).map(([key,levels])=>[key,levels.map(i=>HIT_CENTER_POSES[i].map(j=>HIT_CENTER_POINTS[j]))]));';
 }
 const cache=new Map();let bounds=null;const raw=Object.getPrototypeOf(main).getContext.call(main,'2d');
 b.recordGround69=(image,args,m)=>{
  const native=image?._native||image;if(!native?.width)return;
  let box=cache.get(native);
  if(!box){const c=createCanvas(native.width,native.height),g=c.getContext('2d');g.drawImage(native,0,0);const p=g.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(p[(y*c.width+x)*4+3]>=32){x0=Math.min(x0,x);x1=Math.max(x1,x+1);y0=Math.min(y0,y);y1=Math.max(y1,y+1)}box=[x0,y0,x1,y1];cache.set(native,box)}
  let sx=0,sy=0,sw=native.width,sh=native.height,dx,dy,dw,dh;
  if(args.length===8)[sx,sy,sw,sh,dx,dy,dw,dh]=args;else if(args.length===4)[dx,dy,dw,dh]=args;else return;
  const left=Math.max(sx,box[0]),right=Math.min(sx+sw,box[2]),top=Math.max(sy,box[1]),foot=Math.min(sy+sh,box[3]);if(left>=right||top>=foot)return;
  for(const x of [left,right])for(const y of [top,foot]){const lx=dx+(x-sx)/sw*dw,ly=dy+(y-sy)/sh*dh,wx=m.a*lx+m.c*ly+m.e-128,wy=m.b*lx+m.d*ly+m.f-96;if(!bounds)bounds=[wx,wy,wx,wy];else{bounds[0]=Math.min(bounds[0],wx);bounds[1]=Math.min(bounds[1],wy);bounds[2]=Math.max(bounds[2],wx);bounds[3]=Math.max(bounds[3],wy)}}
 };
 run('globalThis.groundDraw69=ctx.drawImage;globalThis.groundEllipse69=ctx.ellipse;globalThis.groundFirstEllipse69=true;ctx.ellipse=function(...args){if(groundFirstEllipse69){groundFirstEllipse69=false;return}return groundEllipse69(...args)};ctx.drawImage=function(image,...args){recordGround69(image,args,ctx.getTransform())}');
 const data={};
 try{for(let f=0;f<run('factions.length');f++)for(let type=0;type<run('TYPES.length');type++){
  const levels=[];for(let level=1;level<=4;level++){const values=[];
  for(const firing of [false,true])for(let angle=0;angle<16;angle++){
   bounds=null;raw.setTransform(1,0,0,1,0,0);raw.clearRect(0,0,256,192);run('(()=>{units=[];const u=makeUnit('+f+','+type+',cities.find(q=>q.f==='+f+').tile,'+level+'),a='+angle+'*Math.PI/8,dir=Math.cos(a)<0?-1:1;u.angle=a;for(const k of ["tankFacing","artilleryFacing","rifleFacing","destroyerFacing","carrierFacing","danteFleetFacing"])u[k]=dir;fireMotions.clear();if('+firing+')fireMotions.set(u.id,{start:performance.now()-20,duration:1000,burst:true});const p=unitVisualPosition(u,performance.now());ctx.setTransform(1,0,0,1,128-p.x,96-p.y);groundFirstEllipse69=true;sprite(u,p,performance.now())})()');if(!bounds){const pixels=raw.getImageData(0,0,256,192).data;for(let y=0;y<192;y++)for(let x=0;x<256;x++)if(pixels[(y*256+x)*4+3]>=32){const wx=x-128,wy=y-96;if(!bounds)bounds=[wx,wy,wx+1,wy+1];else{bounds[0]=Math.min(bounds[0],wx);bounds[1]=Math.min(bounds[1],wy);bounds[2]=Math.max(bounds[2],wx+1);bounds[3]=Math.max(bounds[3],wy+1)}}}values.push(bounds?[Math.round((bounds[0]+bounds[2])*50)/100,Math.round((bounds[1]+bounds[3])*50)/100]:[0,-12]);
  }
  levels.push(values);if(global.gc)global.gc()}data[f+':'+type]=levels;
 }}finally{run('ctx.drawImage=groundDraw69;ctx.ellipse=groundEllipse69')}
 fs.writeFileSync(path.join(root,'hit-center-data.js'),encodeHitCenters(data));
 console.log('Measured '+Object.keys(data).length+' national/type combinations, '+cache.size+' source images; no runtime pixel reads.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,qa);
