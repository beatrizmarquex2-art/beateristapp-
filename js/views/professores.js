// Aba Professores (só da Bea): a pasta online de partituras de cada professor. Procura por nome, abre, edita no Teclas, baixa o PDF ou apaga.
// A pasta é a tabela `partituras` (supabase/022_partituras.sql): a Bea lê todas; cada professor só enxerga a dele.
import { h } from '../util.js';
import { banner, toast, sheet, confirmSheet } from '../ui.js';
import * as NUV from '../partitura-nuvem.js';
import * as P from '../partitura-melodica.js';
import { baixarPdf } from '../partitura-pdf.js';

const quando = (t) => { try { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(t)); } catch { return ''; } };
const INST = { teclas: 'teclas', violao: 'violão', guitarra: 'guitarra', baixo: 'baixo', bateria: 'bateria' };

export function mount(host) {
  let gone = false; let todos = [];
  const lista = h('div', { class: 'pr-pastas', 'aria-live': 'polite' });
  const busca = h('input', { class: 'field', type: 'search', placeholder: 'procurar partitura ou professor', autocomplete: 'off', 'aria-label': 'Procurar partitura ou professor' });
  const resumo = h('p', { class: 'muted pr-resumo' });

  const ver = (x) => NUV.abrir(x.id).then((row) => sheet(row.nome, (close) => {
    const d = row.dados || {}; const r = P.pauta(P.normalizar(Array.isArray(d.evs) ? d.evs : []), { clave: d.clave || 'auto', largura: 340, cor: !!d.cor });
    const folha = h('div', { class: 'pm-folha' }); folha.innerHTML = r.svg;
    return h('div', { class: 'sheet-body' },
      h('p', { class: 'muted' }, `${row.dono_nome || 'sem nome'} · ${INST[row.instrumento] || row.instrumento} · ♩ = ${d.bpm || 100} · atualizada ${quando(row.atualizado_em)}`), folha,
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn primary', onclick: () => { try { sessionStorage.setItem('pm-abrir', row.id); } catch { /* sem sessionStorage */ } close(); location.hash = '#/piano'; } }, 'editar no Teclas'),
        h('button', { type: 'button', class: 'btn', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; try { await baixarPdf({ evs: P.normalizar(d.evs || []), clave: d.clave || 'auto', cor: !!d.cor, titulo: row.nome, aluno: row.dono_nome || '', bpm: d.bpm || 100, data: new Date().toLocaleDateString('pt-BR') }); } catch { toast('não consegui gerar o PDF agora', { id: 'pr', ms: 2600 }); } b.disabled = false; } }, 'baixar PDF'),
        h('button', { type: 'button', class: 'btn ghost', onclick: async () => { if (await confirmSheet('Apagar essa partitura?', `${row.nome}, de ${row.dono_nome || 'sem nome'}, some da pasta.`, 'Apagar')) { try { await NUV.apagar(row.id); todos = todos.filter((y) => y.id !== row.id); close(); pinta(); } catch (er) { toast(NUV.textoErro(er), { id: 'pr', ms: 3200 }); } } } }, 'apagar')));
  })).catch((e) => toast(NUV.textoErro(e), { id: 'pr', ms: 3200 }));

  function pinta() {
    if (gone) return; const v = NUV.filtrar(todos, busca.value); const pastas = NUV.pastas(v);
    resumo.textContent = todos.length ? `${pastas.length} professor${pastas.length === 1 ? '' : 'es'} · ${v.length} de ${todos.length} partitura${todos.length === 1 ? '' : 's'}` : '';
    lista.replaceChildren(...(pastas.length ? pastas.map((p) => h('section', { class: 'pr-pasta' },
      h('h3', { class: 'tag' }, `${p.nome} `, h('small', {}, `${p.itens.length} partitura${p.itens.length === 1 ? '' : 's'}`)),
      ...p.itens.map((x) => h('button', { type: 'button', class: 'pm-it-n pr-it', onclick: () => ver(x) }, h('b', {}, x.nome), h('small', {}, `${INST[x.instrumento] || x.instrumento} · ${quando(x.atualizado_em)}`)))))
      : [h('p', { class: 'muted' }, todos.length ? 'nada com esse nome.' : 'ainda não tem partitura na pasta online. quando um professor guardar a primeira, a pasta dele aparece aqui.')]));
  }
  async function carrega() {
    try { todos = await NUV.listar(); } catch (e) { lista.replaceChildren(h('p', { class: 'muted' }, NUV.textoErro(e))); return; }
    pinta();
  }
  busca.addEventListener('input', pinta);
  host.append(banner('Professores', 'a pasta online de partituras de cada um'),
    h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, busca, resumo, lista,
      h('p', { class: 'muted' }, 'você vê todas as pastas. cada professor só vê a dele.')));
  carrega();
  return () => { gone = true; };
}
