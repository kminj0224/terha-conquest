from pathlib import Path
import json,numpy as np,zipfile,base64,struct,shutil
from PIL import Image,ImageDraw,ImageFilter
from scipy.interpolate import splprep,splev
from scipy.ndimage import distance_transform_edt
A=Path(__file__).resolve().parents[1]/'game/assets';Q=Path(__file__).resolve().parent/'hansa';Q.mkdir(exist_ok=True)
ORIGINAL=Q/'original';ORIGINAL.mkdir(exist_ok=True)
# Keep original layers so rebuilding the patch is idempotent.
apk=Path('/workspace/scratch/9dc0b6fbb7a1/upload/Terha-Conquest-v1.10.65.apk')
if apk.exists():
 with zipfile.ZipFile(apk) as z:
  for name in z.namelist():
   filename=name.split('/')[-1]
   if name.startswith('assets/') and (filename in ['world-clean.png','coast-clean.png','coast-overlay.png'] or any(filename==stem+'-'+layer+'.png' for stem in ['ground-overview']+['ground-'+str(x)+'-'+str(y) for x in [10,11,12] for y in [3,4]] for layer in ['terrain','detail'])):
    target=ORIGINAL/filename
    if not target.exists():target.write_bytes(z.read(name))
for source in ORIGINAL.glob('*.png'):shutil.copy2(source,A/source.name)
WW=112*64+64/3;HH=84*55.43+55.43/2
ref=np.array([[713,325],[743,312],[749,359],[770,368],[836,349],[875,312],[900,258],[924,208],[956,169],[996,149],[1038,135],[1017,176],[991,221],[978,254],[980,283],[1006,317],[1047,355],[1090,392],[1124,410],[1176,410],[1135,444],[1093,426],[1044,402],[1012,397],[951,397],[900,400],[845,403],[794,398],[755,408],[713,401],[698,368]],float);ref[:,0]+=5866.666666666667-883;ref[:,1]+=2161.77-478
curve,_=splprep(ref.T,s=0,per=True);outline=np.array(splev(np.linspace(0,1,600,endpoint=False),curve)).T.tolist();gap=[5930.666666666667,2244.915,34,23]
water=[3677,3789,3900,4011,4012,4121,4123,4124,4125,4236,4238,4572]
json.dump(dict(outline=outline,southGap=gap,tiles=water),open(Q/'shape.json','w'))
def mask(size,rect=(0,0,WW,HH),fringe=0):
 w,h=size;x,y,rw,rh=rect;m=Image.new('L',(w*3,h*3));d=ImageDraw.Draw(m);sx=w*3/rw;sy=h*3/rh;d.polygon([((a-x)*sx,(b-y)*sy) for a,b in outline],fill=255);gx,gy,rx,ry=gap;d.ellipse(((gx-rx-x)*sx,(gy-ry-y)*sy,(gx+rx-x)*sx,(gy+ry-y)*sy),fill=255);m=m.resize(size,Image.Resampling.LANCZOS)
 if fringe:m=m.filter(ImageFilter.MaxFilter(2*int(fringe*w/rw)+1))
 return m
world=Image.open(A/'world-clean.png').convert('RGBA');overlay=Image.open(A/'coast-overlay.png').convert('RGBA');base=Image.alpha_composite(world,overlay.resize(world.size));arr=np.array(base);m=mask(base.size);sel=np.array(m)>128
# Nearest intact deep water supplies local blue rather than a flat pasted color.
sea=(arr[:,:,2]>arr[:,:,1]*1.25)&(arr[:,:,0]<55)&~sel
_,inds=distance_transform_edt(~sea,return_indices=True);colors=arr[inds[0],inds[1]];colors[:,:,3]=255;patch=Image.fromarray(colors)
for name in ['world-clean.png','coast-clean.png','coast-overlay.png']:
 p=A/name;im=Image.open(p).convert('RGBA');out=Image.composite(patch.resize(im.size,Image.Resampling.BILINEAR),im,mask(im.size));out.save(p)
meta=json.loads((A/'ground-data.js').read_text().split('const GROUND_DATA=',1)[1].strip().removesuffix(';'))
runs=json.loads((A/'ground-colors.js').read_text().split('const GROUND_COLOR_RUNS=',1)[1].split(';',1)[0])
for q in meta['chunks']+[dict(name='ground-overview',x=0,y=0,w=WW,h=HH)]:
 if q['x']+q['w']<5650 or q['x']>6200 or q['y']+q['h']<1780 or q['y']>2310:continue
 for layer in ['terrain','detail']:
  p=A/(q['name']+'-'+layer+'.png')
  if not p.exists():continue
  im=Image.open(p).convert('RGBA');ma=mask(im.size,(q['x'],q['y'],q['w'],q['h']),8);alpha=np.array(im.getchannel('A')).astype(float)*(1-np.array(ma)/255);
  if q['name'] in runs:
   pairs=np.frombuffer(base64.b64decode(runs[q['name']]),dtype='<u2').reshape(-1,2);ids=np.repeat(pairs[:,0],pairs[:,1]).reshape(im.height,im.width);alpha[np.isin(ids,water)]=0
  im.putalpha(Image.fromarray(alpha.astype('uint8')));im.save(p)
js="""'use strict';
const HANSA_WATER_TILES=__WATER__;
const HANSA_WATER_OUTLINE=__OUTLINE__,HANSA_SOUTH_GAP=__GAP__;
const hansaOriginalTiles=HANSA_WATER_TILES.map(i=>({i,map:MAP.tiles[i].slice(),support:CITY_GROUND_SUPPORT[i],center:CITY_GROUND_CENTER[i]}));
const hansaTerritoryRefresh=refreshTerritory;refreshTerritory=function(){const dirty=territoryDirty,result=hansaTerritoryRefresh();if(dirty&&territoryCanvas){const g=territoryCanvas.getContext('2d'),sx=territoryCanvas.width/WW,sy=territoryCanvas.height/HH;g.save();g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='destination-out';g.fillStyle='#000';g.beginPath();HANSA_WATER_OUTLINE.forEach(([x,y],i)=>i?g.lineTo(x*sx,y*sy):g.moveTo(x*sx,y*sy));g.closePath();g.fill();const [x,y,rx,ry]=HANSA_SOUTH_GAP;g.beginPath();g.ellipse(x*sx,y*sy,rx*sx,ry*sy,0,0,Math.PI*2);g.fill();g.restore()}return result};
function resetHansaGeographyCaches(){seaComponents=null;placementComponents=null;danteLandComponents=null;shoreCacheKey='';territoryDirty=true;groundViewKey='';reach.clear();invalidateActionVisuals()}
function applyHansaIsland(){for(const i of HANSA_WATER_TILES){MAP.tiles[i]=[-1,0];tiles[i].owner=-1;tiles[i].terrain=0;CITY_GROUND_SUPPORT[i]=CITY_GROUND_CENTER[i]=0}resetHansaGeographyCaches();for(const u of units){if(!HANSA_WATER_TILES.includes(u.tile)||u.carriedBy||isNaval(u)||isAircraft(u)||isHelicopter(u))continue;const to=closestShoreTile(u.tile,i=>tiles[i].owner>=0&&!unitAt(i)&&!baseAt(i)&&(!cityAt(i)||cityAt(i).f===u.f||cityAt(i).hp<=0),i=>tiles[i].owner===u.f?0:10);if(to>=0){u.tile=to;moving=moving.filter(m=>m.id!==u.id)}}for(const b of missileBases){if(!HANSA_WATER_TILES.includes(b.tile))continue;const to=closestShoreTile(b.tile,i=>tiles[i].owner===b.f&&!cityAt(i)&&!unitAt(i)&&!missileBases.some(v=>v!==b&&v.tile===i)&&(b.kind==='sam'||neighbors(i).some(j=>tiles[j].owner<0)));if(to>=0)b.tile=to}buildRegions();for(const q of cities)cityProfile(q);resetHansaGeographyCaches()}
const hansaIslandSetup=setup;setup=function(...args){for(const old of hansaOriginalTiles){MAP.tiles[old.i]=old.map.slice();CITY_GROUND_SUPPORT[old.i]=old.support;CITY_GROUND_CENTER[old.i]=old.center}resetHansaGeographyCaches();const result=hansaIslandSetup(...args);applyHansaIsland();save();updateHUD();refreshSelection();return result};
const hansaIslandMigration=migrateArmy;migrateArmy=function(...args){const result=hansaIslandMigration(...args);applyHansaIsland();return result};
Object.assign(window.Terha,{setup,migrateArmy,applyHansaIsland});
""".replace('__WATER__',json.dumps(water),1).replace('__OUTLINE__',json.dumps([[round(v,2) for v in p] for p in outline],separators=(',',':')),1).replace('__GAP__',json.dumps(gap),1)
# Replace placeholders only after variable identifiers, not inside the identifiers themselves.
js=js.replace('HANSA_'+json.dumps(water)+'_TILES','HANSA_WATER_TILES') if False else js
(A/'hansa-island.js').write_text(js)
print('Restored Hansa island artwork and sea rules')
