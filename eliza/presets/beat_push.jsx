// beat_push -- "camera" energy on an adjustment layer (Transform effect) over everything below it:
// slow push-ins that build into each beat, a punch on the hit, settle, drift and release; plus a
// decaying wiggle shake (position + rotation) on hits. Optional real 3D camera dolly (ELIZA.camera_dolly)
// which only moves 3D layers. Returns { layer, camera }.
//
// beat_push opts:
//   beats [{at, from, release, build, punch, settle, settleAfter, drift}, ...]
//       from     -> scale 100 (start of the build), at-0.05 -> build, at -> punch,
//       at+settleAfter -> settle, release-0.05 -> drift, release -> back to 100.
//       defaults: from at-1.5, release at+1.2, build 105, punch 112, settle 106, settleAfter 0.5, drift 107
//   tail [[t, scale], ...] extra keys after the beats (e.g. [[16.5, 102]] slow creep)
//   scaleKeys null       raw [[t, scale], ...] instead of beats/tail
//   shakeHits [[t, px], ...] position shake amplitude per hit; rotation 2.5 deg per hit
//   decay 0.6 (s), posFreq 22, rotFreq 18 (wiggles/s), name "BeatPush_Shake"
//   camera null          options for ELIZA.camera_dolly (adds a camera in the same call)
// camera_dolly opts: start, end, dy -40 (px up), zFactor 0.86 (z distance multiplier), easeInfluence 70, name "Cam"
ELIZA.camera_dolly = function (comp, opts) {
  var o = ELIZA.opts(opts, { start: 0, end: 2, dy: -40, zFactor: 0.86, easeInfluence: 70, name: "Cam" });
  var cam = comp.layers.addCamera(o.name, [comp.width / 2, comp.height / 2]);
  var cpos = ELIZA.TR(cam).property("ADBE Position"), c0 = cpos.value;
  ELIZA.keys(cpos, [[o.start, [c0[0], c0[1], c0[2]]], [o.end, [c0[0], c0[1] + o.dy, c0[2] * o.zFactor]]], "ease", o.easeInfluence);
  return cam;
};
ELIZA.beatScaleKeys = function (beats, tail) {
  var k = [[0, 100]];
  function add(t, v) { var last = k[k.length - 1]; if (Math.abs(last[0] - t) < 1e-6) { last[1] = v; return; } k.push([t, v]); }
  for (var i = 0; i < beats.length; i++) {
    var b = ELIZA.opts(beats[i], { at: 0, from: null, release: null, build: 105, punch: 112, settle: 106, settleAfter: 0.5, drift: 107 });
    var from = (b.from === null) ? b.at - 1.5 : b.from, rel = (b.release === null) ? b.at + 1.2 : b.release;
    add(from, 100); add(b.at - 0.05, b.build); add(b.at, b.punch); add(b.at + b.settleAfter, b.settle);
    add(rel - 0.05, b.drift); add(rel, 100);
  }
  for (var j = 0; tail && j < tail.length; j++) add(tail[j][0], tail[j][1]);
  return k;
};
ELIZA.beat_push = function (comp, opts) {
  var o = ELIZA.opts(opts, { beats: [], tail: [], scaleKeys: null, shakeHits: [], rotation: 2.5, decay: 0.6, posFreq: 22, rotFreq: 18, name: "BeatPush_Shake", camera: null });
  var r = {};
  if (o.camera) r.camera = ELIZA.camera_dolly(comp, o.camera);
  var adj = comp.layers.addSolid([0, 0, 0], o.name, comp.width, comp.height, 1); adj.adjustmentLayer = true;
  var tf = ELIZA.eff(adj, "Transform"), P = ELIZA.P;
  ELIZA.keys(P(tf, "Scale Height"), o.scaleKeys || ELIZA.beatScaleKeys(o.beats, o.tail), "linear");
  if (o.shakeHits.length) {
    var ph = [], rh = [];
    for (var i = 0; i < o.shakeHits.length; i++) { ph.push("[" + o.shakeHits[i][0] + "," + o.shakeHits[i][1] + "]"); rh.push(o.shakeHits[i][0]); }
    P(tf, "Position").expression = "var hits=[" + ph.join(",") + "]; var a=0; for (var i=0;i<hits.length;i++){ var d=time-hits[i][0]; if (d>=0 && d<" + o.decay + ") a=Math.max(a, hits[i][1]*Math.pow(1-d/" + o.decay + ",2)); } wiggle(" + o.posFreq + ", a)";
    P(tf, "Rotation").expression = "var hits=[" + rh.join(",") + "]; var a=0; for (var i=0;i<hits.length;i++){ var d=time-hits[i]; if (d>=0 && d<" + o.decay + ") a=Math.max(a, " + o.rotation + "*Math.pow(1-d/" + o.decay + ",2)); } wiggle(" + o.rotFreq + ", a)";
  }
  r.layer = adj;
  return r;
};
