'use strict';
const source=require('fs').readFileSync(require('path').join(__dirname,'native-test.cjs'),'utf8').split("assert.equal(run('appScreen'),'title')")[0];
new Function('require','__dirname',source+`
(async()=>{
 await Promise.all(pending);run("player=7;setup();started=true;setAppScreen('game');menuMode=false;busy=false;focusCapital()");await settle();
 const report=run(\`(()=>{
  const check=(v,m)=>{if(!v)throw Error(m)};
  check(factions.length===8&&factions[7].name==='가르다라','Country identity');
  const local=cities.filter(q=>q.origin===7);check(cities.length===190&&local.length===9,'All nine cities exist');
  check(local.some(q=>q.capital&&q.name==='부루다라'),'Capital');
  check(GARDARA_TILES.length>85&&GARDARA_TILES.length<150,'Requested approximate area');
  check(GARDARA_TILES.every(i=>tiles[i].y>50&&tiles[i].y<80&&(tiles[i].x<0||tiles[i].x>112)),'Correct ocean between Nakwol and Ayria, across wrap seam');
  const left=new Set(GARDARA_TILES),sizes=[];while(left.size){const first=left.values().next().value,q=[first];left.delete(first);for(let n=0;n<q.length;n++)for(const j of neighbors(q[n]))if(left.has(j)){left.delete(j);q.push(j)}sizes.push(q.length)}check(sizes.length===3,'Mainland and two southern islands');
  check(units.some(u=>u.f===7)&&units.filter(u=>u.f===7).every(u=>TYPES[u.type].branch==='infantry'),'Infantry only');
  check(!missileBases.some(b=>b.f===7),'No initial batteries');check(!units.some(u=>u.f===7&&tiles[u.tile].owner!==7),'Units on own land');
  check(local.every(q=>regionTiles[q.id].includes(q.tile)),'Normal city ownership regions');
  check(!Object.prototype.hasOwnProperty.call(window.Terha,'gardaraTerrainCanvas')&&typeof gardaraTerrainCanvas==='undefined','No Gardara terrain renderer');
  check(naturalMapPages.length===2&&NATURAL_DETAIL.regions.some(q=>q.extension==='png'),'Official shared map pages');
  check(NATURAL_OWNERSHIP.pages[0].far.runs.length>1000,'Normal ownership masks');
  check(local.every(q=>Number.isFinite(q.hp)&&canProduce(q,0,1)),'All cities use normal production');
  return{land:GARDARA_TILES.length,components:sizes,cities:local.map(q=>q.name),starting:units.filter(u=>u.f===7).map(u=>TYPES[u.type].name)};
 })()\`);console.log(report);
 run('updateHUD()');assert(nodes.get('resources').innerHTML.includes('flag-7.jpg'),'HUD flag must resolve');
 // Actual native draw calls: cities and supplied infantry must be present in the new geographic area.
 run(\`const gPaint={cities:0,units:0},gCitySprite=citySprite,gSprite=sprite;citySprite=function(q,...a){if(q.origin===7)gPaint.cities++;return gCitySprite(q,...a)};sprite=function(u,...a){if(u.f===7)gPaint.units++;return gSprite(u,...a)};cam.x=8200;cam.y=3480;cam.z=.55;draw(performance.now());citySprite=gCitySprite;sprite=gSprite\`);
 assert(run('gPaint.cities')>=7,'Cities actually painted');assert(run('gPaint.units')>=7,'Infantry actually painted');
 run(\`const home=cities.find(q=>q.origin===7&&q.capital);selectCity(home,true);cityCommandOpen('units');productionPanel(home)\`);assert(nodes.has('gardaraGuardProductionRow'));
 run(\`const guard=makeUnit(7,GARDARA_GUARD,home.tile,1);if(!canCaptureCityUnit(guard))throw Error('Guard capture');units=units.filter(u=>u!==guard);selected=null;panelOpen=false;cam.x=8200;cam.y=3480;cam.z=.7;menuMode=false;draw(performance.now())\`);await settle();
 fs.mkdirSync(path.resolve(__dirname,'../previews'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../previews/Gardara-v1.11.73.png'),main.toBuffer('image/png'));
 // Supplied armor follows the ordinary tank scale/recoil/facing/muzzle path.
 run(\`const tankA=makeUnit(7,1,home.tile,1),tankB=makeUnit(7,14,home.tile,1);if(!isBaekTank(tankA)||!isBaekTank(tankB)||baekTankProfile(tankA).image!==gardaraTankArt.idle||baekTankProfile(tankB).image!==gardaraEliteArt.idle)throw Error('Shared supplied tank path');sprite(tankA,pxy(home.tile),performance.now());sprite(tankB,pxy(home.tile),performance.now());units=units.filter(u=>u!==tankA&&u!==tankB);const crossing=GARDARA_TILES.flatMap(i=>neighbors(i).filter(j=>MAP.tiles[j][0]===7&&Math.abs(tiles[i].x-tiles[j].x)>1&&!unitAt(i)&&!unitAt(j)).map(j=>[i,j]))[0];if(!crossing)throw Error('No wrap land crossing');const mover=makeUnit(7,0,crossing[0],1);freshOrders(mover);if(!moveUnit(mover,crossing[1],true))throw Error('Normal land movement over seam');const motion=movingAnimation(mover.id);if(motion&&Math.abs(motion.to.x-motion.from.x)>65)throw Error('Long seam animation');units=units.filter(u=>u!==mover);moving=[]\`);
 // Reproduce exactly the supplied screenshot's world window, including the horizontal seam.
 run("screenW=1536;screenH=691;c.width=1536;c.height=691;cam.x=4941.217391304347+1536/(2*.23);cam.y=1265.2747826086952+691/(2*.23);cam.z=.23;selected=null;draw(performance.now())");await settle();fs.writeFileSync(path.resolve(__dirname,'../previews/Gardara-location-v1.11.73.png'),main.toBuffer('image/png'));
 run('screenW=1280;screenH=800;c.width=1280;c.height=800');
 // Real capture updates the same region tiles and shared ownership generation.
 run(\`const captureCity=cities.find(q=>q.origin===7&&!q.capital);captureCity.hp=0;units=units.filter(u=>u.tile!==captureCity.tile);diplomacy[0][7]=diplomacy[7][0]='war';const invader=makeUnit(0,0,captureCity.tile,1);const before=territoryGeneration;capture(invader);refreshTerritory();if(captureCity.f!==0||!regionTiles[captureCity.id].every(i=>tiles[i].owner===0)||territoryGeneration<=before)throw Error('Shared capture ownership');cam.x=8200;cam.y=3480;cam.z=.7;draw(performance.now())\`);await settle();fs.writeFileSync(path.resolve(__dirname,'../previews/Gardara-capture-v1.11.73.png'),main.toBuffer('image/png'));
 run('save(9)');assert.equal(await drain(run('load(9)')),true);assert.equal(run('cities.filter(q=>q.origin===7).length'),9);
 assert.deepEqual(errors,[]);console.log('PASS official map, exact marked location, 3 components, normal ownership/capture, actual city/infantry paint, HUD flag, production and save/reload');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
