// Meus alunos: cadastro, ficha (dados, metas, anotações particulares) e histórico das aulas dadas. Tudo no Supabase, só do próprio professor.
import { h, campo, entrada, area, escolha, dialogo, confirma, aviso, vazio, quandoTxt, ICONE } from './ui.js';
import * as D from './dados.js';

export async function mount(host, ctx, rota) {
  let gone = false; let alunos = []; let eventos = []; let aulas = [];
  const raiz = h('div', { class: 'pt' }); host.append(raiz);
  try { [alunos, eventos, aulas] = await Promise.all([D.listar('pro_alunos', { ordem: 'nome.asc' }), D.listar('pro_eventos', { ordem: 'inicio.desc' }), D.listar('pro_aulas', { ordem: 'titulo.asc' })]); }
  catch (e) { raiz.append(vazio('Não deu para carregar', D.textoErro(e))); return () => {}; }
  if (gone) return () => {};

  const formAluno = (a = {}) => dialogo(a.id ? 'Editar aluno' : 'Novo aluno', (fechar) => {
    const nome = entrada({ value: a.nome || '', maxlength: 80, required: true }); const inst = entrada({ value: a.instrumento || '', maxlength: 40, list: 'pro-inst' });
    const nivel = escolha(D.NIVEIS, a.nivel || 'iniciante'); const idade = entrada({ type: 'number', min: 2, max: 110, value: a.idade || '' }); const contato = entrada({ value: a.contato || '', maxlength: 120, placeholder: 'WhatsApp ou e-mail' });
    const dl = h('datalist', { id: 'pro-inst' }, ...(ctx.perfil.instrumentos || []).map((i) => h('option', { value: i })));
    const f = h('form', { class: 'pd-f' }, campo('Nome', nome), dl, campo('Instrumento', inst), h('div', { class: 'pd-2' }, campo('Nível', nivel), campo('Idade', idade)), campo('Contato', contato), h('div', { class: 'pd-b' }, h('button', { type: 'button', class: 'pb', onclick: fechar }, 'Cancelar'), h('button', { type: 'submit', class: 'pb ouro' }, 'Salvar')));
    f.addEventListener('submit', async (e) => { e.preventDefault(); if (!nome.value.trim()) { aviso('Digite o nome do aluno'); return; }
      try { const l = await D.gravar('pro_alunos', { nome: nome.value.trim(), instrumento: inst.value.trim(), nivel: nivel.value, idade: idade.value ? +idade.value : null, contato: contato.value.trim() }, a.id); fechar(); aviso(a.id ? 'Aluno atualizado' : 'Aluno cadastrado'); const i = alunos.findIndex((x) => x.id === l.id); if (i >= 0) alunos[i] = l; else alunos.push(l); alunos.sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR')); if (!a.id) location.hash = `#/alunos/${l.id}`; else desenha(); } catch (er) { aviso(D.textoErro(er)); } });
    return f;
  });

  const registrar = (a) => dialogo('Registrar aula dada', (fechar) => {
    const hoje = new Date(); const data = entrada({ type: 'date', value: D.dataInput(hoje) }); const hora = entrada({ type: 'time', value: D.horaInput(hoje) }); const dur = entrada({ type: 'number', min: 5, max: 480, value: 50 });
    const plano = escolha([['', '— sem plano —'], ...aulas.map((x) => [x.id, x.titulo])], ''); const nota = area({ placeholder: 'O que foi trabalhado, dificuldades, próximo passo…', maxlength: 4000 });
    const f = h('form', { class: 'pd-f' }, h('div', { class: 'pd-2' }, campo('Dia', data), campo('Hora', hora)), campo('Duração (min)', dur), campo('Plano de aula usado', plano), campo('O que foi trabalhado', nota), h('div', { class: 'pd-b' }, h('button', { type: 'button', class: 'pb', onclick: fechar }, 'Cancelar'), h('button', { type: 'submit', class: 'pb ouro' }, 'Registrar')));
    f.addEventListener('submit', async (e) => { e.preventDefault(); try { const l = await D.gravar('pro_eventos', { aluno_id: a.id, aula_id: plano.value || null, titulo: a.nome, inicio: D.juntaDataHora(data.value, hora.value), duracao_min: +dur.value || 50, status: 'dada', nota: nota.value.trim() }); eventos.unshift(l); fechar(); aviso('Aula registrada no histórico'); desenha(); } catch (er) { aviso(D.textoErro(er)); } });
    return f;
  });

  const ficha = (a) => {
    const salvaCampo = async (corpo) => { try { const l = await D.gravar('pro_alunos', corpo, a.id); Object.assign(a, l); } catch (er) { aviso(D.textoErro(er)); } };
    const metaIn = entrada({ placeholder: 'Nova meta (ex.: tocar a música X no andamento 90)', maxlength: 120 });
    const metas = h('ul', { class: 'pt-metas' });
    const pintaMetas = () => { metas.replaceChildren(...(a.metas || []).map((m, i) => h('li', {}, h('label', { class: 'pt-ck' }, h('input', { type: 'checkbox', checked: !!m.feita, onchange: async (e) => { a.metas[i].feita = e.target.checked; await salvaCampo({ metas: a.metas }); desenha(); } }), h('span', { class: m.feita ? 'feita' : '' }, m.texto)), h('button', { type: 'button', class: 'pb-i peq', 'aria-label': 'Remover meta', onclick: async () => { a.metas.splice(i, 1); await salvaCampo({ metas: a.metas }); desenha(); } }, '×')))); };
    pintaMetas();
    const notas = area({ rows: 6, maxlength: 8000, placeholder: 'Só você vê isto.' }); notas.value = a.notas || ''; notas.addEventListener('change', async () => { await salvaCampo({ notas: notas.value }); aviso('Anotação salva'); });
    const hist = D.historico(eventos, a.id); const prog = Math.round(D.progressoMetas(a.metas) * 100);
    return h('article', { class: 'pt-ficha' },
      h('a', { class: 'pt-volta', href: '#/alunos' }, '← todos os alunos'),
      h('header', { class: 'pt-cab' }, h('h1', {}, a.nome), h('p', { class: 'pt-meta' }, [a.instrumento, D.nomeNivel(a.nivel), a.idade ? `${a.idade} anos` : '', a.contato].filter(Boolean).join(' · ') || 'sem detalhes ainda'),
        h('div', { class: 'pt-acoes' }, h('button', { type: 'button', class: 'pb ouro', onclick: () => registrar(a) }, 'Registrar aula dada'), h('button', { type: 'button', class: 'pb', onclick: () => formAluno(a) }, 'Editar dados'),
          h('button', { type: 'button', class: 'pb', onclick: async () => { await salvaCampo({ ativo: !a.ativo }); aviso(a.ativo ? 'Aluno reativado' : 'Aluno arquivado'); desenha(); } }, a.ativo ? 'Arquivar' : 'Reativar'),
          h('button', { type: 'button', class: 'pb perigo', onclick: async () => { if (await confirma('Apagar aluno?', `${a.nome} e as anotações dele somem. As aulas marcadas ficam na agenda sem aluno.`)) { try { await D.apagar('pro_alunos', a.id); alunos = alunos.filter((x) => x.id !== a.id); location.hash = '#/alunos'; } catch (er) { aviso(D.textoErro(er)); } } } }, 'Apagar'))),
      h('div', { class: 'pt-colunas' },
        h('section', {}, h('h2', { class: 'pt-s' }, `Metas de aprendizagem${(a.metas || []).length ? ` · ${prog}%` : ''}`), (a.metas || []).length ? h('div', { class: 'pt-barra', role: 'progressbar', 'aria-valuenow': prog }, h('i', { style: { width: `${prog}%` } })) : null, metas,
          h('form', { class: 'pt-add', onsubmit: async (e) => { e.preventDefault(); const t = metaIn.value.trim(); if (!t) return; a.metas = [...(a.metas || []), { texto: t, feita: false }]; await salvaCampo({ metas: a.metas }); desenha(); } }, metaIn, h('button', { type: 'submit', class: 'pb' }, 'Adicionar')),
          h('h2', { class: 'pt-s' }, 'Anotações particulares'), notas),
        h('section', {}, h('h2', { class: 'pt-s' }, `Histórico · ${hist.length} aula${hist.length === 1 ? '' : 's'}`),
          hist.length ? h('ol', { class: 'pt-hist' }, ...hist.map((e) => h('li', {}, h('time', {}, quandoTxt(e.inicio)), h('p', {}, e.nota || 'sem anotação'), (() => { const p = aulas.find((x) => x.id === e.aula_id); return p ? h('small', {}, `plano: ${p.titulo}`) : null; })()))) : h('p', { class: 'pt-mudo' }, 'As aulas que você registrar aparecem aqui, da mais recente para a mais antiga.'))));
  };

  let busca = ''; let mostraArq = false;
  function desenha() {
    if (gone) return; const id = rota[1];
    if (id) { const a = alunos.find((x) => x.id === id); raiz.replaceChildren(a ? ficha(a) : vazio('Aluno não encontrado', 'Ele pode ter sido apagado.', h('a', { class: 'pb', href: '#/alunos' }, 'Voltar'))); return; }
    const ativos = alunos.filter((a) => a.ativo); const lista = D.filtrar(mostraArq ? alunos.filter((a) => !a.ativo) : ativos, busca, ['nome', 'instrumento']);
    const b = entrada({ type: 'search', placeholder: 'Procurar aluno', value: busca, 'aria-label': 'Procurar aluno' }); b.addEventListener('input', () => { busca = b.value; const p = b.selectionStart; desenha(); const n = raiz.querySelector('input[type=search]'); if (n) { n.focus(); n.setSelectionRange(p, p); } });
    raiz.replaceChildren(h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Meus alunos'), h('h1', {}, `${ativos.length} ${ativos.length === 1 ? 'aluno ativo' : 'alunos ativos'}`)), h('button', { type: 'button', class: 'pb ouro', onclick: () => formAluno() }, '+ Novo aluno')),
      h('div', { class: 'pt-barra-b' }, b, h('button', { type: 'button', class: `pb${mostraArq ? ' on' : ''}`, 'aria-pressed': String(mostraArq), onclick: () => { mostraArq = !mostraArq; desenha(); } }, 'arquivados')),
      lista.length ? h('ul', { class: 'pt-lista' }, ...lista.map((a) => { const n = D.historico(eventos, a.id).length; return h('li', {}, h('a', { href: `#/alunos/${a.id}` }, h('b', {}, a.nome), h('span', {}, [a.instrumento, D.nomeNivel(a.nivel)].filter(Boolean).join(' · ')), h('em', {}, `${n} aula${n === 1 ? '' : 's'}`))); })) : vazio(alunos.length ? 'Nada por aqui' : 'Seu primeiro aluno', alunos.length ? 'Nenhum aluno com esse filtro.' : 'Cadastre quem você ensina para acompanhar metas, histórico e agenda.', alunos.length ? null : h('button', { type: 'button', class: 'pb ouro', onclick: () => formAluno() }, 'Cadastrar aluno')));
  }
  desenha();
  return () => { gone = true; };
}
