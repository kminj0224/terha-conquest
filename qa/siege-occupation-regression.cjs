'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'../game/assets'),read=n=>fs.readFileSync(path.join(root,n),'utf8'),noop=()=>{};
const messages=[],shown=[],legacyOrders=[];
const b={console,Set,Map,Number,Math,Int32Array,performance:{now:()=>1000},window:{Terha:{}},document:{addEventListener:noop},$:()=>({}),
 player:0,turn:10,productionTier:1,productionAA:false,busy:false,started:true,menuMode:false,airTarget:null,strategicTarget:null,coastBuildMode:false,navalMode:null,selected:null,
 cam:{x:10,y:20,z:1},food:[10000,10000,10000],money:[10000,10000,10000],oil:[10000,10000,10000],tech:[0,0,0],
 cities:[{id:0,tile:0,f:2,origin:2,name:'Home',level:3,nukeUntil:0,harbor:true,airport:true,lab:true},{id:1,tile:3,f:2,origin:1,name:'Forward',level:3,nukeUntil:0,harbor:true},{id:2,tile:7,f:0,origin:0,name:'Enemy',level:3,nukeUntil:0,hp:500}],
 tiles:Array.from({length:9},(_,i)=>({owner:i>=6?0:2,region:i<2?0:i<6?1:2,terrain:0})),units:[],missileBases:[],uid:1,
 TYPES:Array.from({length:30},(_,i)=>({name:'Unit'+i,branch:[2,3,15,16].includes(i)?'artillery':[5,22,23,24,25,26].includes(i)?'navy':[1,12,13,14,18].includes(i)?'armor':'infantry',move:3,range:5,cost:100})),
 factions:[{name:'P'},{name:'B'},{name:'AI'}],regionTiles:[[0,1],[2,3,4,5],[6,7,8]],territoryDirty:false,
 neighbors:i=>[i-1,i+1].filter(j=>j>=0&&j<9),distance:(i,j)=>Math.abs(i-j),cityAt:i=>b.cities.find(q=>q.tile===i),unitAt:i=>b.units.find(u=>!u.carriedBy&&u.tile===i),baseAt:i=>b.missileBases.find(v=>v.tile===i),
 atWar:(f,g)=>f!==g,cityMaxHp:()=>3000,unitMaxHp:()=>100,unitArmor:()=>0,isAircraft:u=>[4,7,19].includes(u.type),isHelicopter:u=>[20,21].includes(u.type),isNaval:u=>b.TYPES[u.type].branch==='navy',
 cityProfile:noop,canProduce:(q,k,l)=>l<=4&&q.level>=1&&!b.isAircraft({type:k}),productionReason:()=>'',produce:noop,unitPage:noop,cityCommandOpen:noop,cityOverview:()=>'',drawCityForeground:noop,progressCard:(a,c)=>a+c,
 deploy:noop,industryTurn:noop,nuclearImpact:i=>{b.cityAt(i).hp=0},migrateArmy:noop,moveCost:()=>1,landingTiles:()=>[3,7],
 unitPrice:(k,l=1)=>100*l,unitOil:k=>k===0?0:20,navGoldCost:k=>b.isNaval({type:k})?40:0,aaCost:()=>10,
 aiProcure:(f,owned)=>legacyOrders.push(owned.map(q=>q.id)),aiObjectives:[null,null,null],aiUpgradeReserve:()=>0,strategicResearch:[{}, {},{ballistic:true}],
 MISSILE_MODELS:{short:{range:20,damage:1000,gold:90,oil:4,name:'Missile'}},FACILITIES:{launcher:{cost:100}},
 canAirStrike:()=>true,airStrike:noop,airDropTileAvailable:()=>false,landUnit:noop,kill:u=>{b.units=b.units.filter(v=>v!==u)},log:noop,toast:s=>messages.push(s),tap:()=>messages.push('fallback'),pickedNavalTile:()=>7,
 canAttack:(u,v)=>u.attackReady&&u.f!==v.f&&Math.abs(u.tile-v.tile)<=b.TYPES[u.type].range,mayMove:u=>u.moveAllowed&&!u.moved,mayFire:u=>u.attackReady&&u.hp>0,
 diplomacy:Array.from({length:3},()=>Array(3).fill('war')),
 makeUnit:(f,type,tile,level)=>{const u={id:b.uid++,f,type,tile,level,hp:100,ap:2,moveAllowed:true,attackReady:true,xp:0};b.units.push(u);return u},
 selectUnit:noop,showPanel:noop,refreshSelection:noop,updateHUD:noop,save:noop,checkEnd:noop,reach:new Map(),sound:false,
 finishMovingBeforeFire:async()=>{},beginAim:noop,delay:async()=>{},launchShot:noop,audioShot:noop,spendShot:u=>{u.attackReady=false;u.moveAllowed=false},
 siegeDamage:()=>1000,targetExplosions:(u,p,d)=>shown.push(d),fx:[],moving:[],aimMotions:new Map(),pxy:i=>({x:i,y:0}),nearWorldPoint:p=>p,weaponAngle:()=>0,syncOrders:noop,
 damage:()=>30,specialIncomingFactor:()=>1,rannaTerrainProtection:()=>1,rollCounterattack:()=>false,canCounterattack:()=>false,killReward:noop,
 isFlashInfantry:()=>false,isCannonTank:()=>false,isBaekArtillery:()=>false,isTowedArtillery:()=>false,escortProtected:()=>false,
 bombProtection:()=>1,cityAirStrikeDamage:()=>2000,AIR_MISSIONS:{fighter:{cost:100,oil:20,damage:100,name:'Fighter'}},addAirRaid:noop};
b.capture=()=>{};b.aiStep=(u,targets)=>{const q=targets.find(q=>b.canAttackCity(u,q));return q?{city:q}:null};
vm.createContext(b);const run=c=>vm.runInContext(c,b);const segment=(file,a,c)=>{const s=read(file),start=s.indexOf(a),end=s.indexOf(c,start);assert(start>=0&&end>start,file);return s.slice(start,end)};
run(segment('warfare.js','function capture(u)','const baseMove='));
run(segment('orders.js','function damageCity(','function recoverCities('));
run('const coastDamageCity=damageCity;'+segment('coast.js','damageCity=function(', '\n'));
run(segment('orders.js','function canAttackCity(','const beforeCapture='));
run(segment('campaign-balance.js','reachable=function(','function aiSeaComponents('));
run(segment('orders.js','async function attackCity(','function canCounterattack('));
run(segment('orders.js','async function attack(u,','const beforeLaunch='));
run(segment('orders.js','async function airStrike(','function drawCitySelection('));
run(read('occupation-supply.js'));
run(read('siege-occupation.js'));
run(segment('v11085-strategic.js','function missileCanFire(','Object.assign(window.Terha'));
function unit(type,tile=6,f=2){return {id:b.uid++,f,type,tile,level:1,hp:100,ap:2,moveAllowed:true,attackReady:true,xp:0}}
async function main(){
 // Actual attack handlers and popup values, not just the arithmetic helper.
 for(const type of [2,3,4,7,19,20,21,5,22,23,24,25]){
  const u=unit(type);b.units=[u];b.cities[2].hp=500;shown.length=0;b.u=u;
  assert(await run('attackCity(u,cities[2],true)'));assert.equal(b.cities[2].hp,1,'floor type '+type);assert.equal(shown.at(-1),499);
  u.attackReady=true;u.moveAllowed=true;shown.length=0;assert(await run('attackCity(u,cities[2],true)'));assert.equal(b.cities[2].hp,1);assert.equal(shown.at(-1),0);
 }
 b.units=[unit(2),unit(0,7,0)];b.u=b.units[0];b.v=b.units[1];b.cities[2].hp=500;await run('attack(u,v,true)');assert.equal(b.cities[2].hp,1,'garrison collateral floor');assert.equal(b.v.hp,70,'garrison still takes unit damage');assert(b.fx.some(e=>e.damage===499));
 b.units=[];b.cities[2].hp=500;shown.length=0;assert(await run("airStrike(cities[0],'fighter',7,true)"));assert.equal(b.cities[2].hp,1);assert.equal(shown.at(-1),499);
 const resources=[b.money[2],b.oil[2]];assert(!run("canAirStrike(cities[0],'fighter',7)"));assert(!await run("airStrike(cities[0],'fighter',7,true)"));assert.deepEqual([b.money[2],b.oil[2]],resources,'no wasted air sortie');
 b.cities[2].hp=0;run('damageCity(cities[2],1000,1)');assert.equal(b.cities[2].hp,0,'never heal a breached city');
 // Only rifles enter/capture enemy cities; friendly home and occupied city access stays legal.
 b.u=unit(1,6);b.units=[b.u];assert(!run('reachable(u).costs.has(7)'));assert(run('reachable(u).costs.has(3)'));
 b.u.tile=7;run('capture(u)');assert.equal(b.cities[2].f,0);b.u.tile=6;
 b.player=2;b.selected={kind:'unit',id:b.u.id};run('tap(0,0)');assert.equal(messages.at(-1),'소총수만 점령할 수 있습니다');b.player=0;
 b.u=unit(0,6);b.units=[b.u];assert(run('reachable(u).costs.has(7)'));assert.equal(run('aiStep(u,cities).move'),7);assert(run('moveUnit(u,7,true)'));assert.equal(b.cities[2].f,2);assert(b.cities[2].hp>0);
 b.cities[2].f=0;b.cities[2].hp=1;b.u=unit(2,6);b.units=[b.u];assert.equal(run('aiStep(u,cities)'),null,'no artillery waste on 1 HP empty city');
 // Use the real shared occupied-city ordering/deployment flow on an AI-owned front.
 b.units=[];b.cities[0].queue=null;b.cities[0].produced=false;b.cities[1].produced=false;b.cities[0].level=3;b.cities[1].level=3;
 b.money[2]=b.food[2]=b.oil[2]=10000;const playerResources=[b.money[0],b.food[0],b.oil[0]];
 assert(!run('canProduce(cities[1],0,1)'),'no AI direct occupied production');run('aiProcure(2,cities.filter(q=>q.f===2))');
 assert.equal(b.cities[0].queue.transportTo,1);assert.equal(b.cities[0].queue.owner,2);assert.equal(b.cities[0].queue.type,0);assert.equal(b.cities[0].queue.remaining,2);assert.equal(b.food[2],9900);assert.deepEqual(legacyOrders.at(-1),[0]);assert.deepEqual([b.money[0],b.food[0],b.oil[0]],playerResources);
 b.turn++;run('deploy(cities[0])');assert.equal(b.cities[0].queue.remaining,1);b.turn++;run('deploy(cities[0])');assert.equal(b.cities[0].queue,null);assert(b.units.some(u=>u.type===0&&u.f===2&&u.tile===3),'AI rifle arrives on own occupied city in 2 turns');
 b.cities[0].produced=false;b.cities[0].level=4;assert(!run('requestSupply(cities[1],cities[0],0,1,false,true)'),'AI respects homeland level limit');b.cities[0].level=3;
 // AI conventional missiles use the same eligibility/cost/actual-damage code and keep busy/camera.
 b.cities[0].level=4;b.cities[0].launcher=true;b.cities[0].lastMissileTurn=-1;b.busy=true;b.cities[2].hp=1;b.units=[];
 assert(!await run("launchStrategic(cities[0],'missile',7,true)"),'no empty 1 HP missile waste');
 b.cities[2].hp=500;const beforeGold=b.money[2],beforeOil=b.oil[2],beforeCam={...b.cam};shown.length=0;
 assert(await run("aiStrategicOperations(2,[cities[0]])"));assert.equal(b.cities[2].hp,1);assert.equal(shown.at(-1),499);assert.equal(b.money[2],beforeGold-90);assert.equal(b.oil[2],beforeOil-4);assert.equal(b.busy,true);assert.deepEqual(b.cam,beforeCam);
 run('nuclearImpact(7)');assert.equal(b.cities[2].hp,0,'nuclear impact keeps zero-durability behavior');
 // Existing paid local AI queues migrate without charging twice; impossible ones refund once.
 b.cities[0].level=3;b.cities[0].queue=null;b.cities[0].produced=false;b.cities[1].queue={type:0,level:1,aa:true};
 const paid=[b.food[2],b.oil[2],b.money[2]];run('migrateArmy({cities,units})');
 assert.equal(b.cities[1].queue,null);assert.equal(b.cities[0].queue.transportTo,1);assert.equal(b.cities[0].queue.remaining,2);assert(b.cities[0].queue.aa);assert.deepEqual([b.food[2],b.oil[2],b.money[2]],paid);
 b.cities[0].queue.remaining=2;b.cities[0].queue.total=3;run('migrateArmy({cities,units})');assert.equal(b.cities[0].queue.total,2);assert.equal(b.cities[0].queue.remaining,1,'legacy 3-turn transport preserves elapsed progress');
 b.cities[0].queue=null;b.cities[0].level=4;b.cities[1].queue={type:0,level:1,aa:true};const refund=[b.food[2],b.money[2]];run('migrateArmy({cities,units})');
 assert.equal(b.cities[1].queue,null);assert.equal(b.food[2],refund[0]+100);assert.equal(b.money[2],refund[1]+10);

 console.log('PASS: actual artillery/air/naval/missile and garrison floors/popups, nuclear exemption, rifle-only capture/movement/toast, friendly-city access, AI remote procurement/deployment/costs/level restrictions, AI rifle capture and waste-free missile/air targeting');
}
main().catch(e=>{console.error(e);process.exitCode=1});
