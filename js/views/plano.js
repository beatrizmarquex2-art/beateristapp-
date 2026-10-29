// Plano de estudo: foco do dia, "montar meu treino de hoje" (4 blocos ligados às ferramentas, com cronômetro por bloco),
// diário de estudo (exercício, tempo, BPM limpo, dificuldade, próximo passo) e as dicas do Cronograma.
// Os textos do método (sugestão do dia, 30 dicas, como usar o metrônomo) vêm dos registros privados da Bia.
import { h, icon, todayKey } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import { banner, toast, stars, sheet } from '../ui.js';
import { PRESETS as RUDS } from '../rudiments.js';
import { DURATIONS, buildToday, week, elapsed } from '../plan.js';

const KEY = 'setting-plano';
const DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const conf = () => ({ total: 30, over: {}, favTips: [], ...(store.get(KEY) ? store.get(KEY).data : {}) });
const setConf = (p) => store.upsert('setting', KEY, p);
const weekdayOf = (key) => new Date(`${key}T12:00:00Z`).getUTCDay();
const mmss = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/** O que dá pra sortear: primeiro o método da Bia (se já está na conta), depois os prontos. */
function pool() {
  const met = store.list('rudiment').filter((r) => r.data.metodo).map((r) => ({ key: `mine:${r.id}`, name: r.data.name, hasKick: /b/i.test(r.data.stick) }));
  const pre = RUDS.map((p) => ({ key: `preset:${p.id}`, name: p.name, hasKick: /b/i.test(p.stick) }));
  const metBeats = store.list('beat').filter((r) => r.data.metodo && r.data.beat).map((r) => ({ key: `rec:${r.id}`, name: r.data.beat.name }));
  const preBeats = B.PRESETS.filter((p) => p.kind === 'groove' && B.levelOf(p) <= 2).map((p) => ({ key: `preset:${p.id}`, name: p.name }));
  return { rudiments: met.length ? [...met, ...pre.slice(0, 2)] : pre, beats: metBeats.length ? metBeats : preBeats };
}

/** Abre a ferramenta já com o exercício do bloco escolhido. */
async function openTool(tool) {
  const o = tool.open || {};
  if (o.rud) {
    const [kind, id] = o.rud.split(':'); let patch = { pick: o.rud, prog: !!o.prog };
    if (kind === 'preset') { const p = RUDS.find((x) => x.id === id); if (p) patch = { ...patch, stick: p.stick, sub: p.sub }; }
    if (kind === 'mine') { const r = store.get(id); if (r) patch = { ...patch, stick: r.data.stick, sub: r.data.sub }; }
    await store.upsert('setting', 'setting-rudimentos', patch);
  }
  if (o.beat) {
    const [kind, id] = o.beat.split(':');
    const beat = kind === 'preset' ? B.PRESETS.find((p) => p.id === id) : (store.get(id) || { data: {} }).data.beat;
    if (beat) await store.upsert('setting', 'setting-beatlab', { beat: B.clone(beat) });
  }
  if (o.comboBeat) { const cur = store.get('setting-beatlab'); await store.upsert('setting', 'setting-beatlab', { combo: { ...(cur && cur.data.combo), g: o.comboBeat } }); }
  location.hash = tool.href;
}

function logSheet(sess, plan) {
  const done = sess.blocks.filter((b) => b.done);
  const ran = Math.round(sess.blocks.reduce((s, b) => s + elapsed(b), 0) / 60000);
  const min = ran || plan.blocks.filter((b) => done.some((d) => d.key === b.key)).reduce((s, b) => s + b.min, 0) || plan.blocks.reduce((s, b) => s + b.min, 0);
  sheet('Diário de estudo', (close) => {
    const tec = plan.blocks.find((b) => b.key === 'tecnica');
    const ex = h('input', { type: 'text', maxlength: 120, value: tec ? tec.item : '', 'aria-label': 'Exercício' });
    const mins = h('input', { type: 'number', min: 1, max: 600, value: String(min), inputmode: 'numeric', 'aria-label': 'Minutos' });
    const bpm = h('input', { type: 'number', min: 30, max: 300, placeholder: 'ex.: 80', inputmode: 'numeric', 'aria-label': 'BPM limpo' });
    let diff = 'ok';
    const diffs = h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Dificuldade' });
    const drawDiff = () => diffs.replaceChildren(...[['facil', 'fácil'], ['ok', 'no ponto'], ['dificil', 'difícil']].map(([k, t]) => h('button', { type: 'button', class: `lib-tab${diff === k ? ' on' : ''}`, role: 'radio', 'aria-checked': String(diff === k), onclick: () => { diff = k; drawDiff(); } }, t)));
    drawDiff();
    const notes = h('textarea', { rows: 2, maxlength: 600, placeholder: 'o que percebi (vícios, onde travei…)', 'aria-label': 'Observações' });
    const next = h('input', { type: 'text', maxlength: 160, placeholder: 'ex.: subir pra 85 BPM, começar com a esquerda', 'aria-label': 'Próximo passo' });
    const save = async (e) => {
      const btn = e.currentTarget;
      await store.upsert('studylog', null, { day: todayKey(), at: Date.now(), min: Math.max(1, Number(mins.value) || min), exercise: ex.value.trim(), bpm: Number(bpm.value) || null, diff, notes: notes.value.trim(), next: next.value.trim(), focus: plan.focus, blocks: done.map((b) => b.key) });
      stars(btn); close(); toast('estudo registrado ✓ amanhã tem mais', { ms: 2200 });
    };
    return h('div', { class: 'sheet-body pl-log' },
      h('label', { class: 'field' }, h('span', {}, 'exercício principal'), ex),
      h('div', { class: 'row pl-two' }, h('label', { class: 'field' }, h('span', {}, 'minutos'), mins), h('label', { class: 'field' }, h('span', {}, 'BPM limpo'), bpm)),
      h('div', { class: 'field' }, h('span', {}, 'como foi'), diffs),
      h('label', { class: 'field' }, h('span', {}, 'observações'), notes),
      h('label', { class: 'field' }, h('span', {}, 'próximo passo'), next),
      h('button', { class: 'btn primary', type: 'button', onclick: save }, 'guardar no diário'));
  });
}

export function mount(host) {
  const body = h('div'); let tick = 0;
  const today = todayKey(); const wd = weekdayOf(today);
  const session = () => { const s = conf().sess; return s && s.day === today ? s : null; };
  const planOf = (c, s) => buildToday(wd, c.total, pool(), { seed: `${today}#${s ? s.roll || 0 : 0}`, over: c.over });
  const saveSess = (s) => setConf({ sess: s });

  const draw = () => {
    const c = conf(); const s = session(); const plan = planOf(c, s);
    const guide = store.list('studyguide').find((r) => r.data.weekday === wd);
    const metro = store.get('metodo-metronomo');
    const tips = store.list('tip').sort((a, b) => a.data.n - b.data.n);
    const doy = Math.floor((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${today.slice(0, 4)}-01-01T12:00:00Z`)) / 864e5);
    const tip = tips.length ? tips[doy % tips.length] : null;
    const logs = store.list('studylog');
    const wk = week(logs.map((r) => r.data), today, (l) => l.day);
    const maxMin = Math.max(30, ...wk.days.map((d) => d.min));

    const blocks = plan.blocks.map((b) => {
      const st = s && s.blocks.find((x) => x.key === b.key);
      const run = st && st.startedAt; const ms = st ? elapsed(st) : 0; const goal = b.min * 60000;
      const toggle = () => {
        const cur = session() || { day: today, roll: s ? s.roll : 0, blocks: plan.blocks.map((x) => ({ key: x.key, acc: 0, startedAt: null, done: false })) };
        // um bloco por vez: começar um pausa o outro
        cur.blocks = cur.blocks.map((x) => (x.key === b.key ? (x.startedAt ? { ...x, acc: elapsed(x), startedAt: null } : { ...x, startedAt: Date.now() }) : (x.startedAt ? { ...x, acc: elapsed(x), startedAt: null } : x)));
        saveSess(cur).then(draw);
      };
      const finish = () => {
        const cur = session() || { day: today, roll: 0, blocks: plan.blocks.map((x) => ({ key: x.key, acc: 0, startedAt: null, done: false })) };
        cur.blocks = cur.blocks.map((x) => (x.key === b.key ? { ...x, acc: elapsed(x), startedAt: null, done: !x.done } : x));
        saveSess(cur).then(draw);
      };
      return h('li', { class: `pl-block${st && st.done ? ' done' : ''}${run ? ' run' : ''}`, 'data-key': b.key },
        h('div', { class: 'pl-bh' }, h('b', {}, b.label), h('span', { class: 'pl-min' }, `${b.min} min`)),
        h('p', { class: 'pl-item' }, b.item),
        h('div', { class: 'pl-bar', 'aria-hidden': 'true' }, h('i', { style: { width: `${Math.min(100, (ms / goal) * 100)}%` } })),
        h('div', { class: 'row pl-act' },
          h('button', { class: `btn small${run ? ' primary' : ''}`, type: 'button', 'aria-label': `${run ? 'Pausar' : 'Começar'} ${b.label}`, onclick: toggle }, icon(run ? 'stop' : 'play', 14), h('span', { class: 'pl-clock', 'data-key': b.key }, ` ${mmss(ms)}`)),
          h('button', { class: 'btn small', type: 'button', onclick: () => openTool(b.tool) }, `${b.tool.label} ↗`),
          h('button', { class: `icon-btn pl-check${st && st.done ? ' on' : ''}`, type: 'button', 'aria-pressed': String(!!(st && st.done)), 'aria-label': `${b.label} concluído`, onclick: finish }, icon('check', 20))));
    });
    const allDone = s && s.blocks.every((x) => x.done);

    body.replaceChildren(...[
      h('section', { class: 'card pad pl-today' },
        h('p', { class: 'pl-day' }, `${DAYS[wd]} · foco do dia`), h('h2', { class: 'pl-focus' }, plan.focus),
        guide ? h('p', { class: 'pl-guide' }, guide.data.text) : null,
        guide ? h('small', { class: 'muted' }, `baseado no método Beaterista · ${guide.data.source}`) : null),
      h('section', { class: 'card pad' },
        h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, 'tempo de hoje'),
          h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Tempo de estudo' }, ...DURATIONS.map((m) => h('button', { type: 'button', class: `lib-tab${c.total === m ? ' on' : ''}`, role: 'radio', 'aria-checked': String(c.total === m), onclick: () => setConf({ total: m, over: {} }).then(draw) }, `${m}`)))),
        h('ol', { class: 'pl-blocks' }, ...blocks),
        h('div', { class: 'row pl-foot' },
          h('button', { class: 'btn ghost', type: 'button', onclick: () => { const cur = session(); saveSess({ day: today, roll: (cur ? cur.roll || 0 : 0) + 1, blocks: plan.blocks.map((x) => ({ key: x.key, acc: 0, startedAt: null, done: false })) }).then(draw); } }, 'trocar exercícios'),
          h('button', { class: `btn${allDone ? ' primary' : ''}`, type: 'button', onclick: () => logSheet(session() || { blocks: [] }, plan) }, allDone ? 'terminei! registrar no diário' : 'registrar no diário'))),
      h('section', { class: 'card pad pl-week' },
        h('div', { class: 'row between' }, h('h3', {}, 'sua semana'), h('small', { class: 'muted' }, wk.streak ? `${wk.streak} dia(s) seguido(s)` : 'bora começar a sequência')),
        h('div', { class: 'pl-bars', role: 'img', 'aria-label': `minutos por dia: ${wk.days.map((d) => `${DAYS[weekdayOf(d.key)]} ${d.min}`).join(', ')}` },
          ...wk.days.map((d) => h('div', { class: `pl-col${d.key === today ? ' today' : ''}` }, h('i', { style: { height: `${Math.round((d.min / maxMin) * 100)}%` } }), h('small', {}, DAYS[weekdayOf(d.key)].slice(0, 3)), h('b', {}, d.min ? String(d.min) : '')))),
        h('p', { class: 'muted pl-total' }, `${wk.total} min nos últimos 7 dias`),
        lastLogs(logs)),
      tip ? h('section', { class: 'card pad pl-tip' }, h('p', { class: 'pl-tip-n' }, `dica ${tip.data.n} de 30`), h('p', { class: 'pl-tip-t' }, tip.data.text), h('small', { class: 'muted' }, tip.data.source)) : null,
      tips.length ? h('details', { class: 'card pad pl-tips' }, h('summary', {}, 'as 30 dicas'), h('p', {}, h('a', { class: 'btn small', href: '#/dicas' }, '🎮 jogar com as dicas')),
        h('ol', {}, ...tips.map((t) => { const fav = c.favTips.includes(t.data.n); return h('li', { value: String(t.data.n) }, h('span', {}, t.data.text),
          h('button', { class: `icon-btn${fav ? ' on' : ''}`, type: 'button', 'aria-pressed': String(fav), 'aria-label': fav ? 'Tirar dos favoritos' : 'Favoritar dica', onclick: () => setConf({ favTips: fav ? c.favTips.filter((n) => n !== t.data.n) : [...c.favTips, t.data.n] }).then(draw) }, icon('star', 16))); }))) : null,
      metro ? h('details', { class: 'card pad pl-tips' }, h('summary', {}, metro.data.title), h('p', {}, metro.data.text), h('small', { class: 'muted' }, metro.data.source)) : null,
      h('p', { class: 'pad-x lib-note' }, 'o treino de hoje segue o formato do método: aquecimento, técnica, groove e aplicação (5 + 10 + 10 + 5 em 30 min, proporcional nos outros tempos). cada bloco abre a ferramenta já com o exercício. o cronômetro conta pelo relógio, então pode trocar de tela que ele não se perde.'),
    ].filter(Boolean));
  };
  const lastLogs = (logs) => {
    const recent = logs.sort((a, b) => b.data.at - a.data.at).slice(0, 3);
    if (!recent.length) return null;
    const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short' });
    return h('ul', { class: 'pl-logs' }, ...recent.map((r) => h('li', {}, h('b', {}, `${fmt.format(new Date(r.data.at))} · ${r.data.min} min`), r.data.exercise ? ` · ${r.data.exercise}` : '', r.data.bpm ? ` · ${r.data.bpm} BPM` : '', r.data.next ? h('small', { class: 'muted' }, `próximo: ${r.data.next}`) : null)));
  };
  // atualiza só os relógios (o tempo vem do carimbo de início, não deste intervalo)
  tick = setInterval(() => {
    const s = session(); if (!s) return;
    for (const b of s.blocks) if (b.startedAt) { const el = body.querySelector(`.pl-clock[data-key="${b.key}"]`); if (el) el.textContent = ` ${mmss(elapsed(b))}`; }
  }, 500);
  host.append(banner('Plano de Estudo', 'um pouco todo dia'), body);
  draw();
  const off = store.subscribe((i) => { if (['studylog', 'tip', 'studyguide', 'rudiment'].includes(i.kind) || !i.kind) draw(); });
  return () => { clearInterval(tick); off(); };
}
