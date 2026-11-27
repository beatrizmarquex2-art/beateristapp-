// Pedaleira: 4 botões redondos (Partitura, Afinador, Metrônomo, Códigos). Partitura e Códigos abrem um painel; Afinador e Metrônomo abrem a ferramenta.
import { h } from './ui.js';
import * as NUV from '../partitura-nuvem.js';
import { quandoTxt } from './ui.js';

const ic = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BOTOES = [
  ['partitura', 'Partitura', ic('M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm11-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3z')],
  ['afinador', 'Afinador', ic('M2 12h4l2-6 4 12 3-9 2 3h5')],
  ['metronomo', 'Metrônomo', ic('M8 21h8l-2-17h-4zM12 14l5-6')],
  ['codigos', 'Códigos', ic('M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3')],
];
export function mount(host) {
  let aberto = ''; let recentes = []; let gone = false;
  const painel = h('section', { class: 'pp-painel', 'aria-live': 'polite' }); const botoes = h('div', { class: 'pp-botoes', role: 'group', 'aria-label': 'Ferramentas' });
  const abre = (id) => { try { sessionStorage.setItem(id ? 'pm-abrir' : 'pm-novo', id || '1'); } catch { /* sem sessionStorage */ } location.hash = '#/editor'; };
  const pinta = () => {
    if (gone) return;
    botoes.replaceChildren(...BOTOES.map(([k, nome, ico]) => { const b = h('button', { type: 'button', class: `pp-b${aberto === k ? ' on' : ''}`, 'aria-pressed': String(aberto === k), 'data-k': k }, h('span', { class: 'pp-ic' }), h('span', {}, nome)); b.querySelector('.pp-ic').innerHTML = ico;
      b.addEventListener('click', () => { if (k === 'afinador' || k === 'metronomo') { location.hash = `#/${k}`; return; } aberto = aberto === k ? '' : k; pinta(); }); return b; }));
    if (aberto === 'partitura') painel.replaceChildren(h('h2', { class: 'pt-s' }, 'Partitura'), h('button', { type: 'button', class: 'pb ouro pp-nova', onclick: () => abre('') }, '+ Nova partitura (teclado)'), h('p', { class: 'pt-mudo' }, 'violão (tablatura) e bateria chegam na próxima etapa.'),
      h('h2', { class: 'pt-s' }, 'Recentes'), recentes.length ? h('ul', { class: 'pt-lista' }, ...recentes.slice(0, 6).map((r) => h('li', {}, h('button', { type: 'button', class: 'pp-r', onclick: () => abre(r.id) }, h('b', {}, r.nome), h('span', {}, quandoTxt(r.atualizado_em)))))) : h('p', { class: 'pt-mudo' }, 'as partituras que você guardar na pasta online aparecem aqui.'));
    else if (aberto === 'codigos') painel.replaceChildren(h('h2', { class: 'pt-s' }, 'Códigos'), h('p', {}, 'Os códigos servem para os seus alunos entrarem no Beaterista PLAY com o acesso que você liberar.'), h('p', { class: 'pt-mudo' }, 'Essa ligação com o PLAY ainda não está ativa. Quando estiver, você gera e acompanha os códigos aqui, e o PLAY continua protegido por padrão.'));
    else painel.replaceChildren();
  };
  host.append(h('div', { class: 'pt pp' }, h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Pedaleira'), h('h1', {}, 'Suas ferramentas'))), botoes, painel)); pinta();
  NUV.listar().then((l) => { recentes = l || []; if (aberto === 'partitura') pinta(); }).catch(() => {});
  return () => { gone = true; };
}
