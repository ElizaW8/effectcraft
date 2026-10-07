// text_drift -- staggered lines of text that fade in, drift down slowly and fade out, with a soft glow.
// Returns the array of text layers.
//
// opts:
//   lines [["look at the centre", -60, 220], ...]   each line: [text, xOffsetFromCentre, y]
//   start 1.0, interval 1.4 (stagger), hold 3.0 (life of each line), drift 110 (px moved down)
//   fadeIn 0.4, fadeOutAt 2.0 (seconds into the line's life when the fade out starts), easeInfluence 50
//   size 104, fill [1,0.93,0.98], font "BebasNeue-Regular", tracking 40
//   glow [1,0.25,0.7,1], glowSoftness 26, glowOpacity 95, namePrefix "Line_"
ELIZA.text_drift = function (comp, opts) {
  var o = ELIZA.opts(opts, {
    lines: [["look at the centre", -60, 220], ["breathe out", 150, 420], ["slower", -140, 620], ["good", 170, 300]],
    start: 1.0, interval: 1.4, hold: 3.0, drift: 110, fadeIn: 0.4, fadeOutAt: 2.0, easeInfluence: 50,
    size: 104, fill: [1, 0.93, 0.98], font: ELIZA.FONT, tracking: 40,
    glow: [1, 0.25, 0.7, 1], glowSoftness: 26, glowOpacity: 95, namePrefix: "Line_"
  });
  var out = [], cx = comp.width / 2, TR = ELIZA.TR;
  for (var i = 0; i < o.lines.length; i++) {
    var L = o.lines[i], t0 = o.start + o.interval * i, x = cx + (L[1] || 0), y = L[2];
    var tl = ELIZA.text(comp, L[0], o.size, o.fill, [x, y], o.namePrefix + (i + 1), { font: o.font, tracking: o.tracking });
    ELIZA.span(tl, t0, t0 + o.hold);
    ELIZA.keys(TR(tl).property("ADBE Position"), [[t0, [x, y]], [t0 + o.hold, [x, y + o.drift]]], "linear");
    ELIZA.keys(TR(tl).property("ADBE Opacity"), [[t0, 0], [t0 + o.fadeIn, 100], [t0 + o.fadeOutAt, 100], [t0 + o.hold, 0]], "ease", o.easeInfluence);
    ELIZA.glow(tl, o.glow, o.glowSoftness, o.glowOpacity);
    out.push(tl);
  }
  return out;
};
