// Balcão: a tela de Códigos das professoras. Cadastrar aluno (gera o código), importar um código que o aluno já tem, ver a lista
// (meus / todos), ativar e desativar. Cada ação fica registrada com quem fez e quando (codigos_historico).
import { h } from '../util.js';
import { banner, toast, confirmSheet } from '../ui.js';
import * as B from '../balcao-dados.js';

const dia = (t) => { try { return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(t)); } catch { return ''; } };
const copia = async (t, ok) => { try { await navigator.clipboard.writeText(t); toast(ok, { id: 'bal-c', ms: 2200 }); } catch { toast('não deu pra copiar, segure no código e copie', { id: 'bal-c', ms: 3000 }); } };

export function mount(host) {
  let gone = false; let lista = []; let so = 'meus'; let busca = ''; let eu = ''; const cx = h('div', { class: 'bal' });
  const campo = (rot, el) => h('label', { class: 'bal-f' }, h('span', {}, rot), el);
  const nome = h('input', { class: 'field', type: 'text', maxlength: 60, autocomplete: 'off', placeholder: 'nome do aluno' });
  const curso = h('select', { class: 'field' }, h('option', { value: '' }, 'curso (opcional)'), ...B.CURSOS.map((c) => h('option', { value: c }, c)));
  const sit = h('select', { class: 'field' }, h('option', { value: '1' }, 'ativo'), h('option', { value: '0' }, 'inativo'));
  const iCod = h('input', { class: 'field', type: 'text', maxlength: 14, autocomplete: 'off', autocapitalize: 'characters', placeholder: 'código que o aluno tem' });
  const iNome = h('input', { class: 'field', type: 'text', maxlength: 60, autocomplete: 'off', placeholder: 'nome do aluno' });
  const iCurso = h('select', { class: 'field' }, h('option', { value: '' }, 'curso (opcional)'), ...B.CURSOS.map((c) => h('option', { value: c }, c)));
  const iSit = h('select', { class: 'field' }, h('option', { value: '1' }, 'ativo'), h('option', { value: '0' }, 'inativo'));
  const saida = h('div', { class: 'bal-out', 'aria-live': 'polite' }); const tabela = h('div', { class: 'bal-lista' });
  const meuNomeIn = h('input', { class: 'field', type: 'text', maxlength: 40, placeholder: 'seu nome (aparece em quem criou)', autocomplete: 'name' });

  async function carrega() {
    try { lista = await B.listar(); } catch (e) { tabela.replaceChildren(h('p', { class: 'muted' }, B.erroTxt(e))); return; }
    if (!gone) desenha();
  }
  async function mudar(x, on) { try { await B.ativar(x.code, on); toast(on ? 'código ativado' : 'código desativado', { id: 'bal-a', ms: 2200 }); await carrega(); } catch (e) { toast(B.erroTxt(e), { id: 'bal-a', ms: 3500 }); desenha(); } }
  function desenha() {
    const v = B.filtra(lista, { so, eu, q: busca }); const chips = h('div', { class: 'bal-chips', role: 'group', 'aria-label': 'Ver' }, ...[['meus', 'meus'], ['todos', 'todos']].map(([k, t]) => h('button', { type: 'button', class: `bal-chip${so === k ? ' on' : ''}`, 'aria-pressed': String(so === k), onclick: () => { so = k; desenha(); } }, t)));
    const q = h('input', { class: 'field', type: 'search', placeholder: 'buscar por nome, código ou curso', value: busca, 'aria-label': 'Buscar', oninput: (e) => { busca = e.target.value; const p = e.target.selectionStart; desenha(); const n = tabela.querySelector('input[type=search]'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch { /* ok */ } } } });
    tabela.replaceChildren(h('div', { class: 'bal-topo' }, chips, h('span', { class: 'muted' }, `${v.length} de ${lista.length}`)), q,
      v.length ? h('ul', { class: 'bal-ul' }, ...v.map((x) => h('li', { class: `bal-li${x.ativo ? '' : ' off'}`, 'data-code': x.code },
        h('span', { class: 'bal-av', 'aria-hidden': 'true' }, (x.nome || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()), h('div', { class: 'bal-nm' }, h('b', {}, x.nome || '(sem nome)'), h('span', { class: 'muted' }, [x.curso, x.criado_por ? `por ${x.criado_por}` : null, x.criado_em ? dia(x.criado_em) : null].filter(Boolean).join(' · '))),
        h('button', { type: 'button', class: 'bal-cod', 'aria-label': `Copiar o código de ${x.nome}`, onclick: () => copia(x.code, `código ${x.code} copiado`) }, x.code),
        h('button', { type: 'button', class: `bal-sw${x.ativo ? ' on' : ''}`, role: 'switch', 'aria-checked': String(!!x.ativo), 'aria-label': `${x.ativo ? 'Desativar' : 'Ativar'} ${x.nome}`, onclick: () => mudar(x, !x.ativo) }, x.ativo ? 'ativo' : 'inativo')))) : h('p', { class: 'muted' }, so === 'meus' && lista.length ? 'você ainda não criou nenhum código. veja "todos" ou cadastre um aluno acima.' : 'nada por aqui ainda.'));
  }
  async function aoGerar(b) {
    if (!nome.value.trim()) { toast('coloque o nome do aluno', { id: 'bal-e' }); nome.focus(); return; }
    b.disabled = true; try { const code = await B.gerar({ nome: nome.value, curso: curso.value, ativo: sit.value === '1' }); saida.replaceChildren(h('div', { class: 'bal-novo' }, h('span', { class: 'muted' }, `código de ${nome.value.trim()}`), h('b', { class: 'bal-big' }, code), h('button', { type: 'button', class: 'btn primary', onclick: () => copia(code, 'código copiado') }, 'copiar código'))); nome.value = ''; await carrega(); } catch (e) { toast(B.erroTxt(e), { id: 'bal-e', ms: 3500 }); } b.disabled = false;
  }
  async function aoImportar(b) {
    if (!iCod.value.trim() || !iNome.value.trim()) { toast('coloque o código e o nome', { id: 'bal-e' }); return; }
    b.disabled = true; const dados = { code: iCod.value, nome: iNome.value, curso: iCurso.value, ativo: iSit.value === '1' };
    try {
      let r = await B.importar(dados);
      if (r && r.motivo === 'outro_tipo') toast('esse código é de outro tipo (passe ou amigo) e não dá pra importar aqui', { id: 'bal-e', ms: 4000 });
      else if (r && r.motivo === 'existe') { if (await confirmSheet('Esse código já existe', `já é de ${r.nome}${r.curso ? ` (${r.curso})` : ''}. trocar para ${dados.nome}${dados.curso ? ` (${dados.curso})` : ''}?`, 'Trocar')) r = await B.importar({ ...dados, trocar: true }); else r = null; }
      if (r && r.ok) { saida.replaceChildren(h('p', {}, r.novo ? `código ${r.code} importado.` : `código ${r.code} agora é de ${dados.nome}.`)); iCod.value = ''; iNome.value = ''; await carrega(); }
    } catch (e) { toast(B.erroTxt(e), { id: 'bal-e', ms: 3500 }); } b.disabled = false;
  }
  async function inicio() {
    if (!(await B.podeUsar())) { cx.replaceChildren(h('section', { class: 'card pad' }, h('b', {}, 'só para professoras'), h('p', { class: 'muted' }, 'entre com o código de professora neste aparelho (ou com a conta da Bea) pra usar o Balcão.'))); return; }
    eu = await B.sou();
    if (eu !== 'Bea' && !eu) { cx.replaceChildren(h('section', { class: 'card pad' }, h('b', {}, 'como você se chama?'), h('p', { class: 'muted' }, 'seu nome aparece em cada código que você cria. você digita uma vez neste aparelho.'), meuNomeIn, h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn primary', onclick: () => { if (!meuNomeIn.value.trim()) return; B.guardaNome(meuNomeIn.value); inicio(); } }, 'continuar')))); return; }
    const bg = h('button', { type: 'button', class: 'btn primary', onclick: (e) => aoGerar(e.currentTarget) }, 'gerar código'); const bi = h('button', { type: 'button', class: 'btn', onclick: (e) => aoImportar(e.currentTarget) }, 'importar código');
    cx.replaceChildren(h('p', { class: 'muted' }, `olá, ${eu}. tudo que você faz aqui fica registrado com o seu nome.`),
      h('section', { class: 'card pad bal-sec' }, h('b', {}, 'cadastrar aluno'), h('p', { class: 'muted' }, 'eu crio um código aleatório de 6 letras e números e já deixo liberado.'), h('div', { class: 'bal-grade' }, campo('nome', nome), campo('curso', curso), campo('situação', sit)), h('div', { class: 'row' }, bg), saida),
      h('section', { class: 'card pad bal-sec' }, h('b', {}, 'importar código'), h('p', { class: 'muted' }, 'o aluno já tem um código (gerou no app dele)? cadastre aqui. se o código já for de outro aluno, eu te pergunto antes de trocar.'), h('div', { class: 'bal-grade' }, campo('código', iCod), campo('nome', iNome), campo('curso', iCurso), campo('situação', iSit)), h('div', { class: 'row' }, bi)),
      h('section', { class: 'card pad bal-sec' }, h('b', {}, 'códigos'), tabela));
    await carrega();
  }
  host.append(banner('Balcão', 'códigos dos alunos'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, cx)); inicio();
  return () => { gone = true; };
}
