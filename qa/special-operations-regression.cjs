const assert=require('assert');
module.exports=async function({run}){
 await run(`(async()=>{
 const check=(v,m)=>{if(!v)throw Error(m)};
 setup();busy=false;player=0;tech.fill(0);money.fill(0);oil.fill(100000);food.fill(100000);
 check(TYPES.length===29&&TYPES[17].name==='특공군단'&&TYPES[17].branch==='infantry','Replacement ID/category');
 const trooper=makeUnit(1,17,cities.find(q=>q.f===1).tile,1);
 check(unitMaxHp(trooper)===130&&unitAttack(trooper)===55&&TYPES[17].move===13,'Commando stats');
 check(!TYPES[17].tank&&!TYPES[17].smallArms&&!TYPES[17].antiInfantry,'Legacy armor effects removed');
 check(combatWeaponProfile(trooper).name==='rifle'&&combatWeaponProfile(trooper).shots===8&&combatImpactProfile(trooper)==='bullet_hit','Commando audio');
 for(const k of [6,17,18,DEKPHUING_GUERRILLA,NAKWOL_COMMANDO]){
  const f=TYPES[k].special,q=cities.find(q=>q.f===f&&!q.capital);q.queue=null;q.produced=false;q.nukeUntil=0;
  for(const level of [3,4,5]){q.level=level;cityProfile(q);check(canProduce(q,k,1)===(level>=4),'Special level '+level+' type '+k)}
  const owner=q.f;q.f=(f+1)%7;check(!canProduce(q,k,1),'Wrong faction can produce special');q.f=owner;
  q.origin=(f+1)%7;check(!canProduce(q,k,1),'Captured city must request its owner special from a homeland city');q.origin=f;
 }
 const black=makeUnit(0,6,cities.find(q=>q.f===0).tile,1);freshOrders(black);
 check(mayFire(black)&&black.blackShots===2,'Black starts with two shots');spendShot(black);
 check(mayFire(black)&&black.blackShots===1&&!mayMove(black)&&black.ap>0,'Second attack remains usable');
 const saved=snapshot();migrateArmy(saved);check(black.blackShots===1&&mayFire(black),'Reload must retain one remaining shot');
 spendShot(black);check(!mayFire(black)&&black.blackShots===0&&black.ap===0,'Third attack forbidden');
 freshOrders(black);check(black.blackShots===2&&mayFire(black),'Next-turn reset');
 const original=trooper.hp;trooper.hp=65;const old=snapshot();delete old.specialOperationsSchema;old.units=old.units.map(u=>({...u,hp:u.id===trooper.id?250:u.hp}));
 migrateArmy(old);check(units.find(u=>u.id===trooper.id)?.hp===65,'Old 500 HP rider migrates proportionally to 130 HP');
 const previous=snapshot();previous.specialOperationsSchema=1;previous.units=previous.units.map(u=>({...u,hp:u.id===trooper.id?30:u.hp}));
 migrateArmy(previous);check(units.find(u=>u.id===trooper.id)?.hp===65,'v1.11.21 half-health commandos migrate to 130 HP proportionally');
 const current=snapshot();migrateArmy(current);check(units.find(u=>u.id===trooper.id)?.hp===65,'Current save must not scale HP again');trooper.hp=original;
 const own=cities.filter(q=>q.f===1);for(const q of own){q.level=5;q.produced=true;q.queue=null;q.nukeUntil=0;cityProfile(q)}
 const q=own.find(q=>!q.capital);q.level=3;q.produced=false;cityProfile(q);q.hp=cityMaxHp(q)-500;
 money[1]=UPGRADE_COSTS[3];food[1]=100000;
 siegeAIProcure(1,[q]);check(q.level===4&&q.hp===cityMaxHp(q)-500,'AI upgrades at exact funds and keeps damage');
 check(q.queue?.type===17,'AI produces special immediately in upgraded city');check(money[1]===0,'AI cannot overspend gold');
 for(let n=0;n<3;n++){q.produced=false;q.queue=null;turn++;food[1]=10000;money[1]=1234;siegeAIProcure(1,[q]);check(q.queue?.type===17,'Special must be ordered each turn');check(money[1]===1234,'Upgrade savings survive procurement')}
 turn++;
 const q2=own.find(c=>c!==q&&!c.capital);q2.level=4;q2.produced=false;q2.queue=null;q.produced=false;q.queue=null;money[1]=0;food[1]=1200;
 siegeAIProcure(1,[q,q2]);check([q,q2].filter(c=>c.queue?.type===17).length===1,'Only one special per faction per turn');
 check([q,q2].some(c=>c.queue&&TYPES[c.queue.type].special===undefined),'Other city must recruit ordinary troops');
 q.produced=false;q.queue=null;q2.produced=false;q2.queue=null;
 check(aiOrderSpecials(1,[q,q2])===0&&!q.queue&&!q2.queue,'Repeated procurement cannot bypass per-turn cap');
 const orderedSave=snapshot();migrateArmy(orderedSave);
 check(aiOrderSpecials(1,[q,q2])===0,'Reload must preserve the special order limit');
 for(const f of [0,1,2,4,5]){
  turn++;const pair=cities.filter(c=>c.f===f).slice(0,2);for(const c of pair){c.level=5;c.nukeUntil=0;c.produced=false;c.queue=null;cityProfile(c)}
  food[f]=100000;oil[f]=100000;money[f]=0;
  siegeAIProcure(f,pair);
  check(pair.filter(c=>c.queue&&TYPES[c.queue.type].special===f).length===1,'Exactly one special in faction '+f);
  check(pair.some(c=>c.queue&&TYPES[c.queue.type].special===undefined),'Ordinary production remains available in faction '+f);
  check(aiOrderSpecials(f,pair)===0,'One-per-turn limit covers every faction');
 }
 turn++;
 q.produced=false;q.queue=null;food[1]=599;siegeAIProcure(1,[q]);check(!q.queue||q.queue.type!==17,'No unaffordable special');
 const p=pxy(trooper.tile);fx=[];launchShot(trooper,{x:p.x+100,y:p.y},performance.now());
 const flashes=fx.filter(e=>e.kind==='infantryMuzzle');check(flashes.length===40,'Five muzzle positions times eight burst rounds');
 check(new Set(flashes.map(e=>e.start)).size===8&&!fx.some(e=>e.kind==='devilLaser'),'Burst timing and no old laser');
 check(!fx.some(e=>['shot','devilLaser','laser'].includes(e.kind)),'Commando must not draw flying bullets or lasers');
 targetExplosions(trooper,{x:p.x+100,y:p.y},25);
 check(fx.some(e=>e.kind==='infantrySpark'&&e.damage===25),'Commando must use infantry hit animation');
 check(Math.abs(DEVIL_RIDER_BOX.w-72*.8)<.001&&Math.abs(DEVIL_RIDER_BOX.h-54*.8)<.001&&Math.abs(DEVIL_RIDER_BOX.y+DEVIL_RIDER_BOX.h-14)<.001,'Commando art scales down 20% at feet');
 const blackProfile=infantryArtProfile(black);
 check(Math.abs(blackProfile.width-70.4*1.1)<.001&&Math.abs(blackProfile.height-52.8*1.1)<.001,'Black Legion art scales up 10%');
 const oldBlackMuzzles=baekMuzzles([[45,186],[466,172],[912,193],[168,451],[685,473]]).map(m=>({x:m.x*1.1,y:14+(m.y-14)*1.1}));
 check(blackProfile.muzzles.every((m,i)=>Math.abs(m.x-oldBlackMuzzles[i].x*1.1)<.001&&Math.abs(m.y-(14+(oldBlackMuzzles[i].y-14)*1.1))<.001),'Black muzzle coordinates scale with artwork');
 const paintImage=ctx.drawImage,paintPoly=poly;let blackImage=null,blackFlashes=[];
 ctx.drawImage=function(img,...args){if(img===blackProfile.art.idle||img===blackProfile.art.fire)blackImage={img,args,m:ctx.getTransform()};return paintImage(img,...args)};
 poly=function(points,...args){if(args[0]==='#ffd470')blackFlashes.push(ctx.getTransform());return paintPoly(points,...args)};
 ctx.save();ctx.setTransform(1,0,0,1,0,0);
 try{for(const facing of [-1,1])for(const firing of [false,true]){
  black.rifleFacing=facing;blackImage=null;blackFlashes=[];
  if(firing)fireMotions.set(black.id,{start:1000,duration:700,burst:true});else fireMotions.delete(black.id);
  const bp=pxy(black.tile);sprite(black,bp,1010);
  check(!!blackImage,'Black Legion source artwork must render');
  const [x,y,w,h]=blackImage.args,m=blackImage.m,foot=firing?blackProfile.fireFoot:blackProfile.idleFoot;
  const footY=m.b*0+m.d*(y+h*foot)+m.f,hpTop=bp.y-3+21;
  check(Math.abs(footY-(hpTop-1))<.001,'Front-row feet must sit one pixel above HP bar');
  check(infantryArtBottom(blackProfile,firing)>14,'Black Legion image must move downward');
  if(firing){check(blackFlashes.length===5,'All five muzzle flashes must paint');
   for(let i=0;i<5;i++){const mx=blackProfile.muzzles[i].x,my=blackProfile.muzzles[i].y+infantryArtBottom(blackProfile,true)-14;
    check(Math.hypot(blackFlashes[i].e-(m.a*mx+m.c*my+m.e),blackFlashes[i].f-(m.b*mx+m.d*my+m.f))<.001,'Flash must follow moved body');
   }
  }
 }}finally{ctx.restore();ctx.drawImage=paintImage;poly=paintPoly;fireMotions.delete(black.id)}
 const points=danteCommandoMuzzles(trooper,p);faceDevilRider(trooper,p,{x:p.x-100,y:p.y});const mirrored=danteCommandoMuzzles(trooper,p);
 check(points.every((m,i)=>Math.abs(m.x+mirrored[i].x-2*p.x)<.001&&m.y===mirrored[i].y),'Muzzle mirroring matches sprite');
 check(devilRiderArt.idleReady&&devilRiderArt.fireReady,'Both supplied images decoded');
 setup();return true;
 })()`);
 console.log('PASS: special city eligibility, two Black Legion shots, commando replacement/migration/burst, AI upgrades/reserves and one special per faction per turn, ordinary recruitment and measured Black Legion boot/HP-bar alignment');
};
