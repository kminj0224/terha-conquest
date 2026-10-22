'use strict';
// Extend the existing painted sea without recoloring or rescaling the retained map.
const oceanMaterial=loadBaekArt('ocean-material.png');
let oceanPatternCanvas=null,oceanSeamCanvas=null,oceanPatternSource=null;
function oceanTexture(){
 const source=oceanMaterial.idle;
 if(!oceanMaterial.idleReady)return null;
 if(oceanPatternCanvas&&oceanPatternSource===source)return oceanPatternCanvas;
 // Exact source, scale, phase and tint used by tools/bake-aligned-map.cjs.
 const period=930,tile=document.createElement('canvas');tile.width=tile.height=period;
 const g=tile.getContext('2d');g.drawImage(source,0,0,period,period);g.fillStyle='#093a5b55';g.fillRect(0,0,period,period);
 // Only the remote western ocean blends its phase to the east edge of the cylinder.
 // Around the retained map, the painted waves match the original 930-unit pattern.
 const seam=document.createElement('canvas');seam.width=256;seam.height=period;const p=seam.getContext('2d');p.save();p.translate(-WORLD_LEFT-WORLD_WIDTH,0);p.fillStyle=p.createPattern(tile,'repeat');p.fillRect(WORLD_LEFT+WORLD_WIDTH,0,256,period);p.restore();
 const fade=p.createLinearGradient(0,0,256,0);fade.addColorStop(0,'#000');fade.addColorStop(1,'#0000');p.globalCompositeOperation='destination-in';p.fillStyle=fade;p.fillRect(0,0,256,period);
 oceanPatternCanvas=tile;oceanSeamCanvas=seam;oceanPatternSource=source;return tile;
}
function paintOceanSurface(g,l,t,w,h){
 const texture=oceanTexture();if(!texture)return;
 g.save();g.fillStyle=g.createPattern(texture,'repeat');g.fillRect(l,t,w,h);
 if(l<WORLD_LEFT+256&&l+w>WORLD_LEFT)for(let y=Math.floor(t/930);y<=Math.floor((t+h)/930);y++)g.drawImage(oceanSeamCanvas,WORLD_LEFT,y*930);
 g.restore();
}
function drawOceanBackground(g){
 paintOceanSurface(g,cam.x-screenW/2/cam.z-2,cam.y-screenH/2/cam.z-2,screenW/cam.z+4,screenH/cam.z+4);
}
// The minimap describes the expanded ocean, including both sides of its wrap seam.
let oceanMini=null,oceanMiniKey='';
drawMini=function(){
 if($('mini').style.display!=='block')return;
 const m=$('mini');if(m.width!==166)m.width=166;if(m.height!==119)m.height=119;
 const key=[territoryGeneration,coastArtwork.ready,oceanMaterial.idleReady,cities.map(q=>q.tile+':'+q.f).join('|')].join(':');
 if(!oceanMini||oceanMiniKey!==key){refreshTerritory();oceanMiniKey=key;oceanMini??=document.createElement('canvas');oceanMini.width=166;oceanMini.height=119;const g=oceanMini.getContext('2d');g.scale(166/WORLD_WIDTH,119/WORLD_HEIGHT);g.translate(-WORLD_LEFT,-WORLD_TOP);
  // This small surface covers the full world, independent of the current camera.
  const source=coastArtwork.ready&&coastArtwork.natural?coastArtwork.image:worldImg;
  paintOceanSurface(g,WORLD_LEFT,WORLD_TOP,WORLD_WIDTH,WORLD_HEIGHT);if(source.naturalWidth)g.drawImage(source,0,0,WW,HH)
  if(territoryCanvas){g.save();g.globalAlpha=.5;g.drawImage(coastArtwork.natural&&naturalTerritory?naturalTerritory:territoryCanvas,0,0,WW,HH);g.restore()}
  for(const q of cities){const p=pxy(q.tile);g.fillStyle=factions[q.f].color;g.fillRect(p.x,p.y,WORLD_WIDTH/83,WORLD_HEIGHT/60)}
 }
 const g=m.getContext('2d');g.clearRect(0,0,166,119);g.drawImage(oceanMini,0,0);g.strokeStyle='#f3e8bd';g.lineWidth=1;
 const width=screenW/cam.z/WORLD_WIDTH*166,height=screenH/cam.z/WORLD_HEIGHT*119,left=(wrapWorldX(cam.x)-WORLD_LEFT-screenW/2/cam.z)/WORLD_WIDTH*166,top=(cam.y-WORLD_TOP-screenH/2/cam.z)/WORLD_HEIGHT*119;
 for(const shift of [-166,0,166])g.strokeRect(left+shift,top,width,height);
};
$('mini').onclick=e=>{const b=$('mini').getBoundingClientRect();cam.x=WORLD_LEFT+(e.clientX-b.left)/b.width*WORLD_WIDTH;cam.y=WORLD_TOP+(e.clientY-b.top)/b.height*WORLD_HEIGHT};
$('mapbtn').onclick=()=>{$('mini').style.display=$('mini').style.display==='block'?'none':'block';cam.x=WORLD_LEFT+WORLD_WIDTH/2;cam.y=WORLD_TOP+WORLD_HEIGHT/2;cam.z=Math.min(screenW/WORLD_WIDTH,screenH/WORLD_HEIGHT)*.94};
Object.assign(window.Terha,{drawMini,wrapWorldX,drawOceanBackground});
// Every art wrapper receives the same short direction through the world seam.
const oceanBeginAim=beginAim;beginAim=function(u,p,duration){return oceanBeginAim(u,nearWorldPoint(p,pxy(u.tile)),duration)};
const oceanLaunchShot=launchShot;launchShot=function(u,p,...args){return oceanLaunchShot(u,nearWorldPoint(p,pxy(u.tile)),...args)};
const oceanMoveUnit=moveUnit;moveUnit=function(u,i,ai=false){
 if(!tiles[i]||!tiles[u?.tile])return false;
 const from=pxy(u.tile),target=pxy(i),to=nearWorldPoint(target,from),crosses=Math.abs(target.x-from.x)>WORLD_WIDTH/2;
 const ok=oceanMoveUnit(u,i,ai);
 if(ok&&crosses&&Math.abs(to.x-from.x)>.001){const facing=to.x>from.x?1:-1;u.carrierFacing=u.destroyerFacing=u.rifleFacing=u.tankFacing=u.artilleryFacing=u.devilFacing=facing;if(!ai)save()}
 return ok;
};
Object.assign(window.Terha,{beginAim,launchShot,moveUnit});
