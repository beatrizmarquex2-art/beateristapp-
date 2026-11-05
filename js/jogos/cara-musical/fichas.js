// Ficha educativa depois da rodada: só fatos VERIFICADOS (atributos true) da tabela do elenco; nada inventado. Até 3 fatos.
import { BY_ID } from './elenco.js';
const FATOS = [
  ['banda', 'é uma banda'], ['solo', 'é artista solo'], ['dupla', 'aparece aqui como dupla'], ['brasileiro', 'é do Brasil'], ['eua', 'é dos Estados Unidos'], ['uk', 'é do Reino Unido'],
  ['baterista', 'toca bateria'], ['guitarrista', 'toca guitarra'], ['beatles', 'é dos Beatles'], ['mpb', 'faz MPB'], ['pesado', 'faz rock pesado'], ['punk', 'é punk/pop punk/emo'], ['rock', 'é conhecido pelo rock'], ['pop', 'faz pop'],
  ['cantor', 'é cantor(a)'], ['grande', 'tem mais de 3 integrantes'], ['antes1980', 'a carreira começou antes de 1980'], ['depois2000', 'a carreira começou depois de 2000'],
];
export function fatosDe(id, max = 3) { const e = BY_ID[id]; if (!e) return []; return FATOS.filter(([k]) => e.attrs[k] === true).slice(0, max).map(([, t]) => t); }
