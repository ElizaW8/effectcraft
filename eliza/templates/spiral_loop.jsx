// Parametric seamless spiral loop (portrait 1080x1920 and/or landscape 1920x1080) -- the start of the
// kit's spiral engine. Everything is native EffectCraft: procedural spiral precomp (spiral_procedural with
// loop snapping) + breathing pulse whose cycle equals the loop length, so frame N == frame 0.
// Build + render an 8 s portrait loop (from the repo root):
//   python eliza/tools/ecbuild.py eliza/templates/spiral_loop.jsx --set orientation=portrait --set seconds=8 \
//       --save-as spiral.ecproj --render spiral_portrait_8s.mp4 --comp SpiralLoop_Portrait
//@include "../presets/_core.jsx"
//@include "../presets/spiral_procedural.jsx"
//@include "../presets/breathing_pulse.jsx"

var PRM = ELIZA.params({
  orientation: "both",     // portrait | landscape | both
  seconds: 8,              // loop length; rotation/wobble/breath are snapped to it
  duration: null,          // comp length (default = seconds); use a multiple of seconds for longer renders
  fps: 30,
  theme: "pink",           // pink | purple | cyan | mono | {highlights, midtones, shadows, bg}
  arms: 16,
  twist: 45,               // 0 = straight spokes, 45 = classic spiral, up to 80 = tight coil
  speed: -150,             // deg/s target (snapped to a whole number of arm steps per loop)
  wobble: 35, wobbleFreq: 1.1,
  clearCentre: "auto",     // px radius of the clear centre ("auto" = 30 % of the short side, 0 = off)
  clearFeather: null,
  breathe: true,           // breathing pulse, cycle = loop length with the 4:6 in/out ratio
  breatheScale: 0.04,
  palette: "purple",       // purple | rainbow | none
  hue: -22,
  vignette: true,
  namePrefix: "SpiralLoop"
});

function buildLoop(W, H, label) {
  var dur = PRM.duration || PRM.seconds;
  var cc = (PRM.clearCentre === "auto") ? Math.round(0.3 * Math.min(W, H)) : PRM.clearCentre;
  var size = Math.max(2200, Math.ceil(Math.sqrt(W * W + H * H) / 2) * 2 + 4);
  var pc = ELIZA.spiral_procedural({
    name: PRM.namePrefix + "_Spiral_" + label, prefix: "SP_" + label, width: W, height: H, duration: dur, fps: PRM.fps,
    theme: PRM.theme, arms: PRM.arms, twist: PRM.twist, speed: PRM.speed, wobble: PRM.wobble, wobbleFreq: PRM.wobbleFreq,
    size: size, clearCentre: cc, clearFeather: PRM.clearFeather, vignette: PRM.vignette, loop: PRM.seconds
  });
  var comp = app.project.items.addComp(PRM.namePrefix + "_" + label, W, H, 1, dur, PRM.fps);
  comp.bgColor = [0, 0, 0];
  var l = ELIZA.place(comp, pc, { name: "Spiral" });
  if (PRM.breathe) {
    ELIZA.breathing_pulse(l, { inSec: PRM.seconds * 0.4, outSec: PRM.seconds * 0.6, scale: PRM.breatheScale, palette: PRM.palette, hue: PRM.hue });
  }
  ELIZA.log(comp.name + ": " + W + "x" + H + ", loop " + PRM.seconds + " s, comp " + dur + " s, clear centre " + cc + " px");
  return comp;
}

var made = [];
if (PRM.orientation == "portrait" || PRM.orientation == "both") made.push(buildLoop(1080, 1920, "Portrait"));
if (PRM.orientation == "landscape" || PRM.orientation == "both") made.push(buildLoop(1920, 1080, "Landscape"));
if (!made.length) throw new Error("orientation must be portrait, landscape or both");
made[0].openInViewer();
"built " + made.length
