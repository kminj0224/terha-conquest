'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8'),at=source.indexOf("assert.equal(run('appScreen'),'title');");assert(at>0);
new Function('require','__dirname',source.slice(0,at)+`
(async()=>{
 await Promise.all(pending);run('player=0;setup();started=true;setAppScreen("game")');
 await require('./occupation-supply-regression.cjs')({run});
 await require('./siege-live-regression.cjs')({run});
 await require('./coastal-supply-live.cjs')({run});
 require('./attack-helicopter-scale-live.cjs')({run});
 assert.deepEqual(errors,[]);process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
