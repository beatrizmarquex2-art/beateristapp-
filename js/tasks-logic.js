// Regras do checklist diário (puras, testáveis em Node).
// task.data: { title, label, recur: 'none'|'daily'|'weekdays'|'weekly', day:'YYYY-MM-DD', done, doneDay, doneDates:[], order, time }

const weekdayOf = (key) => new Date(`${key}T12:00:00Z`).getUTCDay();

export const RECUR = { none: 'não repete', daily: 'todo dia', weekdays: 'seg a sex', weekly: 'toda semana' };

export function appliesOn(d, key) {
  if (!d.day || d.day > key) return false;
  switch (d.recur) {
    case 'daily': return true;
    case 'weekdays': { const w = weekdayOf(key); return w >= 1 && w <= 5; }
    case 'weekly': return weekdayOf(d.day) === weekdayOf(key);
    default: return true;
  }
}

export function isDone(d, key) {
  if (d.recur && d.recur !== 'none') return (d.doneDates || []).includes(key);
  return !!d.done;
}

/** Tarefas para exibir em `key`. Não recorrentes pendentes de dias anteriores seguem aparecendo (atrasadas). */
export function visibleOn(records, key) {
  const out = [];
  for (const r of records) {
    const d = r.data;
    if (!appliesOn(d, key)) continue;
    const recurring = d.recur && d.recur !== 'none';
    const done = isDone(d, key);
    if (!recurring && done && d.doneDay && d.doneDay !== key) continue; // concluída em outro dia: some
    out.push({ rec: r, done, overdue: !recurring && !done && d.day < key });
  }
  out.sort((a, b) => (a.rec.data.order ?? 0) - (b.rec.data.order ?? 0) || a.rec.updated_at - b.rec.updated_at);
  return out;
}

/** Patch de dados ao alternar a conclusão em `key`. */
export function togglePatch(d, key) {
  if (d.recur && d.recur !== 'none') {
    const set = new Set(d.doneDates || []);
    set.has(key) ? set.delete(key) : set.add(key);
    return { doneDates: [...set].sort().slice(-60) };
  }
  const done = !d.done;
  return { done, doneDay: done ? key : null };
}
