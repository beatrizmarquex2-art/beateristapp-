// Quebra-cabeça musical: tela. Peças da cena do Paul no palco; regras em quebra-logic.js. Peças de encaixe (jigsaw em SVG). Arrasta a peça até o lugar ou toca na peça e depois na posição.
import { h } from '../util.js';
import { placar, poseDisponivel } from './placar.js';
import { linha, chips, ajuda } from './opcoes.js';
import { confirmSheet } from '../ui.js';
import * as Q from './quebra-logic.js';
import { getGame, setGame, sfx, reduced } from './base.js';
import { quebra as estrelasQuebra } from './estrelas-jogo.js';
import { sementeRnd } from './semente.js';
import { salaAutoPara } from './online.js';
import { alunoSemCodigo } from '../amostra.js';
import { toast } from '../ui.js';
import { NAGANO_FABRICA } from '../marcas-links.js';

const ID = 'quebra';
// Imagens do quebra-cabeça. Pra pôr mais uma: salve em assets/jogos/ (1536×1024, proporção 3:2), acrescente aqui e em sw.js. Com 2 ou mais, a tela inicial mostra as miniaturas pra escolher.
export const IMAGES = [
  { id: 'palco', grupo: 'bateria', src: 'assets/jogos/palco.webp', nome: 'Paul no palco' },
  { id: 'guitarra', grupo: 'guitarra', src: 'assets/jogos/guitarra.webp', nome: 'Paul tocando guitarra' },
  { id: 'baixo', grupo: 'baixo', src: 'assets/jogos/baixo.webp', nome: 'Paul tocando baixo' },
  { id: 'teclado', grupo: 'teclado', src: 'assets/jogos/teclado.webp', nome: 'Paul tocando teclado' },
  { id: 'sax', grupo: 'sax', src: 'assets/jogos/sax.webp', nome: 'Paul tocando saxofone' },
  { id: 'praca', grupo: 'sax', src: 'assets/jogos/praca.webp', nome: 'Paul tocando saxofone numa praça à noite' },
  { id: 'estudio', grupo: 'teclado', src: 'assets/jogos/estudio.webp', nome: 'Paul tocando teclado num estúdio de gravação' },
  { id: 'parque', grupo: 'baixo', src: 'assets/jogos/parque.webp', nome: 'Paul tocando baixo num parque em festa' },
  { id: 'garagem', grupo: 'guitarra', src: 'assets/jogos/garagem.webp', nome: 'Paul tocando guitarra numa garagem' },
  { id: 'estudio-paul', grupo: 'teclado', src: 'assets/jogos/estudio-paul.webp', nome: 'Paul tocando teclado no estúdio' },
  { id: 'show-guitarra', grupo: 'guitarra', src: 'assets/jogos/show-guitarra.webp', nome: 'Paul tocando guitarra no show' },
  { id: 'bateria-palco', grupo: 'bateria', src: 'assets/jogos/bateria-palco.webp', nome: 'Paul tocando bateria no palco' },
  { id: 'terraco', grupo: 'bateria', src: 'assets/jogos/terraco.webp', nome: 'Paul tocando bateria num terraço ao pôr do sol' },
  // série "Beaterista Play" (palco vermelho, a Bea mandou em 25/nov/2026)
  { id: 'play-violao', grupo: 'guitarra', src: 'assets/jogos/play-violao.webp', nome: 'Paul tocando violão no palco vermelho' },
  { id: 'play-guitarra', grupo: 'guitarra', src: 'assets/jogos/play-guitarra.webp', nome: 'Paul tocando guitarra elétrica no palco vermelho' },
  { id: 'play-baixo', grupo: 'baixo', src: 'assets/jogos/play-baixo.webp', nome: 'Paul tocando baixo no palco vermelho' },
  { id: 'play-teclado', grupo: 'teclado', src: 'assets/jogos/play-teclado.webp', nome: 'Paul tocando teclado no palco vermelho' },
  { id: 'play-bateria', grupo: 'bateria', src: 'assets/jogos/play-bateria.webp', nome: 'Paul tocando bateria no palco vermelho' },
  // foto da Bea no estande da Nagano (a Bea mandou, 17/nov/2026). Ao montar, mostra o link da visita dela na fábrica.
  { id: 'nagano', grupo: 'bateria', src: 'assets/jogos/nagano.webp', nome: 'Nagano Drums & Beaterista: a Bea no estande, com o Paul', link: NAGANO_FABRICA, linkTxt: 'ver a visita da Bea na fábrica da Nagano ›' },
];
const GRUPOS = [['guitarra', 'guitarra'], ['teclado', 'teclado'], ['baixo', 'baixo'], ['bateria', 'bateria'], ['sax', 'saxofone']]; // a escolha da imagem é por instrumento (pedido da Bea)
const SIZES = [[6, '6 peças'], [12, '12 peças'], [24, '24 peças'], [48, '48 · difícil'], [70, '70 · insano']];

export function mount(host, opts) {
  const M = opts && opts.mission ? opts.mission : null; // Modo Aventura: monta com os params da missão, não lê nem grava nada do modo livre
  let gone = false; let tick = 0; let reported = false;
  const saved = M ? {} : getGame(ID);
  const prefs = M ? { diff: Q.DIFFS[M.params.diff] ? M.params.diff : 6, free: false } : { diff: [6, 12, 24, 48, 70].includes(saved.diff) ? saved.diff : 6, free: saved.free !== false };
  const pick = (id) => IMAGES.find((x) => x.id === id) || IMAGES[0];
  // sem código de aluno só as 2 primeiras imagens abrem (pedido da Bea); as outras pedem o código
  const GRATIS_IMAGENS = 2; const travada = (id) => !M && alunoSemCodigo() && IMAGES.findIndex((x) => x.id === id) >= GRATIS_IMAGENS;
  let imgId = pick(M ? M.params.img : saved.img).id; if (travada(imgId)) imgId = IMAGES[0].id; const SRC = () => pick(imgId).src; const NOME = () => pick(imgId).nome;
  let best = saved.best && typeof saved.best === 'object' ? saved.best : {};
  let g = null; let selected = null; let hintCell = null; let msg = ''; let img = null; let paused = false; let viewing = false; let zoom = false; let last = 0; let record = false;
  let timeEl = null;
  const root = h('div', { class: 'jg jg-quebra jg-fluido-root' }); host.replaceChildren(root);
  const persist = () => M || setGame(ID, { ...prefs, img: imgId, best, game: g && !g.over ? g : null, gameImg: g && !g.over ? imgId : null });
  const running = () => g && !g.free && g.started && !g.over && !document.hidden && !paused;

  /* ---------- relógio: soma só o tempo em que a partida está rodando ---------- */
  function clock() {
    const now = performance.now(); if (last && running()) g.elapsed += now - last; last = now;
    if (timeEl) timeEl.textContent = g && !g.free ? Q.fmtTime(g.elapsed) : '—';
  }
  const startClock = () => { clearInterval(tick); last = performance.now(); tick = setInterval(clock, 250); };
  const stopClock = () => { clearInterval(tick); tick = 0; last = 0; };
  const pause = (v) => { clock(); paused = v; last = performance.now(); if (g) persist(); };

  /* ---------- carregamento da imagem ---------- */
  function load(done) {
    root.replaceChildren(h('p', { class: 'jg-p', role: 'status' }, 'carregando a imagem…'));
    const im = new Image();
    im.onload = () => { if (gone) return; img = { w: im.naturalWidth, h: im.naturalHeight }; done(); };
    im.onerror = () => { if (gone) return; root.replaceChildren(h('p', { class: 'jg-msg', role: 'alert' }, 'não consegui carregar a imagem do quebra-cabeça.'), h('button', { class: 'btn primary', type: 'button', onclick: () => load(done) }, 'tentar de novo')); };
    im.src = SRC();
  }

  let autoAbriu = false; let grupoSel = null;
  function intro() {
    stopClock(); g = null; selected = null; hintCell = null;
    if (!M && !autoAbriu && salaAutoPara(ID)) { autoAbriu = true; abrirDuelo(); return; } // veio de "tem um código de sala"
    const resume = Q.validGame(saved.game) && !saved.game.over ? saved.game : null;
    const RULES = () => h('ul', {}, h('li', {}, 'arraste a peça da bandeja até o lugar dela no quadro (no celular: arraste pra cima, ou segure um instante e arraste) ou toque na peça e depois no lugar. as peças têm encaixe: o dente de uma entra no vazio da vizinha.'), h('li', {}, 'só encaixa no lugar certo; errou, ela volta para a bandeja.'), h('li', {}, '“dica” mostra o lugar da peça escolhida. “ver imagem” mostra a figura pronta.'), h('li', {}, 'o tempo começa na primeira jogada e para quando a aba fica oculta.'));
    const bests = SIZES.map(([d]) => [d, best[`${d}:sem`], best[`${d}:com`]]).filter((b) => b[1] != null || b[2] != null);
    root.classList.add('qz-lobby');
    const grupoAtual = GRUPOS.some(([gid]) => gid === grupoSel) ? grupoSel : pick(imgId).grupo;
    const lista = IMAGES.filter((x) => x.grupo === grupoAtual);
    const seg = (rot, itens, atual, onPick) => h('div', { class: 'qz-linha' }, h('span', { class: 'qz-rot' }, rot), h('div', { class: 'qz-seg', role: 'radiogroup', 'aria-label': rot }, ...itens.map(([v, txt, full]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === atual), 'aria-label': full || txt, class: v === atual ? 'on' : '', onclick: () => onPick(v) }, txt))));
    const tamanho = SIZES.find(([d]) => d === prefs.diff);
    root.replaceChildren(...[
      h('div', { class: 'qz-prev' }, h('img', { class: 'jg-qprev', src: SRC(), alt: `${NOME()}, a imagem que você vai montar` }), h('span', { class: 'qz-prev-nome' }, NOME())),
      IMAGES.length > 1 ? h('div', { class: 'qz-grupos', role: 'radiogroup', 'aria-label': 'instrumento' }, ...GRUPOS.map(([gid, gn]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(gid === grupoAtual), class: gid === grupoAtual ? 'on' : '', onclick: () => { grupoSel = gid; intro(); } }, gn))) : null,
      IMAGES.length > 1 ? h('div', { class: 'jg-estante-l qz-thumbs', role: 'radiogroup', 'aria-label': 'imagem' }, ...lista.map((im) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(imgId === im.id), 'aria-label': im.nome, title: im.nome, class: `${imgId === im.id ? 'on' : ''}${travada(im.id) ? ' locked' : ''}`, onclick: () => { if (travada(im.id)) { toast('essa imagem é pra alunos com código. as 2 primeiras são grátis.', { id: 'qc-trava', ms: 2500 }); return; } imgId = im.id; grupoSel = im.grupo; setGame(ID, { img: imgId }); intro(); } }, h('img', { src: im.src, alt: '', width: 96, height: 64, loading: 'lazy' })))) : null,
      h('div', { class: 'qz-opts' },
        seg('peças', SIZES.map(([v, l]) => [v, String(v), l]), prefs.diff, (v) => { prefs.diff = v; setGame(ID, { diff: v }); intro(); }),
        h('p', { class: 'qz-tam', 'aria-live': 'polite' }, tamanho ? tamanho[1] : ''),
        seg('tempo', [[true, 'livre'], [false, 'com tempo']], !!prefs.free, (v) => { prefs.free = v; setGame(ID, { free: v }); intro(); })),
      bests.length ? h('p', { class: 'qz-bests' }, 'melhores: ', bests.map(([d, s, c]) => `${d} peças ${s != null ? `sem dicas ${Q.fmtTime(s)}` : ''}${s != null && c != null ? ' · ' : ''}${c != null ? `com dicas ${Q.fmtTime(c)}` : ''}`).join(' | ')) : null,
      h('div', { class: 'jg-actions qz-go' }, resume ? h('button', { class: 'btn primary', type: 'button', onclick: () => { imgId = pick(saved.gameImg).id; load(() => begin(resume)); } }, 'continuar partida') : null,
        h('button', { class: resume ? 'btn' : 'btn primary', type: 'button', onclick: () => load(() => begin(Q.newGame(prefs))) }, resume ? 'nova partida' : 'iniciar'),
        h('button', { class: 'btn', type: 'button', onclick: abrirDuelo }, '⚔ duelo · 2 celulares')),
    ].filter(Boolean));
  }
  /** Duelo em 2 celulares: a mesma imagem e as mesmas peças nos dois; vence quem montar mais rápido (js/jogos/duelo-quebra.js). */
  let offDuelo = null;
  function abrirDuelo() { stopClock(); root.replaceChildren(h('p', { class: 'jg-p muted' }, 'carregando o duelo…')); import('./duelo-quebra.js').then((m) => { if (gone) return; root.replaceChildren(); offDuelo = m.mountDueloQuebra(root, { IMAGES, SIZES, abrir: (opts, el) => mount(el || root, opts), voltar: () => { if (offDuelo) { offDuelo(); offDuelo = null; } intro(); } }); }); }
  function begin(game) { g = game; selected = null; hintCell = null; msg = ''; paused = false; viewing = false; zoom = false; /* pedido da Bea: sempre começa com o quadro completo na tela */ record = false; persist(); draw(); startClock(); }

  /** Peças de encaixe: cada peça é um SVG com a imagem recortada no contorno (dente/encaixe nos 4 lados) e uma margem pros dentes. */
  const geo = () => { const { cols, rows } = Q.DIFFS[g.diff]; const cw = img.w / cols; const ch = img.h / rows; const m = Q.tabDepth(cw, ch) * 1.1; return { cols, rows, cw, ch, m, E: Q.jigsawEdges(cols, rows) }; };
  const svgNode = (mk) => { const t = document.createElement('template'); t.innerHTML = mk.trim(); return t.content.firstChild; };
  const pieceSvg = (i, so) => { const { cols, rows, cw, ch, m, E } = geo(); const x0 = (i % cols) * cw; const y0 = Math.floor(i / cols) * ch; const d = Q.piecePath(i, cols, rows, cw, ch, E); const sw = Math.min(cw, ch) * 0.025;
    const vb = `${(x0 - m).toFixed(1)} ${(y0 - m).toFixed(1)} ${(cw + 2 * m).toFixed(1)} ${(ch + 2 * m).toFixed(1)}`;
    return svgNode(so ? `<svg class="pzsvg slotsvg" viewBox="${vb}" aria-hidden="true"><path d="${d}" fill="currentColor" fill-opacity=".10" stroke="currentColor" stroke-opacity=".45" stroke-width="${sw}" stroke-dasharray="${sw * 3} ${sw * 2}" stroke-linejoin="round"/></svg>`
      : `<svg class="pzsvg" viewBox="${vb}" aria-hidden="true"><defs><clipPath id="qc${i}"><path d="${d}"/></clipPath></defs><image href="${SRC()}" width="${img.w}" height="${img.h}" preserveAspectRatio="none" clip-path="url(#qc${i})"/><path d="${d}" fill="none" stroke="#142036" stroke-width="${sw}" stroke-linejoin="round"/></svg>`); };
  const cellVars = () => { const { cw, ch, m } = geo(); return `--ox:${(-m / cw * 100).toFixed(2)}%;--oy:${(-m / ch * 100).toFixed(2)}%;--sw:${((cw + 2 * m) / cw * 100).toFixed(2)}%`; };
  const trayAspect = () => { const { cw, ch, m } = geo(); return `aspect-ratio:${(cw + 2 * m) / (ch + 2 * m)}`; };
  const posLabel = (p) => { const { cols } = Q.DIFFS[g.diff]; return `linha ${Math.floor(p / cols) + 1}, coluna ${(p % cols) + 1}`; };

  const ICO = {
    puzzle: '<path d="M10 4.5a2 2 0 1 1 4 0V6h3.5A1.5 1.5 0 0 1 19 7.5V11h-1.5a2 2 0 1 0 0 4H19v3.5a1.5 1.5 0 0 1-1.5 1.5H14v-1.5a2 2 0 1 0-4 0V20H6.5A1.5 1.5 0 0 1 5 18.5V15h1.5a2 2 0 1 0 0-4H5V7.5A1.5 1.5 0 0 1 6.5 6H10V4.5z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    bulb: '<path d="M9.5 17.5h5M10 20.5h4M12 3.5a6 6 0 0 0-3.7 10.7c.6.5 1 1.2 1 2v.3h5.4v-.3c0-.8.4-1.5 1-2A6 6 0 0 0 12 3.5z"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.7"/><path d="M4 17.5l5-4.5 3.5 3 3-2.5 4.5 4"/>',
    shuffle: '<path d="M3.5 7.5H7c1.6 0 3 .8 3.9 2.1l2.2 3.3c.9 1.3 2.300 2.100 3.900 2.100h3.500M3.500 16.500H7c1.200 0 2.300-.5 3.100-1.300M13 8.500c.800-.600 1.800-1 2.900-1h3.600M17.500 4.500l3 3-3 3M17.500 13.500l3 3-3 3"/>',
  };
  const ico = (k) => svgNode(`<svg class="qz-i" viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg>`);

  function draw() {
    const { cols, rows } = Q.DIFFS[g.diff]; const n = g.diff;
    const cells = Array.from({ length: n }, (_, p) => g.placed[p]
      ? h('div', { class: 'jg-pz fixed', style: cellVars(), role: 'img', 'aria-label': `peça no lugar: ${posLabel(p)}` }, pieceSvg(p))
      : h('button', { type: 'button', class: `jg-pz slot${hintCell === p ? ' hint' : ''}`, 'aria-label': `posição vazia: ${posLabel(p)}${hintCell === p ? ' (dica: aqui)' : ''}`, 'data-pos': p, disabled: g.over || selected == null, style: cellVars(), onclick: () => put(p) }, pieceSvg(p, true)));
    const tray = g.tray.map((p) => h('button', { type: 'button', class: `jg-pz tp${selected === p ? ' sel' : ''}`, style: trayAspect(), 'aria-pressed': String(selected === p), 'aria-label': `peça ${g.tray.indexOf(p) + 1} de ${g.tray.length} na bandeja${selected === p ? ', selecionada' : ''}`, 'data-piece': p,
      onclick: () => { if (dragMoved) return; selected = selected === p ? null : p; hintCell = null; sfx('tap'); draw(); }, onpointerdown: (e) => dragStart(e, p) }, pieceSvg(p)));
    root.classList.remove('qz-lobby');
    timeEl = h('b', {}, g.free ? '—' : Q.fmtTime(g.elapsed));
    const st = (k, v, t) => h('div', { class: 'qz-st' }, ico(k), h('div', {}, h('b', {}, v), h('small', {}, t)));
    const pct = Math.round((Q.placedCount(g) / n) * 100);
    const dica = g.over ? '' : msg || (selected == null ? 'toque numa peça (ou segure e arraste) até o lugar dela.' : 'agora toque no lugar dela no quadro, ou em “dica”.');
    root.replaceChildren(...[
      h('div', { class: 'qz-stats', role: 'group', 'aria-label': 'placar' }, st('puzzle', `${Q.placedCount(g)}/${n}`, 'peças'), st('clock', timeEl, 'tempo'), st('bulb', String(g.hints), 'dicas'), h('span', { class: 'qz-prog', 'aria-hidden': 'true' }, h('i', { style: `width:${pct}%` }))),
      h('p', { class: 'jg-msg qz-msg', 'aria-live': 'polite' }, dica),
      h('div', { class: 'qz-stage' },
        h('div', { class: `jg-boardwrap qz-boardwrap${zoom ? ' zoom' : ''}` }, h('div', { class: 'jg-pboard', role: 'group', 'aria-label': `quadro ${cols} colunas por ${rows} linhas`, style: `grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);aspect-ratio:${img.w}/${img.h}` }, ...cells)),
        g.over ? result() : h('div', { class: 'jg-tray qz-tray', role: 'group', 'aria-label': 'bandeja de peças' }, ...tray)),
      g.over ? null : h('div', { class: 'qz-dock', role: 'group', 'aria-label': 'ações' },
        h('button', { class: 'qz-b', type: 'button', 'aria-label': 'ver imagem', onclick: () => { viewing = true; draw(); } }, ico('image'), h('span', {}, 'imagem')),
        h('button', { class: 'qz-b qz-main', type: 'button', disabled: selected == null, title: selected == null ? 'escolha uma peça primeiro' : 'mostrar onde a peça encaixa', onclick: hint }, ico('bulb'), h('span', {}, 'dica')),
        h('button', { class: 'qz-b', type: 'button', 'aria-label': 'misturar as peças', onclick: misturar }, ico('shuffle'), h('span', {}, 'misturar'))),
      viewing ? h('div', { class: 'jg-over', role: 'dialog', 'aria-label': 'imagem de referência' }, h('img', { src: SRC(), alt: NOME() }), h('button', { class: 'btn primary', type: 'button', onclick: () => { viewing = false; draw(); } }, 'fechar')) : null,
    ].filter(Boolean));
    fit();
  }
  /** Embaralha de novo as peças que ainda estão na bandeja (só a ordem na tela; não conta erro nem dica). */
  function misturar() { if (!g || g.over) return; const t = g.tray.slice(); for (let k = t.length - 1; k > 0; k--) { const r = Math.floor(Math.random() * (k + 1)); [t[k], t[r]] = [t[r], t[k]]; } g = { ...g, tray: t }; selected = null; hintCell = null; sfx('draw'); persist(); draw(); }
  /** Tamanho do quadro e da bandeja conforme o espaço que o jogo recebeu (celular em pé: quadro em cima e bandeja em grade embaixo; tela larga: quadro à esquerda e bandeja em coluna). */
  function fit() {
    const st = root.querySelector('.qz-stage'); if (!st || !img) return; const W = st.clientWidth; const H = st.clientHeight; if (W < 40 || H < 40) return;
    const ratio = img.w / img.h; const lado = W / H > 1.3; const gap = 10; const bwMax = lado ? Math.min(W - 200 - gap, H * ratio) : Math.min(W, (H - 150) * ratio);
    const bw = Math.max(140, Math.floor(bwMax)); st.style.setProperty('--bw', `${bw}px`); st.classList.toggle('lado', lado);
    const { cols } = Q.DIFFS[g.diff]; const cell = bw / cols; const pw = Math.max(66, Math.min(92, Math.round(cell * 1.5))); st.style.setProperty('--pw', `${pw}px`);
    requestAnimationFrame(() => { const tr = root.querySelector('.qz-tray'); if (tr) tr.classList.toggle('cabe', tr.scrollHeight <= tr.clientHeight + 1); }); // bandeja sem rolagem: arrastar com o dedo direto
  }
  let roFit = null; if (typeof ResizeObserver === 'function') { roFit = new ResizeObserver(() => { if (g && !gone) fit(); }); roFit.observe(root); }

  function put(pos) {
    if (selected == null || g.over) return;
    const piece = selected; const r = Q.place(g, piece, pos); g = r.g; selected = null; hintCell = null;
    if (r.ok) { msg = ''; sfx('place'); } else { msg = 'ainda não é aí: a peça voltou para a bandeja'; sfx('bad'); }
    if (g.over) return finish();
    persist(); draw(); if (g.started && !tick) startClock();
  }
  function hint() { if (selected == null) return; g = Q.useHint(g); hintCell = selected; msg = `dica: a peça escolhida vai na posição ${posLabel(selected)}`; sfx('tap'); persist(); draw(); }
  function showRules() { pause(true); const el = h('div', { class: 'jg-over', role: 'dialog', 'aria-label': 'regras' }, h('p', {}, 'arraste a peça até o lugar dela, ou toque na peça e depois no lugar. o tempo está pausado.'), h('button', { class: 'btn primary', type: 'button', onclick: () => { el.remove(); pause(false); } }, 'continuar')); root.append(el); el.querySelector('button').focus(); }
  function finish() {
    clock(); stopClock();
    if (M) { sfx('win'); draw(); if (!reported && !gone && opts.onResult) { reported = true; opts.onResult({ won: true, diff: g.diff, img: imgId, errors: g.errors, hints: g.hints, elapsed: Math.round(g.elapsed), moves: g.diff + g.errors }); } return; }
    estrelasQuebra(imgId, IMAGES.length); // 3 ★ por imagem (2 na 2ª volta, 1 depois)
    const r = Q.recordBest(best, g); best = r.best; record = r.record; setGame(ID, { ...prefs, best, game: null }); sfx('win'); draw();
  }
  function result() {
    return placar({ classe: 'jg-result', estado: 'win', pose: poseDisponivel('produtor', 'lendo-partitura'), titulo: 'montou! 🤘', sub: g.free ? 'modo livre: sem tempo' : record ? 'novo recorde!' : '',
      quadros: [g.free ? null : { n: Q.fmtTime(g.elapsed), l: 'tempo', win: true }, { n: g.hints, l: g.hints === 1 ? 'dica' : 'dicas' }, { n: g.errors, l: g.errors === 1 ? 'erro' : 'erros' }],
      acoes: M ? [] : [...(pick(imgId).link ? [h('a', { class: 'btn primary wide qb-link', href: pick(imgId).link, target: '_blank', rel: 'noopener noreferrer' }, pick(imgId).linkTxt || 'ver mais ›')] : []), h('button', { class: pick(imgId).link ? 'btn' : 'btn primary', type: 'button', onclick: () => begin(Q.newGame(prefs)) }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: intro }, 'voltar às opções')] });
  }

  /* ---------- arrastar: mouse/caneta na hora; no toque, arrastar pra cima (ou segurar um instante e arrastar). Arrastar pro lado continua rolando a bandeja ---------- */
  let dragMoved = false; let ghost = null; let drag = null; let overCell = null; let holdT = 0;
  const noScroll = (e) => { if (drag && drag.on && e.cancelable) e.preventDefault(); }; // enquanto arrasta a peça, a tela não rola
  function cellAt(x, y) { const t = document.elementFromPoint(x, y); return t && t.closest ? t.closest('[data-pos]') : null; }
  function dragStart(e, p) {
    if (g.over || (e.pointerType !== 'touch' && e.button !== 0)) return;
    drag = { p, x: e.clientX, y: e.clientY, el: e.currentTarget, touch: e.pointerType === 'touch', hold: false, on: false }; dragMoved = false;
    if (drag.touch) { clearTimeout(holdT); holdT = setTimeout(() => { if (drag && !drag.on) { drag.hold = true; drag.el.classList.add('lift'); try { navigator.vibrate && navigator.vibrate(8); } catch { /* sem vibração */ } } }, 260); }
    addEventListener('pointermove', dragMove); addEventListener('pointerup', dragEnd, { once: true }); addEventListener('pointercancel', dragEnd, { once: true });
    if (drag.touch) addEventListener('touchmove', noScroll, { passive: false });
  }
  function dragBegin() {
    drag.on = true; dragMoved = true; clearTimeout(holdT); drag.el.classList.remove('lift'); drag.el.classList.add('picked');
    ghost = drag.el.cloneNode(true); ghost.className = 'jg-pz ghost'; ghost.style.width = `${drag.el.offsetWidth * (drag.touch ? 1.25 : 1)}px`; document.body.append(ghost);
  }
  function dragMove(e) {
    if (!drag) return;
    if (!drag.on) {
      const dx = e.clientX - drag.x; const dy = e.clientY - drag.y; const d = Math.hypot(dx, dy);
      if (!drag.touch) { if (d < 6) return; dragBegin(); }
      else if (drag.hold) { if (d < 4) return; dragBegin(); }
      else if (drag.el.closest('.qz-tray.cabe') && d > 6) dragBegin(); // bandeja sem rolagem: o dedo arrasta a peça na hora
      else if (!drag.el.closest('.qz-tray') && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 0.6) dragBegin(); // (modo antigo, bandeja em linha)
      else { if (d > 10) clearTimeout(holdT); return; } // bandeja que rola: mexer sem segurar rola a bandeja; segurando um instante a peça levanta e dá pra arrastar
    }
    const up = drag.touch ? ghost.offsetHeight * 0.9 : 0; // no dedo, a peça fica um pouco acima pra não ser coberta
    const cx = e.clientX; const cy = e.clientY - up;
    ghost.style.left = `${cx - ghost.offsetWidth / 2}px`; ghost.style.top = `${cy - ghost.offsetHeight / 2}px`;
    const cell = cellAt(cx, cy); if (cell !== overCell) { if (overCell) overCell.classList.remove('over'); overCell = cell; if (cell && !cell.classList.contains('fixed')) cell.classList.add('over'); }
  }
  function dragEnd(e) {
    clearTimeout(holdT); removeEventListener('pointermove', dragMove); removeEventListener('pointercancel', dragEnd); removeEventListener('pointerup', dragEnd); removeEventListener('touchmove', noScroll);
    if (overCell) { overCell.classList.remove('over'); overCell = null; }
    let target = null; if (ghost && drag && e.type === 'pointerup') target = cellAt(e.clientX, e.clientY - (drag.touch ? ghost.offsetHeight * 0.9 : 0));
    if (ghost) { ghost.remove(); ghost = null; }
    if (drag) { drag.el.classList.remove('lift', 'picked'); if (drag.on && target && target.dataset.pos != null) { selected = drag.p; put(Number(target.dataset.pos)); } }
    drag = null; setTimeout(() => { dragMoved = false; }, 0);
  }

  const onVis = () => { if (document.hidden) { clock(); persist(); } else last = performance.now(); };
  document.addEventListener('visibilitychange', onVis);
  if (M) load(() => begin(Q.newGame({ diff: prefs.diff, free: false, rnd: M.params.seed ? sementeRnd(M.params.seed) : Math.random }))); else intro(); // seed: no duelo os dois celulares embaralham igual
  return {
    inProgress: () => !!(g && !g.over && g.started),
    restart: async () => { if (g && !g.over && g.started && !(await confirmSheet('começar nova partida?', 'a partida atual será perdida.', 'nova partida'))) return; intro(); },
    destroy() { gone = true; if (roFit) roFit.disconnect(); if (offDuelo) { offDuelo(); offDuelo = null; } stopClock(); if (g) persist(); if (ghost) ghost.remove(); document.removeEventListener('visibilitychange', onVis); removeEventListener('pointermove', dragMove); removeEventListener('pointerup', dragEnd); removeEventListener('pointercancel', dragEnd); void reduced; },
  };
}
