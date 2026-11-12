// Figurinhas LENDÁRIAS (arte da Bea, modelo preto e dourado, selo escrito LENDÁRIA): exclusivas de quem compra na Lojinha e resgata. Não saem na roleta.
// A pessoa tem uma lendária quando o código dela está em `state.lend` (entregue pelo resgate aprovado pela Bea).
export const LENDARIAS = [
  { codigo: 'L01', nome: 'Guitarrista da Tempestade', img: 'assets/figurinhas/lendarias/L01.webp' },
  { codigo: 'L02', nome: 'Rei da Aura', img: 'assets/figurinhas/lendarias/L02.webp' },
  { codigo: 'L03', nome: 'Construtor de Notas', img: 'assets/figurinhas/lendarias/L03.webp' },
  { codigo: 'L04', nome: 'Baterista Cósmico', img: 'assets/figurinhas/lendarias/L04.webp' },
  { codigo: 'L05', nome: 'Sineiro do Castelo', img: 'assets/figurinhas/lendarias/L05.webp' },
];
export const temLendaria = (state, codigo) => Array.isArray(state && state.lend) && state.lend.includes(codigo);
/** Entrega uma lendária (uma vez só). Puro. */
export const darLendaria = (state, codigo) => (temLendaria(state, codigo) || !LENDARIAS.some((x) => x.codigo === codigo) ? state : { ...state, lend: [...(state.lend || []), codigo] });
