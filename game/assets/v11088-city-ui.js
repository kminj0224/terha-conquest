'use strict';
// v1.10.88: preserve the city heading on every command page, restore the
// requested information hierarchy, and mount bomber warheads in the airstrike row.

// Carefully drawn 24×24 vector symbols with a consistent 1.75px stroke.
// The pictograms do not rely on platform emoji fonts or glyph baselines.
const CITY_COMMAND_ICONS_11088={
 cityScience:'<path d="m14 3 7 7-3 3-7-7z"/><path d="m12 8-5 5"/><path d="m6 12 5 5"/><path d="M7 17a6 6 0 0 0 6 5"/><path d="M3 22h18"/>',
 cityArmy:'<path d="M4 3 3 7l14 14 4-4L7 3Z"/><path d="m3 17 4 4m-2-2 8-8"/><path d="m17 3 4 4-14 14"/><path d="m21 3-4 0 4 4z"/>',
 cityAircraft:'<path d="M12 2c1 0 1.5.7 1.5 1.6v6.2l7 4.7V18l-7-2.2V20l2 1.3V23L12 22l-3.5 1v-1.7l2-1.3v-4.2L3.5 18v-3.5l7-4.7V3.6C10.5 2.7 11 2 12 2Z" fill="currentColor" stroke="none"/>',
 cityNuclear:'<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="2.15" fill="currentColor" stroke="none"/><path d="M10.3 8.4 6.9 2.95A10 10 0 0 1 17.1 2.95l-3.4 5.45a4 4 0 0 0-3.4 0Z" fill="currentColor" stroke="none"/><path d="m16.65 11.5 6.2-.3a10 10 0 0 1-5.08 8.8l-2.9-5.55a4 4 0 0 0 1.78-2.95Z" fill="currentColor" stroke="none"/><path d="m9.13 14.45-2.9 5.55a10 10 0 0 1-5.08-8.8l6.2.3a4 4 0 0 0 1.78 2.95Z" fill="currentColor" stroke="none"/>',
 cityMissiles:'<path d="M12 2c3.5 3 4.5 7 4.5 13L12 19l-4.5-4C7.5 9 8.5 5 12 2Z"/><circle cx="12" cy="9.5" r="2"/><path d="m7.5 13-3.5 3v4l4-2"/><path d="m16.5 13 3.5 3v4l-4-2"/><path d="M12 19v4"/>'
};
for(const [id,paths]of Object.entries(CITY_COMMAND_ICONS_11088)){
 const button=$(id);
 if(!button)continue;
 button.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
}
// Keep icon style and alignment shared by all footer buttons, including wrench.
const cityQuickButtonRefresh=refreshCityCommandButtons;
refreshCityCommandButtons=function(){
 cityQuickButtonRefresh();
 for(const id of ['selectionManage',...Object.keys(CITY_COMMAND_ICONS_11088)]){
  const b=$(id);if(!b)continue;
  b.classList?.add('cityQuickAction');
 }
};
function nuclearMountButton(q,missileKey=null,bomber=false){
 const b=document.createElement('button');
 b.className='unitInfoButton cityMountWarhead';
 b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M9.7 8.8 7 4.4a8.5 8.5 0 0 1 10 0l-2.7 4.4M16 13l5 .3a9 9 0 0 1-5 7.3l-2-4.4M10 16.2l-2 4.4a9 9 0 0 1-5-7.3L8 13" fill="currentColor" stroke="none"/></svg>';
 b.title='핵탄두 장착';b.setAttribute('aria-label','핵탄두 장착');
 b.onclick=()=>{
  if(!strategicResearch[q.f].nuclear)return toast('핵물질 연구가 필요합니다.');
  chooseWarhead(q,missileKey,bomber);
 };
 return b;
}
// Keep one strategic-bomber row and put its nuclear loading control beside i.
airPage=function(q){
 const box=$('cityCommandContent');
 const cityDamage={fighter:2000,bomber:5000,strategic:15000};
 const bomberArmed=armedBomber?.city===q.id&&NUCLEAR_WARHEADS[armedBomber.payload];
 for(const [type,m]of Object.entries(AIR_MISSIONS)){
  const nuclear=type==='strategic'&&bomberArmed;
  const price=nuclear?600:m.cost,fuel=nuclear?18:m.oil;
  const reason=!q.airport?'공항 건설 필요':q.nukeUntil>turn?'도시 피폭 통제 중':
   type==='strategic'&&q.level<5?'5레벨 도시 필요':
   nuclear&&!strategicBomber(q)?'전략폭격기 출격 불가':
   money[q.f]<price?'골드 부족':oil[q.f]<fuel?'석유 부족':'';
  const title=m.name+(nuclear?' · '+NUCLEAR_WARHEADS[armedBomber.payload].name+' 장착':'');
  const spec=type==='transport'?'공수강하 병력: 소총수 2단계 · 사거리 '+m.range+'칸':
   '부대 기본 공격력 '+m.damage+' · 도시 기본 피해 '+cityDamage[type].toLocaleString()+' · 사거리 '+m.range+'칸';
  const fire=addCityRow(box,title,reason,
   ()=>nuclear?prepareStrategicLaunch(q,'short',armedBomber.payload,true):beginAirTarget(q,type),
   m.name,spec,'골드 '+price.toLocaleString()+' · 석유 '+fuel+' · 사거리 '+m.range);
  if(type==='strategic')fire.parentElement.appendChild(nuclearMountButton(q,null,true));
 }
};
// Name and city ownership remain visible in ALL command pages.
// The yellow button is on the overview ONLY, exactly where '도시 정보' used to sit.
const priorCityPanel_11088=showPanel;
showPanel=function(){
 if(selected?.kind!=='city'){priorCityPanel_11088();return}
 if(!selected||!panelOpen||busy){$('panel').style.display='none';return}
 const q=cities[selected.id];
 cityProfile(q);
 if(cityCommandId!==q.id){cityCommandId=q.id;cityCommandTab='overview'}
 const own=q.f===player&&q.nukeUntil<=turn;
 if(!own)cityCommandTab='overview';
 const pageNames={overview:'',facilities:'시설 건설',science:'과학·군사 연구',units:'부대 생산',air:'공항 작전',nuclear:'핵탄두 제작',missiles:'탄도미사일'};
 const panel=$('panel');panel.style.display='block';
 // Title + colored faction + city level share the same header.
 const title='<div class="cityNameHeader"><h2 class="cityName"><button id="cityNameFocus" class="cityNameFocus">'+q.name+'</button></h2>'+
  '<span class="cityHeadMeta"><span class="cityCountryName" style="color:'+factions[q.f].color+'">'+factions[q.f].name+'</span>'+
  '<span class="cityHeadLevel">'+q.level+'레벨'+(q.capital?' · 수도':'')+'</span></span></div>';
 const expand=(own&&cityCommandTab==='overview')?
  '<div class="cityUpgradeLine"><button id="cityExpandGold" class="gold">도시 확장</button></div>':'';
 const body=cityCommandTab==='overview'
  ?cityOverview(q)+(own?'<details class="citySection" open><summary>시설 건설</summary><div id="cityOverviewFacilities"></div></details>':'')
  :'<section class="citySection cityCommandCompact"><h3>'+pageNames[cityCommandTab]+'</h3><div id="cityCommandContent"></div></section>';
 panel.innerHTML='<button class="close" id="close" aria-label="닫기">×</button>'+title+expand+body;
 $('close').onclick=()=>{panelOpen=false;refreshSelection()};
 $('cityNameFocus').onclick=()=>focusSupplyCity(q.id);
 if(!own)return;
 if(cityCommandTab==='overview'){
  const button=$('cityExpandGold');button.disabled=q.level>=5;
  button.onclick=()=>upgradeCity(q);
  facilityPage(q,$('cityOverviewFacilities'));
 }else if(cityCommandTab==='facilities')facilityPage(q);
 else if(cityCommandTab==='science')sciencePage(q);
 else if(cityCommandTab==='units')unitPage(q);
 else if(cityCommandTab==='air')airPage(q);
 else if(cityCommandTab==='nuclear')nuclearPage(q);
 else if(cityCommandTab==='missiles')missilePage(q);
 refreshCityCommandButtons();
};
Object.assign(window.Terha,{showPanel,airPage,refreshCityCommandButtons});
