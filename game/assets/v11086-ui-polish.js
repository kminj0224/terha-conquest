'use strict';
// v1.10.86: clean, compact city pages; unit-style price lines; technical-only i.
// Iconography is vector-based so each footer control is a centered 24×24 glyph.
const CITY_SVG={
 cityScience:'<circle cx="9" cy="18" r="2"/><path d="m10 16 4-4m1-9 4 4-3 3-4-4 3-3ZM6 22h13M14 9l-2 2m-4-2-2 3 5 5m4 1a7 7 0 0 1 7 4H3"/>',
 cityArmy:'<path d="m14.5 17.5 3 3 4-4-3-3M4 4l8 8M3 3l3 1-2 3-1-4Zm17-1-9 9m-3 3-5 5 3 3 5-5M21 2l-4 1 3 3 1-4Z"/>',
 cityAircraft:'<path d="M22 2 9 11l-7-1 1 3 6 2 2 6 3 1-1-7 9-13Z"/><path d="m9 15-4 4m8-8-4 4"/>',
 cityNuclear:'<circle cx="12" cy="12" r="2.4"/><path d="M12 4a8 8 0 0 1 7 4l-4 2m4 2a8 8 0 0 1-5 7l-1-4m-3 4a8 8 0 0 1-6-5l4-2M9 4a8 8 0 0 1 3 0"/><circle cx="12" cy="12" r="9"/>',
 cityMissiles:'<path d="M12 2c4 3 5 7 5 12l-5 5-5-5c0-5 1-9 5-12Z"/><path d="M8 12 4 16v4l4-2m8-6 4 4v4l-4-2m-4 1v4m-2-12h4"/><circle cx="12" cy="9" r="1.5"/>'
};
for(const [id,shape] of Object.entries(CITY_SVG)){
 const b=$(id);if(!b)continue;
 b.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+shape+'</svg>';
}
refreshCityCommandButtons=function(){
 const q=selected?.kind==='city'?cities[selected.id]:null;
 const visible=!!q&&q.f===player&&!busy&&!airTarget&&!strategicTarget&&!coastBuildMode;
 for(const item of cityTabButtons){
  const b=$(item.id);if(!b)continue;
  b.style.display=visible?'inline-flex':'none';
  b.className=visible&&panelOpen&&cityCommandTab===item.tab?'cityQuickAction gold':'cityQuickAction';
 }
 const wrench=$('selectionManage');
 if(wrench&&visible){
  wrench.style.display='inline-flex';wrench.onclick=()=>cityCommandOpen('overview');
  wrench.className=panelOpen&&cityCommandTab==='overview'?'cityQuickAction gold':'cityQuickAction';
 }
 if(visible&&$('selectionUpgrade'))$('selectionUpgrade').style.display='none';
};
cityInfo=function(title,description){
 menuMode=true;$('modal').style.display='flex';
 $('modal').innerHTML='<div class="box cityTechInfo"><button class="close" id="cityInfoX" aria-label="정보 닫기">×</button><h2>'+title+'</h2><p>'+description+'</p></div>';
 $('cityInfoX').onclick=()=>{menuMode=false;$('modal').style.display='none';showPanel()};
};
addCityRow=function(parent,title,reason,action,infoTitle,infoBody,meta=''){
 const row=document.createElement('div');row.className='productionRow cityActionRow';
 const b=document.createElement('button');b.className='produceButton'+(reason?' unavailable':'');
 b.title=reason||'';b.innerHTML=title+(meta?'<small>'+meta+'</small>':'');
 b.onclick=()=>{if(reason)return toast(reason);action()};
 row.appendChild(b);
 if(infoTitle){
  const info=document.createElement('button');info.className='unitInfoButton';info.textContent='i';info.title=infoTitle+' 정보';
  info.onclick=()=>cityInfo(infoTitle,infoBody);
  row.appendChild(info);
 }
 parent.appendChild(row);return b;
};
sciencePage=function(q){
 const box=$('cityCommandContent'),r=strategicResearch[q.f],job=militaryResearchJobs[q.f];
 const cost=militaryResearchCost(q.f),busyHere=localResearchJob(q);
 const reason=tech[q.f]>=5?'군사 연구 최고 단계':job?'다른 군사 연구가 진행 중입니다.':busyHere?'이 도시에서 다른 연구가 진행 중입니다.':money[q.f]<cost?'골드가 부족합니다.':'';
 addCityRow(box,'군사 연구 '+Math.min(5,tech[q.f]+1)+'단계'+(tech[q.f]>=5?' · 완료':''),reason,
  ()=>research(),'군사 연구','부대 공격력 +5 · 최대 체력 +12 (단계당)', '골드 '+cost.toLocaleString()+' · 2턴');
 for(const [key,d] of Object.entries(RESEARCH_DEFS)){
  addCityRow(box,d.name+' 연구'+(r[key]?' · 완료':''),studyReason(q,key),()=>study(q,key),d.name+' 연구',
   key==='ballistic'?'탄도미사일 운용 기술 · 미사일 발사대 및 4종 탄도미사일 해금':'핵물질 가공 기술 · 원자폭탄·수소폭탄 및 핵 탑재 무기 해금',
   '골드 '+d.cost.toLocaleString()+' · '+d.turns+'턴');
 }
 addCityRow(box,'연비 개선'+(q.fuelEfficiency?' · 완료':''),fuelResearchReason(q),()=>studyFuelEfficiency(q),'연비 개선',
  '보병·기갑·포병 석유 소모량 0 · 해군 석유 소모량 50% 감소',
  '골드 '+FUEL_RESEARCH_COST.toLocaleString()+' · '+FUEL_RESEARCH_TURNS+'턴');
};
facilityPage=function(q,box=$('cityCommandContent')){
 for(const [key,d]of Object.entries(FACILITIES)){
  if(q[key])continue;
  addCityRow(box,d.name+' 건설',facilityReason(q,key),()=>buildFacility(q,key),null,null,'골드 '+d.cost.toLocaleString());
 }
};
airPage=function(q){
 const box=$('cityCommandContent');
 const cityDamage={fighter:2000,bomber:5000,strategic:15000};
 for(const [type,m]of Object.entries(AIR_MISSIONS)){
  const why=!q.airport?'공항 건설 필요':q.nukeUntil>turn?'도시 피폭 통제 중':type==='strategic'&&q.level<5?'5레벨 도시 필요':money[q.f]<m.cost?'골드 부족':oil[q.f]<m.oil?'석유 부족':'';
  const spec=type==='transport'?'공수강하 병력: 소총수 2단계 · 사거리 '+m.range+'칸':
   '부대 기본 공격력 '+m.damage+' · 도시 기본 피해 '+cityDamage[type].toLocaleString()+' · 사거리 '+m.range+'칸';
  addCityRow(box,m.name,why,()=>beginAirTarget(q,type),m.name,spec,
   '골드 '+m.cost.toLocaleString()+' · 석유 '+m.oil+' · 사거리 '+m.range);
 }
 const bomberWhy=!strategicResearch[q.f].nuclear?'핵물질 연구 필요':!q.airport||q.level<5?'5레벨 공항 필요':!strategicBomber(q)?'전략폭격기 출격 불가':!q.nukes?'보유 핵탄두 없음':'';
 addCityRow(box,'전략폭격기 핵 장착',bomberWhy,()=>chooseWarhead(q,null,true),'전략폭격기 핵 공격',
  '사거리 30칸 · 탑재 핵탄두: 원자폭탄 또는 수소폭탄',
  '골드 600 · 석유 18');
 if(armedBomber?.city===q.id&&NUCLEAR_WARHEADS[armedBomber.payload]){
  addCityRow(box,'전략폭격기 핵 공격 · '+NUCLEAR_WARHEADS[armedBomber.payload].name,bomberWhy,
   ()=>prepareStrategicLaunch(q,'short',armedBomber.payload,true),null,null,'골드 600 · 석유 18');
 }
};
nuclearPage=function(q){
 const box=$('cityCommandContent'),stock=syncWarheads(q);
 const summary=document.createElement('p');summary.className='cityStock';
 summary.textContent='원자폭탄 '+stock.atomic+'개 · 수소폭탄 '+stock.hydrogen+'개';
 box.appendChild(summary);
 for(const [key,d]of Object.entries(NUCLEAR_WARHEADS)){
  const reason=!strategicResearch[q.f].nuclear?'핵물질 연구 필요':q.nuclearJob?'핵탄두 제작 중':money[q.f]<d.gold?'골드 부족':oil[q.f]<d.oil?'석유 부족':'';
  addCityRow(box,d.name+' 제작',reason,()=>fabricateNuke(q,key),d.name,
   '핵 폭발 범위 '+d.radius+'칸 · '+d.damage,
   '골드 '+d.gold.toLocaleString()+' · 석유 '+d.oil+' · '+d.turns+'턴');
 }
 if(q.nuclearJob){
  const j=q.nuclearJob,d=NUCLEAR_WARHEADS[j.kind]||NUCLEAR_WARHEADS.atomic;
  const p=document.createElement('p');p.className='cityStock';p.textContent=d.name+' 제작 중 · '+j.remaining+'턴 남음';box.appendChild(p);
 }
};
missilePage=function(q){
 const box=$('cityCommandContent');
 for(const [key,d]of Object.entries(MISSILE_MODELS)){
  const reason=!strategicResearch[q.f].ballistic?'탄도미사일 연구 필요':!q.launcher?'미사일 발사대 필요':q.level<4?'4레벨 도시 필요':q.lastMissileTurn===turn?'이번 턴 발사 완료':money[q.f]<d.gold?'골드 부족':oil[q.f]<d.oil?'석유 부족':'';
  const armed=armedMissile?.city===q.id&&armedMissile.missileKey===key&&NUCLEAR_WARHEADS[armedMissile.payload];
  const fire=addCityRow(box,d.name+' 발사'+(armed?' · '+NUCLEAR_WARHEADS[armedMissile.payload].name+' 장착':''),reason,
   ()=>prepareStrategicLaunch(q,key,armed?armedMissile.payload:null),d.name,
   '통상탄 도시 공격력 '+d.damage.toLocaleString()+' · 사거리 '+d.range+'칸',
   '골드 '+d.gold.toLocaleString()+' · 석유 '+d.oil+' · 사거리 '+d.range);
  const mount=document.createElement('button');mount.className='unitInfoButton cityMountWarhead';
  mount.innerHTML='<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M10 9 6 3A10 10 0 0 0 2 13h7Zm4 0 4-6a10 10 0 0 1 4 10h-7Zm-2 6-4 7a10 10 0 0 0 8 0Z" fill="currentColor"/></svg>';
  mount.title='핵 장착';mount.setAttribute('aria-label','핵 장착');
  mount.onclick=()=>{if(!strategicResearch[q.f].nuclear)return toast('핵물질 연구 필요');chooseWarhead(q,key)};
  fire.parentElement.appendChild(mount);
 }
};
const oldPolishPanel=showPanel;
showPanel=function(){
 // Keep all specialized unit panels on their original rendering path.
 if(selected?.kind!=='city'){oldPolishPanel();return}
 if(!panelOpen||busy||!selected){$('panel').style.display='none';return}
 const q=cities[selected.id];cityProfile(q);
 if(cityCommandId!==q.id){cityCommandId=q.id;cityCommandTab='overview'}
 const own=q.f===player&&q.nukeUntil<=turn;
 if(!own)cityCommandTab='overview';
 const names={overview:'도시 정보',facilities:'시설 건설',science:'과학·군사 연구',units:'부대 생산',air:'공항 작전',nuclear:'핵탄두 제작',missiles:'탄도미사일'};
 const panel=$('panel');panel.style.display='block';
 if(cityCommandTab==='overview'){
  panel.innerHTML='<button class="close" id="close">×</button>'+
   '<div class="cityCommandHeading"><span class="eyebrow">도시 정보</span>'+
   (own?'<button id="cityExpandGold" class="gold">도시 확장'+(q.level<5?' · '+UPGRADE_COSTS[q.level].toLocaleString()+'골드':' · 최대 등급')+'</button>':'')+'</div>'+
   '<h2>'+q.name+' <small class="cityLevel">'+q.level+'레벨'+(q.capital?' · 수도':'')+'</small></h2>'+
   '<p class="cityNation" style="color:'+factions[q.f].color+'">'+factions[q.f].name+'</p>'+
   cityOverview(q)+(own?'<details class="citySection" open><summary>시설 건설</summary><div id="cityOverviewFacilities"></div></details>':'');
 }else{
  panel.innerHTML='<button class="close" id="close" title="닫기">×</button>'+
   '<section class="citySection cityCommandCompact"><h3>'+names[cityCommandTab]+'</h3><div id="cityCommandContent"></div></section>';
 }
 $('close').onclick=()=>{panelOpen=false;refreshSelection()};
 if(!own)return;
 if(cityCommandTab==='overview'){
  const expand=$('cityExpandGold');expand.disabled=q.level>=5;expand.onclick=()=>upgradeCity(q);
  facilityPage(q,$('cityOverviewFacilities'));
 }else if(cityCommandTab==='facilities')facilityPage(q);
 else if(cityCommandTab==='science')sciencePage(q);
 else if(cityCommandTab==='units')unitPage(q);
 else if(cityCommandTab==='air')airPage(q);
 else if(cityCommandTab==='nuclear')nuclearPage(q);
 else if(cityCommandTab==='missiles')missilePage(q);
 refreshCityCommandButtons();
};
Object.assign(window.Terha,{cityInfo,showPanel,refreshCityCommandButtons});
