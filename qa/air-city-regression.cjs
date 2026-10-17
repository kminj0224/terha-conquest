const assert=require('assert');
module.exports=async function({run}){
 const result=await run(`(async()=>{
  const check=(ok,msg)=>{if(!ok)throw Error(msg)},q=cities.find(q=>q.f===1&&q.capital);
  const original={...q},oldUnits=units,oldBases=missileBases,oldMoney=money[0],oldOil=oil[0],oldSound=sound,oldFx=fx;
  const source={name:'Test airport',f:0,tile:q.tile,level:5,airport:true,airTurn:-1,nukeUntil:0},report={};
  try{
   units=[];missileBases=[];money[0]=100000;oil[0]=10000;sound=false;fx=[];q.level=5;q.aa=false;q.nukeUntil=0;
   for(const [type,expected]of [['fighter',3960],['bomber',7320],['strategic',16200]]){
    q.hp=120000;source.airTurn=-1;
    check(cityAirStrikeDamage(type,q)===expected,'City air damage balance: '+type);
    check(await airStrike(source,type,q.tile,true),'Air strike did not execute: '+type);
    check(q.hp===120000-expected,'Actual city HP loss: '+type);report[type]=expected;
   }
   q.aa=true;check(cityAirStrikeDamage('strategic',q)===7290,'AA protection must still apply');
   q.aa=false;
   for(const type of [20,21,25]){const u={type,f:0,level:1,hp:unitMaxHp({type,f:0,level:1}),tile:q.tile};check(siegeDamage(u,q)===previousAirSiegeDamage(u,q)*10,'Air support siege bonus');const base={...q,kind:'sam'};check(siegeDamage(u,base)===previousAirSiegeDamage(u,base),'Defense facility damage changed')}
   for(const type of [0,1,2]){const u={type,f:0,level:1,hp:unitMaxHp({type,f:0,level:1}),tile:q.tile};check(siegeDamage(u,q)===previousAirSiegeDamage(u,q),'Ground siege damage changed')}
   check(rannaGuerrillaArt.idleReady&&rannaGuerrillaArt.fireReady,'Guerrilla images failed to decode');
   check(rannaGuerrillaArt.idle.naturalWidth===1447&&rannaGuerrillaArt.fire.naturalWidth===1448,'Wrong guerrilla images');
   return report;
  }finally{
   for(const key of Object.keys(q))delete q[key];Object.assign(q,original);
   units=oldUnits;missileBases=oldBases;money[0]=oldMoney;oil[0]=oldOil;sound=oldSound;fx=oldFx;
  }
 })()`);
 assert.equal(result.strategic,16200);
 console.log('PASS: supplied idle/fire images; actual airport strikes against cities, retained AA protection, air support siege and unchanged ground siege:',result);
};
