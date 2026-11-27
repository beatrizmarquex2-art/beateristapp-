// Criador de aulas: planejamento por instrumento, idade, nível e duração, com objetivos, roteiro em etapas, repertório e tarefa. Salva, vira modelo, duplica e exporta em PDF.
import { h, campo, entrada, area, escolha, aviso, vazio, confirma } from './ui.js';
import * as D from './dados.js';
import { baixarPdf } from './pdf-aula.js';

const IDADES = [['', 'qualquer idade'], ['crianças (4–7)', 'crianças (4–7)'], ['crianças (8–12)', 'crianças (8–12)'], ['adolescentes', 'adolescentes'], ['adultos', 'adultos'], ['terceira idade', 'terceira idade']];

export async function mount(host, ctx, rota) {
  let gone = false; let aulas = []; const raiz = h('div', { class: 'pt' }); host.append(raiz);
  try { aulas = await D.listar('pro_aulas', { ordem: 'atualizado_em.desc' }); } catch (e) { raiz.append(vazio('Não deu para carregar', D.textoErro(e))); return () => {}; }
  const id = rota[1]; const nova = id === 'nova'; let aula = nova ? null : aulas.find((a) => a.id === id);
  if (id && !nova && !aula) { raiz.append(vazio('Aula não encontrada', 'Ela pode ter sido apagada.', h('a', { class: 'pb', href: '#/aulas' }, 'Voltar'))); return () => {}; }

  if (!id) { // lista
    const lista = aulas.filter((a) => !a.modelo); const modelos = aulas.filter((a) => a.modelo);
    const item = (a) => h('li', {}, h('a', { href: `#/aulas/${a.id}` }, h('b', {}, a.titulo), h('span', {}, [a.instrumento, D.nomeNivel(a.nivel), `${a.duracao_min} min`].filter(Boolean).join(' · ')), a.favorito ? h('em', {}, '★') : null));
    const usar = async (m) => { try { const c = await D.gravar('pro_aulas', { titulo: `${m.titulo} (cópia)`, instrumento: m.instrumento, idade: m.idade, nivel: m.nivel, duracao_min: m.duracao_min, modelo: false, pasta: m.pasta, dados: m.dados }); location.hash = `#/aulas/${c.id}`; } catch (er) { aviso(D.textoErro(er)); } };
    raiz.append(h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Criador de aulas'), h('h1', {}, 'Planeje a aula em minutos')), h('a', { class: 'pb ouro', href: '#/aulas/nova' }, '+ Nova aula')),
      modelos.length ? h('section', {}, h('h2', { class: 'pt-s' }, 'Meus modelos'), h('ul', { class: 'pt-lista' }, ...modelos.map((m) => h('li', {}, h('a', { href: `#/aulas/${m.id}` }, h('b', {}, m.titulo), h('span', {}, [m.instrumento, `${m.duracao_min} min`].filter(Boolean).join(' · '))), h('button', { type: 'button', class: 'pb', onclick: () => usar(m) }, 'usar')))) ) : null,
      h('section', {}, h('h2', { class: 'pt-s' }, 'Aulas'), lista.length ? h('ul', { class: 'pt-lista' }, ...lista.map(item)) : vazio('Nenhuma aula ainda', 'Crie a primeira: o roteiro base já vem montado pela duração.', h('a', { class: 'pb ouro', href: '#/aulas/nova' }, 'Criar aula'))));
    return () => { gone = true; };
  }

  // editor
  const d0 = (aula && aula.dados) || {}; const s = { etapas: (d0.etapas || []).map((e) => ({ ...e })) };
  const titulo = entrada({ value: aula ? aula.titulo : '', maxlength: 100, placeholder: 'Ex.: Groove básico em 4/4' });
  const inst = entrada({ value: aula ? aula.instrumento : (ctx.perfil.instrumentos || [])[0] || '', maxlength: 40, list: 'pro-inst2' });
  const dl = h('datalist', { id: 'pro-inst2' }, ...(ctx.perfil.instrumentos || []).map((i) => h('option', { value: i })));
  const idade = escolha(IDADES, aula ? aula.idade : ''); const nivel = escolha(D.NIVEIS, aula ? aula.nivel : 'iniciante'); const dur = entrada({ type: 'number', min: 5, max: 480, value: aula ? aula.duracao_min : 50 });
  const pasta = entrada({ value: aula ? aula.pasta : '', maxlength: 60, list: 'pro-pastas', placeholder: 'Ex.: Iniciantes' }); const dlp = h('datalist', { id: 'pro-pastas' }, ...D.pastasDeAulas(aulas).map((p) => h('option', { value: p })));
  const obj = area({ rows: 3, maxlength: 4000, placeholder: 'O que o aluno vai saber ou saber fazer ao final da aula?' }); obj.value = d0.objetivos || '';
  const rep = area({ rows: 3, maxlength: 4000, placeholder: 'Músicas, trechos, estudos…' }); rep.value = d0.repertorio || '';
  const mat = area({ rows: 2, maxlength: 4000, placeholder: 'Partituras, vídeos, instrumentos, materiais' }); mat.value = d0.materiais || '';
  const tar = area({ rows: 3, maxlength: 4000, placeholder: 'O que estudar durante a semana' }); tar.value = d0.tarefa || '';
  const modelo = h('input', { type: 'checkbox' }); modelo.checked = !!(aula && aula.modelo); const fav = h('input', { type: 'checkbox' }); fav.checked = !!(aula && aula.favorito);
  const etapasEl = h('div', { class: 'pa-etapas' }); const tempo = h('p', { class: 'pa-tempo', 'aria-live': 'polite' });
  const pintaTempo = () => { const m = D.minutos(s.etapas); const t = +dur.value || 0; tempo.textContent = s.etapas.length ? `roteiro: ${m} min de ${t} min${m === t ? ' ✓' : m > t ? ` — passou ${m - t} min` : ` — faltam ${t - m} min`}` : ''; tempo.className = `pa-tempo${m > t ? ' erro' : ''}`; };
  const pintaEtapas = () => {
    etapasEl.replaceChildren(...s.etapas.map((e, i) => {
      const tipo = escolha(D.ETAPAS, e.tipo); tipo.addEventListener('change', () => { e.tipo = tipo.value; });
      const tit = entrada({ value: e.titulo || '', maxlength: 80, placeholder: 'título (opcional)' }); tit.addEventListener('input', () => { e.titulo = tit.value; });
      const min = entrada({ type: 'number', min: 1, max: 240, value: e.min || '', 'aria-label': 'minutos' }); min.addEventListener('input', () => { e.min = +min.value || 0; pintaTempo(); });
      const tx = area({ rows: 2, maxlength: 2000, placeholder: 'o que fazer nesta etapa' }); tx.value = e.texto || ''; tx.addEventListener('input', () => { e.texto = tx.value; });
      const mv = (n) => () => { const j = i + n; if (j < 0 || j >= s.etapas.length) return; [s.etapas[i], s.etapas[j]] = [s.etapas[j], s.etapas[i]]; pintaEtapas(); };
      return h('div', { class: 'pa-et' }, h('div', { class: 'pa-et-l' }, h('span', { class: 'pa-n' }, i + 1), tipo, tit, h('label', { class: 'pa-min' }, min, 'min')), tx,
        h('div', { class: 'pa-et-a' }, h('button', { type: 'button', class: 'pb-i peq', 'aria-label': 'Subir etapa', onclick: mv(-1) }, '↑'), h('button', { type: 'button', class: 'pb-i peq', 'aria-label': 'Descer etapa', onclick: mv(1) }, '↓'), h('button', { type: 'button', class: 'pb-i peq', 'aria-label': 'Remover etapa', onclick: () => { s.etapas.splice(i, 1); pintaEtapas(); } }, '×')));
    })); pintaTempo();
  };
  dur.addEventListener('input', pintaTempo); pintaEtapas();
  const corpo = () => ({ titulo: titulo.value.trim(), instrumento: inst.value.trim(), idade: idade.value, nivel: nivel.value, duracao_min: +dur.value || 50, modelo: modelo.checked, favorito: fav.checked, pasta: pasta.value.trim(),
    dados: { objetivos: obj.value.trim(), etapas: s.etapas.filter((e) => e.min || e.titulo || e.texto), repertorio: rep.value.trim(), materiais: mat.value.trim(), tarefa: tar.value.trim() } });
  const salvar = async () => { const c = corpo(); if (!c.titulo) { aviso('Dê um título para a aula'); titulo.focus(); return null; } try { const l = await D.gravar('pro_aulas', c, aula && aula.id); aula = l; aviso('Aula salva'); if (nova) location.hash = `#/aulas/${l.id}`; return l; } catch (er) { aviso(D.textoErro(er)); return null; } };
  raiz.append(h('a', { class: 'pt-volta', href: '#/aulas' }, '← aulas'), h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, nova ? 'Nova aula' : 'Editando'), h('h1', {}, aula ? aula.titulo : 'Planejar aula'))),
    h('form', { class: 'pa-form', onsubmit: (e) => { e.preventDefault(); salvar(); } }, dl, dlp, campo('Título da aula', titulo),
      h('div', { class: 'pd-3' }, campo('Instrumento', inst), campo('Idade', idade), campo('Nível', nivel)), h('div', { class: 'pd-3' }, campo('Duração (min)', dur), campo('Pasta', pasta, 'organiza na biblioteca')),
      campo('Objetivos pedagógicos', obj),
      h('section', {}, h('div', { class: 'pa-et-h' }, h('h2', { class: 'pt-s' }, 'Roteiro da aula'), h('div', {}, h('button', { type: 'button', class: 'pb', onclick: async () => { if (s.etapas.length && !(await confirma('Trocar o roteiro?', 'As etapas atuais serão substituídas pela estrutura sugerida.', 'Trocar'))) return; s.etapas = D.esqueleto(dur.value); pintaEtapas(); } }, 'estrutura sugerida'), h('button', { type: 'button', class: 'pb', onclick: () => { s.etapas.push({ tipo: 'pratica', titulo: '', min: 5, texto: '' }); pintaEtapas(); } }, '+ etapa'))), etapasEl, tempo),
      campo('Repertório', rep), campo('Materiais', mat), campo('Tarefa para casa', tar),
      h('div', { class: 'pa-opc' }, h('label', { class: 'pt-ck' }, modelo, h('span', {}, 'guardar como modelo reutilizável')), h('label', { class: 'pt-ck' }, fav, h('span', {}, 'favorita'))),
      h('div', { class: 'pd-b esq' }, h('button', { type: 'submit', class: 'pb ouro' }, 'Salvar aula'),
        h('button', { type: 'button', class: 'pb', onclick: async (e) => { const b = e.currentTarget; b.disabled = true; try { const l = (await salvar()) || (nova ? null : aula); if (l) { const r = await baixarPdf(l, ctx.perfil); aviso(r.shared ? 'Pronto! Escolha onde salvar' : `PDF salvo: ${r.name}`); } } catch { aviso('Não consegui gerar o PDF agora'); } b.disabled = false; } }, 'Baixar PDF'),
        aula ? h('button', { type: 'button', class: 'pb', onclick: async () => { try { const c = corpo(); c.titulo = `${c.titulo} (cópia)`; c.modelo = false; const l = await D.gravar('pro_aulas', c); location.hash = `#/aulas/${l.id}`; } catch (er) { aviso(D.textoErro(er)); } } }, 'Duplicar') : null,
        aula ? h('button', { type: 'button', class: 'pb perigo', onclick: async () => { if (await confirma('Apagar esta aula?', `"${aula.titulo}" será removida da biblioteca.`)) { try { await D.apagar('pro_aulas', aula.id); location.hash = '#/aulas'; } catch (er) { aviso(D.textoErro(er)); } } } }, 'Apagar') : null)));
  return () => { gone = true; };
}
