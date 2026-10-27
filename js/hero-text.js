// Frase do topo do início (abaixo de BEATERISTA). A Bea escolhe uma das sugestões ou escreve a dela.
import * as store from './store.js';

export const HERO_KEY = 'setting-hero';
export const HERO_SUBS = [
  'prosperar é o meu padrão',
  'meu valor não está em promoção',
  'quem lidera não pede licença',
  'empresária do meu próprio ritmo',
  'poder é saber o próprio preço',
  'o que é raro vale mais',
  'agenda cheia, vaga é privilégio',
  'escassez cria desejo, valor cria fila',
  'dinheiro segue quem entrega valor',
  'cobrar bem é respeitar meu talento',
  'presença é poder',
  'liderar é decidir e sustentar',
  'minha arte é meu negócio',
  'eu valho o que eu entrego',
  'abundância começa na decisão',
  'faço dinheiro fazendo o que amo',
];
export const heroSub = () => { const r = store.get(HERO_KEY); return (r && r.data.sub) || HERO_SUBS[0]; };
export const setHeroSub = (sub) => store.upsert('setting', HERO_KEY, { sub });
