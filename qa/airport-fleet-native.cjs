'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'native-test.cjs');
const prelude=fs.readFileSync(filename,'utf8').split("assert.equal(run('appScreen'),'title');")[0];
const scenario=async function(){
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 player=0;setup();started=true;setAppScreen('game');busy=false;menuMode=false;sound=false;delay=async()=>{};
 units=[];missileBases=[];money.fill(1000000);oil.fill(100000);food.fill(100000);tech.fill(0);
 const home=cities.find(q=>q.f===0&&q.capital),enemy=cities.find(q=>q.f===1&&q.capital),dest=cities.find(q=>q.f===0&&q!==home);
 home.airport=true;home.level=5;home.nukeUntil=0;dest.airport=true;dest.level=5;dest.nukeUntil=0;enemy.airport=true;enemy.nukeUntil=0;enemy.hp=100000;enemy.aa=false;
 for(const q of cities)q.airWing=emptyAirWing(q.f);
 const source={...home,tile:enemy.tile,airWing:emptyAirWing(0)},target=enemy.tile;
 const before={g:money[0],f:food[0],o:oil[0],units:units.length};
 check(produceAircraft(home,'fighter'),'fighter manufacture');
 check(money[0]===before.g-500&&food[0]===before.f-200&&oil[0]===before.o-20,'exact fighter production cost');
 check(units.length===before.units&&!canProduce(home,4,1),'planes are not map units');
 check(airWing(home).fighter.total===0&&home.aircraftJob.type==='fighter','production waits for next own turn');
 check(!produceAircraft(home,'bomber')&&!produceAircraft(home,'strategic')&&!canProduce(home,0,1),'one shared production order per city');
 beginAirportFactionTurn(0);check(airWing(home).fighter.total===0,'same turn cannot finish aircraft');
 turn++;beginAirportFactionTurn(1);check(airWing(home).fighter.total===0,'enemy turn cannot finish aircraft');
 beginAirportFactionTurn(0);check(airWing(home).fighter.total===1&&!home.aircraftJob,'next owner turn finishes exactly once');
 beginAirportFactionTurn(0);check(airWing(home).fighter.total===1,'completion is idempotent');
 home.produced=false;

 const f0=aircraftReady(home,'fighter');check(useAircraft(home,'fighter')&&aircraftReady(home,'fighter')===f0-1,'one sortie consumes readiness');
 check(!useAircraft(home,'fighter'),'same survivor cannot fly twice');
 beginAirportFactionTurn(1);check(aircraftReady(home,'fighter')===0,'other faction never restores readiness');
 beginAirportFactionTurn(0);check(aircraftReady(home,'fighter')===1,'owner turn restores survivor');
 check(transferAircraft(home,dest,'fighter',1),'ready-plane transfer');
 check(airWing(home).fighter.total===0&&airWing(dest).fighter.total===1&&aircraftReady(dest,'fighter')===0,'transfer moves stock but cannot create fresh sorties');
 check(!transferAircraft(dest,home,'fighter',1),'transfer loop cannot refresh spent aircraft');
 beginAirportFactionTurn(0);check(aircraftReady(dest,'fighter')===1,'transferred aircraft ready next own turn');
 check(!transferAircraft(dest,enemy,'fighter',1),'no enemy transfer');
 // Real conventional flight with no defense: exact city hit and one flight per aircraft.
 aircraftRandom=()=>.99;airWing(source).fighter.total=1;const hp=enemy.hp,g=money[0],o=oil[0];
 check(await airStrike(source,'fighter',target,true),'inventory raid succeeds');
 check(enemy.hp===hp-3000&&money[0]===g&&oil[0]===o-30,'raid damage and no repeated purchase charge');
 check(airWing(source).fighter.total===1&&aircraftReady(source,'fighter')===0,'survivor remains stocked and spent');
 check(!await airStrike(source,'fighter',target,true),'unlimited repeat blocked');
 check(!fx.findLast(e=>e.kind==='airraid'&&e.f===0).crash,'survivor uses original flight');
 check(AIR_MISSIONS.fighter.range===AIR_MISSIONS.bomber.range&&AIR_MISSIONS.fighter.range===12,'fighter and bomber both range 12');
 // Local region ownership, not nearest airport, determines automatic interception.
 airWing(source).fighter.used=0;airWing(enemy).fighter.total=1;
 aviationResearch(0).performance=2;aviationResearch(1).performance=1;
 let rolls=0;aircraftRandom=()=>{rolls++;return .5};
 const strongerHP=enemy.hp;check(await airStrike(source,'fighter',target,true),'higher performance attack');
 check(enemy.hp===strongerHP-3000&&airWing(enemy).fighter.total===0&&airWing(source).fighter.total===1,'higher attacker wins and only interceptor stock falls');
 check(rolls===0,'unequal levels require no combat coin toss');
 const dogfight=fx.findLast(e=>e.airRole==='interceptor');
 check(dogfight&&dogfight.crash&&!dogfight.opponent.crash,'losing defender crashes; winning attacker returns');
 check(Math.hypot(dogfight.tx-dogfight.x,dogfight.ty-dogfight.y)>1,'interceptor travels to attacker rather than hovering over city');
 drawMissionAircraft(dogfight,.35);drawMissionAircraft(dogfight,.75);

 airWing(source).fighter.used=0;airWing(enemy).fighter.total=1;airWing(enemy).fighter.used=0;aviationResearch(0).performance=0;aviationResearch(1).performance=3;
 const protectedHP=enemy.hp;check(await airStrike(source,'fighter',target,true),'lower attacker sortie executes');
 check(enemy.hp===protectedHP&&airWing(source).fighter.total===0&&airWing(enemy).fighter.total===1&&aircraftReady(enemy,'fighter')===0,'higher defender wins outside own turn; no ground damage');
 check(fx.findLast(e=>e.kind==='airraid'&&e.f===0).crash,'intercepted attacker crashes');
 check(!fx.findLast(e=>e.airRole==='interceptor').crash,'winning defender returns');

 // Equal levels split exactly at 0.5; exhausted defending stock cannot intercept again.
 aviationResearch(0).performance=aviationResearch(1).performance=1;
 airWing(source).fighter.total=1;airWing(source).fighter.used=0;airWing(enemy).fighter.used=0;aircraftRandom=()=>.4999;
 check(await airStrike(source,'fighter',target,true)&&airWing(enemy).fighter.total===0,'equal rank lower half attacker wins');
 airWing(source).fighter.used=0;airWing(enemy).fighter.total=1;airWing(enemy).fighter.used=0;aircraftRandom=()=>.5;
 const tieHP=enemy.hp;check(await airStrike(source,'fighter',target,true)&&enemy.hp===tieHP&&airWing(source).fighter.total===0,'equal rank upper half defender wins');
 airWing(source).fighter.total=1;airWing(source).fighter.used=0;const spentDef=airWing(enemy).fighter.used;
 check(await airStrike(source,'fighter',target,true)&&airWing(enemy).fighter.used===spentDef,'spent interceptor cannot scramble again');
 // A different city's fighters do not defend this region.
 airWing(enemy).fighter.total=0;const remote=cities.find(q=>q.f===1&&q!==enemy);remote.airport=true;airWing(remote).fighter.total=20;
 check(interceptingAirport(0,target)===null,'unrelated regional city cannot intercept');
 // SAM damage applies before one 70% loss roll, even with overlapping batteries.
 airWing(enemy).fighter.total=0;aviationResearch(0).stealth=0;
 missileBases=[{id:9001,f:1,kind:'sam',tile:target,hp:34000,remaining:0},{id:9002,f:1,kind:'sam',tile:target,hp:34000,remaining:0}];
 airWing(source).bomber.total=1;aircraftRandom=()=>{rolls++;return .69999};rolls=0;
 const samHP=enemy.hp;check(await airStrike(source,'bomber',target,true),'SAM-protected raid');
 check(samHP-enemy.hp===2500,'SAM halves actual bomber city damage once');
 check(airWing(source).bomber.total===0&&rolls===1,'overlapping SAMs make a single loss roll after damage');
 const crash=fx.findLast(e=>e.kind==='airraid'&&e.f===0);check(crash.crash,'SAM loss marks crash animation');
 let smoke=0;const oldCircle=circle;circle=function(x,y,r,color){if(color==='#273038')smoke++;return oldCircle(x,y,r,color)};try{drawMissionAircraft(crash,.8)}finally{circle=oldCircle}check(smoke>=9,'crash renderer emits actual smoke trail');
 missileBases=[]; // The destroyed ground facility path is independently tested below.
 // Ground direct and all-class adjacent splash damage.
 units=[];const land=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&distance(i,home.tile)<=8&&neighbors(i).some(j=>tiles[j].owner>=0&&!cityAt(j)));
 const neighbor=neighbors(land).find(i=>tiles[i].owner>=0&&!cityAt(i));const rifle=makeUnit(1,0,land,4),splash=makeUnit(1,0,neighbor,4);rifle.hp=splash.hp=10000;
 const field={...home,tile:land,airWing:emptyAirWing(0)},direct=aircraftGroundDamage(rifle),area=Math.round(150*bombProtection(splash,null)*specialIncomingFactor(splash));
 for(const type of AIRCRAFT_TYPES){airWing(field)[type].total=1;airWing(field)[type].used=0;const dh=rifle.hp,ah=splash.hp;check(await airStrike(field,type,land,true),'all classes bomb ground');check(dh-rifle.hp===direct&&ah-splash.hp===area,'300 direct / 150 area with existing protection')}
 // Clicking a SAM target must launch the mission rather than open battery information.
 units=[];missileBases=[{id:9004,f:1,kind:'sam',tile:land,hp:34000,remaining:0,facing:1}];
 airWing(home).fighter.total=1;airWing(home).fighter.used=0;aircraftRandom=()=>.99;
 selected={kind:'city',id:home.id};airTarget={city:home.id,type:'fighter'};panelOpen=false;menuMode=false;cam.x=pxy(land).x;cam.y=pxy(land).y;cam.z=1;
 check(await tap(screenW/2,screenH/2),'SAM map tap launches an actual air mission');check(missileBases[0].hp===32200&&!menuMode,'SAM target tap cannot open defense modal');missileBases=[];
 for(let level=0;level<=10;level++){aviationResearch(0).stealth=level;check(Math.abs(samAircraftLossChance(0)-(.7-level*.05))<1e-9,'stealth stage loss probability '+level)}
 // Transport consumes one ready fighter permanently, never on an invalid order.
 units=[];missileBases=[];for(const c of cities)if(c.f!==0)airWing(c).fighter.total=0;
 const landing=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&!baseAt(i)&&distance(i,home.tile)>0&&distance(i,home.tile)<=AIR_MISSIONS.transport.range);
 home.airport=true;airWing(home).fighter.total=2;airWing(home).fighter.used=0;
 const dg=money[0],df=food[0],doo=oil[0];check(await airStrike(home,'transport',landing,true),'valid drop');
 check(airWing(home).fighter.total===1&&airWing(home).fighter.used===0,'drop consumes exactly one fighter');
 check(money[0]===dg-AIR_MISSIONS.transport.cost&&food[0]===df-AIR_MISSIONS.transport.food&&oil[0]===doo-AIR_MISSIONS.transport.oil,'drop exact resource costs');
 check(!await airStrike(home,'transport',landing,true)&&airWing(home).fighter.total===1,'occupied target cannot spend another fighter');
 airWing(home).fighter.used=1;units=[];check(!canAirStrike(home,'transport',landing),'spent stock cannot fund a drop');
 airWing(home).fighter.used=0;
 // Three-turn airport: exact resources, same-turn idempotence and completion boundary.
 const build=cities.find(q=>q.f===0&&q!==home&&q!==dest);build.level=5;build.airport=false;build.nukeUntil=0;delete build.airportJob;
 const costG=money[0],costO=oil[0];check(buildFacility(build,'airport'),'airport construction starts');
 check(money[0]===costG-15000&&oil[0]===costO-100&&!build.airport&&build.airportJob.remaining===3,'15k gold /100 oil/3 turns');
 check(!buildFacility(build,'airport')&&!produceAircraft(build,'fighter'),'pending airport cannot rebuild or manufacture');
 await industryTurn();check(build.airportJob.remaining===3,'same turn does not advance build');
 for(let n=1;n<=3;n++){turn++;await industryTurn();check(n===3?build.airport&&!build.airportJob:!build.airport&&build.airportJob.remaining===3-n,'construction completion '+n)}
 // Research: specified performance price; stealth lab, level cap and persisted job.
 const a=aviationResearch(0);a.job=null;a.stealth=0;a.performance=0;home.lab=false;money[0]=200000;oil[0]=10000;
 check(!studyAviation(home,'stealth'),'stealth requires lab');const rg=money[0],ro=oil[0];check(studyAviation(home,'performance'),'performance research');
 check(money[0]===rg-40000&&oil[0]===ro-450&&a.job.remaining===2,'performance exact 40000 /450 /2 turns');
 check(localResearchJob(home).key==='performance'&&studyReason(home,'ballistic'),'research occupies the city');
 turn++;await industryTurn();check(a.performance===0&&a.job.remaining===1,'research not early');turn++;await industryTurn();check(a.performance===1&&!a.job,'research completes once');await industryTurn();check(a.performance===1,'research no double completion');
 home.lab=true;check(studyAviation(home,'stealth'),'stealth starts with lab');turn+=2;await industryTurn();check(a.stealth===1,'stealth completes');a.stealth=10;check(!studyAviation(home,'stealth'),'stealth cap10');
 // Prepare a genuine save/load fixture and an old v1.12.3 map fighter.
 units=[];missileBases=[];home.airWing=emptyAirWing(0);airWing(home).fighter.total=3;airWing(home).fighter.used=1;
 home.aircraftJob={owner:0,type:'bomber',startedTurn:turn};home.lastAircraftOrderTurn=turn;
 dest.airport=false;dest.airportJob={owner:0,remaining:2,total:3,lastTick:turn};
 a.stealth=4;a.job={key:'performance',owner:0,city:home.id,next:2,remaining:1,total:2,lastTick:turn};
 const oldFighter=makeUnit(0,4,home.tile,1);oldFighter.airPatrol=true;oldFighter.airPatrolLeft=1;
 save(9);window.airportSaveFixture={home:home.id,dest:dest.id,turn};
 return {inventory:true,interception:true,damage:true,sam:true,smoke:true,construction:true,research:true};
};
const tail=`(async()=>{await Promise.all(pending);const report=await run(${JSON.stringify('('+scenario.toString()+')()')});assert(await drain(run('load(9)')));assert(run("units.every(u=>!isAircraft(u))"));assert.equal(run('airWing(cities[airportSaveFixture.home]).fighter.total'),4);assert.equal(run('airWing(cities[airportSaveFixture.home]).fighter.used'),1);assert.equal(run('cities[airportSaveFixture.dest].airportJob.remaining'),2);assert.equal(run('cities[airportSaveFixture.home].aircraftJob.type'),'bomber');assert.equal(run('cities[airportSaveFixture.home].aircraftJob.startedTurn'),run('turn'));assert.equal(run('aviationResearch(0).stealth'),4);assert.equal(run('aviationResearch(0).job.remaining'),1);assert.deepEqual(errors,[]);console.log('PASS airport fleet actual engine + real legacy save/load',JSON.stringify(report));process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});`;
const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(__dirname);m._compile(prelude+tail,filename);
