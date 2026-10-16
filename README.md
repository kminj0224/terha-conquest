# Terha Conquest

Private development repository. Current baseline: **v1.10.67**, Android versionCode **111**.

## Cloud setup

Use Python 3 and Java 17. All game artwork, audio, fonts, the Android shell, signing files and Java build dependencies are included.

- Build the update APK: `python3 build.py`
- Output: `deliverables/Terha-Conquest-v1.10.67.apk`
- Install QA dependency: `npm install`
- Game regression checks: `npm test`
- Android shell checks: `python3 qa/verify-native.py`
- Export the generated sound banks as WAV files: `python3 tools/export_wav.py` (output: `audio/wav/`, excluded from Git).

Continue from this repository and commit completed changes to preserve them for the next task. Do not use APKs as the editable source. See [README-ko.md](README-ko.md) for the Korean release notes and validation limits.
