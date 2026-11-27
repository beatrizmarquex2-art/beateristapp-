// Pedaleira dos professores: 4 botões redondos (Partitura · Afinador · Metrônomo · Códigos). A Partitura abre um painel: nova, recentes e instrumento.
// O metrônomo já tem o tap tempo e o loop do YouTube dentro. Só a Bea e os professores chegam aqui.
import { h } from '../util.js';
import * as store from '../store.js';
import * as NUV from '../partitura-nuvem.js';
import { quando, seta } from './partitura-palco.js';

const INSTR = [['teclado', 'Teclado', '#/editor'], ['bateria', 'Bateria', '#/partitura']];
const ic = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BOTOES = [
  ['partitura', 'Partitura', ic('M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm11-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3z')],
  ['afinador', 'Afinador', ic('M12 3v10M7 8l5 5 5-5M5 20h14')],
  ['metronomo', 'Metrônomo', ic('M8 21h8l-2-17h-4zM12 14l5-6')],
  ['codigos', 'Códigos', ic('M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3')],
];
const ROTA = { afinador: '#/ouvido', metronomo: '#/metronomo', codigos: '#/codigos' };

export function mount(host) {
  let aberto = ''; let inst = 0; let gone = false; let recentes = [];
  const painel = h('div', { class: 'fp-painel', 'aria-live': 'polite' });
  const botoes = h('div', { class: 'fp-botoes', role: 'group', 'aria-label': 'Ferramentas' });
  const abrePart = (rota, novo, id) => { try { if (novo) sessionStorage.setItem('pm-novo', '1'); if (id) sessionStorage.setItem('pm-abrir', id); } catch { /* sem sessionStorage */ } location.hash = rota; };
  const pinta = () => {
    if (gone) return;
    botoes.replaceChildren(...BOTOES.map(([k, nome, ico]) => { const b = h('button', { type: 'button', class: `fp-b${aberto === k ? ' on' : ''}`, 'aria-pressed': String(aberto === k), 'data-k': k }, h('span', { class: 'fp-ic', html: ico }), h('span', {}, nome)); b.querySelector('.fp-ic').innerHTML = ico; b.addEventListener('click', () => { if (ROTA[k]) { location.hash = ROTA[k]; return; } aberto = aberto === k ? '' : k; pinta(); }); return b; }));
    if (aberto !== 'partitura') { painel.replaceChildren(); return; }
    const [, nome, rota] = INSTR[inst];
    painel.replaceChildren(
      h('h2', { class: 'fp-h' }, 'Partitura'),
      seta('instrumento', nome, () => { inst = (inst + INSTR.length - 1) % INSTR.length; pinta(); }, () => { inst = (inst + 1) % INSTR.length; pinta(); }),
      h('button', { type: 'button', class: 'btn primary fp-nova', onclick: () => abrePart(rota, true) }, '+ Nova partitura'),
      h('h3', { class: 'fp-h3' }, 'Recentes'),
      recentes.length ? h('ul', { class: 'fp-rec' }, ...recentes.slice(0, 6).map((r) => h('li', {}, h('button', { type: 'button', class: 'fp-r', onclick: () => abrePart('#/editor', false, r.id) }, h('b', {}, r.nome), h('small', {}, quando(r.atualizado_em)))))) : h('p', { class: 'muted' }, 'suas partituras guardadas na pasta online aparecem aqui.'));
  };
  host.append(h('div', { class: 'fp bmr' }, h('h1', { class: 'fp-t' }, 'Ferramentas'), botoes, painel));
  pinta();
  try { void store; NUV.listar().then((l) => { recentes = (l || []).sort((a, b) => String(b.atualizado_em).localeCompare(String(a.atualizado_em))); if (aberto === 'partitura') pinta(); }).catch(() => {}); } catch { /* sem pasta online */ }
  return () => { gone = true; };
}
