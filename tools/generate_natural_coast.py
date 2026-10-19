#!/usr/bin/env python3
"""Create organic visual shorelines independently from unmodified strategic hexes.

Water, land geometry and coast colors are derived from the source PNG (no game
movement/ownership/region tile is changed). A soft signed-distance coastline and
seeded multi-scale jitter replace straight hex sides; owner tint is later clipped
to the exact same coastline mask. All work is performed once before APK packing.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt, binary_closing, binary_opening

ROOT = Path(__file__).resolve().parents[1] / "game" / "assets"
source = np.asarray(Image.open(ROOT / "world-clean.png").convert("RGB"), dtype=np.uint8)
neutral = np.asarray(Image.open(ROOT / "world-neutral.png").convert("RGB"), dtype=np.uint8)
height, width = source.shape[:2]
assert (width, height) == (3360, 2520) and neutral.shape == source.shape

r = source[:, :, 0].astype(np.int16)
g = source[:, :, 1].astype(np.int16)
b = source[:, :, 2].astype(np.int16)
water = (r < 70) & (g < 112) & (b < 145) & ((b - r) > 18) & ((b - g) > 7)
# Drop one-pixel texture speckles without changing connected seas and lakes.
water = binary_closing(water, iterations=2, border_value=1)
water = binary_opening(water, iterations=1)
land = ~water

signed = distance_transform_edt(land).astype(np.float32)
signed -= distance_transform_edt(water).astype(np.float32)
# Hex side lengths are ~30 original-PNG pixels; a 9px smoothing radius
# rounds hex points without erasing narrow inlets or islands.
signed = gaussian_filter(signed, sigma=9.0, mode="nearest")

rng = np.random.default_rng(1098)
def organic_noise(step):
    noise = rng.standard_normal((height // step + 3, width // step + 3)).astype(np.float32)
    # Smooth interpolated noise adds coves/bays to otherwise straight hex edges.
    small = Image.fromarray(noise, mode="F")
    return np.asarray(small.resize((width, height), Image.Resampling.BICUBIC), dtype=np.float32)

# A slight shoreward offset prevents neutral land strips outside the territory.
shore = signed - 2.2 + organic_noise(43) * 6.0 + organic_noise(19) * 1.5
coverage = np.clip((shore + 1.8) / 3.6, 0, 1)
coverage = coverage * coverage * (3 - 2 * coverage)
mix = coverage[:, :, None]
output = source.astype(np.float32)
# Gently brighten water at the shoreline: not a cartoon thick outline.
shallows = np.exp(-((shore + 7.0) / 13.0) ** 2) * (shore < 0) * (shore > -30) * 0.23
sea = output * (1.0 - shallows[:, :, None]) + np.array([79, 139, 142], dtype=np.float32) * shallows[:, :, None]
# Preserve subtle sandy/earth coast lighting beneath the political color.
beach = np.exp(-((shore - 2.0) / 6.0) ** 2) * (shore > 0) * 0.11
ground = neutral.astype(np.float32) * (1.0 - beach[:, :, None]) + np.array([178, 169, 143], dtype=np.float32) * beach[:, :, None]
output = np.clip(sea * (1.0 - mix) + ground * mix, 0, 255).astype(np.uint8)

Image.fromarray(output, "RGB").save(ROOT / "world-natural-coast.png", optimize=True)
alpha = np.uint8(np.round(coverage * 255))
# Important: Canvas destination-in uses ALPHA, not RGB/luma.
mask = np.empty((height, width, 4), dtype=np.uint8)
mask[:, :, :3] = 255
mask[:, :, 3] = alpha
Image.fromarray(mask, "RGBA").save(ROOT / "coast-land-mask.png", optimize=True)

foam = np.exp(-((shore + 1.0) / 2.6) ** 2) * 0.17
foam *= 0.78 + 0.22 * np.sin(shore * 2.3 + organic_noise(23))
decoration = np.empty((height, width, 4), dtype=np.uint8)
decoration[:, :, 0] = 188
decoration[:, :, 1] = 207
decoration[:, :, 2] = 192
decoration[:, :, 3] = np.uint8(np.clip(foam * 255, 0, 255))
Image.fromarray(decoration, "RGBA").save(ROOT / "coast-natural-overlay.png", optimize=True)

far_sea = water & (shore < -32)
far_land = land & (signed > 35)
assert 0.30 < float(np.mean(coverage > .95)) < 0.50, "Coastline mask appears corrupt"
assert far_sea.sum() > 1_000_000 and far_land.sum() > 1_000_000
assert np.array_equal(output[far_sea], source[far_sea]), "Far ocean changed"
assert np.array_equal(output[far_land], neutral[far_land]), "Interior terrain changed"
shift = int(np.count_nonzero((coverage >= .5) != land))
assert 2000 < shift < int(width * height * .035), f"Shoreline modification too weak/strong: {shift}"
assert np.count_nonzero(alpha == 0) > 3_000_000 and np.count_nonzero(alpha == 255) > 2_000_000
print(f"PASS organic visual shoreline: mask/source alignment, water and interior intact, {shift} pixels shifted; strategic tile data unchanged")
