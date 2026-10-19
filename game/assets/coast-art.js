'use strict';
// Visual coast assets are generated offline; game logic still uses unchanged hexes.
// Natural shoreline detail is independent from the strategic tile boundary.
const coastArtwork={image:new Image(),ready:false,layer:null};
const coastLandMask={image:new Image(),ready:false};
coastArtwork.image.onload=()=>{coastArtwork.ready=true;coastArtwork.layer=null};
coastArtwork.image.src='coast-natural-overlay.png';
coastLandMask.image.onload=()=>{
 coastLandMask.ready=true;
 territoryDirty=true; // Repaint owner colors clipped to the curved visual shoreline.
 if(typeof groundViewKey!=='undefined')groundViewKey='';
};
coastLandMask.image.src='coast-land-mask.png';
function coastArtworkLayer(){return coastArtwork.ready?coastArtwork.image:null}
function drawCoastArtwork(target,x,y,w,h){const layer=coastArtworkLayer();if(layer)target.drawImage(layer,x,y,w,h)}
Object.assign(window.Terha,{drawCoastArtwork,coastArtworkLayer});
