// Juiz de Tempo + Transcritor de Ritmo (fase M2). Espaço BEA pra treinar; no BEATERISTA, "quem tocou" pode ser um aluno.
// O microfone é ouvido amostra por amostra aqui no aparelho (AudioWorklet); só os instantes dos ataques viram dados.
// Nada de áudio é gravado em arquivo nem enviado. O microfone desliga ao sair da tela.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as T from '../timing.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { OnsetCore } from '../onset-core.js';
import { audio, click } from '../audio.js';
import { banner, sheet, toast, stars } from '../ui.js';
import { playBeat, stopBeat } from './beatlab.js';

const SET = 'setting-tempo';
const cfg = () => ({ bpm: 80, sub: 2, bars: 4, fone: false, steps: 8, who: '', lat: {}, ...(store.get(SET) ? store.get(SET).data : {}) });
const save = (p) => store.upsert('setting', SET, p);
const latOf = (c) => c.lat[c.fone ? 'fone' : 'alto'];
const when = (ts) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
const students = () => store.list('student').sort((a, b) => a.data.name.localeCompare(b.data.name));
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
const sign = (ms) => (ms > 0 ? `+${ms}` : String(ms));
const tend = (ms) => (Math.abs(ms) < 4 ? 'no tempo' : ms < 0 ? `adianta ${-ms} ms` : `atrasa ${ms} ms`);

/* ---------- microfone → ataques ---------- */
async function openOnsets(onHit) {
  const ctx = audio();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const src = ctx.createMediaStreamSource(stream);
  let node, mode;
  try {
    if (!ctx.audioWorklet) throw new Error('sem worklet');
    await ctx.audioWorklet.addModule('js/onset-worklet.js');
    node = new AudioWorkletNode(ctx, 'beaterista-onset', { numberOfInputs: 1, numberOfOutputs: 0 });
    node.port.onmessage = (e) => onHit(e.data);
    src.connect(node); mode = 'worklet';
  } catch {
    // plano B (navegador sem AudioWorklet): mesmo detector, blocos de 1024 amostras
    const core = new OnsetCore(ctx.sampleRate);
    node = ctx.createScriptProcessor(1024, 1, 1);
    node.onaudioprocess = (e) => { const t0 = e.playbackTime != null ? e.playbackTime - 1024 / ctx.sampleRate : ctx.currentTime; for (const ev of core.push(e.inputBuffer.getChannelData(0), t0)) onHit(ev); };
    const mute = ctx.createGain(); mute.gain.value = 0; src.connect(node); node.connect(mute).connect(ctx.destination); mode = 'script';
  }
  document.documentElement.dataset.mic = 'on';
  return { ctx, sr: ctx.sampleRate, mode, stop() { try { src.disconnect(); node.disconnect(); } catch { /* já desligado */ } stream.getTracks().forEach((t) => t.stop()); delete document.documentElement.dataset.mic; } };
}

/** Agenda cliques exatos no relógio do áudio (contagem + exercício). Devolve os instantes e como cancelar. */
function clicks(ctx, { bpm, beats, audibleBeats = beats, start = ctx.currentTime + 0.35 }) {
  const beat = 60 / bpm; const oscs = []; const times = [];
  for (let i = 0; i < beats; i++) { const t = start + i * beat; times.push(t); if (i < audibleBeats) oscs.push(click(t, i % 4 === 0 ? 2 : 1, 0.9)); }
  return { start, times, cancel() { oscs.forEach((o) => { try { o.stop(); } catch { /* já tocou */ } }); } };
}

/** Pulso visual que acompanha o relógio do áudio (o tempo continua visível quando o clique some). */
function pulse(ctx, times, el, onEnd, tail = 0.6) {
  let i = 0, raf = 0;
  const loop = () => {
    while (i < times.length && ctx.currentTime >= times[i]) { el.dataset.beat = String((i % 4) + 1); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); i++; }
    if (i >= times.length && ctx.currentTime > times[times.length - 1] + tail) { onEnd && onEnd(); return; }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

function chips(opts, cur, onPick, label) {
  return h('div', { class: 'chips lib-tabs tp-chips', role: 'radiogroup', 'aria-label': label },
    ...opts.map(([v, t, aria]) => h('button', { type: 'button', class: `lib-tab${cur === v ? ' on' : ''}`, role: 'radio', 'aria-checked': String(cur === v), 'aria-label': aria || null, title: aria || null, onclick: () => onPick(v) }, t)));
}
const line = (label, ctrl) => h('div', { class: 'tp-line' }, h('span', { class: 'tp-lab' }, label), ctrl);
function bpmRow(c, onSet) {
  return h('div', { class: 'bl-tempo tp-bpm' },
    h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => onSet(c.bpm - 5) }, '−'),
    h('output', { class: 'bl-bpm' }, `${c.bpm}`),
    h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => onSet(c.bpm + 5) }, '+'),
    h('span', { class: 'tp-unit' }, 'BPM'));
}
const clampBpm = (v) => Math.max(40, Math.min(220, Math.round(v)));

/* ---------- calibração ("calibrar meu iPhone") ---------- */
function calibrate(mic, listen, done) {
  const c = cfg();
  sheet('Calibrar meu iPhone', (close) => {
    const status = h('p', { class: 'tp-cal-status' }, c.fone ? 'põe o fone. vão tocar 10 cliques: bate junto em cada um (na mesa, no pad ou no tambor).' : 'fica em silêncio: vão tocar 10 cliques no alto-falante e o app mede quanto o seu iPhone demora pra ouvir o próprio som.');
    const go = h('button', { class: 'btn primary', type: 'button', onclick: () => {
      go.disabled = true; status.textContent = c.fone ? 'bate junto…' : 'shhh… medindo';
      const got = []; const cl = clicks(mic.ctx, { bpm: 100, beats: 10 });
      listen((ev) => got.push(ev.t));
      setTimeout(async () => {
        listen(null);
        const r = T.calibrate(got, cl.times);
        if (r && r.spreadMs > 40) { status.textContent = c.fone ? 'as batidas ficaram muito espalhadas em relação aos cliques. tenta de novo, bem junto do clique.' : 'ouvi barulho demais junto com os cliques. tenta num lugar mais quieto.'; go.disabled = false; go.textContent = 'tentar de novo'; return; }
        if (!r) { status.textContent = c.fone ? 'não ouvi batidas suficientes. tenta de novo, batendo mais forte.' : 'não consegui ouvir os cliques. aumenta o volume, tira o fone e tenta de novo.'; go.disabled = false; go.textContent = 'tentar de novo'; return; }
        await save({ lat: { ...cfg().lat, [c.fone ? 'fone' : 'alto']: { ms: r.ms, spread: r.spreadMs, at: Date.now() } } });
        status.textContent = `pronto: ${r.ms} ms de atraso ${r.ok ? '✓' : `(variou ${r.spreadMs} ms: dá pra refazer num lugar mais quieto)`}`;
        go.textContent = 'fechar'; go.disabled = false; go.onclick = () => { close(); done && done(); };
      }, (cl.times[9] - mic.ctx.currentTime + 0.7) * 1000);
    } }, 'começar (10 cliques)');
    return h('div', { class: 'sheet-body' }, status, go,
      h('p', { class: 'muted' }, 'a calibração fica guardada (uma pra alto-falante, outra pra fone). fone bluetooth atrasa bem mais que fone com fio: calibra de novo se trocar.'));
  });
}

/* ---------- aba 1: juiz de tempo ---------- */
function judgeTab(mic, listen) {
  const el = h('section', { class: 'tp-pane' });
  let run = null;
  const draw = () => {
    const c = cfg(); const lat = latOf(c);
    const who = h('select', { 'aria-label': 'Quem vai tocar', onchange: (e) => save({ who: e.target.value }) },
      h('option', { value: '' }, 'eu (Bea)'), ...students().map((s) => h('option', { value: s.id, selected: c.who === s.id }, `aluno: ${s.data.name}`)));
    el.replaceChildren(
      h('div', { class: 'card pad tp-setup' },
        bpmRow(c, (v) => save({ bpm: clampBpm(v) }).then(draw)),
        line('notas', chips([[1, 'semín.', 'semínimas'], [2, 'colch.', 'colcheias'], [4, 'semic.', 'semicolcheias'], [3, 'terc.', 'tercinas']], c.sub, (v) => save({ sub: v }).then(draw), 'Subdivisão: semínimas, colcheias, semicolcheias ou tercinas')),
        line('compassos', chips([[2, '2', '2 compassos'], [4, '4', '4 compassos'], [8, '8', '8 compassos']], c.bars, (v) => save({ bars: v }).then(draw), 'Compassos')),
        line('clique', chips([[false, 'alto-falante'], [true, 'fone']], c.fone, (v) => save({ fone: v }).then(draw), 'Como ouvir o clique')),
        line('quem', who),
        h('p', { class: 'tp-hint' }, `${T.SUBS[c.sub]} · ${c.fone ? 'clique o tempo todo no fone' : 'clique só na contagem, depois segura sozinha'}`),
        h('div', { class: 'tp-foot' },
          h('button', { class: 'tp-cal', type: 'button', onclick: () => calibrate(mic, listen, draw) }, icon('mic', 15), lat ? ` calibrado ${lat.ms} ms` : ' calibrar meu iPhone'),
          h('button', { class: 'bl-play tp-go', type: 'button', 'aria-label': 'Começar exercício', onclick: start }, icon('play', 26)))),
      history());
  };
  function start() {
    const c = cfg(); const lat = latOf(c);
    if (!lat) toast('dica: calibra antes pra medir certinho. sem calibrar, o número vem com o atraso do aparelho.', { ms: 3500 });
    const beatsTotal = 4 + c.bars * 4;
    const cl = clicks(mic.ctx, { bpm: c.bpm, beats: beatsTotal, audibleBeats: c.fone ? beatsTotal : 4 });
    const exStart = cl.start + 4 * (60 / c.bpm);
    const slots = T.grid(exStart, c.bpm, c.bars, c.sub);
    const step = 60 / c.bpm / c.sub; const got = [];
    const light = h('div', { class: 'tp-light', 'aria-hidden': 'true' });
    const msg = h('p', { class: 'tp-live' }, 'contagem…'); const count = h('small', { class: 'muted' }, '');
    el.replaceChildren(h('div', { class: 'card pad tp-running' }, light, msg, count,
      h('button', { class: 'btn', type: 'button', onclick: () => { cl.cancel(); stopPulse(); listen(null); draw(); } }, 'parar')));
    listen((ev) => {
      if (ev.t - (lat ? lat.ms / 1000 : 0) < exStart - step * 0.45) return; // batidas da contagem não contam
      got.push(ev.t); count.textContent = `${got.length} batida${got.length > 1 ? 's' : ''} ouvida${got.length > 1 ? 's' : ''}`;
    });
    const stopPulse = pulse(mic.ctx, cl.times, light, finish, 60 / c.bpm + 0.2); // espera a última nota do último tempo
    const flip = setInterval(() => { if (mic.ctx.currentTime >= exStart) { msg.textContent = c.fone ? 'toca junto!' : 'o clique sumiu: segura o tempo!'; clearInterval(flip); } }, 50);
    run = { cancel: () => { clearInterval(flip); cl.cancel(); stopPulse(); } };
    async function finish() {
      clearInterval(flip); listen(null); run = null;
      const r = T.judge(got, slots, { latency: lat ? lat.ms / 1000 : 0, step });
      const prev = store.list('timing').filter((x) => x.data.sub === c.sub && (x.data.who || '') === (c.who || ''));
      const best = prev.reduce((m, x) => Math.max(m, x.data.score), -1);
      const rec = { at: Date.now(), bpm: c.bpm, sub: c.sub, bars: c.bars, fone: c.fone, who: c.who || '', calibrated: !!lat, score: r.score, mean: r.mean, sd: r.sd, absMean: r.absMean, missed: r.missed, total: r.total, perPos: r.perPos, devs: r.hits.map((x) => (x.dev == null ? null : Math.round(x.dev))) };
      await store.upsert('timing', null, rec);
      showResult(rec, r.score > best && prev.length > 0);
    }
  }
  function showResult(d, record) {
    const name = d.who ? (store.get(d.who) ? store.get(d.who).data.name : 'aluno') : 'você';
    const scoreEl = h('strong', { class: 'tp-score' }, String(d.score));
    el.replaceChildren(
      h('div', { class: 'card pad tp-result' },
        h('div', { class: 'tp-head' }, h('div', { class: 'tp-scorebox' }, scoreEl, h('span', { class: 'tp-of' }, '/100')),
          h('div', {}, h('small', { class: 'lib-kicker' }, `${d.bpm} BPM · ${T.SUBS[d.sub]} · ${d.bars} comp.`),
            h('p', { class: 'tp-summary' }, `${name} ${tend(d.mean)} · ±${d.sd} ms${d.missed ? ` · ${d.missed} sem batida` : ''}`),
            record ? h('span', { class: 'tp-record' }, '★ recorde!') : null)),
        timeline(d), posBars(d),
        !d.calibrated ? h('p', { class: 'tp-hint' }, 'sem calibração: o número inclui o atraso do aparelho. calibra pra ficar justo.') : null,
        h('div', { class: 'bl-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: draw }, 'de novo'))),
      history());
    if (record) stars(scoreEl);
  }
  function history() {
    const all = store.list('timing').sort((a, b) => b.data.at - a.data.at);
    if (!all.length) return h('p', { class: 'pad-x lib-note' }, 'o histórico e o recorde aparecem aqui depois do primeiro exercício. funciona melhor em lugar quieto, com batidas curtas (baqueta no pad ou na mesa).');
    const bests = {};
    for (const x of all) { const k = `${x.data.who || ''}|${x.data.sub}`; if (!bests[k] || x.data.score > bests[k].data.score) bests[k] = x; }
    const nm = (id) => (id ? (store.get(id) ? store.get(id).data.name : 'aluno') : 'eu');
    return h('section', { class: 'card pad tp-hist' }, h('h2', { class: 'tag' }, 'histórico'),
      h('div', { class: 'tp-bests' }, ...Object.values(bests).map((x) => h('span', { class: 'tp-best' }, `★ ${x.data.score}`, h('small', {}, `${nm(x.data.who)} · ${T.SUBS[x.data.sub]}`)))),
      ...all.slice(0, 12).map((x) => h('button', { class: 'tp-row', type: 'button', 'aria-label': `Ver sessão de ${when(x.data.at)}: nota ${x.data.score}`, onclick: () => { showResult(x.data, false); scrollTo({ top: 0, behavior: 'smooth' }); } },
        h('strong', {}, String(x.data.score)),
        h('span', {}, `${nm(x.data.who)} · ${x.data.bpm} BPM · ${T.SUBS[x.data.sub]}`, h('small', {}, `${when(x.data.at)} · ${tend(x.data.mean)} · ±${x.data.sd} ms`)))));
  }
  draw();
  el.stop = () => run && run.cancel();
  return el;
}

/** Gráfico das batidas: cada ponto é uma nota (acima = atrasou, abaixo = adiantou). */
function timeline(d) {
  const W = 320, H = 120, mid = H / 2, max = 60; const n = d.devs.length;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'tp-chart', role: 'img', 'aria-label': `Desvio de cada batida: média ${sign(d.mean)} ms` });
  for (const [y, t] of [[mid, '0'], [mid - (30 / max) * (mid - 8), '+30'], [mid + (30 / max) * (mid - 8), '−30']]) {
    svg.append(svgEl('line', { x1: 26, x2: W, y1: y, y2: y, class: y === mid ? 'tp-axis' : 'tp-grid' }));
    const tx = svgEl('text', { x: 0, y: y + 4, class: 'tp-ax' }); tx.textContent = t; svg.append(tx);
  }
  d.devs.forEach((v, i) => {
    const x = 32 + (i + 0.5) * ((W - 36) / n);
    if (v == null) { const tx = svgEl('text', { x: x - 3, y: H - 2, class: 'tp-miss' }); tx.textContent = '×'; svg.append(tx); return; }
    const y = mid - (Math.max(-max, Math.min(max, v)) / max) * (mid - 8); // pra cima = atrasou
    const a = Math.abs(v);
    svg.append(svgEl('circle', { cx: x, cy: y, r: n > 40 ? 2.4 : 3.6, class: a < 10 ? 'tp-ok' : a < 25 ? 'tp-mid' : 'tp-bad' }));
  });
  return h('figure', { class: 'tp-fig' }, svg, h('figcaption', {}, '↑ atrasou · ↓ adiantou · cada ponto é uma nota · × = sem batida'));
}

/** Onde você costuma cair em cada posição do tempo (1, e, &, a). */
function posBars(d) {
  const labels = T.POS_LABELS[d.sub];
  if (labels.length < 2) return null;
  return h('div', { class: 'tp-pos' }, h('small', { class: 'lib-kicker' }, 'onde você cai em cada parte do tempo'),
    ...labels.map((l, p) => {
      const v = d.perPos[p]; const w = v == null ? 0 : Math.min(50, Math.abs(v)) ;
      return h('div', { class: 'tp-pos-row' }, h('b', {}, l),
        h('span', { class: 'tp-pos-track' }, h('i', { class: v < 0 ? 'early' : 'late', style: { width: `${w}%`, [v < 0 ? 'right' : 'left']: '50%' } })),
        h('small', {}, v == null ? '—' : tend(v)));
    }));
}

/* ---------- aba 2: transcritor ---------- */
const PIECE = { hh: 'Chimbal/prato', sn: 'Caixa', bd: 'Bumbo', '?': '?' };
function transcribeTab(mic, listen) {
  const el = h('section', { class: 'tp-pane' });
  let notes = []; let run = null;
  const draw = () => {
    const c = cfg(); const lat = latOf(c);
    el.replaceChildren(h('div', { class: 'card pad tp-setup' },
      bpmRow(c, (v) => save({ bpm: clampBpm(v) }).then(draw)),
      line('grade', chips([[8, 'colch.', 'colcheias'], [12, 'terc.', 'tercinas'], [16, 'semic.', 'semicolcheias']], c.steps, (v) => save({ steps: v }).then(draw), 'Grade: colcheias, tercinas ou semicolcheias')),
      line('clique', chips([[false, 'alto-falante'], [true, 'fone']], c.fone, (v) => save({ fone: v }).then(draw), 'Como ouvir o clique')),
      h('p', { class: 'tp-hint' }, `${B.GRIDS[c.steps].name} · conta 1, grava 1 compasso${lat ? ` · calibrado ${lat.ms} ms` : ''}`),
      h('button', { class: 'btn primary wide', type: 'button', onclick: record }, icon('mic', 18), ' gravar')),
    notes.length ? result() : h('p', { class: 'pad-x lib-note' }, 'bate uma frase na mesa, no pad ou na bateria: o app acha cada golpe, encaixa na grade e tenta adivinhar a peça pelo som (grave = bumbo, médio = caixa, agudo = chimbal/prato). quando não tiver certeza, marca “?” e você decide.'));
  };
  function record() {
    const c = cfg(); const lat = latOf(c);
    const cl = clicks(mic.ctx, { bpm: c.bpm, beats: 8, audibleBeats: c.fone ? 8 : 4 });
    const start = cl.start + 4 * (60 / c.bpm); const got = [];
    const light = h('div', { class: 'tp-light', 'aria-hidden': 'true' }); const msg = h('p', { class: 'tp-live' }, 'contagem…');
    el.replaceChildren(h('div', { class: 'card pad tp-running' }, light, msg, h('button', { class: 'btn', type: 'button', onclick: () => { cl.cancel(); stopPulse(); listen(null); draw(); } }, 'parar')));
    const stepSec = 60 / c.bpm / (c.steps / 4);
    listen((ev) => { if (ev.t - (lat ? lat.ms / 1000 : 0) >= start - stepSec * 0.5) got.push({ t: ev.t, ...T.classify(ev.buf, mic.sr) }); });
    const stopPulse = pulse(mic.ctx, cl.times, light, () => {
      listen(null); run = null;
      notes = T.quantize(got, { start, bpm: c.bpm, steps: c.steps, latency: lat ? lat.ms / 1000 : 0 });
      const seen = new Set(); notes = notes.filter((n) => { const k = `${n.step}|${n.piece}`; if (seen.has(k)) return false; seen.add(k); return true; });
      if (!notes.length) toast('não ouvi nenhuma batida dentro do compasso. bate mais forte ou chega o celular mais perto.');
      draw();
    }, 60 / c.bpm + 0.2);
    const flip = setInterval(() => { if (mic.ctx.currentTime >= start) { msg.textContent = 'grava! toca a frase'; clearInterval(flip); } }, 50);
    run = { cancel: () => { clearInterval(flip); cl.cancel(); stopPulse(); } };
  }
  const beatOf = () => { const c = cfg(); return { id: 'transcrito', name: 'Transcrito', style: '', kind: 'groove', bpm: c.bpm, steps: c.steps, rows: { ...B.clear({ steps: c.steps, rows: {} }).rows, ...T.toRows(notes, c.steps) } }; };
  const pick = (n) => sheet('Que peça é essa?', (close) => h('div', { class: 'sheet-body' },
    h('p', { class: 'muted' }, n.manual ? 'você escolheu essa nota.' : n.piece === '?' ? `não tive certeza (palpite: ${PIECE[n.guess]}, ${n.confidence}% de certeza).` : `pelo som, achei ${PIECE[n.piece]} (${n.confidence}% de certeza).`),
    h('div', { class: 'tp-pick' }, ...['bd', 'sn', 'hh'].map((p) => h('button', { class: `btn${n.piece === p ? ' primary' : ''}`, type: 'button', onclick: () => { n.piece = p; n.manual = true; dedupe(); close(); draw(); } }, PIECE[p]))),
    h('button', { class: 'btn ghost danger', type: 'button', onclick: () => { notes = notes.filter((x) => x !== n); close(); draw(); } }, 'apagar essa nota')));
  const dedupe = () => { const seen = new Set(); notes = notes.filter((n) => { const k = `${n.step}|${n.piece}`; if (seen.has(k)) return false; seen.add(k); return true; }); };
  function result() {
    const c = cfg(); const labels = B.countLabels(c.steps); const per = B.GRIDS[c.steps].perBeat;
    const unk = notes.filter((n) => n.piece === '?').length;
    const perLine = c.steps === 12 ? 6 : 8; const grid = h('div', { class: 'bl-lines' });
    for (let a = 0; a < c.steps; a += perLine) {
      const g = h('div', { class: 'tp-tgrid' }); g.style.setProperty('--steps', perLine); // variável CSS não passa por Object.assign
      for (const p of unk ? ['hh', 'sn', 'bd', '?'] : ['hh', 'sn', 'bd']) { // a linha do “?” só aparece quando tem dúvida
        g.append(h('span', { class: 'bl-row-label', style: p !== '?' ? { color: B.COLORS[p] } : null }, p === 'hh' ? 'Chimbal' : PIECE[p]));
        for (let i = a; i < a + perLine; i++) {
          const n = notes.find((x) => x.step === i && x.piece === p);
          g.append(h('button', { type: 'button', style: n && p !== '?' ? { background: B.COLORS[p], borderColor: B.COLORS[p] } : null, class: `bl-cell${n ? ' on' : ''}${n && n.manual ? ' manual' : ''}${p === '?' ? ' unk' : ''}${i % per === 0 ? ' beat' : ''}`, 'aria-label': `${PIECE[p]}, ${labels[i]} (passo ${i + 1})${n ? ', toque pra mudar' : ''}`,
            onclick: () => { if (n) pick(n); else if (p !== '?') { notes.push({ step: i, piece: p, confidence: 100, guess: p, offMs: 0, manual: true }); draw(); } } }, n && p === '?' ? '?' : ''));
        }
      }
      g.append(h('span'), ...labels.slice(a, a + perLine).map((l, k) => h('span', { class: `bl-count${(a + k) % per === 0 ? ' beat' : ''}` }, l)));
      grid.append(g);
    }
    const score = h('figure', { class: 'bl-score' }); score.innerHTML = N.toSVG(N.layout(beatOf(), { width: 360, full: false, color: true }));
    return h('section', { class: 'card pad tp-out' },
      h('h2', { class: 'tag' }, 'o que eu ouvi'),
      h('p', { class: 'tp-summary' }, `${notes.length} nota${notes.length === 1 ? '' : 's'} (${notes.filter((n) => !n.manual).length} pelo som)${unk ? ` · ${unk} com “?”: toca nelas e escolhe a peça` : ' · toca numa nota pra trocar a peça ou apagar'}`),
      h('div', { class: 'tp-tgrid-wrap' }, grid), score,
      h('div', { class: 'bl-actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => { stopBeat(); playBeat(beatOf()); setTimeout(stopBeat, (60 / c.bpm) * 4 * 2 * 1000 + 200); } }, icon('play', 16), ' tocar'),
        h('button', { class: 'btn primary', type: 'button', disabled: !!unk, onclick: saveIt }, 'salvar em meus ritmos'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { notes = []; draw(); } }, 'descartar')),
      unk ? h('p', { class: 'tp-hint' }, 'resolve os “?” pra salvar (eu não invento a peça).') : null);
  }
  const saveIt = () => sheet('Salvar em meus ritmos', (close) => {
    const name = h('input', { type: 'text', maxlength: 60, placeholder: 'ex.: frase da mesa', 'aria-label': 'Nome do ritmo' });
    return h('div', { class: 'sheet-body' }, h('label', { class: 'field' }, h('span', {}, 'nome'), name),
      h('div', { class: 'row end' }, h('button', { class: 'btn primary', type: 'button', onclick: async (e) => {
        const btn = e.currentTarget; const n = name.value.trim() || 'Ritmo transcrito'; const b = { ...beatOf(), name: n, mine: true };
        const rec = await store.upsert('beat', null, { beat: b }); stars(btn); close();
        toast('salvo em meus ritmos ✓', { action: 'abrir no Beat Lab', onAction: async () => { await store.upsert('setting', 'setting-beatlab', { beat: { ...b, id: rec.id, recId: rec.id } }); location.hash = '#/beatlab'; } });
      } }, 'salvar')));
  });
  draw();
  el.stop = () => { run && run.cancel(); stopBeat(); };
  return el;
}

/* ---------- tela ---------- */
export function mount(host, parts) {
  let mic = null, pane = null, gone = false, handler = null;
  const tab = parts && parts[0] === 'transcritor' ? 'transcritor' : 'juiz';
  const listen = (fn) => { handler = fn; };
  const body = h('div');
  const tabs = h('nav', { class: 'chips lib-tabs bl-tabs', 'aria-label': 'Juiz de tempo' },
    h('a', { class: `lib-tab${tab === 'juiz' ? ' on' : ''}`, href: '#/tempo', 'aria-current': tab === 'juiz' ? 'page' : null }, 'juiz de tempo'),
    h('a', { class: `lib-tab${tab === 'transcritor' ? ' on' : ''}`, href: '#/tempo/transcritor', 'aria-current': tab === 'transcritor' ? 'page' : null }, 'transcritor'));
  const ask = () => body.replaceChildren(h('section', { class: 'card pad ov-ask' },
    h('img', { class: 'ov-ask-art', src: 'assets/mural/drum.svg', alt: '' }),
    h('h2', { class: 'tag' }, 'por que o microfone?'),
    h('p', {}, tab === 'juiz' ? 'pra ouvir cada batida sua e medir, em milissegundos, se ela caiu antes ou depois do tempo.' : 'pra ouvir a frase que você bater e transformar em grade e partitura.'),
    h('p', {}, 'o som é analisado aqui no celular, ao vivo: só os instantes das batidas viram números. nada é gravado em arquivo nem enviado pra internet.'),
    h('p', { class: 'muted' }, 'funciona melhor em lugar quieto. o microfone desliga sozinho quando você sai desta tela.'),
    h('button', { class: 'btn primary wide', type: 'button', onclick: start }, 'ligar o microfone e o som')));
  async function start() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('sem'), { name: 'NotSupported' });
      mic = await openOnsets((ev) => handler && handler(ev));
      if (gone) { mic.stop(); return; }
      body.dataset.mode = mic.mode; // worklet (preciso) ou script (plano B)
      pane = tab === 'juiz' ? judgeTab(mic, listen) : transcribeTab(mic, listen);
      body.replaceChildren(pane);
    } catch (e) {
      const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      body.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, denied ? 'sem permissão pro microfone.' : 'não consegui abrir o microfone.'),
        h('p', { class: 'muted' }, denied ? 'tudo bem! se quiser usar, no iPhone vá em Ajustes › Safari › Microfone (ou no app instalado: Ajustes › Beaterista) e permita. depois volte aqui.' : 'este navegador não deu acesso ao microfone. no iPhone, abra pelo Safari ou pelo app instalado na tela inicial.'),
        h('button', { class: 'btn', type: 'button', onclick: start }, 'tentar de novo')));
    }
  }
  host.append(banner('Juiz de Tempo', tab === 'juiz' ? 'adiantou ou atrasou? em milissegundos' : 'bate na mesa, vira partitura'), tabs, body);
  ask();
  return () => { gone = true; pane && pane.stop && pane.stop(); if (mic) mic.stop(); mic = null; };
}
