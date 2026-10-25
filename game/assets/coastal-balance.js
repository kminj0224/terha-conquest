'use strict';
// Final new-campaign placement pass. Saves retain their existing armies.
let initialCoastReport=null;
function southernDanteFleet(){
 const ports=cities.filter(q=>q.origin===1&&q.harbor);
 if(!ports.length)return [];
 const north=ports.reduce((a,b)=>tiles[a.tile].y<=tiles[b.tile].y?a:b);
 const south=ports.reduce((a,b)=>tiles[a.tile].y>=tiles[b.tile].y?a:b);
 return units.filter(u=>u.f===1&&isNaval(u)&&!u.carriedBy&&u.hp>0&&
  (u.danteFront==='south'||!u.danteFront&&distance(u.tile,south.tile)<distance(u.tile,north.tile)));
}
function halveSouthernDanteFleet(){
 const fleet=southernDanteFleet(),groups=new Map(),keep=new Set();
 for(const u of fleet){if(!groups.has(u.type))groups.set(u.type,[]);groups.get(u.type).push(u)}
 // Keep the same mix of transports and combat ships, including odd totals.
 const target=Math.ceil(fleet.length/2),remainders=[];
 for(const group of groups.values()){
  group.sort((a,b)=>a.id-b.id);const n=Math.floor(group.length/2);
  for(const u of group.slice(0,n))keep.add(u.id);
  if(group.length%2)remainders.push(group[n]);
 }
 remainders.sort((a,b)=>a.type-b.type||a.id-b.id);
 for(const u of remainders)if(keep.size<target)keep.add(u.id);
 const removed=new Set(fleet.filter(u=>!keep.has(u.id)).map(u=>u.id));
 units=units.filter(u=>!removed.has(u.id));
 return {before:fleet.length,after:keep.size};
}
function stetopiaSouthCoast(){
 const own=tiles.map((t,i)=>t.owner===2?i:-1).filter(i=>i>=0);
 if(!own.length)return [];
 const mid=(Math.min(...own.map(i=>tiles[i].y))+Math.max(...own.map(i=>tiles[i].y)))/2;
 return own.filter(i=>tiles[i].y>=mid&&neighbors(i).some(j=>tiles[j].owner<0&&tiles[j].y>tiles[i].y));
}
function seedStetopiaSouthCoast(){
 const coast=stetopiaSouthCoast(),placed=[];
 if(!coast.length)return {bases:[],ships:[]};
 const left=Math.min(...coast.map(i=>tiles[i].x)),right=Math.max(...coast.map(i=>tiles[i].x));
 const sites=coast.filter(i=>!unitAt(i)&&!cityAt(i)&&!baseAt(i));
 for(const fraction of [1/6,1/2,5/6]){
  const x=left+(right-left)*fraction;
  const tile=sites.filter(i=>!placed.includes(i)&&placed.every(j=>distance(i,j)>=6))
   .sort((a,b)=>Math.abs(tiles[a].x-x)-Math.abs(tiles[b].x-x)||tiles[b].y-tiles[a].y||a-b)[0];
  if(tile===undefined)continue;
  missileBases.push({id:navalUid++,tile,f:2,kind:'sea',hp:DEFENSES.sea.hp,remaining:0,lastTick:turn,lastShot:-1,facing:1,initialSouthCoast:true});
  placed.push(tile);
 }
 const comp=aiSeaComponents(),ships=[];
 const seas=tiles.map((t,i)=>i).filter(i=>tiles[i].owner<0&&!unitAt(i)&&!baseAt(i)&&comp.sizes[comp.ids[i]]>100&&coast.some(j=>tiles[i].y>tiles[j].y&&distance(i,j)<=3));
 for(const [type,fraction]of [[24,.25],[23,.35],[24,.7],[23,.8]]){
  const x=left+(right-left)*fraction;
  const tile=seas.filter(i=>!unitAt(i)&&ships.every(u=>distance(i,u.tile)>=2))
   .sort((a,b)=>Math.abs(tiles[a].x-x)-Math.abs(tiles[b].x-x)||a-b)[0];
  if(tile===undefined)continue;
  const u=makeUnit(2,type,tile,2);u.initialSouthCoast=true;ships.push(u);
 }
 return {bases:placed,ships:ships.map(u=>u.id)};
}
const coastBalanceSetup=setup;
setup=function(...args){
 const result=coastBalanceSetup(...args);
 initialCoastReport={dante:halveSouthernDanteFleet(),stetopia:seedStetopiaSouthCoast()};
 faceInitialArmy();danteFrontPlan=null;danteExpansionPlan=null;buildDanteFrontPlan();
 invalidateActionVisuals();save();updateHUD();refreshSelection();return result;
};
Object.assign(window.Terha,{setup});
