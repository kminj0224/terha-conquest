'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'../game/assets/defense-research.js'),'utf8');
const fn=source.split('\n').find(line=>line.startsWith('async function attackDefense('));assert(fn);
async function check(type,expected,ai){
 const delays=[],events=[];let shooting=false;
 const b={busy:false,TYPES:{12:{attackWindup:1000}},canAttackDefense:()=>true,finishMovingBeforeFire:async()=>{},spendShot(){},pxy:()=>({x:0,y:0}),beginAim(){},delay:async ms=>{delays.push(ms);if(shooting)assert.equal(ms,expected)},launchShot(){shooting=true;events.push('fire')},defenseAttackDamage:()=>{events.push('damage');return 10},targetExplosions(){events.push('impact')},isTowedArtillery:u=>u.type===16,isBaekArtillery:u=>u.type===2,missileBases:[],log(){},refreshSelection(){},updateHUD(){},save(){}};
 vm.createContext(b);vm.runInContext(fn,b);const target={hp:100,f:1,tile:1};
 assert.equal(await b.attackDefense({type,f:0,tile:0},target,ai),true);
 assert.deepEqual(delays,[100,expected]);assert.deepEqual(events,['fire','damage','impact']);assert.equal(target.hp,90);assert.equal(b.busy,false);
}
(async()=>{for(const ai of [false,true]){await check(12,1000,ai);await check(0,600,ai);await check(16,1200,ai);await check(25,1344,ai)}console.log('PASS: defense attacks retain full 1.0-second armored-car burst before damage, other weapon timings unchanged')})().catch(e=>{console.error(e);process.exit(1)});
