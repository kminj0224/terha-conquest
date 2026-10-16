'use strict';
// Local objectives prevent an army on one border from following the other border's target.
let danteFrontPlan=null,danteLandComponents=null;
function danteLandMap(){if(danteLandComponents)return danteLandComponents;const comp=new Int32Array(tiles.length).fill(-1);let id=0;for(let i=0;i<tiles.length;i++){if(tiles[i].owner<0||comp[i]>=0)continue;const queue=[i];comp[i]=id;for(let n=0;n<queue.length;n++)for(const j of neighbors(queue[n]))if(tiles[j].owner>=0&&comp[j]<0){comp[j]=id;queue.push(j)}id++}return danteLandComponents=comp}
function danteForceWeight(u){const branch=TYPES[u.type]?.branch;return (branch==='armor'||branch==='artillery'?3:branch==='helicopter'?2:1)*(1+.2*((u.level||1)-1))}
function buildDanteFrontPlan(){
 const own=cities.filter(q=>q.f===1),capital=own.find(q=>q.capital)||own[0];if(!capital)return danteFrontPlan=null;
 const components=danteLandMap(),cx=pxy(capital.tile).x,groups=[[],[]];
 for(const q of cities)if(atWar(1,q.f)&&components[q.tile]===components[capital.tile])groups[pxy(q.tile).x<cx?0:1].push(q);
 const fronts=groups.map((targets,side)=>{if(!targets.length)return null;const goal=targets.reduce((a,b)=>{const score=q=>Math.min(...own.map(c=>distance(c.tile,q.tile)))+units.filter(u=>!u.carriedBy&&u.f===q.f&&distance(u.tile,q.tile)<=4).length*.5;return score(a)<=score(b)?a:b});const anchor=own.reduce((a,b)=>distance(a.tile,goal.tile)<=distance(b.tile,goal.tile)?a:b);const enemy=units.filter(u=>!u.carriedBy&&!isNaval(u)&&atWar(1,u.f)&&distance(u.tile,anchor.tile)<=12).reduce((s,u)=>s+danteForceWeight(u),0);return{side,targets,goal,anchor,enemy,supply:0}}).filter(Boolean);
 if(!fronts.length)return danteFrontPlan=null;
 const assignments=new Map(),army=units.filter(u=>u.f===1&&!u.carriedBy&&!isNaval(u)),reserve=[];
 for(const u of army){const sorted=fronts.slice().sort((a,b)=>distance(u.tile,a.anchor.tile)-distance(u.tile,b.anchor.tile));if(sorted.length===1||distance(u.tile,sorted[1].anchor.tile)-distance(u.tile,sorted[0].anchor.tile)>8){assignments.set(u.id,sorted[0]);sorted[0].supply+=danteForceWeight(u)}else reserve.push(u)}
 const totalDemand=fronts.reduce((s,f)=>s+10+f.enemy,0);for(const f of fronts)f.share=Math.max(.35,Math.min(.65,(10+f.enemy)/totalDemand));
 reserve.sort((a,b)=>danteForceWeight(b)-danteForceWeight(a)||a.id-b.id);for(const u of reserve){const f=fronts.slice().sort((a,b)=>(a.supply/a.share+distance(u.tile,a.anchor.tile)*.5)-(b.supply/b.share+distance(u.tile,b.anchor.tile)*.5))[0];assignments.set(u.id,f);f.supply+=danteForceWeight(u)}
 return danteFrontPlan={fronts,assignments,turn};
}
function danteUnitObjective(u){if(!danteFrontPlan||danteFrontPlan.turn!==turn)buildDanteFrontPlan();const plan=danteFrontPlan;if(!plan||isNaval(u))return aiObjectives[1];let front=plan.assignments.get(u.id);if(!front){front=plan.fronts.slice().sort((a,b)=>distance(u.tile,a.anchor.tile)-distance(u.tile,b.anchor.tile))[0];plan.assignments.set(u.id,front)}
 const goals=front.targets.filter(q=>atWar(1,q.f));if(!goals.length){buildDanteFrontPlan();return aiObjectives[1]}
 // Respond locally to an incursion without pulling the opposite border's whole army away.
 const threat=units.filter(v=>!v.carriedBy&&!isNaval(v)&&atWar(1,v.f)&&distance(v.tile,u.tile)<=8&&cities.some(q=>q.f===1&&distance(q.tile,v.tile)<=3)).sort((a,b)=>distance(u.tile,a.tile)-distance(u.tile,b.tile))[0];
 if(threat)return{tile:threat.tile,f:threat.f};return goals.reduce((a,b)=>distance(u.tile,a.tile)<=distance(u.tile,b.tile)?a:b);
}
function danteProductionOrder(ordered,pool){if(!danteFrontPlan||danteFrontPlan.turn!==turn)buildDanteFrontPlan();if(!danteFrontPlan||danteFrontPlan.fronts.length<2||pool.every(k=>TYPES[k].branch==='navy'))return ordered;
 const fronts=danteFrontPlan.fronts.map(f=>({...f,supply:0})),locate=i=>fronts.slice().sort((a,b)=>distance(i,a.anchor.tile)-distance(i,b.anchor.tile))[0];
 for(const u of units)if(u.f===1&&!u.carriedBy&&!isNaval(u)){const assigned=danteFrontPlan.assignments.get(u.id),f=assigned?fronts.find(f=>f.side===assigned.side):locate(u.tile);f.supply+=danteForceWeight(u)}
 for(const q of cities)if(q.f===1&&q.queue&&TYPES[q.queue.type].branch!=='navy')locate(q.tile).supply+=danteForceWeight({type:q.queue.type,level:q.queue.level});
 const weak=fronts.slice().sort((a,b)=>a.supply/a.share-b.supply/b.share)[0];
 return ordered.slice().sort((a,b)=>(distance(a.tile,weak.anchor.tile)-a.level*.5)-(distance(b.tile,weak.anchor.tile)-b.level*.5)||a.id-b.id);
}
const danteChooseObjective=chooseObjective;chooseObjective=function(f){if(f===1)buildDanteFrontPlan();return danteChooseObjective(f)};
const danteFrontSetup=setup;setup=function(){danteFrontPlan=null;danteLandComponents=null;return danteFrontSetup()};
const danteFrontMigration=migrateArmy;migrateArmy=function(s){danteFrontPlan=null;danteLandComponents=null;return danteFrontMigration(s)};
