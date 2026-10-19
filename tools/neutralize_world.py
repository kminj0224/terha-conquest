#!/usr/bin/env python3
"""Bake neutral-color *plains* while retaining land relief and the exact ocean.

Original world-clean.png has permanent red/blue/green/brown homeland colors.
Recoloring only the mountain chunks cannot fix captured plain colors.
This offline, deterministic step removes those hues from the WORLD UNDERLAY.
The runtime owner territoryCanvas then supplies all political colors.
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1] / "game" / "assets"
source = ROOT / "world-clean.png"
target = ROOT / "world-neutral.png"
picture = Image.open(source).convert("RGB")
original = np.asarray(picture, dtype=np.uint8)
height, width = original.shape[:2]
assert (width, height) == (3360, 2520), "Unexpected world map resolution"

r, g, b = (original[:, :, n].astype(np.int16) for n in range(3))
# The water is deep blue, whereas mainland hues are green/tan/red/pale blue.
# Protect ocean, lakes and rivers from the neutral-ground operation.
water = (r < 70) & (g < 112) & (b < 145) & (b - r > 18) & (b - g > 7)
land = np.asarray(
    Image.fromarray((~water).astype(np.uint8) * 255, "L")
    .filter(ImageFilter.GaussianBlur(1.8)),
    dtype=np.float32,
) / 255.0

luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722).astype(np.float32)
# Estimate broad source-area shading at quarter size to remove former-country
# light/dark bias, without discarding the finer ridges and valleys.
small = Image.fromarray(np.uint8(np.clip(luminance, 0, 255)), "L").resize(
    (width // 4, height // 4), Image.Resampling.BILINEAR
)
soft = np.asarray(
    small.filter(ImageFilter.GaussianBlur(23)).resize(
        (width, height), Image.Resampling.BILINEAR
    ),
    dtype=np.float32,
)
relief = (luminance - soft) * 0.78 + (soft - 128) * 0.08
shade = np.clip(141 + relief, 66, 211)
neutral = np.stack((shade * 1.01, shade, shade * 0.97), axis=-1)
output = np.clip(
    original.astype(np.float32) * (1 - land[:, :, None])
    + neutral * land[:, :, None],
    0,
    255,
).astype(np.uint8)

assert 0.30 < float(np.mean(land > 0.9)) < 0.49, "Land mask cannot find the continents"
assert np.array_equal(output[0, 0], original[0, 0]), "Ocean color unexpectedly changed"
for px, py in ((1000, 1200), (1900, 870), (1600, 2100)):
    assert np.ptp(output[py, px].astype(np.int16)) < 12, "Baked original territory hue remains on plains"
# Cross-region luma: a former red/green mainland should have approximately
# the same neutral base, before the political owner overlay.
a = float(output[1200, 1000, :3].mean())
z = float(output[870, 1900, :3].mean())
assert abs(a - z) < 25, (a, z)

Image.fromarray(output, "RGB").save(target, compress_level=8, optimize=True)
print(
    f"PASS neutral world: {width}x{height}, sea unchanged, source-area bias "
    f"removed, relief retained, owner tint will be applied at runtime ({target.stat().st_size} bytes)"
)
