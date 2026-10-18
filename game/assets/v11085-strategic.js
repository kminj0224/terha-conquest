'use strict';
// v1.10.85: city-local science queues and typed strategic weapons.
// Numeric weapon values can be adjusted here without rewriting the UI.
const MISSILE_MODELS={
 short:{name:'단거리 탄도미사일',range:12,gold:900,oil:10,damage:4000},
 medium:{name:'중거리 탄도미사일',range:24,gold:1600,oil:15,damage:6000},
 long:{name:'장거리 탄도미사일',range:45,gold:3000,oil:25,damage:10000},
 icbm:{name:'대륙간탄도미사일',range:80,gold:6000,oil:45,damage:16000}
};
const NUCLEAR_WARHEADS={
 atomic:{name:'원자폭탄',gold:12000,oil:35,turns:5,radius:4,damage:'기존 핵 공격: 최대 내구도 90% + 1,200',control:3},
 hydrogen:{name:'수소폭탄',gold:24000,oil:70,turns:6,radius:6,damage:'최대 내구도 100% + 3,000',control:4}
};
let armedMissile=null,armedBomber=null,activeNuclearImpact=null;
function warheadStock(q){
 if(!q.nukeTypes||typeof q.nukeTypes!=='object'){
  q.nukeTypes={atomic:Math.max(0,Math.floor(q.nukes||0)),hydrogen:0};
 }
 q.nukeTypes.atomic=Math.max(0,Math.floor(q.nukeTypes.atomic||0));
 q.nukeTypes.hydrogen=Math.max(0,Math.floor(q.nukeTypes.hydrogen||0));
 return q.nukeTypes;
}
function syncWarheads(q){const stock=warheadStock(q);q.nukes=stock.atomic+stock.hydrogen;return stock}
function localResearchJob(q){
 const national=militaryResearchJobs[q.f];
 if(national?.city===q.id)return {key:'military',remaining:national.remaining,total:2};
 if(q.fuelResearchJob)return{key:'fuel',remaining:q.fuelResearchJob.remaining,total:FUEL_RESEARCH_TURNS};
 const job=researchJobs(strategicResearch[q.f]).find(j=>j.city===q.id);
 return job?{key:job.key,remaining:job.remaining,total:job.total}:null;
}
const strategicStudyReason=studyReason;
studyReason=function(q,key){
 if(militaryResearchJobs[q.f]?.city===q.id)return'이 도시에서 군사 연구가 진행 중입니다.';
 if(q.fuelResearchJob)return'이 도시에서 연비 개선 연구가 진행 중입니다.';
 return strategicStudyReason(q,key);
};
const researchFuelReason=fuelResearchReason;
fuelResearchReason=function(q){
 if(militaryResearchJobs[q.f]?.city===q.id)return'이 도시에서 군사 연구가 진행 중입니다.';
 return researchFuelReason(q);
};
const cityMilitaryResearch=research;
research=function(){
 const q=selected?.kind==='city'?cities[selected.id]:null;
 if(!q||q.f!==player)return false;
 if(localResearchJob(q))return false;
 const result=cityMilitaryResearch();
 if(result&&militaryResearchJobs[player])militaryResearchJobs[player].city=q.id;
 if(result){showPanel();save()}
 return result;
};
const inheritedResearchMigration=migrateArmy;
migrateArmy=function(s){
 const result=inheritedResearchMigration(s);
 for(let f=0;f<7;f++){
  const job=militaryResearchJobs[f];
  if(job&&!Number.isInteger(job.city))job.city=cities.find(q=>q.f===f&&q.capital)?.id??cities.find(q=>q.f===f)?.id??-1;
 }
 for(const q of cities)syncWarheads(q);
 return result;
};
const originalWarheadSetup=setup;
setup=function(...args){
 const result=originalWarheadSetup(...args);
 for(const q of cities){q.nukeTypes={atomic:Math.max(0,q.nukes||0),hydrogen:0};syncWarheads(q)}
 armedMissile=null;armedBomber=null;
 return result;
};
const typedWarheadIndustryTurn=industryTurn;
industryTurn=async function(...args){
 const finishing=cities.filter(q=>q.nuclearJob&&q.nuclearJob.remaining<=1).map(q=>({id:q.id,kind:q.nuclearJob.kind||'atomic'}));
 await typedWarheadIndustryTurn(...args);
 for(const {id,kind}of finishing){
  const q=cities.find(q=>q.id===id);
  if(!q||q.nuclearJob)continue;
  const stock=warheadStock(q);
  stock[kind]=(stock[kind]||0)+1;
 }
 for(const q of cities)syncWarheads(q);
};
fabricateNuke=function(q,kind='atomic'){
 const d=NUCLEAR_WARHEADS[kind];
 if(!d||busy||q.f!==player||q.nukeUntil>turn||!strategicResearch[q.f].nuclear||q.nuclearJob||money[q.f]<d.gold||oil[q.f]<d.oil)return false;
 money[q.f]-=d.gold;oil[q.f]-=d.oil;
 q.nuclearJob={kind,remaining:d.turns,total:d.turns,startedTurn:turn};
 showPanel();updateHUD();save();return true;
};
const oldCaptureWithWarheads=capture;
capture=function(u){const q=cityAt(u.tile),old=q?.f;const result=oldCaptureWithWarheads(u);if(q&&q.f!==old){q.nukeTypes={atomic:0,hydrogen:0};syncWarheads(q)}return result};
const originalNuclearArea=nuclearTiles;
nuclearTiles=function(i){
 if(activeNuclearImpact!=='hydrogen')return originalNuclearArea(i);
 const center=tiles[i];return tiles.map((t,j)=>Math.abs(t.x-center.x)+Math.abs(t.y-center.y)<=NUCLEAR_WARHEADS.hydrogen.radius?j:-1).filter(j=>j>=0);
};
const previousNuclearImpact=nuclearImpact;
nuclearImpact=function(i,air=false){
 const isHydrogen=activeNuclearImpact==='hydrogen';
 const affected=isHydrogen?new Set(nuclearTiles(i)):null;
 const remaining=isHydrogen?units.filter(u=>!u.carriedBy&&!escortProtected(u)&&affected.has(u.tile)).map(u=>({id:u.id,bonus:Math.round(unitMaxHp(u)*.1+1800)})):[];
 const result=previousNuclearImpact(i,air);
 if(isHydrogen){
  for(const {id,bonus}of remaining){const u=units.find(v=>v.id===id);if(u){u.hp-=bonus;if(u.hp<=0)kill(u)}}
  for(const q of cities)if(affected.has(q.tile))q.nukeUntil=Math.max(q.nukeUntil,turn+NUCLEAR_WARHEADS.hydrogen.control);
 }
 for(const q of cities)if(q.nukes===0&&q.nukeTypes)q.nukeTypes={atomic:0,hydrogen:0};
 return result;
};
const previousEscorts=protectingEscorts;
protectingEscorts=function(u){
 if(u?.type===25){
  return units.filter(v=>v.type===23&&!v.carriedBy&&v.f===u.f&&v.hp>0&&distance(v.tile,u.tile)<=9);
 }
 return previousEscorts(u);
};
function selectedStrategicPayload(q,bomber=false){
 const a=bomber?armedBomber:armedMissile;
 return a?.city===q.id?a.payload:null;
}
function missileCanFire(q,kind,i){
 const bomber=kind==='nuclearBomber',model=MISSILE_MODELS[strategicTarget?.city===q.id?strategicTarget.missileKey:'short']||MISSILE_MODELS.short;
 const target=unitAt(i),city=cityAt(i),base=baseAt(i);
 const enemy=[target,city,base].some(v=>v&&atWar(q.f,v.f))||(tiles[i]?.owner>=0&&atWar(q.f,tiles[i].owner));
 if(!enemy||q.f!==player||q.nukeUntil>turn||busy||escortProtected(target))return false;
 const warhead=strategicTarget?.city===q.id?strategicTarget.payload:null;
 if(warhead&&(!NUCLEAR_WARHEADS[warhead]||!strategicResearch[q.f].nuclear||warheadStock(q)[warhead]<1))return false;
 if(kind!=='missile'&& !warhead)return false;
 if(bomber)return q.level===5&&q.airport&&!!strategicBomber(q)&&distance(q.tile,i)<=30&&oil[q.f]>=18&&money[q.f]>=600;
 return q.level>=4&&q.launcher&&strategicResearch[q.f].ballistic&&q.lastMissileTurn!==turn&&distance(q.tile,i)<=model.range&&money[q.f]>=model.gold&&oil[q.f]>=model.oil;
}
canStrategic=function(q,kind,i){return missileCanFire(q,kind,i)};
function prepareStrategicLaunch(q,modelKey='short',payload=null,bomber=false){
 if(busy||q.f!==player)return false;
 const key=MISSILE_MODELS[modelKey]?modelKey:'short';
 if(payload&&!warheadStock(q)[payload])return false;
 selected={kind:'city',id:q.id};panelOpen=false;airTarget=null;reach.clear();
 strategicTarget={city:q.id,kind:bomber?'nuclearBomber':payload?'nuclearMissile':'missile',missileKey:key,payload};
 refreshSelection();return true;
}
selectStrategic=function(q,kind){return prepareStrategicLaunch(q,'short',kind==='missile'?null:'atomic',kind==='nuclearBomber')};
launchStrategic=async function(q,kind,i){
 if(!missileCanFire(q,kind,i))return false;
 const target=strategicTarget?.city===q.id?{...strategicTarget}:{missileKey:'short',payload:null};
 const bomber=kind==='nuclearBomber',model=MISSILE_MODELS[target.missileKey]||MISSILE_MODELS.short;
 const payload=target.payload,nuclear=!!payload;
 money[q.f]-=bomber?600:model.gold;oil[q.f]-=bomber?18:model.oil;
 if(nuclear){warheadStock(q)[payload]--;syncWarheads(q)}
 if(bomber)q.airTurn=turn;else q.lastMissileTurn=turn;
 busy=true;strategicTarget=null;refreshSelection();updateHUD();
 const a=pxy(q.tile),b=pxy(i);
 addAirRaid({kind:bomber?'airraid':'missile',x:a.x,y:a.y,tx:b.x,ty:b.y,f:q.f,type:'bomber',start:performance.now(),duration:bomber?2800:1000});
 audioShot(3);await delay(bomber?1568:700);
 cam.x=b.x;cam.y=b.y;cam.z=Math.max(.85,cam.z);
 if(nuclear){activeNuclearImpact=payload;try{nuclearImpact(i,bomber)}finally{activeNuclearImpact=null}}
 else {
  const u=unitAt(i),city=cityAt(i),facility=baseAt(i);
  if(facility&&atWar(q.f,facility.f)){facility.hp-=model.damage;if(facility.hp<=0)missileBases=missileBases.filter(v=>v!==facility)}
  let unitDamage=0;
  if(u&&atWar(q.f,u.f)){unitDamage=escortProtected(u)?0:Math.round(model.damage*.08*(city?.f===u.f?.7:1));u.hp-=unitDamage;if(u.hp<=0)kill(u)}
  const cityDamage=city&&atWar(q.f,city.f)?model.damage:0;
  if(cityDamage)damageCity(city,cityDamage);
  targetExplosions({type:3},b,cityDamage||unitDamage||model.damage);
 }
 log(q.name+' · '+(nuclear?NUCLEAR_WARHEADS[payload].name:model.name)+' 발사');
 busy=false;refreshSelection();updateHUD();save();checkEnd();return true;
};
Object.assign(window.Terha,{MISSILE_MODELS,NUCLEAR_WARHEADS,warheadStock,syncWarheads,prepareStrategicLaunch,
 localResearchJob,studyReason,fuelResearchReason,research,setup,migrateArmy,industryTurn,nuclearImpact,nuclearTiles,
 protectingEscorts,canStrategic,selectStrategic,launchStrategic,fabricateNuke});
