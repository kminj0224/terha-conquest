'use strict';
const assert=require('assert');
module.exports=async function({run}){
 run(`player=0;setup();started=true;setAppScreen('game');sound=true;combatAudio.enabled=true;combatAudio.queue=[];tech.fill(0)`);
 assert.equal(run('TYPES[12].attackWindup'),1000);
 assert.equal(run('combatWeaponProfile({type:12,f:0}).name'),'armored_autocannon');
 assert.equal(run('combatWeaponProfile({type:10,f:0}).name'),'machinegun');
 assert.equal(run('combatImpactProfile({type:12,f:0})'),'armored_autocannon_hit');
 assert.equal(run('COMBAT_SOUND_RATE'),32000);
 for(const name of ['armored_autocannon','armored_autocannon_hit'])for(let v=0;v<2;v++){
  const pcm=Buffer.from(run(`COMBAT_SOUND_BANK.${name}[${v}]`),'base64'),expected=name==='armored_autocannon'?32000:7360;
  assert.equal(pcm.length,expected*2);let peak=0,power=0;
  for(let i=0;i<pcm.length;i+=2){const n=pcm.readInt16LE(i);peak=Math.max(peak,Math.abs(n));power+=n*n}
  assert(peak<32767&&peak>27000);assert(Math.sqrt(power/expected)>2000,'audible sustained cannon pressure');
  if(name==='armored_autocannon')for(let round=0;round<5;round++){
   let energy=0;for(let i=round*5440;i<(round+1)*5440;i++)energy+=pcm.readInt16LE(i*2)**2;
   assert(energy>1e9,'every 170 ms has an audible cannon report');
  }
 }
 for(let f=0;f<7;f++)for(const dir of [-1,1]){
  const report=run(`(()=>{
   fx=[];combatAudio.queue=[];const q=cities.find(q=>q.f===${f}),u=makeUnit(${f},12,q.tile,1),p=pxy(u.tile),target={x:p.x+${dir}*90,y:p.y},start=performance.now();
   const muzzle=launchShot(u,target,start),fire=fireMotions.get(u.id),hits=fx.filter(e=>e.kind==='armoredCarHit');
   let flashes=0;const previousPoly=poly;
   poly=function(points,color,...rest){if(color==='#ffbd55')flashes++;return previousPoly(points,color,...rest)};
   try{for(let round=0;round<5;round++)sprite(u,p,start+round*170+10);sprite(u,p,start+1000)}finally{poly=previousPoly}
   const result={finite:Number.isFinite(muzzle.x)&&Number.isFinite(muzzle.y),duration:fire.duration,flashes,ended:!fireMotions.has(u.id),hits:hits.length,
    first:hits[0].start-start,last:hits.at(-1).start-start,projectiles:fx.filter(e=>['shot','laser','baekRocket','baekGrenade'].includes(e.kind)).length,
    audio:combatAudio.queue.length,name:combatAudio.queue[0]?.name,fixed:combatAudio.queue[0]?.fixedRate,audioDuration:combatAudio.queue[0]?.end-start};
   targetExplosions(u,target,40,start+1000,false);result.hitsAfter=fx.filter(e=>e.kind==='armoredCarHit').length;result.damageLabels=fx.filter(e=>e.kind==='armoredCarDamage').length;
   for(const e of fx)if(e.kind==='armoredCarHit'||e.kind==='armoredCarDamage')drawArmoredCarEffect(e,.15);
   return result;
  })()`);
  assert(report.finite);assert.equal(report.duration,1000);assert.equal(report.flashes,5);assert(report.ended);
  assert.equal(report.hits,5);assert.equal(report.hitsAfter,5);assert.equal(report.damageLabels,1);
  assert.equal(report.first,35);assert.equal(report.last,715);assert.equal(report.projectiles,0);
  assert.equal(report.audio,1);assert.equal(report.name,'armored_autocannon');assert(report.fixed);assert.equal(report.audioDuration,1000);
 }
 const actual=await run(`(async()=>{
  units=[];fx=[];combatAudio.queue=[];oil.fill(100000);food.fill(100000);
  const a=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&neighbors(i).some(j=>tiles[j].owner>=0&&!cityAt(j)));
  const b=neighbors(a).find(j=>tiles[j].owner>=0&&!cityAt(j));diplomacy[0][1]=diplomacy[1][0]='war';
  const car=makeUnit(0,12,a,1),victim=makeUnit(1,13,b,1);victim.hp=10000;freshOrders(car);freshOrders(victim);
  const delays=[],previousDelay=delay,previousCounter=canCounterattack,previousRoll=rollCounterattack;
  delay=ms=>{delays.push(ms);return Promise.resolve()};canCounterattack=()=>false;
  try{
   const before=victim.hp;if(!await attack(car,victim,true))throw Error('actual armored-car attack rejected');
   if(victim.hp>=before)throw Error('no actual cannon damage');
   const normal=delays.slice();delays.length=0;
   units=[];fx=[];const rifle=makeUnit(0,0,a,1),defender=makeUnit(1,12,b,1);rifle.hp=10000;defender.hp=10000;freshOrders(rifle);freshOrders(defender);
   canCounterattack=()=>true;rollCounterattack=()=>true;await attack(rifle,defender,true);
   return {normal,counter:delays.slice()};
  }finally{delay=previousDelay;canCounterattack=previousCounter;rollCounterattack=previousRoll}
 })()`);
 assert(actual.normal.includes(1000),'normal damage waits for full burst');
 assert(actual.counter.includes(1110),'counterfire waits for aim plus full burst');
 run(`fx=[];combatAudio.queue=[];aiTurnActive=true;aiFastForward=true;const skippedCar50=units.find(u=>u.type===12);launchShot(skippedCar50,pxy(skippedCar50.tile));targetExplosions(skippedCar50,pxy(skippedCar50.tile),10)`);
 assert.equal(run('fx.length'),0);assert.equal(run('combatAudio.queue.length'),0);
 run(`aiTurnActive=false;aiFastForward=false;sound=false;combatAudio.queue=[];launchShot(skippedCar50,pxy(skippedCar50.tile));sound=true`);
 assert.equal(run('combatAudio.queue.length'),0,'effects mute remains effective');
 run(`setup()`);assert.equal(run('armoredCarBursts.size'),0);
 console.log('PASS v1.11.50: exact 1000 ms PCM/flash burst, 5 shell impacts with no projectiles, seven factions/both directions, real attack/counterfire timing, mute, fast-forward and transient cleanup');
};
