// Groovebox: 12 pads só de bateria e percussão (bumbo, caixa, palma, aro, chimbal, shaker, tons, cowbell, estalo…), sequenciador de 16 passos
// e gravar nos pads em loop. Toque no pad pra ouvir e escolher; toque nos passos pra ligar.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as T from '../tools-logic.js';
import { PADS as ALL_PADS } from '../synth.js';
const PADS = ALL_PADS.filter((p) => p[2] !== 'ink'); // fora baixo, piano elétrico, guitarra e voz: aqui é só bateria e percussão
import { scheduler, audio } from '../audio.js';
import { createLooper } from '../looper.js';
import { flash } from '../kids/kit-theme.js';
import { banner, sheet, toast, confirmSheet } from '../ui.js';
import { back } from './tools-common.js';
import { grooveToMidi } from '../midi-write.js';

const KEY = 'setting-groovebox';
const empty = () => Object.fromEntries(PADS.map(([id]) => [id, Array(16).fill(0)]));
const on = (s) => Array.from({ length: 16 }, (_, i) => (s.includes(i) ? 1 : 0));
const DEMO = { bd: on([0, 6, 8, 11]), sn: on([4, 12]), hh: on([0, 2, 4, 6, 8, 10, 12, 14]), ho: on([14]) };
const conf = () => {
  const d = store.get(KEY) ? store.get(KEY).data : {};
  return { bpm: 92, prog: 0, sel: 'bd', steps: { ...empty(), ...DEMO }, ...d, steps: { ...empty(), ...(d.steps || DEMO) } };
};
const save = (p) => store.upsert('setting', KEY, p);

export function mountGroovebox(host) {
  let run = null, step = -1, bar = 0, stepAt = 0;
  let st = conf(); // estado local (salva com folga, sem redesenhar tudo)
  if (!PADS.some((p) => p[0] === st.sel)) st.sel = 'bd'; // quem tinha o baixo/piano escolhido volta pro bumbo
  let saveT = 0; const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => save({ bpm: st.bpm, prog: st.prog, sel: st.sel, steps: st.steps }), 400); };
  const chordOf = (b) => T.chord(T.PROGRESSIONS[st.prog][b % 4]);
  const bpmOut = h('output', { class: 'gb-bpm' });
  const padsEl = h('div', { class: 'gb-pads' });
  const stepsEl = h('div', { class: 'gb-steps', role: 'group', 'aria-label': 'Passos' });
  const selName = h('b', {});
  const playBtn = h('button', { class: 'bl-play', type: 'button', 'aria-label': 'Tocar', onclick: () => (run ? stop() : start()) }, icon('play', 28));
  const paintHead = () => {
    bpmOut.replaceChildren(String(st.bpm), h('small', {}, ' bpm'));
    playBtn.classList.toggle('on', !!run); playBtn.replaceChildren(icon(run ? 'stop' : 'play', 28)); playBtn.setAttribute('aria-label', run ? 'Parar' : 'Tocar');
  };
  const paintPads = () => padsEl.replaceChildren(...PADS.map(([id, name, fam, fn]) => h('button', {
    type: 'button', class: `gb-pad f-${fam}${st.sel === id ? ' sel' : ''}${st.steps[id].some(Boolean) ? ' has' : ''}`, 'data-id': id, 'aria-label': `${name}${st.sel === id ? ' (escolhido)' : ''}`,
    onpointerdown: (e) => { e.preventDefault(); fn(audio().currentTime + 0.005, chordOf(run ? bar : 0)); looper.hit(id, e.timeStamp || performance.now()); flash(e.currentTarget); if (st.sel !== id) { st.sel = id; persist(); paintPads(); paintSteps(); } },
  }, h('span', {}, name))));
  const paintSteps = () => {
    selName.textContent = (PADS.find((p) => p[0] === st.sel) || PADS[0])[1];
    stepsEl.replaceChildren(...st.steps[st.sel].map((v, i) => h('button', { type: 'button', class: `gb-step${v ? ' on' : ''}${i % 4 === 0 ? ' beat' : ''}${i === step ? ' now' : ''}`, 'aria-label': `Passo ${i + 1}${v ? ' ligado' : ''}`, 'aria-pressed': String(!!v),
      onclick: () => { st.steps[st.sel][i] = v ? 0 : 1; persist(); paintSteps(); paintPads(); } })));
  };
  const moveHead = () => { stepAt = performance.now(); [...stepsEl.children].forEach((el, i) => el.classList.toggle('now', i === step)); };
  function start() {
    const dur = () => 60 / st.bpm / 4; let at = 0;
    run = scheduler((i) => {
      const t0 = at; at += dur(); const s = i % 16; const b = Math.floor(i / 16);
      return { at: t0, play: (t) => { const ch = chordOf(b); for (const [id, , , fn] of PADS) if (st.steps[id][s]) fn(t, ch); }, ui: () => { step = s; if (bar !== b) { bar = b; paintHead(); } moveHead(); } };
    });
    paintHead();
  }
  function stop() { if (run) run.stop(); run = null; step = -1; bar = 0; moveHead(); paintHead(); }
  // gravar o que você toca nos pads (até 30 s) e deixar em loop; exportar a batida dos passos em MIDI
  const lopts = () => { try { return { count: true, click: true, grid: true, ...JSON.parse(localStorage.getItem('bt-gb-looper') || '{}') }; } catch { return { count: true, click: true, grid: true }; } };
  const setLopt = (k) => { const o = lopts(); o[k] = !o[k]; try { localStorage.setItem('bt-gb-looper', JSON.stringify(o)); } catch { /* sem armazenamento */ } paintLooper(); };
  const lstatus = h('p', { class: 'tr-status', 'aria-live': 'polite' });
  const lprog = h('i', { class: 'tk-prog' }); const lbar = h('div', { class: 'tk-progress', 'aria-hidden': 'true' }, lprog);
  const lbox = h('div', { class: 'gb-looper' });
  const looper = createLooper({
    max: 30, bpm: () => st.bpm, opts: lopts,
    play: (id, t) => { const p = PADS.find((x) => x[0] === id); if (p) p[3](t, chordOf(0)); },
    flash: (id) => flash(padsEl.querySelector(`[data-id="${id}"]`)),
    onChange: () => paintLooper(),
    status: (text, kind) => { lstatus.textContent = text; lstatus.className = `tr-status${kind === 'count' ? ' tk-count' : ''}`; },
  });
  looper.onProg = (p) => { lprog.style.width = `${Math.round(p * 100)}%`; };
  const startRec = () => { if (run) stop(); looper.record(); };
  function paintLooper() {
    const o = lopts(); const sState = looper.state; const chip = (k, label) => h('button', { type: 'button', class: `lib-tab${o[k] ? ' on' : ''}`, 'aria-pressed': String(!!o[k]), onclick: () => setLopt(k) }, label);
    const main = sState === 'rec' ? [h('button', { class: 'btn primary tk-big', type: 'button', onclick: () => looper.finish() }, icon('stop', 16), ' parar'), h('button', { class: 'btn', type: 'button', onclick: () => looper.cancel() }, 'cancelar')]
      : sState === 'loop' ? [h('button', { class: 'btn primary tk-big', type: 'button', onclick: () => looper.stop() }, icon('stop', 16), ' parar'), h('button', { class: 'btn tk-big', type: 'button', onclick: startRec }, '↺ recomeçar')]
      : sState === 'stopped' ? [h('button', { class: 'btn primary tk-big', type: 'button', onclick: () => looper.start() }, icon('play', 16), ' tocar em loop'), h('button', { class: 'btn tk-big', type: 'button', onclick: startRec }, '↺ recomeçar')]
      : [h('button', { class: 'btn primary tk-big tk-rec', type: 'button', onclick: startRec }, h('i', { class: 'tk-dot' }), ` gravar nos pads (até ${looper.max} s)`)];
    lbox.replaceChildren(...[h('div', { class: 'row tk-line tk-ctrls' }, ...main), sState === 'rec' || sState === 'loop' ? lbar : null,
      h('div', { class: 'chips lib-tabs tk-opts', role: 'group', 'aria-label': 'Opções da gravação' }, chip('count', 'contagem'), chip('click', 'clique'), chip('grid', 'ao compasso')), lstatus].filter(Boolean));
  }
  const exportMidi = () => {
    if (!PADS.some(([id]) => st.steps[id].some(Boolean))) { toast('a batida está vazia. grave ou ligue alguns passos primeiro.'); return; }
    const chords = [0, 1, 2, 3].map(chordOf);
    const bytes = grooveToMidi({ steps: st.steps, chords, bpm: st.bpm, bars: 4 });
    const name = `groovebox-${st.bpm}bpm.mid`;
    const a = h('a', { href: URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' })), download: name }); document.body.append(a); a.click(); a.remove();
    toast('MIDI exportado ✓', { ms: 2400 });
  };
  const help = () => sheet('Como funciona', () => h('div', { class: 'sheet-body gb-help' },
    h('p', {}, h('b', {}, 'os pads: '), 'são os 12 sons de bateria e percussão. toque num pad pra ouvir e escolher. o pad escolhido fica marcado.'),
    h('p', {}, h('b', {}, 'os passos: '), 'a linha de 16 quadradinhos é UM compasso dividido em 16 pedacinhos (semicolcheias). cada quadradinho aceso = o som do pad escolhido toca ali. os mais escuros marcam os 4 tempos (1, 2, 3, 4).'),
    h('p', {}, h('b', {}, 'cada pad tem a sua linha: '), 'escolha o Bumbo e ligue passos, depois a Caixa e ligue outros, e assim por diante. tudo toca junto.'),
    h('p', {}, h('b', {}, 'gravar nos pads: '), 'aperte “gravar nos pads”, conte 4 e toque nos pads livremente por até 30 segundos. ao parar (ou aos 30 s) o que você tocou fica em loop do jeitinho que foi tocado. “parar” silencia; “recomeçar” grava de novo. “ao compasso” fecha o loop em compassos inteiros.'),
    h('p', {}, h('b', {}, 'exportar MIDI: '), 'gera um arquivo .mid com a batida. a bateria vai num canal só dela. dá pra abrir no GarageBand, Logic, Ableton ou qualquer programa de música.')));
  const patterns = () => store.list('gbpattern').sort((a, b) => (a.data.name || '').localeCompare(b.data.name || '', 'pt-BR'));
  const savePat = () => sheet('Salvar batida', (close) => {
    const name = h('input', { type: 'text', maxlength: 40, placeholder: 'ex.: neo soul 92', 'aria-label': 'Nome da batida' });
    return h('div', { class: 'sheet-body' }, h('label', { class: 'field' }, h('span', {}, 'nome'), name), h('button', { class: 'btn primary', type: 'button', onclick: async () => {
      await store.upsert('gbpattern', null, { name: name.value.trim() || 'minha batida', bpm: st.bpm, prog: st.prog, steps: JSON.parse(JSON.stringify(st.steps)) }); close(); toast('batida salva ✓', { ms: 1400 });
    } }, 'salvar'));
  });
  const openPats = () => sheet('Minhas batidas', (close) => {
    const l = patterns();
    return h('div', { class: 'sheet-body' }, l.length ? h('ul', { class: 'rp-list' }, ...l.map((r) => h('li', { class: 'rm-item' }, h('span', { class: 'rm-time' }, String(r.data.bpm)),
      h('button', { type: 'button', class: 'rp-t', onclick: () => { st = { ...st, bpm: r.data.bpm, prog: r.data.prog || 0, steps: { ...empty(), ...r.data.steps } }; persist(); paintHead(); paintPads(); paintSteps(); close(); } }, h('strong', {}, r.data.name), h('small', {}, T.PROGRESSIONS[r.data.prog || 0].join(' – '))),
      h('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Apagar ${r.data.name}`, onclick: async () => { if (await confirmSheet('Apagar batida?', r.data.name, 'Apagar')) { await store.remove(r.id); close(); } } }, 'apagar')))) : h('p', { class: 'muted' }, 'nenhuma ainda.'));
  });
  host.append(banner('Groovebox', 'monta a batida com os pads de bateria'), back(),
    h('section', { class: 'card pad gb' },
      h('div', { class: 'gb-head' },
        h('div', { class: 'gb-box' }, h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 2 BPM', onclick: () => { st.bpm = Math.max(50, st.bpm - 2); persist(); paintHead(); } }, '−'), bpmOut, h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 2 BPM', onclick: () => { st.bpm = Math.min(180, st.bpm + 2); persist(); paintHead(); } }, '+')),
        playBtn),
      padsEl,
      h('div', { class: 'row between gb-sel' }, h('p', {}, selName, h('small', { class: 'muted' }, ' · toque nos passos pra ligar e desligar · toque no pad pra ouvir e escolher')),
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => { st.steps[st.sel] = Array(16).fill(0); persist(); paintSteps(); paintPads(); } }, 'limpar')),
      stepsEl,
      lbox,
      h('div', { class: 'row ft-row' }, h('button', { class: 'btn small', type: 'button', onclick: exportMidi }, 'exportar MIDI'), h('button', { class: 'btn small ghost', type: 'button', onclick: help }, 'como funciona?')),
      h('div', { class: 'row ft-row' }, h('button', { class: 'btn', type: 'button', onclick: savePat }, 'salvar batida'), h('button', { class: 'btn ghost', type: 'button', onclick: openPats }, 'minhas batidas'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { st.steps = empty(); persist(); paintPads(); paintSteps(); } }, 'zerar tudo'))),
    h('p', { class: 'pad-x lib-note' }, 'todos os sons são gerados aqui no aparelho.'));
  paintHead(); paintPads(); paintSteps(); paintLooper();
  return () => { looper.dispose(); stop(); clearTimeout(saveT); save({ bpm: st.bpm, prog: st.prog, sel: st.sel, steps: st.steps }); };
}
