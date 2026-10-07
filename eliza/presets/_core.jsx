// Eliza adaptation layer for EffectCraft -- core helpers.
// Plain ES5 using EffectCraft's After Effects-style object model (app.project, layers, properties).
// EffectCraft has no #include / $.evalFile, so eliza/tools/ecbuild.py inlines the
// `//@include` lines of a template into one bundle before running it. Every preset file
// only *defines* functions on the global ELIZA object; nothing runs until a template calls it.

var ELIZA = (typeof ELIZA !== "undefined") ? ELIZA : {};
ELIZA.version = "0.1.0";
ELIZA.root = (typeof ELIZA_ROOT !== "undefined") ? ELIZA_ROOT : "";

ELIZA.log = function (s) { writeLn(String(s)); };

// Shallow-merge user options over defaults (undefined values are ignored).
ELIZA.opts = function (o, d) {
  var r = {}, k;
  for (k in d) r[k] = d[k];
  if (o) for (k in o) if (o[k] !== undefined) r[k] = o[k];
  return r;
};

// Template parameters: ELIZA_PARAMS is injected by ecbuild.py (--params / --set).
ELIZA.params = function (defaults) {
  return ELIZA.opts((typeof ELIZA_PARAMS !== "undefined") ? ELIZA_PARAMS : {}, defaults);
};

// Resolve "@eliza/..." to the eliza/ folder this bundle was built from.
ELIZA.path = function (p) {
  if (typeof p === "string" && p.indexOf("@eliza/") === 0) return ELIZA.root + "/" + p.substring(7);
  return p;
};

// Import a file once (cached by path). Accepts a path string or an existing item.
ELIZA._items = {};
ELIZA.item = function (src) {
  if (src === null || src === undefined) return null;
  if (typeof src !== "string") return src;
  var p = ELIZA.path(src);
  if (!ELIZA._items[p]) ELIZA._items[p] = app.project.importFile(new ImportOptions(new File(p)));
  return ELIZA._items[p];
};

ELIZA.TR = function (l) { return l.property("ADBE Transform Group"); };
ELIZA.FX = function (l) { return l.property("ADBE Effect Parade"); };
ELIZA.eff = function (l, name) { return ELIZA.FX(l).addProperty(name); };

// Find an effect parameter by (partial, case-insensitive) display name.
// Nested groups use a slash, e.g. "Master/Exposure".
ELIZA.P = function (e, nm) {
  var i;
  if (nm.indexOf("/") > 0) { var parts = nm.split("/"), cur = e; for (var q = 0; q < parts.length; q++) cur = ELIZA.P(cur, parts[q]); return cur; }
  for (i = 1; i <= e.numProperties; i++) { if (e.property(i).name.toLowerCase() == nm.toLowerCase()) return e.property(i); }
  for (i = 1; i <= e.numProperties; i++) { if (e.property(i).name.toLowerCase().indexOf(nm.toLowerCase()) >= 0) return e.property(i); }
  var names = []; for (i = 1; i <= e.numProperties; i++) names.push(e.property(i).name);
  throw new Error("no param '" + nm + "' in " + e.name + ": " + names.join(", "));
};

ELIZA.easeKeys = function (prop, infl) {
  for (var k = 1; k <= prop.numKeys; k++) {
    var done = false;
    for (var d = 1; d <= 3 && !done; d++) {
      try { var a = []; for (var j = 0; j < d; j++) a.push(new KeyframeEase(0, infl || 60)); prop.setTemporalEaseAtKey(k, a, a); done = true; } catch (err) {}
    }
    if (!done) ELIZA.log("WARN ease failed on " + prop.name);
  }
};

// keys(prop, [[t, v], ...], "ease" | "linear" | "hold", influence)
ELIZA.keys = function (prop, arr, mode, infl) {
  for (var i = 0; i < arr.length; i++) prop.setValueAtTime(arr[i][0], arr[i][1]);
  if (mode == "ease") ELIZA.easeKeys(prop, infl);
  if (mode == "linear" || mode == "hold") for (var k = 1; k <= prop.numKeys; k++) {
    var it = mode == "hold" ? KeyframeInterpolationType.HOLD : KeyframeInterpolationType.LINEAR;
    prop.setInterpolationTypeAtKey(k, it, it);
  }
};

ELIZA.span = function (l, a, b) { l.inPoint = a; l.outPoint = b; };

ELIZA.circle = function (cx, cy, r) {
  var k = 0.5523 * r, s = new Shape();
  s.vertices = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
  s.inTangents = [[-k, 0], [0, -k], [k, 0], [0, k]];
  s.outTangents = [[k, 0], [0, k], [-k, 0], [0, -k]];
  s.closed = true; return s;
};
ELIZA.rect = function (x0, y0, x1, y1) {
  var s = new Shape(); s.vertices = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  s.inTangents = [[0, 0], [0, 0], [0, 0], [0, 0]]; s.outTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
  s.closed = true; return s;
};

// Soft glow = Drop Shadow with distance 0 (cheap, native). Stack two for a 2-layer glow.
ELIZA.glow = function (l, col, soft, op) {
  var d = ELIZA.eff(l, "Drop Shadow");
  ELIZA.P(d, "Shadow Color").setValue(col); ELIZA.P(d, "Opacity").setValue(op);
  ELIZA.P(d, "Distance").setValue(0); ELIZA.P(d, "Softness").setValue(soft);
  return d;
};

ELIZA.FONT = "BebasNeue-Regular";   // Bebas Neue (SIL OFL 1.1) -- see eliza/fonts/

// Centred text layer; anchor follows the glyph box so scale pops happen around the word centre.
ELIZA.text = function (comp, str, size, fill, pos, name, o) {
  o = o || {};
  var t = comp.layers.addText(str);
  t.name = name || str;
  var sp = t.property("ADBE Text Properties").property("ADBE Text Document");
  var td = sp.value; td.text = str; td.font = o.font || ELIZA.FONT; td.fontSize = size; td.fillColor = fill;
  td.applyStroke = false; td.justification = ParagraphJustification.CENTER_JUSTIFY;
  td.tracking = (o.tracking === undefined) ? 40 : o.tracking;
  sp.setValue(td);
  ELIZA.TR(t).property("ADBE Anchor Point").expression = "var r=sourceRectAtTime(time,false); [r.left+r.width/2, r.top+r.height/2]";
  ELIZA.TR(t).property("ADBE Position").setValue(pos);
  return t;
};

// Add an item / comp / path as a layer with an optional time span.
ELIZA.place = function (comp, src, o) {
  o = o || {};
  var l = comp.layers.add(ELIZA.item(src));
  if (o.name) l.name = o.name;
  if (o.start !== undefined || o.end !== undefined) ELIZA.span(l, o.start || 0, (o.end === undefined) ? comp.duration : o.end);
  return l;
};

ELIZA.fps = function (comp) { return comp.frameRate || 30; };

// Colour themes for the procedural spiral (Tritone highlights / midtones / shadows + background).
ELIZA.themes = {
  pink:   { highlights: [1, 0.86, 0.96, 1], midtones: [1, 0.22, 0.68, 1], shadows: [0.32, 0.04, 0.48, 1], bg: [0.09, 0.0, 0.14] },
  purple: { highlights: [0.93, 0.85, 1, 1], midtones: [0.62, 0.22, 1, 1], shadows: [0.16, 0.03, 0.36, 1], bg: [0.05, 0.0, 0.12] },
  cyan:   { highlights: [0.85, 1, 1, 1],    midtones: [0.15, 0.85, 1, 1], shadows: [0.02, 0.12, 0.32, 1], bg: [0.0, 0.03, 0.09] },
  mono:   { highlights: [1, 1, 1, 1],       midtones: [0.55, 0.55, 0.55, 1], shadows: [0.05, 0.05, 0.05, 1], bg: [0.0, 0.0, 0.0] }
};
ELIZA.theme = function (t) {
  if (typeof t === "string") { if (!ELIZA.themes[t]) throw new Error("unknown theme '" + t + "' (pink, purple, cyan, mono or an object)"); return ELIZA.themes[t]; }
  return ELIZA.opts(t, ELIZA.themes.pink);
};
