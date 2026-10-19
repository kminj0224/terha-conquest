const assert=require('assert');
const fs=require('fs'),path=require('path');
const {loadImage}=require('@napi-rs/canvas');
module.exports=async function({run}){
 const root=path.resolve(__dirname,'../game/assets');
 const artifacts=[['carrier',25,132],['destroyer',24,110],['frigate',23,110]];
 for(const [name] of artifacts){
  const file=path.join(root,'dante-'+name+'.webp');
  assert(fs.existsSync(file),'Missing Dante '+name+' embedded artwork');
  const img=await loadImage(file);
  assert(img.width>=500&&img.height>80,'Dante artwork must retain wide hull detail: '+name);
 }
 const rendered=run(`(function(){
  const check=(condition,message)=>{if(!condition)throw Error(message)};
  setup();started=true;setAppScreen('game');busy=false;
  cam.z=1;
  const observed=[];
  const previous=ctx.drawImage;
  ctx.drawImage=function(image,...args){
   for(const [type,asset] of Object.entries(danteFleetImages))
    if(asset.idle===image)observed.push({type:Number(type),width:args[2],height:args[3],
     intrinsic:asset.idle.naturalWidth,originalHeight:asset.idle.naturalHeight});
   return previous(image,...args);
  };
  for(const k of [25,24,23]){
   const ship=units.find(u=>u.f===1&&u.type===k);
   check(!!ship,'Dante must spawn type '+k);
   check(isDanteFleetArt(ship),'Dante custom art must apply to '+k);
   check(danteFleetImages[k].idleReady,'Image not ready for '+k);
   sprite(ship,pxy(ship.tile),performance.now());
  }
  ctx.drawImage=previous;
  check(observed.length>=3,'Dante custom ship renders missing: '+observed.length);
  for(const [type,width] of [[25,132*NAVAL_VISUAL_SCALE],[24,110*NAVAL_VISUAL_SCALE],[23,110*NAVAL_VISUAL_SCALE]]){
   const ship=observed.find(e=>e.type===type);
   check(!!ship,'Expected original Dante bitmap rendered for '+type);
   check(Math.abs(ship.width-width)<.05,'Dante width mismatch type '+type+': '+ship.width);
   check(Math.abs(ship.height-ship.width*ship.originalHeight/ship.intrinsic)<.05,'Must scale ship by width while retaining its native aspect');
  }
  check(!isDanteFleetArt({f:0,type:25})&&!isDanteFleetArt({f:2,type:24}),'Dante artwork must not overwrite other nations');
  const tile=groundOverview.tiles.find(i=>tiles[i].owner>=0);
  check(Number.isInteger(tile),'Expected a land tile');
  const start=tiles[tile].owner,initial=groundSignature(groundOverview);
  tiles[tile].owner=(start+1)%7;
  const changed=groundSignature(groundOverview);
  tiles[tile].owner=start;
  check(initial!==changed,'Ground cache must recognize captured tile owner');
  return {rendered:observed.length,units:[25,24,23],cacheOwnerAware:true};
 })()`);
 assert(rendered.rendered>=3);
 const ground=fs.readFileSync(path.join(root,'static-ground.js'),'utf8');
 assert(ground.includes("const hex=terrainTintColor(f),r="),'Territory palette must use the current-owner color function');
 assert(ground.includes("owner=tiles[id]?.owner"),'Captured territory must use the occupying owner, not the homeland owner');
 assert(ground.includes("function terrainTintColor(f){return f===0?'#4eaa67':factions[f].color}"),'Baekyang must have a clearer green without changing other faction UI colors');
 assert(ground.includes("g.filter='grayscale(1) contrast(82%) brightness(1.04)'"),'Baked homeland hues must be neutralized while retaining terrain relief');
 assert(ground.includes("g.globalCompositeOperation='source-atop';g.globalAlpha=TERRITORY_TINT_ALPHA;g.drawImage(mask"),'Neutral ground must take a single translucent current-owner tint');
 assert(ground.includes('const TERRITORY_TINT_ALPHA=.72'),'Owner tint strength must preserve relief while visibly coloring captured land');
 assert(ground.includes("g.globalCompositeOperation='source-over';g.drawImage(images[1]"),'Terrain decor must remain over colored land');
 assert(!ground.includes('g.globalAlpha=.30;g.drawImage(territoryCanvas'),'Second full-map overlay would mix faction hues on occupied territories');
 assert(!ground.includes('gray+(v-gray)*.42'),'Old muted colors would wash out the new occupying-owner palette');
 assert(ground.indexOf("g.filter='grayscale(1)")<ground.indexOf('groundColorPixels(m,meta,w,h);'),'Neutral land must render before new owner tint');
 assert(ground.includes("g.globalCompositeOperation='source-over';g.globalAlpha=1;g.drawImage(images[1]"),'Forest and mountain detail must render above the tinted neutral base');
 console.log('PASS Dante fleet art unchanged; neutral land, current-occupier-only tint, Baekyang green, and relief preservation:',rendered);
};
