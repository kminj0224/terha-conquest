'use strict';
TYPES.push(
 {name:'경공격헬기',cost:950,hp:240,atk:100,range:2,move:7,def:20,branch:'helicopter',icon:'',antiInfantry:1.2,text:'지상항공대의 기동 지원 병종. 지형과 해상을 비행하고 기관포로 공격합니다. 도시를 점령하지 못하며 대공방어의 영향을 받습니다.'},
 {name:'공격헬기',cost:1600,hp:360,atk:165,range:3,move:8,def:32,branch:'helicopter',icon:'',antiArmor:1.8,text:'대전차 미사일과 중무장을 갖춘 지상항공대. 기갑 대상 피해 +80%. 지형과 해상을 비행하지만 도시를 점령하지 못합니다.'}
);
BRANCH_NAMES.helicopter='지상항공대';
UNIT_STORIES[20]='경공격헬기는 전선의 낮은 하늘을 누빕니다. 조종사는 지형을 살피고 사수는 지상 부대와 교신합니다. 귀환한 기체에는 정비병의 손길이 기다립니다.';
UNIT_STORIES[21]='공격헬기는 전차의 움직임을 쫓으며 긴 사격 기회를 기다립니다. 조종석의 두 승무원은 계기와 목표를 번갈아 확인합니다. 임무를 마치면 탄약과 연료를 다시 채웁니다.';
function isHelicopter(u){return u.type===20||u.type===21}
const regimentMoveCost=moveCost;moveCost=function(u,i){return isHelicopter(u)?1:regimentMoveCost(u,i)};
const regimentCapture=capture;capture=function(u){if(!isHelicopter(u))return regimentCapture(u)};
function drawHelicopter(u,angle,now){const f=factions[u.f];ctx.save();ctx.rotate(angle);rect(-34,-2,22,4,f.dark);poly([[-36,-7],[-30,-2],[-30,2],[-36,7]],f.color);ctx.fillStyle=f.dark;ctx.beginPath();ctx.ellipse(0,0,21,9,0,0,Math.PI*2);ctx.fill();poly([[-16,-6],[11,-7],[24,-3],[24,3],[11,7],[-16,6]],f.color);poly([[9,-5],[20,-3],[20,3],[9,5]],u.f===2?'#8eeaff':'#597e86');line(-12,-11,11,-11,'#1d2b31',2);line(-12,11,11,11,'#1d2b31',2);if(u.type===21){rect(-6,-13,15,4,f.dark);rect(-6,9,15,4,f.dark);rect(20,-2,13,4,'#243338')}else rect(20,-1,9,2,'#243338');ctx.rotate(now*.017+u.id);line(-31,0,31,0,'#b8c9bdc9',2);line(0,-31,0,31,'#b8c9bdc9',2);circle(0,0,3,f.accent);ctx.restore()}
const regimentRefresh=refreshSelection;refreshSelection=function(){regimentRefresh();const city=selected?.kind==='city',active=city&&!busy&&!airTarget&&!strategicTarget;$('selectionManage').style.display=active?'inline-block':'none';if(city){$('selectionInfo').style.display='none';$('selectionUpgrade').style.display='none'}};
$('selectionManage').onclick=()=>openSelectionPanel();
function reinforceDante(){const border=tiles.map((t,i)=>t.owner===1&&neighbors(i).some(j=>tiles[j].owner===0)?i:-1).filter(i=>i>=0),reserve=tiles.map((t,i)=>t.owner===1&&!unitAt(i)&&border.some(j=>distance(i,j)<=2)?i:-1).filter(i=>i>=0).sort((a,b)=>tiles[a].y-tiles[b].y||tiles[b].x-tiles[a].x);const types=[1,13,9,2,14,10,1,3,13,9,2,17,1,10,14,16],level=player!==1&&difficulty===2?2:1;for(let n=0;n<types.length&&reserve.length;n++){const at=Math.min(reserve.length-1,Math.floor(n*reserve.length/types.length)),tile=reserve.splice(at,1)[0];makeUnit(1,types[n],tile,level)}log('단테 제국 동부 전선 증원 배치')}
const regimentSetup=setup;setup=function(){regimentSetup();reinforceDante();save();refreshSelection()};
Object.assign(window.Terha,{setup,refreshSelection,capture,moveCost,isHelicopter});
