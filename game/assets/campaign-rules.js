'use strict';
// Common campaign rules, independent of the objective of an individual mission.
const CampaignRules=(()=>{
 const limits=Object.freeze([40,26,16]);
 const rules=d=>Array.isArray(d?.starTurns)&&d.starTurns.length===3?d.starTurns:limits;
 const stars=(turn,won=true,d=null)=>!won?0:rules(d).reduce((n,max,i)=>turn<=max?i+1:n,0);
 const star=(filled=true)=>'<svg viewBox="0 0 32 32" class="cpStar '+(filled?'earned':'empty')+'" aria-hidden="true"><path d="m16 2 4.3 8.7 9.6 1.4-7 6.8 1.7 9.6-8.6-4.6-8.6 4.6 1.7-9.6-7-6.8 9.6-1.4Z"/></svg>';
 const row=(count,total=count)=>'<span class="cpStarGroup" aria-label="별 '+count+'개">'+Array.from({length:total},(_,i)=>star(i<count)).join('')+'</span>';
 const check='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="m5 12 4.5 4.5L19 7"/></svg>';
 const KEY='terha-campaign-iron-crown-ratings-v1';
 function records(){try{const x=JSON.parse(localStorage.getItem(KEY));return x?.schema===1&&x.missions&&typeof x.missions==='object'?x.missions:{}}catch{return{}}}
 function award(id,turn,level,d){
  const all=records(),earned=stars(turn,true,d),old=all[id];
  if(earned&&(!old||earned>old.stars||earned===old.stars&&turn<old.turns)){
   all[id]={stars:earned,turns:turn,difficulty:level};try{localStorage.setItem(KEY,JSON.stringify({schema:1,missions:all}))}catch{}
  }
  return earned;
 }
 return{limits,rules,stars,star,row,check,records,award,storageKey:KEY};
})();

// Coordinates are normalized against the ORIGINAL illustration. No sea artwork
// is drawn; -1 is only the native engine's non-land ownership value.
const CampaignTerrain=(()=>{
 const shapes={
  'iron-crown-m01':[
   [[0,.17],[.40,.18],[.60,.15],[1,.15],[1,.78],[.76,.79],[.60,.82],[.35,.77],[0,.80]]
  ],
  'iron-crown-m02':[
   [[0,.34],[.20,.34],[.34,.37],[.45,.35],[.52,.36],[.77,.35],[.82,.30],[1,.30],[1,.54],[.83,.55],[.78,.51],[.53,.52],[.52,.57],[.61,.60],[.66,.70],[.67,.79],[.53,.82],[.31,.83],[.25,.77],[.25,.68],[.33,.59],[.42,.52],[.35,.51],[.20,.55],[0,.53]],
   [[.42,.40],[.43,.28],[.45,.18],[.50,.11],[.55,.07],[.74,.07],[.75,.25],[.58,.27],[.53,.26],[.52,.33],[.51,.40]]
  ],
  'iron-crown-m03':[
   [[.07,.09],[.90,.09],[.95,.20],[.95,.64],[.89,.74],[.81,.77],[.81,.88],[.16,.88],[.13,.78],[.05,.76],[.05,.23]]
  ]
 };
 function inside(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes}
 function blocked(i,d){
  const t=tiles[i],m=d?.map;if(!t||!m)return true;
  const x=(t.x-m.origin.x+2/3)/(m.cols+1/3),y=(t.y-m.origin.y+.5+.5*(t.x&1))/(m.rows+.5);
  const polygons=shapes[d.id];return !!polygons&&!polygons.some(p=>inside(x,y,p));
 }
 function apply(d){
  for(let q=0;q<d.map.cols;q++)for(let r=1;r<d.map.rows-1;r++){
   const i=index(d.map.origin.x+q,d.map.origin.y+r);
   if(blocked(i,d)){MAP.tiles[i]=[-1,0];tiles[i].owner=-1;tiles[i].terrain=0}
  }
 }
 function relocate(d){
  const sites=[];for(let q=0;q<d.map.cols;q++)for(let r=1;r<d.map.rows-1;r++){const i=index(d.map.origin.x+q,d.map.origin.y+r);if(!blocked(i,d))sites.push(i)}
  for(const u of units)if(!u.carriedBy&&!isAircraft(u)&&!isHelicopter(u)&&blocked(u.tile,d)){
   const site=sites.filter(i=>!unitAt(i)&&(!cityAt(i)||cityAt(i).f===u.f)).sort((a,b)=>distance(u.tile,a)-distance(u.tile,b)||Number(tiles[a].owner!==u.f)-Number(tiles[b].owner!==u.f))[0];
   if(site!==undefined)u.tile=site;
  }
 }
 return{blocked,apply,relocate,shapes};
})();
