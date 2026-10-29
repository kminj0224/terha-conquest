#!/usr/bin/env python3
"""Rebuild the pre-rendered smoke atlas and alpha crop metadata (offline only)."""
from pathlib import Path
from PIL import Image
import json, subprocess
root=Path(__file__).resolve().parents[1]
subprocess.run(['node',str(root/'tools/build-smoke-plume.cjs')],cwd=root,check=True)
p=root/'game/assets/smoke-flow.png';im=Image.open(p)
im.save(p.with_suffix('.webp'),'WEBP',quality=88,method=6);p.unlink()
im=Image.open(p.with_suffix('.webp')).convert('RGBA');bounds=[]
for i in range(80):
 x=i%8*80;y=i//8*192
 alpha=im.crop((x,y,x+80,y+192)).getchannel('A').point(lambda a:255 if a>=2 else 0)
 b=alpha.getbbox();bounds.append([b[0],b[1],b[2]-b[0],b[3]-b[1]] if b else [0,0,0,0])
(root/'game/assets/smoke-flow-bounds.js').write_text('// Offline nontransparent crop rectangles; preserve full-frame anchors.\nconst SMOKE_FLOW_BOUNDS='+json.dumps(bounds,separators=(',',':'))+';\n')
print('Prepared smoke-flow.webp:',p.with_suffix('.webp').stat().st_size,'bytes')
