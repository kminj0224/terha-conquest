'use strict';
const HEAVY_UNIT_VISUAL_SCALE=1.4;
function largeUnitVisual(u){return ['armor','artillery'].includes(TYPES[u.type]?.branch)}
function beginLargeUnitBody(u,bottom=14){ctx.save();if(largeUnitVisual(u)){ctx.translate(0,bottom);ctx.scale(HEAVY_UNIT_VISUAL_SCALE,HEAVY_UNIT_VISUAL_SCALE);ctx.translate(0,-bottom)}}
function endLargeUnitBody(){ctx.restore()}
function scaleUnitMuzzle(u,p,m,bottom=14){if(!largeUnitVisual(u))return m;const y=p.y-3+bottom;return{x:p.x+(m.x-p.x)*HEAVY_UNIT_VISUAL_SCALE,y:y+(m.y-y)*HEAVY_UNIT_VISUAL_SCALE}}
const visualBaekTankMuzzle=baekTankMuzzle;baekTankMuzzle=function(u,p,now){return scaleUnitMuzzle(u,p,visualBaekTankMuzzle(u,p,now))};
const visualDanteTankMuzzle=danteTankMuzzle;danteTankMuzzle=function(u,p){return scaleUnitMuzzle(u,p,visualDanteTankMuzzle(u,p))};
const visualStetopiaTankMuzzle=stetopiaTankMuzzle;stetopiaTankMuzzle=function(u,p){return scaleUnitMuzzle(u,p,visualStetopiaTankMuzzle(u,p))};
const visualArtilleryMuzzle=baekArtilleryMuzzle;baekArtilleryMuzzle=function(u,p){return scaleUnitMuzzle(u,p,visualArtilleryMuzzle(u,p))};
const visualDevilMuzzle=devilRiderMuzzle;devilRiderMuzzle=function(u,p){return scaleUnitMuzzle(u,p,visualDevilMuzzle(u,p),20)};
const visualLaunch=launchShot;launchShot=function(u,target,start=performance.now(),duration=520){const previous=fx.length,m=visualLaunch(u,target,start,duration);if(!largeUnitVisual(u)||isBaekTank(u)||isDanteTank(u)||isStetopiaTank(u)||isBaekArtillery(u)||isDevilRider(u))return m;const p=pxy(u.tile);for(const e of fx.slice(previous)){if(['shot','laser','doctrine'].includes(e.kind)){const from=scaleUnitMuzzle(u,p,{x:e.x,y:e.y});e.x=from.x;e.y=from.y}}return scaleUnitMuzzle(u,p,m)};
function unitVisualPosition(u,now){const m=movingAnimation(u.id);if(!m)return pxy(u.tile);const t=Math.max(0,Math.min(1,(now-m.start)/m.duration));return{x:m.from.x+(m.to.x-m.from.x)*t,y:m.from.y+(m.to.y-m.from.y)*t}}
function compareUnitDepth(a,b,now){const p=unitVisualPosition(a,now),q=unitVisualPosition(b,now);return p.y-q.y||p.x-q.x||a.id-b.id}
Object.assign(window.Terha,{largeUnitVisual,unitVisualPosition,compareUnitDepth,baekTankMuzzle,danteTankMuzzle,stetopiaTankMuzzle,baekArtilleryMuzzle,devilRiderMuzzle});
