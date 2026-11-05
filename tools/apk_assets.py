"""Select runtime assets; retain offline art inputs in the source checkout only."""
from pathlib import Path
import re

# Original MP3s stay as build inputs; runtime players share their embedded bytes.
EMBEDDED_MUSIC = frozenset({
    'operation-music-1.mp3', 'operation-last-light.mp3',
    'operation-ghost-trail.mp3', 'operation-music-5.mp3',
    'menu-music.mp3', 'main-campaign-ruins.mp3', 'main-campaign-tomb.mp3',
})

# These are inputs/diagnostics for tools and historical QA, never runtime loads.
SOURCE_ONLY = frozenset({
    'terrain-crops.js', 'rivers.js', 'smoke-plume-data.js',
    'world-ownership-mask.png', 'coast-clean.png', 'main-campaign-intro.jpg',
    'launcher-icon.webp',  # build.py converts this to res/drawable/icon.png
    'explosion-soft.webp', 'dirt-impact.webp', 'smoke-sequence.webp',
    'smoke-loop.webp', 'smoke-column.webp',
})
LICENSES = frozenset({'FONT-LICENSE.txt', 'main-intro-font-OFL.txt'})
RUNTIME_SUFFIXES = frozenset({'.html', '.js', '.css', '.png', '.jpg', '.webp',
                              '.svg', '.mp3', '.otf', '.woff'})


def is_runtime_asset(path):
    path = Path(path)
    if path.name.startswith('.') or path.name in SOURCE_ONLY or path.name in EMBEDDED_MUSIC:
        return False
    if path.name.startswith('trial-'):
        return False
    # Old ground-baker intermediates can be recreated by development tools.
    if re.fullmatch(r'ground-(?:\d+-\d+|overview)-(?:anchors|bank|culture|water)\.png', path.name):
        return False
    return path.name in LICENSES or path.suffix in RUNTIME_SUFFIXES


def runtime_assets(directory):
    return sorted(p for p in Path(directory).iterdir()
                  if p.is_file() and is_runtime_asset(p))
