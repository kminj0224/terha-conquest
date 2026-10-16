'use strict';
// One-stage baseline only; existing tier and research multipliers are unchanged.
const UNIT_BALANCE_42_SCHEMA=1;
const UNIT_BALANCE_42={
 0:{atk:25,hp:130},8:{atk:30,hp:140},9:{atk:28,hp:135},10:{atk:35,hp:150},11:{atk:27,hp:145},6:{atk:33,hp:150},
 12:{atk:40,hp:200,cost:220,antiInfantry:1.2},13:{atk:45,hp:240,cost:280,antiInfantry:1.2},
 1:{atk:50,hp:280,cost:360,antiInfantry:1.2},14:{atk:65,hp:550,cost:650,antiInfantry:1.2},
 17:{atk:60,hp:500,cost:600,antiInfantry:1.2}
};
const PREVIOUS_UNIT_BALANCE_42=new Map();
for(const [key,stats]of Object.entries(UNIT_BALANCE_42)){
 const k=Number(key);PREVIOUS_UNIT_BALANCE_42.set(k,{...TYPES[k]});Object.assign(TYPES[k],stats);
 if(stats.antiInfantry){TYPES[k].text=TYPES[k].text.replace(/보병 (?:상대 공격|대상 피해) \+\d+%/g,'보병 상대 추가 피해 +20%');if(!TYPES[k].text.includes('보병 상대 추가 피해 +20%'))TYPES[k].text+=' 보병 상대 추가 피해 +20%.'}
}
const troopBalanceMigration=migrateArmy;migrateArmy=function(s){
 const ratios=new Map(),savedHealth=new Map();
 if(s.unitBalance42Schema===UNIT_BALANCE_42_SCHEMA)for(const u of s.units)if(UNIT_BALANCE_42[u.type])savedHealth.set(u.id,u.hp);
 const previous=s.unitBalance42Schema!==UNIT_BALANCE_42_SCHEMA&&s.unitSchema===UNIT_SCHEMA&&s.balanceSchema===BALANCE_SCHEMA&&s.tierBalanceSchema===TIER_BALANCE_SCHEMA;
 if(previous)for(const u of s.units){const old=PREVIOUS_UNIT_BALANCE_42.get(u.type);if(old){const max=Math.round((old.hp+(s.tech[u.f]||0)*12)*tierMultiplier(u.level));ratios.set(u.id,Math.max(0,Math.min(1,u.hp/max)))}}
 const result=troopBalanceMigration(s);
 if(previous)for(const u of units)if(ratios.has(u.id))u.hp=Math.min(unitMaxHp(u),Math.round(unitMaxHp(u)*ratios.get(u.id)));
 for(const u of units)if(savedHealth.has(u.id))u.hp=Math.max(0,Math.min(unitMaxHp(u),savedHealth.get(u.id)));
 return result;
};
Object.assign(window.Terha,{migrateArmy});
