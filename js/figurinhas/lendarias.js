// Figurinhas LENDÁRIAS (arte da Bea, modelo preto e dourado, selo escrito LENDÁRIA): exclusivas de quem compra na Lojinha e resgata. Não saem na roleta.
// A pessoa tem uma lendária quando o código dela está em `state.lend` (entregue pelo resgate aprovado pela Bea).
export const LENDARIAS = [
  { codigo: 'L01', nome: 'Guitarrista da Tempestade', img: 'assets/figurinhas/lendarias/L01.webp' },
  { codigo: 'L02', nome: 'Rei do Pixel Roxo', img: 'assets/figurinhas/lendarias/L02.webp' },
  { codigo: 'L03', nome: 'Construtor de Notas', img: 'assets/figurinhas/lendarias/L03.webp' },
  { codigo: 'L04', nome: 'Baterista Cósmico', img: 'assets/figurinhas/lendarias/L04.webp' },
  { codigo: 'L05', nome: 'Sineiro do Castelo', img: 'assets/figurinhas/lendarias/L05.webp' },
];
export const temLendaria = (state, codigo) => Array.isArray(state && state.lend) && state.lend.includes(codigo);
/** Entrega uma lendária (uma vez só). Puro. */
export const darLendaria = (state, codigo) => (temLendaria(state, codigo) || !LENDARIAS.some((x) => x.codigo === codigo) ? state : { ...state, lend: [...(state.lend || []), codigo] });

/** Quantas lendárias, no total, cada compra libera: 1 produto = 1 · 2 produtos = 3 (mais 2) · 3 produtos = as 5 (mais 2). */
export const FAIXAS = { 1: 1, 2: 3, 3: 5 };
export const totalPorProdutos = (n) => FAIXAS[Math.max(0, Math.min(3, Math.round(Number(n) || 0)))] || 0;
/** Quantos produtos a Bea conferiu no print (ela guarda em `obs` como "produtos:2"). Sem a marca, vale 1. */
export const produtosDoResgate = (obs) => { const m = /produtos:\s*([123])/.exec(String(obs || '')); return m ? Number(m[1]) : 1; };
/** Completa as lendárias da pessoa até `total` (na ordem L01, L02…), sem repetir. Devolve { state, novas: [códigos] }. Puro. */
export function completarLendarias(state, total) {
  let s = state; const novas = [];
  for (const x of LENDARIAS) { if (((s && s.lend) || []).length >= total) break; if (!temLendaria(s, x.codigo)) { s = darLendaria(s, x.codigo); novas.push(x.codigo); } }
  return { state: s, novas };
}
