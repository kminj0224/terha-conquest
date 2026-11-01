'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const out=path.resolve(__dirname,'dante-city-release');
const server=spawn('python3',['-m','http.server','8766','--bind','127.0.0.1'],{cwd:path.resolve(__dirname,'..'),stdio:'ignore'});
(async()=>{let browser;try{
 fs.mkdirSync(out,{recursive:true});
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await new Promise(r=>setTimeout(r,700));
 const root='http://127.0.0.1:8766/game/assets/index.html';
 for(const option of ['a']){
  await page.goto(root);
  await page.locator('#appStart:not([disabled])').waitFor({timeout:90000});
  await page.click('#appStart');await page.click('#battle');await page.click('#conquestMode');await page.locator('#factions button').nth(1).click();await page.click('#start');
  await page.waitForFunction(()=>appScreen==='game'&&!campaignLoading,null,{timeout:90000});
  await page.waitForFunction(()=>danteCityArt?.idleReady);
  const actual=await page.evaluate(()=>{
   const q=cities.find(c=>c.origin===1&&c.capital),p=pxy(q.tile);cam.x=p.x;cam.y=p.y-60;cam.z=1.7;
   selected=null;panelOpen=false;refreshSelection();return {city:q.name,id:q.id,profile:photoCityProfile(q)};
  });
  assert(actual.profile);await page.waitForTimeout(1000);
  await page.screenshot({path:path.join(out,option+'-capital-game.png')});
  const saved=await page.evaluate(()=>{const expected=cities.map(q=>({id:q.id,origin:q.origin,level:q.level,capital:q.capital}));const s=snapshot();s.appVersion='1.11.93';localStorage.setItem(saveKey(10),JSON.stringify(s));return expected});
  await page.evaluate(()=>load(10));await page.waitForFunction(()=>appScreen==='game'&&!campaignLoading);
  assert.deepEqual(await page.evaluate(()=>cities.map(q=>({id:q.id,origin:q.origin,level:q.level,capital:q.capital}))),saved,'Existing save city identities and levels survive');
  // Transient comparison fixture: all six types rendered by the real game renderer.
  // It is never saved, and is not shipped as map/city data.
  const fixture=await page.evaluate(()=>{
   const base=cities.find(c=>c.origin===1&&c.capital),p=pxy(base.tile),used=new Set();
   const original=cities.map(q=>({...q}));
   for(const t of tiles)t.city=-1;
   units=[];selected=null;panelOpen=false;reach.clear();
   const samples=[];
   for(let i=0;i<6;i++){
    const wanted={x:p.x+[-220,0,220][i%3],y:p.y+(i<3?-40:155)};
    let index=-1,best=Infinity;
    for(let j=0;j<tiles.length;j++){
     if(tiles[j].owner!==1||used.has(j))continue;
     const at=pxy(j),d=(at.x-wanted.x)**2+(at.y-wanted.y)**2;
     if(d<best){best=d;index=j;}
    }
    if(index<0)throw Error('No land for comparison fixture');used.add(index);
    const q={...base,id:i,tile:index,capital:i===5,level:Math.min(i+1,5),name:i===5?'단테스시티 · 수도':(i+1)+'레벨 도시',aa:false,lab:false,harbor:false,airport:false,launcher:false,queue:null};
    tiles[index].city=i;samples.push(q);
   }
   cities=samples;cam.x=p.x;cam.y=p.y+40;cam.z=2;updateHUD();refreshSelection();
   return samples.map(q=>({name:q.name,level:q.level,capital:q.capital,art:photoCityProfile(q),box:photoCityBox(q)}));
  });
  assert.equal(fixture.length,6);assert.equal(new Set(fixture.map(x=>x.art.crop.join(','))).size,6);
  assert(fixture.every(x=>x.box.w>0&&x.box.h>0&&x.box.bottom===10));
  await page.waitForTimeout(700);
  await page.screenshot({path:path.join(out,option+'-levels-game.png')});
  console.log('PASS option',option,'native citySprite rendering of levels 1-5 and capital; identity follows origin; six distinct sprite crops; original stars/name/flag/HUD',JSON.stringify(fixture.map(x=>({name:x.name,crop:x.art.crop,box:x.box}))));
 }
 await page.goto(root);await page.locator('#appStart:not([disabled])').waitFor({timeout:90000});
 assert.equal(await page.evaluate(()=>photoCityProfile({origin:1,f:0,level:5,capital:false}).art.idle.src.endsWith('dante-city-atlas.webp')),true);
 assert.equal(await page.evaluate(()=>photoCityProfile({origin:0,f:1,level:5,capital:false}).art.idle.src.endsWith('baek-city-5.png')),true);
 assert.deepEqual(errors,[]);console.log('PASS default URL activates approved A city art, older saves retain city identities/levels, founding architecture survives ownership changes; direct Chromium screenshots');
}finally{await browser?.close();server.kill()}})().catch(e=>{console.error(e);process.exitCode=1});
