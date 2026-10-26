'use strict';
module.exports=async function({run,nodes,click,settle}){
 const assert=require('assert');
 run(`setup();started=true;setAppScreen('game');player=0;units=[];var navalBridge=hansaBridges.find(b=>b.name==='east');setHansaBridge(navalBridge,false,100);updateHansaBridges(3100);var bridgeNavy=makeUnit(0,22,navalBridge.deck[0],1);var bridgeNavalToasts=[];var navalToast=toast;toast=function(s){bridgeNavalToasts.push(s);return navalToast(s)};`);
 // Both the confirmation path and direct/AI requests reject every navy faction.
 assert.equal(run('hansaBridgeConnectReason(navalBridge)'),'연결 불가 : 해군 유닛 존재');
 run('askHansaBridge(navalBridge)');await Promise.resolve();assert(!nodes.has('confirmYes'));assert.equal(run('bridgeNavalToasts.at(-1)'),'연결 불가 : 해군 유닛 존재');assert(!run('setHansaBridge(navalBridge,true,4000,true)'));assert(!run('navalBridge.transition'));
 run('bridgeNavy.f=1');assert(!run('setHansaBridge(navalBridge,true,4000)'));assert(run('tiles[bridgeNavy.tile].owner<0'));
 run('units=[];setHansaBridge(navalBridge,true,4000);bridgeNavy=makeUnit(0,22,navalBridge.deck[0],1);updateHansaBridges(7000)');assert(run('!navalBridge.open&&!navalBridge.transition&&tiles[bridgeNavy.tile].owner<0'),'late naval arrival cancels reconnection');
 // Old saves with a ship on an open deck are repaired without loss or death effects.
 run('navalBridge.open=navalBridge.target=true;applyHansaBridgeTerrain();var oldNavyId=bridgeNavy.id;var priorNavyFX=fx.length;var navalSave=JSON.parse(JSON.stringify(snapshot()));migrateArmy(navalSave)');
 assert(run('units.some(u=>u.id===oldNavyId&&tiles[u.tile].owner<0)'));assert.equal(run('fx.length'),run('priorNavyFX'));
 run('setup();started=true;setAppScreen("game")');assert(run('units.filter(isNaval).every(u=>tiles[u.tile].owner<0)'),'no initial navy on land');
 // Rendering, player movement and other factions cannot issue bridge orders.
 run(`units=[];player=1;var aiCapital=hansaBridgeCity();var aiApproach=tiles.findIndex((t,i)=>t.owner>=0&&distance(aiCapital.tile,i)===5);var approachUnit=makeUnit(1,0,aiApproach,1);busy=false;aiTurnActive=false;`);
 await settle();assert(run('hansaBridges.every(b=>b.open&&!b.transition)'));
 await run('runHansaBridgeAITurn(0)');assert(run('hansaBridges.every(b=>b.open&&!b.transition)'));
 run('busy=true;aiTurnActive=true');await run('runHansaBridgeAITurn(2)');assert(run('hansaBridges.every(b=>b.open&&!b.transition)'));
 await run('runHansaBridgeAITurn(0)');assert(run('hansaBridges.every(b=>!b.open&&!b.transition)'));
 run('busy=false;aiTurnActive=false;units=[]');await settle();assert(run('hansaBridges.every(b=>!b.open&&!b.transition)'),'leaving threat radius during player turn keeps bridges blocked');
 run('busy=true;aiTurnActive=true');await run('runHansaBridgeAITurn(0)');run('busy=false;aiTurnActive=false');assert(run('hansaBridges.every(b=>b.open&&!b.transition)'));
 // Drive the actual depth-sorted world pass, not a reimplemented comparator.
 run(`player=0;units=[];fx=[];var victimTile=tiles.findIndex((t,i)=>i>W&&t.owner>=0&&!cityAt(i)&&neighbors(i).filter(j=>tiles[j].owner>=0&&!cityAt(j)).length>=4&&i+W<tiles.length&&tiles[i+W].owner>=0&&!cityAt(i+W));var depthVictim=makeUnit(1,0,victimTile,1),depthForeground=makeUnit(0,1,victimTile+W,1),depthSapros=makeUnit(3,SAPROS,victimTile-W,1);var vp=pxy(victimTile);cam.x=vp.x;cam.y=vp.y;cam.z=1.5;var depthPaint=[],oldDepthSprite=sprite,oldDepthEffect=drawSaprosEffect;sprite=function(u,...args){depthPaint.push('unit:'+u.id);return oldDepthSprite(u,...args)};drawSaprosEffect=function(e,...args){depthPaint.push(e.kind);return oldDepthEffect(e,...args)};targetExplosions(depthSapros,vp,97,performance.now(),false,depthVictim);drawWorld(performance.now()+120,false);sprite=oldDepthSprite;drawSaprosEffect=oldDepthEffect;`);
 assert(run("depthPaint.indexOf('unit:'+depthVictim.id)<depthPaint.indexOf('saprosBlood')"));assert(run("depthPaint.indexOf('saprosBlood')<depthPaint.indexOf('unit:'+depthForeground.id)"));assert.equal(run("depthPaint.filter(x=>x==='saprosBlood').length"),1,'no duplicate overlay after depth pass');
 run(`fx=[];depthVictim.type=1;depthPaint=[];sprite=function(u,...args){depthPaint.push('unit:'+u.id);return oldDepthSprite(u,...args)};drawSaprosEffect=function(e,...args){depthPaint.push(e.kind);return oldDepthEffect(e,...args)};targetExplosions(depthSapros,vp,97,performance.now(),false,depthVictim);drawWorld(performance.now()+120,false);sprite=oldDepthSprite;drawSaprosEffect=oldDepthEffect`);
 assert(run("depthPaint.indexOf('unit:'+depthVictim.id)<depthPaint.indexOf('saprosSparks')&&depthPaint.indexOf('saprosSparks')<depthPaint.indexOf('unit:'+depthForeground.id)"));
 // The supplied directional artwork alternates at the exact 200ms boundaries.
 run(`fx=[];var testHeli=makeUnit(0,21,victimTile,1);testHeli.angle=0;aimMotions.clear();var heliDraws=[],heliDrawImage=ctx.drawImage;ctx.drawImage=function(im,...args){const frame=baekAttackHeliArt.findIndex(a=>a.idle===im);if(frame>=0)heliDraws.push({frame,args});return heliDrawImage(im,...args)};`);
 for(const t of [0,199,200,399,400])run('sprite(testHeli,vp,'+t+')');run('testHeli.angle=Math.PI');for(const t of [0,200])run('sprite(testHeli,vp,'+t+')');
 assert.deepEqual(JSON.parse(run('JSON.stringify(heliDraws.map(d=>d.frame))')),[0,0,1,1,0,2,3]);
 run('ctx.drawImage=heliDrawImage;fx=[];launchShot(testHeli,{x:vp.x+150,y:vp.y+60},1000)');
 assert.equal(run("fx.filter(e=>e.kind==='baekRocket').length"),8);assert.equal(run("fx.filter(e=>e.kind==='baekImpact').length"),8);assert.equal(run("fx.filter(e=>e.kind==='shot').length"),0);
 assert(run("fx.filter(e=>e.kind==='baekRocket').every((e,i)=>e.start===1000+i*80&&e.duration===430&&baekProjectilePosition(e,1).x===e.tx&&baekProjectilePosition(e,1).y===e.ty)"));
 run('var unaffectedBefore=fx.length;launchShot({...testHeli,f:1},{x:vp.x+150,y:vp.y+60},1000)');assert(run('fx.length>unaffectedBefore'),'other faction helicopters retain their launcher');
 assert(run('baekAttackHeliArt.every(a=>a.idle.naturalWidth===768)'));
 // Exercise real combat: rotor art/rocket rendering never adds extra game damage.
 run(`fx=[];testHeli.tile=neighbors(depthVictim.tile).find(i=>tiles[i].owner>=0&&!unitAt(i)&&!cityAt(i));freshOrders(testHeli);depthVictim.hp=2000;oil[0]=100000;var heliHPBefore=depthVictim.hp,heliWaits=[],heliDelay=delay,heliCounter=canCounterattack;canCounterattack=()=>false;delay=async function(ms){heliWaits.push(ms);if(ms===1000&&depthVictim.hp!==heliHPBefore)throw Error('Helicopter damaged target before rocket volley arrived')};`);
 assert.equal(await run('attack(testHeli,depthVictim,false)'),true);assert(run('heliWaits.includes(1000)&&depthVictim.hp<heliHPBefore'));assert.equal(run("fx.filter(e=>e.kind==='baekRocket').length"),8);run('delay=heliDelay;canCounterattack=heliCounter');
 // Bound the sprite cost with actual supplied textures and actual Canvas painting.
 const perfClock=require('perf_hooks').performance,perfStart=perfClock.now();run('for(let n=0;n<1000;n++)sprite(testHeli,vp,n*17)');const spriteMs=perfClock.now()-perfStart;
 assert(run('baekAttackHeliArt.reduce((bytes,a)=>bytes+a.idle.naturalWidth*a.idle.naturalHeight*4,0)<4*1024*1024'));console.log('Helicopter cached Canvas sprite benchmark: 1000 draws = '+spriteMs.toFixed(1)+'ms; four decoded textures < 4MiB');
 run('toast=navalToast;fx=[]');
 console.log('PASS: naval reconnect guards including late arrivals; starting/legacy navy relocation; AI only during Baekyang turn; blood/sparks behind foreground tiles; supplied 200ms directional helicopter frames; eight staggered rocket flights and impacts; cached 768px textures');
};
