# Terha Conquest project instructions

The current baseline is v1.11.53. Preserve existing save compatibility, faction/type IDs, geography and Android update identity unless the task changes them.

- Edit the game under game/assets; index.html script order matters and bootstrap.js must be last.
- Build with Python 3 and Java 17 using python3 build.py. The original Android shell, build JARs and signing files are under android/ and tools/.
- Run python3 tools/prepare_operation_music.py before npm test; it generates offline MP3 data with ffmpeg/ffprobe without changing source audio. build.py also runs it automatically. Do not commit generated game/assets/operation-music-data.js.
- Native Canvas regression coverage is qa/native-test.cjs. Run npm install before npm test when dependencies are missing. The test uses real graphics with simulated DOM/audio; it is not a physical Android test.
- qa/verify-native.py checks the native shell patch.
- When bumping a release, update build.py VERSION/CODE, game/assets/saves.js appVersion and the application version constant in app-shell.js.
- Do not commit generated APKs, build output, node_modules or previews.
- Check git status before editing; preserve unrelated user changes. Commit completed work when requested so future cloud tasks can retrieve it.

- Android shell source is android/native-src. Recompile it with python3 tools/build_native_shell.py only after native edits, then run qa/verify-native.py and the normal build. Compile-only android/compile-stubs must never enter DEX.

- For native session edits, also run python3 qa/test-live-session.py. Ordinary Home/Recents and Activity recreation must preserve the same WebView and must not navigate/reload the page.


## Iron Crown campaign continuity

- Read docs/campaigns/iron-crown.md and game/assets/campaign-data.js before campaign work. They preserve the approved full story, user decisions and follow-on plan.
- Only mission 01 is implemented in v1.11.53. Do not implement/unlock later missions before the user supplies play feedback and requests continuation.
- Campaign production is a game rule, not a lore requirement. Keep campaign saves separate from all conquest save keys.
- Campaign battles MUST use the existing conquest engine, canvas and UI. Only map data/art, scenario goals and triggers differ. Do not introduce a separate tactical engine or UI.
- Run npm test (includes qa/campaign-shared-native.cjs) and the Chromium qa/campaign-browser.cjs when changing the campaign.
