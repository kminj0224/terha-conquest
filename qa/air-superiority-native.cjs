'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'native-test.cjs');
const prelude=fs.readFileSync(filename,'utf8').split("assert.equal(run('appScreen'),'title');")[0];
const scenario=async function(){
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 player=0;setup();started=true;setAppScreen('game');busy=false;menuMode=false;sound=false;
 units=[];missileBases=[];tech.fill(0);money.fill(200000);oil.fill(100000);food.fill(100000);
 const source=cities.find(q=>q.f===0&&q.capital);source.airport=true;source.nukeUntil=0;source.level=5;
 const target=cities.find(q=>q.f===1&&q.capital),oldTarget={...target};
 // A source object placed close to the target exercises the real mission path.
 const airport={...source,tile:target.tile,name:'Air test',f:0};target.aa=false;target.nukeUntil=0;target.hp=100000;
 const nearby=neighbors(target.tile).filter(i=>!cityAt(i));check(nearby.length>=3,'patrol deployment positions');
 check(canProduce(source,4,1)&&!canProduce(source,7,1),'fighter production enabled, bombers stay airport missions');source.airport=false;check(!canProduce(source,4,1),'fighter needs airport');source.airport=true;
 const patrol=(f,tile,level=1)=>{const u=makeUnit(f,4,tile,level);check(startAirPatrol(u,true),'start patrol');return u};
 check(airMissionPlan(airport,'bomber',target.tile).factor===1,'no patrol preserves original damage');
 check(airspaceState(0,0)===tr('미통제','Uncontrolled'),'uncontrolled empty airspace');
 const oilBeforePatrol=oil[1],defender=patrol(1,nearby[0]);check(oilBeforePatrol-oil[1]===8,'exact patrol fuel');
 check(defender.airPatrolLeft===2&&!mayMove(defender)&&!mayFire(defender),'patrol spends orders');
 check(!canCounterattack(defender,{f:0,hp:100,tile:target.tile,type:4}),'no free ordinary counterfire');
 const charged=oil[1];check(!startAirPatrol(defender,true)&&oil[1]===charged,'cannot restart or replenish patrol');
 const unescorted=airMissionPlan(airport,'bomber',target.tile);
 check(unescorted.factor<1&&unescorted.defenders.length===1,'enemy patrol reduces damage');
 const escort=patrol(0,nearby[1]);
 const escorted=airMissionPlan(airport,'bomber',target.tile);
 check(escorted.factor>unescorted.factor&&escorted.escorts.length===1,'escorts improve breakthrough');
 const beforeDef=defender.hp,beforeEscort=escort.hp,gold=money[0],fuel=oil[0],expected=Math.round(cityAirStrikeDamage('bomber',target)*escorted.factor),hp=target.hp;
 check(await airStrike(airport,'bomber',target.tile,true),'real intercepted bombing');
 check(hp-target.hp===expected,'preview factor matches actual city damage');
 check(defender.hp<beforeDef&&escort.hp<beforeEscort,'both patrols take combat losses');
 check(defender.airPatrolLeft===1&&escort.airPatrolLeft===1,'each battle consumes one use');
 check(money[0]===gold-AIR_MISSIONS.bomber.cost&&oil[0]===fuel-AIR_MISSIONS.bomber.oil,'original sortie charged exactly once');
 const third=patrol(2,nearby[2]);diplomacy[0][2]=diplomacy[2][0]='war';
 check(!airMissionPlan(airport,'fighter',target.tile).defenders.includes(third),'third country never joins target defense');
 const savedTurns=defender.airPatrolLeft;freshOrders(third);check(defender.airPatrolLeft===savedTurns,'other faction does not recharge defenders');
 await airStrike(airport,'fighter',target.tile,true);
 check(defender.airPatrolLeft===0&&escort.airPatrolLeft===0&&!patrolActive(defender),'two battles exhaust patrol');
 check(airMissionPlan(airport,'bomber',target.tile).factor===1,'exhausted patrol cannot intercept');
 freshOrders(defender);check(!defender.airPatrol&&canStartPatrol(defender),'owner next orders end old patrol');
 oil[1]=7;check(!startAirPatrol(defender,true),'patrol checks oil for AI too');oil[1]=100000;
 startAirPatrol(defender,true);defender.airPatrolLeft=1;
 const snap=JSON.parse(JSON.stringify(snapshot()));migrateArmy(snap);
 const restored=units.find(u=>u.id===defender.id);check(restored&&restored.airPatrolLeft===1&&restored.airPatrol&&!mayFire(restored),'save migration preserves actual active fighter');
 source.queue={type:4,level:1,aa:false};const queued=JSON.parse(JSON.stringify(snapshot())),beforeRefund=food[0];units=queued.units;migrateArmy(queued);check(cities[source.id].queue?.type===4&&food[0]===beforeRefund,'fighter queues survive migration without refund');source.queue=null;
 const legacy=JSON.parse(JSON.stringify(snapshot()));for(const u of legacy.units){delete u.airPatrol;delete u.airPatrolLeft}units=legacy.units;migrateArmy(legacy);
 check(units.every(u=>!u.airPatrol),'legacy save gains no free patrols');
 // Ground-target and splash damage use the same factor; no new SAM stack.
 units=[];missileBases=[];const ground=makeUnit(1,0,nearby[0],4),adj=neighbors(ground.tile).find(i=>i!==target.tile&&!cityAt(i)&&i!==nearby[1]);
 const splash=makeUnit(1,0,adj,4),guard=patrol(1,nearby[1]);
 const plain=airMissionPlan(airport,'bomber',ground.tile);check(plain.factor<1,'ground intercept');
 const gh=ground.hp,sh=splash.hp,baseline=Math.max(1,Math.round(Math.max(16,AIR_MISSIONS.bomber.damage-Math.round(unitArmor(ground)*.35))*bombProtection(ground,null)*specialIncomingFactor(ground)));
 await airStrike(airport,'bomber',ground.tile,true);
 check(gh-ground.hp===Math.round(baseline*plain.factor),'ground damage scaled');
 check(sh-splash.hp===Math.round(19*bombProtection(splash,null)*specialIncomingFactor(splash)*plain.factor),'splash damage scaled');
 // Defense facility uses its existing SAM protection once, alongside interception.
 units=[];missileBases=[{id:9999,f:1,kind:'sam',tile:nearby[0],hp:20000,remaining:0,nukeUntil:0}];
 const facility=missileBases[0];patrol(1,nearby[1]);const protection=samAirProtection(facility),bp=airMissionPlan(airport,'bomber',facility.tile),bh=facility.hp;
 check(await airStrike(airport,'bomber',facility.tile,true),'facility strike');
 check(bh-facility.hp===Math.round(AIR_MISSIONS.bomber.damage*12*protection*bp.factor),'facility SAM protection not doubled');
 // Transport is explicitly unchanged, even inside a hostile patrol.
 const landing=nearby.find(i=>!unitAt(i)&&!baseAt(i)&&tiles[i].owner>=0);
 check(airMissionPlan(airport,'transport',landing).factor===1,'transport excluded');
 // AI selects patrol instead of a ground shot when protecting a threatened city.
 units=[];missileBases=[];const aiFighter=makeUnit(1,4,nearby[0],1);makeUnit(0,0,nearby[1],1);oil[1]=10000;
 check(aiStep(aiFighter,cities)===null&&aiFighter.airPatrol,'AI starts local defense patrol');
 check(AIR_PATROL_RANGE===4&&AIR_PATROL_OIL===8,'rule constants');
 // Range edge and health weighting.
 const edge=tiles.findIndex((t,i)=>distance(aiFighter.tile,i)===4),outside=tiles.findIndex((t,i)=>distance(aiFighter.tile,i)===5);
 check(patrolPower(aiFighter,edge)>0&&patrolPower(aiFighter,outside)===0,'four tile range edge');
 const full=patrolPower(aiFighter,aiFighter.tile);aiFighter.hp/=2;check(Math.abs(patrolPower(aiFighter,aiFighter.tile)-full/2)<.001,'health scales air power');
 Object.assign(target,oldTarget);
 return {range:4,uses:2,oil:8,previewDamage:expected,legacySaves:true,aiPatrol:true};
};
const tail=`(async()=>{await Promise.all(pending);const report=await run(${JSON.stringify('('+scenario.toString()+')()')});assert.deepEqual(errors,[]);console.log('PASS air superiority actual engine',JSON.stringify(report));process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});`;
const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(__dirname);m._compile(prelude+tail,filename);
