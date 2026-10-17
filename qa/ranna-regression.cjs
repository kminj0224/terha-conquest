const assert=require('assert');
module.exports=function({run}){
 const report=run(`(()=>{
  const check=(ok,message)=>{if(!ok)throw Error(message)};
  check(DEKPHUING_GUERRILLA===27&&TYPES.length===28,'Existing unit IDs changed');
  const initial=units.filter(u=>u.rannaGuerrillaInitial),regionCount=new Set(initial.map(u=>tiles[u.tile].region)).size;
  check(initial.length>=16&&initial.length<=32,'Guerrilla initial army size');
  check(regionCount>=8,'Guerrillas must be spread across Ranna');
  check(new Set(initial.map(u=>u.tile)).size===initial.length,'Duplicate guerrilla tiles');
  for(const u of initial){check(u.f===4&&u.type===27&&u.level===1&&u.hp===90,'Initial guerrilla stats');check(tiles[u.tile].owner===4&&[2,3].includes(tiles[u.tile].terrain)&&!cityAt(u.tile),'Invalid guerrilla terrain');check(units.filter(v=>!v.carriedBy&&v.tile===u.tile).length===1,'Occupied spawn tile')}
  check(diplomacy[4][5]==='war'&&diplomacy[5][4]==='war','Ranna/Nagwol starting war');
  check(diplomacy[4][0]==='neutral'&&diplomacy[6][2]==='ally','Other diplomacy changed');
  const i=tiles.findIndex((t,n)=>t.owner>=0&&!cityAt(n)&&!baseAt(n)&&!RANNA_RIVER_TILES.has(n));
  const terrain=tiles[i].terrain,originalTech=tech[4];tech[4]=0;
  const u={type:27,f:4,level:1,hp:90,tile:i},enemy={type:1,f:5,level:1,hp:unitMaxHp({type:1,f:5,level:1}),tile:i};
  try{
   tiles[i].terrain=1;check(unitAttack(u)===14&&unitMaxHp(u)===90,'Plain baseline');check(rannaTerrainProtection(u)===1,'Plain protection');
   for(const t of [2,3]){tiles[i].terrain=t;check(unitAttack(u)===70,'Terrain attack ×5');check(moveCost(u,i)===1,'Terrain movement');check(damage(enemy,u)===Math.round(guerrillaDamage(enemy,u)*.25),'75% direct damage reduction');check(bombProtection(u,null)===guerrillaBombProtection(u,null)*.25,'75% bombing reduction');for(const type of [20,21]){const heli={...enemy,type};check(damage(heli,u)===guerrillaDamage(heli,u),'Helicopter protection must apply once')}}
   tiles[i].terrain=1;RANNA_RIVER_TILES.add(i);check(unitAttack(u)===70&&moveCost(u,i)===1&&rannaTerrainProtection(u)===.25,'River rules');
   tiles[i].terrain=3;check(unitAttack(u)===70,'Overlapping river/mountain must not stack');
   RANNA_RIVER_TILES.delete(i);u.carriedBy=123;check(unitAttack(u)===14&&rannaTerrainProtection(u)===1,'Embarked guerrilla terrain bonus');delete u.carriedBy;
   const sea=tiles.findIndex(t=>t.owner<0);check(moveCost(u,sea)>=99999,'Guerrillas cannot walk on sea');
  }finally{RANNA_RIVER_TILES.delete(i);tiles[i].terrain=terrain;tech[4]=originalTech}
  for(const k of [0,6,8,9,11]){const p=BAEK_ART_PROFILES[k];check(Math.abs(p.width-70.4)<1e-8&&Math.abs(p.height-52.8)<1e-8,'Baekyang single 10% scale')}
  check((BAEK_ART_PROFILES[10].width||64)===64&&(BAEK_ART_PROFILES[10].height||48)===48,'Machine gun size changed');
  for(const k of [0,8,9,10])check(infantryArtProfile({f:6,type:k})===STETOPIA_INFANTRY_PROFILES[k],'Sielun infantry art');
  for(const k of [1,13,14])check(isStetopiaTank({f:6,type:k}),'Sielun tank art');
  for(const k of [2,3])check(isBaekArtillery({f:6,type:k})&&baekArtilleryProfile({f:6,type:k}).art===baekArtilleryProfile({f:2,type:k}).art,'Sielun artillery art');
  check(TOWED_ART[6]===TOWED_ART[2]&&isStetopiaCarrier({f:6,type:25}),'Sielun towed/carrier art');
  check(!isStetopiaTank({f:6,type:12})&&!infantryArtProfile({f:6,type:11}),'Missing art must preserve fallback');
  check(infantryArtProfile({f:4,type:27})===RANNA_INFANTRY_PROFILES[0],'Guerrilla art');
  const capital=cities.find(q=>q.f===4&&q.capital);check(canProduce(capital,27,1)&&!canProduce(cities.find(q=>q.f===5&&q.capital),27,1),'Special unit production country');
  check(unitPrice(27,1)===30&&navGoldCost(27,1)===0&&unitOil(27,1)===0,'Cheap production resources');
  const before=units.length,s=snapshot();check(s.appVersion==='1.10.74'&&s.units.some(u=>u.type===27),'Save includes new unit');
  s.diplomacy[4][5]=s.diplomacy[5][4]='neutral';migrateArmy(s);check(units.length===before&&units.filter(u=>u.rannaGuerrillaInitial).length===initial.length,'Loading duplicates initial guerrillas');
  check(diplomacy[4][5]==='neutral','Loading overwrote saved diplomacy');diplomacy[4][5]=diplomacy[5][4]='war';
  return {initialGuerrillas:initial.length,regions:regionCount,typeId:27};
 })()`);
 assert(report.initialGuerrillas>=16);
 console.log('PASS: v1.10.74 Ranna guerrilla terrain/combat/movement/production/save, Baekyang size, Sielun art, initial war:',report);
};
