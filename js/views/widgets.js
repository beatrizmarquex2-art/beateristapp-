// Widgets do início: pedaços pequenos de outras telas do app. A Bea liga, desliga e reordena em "Personalizar".
import { h } from '../util.js';
import * as store from '../store.js';
import * as lib from '../lib.js';
import * as M from '../music.js';
import * as S from '../students-logic.js';
import { audio, click, scheduler } from '../audio.js';
import { weekStats, bars, WD_LETTER } from '../charts.js';
import { todayKey, weekdayOf } from '../util.js';

const box = (cls, title, href, linkText) => {
  const el = h('section', { class: `card pad widget ${cls}` });
  el.head = h('div', { class: 'row between' }, h('h2', { class: 'tag' }, title), href ? h('a', { class: 'link', href }, linkText) : null);
  return el;
};

export function studyWidget() {
  const el = box('w-study', 'estudar', '#/estudos', 'biblioteca');
  let pickSlug = '';
  // sorteia um texto que a Bea ainda não abriu (se já abriu todos, vale qualquer um), diferente do que está na tela
  const sortear = () => {
    const seen = new Set(lib.allStates().filter((x) => x.lastRead).map((x) => x.slug));
    const all = lib.items(); let pool = all.filter((a) => !seen.has(a.slug) && a.slug !== pickSlug);
    if (!pool.length) pool = all.filter((a) => a.slug !== pickSlug);
    pickSlug = pool.length ? pool[Math.floor(Math.random() * pool.length)].slug : '';
  };
  const draw = () => {
    // o que a Bea começou e não terminou, com a barrinha (os 3 mais recentes) + um sorteio de tema novo
    const rows = lib.allStates().filter((x) => x.lastRead && !x.done).sort((x, y) => y.lastRead - x.lastRead)
      .map((x) => [x, lib.bySlug(x.slug)]).filter(([, art]) => art).slice(0, 3);
    if (!pickSlug || !lib.bySlug(pickSlug)) sortear();
    const pk = lib.bySlug(pickSlug);
    el.replaceChildren(el.head, ...rows.map(([x, art]) => { const pct = Math.round((x.progress || 0) * 100); return h('a', { class: 'w-line w-study-row', href: `#/estudos/a/${art.slug}` }, h('strong', {}, art.title), h('span', { class: 'w-study-pct' }, `${pct}%`), h('span', { class: 'lib-bar' }, h('i', { style: { width: `${pct}%` } }))); }),
      pk ? h('div', { class: 'w-pick' },
        h('a', { class: 'w-pick-link', href: `#/estudos/a/${pk.slug}` }, h('small', {}, 'sorteado pra você'), h('strong', {}, pk.title)),
        h('button', { class: 'w-dice', type: 'button', 'aria-label': 'Sortear outro tema', title: 'sortear outro', onclick: () => { sortear(); draw(); } }, '🎲'))
        : h('a', { class: 'w-line', href: '#/estudos' }, h('strong', {}, 'abrir a biblioteca')));
  };
  draw(); lib.loadIndex().then(draw).catch(() => {});
  el.unsub = store.subscribe((i) => { if (!i.kind || i.kind === 'study') draw(); });
  return el;
}

export function metroWidget() {
  const el = box('w-metro', 'metrônomo', '#/metronomo', 'completo');
  const cfg = () => ({ bpm: 80, meter: '4/4', ...(store.get('setting-metronome') ? store.get('setting-metronome').data : {}) });
  let run = null;
  const bpm = h('output', { class: 'w-bpm' }, String(cfg().bpm));
  const set = (d) => { const b = M.clampBpm(cfg().bpm + d); store.upsert('setting', 'setting-metronome', { ...cfg(), bpm: b }); bpm.textContent = b; if (run) { stop(); start(); } };
  const play = h('button', { class: 'met-play w-play', type: 'button', 'aria-label': 'Tocar metrônomo' }, '▶');
  function start() {
    audio(); const c = cfg(); const cl = M.meterClicks(c.meter, 1, true);
    run = scheduler((i) => ({ at: i * M.pulseSec(c.bpm, c.meter), play: (t) => click(t, cl[i % cl.length].level) }));
    play.textContent = '■'; play.setAttribute('aria-label', 'Parar metrônomo');
  }
  function stop() { run && run.stop(); run = null; play.textContent = '▶'; play.setAttribute('aria-label', 'Tocar metrônomo'); }
  play.addEventListener('click', () => (run ? stop() : start()));
  el.append(el.head, h('div', { class: 'row between' },
    h('button', { class: 'btn small', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => set(-5) }, '−5'), h('span', { class: 'w-read' }, bpm, h('small', {}, ' BPM')),
    h('button', { class: 'btn small', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => set(5) }, '+5'), play));
  el.unsub = () => stop();
  return el;
}

export function focusWidget() {
  const el = box('w-focus', 'foco', '#/foco', 'abrir');
  const face = h('strong', { class: 'w-bpm' });
  let raf = 0;
  const tick = () => {
    const t = store.get('setting-focus') ? store.get('setting-focus').data : { duration: 25 * 60000, accumulated: 0, startedAt: null };
    const s = S.timerState(t, Date.now()); face.textContent = S.fmtClock(s.remaining); face.dataset.running = s.running ? '1' : '';
    raf = requestAnimationFrame(tick);
  };
  el.append(el.head, h('a', { class: 'w-line', href: '#/foco' }, face, h('small', {}, 'toque para começar um bloco')));
  tick();
  el.unsub = () => cancelAnimationFrame(raf);
  return el;
}

/** Sua semana: aulas dadas por dia (barras), faltas e minutos de estudo. */
export function weekWidget() {
  const el = box('w-week', 'sua semana', '#/beaterista', 'alunos');
  const draw = () => {
    const st = weekStats(store.list('lesson'), store.list('practice'));
    const today = todayKey();
    el.replaceChildren(el.head,
      h('div', { class: 'w-tiles' },
        h('div', { class: 'w-tile' }, h('b', {}, String(st.aulas)), h('small', {}, st.aulas === 1 ? 'aula dada' : 'aulas dadas')),
        h('div', { class: 'w-tile' }, h('b', {}, String(st.faltas)), h('small', {}, st.faltas === 1 ? 'falta' : 'faltas')),
        h('div', { class: 'w-tile' }, h('b', {}, String(st.min)), h('small', {}, 'min de estudo'))),
      bars(st.days.map((d) => ({ label: WD_LETTER[weekdayOf(d.key)], value: d.aulas, strong: d.key === today,
        title: `${d.key.split('-').reverse().slice(0, 2).join('/')}: ${d.aulas} aula${d.aulas === 1 ? '' : 's'} dada${d.aulas === 1 ? '' : 's'}${d.faltas ? `, ${d.faltas} falta${d.faltas === 1 ? '' : 's'}` : ''}${d.min ? `, ${d.min} min de estudo` : ''}` })), { label: 'Aulas dadas em cada dia desta semana' }),
      h('p', { class: 'w-cap' }, 'barras: aulas com presença marcada, de segunda a domingo.'));
  };
  draw();
  el.unsub = store.subscribe((i) => { if (!i.kind || ['lesson', 'practice'].includes(i.kind)) draw(); });
  return el;
}
