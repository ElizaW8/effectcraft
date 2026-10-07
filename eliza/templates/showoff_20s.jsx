// Eliza show-off clip (1080x1920, 30 fps, 20 s) rebuilt ONLY from eliza/presets.
// Build + render (from the repo root):
//   python eliza/tools/ecbuild.py eliza/templates/showoff_20s.jsx --params my_showoff.json \
//       --save-as showoff.ecproj --render showoff.mp4 --comp ElizaShowoff
// With no params it uses the procedural spiral and the neutral placeholder cut-out, so it always runs.
//@include "../presets/_core.jsx"
//@include "../presets/spiral_procedural.jsx"
//@include "../presets/spiral_bloom.jsx"
//@include "../presets/breathing_pulse.jsx"
//@include "../presets/text_drift.jsx"
//@include "../presets/cutout_popin.jsx"
//@include "../presets/flash_slam.jsx"
//@include "../presets/beat_push.jsx"
//@include "../presets/end_card.jsx"
//@include "../presets/split_screen.jsx"

var PRM = ELIZA.params({
  compName: "ElizaShowoff",
  spiral: "procedural",            // or a seamless spiral loop video (path)
  cutouts: [],                     // up to 4 transparent PNG paths; missing ones use the placeholder
  placeholder: "@eliza/placeholders/cutout_placeholder.png",
  audio: null,                     // optional WAV/MP3 path (eliza/tools/make_audio.py makes the drone+hits bed)
  theme: "pink",                   // procedural spiral theme
  palette: "purple",               // breathing hue drift on the main spiral: purple | rainbow | none
  lines: [["look at the centre", -60, 220], ["breathe out", 150, 420], ["slower", -140, 620], ["good", 170, 300]],
  words: ["DEEPER", "MINE"],
  endText: "ELIZA",
  topLabel: null, bottomLabel: "NATIVE EFFECTCRAFT SPIRAL"
});
var W = 1080, H = 1920, FPS = 30, DUR = 20;

// ---- items (imported in a fixed order so rebuilds are deterministic)
var spiralItem = (PRM.spiral && PRM.spiral !== "procedural") ? ELIZA.item(PRM.spiral) : null;
var cut = [];
for (var i = 0; i < 4; i++) cut.push(ELIZA.item(PRM.cutouts[i] || PRM.placeholder));
var audioItem = PRM.audio ? ELIZA.item(PRM.audio) : null;

// ---- native procedural spiral precomp
var proc = ELIZA.spiral_procedural({ name: "ProcSpiral", width: W, height: H, duration: DUR, fps: FPS, theme: PRM.theme });

// ---- main comp
var comp = app.project.items.addComp(PRM.compName, W, H, 1, DUR, FPS);
comp.bgColor = [0, 0, 0];
if (audioItem) ELIZA.place(comp, audioItem, { name: "Audio_Bed" });

// 1. spiral bloom (loop footage or the procedural spiral) + breathing pulse 4 in / 6 out
var sp = ELIZA.spiral_bloom(comp, { source: spiralItem || proc, end: 16.6, bloomStart: 0.15, bloomDuration: 2.45 });
ELIZA.breathing_pulse(sp, { scale: 0.07, exposure: [-0.3, 0.45], palette: PRM.palette, hue: -22 });

// 2. native spiral beat 9.2-13.0, split screen 11.4-13.0
var pl = ELIZA.place(comp, proc, { name: "ProcSpiral_Native", start: 9.2, end: 13.0 });
ELIZA.breathing_pulse(pl, { scale: 0.05, palette: "none" });
ELIZA.split_screen(comp, { top: sp, bottom: pl, at: 11.4, end: 13.0,
  topLabel: PRM.topLabel || (spiralItem ? "LOOP FOOTAGE" : "SPIRAL BLOOM"), bottomLabel: PRM.bottomLabel });

// 3. end-card background: slowed, dimmed, blurred, breathing spiral
ELIZA.end_card.background(comp, { source: spiralItem || proc, start: 16.5, speed: 0.35, exposure: -1.4, blur: 6, breathe: 0.05 });

// 4. staggered drifting Bebas lines with glow
ELIZA.text_drift(comp, { lines: PRM.lines, start: 1.0, interval: 1.4 });

// 5. cut-out pop-ins (the last one is 3D so the camera dolly moves it)
ELIZA.cutout_popin(comp, { file: cut[0], name: "Cut_1", time: 6.4, end: 8.0, scale: 104, x: 540, glow: [1, 0.3, 0.75, 1] });
ELIZA.cutout_popin(comp, { file: cut[1], name: "Cut_2", time: 9.6, end: 11.4, scale: 104, x: 540, glow: [1, 0.35, 0.8, 1] });
ELIZA.cutout_popin(comp, { file: cut[2], name: "Cut_3", time: 13.0, end: 14.6, scale: 104, x: 560, glow: [0.85, 0.3, 1, 1] });
ELIZA.cutout_popin(comp, { file: cut[3], name: "Cut_4_3D", time: 14.6, end: 16.5, scale: 128, x: 560, glow: [0.2, 0.95, 1, 1], threeD: true });

// 6. 3D camera dolly on the last beat
ELIZA.camera_dolly(comp, { start: 14.6, end: 16.45, dy: -40, zFactor: 0.86 });

// 7. flashes + word slams
ELIZA.flash_slam(comp, { word: PRM.words[0], time: 8.0, end: 9.25, fill: [1, 1, 1], glow: [1, 0.25, 0.7, 1], flashName: "Flash_White" });
ELIZA.flash_slam(comp, { word: PRM.words[1], time: 13.0, end: 14.45, fill: [1, 0.55, 0.85], glow: [0.9, 0.1, 0.6, 1], flashColour: [1, 0.45, 0.78], flashName: "Flash_Pink" });
ELIZA.flash_slam(comp, { time: 14.6, flashColour: [0.5, 1, 1], flashPeak: 70, flashName: "Flash_Cyan" });

// 8. end-card title
ELIZA.end_card.title(comp, { text: PRM.endText, start: 17.0 });

// 9. beat push-ins + wiggle shake (adjustment layer over everything above)
ELIZA.beat_push(comp, {
  beats: [
    { at: 8.0, from: 6.4, release: 9.2, build: 105, punch: 112, settle: 106, settleAfter: 0.5, drift: 107 },
    { at: 13.0, from: 9.2, release: 14.6, build: 104, punch: 111, settle: 105, settleAfter: 0.4, drift: 106 }
  ],
  tail: [[16.5, 102]],
  shakeHits: [[8.0, 40], [13.0, 48], [14.6, 24]]
});

// 10. fade out
ELIZA.end_card.fadeOut(comp, { start: 19.3 });

comp.openInViewer();
ELIZA.log("showoff_20s: " + comp.numLayers + " layers");
"built"
