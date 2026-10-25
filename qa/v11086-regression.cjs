const assert=require('assert');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../game/assets');
module.exports=async function({run}){
 const result=run(`(function(){
 const check=(v,m)=>{if(!v)throw Error(m)};
 setup();started=true;setAppScreen('game');player=0;busy=false;menuMode=false;
 money[0]=500000;oil[0]=100000;
 const q=cities.find(c=>c.f===0&&c.capital);
 q.level=5;q.lab=true;q.airport=true;q.launcher=true;cityProfile(q);
 strategicResearch[0].ballistic=true;strategicResearch[0].nuclear=true;
 selectCity(q,true);cityCommandOpen('overview');
 check($('cityExpandGold'),'City expansion must appear on the city-information page');
 check($('panel').innerHTML.includes('<h2 class="cityName">'+q.name+'</h2>'),'City name must appear on the overview');
 check($('cityOverviewFacilities'),'Keep building section in city overview');
 const checkRows=(tab,label)=>{
  cityCommandOpen(tab);
  const html=$('panel').innerHTML;
  check(!html.includes('cityExpandGold'),'Expansion erroneously shown in '+tab);
  check(!html.includes('cityNation'),'Nation is repeated in '+tab);
  check(!html.includes('<span class="eyebrow">'),'Duplicate top page heading in '+tab);
  check($('panel').innerHTML.includes('<h2 class="cityName">'+q.name+'</h2>'),'City name must remain at top of '+tab);
  check(html.includes('id="cityCommandContent"'),'Missing compact page content on '+tab);
  if(tab==='units'){
   const catalogue=$('unitCatalogue');
   check(!!catalogue,'Unit production catalogue must be present');
   check(catalogue.textContent.includes('소총수')&&catalogue.innerHTML.includes('<small>'),'Unit production must retain names and small pricing lines');
   return catalogue.children.length;
  }
  const rows=[];function visit(e){for(const c of e.children||[]){if(c.className?.includes('cityActionRow'))rows.push(c);visit(c)}}visit($('cityCommandContent'));
  check(rows.length>0,'No command rows in '+tab);
  const found=rows.find(row=>row.children[0]?.textContent.includes(label));
  check(found,'Missing '+label+' in '+tab);
  const button=found.children[0];
  check(button.innerHTML.includes('<small>'),'Metadata must be below name inside small text on '+tab);
  check(!button.childNodes[0].textContent.includes('골드'),'Gold price must not share title line in '+tab);
  if(tab!=='units'&&found.children[1]?.textContent==='i'){
   found.children[1].onclick();
   check(!$('modal').textContent.includes('골드')&&!$('modal').textContent.includes('연속출격')&&!$('modal').textContent.includes('턴 남음'),'Info must only contain technical specifications on '+tab);
   $('cityInfoX').onclick();
  }
  return rows.length;
 };
 const count={
  science:checkRows('science','군사 연구'),
  units:checkRows('units','소총수'),
  air:checkRows('air','전투기 공습'),
  nuclear:checkRows('nuclear','원자폭탄'),
  missiles:checkRows('missiles','단거리 탄도미사일')
 };
 for(const item of cityTabButtons){
  const b=$(item.id);
  check(b.innerHTML.includes('<svg'),'Footer icon must be vector and centered '+item.id);
  check(b.style.display==='inline-flex','Footer icon must flex-center '+item.id);
 }
 check($('selectionManage').className.includes('cityQuickAction'),'Wrench must match button sizing');
 return {pages:count,vectorButtons:cityTabButtons.length,priceBelowTitle:true,overviewOnlyUpgrade:true};
 })()`);
 assert.equal(result.vectorButtons,5);
 const source=fs.readFileSync(path.join(root,'static-ground.js'),'utf8');
 assert(source.includes('const hex=terrainTintColor(f),r='),'The ground palette must use v1.10.91 muted faction colors');
 assert(!source.includes("g.filter='grayscale(1) contrast(70%)'"),'v1.10.91 must not neutralize the original terrain colors');
 assert(source.includes("g.globalCompositeOperation='color';g.drawImage(mask"),'Terrain must retain baked mountain/forest artwork luminosity and textures');
 assert(source.includes('g.globalAlpha=.30;g.drawImage(territoryCanvas'),'v1.10.91 translucent territorial overlay must be restored');
 console.log('PASS v1.10.86 clean city tabs, unit-style small price labels, i-only specifications, aligned SVG icons and v1.10.91 muted territory colors and original terrain relief:',result);
};
