// Início: atalhos pro que o professor mais usa (estúdio, arsenal, repertório, pastas) e as aulas mais recentes. Números reais da conta.
import { h, vazio } from './ui.js';
import * as D from './dados.js';
import * as NUV from '../partitura-nuvem.js';

export async function mount(host, ctx) {
  let gone = false; const raiz = h('div', { class: 'pt' }); host.append(raiz);
  let aulas = []; let favs = []; let part = [];
  try { [aulas, favs] = await Promise.all([D.listar('pro_aulas', { ordem: 'atualizado_em.desc', limite: 50 }), D.listar('pro_favoritos', { limite: 1000 }).catch(() => [])]); }
  catch (e) { raiz.append(vazio('Não deu para carregar', D.textoErro(e))); return () => {}; }
  try { part = await NUV.listar(); } catch { /* pasta online indisponível: só não conta */ }
  if (gone) return () => {};
  const hoje = new Date(); const dia = hoje.getHours() < 12 ? 'Bom dia' : hoje.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const num = (n, t, href) => h('a', { class: 'pi-n', href }, h('b', {}, n), h('span', {}, t));
  const atalho = (href, t, x) => h('a', { class: 'pi-at', href }, h('b', {}, t), h('span', {}, x));
  const recentes = aulas.filter((a) => !a.modelo).slice(0, 5);
  raiz.append(h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(hoje)), h('h1', {}, `${dia}${ctx.perfil.nome ? `, ${ctx.perfil.nome.split(' ')[0]}` : ''}.`))),
    h('div', { class: 'pi-nums' }, num(part.length, part.length === 1 ? 'partitura' : 'partituras', '#/biblioteca'), num(favs.length, favs.length === 1 ? 'favorito do arsenal' : 'favoritos do arsenal', '#/biblioteca'), num(aulas.filter((a) => !a.modelo).length, 'aulas planejadas', '#/biblioteca'), num(aulas.filter((a) => a.modelo).length, 'modelos', '#/biblioteca')),
    h('div', { class: 'pi-ats' }, atalho('#/estudio', 'Criar partitura', 'teclado, violão, guitarra, baixo e bateria'), atalho('#/arsenal', 'Arsenal', 'exercícios prontos pra estudar e ensinar'), atalho('#/repertorio', 'Repertório', 'músicas pra aprender e ensinar'), atalho('#/biblioteca', 'Minhas pastas', 'seus favoritos e partituras organizados')),
    h('section', {}, h('h2', { class: 'pt-s' }, 'Aulas recentes'), recentes.length ? h('ul', { class: 'pt-lista' }, ...recentes.map((a) => h('li', {}, h('a', { href: `#/aulas/${a.id}` }, h('b', {}, a.titulo), h('span', {}, [a.instrumento, a.duracao_min ? `${a.duracao_min} min` : ''].filter(Boolean).join(' · ')))))) : h('p', { class: 'pt-mudo' }, 'Nenhuma aula ainda. ', h('a', { href: '#/aulas/nova' }, 'Planeje a primeira'), '.')));
  return () => { gone = true; };
}
