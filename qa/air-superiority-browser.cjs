'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8795','--bind','127.0.0.1'],{cwd:process.env.TERHA_TEST_ROOT||path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:800,height:360}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8795/game/assets/index.html');await page.locator('#appStart:not([disabled])').waitFor();
  await page.evaluate(()=>{
   player=0;setup();started=true;setAppScreen('game');units=[];missileBases=[];money.fill(200000);food.fill(200000);oil.fill(100000);sound=false;
   const q=cities.find(q=>q.f===0&&q.capital);q.airport=true;q.level=5;q.nukeUntil=0;q.queue=null;q.produced=false;
   window.testAirport=q;cityProfile(q);selectCity(q,true);cityCommandOpen('units');
  });
  assert((await page.locator('#production').textContent()).includes('초계 전투기'));
  assert(await page.evaluate(()=>canProduce(testAirport,4,1)));
  await page.evaluate(()=>{
   const q=testAirport;checkProduction=produce(q,4,1,false);if(!checkProduction)throw Error('fighter production failed');
   deploy(q);const fighter=units.find(u=>u.type===4&&u.f===0);if(!fighter)throw Error('no deployed fighter');
   window.testFighter=fighter;selectUnit(fighter,true);showPanel();
  });
  await page.locator('#startAirPatrol').click();
  assert.equal(await page.evaluate(()=>testFighter.airPatrolLeft),2);
  assert((await page.locator('#airPatrolStatus').textContent()).includes('2/2'));
  await page.locator('#airspaceToggle').click();assert.equal(await page.locator('#airspaceToggle').getAttribute('aria-pressed'),'true');
  await page.evaluate(()=>{
   panelOpen=false;refreshSelection();const q=testAirport;
   const tile=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&!unitAt(i)&&distance(q.tile,i)>=2&&distance(q.tile,i)<=5);
   const victim=makeUnit(1,0,tile,4),near=neighbors(tile).find(i=>!cityAt(i)&&!unitAt(i)&&tiles[i].owner>=0);
   const guard=makeUnit(1,4,near,1);startAirPatrol(guard,true);window.testVictim=victim;window.testGuard=guard;
   window.beforeRaid={money:money[0],oil:oil[0],uses:guard.airPatrolLeft,hp:victim.hp};
   cam.x=pxy(tile).x;cam.y=pxy(tile).y;cam.z=1;beginAirTarget(q,'bomber');
   const p=pxy(tile);tap((p.x-cam.x)*cam.z+screenW/2,(p.y-cam.y)*cam.z+screenH/2);
  });
  await page.locator('#confirmOverlay.airMissionPreview').waitFor();
  assert((await page.locator('#confirmOverlay').textContent()).includes('예상 돌파율'));
  for(const [width,height]of [[800,360],[640,360],[390,844]]){
   await page.setViewportSize({width,height});
   for(const id of ['confirmYes','confirmNo']){const r=await page.locator('#'+id).boundingBox();assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,id+' is visible')}
  }
  fs.mkdirSync('qa/campaign-previews',{recursive:true});await page.screenshot({path:'qa/campaign-previews/air-superiority-preview.png'});
  await page.locator('#confirmNo').click();await page.waitForFunction(()=>!airPreviewPending);
  assert(await page.evaluate(()=>money[0]===beforeRaid.money&&oil[0]===beforeRaid.oil&&testGuard.airPatrolLeft===beforeRaid.uses&&testVictim.hp===beforeRaid.hp));
  await page.evaluate(()=>{const p=pxy(testVictim.tile);tap((p.x-cam.x)*cam.z+screenW/2,(p.y-cam.y)*cam.z+screenH/2)});
  await page.locator('#confirmYes').click();await page.waitForFunction(()=>!airPreviewPending&&!busy);
  assert(await page.evaluate(()=>testGuard.airPatrolLeft===1&&testVictim.hp<beforeRaid.hp&&money[0]===beforeRaid.money-AIR_MISSIONS.bomber.cost));
  // Real save/load preserves the patrol and current capacity.
  assert(await page.evaluate(async()=>{save(9);const id=testGuard.id;const expected=testGuard.airPatrolLeft;await load(9);return units.some(u=>u.id===id&&u.airPatrol&&u.airPatrolLeft===expected)}));
  for(const lang of ['ko','en']){
   await page.evaluate(lang=>{appSettings.language=lang;showHelp('game')},lang);
   const text=await page.locator('#modal').textContent();assert(text.includes(lang==='ko'?'제공권·초계·요격':'Air superiority, patrols and interception'));assert(text.includes(lang==='ko'?'수송기 공수강하·핵 임무':'transport paradrops, nuclear missions'));
  }
  assert.deepEqual(errors,[]);console.log('PASS air-superiority production, patrol UI, overlay, mobile forecast, cancel/launch, real save/load and bilingual help');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
