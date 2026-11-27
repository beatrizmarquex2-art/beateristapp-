// Pedaleira: 4 botões redondos (Partitura, Afinador, Metrônomo, Códigos). Partitura e Códigos abrem um painel; Afinador e Metrônomo abrem a ferramenta.
import { h } from './ui.js';
import * as NUV from '../partitura-nuvem.js';
import { quandoTxt } from './ui.js';
import { cicla } from '../views/partitura-palco.js';
import { rotaDe } from './editor-ritmico.js';
import { INSTRUMENTOS } from './ritmo.js';

const INSTS = [['teclas', 'teclado'], ['violao', 'violão'], ['guitarra', 'guitarra'], ['baixo', 'baixo'], ['bateria', 'bateria']];

const ic = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BOTOES = [
  ['partitura', 'Partitura', ic('M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm11-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3z')],
  ['afinador', 'Afinador', ic('M2 12h4l2-6 4 12 3-9 2 3h5')],
  ['metronomo', 'Metrônomo', ic('M8 21h8l-2-17h-4zM12 14l5-6')],
  ['codigos', 'Códigos', ic('M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3')],
];
export function mount(host) {
  let aberto = ''; let recentes = []; let gone = false; let inst = 'teclas'; let ncord = 6;
  const painel = h('section', { class: 'pp-painel', 'aria-live': 'polite' }); const botoes = h('div', { class: 'pp-botoes', role: 'group', 'aria-label': 'Ferramentas' });
  const abre = (id, instr = inst) => { try { sessionStorage.setItem(id ? 'pm-abrir' : 'pm-novo', id || '1'); if (!id && INSTRUMENTOS[instr]) sessionStorage.setItem('pm-cordas', String(ncord)); } catch { /* sem sessionStorage */ } location.hash = rotaDe(id ? instr : instr); };
  const pinta = () => {
    if (gone) return;
    botoes.replaceChildren(...BOTOES.map(([k, nome, ico]) => { const b = h('button', { type: 'button', class: `pp-b${aberto === k ? ' on' : ''}`, 'aria-pressed': String(aberto === k), 'data-k': k }, h('span', { class: 'pp-ic' }), h('span', {}, nome)); b.querySelector('.pp-ic').innerHTML = ico;
      b.addEventListener('click', () => { if (k === 'afinador' || k === 'metronomo') { location.hash = `#/${k}`; return; } aberto = aberto === k ? '' : k; pinta(); }); return b; }));
    if (aberto === 'partitura') {
      const ops = INSTRUMENTOS[inst] ? Object.keys(INSTRUMENTOS[inst].opcoes).map(Number) : []; if (ops.length && !ops.includes(ncord)) ncord = ops[0];
      painel.replaceChildren(h('h2', { class: 'pt-s' }, 'Partitura'), cicla('instrumento', INSTS, inst, (v) => { inst = v; if (INSTRUMENTOS[v]) ncord = Object.keys(INSTRUMENTOS[v].opcoes).map(Number)[0]; pinta(); }),
        ops.length > 1 ? cicla('cordas', ops.map((n) => [n, `${n} cordas`]), ncord, (n) => { ncord = n; pinta(); }) : null,
        h('button', { type: 'button', class: 'pb ouro pp-nova', onclick: () => abre('') }, `+ Nova partitura de ${INSTS.find((x) => x[0] === inst)[1]}`),
        h('p', { class: 'pt-mudo' }, inst === 'teclas' ? 'pauta com clave, notas coloridas e microfone.' : inst === 'bateria' ? 'pauta de bateria com kits, mão D/E, acento e nota fantasma.' : 'tablatura com acordes; o microfone escreve a casa que você toca.'),
        h('h2', { class: 'pt-s' }, 'Recentes'), recentes.length ? h('ul', { class: 'pt-lista' }, ...recentes.slice(0, 6).map((r) => h('li', {}, h('button', { type: 'button', class: 'pp-r', onclick: () => abre(r.id, r.instrumento) }, h('b', {}, r.nome), h('span', {}, `${(INSTS.find((x) => x[0] === r.instrumento) || [, r.instrumento])[1]} · ${quandoTxt(r.atualizado_em)}`))))) : h('p', { class: 'pt-mudo' }, 'as partituras que você guardar na pasta online aparecem aqui.'));
    }
    else if (aberto === 'codigos') painel.replaceChildren(h('h2', { class: 'pt-s' }, 'Códigos'), h('p', {}, 'Os códigos servem para os seus alunos entrarem no Beaterista PLAY com o acesso que você liberar.'), h('p', { class: 'pt-mudo' }, 'Essa ligação com o PLAY ainda não está ativa. Quando estiver, você gera e acompanha os códigos aqui, e o PLAY continua protegido por padrão.'));
    else painel.replaceChildren();
  };
  host.append(h('div', { class: 'pt pp' }, h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Pedaleira'), h('h1', {}, 'Suas ferramentas'))), botoes, painel)); pinta();
  NUV.listar().then((l) => { recentes = l || []; if (aberto === 'partitura') pinta(); }).catch(() => {});
  return () => { gone = true; };
}
