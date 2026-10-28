'use strict';
// Campaign-only presentation. Orders, damage, movement, production and AI stay shared.
const CampaignPresentation=(()=>{
 const crownArt=new Image();crownArt.src='campaign-iron-crown-v3.webp';
 const crown=u=>!!activeScenario&&u?.missionRole==='iron-crown';
 const size=()=>({w:124,h:124*(crownArt.naturalHeight||1024)/(crownArt.naturalWidth||1536)});
 function muzzle(u,now=performance.now()){
  const p=unitVisualPosition(u,now),s=size(),side=Math.cos(weaponAngle(u,now))<0?-1:1;
  return{x:p.x+side*s.w*.43,y:p.y-s.h*.52};
 }
 const nativeSprite=sprite;
 sprite=function(u,p,now){
  if(!crown(u)||!crownArt.complete||!crownArt.naturalWidth)return nativeSprite(u,p,now);
  const pos=unitVisualPosition(u,now),s=size(),side=Math.cos(weaponAngle(u,now))<0?-1:1,f=fireMotions.get(u.id),t=f?(now-f.start)/f.duration:-1,recoil=t>=0&&t<1?Math.sin(t*Math.PI)*3:0;
  if(f&&t>=1)fireMotions.delete(u.id);
  ctx.save();ctx.translate(pos.x,pos.y-3);
  ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,4,43,12,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.scale(side,1);ctx.translate(-recoil,0);ctx.drawImage(crownArt,-s.w/2,7-s.h,s.w,s.h);ctx.restore();
  const ratio=Math.max(0,Math.min(1,u.hp/unitMaxHp(u)));
  rect(-26,21,52,6,'#14202bed');rect(-25,22,50*ratio,4,ratio>.35?'#8db4c3':'#e0a270');
  ctx.restore();
 };
 const nativeLaunch=launchShot;
 launchShot=function(u,target,start=performance.now(),duration=520){
  if(!crown(u))return nativeLaunch(u,target,start,duration);
  const m=muzzle(u,start);fireMotions.set(u.id,{start,duration:300});fx.push({kind:'shot',x:m.x,y:m.y,tx:target.x,ty:target.y,type:u.type,start,duration});return m;
 };
 const nativeFlag=drawNationalityFlag;
 drawNationalityFlag=function(item){
  if(item.kind!=='unit'||!crown(item.entity))return nativeFlag(item);
  if(cam.z<=.55)return;const s=size();ctx.save();ctx.translate(item.p.x,item.p.y-3);drawFlag(item.entity.f,-s.w*.43,3-s.h,15,10);line(-s.w*.43,3-s.h,-s.w*.43,8,'#c4caba',1);ctx.restore();
 };
 function alignGoalsButton(){
  const b=$('campaignObjectives');if(!b)return;
  b.disabled=busy;
  if(!activeScenario||appScreen!=='game')return;
  const r=$('menu').getBoundingClientRect();b.style.left=r.left+'px';b.style.top=(r.bottom+8)+'px';b.style.width=r.width+'px';b.style.height=r.height+'px';
 }
 function resume(){setAppScreen('game');alignGoalsButton()}
 function showGoals(){
  if(!activeScenario||busy||campaignLoading)return;
  const rows=CampaignBattle.goalRows();
  clearWorldNotices();setAppScreen('menu');appReturn='game';
  appBox('작전 목표','<div id="campaignGoalSheet"><ul class="campaignGoalList">'+rows.map(row=>'<li><span class="goalCheck">'+(row.done?'☑':'☐')+'</span><div><strong>'+row.label+'</strong><span>'+row.value+'</span></div></li>').join('')+'</ul></div>','campaignGoalWindow');
  $('appBack').textContent='계속';$('appBack').onclick=resume;
 }
 $('campaignObjectives').onclick=showGoals;
 const nativeHUD=updateHUD;updateHUD=function(...args){const r=nativeHUD(...args);alignGoalsButton();return r};
 const nativeBack=window.terhaBack;window.terhaBack=function(){if(activeScenario&&appScreen==='menu'&&$('campaignGoalSheet')&&!appConfirm)return resume();return nativeBack()};
 window.addEventListener('resize',alignGoalsButton);
 return{crownArt,isCrown:crown,muzzle,showGoals,alignGoalsButton};
})();

