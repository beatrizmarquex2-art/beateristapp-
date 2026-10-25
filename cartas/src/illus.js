/* Cartas de Groove · ILUSTRAÇÕES dos instrumentos (jogo 1). Traço de nanquim + cores da paleta, desenhado à mão em SVG.
   Cada desenho segue a forma real do instrumento (proporção, ferragens, platinelas), sem ícone genérico. */
(function (root) {
  'use strict';
  var K = '#141414', G = '#C5A052', S = '#BFC3C7', P = '#F3F0E8', N = '#142B46', W = '#9C6B3A', R = '#7d1d22';
  var sw = 'stroke="' + K + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
  function jingle(cx, cy) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="6" ry="2.4" fill="' + S + '" ' + sw + '/><ellipse cx="' + cx + '" cy="' + (cy + 3) + '" rx="6" ry="2.4" fill="' + S + '" ' + sw + '/>'; }
  var D = {
    pandeiro: function () {
      var j = ''; [[-38, 4], [-14, 21], [14, 21], [38, 4]].forEach(function (p) { j += '<rect x="' + (60 + p[0] - 8) + '" y="' + (66 + p[1] - 2) + '" width="16" height="11" fill="' + K + '"/>' + jingle(60 + p[0], 68 + p[1]); });
      return '<ellipse cx="60" cy="70" rx="50" ry="28" fill="' + W + '" ' + sw + '/><ellipse cx="60" cy="58" rx="50" ry="28" fill="' + P + '" ' + sw + '/><path d="M10 58 v12 M110 58 v12" ' + sw + '/>' + j + '<ellipse cx="60" cy="58" rx="42" ry="22" fill="none" stroke="' + K + '" stroke-opacity=".25" stroke-width="1.5"/>';
    },
    tamborim: function () {
      return '<ellipse cx="54" cy="70" rx="38" ry="21" fill="' + K + '" ' + sw + '/><ellipse cx="54" cy="60" rx="38" ry="21" fill="' + P + '" ' + sw + '/><path d="M16 60 v10 M92 60 v10" ' + sw + '/>' +
        [-26, -9, 9, 26].map(function (x) { return '<path d="M' + (54 + x) + ' ' + (78 - Math.abs(x) * 0.25) + ' v5" stroke="' + S + '" stroke-width="3"/>'; }).join('') +
        '<path d="M70 30 L112 12" stroke="' + K + '" stroke-width="7" stroke-linecap="round"/><path d="M70 30 L112 12" stroke="' + G + '" stroke-width="3.6" stroke-linecap="round"/><path d="M64 33 l-6 3" ' + sw + '/>';
    },
    agogo: function () {
      return '<path d="M30 92 L40 40 Q42 34 48 34 L52 34 Q58 34 60 40 L70 92 Z" fill="' + S + '" ' + sw + '/><ellipse cx="50" cy="92" rx="20" ry="6" fill="' + K + '"/>' +
        '<path d="M72 92 L79 52 Q81 46 86 46 L90 46 Q95 46 96 52 L104 92 Z" fill="' + S + '" ' + sw + '/><ellipse cx="88" cy="92" rx="16" ry="5" fill="' + K + '"/>' +
        '<path d="M50 34 Q50 12 70 12 Q88 12 88 46" fill="none" stroke="' + K + '" stroke-width="5"/><path d="M50 34 Q50 12 70 12 Q88 12 88 46" fill="none" stroke="' + S + '" stroke-width="2"/><path d="M40 60 h18 M80 66 h14" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>';
    },
    ganza: function () {
      return '<g transform="rotate(-22 60 60)"><rect x="18" y="46" width="84" height="28" rx="4" fill="' + S + '" ' + sw + '/><ellipse cx="18" cy="60" rx="5" ry="14" fill="' + P + '" ' + sw + '/><ellipse cx="102" cy="60" rx="5" ry="14" fill="' + S + '" ' + sw + '/>' +
        '<path d="M26 52 h70" stroke="#fff" stroke-width="3" stroke-opacity=".8"/><path d="M40 46 v28 M80 46 v28" stroke="' + K + '" stroke-width="1.6" stroke-opacity=".5"/></g>';
    },
    triangulo: function () {
      // triângulo com a ponta de baixo à esquerda aberta, pendurado num cordão, e a baqueta de metal ao lado
      var path = 'M27 84 L58 24 L100 98 L34 98';
      return '<path d="M58 24 L58 8" stroke="' + R + '" stroke-width="2.4"/><circle cx="58" cy="6" r="3" fill="none" stroke="' + K + '" stroke-width="2"/>' +
        '<path d="' + path + '" fill="none" stroke="' + K + '" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><path d="' + path + '" fill="none" stroke="' + S + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<path d="M86 30 L114 58" stroke="' + K + '" stroke-width="4.4" stroke-linecap="round"/><path d="M86 30 L114 58" stroke="' + S + '" stroke-width="1.6"/>';
    },
    surdo: function () {
      var lugs = ''; [-34, -20, -6, 8, 22, 36].forEach(function (x) { lugs += '<path d="M' + (60 + x) + ' ' + (32 + Math.abs(x) * 0.18) + ' V' + (92 + Math.abs(x) * 0.18) + '" stroke="' + S + '" stroke-width="3"/><rect x="' + (57 + x) + '" y="' + (58 + Math.abs(x) * 0.18) + '" width="6" height="9" rx="1" fill="' + S + '" ' + sw + '/>'; });
      return '<path d="M18 30 V94 Q60 112 102 94 V30" fill="' + N + '" ' + sw + '/>' + lugs + '<ellipse cx="60" cy="30" rx="42" ry="12" fill="' + P + '" ' + sw + '/><path d="M18 34 Q60 50 102 34 M18 90 Q60 106 102 90" fill="none" stroke="' + S + '" stroke-width="4"/>' +
        '<path d="M86 18 L112 6" stroke="' + K + '" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="84" cy="20" rx="7" ry="6" fill="' + G + '" ' + sw + '/>';
    },
    conga: function () {
      var lugs = ''; [-17, -6, 6, 17].forEach(function (x) { lugs += '<path d="M' + (60 + x) + ' 24 V' + (40 + Math.abs(x) * 0.1) + '" stroke="' + S + '" stroke-width="3"/><circle cx="' + (60 + x) + '" cy="' + (42 + Math.abs(x) * 0.1) + '" r="2.4" fill="' + S + '" ' + sw + '/>'; });
      return '<path d="M38 22 Q30 58 40 82 Q44 96 48 108 H72 Q76 96 80 82 Q90 58 82 22 Z" fill="' + W + '" ' + sw + '/><path d="M46 30 Q40 60 50 102" stroke="' + K + '" stroke-opacity=".3" stroke-width="2" fill="none"/>' + lugs +
        '<ellipse cx="60" cy="22" rx="22" ry="7" fill="' + P + '" ' + sw + '/><path d="M38 26 Q60 34 82 26" fill="none" stroke="' + S + '" stroke-width="3.4"/><path d="M48 108 Q60 112 72 108" fill="none" stroke="' + K + '" stroke-width="2.4"/>';
    },
    bongo: function () {
      return '<path d="M14 46 L20 92 H48 L54 46 Z" fill="' + W + '" ' + sw + '/><ellipse cx="34" cy="46" rx="20" ry="7" fill="' + P + '" ' + sw + '/>' +
        '<path d="M68 52 L72 92 H98 L104 52 Z" fill="' + W + '" ' + sw + '/><ellipse cx="86" cy="52" rx="18" ry="6" fill="' + P + '" ' + sw + '/>' +
        '<rect x="50" y="62" width="20" height="14" fill="' + G + '" ' + sw + '/><path d="M16 50 Q34 58 52 50 M70 56 Q86 62 102 56" fill="none" stroke="' + S + '" stroke-width="3"/>';
    },
    cajon: function () {
      return '<path d="M30 20 L84 20 L102 30 L102 110 L48 110 L30 100 Z" fill="' + W + '" ' + sw + '/><path d="M30 20 L48 30 L102 30 M48 30 V110" fill="none" ' + sw + '/>' +
        '<rect x="52" y="34" width="46" height="72" fill="' + G + '" stroke="' + K + '" stroke-width="2"/>' +
        [[56, 38], [94, 38], [56, 102], [94, 102], [56, 70], [94, 70]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.6" fill="' + K + '"/>'; }).join('') +
        '<ellipse cx="39" cy="62" rx="5" ry="10" fill="' + K + '" transform="skewY(20) translate(0 -14)"/><path d="M58 50 Q75 46 92 52 M58 80 Q76 76 92 84" stroke="' + K + '" stroke-opacity=".25" stroke-width="1.5" fill="none"/>';
    },
    clave: function () {
      function stick(rot) { return '<g transform="rotate(' + rot + ' 60 60)"><rect x="14" y="53" width="92" height="14" rx="7" fill="' + W + '" ' + sw + '/><path d="M22 57 h74" stroke="#fff" stroke-opacity=".4" stroke-width="2"/></g>'; }
      return stick(-24) + stick(18);
    },
    cowbell: function () {
      return '<path d="M38 26 L82 26 L96 98 L24 98 Z" fill="' + S + '" ' + sw + '/><path d="M24 98 Q60 106 96 98" fill="' + K + '" ' + sw + '/><path d="M44 34 L36 90" stroke="#fff" stroke-opacity=".7" stroke-width="3"/>' +
        '<rect x="52" y="12" width="16" height="16" rx="2" fill="' + K + '"/><circle cx="60" cy="20" r="3" fill="' + S + '"/><path d="M68 20 h34" stroke="' + K + '" stroke-width="4" stroke-linecap="round"/>';
    },
    chocalho: function () {
      var j = ''; [32, 52, 72].forEach(function (y) { [28, 46, 64, 82].forEach(function (x) { j += jingle(x, y); }); });
      return '<rect x="14" y="22" width="84" height="64" rx="4" fill="none" stroke="' + K + '" stroke-width="5"/><rect x="14" y="22" width="84" height="64" rx="4" fill="none" stroke="' + S + '" stroke-width="2"/>' +
        [32, 52, 72].map(function (y) { return '<path d="M14 ' + (y + 1.5) + ' H98" stroke="' + K + '" stroke-width="1.8"/>'; }).join('') + j +
        '<rect x="98" y="46" width="18" height="12" rx="4" fill="' + K + '"/>';
    },
  };
  function svg(id) {
    var f = D[id]; if (!f) return '';
    return '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + id + '">' + f() + '</svg>';
  }
  root.CGIllus = { svg: svg, ids: Object.keys(D) };
})(typeof window !== 'undefined' ? window : globalThis);
