'use strict';
// Offline drainage network derived from terrain and the supplied Baekyang reference.
// These are visual watercourses; the navigable sea / movement map is unchanged.
const RIVER_REACHES=RIVER_NETWORK.reaches.map(reach=>{const points=reach.points.map(([x,y])=>({x,y}));return{...reach,points,minX:Math.min(...points.map(p=>p.x))-40,maxX:Math.max(...points.map(p=>p.x))+40,minY:Math.min(...points.map(p=>p.y))-40,maxY:Math.max(...points.map(p=>p.y))+40}});
let riverView=null,riverViewKey='',riverViewBuilds=0;
function riverSamples(reach){
 const result=[],p=reach.points;let along=0;
 for(let n=0;n<p.length-1;n++){
  const a=n===0&&reach.before?{x:reach.before[0],y:reach.before[1]}:p[Math.max(0,n-1)],b=p[n],c=p[n+1],d=n===p.length-2&&reach.after?{x:reach.after[0],y:reach.after[1]}:p[Math.min(p.length-1,n+2)];
  for(let j=0;j<16;j++){const t=j/16,t2=t*t,t3=t2*t,h1=2*t3-3*t2+1,h2=t3-2*t2+t,h3=-2*t3+3*t2,h4=t3-t2;
   const x=h1*b.x+h2*(c.x-a.x)*.26+h3*c.x+h4*(d.x-b.x)*.26,y=h1*b.y+h2*(c.y-a.y)*.26+h3*c.y+h4*(d.y-b.y)*.26,prev=result[result.length-1];
   if(prev)along+=Math.hypot(x-prev.x,y-prev.y);result.push({x,y,along,width:(reach.widths[n]*(1-t)+reach.widths[n+1]*t)*(1+.045*Math.sin(along*.021+reach.id))});
  }
 }
 const last=p[p.length-1];result.push({...last,along:along+Math.hypot(last.x-result[result.length-1].x,last.y-result[result.length-1].y),width:result[result.length-1].width});
 result.forEach((v,n)=>{const a=result[Math.max(0,n-1)],b=result[Math.min(result.length-1,n+1)],len=Math.hypot(b.x-a.x,b.y-a.y)||1;v.nx=-(b.y-a.y)/len;v.ny=(b.x-a.x)/len});const length=result[result.length-1].along;for(const v of result){const waviness=1.7*Math.sin(v.along*.037+reach.id);v.x+=v.nx*waviness;v.y+=v.ny*waviness;if(reach.source)v.width*=.12+.88*Math.min(1,v.along/60)}return result;
}
for(const reach of RIVER_REACHES)reach.samples=riverSamples(reach);
function paintRiverReaches(g,erase=false,onlyPhase=null){
 g.save();g.lineCap='round';g.lineJoin='round';
 const left=cam.x-screenW/2/cam.z-45,right=cam.x+screenW/2/cam.z+45,top=cam.y-screenH/2/cam.z-45,bottom=cam.y+screenH/2/cam.z+45;
 for(const phase of erase?[0]:(onlyPhase===null?[0,1]:[onlyPhase]))for(const reach of RIVER_REACHES){if(reach.maxX<left||reach.minX>right||reach.maxY<top||reach.minY>bottom)continue;
  const p=reach.samples,channel=(extra)=>{g.beginPath();for(let n=0;n<p.length;n++){const v=p[n],w=v.width+extra,x=v.x+v.nx*w,y=v.y+v.ny*w;n?g.lineTo(x,y):g.moveTo(x,y)}for(let n=p.length-1;n>=0;n--){const v=p[n],w=v.width+extra;g.lineTo(v.x-v.nx*w,v.y-v.ny*w)}g.closePath();for(const n of [0,p.length-1]){if(n===p.length-1&&reach.mouth)continue;const v=p[n],r=v.width+extra;g.moveTo(v.x+r,v.y);g.arc(v.x,v.y,r,0,Math.PI*2,true)}};
  if(erase){g.fillStyle='#fff';for(const [extra,alpha]of [[20,.08],[15,.14],[10,.25],[6,.5],[3,1]]){g.globalAlpha=alpha;channel(extra);g.fill()}g.globalAlpha=1;continue}
  // Irregular earth banks and a varying-width channel, rather than parallel lines.
  if(phase===0){for(const [extra,color]of [[4,'#344d4030'],[2,'#6a7964'],[.6,'#345b61']]){channel(extra);g.fillStyle=color;g.fill()}continue}
  channel(0);const water=g.createLinearGradient(0,0,WW,HH);water.addColorStop(0,'#4f8b93');water.addColorStop(.4,'#30697b');water.addColorStop(.72,'#438797');water.addColorStop(1,'#2d6877');g.fillStyle=water;g.fill();
  g.save();channel(0);g.clip();
  for(let n=4;n<p.length-3;n+=5){const v=p[n],offset=Math.sin(v.along*.034)*v.width*.55,r=v.width*.85,x=v.x+v.nx*offset,y=v.y+v.ny*offset;const glint=g.createRadialGradient(x,y,0,x,y,r*1.8);glint.addColorStop(0,n%3?'#a8cec044':'#143d5230');glint.addColorStop(1,'#90b8b000');g.fillStyle=glint;g.fillRect(x-r*2,y-r*2,r*4,r*4)}
  // Sparse, short reflections follow the flow and do not animate or cost frames.
  g.strokeStyle='#d4e6dc55';g.lineWidth=.7;
  for(let n=11;n<p.length-2;n+=19){const v=p[n],offset=Math.sin(n*1.7)*v.width*.45,x=v.x+v.nx*offset,y=v.y+v.ny*offset;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x-v.ny*2+v.nx,y+v.nx*2+v.ny,x-v.ny*4,y+v.nx*4);g.stroke()}
  g.restore();
 }
 g.restore();
}
function drawRealisticRivers(){
 if(!worldImg.complete)return;
 // A stationary view reuses one screen-sized bitmap instead of repainting water.
 if(c.width*c.height>6*1024*1024){paintRiverReaches(ctx);return}
 const key=[cam.x,cam.y,cam.z,c.width,c.height].join(':');
 if(!riverView||key!==riverViewKey){riverViewKey=key;riverView??=document.createElement('canvas');riverView.width=c.width;riverView.height=c.height;const g=riverView.getContext('2d'),d=c.width/screenW;g.setTransform(d,0,0,d,0,0);g.translate(screenW/2,screenH/2);g.scale(cam.z,cam.z);g.translate(-cam.x,-cam.y);paintRiverReaches(g);riverViewBuilds++}
 ctx.save();ctx.setTransform(1,0,0,1,0,0);nativeMapDrawImage(riverView,0,0);ctx.restore();
}
