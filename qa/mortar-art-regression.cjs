module.exports=async function({run}){
run(`setup();busy=false;cam.z=1;tech.fill(0);
const mortarCheck=(v,m)=>{if(!v)throw Error(m)};
const mortarDrawImage=ctx.drawImage;let mortarPaint=null;
ctx.drawImage=function(img,...args){mortarPaint={img,args,m:ctx.getTransform()};return mortarDrawImage(img,...args)};
try{for(const f of [0,1]){
 const u=makeUnit(f,15,cities.find(q=>q.f===f).tile,1),p=pxy(u.tile),a=MORTAR_ART[f];
 mortarCheck(a.idle.idleReady&&a.move.idleReady,'Images decoded');
 for(const facing of [-1,1]){u.artilleryFacing=facing;
 for(const state of ['idle','attack','moving','arrived']){
 moving=[];fireMotions.delete(u.id);
 if(state==='attack')fireMotions.set(u.id,{start:1000,duration:1450});
 if(state==='moving'||state==='arrived')moving.push({id:u.id,from:p,to:{x:p.x+100,y:p.y},start:1000,duration:100});
 const now=state==='arrived'?1100:1050,travel=state==='moving';mortarPaint=null;sprite(u,p,now);
 mortarCheck(mortarPaint?.img===(travel?a.move:a.idle).idle,'Correct image for '+state);
 const [x,y,w,h]=mortarPaint.args,foot=travel?a.mfoot/a.mh:a.foot/a.h;
 mortarCheck(Math.abs(y+h*foot-20)<.001,'Feet/tires above HP bar');
 mortarCheck(Math.abs(mortarPaint.m.a+facing)<.001,'Facing matches movement/aim');
 mortarCheck(travel?w===78:Math.abs(h-58.88)<1e-8,'Crew/vehicle size');
 }
 moving=[];fx=[];fireMotions.clear();const m=launchShot(u,{x:p.x+facing*100,y:p.y},1000);
 const shell=fx.find(e=>e.kind==='baekArtilleryShell');mortarCheck(shell&&Math.hypot(shell.x-m.x,shell.y-m.y)<.001,'Shell leaves muzzle');
 mortarCheck((m.x-p.x)*facing>0,'Muzzle mirrors toward target');
 targetExplosions(u,{x:p.x+100,y:p.y},12,1100);mortarCheck(fx.some(e=>e.kind==='baekArtilleryBlast'&&e.start===2200),'Impact follows shell');
 }
}
 mortarCheck(!isMortarArt({f:2,type:15})&&!isMortarArt({f:0,type:16}),'Other units unchanged');
}finally{ctx.drawImage=mortarDrawImage;moving=[];fireMotions.clear()}
setup();`);
console.log('PASS: mortar art states, active-travel boundary, facing, crew/vehicle scale, ground anchors and projectile timing');
};

