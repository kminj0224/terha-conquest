'use strict';
// Shared capture eligibility keeps movement, landing and AI consistent with saved type IDs.
function canCaptureCityUnit(u){return !!u&&(u.type===0||[0,1,4,5].includes(TYPES[u.type]?.special))}
function cityDamageFloor(u){return ['artillery','navy'].includes(TYPES[u.type]?.branch)||isAircraft(u)||isHelicopter(u)||[5,23,24,25].includes(u.type)?1:0}
function usefulConventionalTarget(f,i){
 const u=unitAt(i),q=cityAt(i),b=baseAt(i);
 return !!(u&&u.hp>0&&atWar(f,u.f)&&!escortProtected(u)||q&&q.hp>1&&atWar(f,q.f)||b&&b.hp>0&&atWar(f,b.f));
}
const occupationCanProduce=canProduce;
canProduce=function(q,k,l=1){return !occupiedCity(q)&&occupationCanProduce(q,k,l)};
const rifleCapture=capture;
capture=function(u){if(!u||!canCaptureCityUnit(u)||u.carriedBy||u.hp<=0)return;return rifleCapture(u)};
const rifleMoveCost=moveCost;
moveCost=function(u,i){const q=cityAt(i);if(q&&q.f!==u.f&&!canCaptureCityUnit(u))return 99999;return rifleMoveCost(u,i)};
const rifleEntryTap=tap;
tap=function(sx,sy){
 if(started&&!busy&&!menuMode&&!airTarget&&!strategicTarget&&!coastBuildMode){
  const u=navalMode?.kind==='land'?units.find(v=>v.id===navalMode.unit):!navalMode&&selected?.kind==='unit'?units.find(v=>v.id===selected.id):null;
  const i=pickedNavalTile(sx,sy),q=i>=0?cityAt(i):null;
  if(u?.f===player&&!canCaptureCityUnit(u)&&q&&q.hp<=0&&atWar(u.f,q.f)&&!unitAt(i)){toast('소총수와 란나·백양·단테·낙월 특수유닛만 점령할 수 있습니다');return}
 }
 return rifleEntryTap(sx,sy);
};
const rifleLandingTiles=landingTiles;
landingTiles=function(ship,u){return rifleLandingTiles(ship,u).filter(i=>{const q=cityAt(i);return !q||q.f===u.f||canCaptureCityUnit(u)})};
const efficientAirEligibility=canAirStrike;
canAirStrike=function(q,type,i){
 if(q.f!==player&&type!=='transport'&&!usefulConventionalTarget(q.f,i))return false;
 return efficientAirEligibility(q,type,i);
};

function aiUnitAffordable(f,k,l=1,aa=false){return food[f]>=unitPrice(k,l)&&oil[f]>=unitOil(k,l)&&money[f]>=navGoldCost(k,l)+(aa?aaCost(l):0)}
function aiQueueUnit(f,target,k,l=1){
 if(!target||target.f!==f||target.queue||target.produced||target.nukeUntil>turn)return false;
 if(occupiedCity(target)){
  if(supplySource(target))return false;
  const sources=homelandSources(target).filter(q=>!q.queue&&!q.produced).sort((a,b)=>distance(a.tile,target.tile)-distance(b.tile,target.tile)||a.id-b.id);
  for(const source of sources)if(!supplyReason(target,source,k,l,false,true))return requestSupply(target,source,k,l,false,true);
  return false;
 }
 if(!canProduce(target,k,l)||!aiUnitAffordable(f,k,l))return false;
 food[f]-=unitPrice(k,l);oil[f]-=unitOil(k,l);money[f]-=navGoldCost(k,l);
 target.queue={type:k,level:l,aa:false};target.produced=true;return true;
}
function aiEnemyCities(f){return cities.filter(q=>atWar(f,q.f)&&!(q.nukeUntil>turn))}
function aiFrontDistance(q,fronts){return fronts.length?Math.min(...fronts.map(v=>distance(q.tile,v.tile))):Infinity}
function aiNeedsRifles(f,fronts=aiEnemyCities(f)){
 if(!fronts.length)return false;
 const troops=units.filter(u=>u.f===f&&canCaptureCityUnit(u)&&u.hp>0);
 if(!troops.length)return true;
 const forward=fronts.filter(q=>cities.some(home=>home.f===f&&distance(home.tile,q.tile)<=14)||units.some(u=>u.f===f&&!u.carriedBy&&distance(u.tile,q.tile)<=6));
 return forward.some(q=>!troops.some(u=>!u.carriedBy&&distance(u.tile,q.tile)<=8));
}
const aiRifleOrderTurn=Array(7).fill(-1);
const siegeAIProcure=aiProcure;
aiProcure=function(f,owned){
 if(f===player)return siegeAIProcure(f,owned);
 const fronts=aiEnemyCities(f),homes=owned.filter(q=>q.f===f&&!occupiedCity(q));
 const destinations=owned.filter(q=>q.f===f&&!(q.nukeUntil>turn)).sort((a,b)=>aiFrontDistance(a,fronts)-aiFrontDistance(b,fronts)||a.id-b.id);
 // Fund a capture-capable formation before elites, fleets and discretionary orders.
 if(aiRifleOrderTurn[f]!==turn&&aiNeedsRifles(f,fronts)){
  for(const q of destinations)if(aiQueueUnit(f,q,0,1)){aiRifleOrderTurn[f]=turn;break}
 }
 // Put reinforcements at occupied fronts through real, level-limited homeland queues.
 let remote=0;
 for(const q of destinations){
  if(!occupiedCity(q)||!fronts.length||remote>=2||aiFrontDistance(q,fronts)>18)continue;
  const rifles=units.filter(u=>u.f===f&&canCaptureCityUnit(u)&&!u.carriedBy&&distance(u.tile,q.tile)<=8).length;
  const pool=rifles<2?[0]:[9,10,1,15,0];
  if(pool.some(k=>aiQueueUnit(f,q,k,1)))remote++;
 }
 // Legacy procurement cannot put a local queue directly on a captured city.
 return siegeAIProcure(f,homes);
};

// True land path distances avoid sending riflemen into a shoreline or neutral border.
const captureRouteCache=new Map();let captureRouteStamp='';
function rifleRoute(f,goal){
 const stamp=turn+':'+cities.map(q=>q.f+'.'+(q.hp>0?1:0)).join(',');
 if(stamp!==captureRouteStamp){captureRouteStamp=stamp;captureRouteCache.clear()}
 const key=f+':'+goal.id;if(captureRouteCache.has(key))return captureRouteCache.get(key);
 const route=new Int32Array(tiles.length).fill(-1),open=[goal.tile];route[goal.tile]=0;
 for(let n=0;n<open.length;n++)for(const i of neighbors(open[n])){
  if(route[i]>=0||tiles[i].owner<0||tiles[i].owner!==f&&diplomacy[f]?.[tiles[i].owner]==='neutral')continue;
  const q=cityAt(i);if(q&&q.id!==goal.id&&(q.nukeUntil>turn||q.f!==f&&(q.hp>0||!atWar(f,q.f))))continue;
  route[i]=route[open[n]]+1;open.push(i);
 }
 captureRouteCache.set(key,route);return route;
}
function aiRifleGoal(u,targets){
 const goals=targets.filter(q=>atWar(u.f,q.f)&&!(q.nukeUntil>turn));if(!goals.length)return null;
 return goals.reduce((best,q)=>{
  const d=distance(u.tile,q.tile),support=units.filter(v=>v.f===u.f&&!v.carriedBy&&distance(v.tile,q.tile)<=5).length;
  const score=d+(q.hp>0?2*q.hp/cityMaxHp(q):-5)-Math.min(2,support*.2);
  return !best||score<best.score?{q,score}:best;
 },null).q;
}
const siegeAIStep=aiStep;
aiStep=function(u,targets){
 if(u.f===player||u.carriedBy||u.hp<=0)return siegeAIStep(u,targets);
 if(canCaptureCityUnit(u)){
  const at=cityAt(u.tile);if(at&&atWar(u.f,at.f)&&at.hp<=0)capture(u);
  const reachableTiles=reachable(u).costs;
  const breach=targets.filter(q=>atWar(u.f,q.f)&&q.hp<=0&&!(q.nukeUntil>turn)&&!unitAt(q.tile)&&reachableTiles.has(q.tile)).sort((a,b)=>distance(u.tile,a.tile)-distance(u.tile,b.tile))[0];
  if(breach)return {move:breach.tile};
  const goal=aiRifleGoal(u,targets);
  if(goal){
   if(!unitAt(goal.tile)&&canAttackCity(u,goal)&&goal.hp<=siegeDamage(u,goal))return {city:goal};
   if(units.some(v=>canAttack(u,v)))return siegeAIStep(u,targets);
   if(canAttackCity(u,goal))return {city:goal};
   const route=rifleRoute(u.f,goal),before=route[u.tile];
   if(before>=0){
    let tile=u.tile,score=before;
    for(const [i,cost]of reachableTiles)if(route[i]>=0&&route[i]+cost*.001<score){tile=i;score=route[i]+cost*.001}
    if(tile!==u.tile)return {move:tile};
   }else{
    // Retain the existing transport/landing AI for fronts on another landmass.
    const objective=aiObjectives[u.f];aiObjectives[u.f]=goal;
    try{return siegeAIStep(u,targets)}finally{aiObjectives[u.f]=objective}
   }
  }
 }
 const useful=cityDamageFloor(u)?targets.filter(q=>q.hp>1||!atWar(u.f,q.f)):targets;
 const action=siegeAIStep(u,useful);
 if(action?.city&&cityDamageFloor(u)&&action.city.hp<=1)return null;
 return action;
};
const rifleTransportCandidate=transportCandidate;
transportCandidate=function(u){
 if(canCaptureCityUnit(u)&&!u.carriedBy&&mayMove(u)&&!hasAttackTarget(u)){
  const goal=aiObjectives[u.f];
  if(goal&&atWar(u.f,goal.f)&&rifleRoute(u.f,goal)[u.tile]<0)return true;
 }
 return rifleTransportCandidate(u);
};
async function aiStrategicOperations(f,owned){
 const model=MISSILE_MODELS.short;if(!strategicResearch[f].ballistic)return 0;
 let fired=0;
 for(const q of owned){
  if(fired>=2||q.f!==f||q.level<4||q.nukeUntil>turn)continue;
  if(!q.launcher&&q.lab&&money[f]>=FACILITIES.launcher.cost+model.gold+aiUpgradeReserve(f,owned)&&oil[f]>=model.oil){money[f]-=FACILITIES.launcher.cost;q.launcher=true}
  if(!q.launcher)continue;
  const sites=new Set([...units.filter(u=>u.hp>0&&!u.carriedBy&&atWar(f,u.f)).map(u=>u.tile),...aiEnemyCities(f).filter(v=>v.hp>1).map(v=>v.tile),...missileBases.filter(b=>b.hp>0&&atWar(f,b.f)).map(b=>b.tile)]);
  const targets=[...sites].filter(i=>usefulConventionalTarget(f,i)&&missileCanFire(q,'missile',i,true));
  targets.sort((a,b)=>{
   const score=i=>{const city=cityAt(i),u=unitAt(i);return (u?Math.min(u.hp,model.damage*.08):0)+(city?Math.min(Math.max(0,city.hp-1),model.damage)*(units.some(v=>v.f===f&&canCaptureCityUnit(v)&&distance(v.tile,i)<=8)?1:.25):0)};
   return score(b)-score(a);
  });
  if(targets.length&&await launchStrategic(q,'missile',targets[0],true))fired++;
 }
 return fired;
}

// Paid pre-update AI local orders are routed through a homeland source or refunded once.
const siegeMigration=migrateArmy;
migrateArmy=function(s){
 const legacy=[];
 for(const q of s.cities||[])if(occupiedCity(q)&&q.queue&&q.queue.transportTo===undefined){legacy.push({id:q.id,order:q.queue});q.queue=null}
 const result=siegeMigration(s);aiRifleOrderTurn.fill(-1);captureRouteCache.clear();captureRouteStamp='';
 for(const {id,order}of legacy){
  const target=cities.find(q=>q.id===id);if(!target||!TYPES[order.type])continue;
  const source=!(target.nukeUntil>turn)&&homelandSources(target).find(q=>!q.queue&&canProduce(q,order.type,order.level||1)&&(!isNaval({type:order.type})||target.harbor)&&(supplyLandConnected(q,target)||supplySeaAccess(target)));
  if(source){source.queue={...order,level:order.level||1,transportTo:target.id,owner:target.f,sourceName:source.name,total:2,remaining:2,lastTick:turn};source.produced=true}
  else {food[target.f]+=unitPrice(order.type,order.level||1);oil[target.f]+=unitOil(order.type,order.level||1);money[target.f]+=navGoldCost(order.type,order.level||1)+(order.aa?aaCost(order.level||1):0)}
 }
 return result;
};
Object.assign(window.Terha,{canCaptureCityUnit,cityDamageFloor,usefulConventionalTarget,canProduce,capture,moveCost,tap,landingTiles,canAirStrike,
 aiQueueUnit,aiNeedsRifles,aiProcure,aiStep,transportCandidate,rifleRoute,aiRifleGoal,aiStrategicOperations,migrateArmy});
