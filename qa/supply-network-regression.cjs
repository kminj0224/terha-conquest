'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'../game/assets'),noop=()=>{};
const b={console,Set,Map,Math,Number,Int32Array,window:{Terha:{}},document:{addEventListener:noop},$:()=>({}),
 player:0,turn:1,productionTier:1,productionAA:false,busy:false,selected:null,
 cities:Array.from({length:9},(_,id)=>({id,tile:id===8?11:id,name:'abcdefghX'[id],f:id===8?6:0,origin:id===7?2:id===8?6:0,level:id===7?5:1,nukeUntil:0,queue:null,produced:false,harbor:[3,6,7].includes(id)})),
 tiles:Array.from({length:12},(_,i)=>({owner:[8,9,10].includes(i)?-1:i===11?6:0,region:i<8?i:i===11?8:-1})),
 TYPES:[{name:'Rifle',branch:'infantry'},{name:'Ship',branch:'navy'}],food:[10000],oil:[10000],money:[10000],units:[],
 unitPrice:()=>100,unitOil:()=>10,navGoldCost:()=>0,aaCost:()=>20,isNaval:u=>u.type===1,
 distance:()=>31,cityProfile:noop,canProduce:()=>true,productionReason:()=>'',produce:noop,unitPage:noop,cityCommandOpen:noop,cityOverview:()=>'',
 deploy:noop,industryTurn:noop,capture:noop,nuclearImpact:noop,migrateArmy:noop,drawCityForeground:noop,
 toast:noop,showPanel:noop,updateHUD:noop,save:noop,unitAt:()=>null,progressCard:(a,c)=>a+c,cam:{z:1},
 makeUnit:(f,type,tile,level)=>{const u={f,type,tile,level};b.units.push(u);return u}};
// a-b and f can reach the coast only across enemy X. c-d-e share d's coast.
// Two seas (8 and 9) are joined by water tile 10; H is on the far sea.
const edges=[[1],[0,11],[3],[2,4,8,11],[3],[11],[8],[9],[3,6,10],[7,10],[8,9],[1,3,5]];
b.neighbors=i=>edges[i];vm.createContext(b);const run=s=>vm.runInContext(s,b);
vm.runInContext(fs.readFileSync(path.join(root,'occupation-supply.js'),'utf8'),b);
const siege=fs.readFileSync(path.join(root,'siege-occupation.js'),'utf8');
vm.runInContext(siege.slice(siege.indexOf('function aiUnitAffordable('),siege.indexOf('function aiEnemyCities(')),b);
assert.deepEqual(Array.from(run('homelandSources(cities[7]).filter(q=>supplyRouteConnected(q,cities[7])).map(q=>q.name)')),['c','d','e','g'],'exact a-g answer');
for(const ai of [false,true])for(let i=0;i<7;i++){
 for(const q of b.cities){q.queue=null;q.produced=false}
 const before=[...b.food,...b.oil,...b.money],allowed=[2,3,4,6].includes(i);
 assert.equal(run('requestSupply(cities[7],cities['+i+'],0,1,false,'+ai+')'),allowed,'source '+b.cities[i].name+' AI '+ai);
 if(allowed){assert.equal(b.cities[i].queue.transportTo,7);assert.equal(b.food[0],before[0]-100)}
 else assert.deepEqual([...b.food,...b.oil,...b.money],before,'no rejected-order charge');
}
for(const q of b.cities){q.queue=null;q.produced=false}
b.player=1;assert(run('aiQueueUnit(0,cities[7],0,1)'));assert.equal(b.cities[2].queue.transportTo,7);b.cities[2].queue=null;b.cities[2].produced=false;
// Enemy-controlled former homeland cannot serve as a bridge, even with stale tiles.
b.cities[3].f=6;assert(!run('supplyRouteConnected(cities[2],cities[7])'));b.cities[3].f=0;
b.tiles[3].owner=6;assert(!run('supplyRouteConnected(cities[2],cities[7])'));b.tiles[3].owner=0;
// Coast at both ends is insufficient when the water bodies do not connect.
b.tiles[10]={owner:6,region:8};assert(!run('supplyRouteConnected(cities[3],cities[7])'));assert(!run('aiQueueUnit(0,cities[7],0,1)'));
// A friendly captured land link may connect those water bodies again.
b.cities[8].f=0;b.tiles[10]={owner:0,region:8};assert(run('supplyRouteConnected(cities[3],cities[7])'));
b.cities[8].f=6;b.tiles[10]={owner:-1,region:-1};assert(run('supplyRouteConnected(cities[3],cities[7])'));
// Connectivity is symmetric for homeland and occupied destinations.
assert(run('supplyRouteConnected(cities[7],cities[4])'));assert(!run('supplyRouteConnected(cities[7],cities[0])'));
// Paid transport pauses while the route is cut; reconnecting does not count blocked turns.
b.player=0;assert(run('requestSupply(cities[7],cities[2],0,1,false)'));b.turn++;run('deploy(cities[2])');assert.equal(b.cities[2].queue.remaining,1);
b.tiles[10]={owner:6,region:8};b.turn++;run('deploy(cities[2])');assert(b.cities[2].queue.routeBlocked);assert.equal(b.cities[2].queue.remaining,1);
b.turn+=3;run('deploy(cities[2])');assert.equal(b.cities[2].queue.remaining,1);assert.equal(b.units.length,0);
const paid=b.food[0];run('migrateArmy({cities})');assert(b.cities[2].queue.routeBlocked);assert.equal(b.cities[2].queue.remaining,1);
assert(run('supplyCard(cities[2])').includes('수송로 단절 · 연결 대기'));
b.tiles[10]={owner:-1,region:-1};b.turn++;run('deploy(cities[2]);deploy(cities[2])');assert.equal(b.units.length,1);assert.equal(b.cities[2].queue,null);assert.equal(b.food[0],paid);
// Moving bridges are blocked in both directions, and resume without a stale cache.
b.hansaBridges=[{transition:{},deck:[10]}];assert(!run('supplyRouteConnected(cities[3],cities[7])'));b.hansaBridges[0].transition=null;assert(run('supplyRouteConnected(cities[3],cities[7])'));
console.log('PASS: exact a-g/H eligibility, human/AI charges, friendly-only land, connected seas, land transshipment, symmetric endpoints, route pauses/save/resume and bridge invalidation');
