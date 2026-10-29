// Rudimentos e treino de mãos. Escrita de manulação do método Beaterista: D = direita, E = esquerda, B = bumbo.
// MAIÚSCULA = acento, minúscula = normal, entre parênteses = nota fantasma. Ex.: "Dede" = acento na 1ª semicolcheia.
// Puro, testado em tests/rudiments.test.mjs.

export const SUBS = { 2: 'colcheias', 3: 'tercinas', 4: 'semicolcheias' };
export const VEL = { acc: 1, normal: 0.6, ghost: 0.22 };

/** "DEdd (e)B" → [{ who:'D'|'E'|'B', dyn:'acc'|'normal'|'ghost' }]. Ignora espaços, barras e o que não for D/E/B. */
export function parse(str) {
  const out = []; let ghost = false;
  for (const ch of String(str || '')) {
    if (ch === '(') { ghost = true; continue; }
    if (ch === ')') { ghost = false; continue; }
    const up = ch.toUpperCase();
    if (!'DEB'.includes(up) || !/[a-z]/i.test(ch)) continue;
    out.push({ who: up, dyn: ghost ? 'ghost' : ch === up ? 'acc' : 'normal' });
  }
  return out;
}
export const toText = (notes) => notes.map((n) => { const c = n.dyn === 'acc' ? n.who : n.who.toLowerCase(); return n.dyn === 'ghost' ? `(${c})` : c; }).join('');
/** Começar com a outra mão: troca D ↔ E (bumbo fica). */
export const swap = (notes) => notes.map((n) => ({ ...n, who: n.who === 'D' ? 'E' : n.who === 'E' ? 'D' : n.who }));
/** Sem nenhuma maiúscula no texto todo, ninguém é acento: aí tudo sai no volume normal (fica mais natural). */
export const flatten = (notes) => (notes.some((n) => n.dyn === 'acc') && notes.every((n) => n.dyn !== 'normal') ? notes.map((n) => (n.dyn === 'acc' ? { ...n, dyn: 'normal' } : n)) : notes);

/** Um compasso de 4/4 repetindo o padrão (se não fechar, continua o ciclo no próximo compasso). */
export function toBar(notes, sub = 4, offset = 0) {
  const steps = sub * 4; const rows = { sn: Array(steps).fill(0), bd: Array(steps).fill(0) }; const acc = Array(steps).fill(0); const ghost = Array(steps).fill(0); const hands = Array(steps).fill(''); const seq = [];
  if (!notes.length) return { steps, rows, acc, ghost, hands, seq };
  for (let i = 0; i < steps; i++) {
    const n = notes[(offset + i) % notes.length]; seq.push(n);
    if (n.who === 'B') rows.bd[i] = 1; else rows.sn[i] = 1;
    hands[i] = n.who;
    if (n.dyn === 'acc') acc[i] = 1;
    if (n.dyn === 'ghost' && n.who !== 'B') ghost[i] = 1;
  }
  return { steps, rows, acc, ghost, hands, seq };
}

/** Quantos compassos até o padrão fechar o ciclo (ex.: 3 notas em semicolcheia = 3 compassos). Máximo `max`. */
export function barsFor(len, sub = 4, max = 9) {
  const steps = sub * 4; if (!len) return 1;
  const g = (a, b) => (b ? g(b, a % b) : a);
  return Math.min(max, len / g(len, steps));
}

// Os rudimentos prontos do app (domínio comum). Os exercícios do método Beaterista (Ebook 2) ficam só no Supabase privado da Bia.
// Escrita: D/E = mãos, MAIÚSCULA = acento. Os rulos (5, 7 e 9 toques) são escritos como duplos alternados e fecham na nota acentuada.
export const PRESETS = [
  { id: 'simples', name: 'Toque simples', stick: 'dede dede dede dede', sub: 4, lv: 1 },
  { id: 'duplo', name: 'Toque duplo', stick: 'ddee ddee ddee ddee', sub: 4, lv: 1 },
  { id: 'paradiddle', name: 'Paradiddle', stick: 'Dedd Edee', sub: 4, lv: 2 },
  { id: 'paradiddle-inv', name: 'Paradiddle invertido', stick: 'ddEd eeDe', sub: 4, lv: 2 },
  { id: 'duplo-paradiddle', name: 'Paradiddle duplo', stick: 'Dededd Ededee', sub: 4, lv: 2 },
  { id: 'triplo-paradiddle', name: 'Paradiddle triplo', stick: 'Dedededd Edededee', sub: 4, lv: 2 },
  { id: 'paradiddle-diddle', name: 'Paradiddle-diddle', stick: 'Deddee', sub: 4, lv: 2 },
  { id: 'five-stroke', name: 'Five stroke roll', stick: 'ddeeD eeddE', sub: 4, lv: 2 },
  { id: 'seven-stroke', name: 'Seven stroke roll', stick: 'ddeeddE eeddeeD', sub: 4, lv: 3 },
  { id: 'nine-stroke', name: 'Nine stroke roll', stick: 'ddeeddeeD eeddeeddE', sub: 4, lv: 3 },
];
