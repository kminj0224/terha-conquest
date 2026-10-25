'use strict';
// Type 11 retains its statistics and save ID. Only artwork and firing audio change.
const motorizedVehicleArt={
 0:{left:loadBaekArt('baek-motorized-left.png'),right:loadBaekArt('baek-motorized-right.png')},
 1:{art:loadBaekArt('dante-motorized.png'),baseFacing:-1,crop:[25,339,1491,504]},
 2:{art:loadBaekArt('stetopia-motorized.png'),baseFacing:-1,crop:[7,308,1766,549]},
 4:{art:loadBaekArt('ranna-motorized.png'),baseFacing:1,crop:[16,327,1640,523]},
 5:{art:loadBaekArt('nakwol-motorized.png'),baseFacing:-1,crop:[22,277,1723,608]}
};
motorizedVehicleArt[3]={...motorizedVehicleArt[1],art:ayriaDesertArt(motorizedVehicleArt[1].art)};
motorizedVehicleArt[6]=motorizedVehicleArt[2];
const motorizedInfantryProfile=infantryArtProfile;
function motorizedFiringProfile(u){
 const rifle=motorizedInfantryProfile({...u,type:0});
 return rifle?{...rifle,burst:true,burstShots:8}:null;
}
infantryArtProfile=function(u){return u.type===11?motorizedFiringProfile(u):motorizedInfantryProfile(u)};
const motorizedWeaponProfile=combatWeaponProfile;
combatWeaponProfile=function(u){return u.type===11?{...motorizedWeaponProfile({...u,type:10})}:motorizedWeaponProfile(u)};
function motorizedVehicleProfile(u){
 const vehicle=motorizedVehicleArt[u.f];if(!vehicle)return null;
 const facing=baekRifleFacing(u);
 return {art:vehicle.art||(facing===1?vehicle.right:vehicle.left),crop:vehicle.crop,flip:!!vehicle.art&&facing!==vehicle.baseFacing};
}
const motorizedSprite=sprite;
sprite=function(u,p,now){
 if(u.type!==11)return motorizedSprite(u,p,now);
 const fire=fireMotions.get(u.id),elapsed=fire?now-fire.start:-1;
 // Delegate firing to the existing nationality-specific rifle renderer and muzzle flashes.
 if(fire&&elapsed>=0&&elapsed<fire.duration)return motorizedSprite(u,p,now);
 if(fire&&elapsed>=fire.duration)fireMotions.delete(u.id);
 const profile=motorizedVehicleProfile(u);
 if(!profile?.art.idleReady)return motorizedSprite(u,p,now);
 p=unitVisualPosition(u,now);
 const image=profile.art.idle,crop=profile.crop||[0,0,image.naturalWidth,image.naturalHeight],w=89.6,h=w*crop[3]/crop[2];
 ctx.save();ctx.translate(p.x,p.y-3);ctx.globalAlpha=1;
 ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,12,38,9,0,0,Math.PI*2);ctx.fill();
 ctx.save();if(profile.flip)ctx.scale(-1,1);ctx.drawImage(image,...crop,-w/2,14-h,w,h);ctx.restore();
 if(cam.z>.55){
  ctx.font='bold 9px Terha,sans-serif';ctx.textAlign='center';ctx.lineWidth=2.5;ctx.strokeStyle='#10222b';
  ctx.strokeText(TYPES[u.type].name+' '+u.level,0,38);ctx.fillStyle='#eee7d2';ctx.fillText(TYPES[u.type].name+' '+u.level,0,38);
  rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color);
 }
 ctx.restore();
};
Object.assign(window.Terha,{infantryArtProfile,combatWeaponProfile,motorizedFiringProfile,motorizedVehicleProfile});
