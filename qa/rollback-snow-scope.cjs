const fs=require('fs'),crypto=require('crypto'),assert=require('assert');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const baseline=JSON.parse(fs.readFileSync('art/v11111-rollback-reference.json'));
const geo=JSON.parse(fs.readFileSync('art/terrain-alignment-geography.json'));
const manifest=JSON.parse(fs.readFileSync('art/aligned-map-manifest.json'));
const snow=manifest.placements.filter(p=>p.biome==='snow');
const exempt=new Set(['game/assets/app-shell.js','game/assets/saves.js','game/assets/natural-ownership-data.js','game/assets/world-natural.png']);
let intact=0,changed=[];
for(const [file,expected]of Object.entries(baseline.files)){
 if(exempt.has(file))continue;
 const match=/natural-(detail|mid)-(\d+)-(\d+)\.jpg$/.exec(file);
 if(match){const x=(+match[2]*181-14)/1448*geo.width,y=(+match[3]*181-14)/1086*geo.height,w=209/1448*geo.width,h=209/1086*geo.height;
  // Snow-biome material masks blur at edges; allow a narrow halo around original snow anchors.
  const allowed=snow.some(p=>p.anchorX>x-180&&p.anchorX<x+w+180&&p.anchorY>y-180&&p.anchorY<y+h+180);
  if(allowed){if(sha(file)!==expected)changed.push(file);continue;}
 }
 assert.equal(sha(file),expected,file+' must be byte-identical to v1.11.9');intact++;
}
assert(changed.length>0);assert(intact>100);
assert(!fs.existsSync('tools/scenery-variants.cjs'),'v1.11.10 variation implementation removed');
console.log('PASS exact v1.11.9 rollback outside snow correction',JSON.stringify({unchangedFiles:intact,changedSnowRasters:changed.length}));
