// Minha biblioteca: aulas, modelos, favoritos e partituras num lugar só, com pastas e busca.
// Partituras: pastas (criar, mover), abrir, duplicar, baixar PDF, salvar como imagem e apagar.
import { h, entrada, aviso, vazio, quandoTxt, dialogo, campo, confirma } from './ui.js';
import * as D from './dados.js';
import * as NUV from '../partitura-nuvem.js';
import { rotaDe } from './editor-ritmico.js';
import { exportarPdf, exportarImagem } from './exportar.js';

const NOME_INST = { teclas: 'teclado', violao: 'violão', guitarra: 'guitarra', baixo: 'baixo', bateria: 'bateria' };
const lerVazias = () => { try { const a = JSON.parse(localStorage.getItem('pro-pastas-vazias') || '[]'); return Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []; } catch { return []; } };
const gravaVazias = (a) => { try { localStorage.setItem('pro-pastas-vazias', JSON.stringify([...new Set(a)].slice(0, 60))); } catch { /* sem armazenamento */ } };

export async function mount(host, ctx) {
  let gone = false; let aulas = []; let part = []; let aba = 'aulas'; let pasta = ''; let pastaP = ''; let busca = ''; let partOk = true;
  const raiz = h('div', { class: 'pt' }); host.append(raiz);
  try { aulas = await D.listar('pro_aulas', { ordem: 'atualizado_em.desc' }); } catch (e) { raiz.append(vazio('Não deu para carregar', D.textoErro(e))); return () => {}; }
  try { part = await NUV.listar(); } catch { partOk = false; }
  const alterna = async (a) => { try { const l = await D.gravar('pro_aulas', { favorito: !a.favorito }, a.id); Object.assign(a, l); desenha(); } catch (er) { aviso(D.textoErro(er)); } };
  const todasPastasP = () => [...new Set([...NUV.pastasDe(part), ...lerVazias()])].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const abrir = (p) => { try { sessionStorage.setItem('pm-abrir', p.id); } catch { /* sem sessionStorage */ } location.hash = rotaDe(p.instrumento); };
  const recarrega = async () => { try { part = await NUV.listar(); } catch { /* mantém */ } desenha(); };
  const comRow = async (p, fn, ok) => { try { const row = await NUV.abrir(p.id); const r = await fn(row); if (ok) aviso(typeof ok === 'function' ? ok(r) : ok); } catch (e) { aviso(NUV.textoErro(e)); } };

  const novaPasta = () => dialogo('Nova pasta', (fechar) => { const n = entrada({ maxlength: 60, placeholder: 'Ex.: Iniciantes, Turma das 14h', 'aria-label': 'Nome da pasta' }); const f = h('form', { class: 'pd-f' }, campo('Nome da pasta', n), h('div', { class: 'pd-b' }, h('button', { type: 'button', class: 'pb', onclick: fechar }, 'Cancelar'), h('button', { type: 'submit', class: 'pb ouro' }, 'Criar')));
    f.addEventListener('submit', (e) => { e.preventDefault(); const v = n.value.trim(); if (!v) return; gravaVazias([...lerVazias(), v]); pastaP = v; fechar(); aviso(`pasta "${v}" criada. mova partituras pra ela pelo menu ⋯`); desenha(); }); setTimeout(() => n.focus(), 50); return f; });
  const mover = (p) => dialogo('Mover para uma pasta', (fechar) => { const dl = h('datalist', { id: 'pro-pastas-m' }, ...todasPastasP().map((x) => h('option', { value: x }))); const n = entrada({ value: p.pasta || '', maxlength: 60, list: 'pro-pastas-m', placeholder: 'Sem pasta', 'aria-label': 'Pasta' });
    const f = h('form', { class: 'pd-f' }, dl, campo('Pasta', n, 'escolha uma existente, digite uma nova ou deixe vazio pra tirar da pasta'), h('div', { class: 'pd-b' }, h('button', { type: 'button', class: 'pb', onclick: fechar }, 'Cancelar'), h('button', { type: 'submit', class: 'pb ouro' }, 'Mover')));
    f.addEventListener('submit', async (e) => { e.preventDefault(); try { const l = await NUV.mover(p.id, n.value); p.pasta = l.pasta || ''; fechar(); aviso(p.pasta ? `movida para "${p.pasta}"` : 'tirada da pasta'); desenha(); } catch (er) { aviso(NUV.textoErro(er)); } }); return f; });
  const menu = (p) => dialogo(p.nome, (fechar) => { const it = (t, fn, cls = '') => h('button', { type: 'button', class: `pb pm-item ${cls}`, onclick: () => { fechar(); fn(); } }, t);
    return h('div', { class: 'pm-acoes' }, it('Abrir no editor', () => abrir(p)), it('Duplicar', () => comRow(p, async () => { await NUV.duplicar(p.id); await recarrega(); }, 'cópia criada')),
      it('Mover para pasta…', () => mover(p)), it('Baixar PDF', () => comRow(p, (row) => exportarPdf(row, ctx.perfil), (r) => (r.shared ? 'pronto! escolha onde salvar' : `PDF salvo: ${r.name}`))),
      it('Salvar como imagem', () => comRow(p, (row) => exportarImagem(row, ctx.perfil), (r) => (r.shared ? 'pronto! escolha onde salvar' : `imagem salva: ${r.name}`))),
      it('Apagar', async () => { if (await confirma('Apagar partitura?', `"${p.nome}" some da pasta online.`)) { try { await NUV.apagar(p.id); part = part.filter((x) => x.id !== p.id); desenha(); aviso('partitura apagada'); } catch (er) { aviso(NUV.textoErro(er)); } } }, 'perigo')); });

  function desenha() {
    if (gone) return; const pastas = D.pastasDeAulas(aulas);
    const abas = [['aulas', `Aulas (${aulas.filter((a) => !a.modelo).length})`], ['modelos', `Modelos (${aulas.filter((a) => a.modelo).length})`], ['fav', `Favoritos (${aulas.filter((a) => a.favorito).length})`], ['part', `Partituras${partOk ? ` (${part.length})` : ''}`]];
    const b = entrada({ type: 'search', placeholder: 'Procurar na biblioteca', value: busca, 'aria-label': 'Procurar na biblioteca' }); b.addEventListener('input', () => { busca = b.value; const pp = b.selectionStart; desenha(); const n = raiz.querySelector('input[type=search]'); if (n) { n.focus(); n.setSelectionRange(pp, pp); } });
    let corpo; let chips = null;
    if (aba === 'part') {
      const pp = todasPastasP(); chips = h('div', { class: 'pt-pastas' }, h('button', { type: 'button', class: !pastaP ? 'on' : '', onclick: () => { pastaP = ''; desenha(); } }, 'todas'), ...pp.map((x) => h('button', { type: 'button', class: pastaP === x ? 'on' : '', onclick: () => { pastaP = x; desenha(); } }, x)), h('button', { type: 'button', class: 'pt-nova', onclick: novaPasta }, '+ nova pasta'));
      let l = pastaP ? part.filter((x) => x.pasta === pastaP) : part; l = D.filtrar(l, busca);
      corpo = !partOk ? vazio('Partituras indisponíveis', 'A pasta online de partituras ainda não está ligada no servidor.')
        : l.length ? h('ul', { class: 'pt-lista' }, ...l.map((p) => h('li', {}, h('a', { href: rotaDe(p.instrumento), onclick: () => { try { sessionStorage.setItem('pm-abrir', p.id); } catch { /* ok */ } } }, h('b', {}, p.nome), h('span', {}, [NOME_INST[p.instrumento] || p.instrumento, p.pasta].filter(Boolean).join(' · ')), h('em', {}, quandoTxt(p.atualizado_em))), h('button', { type: 'button', class: 'pb-i', 'aria-label': `Mais ações de ${p.nome}`, onclick: () => menu(p) }, '⋯'))))
        : vazio(pastaP ? 'Pasta vazia' : 'Nenhuma partitura guardada', pastaP ? 'Mova partituras pra cá pelo menu ⋯ de cada uma.' : 'Monte uma no Estúdio e guarde na pasta online.', pastaP ? null : h('a', { class: 'pb ouro', href: '#/estudio' }, 'Abrir o Estúdio'));
    } else {
      let l = aulas.filter((a) => (aba === 'modelos' ? a.modelo : aba === 'fav' ? a.favorito : !a.modelo)); if (pasta) l = l.filter((a) => a.pasta === pasta); l = D.filtrar(l, busca, ['titulo', 'instrumento', 'pasta']);
      chips = pastas.length ? h('div', { class: 'pt-pastas' }, h('button', { type: 'button', class: !pasta ? 'on' : '', onclick: () => { pasta = ''; desenha(); } }, 'todas'), ...pastas.map((x) => h('button', { type: 'button', class: pasta === x ? 'on' : '', onclick: () => { pasta = x; desenha(); } }, x))) : null;
      corpo = l.length ? h('ul', { class: 'pt-lista' }, ...l.map((a) => h('li', {}, h('a', { href: `#/aulas/${a.id}` }, h('b', {}, a.titulo), h('span', {}, [a.pasta, a.instrumento, D.nomeNivel(a.nivel), `${a.duracao_min} min`].filter(Boolean).join(' · '))), h('button', { type: 'button', class: `pb-i${a.favorito ? ' on' : ''}`, 'aria-pressed': String(!!a.favorito), 'aria-label': a.favorito ? 'Tirar dos favoritos' : 'Favoritar', onclick: () => alterna(a) }, a.favorito ? '★' : '☆')))) : vazio(aulas.length ? 'Nada por aqui' : 'Biblioteca vazia', aulas.length ? 'Nenhum item neste filtro.' : 'As aulas que você criar aparecem aqui, organizadas por pasta.', aulas.length ? null : h('a', { class: 'pb ouro', href: '#/aulas/nova' }, 'Criar aula'));
    }
    raiz.replaceChildren(h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Minha biblioteca'), h('h1', {}, 'Tudo o que você criou'))),
      h('div', { class: 'pt-abas', role: 'tablist' }, ...abas.map(([k, t]) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(aba === k), class: aba === k ? 'on' : '', onclick: () => { aba = k; desenha(); } }, t))),
      h('div', { class: 'pt-barra-b' }, b), chips, corpo);
  }
  desenha(); return () => { gone = true; };
}
