#!/usr/bin/env python3
"""Bake a detailed painted-strategy-map landscape, not a hex coastline filter.

The map geometry is VISUAL ONLY. Unit movement, tile selection, ownership,
rivers, cities and battles keep their original MAP tiles. A common shoreline
signed-distance field controls sea depth, sand, foam and political color clipping.
The grayscale texture layer is composited with 'soft-light' AFTER owner tint,
so capturing land changes its color but cannot flatten its landform texture.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, distance_transform_edt, binary_closing, binary_opening

A = Path(__file__).resolve().parents[1] / "game" / "assets"
raw = np.asarray(Image.open(A / "world-clean.png").convert("RGB"), np.uint8)
height, width = raw.shape[:2]
assert (width, height) == (3360, 2520)
world = json.loads((A / "mapdata.js").read_text().split("=",1)[1].strip().rstrip(";"))
assert world["w"] == 112 and world["h"] == 84 and len(world["tiles"]) == 9408
r,g,b = (raw[:,:,k].astype(np.int16) for k in range(3))
water = (r < 70) & (g < 112) & (b < 145) & (b-r > 18) & (b-g > 7)
water = binary_closing(water,iterations=2,border_value=1)
water = binary_opening(water,iterations=1)
land = ~water
signed = distance_transform_edt(land).astype(np.float32)
signed -= distance_transform_edt(water).astype(np.float32)
# Smooth entire coast on the scale of a visual hex. No high-frequency jitter
# allowed: the previous broad, bright random scribble was the visible defect.
signed = gaussian_filter(signed, sigma=17.0)

rng = np.random.default_rng(9919)
def noise(step):
    count_y, count_x = height//step + 3, width//step + 3
    buf = rng.integers(0,256,(count_y,count_x),dtype=np.uint8)
    return (np.asarray(Image.fromarray(buf,"L").resize(
      (width,height),Image.Resampling.BICUBIC),dtype=np.float32)-127.5)/74.0

continental=noise(310)
hills=noise(110)
regional=noise(61)
fine=noise(19)
grain=noise(5)
# Broad coves only; the rough 'noise(19)*6' coastline of v1.10.98 is removed.
shore = signed - 1.2 + continental * 1.9 + hills * 1.3
inside = np.clip((shore+1.15)/2.3,0,1)
inside=inside*inside*(3-2*inside)
ocean_distance=np.maximum(-shore,0)
land_distance=np.maximum(shore,0)

def biome_mask(owners,terrain=None):
    img=Image.new("L",(width,height),0)
    draw=ImageDraw.Draw(img)
    scale_x=width/(world["w"]*64+64/3)
    scale_y=height/(world["h"]*55.43+55.43/2)
    for i,(owner,kind) in enumerate(world["tiles"]):
        if owner<0 or (owner not in owners if owners is not None else False) or (terrain is not None and kind not in terrain):
            continue
        x=i%112; y=i//112
        cx=(x+2/3)*64*scale_x
        cy=(y+.5+.5*(x&1))*55.43*scale_y
        rx=(64*2/3)*(36.5/35)*scale_x
        ry=55.43/2*(36.5/35)*scale_y
        points=[(cx+rx,cy),(cx+rx/2,cy+ry),(cx-rx/2,cy+ry),
                (cx-rx,cy),(cx-rx/2,cy-ry),(cx+rx/2,cy-ry)]
        draw.polygon(points,fill=255)
    # Prevent new climate hex edges in the painted background.
    return gaussian_filter(np.asarray(img,dtype=np.float32)/255, sigma=23)

snow=np.clip(biome_mask({2,6})*.95,0,1)
desert=np.clip(biome_mask({3})*.85,0,1)
forests=np.clip(biome_mask(None,{3})*.76,0,1)
rocks=np.clip(biome_mask(None,{2})*.75,0,1)
terrain_undulations=(continental*4.0+hills*5.8+regional*3.0+fine*1.45+grain*.75)
# Topographic bump lighting: ridges have a shadow side and a lit side.
elevation=gaussian_filter(hills*.6+regional*.34+continental*.65,sigma=2)
gy,gx=np.gradient(elevation)
shaded=np.clip((-gx*.70-gy*.48)*90,-12,12)
micro=np.clip(terrain_undulations+shaded,-22,22)
# Faint darker woodlands / stony slopes also beneath existing tree/rock art.
grass=np.stack((np.full_like(snow,151),np.full_like(snow,156),
                np.full_like(snow,139)),axis=-1)
grass-=forests[:,:,None]*np.array([11,10,8],dtype=np.float32)
grass+=rocks[:,:,None]*np.array([7,5,4],dtype=np.float32)
# Frozen regions keep icy blue relief; deserts stay dry, not nation-colored.
grass=grass*(1-snow[:,:,None])+np.array([182,197,205],dtype=np.float32)*snow[:,:,None]
grass=grass*(1-desert[:,:,None])+np.array([178,162,136],dtype=np.float32)*desert[:,:,None]
grass+=micro[:,:,None]*np.array([1.0,1.0,.94],dtype=np.float32)
# A few fine lithographic ridge strokes break up featureless uniform plains.
ridges=np.sin((np.indices((height,width),dtype=np.float32)[1]
               +np.indices((height,width),dtype=np.float32)[0]*.46)*.21
               +regional*2.2)*(1.05+rocks*1.25)
grass+=ridges[:,:,None]*np.array([1,.97,.88],dtype=np.float32)
# Beach is 2-4 pixels, not the broad beige 'highlighter pen' v1.10.98 made.
beach=np.exp(-(land_distance/3.1)**2)*inside
wet=np.exp(-((land_distance-3)/5)**2)*inside
sand=np.array([178,181,160],dtype=np.float32)*(1-snow[:,:,None]) + np.array([204,213,216],dtype=np.float32)*snow[:,:,None]
grass=grass*(1-.34*beach[:,:,None])+sand*(.34*beach[:,:,None])
grass-=wet[:,:,None]*np.array([3.5,3.0,2.4],dtype=np.float32)
# Deep water has scale-dependent color movement, subdued turquoise shallows,
# and non-repeating micro-ripples without a beach-colored ocean polygon.
depthshade=np.clip(continental*2.6+hills*2.0+regional*1.0+fine*.45,-9,9)
sea=np.stack([30+depthshade*.73,71+depthshade,96+depthshade*.90],axis=-1)
shallows=np.exp(-ocean_distance/17)*.56
sea=sea*(1-shallows[:,:,None])+np.array([62,116,129],dtype=np.float32)*shallows[:,:,None]
# Fine directional water light, never strong enough to look like drawn lines.
sea+=fine[:,:,None]*np.array([.65,.72,.75],dtype=np.float32)
composite=np.clip(sea*(1-inside[:,:,None])+grass*inside[:,:,None],0,255).astype(np.uint8)
Image.fromarray(composite,"RGB").save(A/"world-natural-coast.png", optimize=True)

# Physical land alpha must match exactly the visual coast for owner colors.
alpha=np.uint8(np.clip(inside*255,0,255))
mask=np.empty((height,width,4),dtype=np.uint8)
mask[:,:,:3]=255;mask[:,:,3]=alpha
Image.fromarray(mask,"RGBA").save(A/"coast-land-mask.png",optimize=True)

# Toned relief is applied AFTER nation colors using Canvas soft-light. Terrain
# brightness and the coarse geological structure remain visible after capture.
surface=np.empty((height,width,4),dtype=np.uint8)
shade=np.clip(131+(regional*11+hills*10+fine*5+grain*2+shaded*1.0),58,203)
surface[:,:,0]=surface[:,:,1]=surface[:,:,2]=shade.astype(np.uint8)
surface[:,:,3]=np.uint8(np.clip(inside*.66*255,0,255))
Image.fromarray(surface,"RGBA").save(A/"world-surface-detail.png",optimize=True)

# Intermittent translucent whitewash at the waterline, 1-2 pixels wide.
# No opaque/light-yellow halos, spiky brush marks, or wide cosine strip.
crest=np.exp(-((shore+.85)/1.15)**2)
breakup=np.clip(.60+.16*regional+.10*fine,.13,.86)
whitewash=np.uint8(np.clip(crest*breakup*inside.clip(0,.45)*160,0,42))
coast=np.empty((height,width,4),dtype=np.uint8)
coast[:,:,0]=195;coast[:,:,1]=211;coast[:,:,2]=206
coast[:,:,3]=whitewash
Image.fromarray(coast,"RGBA").save(A/"coast-natural-overlay.png",optimize=True)

change=int(np.count_nonzero((inside>=.5)!=land))
fraction=float(np.mean(inside>.95))
assert .28 < fraction < .51, ("land area",fraction)
assert 5000 < change < width*height*.08, ("shore shift",change)
assert int(np.max(coast[:,:,3])) <=42, "Avoid opaque artificial foam"
assert int(np.count_nonzero(surface[:,:,3]>120)) >2_000_000
assert int(np.count_nonzero(alpha==0)) >3_000_000
assert int(np.count_nonzero(alpha==255)) >2_000_000
assert np.mean(np.abs(micro[inside>.99]))>2.1, "Land cannot be flat"
assert np.mean(np.abs(depthshade[inside<.01]))>1.2, "Sea cannot be flat"
for name in ["world-natural-coast.png","coast-land-mask.png",
             "coast-natural-overlay.png","world-surface-detail.png"]:
    with Image.open(A/name) as check:assert check.size==(width,height)
print(f"PASS painted landscape: {change:,} shoreline pixels moved, "
      f"{fraction:.1%} land, biomes/relief/water shading and narrow foam validated, no logical hex map modified")
