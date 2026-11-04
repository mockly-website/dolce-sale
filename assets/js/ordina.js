/* Dolce Sale — configuratore della torta (pagina "Ordina una torta").
   Tutto resta nel browser: alla fine prepara un messaggio WhatsApp a Mockly. */
(function () {
  "use strict";
  var form = document.getElementById("ordina");
  var DS = window.DS;
  if (!form || !DS || !window.DolceCake) { return; }

  var svg = document.querySelector("svg.cake");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var range = $("#porzioni"), outN = $("[data-porzioni-out]"), outP = $("[data-piani-out]");
  var scritta = $("#scritta"), count = $("[data-count]"), candelina = $("#candelina");
  var daysBox = $("#days"), ora = $("#ora"), moreBtn = $("[data-days-more]");
  var nome = $("#nome"), note = $("#note");
  var priceEl = $("[data-price]"), submitBtn = $("[data-submit]");
  var summary = $("#summary"), summaryDl = $("[data-summary]"), waSend = $("#wa-send");
  var pvSize = $("[data-pv-size]"), pvFlavor = $("[data-pv-flavor]"), pickInfo = $("[data-pick-info]");

  var FLAVOR = { cioccolato: "Cioccolato", pistacchio: "Pistacchio", limone: "Limone e panna", fragole: "Fragole e panna" };
  var PER_PORTION = { cioccolato: 2.8, pistacchio: 3.6, limone: 2.6, fragole: 3.0 };
  var BASE = 6, WRITING = 2, CANDLE = 1;
  var MAX_TEXT = 28;
  var TEXT_OK = /^[\p{L}\p{N} '’.,!&\-]*$/u;

  function tiersFor(n) { return n <= 10 ? 1 : (n <= 20 ? 2 : 3); }
  function euro(n) { return "€ " + n.toFixed(2).replace(".", ","); }
  function gusto() { return form.querySelector('input[name="gusto"]:checked').value; }
  function pad(n) { return n < 10 ? "0" + n : String(n); }

  /* ---------- Ritiro: 48 ore di preavviso, solo nei giorni e nelle ore di apertura ---------- */
  var ep = DS.romeParts(new Date(Date.now() + 48 * 3600 * 1000));
  var earliestMin = Math.ceil((ep.h * 60 + ep.min) / 30) * 30;
  var days = [];

  function slotsFor(wd, first) {
    var out = [];
    DS.HOURS[wd].forEach(function (iv) {
      for (var m = iv[0]; m <= iv[1] - 30; m += 30) { if (!first || m >= earliestMin) { out.push(m); } }
    });
    return out;
  }
  for (var k = 0; k < 40 && days.length < 14; k++) {
    var d = new Date(Date.UTC(ep.y, ep.m - 1, ep.d + k));
    var wd = d.getUTCDay();
    var sl = slotsFor(wd, k === 0);
    if (sl.length) {
      days.push({ key: d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()), wd: wd, d: d.getUTCDate(), m: d.getUTCMonth(), slots: sl });
    }
  }

  function dayLong(x) { return DS.DAYS[x.wd] + " " + x.d + " " + DS.MONTHS[x.m]; }

  function buildDays() {
    if (!days.length) { pickInfo.textContent = "Al momento non ci sono date disponibili."; return; }
    var first = days[0];
    pickInfo.innerHTML = "Servono 48 ore: la prima data utile è <strong>" + dayLong(first) + "</strong>, dalle " + DS.hm(first.slots[0]) + ".";
    var html = "";
    days.forEach(function (x, i) {
      html += '<div class="day"' + (i >= 6 ? ' data-extra hidden' : "") + '><input type="radio" name="giorno" id="d-' + x.key + '" value="' + x.key + '"><label for="d-' + x.key + '">' +
        DS.DAYS_S[x.wd] + " <small>" + x.d + " " + DS.MONTHS[x.m].slice(0, 3) + "</small></label></div>";
    });
    daysBox.innerHTML = html;
    if (days.length > 6) { moreBtn.hidden = false; }
  }
  buildDays();

  moreBtn.addEventListener("click", function () {
    daysBox.querySelectorAll("[data-extra]").forEach(function (el) { el.hidden = false; });
    moreBtn.hidden = true;
  });

  function selectedDay() {
    var c = form.querySelector('input[name="giorno"]:checked');
    if (!c) { return null; }
    return days.filter(function (x) { return x.key === c.value; })[0] || null;
  }

  function fillHours() {
    var x = selectedDay();
    var keep = ora.value;
    if (!x) { ora.disabled = true; ora.innerHTML = '<option value="">Prima scegli il giorno</option>'; return; }
    var opts = '<option value="">Scegli l\'ora</option>';
    x.slots.forEach(function (m) { opts += '<option value="' + m + '">' + DS.hm(m) + "</option>"; });
    ora.innerHTML = opts;
    ora.disabled = false;
    if (keep && x.slots.indexOf(+keep) > -1) { ora.value = keep; }
  }

  /* ---------- Aggiornamento dell'anteprima e del prezzo ---------- */
  var lastPrice = null;
  function total() {
    var n = +range.value, g = gusto();
    return BASE + n * PER_PORTION[g] + (scritta.value.trim() ? WRITING : 0) + (candelina.checked ? CANDLE : 0);
  }
  function refresh() {
    var n = +range.value, t = tiersFor(n), g = gusto();
    outN.textContent = n;
    outP.textContent = t + (t === 1 ? " piano" : " piani");
    pvSize.textContent = n + " porzioni · " + t + (t === 1 ? " piano" : " piani");
    pvFlavor.textContent = FLAVOR[g];
    count.textContent = scritta.value.length + "/" + MAX_TEXT;
    DolceCake.render(svg, { tiers: t, flavor: g, text: scritta.value.trim(), candle: candelina.checked });
    var p = euro(total());
    if (p !== lastPrice) {
      priceEl.textContent = p;
      if (lastPrice !== null && !DS.reduced) { priceEl.animate([{ transform: "scale(1.12)" }, { transform: "scale(1)" }], { duration: 180, easing: "ease-out" }); }
      lastPrice = p;
    }
  }

  function setPorzioni(v) {
    v = Math.max(+range.min, Math.min(+range.max, v));
    range.value = v;
    refresh();
  }

  range.addEventListener("input", refresh);
  form.querySelectorAll("[data-step]").forEach(function (b) {
    b.addEventListener("click", function () { setPorzioni(+range.value + +b.getAttribute("data-step")); });
  });
  form.querySelectorAll('input[name="gusto"]').forEach(function (r) { r.addEventListener("change", refresh); });
  scritta.addEventListener("input", function () { clearError(scritta, "scritta-err"); refresh(); });
  candelina.addEventListener("change", refresh);
  daysBox.addEventListener("change", function () { clearError(ora, "ritiro-err"); fillHours(); });
  ora.addEventListener("change", function () { clearError(ora, "ritiro-err"); });
  nome.addEventListener("input", function () { clearError(nome, "nome-err"); });

  /* ---------- Controlli ---------- */
  function setError(input, id, msg) {
    var e = document.getElementById(id);
    e.textContent = msg;
    if (input) { input.setAttribute("aria-invalid", "true"); }
  }
  function clearError(input, id) {
    document.getElementById(id).textContent = "";
    if (input) { input.removeAttribute("aria-invalid"); }
  }

  function validate() {
    var first = null, ok = true;
    var t = scritta.value.trim();
    clearError(scritta, "scritta-err"); clearError(ora, "ritiro-err"); clearError(nome, "nome-err");
    if (!TEXT_OK.test(t)) {
      setError(scritta, "scritta-err", "Nella scritta puoi usare lettere, numeri e . , ! & -");
      ok = false; first = first || scritta;
    } else if (t.length > MAX_TEXT) {
      setError(scritta, "scritta-err", "La scritta può avere al massimo " + MAX_TEXT + " caratteri.");
      ok = false; first = first || scritta;
    }
    var x = selectedDay();
    if (!x) {
      setError(ora, "ritiro-err", "Scegli il giorno del ritiro.");
      ok = false; first = first || form.querySelector('input[name="giorno"]') || ora;
    } else if (!ora.value) {
      setError(ora, "ritiro-err", "Scegli l'ora del ritiro.");
      ok = false; first = first || ora;
    }
    if (nome.value.trim().length < 2) {
      setError(nome, "nome-err", "Scrivi il tuo nome, così sappiamo a chi intestare l'ordine.");
      ok = false; first = first || nome;
    }
    return { ok: ok, first: first };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = validate();
    if (!v.ok) {
      var target = v.first;
      var holder = target.closest(".field") || target;
      holder.scrollIntoView({ behavior: DS.reduced ? "auto" : "smooth", block: "center" });
      window.setTimeout(function () { target.focus({ preventScroll: true }); }, 250);
      return;
    }
    var label = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Preparo il riepilogo…";
    window.setTimeout(function () {
      showSummary();
      submitBtn.disabled = false;
      submitBtn.textContent = "Rivedi l'ordine";
    }, DS.reduced ? 0 : 450);
  });

  function showSummary() {
    var n = +range.value, t = tiersFor(n), g = gusto(), x = selectedDay();
    var text = scritta.value.trim();
    var rows = [
      ["Torta", FLAVOR[g] + ", " + n + " porzioni, " + t + (t === 1 ? " piano" : " piani")],
      ["Scritta", text ? "“" + text + "”" : "Nessuna"],
      ["Candelina", candelina.checked ? "Sì" : "No"],
      ["Ritiro", dayLong(x) + ", alle " + DS.hm(+ora.value)],
      ["Nome", nome.value.trim()]
    ];
    if (note.value.trim()) { rows.push(["Note", note.value.trim()]); }
    rows.push(["Totale di esempio", euro(total())]);
    summaryDl.innerHTML = "";
    rows.forEach(function (r) {
      var dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = r[0]; dd.textContent = r[1];
      summaryDl.appendChild(dt); summaryDl.appendChild(dd);
    });
    var msg = "Ciao Mockly! Sto provando il sito dimostrativo Dolce Sale (l'attività è inventata).\n\nOrdine di prova:\n" +
      rows.map(function (r) { return "• " + r[0] + ": " + r[1]; }).join("\n") +
      "\n\nVorrei sapere come funziona un sito così per il mio lavoro.";
    waSend.setAttribute("href", DS.WA + "?text=" + encodeURIComponent(msg));
    summary.hidden = false;
    summary.scrollIntoView({ behavior: DS.reduced ? "auto" : "smooth", block: "start" });
    window.setTimeout(function () { summary.focus({ preventScroll: true }); }, 300);
  }

  $("[data-edit]").addEventListener("click", function () {
    summary.hidden = true;
    form.querySelector(".field").scrollIntoView({ behavior: DS.reduced ? "auto" : "smooth", block: "start" });
  });

  /* ---------- Parametri nell'indirizzo (dalla vetrina) ---------- */
  var qs = new URLSearchParams(location.search);
  var qg = qs.get("gusto");
  if (qg && FLAVOR[qg]) { document.getElementById("g-" + qg).checked = true; }
  var qp = parseInt(qs.get("porzioni"), 10);
  if (qp) { setPorzioni(qp); } else { refresh(); }
  fillHours();
})();
