'use strict';
const APP_BACKGROUND_KEY='terha-background-session';
function rememberBackgroundSession(){
 if(campaignLoading)return;
 if(started&&!busy)save();
 try{localStorage.setItem(APP_BACKGROUND_KEY,JSON.stringify({screen:appScreen,back:appReturn,started,at:Date.now()}))}catch{}
}
window.terhaBackground=function(){rememberBackgroundSession();applyAppAudio()};
window.terhaForeground=function(){applyAppAudio()};
document.addEventListener('visibilitychange',()=>{if(document.hidden)rememberBackgroundSession();else window.terhaForeground()});
window.addEventListener('pagehide',rememberBackgroundSession);
async function restoreBackgroundSession(){
 const session=readAppJSON(APP_BACKGROUND_KEY,null);if(!session)return false;
 if(session.started&&readSave()){
  if(!await load())return false;
  if(session.screen==='menu')showMenu();
  else if(session.screen==='settings')showSettings(session.back||'hub');
  else if(session.screen==='help')showHelp(session.back);
  else if(session.screen==='slots')showSaveSlots(session.back);
  else if(session.screen==='hub')showHub();
  else if(session.screen==='title')showTitle();
  else if(session.screen==='country')showStart();
  else if(session.screen==='records')showRecords();
 }else if(session.screen==='settings')showSettings(session.back||'hub');
 else if(session.screen==='help')showHelp(session.back||'hub');
 else if(session.screen==='slots')showSaveSlots(session.back||'country');
 else returnAppScreen(session.screen);
 return true;
}
// Only Android's saved-instance recreation uses this marker. A fresh launch still starts at START.
function resumeRecreatedActivity(){if(window.location?.hash==='#resume')return restoreBackgroundSession();return Promise.resolve(false)}
