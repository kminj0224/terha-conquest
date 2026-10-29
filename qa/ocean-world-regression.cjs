const source=require('fs').readFileSync(require('path').join(__dirname,'native-test.cjs'),'utf8').split("assert.equal(run('appScreen'),'title')")[0];
new Function('require','__dirname',source+`
(async()=>{
 await Promise.all(pending);
 run("player=0;setup();started=true;setAppScreen('game');menuMode=false;busy=false");await settle();
 assert(fs.readFileSync(path.join(root,'ocean-material.png')).equals(fs.readFileSync(path.join(__dirname,'../art/terrain-materials/ocean-material.png'))),'Extended sea must use the unchanged original ocean material');
 assert(run('oceanMaterial.idleReady&&oceanTexture().width===930'),'Original ocean scale must decode');
 const report=run(\`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error(msg)};
  check(tiles.length===WORLD_COLS*WORLD_ROWS,'Ocean ring missing');
  for(let i=0;i<tiles.length;i++){
   const t=tiles[i],p=pxy(i);check(worldTileAt(p.x,p.y)===i,'Tile hit '+i);
   for(const k of [-2,-1,1,2])check(worldTileAt(p.x+k*WORLD_WIDTH,p.y)===i,'Wrapped tile hit '+i);
   if(i>=W*H&&MAP.tiles[i][0]!==GARDARA)check(t.owner===-1&&t.terrain===0,'Ocean must remain water outside Gardara');
   for(const j of neighbors(i)){check(distance(i,j)===1,'Neighbor distance');check(neighbors(j).includes(i),'Reciprocal seam neighbor')}
  }
  for(const origin of [0,2,5])for(let level=1;level<=5;level++)for(const capital of [false,true]){
   if(origin===5&&capital)continue;
   const q={origin,level,capital},a=photoCityProfile(q),old=capital?86:(origin===2?[0,50,56*1.15,62*1.15*1.10,70,78]:[0,50,56*1.15,62*1.15,70,78])[level];
   check(Math.abs(a.width-old*1.15)<1e-8,'City tier scaling');check(photoCityBox(q).bottom===10,'City anchor shifted');
  }
  const north=units.filter(u=>u.northernFrontFleet);check(north.length===2&&north.some(u=>u.type===25)&&north.some(u=>u.type===23),'Northern fleet composition');
  const from=index(W+OCEAN_X-1,40),to=index(-OCEAN_X,40),ship=makeUnit(0,23,from,2);freshOrders(ship);
  check(reachable(ship).costs.has(to),'Seam must be navigable');check(moveCost({f:0,type:0},to)>=99999,'Infantry must not walk onto ocean');
  check(moveUnit(ship,to,true),'Seam movement rejected');check(ship.destroyerFacing===1,'Eastward seam facing');const m=moving.find(m=>m.id===ship.id);check(m&&Math.abs(m.to.x-m.from.x)<=S,'Seam animation crosses whole map');
  units=units.filter(u=>u.id!==ship.id);moving=[];
  return{tiles:tiles.length,addedOcean:tiles.length-W*H,northernFleet:north.map(u=>u.type)};
 })()\`);
 console.log('PASS ocean topology, all tile hits over five world copies, tier scaling and seam navigation',report);
 // Load an actual legacy-length campaign, then save/reload the expanded format.
 run("const oceanLegacy=snapshot();oceanLegacy.appVersion='1.11.19';oceanLegacy.owners=oceanLegacy.owners.slice(0,W*H);localStorage.setItem(saveKey(5),JSON.stringify(oceanLegacy));const savedFleetCount=units.length");
 assert.equal(await drain(run('load(5)')),true);assert.equal(run('units.length'),run('savedFleetCount'));assert(run('tiles.slice(W*H).every((t,n)=>MAP.tiles[n+W*H][0]===GARDARA||t.owner===-1)'));
 run('save(5)');assert.equal(await drain(run('load(5)')),true);
 fs.mkdirSync(path.join(__dirname,'../previews'),{recursive:true});
 const [worldW,worldH,worldLeft]=JSON.parse(run('JSON.stringify([WW,HH,WORLD_LEFT])'));
 const views=[['ocean-world',3590,2340,.13],['ocean-left',0,2600,.8],['ocean-right',worldW,2600,.8],['ocean-top',2900,0,.8],['ocean-bottom',2900,worldH,.8],['ocean-seam',worldLeft,2600,.8]];
 for(const [name,x,y,z]of views){run('cam.x='+x+';cam.y='+y+';cam.z='+z+';draw(20000)');await settle();run('draw(20000)');fs.writeFileSync(path.join(__dirname,'../previews/'+name+'.png'),main.toBuffer('image/png'))}
 // Rendering one circumference apart must be pixel-identical, including ships near the seam.
 run('cam.x=WORLD_LEFT;cam.y=2600;cam.z=.8;draw(20000)');await settle();run('draw(20000)');const first=main.toBuffer('image/png');
 run('cam.x+=WORLD_WIDTH;draw(20000)');assert(first.equals(main.toBuffer('image/png')),'One full wrap must show the identical map');
 assert.equal(reads,0,'No runtime pixel reads');assert.deepEqual(errors,[]);
 console.log('PASS legacy save migration, expanded save reload, illustrated ocean screenshots and exact full-world rendering wrap');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
