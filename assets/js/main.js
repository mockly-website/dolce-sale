/* Dolce Sale — script comune. JavaScript puro, nessuna libreria. */
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = "https://wa.me/393517578080";

  /* ---------- Orari di esempio (0 = domenica) ---------- */
  var HOURS = {
    0: [[480, 780]],
    1: [],
    2: [[450, 780], [930, 1170]],
    3: [[450, 780], [930, 1170]],
    4: [[450, 780], [930, 1170]],
    5: [[450, 780], [930, 1170]],
    6: [[450, 780], [930, 1170]]
  };
  var DAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
  var DAYS_S = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
  var MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

  var fmt = null;
  function romeParts(date) {
    try {
      fmt = fmt || new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", weekday: "short" });
      var o = {};
      fmt.formatToParts(date).forEach(function (p) { o[p.type] = p.value; });
      var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
      return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, min: +o.minute, wd: wd };
    } catch (e) {
      return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate(), h: date.getHours(), min: date.getMinutes(), wd: date.getDay() };
    }
  }
  function hm(min) { var h = Math.floor(min / 60), m = min % 60; return h + ":" + (m < 10 ? "0" : "") + m; }

  function openStatus(now) {
    var p = romeParts(now || new Date()), t = p.h * 60 + p.min, today = HOURS[p.wd], i;
    for (i = 0; i < today.length; i++) {
      if (t >= today[i][0] && t < today[i][1]) { return { open: true, text: "Aperto ora · chiude alle " + hm(today[i][1]) }; }
    }
    for (i = 0; i < today.length; i++) {
      if (t < today[i][0]) { return { open: false, text: "Chiuso ora · riapre oggi alle " + hm(today[i][0]) }; }
    }
    for (var k = 1; k <= 7; k++) {
      var wd = (p.wd + k) % 7;
      if (HOURS[wd].length) {
        return { open: false, text: "Chiuso ora · riapre " + (k === 1 ? "domani" : DAYS[wd]) + " alle " + hm(HOURS[wd][0][0]) };
      }
    }
    return { open: false, text: "Chiuso" };
  }

  window.DS = { HOURS: HOURS, DAYS: DAYS, DAYS_S: DAYS_S, MONTHS: MONTHS, romeParts: romeParts, hm: hm, WA: WA, reduced: reduced };

  /* ---------- Menu ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var menu = document.getElementById("menu");
  var scrim = document.querySelector(".scrim");
  var lastFocus = null;

  function setMenu(open) {
    if (!menu) { return; }
    doc.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-hidden", String(!open));
    if (open) {
      lastFocus = document.activeElement;
      menu.removeAttribute("inert");
      var f = menu.querySelector(".menu__close");
      window.setTimeout(function () { f && f.focus(); }, 30);
    } else {
      menu.setAttribute("inert", "");
      if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    }
  }
  if (menuBtn && menu) {
    menu.setAttribute("inert", "");
    menuBtn.addEventListener("click", function () { setMenu(true); });
    menu.querySelector(".menu__close").addEventListener("click", function () { setMenu(false); });
    scrim.addEventListener("click", function () { setMenu(false); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) { setMenu(false); } });
    document.addEventListener("keydown", function (e) {
      if (!doc.classList.contains("menu-open")) { return; }
      if (e.key === "Escape") { setMenu(false); return; }
      if (e.key === "Tab") {
        var els = menu.querySelectorAll("a[href], button");
        var first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia("(min-width: 64em)").addEventListener("change", function (e) { if (e.matches) { setMenu(false); } });
  }

  /* ---------- Intestazione trasparente solo sopra la prima schermata ---------- */
  var header = document.querySelector(".site-header");
  if (header && header.hasAttribute("data-top")) {
    var onScroll = function () { header.classList.toggle("is-top", window.scrollY < 24); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- "Aperto ora" e riga di oggi ---------- */
  function paintStatus() {
    var s = openStatus();
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.textContent = s.text;
      el.classList.toggle("is-open", s.open);
      el.classList.toggle("is-closed", !s.open);
    });
    var wd = romeParts(new Date()).wd;
    document.querySelectorAll("[data-wd]").forEach(function (el) { el.classList.toggle("is-today", +el.getAttribute("data-wd") === wd); });
  }
  paintStatus();
  window.setInterval(paintStatus, 60000);

  /* ---------- Comparse allo scroll ---------- */
  var rv = document.querySelectorAll(".rv");
  if (rv.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      rv.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      rv.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- La torta che si compone (home) ---------- */
  var forge = document.querySelector("[data-forge]");
  if (forge && window.DolceCake) {
    var svg = forge.querySelector("svg.cake");
    DolceCake.render(svg, { tiers: 2, flavor: "cioccolato", text: "Auguri", candle: true });
    if (!reduced) {
      forge.classList.add("is-live");
      var layers = [].slice.call(svg.querySelectorAll("[data-layer]"));
      var steps = [].slice.call(forge.querySelectorAll("[data-step]"));
      var dots = [].slice.call(forge.querySelectorAll("[data-dot]"));
      var ticking = false, lastActive = -1;
      var clamp = function (v) { return Math.max(0, Math.min(1, v)); };
      var ease = function (t) { return 1 - Math.pow(1 - t, 3); };

      var update = function () {
        ticking = false;
        var r = forge.getBoundingClientRect(), vh = window.innerHeight;
        var total = r.height - vh, lead = vh * 0.35;
        var p = clamp((lead - r.top) / (total + lead));
        var t = p * 4.2;
        layers.forEach(function (g, i) { g.style.setProperty("--p", ease(clamp(t - i)).toFixed(3)); });
        var active = Math.max(0, Math.min(3, Math.floor(t)));
        if (active !== lastActive) {
          lastActive = active;
          steps.forEach(function (s, i) { s.classList.toggle("is-active", i === active); });
          dots.forEach(function (d, i) {
            d.classList.toggle("is-done", i <= active);
            if (i === active) { d.setAttribute("aria-current", "step"); } else { d.removeAttribute("aria-current"); }
          });
        }
        svg.classList.toggle("is-lit", t > 3.6);
      };
      var request = function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } };
      window.addEventListener("scroll", request, { passive: true });
      window.addEventListener("resize", request);
      update();

      dots.forEach(function (d, i) {
        d.addEventListener("click", function () {
          var r = forge.getBoundingClientRect(), vh = window.innerHeight;
          var total = r.height - vh, lead = vh * 0.35;
          var p = (i + 0.7) / 4.2;
          var targetY = window.scrollY + r.top + (p * (total + lead)) - lead;
          window.scrollTo({ top: targetY, behavior: "smooth" });
        });
      });
    }
  }

  /* ---------- Candelina del finale ---------- */
  var candle = document.querySelector("[data-candle]");
  if (candle) {
    var hint = document.querySelector("[data-candle-hint]");
    var after = document.querySelector("[data-candle-after]");
    candle.addEventListener("click", function () {
      var off = candle.getAttribute("aria-pressed") !== "true";
      candle.setAttribute("aria-pressed", String(off));
      if (hint) { hint.textContent = off ? "Desiderio espresso. Ora ordina la torta." : "Si è riaccesa. Tocca ancora."; }
      if (after) { after.classList.toggle("is-on", off); }
    });
  }

  /* ---------- Vetrina: filtri e "cosa c'è dentro" ---------- */
  var chips = document.querySelectorAll("[data-filter]");
  if (chips.length) {
    var goods = [].slice.call(document.querySelectorAll("[data-cat]"));
    var empty = document.querySelector("[data-empty]");
    var apply = function (cat) {
      var shown = 0;
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-filter") === cat)); });
      goods.forEach(function (g) {
        var ok = cat === "tutti" || g.getAttribute("data-cat") === cat;
        if (ok) { shown++; g.hidden = false; window.requestAnimationFrame(function () { g.classList.remove("is-out"); }); }
        else {
          g.classList.add("is-out");
          window.setTimeout(function () { if (g.classList.contains("is-out")) { g.hidden = true; } }, reduced ? 0 : 230);
        }
      });
      if (empty) { empty.hidden = shown !== 0; }
    };
    chips.forEach(function (c) { c.addEventListener("click", function () { apply(c.getAttribute("data-filter")); }); });
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) { window.setTimeout(function () { target.scrollIntoView({ block: "center" }); }, 60); }
    }
  }
  document.querySelectorAll(".good__more").forEach(function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(open));
      b.querySelector("span.t").textContent = open ? "Chiudi" : "Cosa c'è dentro";
    });
  });
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    var msg = "Ciao Mockly! Ho provato il sito dimostrativo Dolce Sale (l'attività è inventata). " + a.getAttribute("data-wa");
    a.setAttribute("href", WA + "?text=" + encodeURIComponent(msg));
  });
})();
