// Estúdio de ouvido (espaço BEA, com atalho no BEATERISTA): um microfone, três abas ao vivo.
// Afinador de bateria · contador de BPM · cantarolou → virou nota. Todo o som é analisado aqui no aparelho;
// nada é gravado nem enviado. O microfone desliga ao sair da tela.
import { h } from '../util.js';
import * as store from '../store.js';
import * as P from '../pitch.js';
import { audio } from '../audio.js';
import { banner, toast } from '../ui.js';
import { guideTab } from './tuneguide.js';

const TUNE = 'tuning';
const SET = 'setting-ouvido';
const cfg = () => ({ tab: 'afinador', piece: 'caixa', ...(store.get(SET) ? store.get(SET).data : {}) });
const when = (ts) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short' }).format(new Date(ts));
const svgEl = (tag, attrs = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };

/* ---------- microfone ---------- */
async function openMic() {
  const ctx = audio();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser(); an.fftSize = 8192; an.smoothingTimeConstant = 0;
  src.connect(an);
  document.documentElement.dataset.mic = 'on'; // aviso no topo enquanto o microfone escuta
  const buf = new Float32Array(an.fftSize);
  return {
    ctx, sr: ctx.sampleRate, buf,
    read() { an.getFloatTimeDomainData(buf); return buf; },
    stop() { try { src.disconnect(); } catch { /* já desligado */ } stream.getTracks().forEach((t) => t.stop()); delete document.documentElement.dataset.mic; },
  };
}

/* ---------- ponteiro (-50 a +50 cents) ---------- */
function gauge() {
  const s = svgEl('svg', { viewBox: '0 0 240 130', class: 'ov-gauge', role: 'img', 'aria-label': 'Medidor de afinação' });
  const arc = (a0, a1, cls) => { const p = (a) => [120 + 100 * Math.cos(Math.PI * (1 - a)), 120 - 100 * Math.sin(Math.PI * (1 - a))]; const [x0, y0] = p(a0), [x1, y1] = p(a1); s.append(svgEl('path', { d: `M${x0} ${y0} A100 100 0 0 1 ${x1} ${y1}`, class: cls })); };
  arc(0, 0.42, 'ov-arc low'); arc(0.42, 0.58, 'ov-arc ok'); arc(0.58, 1, 'ov-arc high');
  for (let c = -50; c <= 50; c += 10) { const a = Math.PI * (1 - (c + 50) / 100); s.append(svgEl('line', { x1: 120 + 88 * Math.cos(a), y1: 120 - 88 * Math.sin(a), x2: 120 + (c % 50 ? 94 : 80) * Math.cos(a), y2: 120 - (c % 50 ? 94 : 80) * Math.sin(a), class: 'ov-tick' })); }
  const needle = svgEl('line', { x1: 120, y1: 120, x2: 120, y2: 30, class: 'ov-needle' });
  s.append(needle, svgEl('circle', { cx: 120, cy: 120, r: 7, class: 'ov-hub' }));
  s.set = (cents) => { const c = Math.max(-50, Math.min(50, cents ?? 0)); needle.setAttribute('transform', `rotate(${c * 0.9} 120 120)`); needle.classList.toggle('idle', cents == null); };
  s.set(null);
  return s;
}

/* ---------- pauta simples (clave de sol) ---------- */
const DIA = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; const SHARP = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
const diatonic = (m) => Math.floor(m / 12) * 7 + DIA[((m % 12) + 12) % 12];
export function staffSvg(notes, { shift = 0, w = Math.max(320, 40 + notes.length * 34) } = {}) {
  const s = svgEl('svg', { viewBox: `0 0 ${w} 130`, class: 'ov-staff', role: 'img', 'aria-label': `Pauta: ${notes.map((n) => P.midiName(n.midi).label).join(' ')}` });
  const E4 = diatonic(64), base = 88, gap = 8; // linha de baixo (mi4) em y=88; meio espaço = 4
  for (let i = 0; i < 5; i++) s.append(svgEl('line', { x1: 6, x2: w - 6, y1: base - i * gap, y2: base - i * gap, class: 'ov-line' }));
  const clef = svgEl('text', { x: 8, y: base + 6, class: 'ov-clef' }); clef.textContent = '𝄞'; s.append(clef);
  notes.forEach((n, i) => {
    const m = n.midi + shift; const step = diatonic(m) - E4; const y = base - step * gap / 2; const x = 48 + i * 34;
    for (let l = -2; l >= step; l -= 2) s.append(svgEl('line', { x1: x - 9, x2: x + 9, y1: base - l * gap / 2, y2: base - l * gap / 2, class: 'ov-line' }));
    for (let l = 10; l <= step; l += 2) s.append(svgEl('line', { x1: x - 9, x2: x + 9, y1: base - l * gap / 2, y2: base - l * gap / 2, class: 'ov-line' }));
    if (SHARP[((m % 12) + 12) % 12]) { const t = svgEl('text', { x: x - 17, y: y + 4, class: 'ov-acc' }); t.textContent = '♯'; s.append(t); }
    s.append(svgEl('ellipse', { cx: x, cy: y, rx: 5.6, ry: 4.2, transform: `rotate(-20 ${x} ${y})`, class: 'ov-head' }));
    const up = step < 4; s.append(svgEl('line', { x1: up ? x + 5 : x - 5, x2: up ? x + 5 : x - 5, y1: y, y2: up ? y - 26 : y + 26, class: 'ov-stem' }));
  });
  return s;
}

/* ---------- aba 1: afinador ---------- */
function tunerTab(mic) {
  let piece = cfg().piece; const readings = []; let pendingAt = 0; let last = null;
  const onset = P.onsetDetector({ ratio: 3, floor: 0.02, gap: 0.35 });
  const g = gauge();
  const noteEl = h('strong', { class: 'ov-note' }, '—'); const subEl = h('small', { class: 'ov-sub' }, 'bata uma vez no tambor e deixe soar');
  const tell = h('p', { class: 'ov-tell', 'aria-live': 'polite' });
  const chips = h('div', { class: 'chips lib-tabs ov-pieces' });
  const kit = h('div', { class: 'ov-kit' });
  const target = () => { const r = store.list(TUNE).filter((x) => x.data.piece === piece).sort((a, b) => b.data.at - a.data.at)[0]; return r ? r.data : null; };
  const drawChips = () => chips.replaceChildren(...P.PIECES.map((p) => h('button', { type: 'button', class: `lib-tab${p.id === piece ? ' on' : ''}`, 'aria-pressed': String(p.id === piece), onclick: () => { piece = p.id; store.upsert('setting', SET, { piece }); readings.length = 0; last = null; paint(); drawChips(); drawKit(); } }, p.label)));
  function paint() {
    const p = P.PIECES.find((x) => x.id === piece); const tg = target();
    if (!last) { noteEl.textContent = '—'; subEl.textContent = `bata uma vez e deixe soar · ${p.label}: ${p.min}–${p.max} Hz`; g.set(null); tell.textContent = tg ? `alvo salvo: ${P.noteOf(tg.freq).label} (${Math.round(tg.freq)} Hz)` : ''; tell.className = 'ov-tell'; return; }
    const n = P.noteOf(last);
    noteEl.replaceChildren(n.label, h('em', {}, ` ${n.solfa}`));
    subEl.textContent = `${last.toFixed(1)} Hz`;
    const cents = tg ? P.centsBetween(last, tg.freq) : n.cents;
    g.set(cents);
    const ref = tg ? `do alvo ${P.noteOf(tg.freq).label}` : `de ${n.label}`;
    if (Math.abs(cents) <= 8) { tell.textContent = `✓ afinado (${cents >= 0 ? '+' : ''}${cents} cents ${ref})`; tell.className = 'ov-tell ok'; }
    else if (cents < 0) { tell.textContent = `↑ sobe a tensão: ${-cents} cents abaixo ${ref}`; tell.className = 'ov-tell low'; }
    else { tell.textContent = `↓ desce a tensão: ${cents} cents acima ${ref}`; tell.className = 'ov-tell high'; }
  }
  function drawKit() {
    const rows = P.PIECES.map((p) => { const r = store.list(TUNE).filter((x) => x.data.piece === p.id).sort((a, b) => b.data.at - a.data.at); return { p, cur: r[0], prev: r[1] }; }).filter((x) => x.cur);
    kit.replaceChildren(h('h2', { class: 'tag' }, 'afinação do meu kit'),
      rows.length ? h('ul', { class: 'lab-list' }, rows.map(({ p, cur, prev }) => h('li', {}, h('strong', {}, `${p.label}: ${P.noteOf(cur.data.freq).label}`), h('small', {}, ` · ${Math.round(cur.data.freq)} Hz · ${when(cur.data.at)}${prev ? ` · antes ${Math.round(prev.data.freq)} Hz (${when(prev.data.at)})` : ''}`))))
        : h('p', { class: 'muted' }, 'nenhum alvo salvo ainda. afine uma peça e toque em “salvar como alvo”.'));
  }
  const save = h('button', { class: 'btn primary', type: 'button', onclick: async () => { if (!last) { toast('bata no tambor primeiro.'); return; } await store.upsert(TUNE, null, { piece, freq: +last.toFixed(2), note: P.noteOf(last).label, at: Date.now() }); toast('alvo salvo ✓'); paint(); drawKit(); } }, 'salvar como alvo desta peça');
  drawChips(); paint(); drawKit();
  const el = h('section', { class: 'ov-pane' }, chips, h('div', { class: 'card pad ov-tuner' }, g, noteEl, subEl, tell, save),
    h('p', { class: 'pad-x lib-note' }, 'funciona melhor em lugar quieto: abafe os outros tambores, bata uma vez a uns 3 dedos da borda e espere o som. o tom de tambor tem harmônicos confusos, então a leitura é uma referência, não verdade absoluta.'),
    h('section', { class: 'card pad' }, kit));
  el.frame = (buf, t) => {
    const tail = buf.subarray(buf.length - 1024);
    if (onset(P.rms(tail), t)) pendingAt = t + 0.18; // espera o ataque passar e o tom assentar
    if (pendingAt && t >= pendingAt) {
      pendingAt = 0; const p = P.PIECES.find((x) => x.id === piece);
      const r = P.drumPitch(buf, mic.sr, { min: p.min, max: p.max });
      if (r && r.clarity > 0.15) { readings.push(r.freq); if (readings.length > 3) readings.shift(); last = P.steady(readings); paint(); }
    }
  };
  return el;
}

/* ---------- aba 2: contador de BPM ---------- */
function bpmTab() {
  const onset = P.onsetDetector(); let hits = []; let locked = null; let est = null;
  const big = h('strong', { class: 'ov-bpm' }, '—'); const conf = h('small', { class: 'ov-sub' }, 'toque qualquer coisa marcada: o app escuta os ataques');
  const badge = h('span', { class: 'ov-badge' }); const dot = h('span', { class: 'ov-dot', 'aria-hidden': 'true' });
  const lockBtn = h('button', { class: 'btn', type: 'button', onclick: () => { locked = locked ? null : est && est.bpm; paint(); } });
  const paint = () => {
    const v = locked || (est && est.bpm);
    big.textContent = v ? String(v) : '—';
    conf.textContent = est ? `${est.confidence}% dos intervalos concordam · ${hits.length} ataques ouvidos` : `${hits.length} ataques ouvidos (precisa de 4)`;
    badge.textContent = locked ? '🔒 travado' : !est ? '' : est.stable ? '● estável' : '◐ instável';
    badge.className = `ov-badge${locked ? ' lock' : est && est.stable ? ' ok' : ' warn'}`;
    lockBtn.textContent = locked ? 'destravar' : 'travar BPM'; lockBtn.disabled = !locked && !est;
  };
  paint();
  const el = h('section', { class: 'ov-pane' },
    h('div', { class: 'card pad ov-bpm-card' }, dot, big, h('span', { class: 'ov-unit' }, 'BPM'), badge, conf,
      h('div', { class: 'bl-actions' }, lockBtn,
        h('button', { class: 'btn primary', type: 'button', onclick: async () => { const v = locked || (est && est.bpm); if (!v) { toast('ainda não tenho um BPM.'); return; } const cur = store.get('setting-metronome'); await store.upsert('setting', 'setting-metronome', { ...(cur ? cur.data : {}), bpm: v }); toast(`metrônomo em ${v} BPM`); location.hash = '#/metronomo'; } }, 'mandar pro metrônomo'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { hits = []; est = null; locked = null; paint(); } }, 'zerar'))),
    h('p', { class: 'pad-x lib-note' }, 'olha os últimos 12 segundos. toque notas curtas e fortes (caixa, palmas, baqueta na mesa). com muito eco ou som contínuo ele erra mais.'));
  el.frame = (buf, t, sr) => {
    const tail = buf.subarray(buf.length - 1024);
    if (onset(P.rms(tail), t)) {
      // instante exato do ataque dentro do bloco (não o do quadro da tela), para o BPM não arredondar errado
      let peak = 0; for (let i = 0; i < tail.length; i++) peak = Math.max(peak, Math.abs(tail[i]));
      let k = 0; while (k < tail.length && Math.abs(tail[k]) < peak * 0.5) k++;
      hits.push(t - (tail.length - k) / sr); hits = hits.filter((x) => t - x < 12);
      dot.classList.remove('on'); void dot.offsetWidth; dot.classList.add('on');
      if (!locked) est = P.tempoOf(hits);
      paint();
    }
  };
  return el;
}

/* ---------- aba 3: cantarolou → virou nota ---------- */
function humTab(mic) {
  let rec = false, frames = [], notes = [], t0 = 0;
  const live = h('strong', { class: 'ov-note' }, '—'); const liveSub = h('small', { class: 'ov-sub' }, 'toque em gravar e cante ou assobie');
  const recBtn = h('button', { class: 'bl-play ov-rec', type: 'button' });
  const out = h('div', { class: 'ov-out' });
  const shift = () => { if (!notes.length) return 0; const avg = notes.reduce((a, n) => a + n.midi, 0) / notes.length; return avg < 57 ? 12 : avg > 84 ? -12 : 0; };
  const paintRec = () => { recBtn.replaceChildren(rec ? '■' : '●'); recBtn.setAttribute('aria-label', rec ? 'Parar gravação' : 'Gravar'); recBtn.classList.toggle('on', rec); };
  function play() {
    const ctx = audio(); let at = ctx.currentTime + 0.1;
    notes.forEach((n) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = P.freqOf(n.midi);
      const d = Math.max(0.15, Math.min(1.2, n.dur)); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.3, at + 0.02); g.gain.setValueAtTime(0.3, at + d - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, at + d);
      o.connect(g).connect(ctx.destination); o.start(at); o.stop(at + d + 0.02); at += d + 0.04; });
  }
  function exportImage() {
    const svg = staffSvg(notes, { shift: shift() }); const vb = svg.getAttribute('viewBox').split(' ').map(Number);
    svg.setAttribute('width', vb[2] * 3); svg.setAttribute('height', vb[3] * 3);
    const css = '.ov-line,.ov-stem{stroke:#1b1818;stroke-width:1.2}.ov-head{fill:#1b1818}.ov-clef{font:46px serif;fill:#1b1818}.ov-acc{font:16px serif;fill:#1b1818}';
    const st = svgEl('style'); st.textContent = css; svg.prepend(st);
    const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height + 60; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 30); g.fillStyle = '#1b1818'; g.font = '600 24px sans-serif'; g.fillText(notes.map((n) => P.midiName(n.midi).label).join('  '), 20, c.height - 18);
      c.toBlob((b) => { const a = h('a', { href: URL.createObjectURL(b), download: 'melodia.png' }); document.body.append(a); a.click(); a.remove(); }, 'image/png'); };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
  }
  function drawOut() {
    if (!notes.length) { out.replaceChildren(h('p', { class: 'muted' }, frames.length ? 'não peguei nenhuma nota firme. tente de novo, mais perto e sem fundo musical.' : 'as notas aparecem aqui quando você parar a gravação.')); return; }
    const sh = shift();
    out.replaceChildren(...[
      h('div', { class: 'ov-staff-wrap' }, staffSvg(notes, { shift: sh })),
      sh ? h('small', { class: 'muted' }, sh > 0 ? 'escrito uma oitava acima do que soou (para caber na pauta).' : 'escrito uma oitava abaixo do que soou.') : null,
      h('ol', { class: 'ov-notes' }, notes.map((n, i) => { const nm = P.midiName(n.midi); return h('li', {},
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Descer ${nm.label} meio tom`, onclick: () => { n.midi--; drawOut(); } }, '−'),
        h('span', { class: 'ov-chip' }, h('b', {}, nm.label), h('small', {}, nm.solfa)),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Subir ${nm.label} meio tom`, onclick: () => { n.midi++; drawOut(); } }, '+'),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Apagar ${nm.label}`, onclick: () => { notes.splice(i, 1); drawOut(); } }, '×')); })),
      h('div', { class: 'bl-actions' },
        h('button', { class: 'btn primary', type: 'button', onclick: play }, 'tocar de volta'),
        h('button', { class: 'btn', type: 'button', onclick: async () => { const txt = notes.map((n) => { const m = P.midiName(n.midi); return `${m.label} (${m.solfa})`; }).join(' · '); try { await navigator.clipboard.writeText(txt); toast('notas copiadas'); } catch { toast(txt); } } }, 'copiar texto'),
        h('button', { class: 'btn', type: 'button', onclick: exportImage }, 'exportar imagem'))].filter(Boolean));
  }
  recBtn.addEventListener('click', () => {
    rec = !rec;
    if (rec) { frames = []; notes = []; t0 = mic.ctx.currentTime; drawOut(); } else { notes = P.segmentNotes(frames); drawOut(); live.textContent = '—'; liveSub.textContent = `${notes.length} nota${notes.length === 1 ? '' : 's'}`; }
    paintRec();
  });
  paintRec(); drawOut();
  const el = h('section', { class: 'ov-pane' },
    h('div', { class: 'card pad ov-hum' }, recBtn, live, liveSub),
    h('p', { class: 'pad-x lib-note ov-warn' }, '⚠ funciona bem com voz ou assobio sozinhos, em lugar quieto. com bateria ou música tocando junto ele erra mais.'),
    h('section', { class: 'card pad' }, out));
  let tick = 0;
  el.frame = (buf, t) => {
    if (!rec || (tick++ & 1)) return; // metade dos quadros basta (~30 por segundo)
    const w = buf.subarray(buf.length - 2048); const lvl = P.rms(w);
    const r = lvl > 0.01 ? P.detectPitch(w, mic.sr, { min: 80, max: 1100 }) : null;
    const ok = r && r.clarity > 0.8;
    frames.push({ t: t - t0, freq: ok ? r.freq : null });
    if (ok) { const n = P.noteOf(r.freq); live.replaceChildren(n.label, h('em', {}, ` ${n.solfa}`)); liveSub.textContent = `${Math.round(r.freq)} Hz · gravando…`; }
  };
  return el;
}

/* ---------- tela ---------- */
export function mount(host) {
  let mic = null, raf = 0, pane = null, gone = false;
  const body = h('div');
  const tabs = h('nav', { class: 'chips lib-tabs bl-tabs', 'aria-label': 'Estúdio de ouvido' });
  const TABS = [['afinador', 'afinador'], ['guia', 'guia de afinação'], ['bpm', 'contador de BPM'], ['cantarolar', 'cantarolou → nota']];
  const show = (id) => {
    store.upsert('setting', SET, { tab: id });
    tabs.replaceChildren(...TABS.map(([k, t]) => h('button', { type: 'button', class: `lib-tab${k === id ? ' on' : ''}`, 'aria-pressed': String(k === id), onclick: () => show(k) }, t)));
    if (!mic) return;
    pane = id === 'afinador' ? tunerTab(mic) : id === 'guia' ? guideTab(mic) : id === 'bpm' ? bpmTab(mic) : humTab(mic);
    body.replaceChildren(pane);
  };
  const loop = () => { if (gone || !mic) return; const buf = mic.read(); pane && pane.frame && pane.frame(buf, mic.ctx.currentTime, mic.sr); raf = requestAnimationFrame(loop); };
  const ask = () => body.replaceChildren(h('section', { class: 'card pad ov-ask' },
    h('img', { class: 'ov-ask-art', src: 'assets/mural/drum.svg', alt: '' }),
    h('h2', { class: 'tag' }, 'por que o microfone?'),
    h('p', {}, 'para ouvir o tambor (afinador), os seus ataques (BPM) e a sua voz (notas). o som é analisado aqui no celular, ao vivo: nada é gravado em arquivo nem enviado pra internet.'),
    h('p', { class: 'muted' }, 'o microfone desliga sozinho quando você sai desta tela.'),
    h('button', { class: 'btn primary wide', type: 'button', onclick: start }, 'ligar o microfone e o som')));
  async function start() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('sem'), { name: 'NotSupported' });
      mic = await openMic();
      if (gone) { mic.stop(); return; }
      show(cfg().tab); raf = requestAnimationFrame(loop);
    } catch (e) {
      const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      body.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, denied ? 'sem permissão pro microfone.' : 'não consegui abrir o microfone.'),
        h('p', { class: 'muted' }, denied ? 'tudo bem! se quiser usar, no iPhone vá em Ajustes › Safari › Microfone (ou no app instalado: Ajustes › Beaterista) e permita. depois volte aqui.' : 'este navegador não deu acesso ao microfone. no iPhone, abra pelo Safari ou pelo app instalado na tela inicial.'),
        h('button', { class: 'btn', type: 'button', onclick: start }, 'tentar de novo')));
    }
  }
  host.append(banner('Estúdio de Ouvido', 'um microfone, quatro ferramentas'), tabs, body);
  show(cfg().tab); ask();
  return () => { gone = true; cancelAnimationFrame(raf); if (mic) mic.stop(); mic = null; };
}
