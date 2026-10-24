'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const assets=path.resolve(__dirname,'../game/assets');
const source=fs.readFileSync(path.join(assets,'rifle-art.js'),'utf8');
const expected=['rifle-idle','rifle-fire','grenadier-idle','grenadier-fire','machinegun','antitank'];
for(const suffix of expected){
  const name='ayria-'+suffix+'.webp';
  const file=fs.readFileSync(path.join(assets,name));
  assert(file.length>1500,name+' truncated');
  assert.equal(file.toString('ascii',0,4),'RIFF',name+' container');
  assert.equal(file.toString('ascii',8,12),'WEBP',name+' format');
  assert(source.includes(name),name+' not loaded by renderer');
}
assert(source.includes('u.f===3?AYRIA_INFANTRY_PROFILES[u.type]'),'Ayria must use dedicated art');
for(const type of [0,8,9,10])assert(source.includes(type+':{art:ayria'),'Ayria profile missing for '+type);
assert(source.includes('baseFacing:1'),'Ayria artwork faces right');
assert(source.includes("projectile:'baekGrenade'")&&source.includes("projectile:'baekRocket'"),'grenadier and anti-tank projectiles missing');
console.log('PASS: Ayria four infantry unit profiles, six transparent WebP sprites, existing renderer integration');
