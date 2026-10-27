// Pedacinhos compartilhados pelas ferramentas (sem importar a tela do hub, pra não dar ciclo).
import { h } from '../util.js';
import * as store from '../store.js';

/** Liga o metrônomo num BPM (guarda e abre a tela). */
export async function metroAt(bpm) {
  const cur = store.get('setting-metronome');
  await store.upsert('setting', 'setting-metronome', { ...(cur ? cur.data : {}), bpm: Math.max(30, Math.min(260, Math.round(bpm))) });
  location.hash = '#/metronomo';
}
export const back = () => h('a', { class: 'link pad-x ft-back', href: '#/ferramentas' }, '← ferramentas');
