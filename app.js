(function () {
"use strict";
var F = window.ASLFeatures, L = window.ASLLetters;
var $ = function (s, r) { return (r || document).querySelector(s); };
function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
var store = {
  get: function (k, d) { try { var v = localStorage.getItem("hs_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem("hs_" + k, JSON.stringify(v)); } catch (e) {} }
};
var LETTERS = L.LETTERS.map(function (l) { return l.ch; }).concat(["J", "Z"]).sort();
var HOLD_MS = 700, GRACE_MS = 220, SAMPLES = 14, MAXS = 30;

/* ---------- saved data ---------- */
function cleanCal(o) {
  var out = {}; if (!o || typeof o !== "object") return out;
  LETTERS.forEach(function (ch) {
    var a = o[ch]; if (!Array.isArray(a)) return;
    a = a.filter(function (s) { return Array.isArray(s) && s.length === 19 && s.every(function (x) { return typeof x === "number" && isFinite(x); }); }).slice(-MAXS);
    if (a.length) out[ch] = a;
  }); return out;
}
var cal = cleanCal(store.get("cal", {}));
var prog = (function () {
  var p = store.get("prog", {}); var learned = {}, res = [];
  if (p && p.learned) LETTERS.forEach(function (ch) { if (p.learned[ch]) learned[ch] = 1; });
  if (p && Array.isArray(p.results)) res = p.results.filter(function (r) { return r && typeof r.ts === "number" && (r.mode === "quiz" || r.mode === "spell"); }).slice(-200);
  return { learned: learned, results: res };
})();
var demo = false;
function saveAll() { if (demo) return; store.set("cal", cal); store.set("prog", prog); }

/* ---------- camera + hand tracking ---------- */
var video = $("#cam"), cvs = $("#ov"), ctx = cvs.getContext("2d");
var hands = null, running = false, stream = null, busyFrame = false, paused = false;
var ring = [], cur = null, lastSeen = 0, vw = 640, vh = 480, mode = "learn";
function setLive(nodes) { var b = $("#live"); clear(b); nodes.forEach(function (n) { b.appendChild(typeof n === "string" ? el("span", "muted", n) : n); }); }
function camError(e) {
  var n = e && e.name, msg = "I couldn't start the camera.";
  if (n === "NotAllowedError" || n === "SecurityError") msg = "The camera is blocked. Allow camera access for this site in your browser settings, then try again.";
  else if (n === "NotFoundError" || n === "OverconstrainedError") msg = "I couldn't find a camera on this device.";
  else if (n === "NotReadableError") msg = "Another app is using the camera. Close it and try again.";
  else if (!navigator.mediaDevices) msg = "This page needs https (or localhost) to use the camera.";
  var d = el("div", "err", msg); clear($("#live")); $("#live").appendChild(d); $("#camintro").hidden = false; $("#cam-start").textContent = "Try again";
}
async function startCamera() {
  $("#cam-start").disabled = true;
  try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) { beep.a = beep.a || new AC(); if (beep.a.resume) beep.a.resume(); } } catch (e) {}
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw { name: "SecurityError" };
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
  } catch (e) { $("#cam-start").disabled = false; camError(e); return; }
  video.srcObject = stream; try { await video.play(); } catch (e) {}
  $("#camintro").hidden = true; $("#cam-stop").hidden = false; setLive(["Loading the hand tracker. The first time takes a few seconds."]);
  try {
    if (!window.Hands) throw new Error("tracker missing");
    if (!hands) {
      hands = new window.Hands({ locateFile: function (f) { return "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/" + f; } });
      hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5, selfieMode: false });
      hands.onResults(function (r) { onResults(r); });
      await hands.initialize();
    }
  } catch (e) { stopCamera(); var d = el("div", "err", "The hand tracker didn't load. Check your connection and reload the page."); clear($("#live")); $("#live").appendChild(d); $("#camintro").hidden = false; $("#cam-start").disabled = false; return; }
  $("#cam-start").disabled = false; running = true; setLive(["Hold up one hand so I can see it."]); dogSay("I can see you! Hold up a hand."); loop();
}
function stopCamera() {
  running = false; if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
  video.srcObject = null; ctx.clearRect(0, 0, cvs.width, cvs.height); $("#cam-stop").hidden = true; $("#camintro").hidden = false; cur = null; ring = [];
  setLive(["Camera is off."]); dogSay("Folding my feathers. Turn the camera on when you're ready."); stopRuns();
}
async function loop() {
  if (!running) return;
  if (video.readyState >= 2 && !busyFrame && !paused) {
    busyFrame = true; vw = video.videoWidth || 640; vh = video.videoHeight || 480;
    try { await hands.send({ image: video }); } catch (e) {}
    busyFrame = false;
  }
  requestAnimationFrame(loop);
}
var CONN = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
function fingerOf(i) { return i <= 4 ? -1 : Math.floor((i - 5) / 4); }
function draw(lm, off) {
  if (cvs.width !== vw || cvs.height !== vh) { cvs.width = vw; cvs.height = vh; }
  ctx.clearRect(0, 0, cvs.width, cvs.height); if (!lm) return;
  ctx.lineCap = "round"; ctx.lineWidth = Math.max(4, vw / 110);
  CONN.forEach(function (c) {
    var f = fingerOf(Math.max(c[0], c[1])), bad = off && f >= 0 && off[f] > 0.3;
    ctx.strokeStyle = off ? (f < 0 ? "#ffffff" : bad ? "#FFB703" : "#4ADE80") : "#ffffff";
    ctx.beginPath(); ctx.moveTo(lm[c[0]].x * vw, lm[c[0]].y * vh); ctx.lineTo(lm[c[1]].x * vw, lm[c[1]].y * vh); ctx.stroke();
  });
  ctx.fillStyle = "#B4472F"; lm.forEach(function (p) { ctx.beginPath(); ctx.arc(p.x * vw, p.y * vh, Math.max(4, vw / 150), 0, 6.3); ctx.fill(); });
}
function onResults(res, synthetic) {
  var lm = res && res.multiHandLandmarks && res.multiHandLandmarks[0], now = performance.now();
  if (!lm) {
    if (now - lastSeen > 400) { ring = []; cur = null; }
    draw(null); tick(null, now); return;
  }
  lastSeen = now;
  var f = F.extract(lm, vw, vh); if (!f) { draw(lm); tick(null, now); return; }
  ring.push(f); if (ring.length > 4) ring.shift();
  var sm = f.map(function (_, i) { var s = 0; ring.forEach(function (r) { s += r[i]; }); return s / ring.length; });
  var cls = L.classify(sm, cal);
  cur = { feat: sm, cls: cls, lm: lm };
  tick(cur, now);
}
window.__feed = function (lm) { onResults({ multiHandLandmarks: lm ? [lm] : [] }, true); };

/* ---------- holding a sign ---------- */
function Holder() { this.t0 = 0; this.last = 0; }
Holder.prototype.update = function (ok, now) {
  if (ok) { if (!this.t0) this.t0 = now; this.last = now; }
  else if (this.t0 && now - this.last > GRACE_MS) this.t0 = 0;
  return this.t0 ? Math.min(1, (now - this.t0) / HOLD_MS) : 0;
};
Holder.prototype.reset = function () { this.t0 = 0; this.last = 0; };
function beep(ok) {
  try { var C = window.AudioContext || window.webkitAudioContext; if (!C) return; var a = beep.a || (beep.a = new C()), o = a.createOscillator(), g = a.createGain();
    o.frequency.value = ok ? 880 : 300; g.gain.value = 0.08; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + (ok ? 0.12 : 0.18)); } catch (e) {}
}
function dogSay(t, hop) { var b = $("#dogsay"); if (b && t) b.textContent = t; if (hop) { var d = $("#dog"); d.classList.remove("hop"); void d.getBoundingClientRect(); d.classList.add("hop"); } }
var CHEERS = ["Yes! That's the one!", "Look at you go!", "Nailed it!", "Ooh, nice hand!", "That one was great!"];
function confetti() {
  var st = $("#stage"), cols = ["#B4472F", "#F2C200", "#0B6B35", "#2B63C9", "#7A3FB5"], i;
  for (i = 0; i < 16; i++) {
    var c = document.createElement("i"); c.className = "conf"; c.style.left = (20 + Math.random() * 60) + "%"; c.style.top = "55%"; c.style.background = cols[i % cols.length];
    c.style.setProperty("--dx", (Math.random() * 160 - 80) + "px"); c.style.setProperty("--dy", (-60 - Math.random() * 120) + "px"); c.style.setProperty("--rot", (Math.random() * 540 - 270) + "deg");
    st.appendChild(c); (function (n) { setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1100); })(c);
  }
}
function flash(text) { confetti(); dogSay(CHEERS[Math.floor(Math.random() * CHEERS.length)], true); var f = $("#flash"); f.textContent = text || "Got it!"; f.classList.add("on"); setTimeout(function () { f.classList.remove("on"); }, 650); }
function setPrompt(ch, sub) {
  var p = $("#prompt"); if (!ch) { p.hidden = true; $("#holdbar").hidden = true; return; }
  p.hidden = false; clear(p); p.appendChild(document.createTextNode(ch)); if (sub) p.appendChild(el("small", null, sub)); $("#holdbar").hidden = false;
}
function setHold(x) { $("#holdfill").style.width = Math.round(x * 100) + "%"; }

/* shared judge: is the hand showing this letter right now, and what should it fix? */
function judge(ch, c) {
  if (!c) return { ok: false, none: true, hints: [], off: null };
  var ok = L.matches(c.cls, ch), co = L.coach(c.feat, ch);
  return { ok: ok, hints: co.hints, off: co.fingers, best: c.cls.best };
}
function liveFor(ch, j) {
  if (j.none) return setLive(["Hold up one hand so I can see it."]);
  if (j.ok) return setLive([chip("Yes! That looks like " + ch + ". Hold it.", "hint ok")]);
  var nodes = []; if (j.hints.length) j.hints.forEach(function (h) { nodes.push(chip(h, "hint")); }); else nodes.push(chip("Close. Look at the picture and adjust a little.", "hint"));
  setLive(nodes);
}
function chip(t, cls) { return el("span", cls, t); }

/* ---------- tabs ---------- */
var TABS = ["learn", "quiz", "spell", "me"];
var TIPS = { learn: "Pick a letter and show me your hand!", quiz: "Ready? Ten letters, ten seconds each. You've got this.", spell: "Type your name and let's spell it!", me: "Look how far you've come!" };
function showTab(name, user) {
  mode = name; TABS.forEach(function (t) { var s = t === name; $("#t-" + t).setAttribute("aria-selected", s ? "true" : "false"); $("#p-" + t).hidden = !s; });
  Array.prototype.forEach.call(document.querySelectorAll(".bb[data-go]"), function (b) { if (b.getAttribute("data-go") === name) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  dogSay(TIPS[name]); stopRuns(); if (name === "learn") renderLearn(); if (name === "quiz") renderQuiz(); if (name === "me") { renderProg(); renderTeach(); } if (name === "spell") renderSpellIdle();
  if (user) { try { window.scrollTo({ top: 0 }); } catch (e) {} }
}
TABS.forEach(function (t) { $("#t-" + t).addEventListener("click", function () { showTab(t, true); }); });
Array.prototype.forEach.call(document.querySelectorAll(".bb[data-go]"), function (b) { b.addEventListener("click", function () { showTab(b.getAttribute("data-go"), true); }); });
function stopRuns() { setPrompt(null); setHold(0); learn.holder.reset(); quiz.state = "idle"; spell.state = "idle"; }

/* ---------- finger chart (side view of each finger, drawn from the numbers) ---------- */
function fingerChart(proto) {
  var NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"); svg.setAttribute("viewBox", "0 0 250 140"); svg.setAttribute("class", "chart"); svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Side view of each finger, showing which are straight and which are curled");
  function add(tag, attrs, parent) { var n = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); }); (parent || svg).appendChild(n); return n; }
  var names = ["Thumb", "Index", "Middle", "Ring", "Pinky"], xs = [28, 78, 118, 158, 198], i;
  for (i = 0; i < 5; i++) {
    var x = xs[i], y = 100, pts = [[x, y]], a, lens = i === 0 ? [20, 16, 0] : [28, 20, 15];
    if (i === 0) { var ac = proto[9], ex = proto[10]; a = (0.15 + ac * 1.0) * 60; var l = 22 + ex * 28; pts.push([x + Math.sin(a * Math.PI / 180) * l, y - Math.cos(a * Math.PI / 180) * l]); }
    else {
      var k = proto[(i - 1) * 2], t = proto[(i - 1) * 2 + 1], a1 = k * 80, a2 = a1 + t * 65, a3 = a2 + t * 35, ang = [a1, a2, a3], cx = x, cy = y, s;
      for (s = 0; s < 3; s++) { cx += Math.sin(ang[s] * Math.PI / 180) * lens[s]; cy -= Math.cos(ang[s] * Math.PI / 180) * lens[s]; pts.push([cx, cy]); }
    }
    var d = pts.map(function (p, j) { return (j ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    add("path", { d: d, fill: "none", stroke: "currentColor", "stroke-width": 11, "stroke-linecap": "round", "stroke-linejoin": "round" });
    var tx = add("text", { x: x, y: 135, "text-anchor": "middle", "font-size": 11, "font-weight": 800, fill: "currentColor" }); tx.textContent = names[i];
  }
  add("rect", { x: 14, y: 96, width: 214, height: 9, rx: 4.5, fill: "currentColor", opacity: 0.18 });
  return svg;
}

/* ---------- LEARN ---------- */
var learn = { ch: "A", holder: new Holder(), done: false };
function renderLearn() {
  var g = $("#l-grid"); clear(g);
  LETTERS.forEach(function (ch) {
    var b = el("button", "lt" + (prog.learned[ch] ? " done" : ""), ch); b.type = "button"; b.setAttribute("aria-pressed", learn.ch === ch ? "true" : "false");
    b.setAttribute("aria-label", ch + (prog.learned[ch] ? ", learned" : "")); if (L.MOTION[ch]) b.appendChild(el("small", null, "moves"));
    b.addEventListener("click", function () { learn.ch = ch; learn.done = false; learn.holder.reset(); renderLearn(); }); g.appendChild(b);
  });
  var d = $("#l-detail"); clear(d); var l = L.resolve(learn.ch), row = el("div", "row"); row.style.justifyContent = "space-between";
  row.appendChild(el("h2", null, "Letter " + learn.ch)); if (prog.learned[learn.ch]) row.appendChild(el("span", "tag good", "You've got this one")); d.appendChild(row);
  d.appendChild(el("p", "cue", L.MOTION[learn.ch] ? l.cue.replace(/\.$/, "") + ". Then " + (learn.ch === "J" ? "draw a J in the air with your pinky." : "trace a Z in the air.") + " I only check the starting handshape." : l.cue));
  d.appendChild(fingerChart(l.proto)); d.appendChild(el("p", "small muted", "The chart shows each finger from the side: straight means up, curled means bent over. Thumb is on the left."));
  if (L.LOOKALIKE[learn.ch]) d.appendChild(el("div", "notice", learn.ch + " looks a lot like some other letters. I can check it better once you teach me your hand on the Me tab."));
  var r = el("div", "row"), nx = el("button", "btn sm ghost", "Next letter"); nx.type = "button";
  nx.addEventListener("click", function () { var i = LETTERS.indexOf(learn.ch); learn.ch = LETTERS[(i + 1) % LETTERS.length]; learn.done = false; learn.holder.reset(); renderLearn(); });
  var sv = el("button", "btn sm ghost", "Save this as my example"); sv.type = "button"; sv.id = "l-save";
  sv.addEventListener("click", function () { if (!cur) { $("#l-status").textContent = "I can't see a hand right now."; return; } addSample(learn.ch, cur.feat); $("#l-status").textContent = "Saved. I now have " + (cal[learn.ch] || []).length + " of your " + learn.ch + "s."; });
  r.appendChild(nx); r.appendChild(sv); r.appendChild(el("span", "status")); r.lastChild.id = "l-status"; r.lastChild.setAttribute("role", "status"); d.appendChild(r);
  setPrompt(learn.ch, L.MOTION[learn.ch] ? "start shape" : null);
}
function addSample(ch, feat) { var a = cal[ch] || (cal[ch] = []); a.push(feat.slice()); if (a.length > MAXS) a.shift(); saveAll(); }
function tickLearn(c, now) {
  var j = judge(learn.ch, c); draw(c && c.lm, j.off);
  if (!running) return;
  var p = learn.holder.update(j.ok, now); setHold(p); liveFor(learn.ch, j);
  if (p >= 1 && !learn.done) learnSuccess();
}
function learnSuccess() {
  if (learn.done) return;
  learn.done = true; prog.learned[learn.ch] = 1; saveAll(); beep(true); flash("Got it!");
  var i = LETTERS.indexOf(learn.ch); setTimeout(function () { if (mode === "learn" && learn.done) { learn.ch = LETTERS[(i + 1) % LETTERS.length]; learn.done = false; learn.holder.reset(); renderLearn(); } }, 1100);
}

/* ---------- QUIZ ---------- */
var quiz = { state: "idle", list: [], i: 0, t0: 0, holder: new Holder(), res: [], pool: "all", seen: {} };
var QN = 10, QTIME = 10000;
function pickPool() {
  var base = LETTERS.filter(function (c) { return !L.MOTION[c]; });
  if (quiz.pool === "learned") { var l = base.filter(function (c) { return prog.learned[c]; }); if (l.length >= 3) base = l; }
  var a = base.slice(), out = []; while (out.length < QN && a.length) { out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]); }
  while (out.length < QN) out.push(base[Math.floor(Math.random() * base.length)]); return out;
}
function renderQuiz() {
  var c = $("#q-card"); clear(c);
  if (quiz.state === "run") {
    c.appendChild(el("h2", null, "Quiz")); var pr = el("p", "big-n", (quiz.i + 1) + " of " + QN); pr.id = "q-prog"; c.appendChild(pr);
    c.appendChild(el("p", "muted", "Sign the letter on the camera. You have 10 seconds for each one."));
    var r = el("div", "row"), sk = el("button", "btn sm ghost", "Skip this one"); sk.type = "button"; sk.addEventListener("click", function () { finishQ(false); });
    var qt = el("button", "btn sm ghost", "Stop quiz"); qt.type = "button"; qt.addEventListener("click", function () { quiz.state = "idle"; setPrompt(null); setHold(0); renderQuiz(); });
    r.appendChild(sk); r.appendChild(qt); c.appendChild(r); return;
  }
  if (quiz.state === "done") {
    var right = quiz.res.filter(function (x) { return x.ok; }).length;
    c.appendChild(el("h2", null, "Quiz done")); c.appendChild(el("p", "big-n", right + " of " + quiz.res.length));
    var first = firstQuiz(), msg = "";
    if (first && prog.results.filter(function (r) { return r.mode === "quiz"; }).length > 1) msg = "Your first quiz was " + first.right + " of " + first.total + ". Today you got " + right + ".";
    if (msg) c.appendChild(el("p", "muted", msg));
    var miss = quiz.res.filter(function (x) { return !x.ok; });
    if (miss.length) { c.appendChild(el("h4", null, "Practice these")); var w = el("div", "word"); miss.forEach(function (x) { w.appendChild(el("span", null, x.ch)); }); c.appendChild(w); }
    var b = el("div", "row"), again = el("button", "btn", "Quiz again"); again.type = "button"; again.addEventListener("click", startQuiz);
    var pg = el("button", "btn ghost", "See my progress"); pg.type = "button"; pg.addEventListener("click", function () { showTab("me", true); }); b.appendChild(again); b.appendChild(pg); c.appendChild(b); return;
  }
  c.appendChild(el("h2", null, "Quiz")); c.appendChild(el("p", "muted", "10 random letters. Take it before you practice and again after, and you'll see how much you've improved."));
  var row = el("div", "row"); [["all", "Any letter"], ["learned", "Only letters I've learned"]].forEach(function (o) {
    var b2 = el("button", "btn sm " + (quiz.pool === o[0] ? "alt" : "ghost"), o[1]); b2.type = "button"; b2.setAttribute("aria-pressed", quiz.pool === o[0] ? "true" : "false"); b2.addEventListener("click", function () { quiz.pool = o[0]; renderQuiz(); }); row.appendChild(b2);
  }); c.appendChild(row);
  var go = el("button", "btn", "Start quiz"); go.type = "button"; go.id = "q-go"; go.addEventListener("click", startQuiz); c.appendChild(go);
  c.appendChild(el("p", "status", running ? "" : "Turn the camera on first."));
}
function firstQuiz() { var q = prog.results.filter(function (r) { return r.mode === "quiz"; })[0]; return q ? { right: q.right, total: q.total } : null; }
function startQuiz() {
  if (!running) { $("#q-card").appendChild(el("div", "notice", "Start the camera first, at the top of the page.")); return; }
  quiz.list = pickPool(); quiz.i = 0; quiz.res = []; quiz.state = "run"; nextQ(); renderQuiz();
}
function nextQ() { quiz.holder.reset(); quiz.t0 = performance.now(); quiz.seen = {}; setPrompt(quiz.list[quiz.i]); setHold(0); }
function finishQ(ok) {
  var ch = quiz.list[quiz.i], saw = null, best = 0; Object.keys(quiz.seen).forEach(function (k) { if (quiz.seen[k] > best) { best = quiz.seen[k]; saw = k; } });
  quiz.res.push({ ch: ch, ok: ok, saw: ok ? null : saw }); if (ok) { beep(true); flash("Yes!"); } else beep(false);
  quiz.i++; if (quiz.i >= QN) { endQuiz(); return; } nextQ(); var p = $("#q-prog"); if (p) p.textContent = (quiz.i + 1) + " of " + QN;
}
function endQuiz() {
  quiz.state = "done"; setPrompt(null); setHold(0); var right = quiz.res.filter(function (x) { return x.ok; }).length;
  prog.results.push({ ts: Date.now(), mode: "quiz", total: quiz.res.length, right: right, per: quiz.res.map(function (x) { return { ch: x.ch, ok: x.ok ? 1 : 0, saw: x.saw || "" }; }) });
  prog.results = prog.results.slice(-200); saveAll(); renderQuiz();
}
function tickQuiz(c, now) {
  if (quiz.state !== "run") { draw(c && c.lm); return; }
  var ch = quiz.list[quiz.i], j = judge(ch, c); draw(c && c.lm, null);
  if (c) { var b = c.cls.best.ch; quiz.seen[b] = (quiz.seen[b] || 0) + 1; }
  var p = quiz.holder.update(j.ok, now); setHold(p);
  var left = Math.max(0, Math.ceil((QTIME - (now - quiz.t0)) / 1000)); setLive([chip(left + " seconds left", "hint")]);
  if (p >= 1) finishQ(true); else if (now - quiz.t0 > QTIME) finishQ(false);
}

/* ---------- SPELL ---------- */
var spell = { state: "idle", word: "", i: 0, marks: [], holder: new Holder(), t0: 0 };
function renderSpellIdle() { if (spell.state === "done") renderSpell(); else $("#s-run").hidden = true; }
function renderSpell() {
  var c = $("#s-run"); clear(c); c.hidden = false; var w = el("div", "word"); w.setAttribute("aria-label", "Word: " + spell.word);
  spell.word.split("").forEach(function (ch, i) { var s = el("span", spell.marks[i] === "ok" ? "ok" : spell.marks[i] === "skip" ? "skip" : (spell.state === "run" && i === spell.i ? "now" : ""), ch); w.appendChild(s); }); c.appendChild(w);
  if (spell.state === "run") {
    c.appendChild(el("p", "muted", "Sign the highlighted letter.")); var r = el("div", "row"), sk = el("button", "btn sm ghost", "Skip this letter"); sk.type = "button"; sk.addEventListener("click", function () { spell.marks[spell.i] = "skip"; advanceSpell(); }); r.appendChild(sk); c.appendChild(r);
  } else if (spell.state === "done") {
    var ok = spell.marks.filter(function (m) { return m === "ok"; }).length; c.appendChild(el("h3", null, ok === spell.word.length ? "You spelled " + spell.word + "!" : "Finished: " + ok + " of " + spell.word.length + " letters"));
    var again = el("button", "btn sm", "Spell it again"); again.type = "button"; again.addEventListener("click", function () { startSpell(spell.word); }); c.appendChild(again);
  }
}
function startSpell(word) {
  if (!running) { renderSpellMsg("Start the camera first, at the top of the page."); return; }
  spell.word = word; spell.i = 0; spell.marks = []; spell.state = "run"; spell.t0 = performance.now(); spell.holder.reset(); renderSpell(); setPrompt(word[0], L.MOTION[word[0]] ? "start shape" : null); setHold(0);
}
function renderSpellMsg(t) { var c = $("#s-run"); clear(c); c.hidden = false; c.appendChild(el("div", "notice", t)); }
function advanceSpell() {
  spell.i++; spell.holder.reset();
  if (spell.i >= spell.word.length) { spell.state = "done"; setPrompt(null); setHold(0); var ok = spell.marks.filter(function (m) { return m === "ok"; }).length;
    prog.results.push({ ts: Date.now(), mode: "spell", word: spell.word, right: ok, total: spell.word.length, ms: Math.round(performance.now() - spell.t0) }); prog.results = prog.results.slice(-200); saveAll(); flash("Done!"); }
  else setPrompt(spell.word[spell.i], L.MOTION[spell.word[spell.i]] ? "start shape" : null);
  renderSpell();
}
$("#s-go").addEventListener("click", function () {
  var w = $("#s-word").value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 14); if (!w) { renderSpellMsg("Type a word using the letters A to Z."); return; } $("#s-word").value = w; startSpell(w);
});
$("#s-word").addEventListener("keydown", function (e) { if (e.key === "Enter") $("#s-go").click(); });
function tickSpell(c, now) {
  if (spell.state !== "run") { draw(c && c.lm); return; }
  var ch = spell.word[spell.i], j = judge(ch, c); draw(c && c.lm, j.off); var p = spell.holder.update(j.ok, now); setHold(p); liveFor(ch, j);
  if (p >= 1) { spell.marks[spell.i] = "ok"; beep(true); advanceSpell(); }
}

/* ---------- TEACH ---------- */
var teach = { ch: "A", recording: false };
function renderTeach() {
  var g = $("#t-grid"); clear(g);
  LETTERS.forEach(function (ch) {
    var n = (cal[ch] || []).length, b = el("button", "lt" + (n >= 8 ? " done" : ""), ch); b.type = "button"; b.setAttribute("aria-pressed", teach.ch === ch ? "true" : "false"); b.appendChild(el("small", null, n ? n + " saved" : "none"));
    b.addEventListener("click", function () { teach.ch = ch; renderTeach(); }); g.appendChild(b);
  });
  var d = $("#t-detail"); clear(d); var l = L.resolve(teach.ch); d.appendChild(el("h2", null, "Teach it the letter " + teach.ch)); d.appendChild(el("p", "cue", l.cue));
  d.appendChild(el("p", "muted", "Make the sign, hold it steady, and tap Record. Move your hand around a little while it records. Two or three rounds per letter is plenty."));
  var r = el("div", "row"), rec = el("button", "btn", "Record " + teach.ch); rec.type = "button"; rec.id = "t-rec"; rec.addEventListener("click", record);
  var clr = el("button", "btn sm ghost", "Forget my " + teach.ch); clr.type = "button"; clr.addEventListener("click", function () { delete cal[teach.ch]; saveAll(); renderTeach(); });
  var nx = el("button", "btn sm ghost", "Next letter"); nx.type = "button"; nx.addEventListener("click", function () { teach.ch = LETTERS[(LETTERS.indexOf(teach.ch) + 1) % LETTERS.length]; renderTeach(); });
  r.appendChild(rec); r.appendChild(nx); r.appendChild(clr); d.appendChild(r); var st = el("p", "status", (cal[teach.ch] || []).length ? "I have " + cal[teach.ch].length + " examples of your " + teach.ch + "." : ""); st.id = "t-status"; st.setAttribute("role", "status"); d.appendChild(st);
  if ($("#teach-fold").open) { setPrompt(running ? teach.ch : null, null); $("#holdbar").hidden = true; } else setPrompt(null);
}
function record() {
  var st = $("#t-status");
  if (!running) { st.textContent = "Start the camera first, at the top of the page."; return; }
  if (!cur) { st.textContent = "I can't see your hand yet. Hold it up and try again."; return; }
  if (teach.recording) return; teach.recording = true; var n = 0, ch = teach.ch, btn = $("#t-rec"); btn.disabled = true; st.textContent = "Recording. Hold still...";
  var iv = setInterval(function () {
    if (cur) { addSample(ch, cur.feat); n++; }
    if (n >= SAMPLES || (!cur && n === 0 && (iv._tries = (iv._tries || 0) + 1) > 20)) { clearInterval(iv); teach.recording = false; if (mode === "teach") { renderTeach(); $("#t-status").textContent = n ? "Saved " + n + " examples. " + ch + " now has " + cal[ch].length + "." : "I lost your hand. Try again."; beep(!!n); } }
  }, 90);
}
function tickTeach(c) { draw(c && c.lm); if (running && !teach.recording) { if (!c) setLive(["Hold up one hand so I can see it."]); else setLive([chip(c.cls.best.d <= L.ACCEPT ? "I think this is " + c.cls.best.ch : "I'm not sure what this is", "hint")]); } }

/* ---------- PROGRESS ---------- */
function perLetter() {
  var s = {}; prog.results.forEach(function (r) { if (r.mode !== "quiz" || !r.per) return; r.per.forEach(function (x) { var o = s[x.ch] || (s[x.ch] = { ok: 0, n: 0, saw: {} }); o.n++; o.ok += x.ok ? 1 : 0; if (!x.ok && x.saw) o.saw[x.saw] = (o.saw[x.saw] || 0) + 1; }); }); return s;
}
function resultsText() {
  var q = prog.results.filter(function (r) { return r.mode === "quiz"; }), lines = ["Handwave results"];
  lines.push("Letters learned: " + Object.keys(prog.learned).length + " of " + LETTERS.length);
  q.forEach(function (r, i) { lines.push("Quiz " + (i + 1) + " (" + new Date(r.ts).toLocaleDateString() + "): " + r.right + " of " + r.total); });
  var pl = perLetter(); var keys = Object.keys(pl).sort(); if (keys.length) { lines.push("Per letter: " + keys.map(function (k) { return k + " " + pl[k].ok + "/" + pl[k].n; }).join(", ")); }
  return lines.join("\n");
}
function renderProg() {
  var c = $("#r-card"); clear(c); var q = prog.results.filter(function (r) { return r.mode === "quiz"; }), nl = Object.keys(prog.learned).length;
  c.appendChild(el("h2", null, "Your letters"));
  var wall = el("div", "wall"); wall.setAttribute("aria-label", "Letters you have learned");
  LETTERS.forEach(function (ch) { var s = el("span", (prog.learned[ch] ? "got" : "") + (cal[ch] ? " mine" : ""), ch); wall.appendChild(s); }); c.appendChild(wall);
  c.appendChild(el("p", "small muted", "Green letters are ones you've nailed. A ring means you taught me your version."));
  var top = el("div", "row"); top.style.gap = "24px";
  [[nl + " of " + LETTERS.length, "letters learned"], [String(q.length), "quizzes taken"]].forEach(function (x) { var d = el("div"); d.appendChild(el("div", "big-n", x[0])); d.appendChild(el("p", "small muted", x[1])); top.appendChild(d); }); c.appendChild(top);
  if (q.length) {
    c.appendChild(el("h3", null, "Quiz scores")); var t = el("table"), hd = el("tr"); ["When", "Score", ""].forEach(function (h) { hd.appendChild(el("th", null, h)); }); t.appendChild(hd);
    q.slice(-8).forEach(function (r) { var tr = el("tr"); tr.appendChild(el("td", null, new Date(r.ts).toLocaleDateString([], { month: "short", day: "numeric" }))); tr.appendChild(el("td", null, r.right + " of " + r.total)); var td = el("td"), bar = el("div", "bar"), i = el("i"); i.style.width = Math.round(100 * r.right / r.total) + "%"; bar.appendChild(i); td.appendChild(bar); tr.appendChild(td); t.appendChild(tr); });
    c.appendChild(t);
    if (q.length > 1) c.appendChild(el("p", "muted", "First quiz: " + q[0].right + " of " + q[0].total + ". Latest: " + q[q.length - 1].right + " of " + q[q.length - 1].total + "."));
    var pl = perLetter(), weak = Object.keys(pl).filter(function (k) { return pl[k].n >= 1 && pl[k].ok / pl[k].n < 0.6; }).sort();
    if (weak.length) { c.appendChild(el("h3", null, "Letters to practice")); var w = el("div", "word"); weak.forEach(function (k) { var s = el("span", null, k); w.appendChild(s); }); c.appendChild(w);
      var conf = []; weak.forEach(function (k) { var best = null, n = 0; Object.keys(pl[k].saw).forEach(function (s) { if (pl[k].saw[s] > n) { n = pl[k].saw[s]; best = s; } }); if (best) conf.push(k + " is often read as " + best); }); if (conf.length) c.appendChild(el("p", "small muted", conf.slice(0, 4).join(". ") + ". These are look-alikes. Try Teach it your hand on the Me tab for them.")); }
  } else c.appendChild(el("p", "muted", "Take a quiz and your scores will show up here."));
  var r = el("div", "row"), cp = el("button", "btn sm", "Copy my results"); cp.type = "button"; var st = el("span", "status"); st.setAttribute("role", "status");
  cp.addEventListener("click", function () { var tx = resultsText(); (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(tx) : Promise.reject()).then(function () { st.textContent = "Copied."; }).catch(function () { st.textContent = "Couldn't copy. Select this text instead: " + tx.replace(/\n/g, " | "); }); });
  var er = el("button", "btn sm ghost", "Erase everything"), armed = false; er.type = "button";
  er.addEventListener("click", function () { if (!armed) { armed = true; er.textContent = "Sure?"; setTimeout(function () { armed = false; er.textContent = "Erase everything"; }, 3000); return; } cal = {}; prog = { learned: {}, results: [] }; saveAll(); renderProg(); });
  r.appendChild(cp); r.appendChild(er); r.appendChild(st); c.appendChild(r); c.appendChild(el("p", "small muted", "Everything is saved only on this device."));
}

/* ---------- frame router ---------- */
function tick(c, now) {
  if (!c && running) { if (mode === "learn" || mode === "spell") { draw(null); learn.holder.update(false, now); spell.holder.update(false, now); if (mode === "learn" || spell.state === "run") setLive(["Hold up one hand so I can see it."]); setHold(0); } else draw(null); if (mode === "quiz" && quiz.state === "run") { var p = quiz.holder.update(false, now); setHold(p); if (now - quiz.t0 > QTIME) finishQ(false); } return; }
  if (mode === "learn") tickLearn(c, now); else if (mode === "quiz") tickQuiz(c, now); else if (mode === "spell") tickSpell(c, now); else if (mode === "me") tickTeach(c); else draw(c && c.lm);
}

/* demo mode: no camera, so you can see how everything works. Nothing is saved. */
function startDemo() {
  demo = true; running = true; $("#camintro").hidden = true; $("#cam-stop").hidden = false; $("#cam-stop").textContent = "Leave demo"; $("#demo-sign").hidden = false;
  setLive([chip("Demo mode: the camera is off and nothing is saved. Tap \"Sign it for me\" to see how it works.", "hint")]); dogSay("This is just a demo. I'll pretend I can see your hand!", true);
}
function demoSign() {
  if (!demo) return;
  if (mode === "learn") learnSuccess();
  else if (mode === "quiz" && quiz.state === "run") finishQ(true);
  else if (mode === "spell" && spell.state === "run") { spell.marks[spell.i] = "ok"; beep(true); advanceSpell(); }
  else setLive([chip("Start a quiz or a word first, then tap Sign it for me.", "hint")]);
}
$("#demo-start").addEventListener("click", startDemo);
if (window.__demoOnly) { $("#cam-start").hidden = true; var ip = $("#camintro").querySelector("p"); ip.textContent = "This preview has no camera. Try the demo to see how Handwave works."; $("#camintro").querySelectorAll("p")[1].hidden = true; }
$("#demo-sign").addEventListener("click", demoSign);
$("#cam-start").addEventListener("click", startCamera);
$("#cam-stop").addEventListener("click", function () { if (demo) { location.reload(); return; } stopCamera(); });
document.addEventListener("visibilitychange", function () { if (document.hidden && running && !demo) stopCamera(); });
window.addEventListener("pagehide", function () { if (stream) stopCamera(); });
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(function () {});
window.__hs = { get state() { return { mode: mode, learned: prog.learned, cal: Object.keys(cal).map(function (k) { return k + ":" + cal[k].length; }), results: prog.results, quiz: quiz.state, qtarget: quiz.list[quiz.i], learnch: learn.ch, spell: spell.state, running: running }; }, setRunning: function (v) { running = v; }, setPaused: function (v) { paused = v; } };
try { if (window.navigator.standalone || (window.matchMedia && matchMedia("(display-mode: standalone)").matches)) $("#ios-tip").hidden = true; } catch (e) {}
$("#teach-fold").addEventListener("toggle", function () { if (mode === "me") renderTeach(); });
showTab("learn");
})();
