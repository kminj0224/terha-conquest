'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const harness=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8');
const start=harness.indexOf("assert.equal(run('appScreen'),'title');");
async function verifyBalance(){
 const check=(ok,message)=>{if(!ok)throw Error(message)};
 player=0;setup();started=true;setAppScreen('game');busy=false;menuMode=false;sound=false;
 units=[];missileBases=[];tech.fill(0);food.fill(100000);money.fill(100000);oil.fill(100000);
 const land=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&!RANNA_RIVER_TILES.has(i));
 tiles[land].terrain=1;
 check(unitPrice(18,1)===1220&&unitOil(18,1)===66,'Mecha Knight base resources');
 check(unitPrice(18,4)===2135&&unitOil(18,4)===116,'Existing tier price scaling retained');
 const at=makeUnit(0,9,land,1),tank=makeUnit(2,1,land,1);
 check(unitAttack(at)===14&&unitMaxHp(at)===85,'Anti-tank base attack and HP');
 const armor=TYPES[1].def;TYPES[1].def=0;const bare=damage(at,tank);TYPES[1].def=9999;
 check(bare===63&&damage(at,tank)===63,'Tank attack x4.5 with armor ignored');TYPES[1].def=armor;
 const rifle=makeUnit(2,0,land,1),rifleArmor=TYPES[0].def;TYPES[0].def=0;
 check(damage(at,rifle)===14,'No tank multiplier against infantry');TYPES[0].def=rifleArmor;
 // Old saves retain their health fraction; new saves retain exact damage on repeated loads.
 const legacy=JSON.parse(JSON.stringify(snapshot()));delete legacy.antiTankHealthSchema;
 legacy.units.find(u=>u.id===at.id).hp=67;units=legacy.units;migrateArmy(legacy);
 let restored=units.find(u=>u.id===at.id);check(restored.hp===42,'Old 67/135 HP converts to 42/85');
 for(let n=0;n<2;n++){const saved=JSON.parse(JSON.stringify(snapshot()));units=saved.units;migrateArmy(saved);check(units.find(u=>u.id===at.id).hp===42,'Reload cannot heal or damage anti-tank unit')}
 units=[];tech.fill(0);
 const p=makeUnit(0,AIRBORNE_TROOPER,land,1);p.airdropTurn=turn-3;
 const ring3=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&distance(land,i)===3);
 const ring2=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&distance(land,i)===2);
 check(ring2>=0&&ring3>=0,'Support range fixtures');
 const ally=makeUnit(0,0,ring3,1);reconcileAirborne();
 check(p.type===AIRBORNE_TROOPER&&!mayMove(p)&&!mayFire(p),'Three tiles cannot rescue expired airborne');
 ally.tile=ring2;reconcileAirborne();check(p.type===0&&p.level===1,'Two tiles rescue to tier-one rifle');
 units=[];
 const drop=makeUnit(0,AIRBORNE_TROOPER,land,1);
 for(const target of [{kind:'sam'},{kind:'sea'},{level:1},{level:2},{level:3}])check(siegeDamage(drop,target)===4680,'Uniform x90 structure multiplier');
 check(siegeDamage(drop,{level:4})===baseAirborneSiege(drop,{level:4}),'Level-four city keeps baseline');
 units=[];
 const airport=cities.find(q=>q.f===0&&q.capital);airport.airport=true;airport.nukeUntil=0;
 const landing=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&!baseAt(i)&&distance(airport.tile,i)<=60);
 for(const [resource,required]of [[food,510],[money,1100],[oil,20]]){
  food[0]=510;money[0]=1100;oil[0]=20;resource[0]=required-1;
  const before=[food[0],money[0],oil[0]];
  check(!canAirStrike(airport,'transport',landing),'Missing one resource blocks drop');
  check(!await airStrike(airport,'transport',landing,true),'Unaffordable drop cannot execute');
  check(JSON.stringify(before)===JSON.stringify([food[0],money[0],oil[0]]),'Rejected drop does not consume resources');
 }
 food[0]=510;money[0]=1100;oil[0]=20;
 check(await airStrike(airport,'transport',landing,true),'Exact-resource drop succeeds');
 check(food[0]===0&&money[0]===0&&oil[0]===0,'Exact drop resource debit');
 check(unitAt(landing).type===AIRBORNE_TROOPER&&unitAt(landing).level===1,'Dedicated airborne unit deployed');
 check(AIR_MISSIONS.fighter.cost===0&&AIR_MISSIONS.fighter.oil===30,'Fighter resources');
 check(cityAirStrikeDamage('fighter',{aa:false,f:1,tile:land})===3000,'Fighter city damage');
 check(cityAirStrikeDamage('fighter',{aa:true,f:1,tile:land})===1350,'City AA protection retained');
 return {mechaKnight:[1220,66],antiTank:[14,85,4.5],airborne:[510,1100,20,90,3,2,1],fighter:[1300,30,3000]};
}
const runSource=`(${verifyBalance.toString()})()`;
new Function('require','__dirname',harness.slice(0,start)+`
(async()=>{
 await Promise.all(pending);
 const report=await run(${JSON.stringify(runSource)});
 assert.deepEqual(errors,[]);
 console.log('PASS v1.11.95 live combat, resources, range and save migration',JSON.stringify(report));
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
