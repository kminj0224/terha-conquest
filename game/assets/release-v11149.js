'use strict';
// Preserve type IDs and the proportion of remaining health in old campaigns.
const MECHA_KNIGHT_PREVIOUS_HP=TYPES[18].hp;
TYPES[18].hp=512;
Object.assign(NAKWOL_INFANTRY_PROFILES[NAKWOL_COMMANDO],{
 idleFoot:358/360,fireFoot:356/360,footY:19.5
});
const release49Snapshot=snapshot;
snapshot=function(){return {...release49Snapshot(),mechaKnightHealthSchema:1}};
const release49Migration=migrateArmy;
migrateArmy=function(s){
 const health=new Map((s.units||[]).filter(u=>u.type===18).map(u=>{
  const max=Math.round(((s.mechaKnightHealthSchema?512:MECHA_KNIGHT_PREVIOUS_HP)+(s.tech?.[u.f]||0)*12)*tierMultiplier(u.level));
  return [u.id,{hp:u.hp,ratio:Math.max(0,Math.min(1,u.hp/max))}];
 }));
 const result=release49Migration(s);
 for(const u of units){const old=health.get(u.id);if(old)u.hp=s.mechaKnightHealthSchema?Math.max(0,Math.min(unitMaxHp(u),old.hp)):Math.round(unitMaxHp(u)*old.ratio)}
 return result;
};
Object.assign(window.Terha,{snapshot,migrateArmy});
