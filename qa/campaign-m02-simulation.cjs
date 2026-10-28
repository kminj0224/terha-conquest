'use strict';
// Reuse the real graphics/DOM test harness without running unrelated regressions.
const fs=require('node:fs'),Module=require('node:module'),path=require('node:path');
const filename=path.join(__dirname,'native-test.cjs');
const prelude=fs.readFileSync(filename,'utf8').split("assert.equal(run('appScreen'),'title');")[0];
const tail=`
(async()=>{
 await Promise.all(pending);run('setup();started=true;setAppScreen("game")');
 await require('./campaign-m02-playthrough.cjs')({run,drain});
 console.log('PASS standalone mission02 tactical simulation');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
`;
const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(__dirname);m._compile(prelude+tail,filename);
