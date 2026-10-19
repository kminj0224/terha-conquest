'use strict';
// Dante fleet artwork: carrier, destroyer, frigate, in supplied order.
// Widths follow existing carrier/surface-ship rendering dimensions.
const danteFleetImages={
 25:loadBaekArt('dante-carrier.webp'),
 24:loadBaekArt('dante-destroyer.webp'),
 23:loadBaekArt('dante-frigate.webp')
};
function isDanteFleetArt(u){return u.f===1&&!!danteFleetImages[u.type]}
function danteFleetFacing(u){return u.danteFleetFacing===-1?-1:u.danteFleetFacing===1?1:Number.isFinite(u.angle)&&Math.cos(u.angle)<0?-1:1}
function faceDanteFleet(u,from,to){if(isDanteFleetArt(u)&&Math.abs(to.x-from.x)>.001)u.danteFleetFacing=to.x>from.x?1:-1}
const danteFleetAim=beginAim;
beginAim=function(u,p,d){faceDanteFleet(u,pxy(u.tile),p);return danteFleetAim(u,p,d)};
const danteFleetMove=moveUnit;
moveUnit=function(u,i,ai=false){const from=pxy(u.tile),ok=danteFleetMove(u,i,ai);if(ok&&isDanteFleetArt(u)){faceDanteFleet(u,from,pxy(i));if(!ai)save()}return ok};
const danteFleetSprite=sprite;
sprite=function(u,p,now){
 if(!isDanteFleetArt(u)||!danteFleetImages[u.type].idleReady)return danteFleetSprite(u,p,now);
 const motion=movingAnimation(u.id);
 if(motion){const t=Math.max(0,Math.min(1,(now-motion.start)/motion.duration));p={x:motion.from.x+(motion.to.x-motion.from.x)*t,y:motion.from.y+(motion.to.y-motion.from.y)*t}}
 const art=danteFleetImages[u.type].idle;
 const width=u.type===25?132*NAVAL_VISUAL_SCALE:110*NAVAL_VISUAL_SCALE;
 const height=width*art.naturalHeight/art.naturalWidth;
 ctx.save();ctx.translate(p.x,p.y-3);
 ctx.fillStyle='#061c2866';ctx.beginPath();ctx.ellipse(0,12,width*.45,7*NAVAL_VISUAL_SCALE,0,0,Math.PI*2);ctx.fill();
 // All supplied Dante ship silhouettes face right.
 ctx.scale(danteFleetFacing(u),1);
 ctx.drawImage(art,-width/2,14-height,width,height);
 ctx.restore();
 if(cam.z>.55){
  ctx.save();ctx.translate(p.x,p.y-3);
  ctx.font='bold 9px Terha,sans-serif';ctx.textAlign='center';ctx.lineWidth=2.5;ctx.strokeStyle='#10222b';
  ctx.strokeText(TYPES[u.type].name+' '+u.level,0,38);ctx.fillStyle='#eee7d2';ctx.fillText(TYPES[u.type].name+' '+u.level,0,38);
  rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color);
  ctx.restore();
 }
};
Object.assign(window.Terha,{moveUnit,faceDanteFleet,danteFleetFacing,isDanteFleetArt});
