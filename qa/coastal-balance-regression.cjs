'use strict';
const assert=require('assert');
module.exports=function({run}){
 const report=run(`(()=>{
  const check=(ok,msg)=>{if(!ok)throw Error(msg)};
  setup();started=true;busy=false;menuMode=false;setAppScreen('game');
  const counts=initialCoastReport;
  check(counts.dante.before===26&&counts.dante.after===13,'Southern Dante fleet must be halved: '+JSON.stringify(counts.dante));
  const bases=missileBases.filter(b=>b.initialSouthCoast),ships=units.filter(u=>u.initialSouthCoast);
  check(bases.length===3&&bases.every(b=>b.f===2&&b.kind==='sea'&&readyDefense(b)),'Three ready Stetopia sea batteries');
  check(bases.every(b=>stetopiaSouthCoast().includes(b.tile)&&!cityAt(b.tile)&&!unitAt(b.tile)),'Battery placement');
  check(Math.max(...bases.map(b=>tiles[b.tile].x))-Math.min(...bases.map(b=>tiles[b.tile].x))>=18,'Batteries must span the southern coastline');
  check(bases.every(a=>bases.every(b=>a===b||distance(a.tile,b.tile)>=6)),'Batteries clustered');
  check(ships.length===4&&ships.filter(u=>u.type===24).length===2&&ships.filter(u=>u.type===23).length===2,'South fleet composition');
  check(ships.every(u=>u.f===2&&tiles[u.tile].owner<0&&units.filter(v=>!v.carriedBy&&v.hp>0&&v.tile===u.tile).length===1),'Ships overlap');
  const saved=snapshot(),before=JSON.stringify({units:saved.units.map(u=>[u.id,u.tile]),bases:saved.missileBases.map(b=>[b.id,b.tile])});
  migrateArmy(saved);
  check(before===JSON.stringify({units:units.map(u=>[u.id,u.tile]),bases:missileBases.map(b=>[b.id,b.tile])}),'Loading must not rebalance an existing save');
  const oldSound=playInterfaceSound,sounds=[];playInterfaceSound=(...args)=>sounds.push(args);
  try{
   for(const kind of ['sea','sam'])for(const owner of [player,1]){
    const b=missileBases.find(b=>b.kind===kind&&b.f===owner&&!unitAt(b.tile));check(b,'Missing test battery');
    selected=null;menuMode=false;navalMode=null;airTarget=null;strategicTarget=null;coastBuildMode=false;
    cam.x=pxy(b.tile).x;cam.y=pxy(b.tile).y;cam.z=1;
    const n=sounds.length;tap(screenW/2,screenH/2);
    check(defenseFocusId===b.id&&unitFocusId===null&&(owner===player?selectedDefenseId===b.id:menuMode),'Battery focus / inspection '+kind);
    check(sounds.length===n+1&&sounds.at(-1)[0]==='ui_select','Exactly one selection sound');
    let strokes=0;const stroke=ctx.stroke;ctx.stroke=()=>strokes++;
    try{drawDefenseFocus(b,pxy(b.tile))}finally{ctx.stroke=stroke}
    check(strokes===2,'Yellow battery outline must be painted');
    menuMode=false;$('modal').style.display='none';
   }
   const u=units.find(u=>u.f===player&&!u.carriedBy);selectUnit(u);check(defenseFocusId===null,'Unit selection clears battery focus');
   selected=null;menuMode=false;tap(-10000,-10000);check(defenseFocusId===null,'Empty click clears focus');
  }finally{playInterfaceSound=oldSound;menuMode=false;selected=null}
  // Exact destination costs and predecessor paths must survive the index.
  const sample=units.filter(u=>!u.carriedBy&&mayMove(u)).filter((u,i)=>i%29===0);
  const serialize=r=>JSON.stringify({costs:[...r.costs],paths:[...r.paths]});
  let scans=0;const find=units.find;units.find=function(fn,...args){return find.call(this,(v,i,a)=>{scans++;return fn(v,i,a)},...args)};
  let oldScans,newScans;
  try{
   const expected=sample.map(u=>serialize(unindexedReachable(u)));oldScans=scans;scans=0;
   sample.forEach((u,i)=>check(serialize(reachable(u))===expected[i],'Pathfinding changed for '+u.id));newScans=scans;
  }finally{delete units.find}
  check(pathOccupancy===null,'Search index leaked');
  check(oldScans>0&&newScans<oldScans*.1,'Occupancy scan reduction '+oldScans+' -> '+newScans);
  const savedMoveCost=moveCost;moveCost=()=>{throw Error('Expected search failure')};
  try{try{reachable(sample[0])}catch(error){check(error.message==='Expected search failure','Wrong exception')}}finally{moveCost=savedMoveCost}
  check(pathOccupancy===null,'Failed search retained stale occupancy');
  const restart=JSON.stringify(counts);setup();check(JSON.stringify(initialCoastReport)===restart,'Restart grant drift');
  return {dante:counts.dante,batteries:bases.map(b=>[tiles[b.tile].x,tiles[b.tile].y]),ships:ships.length,pathSamples:sample.length,oldScans,newScans};
 })()`);
 assert.equal(report.dante.after,13);
 console.log('PASS: battery focus/audio/paint, coast deployment, save/restart and identical indexed paths',report);
};
