'use strict';
// Gardara is append-only: country 7, new special at the end of the unit catalogue.
const GARDARA=7,GARDARA_TILES=tiles.map((t,i)=>t.owner===7?i:-1).filter(i=>i>=0);
const GARDARA_GUARD=TYPES.length;
TYPES.push({name:'아마라한을 지키는 힘무리',cost:780,hp:220,atk:58,range:2,move:4,def:20,branch:'infantry',special:GARDARA,icon:'정',text:'가르다라 특수 보병. 수도 또는 4레벨 이상 본토 도시에서 생산하는 정예 경호 전력. 도시 점령 가능.'});
UNIT_STORIES[GARDARA_GUARD]='아마라한을 지키는 힘무리. 가르다라의 어두운 장갑 전투복과 검은 소총을 갖춘 네 명의 정예 경호 병력.';
const gardaraInfantryArt={0:loadBaekArt('gardara-rifle-idle.png','gardara-rifle-fire.png'),8:loadBaekArt('gardara-grenadier-idle.png','gardara-grenadier-fire.png'),9:loadBaekArt('gardara-antitank-idle.png','gardara-antitank-fire.png'),10:loadBaekArt('gardara-machinegun.png')};
const gardaraGuardArt=loadBaekArt('gardara-guard-idle.webp','gardara-guard-fire.webp');
const GARDARA_GUARD_MUZZLES=[[706,267],[1114,311],[652,466],[1108,483]];
const GARDARA_INFANTRY_PROFILES={
 0:{art:gardaraInfantryArt[0],baseFacing:1,muzzles:rightInfantryMuzzles([[650,340],[1130,240],[1440,540]],1448,1086)},
 8:{art:gardaraInfantryArt[8],baseFacing:1,muzzles:rightInfantryMuzzles([[500,145],[940,85],[1440,230]],1448,1086),projectile:'baekGrenade',flashAngle:.65},
 9:{art:gardaraInfantryArt[9],baseFacing:1,muzzles:rightInfantryMuzzles([[700,315],[1240,244],[1530,515]],1536,1024),projectile:'baekRocket'},
 10:{art:gardaraInfantryArt[10],baseFacing:1,muzzles:rightInfantryMuzzles([[1425,345]],1448,1086),burst:true}
};
// Keep the four muzzle origins measured in the original 1122x1402 firing artwork.
 // rightInfantryMuzzles mirrors them through baekRifleFacing for either shooting direction.
// Use original 1122x1402 lossless WebP unchanged; scale only at drawing time.
// The non-transparent alpha>5 height of both pictures matches Black Legion (52.8px).
const GARDARA_GUARD_INK_HEIGHT=BAEK_ART_PROFILES[6].height;
const GARDARA_GUARD_IDLE_BOUNDS={top:115,bottom:1352};
const GARDARA_GUARD_FIRE_BOUNDS={top:132,bottom:1274};
const GARDARA_GUARD_IDLE_HEIGHT=GARDARA_GUARD_INK_HEIGHT*1402/(GARDARA_GUARD_IDLE_BOUNDS.bottom-GARDARA_GUARD_IDLE_BOUNDS.top);
const GARDARA_GUARD_FIRE_HEIGHT=GARDARA_GUARD_INK_HEIGHT*1402/(GARDARA_GUARD_FIRE_BOUNDS.bottom-GARDARA_GUARD_FIRE_BOUNDS.top);
const GARDARA_GUARD_IDLE_WIDTH=GARDARA_GUARD_IDLE_HEIGHT*1122/1402;
const GARDARA_GUARD_FIRE_WIDTH=GARDARA_GUARD_FIRE_HEIGHT*1122/1402;
GARDARA_INFANTRY_PROFILES[GARDARA_GUARD]={
 art:gardaraGuardArt,baseFacing:1,
 width:GARDARA_GUARD_FIRE_WIDTH,height:GARDARA_GUARD_FIRE_HEIGHT,
 idleWidth:GARDARA_GUARD_IDLE_WIDTH,idleHeight:GARDARA_GUARD_IDLE_HEIGHT,
 idleFoot:GARDARA_GUARD_IDLE_BOUNDS.bottom/1402,
 fireFoot:GARDARA_GUARD_FIRE_BOUNDS.bottom/1402,
 footY:20,
 muzzles:rightInfantryMuzzles(GARDARA_GUARD_MUZZLES,1122,1402,GARDARA_GUARD_FIRE_WIDTH,GARDARA_GUARD_FIRE_HEIGHT),
 burst:true,burstShots:8,strong:true,highResolution:true
};
const gardaraInfantryProfile=infantryArtProfile;
infantryArtProfile=function(u){return u.f===GARDARA?GARDARA_INFANTRY_PROFILES[u.type]||null:gardaraInfantryProfile(u)};
const gardaraCaptureCheck=canCaptureCityUnit;
canCaptureCityUnit=function(u){return u?.type===GARDARA_GUARD||gardaraCaptureCheck(u)};
const gardaraFlag=new Image();gardaraFlag.src='flag-7.jpg';flagImages[GARDARA]=gardaraFlag;
const gardaraCityArt={capital:loadBaekArt('gardara-city-capital.png'),2:loadBaekArt('gardara-city-small.png'),3:loadBaekArt('gardara-city-3.png'),4:loadBaekArt('gardara-city-4.png'),5:loadBaekArt('gardara-city-5.png')};
const gardaraPhotoProfile=photoCityProfile;
photoCityProfile=function(q){if(q.origin!==GARDARA)return gardaraPhotoProfile(q);const profile=baekCityProfile(q);if(!q.capital)return{...profile,art:gardaraCityArt[profile.key]};const image=gardaraCityArt.capital.idle;return{...profile,art:gardaraCityArt.capital,crop:[0,0,image.naturalWidth||1448,image.naturalHeight||1086]}};
const gardaraTankArt=loadBaekArt('gardara-tank.png'),gardaraArtilleryArt=loadBaekArt('gardara-artillery.png','gardara-artillery-fire.png');
armoredCarArt[GARDARA]=armoredCarArt[0];ARMORED_CAR_PROFILES[GARDARA]={...ARMORED_CAR_PROFILES[0]};
const gardaraEliteArt=loadBaekArt('gardara-elite.png');
const gardaraOtherVehicleArt={11:loadBaekArt('baek-motorized-right.png'),12:armoredCarArt[0],13:baekLightTankArt,14:gardaraEliteArt,3:baekMLArt,15:MORTAR_ART[0].idle,16:TOWED_ART[0].idle};
function padGardaraState(s){
 const fill=(a,value)=>Array.from({length:factions.length},(_,i)=>a?.[i]??(typeof value==='function'?value():value));
 s.money=fill(s.money,950);s.tech=fill(s.tech,0);s.food=fill(s.food,1200);s.oil=fill(s.oil,180);
 s.strategicResearch=fill(s.strategicResearch,()=>({ballistic:false,nuclear:false,jobs:[]}));
 const fresh=initialDiplomacy();s.diplomacy=fresh.map((row,a)=>row.map((v,b)=>s.diplomacy?.[a]?.[b]??v));
 money=s.money;tech=s.tech;return s;
}
const gardaraSetup=setup;
setup=function(){const result=gardaraSetup();if(!activeScenario){faceInitialArmy();focusCapital();save();updateHUD()}return result};
const gardaraMigration=migrateArmy;
migrateArmy=function(s){if(!activeScenario)padGardaraState(s);const result=gardaraMigration(s);if(!activeScenario){territoryDirty=true}return result};
const gardaraSnapshot=snapshot;
snapshot=function(){return{...gardaraSnapshot(),gardaraSchema:2}};
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
// Use the existing tank/artillery animation, scale, recoil and muzzle code.
const gardaraTankCheck=isBaekTank,gardaraTankProfile=baekTankProfile;
isBaekTank=function(u){return u.f===GARDARA&&[1,14].includes(u.type)||gardaraTankCheck(u)};
baekTankProfile=function(u){if(u.f!==GARDARA||![1,14].includes(u.type))return gardaraTankProfile(u);const art=u.type===14?gardaraEliteArt:gardaraTankArt,image=art.idle,w=image.naturalWidth||1448,h=image.naturalHeight||1086;return{art,image,w,h,mx:w*.99,my:h*(u.type===14?.42:.49),flip:baekTankFacing(u)!==1}};
const gardaraArtilleryCheck=isBaekArtillery,gardaraSPProfile=baekArtilleryProfile;
isBaekArtillery=function(u){return u.f===GARDARA&&u.type===2||gardaraArtilleryCheck(u)};
baekArtilleryProfile=function(u,firing=false){if(u.f!==GARDARA||u.type!==2)return gardaraSPProfile(u,firing);const art=gardaraArtilleryArt,image=art[firing?'fire':'idle'],w=image.naturalWidth||1672,h=image.naturalHeight||941;return{art,w,h,mx:firing?72:27,my:firing?57:365,baseFacing:-1,flashAngle:.44}};
const gardaraPreviousSprite=sprite;
sprite=function(u,p,now){
 if(u.f!==GARDARA||[1,14,2].includes(u.type)||TYPES[u.type].branch==='infantry'&&u.type!==11)return gardaraPreviousSprite(u,p,now);
 if(isNaval(u)){p=unitVisualPosition(u,now);ctx.save();ctx.translate(p.x,p.y-3);drawShip(u,weaponAngle(u,now),-1);if(cam.z>.55){rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}ctx.restore();return}
 const branch=TYPES[u.type].branch,art=gardaraOtherVehicleArt[u.type]||(branch==='armor'?gardaraTankArt:branch==='artillery'?gardaraArtilleryArt:null);
 if(!art?.idleReady)return gardaraPreviousSprite(u,p,now);
 p=unitVisualPosition(u,now);const width=u.type===15?48:u.type===14?85:76,height=width*art.idle.naturalHeight/art.idle.naturalWidth,facing=Number.isFinite(u.angle)&&Math.cos(u.angle)<0?-1:1;
 ctx.save();ctx.translate(p.x,p.y-3);ctx.save();ctx.scale(facing*([15,16].includes(u.type)?-1:1),1);if(gardaraOtherVehicleArt[u.type]&&u.type!==14)ctx.filter='grayscale(1)';ctx.drawImage(art.idle,-width/2,14-height,width,height);ctx.restore();if(cam.z>.55){rect(-25,21,50,5,'#12211c');rect(-24,22,48*Math.max(0,u.hp/unitMaxHp(u)),3,factions[u.f].color)}ctx.restore();
};
Object.assign(window.Terha,{setup,migrateArmy,snapshot,infantryArtProfile,photoCityProfile,canCaptureCityUnit,productionPanel,sprite,GARDARA_GUARD,isBaekTank,baekTankProfile,isBaekArtillery,baekArtilleryProfile});
