// Treino livre: os jogos de dentro da Fuga do Estúdio, soltos, pra jogar à vontade (professores nas aulas, alunos treinando). Escolhe o jogo e o nível; cada rodada é nova.
// Não mexe em trilha, estrela, figurinha nem progresso: só joga. Lista e contas em treino-livre-logic.js.
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { MINI } from './fuga-mini.js';
import { NIVEL_CFG } from './fuga-logic.js';
import { carregaBanco } from '../banco.js';
import * as L from './treino-livre-logic.js';

const ID = 'treino';
export function mount(host) {
  let nivel = L.nivelValido(getGame(ID).nivel); let gone = false; let jogando = false; let api = null; let atual = null;
  const root = h('div', { class: 'jg jg-treino' }); host.replaceChildren(root);

  function lobby() {
    jogando = false; api = null; atual = null; root.style.removeProperty('--tl-c'); root.replaceChildren();
    const chips = h('div', { class: 'tl-niveis', role: 'radiogroup', 'aria-label': 'nível' }, ...L.NIVEIS.map(([k, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(k === nivel), class: `tl-nivel${k === nivel ? ' on' : ''}`, onclick: () => { nivel = k; setGame(ID, { nivel }); lobby(); } }, t)));
    root.append(
      h('div', { class: 'tl-cab' }, h('h2', { class: 'jg-h hand' }, '🎯 treino livre'), h('p', { class: 'jg-p' }, 'à vontade e sem parar: rodadas novas no nível que você escolher. não vale estrela nem figurinha.')),
      h('div', { class: 'tl-nivel-linha' }, h('b', {}, 'nível'), chips),
      h('div', { class: 'tl-grade' }, ...L.JOGOS.map((j) => h('button', { type: 'button', class: 'tl-card', style: `--c:${j.cor}`, onclick: () => joga(j) }, h('span', { class: 'tl-emo', 'aria-hidden': 'true' }, j.emoji), h('b', {}, j.nome), h('small', {}, j.desc)))),
      h('p', { class: 'dn-lab tl-mais-t' }, 'outros treinos'),
      h('div', { class: 'tl-outros' }, ...L.OUTROS.map((o) => h('a', { class: 'tl-outro', href: o.href, title: o.desc }, h('span', { 'aria-hidden': 'true' }, o.emoji), h('b', {}, o.nome)))));
  }

  async function joga(j) {
    atual = j; jogando = true; api = null;
    root.style.setProperty('--tl-c', j.cor); const caixa = h('div', { class: 'tl-caixa' }); const barra = h('div', { class: 'tl-barra' }, h('button', { type: 'button', class: 'btn small ghost', onclick: () => lobby() }, '‹ treino livre'), h('span', { class: 'tl-tit' }, `${j.emoji} ${j.nome} · ${L.NIVEIS.find(([k]) => k === nivel)[1]}`));
    root.replaceChildren(barra, caixa);
    const fim = () => setTimeout(() => { if (gone || !caixa.isConnected) return; resultado(j, caixa); }, 600);
    try {
      if (j.mini) { api = MINI[j.id](caixa, { nivel, fim, area: 'notas', extra: 0, assuntos: null, rodadas: 0 }); }
      else {
        const mod = (await import('../views/dicas.js'))._duelo; const T = await import('../tips.js'); await carregaBanco(); if (gone || !caixa.isConnected) return;
        const cfg = NIVEL_CFG[nivel]; const its = mod.items();
        if (j.id === 'caca') { const pk = T.easyPick(its, cfg.palavras); api = mod.caca(caixa, { pick: pk, mk: () => Math.random, fim, dica: true, size: cfg.grade, dirs: cfg.dirs }); }
        else { const pk = T.easyPick(its, cfg.cruz, { min: 4, max: cfg.cruzMax || 8 }); api = mod.cruzadinha(caixa, { pick: pk, mk: () => Math.random, fim }); }
      }
    } catch (e) { console.warn('treino livre:', e); caixa.replaceChildren(h('p', { class: 'jg-p' }, 'não consegui abrir esse jogo agora. volte e tente outro.')); }
  }

  function resultado(j, caixa) {
    let st = null; try { st = api && api.stats ? api.stats() : null; } catch { /* sem resumo */ } const r = L.resumo(st);
    jogando = false;
    caixa.replaceChildren(h('section', { class: 'card pad tl-fim' }, h('h3', { class: 'jg-h hand' }, r.bom ? 'mandou bem! 🎉' : 'rodada completa!'), h('p', { class: 'jg-p' }, r.texto),
      h('div', { class: 'jg-actions' }, h('button', { type: 'button', class: 'btn primary wide', onclick: () => joga(j) }, 'outra rodada ▶'), h('button', { type: 'button', class: 'btn wide', onclick: () => lobby() }, 'escolher outro jogo'))));
  }

  lobby();
  return { inProgress: () => jogando, restart: () => { if (atual && jogando) joga(atual); else lobby(); }, destroy() { gone = true; } };
}
