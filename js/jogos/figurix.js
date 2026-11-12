// Figurix: figuras rítmicas em 12 fases (mapa igual ao pauLta). Cada fase é um joguinho diferente (ideias da Bea): mais rápida/lenta, montar a figura, ligar,
// memória das pausas, quiz, caça-palavras, monte as notas e o tetris do Roboterista. Só aprender e adivinhar: não toca.
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { session } from '../session.js';
import * as FB from '../feedback.js';
import { audio } from '../audio.js';
import { mountProgressionMap } from '../kids/mapa.js';
import { themeOf } from '../campanha/themes.js';
import { mapSfx } from '../kids/mapa-sfx.js';
import { FIG_BY, FIG_NAME, beatsLabel } from '../kids/figs.js';
import { figureMarkup, restMarkup, noteMarkup, svgEl, tone } from '../kids/art.js';
import { robo } from '../kids/robo.js';
import { wordsearch, lineCells, EASY_DIRS, DIRS } from '../tips.js';
import { PHASES, FASES, rapidaLentaN, montesDe, maxColchetes, peçasDe, confereMonte, ligarCfg, paresLigarN, memCfg, paresMem, mesmoParN, quizN, totalRL, totalQuiz, palavrasDe, grandeCaca, arvore, opcoesCabem, itensTetrisN, estrelasFigurix } from './figurix-logic.js';

const fig = (id, cls = 'fx-fig') => svgEl(figureMarkup(id), cls);
const pausa = (id, cls = 'fx-fig') => svgEl(restMarkup(id), cls);
const tocar = (beats) => { try { audio(); tone(beats, 90); } catch { /* sem som */ } };

export function mount(host) {
  const root = h('div', { class: 'jg jg-figurix' }); host.replaceChildren(root);
  const S = session(); const sfx = mapSfx(); let off = null; let gone = false; let jogando = false;
  let fase = 1; let erros = 0;
  const estOf = (n) => ((getGame('figurix').est || {})[n] || 0);
  const guarda = (n, v) => { const g = getGame('figurix'); setGame('figurix', { ...g, est: { ...(g.est || {}), [n]: v } }); };
  const limpa = () => { if (off) { try { off(); } catch { /* ok */ } off = null; } S.reset(); };
  window.__figurix = { get erros() { return erros; } }; // só pros testes automáticos

  /* ---------- mapa (abre aqui) ---------- */
  const mapa = () => {
    limpa(); jogando = false;
    const box = h('div', { class: 'tm-map' });
    const levels = PHASES.map((p) => ({ id: `fx:${p.n}`, index: p.n, label: String(p.n), tag: '', boss: p.n === FASES }));
    const have = PHASES.reduce((s, p) => s + estOf(p.n), 0);
    root.replaceChildren(h('p', { class: 'tm-dica' }, 'figuras rítmicas: cada fase é um jogo diferente.'), h('a', { class: 'btn small ghost', href: '#/kids/figuras/aula' }, '📖 aulinha do Paul'), box);
    off = mountProgressionMap(box, { gameId: 'figurix', levels, profileId: 'figurix', unitName: 'Fase', tier: 0, stars: { have, max: FASES * 3 }, theme: themeOf('toca'),
      starsOf: (id) => estOf(Number(id.split(':')[1])), unlockedOf: () => true, lockedMsg: '', onOpen: (lv) => comeca(lv.index) });
  };
  const topo = (feitas, total) => h('div', { class: 'tr-fasehead' }, h('button', { class: 'btn small ghost', type: 'button', onclick: mapa }, '‹ mapa'),
    total ? h('span', { class: 'dn-dots', role: 'img', 'aria-label': `${Math.min(feitas + 1, total)} de ${total}` }, ...Array.from({ length: total }, (_, i) => h('i', { class: i < feitas ? 'on' : i === feitas ? 'now' : '' }))) : null);
  const acerto = (el) => { try { FB.win(el); } catch { /* ok */ } };
  const erro = (el) => { erros++; try { FB.lose(el); } catch { /* ok */ } if (el && el.classList) { el.classList.add('no'); } };
  const comeca = (n) => { limpa(); fase = n; erros = 0; jogando = true; const p = PHASES[n - 1]; (RUN[p.tipo] || RUN.quiz)(p); };

  /* ---------- fim da fase ---------- */
  const fim = () => {
    limpa(); jogando = false; const est = estrelasFigurix(erros); const antes = estOf(fase);
    if (est > antes) { guarda(fase, est); import('../figurinhas/mesa.js').then((M) => M.vitoria('figurix', est - antes)).catch(() => {}); }
    sfx.play('win');
    root.replaceChildren(topo(0, 0), h('h2', { class: 'jg-h hand' }, `fase ${fase} concluída!`), h('p', { class: 'dn-estrelas', 'aria-label': `${est} de 3 estrelas` }, '★'.repeat(est), '☆'.repeat(3 - est)),
      h('p', { class: 'jg-p' }, erros ? `${erros} erro${erros > 1 ? 's' : ''}.${est < 3 ? ' sem errar nenhum, são 3 estrelas.' : ''}` : 'sem nenhum erro. perfeito!'),
      h('div', { class: 'jg-actions' }, fase < FASES ? h('button', { class: 'btn primary', type: 'button', onclick: () => comeca(fase + 1) }, 'próxima fase ▶') : null, h('button', { class: 'btn', type: 'button', onclick: () => comeca(fase) }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: mapa }, 'ver o mapa')));
  };

  /* ---------- as fases ---------- */
  // uma pergunta de cada vez: `render(i)` devolve { el, ok(btn)... }; aqui o padrão é "escolher a certa entre cartões" (rápida, lenta, quiz)
  const perguntas = (titulo, total, fazer) => {
    let i = 0;
    const mostra = () => {
      const q = fazer(i); S.reset(); window.__figurix.certa = (q.opcoes.find((o) => o.certo) || {}).label; // só pros testes
      const cartoes = q.opcoes.map((o) => { const b = h('button', { type: 'button', class: `fx-op${o.cls ? ` ${o.cls}` : ''}`, 'aria-label': o.label, onclick: () => {
        if (b.classList.contains('feito')) return; sfx.play('click');
        if (o.certo) { b.classList.add('ok', 'feito'); acerto(b); S.later(() => { i++; if (i >= total) fim(); else mostra(); }, 800); } else { erro(b); b.disabled = true; } } }, o.face); return b; });
      root.replaceChildren(topo(i, total), h('p', { class: 'fx-q' }, q.titulo || titulo), q.destaque || null, h('div', { class: `fx-ops n${q.opcoes.length}` }, ...cartoes));
    };
    mostra();
  };
  const nomeFig = (f) => FIG_NAME[f];
  const RUN = {
    rapida: (p) => perguntas(p.titulo, totalRL(p.nivel), (i) => { const q = rapidaLentaN('rapida', i, p.nivel); return { opcoes: q.figs.map((f) => ({ face: fig(f), label: nomeFig(f), certo: f === q.ok })) }; }),
    lenta: (p) => perguntas(p.titulo, totalRL(p.nivel), (i) => { const q = rapidaLentaN('lenta', i, p.nivel); return { opcoes: q.figs.map((f) => ({ face: fig(f), label: nomeFig(f), certo: f === q.ok })) }; }),
    quiz: (p) => perguntas(p.titulo, totalQuiz(p.nivel), () => {
      const q = quizN(p.nivel); const nomes = (lista) => lista.map((f) => ({ face: h('b', {}, nomeFig(f)), label: nomeFig(f), certo: f === q.ok }));
      if (q.tipo === 'valor') return { titulo: `quanto vale a ${nomeFig(q.fig)}?`, destaque: fig(q.fig, 'fx-big'), opcoes: q.opcoes.map((v) => ({ face: h('b', {}, beatsLabel(v)), label: beatsLabel(v), certo: v === q.ok })) };
      if (q.tipo === 'nome') return { titulo: 'qual é o nome dessa figura?', destaque: fig(q.fig, 'fx-big'), opcoes: nomes(q.opcoes) };
      if (q.tipo === 'metade') return { titulo: `qual figura vale a metade da ${nomeFig(q.fig)}?`, destaque: fig(q.fig, 'fx-big'), opcoes: nomes(q.opcoes) };
      if (q.tipo === 'cabem') return { titulo: `quantas ${nomeFig(q.peq)}s cabem numa ${nomeFig(q.fig)}?`, destaque: h('div', { class: 'fx-duas' }, fig(q.fig, 'fx-fig sm'), h('span', {}, '='), fig(q.peq, 'fx-fig sm'), h('span', {}, '× ?')), opcoes: q.opcoes.map((v) => ({ face: h('b', {}, String(v)), label: String(v), certo: v === q.ok })) };
      return { titulo: 'essa pausa é de qual figura?', destaque: pausa(q.fig, 'fx-big'), opcoes: nomes(q.opcoes) };
    }),
    /* monte a figura: cabeça, haste e colchetes */
    monte: (p) => {
      const montes = montesDe(p.nivel); const maxC = maxColchetes(p.nivel); let r = 0; const total = montes.length; let m = { cabeca: null, haste: null, colchetes: null }; let marcas = null;
      const peca = (grupo, valor, face, rot) => h('button', { type: 'button', class: `fx-peca${m[grupo] === valor ? ' on' : ''}${marcas && marcas[grupo] === false && m[grupo] === valor ? ' no' : ''}`, 'aria-label': rot, onclick: () => { m = { ...m, [grupo]: valor }; marcas = null; sfx.play('click'); desenha(); } }, face);
      const ico = (inner) => svgEl(`<svg viewBox="0 0 60 60" aria-hidden="true">${inner}</svg>`, 'fx-ico');
      const desenha = () => {
        const alvo = montes[r]; const preview = noteMarkup({ open: m.cabeca === 'vazia', stem: !!m.haste, flags: m.colchetes || 0 }, 'figura montada');
        const cheio = m.cabeca != null && m.haste != null && m.colchetes != null;
        root.replaceChildren(topo(r, total), h('p', { class: 'fx-q' }, `monte a ${FIG_NAME[alvo]}`), svgEl(preview, 'fx-big'),
          h('p', { class: 'fx-lab' }, 'cabeça'), h('div', { class: 'fx-pecas' }, peca('cabeca', 'cheia', ico('<ellipse cx="30" cy="34" rx="16" ry="11" transform="rotate(-20 30 34)" fill="#1b1818"/>'), 'bolinha pintada'), peca('cabeca', 'vazia', ico('<ellipse cx="30" cy="34" rx="16" ry="11" transform="rotate(-20 30 34)" fill="#fffdf8" stroke="#1b1818" stroke-width="4"/>'), 'bolinha vazia')),
          h('p', { class: 'fx-lab' }, 'haste'), h('div', { class: 'fx-pecas' }, peca('haste', true, ico('<line x1="30" y1="8" x2="30" y2="52" stroke="#1b1818" stroke-width="5"/>'), 'com haste'), peca('haste', false, ico('<line x1="12" y1="30" x2="48" y2="30" stroke="#b9bec8" stroke-width="3" stroke-dasharray="4 4"/>'), 'sem haste')),
          h('p', { class: 'fx-lab' }, 'colchetes'), h('div', { class: 'fx-pecas' }, ...Array.from({ length: maxC + 1 }, (_, n) => n).map((n) => peca('colchetes', n, ico(n === 0 ? '<path d="M14 30h32" stroke="#b9bec8" stroke-width="3" stroke-dasharray="4 4"/>' : Array.from({ length: n }, (_, k) => `<path d="M24 ${12 + k * 14}c6 10 22 10 20 28" stroke="#1b1818" stroke-width="5" fill="none"/>`).join('')), `${n} colchete${n === 1 ? '' : 's'}`))),
          h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', disabled: !cheio, onclick: confere }, 'conferir')));
      };
      const confere = () => {
        const c = confereMonte(montes[r], m); const tudo = c.cabeca && c.haste && c.colchetes;
        if (tudo) { acerto(root.querySelector('.fx-big')); tocar(FIG_BY[montes[r]].beats); S.later(() => { r++; m = { cabeca: null, haste: null, colchetes: null }; marcas = null; if (r >= total) fim(); else desenha(); }, 1100); }
        else { marcas = c; erro(root.querySelector('.fx-big')); desenha(); }
      };
      desenha();
    },
    /* ligar: figura/pausa de um lado e nome, valor ou pausa do outro */
    ligar: (p) => {
      const cfg = ligarCfg(p); const { esq, dir } = paresLigarN(cfg.k, cfg.tipo); let sel = null; const feitos = new Set();
      const faceEsq = (it) => (it.face === 'pausa' ? pausa(it.id, 'fx-fig sm') : fig(it.id, 'fx-fig sm'));
      const faceDir = (it) => (it.face === 'pausa' ? pausa(it.id, 'fx-fig sm') : it.face === 'valor' ? h('b', {}, beatsLabel(FIG_BY[it.id].beats)) : h('b', {}, nomeFig(it.id)));
      const E = esq.map((it) => h('button', { type: 'button', class: 'fx-lig', 'data-f': it.id, 'aria-label': `${it.face === 'pausa' ? 'pausa' : 'figura'} ${nomeFig(it.id)}`, onclick: (e) => { if (feitos.has(it.id)) return; sfx.play('click'); root.querySelectorAll('.fx-lig.sel').forEach((x) => x.classList.remove('sel')); sel = it.id; e.currentTarget.classList.add('sel'); } }, faceEsq(it)));
      const D = dir.map((it) => h('button', { type: 'button', class: 'fx-lig nome', 'data-n': it.id, onclick: (e) => {
        if (feitos.has(it.id) || !sel) return;
        if (sel === it.id) { feitos.add(it.id); acerto(e.currentTarget); e.currentTarget.classList.add('ok'); const l = root.querySelector(`.fx-lig[data-f="${it.id}"]`); l.classList.add('ok'); l.classList.remove('sel'); sel = null; if (feitos.size === esq.length) S.later(fim, 900); }
        else { erro(e.currentTarget); S.later(() => e.currentTarget.classList.remove('no'), 500); } } }, faceDir(it)));
      const instr = { nome: 'toque numa figura e depois no nome dela', valor: 'toque numa figura e depois no quanto ela vale', pausa: 'toque numa pausa e depois no nome da figura dela', figpausa: 'toque numa figura e depois na pausa dela' }[cfg.tipo];
      root.replaceChildren(topo(0, 0), h('p', { class: 'fx-q' }, instr), h('div', { class: 'fx-ligar' }, h('div', { class: 'col' }, ...E), h('div', { class: 'col' }, ...D)));
    },
    /* memória: primeiro mostra os pares, depois vira e eles acham de novo */
    memoria: (p) => {
      const cfg = memCfg(p.nivel); const cartas = paresMem(cfg.k, cfg.modo); window.__figurix.cartas = cartas; let aberta = null; let trava = true; const feitos = new Set();
      const face = (c) => (c.tipo === 'fig' ? fig(c.id, 'fx-fig sm') : c.tipo === 'pausa' ? pausa(c.id, 'fx-fig sm') : h('b', { class: 'fx-txt' }, c.tipo === 'valor' ? beatsLabel(FIG_BY[c.id].beats) : nomeFig(c.id)));
      const B = cartas.map((c) => h('button', { type: 'button', class: 'fx-card aberta', 'data-k': c.k, 'aria-label': 'carta', onclick: () => vira(c, B[c.k]) }, face(c)));
      const vira = (c, b) => {
        if (trava || feitos.has(c.k) || (aberta && aberta.c.k === c.k)) return; sfx.play('click'); b.classList.add('aberta');
        if (!aberta) { aberta = { c, b }; return; }
        const a = aberta; aberta = null;
        if (mesmoParN(a.c, c)) { feitos.add(a.c.k); feitos.add(c.k); a.b.classList.add('ok'); b.classList.add('ok'); acerto(b); if (feitos.size === cartas.length) S.later(fim, 900); }
        else { erro(b); trava = true; S.later(() => { a.b.classList.remove('aberta'); b.classList.remove('aberta', 'no'); trava = false; }, 900); }
      };
      const dica = { fp: 'olha bem: cada figura tem a sua pausa (o silêncio dela). guarde!', fv: 'olha bem: cada figura e quanto ela vale. guarde!', pn: 'olha bem: cada pausa e o nome da figura dela. guarde!', fn: 'olha bem: cada figura e o nome dela. guarde!' }[cfg.modo];
      const msg = h('p', { class: 'fx-q' }, dica);
      root.replaceChildren(topo(0, 0), msg, h('div', { class: 'fx-mem' }, ...B));
      S.later(() => { B.forEach((b) => b.classList.remove('aberta')); trava = false; msg.textContent = 'agora ache os pares!'; }, 5000);
    },
    /* caça-palavras */
    caca: (p) => {
      const g = wordsearch(palavrasDe(p.nivel).map((w) => w.toUpperCase()), grandeCaca(p.nivel), Math.random, p.nivel <= 2 ? EASY_DIRS : DIRS); let ini = null; const achadas = new Set();
      const cel = (x, y) => root.querySelector(`.fx-c[data-x="${x}"][data-y="${y}"]`);
      const clica = (x, y) => {
        sfx.play('click'); if (!ini) { ini = { x, y }; cel(x, y).classList.add('sel'); return; }
        const linha = lineCells(ini.x, ini.y, x, y); root.querySelectorAll('.fx-c.sel').forEach((e) => e.classList.remove('sel')); const a = ini; ini = null;
        if (!linha) { if (a.x !== x || a.y !== y) erro(cel(x, y)); return; }
        const txt = linha.map((c) => g.grid[c.y][c.x]).join(''); const ach = g.placed.find((p) => !achadas.has(p.w) && (p.w === txt || p.w === [...txt].reverse().join('')));
        if (ach) { achadas.add(ach.w); linha.forEach((c) => cel(c.x, c.y).classList.add('ok')); root.querySelector(`.fx-pal[data-w="${ach.w}"]`).classList.add('feita'); acerto(cel(x, y)); if (achadas.size === g.placed.length) S.later(fim, 900); }
        else erro(cel(x, y));
      };
      root.replaceChildren(topo(0, 0), h('p', { class: 'fx-q' }, 'ache as palavras: toque na primeira e na última letra' + (p.nivel > 2 ? ' (vale na diagonal)' : '')),
        h('div', { class: 'fx-grade', style: `--n:${g.size}` }, ...g.grid.flatMap((lin, y) => lin.map((l, x) => h('button', { type: 'button', class: 'fx-c', 'data-x': x, 'data-y': y, 'aria-label': l, onclick: () => clica(x, y) }, l)))),
        h('div', { class: 'fx-pals' }, ...g.placed.map((p) => h('span', { class: 'fx-pal', 'data-w': p.w }, p.w.toLowerCase()))));
      window.__figurix.caca = g;
    },
    /* monte as notas: quantas figuras de cada cabem numa figura-base (as primeiras já vêm certas) */
    notas: (p) => {
      const T = arvore(p.nivel); const feitos = new Set(T.linhas.filter((a) => a.pronto).map((a) => a.id)); const base = nomeFig(T.base);
      const linhas = T.linhas.map((a) => {
        const opts = a.pronto ? null : opcoesCabem(a.cabem);
        const el = h('div', { class: `fx-arv${a.pronto ? ' ok' : ''}`, 'data-id': a.id }, fig(a.id, 'fx-fig sm'), h('span', { class: 'fx-arv-t' }, h('b', {}, nomeFig(a.id)), h('small', {}, `quantas cabem numa ${base}?`)),
          a.pronto ? h('b', { class: 'fx-num' }, String(a.cabem)) : h('div', { class: 'fx-opts' }, ...opts.map((v) => h('button', { type: 'button', class: 'fx-n', onclick: (e) => {
            sfx.play('click'); if (v === a.cabem) { feitos.add(a.id); el.classList.add('ok'); el.querySelector('.fx-opts').replaceWith(h('b', { class: 'fx-num' }, String(v))); acerto(el); tocar(FIG_BY[a.id].beats); if (feitos.size === T.linhas.length) S.later(fim, 900); } else { erro(e.currentTarget); e.currentTarget.disabled = true; } } }, String(v)))));
        return el;
      });
      const prontas = T.linhas.filter((a) => a.pronto).map((a) => nomeFig(a.id)); root.replaceChildren(topo(0, 0), h('p', { class: 'fx-q' }, `${prontas.length > 1 ? `a ${prontas.join(' e a ')} já estão certas` : `a ${prontas[0]} já está certa`}. complete as outras!`), h('div', { class: 'fx-arvore' }, ...linhas));
    },
    /* tetris do Roboterista: a figura (ou a pausa) cai e o Paul vai pro lado do nome certo */
    tetris: (p) => {
      const T = itensTetrisN(p.nivel); const itens = T.itens; let k = 0; let lado = 'esq'; let t0 = 0; let raf = 0; let acabou = false;
      const queda = T.queda * 1000;
      const bot = robo({ mood: 'happy', tier: 0, size: 64, say: '' });
      const paul = h('div', { class: 'fx-paul esq' }, bot.el);
      const nomeEsq = h('b', { class: 'fx-nome esq' }); const nomeDir = h('b', { class: 'fx-nome dir' });
      const queda$ = h('div', { class: 'fx-cai' });
      const campo = h('div', { class: 'fx-campo', role: 'application', 'aria-label': 'toque ou arraste pro lado certo' }, queda$, paul, nomeEsq, nomeDir);
      const vai = (s) => { if (lado !== s) { lado = s; paul.className = `fx-paul ${s}`; sfx.play('click'); } };
      const lado$ = (e) => { const r = campo.getBoundingClientRect(); vai(e.clientX < r.left + r.width / 2 ? 'esq' : 'dir'); };
      campo.addEventListener('pointerdown', (e) => { campo.setPointerCapture && campo.setPointerCapture(e.pointerId); lado$(e); });
      campo.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') lado$(e); });
      const onKey = (e) => { if (e.key === 'ArrowLeft') vai('esq'); else if (e.key === 'ArrowRight') vai('dir'); }; document.addEventListener('keydown', onKey);
      const pronto = () => { acabou = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); };
      const rot = (it, f) => (it.rot === 'valor' ? beatsLabel(FIG_BY[f].beats) : nomeFig(f));
      const proximo = () => {
        if (k >= itens.length) { pronto(); fim(); return; }
        const it = itens[k]; nomeEsq.textContent = rot(it, it.esq); nomeDir.textContent = rot(it, it.dir); queda$.replaceChildren(it.face === 'pausa' ? pausa(it.fig, 'fx-fig sm') : fig(it.fig, 'fx-fig sm')); t0 = performance.now(); window.__figurix.tetris = { item: it, get lado() { return lado; }, vai };
      };
      const passo = (agora) => {
        if (acabou) return; const it = itens[k]; const f = Math.min(1, (agora - t0) / queda); queda$.style.top = `${f * 74}%`;
        if (f >= 1) { const certo = lado === it.ok; if (certo) { acerto(paul); tocar(FIG_BY[it.fig].beats); } else erro(paul); paul.classList.remove('no'); k++; proximo(); }
        raf = requestAnimationFrame(passo);
      };
      const instr = { nome: 'arraste o Paul pro nome certo antes da figura cair!', valor: 'arraste o Paul pra quanto a figura vale antes dela cair!', pausa: 'essa pausa é de qual figura? leve o Paul até ela!' }[T.jeito];
      root.replaceChildren(topo(0, 0), h('p', { class: 'fx-q' }, instr), campo);
      proximo(); raf = requestAnimationFrame(passo); off = pronto;
    },
  };
  mapa();
  return { inProgress: () => jogando, restart: () => { if (!gone) mapa(); }, destroy() { gone = true; limpa(); S.dispose(); sfx.dispose(); delete window.__figurix; } };
}
