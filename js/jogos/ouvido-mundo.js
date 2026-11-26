// Mundo de um jogo de ouvido: mapa com 12 fases em dois níveis ("fácil e médio" e "difícil"), no mesmo jeito do Figurix e do Rudimentix.
// Cada jogo entrega: { id, nome, sub, tema, regioes, jogar(host, fase, fim), extra? }. Estrelas: 1 ★ abre a próxima fase; o difícil abre com o fácil concluído (só nos alunos).
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { mountProgressionMap } from '../kids/mapa.js';
import { temaDoMundo } from './mundos-tema.js';
import { toast } from '../ui.js';
import { premiar, quadro } from './vivo-ui.js';
import { NIVEIS, fasesDe, FASES_POR_NIVEL } from './ouvido-logic.js';
import { corSrc } from '../paul-cor.js';

const AULA_KEY = 'bt-aula-ouvido';
export const aulaVista = () => { try { return localStorage.getItem(AULA_KEY) === '1'; } catch { return false; } };
const marcaAula = () => { try { localStorage.setItem(AULA_KEY, '1'); } catch { /* sem armazenamento */ } };

export function montaMundo(host, J) {
  const root = h('div', { class: 'jg vv-mundo' }); host.replaceChildren(root);
  let gone = false; let off = null; let ativo = null; let jogando = false; let nivel = NIVEIS.some((n) => n.id === getGame(J.id).nivel) ? getGame(J.id).nivel : 'facil'; let aba = null;
  const REGRA = document.documentElement.classList.contains('aluno-on'); // alunos: o difícil só abre com o fácil concluído; no app da Bea fica tudo aberto
  const est = () => getGame(J.id).est || {};
  const estOf = (nv, n) => est()[`${nv}:${n}`] || 0;
  const concluido = (nv) => Array.from({ length: FASES_POR_NIVEL }, (_, i) => i + 1).every((n) => estOf(nv, n) >= 1);
  const nivelAberto = (nv) => !REGRA || nv === 'facil' || concluido('facil');
  const aberta = (nv, n) => n === 1 || estOf(nv, n - 1) >= 1;
  const limpa = () => { if (off) { try { off(); } catch { /* ok */ } off = null; } if (ativo) { try { ativo.destroy(); } catch { /* ok */ } ativo = null; } };

  /* ---------- aulinha (antes de jogar) ---------- */
  const aulinha = (depois) => {
    limpa(); jogando = false; const box = h('div', { class: 'kd-game' });
    root.replaceChildren(box);
    import('./ouvido-aula.js').then((m) => { if (gone) return; ativo = { destroy: m.aulaOuvido(box, { onFim: () => { marcaAula(); depois(); }, onPular: () => { marcaAula(); depois(); } }) || (() => {}) }; });
  };

  /* ---------- mapa ---------- */
  const mapa = () => {
    limpa(); jogando = false; aba = null;
    if (J.extra && nivel === J.extra.id) { extra(); return; }
    const box = h('div', { class: 'tm-map' }); const fases = fasesDe(J.id, nivel);
    const levels = fases.map((f, i) => ({ id: `${nivel}:${f.num}`, index: i + 1, label: String(f.num), tag: '', boss: i === fases.length - 1 }));
    const abas = [...NIVEIS.map((n) => [n.id, n.nome]), ...(J.extra ? [[J.extra.id, J.extra.nome]] : [])];
    const tabs = h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': 'Dificuldade' }, ...abas.map(([id, nome], i) => { const ok = id === J.extra?.id || nivelAberto(id);
      return h('button', { type: 'button', role: 'radio', 'aria-checked': String(id === nivel), class: `${id === nivel ? 'on' : ''}${ok ? '' : ' lock'}`, 'aria-label': `${nome}${ok ? '' : ', trancado: conclua as 12 fases do fácil'}`,
        onclick: () => { if (!ok) { toast('conclua as 12 fases do fácil e médio pra abrir o difícil', { ms: 3400 }); return; } nivel = id; setGame(J.id, { nivel }); mapa(); } }, `${ok ? '' : '🔒 '}${i + 1} · ${nome}`); }));
    const total = fases.reduce((t, f) => t + estOf(nivel, f.num), 0);
    root.replaceChildren(h('p', { class: 'tm-dica' }, `${J.nome} · ${J.sub}`),
      h('div', { class: 'vv-aulabar' }, h('button', { type: 'button', class: 'btn small ghost', onclick: () => aulinha(mapa) }, h('img', { class: 'fx-pergunta-p', src: corSrc('professor'), alt: '', draggable: 'false' }), ' ver a aulinha (opcional)')), box);
    const nomeNivel = NIVEIS.find((n) => n.id === nivel).nome;
    off = mountProgressionMap(box, { gameId: `${J.id}-${nivel}`, levels, profileId: J.id, unitName: 'Fase', tier: 0, stars: { have: total, max: fases.length * 3 },
      theme: temaDoMundo(J.tema, `${J.nome} · ${nomeNivel}`, J.regioes), starsOf: (id) => estOf(nivel, Number(id.split(':')[1])), unlockedOf: (id) => aberta(nivel, Number(id.split(':')[1])), lockedMsg: 'ganhe 1 estrela na fase anterior (acerte 60%)',
      onOpen: (lv) => joga(nivel, fases[lv.index - 1]) });
    const hd = box.querySelector('.mp-head'); const bar = h('div', { class: 'tm-bar' }, tabs); if (hd) hd.append(bar); else box.prepend(bar);
  };
  const extra = () => {
    const tabs = h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': 'Dificuldade' }, ...[...NIVEIS.map((n) => [n.id, n.nome]), [J.extra.id, J.extra.nome]].map(([id, nome], i) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(id === nivel), class: id === nivel ? 'on' : '', onclick: () => { nivel = id; setGame(J.id, { nivel }); mapa(); } }, `${i + 1} · ${nome}`)));
    const box = h('div', {}); root.replaceChildren(h('div', { class: 'tm-bar vv-bar-extra' }, tabs), box); ativo = J.extra.montar(box);
  };

  /* ---------- uma fase ---------- */
  function joga(nv, f) {
    limpa(); jogando = true; const box = h('div', {}); const nomeNivel = NIVEIS.find((n) => n.id === nv).nome;
    root.replaceChildren(h('div', { class: 'tr-fasehead' }, h('button', { class: 'btn small ghost', type: 'button', onclick: mapa }, '‹ mapa'), h('b', { class: 'vv-fasetit' }, `fase ${f.num} · ${nomeNivel}`)), box);
    ativo = J.jogar(box, f, (r) => resultado(nv, f, r));
  }
  function resultado(nv, f, r) {
    if (gone) return; const antes = estOf(nv, f.num); const novo = Math.max(antes, r.est);
    if (novo !== antes) setGame(J.id, { est: { ...est(), [`${nv}:${f.num}`]: novo } });
    premiar(J.id, r.est, `${J.id}:${nv}:${f.num}`);
    if (r.est >= 1 && concluido(nv)) import('../figurinhas/mundos-premio.js').then((X) => X.premiarMundo(`${J.id}:${nv}`)).catch(() => { /* sem prêmio */ }); if (r.est >= 1 && concluido(nv)) setTimeout(() => import('../conquista.js').then((C) => C.festaCaminho({ jogo: J.nome, caminho: NIVEIS.find((n) => n.id === nv).nome, chave: `${J.id}:${nv}`, pose: 'ouvindo', premioChave: `${J.id}:${nv}` })).catch(() => {}), 700); // festa ao acabar o mundo
    const grande = r.total != null ? `${r.certas} de ${r.total}` : (r.erros ? `${r.erros} ${r.erros === 1 ? 'erro' : 'erros'}` : 'sem erros!');
    const frase = r.est === 3 ? 'perfeito! 🤘' : r.est >= 1 ? 'passou! boa.' : (r.total != null ? 'ainda não passou: acerte 60% pra abrir a próxima.' : 'tenta de novo: dá pra errar menos.');
    const prox = f.num < FASES_POR_NIVEL && r.est >= 1; const todas = fasesDe(J.id, nv);
    root.replaceChildren(h('div', { class: 'tr-fasehead' }, h('button', { class: 'btn small ghost', type: 'button', onclick: mapa }, '‹ mapa'), h('b', { class: 'vv-fasetit' }, `fase ${f.num}`)),
      quadro(grande, r.est, frase, h('small', {}, r.total != null ? 'todas certas = 3 ★ · 80% = 2 ★ · 60% = 1 ★ (abre a próxima)' : 'sem erros = 3 ★ · até 2 erros = 2 ★ · concluir = 1 ★')),
      h('div', { class: 'jg-actions' }, prox ? h('button', { class: 'btn primary', type: 'button', onclick: () => joga(nv, todas[f.num]) }, 'próxima fase ▶') : null,
        h('button', { class: `btn${prox ? '' : ' primary'}`, type: 'button', onclick: () => joga(nv, f) }, 'tentar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: mapa }, 'ver o mapa')));
  }

  mapa(); // abre direto no mapa; a aulinha é opcional (botão no topo do mapa)
  return {
    inProgress: () => jogando, restart: () => { if (!gone) mapa(); },
    pause: () => { if (jogando) mapa(); },
    destroy() { gone = true; limpa(); },
  };
}
