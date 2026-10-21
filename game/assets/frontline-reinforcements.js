'use strict';
// New-campaign grants only. Loading a save never adds or relocates an army.
function reinforcementFrontDepth(f){
 const depth=new Int16Array(tiles.length).fill(-1),queue=[];
 for(let i=0;i<tiles.length;i++)if(tiles[i].owner===f&&neighbors(i).some(j=>tiles[j].owner===1)){depth[i]=0;queue.push(i)}
 for(let n=0;n<queue.length;n++){const i=queue[n];if(depth[i]>=4)continue;for(const j of neighbors(i))if(tiles[j].owner===f&&depth[j]<0){depth[j]=depth[i]+1;queue.push(j)}}
 return{depth,border:queue.filter(i=>depth[i]===0)};
}
function seedFrontlineReinforcements(){
 const occupied=new Set(units.filter(u=>!u.carriedBy&&u.hp>0).map(u=>u.tile));
 for(const b of missileBases)occupied.add(b.tile);
 const fronts=new Map();
 for(const f of [2,0]){
  const front=reinforcementFrontDepth(f);fronts.set(f,front);if(!front.border.length)continue;
  const composition=f===0?[[14,6],[1,10],[13,6],[2,6],[3,4],[9,24],[10,4],[0,4]]:[[14,6],[1,10],[13,6],[2,6],[3,4],[9,8],[10,6],[0,6]];
  const sites=tiles.map((t,i)=>i).filter(i=>front.depth[i]>=0&&!occupied.has(i)),crowding=new Float64Array(tiles.length);
  for(const [type,count]of composition)for(let n=0;n<count;n++){
   // Spread across the border, then fill its immediate supporting ranks.
   let tile,score=Infinity;
   for(const i of sites){if(occupied.has(i)||moveCost({f,type},i)>=99999)continue;const value=front.depth[i]*3+crowding[i];if(value<score){score=value;tile=i}}
   if(tile===undefined)continue;
   const u=makeUnit(f,type,tile,type===14?3:2);u.initialFrontlineReinforcement=true;occupied.add(tile);
   for(const i of sites)crowding[i]+=Math.max(0,3-distance(i,tile))*4;
  }
 }
 const front=fronts.get(0);if(front?.border.length){
  const comp=aiSeaComponents(),coasts=tiles.map((t,i)=>i).filter(i=>front.depth[i]>=0&&neighbors(i).some(j=>tiles[j].owner<0));
  const seas=tiles.map((t,i)=>i).filter(i=>tiles[i].owner<0&&!occupied.has(i)&&comp.sizes[comp.ids[i]]>100&&(!coasts.length||coasts.some(j=>distance(i,j)<=6)));
  const borderDistance=i=>Math.min(...front.border.map(j=>distance(i,j)));
  const nearestCoast=i=>coasts.length?Math.min(...coasts.map(j=>distance(i,j))):0;
  seas.sort((a,b)=>borderDistance(a)-borderDistance(b)||nearestCoast(a)-nearestCoast(b)||a-b);
  // Two carriers, three destroyers and four frigates reinforce the western coast.
  const ships=[25,25,24,24,24,23,23,23,23],placed=[];
  for(const type of ships){let tile=seas.find(i=>!occupied.has(i)&&placed.every(j=>distance(i,j)>=2));if(tile===undefined)tile=seas.find(i=>!occupied.has(i));if(tile===undefined)break;
   const u=makeUnit(0,type,tile,2);u.initialFrontlineReinforcement=true;u.westernFleet=true;occupied.add(tile);placed.push(tile);
  }
 }
 faceInitialArmy();danteFrontPlan=null;danteExpansionPlan=null;buildDanteFrontPlan();
}
const reinforcementSetup=setup;
setup=function(){const result=reinforcementSetup();seedFrontlineReinforcements();save();updateHUD();refreshSelection();return result};
Object.assign(window.Terha,{setup,reinforcementFrontDepth,seedFrontlineReinforcements});
