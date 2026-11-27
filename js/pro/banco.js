// Banco de exercícios pedagógicos: a Bea publica (painel dela), os professores usam: ver, abrir uma cópia no editor, baixar PDF/imagem ou levar pra uma aula.
// Banco = tabela pro_exercicios (supabase/024_pro_banco.sql). Só a Bea escreve (regra no servidor); professores liberados leem os publicados.
import { h, campo, entrada, area, escolha, dialogo, confirma, aviso, vazio } from './ui.js';
import * as D from './dados.js';
import * as NUV from '../partitura-nuvem.js';
import { rotaDe } from './editor-ritmico.js';
import { desenhoDe, exportarPdf, exportarImagem } from './exportar.js';
import { exerciciosIniciais } from './banco-seed.js';

const PASTA_BANCO = 'Banco de exercícios';
const temPartitura = (e) => e.instrumento !== 'geral' && e.dados && Array.isArray(e.dados.evs) && e.dados.evs.length > 0;
const rowDe = (e) => ({ nome: e.titulo, instrumento: e.instrumento, dados: { ...e.dados, bpm: (e.dados && e.dados.bpm) || e.bpm || 100 } });

/** Janela de criar/editar um exercício (só a Bea). `base` = campos iniciais (ex.: vindos do editor). Devolve a linha gravada ou null. */
export function formExercicio(base = {}, { id = '', partituras = [] } = {}) {
  return new Promise((res) => {
    let resp = null;
    dialogo(id ? 'Editar exercício' : 'Novo exercício', (fechar) => {
      const titulo = entrada({ value: base.titulo || '', maxlength: 100, 'aria-label': 'Título' }); const inst = escolha(D.INSTRUMENTOS_BANCO, base.instrumento || 'geral'); const nivel = escolha(D.NIVEIS, base.nivel || 'iniciante');
      const cat = entrada({ value: base.categoria || '', maxlength: 60, placeholder: 'Ex.: Grooves, Rudimentos, Escalas', 'aria-label': 'Categoria' }); const desc = area({ rows: 6, maxlength: 4000, placeholder: 'Como estudar este exercício: o que observar, andamento, erros comuns…' }); desc.value = base.descricao || '';
      const bpm = entrada({ type: 'number', min: 30, max: 260, value: base.bpm || '' }); const ordem = entrada({ type: 'number', min: 0, max: 9999, value: base.ordem ?? 100 }); const pub = h('input', { type: 'checkbox' }); pub.checked = base.publicado !== false;
      const dadosSel = partituras.length ? escolha([['', base.dados && Object.keys(base.dados).length ? '— manter a partitura atual —' : '— sem partitura (só texto) —'], ...partituras.map((p) => [p.id, `${p.nome} (${D.NOME_INSTRUMENTO[p.instrumento] || p.instrumento})`])], '') : null;
      const f = h('form', { class: 'pd-f' }, campo('Título', titulo), h('div', { class: 'pd-2' }, campo('Instrumento', inst), campo('Nível', nivel)), h('div', { class: 'pd-2' }, campo('Categoria', cat), campo('Andamento sugerido (bpm)', bpm)), campo('Como estudar', desc),
        dadosSel ? campo('Partitura do exercício', dadosSel, 'escolha uma das suas partituras guardadas (monte no Estúdio e guarde na pasta online)') : null, h('div', { class: 'pd-2' }, campo('Ordem na categoria', ordem, 'menor aparece primeiro'), h('label', { class: 'pt-ck', style: 'margin-top:26px' }, pub, h('span', {}, 'publicado (os professores veem)'))),
        h('div', { class: 'pd-b' }, h('button', { type: 'button', class: 'pb', onclick: fechar }, 'Cancelar'), h('button', { type: 'submit', class: 'pb ouro' }, id ? 'Salvar' : 'Criar')));
      f.addEventListener('submit', async (e) => { e.preventDefault(); if (!titulo.value.trim()) { titulo.focus(); return; }
        try { let dados = base.dados || {}; if (dadosSel && dadosSel.value) { const row = await NUV.abrir(dadosSel.value); dados = row.dados || {}; if (inst.value === 'geral' || !inst.value) inst.value = row.instrumento; }
          resp = await D.gravar('pro_exercicios', { titulo: titulo.value.trim(), instrumento: inst.value, nivel: nivel.value, categoria: cat.value.trim(), descricao: desc.value.trim(), dados, bpm: bpm.value ? +bpm.value : null, ordem: +ordem.value || 0, publicado: pub.checked }, id); fechar(); aviso(id ? 'exercício atualizado' : 'exercício criado'); } catch (er) { aviso(D.textoErro(er)); } });
      return f;
    }, { largo: true, aoFechar: () => res(resp) });
  });
}
/** Abre o formulário pra publicar um exercício vindo do editor (botão "Publicar no banco"). */
export async function publicarDoEditor({ titulo, instrumento, dados, bpm }) {
  let part = []; try { part = await NUV.listar(); } catch { /* sem pasta online */ }
  return formExercicio({ titulo, instrumento, dados, bpm }, { partituras: part });
}

export async function mount(host, ctx) {
  let gone = false; let lista = []; let fInst = ''; let fNivel = ''; let busca = ''; const admin = !!ctx.admin;
  const raiz = h('div', { class: 'pt' }); host.append(raiz);
  const carrega = async () => { try { lista = await D.listar('pro_exercicios', { ordem: 'instrumento.asc,categoria.asc,ordem.asc,titulo.asc', limite: 1000 }); return true; } catch (e) { raiz.replaceChildren(vazio('Não deu para carregar o banco', D.textoErro(e))); return false; } };
  if (!(await carrega()) || gone) return () => {};

  const copiaPraMim = async (e) => { const r = await NUV.salvar({ nome: e.titulo.slice(0, 60), instrumento: e.instrumento, dados: rowDe(e).dados, pasta: PASTA_BANCO }); return r; };
  const usarNaAula = async (e) => { const dados = { objetivos: '', etapas: [{ tipo: 'pratica', titulo: e.titulo, min: 10, texto: e.descricao || '' }], repertorio: '', materiais: temPartitura(e) ? `Exercício do banco: ${e.titulo}${e.bpm ? ` (${e.bpm} bpm)` : ''}` : '', tarefa: '' };
    const l = await D.gravar('pro_aulas', { titulo: e.titulo.slice(0, 100), instrumento: D.NOME_INSTRUMENTO[e.instrumento] === 'geral' ? '' : (D.NOME_INSTRUMENTO[e.instrumento] || ''), nivel: e.nivel, duracao_min: 30, dados }); return l; };
  const ver = (e) => dialogo(e.titulo, (fechar) => {
    const corpo = h('div', { class: 'pb-ex' }, h('p', { class: 'pt-meta' }, [D.NOME_INSTRUMENTO[e.instrumento], D.nomeNivel(e.nivel), e.bpm ? `${e.bpm} bpm` : '', e.categoria].filter(Boolean).join(' · ')));
    if (temPartitura(e)) { const f = h('div', { class: 'pb-folha' }); try { f.innerHTML = desenhoDe(rowDe(e))(Math.min(560, Math.max(300, innerWidth - 80))).svg; } catch { f.textContent = 'não consegui desenhar a partitura'; } corpo.append(f); }
    corpo.append(h('p', { class: 'pb-desc' }, e.descricao || 'Sem descrição.'));
    const acoes = h('div', { class: 'pm-acoes' });
    const bt = (t, fn, cls = 'pb') => acoes.append(h('button', { type: 'button', class: `${cls} pm-item`, onclick: async (ev) => { const b = ev.currentTarget; b.disabled = true; try { await fn(); } catch (er) { aviso(NUV.textoErro ? D.textoErro(er) : 'erro'); } b.disabled = false; } }, t));
    if (temPartitura(e)) { bt('Abrir no editor (uma cópia sua)', async () => { const r = await copiaPraMim(e); try { sessionStorage.setItem('pm-abrir', r.id); } catch { /* ok */ } fechar(); location.hash = rotaDe(e.instrumento); }, 'pb ouro');
      bt('Guardar na minha biblioteca', async () => { await copiaPraMim(e); aviso(`guardado na pasta "${PASTA_BANCO}" da sua biblioteca`); });
      bt('Baixar PDF', async () => { const r = await exportarPdf(rowDe(e), ctx.perfil); aviso(r.shared ? 'pronto! escolha onde salvar' : `PDF salvo: ${r.name}`); });
      bt('Salvar como imagem', async () => { const r = await exportarImagem(rowDe(e), ctx.perfil); aviso(r.shared ? 'pronto! escolha onde salvar' : `imagem salva: ${r.name}`); }); }
    bt('Usar numa aula', async () => { const l = await usarNaAula(e); fechar(); location.hash = `#/aulas/${l.id}`; }, temPartitura(e) ? 'pb' : 'pb ouro');
    if (admin) { acoes.append(h('hr', { class: 'pm-hr' })); bt('Editar exercício', async () => { fechar(); const part = await NUV.listar().catch(() => []); const l = await formExercicio(e, { id: e.id, partituras: part }); if (l) { await carrega(); desenha(); } });
      bt(e.publicado ? 'Despublicar (esconder dos professores)' : 'Publicar', async () => { await D.gravar('pro_exercicios', { publicado: !e.publicado }, e.id); await carrega(); fechar(); desenha(); });
      bt('Apagar do banco', async () => { fechar(); if (await confirma('Apagar exercício?', `"${e.titulo}" some do banco de todos os professores.`)) { await D.apagar('pro_exercicios', e.id); await carrega(); desenha(); aviso('exercício apagado'); } }, 'pb perigo'); }
    corpo.append(acoes); return corpo;
  }, { largo: true });

  const carregaIniciais = async (b) => { b.disabled = true; let n = 0; try { const tem = new Set(lista.map((x) => x.titulo)); for (const ex of exerciciosIniciais()) { if (tem.has(ex.titulo)) continue; await D.gravar('pro_exercicios', { titulo: ex.titulo, instrumento: ex.instrumento, nivel: ex.nivel, categoria: ex.categoria, descricao: ex.descricao, dados: ex.dados, bpm: ex.bpm, ordem: ex.ordem, publicado: true }); n++; } await carrega(); aviso(n ? `${n} exercícios iniciais carregados` : 'os exercícios iniciais já estão no banco'); desenha(); } catch (er) { aviso(D.textoErro(er)); } b.disabled = false; };

  function desenha() {
    if (gone) return; let l = lista.filter((e) => (!fInst || e.instrumento === fInst) && (!fNivel || e.nivel === fNivel)); l = D.filtrar(l, busca, ['titulo', 'categoria', 'descricao']);
    const b = entrada({ type: 'search', placeholder: 'Procurar exercício', value: busca, 'aria-label': 'Procurar exercício' }); b.addEventListener('input', () => { busca = b.value; const p = b.selectionStart; desenha(); const n = raiz.querySelector('input[type=search]'); if (n) { n.focus(); n.setSelectionRange(p, p); } });
    const chips = (valor, ops, set, todas) => h('div', { class: 'pt-pastas' }, h('button', { type: 'button', class: !valor ? 'on' : '', onclick: () => { set(''); desenha(); } }, todas), ...ops.map(([v, t]) => h('button', { type: 'button', class: valor === v ? 'on' : '', onclick: () => { set(v); desenha(); } }, t)));
    const grupos = D.porCategoria(l);
    raiz.replaceChildren(h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, admin ? 'Banco de exercícios · painel da Bea' : 'Banco de exercícios'), h('h1', {}, 'Exercícios para a aula')),
        admin ? h('div', { class: 'pt-acoes' }, h('button', { type: 'button', class: 'pb ouro', onclick: async () => { const part = await NUV.listar().catch(() => []); const r = await formExercicio({}, { partituras: part }); if (r) { await carrega(); desenha(); } } }, '+ Novo exercício'), h('button', { type: 'button', class: 'pb', onclick: (e) => carregaIniciais(e.currentTarget) }, 'Carregar exercícios iniciais')) : null),
      h('div', { class: 'pt-barra-b' }, b), chips(fInst, D.INSTRUMENTOS_BANCO.map(([v, t]) => [v, t.replace(' (sem partitura)', '')]), (v) => { fInst = v; }, 'todos os instrumentos'), chips(fNivel, D.NIVEIS, (v) => { fNivel = v; }, 'todos os níveis'),
      grupos.length ? h('div', {}, ...grupos.map((g) => h('section', {}, h('h2', { class: 'pt-s' }, g.categoria), h('ul', { class: 'pt-lista' }, ...g.itens.map((e) => h('li', {}, h('button', { type: 'button', class: 'pb-li', onclick: () => ver(e) }, h('b', {}, e.titulo), h('span', {}, [D.NOME_INSTRUMENTO[e.instrumento], D.nomeNivel(e.nivel), e.bpm ? `${e.bpm} bpm` : '', temPartitura(e) ? 'com partitura' : 'texto'].filter(Boolean).join(' · ')), !e.publicado ? h('em', {}, 'rascunho') : null)))))))
        : vazio(lista.length ? 'Nada com esse filtro' : 'O banco ainda está vazio', admin ? 'Clique em "Carregar exercícios iniciais" pra começar com um conjunto pronto, ou crie o seu.' : 'Em breve, exercícios prontos por instrumento e nível.'));
  }
  desenha(); return () => { gone = true; };
}
