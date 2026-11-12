// pauLta: mapa de fases no mesmo desenho do Modo Aventura do Toca Aqui (discos de vinil, Escola do Ritmo, escuro/claro).
// Usa o componente js/kids/mapa.js; aqui só dizemos quais são as fases, as regiões de cada mundo e o progresso do jogador.
import { livre } from './livre.js';
import { h } from '../util.js';
import { mountProgressionMap } from '../kids/mapa.js';
import * as S from './score.js';
import { phaseSpec, WORLDS, isDrum } from './worlds.js';

const BASE = '#/paulta';
const R = (id, name, sub, decor) => ({ id, name, sub, decor });
/** Regiões de cada mundo (só visual: o mapa reparte as fases entre elas). O enfeite é só planta, como nos mapas do Mario World. */
const REGIOES = {
  drum: [R('bumbo', 'Sala do Bumbo', 'peças e sons', [['bush', 'l', 0.06], ['flower', 'r', 0.13], ['cactus', 'r', 0.24], ['sprout', 'l', 0.41], ['vaso', 'r', 0.48], ['flower', 'r', 0.59], ['vaso', 'l', 0.76], ['bush', 'r', 0.83], ['bush', 'r', 0.94]]), R('pratos', 'Corredor dos Pratos', 'brilho e ataque', [['flower', 'r', 0.06], ['cactus', 'l', 0.13], ['vaso', 'l', 0.24], ['bush', 'r', 0.41], ['sprout', 'l', 0.48], ['cactus', 'l', 0.59], ['sprout', 'r', 0.76], ['flower', 'l', 0.83], ['flower', 'l', 0.94]]), R('palcob', 'Palco da Bateria', 'tudo junto', [['cactus', 'l', 0.06], ['vaso', 'r', 0.13], ['sprout', 'r', 0.24], ['flower', 'l', 0.41], ['bush', 'r', 0.48], ['vaso', 'r', 0.59], ['bush', 'l', 0.76], ['cactus', 'r', 0.83], ['cactus', 'r', 0.94]])],
  sol: [R('agudas', 'Sala das Agudas', 'linhas e espaços', [['vaso', 'r', 0.06], ['sprout', 'l', 0.13], ['bush', 'l', 0.28], ['cactus', 'r', 0.5], ['flower', 'l', 0.57], ['sprout', 'l', 0.72], ['flower', 'r', 0.94], ['vaso', 'l', 0.97]]), R('pauta', 'Corredor da Pauta', 'nota por nota', [['sprout', 'l', 0.06], ['bush', 'r', 0.13], ['flower', 'r', 0.28], ['vaso', 'l', 0.5], ['cactus', 'r', 0.57], ['bush', 'r', 0.72], ['cactus', 'l', 0.94], ['sprout', 'r', 0.97]]), R('palcos', 'Palco da Clave de Sol', 'ler sem pensar', [['bush', 'l', 0.06], ['flower', 'r', 0.13], ['cactus', 'r', 0.28], ['sprout', 'l', 0.5], ['vaso', 'r', 0.57], ['flower', 'r', 0.72], ['vaso', 'l', 0.94], ['bush', 'r', 0.97]])],
  fa: [R('graves', 'Sala das Graves', 'o chão da música', [['flower', 'r', 0.06], ['cactus', 'l', 0.13], ['vaso', 'l', 0.28], ['bush', 'r', 0.5], ['sprout', 'l', 0.57], ['cactus', 'l', 0.72], ['sprout', 'r', 0.94], ['flower', 'l', 0.97]]), R('baixo', 'Corredor do Baixo', 'notas profundas', [['cactus', 'l', 0.06], ['vaso', 'r', 0.13], ['sprout', 'r', 0.28], ['flower', 'l', 0.5], ['bush', 'r', 0.57], ['vaso', 'r', 0.72], ['bush', 'l', 0.94], ['cactus', 'r', 0.97]]), R('palcof', 'Palco da Clave de Fá', 'ler sem pensar', [['vaso', 'r', 0.06], ['sprout', 'l', 0.13], ['bush', 'l', 0.28], ['cactus', 'r', 0.5], ['flower', 'l', 0.57], ['sprout', 'l', 0.72], ['flower', 'r', 0.94], ['vaso', 'l', 0.97]])],
  duel: [R('arena', 'Arena das Claves', 'sol contra fá', [['sprout', 'l', 0.06], ['bush', 'r', 0.13], ['flower', 'r', 0.35], ['vaso', 'l', 0.65], ['cactus', 'r', 0.72], ['bush', 'r', 0.94]]), R('final', 'Palco Final', 'só uma vence', [['bush', 'l', 0.06], ['flower', 'r', 0.13], ['cactus', 'r', 0.35], ['sprout', 'l', 0.65], ['vaso', 'r', 0.72], ['flower', 'r', 0.94]])],
};
REGIOES.drumF = REGIOES.drum;
REGIOES.drumI = [R('avenida', 'Avenida do Chimbal', 'colcheias em fila', [['lamp', 'l', 0.15], ['star', 'r', 0.4], ['lamp', 'l', 0.7], ['note', 'r', 0.92]]), R('praca', 'Praça dos Acentos', 'forte e fraco', [['record', 'r', 0.15], ['lamp', 'l', 0.45], ['star', 'r', 0.75], ['note', 'l', 0.95]])];
REGIOES.drumD = [R('cratera', 'Cratera das Semis', 'tudo bem rápido', [['cactus', 'l', 0.15], ['vaso', 'r', 0.4], ['star', 'l', 0.7], ['cactus', 'r', 0.92]]), R('lava', 'Rio de Lava', 'sem tempo pra pensar', [['star', 'r', 0.15], ['cactus', 'l', 0.45], ['vaso', 'r', 0.75], ['star', 'l', 0.95]])];
const curto = (t) => (t.length > 26 ? `${t.slice(0, 24).trim()}…` : t);

/** Monta o mapa do mundo `w` dentro de `host`. Devolve { hud, dispose }. */
export function worldMap(host, { w, p, mode, me, stars }) {
  const W = WORLDS[w]; const n = W.count;
  const done = (k) => !!p.done[`${w}:${k}`];
  const starsAt = (k) => (done(k) ? Math.max(1, (p.ph[S.phKey(w, k, mode)] || {}).s || 1) : 0);
  const levels = Array.from({ length: n }, (_, i) => { const k = i + 1; const sp = phaseSpec(w, k); return { id: `${w}:${k}`, index: k, label: String(k), tag: curto(sp.title), boss: !!sp.sudden || k === n }; });
  const idOf = (id) => Number(id.split(':')[1]);
  const dispose = mountProgressionMap(host, {
    gameId: `paulta-${w}`, levels, profileId: me.id, unitName: 'Fase', tier: 0, stars: { have: stars, max: n * 3 },
    theme: { id: `paulta-${w}`, name: W.name, regions: REGIOES[w] },
    starsOf: (id) => starsAt(idOf(id)), unlockedOf: (id) => livre() || S.unlocked(p, w, idOf(id)),
    lockedMsg: 'conclua a fase anterior pra abrir o caminho',
    onBack: () => { location.hash = isDrum(w) ? `${BASE}/drum` : BASE; }, onOpen: (lv) => { location.hash = `${BASE}/${w}/${idOf(lv.id)}/${mode}`; },
  });
  // barra de baixo: continuar de onde parou e conquistas
  const full = S.worldDone(p, w); let cur = 0; for (let k = 1; k <= n; k++) if (!done(k)) { cur = k; break; }
  const earned = Object.keys(p.titles || {}).length; let seen = 0; try { seen = Number(localStorage.getItem(`pl-seen-${me.id}`) || 0); } catch { /* ok */ }
  const hud = h('div', { class: 'pl-hud' },
    h('a', { class: 'pl-hud-b', href: `${BASE}/perfil`, onclick: () => { try { localStorage.setItem(`pl-seen-${me.id}`, String(earned)); } catch { /* ok */ } } }, '🏆 conquistas', earned > seen ? h('i', { class: 'pl-hud-dot' }, String(earned - seen)) : null),
    h('a', { class: 'pl-hud-b go', href: full ? `${BASE}/aula/${w}` : `${BASE}/${w}/${cur}/${mode}` }, '▶ ', full ? 'aulinha' : 'continuar'));
  return { hud, dispose };
}
