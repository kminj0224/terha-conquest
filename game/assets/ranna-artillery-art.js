'use strict';
// Retain the supplied transparent images; only their visible bounds are cropped.
const rannaSPArt=loadBaekArt('ranna-sp-idle.png','ranna-sp-fire.png');
const rannaMLArt=loadBaekArt('ranna-ml-idle.png','ranna-ml-fire.png');
const rannaArtilleryCheck=isBaekArtillery,rannaArtilleryProfile=baekArtilleryProfile;
isBaekArtillery=function(u){return u.f===4&&[2,3].includes(u.type)||rannaArtilleryCheck(u)};
baekArtilleryProfile=function(u,firing=false){
 if(u.f!==4||![2,3].includes(u.type))return rannaArtilleryProfile(u,firing);
 if(u.type===3)return{art:rannaMLArt,w:firing?940:1672,h:firing?746:940,mx:478,my:55,baseFacing:1};
 return{art:rannaSPArt,w:firing?1636:1885,h:firing?927:782,mx:92,my:40,baseFacing:-1,flashAngle:.4};
};
Object.assign(window.Terha,{isBaekArtillery,baekArtilleryProfile});
