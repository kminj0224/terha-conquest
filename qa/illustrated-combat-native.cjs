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
 for(const [attacker,target,expected] of [[0,0,['blood']],[0,1,['sparks']],[1,0,['explosion','blood']],[1,1,['explosion']],[11,0,['explosion','blood']],[0,11,['sparks']]]){
  assert.equal(run('JSON.stringify(impactLayers({type:'+attacker+'},{type:'+target+'}))'),JSON.stringify(expected));
  run('(()=>{fx=[];const attacker64=makeUnit(0,'+attacker+',home64.tile),target64=makeUnit(1,'+target+',home64.tile);targetExplosions(attacker64,pxy(target64.tile),10,performance.now(),false,target64);for(const e of fx)drawIllustratedEffect(e,.3)})()');
 }
 run("fx=[];const knight64=makeUnit(2,18,home64.tile);launchShot(knight64,{x:200,y:300})");
 assert.equal(run("fx.some(e=>['shot','baekArtilleryShell','baekRocket'].includes(e.kind))"),false);assert(run("fx.some(e=>e.kind==='laser')"));
 for(let f=0;f<7;f++)for(const type of [1,2,3,4,5,7,11,12,13,14,15,16,18,20,21,22,23,24,25,26]){
  run('(()=>{fx=[];const wreck64=makeUnit('+f+','+type+',cities.find(q=>q.f==='+f+').tile);kill(wreck64);})()');
  assert(run("fx.some(e=>e.kind==='wreck'&&e.unitArt&&e.duration===3000)"),'missing national wreck '+f+':'+type);
  run("drawGroundRemains(performance.now()+1000)");
 }
 run("drawCityFire({...home64,hp:0},pxy(home64.tile),performance.now())");
 fs.mkdirSync(path.join(__dirname,'../previews'),{recursive:true});
 run("ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,1280,800);for(let row=0;row<4;row++)for(let col=0;col<4;col++)effectFrame(row,(col+.2)/4,180+col*280,160+row*185,175)");
 fs.writeFileSync(path.join(__dirname,'../previews/illustrated-effects.png'),main.toBuffer('image/png'));
 run("ctx.clearRect(0,0,1280,800);fx=[];for(let f=0;f<7;f++){const u=makeUnit(f,1,cities.find(q=>q.f===f).tile);kill(u);const e=fx.at(-1);e.x=100+f*170;e.y=150;drawIllustratedWreck(e,.3,performance.now())}for(const [j,type]of [11,12,18,21,23,24,26].entries()){const u=makeUnit(0,type,home64.tile);kill(u);const e=fx.at(-1);e.x=100+j*170;e.y=350;drawIllustratedWreck(e,.3,performance.now())}");
 fs.writeFileSync(path.join(__dirname,'../previews/illustrated-wrecks.png'),main.toBuffer('image/png'));
 assert.deepEqual(errors,[]);console.log('PASS v1.11.64: Black Legion exclusions, 41 attack, seven-faction motorized fuel, two Sielun specials, four impact combinations, beam-only knight, 140 national mechanical wreck renders and 3-second lifetimes.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
