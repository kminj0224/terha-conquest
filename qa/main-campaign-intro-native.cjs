'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const nodes=new Map(),frames=new Map(),keys=[],visibility=[];let clock=0,serial=0,screen='battlefield',pickClosed=0,oldBacks=0;
class Element{
 constructor(){this.isConnected=true;this.textContent='';this.attrs={};this.hidden=false;this.style={}}
 set innerHTML(html){
  for(const e of nodes.values())if(e!==modal)e.isConnected=false;
  nodes.clear();nodes.set('modal',modal);
  for(const m of html.matchAll(/<[^>]+\bid="([^"]+)"[^>]*>/g)){
   const e=new Element();e.disabled=/\sdisabled\b/.test(m[0]);e.hidden=/\shidden\b/.test(m[0]);
   for(const a of m[0].matchAll(/([\w-]+)="([^"]*)"/g))e.attrs[a[1]]=a[2];nodes.set(m[1],e);
  }
  this.html=html;
 }
 setAttribute(k,v){this.attrs[k]=v}
 focus(){}
}
const modal=new Element();nodes.set('modal',modal);
const context={console,busy:false,$:id=>nodes.get(id),performance:{now:()=>clock},requestAnimationFrame:f=>{const id=++serial;frames.set(id,f);return id},cancelAnimationFrame:id=>frames.delete(id),document:{hidden:false,addEventListener:(name,f)=>{if(name==='keydown')keys.push(f);if(name==='visibilitychange')visibility.push(f)}},tr:ko=>ko,setAppScreen:name=>{screen=name},showBattlefield:()=>{context.setAppScreen('battlefield')},closeCampaignPicker:()=>{pickClosed++;context.closeCampaignPicker=null},terhaBack:()=>{oldBacks++}};
context.window=context;vm.createContext(context);
for(const name of ['main-campaign-data.js','main-campaign.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../game/assets',name),'utf8'),context,{filename:name});
const app=context.TerhaMainCampaign,lines=vm.runInContext('MAIN_CAMPAIGN_INTRO',context);
const click=id=>{const e=nodes.get(id);assert(e,id);if(!e.disabled)e.onclick()};
const tick=ms=>{clock+=ms;const callbacks=[...frames.values()];frames.clear();for(const f of callbacks)f(clock)};
const tap=()=>nodes.get('mainIntro').onclick?.({target:{closest:()=>null}});
const key=key=>{for(const f of keys)f({key,target:nodes.get('mainIntro'),preventDefault(){}})};
assert.equal(lines.length,45);assert.equal(lines.filter(l=>l.layout==='center').length,6);
assert(lines.every(l=>l.text&&(!l.image||l.image==='main-campaign-intro.jpg')));
assert.equal(lines[36].layout,'center');assert.equal(lines[36].image,'main-campaign-intro.jpg');
app.open();assert.equal(pickClosed,1);assert.equal(screen,'mainIntro');assert.equal(app.getPage(),0);
assert(!nodes.has('mcPrev'));assert(!nodes.has('mcNext'));assert(!nodes.has('mcPage'));
tap();key('ArrowRight');key('Enter');context.terhaBack();assert.equal(app.getPage(),0,'Central text rejects manual progression');
tick(999);assert.equal(nodes.get('mcVisible').style.opacity,'0');tick(1);assert.equal(nodes.get('mcVisible').style.opacity,'0');
tick(425);assert.equal(+nodes.get('mcVisible').style.opacity,.5);tick(425);assert.equal(+nodes.get('mcVisible').style.opacity,1);
tick(2999);assert.equal(+nodes.get('mcVisible').style.opacity,1);assert.equal(app.getPage(),0);tick(1);tick(425);assert.equal(+nodes.get('mcVisible').style.opacity,.5);
tick(424);assert.equal(app.getPage(),0);tick(1);assert.equal(app.getPage(),1,'Advance only after fade out');
assert(nodes.get('mcNext').hidden);assert(nodes.get('mcNext').disabled);nodes.get('mcNext').onclick();tap();key('ArrowRight');assert.equal(app.getPage(),1,'Typing cannot be bypassed');
const visible=nodes.get('mcVisible');tick(140);assert.equal(visible.textContent,lines[1].text.slice(0,10));tick(lines[1].text.length*14-140);assert.equal(visible.textContent,lines[1].text);assert.equal(nodes.get('mcNext').hidden,false);assert.equal(frames.size,0);
tap();assert.equal(app.getPage(),1,'Only next button/keyboard advances a complete banner');click('mcNext');assert.equal(app.getPage(),2);assert(nodes.get('mcNext').hidden);
click('mcSkip');assert.equal(frames.size,0);assert.equal(screen,'mainCampaign');tick(10000);assert(!nodes.has('mainIntro'));
click('mcWar');assert.equal(nodes.get('mcCampaignDetails').hidden,false);click('mcReplay');assert.equal(app.getPage(),0);
context.document.hidden=true;visibility.forEach(f=>f());tick(10000);assert.equal(app.getPage(),0);assert.equal(nodes.get('mcVisible').style.opacity,'0');context.document.hidden=false;visibility.forEach(f=>f());tick(1000);assert.equal(nodes.get('mcVisible').style.opacity,'0');
click('mcSkip');click('mcReplay');
for(let n=0;n<45;n++){
 assert.equal(app.getPage(),n);
 if(lines[n].layout==='center'){
  assert(!nodes.has('mcNext'));assert(!nodes.has('mcPrev'));tap();key('ArrowRight');context.terhaBack();assert.equal(app.getPage(),n);
  if(lines[n].image){tick(1999);assert.equal(nodes.get('mcVisible').style.opacity,'0');tick(4701)}else tick(5700);
 }else{
  assert(nodes.get('mcNext').hidden);tick(Array.from(lines[n].text).length*14);assert(!nodes.get('mcNext').hidden);click('mcNext');
 }
}
assert.equal(screen,'mainCampaign');assert.equal(frames.size,0);click('mcBack');assert.equal(screen,'battlefield');context.terhaBack();assert.equal(oldBacks,1);
app.open();const stale=[...frames.values()][0];click('mcSkip');stale(clock+10000);assert.equal(screen,'mainCampaign');assert.equal(frames.size,0);
app.open();context.setAppScreen('hub');assert.equal(frames.size,0);assert.equal(app.getView(),'closed');
assert(fs.existsSync(path.join(__dirname,'../game/assets/main-campaign-intro.jpg')));
console.log('PASS main prologue pacing: black 1s wait/850ms fade in/3s hold/850ms fade out, image-center 2s wait, auto-only centers, gated next after complete typing, no background tap/previous controls, Skip cancellation, visibility pause and all 45 pages');
