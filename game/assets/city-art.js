'use strict';
// City culture follows its founding nation; the flag follows current ownership.
const baekCityArt={capital:loadBaekArt('baek-city-hansa.png'),5:loadBaekArt('baek-city-5.png'),4:loadBaekArt('baek-city-4.png'),3:loadBaekArt('baek-city-3.png'),2:loadBaekArt('baek-city-small.png')};
const BAEK_CITY_CROPS={capital:[23,58,1344,1007],5:[15,11,1496,1013],4:[119,176,1285,792],3:[139,125,1276,759],2:[181,149,1228,711]};
function baekCityProfile(q){const level=Math.max(1,Math.min(5,q.level)),key=q.capital?'capital':level<=2?2:level;return{key,art:baekCityArt[key],crop:BAEK_CITY_CROPS[key],width:(q.capital?86:[0,50,56*1.15,62*1.15,70,78][level])*1.15}}
function baekCityBox(q){const a=baekCityProfile(q),h=a.width*a.crop[3]/a.crop[2];return{x:-a.width/2,y:10-h,w:a.width,h,bottom:10}}
const stetopiaCityArt={capital:loadBaekArt('stetopia-city-capital.png'),5:loadBaekArt('stetopia-city-5.png'),4:loadBaekArt('stetopia-city-4.png'),mid:loadBaekArt('stetopia-city-mid.png'),1:loadBaekArt('stetopia-city-1.png')};
function stetopiaCityProfile(q){const level=Math.max(1,Math.min(5,q.level)),key=q.capital?'capital':level>=4?level:level>=2?'mid':1;return{key,art:stetopiaCityArt[key],crop:[0,0,1536,1024],width:(q.capital?86:[0,50,56*1.15,62*1.15*1.10,70,78][level])*1.15}}
function photoCityProfile(q){return q.origin===0?baekCityProfile(q):q.origin===2?stetopiaCityProfile(q):null}
function photoCityBox(q){const a=photoCityProfile(q),h=a.width*a.crop[3]/a.crop[2];return{x:-a.width/2,y:10-h,w:a.width,h,bottom:10}}
const cityArtBuildingLayout=cityBuildingLayout;cityBuildingLayout=function(q){const layout=cityArtBuildingLayout(q);if(!photoCityProfile(q))return layout;const box=photoCityBox(q);return{...layout,top:box.y,starY:box.y-3}};
const cityArtSprite=citySprite;citySprite=function(q,p){const a=photoCityProfile(q);if(!a)return cityArtSprite(q,p);if(!a.art.idleReady)return cityArtSprite(q,p);const box=photoCityBox(q);ctx.save();ctx.translate(p.x,p.y);ctx.drawImage(a.art.idle,...a.crop,box.x,box.y,box.w,box.h);if(q.airport)drawAirport();if(cam.z>.45){ctx.font='bold 11px Terha,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#153039';const stars='★'.repeat(q.level),starY=box.y-3;ctx.strokeText(stars,0,starY);ctx.fillStyle='#f6d483';ctx.fillText(stars,0,starY);}if(q.aa){rect(-31,-13,9,6,'#687d75');line(-28,-14,-21,-22,'#dde3c2',2)}if(q.lab){rect(box.w/2+3,-27,12,20,'#92b6bb');circle(box.w/2+9,-28,7,'#cae0d8')}if(q.harbor)line(-30,12,24,12,'#a7b8b3',2);if(q.launcher){rect(box.w/2,-4,18,6,'#63736b');line(box.w/2+7,-5,box.w/2+16,-23,'#c9d3c1',4)}ctx.restore();drawCityFire(q,p,lastTime)};
Object.assign(window.Terha,{baekCityProfile,baekCityBox,stetopiaCityProfile,photoCityProfile,photoCityBox,cityBuildingLayout});

