'use strict';
// Each flag shares its owner’s depth and is painted immediately before its body.
function drawNationalityFlag(item){const e=item.entity;if(!e)return;let x,y,w,h,bottom,offset=0;
  if(item.kind==='unit'){if(cam.z<=.55)return;x=-33;y=-24;w=15;h=10;bottom=10;offset=-3}
  else if(item.kind==='city'){if(cam.z<=.38)return;const art=photoCityProfile(e);x=art&&art.art.idleReady?photoCityBox(e).x-14:-43;y=-18;w=18;h=12;bottom=7}
  else if(item.kind==='defense'){x=-38;y=-26;w=15;h=10;bottom=12;offset=-3}
  else return;
  y-=h;ctx.save();ctx.translate(item.p.x,item.p.y+offset);drawFlag(e.f,x,y,w,h);line(x,y-1,x,bottom,'#c4caba',1);ctx.restore();
}
function paintDepthScene(scene){for(const item of scene){drawNationalityFlag(item);item.paint()}}
