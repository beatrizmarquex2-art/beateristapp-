// Início: o dia do professor (aulas de hoje, próximas) e os números reais da conta.
import { h, vazio } from './ui.js';
import * as D from './dados.js';

export async function mount(host, ctx) {
  let gone = false; const raiz = h('div', { class: 'pt' }); host.append(raiz);
  let alunos = []; let aulas = []; let eventos = [];
  try { [alunos, aulas, eventos] = await Promise.all([D.listar('pro_alunos'), D.listar('pro_aulas', { ordem: 'atualizado_em.desc', limite: 50 }), D.listar('pro_eventos', { ordem: 'inicio.asc', limite: 1000 })]); }
  catch (e) { raiz.append(vazio('Não deu para carregar', D.textoErro(e))); return () => {}; }
  if (gone) return () => {};
  const hoje = new Date(); const dia = hoje.getHours() < 12 ? 'Bom dia' : hoje.getHours() < 18 ? 'Boa tarde' : 'Boa noite';
  const deHoje = D.doDia(eventos, hoje).filter((e) => e.status !== 'cancelada'); const prox = eventos.filter((e) => e.status === 'marcada' && new Date(e.inicio) > hoje && !D.mesmoDia(e.inicio, hoje)).slice(0, 5);
  const nomeAl = (id) => (alunos.find((a) => a.id === id) || {}).nome || '';
  const num = (n, t, href) => h('a', { class: 'pi-n', href }, h('b', {}, n), h('span', {}, t));
  const li = (e) => h('li', {}, h('a', { href: '#/agenda' }, h('time', {}, `${new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit' }).format(new Date(e.inicio))} · ${D.horaInput(e.inicio)}`), h('b', {}, e.titulo || nomeAl(e.aluno_id) || 'Aula'), h('span', {}, nomeAl(e.aluno_id))));
  raiz.append(h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(hoje)), h('h1', {}, `${dia}${ctx.perfil.nome ? `, ${ctx.perfil.nome.split(' ')[0]}` : ''}.`))),
    h('div', { class: 'pi-nums' }, num(deHoje.length, deHoje.length === 1 ? 'aula hoje' : 'aulas hoje', '#/agenda'), num(alunos.filter((a) => a.ativo).length, 'alunos ativos', '#/alunos'), num(aulas.filter((a) => !a.modelo).length, 'aulas planejadas', '#/biblioteca'), num(aulas.filter((a) => a.modelo).length, 'modelos', '#/biblioteca')),
    h('div', { class: 'pt-colunas' },
      h('section', {}, h('h2', { class: 'pt-s' }, 'Hoje'), deHoje.length ? h('ul', { class: 'pt-lista' }, ...deHoje.map(li)) : h('p', { class: 'pt-mudo' }, 'Nenhuma aula marcada para hoje.')),
      h('section', {}, h('h2', { class: 'pt-s' }, 'Próximas'), prox.length ? h('ul', { class: 'pt-lista' }, ...prox.map(li)) : h('p', { class: 'pt-mudo' }, 'Nada marcado à frente. Abra a agenda para marcar.'))),
    !alunos.length && !aulas.length ? h('div', { class: 'pi-comeco' }, h('h2', { class: 'pt-s' }, 'Por onde começar'), h('ol', {}, h('li', {}, h('a', { href: '#/alunos' }, 'Cadastre seus alunos')), h('li', {}, h('a', { href: '#/aulas/nova' }, 'Planeje uma aula')), h('li', {}, h('a', { href: '#/agenda' }, 'Marque na agenda')))) : null);
  return () => { gone = true; };
}
