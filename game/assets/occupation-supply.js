'use strict';
// Homeland training queues deliver to occupied cities; IDs remain save-compatible.
let supplyChoice=null;
function occupiedCity(q){return !!q&&q.origin!==q.f}
function homelandSources(q){return cities.filter(s=>s.f===q.f&&s.origin===q.f&&s.level<=q.level)}
function supplySource(q){return cities.find(s=>s.queue?.transportTo===q.id)}
function supplyTurns(source,target){return distance(source.tile,target.tile)<=30?1:2}
function supplyCoastalCity(target){
 // Coast belongs to this city's region, not a different occupied region.
 return tiles.some((t,i)=>t.region===target.id&&t.owner===target.f&&neighbors(i).some(j=>tiles[j].owner<0));
}
function supplyHomelandConnected(target){
 const seen=new Set([target.tile]),queue=[target.tile];
 for(let n=0;n<queue.length;n++){
  const tile=tiles[queue[n]],region=cities[tile.region];
  if(tile.owner!==target.f||region?.f!==target.f)continue;
  if(region.origin===target.f)return true;
  for(const i of neighbors(queue[n])){
   const next=tiles[i],owner=cities[next.region];
   if(next.owner===target.f&&owner?.f===target.f&&!seen.has(i)){seen.add(i);queue.push(i)}
  }
 }
 return false;
}
function supplyLandConnected(source,target){
 // Use geographic land, including foreign territory, with wrapped neighbors.
 const seen=new Set([source.tile]),queue=[source.tile];
 for(let n=0;n<queue.length;n++){
  if(queue[n]===target.tile)return true;
  for(const i of neighbors(queue[n]))if(tiles[i].owner>=0&&!seen.has(i)){seen.add(i);queue.push(i)}
 }
 return false;
}
function supplySeaAccess(target){
 const seen=new Set([target.tile]),queue=[target.tile];
 for(let n=0;n<queue.length;n++)for(const i of neighbors(queue[n])){
  if(tiles[i].owner<0)return true;
  const region=cities[tiles[i].region];
  if(tiles[i].owner===target.f&&region?.f===target.f&&!seen.has(i)){seen.add(i);queue.push(i)}
 }
 return false;
}
function focusSupplyCity(id){
 const q=cities.find(q=>q.id===id);if(!q||busy)return;
 const p=pxy(q.tile);cam.x=p.x;cam.y=p.y;cam.z=Math.max(.85,cam.z);
}
function supplyContext(q){
 return supplyChoice&&selected?.kind==='city'&&selected.id===supplyChoice.target&&q.id===supplyChoice.source
  ?cities.find(c=>c.id===supplyChoice.target):null;
}
function supplyReason(target,source,k,l=productionTier,aa=productionAA,ai=false){
 const f=target?.f;
 if(!target||target.f!==player&&!ai||!occupiedCity(target))return'아군 점령도시를 선택하세요.';
 if(target.nukeUntil>turn)return'피폭 지역 통제가 끝난 뒤 요청하세요.';
 if(supplySource(target)||target.queue)return'현재 병력의 수송과 배치가 끝날 때까지 기다리세요.';
 if(!source||source.f!==target.f||source.origin!==target.f||source.level>target.level)return'점령도시와 레벨이 같거나 낮은 아군 본토 도시를 선택하세요.';
 if(typeof isHansaSupplyCity==='function'&&isHansaSupplyCity(source)){
  if(isNaval({type:k}))return'한사특별도에는 해상수송로가 없습니다';
  if(!isAircraft({type:k})&&!isHelicopter({type:k})&&!hansaBridgeConnected())return'한사특별도 교각 연결 필요';
 }
 cityProfile(source);
 if(!supplyCoastalCity(target)&&!supplyHomelandConnected(target))return'육로 수송로에 연결되지 않은 도시입니다.';
 if(!supplyLandConnected(source,target)&&!supplySeaAccess(target))return'해상 수송로에 연결되지 않은 도시입니다.';
 if(isNaval({type:k})&&!source.harbor)return'본토 도시에 출항할 항구가 없습니다';
 if(isNaval({type:k})&&!target.harbor)return'함정을 받을 점령도시에 항구가 필요합니다.';
 if(ai){
  if(source.queue||source.produced)return '생산 대기열 사용 중';
  if(!canProduce(source,k,l))return '본토 생산 조건 불충족';
  if(food[f]<unitPrice(k,l)||oil[f]<unitOil(k,l)||money[f]<navGoldCost(k,l)+(aa?aaCost(l):0))return '생산 자원 부족';
  return '';
 }
 return homelandProductionReason(source,k,l,aa);
}
const homelandProductionReason=productionReason;
productionReason=function(q,k,l=productionTier,aa=productionAA){
 const target=supplyContext(q);
 if(target)return supplyReason(target,q,k,l,aa);
 if(occupiedCity(q)&&q.f===player)return'본토 도시를 선택하여 병력을 요청하세요.';
 return homelandProductionReason(q,k,l,aa);
};
function requestSupply(target,source,k,l=productionTier,aa=productionAA,ai=false){
 const why=supplyReason(target,source,k,l,aa,ai);
 if(why){if(!ai)toast(why);return false}
 // Charge once, against the source's production rules and facilities.
 const f=target.f;food[f]-=unitPrice(k,l);oil[f]-=unitOil(k,l);
 money[f]-=navGoldCost(k,l)+(aa?aaCost(l):0);
 const total=supplyTurns(source,target,k);
 source.queue={type:k,level:l,aa:!!aa,transportTo:target.id,owner:f,
  sourceName:source.name,total,remaining:total,lastTick:turn};
 source.produced=true;
 if(!ai){toast(isNaval({type:k})?'본토 '+source.name+'에서 출항 후 입항 예정입니다':TYPES[k].name+' · '+source.name+'에서 훈련 후 '+target.name+' 수송 · '+total+'턴');
 showPanel();updateHUD();save()}return true;
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
 const naval=isNaval({type:j.type});
 const detail='본토 <button class="supplyCityLink" data-supply-city="'+source.id+'">'+(j.sourceName||source.name)+'</button>'+(naval?'에서 출항 후 입항 예정입니다':'에서 훈련 후 수송 중입니다');
 return progressCard(TYPES[j.type].name+' · '+j.level+'단계'+(j.aa?' · 대공방어 추가':''),
  detail+'<br>'+(naval?'입항 도시: ':'도착 도시: ')+(target?'<button class="supplyCityLink" data-supply-city="'+target.id+'">'+target.name+'</button>':'')+(j.remaining===0?'<br>'+(naval?'입항 대기 · 입항':'수송 완료 · 도착')+' 도시의 배치 공간을 기다리는 중입니다.':''),j.remaining,j.total);
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
  $('supplyHomeName').textContent='본토 '+home.name+' · '+home.level+'레벨';
  $('supplyBack').onclick=()=>{supplyChoice=null;showPanel()};
  productionPanel(home);return;
 }
 supplyChoice=null;
 box.innerHTML='<p>병력을 훈련할 본토 도시를 선택하세요. '+q.level+'레벨 이하 도시만 표시됩니다.</p><p>거리가 가까울수록 빨리 수송됩니다.</p>';
 const sources=homelandSources(q).sort((a,b)=>b.level-a.level||a.id-b.id);
 if(!sources.length){const p=document.createElement('p');p.textContent='조건에 맞는 아군 본토 도시가 없습니다.';box.appendChild(p)}
 for(const home of sources){
  cityProfile(home);
  const b=document.createElement('button');b.id='supplyHome'+home.id;
  b.textContent=home.name+(home.harbor?' · ⚓ 항구':'')+' · '+home.level+'레벨 · '+supplyTurns(home,q)+'턴'+(home.queue?' · 생산 중':home.produced?' · 이번 턴 생산 완료':'');
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
 if(target.f===player)toast(target.name+'에 '+TYPES[j.type].name+(isNaval({type:j.type})?' 입항 완료':' 수송 완료'));
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
 for(const {id,order}of orders){const source=cities.find(q=>q.id===id);if(source&&TYPES[order.type]&&[1,2,3].includes(order.total)&&Number.isFinite(order.remaining)&&Number.isFinite(order.lastTick)){const elapsed=order.total-order.remaining;order.total=Math.min(2,order.total);order.remaining=Math.max(0,Math.min(order.total,order.total-elapsed));source.queue=order}}
 pruneSupplies();return result;
};
// Incoming orders live on the homeland queue; show them at the receiving city too.
function supplyProductionLabel(q){
 const source=supplySource(q);if(!source)return '';
 const j=source.queue;return '⚙ '+TYPES[j.type].name+(j.level||1)+' - '+(j.sourceName||source.name);
}
const supplyCityForeground=drawCityForeground;
drawCityForeground=function(q,p){
 supplyCityForeground(q,p);
 if(cam.z<=.45||q.queue)return;
 const text=supplyProductionLabel(q);if(!text)return;
 ctx.save();ctx.translate(p.x,p.y);ctx.font=(q.capital?'bold ':'')+'11px Terha,sans-serif';ctx.textAlign='center';ctx.lineWidth=3;
 ctx.strokeStyle='#10212e';ctx.strokeText(text,0,47);ctx.fillStyle='#e6ca7f';ctx.fillText(text,0,47);ctx.restore();
};
document.addEventListener('click',event=>{
 const link=event.target?.closest?.('[data-supply-city]');
 if(link)focusSupplyCity(Number(link.getAttribute('data-supply-city')));
});
Object.assign(window.Terha,{supplyProductionLabel,drawCityForeground,focusSupplyCity,supplyLandConnected,supplySeaAccess,supplyCoastalCity,supplyHomelandConnected,produce,productionReason,unitPage,cityCommandOpen,cityOverview,deploy,
 industryTurn,capture,nuclearImpact,migrateArmy,occupiedCity,homelandSources,supplyTurns,requestSupply,supplySource});



