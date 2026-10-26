const assert=require('assert'),fs=require('fs'),path=require('path');
module.exports=async function({run,nodes,click}){
 assert.equal(run('SAVE_SLOTS'),10);
 run(`setup();started=true;setAppScreen('game');showSaveSlots('menu')`);
 assert.equal(nodes.get('slotList').children.length,10);
 for(const slot of [6,7,8,9,10]){await click('slotSave'+slot);assert(run(`readSave(${slot})?.units.length>0`));}
 assert.equal(run('save(11)'),false);assert.equal(run('save(-1)'),false);
 assert.equal(run('TYPES[18].hp'),512);
 run(`setup();const knight49=makeUnit(2,18,cities.find(q=>q.f===2).tile,1);knight49.hp=256;const current49=JSON.parse(JSON.stringify(snapshot()));migrateArmy(current49)`);
 assert.equal(run('units.find(u=>u.id===knight49.id).hp'),256);
 run(`const old49=JSON.parse(JSON.stringify(snapshot()));delete old49.mechaKnightHealthSchema;old49.tech[2]=0;old49.units.find(u=>u.id===knight49.id).hp=90;migrateArmy(old49)`);
 assert.equal(run('units.find(u=>u.id===knight49.id).hp'),256);
 run(`const full49=JSON.parse(JSON.stringify(snapshot()));delete full49.mechaKnightHealthSchema;full49.units.find(u=>u.id===knight49.id).hp=180;migrateArmy(full49)`);
 assert.equal(run('units.find(u=>u.id===knight49.id).hp'),512);
 run(`const anchored49=NAKWOL_INFANTRY_PROFILES[NAKWOL_COMMANDO]`);
 for(const firing of [false,true]){
  const y=run(`infantryArtBottom(anchored49,${firing})-infantryArtHeight(anchored49,${firing})*(1-anchored49.${firing?'fireFoot':'idleFoot'})`);
  assert(Math.abs(y-19.5)<.001);assert(y<21&&21-y<2);
 }
 // Exercise all national artwork, animation directions and scaled projectile origins.
 for(let f=0;f<7;f++){
  assert(run(`armoredCarArt[${f}].idleReady`));
  for(const dir of [-1,1]){
   run(`const car49_${f}_${dir<0?'l':'r'}=makeUnit(${f},12,cities.find(q=>q.f===${f}).tile,1)`);
   const name=`car49_${f}_${dir<0?'l':'r'}`;
   assert(run(`(()=>{const u=${name},p=pxy(u.tile);faceArmoredCar(u,p,{x:p.x+${dir}*100,y:p.y});const m=armoredCarMuzzle(u,p);sprite(u,p,performance.now());launchShot(u,{x:p.x+${dir}*100,y:p.y},performance.now());sprite(u,p,performance.now()+50);return Number.isFinite(m.x)&&Number.isFinite(m.y)&&u.tankFacing===${dir}&&fireMotions.has(u.id)})()`));
  }
 }
 run(`setAppScreen('game');showSaveSlots('menu')`);
 let pending=nodes.get('slotDelete10').onclick();await Promise.resolve();await click('confirmYes');await pending;
 assert.equal(run('readSave(10)'),null);
 console.log('PASS v1.11.49: ten slots, slot 6–10 save/delete, Knight 512 and old/current health migration, both commando foot anchors, seven national armored cars facing/firing');
};
