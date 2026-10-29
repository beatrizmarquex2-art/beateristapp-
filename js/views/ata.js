// Ata de reunião: registra a conversa/aula com o aluno, junta rudimentos e ritmos do Beat Lab direto daqui
// e monta tudo num PDF timbrado pra mandar pro aluno. Reaproveita o seletor de atividades e o PDF do Plano do Aluno.
import { h, icon, todayKey } from '../util.js';
import * as store from '../store.js';
import { banner, toast, confirmSheet } from '../ui.js';
import { addSheet, itemScore } from './planos.js';
import { downloadPdf, renderPages } from './plan-pdf.js';
import { sendCanvases } from '../send-folder.js';
import { metaLine } from '../studentplan.js';

const KIND = 'ata';
const students = () => store.list('student').filter((s) => s.data.active !== false).sort((a, b) => a.data.name.localeCompare(b.data.name, 'pt-BR'));
const dateBR = (k) => (k ? k.split('-').reverse().join('/') : '');
const field = (label, input) => h('label', { class: 'field' }, h('span', {}, label), input);
const DEFAULT_SECTIONS = [
  ['pauta', 'Pauta da reunião'], ['trabalhado', 'O que foi trabalhado'], ['combinados', 'Combinados e próximos passos'], ['obs', 'Observações'],
].map(([id, title]) => ({ id, title, text: '', on: true }));

/** A ata no formato que o PDF do plano entende. */
export function ataToPlan(d) {
  const who = [d.studentName, d.who].filter(Boolean).join(' · ');
  return { title: d.title || 'Ata de reunião', studentName: d.studentName || '', date: d.date, paper: d.paper || 'timbrado', noCheck: true,
    subtitle: [dateBR(d.date), who, d.place].filter(Boolean).join(' · '),
    sections: (d.sections || []).filter((s) => s.on !== false).map((s) => ({ title: s.title, text: s.text })),
    items: d.items || [], notes: '' };
}

export async function newAta(student) {
  const rec = await store.upsert(KIND, null, { title: 'Ata de reunião', date: todayKey(), studentId: student ? student.id : null, studentName: student ? student.data.name : '', who: '', place: '', sections: DEFAULT_SECTIONS.map((s) => ({ ...s })), items: [], paper: 'timbrado', created: Date.now() });
  location.hash = `#/ata/${rec.id}`;
}

function mountEdit(host, id) {
  if (!store.get(id)) { host.append(banner('Ata de reunião'), h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'ata não encontrada.'), h('a', { class: 'btn primary', href: '#/ata' }, 'ver atas'))); return () => {}; }
  const body = h('div', { class: 'ata-form pad-x' });
  const D = () => store.get(id).data;
  const save = (patch) => store.upsert(KIND, id, patch);
  const setItem = (iid, patch) => save({ items: D().items.map((x) => (x.id === iid ? { ...x, ...patch } : x)) });
  const empty = () => { if (!D().items.length && !(D().sections || []).some((s) => s.on !== false && (s.text || '').trim())) { toast('escreve alguma coisa ou adiciona uma atividade'); return true; } return false; };
  const draw = () => {
    const d = D(); const sts = students();
    const title = h('input', { type: 'text', maxlength: 80, value: d.title || '', 'aria-label': 'Título da ata' }); title.addEventListener('change', () => save({ title: title.value.trim() || 'Ata de reunião' }));
    const date = h('input', { type: 'date', value: d.date || todayKey(), 'aria-label': 'Data' }); date.addEventListener('change', () => save({ date: date.value }));
    const who = h('input', { type: 'text', maxlength: 120, value: d.who || '', placeholder: 'ex.: Bea e a mãe do aluno', 'aria-label': 'Quem participou' }); who.addEventListener('change', () => save({ who: who.value.trim() }));
    const place = h('input', { type: 'text', maxlength: 80, value: d.place || '', placeholder: 'ex.: aula presencial / online', 'aria-label': 'Onde' }); place.addEventListener('change', () => save({ place: place.value.trim() }));
    const secs = (d.sections || []).map((s) => {
      const t = h('textarea', { rows: 3, maxlength: 3000, placeholder: `${s.title}…`, 'aria-label': s.title }); t.value = s.text || '';
      t.addEventListener('change', () => save({ sections: D().sections.map((x) => (x.id === s.id ? { ...x, text: t.value } : x)) }));
      const on = h('input', { type: 'checkbox', checked: s.on !== false, 'aria-label': `Incluir “${s.title}” no PDF` }); on.addEventListener('change', () => save({ sections: D().sections.map((x) => (x.id === s.id ? { ...x, on: on.checked } : x)) }));
      const ti = h('input', { type: 'text', maxlength: 60, value: s.title, 'aria-label': 'Título do bloco' }); ti.addEventListener('change', () => save({ sections: D().sections.map((x) => (x.id === s.id ? { ...x, title: ti.value.trim() || s.title } : x)) }));
      return h('section', { class: 'card pad ata-sec' }, h('div', { class: 'rel-head' }, on, ti), t);
    });
    const move = (i, dir) => { const items = D().items.slice(); const j = i + dir; if (j < 0 || j >= items.length) return; [items[i], items[j]] = [items[j], items[i]]; save({ items }); };
    const bpm = (it) => { const i = h('input', { type: 'number', min: 20, max: 300, inputmode: 'numeric', value: it.bpm || '', placeholder: 'BPM', 'aria-label': `BPM: ${it.title}` }); i.addEventListener('change', () => setItem(it.id, { bpm: Number(i.value) || null })); return i; };
    const note = (it) => { const i = h('input', { type: 'text', maxlength: 160, value: it.note || '', placeholder: 'observação (vai no PDF)', 'aria-label': `Observação: ${it.title}` }); i.addEventListener('change', () => setItem(it.id, { note: i.value.trim() })); return i; };
    const items = D().items;
    body.replaceChildren(
      h('div', { class: 'row between ata-top' }, h('a', { class: 'btn small ghost', href: '#/ata' }, '‹ atas'), d.studentId ? h('a', { class: 'btn small ghost', href: `#/beaterista/aluno/${d.studentId}` }, `ficha de ${d.studentName || 'aluno'} ›`) : null),
      h('section', { class: 'card pad ata-sec' },
        field('título', title), field('data', date),
        field('aluno', h('select', { 'aria-label': 'Aluno', onchange: (e) => { const s = store.get(e.target.value); save({ studentId: s ? s.id : null, studentName: s ? s.data.name : '' }); } },
          h('option', { value: '' }, '— escolher —'), ...sts.map((s) => h('option', { value: s.id, selected: s.id === d.studentId }, s.data.name)))),
        field('quem participou', who), field('onde', place)),
      ...secs,
      h('section', { class: 'card pad ata-sec' },
        h('div', { class: 'row between' }, h('h3', { class: 'sp-h' }, `rudimentos e ritmos (${items.length})`)),
        items.length ? h('ul', { class: 'ata-items' }, ...items.map((it, i) => h('li', { class: 'ata-item' },
          h('div', { class: 'row between sp-ih' }, h('b', {}, it.title),
            h('div', { class: 'row sp-tools' },
              h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Subir ${it.title}`, onclick: () => move(i, -1), disabled: i === 0 }, icon('up', 16)),
              h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Descer ${it.title}`, onclick: () => move(i, 1), disabled: i === items.length - 1 }, icon('down', 16)),
              h('button', { class: 'icon-btn', type: 'button', 'aria-label': `Tirar ${it.title}`, onclick: () => save({ items: D().items.filter((x) => x.id !== it.id) }) }, icon('trash', 16)))),
          itemScore(it), metaLine(it) ? h('small', { class: 'muted' }, metaLine(it)) : null,
          h('div', { class: 'row sp-nums' }, it.kind === 'treino' || it.kind === 'livre' ? null : bpm(it), note(it))))) : h('p', { class: 'muted' }, 'nenhum ainda. adicione um rudimento ou um ritmo do Beat Lab.'),
        h('button', { class: 'btn primary sp-add', type: 'button', onclick: () => addSheet((it) => save({ items: [...D().items, it] }), { tabs: ['rud', 'beat', 'partitura', 'livre'], title: 'Adicionar à ata' }) }, icon('plus', 16), ' rudimento ou ritmo')),
      h('section', { class: 'card pad ata-sec' },
        h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, 'papel'),
          h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Papel' }, ...[['timbrado', 'timbrado Beaterista'], ['branco', 'branco']].map(([k, t]) => h('button', { type: 'button', class: `lib-tab${(d.paper || 'timbrado') === k ? ' on' : ''}`, role: 'radio', 'aria-checked': String((d.paper || 'timbrado') === k), onclick: () => save({ paper: k }) }, t)))),
        h('div', { class: 'ata-out' },
          h('button', { class: 'btn primary', type: 'button', onclick: async (e) => {
            if (empty()) return; const b = e.currentTarget; b.disabled = true; b.textContent = 'gerando…';
            try { const r = await downloadPdf(ataToPlan(D())); toast(r.shared ? 'PDF pronto ✓' : `baixado: ${r.name} ✓`, { ms: 2200 }); } catch { toast('não consegui gerar o PDF aqui.'); }
            b.disabled = false; b.textContent = 'baixar / enviar PDF';
          } }, 'baixar / enviar PDF'),
          h('button', { class: 'btn', type: 'button', onclick: async (e) => { if (empty()) return; const b = e.currentTarget; b.disabled = true; try { const p = ataToPlan(D()); await sendCanvases(await renderPages(p), `${p.title} - ${p.studentName || ''}`.trim()); } catch { toast('não consegui guardar agora.'); } b.disabled = false; } }, 'guardar na pasta'),
          h('button', { class: 'btn ghost danger-txt', type: 'button', onclick: async () => { if (await confirmSheet('Apagar ata?', d.title, 'Apagar')) { await store.remove(id); location.hash = '#/ata'; } } }, 'apagar'))));
  };
  host.append(banner('Ata de reunião', 'registra, junta exercícios e manda em PDF'), body);
  draw();
  // só redesenha quando a estrutura muda (campos de texto não, senão o foco pula)
  const sig = () => { const r = store.get(id); if (!r) return ''; const d = r.data; return JSON.stringify([(d.items || []).map((x) => x.id), d.paper, d.studentId, (d.sections || []).map((s) => [s.id, s.on])]); };
  let last = sig();
  return store.subscribe((i) => { if ((i.id === id || !i.kind) && sig() !== last) { last = sig(); draw(); } });
}

function mountList(host) {
  const body = h('div');
  const draw = () => {
    const all = store.list(KIND).sort((a, b) => (b.data.date || '').localeCompare(a.data.date || '') || (b.data.created || 0) - (a.data.created || 0));
    body.replaceChildren(
      h('div', { class: 'pad-x' }, h('button', { class: 'btn primary ar-add', type: 'button', onclick: () => newAta(null) }, icon('plus', 18), ' nova ata')),
      all.length ? h('ul', { class: 'ar-list sp-all' }, ...all.map((r) => h('li', { class: 'ar-file' }, h('a', { class: 'ar-open', href: `#/ata/${r.id}` },
        h('span', { class: 'ar-ico' }, icon('note', 20)), h('span', { class: 'ar-name' }, h('b', {}, `${r.data.studentName || 'sem aluno'} · ${r.data.title}`), h('small', { class: 'muted' }, `${dateBR(r.data.date)} · ${(r.data.items || []).length} exercício(s)`)))))) 
        : h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'nenhuma ata ainda.'), h('p', { class: 'muted' }, 'crie uma, anote a reunião, junte rudimentos e ritmos do Beat Lab e mande em PDF timbrado pro aluno.')));
  };
  host.append(banner('Ata de reunião', 'registra, junta exercícios e manda em PDF'), body);
  draw();
  return store.subscribe((i) => { if (!i.kind || i.kind === KIND) draw(); });
}

export function mount(host, parts = []) { return parts[0] ? mountEdit(host, parts[0]) : mountList(host); }
