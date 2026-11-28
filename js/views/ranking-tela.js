// Tela do Ranking dos alunos: setinhas pro lado trocam o quadro (mundos terminados, chegou mais longe, mais figurinhas, quem mais estudou, Eco do Paul);
// pódio com 1º, 2º e 3º lugar e o nome, e a lista até o 10º. Quadros de figurinhas e estudos têm "este mês" e "de sempre". Dados em ranking-dados.js / ranking-envio.js.
import { h } from '../util.js';
import { banner } from '../ui.js';
import * as RK from '../ranking.js';
import { CATEGORIAS, anda, podio, quadro, textoUnidade, MEDALHAS } from '../ranking-dados.js';
import * as EV from '../ranking-envio.js';
import { icone } from '../ranking-icones.js';
// medalhas do pódio: arte da Bea (assets/ranking/podio-*.svg)
const MEDALHA_IMG = { 1: 'assets/ranking/podio-1-ouro.svg', 2: 'assets/ranking/podio-2-prata.svg', 3: 'assets/ranking/podio-3-bronze.svg' };

export function mount(view) {
  let i = 0; let periodo = 'mes'; let gone = false; let nums = null; let req = 0;
  const raiz = h('section', { class: 'rk', 'aria-label': 'ranking' });
  const cab = h('div', { class: 'rk-cab' }); const abas = h('div', { class: 'rk-abas', role: 'radiogroup', 'aria-label': 'período' }); const corpo = h('div', { class: 'rk-corpo', 'aria-live': 'polite' }); const pontos = h('div', { class: 'rk-pts', role: 'tablist', 'aria-label': 'quadros' }); const rodape = h('div', { class: 'rk-eu' });
  raiz.append(cab, pontos, abas, corpo, rodape);
  const cat = () => CATEGORIAS[i]; const per = () => (cat().mensal ? periodo : 'geral');
  const vai = (d) => { i = anda(i, d); desenha(); };
  const seta = (d, rot) => h('button', { type: 'button', class: 'rk-seta', 'aria-label': rot, onclick: () => vai(d) }, icone(d < 0 ? 'seta_esq' : 'seta_dir', 'rk-seta-i'));

  function desenha() {
    const c = cat(); nums = EV.coletar();
    cab.replaceChildren(seta(-1, 'quadro anterior'), h('div', { class: 'rk-tit' }, h('span', { class: 'rk-emo', 'aria-hidden': 'true' }, icone(c.id, 'rk-i rk-i-tit')), h('b', {}, c.titulo), h('small', {}, c.sub)), seta(1, 'próximo quadro'));
    pontos.replaceChildren(...CATEGORIAS.map((x, k) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(k === i), 'aria-label': x.titulo, class: k === i ? 'on' : '', onclick: () => { i = k; desenha(); } })));
    abas.replaceChildren(...(c.mensal ? [['mes', 'este mês'], ['geral', 'de sempre']] : [['geral', 'de sempre']]).map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(v === per()), class: v === per() ? 'on' : '', onclick: () => { periodo = v; desenha(); } }, t)));
    corpo.replaceChildren(h('p', { class: 'rk-vazio' }, 'carregando…')); const eu = Number(EV.meu(nums, c.id, per())) || 0; const minha = ++req;
    RK.top(quadro(c.id, per()), { fresh: true }).then((rows) => { if (gone || minha !== req) return; pinta(rows, c, eu); });
    rodape.replaceChildren(...(EV.aparecer() ? [h('span', {}, `você: ${textoUnidade(c, eu)}`)] : []), h('label', { class: 'rk-toggle' }, h('input', { type: 'checkbox', checked: EV.aparecer(), onchange: (e) => { EV.ligarAparecer(e.target.checked); desenha(); } }), h('span', {}, `aparecer no ranking como “${EV.nomeDoAluno() || 'seu nome'}”`)));
  }
  function pinta(rows, c, eu) {
    const p = podio(rows); const meuNome = EV.nomeDoAluno().toLowerCase();
    if (!p.top3.length) { corpo.replaceChildren(h('p', { class: 'rk-vazio' }, per() === 'mes' ? 'ninguém pontuou neste mês ainda. seja o primeiro!' : 'ninguém ainda. seja o primeiro!')); return; }
    const ordem = [p.top3[1], p.top3[0], p.top3[2]]; // 2º à esquerda, 1º no meio, 3º à direita
    const pod = h('div', { class: 'rk-podio' }, ...ordem.map((x) => (x ? h('div', { class: `rk-lugar l${x.pos}${x.nome.toLowerCase() === meuNome ? ' eu' : ''}` }, h('span', { class: 'rk-med', 'aria-hidden': 'true' }, h('img', { class: 'rk-i rk-i-med', src: MEDALHA_IMG[x.pos], alt: '', width: 84, height: 84, decoding: 'async' })), h('b', { class: 'rk-nome' }, x.nome), h('small', {}, textoUnidade(c, x.pontos)), h('i', { class: 'rk-base' }, String(x.pos))) : h('div', { class: 'rk-lugar vazio' }))));
    const lista = p.resto.length ? h('ol', { class: 'rk-lista', start: 4 }, ...p.resto.map((x) => h('li', { class: x.nome.toLowerCase() === meuNome ? 'eu' : '' }, h('span', { class: 'rk-pos' }, `${x.pos}º`), h('span', { class: 'rk-nm' }, x.nome), h('b', {}, textoUnidade(c, x.pontos))))) : null;
    const dentro = [...p.top3, ...p.resto].some((x) => x.nome.toLowerCase() === meuNome);
    corpo.replaceChildren(pod, lista, !dentro && eu > 0 && EV.aparecer() ? h('p', { class: 'rk-fora' }, 'você ainda não está entre os 10. continua que chega lá!') : null);
  }
  // deslizar o dedo pro lado também troca o quadro
  let x0 = null; raiz.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  raiz.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60) vai(dx < 0 ? 1 : -1); }, { passive: true });
  const tecla = (e) => { if (e.key === 'ArrowLeft') vai(-1); else if (e.key === 'ArrowRight') vai(1); }; document.addEventListener('keydown', tecla);
  view.append(banner('Ranking', 'os melhores da escola'), h('div', { class: 'pad-x' }, raiz)); desenha(); EV.agendar(500);
  return () => { gone = true; document.removeEventListener('keydown', tecla); };
}
