'use strict';
// A movement search is synchronous and read-only. Scope occupancy to that search
// rather than retaining a cache across moves, casualties or save migrations.
let pathOccupancy=null;
const pathUnitAt=unitAt,pathBaseAt=baseAt;
unitAt=function(i){return pathOccupancy?pathOccupancy.units.get(i):pathUnitAt(i)};
baseAt=function(i){return pathOccupancy?pathOccupancy.bases.get(i):pathBaseAt(i)};
const unindexedReachable=reachable;
reachable=function(u){
 if(pathOccupancy||renderIndex||!mayMove(u))return unindexedReachable(u);
 const occupied=new Map(),bases=new Map();
 for(const v of units)if(!v.carriedBy&&v.hp>0&&!occupied.has(v.tile))occupied.set(v.tile,v);
 for(const b of missileBases)if(!bases.has(b.tile))bases.set(b.tile,b);
 pathOccupancy={units:occupied,bases};
 try{return unindexedReachable(u)}finally{pathOccupancy=null}
};
Object.assign(window.Terha,{unitAt,baseAt,reachable});
