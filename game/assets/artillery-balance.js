'use strict';
// Final one-stage values override earlier naval/rocket attack adjustments once.
const ARTILLERY_BALANCE_43={
 15:{atk:48,cost:150,range:1},16:{atk:50,cost:240,range:2},
 3:{atk:52,cost:340,range:2},2:{atk:82,cost:450,range:2},
 18:{atk:96,cost:1000,range:2,branch:'armor',tank:true}
};
for(const [key,stats]of Object.entries(ARTILLERY_BALANCE_43)){
 const type=TYPES[Number(key)];Object.assign(type,stats);
 type.text=type.text.replace(/사거리 \d+/g,'사거리 '+stats.range);
 if(!type.text.includes('사거리 '+stats.range))type.text='사거리 '+stats.range+'. '+type.text;
}
ARTILLERY.splice(0,ARTILLERY.length,15,16,3,2);
TYPES[2].text+=' 포병 최상위 병종. 강력한 직접 포격.';
// Preserve saved artillery HP exactly; neither base HP nor tier multipliers changed.
const artilleryBalanceMigration=migrateArmy;migrateArmy=function(s){
 const hp=new Map(s.units.filter(u=>ARTILLERY_BALANCE_43[u.type]).map(u=>[u.id,u.hp]));
 const result=artilleryBalanceMigration(s);
 if(s.unitSchema===UNIT_SCHEMA&&s.balanceSchema===BALANCE_SCHEMA&&s.tierBalanceSchema===TIER_BALANCE_SCHEMA)for(const u of units)if(hp.has(u.id))u.hp=Math.max(0,Math.min(unitMaxHp(u),hp.get(u.id)));
 return result;
};
Object.assign(window.Terha,{migrateArmy});
