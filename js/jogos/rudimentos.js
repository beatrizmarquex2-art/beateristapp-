// Rudimentos: jogo novo da área dos alunos, feito do zero, num visual "LED premium": fundo escuro, neon e brilho. Esquerda = E = CAIXA (vermelho), direita = D = BUMBO (verde).
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
const COR = { E: '#ff3d57', D: '#27ff8a' }; // LED: vermelho = caixa (esquerda, E), verde = bumbo (direita, D)
const SOMBRA = { E: '#7d0f23', D: '#0a6b3b' }; const RGB = { E: '255,61,87', D: '39,255,138' };
const soa = (lado, t, v = 0.95) => (lado === LADO_D ? tom(t, 230, v * 0.9) : tom(t, 330, v * 0.9));
const grupos = (sq) => { const out = []; for (let i = 0; i < sq.length; i += 4) out.push(sq.slice(i, i + 4)); return out; };
const estrelasTxt = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
const cadeado = () => { const s = document.createElement('span'); s.className = 'rd-cad'; s.setAttribute('aria-hidden', 'true'); s.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" focusable="false"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>'; return s; };

export function mount(host) {
  const root = h('div', { class: 'jg jg-rud' }); host.replaceChildren(root);
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
    const pads = [LADO_E, LADO_D].map((s) => h('button', { type: 'button', class: `rd-pad ${s}`, 'data-side': s, 'data-inst': s === LADO_E ? 'caixa' : 'bumbo', 'aria-label': `mão ${s === LADO_E ? 'esquerda, caixa' : 'direita, bumbo'} (${s})` }, drumSvg(s === LADO_E ? 'caixa' : 'bumbo', 'rd-drum'), h('b', { class: 'rd-letra' }, s), h('small', {}, s === LADO_E ? '◀ caixa' : 'bumbo ▶')));
    const info = h('p', { class: 'rd-info', 'aria-live': 'polite' }, 'esquerda = E (caixa) · direita = D (bumbo)');
    const prog = h('div', { class: 'rd-prog', 'aria-hidden': 'true' }, h('i', {}));
    const go = h('button', { class: 'rd-go', type: 'button' }, '▶ jogar'); const res = h('div', { class: 'rd-res', hidden: true }); const extra = h('div', { class: 'rd-extra' });
    const el = h('div', { class: 'rd' }, topo, h('div', { class: 'rd-ctrl' }, seqEl, figuras, chips, modos), info, prog, h('div', { class: 'rd-wrap' }, cv), mic ? micAviso : h('div', { class: 'rd-pads' }, ...pads), go, res, extra); root.replaceChildren(el);

    const flash = { E: -9, D: -9 }; let fx = []; let dim = { W: 1, H: 1 };
    const size = () => { const r = cv.getBoundingClientRect(); const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); };
    const faisca = (side, now, n = 9) => { flash[side] = now; for (let i = 0; i < n; i++) { const a = -Math.PI * (0.15 + 0.7 * Math.random()); const v = 0.35 + Math.random() * 0.6; fx.push({ side, x: side === LADO_E ? 0.25 : 0.75, y: 0.84, vx: Math.cos(a) * v * 0.5, vy: Math.sin(a) * v, at: now, life: 0.45 + Math.random() * 0.25 }); } };
    const orb = (g, x, y, r, side, alpha, letra) => {
      g.save(); g.globalAlpha = alpha; g.shadowColor = COR[side]; g.shadowBlur = r * 1.1;
      const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.08, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.28, COR[side]); gr.addColorStop(1, SOMBRA[side]);
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.shadowBlur = 0; g.lineWidth = Math.max(2, r * 0.08); g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke();
      g.fillStyle = '#04100a'; g.font = `800 ${r * 1.05}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(letra, x, y + r * 0.04); g.restore();
    };
    const draw = () => {
      raf = requestAnimationFrame(draw); const g = cv.getContext('2d'); if (!g) return;
      { const r = cv.getBoundingClientRect(); const d = Math.min(2, window.devicePixelRatio || 1); if (r.width && (cv.width !== Math.round(r.width * d) || cv.height !== Math.round(r.height * d))) size(); }
      const W = cv.width; const H = cv.height; dim = { W, H }; const now = audio(false).currentTime; const hitY = H * 0.84; const rad = W * 0.05; const cx = { E: W * 0.25, D: W * 0.75 };
      const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#04060c'); bg.addColorStop(1, '#0b1322'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
      for (const s of [LADO_E, LADO_D]) { // faixas com brilho e fio de LED no meio
        const x0 = s === LADO_E ? 0 : W / 2; const lg = g.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, `rgba(${RGB[s]},0)`); lg.addColorStop(1, `rgba(${RGB[s]},${0.1 + Math.max(0, 1 - (now - flash[s]) / 0.3) * 0.2})`); g.fillStyle = lg; g.fillRect(x0, 0, W / 2, H);
        g.save(); g.shadowColor = COR[s]; g.shadowBlur = 8; g.strokeStyle = `rgba(${RGB[s]},.35)`; g.lineWidth = 2; g.beginPath(); g.moveTo(cx[s], 0); g.lineTo(cx[s], hitY); g.stroke(); g.restore();
      }
      const gap = H / 7; const off = state === 'play' ? ((now - t0) * H * 0.45) % gap : 0; g.strokeStyle = 'rgba(160,190,255,.07)'; g.lineWidth = 1;
      for (let y = off; y < H; y += gap) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.save(); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke(); g.restore();
      g.save(); g.shadowColor = '#bfe3ff'; g.shadowBlur = 14; g.strokeStyle = 'rgba(235,245,255,.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, hitY); g.lineTo(W, hitY); g.stroke(); g.restore();
      for (const s of [LADO_E, LADO_D]) { // alvos
        const f = Math.max(0, 1 - (now - flash[s]) / 0.28); g.save(); g.shadowColor = COR[s]; g.shadowBlur = 14 + 22 * f; g.strokeStyle = COR[s]; g.lineWidth = 4 + 3 * f; g.fillStyle = `rgba(${RGB[s]},${0.1 + 0.35 * f})`;
        g.beginPath(); g.arc(cx[s], hitY, rad * (1.5 + 0.12 * f), 0, 7); g.fill(); g.stroke(); g.restore();
      }
      if (state === 'play') {
        if (!mic) sweep(chart, now - t0, win);
        for (const n of chart) {
          if (n.res && n.res !== 'faltou' && n.res !== 'lado') continue; const dt = n.t + t0 - now; if (dt > LOOK || dt < -0.4) continue;
          const y = hitY - (dt / LOOK) * hitY; const x = cx[n.side];
          const tr = g.createLinearGradient(0, y - rad * 3.2, 0, y); tr.addColorStop(0, `rgba(${RGB[n.side]},0)`); tr.addColorStop(1, `rgba(${RGB[n.side]},.28)`); g.fillStyle = tr; g.fillRect(x - rad * 0.4, y - rad * 3.2, rad * 0.8, rad * 3.2);
          orb(g, x, y, rad, n.side, n.res ? 0.3 : 1, n.side);
        }
        if (pop && now - pop.at < 0.6) { g.save(); g.shadowColor = pop.cor || '#fff'; g.shadowBlur = 16; g.fillStyle = '#fff'; g.font = `800 ${W * 0.06}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(pop.txt, W / 2, hitY - W * 0.17 - (now - pop.at) * 40); g.restore(); }
        const k = Math.floor((now - t0 + 0.0001) / p); const pos = k >= 0 ? k % sq.length : -1;
        if (pos !== ultimo) { ultimo = pos; spans.forEach((sp, i) => sp.classList.toggle('now', i === pos)); }
        const total = chart.length ? chart[chart.length - 1].t + p : 1; prog.firstChild.style.width = `${Math.max(0, Math.min(100, ((now - t0) / total) * 100)).toFixed(1)}%`;
        if (!mic && now - t0 > (chart.length ? chart[chart.length - 1].t : 0) + 0.7) finish();
      }
      fx = fx.filter((q) => now - q.at < q.life); g.save(); g.globalCompositeOperation = 'lighter';
      for (const q of fx) { const a = now - q.at; const x = (q.x + q.vx * a * 0.6) * W; const y = (q.y + q.vy * a - 0.4 * a * a * -0.5) * H; g.globalAlpha = Math.max(0, 1 - a / q.life); g.fillStyle = COR[q.side]; g.shadowColor = COR[q.side]; g.shadowBlur = 10; g.beginPath(); g.arc(x, y, W * 0.008, 0, 7); g.fill(); }
      g.restore();
    };
    const finish = () => {
      state = 'idle'; spans.forEach((x) => x.classList.remove('now')); prog.firstChild.style.width = '0%'; const s = summary(chart); const antes = estrelas(est(), f.n);
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
      info.textContent = 'contando… esquerda E (caixa), direita D (bumbo)'; go.disabled = true;
    };
    const tap = (side, ts) => {
      const c = audio();
      if (state !== 'play') { soa(side, c.currentTime + 0.01); return; }
      soa(side, c.currentTime + 0.005); const now = c.currentTime; const t = (ts ? perfToCtx(ts) : now) - t0;
      const r = judgeTap(chart, Math.abs(t - (now - t0)) > 0.25 ? now - t0 : t, side, win);
      pop = { at: now, txt: r.kind === 'perfeito' ? 'perfeito!' : r.kind === 'bom' ? 'bom' : r.kind === 'lado' ? 'outra mão!' : '', cor: r.kind === 'lado' ? '#ff3d57' : COR[side] };
      if (r.kind === 'perfeito' || r.kind === 'bom') faisca(side, now, r.kind === 'perfeito' ? 12 : 6); else if (r.kind === 'lado') flash[side] = now;
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
