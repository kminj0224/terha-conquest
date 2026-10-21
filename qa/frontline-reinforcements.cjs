const assert=require('assert');
module.exports=function({run}){
 const report=run(`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error(msg)},summary={};
  setup();
  for(const [f,expected,at]of [[0,20,6],[2,20,3]]){
   const added=units.filter(u=>u.f===f&&u.initialFrontlineReinforcement&&!isNaval(u)),front=reinforcementFrontDepth(f);
   check(added.length===expected,'Wrong frontline grant '+f+': '+added.length);
   check(added.filter(u=>u.type===14&&u.level===3).length===3,'Elite tanks missing '+f);
   check(added.filter(u=>u.type===9).length===at,'Antitank grant '+f);
   check(added.every(u=>tiles[u.tile].owner===f&&front.depth[u.tile]>=0&&front.depth[u.tile]<=4&&moveCost(u,u.tile)<99999),'Invalid land deployment '+f);
   check(added.every(u=>!missileBases.some(b=>b.tile===u.tile)&&units.filter(v=>!v.carriedBy&&v.hp>0&&v.tile===u.tile).length===1),'Occupied land deployment '+f);
   summary[f]={land:added.length,elite:3,antitank:at};
  }
  const ships=units.filter(u=>u.f===0&&u.initialFrontlineReinforcement&&isNaval(u)),front=reinforcementFrontDepth(0);
  check(ships.length===9,'Forward fleet missing');
  for(const [type,count]of [[25,2],[24,3],[23,4]])check(ships.filter(u=>u.type===type).length===count,'Fleet composition '+type);
  check(ships.every(u=>tiles[u.tile].owner<0&&u.level===2&&u.westernFleet&&Math.min(...front.border.map(i=>distance(i,u.tile)))<=12),'Fleet too far from western front');
  check(ships.every(u=>units.filter(v=>!v.carriedBy&&v.hp>0&&v.tile===u.tile).length===1),'Fleet overlaps another unit');
  const before=units.filter(u=>u.initialFrontlineReinforcement).length;
  migrateArmy(snapshot());check(units.filter(u=>u.initialFrontlineReinforcement).length===before,'Save migration duplicates or removes grants');
  setup();check(units.filter(u=>u.initialFrontlineReinforcement).length===49,'Restart duplicates grants');
  // Measure actual transformed paint calls, including the mirrored sprite.
  const originalImage=ctx.drawImage,originalPoly=poly,paint=[];let image=null;
  ctx.drawImage=function(img,...a){image={img,args:a,m:ctx.getTransform()};return originalImage(img,...a)};
  poly=function(points,...a){if(a[0]==='#ffd470')paint.push(ctx.getTransform());return originalPoly(points,...a)};
  try{for(const facing of [-1,1]){
   const u=units.find(u=>u.f===5&&u.type===10)||makeUnit(5,10,cities.find(q=>q.f===5).tile,1);u.rifleFacing=facing;
   fireMotions.set(u.id,{start:1000,duration:560,burst:true});paint.length=0;sprite(u,pxy(u.tile),1010);
   check(image?.img===nakwolMachinegunArt.idle&&paint.length===1,'MG artwork/flash not rendered');
   const [x,y,w,h]=image.args,m=image.m,px=x+w*17/768,py=y+h*207/576,expected={x:m.a*px+m.c*py+m.e,y:m.b*px+m.d*py+m.f};
   check(Math.hypot(paint[0].e-expected.x,paint[0].f-expected.y)<.001,'MG flash misses painted muzzle '+facing);
   fireMotions.delete(u.id);
  }
  const u=units.find(u=>u.f===1&&u.type===25)||makeUnit(1,25,ships[0].tile,1);sprite(u,pxy(u.tile),1010);
  check(Math.abs(image.args[2]-132*NAVAL_VISUAL_SCALE*1.35)<.001,'Dante carrier width');
  check(Math.abs(image.args[3]/image.args[2]-image.img.naturalHeight/image.img.naturalWidth)<.001,'Carrier aspect ratio');
  }finally{ctx.drawImage=originalImage;poly=originalPoly}
  return summary;
 })()`);
 assert.equal(report[0].land,20);assert.equal(report[2].land,20);
 console.log('PASS: frontline grants, forward fleet, save/restart stability, mirrored MG muzzle paint and 35% carrier scaling',report);
};
