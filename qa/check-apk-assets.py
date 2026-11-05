#!/usr/bin/env python3
"""Check static/dynamic runtime dependencies and the exact signed APK inventory."""
import json
from pathlib import Path
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from tools.apk_assets import runtime_assets

ASSETS = ROOT / 'game/assets'


def check(apk=None):
    selected = runtime_assets(ASSETS)
    names = {p.name for p in selected}
    expected = {'index.html', 'FONT-LICENSE.txt', 'main-intro-font-OFL.txt'}
    # Whole literal filenames, not fragments such as '-v3.webp' in dynamic URLs.
    literal = re.compile(r'''["'(]([A-Za-z0-9][\w.-]*\.(?:html|js|css|png|jpg|webp|svg|mp3|otf|woff))["')]''')
    for p in selected:
        if p.suffix in {'.html', '.js', '.css'}:
            expected.update(literal.findall(p.read_text()))

    # Exercise the naming contracts used by the runtime, not filename grep alone.
    def metadata(name, constant):
        text = (ASSETS / name).read_text()
        return json.JSONDecoder().raw_decode(text.split('const '+constant+'=', 1)[1])[0]

    ground = metadata('ground-data.js', 'GROUND_DATA')
    for stem in ['ground-overview'] + [q['name'] for q in ground['chunks']]:
        expected.update(stem + layer for layer in ('-terrain.png', '-detail.png'))
    detail = metadata('natural-detail-data.js', 'NATURAL_DETAIL')
    extension = metadata('map-page-ext0-data.js', 'data')
    for q in detail['regions'] + extension['details']:
        expected.add(q['name'] + '.' + q.get('extension', 'jpg'))
        expected.add(q['name'].replace('natural-detail', 'natural-mid') + '.' + q.get('extension', 'jpg'))
    expected.update(f'flag-{f}.' + ('svg' if f in (3, 6) else 'png') for f in range(7))
    expected.update(f'transport-ship-{f}.png' for f in range(1, 7))
    expected.update(f'baek-attack-heli-{f}.webp' for f in range(1, 5))
    expected.update(f'campaign-{person}-v3.webp' for person in ('edric', 'rozena', 'kessel'))
    missing = expected - names
    assert not missing, 'Missing/excluded runtime dependencies: ' + ', '.join(sorted(missing))
    if apk:
        with zipfile.ZipFile(apk) as z:
            entries = z.namelist()
            assert len(entries) == len(set(entries)), 'Duplicate APK entries'
            actual = {n[7:] for n in entries if n.startswith('assets/')}
            assert actual == names, f'APK asset mismatch: extra={actual-names}, missing={names-actual}'
            assert z.testzip() is None, 'Corrupt APK archive'
            for p in selected:
                assert z.read('assets/' + p.name) == p.read_bytes(), p.name
    print(f'PASS {len(names)} packaged assets; {len(expected)} static/dynamic dependencies' +
          ('; exact APK inventory and bytes' if apk else ''))


if __name__ == '__main__':
    check(sys.argv[1] if len(sys.argv) > 1 else None)
