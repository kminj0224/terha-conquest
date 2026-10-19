'use strict';
// Geographic shoreline alpha is precomputed; no hexagon mask is painted here.
const coastArtwork={image:new Image(),ready:false,layer:null};
coastArtwork.image.onload=()=>{coastArtwork.ready=true;coastArtwork.layer=null};coastArtwork.image.src='coast-overlay.png';
function coastArtworkLayer(){return coastArtwork.ready?coastArtwork.image:null}
function drawCoastArtwork(target,x,y,w,h){const layer=coastArtworkLayer();if(layer)target.drawImage(layer,x,y,w,h)}
Object.assign(window.Terha,{drawCoastArtwork,coastArtworkLayer});
