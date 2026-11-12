// pauLta: telas (início, mundos, fases, perfil, ranking, legenda, aulinhas, reforço).
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as P from '../kids/progress.js';
import * as RK from '../ranking.js';
import * as Album from '../kids/album.js';
import { robo, tierOf } from '../kids/robo.js';
import { stars as sparkle, toast, confirmSheet } from '../ui.js';
import { svgEl } from '../kids/art.js';
import { silence } from '../audio.js';
import { newPlayer, switchPlayer, cardBg } from '../views/kids.js';
import { worldIcon } from './icons.js';
import { worldMap } from './mapa.js';
import { WORLDS, WORLD_IDS, MODES, LEVELS, isDrum, makeQuestion, phaseSpec, reinforceQuestion, parseNoteName } from './worlds.js';
import * as RW from './recompensas.js';
import * as FR from '../figurinhas/rewards.js';
import { drumStaff, clefStaff, legendHtml } from './draw.js';
import { noteName } from './music.js';
import { LESSONS } from './lessons.js';
import * as S from './score.js';
import * as V from './save.js';
import { livre } from './livre.js';
import * as sfx from './sfx.js';
import { runSession, teachCards, soundBtn } from './run.js';

const MODE_KEY = 'beaterista-paulta-mode';
const getMode = () => { try { const m = localStorage.getItem(MODE_KEY); return m === 'imagens' ? 'imagens' : 'nomes'; } catch { return 'nomes'; } };
const setMode = (m) => { try { localStorage.setItem(MODE_KEY, m); } catch { /* ok */ } };
const BASE = '#/paulta';
export const LOGO = () => h('span', { class: 'pl-logo' }, 'pau', h('b', {}, 'L'), 'ta');
/** Título de tela no estilo do Kids: ícone de linha + nome em marker vermelho. */
const gtitle = (iconHtml, title, sub) => { const ico = h('span', { class: 'kx-gico' }); ico.innerHTML = iconHtml; return h('div', { class: 'kx-gtitle' }, ico, h('div', {}, h('h1', { class: 'kx-pix kx-pagetitle' }, title), sub ? h('p', { class: 'kx-gd' }, sub) : null)); };
const pageH1 = (t) => h('h1', { class: 'kx-pix kx-pagetitle pl-ph' }, t);
const topBar = (back, right) => h('div', { class: 'kx-top' }, h('a', { class: 'kx-back', href: back }, '‹ voltar'), right || null);
const bar = (pct, cls = '') => h('span', { class: `pl-bar ${cls}`, 'aria-hidden': 'true' }, h('i', { style: `width:${Math.round(pct)}%` }));
const titleChip = (p) => { const t = S.currentTitle(p); return t ? h('em', { class: 'pl-title', 'data-t': t.id }, t.name) : null; };

/* ---------- início ---------- */
function homeScreen(host, rerender) {
  const me = P.active();
  if (!me) {
    const r = robo({ mood: 'peace', size: 110, say: 'oi! eu sou o Paul, o robôterista. qual é o seu nome?' });
    host.append(topBar('#/jogos'), gtitle(worldIcon('sol'), LOGO(), 'o jogo da leitura musical'), h('div', { class: 'kx-hello' }, r.el), h('button', { class: 'kd-btn kx-go', type: 'button', onclick: () => newPlayer(rerender) }, 'começar'));
    return;
  }
  const p = V.getP(me.id); const tier = tierOf(P.totalStars(me.id)); const pts = S.points(p);
  const say = !p.started ? `oi, ${me.name}! escolhe um mundo pra começar. pode ser qualquer um!` : S.mainDone(p) >= 3 ? 'você leu o mundo inteiro! falta o duelo!' : `bora, ${me.name}! já são ${pts} pontos.`;
  const r = robo({ mood: p.started ? 'happy' : 'wave', tier, size: 96, say });
  const card = (w) => {
    const W = WORLDS[w]; const done = S.worldProgress(p, w); const lock = w === 'duel' && !S.duelUnlocked(p); const full = S.worldDone(p, w);
    const ico = h('span', { class: 'kx-gi' }); ico.innerHTML = worldIcon(w);
    const kids = [cardBg(), ico, h('b', { class: 'kx-gt' }, lock ? `🔒 ${W.short}` : W.short), h('span', { class: 'kx-bar', 'aria-hidden': 'true' }, h('i', { style: `width:${Math.round((done / W.count) * 100)}%` })),
      h('span', { class: 'kx-gm' }, lock ? 'conclua sol e fá' : full ? `🏅 concluído · ${W.count} fases` : `${done}/${W.count} fases`)];
    return lock ? h('button', { type: 'button', class: 'kx-g pl-locked', onclick: () => toast('conclua os mundos de sol e fá pra liberar o duelo', { ms: 2600 }) }, ...kids)
      : h('a', { class: `kx-g${done ? ' on' : ''}`, href: `${BASE}/${w}`, 'data-mundo': w }, ...kids);
  };
  host.append(topBar('#/jogos'), gtitle(worldIcon('sol'), LOGO(), 'o jogo da leitura musical · com o Paul'),
    h('div', { class: 'kx-me' }, h('span', { class: 'kx-av', 'aria-hidden': 'true' }, me.name.trim()[0].toUpperCase()), h('span', {}, h('b', {}, me.name), h('br'), titleChip(p) || h('small', {}, 'sem título ainda')), h('span', { class: 'kd-stars' }, `${pts} pts`), h('button', { class: 'btn small ghost', type: 'button', onclick: () => switchPlayer(rerender) }, 'trocar')),
    h('div', { class: 'kx-hello' }, r.el),
    h('h2', { class: 'kx-h' }, 'mundos'), h('div', { class: 'kx-cards' }, ...['drumF', 'drumI', 'drumD', 'sol', 'fa', 'duel'].map(card)),
    h('div', { class: 'pl-links' }, h('a', { class: 'kd-chip', href: `${BASE}/perfil` }, '👤 perfil e títulos'), h('a', { class: 'kd-chip', href: `${BASE}/ranking` }, '🏆 ranking'), h('a', { class: 'kd-chip', href: `${BASE}/reforco/${getMode()}` }, '🎯 revisão do Paul'), h('a', { class: 'kd-chip', href: `${BASE}/legenda` }, '📖 legenda')),
    h('p', { class: 'lib-note' }, 'cada mundo tem o seu caminho: comece por onde quiser. as fases mostram o símbolo na pauta; você responde pelo nome ou pela imagem. cada fase vale até 3 estrelas (60% = 1, 80% = 2, 100% = 3).'));
}

/* ---------- Mundo da Bateria: escolher o modo ---------- */
function levelScreen(host) {
  const me = P.active(); if (!me) { location.hash = BASE; return () => {}; }
  const p = V.getP(me.id);
  const r = robo({ mood: 'happy', size: 90, say: 'escolhe o seu modo! todos têm 12 fases e pacotinhos de figurinhas.' });
  const info = { drumF: ['🟢', 'fácil', 'peças e combinações, só com semínimas e colcheias. sem acento, nota fantasma, chimbal aberto nem semicolcheia.'], drumI: ['🟡', 'intermediário', 'todos os símbolos, só com colcheias. tem tempo e fases “sem errar”.'], drumD: ['🔴', 'difícil', 'tudo misturado, inclusive semicolcheias.'] };
  const card = (w) => {
    const [dot, nome, txt] = info[w]; const done = S.worldProgress(p, w); const full = S.worldDone(p, w); const t = RW.totalDoModo(w);
    const ico = h('span', { class: 'kx-gi' }); ico.innerHTML = worldIcon(w);
    return h('a', { class: `kx-g${done ? ' on' : ''}`, href: `${BASE}/${w}` }, cardBg(), ico, h('b', { class: 'kx-gt' }, `${dot} ${nome}`),
      h('span', { class: 'kx-bar', 'aria-hidden': 'true' }, h('i', { style: `width:${Math.round((done / 12) * 100)}%` })),
      h('span', { class: 'kx-gm' }, full ? '🏅 concluído · 12 fases' : `${done}/12 fases`), h('span', { class: 'kx-gm pl-lvtxt' }, txt));
  };
  host.append(topBar(BASE), gtitle(worldIcon('drum'), 'Mundo da Bateria', 'ler percussão na pauta'), h('div', { class: 'kx-hello' }, r.el),
    h('h2', { class: 'kx-h' }, 'modos'), h('div', { class: 'kx-cards' }, ...LEVELS.map(([w]) => card(w))),
    h('p', { class: 'lib-note' }, 'você pode jogar o modo que quiser, e os três valem pro título do mundo. figurinhas só com o seu código de acesso.'));
  return () => {};
}

/* ---------- mapa de fases de um mundo (mapa de aventura) ---------- */
function worldScreen(host, w, modeArg) {
  const me = P.active(); if (!me) { location.hash = BASE; return () => {}; }
  const W = WORLDS[w]; const p = V.getP(me.id); const mode = modeArg === 'imagens' || modeArg === 'nomes' ? modeArg : getMode(); setMode(mode);
  if (w === 'duel' && !S.duelUnlocked(p) && !livre()) { location.hash = BASE; return () => {}; }
  let stars = 0; for (let k = 1; k <= W.count; k++) stars += (p.ph[S.phKey(w, k, mode)] || {}).s || 0;
  const holder = h('div', { class: 'pl-mapa' });
  host.append(h('div', { class: 'row kd-modes pl-modes' }, ...MODES.map(([k, t]) => h('a', { class: `kd-chip${mode === k ? ' on' : ''}`, href: `${BASE}/${w}/-/${k}` }, t))), holder);
  const { hud, dispose } = worldMap(holder, { w, p, mode, me, stars });
  host.append(hud, h('p', { class: 'lib-note' }, `${mode === 'nomes' ? 'modo nomes: você escolhe o nome escrito.' : 'modo imagens: você escolhe a figura (sem nomes).'} a última fase de cada mundo é o chefão. a aulinha do Paul abre ao concluir o mundo.`));
  return dispose;
}

/* ---------- resultado ---------- */
async function finishPhase(ctx, res, spec) {
  const { profile, world, n, mode } = ctx; const { bot, stage } = res;
  const before = V.getP(profile.id); const wasOpen = S.duelUnlocked(before);
  const out = S.applyRun(before, { world, n, mode, right: res.right, total: res.total, misses: res.misses, need: spec.need, sudden: spec.sudden });
  const free = livre(); // modo livre (sem código): joga, mas nada é salvo nem vale ponto
  const saved = free ? out.p : await V.commit(profile.id, () => out.p); if (!free) V.publish(profile).catch(() => {});
  // mesmo molde dos outros jogos do Kids: estrelas por fase entram no total do jogador (Paul ganha adesivos) e rendem figurinhas
  const kst = S.starsFor(res.right, res.total);
  const { gain } = free ? { gain: 0 } : await P.record(profile.id, { game: `pl-${world}-${mode}`, level: n, right: res.right, total: res.total, stars: kst, misses: res.misses, mode });
  const won = free ? null : { roletas: await Album.sincronizar(profile.id), jogos: 0 }; // a cada 30 ★ (todos os jogos) libera uma roleta
  // pacotinhos da Bateria (tabela em recompensas.js): só os marcos NOVOS aparecem no aviso; a entrega é idempotente
  let packs = [];
  if (!free && isDrum(world)) { const antes = new Set(RW.merecidos(before, profile.id).map((x) => x.id)); const todos = RW.merecidos(saved, profile.id); await FR.grantPacks(todos.map((x) => x.id)).catch(() => 0); packs = todos.filter((x) => !antes.has(x.id)); }
  const pct = res.total ? Math.round((res.right / res.total) * 100) : 0; const stars = out.stars;
  const gainedTitle = out.gained.filter((t) => t.id !== 'aprendiz' || before.started === 0 ? true : false);
  const worldEv = out.events.find((e) => e.type === 'world'); const duelOpen = !wasOpen && S.duelUnlocked(saved);
  const big = !!worldEv || gainedTitle.length;
  bot.set(out.passed ? (big ? 'crown' : stars >= 2 ? 'cheer' : 'happy') : 'oops', out.passed ? (worldEv ? 'mundo concluído! 🎉' : 'fase concluída!') : 'quase lá! olha o que treinar');
  if (big) sfx.fanfare(true); else if (out.passed) sfx.fanfare();
  const next$ = out.passed && n < WORLDS[world].count;
  const pctEl = h('b', { class: 'kx-pct' }, h('span', { class: 'n' }, String(pct)), h('small', {}, '%'));
  const starsEl = h('div', { class: 'kx-stars', 'aria-label': `${stars} de 3 estrelas` }, ...[1, 2, 3].map((k) => h('span', { class: `kx-star${k <= stars ? ' on' : ''}`, style: `--d:${k * 0.25}s` }, '★')));
  const missList = [...new Set(res.misses)].slice(0, 4);
  const hintText = { clave: 'prestar atenção na clave (sol ou fá)', oitava: 'a oitava (o número depois da nota)', sequencia: 'ler várias notas em sequência' };
  const tagText = (t) => { const [a, b] = String(t).split(/:(.+)/); return hintText[t] || (a === 'peca' || a === 'combo' ? `treinar: ${b.split('+').map((x) => ({ bd: 'bumbo', sn: 'caixa', hh: 'chimbal', ho: 'chimbal aberto', hf: 'chimbal com o pé', rd: 'prato de condução', cr: 'prato de ataque', tt: 'tom 1', mt: 'tom 2', ft: 'surdo', sg: 'caixa fantasma', sa: 'caixa com acento', sr: 'aro' }[x] || x)).join(' + ')}` : a === 'fig' ? `contar as figuras: ${b}` : a === 'nota' ? `treinar a nota ${b}` : a === 'art' ? 'as técnicas da caixa e do chimbal' : String(t)); };
  stage.replaceChildren(h('div', { class: 'kx-result pl-result' },
    h('h2', {}, out.passed ? (worldEv ? 'Mundo concluído!' : 'Fase concluída!') : 'Quase lá!'), pctEl,
    h('p', { class: 'muted' }, `${res.right} de ${res.total} certas${res.restarts ? ` · recomeçou ${res.restarts}×` : ''}${res.best >= 3 && spec.streak ? ` · melhor sequência: ${res.best} 🔥` : ''}`), free ? null : starsEl,
    free ? h('p', { class: 'pl-livre', role: 'status' }, '🔓 modo livre: valeu treinar! pontos, estrelas e figurinhas só contam com o seu código de acesso.') : null,
    !out.passed ? h('p', { class: 'pl-need' }, spec.sudden ? 'nessa fase precisa acertar todas.' : `precisa de ${Math.round(spec.need * 100)}% pra passar.`) : null,
    free ? null : out.ptsGain > 0 ? h('p', { class: 'pl-pts' }, `+${out.ptsGain} pontos · total ${out.pts}`) : h('p', { class: 'muted' }, 'sem pontos novos: pontos valem uma vez por melhor desempenho.'),
    Album.rewardEl(won),
    packs.length ? h('div', { class: 'kx-reward pl-packs' }, h('p', { class: 'kx-reward-t' }, `🎁 ${packs.length === 1 ? 'pacotinho novo' : `${packs.length} pacotinhos novos`}: ${packs.map((x) => `${x.n} carta${x.n > 1 ? 's' : ''}`).join(' + ')}${packs.some((x) => x.bea >= 10) ? ' (pode vir Beaterista!)' : ''}`), h('a', { class: 'kd-btn', href: Album.albumHref('Pacotes') }, 'abrir agora')) : null,
    ...(free ? [] : gainedTitle).map((t) => h('div', { class: 'pl-newtitle' }, h('small', {}, 'novo título!'), h('b', {}, t.name), h('span', {}, `${profile.name} · ${t.name}`))),
    worldEv && !free ? h('div', { class: 'pl-unlock' }, `🏅 ${WORLDS[world].name} concluído! +${world === 'duel' ? 200 : 100} pontos`, h('br'), h('a', { href: `${BASE}/aula/${world}` }, '📖 abrir a aulinha do Paul')) : null,
    duelOpen && !free ? h('div', { class: 'pl-unlock' }, '⚔️ o Duelo das Claves foi liberado!') : null,
    missList.length ? h('div', { class: 'kx-miss' }, h('b', {}, 'pra treinar mais:'), h('ul', {}, ...missList.map((t) => h('li', {}, tagText(t)))), h('a', { class: 'kd-chip', href: `${BASE}/reforco/${mode}` }, '🎯 revisão do Paul')) : null,
    h('div', { class: 'row kx-act' },
      next$ ? h('button', { class: 'kd-btn', type: 'button', onclick: () => ctx.go(n + 1) }, `fase ${n + 1} →`) : null,
      h('button', { class: next$ ? 'kd-chip' : 'kd-btn', type: 'button', onclick: () => ctx.go(n) }, 'jogar de novo'),
      h('button', { class: 'kd-chip', type: 'button', onclick: () => ctx.back() }, 'mapa de fases'))));
  const pe = stage.querySelector('.kx-pct'); countUp(pe, pct);
  if (out.passed && !free) setTimeout(() => { if (starsEl.isConnected) sparkle(starsEl); }, 400);
  if (big && !free) confetti(stage);
}
const countUp = (el, to) => { const nEl = el.querySelector('.n'); if (matchMedia('(prefers-reduced-motion: reduce)').matches || !to) { nEl.textContent = String(to); return; } const t0 = performance.now(); const step = (t) => { if (!nEl.isConnected) return; const k = Math.min(1, (t - t0) / 700); nEl.textContent = String(Math.round(to * (1 - (1 - k) ** 3))); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); };
function confetti(host) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer = h('div', { class: 'pl-confetti', 'aria-hidden': 'true' }, ...Array.from({ length: 26 }, (_, i) => h('i', { style: `--x:${(i * 37) % 100}%;--d:${(i % 7) * 0.12}s;--c:${['#a31d30', '#14284b', '#e3a82f', '#1f5d63'][i % 4]}` })));
  host.append(layer); setTimeout(() => layer.remove(), 2600);
}

/* ---------- fase ---------- */
function phaseScreen(host, w, n, modeArg) {
  const me = P.active(); if (!me) { location.hash = BASE; return () => {}; }
  const mode = modeArg === 'imagens' ? 'imagens' : 'nomes'; const sp = phaseSpec(w, n); const p = V.getP(me.id);
  if (!sp || !(livre() || S.unlocked(p, w, n))) { location.hash = `${BASE}/${w}`; return () => {}; }
  if (!livre()) V.commit(me.id, (c) => S.start(c)).catch(() => {});
  const ctx = { profile: me, world: w, n, mode, back: () => { location.hash = `${BASE}/${w}/-/${mode}`; }, go: (k) => { location.hash = `${BASE}/${w}/${k}/${mode}`; if (k === n) rerenderHook(); } };
  const rerenderHook = () => { off(); host.replaceChildren(); off = phaseScreen(host, w, n, mode) || (() => {}); };
  const intro = h('div', { class: 'pl-introbox' }, teachCards(w, n) ? h('p', { class: 'pl-new' }, '🆕 o Paul vai te apresentar:') : null, teachCards(w, n),
    isDrum(w) && /colcheia|figura|Técnica|Tudo|Misto|Mestre|semicolcheia/i.test(sp.title) ? h('p', { class: 'muted' }, 'lembrete: X = prato/chimbal · bolinha = tambor · parênteses = fantasma · > = acento.') : null);
  const hist = [];
  let off = runSession({
    host, profile: me, mode, world: w, title: isDrum(w) ? `fase ${n}` : `${WORLDS[w].short} · fase ${n}`, sub: sp.title, spec: sp, say: sp.title, intro,
    make: (i) => { const q = makeQuestion(w, n, mode, Math.random, i, hist.slice(-2)); hist.push(q.sig || q.key); return q; }, onBack: ctx.back,
    onFinish: (res) => finishPhase(ctx, res, sp),
  });
  return () => off();
}

/* ---------- revisão (reforço do Paul): 10 perguntas só com o que foi ruim; 10 estrelas e, acertando tudo, 3 figurinhas (1× por dia) ---------- */
const hoje = () => { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`; };
function reinforceScreen(host, modeArg) {
  const me = P.active(); if (!me) { location.hash = BASE; return () => {}; }
  const mode = modeArg === 'imagens' ? 'imagens' : 'nomes'; const p = V.getP(me.id); const d = S.difficulties(p);
  const tags = d.all.map((x) => x.tag).filter((t) => reinforceQuestion(t, mode, () => 0.3));
  const r = robo({ mood: tags.length ? 'idea' : 'happy', size: 90, say: tags.length ? 'montei 10 perguntas só com o que você errou! acerte tudo e ganhe 3 figurinhas.' : 'nenhuma dificuldade registrada ainda. joga umas fases e eu volto com um treino!' });
  if (!tags.length) { host.append(topBar(BASE), pageH1('Revisão do Paul'), h('div', { class: 'kx-hello' }, r.el), h('a', { class: 'kd-btn kx-go', href: BASE }, 'voltar')); return () => {}; }
  const order = RW.ordemRevisao(tags, 10); const hist = []; const seen = []; let off = null;
  const done = async (res) => {
    const free = livre(); if (!free) await V.commit(me.id, (c) => S.relief(c, seen));
    const all = res.right === res.total; let ganhou = 0;
    if (!free) { await P.record(me.id, { game: 'pl-revisao', level: 1, right: res.right, total: res.total, stars: S.starsFor(res.right, res.total), misses: [], mode }); await Album.sincronizar(me.id); if (all) ganhou = await FR.grantPacks([RW.revisaoId(me.id, hoje())]).catch(() => 0); }
    const { bot, stage } = res; sfx.fanfare(); bot.set(all ? 'crown' : 'cheer', all ? 'gabaritou!' : 'treino feito!');
    stage.replaceChildren(h('div', { class: 'kx-result' }, h('h2', {}, all ? 'Revisão perfeita!' : 'Revisão feita!'),
      h('div', { class: 'pl-rev-stars', 'aria-label': `${res.right} de 10 estrelas` }, ...Array.from({ length: 10 }, (_, k) => h('span', { class: `kx-star${k < res.right ? ' on' : ''}`, style: `--d:${k * 0.12}s` }, '★'))),
      h('p', { class: 'muted' }, `${res.right} de ${res.total} certas · cada acerto vale 1 ★ e alivia uma dificuldade da sua lista.`),
      free ? h('p', { class: 'pl-livre', role: 'status' }, '🔓 modo livre: as figurinhas só contam com o seu código de acesso.') : null,
      !free && all ? (ganhou ? h('div', { class: 'kx-reward pl-packs' }, h('p', { class: 'kx-reward-t' }, '🎁 3 figurinhas pra você!'), h('a', { class: 'kd-btn', href: Album.albumHref('Pacotes') }, 'abrir agora')) : h('p', { class: 'muted' }, 'as 3 figurinhas da revisão já foram entregues hoje. volta amanhã!')) : !free ? h('p', { class: 'muted' }, 'acerte as 10 pra ganhar 3 figurinhas (1 prêmio por dia).') : null,
      h('div', { class: 'row kx-act' }, h('button', { class: 'kd-btn', type: 'button', onclick: () => { location.hash = `${BASE}/perfil`; } }, 'ver meu perfil'), h('button', { class: 'kd-chip', type: 'button', onclick: () => { off(); host.replaceChildren(); off = reinforceScreen(host, mode); } }, 'outra revisão'))));
  };
  off = runSession({ host, profile: me, mode, world: 'reforco', title: 'Revisão do Paul', sub: 'Revisão do Paul · 10 estrelas', spec: { rounds: 10, secs: null, sudden: false, need: 0 }, say: 'o que você mais erra, em um treino só', noScore: true,
    make: (i) => { let q = null; for (let t = 0; t < 20; t++) { q = reinforceQuestion(order[i], mode, Math.random); if (!q || !hist.slice(-2).includes(q.sig || `${q.key}:${q.ans}`)) break; } if (q) hist.push(q.sig || `${q.key}:${q.ans}`); return q; }, relief: (q, ok) => { if (ok && q.tag && !seen.includes(q.tag)) seen.push(q.tag); },
    onBack: () => { location.hash = BASE; }, onFinish: done });
  return () => off && off();
}

/* ---------- aulinha ---------- */
function lessonScreen(host, w0) {
  const w = isDrum(w0) ? 'drum' : w0;
  const me = P.active(); if (!me || !LESSONS[w]) { location.hash = BASE; return () => {}; }
  const p = V.getP(me.id); if (!S.worldDone(p, w)) { toast('a aulinha abre quando você concluir o mundo', { ms: 2600 }); location.hash = `${BASE}/${w0}`; return () => {}; }
  const L = LESSONS[w]; let k = 0; const box = h('div', { class: 'pl-lesson' });
  const r = robo({ mood: 'read', tier: tierOf(P.totalStars(me.id)), size: 90 });
  const draw = () => {
    const s = L.steps[k]; r.set(k === L.steps.length - 1 ? 'cheer' : 'point', s.say);
    box.replaceChildren(h('div', { class: 'kx-dots' }, ...L.steps.map((_, j) => h('i', { class: j < k ? 'done' : j === k ? 'now' : '' }))), h('div', { class: 'pl-figs' }, ...s.draw.map((d) => h('figure', { class: 'pl-fig' }, svgEl(d.svg, 'pl-mini'), h('figcaption', {}, d.cap)))),
      h('div', { class: 'row kx-act' }, k > 0 ? h('button', { class: 'kd-chip', type: 'button', onclick: () => { k--; draw(); } }, '‹ voltar') : null, k < L.steps.length - 1 ? h('button', { class: 'kd-btn', type: 'button', onclick: () => { k++; draw(); } }, 'próximo ›') : h('a', { class: 'kd-btn', href: `${BASE}/${w0}` }, 'terminei!')));
  };
  host.append(topBar(`${BASE}/${w0}`), pageH1(L.title), h('div', { class: 'kx-hello' }, r.el), box); draw();
  return () => {};
}

/* ---------- legenda ---------- */
function legendScreen(host) {
  const r = robo({ mood: 'read', size: 84, say: 'essa é a legenda do jogo: uma convenção só, pra não confundir.' });
  host.append(topBar(BASE), pageH1('Legenda da bateria'), h('div', { class: 'kx-hello' }, r.el),
    h('div', { class: 'pl-legend' }, ...legendHtml().map((x) => h('div', { class: 'pl-card' }, svgEl(x.svg, 'pl-mini'), h('b', {}, x.name), h('small', {}, x.where)))),
    h('p', { class: 'lib-note' }, 'X = pratos e chimbal · bolinha = tambores · parênteses = nota fantasma (bem baixinha) · > = acento (mais forte) · X no lugar da caixa = aro (cross-stick: a baqueta bate no aro). Rimshot é outra técnica: bate na pele e no aro ao mesmo tempo; ela não aparece nos exercícios. Notas alinhadas na vertical = tocadas juntas.'),
    h('h2', { class: 'kx-h' }, 'claves'), h('div', { class: 'pl-legend' },
      h('div', { class: 'pl-card wide' }, svgEl(clefStaff('sol', [28 + 2, 28 + 4]), 'pl-mini'), h('b', {}, 'clave de sol'), h('small', {}, 'linhas: mi, sol, si, ré, fá · espaços: fá, lá, dó, mi')),
      h('div', { class: 'pl-card wide' }, svgEl(clefStaff('fa', [14 + 4, 14 + 6]), 'pl-mini'), h('b', {}, 'clave de fá'), h('small', {}, 'linhas: sol, si, ré, fá, lá · espaços: lá, dó, mi, sol'))));
}

/* ---------- perfil ---------- */
function profileScreen(host, rerender) {
  const me = P.active(); if (!me) { location.hash = BASE; return () => {}; }
  const p = V.getP(me.id); const pts = S.points(p); const d = S.difficulties(p); const earned = S.earnedTitles(p); const cur = S.currentTitle(p);
  const r = robo({ mood: cur ? 'crown' : 'happy', tier: tierOf(P.totalStars(me.id)), size: 90, say: cur ? `${me.name}, você é ${cur.name}!` : 'comece uma fase pra ganhar seu primeiro título!' });
  const dif = (title, rows, fmt) => (rows.length ? h('li', {}, h('b', {}, title), ': ', rows.slice(0, 4).map((x) => `${fmt(x.tag)} (${x.c}×)`).join(', ')) : null);
  const fmt = (t) => String(t).split(/:(.+)/)[1] || t;
  const nick = h('input', { type: 'text', maxlength: 16, placeholder: 'apelido para o ranking', value: p.rank.nick || '', 'aria-label': 'Apelido no ranking' });
  const sw = h('button', { type: 'button', class: 'switch', role: 'switch', 'aria-checked': String(!!p.rank.on), 'aria-label': 'Aparecer no ranking público', onclick: async () => {
    if (livre()) { toast('o ranking do pauLta é só com código de acesso'); return; }
    const n = nick.value.trim().replace(/\s+/g, ' '); const on = !p.rank.on; if (on && !n) { nick.focus(); toast('escolha um apelido primeiro'); return; }
    if (on && !(await confirmSheet('Aparecer no ranking?', `Seu apelido “${n}”, seus pontos e seu título ficam visíveis para todos.`, 'Aparecer'))) return;
    await V.commit(me.id, (c) => ({ ...c, rank: { on, nick: n } })); if (on) V.publish(me); toast(on ? 'você está no ranking ✓' : 'você saiu do ranking'); rerender();
  } });
  host.append(topBar(BASE), pageH1('Perfil'), h('div', { class: 'kx-hello' }, r.el),
    h('div', { class: 'kx-me' }, h('span', { class: 'kx-av', 'aria-hidden': 'true' }, me.name.trim()[0].toUpperCase()), h('span', {}, h('b', {}, me.name), h('br'), titleChip(p) || h('small', {}, 'sem título ainda')), h('span', { class: 'kd-stars' }, `${pts} pts`)),
    h('h2', { class: 'kx-h' }, 'mundos'), h('div', { class: 'pl-prog' }, ...WORLD_IDS.map((w) => h('div', { class: 'pl-prow' }, h('span', {}, WORLDS[w].short), bar((S.worldProgress(p, w) / WORLDS[w].count) * 100), h('small', {}, `${S.worldProgress(p, w)}/${WORLDS[w].count}${S.worldDone(p, w) ? ' 🏅' : ''}`)))),
    h('h2', { class: 'kx-h' }, 'títulos'), h('div', { class: 'pl-titles' }, ...S.TITLES.map((t) => h('div', { class: `pl-tt${earned[t.id] ? ' on' : ''}` }, h('b', {}, earned[t.id] ? `🏅 ${t.name}` : `🔒 ${t.name}`), h('small', {}, t.rule)))),
    h('h2', { class: 'kx-h' }, 'onde estou errando'), d.all.length ? h('ul', { class: 'pl-dif' }, dif('peças', d.pecas, fmt), dif('combinações', d.combos, fmt), dif('notas', d.notas, fmt), dif('clave sol × fá', d.claves, () => 'confusão de clave'), dif('oitavas', d.oitavas, () => 'oitava errada'), dif('figuras', d.figuras, fmt), dif('técnicas', d.articulacoes, fmt)) : h('p', { class: 'muted' }, 'nada por enquanto. o Paul anota aqui o que você errar.'),
    d.all.length ? h('a', { class: 'kd-btn kx-go', href: `${BASE}/reforco/${getMode()}` }, '🎯 treino de reforço') : null,
    h('h2', { class: 'kx-h' }, 'ranking público'), h('p', { class: 'muted' }, 'por padrão você NÃO aparece. se quiser, escolha um apelido (não use o nome completo) e ligue:'), h('div', { class: 'row' }, nick, sw),
    h('p', { class: 'lib-note' }, 'pontos: 10 por acerto (melhor tentativa), 50 por fase concluída, 30 por rodada perfeita, 100 por mundo e 200 pelo duelo, cada um uma vez só.'));
  return () => {};
}

/* ---------- ranking ---------- */
function rankingScreen(host) {
  const me = P.active(); const local = P.profiles().map((pr) => { const p = V.getP(pr.id); return { pr, p, pts: S.points(p) }; }).filter((x) => x.p.started).sort((a, b) => b.pts - a.pts);
  const loc = h('ol', { class: 'pl-rank' }, ...(local.length ? local.map((x, i) => h('li', { class: me && x.pr.id === me.id ? 'me' : '' }, h('span', { class: 'al-pos' }, `${i + 1}º`), h('b', {}, x.pr.name), h('small', {}, `${S.titleName(x.p) || '—'} · ${S.mainDone(x.p)} mundo${S.mainDone(x.p) === 1 ? '' : 's'}`), h('span', { class: 'pl-pt' }, `${x.pts}`))) : [h('li', { class: 'muted' }, 'ninguém jogou ainda.')]));
  const pub = h('ol', { class: 'pl-rank' }, h('li', { class: 'muted' }, 'carregando…'));
  RK.top(V.BOARD, { fresh: true }).then((rows) => { if (!pub.isConnected) return; pub.replaceChildren(...(rows.length ? rows.map((x, i) => { const g = S.decodeRank(x.grade); return h('li', {}, h('span', { class: 'al-pos' }, `${i + 1}º`), h('b', {}, x.name), h('small', {}, `${g.title || '—'} · ${g.worlds} mundo${g.worlds === 1 ? '' : 's'}`), h('span', { class: 'pl-pt' }, `${x.score}`)); }) : [h('li', { class: 'muted' }, 'ninguém no ranking público ainda (ou sem internet).')])); });
  host.append(topBar(BASE), pageH1('Ranking'), h('h2', { class: 'kx-h' }, 'neste aparelho'), loc, h('h2', { class: 'kx-h' }, 'público'), pub,
    h('p', { class: 'lib-note' }, 'o ranking público só mostra apelidos de quem escolheu aparecer (no perfil). você pode sair quando quiser.'));
  return () => {};
}

/* ---------- entrada ---------- */
export function mount(host, parts = []) {
  host.classList.add('kx-arc', 'pl-root'); document.documentElement.classList.add('kx-on');
  let off = () => {};
  const rerender = () => { off(); off = () => {}; host.replaceChildren(); go(); };
  const go = () => {
    const [a, b, c] = parts; const me = P.active();
    if (me) V.ensure(me.id).catch(() => {});
    if (a === 'legenda') { legendScreen(host); return; }
    if (a === 'ranking') { off = rankingScreen(host) || off; return; }
    if (a === 'perfil') { off = profileScreen(host, rerender) || off; return; }
    if (a === 'reforco') { off = reinforceScreen(host, b) || off; return; }
    if (a === 'aula') { off = lessonScreen(host, b) || off; return; }
    if (a === 'drum') { off = levelScreen(host) || off; return; }
    if (a && WORLDS[a]) {
      const n = Number(b);
      if (b && b !== '-' && Number.isInteger(n) && n >= 1 && n <= WORLDS[a].count) { off = phaseScreen(host, a, n, c) || off; return; }
      off = worldScreen(host, a, c === undefined && b !== '-' ? b : c) || off; return;
    }
    homeScreen(host, rerender);
  };
  go();
  return () => { off(); silence(); host.classList.remove('kx-arc', 'pl-root'); document.documentElement.classList.remove('kx-on'); };
}
