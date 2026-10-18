const assert=require('assert');
module.exports=async function({run}){
 const report=run(`(function(){
 const check=(value,message)=>{if(!value)throw Error(message)};
 check(fuelBadgeArt.complete&&fuelBadgeArt.naturalWidth===36&&fuelBadgeArt.naturalHeight===33,'Fuel-efficiency artwork must load from assets');
 setup();started=true;setAppScreen('game');cam.z=1;
 const u=units.find(v=>v.type===0&&!v.carriedBy);
 check(!!u,'Missing unit to verify nameplate');
 const original=u.fuelEfficient;
 const p=unitVisualPosition(u,performance.now());
 const text=TYPES[u.type].name+' '+u.level;
 const drawn=[],images=[];
 const fill=ctx.fillText,stroke=ctx.strokeText,drawImage=ctx.drawImage;
 ctx.fillText=function(t,...args){if(t===text)drawn.push({type:'name',x:args[0],y:args[1]});return fill(t,...args)};
 ctx.strokeText=function(t,...args){if(t===text)drawn.push({type:'outline',x:args[0],y:args[1]});return stroke(t,...args)};
 ctx.drawImage=function(im,...args){if(im===fuelBadgeArt)images.push(args);return drawImage(im,...args)};
 try{
  u.fuelEfficient=false;
  sprite(u,pxy(u.tile),performance.now());
  check(drawn.length===0,'Old label must not be painted inside the unit sprite');
  drawUnitNameOverlays([u],performance.now());
  check(drawn.length===2&&drawn[0].type==='outline'&&drawn[1].type==='name','Name must be painted once, with outline, in foreground');
  check(Math.abs(drawn[1].y-(p.y+14))<.001,'Name should sit immediately above the HP bar');
  check(images.length===0,'Unresearched unit cannot receive green leaf mark');
  drawn.length=0;
  u.fuelEfficient=true;
  drawUnitNameOverlays([u],performance.now());
  check(drawn.length===2,'Research icon cannot remove the name');
  check(images.length===1&&images[0][2]===10&&images[0][3]===10,'Badge must be 10×10 world pixels (text height)');
  check(images[0][0]>drawn[1].x,'Fuel badge belongs to the right of the name');
  check(moveOil(u)===0&&attackOil(u)===0,'Fuel flag should still affect gameplay');
  const badgeCount=images.length;
  cam.z=.5;
  drawUnitNameOverlays([u],performance.now());
  check(images.length===badgeCount,'Text/icon should hide together when zoomed out');
  return {name:text,nameY:drawn[1].y,iconSize:10,foreground:true};
 }finally{
  ctx.fillText=fill;ctx.strokeText=stroke;ctx.drawImage=drawImage;
  u.fuelEfficient=original;
 }
 })()`);
 assert.equal(report.iconSize,10);
 console.log('PASS v1.10.83 unit labels in foreground, positioned above HP, with 10px fuel-efficiency logo only for researched units:',report);
};
