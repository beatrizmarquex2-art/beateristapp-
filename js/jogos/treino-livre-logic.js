// Treino livre (pedido da Bea, nov/2026): todos os jogos de dentro da Fuga do Estúdio, soltos, pra jogar à vontade: sem trilha, sem porta, sem estrela e sem figurinha.
// Aqui só a lista (nome, descrição, ícone) e a conta dos níveis. A tela fica em treino-livre.js. Testes em tests/treino-livre.test.mjs.
export const NIVEIS = [['facil', 'fácil'], ['medio', 'médio'], ['dificil', 'difícil']];
/** id = tipo da Fuga (fuga-logic.js TIPOS). `mini` = vem de fuga-mini.js; `duelo` = caça-palavras e cruzadinha (dicas.js). */
export const JOGOS = [
  { id: 'genius', nome: 'Genius', desc: 'repita a sequência de sons', emoji: '🎛️', cor: '#e8384f', mini: true },
  { id: 'caminho', nome: 'Caminho 3×3', desc: 'refaça o caminho de notas', emoji: '🔢', cor: '#f2762e', mini: true },
  { id: 'memoria', nome: 'Memória', desc: 'ache os pares de música', emoji: '🃏', cor: '#f7b733', mini: true },
  { id: 'queda', nome: 'Notas caindo', desc: 'pegue as figuras certas', emoji: '🎼', cor: '#2fa8c4', mini: true },
  { id: 'queda4', nome: 'Notas caindo (4 faixas)', desc: 'mais rápido e com 4 faixas', emoji: '🎶', cor: '#3b6fd8', mini: true },
  { id: 'montar', nome: 'Monte o ritmo', desc: 'encaixe as figuras no compasso', emoji: '🧩', cor: '#f4efe4', mini: true },
  { id: 'compasso', nome: 'Complete o compasso', desc: 'some as figuras sem passar', emoji: '⏱️', cor: '#4fd8ff', mini: true },
  { id: 'intruso', nome: 'Qual é o intruso?', desc: 'ache o diferente do grupo', emoji: '🕵️', cor: '#e8384f', mini: true },
  { id: 'caca', nome: 'Caça-palavras', desc: 'palavras de música na grade', emoji: '🔎', cor: '#f2762e', duelo: true },
  { id: 'cruz', nome: 'Cruzadinha', desc: 'complete com termos musicais', emoji: '✏️', cor: '#f7b733', duelo: true },
];
export const jogoPorId = (id) => JOGOS.find((j) => j.id === id) || null;
export const nivelValido = (n) => (NIVEIS.some(([k]) => k === n) ? n : 'medio');
/** Outros jogos que já têm treino próprio (a Bea quer tudo à mão): abrem pela própria tela. */
export const OUTROS = [
  { href: '#/jogos/genius', nome: 'Eco do Paul', desc: 'xilofone, piano, bateria e violão', emoji: '🥁' },
  { href: '#/jogos/figurix', nome: 'Figurix', desc: 'modo treino com rodadas novas', emoji: '🎯' },
  { href: '#/jogos/toca', nome: 'Toca Aqui', desc: 'modo treino com rodadas novas', emoji: '👆' },
  { href: '#/jogos/detetive', nome: 'Detetive Note', desc: 'modo treino com rodadas novas', emoji: '🔍' },
];
/** Resumo da rodada: "acertou X de Y" + erros. `st` = o que o jogo devolve em stats(). */
export function resumo(st) {
  const s = st || {}; const erros = Number(s.erros) || 0; const found = Number(s.found) || 0; const total = Number(s.total) || 0;
  const bom = erros === 0; return { erros, found, total, bom, texto: bom ? 'sem nenhum erro! 🎉' : `${erros} erro${erros === 1 ? '' : 's'}: dá pra melhorar, de novo?` };
}
