const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'..'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const reference=JSON.parse(fs.readFileSync(path.join(root,'art/terrain-style-reference.json'))),m=JSON.parse(fs.readFileSync(path.join(root,'art/aligned-map-manifest.json')));
assert.equal(sha(JSON.stringify(m.placements)),reference.placements,'Every forest/mountain position, bounds, asset and tile must stay exact');
assert.equal(sha(JSON.stringify(m.rivers)),reference.rivers,'Every river sample stays exact');
for(const[name,hash]of Object.entries(reference.files))assert.equal(sha(fs.readFileSync(path.join(root,name))),hash,name+' stays exact');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8').split("assert.equal(run('appScreen'),'title')")[0];
new Function('require','__dirname',source+`
(async()=>{await Promise.all(pending);run("setup();started=true;setAppScreen('game');menuMode=false;busy=false");await settle();
 const colors=JSON.parse(run('JSON.stringify(NATURAL_OWNERSHIP_COLORS)')).map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
 assert(colors.every(c=>Math.max(...c)-Math.min(...c)<=100&&Math.min(...c)>=60&&Math.max(...c)<=195),'Moderate pigments without neon extremes');assert(colors[4][0]>colors[4][1]&&colors[4][2]>colors[4][1],'Ranna pink');assert(colors[0][1]>colors[0][0]&&colors[0][1]>colors[0][2],'Baekyang grey-green');assert(colors[0][1]-colors[0][0]>=40,'Restore reference-level green saturation');assert(colors[1][0]>colors[1][1]&&colors[1][1]>colors[1][2],'Dante red-brown');
 assert.equal(reads,0);assert.deepEqual(errors,[]);console.log('PASS 2029 immutable scenery anchors, unchanged coast/rivers/gameplay and moderate territory pigments');process.exit(0)
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
