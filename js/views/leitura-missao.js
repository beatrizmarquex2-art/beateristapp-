// Tela de UMA missão do Toca Aqui (Modo Aventura): mostra o compasso da missão, o jogador toca (na tela ou no microfone) e o resultado
// (precisão %) volta por onResult UMA vez, no fim real do compasso. Reusa a pauta, o clique e a avaliação do modo livre (treinos.js / reading.js).
import { h } from '../util.js';
import { audio, snare, perfToCtx } from '../audio.js';
import { session } from '../session.js';
import { toast } from '../ui.js';
import { onsets, evaluate } from '../reading.js';
import { capture } from '../kids/capture.js';
import { score as scoreEl, chunk, schedule, MARK } from './treinos.js';

const KEY = 'beaterista-toca-aventura';
const loadMic = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}').mic === true; } catch { return false; } };
const saveMic = (v) => { try { localStorage.setItem(KEY, JSON.stringify({ mic: !!v })); } catch { /* sem armazenamento */ } };

/** host: onde desenhar. { bar: 4 células, bpm, onResult(result) }. Devolve { destroy, inProgress }. */
export function mountLeituraMissao(host, { bar, bpm, onResult }) {
  const S = session(); const expected = onsets(bar, bpm); const q = 60 / bpm;
  let phase = 'idle'; // idle | run | done
  let wantMic = loadMic(); let micBlocked = false; let last = null; let run = null; let reported = false;
  const root = h('div', { class: 'tm-root' }); host.replaceChildren(root);
  const stopRun = () => { S.reset(); if (run) { try { run.off(); } catch { /* ok */ } run = null; } };

  const draw = () => {
    const useMic = wantMic && !micBlocked;
    const marks = last ? last.res.notes.map((n) => MARK[n.st]) : [];
    const pad = useMic ? h('div', { class: 'tr-pad mic', 'aria-label': 'O microfone escuta o seu pad ou a sua bateria' }, h('span', {}, '🎙 toque no seu pad ou bateria'), h('small', {}, 'o app escuta depois da contagem'))
      : h('button', { class: 'tr-pad', type: 'button', 'aria-label': 'Toque aqui no ritmo' }, h('span', {}, 'toque aqui'), h('small', {}, 'ou aperte qualquer tecla'));
    const status = h('p', { class: 'tr-status', 'aria-live': 'polite' }, last ? `precisão ${last.res.score}%` : `${bpm} BPM · ▶ vai direto pra sua vez (toque depois do “4”) ou ouça antes.`);
    const busy = phase === 'run';
    const mode = h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Como você toca' }, ...[[false, 'na tela'], [true, 'microfone']].map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(wantMic === v), disabled: busy, class: `lib-tab${wantMic === v ? ' on' : ''}`, onclick: () => { wantMic = v; micBlocked = false; saveMic(v); draw(); } }, t)));

    const finish = (taps, withMic) => {
      run = null; const res = evaluate(taps, expected, bpm, { mic: withMic }); phase = 'done';
      const devs = res.notes.filter((n) => n.ms != null).map((n) => n.ms); const avg = devs.length ? Math.round(devs.reduce((a, b) => a + b, 0) / devs.length) : 0;
      last = { res, avg }; draw();
      if (!reported) { reported = true; onResult({ ok: true, score: res.score, hits: res.hits, total: res.total, extra: res.extra, avgMs: avg, bpm, cells: bar.slice(), mic: withMic, delay: 1600 }); }
    };
    const start = () => {
      stopRun(); phase = 'run'; last = null; const ac = audio();
      if (useMic) {
        const cap = capture({ mode: 'mic', pad: null, bpm, beats: bar.length, clickBeats: false, onCount: (n) => { status.textContent = n < 4 ? `conta: ${n + 1}…` : '🎯 agora!'; } });
        pad.classList.add('live'); status.textContent = 'abrindo o microfone…'; run = { off: () => cap.cancel() }; const gen = S.gen;
        cap.done.then((r) => { if (!S.alive || gen !== S.gen) return; finish(r.onsets, true); }, (e) => {
          if (!S.alive || gen !== S.gen) return; run = null; phase = 'idle'; micBlocked = true;
          toast(e && e.name === 'NotAllowedError' ? 'sem permissão pro microfone: vou usar a tela' : 'não consegui abrir o microfone: vou usar a tela'); draw();
        });
        draw(); return;
      }
      const t0 = schedule(bar, bpm); const taps = [];
      const onTap = (e) => { if (e.type === 'keydown' && (e.repeat || e.metaKey || e.ctrlKey)) return; if (e.cancelable) e.preventDefault(); snare(audio().currentTime, 0.7); taps.push(perfToCtx(e.timeStamp || performance.now()) - t0); pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit'); };
      pad.addEventListener('pointerdown', onTap); document.addEventListener('keydown', onTap);
      const off = () => { pad.removeEventListener('pointerdown', onTap); document.removeEventListener('keydown', onTap); };
      pad.clock = () => perfToCtx(performance.now()) - t0; pad.dataset.onsets = JSON.stringify(expected.map((e) => e.t)); // pra quem testa tocando por script
      pad.classList.add('live'); status.textContent = 'conta: 1, 2, 3, 4…'; run = { off };
      S.later(() => { if (phase === 'run') status.textContent = 'agora!'; }, (t0 - ac.currentTime) * 1000);
      S.later(() => { off(); finish(taps, false); }, (t0 - ac.currentTime + bar.length * q + 0.4) * 1000);
    };
    const listen = () => { stopRun(); phase = 'idle'; schedule(bar, bpm, { play: true }); status.textContent = 'ouvindo como é…'; };
    const listenThenPlay = () => { stopRun(); phase = 'idle'; schedule(bar, bpm, { play: true }); status.textContent = 'ouça primeiro…'; S.later(start, ((4 + bar.length) * q + 0.9) * 1000); };
    const summary = last ? h('section', { class: 'card pad tr-res' }, h('div', { class: 'tr-big' }, h('b', {}, `${last.res.score}%`), h('span', {}, 'precisão')),
      h('p', {}, `${last.res.hits}/${last.res.total} notas · ${last.res.notes.filter((n) => n.st === 'ok').length} no tempo${last.res.extra ? ` · ${last.res.extra} a mais` : ''}`),
      h('p', { class: 'muted' }, `média ${last.avg > 0 ? '+' : ''}${last.avg} ms`),
      h('p', { class: 'tr-legend' }, h('i', { style: { background: MARK.ok } }), 'no tempo ', h('i', { style: { background: MARK.cedo } }), 'cedo/tarde ', h('i', { style: { background: MARK.faltou } }), 'faltou')) : null;
    root.replaceChildren(...[scoreEl(chunk(bar), marks), h('div', { class: 'row tr-actions' },
      h('button', { class: 'btn primary', type: 'button', disabled: busy, onclick: start }, '▶ tocar direto'),
      h('button', { class: 'btn', type: 'button', disabled: busy, onclick: listenThenPlay }, 'ouvir e depois tocar'),
      h('button', { class: 'btn', type: 'button', disabled: busy, onclick: listen }, 'só ouvir')),
      mode, status, pad, summary].filter(Boolean));
  };
  draw();
  return { destroy() { stopRun(); S.dispose(); }, inProgress: () => phase === 'run' };
}
