// Modo professora: a Bea fica logada com o código secreto e, na aula, busca o aluno pelo NOME (a turma que ela mesma cadastrou)
// e entra na conta dele; no fim da aula toca em "trocar aluno" e escolhe outro. Ela nunca vê nem digita o código do aluno.
import { h } from './util.js';
import { sheet, toast } from './ui.js';
import * as CODE from './codigo.js';
import * as CONTAS from './contas.js';
import * as ALBUMACESSO from './figurinhas/acesso.js';
import { filtrar } from './prof-logic.js';

export function trocarAlunoProf() {
  sheet('trocar aluno', (close) => {
    const atual = CONTAS.atual();
    const lista = h('div', { class: 'prof-lista', role: 'list' });
    const msg = h('p', { class: 'muted', role: 'status' }, 'carregando a turma…');
    const busca = h('input', { class: 'field', type: 'search', placeholder: 'buscar o aluno pelo nome', autocomplete: 'off', autocapitalize: 'words', spellcheck: 'false', 'aria-label': 'Buscar aluno pelo nome' });
    let turma = [];
    const escolher = async (a) => {
      CONTAS.ativar({ nome: a.nome, code: a.code });
      try { await ALBUMACESSO.entrar(a.code); } catch { /* o álbum confere de novo na próxima vez */ }
      toast(`jogando como ${a.nome}`); close(); location.reload();
    };
    const desenhar = () => {
      const l = filtrar(turma, busca.value);
      msg.textContent = !turma.length ? 'nenhum aluno na turma ainda. cadastre em menu → aulas → Importar código de aluno.' : l.length ? `${l.length} aluno${l.length === 1 ? '' : 's'}` : 'ninguém com esse nome.';
      lista.replaceChildren(...l.slice(0, 60).map((a) => h('button', { type: 'button', role: 'listitem', class: `btn wide${CONTAS.atual().code === a.code ? ' primary' : ' ghost'}`, style: 'text-align:left;margin:4px 0', onclick: () => escolher(a) }, a.nome)));
    };
    busca.addEventListener('input', desenhar);
    CODE.profTurma().then((t) => { turma = t; desenhar(); setTimeout(() => busca.focus(), 50); }).catch(() => { msg.textContent = 'sem internet agora. tente de novo.'; });
    return h('div', { class: 'sheet-body' },
      atual.nome ? h('p', { class: 'muted' }, `agora: ${atual.nome}`) : null,
      busca, msg, lista,
      h('button', { type: 'button', class: 'btn ghost wide', onclick: () => { CONTAS.ativar({ nome: 'Professora', code: CODE.profCodigo() }); close(); location.reload(); } }, 'voltar pra mim (professora)'),
      h('button', { type: 'button', class: 'btn small ghost wide', onclick: () => { CODE.profSair(); CONTAS.semConta(); close(); location.reload(); } }, 'sair do modo professora neste aparelho'));
  });
}
