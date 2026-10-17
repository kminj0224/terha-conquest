'use strict';
// City air damage is tuned by mission class; AA and SAM defenses remain effective.
const AIR_CITY_DAMAGE_MULTIPLIER=1;
function cityAirStrikeDamage(type,q){
 const damage={fighter:2000,bomber:5000,strategic:15000}[type];
 if(!damage)return 0;
 return Math.round(damage*(q.aa?.45:1)*samAirProtection(q));
}
const previousAirSiegeDamage=siegeDamage;
siegeDamage=function(u,q){
 const damage=previousAirSiegeDamage(u,q);
 if(q?.kind==='sam'||q?.kind==='sea')return damage;
 const protection=(q?.aa?.45:1)*samAirProtection(q);
  if(u.type===25)return Math.round(2000*protection);
  if(isAircraft(u)||isHelicopter(u))return Math.round(Math.max(2000,Math.min(3000,damage/Math.max(.1,protection)))*protection);
  return damage;
};
Object.assign(window.Terha,{cityAirStrikeDamage,siegeDamage,AIR_CITY_DAMAGE_MULTIPLIER});
