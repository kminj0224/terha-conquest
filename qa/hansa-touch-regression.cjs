'use strict';
module.exports=async function({run,nodes,click}){
 const assert=require('node:assert');
 run(`units=[];busy=false;menuMode=false;selected=null;airTarget=null;navalMode=null;coastBuildMode=false;strategicTarget=null;refreshSelection();
 function bridgeTouchPoint(b,island=false){const p=island?b.a:b.z,box=hansaBridgeBuildingBox(b,island),x=box.x+box.w/2;return{x:p.x+x,y:p.y+box.y+box.h/2+(b.slope||0)*x}}
 function bridgePointerTap(x,y){const e={pointerId:901,clientX:x,clientY:y};c._events.get('pointerdown')(e);c._events.get('pointerup')(e)}
 var smallBridge=hansaBridges.find(b=>b.name==='east'),smallPoint=bridgeTouchPoint(smallBridge);cam.z=.35;
 var oldMissX=smallPoint.x+22/cam.z;
 `);
 assert.equal(run('hansaBridgeAt(oldMissX,smallPoint.y)'),null,'Old world-sized hitbox misses a 22px finger offset');
 assert.equal(run('hansaBridgeAt(oldMissX,smallPoint.y,true)?.name'),'east','Minimum touch area accepts the same tap');
 let taps=0;
 for(const name of ['east','west','north','south'])for(const island of [false,true])for(const zoom of [.35,.6,1,2.7]){
  run(`var touchBridge=hansaBridges.find(b=>b.name==='${name}'),touchPoint=bridgeTouchPoint(touchBridge,${island});cam.x=touchPoint.x;cam.y=touchPoint.y;cam.z=${zoom};bridgePointerTap(screenW/2,screenH/2)`);
  await Promise.resolve();assert(nodes.has('confirmYes'),`${name} center at zoom ${zoom}`);await click('confirmNo');await Promise.resolve();
  if(zoom<1){
   for(const dx of [-22,22]){
    run(`bridgePointerTap(screenW/2+${dx},screenH/2)`);await Promise.resolve();assert(nodes.has('confirmYes'),`${name} 22px offset at zoom ${zoom}`);await click('confirmNo');await Promise.resolve();taps++;
   }
  }
  taps++;
 }
 // A unit elsewhere in the controller's hex no longer suppresses the actual building.
 run(`cam.z=1;touchBridge=hansaBridges.find(b=>b.name==='east');touchPoint=bridgeTouchPoint(touchBridge);cam.x=touchPoint.x;cam.y=touchPoint.y;var sameHexUnit=makeUnit(1,0,worldTileAt(touchPoint.x,touchPoint.y));bridgePointerTap(screenW/2,screenH/2)`);
 await Promise.resolve();assert(nodes.has('confirmYes'),'Controller remains clickable with a unit in the same hex');await click('confirmNo');await Promise.resolve();
 run('units=[];selected=null;refreshSelection()');
 // Occupancy still blocks the operation; hitbox changes do not bypass game rules.
 run(`var friendlyOnDeck=makeUnit(0,0,touchBridge.deck[0]);var touchWarnings=[],oldTouchToast=toast;toast=s=>touchWarnings.push(s);bridgePointerTap(screenW/2,screenH/2)`);await Promise.resolve();
 assert.equal(run('touchWarnings.at(-1)'),'차단 불가 : 아군 유닛 존재');assert.equal(run('appConfirm'),null);run('toast=oldTouchToast;units=[]');
 assert.equal(run('hansaBridgeAt(-100000,-100000,true)'),null,'Distant empty map is not a controller');
 console.log('PASS Hansa touch: real pointerdown/up, 48px minimum controls, four bridges/four zooms, same-hex unit, preserved friendly blockers; taps='+taps);
};
