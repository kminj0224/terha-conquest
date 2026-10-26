'use strict';
const assert=require('assert');
module.exports=async function({run}){
 const result=await run(`(async()=>{
 const check=(v,m)=>{if(!v)throw Error(m)};
 setup();player=0;started=true;busy=false;setAppScreen('game');money[0]=500000;oil[0]=10000;
 const q=cities.find(q=>q.f===0&&q.capital);q.level=5;q.lab=true;selectCity(q,true);cityCommandOpen('science');
 const rows=()=>$('cityCommandContent').children.filter(e=>e.className?.includes('cityActionRow'));
 check(rows().length===5,'Military plus exactly four national research rows');
 check(rows().filter(e=>e.children[0].textContent.includes('연비 개선')).length===1,'Exactly one fuel row');
 const descriptions=[];
 for(const key of Object.keys(RESEARCH_DEFS)){
  const d=RESEARCH_DEFS[key],row=rows().find(e=>e.children[0].textContent.includes(d.name));check(row,'Missing research '+key);
  if(key==='supplyRoutes')check(row.children[0].textContent.includes('석유 450'),'Supply oil cost visible');
  row.children[1].onclick();check($('modal').textContent.includes(d.description),'Actual popup must use '+key+' effect');
  descriptions.push(d.description);$('cityInfoX').onclick();
 }
 check(new Set(descriptions).size===4,'All national descriptions unique');
 strategicResearch[0].fuelEfficiency=true;cityCommandOpen('science');
 check(rows().filter(e=>e.children[0].textContent.includes('연비 개선')).length===1&&rows().find(e=>e.children[0].textContent.includes('연비 개선')).children[0].textContent.includes('완료'),'Completed fuel row unique');
 selectCity(cities.find(c=>c.f===0&&c.id!==q.id),true);cityCommandOpen('science');
 check(rows().find(e=>e.children[0].textContent.includes('연비 개선')).children[0].textContent.includes('완료'),'Other city shares completion');
 setup();player=6;started=true;busy=false;setAppScreen('game');units=[];missileBases=[];tech.fill(0);food.fill(100000);oil.fill(100000);
 check(WHITE_NIGHT===30&&SAPROS===29&&TYPES.length===31,'Append-only IDs');
 const t=TYPES[WHITE_NIGHT];check(t.branch==='infantry'&&t.special===6&&t.atk===100&&t.range===1&&unitPrice(WHITE_NIGHT,1)===1450,'Unit stats');
 const capital=cities.find(q=>q.f===6&&q.capital);capital.level=5;capital.queue=null;capital.produced=false;cityProfile(capital);
 check(canProduce(capital,WHITE_NIGHT,1)&&!canProduce(cities.find(q=>q.f===0&&q.capital),WHITE_NIGHT,1),'Faction recruitment');
 selectCity(capital,true);cityCommandOpen('units');check($('whiteNightProductionRow'),'Actual production row');
 check(canCaptureCityUnit({type:WHITE_NIGHT}),'Capture-capable special infantry');
 const root=tiles.findIndex((t,i)=>t.owner>=0&&!cityAt(i)&&neighbors(i).length===6&&whiteNightArea({tile:i},{tile:neighbors(i)[4]}).every(j=>tiles[j].owner>=0&&!cityAt(j)));
 check(root>=0,'Land fixture');const a=makeUnit(6,WHITE_NIGHT,root,1);
 for(const [dq,dr] of WHITE_NIGHT_DIRECTIONS){const v={tile:whiteNightOffset(root,dq,dr)},area=whiteNightArea(a,v);check(area.length===8&&new Set(area).size===8&&area.includes(v.tile)&&!area.includes(root)&&area.every(i=>distance(root,i)<=2),'Six-way eight-tile geometry')}
 const target=whiteNightOffset(root,1,-1),area=whiteNightArea(a,{tile:target});
 const expected=[[0,-2],[0,-1],[1,-2],[1,-1],[1,0],[2,-2],[2,-1],[2,0]].map(([dq,dr])=>whiteNightOffset(root,dq,dr));
 check([...area].sort((a,b)=>a-b).join()===expected.sort((a,b)=>a-b).join(),'Exact supplied trapezoid');
 const seam=index(W+OCEAN_X-1,20),across=whiteNightOffset(seam,1,0);check(distance(seam,across)===1&&whiteNightArea({tile:seam},{tile:across}).length===8,'World wrapping');
 check(!canAttack(a,{type:0,f:0,tile:whiteNightOffset(root,2,-2),hp:1000}),'Only adjacent direct targets');
 const victims=area.map((tile,n)=>{const v=makeUnit(0,[0,1,2,11,21,9,0,13][n],tile,1);v.hp=1000;return v}),primary=victims[0];
 const outside=makeUnit(0,0,whiteNightOffset(root,-1,0),1);outside.hp=1000;
 const oldDelay=delay,oldTime=performance.now,oldCounter=canCounterattack;let clock=1000,windup=false;
 performance.now=()=>clock;canCounterattack=()=>false;
 delay=async ms=>{if(ms===SAPROS_WINDUP&&!windup){windup=true;check(victims.every(v=>v.hp===1000),'No early damage');check(whiteNightPose(a,clock+1199)===whiteNightArt.windup,'Windup frame')}clock+=ms};
 try{
  fx=[];check(await attack(a,primary,true),'Actual sweep attack');check(windup&&primary.hp===900&&victims.slice(1).every(v=>v.hp===940)&&outside.hp===1000,'100 direct and 7x60 secondary');
  const impacts=fx.filter(e=>['saprosBlood','saprosSparks'].includes(e.kind));check(impacts.length===8&&new Set(impacts.map(e=>e.targetId)).size===8,'Every victim has VFX');check(impacts.some(e=>e.kind==='saprosBlood')&&impacts.some(e=>e.kind==='saprosSparks'),'Both blood and sparks');check(!fx.some(e=>['shot','infantryMuzzle','devilLaser'].includes(e.kind)),'Melee has no projectiles');
  units=[a];freshOrders(a);fx=[];const p=makeUnit(0,0,target,1);p.hp=20;
  const friend=makeUnit(6,0,area[1],1),ally=makeUnit(2,0,area[2],1),neutral=makeUnit(4,0,area[3],1),cargo=makeUnit(0,0,area[4],1);diplomacy[6][2]='ally';diplomacy[6][4]='neutral';cargo.carriedBy=999;
  const innocent=[friend,ally,neutral,cargo],hp=innocent.map(v=>v.hp),lone=makeUnit(0,1,area[6],1);lone.hp=1000;
  check(await attack(a,p,true)&&!units.includes(p)&&lone.hp===940&&innocent.every((v,i)=>v.hp===hp[i]),'Sparse fan and faction/transport exclusions');check(fx.filter(e=>['saprosBlood','saprosSparks'].includes(e.kind)).length===2,'Only occupied hostile cells hit');
 }finally{delay=oldDelay;performance.now=oldTime;canCounterattack=oldCounter}
 fireMotions.clear();launchShot(a,{x:0,y:0},1000);check(whiteNightPose(a,2199)===whiteNightArt.windup&&whiteNightPose(a,2200)===whiteNightArt.strike&&whiteNightPose(a,2560)===whiteNightArt.idle,'Sapros 1200/360ms timing');
 const saved=JSON.parse(JSON.stringify(snapshot()));migrateArmy(saved);check(units.some(u=>u.type===WHITE_NIGHT),'Save round trip');
 for(let d=0;d<3;d++){difficulty=d;for(let n=0;n<12;n++){turn++;capital.produced=false;capital.queue=null;food[6]=100000;money[6]=100000;oil[6]=100000;check(aiOrderSpecials(6,[capital])===1&&capital.queue.type===WHITE_NIGHT&&aiOrderSpecials(6,[capital])===0,'AI one Sielun special per turn/difficulty')}}
 setup();started=true;busy=false;setAppScreen('game');units=[];missileBases=[];selected=null;panelOpen=false;fx=[];cam.z=1.4;
 const bear=makeUnit(6,WHITE_NIGHT,root,1),sap=makeUnit(3,SAPROS,whiteNightOffset(root,-1,0),1),front=makeUnit(0,0,neighbors(root).find(i=>pxy(i).y>pxy(root).y),1);cam.x=pxy(root).x;cam.y=pxy(root).y-28;
 const paint=[],images=[],oldSprite=sprite,oldImage=ctx.drawImage,oldInf=drawInfantryRemains,oldSap=drawSaprosEffect,oldNav=drawNavalEffect;
 sprite=function(u,...args){paint.push('unit:'+u.id);return oldSprite(u,...args)};
 ctx.drawImage=function(im,...args){if(im===whiteNightArt.dead.idle)paint.push('corpse:white');if([whiteNightArt.idle.idle,whiteNightArt.windup.idle,whiteNightArt.strike.idle].includes(im))images.push({im,args});return oldImage(im,...args)};
 drawInfantryRemains=function(e,t){paint.push('corpse:infantry');return oldInf(e,t)};drawSaprosEffect=function(e,t){if(e.kind==='saprosRemains')paint.push('corpse:sapros');return oldSap(e,t)};drawNavalEffect=function(e,t){if(e.kind==='navalSink')paint.push('corpse:navy');return oldNav(e,t)};
 let paintOrder;
 try{
  const now=performance.now(),p=pxy(root);fireMotions.clear();sprite(bear,p,now);check(Math.abs(images.at(-1).args[3]-S*1.5)<.001,'1.5-tile sprite height');launchShot(bear,p,now);sprite(bear,p,now+1199);sprite(bear,p,now+1200);check(images.some(i=>i.im===whiteNightArt.windup.idle)&&images.some(i=>i.im===whiteNightArt.strike.idle),'Actual supplied pose artwork');
  fireMotions.clear();kill(bear);check(fx.some(e=>e.kind==='whiteNightRemains'),'Supplied corpse');fx.push({kind:'saprosRemains',x:p.x-35,y:p.y,start:now,duration:8000},{kind:'infantryRemains',x:p.x+30,y:p.y,start:now,duration:8000},{kind:'wreck',x:p.x,y:p.y,type:1,start:now,duration:1000},{kind:'navalSink',x:p.x+90,y:p.y,type:23,f:0,start:now,duration:1800});
  paint.length=0;drawWorld(now+100,true);drawWorld(now+100);const first=paint.findIndex(s=>s.startsWith('unit:')),corpses=paint.map((s,i)=>({s,i})).filter(o=>o.s.startsWith('corpse:'));check(first>=0&&corpses.length===4&&corpses.every(o=>o.i<first),'All corpse classes paint once below live units');paintOrder=paint.slice();
 }finally{sprite=oldSprite;ctx.drawImage=oldImage;drawInfantryRemains=oldInf;drawSaprosEffect=oldSap;drawNavalEffect=oldNav}
 return {id:WHITE_NIGHT,primary:100,secondary:60,area:8,windup:1200,recovery:360,scienceRows:5,descriptions,paintOrder};
 })()`);
 assert.equal(result.id,30);console.log('PASS White Night and research final UI:',result);
};
