'use strict';
const fs=require('node:fs'),Module=require('node:module'),path=require('node:path');
const filename=path.join(__dirname,'native-test.cjs'),prelude=fs.readFileSync(filename,'utf8').split("assert.equal(run('appScreen'),'title');")[0];
const tail=`(async()=>{await Promise.all(pending);await require('./campaign-defense-status-native.cjs')({run,nodes,click,drain,stored});await require('./campaign-m03-native.cjs')({run,drain,stored});process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});`;
const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(__dirname);m._compile(prelude+tail,filename);
