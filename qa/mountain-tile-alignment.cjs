'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
process.chdir(path.resolve(__dirname,'..'));
const audit=JSON.parse(fs.readFileSync('art/mountain-tile-alignment.json'));
const geo=JSON.parse(fs.readFileSync('art/terrain-alignment-geography.json'));
const b={};vm.runInNewContext(fs.readFileSync('game/assets/mapdata.js','utf8')+';this.map=MAP',b);
const changed=new Set(audit.changes.map(r=>r.tile));
assert(changed.size>0);assert.equal(changed.size,audit.changes.length);
for(const r of audit.changes){assert(r.fraction>=.30);assert(r.covered/r.total===r.fraction);assert(geo.tiles[r.tile].owner>=0);assert(geo.tiles[r.tile].city<0);assert(geo.tiles[r.tile].terrain<3);assert.equal(b.map.tiles[r.tile][1],3);}
for(const t of geo.tiles){const a=b.map.tiles[t.id];if(t.owner<0&&a[0]<0)assert.equal(a[1],0);if(!changed.has(t.id)&&a[0]===t.owner)assert.equal(a[1],t.terrain,'unselected terrain changed at '+t.id);}
// Exercise both new-game alignment and upgrading a saved game at the previous schema.
const source=fs.readFileSync('game/assets/terrain-alignment.js','utf8');
const ctx={MAP:b.map,tiles:b.map.tiles.map(a=>({owner:a[0],terrain:0})),cities:[],units:[],missileBases:[],buildRegions(){},cityProfile(){},setup(){},migrateArmy(){return 'loaded';},faceInitialArmy(){},save(){},updateHUD(){},refreshSelection(){},reach:new Map(),window:{Terha:{}}};
vm.createContext(ctx);vm.runInContext(source,ctx);vm.runInContext('setup()',ctx);
for(const id of changed)assert.equal(ctx.tiles[id].terrain,3);
for(const t of ctx.tiles)t.terrain=0;
assert.equal(vm.runInContext('migrateArmy({shorelineSchema:3})',ctx),'loaded');
for(const id of changed)assert.equal(ctx.tiles[id].terrain,3);
assert(audit.seaOverlapsPreserved>0);assert(audit.minorLandOverlapsPreserved>0);
console.log('PASS mountain coverage, sea preservation, minor overlaps, new games and saved-game migration:',changed.size,'tiles');
