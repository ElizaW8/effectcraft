// end_card -- closing card: (1) slowed, dimmed, blurred, breathing spiral background,
// (2) big glowing title that eases up in scale and gently pulses, (3) fade to black.
// The three parts are separate functions so a template can interleave other layers between them;
// ELIZA.end_card(comp, opts) adds all three in order. Returns { background, title, fade }.
//
// end_card.background opts: source (path/item/comp, required), start 16.5, end comp.duration,
//    speed 0.35 (playback rate), offset 1 (s into the source), wrap "auto" (source duration - 0.05),
//    fadeIn 0.45, exposure -1.4, blur 6, breathe 0.05 (scale amount, 0 = off), name "EndSpiral_Slow"
// end_card.title opts: text "ELIZA", colour [1,0.42,0.76], size 380, pos [centre, 900/1920 * h],
//    start 17, end comp.duration, fadeIn 0.7, fromScale 82, popDuration 1.2, pulse 0.03, pulsePeriod 5,
//    glows [[[1,0.2,0.65,1], 50, 100], [[0.6,0.1,0.9,1], 160, 80]], font, name "EndCard_<text>"
// end_card.fadeOut opts: start 19.3, end comp.duration, colour [0,0,0], name "FadeOut"
// end_card opts: { background: {...} | null, title: {...}, fade: {...} | null }
ELIZA.end_card = function (comp, opts) {
  opts = opts || {};
  var r = {};
  if (opts.background) r.background = ELIZA.end_card.background(comp, opts.background);
  r.title = ELIZA.end_card.title(comp, opts.title || {});
  if (opts.fade !== null) r.fade = ELIZA.end_card.fadeOut(comp, opts.fade || {});
  return r;
};
ELIZA.end_card.background = function (comp, opts) {
  var o = ELIZA.opts(opts, { source: null, start: 16.5, end: null, speed: 0.35, offset: 1, wrap: "auto", fadeIn: 0.45, exposure: -1.4, blur: 6, breathe: 0.05, name: "EndSpiral_Slow" });
  if (!o.source) throw new Error("end_card.background: opts.source is required");
  var item = ELIZA.item(o.source), P = ELIZA.P;
  var wrap = (o.wrap === "auto") ? Math.round((item.duration - 0.05) * 1000) / 1000 : o.wrap;
  var l = comp.layers.add(item); l.name = o.name;
  l.timeRemapEnabled = true;
  l.property("ADBE Time Remapping").expression = "((time-inPoint)*" + o.speed + " + " + o.offset + ") % " + wrap;
  ELIZA.span(l, o.start, (o.end === null) ? comp.duration : o.end);
  ELIZA.keys(ELIZA.TR(l).property("ADBE Opacity"), [[o.start, 0], [o.start + o.fadeIn, 100]], "linear");
  if (o.exposure) { var ex = ELIZA.eff(l, "Exposure"); P(ex, "Master/Exposure").setValue(o.exposure); }
  if (o.blur) { var gb = ELIZA.eff(l, "Gaussian Blur"); P(gb, "Blurriness").setValue(o.blur); }
  if (o.breathe) ELIZA.breathing_pulse(l, { scale: o.breathe, palette: "none" });
  return l;
};
ELIZA.end_card.title = function (comp, opts) {
  var o = ELIZA.opts(opts, {
    text: "ELIZA", colour: [1, 0.42, 0.76], size: 380, pos: null, start: 17, end: null, fadeIn: 0.7,
    fromScale: 82, popDuration: 1.2, pulse: 0.03, pulsePeriod: 5,
    glows: [[[1, 0.2, 0.65, 1], 50, 100], [[0.6, 0.1, 0.9, 1], 160, 80]], font: ELIZA.FONT, name: null
  });
  var pos = o.pos || [comp.width / 2, Math.round(comp.height * 900 / 1920)];
  var el = ELIZA.text(comp, o.text, o.size, o.colour, pos, o.name || ("EndCard_" + o.text), { font: o.font });
  ELIZA.span(el, o.start, (o.end === null) ? comp.duration : o.end);
  ELIZA.TR(el).property("ADBE Scale").expression = "var s = ease(time, inPoint, inPoint+" + o.popDuration + ", " + o.fromScale + ", 100) * (1+" + o.pulse + "*Math.sin((time-inPoint)*Math.PI*2/" + o.pulsePeriod + ")); [s,s]";
  ELIZA.keys(ELIZA.TR(el).property("ADBE Opacity"), [[o.start, 0], [o.start + o.fadeIn, 100]], "ease", 60);
  for (var i = 0; i < o.glows.length; i++) ELIZA.glow(el, o.glows[i][0], o.glows[i][1], o.glows[i][2]);
  return el;
};
ELIZA.end_card.fadeOut = function (comp, opts) {
  var o = ELIZA.opts(opts, { start: 19.3, end: null, colour: [0, 0, 0], name: "FadeOut" });
  var end = (o.end === null) ? comp.duration : o.end;
  var fo = comp.layers.addSolid(o.colour, o.name, comp.width, comp.height, 1); ELIZA.span(fo, o.start, end);
  ELIZA.keys(ELIZA.TR(fo).property("ADBE Opacity"), [[o.start, 0], [end, 100]], "linear");
  return fo;
};
