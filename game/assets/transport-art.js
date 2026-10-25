'use strict';
const transportShipArt=factions.map((_,f)=>loadBaekArt(f?'transport-ship-'+f+'.png':'transport-ship.png'));
function transportShipFacing(u){return Number.isFinite(u.angle)&&Math.cos(u.angle)<0?-1:1}
function paintTransportShip(u,bottom=14,width=110*NAVAL_VISUAL_SCALE){
 const art=transportShipArt[u.f];if(!art?.idleReady)return false;
 const image=art.idle,height=width*image.naturalHeight/image.naturalWidth;
 ctx.save();ctx.scale(transportShipFacing(u),1);
 ctx.drawImage(image,-width/2,bottom-height,width,height);ctx.restore();return true;
}
const transportArtSprite=sprite;
sprite=function(u,p,now){
 if(u.type!==26||!transportShipArt[u.f]?.idleReady)return transportArtSprite(u,p,now);
 p=unitVisualPosition(u,now);
 ctx.save();ctx.translate(p.x,p.y-3);ctx.globalAlpha=1;
 ctx.fillStyle='#061c2866';ctx.beginPath();ctx.ellipse(0,12,51*NAVAL_VISUAL_SCALE,7*NAVAL_VISUAL_SCALE,0,0,Math.PI*2);ctx.fill();
 paintTransportShip(u);
 if(cam.z>.55){rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}
 ctx.restore();
};
// Sinking effects also use the same supplied ship, with the caller's opacity intact.
const transportArtDrawShip=drawShip;
drawShip=function(u,angle,shotT){if(u.type!==26||!paintTransportShip(u,15))return transportArtDrawShip(u,angle,shotT)};
Object.assign(window.Terha,{transportShipArt,transportShipFacing,paintTransportShip,sprite,drawShip});
