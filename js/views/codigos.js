// Importar código de aluno (Beaterista / escola): cola uma lista, o app gera os códigos que faltam e mostra a tabela atualizada pra copiar. cada código vale 1 ano e você desativa quando quiser.
// O aluno usa o código no site dos alunos pra liberar o Beat Hero e as Músicas MIDI. Só a conta da Bea mexe aqui.
import { h } from '../util.js';
import { banner, toast, confirmSheet } from '../ui.js';
import * as CODE from '../codigo.js';

const when = (t) => (t ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(t)) : 'nunca');
const dia = (t) => (t ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(t)) : '—');
const copy = async (txt, ok) => { try { await navigator.clipboard.writeText(txt); toast(ok, { id: 'cod-copy', ms: 2200 }); } catch { toast('não deu pra copiar, selecione a tabela', { id: 'cod-copy', ms: 3000 }); } };


/** O que um passe pode liberar (telas que ficam trancadas sem código). `rotas` = prefixos de endereço. */
const PASSES = [
  ['Uno Musical', ['#/jogos/cartas']], ['quiz do Uno', ['#/jogos/quizuno']], ['Toca Aqui', ['#/jogos/toca']], ['Figurix', ['#/jogos/figurix', '#/kids/figuras']], ['Taiko', ['#/jogos/rudimentos']], ['Detetive Note', ['#/jogos/detetive']],
  ['Beat Hero e músicas', ['#/ritmo']], ['pauLta', ['#/paulta']], ['fases dos Kids', ['#/kids']], ['dicas do método (Estudos)', ['#/estudos/dicas']],
  ['Modo Aventura (todos os jogos)', ['/aventura']], ['Álbum e roleta', ['#/album']], ['Ranking', ['#/ranking']],
];
const SITE = 'https://jogos.beaterista.com.br';

export function mount(host) {
  let list = []; let busy = false; let gone = false; let last = null; // last = linhas da última importação/geração (pra mostrar só elas)
  const ta = h('textarea', { class: 'field cod-ta', rows: 6, 'aria-label': 'Lista de alunos e códigos', placeholder: 'um aluno por linha\nMaria Souza ; K7M2QX   (já tem código)\nJoão Pedro             (só o nome: eu gero o código)', spellcheck: 'false' });
  const qtd = h('input', { type: 'number', class: 'field cod-qtd', min: 1, max: 100, value: 5, inputmode: 'numeric', 'aria-label': 'Quantos códigos' });
  const out = h('div', { class: 'cod-out' });
  const diasIn = h('input', { type: 'number', class: 'field cod-qtd', min: 1, max: 365, value: 3, inputmode: 'numeric', 'aria-label': 'Quantos dias vale o passe' });
  const tableBox = h('div', {});
  const nomeIn = h('input', { class: 'field', type: 'text', maxlength: 50, placeholder: 'nome de quem pagou', autocomplete: 'off', 'aria-label': 'Nome de quem pagou' });
  const telIn = h('input', { class: 'field', type: 'tel', inputmode: 'tel', maxlength: 20, placeholder: 'WhatsApp com DDD (opcional)', autocomplete: 'off', 'aria-label': 'WhatsApp de quem pagou' });
  host.append(banner('Importar código de aluno', 'quem tem código usa o Beat Hero e as Músicas MIDI'),
    h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
      h('section', { class: 'card pad' }, h('b', {}, 'passe anual (pagou no PIX)'), h('p', { class: 'muted' }, 'R$ 49,90 · o site todo por 12 meses a partir de hoje · 2 aparelhos. confirmou o PIX? escreva o nome, gere e mande a mensagem pronta no WhatsApp.'), nomeIn, telIn,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: doAnual }, 'gerar passe anual'))),
      h('section', { class: 'card pad' }, h('b', {}, 'importar'), h('p', { class: 'muted' }, 'o aluno toca em "gerar meu código" no app dele e te fala o código. cole aqui "nome ; código" (de uma planilha também) e ele é liberado sozinho. quem vier só com o nome ganha um código aleatório.'), ta,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: doImport }, 'importar'), h('button', { class: 'btn ghost', type: 'button', onclick: () => { ta.value = ''; } }, 'limpar'))),
      h('section', { class: 'card pad' }, h('b', {}, 'gerar códigos novos'), h('p', { class: 'muted' }, 'sem lista: eu crio códigos aleatórios sem nome (você dá o nome depois, se quiser).'),
        h('div', { class: 'row' }, qtd, h('button', { class: 'btn', type: 'button', onclick: doGen }, 'gerar'))),
      h('section', { class: 'card pad' }, h('b', {}, 'passe (amigos e família)'), h('p', { class: 'muted' }, 'escolha o que libera. o código sai como BEA + 4 letras/números, vale os dias que você marcar a partir do 1º uso e funciona em até 2 aparelhos. o passe não dá estrelas nem álbum.'),
        h('div', { class: 'cod-passes' }, ...PASSES.map(([nome], i) => h('label', { class: 'jg-chk' }, h('input', { type: 'checkbox', 'data-i': String(i) }), ` ${nome}`))),
        h('div', { class: 'row' }, h('label', { class: 'muted' }, 'dias '), diasIn, h('button', { class: 'btn primary', type: 'button', onclick: doPasse }, 'gerar passe')),
        h('div', { class: 'row', style: 'margin-top:8px' }, h('button', { class: 'btn', type: 'button', onclick: doTestDrive }, 'test drive: site todo por 1 dia (BEASITE)'))),
      out,
      h('section', { class: 'card pad' }, h('div', { class: 'row between' }, h('b', {}, 'tabela atualizada'), h('span', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: () => copy(tsv(list), 'tabela copiada (cola na planilha)'), }, 'copiar tabela'), h('button', { class: 'btn small ghost', type: 'button', onclick: load }, 'atualizar'))), tableBox)));
  const tsv = (rows) => ['nome\tcódigo\tativo\tusos\tvalido ate', ...rows.map((x) => `${x.nome || ''}\t${x.code}\t${x.ativo ? 'sim' : 'não'}\t${x.usos ?? 0}\t${dia(x.expira_em)}`)].join('\n');
  async function load() {
    try { list = await CODE.listar(); } catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra ver os códigos' : e.message === '404' ? 'a tabela de códigos ainda não foi criada no Supabase' : `não consegui ler os códigos (${e.message})`, { id: 'cod-err', ms: 4000 }); }
    if (!gone) draw();
  }
  function draw() {
    const n = list.filter((x) => x.ativo).length;
    tableBox.replaceChildren(h('p', { class: 'muted' }, `${list.length} código${list.length === 1 ? '' : 's'} · ${n} ativo${n === 1 ? '' : 's'}`),
      list.length ? h('div', { class: 'cod-wrap' }, h('table', { class: 'cod-tbl' }, h('thead', {}, h('tr', {}, ...['nome', 'código', 'usos', 'válido até', ''].map((t) => h('th', {}, t)))),
        h('tbody', {}, ...list.map((x) => h('tr', { class: x.ativo ? '' : 'off' }, h('td', {}, x.nome || '—'), h('td', {}, h('b', { class: 'rg-code' }, x.code)), h('td', {}, String(x.usos ?? 0)), h('td', {}, dia(x.expira_em), x.ultimo_uso ? h('small', { class: 'muted' }, ` · usou ${when(x.ultimo_uso)}`) : null),
          h('td', { class: 'cod-act' }, h('button', { class: 'btn small ghost', type: 'button', onclick: () => copy(x.code, 'código copiado') }, 'copiar'),
            h('button', { class: 'btn small ghost', type: 'button', disabled: busy, onclick: () => run(() => CODE.alterar(x.code, { ativo: !x.ativo }), x.ativo ? 'desativado' : 'ativado') }, x.ativo ? 'desativar' : 'ativar'),
            h('button', { class: 'btn small ghost', type: 'button', disabled: busy, onclick: () => run(() => CODE.alterar(x.code, { expira_em: new Date(Date.now() + 365 * 864e5).toISOString(), ativo: true }), 'renovado por 1 ano') }, '+1 ano'),
            h('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Apagar o código de ${x.nome || x.code}`, disabled: busy, onclick: async () => { if (await confirmSheet('Apagar este código?', `${x.nome || ''} ${x.code}: o aluno perde o acesso.`, 'Apagar')) run(() => CODE.apagar(x.code), 'apagado'); } }, '✕'))))))) : h('p', { class: 'muted' }, 'nenhum código ainda.'));
  }
  async function run(fn, okMsg) { if (busy) return; busy = true; try { await fn(); toast(okMsg, { id: 'cod-ok', ms: 2200 }); await load(); } catch (e) { toast(`não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); } busy = false; draw(); }
  function show(rows, titulo) {
    last = rows;
    out.replaceChildren(h('section', { class: 'card pad cod-new' }, h('div', { class: 'row between' }, h('b', {}, titulo), h('button', { class: 'btn small', type: 'button', onclick: () => copy(tsv(rows), 'tabela copiada (cola na planilha)') }, 'copiar só essas')),
      h('div', { class: 'cod-wrap' }, h('table', { class: 'cod-tbl' }, h('thead', {}, h('tr', {}, h('th', {}, 'nome'), h('th', {}, 'código'))), h('tbody', {}, ...rows.map((x) => h('tr', {}, h('td', {}, x.nome || '—'), h('td', {}, h('b', { class: 'rg-code' }, x.code))))))))); }
  const msgPasse = (code, o, dias) => `oi! aqui está o seu passe da Beaterista (${o}): ${code}\nvale ${dias} dia${dias === 1 ? '' : 's'} a partir da 1ª vez que você usar, em até 2 aparelhos.\nentre em ${SITE} e toque em "tenho código".`;
  function mostraPasse(code, o, dias) {
    const m = msgPasse(code, o, dias);
    out.replaceChildren(h('section', { class: 'card pad cod-new' }, h('div', { class: 'row between' }, h('b', {}, `passe: ${o}`), h('button', { class: 'btn small', type: 'button', onclick: () => copy(m, 'mensagem copiada (cola no WhatsApp)') }, 'copiar mensagem')),
      h('p', { class: 'rg-code', style: 'font-size:28px;margin:6px 0' }, code), h('p', { class: 'muted' }, m)));
  }
  async function doAnual() {
    const nome = nomeIn.value.trim(); if (!nome) return toast('escreva o nome de quem pagou', { id: 'cod-err', ms: 2600 }); if (busy) return; busy = true;
    try {
      const { code, expira } = await CODE.criarPasseAnual({ nome }); const P = await import('../passe-anual.js'); const m = P.mensagemPasse({ nome, code, expira, site: SITE }); const wa = P.linkWhatsapp(telIn.value, m);
      out.replaceChildren(h('section', { class: 'card pad cod-new' }, h('div', { class: 'row between' }, h('b', {}, `passe anual: ${nome}`), h('button', { class: 'btn small', type: 'button', onclick: () => copy(m, 'mensagem copiada (cola no WhatsApp)') }, 'copiar mensagem')),
        h('p', { class: 'rg-code', style: 'font-size:28px;margin:6px 0' }, code), h('p', { class: 'muted', style: 'white-space:pre-line' }, m), wa ? h('a', { class: 'btn primary', href: wa, target: '_blank', rel: 'noopener' }, 'abrir no WhatsApp') : null));
      nomeIn.value = ''; telIn.value = ''; toast('passe anual gerado ✓', { id: 'cod-ok', ms: 2200 }); await load();
    } catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra gerar' : `não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); }
    busy = false;
  }
  async function doPasse() {
    const marcados = [...host.querySelectorAll('.cod-passes input:checked')].map((x) => PASSES[+x.dataset.i]); if (!marcados.length) return toast('marque o que o passe libera', { id: 'cod-err', ms: 2600 });
    const dias = Math.max(1, Math.min(365, Math.round(Number(diasIn.value) || 3))); if (busy) return; busy = true;
    try { const code = await CODE.criarPasse({ prefixo: 'BEA', nome: `passe ${marcados.map((x) => x[0]).join(' + ')}`, dias, jogos: marcados.flatMap((x) => x[1]) }); mostraPasse(code, marcados.map((x) => x[0]).join(' + '), dias); toast('passe gerado ✓', { id: 'cod-ok', ms: 2200 }); await load(); }
    catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra gerar' : `não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); }
    busy = false;
  }
  async function doTestDrive() {
    if (busy) return; busy = true;
    try { const code = await CODE.criarPasse({ prefixo: 'BEASITE', nome: 'test drive 1 dia', dias: 1, jogos: null }); mostraPasse(code, 'test drive: o site todo', 1); toast('test drive gerado ✓', { id: 'cod-ok', ms: 2200 }); await load(); }
    catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra gerar' : `não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); }
    busy = false;
  }
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
