'use strict';
// Homeland training queues deliver to occupied cities; IDs remain save-compatible.
let supplyChoice=null;
function occupiedCity(q){return !!q&&q.origin!==q.f}
function homelandSources(q){return cities.filter(s=>s.f===q.f&&s.origin===q.f&&s.level<=q.level)}
function supplySource(q){return cities.find(s=>s.queue?.transportTo===q.id)}
function supplyTurns(source,target){
 // Use geographic land, including foreign territory, with wrapped neighbors.
 const seen=new Set([source.tile]),queue=[source.tile];
 for(let n=0;n<queue.length;n++){
  if(queue[n]===target.tile)return 2;
  for(const i of neighbors(queue[n]))if(tiles[i].owner>=0&&!seen.has(i)){seen.add(i);queue.push(i)}
 }
 return 3;
}
function supplyContext(q){
 return supplyChoice&&selected?.kind==='city'&&selected.id===supplyChoice.target&&q.id===supplyChoice.source
  ?cities.find(c=>c.id===supplyChoice.target):null;
}
function supplyReason(target,source,k,l=productionTier,aa=productionAA){
 if(!target||target.f!==player||!occupiedCity(target))return'아군 점령도시를 선택하세요.';
 if(target.nukeUntil>turn)return'피폭 지역 통제가 끝난 뒤 요청하세요.';
 if(supplySource(target)||target.queue)return'현재 병력의 수송과 배치가 끝날 때까지 기다리세요.';
 if(!source||source.f!==target.f||source.origin!==target.f||source.level>target.level)return'점령도시와 레벨이 같거나 낮은 아군 본토 도시를 선택하세요.';
 cityProfile(source);
 if(isNaval({type:k})&&!target.harbor)return'함정을 받을 점령도시에 항구가 필요합니다.';
 return homelandProductionReason(source,k,l,aa);
}
const homelandProductionReason=productionReason;
productionReason=function(q,k,l=productionTier,aa=productionAA){
 const target=supplyContext(q);
 if(target)return supplyReason(target,q,k,l,aa);
 if(occupiedCity(q)&&q.f===player)return'본토 도시를 선택하여 병력을 요청하세요.';
 return homelandProductionReason(q,k,l,aa);
};
function requestSupply(target,source,k,l=productionTier,aa=productionAA){
 const why=supplyReason(target,source,k,l,aa);
 if(why){toast(why);return false}
 // Charge once, against the source's production rules and facilities.
 food[player]-=unitPrice(k,l);oil[player]-=unitOil(k,l);
 money[player]-=navGoldCost(k,l)+(aa?aaCost(l):0);
 const total=supplyTurns(source,target);
 source.queue={type:k,level:l,aa:!!aa,transportTo:target.id,owner:player,
  sourceName:source.name,total,remaining:total,lastTick:turn};
 source.produced=true;
 toast(TYPES[k].name+' · '+source.name+'에서 훈련 후 '+target.name+' 수송 · '+total+'턴');
 showPanel();updateHUD();save();return true;
}
const homelandProduce=produce;
produce=function(q,k,l=productionTier,aa=productionAA){
 const target=supplyContext(q);
 if(target)return requestSupply(target,q,k,l,aa);
 if(occupiedCity(q)&&q.f===player){toast('본토 도시를 선택하여 병력을 요청하세요.');return false}
 return homelandProduce(q,k,l,aa);
};
function supplyCard(source){
 const j=source.queue,target=cities.find(q=>q.id===j.transportTo);
 const detail='본토 '+(j.sourceName||source.name)+'에서 훈련 후 수송 중입니다';
 return progressCard(TYPES[j.type].name+' · '+j.level+'단계'+(j.aa?' · 대공방어 추가':''),
  detail+'<br>도착 도시: '+(target?.name||'')+(j.remaining===0?'<br>수송 완료 · 도착 도시의 배치 공간을 기다리는 중입니다.':''),j.remaining,j.total);
}
const homelandUnitPage=unitPage;
unitPage=function(q){
 const source=supplySource(q);
 if(source||q.queue?.transportTo!==undefined){$('cityCommandContent').innerHTML=supplyCard(source||q);return}
 if(!occupiedCity(q))return homelandUnitPage(q);
 const box=$('cityCommandContent');
 const home=supplyChoice?.target===q.id?cities.find(s=>s.id===supplyChoice.source):null;
 if(home&&homelandSources(q).includes(home)){
  box.innerHTML='<button id="supplyBack">본토 도시 목록</button><p id="supplyHomeName"></p><div id="production"></div>';
  $('supplyHomeName').textContent='본토 '+home.name+' · '+home.level+'레벨 · '+supplyTurns(home,q)+'턴 후 '+q.name+' 도착';
  $('supplyBack').onclick=()=>{supplyChoice=null;showPanel()};
  productionPanel(home);return;
 }
 supplyChoice=null;
 box.innerHTML='<p>병력을 훈련할 본토 도시를 선택하세요. '+q.level+'레벨 이하 도시만 표시됩니다.</p>';
 const sources=homelandSources(q).sort((a,b)=>b.level-a.level||a.id-b.id);
 if(!sources.length){const p=document.createElement('p');p.textContent='조건에 맞는 아군 본토 도시가 없습니다.';box.appendChild(p)}
 for(const home of sources){
  const b=document.createElement('button');b.id='supplyHome'+home.id;
  b.textContent=home.name+' · '+home.level+'레벨 · '+supplyTurns(home,q)+'턴'+(home.queue?' · 생산 중':home.produced?' · 이번 턴 생산 완료':'');
  b.onclick=()=>{supplyChoice={target:q.id,source:home.id};showPanel()};box.appendChild(b);
 }
};
const supplyCommandOpen=cityCommandOpen;
cityCommandOpen=function(tab){if(tab==='units')supplyChoice=null;return supplyCommandOpen(tab)};
// The footer originally captured the old handler directly.
$('cityArmy').onclick=()=>cityCommandOpen('units');
const supplyOverview=cityOverview;
cityOverview=function(q){
 let html=supplyOverview(q);const source=supplySource(q);
 if(q.queue?.transportTo!==undefined){
  const old='<div class="progressCard"><b>'+TYPES[q.queue.type].name+' '+q.queue.level+'단계 생산</b><p>다음 턴에 배치 · 배치 공간이 없으면 대기</p></div>';
  return html.replace(old,supplyCard(q));
 }
 if(source){const heading='<h3>진행 중인 작업</h3>';html=html.replace(heading+'<p class="quiet">진행 중인 작업이 없습니다.</p>',heading);html=html.replace(heading,heading+supplyCard(source))}
 return html;
};
function validSupply(source){
 const j=source.queue,target=cities.find(q=>q.id===j?.transportTo);
 return !!j&&!!target&&source.f===j.owner&&source.origin===j.owner&&target.f===j.owner
  &&source.nukeUntil<=turn&&target.nukeUntil<=turn;
}
function pruneSupplies(){for(const source of cities)if(source.queue?.transportTo!==undefined&&!validSupply(source))source.queue=null}
const supplyDeploy=deploy;
deploy=function(source){
 const j=source.queue;
 if(j?.transportTo===undefined)return supplyDeploy(source);
 if(!validSupply(source)){source.queue=null;return}
 j.remaining=Math.max(0,j.remaining-Math.max(0,turn-j.lastTick));j.lastTick=turn;
 if(j.remaining>0)return;
 const target=cities.find(q=>q.id===j.transportTo);
 const sites=isNaval({type:j.type})?tiles.map((t,i)=>i).filter(i=>tiles[i].owner<0&&distance(target.tile,i)<=3).sort((a,b)=>distance(a,target.tile)-distance(b,target.tile))
  :[target.tile,...neighbors(target.tile),...neighbors(target.tile).flatMap(neighbors)];
 const site=sites.find(i=>!unitAt(i)&&(isNaval({type:j.type})?tiles[i].owner<0:tiles[i].owner===target.f));
 if(site===undefined)return;
 const u=makeUnit(j.owner,j.type,site,j.level);u.aa=!!j.aa;
 u.producedAtCityId=source.id;u.fuelEfficient=!!source.fuelEfficiency&&!source.fuelResearchJob;
 source.queue=null;
 if(target.f===player)toast(target.name+'에 '+TYPES[j.type].name+' 수송 완료');
};
const supplyIndustryTurn=industryTurn;
industryTurn=async function(...args){await supplyIndustryTurn(...args);pruneSupplies();for(const source of cities)if(source.queue?.transportTo!==undefined)deploy(source)};
const supplyCapture=capture;
capture=function(...args){const result=supplyCapture(...args);pruneSupplies();return result};
const supplyNuclearImpact=nuclearImpact;
nuclearImpact=function(...args){const result=supplyNuclearImpact(...args);pruneSupplies();return result};
// Legacy normalization checks local unlocks: detach remote orders during it.
const supplyMigration=migrateArmy;
migrateArmy=function(s){
 const orders=s.cities.filter(q=>q.queue?.transportTo!==undefined).map(q=>({id:q.id,order:q.queue}));
 for(const {id}of orders)s.cities.find(q=>q.id===id).queue=null;
 const result=supplyMigration(s);supplyChoice=null;
 for(const {id,order}of orders){const source=cities.find(q=>q.id===id);if(source&&TYPES[order.type]&&[2,3].includes(order.total)&&Number.isFinite(order.remaining)&&Number.isFinite(order.lastTick)){source.queue=order;order.remaining=Math.max(0,Math.min(order.total,order.remaining))}}
 pruneSupplies();return result;
};
Object.assign(window.Terha,{produce,productionReason,unitPage,cityCommandOpen,cityOverview,deploy,
 industryTurn,capture,nuclearImpact,migrateArmy,occupiedCity,homelandSources,supplyTurns,requestSupply,supplySource});
