'use strict';
APP_EN[TYPES[6].text]='Support: friendly infantry within two tiles take 60% less damage. Does not affect this or any other Black Legion. Does not stack.';
// Shared raster effects; gameplay damage and save IDs are unchanged.
const battlefieldEffects=loadBaekArt('battlefield-effects.webp');
const motorizedMoveOil=moveOil,motorizedAttackOil=attackOil;
moveOil=function(u){return u?.type===11?0:motorizedMoveOil(u)};
attackOil=function(u){return u?.type===11?0:motorizedAttackOil(u)};
function fleshTarget(u){return TYPES[u?.type]?.branch==='infantry'&&u.type!==11}
const EFFECT_ROWS=[0,305,594,887,1237];
const cityFlameArt=loadBaekArt('city-flame-soft.webp'),wreckSmokeArt=loadBaekArt('wreck-smoke.webp'),explosionFramesArt=loadBaekArt('explosion-sequence.webp'),smokeFramesArt=loadBaekArt('smoke-flow.webp');
const IMPACT_SMOKE_MS=3000,MAX_VISIBLE_IMPACT_SMOKE=12;
const ILLUSTRATED_HITS=new Set(['illustratedImpact','blast','baekArtilleryBlast','baekImpact','infantryExplosion','infantrySpark','infantryDust','devilImpact','defenseHit','armoredCarHit']);
const DEFAULT_EXPLOSION=['dustBurst'],DEFAULT_SPARKS=['sparks'],ARTILLERY_EXPLOSION=['explosion'];
function impactLayers(attacker,target,city=false){
 const branch=TYPES[attacker?.type]?.branch,flesh=!city&&fleshTarget(target);
 if(branch==='air'||branch==='helicopter'||attacker?.strategic)return flesh?['explosion','blood']:['explosion'];
 if(branch==='navy')return flesh?['explosion','blood']:['explosion'];
 if(branch==='artillery'&&!attacker.strategic)return flesh?['explosion','blood']:['explosion'];
 if(branch==='armor')return flesh?['infantrySmokeHit','blood']:['armorSmoke'];
 if(attacker?.type===8)return flesh?['grenadeDust','blood']:['grenadeDust'];
 if(attacker?.type===9)return flesh?['dustBurst','blood']:['armorSmoke'];
 if(city)return branch==='infantry'?['sparks']:['dustBurst'];
 return branch==='infantry'?(flesh?['blood']:['sparks']):(flesh?['dustBurst','blood']:['dustBurst']);
}
function softEffectTexture(art){return art.idleReady?art.idle:null}
const DIRT_FRAME_FEET=[.880208,.880208,.916667,.880208,.880208],FIRE_FRAME_FEET=[.875,.885417,.869792,.875,.875,.885417,.875];
function effectFrame(row,t,x,y,size,bottom=null){
 if(row===3){const fire=softEffectTexture(cityFlameArt);if(fire)nativeMapDrawImage(fire,x-size/2,y+12-size,size,size);return}
 if(row===2){if(explosionFramesArt.idleReady){const image=explosionFramesArt.idle,w=image.naturalWidth/7,frame=Math.min(6,Math.max(0,Math.floor(t*7)));nativeMapDrawImage(image,frame*w,0,w,image.naturalHeight,x-size/2,bottom==null?y+12-size:bottom-size*FIRE_FRAME_FEET[frame],size,size)}return}
 if(!battlefieldEffects.idleReady)return;
 const source=battlefieldEffects.idle,w=source.naturalWidth/4,frame=Math.min(3,Math.max(0,Math.floor(t*4)));
 const y0=EFFECT_ROWS[row]*source.naturalHeight/1237,h=(EFFECT_ROWS[row+1]-EFFECT_ROWS[row])*source.naturalHeight/1237;
 nativeMapDrawImage(source,frame*w,y0,w,h,x-size/2,y+12-size,size,size);
}
const smokePlumeFrames=[],smokeFrontFrames=[],SMOKE_PLUME_FRAME_COUNT=40;
function prepareSmokePlumeFrames(){
 if(smokePlumeFrames.length||!smokeFramesArt.idleReady)return smokePlumeFrames;
 for(let variant=0;variant<2;variant++)for(let i=0;i<SMOKE_PLUME_FRAME_COUNT;i++){
  const frame=variant*SMOKE_PLUME_FRAME_COUNT+i;
  (variant?smokeFrontFrames:smokePlumeFrames).push({image:smokeFramesArt.idle,sx:frame%8*80,sy:Math.floor(frame/8)*192,crop:SMOKE_FLOW_BOUNDS[frame]});
 }
 return smokePlumeFrames;
}
const plumeLoaded=smokeFramesArt.idle.onload;
smokeFramesArt.idle.onload=function(...args){plumeLoaded?.apply(this,args);prepareSmokePlumeFrames()};
prepareSmokePlumeFrames();
function drawImpactSmoke(x,y,size,t,density=1,bottom=y+12,variant=0){
 prepareSmokePlumeFrames();const frames=variant?smokeFrontFrames:smokePlumeFrames;if(!frames.length||t<0||t>=1)return;
 const frame=frames[Math.min(frames.length-1,Math.floor(t*frames.length))],width=size*.85,height=size*2.2;
 ctx.save();ctx.globalAlpha*=density;
 const [cx,cy,cw,ch]=frame.crop;if(cw&&ch)nativeMapDrawImage(frame.image,frame.sx+cx,frame.sy+cy,cw,ch,x-width/2+cx/80*width,bottom-height*.98+cy/192*height,cw/80*width,ch/192*height);ctx.restore();
}
function configureImpactTimeline(e,attacker){
 if(e.burstDuration!=null)return e;
 const layers=e.layers||DEFAULT_EXPLOSION;
 if(!layers.some(v=>['explosion','dustBurst','grenadeDust','armorSmoke','infantrySmokeHit'].includes(v)))return e;
 e.burstDuration=Math.round(e.duration*(TYPES[attacker?.type]?.branch==='artillery'&&!attacker?.strategic?1:1.5));
 e.duration=Math.max(e.burstDuration,IMPACT_SMOKE_MS);
 return e;
}
function impactSmokePhase(e,t){return e.burstDuration!=null?t*e.duration/IMPACT_SMOKE_MS:-1}
const recentlyDestroyedGround=new Map();
function unitExplosionGroundY(u,now=performance.now()){
 if(Number.isFinite(u.impactGroundY))return u.impactGroundY;
 const fire=fireMotions.get(u.id),firing=fire&&now>=fire.start&&now<fire.start+fire.duration;
 const side=u.tankFacing??u.artilleryFacing??u.rifleFacing??u.destroyerFacing??u.carrierFacing??u.danteFleetFacing;
 const branch=TYPES[u.type]?.branch,angle=['navy','air','helicopter'].includes(branch)?(u.angle||0):Number.isFinite(side)?side<0?Math.PI:0:u.angle||0;
 const direction=((Math.round(angle/(Math.PI/8))%16)+16)%16,offset=IMPACT_GROUND_DATA[u.f+':'+u.type]?.[Math.max(0,Math.min(3,(u.level||1)-1))]?.[(firing?16:0)+direction]??11;
 return unitVisualPosition(u,now).y+offset;
}
function impactVictim(p,target,now=performance.now()){
 if(target)return target;
 const tile=worldTileAt(p.x,p.y),live=units.find(u=>!u.carriedBy&&u.tile===tile);if(live)return live;
 const dead=recentlyDestroyedGround.get(tile);return dead&&now-dead.at<1200?dead.unit:null;
}
function setImpactGround(e,target,city=false){
 if(target&&!city){e.explosionGroundY=unitExplosionGroundY(target,e.start);e.splitUnitSmoke=true}
 return e;
}
// Body centers are measured offline from the actual national sprites, with no pixel reads in play.
function unitHitCenter(u,now=performance.now()){
 const p=unitVisualPosition(u,now),fire=fireMotions.get(u.id),firing=fire&&now>=fire.start&&now<fire.start+fire.duration;
 const side=u.tankFacing??u.artilleryFacing??u.rifleFacing??u.destroyerFacing??u.carrierFacing??u.danteFleetFacing;
 const branch=TYPES[u.type]?.branch,angle=['navy','air','helicopter'].includes(branch)?(u.angle||0):Number.isFinite(side)?side<0?Math.PI:0:u.angle||0;
 const direction=((Math.round(angle/(Math.PI/8))%16)+16)%16;
 const offset=HIT_CENTER_DATA[u.f+':'+u.type]?.[Math.max(0,Math.min(3,(u.level||1)-1))]?.[(firing?16:0)+direction]??[0,-12];
 return{x:p.x+offset[0],y:p.y+offset[1]};
}
function setDirectionalImpact(e,attacker,target,now=e.start){
 if(!target)return e;
 const center=unitHitCenter(target,now),victim=unitVisualPosition(target,now);
 const origin=Number.isInteger(attacker?.tile)&&tiles[attacker.tile]?nearWorldPoint(unitVisualPosition(attacker,now),victim):null;
 e.targetId??=target.id;e.hitX=center.x;e.hitY=center.y;e.hitFacing=origin&&origin.x>victim.x?-1:1;
 return e;
}
function directionalImpactCenter(e,now=performance.now()){
 const target=units.find(u=>u.id===e.targetId&&!u.carriedBy&&u.hp>0);
 return target?unitHitCenter(target,now):{x:e.hitX,y:e.hitY};
}
function drawDirectionalHitFrame(e,row,t,size,now=performance.now()){
 if(!Number.isFinite(e.hitX)||!Number.isFinite(e.hitY))return effectFrame(row,t,e.x,e.y,size);
 const p=directionalImpactCenter(e,now);
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(e.hitFacing===-1?-1:1,1);
 effectFrame(row,t,0,size/2-12,size);ctx.restore();
}
function paintImpact(e,t){
 const layers=e.layers||(e.kind==='baekArtilleryBlast'?ARTILLERY_EXPLOSION:e.kind==='infantrySpark'?DEFAULT_SPARKS:DEFAULT_EXPLOSION);
 const smokeT=impactSmokePhase(e,t),burstT=e.burstDuration!=null?t*e.duration/e.burstDuration:t,ground=e.explosionGroundY??null;
 if(smokeT>=0&&smokeT<1&&!e.hideImpactSmoke){const size=e.small?S*.7:layers.includes('grenadeDust')?S*.85:S*1.38;drawImpactSmoke(e.x+(e.splitUnitSmoke?6:0),e.y,size*(e.splitUnitSmoke?.75:1),smokeT,e.splitUnitSmoke?.75:.95,(ground??e.y+12)+(e.splitUnitSmoke?2:0),e.splitUnitSmoke?1:0)}
 if(burstT>=1)return;
 for(const layer of layers){
  if(layer==='armorSmoke'){drawArmorImpact(e,burstT,false,ground,e.start+t*e.duration);continue}
  if(layer==='infantrySmokeHit'){drawArmorImpact(e,burstT,true,ground,e.start+t*e.duration);continue}
  if(layer==='dustBurst'||layer==='grenadeDust'){drawDirtImpact(e.x,e.y,burstT,layer==='grenadeDust'?S*.68:e.small?S*.8:S*1.4,ground);continue}
  if(layer==='blood'||layer==='sparks')drawDirectionalHitFrame(e,layer==='sparks'?0:1,burstT,layer==='blood'?S*.85:S*.9,e.start+t*e.duration);
  else effectFrame(2,burstT,e.x,e.y,S*1.4,ground);
 }
 if(e.damage!=null){ctx.save();ctx.globalAlpha=Math.min(1,(1-burstT)*4);ctx.font='bold 14px Terha,sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff0d4';ctx.fillText('−'+e.damage,e.x,e.y-29-burstT*24);ctx.restore()}
}
function drawIllustratedEffect(e,t){
 if(!ILLUSTRATED_HITS.has(e.kind))return false;
 if(Math.abs(e.x-cam.x)>screenW/2/cam.z+160||Math.abs(e.y-cam.y)>screenH/2/cam.z+260)return true;
 paintImpact(e,t);return true;
}
function impactCityAt(p){const tile=worldTileAt(p.x,p.y);return tile>=0?cityAt(tile):null}
function addAreaImpact(u,target,d,now=performance.now()){
 if(skipAIAnimations()||d<=0)return;
 const q=cityAt(target.tile),p=pxy(target.tile);
 fx.push(setDirectionalImpact(setImpactGround(configureImpactTimeline({kind:'blast',x:p.x,y:p.y,damage:d,layers:impactLayers(u,target,!!q),targetId:target.id,targetTile:target.tile,cityImpact:!!q,cityId:q?.id,combatImpact:combatImpactProfile(u),splash:true,start:now,duration:650},u),target,!!q),u,q?null:target,now));
}
const illustratedTargetExplosions=targetExplosions;
targetExplosions=function(u,p,d,now=performance.now(),city=false,target=null){
 const q=impactCityAt(p),cityImpact=!!q;target=impactVictim(p,target,now);
 const before=fx.length,result=illustratedTargetExplosions(u,p,d,now,city||cityImpact,target);
 if(skipAIAnimations())return result;
 if(cityImpact){
  const added=fx.slice(before),first=added.find(e=>ILLUSTRATED_HITS.has(e.kind));
  fx=fx.slice(0,before).concat(added.filter(e=>!ILLUSTRATED_HITS.has(e.kind)&&!['armoredCarDamage','saprosBlood','saprosSparks','navalSmoke'].includes(e.kind)));
  fx.push(configureImpactTimeline({kind:'blast',x:p.x,y:p.y,damage:d,layers:impactLayers(u,null,true),cityImpact:true,cityId:q.id,targetTile:q.tile,combatImpact:combatImpactProfile(u),start:first?.start??now,duration:750},u));
  return result;
 }
 fx=fx.slice(0,before).concat(fx.slice(before).filter(e=>e.kind!=='navalSmoke'));
 if(isSapros(u)||isWhiteNight(u)){for(const e of fx.slice(before))if(e.kind==='saprosBlood'||e.kind==='saprosSparks'||ILLUSTRATED_HITS.has(e.kind))setDirectionalImpact(e,u,target,e.start);return result;}
 const layers=impactLayers(u,target,false);
 for(const e of fx.slice(before))if(ILLUSTRATED_HITS.has(e.kind)){e.layers=layers;e.combatImpact=combatImpactProfile(u);e.targetId=target?.id;e.targetTile=target?.tile;setImpactGround(e,target);setDirectionalImpact(e,u,target,e.start);configureImpactTimeline(e,u)}
 return result;
};
const illustratedLaunch=launchShot;
launchShot=function(u,target,start=performance.now(),duration=520){
 if(skipAIAnimations())return illustratedLaunch(u,target,start,duration);
 const before=fx.length;
 // Classify pre-scheduled burst/rocket impacts before their first frame.
 const victim=units.find(v=>!v.carriedBy&&v.id!==u.id&&Math.hypot(pxy(v.tile).x-target.x,pxy(v.tile).y-target.y)<2);
 const result=illustratedLaunch(u,target,start,duration);
 if(impactCityAt(target))fx=fx.slice(0,before).concat(fx.slice(before).filter(e=>!ILLUSTRATED_HITS.has(e.kind)));
 for(const e of fx.slice(before))if(ILLUSTRATED_HITS.has(e.kind)){e.layers=impactLayers(u,victim,!!impactCityAt(target));e.targetId=victim?.id;e.targetTile=victim?.tile;setImpactGround(e,victim);setDirectionalImpact(e,u,victim,e.start);configureImpactTimeline(e,u)}
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
 const frames=prepareCityFlameFrames();if(!frames.length)return;
 const width=q.capital?100:80,height=width*128/112;
 nativeMapDrawImage(frames[(Math.floor(now/60)+q.id*5)%frames.length],p.x-width/2,p.y+12-height,width,height);
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
 recentlyDestroyedGround.set(u.tile,{unit:{...u,impactGroundY:unitExplosionGroundY(u)},at:performance.now()});if(recentlyDestroyedGround.size>64)recentlyDestroyedGround.delete(recentlyDestroyedGround.keys().next().value);
 const mechanical=!fleshTarget(u)&&!isSapros(u)&&!u.carriedBy;
 const unitArt=mechanical&&!skipAIAnimations()?captureWreckBody(u):null,before=fx.length,p=unitVisualPosition(u,performance.now()),result=illustratedKill(u);
 if(unitArt){
  fx=fx.slice(0,before).concat(fx.slice(before).filter(e=>!['wreck','navalSink','infantryRemains'].includes(e.kind)));
  fx.push({kind:'wreck',x:p.x,y:p.y,type:u.type,f:u.f,targetTile:u.tile,unitArt,start:performance.now(),duration:3000});
 }
 return result;
};
function drawIllustratedWreck(e,t,now,smoke=true){
 ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*8);
 nativeMapDrawImage(e.unitArt,e.x-128,e.y-130,256,192);
 if(smoke)drawImpactSmoke(e.x+6,e.y,51,t,.75,e.y+3,1);ctx.restore();
}
function addWreckDepthEffects(scene,now){
 let smokeCount=0;const covered=new Set();for(const hit of fx){const t=(now-hit.start)/hit.duration;if(hit.burstDuration!=null&&t>=0&&impactSmokePhase(hit,t)<1)covered.add(hit.targetTile??worldTileAt(hit.x,hit.y))}
 for(let i=0;i<fx.length;i++){
  const e=fx[i];if(e.kind!=='wreck'||!e.unitArt)continue;
  const t=(now-e.start)/e.duration;if(t<0||t>=1)continue;
  if(Math.abs(e.x-cam.x)>screenW/2/cam.z+160||Math.abs(e.y-cam.y)>screenH/2/cam.z+260)continue;
  const p={x:e.x,y:e.y},smoke=!covered.has(e.targetTile??worldTileAt(e.x,e.y))&&smokeCount<MAX_VISIBLE_IMPACT_SMOKE;if(smoke)smokeCount++;
  if(smoke)scene.push({kind:'smokeBehind',id:i,p,paint:()=>drawImpactSmoke(e.x-8,e.y,68,t,.75,e.y-16,0)});
  scene.push({kind:'wreck',id:i,p,paint:()=>drawIllustratedWreck(e,t,now,smoke)});
 }
 scene.smokeGroups=smokeCount;
}
function isDepthImpact(e){return ILLUSTRATED_HITS.has(e.kind)||e.kind==='navalSmoke'||e.kind==='nuclear'}
function addImpactDepthEffects(scene,now){
 // Latest smoke on a tile replaces older smoke there. Bursts/damage stay intact.
 const smokeTiles=new Set();let smokeCount=scene.smokeGroups||0;
 for(let i=fx.length-1;i>=0;i--){
  const e=fx[i];if(!isDepthImpact(e))continue;
  if(ILLUSTRATED_HITS.has(e.kind)&&!e.layers){e.layers=e.kind==='baekArtilleryBlast'?ARTILLERY_EXPLOSION:e.kind==='infantrySpark'?DEFAULT_SPARKS:DEFAULT_EXPLOSION;configureImpactTimeline(e,{type:e.kind==='baekArtilleryBlast'?2:e.type??1})}
  const t=(now-e.start)/e.duration;if(t<0||t>=1)continue;
  const margin=e.kind==='nuclear'?460:260;
  if(Math.abs(e.x-cam.x)>screenW/2/cam.z+margin||Math.abs(e.y-cam.y)>screenH/2/cam.z+margin)continue;
  const tile=e.targetTile??worldTileAt(e.x,e.y),p=tile>=0?pxy(tile):{x:e.x,y:e.y};
  if(ILLUSTRATED_HITS.has(e.kind)&&e.explosionGroundY==null&&!e.cityImpact&&!cityAt(tile))setImpactGround(e,impactVictim(e,null,now));
  const smokeT=impactSmokePhase(e,t);e.hideImpactSmoke=false;
  if(smokeT>=0&&smokeT<1){const key=tile>=0?tile:Math.round(e.x/32)+':'+Math.round(e.y/32);if(smokeTiles.has(key)||smokeCount>=MAX_VISIBLE_IMPACT_SMOKE)e.hideImpactSmoke=true;else{smokeTiles.add(key);smokeCount++}if(e.hideImpactSmoke&&t*e.duration>=e.burstDuration)continue}
  if(e.splitUnitSmoke&&smokeT>=0&&smokeT<1&&!e.hideImpactSmoke){const layers=e.layers||DEFAULT_EXPLOSION,size=e.small?S*.7:layers.includes('grenadeDust')?S*.85:S*1.38;scene.push({kind:'smokeBehind',id:i,p,paint:()=>drawImpactSmoke(e.x-8,e.y,size*.95,smokeT,.75,(e.explosionGroundY??e.y+12)-18,0)})}
  scene.push({kind:'impact',id:i,p,paint:()=>drawIllustratedEffect(e,t)});
 }
}
const illustratedSetup=setup;
setup=function(...args){
 recentlyDestroyedGround.clear();const result=illustratedSetup(...args);
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
Object.assign(window.Terha,{moveOil,attackOil,impactLayers,drawIllustratedEffect,drawIllustratedWreck,addWreckDepthEffects,drawCityFire,isDepthImpact,addImpactDepthEffects,addAreaImpact,targetExplosions,launchShot,kill,setup});
