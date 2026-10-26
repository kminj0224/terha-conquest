'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8'),at=source.indexOf("assert.equal(run('appScreen'),'title');");
new Function('require','__dirname',source.slice(0,at)+`
(async()=>{
 console.log('Loading images');await Promise.all(pending);console.log('Images ready');run('player=0;setup();started=true;setAppScreen("game");aiFastForward=true');
 const report=await run(\`(async()=>{
 console.log('Balance and descriptions');const check=(v,m)=>{if(!v)throw Error(m)};
 check(!TYPES[22].text.includes('사거리'),'Fast craft duplicate range removed');
 check(unitPrice(6,1)===780,'Black Legion food');
 check(TYPES[SAPROS].hp===520&&TYPES[SAPROS].move===2,'Sapros baseline');
 check(!TYPES[9].antiArmor,'Anti-tank multiplier removed');
 for(const [k,t] of TYPES.entries())check(!/1단계 기본 체력|생산 식량|(?<!병력 )사거리 [0-9]|공격력 [0-9]+,|이동력 [0-9]+칸/.test(t.text),'Duplicate stats '+k+': '+t.text);
 units=[];tech.fill(0);
 const tile=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&!RANNA_RIVER_TILES.has(i));tiles[tile].terrain=1;
 const tank={type:1,f:2,level:1,tile,hp:280},at={type:9,f:0,level:1,tile,hp:135};
 const armor=TYPES[1].def;TYPES[1].def=0;const noArmor=damage(at,tank);TYPES[1].def=900;
 check(damage(at,tank)===noArmor&&noArmor===28,'Anti-tank bypass without bonus damage');
 const g={type:DEKPHUING_GUERRILLA,f:4,level:1,tile,hp:90};tiles[tile].terrain=2;
 check(unitAttack(g)===28&&rannaTerrainProtection(g)===.7,'Guerrilla +100%/30%');
 const pierce=damage(g,tank);TYPES[1].def=0;check(damage(g,tank)===pierce,'Guerrilla ignores armor');TYPES[1].def=armor;
 check(counterattackDamage(at,tank,at.hp)===Math.round(damage(at,tank)*.5),'Counterfire is 50%');
 console.log('Food actions');
 // Exact-resource success, failed actions, repeat attacks and counters use the same resource gate.
 player=3;setup();started=true;setAppScreen('game');busy=false;units=[];missileBases=[];tech.fill(0);food[3]=10000;oil[3]=100000;
 const home=cities.find(q=>q.f===3&&q.capital),s=makeUnit(3,SAPROS,home.tile,1);
 const to=[...reachable(s).costs.keys()].find(i=>i!==s.tile&&!cityAt(i));check(to!==undefined,'Sapros movement fixture');
 food[3]=18;check(moveUnit(s,to,true)&&food[3]===0,'Move consumes exactly 18');
 freshOrders(s);check(!mayMove(s)&&!moveUnit(s,home.tile,true)&&food[3]===0,'Unfunded move rejected');
 food[3]=16;freshOrders(s);const victim=makeUnit(5,0,neighbors(s.tile).find(i=>!unitAt(i)),1);victim.hp=10000;
 const range=TYPES[0].range;TYPES[0].range=0;
 check(await attack(s,victim,true)&&food[3]===0,'Attack consumes exactly 16');TYPES[0].range=range;
 freshOrders(s);check(!canAttack(s,victim),'Unfunded attack rejected');
 food[3]=16;check(canCounterattack(s,victim),'Funded counter allowed');food[3]=15;check(!canCounterattack(s,victim),'Unfunded counter rejected');
 console.log('National research');
 // National research, duplicate prevention, exact costs and elapsed-turn completion.
 player=0;setup();started=true;setAppScreen('game');busy=false;units=[];missileBases=[];money[0]=500000;oil[0]=10000;food[0]=100000;
 const lab=cities.find(q=>q.f===0&&q.capital),other=cities.find(q=>q.f===0&&q!==lab);for(const q of [lab,other]){q.level=5;q.lab=true;q.nukeUntil=0}
 const old=makeUnit(0,1,lab.tile,1),before=money[0];
 check(studyFuelEfficiency(lab)&&money[0]===before-50000,'Fuel costs 50000');check(!studyFuelEfficiency(other),'Duplicate national fuel research');
 turn++;await industryTurn();check(!strategicResearch[0].fuelEfficiency,'Fuel still pending');turn++;await industryTurn();
 check(strategicResearch[0].fuelEfficiency&&attackOil(old)===0,'Existing army receives national fuel benefit');
 const fresh=makeUnit(0,1,other.tile,1);check(attackOil(fresh)===0,'Other city receives fuel benefit');
 const m=money[0],o=oil[0];check(study(other,'supplyRoutes')&&money[0]===m-63000&&oil[0]===o-450,'Supply research exact cost');
 check(!study(lab,'supplyRoutes'),'Duplicate national route research');
 for(let n=0;n<3;n++){turn++;await industryTurn();check(!strategicResearch[0].supplyRoutes,'Four-turn research pending')}
 turn++;await industryTurn();check(strategicResearch[0].supplyRoutes,'Four-turn research complete');
 const far=cities.find(q=>distance(lab.tile,q.tile)>30);check(supplyTurns(lab,far)===1,'Distant supply takes one turn');
 const saved=JSON.parse(JSON.stringify(snapshot()));migrateArmy(saved);check(strategicResearch[0].supplyRoutes&&strategicResearch[0].fuelEfficiency,'National research save/reload');
 console.log('AI production');
 // Exercise final procurement chain, every difficulty and every nation over twelve turns.
 const nations=[];
 for(let d=0;d<3;d++)for(let f=0;f<7;f++){
  console.log('AI nation',f,'difficulty',d);player=(f+1)%7;difficulty=d;setup();started=true;busy=false;units=[];missileBases=[];tech.fill(0);
  const owned=cities.filter(q=>q.f===f&&q.origin===f);for(const q of owned){q.level=5;q.nukeUntil=0;q.queue=null;q.produced=false;cityProfile(q)}
  const special=TYPES.findIndex(t=>t.special===f),mix=new Set();let orders=0;
  for(let n=0;n<12;n++){
   turn++;food[f]=1000000;oil[f]=1000000;money[f]=1000000;
   for(const q of owned){if(q.queue){makeUnit(f,q.queue.type,q.tile,q.queue.level);q.queue=null}q.produced=false}
   aiProcure(f,owned);aiProcure(f,owned);
   const specials=owned.filter(q=>q.queue&&TYPES[q.queue.type].special===f).length;
   check(specials===(special>=0?1:0),'Special count f='+f+' d='+d+' turn='+n+' count='+specials);
   orders+=specials;for(const q of owned)if(q.queue)mix.add(q.queue.type);
  }
  check(mix.size>=8,'Poor unit variety f='+f+' d='+d+' types='+[...mix]);
  nations.push({f,d,specialOrders:orders,types:[...mix].sort((a,b)=>a-b)});
 }
 // Paid ships and paid queues cannot consume free-grant capacity.
 player=0;setup();units=[];const f=2,ports=cities.filter(q=>q.f===f&&q.harbor);check(ports.length,'AI port fixture');
 const sea=tiles.map((t,i)=>t.owner<0?i:-1).filter(i=>i>=0);
 for(let n=0;n<10;n++){const u=makeUnit(f,26,sea[n],1);u.producedAtCityId=ports[0].id}
 ports[0].queue={type:26,level:1};
 for(let n=0;n<6;n++){turn++;prepareAITransports(f,ports)}
 check(aiFreeTransportCount(f)===3,'Free cap 3 despite ten paid ships and paid queue');
 check(units.filter(u=>u.f===f&&u.type===26&&!u.aiFreeTransport).length===10,'Paid transports untouched');
 const freeSave=JSON.parse(JSON.stringify(snapshot()));migrateArmy(freeSave);check(aiFreeTransportCount(f)===3,'Free provenance survives reload');
 return {nations,freeTransports:3,paidTransports:10};
 })()\`);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'../balance-logistics-audit.json'),JSON.stringify(report,null,2));
 console.log('PASS v1.11.47 balance, armor bypass, food gates, national research, all 7 nations x 3 difficulties x 12 turns, paid/free transport accounting:',JSON.stringify(report));process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
