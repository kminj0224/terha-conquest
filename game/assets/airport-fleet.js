'use strict';
// Aircraft are city-owned inventory, never map units. Each surviving airframe
// can fly once between the starts of two turns belonging to its country.
const AIR_FLEET_SCHEMA=1;
const AIRCRAFT={fighter:{name:'전투기',gold:500,food:200,oil:20,min:3},bomber:{name:'폭격기',gold:1200,food:350,oil:40,min:3},strategic:{name:'전략폭격기',gold:3000,food:600,oil:80,min:5}};
const AIRCRAFT_TYPES=Object.keys(AIRCRAFT);
Object.assign(AIR_MISSIONS.fighter,{cost:0,range:12,damage:500,splash:250});
Object.assign(AIR_MISSIONS.bomber,{cost:0,damage:1000,splash:500});
Object.assign(AIR_MISSIONS.strategic,{cost:0,damage:300,splash:150});
Object.assign(FACILITIES.airport,{cost:15000,oil:100,turns:3});
let aircraftRandom=()=>Math.random();
function aircraftName(type){return tr(AIRCRAFT[type]?.name||type,{fighter:'Fighter',bomber:'Bomber',strategic:'Strategic bomber'}[type]||type)}
function emptyAirWing(f){return {owner:f,...Object.fromEntries(AIRCRAFT_TYPES.map(k=>[k,{total:0,used:0}]))}}
function airWing(q){
 if(!q.airWing||q.airWing.owner!==q.f)q.airWing=emptyAirWing(q.f);
 for(const k of AIRCRAFT_TYPES){const slot=q.airWing[k]&&typeof q.airWing[k]==='object'?q.airWing[k]:{};const total=Math.max(0,Math.min(999999,Math.floor(Number(slot.total)||0)));slot.total=total;slot.used=Math.max(0,Math.min(total,Math.floor(Number(slot.used)||0)));q.airWing[k]=slot}
 return q.airWing;
}
function aircraftReady(q,type){const s=airWing(q)[type];return s?s.total-s.used:0}
function useAircraft(q,type){if(!q?.airport||q.nukeUntil>turn||aircraftReady(q,type)<1)return false;airWing(q)[type].used++;return true}
function loseAircraft(q,type){const slot=airWing(q)[type];if(!slot||!slot.total)return;slot.total--;slot.used=Math.max(0,slot.used-1)}
function beginAirportFactionTurn(f){
 for(const q of cities.filter(q=>q.f===f)){
  for(const slot of Object.values(airWing(q)))if(slot&&typeof slot==='object')slot.used=0;
  const j=q.aircraftJob;
  if(j&&(j.owner!==q.f||!AIRCRAFT[j.type]||!q.airport||q.nukeUntil>turn)){delete q.aircraftJob;continue}
  if(j&&turn>j.startedTurn){airWing(q)[j.type].total++;delete q.aircraftJob;log(q.name+' '+aircraftName(j.type)+tr(' 생산 완료',' production complete'))}
 }
}
const airportCanProduce=canProduce;
canProduce=function(q,...args){return airportCanProduce(q,...args)};
function aircraftProductionReason(q,type,ai=false){
 const d=AIRCRAFT[type];if(!d)return tr('병종을 확인하세요.','Unknown aircraft type.');
 if(!q||!ai&&(busy||q.f!==player))return tr('작전 진행 또는 소유 국가를 확인하세요.','Check orders and airport ownership.');
 if(!q.airport)return q.airportJob?tr('공항 건설 중입니다.','Airport is under construction.'):tr('공항이 필요합니다.','An airport is required.');
 if(q.nukeUntil>turn)return tr('피폭 통제 중입니다.','Nuclear exclusion is active.');
 if(q.level<d.min)return tr('도시 레벨이 부족합니다.','City level is too low.');
 if(q.aircraftJob)return tr('생산 중','Production in progress');
 if(q.lastAircraftOrderTurn===turn)return tr('이번 턴 생산 완료','Production ordered this turn');
 if(money[q.f]<d.gold||food[q.f]<d.food||oil[q.f]<d.oil)return tr('생산 자원이 부족합니다.','Insufficient production resources.');
 return '';
}
function produceAircraft(q,type,ai=false){
 const why=aircraftProductionReason(q,type,ai);if(why){if(!ai)toast(why);return false}
 const d=AIRCRAFT[type];money[q.f]-=d.gold;food[q.f]-=d.food;oil[q.f]-=d.oil;
 q.aircraftJob={owner:q.f,type,startedTurn:turn};q.lastAircraftOrderTurn=turn;
 if(!ai){toast(aircraftName(type)+tr(' 생산 명령',' production ordered'));showPanel();updateHUD();save()}return true;
}
function transferAircraft(source,dest,type,count){
 if(busy||!AIRCRAFT[type]||!Number.isSafeInteger(count)||count<1||source===dest||source?.f!==player||dest?.f!==player||!source.airport||!dest.airport||source.nukeUntil>turn||dest.nukeUntil>turn||aircraftReady(source,type)<count)return false;
 airWing(source)[type].total-=count;airWing(dest)[type].total+=count;airWing(dest)[type].used+=count;
 log(source.name+' → '+dest.name+' · '+aircraftName(type)+' '+count+tr('대 이송',' transferred'));
 updateHUD();save();return true;
}
function aircraftTransferDialog(q,type){
 const ready=aircraftReady(q,type),destinations=cities.filter(d=>d!==q&&d.f===q.f&&d.airport&&d.nukeUntil<=turn);
 if(!ready||!destinations.length)return toast(tr('출격 가능한 기체와 다른 아군 공항이 필요합니다.','Ready aircraft and another friendly airport are required.'));
 menuMode=true;$('modal').style.display='flex';
 $('modal').innerHTML='<div class="box"><button class="close" id="airTransferClose">×</button><h2>'+aircraftName(type)+tr(' 이송',' transfer')+'</h2><p>'+q.name+'</p><label for="airTransferTo">'+tr('도착 공항','Destination airport')+'</label><select id="airTransferTo">'+destinations.map(d=>'<option value="'+d.id+'">'+d.name+'</option>').join('')+'</select><label for="airTransferCount">'+tr('수량','Count')+' · '+tr('가능 ','Available ')+ready+'</label><input id="airTransferCount" type="number" min="1" max="'+ready+'" value="1"><button id="airTransferConfirm" class="gold">'+tr('이송','Transfer')+'</button></div>';
 const close=()=>{menuMode=false;$('modal').style.display='none';showPanel()};$('airTransferClose').onclick=close;
 $('airTransferConfirm').onclick=()=>{const dest=cities.find(d=>d.id===Number($('airTransferTo').value));if(transferAircraft(q,dest,type,Number($('airTransferCount').value)))close();else toast(tr('이송 수량과 공항 상태를 확인하세요.','Check the count and airport status.'))};refreshWindowChrome();
}
function aviationResearch(f){
 const r=strategicResearch[f];if(!r.aviation||typeof r.aviation!=='object')r.aviation={stealth:0,performance:0,job:null};
 const a=r.aviation;a.stealth=Math.max(0,Math.min(10,Math.floor(Number(a.stealth)||0)));a.performance=Math.max(0,Math.floor(Number(a.performance)||0));return a;
}
function aviationResearchSpec(f,key){const next=aviationResearch(f)[key]+1;return key==='performance'?{name:tr('전투기 성능 개선','Fighter performance'),gold:40000,oil:450,turns:2,next}:{name:tr('스텔스 연구','Stealth research'),gold:10000*next,oil:100*next,turns:2,next}}
function aviationResearchReason(q,key,ai=false){
 if(!['stealth','performance'].includes(key)||!q||!ai&&(busy||q.f!==player))return tr('소유 도시에서 연구하세요.','Research in an owned city.');
 const r=aviationResearch(q.f),d=aviationResearchSpec(q.f,key);
 if(r.job)return tr('항공 연구가 진행 중입니다.','An aviation research project is already running.');
 if(key==='stealth'&&r.stealth>=10)return tr('스텔스 최고 단계입니다.','Stealth is at maximum level.');
 if(q.nukeUntil>turn)return tr('피폭 통제 중입니다.','Nuclear exclusion is active.');
 if(key==='stealth'&&!q.lab)return tr('과학연구소가 필요합니다.','A science laboratory is required.');
 if(localResearchJob(q))return tr('이 도시에서 다른 연구가 진행 중입니다.','Another research project is using this city.');
 if(money[q.f]<d.gold||oil[q.f]<d.oil)return tr('연구 자원이 부족합니다.','Insufficient research resources.');
 return '';
}
function studyAviation(q,key,ai=false){const why=aviationResearchReason(q,key,ai);if(why){if(!ai)toast(why);return false}const d=aviationResearchSpec(q.f,key);money[q.f]-=d.gold;oil[q.f]-=d.oil;aviationResearch(q.f).job={key,city:q.id,owner:q.f,next:d.next,remaining:d.turns,total:d.turns,lastTick:turn};if(!ai){showPanel();updateHUD();save()}return true}
function samLossChanceAtLevel(level){return Math.max(0,.2-level*.02)}
function samAircraftLossChance(f){return samLossChanceAtLevel(aviationResearch(f).stealth)}
function interceptingAirport(attacker,i){
 const q=cities[tiles[i]?.region];
 return q&&atWar(attacker,q.f)&&q.airport&&q.nukeUntil<=turn&&aircraftReady(q,'fighter')>0?q:null;
}
function resolveAircraftInterception(q,type,i){
 const defender=interceptingAirport(q.f,i);if(!defender)return {defender:null,attackerLost:false};
 useAircraft(defender,'fighter');const a=aviationResearch(q.f).performance,d=aviationResearch(defender.f).performance;
 const attackerWon=a>d||a===d&&aircraftRandom()<.5;
 if(attackerWon)loseAircraft(defender,'fighter');else loseAircraft(q,type);
 log(defender.name+' · '+tr('자동 요격 · ','Automatic interception · ')+(attackerWon?tr('요격 전투기 격추','Interceptor lost'):tr('공격기 격추','Attacker shot down')));
 return {defender,attackerLost:!attackerWon};
}
function missionSAM(q,i){
 const targets=[unitAt(i),cityAt(i),baseAt(i)].filter(v=>v&&atWar(q.f,v.f));
 return [...new Set(targets.flatMap(protectingSAM))].filter(b=>atWar(q.f,b.f));
}
const stockAirEligibility=canAirStrike;
canAirStrike=function(q,type,i){return stockAirEligibility(q,type,i)&&(!(AIRCRAFT[type]||type==='transport')||aircraftReady(q,type==='transport'?'fighter':type)>0)};
const stockAirTarget=beginAirTarget;
beginAirTarget=function(q,type){if((AIRCRAFT[type]||type==='transport')&&aircraftReady(q,type==='transport'?'fighter':type)<1){toast(tr('이 공항에 출격 가능한 기체가 없습니다.','This airport has no ready aircraft.'));return false}return stockAirTarget(q,type)};
function aircraftRaidEffect(q,type,i,crash=false,interceptor=false){
 const a=pxy(q.tile),p=pxy(i),e={kind:'airraid',type,f:q.f,x:a.x,y:a.y,tx:p.x,ty:p.y,start:performance.now(),duration:2800,crash,crashAt:interceptor?.48:.56};
 if(interceptor||crash)fx.push(e);else addAirRaid(e);return e;
}
function aircraftFlightPose(e,t){
 const end=e.meeting||{x:e.tx,y:e.ty-35};
 if(e.airRole==='interceptor'){
  const k=t<.46?t/.46:(1-t)/.54;
  return {x:e.x+(end.x-e.x)*k,y:e.y-35+(end.y-e.y+35)*k-30*Math.sin(k*Math.PI),angle:Math.atan2(end.y-e.y+35,end.x-e.x)+(t>=.46?Math.PI:0)};
 }
 const k=t<.56?t/.56:(1-t)/.44;
 return {x:e.x+(e.tx-e.x)*k,y:e.y+(e.ty-e.y)*k-35-25*Math.sin(k*Math.PI),angle:Math.atan2(e.ty-e.y,e.tx-e.x)+(t>=.56?Math.PI:0)};
}
function animateAirportInterception(attacker,defender,attackerLost){
 const meet=aircraftFlightPose(attacker,.46),home=pxy(defender.tile);
 const interceptor={kind:'airraid',type:'fighter',airRole:'interceptor',f:defender.f,x:home.x,y:home.y,tx:meet.x,ty:meet.y,meeting:meet,start:attacker.start,duration:attacker.duration,crash:!attackerLost,crashAt:.46};
 attacker.crashAt=attackerLost?.46:attacker.crashAt;
 attacker.opponent=interceptor;interceptor.opponent=attacker;
 attacker.airWinner=!attackerLost;interceptor.airWinner=attackerLost;
 fx.push(interceptor);return interceptor;
}
async function airportDrop(q,i,ai=false){
 if((busy&&!ai)||!canAirStrike(q,'transport',i)||!useAircraft(q,'fighter'))return false;
 const wasBusy=busy,m=AIR_MISSIONS.transport;busy=true;airTarget=null;panelOpen=false;
 money[q.f]-=m.cost;food[q.f]-=m.food;oil[q.f]-=m.oil;
 const combat=resolveAircraftInterception(q,'fighter',i);
 if(!combat.attackerLost)loseAircraft(q,'fighter'); // One airframe is spent on every valid drop order.
 const e=aircraftRaidEffect(q,'transport',i,combat.attackerLost);
 e.dropFlight=true;
 if(combat.defender)animateAirportInterception(e,combat.defender,combat.attackerLost);
 if(!ai){refreshSelection();updateHUD();save()}
 await delay(1568);
 let troop=null;
 if(!combat.attackerLost&&airDropTileAvailable(i)){
  const p=pxy(i);fx.push({kind:'airraid',type:'parachute',x:p.x,y:p.y,tx:p.x,ty:p.y,f:q.f,start:performance.now(),duration:1250});
  await delay(1250);troop=makeUnit(q.f,AIRBORNE_TROOPER,i,1);troop.airdropTurn=turn;spendShot(troop);if(cityAt(i))capture(troop);
 }else await delay(1232);
 busy=wasBusy;log(q.name+' '+tr('공수강하','Airborne drop'));
 if(!ai){if(aircraftReady(q,'fighter')>0&&money[q.f]>=m.cost&&food[q.f]>=m.food&&oil[q.f]>=m.oil){selected={kind:'city',id:q.id};airTarget={city:q.id,type:'transport'}}else if(troop)selectUnit(troop);refreshSelection();updateHUD();save();checkEnd()}
 return true;
}
function aircraftGroundDamage(u,base=AIR_MISSIONS.fighter.damage){return Math.round(Math.max(16,base-Math.round(unitArmor(u)*.35))*bombProtection(u,cityAt(u.tile))*specialIncomingFactor(u)*garrisonProtection(u))}
function applyAirportBombing(q,type,i){
 const victim=unitAt(i),city=cityAt(i),facility=baseAt(i),p=pxy(i);let shown=0;
 if(victim&&!victim.carriedBy&&atWar(q.f,victim.f)){const hit=escortProtected(victim)?0:aircraftGroundDamage(victim,AIR_MISSIONS[type].damage);victim.hp-=hit;shown=hit;if(victim.hp<=0)kill(victim)}
 if(city&&atWar(q.f,city.f)&&city.hp>0)shown=damageCity(city,cityAirStrikeDamage(type,city),1);
 if(facility&&atWar(q.f,facility.f)){
  const hit=Math.round(AIR_MISSIONS[type].damage*12*samAirProtection(facility));facility.hp-=hit;shown=hit;if(facility.hp<=0)missileBases=missileBases.filter(v=>v!==facility);
 }
 for(const u of units.filter(v=>!v.carriedBy&&v.tile!==i&&atWar(q.f,v.f)&&distance(i,v.tile)<=1).slice()){
  const hit=escortProtected(u)?0:Math.round(AIR_MISSIONS[type].splash*bombProtection(u,cityAt(u.tile))*specialIncomingFactor(u)*garrisonProtection(u));u.hp-=hit;addAreaImpact({type:3,strategic:true,f:q.f},u,hit,performance.now());if(u.hp<=0)kill(u);
 }
 targetExplosions({type:type==='fighter'?4:3,strategic:true,f:q.f,tile:q.tile},p,shown);
}
const stockTransportMission=airStrike;
airStrike=async function(q,type,i,ai=false){
 if(type==='transport')return airportDrop(q,i,ai);
 if(!AIRCRAFT[type])return stockTransportMission(q,type,i,ai);
 if(!ai&&busy||!canAirStrike(q,type,i)||!useAircraft(q,type))return false;
 const wasBusy=busy;busy=true;oil[q.f]-=AIR_MISSIONS[type].oil;airTarget=null;panelOpen=false;
 const sam=missionSAM(q,i),combat=resolveAircraftInterception(q,type,i),samLost=!combat.attackerLost&&sam.length>0&&aircraftRandom()<samAircraftLossChance(q.f);
 const e=aircraftRaidEffect(q,type,i,combat.attackerLost,false);if(combat.attackerLost)e.crashAt=.46;
 if(samLost){e.crash=true;e.crashAt=.56}
 if(combat.defender)animateAirportInterception(e,combat.defender,combat.attackerLost);
 if(!ai){refreshSelection();updateHUD();save()}audioShot(4);
 await delay(1568);
 if(!combat.attackerLost){applyAirportBombing(q,type,i);if(samLost)loseAircraft(q,type)}
 if(combat.defender||samLost)await delay(1232);
 log(q.name+' · '+AIR_MISSIONS[type].name+' · '+(combat.attackerLost||samLost?tr('격추','Shot down'):tr('귀환','Returned')));
 busy=wasBusy;
 if(!ai){
  if(started&&!menuMode&&q.f===player&&q.airport&&aircraftReady(q,type)>0&&oil[q.f]>=AIR_MISSIONS[type].oil){selected={kind:'city',id:q.id};airTarget={city:q.id,type}}
  refreshSelection();updateHUD();save();checkEnd();
 }
 return true;
};
// Targeting owns map taps. Defense information windows must not swallow a
// tap on a SAM battery while an air or strategic mission is being aimed.
const airportTargetTap=tap;
tap=function(sx,sy){
 if(started&&!busy&&!menuMode&&(airTarget||strategicTarget)){
  const i=worldTileAt((sx-screenW/2)/cam.z+cam.x,(sy-screenH/2)/cam.z+cam.y);if(i<0)return;
  if(airTarget){const q=cities[airTarget.city],type=airTarget.type;if(canAirStrike(q,type,i))return airStrike(q,type,i);toast(tr('작전 범위·목표·출격 가능한 재고를 확인하세요.','Check range, target and ready aircraft.'));return}
  const q=cities[strategicTarget.city],kind=strategicTarget.kind;if(canStrategic(q,kind,i))return launchStrategic(q,kind,i);toast(tr('전략 임무의 목표와 자원을 확인하세요.','Check the strategic target and resources.'));return;
 }
 return airportTargetTap(sx,sy);
};
const stockAircraftDrawing=drawMissionAircraft;
function drawAirportAirframe(e,p){
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
 stockAircraftDrawing({...e,crash:false,x:0,y:e.type==='transport'?42:35,tx:0,ty:e.type==='transport'?42:35},0);ctx.restore();
}
drawMissionAircraft=function(e,t){
 if(e.type==='parachute')return stockAircraftDrawing(e,t);
 const at=e.crashAt??.56;
 if(e.airWinner&&e.opponent&&t>.30&&t<.46){
  const a=aircraftFlightPose(e,t),b=aircraftFlightPose(e.opponent,t),shot=(t*35)%1;
  ctx.save();ctx.globalAlpha=.9;line(a.x+(b.x-a.x)*shot,a.y+(b.y-a.y)*shot,a.x+(b.x-a.x)*Math.min(1,shot+.18),a.y+(b.y-a.y)*Math.min(1,shot+.18),'#ffe6a1',2);ctx.restore();
 }
 if(!e.crash||t<at){
  if(e.airRole==='interceptor'||e.dropFlight)return drawAirportAirframe(e,aircraftFlightPose(e,t));
  return stockAircraftDrawing(e,t);
 }
 const p=aircraftFlightPose(e,at),k=Math.min(1,(t-at)/(1-at)),x=p.x+Math.cos(p.angle)*k*85,y=p.y+k*k*120;
 ctx.save();
 for(let j=0;j<9;j++){const tail=Math.max(0,k-j*.045);ctx.globalAlpha=(1-k*.65)*(1-j/10);circle(p.x+Math.cos(p.angle)*tail*85-j*4,p.y+tail*tail*120-j*3,4+j*1.4,'#273038');if(j<3)circle(x-j*7,y-j*2,5-j,'#ef8a38')}
 ctx.globalAlpha=Math.min(1,(1-k)*5);drawAirportAirframe(e,{x,y,angle:p.angle+k*1.8});ctx.restore();
};
// Nuclear bomber flights share the strategic airframe inventory as well.
strategicBomber=function(q){return q.level===5&&q.airport&&q.nukeUntil<=turn&&aircraftReady(q,'strategic')>0};
const inventoryStrategic=launchStrategic;
launchStrategic=async function(q,kind,i,ai=false){
 if(kind!=='nuclearBomber')return inventoryStrategic(q,kind,i,ai);
 if(!missileCanFire(q,kind,i,ai)||ai&&!usefulConventionalTarget(q.f,i)||!useAircraft(q,'strategic'))return false;
 const combat=resolveAircraftInterception(q,'strategic',i),sam=missionSAM(q,i);
 if(combat.attackerLost){
  money[q.f]-=600;oil[q.f]-=18;const payload=strategicTarget?.city===q.id?strategicTarget.payload:null;
  if(payload){warheadStock(q)[payload]--;syncWarheads(q)}
  const old=busy;busy=true;strategicTarget=null;(()=>{const e=aircraftRaidEffect(q,'strategic',i,true);e.crashAt=.46;if(combat.defender)animateAirportInterception(e,combat.defender,true)})();await delay(2800);busy=old;clearMountedWarheads();refreshSelection();updateHUD();save();return true;
 }
 // The original launcher validates inventory again after this reservation.
 const slot=airWing(q).strategic;slot.used--;
 const before=fx.length,pendingLaunch=inventoryStrategic(q,kind,i,ai);slot.used++;
 const e=fx.slice(before).find(e=>e.kind==='airraid'&&e.f===q.f);
 if(e&&combat.defender)animateAirportInterception(e,combat.defender,false);
 const samLost=sam.length&&aircraftRandom()<samAircraftLossChance(q.f);
 if(e&&samLost){e.crash=true;e.crashAt=.56}
 const result=await pendingLaunch;if(!result){slot.used--;return false}
 if(samLost)loseAircraft(q,'strategic');
 if(combat.defender||samLost){const oldBusy=busy;busy=true;await delay(1232);busy=oldBusy}
 if(!ai)save();return true;
};
// Airport building has its own three-turn construction state.
const fleetFacilityReason=facilityReason;
facilityReason=function(q,key){if(key==='airport'){if(q.airportJob)return tr('공항 건설 중 · ','Airport construction · ')+q.airportJob.remaining+tr('턴 남음',' turns left');if(oil[q.f]<100)return tr('석유 100이 필요합니다.','100 oil is required.')}return fleetFacilityReason(q,key)};
const fleetBuildFacility=buildFacility;
buildFacility=function(q,key){
 if(key!=='airport')return fleetBuildFacility(q,key);
 if(busy||q?.f!==player||q.nukeUntil>turn||facilityReason(q,key))return false;
 money[q.f]-=15000;oil[q.f]-=100;q.airportJob={owner:q.f,remaining:3,total:3,lastTick:turn};
 toast(tr('공항 건설 시작 · 3턴','Airport construction started · 3 turns'));showPanel();updateHUD();save();return true;
};
function migrateAirportPlanes(s){
 const existing=s.units.filter(u=>isAircraft(u));
 for(const q of s.cities){airWing(q);if(q.queue&&isAircraft({type:q.queue.type})){existing.push({f:q.f,type:q.queue.type,tile:q.tile});q.queue=null}}
 for(const u of existing){const type=u.type===4?'fighter':u.type===7?'bomber':'strategic';const home=s.cities.filter(q=>q.f===u.f).sort((a,b)=>Number(b.airport)-Number(a.airport)||distance(a.tile,u.tile)-distance(b.tile,u.tile)||a.id-b.id)[0];if(home)airWing(home)[type].total++}
 s.units=s.units.filter(u=>!isAircraft(u));
}
const fleetMigration=migrateArmy;
migrateArmy=function(s){const r=fleetMigration(s);for(const q of cities)airWing(q);for(let f=0;f<factions.length;f++)aviationResearch(f);return r};
const fleetSetup=setup;
setup=function(...args){const r=fleetSetup(...args);for(const q of cities){q.airWing=emptyAirWing(q.f);delete q.airportJob;delete q.aircraftJob;delete q.lastAircraftOrderTurn}for(let f=0;f<factions.length;f++)strategicResearch[f].aviation={stealth:0,performance:0,job:null};save();return r};
const fleetCapture=capture;
capture=function(u){const q=cityAt(u?.tile),old=q?.f,r=fleetCapture(u);if(q&&q.f!==old){q.airWing=emptyAirWing(q.f);delete q.airportJob;delete q.aircraftJob;delete q.lastAircraftOrderTurn}return r};
const fleetNuclearImpact=nuclearImpact;
nuclearImpact=function(...args){const r=fleetNuclearImpact(...args);for(const q of cities)if(q.nukeUntil>turn&&!q.airport){q.airWing=emptyAirWing(q.f);delete q.airportJob;delete q.aircraftJob;delete q.lastAircraftOrderTurn}return r};
const fleetIndustry=industryTurn;
industryTurn=async function(...args){
 const r=await fleetIndustry(...args);
 for(const q of cities){const j=q.airportJob;if(!j)continue;if(j.owner!==q.f||q.nukeUntil>turn){delete q.airportJob;continue}j.remaining=Math.max(0,j.remaining-Math.max(0,turn-j.lastTick));j.lastTick=turn;if(!j.remaining){q.airport=true;delete q.airportJob;airWing(q);log(q.name+' · '+tr('공항 건설 완료','Airport completed'))}}
 for(let f=0;f<factions.length;f++){const a=aviationResearch(f),j=a.job;if(!j)continue;const q=cities[j.city];if(!q||q.f!==f||q.nukeUntil>turn||j.key==='stealth'&&!q.lab){a.job=null;continue}j.remaining=Math.max(0,j.remaining-Math.max(0,turn-j.lastTick));j.lastTick=turn;if(!j.remaining){a[j.key]=j.next;a.job=null;log(factions[f].name+' · '+aviationResearchSpec(f,j.key).name+' '+a[j.key]+tr('단계 완료',' completed'))}}
 return r;
};
const fleetLocalResearch=localResearchJob;
localResearchJob=function(q){const j=aviationResearch(q.f).job;return j?.city===q.id?{key:j.key,remaining:j.remaining,total:j.total}:fleetLocalResearch(q)};
const fleetStudyReason=studyReason;
studyReason=function(q,key){return aviationResearch(q.f).job?.city===q.id?tr('이 도시에서 항공 연구가 진행 중입니다.','Aviation research is using this city.'):fleetStudyReason(q,key)};
const fleetFuelReason=fuelResearchReason;
fuelResearchReason=function(q){return aviationResearch(q.f).job?.city===q.id?tr('이 도시에서 항공 연구가 진행 중입니다.','Aviation research is using this city.'):fleetFuelReason(q)};
function aviationResearchTitle(f,key,level){
 const name=aviationResearchSpec(f,key).name+(key==='performance'?tr(' 연구',' research'):'');
 return name+tr(' ',' level ')+level+tr('단계','');
}
function aviationResearchEffect(key,from,to){
 if(key==='performance')return tr('항공전 성능 ','Air-combat performance ')+from+' → '+to+tr('단계','');
 const chance=level=>Math.round(samLossChanceAtLevel(level)*100);
 return tr('대공미사일 격추 확률 ','SAM loss probability ')+chance(from)+'%'+(to===from?tr(' · 최고 단계',' · maximum level'):' → '+chance(to)+'%');
}
const fleetSciencePage=sciencePage;
sciencePage=function(q){
 fleetSciencePage(q);const box=$('cityCommandContent'),a=aviationResearch(q.f);
 for(const key of ['performance','stealth']){
  const d=aviationResearchSpec(q.f,key),j=a.job?.key===key?a.job:null,complete=key==='stealth'&&a.stealth>=10;
  const level=j?.next??(complete?10:d.next),title=aviationResearchTitle(q.f,key,level)+(complete?tr(' · 완료',' · complete'):'');
  const effect=aviationResearchEffect(key,a[key],level);
  const meta=complete?tr('최고 단계 10/10','Maximum level 10/10'):tr('골드 ','Gold ')+d.gold.toLocaleString()+tr(' · 석유 ',' · oil ')+d.oil.toLocaleString()+' · '+d.turns+tr('턴',' turns');
  const info=effect;
  const button=addCityRow(box,title,aviationResearchReason(q,key),()=>studyAviation(q,key),aviationResearchTitle(q.f,key,level),info,meta);
  button.id='airResearch-'+key;
 }
};
const fleetOverview=cityOverview;
cityOverview=function(q){
 let html=fleetOverview(q),cards='';
 if(q.aircraftJob)cards+=progressCard(aircraftName(q.aircraftJob.type)+tr(' 생산',' production'),tr('다음 턴 완료','Ready next turn'),1,1);
 if(q.airportJob)cards+=progressCard(tr('공항 건설','Airport construction'),tr('완공 후 사용','Available on completion'),q.airportJob.remaining,3);
 const j=aviationResearch(q.f).job;
 if(j?.city===q.id)cards+=progressCard(aviationResearchTitle(q.f,j.key,j.next),aviationResearchEffect(j.key,j.next-1,j.next),j.remaining,j.total);
 if(cards)html=html.replace(/<p class="(?:hint|quiet)">[^<]*작업[^<]*없[^<]*<\/p>/,'');
 return html.replace('<h3>진행 중인 작업</h3>','<h3>진행 중인 작업</h3>'+cards);
};

airPage=function(q){
 const box=$('cityCommandContent');box.innerHTML='';
 if(!q.airport){const p=document.createElement('p');p.className='cityStock';p.textContent=q.airportJob?tr('공항 건설 중','Airport under construction'):tr('공항 없음','No airport');box.appendChild(p)}
 for(const type of AIRCRAFT_TYPES){
  const d=AIRCRAFT[type],slot=airWing(q)[type],group=document.createElement('section');group.className='airportFleetGroup';group.id='airportFleet-'+type;
  const stock=document.createElement('p');stock.className='cityStock airStock';stock.innerHTML='<span>'+aircraftName(type)+'</span><span class="airStockCounts"><span>'+tr('재고 ','Stock ')+slot.total+'</span><span>'+tr('출격 ','Ready ')+aircraftReady(q,type)+'</span></span>';group.appendChild(stock);box.appendChild(group);
  const make=addCityRow(group,aircraftName(type)+tr(' 생산',' production'),aircraftProductionReason(q,type),()=>produceAircraft(q,type),null,null,tr('골드 ','Gold ')+d.gold.toLocaleString()+tr(' · 식량 ',' · food ')+d.food.toLocaleString()+tr(' · 석유 ',' · oil ')+d.oil+' · 1'+tr('턴',' turns'));make.id='airProduce-'+type;
  const armed=type==='strategic'&&armedBomber?.city===q.id&&NUCLEAR_WARHEADS[armedBomber.payload];
  const why=!q.airport?tr('공항 필요','Airport required'):q.nukeUntil>turn?tr('피폭 통제 중','Nuclear exclusion'):type==='strategic'&&q.level<5?tr('5레벨 도시 필요','Level 5 city required'):aircraftReady(q,type)<1?tr('출격 가능 기체 없음','No ready aircraft'):oil[q.f]<(armed?18:AIR_MISSIONS[type].oil)?tr('석유 부족','Insufficient oil'):armed&&money[q.f]<600?tr('골드 부족','Insufficient gold'):'';
  const sortie=addCityRow(group,tr(AIR_MISSIONS[type].name,{fighter:'Fighter raid',bomber:'Bomber raid',strategic:'Strategic bombing'}[type])+(armed?' ('+armed.name+')':''),why,()=>armed?prepareStrategicLaunch(q,'short',armedBomber.payload,true):beginAirTarget(q,type),aircraftName(type),tr('공격 ','Attack ')+AIR_MISSIONS[type].damage+tr(' / 범위 피해 ',' / splash ')+AIR_MISSIONS[type].splash,(armed?tr('골드 600 · ','Gold 600 · '):'')+tr('석유 ','Oil ')+(armed?18:AIR_MISSIONS[type].oil)+tr(' · 사거리 ',' · Range ')+AIR_MISSIONS[type].range);sortie.id='airSortie-'+type;if(type==='strategic')sortie.parentElement.appendChild(nuclearMountButton(q,null,true));
  const transfer=addCityRow(group,tr('이송','Transfer'),!q.airport||!aircraftReady(q,type)?tr('출격 가능 기체 없음','No ready aircraft'):'',()=>aircraftTransferDialog(q,type));transfer.id='airTransfer-'+type;
 }
 const m=AIR_MISSIONS.transport,why=!q.airport?tr('공항 필요','Airport required'):q.nukeUntil>turn?tr('피폭 통제 중','Nuclear exclusion'):!aircraftReady(q,'fighter')?tr('출격 가능 전투기 없음','No ready fighter'):food[q.f]<m.food||money[q.f]<m.cost||oil[q.f]<m.oil?tr('자원 부족','Insufficient resources'):'';
 const drop=addCityRow(box,tr(m.name,'Airborne drop'),why,()=>beginAirTarget(q,'transport'),tr('공수강하','Airborne drop'),tr('공수부대 1개 배치','Deploy one airborne unit'),tr('골드 ','Gold ')+m.cost.toLocaleString()+tr(' · 식량 ',' · Food ')+m.food.toLocaleString()+tr(' · 석유 ',' · Oil ')+m.oil+tr(' · 사거리 ',' · Range ')+m.range+tr(' · 전투기 1',' · Fighter 1'));drop.id='airSortie-transport';
};
function prepareAirportAI(f,owned){
 if(activeScenario)return;let airports=owned.filter(q=>q.airport&&q.nukeUntil<=turn).sort((a,b)=>a.id-b.id).slice(0,4);
 for(const q of airports)for(const [type,goal]of [['fighter',2],['bomber',1],['strategic',difficulty===2&&q.level===5?1:0]])if(airWing(q)[type].total<goal&&money[f]>AIRCRAFT[type].gold+5000&&oil[f]>AIRCRAFT[type].oil+60)produceAircraft(q,type,true);
 const a=aviationResearch(f);if(!a.job&&money[f]>50000&&oil[f]>550){const q=owned.find(q=>q.nukeUntil<=turn&&!localResearchJob(q));if(q)studyAviation(q,'performance',true)}
}
Object.assign(window.Terha,{AIRCRAFT,AIR_FLEET_SCHEMA,canProduce,airWing,aircraftReady,useAircraft,loseAircraft,beginAirportFactionTurn,produceAircraft,transferAircraft,aircraftTransferDialog,aviationResearch,aviationResearchSpec,aviationResearchReason,studyAviation,samAircraftLossChance,interceptingAirport,resolveAircraftInterception,missionSAM,aircraftGroundDamage,applyAirportBombing,airStrike,canAirStrike,beginAirTarget,tap,drawMissionAircraft,strategicBomber,launchStrategic,facilityReason,buildFacility,migrateAirportPlanes,migrateArmy,setup,capture,nuclearImpact,industryTurn,localResearchJob,studyReason,fuelResearchReason,sciencePage,cityOverview,airPage,prepareAirportAI});
