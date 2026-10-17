'use strict';
// v1.10.79: 2.5x oil income, protected city garrisons,
// and repeatable aircraft targeting until cancelled or funds run out.
const originalOilYield=cityYield;
cityYield=function(q,level=q.level){
 const result=originalOilYield(q,level);
 return {...result,oil:Math.round(result.oil*2.5)};
};
const originalGarrisonDamage=damage;
function garrisonProtection(v){
 const q=v&&Number.isInteger(v.tile)?cityAt(v.tile):null;
 return q&&q.f===v.f?.7:1;
}
damage=function(attacker,defender){
 const base=originalGarrisonDamage(attacker,defender);
 return Math.max(0,Math.round(base*garrisonProtection(defender)));
};
const previousRepeatableSortie=airStrike;
airStrike=async function(q,type,i,ai=false){
 const completed=await previousRepeatableSortie(q,type,i,ai);
 if(!completed||ai||!started||busy||menuMode||q.f!==player)return completed;
 const m=AIR_MISSIONS[type];
 if(!m)return completed;
 if(money[q.f]>=m.cost&&oil[q.f]>=m.oil&&q.airport&&(q.nukeUntil||0)<=turn){
  // Preserve the same source city and aircraft type between repeated taps.
  selected={kind:'city',id:q.id};
  panelOpen=false;
  reach.clear();
  airTarget={city:q.id,type};
  refreshSelection();
  toast(m.name+' · 다음 목표를 선택하세요. 종료하려면 아래 ×');
 }else{
  airTarget=null;
  refreshSelection();
  toast('남은 출격 자원이 부족합니다. 항공 작전을 종료했습니다.');
 }
 updateHUD();
 save();
 return completed;
};
const oilSetup=setup;
setup=function(...args){
 return oilSetup(...args);
};
Object.assign(window.Terha,{cityYield,damage,airStrike,garrisonProtection});
