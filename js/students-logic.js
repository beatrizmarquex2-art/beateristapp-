// Regras de alunos e aulas, sem DOM (testadas em Node). Datas sempre em America/Sao_Paulo via todayKey/weekdayOf.
export const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
export const WD_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const ATTEND = { presente: 'presente', faltou: 'faltou', remarcou: 'remarcou' };

const toMin = (t) => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? Number(m[1]) * 60 + Number(m[2]) : 24 * 60; };

/** Aulas do dia: alunos ativos com horário fixo nesse dia da semana + reposições marcadas para a data, em ordem de horário. */
export function lessonsOn(students, dayKey, weekday, makeups = []) {
  const out = [];
  for (const s of students) {
    if (s.data.active === false) continue;
    for (const slot of s.data.schedule || []) if (Number(slot.day) === weekday) out.push({ student: s, time: slot.time || '', makeup: false });
  }
  for (const m of makeups) if (m.data.date === dayKey) { const st = students.find((s) => s.id === m.data.studentId); if (st) out.push({ student: st, time: m.data.time || '', makeup: true, rec: m }); }
  return out.sort((a, b) => toMin(a.time) - toMin(b.time) || a.student.data.name.localeCompare(b.student.data.name));
}

/** Histórico de um aluno, mais recente primeiro (data, depois momento do registro). */
export const historyOf = (lessons, studentId) => lessons.filter((l) => l.data.studentId === studentId)
  .sort((a, b) => (b.data.date || '').localeCompare(a.data.date || '') || (b.data.at || 0) - (a.data.at || 0));

/** "Última aula" = a última em que o aluno esteve presente (falta não apaga o que foi trabalhado). */
export const lastLesson = (lessons, studentId) => historyOf(lessons, studentId).find((l) => l.data.attendance === 'presente') || null;

/** Registro do dia para a chamada (se já existe, a chamada edita ESTE registro; nunca mexe nos dias anteriores). */
export const lessonOnDay = (lessons, studentId, dayKey) => historyOf(lessons, studentId).find((l) => l.data.date === dayKey) || null;

/** Pré-preenche uma aula nova a partir da última: mesma música; o tema de casa anterior vira ponto de partida. */
export function prefill(last) {
  if (!last) return { song: '', content: '', homework: '' };
  return { song: last.data.song || '', content: last.data.homework ? `revisar: ${last.data.homework}` : '', homework: '' };
}

export const monthKey = (dayKey) => dayKey.slice(0, 7);
export const paidIn = (student, mk) => !!((student.data.payments || {})[mk]);

/** Busca por nome, instrumento ou dia/horário ("seg", "terça", "14:00"). */
export function searchStudents(students, q) {
  const n = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const t = n(q).trim(); if (!t) return students;
  return students.filter((s) => {
    const sched = (s.data.schedule || []).map((x) => `${WEEKDAYS[x.day]} ${WD_SHORT[x.day]} ${x.time}`).join(' ');
    return n(`${s.data.name} ${s.data.instrument} ${sched}`).includes(t);
  });
}

/** Link de WhatsApp a partir do telefone com DDD (só dígitos; assume Brasil se vier sem 55). */
export function whatsapp(phone) {
  const d = String(phone || '').replace(/\D/g, ''); if (d.length < 10) return null;
  return `https://wa.me/${d.startsWith('55') && d.length >= 12 ? d : `55${d}`}`;
}

/** Foto de menor só com autorização dos responsáveis registrada. */
export const canHavePhoto = (data) => !data.minor || !!data.consent;

/* ---------- cronômetro de foco: tudo por carimbo de tempo (o iPhone congela timers em segundo plano) ---------- */
export function timerState(t, nowMs) {
  const on = t.startedAt != null; const run = on ? nowMs - t.startedAt : 0;
  const elapsed = Math.min(t.duration, (t.accumulated || 0) + run);
  return { elapsed, remaining: Math.max(0, t.duration - elapsed), done: elapsed >= t.duration, running: on };
}
export const timerStart = (t, nowMs) => (t.startedAt != null ? t : { ...t, startedAt: nowMs });
export const timerPause = (t, nowMs) => (t.startedAt != null ? { ...t, accumulated: Math.min(t.duration, (t.accumulated || 0) + nowMs - t.startedAt), startedAt: null } : t);
export const fmtClock = (ms) => { const s = Math.ceil(ms / 1000); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
