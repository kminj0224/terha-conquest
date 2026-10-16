'use strict';
let aiTurnActive=false,aiFastForward=false;
const aiAnimationWaits=new Map();
function skipAIAnimations(){return aiTurnActive&&aiFastForward}
function clearAIAnimations(){fx=[];moving=[];aimMotions.clear();fireMotions.clear();}
const aiOriginalDelay=delay;delay=function(ms){if(!aiTurnActive)return aiOriginalDelay(ms);return new Promise(resolve=>{let timer;const finish=()=>{aiAnimationWaits.delete(timer);resolve()};timer=setTimeout(finish,skipAIAnimations()?0:ms);aiAnimationWaits.set(timer,finish)})};
function enableAIFastForward(){if(!aiTurnActive||aiFastForward)return false;aiFastForward=true;clearAIAnimations();for(const [timer,finish]of [...aiAnimationWaits]){clearTimeout(timer);finish()}updateHUD();return true}
const aiFastHUD=updateHUD;updateHUD=function(){aiFastHUD();const b=$('aiFastForward');b.style.display=aiTurnActive?'block':'none';b.disabled=aiFastForward;b.textContent='⏩';b.setAttribute?.('aria-pressed',String(aiFastForward));if(aiTurnActive)$('turn').textContent=aiFastForward?'턴 진행중 · 빠르게':'턴 진행중'};
const aiFastLaunch=launchShot;launchShot=function(u,target,start=performance.now(),duration=520){return skipAIAnimations()?pxy(u.tile):aiFastLaunch(u,target,start,duration)};
const aiFastAim=beginAim;beginAim=function(u,target,duration){if(!skipAIAnimations())return aiFastAim(u,target,duration);const from=pxy(u.tile);u.angle=Math.atan2(target.y-from.y,target.x-from.x);if(typeof faceStetopiaTank==='function')faceStetopiaTank(u,from,target);if(typeof faceBaekDestroyer==='function')faceBaekDestroyer(u,from,target);if(typeof faceBaekCarrier==='function')faceBaekCarrier(u,from,target);if(typeof faceDevilRider==='function')faceDevilRider(u,from,target);if(typeof faceBaekRifle==='function')faceBaekRifle(u,from,target);if(typeof faceBaekArtillery==='function')faceBaekArtillery(u,from,target);if(typeof faceBaekTank==='function')faceBaekTank(u,from,target)};
const aiFastImpact=targetExplosions;targetExplosions=function(...args){if(!skipAIAnimations())return aiFastImpact(...args)};
const aiFastAudio=audioShot;audioShot=function(...args){if(!skipAIAnimations())return aiFastAudio(...args)};
const aiFastMove=moveUnit;moveUnit=function(...args){const result=aiFastMove(...args);if(skipAIAnimations())clearAIAnimations();return result};
const aiFastKill=kill;kill=function(...args){const result=aiFastKill(...args);if(skipAIAnimations())clearAIAnimations();return result};
const aiFastEndTurn=endTurn;endTurn=async function(){if(busy||!started||aiTurnActive)return;aiTurnActive=true;aiFastForward=false;updateHUD();try{return await aiFastEndTurn()}finally{clearAIAnimations();aiTurnActive=false;aiFastForward=false;for(const [timer,finish]of [...aiAnimationWaits]){clearTimeout(timer);finish()}updateHUD()}};
$('turn').onclick=endTurn;$('aiFastForward').onclick=enableAIFastForward;
Object.assign(window.Terha,{endTurn,moveUnit,enableAIFastForward,skipAIAnimations});
