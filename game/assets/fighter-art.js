'use strict';
const baekFighterArt=loadBaekArt('baek-fighter.png');
const fighterMissionDrawing=drawMissionAircraft;drawMissionAircraft=function(e,t){if(e.f!==0||e.type!=='fighter'||!baekFighterArt.idleReady)return fighterMissionDrawing(e,t);const fraction=t<.56?t/.56:(1-t)/.44,x=e.x+(e.tx-e.x)*fraction,y=e.y+(e.ty-e.y)*fraction-35-25*Math.sin(fraction*Math.PI),angle=Math.atan2(e.ty-e.y,e.tx-e.x)+(t>=.56?Math.PI:0);ctx.save();ctx.translate(x,y);ctx.rotate(angle+Math.PI);const w=90,h=w*1024/1536;ctx.drawImage(baekFighterArt.idle,-w/2,-h/2,w,h);ctx.restore()};
