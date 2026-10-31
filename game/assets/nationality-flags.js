'use strict';
// Each flag shares its owner’s depth and is painted immediately before its body.
function drawNationalityFlag(item){const e=item.entity;if(!e)return;let x,y,w,h,bottom,offset=0;
  if(item.kind==='unit'){if(cam.z<=.55)return;x=-33;y=-24;w=15;h=10;bottom=10;offset=-3}
  else if(item.kind==='city'){if(cam.z<=.38)return;const art=photoCityProfile(e);x=art&&art.art.idleReady?photoCityBox(e).x-14:-43;y=-18;w=18;h=12;bottom=7}
  else if(item.kind==='defense'){x=-38;y=-26;w=15;h=10;bottom=12;offset=-3}
  else return;
  y-=h;ctx.save();ctx.translate(item.p.x,item.p.y+offset);drawFlag(e.f,x,y,w,h);line(x,y-1,x,bottom,'#c4caba',1);ctx.restore();
}
const SCENE_DEPTH_RANK={scenery:0,city:1,defense:2,unit:3,wreck:3,smokeBehind:2.8,impact:3.5,saprosImpact:3.5,ghost:4};
function compareSceneDepth(a,b){return a.p.y-b.p.y||a.p.x-b.p.x||SCENE_DEPTH_RANK[a.kind]-SCENE_DEPTH_RANK[b.kind]||a.id-b.id}
let worldPaintBatch=null;
function beginWorldPaintBatch(center){worldPaintBatch={center,scene:[],foreground:[]}}
function retainWorldPaint(paint){const transform=ctx.getTransform(),viewX=cam.x;return()=>{const previous=cam.x;ctx.save();try{ctx.setTransform(transform);cam.x=viewX;paint()}finally{cam.x=previous;ctx.restore()}}}
function paintDepthScene(scene){for(const item of scene){const paint=()=>{drawNationalityFlag(item);item.paint()};if(worldPaintBatch)worldPaintBatch.scene.push({...item,p:{x:item.p.x+worldPaintBatch.center-cam.x,y:item.p.y},paint:retainWorldPaint(paint)});else paint()}}
function paintWorldForeground(paint){if(worldPaintBatch)worldPaintBatch.foreground.push(retainWorldPaint(paint));else paint()}
function flushWorldPaintBatch(){const batch=worldPaintBatch;worldPaintBatch=null;batch.scene.sort(compareSceneDepth);for(const item of batch.scene)item.paint();for(const paint of batch.foreground)paint()}

