// Que acorde é? O Paul toca um acorde e a pessoa escolhe entre 3 nomes.
import { montaQuiz, toca, chips } from './ouvido-quiz.js';
import { rodadaAcorde, NIVEIS_ACORDE, nomeAcorde } from './ouvido-logic.js';
import { acharAcorde } from '../acordes.js';

const nome = (id) => nomeAcorde(acharAcorde(id));
export function mount(host) {
  return montaQuiz(host, {
    id: 'acorde-ouvido', intro: 'o Paul toca um acorde: qual é?', padrao: { nivel: 'f' },
    ops: (c, muda) => [chips('nível', NIVEIS_ACORDE.map((n) => [n.id, n.nome]), c.nivel, (v) => muda({ nivel: v }))],
    chave: (c) => c.nivel, gera: (c) => rodadaAcorde({ nivel: c.nivel }),
    pergunta: () => 'que acorde é esse?',
    ouvir: (r) => toca(r.midis, { junto: true }),
    opcoes: (r) => r.opcoes.map((id) => [id, nome(id)]), certa: (r) => r.alvo,
    explica: (r) => `era ${nome(r.alvo)}.`,
  });
}
