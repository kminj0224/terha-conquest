'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
(async()=>{
 const server=spawn('python3',['-m','http.server','8798','--bind','127.0.0.1'],{cwd:process.env.TERHA_TEST_ROOT||path.resolve(__dirname,'..'),stdio:'ignore'});let browser;
 try{
  browser=await chromium.launch();const page=await browser.newPage({viewport:{width:800,height:360}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8798/game/assets/index.html');await page.locator('#appStart:not([disabled])').waitFor();
  await page.evaluate(()=>{player=0;setup();started=true;setAppScreen('game');busy=false;menuMode=false;sound=false;money.fill(1e7);food.fill(1e7);oil.fill(1e7)});
  let checked=0;
  for(const lang of ['ko','en'])for(let f=0;f<8;f++)for(const level of [1,2,3,4])for(const aa of [false,true]){
   const report=await page.evaluate(({lang,f,level,aa})=>{
    appSettings.language=lang;player=f;productionTier=level;productionAA=aa;
    const q=cities.find(q=>q.f===f&&q.capital);q.level=5;q.harbor=true;q.nukeUntil=0;selectCity(q,true);cityCommandOpen('units');
    const rows=[...document.querySelectorAll('#unitCatalogue .produceButton')];
    const number=s=>Number(s.replace(/,/g,''));
    const failures=[];
    for(const button of rows){
     const title=button.firstChild.textContent,k=TYPES.findIndex(t=>title===t.name+' '+level);
     if(k<0){failures.push('unknown unit '+title);continue}
     const expected={food:unitPrice(k,level),oil:unitOil(k,level)},gold=navGoldCost(k,level)+(aa?aaCost(level):0);if(gold)expected.gold=gold;
     const actual=Object.fromEntries([...button.querySelectorAll('.cityMetric')].map(n=>[n.dataset.resource,number(n.querySelector('span').textContent)]));
     if(JSON.stringify(actual)!==JSON.stringify(expected))failures.push({title,actual,expected});
     if(button.querySelector('small').textContent.includes(' · '))failures.push('separator '+title);
    }
    const aaPrice=document.querySelector('#productionAA [data-resource="gold"]');
    if(!aaPrice||number(aaPrice.textContent)!==aaCost(level))failures.push('AA cost');
    return {rows:rows.length,failures};
   },{lang,f,level,aa});
   assert.deepEqual(report.failures,[],JSON.stringify({lang,f,level,aa}));assert(report.rows>0);checked+=report.rows;
  }
  await page.evaluate(()=>{appSettings.language='ko';player=7;productionTier=2;productionAA=true;selectCity(cities.find(q=>q.f===7&&q.capital),true);cityCommandOpen('units')});
  fs.mkdirSync('qa/campaign-previews',{recursive:true});
  for(const [w,h] of [[800,360],[390,844]]){
   await page.setViewportSize({width:w,height:h});await page.locator('#unitCatalogue .produceButton').first().scrollIntoViewIfNeeded();
   const overflow=await page.evaluate(()=>{const p=document.querySelector('#panel .windowContent');return p.scrollWidth>p.clientWidth+1});assert(!overflow);
   await page.screenshot({path:'qa/campaign-previews/unit-costs-'+w+'.png'});
  }
  await page.locator('#gardaraGuardProductionRow .unitInfoButton').click();
  assert.equal(await page.locator('#modal .previewStats .cityMetric').count(),3);
  await page.locator('#previewClose').click();
  const before=await page.evaluate(()=>({gold:money[player],food:food[player],oil:oil[player],expected:{gold:navGoldCost(GARDARA_GUARD,productionTier)+aaCost(productionTier),food:unitPrice(GARDARA_GUARD,productionTier),oil:unitOil(GARDARA_GUARD,productionTier)}}));
  await page.locator('#gardaraGuardProductionRow .produceButton').click();
  const after=await page.evaluate(()=>({gold:money[player],food:food[player],oil:oil[player],queued:cities.find(q=>q.f===player&&q.capital).queue?.type}));
  assert.equal(after.queued,await page.evaluate(()=>GARDARA_GUARD));for(const key of ['gold','food','oil'])assert.equal(before[key]-after[key],before.expected[key]);
  assert.deepEqual(errors,[]);console.log('PASS unit costs:',checked,'rendered rows; 8 nations, 4 tiers, AA on/off, ko/en, ordinary/naval/special, preview and mobile');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
