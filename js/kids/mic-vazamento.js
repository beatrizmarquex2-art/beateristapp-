// Microfone + metrônomo: o clique do alto-falante entra no microfone e viraria "batida de graça". Na contagem (aluno quieto) o app aprende quanto o clique vaza
// (atraso e volume) e depois ignora os ataques que são só o clique. Quem bate junto com o clique soma volume e passa. Lógica pura (tests/mic-timbre.test.mjs).
const mediana = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
/** `eventos`: [{ raw (s do relógio), level }]; `cliquesContagem`: instantes (s) dos cliques da contagem. Devolve { atraso, nivel } ou null se o microfone não ouviu o clique. */
export function aprendeVazamento(eventos, cliquesContagem) {
  const achados = []; for (const c of cliquesContagem) { const e = eventos.find((x) => x.raw - c >= -0.02 && x.raw - c <= 0.3); if (e) achados.push({ d: e.raw - c, l: e.level }); }
  if (achados.length < 2) return null; return { atraso: mediana(achados.map((a) => a.d)), nivel: mediana(achados.map((a) => a.l)) };
}
/** O ataque é só o clique vazando? (cai no horário do clique + atraso aprendido e não é bem mais forte que o vazamento). */
export function ehVazamento(ev, cliques, v, { tol = 0.045, mais = 1.8 } = {}) {
  if (!v) return false; return cliques.some((c) => Math.abs(ev.raw - (c + v.atraso)) <= tol) && ev.level < v.nivel * mais;
}
