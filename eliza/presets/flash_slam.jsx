// flash_slam -- a full-frame colour flash (held for N frames, then fades) and/or a word that slams in
// from huge with motion blur, undershoots, settles and creeps. ELIZA.flash and ELIZA.slam can be used
// on their own; ELIZA.flash_slam adds the word first and the flash above it.
//
// flash opts: colour [1,1,1], time, peak 100 (opacity), holdFrames 2, length 0.45, name "Flash"
// slam opts:  word, time, end time+1.25, fill [1,1,1], glow [1,0.25,0.7,1], glowSoftness 40,
//             size 330, pos [centre x, 900/1920 * height], fromScale 290, undershoot 92, endScale 110,
//             blur 40, impact 0.12 (s to land), fadeOut 0.45, name "Slam_<word>"
// flash_slam opts: word (optional; null = flash only), time, end, fill, glow, flashColour (default fill),
//             flashPeak 100, plus any slam/flash option above.
ELIZA.flash = function (comp, opts) {
  var o = ELIZA.opts(opts, { colour: [1, 1, 1], time: 0, peak: 100, holdFrames: 2, length: 0.45, name: "Flash" });
  var t0 = o.time, f = comp.layers.addSolid(o.colour, o.name, comp.width, comp.height, 1);
  ELIZA.span(f, t0, t0 + o.length);
  var op = ELIZA.TR(f).property("ADBE Opacity");
  ELIZA.keys(op, [[t0, o.peak], [t0 + o.holdFrames / ELIZA.fps(comp), o.peak], [t0 + o.length, 0]], "linear");
  op.setInterpolationTypeAtKey(1, KeyframeInterpolationType.HOLD, KeyframeInterpolationType.HOLD);
  return f;
};
ELIZA.slam = function (comp, opts) {
  var o = ELIZA.opts(opts, {
    word: "DEEPER", time: 0, end: null, fill: [1, 1, 1], glow: [1, 0.25, 0.7, 1], glowSoftness: 40, size: 330, pos: null,
    fromScale: 290, undershoot: 92, endScale: 110, blur: 40, impact: 0.12, fadeOut: 0.45, name: null
  });
  var t0 = o.time, t1 = (o.end === null) ? t0 + 1.25 : o.end, TR = ELIZA.TR;
  var pos = o.pos || [comp.width / 2, Math.round(comp.height * 900 / 1920)];
  var s = ELIZA.text(comp, o.word, o.size, o.fill, pos, o.name || ("Slam_" + o.word));
  ELIZA.span(s, t0, t1);
  ELIZA.keys(TR(s).property("ADBE Scale"),
    [[t0, [o.fromScale, o.fromScale]], [t0 + o.impact, [o.undershoot, o.undershoot]], [t0 + o.impact + 0.1, [100, 100]], [t1, [o.endScale, o.endScale]]], "ease", 40);
  ELIZA.keys(TR(s).property("ADBE Opacity"), [[t0, 100], [t1 - o.fadeOut, 100], [t1, 0]], "linear");
  var b = ELIZA.eff(s, "Gaussian Blur");
  ELIZA.keys(ELIZA.P(b, "Blurriness"), [[t0, o.blur], [t0 + o.impact, 0]], "linear");
  ELIZA.glow(s, o.glow, o.glowSoftness, 100);
  return s;
};
ELIZA.flash_slam = function (comp, opts) {
  var o = ELIZA.opts(opts, { word: null, time: 0, end: null, fill: [1, 1, 1], flashColour: null, flashPeak: 100, flashName: null });
  var r = {};
  if (o.word) r.slam = ELIZA.slam(comp, opts);
  var fo = ELIZA.opts(opts, {});
  fo.colour = o.flashColour || o.fill; fo.peak = o.flashPeak; fo.name = o.flashName || "Flash";
  delete fo.end;
  r.flash = ELIZA.flash(comp, fo);
  return r;
};
