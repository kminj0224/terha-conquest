'use strict';
// Gardara is append-only: country 7, new special at the end of the unit catalogue.
const GARDARA_GUARD=TYPES.length;
TYPES.push({name:'아마라한을 지키는 힘무리',cost:780,hp:220,atk:58,range:2,move:4,def:20,branch:'infantry',special:GARDARA,icon:'정',text:'가르다라 특수 보병. 수도 또는 4레벨 이상 본토 도시에서 생산하는 정예 경호 전력. 도시 점령 가능.'});
UNIT_STORIES[GARDARA_GUARD]='아마라한을 지키는 힘무리. 가르다라의 회색 위장복과 검은 장비를 갖춘 정예 병력.';
const GARDARA_CITY_NAMES=['부루다라','카르다나','말루다라','사란다','누라하','바루칸','다르마라','쿠란다','라하누'];
const GARDARA_CITY_SITES=[[58,109],[51,107],[65,106],[54,113],[64,113],[58,104],[68,109],[49,111],[59,116]];
const gardaraInfantryArt={0:loadBaekArt('gardara-rifle-idle.png','gardara-rifle-fire.png'),8:loadBaekArt('gardara-grenadier-idle.png','gardara-grenadier-fire.png'),9:loadBaekArt('gardara-antitank-idle.png','gardara-antitank-fire.png'),10:loadBaekArt('gardara-machinegun.png')};
const GARDARA_INFANTRY_PROFILES={
 0:{art:gardaraInfantryArt[0],baseFacing:1,muzzles:rightInfantryMuzzles([[650,340],[1130,240],[1440,540]],1448,1086)},
 8:{art:gardaraInfantryArt[8],baseFacing:1,muzzles:rightInfantryMuzzles([[500,145],[940,85],[1440,230]],1448,1086),projectile:'baekGrenade',flashAngle:.65},
 9:{art:gardaraInfantryArt[9],baseFacing:1,muzzles:rightInfantryMuzzles([[700,315],[1240,244],[1530,515]],1536,1024),projectile:'baekRocket'},
 10:{art:gardaraInfantryArt[10],baseFacing:1,muzzles:rightInfantryMuzzles([[1425,345]],1448,1086),burst:true}
};
GARDARA_INFANTRY_PROFILES[GARDARA_GUARD]={...GARDARA_INFANTRY_PROFILES[0],width:72,height:54,burst:true,burstShots:8,strong:true};
const gardaraInfantryProfile=infantryArtProfile;
infantryArtProfile=function(u){return u.f===GARDARA?GARDARA_INFANTRY_PROFILES[u.type]||null:gardaraInfantryProfile(u)};
const gardaraCaptureCheck=canCaptureCityUnit;
canCaptureCityUnit=function(u){return u?.type===GARDARA_GUARD||gardaraCaptureCheck(u)};
const gardaraFlag=new Image();gardaraFlag.src='flag-7.jpg';flagImages[GARDARA]=gardaraFlag;
const gardaraCityArt={capital:loadBaekArt('gardara-city-capital.png'),2:loadBaekArt('gardara-city-small.png'),3:loadBaekArt('gardara-city-3.png'),4:loadBaekArt('gardara-city-4.png'),5:loadBaekArt('gardara-city-5.png')};
const gardaraPhotoProfile=photoCityProfile;
photoCityProfile=function(q){if(q.origin!==GARDARA)return gardaraPhotoProfile(q);const level=Math.max(1,Math.min(5,q.level)),key=q.capital?'capital':level<=2?2:level;const art=gardaraCityArt[key],image=art.idle;return{key,art,crop:[0,0,image.naturalWidth||1536,image.naturalHeight||1024],width:(q.capital?99:[0,57.5,74,82,80.5,89.7][level])}};
const gardaraTankArt=loadBaekArt('gardara-tank.png'),gardaraArtilleryArt=loadBaekArt('gardara-artillery.png');
const gardaraPalmArt=loadBaekArt('trial-palm.png');
armoredCarArt[GARDARA]=armoredCarArt[0];ARMORED_CAR_PROFILES[GARDARA]={...ARMORED_CAR_PROFILES[0]};
const gardaraOtherVehicleArt={11:loadBaekArt('baek-motorized-right.png'),12:armoredCarArt[0],13:baekLightTankArt,14:baekEliteTankArt,3:baekMLArt,15:MORTAR_ART[0].idle,16:TOWED_ART[0].idle};

NATURAL_OWNERSHIP_COLORS.push('#888888');
// These tiles are outside the old baked scenery, and have complete land support.
for(const i of GARDARA_TILES){CITY_GROUND_CENTER[i]=1;CITY_GROUND_SUPPORT[i]=100}
function appendGardaraCities(){
 if(activeScenario||cities.some(q=>q.origin===GARDARA))return false;
 for(let n=0;n<9;n++){
  const desired=index(...GARDARA_CITY_SITES[n]);
  const tile=GARDARA_TILES.filter(i=>!cities.some(q=>q.tile===i)).sort((a,b)=>distance(a,desired)-distance(b,desired)||a-b)[0];
  const q={id:cities.length,seedId:7000+n,tile,f:GARDARA,origin:GARDARA,name:GARDARA_CITY_NAMES[n],level:n===0?5:n===2?4:n%3===0?1:2,capital:n===0,airport:n===0||n===2,airTurn:-1,queue:null,produced:false,lastAttackedTurn:turn};
  q.hp=cityMaxHp(q);cityProfile(q);cities.push(q);
  const u=makeUnit(GARDARA,[0,0,8,0,9,0,10,0,0][n],tile,1);freshOrders(u);
 }
 tiles.forEach(t=>t.city=-1);cities.forEach(q=>tiles[q.tile].city=q.id);buildRegions();
 missileBases=missileBases.filter(b=>MAP.tiles[b.tile][0]!==GARDARA);defeatedNotices.delete(GARDARA);placementComponents=null;seaComponents=null;shoreCacheKey='';
 return true;
}
function padGardaraState(s){
 const fill=(a,value)=>Array.from({length:factions.length},(_,i)=>a?.[i]??(typeof value==='function'?value():value));
 s.money=fill(s.money,950);s.tech=fill(s.tech,0);s.food=fill(s.food,1200);s.oil=fill(s.oil,180);
 s.strategicResearch=fill(s.strategicResearch,()=>({ballistic:false,nuclear:false,jobs:[]}));
 const fresh=initialDiplomacy();s.diplomacy=fresh.map((row,a)=>row.map((v,b)=>s.diplomacy?.[a]?.[b]??v));
 money=s.money;tech=s.tech;return s;
}
const gardaraSetup=setup;
setup=function(){const result=gardaraSetup();if(!activeScenario){appendGardaraCities();faceInitialArmy();focusCapital();save();updateHUD()}return result};
const gardaraMigration=migrateArmy;
migrateArmy=function(s){if(!activeScenario)padGardaraState(s);const result=gardaraMigration(s);if(!activeScenario){appendGardaraCities();territoryDirty=true}return result};
const gardaraSnapshot=snapshot;
snapshot=function(){return{...gardaraSnapshot(),gardaraSchema:1}};
// Add the new special through the same production and information flows.
const gardaraProductionPanel=productionPanel;
productionPanel=function(q){
 gardaraProductionPanel(q);if(q.f!==GARDARA||q.f!==player||!q.capital&&q.level<4)return;
 const cat=$('unitCatalogue');if(!cat)return;
 const group=document.createElement('div');group.className='unitGroup';group.innerHTML='<h3>가르다라 특수 병종</h3>';
 const row=document.createElement('div');row.className='productionRow';row.id='gardaraGuardProductionRow';
 const reason=productionReason(q,GARDARA_GUARD,productionTier,productionAA),button=document.createElement('button');
 button.className='produceButton'+(reason?' unavailable':'');button.title=reason;button.innerHTML=TYPES[GARDARA_GUARD].name+' '+productionTier+'<small>식량 '+unitPrice(GARDARA_GUARD,productionTier)+' · 석유 '+unitOil(GARDARA_GUARD,productionTier)+'</small>';
 button.onclick=()=>produce(q,GARDARA_GUARD,productionTier,productionAA);
 const info=document.createElement('button');info.className='unitInfoButton';info.textContent='i';info.onclick=()=>showProductionInfo(q,GARDARA_GUARD,productionTier);
 row.appendChild(button);row.appendChild(info);group.appendChild(row);cat.appendChild(group);
};
// Terrain is cached independently of the retained seven-nation natural map.
const GARDARA_GROUND_X=43*S,GARDARA_GROUND_Y=101*V;
let gardaraGround=null,gardaraGroundKey='';
function gardaraTerrainCanvas(){
 const key=territoryGeneration+':'+gardaraPalmArt.idleReady;
 if(gardaraGround&&gardaraGroundKey===key)return gardaraGround;
 gardaraGroundKey=key;gardaraGround??=document.createElement('canvas');gardaraGround.width=2000;gardaraGround.height=1100;
 const g=gardaraGround.getContext('2d');g.translate(-GARDARA_GROUND_X,-GARDARA_GROUND_Y);
 // Only exterior edges are stroked; the coast is a continuous softened outline.
 const edges=new Map(),pointKey=p=>p.map(v=>v.toFixed(2)).join(',');
 for(const i of GARDARA_TILES){const points=hexPoints(pxy(i),35);for(let k=0;k<6;k++){const a=points[k],b=points[(k+1)%6],key=[pointKey(a),pointKey(b)].sort().join('|');if(edges.has(key))edges.delete(key);else edges.set(key,[a,b])}}
 const unused=new Map(edges),loops=[];
 while(unused.size){const [first,pair]=unused.entries().next().value;unused.delete(first);const loop=[pair[0],pair[1]];let current=pointKey(pair[1]);while(current!==pointKey(loop[0])){let found=false;for(const [key,[a,b]]of unused){if(pointKey(a)===current||pointKey(b)===current){const next=pointKey(a)===current?b:a;loop.push(next);current=pointKey(next);unused.delete(key);found=true;break}}if(!found)break}loops.push(loop)}
 const path=()=>{g.beginPath();for(const loop of loops){if(loop.length<3)continue;const first=loop[0],last=loop[loop.length-2];g.moveTo((first[0]+last[0])/2,(first[1]+last[1])/2);for(let n=0;n<loop.length-1;n++){const a=loop[n],b=loop[(n+1)%(loop.length-1)];g.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2)}g.closePath()}};
 path();g.strokeStyle='#83bcb666';g.lineWidth=20;g.stroke();g.strokeStyle='#d9d0ae';g.lineWidth=7;g.stroke();const gradient=g.createLinearGradient(GARDARA_GROUND_X,GARDARA_GROUND_Y,GARDARA_GROUND_X+1800,GARDARA_GROUND_Y+1000);gradient.addColorStop(0,'#7e8573');gradient.addColorStop(.5,'#929581');gradient.addColorStop(1,'#727c6a');g.fillStyle=gradient;g.fill();
 g.save();path();g.clip();
 for(const i of GARDARA_TILES){const p=pxy(i),t=tiles[i],seed=mixSeed(i*731);g.fillStyle=factions[t.owner>=0?t.owner:GARDARA].color;g.globalAlpha=.24;g.beginPath();g.ellipse(p.x,p.y,50,42,0,0,Math.PI*2);g.fill();g.globalAlpha=1;
  for(let k=0;k<22;k++){const h=mixSeed(seed+k*313);g.fillStyle=['#acb38c33','#3a513533','#cfbd9533'][k%3];g.fillRect(p.x+(h%71)-35,p.y+((h>>>8)%51)-25,2+(h%4),1+(h%3))}
  if(gardaraPalmArt.idleReady&&t.terrain===2&&!cityAt(i)){const h=40+seed%24,w=h*1.24,x=p.x+(seed%25)-12,y=p.y+((seed>>>8)%21)-10;g.drawImage(gardaraPalmArt.idle,x-w/2,y-h+10,w,h)}
 }
 g.restore();return gardaraGround;
}
function paintGardaraTerrain(g){if(activeScenario)return;g.drawImage(gardaraTerrainCanvas(),GARDARA_GROUND_X,GARDARA_GROUND_Y,2000,1100)}
const gardaraStaticGround=drawStaticGround;
drawStaticGround=function(){gardaraStaticGround();paintGardaraTerrain(ctx)};
const gardaraDrawMini=drawMini;
drawMini=function(){gardaraDrawMini();if(activeScenario||$('mini').style.display!=='block')return;const g=$('mini').getContext('2d');g.save();g.scale(166/WORLD_WIDTH,119/WORLD_HEIGHT);g.translate(-WORLD_LEFT,-WORLD_TOP);paintGardaraTerrain(g);for(const q of cities.filter(q=>q.origin===GARDARA)){const p=pxy(q.tile);g.fillStyle=factions[q.f].color;g.fillRect(p.x,p.y,WORLD_WIDTH/83,WORLD_HEIGHT/60)}g.restore()};
const gardaraPreviousSprite=sprite;
sprite=function(u,p,now){
 if(u.f!==GARDARA||TYPES[u.type].branch==='infantry'&&u.type!==11)return gardaraPreviousSprite(u,p,now);
 if(isNaval(u)){p=unitVisualPosition(u,now);ctx.save();ctx.translate(p.x,p.y-3);drawShip(u,weaponAngle(u,now),-1);if(cam.z>.55){rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}ctx.restore();return}
 const branch=TYPES[u.type].branch,art=gardaraOtherVehicleArt[u.type]||(branch==='armor'?gardaraTankArt:branch==='artillery'?gardaraArtilleryArt:null);
 if(!art?.idleReady)return gardaraPreviousSprite(u,p,now);
 p=unitVisualPosition(u,now);const width=u.type===15?48:u.type===14?85:76,height=width*art.idle.naturalHeight/art.idle.naturalWidth,facing=Number.isFinite(u.angle)&&Math.cos(u.angle)<0?-1:1;
 ctx.save();ctx.translate(p.x,p.y-3);ctx.save();ctx.scale(facing*([14,15,16].includes(u.type)?-1:1),1);if(gardaraOtherVehicleArt[u.type])ctx.filter='grayscale(1)';ctx.drawImage(art.idle,-width/2,14-height,width,height);ctx.restore();if(cam.z>.55){rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}ctx.restore();
};
Object.assign(window.Terha,{setup,migrateArmy,snapshot,infantryArtProfile,photoCityProfile,canCaptureCityUnit,productionPanel,drawMini,drawStaticGround,sprite,GARDARA_GUARD});
