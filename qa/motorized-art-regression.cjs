const assert=require('assert');
module.exports=function({run}){
 run(`
 const motorizedAudit={paint:ctx.drawImage,sprite,motion:movingAnimation,position:unitVisualPosition,profile:combatWeaponProfile,sound,hidden:document.hidden,skip:skipAIAnimations,enabled:combatAudio.enabled};
 const motorizedPaints=[];
 ctx.drawImage=function(image,...args){motorizedPaints.push(image);return motorizedAudit.paint(image,...args)};
 `);
 try{
  for(let f=0;f<7;f++)for(const facing of [-1,1]){
   run(`
    const auditUnit${f}_${facing===1?'r':'l'}={id:990000+${f}*2+${facing===1?1:0},f:${f},type:11,tile:0,level:1,hp:100,rifleFacing:${facing},angle:${facing===1?0:Math.PI}};
   `);
   const unit=`auditUnit${f}_${facing===1?'r':'l'}`;
   assert.equal(run(`motorizedFiringProfile(${unit}).art===infantryArtProfile({...${unit},type:0}).art`),true,'national rifle artwork');
   assert.equal(run(`motorizedVehicleProfile(${unit}).art.idleReady&&motorizedFiringProfile(${unit}).art.fireReady`),true,'vehicle and firing artwork decoded');
   assert.equal(run(`motorizedFiringProfile(${unit}).burst`),true);
   assert.equal(run(`motorizedFiringProfile(${unit}).burstShots`),8);
   assert.equal(run(`JSON.stringify(combatWeaponProfile(${unit}))===JSON.stringify(combatWeaponProfile({...${unit},type:10}))`),true,'same sound and cadence as heavy machine gun');
   run(`motorizedPaints.length=0;fireMotions.delete(${unit}.id);sprite(${unit},{x:0,y:0},1000)`);
   assert.equal(run(`motorizedPaints.includes(motorizedVehicleProfile(${unit}).art.idle)`),true,'stopped vehicle');
   run(`movingAnimation=()=>({from:{x:0,y:0},to:{x:40,y:20},start:900,duration:400});motorizedPaints.length=0;sprite(${unit},{x:0,y:0},1000);movingAnimation=motorizedAudit.motion`);
   assert.equal(run(`motorizedPaints.includes(motorizedVehicleProfile(${unit}).art.idle)`),true,'moving vehicle');
   run(`motorizedPaints.length=0;fireMotions.set(${unit}.id,{start:1100,duration:560,burst:true});sprite(${unit},{x:0,y:0},1000)`);
   assert.equal(run(`motorizedPaints.includes(motorizedVehicleProfile(${unit}).art.idle)`),true,'vehicle before scheduled firing');
   run(`motorizedPaints.length=0;sprite(${unit},{x:0,y:0},1200)`);
   assert.equal(run(`motorizedPaints.includes(infantryArtProfile({...${unit},type:0}).art.fire)`),true,'rifle firing frame');
   assert.equal(run(`motorizedPaints.includes(motorizedVehicleProfile(${unit}).art.idle)`),false,'no vehicle while firing');
   run(`motorizedPaints.length=0;sprite(${unit},{x:0,y:0},1700)`);
   assert.equal(run(`motorizedPaints.includes(motorizedVehicleProfile(${unit}).art.idle)`),true,'vehicle restored');
   assert.equal(run(`fireMotions.has(${unit}.id)`),false,'expired firing state cleared');
  }
  run(`
   sound=true;document.hidden=false;combatAudio.enabled=true;skipAIAnimations=()=>false;combatAudio.queue.length=0;
   launchShot(auditUnit0_r,{x:40,y:0},2000,520);
  `);
  assert.equal(run(`combatAudio.queue.length`),8,'eight queued shots');
  assert.equal(run(`combatAudio.queue.every((e,j)=>e.name==='machinegun'&&e.start===2000+j*70)`),true,'machinegun sounds at 70 ms intervals');
  assert.equal(run(`fireMotions.get(auditUnit0_r.id).duration`),560,'eight-shot firing window');
  assert.equal(run(`combatWeaponProfile({type:0,f:0}).name`),'rifle','ordinary rifle sound preserved');
 }finally{
  run(`ctx.drawImage=motorizedAudit.paint;movingAnimation=motorizedAudit.motion;unitVisualPosition=motorizedAudit.position;sound=motorizedAudit.sound;document.hidden=motorizedAudit.hidden;skipAIAnimations=motorizedAudit.skip;combatAudio.enabled=motorizedAudit.enabled;combatAudio.queue.length=0`);
 }
};
