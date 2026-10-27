'use strict';
// A deterministic player using only the same legal actions exposed to the UI.
module.exports=function play(R,s,command){
 const apply=command||(a=>a.type==='move'?R.move(s,a.id,a.q,a.r):a.type==='attack'?R.attack(s,a.id,a.target):a.type==='produce'?R.produce(s,a.source,a.kind):R.endTurn(s));
 for(let n=0;n<35&&s.status==='playing';n++){
  for(const original of s.units.filter(u=>u.side===0)){
   const u=s.units.find(u=>u.id===original.id);if(!u||s.status!=='playing')continue;
   let target=s.units.filter(v=>R.canFire(s,u,v)).sort((a,b)=>a.hp-b.hp)[0];
   if(u.kind==='fortress'){
    const options=[...R.paths(s,u).keys()].map(k=>{const[q,r]=k.split(',').map(Number);return{q,r}}).filter(p=>!R.at(s,p)).sort((a,b)=>R.distance(a,R.EXIT)-R.distance(b,R.EXIT));
    if(options[0])apply({type:'move',id:u.id,...options[0]});
   }else if(target)apply({type:'attack',id:u.id,target:target.id});
   else{
    const nearest=s.units.filter(v=>v.side===1).sort((a,b)=>R.distance(u,a)-R.distance(u,b))[0];
    if(nearest){const p=[...R.paths(s,u).keys()].map(k=>{const[q,r]=k.split(',').map(Number);return{q,r}}).filter(p=>!R.at(s,p)).sort((a,b)=>R.distance(a,nearest)-R.distance(b,nearest))[0];if(p)apply({type:'move',id:u.id,...p})}
   }
   target=s.units.filter(v=>R.canFire(s,u,v)).sort((a,b)=>a.hp-b.hp)[0];
   if(target)apply({type:'attack',id:u.id,target:target.id});
  }
  if(s.status==='playing'){if(s.turn<4)apply({type:'produce',source:'base',kind:'rifle'});apply({type:'end'})}
 }
 return s;
};
