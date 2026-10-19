'use strict';
// Coastline and surf are now pigments baked *inside* world-painted.png.
// Do not paint the old glowing white coast-overlay over the new shoreline.
const coastArtwork={image:null,ready:true,layer:null};
function coastArtworkLayer(){return null}
function drawCoastArtwork(){/* Coastline exists in world-painted.png. */}
Object.assign(window.Terha,{drawCoastArtwork,coastArtworkLayer});
