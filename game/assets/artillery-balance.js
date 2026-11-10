'use strict';
// Final one-stage values override earlier naval/rocket attack adjustments once.
const ARTILLERY_BALANCE_43={
 15:{atk:48,cost:150,range:1},16:{atk:50,cost:240,range:2},
 3:{atk:52,cost:340,range:2,hp:120,def:20},2:{atk:82,cost:450,range:2,hp:130,def:25},
 18:{atk:96,cost:1220,range:2,branch:'armor',tank:true}
};
const ARTILLERY_PREVIOUS_HP={2:TYPES[2].hp,3:TYPES[3].hp};
for(const [key,stats]of Object.entries(ARTILLERY_BALANCE_43)){
 const type=TYPES[Number(key)];Object.assign(type,stats);
 type.text=type.text.replace(/사거리 \d+/g,'사거리 '+stats.range);
 if(!type.text.includes('사거리 '+stats.range))type.text='사거리 '+stats.range+'. '+type.text;
}
ARTILLERY.splice(0,ARTILLERY.length,15,16,3,2);
TYPES[2].text+=' 포병 최상위 병종. 강력한 직접 포격.';
// Upgrade old artillery saves once, preserving damage ratio and tier/research health.
const artilleryBalanceMigration=migrateArmy;migrateArmy=function(s){
 const hp=new Map(s.units.filter(u=>ARTILLERY_BALANCE_43[u.type]).map(u=>[u.id,u.hp]));
 const result=artilleryBalanceMigration(s);
 if(s.unitSchema===UNIT_SCHEMA&&s.balanceSchema===BALANCE_SCHEMA&&s.tierBalanceSchema===TIER_BALANCE_SCHEMA){
  for(const u of units){
   if(!hp.has(u.id))continue;
   let health=hp.get(u.id);
   if(!s.artilleryHealthSchema&&ARTILLERY_PREVIOUS_HP[u.type]){
    const oldMax=Math.round((ARTILLERY_PREVIOUS_HP[u.type]+(s.tech?.[u.f]||0)*12)*tierMultiplier(u.level));
    health=Math.round(unitMaxHp(u)*Math.max(0,Math.min(1,health/oldMax)));
   }
   u.hp=Math.max(0,Math.min(unitMaxHp(u),health));
  }
 }
 return result;
};
Object.assign(window.Terha,{migrateArmy});
