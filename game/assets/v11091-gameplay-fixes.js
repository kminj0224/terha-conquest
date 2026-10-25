'use strict';
// v1.10.91: restore reliable ranged counterfire, keep mounted warheads
// only while aiming, and acknowledge successful construction.
const preCounterRange=canCounterattack;
canCounterattack=function(defender,attacker){
 const range=TYPES[defender?.type]?.range||0;
 return !!(defender&&attacker&&defender.hp>0&&attacker.hp>0
  &&!defender.carriedBy&&atWar(defender.f,attacker.f)
  &&distance(defender.tile,attacker.tile)<=range);
};
// Ranged counterfire should not silently fail at random.
const oldCounterChance=rollCounterattack;
rollCounterattack=function(defender,attacker){
 return canCounterattack(defender,attacker);
};
function clearMountedWarheads(){
 armedMissile=null;
 armedBomber=null;
}
const cancelPriorStrategic=cancelAirTarget;
cancelAirTarget=function(){
 if(strategicTarget){
  strategicTarget=null;
  clearMountedWarheads();
  airTarget=null;
  reach.clear();
  refreshSelection();
  return;
 }
 return cancelPriorStrategic();
};
$('selectionAirCancel').onclick=()=>cancelAirTarget();
const firePriorStrategic=launchStrategic;
launchStrategic=async function(q,kind,i,...args){
 const wasAiming=!!strategicTarget;
 const result=await firePriorStrategic(q,kind,i,...args);
 if(result&&wasAiming)clearMountedWarheads();
 return result;
};
const turnPriorStrategic=endTurn;
endTurn=async function(...args){
 if(!busy&&started)clearMountedWarheads();
 return turnPriorStrategic(...args);
};
function constructionComplete(name){
 const particle=name.endsWith('공항')?'이':'가';
 return name+particle+' 건설되었습니다.';
}
const buildPriorFacility=buildFacility;
buildFacility=function(q,key){
 const success=buildPriorFacility(q,key);
 if(success&&q.f===player)toast(constructionComplete(FACILITIES[key].name));
 return success;
};
// Coastal and SAM positions take two turns; show completion only when they
// actually finish rather than when work is ordered.
const turnPriorConstruction=industryTurn;
industryTurn=async function(...args){
 const unfinished=new Set(missileBases.filter(b=>b.f===player&&b.remaining>0).map(b=>b.id));
 const result=await turnPriorConstruction(...args);
 for(const b of missileBases){
  if(b.f===player&&unfinished.has(b.id)&&b.remaining<=0)
   toast(constructionComplete(DEFENSES[b.kind||'sea'].name));
 }
 return result;
};
Object.assign(window.Terha,{
 cancelAirTarget,launchStrategic,endTurn,buildFacility,industryTurn,
 canCounterattack,rollCounterattack,clearMountedWarheads
});
