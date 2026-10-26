# Terha Conquest

Private development repository. Current baseline: **v1.11.41**, Android versionCode **186**.

## Cloud setup

Use Python 3 and Java 17. All game artwork, audio, fonts, the Android shell, signing files and Java build dependencies are included.

- Build the update APK: `python3 build.py`
- Output: `deliverables/Terha-Conquest-v1.11.41.apk`
- Install QA dependency: `npm install`
- Game regression checks: `npm test`
- Android shell checks: `python3 qa/verify-native.py`
- WAV sound effect exports are included in `audio/wav/`; regenerate them with `python3 tools/export_wav.py`.

Continue from this repository and commit completed changes to preserve them for the next task. Do not use APKs as the editable source. See [README-ko.md](README-ko.md) for the Korean release notes and validation limits.

## Android lifecycle source

`android/native-src` holds the Activity and confirmed-exit bridge. After native edits, run `python3 tools/build_native_shell.py`, then the standard APK build. The helper fetches pinned Android compile APIs and dx and checks SHA-256. Compile-only API stubs stay outside the DEX. Home/app switching preserves the running WebView; Activity recreation reattaches the same live WebView. The v1.10.70 automatic save-recovery path has been removed.


## v1.11.20 ocean world

All city tiers retain their relative sizes and grow by 15%. New campaigns retain one Baek carrier and one frigate north of the Baek–Dante front; southern and other fleets are unchanged. The original geography and tile IDs remain intact, surrounded by 6,144 new ocean tiles. East and west connect for continuous scrolling, naval routes, aiming and spatial audio. The new sea reuses and feathers the existing painted water. Legacy campaigns load with the added ocean; loading does not alter their fleets.

`node qa/ocean-world-regression.cjs` checks every tile across five world copies, reciprocal neighbors, seam movement, city tier sizes, legacy/expanded saves, and rendered world periodicity. PNG views are written only to ignored `previews/`.


## v1.11.41 · Sapros and homeland production

- Ayria special Sapros appends type 28: food 967, HP 989, attack 97, range 2 at tier one; tank traits and zero production/movement/attack oil. Living friendly infantry within three tiles receive +45% attack without stacking.
- Supplied idle, windup, strike and corpse illustrations; approximately two tiles tall, 1,200 ms windup before damage, illustrated blood/spark atlas effects.
- Occupied-city production headings link the selected homeland city. Harbor markers and source-port error text are displayed in the homeland catalogue.
- Run `node qa/sapros-regression.cjs` and `npm test`; the latter covers real production, deployment, save compatibility, Canvas artwork and linked city headings. Physical Android installation/performance remains outside automated coverage.
