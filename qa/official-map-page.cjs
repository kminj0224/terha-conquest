'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const map=JSON.parse(fs.readFileSync('game/assets/mapdata.js','utf8').replace(/^const MAP=/,'').trim().replace(/;$/,''));
const audit=JSON.parse(fs.readFileSync('art/aligned-map-ext0.json'));
assert.equal(audit.coast.wrongLand,0);assert.equal(audit.coast.wrongWater,0);
assert.equal(audit.rivers.length,3);assert.equal(audit.cities.length,9);
assert(audit.placements.some(p=>p.terrain===3));assert(audit.placements.some(p=>p.terrain===2));
assert(audit.placements.every(p=>p.biome==='tropical'),'Shared tropical climate for all scenery');
assert(audit.placements.filter(p=>p.terrain===2).every(p=>p.asset==='palm'),'Generated tropical forest material selected');
const b={NATURAL_OWNERSHIP:{regions:{}},NATURAL_DETAIL:{regions:[]}};vm.runInNewContext(fs.readFileSync('game/assets/map-page-ext0-data.js','utf8'),b);
assert.equal(b.NATURAL_DETAIL.regions.length,8);assert.equal(Object.keys(b.NATURAL_OWNERSHIP.regions).length,4);
const labels=new Set();for(const data of Object.values(b.NATURAL_OWNERSHIP.regions)){for(const level of ['near','mid']){const m=data[level],runs=Buffer.from(m.runs,'base64');let pixels=0;for(let n=0;n<runs.length;n+=5){const id=runs[n]|runs[n+1]<<8,a=runs[n+2],count=runs[n+3]|runs[n+4]<<8;assert(count>0);pixels+=count;if(a&&id)labels.add(id-1)}assert.equal(pixels,m.w*m.h)}}
for(const p of audit.placements)assert(labels.has(p.tile),'Complete scenery shares anchor ownership '+p.tile);
for(const p of audit.placements){assert(p.x-p.w/2>audit.bounds.x&&p.x+p.w/2<audit.bounds.x+audit.bounds.w);assert(p.y-p.h>audit.bounds.y&&p.y<audit.bounds.y+audit.bounds.h)}
assert(map.extraTiles.length>85&&map.extraTiles.length<150);
console.log('PASS official page coast/tile alignment, tropical scenery, 3 rivers, 9 clear city footprints, complete scenery bounds and identical ownership labels for every scenery anchor');
