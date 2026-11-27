// Agenda: semana e mês, marcar aula (com repetição semanal), mudar o status, anotar o que foi trabalhado. Aulas dadas viram histórico do aluno.
import { h, campo, entrada, area, escolha, dialogo, confirma, aviso, vazio, diaTxt } from './ui.js';
import * as D from './dados.js';

const STATUS = [['marcada', 'marcada'], ['dada', 'dada'], ['faltou', 'aluno faltou'], ['cancelada', 'cancelada']];
const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const mesTxt = (d) => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(d);

export async function mount(host, ctx) {
  let gone = false; let eventos = []; let alunos = []; let aulas = []; let modo = 'semana'; let ref = new Date();
  const raiz = h('div', { class: 'pt' }); host.append(raiz);
  try { [eventos, alunos, aulas] = await Promise.all([D.listar('pro_eventos', { ordem: 'inicio.asc', limite: 1000 }), D.listar('pro_alunos', { ordem: 'nome.asc' }), D.listar('pro_aulas', { ordem: 'titulo.asc' })]); }
  catch (e) { raiz.append(vazio('Não deu para carregar a agenda', D.textoErro(e))); return () => {}; }
  const nomeAluno = (id) => (alunos.find((a) => a.id === id) || {}).nome || '';
  const hora = (e) => D.horaInput(e.inicio);

  const form = (e = {}, diaPadrao = new Date()) => dialogo(e.id ? 'Aula' : 'Marcar aula', (fechar) => {
    const ini = e.inicio ? new Date(e.inicio) : diaPadrao;
    const aluno = escolha([['', '— sem aluno (aula avulsa) —'], ...alunos.filter((a) => a.ativo || a.id === e.aluno_id).map((a) => [a.id, a.nome])], e.aluno_id || '');
    const titulo = entrada({ value: e.titulo || '', maxlength: 100, placeholder: 'Ex.: Aula de bateria' }); const data = entrada({ type: 'date', value: D.dataInput(ini) }); const hr = entrada({ type: 'time', value: e.inicio ? D.horaInput(ini) : '14:00' });
    const dur = entrada({ type: 'number', min: 5, max: 480, value: e.duracao_min || 50 }); const plano = escolha([['', '— nenhum —'], ...aulas.map((a) => [a.id, a.titulo])], e.aula_id || '');
    const st = escolha(STATUS, e.status || 'marcada'); const nota = area({ maxlength: 4000, placeholder: 'O que foi trabalhado…' }); nota.value = e.nota || '';
    const rep = entrada({ type: 'number', min: 0, max: 52, value: 0 });
    const f = h('form', { class: 'pd-f' }, campo('Aluno', aluno), campo('Título', titulo), h('div', { class: 'pd-2' }, campo('Dia', data), campo('Hora', hr)), h('div', { class: 'pd-2' }, campo('Duração (min)', dur), campo('Plano de aula', plano)),
      e.id ? campo('Situação', st) : null, e.id ? campo('O que foi trabalhado', nota) : null, e.id ? null : campo('Repetir toda semana por mais quantas semanas?', rep, '0 = só esta aula'),
      h('div', { class: 'pd-b' }, e.id ? h('button', { type: 'button', class: 'pb perigo', onclick: async () => { if (await confirma('Apagar esta aula?', 'Ela sai da agenda e do histórico.')) { try { await D.apagar('pro_eventos', e.id); eventos = eventos.filter((x) => x.id !== e.id); fechar(); desenha(); } catch (er) { aviso(D.textoErro(er)); } } } }, 'Apagar') : null, h('button', { type: 'button', class: 'pb', onclick: fechar }, 'Cancelar'), h('button', { type: 'submit', class: 'pb ouro' }, 'Salvar')));
    f.addEventListener('submit', async (ev) => { ev.preventDefault(); if (!data.value) { aviso('Escolha o dia'); return; }
      const base = { aluno_id: aluno.value || null, aula_id: plano.value || null, titulo: titulo.value.trim() || nomeAluno(aluno.value) || 'Aula', duracao_min: +dur.value || 50 };
      try {
        if (e.id) { const l = await D.gravar('pro_eventos', { ...base, inicio: D.juntaDataHora(data.value, hr.value), status: st.value, nota: nota.value.trim() }, e.id); eventos = eventos.map((x) => (x.id === l.id ? l : x)); }
        else { const n = Math.min(52, Math.max(0, parseInt(rep.value, 10) || 0)); const d0 = new Date(`${data.value}T00:00`); for (let i = 0; i <= n; i++) { const l = await D.gravar('pro_eventos', { ...base, inicio: D.juntaDataHora(D.dataInput(D.somaDias(d0, i * 7)), hr.value) }); eventos.push(l); } }
        eventos.sort((a, b) => new Date(a.inicio) - new Date(b.inicio)); fechar(); aviso('Agenda atualizada'); desenha();
      } catch (er) { aviso(D.textoErro(er)); } });
    return f;
  });

  const linha = (e) => h('li', { class: `pa-e s-${e.status}` }, h('button', { type: 'button', onclick: () => form(e) }, h('time', {}, hora(e)), h('b', {}, e.titulo || nomeAluno(e.aluno_id) || 'Aula'), h('span', {}, [nomeAluno(e.aluno_id) && e.titulo !== nomeAluno(e.aluno_id) ? nomeAluno(e.aluno_id) : '', `${e.duracao_min} min`, e.status !== 'marcada' ? STATUS.find((s) => s[0] === e.status)[1] : ''].filter(Boolean).join(' · '))));

  function desenha() {
    if (gone) return; const hoje = new Date(); const ini = D.inicioSemana(ref);
    const navegar = (n) => { ref = modo === 'semana' ? D.somaDias(ref, 7 * n) : new Date(ref.getFullYear(), ref.getMonth() + n, 1); desenha(); };
    const topo = h('header', { class: 'pt-top' }, h('div', {}, h('p', { class: 'pt-ov' }, 'Agenda'), h('h1', {}, modo === 'semana' ? `${new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(ini)} – ${new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(D.somaDias(ini, 6))}` : mesTxt(ref))),
      h('button', { type: 'button', class: 'pb ouro', onclick: () => form({}, ref) }, '+ Marcar aula'));
    const nav = h('div', { class: 'pt-barra-b' }, h('button', { type: 'button', class: 'pb', 'aria-label': 'Anterior', onclick: () => navegar(-1) }, '‹'), h('button', { type: 'button', class: 'pb', onclick: () => { ref = new Date(); desenha(); } }, 'hoje'), h('button', { type: 'button', class: 'pb', 'aria-label': 'Próximo', onclick: () => navegar(1) }, '›'),
      h('span', { class: 'pt-sp' }), ...['semana', 'mês'].map((m) => h('button', { type: 'button', class: `pb${modo === (m === 'mês' ? 'mes' : m) ? ' on' : ''}`, onclick: () => { modo = m === 'mês' ? 'mes' : m; desenha(); } }, m)));
    let corpo;
    if (modo === 'semana') {
      corpo = h('div', { class: 'pa-sem' }, ...DIAS.map((_, i) => { const d = D.somaDias(ini, i); const l = D.doDia(eventos, d); return h('section', { class: `pa-d${D.mesmoDia(d, hoje) ? ' hoje' : ''}` }, h('h2', {}, h('span', {}, DIAS[i]), h('b', {}, d.getDate())), l.length ? h('ul', {}, ...l.map(linha)) : h('p', { class: 'pa-livre' }, 'livre')); }));
    } else {
      const p = new Date(ref.getFullYear(), ref.getMonth(), 1); const d0 = D.inicioSemana(p); const cel = [];
      for (let i = 0; i < 42; i++) { const d = D.somaDias(d0, i); if (i >= 35 && d.getMonth() !== p.getMonth()) break; const n = D.doDia(eventos, d).filter((e) => e.status !== 'cancelada').length;
        cel.push(h('button', { type: 'button', class: `pa-c${d.getMonth() !== p.getMonth() ? ' fora' : ''}${D.mesmoDia(d, hoje) ? ' hoje' : ''}`, 'aria-label': `${diaTxt(d)}: ${n} aula${n === 1 ? '' : 's'}`, onclick: () => { ref = d; modo = 'semana'; desenha(); } }, h('b', {}, d.getDate()), n ? h('i', {}, `${n}`) : null)); }
      corpo = h('div', { class: 'pa-mes' }, ...DIAS.map((x) => h('span', { class: 'pa-h' }, x)), ...cel);
    }
    const prox = eventos.filter((e) => e.status === 'marcada' && new Date(e.inicio) >= hoje).length;
    raiz.replaceChildren(topo, nav, corpo, !eventos.length ? vazio('Agenda vazia', 'Marque a primeira aula. Dá para repetir toda semana de uma vez.') : h('p', { class: 'pt-mudo' }, `${prox} aula${prox === 1 ? '' : 's'} marcada${prox === 1 ? '' : 's'} pela frente.`));
  }
  desenha(); return () => { gone = true; };
}
