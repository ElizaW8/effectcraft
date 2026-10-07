// breathing_pulse -- slow breathing rhythm on a layer: ease-in "inhale" then longer "exhale"
// (default 4 s in / 6 s out). Drives scale, optional brightness (Exposure) and a hue drift
// (purple by default, or a full rainbow cycle). All expressions, so it is free and loops forever.
//
// opts:
//   inSec 4, outSec 6, offset 0 (seconds added to time)
//   scale 0.07          extra scale at full breath (0.07 = +7 %)
//   exposure null       [base, amount] e.g. [-0.3, 0.45]: Exposure goes base -> base+amount
//   palette "purple"    "purple" (hue drifts by `hue` deg at full breath), "rainbow" (hue turns 360 deg
//                       per breath), or "none"
//   hue -22, saturation 12 (added at full breath)
//   intensity 1         multiplier for scale, exposure amount, hue and saturation
ELIZA.breathExpr = function (inSec, outSec, offset) {
  var c = inSec + outSec;
  return "var c=" + c + ", tt=(time+" + (offset || 0) + ")%c; var p = tt<" + inSec +
    " ? (1-Math.cos(Math.PI*tt/" + inSec + "))/2 : (1+Math.cos(Math.PI*(tt-" + inSec + ")/" + outSec + "))/2;";
};
ELIZA.breathing_pulse = function (layer, opts) {
  var o = ELIZA.opts(opts, { inSec: 4, outSec: 6, offset: 0, scale: 0.07, exposure: null, palette: "purple", hue: -22, saturation: 12, intensity: 1 });
  var B = ELIZA.breathExpr(o.inSec, o.outSec, o.offset), k = o.intensity, P = ELIZA.P;
  ELIZA.TR(layer).property("ADBE Scale").expression = B + " var s=value[0]*(1+" + (o.scale * k) + "*p); [s,s]";
  if (o.exposure) {
    var e = ELIZA.eff(layer, "Exposure");
    P(e, "Master/Exposure").expression = B + " " + o.exposure[0] + "+" + (o.exposure[1] * k) + "*p";
  }
  if (o.palette && o.palette != "none") {
    var h = ELIZA.eff(layer, "Hue/Saturation");
    if (o.palette == "rainbow") P(h, "Master Hue").expression = B + " ((time+" + (o.offset || 0) + ")%c)/c*360";
    else P(h, "Master Hue").expression = B + " " + (o.hue * k) + "*p";
    P(h, "Master Saturation").expression = B + " " + (o.saturation * k) + "*p";
  }
  return layer;
};
