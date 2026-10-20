// Reuse the real Canvas / simulated DOM harness without its unrelated scenarios.
const source=require('fs').readFileSync(require('path').join(__dirname,'native-test.cjs'),'utf8').split("assert.equal(run('appScreen'),'title')")[0];
new Function('require','__dirname',source+`
(async()=>{
 await Promise.all(pending);
 run("player=0;setup();started=true;setAppScreen('game');menuMode=false;busy=false");await settle();
 assert(run('coastArtwork.ready&&coastArtwork.natural&&coastArtwork.maskReady'),'Natural map must decode');
 assert(run('coastArtwork.image.naturalWidth>=1400'),'Expected finished map artwork');
 const views=[['world',3590,2340,.17],['east-rivers',5770,2300,.65],['snow-coast',1500,2200,.65],['central-valley',3450,2650,.8]];
 fs.mkdirSync(path.join(__dirname,'../previews'),{recursive:true});
 for(const [name,x,y,z]of views){
  run('cam.x='+x+';cam.y='+y+';cam.z='+z+';draw(1000)');await settle();
  run('draw(1000)');const before=run('groundViewBuilds');run('draw(1000)');assert.equal(run('groundViewBuilds'),before,'Stationary map must reuse view bitmap');
  fs.writeFileSync(path.join(__dirname,'../previews/natural-'+name+'.png'),main.toBuffer('image/png'));
 }
 const before=run('groundViewBuilds');
 run('tiles[cities[0].tile].owner=(tiles[cities[0].tile].owner+1)%7;territoryDirty=true;draw(1000)');
 assert(run('groundViewBuilds')>before,'Conquest must invalidate territory composite');
 assert.equal(run('groundChunkBuilds'),0,'Natural art must bypass old clipped terrain chunks');
 assert.equal(reads,0,'No runtime pixel scanning');assert.deepEqual(errors,[]);
 console.log('PASS natural map decode, four views, stationary cache, conquest invalidation, zero old chunk builds and zero runtime pixel reads');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
