# Terha Conquest project instructions

The current baseline is v1.11.13. Preserve existing save compatibility, faction/type IDs, geography and Android update identity unless the task changes them.

- Edit the game under game/assets; index.html script order matters and bootstrap.js must be last.
- Build with Python 3 and Java 17 using python3 build.py. The original Android shell, build JARs and signing files are under android/ and tools/.
- Native Canvas regression coverage is qa/native-test.cjs. Run npm install before npm test when dependencies are missing. The test uses real graphics with simulated DOM/audio; it is not a physical Android test.
- qa/verify-native.py checks the native shell patch.
- When bumping a release, update build.py VERSION/CODE, game/assets/saves.js appVersion and the application version constant in app-shell.js.
- Do not commit generated APKs, build output, node_modules or previews.
- Check git status before editing; preserve unrelated user changes. Commit completed work when requested so future cloud tasks can retrieve it.

- Android shell source is android/native-src. Recompile it with python3 tools/build_native_shell.py only after native edits, then run qa/verify-native.py and the normal build. Compile-only android/compile-stubs must never enter DEX.

- For native session edits, also run python3 qa/test-live-session.py. Ordinary Home/Recents and Activity recreation must preserve the same WebView and must not navigate/reload the page.
