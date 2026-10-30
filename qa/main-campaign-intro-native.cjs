'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const nodes=new Map(),frames=new Map(),keys=[];let clock=0,serial=0,screen='battlefield',pickClosed=0,oldBacks=0;
class Element{
 constructor(){this.isConnected=true;this.textContent='';this.attrs={};this.hidden=false}
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
const context={console,busy:false,$:id=>nodes.get(id),performance:{now:()=>clock},requestAnimationFrame:f=>{const id=++serial;frames.set(id,f);return id},cancelAnimationFrame:id=>frames.delete(id),document:{addEventListener:(name,f)=>{if(name==='keydown')keys.push(f)}},tr:ko=>ko,setAppScreen:name=>{screen=name},showBattlefield:()=>{context.setAppScreen('battlefield')},closeCampaignPicker:()=>{pickClosed++;context.closeCampaignPicker=null},terhaBack:()=>{oldBacks++}};
context.window=context;vm.createContext(context);
for(const name of ['main-campaign-data.js','main-campaign.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../game/assets',name),'utf8'),context,{filename:name});
const app=context.TerhaMainCampaign,lines=vm.runInContext('MAIN_CAMPAIGN_INTRO',context);
const click=id=>{const e=nodes.get(id);assert(e,id);if(!e.disabled)e.onclick()};
const tick=ms=>{clock+=ms;const callbacks=[...frames.values()];frames.clear();for(const f of callbacks)f(clock)};
const tap=()=>nodes.get('mainIntro').onclick({target:{closest:()=>null}});
const key=key=>{for(const f of keys)f({key,target:nodes.get('mainIntro'),preventDefault(){}})};
assert.equal(lines.length,45);assert.equal(lines.filter(l=>l.layout==='center').length,6);
assert(lines.every(l=>l.text&&(!l.image||l.image==='main-campaign-intro.jpg')));
assert.equal(lines[36].layout,'center');assert.equal(lines[36].image,'main-campaign-intro.jpg');
app.open();assert.equal(pickClosed,1);assert.equal(screen,'mainIntro');assert.equal(app.getPage(),0);assert(nodes.get('mcPrev').disabled);
tap();assert.equal(app.getPage(),1);assert.equal(frames.size,1);
const oldVisible=nodes.get('mcVisible');assert.equal(oldVisible.textContent,'');tick(140);assert.equal(oldVisible.textContent,lines[1].text.slice(0,10));tick(4000);assert.equal(oldVisible.textContent,lines[1].text);assert.equal(frames.size,0);
click('mcNext');tick(28);assert.equal(nodes.get('mcVisible').textContent,lines[2].text.slice(0,2));
click('mcPrev');assert.equal(app.getPage(),1);assert.equal(nodes.get('mcVisible').textContent,'','Previous page restarts typing');
click('mcSkip');assert.equal(frames.size,0);assert.equal(screen,'mainCampaign');assert.equal(app.getView(),'selection');tick(10000);assert.equal(nodes.get('mainIntro'),undefined);
click('mcWar');assert.equal(nodes.get('mcCampaignDetails').hidden,false);assert.equal(nodes.get('mcWar').attrs['aria-pressed'],'true');
click('mcReplay');assert.equal(app.getPage(),0);key('ArrowRight');assert.equal(app.getPage(),1);key('ArrowLeft');assert.equal(app.getPage(),0);
for(let n=0;n<45;n++){assert.equal(app.getPage(),n);click('mcNext')}
assert.equal(screen,'mainCampaign');assert.equal(frames.size,0);
click('mcBack');assert.equal(screen,'battlefield');assert.equal(app.getView(),'closed');
app.open();click('mcNext');context.terhaBack();assert.equal(app.getPage(),0);context.terhaBack();assert.equal(screen,'battlefield');context.terhaBack();assert.equal(oldBacks,1);
app.open();click('mcNext');assert.equal(frames.size,1);context.setAppScreen('hub');assert.equal(app.getView(),'closed');assert.equal(frames.size,0,'Navigating away cancels pending typing');
assert(fs.existsSync(path.join(__dirname,'../game/assets/main-campaign-intro.jpg')));
const css=fs.readFileSync(path.join(__dirname,'../game/assets/main-campaign.css'),'utf8');assert(css.includes('mcReveal .85s ease 2s both'));assert(css.includes('#000 10%,#000 90%'));
console.log('PASS main prologue native: complete 45-page sequence, supplied image mapping, 14ms typing progression, previous/replay reset, cancellation on Skip/leave, touch, arrows, hardware Back, campaign selection and no storage access');
