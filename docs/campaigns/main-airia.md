# Main campaign / 01 — 아이리아 전역.

## Scope

25 dialogue pages at 황금항 야전 지휘소, followed by a mission start card and a Play transition. The Play destination intentionally has only an exit control; there is no battlefield, setup(), scenario activation, save mutation, completion or unlock grant. Stages 02–10 remain locked. Do not implement the battlefield without a follow-on request.

## Story and later battle direction

The cornered Ayria Empire holds Golden Harbor, site of King Hupi's pyramid, until Stetopian troops arrive. Stetopia demanded the Seonseok as the price of military support; Emperor Actium II accepted. General Nagorn commands the 17th Corps. He objects mainly to damage to the pyramid during excavation, rather than ownership of the stone. He nevertheless judges this preferable to Dante's destructive looting. The final page is the scout's enemy reinforcement report. The eventual clear condition is to stop Dante's forces; this is design guidance only and must not appear in the opening UI.

## Assets and continuity

Original portraits live at immutable asset-only commit `9645f5be6094455cbcdd0268ebc9b29901887e47`, originally on `assets/airia-stage-01-originals`. Never merge that branch into main: its tree contains only the three PNGs. `tools/prepare_main_airia_assets.py` downloads and SHA-256 verifies those exact bytes for offline APK packaging. All three are ignored on main; do not re-encode, resize, or embed image data in source.

The campaign card and stage 01 use `main-campaign-scene-7.png` from the existing prologue. `main-airia-command-post.svg` is the field tent, map table, radio, and pyramid-facing window. Standing portraits may extend naturally below the screen or dialogue banner, as requested. Existing subcampaign styling is reused under a separate main-campaign controller. No persistence is introduced.

## Validation

`node qa/main-airia-browser.cjs` verifies all 25 pages at four viewports, portraits, start/play, locks, controls, visibility pause, no scenario/save changes and subcampaign access. Existing prologue and shared campaign/browser regressions remain required. The release verifies original asset digests and exact source bytes inside the signed APK.
