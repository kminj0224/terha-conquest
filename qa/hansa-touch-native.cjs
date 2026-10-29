'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const filename=path.join(__dirname,'native-test.cjs');
let prelude=fs.readFileSync(filename,'utf8').split("assert.equal(run('appScreen'),'title');")[0];
prelude=prelude.replace('c.addEventListener=()=>{};',"c._events=new Map();c.addEventListener=(name,handler)=>c._events.set(name,handler);c.setPointerCapture=()=>{};");
const tail=`(async()=>{await Promise.all(pending);console.log('Images ready');run('player=0;setup();started=true;setAppScreen("game")');await require('./hansa-touch-regression.cjs')({run,nodes,click});await require('./hansa-bridges-live.cjs')({run,nodes,click,settle,drain});assert.deepEqual(errors,[]);process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});`;
const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(__dirname);m._compile(prelude+tail,filename);
