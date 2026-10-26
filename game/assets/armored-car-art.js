'use strict';
// Distinct light-tank hulls fitted with compact, matching autocannon turrets.
const armoredCarArt=[loadBaekArt('baek-armored-car.webp'),loadBaekArt('dante-armored-car.webp'),
 loadBaekArt('stetopia-armored-car.webp'),null,loadBaekArt('ranna-armored-car.webp'),loadBaekArt('nakwol-armored-car.webp'),null];
armoredCarArt[3]=ayriaDesertArt(armoredCarArt[1]);
// Sielun uses the existing silver northern equipment style.
armoredCarArt[6]=armoredCarArt[2];
const ARMORED_CAR_PROFILES=[
 {base:1,mx:.605,my:.105},{base:-1,mx:.36,my:.093},{base:-1,mx:.388,my:.07},
 {base:-1,mx:.29,my:.19},{base:1,mx:.605,my:.105},{base:-1,mx:.36,my:.093},{base:-1,mx:.388,my:.07}
];
function isArmoredCar(u){return u?.type===12}
function faceArmoredCar(u,from,to){if(isArmoredCar(u)&&Math.abs(to.x-from.x)>.001)u.tankFacing=to.x>from.x?1:-1}
function armoredCarBox(u){const image=armoredCarArt[u.f].idle,h=64*(image.naturalHeight||image.height)/(image.naturalWidth||image.width);return{x:-32,y:14-h,w:64,h}}
function armoredCarMuzzle(u,p){const a=ARMORED_CAR_PROFILES[u.f],b=armoredCarBox(u),flip=baekTankFacing(u)===a.base?1:-1;return scaleUnitMuzzle(u,p,{x:p.x+(a.mx-.5)*b.w*flip,y:p.y-3+b.y+a.my*b.h})}
const armoredCarAim=beginAim;
beginAim=function(u,target,duration){faceArmoredCar(u,pxy(u.tile),target);return armoredCarAim(u,target,duration)};
const armoredCarMove=moveUnit;
moveUnit=function(u,i,ai=false){const from=pxy(u.tile),ok=armoredCarMove(u,i,ai);if(ok&&isArmoredCar(u)){faceArmoredCar(u,from,pxy(i));if(!ai)save()}return ok};
const armoredCarLaunch=launchShot;
launchShot=function(u,target,start=performance.now(),duration=520){
 if(!isArmoredCar(u)||!armoredCarArt[u.f].idleReady)return armoredCarLaunch(u,target,start,duration);
 faceArmoredCar(u,pxy(u.tile),target);const m=armoredCarMuzzle(u,pxy(u.tile));
 fireMotions.set(u.id,{start,duration:300});
 fx.push({kind:'shot',x:m.x,y:m.y,tx:target.x,ty:target.y,type:12,start,duration});return m;
};
const armoredCarSprite=sprite;
sprite=function(u,p,now){
 if(!isArmoredCar(u)||!armoredCarArt[u.f].idleReady)return armoredCarSprite(u,p,now);
 p=unitVisualPosition(u,now);const a=ARMORED_CAR_PROFILES[u.f],b=armoredCarBox(u),fire=fireMotions.get(u.id),elapsed=fire?now-fire.start:-1;
 ctx.save();ctx.translate(p.x,p.y-3);ctx.globalAlpha=1;
 ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,12,27,9,0,0,Math.PI*2);ctx.fill();
 beginLargeUnitBody(u,14);ctx.save();ctx.scale(baekTankFacing(u)===a.base?1:-1,1);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(armoredCarArt[u.f].idle,b.x,b.y,b.w,b.h);
 if(elapsed>=0&&elapsed<120){const r=4*(1-elapsed/160),x=(a.mx-.5)*64,y=b.y+a.my*b.h;ctx.save();ctx.translate(x,y);ctx.scale(a.base,1);poly([[-1,-1],[r,-r*.6],[r*2,0],[r,r*.6],[-1,1]],'#ffce67');circle(0,0,1.5,'#fff6d5');ctx.restore()}
 ctx.restore();endLargeUnitBody();
 if(fire&&elapsed>=fire.duration)fireMotions.delete(u.id);
 if(cam.z>.55){ctx.font='bold 9px Terha,sans-serif';ctx.textAlign='center';ctx.lineWidth=2.5;ctx.strokeStyle='#10222b';ctx.strokeText(TYPES[u.type].name+' '+u.level,0,38);ctx.fillStyle='#eee7d2';ctx.fillText(TYPES[u.type].name+' '+u.level,0,38);rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}
 ctx.restore();
};
Object.assign(window.Terha,{sprite,moveUnit,isArmoredCar,faceArmoredCar,armoredCarMuzzle});
