# Motorized infantry artwork, v1.11.32

Type 11 keeps its existing statistics and save ID. Idle/movement uses an APC; the firing window uses the nation's existing rifle squad with eight shots at 70 ms and the heavy machine gun sound profile. The shared foreground nameplate remains responsible for labels.

| Nation | Vehicle asset | Source |
|---|---|---|
| Baekyang | `game/assets/baek-motorized-left.png`, `game/assets/baek-motorized-right.png` | User uploads `1000067525.png`, `1000067530.png`, unchanged |
| Dante | `game/assets/dante-motorized.png` | `game/assets/dante-tank-light.png` |
| Stetopia | `game/assets/stetopia-motorized.png` | `game/assets/stetopia-tank-light.png` |
| Ranna | `game/assets/ranna-motorized.png` | `game/assets/ranna-light.png` |
| Nakwol | `game/assets/nakwol-motorized.png` | `game/assets/nakwol-light.png` |
| Ayria | Cached desert-colored Dante motorized asset | Existing `ayriaDesertArt` filter |
| Sielun | Stetopia motorized asset | Existing national sharing convention |

The four turret-removal edits use the built-in image generation/editing tool, one call per nation, with `transparent_background: true`. Baekyang uploads are copied without image generation. Renderer crop bounds were measured offline; no runtime pixel reads are added.

## Exact prompt template

The `{nation}` substitutions were `dante`, `stetopia`, `ranna`, and `nakwol` respectively. Each call referenced only that nation's original light-tank PNG.

Use case: precise-object-edit. Edit target: the attached existing {nation} light tank game sprite. Remove ONLY the entire turret assembly, main cannon barrel and turret-mounted guns/antennas. Convert it into a turretless armored personnel carrier by filling the exposed turret ring with a low flat armored roof and a simple flush closed hatch. Preserve the exact lower hull, every wheel, armor panel design, color palette, markings on the lower hull, lighting, original illustration rendering style, original camera angle and original facing direction. Do not redesign the vehicle. Do not add a new turret, a new weapon, people, text or background. Keep the entire vehicle fully visible uncropped with padding; genuine transparent alpha background, no glow, no ground shadow, no checkerboard. Single vehicle, same side profile and facing as input. This is an in-game idle/movement sprite.

## Validation

`qa/motorized-art-regression.cjs`, included by `qa/native-test.cjs`, checks all seven nations in both facings, national rifle assets, eight-round burst profiles, stopped/moving/scheduled/firing/restored poses, expired firing cleanup, machinegun sounds at 70 ms intervals, and unchanged ordinary rifle audio. Local native Canvas checks also decoded the supplied/generated vehicles and six nations' actual rifle PNG/WebP pairs and rendered a three-state contact sheet. Full native regression, native shell verification, signed APK packaging and original update-certificate verification run in `.github/workflows/build-v11132-motorized.yml`.
