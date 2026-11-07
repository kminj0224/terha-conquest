'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8797','--bind','127.0.0.1'],{cwd:process.env.TERHA_TEST_ROOT||path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:800,height:360}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8797/game/assets/index.html');await page.locator('#appStart:not([disabled])').waitFor();
  await page.evaluate(()=>{
   player=0;setup();started=true;setAppScreen('game');units=[];missileBases=[];money.fill(1000000);food.fill(100000);oil.fill(100000);sound=false;
   window.fleetHome=cities.find(q=>q.f===0&&q.capital);fleetHome.level=5;fleetHome.airport=true;fleetHome.lab=true;fleetHome.nukeUntil=0;
   window.fleetDest=cities.find(q=>q.f===0&&q!==fleetHome);fleetDest.airport=true;fleetDest.level=5;fleetDest.nukeUntil=0;
   window.fleetEnemy=cities.find(q=>q.f===1&&q.capital);
   const tile=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&distance(i,fleetHome.tile)>=2&&distance(i,fleetHome.tile)<=8);
   tiles[fleetEnemy.tile].city=-1;fleetEnemy.tile=tile;tiles[tile].city=fleetEnemy.id;tiles[tile].region=fleetEnemy.id;tiles[tile].owner=1;fleetEnemy.hp=100000;fleetEnemy.aa=false;fleetEnemy.nukeUntil=0;
   for(const q of cities)q.airWing=emptyAirWing(q.f);aircraftRandom=()=>.99;selectCity(fleetHome,true);cityCommandOpen('air');
  });
  assert.equal(await page.locator('#airspaceToggle').count(),0);assert.equal(await page.locator('#startAirPatrol').count(),0);
  for(const type of ['fighter','bomber','strategic'])assert((await page.locator('#airportFleet-'+type).textContent()).includes('재고 0'));
  const count=await page.evaluate(()=>units.length),gold=await page.evaluate(()=>money[0]);
  await page.locator('#airProduce-fighter').click();assert.equal(await page.evaluate(()=>units.length),count);assert.equal(await page.evaluate(()=>money[0]),gold-500);assert((await page.locator('#airportFleet-fighter').textContent()).includes('재고 1'));
  await page.locator('#airSortie-fighter').click();
  await page.evaluate(()=>{const i=fleetEnemy.tile,p=pxy(i);cam.x=p.x;cam.y=p.y;cam.z=1;tap(screenW/2,screenH/2)});
  await page.waitForFunction(()=>!busy);assert.equal(await page.evaluate(()=>aircraftReady(fleetHome,'fighter')),0);assert.equal(await page.evaluate(()=>airWing(fleetHome).fighter.total),1);assert.equal(await page.evaluate(()=>fleetEnemy.hp),97000);
  await page.evaluate(()=>{selectCity(fleetHome,true);cityCommandOpen('air')});await page.locator('#airProduce-fighter').click();await page.locator('#airTransfer-fighter').click();
  await page.locator('#airTransferTo').selectOption(String(await page.evaluate(()=>fleetDest.id)));await page.locator('#airTransferCount').fill('1');await page.locator('#airTransferConfirm').click();
  assert.equal(await page.evaluate(()=>airWing(fleetDest).fighter.total),1);assert.equal(await page.evaluate(()=>aircraftReady(fleetDest,'fighter')),0);
  // Smoke/crash animation and post-hit stock loss are exercised in the real renderer.
  await page.evaluate(()=>{
   beginAirportFactionTurn(0);aircraftRandom=()=>0;aviationResearch(0).performance=1;airWing(fleetEnemy).fighter.total=0;
   missileBases=[{id:99901,f:1,kind:'sam',tile:fleetEnemy.tile,hp:34000,remaining:0,facing:1}];
   window.fleetSmoke=0;const original=circle;circle=function(x,y,r,color){if(color==='#273038')fleetSmoke++;return original(x,y,r,color)};
   selectCity(fleetHome,true);cityCommandOpen('air');
  });
  await page.locator('#airSortie-fighter').click();await page.evaluate(()=>{const p=pxy(fleetEnemy.tile);cam.x=p.x;cam.y=p.y;cam.z=1;tap(screenW/2,screenH/2)});
  try{await page.waitForFunction(()=>!busy&&fleetSmoke>0)}catch(e){console.log('FLEET_STATE',await page.evaluate(()=>({busy,menuMode,airTarget,smoke:fleetSmoke,stock:airWing(fleetHome),effects:fx.map(e=>({kind:e.kind,crash:e.crash}))})));console.log('BROWSER_ERRORS',errors);throw e};assert.equal(await page.evaluate(()=>airWing(fleetHome).fighter.total),0);
  fs.mkdirSync('qa/campaign-previews',{recursive:true});await page.screenshot({path:'qa/campaign-previews/airport-fleet-crash.png'});
  // National research is offered through the existing city science tab.
  await page.evaluate(()=>{missileBases=[];selectCity(fleetHome,true);cityCommandOpen('science')});
  assert((await page.locator('#airResearch-performance').textContent()).includes('40000'));await page.locator('#airResearch-performance').click();assert.equal(await page.evaluate(()=>aviationResearch(0).job.key),'performance');
  // Construction progress is separate from already completed airports.
  await page.evaluate(()=>{
   window.fleetBuild=cities.find(q=>q.f===0&&q!==fleetHome&&q!==fleetDest);fleetBuild.level=5;fleetBuild.airport=false;fleetBuild.nukeUntil=0;delete fleetBuild.airportJob;selectCity(fleetBuild,true);cityCommandOpen('overview');
  });
  const build=page.locator('#cityOverviewFacilities button').filter({hasText:'공항 건설'});assert((await build.textContent()).includes('15000')||(await build.textContent()).includes('15,000'));assert((await build.textContent()).includes('100'));assert((await build.textContent()).includes('3턴'));await build.click();
  assert.equal(await page.evaluate(()=>fleetBuild.airportJob.remaining),3);assert.equal(await page.evaluate(()=>fleetBuild.airport),false);
  for(const [w,h]of [[800,360],[640,360],[390,844]]){
   await page.setViewportSize({width:w,height:h});await page.evaluate(()=>{selectCity(fleetHome,true);cityCommandOpen('air')});
   const scroll=page.locator('#panel .windowContent');assert(await scroll.count());await page.locator('#airProduce-strategic').scrollIntoViewIfNeeded();const r=await page.locator('#airProduce-strategic').boundingBox();assert(r&&r.y>=0&&r.y+r.height<=h,'inventory action reachable');
  }
  await page.screenshot({path:'qa/campaign-previews/airport-fleet-inventory.png'});
  assert(await page.evaluate(async()=>{const expected=airWing(fleetDest).fighter.total;save(9);await load(9);return airWing(cities[fleetDest.id]).fighter.total===expected&&cities[fleetBuild.id].airportJob.remaining===3&&aviationResearch(0).job.key==='performance'&&units.every(u=>!isAircraft(u))}));
  for(const lang of ['ko','en']){await page.evaluate(lang=>{appSettings.language=lang;showHelp('game')},lang);const text=await page.locator('#modal').textContent();assert(text.includes(lang==='ko'?'공항 건설과 항공기 재고':'Airports and aircraft inventory'));assert(text.includes(lang==='ko'?'70%':'70%'));assert(text.includes(lang==='ko'?'40,000':'40,000'))}
  assert.deepEqual(errors,[]);console.log('PASS real airport inventory UI, production without units, sortie budgets, transfer, smoke crash, research, 3-turn construction, mobile scrolling and save/load');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
