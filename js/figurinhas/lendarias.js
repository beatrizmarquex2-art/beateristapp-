// Figurinhas LENDÁRIAS (arte da Bea, modelo preto e dourado, selo escrito LENDÁRIA): exclusivas de quem compra na Lojinha e resgata. Não saem na roleta.
// A pessoa tem uma lendária quando o código dela está em `state.lend` (entregue pelo resgate aprovado pela Bea).
export const LENDARIAS = [
  { codigo: 'L01', nome: 'Guitarrista da Tempestade', img: 'assets/figurinhas/lendarias/L01.webp' },
  { codigo: 'L02', nome: 'Rei do Pixel Roxo', img: 'assets/figurinhas/lendarias/L02.webp' },
  { codigo: 'L03', nome: 'Construtor de Notas', img: 'assets/figurinhas/lendarias/L03.webp' },
  { codigo: 'L04', nome: 'Baterista Cósmico', img: 'assets/figurinhas/lendarias/L04.webp' },
  { codigo: 'L05', nome: 'Sineiro do Castelo', img: 'assets/figurinhas/lendarias/L05.webp' },
  { codigo: 'L06', nome: 'Tambor Jurássico', img: 'assets/figurinhas/lendarias/L06.webp' },
];
export const temLendaria = (state, codigo) => Array.isArray(state && state.lend) && state.lend.includes(codigo);
/** Entrega uma lendária (uma vez só). Puro. */
export const darLendaria = (state, codigo) => (temLendaria(state, codigo) || !LENDARIAS.some((x) => x.codigo === codigo) ? state : { ...state, lend: [...(state.lend || []), codigo] });

/** Regra: cada produto da Lojinha comprado libera 1 lendária; o combo libera todas. */
export const totalPorProdutos = (n) => Math.max(0, Math.min(LENDARIAS.length, Math.round(Number(n) || 0)));
/** Quantas lendárias a Bea liberou no print (ela guarda em `obs`: "compras:N", "combo" ou, nas antigas, "produtos:N"). Sem marca, vale 1. */
export const produtosDoResgate = (obs) => {
  const t = String(obs || ''); if (/combo/i.test(t)) return LENDARIAS.length;
  const m = /(?:compras|produtos):\s*(\d+)/.exec(t); return m ? Math.min(LENDARIAS.length, Number(m[1])) : 1;
};
/** Completa as lendárias da pessoa até `total` (na ordem L01, L02…), sem repetir. Devolve { state, novas: [códigos] }. Puro. */
export function completarLendarias(state, total) {
  let s = state; const novas = [];
  for (const x of LENDARIAS) { if (((s && s.lend) || []).length >= total) break; if (!temLendaria(s, x.codigo)) { s = darLendaria(s, x.codigo); novas.push(x.codigo); } }
  return { state: s, novas };
}
