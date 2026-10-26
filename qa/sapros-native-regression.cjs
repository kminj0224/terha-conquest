'use strict';
// Reuse the real Canvas/DOM bootstrap without replaying unrelated release scenarios.
const fs=require('fs'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8');
const at=source.indexOf("assert.equal(run('appScreen'),'title');");assert(at>0);
new Function('require','__dirname',source.slice(0,at)+`
(async()=>{
 await Promise.all(pending);run('showStart()');await drain(nodes.get('start').onclick());await settle();
 await require('./sapros-live-regression.cjs')({run,nodes,click,settle});
 assert.deepEqual(errors,[]);console.log('PASS: standalone Sapros real Canvas/DOM scenario');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
