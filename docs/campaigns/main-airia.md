# Main campaign / 01 — 아이리아 전역.

## Scope

The 25 opening pages at 황금항 야전 지휘소 lead into the Golden Harbor battle. The player commands Ayria on a 22×15 illustrated map in the shared conquest engine. Hold the harbor and the entrance to King Hupi’s pyramid through eight enemy turns. Losing either site ends the mission. Dante sends infantry, armor and artillery on turns 2, 4 and 6, entering from the northwest, southwest and west respectively. Both armies use ordinary combat and capture. A win immediately opens the 14-page fleet arrival scene. Stages 02–10 are locked.

## Story and later battle direction

The cornered Ayria Empire holds Golden Harbor, site of King Hupi's pyramid, until Stetopian troops arrive. Stetopia demanded the Seonseok as the price of military support; Emperor Actium II accepted. General Nagorn commands the 17th Corps. He objects mainly to damage to the pyramid during excavation, rather than ownership of the stone. He nevertheless judges this preferable to Dante's destructive looting. The final page is the scout's enemy reinforcement report. The final scout report leads into the mission briefing and battle. The closing dialogue follows the arrival of the Stetopian fleet and the negotiations over what comes ashore first.

## Assets and continuity

Original portraits live at immutable asset-only commit `9645f5be6094455cbcdd0268ebc9b29901887e47`, originally on `assets/airia-stage-01-originals`. Never merge that branch into main: its tree contains only the three PNGs. `tools/prepare_main_airia_assets.py` downloads and SHA-256 verifies those exact bytes for offline APK packaging. All three are ignored on main; do not re-encode, resize, or embed image data in source.

The campaign card and stage 01 use `main-campaign-scene-7.png` from the existing prologue. `main-airia-command-post.svg` is the field tent, map table, radio, and pyramid-facing window. Standing portraits may extend naturally below the screen or dialogue banner, as requested. Existing subcampaign styling is reused under a separate main-campaign controller. The campaign uses `terha-campaign-main-airia-m01-v2` and its own manual slots for battles. `terha-main-airia-m01` tracks the clear and the closing scene separately. `main-airia-golden-harbor.webp` is an elevated oblique view with terrain masks for the sea and the pyramid footprint.

## Validation

`node qa/main-airia-browser.cjs` verifies all 25 pages at four viewports, portraits, the mission briefing, locks, controls, visibility pause, and subcampaign access. `qa/main-airia-defense-browser.cjs` covers the shared battle, real enemy turns, scoped saves, and continuation into the closing scene. Existing prologue and shared campaign/browser regressions remain required. The release verifies original asset digests and exact source bytes inside the signed APK.
