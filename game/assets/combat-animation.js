'use strict';
// Every combat effect is a bounded raster composition. Unit bodies and tactical
// UI remain with their original renderers. Assets/frames are shared, never per city.
const dirtImpactArt=loadBaekArt('dirt-sequence.webp'),combatProjectileArt=loadBaekArt('combat-projectiles.webp'),nuclearCloudArt=loadBaekArt('nuclear-cloud.webp');
const cityFlameFrames=[],projectileTextures=new Map();
const COMBAT_RASTER_KINDS=new Set(['shot','baekArtilleryShell','baekRocket','baekGrenade','navalMissile','missile','defenseMissile','samIntercept','laser','devilLaser','infantryMuzzle','infantrySmoke','navalSmoke','defenseFlame','nuclear','rally','doctrine']);
function prepareCityFlameFrames(){
 if(cityFlameFrames.length||!cityFlameArt.idleReady)return cityFlameFrames;
 const source=cityFlameArt.idle,sw=source.naturalWidth,sh=source.naturalHeight;
 for(let frame=0;frame<12;frame++){
  const image=document.createElement('canvas');image.width=112;image.height=128;
  const paint=image.getContext('2d'),phase=frame/12*Math.PI*2;
  // Moving strips advect the original flame texture upward and bend separate
  // tongues at different phases; the foot stays fixed and transparent.
  for(let band=0;band<64;band++){
   const y=band*2,weight=Math.pow(1-y/128,1.35),shift=(Math.sin(phase-band*.19)*5.4+Math.sin(phase*2-band*.31)*2)*weight;
   const sy=Math.max(0,Math.min(sh-2/128*sh,(y+(Math.sin(phase-band*.16)*7+Math.sin(phase*2-band*.23)*3)*weight)/128*sh));
   paint.globalAlpha=.9+.1*Math.sin(phase-band*.15);paint.drawImage(source,0,sy,sw,sh*2/128,shift,y,112,2);
  }
  cityFlameFrames.push(image);
 }
 return cityFlameFrames;
}
const flameLoaded=cityFlameArt.idle.onload;
cityFlameArt.idle.onload=function(...args){flameLoaded?.apply(this,args);prepareCityFlameFrames()};
prepareCityFlameFrames();
function projectileTexture(kind){
 if(!combatProjectileArt.idleReady)return null;
 let image=projectileTextures.get(kind);if(image)return image;
 const source=combatProjectileArt.idle,index=kind==='cyanMuzzle'?3:kind;
 const boxes=[[0,110,670,270],[710,160,550,200],[10,470,660,310],[680,420,580,400],[0,820,650,425],[650,820,611,425]],box=boxes[index],sx=source.naturalWidth/1261,sy=source.naturalHeight/1247;
 image=document.createElement('canvas');image.width=192;image.height=96;
 const paint=image.getContext('2d');paint.drawImage(source,box[0]*sx,box[1]*sy,box[2]*sx,box[3]*sy,0,0,192,96);
 if(kind==='cyanMuzzle'){paint.globalCompositeOperation='source-atop';paint.fillStyle='#84efff';paint.fillRect(0,0,192,96)}
 projectileTextures.set(kind,image);return image;
}
const projectileLoaded=combatProjectileArt.idle.onload;
combatProjectileArt.idle.onload=function(...args){projectileLoaded?.apply(this,args);for(const key of [0,1,2,3,4,5,'cyanMuzzle'])projectileTexture(key)};
function paintProjectile(kind,x,y,width,height,angle=0,alpha=1){
 const image=projectileTexture(kind);if(!image)return;
 ctx.save();ctx.translate(x,y);if(angle)ctx.rotate(angle);ctx.globalAlpha*=alpha;
 nativeMapDrawImage(image,-width/2,-height/2,width,height);ctx.restore();
}
function drawMuzzleIllustration(x,y,size,angle=0,cyan=false){paintProjectile(cyan?'cyanMuzzle':3,x+Math.cos(angle)*size*.8,y+Math.sin(angle)*size*.8,size*2.4,size*1.1,angle)}
function drawDirtImpact(x,y,t,size,bottom=null){
 const image=softEffectTexture(dirtImpactArt);if(!image)return;
 const w=size*1.2,h=size,sw=image.naturalWidth/5,frame=Math.min(4,Math.max(0,Math.floor(t*5)));
 ctx.save();ctx.globalAlpha*=Math.min(1,(1-t)*5);
 nativeMapDrawImage(image,frame*sw,0,sw,image.naturalHeight,x-w/2,bottom==null?y+12-h:bottom-h*DIRT_FRAME_FEET[frame],w,h);ctx.restore();
}
function drawArmorImpact(e,t,flesh,ground=e.explosionGroundY??e.y+12,now=performance.now()){
 if(!flesh&&t<.3)drawDirectionalHitFrame(e,0,Math.min(.99,t/.3),S*1.6,now);
 if(flesh)drawDirtImpact(e.x,e.y,t,S*1.42,ground);
 // The old untimed direct renderer also retains the spark -> smoke sequence.
 if(e.burstDuration==null&&t>.3)drawImpactSmoke(e.x,e.y,S*1.38,(t-.3)/.7,.95);
}
function drawIllustratedBomb(x,y,angle=Math.PI/2){paintProjectile(2,x,y,22,13,angle)}
function combatTrajectory(e,t){
 const k=e.kind,dx=e.tx-e.x,dy=e.ty-e.y;
 if(k==='baekArtilleryShell')return baekArtilleryPosition(e,t);
 if(k==='baekRocket'||k==='baekGrenade')return baekProjectilePosition(e,t);
 if(k==='defenseMissile')return defenseMissilePosition(e,t);
 const p=k==='shot'?Math.min(1,t*1.7):t;
 const arc=k==='missile'?220:k==='navalMissile'?20:k==='shot'&&TYPES[e.type]?.branch==='artillery'?Math.max(100,Math.hypot(dx,dy)*.38):0;
 return{x:e.x+dx*p,y:e.y+dy*p-Math.sin(p*Math.PI)*arc};
}
function effectVisible(x,y,margin=180){return Math.abs(x-cam.x)<=screenW/2/cam.z+margin&&Math.abs(y-cam.y)<=screenH/2/cam.z+margin}
const rasterImpactRenderer=drawIllustratedEffect;
drawIllustratedEffect=function(e,t){
 if(ILLUSTRATED_HITS.has(e.kind))return rasterImpactRenderer(e,t);
 const k=e.kind;if(!COMBAT_RASTER_KINDS.has(k))return false;
 if(k==='laser'||k==='devilLaser'){
  const x=(e.x+e.tx)/2,y=(e.y+e.ty)/2;if(!effectVisible(x,y,Math.hypot(e.tx-e.x,e.ty-e.y)/2+80))return true;
  paintProjectile(k==='devilLaser'?5:4,x,y,Math.hypot(e.tx-e.x,e.ty-e.y)+18,18,Math.atan2(e.ty-e.y,e.tx-e.x),1-t);return true;
 }
 if(Number.isFinite(e.tx)){
  const p=combatTrajectory(e,t);if(!effectVisible(p.x,p.y))return true;
  const previous=combatTrajectory(e,Math.max(0,t-.02)),angle=Math.atan2(p.y-previous.y,p.x-previous.x);
  const missile=['navalMissile','missile','defenseMissile','samIntercept','baekRocket'].includes(k)||k==='baekArtilleryShell'&&e.type===3;
  paintProjectile(e.laserShell?4:k==='baekGrenade'?2:missile?0:1,p.x,p.y,missile?48:e.bullet?17:24,missile?22:13,angle);return true;
 }
 if(!effectVisible(e.x,e.y,k==='nuclear'?460:180))return true;
 if(k==='infantryMuzzle'||k==='defenseFlame'){drawMuzzleIllustration(e.x,e.y,k==='defenseFlame'?26:9,e.angle||0);return true}
 if(k==='infantrySmoke'){legacyInfantryEffect(e,t);return true}
 if(k==='navalSmoke'){drawImpactSmoke(e.x,e.y,66,t,.7);return true}
 if(k==='nuclear'){
  if(nuclearCloudArt.idleReady){const w=500,h=440;ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*4);nativeMapDrawImage(nuclearCloudArt.idle,e.x-w/2,e.y+12-h,w,h);ctx.restore()}
  return true;
 }
 if(k==='rally'||k==='doctrine'){effectFrame(0,t,e.x,e.y,40);return true}
 return true;
};
// Preserve the existing muzzle positions and timing in every national sprite.
// Only the exact seven-point flash signature and dedicated flash colors change.
const flashPoly=poly;
const MUZZLE_POLY_COLORS=new Set(['#ffd470','#ffce67','#ffbd55','#59d7ff','#ffb849']);
poly=function(points,color,...rest){
 if(points.length===7&&MUZZLE_POLY_COLORS.has(color)&&Math.abs(points[0][0])<=1&&Math.abs(points[0][1])<=2){
  let min=0,max=0,size=0;for(const p of points){min=Math.min(min,p[0]);max=Math.max(max,p[0]);size=Math.max(size,Math.abs(p[1]))}
  drawMuzzleIllustration(0,0,Math.max(4,Math.max(-min,max)*.7),-min>max?Math.PI:0,color==='#59d7ff');return;
 }
 return flashPoly(points,color,...rest);
};
const flashCircle=circle;
const MUZZLE_CIRCLE_COLORS=new Set(['#ffce69','#ffdb82','#b4fbff','#ffad4f','#ffe59a','#ffdf91','#bdfaff']);
const MUZZLE_CORE_COLORS=new Set(['#fff8d5','#fff6d5','#fff7d2','#fff8d8','#e3fdff','#fff6d3']);
circle=function(x,y,r,color,...rest){
 if(MUZZLE_CORE_COLORS.has(color))return;
 if(MUZZLE_CIRCLE_COLORS.has(color)){if(r>0)drawMuzzleIllustration(x,y,r*1.5,x<0?Math.PI:0,color==='#bdfaff'||color==='#b4fbff');return}
 return flashCircle(x,y,r,color,...rest);
};

// Legacy direct renderer entry points also use the raster path.
const legacyInfantryEffect=drawInfantryFireEffect,legacyArmoredEffect=drawArmoredCarEffect;
drawInfantryFireEffect=function(e,t){if(!drawIllustratedEffect(e,t))return legacyInfantryEffect(e,t)};
drawArmoredCarEffect=function(e,t){if(!drawIllustratedEffect(e,t))return legacyArmoredEffect(e,t)};
drawBaekArtilleryEffect=function(e,t){drawIllustratedEffect(e,t)};
drawBaekProjectile=function(e,t){drawIllustratedEffect(e,t)};
drawDefenseEffect=function(e,t){drawIllustratedEffect(e,t)};
drawStrategicEffect=function(e,t){drawIllustratedEffect(e,t)};
drawNavalEffect=function(e,t){
 if(e.kind==='navalSink'){
  ctx.save();ctx.translate(e.x,e.y+t*12);ctx.globalAlpha=Math.min(1,(1-t)*4);drawShip({type:e.type,f:e.f},0,-1);ctx.restore();drawImpactSmoke(e.x,e.y,78,t,.9);return;
 }
 drawIllustratedEffect(e,t);
};
for(const key of [0,1,2,3,4,5,'cyanMuzzle'])projectileTexture(key);
Object.assign(window.Terha,{drawIllustratedEffect,drawArmorImpact,drawDirtImpact,prepareCityFlameFrames,drawIllustratedBomb,drawMuzzleIllustration,drawInfantryFireEffect,drawArmoredCarEffect,drawBaekArtilleryEffect,drawBaekProjectile,drawDefenseEffect,drawStrategicEffect,drawNavalEffect});
