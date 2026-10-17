'use strict';
// City fortresses have thousands of HP: air attacks now deal ten times their
// previous city damage. Unit damage, sortie costs, range and defenses are unchanged.
const AIR_CITY_DAMAGE_MULTIPLIER=10;
function cityAirStrikeDamage(type,q){
 const mission=AIR_MISSIONS[type];
 if(!mission)return 0;
 return Math.round(Math.max(20,mission.damage-q.level*3)*12*AIR_CITY_DAMAGE_MULTIPLIER*(q.aa?.45:1)*samAirProtection(q));
}
const previousAirSiegeDamage=siegeDamage;
siegeDamage=function(u,q){
 const damage=previousAirSiegeDamage(u,q);
 if(q?.kind==='sam'||q?.kind==='sea')return damage;
 return (isAircraft(u)||isHelicopter(u)||u.type===25)?Math.round(damage*AIR_CITY_DAMAGE_MULTIPLIER):damage;
};
Object.assign(window.Terha,{cityAirStrikeDamage,siegeDamage,AIR_CITY_DAMAGE_MULTIPLIER});
