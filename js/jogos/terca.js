// 3ª ou 5ª? Mundo com 2 níveis de 12 fases. O Paul toca a tônica e outra nota; a pessoa diz o grau da escala.
import { jogaQuiz } from './ouvido-quiz.js';
import { montaMundo } from './ouvido-mundo.js';
import { toca } from './ouvido-ui.js';
import { rodadaGrau } from './ouvido-logic.js';
import { nomeEm } from './ouvido-logic.js';

const def = {
  id: 'terca', gera: (f) => rodadaGrau(f),
  pergunta: (r, f) => (f.dica ? `a nota base é ${nomeEm(r.raiz, r.pc, r.modo)} (escala ${r.modo}). a segunda nota é a…` : 'qual grau da escala é a segunda nota?'),
  ouvir: (r) => toca([r.raiz, r.alvo], { passo: 0.9, dur: 0.85 }),
  opcoes: (r, f) => f.graus.map((g) => [g, `${g}ª`]), certa: (r) => r.grau,
  explica: (r) => `era a ${r.grau}ª: ${nomeEm(r.raiz, r.pc, r.modo)} → ${nomeEm(r.alvo, r.pc, r.modo)}.${r.grau === 3 ? ' a 3ª é a nota que dá a cor (alegre ou triste).' : r.grau === 5 ? ' a 5ª soa firme, é o "chão" do acorde.' : ''}`,
};
export const mundo = { id: 'terca', nome: 'Bosque das Terças', sub: 'ouça a nota e diga o grau da escala', tema: 'outono', regioes: [['clareira', 'Clareira da 3ª e da 5ª', 'as duas notas do acorde'], ['trilha', 'Trilha dos graus', 'cada nota tem seu lugar']], jogar: (host, f, fim) => jogaQuiz(host, def, f, fim) };
export const mount = (host) => montaMundo(host, mundo);
