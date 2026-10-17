'use strict';
// Airport-based long-range troop deployment. The aircraft is an operation,
// not a persistent combat unit; only the deployed riflemen join the army.
function airDropTileAvailable(i){
 if(!Number.isInteger(i)||i<0||i>=tiles.length)return false;
 if(tiles[i].owner<0||unitAt(i)||baseAt(i))return false;
 const city=cityAt(i);
 return !city||(city.hp<=0&&(city.nukeUntil||0)<=turn);
}
const normalStrikeTarget=strikeTarget;
strikeTarget=function(q,i){
 if(airTarget?.type==='transport'&&airTarget.city===q.id)return airDropTileAvailable(i);
 return normalStrikeTarget(q,i);
};
const originalAirEligibility=canAirStrike;
canAirStrike=function(q,type,i){
 if(type!=='transport')return originalAirEligibility(q,type,i);
 const m=AIR_MISSIONS.transport;
 return !!q&&q.airport&&q.nukeUntil<=turn&&money[q.f]>=m.cost&&oil[q.f]>=m.oil&&
  distance(q.tile,i)<=m.range&&airDropTileAvailable(i);
};
const originalAirportAction=showPanel;
showPanel=function(){
 originalAirportAction();
 if(!selected||selected.kind!=='city'||!panelOpen||busy)return;
 const q=cities[selected.id],button=$('airTransport');
 if(!button||q.f!==player)return;
 button.className=q.airport?'':'unavailable';
 button.onclick=()=>{
  if(!q.airport)return toast('먼저 공항을 설치하세요.');
  if(q.nukeUntil>turn)return toast('피폭 지역 통제가 끝난 뒤 출격할 수 있습니다.');
  if(money[player]<AIR_MISSIONS.transport.cost)return toast('공수강하에 필요한 골드가 부족합니다.');
  if(oil[player]<AIR_MISSIONS.transport.oil)return toast('공수강하에 필요한 석유가 부족합니다.');
  beginAirTarget(q,'transport');
 };
};
const originalAviationMission=airStrike;
airStrike=async function(q,type,i,ai=false){
 if(type!=='transport')return originalAviationMission(q,type,i,ai);
 if(!canAirStrike(q,type,i))return false;
 const m=AIR_MISSIONS.transport,a=pxy(q.tile),b=pxy(i);
 money[q.f]-=m.cost;oil[q.f]-=m.oil;
 airTarget=null;panelOpen=false;
 if(!ai){busy=true;refreshSelection();updateHUD()}
 // Two distinct animations: the transport flies to the landing site,
 // then a parachutist descends to the destination hex.
 fx.push({kind:'airraid',type:'transport',x:a.x,y:a.y,tx:b.x,ty:b.y,f:q.f,
  start:performance.now(),duration:ai?400:1300});
 await delay(ai?100:1300);
 fx.push({kind:'airraid',type:'parachute',x:b.x,y:b.y,tx:b.x,ty:b.y,f:q.f,
  start:performance.now(),duration:ai?200:1250});
 await delay(ai?100:1250);
 const troop=makeUnit(q.f,0,i,4);
 spendShot(troop); // Drop troops can act at the start of the next turn.
 if(cityAt(i))capture(troop);
 log(factions[q.f].name+' · 수송기 공수강하 · 4단계 소총수');
 if(!ai){busy=false;selectUnit(troop);updateHUD();save();checkEnd()}
 return true;
};
const originalMissionAircraft=drawMissionAircraft;
drawMissionAircraft=function(e,t){
 if(e.type!=='transport'&&e.type!=='parachute')return originalMissionAircraft(e,t);
 const f=factions[e.f];
 ctx.save();
 if(e.type==='transport'){
  const x=e.x+(e.tx-e.x)*t,y=e.y+(e.ty-e.y)*t-42-16*Math.sin(Math.PI*t);
  ctx.translate(x,y);
  ctx.rotate(Math.atan2(e.ty-e.y,e.tx-e.x));
  ctx.fillStyle='#0c171c66';ctx.beginPath();ctx.ellipse(0,15,29,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=f.color;ctx.strokeStyle=f.accent;ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(41,0);ctx.lineTo(24,-7);ctx.lineTo(3,-9);
  ctx.lineTo(-14,-31);ctx.lineTo(-23,-31);ctx.lineTo(-17,-7);
  ctx.lineTo(-37,-8);ctx.lineTo(-43,-15);ctx.lineTo(-48,-15);
  ctx.lineTo(-45,0);ctx.lineTo(-48,15);ctx.lineTo(-43,15);ctx.lineTo(-37,8);
  ctx.lineTo(-17,7);ctx.lineTo(-23,31);ctx.lineTo(-14,31);ctx.lineTo(3,9);
  ctx.lineTo(24,7);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=f.dark;ctx.fillRect(-8,-28,10,7);ctx.fillRect(-8,21,10,7);
  ctx.fillStyle=f.accent;ctx.fillRect(15,-3,15,6);
 }else{
  const drift=Math.sin(t*Math.PI*2)*5,x=e.x+drift,y=e.y-107+t*97;
  ctx.translate(x,y);
  ctx.globalAlpha=t>.92?Math.max(0,(1-t)/.08):1;
  // Domed silk canopy, cords, and small descending rifleman silhouette.
  ctx.beginPath();ctx.moveTo(-22,-26);ctx.quadraticCurveTo(0,-69,22,-26);ctx.closePath();
  ctx.fillStyle='#f4f0d5';ctx.fill();ctx.strokeStyle=f.dark;ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.moveTo(-5,-47);ctx.lineTo(-8,-26);ctx.lineTo(-4,-8);
  ctx.moveTo(5,-47);ctx.lineTo(8,-26);ctx.lineTo(4,-8);
  ctx.moveTo(-22,-26);ctx.lineTo(-4,-8);ctx.moveTo(22,-26);ctx.lineTo(4,-8);
  ctx.strokeStyle='#344551';ctx.lineWidth=1;ctx.stroke();
  ctx.beginPath();ctx.arc(0,-5,3.5,0,Math.PI*2);ctx.fillStyle='#dcc5a0';ctx.fill();
  ctx.fillStyle=f.color;ctx.fillRect(-4,-1,8,11);
  ctx.strokeStyle=f.dark;ctx.lineWidth=2;ctx.beginPath();
  ctx.moveTo(-2,10);ctx.lineTo(-6,16);ctx.moveTo(2,10);ctx.lineTo(6,16);
  ctx.moveTo(-4,3);ctx.lineTo(-9,8);ctx.moveTo(4,3);ctx.lineTo(9,8);ctx.stroke();
 }
 ctx.restore();
};
Object.assign(window.Terha,{airDropTileAvailable,canAirStrike,airStrike,showPanel});
