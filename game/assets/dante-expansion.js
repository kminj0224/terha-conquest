'use strict';
function danteAIActive(){return player!==1}
const danteBaseIncome=income,danteBaseFoodIncome=foodIncome,danteBaseOilIncome=oilIncome;
income=function(f){return danteBaseIncome(f)*(f===1&&danteAIActive()?5:1)};
foodIncome=function(f){return danteBaseFoodIncome(f)*(f===1&&danteAIActive()?5:1)};
oilIncome=function(f){return danteBaseOilIncome(f)*(f===1&&danteAIActive()?5:1)};
const expansionCanProduce=canProduce;canProduce=function(q,k,level=1){if(q.f===1&&danteAIActive()&&k===25&&units.filter(u=>u.f===1&&u.type===25&&u.hp>0).length+cities.filter(c=>c.f===1&&c.queue?.type===25).length>=2)return false;return expansionCanProduce(q,k,level)};
let danteExpansionSeeded=false,danteExpansionPlan=null;
const danteOriginalFrontPlan=buildDanteFrontPlan;
function buildDanteExpansionPlan(){
 const own=cities.filter(q=>q.f===1),capital=own.find(q=>q.capital)||own[0];if(!capital)return danteExpansionPlan=null;
 const cp=pxy(capital.tile),ports=own.filter(q=>q.harbor&&q.nukeUntil<=turn),enemies=cities.filter(q=>atWar(1,q.f)),land=danteLandMap(),definitions=[['west',0,false],['east',1,false],['north',2,true],['south',3,true]];
 const fronts=[];
 for(const [name,side,naval]of definitions){const choices=naval?(ports.length?ports:own):own;
  const anchor=choices.slice().sort((a,b)=>{const p=pxy(a.tile),q=pxy(b.tile);return name==='west'?p.x-q.x:name==='east'?q.x-p.x:name==='north'?p.y-q.y:q.y-p.y})[0];
  let targets=enemies.filter(q=>{const p=pxy(q.tile);return naval?(name==='north'?p.y<cp.y:p.y>=cp.y):land[q.tile]===land[capital.tile]&&(name==='west'?p.x<cp.x:p.x>=cp.x)});
  if(!targets.length)targets=enemies.filter(q=>naval||land[q.tile]===land[capital.tile]);if(!targets.length)continue;
  const goal=targets.reduce((a,b)=>distance(anchor.tile,a.tile)<=distance(anchor.tile,b.tile)?a:b),enemy=units.filter(u=>!u.carriedBy&&u.hp>0&&atWar(1,u.f)&&distance(u.tile,anchor.tile)<=8).reduce((n,u)=>n+danteForceWeight(u),0);
  fronts.push({name,side,naval,anchor,goal,targets,enemy,supply:0,share:naval?.2:.3});
 }
 const assignments=new Map(),army=units.filter(u=>u.f===1&&u.hp>0&&!u.carriedBy&&!isNaval(u)).sort((a,b)=>Number(!!a.danteReserve)-Number(!!b.danteReserve)||a.id-b.id);
 for(const u of army){let front=u.danteReserve?fronts.slice().sort((a,b)=>(a.supply/a.share+distance(u.tile,a.anchor.tile)*.8)-(b.supply/b.share+distance(u.tile,b.anchor.tile)*.8))[0]:fronts.find(f=>f.name===u.danteFront);if(u.danteReserve&&front)u.danteFront=front.name;if(!front){front=fronts.slice().sort((a,b)=>distance(u.tile,a.anchor.tile)-distance(u.tile,b.anchor.tile)||(a.supply/a.share-b.supply/b.share))[0];if(front)u.danteFront=front.name}if(front){assignments.set(u.id,front);front.supply+=danteForceWeight(u)}}
 const total=fronts.reduce((n,f)=>n+f.share*(20+f.enemy),0);for(const f of fronts)f.share=f.share*(20+f.enemy)/Math.max(1,total);
 return danteExpansionPlan={fronts,assignments,turn,capital};
}
buildDanteFrontPlan=function(){if(!danteAIActive())return danteOriginalFrontPlan();const p=buildDanteExpansionPlan();danteFrontPlan=p;return p};
function expansionPlan(){return !danteExpansionPlan||danteExpansionPlan.turn!==turn?buildDanteExpansionPlan():danteExpansionPlan}
function danteAssignedFront(u){const p=expansionPlan();if(!p)return null;let f=p.fronts.find(f=>f.name===u.danteFront);if(!f){const naval=p.fronts.filter(f=>f.naval),pool=isNaval(u)?naval:p.fronts;f=pool.slice().sort((a,b)=>distance(u.tile,a.anchor.tile)-distance(u.tile,b.anchor.tile))[0];if(f)u.danteFront=f.name}return f}
const expansionObjective=danteUnitObjective;danteUnitObjective=function(u){if(!danteAIActive())return expansionObjective(u);const f=danteAssignedFront(u);if(!f)return aiObjectives[1];const targets=f.targets.filter(q=>atWar(1,q.f));return targets.length?targets.reduce((a,b)=>distance(u.tile,a.tile)<=distance(u.tile,b.tile)?a:b):aiObjectives[1]};
const expansionCandidate=transportCandidate;transportCandidate=function(u){if(u.f!==1||!danteAIActive())return expansionCandidate(u);const f=danteAssignedFront(u);return !!(f?.naval&&!u.danteLanded&&infantryForTransport(u)&&mayMove(u)&&tiles[u.tile].owner===1&&!hasAttackTarget(u))};
let dantePortBerths=new Map(),danteCoastalCells=null;
function dantePortSea(q){if(dantePortBerths.has(q.tile))return dantePortBerths.get(q.tile);const list=tiles.map((t,i)=>t.owner<0&&distance(i,q.tile)<=3?i:-1).filter(i=>i>=0);dantePortBerths.set(q.tile,list);return list}
function danteCoasts(){if(!danteCoastalCells)danteCoastalCells=tiles.map((t,i)=>t.owner>=0&&neighbors(i).some(j=>tiles[j].owner<0)?i:-1).filter(i=>i>=0);return danteCoastalCells}
function danteLoadingSea(front,ship){const comp=aiSeaComponents(),ports=cities.filter(q=>q.f===1&&q.harbor).sort((a,b)=>distance(a.tile,front.anchor.tile)-distance(b.tile,front.anchor.tile));for(const q of ports){let best=-1,d=Infinity;for(const i of dantePortSea(q))if(comp.ids[i]===comp.ids[ship.tile]&&(!unitAt(i)||unitAt(i).id===ship.id)){const score=distance(i,ship.tile);if(score<d){best=i;d=score}}if(best>=0)return best}return -1}
const expansionLanding=transportLanding;transportLanding=function(ship){if(ship.f!==1||!danteAIActive())return expansionLanding(ship);const cached=transportLandings.get(ship.id);if(cached&&atWar(1,tiles[cached.land].owner)&&!unitAt(cached.land)&&!baseAt(cached.land))return cached;
 const front=danteAssignedFront(ship);if(!front)return expansionLanding(ship);const comp=aiSeaComponents(),component=comp.ids[ship.tile],cp=pxy(expansionPlan().capital.tile);let best=null,score=Infinity;
 for(const i of danteCoasts()){if(tiles[i].owner<0||!atWar(1,tiles[i].owner)||unitAt(i)||baseAt(i))continue;const city=cityAt(i);if(city&&(city.hp>0||city.nukeUntil>turn))continue;const p=pxy(i);if(front.name==='north'?p.y>=cp.y:p.y<cp.y)continue;
  const seas=neighbors(i).filter(j=>tiles[j].owner<0&&comp.ids[j]===component&&(!unitAt(j)||unitAt(j).id===ship.id));if(!seas.length)continue;
  const spread=[...transportLandings.values()].filter(g=>distance(g.land,i)<=2).length,value=distance(ship.tile,i)+distance(i,front.goal.tile)*.8+spread*5;if(value<score){score=value;best={land:i,sea:seas.sort((a,b)=>distance(ship.tile,a)-distance(ship.tile,b))[0]}}
 }if(best)transportLandings.set(ship.id,best);return best;
};
function danteShipOperation(ship){const front=danteAssignedFront(ship);if(!front)return aiShipOperation(ship);
 if(!cargoUnits(ship).length){const candidates=units.filter(u=>u.f===1&&u.danteFront===front.name&&transportCandidate(u)&&boardableShips(u).includes(ship)).sort((a,b)=>distance(a.tile,ship.tile)-distance(b.tile,ship.tile));for(const u of candidates){if(cargoUnits(ship).length>=20)break;boardUnit(u,ship,true)}}
 if(cargoUnits(ship).length){const goal=transportLanding(ship);if(!goal)return null;for(const u of cargoUnits(ship).slice()){const sites=landingTiles(ship,u).filter(i=>atWar(1,tiles[i].owner)).sort((a,b)=>distance(a,goal.land)-distance(b,goal.land));if(sites.length)landUnit(ship,u,sites[0],true)}if(cargoUnits(ship).length)return transportSail(ship,goal.sea)}
 const berth=danteLoadingSea(front,ship);return berth>=0?transportSail(ship,berth):null;
}
const expansionLandUnit=landUnit;landUnit=function(ship,u,i,ai=false){const enemy=atWar(u.f,tiles[i]?.owner);const ok=expansionLandUnit(ship,u,i,ai);if(ok&&ai&&u.f===1&&danteAIActive()&&enemy)u.danteLanded=true;return ok};
const expansionAIStep=aiStep;aiStep=function(u,targets){if(u.f!==1||!danteAIActive())return expansionAIStep(u,targets);if(u.carriedBy)return null;if(u.type===26)return danteShipOperation(u);
 const front=danteAssignedFront(u);if(!front)return expansionAIStep(u,targets);
 if(isNaval(u)&&!hasAttackTarget(u)){const convoy=units.filter(s=>s.f===1&&s.type===26&&s.danteFront===front.name&&cargoUnits(s).length).sort((a,b)=>distance(a.tile,u.tile)-distance(b.tile,u.tile))[0];if(convoy){const r=reachable(u).costs;let best=u.tile,d=distance(u.tile,convoy.tile);if(d<=2)return null;for(const i of r.keys())if(distance(i,convoy.tile)<d){best=i;d=distance(i,convoy.tile)}if(best!==u.tile)return{move:best}}}
 return expansionAIStep(u,front.targets.filter(q=>atWar(1,q.f)));
};
const expansionPrepare=prepareAITransports;prepareAITransports=function(f,owned){const already=aiTransportGrantTurn[f]===turn;expansionPrepare(f,owned);if(f!==1||!danteAIActive()||already)return;const plan=expansionPlan();if(!plan)return;const used=new Set(units.filter(u=>!u.carriedBy).map(u=>u.tile)),comp=aiSeaComponents();for(const front of plan.fronts.filter(f=>f.naval)){let count=units.filter(u=>u.f===1&&u.type===26&&danteAssignedFront(u)?.name===front.name).length;for(let n=0;n<2&&count<12;n++){const site=tiles.findIndex((t,i)=>t.owner<0&&!used.has(i)&&distance(i,front.anchor.tile)<=4&&comp.sizes[comp.ids[i]]>100);if(site<0)break;const ship=makeUnit(1,26,site,1);ship.danteFront=front.name;used.add(site);count++}}};
// Reserve north/south harbour queues before the existing shared heavy-unit procurement.
const expansionProcure=aiProcure;aiProcure=function(f,owned){if(f!==1||!danteAIActive())return expansionProcure(f,owned);const p=expansionPlan();if(p){for(const front of p.fronts.filter(f=>f.naval)){const port=front.anchor;while(port.harbor&&port.nukeUntil<=turn&&port.level<3&&money[f]>=UPGRADE_COSTS[port.level]+1000){const oldMax=cityMaxHp(port);money[f]-=UPGRADE_COSTS[port.level];port.level++;port.hp+=cityMaxHp(port)-oldMax;cityProfile(port)}const transportCount=units.filter(u=>u.f===1&&u.type===26&&danteAssignedFront(u)?.name===front.name).length;const candidates=owned.filter(q=>q.harbor&&!q.queue&&!q.produced&&q.nukeUntil<=turn).sort((a,b)=>distance(a.tile,front.anchor.tile)-distance(b.tile,front.anchor.tile));let orders=0;
  for(const q of candidates){if(orders>=3)break;const pool=orders===0?(transportCount<14?[26,23,0]:[23,24,0]):[0,10,9,13,1,2];const k=pool.find(k=>canProduce(q,k,1)&&food[f]>=unitPrice(k,1)&&money[f]>=navGoldCost(k,1));if(k===undefined)continue;food[f]-=unitPrice(k,1);money[f]-=navGoldCost(k,1);q.queue={type:k,level:1,aa:false,danteFront:front.name};q.produced=true;orders++}
 }}const reserve=Math.min(12000,Math.floor(food[f]*.35));food[f]-=reserve;try{return expansionProcure(f,owned)}finally{food[f]+=reserve}};
const expansionDeploy=deploy;deploy=function(q){const role=q.queue?.danteFront,before=uid;const result=expansionDeploy(q);if(role)for(const u of units)if(u.id>=before&&u.f===1)u.danteFront=role;return result};
function seedDanteExpansion(){if(danteExpansionSeeded)return;danteExpansionSeeded=true;const own=tiles.map((t,i)=>t.owner===1?i:-1).filter(i=>i>=0),occupied=new Set(units.filter(u=>!u.carriedBy).map(u=>u.tile));for(const b of missileBases)occupied.add(b.tile);if(!own.length)return;
 const xs=own.map(i=>tiles[i].x),ys=own.map(i=>tiles[i].y),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,spawned=[],types=[0,10,9,8,13,1,2,3,16,14];
 const regions=[['north',i=>tiles[i].y],['south',i=>-tiles[i].y],['west',i=>tiles[i].x],['east',i=>-tiles[i].x],['center',i=>Math.hypot(tiles[i].x-cx,tiles[i].y-cy)],['edge',i=>-Math.hypot(tiles[i].x-cx,tiles[i].y-cy)]];
 for(const [role,score]of regions){const sites=own.filter(i=>!occupied.has(i)).sort((a,b)=>score(a)-score(b));for(let n=0;n<18;n++){let at=sites.findIndex(i=>!occupied.has(i)&&spawned.every(j=>distance(i,j)>=2));if(at<0)at=sites.findIndex(i=>!occupied.has(i));if(at<0)break;const tile=sites[at],u=makeUnit(1,types[n%types.length],tile,n%10===9?3:2);if(role==='center')u.danteReserve=true;if(!['center','edge'].includes(role))u.danteFront=role;occupied.add(tile);spawned.push(tile)}}
 danteExpansionPlan=null;const p=buildDanteExpansionPlan(),comp=aiSeaComponents();for(const front of p.fronts.filter(f=>f.naval)){const seas=tiles.map((t,i)=>t.owner<0&&!occupied.has(i)&&comp.sizes[comp.ids[i]]>100&&distance(i,front.anchor.tile)<=12?i:-1).filter(i=>i>=0).sort((a,b)=>distance(a,front.anchor.tile)-distance(b,front.anchor.tile));for(let n=0;n<18&&seas.length;n++){const nearbyShips=units.filter(u=>isNaval(u)&&!u.carriedBy),at=seas.findIndex(i=>nearbyShips.every(u=>distance(i,u.tile)>=2));if(at<0)break;const tile=seas.splice(at,1)[0],type=n<12?26:n<16?23:24,u=makeUnit(1,type,tile,2);u.danteFront=front.name;occupied.add(tile)}
  const sites=own.filter(i=>!occupied.has(i)&&distance(i,front.anchor.tile)<=4).sort((a,b)=>distance(a,front.anchor.tile)-distance(b,front.anchor.tile));for(let n=0;n<10&&sites.length;n++){const tile=sites.shift(),u=makeUnit(1,types[n%6],tile,2);u.danteFront=front.name;occupied.add(tile)}
 }
 if(danteAIActive()){money[1]*=5;food[1]*=5;oil[1]*=5;}faceInitialArmy();danteExpansionPlan=null;buildDanteFrontPlan();
}
const expansionSetup=setup;setup=function(){danteExpansionSeeded=false;danteExpansionPlan=null;dantePortBerths.clear();danteCoastalCells=null;const result=expansionSetup();seedDanteExpansion();save();return result};
const expansionMigration=migrateArmy;migrateArmy=function(s){const result=expansionMigration(s);danteExpansionSeeded=!!s.danteExpansionSeeded;danteExpansionPlan=null;danteFrontPlan=null;dantePortBerths.clear();danteCoastalCells=null;return result};
Object.assign(window.Terha,{setup,migrateArmy,aiStep,aiProcure,prepareAITransports,income,foodIncome,oilIncome,canProduce,deploy,landUnit,transportLanding,transportCandidate,buildDanteFrontPlan,danteUnitObjective});
