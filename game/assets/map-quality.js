'use strict';
// Baking the full-world color and surf pass avoids expensive WebView pixel reads.
const naturalWaterArt=new Image();
naturalWaterArt.src='world-water-detail.png';
function paintMapAtmosphere(g){
 if(!naturalWaterArt.complete||!naturalWaterArt.naturalWidth)return;
 g.save();g.imageSmoothingEnabled=true;
 g.drawImage(naturalWaterArt,0,0,WW,HH);g.restore();
}
// River finish follows the existing drainage network, never a tile boundary.
function paintMapRiverFinish(g){
 if(typeof paintRiverReaches!=='function')return;
 g.save();paintRiverReaches(g,false,1);g.restore();
}
Object.assign(window.Terha,{paintMapAtmosphere,paintMapRiverFinish});
