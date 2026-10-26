'use strict';
// Final balance values; all type IDs and Android/save identities stay stable.
TYPES[6].cost=780;
function ignoresUnitArmor(u,v){
 return !!(TYPES[u?.type]?.ignoreTankArmor&&TYPES[v?.type]?.branch==='armor'||
  isDekphuingGuerrilla(u)&&guerrillaTerrain(u));
}
function aiDiversePool(f,pool){
 const count=k=>units.filter(u=>u.f===f&&u.type===k&&u.hp>0).length+cities.filter(q=>q.f===f&&q.queue?.type===k).length;
 return [...pool].sort((a,b)=>count(a)-count(b)||((turn+f+a)%TYPES.length)-((turn+f+b)%TYPES.length));
}
// Descriptions carry abilities; the information grid carries base values and prices.
for(const t of TYPES){
 const old=t.text;
 t.text=t.text
  .replace(/1단계 기본 체력 \d+, 공격력 \d+, (?:이동력 \d+칸|사거리 \d+)\. ?/g,'')
  .replace(/사거리 \d+와 강력한 장갑\. ?/g,'')
  .replace(/ · 대함 사거리 \d+칸/g,'')
  .replace(/(?<!병력 )사거리 \d+(?:칸)?[.,] ?/g,'')
  .replace(/생산 식량 \d+, 골드·석유 소모 없음\.?/g,'')
  .trim();
 if(typeof APP_EN!=='undefined'&&APP_EN[old])APP_EN[t.text]=APP_EN[old]
  .replace(/Range \d+[.;] ?/gi,'').replace(/ with range \d+ and strong armor/g,'')
  .replace(/; anti-ship range \d+/g,'').replace(/ Costs \d+ food, no gold or oil\./g,'');
}
TYPES[9].text='대전차 로켓. 적 전차 군종을 공격할 때 장갑을 무시합니다.';
TYPES[DEKPHUING_GUERRILLA].text='란나 특수 보병. 산·숲·강 타일에서 공격력 100% 증가, 장갑 무시, 받는 공격 피해 30% 감소. 해당 지형의 이동력 감소를 무시합니다.';
TYPES[SAPROS].text='아이리아 제국 특수 유닛. 수도 또는 4레벨 이상 본토 도시에서 생산. 석유를 소비하지 않으며, 이동할 때마다 식량 18, 공격할 때마다 식량 16을 소비합니다(1단계 기준, 편제 단계 배율 적용). 전차 특성: 격파 후 추가 공격, 이동을 쓰지 않았다면 이동 가능. 3타일 이내 아군 보병 공격력 +45%. 같은 지원 효과는 중첩되지 않습니다.';
// Counterfire is now reliable; remove an obsolete chance description too.
TYPES[3].text=TYPES[3].text.replace(/공격·피격 시 반격 발생 확률 40%\./g,'').trim();
Object.assign(APP_EN,{
 [TYPES[9].text]:'Anti-tank rockets. Ignores armor when attacking enemy tank-class units.',
 [TYPES[DEKPHUING_GUERRILLA].text]:'Ranna special infantry. On forest, mountain or river tiles: +100% attack, ignores armor, and takes 30% less damage. Ignores movement penalties on these tiles.',
 [TYPES[SAPROS].text]:'Ayria special unit. Produced in the capital or level-4+ homeland cities. Uses no oil. Each move consumes 18 food and each attack consumes 16 food at tier one, scaled by formation tier. Tank kill grants another attack and preserves unused movement. Friendly infantry within 3 tiles gain +45% attack; this support does not stack.',
 '수송로 개선':'Supply route improvement',
 '국가 전체 적용. 연결된 본토 도시에서 점령도시로 보내는 유닛은 거리와 무관하게 1턴 만에 도착합니다.':'Nationwide. Units shipped from connected homeland cities arrive at occupied cities in one turn regardless of distance.',
 '국가 전체 적용. 기존·신규 보병·기갑·포병의 이동·공격 석유 소모가 없어지며, 해군의 이동·공격 석유 소모는 절반으로 감소합니다(소수점 버림).':'Nationwide. Existing and new infantry, armor and artillery use no oil to move or attack. Naval movement and attack oil costs are halved, rounded down.'
});
function moveFood(u){return isSapros(u)?tierCost(18,u.level):0}
function attackFood(u){return isSapros(u)?tierCost(16,u.level):0}
const foodMayMove=mayMove,foodMayFire=mayFire;
mayMove=function(u){return foodMayMove(u)&&food[u.f]>=moveFood(u)};
mayFire=function(u){return foodMayFire(u)&&food[u.f]>=attackFood(u)};
const foodMoveUnit=moveUnit;
moveUnit=function(u,i,ai=false){
 const cost=moveFood(u);if(food[u.f]<cost)return false;
 const ok=foodMoveUnit(u,i,ai);
 if(ok){food[u.f]-=cost;if(!ai&&cost){updateHUD();save()}}
 return ok;
};
const foodSpendShot=spendShot;
spendShot=function(u){const cost=attackFood(u);foodSpendShot(u);food[u.f]-=cost};
const foodCounterEligibility=canCounterattack;
canCounterattack=function(u,v){return foodCounterEligibility(u,v)&&food[u.f]>=attackFood(u)};
const logisticsDeploy=deploy;
deploy=function(q){
 const j=q.queue;
 if(j?.transportTo!==undefined&&strategicResearch[q.f]?.supplyRoutes){j.total=1;j.remaining=Math.min(1,j.remaining)}
 return logisticsDeploy(q);
};
const logisticsSnapshot=snapshot;
snapshot=function(){return {...logisticsSnapshot(),balanceLogisticsSchema:1}};
const logisticsMigration=migrateArmy;
migrateArmy=function(s){
 const previous=new Map((s.units||[]).filter(isSapros).map(u=>[u.id,u.hp]));
 const result=logisticsMigration(s);
 for(const u of units){
  if(isSapros(u)&&previous.has(u.id)){
   const oldMax=Math.round((989+(tech[u.f]||0)*12)*tierMultiplier(u.level));
   u.hp=s.balanceLogisticsSchema?Math.min(unitMaxHp(u),previous.get(u.id)):Math.round(unitMaxHp(u)*Math.max(0,Math.min(1,previous.get(u.id)/oldMax)));
  }
  if(u.type===26&&u.aiFreeTransport===undefined){
   u.aiFreeTransport=!Number.isInteger(u.producedAtCityId);
   if(u.aiFreeTransport)u.aiTransportGrantGroup=u.danteFront||'standard';
  }
 }
 return result;
};
Object.assign(window.Terha,{ignoresUnitArmor,aiDiversePool,moveFood,attackFood,mayMove,mayFire,moveUnit,spendShot,
 canCounterattack,counterattackDamage,deploy,snapshot,migrateArmy});
