const assert=require('assert');
module.exports=async function({run}){
 const result=await run(`(async()=>{
 const check=(v,m)=>{if(!v)throw Error(m)};
 setup();started=true;setAppScreen('game');player=0;busy=false;menuMode=false;
 money[0]=500000;oil[0]=100000;food[0]=200000;
 const q=cities.find(c=>c.f===0&&c.capital),foreign=cities.find(c=>c.f!==0&&c.capital);
 q.lab=true;q.launcher=true;q.airport=true;q.level=5;cityProfile(q);
 const r=strategicResearch[0];
 r.ballistic=true;r.nuclear=true;
 selectCity(q,true);
 cityCommandOpen('overview');
 check($('cityExpandGold')&&$('cityOverviewFacilities'),'City expansion must sit next to title and facility list below');
 check($('panel').textContent.includes('시설 건설'),'Construction banner renamed');
 check(!$('panel').innerHTML.includes('도시 확장 · 시설 건설'),'Legacy combined banner must not appear');
 for(const [tab,text]of [['science','군사 연구'],['units','부대 생산'],['air','수송기'],['nuclear','원자폭탄'],['missiles','대륙간탄도미사일']]){
  cityCommandOpen(tab);check($('panel').textContent.includes(text),'Direct city page '+tab+' missing '+text);
  check(!$('panel').innerHTML.includes('<details'),'Specialized city page must open directly: '+tab);
 }
 for(const id of ['cityScience','cityArmy','cityAircraft','cityNuclear','cityMissiles'])
  check($(id)?.style.display==='inline-block','Missing visible equal-size city footer '+id);
 cityCommandOpen('science');
 const jobBefore=militaryResearchJobs[0];
 check(research(),'Military study cannot start');
 check(militaryResearchJobs[0].city===q.id,'Military research must remember source city');
 check(cityOverview(q).includes('군사 연구')&&cityOverview(q).includes('2턴 남음'),'Military progress must appear in owner city');
 const other=cities.find(c=>c.f===0&&c.id!==q.id);
 check(!cityOverview(other).includes('군사 연구 '+(tech[0]+1)+'단계'),'Other city must not show this national study progress');
 check(studyReason(q,'ballistic'),'Same city cannot start shared science while military study ongoing');
 check(fuelResearchReason(q),'Same city cannot start fuel research while military study ongoing');
 militaryResearchJobs[0]=jobBefore;
 const protectOwner=0;
 const escortTile=tiles.findIndex(t=>t.owner<0);
 const carrier={id:99990,type:25,f:0,tile:escortTile,hp:10000,level:1};
 const escort={id:99991,type:23,f:0,tile:escortTile,hp:10000,level:1};
 units.push(carrier,escort);
 check(escortProtected(carrier)&&protectingEscorts(carrier).length===1,'Carrier must be covered by allied escort');
 units=units.filter(v=>v!==carrier&&v!==escort);
 const stock=warheadStock(q);stock.atomic=0;stock.hydrogen=0;syncWarheads(q);
 check(fabricateNuke(q,'atomic'),'Atomic production failed');
 check(q.nuclearJob.remaining===5&&q.nuclearJob.kind==='atomic','Atomic must use original 5-turn job');
 for(let n=0;n<5;n++){turn++;await industryTurn()}
 check(stock.atomic===1&&q.nukes===1,'Atomic bomb stock not created correctly');
 check(fabricateNuke(q,'hydrogen'),'Hydrogen production failed');
 check(q.nuclearJob.remaining===6&&q.nuclearJob.kind==='hydrogen','Hydrogen must take six turns');
 for(let n=0;n<6;n++){turn++;await industryTurn()}
 check(stock.hydrogen===1&&q.nukes===2,'Hydrogen stock not created correctly');
 cityCommandOpen('nuclear');
 check($('panel').textContent.includes('원자폭탄 1개')&&$('panel').textContent.includes('수소폭탄 1개'),'Typed nuclear inventory not shown');
 const saved=snapshot();check(saved.cities[q.id].nukeTypes.hydrogen===1,'Hydrogen stock missing in save');
 check(Object.keys(MISSILE_MODELS).length===4,'Must offer four ballistic ranges');
 check(MISSILE_MODELS.short.range<MISSILE_MODELS.medium.range&&MISSILE_MODELS.long.range<MISSILE_MODELS.icbm.range,'Missile ranges must increase');
 prepareStrategicLaunch(q,'short',null,false);
 const i=foreign.tile;
 if(distance(q.tile,i)>MISSILE_MODELS.short.range)check(!canStrategic(q,'missile',i),'Short missile cannot exceed range');
 strategicTarget=null;busy=false;menuMode=false;
 return{tabs:cityTabButtons.length,nuclearStock:stock,militaryBanner:true,escortCarrier:true,missileModels:Object.keys(MISSILE_MODELS).length};
 })()`);
 assert.equal(result.tabs,5);
 console.log('PASS v1.10.85 city tabs, local-only research banners, research exclusivity, escort carrier, typed nuclear manufacturing and missile ranges:',result);
};
