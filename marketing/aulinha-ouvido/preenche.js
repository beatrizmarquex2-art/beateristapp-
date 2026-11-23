// Preenchedor de páginas com espaço sobrando (regra do caderno: nenhuma página fica com mais de ~40% em branco).
// Depois da paginação, toda página abaixo do limite recebe blocos de TREINO (pautas, leitura, rotina, progresso, diário), na ordem de uma lista
// específica do assunto (por regex no título) e depois uma lista genérica. Cada bloco só entra se couber; para quando a página chega em ~80%.
// Blocos NÃO são exercícios numerados (não entram no gabarito): são práticas que se resolvem sozinhas ou na própria folha.
import { caixa, tabela, cx, lin } from './lib.js';
import { compasso, partitura } from './bat.js';

const alt = (s) => { let k = 0; return s.split('').map((c) => (c === '.' ? '.' : (k++ % 2 === 0 ? 'D' : 'E'))).join(''); };
const caixaLin = (s, passos = 16) => compasso(passos, { sn: s }, { maos: alt(s) });
const prog = (n = 6) => `<div class="caixa tracejada"><h3>progresso</h3><p class="peq">♩ = 60: ${cx().repeat(n)} &nbsp; ♩ = 80: ${cx().repeat(n)} &nbsp; ♩ = 100: ${cx().repeat(n)}<br>marque uma caixinha a cada vez que tocar sem errar, com metrônomo.</p></div>`;
const vazias = (n, t = 'escreva aqui') => `<div class="caixa tracejada"><h3>${t}</h3>${Array.from({ length: n }, () => partitura(compasso(16, {}), { conta: true })).join('')}</div>`;
const leia = (titulo, itens, rot, { conta = true } = {}, ini = 1) => `<div class="caixa"><h3>${titulo}</h3>${itens.map((it, i) => `<div class="padrao"><p class="peq"><b>${rot}${i + ini}</b>${it[1] ? ` · ${it[1]}` : ''}</p>${partitura(it[0], { conta: conta && i === 0 })}</div>`).join('')}</div>`;
const diario = (n = 4) => `<div class="caixa"><h3>diário de treino</h3>${tabela(['dia', 'o que treinei', 'andamento', 'como foi?'], Array.from({ length: n }, () => ['&nbsp;', '', '', '']))}</div>`;
const notas = (n = 4, t = 'minhas anotações') => `<div class="caixa"><h3>${t}</h3>${'<div class="linha"></div>'.repeat(n)}</div>`;
const grv = (hh, sn, bd) => compasso(16, { hh, sn, bd });
const BASE = { sn: '....x.......x...', bd: 'x.......x.......' };

/* ---- blocos específicos por assunto ---- */
const ESPECIFICOS = [
  [/pad de estudo/i, [
    () => caixa('rotina de 10 minutos no pad', tabela(['tempo', 'o que tocar', 'como'], [['2 min', 'singles lentos (D E D E)', '♩ = 60, som igual nas duas mãos'], ['3 min', 'rebote: deixe a baqueta voltar', 'sem apertar, só soltar'], ['3 min', 'acento no tempo 1', 'acento alto, o resto baixinho'], ['2 min', 'duplos (D D E E)', 'o 2º toque é o rebote']])),
    () => leia('3 exercícios pra fazer no pad', [[caixaLin('x.x.x.x.x.x.x.x.'), 'colcheias alternadas (D E D E…)'], [compasso(16, { sn: 'xxxxxxxxxxxxxxxx' }, { maos: 'DEDEDEDEDEDEDEDE', acentos: '>...>...>...>...' }), 'semicolcheias com acento em cada tempo'], [compasso(16, { sn: 'xxxxxxxxxxxxxxxx' }, { maos: 'DDEEDDEEDDEEDDEE' }), 'duplos: o 2º toque é o rebote']], 'pad '),
    () => prog(), () => notas(3, 'como o pad respondeu hoje?'),
  ]],
  [/moeller/i, [
    () => caixa('quando usar o Moeller', tabela(['situação', 'por quê'], [['acentos que alternam as mãos', 'o chicote dá o acento sem esforço'], ['semicolcheias e tercinas rápidas', 'poupa força e evita tensão no braço'], ['dinâmica de forte pra fraco', 'o movimento cresce ou diminui junto']])),
    () => leia('treine o movimento na pauta', [[compasso(12, { sn: 'xxxxxxxxxxxx' }, { maos: 'DddEeeDddEee', acentos: '>..>..>..>..' }), 'tercinas: acento – toque – toque'], [compasso(16, { sn: 'xxxxxxxxxxxxxxxx' }, { maos: 'DdEeDdEeDdEeDdEe', acentos: '>.>.>.>.>.>.>.>.' }), 'semicolcheias: acento + toque, trocando de mão'], [compasso(8, { sn: 'xxxxxxxx' }, { maos: 'DdEeDdEe', acentos: '>.>.>.>.' }), 'colcheias, mais devagar']], 'M', { conta: false }),
    () => prog(), () => notas(3, 'onde senti tensão no braço?'),
  ]],
  [/leitura rítmica 2/i, [
    () => leia('mais 4 linhas de leitura', [[caixaLin('.x.x.x.x.x.x.x.x'), 'só contratempos (o "e" e o "a" de cada tempo)'], [caixaLin('x..xx..xx..xx..x'), 'notas no tempo e no "a" (síncope): D E D E…'], [caixaLin('x.xx.xx.xx.xx.xx'), 'a pausa muda de lugar a cada tempo'], [caixaLin('.xxx.xxx.xxx.xxx'), 'pausa no tempo, notas no "e", "&" e "a"']], '2.', 5, { conta: true }),
    () => caixa('fale o ritmo antes de tocar', tabela(['o que você lê', 'o que você fala'], [['semínima', '<b>ta</b>'], ['colcheias', '<b>ta-ta</b>'], ['semicolcheias', '<b>ta-ka-di-mi</b>'], ['pausa de semicolcheia', '(silêncio) · bate palma só nas notas']]) + '<p class="peq">fale e bata palmas no ritmo, depois toque na caixa. a mão continua o movimento nas pausas!</p>'),
    () => prog(),
  ]],
  [/independência do bumbo/i, [
    () => leia('leia e toque: o bumbo muda, o resto fica', [[grv('x.x.x.x.x.x.x.x.', BASE.sn, 'x.....x.x.......'), 'bumbo em 1, "&" do 2 e 3'], [grv('x.x.x.x.x.x.x.x.', BASE.sn, 'x...x.....x.....'), 'bumbo em 1, 2 e "&" do 3'], [grv('x.x.x.x.x.x.x.x.', BASE.sn, 'x.x.....x.x.....'), 'bumbo em 1, "&" do 1, 3 e "&" do 3'], [grv('x.x.x.x.x.x.x.x.', BASE.sn, 'x.....x.x.....x.'), 'bumbo em 1, "&" do 2, 3 e "&" do 4']], 'P', {}),
    () => caixa('tradução dos passos (1 compasso = 16 passos)', tabela(null, [['passo', ...Array.from({ length: 16 }, (_, i) => i)], ['conta', ...['1', 'e', '&', 'a', '2', 'e', '&', 'a', '3', 'e', '&', 'a', '4', 'e', '&', 'a']]], 'compacta') + '<p class="peq">use esta régua pra converter a lista de passos do bumbo em palavras (tempo = 0, 4, 8, 12).</p>'),
    () => vazias(2, 'monte o seu: bumbo em 3 posições diferentes'), () => prog(),
  ]],
];
/* ---- blocos gerais (qualquer assunto) ---- */
const GERAL = [
  () => vazias(2, 'crie a sua variação (escreva na pauta e toque)'), () => prog(), () => diario(4), () => notas(4), () => vazias(2, 'mais duas pautas pra escrever'),
];
/* caderno de harmonia/melodia: sem pauta de bateria */
const GERAL_MUSICA = [
  () => `<div class="caixa tracejada"><h3>meu treino de hoje</h3><p class="peq">${cx(' ouvi e cantei os exemplos')}<br>${cx(' toquei no instrumento')}<br>${cx(' escrevi um exemplo meu')}<br>${cx(' expliquei em voz alta pra alguém (ou pro Paul)')}</p></div>`,
  () => notas(5, 'resumo com as minhas palavras'), () => notas(4, 'dúvidas pra levar na aula'),
];

const cheia = (pg) => { const top = pg.querySelector('.top').getBoundingClientRect().bottom; const rod = pg.querySelector('.rod').getBoundingClientRect().top; const fs = [...pg.children].filter((c) => !c.classList.contains('top') && !c.classList.contains('rod')); const fim = Math.max(...fs.map((c) => c.getBoundingClientRect().bottom)); return (fim - top) / (rod - top); };
/** Preenche as páginas abaixo de `limite` (padrão 0.6). Devolve [[nº da página, antes, depois, blocos usados]]. */
export function preenche(doc, { limite = 0.6, alvo = 0.8, musica = false } = {}) {
  const feito = [];
  [...doc.querySelectorAll('.pg')].forEach((pg, i) => {
    if (/\b(capa|anot|sec)\b/.test(pg.className) || pg.dataset.livre || !pg.querySelector('.rod')) return;
    const antes = cheia(pg); if (antes >= limite) return;
    const rod = pg.querySelector('.rod'); const ref = pg.querySelector('h2')?.textContent || ''; const tit = `${ref} ${pg.querySelector('.top span:last-child')?.textContent || ''}`;
    const esp = musica ? [] : (ESPECIFICOS.find(([re]) => re.test(tit)) || [null, []])[1];
    const fila = [...esp, ...(musica ? GERAL_MUSICA : GERAL)]; let usados = 0;
    for (const fn of fila) {
      if (cheia(pg) >= alvo) break;
      const d = document.createElement('div'); d.className = 'extra'; d.innerHTML = fn(); rod.before(d);
      if (pg.scrollHeight - pg.clientHeight > 2) d.remove(); else usados++;
    }
    feito.push([i + 1, Number(antes.toFixed(2)), Number(cheia(pg).toFixed(2)), usados]);
  });
  return feito;
}
