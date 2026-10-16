'use strict';
// Stable v1.10.62 map coordinate: the isolated Dante battery south of Maria Port.
const MARIA_SEA_TILE=4961,MARIA_LEGACY_TILE=MAP.tiles[MARIA_SEA_TILE].slice(),MARIA_LEGACY_SUPPORT=CITY_GROUND_SUPPORT[MARIA_SEA_TILE],MARIA_LEGACY_CENTER=CITY_GROUND_CENTER[MARIA_SEA_TILE];
function applyMariaSea(){
 MAP.tiles[MARIA_SEA_TILE]=[-1,0];
 const tile=tiles[MARIA_SEA_TILE];tile.owner=-1;tile.terrain=0;tile.city=-1;
 missileBases=missileBases.filter(b=>b.tile!==MARIA_SEA_TILE);
 CITY_GROUND_SUPPORT[MARIA_SEA_TILE]=0;CITY_GROUND_CENTER[MARIA_SEA_TILE]=0;
 seaComponents=null;placementComponents=null;danteLandComponents=null;shoreCacheKey='';
 buildRegions();territoryDirty=true;groundViewKey='';reach.clear();
 // Old saves can have moved a ground unit onto this formerly owned tile.
 for(const u of units)if(u.tile===MARIA_SEA_TILE&&!u.carriedBy&&!isNaval(u)&&!isAircraft(u)&&!isHelicopter(u)){
  const to=closestShoreTile(u.tile,i=>tiles[i].owner===u.f&&!unitAt(i)&&!baseAt(i));if(to>=0)u.tile=to;
 }
}
const mariaSetup=setup;setup=function(...args){
 // Preserve deterministic original placements, then remove just this battery.
 MAP.tiles[MARIA_SEA_TILE]=MARIA_LEGACY_TILE.slice();seaComponents=null;placementComponents=null;danteLandComponents=null;shoreCacheKey='';
 const support=CITY_GROUND_SUPPORT[MARIA_SEA_TILE],center=CITY_GROUND_CENTER[MARIA_SEA_TILE];
 CITY_GROUND_SUPPORT[MARIA_SEA_TILE]=MARIA_LEGACY_SUPPORT;CITY_GROUND_CENTER[MARIA_SEA_TILE]=MARIA_LEGACY_CENTER;
 try{const result=mariaSetup(...args);applyMariaSea();save();return result}
 catch(error){CITY_GROUND_SUPPORT[MARIA_SEA_TILE]=support;CITY_GROUND_CENTER[MARIA_SEA_TILE]=center;throw error}
};
const mariaMigrate=migrateArmy;migrateArmy=function(s){const migrated={...s,missileBases:(s.missileBases||[]).filter(b=>b.tile!==MARIA_SEA_TILE)};const result=mariaMigrate(migrated);applyMariaSea();return result};
const campaignLoad=load;load=function(...args){return runCampaignLoading(()=>campaignLoad(...args))};
const campaignDraw=draw;draw=function(now){const result=campaignDraw(now);campaignRenderedFrames++;return result};
Object.assign(window.Terha,{setup,migrateArmy,load,applyMariaSea});
