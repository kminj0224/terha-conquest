'use strict';
const rannaTankArt={13:loadBaekArt('ranna-light.png'),1:loadBaekArt('ranna-tank.png'),14:loadBaekArt('ranna-elite.png')};
const rannaTankOriginalCheck=isBaekTank,rannaTankOriginalProfile=baekTankProfile;
isBaekTank=function(u){return u.f===4&&!!rannaTankArt[u.type]||rannaTankOriginalCheck(u)};
baekTankProfile=function(u){if(u.f!==4||!rannaTankArt[u.type])return rannaTankOriginalProfile(u);const art=rannaTankArt[u.type];return{art,image:art.idle,w:1672,h:u.type===13?941:940,mx:1655,my:u.type===13?314:380,yOffset:u.type===13?36*64/1672:0,flip:baekTankFacing(u)!==1}};
Object.assign(window.Terha,{isBaekTank,baekTankProfile});
