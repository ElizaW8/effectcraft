// cutout_popin -- a transparent cut-out PNG pops in with a springy scale overshoot and a 2-layer glow.
// Anchored at the bottom centre of the image so it "stands" on the frame bottom. Returns the layer.
//
// opts:
//   file (required)      path ("@eliza/placeholders/cutout_placeholder.png" works) or imported item
//   time 0, end time+1.6, name "Cutout"
//   scale 104            final scale %; overshoot 1.18 -> undershoot 0.94 -> settle 1.03 -> 1.0
//   popDuration 0.52     seconds for the whole spring; easeInfluence 45
//   x comp centre, y comp.height + 15, anchor "bottom" (bottom-centre of the image) or [ax, ay]
//   glow [1,0.3,0.75,1]; glows [[45, 90], [140, 70]] ([softness, opacity] per Drop Shadow layer)
//   threeD false         make it a 3D layer (so a camera dolly affects it)
ELIZA.cutout_popin = function (comp, opts) {
  var o = ELIZA.opts(opts, {
    file: null, time: 0, end: null, name: "Cutout", scale: 104, overshoot: 1.18, undershoot: 0.94, settle: 1.03,
    popDuration: 0.52, easeInfluence: 45, x: null, y: null, anchor: "bottom",
    glow: [1, 0.3, 0.75, 1], glows: [[45, 90], [140, 70]], threeD: false
  });
  if (!o.file) throw new Error("cutout_popin: opts.file is required");
  var item = ELIZA.item(o.file), TR = ELIZA.TR, t0 = o.time, d = o.popDuration / 0.52;
  var l = comp.layers.add(item); l.name = o.name;
  ELIZA.span(l, t0, (o.end === null) ? t0 + 1.6 : o.end);
  if (o.threeD) l.threeDLayer = true;
  var a = (o.anchor === "bottom") ? [item.width / 2, item.height] : o.anchor;
  var x = (o.x === null) ? comp.width / 2 : o.x, y = (o.y === null) ? comp.height + 15 : o.y;
  TR(l).property("ADBE Anchor Point").setValue(o.threeD ? [a[0], a[1], 0] : [a[0], a[1]]);
  TR(l).property("ADBE Position").setValue(o.threeD ? [x, y, 0] : [x, y]);
  function S(v) { return o.threeD ? [v, v, v] : [v, v]; }
  var sF = o.scale;
  ELIZA.keys(TR(l).property("ADBE Scale"),
    [[t0, S(0)], [t0 + 0.16 * d, S(sF * o.overshoot)], [t0 + 0.28 * d, S(sF * o.undershoot)], [t0 + 0.40 * d, S(sF * o.settle)], [t0 + 0.52 * d, S(sF)]],
    "ease", o.easeInfluence);
  ELIZA.keys(TR(l).property("ADBE Opacity"), [[t0, 0], [t0 + 0.08 * d, 100]], "linear");
  for (var i = 0; i < o.glows.length; i++) ELIZA.glow(l, o.glow, o.glows[i][0], o.glows[i][1]);
  return l;
};
