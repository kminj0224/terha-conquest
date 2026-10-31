'use strict';
// Airborne troops are a temporary, single-stage air-drop-only unit.
// The type is appended after existing ids to preserve old saves and scenarios.
const AIRBORNE_TROOPER=TYPES.length, AIRBORNE_TURNS=2;
TYPES.push({
 name:'공수부대',cost:TYPES[0].cost,hp:211,atk:52,def:TYPES[0].def,
 move:TYPES[0].move,range:TYPES[0].range,branch:'infantry',icon:'×',
 text:'수송기 공수강하 전용. 공격력 52, 체력 211. 방어시설 피해 ×200, 3레벨 이하 도시 피해 ×500. 2턴 뒤 행동 불가. 아군 비공수부대가 3타일 안에 있거나 진입하면 4단계 소총수로 전환되며, 최초 행동에 소총수 생산 식량이 부과됩니다.'
});
UNIT_STORIES[AIRBORNE_TROOPER]='수송기의 하강등이 켜지면 공수대원들이 장구를 조여 맵니다. 처음에는 독립된 전투부대로 움직이지만, 보급부대와 합류하면 정규 소총수 편제로 재편됩니다.';
function isAirborne(u){return !!u&&u.type===AIRBORNE_TROOPER}
function airborneExpired(u){return isAirborne(u)&&Number.isInteger(u.airdropTurn)&&turn-u.airdropTurn>=AIRBORNE_TURNS}
function airborneSupport(u){return units.some(v=>v!==u&&v.f===u.f&&v.type!==AIRBORNE_TROOPER&&v.hp>0&&!v.carriedBy&&distance(u.tile,v.tile)<=3)}
function airborneRifleCost(u){return u?.riflePaymentDue?unitPrice(0,4):0}
function airborneAffordable(u){return food[u.f]>=airborneRifleCost(u)}
const baseAirborneHp=unitMaxHp;
unitMaxHp=function(u){return isAirborne(u)?211:baseAirborneHp(u)};
const baseAirborneAttack=unitAttack;
unitAttack=function(u){return isAirborne(u)?u.hp>0?Math.max(1,Math.round(52*unitHealthFactor(u))):0:baseAirborneAttack(u)};
const baseAirborneProduce=canProduce;
canProduce=function(q,k,level=1){return k!==AIRBORNE_TROOPER&&baseAirborneProduce(q,k,level)};
const baseAirborneSiege=siegeDamage;
siegeDamage=function(u,target){
 if(!isAirborne(u))return baseAirborneSiege(u,target);
 if(target?.kind==='sam'||target?.kind==='sea')return Math.round(unitAttack(u)*200);
 if(Number.isInteger(target?.level)&&target.level<=3)return Math.round(unitAttack(u)*500);
 return baseAirborneSiege(u,target);
};
// A paratrooper cannot be replaced by another paratrooper; a converted rifleman can support others.
function convertAirborne(u){
 if(!airborneExpired(u)||!airborneSupport(u))return false;
 const oldMax=unitMaxHp(u),fraction=Math.max(0,Math.min(1,u.hp/oldMax));
 u.type=0;u.level=4;u.hp=Math.max(1,Math.round(unitMaxHp(u)*fraction));
 delete u.airdropTurn;delete u.airdropInactive;
 u.riflePaymentDue=true;
 freshOrders(u);
 log(factions[u.f].name+' · 공수부대 합류 · 4단계 소총수로 전환');
 return true;
}
function reconcileAirborne(){
 let changed=false,again=true;
 while(again){
  again=false;
  for(const u of units)if(airborneExpired(u)){
   u.airdropInactive=true;
   if(convertAirborne(u)){changed=true;again=true}
   else{u.moveAllowed=false;u.attackReady=false;u.ap=0}
  }
 }
 return changed;
}
const previousAirborneMake=makeUnit;
makeUnit=function(f,type,tile,level=1){
 const u=previousAirborneMake(f,type,tile,type===AIRBORNE_TROOPER?1:level);
 if(type!==AIRBORNE_TROOPER&&units.some(airborneExpired))reconcileAirborne();
 return u;
};
const previousAirborneOrders=freshOrders;
freshOrders=function(u){
 if(airborneExpired(u)&&convertAirborne(u))return;
 previousAirborneOrders(u);
 if(airborneExpired(u)){u.airdropInactive=true;u.moveAllowed=false;u.attackReady=false;syncOrders(u)}
};
const previousAirborneMoveAllowed=mayMove,previousAirborneFireAllowed=mayFire;
mayMove=function(u){return !airborneExpired(u)&&airborneAffordable(u)&&previousAirborneMoveAllowed(u)};
mayFire=function(u){return !airborneExpired(u)&&airborneAffordable(u)&&previousAirborneFireAllowed(u)};
const previousAirborneCounter=canCounterattack;
canCounterattack=function(u,v){return !airborneExpired(u)&&airborneAffordable(u)&&previousAirborneCounter(u,v)};
function chargeAirborneRifle(u){
 if(!u?.riflePaymentDue)return true;
 const price=airborneRifleCost(u);
 if(food[u.f]<price)return false;
 food[u.f]-=price;
 delete u.riflePaymentDue;
 return true;
}
const previousAirborneMove=moveUnit;
moveUnit=function(u,i,ai=false){
 if(!u||airborneExpired(u)||!airborneAffordable(u))return false;
 const due=!!u.riflePaymentDue;
 const result=previousAirborneMove(u,i,ai);
 if(result&&due)chargeAirborneRifle(u);
 if(result)reconcileAirborne();
 return result;
};
const previousAirborneShot=spendShot;
spendShot=function(u){
 if(!chargeAirborneRifle(u))return false;
 return previousAirborneShot(u);
};
const previousAirborneCounterDamage=counterattackDamage;
counterattackDamage=function(u,v,hp){chargeAirborneRifle(u);return previousAirborneCounterDamage(u,v,hp)};
const previousAirborneResupply=canResupply,previousAirborneRepair=repair;
canResupply=function(u){
 return !airborneExpired(u)&&airborneAffordable(u)&&
  food[u.f]>=resupplyCost(u).food+airborneRifleCost(u)&&previousAirborneResupply(u);
};
repair=function(u){
 if(!canResupply(u))return false;
 const due=!!u.riflePaymentDue;
 const result=previousAirborneRepair(u);
 if(result&&due)chargeAirborneRifle(u);
 return result;
};
const previousAirborneCapture=canCaptureCityUnit;
canCaptureCityUnit=function(u){return isAirborne(u)?!airborneExpired(u):previousAirborneCapture(u)};
const previousAirborneMuzzle=infantryArtProfile,airborneProfiles=new Map();
infantryArtProfile=function(u){
 if(!isAirborne(u))return previousAirborneMuzzle(u);
 if(!airborneProfiles.has(u.f)){
  const rifle=previousAirborneMuzzle({...u,type:0});
  airborneProfiles.set(u.f,rifle?{...rifle,burst:true,burstShots:8}:null);
 }
 return airborneProfiles.get(u.f);
};
const previousAirborneAudio=combatWeaponProfile,previousAirborneImpact=combatImpactProfile;
combatWeaponProfile=function(u){return isAirborne(u)?previousAirborneAudio({...u,type:10}):previousAirborneAudio(u)};
combatImpactProfile=function(u){return isAirborne(u)?'bullet_hit':previousAirborneImpact(u)};
const previousAirborneLaunch=launchShot;
launchShot=function(u,target,start=performance.now(),duration=520){
 if(!isAirborne(u)||infantryArtProfile(u))return previousAirborneLaunch(u,target,start,duration);
 const muzzle=previousAirborneLaunch(u,target,start,duration);
 fireMotions.set(u.id,{start,duration:560,burst:true});
 if(muzzle)for(let j=1;j<8;j++)fx.push({kind:'infantryMuzzle',x:muzzle.x,y:muzzle.y,angle:u.angle||0,start:start+j*70,duration:55});
 return muzzle;
};
// The mortar is a one-hex weapon and burns no fuel for either action, regardless of research.
TYPES[15].move=1;
TYPES[15].text+=' 이동력 1. 이동과 공격에 석유를 소비하지 않습니다.';
const previousMortarMoveOil=moveOil,previousMortarAttackOil=attackOil;
moveOil=function(u){return u?.type===15?0:previousMortarMoveOil(u)};
attackOil=function(u){return u?.type===15?0:previousMortarAttackOil(u)};
const previousAirbornePanel=showPanel;
showPanel=function(){
 previousAirbornePanel();
 const u=selected?.kind==='unit'?units.find(v=>v.id===selected.id):null;
 if(!isAirborne(u)||!panelOpen)return;
 const panel=$('panel');
 const stage=panel.querySelector?.('h2 small');if(stage)stage.remove();
 const header=panel.querySelector?.('.eyebrow');if(header)header.textContent='보병';
 const status=document.createElement('p');
 status.textContent=airborneExpired(u)?'공수부대 지원 대기 · 이동·공격·반격 불가 · 3타일 이내 비공수 아군이 합류하면 4단계 소총수로 전환':'잔여 독립작전 '+Math.max(0,AIRBORNE_TURNS-(turn-u.airdropTurn))+'턴';
 panel.appendChild(status);
};
const previousAirborneMigration=migrateArmy;
migrateArmy=function(s){
 const result=previousAirborneMigration(s);
 for(const u of units)if(isAirborne(u)){
  u.level=1;
  if(!Number.isInteger(u.airdropTurn))u.airdropTurn=turn;
  u.hp=Math.max(0,Math.min(211,u.hp));
 }
 reconcileAirborne();
 return result;
};
const previousAirborneSetup=setup;
setup=function(...args){airborneProfiles.clear();return previousAirborneSetup(...args)};
Object.assign(window.Terha,{AIRBORNE_TROOPER,airborneExpired,airborneSupport,convertAirborne,reconcileAirborne,makeUnit,freshOrders,mayMove,mayFire,
 moveUnit,spendShot,canCounterattack,counterattackDamage,canCaptureCityUnit,unitMaxHp,unitAttack,siegeDamage,
 moveOil,attackOil,infantryArtProfile,combatWeaponProfile,combatImpactProfile,launchShot,
 canProduce,canResupply,repair,showPanel,migrateArmy,setup});
