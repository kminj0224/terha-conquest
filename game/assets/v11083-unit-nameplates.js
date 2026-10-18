'use strict';
// v1.10.83: consistent foremost unit nameplates, directly above HP bars.
const fuelBadgeArt=new Image();
let fuelBadgeReady=false;
fuelBadgeArt.onload=()=>{fuelBadgeReady=true};
fuelBadgeArt.src='fuel-efficiency-icon.webp';
if(fuelBadgeArt.complete&&fuelBadgeArt.naturalWidth>0)fuelBadgeReady=true;

// Legacy sprites render names inside their drawing order, which lets the
// next unit's body obscure them. Suppress only those duplicate name strings.
// Other scene labels, city names, damage values and HP bars remain untouched.
let unitNameBeingDrawn=null;
const originalUnitNameFill=ctx.fillText.bind(ctx);
const originalUnitNameStroke=ctx.strokeText.bind(ctx);
function isLegacyUnitName(text){
 return unitNameBeingDrawn&&String(text)===TYPES[unitNameBeingDrawn.type].name+' '+unitNameBeingDrawn.level;
}
ctx.fillText=function(text,...rest){
 if(isLegacyUnitName(text))return;
 return originalUnitNameFill(text,...rest);
};
ctx.strokeText=function(text,...rest){
 if(isLegacyUnitName(text))return;
 return originalUnitNameStroke(text,...rest);
};
const unitNameSprite=sprite;
sprite=function(u,p,now){
 const prev=unitNameBeingDrawn;
 unitNameBeingDrawn=u;
 try{return unitNameSprite(u,p,now)}
 finally{unitNameBeingDrawn=prev}
};
function drawUnitNameOverlays(visibleUnits,now){
 if(cam.z<=.55)return;
 ctx.save();
 ctx.globalAlpha=1;
 ctx.font='bold 9px Terha,sans-serif';
 ctx.textAlign='left';
 ctx.textBaseline='alphabetic';
 ctx.lineJoin='round';
 ctx.lineWidth=2.5;
 ctx.strokeStyle='#10222b';
 ctx.fillStyle='#eee7d2';
 for(const u of visibleUnits){
  if(!u||u.hp<=0||u.carriedBy)continue;
  const p=unitVisualPosition(u,now);
  // Body origin is p.y-3, original HP meter starts at local y=21.
  // Baseline 14 pixels below the anchor: 4 px above the meter.
  const baseline=p.y+14;
  const label=TYPES[u.type].name+' '+u.level;
  const width=ctx.measureText?ctx.measureText(label).width:label.length*5.5;
  const mark=!!u.fuelEfficient;
  const size=10,gap=2;
  const groupWidth=width+(mark?size+gap:0);
  const left=p.x-groupWidth/2;
  ctx.strokeText(label,left,baseline);
  ctx.fillText(label,left,baseline);
  if(mark&&fuelBadgeReady&&fuelBadgeArt.naturalWidth>0){
   ctx.drawImage(fuelBadgeArt,left+width+gap,baseline-9,size,size);
  }
 }
 ctx.restore();
}
Object.assign(window.Terha,{drawUnitNameOverlays,fuelBadgeArt});
