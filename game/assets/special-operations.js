'use strict';
// Keep type 17 stable so armies and queued production survive the replacement.
const SPECIAL_OPERATIONS_SCHEMA=2;
const previousDanteSpecialHp=TYPES[17].hp;
Object.assign(TYPES[17],{name:'특공군단',branch:'infantry',icon:'×',hp:130,atk:55,move:13,range:3,def:18,tank:false,
 text:'단테 제국 특수 보병. 1단계 기본 체력 130, 공격력 55, 이동력 13칸. 수도 또는 4레벨 이상 도시에서 생산. 소총 연발사격.'});
delete TYPES[17].antiInfantry;delete TYPES[17].smallArms;
UNIT_STORIES[17]='검은 전투복과 붉은 제국 표식을 갖춘 특공군단. 분대 단위로 기동하며 소총의 연발사격으로 목표를 제압합니다.';
factions[1].bonus='기갑 공격 +20% · 특공군단';
for(const t of TYPES)if(t.special!==undefined)t.text=t.text.replace(/(?:백양|단테|스테토피아|낙월민국) 수도 전용(?: 특수 보병)?\.?/g,'수도 또는 4레벨 이상 도시에서 생산.');
TYPES[6].text+=' 턴당 최대 2회 공격.';

const specialFreshOrders=freshOrders;
freshOrders=function(u){specialFreshOrders(u);if(u.type===6)u.blackShots=2};
const specialSpendShot=spendShot;
spendShot=function(u){
 if(u.type!==6)return specialSpendShot(u);
 const left=Number.isInteger(u.blackShots)?u.blackShots:(u.attacked?0:2);
 specialSpendShot(u);u.blackShots=Math.max(0,left-1);u.attackReady=u.blackShots>0;syncOrders(u);
};
const specialMayFire=mayFire;
mayFire=function(u){return specialMayFire(u)&&(u.type!==6||(u.blackShots??(u.attacked?0:2))>0)};

function aiExpansionCandidates(f,owned){return owned.filter(q=>q.f===f&&q.level<5&&!(q.nukeUntil>turn)).sort((a,b)=>(a.level===3?0:a.level<3?1:2)-(b.level===3?0:b.level<3?1:2)||UPGRADE_COSTS[a.level]-UPGRADE_COSTS[b.level]||a.id-b.id)}
function aiUpgradeReserve(f,owned){const q=aiExpansionCandidates(f,owned)[0];return q?UPGRADE_COSTS[q.level]:0}
function aiUpgradeCities(f,owned){
 // Invest available gold before discretionary military spending, on every difficulty.
 for(;;){const q=aiExpansionCandidates(f,owned).find(q=>money[f]>=UPGRADE_COSTS[q.level]);if(!q)break;
  const old=cityMaxHp(q);money[f]-=UPGRADE_COSTS[q.level];q.level++;q.hp=Math.min(cityMaxHp(q),q.hp+cityMaxHp(q)-old);cityProfile(q);
 }
}
const aiSpecialOrderTurns=Array(factions.length).fill(-1);
function aiOrderSpecials(f,owned){
 if(aiSpecialOrderTurns[f]===turn)return 0;
 const pool=TYPES.map((t,k)=>k).filter(k=>TYPES[k].special===f);
 if(!pool.length)return 0;
 for(const q of owned.filter(q=>q.f===f&&!q.queue&&!q.produced&&!(q.nukeUntil>turn)).sort((a,b)=>b.level-a.level||a.id-b.id)){
  // Tier one keeps a continuing supply affordable instead of exhausting food on one elite unit.
  const k=pool.find(k=>canProduce(q,k,1)&&food[f]>=unitPrice(k,1)&&money[f]>=navGoldCost(k,1)&&oil[f]>=unitOil(k,1));
  if(k===undefined)continue;
  food[f]-=unitPrice(k,1);money[f]-=navGoldCost(k,1);oil[f]-=unitOil(k,1);
  q.queue={type:k,level:1,aa:false};q.produced=true;aiSpecialOrderTurns[f]=turn;return 1;
 }
 return 0;
}
const specialAIProcure=aiProcure;
aiProcure=function(f,owned){
 aiUpgradeCities(f,owned);aiOrderSpecials(f,owned);
 const next=aiExpansionCandidates(f,owned)[0],reserve=next?Math.min(money[f],UPGRADE_COSTS[next.level]):0;
 money[f]-=reserve;
 try{return specialAIProcure(f,owned)}finally{money[f]+=reserve}
};
const specialSetup=setup;
setup=function(...args){aiSpecialOrderTurns.fill(-1);return specialSetup(...args)};
const specialSnapshot=snapshot;
snapshot=function(){return{...specialSnapshot(),specialOperationsSchema:SPECIAL_OPERATIONS_SCHEMA,aiSpecialOrderTurns:[...aiSpecialOrderTurns]}};
const specialMigration=migrateArmy;
migrateArmy=function(s){
 const health=new Map();
 for(const u of s.units||[])if(u.type===17){const current=s.specialOperationsSchema===SPECIAL_OPERATIONS_SCHEMA;
  const oldBase=current?130:s.specialOperationsSchema===1?60:previousDanteSpecialHp;
  const oldMax=(oldBase+(s.tech?.[u.f]||0)*12)*tierMultiplier(u.level);
  health.set(u.id,{hp:u.hp,ratio:Math.max(0,Math.min(1,u.hp/oldMax)),current});
 }
 const result=specialMigration(s);
 for(let f=0;f<factions.length;f++)aiSpecialOrderTurns[f]=Number.isInteger(s.aiSpecialOrderTurns?.[f])?s.aiSpecialOrderTurns[f]:-1;
 for(const u of units){const h=health.get(u.id);if(h)u.hp=h.current?Math.max(0,Math.min(unitMaxHp(u),h.hp)):Math.round(unitMaxHp(u)*h.ratio);
  if(u.type===6){u.blackShots=Number.isInteger(u.blackShots)?Math.max(0,Math.min(2,u.blackShots)):(u.attacked?0:2);u.attackReady=!!u.attackReady&&u.blackShots>0;syncOrders(u)}
 }
 return result;
};
Object.assign(window.Terha,{setup,aiSpecialOrderTurns,freshOrders,spendShot,mayFire,aiProcure,aiUpgradeCities,aiOrderSpecials,aiExpansionCandidates,aiUpgradeReserve,snapshot,migrateArmy});
