'use strict';
const fs=require('node:fs'),Module=require('node:module'),path=require('node:path');
const filename=path.join(__dirname,'native-test.cjs');
const prelude=fs.readFileSync(filename,'utf8').split("assert.equal(run('appScreen'),'title');")[0];
const tail=`(async()=>{await Promise.all(pending);console.log('Images ready');run('player=0;difficulty=0;setup();started=true;setAppScreen("game")');console.log('Setup ready');await require('./conquest-ai-regression.cjs')({run});assert.deepEqual(errors,[]);process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});`;
const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(__dirname);m._compile(prelude+tail,filename);
