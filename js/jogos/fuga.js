// A Fuga do Estúdio: um mapa de mundos (como Figurix e Toca Aqui). Cada fase é uma PORTA trancada com lasers; o aluno abre resolvendo um quiz, uma caça-palavras ou uma cruzadinha.
// 3 mundos (Estúdio dos Lasers · Vulcão · Estação Espacial) × 12 fases × 3 ★ = 36 ★ por mundo. Regras e números em fuga-logic.js. Reaproveita os 3 jogos de palavras (modo "D": sem estrela própria).
import { h } from '../util.js';
import { banner, toast } from '../ui.js';
import * as FB from '../feedback.js';
import { alunoSemCodigo, avisoCodigo } from '../amostra.js';
import { corSrc } from '../paul-cor.js';
import { audio, out } from '../audio.js';
import { getGame, setGame } from './base.js';
import { mountProgressionMap } from '../kids/mapa.js';
import { temaDoMundo } from './mundos-tema.js';
import { MUNDOS, FASES, NOME_TIPO, MIN_QUIZ, faseCfg, tipoDa, estrelasPorta, estOf, estMundo, faseAberta, mundoLiberado, idFase, proximaFase } from './fuga-logic.js';
export { MIN_QUIZ, estrelasPorta };

/** Efeitos sintetizados na hora (sem arquivo): laser, alarme, porta abrindo e fanfarra de vitória. Respeitam o botão de som do app. */
export function sfx(tipo) {
  try {
    const c = audio(); const o = out(); const t = c.currentTime + 0.02;
    const voz = (tp, f0, f1, ini, dur, vol, filtro) => { const x = c.createOscillator(); const g = c.createGain(); x.type = tp; x.frequency.setValueAtTime(f0, t + ini); x.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + ini + dur); g.gain.setValueAtTime(0.0001, t + ini); g.gain.exponentialRampToValueAtTime(vol, t + ini + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + ini + dur); let n = x; if (filtro) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtro; x.connect(f); n = f; } n.connect(g); g.connect(o); x.start(t + ini); x.stop(t + ini + dur + 0.05); };
    if (tipo === 'laser') { voz('sawtooth', 1500, 180, 0, 0.22, 0.12, 4000); voz('square', 3000, 400, 0.02, 0.15, 0.04); }
    else if (tipo === 'alarme') { for (let k = 0; k < 4; k++) voz('square', k % 2 ? 520 : 780, k % 2 ? 500 : 760, k * 0.16, 0.15, 0.1, 2500); }
    else if (tipo === 'porta') { voz('sawtooth', 110, 55, 0, 0.55, 0.16, 500); voz('triangle', 70, 40, 0.05, 0.5, 0.2); [659, 880, 1319].forEach((f, k) => voz('sine', f, f, 0.5 + k * 0.1, 0.35, 0.12)); }
    else if (tipo === 'vitoria') { [523, 659, 784, 1047, 1319].forEach((f, k) => { voz('triangle', f, f, k * 0.11, 0.45, 0.14); voz('sine', f * 2, f * 2, k * 0.11, 0.3, 0.04); }); }
  } catch { /* sem áudio */ }
}

const portaSVG = (aberta, alarme) => {
  const cor = aberta ? '#3cff9a' : '#ff3b5c'; const x = 26;
  const painel = aberta ? `<polygon points="${x + 8},34 ${x + 36},26 ${x + 36},128 ${x + 8},126" fill="#171233" stroke="${cor}" stroke-width="2"/><polygon class="fg-luz" points="${x + 40},30 ${x + 112},4 ${x + 112},150 ${x + 40},124" fill="url(#fgLuz)"/>`
    : `<rect x="${x + 8}" y="30" width="72" height="98" rx="4" fill="#241c4a" stroke="${cor}" stroke-width="2"/><rect x="${x + 16}" y="40" width="56" height="30" rx="3" fill="#150f33" stroke="#5b4fa8"/><rect x="${x + 16}" y="78" width="56" height="42" rx="3" fill="#150f33" stroke="#5b4fa8"/>`;
  const cad = aberta ? '' : `<g class="fg-cad t" transform="translate(${x + 44} 86)"><path d="M-9 -2v-8a9 9 0 0118 0v8" fill="none" stroke="${cor}" stroke-width="3.5" stroke-linecap="round"/><rect x="-13" y="-3" width="26" height="22" rx="4" fill="${cor}"/><circle cx="0" cy="7" r="3" fill="#150f33"/><rect x="-1.4" y="8" width="2.8" height="7" fill="#150f33"/></g>`;
  const lasers = aberta ? '' : [0, 1, 2].map((k) => `<line class="fg-lz l${k}" x1="${x - 4}" x2="${x + 92}" y1="${44 + k * 30}" y2="${44 + k * 30}"/>`).join('');
  const el = h('div', { class: `fg-cena fg-uma${alarme ? ' alarme' : ''}${aberta ? ' livre' : ''}`, role: 'img', 'aria-label': aberta ? 'porta aberta' : 'porta trancada com lasers' });
  el.innerHTML = `<svg viewBox="0 0 140 158" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgLuz" x1="0" x2="1"><stop offset="0" stop-color="#b8ffd8" stop-opacity=".95"/><stop offset="1" stop-color="#3cff9a" stop-opacity="0"/></linearGradient><linearGradient id="fgChao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1450"/><stop offset="1" stop-color="#07041a"/></linearGradient></defs><rect width="140" height="158" fill="url(#fgChao)"/><rect x="${x}" y="22" width="88" height="112" rx="6" fill="#0e0a24" stroke="#4a3d9a" stroke-width="3"/>${painel}${cad}${lasers}${aberta ? '' : '<line class="fg-varre" x1="0" x2="140" y1="0" y2="0"/>'}</svg>`;
  return el;
};
const seg = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const estTxt = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

export function mount(host) {
  let gone = false; let off = null; let mundo = getGame('fuga').mundo || MUNDOS[0].id;
  const wrap = h('div', { class: 'jg jg-wrap dc-wrap escuro fg-wrap' });
  host.append(banner('A Fuga do Estúdio', 'abra as portas, mundo por mundo'), wrap);
  const est = () => getGame('fuga').est || {};
  // regra dos alunos: o próximo mundo só abre com 1 ★ em todas as fases do anterior. No app da Bea fica tudo aberto.
  const REGRA = document.documentElement.classList.contains('aluno-on'); const aberto = (id) => !REGRA || mundoLiberado(est(), id);
  if (!aberto(mundo)) mundo = MUNDOS[0].id;
  const limpa = () => { if (off) { try { off(); } catch { /* ok */ } off = null; } };
  const topo = (extra) => h('div', { class: 'jg-top' }, h('a', { class: 'jg-link', href: '#/jogos' }, '‹ jogos'), extra || null);

  /* ---------- mapa ---------- */
  const mapa = () => {
    limpa(); const M = MUNDOS.find((m) => m.id === mundo) || MUNDOS[0]; const mi = MUNDOS.indexOf(M);
    const box = h('div', { class: 'tm-map' });
    const levels = Array.from({ length: FASES }, (_, i) => ({ id: idFase(M.id, i + 1), index: i + 1, label: String(i + 1), tag: '', boss: i === FASES - 1 }));
    const tabs = h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': 'Mundo' }, ...MUNDOS.map((m, i) => { const ok = aberto(m.id);
      return h('button', { type: 'button', role: 'radio', 'aria-checked': String(m.id === mundo), class: `${m.id === mundo ? 'on' : ''}${ok ? '' : ' lock'}`, 'data-mundo': m.id, onclick: () => { if (!ok) { toast(`mundo trancado: abra todas as portas do mundo anterior (1 ★ em cada)`, { ms: 3400 }); return; } mundo = m.id; setGame('fuga', { mundo }); mapa(); } }, `${ok ? '' : '🔒 '}${i + 1} · ${m.curto}`); }));
    wrap.replaceChildren(topo(), h('p', { class: 'tm-dica' }, `${M.nome} · ${M.sub}. cada disco é uma porta: ache a saída!`), box);
    off = mountProgressionMap(box, { gameId: `fuga-${M.id}`, levels, profileId: 'fuga', unitName: 'Fase', tier: 0, stars: { have: estMundo(est(), M.id), max: FASES * 3 }, theme: temaDoMundo(M.tema, M.nome, [['a', M.regioes[0].name, M.regioes[0].sub], ['b', M.regioes[1].name, M.regioes[1].sub]]),
      starsOf: (id) => estOf(est(), M.id, Number(id.split(':')[1])), unlockedOf: (id) => faseAberta(est(), M.id, Number(id.split(':')[1])), lockedMsg: 'abra a porta anterior primeiro', onOpen: (lv) => joga(M, mi, lv.index) });
    const hd = box.querySelector('.mp-head'); const bar = h('div', { class: 'tm-bar' }, tabs); if (hd) hd.append(bar); else box.prepend(bar);
  };

  /* ---------- uma fase (uma porta) ---------- */
  async function joga(M, mi, n) {
    limpa(); if (gone) return; const cfg = faseCfg(mi, n); const mod = (await import('../views/dicas.js'))._duelo; const T = await import('../tips.js'); if (gone) return;
    const its = mod.items(); const caixa = h('div', { class: 'dc-box' }); let api = null; let feito = false; const t0 = Date.now(); let tentativas = 0;
    const cab = (alarme) => [topo(h('button', { type: 'button', class: 'btn small ghost', onclick: mapa }, '‹ mapa')), portaSVG(false, alarme), h('p', { class: 'tr-count' }, `${M.curto} · porta ${n} de ${FASES} · ${NOME_TIPO[cfg.tipo]}`)];
    const fim = () => setTimeout(() => { if (gone || feito) return; feito = true; resolve(); }, 700);
    const comeca = () => {
      feito = false; api = null; caixa.replaceChildren(); wrap.replaceChildren(...cab(false), caixa); sfx('laser');
      if (cfg.tipo === 'quiz') { const qs = []; const vistos = new Set(); for (let k = 0; k < 80 && qs.length < Math.min(cfg.perguntas, its.length); k++) { const q = T.question(its, ['blank', 'continua'][k % 2]); if (!vistos.has(q.item.n)) { vistos.add(q.item.n); qs.push(q); } } api = mod.quiz(caixa, ['blank', 'continua'], 'fuga', { qs, fim, ajuda: true }); }
      else if (cfg.tipo === 'caca') api = mod.caca(caixa, { pick: T.easyPick(its, cfg.palavras), mk: () => Math.random, fim, dica: true });
      else api = mod.cruzadinha(caixa, { pick: T.easyPick(its, cfg.cruz, { min: 4, max: 8 }), mk: () => Math.random, fim });
    };
    const resolve = () => {
      const s = api && api.stats ? api.stats() : {};
      if (cfg.tipo === 'quiz' && s.found < MIN_QUIZ) { tentativas++; sfx('alarme'); wrap.replaceChildren(topo(h('button', { type: 'button', class: 'btn small ghost', onclick: mapa }, '‹ mapa')), portaSVG(false, true), fala(`só ${s.found} certa${s.found === 1 ? '' : 's'}: a porta precisa de ${MIN_QUIZ}. tenta de novo!`, h('button', { class: 'btn primary wide', type: 'button', onclick: comeca }, 'tentar outra vez'))); return; }
      const ganho = estrelasPorta(cfg.tipo, s); const antes = estOf(est(), M.id, n);
      if (ganho > antes) { setGame('fuga', { est: { ...est(), [idFase(M.id, n)]: ganho }, mundo: M.id }); import('./estrelas-jogo.js').then((E) => E.ganhou('fuga', ganho, `fuga|${M.id}|${n}`)).catch(() => {}); }
      sfx('porta'); const prox = proximaFase(n); const mundoFeito = Array.from({ length: FASES }, (_, k) => estOf(est(), M.id, k + 1)).every((x) => x >= 1);
      const tela = fala(`porta aberta! 🔓 ${estTxt(Math.max(ganho, antes))} · ${seg(Date.now() - t0)}${tentativas ? ` · ${tentativas} tentativa${tentativas === 1 ? '' : 's'}` : ''}${ganho > antes ? ` · +${ganho - antes} ★` : ganho < antes ? ` (seu melhor continua ${antes} ★)` : ''}`,
        prox ? h('button', { class: 'btn primary wide', type: 'button', onclick: () => joga(M, mi, prox) }, `próxima porta ▶ (${prox})`) : h('p', { class: 'muted' }, mundoFeito ? `💥 você libertou o Paul no ${M.nome}! ${mi < MUNDOS.length - 1 ? 'o próximo mundo abriu.' : 'último mundo concluído!'}` : 'faltam portas com 1 ★ neste mundo.'),
        h('button', { class: 'btn ghost wide', type: 'button', onclick: mapa }, '‹ voltar ao mapa'));
      wrap.replaceChildren(topo(), portaSVG(true, false), tela); FB.great(tela); if (ganho === 3) sfx('vitoria');
    };
    comeca();
  }
  const fala = (txt, ...extra) => h('section', { class: 'card pad fg-fala' }, h('img', { src: corSrc('professor'), alt: '', draggable: 'false', width: 84, height: 84 }), h('p', {}, txt), ...extra);

  if (alunoSemCodigo()) wrap.replaceChildren(topo(), avisoCodigo('a Fuga do Estúdio é pra alunos da Beaterista: usa as dicas do método. peça seu código pra professora Bea!'));
  else import('../views/dicas.js').then((m) => { if (gone) return; if (m._duelo.items().length < 6) wrap.replaceChildren(topo(), h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'as dicas ainda não chegaram.'), h('p', { class: 'muted' }, 'abre o app com internet uma vez e volta aqui.'))); else mapa(); });
  return () => { gone = true; limpa(); };
}
