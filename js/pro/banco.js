// Arsenal de exercícios e Repertório (mesma tabela, `tipo`): a Bea publica (painel dela), os professores usam: ver, abrir uma cópia no editor, baixar PDF/imagem ou levar pra uma aula.
// Banco = tabela pro_exercicios (supabase/024_pro_banco.sql). Só a Bea escreve (regra no servidor); professores liberados leem os publicados.
import { h, campo, entrada, area, escolha, dialogo, confirma, aviso, vazio } from './ui.js';
import * as D from './dados.js';
import * as NUV from '../partitura-nuvem.js';
import { rotaDe } from './editor-ritmico.js';
import { desenhoDe, exportarPdf, exportarImagem } from './exportar.js';
import { exerciciosIniciais, repertorioInicial } from './banco-seed.js';
import * as PA from './pastas.js';

const PASTA_BANCO = 'Banco de exercícios';
const temPartitura = (e) => e.instrumento !== 'geral' && e.dados && Array.isArray(e.dados.evs) && e.dados.evs.length > 0;
const rowDe = (e) => ({ nome: e.titulo, instrumento: e.instrumento, dados: { ...e.dados, bpm: (e.dados && e.dados.bpm) || e.bpm || 100 } });

/** Janela de criar/editar um exercício (só a Bea). `base` = campos iniciais (ex.: vindos do editor). Devolve a linha gravada ou null. */
export function formExercicio(base = {}, { id = '', partituras = [], tipo = base.tipo || 'exercicio' } = {}) {
  return new Promise((res) => {
    let resp = null;
    const rep = tipo === 'repertorio'; dialogo(id ? (rep ? 'Editar música' : 'Editar exercício') : (rep ? 'Nova música' : 'Novo exercício'), (fechar) => {
      const titulo = entrada({ value: base.titulo || '', maxlength: 100, 'aria-label': 'Título' }); const artista = entrada({ value: base.artista || '', maxlength: 100, 'aria-label': 'Artista' }); const inst = escolha(D.INSTRUMENTOS_BANCO, base.instrumento || 'geral'); const nivel = escolha(D.NIVEIS, base.nivel || 'iniciante');
      const cat = entrada({ value: base.categoria || '', maxlength: 60, placeholder: 'Ex.: Grooves, Rudimentos, Escalas', 'aria-label': 'Categoria' }); const desc = area({ rows: 6, maxlength: 4000, placeholder: 'Como estudar este exercício: o que observar, andamento, erros comuns…' }); desc.value = base.descricao || '';
      const bpm = entrada({ type: 'number', min: 30, max: 260, value: base.bpm || '' }); const ordem = entrada({ type: 'number', min: 0, max: 9999, value: base.ordem ?? 100 }); const pub = h('input', { type: 'checkbox' }); pub.checked = base.publicado !== false;
      const dadosSel = partituras.length ? escolha([['', base.dados && Object.keys(base.dados).length ? '— manter a partitura atual —' : '— sem partitura (só texto) —'], ...partituras.map((p) => [p.id, `${p.nome} (${D.NOME_INSTRUMENTO[p.instrumento] || p.instrumento})`])], '') : null;
      const f = h('form', { class: 'pd-f' }, campo('Título', titulo), rep ? campo('Artista', artista) : null, h('div', { class: 'pd-2' }, campo('Instrumento', inst), campo('Nível', nivel)), h('div', { class: 'pd-2' }, campo(rep ? 'Gênero' : 'Categoria', cat), campo('Andamento sugerido (bpm)', bpm)), campo(rep ? 'O que estudar' : 'Como estudar', desc),
        dadosSel ? campo('Partitura do exercício', dadosSel, 'escolha uma das suas partituras guardadas (monte no Estúdio e guarde na pasta online)') : null, h('div', { class: 'pd-2' }, campo('Ordem na categoria', ordem, 'menor aparece primeiro'), h('label', { class: 'pt-ck', style: 'margin-top:26px' }, pub, h('span', {}, 'publicado (os professores veem)'))),
        h('div', { class: 'pd-b' }, h('button', { type: 'button', class: 'pb', onclick: fechar }, 'Cancelar'), h('button', { type: 'submit', class: 'pb ouro' }, id ? 'Salvar' : 'Criar')));
      f.addEventListener('submit', async (e) => { e.preventDefault(); if (!titulo.value.trim()) { titulo.focus(); return; }
        try { let dados = base.dados || {}; if (dadosSel && dadosSel.value) { const row = await NUV.abrir(dadosSel.value); dados = row.dados || {}; if (inst.value === 'geral' || !inst.value) inst.value = row.instrumento; }
          resp = await D.gravar('pro_exercicios', { tipo, artista: artista.value.trim(), titulo: titulo.value.trim(), instrumento: inst.value, nivel: nivel.value, categoria: cat.value.trim(), descricao: desc.value.trim(), dados, bpm: bpm.value ? +bpm.value : null, ordem: +ordem.value || 0, publicado: pub.checked }, id); fechar(); aviso(id ? 'atualizado' : 'criado'); } catch (er) { aviso(D.textoErro(er)); } });
      return f;
    }, { largo: true, aoFechar: () => res(resp) });
  });
}
/** Abre o formulário pra publicar um exercício vindo do editor (botão "Publicar no banco"). */
export async function publicarDoEditor({ titulo, instrumento, dados, bpm }) {
  let part = []; try { part = await NUV.listar(); } catch { /* sem pasta online */ }
  return formExercicio({ titulo, instrumento, dados, bpm }, { partituras: part });
}

export async function mount(host, ctx, _partes, { tipo = 'exercicio' } = {}) {
  let gone = false; let lista = []; let fInst = ''; let fNivel = ''; let fCat = ''; let busca = ''; const admin = !!ctx.admin; const rep = tipo === 'repertorio';
  const NOME = rep ? { ov: 'Repertório', h1: 'Músicas para aprender e ensinar', novo: '+ Nova música', iniciais: 'Carregar repertório inicial', vazioT: 'O repertório ainda está vazio', vazioA: 'Clique em "Carregar repertório inicial" pra começar com uma lista pronta, ou crie a sua.', vazioP: 'Em breve, músicas organizadas por gênero e nível.' } : { ov: 'Arsenal', h1: 'Exercícios para a aula', novo: '+ Novo exercício', iniciais: 'Carregar exercícios iniciais', vazioT: 'O arsenal ainda está vazio', vazioA: 'Clique em "Carregar exercícios iniciais" pra começar com um conjunto pronto, ou crie o seu.', vazioP: 'Em breve, exercícios prontos por instrumento e nível.' };
  const raiz = h('div', { class: 'pt' }); host.append(raiz);
  const carrega = async () => { try { lista = await D.listar('pro_exercicios', { ordem: 'instrumento.asc,categoria.asc,ordem.asc,titulo.asc', limite: 2000, filtros: { tipo: `eq.${tipo}` } }); return true; } catch (e) { raiz.replaceChildren(vazio('Não deu para carregar', D.textoErro(e))); return false; } };
  if (!(await carrega()) || gone) return () => {};
  let favs = []; let favOk = true; let partPastas = [];
  const carregaFavs = async () => { try { favs = await PA.listarFavoritos(); favOk = true; } catch { favs = []; favOk = false; } }; await carregaFavs();
  try { partPastas = await NUV.listar(); } catch { /* sem pasta online: só as pastas dos favoritos */ }
  const favDe = (e) => favs.find((f) => f.exercicio_id === e.id) || null;
  const guardarPasta = async (e) => { const atual = favDe(e); const pasta = await PA.escolhePasta({ titulo: atual ? 'Mudar de pasta' : 'Salvar numa pasta', atual: atual ? atual.pasta : '', pastas: PA.todasPastas(partPastas, favs) }); if (pasta === null) return false; await PA.favoritar(e.id, pasta, atual); if (pasta) PA.gravaVazias(PA.lerVazias().filter((x) => x !== pasta)); await carregaFavs(); aviso(pasta ? `salvo na pasta "${pasta}"` : 'salvo nos seus favoritos (sem pasta)'); return true; };

  const copiaPraMim = async (e) => { const r = await NUV.salvar({ nome: e.titulo.slice(0, 60), instrumento: e.instrumento, dados: rowDe(e).dados, pasta: PASTA_BANCO }); return r; };
  const usarNaAula = async (e) => { const dados = { objetivos: '', etapas: [{ tipo: 'pratica', titulo: e.titulo, min: 10, texto: e.descricao || '' }], repertorio: rep ? `${e.titulo} — ${e.artista}` : '', materiais: temPartitura(e) ? `Exercício do banco: ${e.titulo}${e.bpm ? ` (${e.bpm} bpm)` : ''}` : '', tarefa: '' };
    const l = await D.gravar('pro_aulas', { titulo: (rep ? `${e.titulo} — ${e.artista}` : e.titulo).slice(0, 100), instrumento: D.NOME_INSTRUMENTO[e.instrumento] === 'geral' ? '' : (D.NOME_INSTRUMENTO[e.instrumento] || ''), nivel: e.nivel, duracao_min: 30, dados }); return l; };
  const ver = (e) => dialogo(e.titulo, (fechar) => {
    const corpo = h('div', { class: 'pb-ex' }, h('p', { class: 'pt-meta' }, [e.artista, rep ? '' : D.NOME_INSTRUMENTO[e.instrumento], D.nomeNivel(e.nivel), e.bpm ? `${e.bpm} bpm` : '', e.categoria].filter(Boolean).join(' · ')));
    if (temPartitura(e)) { const f = h('div', { class: 'pb-folha' }); try { f.innerHTML = desenhoDe(rowDe(e))(Math.min(560, Math.max(300, innerWidth - 80))).svg; } catch { f.textContent = 'não consegui desenhar a partitura'; } corpo.append(f); }
    corpo.append(h('p', { class: 'pb-desc' }, e.descricao || 'Sem descrição.'));
    const acoes = h('div', { class: 'pm-acoes' });
    const bt = (t, fn, cls = 'pb') => acoes.append(h('button', { type: 'button', class: `${cls} pm-item`, onclick: async (ev) => { const b = ev.currentTarget; b.disabled = true; try { await fn(); } catch (er) { aviso(NUV.textoErro ? D.textoErro(er) : 'erro'); } b.disabled = false; } }, t));
    if (favOk) { const f0 = favDe(e); bt(f0 ? `★ Na pasta: ${f0.pasta || 'sem pasta'} · mudar` : '★ Salvar numa pasta', async () => { if (await guardarPasta(e)) { fechar(); desenha(); } }, 'pb ouro'); if (f0) bt('Tirar dos favoritos', async () => { await PA.desfavoritar(f0.id); await carregaFavs(); fechar(); desenha(); aviso('tirado dos favoritos'); }); }
    if (temPartitura(e)) { bt('Abrir no editor (uma cópia sua)', async () => { const r = await copiaPraMim(e); try { sessionStorage.setItem('pm-abrir', r.id); } catch { /* ok */ } fechar(); location.hash = rotaDe(e.instrumento); }, 'pb ouro');
      bt('Guardar na minha biblioteca', async () => { await copiaPraMim(e); aviso(`guardado na pasta "${PASTA_BANCO}" da sua biblioteca`); });
      bt('Baixar PDF', async () => { const r = await exportarPdf(rowDe(e), ctx.perfil); aviso(r.shared ? 'pronto! escolha onde salvar' : `PDF salvo: ${r.name}`); });
      bt('Salvar como imagem', async () => { const r = await exportarImagem(rowDe(e), ctx.perfil); aviso(r.shared ? 'pronto! escolha onde salvar' : `imagem salva: ${r.name}`); }); }
    if (rep) acoes.append(h('a', { class: 'pb pm-item', href: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${e.titulo} ${e.artista}`)}`, target: '_blank', rel: 'noopener' }, 'Procurar no YouTube'));
    bt('Usar numa aula', async () => { const l = await usarNaAula(e); fechar(); location.hash = `#/aulas/${l.id}`; }, temPartitura(e) ? 'pb' : 'pb ouro');
    if (admin) { acoes.append(h('hr', { class: 'pm-hr' })); bt('Editar exercício', async () => { fechar(); const part = await NUV.listar().catch(() => []); const l = await formExercicio(e, { id: e.id, partituras: part, tipo }); if (l) { await carrega(); desenha(); } });
      bt(e.publicado ? 'Despublicar (esconder dos professores)' : 'Publicar', async () => { await D.gravar('pro_exercicios', { publicado: !e.publicado }, e.id); await carrega(); fechar(); desenha(); });
      bt(rep ? 'Apagar do repertório' : 'Apagar do banco', async () => { fechar(); if (await confirma(rep ? 'Apagar música?' : 'Apagar exercício?', `"${e.titulo}" some de todos os professores.`)) { await D.apagar('pro_exercicios', e.id); await carrega(); desenha(); aviso('exercício apagado'); } }, 'pb perigo'); }
    corpo.append(acoes); return corpo;
  }, { largo: true });

  const carregaIniciais = async (b) => { b.disabled = true; try { const tem = new Set(lista.map((x) => x.titulo)); const novos = (rep ? repertorioInicial() : exerciciosIniciais()).filter((ex) => !tem.has(ex.titulo)).map((ex) => ({ tipo: ex.tipo, titulo: ex.titulo, artista: ex.artista || '', instrumento: ex.instrumento, nivel: ex.nivel, categoria: ex.categoria, descricao: ex.descricao, dados: ex.dados, bpm: ex.bpm, ordem: ex.ordem, publicado: true })); const n = novos.length ? await D.gravarLote('pro_exercicios', novos) : 0; await carrega(); aviso(n ? `${n} ${rep ? 'músicas carregadas' : 'exercícios carregados'}` : 'o que vem pronto já está carregado'); desenha(); } catch (er) { aviso(D.textoErro(er)); } b.disabled = false; };

  function desenha() {
    if (gone) return; const base1 = lista.filter((e) => (!fInst || e.instrumento === fInst) && (!fNivel || e.nivel === fNivel)); const cats = [...new Set(base1.map((e) => e.categoria || 'Sem categoria'))];
    if (fCat && !cats.includes(fCat)) fCat = '';
    let l = base1.filter((e) => !fCat || (e.categoria || 'Sem categoria') === fCat); l = D.filtrar(l, busca, ['titulo', 'categoria', 'descricao', 'artista']);
    const b = entrada({ type: 'search', placeholder: rep ? 'Procurar música ou artista' : 'Procurar exercício', value: busca, 'aria-label': 'Procurar' }); b.addEventListener('input', () => { busca = b.value; const p = b.selectionStart; desenha(); const n = raiz.querySelector('input[type=search]'); if (n) { n.focus(); n.setSelectionRange(p, p); } });
    const chips = (valor, ops, set, todas) => h('div', { class: 'pt-pastas' }, h('button', { type: 'button', class: !valor ? 'on' : '', onclick: () => { set(''); desenha(); } }, todas), ...ops.map(([v, t]) => h('button', { type: 'button', class: valor === v ? 'on' : '', onclick: () => { set(v); desenha(); } }, t)));
    const grupos = D.porCategoria(l);
    const instrChips = rep ? null : chips(fInst, D.INSTRUMENTOS_BANCO.map(([v, t]) => [v, t.replace(' (sem partitura)', '')]), (v) => { fInst = v; fCat = ''; }, 'todos os instrumentos');
    raiz.replaceChildren(h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, admin ? `${NOME.ov} · painel da Bea` : NOME.ov), h('h1', {}, NOME.h1)),
        admin ? h('div', { class: 'pt-acoes' }, h('button', { type: 'button', class: 'pb ouro', onclick: async () => { const part = await NUV.listar().catch(() => []); const r = await formExercicio({ tipo }, { partituras: part, tipo }); if (r) { await carrega(); desenha(); } } }, NOME.novo), h('button', { type: 'button', class: 'pb', onclick: (e) => carregaIniciais(e.currentTarget) }, NOME.iniciais)) : null),
      h('div', { class: 'pt-barra-b' }, b, h('span', { class: 'pt-mudo pt-cont' }, `${l.length} de ${lista.length}`)), instrChips, chips(fNivel, D.NIVEIS, (v) => { fNivel = v; fCat = ''; }, 'todos os níveis'),
      cats.length > 1 ? chips(fCat, cats.map((c) => [c, c]), (v) => { fCat = v; }, rep ? 'todos os gêneros' : 'todas as categorias') : null,
      grupos.length ? h('div', {}, ...grupos.map((g) => h('section', {}, h('h2', { class: 'pt-s' }, `${g.categoria} · ${g.itens.length}`), h('ul', { class: 'pt-lista' }, ...g.itens.map((e) => h('li', {}, h('button', { type: 'button', class: 'pb-li', onclick: () => ver(e) }, h('b', {}, `${favDe(e) ? '★ ' : ''}${e.titulo}`), h('span', {}, [rep ? e.artista : D.NOME_INSTRUMENTO[e.instrumento], D.nomeNivel(e.nivel), e.bpm ? `${e.bpm} bpm` : '', !rep ? (temPartitura(e) ? 'com partitura' : 'texto') : ''].filter(Boolean).join(' · ')), !e.publicado ? h('em', {}, 'rascunho') : null)))))))
        : vazio(lista.length ? 'Nada com esse filtro' : NOME.vazioT, admin ? NOME.vazioA : NOME.vazioP));
  }
  desenha();
  try { const id = sessionStorage.getItem('pro-abrir-ex'); if (id) { sessionStorage.removeItem('pro-abrir-ex'); const e = lista.find((x) => x.id === id); if (e) ver(e); } } catch { /* sem sessionStorage */ }
  return () => { gone = true; };
}
