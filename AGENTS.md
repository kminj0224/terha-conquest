# Terha Conquest project instructions

The current baseline is v1.11.59. Preserve existing save compatibility, faction/type IDs, geography and Android update identity unless the task changes them.

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
- Missions 01–03 are implemented by user request. Read campaign-m02-data.js and campaign-m03-data.js. Do not implement/unlock mission 04 onward without continuation. Missions 01/02 have no victory-turn floor or forced hold. Mission03 explicitly uses the approved five-turn railway defense objective; do not turn this into a general campaign timer. Silence music only during VN dialogue, preserving volume settings.
- Stetopia art direction: gloomy muted navy/blue-gray CYBERPUNK, industrial concrete/steel and cold blue lighting. Characters wear suits or blue-gray modern uniforms, retaining clean anime lines/cel shading. No medieval plate armor, cloaks, gold braids, bright stone castles or sunshine palette. v3 portraits are separate contain-fit assets; preserve identities and uncropped shoulders.
- Campaign production is a game rule, not a lore requirement. Keep campaign saves separate from all conquest save keys.
- Campaign battles MUST use the existing conquest engine, canvas and UI. Only map data/art, scenario goals and triggers differ. Do not introduce a separate tactical engine or UI.
- Run npm test (includes qa/campaign-shared-native.cjs) and the Chromium qa/campaign-browser.cjs when changing the campaign.
\n- Campaign presentation decisions (v1.11.55): clamp viewport and minimum zoom to local artwork only in campaign; compact briefing with visible footer; checklist button directly under the menu. Use separate contain-fit portrait assets. Iron Crown has a unique skin while keeping shared engine rules; never add implementation explanations to gameplay UI.\n

- v1.11.59 campaign rules: ordinary armies never transfer between missions; use each mission fixed roster and retain only fortress/research/resources continuity. Staging bases are level3, all scenario city levels fixed; no capital-only special production exception. Enemy orders prioritize mission-point defense/recapture, never the departure base. Run qa/campaign-orders-simulation.cjs as well.
