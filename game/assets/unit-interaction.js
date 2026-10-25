'use strict';
// Inspection focus is independent of orders, allegiance, AP and the command panel.
let unitFocusId=null;
let defenseFocusId=null;
const movementVoices=new Map();
function focusedUnit(){
 const unit=units.find(u=>u.id===unitFocusId&&!u.carriedBy&&u.hp>0);
 if(!unit)unitFocusId=null;return unit;
}
function unitFocusVisible(u,now){
 if(u.id!==unitFocusId||u.carriedBy||u.hp<=0)return false;
 const animation=movingAnimation(u.id);
 return !animation||now>=animation.start+animation.duration;
}
function drawUnitFocus(u,p,now){
 if(!unitFocusVisible(u,now))return;
 ctx.save();const radius=Math.max(34,9/cam.z),width=Math.max(2.8,1.6/cam.z);
 hex(p,radius);ctx.strokeStyle='#15242ced';ctx.lineWidth=width+Math.max(2,1/cam.z);ctx.stroke();
 ctx.strokeStyle='#ffe6a0';ctx.lineWidth=width;ctx.stroke();ctx.restore();
}
function drawDefenseFocus(b,p){
 if(b.id!==defenseFocusId||b.hp<=0)return;
 ctx.save();const radius=Math.max(34,9/cam.z),width=Math.max(2.8,1.6/cam.z);
 hex(p,radius);ctx.strokeStyle='#15242ced';ctx.lineWidth=width+Math.max(2,1/cam.z);ctx.stroke();
 ctx.strokeStyle='#ffe6a0';ctx.lineWidth=width;ctx.stroke();ctx.restore();
}
function focusedDefense(){
 const base=missileBases.find(b=>b.id===defenseFocusId&&b.hp>0);
 if(!base)defenseFocusId=null;
 return base;
}
function playInterfaceSound(name,volume=.36){
 if(!sound||document.hidden)return;
 const context=ensureCombatAudio();if(!context)return;
 const play=()=>{if(sound&&!document.hidden)playCombatVoice({name,position:{x:cam.x,y:cam.y},start:performance.now(),volume,ui:true},performance.now())};
 if(context.state==='running')play();else context.resume().then(play).catch(()=>{});
}
function movementSoundProfile(u){
 if(isNaval(u)||tiles[u.tile]?.owner<0&&!isAircraft(u)&&!isHelicopter(u))return{name:'move_water',volume:.38};
 if(isHelicopter(u))return{name:'move_rotor',volume:.32};
 if(isAircraft(u))return{name:'move_jet',volume:.3};
 if(u.type===17)return{name:'move_hooves',volume:.38};
 if(u.type===18)return{name:'move_mech',volume:.38};
 if([11,12,3,16].includes(u.type))return{name:'move_wheels',volume:.35};
 if([1,2,13,14].includes(u.type))return{name:'move_tracks',volume:.4};
 return{name:'move_steps',volume:.42};
}
function stopMovementVoice(voice){
 if(!voice||voice.ended)return;
 const context=combatAudio.context;if(!context)return;
 try{voice.gain.gain.cancelScheduledValues(context.currentTime);voice.gain.gain.setTargetAtTime(0,context.currentTime,.006);voice.source.stop(context.currentTime+.025)}catch(error){}
 voice.ended=true;
}
function updateMovementAudio(now){
 if(!sound||document.hidden||skipAIAnimations()||campaignLoading){for(const voice of movementVoices.values())stopMovementVoice(voice);movementVoices.clear();return}
 const animations=new Set(moving);
 for(const [animation,voice]of movementVoices){const unit=units.find(u=>u.id===animation.id&&!u.carriedBy&&u.hp>0);if(!animations.has(animation)||!unit||now>=animation.start+animation.duration){stopMovementVoice(voice);movementVoices.delete(animation)}}
 for(const animation of moving){
  if(now<animation.start||now>=animation.start+animation.duration)continue;
  const unit=units.find(u=>u.id===animation.id&&!u.carriedBy&&u.hp>0);if(!unit)continue;
  const p=unitVisualPosition(unit,now);let voice=movementVoices.get(animation);
  if(!voice){const profile=movementSoundProfile(unit);voice=playCombatVoice({name:profile.name,position:p,start:now,end:animation.start+animation.duration,volume:profile.volume,loop:true},now);if(voice)movementVoices.set(animation,voice)}
  if(voice&&!voice.ended&&voice.panner){const width=Math.max(640,screenW/cam.z);voice.panner.pan.value=Math.max(-.7,Math.min(.7,(nearWorldPoint(p,cam).x-cam.x)/width*1.3))}
 }
}
const interactionStopAudio=stopCombatAudio;stopCombatAudio=function(includeUI=true){for(const voice of movementVoices.values())stopMovementVoice(voice);movementVoices.clear();return interactionStopAudio(includeUI)};
const interactionMove=moveUnit;moveUnit=function(u,i,ai=false){
 const result=interactionMove(u,i,ai);
 if(result&&!ai)unitFocusId=u.id
 return result;
};
function clearAttackingFocus(u){if(u&&unitFocusId===u.id)unitFocusId=null;}
const interactionAttack=attack;attack=function(u,v,ai=false){if(u&&v&&canAttack(u,v))clearAttackingFocus(u);return interactionAttack(u,v,ai)};
const interactionAttackCity=attackCity;attackCity=function(u,q,ai=false){if(u&&q&&canAttackCity(u,q))clearAttackingFocus(u);return interactionAttackCity(u,q,ai)};
const interactionAttackDefense=attackDefense;attackDefense=function(u,b,ai=false){if(u&&b&&canAttackDefense(u,b))clearAttackingFocus(u);return interactionAttackDefense(u,b,ai)};
const interactionSpendShot=spendShot;spendShot=function(u){clearAttackingFocus(u);return interactionSpendShot(u)};
const interactionLaunch=launchShot;launchShot=function(u,...args){clearAttackingFocus(u);return interactionLaunch(u,...args)};
const interactionTap=tap;tap=function(sx,sy){
 if(!started||busy||menuMode)return interactionTap(sx,sy);
 const tile=pickedNavalTile(sx,sy),hit=tile>=0?unitAt(tile):null,city=tile>=0?cityAt(tile):null,base=tile>=0?baseAt(tile):null;
 const prior=selected?.kind==='unit'?units.find(u=>u.id===selected.id):null;
 const normal=!airTarget&&!strategicTarget&&!navalMode&&!coastBuildMode;
 const attackOrder=normal&&prior?.f===player&&(hit&&canAttack(prior,hit)||!hit&&city&&canAttackCity(prior,city)||!hit&&base&&canAttackDefense(prior,base));
 // An attack click is a command; a click used to inspect any unit sets its focus.
 unitFocusId=normal&&hit&&!attackOrder?hit.id:null;
 defenseFocusId=normal&&!hit&&base&&!attackOrder?base.id:null;
 if(hit||normal&&(base||city)&&!attackOrder)playInterfaceSound('ui_select',.38);
 // Inspection replaces the old command selection, just as selecting a unit does.
 if(defenseFocusId!==null){selected=null;panelOpen=false;reach.clear();refreshSelection()}
 try{return interactionTap(sx,sy)}finally{focusedUnit();focusedDefense()}
};
const interactionSelectUnit=selectUnit;selectUnit=function(...args){defenseFocusId=null;return interactionSelectUnit(...args)};
const interactionSelectCity=selectCity;selectCity=function(...args){defenseFocusId=null;return interactionSelectCity(...args)};
const interactionNextUnit=nextUnit;nextUnit=function(){const previous=selected,result=interactionNextUnit();if(selected?.kind==='unit'&&selected!==previous){unitFocusId=selected.id;defenseFocusId=null}return result};$('next').onclick=nextUnit;
const interactionKill=kill;kill=function(u){if(unitFocusId===u.id)unitFocusId=null;return interactionKill(u)};
const interactionEndTurn=endTurn;endTurn=function(...args){if(!busy&&started){unitFocusId=null;defenseFocusId=null}return interactionEndTurn(...args)};$('turn').onclick=endTurn;
const interactionSetup=setup;setup=function(...args){unitFocusId=null;defenseFocusId=null;return interactionSetup(...args)};
const interactionMigration=migrateArmy;migrateArmy=function(...args){unitFocusId=null;defenseFocusId=null;return interactionMigration(...args)};
const interactionDraw=draw;draw=function(now){focusedUnit();focusedDefense();updateMovementAudio(now);return interactionDraw(now)};
// Capture handles current and dynamically created buttons, including nested SVGs,
// close buttons, command-center controls and keyboard-generated clicks, once each.
document.addEventListener('click',event=>{
 const button=event.target?.closest?.('button,input[type="button"],input[type="submit"],select,summary');
 if(!button||button.disabled||button.getAttribute?.('aria-disabled')==='true')return;
 if(button.id==='sound'&&!sound){queueMicrotask(()=>{if(sound)playInterfaceSound('ui_click',.34)})}else playInterfaceSound('ui_click',.34);
},true);
Object.assign(window.Terha,{tap,moveUnit,attack,attackCity,attackDefense,launchShot,spendShot,kill,endTurn,nextUnit,setup,migrateArmy,draw,drawUnitFocus,unitFocusVisible,movementSoundProfile});
