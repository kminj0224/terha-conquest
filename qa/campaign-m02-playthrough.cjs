'use strict';
const assert=require('node:assert/strict');
module.exports=async function({run,drain}){
 run(`window.m02Autoplay=async function(production,route,prepared=false){
  if(activeScenario)CampaignBattle.leave();let carry=null;
  if(prepared){CampaignBattle.start(null,1);const hero=units.find(u=>u.missionRole==='iron-crown');hero.tile=CampaignBattle.inspect().progress.exit;CampaignBattle.check();carry=JSON.parse(JSON.stringify(snapshot()));CampaignBattle.leave()}
  CampaignBattle.start(null,1,{id:'iron-crown-m02',route,carry});
  rngSeed=74123;let built=0,losses=0;const initial=units.filter(u=>u.f===2).length;console.log('M02_SETUP',JSON.stringify({route,prepared,foodIncome:foodIncome(2),food:food[2],army:units.filter(u=>u.f===2).map(u=>({type:u.type,hp:u.hp,attack:unitAttack(u)}))}));
  function routeCosts(u,goal){
   const costs=new Map([[goal,0]]),queue=[goal];
   for(let n=0;n<queue.length;n++)for(const i of neighbors(queue[n])){
    if(costs.has(i)||!CampaignBattle.contains(i)||moveCost(u,i)>=999)continue;
    const blocker=unitAt(i),city=cityAt(i);
    if(blocker&&blocker!==u||city&&city.f!==u.f&&city.hp>0)continue;
    costs.set(i,costs.get(queue[n])+1);queue.push(i);
   }
   return costs;
  }
  for(let step=0;step<65&&!CampaignBattle.inspect().progress.result;step++){
   if(prepared&&tech[2]<5&&!militaryResearchJobs[2]&&money[2]>=(tech[2]+1)*450){selectCity(cities[0],true);research();}
   const extraction=prepared&&cities[1].f===2&&cities[2].f===2;
   if(production&&!extraction)for(const q of cities.filter(q=>q.f===2)){
    const force=units.filter(u=>u.f===2),rifles=force.filter(u=>u.type===0).length;
    const pool=rifles<3?[0,8,9]:[2,9,1,16,0,8];
    let k=pool[(turn+q.id)%pool.length];if(prepared){k=rifles<4?0:force.filter(u=>u.type===2).length<2?2:force.filter(u=>u.type===1).length<3?1:force.filter(u=>u.type===9).length<3?9:10;}
    if(produce(q,k,prepared&&k!==0?4:1,false)||prepared&&produce(q,0,1,false))built++;
   }
   if(prepared){const h=units.find(u=>u.missionRole==='iron-crown');if(h&&h.hp<unitMaxHp(h)*.75&&canResupply(h))repair(h)}
   aiTurnActive=true;enableAIFastForward();
   const army=units.filter(u=>u.f===2).sort((a,b)=>extraction?(a.missionRole?-1:0)-(b.missionRole?-1:0):(a.missionRole?1:0)-(b.missionRole?1:0));
   for(const u of army){
    if(!units.includes(u))continue;
    for(let action=0;action<5&&u.ap>0&&units.includes(u);action++){
     const exit=CampaignBattle.inspect().progress.exit,extract=prepared&&cities[1].f===2&&cities[2].f===2;
     if(extract&&mayMove(u)){
      const options=[...reachable(u).costs.keys()].filter(i=>i!==u.tile);
      if(u.missionRole){const costs=routeCosts(u,exit);options.sort((a,b)=>(costs.get(a)??Infinity)-(costs.get(b)??Infinity));if(options[0]!==undefined&&costs.has(options[0])&&(costs.get(options[0])<(costs.get(u.tile)??Infinity))){moveUnit(u,options[0],true);continue}}
      else{
       // Keep friendly traffic and reinforcement entry cells clear while the fortress exits.
       const anchor=cities[1].tile,origin=IRON_CROWN_CAMPAIGN.battle2.map.origin;
       const edge=i=>tiles[i].x-origin.x>=20||tiles[i].y-origin.y<=2||tiles[i].y-origin.y>=13;
       const score=i=>(edge(i)?100:0)+distance(i,anchor);
       options.sort((a,b)=>score(a)-score(b));
       if(options[0]!==undefined&&(edge(u.tile)||distance(u.tile,exit)<4)&&score(options[0])<score(u.tile)){moveUnit(u,options[0],true);continue}
      }
     }
     if(extract){
      const waves=units.filter(v=>atWar(u.f,v.f)&&v.missionWave&&v.hp>0);
      const shot=waves.filter(v=>canAttack(u,v)).sort((a,b)=>a.hp-b.hp)[0];
      if(shot){await attack(u,shot,true);continue}
      if(!u.missionRole&&mayMove(u)&&waves.length){
       const target=waves.sort((a,b)=>distance(u.tile,a.tile)-distance(u.tile,b.tile))[0],range=Math.max(1,navalTargetRange(u,target));
       const score=i=>Math.abs(distance(i,target.tile)-range);
       const options=[...reachable(u).costs.keys()].filter(i=>i!==u.tile).sort((a,b)=>score(a)-score(b));
       if(options[0]!==undefined&&score(options[0])<score(u.tile)){moveUnit(u,options[0],true);continue}
      }
      break;
     }
     const hold=prepared&&!extract&&u.missionRole&&u.hp<unitMaxHp(u)*.65;
     if(hold&&u.missionRole&&u.tile!==cities[0].tile&&mayMove(u)&&reachable(u).costs.has(cities[0].tile)){moveUnit(u,cities[0].tile,true);continue}
     const enemies=units.filter(v=>atWar(u.f,v.f)&&v.hp>0);
     if(prepared&&turn<8){
      const shot=enemies.filter(v=>canAttack(u,v)).sort((a,b)=>a.hp-b.hp)[0];if(shot){await attack(u,shot,true);continue}
      if(mayMove(u)){const radius=u.missionRole?0:TYPES[u.type].branch==='artillery'?2:3,anchor=cities[0].tile,spots=[...reachable(u).costs.keys()].filter(i=>i!==u.tile).sort((a,b)=>Math.abs(distance(a,anchor)-radius)-Math.abs(distance(b,anchor)-radius));if(spots[0]!==undefined&&Math.abs(distance(spots[0],anchor)-radius)<Math.abs(distance(u.tile,anchor)-radius)){moveUnit(u,spots[0],true);continue}}
      break;
     }
     if(prepared){const breach=cities.find(q=>[1,2].includes(q.id)&&q.f===1&&q.hp>0&&canAttackCity(u,q));if(breach&&TYPES[u.type].branch==='artillery'){await attackCity(u,breach,true);continue}}
     // Fire before advancing into a defended point; do not march past a shot.
     if(prepared){const immediate=enemies.filter(v=>canAttack(u,v));if(immediate.length){immediate.sort((a,b)=>(damage(u,b)>=b.hp?1000:0)+unitAttack(b)-b.hp*.05-((damage(u,a)>=a.hp?1000:0)+unitAttack(a)-a.hp*.05));await attack(u,immediate[0],true);continue}}

     if(prepared&&!hold&&!(cities[1].f===2&&cities[2].f===2)){
      const main=cities.find(q=>[1,2].includes(q.id)&&q.f===1),operationCities=main?[main]:[];aiObjectives[2]=main||null;
      const command=aiStep(u,operationCities);
      if(command?.attack){await attack(u,command.attack,true);continue}
      if(command?.city){await attackCity(u,command.city,true);continue}
      if(command?.move!==undefined){moveUnit(u,command.move,true);continue}
      if(operationCities.some(q=>q.f===1))break;
     }
     if(prepared&&u.type===0&&mayMove(u)){
      const take=cities.filter(q=>q.f===1&&q.hp<=0&&!unitAt(q.tile)&&reachable(u).costs.has(q.tile)).sort((a,b)=>distance(u.tile,a.tile)-distance(u.tile,b.tile))[0];
      if(take){moveUnit(u,take.tile,true);continue}
     }
     if(prepared&&!hold&&mayMove(u)){
      const goal=cities.filter(q=>q.f===1&&[1,2,3].includes(q.id)).sort((a,b)=>distance(u.tile,a.tile)-distance(u.tile,b.tile))[0];
      if(goal){const wanted=u.type===0?0:TYPES[u.type].range,at=distance(u.tile,goal.tile);
       if(at>wanted){const options=[...reachable(u).costs.keys()].filter(i=>i!==u.tile&&distance(i,goal.tile)<at);
        const risk=i=>enemies.reduce((n,v)=>n+(distance(i,v.tile)<=TYPES[v.type].range?1:0),0);
        options.sort((a,b)=>Math.max(wanted,distance(a,goal.tile))-Math.max(wanted,distance(b,goal.tile))+(risk(a)-risk(b))*.12);
        if(options[0]!==undefined){moveUnit(u,options[0],true);continue}
       }
      }
     }
     if(prepared&&!hold){
      const siege=cities.filter(q=>q.f===1&&[1,2].includes(q.id)&&canAttackCity(u,q)&&(TYPES[u.type].branch==='artillery'&&q.hp>1||u.type===0&&q.hp<=200)).sort((a,b)=>a.hp-b.hp)[0];
      if(siege){await attackCity(u,siege,true);continue}
     }
     const targets=enemies.filter(v=>canAttack(u,v));
     if(targets.length){targets.sort((a,b)=>(damage(u,b)>=b.hp?1000:0)+unitAttack(b)-b.hp*.05-((damage(u,a)>=a.hp?1000:0)+unitAttack(a)-a.hp*.05));await attack(u,targets[0],true);continue}
     const forts=cities.filter(q=>q.f===1&&canAttackCity(u,q));
     if(forts.length){forts.sort((a,b)=>([1,2].includes(b.id)?1:0)-([1,2].includes(a.id)?1:0)||a.hp-b.hp);await attackCity(u,forts[0],true);continue}
     if(!mayMove(u))break;
     const hero=units.find(v=>v.missionRole==='iron-crown'),threat=enemies.filter(v=>hero&&distance(v.tile,hero.tile)<7||distance(v.tile,cities[0].tile)<6);
     const goals=cities.filter(q=>q.f!==2&&[1,2,3].includes(q.id));
     const goal=goals.sort((a,b)=>distance(u.tile,a.tile)-distance(u.tile,b.tile))[0];
     const remainingWaves=enemies.filter(v=>v.missionWave);const near=prepared&&cities[1].f===2&&cities[2].f===2&&remainingWaves.length?remainingWaves:threat.length?threat:enemies;
     const target=near.sort((a,b)=>distance(u.tile,a.tile)-distance(u.tile,b.tile))[0];
     const targetTile=u.missionRole&&cities[1].f===2&&cities[2].f===2&&near.length===0?CampaignBattle.inspect().progress.exit:target?.tile??goal?.tile??(u.missionRole?CampaignBattle.inspect().progress.exit:cities[0].tile);
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
   if(turn%5===0)console.log('M02_PLAY',JSON.stringify({production,route,turn,built,losses,ours:units.filter(u=>u.f===2).length,enemy:units.filter(u=>u.f===1).length,food:food[2],oil:oil[2],tech:tech[2],gold:money[2],types:units.filter(u=>u.f===2).map(u=>u.type),hero:units.find(u=>u.missionRole)?.hp,cities:cities.map(q=>q.f)}));
  }
  const result={production,route,prepared,turn,built,losses,result:CampaignBattle.inspect().progress.result||'ongoing',hero:units.find(u=>u.missionRole)?.hp};
  if(result.result==='won')window.lastM02Victory=JSON.parse(JSON.stringify(snapshot()));
  console.log('M02_PLAY_RESULT',JSON.stringify(result));CampaignBattle.leave();return result;
 }`);
 // A reproducible tactical bot uses only real orders and the actual enemy AI.
 const without=await run('m02Autoplay(false,"recapture")');
 assert.notEqual(without.result,'won','Starting army alone must not win the reference battle');
 const withProduction=await run('m02Autoplay(true,"pay")');
 assert(withProduction.built>0);
 const prepared=await run('m02Autoplay(true,"recapture",true)');
 assert.equal(prepared.result,'won','Prepared native production/research strategy must complete mission02');
 const paid=await run('m02Autoplay(true,"pay",true)');
 assert.equal(paid.result,'won','Paid passage must remain a winnable route'); // Results are reported for balance review, not a substitute for human testing.
};
