'use strict';
// Derive support from current board state; never persist or mutate base stats.
function hasSpecialSupport(u,type){
 if(!u||!Number.isInteger(u.tile)||!tiles[u.tile]||u.hp<=0||u.carriedBy)return false;
 return units.some(s=>s.f===u.f&&s.type===type&&s.hp>0&&!s.carriedBy&&distance(s.tile,u.tile)<=2);
}
function specialAttackFactor(u){return TYPES[u?.type]?.branch==='armor'&&hasSpecialSupport(u,17)?1.5:1}
function specialIncomingFactor(u){return u?.type!==6&&TYPES[u?.type]?.branch==='infantry'&&hasSpecialSupport(u,6) ? .4 : 1}
function unitArmor(u){return (TYPES[u.type]?.def||0)*(TYPES[u.type]?.branch==='armor'&&hasSpecialSupport(u,18)?2:1)}
const supportUnitAttack=unitAttack;
unitAttack=function(u){return Math.round(supportUnitAttack(u)*specialAttackFactor(u))};
const supportDamage=damage;
damage=function(u,v){return Math.round(supportDamage(u,v)*specialIncomingFactor(v))};
TYPES[17].text+=' 지원: 2타일 이내 아군 전차 군종 공격력 +50%. 범위 밖에서는 해제. 같은 지원 효과는 중첩되지 않습니다.';
TYPES[6].text+=' 지원: 2타일 이내 아군 보병 군종이 받는 공격 피해 60% 감소. 범위 밖에서는 해제. 흑색병단 자신과 다른 흑색병단에는 적용되지 않습니다. 같은 지원 효과는 중첩되지 않습니다.';
TYPES[18].text+=' 지원: 2타일 이내 아군 전차 군종 장갑 ×2. 범위 밖에서는 해제. 같은 지원 효과는 중첩되지 않습니다.';
Object.assign(window.Terha,{hasSpecialSupport,specialAttackFactor,specialIncomingFactor,unitArmor,unitAttack,damage});
