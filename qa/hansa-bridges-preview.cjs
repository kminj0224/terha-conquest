'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8');
const at=source.indexOf("assert.equal(run('appScreen'),'title');");assert(at>0);
new Function('require','__dirname',source.slice(0,at)+`
(async()=>{await Promise.all(pending);run('setup();started=true;setAppScreen("game");const h=hansaBridgeCity();units=units.filter(u=>distance(u.tile,h.tile)>8);cam.x=pxy(h.tile).x-30;cam.y=pxy(h.tile).y-40;cam.z=1.06;');await settle();fs.mkdirSync(path.resolve(__dirname,'../previews'),{recursive:true});fs.writeFileSync(path.resolve(__dirname,'../previews/Hansa-v1.11.43.png'),main.toBuffer('image/png'));run('cam.x=5547;cam.y=2165;cam.z=2.5');await settle();fs.writeFileSync(path.resolve(__dirname,'../previews/Hansa-v1.11.43-west.png'),main.toBuffer('image/png'));assert.deepEqual(errors,[]);process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
