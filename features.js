/* Turns 21 hand landmarks into a small set of numbers that describe the handshape.
   Everything is measured relative to the hand's own size, so distance from the camera doesn't matter. */
(function (root) {
  var FINGERS = [5, 9, 13, 17];            // index, middle, ring, pinky knuckle (MCP) landmark numbers
  var TIPS = [8, 12, 16, 20];
  function v(a, b) { return [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function cl(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function angDeg(a, b, c) {                // angle at b, in degrees
    var u = v(b, a), w = v(b, c), d = len(u) * len(w); if (d < 1e-9) return 180;
    return Math.acos(cl(dot(u, w) / d, -1, 1)) * 180 / Math.PI;
  }
  function between(a, b) { var d = len(a) * len(b); if (d < 1e-9) return 0; return Math.acos(cl(dot(a, b) / d, -1, 1)) * 180 / Math.PI; }

  // Feature order (19 numbers):
  // 0-7   for index, middle, ring, pinky: [knuckle bend, finger curl]      0 = straight, 1 = fully curled
  // 8     thumb tip bend
  // 9     how far the thumb reaches across the palm (0 out to the side, 1 across to the pinky side)
  // 10    how far the thumb tip is from the index knuckle
  // 11-14 distance from thumb tip to each fingertip (small = touching)
  // 15-17 spread between index-middle (negative = crossed), middle-ring, ring-pinky
  // 18    hand direction: 0 pointing up, 0.5 sideways, 1 pointing down
  var NAMES = ['index', 'middle', 'ring', 'pinky'];
  function extract(lm, W, H) {
    if (!lm || lm.length < 21) return null;
    var p = lm.map(function (q) { return [q.x * W, q.y * H, (q.z || 0) * W]; });
    var palm = len(v(p[0], p[9])); if (palm < 1e-6) return null;
    var f = [], i;
    for (i = 0; i < 4; i++) {
      var b = FINGERS[i];
      var pip = 180 - angDeg(p[b], p[b + 1], p[b + 2]), dip = 180 - angDeg(p[b + 1], p[b + 2], p[b + 3]);
      var kb = 180 - angDeg(p[0], p[b], p[b + 1]);
      f.push(cl(kb / 90, 0, 1));
      f.push(cl((pip / 100) * 0.65 + (dip / 70) * 0.35, 0, 1));
    }
    f.push(cl((180 - angDeg(p[2], p[3], p[4])) / 70, 0, 1));
    var span = v(p[5], p[17]), sw = len(span) || 1, tx = dot(v(p[5], p[4]), span) / sw / sw;
    f.push(cl((tx + 0.6) / 1.8, 0, 1));
    f.push(cl(len(v(p[5], p[4])) / palm / 1.4, 0, 1));
    for (i = 0; i < 4; i++) f.push(cl(len(v(p[4], p[TIPS[i]])) / palm / 1.5, 0, 1));
    var dir = FINGERS.map(function (b, k) { return v(p[b], p[TIPS[k]]); });
    var n = cross(v(p[0], p[5]), v(p[0], p[17]));
    var sgn = dot(cross(dir[0], dir[1]), n) >= 0 ? 1 : -1;
    f.push(cl(sgn * between(dir[0], dir[1]) / 40, -1, 1));
    f.push(cl(between(dir[1], dir[2]) / 40, 0, 1));
    f.push(cl(between(dir[2], dir[3]) / 40, 0, 1));
    var vx = p[9][0] - p[0][0], vy = p[9][1] - p[0][1];
    f.push(Math.atan2(Math.abs(vx), -vy) / Math.PI);
    return f;
  }
  var api = { extract: extract, NAMES: NAMES, cl: cl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ASLFeatures = api;
})(typeof window !== 'undefined' ? window : this);
