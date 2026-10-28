'use strict';
// Scenario restrictions and orders only; movement, combat, capture and production
// continue to run through the conquest engine and its existing UI.
const CampaignOrders=(()=>{
 const data=()=>activeScenario?.id==='iron-crown-m03'?IRON_CROWN_CAMPAIGN.battle3:activeScenario?.id==='iron-crown-m02'?IRON_CROWN_CAMPAIGN.battle2:activeScenario?.id==='iron-crown-m01'?IRON_CROWN_CAMPAIGN.battle:null;
 const points=()=>{const d=data();return d?cities.filter(q=>(d.id==='iron-crown-m01'?[1,2]:[1,2,3]).includes(q.id)):[]};
 function goal(u){
  const army=units.filter(v=>v.f===1&&v.hp>0&&!v.carriedBy),enemy=units.filter(v=>atWar(1,v.f)&&v.hp>0&&!v.carriedBy);
  return points().map(q=>{
   const d=distance(u.tile,q.tile),threats=enemy.filter(v=>distance(v.tile,q.tile)<=5).length;
   const support=army.filter(v=>v.id!==u.id&&distance(v.tile,q.tile)<=3).length;
   return{q,score:d+(atWar(1,q.f)?-8:0)-Math.min(6,threats*1.5)+Math.min(4,support*.65)};
  }).sort((a,b)=>a.score-b.score||a.q.id-b.q.id)[0]?.q||null;
 }
 function defense(u,q){
  if(!mayMove(u))return null;
  const threats=units.filter(v=>atWar(u.f,v.f)&&v.hp>0&&!v.carriedBy&&distance(v.tile,q.tile)<=5);
  const radius=TYPES[u.type].branch==='artillery'?Math.min(3,TYPES[u.type].range):1;
  const score=i=>{
   const d=distance(i,q.tile);let value=Math.max(0,d-radius)*3;
   if(!canCaptureCityUnit(u)&&i===q.tile)value+=2;
   if(threats.length){const v=threats.slice().sort((a,b)=>distance(i,a.tile)-distance(i,b.tile))[0],r=distance(i,v.tile);value+=Math.abs(r-Math.max(1,navalTargetRange(u,v)))*.7;if(TYPES[u.type].branch==='artillery'&&r<=1)value+=8}
   return value;
  };
  let tile=u.tile,best=score(tile);
  for(const i of reachable(u).costs.keys()){const value=score(i);if(value<best-.01){tile=i;best=value}}
  return tile!==u.tile?{move:tile}:null;
 }
 const nativeProfile=cityProfile;
 cityProfile=function(q){
  const d=data(),definition=d?.cities[q.id];
  if(definition)q.level=definition[5];
  nativeProfile(q);
  if(d&&q.f===d.player){
   // Scenario staging production lines: conventional counters remain available
   // at level three, without requiring the random world's level-five roll.
   if(definition?.[3]===d.player)for(const [k,level]of [[0,1],[9,2],[1,3],[2,3]])q.unlockAt[k]=Math.min(level,q.unlockAt[k]);
   // A staging base is not a national capital production exception.
   for(let k=0;k<TYPES.length;k++)if(TYPES[k].special!==undefined)q.unlockAt[k]=Math.max(4,q.unlockAt[k]);
   q.unlockAt[14]=Math.max(5,q.unlockAt[14]);
   if(Number.isFinite(q.hp))q.hp=Math.min(q.hp,cityMaxHp(q));
  }
  return q;
 };
 const nativeUpgrade=upgradeCity;
 upgradeCity=function(q){if(data())return false;return nativeUpgrade(q)};
 const nativeExpansion=aiExpansionCandidates;
 aiExpansionCandidates=function(f,owned){return data()?[]:nativeExpansion(f,owned)};
 const nativeAIUpgrade=aiUpgradeCities;
 aiUpgradeCities=function(f,owned){if(data())return;return nativeAIUpgrade(f,owned)};
 const nativePanel=showPanel;
 showPanel=function(){nativePanel();if(data()&&selected?.kind==='city'&&panelOpen){for(const id of ['cityExpandGold','upgrade']){const b=$(id);if(b){b.disabled=true;b.onclick=null;b.title='도시 레벨 고정'}}}};
 const nativeObjective=chooseObjective;
 chooseObjective=function(f){if(data()&&f===1)return goal(units.find(u=>u.f===1&&!u.carriedBy)||{id:-1,tile:points()[0]?.tile});return nativeObjective(f)};
 const nativeDanteGoal=danteUnitObjective;
 danteUnitObjective=function(u){return data()&&u.f===1?goal(u):nativeDanteGoal(u)};
 const nativeFront=danteAssignedFront;
 danteAssignedFront=function(u){if(data()&&u.f===1){const q=goal(u);return q?{name:'operation',anchor:q,goal:q,targets:[q],naval:false}:null}return nativeFront(u)};
 const nativeRifleGoal=aiRifleGoal;
 aiRifleGoal=function(u,targets){if(data()&&u.f===1){const q=goal(u);return q&&atWar(u.f,q.f)?q:null}return nativeRifleGoal(u,targets)};
 const nativeStep=aiStep;
 aiStep=function(u,targets){
  if(!data()||u.f!==1)return nativeStep(u,targets);
  if(!units.includes(u)||u.carriedBy||u.hp<=0||u.ap<=0)return null;
  const q=goal(u);if(!q)return null;
  const action=nativeStep(u,[q]);
  if(action)return action;
  return q.f===u.f?defense(u,q):null;
 };
 Object.assign(window.Terha,{cityProfile,upgradeCity,aiExpansionCandidates,aiUpgradeCities,showPanel,chooseObjective,danteUnitObjective,danteAssignedFront,aiRifleGoal,aiStep});
 return{goal,points,data};
})();
