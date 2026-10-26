/* The letters, what each handshape looks like in numbers, how we compare a hand to them, and the coaching tips.
   The starting numbers are estimates from how the alphabet is signed. "Teach it your hand" replaces them with real examples from the learner. */
(function (root) {
  var cl = function (x, a, b) { return Math.max(a, Math.min(b, x)); };
  // finger shapes: [knuckle bend, finger curl]
  var E = [0.03, 0.03], FIST = [0.8, 0.95], CURVE = [0.45, 0.5], CLAW = [0.7, 0.8], HOOK = [0.12, 0.6], TIGHT = [0.55, 0.6], OKF = [0.35, 0.55];
  // thumb: [tip bend, across palm, reach]
  var T_OUT = [0.1, 0.06, 1.0], T_SIDE = [0.1, 0.3, 0.65], T_FRONT = [0.35, 0.7, 0.3], T_PALM = [0.3, 0.8, 0.4], T_TUCK = [0.35, 0.5, 0.3], T_CURVE = [0.25, 0.15, 0.75];
  var FAR = 0.8;
  function make(fs, th, touch, sp, o, ow) {
    var a = [];
    fs.forEach(function (f) { a.push(f[0], f[1]); });
    a.push(th[0], th[1], th[2]);
    a.push.apply(a, touch); a.push.apply(a, sp); a.push(o);
    return { f: a, ow: ow || 0 };
  }
  var LETTERS = [
    ['A', 'Fist with your thumb straight up along the side of your index finger.', make([FIST, FIST, FIST, FIST], T_SIDE, [0.45, 0.55, 0.65, FAR], [0, 0, 0], 0)],
    ['B', 'Fingers straight up and together. Fold your thumb across your palm.', make([E, E, E, E], T_PALM, [0.5, 0.45, 0.5, 0.65], [0, 0, 0], 0)],
    ['C', 'Curve all your fingers and your thumb into the shape of a C.', make([CURVE, CURVE, CURVE, CURVE], T_CURVE, [0.5, 0.55, 0.65, FAR], [0.15, 0.1, 0.1], 0.25)],
    ['D', 'Index finger points up. Your other fingers curve in to touch your thumb.', make([E, FIST, FIST, FIST], [0.3, 0.55, 0.45], [0.35, 0.13, 0.25, 0.45], [0, 0, 0], 0)],
    ['E', 'Bend all four fingers down like a claw, with your thumb tucked underneath.', make([CLAW, CLAW, CLAW, CLAW], T_TUCK, [0.3, 0.3, 0.35, 0.5], [0, 0, 0], 0)],
    ['F', 'Touch your thumb and index finger in a circle. The other three fingers stand up and apart.', make([OKF, E, E, E], [0.25, 0.3, 0.45], [0.1, 0.5, 0.6, 0.75], [0.1, 0.15, 0.15], 0)],
    ['G', 'Point your index finger sideways with your thumb alongside it. Other fingers curled.', make([E, FIST, FIST, FIST], [0.1, 0.22, 0.55], [0.4, 0.5, 0.6, 0.75], [0, 0, 0], 0.5, 1)],
    ['H', 'Index and middle fingers point sideways together. Other fingers curled.', make([E, E, FIST, FIST], T_TUCK, [0.5, 0.35, 0.2, 0.4], [0, 0, 0], 0.5, 1)],
    ['I', 'Make a fist and stick your pinky finger up.', make([FIST, FIST, FIST, E], T_FRONT, [0.5, 0.45, 0.55, 0.75], [0, 0, 0], 0)],
    ['K', 'Index and middle fingers up in a V. Your thumb touches the base of your middle finger.', make([E, E, FIST, FIST], [0.1, 0.35, 0.5], [0.4, 0.25, 0.4, 0.5], [0.5, 0, 0], 0)],
    ['L', 'Index finger up and thumb out to the side, making an L.', make([E, FIST, FIST, FIST], T_OUT, [0.55, 0.65, 0.75, 0.85], [0, 0, 0], 0)],
    ['M', 'Fist with your thumb tucked under your first three fingers.', make([FIST, FIST, FIST, FIST], [0.35, 0.75, 0.3], [0.35, 0.3, 0.3, 0.35], [0, 0, 0], 0)],
    ['N', 'Fist with your thumb tucked under your first two fingers.', make([FIST, FIST, FIST, FIST], [0.35, 0.65, 0.3], [0.3, 0.28, 0.4, 0.5], [0, 0, 0], 0)],
    ['O', 'Curve all your fingers to meet your thumb, making an O.', make([TIGHT, TIGHT, TIGHT, TIGHT], [0.3, 0.3, 0.55], [0.12, 0.18, 0.3, 0.45], [0.05, 0.05, 0.05], 0)],
    ['P', 'Like K, but point your fingers down.', make([E, E, FIST, FIST], [0.1, 0.35, 0.5], [0.4, 0.25, 0.4, 0.5], [0.5, 0, 0], 1, 1)],
    ['Q', 'Like G, but point your finger and thumb down.', make([E, FIST, FIST, FIST], [0.1, 0.22, 0.55], [0.4, 0.5, 0.6, 0.75], [0, 0, 0], 1, 1)],
    ['R', 'Cross your middle finger over your index finger, pointing up.', make([E, E, FIST, FIST], T_TUCK, [0.5, 0.35, 0.2, 0.4], [-0.3, 0, 0], 0)],
    ['S', 'Make a fist with your thumb across the front of your fingers.', make([FIST, FIST, FIST, FIST], T_FRONT, [0.35, 0.3, 0.45, 0.65], [0, 0, 0], 0)],
    ['T', 'Fist with your thumb tucked between your index and middle fingers.', make([FIST, FIST, FIST, FIST], [0.3, 0.5, 0.3], [0.25, 0.3, 0.45, 0.6], [0, 0, 0], 0)],
    ['U', 'Index and middle fingers straight up and together.', make([E, E, FIST, FIST], T_TUCK, [0.5, 0.35, 0.2, 0.4], [0.05, 0, 0], 0)],
    ['V', 'Index and middle fingers up and apart, like a peace sign.', make([E, E, FIST, FIST], T_TUCK, [0.5, 0.35, 0.2, 0.4], [0.55, 0, 0], 0)],
    ['W', 'Index, middle and ring fingers up and apart. Your thumb holds your pinky down.', make([E, E, E, FIST], [0.3, 0.7, 0.35], [0.6, 0.45, 0.3, 0.2], [0.45, 0.45, 0], 0)],
    ['X', 'Make a fist, then hook your index finger.', make([HOOK, FIST, FIST, FIST], T_FRONT, [0.35, 0.3, 0.45, 0.65], [0, 0, 0], 0)],
    ['Y', 'Thumb and pinky finger out. The other three fingers curled.', make([FIST, FIST, FIST, E], T_OUT, [0.7, 0.8, 0.85, 0.9], [0, 0, 0], 0)]
  ].map(function (r) { return { ch: r[0], cue: r[1], proto: r[2].f, ow: r[2].ow }; });
  var BY = {}; LETTERS.forEach(function (l) { BY[l.ch] = l; });
  // J and Z are drawn in the air. Version 1 checks only the starting handshape.
  var ALIAS = { J: 'I', Z: 'D' };
  var MOTION = { J: true, Z: true };
  function resolve(ch) { return BY[ALIAS[ch] || ch] || null; }

  var FNAMES = ['index', 'middle', 'ring', 'pinky'];
  // how much each number counts when comparing two handshapes
  function weights(proto, ow) {
    var w = [], i;
    for (i = 0; i < 4; i++) { w.push(1.1, 2.2); }
    w.push(0.8, 0.9, 0.7);                                   // thumb
    w.push(0.8, 0.8, 0.8, 0.8);                              // thumb to fingertips
    var ext = function (k) { return 1 - proto[k * 2 + 1]; };
    w.push(1.2 * ext(0) * ext(1), 1.0 * ext(1) * ext(2), 0.8 * ext(2) * ext(3));   // spreads only matter when both fingers are up
    w.push(0.25 + 1.5 * (ow || 0));                          // direction
    return w;
  }
  // overall closeness = blended average difference + the single biggest difference, so one clearly wrong finger can't hide among many right ones
  function dist(a, b, w) {
    var s = 0, t = 0, mx = 0, i, dv;
    for (i = 0; i < a.length; i++) {
      dv = a[i] - b[i]; s += w[i] * dv * dv; t += w[i];
      var m = Math.sqrt(w[i]) * Math.abs(dv) * ((i >= 8 && i <= 14) ? 0.5 : 1); if (m > mx) mx = m;
    }
    return Math.sqrt(s / t) + 0.25 * mx;
  }
  var WCACHE = {}; function wFor(l) { return WCACHE[l.ch] || (WCACHE[l.ch] = weights(l.proto, l.ow)); }

  // cal: { 'A': [[19 numbers], ...] }  samples the learner recorded
  function classify(feat, cal) {
    var out = LETTERS.map(function (l) {
      var w = wFor(l), d = dist(feat, l.proto, w), src = 'default', s = cal && cal[l.ch];
      if (s && s.length) {
        var ds = s.map(function (x) { return dist(feat, x, w); }).sort(function (p, q) { return p - q; });
        var k = Math.min(3, ds.length), m = 0, i; for (i = 0; i < k; i++) m += ds[i]; m /= k;
        if (m < d) { d = m; src = 'yours'; }
      }
      return { ch: l.ch, d: d, src: src };
    }).sort(function (a, b) { return a.d - b.d; });
    return { best: out[0], second: out[1], ranked: out };
  }
  var ACCEPT = 0.45;     // a hand farther than this from the target never counts
  var TIE = 0.03;        // if the target is nearly as close as the best guess, give the benefit of the doubt
  var LOOKALIKE = { A:1, E:1, M:1, N:1, S:1, T:1, U:1, R:1, K:1, P:1, G:1, Q:1, H:1 };
  function matches(cls, ch) {
    var l = resolve(ch); if (!l) return false;
    var me = null, i; for (i = 0; i < cls.ranked.length; i++) if (cls.ranked[i].ch === l.ch) { me = cls.ranked[i]; break; }
    return !!me && me.d <= ACCEPT && me.d <= cls.best.d + TIE;
  }

  // coaching: compare a hand to a target letter, return the biggest differences in plain words
  function coach(feat, ch) {
    var l = resolve(ch); if (!l) return { hints: [], fingers: [0, 0, 0, 0] };
    var p = l.proto, hints = [], fing = [], i;
    for (i = 0; i < 4; i++) {
      var dt = feat[i * 2 + 1] - p[i * 2 + 1], dk = feat[i * 2] - p[i * 2];
      var off = Math.max(Math.abs(dt), Math.abs(dk) * 0.8);
      fing.push(off);
      if (Math.abs(dt) > 0.28 || Math.abs(dk) > 0.35) hints.push({ w: off, t: dt < 0 || (Math.abs(dt) < 0.28 && dk < 0) ? 'Curl your ' + FNAMES[i] + ' finger more.' : 'Straighten your ' + FNAMES[i] + ' finger.' });
    }
    var thumbOff = Math.abs(feat[9] - p[9]) + Math.abs(feat[10] - p[10]) * 0.6;
    if (thumbOff > 0.3) {
      var acr = feat[9] - p[9];
      hints.push({ w: thumbOff * 0.9, t: Math.abs(acr) > 0.12 ? (acr < 0 ? 'Bring your thumb further across your hand.' : 'Move your thumb out to the side.') : (feat[10] < p[10] ? 'Reach your thumb out a little more.' : 'Tuck your thumb in closer.') });
    }
    var ext = function (k) { return 1 - p[k * 2 + 1]; };
    if (ext(0) * ext(1) > 0.5) {
      var sp = feat[15] - p[15];
      if (p[15] < -0.1 && feat[15] > -0.05) hints.push({ w: 0.6, t: 'Cross your middle finger over your index finger.' });
      else if (sp > 0.3) hints.push({ w: sp, t: 'Bring your index and middle fingers together.' });
      else if (sp < -0.3) hints.push({ w: -sp, t: 'Spread your index and middle fingers apart.' });
    }
    if (ext(1) * ext(2) > 0.5) { var s2 = feat[16] - p[16]; if (s2 < -0.3) hints.push({ w: -s2, t: 'Spread your middle and ring fingers apart.' }); else if (s2 > 0.3) hints.push({ w: s2, t: 'Bring your middle and ring fingers together.' }); }
    if (l.ow >= 0.5) {
      var od = feat[18] - p[18];
      if (Math.abs(od) > 0.22) hints.push({ w: Math.abs(od) * 1.2, t: p[18] > 0.75 ? 'Point your hand down.' : p[18] > 0.3 ? (od < 0 ? 'Turn your hand more sideways.' : 'Lift your hand up a bit.') : 'Hold your hand upright.' });
    }
    hints.sort(function (a, b) { return b.w - a.w; });
    return { hints: hints.slice(0, 2).map(function (h) { return h.t; }), fingers: fing };
  }
  var api = { LETTERS: LETTERS, BY: BY, ALIAS: ALIAS, MOTION: MOTION, resolve: resolve, classify: classify, coach: coach, dist: dist, wFor: wFor, ACCEPT: ACCEPT, TIE: TIE, matches: matches, LOOKALIKE: LOOKALIKE, FNAMES: FNAMES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ASLLetters = api;
})(typeof window !== 'undefined' ? window : this);
