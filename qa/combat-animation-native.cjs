'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8'),at=source.indexOf("assert.equal(run('appScreen'),'title');");
new Function('require','__dirname',source.slice(0,at)+`
(async()=>{
 await Promise.all(pending);run('setup();started=true;setAppScreen("game");cam.x=640;cam.y=400;cam.z=1');
 assert(run('dirtImpactArt.idleReady&&combatProjectileArt.idleReady&&nuclearCloudArt.idleReady'));
 assert.equal(run('cityFlameFrames.length'),12);
 const hashes=run('cityFlameFrames').map(c=>require('crypto').createHash('sha256').update(c.toBuffer('image/png')).digest('hex'));
 assert.equal(new Set(hashes).size,12);
 assert.equal(run('JSON.stringify(impactLayers({type:8},{type:1}))'),'["grenadeDust"]');
 for(const type of [1,12,13,14,18]){
  assert(!run('impactLayers({type:'+type+'},{type:0}).includes("explosion")'));
  assert(!run('impactLayers({type:'+type+'},{type:1}).includes("explosion")'));
 }
 for(const type of [2,3,15,16,5,22,23,24,25,4,7,19,20,21])assert(run('impactLayers({type:'+type+'},{type:1}).includes("explosion")'));
 assert(run('impactLayers({type:3,strategic:true},{type:1}).includes("explosion")'));
 run("globalThis.stages66=[];const originalFrame66=effectFrame,originalDirt66=drawDirtImpact,originalSmoke66=drawImpactSmoke;effectFrame=function(row,...a){stages66.push(row===0?'sparks':'frame');return originalFrame66(row,...a)};drawDirtImpact=function(...a){stages66.push('dirt');return originalDirt66(...a)};drawImpactSmoke=function(...a){stages66.push('smoke');return originalSmoke66(...a)};try{drawArmorImpact({x:640,y:400},.05,false);drawArmorImpact({x:640,y:400},.7,false)}finally{effectFrame=originalFrame66;drawDirtImpact=originalDirt66;drawImpactSmoke=originalSmoke66}");
 assert.equal(run('stages66[0]'),'sparks');assert(run('stages66.includes("smoke")'));
 // Warm shared textures; then reject every geometry primitive during all combat FX.
 run("for(const key of [0,1,2,3,4,5,'cyanMuzzle'])projectileTexture(key);prepareCityFlameFrames();globalThis.fxKinds66=[...new Set([...COMBAT_RASTER_KINDS,...ILLUSTRATED_HITS])];globalThis.projectileKinds66=new Set(['shot','baekArtilleryShell','baekRocket','baekGrenade','navalMissile','missile','defenseMissile','samIntercept','laser','devilLaser']);globalThis.geometry66={};for(const key of ['beginPath','fillRect','strokeRect','arc','ellipse','lineTo','fill','stroke']){geometry66[key]=ctx[key];ctx[key]=function(){throw Error('geometric combat effect: '+key)}};const element66=document.createElement;globalThis.allocations66=0;document.createElement=function(...a){allocations66++;return element66(...a)};try{for(const kind of fxKinds66.filter(k=>k!=='infantrySmoke'))for(const t of [.05,.25,.55,.85]){const e={kind,x:640,y:400,type:1,f:1,damage:20,angle:0};if(projectileKinds66.has(kind)){e.tx=780;e.ty=420}if(!drawIllustratedEffect(e,t))throw Error('unhandled combat kind '+kind)}for(const color of MUZZLE_POLY_COLORS)poly([[-1,-1],[5,-4],[4,-1],[14,0],[4,1],[5,4],[-1,1]],color);for(const color of MUZZLE_CIRCLE_COLORS)circle(21,0,5,color);for(let i=0;i<100;i++)drawCityFire({id:1,hp:0,level:3},{x:640,y:400},1000+i*60)}finally{for(const [key,fn]of Object.entries(geometry66))ctx[key]=fn;document.createElement=element66}");
 assert.equal(run('allocations66'),0,'no steady-state surfaces');assert.deepEqual(errors,[]);
 // Paint phases for visual review using the actual renderer and shared assets.
 run("ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,1280,800);for(let j=0;j<5;j++){const t=[.03,.13,.28,.5,.8][j];paintImpact({x:140+j*240,y:150,layers:['armorSmoke']},t);paintImpact({x:140+j*240,y:350,layers:['infantrySmokeHit','blood']},t);paintImpact({x:140+j*240,y:530,layers:['grenadeDust']},t);drawCityFire({id:j,hp:0,level:3},{x:140+j*240,y:740},j*120)}");
 fs.mkdirSync(path.join(__dirname,'../previews'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../previews/combat-animation-v66.png'),main.toBuffer('image/png'));
 console.log('PASS v1.11.68: '+run('fxKinds66.length')+' raster combat kinds, impact phases reject primitive drawing (legacy AT muzzle smoke excepted); 12 distinct shared fire frames; no steady-state allocations; armor spark/dirt/smoke staging; small grenade blast; ground armor/infantry flame exclusion; air/naval/artillery fire.');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
