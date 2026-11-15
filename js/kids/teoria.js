// Teoria básica com o Paul: cada sessão tem cartões clicáveis (toque pra virar e ver a explicação) e, no fim, um mini quiz de 3 perguntas.
// Estrelas: 3 de 3 = 2 ★, 2 de 3 = 1 ★ (1 vez por sessão por dia; limite de 30 ★/dia do jogo "estudos").
import { h } from '../util.js';
import { banner } from '../ui.js';
import { robo } from './robo.js';
import { audio, click } from '../audio.js';
import { symbolEl } from '../jogos/cartas-simbolos.js';
import { epiano } from '../synth.js';
import { FASES_FIGURAS, notas } from './teoria-figuras.js';

const NSV = 'http://www.w3.org/2000/svg';
const svgEl = (w, hh, inner) => { const e = document.createElementNS(NSV, 'svg'); e.setAttribute('viewBox', `0 0 ${w} ${hh}`); e.setAttribute('class', 'tf-sym'); e.setAttribute('aria-hidden', 'true'); e.innerHTML = inner; return e; };
/** Semibreve (cheia por dentro? não: vazada, sem haste) e mínima (vazada, com haste), desenhadas em SVG (fonte de música não existe em todo aparelho). */
const nt = (_x, haste) => svgEl(40, 56, `<ellipse cx="18" cy="42" rx="12" ry="8" transform="rotate(-20 18 42)" fill="none" stroke="currentColor" stroke-width="4"/>${haste ? '<line x1="29" y1="38" x2="29" y2="6" stroke="currentColor" stroke-width="3.5"/>' : ''}`);
/** As claves nasceram das letras G, F e C: é só olhar a espiral do sol, os pontinhos do fá e o "C" aberto do dó. */
const clv = (letra) => h('b', { class: 'tf-big clv' }, letra);
const emb = (a, r = Math.random) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const nota = (m, len = 0.5) => { const c = audio(); epiano(c.currentTime + 0.03, [m], len, 1); };
const batidas = (n, bpm = 90) => { const c = audio(); const t = c.currentTime + 0.05; for (let i = 0; i < n; i++) click(t + (i * 60) / bpm, i === 0 ? 2 : 1); };

/** Uma sessão: cards = [{ t: título, ic: emoji ou função que desenha, txt: explicação, som?: fn }], quiz = [{ q, ops:[3], ok:índice }, …] (sorteia 3). */
export const SESSOES = [
  { id: 'figuras', ic: '🎵', li: () => notas('ee'), nome: 'Figuras', sub: 'quanto dura cada som', cor: '#d3122f', paul: FASES_FIGURAS[0].paul, fases: FASES_FIGURAS }, // 30 aulinhas em 6 fases (teoria-figuras.js); os outros temas ainda têm 1 fase de 5
  { id: 'pausas', ic: '🤫', li: () => symbolEl('p_seminima', 'tf-sym'), nome: 'Pausas', sub: 'o silêncio também conta', cor: '#17365B', paul: 'o silêncio também tem tempo! cada figura tem a sua pausa.', cards: [
    { t: 'Pausa de semínima', ic: () => symbolEl('p_seminima', 'tf-sym'), txt: 'é um silêncio de 1 tempo, igual à semínima. a gente conta, mas não toca.' },
    { t: 'Pausa de colcheia', ic: () => symbolEl('p_colcheia', 'tf-sym'), txt: 'silêncio de meio tempo, igual à colcheia. parece um "7".' },
    { t: 'Pausa de semicolcheia', ic: () => symbolEl('p_semicolcheia', 'tf-sym'), txt: 'silêncio de um quarto de tempo, igual à semicolcheia. tem dois "ganchinhos".' },
    { t: 'Pausa de mínima', ic: () => h('b', { class: 'tf-big' }, '▬'), txt: 'silêncio de 2 tempos: um retângulo EM CIMA da 3ª linha (como um chapéu).' },
    { t: 'Pausa de semibreve', ic: () => h('b', { class: 'tf-big' }, '▬'), txt: 'silêncio de 4 tempos, ou um compasso inteiro de silêncio: um retângulo PENDURADO na 4ª linha.' }],
    quiz: [
      { q: 'o que é uma pausa?', ops: ['um silêncio que tem duração', 'uma nota bem forte', 'o fim da música'], ok: 0 },
      { q: 'uma pausa de semínima dura…', ops: ['1 tempo', '2 tempos', '4 tempos'], ok: 0 },
      { q: 'quando tem pausa, o que a gente faz?', ops: ['conta o tempo e não toca', 'toca bem baixinho', 'para de contar'], ok: 0 },
      { q: 'a pausa de colcheia tem a mesma duração de…', ops: ['uma colcheia', 'uma semibreve', 'uma mínima'], ok: 0 },
      { q: 'um compasso todo de silêncio usa a pausa de…', ops: ['semibreve', 'colcheia', 'semicolcheia'], ok: 0 }] },
  { id: 'claves', ic: '🔑', li: () => symbolEl('clave_sol', 'tf-sym'), nome: 'Claves', sub: 'a chave que abre a pauta', cor: '#EBA332', paul: 'a clave diz quais são as notas de cada linha da pauta!', cards: [
    { t: 'A pauta', ic: () => h('b', { class: 'tf-big' }, '☰'), txt: 'a pauta tem 5 linhas e 4 espaços. a gente conta de baixo pra cima: 1ª linha, 2ª linha…' },
    { t: 'Clave de sol', ic: () => clv('G'), txt: 'a clave de sol nasceu da letra G: a espiral termina na 2ª linha, onde mora a nota SOL. é a clave das notas mais agudas (voz, guitarra, mão direita do piano).' },
    { t: 'Clave de fá', ic: () => clv('F'), txt: 'a clave de fá nasceu da letra F: os dois pontinhos ficam em volta da 4ª linha, onde mora a nota FÁ. é a clave das notas graves (baixo, mão esquerda do piano).' },
    { t: 'Clave de dó', ic: () => clv('C'), txt: 'a clave de dó nasceu da letra C: o centro dela marca a nota DÓ. aparece mais pra viola, que fica no meio do caminho entre graves e agudos.' },
    { t: 'Bateria', ic: () => h('b', { class: 'tf-big small' }, '‖ ‖'), txt: 'a bateria usa a clave de percussão (dois traços em pé): cada linha é uma peça, e não uma nota.' }],
    quiz: [
      { q: 'a clave de sol marca a nota sol em qual linha?', ops: ['2ª linha', '4ª linha', '1ª linha'], ok: 0 },
      { q: 'qual clave é a das notas GRAVES?', ops: ['fá', 'sol', 'percussão'], ok: 0 },
      { q: 'quantas linhas tem a pauta?', ops: ['5', '4', '6'], ok: 0 },
      { q: 'na bateria, cada linha da pauta representa…', ops: ['uma peça', 'uma nota de piano', 'um acorde'], ok: 0 },
      { q: 'a clave de sol é boa pra notas…', ops: ['agudas', 'graves', 'só de percussão'], ok: 0 }] },
  { id: 'tempo', ic: '⏱️', li: () => h('b', { class: 'tf-li-t' }, '4/4'), nome: 'Tempo e compasso', sub: 'o pulso e a fórmula', cor: '#2a9d8f', paul: 'o pulso é o coração da música: ele bate sempre igual!', cards: [
    { t: 'Pulso', ic: () => h('b', { class: 'tf-big' }, '💓'), txt: 'é a batida constante da música, igual ao coração. a gente bate o pé no pulso.', som: () => batidas(8, 80) },
    { t: 'BPM', ic: () => h('b', { class: 'tf-big' }, '⏲️'), txt: 'BPM = batidas por minuto. 60 BPM é uma batida por segundo; 120 BPM é o dobro, bem mais rápido.', som: () => batidas(8, 120) },
    { t: 'Compasso', ic: () => h('b', { class: 'tf-big' }, '|'), txt: 'é um grupinho de tempos, separado por uma barrinha. no 4/4 cada compasso tem 4 tempos: 1, 2, 3, 4.', som: () => batidas(8, 90) },
    { t: 'Fórmula 4/4', ic: () => h('b', { class: 'tf-big' }, '4/4'), txt: 'o número de CIMA diz quantos tempos tem o compasso; o de BAIXO diz qual figura vale 1 tempo (4 = semínima).' },
    { t: 'Tempo forte', ic: () => h('b', { class: 'tf-big' }, '1 2 3 4'), txt: 'no 4/4 o 1 é o mais forte, o 3 é meio forte e o 2 e o 4 são fracos. a caixa do rock bate no 2 e no 4!', som: () => { const c = audio(); const t = c.currentTime + 0.05; [2, 1, 1.4, 1].forEach((v, i) => click(t + i * 0.55, v > 1.5 ? 2 : 1, v > 1.2 ? 1 : 0.5)); } }],
    quiz: [
      { q: 'o que é o pulso?', ops: ['a batida constante da música', 'a nota mais aguda', 'o nome da música'], ok: 0 },
      { q: 'no compasso 4/4 quantos tempos tem cada compasso?', ops: ['4', '2', '3'], ok: 0 },
      { q: '120 BPM é…', ops: ['mais rápido que 60 BPM', 'mais devagar que 60 BPM', 'igual a 60 BPM'], ok: 0 },
      { q: 'o número de cima da fórmula de compasso diz…', ops: ['quantos tempos tem o compasso', 'a velocidade', 'a clave'], ok: 0 },
      { q: 'no 4/4, qual tempo é o mais forte?', ops: ['o 1', 'o 2', 'o 4'], ok: 0 }] },
  { id: 'leitura', ic: '🎼', li: () => svgEl(56, 56, '<g stroke="currentColor" stroke-width="2.4">' + [12, 20, 28, 36, 44].map((y) => `<line x1="4" x2="52" y1="${y}" y2="${y}"/>`).join('') + '</g><ellipse cx="30" cy="32" rx="7" ry="5" transform="rotate(-20 30 32)" fill="currentColor"/><line x1="36.4" y1="30" x2="36.4" y2="6" stroke="currentColor" stroke-width="2.6"/>'), nome: 'Leitura de notas', sub: 'os nomes das notas', cor: '#7b3fe4', paul: 'sete nomes e um ciclo que se repete: dó ré mi fá sol lá si!', cards: [
    { t: 'As 7 notas', ic: () => h('b', { class: 'tf-big small' }, 'dó ré mi fá sol lá si'), txt: 'são só 7 nomes. depois do si, volta o dó, mais agudo. cada volta completa é uma oitava.', som: () => { const c = audio(); const t = c.currentTime + 0.05; [60, 62, 64, 65, 67, 69, 71, 72].forEach((m, i) => epiano(t + i * 0.32, [m], 0.5, 1)); } },
    { t: 'Linhas e espaços', ic: () => h('b', { class: 'tf-big' }, '☰'), txt: 'a nota pode ficar na linha ou no espaço entre as linhas. subindo, vai alternando: linha, espaço, linha, espaço…' },
    { t: 'Mais agudo, mais alto', ic: () => h('b', { class: 'tf-big' }, '⬆️'), txt: 'quanto mais alta a nota na pauta, mais AGUDO é o som. quanto mais baixa, mais GRAVE.', som: () => { nota(52, 0.6); setTimeout(() => nota(76, 0.6), 700); } },
    { t: 'Sustenido e bemol', ic: () => h('b', { class: 'tf-big' }, '♯ ♭'), txt: '♯ (sustenido) sobe meio tom e ♭ (bemol) desce meio tom. são as teclas pretas do piano.', som: () => { nota(60, 0.5); setTimeout(() => nota(61, 0.5), 600); } },
    { t: 'Ordem das notas', ic: () => h('b', { class: 'tf-big small' }, 'fá sol lá…'), txt: 'a ordem nunca muda: dó, ré, mi, fá, sol, lá, si e de novo dó. se você sabe a nota anterior, descobre a próxima!' }],
    quiz: [
      { q: 'qual nota vem depois do MI?', ops: ['fá', 'ré', 'sol'], ok: 0 },
      { q: 'quantos nomes de nota existem?', ops: ['7', '5', '12'], ok: 0 },
      { q: 'quanto mais alta a nota na pauta, mais…', ops: ['agudo é o som', 'grave é o som', 'longo é o som'], ok: 0 },
      { q: 'o que o sustenido (♯) faz?', ops: ['sobe meio tom', 'desce meio tom', 'segura a nota'], ok: 0 },
      { q: 'depois do SI volta qual nota?', ops: ['dó', 'lá', 'fá'], ok: 0 }] },
];
export const sessaoPorId = (id) => SESSOES.find((s) => s.id === id);

const FEITAS = 'beaterista-teoria-feitas';
const feitas = () => { try { return JSON.parse(localStorage.getItem(FEITAS) || '{}'); } catch { return {}; } };
const marca = (id, n) => { try { const f = feitas(); f[id] = Math.max(f[id] || 0, n); localStorage.setItem(FEITAS, JSON.stringify(f)); } catch { /* sem armazenamento */ } };
export const melhor = (id) => feitas()[id] || 0;
/** Fases de um tema: os temas antigos (só `cards` + `quiz`) contam como 1 fase. */
export const fasesDe = (s) => s.fases || [{ nome: s.nome, paul: s.paul, cards: s.cards, quiz: s.quiz }];
const chaveFase = (id, k) => (k ? `${id}:${k}` : id); // a fase 1 usa a chave antiga (não perde o que a criança já ganhou)
/** Estrelas que a pessoa já tem num tema (2 por fase) e o máximo. */
export const estrelasTema = (s) => { const f = fasesDe(s); return [f.reduce((n, _, k) => n + estrelasQuiz(melhor(chaveFase(s.id, k))), 0), f.length * 2]; };
/** Estrelas de um resultado do mini quiz. */
export const estrelasQuiz = (certas) => (certas >= 3 ? 2 : certas === 2 ? 1 : 0);

async function darEstrelas(id, n) { // cada sessão paga até 2 ★ na vida (só a diferença se melhorar), sem repetir
  if (!n) return 0;
  try { const E = await import('../jogos/estrelas-jogo.js'); return await E.ganhou('estudos', n, `teoria|${id.replace(':', '|')}`); } catch { return 0; }
}

/** `#/estudos/teoria` (lista) e `#/estudos/basica/<id>` (a sessão). `aoFim()` avisa a meta do dia. */
export function mount(host, parts = [], { aoFim } = {}) {
  const s = sessaoPorId(parts[0]);
  if (!s) return lista(host);
  const FS = fasesDe(s); let fi = Math.max(0, FS.findIndex((_, k) => !melhor(chaveFase(s.id, k)))); if (fi < 0) fi = 0; // abre na 1ª fase ainda sem quiz feito
  const bot = robo({ mood: 'wave', size: 84, say: '' }); let fase = 'cards'; let vistos = new Set(); let i = 0; let certas = 0; let perguntas = [];
  const corpo = h('div', { class: 'tf-corpo' }); const fala = h('p', { class: 'au-say', 'aria-live': 'polite' });
  const cabeca = h('div', { class: 'au-top' }, bot.el, h('div', { class: 'au-bubble' }, fala));
  const F = () => FS[fi];
  const quizOn = () => { fase = 'quiz'; perguntas = emb(F().quiz).slice(0, 3); i = 0; certas = 0; desenha(); };
  const irFase = (k) => { fi = k; fase = 'cards'; vistos = new Set(); desenha(); try { cabeca.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch { /* sem rolagem */ } };
  /** Trilha das fases (só quando o tema tem mais de uma): número, nome e as estrelas já ganhas. */
  const trilha = () => (FS.length < 2 ? null : h('div', { class: 'tf-fases', role: 'tablist', 'aria-label': `fases de ${s.nome}` }, ...FS.map((f, k) => { const e = estrelasQuiz(melhor(chaveFase(s.id, k)));
    return h('button', { type: 'button', role: 'tab', class: `tf-fase${k === fi ? ' on' : ''}${e ? ' feita' : ''}`, 'aria-selected': String(k === fi), 'aria-label': `fase ${k + 1}: ${f.nome}${e ? `, ${e} de 2 estrelas` : ''}`, onclick: () => irFase(k) }, h('b', {}, String(k + 1)), h('i', {}, e ? '★'.repeat(e) : '·')); })));
  function desenha() {
    corpo.style.setProperty('--c', s.cor); const f = F();
    if (fase === 'cards') {
      bot.set('wave', ''); fala.textContent = f.paul || s.paul;
      const cartoes = f.cards.map((c, k) => { const b = h('button', { type: 'button', class: `tf-card${vistos.has(k) ? ' visto' : ''}`, 'aria-expanded': String(vistos.has(k)), onclick: () => { vistos.add(k); b.classList.add('visto', 'aberto'); b.setAttribute('aria-expanded', 'true'); if (c.som) { try { c.som(); } catch { /* sem som */ } } fala.textContent = c.txt; bot.set('music', ''); atualiza(); } },
        h('span', { class: 'tf-ic' }, c.ic()), h('b', {}, c.t), h('small', {}, ''), h('em', { class: 'tf-toque' }, '👆 toque aqui')); return b; });
      const btn = h('button', { type: 'button', class: 'btn primary wide', disabled: true, onclick: quizOn }, `mini quiz (3 perguntas)`);
      // avisa onde clicar: só o PRÓXIMO cartão fechado pisca com "👆 toque aqui"; os já abertos mostram a explicação e, se tiver som, "🔊 toque pra ouvir de novo"
      const atualiza = () => { const falta = f.cards.length - vistos.size; btn.disabled = falta > 0; btn.textContent = falta > 0 ? `vire os ${falta} cartões que faltam` : 'mini quiz: 3 perguntas ▶'; btn.classList.toggle('tf-vez', falta === 0);
        const prox = f.cards.findIndex((_, k) => !vistos.has(k));
        cartoes.forEach((b, k) => { const aberto = vistos.has(k); b.classList.toggle('vez', k === prox); b.querySelector('small').textContent = aberto ? f.cards[k].txt : ''; b.querySelector('.tf-toque').textContent = aberto ? (f.cards[k].som ? '🔊 toque pra ouvir de novo' : '') : '👆 toque aqui'; }); };
      corpo.replaceChildren(...[trilha(), FS.length > 1 ? h('p', { class: 'tf-fase-t' }, `fase ${fi + 1} de ${FS.length} · ${f.nome}`) : null, h('div', { class: 'tf-cards' }, ...cartoes), btn].filter(Boolean)); atualiza();
    } else if (fase === 'quiz') {
      const q = perguntas[i]; bot.set('think', ''); fala.textContent = `pergunta ${i + 1} de 3`;
      const ops = emb(q.ops.map((t, k) => [t, k === q.ok]));
      corpo.replaceChildren(h('div', { class: 'qz-dots' }, ...perguntas.map((_, k) => h('i', { class: k < i ? 'ok' : k === i ? 'now' : '' }))), h('h3', { class: 'tf-q' }, q.q),
        h('div', { class: 'qz-ops' }, ...ops.map(([t, certo]) => h('button', { type: 'button', class: 'btn qz-op', onclick: (e) => {
          corpo.querySelectorAll('.qz-op').forEach((x) => { x.disabled = true; }); e.currentTarget.classList.add(certo ? 'certo' : 'errado'); if (!certo) corpo.querySelectorAll('.qz-op').forEach((x) => { const o = ops.find(([tt]) => tt === x.textContent); if (o && o[1]) x.classList.add('certo'); });
          if (certo) certas++; bot.set(certo ? 'cheer' : 'oops', ''); fala.textContent = certo ? 'isso mesmo!' : 'quase! a resposta certa está em verde.';
          setTimeout(() => { i++; if (i >= 3) fim(); else desenha(); }, certo ? 800 : 1700); } }, t))));
    }
  }
  async function fim() {
    fase = 'fim'; const ch = chaveFase(s.id, fi); marca(ch, certas); const est = estrelasQuiz(certas); const ganhou = await darEstrelas(ch, est); if (aoFim) aoFim(s.id);
    bot.set(certas >= 2 ? 'cheer' : 'happy', ''); fala.textContent = certas === 3 ? 'perfeito! você mandou muito bem!' : certas === 2 ? 'muito bom! mais uma e fica perfeito.' : 'bora rever os cartões e tentar de novo!';
    const proxFase = fi + 1 < FS.length ? fi + 1 : -1; const prox = SESSOES[SESSOES.findIndex((x) => x.id === s.id) + 1];
    corpo.replaceChildren(...[trilha(), h('div', { class: 'jg-result' }, h('h3', { class: 'hand' }, `${certas} de 3`), h('p', { class: 'tf-estrelas' }, '★'.repeat(est) + '☆'.repeat(2 - est)), ganhou ? h('p', {}, `+${ganhou} ★ nas suas estrelas!`) : est ? h('p', { class: 'muted' }, 'as estrelas desta fase você já ganhou.') : null),
      h('div', { class: 'jg-actions' }, proxFase >= 0 ? h('button', { class: 'btn primary', type: 'button', onclick: () => irFase(proxFase) }, `próxima fase: ${FS[proxFase].nome} ▶`) : null, h('button', { class: `btn${proxFase >= 0 ? '' : ' primary'}`, type: 'button', onclick: () => { fase = 'cards'; vistos = new Set(); desenha(); } }, 'rever os cartões'), h('button', { class: 'btn', type: 'button', onclick: quizOn }, 'quiz de novo'), proxFase < 0 ? (prox ? h('a', { class: 'btn', href: `#/estudos/basica/${prox.id}` }, `próxima: ${prox.nome} ▶`) : h('a', { class: 'btn', href: '#/estudos/basica' }, 'todas as sessões')) : null)].filter(Boolean));
  }
  host.append(banner(s.nome, 'teoria básica com o Paul'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, h('a', { class: 'jg-link', href: '#/estudos/basica' }, '‹ teoria básica'), cabeca, corpo));
  desenha();
  return () => {};
}
function lista(host) {
  host.append(banner('Teoria básica', 'aulinha do Paul · cartões · mini quiz'), h('div', { class: 'pad-x', style: 'display:grid;gap:10px' }, h('a', { class: 'jg-link', href: '#/estudos/basica' === location.hash ? '#/estudos' : '#/estudos/basica' }, '‹ estudos'),
    ...SESSOES.map((s) => { const [tem, max] = estrelasTema(s); const n = fasesDe(s).reduce((q, f) => q + f.cards.length, 0); return h('a', { class: 'es-modo tf-tema', href: `#/estudos/basica/${s.id}`, style: `--c:${s.cor};--f:#fff` }, h('span', { class: 'es-mi tf-li', 'aria-hidden': 'true' }, s.li ? s.li() : s.ic), h('span', { class: 'es-mt' }, h('b', {}, s.nome), h('small', {}, `${s.sub} · ${n} aulinhas`), h('small', { class: 'tf-tema-st' }, `${'★'.repeat(tem)}${'☆'.repeat(max - tem)}`)), h('span', { class: 'es-go' }, '▶')); })));
  return () => {};
}
