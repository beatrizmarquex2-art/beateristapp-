// pauLta: mapa de fases no mesmo desenho do Modo Aventura do Toca Aqui (discos de vinil, Escola do Ritmo, escuro/claro).
// Usa o componente js/kids/mapa.js; aqui só dizemos quais são as fases, as regiões de cada mundo e o progresso do jogador.
import { h } from '../util.js';
import { mountProgressionMap } from '../kids/mapa.js';
import * as S from './score.js';
import { phaseSpec, WORLDS } from './worlds.js';

const BASE = '#/paulta';
const R = (id, name, sub, decor) => ({ id, name, sub, decor });
/** Regiões de cada mundo (só visual: o mapa reparte as fases entre elas). */
const REGIOES = {
  drum: [R('bumbo', 'Sala do Bumbo', 'peças e sons', [['drum', 'l', 0.3], ['lamp', 'r', 0.6]]), R('pratos', 'Corredor dos Pratos', 'brilho e ataque', [['sticks', 'r', 0.3], ['drum', 'l', 0.6]]), R('palcob', 'Palco da Bateria', 'tudo junto', [['curtain', 'l', 0.3], ['trophy', 'r', 0.5], ['star', 'l', 0.85]])],
  sol: [R('agudas', 'Sala das Agudas', 'linhas e espaços', [['school', 'l', 0.3], ['lamp', 'r', 0.6]]), R('pauta', 'Corredor da Pauta', 'nota por nota', [['book', 'r', 0.3], ['piano', 'l', 0.6]]), R('palcos', 'Palco da Clave de Sol', 'ler sem pensar', [['curtain', 'l', 0.3], ['trophy', 'r', 0.5], ['star', 'l', 0.85]])],
  fa: [R('graves', 'Sala das Graves', 'o chão da música', [['school', 'l', 0.3], ['lamp', 'r', 0.6]]), R('baixo', 'Corredor do Baixo', 'notas profundas', [['book', 'r', 0.3], ['guitar', 'l', 0.6]]), R('palcof', 'Palco da Clave de Fá', 'ler sem pensar', [['curtain', 'l', 0.3], ['trophy', 'r', 0.5], ['star', 'l', 0.85]])],
  duel: [R('arena', 'Arena das Claves', 'sol contra fá', [['sticks', 'l', 0.4], ['lamp', 'r', 0.7]]), R('final', 'Palco Final', 'só uma vence', [['trophy', 'l', 0.4], ['star', 'r', 0.8]])],
};
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
    starsOf: (id) => starsAt(idOf(id)), unlockedOf: (id) => S.unlocked(p, w, idOf(id)),
    lockedMsg: 'conclua a fase anterior pra abrir o caminho',
    onBack: () => { location.hash = BASE; }, onOpen: (lv) => { location.hash = `${BASE}/${w}/${idOf(lv.id)}/${mode}`; },
  });
  // barra de baixo: continuar de onde parou e conquistas
  const full = S.worldDone(p, w); let cur = 0; for (let k = 1; k <= n; k++) if (!done(k)) { cur = k; break; }
  const earned = Object.keys(p.titles || {}).length; let seen = 0; try { seen = Number(localStorage.getItem(`pl-seen-${me.id}`) || 0); } catch { /* ok */ }
  const hud = h('div', { class: 'pl-hud' },
    h('a', { class: 'pl-hud-b', href: `${BASE}/perfil`, onclick: () => { try { localStorage.setItem(`pl-seen-${me.id}`, String(earned)); } catch { /* ok */ } } }, '🏆 conquistas', earned > seen ? h('i', { class: 'pl-hud-dot' }, String(earned - seen)) : null),
    h('a', { class: 'pl-hud-b go', href: full ? `${BASE}/aula/${w}` : `${BASE}/${w}/${cur}/${mode}` }, '▶ ', full ? 'aulinha' : 'continuar'));
  return { hud, dispose };
}
