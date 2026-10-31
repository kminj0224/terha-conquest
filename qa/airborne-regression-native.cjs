'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8'),at=source.indexOf("assert.equal(run('appScreen'),'title');");
new Function('require','__dirname',source.slice(0,at)+
"\n(async()=>{await Promise.all(pending);const report=await run("+JSON.stringify(testCode)+");assert(report.rescue==='non-airborne ally only');assert.deepEqual(errors,[]);console.log('PASS airborne and mortar regression',JSON.stringify(report));process.exit(0)})().catch(e=>{console.error(e);process.exit(1)})\n")(require,__dirname);
