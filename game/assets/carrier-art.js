
'use strict';
// The supplied carrier faces left. Preserve the existing ship scale and labels.
const stetopiaCarrierArt=loadBaekArt('stetopia-carrier.png');
function isStetopiaCarrier(u){return u.f===2&&u.type===25}
function stetopiaCarrierFacing(u){return u.carrierFacing===-1?-1:u.carrierFacing===1?1:Number.isFinite(u.angle)&&Math.cos(u.angle)<0?-1:1}
function faceStetopiaCarrier(u,from,to){if(isStetopiaCarrier(u)&&Math.abs(to.x-from.x)>.001)u.carrierFacing=to.x>from.x?1:-1}
const stetopiaCarrierOriginalAim=beginAim;beginAim=function(u,p,d){faceStetopiaCarrier(u,pxy(u.tile),p);return stetopiaCarrierOriginalAim(u,p,d)};
const stetopiaCarrierOriginalMove=moveUnit;moveUnit=function(u,i,ai=false){const from=pxy(u.tile),ok=stetopiaCarrierOriginalMove(u,i,ai);if(ok&&isStetopiaCarrier(u)){faceStetopiaCarrier(u,from,pxy(i));if(!ai)save()}return ok};
const stetopiaCarrierOriginalDrawing=drawShip;drawShip=function(u,angle,shotT){
 if(!isStetopiaCarrier(u)||!stetopiaCarrierArt.idleReady)return stetopiaCarrierOriginalDrawing(u,angle,shotT);
 const w=101*NAVAL_VISUAL_SCALE*1.45,h=w*724/2172;
 ctx.save();ctx.scale(-stetopiaCarrierFacing(u),1);ctx.drawImage(stetopiaCarrierArt.idle,-w/2,15-h,w,h);ctx.restore();
};
Object.assign(window.Terha,{moveUnit,isStetopiaCarrier,stetopiaCarrierFacing,faceStetopiaCarrier});
