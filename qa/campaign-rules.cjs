'use strict';
const assert=require('node:assert/strict'),R=require('../game/assets/campaign-rules.js'),D=require('../game/assets/campaign-data.js'),play=require('./campaign-player.cjs');
assert.equal(D.intro.length,25);assert.equal(D.missions.length,8);assert.deepEqual(D.implementedMissions,[1]);assert(D.missions.slice(1).every(m=>m.status==='planned'));
for(let level=0;level<3;level++){const s=R.create(level);assert(R.validate(s));play(R,s);assert.equal(s.status,'won');assert(s.produced>0);assert(R.validate(s));console.log('PASS legal campaign playthrough',level,{turn:s.turn,produced:s.produced,kills:s.kills,losses:s.losses})}
let s=R.create(),f=s.units[0];assert.equal(R.move(s,f.id,-1,4),false);assert.equal(R.move(s,f.id,3,7),false);assert.equal(R.move(s,f.id,2,0),false);assert.equal(R.attack(s,f.id,s.units[1].id),false);
const before=R.copy(s.resources),count=s.units.length;assert(R.produce(s,'base','rifle'));assert.equal(s.resources.gold,before.gold-40);assert.equal(s.resources.food,before.food-90);assert.equal(R.produce(s,'base','tank'),false);assert.equal(s.units.length,count);R.endTurn(s);assert.equal(s.produced,1);assert.equal(s.units.length,count+1);assert.equal(s.facilities[0].queue,null);
s=R.create();const base=s.facilities[0];let id=100;for(const p of [{q:base.q,r:base.r},...R.neighbors(base)])if(!R.at(s,p))s.units.push({...s.units[1],id:id++,q:p.q,r:p.r});assert(R.produce(s,'base','gun'));R.endTurn(s);assert.equal(s.produced,0);assert.equal(base.queue.kind,'gun');s.units=s.units.filter(u=>!(u.q===base.q&&u.r===base.r));R.endTurn(s);assert.equal(s.produced,1);assert.equal(base.queue,null);
s=R.create();let a=s.units.find(u=>u.side===0&&u.kind==='rifle'),b=s.units.find(u=>u.side===1);a.q=9;a.r=5;assert(R.attack(s,a.id,b.id));assert.equal(R.attack(s,a.id,b.id),false);assert.equal(R.move(s,a.id,9,6),false);
s=R.create();a=s.units.find(u=>u.side===0&&u.kind==='rifle');a.q=6;a.r=7;assert(R.move(s,a.id,7,7));assert.equal(s.facilities[1].side,0);
s=R.create();a=s.units.find(u=>u.side===0&&u.kind==='tank');a.q=6;a.r=7;assert(R.move(s,a.id,7,7));assert.equal(s.facilities[1].side,-1);
s=R.create();a=s.units[1];a.hp=50;assert(R.reinforce(s,a.id));assert.equal(a.hp,95);assert.equal(R.move(s,a.id,4,8),false);
s=R.create();f=s.units[0];f.hp=1;const enemy=s.units.find(u=>u.side===1);enemy.q=3;enemy.r=6;R.endTurn(s);assert.equal(s.status,'lost');assert(R.validate(s));assert.equal(R.produce(s,'base','rifle'),false);
assert.equal(R.validate(null),false);assert.equal(R.validate({schema:1}),false);s=R.create();s.units[0].q=99;assert.equal(R.validate(s),false);
console.log('PASS campaign rules: production/cost/queue/blocked deployment, capture, movement, retaliation, reinforcement, victory/defeat and corrupt-save guards');
