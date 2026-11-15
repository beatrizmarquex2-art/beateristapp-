// Regra da Bea pra "minha coleção" (puro, testado em tests/minhas-limite.test.mjs): no máximo 2 cartinhas da MESMA foto no MESMO modelo de card,
// mesmo mudando o nome ou o enquadramento.
export const LIMITE_IGUAIS = 2;
/** Quantas cartinhas da lista são da mesma foto (`fotoSig`) e do mesmo modelo de card. Sem assinatura da foto (não deu pra medir) nunca bloqueia. */
export const contaIguais = (lista, fotoSig, modelo) => (fotoSig ? (lista || []).filter((x) => x && x.fotoSig === fotoSig && x.modelo === modelo).length : 0);

/* ---------- "Meu álbum": as cartinhas que a pessoa criou são COLADAS em espaços numerados (só neste aparelho) ---------- */
export const ESPACOS_PAGINA = 6; export const PAGINAS = 7; export const ESPACOS = ESPACOS_PAGINA * PAGINAS; // 42 espaços (a coleção guarda até 40 cartinhas)
/** Primeiro espaço vazio (1..ESPACOS), ou 0 se o álbum está cheio. */
export const proximoEspaco = (lista) => { const usados = new Set((lista || []).map((x) => x && x.slot).filter(Boolean)); for (let n = 1; n <= ESPACOS; n++) if (!usados.has(n)) return n; return 0; };
/** Cola a cartinha `id` no espaço `slot` (ou no primeiro vazio). Espaço ocupado ou cartinha já colada: não muda nada. */
export function colar(lista, id, slot = 0) {
  const l = lista || []; const it = l.find((x) => x.id === id); if (!it || it.slot) return l;
  const n = slot || proximoEspaco(l); if (!n || n > ESPACOS || l.some((x) => x.slot === n)) return l;
  return l.map((x) => (x.id === id ? { ...x, slot: n } : x));
}
/** Tira a cartinha do álbum (ela volta pra "pra colar"). */
export const descolar = (lista, id) => (lista || []).map((x) => { if (x.id !== id) return x; const { slot: _s, ...resto } = x; return resto; });
export const praColar = (lista) => (lista || []).filter((x) => !x.slot);
export const coladas = (lista) => (lista || []).filter((x) => x.slot);
/** Página (1..PAGINAS) em que o espaço fica. */
export const paginaDe = (slot) => Math.min(PAGINAS, Math.max(1, Math.ceil(slot / ESPACOS_PAGINA)));
