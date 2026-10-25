'use strict';
// Reinforce the long southern shore of Stetopia only when starting a new campaign.
// Existing saves retain their previous fortifications and ships.
function seedStetopiaSouthernCoast(){
 const faction=2;
 const coast=ownShores(faction).filter(i=>
  tiles[i].y>=38 &&
  neighbors(i).some(j=>tiles[j].owner<0&&tiles[j].y>=tiles[i].y));
 const open=coast.filter(i=>!cityAt(i)&&!unitAt(i)&&!baseAt(i));
 if(!open.length)return;
 const west=Math.min(...open.map(i=>tiles[i].x));
 const east=Math.max(...open.map(i=>tiles[i].x));
 const batteries=[];
 // Western, central and eastern sections: keep substantial gaps between forts.
 for(let n=0;n<3;n++){
  const targetX=west+(east-west)*(n+.5)/3;
  const available=open.filter(i=>!baseAt(i)&&batteries.every(j=>distance(i,j)>=5));
  if(!available.length)break;
  const tile=available.sort((a,b)=>
   Math.abs(tiles[a].x-targetX)-Math.abs(tiles[b].x-targetX)||
   tiles[b].y-tiles[a].y)[0];
  missileBases.push({
   id:navalUid++,tile,f:faction,kind:'sea',hp:DEFENSES.sea.hp,
   remaining:0,lastTick:turn,lastShot:-1,facing:1,
   initialSouthernDefense:true
  });
  batteries.push(tile);
 }
 if(!batteries.length)return;
 // Two destroyers on the flanks, with two supporting frigates offshore.
 const middle=batteries[Math.floor(batteries.length/2)];
 const stations=[batteries[0],batteries[batteries.length-1],middle,middle];
 for(let n=0;n<stations.length;n++){
  const anchor=stations[n],type=n<2?24:23;
  const possible=tiles.map((t,i)=>
   t.owner<0&&!unitAt(i)&&distance(i,anchor)<=6&&
   tiles[i].y>=tiles[anchor].y?i:-1).filter(i=>i>=0);
  if(!possible.length)continue;
  const tile=possible.sort((a,b)=>
   distance(a,anchor)-distance(b,anchor)||
   Math.abs(tiles[a].x-tiles[anchor].x)-Math.abs(tiles[b].x-tiles[anchor].x)||
   tiles[b].y-tiles[a].y)[0];
  const ship=makeUnit(faction,type,tile,1);
  ship.initialSouthernFleet=true;
 }
}
const beforeStetopiaSouthSetup=setup;
setup=function(...args){
 const result=beforeStetopiaSouthSetup(...args);
 seedStetopiaSouthernCoast();
 save();
 return result;
};
Object.assign(window.Terha,{setup,seedStetopiaSouthernCoast});
