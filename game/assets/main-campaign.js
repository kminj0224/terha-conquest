'use strict';
const MainCampaign = (() => {
 let page = 0, frame = 0, root = null, view = 'closed', ready = false, resetClock = null;
 // One streaming player preserves playback position across pages in each music range.
 const music = new Audio();
 music.loop = true; music.preload = 'auto';
 let musicSource = '';
 function syncAudio() {
  const number = page+1;
  const source = view !== 'intro' ? '' : number >= 2 && number <= 34 ? 'main-campaign-ruins.mp3' : number >= 38 ? 'main-campaign-tomb.mp3' : '';
  if (source !== musicSource) {
   music.pause();
   try { music.currentTime = 0; } catch {}
   musicSource = source;
   if (source) music.src = source;
  }
  music.volume = appSettings.music;
  if (source && !document.hidden && appSettings.music > 0) {
   if (music.paused) music.play()?.catch(()=>{});
  } else if (!music.paused) music.pause();
 }
 const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; resetClock = null; ready = false; }
 function leave() { stop(); root = null; view = 'closed'; syncAudio(); }
 function open() {
  if (busy) return;
  if (closeCampaignPicker) closeCampaignPicker();
  page = 0;
  setAppScreen('mainIntro');
  view = 'intro';
  render();
 }
 function render() {
  stop();
  syncAudio();
  const line = MAIN_CAMPAIGN_INTRO[page];
  $('modal').innerHTML = '<section id="mainIntro" class="mcIntro mc-'+line.layout+'" tabindex="-1" aria-label="메인 캠페인 서막">'+
   (line.image?'<img class="mcImage" src="'+line.image+'" alt="">':'')+
   '<button id="mcSkip" class="mcSkip" aria-label="서막 건너뛰기">Skip</button>'+
   '<div class="mcTextArea"><div class="mcText" aria-label="'+esc(line.text)+'"><span class="mcMeasure" aria-hidden="true">'+esc(line.text)+'</span><span id="mcVisible" aria-hidden="true"></span></div></div>'+
   (line.layout==='banner'?'<button id="mcNext" class="mcNext" aria-label="다음 페이지" hidden disabled>&gt;</button>':'')+'</section>';
  root = $('mainIntro');
  if ($('mcNext')) $('mcNext').onclick = next;
  $('mcSkip').onclick = selection;
  const visible = $('mcVisible');
  let elapsed = 0, last = performance.now();
  resetClock = () => { last = performance.now(); };
  let update;
  if (line.layout === 'center') {
   visible.textContent = line.text;
   visible.style.opacity = '0';
   // Illustrated center pages retain their two-second opening delay.
   const pace = page === 0 ? 2 : 1;
   const delay = (line.image ? 2000 : 1000)*pace, fade = 850*pace, hold = 3000*pace;
   const ease = t => { t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); };
   update = time => {
    if (time >= delay+fade+hold+fade) { advance(); return false; }
    const opacity = time < delay ? 0 : time < delay+fade ? ease((time-delay)/fade) : time < delay+fade+hold ? 1 : 1-ease((time-delay-fade-hold)/fade);
    visible.style.opacity = String(opacity);
    return true;
   };
  } else {
   // Reserve the full paragraph's layout so typing never shifts the banner.
   const characters = Array.from(line.text);
   update = time => {
    const count = Math.min(characters.length, Math.floor(time/42));
    visible.textContent = characters.slice(0, count).join('');
    if (count < characters.length) return true;
    ready = true;
    $('mcNext').hidden = false;
    $('mcNext').disabled = false;
    return false;
   };
  }
  const animate = now => {
   frame = 0;
   if (view !== 'intro' || !visible.isConnected) return;
   if (!document.hidden) elapsed += Math.max(0, now-last);
   last = now;
   if (update(elapsed) && visible.isConnected) frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);
  root.focus?.({preventScroll:true});
 }
 function advance() { if (view !== 'intro') return; if (page+1 === MAIN_CAMPAIGN_INTRO.length) selection(); else { page++; render(); } }
 function next() { if (view === 'intro' && MAIN_CAMPAIGN_INTRO[page].layout === 'banner' && ready) advance(); }
 function selection() {
  stop(); root = null; view = 'selection'; setAppScreen('mainCampaign');
  $('modal').innerHTML = '<section class="mcSelection" id="mainCampaignSelection"><header><button id="mcBack" aria-label="뒤로">‹</button><h1>'+tr('메인 캠페인 선택','MAIN CAMPAIGN')+'</h1><button id="mcReplay">'+tr('서막 다시 보기','REPLAY INTRO')+'</button></header><div class="mcCampaignGrid"><button id="mcWar" class="mcCampaignCard"><img src="main-campaign-intro.jpg" alt=""><span><small>MAIN CAMPAIGN</small><strong>2차 선석전쟁</strong></span></button></div></section>';
  $('mcBack').onclick = close;
  $('mcReplay').onclick = open;
  $('mcWar').onclick = stages;
 }
 // This selector never creates battle saves or unlocks unimplemented missions.
 const stageImages = ['main-campaign-scene-7.png','main-campaign-scene-6.png','main-campaign-scene-5.jpg','main-campaign-scene-4.png','main-campaign-scene-2.png','main-campaign-scene-3.png','main-campaign-scene-1.png','main-campaign-scene-6.png','main-campaign-scene-7.png','main-campaign-scene-7.png'];
 const lockIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M12 14v3"/></svg>';
 function stages() {
  stop(); root = null; view = 'stages'; syncAudio();
  $('modal').innerHTML = '<main class="mcStages" id="mainCampaignStages" tabindex="-1" aria-labelledby="mcStagesTitle">'+
   '<header class="mcStageHeader"><button id="mcStagesBack">‹ '+tr('캠페인 목록','CAMPAIGNS')+'</button><div class="mcStageHeading"><small>MAIN CAMPAIGN / 01</small><h1 id="mcStagesTitle">'+tr('2차 선석전쟁','SECOND SEONSEOK WAR')+'</h1><p>'+tr('스테이지 선택','SELECT STAGE')+' <span>01 — 10</span></p></div><div class="mcStageProgress">'+tr('전역 진행도','CAMPAIGN PROGRESS')+' <b>0 <span>/ 10</span></b><i></i></div></header>'+
   '<div class="mcStageBody"><div class="mcStageList">'+stageImages.map((image,i)=>'<button class="mcStageCard" aria-disabled="true" aria-label="'+tr('스테이지 ','Stage ')+(i+1)+tr(' · 잠김 · 미클리어',' · Locked · Uncleared')+'"><img src="'+image+'" alt=""><span class="mcStageShade"></span><span class="mcStageNumber">'+String(i+1).padStart(2,'0')+'</span><span class="mcStageCaption"><small>STAGE '+String(i+1).padStart(2,'0')+'</small><strong>'+tr('스테이지 ','Stage ')+String(i+1).padStart(2,'0')+'</strong><span class="mcStageStatus">'+tr('미클리어','UNCLEARED')+'</span></span><span class="mcStageLock">'+lockIcon+'</span></button>').join('')+'</div></div>'+
   '<footer class="mcStageFooter">'+lockIcon+'<span>'+tr('미클리어 스테이지는 잠금으로 표시됩니다.','Uncleared stages are shown as locked.')+'</span><p id="mcStageNotice" role="status" hidden></p></footer></main>';
  $('mcStagesBack').onclick = selection;
  document.querySelectorAll('.mcStageCard').forEach(button => button.onclick = () => { $('mcStageNotice').hidden=false; $('mcStageNotice').textContent=tr('아직 클리어하지 않은 스테이지입니다.','This stage has not been cleared.'); });
  $('mainCampaignStages').focus({preventScroll:true});
 }
 function close() { leave(); showBattlefield(); }
 const oldScreen = setAppScreen;
 setAppScreen = function(name) {
  if (!['mainIntro','mainCampaign'].includes(name)) leave();
  return oldScreen(name);
 };
 const oldBack = window.terhaBack;
 window.terhaBack = function() {
  if (view === 'intro') return;
  if (view === 'stages') { selection(); return; }
  if (view === 'selection') { close(); return; }
  return oldBack();
 };
 document.addEventListener('keydown', e => {
  if (view === 'stages' && e.key === 'Escape') { e.preventDefault(); selection(); return; }
  if (view !== 'intro') return;
  if (['ArrowLeft','ArrowRight','Enter',' '].includes(e.key) && e.target !== $('mcSkip')) { e.preventDefault(); if (e.key !== 'ArrowLeft') next(); }
 });
 document.addEventListener('visibilitychange', () => { resetClock?.(); });
 return Object.freeze({open, close, getView:()=>view, getPage:()=>page, syncAudio});
})();
window.TerhaMainCampaign = MainCampaign;
