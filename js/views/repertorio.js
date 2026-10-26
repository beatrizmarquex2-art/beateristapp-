// Repertório: as músicas do método (registros privados "song" com metodo) e as suas. Cada música toca o groove dela
// no BPM da música, abre no Beat Lab, liga o metrônomo e leva pra ouvir a original. Estágio: quero / estudando / já toco.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as N from '../notation.js';
import { ROWS } from '../beats.js';
import * as R from '../repertoire.js';
import { banner, sheet, toast, confirmSheet } from '../ui.js';
import { playBeat, stopBeat, playingId } from './beatlab.js';

const songs = () => store.list('song');
// as linhas que faltam (ex.: groove sem chimbal) viram linhas vazias: a grade e a pauta esperam todas
const full = (b) => ({ ...b, rows: Object.fromEntries(ROWS.map((r) => [r.id, (b.rows && b.rows[r.id]) || Array(b.steps).fill(0)])) });
const grooveOf = (id) => { const r = store.get(id); return r && r.data.beat ? { ...full(r.data.beat), id, review: r.data.review } : null; };
/** O groove da música: o escolhido por ela, ou o primeiro da lista dela. */
const songBeat = (d) => grooveOf(d.groove || (d.grooves || [])[0]);
const asPlayable = (rec) => { const b = songBeat(rec.data); return b ? { ...b, id: rec.id, bpm: Number(rec.data.bpm) || b.bpm } : null; };
function mini(b) { const f = h('span', { class: 'bl-mini', 'aria-hidden': 'true' }); f.innerHTML = N.toSVG(N.layout(b, { width: 300, full: false })); return f; }

async function openInBeatLab(b, bpm) {
  stopBeat();
  await store.upsert('setting', 'setting-beatlab', { beat: { ...JSON.parse(JSON.stringify(b)), bpm: Number(bpm) || b.bpm, mine: false } });
  location.hash = '#/beatlab';
}
async function metronome(bpm) {
  stopBeat();
  const cur = store.get('setting-metronome'); await store.upsert('setting', 'setting-metronome', { ...(cur ? cur.data : {}), bpm: Number(bpm) || 80 });
  location.hash = '#/metronomo';
}

function playBtn(rec, repaint) {
  const b = asPlayable(rec); if (!b) return h('span', { class: 'rp-noplay' });
  const on = playingId() === rec.id;
  return h('button', { class: `bl-play small${on ? ' on' : ''}`, type: 'button', 'aria-label': `${on ? 'Parar' : 'Tocar groove de'} ${rec.data.title}`,
    onclick: () => { if (playingId() === rec.id) stopBeat(); else playBeat(b, { onStop: repaint, withClick: false }); repaint(); } }, icon(on ? 'stop' : 'play', 18));
}

function songSheet(rec) {
  const d = rec ? rec.data : { title: '', artist: '', bpm: '', group: '', stage: '', link: '', notes: '' };
  sheet(rec ? d.title : 'Nova música', (close) => {
    const f = (label, input) => h('label', { class: 'field' }, h('span', {}, label), input);
    const title = h('input', { type: 'text', maxlength: 90, value: d.title || '', 'aria-label': 'Nome da música' });
    const artist = h('input', { type: 'text', maxlength: 90, value: d.artist || '', placeholder: 'quem gravou', 'aria-label': 'Artista' });
    const bpm = h('input', { type: 'number', inputmode: 'numeric', min: 30, max: 260, value: d.bpm || '', placeholder: '120', 'aria-label': 'BPM' });
    const link = h('input', { type: 'url', inputmode: 'url', maxlength: 300, value: d.link || '', placeholder: 'link do YouTube ou Spotify (opcional)', 'aria-label': 'Link da música' });
    const notes = h('textarea', { rows: 3, maxlength: 600, placeholder: 'onde entra a virada, o que treinar, dica pro aluno…', 'aria-label': 'Anotações' }, d.notes || '');
    const group = rec && d.metodo ? null : h('input', { type: 'text', maxlength: 40, value: d.group || '', placeholder: 'Minhas músicas', 'aria-label': 'Grupo' });
    let stage = d.stage || ''; let groove = d.groove || (d.grooves || [])[0] || '';
    const stages = h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Estágio' });
    const drawStages = () => stages.replaceChildren(...R.STAGES.map((s) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(stage === s.id), class: `lib-tab${stage === s.id ? ' on' : ''}`, onclick: () => { stage = s.id; drawStages(); } }, s.label)));
    drawStages();
    const opts = (d.grooves || []).map(grooveOf).filter(Boolean);
    const grooves = h('div', { class: 'rp-grooves' });
    const drawGrooves = () => grooves.replaceChildren(...opts.map((b) => h('div', { class: `rp-groove${groove === b.id ? ' on' : ''}` },
      opts.length > 1 ? h('button', { type: 'button', class: 'lib-tab', 'aria-pressed': String(groove === b.id), onclick: () => { groove = b.id; drawGrooves(); } }, groove === b.id ? '✓ este' : 'usar este') : null,
      h('strong', {}, b.name, b.review ? h('small', { class: 'muted' }, ' · a revisar') : null), mini(b),
      h('div', { class: 'row' },
        h('button', { class: 'btn small', type: 'button', onclick: () => playBeat({ ...b, id: `sheet-${b.id}`, bpm: Number(bpm.value) || b.bpm }) }, '▶ tocar'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => stopBeat() }, '■'),
        h('button', { class: 'btn small ghost', type: 'button', onclick: () => { close(); openInBeatLab(b, bpm.value); } }, 'abrir no Beat Lab')))));
    drawGrooves();
    const save = async () => {
      const t = title.value.trim(); if (!t) { toast('dá um nome pra música'); return; }
      const patch = { title: t, artist: artist.value.trim(), bpm: Number(bpm.value) || '', link: link.value.trim(), notes: notes.value.trim(), stage, groove };
      if (group) patch.group = group.value.trim();
      if (!rec) patch.created = Date.now();
      await store.upsert('song', rec ? rec.id : null, patch); stopBeat(); close(); toast('salvo ✓', { ms: 1200 });
    };
    return h('div', { class: 'sheet-body rp-form' },
      d.metodo ? h('p', { class: 'muted rp-src' }, `${d.group} · ${d.source}`, d.pdf && d.pdf !== d.title ? ` · no PDF: “${d.pdf}”` : '', d.bpmPdf && Number(d.bpm) !== d.bpmPdf ? ` · BPM do PDF: ${d.bpmPdf}` : '') : null,
      f('música', title), h('div', { class: 'sl-2' }, f('artista', artist), f('BPM', bpm)),
      group ? f('grupo', group) : null,
      h('div', { class: 'field' }, h('span', {}, 'estágio'), stages),
      opts.length ? h('div', { class: 'field' }, h('span', {}, opts.length > 1 ? 'groove (escolha a variação)' : 'groove'), grooves) : null,
      h('div', { class: 'row' },
        h('button', { class: 'btn small', type: 'button', onclick: () => { close(); metronome(bpm.value); } }, `metrônomo em ${Number(bpm.value) || '–'} BPM`),
        h('a', { class: 'btn small ghost', href: R.listenUrl({ ...d, title: title.value, artist: artist.value, link: link.value.trim() }), target: '_blank', rel: 'noopener noreferrer' }, link.value.trim() ? 'ouvir a original' : 'buscar no YouTube')),
      f('link', link), f('anotações', notes),
      h('div', { class: 'row between' },
        rec && !d.metodo ? h('button', { class: 'btn ghost', type: 'button', onclick: async () => { if (await confirmSheet('Apagar música?', d.title, 'Apagar')) { await store.remove(rec.id); close(); } } }, 'apagar') : h('span'),
        h('button', { class: 'btn primary', type: 'button', onclick: save }, 'salvar')));
  }, { onClose: () => { if (String(playingId() || '').startsWith('sheet-')) stopBeat(); } });
}

function fiveSheet(pool) {
  sheet('Treino de 5', (close) => {
    const box = h('div', { class: 'sheet-body' });
    let five = R.pickFive(pool);
    const draw = () => box.replaceChildren(
      h('p', { class: 'muted' }, 'primeiro o que você está estudando, depois o que quer aprender. do mais lento pro mais rápido: aquece devagar.'),
      h('ol', { class: 'rp-five' }, ...five.map((r) => h('li', {}, playBtn(r, draw),
        h('span', { class: 'rp-t' }, h('strong', {}, r.data.title), h('small', {}, [r.data.artist, r.data.bpm && `${r.data.bpm} BPM`].filter(Boolean).join(' · '))),
        h('a', { class: 'link', href: R.listenUrl(r.data), target: '_blank', rel: 'noopener noreferrer' }, 'ouvir')))),
      h('div', { class: 'row between' }, h('button', { class: 'btn', type: 'button', onclick: () => { stopBeat(); five = R.pickFive(pool); draw(); } }, 'sortear de novo'),
        h('button', { class: 'btn primary', type: 'button', onclick: () => { stopBeat(); close(); } }, 'pronto')));
    draw(); return box;
  }, { onClose: stopBeat });
}

export function mount(host) {
  const st = { group: '', stage: null, q: '', by: 'lista' };
  const q = h('input', { type: 'search', placeholder: 'buscar música ou artista', 'aria-label': 'Buscar no repertório' });
  q.addEventListener('input', () => { st.q = q.value; draw(); });
  const sortSel = h('select', { 'aria-label': 'Ordenar' }, ...[['lista', 'ordem da lista'], ['bpm', 'por BPM'], ['nome', 'por nome']].map(([v, t]) => h('option', { value: v }, t)));
  sortSel.addEventListener('change', () => { st.by = sortSel.value; draw(); });
  const top = h('div'); const body = h('div');
  const row = (r) => h('li', { class: 'rp-row' }, playBtn(r, draw),
    h('button', { type: 'button', class: 'rp-t', onclick: () => songSheet(r) }, h('strong', {}, r.data.title),
      h('small', {}, [r.data.artist, r.data.bpm && `${r.data.bpm} BPM`].filter(Boolean).join(' · '))),
    h('button', { type: 'button', class: `rp-stage s-${r.data.stage || 'none'}`, 'aria-label': `Estágio de ${r.data.title}: ${R.stageLabel(r.data.stage)}. Toque pra mudar`,
      onclick: () => store.upsert('song', r.id, { stage: R.nextStage(r.data.stage) }) }, R.stageLabel(r.data.stage)));
  const draw = () => {
    const all = songs(); const groups = R.groupsOf(all); const p = R.progress(all);
    const shown = R.sortSongs(R.filterSongs(all, st), st.by);
    top.replaceChildren(
      all.length ? h('p', { class: 'pad-x rp-prog' }, h('strong', {}, String(p.toco)), ' já toco · ', h('strong', {}, String(p.estudando)), ' estudando · ', h('strong', {}, String(p.quero)), ` quero aprender · ${p.total} no total`) : null,
      h('div', { class: 'chips lib-tabs pad-x' }, ...[['', 'todas'], ...groups.map((g) => [g, g])].map(([g, t]) => h('button', { type: 'button', class: `lib-tab${st.group === g ? ' on' : ''}`, 'aria-pressed': String(st.group === g), onclick: () => { st.group = g; draw(); } }, t))),
      h('div', { class: 'chips lib-tabs pad-x' }, ...[[null, 'qualquer estágio'], ...R.STAGES.filter((s) => s.id).map((s) => [s.id, s.label])].map(([s, t]) => h('button', { type: 'button', class: `lib-tab${st.stage === s ? ' on' : ''}`, 'aria-pressed': String(st.stage === s), onclick: () => { st.stage = s; draw(); } }, t))));
    if (!all.length) { body.replaceChildren(h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhuma música ainda.'), h('p', { class: 'muted' }, 'as do método aparecem aqui quando sincronizar. dá pra adicionar as suas em “+ música”.'))); return; }
    if (!shown.length) { body.replaceChildren(h('p', { class: 'pad-x muted' }, 'nada com esse filtro.')); return; }
    if (st.by !== 'lista') { body.replaceChildren(h('section', { class: 'card pad' }, h('ul', { class: 'rp-list' }, ...shown.map(row)))); return; }
    body.replaceChildren(...R.groupsOf(shown).map((g) => {
      const items = shown.filter((r) => (r.data.group || 'Minhas músicas') === g);
      const gs = [...new Set(items.flatMap((r) => r.data.grooves || []))].map(grooveOf).filter(Boolean);
      return h('section', { class: 'card pad' }, h('h2', { class: 'tag' }, g, h('small', { class: 'muted' }, ` · ${items.length}`)),
        gs.length ? h('div', { class: 'rp-gmini' }, ...gs.map(mini)) : null,
        h('ul', { class: 'rp-list' }, ...items.map(row)));
    }));
  };
  host.append(banner('Repertório', 'tocar junto: o groove no BPM da música'),
    h('div', { class: 'row pad-x rp-actions' },
      h('button', { class: 'btn primary', type: 'button', onclick: () => songSheet(null) }, '+ música'),
      h('button', { class: 'btn', type: 'button', onclick: () => { const pool = R.filterSongs(songs(), st); if (!pool.length) { toast('nenhuma música nesse filtro'); return; } fiveSheet(pool); } }, 'treino de 5')),
    h('div', { class: 'row pad-x rp-search' }, q, sortSel), top, body,
    h('p', { class: 'pad-x lib-note' }, 'as músicas do método são privadas (só você vê). o groove é o padrão de estudo da aula, não a transcrição da gravação. toque no selo pra mudar o estágio.'));
  draw();
  const off = store.subscribe((i) => { if (!i.kind || i.kind === 'song' || i.kind === 'beat') draw(); });
  return () => { off(); stopBeat(); };
}
