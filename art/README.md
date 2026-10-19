# Natural map artwork, v1.11.5

Built-in image generation edited the original `coast-overlay.png`, using the user's supplied snowy coastline screenshot as a style reference. A second image edit used a guide rendered from the unchanged `RIVER_NETWORK` to integrate rivers and complete vegetation beside banks. The source and finished surface are retained separately; the offline preparation script copies the integrated artwork and records the original geography hashes. It does not cut vegetation against pixel masks.

The prompt asks for the same continent/island/lake layout, detailed blue ocean and turquoise shallows, irregular broken coastal foam, natural ground texture, varied complete forest clusters, and smooth embedded rivers following the existing guide, with no flags, labels, grids or UI. Climate follows the original map: snowy western peninsula/northwestern island, central rocky uplands, green eastern mainland, sandy southwestern island and temperate southern island.

The artwork is a visual repaint; movement, terrain rules, river bonuses, city coordinates and ownership use the original map data. The normal rendering path composites this complete image plus the live territory layer and roads, cached per view and ownership generation. Legacy chunks remain available as a decode-failure fallback. No runtime image pixel reads are used.

Validation: `npm test`, `node qa/natural-map-view.cjs`, `python3 qa/verify-native.py`, and the signed APK packaging/signature workflow. Canvas screenshots are not a physical Android-device test. Source raster resolution is 1448 × 1086; very high zoom magnifies the painted texture.
