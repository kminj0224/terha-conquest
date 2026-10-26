'use strict';
// Four supplied rotor poses are decoded once. Drawing one cached frame replaces
// the old procedural helicopter, without per-frame decoding or extra rotors.
const BAEK_HELI_FRAME_MS=200,BAEK_HELI_WIDTH=96,BAEK_HELI_ROCKETS=8;
const baekAttackHeliArt=[1,2,3,4].map(n=>loadBaekArt('baek-attack-heli-'+n+'.webp'));
function isBaekAttackHelicopter(u){return u?.f===0&&u.type===21}
function baekAttackHeliFrame(u,now){return (Math.cos(weaponAngle(u,now))<0?2:0)+(Math.floor(Math.max(0,now)/BAEK_HELI_FRAME_MS)%2)}
const baekAttackHeliSprite=sprite;
sprite=function(u,p,now){
 if(!isBaekAttackHelicopter(u))return baekAttackHeliSprite(u,p,now);
 const art=baekAttackHeliArt[baekAttackHeliFrame(u,now)];if(!art.idleReady)return baekAttackHeliSprite(u,p,now);
 p=unitVisualPosition(u,now);const image=art.idle,height=BAEK_HELI_WIDTH*image.naturalHeight/image.naturalWidth;
 ctx.save();ctx.translate(p.x,p.y-3);ctx.globalAlpha=1;
 ctx.fillStyle='#001b2140';ctx.beginPath();ctx.ellipse(0,13,31,7,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(image,-BAEK_HELI_WIDTH/2,3-height,BAEK_HELI_WIDTH,height);
 if(cam.z>.55){rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}
 ctx.restore();
};
const baekAttackHeliLaunch=launchShot;
launchShot=function(u,target,start=performance.now(),duration=520){
 if(!isBaekAttackHelicopter(u))return baekAttackHeliLaunch(u,target,start,duration);
 const p=pxy(u.tile),facing=Math.cos(weaponAngle(u,start))<0?-1:1,muzzle={x:p.x+facing*23,y:p.y-6};
 if(skipAIAnimations())return muzzle;
 const end=nearWorldPoint(target,p);fireMotions.set(u.id,{start,duration:1000});
 for(let n=0;n<BAEK_HELI_ROCKETS;n++){
  const tx=end.x+Math.sin(n*2.3)*7,ty=end.y+Math.cos(n*1.7)*5,launch=start+n*80,flight=430;
  fx.push({kind:'baekRocket',x:muzzle.x,y:muzzle.y+(n%2?2:-2),tx,ty,type:21,start:launch,duration:flight,baekHelicopterRocket:true});
  fx.push({kind:'baekImpact',x:tx,y:ty,type:9,small:true,start:launch+flight,duration:380,baekHelicopterRocket:true});
 }
 return muzzle;
};
Object.assign(window.Terha,{baekAttackHeliArt,baekAttackHeliFrame,isBaekAttackHelicopter,sprite,launchShot});
