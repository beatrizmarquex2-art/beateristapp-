// Tela de carregamento SAZONAL (Beaterista Play): troca a imagem do "carregando…" conforme o calendário brasileiro, com Carnaval e Páscoa móveis.
// Fora dos períodos (ou se o arquivo da arte não existir) fica a tela original (Paul). Script comum, sem módulo, pra rodar antes da 1ª pintura; também serve ao teste.
// Arte de cada época: assets/sazonal/<id>.webp (tela cheia 720×1280, ~50 KB; ids: carnaval, pascoa, junina, halloween, natal, anonovo). Pra pôr uma época nova: acrescente em ESTACOES e salve o arquivo.
(function (raiz) {
  var DIA = 86400000;
  var utc = function (a, m, d) { return Date.UTC(a, m - 1, d); };
  /** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher), em UTC. */
  function pascoa(ano) {
    var a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
    return utc(ano, mes, dia);
  }
  /** n-ésimo domingo do mês (Dia das Mães = 2º de maio, Dia dos Pais = 2º de agosto). */
  function domingoN(ano, mes, n) { var p = new Date(utc(ano, mes, 1)).getUTCDay(); return utc(ano, mes, 1 + ((7 - p) % 7) + (n - 1) * 7); }
  // cada época: [de, até] em ms UTC (inclusive). Ordem = prioridade (a primeira que bater vence).
  // `carrega` = tem tela de carregamento própria (assets/sazonal/<id>.webp). `oi` = o recado que acompanha o Paul da época (assets/sazonal/paul-<id>.webp e rosto-<id>.webp).
  var ESTACOES = [
    { id: 'carnaval', rotulo: 'Carnaval', oi: 'bom Carnaval! 🎭', carrega: true, de: function (a) { return pascoa(a) - 51 * DIA; }, ate: function (a) { return pascoa(a) - 46 * DIA; } }, // sexta antes até a quarta de cinzas (a Páscoa − 47 é a terça de Carnaval)
    { id: 'pascoa', rotulo: 'Páscoa', oi: 'feliz Páscoa! 🐰', carrega: true, de: function (a) { return pascoa(a) - 7 * DIA; }, ate: function (a) { return pascoa(a); } }, // semana da Páscoa
    { id: 'maes', rotulo: 'Dia das Mães', oi: 'feliz Dia das Mães! 💐', carrega: false, de: function (a) { return domingoN(a, 5, 2) - 6 * DIA; }, ate: function (a) { return domingoN(a, 5, 2); } },
    { id: 'junina', rotulo: 'Festa Junina', oi: 'bora pra festa junina! 🌽', carrega: true, de: function (a) { return utc(a, 6, 1); }, ate: function (a) { return utc(a, 6, 30); } },
    { id: 'pais', rotulo: 'Dia dos Pais', oi: 'feliz Dia dos Pais! 🎁', carrega: false, de: function (a) { return domingoN(a, 8, 2) - 6 * DIA; }, ate: function (a) { return domingoN(a, 8, 2); } },
    { id: 'criancas', rotulo: 'Dia das Crianças', oi: 'feliz Dia das Crianças! 🎈', carrega: false, de: function (a) { return utc(a, 10, 5); }, ate: function (a) { return utc(a, 10, 12); } },
    { id: 'halloween', rotulo: 'Halloween', oi: 'feliz Halloween! 🎃', carrega: true, de: function (a) { return utc(a, 10, 24); }, ate: function (a) { return utc(a, 10, 31); } },
    { id: 'natal', rotulo: 'Natal', oi: 'feliz Natal! 🎄', carrega: true, de: function (a) { return utc(a, 12, 1); }, ate: function (a) { return utc(a, 12, 26); } },
    { id: 'anonovo', rotulo: 'Ano Novo', oi: 'feliz Ano Novo! 🎆', carrega: true, de: function (a) { return utc(a, 12, 27); }, ate: function (a) { return utc(a + 1, 1, 2); } },
    { id: 'anonovo', rotulo: 'Ano Novo', oi: 'feliz Ano Novo! 🎆', carrega: true, de: function (a) { return utc(a - 1, 12, 27); }, ate: function (a) { return utc(a, 1, 2); } },
  ];
  /** A época de uma data (Date local: usa o dia do calendário do aparelho). Devolve { id, rotulo } ou null (tela original). */
  function estacaoDe(data) {
    var t = utc(data.getFullYear(), data.getMonth() + 1, data.getDate());
    for (var i = 0; i < ESTACOES.length; i++) { var e = ESTACOES[i]; if (t >= e.de(data.getFullYear()) && t <= e.ate(data.getFullYear())) return { id: e.id, rotulo: e.rotulo, oi: e.oi, carrega: e.carrega }; }
    return null;
  }
  var api = { pascoa: pascoa, estacaoDe: estacaoDe, ESTACOES: ESTACOES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (!raiz || !raiz.document) return;
  raiz.BtSazonal = api;
  try {
    var est = estacaoDe(new Date()); if (!est || !est.carrega) return; var q = /[?&]sazonal=(\w+)/.exec(raiz.location.search); if (q && q[1] === 'off') return;
    var img = new Image(); // só troca se a arte existir (arquivo ausente = fica a tela original, sem buraco)
    img.onload = function () {
      var d = raiz.document.documentElement; d.setAttribute('data-sazonal', est.id);
      d.style.setProperty('--saz-img', 'url("' + img.src + '")'); // endereço completo: o CSS fica em css/ e resolveria o relativo errado 
    };
    img.src = 'assets/sazonal/' + est.id + '.webp';
  } catch (e) { /* sem calendário: tela original */ }
})(typeof window !== 'undefined' ? window : null);
