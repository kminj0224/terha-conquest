'use strict';
// A scenario supplies map/state/objectives to the existing game. It does not
// implement movement, damage, AI, production, selection, UI, or a second canvas.
const CampaignBattle=(()=>{
 let DATA=IRON_CROWN_CAMPAIGN.battle,ID=DATA.id,SCHEMA=DATA.schema,ORIGIN=DATA.map.origin,COLS=DATA.map.cols,ROWS=DATA.map.rows;
 function config(id){return id==='iron-crown-m03'?IRON_CROWN_CAMPAIGN.battle3:id==='iron-crown-m02'?IRON_CROWN_CAMPAIGN.battle2:id==='iron-crown-m01'?IRON_CROWN_CAMPAIGN.battle:null}
 function configure(id){const d=config(id);if(!d)throw Error('Unknown mission');if(activeScenario&&activeScenario.id!==id)throw Error('Leave current mission first');if(DATA!==d)image=null;DATA=d;ID=d.id;SCHEMA=d.schema;ORIGIN=d.map.origin;COLS=d.map.cols;ROWS=d.map.rows;}
 let suspended=null,progress=null,resultTimer=null;
 let image=null;function artwork(){if(!image){image=new Image();image.src=DATA.map.image}return image}
 const tile=(q,r)=>index(ORIGIN.x+q,ORIGIN.y+r);
 const copy=x=>JSON.parse(JSON.stringify(x));
 const active=()=>activeScenario?.id===ID;
 const inMap=(i,d=DATA)=>{const t=tiles[i],o=d.map.origin;return !!t&&t.x>=o.x&&t.x<o.x+d.map.cols&&t.y>=o.y+1&&t.y<o.y+d.map.rows-1};
 const contains=i=>inMap(i);
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
   const i=tile(q,r),owner=q<(ID==='iron-crown-m02'?6:10)?2:1,terrain=ID==='iron-crown-m02'?0:(q<4&&r<4||q>13&&r>7)?2:0;
   let origin=owner;
   if(ID!=='iron-crown-m01'){
    const local=DATA.cities.reduce((a,b)=>distance(i,tile(a[1],a[2]))<=distance(i,tile(b[1],b[2]))?a:b);
    origin=local[4];
   }
   MAP.tiles[i]=[origin,terrain];Object.assign(tiles[i],{owner,terrain});
  }
  CampaignTerrain.apply(DATA);
 }
 function ensureContext(){if(active())return;if(busy)throw Error('An operation is still running');suspended=captureWorld();activeScenario={id:ID};document.body.dataset.scenario=ID;RANNA_RIVER_TILES.clear();CITY_GROUND_SUPPORT.fill(0);CITY_GROUND_CENTER.fill(0);createMap();}
 function newMission(level,options={}){
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
  if(ID!=='iron-crown-m01'){
   progress.route=ID==='iron-crown-m03'?(options.route==='cargo'?'cargo':'troops'):(options.route==='pay'?'pay':'recapture');progress.waves=[];progress.pending=[];progress.lastTurn=0;progress.waveSerial=0;
   if(ID==='iron-crown-m03'){progress.holdTurns=0;progress.holdStart=null;progress.deliveryStart=null;progress.delivered=false;progress.cargoSecured=false}
   // Ordinary formations are mission-local. Only the named fortress persists.
   const previous=options.carry;
   if(previous?.scenario===(ID==='iron-crown-m03'?'iron-crown-m02':'iron-crown-m01')&&previous.missionProgress?.result==='won'){
    const hero=previous.units.find(u=>u.f===2&&u.hp>0&&u.missionRole==='iron-crown');
    tech[2]=Math.max(0,Math.min(5,previous.tech?.[2]||0));
    if(hero){fort.level=hero.level;fort.xp=hero.xp||0;fort.hp=Math.min(unitMaxHp(fort),hero.hp)}
    progress.initialFriendly=units.filter(u=>u.f===2).map(u=>u.id);
    for(const [key,target]of [['money',money],['food',food],['oil',oil]])target[2]+=Math.floor(Math.max(0,previous[key]?.[2]||0)*.25);
   }
   food[2]+=5400;oil[2]+=180;
   // The paid passage gives the central staging point, never skips a wave.
   if(ID==='iron-crown-m02'&&progress.route==='pay'){
    money[2]-=600;const gate=cities[1];gate.f=2;gate.hp=cityMaxHp(gate);buildRegions();
    const army=units.filter(u=>u.f===2),sites=[];
    for(let q=0;q<COLS;q++)for(let r=1;r<ROWS-1;r++)sites.push(tile(q,r));
    sites.sort((a,b)=>distance(a,gate.tile)-distance(b,gate.tile));
    for(const u of army){const site=sites.find(i=>tiles[i].owner===2&&!unitAt(i));if(site!==undefined)u.tile=site}
   }
   // Scripted reinforcements supply the enemy. Its normal economy/AI still runs.
   money[1]=350;food[1]=500;oil[1]=220;
  }
  CampaignTerrain.relocate(DATA);
  appRunId='iron-crown-'+Date.now();appRunWon=false;cam={...pxy(fort.tile),z:1.2};invalidate();faceInitialArmy();
  const order=ID==='iron-crown-m03'?'철도 분기점 · 중앙역·신호소 확보 후 5턴 방어':ID==='iron-crown-m02'?'닫힌 관문 · 관문과 남부 보급소 확보':'출정 허가 · 〈철관〉을 동쪽 출구로 이동';log(order);worldNotice(order);updateHUD();refreshSelection();save();
 }
 function valid(s){
  const d=config(s?.scenario);
  if(!s||!d||s.scenarioSchema!==d.schema||!Array.isArray(s.units)||!Array.isArray(s.cities)||s.cities.length!==d.cities.length||!Array.isArray(s.owners)||s.owners.length!==tiles.length||s.player!==2||!Number.isInteger(s.turn)||s.turn<1||!s.missionProgress||!Number.isInteger(s.missionProgress.fortressId))return false;
  if(s.scenario==='iron-crown-m02'&&(!['pay','recapture'].includes(s.missionProgress.route)||!Array.isArray(s.missionProgress.waves)||!Array.isArray(s.missionProgress.pending)||!Number.isInteger(s.missionProgress.lastTurn)||!Number.isInteger(s.missionProgress.waveSerial)))return false;
  if(s.scenario==='iron-crown-m03'){
   const p=s.missionProgress;
   if(!['troops','cargo'].includes(p.route)||!Array.isArray(p.waves)||!Array.isArray(p.pending)||!Number.isInteger(p.lastTurn)||!Number.isInteger(p.waveSerial)||!Number.isInteger(p.holdTurns)||p.holdTurns<0||p.holdTurns>5||![p.holdStart,p.deliveryStart].every(v=>v===null||Number.isInteger(v)&&v>0&&v<=s.turn)||typeof p.delivered!=='boolean'||typeof p.cargoSecured!=='boolean')return false;
  }
  const ids=new Set();return s.units.every(u=>Number.isInteger(u.id)&&!ids.has(u.id)&&ids.add(u.id)&&!!TYPES[u.type]&&Number.isFinite(u.hp)&&u.hp>0&&inMap(u.tile,d))&&s.cities.every((q,i)=>q.id===i&&inMap(q.tile,d)&&Number.isFinite(q.hp))&&['money','food','oil','tech'].every(k=>Array.isArray(s[k])&&s[k].length===7&&s[k].every(Number.isFinite));
 }
 function restore(s,slot=0){
  if(!active()||s?.scenario!==ID||!valid(s))return false;
  const v=copy(s);rngSeed=v.rngSeed??rngSeed;productionTier=v.productionTier??1;productionAA=!!v.productionAA;({units,cities,money,food,oil,tech,turn,player,difficulty,uid,cam}=v);activeSlot=slot||v.activeSlot||0;
  strategicResearch=v.strategicResearch||factions.map(()=>({ballistic:false,nuclear:false,jobs:[]}));militaryResearchJobs=v.militaryResearchJobs||Array(7).fill(null);foodTurn=v.foodTurn||turn;diplomacy=v.diplomacy;missileBases=v.missileBases||[];navalUid=v.navalUid||1;defeatedNotices=new Set(v.defeatedNotices||[0,3,4,5,6]);aiTransportGrantTurn=v.aiTransportGrantTurn||Array(7).fill(-1);aiSpecialOrderTurns.forEach((_,i)=>aiSpecialOrderTurns[i]=v.aiSpecialOrderTurns?.[i]??-1);hansaBridges=[];danteExpansionSeeded=true;
  appRunId=v.appRunId||'iron-crown-'+Date.now();appRunWon=false;progress=copy(v.missionProgress);tiles.forEach((t,i)=>{t.city=-1;t.owner=v.owners[i]??-1});CampaignTerrain.apply(DATA);cities.forEach(q=>{q.tile=tile(DATA.cities[q.id][1],DATA.cities[q.id][2]);tiles[q.tile].city=q.id;cityProfile(q);syncWarheads(q)});CampaignOrders.clearNaval();CampaignTerrain.relocate(DATA);buildRegions();started=true;busy=false;invalidate();constrainCamera();updateHUD();refreshSelection();return true;
 }
 function start(s,level=1,options={}){configure(s?.scenario||options.id||'iron-crown-m01');artwork();ensureContext();if(s){if(!restore(s))throw Error('Invalid campaign save')}else newMission(level,options);constrainCamera();setAppScreen('game');updateHUD();refreshSelection();save();return snapshot()}
 function metadata(){if(active()&&!busy)tick();constrainCamera();return active()?{scenario:ID,scenarioSchema:SCHEMA,missionProgress:copy(progress),rngSeed,militaryResearchJobs,productionTier,productionAA,aiSpecialOrderTurns:[...aiSpecialOrderTurns]}:{}}
 function leave(){
  if(!active()||busy)return false;clearTimeout(resultTimer);resultTimer=null;
  const saved=suspended;if(!saved)return false;MAP.tiles=saved.map;
  ({rngSeed,tiles,cities,units,money,tech,turn,player,difficulty,activeSlot,cam,started,uid,logs,productionTier,productionAA,oil,food,foodTurn,strategicResearch,defeatedNotices,diplomacy,militaryResearchJobs,regionTiles,hansaBridges,aiTransportGrantTurn,appRunId,appRunWon,danteExpansionSeeded}=saved);
  aiSpecialOrderTurns.forEach((_,i)=>aiSpecialOrderTurns[i]=saved.specialTurns[i]);RANNA_RIVER_TILES.clear();for(const i of saved.riverTiles)RANNA_RIVER_TILES.add(i);for(let i=0;i<saved.support.length;i++){CITY_GROUND_SUPPORT[i]=saved.support[i];CITY_GROUND_CENTER[i]=saved.center[i]}$('log').innerHTML=saved.logHTML;activeScenario=null;delete document.body.dataset.scenario;suspended=null;progress=null;missileBases=saved.missileBases||[];navalUid=saved.navalUid||1;busy=false;invalidate();updateHUD();refreshSelection();window.TerhaCampaign?.onLeave();return true;
 }

 function edgeSites(edge,entry=null){
  if(ID==='iron-crown-m03'&&entry){
   const anchor=tile(entry.q,entry.r),sites=[];
   for(let q=0;q<COLS;q++)for(let r=1;r<ROWS-1;r++){
    const i=tile(q,r);if(!CampaignTerrain.blocked(i,DATA)&&!cityAt(i)&&distance(i,anchor)<=2)sites.push(i);
   }
   return sites.sort((a,b)=>distance(a,anchor)-distance(b,anchor));
  }
  const sites=[];
  if(edge==='east')for(let r=2;r<ROWS-2;r++)sites.push(tile(COLS-1,r));
  if(edge==='north')for(let q=7;q<COLS-2;q++)sites.push(tile(q,1));
  if(edge==='southwest')for(let q=0;q<11;q++)sites.push(tile(q,ROWS-2));
  const legal=sites.filter(i=>!CampaignTerrain.blocked(i,DATA));if(legal.length)return legal;
  // Where the illustration's road ends at a cliff boundary, use that road mouth.
  for(let q=0;q<COLS;q++)for(let r=1;r<ROWS-1;r++){
   const i=tile(q,r);if(!CampaignTerrain.blocked(i,DATA)&&neighbors(i).some(j=>CampaignTerrain.blocked(j,DATA)))sites.push(i);
  }
  return [...new Set(sites)].filter(i=>!CampaignTerrain.blocked(i,DATA)).sort((a,b)=>{
   const rank=i=>{const t=tiles[i];return edge==='north'?(t.y-ORIGIN.y)*3+Math.abs(t.x-ORIGIN.x-COLS*.55):edge==='southwest'?(COLS-(t.y-ORIGIN.y))*2+(t.x-ORIGIN.x):COLS-(t.x-ORIGIN.x)};
   return rank(a)-rank(b);
  }).slice(0,8);
 }
 function waveAlive(){return units.filter(u=>u.f===1&&u.missionWave&&u.hp>0).length}
 function cleared(){return progress.waves?.length===DATA.waves?.length&&!progress.pending.length&&waveAlive()===0}
 function secured(){return cities[1].f===2&&cities[2].f===2}
 function waveDue(w){
  const fort=units.find(u=>u.id===progress.fortressId),forward=units.some(u=>u.f===2&&tiles[u.tile].x>=ORIGIN.x+8);
  if(ID==='iron-crown-m03')return w.stage==='approach'?(forward||turn>=w.turn):w.stage==='station'?cities[1].f===2:w.stage==='hold2'?progress.holdTurns>=1:progress.holdTurns>=3;
  if(turn>=w.turn)return true;
  if(w.turn===5)return forward;
  if(w.turn===9)return cities[1].f===2;
  if(w.turn===13)return cities[2].f===2;
  if(w.turn===17)return secured();
  return secured()&&fort&&tiles[fort.tile].x>=ORIGIN.x+18;
 }
 function tick(){
  if(!progress||ID==='iron-crown-m01'||progress.result)return;
  if(ID==='iron-crown-m03'){
   if(secured()){
    if(progress.holdStart===null){progress.holdStart=turn;if(!progress.triggered.includes('defense-started'))progress.triggered.push('defense-started');worldNotice('두 거점 확보 · 연속 방어 시작 0/5턴')}
    const before=progress.holdTurns;progress.holdTurns=Math.min(DATA.holdRequired,turn-progress.holdStart);
    if(before<DATA.holdRequired&&progress.holdTurns>=DATA.holdRequired)worldNotice('연속 5턴 방어 완료');
   }else{
    if(progress.holdStart!==null)worldNotice((cities[1].f!==2?'중앙역':'신호소')+' 상실 · 방어 중단, 0/5턴으로 초기화');
    progress.holdStart=null;progress.holdTurns=0;
   }
   if(cities[1].f===2){if(progress.deliveryStart===null)progress.deliveryStart=turn}else if(!progress.delivered)progress.deliveryStart=null;
   if(!progress.delivered&&progress.deliveryStart!==null&&turn-progress.deliveryStart>=(progress.route==='troops'?2:4)){
    const typeList=progress.route==='troops'?[0,9,2]:[0,0],anchor=cities[0].tile;
    for(const type of typeList){const sites=[];for(let q=0;q<COLS;q++)for(let r=1;r<ROWS-1;r++){const i=tile(q,r);if(tiles[i].owner===2&&!unitAt(i))sites.push(i)}sites.sort((a,b)=>distance(a,anchor)-distance(b,anchor));if(sites[0]!==undefined)makeUnit(2,type,sites[0],1)}
    progress.delivered=true;if(progress.route==='cargo'){progress.cargoSecured=true;money[2]+=800}worldNotice(progress.route==='troops'?'증원 편성 하역 완료':'왕실 화물 배차 완료 · 후속 병력 도착');
   }
  }
  if(progress.lastTurn!==turn)money[1]=Math.min(money[1],DATA.enemyGoldCeiling);
  progress.lastTurn=turn;
  for(const w of DATA.waves){
   if(!progress.triggered.includes('warn-'+w.turn)&&((ID==='iron-crown-m02'&&turn>=w.turn-2)||waveDue(w))){progress.triggered.push('warn-'+w.turn);worldNotice(w.name+' 집결 중')}
   if(waveDue(w)&&!progress.waves.includes(w.turn)){
    progress.waves.push(w.turn);
    w.troops.forEach((type,n)=>progress.pending.push({type,edge:w.edge==='split'?(n%2?'southwest':'east'):w.edge,wave:w.turn,serial:progress.waveSerial++,entry:w.entry||null}));
    if(difficulty===2)progress.pending.push({type:9,edge:w.edge==='split'?'east':w.edge,wave:w.turn,serial:progress.waveSerial++,entry:w.entry||null});
    worldNotice(w.name+' 접근');
   }
  }
  // Never teleport beside a player unit or overwrite an occupied edge cell.
  const pending=[];
  for(const entry of progress.pending){const sites=edgeSites(entry.edge,entry.entry),site=sites.find(i=>!unitAt(i)&&units.every(u=>u.f!==2||distance(i,u.tile)>2));
   if(site===undefined){pending.push(entry);continue}
   const tier=difficulty===0?1:entry.wave>=17?2:1,u=makeUnit(1,entry.type,site,tier);u.missionWave=entry.wave;u.missionWaveSerial=entry.serial;
  }
  progress.pending=pending;
  window.refreshCampaignDefenseStatus?.();
 }
 function defenseStatus(){
  if(!active()||ID!=='iron-crown-m03'||!progress)return null;
  const held=secured(),complete=held&&progress.holdTurns>=DATA.holdRequired;
  return{held,complete,title:!held?(progress.triggered.includes('defense-started')?'방어 중단 · 0/5턴':'중앙역·신호소를 점령하십시오'):complete?'5턴 방어 완료':'연속 방어 '+progress.holdTurns+' / '+DATA.holdRequired+'턴',
   sites:(cities[1].f===2?'중앙역 확보':'중앙역 미확보')+' · '+(cities[2].f===2?'신호소 확보':'신호소 미확보'),
   next:!held?'두 거점을 모두 확보하면 방어 시작':complete?'작전 성공':'다음 턴 시작 시 '+Math.min(DATA.holdRequired,progress.holdTurns+1)+' / '+DATA.holdRequired+'턴'};
 }
 function goalRows(){
  if(!active()||!progress)return[];
  const fort=units.find(u=>u.id===progress.fortressId&&u.hp>0);
  if(ID==='iron-crown-m03')return[
   {label:'목표 거점 확보',done:secured(),value:(cities[1].f===2?'중앙역 ☑':'중앙역 ☐')+' · '+(cities[2].f===2?'신호소 ☑':'신호소 ☐')},
   {label:'연속 방어 '+progress.holdTurns+' / '+DATA.holdRequired+'턴',done:secured()&&progress.holdTurns>=DATA.holdRequired,value:secured()?(progress.holdTurns>=DATA.holdRequired?'방어 완료 · 두 거점을 계속 유지하십시오':'다음 턴 시작 시 '+Math.min(DATA.holdRequired,progress.holdTurns+1)+' / '+DATA.holdRequired+'턴'):'두 거점을 모두 점령하면 시작',note:'점령한 턴은 0턴 · 한 곳이라도 잃으면 초기화'},
   {label:'〈철관〉·아군 생산 거점 보존',done:!!fort&&cities.some(q=>q.f===2),value:fort?'철관 내구도 '+Math.ceil(fort.hp)+' · 생산 거점 '+cities.filter(q=>q.f===2).length+'곳':'철관 격파'}];
  if(ID==='iron-crown-m02'){
   const next=DATA.waves.find(w=>!progress.waves.includes(w.turn));
   return[{label:'반격 격퇴',done:cleared(),value:next?'집결 중: '+next.name:'잔여 '+(waveAlive()+progress.pending.length)+'부대'},
    {label:'관문·남부 보급소 확보',done:secured(),value:(cities[1].f===2?'관문 확보':'관문 미확보')+' · '+(cities[2].f===2?'보급소 확보':'보급소 미확보')},
    {label:'〈철관〉 동쪽 출구 도달',done:fort?.tile===progress.exit,value:fort?'내구도 '+Math.ceil(fort.hp)+' · '+Math.ceil(distance(fort.tile,progress.exit))+'칸':'격파'}];
  }
  return[{label:'〈철관〉을 동쪽 출구로 이동',done:progress.result==='won',value:fort?Math.ceil(distance(fort.tile,progress.exit))+'칸':'실패'},
   {label:'〈철관〉 보존',done:!!fort,value:'내구도 '+(fort?Math.ceil(fort.hp):0)},
   {label:'회랑 보급소 확보',done:cities[1]?.f===2,value:cities[1]?.f===2?'확보':'미확보'}];
 }
 function check(){
  if(!active()||!progress)return false;
  if(!busy)tick();
  const fort=units.find(u=>u.id===progress.fortressId&&u.hp>0);
  if(!progress.result){if(turn>CampaignRules.rules(DATA)[0]){progress.result='lost';progress.failure='timeout'}else if(!fort)progress.result='lost';else if(ID==='iron-crown-m03'){if(!cities.some(q=>q.f===2))progress.result='lost';else if(secured()&&progress.holdTurns>=DATA.holdRequired)progress.result='won'}else if(fort.tile===progress.exit&&(ID!=='iron-crown-m02'||cleared()&&secured()))progress.result='won';else if(ID==='iron-crown-m02'&&!cities.some(q=>q.f===2))progress.result='lost';}
  for(const event of DATA.triggers){const city=cities.find(q=>q.id===event.city);if(city?.f===event.owner&&!progress.triggered.includes(event.id)){progress.triggered.push(event.id);worldNotice(event.message)}}
  if(!progress.result||busy||resultTimer||!['game','menu'].includes(appScreen))return false;
  const delayMs=Math.max(0,...moving.map(a=>a.start+a.duration-performance.now()))+50;
  resultTimer=setTimeout(()=>{resultTimer=null;if(!active()||busy)return;save();if(['game','menu'].includes(appScreen))complete(progress.result==='won')},delayMs);return true;
 }
 function complete(win){if(!active())return;progress.result=win?'won':'lost';save();window.TerhaCampaign?.onResult(win,snapshot());}
 function onSaved(s){if(!active())return;window.TerhaCampaign?.onBattleSnapshot(s);check()}
 function objective(){if(!active())return null;if(ID==='iron-crown-m03')return{label:defenseStatus().title,percent:progress?.result==='won'?100:Math.min(95,(secured()?30:0)+(progress?.holdTurns||0)*10+(progress?.holdTurns>=DATA.holdRequired?15:0)),value:defenseStatus().sites+' · '+defenseStatus().next};if(ID==='iron-crown-m02')return{label:'관문·보급소 확보 및 반격 격퇴',percent:progress?.result==='won'?100:Math.min(95,(progress?.waves?.length||0)*12+(secured()?25:0)),value:goalRows()[0].value};const fort=units.find(u=>u.id===progress?.fortressId),d=fort?distance(fort.tile,progress.exit):14;return{label:'〈철관〉을 동쪽 출구로 이동',percent:progress?.result==='won'?100:Math.max(0,Math.min(99,(14-d)/14*100)),value:progress?.result==='won'?'완료':progress?.result==='lost'?'실패':Math.ceil(d)+'칸'}}
 const nativeGround=drawStaticGround;drawStaticGround=function(){if(!active())return nativeGround();const b=bounds();ctx.fillStyle='#091721';ctx.fillRect(cam.x-screenW/2/cam.z-2,cam.y-screenH/2/cam.z-2,screenW/cam.z+4,screenH/cam.z+4);if(image?.complete&&image.naturalWidth)ctx.drawImage(image,b.x,b.y,b.w,b.h);if(ID==='iron-crown-m03')return;const p=pxy(progress?.exit??tile(16,4));ctx.save();hex(p,32);ctx.fillStyle='#e7c56a55';ctx.fill();ctx.strokeStyle='#ebd18b';ctx.lineWidth=2;ctx.stroke();ctx.font='bold 13px Terha,sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffe4a3';ctx.strokeStyle='#10222a';ctx.lineWidth=3;ctx.strokeText('출구',p.x,p.y-35);ctx.fillText('출구',p.x,p.y-35);ctx.restore()};
 const nativeMini=drawMini;drawMini=function(){if(!active())return nativeMini();if($('mini').style.display!=='block')return;const m=$('mini'),g=m.getContext('2d'),b=bounds();m.width=166;m.height=119;g.fillStyle='#091721';g.fillRect(0,0,166,119);if(image?.complete&&image.naturalWidth)g.drawImage(image,0,0,166,119);for(const q of cities){const p=pxy(q.tile);g.fillStyle=factions[q.f].color;g.fillRect((p.x-b.x)/b.w*166,(p.y-b.y)/b.h*119,3,3)}g.strokeStyle='#f3e8bd';g.strokeRect((cam.x-screenW/2/cam.z-b.x)/b.w*166,(cam.y-screenH/2/cam.z-b.y)/b.h*119,screenW/cam.z/b.w*166,screenH/cam.z/b.h*119)};
 const nativeMapButton=$('mapbtn').onclick;$('mapbtn').onclick=()=>{if(!active())return nativeMapButton();$('mini').style.display=$('mini').style.display==='block'?'none':'block';const b=bounds();cam.x=b.x+b.w/2;cam.y=b.y+b.h/2;cam.z=Math.max(screenW/b.w,screenH/b.h);constrainCamera()};
 const nativeMiniClick=$('mini').onclick;$('mini').onclick=e=>{if(!active())return nativeMiniClick(e);const r=$('mini').getBoundingClientRect(),b=bounds();cam.x=b.x+(e.clientX-r.left)/r.width*b.w;cam.y=b.y+(e.clientY-r.top)/r.height*b.h;constrainCamera()};
 window.addEventListener('resize',constrainCamera);
 return{active,contains,tile,bounds,constrainCamera,start,restore,valid,leave,metadata,check,complete,onSaved,objective,goalRows,defenseStatus,ready:()=>!!image?.complete&&image.naturalWidth>0,inspect:()=>({active:active(),progress:copy(progress),bounds:bounds()})};
})();
window.TerhaScenario=CampaignBattle;

