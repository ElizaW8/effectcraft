// spiral_procedural -- native EffectCraft spiral built in its own precomp:
//   Gradient Ramp -> Venetian Blinds (diagonal stripes) -> Polar Coordinates (rect->polar)
//   -> Twirl (expression wobble) -> Tritone grade, layer rotated by expression, CC Vignette on top,
//   optional clear centre (feathered background-coloured disk) so arms only show mid-to-outer frame.
// Returns the precomp (CompItem). Put it in a comp with ELIZA.place() or use it as spiral_bloom source.
//
// opts (defaults reproduce the show-off clip's "ProcSpiral"):
//   name "ProcSpiral", width 1080, height 1920, duration 20, fps 30
//   theme "pink" | "purple" | "cyan" | "mono" | {highlights, midtones, shadows, bg}
//   speed -150        rotation in degrees/second (negative = clockwise)
//   arms 16           number of spiral arms (stripe width is derived so the polar seam is invisible)
//   twist 45          stripe slant in degrees: 0 = straight spokes, 45 = classic spiral, 70+ = tight coil
//   wobble 35         animated Twirl angle amplitude (degrees); wobbleFreq 1.1 (rad/s); twirlRadius 55
//   size 2200         square source size in px (must cover the frame diagonal)
//   gradient [0.42,1] ramp start / end grey (arm contrast); stripeFeather 16; completion 50
//   clearCentre 0     radius in px of the clear centre (0 = off); clearFeather (default = 0.8 * radius)
//   vignette true; prefix "PS" (layer-name prefix inside the precomp)
//   loop 0            seconds; >0 snaps speed and wobble so the precomp loops seamlessly every `loop` s
ELIZA.spiral_procedural = function (opts) {
  var o = ELIZA.opts(opts, {
    name: "ProcSpiral", width: 1080, height: 1920, duration: 20, fps: 30,
    theme: "pink", speed: -150, arms: 16, twist: 45, wobble: 35, wobbleFreq: 1.1, twirlRadius: 55,
    size: 2200, gradient: [0.42, 1], stripeFeather: 16, completion: 50,
    clearCentre: 0, clearFeather: null, vignette: true, loop: 0, prefix: "PS"
  });
  var th = ELIZA.theme(o.theme), P = ELIZA.P, eff = ELIZA.eff;
  if (o.twist < 0 || o.twist > 80) throw new Error("spiral_procedural: twist must be 0..80 degrees");
  var S = o.size, half = S / 2;
  var pc = app.project.items.addComp(o.name, o.width, o.height, 1, o.duration, o.fps);
  pc.layers.addSolid(th.bg, o.prefix + "_BG", o.width, o.height, 1);
  var ps = pc.layers.addSolid([0.5, 0.5, 0.5], o.prefix + "_Spiral", S, S, 1);

  var gr = eff(ps, "Gradient Ramp");
  P(gr, "Start of Ramp").setValue([half, 0]); P(gr, "Start Color").setValue([o.gradient[0], o.gradient[0], o.gradient[0], 1]);
  P(gr, "End of Ramp").setValue([half, S]); P(gr, "End Color").setValue([o.gradient[1], o.gradient[1], o.gradient[1], 1]);

  // Venetian Blinds: d = x*cos(dir) + y*sin(dir) mod width, so the horizontal period is width/cos(dir).
  // An integer number of periods across the source width (= arms) makes the polar wrap seamless.
  var width = S * Math.cos(o.twist * Math.PI / 180) / o.arms;
  var vb = eff(ps, "Venetian Blinds");
  P(vb, "Completion").setValue(o.completion); P(vb, "Direction").setValue(o.twist);
  P(vb, "Width").setValue(Math.round(width * 10000) / 10000); P(vb, "Feather").setValue(o.stripeFeather);

  var pol = eff(ps, "Polar Coordinates");
  P(pol, "Interpolation").setValue(100); P(pol, "Type of Conversion").setValue(2);   // Rect to Polar

  var speed = o.speed, wob = "time*" + o.wobbleFreq;
  if (o.loop > 0) {
    var step = 360 / o.arms, n = Math.max(1, Math.round(Math.abs(o.speed) * o.loop / step));
    speed = (o.speed < 0 ? -1 : 1) * n * step / o.loop;
    var cyc = Math.max(1, Math.round(o.wobbleFreq * o.loop / (2 * Math.PI)));
    wob = "time*2*Math.PI*" + cyc + "/" + o.loop;
  }
  var tw = eff(ps, "Twirl");
  P(tw, "Twirl Radius").setValue(o.twirlRadius); P(tw, "Angle").expression = o.wobble + "*Math.sin(" + wob + ")";

  var tri = eff(ps, "Tritone");
  P(tri, "Highlights").setValue(th.highlights); P(tri, "Midtones").setValue(th.midtones); P(tri, "Shadows").setValue(th.shadows);
  ELIZA.TR(ps).property("ADBE Rotate Z").expression = "time*" + speed;

  if (o.clearCentre > 0) {
    var cc = pc.layers.addSolid(th.bg, o.prefix + "_ClearCentre", o.width, o.height, 1);
    var m = cc.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
    m.property("ADBE Mask Shape").setValue(ELIZA.circle(o.width / 2, o.height / 2, o.clearCentre));
    var f = (o.clearFeather === null) ? o.clearCentre * 0.8 : o.clearFeather;
    m.property("ADBE Mask Feather").setValue([f, f]);
  }
  if (o.vignette) {
    var vig = pc.layers.addSolid([0, 0, 0], o.prefix + "_Vignette", o.width, o.height, 1);
    vig.adjustmentLayer = true; eff(vig, "CC Vignette");
  }
  ELIZA.log("spiral_procedural " + o.name + ": arms " + o.arms + ", twist " + o.twist + ", speed " + speed + " deg/s");
  return pc;
};
