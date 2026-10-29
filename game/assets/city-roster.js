'use strict';
const CITY_ROSTER_SCHEMA=1,CITY_ROSTER_COUNTS=[33,33,33,24,24,10,24];
const EXTRA_CITY_NAMES=[['해룡항','율계성','청하','운림','태강','동천','금해','류운','백송'],['아스타로스','마르바스','아가레스','부네','포르네우스','벨레트','카임','안드라스','오세'],['킹스브리지','그레이포드','레이븐홀','노스헤이븐','세인트마리아','애쉬캐슬','스틸크레스트','윈터게이트','퀸즈워드']];
function adjustCityRoster(newGame=false){
 if([181,190].includes(cities.length)&&cities.every((q,i)=>q.id===i))return false;
 for(const q of cities)q.seedId=q.seedId??q.id;
 const nag=cities.filter(q=>q.origin===5),priority=q=>(q.capital?100000:0)+(q.nuclearJob?10000:0)+(q.queue?1000:0)+(q.nukes||0)*100;
 const keep=new Set(nag.slice().sort((a,b)=>priority(b)-priority(a)||a.id-b.id).slice(0,10));
 for(const q of nag.filter(q=>!keep.has(q))){const nearest=[...keep].filter(v=>v.f===q.f).sort((a,b)=>distance(q.tile,a.tile)-distance(q.tile,b.tile))[0];if(nearest){nearest.nukes=(nearest.nukes||0)+(q.nukes||0);if(q.nuclearJob&&!nearest.nuclearJob)nearest.nuclearJob=q.nuclearJob;if(q.queue&&!nearest.queue){nearest.queue=q.queue;nearest.produced=q.produced}}}
 cities=cities.filter(q=>q.origin!==5||keep.has(q));cities.forEach((q,i)=>q.id=i);
 for(let f=0;f<3;f++){let local=cities.filter(q=>q.origin===f),count=Math.max(0,33-local.length);for(let n=0;n<count;n++){let best=-1,score=-Infinity;for(let i=0;i<tiles.length;i++){if(MAP.tiles[i][0]!==f||cities.some(q=>q.tile===i)||unitAt(i))continue;const spread=Math.min(...local.map(q=>distance(i,q.tile))),jitter=(mixSeed(i+f*817)%100)/1000,s=spread+jitter;if(s>score){score=s;best=i}}if(best<0)break;const name=EXTRA_CITY_NAMES[f][n]||factions[f].name+' 신도시 '+(n+1),level=n%4===3?1:2,q={id:cities.length,tile:best,f:newGame?f:tiles[best].owner,origin:f,seedId:1000+f*100+n,name,level,capital:false,airport:false,airTurn:-1,queue:null,produced:false,lastAttackedTurn:turn};q.hp=cityMaxHp(q);cityProfile(q);cities.push(q);local.push(q);if(newGame){const u=makeUnit(f,0,best,2);freshOrders(u)}}}
 tiles.forEach(t=>t.city=-1);cities.forEach((q,i)=>{q.id=i;tiles[q.tile].city=i});buildRegions();renameCities();selected=null;panelOpen=false;airTarget=null;strategicTarget=null;reach.clear();territoryDirty=true;return true;
}
const rosterSetup=setup;setup=function(){rosterSetup();adjustCityRoster(true);save();updateHUD();refreshSelection()};
const rosterMigration=migrateArmy;migrateArmy=function(s){rosterMigration(s);adjustCityRoster(false)};
Object.assign(window.Terha,{setup,migrateArmy,adjustCityRoster});
