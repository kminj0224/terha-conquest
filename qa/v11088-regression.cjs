const assert=require('assert');
const fs=require('fs'),path=require('path');
module.exports=async function({run}){
 const result=run(`(function(){
  const check=(v,m)=>{if(!v)throw Error(m)};
  setup();started=true;setAppScreen('game');player=0;busy=false;menuMode=false;
  money[0]=500000;oil[0]=100000;
  const q=cities.find(c=>c.f===0&&c.capital);
  q.level=5;q.airport=true;q.lab=true;cityProfile(q);
  strategicResearch[0].nuclear=true;
  selectCity(q,true);
  function checkTitle(tab){
   cityCommandOpen(tab);
   const html=$('panel').innerHTML;
   check(html.includes('<h2 class="cityName">'+q.name+'</h2>'),'Missing city name on '+tab);
   check(html.includes('class="cityCountryName"')&&html.includes(factions[q.f].name),'Missing colored faction in header on '+tab);
   const countryPos=html.indexOf('class="cityCountryName"');
   check(countryPos>=0&&countryPos<html.indexOf('class="cityHeadLevel"'),'Faction name must be left of city level on '+tab);
   check(!html.includes('class="cityNation"')&&!html.includes('>도시 정보</span>'),'Redundant middle heading must not exist on '+tab);
   check(html.includes('id="cityExpandGold"')===(tab==='overview'),'Expansion button must exist on overview only: '+tab);
   if(tab==='overview'){
    const b=$('cityExpandGold');check(b.textContent==='도시 확장','Upgrade button must have no price or level in name');
    check(!html.includes('cityCommandHeading'),'Old eyebrow header must be gone');
   }
  }
  for(const tab of ['overview','science','units','air','nuclear','missiles'])checkTitle(tab);
  cityCommandOpen('air');
  const rows=Array.from($('cityCommandContent').children);
  const bomberRows=rows.filter(x=>x.className?.includes('cityActionRow')&&x.children[0]?.textContent.includes(AIR_MISSIONS.strategic.name));
  check(bomberRows.length===1,'There must be exactly one strategic-bomber row');
  check(rows.every(x=>!x.textContent.includes('전략폭격기 핵 장착')&&!x.textContent.includes('전략폭격기 핵 공격')),'Standalone nuclear bomber menu must be removed');
  let bomber=bomberRows[0];
  check(bomber.children.length===3,'Strategic bomber needs strike, i and mounted warhead buttons on SAME row');
  check(bomber.children[1].textContent==='i','Technical information button must be next to bomber strike');
  check(bomber.children[2].getAttribute('aria-label')==='핵탄두 장착','Mounted warhead control must be third adjacent button');
  check(!bomber.children[0].textContent.includes('핵 장착'),'No duplicate nuclear bomber product row');
  check(bomber.children[0].innerHTML.includes('<small>'),'Price belongs on small subline');
  const stock=warheadStock(q);stock.atomic=2;stock.hydrogen=1;syncWarheads(q);
  bomber.children[2].onclick();
  check($('warheadOptions').textContent.includes('원자폭탄')&&$('warheadOptions').textContent.includes('수소폭탄'),'Warhead chooser must list available types');
  const first=$('warheadOptions').children[0];
  first.children[0].onclick();
  check(armedBomber?.city===q.id&&armedBomber.payload==='atomic','Selecting atomic must temporarily arm bomber');
  check(strategicTarget?.kind==='nuclearBomber'&&strategicTarget.payload==='atomic','Choosing atomic must immediately enter bomber targeting');
  check(panelOpen===false&&menuMode===false,'Choosing warhead must close modal and city panel');
  cancelAirTarget();
  check(!strategicTarget&&!armedBomber,'Cancel must abandon the mounted atomic payload');
  cityCommandOpen('air');
  const bomberAfter=Array.from($('cityCommandContent').children).filter(x=>x.className?.includes('cityActionRow')&&x.children[0]?.textContent.includes(AIR_MISSIONS.strategic.name));
  check(bomberAfter.length===1&&bomberAfter[0].children.length===3,'After cancel, bomber must stay a single 3-button row');
  check(!bomberAfter[0].children[0].textContent.includes('원자폭탄 장착'),'Cancelled payload must not remain on bomber row');
  busy=false;menuMode=false;
  for(const id of Object.keys(CITY_COMMAND_ICONS_11088)){
   const b=$(id);
   check(b.innerHTML.includes('viewBox="0 0 24 24"'),'Uniform viewbox missing '+id);
   check(!b.innerHTML.includes('emoji'),'Do not use platform emojis for '+id);
   check(b.innerHTML.includes('<svg'),'Detailed vector icon missing '+id);
  }
  return {cityName:q.name,tabs:6,bomberRows:1,warheadSideButton:true,iconButtons:5,upgradeTitle:'도시 확장'};
 })()`);
 const html=fs.readFileSync(path.resolve(__dirname,'../game/assets/index.html'),'utf8');
 assert(/#selectionActions button\.cityQuickAction\{[^}]*align-items:center!important;justify-content:center!important;/.test(html),'Footer CSS must vertically/horizontally center icons');
 assert(/#selectionActions button\.cityQuickAction svg\{[^}]*width:24px;height:24px;/.test(html),'Footer icon dimensions must be consistent');
 assert.equal(result.bomberRows,1);
 console.log('PASS v1.10.88 city header on all tabs, overview-only no-price upgrade, proper center-aligned vector icons and adjacent bomber warhead load:',result);
};
