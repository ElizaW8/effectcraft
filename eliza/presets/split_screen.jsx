// split_screen (helper) -- top/bottom comparison for a section: at `at` the bottom layer is masked to
// the lower part of the frame and re-centred there, the top layer re-centres in the top half, a glowing
// divider and two labels appear; at `end` everything returns. Hold keys, so the cut is instant.
//
// opts: top (layer), bottom (layer), at 11.4, end 13.0, maskTop 482 (bottom layer visible below this y),
//   topLabel "LOOP FOOTAGE", bottomLabel "NATIVE EFFECTCRAFT SPIRAL", labelSize 90, labelY [150, 1070],
//   labelGlow [0.6,0.1,0.5,1], dividerColour [1,0.45,0.8], dividerGlow [1,0.3,0.75,1], dividerHeight 8
ELIZA.split_screen = function (comp, opts) {
  var o = ELIZA.opts(opts, {
    top: null, bottom: null, at: 11.4, end: 13.0, maskTop: 482,
    topLabel: "LOOP FOOTAGE", bottomLabel: "NATIVE EFFECTCRAFT SPIRAL", labelSize: 90, labelY: [150, 1070],
    labelGlow: [0.6, 0.1, 0.5, 1], dividerColour: [1, 0.45, 0.8], dividerGlow: [1, 0.3, 0.75, 1], dividerHeight: 8
  });
  var W = comp.width, H = comp.height, cx = W / 2, TR = ELIZA.TR, r = {};
  var bIn = o.bottom.inPoint;
  var pm = o.bottom.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  ELIZA.keys(pm.property("ADBE Mask Shape"), [[bIn, ELIZA.rect(0, 0, W, H)], [o.at, ELIZA.rect(0, o.maskTop, W, H)]], "hold");
  ELIZA.keys(TR(o.bottom).property("ADBE Position"), [[bIn, [cx, H / 2]], [o.at, [cx, H * 0.75]]], "hold");
  ELIZA.keys(TR(o.top).property("ADBE Position"), [[0, [cx, H / 2]], [o.at, [cx, H * 0.25]], [o.end, [cx, H / 2]]], "hold");
  r.divider = comp.layers.addSolid(o.dividerColour, "SplitDivider", W, o.dividerHeight, 1);
  TR(r.divider).property("ADBE Position").setValue([cx, H / 2]); ELIZA.span(r.divider, o.at, o.end);
  ELIZA.glow(r.divider, o.dividerGlow, 30, 100);
  r.topLabel = ELIZA.text(comp, o.topLabel, o.labelSize, [1, 1, 1], [cx, o.labelY[0]], "Label_Top"); ELIZA.span(r.topLabel, o.at, o.end);
  r.bottomLabel = ELIZA.text(comp, o.bottomLabel, o.labelSize, [1, 1, 1], [cx, o.labelY[1]], "Label_Bottom"); ELIZA.span(r.bottomLabel, o.at, o.end);
  ELIZA.glow(r.topLabel, o.labelGlow, 18, 100); ELIZA.glow(r.bottomLabel, o.labelGlow, 18, 100);
  return r;
};
