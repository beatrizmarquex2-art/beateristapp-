// Rudimentos: jogo novo da área dos alunos, feito do zero no visual do Toca Aqui (vinho, discos de vinil, desenho da caixa em traço creme).
// O padrão de mãos (D = direita, E = esquerda) aparece escrito e as notas descem em duas colunas (esquerda = E, direita = D).
// 11 fases na ordem da Bea. Figura: colcheia ou semicolcheia. Andamentos 80, 100, 120 e 140. Jogar na tela (E / D) ou com o microfone (só confere o tempo).
// 80% de acerto passa; estrelas em rudimentos-logic.js (1 colcheia, 2 semicolcheia, 3 semicolcheia a 120 ou mais).
// Sem emojis: só letras, números, estrelas ★ e os desenhos do app.
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { audio, click, tom, perfToCtx } from '../audio.js';
import { drumSvg, vinil } from '../kids/drum-art.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { capture } from '../kids/capture.js';
import { toast } from '../ui.js';
import { micToast } from '../mic-access.js';
import { FASES, FASE_BY, BLOCOS, TEMPOS, FIGURAS, MIN_ACERTO, LADO_E, LADO_D, buildChart, passo, janela, judgeTap, judgeOnsets, sweep, summary, guardar, melhoresDe, estrelas, liberada, totalEstrelas } from './rudimentos-logic.js';

const LOOK = 1.15; // s que a nota leva pra descer
const COR = { E: '#1f6f78', D: '#8a1a30' }; // petróleo (esquerda) e vinho (direita)
const soa = (lado, t, v = 0.95) => (lado === LADO_D ? tom(t, 230, v * 0.9) : tom(t, 330, v * 0.9));
const grupos = (sq) => { const out = []; for (let i = 0; i < sq.length; i += 4) out.push(sq.slice(i, i + 4)); return out; };
const estrelasTxt = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
const cadeado = () => { const s = document.createElement('span'); s.className = 'rd-cad'; s.setAttribute('aria-hidden', 'true'); s.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" focusable="false"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>'; return s; };

export function mount(host) {
  const root = h('div', { class: 'jg jg-toca jg-rud' }); host.replaceChildren(root);
  let off = null; let gone = false; let jogando = false; const stateRef = { get: () => 'idle', stop: () => {} };
  const est = () => getGame('rudimentos').est || {};
  const limpa = () => { if (off) { try { off(); } catch { /* ok */ } off = null; } jogando = false; stateRef.get = () => 'idle'; stateRef.stop = () => {}; };

  /* ---------- lista de fases ---------- */
  const lista = () => {
    limpa(); musicaVolta(); const e = est();
    const card = (f) => {
      const lock = !liberada(e, f.n); const n = estrelas(e, f.n);
      return h('button', { type: 'button', class: `rd-fase${lock ? ' lock' : ''}${n ? ' feita' : ''}`, disabled: lock, 'data-fase': String(f.n), 'aria-label': `fase ${f.n}, ${f.nome}${lock ? ', trancada: ganhe uma estrela na fase anterior' : `, ${n} de 3 estrelas`}`, onclick: () => jogo(f) },
        lock ? cadeado() : h('i', { class: 'rd-num' }, String(f.n)), h('span', { class: 'rd-nome' }, f.nome),
        h('span', { class: 'rd-prev', 'aria-hidden': 'true' }, [...(f.seq.length > 16 ? f.seq.slice(0, 16) + ' …' : f.seq)].reduce((t, c, i) => t + (i && i % 4 === 0 ? ' ' : '') + c, '')),
        h('span', { class: 'rd-est' }, estrelasTxt(n)));
    };
    root.replaceChildren(
      h('p', { class: 'rd-intro' }, 'toque o padrão das mãos: ', h('b', {}, 'E'), ' = mão esquerda, ', h('b', {}, 'D'), ' = mão direita. toque na tela ou com o microfone, em colcheias ou semicolcheias. ', `${MIN_ACERTO}% de acerto passa.`),
      h('p', { class: 'rd-total' }, `★ ${totalEstrelas(e)}/${FASES.length * 3}`),
      ...BLOCOS.map((b) => h('section', { class: 'rd-bloco' }, h('h3', { class: 'rd-bloco-h' }, `${b.n}. ${b.nome}`), h('div', { class: 'rd-fases' }, ...FASES.filter((f) => f.bloco === b.n).map(card)))));
  };

  /* ---------- a fase ---------- */
  const jogo = (f, o = {}) => {
    limpa(); musicaPausa(); jogando = true; const sv = getGame('rudimentos'); const clamp = (v, n) => Math.max(0, Math.min(n - 1, v | 0));
    const tempoIdx = clamp(o.tempo ?? sv.tempo ?? 0, TEMPOS.length); const figIdx = clamp(o.fig ?? sv.fig ?? 0, FIGURAS.length); let modo = (o.modo ?? sv.modo) === 'mic' ? 'mic' : 'tela';
    setGame('rudimentos', { tempo: tempoIdx, fig: figIdx, modo });
    const bpm = TEMPOS[tempoIdx][1]; const por = FIGURAS[figIdx][1]; const sq = f.seq; const p = passo(bpm, por); const win = janela(bpm, por);
    let chart = []; let raf = 0; let t0 = 0; let state = 'idle'; let pop = null; let ultimo = -1; let cap = null;
    const melhores = melhoresDe(est(), f.n)[figIdx ? 's' : 'c']; const mic = modo === 'mic';
    const topo = h('div', { class: 'rd-topo' }, h('button', { type: 'button', class: 'btn small ghost rd-volta', onclick: () => { state = 'idle'; lista(); } }, '‹ fases'), h('b', { class: 'rd-titulo' }, `${f.n} · ${f.nome}`), h('span', { class: 'rd-est' }, estrelasTxt(estrelas(est(), f.n))));
    const spans = [...sq].map((c) => h('i', { class: `rd-l ${c}` }, c));
    const seqEl = h('p', { class: 'rd-seq', 'aria-label': `padrão: ${[...sq].join(' ')}` }, ...grupos(spans).map((g) => h('span', { class: 'rd-g' }, ...g)));
    const chip = (txt, on, fn, extra = '') => h('button', { type: 'button', role: 'radio', 'aria-checked': String(on), class: `rd-chip${on ? ' on' : ''}${extra}`, onclick: fn }, txt);
    const figuras = h('div', { class: 'rd-linha', role: 'radiogroup', 'aria-label': 'figura' }, h('span', { class: 'rd-lab' }, 'figura'), ...FIGURAS.map(([nome], i) => chip(nome, i === figIdx, () => { if (i !== figIdx) jogo(f, { fig: i }); })));
    const chips = h('div', { class: 'rd-andamento', role: 'radiogroup', 'aria-label': 'andamento' }, h('span', { class: 'rd-lab' }, 'andamento'),
      ...TEMPOS.map(([nome, b], i) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(i === tempoIdx), class: `rd-vin${i === tempoIdx ? ' on' : ''}`, title: `${nome}, ${b} BPM`, 'aria-label': `${nome}, ${b} BPM${melhores[i] >= MIN_ACERTO ? ', já passou' : ''}`, onclick: () => { if (i !== tempoIdx) jogo(f, { tempo: i }); } }, vinil(nome, 'vinil sm'), h('small', {}, `${b}${melhores[i] >= MIN_ACERTO ? ' ✓' : ''}`))));
    const modos = h('div', { class: 'rd-linha', role: 'radiogroup', 'aria-label': 'como jogar' }, h('span', { class: 'rd-lab' }, 'como jogar'), chip('jogar na tela', !mic, () => { if (mic) jogo(f, { modo: 'tela' }); }), chip('microfone', mic, () => { if (!mic) jogo(f, { modo: 'mic' }); }));
    const cv = h('canvas', { class: 'rd-cv', 'aria-label': 'Notas descendo: esquerda é a mão esquerda (E), direita é a mão direita (D)' });
    const micAviso = h('div', { class: 'rd-micaviso' }, h('b', {}, 'microfone ligado'), h('small', {}, 'toque o padrão no seu pad ou na sua bateria (ou bata palma). o app escuta depois da contagem e confere o tempo; ele não separa mão esquerda de direita.'));
    const pads = [LADO_E, LADO_D].map((s) => h('button', { type: 'button', class: `rd-pad ${s}`, 'data-side': s, 'aria-label': `mão ${s === LADO_E ? 'esquerda' : 'direita'} (${s})` }, drumSvg('caixa', 'rd-drum'), h('b', { class: 'rd-letra' }, s), h('small', {}, s === LADO_E ? '◀ esquerda' : 'direita ▶')));
    const info = h('p', { class: 'rd-info', 'aria-live': 'polite' }, 'esquerda = E · direita = D');
    const go = h('button', { class: 'rd-go', type: 'button' }, '▶ jogar'); const res = h('div', { class: 'rd-res', hidden: true }); const extra = h('div', { class: 'rd-extra' });
    const el = h('div', { class: 'rd' }, topo, h('div', { class: 'rd-ctrl' }, seqEl, figuras, chips, modos), info, h('div', { class: 'rd-wrap' }, cv), mic ? micAviso : h('div', { class: 'rd-pads' }, ...pads), go, res, extra); root.replaceChildren(el);

    const size = () => { const r = cv.getBoundingClientRect(); const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); };
    const draw = () => {
      raf = requestAnimationFrame(draw); const g = cv.getContext('2d'); if (!g) return;
      { const r = cv.getBoundingClientRect(); const d = Math.min(2, window.devicePixelRatio || 1); if (r.width && (cv.width !== Math.round(r.width * d) || cv.height !== Math.round(r.height * d))) size(); }
      const W = cv.width; const H = cv.height; const now = audio(false).currentTime; const hitY = H * 0.84; const rad = W * 0.045;
      g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, 0, W / 2, H); g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(W / 2, 0, W / 2, H);
      g.strokeStyle = '#fbf7ee'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, hitY); g.lineTo(W, hitY); g.stroke();
      for (const [i, s] of [LADO_E, LADO_D].entries()) { g.strokeStyle = COR[s]; g.lineWidth = 4; g.beginPath(); g.arc(W * (i ? 0.75 : 0.25), hitY, rad * 1.45, 0, 7); g.stroke(); }
      if (state === 'play') {
        if (!mic) sweep(chart, now - t0, win);
        for (const n of chart) {
          if (n.res && n.res !== 'faltou' && n.res !== 'lado') continue; const dt = n.t + t0 - now; if (dt > LOOK || dt < -0.4) continue;
          const y = hitY - (dt / LOOK) * hitY; const x = W * (n.side === LADO_E ? 0.25 : 0.75);
          g.globalAlpha = n.res ? 0.35 : 1; g.fillStyle = COR[n.side]; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); g.lineWidth = 4; g.strokeStyle = '#fbf7ee'; g.stroke();
          g.fillStyle = '#fbf7ee'; g.font = `800 ${rad * 1.1}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n.side, x, y + 1); g.globalAlpha = 1;
        }
        if (pop && now - pop.at < 0.6) { g.fillStyle = '#fbf7ee'; g.font = `800 ${W * 0.06}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(pop.txt, W / 2, hitY - W * 0.14 - (now - pop.at) * 40); }
        const k = Math.floor((now - t0 + 0.0001) / p); const pos = k >= 0 ? k % sq.length : -1;
        if (pos !== ultimo) { ultimo = pos; spans.forEach((s, i) => s.classList.toggle('now', i === pos)); }
        if (!mic && now - t0 > (chart.length ? chart[chart.length - 1].t : 0) + 0.7) finish();
      }
    };
    const finish = () => {
      state = 'idle'; spans.forEach((s) => s.classList.remove('now')); const s = summary(chart); const antes = estrelas(est(), f.n);
      const novo = guardar(est(), f.n, figIdx, tempoIdx, s.acc); setGame('rudimentos', { est: novo }); const depois = estrelas(novo, f.n); const passou = s.acc >= MIN_ACERTO;
      if (depois > antes) import('../figurinhas/mesa.js').then((M) => M.vitoria('rudimentos', depois - antes, `rud:${f.n}`)).catch(() => { /* sem estrelas da mesa */ });
      res.hidden = false; try { res.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch { /* sem rolagem */ }
      res.replaceChildren(h('b', {}, `${s.acc}%`), h('p', {}, `${s.hits} de ${s.total} toques certos`), h('small', {}, `perfeito ${s.perfeito} · bom ${s.bom} · mão trocada ${s.lado} · faltou ${s.faltou}`),
        h('p', { class: 'rd-ok' }, passou ? (depois > antes ? 'ganhou uma estrela!' : 'passou!') : `precisa de ${MIN_ACERTO}% pra passar`));
      info.textContent = passou ? 'muito bom!' : s.acc >= 50 ? 'quase lá! tenta de novo, devagar também vale' : 'bora de novo: olha o padrão escrito e vai no seu tempo';
      go.textContent = '↻ jogar de novo'; go.disabled = false; topo.querySelector('.rd-est').textContent = estrelasTxt(depois);
      extra.replaceChildren();
      if (passou && tempoIdx < TEMPOS.length - 1) extra.append(h('button', { type: 'button', class: 'btn small', onclick: () => jogo(f, { tempo: tempoIdx + 1 }) }, `${TEMPOS[tempoIdx + 1][1]} BPM ▶`));
      else if (passou && figIdx === 0) extra.append(h('button', { type: 'button', class: 'btn small', onclick: () => jogo(f, { fig: 1, tempo: 0 }) }, 'semicolcheias ▶'));
      const prox = FASE_BY[f.n + 1]; if (passou && prox && liberada(est(), prox.n)) extra.append(h('button', { type: 'button', class: 'btn small', onclick: () => jogo(prox, { tempo: 0, fig: 0 }) }, 'próxima fase ▶'));
    };
    const start = () => {
      const c = audio(); chart = buildChart(sq, bpm, por); res.hidden = true; extra.replaceChildren(); pop = null; ultimo = -1; const q = 60 / bpm; const total = chart[chart.length - 1].t + p;
      if (mic) {
        state = 'play'; go.disabled = true; info.textContent = 'abrindo o microfone…';
        cap = capture({ mode: 'mic', pad: null, bpm, beats: Math.ceil(total / q) + 1, clickBeats: false, onCount: (n) => { info.textContent = n < 4 ? `conta: ${n + 1}…` : 'agora!'; } }); t0 = cap.t0;
        const mine = cap; cap.done.then((r) => { if (mine !== cap || state !== 'play') return; judgeOnsets(chart, r.onsets, win); finish(); }, (e) => { if (mine !== cap) return; state = 'idle'; go.disabled = false; toast(`${micToast(e)} vou usar a tela`); jogo(f, { modo: 'tela' }); });
        return;
      }
      state = 'play'; t0 = c.currentTime + 0.2 + 4 * q; for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5);
      for (let b = 0; b * q < total; b++) click(t0 + b * q, b % 4 === 0 ? 2 : 1, 0.22);
      info.textContent = 'contando… esquerda E, direita D'; go.disabled = true;
    };
    const tap = (side, ts) => {
      const c = audio();
      if (state !== 'play') { soa(side, c.currentTime + 0.01); return; }
      soa(side, c.currentTime + 0.005); const now = c.currentTime; const t = (ts ? perfToCtx(ts) : now) - t0;
      const r = judgeTap(chart, Math.abs(t - (now - t0)) > 0.25 ? now - t0 : t, side, win);
      pop = { at: now, txt: r.kind === 'perfeito' ? 'perfeito!' : r.kind === 'bom' ? 'bom' : r.kind === 'lado' ? 'outra mão!' : '' };
    };
    for (const pd of pads) pd.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(pd.dataset.side, e.timeStamp); pd.classList.add('hit'); setTimeout(() => pd.classList.remove('hit'), 90); });
    const onKey = (e) => { if (e.repeat || /input|textarea|select/i.test(e.target.tagName)) return; const k = e.key.toLowerCase(); const s = ['arrowleft', 'f', 'a'].includes(k) ? LADO_E : ['arrowright', 'j', 'l'].includes(k) ? LADO_D : null; if (s) { e.preventDefault(); tap(s, e.timeStamp); } };
    document.addEventListener('keydown', onKey); go.addEventListener('click', () => { audio(); start(); });
    window.__rud = { get chart() { return chart; }, tap, get t0() { return t0; }, get state() { return state; }, get fase() { return f.n; }, get bpm() { return bpm; }, get por() { return por; }, get modo() { return modo; } }; // só pra teste
    raf = requestAnimationFrame(draw);
    off = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); if (cap) { try { cap.cancel(); } catch { /* ok */ } cap = null; } state = 'idle'; delete window.__rud; };
    stateRef.get = () => state; stateRef.stop = () => { if (state === 'play') { state = 'idle'; if (cap) { try { cap.cancel(); } catch { /* ok */ } cap = null; } go.disabled = false; go.textContent = '▶ jogar'; info.textContent = 'parou. toque em jogar pra começar de novo'; spans.forEach((s) => s.classList.remove('now')); } };
  };
  lista();
  return {
    inProgress: () => jogando && stateRef.get() === 'play',
    pause: () => stateRef.stop(),
    restart: () => { if (!gone) lista(); },
    destroy() { gone = true; limpa(); musicaVolta(); },
  };
}
