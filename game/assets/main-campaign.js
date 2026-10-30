'use strict';
const MainCampaign = (() => {
 let page = 0, frame = 0, root = null, view = 'closed';
 const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; }
 function leave() { stop(); root = null; view = 'closed'; }
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
  const line = MAIN_CAMPAIGN_INTRO[page];
  $('modal').innerHTML = '<section id="mainIntro" class="mcIntro mc-'+line.layout+'" tabindex="-1" aria-label="메인 캠페인 서막">'+
   (line.image?'<img class="mcImage" src="'+line.image+'" alt="">':'')+
   '<button id="mcSkip" class="mcSkip" aria-label="서막 건너뛰기">Skip</button>'+
   '<div class="mcTextArea"><div class="mcText" aria-label="'+esc(line.text)+'"><span class="mcMeasure" aria-hidden="true">'+esc(line.text)+'</span><span id="mcVisible" aria-hidden="true"></span></div></div>'+
   '<nav class="mcNavigation" aria-label="서막 페이지"><button id="mcPrev" aria-label="이전 페이지" '+(page===0?'disabled':'')+'>&lt;</button><span id="mcPage" aria-live="polite">'+(page+1)+' / '+MAIN_CAMPAIGN_INTRO.length+'</span><button id="mcNext" aria-label="다음 페이지">&gt;</button></nav></section>';
  root = $('mainIntro');
  root.onclick = e => { if (!e.target.closest('button')) next(); };
  $('mcPrev').onclick = previous;
  $('mcNext').onclick = next;
  $('mcSkip').onclick = selection;
  const visible = $('mcVisible');
  if (line.layout === 'center') visible.textContent = line.text;
  else {
   // Reserve the full paragraph's layout so typing never shifts the banner.
   const characters = Array.from(line.text), start = performance.now();
   const type = now => {
    if (view !== 'intro' || !visible.isConnected) { frame = 0; return; }
    const count = Math.min(characters.length, Math.floor((now-start)/14));
    visible.textContent = characters.slice(0, count).join('');
    frame = count < characters.length ? requestAnimationFrame(type) : 0;
   };
   frame = requestAnimationFrame(type);
  }
  root.focus?.({preventScroll:true});
 }
 function next() { if (view !== 'intro') return; if (page+1 === MAIN_CAMPAIGN_INTRO.length) selection(); else { page++; render(); } }
 function previous() { if (view === 'intro' && page > 0) { page--; render(); } }
 function selection() {
  stop(); root = null; view = 'selection'; setAppScreen('mainCampaign');
  $('modal').innerHTML = '<section class="mcSelection" id="mainCampaignSelection"><header><button id="mcBack" aria-label="뒤로">‹</button><h1>'+tr('메인 캠페인 선택','MAIN CAMPAIGN')+'</h1><button id="mcReplay">'+tr('서막 다시 보기','REPLAY INTRO')+'</button></header><div class="mcCampaignGrid"><button id="mcWar" class="mcCampaignCard" aria-pressed="false"><img src="main-campaign-intro.jpg" alt=""><span><small>MAIN CAMPAIGN</small><strong>2차 선석전쟁</strong></span></button></div><div id="mcCampaignDetails" hidden><h2>2차 선석전쟁</h2><p>후피왕의 피라미드에 봉인된 선석을 둘러싸고, 단테 제국과 아이리아 제국, 스테토피아연합왕국이 전쟁에 돌입한다.</p><button disabled>임무 준비 중</button></div></section>';
  $('mcBack').onclick = close;
  $('mcReplay').onclick = open;
  $('mcWar').onclick = () => { $('mcCampaignDetails').hidden = false; $('mcWar').setAttribute('aria-pressed','true'); };
 }
 function close() { leave(); showBattlefield(); }
 const oldScreen = setAppScreen;
 setAppScreen = function(name) {
  if (!['mainIntro','mainCampaign'].includes(name)) leave();
  return oldScreen(name);
 };
 const oldBack = window.terhaBack;
 window.terhaBack = function() {
  if (view === 'intro') { if (page>0) previous(); else close(); return; }
  if (view === 'selection') { close(); return; }
  return oldBack();
 };
 document.addEventListener('keydown', e => {
  if (view !== 'intro') return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); previous(); }
  else if (e.key === 'ArrowRight' || (['Enter',' '].includes(e.key) && e.target === root)) { e.preventDefault(); next(); }
 });
 return Object.freeze({open, close, getView:()=>view, getPage:()=>page});
})();
window.TerhaMainCampaign = MainCampaign;
