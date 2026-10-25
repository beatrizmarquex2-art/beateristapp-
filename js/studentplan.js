// Plano do Aluno: lista de atividades (ritmos do Beat Lab, rudimentos, partituras, treinos ou texto livre) com BPM e meta,
// guardada na ficha do aluno e impressa em A4. Cada item guarda uma CÓPIA do exercício (se o original mudar, o plano impresso não muda).
// Puro, testado em tests/studentplan.test.mjs.
import { parse, flatten, toBar, barsFor } from './rudiments.js';

export const TYPES = [['semana', 'tarefa da semana'], ['mes', 'objetivos do mês']];
export const TREINOS = [['leitura-1', 'Leitura rítmica · nível 1 (semínima e colcheia)', '#/treinos'], ['leitura-2', 'Leitura rítmica · nível 2 (semicolcheias)', '#/treinos'], ['leitura-3', 'Leitura rítmica · nível 3 (pontuadas e síncopes)', '#/treinos'], ['escuta', 'Ditado rítmico (ouvir e reconhecer)', '#/treinos/escuta'], ['toque', 'Tocar na bateria de toque e conferir a partitura', '#/toque']];
const id = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const slimBar = (b) => ({ steps: b.steps, rows: Object.fromEntries(Object.entries(b.rows || {}).filter(([, r]) => r && r.some(Boolean))), ...(b.acc && b.acc.some(Boolean) ? { acc: b.acc.slice() } : {}), ...(b.ghost && b.ghost.some(Boolean) ? { ghost: b.ghost.slice() } : {}) });

/** Item a partir de um ritmo do Beat Lab. */
export const fromBeat = (beat, src = '') => ({ id: id(), kind: 'beat', title: beat.name, src, bars: [slimBar(beat)], bpm: beat.bpm || 80, target: null, freq: '', note: '' });
/** Item a partir de um rudimento (manulação D/E/B). Guarda os compassos até o padrão fechar (máx. 4 no papel). */
export function fromRudiment(name, stick, sub = 4, src = '') {
  const notes = flatten(parse(stick)); const n = Math.min(4, barsFor(notes.length, sub));
  const bars = Array.from({ length: n }, (_, b) => { const x = toBar(notes, sub, b * sub * 4); return { ...slimBar(x), stick: x.seq.map((s) => (s.dyn === 'acc' ? s.who : s.dyn === 'ghost' ? `(${s.who.toLowerCase()})` : s.who.toLowerCase())) }; });
  return { id: id(), kind: 'rud', title: name, src, stick, bars, bpm: 60, target: null, freq: '', note: '' };
}
export const fromPartitura = (doc, src = '') => ({ id: id(), kind: 'partitura', title: doc.title || 'partitura', src, bars: (doc.bars || []).slice(0, 8).map(slimBar), bpm: doc.bpm || 80, target: null, freq: '', note: '' });
export const fromTreino = (key) => { const t = TREINOS.find((x) => x[0] === key) || TREINOS[0]; return { id: id(), kind: 'treino', title: t[1], href: t[2], bars: [], bpm: null, target: null, freq: '', note: '' }; };
export const fromText = (title) => ({ id: id(), kind: 'livre', title: String(title || '').trim() || 'atividade', bars: [], bpm: null, target: null, freq: '', note: '' });

/** Compasso com todas as peças (o desenho espera todas as linhas). */
export function fullBar(bar, rowIds) { return { ...bar, rows: Object.fromEntries(rowIds.map((r) => [r, (bar.rows && bar.rows[r]) || Array(bar.steps).fill(0)])) }; }

/** Copiar o plano pra outro aluno: itens novos (ids novos), sem o que o outro aluno conseguiu. */
export function copyFor(plan, student) {
  return { ...plan, studentId: student.id, studentName: student.name, created: Date.now(), review: null,
    items: plan.items.map((it) => ({ ...it, id: id(), done: false, reached: null })) };
}

/** Linha de meta: "70 → meta 90 BPM · 10 min por dia". */
export function metaLine(it) {
  const p = [];
  if (it.bpm && it.target) p.push(`${it.bpm} → meta ${it.target} BPM`); else if (it.bpm) p.push(`${it.bpm} BPM`); else if (it.target) p.push(`meta ${it.target} BPM`);
  if (it.freq) p.push(it.freq);
  return p.join(' · ');
}
export const progress = (plan) => { const n = plan.items.length; const d = plan.items.filter((i) => i.done).length; return { n, d, pct: n ? Math.round((d / n) * 100) : 0 }; };
