'use strict';
// Action availability is cached between state changes, never searched per frame.
let actionVisualRevision=0;
const actionVisualCache=new WeakMap();
function invalidateActionVisuals(){actionVisualRevision++}
for(const name of ['updateHUD','refreshSelection','kill','declareWar']){
 const original=window[name];if(typeof original!=='function')continue;
 window[name]=function(...args){invalidateActionVisuals();return original(...args)};
}
const actionHasAttackTarget=hasAttackTarget;
hasAttackTarget=function(u){return actionHasAttackTarget(u)||mayFire(u)&&missileBases.some(b=>canAttackDefense(u,b))};
unitActionReady=function(u){
 if(u.f!==player||u.hp<=0||u.carriedBy)return false;
 const key=[actionVisualRevision,turn,player,u.tile,u.hp,u.moveAllowed,u.moved,u.attackReady,u.carrierShots,oil[u.f]].join(':');
 const old=actionVisualCache.get(u);if(old?.key===key)return old.ready;
 const ready=mayMove(u)&&Array.from(reachable(u).costs.keys()).some(i=>i!==u.tile)||hasAttackTarget(u)||mayMove(u)&&boardableShips(u).length>0||u.type===26&&cargoUnits(u).some(v=>landingTiles(u,v).length>0);
 actionVisualCache.set(u,{key,ready:!!ready});return !!ready;
};
drawReadyTile=function(u,p,now){
 if(busy||menuMode||!unitActionReady(u))return;
 const pulse=.5+.5*Math.sin(now*.005+u.id*.27),naval=isNaval(u);
 ctx.save();ctx.globalAlpha=1;hex(p,32);
 ctx.fillStyle=naval?'rgba(124,219,237,'+(.07+.27*pulse)+')':'rgba(154,236,139,'+(.07+.27*pulse)+')';ctx.fill();
 ctx.strokeStyle=naval?'rgba(168,234,246,'+(.25+.60*pulse)+')':'rgba(200,255,180,'+(.25+.60*pulse)+')';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
};
function drawAttackTargetTile(i){ctx.save();hex(pxy(i),32);ctx.fillStyle='#ef866522';ctx.fill();ctx.strokeStyle='#ff7d66';ctx.lineWidth=2.5;ctx.stroke();ctx.restore()}
Object.assign(window.Terha,{unitActionReady,drawReadyTile});
