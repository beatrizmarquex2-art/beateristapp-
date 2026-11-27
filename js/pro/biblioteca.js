// Minha biblioteca: aulas, modelos, favoritos e partituras num lugar só, com pastas e busca.
import { h, entrada, aviso, vazio, quandoTxt } from './ui.js';
import * as D from './dados.js';
import * as NUV from '../partitura-nuvem.js';

export async function mount(host) {
  let gone = false; let aulas = []; let part = []; let aba = 'aulas'; let pasta = ''; let busca = ''; let partOk = true;
  const raiz = h('div', { class: 'pt' }); host.append(raiz);
  try { aulas = await D.listar('pro_aulas', { ordem: 'atualizado_em.desc' }); } catch (e) { raiz.append(vazio('Não deu para carregar', D.textoErro(e))); return () => {}; }
  try { part = await NUV.listar(); } catch { partOk = false; }
  const alterna = async (a) => { try { const l = await D.gravar('pro_aulas', { favorito: !a.favorito }, a.id); Object.assign(a, l); desenha(); } catch (er) { aviso(D.textoErro(er)); } };
  function desenha() {
    if (gone) return; const pastas = D.pastasDeAulas(aulas);
    const abas = [['aulas', `Aulas (${aulas.filter((a) => !a.modelo).length})`], ['modelos', `Modelos (${aulas.filter((a) => a.modelo).length})`], ['fav', `Favoritos (${aulas.filter((a) => a.favorito).length})`], ['part', `Partituras${partOk ? ` (${part.length})` : ''}`]];
    const b = entrada({ type: 'search', placeholder: 'Procurar na biblioteca', value: busca, 'aria-label': 'Procurar na biblioteca' }); b.addEventListener('input', () => { busca = b.value; const p = b.selectionStart; desenha(); const n = raiz.querySelector('input[type=search]'); if (n) { n.focus(); n.setSelectionRange(p, p); } });
    let corpo;
    if (aba === 'part') {
      const l = D.filtrar(part, busca);
      corpo = !partOk ? vazio('Partituras indisponíveis', 'A pasta online de partituras ainda não está ligada no servidor.') : l.length ? h('ul', { class: 'pt-lista' }, ...l.map((p) => h('li', {}, h('a', { href: '#/editor', onclick: () => { try { sessionStorage.setItem('pm-abrir', p.id); } catch { /* sem sessionStorage */ } } }, h('b', {}, p.nome), h('span', {}, p.instrumento), h('em', {}, quandoTxt(p.atualizado_em)))))) : vazio('Nenhuma partitura guardada', 'Monte uma no Estúdio e guarde na pasta online.', h('a', { class: 'pb ouro', href: '#/editor' }, 'Abrir o editor'));
    } else {
      let l = aulas.filter((a) => (aba === 'modelos' ? a.modelo : aba === 'fav' ? a.favorito : !a.modelo)); if (pasta) l = l.filter((a) => a.pasta === pasta); l = D.filtrar(l, busca, ['titulo', 'instrumento', 'pasta']);
      corpo = l.length ? h('ul', { class: 'pt-lista' }, ...l.map((a) => h('li', {}, h('a', { href: `#/aulas/${a.id}` }, h('b', {}, a.titulo), h('span', {}, [a.pasta, a.instrumento, D.nomeNivel(a.nivel), `${a.duracao_min} min`].filter(Boolean).join(' · '))), h('button', { type: 'button', class: `pb-i${a.favorito ? ' on' : ''}`, 'aria-pressed': String(!!a.favorito), 'aria-label': a.favorito ? 'Tirar dos favoritos' : 'Favoritar', onclick: () => alterna(a) }, a.favorito ? '★' : '☆')))) : vazio(aulas.length ? 'Nada por aqui' : 'Biblioteca vazia', aulas.length ? 'Nenhum item neste filtro.' : 'As aulas que você criar aparecem aqui, organizadas por pasta.', aulas.length ? null : h('a', { class: 'pb ouro', href: '#/aulas/nova' }, 'Criar aula'));
    }
    raiz.replaceChildren(h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Minha biblioteca'), h('h1', {}, 'Tudo o que você criou'))),
      h('div', { class: 'pt-abas', role: 'tablist' }, ...abas.map(([k, t]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(aba === k), class: aba === k ? 'on' : '', onclick: () => { aba = k; desenha(); } }, t))),
      h('div', { class: 'pt-barra-b' }, b), aba !== 'part' && pastas.length ? h('div', { class: 'pt-pastas' }, h('button', { type: 'button', class: !pasta ? 'on' : '', onclick: () => { pasta = ''; desenha(); } }, 'todas'), ...pastas.map((p) => h('button', { type: 'button', class: pasta === p ? 'on' : '', onclick: () => { pasta = p; desenha(); } }, p))) : null, corpo);
  }
  desenha(); return () => { gone = true; };
}
