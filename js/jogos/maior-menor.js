// Maior ou menor? Mundo com 2 níveis de 12 fases. O Paul toca (acorde, arpejo ou pedaço de escala) e a pessoa diz se soa alegre (maior) ou triste (menor).
import { jogaQuiz } from './ouvido-quiz.js';
import { montaMundo } from './ouvido-mundo.js';
import { toca } from './ouvido-ui.js';
import { rodadaMaiorMenor, toqueDe } from './ouvido-logic.js';

const def = {
  id: 'maior-menor', gera: (f) => rodadaMaiorMenor(f), pergunta: (r) => (r.forma.startsWith('escala5') ? 'essa escala é…' : 'esse acorde é…'),
  ouvir: (r) => toca(r.midis, toqueDe(r.forma)), opcoes: () => [['maior', 'maior 😄'], ['menor', 'menor 😢']], certa: (r) => r.tipo,
  explica: (r) => `era ${r.nome} ${r.tipo}. ${r.tipo === 'maior' ? 'a terça maior deixa o som aberto e alegre' : 'a terça menor deixa o som mais fechado e triste'}.`,
};
export const mundo = { id: 'maior-menor', nome: 'Pôr do Sol Maior e Menor', sub: 'alegre ou triste? ouça a terça', tema: 'porsol', regioes: [['praia', 'Praia da terça', 'maior ou menor?'], ['farol', 'Farol dos tons', 'o ouvido afina']], jogar: (host, f, fim) => jogaQuiz(host, def, f, fim) };
export const mount = (host) => montaMundo(host, mundo);
