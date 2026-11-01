'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const draws=[],facilities=[],burns=[];let fallback=0;
const ctx={save(){},restore(){},translate(){},drawImage(...a){draws.push(a)},strokeText(){},fillText(){}};
const context={ctx,console,cam:{z:1},lastTime:1000,loadBaekArt:file=>({idleReady:true,idle:{file}}),cityBuildingLayout:()=>({buildings:[],top:-30,starY:-33}),citySprite(){fallback++},drawCityFire(q,p){burns.push(q.id)},drawAirport(){facilities.push('airport')},rect(){facilities.push('rect')},line(){facilities.push('line')},circle(){facilities.push('circle')},window:{Terha:{}}};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../game/assets/city-art.js'),'utf8'),context);
const run=s=>vm.runInContext(s,context),profiles=[];
for(let level=1;level<=5;level++)profiles.push(run('danteCityProfile({level:'+level+'})'));
profiles.push(run('danteCityProfile({level:5,capital:true})'));
assert.equal(new Set(profiles.map(p=>p.crop.join(','))).size,6,'All five levels and the capital are independent artwork');
for(let level=1;level<=5;level++){
 const q={id:level,origin:1,f:level%2,level,capital:false,aa:true,lab:true,harbor:true,airport:true,launcher:true};context.q=q;
 run('citySprite(q,{x:10,y:20})');assert.equal(draws.at(-1)[0].file,'dante-city-atlas.webp');
 const box=run('photoCityBox(q)'),layout=run('cityBuildingLayout(q)');assert.equal(box.bottom,10);assert.equal(layout.starY,box.y-3);
}
assert.equal(fallback,0);assert.equal(burns.length,5);assert(facilities.includes('airport')&&facilities.includes('circle')&&facilities.includes('line'));
for(const [origin,file]of [[0,'baek-city-5.png'],[2,'stetopia-city-5.png']]){
 context.q={origin,f:1,level:5};run('citySprite(q,{x:0,y:0})');assert.equal(draws.at(-1)[0].file,file,'Occupation changes flags, not founding architecture');
}
context.q={origin:1,f:0,level:5};assert.equal(run('photoCityProfile(q).art.idle.file'),'dante-city-atlas.webp');
run('danteCityArt.idleReady=false;citySprite(q,{x:0,y:0})');assert.equal(fallback,1,'Pending image decoding retains procedural fallback');
context.q={origin:3,f:1,level:5};run('citySprite(q,{x:0,y:0})');assert.equal(fallback,2,'Unchanged other nations keep original renderer');
assert(fs.existsSync(path.join(__dirname,'../game/assets/dante-city-atlas.webp')));
console.log('PASS Dante city artwork: six models, founded-culture dispatch under occupation, fixed ground anchors/stars, facilities/fire overlays, loading fallback and other nations preserved');
