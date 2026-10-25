'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const prefix=fs.readFileSync(path.join(__dirname,'../game/assets/performance.js'),'utf8').split('let roadSignature=')[0];
for(const [userAgent,expected]of [['Android',3],['Desktop',5]]){
 let paints=0,scheduled=0;
 const b={navigator:{userAgent},units:[],missileBases:[],moving:[],unitAt(){},baseAt(){},unitVisualPosition(){},draw(){paints++;scheduled++},requestAnimationFrame(){scheduled++}};
 vm.createContext(b);vm.runInContext(prefix,b);
 for(const now of [0,16,34,50,68])b.draw(now);
 assert.equal(paints,expected,userAgent+' paint budget');
 assert.equal(scheduled,5,userAgent+' must preserve the frame loop');
 assert.equal(vm.runInContext('renderIndex',b),null,'Frame index must be released');
}
console.log('PASS: Android 30 FPS world budget, desktop cadence and continuous frame scheduling');
