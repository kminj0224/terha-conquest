'use strict';
// v1.10.78: direct coastal batteries and two-turn national military research.
// This module loads after the prior balance / UI modules to preserve their APIs.
let selectedDefenseId=null;
let militaryResearchJobs=Array(7).fill(null);
function militaryResearchCost(f){return (tech[f]+1)*450}
function militaryResearchDescription(){return '전 국가 부대 기본 공격력 +5 · 기본 최대 내구도 +12 (편제 단계 배율 적용)'}
function canBeginMilitaryResearch(f=player){
 return tech[f]<5&&!militaryResearchJobs[f]&&money[f]>=militaryResearchCost(f);
}
research=function(){
 if(busy||!selected||selected.kind!=='city'||cities[selected.id]?.f!==player)return false;
 const cost=militaryResearchCost(player);
 if(tech[player]>=5){toast('군사 연구가 최고 단계입니다.');return false}
 if(militaryResearchJobs[player]){toast('군사 연구가 진행 중입니다.');return false}
 if(money[player]<cost){toast('군사 연구 비용이 부족합니다.');return false}
 money[player]-=cost;
 militaryResearchJobs[player]={remaining:2,total:2,lastTick:turn,startedTurn:turn};
 toast('군사 연구 시작 · 2턴 후 공격력 +5 / 최대 내구도 +12');
 showPanel();updateHUD();save();
 return true;
};
const researchIndustryTurn=industryTurn;
industryTurn=async function(...args){
 await researchIndustryTurn(...args);
 for(let f=0;f<7;f++){
  const job=militaryResearchJobs[f];
  if(!job)continue;
  const elapsed=Math.max(0,turn-job.lastTick);
  if(!elapsed)continue;
  job.remaining=Math.max(0,job.remaining-elapsed);
  job.lastTick=turn;
  if(job.remaining>0)continue;
  const before=new Map(units.filter(u=>u.f===f).map(u=>[u.id,unitMaxHp(u)]));
  tech[f]=Math.min(5,tech[f]+1);
  for(const u of units)if(u.f===f)u.hp=Math.min(unitMaxHp(u),u.hp+unitMaxHp(u)-(before.get(u.id)||unitMaxHp(u)));
  militaryResearchJobs[f]=null;
  log(factions[f].name+' · 군사 연구 '+tech[f]+'단계 완료 (공격력 +5, 내구도 +12)');
  if(f===player)toast('군사 연구 완료! 모든 부대 공격력 +5, 최대 내구도 +12');
 }
};
const researchSetup=setup;
setup=function(...args){
 militaryResearchJobs=Array(7).fill(null);
 selectedDefenseId=null;
 return researchSetup(...args);
};
const researchSnapshot=snapshot;
snapshot=function(...args){
 const s=researchSnapshot(...args);
 s.militaryResearchJobs=militaryResearchJobs.map(j=>j?{...j}:null);
 return s;
};
const researchMigration=migrateArmy;
migrateArmy=function(s){
 const result=researchMigration(s);
 militaryResearchJobs=Array.from({length:7},(_,i)=>{
  const j=s.militaryResearchJobs?.[i];
  return j&&Number.isInteger(j.remaining)&&j.remaining>0?{
   remaining:Math.min(2,j.remaining),total:2,lastTick:Number.isInteger(j.lastTick)?j.lastTick:turn,
   startedTurn:Number.isInteger(j.startedTurn)?j.startedTurn:turn
  }:null;
 });
 selectedDefenseId=null;
 return result;
};
const researchPanel=showPanel;
showPanel=function(){
 researchPanel();
 if(selected?.kind!=='city'||!panelOpen||busy)return;
 const q=cities[selected.id];
 if(q.f!==player)return;
 const button=$('research');
 if(!button)return;
 const job=militaryResearchJobs[player],cost=militaryResearchCost(player);
 button.textContent=tech[player]>=5?'군사 연구 최대 단계 (5/5)':job?
  '군사 연구 '+(tech[player]+1)+'단계 · '+job.remaining+'턴 남음':
  '군사 연구 '+(tech[player]+1)+'단계 · 골드 '+cost+' · 2턴';
 button.disabled=tech[player]>=5||!!job||money[player]<cost;
 button.onclick=research;
 const info=document.createElement('p');
 info.className='hint';
 info.textContent=militaryResearchDescription()+' · 현재 '+tech[player]+'/5단계'+
  (job?' · 연구 진행 '+(job.total-job.remaining)+'/2턴':'');
 button.parentElement?.appendChild(info);
};
const defenseInfoPanel=showBase;
showBase=function(b){
 if(!b||!DEFENSES[b.kind||'sea'])return;
 const d=DEFENSES[b.kind||'sea'];
 menuMode=true;$('modal').style.display='flex';
 const isSea=b.kind!=='sam';
 const eligible=isSea?baseTargets(b).length:0;
 $('modal').innerHTML='<div class="box"><button class="close" id="baseClose" aria-label="포대 정보 닫기">×</button>'+
  '<div class="eyebrow">DEFENSE / '+(isSea?'ANTI-SHIP':'ANTI-AIR')+'</div>'+
  '<h2>'+d.name+' <small>i</small></h2>'+
  '<p>'+factions[b.f].name+' · '+(b.f===player?'아군':'타국')+'</p>'+
  '<div class="row"><span>내구도 '+Math.ceil(b.hp).toLocaleString()+' / '+d.hp.toLocaleString()+'</span>'+
  '<span>'+(b.remaining?'건설 '+b.remaining+'턴 남음':'작전 가능')+'</span></div>'+
  '<div class="meter"><i style="width:'+Math.max(0,Math.min(100,b.hp/d.hp*100))+'%"></i></div>'+
  '<p>공격력 '+(isSea?'5,000 (적 함정)':'지대공 요격 · 항공 피해 50% 감소')+
  '<br>사거리 '+d.range+'칸'+
  (isSea?'<br>발사당 석유 8 · 턴당 1회'+
  '<br>이번 턴 '+(b.lastShot===turn?'발사 완료':'발사 가능')+
  ' · 사거리 내 공격 대상 '+eligible+'개':
  '<br>아군 및 동맹 유닛 / 도시를 항공 공격에서 방어')+
  '<br>건설비 골드 '+d.gold.toLocaleString()+' / 석유 '+d.oil+'</p>'+
  '</div>';
 $('baseClose').onclick=()=>{menuMode=false;$('modal').style.display='none';refreshSelection()};
};
const defenseInteractionRefresh=refreshSelection;
refreshSelection=function(){
 defenseInteractionRefresh();
 const b=missileBases.find(v=>v.id===selectedDefenseId&&v.f===player);
 if(!b||busy||menuMode||coastBuildMode||airTarget||strategicTarget||navalMode&&navalMode.kind!=='coastal')return;
 const bar=$('selectionActions');
 if(!bar)return;
 bar.style.display='flex';
 for(const id of ['selectionManage','selectionUpgrade','selectionCity','selectionBoard','selectionLand']){
  const node=$(id);if(node)node.style.display='none';
 }
 const info=$('selectionInfo');
 if(info){info.style.display='inline-block';info.onclick=()=>showBase(b)}
 const cancel=$('selectionAirCancel');
 if(cancel)cancel.style.display=navalMode?.kind==='coastal'?'inline-block':'none';
};
const defenseInteractionTap=tap;
tap=function(sx,sy){
 if(busy||menuMode||!started)return defenseInteractionTap(sx,sy);
 const i=pickedNavalTile(sx,sy);
 if(i<0)return defenseInteractionTap(sx,sy);
 const b=baseAt(i);
 if(!coastBuildMode&&!airTarget&&!strategicTarget&&!navalMode&&b&&b.f===player&&!unitAt(i)){
  selectedDefenseId=b.id;
  selected=null;panelOpen=false;reach.clear();
  navalMode=b.kind!=='sam'&&readyDefense(b)&&b.lastShot!==turn&&oil[player]>=8?
   {kind:'coastal',base:b.id}:null;
  refreshSelection();
  toast(navalMode?'적 함정을 바로 선택하여 대함미사일을 발사하세요. · i: 포대 정보':'i 버튼으로 포대 정보 확인 · 건설/발사 조건을 확인하세요.');
  return;
 }
 if(!b&&navalMode?.kind!=='coastal')selectedDefenseId=null;
 return defenseInteractionTap(sx,sy);
};
$('selectionAirCancel').onclick=()=>{selectedDefenseId=null;cancelAirTarget()};
Object.assign(window.Terha,{research,cityMaxHp,siegeDamage,researchPanel,showPanel,industryTurn,
  snapshot,migrateArmy,refreshSelection,tap,showBase,militaryResearchJobs,canBeginMilitaryResearch});
