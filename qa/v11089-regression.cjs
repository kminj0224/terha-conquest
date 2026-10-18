const assert=require('assert');
const fs=require('fs'),path=require('path');
module.exports=async function({run}){
 const result=run(`(function(){
  const check=(condition,message)=>{if(!condition)throw Error(message)};
  setup();started=true;setAppScreen('game');player=0;busy=false;menuMode=false;
  const q=cities.find(c=>c.f===player&&c.capital);
  q.level=5;q.airport=true;q.lab=true;q.launcher=true;cityProfile(q);
  selectCity(q,true);
  const tabs=['overview','science','units','air','nuclear','missiles'];
  const outcomes=[];
  for(const tab of tabs){
   cityCommandOpen(tab);
   refreshWindowChrome();
   const panel=$('panel');
   const header=panel.children.find(e=>e.className==='windowHeader');
   check(!!header,'Top window header missing on '+tab);
   const titled=header.children.find(e=>e.className==='cityNameHeader');
   check(!!titled,'City group not installed inside top window header on '+tab);
   const cityTitle=titled.children.find(e=>e.tagName==='H2'&&e.className==='cityName');
   check(!!cityTitle&&cityTitle.textContent===q.name,'Top headline must be CITY NAME instead of 정보 on '+tab);
   check(!header.children.some(e=>e.tagName==='H2'&&e.textContent==='정보'),'Generic fallback information heading remains on '+tab);
   const details=titled.children.find(e=>e.className==='cityHeadMeta');
   check(!!details&&details.textContent.includes(factions[q.f].name)&&details.textContent.includes(q.level+'레벨'),'Nation and level must follow city title on '+tab);
   const content=panel.children.find(e=>e.className==='windowContent');
   check(!!content,'Window content wrapper missing on '+tab);
   check(!content.children.some(e=>e.className==='cityNameHeader'),'City title must not also occupy content area on '+tab);
   check(content.textContent.includes('도시 확장')===(tab==='overview'),'Overview-only expansion control misplaced on '+tab);
   outcomes.push({tab,title:cityTitle.textContent,correctHeader:true});
  }
  return{tabs:outcomes.length,first:outcomes[0].title,allCorrect:outcomes.every(v=>v.correctHeader)};
 })()`);
 assert.equal(result.tabs,6);
 const js=fs.readFileSync(path.join(__dirname,'../game/assets/window-chrome.js'),'utf8');
 assert(js.includes("isPanel&&isWindowClass(e,'cityNameHeader')"),'Window chrome must discover nested city name group');
 console.log('PASS v1.10.89: all six city pages use actual city name in the large window chrome header (no generic Information title):',result);
};
