'use strict';
// Append IDs: campaigns saved before this release retain all existing type IDs.
const DEKPHUING_GUERRILLA=TYPES.length;
TYPES.push({name:'덱푸잉 게릴라',cost:30,hp:90,atk:14,range:1,move:3,def:0,
 branch:'infantry',special:4,icon:'×',
 text:'란나 특수 보병. 산·숲·강 타일에서 공격력 ×5, 받는 공격 피해 75% 감소. 해당 지형의 이동력 감소를 무시합니다. 생산 식량 30, 골드·석유 소모 없음.'});
UNIT_STORIES[DEKPHUING_GUERRILLA]='덱푸잉 게릴라는 란나의 산길과 숲, 강줄기를 따라 움직입니다. 가벼운 장비를 멘 대원들은 골짜기의 샛길과 물을 건널 여울을 기억합니다.';
const RANNA_RIVER_TILES=new Set(RIVER_NETWORK.reaches.flatMap(reach=>reach.nodes));
function isDekphuingGuerrilla(u){return u?.type===DEKPHUING_GUERRILLA}
function guerrillaTerrain(u){const t=tiles[u?.tile];return !!t&&!u.carriedBy&&t.owner>=0&&(t.terrain===2||t.terrain===3||RANNA_RIVER_TILES.has(u.tile))}
function rannaTerrainProtection(u){return isDekphuingGuerrilla(u)&&guerrillaTerrain(u) ? .25 : 1}
const guerrillaUnitAttack=unitAttack;
unitAttack=function(u){return guerrillaUnitAttack(u)*(isDekphuingGuerrilla(u)&&guerrillaTerrain(u)?5:1)};
const guerrillaDamage=damage;
damage=function(u,v){const d=guerrillaDamage(u,v);return Math.round(d*(isAircraft(u)||isHelicopter(u)?1:rannaTerrainProtection(v)))};
const guerrillaBombProtection=bombProtection;
bombProtection=function(u,q){return guerrillaBombProtection(u,q)*rannaTerrainProtection(u)};
const guerrillaMoveCost=moveCost;
moveCost=function(u,i){const cost=guerrillaMoveCost(u,i),t=tiles[i];
 // Keep water, hostile defenses and other impassable destinations blocked.
 return isDekphuingGuerrilla(u)&&t?.owner>=0&&cost<999&&(t.terrain===2||t.terrain===3||RANNA_RIVER_TILES.has(i))?1:cost;
};

// Reuse the existing Ranna rifle art and its matching muzzle coordinates.
RANNA_INFANTRY_PROFILES[DEKPHUING_GUERRILLA]=RANNA_INFANTRY_PROFILES[0];
// Scale bodies and muzzle origins together, anchored at the soldiers' feet.
for(const [key,profile]of Object.entries(BAEK_ART_PROFILES)){
 if(Number(key)===10)continue;
 profile.width=(profile.width||BAEK_RIFLE_WIDTH)*1.1;
 profile.height=(profile.height||BAEK_RIFLE_HEIGHT)*1.1;
 profile.muzzles=profile.muzzles.map(m=>({x:m.x*1.1,y:14+(m.y-14)*1.1}));
}
// Share only artwork for matching classes; nation IDs and combat bonuses stay intact.
const sielunInfantryProfile=infantryArtProfile;
infantryArtProfile=function(u){return u.f===6&&STETOPIA_INFANTRY_PROFILES[u.type]||sielunInfantryProfile(u)};
const sielunTankCheck=isStetopiaTank;
isStetopiaTank=function(u){return u.f===6&&!!STETOPIA_TANK_PROFILES[u.type]||sielunTankCheck(u)};
const sielunArtilleryCheck=isBaekArtillery,sielunArtilleryProfile=baekArtilleryProfile;
isBaekArtillery=function(u){return u.f===6&&[2,3].includes(u.type)||sielunArtilleryCheck(u)};
baekArtilleryProfile=function(u,firing=false){return sielunArtilleryProfile(u.f===6?{...u,f:2}:u,firing)};
TOWED_ART[6]=TOWED_ART[2];
const sielunCarrierCheck=isStetopiaCarrier;
isStetopiaCarrier=function(u){return u.f===6&&u.type===25||sielunCarrierCheck(u)};

const rannaInitialDiplomacy=initialDiplomacy;
initialDiplomacy=function(){const relations=rannaInitialDiplomacy();relations[4][5]=relations[5][4]='war';return relations};
diplomacy=initialDiplomacy();
function seedRannaGuerrillas(){
 const candidates=tiles.map((t,i)=>({t,i})).filter(({t,i})=>t.owner===4&&[2,3].includes(t.terrain)&&t.city<0&&!unitAt(i));
 const target=Math.min(32,Math.ceil(candidates.length*.25)),groups=new Map(),chosen=[];
 for(const {t,i}of candidates){if(!groups.has(t.region))groups.set(t.region,[]);groups.get(t.region).push(i)}
 for(const list of groups.values())list.sort((a,b)=>mixSeed(a*1717)-mixSeed(b*1717)||a-b);
 for(const gap of [3,2,1]){
  let added=true;
  while(chosen.length<target&&added){added=false;for(const list of groups.values()){
   const n=list.findIndex(i=>!unitAt(i)&&chosen.every(j=>distance(i,j)>=gap));
   if(n<0)continue;const i=list.splice(n,1)[0];const u=makeUnit(4,DEKPHUING_GUERRILLA,i,1);u.rannaGuerrillaInitial=true;chosen.push(i);added=true;
   if(chosen.length===target)break;
  }}
 }
 return chosen;
}
const guerrillaSetup=setup;
setup=function(){const result=guerrillaSetup();seedRannaGuerrillas();faceInitialArmy();reach.clear();save();updateHUD();refreshSelection();return result};
// Give the AI the same capital recruitment opportunity as the other special units.
const guerrillaAIProcure=aiProcure;
aiProcure=function(f,owned){
 if(f===4&&(turn+f)%aiBalance().specialPeriod===0&&cities.some(q=>atWar(f,q.f))){
  const q=owned.find(q=>q.f===f&&!q.queue&&!q.produced&&canProduce(q,DEKPHUING_GUERRILLA,1));
  if(q&&food[f]>=unitPrice(DEKPHUING_GUERRILLA,1)){food[f]-=unitPrice(DEKPHUING_GUERRILLA,1);q.queue={type:DEKPHUING_GUERRILLA,level:1,aa:false};q.produced=true}
 }
 return guerrillaAIProcure(f,owned);
};
Object.assign(window.Terha,{setup,unitAttack,damage,moveCost,bombProtection,initialDiplomacy,aiProcure,
 DEKPHUING_GUERRILLA,isDekphuingGuerrilla,guerrillaTerrain,rannaTerrainProtection,seedRannaGuerrillas,
 infantryArtProfile,isStetopiaTank,isBaekArtillery,baekArtilleryProfile,isStetopiaCarrier});
