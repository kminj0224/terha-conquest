'use strict';
const DEFENSES={sea:{name:'지대함 포대',gold:15000,oil:20,hp:34000,range:15,damage:5000},sam:{name:'지대공 포대',gold:12000,oil:15,hp:34000,range:15}};
const defenseArt={sea:loadBaekArt('defense-sea.png'),sam:loadBaekArt('defense-air.png')};
let defenseBuildKind='sea',queueDefenseFire=false,defenseFireQueue=[];
function readyDefense(b){return b&&b.hp>0&&b.remaining<=0}
function protectingSAM(u){if(!u)return[];return missileBases.filter(b=>b.kind==='sam'&&readyDefense(b)&&(b.f===u.f||diplomacy[b.f]?.[u.f]==='ally')&&distance(b.tile,u.tile)<=15)}
function samAirProtection(target){return protectingSAM(target).length?.5:1}
const defenseBomb=bombProtection;bombProtection=function(u,q){return defenseBomb(u,q)*samAirProtection(u||q)};
const defenseSiege=siegeDamage;siegeDamage=function(u,q){return Math.round(defenseSiege(u,q)*((u.type===25||isAircraft(u)||isHelicopter(u))?samAirProtection(q):1))};
const fleetDamage=damage;damage=function(u,v){if(u.type===25&&escortProtected(v))return 0;let d=fleetDamage(u,v);if(isNaval(u)&&isNaval(v))d=Math.round(Math.max(d,unitAttack(u)*.65)*(v.type===26?3:u.type===25?4:7));if(u.type===25&&protectingSAM(v).length)d=Math.round(d*.5);return d};
const defenseMove=moveUnit;moveUnit=function(u,i,ai=false){const result=defenseMove(u,i,ai);if(result&&(isTowedArtillery(u)||u.type===15)){const m=movingAnimation(u.id);if(m)m.duration=ai?650:950}return result};
function addAirRaid(e){if(e.kind!=='airraid')return fx.push(e);if(typeof skipAIAnimations==='function'&&skipAIAnimations())return;fx.push(e);const i=worldTileAt(e.tx,e.ty);if(i<0)return;const targets=[unitAt(i),cityAt(i),baseAt(i)].filter(v=>v&&atWar(e.f,v.f));if(!targets.length)return;const bases=[...new Set(targets.flatMap(protectingSAM))].sort((a,b)=>distance(a.tile,i)-distance(b.tile,i)).slice(0,2);const impactT=.53,launchT=.46,phase=impactT/.56;const impact={x:e.x+(e.tx-e.x)*phase,y:e.y+(e.ty-e.y)*phase-35-25*Math.sin(phase*Math.PI)};for(const b of bases){faceDefenseTarget(b,impact);const p=pxy(b.tile);fx.push({kind:'samIntercept',x:p.x,y:p.y-20,tx:impact.x,ty:impact.y,start:e.start+Math.round(e.duration*launchT),duration:Math.max(120,Math.round(e.duration*(impactT-launchT)))});fx.push({kind:'defenseHit',x:impact.x,y:impact.y,start:e.start+Math.round(e.duration*impactT),duration:440})}}
function defenseMissilePosition(e,t){const dx=e.tx-e.x,dy=e.ty-e.y,l=Math.hypot(dx,dy)||1,wave=Math.sin(t*Math.PI)*Math.sin(t*Math.PI*5)*20;return{x:e.x+dx*t-dy/l*wave,y:e.y+dy*t+dx/l*wave}}
function drawDefenseEffect(e,t){ctx.save();if(e.kind==='defenseMissile'||e.kind==='samIntercept'){const p=e.kind==='samIntercept'?{x:e.x+(e.tx-e.x)*t,y:e.y+(e.ty-e.y)*t}:defenseMissilePosition(e,t),q=e.kind==='samIntercept'?{x:e.x,y:e.y}:defenseMissilePosition(e,Math.max(0,t-.02));ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.y-q.y,p.x-q.x));line(-17,0,-35,0,'#f6b76b99',3);rect(-15,-2,26,4,'#d8dcd3');poly([[11,-3],[20,0],[11,3]],'#f2eee2');poly([[-16,-3],[-26,0],[-16,3]],'#ffae45')}else{ctx.translate(e.x,e.y);ctx.globalAlpha=1-t;for(let j=0;j<8;j++){const a=j*2.4;circle(Math.sin(a)*(4+t*15),Math.cos(a)*(4+t*12)-t*20,3+5*(1-t),j%2?'#ffb846':'#ed5928')}circle(0,-4,9*(1-t),'#fff1b3')}ctx.restore()}
eligibleBaseTile=function(i,f=player,kind=defenseBuildKind){return i>=0&&tiles[i].owner===f&&!cityAt(i)&&!unitAt(i)&&!baseAt(i)&&(kind==='sam'||ownShores(f).some(j=>distance(i,j)<=4))};
buildMissileBase=function(i,f=player,ai=false,kind=ai?'sea':defenseBuildKind){const d=DEFENSES[kind];if(!d||!eligibleBaseTile(i,f,kind)||money[f]<d.gold||oil[f]<d.oil)return false;money[f]-=d.gold;oil[f]-=d.oil;missileBases.push({id:navalUid++,tile:i,f,kind,hp:d.hp,remaining:2,lastTick:turn,lastShot:-1,facing:1});coastBuildMode=false;if(!ai){toast(d.name+' 건설 시작 · 2턴');save();updateHUD()}return true};
baseTargets=function(b){return !b||b.kind==='sam'||!readyDefense(b)||b.lastShot===turn||oil[b.f]<8?[]:units.filter(u=>!u.carriedBy&&u.hp>0&&isNaval(u)&&atWar(b.f,u.f)&&distance(b.tile,u.tile)<=15)};
fireCoastalMissile=async function(b,u,ai=false){if(queueDefenseFire){defenseFireQueue.push([b,u,ai]);return true}if(!baseTargets(b).includes(u))return false;oil[b.f]-=8;b.lastShot=turn;const a=pxy(b.tile),p=pxy(u.tile),dx=p.x-a.x;if(Math.abs(dx)>.001)b.facing=dx>0?1:-1;const fast=typeof skipAIAnimations==='function'&&skipAIAnimations();if(!ai)busy=true;if(!fast){fx.push({kind:'defenseFlame',x:a.x+(b.facing||1)*9,y:a.y-55,start:performance.now(),duration:500});fx.push({kind:'defenseMissile',x:a.x+(b.facing||1)*9,y:a.y-55,tx:p.x,ty:p.y,start:performance.now(),duration:2100})}await delay(fast?0:2100);u.hp-=DEFENSES.sea.damage;if(!fast)fx.push({kind:'defenseHit',x:p.x,y:p.y-8,start:performance.now(),duration:900});if(u.hp<=0&&units.includes(u))kill(u);if(!ai){busy=false;navalMode=null;refreshSelection();save();updateHUD()}return true};
function chooseDefense(kind){defenseBuildKind=kind;menuMode=false;$('modal').style.display='none';coastBuildMode=true;navalMode=null;selected=null;panelOpen=false;coastEligible=new Set(tiles.map((_,i)=>eligibleBaseTile(i,player,kind)?i:-1).filter(i=>i>=0));refreshSelection();toast(DEFENSES[kind].name+' 위치 선택 · 골드 '+DEFENSES[kind].gold+' / 석유 '+DEFENSES[kind].oil)}
function defenseMenu(){if(busy||!started)return;menuMode=true;$('modal').style.display='flex';$('modal').innerHTML='<div class="box"><button class="close" id="defClose">×</button><h2>방어시설 건설</h2>'+Object.entries(DEFENSES).map(([k,d])=>'<button id="def'+k+'">'+d.name+' · 골드 '+d.gold+' / 석유 '+d.oil+'</button><p>내구도 34000 · 건설 2턴 · '+(k==='sea'?'사거리 15 · 함정 피해 5000 · 발사 석유 8 · 해안에서 4칸 이내':'반경 15 · 아군·동맹 유닛의 항공 피해 50% 감소 · 미사일 제외')+'</p>').join('')+'</div>';$('defClose').onclick=()=>{menuMode=false;$('modal').style.display='none'};for(const k of Object.keys(DEFENSES))$('def'+k).onclick=()=>chooseDefense(k)}
$('coastBuild').innerHTML='방어시설 <svg width="23" height="23" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18M4 17h16v3H4zM6 15l8-11 3 2-8 11M11 16l8-11 3 2-8 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';$('coastBuild').onclick=defenseMenu;
showBase=function(b){const d=DEFENSES[b.kind||'sea'];menuMode=true;$('modal').style.display='flex';$('modal').innerHTML='<div class="box"><button class="close" id="baseClose">×</button><h2>'+d.name+'</h2><p>'+factions[b.f].name+' · 내구도 '+Math.ceil(b.hp)+' / '+d.hp+'<br>건설 비용: 골드 '+d.gold+' / 석유 '+d.oil+'<br>'+(b.remaining?'건설 '+b.remaining+'턴 남음':b.kind==='sam'?'반경 15 · 아군·동맹 항공 피해 50% 감소 · 미사일 제외':'사거리 15 · 함정 피해 5000 · 턴당 1회 · 발사 석유 8')+'</p>'+(b.kind==='sam'?'':'<button id="baseFire">지대함 미사일 발사 · 석유 8</button>')+'</div>';$('baseClose').onclick=()=>{menuMode=false;$('modal').style.display='none'};if(b.kind!=='sam')$('baseFire').onclick=()=>{if(b.f!==player||!readyDefense(b)||b.lastShot===turn||oil[player]<8)return toast('소유 국가·건설 완료·남은 발사권·석유를 확인하세요.');menuMode=false;$('modal').style.display='none';navalMode={kind:'coastal',base:b.id};panelOpen=false;refreshSelection();toast('15칸 이내의 적 함정을 선택하세요.')}};
function canAttackDefense(u,b){return mayFire(u)&&b?.hp>0&&atWar(u.f,b.f)&&distance(u.tile,b.tile)<=(isNaval(u)&&u.type!==25?Math.min(3,TYPES[u.type].range):TYPES[u.type].range)}
// Fortifications use the city siege multipliers, including artillery ×16.
function defenseAttackDamage(u,b){return siegeDamage(u,b)}
async function attackDefense(u,b,ai=false){if(!canAttackDefense(u,b)||!ai&&busy)return false;if(!ai)busy=true;await finishMovingBeforeFire(u,ai);spendShot(u);const p=pxy(b.tile);beginAim(u,p,100);await delay(100);launchShot(u,p);await delay(u.type===12?TYPES[12].attackWindup:u.type===25?1344:isTowedArtillery(u)||isBaekArtillery(u)?1200:600);const d=defenseAttackDamage(u,b);b.hp-=d;targetExplosions(u,p,d);if(b.hp<=0){missileBases=missileBases.filter(v=>v!==b);log(DEFENSES[b.kind].name+' 파괴')}if(!ai){busy=false;refreshSelection();updateHUD();save()}return true}
const defenseTap=tap;tap=function(sx,sy){if(busy||menuMode)return;const i=pickedNavalTile(sx,sy);if(i<0)return;const b=baseAt(i),u=selected?.kind==='unit'?units.find(v=>v.id===selected.id):null;if(coastBuildMode){if(!eligibleBaseTile(i))return toast('빈 아군 육지를 선택하세요. 지대함 포대는 해안 4칸 이내에 건설합니다.');const d=DEFENSES[defenseBuildKind];if(money[player]<d.gold||oil[player]<d.oil)return toast('건설에 필요한 골드 또는 석유가 부족합니다.');return navalConfirm(d.name+'를 건설하시겠습니까? 골드 '+d.gold+' / 석유 '+d.oil,()=>buildMissileBase(i))}if(!navalMode&&b&&!unitAt(i)){if(u&&canAttackDefense(u,b))return attackDefense(u,b);return showBase(b)}return defenseTap(sx,sy)};
const defenseCancel=cancelAirTarget;cancelAirTarget=function(){if(coastBuildMode||navalMode?.kind==='coastal'){const build=coastBuildMode;coastBuildMode=false;coastEligible.clear();navalMode=null;refreshSelection();return toast(build?DEFENSES[defenseBuildKind].name+' 건설을 취소했습니다.':'지대함 포대의 표적 선택을 취소했습니다.')}return defenseCancel()};$('selectionAirCancel').onclick=()=>cancelAirTarget();
// Bodies join the shared map depth pass; interaction highlights stay above it.
function faceDefenseTarget(b,target){const p=pxy(b.tile),dx=target.x-p.x;if(Math.abs(dx)>.001)b.facing=dx>0?1:-1}
function defenseSprite(b,p){
 if(b.hp<=0)return;
 ctx.save();ctx.translate(p.x,p.y-3);
 const a=defenseArt[b.kind||'sea'],sea=b.kind!=='sam',w=sea?48:90*.65;
 const h=w*a.idle.naturalHeight/a.idle.naturalWidth;
 ctx.save();ctx.scale(b.facing||1,1);
 if(a.idleReady)ctx.drawImage(a.idle,-w/2,19-h,w,h);
 ctx.restore();
 
 rect(-25,20,50,5,'#13231c');rect(-24,21,48*Math.max(0,Math.min(1,b.hp/DEFENSES[b.kind||'sea'].hp)),3,'#dfc65b');
 ctx.font='9px Terha';ctx.textAlign='center';ctx.fillStyle='#f2e8ce';
 ctx.fillText(b.remaining?'건설 '+b.remaining+'턴':DEFENSES[b.kind||'sea'].name,0,36);ctx.restore();
}
const defenseOverlay=drawNavalOverlays;drawNavalOverlays=function(now){
 const bases=missileBases;missileBases=[];
 try{defenseOverlay(now)}finally{missileBases=bases}
 if(navalMode?.kind==='coastal'){const b=bases.find(v=>v.id===navalMode.base);for(const u of baseTargets(b)){hex(pxy(u.tile),33);ctx.fillStyle='#ffda6844';ctx.fill()}}
};
const defenseCost=moveCost;moveCost=function(u,i){const b=baseAt(i);return b?.hp>0&&atWar(u.f,b.f)&&!isAircraft(u)&&!isHelicopter(u)?99999:defenseCost(u,i)};
const defenseLanding=landingTiles;landingTiles=function(ship,u){return defenseLanding(ship,u).filter(i=>!baseAt(i))};
const defenseAI=aiStep;aiStep=function(u,targets){if(!u.carriedBy){const b=missileBases.find(b=>canAttackDefense(u,b));if(b)return{base:b}}return defenseAI(u,targets)};
const defenseAirTarget=canAirStrike;canAirStrike=function(q,type,i){const b=baseAt(i),m=AIR_MISSIONS[type];return defenseAirTarget(q,type,i)||!!(b&&m&&atWar(q.f,b.f)&&q.nukeUntil<=turn&&(type!=='strategic'||q.level===5)&&q.airport&&distance(q.tile,i)<=m.range&&money[q.f]>=m.cost&&oil[q.f]>=m.oil)};
const defenseAirStrike=airStrike;
airStrike=async function(q,type,i,ai=false){
 const b=baseAt(i);
 if(!b||!atWar(q.f,b.f))return defenseAirStrike(q,type,i,ai);
 if(!canAirStrike(q,type,i))return false;
 const m=AIR_MISSIONS[type],a=pxy(q.tile),p=pxy(i);
 money[q.f]-=m.cost;oil[q.f]-=m.oil;q.airTurn=turn;
 if(!ai)busy=true;
 airTarget=null;
 addAirRaid({kind:'airraid',x:a.x,y:a.y,tx:p.x,ty:p.y,f:q.f,type,start:performance.now(),duration:2800});
 await delay(1568);
 const victim=unitAt(i);
 if(victim&&atWar(q.f,victim.f)){
  const unitDamage=Math.max(1,Math.round(Math.max(16,m.damage-unitArmor(victim)*.35)
   *bombProtection(victim,cityAt(i))*specialIncomingFactor(victim)*(cityAt(i)?.f===victim.f?.7:1)));
  victim.hp-=unitDamage;
  fx.push({kind:'blast',x:p.x+42,y:p.y+30,start:performance.now(),duration:740,damage:unitDamage});
  if(victim.hp<=0)kill(victim);
 }
 // A ready SAM battery (or neighboring allied SAM) halves the actual hit.
 // The popup must always use the same number subtracted from structure HP.
 const realDamage=Math.round(m.damage*12*samAirProtection(b));
 b.hp-=realDamage;
 targetExplosions({type:3,strategic:true},p,realDamage);
 if(b.hp<=0)missileBases=missileBases.filter(v=>v!==b);
 if(!ai){busy=false;refreshSelection();updateHUD();save()}
 return true;
};
function researchJobs(r){if(!Array.isArray(r.jobs))r.jobs=[];if(r.job){r.jobs.push(r.job);r.job=null}return r.jobs}
studyReason=function(q,key){const r=strategicResearch[q.f],jobs=researchJobs(r);if(!q.lab)return'먼저 과학연구소를 설치하세요.';if(q.level<4)return'도시를 4레벨로 확장하세요.';if(r[key])return'이미 완료한 연구입니다.';if(jobs.some(j=>j.city===q.id))return'이 도시에서는 이미 다른 연구가 진행 중입니다.';if(jobs.some(j=>j.key===key))return'다른 도시에서 같은 연구가 진행 중입니다.';if(oil[q.f]<(RESEARCH_DEFS[key].oil||0))return'연구에 필요한 석유가 부족합니다.';if(money[q.f]<RESEARCH_DEFS[key].cost)return'연구에 필요한 골드가 부족합니다.';return''};
study=function(q,key,ai=false){const d=RESEARCH_DEFS[key];if(!d||(!ai&&(busy||q.f!==player))||q.nukeUntil>turn||studyReason(q,key))return false;money[q.f]-=d.cost;oil[q.f]-=d.oil||0;researchJobs(strategicResearch[q.f]).push({key,city:q.id,remaining:d.turns,total:d.turns,startedTurn:turn,lastTick:turn});if(key==='nuclear')worldNotice(factions[q.f].name+' · '+q.name+'에서 핵물질 연구 시작');else if(!ai)toast(q.name+' · '+d.name+' 연구 시작');if(!ai){showPanel();updateHUD();save()}return true};
const jobsOverview=cityOverview;cityOverview=function(q){let html=jobsOverview(q),cards='';for(const j of researchJobs(strategicResearch[q.f]))cards+=progressCard(RESEARCH_DEFS[j.key].name+' 연구',(j.city===q.id?'이 도시':cities[j.city]?.name||'다른 도시')+' 연구소에서 진행 · 국가 공동 연구',j.remaining,j.total);if(cards)html=html.replace(/<p class="(?:hint|quiet)">[^<]*작업[^<]*없[^<]*<\/p>/,'');return html.replace('<h3>진행 중인 작업</h3>','<h3>진행 중인 작업</h3>'+cards)};
const jobsIndustry=industryTurn;industryTurn=async function(){defenseFireQueue=[];queueDefenseFire=true;jobsIndustry();queueDefenseFire=false;for(let f=0;f<7;f++){const r=strategicResearch[f];r.jobs=researchJobs(r).filter(j=>{const q=cities[j.city];if(!q||q.f!==f||!q.lab||q.level<4||q.nukeUntil>turn){worldNotice(factions[f].name+' · '+RESEARCH_DEFS[j.key].name+' 연구 중단');return false}j.remaining-=Math.max(0,turn-j.lastTick);j.lastTick=turn;if(j.remaining>0)return true;r[j.key]=true;worldNotice(factions[f].name+' · '+RESEARCH_DEFS[j.key].name+' 연구 완료');return false})}await Promise.all(defenseFireQueue.map(args=>fireCoastalMissile(...args)));updateHUD()};
const jobsPanel=showPanel;showPanel=function(){jobsPanel();if(selected?.kind!=='city'||!panelOpen||busy)return;const q=cities[selected.id];if(q.f!==player)return;const box=$('strategicResearch');box.innerHTML='';for(const [key,d]of Object.entries(RESEARCH_DEFS)){const j=researchJobs(strategicResearch[q.f]).find(j=>j.key===key);conditionButton(box,d.name+(j?' · '+cities[j.city]?.name+' · '+j.remaining+'턴 남음':' 연구 · 골드 '+d.cost+' · '+d.turns+'턴'),studyReason(q,key),()=>study(q,key))}};
const defenseSetup=setup;setup=function(){defenseSetup();for(let f=0;f<7;f++)for(const kind of ['sea','sam']){const shores=ownShores(f).filter(i=>!cityAt(i)&&!unitAt(i)&&!baseAt(i));let placed=0;while(shores.length&&placed<4){const i=shores.sort((a,b)=>{const score=i=>missileBases.filter(b=>b.f===f).length?Math.min(...missileBases.filter(b=>b.f===f).map(b=>distance(i,b.tile))):Math.abs(i%W-W*.5);return score(b)-score(a)})[0];missileBases.push({id:navalUid++,tile:i,f,kind,hp:DEFENSES[kind].hp,remaining:0,lastTick:turn,lastShot:-1,facing:1});placed++;for(let n=shores.length-1;n>=0;n--)if(distance(i,shores[n])<5)shores.splice(n,1)}}save();return true};
const defenseMigration=migrateArmy;migrateArmy=function(s){defenseMigration(s);for(const r of strategicResearch)researchJobs(r);for(const b of missileBases){b.kind=b.kind==='sam'?'sam':'sea';b.facing=b.facing||1;const oldHp=Math.max(0,b.hp??8000);b.hp=s.defenseSchema>=2?Math.min(DEFENSES[b.kind].hp,oldHp):Math.min(DEFENSES[b.kind].hp,oldHp*DEFENSES[b.kind].hp/8000)}missileBases=missileBases.filter(b=>b.hp>0)};
Object.assign(window.Terha,{setup,migrateArmy,industryTurn,canAirStrike,airStrike,study,showPanel,buildMissileBase,eligibleBaseTile,baseTargets,fireCoastalMissile,attackDefense,defenseAttackDamage,siegeDamage,protectingSAM,samAirProtection});

const defenseStrategicTarget=canStrategic;canStrategic=function(q,kind,i){if(defenseStrategicTarget(q,kind,i))return true;const b=baseAt(i),r=strategicResearch[q.f],bomber=kind==='nuclearBomber';if(!b||!atWar(q.f,b.f)||q.f!==player||q.nukeUntil>turn||money[q.f]<(bomber?600:900)||oil[q.f]<(bomber?18:10)||kind!=='missile'&&(!r.nuclear||!q.nukes))return false;return bomber?q.level===5&&q.airport&&q.airTurn!==turn&&distance(q.tile,i)<=30:q.level>=4&&q.launcher&&r.ballistic&&q.lastMissileTurn!==turn};
const concurrentAI=aiProcure;aiProcure=function(f,owned){concurrentAI(f,owned);if(difficulty===0||turn<8)return;const r=strategicResearch[f],jobs=researchJobs(r);for(const key of ['ballistic','nuclear','fuelEfficiency','supplyRoutes']){if(r[key]||jobs.some(j=>j.key===key))continue;const q=owned.find(q=>q.f===f&&q.level>=4&&q.nukeUntil<=turn&&!jobs.some(j=>j.city===q.id));if(!q)continue;if(!q.lab&&money[f]>9500+RESEARCH_DEFS[key].cost+9000){money[f]-=9500;q.lab=true}if(q.lab&&money[f]>RESEARCH_DEFS[key].cost+9000)study(q,key,true)}};

const protectedNuclear=nuclearImpact;nuclearImpact=function(i,air=false){if(air){const hit=new Set(nuclearTiles(i));for(const u of units)if(!u.carriedBy&&!escortProtected(u)&&hit.has(u.tile)&&protectingSAM(u).length)u.hp+=(unitMaxHp(u)*.9+1200)*.5*specialIncomingFactor(u)}return protectedNuclear(i)};

// Small coastlines use the near-coast strip when four widely spaced sites do not fit.
const completeDefenseSetup=setup;setup=function(){completeDefenseSetup();for(let f=0;f<7;f++)for(const kind of ['sea','sam']){let n=missileBases.filter(b=>b.f===f&&b.kind===kind).length;while(n<4){const candidates=tiles.map((_,i)=>eligibleBaseTile(i,f,'sea')?i:-1).filter(i=>i>=0);if(!candidates.length)break;const i=candidates.sort((a,b)=>{const score=i=>Math.min(...missileBases.filter(b=>b.f===f).map(b=>distance(i,b.tile)));return score(b)-score(a)})[0];missileBases.push({id:navalUid++,tile:i,f,kind,hp:DEFENSES[kind].hp,remaining:0,lastTick:turn,lastShot:-1,facing:1});n++}}save();return true};Object.assign(window.Terha,{setup,nuclearImpact});

const defenseReach=reachable;reachable=function(u){const r=defenseReach(u);if(!isAircraft(u)&&!isHelicopter(u))for(const b of missileBases)if(b.hp>0&&b.tile!==u.tile){r.costs.delete(b.tile);r.paths.delete(b.tile)}return r};Object.assign(window.Terha,{reachable});


