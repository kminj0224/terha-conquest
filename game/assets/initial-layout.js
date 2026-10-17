'use strict';
const CITY_PLACEMENT_SCHEMA=2;
let placementComponents=null;
function placementMapComponents(){if(placementComponents)return placementComponents;const ids=Array(tiles.length).fill(-1),sizes=[];for(let i=0;i<tiles.length;i++){if(ids[i]>=0)continue;const id=sizes.length,origin=MAP.tiles[i][0],queue=[i];ids[i]=id;for(let n=0;n<queue.length;n++)for(const j of neighbors(queue[n]))if(ids[j]<0&&MAP.tiles[j][0]===origin){ids[j]=id;queue.push(j)}sizes.push(queue.length)}return placementComponents={ids,sizes}}
function citySiteQuality(q,i){if(MAP.tiles[i][0]!==q.origin||!CITY_GROUND_CENTER[i])return false;const comp=placementMapComponents();return comp.ids[i]===comp.ids[q.tile]||comp.sizes[comp.ids[q.tile]]<20}
function adjustCityPlacement(){const abadon=cities.find(q=>q.name==='아바돈'),changes=[];for(const q of cities.slice().sort((a,b)=>Number(b.capital)-Number(a.capital)||(a.name==='미타모리'?1:0)-(b.name==='미타모리'?1:0)||a.id-b.id)){const old=q.tile,coastal=neighbors(old).some(i=>MAP.tiles[i][0]<0),forced=q.name==='미타모리'&&abadon,spacing=i=>Math.min(...cities.filter(v=>v.id!==q.id).map(v=>distance(i,v.tile)));if(CITY_GROUND_CENTER[old]&&CITY_GROUND_SUPPORT[old]>=92&&spacing(old)>=2&&(!forced||distance(old,abadon.tile)>=4))continue;let best=-1,score=Infinity;for(let i=0;i<tiles.length;i++){const d=distance(old,i);if(d>5||!citySiteQuality(q,i)||cities.some(v=>v.id!==q.id&&v.tile===i)||units.some(u=>!u.carriedBy&&u.tile===i&&i!==old)||forced&&distance(i,abadon.tile)<4)continue;const gap=spacing(i);if(gap<2||CITY_GROUND_SUPPORT[i]<84)continue;const shore=neighbors(i).some(j=>MAP.tiles[j][0]<0),s=d*12+(100-CITY_GROUND_SUPPORT[i])*2+(coastal&&!shore?18:0)+(CITY_GROUND_SUPPORT[i]<92?80:0);if(s<score){score=s;best=i}}if(best<0)continue;q.tile=best;for(const u of units)if(u.tile===old&&u.f===q.f&&!u.carriedBy&&!isNaval(u))u.tile=best;changes.push({name:q.name,from:old,to:best,quality:CITY_GROUND_SUPPORT[best]})}tiles.forEach(t=>t.city=-1);cities.forEach(q=>{tiles[q.tile].city=q.id;cityProfile(q)});buildRegions();territoryDirty=true;reach.clear();return changes}
function seedInlandDefenseGuards(){
 const placed=[];
 for(const f of [0,2]){
  let count=0;
  const inland=cities.filter(q=>q.origin===f&&!q.capital&&!neighbors(q.tile).some(i=>tiles[i].owner<0));
  for(const q of inland){
   if(count>=10)break;
   const options=tiles.map((t,i)=>({i,d:distance(q.tile,i)})).filter(v=>v.d<=2&&tiles[v.i].owner===f&&!unitAt(v.i)&&placed.filter(x=>x.f===f).every(x=>distance(x.i,v.i)>=2)).sort((a,b)=>a.d-b.d||mixSeed(a.i*1301+f)-mixSeed(b.i*1301+f));
   const spot=options[0]?.i;if(spot===undefined)continue;
   const u=makeUnit(f,0,spot,1);u.initialInlandGuard=true;placed.push({f,i:spot});count++;
  }
 }
 return placed;
}
function formHomeFleets(){const comp=placementMapComponents();for(let f=0;f<7;f++){const ships=units.filter(u=>u.f===f&&isNaval(u)&&u.type!==26&&!u.westernFleet).sort((a,b)=>Number(b.type===25)-Number(a.type===25)||b.type-a.type).slice(0,5);if(ships.length<4)continue;const group=new Set(ships.map(u=>u.id)),ports=cities.filter(q=>q.f===f&&q.harbor).sort((a,b)=>b.level-a.level||a.id-b.id);let chosen=null,bestScore=Infinity;for(const q of ports)for(let i=0;i<tiles.length;i++){if(tiles[i].owner>=0||CITY_GROUND_SUPPORT[i]>8||comp.sizes[comp.ids[i]]<1000||distance(q.tile,i)>5)continue;const eligible=[i,...neighbors(i)].filter(j=>tiles[j].owner<0&&CITY_GROUND_SUPPORT[j]<=8&&!units.some(u=>u.tile===j&&!u.carriedBy&&!group.has(u.id)));if(eligible.length<ships.length)continue;const s=distance(q.tile,i)*10-q.level+distance(i,cities.find(v=>v.f===f&&v.capital).tile)*.015;if(s<bestScore){bestScore=s;chosen=eligible.slice(0,ships.length)}}if(!chosen)continue;ships.forEach((u,n)=>{u.tile=chosen[n];u.homeFleet=true})}}
function initialEnemyTarget(u){const pool=units.filter(v=>v.f!==u.f&&!v.carriedBy&&(isNaval(u)?isNaval(v):!isNaval(v))),enemies=pool.filter(v=>atWar(u.f,v.f)),candidates=enemies.length?enemies:pool;if(!candidates.length)return null;return candidates.reduce((best,v)=>distance(u.tile,v.tile)<distance(u.tile,best.tile)?v:best)}
function faceInitialArmy(){for(const u of units){if(u.carriedBy)continue;const v=initialEnemyTarget(u);if(!v)continue;const p=pxy(u.tile),q=pxy(v.tile),dx=q.x-p.x,dy=q.y-p.y,facing=Math.abs(dx)>.001?dx>0?1:-1:u.f===1?-1:1;u.angle=TYPES[u.type].branch==='artillery'?(facing>0?-.35:Math.PI+.35):Math.atan2(dy,dx);u.rifleFacing=u.tankFacing=u.artilleryFacing=u.devilFacing=u.carrierFacing=u.destroyerFacing=facing}}
const arrangedSetup=setup;setup=function(){const result=arrangedSetup();adjustCityPlacement();formHomeFleets();seedInlandDefenseGuards();faceInitialArmy();save();updateHUD();refreshSelection();return result};
const arrangedMigration=migrateArmy;migrateArmy=function(s){const result=arrangedMigration(s);if((s.cityPlacementSchema||0)<CITY_PLACEMENT_SCHEMA)adjustCityPlacement();return result};
Object.assign(window.Terha,{setup,migrateArmy,adjustCityPlacement,initialEnemyTarget,seedInlandDefenseGuards});
