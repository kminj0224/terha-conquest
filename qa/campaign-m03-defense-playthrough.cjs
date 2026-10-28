'use strict';
const fs=require('node:fs'),Module=require('node:module'),path=require('node:path');
const filename=path.join(__dirname,'native-test.cjs'),prelude=fs.readFileSync(filename,'utf8').split("assert.equal(run('appScreen'),'title');")[0];
// Isolated mission02 carry fixture; this does not claim a mission02 playthrough.
const tail=`(async()=>{await Promise.all(pending);run('setup();started=true;setAppScreen("game");CampaignBattle.start(null,1,{id:"iron-crown-m02"});tech[2]=2;window.lastM02Victory=JSON.parse(JSON.stringify(snapshot()));lastM02Victory.missionProgress.result="won";CampaignBattle.leave()');await require('./campaign-m03-playthrough.cjs')({run,drain});process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});`;
const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(__dirname);m._compile(prelude+tail,filename);
