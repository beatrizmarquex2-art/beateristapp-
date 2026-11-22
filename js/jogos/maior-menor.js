// Maior ou menor? O Paul toca um acorde e a pessoa diz se soa alegre (maior) ou triste (menor).
import { montaQuiz, toca } from './ouvido-quiz.js';
import { rodadaMaiorMenor } from './ouvido-logic.js';

export function mount(host) {
  return montaQuiz(host, {
    id: 'maior-menor', intro: 'o Paul toca um acorde: soa maior (alegre) ou menor (triste)?', padrao: {},
    ops: () => [], chave: () => 'tudo', gera: () => rodadaMaiorMenor(),
    pergunta: () => 'esse acorde é…',
    ouvir: (r) => toca(r.midis, { junto: true }),
    opcoes: () => [['maior', 'maior 😄'], ['menor', 'menor 😢']], certa: (r) => r.tipo,
    explica: (r) => `era ${r.nome} ${r.tipo}. ${r.tipo === 'maior' ? 'a terça maior deixa o som aberto e alegre' : 'a terça menor deixa o som mais fechado e triste'}.`,
  });
}
