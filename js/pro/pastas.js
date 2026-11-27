// Pastas do professor: um nome só pras duas coisas que ele guarda — partituras (tabela partituras.pasta) e favoritos do Arsenal/Repertório (pro_favoritos.pasta).
// Pasta vazia (ainda sem nada dentro) fica lembrada no aparelho até ganhar o 1º item.
import { h, entrada, campo, dialogo } from './ui.js';
import * as D from './dados.js';

const VAZIAS = 'pro-pastas-vazias';
export const lerVazias = () => { try { const a = JSON.parse(localStorage.getItem(VAZIAS) || '[]'); return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []; } catch { return []; } };
export const gravaVazias = (a) => { try { localStorage.setItem(VAZIAS, JSON.stringify([...new Set(a)].slice(0, 60))); } catch { /* sem armazenamento */ } };
/** Todas as pastas (partituras + favoritos + vazias), em ordem de A a Z. */
export const todasPastas = (part = [], favs = []) => [...new Set([...part.map((x) => x.pasta), ...favs.map((x) => x.pasta), ...lerVazias()].filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
export const limpaNome = (t) => String(t || '').trim().replace(/\s+/g, ' ').slice(0, 60);

/** Janela "escolher a pasta": devolve o nome escolhido ('' = sem pasta) ou null se cancelou. `extra` = botão a mais (ex.: tirar dos favoritos). */
export function escolhePasta({ titulo = 'Salvar numa pasta', atual = '', pastas = [], ok = 'Salvar' } = {}) {
  return new Promise((res) => {
    let resp = null;
    dialogo(titulo, (fechar) => {
      const dl = h('datalist', { id: 'pro-pastas-sel' }, ...pastas.map((x) => h('option', { value: x })));
      const n = entrada({ value: atual, maxlength: 60, list: 'pro-pastas-sel', placeholder: 'Ex.: Iniciantes, Turma das 14h', 'aria-label': 'Nome da pasta' });
      const chips = pastas.length ? h('div', { class: 'pt-pastas' }, ...pastas.map((x) => h('button', { type: 'button', class: x === atual ? 'on' : '', onclick: () => { n.value = x; } }, x))) : null;
      const f = h('form', { class: 'pd-f' }, dl, chips, campo('Pasta', n, 'toque numa pasta, ou digite um nome novo pra criar. vazio = sem pasta'),
        h('div', { class: 'pd-b' }, h('button', { type: 'button', class: 'pb', onclick: fechar }, 'Cancelar'), h('button', { type: 'submit', class: 'pb ouro' }, ok)));
      f.addEventListener('submit', (e) => { e.preventDefault(); resp = limpaNome(n.value); fechar(); }); setTimeout(() => n.focus(), 60); return f;
    }, { aoFechar: () => res(resp) });
  });
}

/** Favoritos (pro_favoritos). */
export const listarFavoritos = () => D.listar('pro_favoritos', { limite: 2000 });
export async function favoritar(exercicioId, pasta, atual = null) {
  if (atual) return D.gravar('pro_favoritos', { pasta }, atual.id);
  return D.gravar('pro_favoritos', { exercicio_id: exercicioId, pasta });
}
export const desfavoritar = (id) => D.apagar('pro_favoritos', id);
