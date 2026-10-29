// Ferramentas: o "canivete" musical. Hub com cards e as ferramentas pequenas (tap tempo, BPM pelo microfone, roleta).
// As maiores moram em arquivos próprios: tools-leitura (folhas em PDF), tools-mapa (mapa da música e forma),
// tools-loop (YouTube em loop), tools-um (achar o 1), tools-groovebox e tools-desafio.
import { h } from '../util.js';
import * as store from '../store.js';
import * as T from '../tools-logic.js';
import * as B from '../beats.js';
import { PRESETS as RUDS } from '../rudiments.js';
import { audio } from '../audio.js';
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
  ['groovebox', 'Groovebox', '16 pads com baixo e acordes', '🎛'],
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
  let stream = null, timer = 0, est = 0, startAt = 0; let frames = []; let result = null; let factor = 1;
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
    if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
    go.textContent = 'ouvir de novo'; go.classList.remove('on'); bar.firstChild.style.width = '0%'; estimate(); paint();
  };
  const start = async () => {
    if (stream) { stop(); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('esse navegador não libera o microfone'); return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
    catch { toast('sem permissão pro microfone. dá pra liberar nos ajustes do iPhone.'); return; }
    const c = audio(); const src = c.createMediaStreamSource(stream); const an = c.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = 0; src.connect(an);
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
  return stop;
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
  let spinning = false; let lastItem = null;
  const go = () => {
    if (spinning) return; const items = itemsOf(conf().src);
    if (!items.length) { toast(conf().src === 'minha' ? 'escreve sua lista primeiro' : 'nada pra sortear aqui ainda'); return; }
    spinning = true; open.replaceChildren(); const pick = T.spin(items, lastItem); let k = 0; const steps = 18;
    const roll = () => {
      const it = k < steps ? items[Math.floor(Math.random() * items.length)] : pick;
      show.replaceChildren(h('b', {}, it.t)); show.classList.toggle('done', k >= steps);
      if (k++ < steps) { setTimeout(roll, 40 + k * k * 1.2); return; }
      spinning = false; lastItem = pick;
      save({ last: [pick.t, ...(conf().last || [])].slice(0, 5) }).then(draw);
      if (pick.go) open.replaceChildren(h('button', { class: 'btn', type: 'button', onclick: pick.go }, 'abrir'));
    };
    roll();
  };
  host.append(banner('Roleta da aula', 'deixa a sorte escolher o próximo'), back(),
    h('section', { class: 'card pad ft-center' }, chips, h('label', { class: 'field ft-custom' }, h('span', {}, 'minha lista'), custom), show,
      h('div', { class: 'row ft-row' }, h('button', { class: 'btn primary', type: 'button', onclick: go }, 'girar'), open)),
    h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, 'últimos'), hist));
  draw();
  return () => {};
}

export function mount(host, parts = []) {
  const id = parts[0] || '';
  const map = { tap, bpm: bpmMic, roleta, leitura: mountLeitura, mapa: mountMapa, loop: mountLoop, um: mountUm, groovebox: mountGroovebox, desafio: mountDesafio };
  if (!map[id]) { hub(host); return null; }
  return map[id](host);
}
