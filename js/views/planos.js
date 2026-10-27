// Plano do Aluno: escolha o aluno, junte atividades do Beat Lab, rudimentos, partituras e treinos, defina BPM e meta,
// imprima em A4 (papel timbrado ou branco) e, na aula seguinte, marque o que ele conseguiu.
import { h, icon, todayKey } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { banner, toast, sheet, confirmSheet, stars } from '../ui.js';
import { PRESETS as RUDS } from '../rudiments.js';
import { downloadPdf, renderPages } from './plan-pdf.js';
import { sendCanvases } from '../send-folder.js';
import { TYPES, TREINOS, fromBeat, fromRudiment, fromPartitura, fromTreino, fromText, fullBar, copyFor, metaLine, progress } from '../studentplan.js';

const KIND = 'studentplan';
const ROW_IDS = B.ROWS.map((r) => r.id);
const students = () => store.list('student').filter((s) => s.data.active !== false).sort((a, b) => a.data.name.localeCompare(b.data.name, 'pt-BR'));
const dateBR = (k) => (k ? k.split('-').reverse().join('/') : '');
const field = (label, input) => h('label', { class: 'field' }, h('span', {}, label), input);

/** Partitura de um item (um SVG por compasso; rudimento ganha as letras embaixo). Só números nossos viram SVG. */
function itemScore(it, width = 340) {
  if (!it.bars || !it.bars.length) return null;
  const hasFeet = it.bars.some((b) => (b.rows.bd || []).some(Boolean) || (b.rows.hf || []).some(Boolean));
  return h('div', { class: 'sp-score' }, ...it.bars.map((b) => {
    const f = h('figure', { class: 'sp-bar' }); f.innerHTML = N.toSVG(N.layout(fullBar(b, ROW_IDS), { width, full: it.kind !== 'rud' || hasFeet }));
    if (b.stick) f.append(h('div', { class: 'rd-stick sp-stick', style: { gridTemplateColumns: `repeat(${b.steps}, 1fr)` } }, ...b.stick.map((s) => h('span', { class: /^[A-Z]$/.test(s) ? 'acc' : s.startsWith('(') ? 'ghost' : '' }, s.toUpperCase()))));
    return f;
  }));
}

/* ---------- escolher atividade ---------- */
function addSheet(onAdd) {
  sheet('Adicionar atividade', (close) => {
    let tab = 'beat'; const box = h('div', { class: 'sp-pick' }); const tabs = h('div', { class: 'chips lib-tabs', role: 'tablist' });
    const add = (it) => { onAdd(it); toast(`“${it.title}” entrou no plano ✓`, { ms: 1200, id: 'sp-add' }); };
    const row = (title, sub, fn) => h('li', {}, h('button', { type: 'button', class: 'sp-opt', onclick: fn }, h('b', {}, title), sub ? h('small', { class: 'muted' }, sub) : null, h('span', { class: 'sp-plus', 'aria-hidden': 'true' }, '+')));
    const draw = () => {
      tabs.replaceChildren(...[['beat', 'Beat Lab'], ['rud', 'Rudimentos'], ['partitura', 'Partituras'], ['treino', 'Treinos'], ['livre', 'Texto livre']].map(([k, t]) => h('button', { type: 'button', role: 'tab', class: `lib-tab${tab === k ? ' on' : ''}`, 'aria-selected': String(tab === k), onclick: () => { tab = k; draw(); } }, t)));
      if (tab === 'beat') {
        const met = store.list('beat').filter((r) => r.data.metodo && r.data.beat).sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
        const mine = store.list('beat').filter((r) => !r.data.metodo && r.data.beat);
        box.replaceChildren(h('ul', { class: 'sp-list' },
          ...met.map((r) => row(r.data.beat.name, `método · ${r.data.source || ''}`, () => add(fromBeat(r.data.beat, `baseado no método Beaterista · ${r.data.source || ''}`)))),
          ...mine.map((r) => row(r.data.beat.name, 'meu ritmo', () => add(fromBeat(r.data.beat)))),
          ...B.PRESETS.map((p) => row(p.name, `${p.style} · ${B.LEVELS[B.levelOf(p)]}`, () => add(fromBeat(p))))));
      } else if (tab === 'rud') {
        const met = store.list('rudiment').filter((r) => r.data.metodo).sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
        const mine = store.list('rudiment').filter((r) => !r.data.metodo);
        box.replaceChildren(h('ul', { class: 'sp-list' },
          ...met.map((r) => row(r.data.name, `método · p. ${r.data.page} · ${r.data.stick.toUpperCase()}`, () => add(fromRudiment(r.data.name, r.data.stick, r.data.sub, `baseado no método Beaterista · ${r.data.source}`)))),
          ...mine.map((r) => row(r.data.name, `meu · ${r.data.stick}`, () => add(fromRudiment(r.data.name, r.data.stick, r.data.sub)))),
          ...RUDS.map((p) => row(p.name, p.stick.toUpperCase(), () => add(fromRudiment(p.name, p.stick, p.sub))))));
      } else if (tab === 'partitura') {
        const docs = store.list('partitura').sort((a, b) => b.updated_at - a.updated_at);
        box.replaceChildren(docs.length ? h('ul', { class: 'sp-list' }, ...docs.map((r) => row(r.data.title, `${(r.data.bars || []).length} compassos · ${r.data.bpm} BPM`, () => add(fromPartitura(r.data, r.data.metodo ? `baseado no método Beaterista · ${r.data.source || ''}` : ''))))) : h('p', { class: 'muted' }, 'nenhuma partitura ainda. monte uma em Montar Partitura.'));
      } else if (tab === 'treino') {
        box.replaceChildren(h('ul', { class: 'sp-list' }, ...TREINOS.map(([k, t]) => row(t, '', () => add(fromTreino(k))))));
      } else {
        const t = h('input', { type: 'text', maxlength: 140, placeholder: 'ex.: ouvir “Back in Black” e marcar o bumbo', 'aria-label': 'Atividade' });
        box.replaceChildren(h('div', { class: 'bt-form' }, t, h('button', { class: 'btn primary', type: 'button', onclick: () => { if (!t.value.trim()) return; add(fromText(t.value)); t.value = ''; } }, '+ adicionar')));
      }
    };
    draw();
    return h('div', { class: 'sheet-body' }, tabs, box, h('button', { class: 'btn', type: 'button', onclick: close }, 'pronto'));
  });
}

/* ---------- impressão A4 ---------- */
function printPlan(p) {
  const paper = p.paper || 'timbrado';
  const items = p.items.map((it, i) => h('section', { class: 'sp-p-item' },
    h('h3', {}, `${i + 1}. ${it.title}`),
    metaLine(it) ? h('p', { class: 'sp-p-meta' }, metaLine(it)) : null,
    itemScore(it, 360),
    it.note ? h('p', { class: 'sp-p-note' }, it.note) : null,
    it.src ? h('p', { class: 'sp-p-src' }, it.src) : null,
    h('p', { class: 'sp-p-check' }, '☐ consegui    BPM: ______    data: ___/___')));
  const doc = h('div', { class: `sp-print paper-${paper}` },
    paper === 'timbrado' ? h('img', { class: 'sp-paper', src: 'assets/papel-timbrado.png', alt: '' }) : null,
    // thead/tfoot repetem em cada página: deixam livre o topo e o rodapé do papel timbrado
    h('table', { class: 'sp-p-table' },
      h('thead', {}, h('tr', {}, h('td', {}, h('div', { class: 'sp-p-top' })))),
      h('tfoot', {}, h('tr', {}, h('td', {}, h('div', { class: 'sp-p-bot' })))),
      h('tbody', {}, h('tr', {}, h('td', {},
        h('header', { class: 'sp-p-head' }, h('h1', {}, p.title || 'Plano de estudo'),
          h('p', {}, h('b', {}, p.studentName || ''), ` · ${(TYPES.find((t) => t[0] === p.type) || TYPES[0])[1]}${p.start ? ` · a partir de ${dateBR(p.start)}` : ''}`),
          p.goal ? h('p', { class: 'sp-p-goal' }, h('b', {}, 'objetivo: '), p.goal) : null),
        ...items,
        p.notes ? h('p', { class: 'sp-p-note' }, p.notes) : null)))));
  document.body.append(doc); document.documentElement.classList.add('printing-sp');
  const done = () => { doc.remove(); document.documentElement.classList.remove('printing-sp'); removeEventListener('afterprint', done); };
  addEventListener('afterprint', done);
  const go = () => { try { window.print(); } catch { toast('este aparelho não abriu a impressão.'); done(); } };
  const img = doc.querySelector('img'); if (img && !img.complete) { img.onload = go; img.onerror = go; } else go();
  setTimeout(() => { if (doc.isConnected && !matchMedia('print').matches) done(); }, 60000);
}

/* ---------- editor ---------- */
function mountEdit(host, id) {
  if (!store.get(id)) { host.append(banner('Plano do Aluno'), h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'plano não encontrado.'), h('a', { class: 'btn primary', href: '#/planos' }, 'ver planos'))); return () => {}; }
  const body = h('div');
  const P = () => store.get(id).data;
  const save = (patch) => store.upsert(KIND, id, patch);
  const setItem = (iid, patch) => save({ items: P().items.map((x) => (x.id === iid ? { ...x, ...patch } : x)) });
  const draw = () => {
    const p = P(); const pr = progress(p); const sts = students();
    const num = (it, k, label) => { const i = h('input', { type: 'number', min: 20, max: 300, inputmode: 'numeric', value: it[k] || '', placeholder: '—', 'aria-label': `${label}: ${it.title}` }); i.addEventListener('change', () => setItem(it.id, { [k]: Number(i.value) || null })); return h('label', { class: 'sp-num' }, h('span', {}, label), i); };
    const txt = (it, k, label, ph) => { const i = h('input', { type: 'text', maxlength: 160, value: it[k] || '', placeholder: ph, 'aria-label': `${label}: ${it.title}` }); i.addEventListener('change', () => setItem(it.id, { [k]: i.value.trim() })); return i; };
    // mover e tirar usam sempre a versão salva (com o que acabou de ser digitado)
    const move = (i, d) => { const items = P().items.slice(); const j = i + d; if (j < 0 || j >= items.length) return; [items[i], items[j]] = [items[j], items[i]]; save({ items }); };
    const title = h('input', { type: 'text', maxlength: 80, value: p.title || '', 'aria-label': 'Título do plano' }); title.addEventListener('change', () => save({ title: title.value.trim() || 'Plano de estudo' }));
    const goal = h('textarea', { rows: 2, maxlength: 400, placeholder: 'ex.: tocar o Rock 2 com a virada sem acelerar', 'aria-label': 'Objetivo' }); goal.value = p.goal || ''; goal.addEventListener('change', () => save({ goal: goal.value.trim() }));
    const start = h('input', { type: 'date', value: p.start || todayKey(), 'aria-label': 'Começa em' }); start.addEventListener('change', () => save({ start: start.value }));
    const notes = h('textarea', { rows: 2, maxlength: 600, placeholder: 'recado pro aluno (vai no PDF)', 'aria-label': 'Recado' }); notes.value = p.notes || ''; notes.addEventListener('change', () => save({ notes: notes.value.trim() }));
    body.replaceChildren(
      h('div', { class: 'row between pad-x ar-top' }, h('a', { class: 'btn small ghost', href: '#/planos' }, '‹ planos'), p.studentId ? h('a', { class: 'btn small ghost', href: `#/beaterista/aluno/${p.studentId}` }, `ficha de ${p.studentName || 'aluno'} ›`) : h('span')),
      h('section', { class: 'card pad sp-head' },
        field('título', title),
        field('aluno', h('select', { 'aria-label': 'Aluno', onchange: (e) => { const s = store.get(e.target.value); save({ studentId: s ? s.id : null, studentName: s ? s.data.name : '' }); } },
          h('option', { value: '' }, '— escolher —'), ...sts.map((s) => h('option', { value: s.id, selected: s.id === p.studentId }, s.data.name)))),
        h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Tipo de plano' }, ...TYPES.map(([k, t]) => h('button', { type: 'button', class: `lib-tab${(p.type || 'semana') === k ? ' on' : ''}`, role: 'radio', 'aria-checked': String((p.type || 'semana') === k), onclick: () => save({ type: k }) }, t))),
        field('começa em', start), field('objetivo', goal)),
      h('section', { class: 'card pad' },
        h('div', { class: 'row between' }, h('h3', { class: 'sp-h' }, `atividades (${p.items.length})`), pr.n ? h('small', { class: 'muted' }, `${pr.d}/${pr.n} conseguiu`) : null),
        p.items.length ? h('ol', { class: 'sp-items' }, ...p.items.map((it, i) => h('li', { class: `sp-item${it.done ? ' done' : ''}` },
          h('div', { class: 'row between sp-ih' }, h('b', {}, it.title),
            h('div', { class: 'row sp-tools' },
              h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Subir ${it.title}`, onclick: () => move(i, -1), disabled: i === 0 }, icon('up', 16)),
              h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Descer ${it.title}`, onclick: () => move(i, 1), disabled: i === p.items.length - 1 }, icon('down', 16)),
              h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Tirar ${it.title}`, onclick: () => save({ items: P().items.filter((x) => x.id !== it.id) }) }, icon('trash', 16)))),
          it.src ? h('small', { class: 'rd-src' }, it.src) : null,
          itemScore(it),
          h('div', { class: 'row sp-nums' }, it.kind === 'treino' || it.kind === 'livre' ? null : num(it, 'bpm', 'BPM'), num(it, 'target', 'meta'), txt(it, 'freq', 'Frequência', 'ex.: 10 min por dia')),
          txt(it, 'note', 'Observação', 'observação (vai no PDF)'),
          h('div', { class: 'row sp-review' },
            h('button', { class: `btn small${it.done ? ' st-paid' : ''}`, type: 'button', 'aria-pressed': String(!!it.done), onclick: (e) => { if (!it.done) stars(e.currentTarget); setItem(it.id, { done: !it.done }); } }, it.done ? 'conseguiu ✓' : 'marcar: conseguiu'),
            num(it, 'reached', 'chegou a'))))) : h('p', { class: 'muted' }, 'nenhuma atividade ainda.'),
        h('button', { class: 'btn primary sp-add', type: 'button', onclick: () => addSheet((it) => save({ items: [...P().items, it] })) }, icon('plus', 16), ' adicionar atividade'),
        field('recado', notes)),
      h('section', { class: 'card pad sp-out' },
        h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, 'papel'),
          h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Papel' }, ...[['timbrado', 'timbrado Beaterista'], ['branco', 'branco']].map(([k, t]) => h('button', { type: 'button', class: `lib-tab${(p.paper || 'timbrado') === k ? ' on' : ''}`, role: 'radio', 'aria-checked': String((p.paper || 'timbrado') === k), onclick: () => save({ paper: k }) }, t)))),
        h('div', { class: 'row sp-actions' },
          h('button', { class: 'btn primary', type: 'button', onclick: async (e) => {
            if (!p.items.length) { toast('adiciona pelo menos uma atividade'); return; }
            const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'gerando…';
            try { const r = await downloadPdf(P()); toast(r.shared ? 'PDF pronto ✓' : `baixado: ${r.name} ✓`, { ms: 2200 }); } catch { toast('não consegui gerar o PDF aqui. tenta “imprimir”.'); }
            btn.disabled = false; btn.textContent = 'baixar PDF';
          } }, 'baixar PDF'),
          h('button', { class: 'btn', type: 'button', onclick: () => { if (!p.items.length) { toast('adiciona pelo menos uma atividade'); return; } printPlan(P()); } }, 'imprimir'),
          h('button', { class: 'btn', type: 'button', onclick: async (e) => { if (!p.items.length) { toast('adiciona pelo menos uma atividade'); return; } const btn = e.currentTarget; btn.disabled = true; try { const pl = P(); await sendCanvases(await renderPages(pl), `${pl.title || 'Plano'}${pl.studentName ? ` - ${pl.studentName}` : ''}`); } catch { toast('não consegui enviar pra pasta.'); } btn.disabled = false; } }, '📁 enviar pra pasta'),
          h('button', { class: 'btn', type: 'button', onclick: () => sheet('Copiar pra outro aluno', (close) => h('div', { class: 'sheet-body' }, h('ul', { class: 'sp-list' }, ...students().filter((s) => s.id !== p.studentId).map((s) => h('li', {}, h('button', { type: 'button', class: 'sp-opt', onclick: async () => { const rec = await store.upsert(KIND, null, copyFor(P(), { id: s.id, name: s.data.name })); close(); toast(`copiado pra ${s.data.name} ✓`); location.hash = `#/planos/${rec.id}`; } }, h('b', {}, s.data.name))))))) }, 'copiar pra outro aluno'),
          h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: async () => { if (await confirmSheet('Apagar plano?', p.title, 'Apagar')) { await store.remove(id); location.hash = '#/planos'; } } }, 'apagar'))));
  };
  host.append(banner('Plano do Aluno', 'tarefa de casa no papel'), body);
  draw();
  // só redesenha quando muda a estrutura (itens, ordem, conseguiu, papel, tipo, aluno). campos digitados não redesenham,
  // senão o foco pula no meio do preenchimento
  const sig = () => { const r = store.get(id); if (!r) return ''; const d = r.data; return JSON.stringify([d.items.map((x) => [x.id, !!x.done]), d.paper, d.type, d.studentId]); };
  let last = sig();
  return store.subscribe((i) => { if ((i.id === id || !i.kind) && sig() !== last) { last = sig(); draw(); } });
}

export async function newPlan(student) {
  const rec = await store.upsert(KIND, null, { title: 'Plano de estudo', studentId: student ? student.id : null, studentName: student ? student.data.name : '', type: 'semana', start: todayKey(), goal: '', items: [], notes: '', paper: 'timbrado', created: Date.now() });
  location.hash = `#/planos/${rec.id}`;
}

/** Lista curta pra ficha do aluno. */
export function studentPlans(st) {
  const list = store.list(KIND).filter((r) => r.data.studentId === st.id).sort((a, b) => (b.data.created || 0) - (a.data.created || 0));
  return h('section', { class: 'card pad' }, h('div', { class: 'row between' }, h('h2', { class: 'tag' }, 'planos de estudo'), h('button', { class: 'btn small', type: 'button', onclick: () => newPlan(st) }, '+ novo plano')),
    list.length ? h('ul', { class: 'sp-mini' }, ...list.slice(0, 4).map((r) => { const pr = progress(r.data); return h('li', {}, h('a', { href: `#/planos/${r.id}` }, h('b', {}, r.data.title), h('small', { class: 'muted' }, ` · ${dateBR(r.data.start)} · ${pr.d}/${pr.n} conseguiu`))); })) : h('p', { class: 'muted' }, 'nenhum plano ainda.'));
}

function mountList(host) {
  const body = h('div'); let f = '';
  const draw = () => {
    const all = store.list(KIND).sort((a, b) => (b.data.created || 0) - (a.data.created || 0)).filter((r) => !f || r.data.studentId === f);
    const sts = students();
    body.replaceChildren(
      h('div', { class: 'pad-x' }, h('button', { class: 'btn primary ar-add', type: 'button', onclick: () => newPlan(f ? store.get(f) : null) }, icon('plus', 18), ' novo plano')),
      sts.length ? h('div', { class: 'pad-x' }, h('select', { 'aria-label': 'Filtrar por aluno', onchange: (e) => { f = e.target.value; draw(); } }, h('option', { value: '' }, 'todos os alunos'), ...sts.map((s) => h('option', { value: s.id, selected: s.id === f }, s.data.name)))) : null,
      all.length ? h('ul', { class: 'ar-list sp-all' }, ...all.map((r) => { const pr = progress(r.data); return h('li', { class: 'ar-file' }, h('a', { class: 'ar-open', href: `#/planos/${r.id}` },
        h('span', { class: 'ar-ico' }, icon('study', 20)), h('span', { class: 'ar-name' }, h('b', {}, `${r.data.studentName || 'sem aluno'} · ${r.data.title}`), h('small', { class: 'muted' }, `${(TYPES.find((t) => t[0] === r.data.type) || TYPES[0])[1]} · ${dateBR(r.data.start)} · ${pr.n} atividade(s)${pr.d ? ` · ${pr.d} ✓` : ''}`)))); }))
        : h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhum plano ainda.'), h('p', { class: 'muted' }, 'crie um, escolha o aluno e junte ritmos, rudimentos, partituras e treinos.')));
  };
  host.append(banner('Planos dos Alunos', 'tarefa de casa no papel'), body);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === KIND || i.kind === 'student') draw(); });
}

export function mount(host, parts = []) { return parts[0] ? mountEdit(host, parts[0]) : mountList(host); }
