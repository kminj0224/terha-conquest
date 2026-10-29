'use strict';
const source=require('fs').readFileSync(require('path').join(__dirname,'native-test.cjs'),'utf8').split("assert.equal(run('appScreen'),'title')")[0];
new Function('require','__dirname',source+`
(async()=>{
 await Promise.all(pending);run("player=7;setup();started=true;setAppScreen('game');menuMode=false;busy=false");await settle();
 const summary=run(\`(()=>{
  const check=(v,m)=>{if(!v)throw Error(m)};
  check(factions.length===8&&factions[7].name==='가르다라','Country identity');
  check(cities.length===190,'190 cities');const local=cities.filter(q=>q.origin===7);
  check(local.length===9&&local.find(q=>q.capital).name==='부루다라','Nine cities and capital');
  check(!missileBases.some(b=>b.f===7),'No initial Gardara defense batteries');check(units.some(u=>u.f===7)&&units.filter(u=>u.f===7).every(u=>TYPES[u.type].branch==='infantry'),'Infantry-only initial roster');
  check(units.filter(u=>u.f===7).every(u=>tiles[u.tile].owner===7),'Own land');
  check(GARDARA_TILES.length>180&&GARDARA_TILES.length<400,'Medium continent');
  const min=(f)=>Math.min(...GARDARA_TILES.map(i=>Math.min(...tiles.map((t,j)=>MAP.tiles[j][0]===f?distance(i,j):Infinity))));
  const gaps={stetopia:min(2),lanna:min(4),ayria:min(3),nakwol:min(5)};check(gaps.stetopia>20&&gaps.lanna>12,'Distant continent');check(GARDARA_TILES.every(i=>tiles[i].x>31&&tiles[i].x<87&&tiles[i].y>95),'Between Ayria and Nakwol in southern ocean');
  const home=local.find(q=>q.capital);check(canProduce(home,GARDARA_GUARD,1),'Special production permitted');
  check(!canProduce(cities.find(q=>q.origin===0),GARDARA_GUARD,1),'Foreign special blocked');
  const guard=makeUnit(7,GARDARA_GUARD,home.tile,1);check(canCaptureCityUnit(guard),'Guard capture');
  check(Number.isFinite(unitAttack(guard))&&Number.isFinite(unitMaxHp(guard)),'Special stats');units=units.filter(u=>u!==guard);
  check(money.length===8&&tech.length===8&&food.length===8&&oil.length===8&&militaryResearchJobs.length===8,'All resources and research cover Gardara');
  check(diplomacy.length===8&&diplomacy.every(r=>r.length===8)&&diplomacy[7].every((r,f)=>r===(f===7?'self':'neutral')),'Neutral diplomacy');
  for(const q of local)check(tiles[q.tile].city===q.id&&regionTiles[q.id].includes(q.tile),'Region ownership');
  const land=new Set([GARDARA_TILES[0]]),queue=[GARDARA_TILES[0]];for(let n=0;n<queue.length;n++)for(const j of neighbors(queue[n]))if(MAP.tiles[j][0]===7&&!land.has(j)){land.add(j);queue.push(j)}check(land.size===GARDARA_TILES.length,'Connected continent');
  return{cities:cities.length,landTiles:GARDARA_TILES.length,gaps,starting:units.filter(u=>u.f===7).map(u=>TYPES[u.type].name),special:GARDARA_GUARD};
 })()\`);console.log(summary);
 run("showStart()");assert.equal(nodes.get('factions').children.length,8);assert(nodes.get('factions').children[7].innerHTML.includes('flag-7.jpg'));
 run("setAppScreen('game');selectCity(cities.find(q=>q.origin===7&&q.capital),true);cityCommandOpen('units')");
 run("productionPanel(cities.find(q=>q.origin===7&&q.capital))");assert(nodes.has('gardaraGuardProductionRow'));
 run("money[7]=10000;food[7]=10000;oil[7]=10000;const ghome=cities.find(q=>q.origin===7&&q.capital);ghome.produced=false;produce(ghome,GARDARA_GUARD,1,false)");
 assert.equal(run('ghome.queue.type'),run('GARDARA_GUARD'));run('ghome.queue=null;ghome.produced=false');
 run("save();const freshGardara=snapshot();localStorage.setItem('terha-slot-9',JSON.stringify(freshGardara))");assert.equal(await drain(run('load(9)')),true);assert.equal(run('cities.filter(q=>q.origin===7).length'),9);
 // A real prior seven-country save keeps prior money, diplomacy, owners and armies.
 run(\`const oldGardara=snapshot();oldGardara.cities=oldGardara.cities.filter(q=>q.origin!==7);oldGardara.units=oldGardara.units.filter(u=>u.f!==7);oldGardara.player=0;oldGardara.owners=oldGardara.owners.slice(0,15552);for(const key of ['money','food','oil','tech','strategicResearch'])oldGardara[key]=oldGardara[key].slice(0,7);oldGardara.money[0]=5432;oldGardara.diplomacy=oldGardara.diplomacy.slice(0,7).map(r=>r.slice(0,7));oldGardara.diplomacy[0][1]='neutral';oldGardara.diplomacy[1][0]='neutral';delete oldGardara.gardaraSchema;localStorage.setItem('terha-slot-8',JSON.stringify(oldGardara))\`);
 assert.equal(await drain(run('load(8)')),true);assert.equal(run('money[0]'),5432);assert.equal(run('diplomacy[0][1]'),'neutral');assert.equal(run('cities.length'),190);assert.equal(run('cities.filter(q=>q.origin===7).length'),9);run('save(8)');assert.equal(await drain(run('load(8)')),true);assert.equal(run('cities.length'),190);
 run("player=7;focusCapital();cam.z=.65;menuMode=false;setAppScreen('game');selected=null;panelOpen=false;draw(performance.now())");await settle();
 fs.mkdirSync(path.resolve(__dirname,'../previews'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../previews/Gardara-v1.11.72.png'),main.toBuffer('image/png'));
 run("cam.x=WORLD_LEFT+WORLD_WIDTH/2;cam.y=WORLD_TOP+WORLD_HEIGHT/2;cam.z=.12;draw(performance.now())");fs.writeFileSync(path.resolve(__dirname,'../previews/Gardara-world-v1.11.72.png'),main.toBuffer('image/png'));
 assert.deepEqual(errors,[]);console.log('PASS Gardara country, distant tropical continent, nine cities, infantry seed, production, capture, native art, save/reload and seven-country migration');
})().catch(e=>{console.error(e);process.exitCode=1});
`)(require,__dirname);
