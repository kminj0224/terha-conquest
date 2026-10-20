const source=require('fs').readFileSync(require('path').join(__dirname,'native-test.cjs'),'utf8').split("assert.equal(run('appScreen'),'title')")[0];
new Function('require','__dirname',source+`
(async()=>{await Promise.all(pending);run("setup();started=true;setAppScreen('game');menuMode=false;busy=false;cam.x=5800;cam.y=2100;cam.z=1.4");await settle();run('draw(1000);let benchmarkFills=0;const benchmarkFill=fillNaturalOwnership;fillNaturalOwnership=function(...a){benchmarkFills++;return benchmarkFill(...a)}');
 const timers=require('perf_hooks').performance,times=[];
 for(let n=0;n<24;n++){const t=timers.now();run('cam.x+=2;draw(1000)');times.push(timers.now()-t)}
 const result={frames:times.length,ownershipFills:run('benchmarkFills'),meanMs:times.reduce((a,b)=>a+b)/times.length,p95Ms:times.sort((a,b)=>a-b)[Math.floor(times.length*.95)],cacheBytes:run('naturalDetailBytes'),pixelReads:reads};
 console.log(JSON.stringify(result));if(process.argv.includes('--assert')){assert.equal(result.ownershipFills,0,'Panning a loaded region must not decode or repaint ownership masks');assert(result.cacheBytes<=run('NATURAL_DETAIL_BUDGET'));assert.equal(reads,0);assert.deepEqual(errors,[])}process.exit(0)
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
