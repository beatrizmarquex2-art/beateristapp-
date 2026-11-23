// Que acorde é? Mundo com 2 níveis de 12 fases. O Paul toca um acorde e a pessoa escolhe entre 3 ou 4 nomes.
import { jogaQuiz } from './ouvido-quiz.js';
import { montaMundo } from './ouvido-mundo.js';
import { toca } from './ouvido-ui.js';
import { rodadaAcorde, nomeAcorde, toqueDe } from './ouvido-logic.js';
import { acharAcorde } from '../acordes.js';

const nome = (id) => nomeAcorde(acharAcorde(id));
const def = {
  id: 'acorde-ouvido', gera: (f) => rodadaAcorde(f), pergunta: () => 'que acorde é esse?',
  ouvir: (r) => toca(r.midis, toqueDe(r.forma)), opcoes: (r) => r.opcoes.map((id) => [id, nome(id)]), certa: (r) => r.alvo, explica: (r) => `era ${nome(r.alvo)}.`,
};
export const mundo = { id: 'acorde-ouvido', nome: 'Noite dos Acordes', sub: 'ouça e descubra qual acorde é', tema: 'noite', regioes: [['palco', 'Palco dos acordes', 'um de cada vez'], ['estudio', 'Estúdio dos acordes', 'agora todos juntos']], jogar: (host, f, fim) => jogaQuiz(host, def, f, fim) };
export const mount = (host) => montaMundo(host, mundo);
