'use strict';
// Local patrols use existing unit orders and saves. Preview and execution share
// one deterministic calculation; no combat globals are held across awaits.
const AIR_PATROL_RANGE=4,AIR_PATROL_SORTIES=2,AIR_PATROL_OIL=8;
let airspaceVisible=false,airPreviewPending=false;
function patrolActive(u){return !!(u&&u.type===4&&u.hp>0&&!u.carriedBy&&u.airPatrol&&u.airPatrolLeft>0)}
function canStartPatrol(u){return !!(u&&u.type===4&&units.includes(u)&&!u.carriedBy&&mayFire(u)&&!u.airPatrol&&oil[u.f]>=AIR_PATROL_OIL)}
function startAirPatrol(u,ai=false){
 if((!ai&&(busy||u?.f!==player))||!canStartPatrol(u))return false;
 oil[u.f]-=AIR_PATROL_OIL;spendShot(u);
 u.airPatrol=true;u.airPatrolLeft=AIR_PATROL_SORTIES;
 log(factions[u.f].name+' · '+tr('전투기 초계 개시','Fighter patrol started'));
 if(!ai){refreshSelection();showPanel();updateHUD();save()}
 return true;
}
function patrolPower(u,i){
 const d=distance(u.tile,i);if(!patrolActive(u)||d>AIR_PATROL_RANGE)return 0;
 return 100*(1+((u.level||1)-1)*.15)*Math.max(0,Math.min(1,u.hp/unitMaxHp(u)))*(d<=2?1:d===3?.75:.5);
}
function airspaceState(own,enemy){
 if(!own&&!enemy)return tr('미통제','Uncontrolled');
 if(own>0&&own>=enemy*3)return tr('아군 압도적 우세','Overwhelming friendly superiority');
 if(enemy>0&&enemy>=own*3)return tr('적 압도적 우세','Overwhelming enemy superiority');
 if(own>=enemy*1.5)return tr('아군 항공 우세','Friendly air advantage');
 if(enemy>=own*1.5)return tr('적 항공 우세','Enemy air advantage');
 return tr('제공권 경합','Contested');
}
function airMissionPlan(q,type,i){
 const target=[cityAt(i),baseAt(i),unitAt(i)].find(v=>v&&atWar(q.f,v.f));
 const rank=(a,b)=>patrolPower(b,i)-patrolPower(a,i)||a.id-b.id;
 const defenders=target?units.filter(u=>u.f===target.f&&atWar(q.f,u.f)&&patrolPower(u,i)>0).sort(rank).slice(0,2):[];
 const escorts=defenders.length?units.filter(u=>u.f===q.f&&patrolPower(u,i)>0).sort(rank).slice(0,2):[];
 const friendly=units.filter(u=>u.f===q.f).reduce((n,u)=>n+patrolPower(u,i),0);
 const hostile=target?units.filter(u=>u.f===target.f).reduce((n,u)=>n+patrolPower(u,i),0):0;
 const defense=defenders.reduce((n,u)=>n+patrolPower(u,i),0),escort=escorts.reduce((n,u)=>n+patrolPower(u,i),0);
 const factor=type==='transport'||!defense?1:1-Math.min(.8,defense/(defense+escort+100)*.9);
 return {defenders,escorts,factor,state:airspaceState(friendly,hostile),sam:!!(target&&protectingSAM(target).length),aa:!!target?.aa,
  losses: [...defenders.map(u=>({u,damage:Math.max(1,Math.round(unitMaxHp(u)*(.04+escort/(defense+100)*.12)))})),
   ...escorts.map(u=>({u,damage:Math.max(1,Math.round(unitMaxHp(u)*(.04+defense/(escort+100)*.12)))}))]};
}
function resolveAirMission(q,type,i){
 const plan=airMissionPlan(q,type,i);
 if(type==='transport')return 1;
 for(const {u,damage:hit}of plan.losses){
  u.airPatrolLeft=Math.max(0,u.airPatrolLeft-1);u.hp-=hit;
  targetExplosions(u,pxy(u.tile),hit);
  if(u.hp<=0)kill(u);
 }
 if(plan.defenders.length){
  const p=pxy(i),now=performance.now();
  for(const u of [...plan.defenders,...plan.escorts]){
   const a=pxy(u.tile);fx.push({kind:'airraid',type:'fighter',f:u.f,x:a.x,y:a.y,tx:p.x,ty:p.y,start:now,duration:1000});
  }
  log(q.name+' · '+tr('항공 요격 · 임무 돌파율 ','Air interception · mission effectiveness ')+Math.round(plan.factor*100)+'%');
 }
 return plan.factor;
}
const airPatrolOrders=freshOrders;
freshOrders=function(u){delete u.airPatrol;delete u.airPatrolLeft;return airPatrolOrders(u)};
const airPatrolCounter=canCounterattack;
canCounterattack=function(u,v){return !u?.airPatrol&&airPatrolCounter(u,v)};
const airPatrolMigration=migrateArmy;
migrateArmy=function(s){
 const result=airPatrolMigration(s);
 for(const u of units){
  if(u.type!==4||u.airPatrol!==true){delete u.airPatrol;delete u.airPatrolLeft;continue}
  u.airPatrolLeft=Math.max(0,Math.min(AIR_PATROL_SORTIES,Math.floor(Number(u.airPatrolLeft)||0)));
  u.moveAllowed=false;u.attackReady=false;syncOrders(u);
 }
 return result;
};
const airPatrolSetup=setup;
setup=function(...args){airspaceVisible=false;airPreviewPending=false;return airPatrolSetup(...args)};
const airPatrolPanel=showPanel;
showPanel=function(){
 airPatrolPanel();if(!panelOpen||selected?.kind!=='unit')return;
 const u=units.find(v=>v.id===selected.id);if(u?.type!==4)return;
 const p=document.createElement('p');p.id='airPatrolStatus';
 p.textContent=tr('초계 반경 4타일 · 요격·호위 합계 ','Patrol radius 4 tiles · interceptions/escorts remaining ')+(u.airPatrol?u.airPatrolLeft:0)+'/2'+tr('회 · 다음 자국 턴 시작 시 종료',' · ends at the start of its next faction turn');
 $('panel').appendChild(p);
 if(u.f===player){const b=document.createElement('button');b.id='startAirPatrol';b.textContent=tr('초계 개시 · 석유 8','Start patrol · oil 8');b.disabled=busy||!canStartPatrol(u);b.onclick=()=>startAirPatrol(u);$('panel').appendChild(b)}
};
const airPatrolAI=aiStep;
aiStep=function(u,targets){
 if(u.type!==4||u.f===player)return airPatrolAI(u,targets);
 if(canStartPatrol(u)){
  const danger=units.some(v=>atWar(u.f,v.f)&&distance(u.tile,v.tile)<=10)||cities.some(q=>atWar(u.f,q.f)&&q.airport&&distance(u.tile,q.tile)<=12);
  const nearby=units.filter(v=>v!==u&&v.f===u.f&&!isAircraft(v)&&distance(u.tile,v.tile)<=4).length;
  if(danger&&(nearby||cities.some(q=>q.f===u.f&&distance(q.tile,u.tile)<=4))){startAirPatrol(u,true);return null}
 }
 return airPatrolAI(u,targets);
};
const airPatrolProcure=aiProcure;
aiProcure=function(f,owned){
 if(!activeScenario&&cities.some(q=>atWar(f,q.f))){
  const count=units.filter(u=>u.f===f&&u.type===4).length+cities.filter(q=>q.f===f&&q.queue?.type===4).length;
  if(count<Math.min(4,1+Math.floor(owned.length/12))){
   const base=owned.filter(q=>q.airport&&!q.queue&&!q.produced).sort((a,b)=>a.id-b.id).find(q=>canProduce(q,4,1)&&aiUnitAffordable(f,4,1));
   if(base)aiQueueUnit(f,base,4,1);
  }
 }
 return airPatrolProcure(f,owned);
};
// AI rejects heavily intercepted conventional sorties, using the same preview.
const airPatrolEligible=canAirStrike;
canAirStrike=function(q,type,i){return airPatrolEligible(q,type,i)&&(q.f===player||type==='transport'||airMissionPlan(q,type,i).factor>=.55)};
const airPatrolTap=tap;
tap=function(sx,sy){
 if(airPreviewPending||appConfirm)return;
 if(airTarget&&!busy&&!menuMode&&started){
  const i=worldTileAt((sx-screenW/2)/cam.z+cam.x,(sy-screenH/2)/cam.z+cam.y),q=cities[airTarget.city],type=airTarget.type;
  if(i>=0&&type!=='transport'&&canAirStrike(q,type,i)){
   const plan=airMissionPlan(q,type,i);
   const text=AIR_MISSIONS[type].name+' · '+plan.state+'<br>'+tr('적 요격 ','Enemy interceptors ')+plan.defenders.length+tr(' · 아군 호위 ',' · friendly escorts ')+plan.escorts.length+'<br>'+tr('예상 돌파율 ','Expected mission effectiveness ')+Math.round(plan.factor*100)+'%<br>'+tr('지대공 보호: ','SAM protection: ')+(plan.sam?tr('있음','Yes'):tr('없음','No'))+' · '+tr('목표 대공장비: ','Target AA: ')+(plan.aa?tr('있음','Yes'):tr('없음','No'))+'<br>'+tr('돌파율은 기존 방공 피해 감소 이전의 비율입니다. 출격할까요?','Effectiveness is before existing AA reductions. Launch?');
   airPreviewPending=true;
   void (async()=>{try{const answer=askApp(text);$('confirmOverlay')?.classList.add('airMissionPreview');const yes=await answer;if(yes&&!busy&&airTarget?.city===q.id&&airTarget?.type===type&&canAirStrike(q,type,i))await airStrike(q,type,i)}finally{airPreviewPending=false}})();return;
  }
 }
 return airPatrolTap(sx,sy);
};
const airspaceButton=document.createElement('button');airspaceButton.id='airspaceToggle';airspaceButton.setAttribute('aria-pressed','false');
airspaceButton.textContent=tr('공역','Airspace');airspaceButton.setAttribute('aria-label',tr('초계 공역 표시','Show patrol airspace'));airspaceButton.onclick=()=>{airspaceVisible=!airspaceVisible;airspaceButton.setAttribute('aria-pressed',String(airspaceVisible));airspaceButton.textContent=tr('공역','Airspace')+(airspaceVisible?' ✓':'')};$('controls').appendChild(airspaceButton);
function drawAirspace(){
 if(!airspaceVisible||!started||menuMode)return;
 const patrols=units.filter(patrolActive);if(!patrols.length)return;
 const near=patrols.filter(u=>Math.abs(nearWorldPoint(pxy(u.tile),{x:cam.x,y:cam.y}).x-cam.x)<screenW/2/cam.z+S*6&&Math.abs(pxy(u.tile).y-cam.y)<screenH/2/cam.z+V*6);
 const area=new Set();for(const u of near){let frontier=[u.tile];area.add(u.tile);const visited=new Set([u.tile]);for(let n=0;n<AIR_PATROL_RANGE;n++){const next=[];for(const i of frontier)for(const j of neighbors(i))if(!visited.has(j)){visited.add(j);area.add(j);next.push(j)}frontier=next}}
 ctx.save();ctx.translate(screenW/2,screenH/2);ctx.scale(cam.z,cam.z);ctx.translate(-cam.x,-cam.y);
 for(const i of area){const own=near.filter(u=>u.f===player).reduce((s,u)=>s+patrolPower(u,i),0),enemy=near.filter(u=>atWar(player,u.f)).reduce((s,u)=>s+patrolPower(u,i),0);if(!own&&!enemy)continue;const color=own&&enemy?'#e8bb4b':own?'#70bee8':'#ee7777';hex(pxy(i),30);ctx.fillStyle=color+'24';ctx.fill();ctx.strokeStyle=color+'65';ctx.lineWidth=1;ctx.stroke()}
 for(const u of near){if(u.f!==player&&!atWar(player,u.f))continue;const p=pxy(u.tile);ctx.font='bold 12px Terha,sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff3c9';ctx.strokeStyle='#11252d';ctx.lineWidth=3;const text=tr('초계 ','Patrol ')+u.airPatrolLeft+'/2';ctx.strokeText(text,p.x,p.y-47);ctx.fillText(text,p.x,p.y-47)}
 ctx.restore();
}
const airspaceWorld=drawWorld;
drawWorld=function(now,backgroundOnly=false){const result=airspaceWorld(now,backgroundOnly);if(!backgroundOnly)drawAirspace();return result};
Object.assign(window.Terha,{AIR_PATROL_RANGE,AIR_PATROL_SORTIES,AIR_PATROL_OIL,patrolActive,patrolPower,canStartPatrol,startAirPatrol,airspaceState,airMissionPlan,resolveAirMission,freshOrders,canCounterattack,migrateArmy,setup,showPanel,aiStep,aiProcure,canAirStrike,tap,drawWorld});
