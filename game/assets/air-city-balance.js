'use strict';
// City air damage is tuned by mission class; AA and SAM defenses remain effective.
const AIR_CITY_DAMAGE_MULTIPLIER=1;
function cityAirStrikeDamage(type,q){
 const damage={fighter:2000,bomber:2500,strategic:3000}[type];
 if(!damage)return 0;
 return Math.round(damage*(q.aa?.45:1)*samAirProtection(q));
}
const previousAirSiegeDamage=siegeDamage;
siegeDamage=function(u,q){
 const damage=previousAirSiegeDamage(u,q);
 if(q?.kind==='sam'||q?.kind==='sea')return damage;
 return (isAircraft(u)||isHelicopter(u)||u.type===25)?Math.max(2000,Math.min(3000,damage)):damage;
};
Object.assign(window.Terha,{cityAirStrikeDamage,siegeDamage,AIR_CITY_DAMAGE_MULTIPLIER});
