'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const audit=JSON.parse(read('art/illustrated-plains-audit.json')),manifest=JSON.parse(read('art/aligned-map-manifest.json')),geo=JSON.parse(read('art/terrain-alignment-geography.json'));
assert.equal(audit.option,'B');assert.equal(audit.sceneryOption,2);assert.equal(audit.sceneryCoastClipping,false);
assert.equal(audit.plainRegions.length,48);assert.equal(new Set(audit.plainRegions.map(p=>p.name)).size,48);
let illustrated=0;for(const p of audit.plainRegions){assert.equal(p.profile,2);assert(p.onlyOrdinaryLand);assert(p.visiblePixels>=0);illustrated+=p.decorationClusters;}
assert(illustrated>1000);assert.equal(manifest.placements.length,2029);assert.equal(manifest.placements.filter(p=>p.terrain===2).length,954);assert.equal(manifest.placements.filter(p=>p.terrain===3).length,1075);assert.deepEqual(manifest.rivers,geo.reaches);
const byId=new Map(manifest.placements.map(p=>[p.tile,p])),seen=new Set();let mountains=new Set(),forests=new Set();
for(const s of audit.scenery){const p=byId.get(s.tile);assert(p);assert(s.coverage>0);assert.equal(s.option,2);assert.equal(s.rootX,p.x);assert.equal(s.rootY,p.y);assert.equal(s.anchorX,p.anchorX);assert.equal(s.anchorY,p.anchorY);assert.equal(s.scaleX,p.terrain===3?1.32:1.70);assert.equal(s.scaleY,p.terrain===3?1.65:1.60);(p.terrain===3?mountains:forests).add(s.recipe);seen.add(s.tile);}
assert.equal(seen.size,2029);assert.equal(mountains.size,8);assert.equal(forests.size,8);
const src=read('tools/connected-scenery.cjs');assert(!src.includes('if(sdf(wx,wy)<'));assert(!src.includes('||riverNear(wx,wy)'));
const version=read('build.py');assert(version.includes("VERSION='1.11.13';CODE=158"));for(const p of ['game/assets/app-shell.js','game/assets/saves.js'])assert(read(p).includes('1.11.13'));
console.log('PASS illustrated plain eligibility, all 48 regions, 2029 unchanged scenery roots, 8+8 forms, exact rivers and v1.11.13 identity',JSON.stringify({illustrated,seen:seen.size,riverReaches:manifest.rivers.length}));
