const assert=require('assert');
module.exports=function({run}){
 const report=run(`(()=>{
  const check=(ok,message)=>{if(!ok)throw Error(message)};
  check(DEKPHUING_GUERRILLA===27&&TYPES.length>=29,'Existing unit IDs changed');
  const initial=units.filter(u=>u.rannaGuerrillaInitial),regionCount=new Set(initial.map(u=>tiles[u.tile].region)).size;
  check(initial.length>=16&&initial.length<=32,'Guerrilla initial army size');
  check(regionCount>=8,'Guerrillas must be spread across Ranna');
  check(new Set(initial.map(u=>u.tile)).size===initial.length,'Duplicate guerrilla tiles');
  for(const u of initial){check(u.f===4&&u.type===27&&u.level===1&&u.hp===90,'Initial guerrilla stats');check(tiles[u.tile].owner===4&&[2,3].includes(tiles[u.tile].terrain)&&!cityAt(u.tile),'Invalid guerrilla terrain');check(units.filter(v=>!v.carriedBy&&v.tile===u.tile).length===1,'Occupied spawn tile')}
  check(diplomacy[4][5]==='war'&&diplomacy[5][4]==='war','Ranna/Nagwol starting war');
  check(diplomacy[4][0]==='neutral'&&diplomacy[6][2]==='ally','Other diplomacy changed');
  for(const f of [0,2]){const guards=units.filter(u=>u.f===f&&u.initialInlandGuard);check(guards.length===10,'Initial inland guards missing for faction '+f);for(const u of guards)check(cities.some(q=>q.origin===f&&!q.capital&&!neighbors(q.tile).some(i=>tiles[i].owner<0)&&distance(q.tile,u.tile)<=2),'Guard is not protecting an inland city')}
  const i=tiles.findIndex((t,n)=>t.owner>=0&&!cityAt(n)&&!baseAt(n)&&!RANNA_RIVER_TILES.has(n));
  const terrain=tiles[i].terrain,originalTech=tech[4];tech[4]=0;
  const u={type:27,f:4,level:1,hp:90,tile:i},enemy={type:1,f:5,level:1,hp:unitMaxHp({type:1,f:5,level:1}),tile:i};
  try{
   tiles[i].terrain=1;check(unitAttack(u)===14&&unitMaxHp(u)===90,'Plain baseline');check(rannaTerrainProtection(u)===1,'Plain protection');
   for(const t of [2,3]){tiles[i].terrain=t;check(unitAttack(u)===28,'Terrain attack +100%');check(moveCost(u,i)===1,'Terrain movement');check(damage(enemy,u)===Math.round(guerrillaDamage(enemy,u)*.7),'30% direct damage reduction');check(bombProtection(u,null)===guerrillaBombProtection(u,null)*.7,'30% bombing reduction');for(const type of [20,21]){const heli={...enemy,type};check(damage(heli,u)===guerrillaDamage(heli,u),'Helicopter protection must apply once')}}
   tiles[i].terrain=1;RANNA_RIVER_TILES.add(i);check(unitAttack(u)===28&&moveCost(u,i)===1&&rannaTerrainProtection(u)===.7,'River rules');
   tiles[i].terrain=3;check(unitAttack(u)===28,'Overlapping river/mountain must not stack');
   RANNA_RIVER_TILES.delete(i);u.carriedBy=123;check(unitAttack(u)===14&&rannaTerrainProtection(u)===1,'Embarked guerrilla terrain bonus');delete u.carriedBy;
   const sea=tiles.findIndex(t=>t.owner<0);check(moveCost(u,sea)>=99999,'Guerrillas cannot walk on sea');
  }finally{RANNA_RIVER_TILES.delete(i);tiles[i].terrain=terrain;tech[4]=originalTech}
  for(const k of [0,6,8,9,11]){const p=BAEK_ART_PROFILES[k],extra=k===6?1.1:1;check(Math.abs(p.width-70.4*extra)<1e-8&&Math.abs(p.height-52.8*extra)<1e-8,'Baekyang baseline scale with additional 10% Black Legion size')}
  check((BAEK_ART_PROFILES[10].width||64)===64&&(BAEK_ART_PROFILES[10].height||48)===48,'Machine gun size changed');
  check(NAKWOL_INFANTRY_SCALE===1.1,'Nakwol infantry scale');
  check(photoCityProfile({origin:5,name:'월항',capital:false,level:2}).art===NAKWOL_CITY_ART[2]&&photoCityProfile({origin:5,name:'낙월성',capital:true,level:5})===null,'Nakwol city art/capital exception');
  check(Object.values(NAKWOL_CITY_ART).every(a=>a.idleReady&&a.idle.naturalWidth===1536),'Nakwol purple city artwork failed to load');
  for(const k of [0,8,9,10])check(infantryArtProfile({f:6,type:k})===STETOPIA_INFANTRY_PROFILES[k],'Sielun infantry art');
  for(const k of [1,13,14])check(isStetopiaTank({f:6,type:k}),'Sielun tank art');
  for(const k of [2,3])check(isBaekArtillery({f:6,type:k})&&baekArtilleryProfile({f:6,type:k}).art===baekArtilleryProfile({f:2,type:k}).art,'Sielun artillery art');
  for(const type of [2,3]){
   const u={f:4,type,tile:i,id:-100-type,level:1,artilleryFacing:1},art=type===2?rannaSPArt:rannaMLArt;
   check(isBaekArtillery(u)&&art.idleReady&&art.fireReady,'Ranna artillery images failed to load');
   for(const firing of [false,true]){
    const profile=baekArtilleryProfile(u,firing),image=art[firing?'fire':'idle'],box=baekArtilleryBox(u,firing);
    check(profile.art===art&&profile.w===image.naturalWidth&&profile.h===image.naturalHeight,'Ranna artillery source dimensions');
    check(Math.abs(box.w-64)<1e-8&&box.crop[0]+box.crop[2]<=image.naturalWidth&&box.crop[1]+box.crop[3]<=image.naturalHeight,'Ranna artillery crop bounds');
    check(Math.abs(box.bottom-baekArtilleryBox(u,false).bottom)<1e-8,'Ranna firing feet moved');
   }
   const p={x:200,y:200},right=baekArtilleryMuzzle(u,p);u.artilleryFacing=-1;const left=baekArtilleryMuzzle(u,p);
   check(right.x>p.x&&left.x<p.x&&Math.abs(right.x+left.x-2*p.x)<1e-8&&right.y===left.y&&right.y<p.y,'Ranna mirrored muzzle origin');
   const savedFx=fx.length;launchShot(u,{x:100,y:100},performance.now());
   check(fx.slice(savedFx).filter(e=>e.kind==='baekArtilleryShell').length===(type===3?5:1),'Ranna shell/rocket volley');
   fx.length=savedFx;fireMotions.delete(u.id);baekArtilleryShots.delete(u.id);
  }
  check(!isBaekArtillery({f:4,type:1})&&!isBaekArtillery({f:3,type:12}),'Artillery selector leaked to armor units');
  for(const type of [2,3])check(isBaekArtillery({f:3,type})&&baekArtilleryProfile({f:3,type}).art===(type===2?ayriaSPArt:ayriaMLArt)&&baekArtilleryProfile({f:3,type}).art!==(type===2?rannaSPArt:rannaMLArt),'Ayria must use its separate desert artillery art');
  check(TOWED_ART[6]===TOWED_ART[2]&&isStetopiaCarrier({f:6,type:25}),'Sielun towed/carrier art');
  check(!isStetopiaTank({f:6,type:12})&&!infantryArtProfile({f:6,type:12}),'Missing armor art must preserve fallback');
  check(infantryArtProfile({f:6,type:11}).art===STETOPIA_INFANTRY_PROFILES[0].art&&infantryArtProfile({f:6,type:11}).burst,'Sielun motorized infantry must use rifle burst art');
  check(infantryArtProfile({f:4,type:27}).art===rannaGuerrillaArt&&rannaGuerrillaArt.idle.src==='ranna-guerrilla-idle.png'&&rannaGuerrillaArt.fire.src==='ranna-guerrilla-fire.png','Guerrilla art');
  const capital=cities.find(q=>q.f===4&&q.capital);check(canProduce(capital,27,1)&&!canProduce(cities.find(q=>q.f===5&&q.capital),27,1),'Special unit production country');
  check(unitPrice(27,1)===30&&navGoldCost(27,1)===0&&unitOil(27,1)===0,'Cheap production resources');
  const before=units.length,s=snapshot();check(s.appVersion===APP_VERSION&&s.units.some(u=>u.type===27),'Save includes new unit');
  s.diplomacy[4][5]=s.diplomacy[5][4]='neutral';migrateArmy(s);check(units.length===before&&units.filter(u=>u.rannaGuerrillaInitial).length===initial.length,'Loading duplicates initial guerrillas');
  check(diplomacy[4][5]==='neutral','Loading overwrote saved diplomacy');diplomacy[4][5]=diplomacy[5][4]='war';
  return {initialGuerrillas:initial.length,regions:regionCount,typeId:27};
 })()`);
 assert(report.initialGuerrillas>=16);
 console.log('PASS: v1.10.76 Ranna special and diplomacy, inland starting guards, Nakwol city art and infantry scale:',report);
};





