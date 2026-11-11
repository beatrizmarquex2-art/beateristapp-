// Duelo do quebra-cabeça em 2 celulares: a MESMA imagem e as MESMAS peças (embaralhadas com a mesma semente) nos dois aparelhos, começando juntos depois da contagem.
// Vence quem montar mais rápido (cada dica soma 5 s e cada peça errada soma 1 s). A sala, a contagem e o placar vêm de duelo-base.js.
import { h } from '../util.js';
import { linha, chips } from './opcoes.js';
import { mountDueloBase } from './duelo-base.js';
import { ganhou } from './estrelas-jogo.js';

const fmt = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
/** Tempo final: tempo montando + 5 s por dica + 1 s por peça no lugar errado. */
export const tempoFinal = (r) => (r.ms | 0) + (r.hints | 0) * 5000 + (r.errors | 0) * 1000;
/** Menor tempo vence (a base compara "maior vence", então o sinal é invertido). */
export const notaQuebra = (r) => [-tempoFinal(r)];

export function mountDueloQuebra(host, { IMAGES, SIZES, abrir, voltar }) {
  const cfg = { img: IMAGES[0].id, diff: 6 };
  const nomeImg = (id) => (IMAGES.find((x) => x.id === id) || IMAGES[0]).nome;
  host.append(h('p', {}, h('button', { class: 'btn ghost small', type: 'button', onclick: voltar }, '‹ quebra-cabeça')));
  const area = h('div'); host.append(area);
  const stop = mountDueloBase(area, {
    jogo: 'quebra', titulo: 'Quebra-cabeça', sub: 'duelo em 2 celulares', voltar: ['#/jogos', '‹ jogos'], semCabecalho: true,
    async carregar() { /* o jogo em si já está carregado */ },
    config({ redraw }) {
      return { cfg: () => ({ img: cfg.img, diff: cfg.diff, seed: Math.floor(Math.random() * 2147483646) + 1 }), nodes: [
        h('img', { class: 'jg-qprev', src: (IMAGES.find((x) => x.id === cfg.img) || IMAGES[0]).src, alt: nomeImg(cfg.img) }),
        h('div', { class: 'jg-seg jg-imgs', role: 'radiogroup', 'aria-label': 'imagem' }, ...IMAGES.map((im) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(cfg.img === im.id), 'aria-label': im.nome, title: im.nome, class: cfg.img === im.id ? 'on' : '', onclick: () => { cfg.img = im.id; redraw(); } }, h('img', { src: im.src, alt: '', draggable: 'false' })))),
        linha('tamanho', chips(SIZES.map(([v, l]) => [v, l]), cfg.diff, (v) => { cfg.diff = v; redraw(); }, 'Tamanho')),
        h('p', { class: 'jg-p muted' }, 'os dois montam a mesma imagem, ao mesmo tempo. vence quem montar mais rápido (cada dica soma 5 s e cada erro soma 1 s).')] };
    },
    resumo: (c) => [`${nomeImg(c.img)} · ${c.diff} peças`, 'quem monta mais rápido vence'],
    desbloquear() { /* nada a liberar */ },
    nota: notaQuebra,
    placar: (r) => [fmt(tempoFinal(r)), `montou em ${fmt(r.ms)} · ${r.hints} dica${r.hints === 1 ? '' : 's'} · ${r.errors} erro${r.errors === 1 ? '' : 's'}`],
    aoVencer() { ganhou('quebra', 3); }, // ganhou o duelo: 3 ★
    jogar(box, c, fim) {
      let ctl = null; const t0 = Date.now(); // o tempo conta desde o começo da partida (e não só da 1ª peça), igual pros dois
      box.replaceChildren();
      ctl = abrir({ mission: { params: { img: c.img, diff: c.diff, seed: c.seed } }, onResult: (r) => { const ms = Date.now() - t0; setTimeout(() => fim({ ms, errors: r.errors | 0, hints: r.hints | 0 }), 900); } }, box);
      return () => { try { if (ctl && ctl.destroy) ctl.destroy(); } catch { /* ok */ } };
    },
  });
  return () => { stop(); host.replaceChildren(); };
}
