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
 assert(colors.every(c=>Math.max(...c)-Math.min(...c)<=65),'All territory pigments remain muted');assert(colors[4][0]>colors[4][1]&&colors[4][2]>colors[4][1],'Ranna pink');assert(colors[0][1]>colors[0][0]&&colors[0][1]>colors[0][2],'Baekyang grey-green');
 const plains=JSON.parse(run('JSON.stringify(tiles.map((t,i)=>({t,i})).filter(({t,i})=>MAP.tiles[i][0]===6&&t.city<0&&t.terrain<2&&neighbors(i).every(j=>tiles[j].terrain<2)).map(q=>q.i))'));assert(plains.length>3);
 const light=[];for(const tile of plains.slice(0,6)){run('cam.x=pxy('+tile+').x;cam.y=pxy('+tile+').y;cam.z=1.4;draw(1000)');await settle();run('draw(1000)');const view=run('groundView'),copy=createCanvas(view.width,view.height),g=copy.getContext('2d');g.drawImage(view,0,0);const c=g.getImageData(Math.floor(view.width/2),Math.floor(view.height/2),1,1).data;light.push((c[0]+c[1]+c[2])/3)}assert(light.filter(v=>v>180).length>=4,'Snowy plains must read as snow, '+JSON.stringify(light));
 assert.equal(reads,0);assert.deepEqual(errors,[]);console.log('PASS 2029 immutable scenery placements, unchanged coast/rivers/gameplay, muted faction colors and visibly snowy plains',JSON.stringify({snowLight:light}));process.exit(0)
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
