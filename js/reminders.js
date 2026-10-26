// Lembretes: aula chegando, mensalidade pendente, treino do dia e lembretes avulsos.
// Puro (sem tela nem notificação), testado em tests/reminders.test.mjs. Horários em minutos do dia (America/Sao_Paulo).
import { lessonsOn, paidIn, monthKey } from './students-logic.js';

export const DEFAULTS = { on: true, lessons: true, lead: 30, pay: true, payDay: 10, payTime: '09:00', study: true, studyTime: '19:00' };
export const REPEAT = { none: 'só uma vez', daily: 'todo dia', weekdays: 'seg a sex', weekly: 'toda semana' };
export const LEADS = [10, 15, 30, 60];

export const toMin = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
export const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const weekdayOf = (key) => new Date(`${key}T12:00:00Z`).getUTCDay();

/** Lembrete avulso vale nesse dia? (data de início, repetição) */
export function appliesOn(d, key) {
  if (!d.date || d.date > key) return false;
  const w = weekdayOf(key);
  switch (d.repeat) {
    case 'daily': return true;
    case 'weekdays': return w >= 1 && w <= 5;
    case 'weekly': return w === weekdayOf(d.date);
    default: return d.date === key;
  }
}

/**
 * Lembretes do dia, em ordem de horário. Cada um: { id, at (min), title, sub, href, kind }.
 * `ctx`: { day: 'YYYY-MM-DD', students, makeups, studylogs, custom (registros "reminder"), cfg }.
 */
export function remindersFor({ day, students = [], makeups = [], studylogs = [], custom = [], cfg = {} }) {
  const c = { ...DEFAULTS, ...cfg }; const out = [];
  if (c.lessons) {
    for (const l of lessonsOn(students, day, weekdayOf(day), makeups)) {
      const t = toMin(l.time); if (t == null) continue;
      out.push({ id: `aula-${day}-${l.student.id}-${l.time}`, at: Math.max(0, t - c.lead), title: `aula com ${l.student.data.name} às ${l.time}`, sub: l.makeup ? 'reposição' : `daqui a ${c.lead} min`, href: `#/beaterista/aluno/${l.student.id}`, kind: 'aula' });
    }
  }
  if (c.pay) {
    const dom = Number(day.slice(8, 10)); const mk = monthKey(day);
    if (dom >= Math.max(1, c.payDay - 2)) {
      const late = students.filter((s) => s.data.active !== false && Number(s.data.fee) > 0 && !paidIn(s, mk)).map((s) => s.data.name).sort((a, b) => a.localeCompare(b, 'pt-BR'));
      if (late.length) out.push({ id: `pag-${mk}-${day}`, at: toMin(c.payTime) ?? 540, title: late.length === 1 ? `mensalidade pendente: ${late[0]}` : `${late.length} mensalidades pendentes`, sub: late.length === 1 ? (dom > c.payDay ? 'venceu' : `vence dia ${c.payDay}`) : late.slice(0, 4).join(', ') + (late.length > 4 ? '…' : ''), href: '#/beaterista', kind: 'pagamento' });
    }
  }
  if (c.study && !studylogs.some((r) => r.data.day === day)) out.push({ id: `treino-${day}`, at: toMin(c.studyTime) ?? 1140, title: 'treino de hoje', sub: 'ainda não registrado no plano de estudo', href: '#/plano', kind: 'treino' });
  for (const r of custom) {
    const d = r.data; if (!appliesOn(d, day) || (d.doneDays || []).includes(day)) continue;
    out.push({ id: `rem-${r.id}-${day}`, at: toMin(d.time) ?? 540, title: d.text, sub: REPEAT[d.repeat || 'none'], href: '#/lembretes', kind: 'avulso', rec: r });
  }
  return out.sort((a, b) => a.at - b.at || a.title.localeCompare(b.title, 'pt-BR'));
}

/** Os que já chegaram na hora e ainda não foram dispensados. */
export const dueNow = (list, nowMin, dismissed = []) => list.filter((x) => x.at <= nowMin && !dismissed.includes(x.id));
/** Os que devem virar notificação agora (chegaram na hora, nem dispensados nem avisados). Aula que já passou há mais de 2 h não avisa. */
export const toNotify = (list, nowMin, dismissed = [], notified = []) => dueNow(list, nowMin, dismissed).filter((x) => !notified.includes(x.id) && (x.kind !== 'aula' || nowMin - x.at <= 120));
