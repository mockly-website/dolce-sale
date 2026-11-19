/* Dolce Sale — script comune. JavaScript semplice, nessuna libreria. */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA = "https://wa.me/393517578080";

  /* ---------- Orari di esempio, in minuti dalla mezzanotte (0 = domenica) ---------- */
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

  window.DS = { openStatus: openStatus, HOURS: HOURS, DAYS: DAYS, DAYS_S: DAYS_S, MONTHS: MONTHS, romeParts: romeParts, hm: hm, WA: WA, reduced: reduced };

  /* ---------- Menu da telefono ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var menu = document.getElementById("menu");
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) { setMenu(false); } });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!menu.hidden && !e.target.closest(".site-header")) { setMenu(false); }
    });
  }

  /* ---------- "Aperto ora", riga di oggi e ora del banco ---------- */
  function paint() {
    var s = openStatus();
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.textContent = s.text;
      el.classList.toggle("is-open", s.open);
      el.classList.toggle("is-closed", !s.open);
    });
    var p = romeParts(new Date());
    document.querySelectorAll("[data-wd]").forEach(function (el) { el.classList.toggle("is-today", +el.getAttribute("data-wd") === p.wd); });

    var day = document.querySelector("[data-day]");
    if (day) {
      var t = p.h * 60 + p.min, rows = day.querySelectorAll("[data-from]"), now = null;
      var openToday = HOURS[p.wd].length > 0;
      rows.forEach(function (r) { if (openToday && t >= +r.getAttribute("data-from")) { now = r; } });
      if (openToday && p.wd === 0 && t >= 780) { now = rows[rows.length - 1]; }
      rows.forEach(function (r) { r.classList.toggle("is-now", r === now); });
    }
  }
  paint();
  window.setInterval(paint, 60000);

  /* ---------- Home: dolce o sale (solo da telefono) ---------- */
  var tabs = document.querySelector(".switch-tabs");
  if (tabs) {
    var btns = [].slice.call(tabs.querySelectorAll('[role="tab"]'));
    var select = function (side, focus) {
      btns.forEach(function (b) {
        var on = b.id === "tab-" + side;
        b.setAttribute("aria-selected", String(on));
        b.tabIndex = on ? 0 : -1;
        document.getElementById(b.getAttribute("aria-controls")).hidden = !on;
        if (on && focus) { b.focus(); }
      });
    };
    tabs.hidden = false;
    select("dolce");
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () { select(b.id.slice(4)); });
      b.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          select(btns[(i + 1) % btns.length].id.slice(4), true);
        }
      });
    });
    document.querySelectorAll("[data-side]").forEach(function (a) {
      a.addEventListener("click", function () { select(a.getAttribute("data-side")); });
    });
  }

  /* ---------- Comparse allo scroll ---------- */
  var rv = document.querySelectorAll(".rv");
  if (rv.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      rv.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
      rv.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Banco: filtri ---------- */
  var filters = document.querySelectorAll("[data-filter]");
  if (filters.length) {
    var goods = [].slice.call(document.querySelectorAll("[data-cat]"));
    var empty = document.querySelector("[data-empty]");
    var apply = function (cat) {
      var shown = 0;
      filters.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-filter") === cat)); });
      goods.forEach(function (g) {
        var ok = cat === "tutti" || g.getAttribute("data-cat") === cat;
        if (ok) { shown++; g.hidden = false; window.requestAnimationFrame(function () { g.classList.remove("is-out"); }); }
        else {
          g.classList.add("is-out");
          window.setTimeout(function () { if (g.classList.contains("is-out")) { g.hidden = true; } }, reduced ? 0 : 200);
        }
      });
      if (empty) { empty.hidden = shown !== 0; }
    };
    filters.forEach(function (c) { c.addEventListener("click", function () { apply(c.getAttribute("data-filter")); }); });
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target && target.tagName === "DETAILS") { target.open = true; }
      if (target && target.querySelector("details")) { target.querySelector("details").open = true; }
    }
  }

  /* ---------- Link WhatsApp con messaggio ---------- */
  document.querySelectorAll("[data-wa]").forEach(function (a) {
    var msg = "Ciao Mockly! Ho provato il sito dimostrativo Dolce Sale (l'attività è inventata). " + a.getAttribute("data-wa");
    a.setAttribute("href", WA + "?text=" + encodeURIComponent(msg));
  });
})();
