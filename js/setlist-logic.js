// Setlist: contas de tempo e texto pra compartilhar. Lógica pura (tests/setlist.test.mjs).

/** "3:45", "3m45", "225" ou "3" (minutos) → segundos. */
export function parseDur(s) {
  const t = String(s || '').trim().toLowerCase().replace(',', '.');
  if (!t) return 0;
  let m = t.match(/^(\d+)\s*[:m]\s*(\d{1,2})s?$/); if (m) return +m[1] * 60 + +m[2];
  m = t.match(/^(\d+(?:\.\d+)?)$/); if (m) { const v = +m[1]; return v <= 20 ? Math.round(v * 60) : Math.round(v); } // até 20 = minutos
  return 0;
}
export const fmt = (sec) => { sec = Math.max(0, Math.round(sec || 0)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h ? `${h}h${String(m).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`; };

/** Tempo total = músicas + transições (segundos de cada transição). */
export function total(songs) {
  return songs.reduce((a, x) => a + (x.dur || 0) + (x.gap || 0), 0);
}
export function move(list, from, to) {
  const a = [...list]; if (from === to || from < 0 || to < 0 || from >= a.length || to >= a.length) return a;
  const [x] = a.splice(from, 1); a.splice(to, 0, x); return a;
}
export function shareText(set) {
  const lines = [`🥁 ${set.name || 'setlist'}${set.date ? ` · ${set.date.split('-').reverse().join('/')}` : ''}`, ''];
  set.songs.forEach((x, i) => {
    lines.push(`${i + 1}. ${x.title}${x.dur ? ` (${fmt(x.dur)})` : ''}${x.bpm ? ` · ${x.bpm} BPM` : ''}${x.key ? ` · ${x.key}` : ''}`);
    if (x.notes) lines.push(`   ${x.notes}`);
    if (x.trans && i < set.songs.length - 1) lines.push(`   ↳ ${x.trans}`);
  });
  lines.push('', `tempo total: ${fmt(total(set.songs))}`);
  return lines.join('\n');
}
