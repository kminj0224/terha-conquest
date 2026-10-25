'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'../game/assets');
const noop=()=>{};
const balance={TYPES:Array.from({length:30},()=>({hp:100,atk:1,cost:1,text:''})),migrateArmy:noop,ARTILLERY:[],window:{Terha:{}}};
vm.createContext(balance);
for(const [,file]of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script src="([^"]+)"/g))
 if(['unit-balance.js','artillery-balance.js'].includes(file))vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),balance);
assert.equal(balance.TYPES[11].atk,33);assert.equal(balance.TYPES[18].atk,96);assert.equal(balance.TYPES[18].cost,1000);assert.equal(balance.TYPES[18].branch,'armor');assert(balance.TYPES[18].tank);

const s={console,Set,Map,Math,Number,window:{Terha:{}},document:{addEventListener:noop},
 $:()=>({}),productionReason:()=>'',produce:noop,unitPage:noop,cityCommandOpen:noop,cityOverview:()=>'',deploy:noop,
 drawCityForeground:noop,industryTurn:noop,capture:noop,nuclearImpact:noop,migrateArmy:noop,selected:null,
 player:0,turn:1,productionTier:1,productionAA:false,busy:false,cityProfile:noop,
 TYPES:[{name:'Infantry',branch:'infantry'},{name:'Ship',branch:'navy'}],
 isNaval:u=>u.type===1,unitPrice:()=>100,unitOil:()=>40,navGoldCost:k=>k===1?60:0,aaCost:()=>20,
 food:[1000],oil:[1000],money:[1000],toast:noop,showPanel:noop,updateHUD:noop,save:noop,
 cam:{x:0,y:0,z:.3},pxy:i=>({x:i*10,y:i*20})};
s.cities=[{id:0,tile:0,f:0,origin:0,level:2,name:'Home',nukeUntil:0},
 {id:1,tile:2,f:0,origin:1,level:3,name:'Target',nukeUntil:0},
 {id:2,tile:3,f:0,origin:1},{id:3,tile:4,f:0,origin:0}];
s.tiles=[{owner:0,region:0},{owner:-1},{owner:0,region:1},{owner:0,region:2},{owner:0,region:3},{owner:-1}];
const edges=[[1],[0,5],[3],[2,4],[3,5],[1,4]];s.neighbors=i=>edges[i];
vm.createContext(s);vm.runInContext(fs.readFileSync(path.join(root,'occupation-supply.js'),'utf8'),s);
const run=code=>vm.runInContext(code,s);
assert.equal(run('supplyTurns(cities[0],cities[1])'),3);
assert.equal(run('supplyTurns(cities[0],cities[1],1)'),2,'naval sea transport fixed at 2');
assert(run('supplySeaAccess(cities[1])'),'inland target linked through occupied and homeland regions');
s.cities[2].f=1;s.tiles[3].owner=1;
assert(!run('supplySeaAccess(cities[1])'),'foreign region breaks sea access');
const before=[...s.food,...s.oil,...s.money];
assert(!run('requestSupply(cities[1],cities[0],0,1,false)'),'blocked route rejected at purchase');
assert.deepEqual([...s.food,...s.oil,...s.money],before,'rejected route never charges');
edges[2].push(5);assert(run('supplySeaAccess(cities[1])'),'direct coast allowed without harbor');edges[2].pop();
s.cities[2].f=0;s.tiles[3].owner=0;s.cities[1].harbor=true;
assert(run('requestSupply(cities[1],cities[0],1,1,false)'));
assert.equal(s.cities[0].queue.remaining,2);
s.cities[0].queue=null;s.cities[0].produced=false;
assert(run('requestSupply(cities[1],cities[0],0,1,false)'));
assert.equal(s.cities[0].queue.remaining,3,'land unit still takes 3 turns across sea');
edges[0].push(2);assert.equal(run('supplyTurns(cities[0],cities[1],0)'),2);assert.equal(run('supplyTurns(cities[0],cities[1],1)'),2);
run('focusSupplyCity(1)');assert.deepEqual(s.cam,{x:20,y:40,z:.85});
const orders=fs.readFileSync(path.join(root,'orders.js'),'utf8');
vm.runInContext(orders.slice(orders.indexOf('function resupplyCost('),orders.indexOf('const beforePanel=')),s);
s.unitMaxHp=()=>900;s.selectUnit=noop;s.u={type:1,f:0,level:3,hp:1,aa:true,attackReady:true,moveAllowed:false};
s.food[0]=s.oil[0]=s.money[0]=1000;
assert(run('repair(u)'));assert.equal(s.u.hp,900);assert.equal(s.food[0],900);assert.equal(s.oil[0],960);assert.equal(s.money[0],920);
assert(s.u.attackReady);assert.equal(s.u.moveAllowed,false);
s.u.hp=1;assert(run('repair(u)'),'repeat repair in same turn');assert.equal(s.u.hp,900);
for(const [resource,minimum]of [['food',100],['oil',40],['money',80]]){
 s.food[0]=s.oil[0]=s.money[0]=1000;s[resource][0]=minimum-1;s.u.hp=1;
 const values=[...s.food,...s.oil,...s.money];assert(!run('repair(u)'));assert.equal(s.u.hp,1);assert.deepEqual([...s.food,...s.oil,...s.money],values);
}
const audio=fs.readFileSync(path.join(root,'combat-audio.js'),'utf8');
vm.runInContext(audio.slice(audio.indexOf('function combatWeaponProfile('),audio.indexOf('function combatImpactProfile(')),s);
const profile=run('combatWeaponProfile({type:18,f:2})');assert.equal(profile.shots,5);assert.equal(profile.step,260);assert(profile.playbackRate<1);
assert.equal(run('combatWeaponProfile({type:1,f:2}).shots'),1,'other laser profiles preserved');
console.log('PASS: coastal region chains, foreign blockage, atomic rejection, naval fixed turns, camera focus, full resupply resource charges and extended laser salvo');
// Incoming banners pan only through their explicit city buttons.
s.progressCard=(title,detail)=>title+' '+detail;
s.cities[0].queue={type:1,level:2,sourceName:'Home',transportTo:1,remaining:2,total:2};
let card=run('supplyCard(cities[0])');assert(card.includes('에서 출항 후 입항 예정입니다'));assert(card.includes('입항 도시:'));assert(!card.includes('도착'));
s.cities[0].queue.type=0;card=run('supplyCard(cities[0])');assert(card.includes('에서 훈련 후 수송 중입니다'));assert(!card.includes('출항'));
assert.equal(run('supplyProductionLabel(cities[1])'),'⚙ Infantry2 - Home');
const painted=[];s.ctx={save(){},restore(){},translate(){},strokeText:text=>painted.push(text),fillText(){}};s.cam.z=1;
run('drawCityForeground(cities[1],{x:0,y:0})');assert.deepEqual(painted,['⚙ Infantry2 - Home']);
s.cities[0].queue=null;assert.equal(run('supplyProductionLabel(cities[1])'),'');painted.length=0;run('drawCityForeground(cities[1],{x:0,y:0})');assert.equal(painted.length,0);
console.log('PASS: naval-only departure/berthing text, land transport wording, occupied-city gear label and queue cleanup');
