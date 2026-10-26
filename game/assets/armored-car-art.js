'use strict';
// Distinct light-tank hulls fitted with compact, matching autocannon turrets.
const armoredCarArt=[loadBaekArt('baek-armored-car.webp'),loadBaekArt('dante-armored-car.webp'),
 loadBaekArt('stetopia-armored-car.webp'),null,loadBaekArt('ranna-armored-car.webp'),loadBaekArt('nakwol-armored-car.webp'),null];
armoredCarArt[3]=ayriaDesertArt(armoredCarArt[1]);
// Sielun uses the existing silver northern equipment style.
armoredCarArt[6]=armoredCarArt[2];
const ARMORED_CAR_PROFILES=[
 {base:1,mx:.605,my:.105},{base:-1,mx:.36,my:.093},{base:-1,mx:.388,my:.07},
 {base:-1,mx:.36,my:.093},{base:1,mx:.637,my:.09},{base:-1,mx:.402,my:.074},{base:-1,mx:.388,my:.07}
];
const ARMORED_CAR_BURST_MS=1500,ARMORED_CAR_ROUND_MS=75,ARMORED_CAR_ROUNDS=20;
const armoredCarBursts=new Map();
TYPES[12].attackWindup=ARMORED_CAR_BURST_MS;
COMBAT_FX_SOUNDS.armoredCarHit='armored_autocannon_hit';
function isArmoredCar(u){return u?.type===12}
function faceArmoredCar(u,from,to){if(isArmoredCar(u)&&Math.abs(to.x-from.x)>.001)u.tankFacing=to.x>from.x?1:-1}
function armoredCarBox(u){const image=armoredCarArt[u.f].idle,h=64*(image.naturalHeight||image.height||700)/(image.naturalWidth||image.width||1750);return{x:-32,y:14-h,w:64,h}}
function armoredCarMuzzle(u,p){const a=ARMORED_CAR_PROFILES[u.f],b=armoredCarBox(u),flip=baekTankFacing(u)===a.base?1:-1;return scaleUnitMuzzle(u,p,{x:p.x+(a.mx-.5)*b.w*flip,y:p.y-3+b.y+a.my*b.h})}
function armoredCarFlash(elapsed){return elapsed>=0&&elapsed<ARMORED_CAR_BURST_MS&&elapsed%ARMORED_CAR_ROUND_MS<43}
const armoredCarAim=beginAim;
beginAim=function(u,target,duration){faceArmoredCar(u,pxy(u.tile),target);return armoredCarAim(u,target,duration)};
const armoredCarMove=moveUnit;
moveUnit=function(u,i,ai=false){const from=pxy(u.tile),ok=armoredCarMove(u,i,ai);if(ok&&isArmoredCar(u)){faceArmoredCar(u,from,pxy(i));if(!ai)save()}return ok};
const armoredCarLaunch=launchShot;
launchShot=function(u,target,start=performance.now(),duration=520){
 if(!isArmoredCar(u))return armoredCarLaunch(u,target,start,duration);
 if(skipAIAnimations())return pxy(u.tile);
 faceArmoredCar(u,pxy(u.tile),target);const m=armoredCarMuzzle(u,pxy(u.tile));
 fireMotions.set(u.id,{start,duration:ARMORED_CAR_BURST_MS,autocannon:true});
 armoredCarBursts.set(u.id,{start,target:{x:target.x,y:target.y}});
 queueCombatSound('armored_autocannon',pxy(u.tile),start,.78,1,false,{fixedRate:true,end:start+ARMORED_CAR_BURST_MS});
 // Hits are local shell detonations, never moving tracer/projectile FX.
 for(let j=0;j<ARMORED_CAR_ROUNDS;j++)fx.push({kind:'armoredCarHit',x:target.x+Math.sin(j*2.399)*5,y:target.y+Math.cos(j*1.73)*3,round:j,start:start+35+j*ARMORED_CAR_ROUND_MS,duration:230});
 return m;
};
const armoredCarImpact=targetExplosions;
targetExplosions=function(u,p,d,now=performance.now(),...rest){
 if(!isArmoredCar(u))return armoredCarImpact(u,p,d,now,...rest);
 const burst=armoredCarBursts.get(u.id);armoredCarBursts.delete(u.id);
 if(skipAIAnimations())return;
 if(!burst)fx.push({kind:'armoredCarHit',x:p.x,y:p.y,round:0,start:now,duration:230});
 fx.push({kind:'armoredCarDamage',x:p.x,y:p.y,damage:d,start:now,duration:650});
};
function drawArmoredCarEffect(e,t){
 ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=1-t;
 if(e.kind==='armoredCarDamage'){
  ctx.fillStyle='#fff0cf';ctx.font='bold 14px Terha,sans-serif';ctx.textAlign='center';ctx.fillText('−'+e.damage,0,-29-t*24);
 }else{
  const flare=Math.max(0,1-t*3.2),seed=e.round||0;
  circle(0,-9,3+9*t,'#ef84313b');
  if(flare>0){circle(0,-9,7*flare,'#ffb34d');circle(0,-9,3.6*flare,'#fff8d2')}
  for(let j=0;j<7;j++){
   const a=j*2.399+seed*.71,r=2+t*(13+j%3*5),x=Math.cos(a)*r,y=-9+Math.sin(a)*r*.6-t*7;
   line(x-Math.cos(a)*4*(1-t),y-Math.sin(a)*3*(1-t),x,y,j%3?'#ffbc65':'#fff1ba',1.3);
  }
  ctx.globalAlpha=(1-t)*.32;
  for(let j=0;j<3;j++)circle(Math.sin(seed+j*2.1)*(3+t*6),-9-t*(12+j*3),2+t*5,j%2?'#777b7a':'#b6b0a1');
 }
 ctx.restore();
}
const armoredCarSprite=sprite;
sprite=function(u,p,now){
 if(!isArmoredCar(u)||!armoredCarArt[u.f].idleReady)return armoredCarSprite(u,p,now);
 p=unitVisualPosition(u,now);const a=ARMORED_CAR_PROFILES[u.f],b=armoredCarBox(u),fire=fireMotions.get(u.id),elapsed=fire?now-fire.start:-1;
 ctx.save();ctx.translate(p.x,p.y-3);ctx.globalAlpha=1;
 ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,12,27,9,0,0,Math.PI*2);ctx.fill();
 beginLargeUnitBody(u,14);ctx.save();ctx.scale(baekTankFacing(u)===a.base?1:-1,1);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(armoredCarArt[u.f].idle,b.x,b.y,b.w,b.h);
 if(armoredCarFlash(elapsed)){const phase=elapsed%ARMORED_CAR_ROUND_MS/43,r=4.3+3.2*(1-phase),x=(a.mx-.5)*64,y=b.y+a.my*b.h;ctx.save();ctx.translate(x,y);ctx.scale(a.base,1);poly([[-1,-1],[r*.7,-r*.7],[r*.6,-1],[r*2.1,0],[r*.6,1],[r*.7,r*.7],[-1,1]],'#ffbd55');circle(0,0,2.2,'#fff7d2');ctx.restore()}
 ctx.restore();endLargeUnitBody();
 if(fire&&elapsed>=fire.duration)fireMotions.delete(u.id);
 if(cam.z>.55){ctx.font='bold 9px Terha,sans-serif';ctx.textAlign='center';ctx.lineWidth=2.5;ctx.strokeStyle='#10222b';ctx.strokeText(TYPES[u.type].name+' '+u.level,0,38);ctx.fillStyle='#eee7d2';ctx.fillText(TYPES[u.type].name+' '+u.level,0,38);rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}
 ctx.restore();
};
const armoredCarSetup=setup;setup=function(...args){armoredCarBursts.clear();return armoredCarSetup(...args)};
const armoredCarMigration=migrateArmy;migrateArmy=function(...args){armoredCarBursts.clear();return armoredCarMigration(...args)};
Object.assign(window.Terha,{sprite,launchShot,moveUnit,isArmoredCar,faceArmoredCar,armoredCarMuzzle,armoredCarFlash,drawArmoredCarEffect,targetExplosions,setup,migrateArmy});

