'use strict';
// A single painted surface contains shore foam, vegetation and riverbanks.
// Keep the original coastline artwork as a fallback if decoding fails.
const coastArtwork={image:new Image(),ready:false,layer:null,natural:true,mask:new Image(),maskReady:false};
coastArtwork.mask.onload=()=>{coastArtwork.maskReady=true;groundViewKey=''};coastArtwork.mask.src='world-natural-land.png';
coastArtwork.image.onload=()=>{coastArtwork.ready=true;coastArtwork.layer=null;groundViewKey=''};
coastArtwork.image.onerror=()=>{if(coastArtwork.natural){coastArtwork.natural=false;coastArtwork.image.src='coast-overlay.png'}};
coastArtwork.image.src='world-natural.png';
function coastArtworkLayer(){return coastArtwork.ready?coastArtwork.image:null}
function drawCoastArtwork(target,x,y,w,h){const layer=coastArtworkLayer();if(layer)target.drawImage(layer,x,y,w,h)}
Object.assign(window.Terha,{drawCoastArtwork,coastArtworkLayer});
