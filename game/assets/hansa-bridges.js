'use strict';
// Dynamic decks are a movement overlay; the painted lake and MAP water stay intact.
const HANSA_BRIDGE_VERSION=2;
const HANSA_BRIDGE_WEST_CROP=[70,7,577.5,497.5],HANSA_BRIDGE_WEST_MOUTH=.62;
let hansaBridges=[],hansaBridgeRestoring=false,hansaBridgeSetupRunning=false;
const hansaBridgeAtlas=loadBaekArt('hansa-bridge-directions.webp');
const hansaBridgeWestArt=loadBaekArt('hansa-bridge-west-island.webp');
const HANSA_BRIDGE_CROPS=[[0,13.5,313.5,300],[313.5,13.5,299.5,300],[0,313.5,313.5,301.5],[318,313.5,291,301.5]];
function hansaBridgeCity(){return cities.find(q=>q.origin===0&&q.capital)}
function isHansaSupplyCity(q){return !!q&&q.origin===0&&q.capital}
function hansaBridgeWater(i){return HANSA_WATER_TILES.includes(i)||MAP.tiles[i]?.[0]<0}
function createHansaBridges(states){
 const city=hansaBridgeCity();if(!city)return [];
 const o=tiles[city.tile],center=pxy(city.tile),result=[];
 for(const [name,dx,dy,duration]of [['east',1,0,3000],['west',-1,0,3000],['south',0,1,1500],['north',0,-1,1500]]){
  let wet=false,last=city.tile;const deck=[];let outer=-1;
  for(let n=1;n<15;n++){const i=index(o.x+dx*n,o.y+dy*n);if(i<0)break;if(hansaBridgeWater(i)){wet=true;deck.push(i)}else if(wet){outer=i;break}else last=i}
  if(outer<0||!deck.length)continue;
  const a=pxy(last),z=pxy(outer),slope=dx?(z.y-center.y)/(z.x-center.x):0;
  if(dx)a.y=center.y+(a.x-center.x)*slope;
  if(name==='south'&&last===city.tile)a.y+=40;
  const open=states?.[name]!==false;
  result.push({name,dx,dy,duration,deck,a,z,slope,open,target:open,transition:null});
 }
 return result;
}
// Region rebuilding normally restores every MAP sea tile to water. Reapply only
// the logical deck overlay afterwards; never repaint or recolor the lake image.
const hansaBridgeRegions=buildRegions;buildRegions=function(...args){
 const result=hansaBridgeRegions(...args),city=hansaBridgeCity();
 if(city)for(const b of hansaBridges)for(const i of b.deck){tiles[i].owner=b.open?0:-1;tiles[i].terrain=0;tiles[i].region=b.open?city.id:-1;if(b.open&&!regionTiles[city.id].includes(i))regionTiles[city.id].push(i)}
 return result;
};
function hansaBridgeDeckOpen(i){return hansaBridgeRestoring&&hansaBridges.some(b=>b.open&&b.deck.includes(i))}
function hansaBridgeConnected(){return hansaBridges.some(b=>b.open&&!b.transition)}
function hansaBridgeInvalidate(){
 resetHansaGeographyCaches();buildRegions();territoryDirty=true;groundViewKey='';
 if(typeof renderIndex!=='undefined')renderIndex=null;
 if(typeof resetThreatCache==='function')resetThreatCache();
}
function applyHansaBridgeTerrain(){
 for(const b of hansaBridges)for(const i of b.deck){tiles[i].owner=b.open?0:-1;tiles[i].terrain=0}
 hansaBridgeInvalidate();
}
function hansaBridgeFriendly(u){return u.f===0||diplomacy[0]?.[u.f]==='ally'}
function hansaBridgePassengers(b){return units.filter(u=>u.hp>0&&!u.carriedBy&&b.deck.includes(u.tile))}
function hansaBridgeConnectReason(b){return hansaBridgePassengers(b).some(isNaval)?'연결 불가 : 해군 유닛 존재':''}
function hansaBridgeBlockReason(b){return hansaBridgePassengers(b).some(hansaBridgeFriendly)?'차단 불가 : 아군 유닛 존재':''}
function eraseHansaBridgeEnemies(b){
 const ids=new Set(hansaBridgePassengers(b).filter(u=>atWar(0,u.f)).map(u=>u.id));
 // Carried units leave with their carrier. Never invoke kill() or casualty effects.
 let changed=true;while(changed){changed=false;for(const u of units)if(ids.has(u.carriedBy)&&!ids.has(u.id)){ids.add(u.id);changed=true}}
 if(!ids.size)return;
 units=units.filter(u=>!ids.has(u.id));moving=moving.filter(m=>!ids.has(m.id));
 for(const id of ids){aimMotions.delete(id);fireMotions.delete(id)}
 if(selected?.kind==='unit'&&ids.has(selected.id)){selected=null;panelOpen=false;reach.clear()}
}
function setHansaBridge(b,open,now=performance.now(),ai=false){
 if(!b||b.transition||b.open===open)return false;
 const why=open?hansaBridgeConnectReason(b):hansaBridgeBlockReason(b);
 if(why){if(!ai)toast(why);return false}
 if(!open)eraseHansaBridgeEnemies(b);
 b.target=open;b.transition={start:now,from:b.open?1:0,to:open?1:0};
 // A moving deck cannot be entered. It becomes sea only after retraction ends.
 reach.clear();invalidateActionVisuals();save();refreshSelection();return true;
}
function updateHansaBridges(now){
 let changed=false;
 for(const b of hansaBridges){if(!b.transition||now-b.transition.start<b.duration)continue;
  // Recheck in case an external operation placed a friendly unit during animation.
  if(b.target&&hansaBridgeConnectReason(b)){b.target=false;b.transition=null;changed=true;continue}
  if(!b.target&&hansaBridgeBlockReason(b)){b.target=true;b.transition=null;changed=true;continue}
  if(!b.target)eraseHansaBridgeEnemies(b);
  b.open=b.target;b.transition=null;changed=true;
 }
 if(changed){applyHansaBridgeTerrain();save();updateHUD();refreshSelection()}
}
// This hook is called only inside faction zero's actual AI turn, never by rendering.
async function runHansaBridgeAITurn(f){
 if(f!==0||!busy||!aiTurnActive||hansaBridgeSetupRunning||!started||player===0||hansaBridgeCity()?.f!==0)return;
 const now=performance.now(),city=hansaBridgeCity();
 const threat=units.some(u=>u.hp>0&&!u.carriedBy&&atWar(0,u.f)&&distance(city.tile,u.tile)<=5);
 let duration=0;
 for(const b of hansaBridges)if(setHansaBridge(b,!threat,now,true))duration=Math.max(duration,b.duration);
 if(duration){await delay(duration);updateHansaBridges(Math.max(performance.now(),now+duration))}
}
function relocateHansaDeckShips(){
 const deck=new Set(hansaBridges.filter(b=>b.open).flatMap(b=>b.deck));
 for(const u of units){
  if(!isNaval(u)||u.carriedBy||!deck.has(u.tile))continue;
  const seen=new Set([u.tile]),queue=[u.tile];let destination=-1;
  for(let n=0;n<queue.length&&destination<0;n++)for(const i of neighbors(queue[n])){
   if(seen.has(i))continue;seen.add(i);
   if(tiles[i].owner<0&&!unitAt(i)&&!baseAt(i)&&!cityAt(i)){destination=i;break}
   queue.push(i);
  }
  if(destination<0)continue;
  u.tile=destination;for(const cargo of units)if(cargo.carriedBy===u.id)cargo.tile=destination;
  moving=moving.filter(m=>m.id!==u.id);
 }
}
function hansaBridgeAmount(b,now){if(!b.transition)return b.open?1:0;const t=Math.max(0,Math.min(1,(now-b.transition.start)/b.duration));return b.transition.from+(b.transition.to-b.transition.from)*t}
function drawHansaBridgeSpan(b,now){
 const f=hansaBridgeAmount(b,now);if(f<=0)return;
 const a=b.a,z=b.z,m={x:(a.x+z.x)/2,y:(a.y+z.y)/2};
 for(const [origin,end]of [[a,m],[z,m]]){
  const x=origin.x+(end.x-origin.x)*f,y=origin.y+(end.y-origin.y)*f;
  ctx.strokeStyle='#233a38';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(x,y);ctx.stroke();ctx.strokeStyle='#a9b4a0';ctx.lineWidth=3;ctx.stroke();
 }
}
function hansaBridgeEndFrame(b,island){const f=b.dx===1?1:b.dx===-1?0:b.dy===1?3:2;return island?f:[1,0,3,2][f]}
function hansaBridgeBuildingBox(b,island){
 const frame=hansaBridgeEndFrame(b,island),extended=b.name==='west'&&island;
 const crop=extended?HANSA_BRIDGE_WEST_CROP:HANSA_BRIDGE_CROPS[frame],w=34,h=extended?44:w*crop[3]/crop[2];
 const mouth=extended?[.035,HANSA_BRIDGE_WEST_MOUTH]:[[.035,.84],[.965,.84],[.5,.50],[.5,.965]][frame];
 return {crop,w,h,x:-mouth[0]*w,y:-mouth[1]*h,extended};
}
function drawHansaBridgeBuilding(b,island){
 const p=island?b.a:b.z,box=hansaBridgeBuildingBox(b,island),art=box.extended?hansaBridgeWestArt:hansaBridgeAtlas;
 if(!art.idleReady)return;
 ctx.save();ctx.translate(p.x,p.y);ctx.transform(1,b.slope||0,0,1,0,0);ctx.drawImage(art.idle,...box.crop,box.x,box.y,box.w,box.h);ctx.restore();
}
async function askHansaBridge(b){
 if(player!==0||hansaBridgeCity()?.f!==0||busy||b.transition)return;
 const why=b.open?hansaBridgeBlockReason(b):hansaBridgeConnectReason(b);if(why){toast(why);return}
 const open=!b.open;if(!await askApp(open?'연결하시겠습니까?':'교각을 차단하시겠습니까?'))return;
 if(player!==0||hansaBridgeCity()?.f!==0||busy||b.transition)return;
 setHansaBridge(b,open);
}
function hansaBridgeAt(wx,wy){
 for(const b of [...hansaBridges].reverse())for(const island of [false,true]){
  const p=island?b.a:b.z,box=hansaBridgeBuildingBox(b,island),x=wx-p.x,y=wy-p.y-(b.slope||0)*x;
  if(x>=box.x-3&&x<=box.x+box.w+3&&y>=box.y-3&&y<=box.y+box.h+3)return b;
 }
 return null;
}
function hansaBridgeUnderUnit(u){
 if(!u||u.carriedBy)return null;
 const p=pxy(u.tile);
 return hansaBridgeAt(p.x,p.y)||hansaBridges.find(b=>[worldTileAt(b.a.x,b.a.y),worldTileAt(b.z.x,b.z.y)].includes(u.tile));
}
const hansaBridgeSelection=refreshSelection;refreshSelection=function(...args){
 const result=hansaBridgeSelection(...args),button=$('selectionBridge');
 const u=selected?.kind==='unit'?units.find(u=>u.id===selected.id):null;
 const b=hansaBridgeUnderUnit(u),visible=!!b&&player===0&&hansaBridgeCity()?.f===0&&!busy&&!airTarget&&!navalMode&&!coastBuildMode&&!strategicTarget;
 button.style.display=visible?'inline-block':'none';
 button.disabled=!!b?.transition;button.textContent=b&&!b.open?'교각연결':'교각차단';button.title=button.textContent;button.setAttribute('aria-label',button.textContent);
 button.onclick=()=>{const current=selected?.kind==='unit'?units.find(u=>u.id===selected.id):null;const bridge=hansaBridgeUnderUnit(current);if(bridge)void askHansaBridge(bridge)};
 return result;
};
const hansaBridgeTap=tap;tap=function(sx,sy){
 if(started&&!busy&&!menuMode&&!airTarget&&!navalMode&&!coastBuildMode&&!appConfirm){
  const wx=(sx-screenW/2)/cam.z+cam.x,wy=(sy-screenH/2)/cam.z+cam.y,b=hansaBridgeAt(wx,wy);
  if(b&&player===0&&!unitAt(worldTileAt(wx,wy))){void askHansaBridge(b);return}
 }
 return hansaBridgeTap(sx,sy);
};
const hansaBridgeWorld=drawWorld;drawWorld=function(now,backgroundOnly=false){
 updateHansaBridges(now);
 if(!backgroundOnly&&hansaBridges.length){ctx.save();ctx.translate(screenW/2,screenH/2);ctx.scale(cam.z,cam.z);ctx.translate(-cam.x,-cam.y);for(const b of hansaBridges)drawHansaBridgeSpan(b,now);ctx.restore()}
 return hansaBridgeWorld(now,backgroundOnly);
};
const hansaBridgeScene=addAmbientScene;addAmbientScene=function(scene,now){
 hansaBridgeScene(scene,now);let id=992000;
 for(const b of hansaBridges)for(const island of [true,false]){const p=island?b.a:b.z,box=hansaBridgeBuildingBox(b,island);scene.push({kind:'scenery',id:id++,p:{x:p.x,y:p.y+Math.max(0,box.y+box.h)},paint:()=>drawHansaBridgeBuilding(b,island)})}
};
const hansaBridgeMoveCost=moveCost;moveCost=function(u,i){if(hansaBridges.some(b=>b.transition&&b.deck.includes(i)))return 99999;return hansaBridgeMoveCost(u,i)};
const hansaBridgeSnapshot=snapshot;snapshot=function(...args){return {...hansaBridgeSnapshot(...args),hansaBridgeSchema:HANSA_BRIDGE_VERSION,hansaBridges:Object.fromEntries(hansaBridges.map(b=>[b.name,b.target]))}};
const hansaBridgeSetup=setup;setup=function(...args){
 hansaBridgeSetupRunning=true;hansaBridges=[];
 try{const result=hansaBridgeSetup(...args);hansaBridges=createHansaBridges();applyHansaBridgeTerrain();relocateHansaDeckShips();save();return result}finally{hansaBridgeSetupRunning=false}
};
const hansaBridgeMigration=migrateArmy;migrateArmy=function(s,...args){
 hansaBridgeRestoring=true;hansaBridges=createHansaBridges(s.hansaBridges);
 try{const result=hansaBridgeMigration(s,...args);hansaBridges=createHansaBridges(s.hansaBridges);applyHansaBridgeTerrain();relocateHansaDeckShips();return result}finally{hansaBridgeRestoring=false}
};
Object.assign(window.Terha,{setup,migrateArmy,snapshot,tap,moveUnit,moveCost,endTurn,drawWorld,hansaBridgeConnected,setHansaBridge,updateHansaBridges,runHansaBridgeAITurn,relocateHansaDeckShips});

Object.assign(APP_EN,{'연결 불가 : 해군 유닛 존재':'Cannot connect: naval units present','교각차단':'Block bridge','교각연결':'Connect bridge','교각을 차단하시겠습니까?':'Block this bridge?','연결하시겠습니까?':'Reconnect this bridge?','차단 불가 : 아군 유닛 존재':'Cannot block: friendly units present','한사특별도 교각 연결 필요':'Hansa bridge connection required','한사특별도에는 해상수송로가 없습니다':'Hansa has no sea transport route'});

