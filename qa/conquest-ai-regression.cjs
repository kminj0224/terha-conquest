'use strict';
module.exports=async function({run}){
 const report=await run(`(async()=>{
 const check=(v,m)=>{if(!v)throw Error(m)},state=JSON.stringify(snapshot()),oldDelay=delay;
 try{
 delay=()=>Promise.resolve();busy=false;activeScenario=null;
 check(!units.some(u=>u.f!==player&&u.type===26&&u.aiFreeTransport),'Easy has no initial free AI transport');
 check(units.some(u=>u.f===player&&u.type===26),'Player starting transports remain');
 check(units.filter(u=>u.initialFrontlineReinforcement).length===46,'Easy preserves every ordinary frontline reinforcement');
 check(units.filter(u=>u.f===0&&u.initialFrontlineReinforcement&&isNaval(u)).length===4,'Easy preserves forward fleet placement');
 for(let d=0;d<3;d++){
  difficulty=d;const factor=[1,1.5,3][d];
  check(income(1)===danteBaseIncome(1)*factor&&foodIncome(1)===danteBaseFoodIncome(1)*factor&&oilIncome(1)===danteBaseOilIncome(1)*factor,'Dante resource multiplier '+d);
  check(income(2)===danteBaseIncome(2),'Other nation income unchanged');
  const tank={type:1,f:1,level:1};strategicResearch[1].fuelEfficiency=false;
  check((moveOil(tank)>0)===(d<2)&&(attackOil(tank)>0)===(d<2),'Dante fuel '+d);
  const carrier={type:25,f:1,level:1};check((attackOil(carrier)>0)===(d<2),'Carrier fuel '+d);
  player=1;check(income(1)===danteBaseIncome(1)&&moveOil(tank)>0&&attackOil(tank)>0,'Human Dante receives no AI bonus');player=0;
 }
 units=[];difficulty=0;
 for(let f=1;f<factions.length;f++)for(let n=0;n<4;n++){turn++;prepareAITransports(f,cities.filter(q=>q.f===f))}
 check(!units.some(u=>u.type===26),'Easy never receives free transports');
 difficulty=1;for(let n=0;n<4;n++){turn++;prepareAITransports(2,cities.filter(q=>q.f===2))}check(aiFreeTransportCount(2)===3,'Normal retains free transport cap');
 units=[];food.fill(1000000);money.fill(1000000);oil.fill(1000000);
 const own=cities.filter(q=>q.f===1&&q.origin===1),fronts=aiSpecialFronts(1);
 for(const q of own){q.level=4;q.queue=null;q.produced=false;q.nukeUntil=0;cityProfile(q)}
 const nearest=own.slice().sort((a,b)=>aiFrontDistance(a,fronts)-aiFrontDistance(b,fronts)||b.level-a.level||a.id-b.id)[0];
 turn++;check(aiOrderSpecials(1,own)===1&&nearest.queue?.type===17,'Nearest level 4 city orders special before capital');
 check(aiOrderSpecials(1,own)===0,'Exactly one special each turn');
 turn++;nearest.queue=null;nearest.produced=false;nearest.level=5;cityProfile(nearest);check(aiOrderSpecials(1,own)===1&&nearest.queue?.type===17,'Nearest level 5 city orders special');
 // Actual map audit: lake-only coastal regions and a simulated isolated occupation.
 const lakeOnly=cities.filter(q=>tiles.some((t,i)=>t.region===q.id&&t.owner>=0&&neighbors(i).some(j=>tiles[j].owner<0))&&!tiles.some((t,i)=>t.region===q.id&&t.owner>=0&&neighbors(i).some(supplyOceanTile)));
 console.log('Lake-only regions:',lakeOnly.map(q=>q.name));check(lakeOnly.length>0,'Map contains lake-only coastal regions');
 const target=lakeOnly.find(q=>!q.capital);check(target,'Non-capital lake-only target');
 const home=cities.find(q=>q.origin===2&&tiles.some((t,i)=>t.region===q.id&&t.owner>=0&&neighbors(i).some(supplyOceanTile)));
 for(const q of cities){q.f=6;q.queue=null;q.produced=false;q.nukeUntil=0}for(const t of tiles)if(t.owner>=0)t.owner=6;
 for(const q of [target,home]){q.f=2;for(const i of regionTiles[q.id])tiles[i].owner=2}
 target.level=5;home.level=1;cityProfile(home);player=2;
 check(!supplyCoastalCity(target)&&!supplySeaAccess(target)&&!supplyHomelandConnected(target),'Lake does not count as coast or mainland');
 check(!supplyRouteConnected(home,target),'Ocean homeland cannot ship across the lake');
 // Close logical bridge decks to isolate land while keeping the actual lake geography.
 for(const b of hansaBridges)for(const i of b.deck){tiles[i].owner=-1;tiles[i].region=-1}
 seaComponents=null;supplyTopology=null;
 // Opposite lake shores were joined by the old water-as-sea topology.
 const shore=cities.find(q=>q!==target&&!q.capital&&tiles.some((t,i)=>t.region===q.id&&t.owner>=0&&neighbors(i).some(j=>tiles[j].owner<0&&!supplyOceanTile(j)))&&!regionTiles[q.id].some(i=>neighbors(i).some(j=>tiles[j].owner>=0&&tiles[j].region===target.id)));check(shore,'Opposite lake shore fixture');shore.f=2;shore.origin=2;shore.level=1;shore.queue=null;shore.produced=false;
 for(const i of regionTiles[shore.id])tiles[i].owner=2;
 const oldSeen=new Set([shore.tile]),oldQueue=[shore.tile];
 for(let n=0;n<oldQueue.length;n++)for(const i of neighbors(oldQueue[n]))if(!oldSeen.has(i)&&(tiles[i].owner<0||tiles[i].owner===2&&cities[tiles[i].region]?.f===2)){oldSeen.add(i);oldQueue.push(i)}
 check(oldSeen.has(target.tile),'Pre-fix topology joins the opposite lake shore');
 check(!supplyRouteConnected(shore,target),'Fixed topology rejects lake crossing');
 check(!!supplyReason(target,shore,0,1,false),'Lake-crossing production is rejected');
 check(!!supplyReason(target,home,0,1,false)&&!requestSupply(target,home,0,1,false),'Player cannot order lake-only isolated occupation');
 player=0;check(!aiQueueUnit(2,target,0,1),'AI cannot order lake-only isolated occupation');
 // Every AI can use real affordable transport missions, repeatedly and without a sortie cap.
 const airport=cities.find(q=>q!==target&&distance(q.tile,target.tile)<=AIR_MISSIONS.transport.range);check(airport,'Airport fixture');
 const captures=[];
 for(let f=0;f<factions.length;f++){
  player=(f+1)%factions.length;units=[];airport.f=f;airport.level=5;airport.airport=true;airport.nukeUntil=0;target.f=player;target.hp=0;target.nukeUntil=0;tiles[target.tile].owner=player;
  diplomacy[f][player]='war';money[f]=AIR_MISSIONS.transport.cost;oil[f]=AIR_MISSIONS.transport.oil;
  check(await aiCaptureBreachedCities(f,[airport])===1&&target.f===f,'AI captures breached enemy city '+f);
  check(money[f]===120&&oil[f]===0,'Air drop charges exact resources '+f);captures.push(f);
 }
 player=0;diplomacy[1][0]='war';target.f=0;target.hp=0;units=[];tiles[target.tile].owner=0;airport.f=1;airport.airport=true;money[1]=AIR_MISSIONS.transport.cost-1;oil[1]=10000;
 check(await aiCaptureBreachedCities(1,[airport])===0&&target.f===0,'Insufficient gold blocks drop');
 money[1]=10000;oil[1]=AIR_MISSIONS.transport.oil-1;check(await aiCaptureBreachedCities(1,[airport])===0,'Insufficient oil blocks drop');
 money[1]=10000;oil[1]=10000;target.hp=1;check(await aiCaptureBreachedCities(1,[airport])===0,'Intact city never receives capture drop');
 target.hp=0;makeUnit(0,0,target.tile);check(await aiCaptureBreachedCities(1,[airport])===0,'Garrison blocks drop');
 units=[];airport.airport=false;check(await aiCaptureBreachedCities(1,[airport])===0,'Airport required');
 airport.airport=true;const oldRange=AIR_MISSIONS.transport.range;AIR_MISSIONS.transport.range=-1;
 check(await aiCaptureBreachedCities(1,[airport])===0,'Range limit blocks drop');AIR_MISSIONS.transport.range=oldRange;
 diplomacy[1][0]='neutral';check(await aiCaptureBreachedCities(1,[airport])===0,'Neutral city not captured');diplomacy[1][0]='war';
 const second=cities.find(q=>q!==airport&&q!==target&&distance(q.tile,airport.tile)<=oldRange);check(second,'Second breached city fixture');
 second.f=0;second.hp=0;second.nukeUntil=0;tiles[second.tile].owner=0;
 money[1]=AIR_MISSIONS.transport.cost*2;oil[1]=AIR_MISSIONS.transport.oil*2;
 check(await aiCaptureBreachedCities(1,[airport])===2&&target.f===1&&second.f===1,'Capture every affordable reachable breached city');
 return {difficultyMultipliers:[1,1.5,3],lakeOnly:lakeOnly.map(q=>q.name),isolatedTarget:target.name,specialCity:nearest.name,capturingFactions:captures};
 }finally{
 delay=oldDelay;const s=JSON.parse(state);({units,cities,money,tech,food,oil,turn,player,difficulty,uid,cam,diplomacy}=s);tiles.forEach((t,i)=>t.owner=s.owners[i]);migrateArmy(s);busy=false;selected=null;panelOpen=false;supplyChoice=null;
 }
 })()`);
 console.log('PASS conquest AI:',JSON.stringify(report));
};
