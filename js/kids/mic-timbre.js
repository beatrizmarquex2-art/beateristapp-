// Microfone: separa batida GRAVE (bumbo, surdo, pad grande) de batida AGUDA (caixa, aro, pad pequeno) pelo "brilho" do ataque. Lógica pura (testada em tests/mic-timbre.test.mjs).
// Brilho = quanto da energia do começo do golpe está nas frequências altas (diferença entre amostras vizinhas / energia). Grave dá número baixo, agudo dá alto.
export const brilho = (buf, n = 1024) => {
  if (!buf || buf.length < 64) return null; const m = Math.min(n, buf.length); let e = 0; let d = 0;
  for (let i = 1; i < m; i++) { e += buf[i] * buf[i]; const x = buf[i] - buf[i - 1]; d += x * x; }
  return e > 1e-9 ? Math.log(d / e + 1e-4) : null;
};
const media = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
const desvio = (a) => { const m = media(a); return Math.sqrt(media(a.map((x) => (x - m) ** 2))); };
/** Divide os brilhos em 2 grupos (k-médias em 1 dimensão). Devolve { limiar, grave, agudo, ok }: `ok` só quando os dois grupos são mesmo diferentes. */
export function separa(valores, { folga = 0.6 } = {}) {
  const v = valores.filter((x) => x != null && Number.isFinite(x)); if (v.length < 4) return { ok: false };
  let c0 = Math.min(...v); let c1 = Math.max(...v);
  for (let k = 0; k < 12; k++) { const g0 = v.filter((x) => Math.abs(x - c0) <= Math.abs(x - c1)); const g1 = v.filter((x) => Math.abs(x - c0) > Math.abs(x - c1)); if (!g0.length || !g1.length) break; c0 = media(g0); c1 = media(g1); }
  const g0 = v.filter((x) => Math.abs(x - c0) <= Math.abs(x - c1)); const g1 = v.filter((x) => Math.abs(x - c0) > Math.abs(x - c1)); if (!g0.length || !g1.length) return { ok: false };
  const gap = c1 - c0; const dentro = desvio(g0) + desvio(g1); const minimo = Math.max(2, Math.floor(v.length * 0.2));
  const ok = gap >= folga && gap >= dentro * 1.2 && g0.length >= minimo && g1.length >= minimo;
  return { ok, limiar: (c0 + c1) / 2, grave: c0, agudo: c1, gap };
}
/** Lado de cada batida: quem é grave vai pro lado `graveEm` ('D' = direita, o padrão) e o agudo pro outro. Devolve null se não deu pra separar (toca tudo igual): aí vale qualquer mão. */
export function ladosDosToques(eventos, { graveEm = 'D' } = {}) {
  const b = eventos.map((e) => brilho(e.buf)); const s = separa(b); if (!s.ok) return null;
  const agudoEm = graveEm === 'D' ? 'E' : 'D';
  return b.map((x) => (x == null ? null : x <= s.limiar ? graveEm : agudoEm));
}
