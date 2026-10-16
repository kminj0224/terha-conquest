'use strict';
// Artwork changes only; production, statistics and tier multipliers stay shared.
const nakwolLightArt=loadBaekArt('nakwol-light.png'),nakwolTankArt=loadBaekArt('nakwol-tank.png'),nakwolEliteArt=loadBaekArt('nakwol-elite-left.png','nakwol-elite-right.png');
const originalBaekTankCheck=isBaekTank;
isBaekTank=function(u){return u.f===5&&[13,1,14].includes(u.type)||originalBaekTankCheck(u)};
const originalBaekTankProfile=baekTankProfile;
baekTankProfile=function(u){if(u.f!==5)return originalBaekTankProfile(u);const right=baekTankFacing(u)===1;
 if(u.type===13)return{art:nakwolLightArt,image:nakwolLightArt.idle,w:1774,h:886,mx:30,my:300,flip:right};
 if(u.type===14)return{art:nakwolEliteArt,image:right?nakwolEliteArt.fire:nakwolEliteArt.idle,w:1536,h:right?1022:1023,mx:right?1518:20,my:453,flip:false};
 return{art:nakwolTankArt,image:nakwolTankArt.idle,w:1618,h:958,mx:1600,my:442,flip:!right};
};
const nakwolSPArt=loadBaekArt('nakwol-sp-idle.png','nakwol-sp-fire.png'),nakwolMLArt=loadBaekArt('nakwol-ml-idle.png','nakwol-ml-fire.png');
const originalBaekArtilleryCheck=isBaekArtillery;
isBaekArtillery=function(u){return u.f===5&&[2,3].includes(u.type)||originalBaekArtilleryCheck(u)};
const originalBaekArtilleryProfile=baekArtilleryProfile;
baekArtilleryProfile=function(u,firing=false){if(u.f!==5)return originalBaekArtilleryProfile(u,firing);const rocket=u.type===3;return{art:rocket?nakwolMLArt:nakwolSPArt,w:firing?1448:rocket?1536:1516,h:firing?1086:rocket?892:754,mx:rocket?738:1381,my:rocket?118:79,baseFacing:1}};
TOWED_ART[5]={idle:loadBaekArt('nakwol-towed-idle.png'),move:loadBaekArt('nakwol-towed-move.png'),w:1536,h:1024,mw:2172,mh:724,base:-1,mx:83,my:76,angle:-2.55};
// Light tank's source faces left; its muzzle flash must follow its cannon.
const nakwolTankSprite=sprite;
sprite=function(u,p,now){if(u.f!==5||u.type!==13)return nakwolTankSprite(u,p,now);const a=baekTankProfile(u);if(!a.art.idleReady)return nakwolTankSprite(u,p,now);p=unitVisualPosition(u,now);const fire=fireMotions.get(u.id),elapsed=fire?now-fire.start:-1,h=64*a.h/a.w;
 ctx.save();ctx.translate(p.x,p.y-3);ctx.globalAlpha=1;ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,12,27,9,0,0,Math.PI*2);ctx.fill();beginLargeUnitBody(u,14);ctx.save();ctx.translate(baekTankRecoil(u,now),0);if(a.flip)ctx.scale(-1,1);ctx.drawImage(a.image,-32,14-h,64,h);
 if(elapsed>=0&&elapsed<120){const r=8*(1-elapsed/160);ctx.save();ctx.translate((a.mx/a.w-.5)*64,14-h+a.my/a.h*h);ctx.scale(-1,1);poly([[-1,-1],[r,-r*.6],[r*.8,-1],[r*2.2,0],[r*.8,1],[r,r*.6],[-1,1]],'#ffce67');circle(1,0,2,'#fff6d5');ctx.restore()}ctx.restore();endLargeUnitBody();if(fire&&elapsed>=fire.duration)fireMotions.delete(u.id);
 if(cam.z>.55){ctx.font='bold 9px Terha,sans-serif';ctx.textAlign='center';ctx.lineWidth=2.5;ctx.strokeStyle='#10222b';ctx.strokeText(TYPES[u.type].name+' '+u.level,0,38);ctx.fillStyle='#eee7d2';ctx.fillText(TYPES[u.type].name+' '+u.level,0,38);rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}ctx.restore();
};
Object.assign(window.Terha,{isBaekTank,baekTankProfile,isBaekArtillery});
