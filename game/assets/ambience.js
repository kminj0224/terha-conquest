
'use strict';
const hansaGhostArt={normal:loadBaekArt('hansa-ghost-normal.png'),strong:loadBaekArt('hansa-ghost-strong.png')};
let hansaGhostState={alpha:0,strong:0,clock:0,last:null};
function hansaThreat(){
 const city=cities.find(q=>q.origin===0&&q.capital);
 if(!city)return{city:null,near:false,strong:false};
 const enemies=units.filter(u=>u.hp>0&&!u.carriedBy&&atWar(0,u.f));
 return{city,near:enemies.some(u=>distance(city.tile,u.tile)<=3),strong:enemies.filter(u=>distance(city.tile,u.tile)<=5).length>=3};
}
function updateHansaGhosts(now){
 const state=hansaGhostState,dt=state.last===null?0:Math.max(0,Math.min(100,now-state.last));state.last=now;
 const threat=cachedHansaThreat(now);state.clock+=dt;
 const target=started&&threat.near?1:0;
 state.alpha=Math.max(0,Math.min(1,state.alpha+(target?dt/4000:-dt/5000)));
 const strong=threat.strong?1:0;state.strong+=Math.sign(strong-state.strong)*Math.min(Math.abs(strong-state.strong),dt/1500);
 return threat;
}
function ghostPosition(city,n){
 const center=pxy(city.tile),time=hansaGhostState.clock/1000,angle=n*Math.PI*2/5+time*(.10+n*.007),radius=85+n*10;
 return{x:center.x+Math.cos(angle)*radius,y:center.y+Math.sin(angle)*radius*.70,bob:Math.sin(time*1.1+n*1.7)*5,n};
}
function drawHansaGhost(p){
 const state=hansaGhostState,height=58+p.n%3*3;
 ctx.save();const images=[[hansaGhostArt.normal,1-state.strong],[hansaGhostArt.strong,state.strong]];
 for(const [art,weight]of images){if(!art.idleReady||weight<=0)continue;const width=height*art.idle.naturalWidth/art.idle.naturalHeight;ctx.globalAlpha=state.alpha*.62*weight;ctx.drawImage(art.idle,p.x-width/2,p.y-height-12+p.bob,width,height)}ctx.restore();
}
function addAmbientScene(scene,now){
 const threat=updateHansaGhosts(now);
 for(const e of fx){if(e.kind!=='whale'||now<e.start||now-e.start>=e.duration)continue;const p={x:e.x,y:e.y};scene.push({kind:'whale',id:e.start,p,paint:()=>drawNavalEffect(e,(now-e.start)/e.duration)})}
 if(!threat.city||hansaGhostState.alpha<=0)return;
 const objectDepth=new Map();for(const item of scene){if(item.kind==='ghost'||item.kind==='whale')continue;const tile=worldTileAt(item.p.x,item.p.y);objectDepth.set(tile,Math.max(objectDepth.get(tile)??-Infinity,item.p.y))}
 for(let n=0;n<5;n++){
  const p=ghostPosition(threat.city,n),tile=worldTileAt(p.x,p.y);
  // Passing through an occupied tile is the requested foreground exception.
  const depthY=Math.max(p.y,(objectDepth.get(tile)??-Infinity)+.01);
  scene.push({kind:'ghost',id:n,p:{x:p.x,y:depthY},paint:()=>drawHansaGhost(p)});
 }
}
function resetHansaGhosts(){resetThreatCache();hansaGhostState={alpha:0,strong:0,clock:0,last:null}}
const ghostSetup=setup;setup=function(){resetHansaGhosts();return ghostSetup()};
const ghostMigration=migrateArmy;migrateArmy=function(s){resetHansaGhosts();return ghostMigration(s)};
Object.assign(window.Terha,{setup,migrateArmy,hansaThreat,canCounterattack,rollCounterattack});

// Dante's apparitions stay tied to the original nation after its capital is captured.
const danteGhostArt=loadBaekArt('dante-ghost.png');
let danteGhostState={alpha:0,last:null,clock:0,checked:-Infinity,city:null,near:false};
function resetDanteGhosts(){danteGhostState={alpha:0,last:null,clock:0,checked:-Infinity,city:null,near:false}}
function danteThreat(){const city=cities.find(q=>q.origin===1&&q.capital);return{city,near:!!city&&units.some(u=>u.hp>0&&!u.carriedBy&&atWar(1,u.f)&&distance(city.tile,u.tile)<=3)}}
function updateDanteGhosts(now){const state=danteGhostState,dt=state.last===null?0:Math.max(0,Math.min(100,now-state.last));state.last=now;state.clock+=dt;if(now<state.checked||now-state.checked>=150){const threat=danteThreat();state.city=threat.city;state.near=threat.near;state.checked=now}state.alpha=Math.max(0,Math.min(1,state.alpha+(started&&state.near?dt/3500:-dt/1800)));return state}
function drawDanteGhost(p,side){if(!danteGhostArt.idleReady)return;const h=S*3,w=h*danteGhostArt.idle.naturalWidth/danteGhostArt.idle.naturalHeight;ctx.save();ctx.globalAlpha=danteGhostState.alpha*(.21+.28*(.5+.5*Math.sin(danteGhostState.clock*.0018)));ctx.translate(p.x,p.y);ctx.scale(side<0?1:-1,1);ctx.drawImage(danteGhostArt.idle,-w/2,-h*.82,w,h);ctx.restore()}
const danteAmbientScene=addAmbientScene;addAmbientScene=function(scene,now){danteAmbientScene(scene,now);const state=updateDanteGhosts(now);if(!state.city||state.alpha<=0)return;const t=tiles[state.city.tile];for(const side of [-1,1]){const i=index(t.x+side,t.y);if(i<0)continue;const p=pxy(i);scene.push({kind:'ghost',id:20+side,p,paint:()=>drawDanteGhost(p,side)})}};
