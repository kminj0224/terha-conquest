'use strict';
// Historical helper names remain for older renderer integrations; type 17 is now infantry.
const devilRiderArt=loadBaekArt('dante-commando-idle.png','dante-commando-fire.png');
const DEVIL_RIDER_BOX={x:-28.8,y:-29.2,w:57.6,h:43.2,bottom:14};
const DANTE_COMMANDO_MUZZLES=[[565,240],[1013,248],[1440,261],[823,619],[1343,592]];
function isDevilRider(u){return u.type===17&&u.f===1}
function devilRiderFacing(u){return u.devilFacing===-1?-1:u.devilFacing===1?1:Number.isFinite(u.angle)&&Math.cos(u.angle)<0?-1:1}
function faceDevilRider(u,from,to){if(isDevilRider(u)&&Math.abs(to.x-from.x)>.001)u.devilFacing=to.x>from.x?1:-1}
function danteCommandoMuzzles(u,p){return DANTE_COMMANDO_MUZZLES.map(([x,y])=>({x:p.x+devilRiderFacing(u)*(DEVIL_RIDER_BOX.x+x/1448*DEVIL_RIDER_BOX.w),y:p.y-3+DEVIL_RIDER_BOX.y+y/1086*DEVIL_RIDER_BOX.h}))}
function devilRiderMuzzle(u,p){return danteCommandoMuzzles(u,p)[0]}
const devilAim=beginAim;beginAim=function(u,p,d){faceDevilRider(u,pxy(u.tile),p);return devilAim(u,p,d)};
const devilMove=moveUnit;moveUnit=function(u,i,ai=false){const from=pxy(u.tile),ok=devilMove(u,i,ai);if(ok&&isDevilRider(u)){faceDevilRider(u,from,pxy(i));if(!ai)save()}return ok};
const devilLaunch=launchShot;launchShot=function(u,target,start=performance.now(),duration=520){
 if(!isDevilRider(u))return devilLaunch(u,target,start,duration);
 const p=pxy(u.tile);faceDevilRider(u,p,target);const points=danteCommandoMuzzles(u,p);
 fireMotions.set(u.id,{start,duration:600,burst:true});infantryHitTimes.set(u.id,start+600);
 for(let j=0;j<8;j++)for(const m of points){const shotStart=start+j*70;
  fx.push({kind:'infantryMuzzle',x:m.x,y:m.y,angle:devilRiderFacing(u)>0?0:Math.PI,start:shotStart,duration:55});
 }
 return points[0];
};
const devilSprite=sprite;sprite=function(u,p,now){
 if(!isDevilRider(u)||!devilRiderArt.idleReady||!devilRiderArt.fireReady)return devilSprite(u,p,now);
 const move=movingAnimation(u.id);if(move){const t=Math.max(0,Math.min(1,(now-move.start)/move.duration));p={x:move.from.x+(move.to.x-move.from.x)*t,y:move.from.y+(move.to.y-move.from.y)*t}}
 const fire=fireMotions.get(u.id),elapsed=fire?now-fire.start:-1,firing=elapsed>=0&&elapsed<fire.duration;
 ctx.save();ctx.translate(p.x,p.y-3);ctx.globalAlpha=1;ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,14,24,5.6,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.scale(devilRiderFacing(u),1);ctx.drawImage(devilRiderArt[firing?'fire':'idle'],DEVIL_RIDER_BOX.x,DEVIL_RIDER_BOX.y,DEVIL_RIDER_BOX.w,DEVIL_RIDER_BOX.h);ctx.restore();
 if(fire&&elapsed>=fire.duration)fireMotions.delete(u.id);
 if(cam.z>.55){ctx.font='bold 9px Terha,sans-serif';ctx.textAlign='center';ctx.lineWidth=2.5;ctx.strokeStyle='#10222b';ctx.strokeText(TYPES[u.type].name+' '+u.level,0,38);ctx.fillStyle='#eee7d2';ctx.fillText(TYPES[u.type].name+' '+u.level,0,38);rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}ctx.restore();
};
Object.assign(window.Terha,{moveUnit,devilRiderFacing,faceDevilRider,devilRiderMuzzle,danteCommandoMuzzles});
