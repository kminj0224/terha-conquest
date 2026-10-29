'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8'),at=source.indexOf("assert.equal(run('appScreen'),'title');");
new Function('require','__dirname',source.slice(0,at)+`
(async()=>{
 await Promise.all(pending);
 run("setup();started=true;setAppScreen('game');tech.fill(0)");
 assert.equal(run('TYPES[6].atk'),41);
 assert.equal(run('units.filter(u=>u.initialSielunSpecial&&u.type===WHITE_NIGHT&&u.f===6).length'),2);
 run('setup()');assert.equal(run('units.filter(u=>u.initialSielunSpecial).length'),2);
 run("const home64=cities.find(q=>q.f===0&&q.capital);const black64=makeUnit(0,6,home64.tile),blackOther64=makeUnit(0,6,home64.tile),rifle64=makeUnit(0,0,home64.tile)");
 assert.equal(run('specialIncomingFactor(black64)'),1);assert.equal(run('specialIncomingFactor(blackOther64)'),1);assert.equal(run('specialIncomingFactor(rifle64)'),.4);
 for(let f=0;f<7;f++)for(let level=1;level<=4;level++){
  assert.equal(run('moveOil({type:11,f:'+f+',level:'+level+'})'),0);assert.equal(run('attackOil({type:11,f:'+f+',level:'+level+'})'),0);
 }
 assert.equal(run('battlefieldEffects.idleReady'),true);
 assert.equal(run('prepareCityFlameFrames().length'),12);
 const crypto=require('crypto');
 const flameHashes=run('cityFlameFrames').map(frame=>crypto.createHash('sha256').update(frame.toBuffer('image/png')).digest('hex'));
 assert.equal(new Set(flameHashes).size,12,'twelve distinct precomputed flame animation frames');
 for(const [attacker,target,expected] of [[0,0,['blood']],[0,1,['sparks']],[1,0,['infantrySmokeHit','blood']],[1,1,['armorSmoke']],[1,2,['armorSmoke']],[2,1,['explosion']],[2,0,['explosion','blood']],[11,0,['dustBurst','blood']],[0,11,['sparks']]]){
  assert.equal(run('JSON.stringify(impactLayers({type:'+attacker+'},{type:'+target+'}))'),JSON.stringify(expected));
  run('(()=>{fx=[];const attacker64=makeUnit(0,'+attacker+',home64.tile),target64=makeUnit(1,'+target+',home64.tile);targetExplosions(attacker64,pxy(target64.tile),10,performance.now(),false,target64);for(const e of fx)drawIllustratedEffect(e,.3)})()');
 }
 run("fx=[];const knight64=makeUnit(2,18,home64.tile);launchShot(knight64,{x:200,y:300})");
 assert.equal(run("fx.some(e=>['shot','baekArtilleryShell','baekRocket'].includes(e.kind))"),false);assert(run("fx.some(e=>e.kind==='laser')"));
 for(let f=0;f<7;f++)for(const type of [1,2,3,4,5,7,11,12,13,14,15,16,18,20,21,22,23,24,25,26]){
  run('(()=>{fx=[];const wreck64=makeUnit('+f+','+type+',cities.find(q=>q.f==='+f+').tile);kill(wreck64);})()');
  assert(run("fx.some(e=>e.kind==='wreck'&&e.unitArt&&e.duration===3000)"),'missing national wreck '+f+':'+type);
  run("drawIllustratedWreck(fx.at(-1),.3,performance.now()+1000)");
 }
 assert(run('cityFlameArt.idleReady&&wreckSmokeArt.idleReady'));
 run("drawCityFire({...home64,hp:0},pxy(home64.tile),performance.now())");
 run("fx=[];units=[];const depthOrigin=cities.find(q=>q.f===0).tile;const depthAbove=tiles.findIndex((t,i)=>t.owner>=0&&pxy(i).y<pxy(depthOrigin).y&&Math.abs(pxy(i).x-pxy(depthOrigin).x)<80&&pxy(depthOrigin).y-pxy(i).y<100);const depthBelow=tiles.findIndex((t,i)=>t.owner>=0&&pxy(i).y>pxy(depthOrigin).y&&Math.abs(pxy(i).x-pxy(depthOrigin).x)<80&&pxy(i).y-pxy(depthOrigin).y<100);const backUnit65=makeUnit(0,1,depthAbove),frontUnit65=makeUnit(0,1,depthBelow),deadUnit65=makeUnit(0,1,depthOrigin);kill(deadUnit65);const deadEffect65=fx.at(-1);cam.x=deadEffect65.x;cam.y=deadEffect65.y;cam.z=1;const depthPaint65=paintDepthScene;globalThis.actualDepth65=[];paintDepthScene=function(scene){actualDepth65=scene.filter(s=>s.kind==='unit'||s.kind==='wreck').map(s=>s.kind==='wreck'?'wreck':s.entity.id);return depthPaint65(scene)};try{drawWorld(performance.now()+100)}finally{paintDepthScene=depthPaint65}");
 assert(run("actualDepth65.indexOf(backUnit65.id)<actualDepth65.indexOf('wreck')&&actualDepth65.indexOf('wreck')<actualDepth65.indexOf(frontUnit65.id)"),'wreck follows the actual unit depth order');
 assert(run('wreckBodyCache.size<=WRECK_CACHE_LIMIT'),'bounded shared wreck cache');
 run("const allocations65=document.createElement;globalThis.allocationsCount65=0;document.createElement=function(...a){allocationsCount65++;return allocations65(...a)};try{for(let i=0;i<100;i++){drawCityFire({...home64,hp:0},{x:cam.x,y:cam.y},i*33);drawIllustratedWreck(deadEffect65,.3,i*33)}}finally{document.createElement=allocations65}");
 assert.equal(run('allocationsCount65'),0,'steady-state fire/wreck draws allocate no surfaces');
 run("const outsideDraw65=ctx.drawImage;globalThis.outsideCalls65=0;ctx.drawImage=function(...a){outsideCalls65++;return outsideDraw65(...a)};try{drawIllustratedEffect({kind:'blast',x:cam.x+100000,y:cam.y,layers:['explosion']},.3)}finally{ctx.drawImage=outsideDraw65}");
 assert.equal(run('outsideCalls65'),0,'offscreen impacts do not paint');
 await run("(async()=>{setup();units=[];fx=[];moving=[];oil.fill(100000);food.fill(100000);const q=cities.find(q=>q.f===1&&neighbors(q.tile).some(i=>tiles[i].owner>=0));const at=neighbors(q.tile).find(i=>tiles[i].owner>=0);const attacker=makeUnit(0,1,at),target=makeUnit(1,1,q.tile);attacker.hp=target.hp=10000;const oldDelay=delay,oldCounter=canCounterattack;delay=()=>Promise.resolve();canCounterattack=()=>false;try{if(!await attack(attacker,target,true))throw Error('tank garrison attack rejected');const hits=fx.filter(e=>ILLUSTRATED_HITS.has(e.kind));if(hits.length<2||hits.some(e=>!e.layers?.includes('armorSmoke')||e.layers.includes('explosion')))throw Error('tank garrison must have smoke-only hits')}finally{delay=oldDelay;canCounterattack=oldCounter}})()");
 const {createCanvas,loadImage}=require('@napi-rs/canvas');
 const fadeImage=await loadImage(path.join(root,'city-flame-soft.webp')),fadeCanvas=createCanvas(256,256),fadeContext=fadeCanvas.getContext('2d');fadeContext.drawImage(fadeImage,0,0,256,256);
 const fadePixels=fadeContext.getImageData(0,255,256,1).data;
 for(let i=3;i<fadePixels.length;i+=4)assert(fadePixels[i]<=2,'flame bottom must dissolve to transparency');
 fs.mkdirSync(path.join(__dirname,'../previews'),{recursive:true});
 run("ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,1280,800);for(let row=0;row<4;row++)for(let col=0;col<4;col++)effectFrame(row,(col+.2)/4,180+col*280,160+row*185,175)");
 fs.writeFileSync(path.join(__dirname,'../previews/illustrated-effects.png'),main.toBuffer('image/png'));
 run("ctx.clearRect(0,0,1280,800);fx=[];for(let f=0;f<7;f++){const u=makeUnit(f,1,cities.find(q=>q.f===f).tile);kill(u);const e=fx.at(-1);e.x=100+f*170;e.y=150;drawIllustratedWreck(e,.3,performance.now())}for(const [j,type]of [11,12,18,21,23,24,26].entries()){const u=makeUnit(0,type,home64.tile);kill(u);const e=fx.at(-1);e.x=100+j*170;e.y=350;drawIllustratedWreck(e,.3,performance.now())}");
 fs.writeFileSync(path.join(__dirname,'../previews/illustrated-wrecks.png'),main.toBuffer('image/png'));
 assert.deepEqual(errors,[]);console.log('PASS v1.11.66: Black Legion exclusions, 41 attack, seven-faction motorized fuel, two Sielun specials, armor smoke / infantry blood and unchanged artillery, depth-sorted wrecks, baked flame alpha, zero steady-state canvas allocations, offscreen culling, beam-only knight, 140 national mechanical wreck renders and 3-second lifetimes.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
