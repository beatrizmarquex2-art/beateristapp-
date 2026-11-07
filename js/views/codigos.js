// Importar código de aluno (Beaterista / escola): cola uma lista, o app gera os códigos que faltam e mostra a tabela atualizada pra copiar. cada código vale 1 ano e você desativa quando quiser.
// O aluno usa o código no site dos alunos pra liberar o Beat Hero e as Músicas MIDI. Só a conta da Bea mexe aqui.
import { h } from '../util.js';
import { banner, toast, confirmSheet } from '../ui.js';
import * as CODE from '../codigo.js';

const when = (t) => (t ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(t)) : 'nunca');
const dia = (t) => (t ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(t)) : '—');
const copy = async (txt, ok) => { try { await navigator.clipboard.writeText(txt); toast(ok, { id: 'cod-copy', ms: 2200 }); } catch { toast('não deu pra copiar, selecione a tabela', { id: 'cod-copy', ms: 3000 }); } };

export function mount(host) {
  let list = []; let apar = {}; let busy = false; let gone = false; let last = null; // last = linhas da última importação/geração (pra mostrar só elas)
  const ta = h('textarea', { class: 'field cod-ta', rows: 6, 'aria-label': 'Lista de alunos e códigos', placeholder: 'um aluno por linha\nMaria Souza ; K7M2QX   (já tem código)\nJoão Pedro             (só o nome: eu gero o código)', spellcheck: 'false' });
  const qtd = h('input', { type: 'number', class: 'field cod-qtd', min: 1, max: 100, value: 5, inputmode: 'numeric', 'aria-label': 'Quantos códigos' });
  const out = h('div', { class: 'cod-out' });
  const tableBox = h('div', {});
  host.append(banner('Importar código de aluno', 'quem tem código usa o Beat Hero e as Músicas MIDI'),
    h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
      h('section', { class: 'card pad' }, h('b', {}, 'importar'), h('p', { class: 'muted' }, 'o aluno toca em "gerar meu código" no app dele e te fala o código. cole aqui "nome ; código" (de uma planilha também) e ele é liberado sozinho. quem vier só com o nome ganha um código aleatório.'), ta,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: doImport }, 'importar'), h('button', { class: 'btn ghost', type: 'button', onclick: () => { ta.value = ''; } }, 'limpar'))),
      h('section', { class: 'card pad' }, h('b', {}, 'gerar códigos novos'), h('p', { class: 'muted' }, 'sem lista: eu crio códigos aleatórios sem nome (você dá o nome depois, se quiser).'),
        h('div', { class: 'row' }, qtd, h('button', { class: 'btn', type: 'button', onclick: doGen }, 'gerar'))),
      out,
      h('section', { class: 'card pad' }, h('div', { class: 'row between' }, h('b', {}, 'tabela atualizada'), h('span', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: () => copy(tsv(list), 'tabela copiada (cola na planilha)'), }, 'copiar tabela'), h('button', { class: 'btn small ghost', type: 'button', onclick: load }, 'atualizar'))), tableBox)));
  const tsv = (rows) => ['nome\tcódigo\tativo\tusos\tvalido ate', ...rows.map((x) => `${x.nome || ''}\t${x.code}\t${x.ativo ? 'sim' : 'não'}\t${x.usos ?? 0}\t${dia(x.expira_em)}`)].join('\n');
  async function load() {
    try { list = await CODE.listar(); apar = await CODE.aparelhos().catch(() => ({})); } catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra ver os códigos' : e.message === '404' ? 'a tabela de códigos ainda não foi criada no Supabase' : `não consegui ler os códigos (${e.message})`, { id: 'cod-err', ms: 4000 }); }
    if (!gone) draw();
  }
  function draw() {
    const n = list.filter((x) => x.ativo).length;
    tableBox.replaceChildren(h('p', { class: 'muted' }, `${list.length} código${list.length === 1 ? '' : 's'} · ${n} ativo${n === 1 ? '' : 's'}`),
      list.length ? h('div', { class: 'cod-wrap' }, h('table', { class: 'cod-tbl' }, h('thead', {}, h('tr', {}, ...['nome', 'código', 'usos', 'válido até', ''].map((t) => h('th', {}, t)))),
        h('tbody', {}, ...list.map((x) => h('tr', { class: x.ativo ? '' : 'off' }, h('td', {}, x.nome || '—', x.tipo === 'passe' ? h('small', { class: 'muted' }, ` · passe · ${apar[x.code] || 0}/${x.max_aparelhos || 2} aparelhos`) : null), h('td', {}, h('b', { class: 'rg-code' }, x.code)), h('td', {}, String(x.usos ?? 0)), h('td', {}, x.expira_em ? dia(x.expira_em) : (x.tipo === 'passe' ? 'começa no 1º uso' : 'sem validade'), x.ultimo_uso ? h('small', { class: 'muted' }, ` · usou ${when(x.ultimo_uso)}`) : null),
          h('td', { class: 'cod-act' }, h('button', { class: 'btn small ghost', type: 'button', onclick: () => copy(x.code, 'código copiado') }, 'copiar'),
            h('button', { class: 'btn small ghost', type: 'button', disabled: busy, onclick: () => run(() => CODE.alterar(x.code, { ativo: !x.ativo }), x.ativo ? 'desativado' : 'ativado') }, x.ativo ? 'desativar' : 'ativar'),
            x.tipo === 'passe' && apar[x.code] ? h('button', { class: 'btn small ghost', type: 'button', disabled: busy, onclick: () => run(() => CODE.liberarAparelhos(x.code), 'aparelhos liberados') }, 'liberar aparelhos') : null,
            h('button', { class: 'btn small ghost', type: 'button', disabled: busy, onclick: () => run(() => CODE.alterar(x.code, { expira_em: new Date(Date.now() + 365 * 864e5).toISOString(), ativo: true }), 'renovado por 1 ano') }, '+1 ano'),
            h('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Apagar o código de ${x.nome || x.code}`, disabled: busy, onclick: async () => { if (await confirmSheet('Apagar este código?', `${x.nome || ''} ${x.code}: o aluno perde o acesso.`, 'Apagar')) run(() => CODE.apagar(x.code), 'apagado'); } }, '✕'))))))) : h('p', { class: 'muted' }, 'nenhum código ainda.'));
  }
  async function run(fn, okMsg) { if (busy) return; busy = true; try { await fn(); toast(okMsg, { id: 'cod-ok', ms: 2200 }); await load(); } catch (e) { toast(`não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); } busy = false; draw(); }
  function show(rows, titulo) {
    last = rows;
    out.replaceChildren(h('section', { class: 'card pad cod-new' }, h('div', { class: 'row between' }, h('b', {}, titulo), h('button', { class: 'btn small', type: 'button', onclick: () => copy(tsv(rows), 'tabela copiada (cola na planilha)') }, 'copiar só essas')),
      h('div', { class: 'cod-wrap' }, h('table', { class: 'cod-tbl' }, h('thead', {}, h('tr', {}, h('th', {}, 'nome'), h('th', {}, 'código'))), h('tbody', {}, ...rows.map((x) => h('tr', {}, h('td', {}, x.nome || '—'), h('td', {}, h('b', { class: 'rg-code' }, x.code))))))))); }
  async function doImport() {
    if (busy) return; const ja = new Set(list.map((x) => x.code)); const { rows, bad } = CODE.entender(ta.value, ja, new Map(list.filter((x) => x.nome).map((x) => [x.code, x.nome])));
    if (!rows.length) return toast(bad.length ? 'linha muito grande, confira a lista' : 'cole pelo menos um aluno', { id: 'cod-err', ms: 3000 });
    busy = true;
    try { await CODE.importar(rows); ta.value = ''; show(rows.map((x) => ({ ...x, ativo: true, usos: 0 })), `${rows.length} importado${rows.length === 1 ? '' : 's'} (${rows.filter((x) => !x.dado).length} com código novo)${rows.some((x) => x.trocou) ? ' · nome trocado = código novo: ' + rows.filter((x) => x.trocou).map((x) => `${x.trocou.de} → ${x.nome}`).join(', ') + '. o código antigo continua ativo, desative se quiser' : ''}`); toast('importado ✓', { id: 'cod-ok', ms: 2500 }); await load(); }
    catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra importar' : `não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); }
    busy = false; draw();
  }
  async function doGen() {
    const n = Math.max(1, Math.min(100, Math.round(Number(qtd.value) || 1))); const ja = new Set(list.map((x) => x.code));
    const { rows } = CODE.entender(Array.from({ length: n }, (_, i) => `aluno ${list.length + i + 1}`).join('\n'), ja);
    if (busy) return; busy = true;
    try { await CODE.importar(rows.map((x) => ({ ...x, nome: '' }))); show(rows.map((x) => ({ ...x, nome: '', ativo: true, usos: 0 })), `${n} código${n === 1 ? '' : 's'} novo${n === 1 ? '' : 's'}`); toast('gerado ✓', { id: 'cod-ok', ms: 2500 }); await load(); }
    catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra gerar' : `não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); }
    busy = false; draw();
  }
  draw(); load();
  return () => { gone = true; };
}
