'use strict';
// Four offline baked painterly map layers; game tiles remain logically hexagonal.
// Load independently: slow Android bitmap decoding must never block UI.
const coastArtwork={image:new Image(),ready:false,layer:null};
const coastSurface={image:new Image(),ready:false};
const coastLandMask={image:new Image(),ready:false};
function naturalGroundInvalidate(){if(typeof groundViewKey!=='undefined')groundViewKey=''}
coastArtwork.image.onload=()=>{coastArtwork.ready=true;naturalGroundInvalidate()};
coastArtwork.image.src='coast-natural-overlay.png';
coastSurface.image.onload=()=>{coastSurface.ready=true;naturalGroundInvalidate()};
coastSurface.image.src='world-surface-detail.png';
coastLandMask.image.onload=()=>{coastLandMask.ready=true;territoryDirty=true;naturalGroundInvalidate()};
coastLandMask.image.src='coast-land-mask.png';
function coastArtworkLayer(){return coastArtwork.ready?coastArtwork.image:null}
function drawCoastArtwork(target,x,y,w,h){
 if(coastSurface.ready){target.save();target.globalCompositeOperation='soft-light';target.drawImage(coastSurface.image,x,y,w,h);target.restore()}
 if(coastArtwork.ready)target.drawImage(coastArtwork.image,x,y,w,h)
}
Object.assign(window.Terha,{drawCoastArtwork,coastArtworkLayer});
