'use strict';
// v1.10.85: one-click city command pages instead of nested accordions.
let cityCommandTab='overview',cityCommandId=null;
function cityCommandOpen(tab){
 if(!selected||selected.kind!=='city'||busy)return;
 cityCommandId=selected.id;cityCommandTab=tab;panelOpen=true;
 showPanel();refreshCityCommandButtons();
}
const legacyChooseCity=selectCity;
selectCity=function(q,open=false){
 if(cityCommandId!==q.id){cityCommandId=q.id;cityCommandTab='overview'}
 return legacyChooseCity(q,open);
};
const originalOverviewWithResearch=cityOverview;
cityOverview=function(q){
 let html=originalOverviewWithResearch(q);
 for(const job of researchJobs(strategicResearch[q.f])){
  if(job.city===q.id)continue;
  const foreign=progressCard(RESEARCH_DEFS[job.key].name+' 연구',(job.city===q.id?'이 도시':cities[job.city]?.name||'다른 도시')+' 연구소에서 진행 · 국가 공동 연구',job.remaining,job.total);
  html=html.replace(foreign,'');
 }
 const ownResearch=militaryResearchJobs[q.f];
 if(ownResearch&&ownResearch.city===q.id){
  const card=progressCard('군사 연구 '+(tech[q.f]+1)+'단계','이 도시에서 진행 · 국가 병력 공격력 +5 / 최대 내구도 +12',ownResearch.remaining,2);
  const empty='<h3>진행 중인 작업</h3><p class="quiet">진행 중인 작업이 없습니다.</p>';
  html=html.replace(empty,'<h3>진행 중인 작업</h3>'+card);
  if(!html.includes(card))html=html.replace('<h3>진행 중인 작업</h3>','<h3>진행 중인 작업</h3>'+card);
 }
 if(q.nuclearJob?.kind==='hydrogen'){
  const prior=progressCard('핵탄두 제작','이 도시에서 완성 후 보관',q.nuclearJob.remaining,5);
  html=html.replace(prior,progressCard('수소폭탄 제작','이 도시에서 완성 후 보관',q.nuclearJob.remaining,6));
 }else if(q.nuclearJob?.kind==='atomic'){
  const prior=progressCard('핵탄두 제작','이 도시에서 완성 후 보관',q.nuclearJob.remaining,5);
  html=html.replace(prior,progressCard('원자폭탄 제작','이 도시에서 완성 후 보관',q.nuclearJob.remaining,5));
 }
 return html;
};
// Use exactly the same sized footer icons as the existing wrench action.
const cityActionsBar=$('selectionActions');
const cityTabButtons=[
 {id:'cityScience',tab:'science',glyph:'🔬',title:'과학·군사 연구'},
 {id:'cityArmy',tab:'units',glyph:'⚔',title:'부대 생산'},
 {id:'cityAircraft',tab:'air',glyph:'✈',title:'공항 작전'},
 {id:'cityNuclear',tab:'nuclear',glyph:'☢',title:'핵탄두 제작'},
 {id:'cityMissiles',tab:'missiles',glyph:'🚀',title:'탄도미사일 발사'}
];
for(const item of cityTabButtons){
 if($(item.id))continue;
 const b=document.createElement('button');b.id=item.id;b.textContent=item.glyph;b.title=item.title;
 b.setAttribute('aria-label',item.title);b.style.display='none';b.onclick=()=>cityCommandOpen(item.tab);
 cityActionsBar.appendChild(b);
}
const refreshCityFooters=refreshSelection;
refreshSelection=function(){
 refreshCityFooters();
 refreshCityCommandButtons();
};
function refreshCityCommandButtons(){
 const q=selected?.kind==='city'?cities[selected.id]:null;
 const visible=!!q&&q.f===player&&!busy&&!airTarget&&!strategicTarget&&!coastBuildMode;
 for(const item of cityTabButtons){
  const b=$(item.id);if(!b)continue;
  b.style.display=visible?'inline-block':'none';
  b.className=visible&&panelOpen&&cityCommandTab===item.tab?'gold':'';
 }
 const wrench=$('selectionManage');
 if(wrench&&visible){
  wrench.style.display='inline-block';
  wrench.onclick=()=>cityCommandOpen('overview');
  wrench.className=panelOpen&&cityCommandTab==='overview'?'gold':'';
 }
 if(visible&&$('selectionUpgrade'))$('selectionUpgrade').style.display='none';
}
function cityInfo(title,description){
 menuMode=true;$('modal').style.display='flex';
 $('modal').innerHTML='<div class="box"><button class="close" id="cityInfoX" aria-label="정보 닫기">×</button>'+
  '<div class="eyebrow">RESEARCH / WEAPON INTELLIGENCE</div><h2>'+title+'</h2><p>'+description+'</p></div>';
 $('cityInfoX').onclick=()=>{menuMode=false;$('modal').style.display='none';showPanel()};
}
function addCityRow(parent,label,reason,action,infoTitle,infoBody){
 const row=document.createElement('div');row.className='productionRow cityActionRow';
 const b=document.createElement('button');b.className='produceButton'+(reason?' unavailable':'');b.title=reason||'';
 b.textContent=label;
 b.onclick=()=>{if(reason){toast(reason);return}action()};
 row.appendChild(b);
 if(infoTitle){
  const info=document.createElement('button');info.className='unitInfoButton';info.textContent='i';
  info.title=infoTitle+' 정보';info.onclick=()=>cityInfo(infoTitle,infoBody);row.appendChild(info);
 }
 parent.appendChild(row);return b;
}
function sciencePage(q){
 const box=$('cityCommandContent'),r=strategicResearch[q.f],job=militaryResearchJobs[q.f];
 const cost=militaryResearchCost(q.f),busyHere=localResearchJob(q);
 const reason=tech[q.f]>=5?'군사 연구 최고 단계':job?'다른 군사 연구가 진행 중입니다.':busyHere?'이 도시에서 다른 연구가 진행 중입니다.':money[q.f]<cost?'골드가 부족합니다.':'';
 addCityRow(box,'군사 연구 '+(tech[q.f]+1)+'단계 · 골드 '+cost+' · 2턴',reason,
  ()=>research(),'군사 연구',
  '2턴 연구. 국가 모든 유닛의 기본 공격력 +5, 기본 최대 내구도 +12. 현재 '+tech[q.f]+'/5단계. 같은 도시에 다른 연구가 진행 중이면 시작할 수 없습니다.');
 for(const [key,d] of Object.entries(RESEARCH_DEFS)){
  const running=researchJobs(r).find(j=>j.key===key);
  const why=studyReason(q,key);
  addCityRow(box,d.name+' 연구 · 골드 '+d.cost+(d.oil?' · 석유 '+d.oil:'')+' · '+d.turns+'턴'+(r[key]?' · 완료':''),
   why,()=>study(q,key),d.name+' 연구',
   d.description||(key==='ballistic'?'탄도미사일 발사대를 해금하고 단·중·장거리 및 대륙간 미사일을 사용할 수 있습니다. 기간 '+d.turns+'턴.':'핵탄두 제작과 핵 장착 탄도미사일·전략폭격기를 해금합니다. 기간 '+d.turns+'턴.'));
 }

}
function facilityPage(q,box=$('cityCommandContent')){
 for(const [key,d] of Object.entries(FACILITIES)){
  addCityRow(box,d.name+' 건설 · 골드 '+d.cost,facilityReason(q,key),()=>buildFacility(q,key));
 }
}
function unitPage(q){
 $('cityCommandContent').innerHTML='<div id="production"></div>';
 productionPanel(q);
}
function airPage(q){
 const box=$('cityCommandContent');
 for(const [type,m]of Object.entries(AIR_MISSIONS)){
  const why=!q.airport?'공항 건설이 필요합니다.':q.nukeUntil>turn?'도시 피폭 통제 중입니다.':type==='strategic'&&q.level<5?'5레벨 도시에서 운용합니다.':money[q.f]<m.cost?'골드 부족':oil[q.f]<m.oil?'석유 부족':'';
  addCityRow(box,m.name+' · 골드 '+m.cost+' · 석유 '+m.oil+' · 사거리 '+m.range,
   why,()=>beginAirTarget(q,type),m.name,'공항에서 출격 · 사거리 '+m.range+'칸 / 골드 '+m.cost+' / 석유 '+m.oil+'. 자원이 남아 있으면 연속 출격 가능.');
 }
 const bomberWhy=!strategicResearch[q.f].nuclear?'핵물질 연구를 완료하세요.':!q.airport||q.level<5?'5레벨 공항이 필요합니다.':!strategicBomber(q)?'전략폭격기 출격 불가':!q.nukes?'보유 핵탄두 없음':'';
 addCityRow(box,'전략폭격기 핵 임무 · 핵 장착',bomberWhy,()=>chooseWarhead(q,null,true),
  '전략폭격기 핵 임무','사거리 30칸 · 골드 600 / 석유 18 / 보유 중인 원자폭탄 또는 수소폭탄 1개를 선택해 장착하고 목표를 선택합니다.');
 if(armedBomber?.city===q.id){
  addCityRow(box,'✈ 핵 공격 개시 · '+NUCLEAR_WARHEADS[armedBomber.payload].name,bomberWhy,
   ()=>prepareStrategicLaunch(q,'short',armedBomber.payload,true));
 }
}
function nuclearPage(q){
 const box=$('cityCommandContent'),stock=syncWarheads(q);
 const summary=document.createElement('p');summary.className='hint';
 summary.textContent='보유 핵탄두 · 원자폭탄 '+stock.atomic+'개 / 수소폭탄 '+stock.hydrogen+'개';
 box.appendChild(summary);
 for(const [key,d]of Object.entries(NUCLEAR_WARHEADS)){
  const reason=!strategicResearch[q.f].nuclear?'핵물질 연구가 필요합니다.':q.nuclearJob?'이 도시에서 다른 핵탄두를 제작 중입니다.':money[q.f]<d.gold?'골드 부족':oil[q.f]<d.oil?'석유 부족':'';
  addCityRow(box,d.name+' 제작 · 골드 '+d.gold+' · 석유 '+d.oil+' · '+d.turns+'턴',reason,
   ()=>fabricateNuke(q,key),d.name,
   '효과 범위 '+d.radius+'칸 / 핵 공격력 '+d.damage+' / 피폭 통제 '+d.control+'턴. 제작비 골드 '+d.gold+' / 석유 '+d.oil+' / 제작 기간 '+d.turns+'턴.');
 }
 if(q.nuclearJob){
  const j=q.nuclearJob,kind=j.kind||'atomic';
  const hint=document.createElement('p');hint.textContent='제작 중: '+NUCLEAR_WARHEADS[kind].name+' · '+j.remaining+'턴 남음';box.appendChild(hint);
 }
}
function chooseWarhead(q,missileKey,bomber=false){
 const stock=syncWarheads(q);
 menuMode=true;$('modal').style.display='flex';
 $('modal').innerHTML='<div class="box"><button class="close" id="warheadClose">×</button><h2>핵탄두 장착</h2>'+
 '<p>원자폭탄 '+stock.atomic+'개 · 수소폭탄 '+stock.hydrogen+'개</p>'+
 '<div id="warheadOptions"></div></div>';
 $('warheadClose').onclick=()=>{menuMode=false;$('modal').style.display='none';showPanel()};
 for(const [key,d]of Object.entries(NUCLEAR_WARHEADS)){
  const reason=stock[key]?null:'해당 핵탄두가 없습니다.';
  addCityRow($('warheadOptions'),d.name+' '+stock[key]+'개',reason,()=>{
   menuMode=false;$('modal').style.display='none';
   if(prepareStrategicLaunch(q,missileKey||'short',key,bomber)){
    if(bomber)armedBomber={city:q.id,payload:key};
    else armedMissile={city:q.id,missileKey,payload:key};
   }else showPanel();
  },d.name,'폭발 반경 '+d.radius+'칸 / '+d.damage);
 }
}
function missilePage(q){
 const box=$('cityCommandContent');
 for(const [key,d]of Object.entries(MISSILE_MODELS)){
  const reason=!strategicResearch[q.f].ballistic?'탄도미사일 연구가 필요합니다.':!q.launcher?'미사일 발사대 건설이 필요합니다.':q.level<4?'4레벨 도시가 필요합니다.':q.lastMissileTurn===turn?'이번 턴 발사 완료':money[q.f]<d.gold?'골드 부족':oil[q.f]<d.oil?'석유 부족':'';
  const row=document.createElement('div');row.className='productionRow cityActionRow';
  addCityRow(row,d.name+' 발사 · 골드 '+d.gold+' · 석유 '+d.oil+' · 사거리 '+d.range,
   reason,()=>prepareStrategicLaunch(q,key,armedMissile?.city===q.id&&armedMissile.missileKey===key?armedMissile.payload:null),
   d.name,'통상탄 도시 공격력 '+d.damage+' / 사거리 '+d.range+'칸 / 골드 '+d.gold+' / 석유 '+d.oil+'. 핵 장착 시 선택한 탄두의 폭발 효과로 변경됩니다.');
  const mount=document.createElement('button');mount.className='unitInfoButton';mount.textContent='☢';mount.title='핵 장착';
  mount.onclick=()=>{if(!strategicResearch[q.f].nuclear)return toast('핵물질 연구를 완료하세요.');chooseWarhead(q,key)};
  row.appendChild(mount);
  box.appendChild(row);
  if(armedMissile?.city===q.id&&armedMissile.missileKey===key){
   const n=document.createElement('p');n.className='hint';n.textContent='장착 예정: '+NUCLEAR_WARHEADS[armedMissile.payload].name+' 1개';box.appendChild(n);
  }
 }
}
const oldCommandShowPanel=showPanel;
showPanel=function(){
 oldCommandShowPanel();
 if(selected?.kind!=='city'||!panelOpen||busy)return;
 const q=cities[selected.id];
 if(cityCommandId!==q.id){cityCommandId=q.id;cityCommandTab='overview'}
 const own=q.f===player&&q.nukeUntil<=turn;
 if(!own)cityCommandTab='overview';
 const pageNames={overview:'도시 정보',facilities:'시설 건설',science:'과학·군사 연구',units:'부대 생산',air:'공항 작전',nuclear:'핵탄두 제작',missiles:'탄도미사일'};
 const panel=$('panel');
 panel.innerHTML='<button class="close" id="close">×</button>'+
  '<div class="cityCommandHeading"><span class="eyebrow">'+pageNames[cityCommandTab]+'</span>'+
  (own?'<button id="cityExpandGold" class="gold">도시 확장'+(q.level<5?' · '+UPGRADE_COSTS[q.level].toLocaleString()+'골드':' · 최대 등급')+'</button>':'')+'</div>'+
  '<h2>'+q.name+' <small class="cityLevel">'+q.level+'레벨'+(q.capital?' · 수도':'')+'</small></h2>'+
  '<p class="cityNation" style="color:'+factions[q.f].color+'">'+factions[q.f].name+'</p>'+
  (cityCommandTab==='overview'?cityOverview(q)+(own?'<details class="citySection" open><summary>시설 건설</summary><div id="cityOverviewFacilities"></div></details>':''):'<section class="citySection"><h3>'+pageNames[cityCommandTab]+'</h3><div id="cityCommandContent"></div></section>');
 $('close').onclick=()=>{panelOpen=false;refreshSelection()};
 if(!own)return;
 const expand=$('cityExpandGold');expand.disabled=q.level>=5;expand.onclick=()=>upgradeCity(q);
 if(cityCommandTab==='overview')facilityPage(q,$('cityOverviewFacilities'));
 else if(cityCommandTab==='facilities')facilityPage(q);
 else if(cityCommandTab==='science')sciencePage(q);
 else if(cityCommandTab==='units')unitPage(q);
 else if(cityCommandTab==='air')airPage(q);
 else if(cityCommandTab==='nuclear')nuclearPage(q);
 else if(cityCommandTab==='missiles')missilePage(q);
 refreshCityCommandButtons();
};
// Use opaque owner's faction color, not the old semi-transparent original
// homeland ground tint, so a conquered hex has exactly its new nation's color.
drawTerritories=function(){
 refreshTerritory();
 if(territoryCanvas){ctx.save();ctx.globalAlpha=1;ctx.drawImage(territoryCanvas,0,0,WW,HH);ctx.restore()}
};
Object.assign(window.Terha,{cityCommandOpen,cityCommandTab,cityInfo,showPanel,cityOverview,refreshSelection,
 selectCity,drawTerritories,chooseWarhead});

