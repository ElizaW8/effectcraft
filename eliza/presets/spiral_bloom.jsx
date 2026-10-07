// spiral_bloom -- the spiral "blooms" open from the centre: a feathered circular mask grows from a
// dot to past the frame corners. Footage sources loop forever via a loopOut('cycle') time remap.
// Returns the layer.
//
// opts:
//   source "procedural"  a footage path ("@eliza/..." allowed), an imported item, a CompItem,
//                        or "procedural" (builds ELIZA.spiral_procedural(opts.procedural) sized to comp)
//   procedural {}        options passed to spiral_procedural when source == "procedural"
//   name "SpiralLoop", start 0, end comp.duration
//   loop true            time-remap loopOut('cycle') for footage (ignored for comps)
//   bloomStart 0.15      seconds (comp time) the bloom begins
//   bloomDuration 2.45   seconds to fully open
//   center null          [x, y], default comp centre
//   startRadius 4, endRadius "auto" (0.65625 * longest side = 1260 on 1080x1920), feather 170, easeInfluence 75
ELIZA.spiral_bloom = function (comp, opts) {
  var o = ELIZA.opts(opts, {
    source: "procedural", procedural: {}, name: "SpiralLoop", start: 0, end: null, loop: true,
    bloomStart: 0.15, bloomDuration: 2.45, center: null, startRadius: 4, endRadius: "auto",
    feather: 170, easeInfluence: 75
  });
  var src = o.source;
  if (src === "procedural") src = ELIZA.spiral_procedural(ELIZA.opts(o.procedural, { width: comp.width, height: comp.height, duration: comp.duration, fps: ELIZA.fps(comp) }));
  var item = ELIZA.item(src);
  var l = comp.layers.add(item); l.name = o.name;
  if (o.loop && !(item instanceof CompItem)) {
    l.timeRemapEnabled = true;
    l.property("ADBE Time Remapping").expression = "loopOut('cycle')";
  }
  ELIZA.span(l, o.start, (o.end === null) ? comp.duration : o.end);
  var c = o.center || [comp.width / 2, comp.height / 2];
  var r1 = (o.endRadius === "auto") ? Math.round(Math.max(comp.width, comp.height) * 0.65625) : o.endRadius;
  var mk = l.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
  mk.name = "Bloom";
  ELIZA.keys(mk.property("ADBE Mask Shape"),
    [[o.bloomStart, ELIZA.circle(c[0], c[1], o.startRadius)], [o.bloomStart + o.bloomDuration, ELIZA.circle(c[0], c[1], r1)]],
    "ease", o.easeInfluence);
  mk.property("ADBE Mask Feather").setValue([o.feather, o.feather]);
  return l;
};
