// Ferramentas: o "canivete" musical. Hub com cards e as ferramentas pequenas (tap tempo, BPM pelo microfone, roleta).
// As maiores moram em arquivos próprios: tools-leitura (folhas em PDF), tools-mapa (mapa da música e forma),
// tools-loop (YouTube em loop), tools-um (achar o 1), tools-groovebox e tools-desafio.
import { h } from '../util.js';
import * as store from '../store.js';
import * as T from '../tools-logic.js';
import * as B from '../beats.js';
import { PRESETS as RUDS } from '../rudiments.js';
import { audio, click } from '../audio.js';
import * as FB from '../feedback.js';
import { getMic, micToast } from '../mic-access.js';
import { tipBox } from '../tipbox.js';
import { banner, toast } from '../ui.js';
import { metroAt, back } from './tools-common.js';
import { mountLeitura } from './tools-leitura.js';
import { mountMapa } from './tools-mapa.js';
import { mountLoop } from './tools-loop.js';
import { mountUm } from './tools-um.js';
import { mountGroovebox } from './tools-groovebox.js';
import { mountDesafio } from './tools-desafio.js';

export const TOOLS = [
  ['tap', 'Tap tempo', 'bate na tela e descobre o BPM', '👆'],
  ['bpm', 'BPM pelo microfone', 'toca a música perto e ele estima', '🎙'],
  ['mapa', 'Mapa da música', 'intro, verso, refrão: o app avisa a troca', '🗺'],
  ['loop', 'Play-along em loop', 'trecho do YouTube repetindo e mais lento', '🔁'],
  ['groovebox', 'Groovebox', '12 pads de bateria e percussão', '🎛'],
  ['um', 'Achar o 1', 'o groove começa no meio: toque no 1', '1️⃣'],
  ['leitura', 'Folhas de leitura', 'leitura nova por nível, em PDF', '📄'],
  ['roleta', 'Roleta da aula', 'sorteia exercício, groove ou música', '🎡'],
  ['desafio', 'Desafio da semana', 'um desafio novo + card pra postar', '🏆'],
];

function hub(host) {
  host.append(banner('Ferramentas', 'o canivete musical da Bea'),
    h('div', { class: 'ft-grid' }, ...TOOLS.map(([id, t, s, e]) => h('a', { class: 'ft-card', href: `#/ferramentas/${id}` }, h('span', { class: 'ft-emoji', 'aria-hidden': 'true' }, e), h('b', {}, t), h('small', {}, s))),
      h('a', { class: 'ft-card', href: '#/partitura' }, h('span', { class: 'ft-emoji', 'aria-hidden': 'true' }, '🎼'), h('b', {}, 'Partitura que toca'), h('small', {}, 'passa o PDF pra grade e ouve (Montar Partitura)'))));
}

/* ---------- tap tempo ---------- */
function tap(host) {
  let times = [];
  const out = h('output', { class: 'ft-big', 'aria-live': 'polite' }, '—');
  const sub = h('p', { class: 'muted ft-sub' }, 'toque no ritmo da música (pelo menos 4 vezes)');
  const use = h('button', { class: 'btn primary', type: 'button', disabled: true, onclick: () => { const b = T.tapBpm(times); if (b) metroAt(T.fold(b)); } }, 'usar no metrônomo');
  const show = () => {
    const b = T.tapBpm(times); use.disabled = !b;
    if (!b) { out.textContent = times.length ? '…' : '—'; sub.textContent = times.length ? `mais ${Math.max(1, 4 - times.length)}…` : 'toque no ritmo da música (pelo menos 4 vezes)'; return; }
    out.textContent = String(Math.round(b)); sub.textContent = `${times.length} toques · metade ${Math.round(b / 2)} · dobro ${Math.round(b * 2)}`;
  };
  const hit = (ms) => { if (times.length && ms - times[times.length - 1] > 2000) times = []; times.push(ms); show(); pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit'); };
  const pad = h('button', { class: 'ft-pad', type: 'button', 'aria-label': 'Toque no tempo', onpointerdown: (e) => { e.preventDefault(); hit(e.timeStamp || performance.now()); } }, 'toque aqui');
  const onKey = (e) => { if (e.code === 'Space' && !e.repeat && document.activeElement === document.body) { e.preventDefault(); hit(e.timeStamp); } };
  document.addEventListener('keydown', onKey);
  host.append(banner('Tap tempo', 'descobre o BPM batendo junto'), back(),
    h('section', { class: 'card pad ft-center' }, out, h('span', { class: 'tp-unit' }, 'BPM'), sub, pad,
      h('div', { class: 'row ft-row' }, use, h('button', { class: 'btn ghost', type: 'button', onclick: () => { times = []; show(); } }, 'zerar'))),
    h('p', { class: 'pad-x lib-note' }, 'dica: bata no tempo (semínima), não em cada nota. no computador, a barra de espaço também bate.'));
  return () => document.removeEventListener('keydown', onKey);
}

/* ---------- BPM pelo microfone ---------- */
const LISTEN = 15; // segundos
function bpmMic(host) {
  let stream = null, src = null, timer = 0, est = 0, startAt = 0; let frames = []; let result = null; let factor = 1; let opening = false; let gone = false;
  const out = h('output', { class: 'ft-big', 'aria-live': 'polite' }, '—');
  const sub = h('p', { class: 'muted ft-sub' }, 'coloca a música pra tocar perto do celular e aperta ouvir.');
  const bar = h('div', { class: 'ft-prog' }, h('i'));
  const conf = (c) => (c > 0.5 ? 'certeza alta' : c > 0.25 ? 'certeza média' : 'certeza baixa: confere no tap tempo');
  const paint = () => {
    if (!result) return; const b = Math.round(result.bpm * factor); out.textContent = String(b);
    sub.textContent = `${conf(result.conf)}${stream ? ' · ouvindo…' : ''}`; use.disabled = false;
  };
  const estimate = () => {
    if (frames.length < 50) return;
    // reamostra o fluxo de ataques pra 100 quadros/s
    const t0 = frames[0][0], t1 = frames[frames.length - 1][0]; const n = Math.floor((t1 - t0) * 100); const env = new Array(n); let k = 0;
    for (let i = 0; i < n; i++) { const t = t0 + i / 100; while (k < frames.length - 2 && frames[k + 1][0] < t) k++; const [ta, va] = frames[k], [tb, vb] = frames[k + 1]; env[i] = tb > ta ? va + ((vb - va) * (t - ta)) / (tb - ta) : va; }
    const r = T.tempoFromEnvelope(env, 100); if (r) { result = r; paint(); }
  };
  const stop = () => {
    clearInterval(timer); clearInterval(est); timer = est = 0;
    if (src) { try { src.disconnect(); } catch { /* já solto */ } src = null; }
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    if (gone) return;
    go.textContent = 'ouvir de novo'; go.classList.remove('on'); bar.firstChild.style.width = '0%'; estimate(); paint();
  };
  const start = async () => {
    if (stream) { stop(); return; }
    if (opening) return; opening = true; // dois toques seguidos em "ouvir" abriam dois microfones e o primeiro ficava ligado pra sempre
    let got;
    try { got = await getMic(); }
    catch (e) { opening = false; if (!gone) toast(micToast(e)); return; }
    opening = false;
    if (gone) { got.getTracks().forEach((t) => t.stop()); return; } // saiu da tela enquanto o microfone abria
    stream = got;
    const c = audio(); src = c.createMediaStreamSource(stream); const an = c.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0; src.connect(an);
    const spec = new Float32Array(an.frequencyBinCount); let prev = null; frames = []; result = null; factor = 1; startAt = c.currentTime;
    // fluxo espectral: quanto a energia subiu de um quadro pro outro (ataques de bateria, palhetada, sílaba)
    timer = setInterval(() => {
      an.getFloatFrequencyData(spec); let f = 0;
      if (prev) for (let i = 2; i < spec.length; i++) { const d = spec[i] - prev[i]; if (d > 0 && spec[i] > -90) f += d; }
      prev = Float32Array.from(spec); frames.push([c.currentTime, f]);
      const el = c.currentTime - startAt; bar.firstChild.style.width = `${Math.min(100, (el / LISTEN) * 100)}%`;
      if (el >= LISTEN) stop();
    }, 10);
    est = setInterval(() => { if (c.currentTime - startAt > 6) estimate(); }, 1000);
    go.textContent = 'parar'; go.classList.add('on'); out.textContent = '…'; sub.textContent = 'ouvindo… (uns 15 segundos)';
  };
  const go = h('button', { class: 'btn primary', type: 'button', onclick: start }, 'ouvir');
  const use = h('button', { class: 'btn', type: 'button', disabled: true, onclick: () => result && metroAt(result.bpm * factor) }, 'usar no metrônomo');
  host.append(banner('BPM pelo microfone', 'o app escuta e estima o andamento'), back(),
    h('section', { class: 'card pad ft-center' }, out, h('span', { class: 'tp-unit' }, 'BPM'), sub, bar,
      h('div', { class: 'row ft-row' }, go, use),
      h('div', { class: 'row ft-row' }, h('button', { class: 'btn small ghost', type: 'button', onclick: () => { factor /= 2; paint(); } }, '÷2 (tá rápido demais)'), h('button', { class: 'btn small ghost', type: 'button', onclick: () => { factor *= 2; paint(); } }, '×2 (tá lento demais)'))),
    h('p', { class: 'pad-x lib-note' }, 'o som não sai do celular: o app só mede onde estão os ataques. músicas com bateria marcada dão resultado melhor. em dúvida, confirma no tap tempo.'));
  return () => { gone = true; stop(); };
}

/* ---------- roleta da aula ---------- */
const RKEY = 'setting-roleta';
function roleta(host) {
  const conf = () => ({ src: 'rud', custom: '', last: [], ...(store.get(RKEY) ? store.get(RKEY).data : {}) });
  const save = (p) => store.upsert('setting', RKEY, p);
  const SOURCES = [['rud', 'rudimentos'], ['groove', 'grooves'], ['musica', 'repertório'], ['minha', 'minha lista']];
  const itemsOf = (src) => {
    if (src === 'rud') return [...store.list('rudiment').filter((r) => r.data.metodo).map((r) => ({ t: r.data.name, go: () => store.upsert('setting', 'setting-rudimentos', { pick: `mine:${r.id}` }).then(() => { location.hash = '#/rudimentos'; }) })), ...RUDS.map((p) => ({ t: p.name, go: () => store.upsert('setting', 'setting-rudimentos', { pick: `preset:${p.id}` }).then(() => { location.hash = '#/rudimentos'; }) }))];
    if (src === 'groove') return [...store.list('beat').filter((r) => r.data.metodo && r.data.beat).map((r) => r.data.beat), ...B.PRESETS.filter((p) => p.kind === 'groove')].map((b) => ({ t: b.name, go: () => store.upsert('setting', 'setting-beatlab', { beat: B.clone(b) }).then(() => { location.hash = '#/beatlab'; }) }));
    if (src === 'musica') return store.list('song').map((r) => ({ t: `${r.data.title}${r.data.bpm ? ` · ${r.data.bpm} BPM` : ''}`, go: () => { location.hash = '#/repertorio'; } }));
    return conf().custom.split('\n').map((s) => s.trim()).filter(Boolean).map((t) => ({ t }));
  };
  const show = h('div', { class: 'ft-wheel', 'aria-live': 'polite' }, h('b', {}, '?'));
  const SZ = 300; const cv = h('canvas', { class: 'ft-roda', width: SZ * 2, height: SZ * 2, role: 'img', 'aria-label': 'Roleta da aula' });
  const wheel = h('div', { class: 'ft-rodawrap' }, cv, h('i', { class: 'ft-ponteiro', 'aria-hidden': 'true' }));
  const COLORS = ['#a31d30', '#e3a82f', '#14284b', '#fbf7ee', '#6e1423', '#2f7d5b'];
  let segs = []; let rot = 0; // graus; 0 = primeira fatia começa na direita, o ponteiro fica em cima (270°)
  const drawWheel = () => {
    const g = cv.getContext('2d'); const R = SZ; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, R * 2, R * 2);
    g.translate(R, R); g.rotate((rot * Math.PI) / 180);
    const n = segs.length || 1; const a = (Math.PI * 2) / n;
    for (let i = 0; i < n; i++) {
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R - 8, i * a, (i + 1) * a); g.closePath();
      const col = COLORS[i % COLORS.length]; g.fillStyle = col; g.fill(); g.lineWidth = 4; g.strokeStyle = '#1b1818'; g.stroke();
      if (segs[i]) { g.save(); g.rotate(i * a + a / 2); g.fillStyle = /fbf7ee|e3a82f/.test(col) ? '#1b1818' : '#fff'; g.textAlign = 'right'; g.textBaseline = 'middle';
        let t = segs[i].t; if (t.length > 30) t = `${t.slice(0, 29)}…`;
        let sz = n > 8 ? 26 : 32; g.font = `800 ${sz}px "Hanken Grotesk", sans-serif`; while (g.measureText(t).width > R - 36 - 52 && sz > 15) { sz -= 1; g.font = `800 ${sz}px "Hanken Grotesk", sans-serif`; }
        g.fillText(t, R - 36, 0); g.restore(); }
    }
    g.beginPath(); g.arc(0, 0, 34, 0, Math.PI * 2); g.fillStyle = '#fbf7ee'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#1b1818'; g.stroke();
  };
  const under = () => { const n = segs.length || 1; const ang = (((270 - rot) % 360) + 360) % 360; return Math.floor(ang / (360 / n)) % n; }; // fatia sob o ponteiro
  const open = h('div', { class: 'row ft-row' });
  const custom = h('textarea', { rows: 5, 'aria-label': 'Minha lista', placeholder: 'um item por linha\nex.: 2 minutos de toque simples a 80\nex.: groove com a mão fraca' }, conf().custom);
  custom.addEventListener('input', () => save({ custom: custom.value }));
  const chips = h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'O que sortear' });
  const hist = h('ol', { class: 'ft-hist' });
  const draw = () => {
    const c = conf();
    chips.replaceChildren(...SOURCES.map(([k, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(c.src === k), class: `lib-tab${c.src === k ? ' on' : ''}`, onclick: () => save({ src: k }).then(draw) }, t)));
    custom.parentElement && (custom.parentElement.hidden = c.src !== 'minha');
    hist.replaceChildren(...(c.last || []).slice(0, 5).map((t) => h('li', {}, t)));
  };
  let spinning = false; let lastItem = null; let raf = 0;
  const go = () => {
    if (spinning) return; const items = itemsOf(conf().src);
    if (!items.length) { toast(conf().src === 'minha' ? 'escreve sua lista primeiro' : 'nada pra sortear aqui ainda'); return; }
    spinning = true; open.replaceChildren(); audio(); const pick = T.spin(items, lastItem);
    // a roda mostra até 12 fatias: a sorteada + outras, embaralhadas (se tem poucos itens, repete pra a roda não ficar vazia)
    const others = T.spin ? items.filter((x) => x !== pick).sort(() => Math.random() - 0.5) : [];
    let pool = [pick, ...others].slice(0, 12); while (pool.length < 6) pool = [...pool, ...pool.slice(0, 6 - pool.length)];
    segs = pool.sort(() => Math.random() - 0.5); const wi = segs.indexOf(pick);
    const n = segs.length; const seg = 360 / n; show.classList.remove('done'); show.replaceChildren(h('b', {}, 'girando…'));
    // ponto final: o centro da fatia sorteada (com um tantinho de folga) cai sob o ponteiro, depois de várias voltas
    const jitter = (Math.random() - 0.5) * seg * 0.6; const end = rot - (rot % 360) + 360 * (5 + Math.floor(Math.random() * 3)) + (((270 - (wi + 0.5) * seg - jitter) % 360) + 360) % 360;
    const from = rot; const dur = 4800; const t0 = performance.now(); let lastSeg = under();
    const frame = (now) => {
      const k = Math.min(1, (now - t0) / dur); const e = 1 - (1 - k) ** 4; rot = from + (end - from) * e; drawWheel();
      const u = under(); if (u !== lastSeg) { lastSeg = u; click(audio().currentTime + 0.005, 0, 1.4); wheel.classList.remove('tick'); void wheel.offsetWidth; wheel.classList.add('tick'); }
      if (k < 1) { raf = requestAnimationFrame(frame); return; }
      spinning = false; lastItem = pick; raf = 0;
      show.replaceChildren(h('b', {}, pick.t)); show.classList.add('done'); FB.great(show, { msg: `${FB.line('win')}` });
      save({ last: [pick.t, ...(conf().last || [])].slice(0, 5) }).then(draw);
      if (pick.go) open.replaceChildren(h('button', { class: 'btn', type: 'button', onclick: pick.go }, 'abrir'));
    };
    raf = requestAnimationFrame(frame);
  };
  host.append(banner('Roleta da aula', 'deixa a sorte escolher o próximo'), back(),
    h('section', { class: 'card pad ft-center' }, chips, h('label', { class: 'field ft-custom' }, h('span', {}, 'minha lista'), custom), wheel, show,
      h('div', { class: 'row ft-row' }, h('button', { class: 'btn primary', type: 'button', onclick: go }, 'girar'), open)),
    h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'últimos'), hist));
  draw(); segs = Array.from({ length: 8 }, (_, i) => ({ t: ['groove', 'rudimento', 'música', 'virada', 'leitura', 'escuta', 'ghost', 'desafio'][i] })); drawWheel();
  return () => { if (raf) cancelAnimationFrame(raf); };
}

export function mount(host, parts = []) {
  const id = parts[0] || '';
  const map = { tap, bpm: bpmMic, roleta, leitura: mountLeitura, mapa: mountMapa, loop: mountLoop, um: mountUm, groovebox: mountGroovebox, desafio: mountDesafio };
  if (!map[id]) { hub(host); tipBox(host, 'ferramentas'); return null; }
  const off = map[id](host);
  if (id === 'leitura') tipBox(host, 'folhas');
  return off;
}
