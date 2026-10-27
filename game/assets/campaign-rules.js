'use strict';
// Isolated scenario state: never writes the conquest world, its RNG or save keys.
const CampaignRules=(()=>{
 const W=18,H=12,EXIT={q:16,r:4};
 const SPECS={
  rifle:{name:'소총수',type:0,hp:130,atk:25,def:8,move:3,range:1,cost:[40,90,0],capture:true},
  car:{name:'차륜 장갑차',type:12,hp:200,atk:40,def:14,move:4,range:1,cost:[65,220,6]},
  tank:{name:'전차',type:1,hp:280,atk:50,def:22,move:4,range:1,cost:[100,360,14]},
  gun:{name:'자주포',type:2,hp:95,atk:57,def:6,move:2,range:3,cost:[80,200,10]},
  fortress:{name:'상륙성 〈철관〉',type:-1,hp:1050,atk:90,def:30,move:2,range:4,cost:[0,0,0]}
 };
 const copy=x=>JSON.parse(JSON.stringify(x));
 function distance(a,b){const ay=a.r-(a.q-(a.q&1))/2,by=b.r-(b.q-(b.q&1))/2;return(Math.abs(a.q-b.q)+Math.abs(ay-by)+Math.abs(a.q-b.q+ay-by))/2}
 function terrain(q,r){if(q<0||q>=W||r<0||r>=H||r===0||r===H-1)return'mountain';if((q<=3&&r<=3)||(q>=14&&r>=8))return'forest';return'plain'}
 function neighbors(p){const out=[];for(let q=p.q-1;q<=p.q+1;q++)for(let r=p.r-1;r<=p.r+1;r++)if(distance(p,{q,r})===1&&terrain(q,r)!=='mountain')out.push({q,r});return out}
 function at(s,p){return s.units.find(u=>u.hp>0&&u.q===p.q&&u.r===p.r)}
 function add(s,side,kind,q,r,name){const u={id:s.nextId++,side,kind,q,r,hp:SPECS[kind].hp,moved:false,attacked:false,name:name||SPECS[kind].name};s.units.push(u);return u}
 function create(difficulty=1){const s={schema:1,mission:1,turn:1,difficulty:[0,1,2].includes(difficulty)?difficulty:1,nextId:1,resources:{gold:900,food:1100,oil:160},units:[],facilities:[{id:'base',name:'왕국군 집결지',q:2,r:8,side:0,queue:null},{id:'supply',name:'회랑 보급소',q:7,r:7,side:-1,queue:null},{id:'post',name:'관문 전초기지',q:13,r:5,side:1,queue:null}],status:'playing',log:['〈철관〉을 동쪽 출구로 이동시키십시오.'],produced:0,kills:0,losses:0};
 add(s,0,'fortress',2,7);add(s,0,'rifle',3,7,'베른 제1소총대');add(s,0,'rifle',3,8,'베른 제2소총대');add(s,0,'tank',2,6,'베른 기갑대');add(s,0,'gun',1,8,'베른 지원포대');
 for(const [k,q,r]of [['rifle',10,5],['rifle',12,5],['car',12,7],['rifle',15,4],['gun',15,6]])add(s,1,k,q,r);
 if(s.difficulty===2)add(s,1,'tank',14,6);
 if(s.difficulty===0){s.resources.gold+=300;s.resources.food+=300;for(const u of s.units.filter(u=>u.side===1))u.hp=Math.round(u.hp*.8)}return s}
 function note(s,t){s.log.unshift(t);s.log=s.log.slice(0,12)}
 function paths(s,u){const costs=new Map([[u.q+','+u.r,0]]),open=[{q:u.q,r:u.r}];if(s.status!=='playing'||u.moved||u.attacked)return costs;
 while(open.length){const p=open.shift(),cost=costs.get(p.q+','+p.r);for(const n of neighbors(p)){if(at(s,n))continue;const v=cost+(terrain(n.q,n.r)==='forest'?2:1),key=n.q+','+n.r;if(v<=SPECS[u.kind].move&&v<(costs.get(key)??Infinity)){costs.set(key,v);open.push(n)}}}return costs}
 function finish(s){const fort=s.units.find(u=>u.side===0&&u.kind==='fortress'&&u.hp>0);if(!fort){s.status='lost';note(s,'〈철관〉 격파. 임무 실패.')}else if(fort.q===EXIT.q&&fort.r===EXIT.r){s.status='won';note(s,'〈철관〉이 출구에 도착했습니다. 출정 허가 임무 완료.')}return s.status}
 function move(s,id,q,r){const u=s.units.find(u=>u.id===id&&u.side===0&&u.hp>0);if(!u||s.status!=='playing'||u.moved||u.attacked||at(s,{q,r})||!paths(s,u).has(q+','+r))return false;u.q=q;u.r=r;u.moved=true;capture(s,u);finish(s);return true}
 function capture(s,u){if(!SPECS[u.kind].capture)return;const f=s.facilities.find(f=>f.q===u.q&&f.r===u.r);if(f&&f.side!==u.side){f.side=u.side;f.queue=null;note(s,u.name+' · '+f.name+' 확보')}}
 function canFire(s,u,v){return s.status==='playing'&&u&&v&&u.hp>0&&v.hp>0&&u.side!==v.side&&!u.attacked&&distance(u,v)<=SPECS[u.kind].range}
 function damage(s,u,v,factor=1){let d=Math.max(8,SPECS[u.kind].atk-SPECS[v.kind].def*.5);if(terrain(v.q,v.r)==='forest')d*=.8;if(u.side===1)d*=s.difficulty===0?.8:s.difficulty===2?1.15:1;if(u.kind==='tank'||u.kind==='car')if(v.kind==='rifle')d*=1.2;return Math.max(1,Math.round(d*factor))}
 function fire(s,u,v){if(!canFire(s,u,v))return false;u.attacked=true;const d=damage(s,u,v);v.hp-=d;note(s,u.name+' → '+v.name+' −'+d);if(v.hp>0&&distance(u,v)<=SPECS[v.kind].range&&v.kind!=='gun'){u.hp-=damage(s,v,u,.35)}cleanup(s);finish(s);return true}
 function attack(s,a,b){const u=s.units.find(u=>u.id===a&&u.side===0),v=s.units.find(u=>u.id===b);return fire(s,u,v)}
 function cleanup(s){for(const u of s.units.filter(u=>u.hp<=0)){if(u.side===0)s.losses++;else s.kills++;note(s,u.name+' 격파')}s.units=s.units.filter(u=>u.hp>0)}
 function producers(s){const f=s.units.find(u=>u.kind==='fortress'&&u.side===0);return [...s.facilities.filter(x=>x.side===0),...(f?[{id:'fortress',name:'〈철관〉',q:f.q,r:f.r,side:0,queue:s.fortressQueue||null}]:[])]}
 function produce(s,source,kind){const p=producers(s).find(p=>p.id===source),t=SPECS[kind];if(s.status!=='playing'||!p||p.queue||!t||kind==='fortress'||s.units.filter(u=>u.side===0).length>=24)return false;const a=['gold','food','oil'];if(a.some((key,i)=>s.resources[key]<t.cost[i]))return false;a.forEach((key,i)=>s.resources[key]-=t.cost[i]);const queue={kind};if(source==='fortress')s.fortressQueue=queue;else s.facilities.find(f=>f.id===source).queue=queue;note(s,p.name+' · '+t.name+' 생산 중');return true}
 function reinforce(s,id){const u=s.units.find(u=>u.id===id&&u.side===0);if(s.status!=='playing'||!u||u.kind==='fortress'||u.moved||u.attacked||u.hp>=SPECS[u.kind].hp||!producers(s).some(p=>distance(u,p)<=1))return false;const amount=Math.min(45,SPECS[u.kind].hp-u.hp),price=Math.ceil(amount*1.2);if(s.resources.gold<price||s.resources.food<amount)return false;s.resources.gold-=price;s.resources.food-=amount;u.hp+=amount;u.moved=u.attacked=true;note(s,u.name+' 보충 +'+amount);return true}
 function deploy(s){for(const p of producers(s)){if(!p.queue)continue;const candidates=[{q:p.q,r:p.r},...neighbors(p)].filter(n=>!at(s,n));if(!candidates.length){note(s,p.name+' · 배치 공간 부족, 생산 완료 대기');continue}const n=candidates[0],kind=p.queue.kind;add(s,0,kind,n.q,n.r);s.produced++;if(p.id==='fortress')s.fortressQueue=null;else s.facilities.find(f=>f.id===p.id).queue=null;note(s,SPECS[kind].name+' 배치 완료')}}
 function enemyTurn(s){for(const u of s.units.filter(u=>u.side===1)){if(s.status!=='playing')break;const targets=s.units.filter(v=>v.side===0);let v=targets.filter(v=>canFire(s,u,v)).sort((a,b)=>a.hp-b.hp)[0];if(v){fire(s,u,v);continue}const nearest=targets.sort((a,b)=>distance(u,a)-distance(u,b))[0];if(!nearest||distance(u,nearest)>7)continue;const options=[...paths(s,u).keys()].map(key=>{const[q,r]=key.split(',').map(Number);return{q,r}}).sort((a,b)=>distance(a,nearest)-distance(b,nearest));const p=options.find(p=>!at(s,p));if(p&&distance(p,nearest)<distance(u,nearest)){u.q=p.q;u.r=p.r;u.moved=true;capture(s,u)}v=s.units.filter(v=>v.side===0&&canFire(s,u,v)).sort((a,b)=>a.hp-b.hp)[0];if(v)fire(s,u,v)}}
 function endTurn(s){if(s.status!=='playing')return false;for(const u of s.units.filter(u=>u.side===1)){u.moved=false;u.attacked=false}enemyTurn(s);if(s.status!=='playing')return true;s.turn++;for(const u of s.units){u.moved=false;u.attacked=false}const count=s.facilities.filter(f=>f.side===0).length;s.resources.gold+=70+50*count;s.resources.food+=90+70*count;s.resources.oil+=8+7*count;deploy(s);
 const fort=s.units.find(u=>u.kind==='fortress'&&u.side===0);if(fort&&s.facilities.some(f=>f.side===0&&distance(f,fort)<=1))fort.hp=Math.min(SPECS.fortress.hp,fort.hp+30);
 if(s.turn>=6&&s.turn%4===2&&s.facilities.find(f=>f.id==='post').side===1&&s.units.filter(u=>u.side===1).length<8){const p=[{q:16,r:6},{q:16,r:7},{q:15,r:7}].find(p=>!at(s,p));if(p){add(s,1,'rifle',p.q,p.r);note(s,'단테 정찰대 증원 접근')}}
 note(s,s.turn+'턴 · 자원 수입과 생산 처리 완료');finish(s);return true}
 function validate(s){if(!s||s.schema!==1||s.mission!==1||!['playing','won','lost'].includes(s.status)||!Array.isArray(s.units)||!Array.isArray(s.facilities)||!Number.isInteger(s.turn)||s.turn<1||!s.resources||Object.values(s.resources).some(n=>!Number.isFinite(n)||n<0)||!Number.isInteger(s.nextId))return false;
 if(s.facilities.length!==3||!['base','supply','post'].every(id=>s.facilities.some(f=>f.id===id)))return false;const ids=new Set(),occupied=new Set();for(const u of s.units){const key=u.q+','+u.r;if(!SPECS[u.kind]||!Number.isInteger(u.id)||ids.has(u.id)||occupied.has(key)||![0,1].includes(u.side)||!Number.isInteger(u.q)||!Number.isInteger(u.r)||terrain(u.q,u.r)==='mountain'||!Number.isFinite(u.hp)||u.hp<=0||u.hp>SPECS[u.kind].hp)return false;ids.add(u.id);occupied.add(key)}return true}
 return{W,H,EXIT,SPECS,copy,create,distance,terrain,neighbors,at,paths,move,attack,canFire,damage,produce,producers,reinforce,endTurn,validate};
})();
if(typeof module!=='undefined')module.exports=CampaignRules;
