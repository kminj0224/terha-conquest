'use strict';
// A scenario supplies map/state/objectives to the existing game. It does not
// implement movement, damage, AI, production, selection, UI, or a second canvas.
const CampaignBattle=(()=>{
 const DATA=IRON_CROWN_CAMPAIGN.battle,ID=DATA.id,SCHEMA=DATA.schema,ORIGIN=DATA.map.origin,COLS=DATA.map.cols,ROWS=DATA.map.rows;
 let suspended=null,progress=null,resultTimer=null;
 let image=null;function artwork(){if(!image){image=new Image();image.src=DATA.map.image}return image}
 const tile=(q,r)=>index(ORIGIN.x+q,ORIGIN.y+r);
 const copy=x=>JSON.parse(JSON.stringify(x));
 const active=()=>activeScenario?.id===ID;
 const contains=i=>{const t=tiles[i];return !!t&&t.x>=ORIGIN.x&&t.x<ORIGIN.x+COLS&&t.y>=ORIGIN.y+1&&t.y<ORIGIN.y+ROWS-1};
 function bounds(){return{x:ORIGIN.x*S,y:ORIGIN.y*V,w:COLS*S+S/3,h:ROWS*V+V/2}}
 function constrainCamera(){
  if(!active())return;
  const b=bounds(),minimum=Math.max(screenW/b.w,screenH/b.h)*(1+1e-7);
  cam.z=Math.max(minimum,Math.min(Math.max(2.7,minimum),Number.isFinite(cam.z)?cam.z:minimum));
  const hx=screenW/(2*cam.z),hy=screenH/(2*cam.z);
  cam.x=Math.max(b.x+hx,Math.min(b.x+b.w-hx,Number.isFinite(cam.x)?cam.x:b.x+b.w/2));
  cam.y=Math.max(b.y+hy,Math.min(b.y+b.h-hy,Number.isFinite(cam.y)?cam.y:b.y+b.h/2));
 }
 function captureWorld(){return{rngSeed,map:MAP.tiles,tiles,cities,units,money,tech,turn,player,difficulty,activeSlot,cam,started,uid,logs,productionTier,productionAA,oil,food,foodTurn,strategicResearch,defeatedNotices,diplomacy,militaryResearchJobs,regionTiles,hansaBridges,aiTransportGrantTurn,appRunId,appRunWon,danteExpansionSeeded,missileBases,navalUid,riverTiles:[...RANNA_RIVER_TILES],logHTML:$('log').innerHTML,support:CITY_GROUND_SUPPORT.slice(),center:CITY_GROUND_CENTER.slice(),specialTurns:[...aiSpecialOrderTurns]}}
 function invalidate(){territoryDirty=true;groundViewKey='';roadSignature='';supplyTopology=null;pathOccupancy=null;renderIndex=null;seaComponents=null;transportRoutes.clear();transportLandings.clear();danteExpansionPlan=null;danteFrontPlan=null;danteLandComponents=null;danteCoastalCells=null;captureRouteCache.clear();captureRouteStamp='';aiRifleOrderTurn.fill(-1);resetThreatCache();aiObjectives.fill(null);unitFocusId=null;defenseFocusId=null;selectedDefenseId=null;cityCommandId=null;cityCommandTab='overview';selected=null;panelOpen=false;airTarget=null;strategicTarget=null;navalMode=null;coastBuildMode=false;armedMissile=null;armedBomber=null;supplyChoice=null;reach.clear();aimMotions.clear();fireMotions.clear();fx=[];moving=[];clearWorldNotices();resetCombatAudio();resetDanteGhosts();resetHansaGhosts();}
 function createMap(){
  MAP.tiles=tiles.map(()=>[-1,0]);tiles=tiles.map(t=>({x:t.x,y:t.y,owner:-1,terrain:0,city:-1,region:-1}));
  for(let q=0;q<COLS;q++)for(let r=1;r<ROWS-1;r++){
   const i=tile(q,r),owner=q<10?2:1,terrain=(q<4&&r<4||q>13&&r>7)?2:0;
   MAP.tiles[i]=[owner,terrain];Object.assign(tiles[i],{owner,terrain});
  }
 }
 function ensureContext(){if(active())return;if(busy)throw Error('An operation is still running');suspended=captureWorld();activeScenario={id:ID};document.body.dataset.scenario=ID;RANNA_RIVER_TILES.clear();CITY_GROUND_SUPPORT.fill(0);CITY_GROUND_CENTER.fill(0);createMap();}
 function newMission(level){
  units=[];cities=[];logs=[];productionTier=1;productionAA=false;uid=1;turn=1;player=2;difficulty=[0,1,2].includes(level)?level:1;activeSlot=0;started=true;busy=false;
  money=Array(7).fill(950);food=Array(7).fill(1200);oil=Array(7).fill(180);tech=Array(7).fill(0);foodTurn=turn;
  strategicResearch=factions.map(()=>({ballistic:false,nuclear:false,jobs:[]}));militaryResearchJobs=Array(7).fill(null);defeatedNotices=new Set([0,3,4,5,6]);
  diplomacy=factions.map((_,a)=>factions.map((_,b)=>a===b?'self':'neutral'));diplomacy[1][2]=diplomacy[2][1]='war';
  missileBases=[];navalUid=1;hansaBridges=[];aiTransportGrantTurn=Array(7).fill(-1);aiSpecialOrderTurns.fill(-1);danteExpansionSeeded=true;
  for(const [name,q,r,f,origin,level,capital,hp]of DATA.cities){
   const city={id:cities.length,name,tile:tile(q,r),f,origin,level,capital,seedId:7000+cities.length,airport:false,airTurn:-1,queue:null,produced:false,lastAttackedTurn:turn};
   cityProfile(city);city.hp=hp===null?cityMaxHp(city):hp;syncWarheads(city);cities.push(city);tiles[city.tile].city=city.id;
  }
  buildRegions();
  const fort=makeUnit(DATA.player,DATA.fortress.type,tile(DATA.fortress.q,DATA.fortress.r),1);fort.missionName=DATA.fortress.name;fort.missionRole='iron-crown';
  for(const [type,q,r]of DATA.friendly)makeUnit(2,type,tile(q,r),1);
  for(const [type,q,r]of DATA.enemy)makeUnit(1,type,tile(q,r),1);
  if(difficulty===2)for(const [type,q,r]of DATA.hardExtra)makeUnit(1,type,tile(q,r),1);
  progress={fortressId:fort.id,exit:tile(DATA.exit.q,DATA.exit.r),result:null,triggered:[],initialFriendly:units.filter(u=>u.f===2).map(u=>u.id)};
  appRunId='iron-crown-'+Date.now();appRunWon=false;cam={...pxy(fort.tile),z:1.2};invalidate();faceInitialArmy();
  log('임무: 〈철관〉(제'+fort.id+'부대)을 동쪽 출구로 이동');worldNotice('출정 허가 · 〈철관〉을 동쪽 출구로 이동하십시오.');updateHUD();refreshSelection();save();
 }
 function valid(s){
  if(!s||s.scenario!==ID||s.scenarioSchema!==SCHEMA||!Array.isArray(s.units)||!Array.isArray(s.cities)||s.cities.length!==3||!Array.isArray(s.owners)||s.owners.length!==tiles.length||s.player!==2||!Number.isInteger(s.turn)||s.turn<1||!s.missionProgress||!Number.isInteger(s.missionProgress.fortressId))return false;
  const ids=new Set();return s.units.every(u=>Number.isInteger(u.id)&&!ids.has(u.id)&&ids.add(u.id)&&!!TYPES[u.type]&&Number.isFinite(u.hp)&&u.hp>0&&contains(u.tile))&&s.cities.every((q,i)=>q.id===i&&contains(q.tile)&&Number.isFinite(q.hp))&&['money','food','oil','tech'].every(k=>Array.isArray(s[k])&&s[k].length===7&&s[k].every(Number.isFinite));
 }
 function restore(s,slot=0){
  if(!active()||!valid(s))return false;
  const v=copy(s);rngSeed=v.rngSeed??rngSeed;productionTier=v.productionTier??1;productionAA=!!v.productionAA;({units,cities,money,food,oil,tech,turn,player,difficulty,uid,cam}=v);activeSlot=slot||v.activeSlot||0;
  strategicResearch=v.strategicResearch||factions.map(()=>({ballistic:false,nuclear:false,jobs:[]}));militaryResearchJobs=v.militaryResearchJobs||Array(7).fill(null);foodTurn=v.foodTurn||turn;diplomacy=v.diplomacy;missileBases=v.missileBases||[];navalUid=v.navalUid||1;defeatedNotices=new Set(v.defeatedNotices||[0,3,4,5,6]);aiTransportGrantTurn=v.aiTransportGrantTurn||Array(7).fill(-1);aiSpecialOrderTurns.forEach((_,i)=>aiSpecialOrderTurns[i]=v.aiSpecialOrderTurns?.[i]??-1);hansaBridges=[];danteExpansionSeeded=true;
  appRunId=v.appRunId||'iron-crown-'+Date.now();appRunWon=false;progress=copy(v.missionProgress);tiles.forEach((t,i)=>{t.city=-1;t.owner=v.owners[i]??-1});cities.forEach(q=>{tiles[q.tile].city=q.id;cityProfile(q);syncWarheads(q)});buildRegions();started=true;busy=false;invalidate();constrainCamera();updateHUD();refreshSelection();return true;
 }
 function start(s,level=1){artwork();ensureContext();if(s){if(!restore(s))throw Error('Invalid campaign save')}else newMission(level);constrainCamera();setAppScreen('game');updateHUD();refreshSelection();save();return snapshot()}
 function metadata(){constrainCamera();return active()?{scenario:ID,scenarioSchema:SCHEMA,missionProgress:copy(progress),rngSeed,militaryResearchJobs,productionTier,productionAA,aiSpecialOrderTurns:[...aiSpecialOrderTurns]}:{}}
 function leave(){
  if(!active()||busy)return false;clearTimeout(resultTimer);resultTimer=null;
  const saved=suspended;if(!saved)return false;MAP.tiles=saved.map;
  ({rngSeed,tiles,cities,units,money,tech,turn,player,difficulty,activeSlot,cam,started,uid,logs,productionTier,productionAA,oil,food,foodTurn,strategicResearch,defeatedNotices,diplomacy,militaryResearchJobs,regionTiles,hansaBridges,aiTransportGrantTurn,appRunId,appRunWon,danteExpansionSeeded}=saved);
  aiSpecialOrderTurns.forEach((_,i)=>aiSpecialOrderTurns[i]=saved.specialTurns[i]);RANNA_RIVER_TILES.clear();for(const i of saved.riverTiles)RANNA_RIVER_TILES.add(i);for(let i=0;i<saved.support.length;i++){CITY_GROUND_SUPPORT[i]=saved.support[i];CITY_GROUND_CENTER[i]=saved.center[i]}$('log').innerHTML=saved.logHTML;activeScenario=null;delete document.body.dataset.scenario;suspended=null;progress=null;missileBases=saved.missileBases||[];navalUid=saved.navalUid||1;busy=false;invalidate();updateHUD();refreshSelection();window.TerhaCampaign?.onLeave();return true;
 }
 function check(){
  if(!active()||!progress)return false;
  const fort=units.find(u=>u.id===progress.fortressId&&u.hp>0);
  if(!progress.result){if(!fort)progress.result='lost';else if(fort.tile===progress.exit)progress.result='won';}
  for(const event of DATA.triggers){const city=cities.find(q=>q.id===event.city);if(city?.f===event.owner&&!progress.triggered.includes(event.id)){progress.triggered.push(event.id);worldNotice(event.message)}}
  if(!progress.result||busy||resultTimer||!['game','menu'].includes(appScreen))return false;
  const delayMs=Math.max(0,...moving.map(a=>a.start+a.duration-performance.now()))+50;
  resultTimer=setTimeout(()=>{resultTimer=null;if(!active()||busy)return;save();if(['game','menu'].includes(appScreen))complete(progress.result==='won')},delayMs);return true;
 }
 function complete(win){if(!active())return;progress.result=win?'won':'lost';save();window.TerhaCampaign?.onResult(win,snapshot());}
 function onSaved(s){if(!active())return;window.TerhaCampaign?.onBattleSnapshot(s);check()}
 function objective(){if(!active())return null;const fort=units.find(u=>u.id===progress?.fortressId),d=fort?distance(fort.tile,progress.exit):14;return{label:'〈철관〉을 동쪽 출구로 이동',percent:progress?.result==='won'?100:Math.max(0,Math.min(99,(14-d)/14*100)),value:progress?.result==='won'?'완료':progress?.result==='lost'?'실패':Math.ceil(d)+'칸'}}
 const nativeGround=drawStaticGround;drawStaticGround=function(){if(!active())return nativeGround();const b=bounds();ctx.fillStyle='#091721';ctx.fillRect(cam.x-screenW/2/cam.z-2,cam.y-screenH/2/cam.z-2,screenW/cam.z+4,screenH/cam.z+4);if(image?.complete&&image.naturalWidth)ctx.drawImage(image,b.x,b.y,b.w,b.h);const p=pxy(progress?.exit??tile(16,4));ctx.save();hex(p,32);ctx.fillStyle='#e7c56a55';ctx.fill();ctx.strokeStyle='#ebd18b';ctx.lineWidth=2;ctx.stroke();ctx.font='bold 13px Terha,sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffe4a3';ctx.strokeStyle='#10222a';ctx.lineWidth=3;ctx.strokeText('출구',p.x,p.y-35);ctx.fillText('출구',p.x,p.y-35);ctx.restore()};
 const nativeMini=drawMini;drawMini=function(){if(!active())return nativeMini();if($('mini').style.display!=='block')return;const m=$('mini'),g=m.getContext('2d'),b=bounds();m.width=166;m.height=119;g.fillStyle='#091721';g.fillRect(0,0,166,119);if(image?.complete&&image.naturalWidth)g.drawImage(image,0,0,166,119);for(const q of cities){const p=pxy(q.tile);g.fillStyle=factions[q.f].color;g.fillRect((p.x-b.x)/b.w*166,(p.y-b.y)/b.h*119,3,3)}g.strokeStyle='#f3e8bd';g.strokeRect((cam.x-screenW/2/cam.z-b.x)/b.w*166,(cam.y-screenH/2/cam.z-b.y)/b.h*119,screenW/cam.z/b.w*166,screenH/cam.z/b.h*119)};
 const nativeMapButton=$('mapbtn').onclick;$('mapbtn').onclick=()=>{if(!active())return nativeMapButton();$('mini').style.display=$('mini').style.display==='block'?'none':'block';const b=bounds();cam.x=b.x+b.w/2;cam.y=b.y+b.h/2;cam.z=Math.max(screenW/b.w,screenH/b.h);constrainCamera()};
 const nativeMiniClick=$('mini').onclick;$('mini').onclick=e=>{if(!active())return nativeMiniClick(e);const r=$('mini').getBoundingClientRect(),b=bounds();cam.x=b.x+(e.clientX-r.left)/r.width*b.w;cam.y=b.y+(e.clientY-r.top)/r.height*b.h;constrainCamera()};
 window.addEventListener('resize',constrainCamera);
 return{active,contains,tile,bounds,constrainCamera,start,restore,valid,leave,metadata,check,complete,onSaved,objective,ready:()=>!!image?.complete&&image.naturalWidth>0,inspect:()=>({active:active(),progress:copy(progress),bounds:bounds()})};
})();
window.TerhaScenario=CampaignBattle;
