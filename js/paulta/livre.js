// pauLta no modo livre: na área do aluno, sem código de acesso, o jogo roda normal (todas as fases abertas), mas não conta
// pontos, estrelas, títulos, ranking nem figurinhas. Com código (ou no app da Bea) tudo conta como sempre.
import * as AC from '../acesso.js';
export const livre = () => document.documentElement.classList.contains('aluno-on') && !AC.liberado();
