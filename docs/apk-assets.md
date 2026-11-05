# APK asset cleanup

The Android packager previously copied every non-hidden file directly under
`game/assets`, including unused artwork and offline generator inputs.

This cleanup deletes 323 unused files (16,894,209 bytes): 305 obsolete ground
anchor/bank/culture/water layers and 18 superseded images, map data and scripts.
None have consumers in the current game, native shell, tools or QA scripts.

Another 19 files (16,163,193 bytes) stay available for offline generation and
historical QA, but `tools/apk_assets.py` excludes them from the APK. These include
the original trial terrain sprites, terrain crop definitions, river renderer,
smoke-baking inputs, old effect samples, ownership diagnostic mask, legacy
intro sample and coast source. The launcher WebP is also excluded: `build.py`
already converts it to the actual Android drawable PNG.

Total payload removed: 33,057,402 uncompressed bytes, about 31.4 MB deflated
before ZIP entry overhead/signing. Music originals and embedded audio remain:
the runtime/native fallback paths still use them. Natural map LODs and fallback
ground terrain/detail layers also remain. Font licenses remain in the APK.

The filter rejects regenerated intermediate ground layers and unsupported
file extensions. The packager discards inherited shell web assets and signing
metadata before adding the current runtime files, so stale assets cannot
survive in a retained shell archive.

`python3 qa/check-apk-assets.py` checks whole literal references plus dynamic
ground chunks, natural map levels, flags, transports, helicopter frames and
campaign portraits. Run the existing asset preparation commands first.
`python3 build.py` runs the check, signs the APK, then verifies the exact asset
inventory, duplicate entries, ZIP integrity and every packaged byte.
The APK-assets pull request workflow runs these checks and the shared native
game regression suite without publishing a release.

## v1.12.0 WebP release bundle

GitHub Actions installs `cwebp` and Pillow; image conversion never runs in the
local agent workspace. `tools/prepare_apk_webp.py` stages the selected runtime
files under `android/build/webp/game/assets`, converts each PNG with lossless,
exact transparent RGB and retained metadata, and compares every decoded RGBA
pixel and image dimension. Only staged JS/CSS/HTML image references and PNG
extension metadata change. Original source images and their checksum tests
remain intact. No image is resized or encoded with a lossy quality setting.

The signed APK uses only the staged bundle. `qa/check-apk-assets.py --assets`
validates its static/dynamic dependencies, forbids PNG web assets, then checks
the final signed APK inventory and bytes. `res/drawable/icon.png` remains the
required native launcher image. Browser tests serve the actual staged bundle
through `TERHA_TEST_ROOT` and exercise conquest and campaign rendering.

The release workflow validates the branch and uploads the signed artifact with
the exact source commit and SHA-256 sums. After that same commit reaches main,
the main job downloads that successful artifact, checks its checksum and source
commit, verifies the update certificate again, and publishes v1.12.0.
