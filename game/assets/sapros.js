'use strict';
// Append the type: every existing army and production queue keeps its saved ID.
const SAPROS=TYPES.length,SAPROS_WINDUP=1200,SAPROS_RECOVERY=360;
TYPES.push({name:'사프로스',cost:967,hp:520,atk:97,range:2,move:2,def:0,
 branch:'armor',tank:true,special:3,icon:'▰',attackWindup:SAPROS_WINDUP,
 text:'아이리아 제국 특수 유닛. 수도 또는 4레벨 이상 본토 도시에서 생산. 생산·이동·공격에 석유를 소비하지 않습니다. 전차 특성: 격파 후 추가 공격, 이동을 쓰지 않았다면 이동 가능. 3타일 이내 아군 보병 공격력 +45%. 같은 지원 효과는 중첩되지 않습니다.'});
UNIT_STORIES[SAPROS]='낡은 천과 붕대 아래로 거대한 몸체가 움직입니다. 웃는 가면을 쓴 사프로스는 아이리아의 보병 대열 위로 머리를 드러냅니다.';
factions[3].bonus+=' · 사프로스';
const saprosArt={idle:loadBaekArt('sapros-idle.webp'),windup:loadBaekArt('sapros-windup.webp'),strike:loadBaekArt('sapros-strike.webp'),dead:loadBaekArt('sapros-dead.webp'),effects:loadBaekArt('sapros-effects.webp')};
function isSapros(u){return u?.type===SAPROS}
// Retain live object references, rebuilding only when the army roster changes.
// Movement, HP, faction and transport status are checked live on those objects.
let saprosSupportArmy=null,saprosSupportCount=-1,saprosSupportRoster=[];
function saprosSupportUnits(){
 if(saprosSupportArmy!==units||saprosSupportCount!==units.length){
  saprosSupportArmy=units;saprosSupportCount=units.length;saprosSupportRoster=units.filter(isSapros);
 }
 return saprosSupportRoster;
}
function saprosSupported(u){
 return !!u&&TYPES[u.type]?.branch==='infantry'&&Number.isInteger(u.tile)&&!!tiles[u.tile]&&u.hp>0&&!u.carriedBy&&
  saprosSupportUnits().some(s=>s.f===u.f&&s.hp>0&&!s.carriedBy&&distance(s.tile,u.tile)<=3);
}
const saprosUnitAttack=unitAttack;
unitAttack=function(u){return Math.round(saprosUnitAttack(u)*(saprosSupported(u)?1.45:1))};
const saprosUnitOil=unitOil,saprosMoveOil=moveOil,saprosAttackOil=attackOil;
unitOil=function(k,l=1){return k===SAPROS?0:saprosUnitOil(k,l)};
moveOil=function(u){return isSapros(u)?0:saprosMoveOil(u)};
attackOil=function(u){return isSapros(u)?0:saprosAttackOil(u)};
const saprosProductionPanel=productionPanel;
productionPanel=function(q){
 saprosProductionPanel(q);
 if(q.f!==3||q.f!==player||!q.capital&&q.level<4)return;
 const cat=$('unitCatalogue');if(!cat)return;
 const group=document.createElement('div');group.className='unitGroup';group.innerHTML='<h3>아이리아 제국 특수 병종</h3>';
 const row=document.createElement('div');row.className='productionRow';row.id='saprosProductionRow';
 const button=document.createElement('button'),reason=productionReason(q,SAPROS,productionTier,productionAA);
 button.className='produceButton'+(reason?' unavailable':'');button.title=reason;
 button.innerHTML=TYPES[SAPROS].name+' '+productionTier+'<small>식량 '+unitPrice(SAPROS,productionTier)+' · 석유 0'+(productionAA?' · 골드 '+aaCost(productionTier):'')+'</small>';
 button.onclick=()=>produce(q,SAPROS,productionTier,productionAA);
 const info=document.createElement('button');info.className='unitInfoButton';info.textContent='i';info.title='사프로스 정보';info.onclick=()=>showProductionInfo(q,SAPROS,productionTier);
 row.appendChild(button);row.appendChild(info);group.appendChild(row);cat.appendChild(group);
};
const saprosLaunchShot=launchShot;
launchShot=function(u,target,start=performance.now(),duration=520){
 if(!isSapros(u))return saprosLaunchShot(u,target,start,duration);
 if(!skipAIAnimations())fireMotions.set(u.id,{start,duration:SAPROS_WINDUP+SAPROS_RECOVERY});
 return pxy(u.tile);
};
function saprosPose(u,now){
 const fire=fireMotions.get(u.id),elapsed=fire?now-fire.start:-1;
 if(!fire||elapsed<0)return saprosArt.idle;
 if(elapsed<SAPROS_WINDUP)return saprosArt.windup;
 if(elapsed<SAPROS_WINDUP+SAPROS_RECOVERY)return saprosArt.strike;
 fireMotions.delete(u.id);return saprosArt.idle;
}
const saprosSprite=sprite;
sprite=function(u,p,now){
 if(!isSapros(u))return saprosSprite(u,p,now);
 let art=saprosPose(u,now);if(!art.idleReady)art=saprosArt.idle;if(!art.idleReady)return;
 p=unitVisualPosition(u,now);
 const scale=S*2/saprosArt.idle.idle.naturalHeight,w=art.idle.naturalWidth*scale,h=art.idle.naturalHeight*scale;
 ctx.save();ctx.translate(p.x,p.y-3);
 ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,14,25,9,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.scale(Number.isFinite(u.angle)&&Math.cos(u.angle)<0?-1:1,1);ctx.drawImage(art.idle,-w/2,14-h,w,h);ctx.restore();
 if(cam.z>.55){rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}
 ctx.restore();
};
function saprosImpactKind(target){
 const branch=TYPES[target?.type]?.branch;
 return branch==='infantry'&&target.type!==11?'saprosBlood':['armor','artillery'].includes(branch)?'saprosSparks':null;
}
const saprosTargetExplosions=targetExplosions;
targetExplosions=function(u,p,d,now=performance.now(),city=false,target=null){
 if(!isSapros(u))return saprosTargetExplosions(u,p,d,now,city,target);
 if(skipAIAnimations())return;
 const kind=!city&&saprosImpactKind(target);
 if(!kind)return saprosTargetExplosions(u,p,d,now,city,target);
 const depth=target?unitVisualPosition(target,now):p;
 fx.push({kind,x:p.x,y:p.y,depthX:depth.x,depthY:depth.y,targetId:target?.id,damage:d,start:now,duration:kind==='saprosBlood'?800:600});
};
const saprosKill=kill;
kill=function(u){
 if(!isSapros(u)||!units.includes(u))return saprosKill(u);
 const p=pxy(u.tile),before=fx.length,show=!u.carriedBy&&tiles[u.tile].owner>=0;
 const result=saprosKill(u);
 if(skipAIAnimations())return result;
 fx=fx.slice(0,before).concat(fx.slice(before).filter(e=>e.kind!=='wreck'));
 if(show)fx.push({kind:'saprosRemains',x:p.x,y:p.y,angle:u.angle,start:performance.now(),duration:8000});
 return result;
};
function addSaprosDepthEffects(scene,now){
 for(let i=0;i<fx.length;i++){
  const e=fx[i];if(e.kind!=='saprosBlood'&&e.kind!=='saprosSparks')continue;
  const t=(now-e.start)/e.duration;if(t<0||t>=1)continue;
  const p={x:e.depthX??e.x,y:e.depthY??e.y};
  if(Math.abs(p.x-cam.x)>screenW/2/cam.z+150||Math.abs(p.y-cam.y)>screenH/2/cam.z+150)continue;
  scene.push({kind:'saprosImpact',id:1000000+i,p,paint:()=>drawSaprosEffect(e,t)});
 }
}
function drawSaprosEffect(e,t){
 ctx.save();
 if(e.kind==='saprosRemains'){
  const art=saprosArt.dead;if(art.idleReady){ctx.globalAlpha=Math.min(1,(1-t)*4);ctx.translate(e.x,e.y);ctx.scale(Number.isFinite(e.angle)&&Math.cos(e.angle)<0?-1:1,1);const w=S*2,h=w*art.idle.naturalHeight/art.idle.naturalWidth;ctx.drawImage(art.idle,-w/2,26-h,w,h)}
 }else{
  const art=saprosArt.effects;
  if(art.idleReady){
   const blood=e.kind==='saprosBlood',frame=blood?Math.min(7,Math.floor(t*8)):8+Math.min(3,Math.floor(t*4));
   const cw=art.idle.naturalWidth/4,ch=art.idle.naturalHeight/3,size=blood?S*2.1:S*1.8;
   ctx.globalAlpha=Math.min(1,(1-t)*4);
   if(Number.isFinite(e.hitX)&&Number.isFinite(e.hitY)){
    const center=directionalImpactCenter(e,e.start+t*e.duration);
    ctx.save();ctx.translate(center.x,center.y);ctx.scale(e.hitFacing===-1?-1:1,1);
    ctx.drawImage(art.idle,(frame%4)*cw,Math.floor(frame/4)*ch,cw,ch,-size/2,-size*ch/cw/2,size,size*ch/cw);ctx.restore();
   }else ctx.drawImage(art.idle,(frame%4)*cw,Math.floor(frame/4)*ch,cw,ch,e.x-size/2,e.y-size*.65,size,size*ch/cw);
  }
  ctx.fillStyle='#fff0d4';ctx.font='bold 15px Terha,sans-serif';ctx.textAlign='center';ctx.fillText('−'+e.damage,e.x,e.y-28-t*24);
 }
 ctx.restore();
}
Object.assign(window.Terha,{SAPROS,SAPROS_WINDUP,isSapros,saprosSupported,saprosPose,saprosImpactKind,drawSaprosEffect,
 unitAttack,unitOil,moveOil,attackOil,productionPanel,launchShot,sprite,targetExplosions,kill});


