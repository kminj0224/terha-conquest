'use strict';
// Extend the existing painted sea without recoloring or rescaling the retained map.
let oceanPatternCanvas=null,oceanPatternSource=null;
function oceanTexture(source){
 if(oceanPatternCanvas&&oceanPatternSource===source)return oceanPatternCanvas;
 const tile=document.createElement('canvas');tile.width=tile.height=512;
 const g=tile.getContext('2d'),sw=source.naturalWidth*256/WW,sh=source.naturalHeight*256/HH;
 // The northwest corner is open water. Mirrored quadrants make every repeat continuous.
 for(let y=0;y<2;y++)for(let x=0;x<2;x++){g.save();g.translate(x?512:0,y?512:0);g.scale(x?-1:1,y?-1:1);g.drawImage(source,0,0,sw,sh,0,0,256,256);g.restore()}
 oceanPatternCanvas=tile;oceanPatternSource=source;return tile;
}
function drawOceanBackground(g){
 const source=coastArtwork.ready&&coastArtwork.natural?coastArtwork.image:worldImg;
 const l=cam.x-screenW/2/cam.z-2,t=cam.y-screenH/2/cam.z-2,w=screenW/cam.z+4,h=screenH/cam.z+4;
 if(!source.naturalWidth)return;
 g.save();g.fillStyle=g.createPattern(oceanTexture(source),'repeat');g.fillRect(l,t,w,h);
 // Continue each exact edge outward, then feather it into the same illustrated water.
 // The first strip is opaque at the join. No land pixels are sampled from the interior.
 const sw=source.naturalWidth,sh=source.naturalHeight,fade=128,step=4;
 for(let d=fade-step;d>=0;d-=step){const a=d/fade;g.globalAlpha=1-a*a*(3-2*a);
  if(l<0)g.drawImage(source,0,0,1,sh,-d-step,0,step,HH);
  if(l+w>WW)g.drawImage(source,sw-1,0,1,sh,WW+d,0,step,HH);
  if(t<0)g.drawImage(source,0,0,sw,1,0,-d-step,WW,step);
  if(t+h>HH)g.drawImage(source,0,sh-1,sw,1,0,HH+d,WW,step);
 }
 g.restore();
}
// The minimap describes the expanded ocean, including both sides of its wrap seam.
let oceanMini=null,oceanMiniKey='';
drawMini=function(){
 if($('mini').style.display!=='block')return;
 const m=$('mini');if(m.width!==166)m.width=166;if(m.height!==119)m.height=119;
 const key=[territoryGeneration,coastArtwork.ready,cities.map(q=>q.tile+':'+q.f).join('|')].join(':');
 if(!oceanMini||oceanMiniKey!==key){refreshTerritory();oceanMiniKey=key;oceanMini??=document.createElement('canvas');oceanMini.width=166;oceanMini.height=119;const g=oceanMini.getContext('2d');g.scale(166/WORLD_WIDTH,119/WORLD_HEIGHT);g.translate(-WORLD_LEFT,-WORLD_TOP);
  // This small surface covers the full world, independent of the current camera.
  const source=coastArtwork.ready&&coastArtwork.natural?coastArtwork.image:worldImg;
  if(source.naturalWidth){g.fillStyle=g.createPattern(oceanTexture(source),'repeat');g.fillRect(WORLD_LEFT,WORLD_TOP,WORLD_WIDTH,WORLD_HEIGHT);g.drawImage(source,0,0,WW,HH)}
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
