const assert=require('assert');
module.exports=async function({run}){
 const report=await run(`(async()=>{
 const check=(v,m)=>{if(!v)throw Error(m)};
 setup();started=true;setAppScreen('game');player=0;
 money[0]=300000;oil[0]=10000;menuMode=false;busy=false;sound=false;
 const capital=cities.find(q=>q.f===0&&q.capital);
 // Verify the same upgraded production formula is used by the city UI and treasury.
 const oilRates=[];
 for(let level=1;level<=5;level++){
  const sample={...capital,level,capital:false,nukeUntil:0};
  const original=originalOilYield(sample,level).oil,current=cityYield(sample,level).oil;
  check(current===Math.round(original*2.5),'2.5x oil yield level '+level);
  oilRates.push(current);
 }
 check(oilIncome(0)===cities.filter(q=>q.f===0).reduce((sum,q)=>sum+cityYield(q).oil,0),'Treasury oil must use displayed city yields');
 // AA and SAM must reduce true city hit numbers, including the carrier.
 const city=cities.find(q=>q.f!==0&&atWar(0,q.f)&&q.hp>0);
 check(!!city,'Must find a hostile city');
 const cityBackup={...city},savedBases=missileBases;
 try{
  city.aa=true;missileBases=[{id:9998,kind:'sam',f:city.f,tile:city.tile,remaining:0,hp:34000}];
  check(cityAirStrikeDamage('fighter',city)===450,'AA+SAM fighter damage');
  const carrier={type:25,f:0,level:1,tile:capital.tile,hp:unitMaxHp({type:25,f:0,level:1})};
  check(siegeDamage(carrier,city)===450,'Carrier defense-adjusted 450 city damage, not 2,000');
 }finally{Object.assign(city,cityBackup);missileBases=savedBases}
 const oldUnits=units,sourceTile=city.tile,oldDip=diplomacy[0][city.f],oldDipReverse=diplomacy[city.f][0];
 const savedMoney=money[0],savedOil=oil[0];
 try{
  diplomacy[0][city.f]=diplomacy[city.f][0]='war';units=[];missileBases=[];
  city.aa=false;city.hp=cityMaxHp(city);city.lastAttackedTurn=turn;
  const gunTile=neighbors(city.tile).find(i=>tiles[i].owner>=0);
  check(gunTile!==undefined,'No gun position next to city');
  const gun=makeUnit(0,2,gunTile,1),garrison=makeUnit(city.f,0,city.tile,1);
  const raw=originalGarrisonDamage(gun,garrison),protectedDamage=damage(gun,garrison);
  check(protectedDamage===Math.round(raw*.7),'City garrison damage must be reduced by 30%');
  const cityBefore=city.hp,unitBefore=garrison.hp;
  check(await attack(gun,garrison,true),'Direct city garrison attack failed');
  check(city.hp<cityBefore&&garrison.hp===unitBefore-protectedDamage,'City and garrison must both lose health');
  check(fx.some(e=>e.kind==='blast'&&e.damage===cityBefore-city.hp),'City damage number must match actual siege damage');
  // Verify air raids hit both on the same target and report the effective defensive damage.
  units=[];city.hp=cityMaxHp(city);city.aa=true;
  const occupant=makeUnit(city.f,0,city.tile,2);
  const base=capital;
  const forwardAirfield={...capital,tile:city.tile,level:5,airport:true,nukeUntil:0};
  base.airport=true;
  base.nukeUntil=0;
  money[0]=300000;oil[0]=10000;missileBases=[];
  const oilD=oil[0],cityHP=city.hp,unitHP=occupant.hp;
  check(canAirStrike(forwardAirfield,'fighter',city.tile),'Forward test airport must reach occupied city');
  const kind='fighter',expected=cityAirStrikeDamage(kind,city);
  check(await airStrike(forwardAirfield,kind,city.tile,true),'Garrison airstrike failed');
  check(city.hp===cityHP-expected,'Airstrike city HP differs from AA-adjusted number');
  check(occupant.hp<unitHP,'Garrison unit HP must fall on airstrike');
  check(fx.some(e=>e.kind==='blast'&&e.damage===expected),'Displayed airstrike city hit must equal actual reduced damage');
  check(oil[0]===oilD-AIR_MISSIONS[kind].oil,'Sortie oil cost changed');
  // Two back-to-back airdrops remain targeted, and the X cancels targeting.
  units=[];missileBases=[];money[0]=300000;oil[0]=10000;
  const eligible=()=>tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&!unitAt(i)&&!baseAt(i)&&distance(i,base.tile)<=60);
  const first=eligible();check(first>=0,'No valid air drop tile');
  selectCity(base,true);beginAirTarget(base,'transport');
  check(await airStrike(base,'transport',first,false),'First airborne mission failed');
  check(airTarget?.type==='transport'&&selected?.id===base.id,'Transport aim must persist after action');
  check($('selectionAirCancel').style.display==='inline-block','Bottom X must stay visible');
  const second=eligible();check(second>=0&&second!==first,'No second drop tile');
  check(await airStrike(base,'transport',second,false),'Repeat airborne mission failed');
  check(airTarget?.type==='transport'&&unitAt(first)?.type===AIRBORNE_TROOPER&&unitAt(second)?.type===AIRBORNE_TROOPER,'Second air drop must keep dedicated paratroopers and aim');
  $('selectionAirCancel').onclick();
  check(airTarget===null,'X must cancel continued airport targeting');
  return {oilRates,cityDamage:expected,boarding:'preserved',repeatDrops:2,cityAndGarrison:true};
 }finally{
  units=oldUnits;missileBases=savedBases;money[0]=savedMoney;oil[0]=savedOil;
  diplomacy[0][city.f]=oldDip;diplomacy[city.f][0]=oldDipReverse;
  for(const k of Object.keys(city))delete city[k];Object.assign(city,cityBackup);
  buildRegions();airTarget=null;
 }
 })()`);
 assert.equal(report.repeatDrops,2);
 console.log('PASS v1.10.79 oil 2.5x, city garrison damage, effective AA/SAM numbers and repeatable airdrops:',report);
};
