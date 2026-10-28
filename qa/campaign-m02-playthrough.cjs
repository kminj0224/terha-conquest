'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run,drain}){
 run(`window.m02Autoplay=async function(production,route,prepared=false){
  if(activeScenario)CampaignBattle.leave();let carry=null;
  if(prepared){CampaignBattle.start(null,1);const hero=units.find(u=>u.missionRole==='iron-crown');hero.tile=CampaignBattle.inspect().progress.exit;CampaignBattle.check();carry=JSON.parse(JSON.stringify(snapshot()));CampaignBattle.leave()}
  CampaignBattle.start(null,1,{id:'iron-crown-m02',route,carry});
  rngSeed=74123;let built=0,losses=0;const initial=units.filter(u=>u.f===2).length;console.log('M02_SETUP',JSON.stringify({route,prepared,foodIncome:foodIncome(2),food:food[2],army:units.filter(u=>u.f===2).map(u=>({type:u.type,hp:u.hp,attack:unitAttack(u)}))}));
  for(let step=0;step<65&&!CampaignBattle.inspect().progress.result;step++){
   if(production)for(const q of cities.filter(q=>q.f===2)){
    const force=units.filter(u=>u.f===2),rifles=force.filter(u=>u.type===0).length;
    const pool=rifles<3?[0,8,9]:[2,9,1,16,0,8];
    let k=pool[(turn+q.id)%pool.length];if(prepared){const knights=force.filter(u=>u.type===18).length;k=knights<1&&food[2]>=unitPrice(18,1)?18:rifles<3?0:force.filter(u=>u.type===10).length<4?10:2;}
    if(produce(q,k,1,false)||prepared&&produce(q,0,1,false))built++;
   }
   if(prepared){const h=units.find(u=>u.missionRole==='iron-crown');if(h&&h.hp<unitMaxHp(h)*.75&&canResupply(h))repair(h)}
   aiTurnActive=true;enableAIFastForward();
   const army=units.filter(u=>u.f===2).sort((a,b)=>(a.missionRole?1:0)-(b.missionRole?1:0));
   for(const u of army){
    if(!units.includes(u))continue;
    for(let action=0;action<5&&u.ap>0&&units.includes(u);action++){
     const hold=prepared&&(turn<18||u.missionRole&&u.hp<unitMaxHp(u)*.65);
     if(hold&&u.missionRole&&u.tile!==cities[0].tile&&mayMove(u)&&reachable(u).costs.has(cities[0].tile)){moveUnit(u,cities[0].tile,true);continue}
     const enemies=units.filter(v=>atWar(u.f,v.f)&&v.hp>0),targets=enemies.filter(v=>canAttack(u,v));
     if(targets.length){targets.sort((a,b)=>(damage(u,b)>=b.hp?1000:0)+unitAttack(b)-b.hp*.05-((damage(u,a)>=a.hp?1000:0)+unitAttack(a)-a.hp*.05));await attack(u,targets[0],true);continue}
     if(prepared&&u.type===0&&mayMove(u)){
      const take=cities.filter(q=>q.f===1&&q.hp<=0&&!unitAt(q.tile)&&reachable(u).costs.has(q.tile)).sort((a,b)=>distance(u.tile,a.tile)-distance(u.tile,b.tile))[0];
      if(take){moveUnit(u,take.tile,true);continue}
     }
     const forts=cities.filter(q=>q.f===1&&canAttackCity(u,q));
     if(forts.length){forts.sort((a,b)=>([1,2].includes(b.id)?1:0)-([1,2].includes(a.id)?1:0)||a.hp-b.hp);await attackCity(u,forts[0],true);continue}
     if(!mayMove(u))break;
     const hero=units.find(v=>v.missionRole==='iron-crown'),threat=enemies.filter(v=>hero&&distance(v.tile,hero.tile)<7||distance(v.tile,cities[0].tile)<6);
     const goals=cities.filter(q=>q.f!==2&&[1,2,3].includes(q.id));
     const goal=goals.sort((a,b)=>distance(u.tile,a.tile)-distance(u.tile,b.tile))[0];
     const near=threat.length?threat:enemies;
     const target=near.sort((a,b)=>distance(u.tile,a.tile)-distance(u.tile,b.tile))[0];
     const targetTile=u.missionRole&&cities[1].f===2&&cities[2].f===2&&near.length===0?CampaignBattle.inspect().progress.exit:target?.tile??goal?.tile??CampaignBattle.inspect().progress.exit;
     const options=[...reachable(u).costs.keys()].filter(i=>i!==u.tile);
     const score=i=>{
      let d=distance(i,targetTile);
      if(goal&&u.type===0&&goal.hp===0)d=distance(i,goal.tile)-3;
      if(target){const range=navalTargetRange(u,target),r=distance(i,target.tile);d=Math.abs(r-Math.max(1,range))*.9+distance(i,targetTile)*.1;if(TYPES[u.type].branch==='artillery'&&r<2)d+=8}
      if(u.missionRole&&u.hp<unitMaxHp(u)*.4)d+=enemies.filter(v=>distance(i,v.tile)<=TYPES[v.type].range+1).length*4;
      if(prepared&&goal){
       if(u.type===0&&goal.hp<=0)d=distance(i,goal.tile)-10;
       else if(TYPES[u.type].branch==='artillery'&&goal.hp>0)d=Math.abs(distance(i,goal.tile)-TYPES[u.type].range)*.8+(target?Math.max(0,2-distance(i,target.tile))*5:0);
       else if(!u.missionRole)d+=distance(i,goal.tile)*.15;
      }
      if(hold){
       const anchor=cities[0].tile,dist=distance(i,anchor);
       d=(u.missionRole?dist*5:Math.abs(dist-(TYPES[u.type].branch==='artillery'?2:1))*2);
       if(target)d+=Math.abs(distance(i,target.tile)-Math.max(1,TYPES[u.type].range))*.2;
       if(TYPES[u.type].branch==='artillery'&&target&&distance(i,target.tile)<=1)d+=10;
      }
      return d;
     };
     options.sort((a,b)=>score(a)-score(b));if(options[0]===undefined||!moveUnit(u,options[0],true))break;
    }
   }
   aiTurnActive=false;aiFastForward=false;CampaignBattle.check();if(CampaignBattle.inspect().progress.result)break;
   const enemyTurn=endTurn();enableAIFastForward();await enemyTurn;
   losses=initial+built-units.filter(u=>u.f===2).length;
   if(turn%5===0)console.log('M02_PLAY',JSON.stringify({production,route,turn,built,losses,ours:units.filter(u=>u.f===2).length,enemy:units.filter(u=>u.f===1).length,food:food[2],gold:money[2],types:units.filter(u=>u.f===2).map(u=>u.type),hero:units.find(u=>u.missionRole)?.hp,cities:cities.map(q=>q.f)}));
  }
  const result={production,route,prepared,turn,built,losses,result:CampaignBattle.inspect().progress.result||'ongoing',hero:units.find(u=>u.missionRole)?.hp};
  console.log('M02_PLAY_RESULT',JSON.stringify(result));CampaignBattle.leave();return result;
 }`);
 // A reproducible tactical bot uses only real orders and the actual enemy AI.
 const without=await run('m02Autoplay(false,"recapture")');
 assert.notEqual(without.result,'won','Starting army alone must not win the reference battle');
 const withProduction=await run('m02Autoplay(true,"pay")');
 assert(withProduction.built>0);
 const prepared=await run('m02Autoplay(true,"recapture",true)');
 assert(prepared.built>0); // Results are reported for balance review, not a substitute for human testing.
};
