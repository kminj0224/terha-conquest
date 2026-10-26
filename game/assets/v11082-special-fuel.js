'use strict';
// v1.10.82: new Nakwol capital special unit, Mecha Knight illustration,
// and research attached to each producing city rather than the whole faction.
const NAKWOL_COMMANDO=TYPES.length;
TYPES.push({
 name:'낙월 특공대',cost:480,hp:170,atk:52,range:2,move:4,def:18,
 branch:'infantry',special:5,icon:'×',
 text:'낙월민국 수도 전용 특수 보병. 1단계 기본 체력 170, 공격력 52, 사거리 2. 목표의 방어력과 지형·도시 방어 효과를 무시합니다.'
});
UNIT_STORIES[NAKWOL_COMMANDO]='낙월 특공대의 붉은 베레모는 낙월민국 최정예 보병의 상징입니다.';
const nakwolCommandoArt=loadBaekArt('nakwol-commando-idle.webp','nakwol-commando-fire.webp');
NAKWOL_INFANTRY_PROFILES[NAKWOL_COMMANDO]={
 art:nakwolCommandoArt,baseFacing:-1,
 muzzles:baekMuzzles([[40,405],[512,367],[972,355],[215,689],[697,695]]),
 burst:true,burstShots:4
};
// The special is available only at the Nakwol capital, with the normal
// 5-star capital special requirement. Do not renumber existing save IDs.
const commandoProductionPanel=productionPanel;
productionPanel=function(q){
 commandoProductionPanel(q);
 // The economy catalogue has its own special-unit list. Expose the new
 // special in that same list, not in the generic infantry catalogue.
 if(q.f!==5||(!q.capital&&q.level<4)||q.f!==player)return;
 const cat=$('unitCatalogue');
 if(!cat)return;
 const group=document.createElement('div');group.className='unitGroup';
 group.innerHTML='<h3>낙월민국 특수 병종</h3>';
 cat.appendChild(group);
 const k=NAKWOL_COMMANDO,l=productionTier,reason=productionReason(q,k,l,productionAA);
 const row=document.createElement('div');row.className='productionRow';row.id='nakwolCommandoProductionRow';
 const b=document.createElement('button');b.className='produceButton'+(reason?' unavailable':'');b.title=reason;
 b.innerHTML=TYPES[k].name+' '+l+'<small>식량 '+unitPrice(k,l)+' · 석유 '+unitOil(k,l)+(productionAA?' · 골드 '+aaCost(l):'')+'</small>';
 b.onclick=()=>produce(q,k,l,productionAA);
 const info=document.createElement('button');info.className='unitInfoButton';info.textContent='i';info.title='낙월 특공대 정보';
 info.onclick=()=>showProductionInfo(q,k,l);
 row.appendChild(b);row.appendChild(info);group.appendChild(row);
};
const commandoDamage=damage;
damage=function(u,v){
 if(u?.type!==NAKWOL_COMMANDO)return commandoDamage(u,v);
 // All normal armor and terrain/city defense is ignored. Honor level,
 // health, faction research and outgoing infantry bonuses.
 let atk=unitAttack(u);
 const target=TYPES[v.type];
 if(target.branch==='armor'&&TYPES[u.type].antiArmor)atk*=TYPES[u.type].antiArmor;
 if(target.branch==='infantry'&&TYPES[u.type].antiInfantry)atk*=TYPES[u.type].antiInfantry;
 // Full defense bypass: armor, terrain, city shelter and defensive bonuses.
 return Math.round(Math.max(1,atk));
};
const MECHA_KNIGHT_ART=loadBaekArt('mecha-knight-new.webp');
const previousMechaSprite=sprite;
sprite=function(u,p,now){
 if(u?.type!==18||!MECHA_KNIGHT_ART.idleReady)return previousMechaSprite(u,p,now);
 const move=movingAnimation(u.id);
 if(move){const t=Math.max(0,Math.min(1,(now-move.start)/move.duration));p={x:move.from.x+(move.to.x-move.from.x)*t,y:move.from.y+(move.to.y-move.from.y)*t}}
 const firing=fireMotions.get(u.id),elapsed=firing?now-firing.start:-1;
 ctx.save();ctx.translate(p.x,p.y-3);ctx.globalAlpha=1;
 ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,12,35,9,0,0,Math.PI*2);ctx.fill();
 beginLargeUnitBody(u,14);
 ctx.save();
 // The gun points left in the image; flip horizontally for right-hand targets.
 const facing=Number.isFinite(u.angle)&&Math.cos(u.angle)>0?-1:1;
 ctx.scale(facing,1);
 ctx.drawImage(MECHA_KNIGHT_ART.idle,-44,-39,88,53);
 if(elapsed>=0&&elapsed<170){const burst=1-elapsed/170;circle(-41,-16,6*burst,'#bdfaff')}
 ctx.restore();endLargeUnitBody();ctx.restore();
 if(firing&&elapsed>=firing.duration)fireMotions.delete(u.id);
 if(cam.z>.55){ctx.save();ctx.translate(p.x,p.y-3);ctx.font='bold 9px Terha,sans-serif';ctx.textAlign='center';ctx.lineWidth=2.5;ctx.strokeStyle='#10222b';ctx.strokeText(TYPES[u.type].name+' '+u.level,0,38);ctx.fillStyle='#eee7d2';ctx.fillText(TYPES[u.type].name+' '+u.level,0,38);rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color);ctx.restore()}
};
const FUEL_RESEARCH_COST=50000,FUEL_RESEARCH_TURNS=2;
Object.assign(RESEARCH_DEFS,{
 fuelEfficiency:{name:'연비 개선',cost:FUEL_RESEARCH_COST,turns:FUEL_RESEARCH_TURNS,description:'국가 전체 적용. 기존·신규 보병·기갑·포병의 이동·공격 석유 소모가 없어지며, 해군의 이동·공격 석유 소모는 절반으로 감소합니다(소수점 버림).'},
 supplyRoutes:{name:'수송로 개선',cost:63000,oil:450,turns:4,description:'국가 전체 적용. 연결된 본토 도시에서 점령도시로 보내는 유닛은 거리와 무관하게 1턴 만에 도착합니다.'}
});
function fuelResearchReason(q){return !q||q.f!==player?'아군 도시만 연구할 수 있습니다.':studyReason(q,'fuelEfficiency')}
function studyFuelEfficiency(q){return study(q,'fuelEfficiency')}
const baselineMoveOil=moveOil,baselineAttackOil=attackOil;
function efficiencyCost(u,original){
 if(!strategicResearch[u?.f]?.fuelEfficiency)return original;
 const branch=TYPES[u.type]?.branch;
 if(['infantry','armor','artillery'].includes(branch))return 0;
 if(branch==='navy')return Math.floor(original/2);
 return original;
}
moveOil=function(u){return efficiencyCost(u,baselineMoveOil(u))};
attackOil=function(u){return efficiencyCost(u,baselineAttackOil(u))};
const fuelDeploy=deploy;
deploy=function(q){
 const ids=new Set(units.map(u=>u.id)),result=fuelDeploy(q);
 for(const u of units)if(!ids.has(u.id)&&u.f===q.f){u.producedAtCityId=q.id;if(u.type===26){u.aiFreeTransport=false;delete u.aiTransportGrantGroup}}
 return result;
};
const fuelMigration=migrateArmy;
migrateArmy=function(s){
 const result=fuelMigration(s);
 for(const q of cities){
  const r=strategicResearch[q.f];
  if(q.fuelEfficiency)r.fuelEfficiency=true;
  const j=q.fuelResearchJob;
  if(j&&j.owner===q.f&&Number.isFinite(j.remaining)&&j.remaining>0&&!r.fuelEfficiency&&!researchJobs(r).some(j=>j.key==='fuelEfficiency'))
   researchJobs(r).push({key:'fuelEfficiency',city:q.id,remaining:j.remaining,total:2,lastTick:j.lastTick??turn});
  delete q.fuelEfficiency;delete q.fuelResearchJob;
 }
 for(const u of units){if(u.fuelEfficient)strategicResearch[u.f].fuelEfficiency=true;delete u.fuelEfficient}
 return result;
};
Object.assign(window.Terha,{NAKWOL_COMMANDO,FUEL_RESEARCH_COST,FUEL_RESEARCH_TURNS,damage,studyFuelEfficiency,
 fuelResearchReason,efficiencyCost,moveOil,attackOil,migrateArmy,deploy,productionPanel});
