'use strict';
APP_EN[TYPES[6].text]='Support: friendly infantry within two tiles take 60% less damage. Does not affect this or any other Black Legion. Does not stack.';
// Shared raster effects; gameplay damage and save IDs are unchanged.
const battlefieldEffects=loadBaekArt('battlefield-effects.webp');
const motorizedMoveOil=moveOil,motorizedAttackOil=attackOil;
moveOil=function(u){return u?.type===11?0:motorizedMoveOil(u)};
attackOil=function(u){return u?.type===11?0:motorizedAttackOil(u)};
function fleshTarget(u){return TYPES[u?.type]?.branch==='infantry'&&u.type!==11}
function impactLayers(attacker,target,city=false){
 if(city)return ['explosion'];
 const infantry=fleshTarget(attacker),flesh=fleshTarget(target);
 return infantry?(flesh?['blood']:['sparks']):(flesh?['explosion','blood']:['explosion']);
}
function effectFrame(row,t,x,y,size){
 if(!battlefieldEffects.idleReady)return;
 const image=battlefieldEffects.idle,w=image.naturalWidth/4;
 const rows=[0,305,594,887,1237].map(y=>y*image.naturalHeight/1237),h=rows[row+1]-rows[row];
 const frame=Math.min(3,Math.max(0,Math.floor(t*4)));
 ctx.drawImage(image,frame*w,rows[row],w,h,x-size/2,y-size*.8,size,size);
}
function paintImpact(e,t){
 for(const layer of e.layers||['explosion'])effectFrame(layer==='sparks'?0:layer==='blood'?1:2,t,e.x,e.y,layer==='blood'?S*.85:layer==='sparks'?S*.9:S*1.4);
 if(e.damage!=null){ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*4);ctx.font='bold 14px Terha,sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff0d4';ctx.fillText('−'+e.damage,e.x,e.y-29-t*24);ctx.restore()}
}
function drawIllustratedEffect(e,t){
 if(e.kind==='illustratedImpact'){paintImpact(e,t);return true}
 if(['blast','baekArtilleryBlast','baekImpact','infantryExplosion','infantrySpark','infantryDust','devilImpact','defenseHit','armoredCarHit'].includes(e.kind)){
  paintImpact({...e,layers:e.layers||[e.kind==='infantrySpark'?'sparks':'explosion']},t);return true;
 }
 return false;
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
 const before=fx.length;
 const victim=units.find(v=>!v.carriedBy&&v.id!==u.id&&Math.hypot(pxy(v.tile).x-target.x,pxy(v.tile).y-target.y)<2);
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
 if(q.hp>cityMaxHp(q)*.5)return;
 for(let j=0;j<3;j++)effectFrame(3,((now+q.id*137+j*210)%720)/720,p.x-22+j*22,p.y-5,58+j%2*12);
};
// Capture only the painted unit body with its actual faction art and facing.
// Forward canvas operations without pixel readback or a per-frame snapshot.
function captureWreckBody(u){
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
 return image;
}
const illustratedKill=kill;
kill=function(u){
 if(!units.includes(u))return;
 const mechanical=!fleshTarget(u)&&!isSapros(u)&&!u.carriedBy;
 const unitArt=mechanical?captureWreckBody(u):null,before=fx.length,p=pxy(u.tile),result=illustratedKill(u);
 if(unitArt){
  fx=fx.slice(0,before).concat(fx.slice(before).filter(e=>!['wreck','navalSink','infantryRemains'].includes(e.kind)));
  fx.push({kind:'wreck',x:p.x,y:p.y,type:u.type,f:u.f,unitArt,start:performance.now(),duration:3000});
 }
 return result;
};
function drawIllustratedWreck(e,t,now){
 ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=Math.min(1,(1-t)*8);
 for(let j=0;j<3;j++){
  ctx.save();ctx.translate((j-1)*5,j===1?7:2);ctx.rotate((j-1)*.13);ctx.scale(1,.65);
  ctx.drawImage(e.unitArt,j*256/3,0,256/3,192,-128+j*256/3,-130,256/3,192);ctx.restore();
 }
 for(let j=0;j<2;j++)effectFrame(3,((now+j*280)%720)/720,-16+j*30,-5,65);
 ctx.restore();
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
Object.assign(window.Terha,{moveOil,attackOil,impactLayers,drawIllustratedEffect,drawIllustratedWreck,drawCityFire,targetExplosions,launchShot,kill,setup});
