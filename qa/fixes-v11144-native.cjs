'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8');const at=source.indexOf("assert.equal(run('appScreen'),'title');");assert(at>0);
new Function('require','__dirname',source.slice(0,at)+`
(async()=>{await Promise.all(pending);await require('./hansa-bridges-live.cjs')({run,nodes,click,settle,drain});await require('./fixes-v11144-live.cjs')({run,nodes,click,settle,drain});assert.deepEqual(errors,[]);process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
