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
const FUEL_RESEARCH_COST=20000,FUEL_RESEARCH_TURNS=2;
function fuelResearchReason(q){
 if(!q||q.f!==player)return'아군 도시만 연구할 수 있습니다.';
 if(q.nukeUntil>turn)return'피폭 통제가 종료되어야 합니다.';
 if(q.level<4)return'도시를 4레벨로 확장하세요.';
 if(!q.lab)return'과학연구소를 먼저 건설하세요.';
 if(q.fuelEfficiency)return'이 도시에서 이미 연구했습니다.';
 if(q.fuelResearchJob)return'연구 진행 중입니다.';
 if(researchJobs(strategicResearch[q.f]).some(j=>j.city===q.id))return'이 도시에서 다른 과학 연구가 진행 중입니다.';
 if(money[q.f]<FUEL_RESEARCH_COST)return'골드 20,000이 필요합니다.';
 return'';
}
function studyFuelEfficiency(q){
 const reason=fuelResearchReason(q);
 if(busy||reason){if(reason)toast(reason);return false}
 money[q.f]-=FUEL_RESEARCH_COST;
 q.fuelResearchJob={remaining:FUEL_RESEARCH_TURNS,lastTick:turn,owner:q.f};
 showPanel();updateHUD();save();return true;
}
const originalFuelStudyReason=studyReason;
studyReason=function(q,key){
 if(q?.fuelResearchJob)return'이 도시의 연비 개선 연구를 먼저 완료하세요.';
 return originalFuelStudyReason(q,key);
};
const fuelPanel=showPanel;
showPanel=function(){
 fuelPanel();
 if(selected?.kind!=='city'||!panelOpen||busy)return;
 const q=cities[selected.id];if(q.f!==player)return;
 const box=$('strategicResearch');
 if(!box)return;
 let status=q.fuelEfficiency?'연구 완료':q.fuelResearchJob?'연구 중 · '+q.fuelResearchJob.remaining+'턴 남음':'골드 20,000 · 2턴';
 conditionButton(box,'연비 개선 · '+status,fuelResearchReason(q),()=>studyFuelEfficiency(q));
 const note=document.createElement('p');note.className='hint';
 note.textContent='이 도시에서 연구 완료 후 생산한 보병·전차·포병: 이동/공격 석유 0 · 해군: 이동/공격 석유 절반(소수점 버림)';
 box.appendChild(note);
};
const fuelOverview=cityOverview;
cityOverview=function(q){
 let html=fuelOverview(q);
 if(q.fuelEfficiency)html+='<p class="hint">연비 개선 완료 · 이후 생산 부대에 적용</p>';
 if(q.fuelResearchJob){
  const card=progressCard('연비 개선 연구','이 도시 연구소에서 진행 중 · 완료 후 생산 부대에 적용',q.fuelResearchJob.remaining,FUEL_RESEARCH_TURNS);
  const heading='<h3>진행 중인 작업</h3>';
  const empty=heading+'<p class="quiet">진행 중인 작업이 없습니다.</p>';
  if(html.includes(empty))html=html.replace(empty,heading+card);
  else html=html.replace(heading,heading+card);
 }
 return html;
};
const fuelDeploy=deploy;
deploy=function(q){
 const ids=new Set(units.map(u=>u.id));
 const boosted=!!q.queue&&!!q.fuelEfficiency&&!q.fuelResearchJob;
 const result=fuelDeploy(q);
 for(const u of units)if(!ids.has(u.id)&&u.f===q.f){
  u.producedAtCityId=q.id;
  u.fuelEfficient=boosted;
 }
 return result;
};
const baselineMoveOil=moveOil,baselineAttackOil=attackOil;
function efficiencyCost(u,original){
 if(!u?.fuelEfficient)return original;
 const branch=TYPES[u.type]?.branch;
 if(branch==='infantry'||branch==='armor'||branch==='artillery')return 0;
 if(branch==='navy')return Math.floor(original/2);
 return original;
}
moveOil=function(u){return efficiencyCost(u,baselineMoveOil(u))};
attackOil=function(u){return efficiencyCost(u,baselineAttackOil(u))};
const fuelTurn=industryTurn;
industryTurn=async function(...args){
 await fuelTurn(...args);
 for(const q of cities){
  const j=q.fuelResearchJob;
  if(!j)continue;
  if(q.f!==j.owner||q.nukeUntil>turn||!q.lab||q.level<4){q.fuelResearchJob=null;continue}
  const passed=Math.max(0,turn-(j.lastTick??turn));
  j.lastTick=turn;j.remaining=Math.max(0,j.remaining-passed);
  if(j.remaining>0)continue;
  q.fuelEfficiency=true;q.fuelResearchJob=null;
  if(q.f===player)toast(q.name+' 연비 개선 연구 완료');
 }
};
const fuelSetup=setup;
setup=function(...args){
 const result=fuelSetup(...args);
 for(const q of cities){q.fuelEfficiency=false;q.fuelResearchJob=null}
 return result;
};
const fuelMigration=migrateArmy;
migrateArmy=function(s){
 const result=fuelMigration(s);
 for(const q of cities){
  q.fuelEfficiency=!!q.fuelEfficiency;
  const j=q.fuelResearchJob;
  if(j&&(!Number.isFinite(j.remaining)||j.remaining<=0))q.fuelResearchJob=null;
 }
 for(const u of units)u.fuelEfficient=!!u.fuelEfficient;
 return result;
};
Object.assign(window.Terha,{NAKWOL_COMMANDO,FUEL_RESEARCH_COST,FUEL_RESEARCH_TURNS,damage,studyFuelEfficiency,
 fuelResearchReason,efficiencyCost,moveOil,attackOil,industryTurn,migrateArmy,setup,deploy,showPanel,productionPanel});

