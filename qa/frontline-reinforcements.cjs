const assert=require('assert');
module.exports=function({run}){
 const report=run(`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error(msg)},summary={};
  setup();
  const heavyByCountry=[[1,2],[1,1,2],[1,16],[2],[],[],[],[]];
  for(let f=0;f<factions.length;f++){
   const ownCities=cities.filter(q=>q.f===f);
   const army=units.filter(u=>u.f===f&&['infantry','armor','artillery'].includes(TYPES[u.type].branch));
   for(const q of ownCities){
    const garrison=army.filter(u=>u.tile===q.tile);
    check(garrison.length===1&&TYPES[garrison[0].type].branch==='infantry','Incorrect city garrison: '+q.name);
   }
   const reserves=army.filter(u=>TYPES[u.type].branch!=='infantry');
   check(JSON.stringify(reserves.map(u=>u.type))===JSON.stringify(heavyByCountry[f]),'Incorrect heavy reserve: '+f);
   check(army.length===ownCities.length+reserves.length,'Unexpected field infantry: '+f);
   check(reserves.every(u=>tiles[u.tile].owner===f&&!cityAt(u.tile)&&!baseAt(u.tile)&&units.filter(v=>v.tile===u.tile).length===1),'Invalid reserve placement: '+f);
   summary[f]={infantry:ownCities.length,heavy:reserves.length};
  }
  check(Object.values(summary).reduce((n,a)=>n+a.infantry,0)===190,'Conquest city count');
  const ships=units.filter(u=>u.f===0&&u.initialFrontlineReinforcement&&isNaval(u)),front=reinforcementFrontDepth(0);
  check(ships.length===4,'Forward fleet missing');
  const northern=ships.filter(u=>tiles[u.tile].y<Math.min(...front.border.map(i=>tiles[i].y)));
  check(northern.length===2&&northern.filter(u=>u.type===25).length===1&&northern.filter(u=>u.type===23).length===1,'Northern fleet must be exactly one carrier and one frigate');
  for(const [type,count]of [[25,1],[24,1],[23,2]])check(ships.filter(u=>u.type===type).length===count,'Fleet composition '+type);
  check(ships.every(u=>tiles[u.tile].owner<0&&u.level===2&&u.westernFleet&&Math.min(...front.border.map(i=>distance(i,u.tile)))<=12),'Fleet too far from western front');
  check(ships.every(u=>units.filter(v=>!v.carriedBy&&v.hp>0&&v.tile===u.tile).length===1),'Fleet overlaps another unit');
  const roster=()=>JSON.stringify(units.map(u=>[u.id,u.f,u.type,u.tile]));
  const before=roster();
  setup();check(roster()===before,'Restart changes the starting roster');
  const oldSave=JSON.parse(JSON.stringify(snapshot()));
  oldSave.appVersion='1.12.10';
  const extra=makeUnit(0,1,tiles.findIndex((t,i)=>t.owner===0&&!unitAt(i)&&!cityAt(i)&&!baseAt(i)));
  oldSave.units.push(extra);oldSave.uid=uid;
  units=oldSave.units;cities=oldSave.cities;
  migrateArmy(oldSave);check(units.some(u=>u.id===extra.id&&u.type===1),'Save migration removed a preexisting tank');
  setup();check(roster()===before,'Restart after migration changes the starting roster');
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
 assert.equal(Object.values(report).reduce((n,a)=>n+a.heavy,0),8);
 console.log('PASS: conquest city garrisons and reserves, forward fleet, save/restart stability, mirrored MG muzzle paint and 35% carrier scaling',report);
};

