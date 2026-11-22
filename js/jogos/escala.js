// Escalas: mundo com 2 níveis de 12 fases + modo livre. Toque a escala colorida em ordem, na tela ou no instrumento.
import { montaMundo } from './ouvido-mundo.js';
import { jogaEscala, escalaLivre } from './escala-jogo.js';

export const mundo = { id: 'escala', nome: 'Espaço das Escalas', sub: 'toque a escala colorida em ordem', tema: 'espaco', regioes: [['orbita', 'Órbita das escalas', 'dó maior e companhia'], ['estacao', 'Estação das pentatônicas', 'só 5 notas']],
  jogar: (host, f, fim) => jogaEscala(host, f, fim), extra: { id: 'livre', nome: 'livre', montar: (box) => escalaLivre(box) } };
export const mount = (host) => montaMundo(host, mundo);
