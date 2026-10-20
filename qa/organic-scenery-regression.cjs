const fs0=require('fs'),path0=require('path'),assert0=require('assert');
const manifest=JSON.parse(fs0.readFileSync(path0.join(__dirname,'../art/aligned-map-manifest.json'))),audit=JSON.parse(fs0.readFileSync(path0.join(__dirname,'../art/scenery-variation-audit.json'))),geo=JSON.parse(fs0.readFileSync(path0.join(__dirname,'../art/terrain-alignment-geography.json')));
assert0.equal(audit.styles.length,manifest.placements.length);
assert0.deepEqual(audit.styles.map(p=>p.tile).sort((a,b)=>a-b),manifest.placements.map(p=>p.tile).sort((a,b)=>a-b),'No added or missing forest/mountain gameplay tile');
for(const p of audit.styles){const t=geo.tiles[p.tile];assert0.equal(p.terrain,t.terrain);assert0.equal(p.anchorX,t.x);assert0.equal(p.anchorY,t.y);assert0(p.coverage>20,'Every scenery tile retains actual painted pixels');if(p.dense)assert0(t.owner===4&&t.terrain===2,'Dense jungle only on original Ranna forest tiles')}
assert0(new Set(audit.styles.map(p=>p.hash)).size>audit.styles.length*.97,'Individual silhouette/cluster variants must differ');
assert0(new Set(audit.styles.filter(p=>p.terrain===2&&!p.dense).map(p=>p.foliageGroups)).size>=3,'Vary actual tree-cluster counts, not only tint or mirroring');
const jungle=audit.styles.filter(p=>p.dense),ratio=jungle.map(p=>p.coverage/Math.max(1,p.eligible)).sort((a,b)=>a-b);assert0.equal(jungle.length,87);assert0(ratio[Math.floor(ratio.length/2)]>.64,'Dense canopy inside each eligible forest hex');
assert0(new Set(audit.styles.filter(p=>p.terrain===3&&!p.source.includes('snow')).map(p=>p.source)).size>=3,'Multiple mountain ridge families');
const source=fs0.readFileSync(path0.join(__dirname,'native-test.cjs'),'utf8').split("assert.equal(run('appScreen'),'title')")[0];
new Function('require','__dirname',source+`
(async()=>{await Promise.all(pending);run("setup();started=true;setAppScreen('game');menuMode=false;busy=false");await settle();
 const probes=JSON.parse(fs.readFileSync(path.join(root,'../../art/ownership-probes.json'))),data=JSON.parse(run('JSON.stringify(NATURAL_OWNERSHIP)'));
 function valueAt(p){const m=data.regions[p.region].near,b=Buffer.from(m.runs,'base64'),target=p.y*m.w+p.x;let npx=0;for(let n=0;n<b.length;n+=5){const count=b.readUInt16LE(n+3);if(npx+count>target)return{id:b.readUInt16LE(n),alpha:b[n+2]};npx+=count}throw Error('Invalid probe')}
 function point(p){const a=p.region.split('-').slice(1).map(Number);return{x:((a[0]*181-14)+(p.x+.5)/6)/1448*run('WW'),y:((a[1]*181-14)+(p.y+.5)/6)/1086*run('HH')}}
 function sample(){const v=run('groundView'),copy=createCanvas(v.width,v.height),g=copy.getContext('2d');g.drawImage(v,0,0);return Array.from(g.getImageData(Math.floor(v.width/2),Math.floor(v.height/2),1,1).data).slice(0,3)}
 async function capture(p){const pos=point(p),original=run('tiles['+p.tile+'].owner');run('cam.x='+(pos.x-.5/1.4)+';cam.y='+(pos.y-.5/1.4)+';cam.z=1.4;tiles['+p.tile+'].owner=0;territoryDirty=true;draw(1000)');await settle();run('draw(1000)');const green=sample();run('tiles['+p.tile+'].owner=4;territoryDirty=true;draw(1000)');const pink=sample();run('tiles['+p.tile+'].owner='+original+';territoryDirty=true');return{green,pink}}
 const bare=probes.bare.filter(p=>{const v=valueAt(p);return v.id===p.tile+1&&v.alpha>240}),ground=probes.ground.filter(p=>{const v=valueAt(p);return v.id===p.tile+1&&v.alpha>240});assert(bare.length>15&&ground.length>5);
 const points=[bare.find(p=>p.terrain===2),bare.find(p=>p.terrain===3),ground.find(p=>run('MAP.tiles['+p.tile+'][0]')===0),ground.find(p=>run('MAP.tiles['+p.tile+'][0]')===6)];assert(points.every(Boolean),'Both snow regions, trees and mountains need paint probes');
 for(const p of points){const a=await capture(p);assert(Math.hypot(...a.green.map((v,i)=>v-a.pink[i]))>18,'Snow-free ground/bark/rock must follow its current owner')}
 let fixed=0;for(const p of probes.snow.filter(p=>valueAt(p).alpha===0).slice(0,15)){const a=await capture(p);if(Math.min(...a.green)<210)continue;if(a.green.every((v,i)=>Math.abs(v-a.pink[i])<4))fixed++;if(fixed>=3)break}assert(fixed>=3,'Snow stays white after capture');
 assert.equal(reads,0);assert.deepEqual(errors,[]);console.log('PASS unique fixed variants, 87 dense existing jungle tiles, both snow-region plains/bark/rock change owner color while white snow stays fixed');process.exit(0)
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
