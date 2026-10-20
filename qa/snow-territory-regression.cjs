const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'native-test.cjs'),'utf8').split("assert.equal(run('appScreen'),'title')")[0];
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
 assert.equal(reads,0);assert.deepEqual(errors,[]);console.log('PASS both v1.11.9 snow-region plains/bark/rock change owner color while white snow stays fixed');process.exit(0)
})().catch(e=>{console.error(e);process.exit(1)});
`)(require,__dirname);
