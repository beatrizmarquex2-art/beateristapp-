// Frase do topo do início (abaixo de BEATERISTA). A Bea escolhe uma das sugestões ou escreve a dela.
import * as store from './store.js';

export const HERO_KEY = 'setting-hero';
export const HERO_SUBS = [
  'seu estúdio na palma da mão',
  'menos burocracia, mais música',
  'baqueta na mão, cabeça no lugar',
  'tudo no compasso',
  'do ensaio ao palco',
  'onde o groove vira rotina',
  'estudar, ensinar, tocar',
  'a escola cabe no bolso',
  'meu caderno de ritmo',
  'groove, aula e ideia num lugar só',
  'no tempo certo',
  'feito por quem toca',
];
export const heroSub = () => { const r = store.get(HERO_KEY); return (r && r.data.sub) || HERO_SUBS[0]; };
export const setHeroSub = (sub) => store.upsert('setting', HERO_KEY, { sub });
