'use strict';
const SHORELINE_SCHEMA=4;
function shoreUnitMismatch(u){if(u.carriedBy||isAircraft(u)||isHelicopter(u))return false;return isNaval(u)?tiles[u.tile].owner>=0:tiles[u.tile].owner<0}
function closestShoreTile(from,eligible,penalty=()=>0){let best=-1,score=Infinity;for(let i=0;i<tiles.length;i++){if(!eligible(i))continue;const d=distance(from,i)*100+penalty(i);if(d<score){score=d;best=i}}return best}
function alignTerrainOccupants(){for(let i=0;i<tiles.length;i++){const t=tiles[i],a=MAP.tiles[i];t.terrain=a[0]<0?0:a[1];if(a[0]<0)t.owner=-1}buildRegions();for(const q of cities)cityProfile(q);let moved=0;for(const u of units){if(!shoreUnitMismatch(u))continue;const naval=isNaval(u),old=u.tile,to=closestShoreTile(old,i=>!unitAt(i)&&(naval?tiles[i].owner<0:tiles[i].owner>=0)&&(!cityAt(i)||cityAt(i).f===u.f||cityAt(i).hp<=0),i=>tiles[i].owner===u.f?0:5);if(to<0)continue;u.tile=to;if(naval)for(const v of units)if(v.carriedBy===u.id)v.tile=to;moved++}for(const b of missileBases){if(tiles[b.tile].owner>=0)continue;const to=closestShoreTile(b.tile,i=>tiles[i].owner===b.f&&!cityAt(i)&&!missileBases.some(v=>v!==b&&v.tile===i)&&neighbors(i).some(j=>tiles[j].owner<0));if(to>=0)b.tile=to}territoryDirty=true;reach.clear();return moved}
const shorelineSetup=setup;setup=function(){const result=shorelineSetup();alignTerrainOccupants();faceInitialArmy();save();updateHUD();refreshSelection();return result};
const shorelineMigration=migrateArmy;migrateArmy=function(s){const result=shorelineMigration(s);if((s.shorelineSchema||0)<SHORELINE_SCHEMA)alignTerrainOccupants();return result};
Object.assign(window.Terha,{setup,migrateArmy,alignTerrainOccupants,shoreUnitMismatch});

