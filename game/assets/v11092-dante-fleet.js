'use strict';
// Dante's three custom hulls. Match existing fleet widths, preserve artwork
// aspect ratio, and keep the bottom of every silhouette at the waterline.
const danteFleetArt={
 25:loadBaekArt('dante-carrier.webp'),
 24:loadBaekArt('dante-destroyer.webp'),
 23:loadBaekArt('dante-frigate.webp')
};
const DANTE_FLEET_WIDTH={
 25:132*NAVAL_VISUAL_SCALE/.9,
 24:110*NAVAL_VISUAL_SCALE/.9,
 23:110*NAVAL_VISUAL_SCALE/.9
};
const DANTE_ART_ASPECT={
 25:89/400,
 24:143/400,
 23:130/400
};
function isDanteFleetArtwork(u){return u?.f===1&&!!DANTE_FLEET_WIDTH[u.type]}
function danteShipFacing(u){
 return u.danteShipFacing===-1?-1:u.danteShipFacing===1?1:
 Number.isFinite(u.angle)&&Math.cos(u.angle)<0?-1:1;
}
function faceDanteShip(u,from,to){
 if(isDanteFleetArtwork(u)&&Math.abs(to.x-from.x)>.001)
  u.danteShipFacing=to.x>from.x?1:-1;
}
const beforeDanteShipAim=beginAim;
beginAim=function(u,target,duration){
 faceDanteShip(u,pxy(u.tile),target);
 return beforeDanteShipAim(u,target,duration);
};
const beforeDanteShipMove=moveUnit;
moveUnit=function(u,i,ai=false){
 const from=pxy(u.tile),ok=beforeDanteShipMove(u,i,ai);
 if(ok&&isDanteFleetArtwork(u))faceDanteShip(u,from,pxy(i));
 return ok;
};
const beforeDanteShipDraw=drawShip;
drawShip=function(u,angle,shotT){
 if(!isDanteFleetArtwork(u)||!danteFleetArt[u.type].idleReady)
  return beforeDanteShipDraw(u,angle,shotT);
 const art=danteFleetArt[u.type].idle;
 const width=DANTE_FLEET_WIDTH[u.type],height=width*DANTE_ART_ASPECT[u.type];
 // Provided carrier faces left; the other two originals face right.
 const sourceFacing=u.type===25?-1:1;
 const flip=danteShipFacing(u)===sourceFacing?1:-1;
 ctx.save();
 ctx.scale(flip,1);
 ctx.drawImage(art,-width/2,15-height,width,height);
 ctx.restore();
};
Object.assign(window.Terha,{danteFleetArt,DANTE_FLEET_WIDTH,isDanteFleetArtwork,danteShipFacing});
