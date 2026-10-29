'use strict';
// Append-only save ID. The Sielun special uses the same windup/recovery as Sapros.
const WHITE_NIGHT=TYPES.length,WHITE_NIGHT_HEIGHT=S*1.5;
TYPES.push({name:'백야의 밤',cost:1450,hp:340,atk:100,range:1,move:3,def:22,
 branch:'infantry',special:6,icon:'×',attackWindup:SAPROS_WINDUP,
 text:'시엘룬 특수 보병. 수도 또는 4레벨 이상 본토 도시에서 생산. 검을 휘둘러 직격 대상을 포함한 전방 사다리꼴 최대 8칸의 적을 동시에 타격합니다. 직격은 공격력만큼, 나머지는 그 60%의 고정 피해를 받습니다. 비어 있는 칸과 아군·동맹군·중립군·승선 부대는 타격하지 않습니다.'});
UNIT_STORIES[WHITE_NIGHT]='검은 갑주를 갖춘 거대한 백곰 전사. 두 손으로 쥔 검이 어깨 위로 올라가고, 묵직한 칼날이 대열을 가릅니다.';
factions[6].bonus+=' · 백야의 밤';
function isWhiteNight(u){return u?.type===WHITE_NIGHT}
const whiteNightArt={idle:loadBaekArt('white-night-idle.webp'),windup:loadBaekArt('white-night-windup.webp'),strike:loadBaekArt('white-night-strike.webp'),dead:loadBaekArt('white-night-dead.webp')};
const WHITE_NIGHT_DIRECTIONS=[[0,-1],[1,-1],[1,0],[0,1],[-1,1],[-1,0]];
function whiteNightOffset(tile,dq,dr){const a=tiles[tile],x=a.x+dq,r=a.y-Math.floor(a.x/2)+dr;return index(x,r+Math.floor(x/2))}
function whiteNightArea(u,v){
 if(!u||!v||distance(u.tile,v.tile)!==1)return [];
 const facing=WHITE_NIGHT_DIRECTIONS.findIndex(([q,r])=>whiteNightOffset(u.tile,q,r)===v.tile);
 if(facing<0)return [];
 const left=WHITE_NIGHT_DIRECTIONS[(facing+5)%6],forward=WHITE_NIGHT_DIRECTIONS[facing],right=WHITE_NIGHT_DIRECTIONS[(facing+1)%6];
 const offsets=[forward,left,right,[2*left[0],2*left[1]],[left[0]+forward[0],left[1]+forward[1]],
  [2*forward[0],2*forward[1]],[forward[0]+right[0],forward[1]+right[1]],[2*right[0],2*right[1]]];
 return [...new Set(offsets.map(([q,r])=>whiteNightOffset(u.tile,q,r)).filter(i=>i>=0&&i!==u.tile))];
}
function whiteNightTargets(u,v){
 const valid=a=>a.hp>0&&!a.carriedBy&&atWar(u.f,a.f),result=[];
 for(const tile of whiteNightArea(u,v)){
  const a=tile===v.tile?v:units.find(a=>a.tile===tile&&valid(a));
  if(a&&valid(a))result.push(a);
 }
 return result;
}
const whiteNightDamage=damage;
damage=function(u,v){return isWhiteNight(u)?Math.max(0,Math.round(unitAttack(u))):whiteNightDamage(u,v)};
const whiteNightProductionPanel=productionPanel;
productionPanel=function(q){
 whiteNightProductionPanel(q);
 if(q.f!==6||q.f!==player||!q.capital&&q.level<4)return;
 const cat=$('unitCatalogue');if(!cat)return;
 const group=document.createElement('div');group.className='unitGroup';group.innerHTML='<h3>시엘룬 특수 병종</h3>';
 const row=document.createElement('div');row.className='productionRow';row.id='whiteNightProductionRow';
 const button=document.createElement('button'),why=productionReason(q,WHITE_NIGHT,productionTier,productionAA);
 button.className='produceButton'+(why?' unavailable':'');button.title=why;
 button.innerHTML=TYPES[WHITE_NIGHT].name+' '+productionTier+'<small>식량 '+unitPrice(WHITE_NIGHT,productionTier)+(productionAA?' · 골드 '+aaCost(productionTier):'')+'</small>';
 button.onclick=()=>produce(q,WHITE_NIGHT,productionTier,productionAA);
 const info=document.createElement('button');info.className='unitInfoButton';info.textContent='i';info.title='백야의 밤 정보';info.onclick=()=>showProductionInfo(q,WHITE_NIGHT,productionTier);
 row.appendChild(button);row.appendChild(info);group.appendChild(row);cat.appendChild(group);
};
function whiteNightPose(u,now){
 const fire=fireMotions.get(u.id),t=fire?now-fire.start:-1;
 if(!fire||t<0)return whiteNightArt.idle;
 if(t<SAPROS_WINDUP)return whiteNightArt.windup;
 if(t<SAPROS_WINDUP+SAPROS_RECOVERY)return whiteNightArt.strike;
 fireMotions.delete(u.id);return whiteNightArt.idle;
}
const whiteNightLaunch=launchShot;
launchShot=function(u,target,start=performance.now(),duration=520){
 if(!isWhiteNight(u))return whiteNightLaunch(u,target,start,duration);
 if(!skipAIAnimations())fireMotions.set(u.id,{start,duration:SAPROS_WINDUP+SAPROS_RECOVERY});
 return pxy(u.tile);
};
const whiteNightSprite=sprite;
sprite=function(u,p,now){
 if(!isWhiteNight(u))return whiteNightSprite(u,p,now);
 let art=whiteNightPose(u,now);if(!art.idleReady)art=whiteNightArt.idle;if(!art.idleReady)return;
 p=unitVisualPosition(u,now);
 const scale=WHITE_NIGHT_HEIGHT/whiteNightArt.idle.idle.naturalHeight,w=art.idle.naturalWidth*scale,h=art.idle.naturalHeight*scale;
 ctx.save();ctx.translate(p.x,p.y-3);ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,14,22,8,0,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.scale(Number.isFinite(u.angle)&&Math.cos(u.angle)<0?-1:1,1);ctx.drawImage(art.idle,-w/2,14-h,w,h);ctx.restore();
 if(cam.z>.55){rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}ctx.restore();
};
const whiteNightTargetExplosions=targetExplosions;
targetExplosions=function(u,p,d,now=performance.now(),city=false,target=null){
 if(!isWhiteNight(u)||city||!target)return whiteNightTargetExplosions(u,p,d,now,city,target);
 if(skipAIAnimations())return;
 const blood=TYPES[target.type].branch==='infantry'&&target.type!==11,depth=unitVisualPosition(target,now);
 fx.push({kind:blood?'saprosBlood':'saprosSparks',x:p.x,y:p.y,depthX:depth.x,depthY:depth.y,targetId:target.id,damage:d,start:now,duration:blood?800:600});
};
const whiteNightKill=kill;
kill=function(u){
 if(!isWhiteNight(u)||!units.includes(u))return whiteNightKill(u);
 const p=pxy(u.tile),before=fx.length,show=!u.carriedBy&&tiles[u.tile].owner>=0,result=whiteNightKill(u);
 if(skipAIAnimations())return result;
 fx=fx.slice(0,before).concat(fx.slice(before).filter(e=>!['wreck','infantryRemains'].includes(e.kind)));
 if(show)fx.push({kind:'whiteNightRemains',x:p.x,y:p.y,angle:u.angle,start:performance.now(),duration:8000});
 return result;
};
function isGroundRemains(e){return ['wreck','infantryRemains','saprosRemains','whiteNightRemains','navalSink'].includes(e.kind)}
function drawGroundRemains(now){
 for(const e of fx){
  const t=(now-e.start)/e.duration;if(!isGroundRemains(e)||t<0||t>=1)continue;
  if(Math.abs(e.x-cam.x)>screenW/2/cam.z+160||Math.abs(e.y-cam.y)>screenH/2/cam.z+180)continue;
  if(e.kind==='wreck'&&e.unitArt)continue; // Painted with the normal depth-sorted units.
  if(e.kind==='infantryRemains'){drawInfantryRemains(e,t);continue}
  if(e.kind==='saprosRemains'){drawSaprosEffect(e,t);continue}
  if(e.kind==='navalSink'){drawNavalEffect(e,t);continue}
  ctx.save();ctx.globalAlpha=Math.min(1,(1-t)*4);ctx.translate(e.x,e.y);
  if(e.kind==='whiteNightRemains'){
   const a=whiteNightArt.dead;if(a.idleReady){ctx.scale(Number.isFinite(e.angle)&&Math.cos(e.angle)<0?-1:1,1);const w=S*1.5,h=w*a.idle.naturalHeight/a.idle.naturalWidth;ctx.drawImage(a.idle,-w/2,14-h,w,h)}
  }else{ctx.rotate(.3);ctx.globalAlpha=1-t;rect(-21,-6,e.type===0?28:43,13,'#242e2c');rect(-12,-12,12,9,'#41443a');rect(8,-2,14,4,'#513a2d')}
  ctx.restore();
 }
}
const whiteNightAIStep=aiStep;
aiStep=function(u,targets){
 if(isWhiteNight(u)&&units.includes(u)&&mayFire(u)){
  const choices=units.filter(v=>canAttack(u,v));
  choices.sort((a,b)=>whiteNightTargets(u,b).length-whiteNightTargets(u,a).length||a.hp-b.hp||a.id-b.id);
  if(choices.length)return {attack:choices[0]};
 }
 return whiteNightAIStep(u,targets);
};
Object.assign(APP_EN,{'백야의 밤':'White Night','시엘룬 특수 병종':'Sielun special units',
 [TYPES[WHITE_NIGHT].text]:'Sielun special infantry. Produced in the capital or level-4+ homeland cities. Sweeps a forward trapezoid of up to 8 tiles, including the direct target. The direct target takes fixed damage equal to attack; others take 60% of that. Empty tiles, friendly, allied, neutral and embarked units are not hit.',
 [UNIT_STORIES[WHITE_NIGHT]]:'A giant polar bear warrior in black armor. A two-handed sword rises over its shoulder, then its heavy blade cleaves through the formation.'});
Object.assign(window.Terha,{WHITE_NIGHT,isWhiteNight,whiteNightArea,whiteNightTargets,whiteNightPose,drawGroundRemains,isGroundRemains,damage,productionPanel,launchShot,sprite,targetExplosions,kill,aiStep});
