'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../game/assets'),noop=()=>{};
let clock=1000;const draws=[],waits=[];
const images=new Map(['idle','windup','strike','dead','effects'].map(p=>['sapros-'+p+'.webp',{src:p,naturalWidth:p==='effects'?1536:576,naturalHeight:768}]));
const b={console,Map,Set,Math,Number,window:{Terha:{}},S:64,player:3,productionTier:1,productionAA:false,
 TYPES:Array.from({length:28},(_,i)=>({branch:i===11||i===0?'infantry':i===2?'artillery':'armor',atk:20,hp:100,text:''})),UNIT_STORIES:{},factions:Array.from({length:7},()=>({bonus:'',name:'Nation',color:'#abc'})),units:[],tiles:Array.from({length:20},()=>({owner:3})),fx:[],fireMotions:new Map(),
 loadBaekArt:name=>({idle:images.get(name),idleReady:true}),unitAttack:()=>20,unitOil:()=>12,moveOil:()=>2,attackOil:()=>1,productionPanel:noop,launchShot:noop,sprite:noop,targetExplosions:()=>b.fx.push({kind:'blast'}),
 kill:u=>{b.units=b.units.filter(v=>v!==u);b.fx.push({kind:'wreck'})},
 $:()=>null,document:{createElement:()=>({})},unitPrice:(k,l=1)=>Math.ceil(b.TYPES[k].cost*(1+(l-1)*.25)),aaCost:()=>0,productionReason:()=>'',produce:noop,showProductionInfo:noop,
 skipAIAnimations:()=>false,pxy:i=>({x:i*64,y:180}),unitVisualPosition:u=>({x:u.tile*64,y:180}),movingAnimation:()=>null,distance:(a,c)=>Math.abs(a-c),performance:{now:()=>clock},
 ctx:new Proxy({drawImage:(im,...args)=>draws.push({src:im.src,args}),save:noop,restore:noop,translate:noop,scale:noop,beginPath:noop,ellipse:noop,fill:noop,fillText:noop},{set:(o,k,v)=>(o[k]=v,true)}),rect:noop,cam:{z:1},unitMaxHp:u=>b.TYPES[u.type].hp,
 canAttack:()=>true,canAttackCity:()=>true,finishMovingBeforeFire:async()=>{},spendShot:u=>{u.attacked=true},damage:()=>97,specialIncomingFactor:()=>1,beginAim:noop,audioShot:noop,
 delay:async ms=>{waits.push(ms);if(ms===1200){assert.equal(b.units[1].hp,500,'No damage during raised-arm pose');assert.equal(vm.runInContext('saprosPose(units[0],performance.now()+1199).idle.src',b),'windup')}clock+=ms},
 siegeDamage:()=>1000,damageCity:(q,d)=>{q.hp=Math.max(0,q.hp-d);return d},cityDamageFloor:()=>0,cityAt:()=>null,atWar:(a,c)=>a!==c,rannaTerrainProtection:()=>1,canCounterattack:()=>false,rollCounterattack:()=>false,
 log:noop,selectUnit:noop,updateHUD:noop,save:noop,killReward:u=>{u.attackReady=true},toast:noop,isFlashInfantry:()=>false,isCannonTank:()=>false,isBaekArtillery:()=>false,isTowedArtillery:()=>false};
vm.createContext(b);const run=s=>vm.runInContext(s,b);
const orders=fs.readFileSync(path.join(root,'orders.js'),'utf8');
run(orders.slice(orders.indexOf('async function attackCity('),orders.indexOf('const beforeLaunch=')));
run(fs.readFileSync(path.join(root,'sapros.js'),'utf8'));
const k=run('SAPROS');assert.equal(k,28);assert.deepEqual([b.TYPES[k].cost,b.TYPES[k].atk,b.TYPES[k].hp,b.TYPES[k].range],[967,97,989,2]);assert(b.TYPES[k].tank);assert.equal(b.TYPES[k].special,3);
for(let l=1;l<=4;l++){assert.equal(run(`unitOil(SAPROS,${l})`),0);assert.equal(run(`attackOil({type:SAPROS,level:${l}})`),0);assert.equal(run(`moveOil({type:SAPROS,level:${l}})`),0)}assert.equal(run('unitOil(1)'),12);
b.units=[{id:1,type:k,f:3,tile:0,hp:989},{id:2,type:0,f:3,tile:3,hp:500}];
assert.equal(run('unitAttack(units[1])'),29,'45% within exactly three tiles');
b.units[1].tile=4;assert.equal(run('unitAttack(units[1])'),20);b.units[1].tile=3;b.units.push({...b.units[0],id:3});assert.equal(run('unitAttack(units[1])'),29,'No stacking');
b.units[1].f=0;assert.equal(run('unitAttack(units[1])'),20);b.units[1].f=3;for(const s of b.units.filter(u=>u.type===k))s.carriedBy=99;assert.equal(run('unitAttack(units[1])'),20);for(const s of b.units)s.carriedBy=null;
assert.equal(run('saprosImpactKind({type:0})'),'saprosBlood');assert.equal(run('saprosImpactKind({type:11})'),null);assert.equal(run('saprosImpactKind({type:1})'),'saprosSparks');assert.equal(run('saprosImpactKind({type:2})'),'saprosSparks');
run('launchShot(units[0],{x:10,y:10},1000)');assert.equal(run('saprosPose(units[0],2199).idle.src'),'windup');assert.equal(run('saprosPose(units[0],2200).idle.src'),'strike');assert.equal(run('saprosPose(units[0],2560).idle.src'),'idle');
run('sprite(units[0],{x:0,y:0},1000)');assert.equal(draws.at(-1).src,'idle');assert.equal(draws.at(-1).args[3],128,'Two-tile idle height');
run(`drawSaprosEffect({kind:'saprosBlood',x:0,y:0,damage:97},.4);drawSaprosEffect({kind:'saprosSparks',x:0,y:0,damage:97},.4)`);assert(draws.slice(-2).every(d=>d.src==='effects'&&d.args.length===8),'Paint atlas illustration frames');
(async()=>{
 b.units=b.units.slice(0,2);b.units[0].attacked=false;b.units[0].level=1;b.units[1].tile=2;clock=1000;
 assert(await run('attack(units[0],units[1],true)'));assert(waits.includes(1200));assert.equal(b.units[1].hp,403);assert(b.fx.some(e=>e.kind==='saprosBlood'));
 const u=b.units[0];b.fx=[];run('kill(units[0])');assert(!b.units.includes(u));assert.equal(b.fx.length,1);assert.equal(b.fx[0].kind,'saprosRemains');run('drawSaprosEffect(fx[0],.1)');assert.equal(draws.at(-1).src,'dead');
 console.log('PASS: append-only type, food 967, stats, zero oil, three-tile non-stacking living/friendly support, 1.2s attack damage, sequential poses, two-tile height, illustrated impact classification and corpse');
})().catch(e=>{console.error(e);process.exit(1)});
