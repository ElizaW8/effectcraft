# Eliza adaptation layer for EffectCraft

This folder is **our** layer on top of [EffectCraft](https://github.com/storytold/effectcraft), the
open-source After Effects-style compositor in Rust by the ArtCraft Team. Everything outside `eliza/`
is upstream code and stays **untouched**, so upstream updates merge cleanly. EffectCraft is
dual-licensed MIT OR Apache-2.0; the upstream `LICENSE-MIT`, `LICENSE-APACHE`, `NOTICE` and
`ATTRIBUTION.md` stay in place and apply to the whole fork. The ArtCraft name/logos are trademarks of
the ArtCraft Team (see `docs/brand/LICENSE-brand.txt`) and are not used by this layer.

What it is: reusable, parameterised **motion presets** written in EffectCraft's After Effects-style
scripting (plain ES5 JSX: `app.project`, comps, layers, properties, expressions), plus **templates**
that compose them into finished comps. Every visual move is native EffectCraft -- no external
renderer, no pre-baked effects.

```
eliza/
  presets/      one move per file, each defines functions on the global ELIZA object
    _core.jsx            helpers (keys/ease, masks, glow, text, item cache, themes, params)
    spiral_procedural.jsx  spiral_bloom.jsx  breathing_pulse.jsx  text_drift.jsx
    cutout_popin.jsx  flash_slam.jsx  beat_push.jsx  end_card.jsx  split_screen.jsx
  templates/
    showoff_20s.jsx      the 20 s show-off clip, built only from presets
    spiral_loop.jsx      parametric seamless spiral loop, portrait + landscape (spiral engine v0)
    *.params.example.json
  tools/
    ecbuild.py           bundles a template + its presets, runs effectcraft-cli script / render
    make_audio.py        procedural drone + hits audio bed (numpy)
  fonts/                 Bebas Neue (SIL OFL 1.1) + its license
  placeholders/          neutral cut-out placeholder PNG
  UPSTREAM.md            the exact upstream commit / release this layer is pinned to
```

No character art or adult material lives in this repo. Templates take asset paths as parameters;
without them they fall back to the procedural spiral and `placeholders/cutout_placeholder.png`.

## Pinned upstream version

**Pin the upstream version.** This fork was taken from `storytold/effectcraft` `main` @
`608d1b077b65bb7591f26be587a2a5a47f4278bc` (2026-10-07), 4 commits after release **v0.4.0**
(`f5ebe5f6c5e887dddda4a2be1fcb47154e959b81`). The presets were validated with the **v0.4.0**
release binaries (`effectcraft-cli 0.4.0`). Use the same release (or a build of the pinned commit)
and update `UPSTREAM.md` whenever you move the pin.

## Install EffectCraft

* **Linux x86_64**: download `effectcraft-0.4.0-linux-x86_64.tar.gz` from
  https://github.com/storytold/effectcraft/releases/tag/v0.4.0 (check it against `SHA256SUMS.txt`),
  unpack, and use `bin/effectcraft-cli` (the GUI is `bin/effectcraft`). `.deb`, `.rpm` and AppImage also exist.
* **Windows x64**: `effectcraft-0.4.0-windows-x64-portable.zip` contains `effectcraft-cli.exe` and
  `effectcraft.exe` (or install the `.msi`).
* Point the tools at the CLI with `--cli PATH`, the `EFFECTCRAFT_CLI` environment variable, or `PATH`.
* **Font**: install `eliza/fonts/BebasNeue-Regular.ttf` (Linux: copy to `~/.local/share/fonts/`;
  Windows: right-click -> Install, which puts it in `%LOCALAPPDATA%\Microsoft\Windows\Fonts`).
  EffectCraft scans the system/user font folders; the presets use the PostScript name `BebasNeue-Regular`.
  Also available from https://fonts.google.com/specimen/Bebas+Neue .

## Running templates

EffectCraft's script engine has no `#include` and `$.evalFile` is disabled, so a template lists its
presets with `//@include "../presets/x.jsx"` lines and `tools/ecbuild.py` (Python 3, stdlib only)
inlines them into one bundle, injects the parameters, runs `effectcraft-cli script ... --save-as`,
and optionally renders. Run from the repo root.

Linux:
```bash
export EFFECTCRAFT_CLI=/opt/effectcraft/bin/effectcraft-cli
# 8 s seamless portrait spiral loop
python3 eliza/tools/ecbuild.py eliza/templates/spiral_loop.jsx --set orientation=portrait --set seconds=8 \
  --save-as out/spiral.ecproj --render out/spiral_portrait_8s.mp4 --comp SpiralLoop_Portrait --audio off
# show-off clip with your own assets (copy + edit the example params)
python3 eliza/tools/make_audio.py --out out/drone_hits_20s.wav
python3 eliza/tools/ecbuild.py eliza/templates/showoff_20s.jsx --params my_showoff.json \
  --save-as out/showoff.ecproj --render out/showoff.mp4 --comp ElizaShowoff --audio on
```

Windows (PowerShell):
```powershell
$env:EFFECTCRAFT_CLI = "C:\Tools\effectcraft-0.4.0-windows-x64-portable\effectcraft-cli.exe"
py eliza\tools\ecbuild.py eliza\templates\spiral_loop.jsx --set orientation=landscape --set seconds=10 `
  --save-as out\spiral.ecproj --render out\spiral_landscape.mp4 --comp SpiralLoop_Landscape --audio off
py eliza\tools\ecbuild.py eliza\templates\showoff_20s.jsx --params my_showoff.json `
  --save-as out\showoff.ecproj --render out\showoff.mp4 --comp ElizaShowoff --audio on
```

Useful flags: `--bundle-only` (just write `eliza/build/<name>.bundle.jsx`, which you can also run in the
GUI's script console or with `effectcraft-cli script`), `--render-arg=--end --render-arg=4` (any extra
`render` option), `--format`, `--bitrate`. Parameter values given with `--set` are JSON when they parse
as JSON, else plain strings. Paths starting with `@eliza/` resolve inside this folder.
Quick look at one frame: `effectcraft-cli render-frame --project out/showoff.ecproj --comp ElizaShowoff --time 8.1 --out f.png`.

Using presets in your own template: start the file with the `//@include` lines you need (always
`_core.jsx` first), read parameters with `ELIZA.params({...defaults})`, then call the presets on a comp.

### Template parameters

**showoff_20s** (comp `ElizaShowoff`, 1080x1920, 30 fps, 20 s): `spiral` ("procedural" or loop video
path), `cutouts` (up to 4 PNG paths; missing -> placeholder), `placeholder`, `audio` (path or null),
`theme`, `palette` (purple | rainbow | none), `lines` ([[text, xOffset, y], ...]), `words` ([slam1, slam2]),
`endText`, `topLabel`, `bottomLabel`, `compName`.

**spiral_loop** (comps `SpiralLoop_Portrait` 1080x1920 / `SpiralLoop_Landscape` 1920x1080):
`orientation` (portrait | landscape | both), `seconds` (loop length, default 8), `duration` (comp length,
default = seconds; use a multiple for longer seamless renders), `fps`, `theme`, `arms`, `twist`, `speed`,
`wobble`, `wobbleFreq`, `clearCentre` ("auto" = 30 % of the short side, px, or 0), `clearFeather`,
`breathe`, `breatheScale`, `palette`, `hue`, `vignette`, `namePrefix`. Rotation speed and wobble are snapped
so the loop is seamless (frame at `seconds` == frame 0); the breath cycle equals the loop length with the
4:6 in/out ratio (set `seconds` to 10 for exactly 4 s in / 6 s out).

## Preset reference

All presets take an options object; anything omitted uses the default shown (defaults reproduce the
show-off clip). Colours are `[r, g, b]` or `[r, g, b, a]` in 0..1; times are comp seconds.

| Preset | Call | Parameters (default) |
|---|---|---|
| spiral_procedural | `ELIZA.spiral_procedural(opts)` -> precomp | `name` "ProcSpiral", `width` 1080, `height` 1920, `duration` 20, `fps` 30, `theme` "pink" (pink/purple/cyan/mono/object), `speed` -150 deg/s, `arms` 16, `twist` 45 (0 spokes .. 80 tight coil), `wobble` 35, `wobbleFreq` 1.1, `twirlRadius` 55, `size` 2200, `gradient` [0.42,1], `stripeFeather` 16, `completion` 50, `clearCentre` 0 px (our locked loop style uses a clear centre: arms only mid-to-outer frame), `clearFeather` 0.8*r, `vignette` true, `loop` 0 (s; >0 snaps for seamless looping), `prefix` "PS" |
| spiral_bloom | `ELIZA.spiral_bloom(comp, opts)` -> layer | `source` "procedural" / path / item / comp, `procedural` {} (spiral_procedural opts), `name` "SpiralLoop", `start` 0, `end` comp end, `loop` true (loopOut cycle for footage), `bloomStart` 0.15, `bloomDuration` 2.45, `center` comp centre, `startRadius` 4, `endRadius` "auto" (0.656 x long side), `feather` 170, `easeInfluence` 75 |
| breathing_pulse | `ELIZA.breathing_pulse(layer, opts)` | `inSec` 4, `outSec` 6, `offset` 0, `scale` 0.07, `exposure` null or [base, amount], `palette` "purple" / "rainbow" / "none", `hue` -22, `saturation` 12, `intensity` 1. `ELIZA.breathExpr(in, out, offset)` gives the raw expression prefix (defines `p` 0..1) |
| text_drift | `ELIZA.text_drift(comp, opts)` -> layers | `lines` [[text, xOffset, y], ...], `start` 1.0, `interval` 1.4, `hold` 3.0, `drift` 110 px, `fadeIn` 0.4, `fadeOutAt` 2.0, `easeInfluence` 50, `size` 104, `fill` [1,0.93,0.98], `font` "BebasNeue-Regular", `tracking` 40, `glow` [1,0.25,0.7,1], `glowSoftness` 26, `glowOpacity` 95, `namePrefix` "Line_" |
| cutout_popin | `ELIZA.cutout_popin(comp, opts)` -> layer | `file` (required), `time` 0, `end` time+1.6, `name`, `scale` 104, `overshoot` 1.18, `undershoot` 0.94, `settle` 1.03, `popDuration` 0.52, `easeInfluence` 45, `x` centre, `y` height+15, `anchor` "bottom" or [x,y], `glow` [1,0.3,0.75,1], `glows` [[45,90],[140,70]] (softness, opacity per layer), `threeD` false |
| flash_slam | `ELIZA.flash_slam(comp, opts)` -> {slam, flash}; also `ELIZA.flash`, `ELIZA.slam` | `word` (null = flash only), `time`, `end` time+1.25, `fill` [1,1,1], `glow` [1,0.25,0.7,1], `glowSoftness` 40, `size` 330, `pos`, `fromScale` 290, `undershoot` 92, `endScale` 110, `blur` 40, `impact` 0.12, `fadeOut` 0.45, `flashColour` (= fill), `flashPeak` 100, `holdFrames` 2, `length` 0.45, `flashName` |
| beat_push | `ELIZA.beat_push(comp, opts)` -> {layer, camera}; also `ELIZA.camera_dolly` | `beats` [{at, from (at-1.5), release (at+1.2), build 105, punch 112, settle 106, settleAfter 0.5, drift 107}], `tail` [[t, scale]], `scaleKeys` (raw override), `shakeHits` [[t, px]], `rotation` 2.5 deg, `decay` 0.6, `posFreq` 22, `rotFreq` 18, `name` "BeatPush_Shake", `camera` null or camera_dolly opts. camera_dolly: `start`, `end`, `dy` -40, `zFactor` 0.86, `easeInfluence` 70, `name` "Cam" (moves 3D layers only) |
| end_card | `ELIZA.end_card(comp, {background, title, fade})`; parts `.background`, `.title`, `.fadeOut` | background: `source` (required), `start` 16.5, `speed` 0.35, `offset` 1, `wrap` "auto", `fadeIn` 0.45, `exposure` -1.4, `blur` 6, `breathe` 0.05. title: `text` "ELIZA", `colour` [1,0.42,0.76], `size` 380, `pos`, `start` 17, `fadeIn` 0.7, `fromScale` 82, `popDuration` 1.2, `pulse` 0.03, `pulsePeriod` 5, `glows`, `font`. fadeOut: `start` 19.3, `end`, `colour` black |
| split_screen (helper) | `ELIZA.split_screen(comp, opts)` | `top`, `bottom` (layers), `at` 11.4, `end` 13.0, `maskTop` 482, `topLabel`, `bottomLabel`, `labelSize` 90, `labelY` [150,1070], `labelGlow`, `dividerColour`, `dividerGlow`, `dividerHeight` 8 |

Layer order = call order (newer layers on top), and an adjustment layer (beat_push) only affects
layers below it, so call presets in stacking order -- see `templates/showoff_20s.jsx`.

## Updating from upstream

```bash
git remote add upstream https://github.com/storytold/effectcraft.git   # once
git fetch upstream --tags
git checkout main && git merge v0.4.1          # a release tag (preferred) or upstream/main
git push origin main
```
Then: install the matching release binary, rebuild both templates, compare a few frames against the
previous render (`render-frame`), and update `UPSTREAM.md`. Because nothing outside `eliza/` is
modified, merges should never conflict.

## Known quirks (EffectCraft 0.4.0)

* **A failed script still saves a half-built project** when run with `--save-as`. `ecbuild.py` deletes it
  on a non-zero exit; if you run `effectcraft-cli script` yourself, check the exit code before rendering.
* **Effect parameters are nested**: e.g. Exposure's value is `Master/Exposure`, Hue/Saturation uses
  `Master Hue` / `Master Saturation`. `ELIZA.P(effect, "Group/Param")` walks the groups (exact name first,
  then partial match) and lists the available names in its error.
* **Prefer H.264** (`--format h264`). The HEVC and AV1 encoders are still immature.
* **CPU render is slow**: about 4 fps at 1080x1920 on 8 CPU cores (20 s clip about 2.5 min). Use
  `render-frame` for checks and `--resolution half` for drafts.
* A relative `render --out` path is resolved against the **project file's folder**, not the current
  directory -- pass absolute paths (`ecbuild.py` does).
* No `#include` / `$.evalFile` in scripts (hence `ecbuild.py`). Script file reads are limited to the project
  folder unless "Allow Scripts to Write Files" is on; importing footage works from anywhere.
* `wiggle()` is seeded by layer index + property, so inserting layers changes the shake pattern (the
  template creates layers in a fixed order to stay deterministic).

## Credits

EffectCraft (c) 2026 ArtCraft Team and the EffectCraft contributors, MIT OR Apache-2.0.
Bebas Neue (c) 2010 Dharma Type, SIL Open Font License 1.1 (`fonts/OFL-BebasNeue.txt`).
The files in `eliza/` are contributed under the same MIT OR Apache-2.0 terms as the rest of the repository.
