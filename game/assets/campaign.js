'use strict';
const campaignMenuMusic=appUsesMenuMusic;
appUsesMenuMusic=function(){return document.body.dataset.campaignDialogue!=='true'&&campaignMenuMusic()};
const CampaignApp=(()=>{
 const DATA=IRON_CROWN_CAMPAIGN,KEY='terha-campaign-iron-crown-v1';
 let record=null,view='menu',root=null,autoTimer=null,notice='',draft=false,resumeRecord=null;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const mission=()=>DATA.implementedMissions.includes(record?.mission)?record.mission:1;
 const title=()=>DATA.missions[mission()-1].title;
 const intro=()=>mission()===1?DATA.intro:DATA['intro'+mission()];
 const missionData=id=>id===1?DATA.battle:DATA['battle'+id];
 const battleData=()=>missionData(mission());
 function dialogue(on){document.body.dataset.campaignDialogue=String(on);if(on)stopOperationMusic();applyAppAudio()}
 const trc=(ko,en)=>typeof tr==='function'?tr(ko,en):ko;
 function loadRecord(){try{const x=JSON.parse(localStorage.getItem(KEY));if(!x||x.id!==DATA.id||![1,2].includes(x.schema)||!Number.isInteger(x.vn)||x.vn<0||x.vn>=25||![0,1,2].includes(x.difficulty)||!Array.isArray(x.completed))return null;if(x.schema===1){x.schema=2;x.phase=x.phase==='intro'?'intro':'briefing';x.battle=null;x.checkpoint=null;x.legacyReset=true}x.mission=x.mission||1;if(!DATA.implementedMissions.includes(x.mission)||x.mission>1&&!x.completed.includes(x.mission-1))return null;if(!['intro','briefing','route','deployment','battle','won','lost'].includes(x.phase)||x.battle&&!CampaignBattle.valid(x.battle)||x.checkpoint&&!CampaignBattle.valid(x.checkpoint)||x.pendingStart&&!CampaignBattle.valid(x.pendingStart))return null;return x}catch{return null}}
 function save(){if(!record||draft)return true;try{record.savedAt=Date.now();localStorage.setItem(KEY,JSON.stringify(record));archive();return true}catch{notice='캠페인을 저장하지 못했습니다. 저장 공간을 확인하십시오.';return false}}
 function stop(){clearTimeout(autoTimer);autoTimer=null}
 function mount(){stop();$('modal').classList.add('campaignModal');$('modal').innerHTML='<div id="campaignRoot"></div>';root=$('campaignRoot')}
 function button(id,fn){const e=$(id);if(e)e.onclick=fn}
 function open(){if(activeScenario&&!busy)CampaignBattle.leave();setAppScreen('campaign');draft=false;resumeRecord=null;record=loadRecord();view='menu';renderMenu()}
 function close(){dialogue(false);stop();save();$('modal').classList.remove('campaignModal');view='closed';root=null;showBattlefield()}
 function menuHeader(label){return '<header class="cpLibraryHeader"><button id="appBack" aria-label="뒤로">‹</button><h1>'+esc(label)+'</h1></header>'}
 function renderMenu(){discardDraft();dialogue(false);view='menu';mount();root.innerHTML='<div class="cpBackdrop"></div><section class="cpLibrary">'+menuHeader('캠페인 선택')+'<div class="cpCampaignGrid"><button id="cpCampaignIron" class="cpCampaignBanner"><img src="campaign-iron-crown-banner-v3.webp" alt=""><span><strong>'+DATA.title+'</strong><small>총 8개 임무</small></span></button>'+Array.from({length:7},()=>'<div class="cpCampaignBanner cpEmptyBanner" aria-hidden="true"></div>').join('')+'</div></section>';button('appBack',close);button('cpCampaignIron',renderMissions)}
 function unlocked(id){return DATA.implementedMissions.includes(id)&&(id===1||record?.completed.includes(id-1))}
 function renderMissions(){discardDraft();dialogue(false);view='missions';mount();root.innerHTML='<div class="cpBackdrop"></div><section class="cpLibrary">'+menuHeader(DATA.title)+'<div class="cpLibraryTools"><span>임무 선택</span><select id="cpDifficulty" aria-label="캠페인 난이도"><option value="0">쉬움</option><option value="1">보통</option><option value="2">어려움</option></select>'+(record&&!['won','lost'].includes(record.phase)?'<button id="cpContinue">이어하기</button>':'')+'</div><div class="cpMissionGrid">'+DATA.missions.map(d=>{const available=unlocked(d.id),done=record?.completed.includes(d.id),rating=CampaignRules.records()[d.id],art=missionData(d.id)?.map.image||'campaign-iron-crown-banner-v3.webp';return '<button id="cpMission'+d.id+'" class="cpMissionTile '+(available?'':'cpLocked')+'" '+(available?'':'disabled')+' aria-label="'+d.id+' '+esc(d.title)+' '+(done?'클리어':available?'진행 가능':'잠김')+'"><img src="'+art+'" alt="">'+(!available?'<span class="cpLock" aria-hidden="true">▣</span>':'')+'<span class="cpMissionLabel"><b>'+String(d.id).padStart(2,'0')+'</b><strong>'+esc(d.title)+'</strong><small>'+(rating?CampaignRules.row(rating.stars,3):done?'✓ 클리어':available?'진행 가능':'잠김')+'</small></span></button>'}).join('')+'</div></section>';$('cpDifficulty').value=record?.difficulty??1;button('appBack',renderMenu);button('cpContinue',()=>resume());for(const d of DATA.missions)if(unlocked(d.id))button('cpMission'+d.id,()=>selectMission(d.id))}
 function discardDraft(){if(draft){record=loadRecord();draft=false}resumeRecord=null}
 function archive(){if(!record||draft)return;try{localStorage.setItem(KEY+'-mission-'+mission(),JSON.stringify(record));if(record.phase==='won')localStorage.setItem(KEY+'-victory-'+mission(),JSON.stringify(record.battle))}catch{notice='임무 기록을 저장하지 못했습니다.'}}
 function selectMission(id){
  if(!unlocked(id))return;const level=+$('cpDifficulty').value;archive();const completed=[...(record?.completed||[])];
  let previous=null,carry=null;try{previous=JSON.parse(localStorage.getItem(KEY+'-mission-'+id));if(id>1)carry=JSON.parse(localStorage.getItem(KEY+'-victory-'+(id-1)))}catch{}
  if(!carry&&previous?.id===DATA.id&&previous.mission===id)carry=previous.carry;
  resumeRecord=previous?.id===DATA.id&&previous.mission===id&&['intro','route','briefing','deployment','battle'].includes(previous.phase)&&Number.isInteger(previous.vn)&&previous.vn>=0&&previous.vn<25&&(!previous.battle||previous.battle.scenario===missionData(id).id&&CampaignBattle.valid(previous.battle))?previous:null;
  record={schema:2,id:DATA.id,mission:id,phase:'briefing',vn:0,needsIntro:true,difficulty:level,route:null,carry,battle:null,checkpoint:null,completed};draft=true;renderBriefing()
 }
 function resume(saved=loadRecord()){
  if(!saved)return;const latest=loadRecord();draft=false;resumeRecord=null;record=saved;record.completed=[...new Set([...(latest?.completed||[]),...record.completed])];save();
  if(record.phase==='deployment')renderDeployment(record.pendingStart||null);else if(record.phase==='intro')renderVN();else if(record.phase==='route')renderChoice();else if(record.phase==='briefing'){if(record.needsIntro)renderBriefing();else if(mission()>1&&!record.route)renderChoice();else enterBattle(record.battle)}else if(['won','lost'].includes(record.phase))renderResult();else enterBattle(record.battle)
 }
 function character(id){return id==='steward'?{id,name:'관문 영주의 집사'}:DATA.characters.find(c=>c.id===id)}
 function renderVN(){dialogue(true);view='intro';mount();root.style.setProperty('--cp-field','url("'+battleData().map.image+'")');const line=intro()[record.vn],person=character(line.speaker);root.innerHTML='<section class="cpVN '+(line.scene==='field'?'field':'')+'">'+(person&&person.portrait!==undefined?'<img class="cpPortrait" src="campaign-'+person.id+'-v3.webp" alt="">':'')+'<div class="cpVNTop"><span class="cpEyebrow">'+title()+'</span><div class="cpVNTools"><button id="cpHistory">기록</button><button id="cpAuto">자동</button><button id="cpSkip">건너뛰기</button><button id="cpVNLeave">저장·나가기</button></div></div><div class="cpDialogue"><div class="cpSpeaker">'+esc(person?person.name:line.speaker==='severin'?'제국 통행관리소':'')+'</div><p id="cpLine" class="cpLine">'+esc(line.text)+'</p><div class="cpVNFooter"><span>'+(record.vn+1)+' / '+intro().length+'</span><div><button id="cpPrev" '+(!record.vn?'disabled':'')+'>이전</button><button id="cpNext" class="gold">'+(record.vn===24?(mission()===3?'배차 선택':mission()===2?'통행 조건':'전투 시작'):'다음')+'</button></div></div></div></section>';
 button('cpPrev',()=>{if(record.vn>0){record.vn--;save();renderVN()}});button('cpNext',nextLine);button('cpVNLeave',()=>{save();renderMenu()});button('cpSkip',()=>{record.vn=24;finishVN()});button('cpHistory',history);button('cpAuto',()=>{if(autoTimer){clearTimeout(autoTimer);autoTimer=null;$('cpAuto').textContent='자동';return}$('cpAuto').textContent='자동 중';autoTimer=setTimeout(()=>{autoTimer=null;const next=record.vn+1;nextLine();if(view==='intro'&&record.vn===next)$('cpAuto').click()},Math.max(3500,line.text.length*85))})}
 function nextLine(){if(record.vn<24){record.vn++;save();renderVN()}else finishVN()}
 function sheet(html){clearTimeout(autoTimer);autoTimer=null;if($('cpAuto'))$('cpAuto').textContent='자동';const old=$('cpSheet');old?.remove();const e=document.createElement('div');e.id='cpSheet';e.className='cpSheet';e.innerHTML=html;root.appendChild(e);return e}
 function history(){sheet('<h2>대화 기록</h2>'+intro().slice(0,record.vn+1).map(l=>'<div class="cpHistoryItem"><b>'+esc(character(l.speaker)?.name||'')+'</b><div>'+esc(l.text)+'</div></div>').join('')+'<button id="cpSheetClose">닫기</button>');button('cpSheetClose',()=>{ $('cpSheet').remove()})}
 function finishVN(){record.needsIntro=false;if(mission()>1&&!record.route){record.phase='route';save();renderChoice()}else enterBattle(record.battle)}
 function renderChoice(){if(mission()===3)return renderRailChoice();dialogue(false);view='route';mount();root.innerHTML='<div class="cpBackdrop"></div><section class="cpMenu"><div class="cpEyebrow">MISSION 02</div><h1>통행 조건</h1><article class="cpMissionCard"><img src="'+DATA.battle2.map.image+'" alt="관문 지역"><div><h2>관문 통과</h2><p>두 경로 모두 관문·남부 보급소를 확보하고 적 반격을 막아야 합니다.</p><div class="cpActions"><button id="cpPay" class="gold">통행료 지급 · 600골드</button><button id="cpRecapture">외곽 탈환</button></div><p class="cpNote">지급: 중앙 진지에서 방어 시작<br>탈환: 자금을 보존하고 중앙 진지를 직접 확보</p></div></article><button id="cpChoiceBack">뒤로</button></section>';
  for(const [id,route]of [['cpPay','pay'],['cpRecapture','recapture']])button(id,()=>{record.route=route;save();enterBattle(record.battle)});button('cpChoiceBack',renderMenu)
 }
 function renderRailChoice(){dialogue(false);view='route';mount();root.innerHTML='<div class="cpBackdrop"></div><section class="cpMenu"><div class="cpEyebrow">MISSION 03</div><h1>배차 우선순위</h1><article class="cpMissionCard"><img src="'+DATA.battle3.map.image+'" alt="철도 분기점"><div><h2>하역선 배정</h2><div class="cpActions"><button id="cpTroops" class="gold">병력 하역 우선</button><button id="cpCargo">왕실 화물 우선</button></div><p>병력: 중앙역 확보 후 2턴 뒤 증원 3부대<br>화물: 중앙역 확보 후 4턴 뒤 증원 2부대·800골드·화물 배차 기록</p></div></article><button id="cpChoiceBack">뒤로</button></section>';for(const [id,route]of [['cpTroops','troops'],['cpCargo','cargo']])button(id,()=>{record.route=route;save();enterBattle(record.battle)});button('cpChoiceBack',renderMissions)}
 function renderBriefing(){
  dialogue(false);view='briefing';mount();const id=mission();
  const goals=id===3?[
   ['확보','중앙역·신호소 동시 점령'],['방어','두 거점 5턴 방어 · 반격 격퇴'],['실패','〈철관〉 격파 또는 아군 도시 전부 상실']
  ]:id===2?[
   ['격퇴','다방향 증원·관문 탈환대 격퇴'],['유지','관문·남부 보급소 동시 확보'],['호위','〈철관〉 동쪽 이탈 · 철관 격파/아군 도시 전부 상실 시 실패']
  ]:[['주 목표','〈철관〉을 동쪽 출구로 이동'],['실패 조건','〈철관〉 격파'],['선택 목표','회랑 보급소 확보']];
  root.innerHTML='<div class="cpBackdrop"></div><section class="cpBriefing"><div class="cpBriefMap"><img src="'+battleData().map.image+'" alt="작전 지역 지도"></div><div class="cpBriefContent"><header><div class="cpEyebrow">MISSION 0'+id+'</div><h1>'+title()+'</h1></header><div class="cpGoals"><h2>작전 목표</h2><ul>'+goals.map(([label,value])=>'<li><span>'+label+'</span><strong>'+value+'</strong></li>').join('')+'</ul></div><footer class="cpBriefActions"><button id="cpLaunch" class="gold">출격</button>'+(resumeRecord?'<button id="cpResumeMission">이어하기</button>':'')+'<button id="cpBriefLeave">뒤로</button></footer></div></section>';
  button('cpLaunch',()=>{draft=false;resumeRecord=null;record.vn=0;record.needsIntro=false;record.phase='intro';record.route=null;record.battle=null;record.checkpoint=null;save();renderVN()});
  button('cpResumeMission',()=>resume(resumeRecord));button('cpBriefLeave',renderMissions)
 }
 async function enterBattle(s,confirmed=false){
  if(!s&&!confirmed){renderDeployment();return true}
  dialogue(false);stop();view='battle';root=null;$('modal').classList.remove('campaignModal');$('modal').innerHTML='';record.phase='battle';setAppScreen('game');
  const ok=await runCampaignLoading(()=>CampaignBattle.start(s,record.difficulty,{id:battleData().id,route:record.route,carry:record.carry}));
  if(ok===false){if(activeScenario&&!busy)CampaignBattle.leave();setAppScreen('campaign');record.phase='briefing';save();renderBriefing();return false}
  if(!record.checkpoint)record.checkpoint=JSON.parse(JSON.stringify(snapshot()));record.battle=JSON.parse(JSON.stringify(snapshot()));record.legacyReset=false;delete record.pendingStart;save();return true;
 }
 function onBattleSnapshot(s){if(!record)record={schema:2,id:DATA.id,mission:Number(s.scenario.slice(-2)),phase:'battle',vn:24,difficulty:s.difficulty,battle:null,checkpoint:null,completed:[]};record.battle=JSON.parse(JSON.stringify(s));if(!record.checkpoint)record.checkpoint=JSON.parse(JSON.stringify(s));if(!['won','lost'].includes(record.phase))record.phase='battle';save()}
 function onResult(win,s){onBattleSnapshot(s);record.phase=win?'won':'lost';if(win){CampaignRules.award(mission(),s.turn,s.difficulty,battleData());if(!record.completed.includes(mission()))record.completed.push(mission())}save();renderResult()}
 function renderDeployment(s=null){
  dialogue(false);stop();view='deployment';record.phase='deployment';record.pendingStart=s;save();setAppScreen('campaign');mount();
  const limits=CampaignRules.rules(battleData());
  root.innerHTML='<div class="cpAwardBackdrop" style="background-image:url('+battleData().map.image+')"></div><section class="cpAwardStage"><article class="cpAwardCard" role="dialog" aria-modal="true" aria-labelledby="cpAwardTitle"><div class="cpAwardKicker">OPERATION '+String(mission()).padStart(2,'0')+'</div><h1 id="cpAwardTitle">'+esc(title())+'</h1><div class="cpAwardDivider"><span>작전 평가</span></div><div class="cpRatingGrid">'+limits.map((max,i)=>'<div class="cpRatingTier">'+CampaignRules.row(i+1)+'<strong>'+max+'<small>턴 이내</small></strong></div>').join('')+'</div><div class="cpAwardLimit">제한 '+limits[0]+'턴</div><button id="cpOperationStart" class="cpAwardConfirm" aria-label="작전 시작" title="작전 시작">'+CampaignRules.check+'</button></article></section>';
  button('cpOperationStart',()=>{if(campaignLoading)return;const snapshot=record.pendingStart||null;return enterBattle(snapshot,true)});
 }
 function renderResult(){
  dialogue(false);stop();view='result';setAppScreen('result');appReturn='campaign';mount();
  const s=record.battle,won=record.phase==='won',stars=CampaignRules.stars(s.turn,won,battleData()),next=mission()+1,canNext=won&&DATA.implementedMissions.includes(next);
  root.innerHTML='<div class="cpAwardBackdrop" style="background-image:url('+battleData().map.image+')"></div><section class="cpAwardStage"><article class="cpAwardCard cpAwardResult" role="dialog" aria-modal="true" aria-labelledby="cpAwardTitle"><div class="cpAwardKicker">OPERATION '+String(mission()).padStart(2,'0')+'</div><h1 id="cpAwardTitle">'+(won?'작전 성공':s.missionProgress.failure==='timeout'?'시간 초과':'작전 실패')+'</h1><div class="cpAwardMission">'+esc(title())+'</div><div class="cpResultStars">'+CampaignRules.row(stars,3)+'</div><div class="cpResultTurn"><strong>'+s.turn+'</strong><span>턴</span></div><button id="cpResultConfirm" class="cpAwardConfirm" aria-label="확인" title="확인">'+CampaignRules.check+'</button><div id="cpResultActions" class="cpAwardActions" hidden>'+(canNext?'<button id="cpNextMission" class="gold">다음 임무</button>':'')+'<button id="cpResultRetry">다시하기</button><button id="cpResultLeave">임무 선택</button></div></article></section>';
  button('cpResultConfirm',()=>{$('cpResultConfirm').hidden=true;$('cpResultActions').hidden=false});button('cpResultRetry',restart);button('cpNextMission',nextMission);button('cpResultLeave',open);
 }
 function nextMission(){const next=mission()+1;if(!record?.completed.includes(mission())||!DATA.implementedMissions.includes(next))return;const carry=record.battle?JSON.parse(JSON.stringify(record.battle)):null;if(activeScenario){if(busy)return;CampaignBattle.leave()}archive();draft=true;resumeRecord=null;record={schema:2,id:DATA.id,mission:next,phase:'briefing',needsIntro:true,vn:0,difficulty:record.difficulty,route:null,carry,battle:null,checkpoint:null,completed:[...record.completed]};save();setAppScreen('campaign');renderBriefing()}
 async function restart(){if(!record?.checkpoint||busy||campaignLoading)return false;if(!await askApp('현재 임무를 처음부터 다시 시작하시겠습니까?'))return false;if(busy||campaignLoading)return false;draft=false;record.phase='battle';record.battle=JSON.parse(JSON.stringify(record.checkpoint));renderDeployment(record.checkpoint);return true}
 function onLeave(){dialogue(false);stop();view='closed';root=null}
 function back(){if(!root||view==='closed'||appScreen!=='campaign')return false;if($('cpSheet')){$('cpSheet').remove();return true}if(view==='menu'){close();return true}save();if(view==='missions')renderMenu();else renderMissions();return true}
 const oldBack=window.terhaBack;window.terhaBack=function(){if(typeof appConfirm!=='undefined'&&appConfirm)return oldBack();if(back())return;return oldBack()};
 showCampaign=open;
 window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
 return{open,close,back,restart,onBattleSnapshot,onResult,onLeave,getState:()=>record?JSON.parse(JSON.stringify(record)):null,getView:()=>view,storageKey:KEY};
})();
window.TerhaCampaign=CampaignApp;

