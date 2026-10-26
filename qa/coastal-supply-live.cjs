'use strict';
const assert=require('assert');
module.exports=async function({run}){
 const report=await run(`(()=>{
  const original=JSON.stringify(snapshot()),check=(v,m)=>{if(!v)throw Error(m)};
  try{
   busy=false;menuMode=false;started=true;player=0;units=[];
   food.fill(1000000);money.fill(1000000);oil.fill(1000000);
   const coastal=new Set(),adj=cities.map(()=>new Set());
   tiles.forEach((t,i)=>{if(t.owner<0||!cities[t.region])return;for(const j of neighbors(i)){
    if(tiles[j].owner<0)coastal.add(t.region);
    else if(cities[tiles[j].region]&&tiles[j].region!==t.region)adj[t.region].add(tiles[j].region);
   }});
   let target,coast,home;
   for(const q of cities){
    if(q.origin===0||coastal.has(q.id))continue;
    const port=[...adj[q.id]].map(id=>cities[id]).find(v=>v.origin!==0&&coastal.has(v.id));
    if(!port)continue;
    const source=cities.find(v=>v.origin===0&&coastal.has(v.id)&&v.id!==q.id&&v.id!==port.id&&!adj[q.id].has(v.id)&&!adj[port.id].has(v.id)&&!(typeof isHansaSupplyCity==='function'&&isHansaSupplyCity(v)));
    if(source){target=q;coast=port;home=source;break}
   }
   check(target&&coast&&home,'Actual map must contain adjacent inland/coastal regions and a separate homeland');
   for(const q of cities){q.f=6;q.queue=null;q.produced=false;q.nukeUntil=0}
   for(const t of tiles)if(t.owner>=0)t.owner=6;
   for(const q of [target,coast,home]){q.f=0;for(const i of regionTiles[q.id])tiles[i].owner=0}
   target.level=5;home.level=1;cityProfile(home);
   check(!supplyCoastalCity(target),'Receiving city is truly inland');
   check(!supplyHomelandConnected(target),'Receiving component has no homeland land route');
   check(supplySeaAccess(target),'Receiving inland region reaches sea through occupied neighbor');
   check(!supplyReason(target,home,0,1,false),'Real human production permits occupied coastal neighbor');
   check(requestSupply(target,home,0,1,false),'Real human inland request succeeds');
   check(home.queue?.transportTo===target.id,'Human order queues at homeland');
   home.queue=null;home.produced=false;player=1;
   check(aiQueueUnit(0,target,0,1),'Real AI procurement permits occupied coastal neighbor');
   check(home.queue?.transportTo===target.id&&home.queue.owner===0,'AI order uses real homeland transport');
   home.queue=null;home.produced=false;
   const resources=JSON.stringify([food,money,oil]);
   coast.f=6;
   check(!supplySeaAccess(target),'Foreign region ownership cuts route even with stale friendly tiles');
   check(!aiQueueUnit(0,target,0,1),'AI rejects isolated inland city');
   player=0;check(!requestSupply(target,home,0,1,false),'Human rejects isolated inland city');
   check(JSON.stringify([food,money,oil])===resources,'Rejected orders do not charge');
   coast.f=0;for(const i of regionTiles[coast.id])tiles[i].owner=6;
   check(!supplySeaAccess(target),'Foreign land cuts coastal chain');
   for(const i of regionTiles[coast.id])tiles[i].owner=0;
   check(!supplyReason(target,home,0,1,false),'Restored coastal chain immediately permits production');
   return {inland:target.name,coastalNeighbor:coast.name,human:true,ai:true,isolatedRejected:true};
  }finally{
   const state=JSON.parse(original);({units,cities,money,tech,food,oil,turn,player,difficulty,uid,cam}=state);
   tiles.forEach((t,i)=>t.owner=state.owners[i]);migrateArmy(state);busy=false;selected=null;panelOpen=false;supplyChoice=null;save();
  }
 })()`);
 assert(report.human&&report.ai&&report.isolatedRejected);console.log('PASS actual-map inland supply through occupied coastal region:',report);
};
