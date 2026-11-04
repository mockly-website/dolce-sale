/* Dolce Sale — la torta in SVG.
   Serve a due punti: la torta che si compone scorrendo (home) e l'anteprima dell'ordine (ordina).
   Le forme si disegnano una volta; i colori cambiano con variabili CSS, così il passaggio è morbido. */
(function () {
  "use strict";

  // Piani: larghezze (dal basso) e altezza di ogni piano, in unità del disegno.
  var CFG = {
    1: { w: [230], h: 96 },
    2: { w: [290, 200], h: 74 },
    3: { w: [324, 244, 168], h: 60 }
  };
  var FLAVORS = ["cioccolato", "pistacchio", "limone", "fragole"];
  var BASE_Y = 366;

  function r1(n) { return Math.round(n * 10) / 10; }

  function fruit(cx, cy, r) {
    return '<g class="fruit" transform="translate(' + r1(cx) + " " + r1(cy) + ')">' +
      '<circle class="fr" r="' + r + '"/>' +
      '<circle class="fr-ring" r="' + r1(r * 0.55) + '"/>' +
      '<circle class="fr-hl" cx="' + r1(-r * 0.32) + '" cy="' + r1(-r * 0.32) + '" r="' + r1(r * 0.22) + '"/>' +
      '<path class="fr-leaf" d="M-5 ' + (-r + 2) + ' L0 ' + (-r - 6) + ' L5 ' + (-r + 2) + ' Z"/>' +
      "</g>";
  }

  function build(tiers) {
    var c = CFG[tiers], w = c.w, h = c.h;
    var base = "", cream = "", fr = "", candle = "";
    var lowH = h * 0.44, gap = h * 0.14, upH = h - lowH - gap;
    var topY = 0, plaqueW = 0;

    for (var j = 0; j < tiers; j++) {
      var wj = w[j], x = (400 - wj) / 2, yb = BASE_Y - j * h, yt = yb - h;
      base += '<rect class="sp" x="' + x + '" y="' + r1(yb - lowH) + '" width="' + wj + '" height="' + r1(lowH) + '" rx="9"/>';
      base += '<rect class="sp" x="' + x + '" y="' + r1(yt) + '" width="' + wj + '" height="' + r1(upH) + '" rx="9"/>';
      cream += '<rect class="cr" x="' + (x - 3) + '" y="' + r1(yb - lowH - gap) + '" width="' + (wj + 6) + '" height="' + r1(gap) + '" rx="' + r1(gap / 2) + '"/>';
      cream += '<rect class="cr" x="' + (x - 4) + '" y="' + r1(yt - 8) + '" width="' + (wj + 8) + '" height="16" rx="8"/>';
      // colature di crema sul bordo di ogni piano
      var drips = Math.floor(wj / 44);
      for (var k = 0; k < drips; k++) {
        var dx = x + wj * (k + 0.55) / drips - 6;
        var dh = 12 + ((k * 7 + j * 5) % 13);
        cream += '<rect class="cr" x="' + r1(dx) + '" y="' + r1(yt + 2) + '" width="12" height="' + dh + '" rx="6"/>';
      }
      var r = tiers === 1 ? 11 : (tiers === 2 ? 10 : 9);
      var capTop = yt - 8;
      if (j === tiers - 1) {
        var n = Math.max(3, Math.floor(wj / 34));
        for (var q = 0; q < n; q++) {
          var fx = x + 18 + (wj - 36) * (n === 1 ? 0.5 : q / (n - 1));
          fr += fruit(fx, capTop - r * 0.55, r);
        }
        topY = capTop;
      } else {
        var strip = (w[j] - w[j + 1]) / 2;
        fr += fruit(x + strip / 2 + 1, capTop - r * 0.55, r - 1);
        fr += fruit(400 - x - strip / 2 - 1, capTop - r * 0.55, r - 1);
      }
      if (j === 0) { plaqueW = Math.min(wj - 44, 190); }
    }

    var cy = topY - 2;
    candle = '<rect class="cd" x="197" y="' + r1(cy - 44) + '" width="6" height="46" rx="2"/>' +
      '<rect class="cd-st" x="197" y="' + r1(cy - 36) + '" width="6" height="5"/>' +
      '<rect class="cd-st" x="197" y="' + r1(cy - 22) + '" width="6" height="5"/>' +
      '<path class="wick" d="M200 ' + r1(cy - 44) + ' L200 ' + r1(cy - 50) + '"/>' +
      '<g class="flame" transform="translate(200 ' + r1(cy - 52) + ')"><path class="fl-out" d="M0 -17 C8 -8 8 1 0 5 C-8 1 -8 -8 0 -17 Z"/><path class="fl-in" d="M0 -8 C4 -3 4 1 0 3 C-4 1 -4 -3 0 -8 Z"/></g>';

    var plaqueH = Math.min(28, lowH - 4);
    var py = BASE_Y - lowH / 2 - plaqueH / 2;
    var plaque = '<g class="plaque"><rect class="pq" x="' + r1(200 - plaqueW / 2) + '" y="' + r1(py) + '" width="' + r1(plaqueW) + '" height="' + r1(plaqueH) + '" rx="6"/>' +
      '<text class="pq-t" x="200" y="' + r1(py + plaqueH / 2 + 5.5) + '" text-anchor="middle"></text></g>';

    var stand = '<g class="stand">' +
      '<path class="stand-leg" d="M188 392 Q192 414 172 426 L228 426 Q208 414 212 392 Z"/>' +
      '<ellipse class="plate" cx="200" cy="380" rx="178" ry="20"/>' +
      '<ellipse class="plate-top" cx="200" cy="374" rx="170" ry="14"/></g>';

    return { svg: stand +
      '<g class="cake__layer" data-layer="0">' + base + plaque + "</g>" +
      '<g class="cake__layer" data-layer="1">' + cream + "</g>" +
      '<g class="cake__layer" data-layer="2">' + fr + "</g>" +
      '<g class="cake__layer" data-layer="3">' + candle + "</g>",
      plaqueW: plaqueW };
  }

  function fitText(el, text, maxW) {
    var t = el.querySelector(".pq-t");
    if (!t) { return; }
    var plaque = el.querySelector(".plaque");
    t.textContent = text;
    t.removeAttribute("textLength");
    t.removeAttribute("lengthAdjust");
    plaque.classList.toggle("is-empty", !text);
    if (!text) { return; }
    var len = 0;
    try { len = t.getComputedTextLength(); } catch (e) { len = 0; }
    if (len > maxW - 16) {
      t.setAttribute("textLength", String(r1(maxW - 16)));
      t.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }
  }

  // render(svg, { tiers, flavor, text, candle })
  function render(svg, o) {
    var s = svg.__s || (svg.__s = {});
    var tiers = o.tiers || s.tiers || 1;
    if (tiers !== s.tiers) {
      var b = build(tiers);
      svg.innerHTML = b.svg;
      s.tiers = tiers; s.plaqueW = b.plaqueW; s.text = null;
      svg.classList.remove("is-pop"); void svg.getBoundingClientRect(); svg.classList.add("is-pop");
    }
    if (o.flavor && FLAVORS.indexOf(o.flavor) > -1) { svg.setAttribute("data-flavor", o.flavor); }
    if (typeof o.candle === "boolean") { svg.classList.toggle("no-candle", !o.candle); }
    if (typeof o.text === "string" && o.text !== s.text) { s.text = o.text; fitText(svg, o.text, s.plaqueW); }
  }

  window.DolceCake = { render: render };
})();
