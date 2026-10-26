/* The game layer: XP, levels, trophies, streaks, the daily chest, badges and Indra's outfits.
   Plain DOM, no libraries. Every piece of markup written with innerHTML is a fixed string from this file. */
(function (root) {
"use strict";
var $ = function (s, r) { return (r || document).querySelector(s); };
function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
function html(tag, cls, h) { var n = el(tag, cls); n.innerHTML = h; return n; }
function btn(cls, text) { var b = el("button", cls, text); b.type = "button"; return b; }

var OUT = ' stroke="#16251A" stroke-width="1.6" stroke-linejoin="round"';
var ICON = {
  flame: '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z" fill="#FF7A1A"' + OUT + '/></svg>',
  trophy: '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="#F2C200"' + OUT + '/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" fill="none" stroke="#16251A" stroke-width="1.6"/><path d="M10 13h4v3h3v3H7v-3h3z" fill="#F2A900"' + OUT + '/></svg>',
  heart: '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="#E53935"' + OUT + '/></svg>',
  heartOff: '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="#9AA79C"' + OUT + '/></svg>',
  star: '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="#F2C200"' + OUT + '/></svg>',
  lock: '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" fill="#6B7C6F"' + OUT + '/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#16251A" stroke-width="2"/></svg>'
};
function chestSvg(open) {
  return '<svg viewBox="0 0 64 64" class="chest' + (open ? ' open' : '') + '" aria-hidden="true">' +
    (open ? '<circle cx="32" cy="24" r="14" fill="#FFF2A8" opacity=".85"/><path d="M32 6l3 8 8 .5-6.3 5 2.3 8-7-4.6-7 4.6 2.3-8L21 14.500l8-.5z" fill="#F2C200" stroke="#16251A" stroke-width="1.6" stroke-linejoin="round"/>' : '') +
    '<path d="M8 30h48v26H8z" fill="#8A4B2A" stroke="#16251A" stroke-width="3" stroke-linejoin="round"/>' +
    (open ? '<path d="M8 30l4-14h40l4 14z" fill="#A9602F" stroke="#16251A" stroke-width="3" stroke-linejoin="round"/>' : '<path d="M8 30a24 16 0 0 1 48 0z" fill="#A9602F" stroke="#16251A" stroke-width="3" stroke-linejoin="round"/>') +
    '<rect x="27" y="26" width="10" height="30" fill="#F2C200" stroke="#16251A" stroke-width="2.5"/><circle cx="32" cy="41" r="4" fill="#F2A900" stroke="#16251A" stroke-width="2"/></svg>';
}
function medal(color, glyph, off) {
  return '<svg viewBox="0 0 48 48" class="medal" aria-hidden="true"><path d="M14 2h8l4 12h-8zM34 2h-8l-4 12h8z" fill="' + (off ? '#9AA79C' : '#E53935') + '" stroke="#16251A" stroke-width="2" stroke-linejoin="round"/><circle cx="24" cy="29" r="15" fill="' + (off ? '#B9C4BB' : color) + '" stroke="#16251A" stroke-width="3"/><text x="24" y="35" text-anchor="middle" font-family="Baloo 2,Trebuchet MS,sans-serif" font-weight="800" font-size="' + (glyph.length > 1 ? 14 : 18) + '" fill="#fff">' + glyph + '</text></svg>';
}

/* ---------- numbers ---------- */
var GOAL = 3;
var ARENAS = [{ n: "Fist Fields", t: 0 }, { n: "Finger Falls", t: 100 }, { n: "Palm Peaks", t: 250 }, { n: "Sign Summit", t: 500 }, { n: "Indra's Palace", t: 1000 }];
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function dk(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function yk() { var d = new Date(); return dk(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)); }
function lvl(xp) { return Math.floor(Math.sqrt(xp / 50)) + 1; }
function lvlFloor(n) { return 50 * (n - 1) * (n - 1); }
function arenaOf(t) { var a = ARENAS[0], i; for (i = 0; i < ARENAS.length; i++) if (t >= ARENAS[i].t) a = ARENAS[i]; return a; }
function arenaNext(t) { var i; for (i = 0; i < ARENAS.length; i++) if (t < ARENAS[i].t) return ARENAS[i]; return null; }
function rollDay(P) { var k = dk(); if (P.dayKey !== k) { P.dayKey = k; P.today = 0; } }
function streakNow(P) { return (P.lastDay === dk() || P.lastDay === yk()) ? P.streak : 0; }
function markStreak(P) { var k = dk(); if (P.lastDay === k) return; P.streak = (P.lastDay === yk()) ? P.streak + 1 : 1; P.lastDay = k; }
function nlearned(P) { return Object.keys(P.learned).length; }

/* ---------- badges ---------- */
var BADGES = [
  { id: "first", n: "First sign", d: "Learn your first letter.", c: "#2B63C9", g: "A", ok: function (P) { return nlearned(P) >= 1; } },
  { id: "half", n: "Halfway", d: "Learn 13 letters.", c: "#0B6B35", g: "13", ok: function (P) { return nlearned(P) >= 13; } },
  { id: "full", n: "Whole alphabet", d: "Learn all 26 letters.", c: "#F2A900", g: "26", ok: function (P) { return nlearned(P) >= 26; } },
  { id: "s3", n: "3-day streak", d: "Practice 3 days in a row.", c: "#FF7A1A", g: "3", ok: function (P) { return streakNow(P) >= 3; } },
  { id: "s7", n: "7-day streak", d: "Practice 7 days in a row.", c: "#E53935", g: "7", ok: function (P) { return streakNow(P) >= 7; } },
  { id: "win", n: "Battle won", d: "Win a battle.", c: "#B4472F", g: "W", ok: function (P) { return P.wins >= 1; } },
  { id: "c5", n: "Combo x5", d: "Get 5 in a row in a battle.", c: "#7A3FB5", g: "x5", ok: function (P) { return P.bestCombo >= 5; } },
  { id: "word", n: "Wordsmith", d: "Spell a whole word.", c: "#0D9488", g: "Ab", ok: function (P) { return P.words >= 1; } },
  { id: "teach", n: "Good teacher", d: "Teach Indra 5 letters on your hand.", c: "#1E88E5", g: "T", ok: function (P) { return cfg.taught() >= 5; } },
  { id: "l5", n: "Level 5", d: "Reach level 5.", c: "#9B5DE5", g: "5", ok: function (P) { return lvl(P.xp) >= 5; } }
];
var BADGE = {}; BADGES.forEach(function (b) { BADGE[b.id] = b; });

/* ---------- Indra's outfits (drawn on the same 150 x 156 canvas as the peacock) ---------- */
var S = ' stroke="#04141C" stroke-linejoin="round" stroke-linecap="round"';
var OUTFITS = [
  { id: "shades", n: "Cool shades", u: { k: "lvl", n: 2 }, svg: '<rect x="56" y="44" width="17" height="12" rx="4" fill="#1A1A1A"' + S + ' stroke-width="2.4"/><rect x="77" y="44" width="17" height="12" rx="4" fill="#1A1A1A"' + S + ' stroke-width="2.4"/><path d="M73 48h4" fill="none"' + S + ' stroke-width="2.4"/><path d="M60 47l4 0M81 47l4 0" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>' },
  { id: "bow", n: "Bow tie", u: { k: "badge", id: "first" }, svg: '<path d="M75 84L60 75v18zM75 84l15-9v18z" fill="#E53935"' + S + ' stroke-width="2.4"/><circle cx="75" cy="84" r="4.2" fill="#B71C1C"' + S + ' stroke-width="2"/>' },
  { id: "cap", n: "Grad cap", u: { k: "badge", id: "half" }, svg: '<path d="M62 38v8q13 7 26 0v-8" fill="#333"' + S + ' stroke-width="2.4"/><path d="M48 34l27-11 27 11-27 11z" fill="#222"' + S + ' stroke-width="2.4"/><path d="M102 34v15" stroke="#F2C200" stroke-width="2.4" stroke-linecap="round"/><circle cx="102" cy="51" r="3.2" fill="#F2C200"/>' },
  { id: "party", n: "Party hat", u: { k: "badge", id: "s3" }, svg: '<path d="M75 6L60 37h30z" fill="#F2C200"' + S + ' stroke-width="2.6"/><path d="M66 28h18M70 19h10" stroke="#E53935" stroke-width="3.2" stroke-linecap="round"/><circle cx="75" cy="6" r="4.2" fill="#E53935"' + S + ' stroke-width="2"/>' },
  { id: "phones", n: "Headphones", u: { k: "badge", id: "c5" }, svg: '<path d="M55 52A20 21 0 0 1 95 52" fill="none"' + S + ' stroke-width="4.6"/><rect x="49" y="46" width="10" height="16" rx="4.5" fill="#7A3FB5"' + S + ' stroke-width="2.4"/><rect x="91" y="46" width="10" height="16" rx="4.5" fill="#7A3FB5"' + S + ' stroke-width="2.4"/>' },
  { id: "crown", n: "Crown", u: { k: "lvl", n: 5 }, svg: '<path d="M59 37L61 16l8 10 6-14 6 14 8-10 2 21z" fill="#F2C200"' + S + ' stroke-width="2.6"/><circle cx="61" cy="15" r="2.8" fill="#E53935"/><circle cx="75" cy="11" r="2.8" fill="#2B63C9"/><circle cx="89" cy="15" r="2.8" fill="#E53935"/>' },
  { id: "wiz", n: "Wizard hat", u: { k: "chest" }, svg: '<path d="M75 3L57 39h36z" fill="#5B3FA8"' + S + ' stroke-width="2.6"/><ellipse cx="75" cy="39" rx="22" ry="5.500" fill="#4A3290"' + S + ' stroke-width="2.4"/><path d="M75 17l1.800 3.800 4.200.5-3.100 2.800.9 4.100-3.800-2.100-3.800 2.100.9-4.100-3.100-2.800 4.200-.5z" fill="#F2C200"/>' },
  { id: "flower", n: "Flower", u: { k: "chest" }, svg: '<g transform="translate(58 34)"><circle cx="0" cy="-6" r="4.500" fill="#FF9EB5"' + S + ' stroke-width="1.6"/><circle cx="6" cy="-2" r="4.500" fill="#FF9EB5"' + S + ' stroke-width="1.6"/><circle cx="4" cy="5" r="4.500" fill="#FF9EB5"' + S + ' stroke-width="1.6"/><circle cx="-4" cy="5" r="4.500" fill="#FF9EB5"' + S + ' stroke-width="1.6"/><circle cx="-6" cy="-2" r="4.500" fill="#FF9EB5"' + S + ' stroke-width="1.6"/><circle cx="0" cy="0" r="3.600" fill="#F2C200"' + S + ' stroke-width="1.6"/></g>' }
];
var OUTFIT = {}; OUTFITS.forEach(function (o) { OUTFIT[o.id] = o; });
function owned(P, o) { var u = o.u; if (u.k === "lvl") return lvl(P.xp) >= u.n; if (u.k === "badge") return !!P.badges[u.id]; return !!P.owned[o.id]; }
function reqText(o) { var u = o.u; if (u.k === "lvl") return "Reach level " + u.n; if (u.k === "badge") return "Earn the " + BADGE[u.id].n + " badge"; return "Find it in a daily chest"; }
function preview(o) { return '<svg viewBox="36 0 78 84" class="prev" aria-hidden="true"><circle cx="75" cy="52" r="20" fill="#1E88E5" stroke="#04141C" stroke-width="3.500"/>' + (o ? o.svg : '') + '</svg>'; }

/* ---------- saved game data ---------- */
var cfg = { getProg: function () { return {}; }, save: function () {}, go: function () {}, taught: function () { return 0; }, letters: function () { return []; }, setLearn: function () {} };
var queue = [], held = false, showing = false;
function prog() { return cfg.getProg(); }
function num(x) { return typeof x === "number" && isFinite(x) && x >= 0 ? x : 0; }
function loadProg(p, learned, res) {
  p = p || {}; var o = { learned: learned, results: res };
  o.xp = num(p.xp); o.trophies = num(p.trophies); o.streak = num(p.streak); o.wins = num(p.wins); o.bestCombo = num(p.bestCombo); o.words = num(p.words); o.today = num(p.today);
  o.lastDay = typeof p.lastDay === "string" ? p.lastDay.slice(0, 10) : ""; o.dayKey = typeof p.dayKey === "string" ? p.dayKey.slice(0, 10) : ""; o.chest = typeof p.chest === "string" ? p.chest.slice(0, 10) : "";
  o.badges = {}; BADGES.forEach(function (b) { if (p.badges && p.badges[b.id]) o.badges[b.id] = 1; });
  o.owned = {}; OUTFITS.forEach(function (x) { if (p.owned && p.owned[x.id]) o.owned[x.id] = 1; });
  o.seenOut = {}; OUTFITS.forEach(function (x) { if (p.seenOut && p.seenOut[x.id]) o.seenOut[x.id] = 1; });
  o.outfit = typeof p.outfit === "string" && OUTFIT[p.outfit] ? p.outfit : "";
  o.lvlSeen = p.lvlSeen ? num(p.lvlSeen) : lvl(o.xp); if (o.lvlSeen < 1) o.lvlSeen = 1;
  return o;
}

/* ---------- pop-ups ---------- */
function popup(o) { queue.push(o); pump(); }
function pump() {
  if (held || showing || !queue.length) return;
  var o = queue.shift(), m = $("#modal"), c = $("#mcard"); if (!m || !c) return;
  showing = true; clear(c); c.appendChild(el("h2", null, o.title)); if (o.big) c.appendChild(html("div", "mbig", o.big));
  (o.lines || []).forEach(function (t) { c.appendChild(el("p", "muted", t)); });
  var b = btn("btn", o.btn || "Awesome!"); b.addEventListener("click", function () { m.hidden = true; showing = false; pump(); });
  c.appendChild(b); m.hidden = false; try { b.focus(); } catch (e) {}
}
function hold(v) { held = !!v; if (!held) pump(); }

/* ---------- earning things ---------- */
function check() {
  var P = prog(), l;
  rollDay(P);
  BADGES.forEach(function (b) { if (!P.badges[b.id] && b.ok(P)) { P.badges[b.id] = 1; popup({ title: "New badge!", big: medal(b.c, b.g), lines: [b.n, b.d] }); } });
  l = lvl(P.xp); if (l > P.lvlSeen) { P.lvlSeen = l; popup({ title: "Level " + l + "!", big: ICON.star, lines: ["You are getting really good."] }); }
  OUTFITS.forEach(function (o) { if (!P.seenOut[o.id] && owned(P, o)) { P.seenOut[o.id] = 1; popup({ title: "New outfit!", big: preview(o), lines: [o.n + " is ready in Indra's closet. Find it on the Me tab."] }); } });
  cfg.save(); refresh();
}
function signed(P, xp) { rollDay(P); P.xp += xp; P.today += 1; markStreak(P); check(); }
function battleEnd(P, right) {
  var before = arenaOf(P.trophies), win = right >= 8, delta = win ? 20 + (right - 8) * 3 : -Math.min(P.trophies, 10), xp = win ? 25 : 0;
  P.xp += xp; P.trophies = Math.max(0, P.trophies + delta); if (win) P.wins += 1;
  var now = arenaOf(P.trophies); if (now.n !== before.n && delta > 0) popup({ title: "New arena!", big: ICON.trophy, lines: ["Welcome to " + now.n + "."] });
  return { win: win, delta: delta, xp: xp };
}
function bestCombo(P, c) { if (c > P.bestCombo) P.bestCombo = c; }
function openChest() {
  var P = prog(); rollDay(P); if (P.today < GOAL || P.chest === dk()) return;
  P.chest = dk(); var xp = 40 + Math.floor(Math.random() * 41), drop = null;
  var pool = OUTFITS.filter(function (o) { return o.u.k === "chest" && !P.owned[o.id]; });
  if (pool.length && Math.random() < 0.4) { drop = pool[Math.floor(Math.random() * pool.length)]; P.owned[drop.id] = 1; P.seenOut[drop.id] = 1; }
  P.xp += xp;
  popup({ title: "Chest opened!", big: chestSvg(true), lines: ["+" + xp + " XP"].concat(drop ? ["You found the " + drop.n + "!"] : []) });
  check();
}

/* ---------- drawing ---------- */
function renderStats() {
  var P = prog(), b = $("#stats"); if (!b) return; rollDay(P); clear(b);
  var l = lvl(P.xp), lo = lvlFloor(l), hi = lvlFloor(l + 1), pct = Math.round(100 * (P.xp - lo) / (hi - lo));
  b.appendChild(el("div", "lvl", String(l)));
  var x = el("div", "xp"); x.appendChild(el("div", "xptext", "Level " + l + " - " + (P.xp - lo) + " / " + (hi - lo) + " XP"));
  var bar = el("div", "xpbar"), f = el("i"); f.style.width = pct + "%"; bar.appendChild(f); x.appendChild(bar); b.appendChild(x);
  var s = html("div", "pill", ICON.flame); s.appendChild(el("span", null, String(streakNow(P)))); s.setAttribute("aria-label", streakNow(P) + " day streak"); b.appendChild(s);
  var t = html("div", "pill", ICON.trophy); t.appendChild(el("span", null, String(P.trophies))); t.setAttribute("aria-label", P.trophies + " trophies"); b.appendChild(t);
}
function applyOutfit() { var g = $("#acc"); if (!g) return; var o = OUTFIT[prog().outfit]; g.innerHTML = o ? o.svg : ""; }
function bar(pct) { var b = el("div", "gbar"), f = el("i"); f.style.width = Math.max(0, Math.min(100, pct)) + "%"; b.appendChild(f); return b; }
function renderHome() {
  var root_ = $("#h-body"); if (!root_) return; var P = prog(); rollDay(P); clear(root_);
  var a = arenaOf(P.trophies), nx = arenaNext(P.trophies);
  var ar = el("div", "card arena"); ar.appendChild(el("p", "kick", "Your arena"));
  var r1 = el("div", "row"); r1.style.justifyContent = "space-between"; r1.appendChild(el("h2", null, a.n)); r1.appendChild(html("div", "pill big", ICON.trophy)); r1.lastChild.appendChild(el("span", null, String(P.trophies))); ar.appendChild(r1);
  if (nx) { ar.appendChild(bar(100 * (P.trophies - a.t) / (nx.t - a.t))); ar.appendChild(el("p", "small muted", (nx.t - P.trophies) + " more trophies to reach " + nx.n + ".")); }
  else ar.appendChild(el("p", "small muted", "You made it to the top arena."));
  root_.appendChild(ar);
  var bt = btn("battle"); bt.id = "h-battle"; bt.appendChild(el("span", "bt1", "Battle")); bt.appendChild(el("span", "bt2", "Win trophies. Three hearts.")); bt.addEventListener("click", function () { cfg.go("quiz"); }); root_.appendChild(bt);
  var ch = el("div", "card chestcard"), done = P.chest === dk(), ready = !done && P.today >= GOAL;
  ch.appendChild(html("div", "chestwrap" + (ready ? " ready" : ""), chestSvg(done)));
  var tx = el("div", "chesttext"); tx.appendChild(el("h3", null, "Daily chest"));
  if (done) tx.appendChild(el("p", "muted", "Opened today. A new chest comes tomorrow."));
  else if (ready) { tx.appendChild(el("p", "muted", "You did it! Open it for XP and maybe an outfit.")); var ob = btn("btn alt sm", "Open chest"); ob.id = "h-chest"; ob.addEventListener("click", openChest); tx.appendChild(ob); }
  else { tx.appendChild(el("p", "muted", "Sign " + (GOAL - P.today) + " more letter" + (GOAL - P.today === 1 ? "" : "s") + " today to unlock it.")); tx.appendChild(bar(100 * P.today / GOAL)); }
  ch.appendChild(tx); root_.appendChild(ch);
  var learned = P.learned, next = null; cfg.letters().forEach(function (c) { if (!next && !learned[c]) next = c; });
  var lc = el("div", "card nextcard");
  if (next) { lc.appendChild(el("div", "bigletter", next)); var t2 = el("div", "chesttext"); t2.appendChild(el("h3", null, "Next up: letter " + next)); t2.appendChild(el("p", "muted", nlearned(P) + " of " + cfg.letters().length + " letters learned.")); var lb = btn("btn sm", "Learn it"); lb.id = "h-learn"; lb.addEventListener("click", function () { cfg.setLearn(next); cfg.go("learn"); }); t2.appendChild(lb); lc.appendChild(t2); }
  else { lc.appendChild(html("div", "bigletter", ICON.star)); var t3 = el("div", "chesttext"); t3.appendChild(el("h3", null, "You know them all!")); t3.appendChild(el("p", "muted", "Battle to keep your trophies and your streak.")); lc.appendChild(t3); }
  root_.appendChild(lc);
  var row = el("div", "tiles"); [["Spell a word", "spell"], ["Indra's closet", "me"]].forEach(function (x) { var b2 = btn("tile", x[0]); b2.addEventListener("click", function () { cfg.go(x[1]); }); row.appendChild(b2); }); root_.appendChild(row);
}
function renderMe() {
  var P = prog(), w = $("#w-card"), bc = $("#b-card"); if (!w || !bc) return;
  clear(w); w.appendChild(el("h2", null, "Indra's closet")); var st = el("p", "status", "Tap an outfit to put it on Indra."); st.setAttribute("role", "status");
  var g = el("div", "closet"); g.setAttribute("role", "group"); g.setAttribute("aria-label", "Outfits");
  [null].concat(OUTFITS).forEach(function (o) {
    var id = o ? o.id : "", own = o ? owned(P, o) : true, b = btn("fit" + (P.outfit === id ? " on" : "") + (own ? "" : " locked"));
    b.setAttribute("aria-pressed", P.outfit === id ? "true" : "false"); b.appendChild(html("span", "pv", preview(o))); b.appendChild(el("span", "fn", o ? o.n : "None"));
    if (!own) { b.appendChild(html("span", "lk", ICON.lock)); b.setAttribute("aria-label", o.n + ", locked. " + reqText(o)); }
    b.addEventListener("click", function () { if (!own) { st.textContent = o.n + ": " + reqText(o) + "."; return; } P.outfit = id; cfg.save(); applyOutfit(); renderMe(); });
    g.appendChild(b);
  });
  w.appendChild(g); w.appendChild(st);
  clear(bc); var have = BADGES.filter(function (b) { return P.badges[b.id]; }).length; bc.appendChild(el("h2", null, "Badges (" + have + " of " + BADGES.length + ")"));
  var bg = el("div", "badges"); BADGES.forEach(function (b) {
    var on = !!P.badges[b.id], d = el("div", "bdg" + (on ? " on" : "")); d.appendChild(html("span", "bm", medal(b.c, b.g, !on))); d.appendChild(el("span", "bn", b.n)); d.appendChild(el("span", "bd", b.d)); bg.appendChild(d);
  }); bc.appendChild(bg);
}
function refresh() { renderStats(); applyOutfit(); var h = $("#p-home"); if (h && !h.hidden) renderHome(); var m = $("#p-me"); if (m && !m.hidden) renderMe(); }
function setup(c) { cfg = c; applyOutfit(); renderStats(); }
function hearts(n, max) { var s = ""; for (var i = 0; i < max; i++) s += i < n ? ICON.heart : ICON.heartOff; return s; }
function info() { var P = prog(); return { arena: arenaOf(P.trophies).n, trophies: P.trophies }; }

root.HWGame = { setup: setup, loadProg: loadProg, signed: signed, check: check, battleEnd: battleEnd, bestCombo: bestCombo, hold: hold, renderStats: renderStats, renderHome: renderHome, renderMe: renderMe, refresh: refresh, applyOutfit: applyOutfit, hearts: hearts, info: info, popup: popup, ICON: ICON, GOAL: GOAL };
})(typeof window !== "undefined" ? window : this);
