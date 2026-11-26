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
import { corSrc } from '../paul-cor.js';
import { wordsearch, lineCells, EASY_DIRS, DIRS } from '../tips.js';
import { ids, PHASES, FASES, MUNDOS, mundoDe, rapidaLentaN, montesDe, maxColchetes, peçasDe, confereMonte, ligarCfg, paresLigarN, memCfg, paresMem, mesmoParN, quizN, totalRL, totalQuiz, palavrasDe, grandeCaca, arvore, opcoesCabem, itensTetrisN, estrelasFigurix, faltam3Mundo, mundoLiberado, COLINHA, FALA_AULINHA, temAulinha, tempoPergunta, novoLugar } from './figurix-logic.js';
import { toast } from '../ui.js';

const fig = (id, cls = 'fx-fig') => svgEl(figureMarkup(id), cls);
const pausa = (id, cls = 'fx-fig') => svgEl(restMarkup(id), cls);
const tocar = (beats) => { try { audio(); tone(beats, 90); } catch { /* sem som */ } };

export function mount(host) {
  const root = h('div', { class: 'jg jg-figurix' }); host.replaceChildren(root);
  const S = session(); const sfx = mapSfx(); let off = null; let gone = false; let jogando = false;
  let fase = 1; let erros = 0; let acertos = 0; const salvo = getGame('figurix'); let mundo = MUNDOS.some((m) => m.id === salvo.mundo) ? salvo.mundo : MUNDOS[0].id;
  const estOf = (n) => ((getGame('figurix').est || {})[n] || 0);
  // regra da Bea (área dos alunos): o próximo mundo só abre com 3 ★ em todas as fases do anterior. No app da Bea fica tudo aberto.
  const REGRA = document.documentElement.classList.contains('aluno-on'); const aberto = (id) => !REGRA || mundoLiberado(getGame('figurix').est || {}, id);
  const motivo = (id) => { const ant = MUNDOS[MUNDOS.findIndex((x) => x.id === id) - 1]; const f = faltam3Mundo(getGame('figurix').est || {}, ant.id); return `faltam 3 ★ em ${f} fase${f === 1 ? '' : 's'} de ${ant.nome}`; };
  if (!aberto(mundo)) mundo = MUNDOS[0].id;
  const guarda = (n, v) => { const g = getGame('figurix'); setGame('figurix', { ...g, est: { ...(g.est || {}), [n]: v } }); };
  const limpa = () => { if (off) { try { off(); } catch { /* ok */ } off = null; } S.reset(); };
  window.__figurix = { get erros() { return erros; } }; // só pros testes automáticos

  /* ---------- mapa (abre aqui): 4 mundos, cada um com o seu cenário ---------- */
  const estMundo = (m) => PHASES.slice(m.de - 1, m.ate).reduce((t, p) => t + estOf(p.n), 0);
  const mapa = () => {
    limpa(); jogando = false; root.dataset.skin = 'a'; const M = MUNDOS.find((x) => x.id === mundo) || MUNDOS[0];
    const box = h('div', { class: 'tm-map' });
    const fases = PHASES.slice(M.de - 1, M.ate);
    const levels = fases.map((p, i) => ({ id: `fx:${p.n}`, index: i + 1, label: String(i + 1), tag: '', boss: i === fases.length - 1 }));
    const tabs = h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': 'Mundo' }, ...MUNDOS.map((m, i) => { const ok = aberto(m.id); return h('button', { type: 'button', role: 'radio', 'aria-checked': String(m.id === mundo), class: `${m.id === mundo ? 'on' : ''}${ok ? '' : ' lock'}`, 'data-lock': ok ? null : '1', 'aria-label': `mundo ${i + 1}: ${m.nome}${ok ? '' : `, trancado: ${motivo(m.id)}`}`,
      onclick: () => { if (!ok) { toast(`mundo trancado: ${motivo(m.id)}`, { ms: 3400 }); return; } mundo = m.id; setGame('figurix', { ...getGame('figurix'), mundo }); mapa(); } }, `${ok ? '' : '🔒 '}${i + 1} · ${m.curto}`); }));
    root.replaceChildren(h('p', { class: 'tm-dica' }, `${M.nome} · ${M.sub}`), h('a', { class: 'btn small ghost fx-pergunta', href: '#/estudos/aulas' }, h('img', { class: 'fx-pergunta-p', src: corSrc('duvida'), alt: '', draggable: 'false' }), ' perguntar pro Paul'), box);
    off = mountProgressionMap(box, { gameId: `figurix-${M.id}`, levels, profileId: 'figurix', unitName: 'Fase', tier: 0, stars: { have: estMundo(M), max: fases.length * 3 }, theme: { id: `mundo-${M.tema}`, name: M.nome, regions: M.regioes },
      starsOf: (id) => estOf(Number(id.split(':')[1])), unlockedOf: () => true, lockedMsg: '', onOpen: (lv) => comeca(fases[lv.index - 1].n) });
    const hd = box.querySelector('.mp-head'); const bar = h('div', { class: 'tm-bar' }, tabs); if (hd) hd.append(bar); else box.prepend(bar);
  };
  // errou uma vez = já não dá 3 ★ nesta rodada: aparece o botão de recomeçar a fase (pedido da Bea)
  const btnRecomeca = () => h('button', { class: 'btn small fx-recomeca', type: 'button', onclick: () => joga(fase) }, '↻ recomeçar');
  const topo = (feitas, total) => h('div', { class: 'tr-fasehead' }, h('button', { class: 'btn small ghost', type: 'button', onclick: mapa }, '‹ mapa'), jogando && erros > 0 ? btnRecomeca() : null,
    total ? h('span', { class: 'dn-dots', role: 'img', 'aria-label': `${Math.min(feitas + 1, total)} de ${total}` }, ...Array.from({ length: total }, (_, i) => h('i', { class: i < feitas ? 'on' : i === feitas ? 'now' : '' }))) : null);
  const acerto = (el) => { acertos++; try { FB.win(el); } catch { /* ok */ } };
  const erro = (el) => { erros++; try { FB.lose(el); } catch { /* ok */ } if (el && el.classList) { el.classList.add('no'); } if (jogando && !root.querySelector('.fx-recomeca')) { const hd = root.querySelector('.tr-fasehead'); const b = btnRecomeca(); if (hd) hd.querySelector('button').after(b); else root.prepend(b); } };
  const joga = (n) => { limpa(); fase = n; mundo = mundoDe(n).id; erros = 0; acertos = 0; jogando = true; const p = PHASES[n - 1]; root.dataset.skin = ['monte', 'memoria', 'caca', 'tetris', 'notas'].includes(p.tipo) ? 'c' : 'a'; (RUN[p.tipo] || RUN.quiz)(p); };
  /** Aulinha das 3 primeiras fases: a colinha das figuras, a dica do Paul e o caminho pras aulas nos Estudos (lá vale estrela). */
  const aulinha = (n) => {
    limpa(); jogando = false; root.dataset.skin = 'a'; const p = PHASES[n - 1];
    root.replaceChildren(topo(0, 0), h('h2', { class: 'jg-h hand' }, 'aulinha rápida do Paul'), h('p', { class: 'jg-p fx-aula-fala' }, FALA_AULINHA[p.tipo] || ''),
      h('table', { class: 'fx-colinha' }, h('caption', {}, 'colinha das figuras'), h('tbody', {}, ...COLINHA.map(([id, dura]) => h('tr', {}, h('td', { class: 'fx-col-fig' }, fig(id, 'fx-fig fx-fig-mini')), h('th', { scope: 'row' }, FIG_NAME[id]), h('td', {}, dura))))),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary fx-aula-jogar', type: 'button', onclick: () => joga(n) }, `jogar a fase ${n} ▶`), h('a', { class: 'btn fx-pergunta', href: '#/estudos/aulas' }, h('img', { class: 'fx-pergunta-p', src: corSrc('duvida'), alt: '', draggable: 'false' }), ' perguntar pro Paul')));
  };
  const comeca = (n) => { if (!aberto(mundoDe(n).id)) { toast(`mundo trancado: ${motivo(mundoDe(n).id)}`, { ms: 3400 }); mapa(); return; } if (temAulinha(n)) aulinha(n); else joga(n); };

  /* ---------- fim da fase ---------- */
  const fim = () => {
    limpa(); jogando = false; const est = (PHASES[fase - 1] || {}).tipo === 'memoria' ? 3 : estrelasFigurix(acertos, erros); const antes = estOf(fase); // memória: concluiu = 3 ★
    if (est === 0) { // menos de 60% de acertos: não conclui, tenta de novo
      sfx.play('click'); root.replaceChildren(topo(0, 0), h('h2', { class: 'jg-h hand' }, 'quase lá!'), h('p', { class: 'jg-p' }, `você acertou ${acertos} de ${acertos + erros} tentativas. bora de novo!`),
        h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => comeca(fase) }, 'tentar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: mapa }, 'ver o mapa'))); return;
    }
    if (est > antes) { guarda(fase, est); import('../figurinhas/mesa.js').then((M) => M.vitoria('figurix', est - antes)).catch(() => {}); }
    { const Mw = mundoDe(fase); if (PHASES.slice(Mw.de - 1, Mw.ate).every((p) => estOf(p.n) >= 1)) import('../figurinhas/mundos-premio.js').then((X) => X.premiarMundo(`figurix:${Mw.id}`)).catch(() => {});  if (!(fase === FASES && Mw.id === MUNDOS[MUNDOS.length - 1].id)) setTimeout(() => import('../conquista.js').then((C) => C.festaCaminho({ jogo: 'Figurix', caminho: Mw.nome, chave: `figurix:${Mw.id}`, pose: 'estante', premioChave: `figurix:${Mw.id}` })).catch(() => {}), 700); } // festa ao acabar QUALQUER mundo (o último já tem a festa do caminho todo logo abaixo) // mundo concluído (todas as fases dele com estrela) = pacote de bandas e artistas
    sfx.play('win');
    if (fase === FASES) setTimeout(() => import('../conquista.js').then((C) => C.festaCaminho({ jogo: 'Figurix', caminho: 'todas as fases', chave: 'figurix', pose: 'estante', premioChave: `figurix:${MUNDOS[MUNDOS.length - 1].id}` })).catch(() => {}), 700); // terminou o caminho: festa + postar
    root.replaceChildren(topo(0, 0), h('h2', { class: 'jg-h hand' }, `fase ${fase} concluída!`), h('p', { class: 'dn-estrelas', 'aria-label': `${est} de 3 estrelas` }, '★'.repeat(est), '☆'.repeat(3 - est)),
      h('p', { class: 'jg-p' }, erros ? `${acertos} acertos e ${erros} erro${erros > 1 ? 's' : ''}.` : 'sem nenhum erro. perfeito!'),
      h('div', { class: 'jg-actions' }, fase < FASES && aberto(mundoDe(fase + 1).id) ? h('button', { class: 'btn primary', type: 'button', onclick: () => comeca(fase + 1) }, mundoDe(fase + 1).id !== mundoDe(fase).id ? `próximo mundo ▶ ${mundoDe(fase + 1).curto}` : 'próxima fase ▶') : null,
        fase < FASES && !aberto(mundoDe(fase + 1).id) ? h('p', { class: 'jg-p fx-trava' }, `🔒 pra abrir o próximo mundo: ${motivo(mundoDe(fase + 1).id)}.`) : null, h('button', { class: `btn${est < 3 ? ' fx-recomeca' : ''}`, type: 'button', onclick: () => joga(fase) }, est < 3 ? '↻ recomeçar' : 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: mapa }, 'ver o mapa')));
  };

  /* ---------- as fases ---------- */
  // uma pergunta de cada vez: `render(i)` devolve { el, ok(btn)... }; aqui o padrão é "escolher a certa entre cartões" (rápida, lenta, quiz)
  // pedido da Bea (estava fácil demais): a pergunta não se repete na fase, a resposta certa NUNCA fica no mesmo lugar duas vezes seguidas,
  // e cada pergunta tem um tempo que vai ficando mais curto (acabou o tempo = conta como erro e passa pra próxima).
  const perguntas = (titulo, total, fazer) => {
    let i = 0; let lugar = -1; const usadas = new Set(); const nivel = (PHASES[fase - 1] || {}).nivel || 1;
    const chaveDe = (q) => `${q.titulo || ''}|${(q.opcoes.find((o) => o.certo) || {}).label}|${q.opcoes.map((o) => o.label).sort().join(',')}`;
    const mostra = () => {
      let q = fazer(i); for (let t = 0; t < 12 && usadas.has(chaveDe(q)); t++) q = fazer(i); usadas.add(chaveDe(q)); S.reset();
      const ops = q.opcoes.slice(); const onde = novoLugar(ops.findIndex((o) => o.certo), lugar, ops.length); { const c = ops.findIndex((o) => o.certo); if (c >= 0 && onde !== c) { const tmp = ops[onde]; ops[onde] = ops[c]; ops[c] = tmp; } } lugar = onde;
      window.__figurix.certa = (ops.find((o) => o.certo) || {}).label; window.__figurix.lugar = lugar; // só pros testes
      const vez = i; let fechada = false; const seg = tempoPergunta(i, nivel); window.__figurix.seg = seg;
      const segue = () => { i++; if (i >= total) fim(); else mostra(); };
      const cartoes = ops.map((o) => { const b = h('button', { type: 'button', class: `fx-op${o.cls ? ` ${o.cls}` : ''}`, 'aria-label': o.label, 'data-certo': o.certo ? '1' : null, onclick: () => {
        if (fechada || b.classList.contains('feito')) return; sfx.play('click');
        if (o.certo) { fechada = true; barra.classList.add('parada'); b.classList.add('ok', 'feito'); acerto(b); S.later(segue, 800); } else { erro(b); b.disabled = true; } } }, o.face); return b; });
      const barra = h('div', { class: 'fx-tempo', role: 'timer', 'aria-label': `${Math.round(seg)} segundos pra responder` }, h('i', { style: `animation-duration:${seg}s` }));
      root.replaceChildren(topo(i, total), barra, h('p', { class: 'fx-q' }, q.titulo || titulo), q.destaque || null, h('div', { class: `fx-ops n${ops.length}` }, ...cartoes));
      let semTempo = false; try { semTempo = localStorage.getItem('beaterista-figurix-sem-tempo') === '1'; } catch { /* ok */ } // só os testes de tela antigos usam (eles respondem devagar)
      if (semTempo) barra.hidden = true; else S.later(() => { if (fechada || vez !== i || !jogando) return; fechada = true; barra.classList.add('acabou'); erro(null); const certo = cartoes.find((b) => b.dataset.certo); if (certo) certo.classList.add('ok'); cartoes.forEach((b) => { b.disabled = true; }); S.later(segue, 1100); }, seg * 1000);
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
      // cada linha (cabeça, haste, colchetes) tem sempre uma opção; sem colchete e sem haste são botões de verdade
      const peca = (grupo, valor, texto, cor, aria) => h('button', { type: 'button', 'data-g': grupo, 'data-v': String(valor), class: `fx-peca c${cor}${m[grupo] === valor ? ' on' : ''}${marcas && marcas[grupo] === false && m[grupo] === valor ? ' no' : ''}`, 'aria-label': aria || texto, onclick: () => { m = { ...m, [grupo]: valor }; marcas = null; sfx.play('click'); desenha(); } }, texto);
      const desenha = () => {
        const alvo = montes[r]; const preview = noteMarkup({ open: m.cabeca === 'vazia', stem: !!m.haste, flags: m.colchetes || 0 }, 'figura montada');
        const cheio = m.cabeca != null && m.haste != null && m.colchetes != null;
        root.replaceChildren(topo(r, total), h('p', { class: 'fx-q' }, `monte a ${FIG_NAME[alvo]}`), svgEl(preview, 'fx-big'),
          h('div', { class: 'fx-pecas' }, peca('cabeca', 'cheia', 'preenchida', 1), peca('cabeca', 'vazia', 'não preenchida', 2)),
          h('p', { class: 'fx-lab' }, 'haste'), h('div', { class: 'fx-pecas' }, peca('haste', true, 'com haste', 3), peca('haste', false, 'sem haste', 4)),
          h('p', { class: 'fx-lab' }, 'colchetes'), h('div', { class: 'fx-pecas fx-colch' }, ...Array.from({ length: maxC + 1 }, (_, n) => n).map((n) => peca('colchetes', n, String(n), (n % 4) + 1, n === 0 ? 'sem colchete' : `${n} colchete${n === 1 ? '' : 's'}`))), // só os números 0 1 2 3 4, todos na mesma linha
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
      const cfg = ligarCfg(p);
      if (cfg.tipo === 'tres') { // fases do fim: liga o desenho, o nome e quanto vale (3 colunas, na ordem)
        const { esq, dir } = paresLigarN(cfg.k, 'nome'); const valores = esq.map((x) => x.id).sort(() => Math.random() - 0.5); let sel = null; let etapa = 0; const feitos = new Set();
        const btn = (cls, dados, conteudo, onclick) => h('button', { type: 'button', class: `fx-lig ${cls}`, ...dados, onclick }, conteudo);
        const flash = (el) => { erro(el); S.later(() => el.classList.remove('no'), 500); };
        const E = esq.map((it) => btn('', { 'data-f': it.id, 'aria-label': `figura ${nomeFig(it.id)}` }, fig(it.id, 'fx-fig sm'), (e) => { if (feitos.has(it.id) || etapa !== 0) return; sfx.play('click'); sel = it.id; etapa = 1; e.currentTarget.classList.add('sel'); }));
        const N = dir.map((it) => btn('nome', { 'data-n': it.id }, h('b', {}, nomeFig(it.id)), (e) => { if (feitos.has(it.id) || etapa !== 1) return; if (it.id === sel) { sfx.play('click'); e.currentTarget.classList.add('ok'); etapa = 2; } else flash(e.currentTarget); }));
        const V = valores.map((id) => btn('valor', { 'data-v': id }, h('b', {}, beatsLabel(FIG_BY[id].beats)), (e) => {
          if (feitos.has(id) || etapa !== 2) return;
          if (id === sel) { feitos.add(id); acerto(e.currentTarget); [e.currentTarget, root.querySelector(`.fx-lig[data-f="${id}"]`), root.querySelector(`.fx-lig[data-n="${id}"]`)].forEach((x) => { x.classList.remove('sel'); x.classList.add('ok'); }); sel = null; etapa = 0; if (feitos.size === esq.length) S.later(fim, 900); }
          else flash(e.currentTarget); }));
        root.replaceChildren(topo(0, 0), h('p', { class: 'fx-q' }, 'toque no desenho, depois no nome e por fim em quanto ele vale'), h('div', { class: 'fx-ligar tres' }, h('div', { class: 'col' }, ...E), h('div', { class: 'col' }, ...N), h('div', { class: 'col' }, ...V)));
        return;
      } const { esq, dir } = paresLigarN(cfg.k, cfg.tipo); let sel = null; const feitos = new Set();
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
      const cfg = memCfg(p.nivel); const cartas = paresMem(cfg.k, cfg.modo); window.__figurix.cartas = cartas; let aberta = null; let trava = false; const feitos = new Set();
      const face = (c) => (c.tipo === 'fig' ? fig(c.id, 'fx-fig sm') : c.tipo === 'pausa' ? pausa(c.id, 'fx-fig sm') : h('b', { class: 'fx-txt' }, c.tipo === 'valor' ? beatsLabel(FIG_BY[c.id].beats) : nomeFig(c.id)));
      const B = cartas.map((c) => h('button', { type: 'button', class: 'fx-card', 'data-k': c.k, 'aria-label': 'carta', onclick: () => vira(c, B[c.k]) }, face(c)));
      const vira = (c, b) => {
        if (trava || feitos.has(c.k) || (aberta && aberta.c.k === c.k)) return; sfx.play('click'); b.classList.add('aberta');
        if (!aberta) { aberta = { c, b }; return; }
        const a = aberta; aberta = null;
        if (mesmoParN(a.c, c)) { feitos.add(a.c.k); feitos.add(c.k); a.b.classList.add('ok'); b.classList.add('ok'); acerto(b); if (feitos.size === cartas.length) S.later(fim, 900); }
        else { try { FB.lose(b); } catch { /* ok */ } erros++; b.classList.add('no'); trava = true; S.later(() => { a.b.classList.remove('aberta'); b.classList.remove('aberta', 'no'); trava = false; }, 900); }
      };
      const msg = h('p', { class: 'fx-q' }, 'ache os pares!');
      root.replaceChildren(topo(0, 0), msg, h('div', { class: 'fx-mem' }, ...B));
    },
    /* caça-palavras */
    caca: (p) => {
      const g = wordsearch(palavrasDe(p.nivel).map((w) => w.toUpperCase()), grandeCaca(p.nivel), Math.random, p.nivel <= 2 ? EASY_DIRS : DIRS); let ini = null; const achadas = new Set();
      const cel = (x, y) => root.querySelector(`.fx-c[data-x="${x}"][data-y="${y}"]`);
      const limpaSel = () => root.querySelectorAll('.fx-c.sel').forEach((e) => e.classList.remove('sel'));
      /** confere a linha entre duas letras: achou uma palavra da lista (de frente ou ao contrário)? */
      const avalia = (a, x, y) => {
        const linha = lineCells(a.x, a.y, x, y); limpaSel();
        if (!linha) { if (a.x !== x || a.y !== y) erro(cel(x, y)); return; }
        const txt = linha.map((c) => g.grid[c.y][c.x]).join(''); const ach = g.placed.find((p) => !achadas.has(p.w) && (p.w === txt || p.w === [...txt].reverse().join('')));
        if (ach) { achadas.add(ach.w); const cor = achadas.size % 4 || 4; linha.forEach((c) => { const e = cel(c.x, c.y); e.classList.add('ok', `k${cor}`); }); const pal = root.querySelector(`.fx-pal[data-w="${ach.w}"]`); pal.classList.add('feita', `k${cor}`); acerto(cel(x, y)); if (achadas.size === g.placed.length) S.later(fim, 900); }
        else erro(cel(x, y));
      };
      const clica = (x, y) => { // jeito antigo (ainda vale): toca na primeira e na última letra
        sfx.play('click'); if (!ini) { ini = { x, y }; cel(x, y).classList.add('sel'); return; }
        const a = ini; ini = null; avalia(a, x, y);
      };
      // arrastar o dedo: pointerdown na 1ª letra, passa por cima e solta na última
      let arrasto = null;
      const celDe = (ev) => { const el = document.elementFromPoint(ev.clientX, ev.clientY); const c = el && el.closest ? el.closest('.fx-c') : null; return c ? { x: Number(c.dataset.x), y: Number(c.dataset.y) } : null; };
      const pinta = (a, b) => { limpaSel(); const l = lineCells(a.x, a.y, b.x, b.y); (l || [a]).forEach((c) => { const e = cel(c.x, c.y); if (e && !e.classList.contains('ok')) e.classList.add('sel'); }); };
      const aoSoltar = (ev) => { const a = arrasto; arrasto = null; if (!a) return; document.removeEventListener('pointermove', aoMover); document.removeEventListener('pointerup', aoSoltar); document.removeEventListener('pointercancel', aoSoltar);
        const f = celDe(ev) || a.fim || { x: a.x, y: a.y }; if (!a.moveu || (f.x === a.x && f.y === a.y)) { limpaSel(); clica(a.x, a.y); return; } sfx.play('click'); ini = null; avalia({ x: a.x, y: a.y }, f.x, f.y); };
      const aoMover = (ev) => { if (!arrasto) return; const c = celDe(ev); if (!c) return; if (c.x !== arrasto.x || c.y !== arrasto.y) arrasto.moveu = true; arrasto.fim = c; if (arrasto.moveu) pinta(arrasto, c); };
      const aoApertar = (ev, x, y) => { if (ev.button > 0) return; ev.preventDefault(); arrasto = { x, y, moveu: false, fim: null }; document.addEventListener('pointermove', aoMover); document.addEventListener('pointerup', aoSoltar); document.addEventListener('pointercancel', aoSoltar); };
      off = () => { document.removeEventListener('pointermove', aoMover); document.removeEventListener('pointerup', aoSoltar); document.removeEventListener('pointercancel', aoSoltar); };
      root.replaceChildren(topo(0, 0), h('p', { class: 'fx-q' }, 'arraste o dedo sobre a palavra' + (p.nivel > 2 ? ' (vale na diagonal e ao contrário)' : '')),
        h('div', { class: 'fx-grade', style: `--n:${g.size}` }, ...g.grid.flatMap((lin, y) => lin.map((l, x) => h('button', { type: 'button', class: 'fx-c', 'data-x': x, 'data-y': y, 'aria-label': l, onpointerdown: (ev) => aoApertar(ev, x, y), onclick: (ev) => { if (ev.detail === 0) clica(x, y); } }, l)))),
        h('div', { class: 'fx-pals' }, ...g.placed.map((p) => h('span', { class: 'fx-pal', 'data-w': p.w }, p.w.toLowerCase()))));
      window.__figurix.caca = g;
    },
    /* monte as notas: quantas figuras de cada cabem numa figura-base (as primeiras já vêm certas) */
    notas: (p) => {
      const T = arvore(p.nivel); const feitos = new Set(T.linhas.filter((a) => a.pronto).map((a) => a.id)); const base = nomeFig(T.base);
      /* a barra mostra a figura-base (ex.: a semibreve) DIVIDIDA nas partes que cabem: dá pra VER a conta (até 8 partes com a nota dentro; 16, 32, 64 viram fatias finas) */
      const barra = (a) => { const n = Math.min(64, a.cabem); return h('div', { class: `fx-barra${n > 8 ? ' fina' : ''}`, style: `--n:${n}`, 'aria-hidden': 'true' }, ...Array.from({ length: n }, () => h('i', {}, n <= 8 ? fig(a.id, 'fx-fig xs') : null))); };
      const linhas = T.linhas.map((a) => {
        const opts = a.pronto ? null : opcoesCabem(a.cabem);
        const el = h('div', { class: `fx-arv${a.pronto ? ' ok' : ''}`, 'data-id': a.id }, fig(a.id, 'fx-fig sm'), h('span', { class: 'fx-arv-t' }, h('b', {}, nomeFig(a.id)), h('small', {}, `quantas cabem numa ${base}?`)),
          a.pronto ? h('b', { class: 'fx-num' }, String(a.cabem)) : h('div', { class: 'fx-opts' }, ...opts.map((v, i) => h('button', { type: 'button', class: `fx-n c${(i % 4) + 1}`, onclick: (e) => {
            sfx.play('click'); if (v === a.cabem) { feitos.add(a.id); el.classList.add('ok'); el.querySelector('.fx-opts').replaceWith(h('b', { class: 'fx-num' }, String(v))); el.append(barra(a)); acerto(el); tocar(FIG_BY[a.id].beats); if (feitos.size === T.linhas.length) S.later(fim, 900); } else { erro(e.currentTarget); e.currentTarget.disabled = true; } } }, String(v)))));
        if (a.pronto) el.append(barra(a));
        return el;
      });
      const prontas = T.linhas.filter((a) => a.pronto).map((a) => nomeFig(a.id)); root.replaceChildren(topo(0, 0), h('p', { class: 'fx-q' }, `${prontas.length > 1 ? `a ${prontas.join(' e a ')} já estão certas` : `a ${prontas[0]} já está certa`}. complete as outras!`), h('div', { class: 'fx-arvore' }, ...linhas));
    },
    /* tetris do Roboterista: a figura (ou a pausa) cai e o Paul vai pro lado do nome certo */
    tetris: (p) => {
      const T = itensTetrisN(p.nivel); const N = 3; const queda = (T.queda + 0.5) * 1000; let k = 0; let lado = 0; let t0 = 0; let raf = 0; let acabou = false; // SEMPRE 3 faixas (3 nomes, 1 certo): com 2 era fácil demais
      const rot = (it, f) => (it.rot === 'valor' ? beatsLabel(FIG_BY[f].beats) : nomeFig(f));
      const emb = (arr) => { const r = arr.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
      const itens = T.itens.map((it) => { const certo = rot(it, it.fig); const outros = emb(ids.filter((f) => f !== it.fig)).map((f) => rot(it, f)).filter((t, i, a) => t !== certo && a.indexOf(t) === i).slice(0, N - 1); const ops = emb([certo, ...outros]); return { ...it, ops, ok: ops.indexOf(certo) }; });
      itens.forEach((it, i) => { if (i > 0 && it.ok === itens[i - 1].ok) { const j = (it.ok + 1 + Math.floor(Math.random() * (N - 1))) % N; [it.ops[it.ok], it.ops[j]] = [it.ops[j], it.ops[it.ok]]; it.ok = j; } }); // a faixa certa NUNCA é a mesma duas vezes seguidas
      let inicioAnt = -1;
      const paul = h('div', { class: 'fx-paul n3' }, h('img', { src: corSrc('ouvindo'), alt: '', draggable: 'false' })); // o Paul de fone, sem a bateria
      const nomes = Array.from({ length: N }, (_, i) => h('b', { class: 'fx-nome n3', style: `left:${(i / N) * 100 + 1.5}%;width:${100 / N - 3}%` }));
      const queda$ = h('div', { class: 'fx-cai' });
      const campo = h('div', { class: 'fx-campo n3', role: 'application', 'aria-label': 'toque ou arraste pro lado certo' }, ...Array.from({ length: N - 1 }, (_, i) => h('i', { class: 'fx-div', style: `left:${((i + 1) / N) * 100}%` })), queda$, paul, ...nomes);
      const poe = () => { paul.style.left = `${((lado + 0.5) / N) * 100}%`; };
      const vai = (s) => { const i = s === 'esq' ? 0 : s === 'dir' ? N - 1 : Number(s); if (i >= 0 && i < N && lado !== i) { lado = i; poe(); sfx.play('click'); } };
      const lado$ = (e) => { const r = campo.getBoundingClientRect(); vai(Math.min(N - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * N)))); };
      campo.addEventListener('pointerdown', (e) => { campo.setPointerCapture && campo.setPointerCapture(e.pointerId); lado$(e); });
      campo.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') lado$(e); });
      const onKey = (e) => { if (e.key === 'ArrowLeft') vai(Math.max(0, lado - 1)); else if (e.key === 'ArrowRight') vai(Math.min(N - 1, lado + 1)); }; document.addEventListener('keydown', onKey);
      const pronto = () => { acabou = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); };
      const proximo = () => {
        if (k >= itens.length) { pronto(); fim(); return; }
        const it = itens[k]; nomes.forEach((n, i) => { n.textContent = it.ops[i]; }); queda$.replaceChildren(it.face === 'pausa' ? pausa(it.fig, 'fx-fig sm') : fig(it.fig, 'fx-fig sm')); t0 = performance.now();
        { const erradas = Array.from({ length: N }, (_, i) => i).filter((i) => i !== it.ok); const outras = erradas.filter((i) => i !== inicioAnt); const lista = outras.length ? outras : erradas; lado = lista[Math.floor(Math.random() * lista.length)]; inicioAnt = lado; poe(); } // o Paul NUNCA começa na faixa certa nem na mesma de onde começou antes
        window.__figurix.tetris = { item: it, get lado() { return lado; }, vai };
      };
      const passo = (agora) => {
        if (acabou) return; const it = itens[k]; const f = Math.min(1, (agora - t0) / queda); queda$.style.top = `${f * 74}%`;
        if (f >= 1) { const certo = lado === it.ok; if (certo) { acerto(paul); tocar(FIG_BY[it.fig].beats); } else erro(paul); paul.classList.remove('no'); k++; proximo(); }
        raf = requestAnimationFrame(passo);
      };
      const instr = { nome: 'arraste o Paul pro nome certo antes da figura cair!', valor: 'arraste o Paul pra quanto a figura vale antes dela cair!', pausa: 'essa pausa é de qual figura? leve o Paul até ela!' }[T.jeito];
      root.replaceChildren(topo(0, 0), h('p', { class: 'fx-q' }, instr), campo);
      poe(); proximo(); raf = requestAnimationFrame(passo); off = pronto;
    },
  };
  mapa();
  return { inProgress: () => jogando, restart: () => { if (!gone) mapa(); }, destroy() { gone = true; limpa(); S.dispose(); sfx.dispose(); delete window.__figurix; } };
}
