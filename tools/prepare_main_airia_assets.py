#!/usr/bin/env python3
"""Fetch immutable original PNGs from the isolated asset commit; never re-encode."""
from pathlib import Path
from hashlib import sha256
from urllib.request import urlopen
ROOT=Path(__file__).resolve().parents[1]
COMMIT='9645f5be6094455cbcdd0268ebc9b29901887e47'
ASSETS={'main-airia-nagorn.png': '6d47e0ddf8f6f8367059455dc9bdafe418fbdeb595c2fd6302d3b4f86619327a', 'main-airia-adjutant.png': '566390b1c34d3276d5d45969e977d329666db94a399f34e0df4eaba374d9fe25', 'main-airia-scout.png': '94951a160329ccecde5fcf862c93f69d52315c17e6866926ce53d4995af4d009'}
def prepare():
    for name,digest in ASSETS.items():
        target=ROOT/'game/assets'/name
        if target.exists() and sha256(target.read_bytes()).hexdigest()==digest:
            continue
        url=f'https://raw.githubusercontent.com/kminj0224/terha-conquest/{COMMIT}/{name}'
        with urlopen(url,timeout=90) as response:
            data=response.read()
        if sha256(data).hexdigest()!=digest:
            raise ValueError('Original portrait checksum mismatch: '+name)
        target.write_bytes(data)
    print('PASS three original Airia portrait PNGs, unchanged bytes')
if __name__=='__main__':prepare()
