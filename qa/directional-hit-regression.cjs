'use strict';
module.exports=async function({run}){
 const report=await run(`(()=>{
 const check=(v,m)=>{if(!v)throw Error(m)};
 const state=JSON.stringify(snapshot()),oldFrame=effectFrame,oldImage=ctx.drawImage,oldDirt=drawDirtImpact,oldSmoke=drawImpactSmoke;
 try{
  busy=false;aiTurnActive=false;units=[];moving=[];fx=[];fireMotions.clear();cam.z=1;ctx.setTransform(1,0,0,1,0,0);
  check(Object.keys(HIT_CENTER_DATA).length===factions.length*TYPES.length,'All nation/type centers measured');
  check(Object.values(HIT_CENTER_DATA).every(levels=>levels.length===4&&levels.every(states=>states.length===32&&states.every(p=>p.length===2&&p.every(Number.isFinite)))),'Center table has finite centers for every tier/pose/direction');
  const tile=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&neighbors(i).filter(j=>tiles[j].owner>=0&&!cityAt(j)).length>=4);
  const p=pxy(tile),left=neighbors(tile).find(i=>pxy(i).x<p.x),right=neighbors(tile).find(i=>pxy(i).x>p.x);check(left>=0&&right>=0,'Two-sided attack fixture');
  const frames=[],specials=[];
  effectFrame=function(row,t,x,y,size,bottom){const m=ctx.getTransform();frames.push({row,x,y,size,bottom,a:m.a,d:m.d,cx:m.a*x+m.c*(y+12-size/2)+m.e,cy:m.b*x+m.d*(y+12-size/2)+m.f});return oldFrame(row,t,x,y,size,bottom)};
  ctx.drawImage=function(image,...args){if(image===saprosArt.effects.idle){const [x,y,w,h]=args.slice(-4),m=ctx.getTransform();specials.push({a:m.a,cx:m.a*(x+w/2)+m.c*(y+h/2)+m.e,cy:m.b*(x+w/2)+m.d*(y+h/2)+m.f})}return oldImage(image,...args)};
  let tested=0;
  for(const sourceType of [0,1,SAPROS,WHITE_NIGHT])for(const targetType of [0,1,2,11,23,SAPROS,WHITE_NIGHT])for(const side of [1,-1]){
   units=[];moving=[];fx=[];frames.length=0;specials.length=0;
   const source=makeUnit(0,sourceType,side===1?left:right),victim=makeUnit(1,targetType,tile,2),now=performance.now();
   targetExplosions(source,p,10,now,false,victim);
   const event=fx.find(e=>e.hitFacing!=null),center=unitHitCenter(victim,now);check(event,'Hit has victim/direction metadata '+sourceType+':'+targetType);
   check(event.hitFacing===-side,'Incoming side '+sourceType+':'+targetType+':'+side);
   check(Math.abs(event.hitX-center.x)<.001&&Math.abs(event.hitY-center.y)<.001,'Factory uses body center');
   if(event.kind==='saprosBlood'||event.kind==='saprosSparks'){
    drawSaprosEffect(event,.1);const draw=specials.at(-1);check(draw&&draw.a===-side,'Special blood/spark reflection');check(Math.abs(draw.cx-center.x)<.001&&Math.abs(draw.cy-center.y)<.001,'Special effect centered');
   }else{
    paintImpact(event,.02);const draw=frames.find(e=>e.row===0||e.row===1);
    // Some branches intentionally use only explosion/dirt on non-flesh victims.
    if(draw){check(draw.a===-side,'Shared blood/spark reflection');check(Math.abs(draw.cx-center.x)<.001&&Math.abs(draw.cy-center.y)<.001,'Shared effect centered')}
   }
   tested++;
  }
  units=[];fx=[];const source=makeUnit(0,3,left),victim=makeUnit(1,0,tile,2);addAreaImpact(source,victim,10,performance.now());check(fx.at(-1).hitFacing===-1,'Splash uses source-to-victim direction');
  const event=fx.at(-1),frozen={x:event.hitX,y:event.hitY};units=[];const dead=directionalImpactCenter(event);check(dead.x===frozen.x&&dead.y===frozen.y,'Killed target retains its hit center');
  // Across the horizontal seam, choose the wrapped incoming direction.
  const west=index(-OCEAN_X,0),east=index(W+OCEAN_X-1,0);units=[];const wrappedSource=makeUnit(0,0,east),wrappedVictim=makeUnit(1,0,west);
  const wrapped=setDirectionalImpact({targetId:wrappedVictim.id,start:performance.now()},wrappedSource,wrappedVictim);check(wrapped.hitFacing===-1,'Wrapped shot arrives from the left');
  // Moving targets keep the effect on their actual visual center.
  units=[];moving=[];const mover=makeUnit(1,0,tile),origin=pxy(tile),now=performance.now();moving.push({id:mover.id,from:origin,to:{x:origin.x+60,y:origin.y+30},start:now,duration:1000});
  const traveling=setDirectionalImpact({targetId:mover.id,start:now},source,mover,now),begin=directionalImpactCenter(traveling,now),middle=directionalImpactCenter(traveling,now+500);
  check(Math.abs(middle.x-begin.x-30)<.001&&Math.abs(middle.y-begin.y-15)<.001,'Effect follows moving target center');
  // Explosion, dirt and smoke draw calls must stay identical with hit metadata added.
  units=[];moving=[];const draws=[];drawDirtImpact=function(...args){draws.push(['dirt',...args]);return oldDirt(...args)};drawImpactSmoke=function(...args){draws.push(['smoke',...args]);return oldSmoke(...args)};
  for(const layer of ['explosion','dustBurst','grenadeDust','infantrySmokeHit','armorSmoke']){
   const event={x:640,y:400,layers:[layer],explosionGroundY:425,start:1000,burstDuration:975,duration:3000};
   frames.length=0;draws.length=0;paintImpact(event,.02);const before=JSON.stringify([draws,frames.filter(f=>f.row===2)]);
   frames.length=0;draws.length=0;paintImpact({...event,hitX:900,hitY:800,hitFacing:-1},.02);check(JSON.stringify([draws,frames.filter(f=>f.row===2)])===before,'Explosion/smoke unchanged: '+layer);
  }
  return {factoryCases:tested,allNationalCenters:Object.keys(HIT_CENTER_DATA).length,splash:true,seam:true,moving:true,death:true,unchangedExplosionLayers:5};
 }finally{
  effectFrame=oldFrame;ctx.drawImage=oldImage;drawDirtImpact=oldDirt;drawImpactSmoke=oldSmoke;
  const s=JSON.parse(state);({units,cities,money,tech,food,oil,turn,player,difficulty,uid,cam,diplomacy}=s);tiles.forEach((t,i)=>t.owner=s.owners[i]);migrateArmy(s);busy=false;selected=null;panelOpen=false;
 }
 })()`);
 console.log('PASS directional blood/sparks:',JSON.stringify(report));
};
