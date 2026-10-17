const assert=require('assert');
module.exports=async function({run}){
 const result=await run(`(async()=>{
  const check=(ok,msg)=>{if(!ok)throw Error(msg)},q=cities.find(q=>q.f===1&&q.capital);
  const original={...q},oldUnits=units,oldBases=missileBases,oldMoney=money[0],oldOil=oil[0],oldSound=sound,oldFx=fx;
  const source={name:'Test airport',f:0,tile:q.tile,level:5,airport:true,airTurn:-1,nukeUntil:0},report={};
  try{
   units=[];missileBases=[];money[0]=100000;oil[0]=10000;sound=false;fx=[];q.level=5;q.aa=false;q.nukeUntil=0;
   const oilBefore=oil[0];
   for(const [type,expected]of [['fighter',2000],['bomber',20000],['strategic',40000]]){
    q.hp=120000;
    check(cityAirStrikeDamage(type,q)===expected,'City air damage balance: '+type);
    check(await airStrike(source,type,q.tile,true),'Air strike did not execute: '+type);
    check(q.hp===120000-expected,'Actual city HP loss: '+type);
    check(canAirStrike(source,type,q.tile),'Airport must allow another sortie in the same turn');report[type]=expected;
   }
   check(oil[0]===oilBefore-170,'Aircraft sorties cost 20/50/100 oil');
   oil[0]=19;check(!canAirStrike(source,'fighter',q.tile),'Fighter must require 20 oil');oil[0]=49;check(!canAirStrike(source,'bomber',q.tile),'Bomber must require 50 oil');oil[0]=99;check(!canAirStrike(source,'strategic',q.tile),'Strategic bomber must require 100 oil');oil[0]=oilBefore-170;
   q.aa=true;check(cityAirStrikeDamage('strategic',q)===18000,'AA protection must still apply');
   q.aa=false;
   for(const type of [20,21,25]){const u={type,f:0,level:1,hp:unitMaxHp({type,f:0,level:1}),tile:q.tile},d=siegeDamage(u,q);check(type===25?d===2000:d>=2000&&d<=3000,'Carrier city damage equals fighter 2,000');const base={...q,kind:'sam'};check(siegeDamage(u,base)===previousAirSiegeDamage(u,base),'Defense facility damage changed')}
   for(const type of [0,1,2]){const u={type,f:0,level:1,hp:unitMaxHp({type,f:0,level:1}),tile:q.tile};check(siegeDamage(u,q)===previousAirSiegeDamage(u,q),'Ground siege damage changed')}
   check(AIR_MISSIONS.fighter.cost===1000&&AIR_MISSIONS.bomber.cost===3000&&AIR_MISSIONS.strategic.cost===10000,'Aircraft gold costs incorrect');
   check(AIR_MISSIONS.transport.cost===500&&AIR_MISSIONS.transport.oil===10&&AIR_MISSIONS.transport.range>30,'Air transport spec incorrect');
   const empty=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&!unitAt(i)&&!baseAt(i)&&distance(i,source.tile)<=60);
   check(empty>=0&&airDropTileAvailable(empty),'No eligible drop tile');
   const troopCount=units.length,goldBefore=money[0],oilBeforeDrop=oil[0];
   check(await airStrike(source,'transport',empty,true),'Air transport deployment failed');
   const dropped=unitAt(empty);
   check(units.length===troopCount+1&&dropped&&dropped.f===0&&dropped.type===0&&dropped.level===4,'Transport must deploy national level-four riflemen');
   check(!mayMove(dropped)&&!mayFire(dropped),'Newly dropped troops should wait until next turn');
   check(money[0]===goldBefore-500&&oil[0]===oilBeforeDrop-10,'Drop must cost gold 500 and oil 10');
   check(!airDropTileAvailable(empty),'Occupied landing tile must be rejected');
   const sea=tiles.findIndex(t=>t.owner<0);
   check(!airDropTileAvailable(sea),'Drop onto water must be forbidden');
   q.hp=0;check(airDropTileAvailable(q.tile),'Empty destroyed city should allow a drop');
   check(await airStrike(source,'transport',q.tile,true),'Destroyed-city air deployment failed');
   check(q.f===0&&unitAt(q.tile)?.level===4,'Riflemen must capture the destroyed enemy city');
   check(rannaGuerrillaArt.idleReady&&rannaGuerrillaArt.fireReady,'Guerrilla images failed to decode');
   check(rannaGuerrillaArt.idle.naturalWidth===1447&&rannaGuerrillaArt.fire.naturalWidth===1448,'Wrong guerrilla images');
   return report;
  }finally{
   for(const key of Object.keys(q))delete q[key];Object.assign(q,original);
   units=oldUnits;buildRegions();missileBases=oldBases;money[0]=oldMoney;oil[0]=oldOil;sound=oldSound;fx=oldFx;
  }
 })()`);
 assert.equal(result.strategic,40000);
 console.log('PASS: fighter/bomber/strategic city damage 2k/20k/40k, sortie costs 20/50/100 oil, carrier 2k, level-4 parachute drop and city capture:',result);
};
