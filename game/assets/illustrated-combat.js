'use strict';
APP_EN[TYPES[6].text]='Support: friendly infantry within two tiles take 60% less damage. Does not affect this or any other Black Legion. Does not stack.';
// Shared raster effects; gameplay damage and save IDs are unchanged.
const battlefieldEffects=loadBaekArt('battlefield-effects.webp');
const motorizedMoveOil=moveOil,motorizedAttackOil=attackOil;
moveOil=function(u){return u?.type===11?0:motorizedMoveOil(u)};
attackOil=function(u){return u?.type===11?0:motorizedAttackOil(u)};
function fleshTarget(u){return TYPES[u?.type]?.branch==='infantry'&&u.type!==11}
const EFFECT_ROWS=[0,305,594,887,1237];
const cityFlameArt=loadBaekArt('city-flame-soft.webp'),wreckSmokeArt=loadBaekArt('wreck-smoke.webp');
const ILLUSTRATED_HITS=new Set(['illustratedImpact','blast','baekArtilleryBlast','baekImpact','infantryExplosion','infantrySpark','infantryDust','devilImpact','defenseHit','armoredCarHit']);
const DEFAULT_EXPLOSION=['explosion'],DEFAULT_SPARKS=['sparks'];
function impactLayers(attacker,target,city=false){
 const branch=TYPES[attacker?.type]?.branch,flesh=fleshTarget(target);
 if(branch==='armor')return !city&&flesh?['infantrySmokeHit','blood']:['armorSmoke'];
 if(city)return ['explosion'];
 return fleshTarget(attacker)?(flesh?['blood']:['sparks']):(flesh?['explosion','blood']:['explosion']);
}
function softEffectTexture(art){return art.idleReady?art.idle:null}
function effectFrame(row,t,x,y,size){
 if(row===3){const fire=softEffectTexture(cityFlameArt);if(fire)ctx.drawImage(fire,x-size/2,y-size*.8,size,size);return}
 if(!battlefieldEffects.idleReady)return;
 const source=battlefieldEffects.idle,w=source.naturalWidth/4,frame=Math.min(3,Math.max(0,Math.floor(t*4)));
 const y0=EFFECT_ROWS[row]*source.naturalHeight/1237,h=(EFFECT_ROWS[row+1]-EFFECT_ROWS[row])*source.naturalHeight/1237;
 ctx.drawImage(source,frame*w,y0,w,h,x-size/2,y-size*.8,size,size);
}
function drawImpactSmoke(x,y,size,t,density=1){
 const smoke=softEffectTexture(wreckSmokeArt);if(!smoke)return;
 ctx.save();ctx.globalAlpha*=density*Math.min(1,.3+t*5)*Math.min(1,(1-t)*4);
 const width=size*(.75+t*.3),height=size*(.85+t*.45);
 nativeMapDrawImage(smoke,x-width/2+Math.sin(t*2.1)*3,y-height*.84-t*8,width,height);ctx.restore();
}
function paintImpact(e,t){
 const layers=e.layers||(e.kind==='infantrySpark'?DEFAULT_SPARKS:DEFAULT_EXPLOSION);
 for(const layer of layers){
  if(layer==='armorSmoke'){drawImpactSmoke(e.x,e.y,S*1.25,t,.95);continue}
  if(layer==='infantrySmokeHit'){drawImpactSmoke(e.x,e.y,S*.75,t,.55);continue}
  effectFrame(layer==='sparks'?0:layer==='blood'?1:2,t,e.x,e.y,layer==='blood'?S*.85:layer==='sparks'?S*.9:S*1.4);
 }
 if(e.damage!=null){ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*4);ctx.font='bold 14px Terha,sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff0d4';ctx.fillText('−'+e.damage,e.x,e.y-29-t*24);ctx.restore()}
}
function drawIllustratedEffect(e,t){
 if(!ILLUSTRATED_HITS.has(e.kind))return false;
 if(Math.abs(e.x-cam.x)>screenW/2/cam.z+160||Math.abs(e.y-cam.y)>screenH/2/cam.z+180)return true;
 paintImpact(e,t);return true;
}
const illustratedTargetExplosions=targetExplosions;
targetExplosions=function(u,p,d,now=performance.now(),city=false,target=null){
 const before=fx.length,result=illustratedTargetExplosions(u,p,d,now,city,target);
 // Preserve special melee timing/art, numeric labels and sounds.
 if(isSapros(u)||isWhiteNight(u)||skipAIAnimations())return result;
 const layers=impactLayers(u,target,city),hitKinds=['blast','baekArtilleryBlast','baekImpact','infantryExplosion','infantrySpark','infantryDust','devilImpact','armoredCarHit'];
 for(const e of fx.slice(before))if(hitKinds.includes(e.kind)){e.layers=layers;e.combatImpact=combatImpactProfile(u)}
 return result;
};
const illustratedLaunch=launchShot;
launchShot=function(u,target,start=performance.now(),duration=520){
 if(skipAIAnimations())return illustratedLaunch(u,target,start,duration);
 const before=fx.length;
 // Only the armored-car burst needs target classification before impact.
 const victim=u.type===12?units.find(v=>!v.carriedBy&&v.id!==u.id&&Math.hypot(pxy(v.tile).x-target.x,pxy(v.tile).y-target.y)<2):null;
 const result=illustratedLaunch(u,target,start,duration);
 if(u.type===12)for(const e of fx.slice(before))if(e.kind==='armoredCarHit')e.layers=impactLayers(u,victim,!victim);
 if(u.type===18){
  fx=fx.slice(0,before).concat(fx.slice(before).filter(e=>!['shot','baekArtilleryShell','baekRocket','baekGrenade','laser','doctrine'].includes(e.kind)));
  if(!skipAIAnimations()){
   const p=pxy(u.tile),m=scaleUnitMuzzle(u,p,{x:p.x+(target.x>=p.x?41:-41),y:p.y-19});
   fx.push({kind:'laser',x:m.x,y:m.y,tx:target.x,ty:target.y,start,duration:240});
   fireMotions.set(u.id,{start,duration:400});
  }
 }
 return result;
};
drawCityFire=function(q,p,now){
 if(q.hp>cityMaxHp(q)*.5||cam.z<.24)return;
 const flame=softEffectTexture(cityFlameArt);if(!flame)return;
 const phase=now*.007+q.id*1.73,width=q.capital?100:80,height=width*(1+.045*Math.sin(phase*1.31));
 // Axis-aligned stretch/offset avoids the expensive affine resampling path.
 nativeMapDrawImage(flame,p.x-width/2+Math.sin(phase)*1.1,p.y+12-height,width,height);
};
const wreckBodyCache=new Map(),WRECK_CACHE_LIMIT=48;
// Capture only the painted unit body with its actual faction art and facing.
// Forward canvas operations without pixel readback or a per-frame snapshot.
function captureWreckBody(u){
 const key=[u.f,u.type,u.missionRole||'',u.tankFacing||0,u.destroyerFacing||0,u.carrierFacing||0,Math.round((u.angle||0)*4)].join(':');
 const cached=wreckBodyCache.get(key);if(cached){wreckBodyCache.delete(key);wreckBodyCache.set(key,cached);return cached}
 const image=document.createElement('canvas');image.width=256;image.height=192;
 const out=image.getContext('2d'),oldZ=cam.z,methods=['save','restore','translate','rotate','scale','transform','setTransform','drawImage','beginPath','rect','clip'];
 const previous=new Map(),ghost={...u,id:-1000000-u.id};
 out.translate(128,130);ctx.save();
 try{
  for(const name of methods){previous.set(name,ctx[name]);ctx[name]=out[name].bind(out)}
  // The legacy geometry is forwarded as well for types without raster art.
  for(const name of ['moveTo','lineTo','arc','ellipse','closePath','fill','stroke','fillRect','strokeRect']){previous.set(name,ctx[name]);ctx[name]=out[name].bind(out)}
  cam.z=.4;const p=pxy(u.tile);out.translate(-p.x,-p.y);sprite(ghost,p,performance.now());
 }finally{for(const [name,fn]of previous)ctx[name]=fn;cam.z=oldZ;ctx.restore()}
 // Scorch the exact silhouette; break the body into displaced, fallen sections.
 out.setTransform(1,0,0,1,0,0);out.globalCompositeOperation='source-atop';out.fillStyle='rgba(22,16,13,.68)';out.fillRect(0,0,256,192);
 const broken=document.createElement('canvas');broken.width=256;broken.height=192;const paint=broken.getContext('2d');paint.translate(128,130);
 for(let j=0;j<3;j++){paint.save();paint.translate((j-1)*5,j===1?7:2);paint.rotate((j-1)*.13);paint.scale(1,.65);paint.drawImage(image,j*256/3,0,256/3,192,-128+j*256/3,-130,256/3,192);paint.restore()}
 wreckBodyCache.set(key,broken);if(wreckBodyCache.size>WRECK_CACHE_LIMIT)wreckBodyCache.delete(wreckBodyCache.keys().next().value);
 return broken;
}
const illustratedKill=kill;
kill=function(u){
 if(!units.includes(u))return;
 const mechanical=!fleshTarget(u)&&!isSapros(u)&&!u.carriedBy;
 const unitArt=mechanical&&!skipAIAnimations()?captureWreckBody(u):null,before=fx.length,p=unitVisualPosition(u,performance.now()),result=illustratedKill(u);
 if(unitArt){
  fx=fx.slice(0,before).concat(fx.slice(before).filter(e=>!['wreck','navalSink','infantryRemains'].includes(e.kind)));
  fx.push({kind:'wreck',x:p.x,y:p.y,type:u.type,f:u.f,unitArt,start:performance.now(),duration:3000});
 }
 return result;
};
function drawIllustratedWreck(e,t,now){
 ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*8);
 nativeMapDrawImage(e.unitArt,e.x-128,e.y-130,256,192);
 drawImpactSmoke(e.x,e.y-6,68,t,.9);ctx.restore();
}
function addWreckDepthEffects(scene,now){
 for(let i=0;i<fx.length;i++){
  const e=fx[i];if(e.kind!=='wreck'||!e.unitArt)continue;
  const t=(now-e.start)/e.duration;if(t<0||t>=1)continue;
  if(Math.abs(e.x-cam.x)>screenW/2/cam.z+160||Math.abs(e.y-cam.y)>screenH/2/cam.z+180)continue;
  scene.push({kind:'wreck',id:i,p:{x:e.x,y:e.y},paint:()=>drawIllustratedWreck(e,t,now)});
 }
}
const illustratedSetup=setup;
setup=function(...args){
 const result=illustratedSetup(...args);
 if(!activeScenario){
  const capital=cities.find(q=>q.f===6&&q.capital);
  if(capital){
   const places=tiles.map((t,i)=>i).filter(i=>tiles[i].owner===6&&!unitAt(i)&&!baseAt(i)&&moveCost({type:WHITE_NIGHT,f:6},i)<99999).sort((a,b)=>distance(a,capital.tile)-distance(b,capital.tile)||a-b);
   for(const tile of places.slice(0,2)){const u=makeUnit(6,WHITE_NIGHT,tile,1);u.initialSielunSpecial=true}
  }
  faceInitialArmy();save();updateHUD();
 }
 return result;
};
Object.assign(window.Terha,{moveOil,attackOil,impactLayers,drawIllustratedEffect,drawIllustratedWreck,addWreckDepthEffects,drawCityFire,targetExplosions,launchShot,kill,setup});
