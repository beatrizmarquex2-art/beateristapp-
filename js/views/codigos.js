// Aba Códigos da Bea: (1) novo código com tipo, tempo e nome; (2) lista com busca e filtros. Embaixo, as ferramentas antigas (importar lista, passe anual, test drive) em `montarLegado`.
// Importar código de aluno (Beaterista / escola): cola uma lista, o app gera os códigos que faltam e mostra a tabela atualizada pra copiar. cada código vale 1 ano e você desativa quando quiser.
// O aluno usa o código no site dos alunos pra liberar o Beat Hero e as Músicas MIDI. Só a conta da Bea mexe aqui.
import { h } from '../util.js';
import { banner, toast, confirmSheet, sheet } from '../ui.js';
import * as CODE from '../codigo.js';
import { precoPasse } from '../passe-preco.js';

const when = (t) => (t ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(t)) : 'nunca');
const dia = (t) => (t ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(t)) : '—');
const copy = async (txt, ok) => { try { await navigator.clipboard.writeText(txt); toast(ok, { id: 'cod-copy', ms: 2200 }); } catch { toast('não deu pra copiar, selecione a tabela', { id: 'cod-copy', ms: 3000 }); } };


/** Abas que um código de amigos, marcas e parceiros pode liberar (as outras ficam como pra quem entra sem acesso; a Lojinha é sempre livre). `rotas` = prefixos de endereço. */
const ABAS = [
  ['jogos', 'Jogos', ['#/jogos', '#/ritmo', '#/paulta', '#/kids', '/aventura']],
  ['estudos', 'Estudos', ['#/estudos', '#/dicionario', '#/dicas', '#/erros', '#/kids/figuras']],
  ['tocar', 'Palco (tocar)', ['#/tocar', '#/toque', '#/piano', '#/violao', '#/xilofone', '#/metronomo', '#/ouvido', '#/foco', '#/nagano']],
  ['album', 'Álbum, roleta e perfil', ['#/album', '#/perfil', '#/roleta', '#/ranking']],
];
const rotasDe = (ids) => ABAS.filter((x) => ids.includes(x[0])).flatMap((x) => x[2]);
const abasDe = (jogos) => (Array.isArray(jogos) ? ABAS.filter((x) => jogos.includes(x[2][0])).map((x) => x[0]) : ABAS.map((x) => x[0]));
const SITE = 'https://jogos.beaterista.com.br';

export function montarLegado(host, { semBanner = false } = {}) {
  let list = []; let busy = false; let gone = false; let last = null; // last = linhas da última importação/geração (pra mostrar só elas)
  const ta = h('textarea', { class: 'field cod-ta', rows: 6, 'aria-label': 'Lista de alunos e códigos', placeholder: 'um aluno por linha\nMaria Souza ; K7M2QX   (já tem código)\nJoão Pedro             (só o nome: eu gero o código)', spellcheck: 'false' });
  const qtd = h('input', { type: 'number', class: 'field cod-qtd', min: 1, max: 100, value: 5, inputmode: 'numeric', 'aria-label': 'Quantos códigos' });
  const out = h('div', { class: 'cod-out' });
  const diasIn = h('input', { type: 'number', class: 'field cod-qtd', min: 1, max: 365, value: 3, inputmode: 'numeric', 'aria-label': 'Quantos dias vale o passe' });
  const tableBox = h('div', {});
  const umNome = h('input', { class: 'field', type: 'text', maxlength: 50, placeholder: 'nome do aluno (opcional)', autocomplete: 'off', 'aria-label': 'Nome do aluno (opcional)' });
  const nomeIn = h('input', { class: 'field', type: 'text', maxlength: 50, placeholder: 'nome de quem pagou', autocomplete: 'off', 'aria-label': 'Nome de quem pagou' });
  const telIn = h('input', { class: 'field', type: 'tel', inputmode: 'tel', maxlength: 20, placeholder: 'WhatsApp com DDD (opcional)', autocomplete: 'off', 'aria-label': 'WhatsApp de quem pagou' });
  host.append(...(semBanner ? [] : [banner('Importar código de aluno', 'quem tem código usa o Beat Hero e as Músicas MIDI')]),
    h('div', { class: 'pad-x', style: 'display:grid;gap:12px' },
      h('section', { class: 'card pad' }, h('b', {}, 'novo código de aluno'), h('p', { class: 'muted' }, 'um toque: eu crio um código aleatório (6 letras e números), igual aos que os alunos geram sozinhos, e já deixo liberado. vale o site todo, em até 2 aparelhos, por 1 ano.'), umNome,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: doUm }, 'gerar novo código aleatório'))),
      h('section', { class: 'card pad' }, h('b', {}, 'passe anual (pagou no PIX)'), h('p', { class: 'muted' }, `${precoPasse().atual}${precoPasse().oferta ? ' (oferta Black Friday até 15/dez; depois R$ 79,90)' : ''} · o site todo por 12 meses a partir de hoje · 2 aparelhos. confirmou o PIX? escreva o nome, gere e mande a mensagem pronta no WhatsApp.`), nomeIn, telIn,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: doAnual }, 'gerar passe anual'))),
      h('section', { class: 'card pad' }, h('b', {}, 'importar'), h('p', { class: 'muted' }, 'o aluno toca em "gerar meu código" no app dele e te fala o código. cole aqui "nome ; código" (de uma planilha também) e ele é liberado sozinho. quem vier só com o nome ganha um código aleatório.'), ta,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: doImport }, 'importar'), h('button', { class: 'btn ghost', type: 'button', onclick: () => { ta.value = ''; } }, 'limpar'))),
      h('section', { class: 'card pad' }, h('b', {}, 'gerar códigos novos'), h('p', { class: 'muted' }, 'sem lista: eu crio códigos aleatórios sem nome (você dá o nome depois, se quiser).'),
        h('div', { class: 'row' }, qtd, h('button', { class: 'btn', type: 'button', onclick: doGen }, 'gerar'))),
      h('section', { class: 'card pad' }, h('b', {}, 'gerar código alunos, amigos e marcas'), h('p', { class: 'muted' }, 'eu crio um código aleatório e você escolhe qual aba libera e por quantos dias (conta a partir do 1º uso, em até 2 aparelhos). o que ficar fechado funciona como pra quem entra sem acesso; a Lojinha é sempre livre. depois dá pra mudar abas e dias na tabela (botão "editar").'),
        h('div', { class: 'cod-passes' }, ...ABAS.map(([id, nome]) => h('label', { class: 'jg-chk' }, h('input', { type: 'checkbox', 'data-id': id, checked: true }), ` ${nome}`))),
        h('div', { class: 'row' }, h('label', { class: 'muted' }, 'dias '), diasIn, h('button', { class: 'btn primary', type: 'button', onclick: doPasse }, 'gerar código alunos, amigos e marcas')),
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
          h('td', { class: 'cod-act' }, h('button', { class: 'btn small ghost', type: 'button', onclick: () => copy(x.code, 'código copiado') }, 'copiar'), x.tipo === 'passe' ? h('button', { class: 'btn small ghost', type: 'button', disabled: busy, onclick: () => editar(x) }, 'editar') : null,
            h('button', { class: 'btn small ghost', type: 'button', disabled: busy, onclick: () => run(() => CODE.alterar(x.code, { ativo: !x.ativo }), x.ativo ? 'desativado' : 'ativado') }, x.ativo ? 'desativar' : 'ativar'),
            h('button', { class: 'btn small ghost', type: 'button', disabled: busy, onclick: () => run(() => CODE.alterar(x.code, { expira_em: new Date(Date.now() + 365 * 864e5).toISOString(), ativo: true }), 'renovado por 1 ano') }, '+1 ano'),
            h('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Apagar o código de ${x.nome || x.code}`, disabled: busy, onclick: async () => { if (await confirmSheet('Apagar este código?', `${x.nome || ''} ${x.code}: o aluno perde o acesso.`, 'Apagar')) run(() => CODE.apagar(x.code), 'apagado'); } }, '✕'))))))) : h('p', { class: 'muted' }, 'nenhum código ainda.'));
  }
  async function run(fn, okMsg) { if (busy) return; busy = true; try { await fn(); toast(okMsg, { id: 'cod-ok', ms: 2200 }); await load(); } catch (e) { toast(`não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); } busy = false; draw(); }
  function show(rows, titulo) {
    last = rows;
    out.replaceChildren(h('section', { class: 'card pad cod-new' }, h('div', { class: 'row between' }, h('b', {}, titulo), h('button', { class: 'btn small', type: 'button', onclick: () => copy(tsv(rows), 'tabela copiada (cola na planilha)') }, 'copiar só essas')),
      h('div', { class: 'cod-wrap' }, h('table', { class: 'cod-tbl' }, h('thead', {}, h('tr', {}, h('th', {}, 'nome'), h('th', {}, 'código'))), h('tbody', {}, ...rows.map((x) => h('tr', {}, h('td', {}, x.nome || '—'), h('td', {}, h('b', { class: 'rg-code' }, x.code))))))))); }
  const msgPasse = (code, o, dias) => `oi! aqui está o seu código da Beaterista: ${code}\nlibera: ${o}. vale ${dias} dia${dias === 1 ? '' : 's'} a partir da 1ª vez que você usar, em até 2 aparelhos.\nentre em ${SITE}, toque em "já sou aluno" e digite o código. anote ele: na tela aparece escondido, por segurança.`;
  function mostraPasse(code, o, dias) {
    const m = msgPasse(code, o, dias);
    out.replaceChildren(h('section', { class: 'card pad cod-new' }, h('div', { class: 'row between' }, h('b', {}, `passe: ${o}`), h('button', { class: 'btn small', type: 'button', onclick: () => copy(m, 'mensagem copiada (cola no WhatsApp)') }, 'copiar mensagem')),
      h('p', { class: 'rg-code', style: 'font-size:28px;margin:6px 0' }, code), h('p', { class: 'muted' }, m)));
  }
  const msgCodigo = (code) => `oi! aqui está o seu código de aluno da Beaterista: ${code}\nentre em ${SITE}, toque em "já sou aluno" e digite o código. vale o site todo, em até 2 aparelhos, por 1 ano. anote o código: na tela ele aparece escondido, por segurança.`;
  function mostraCodigo(code, nome) {
    const m = msgCodigo(code);
    out.replaceChildren(h('section', { class: 'card pad cod-new' }, h('div', { class: 'row between' }, h('b', {}, nome ? `código de ${nome}` : 'novo código'), h('span', { class: 'row' }, h('button', { class: 'btn small', type: 'button', onclick: () => copy(code, 'código copiado') }, 'copiar código'), h('button', { class: 'btn small', type: 'button', onclick: () => copy(m, 'mensagem copiada (cola no WhatsApp)') }, 'copiar mensagem'))),
      h('p', { class: 'rg-code', style: 'font-size:32px;margin:6px 0;letter-spacing:.12em' }, code), h('p', { class: 'muted' }, m)));
  }
  async function doUm() {
    if (busy) return; busy = true;
    const nome = String(umNome.value || '').trim().slice(0, 50); const usados = new Set(list.map((x) => x.code));
    let code; do code = CODE.gerar(); while (usados.has(code));
    try { await CODE.importar([{ code, nome }]); mostraCodigo(code, nome); umNome.value = ''; toast('código criado ✓', { id: 'cod-ok', ms: 2500 }); await load(); }
    catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra gerar' : `não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); }
    busy = false; draw();
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
    const ids = [...host.querySelectorAll('.cod-passes input:checked')].map((x) => x.dataset.id); if (!ids.length) return toast('marque pelo menos uma aba', { id: 'cod-err', ms: 2600 });
    const dias = Math.max(1, Math.min(365, Math.round(Number(diasIn.value) || 3))); if (busy) return; busy = true;
    const nomes = ABAS.filter((x) => ids.includes(x[0])).map((x) => x[1]).join(' + ');
    try { const code = await CODE.criarPasse({ prefixo: '', tam: 6, nome: `libera ${nomes}`, dias, jogos: rotasDe(ids) }); mostraPasse(code, nomes, dias); toast('código gerado ✓', { id: 'cod-ok', ms: 2200 }); await load(); }
    catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra gerar' : `não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); }
    busy = false; draw();
  }
  // muda as abas e os dias de um código já criado (amigos, marcas, parceiros)
  function editar(x) {
    const marcadas = abasDe(x.jogos); const di = h('input', { type: 'number', class: 'field cod-qtd', min: 1, max: 365, value: x.dias || 3, inputmode: 'numeric', 'aria-label': 'Dias' });
    sheet(`editar ${x.code}`, (close) => h('div', { class: 'sheet-body' }, h('p', { class: 'muted' }, 'o que ficar desmarcado fecha pra esse código (igual a quem entra sem acesso). a Lojinha é sempre livre.'),
      h('div', { class: 'cod-passes' }, ...ABAS.map(([id, nome]) => h('label', { class: 'jg-chk' }, h('input', { type: 'checkbox', 'data-id': id, checked: marcadas.includes(id) }), ` ${nome}`))),
      h('div', { class: 'row' }, h('label', { class: 'muted' }, 'dias a partir de hoje '), di),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { const ids = [...document.querySelectorAll('.sheet-body .cod-passes input:checked')].map((i) => i.dataset.id); if (!ids.length) return toast('marque pelo menos uma aba', { id: 'cod-err', ms: 2400 }); const dias = Math.max(1, Math.min(365, Math.round(Number(di.value) || 3))); close(); run(() => CODE.alterar(x.code, { jogos: rotasDe(ids), dias, ...(x.ultimo_uso || x.expira_em ? { expira_em: new Date(Date.now() + dias * 864e5).toISOString() } : {}), ativo: true }), 'código atualizado'); } }, 'salvar'))));
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


/* ---------- aba Códigos (2 cards) ---------- */
const msgNovo = (code, dias) => `oi! aqui está o seu código da Beaterista: ${code}\nentre em ${SITE}, toque em "já sou aluno" e digite o código. vale o site todo, em até 2 aparelhos, por ${CODE.nomeTempo(dias)} a partir da 1ª vez que você usar. 🥁`;
export function mount(host) {
  let list = []; let gone = false; let busy = false;
  let code = CODE.gerar(); let salvo = false; let cat = 'aluno'; let dias = 365; let ativo = true; let abas = []; let abasAberto = false; // abas = [] quer dizer "todas as abas" // estado do card "novo código"
  let q = ''; let fTipo = ''; let fTempo = ''; let fAtivo = '';
  const sel = (opts, valor, onChange, label) => { const s = h('select', { class: 'field', 'aria-label': label }, ...opts.map(([v, t]) => h('option', { value: String(v), selected: String(v) === String(valor) }, t))); s.addEventListener('change', () => onChange(s.value)); return s; };
  const tiles = (opts, valor, onPick, label, attr) => h('div', { class: 'cod-tiles', role: 'radiogroup', 'aria-label': label }, ...opts.map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(String(v) === String(valor)), class: `cod-tile${String(v) === String(valor) ? ' on' : ''}`, [attr]: String(v), onclick: () => onPick(v) }, t)));
  const interruptor = (on, rotulo, onToggle, aria) => h('button', { type: 'button', role: 'switch', 'aria-checked': String(on), 'aria-label': aria, class: `cod-sw${on ? ' on' : ''}`, onclick: onToggle }, h('span', { class: 'cod-sw-t', 'aria-hidden': 'true' }), rotulo ? h('span', {}, rotulo) : null);
  const nomeIn = h('input', { class: 'field', type: 'text', maxlength: 50, placeholder: 'nome (de quem vai usar)', autocomplete: 'off', 'aria-label': 'Nome' });
  const codeEl = h('p', { class: 'rg-code cod-big', 'aria-live': 'polite' }, code);
  const status = h('p', { class: 'muted', role: 'status' });
  const novoCard = h('section', { class: 'card pad cod-novo' });
  const listaBox = h('div', { class: 'cod-lista' });
  const nomeCat = (c) => (CODE.CATEGORIAS.find((x) => x[0] === c) || ['', 'Alunos'])[1];
  const sorteia = () => { const usados = new Set(list.map((x) => x.code)); do code = CODE.gerar(); while (usados.has(code)); salvo = false; codeEl.textContent = code; status.textContent = ''; };
  const salvar = async () => {
    if (salvo) return true; if (busy) return false; busy = true;
    try { await CODE.criarCodigo({ code, categoria: cat, dias, nome: nomeIn.value.trim(), ativo, jogos: abas.length ? rotasDe(abas) : null }); salvo = true; status.textContent = `código salvo ✓ (${nomeCat(cat)} · ${CODE.nomeTempo(dias)} · ${resumoAbas()}${ativo ? '' : ' · desativado'})`; await carrega(); return true; }
    catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra gerar' : e.message === '409' ? 'esse código já existe: gerei outro, toque de novo' : `não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); if (e.message === '409') sorteia(); return false; }
    finally { busy = false; desenhaLista(); }
  };
  const copiar = async () => { if (!(await salvar())) return; await copy(code, 'código copiado'); };
  const compartilhar = async () => {
    if (!(await salvar())) return; const texto = msgNovo(code, dias);
    try { if (navigator.share) { await navigator.share({ text: texto }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  };
  const novoOutro = () => { sorteia(); nomeIn.value = ''; };
  const resumoAbas = () => (abas.length ? ABAS.filter((x) => abas.includes(x[0])).map((x) => x[1].replace(' (tocar)', '')).join(', ') : 'todas as abas');
  const pickAbas = () => {
    const marca = (id) => { if (id === 'todas') abas = []; else { abas = abas.includes(id) ? abas.filter((x) => x !== id) : [...abas, id]; if (abas.length === ABAS.length) abas = []; } salvo = false; status.textContent = ''; desenhaNovo(); };
    const box = (id, rot, on) => h('label', { class: 'jg-chk cod-aba' }, h('input', { type: 'checkbox', checked: on, 'data-aba': id, onchange: () => marca(id) }), ` ${rot}`);
    return h('div', { class: 'cod-abas' },
      h('button', { type: 'button', class: 'field cod-abas-btn', 'aria-expanded': String(abasAberto), onclick: () => { abasAberto = !abasAberto; desenhaNovo(); } }, h('span', {}, resumoAbas()), h('i', { 'aria-hidden': 'true' }, abasAberto ? '▴' : '▾')),
      abasAberto ? h('div', { class: 'cod-abas-lista', role: 'group', 'aria-label': 'Abas liberadas' }, box('todas', 'Todas as abas', !abas.length), ...ABAS.map(([id, rot]) => box(id, rot.replace(' (tocar)', '').replace('Álbum, roleta e perfil', 'Álbum'), abas.includes(id)))) : null);
  };
  const desenhaNovo = () => novoCard.replaceChildren(
    h('div', { class: 'row between' }, h('b', {}, 'novo código'), h('button', { class: 'btn small ghost', type: 'button', onclick: novoOutro }, '↻ outro código')), codeEl,
    h('div', { class: 'cod-form' },
      h('div', { class: 'field' }, h('span', {}, 'tipo'), tiles(CODE.CATEGORIAS, cat, (v) => { cat = v; salvo = false; status.textContent = ''; desenhaNovo(); }, 'Tipo do código', 'data-tipo')),
      h('div', { class: 'field' }, h('span', {}, 'tempo de acesso'), tiles(CODE.TEMPOS, dias, (v) => { dias = Number(v); salvo = false; status.textContent = ''; desenhaNovo(); }, 'Tempo de acesso', 'data-tempo')),
      h('div', { class: 'field' }, h('span', {}, 'abas liberadas'), pickAbas()),
      h('label', { class: 'field' }, h('span', {}, 'nome'), nomeIn)),
    h('div', { class: 'cod-imp' }, h('span', {}, 'importar código'), interruptor(ativo, ativo ? 'ativado' : 'desativado', () => { ativo = !ativo; salvo = false; status.textContent = ''; desenhaNovo(); }, 'Importar código')),
    h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', disabled: busy, onclick: copiar }, '📋 copiar código'), h('button', { class: 'btn', type: 'button', disabled: busy, onclick: compartilhar }, '📤 compartilhar')),
    status);
  const tempoDe = (x) => (x.dias ? CODE.nomeTempo(x.dias) : '—');
  const venc = (x) => (x.expira_em ? `vence ${dia(x.expira_em)}` : x.tipo === 'passe' ? 'conta a partir do 1º uso' : '—');
  const filtrados = () => { const t = q.trim().toLowerCase(); return list.filter((x) => (!t || (x.nome || '').toLowerCase().includes(t) || x.code.toLowerCase().includes(t)) && (!fTipo || (x.categoria || 'aluno') === fTipo) && (!fTempo || String(x.dias) === fTempo) && (!fAtivo || (fAtivo === 'ativo') === !!x.ativo)); };
  const run = async (fn, ok) => { if (busy) return; busy = true; try { await fn(); toast(ok, { id: 'cod-ok', ms: 2200 }); await carrega(); } catch (e) { toast(`não deu (${e.message})`, { id: 'cod-err', ms: 3500 }); } busy = false; desenhaLista(); };
  const mudarTempo = (x) => sheet(`tempo de acesso · ${x.nome || x.code}`, (close) => { let v = x.dias || 365; const s = sel(CODE.TEMPOS, v, (n) => { v = Number(n); }, 'Novo tempo de acesso');
    return h('div', { class: 'sheet-body' }, h('p', { class: 'muted' }, x.expira_em || x.iniciado_em ? 'o código já começou a contar: o novo tempo vale a partir de hoje.' : 'o código ainda não foi usado: a contagem do novo tempo começa no 1º uso.'), h('label', { class: 'field' }, h('span', {}, 'tempo'), s),
      h('div', { class: 'row end' }, h('button', { class: 'btn ghost', type: 'button', onclick: close }, 'cancelar'), h('button', { class: 'btn primary', type: 'button', onclick: () => { close(); run(() => CODE.mudarTempo(x, v), 'tempo atualizado ✓'); } }, 'salvar'))); });
  const desenhaLista = () => {
    const rows = filtrados(); const n = list.filter((x) => x.ativo).length;
    listaBox.replaceChildren(h('p', { class: 'muted' }, `${rows.length} de ${list.length} código${list.length === 1 ? '' : 's'} · ${n} ativo${n === 1 ? '' : 's'}`),
      ...(rows.length ? rows.map((x) => h('article', { class: `cod-item${x.ativo ? '' : ' off'}` },
        h('div', { class: 'cod-item-top' }, h('span', { class: `cod-av c-${x.categoria || 'aluno'}`, 'aria-hidden': 'true' }, (x.nome || x.code)[0].toUpperCase()),
          h('div', { class: 'cod-item-id' }, h('b', {}, x.nome || 'sem nome'), h('small', { class: 'muted' }, `${x.code} · ${tempoDe(x)} · ${venc(x)}`)),
          h('span', { class: `cod-tag c-${x.categoria || 'aluno'}` }, nomeCat(x.categoria || 'aluno')),
          interruptor(!!x.ativo, '', () => run(() => CODE.alterar(x.code, { ativo: !x.ativo }), x.ativo ? 'desativado' : 'ativado ✓'), `${x.ativo ? 'Desativar' : 'Ativar'} ${x.nome || x.code}`)),
        h('small', { class: 'muted cod-item-meta' }, `${x.usos ?? 0} uso${x.usos === 1 ? '' : 's'} · ${Array.isArray(x.jogos) && x.jogos.length ? ABAS.filter((a) => abasDe(x.jogos).includes(a[0])).map((a) => a[1].replace(' (tocar)', '').replace('Álbum, roleta e perfil', 'Álbum')).join(', ') : 'todas as abas'}`),
        h('div', { class: 'row cod-item-act' }, h('button', { class: 'btn small ghost', type: 'button', onclick: () => copy(x.code, 'código copiado') }, 'copiar'), h('button', { class: 'btn small ghost', type: 'button', disabled: busy, onclick: () => mudarTempo(x) }, 'mudar tempo')))) : [h('p', { class: 'empty muted' }, list.length ? 'nenhum código com esse filtro.' : 'nenhum código ainda.')]));
  };
  const busca = h('input', { class: 'field', type: 'search', placeholder: 'procurar nome ou código', 'aria-label': 'Procurar código' }); busca.addEventListener('input', () => { q = busca.value; desenhaLista(); });
  const listaCard = h('section', { class: 'card pad' }, h('b', {}, 'códigos'), busca,
    h('div', { class: 'cod-filtros' },
      sel([['', 'todos os tipos'], ...CODE.CATEGORIAS], fTipo, (v) => { fTipo = v; desenhaLista(); }, 'Filtrar por tipo'),
      sel([['', 'todos os tempos'], ...CODE.TEMPOS], fTempo, (v) => { fTempo = v; desenhaLista(); }, 'Filtrar por tempo'),
      sel([['', 'ativos e desativados'], ['ativo', 'só ativos'], ['off', 'só desativados']], fAtivo, (v) => { fAtivo = v; desenhaLista(); }, 'Filtrar por situação')), listaBox);
  async function carrega() { try { list = await CODE.listar(); } catch (e) { toast(e.message === 'entre no app' ? 'entre no app pra ver os códigos' : `não consegui ler os códigos (${e.message})`, { id: 'cod-err', ms: 3500 }); } if (!gone) desenhaLista(); }
  const mais = h('details', { class: 'card pad cod-mais' }, h('summary', {}, 'mais ferramentas: importar lista, passe anual, test drive'), h('div', { class: 'cod-mais-in' }));
  host.append(banner('Códigos', 'gere, compartilhe e controle o acesso'), h('div', { class: 'pad-x', style: 'display:grid;gap:12px' }, novoCard, listaCard, mais));
  let legado = null; mais.addEventListener('toggle', () => { if (mais.open && !legado) legado = montarLegado(mais.querySelector('.cod-mais-in'), { semBanner: true }); });
  desenhaNovo(); desenhaLista(); carrega().then(() => { if (!salvo && !list.some((x) => x.code === code)) return; });
  return () => { gone = true; if (typeof legado === 'function') legado(); };
}
