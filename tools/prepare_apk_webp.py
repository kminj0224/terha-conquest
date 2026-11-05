"""Stage the release web bundle with exact, lossless WebP instead of PNG.

Original art stays in the source tree for editing and historical checksum QA.
Encoding and all pixel verification run on the GitHub Actions runner.
"""
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from tools.apk_assets import runtime_assets
TARGET = ROOT / 'android/build/webp/game/assets'


def prepare():
    if os.environ.get('GITHUB_ACTIONS') != 'true':
        raise RuntimeError('Release image conversion must run on GitHub Actions.')
    sources = runtime_assets(ROOT / 'game/assets')
    if TARGET.exists():
        shutil.rmtree(TARGET)
    TARGET.mkdir(parents=True)

    def stage(source):
        target = TARGET / source.name
        if source.suffix == '.png':
            target = target.with_suffix('.webp')
            assert not (source.parent / target.name).exists(), 'WebP name collision: ' + target.name
            subprocess.run(['cwebp', '-quiet', '-lossless', '-exact', '-metadata', 'all', '-m', '4',
                            '-mt', str(source), '-o', str(target)], check=True)
            with Image.open(source) as original, Image.open(target) as encoded:
                a, b = original.convert('RGBA'), encoded.convert('RGBA')
                assert a.size == b.size and a.tobytes() == b.tobytes(), source.name
                pixel_hash = sha256(a.tobytes()).hexdigest()
                dimensions = list(a.size)
            return dict(source=source.name, target=target.name,
                        sourceBytes=source.stat().st_size, webpBytes=target.stat().st_size,
                        sourceSHA256=sha256(source.read_bytes()).hexdigest(),
                        webpSHA256=sha256(target.read_bytes()).hexdigest(),
                        rgbaSHA256=pixel_hash, dimensions=dimensions)
        if source.suffix in {'.js', '.css', '.html'}:
            text = source.read_text().replace('.png', '.webp')
            text = re.sub(r'("extension"\s*:\s*)"png"', r'\1"webp"', text)
            target.write_text(text)
        else:
            shutil.copyfile(source, target)
        return None

    with ThreadPoolExecutor(max_workers=2) as workers:
        records = [r for r in workers.map(stage, sources) if r]
    assert records and not list(TARGET.glob('*.png'))
    report = dict(mode='lossless-exact', pixelComparison='all RGBA pixels identical',
                  count=len(records), originalBytes=sum(r['sourceBytes'] for r in records),
                  webpBytes=sum(r['webpBytes'] for r in records), files=records)
    (ROOT / 'deliverables').mkdir(exist_ok=True)
    (ROOT / 'deliverables/webp-conversion-report.json').write_text(json.dumps(report, indent=2)+'\n')
    print(f"PASS {len(records)} PNGs -> lossless WebP; every RGBA pixel identical; "
          f"{report['originalBytes']} -> {report['webpBytes']} bytes", flush=True)
    return TARGET


if __name__ == '__main__':
    prepare()
