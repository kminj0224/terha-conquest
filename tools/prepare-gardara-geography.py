"""Trace the supplied screenshot into the authoritative world grid (not a painted overlay)."""
import json,math
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'game/assets/mapdata.js';m=json.loads(p.read_text().strip().removeprefix('const MAP=').rstrip(';'))
S,V,W,H=64,55.43,112,84
# Coast registration against the existing world land mask; measured from supplied screenshot.
z=.23;ox=4941.217391304347;oy=1265.2747826086952
main=[(633,532),(653,504),(678,484),(690,468),(696,455),(726,439),(749,449),(772,458),(789,461),(807,449),(831,426),(848,417),(858,433),(868,452),(858,474),(846,491),(844,527),(819,534),(803,551),(774,543),(744,531),(723,542),(703,557),(686,564),(666,563),(656,548)]
west=[(600,614),(609,606),(625,605),(640,614),(652,619),(642,631),(628,637),(610,632),(601,624)]
east=[(698,603),(707,595),(725,589),(743,592),(750,598),(752,609),(735,612),(716,614),(700,611)]
polys=[[(ox+x/z,oy+y/z)for x,y in ps]for ps in [main,west,east]]
def inside(x,y,poly):
 result=False
 for i,(a,b)in enumerate(poly):
  c,d=poly[i-1]
  if (b>y)!=(d>y) and x<(c-a)*(y-b)/(d-b)+a:result=not result
 return result
# Reconstruct the existing ocean ring ordering exactly, but no unnecessary southern rows.
tiles=[{'id':i,'col':i%W,'row':i//W,'owner':a[0],'terrain':a[1]}for i,a in enumerate(m['tiles'][:W*H])]
for y in range(-12,H+12):
 for x in range(-16,W+16):
  if 0<=x<W and 0<=y<H:continue
  tiles.append(dict(id=len(tiles),col=x,row=y,owner=-1,terrain=0))
land=[]
for t in tiles:
 x=(t['col']+2/3)*S;y=(t['row']+.5+.5*(t['col']&1))*V
 ux=x+9216 if x<2000 else x
 t.update(x=ux,y=y,city=-1,mapCol=t['col'],col=t['col']+144 if x<2000 else t['col'])
 if any(inside(ux,y,poly)for poly in polys):
  # A connected upland spine with lower foothills and broad tropical forest belts.
  ridge=abs(y-(3540-(ux-8030)*.48))
  terrain=3 if ridge<48 and 7890<ux<8500 else 2 if ((t['col']*17+t['row']*23)%11<6 or ridge<110) else 1
  if y>3750:terrain=2 if t['id']%3 else 1
  t.update(owner=7,terrain=terrain);land.append(t)
# Seven mainland settlements and one on each southern island; avoid mountains.
seeds=[(750,495),(683,525),(716,474),(782,510),(831,469),(806,534),(850,445),(625,621),(726,602)]
names=['부루다라','카르다나','말루다라','사란다','누라하','바루칸','다르마라','쿠란다','라하누'];cities=[]
for n,(sx,sy)in enumerate(seeds):
 x,y=ox+sx/z,oy+sy/z
 pool=[t for t in land if t['city']<0 and all(math.hypot(t['x']-q['x'],t['y']-q['y'])>110 for q in cities)]
 t=min(pool,key=lambda t:(t['x']-x)**2+(t['y']-y)**2)
 t['city']=181+n;t['terrain']=1
 cities.append(dict(id=181+n,tile=t['id'],origin=7,name=names[n],level=5 if n==0 else 4 if n==4 else 2,capital=n==0,x=t['x'],y=t['y'],cy=t['y']-20,rx=62 if n==0 else 48,ry=46 if n==0 else 34))
# True river reaches: sampled curves, game tile nodes, bank/water materials shared with all nations.
reaches=[]
for rid,control in enumerate([[(8170,3390),(8110,3430),(8070,3500),(7970,3550),(7890,3590)],[(8200,3400),(8290,3430),(8390,3450),(8490,3470),(8570,3500)],[(8160,3380),(8150,3320),(8170,3260),(8220,3200)]]):
 samples=[]
 for j in range(len(control)-1):
  p0=control[max(0,j-1)];p1=control[j];p2=control[j+1];p3=control[min(len(control)-1,j+2)]
  for k in range(20):
   u=k/20
   def f(a):return .5*((2*p1[a])+(-p0[a]+p2[a])*u+(2*p0[a]-5*p1[a]+4*p2[a]-p3[a])*u*u+(-p0[a]+3*p1[a]-3*p2[a]+p3[a])*u*u*u)
   x,y=f(0),f(1);samples.append(dict(x=x,y=y,width=3.2+3*(j+u)/(len(control)-1)))
 samples.append(dict(x=control[-1][0],y=control[-1][1],width=6.2))
 nodes=[]
 for k,v in enumerate(samples):
  a=samples[max(0,k-1)];b=samples[min(len(samples)-1,k+1)];dx,dy=b['x']-a['x'],b['y']-a['y'];d=math.hypot(dx,dy)or 1;v.update(nx=-dy/d,ny=dx/d)
  near=min(land,key=lambda t:(t['x']-v['x'])**2+(t['y']-v['y'])**2)
  if near['id']not in nodes:nodes.append(near['id'])
 reaches.append(dict(id=100+rid,main=True,source=True,mouth=True,samples=samples,nodes=nodes,points=control,widths=[3.2,4,5,6.2]))
m['extraTiles']=[dict(x=t['mapCol'],y=t['row'],owner=7,terrain=t['terrain'])for t in land]
m['countryCities']={'7':[{k:q[k]for k in ['tile','name','level','capital']}for q in cities]}
m['geographySchema']=2
p.write_text('const MAP='+json.dumps(m,separators=(',',':'))+';\n')
geo={'width':1750,'height':1500,'left':7400,'top':2850,'biomes':{'7':'tropical'},'grid':{'cols':144,'rows':108},'tiles':tiles,'reaches':reaches}
(root/'art/gardara-geography.json').write_text(json.dumps(geo,separators=(',',':')))
(root/'art/gardara-city-footprints.json').write_text(json.dumps({'cities':cities},separators=(',',':')))
(root/'art/gardara-map-registration.json').write_text(json.dumps({'reference':'1000068017.jpg','scale':z,'origin':[ox,oy],'outline':polys,'tiles':len(land),'cities':cities,'bounds':[7400,2850,1750,1500]},indent=2))
print('Gardara official land tiles:',len(land),'cities:',[(q['name'],q['tile'])for q in cities])
