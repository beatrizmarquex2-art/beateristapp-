// Editor de violão, guitarra, baixo (tablatura) e bateria (pauta). Mesma tela do editor de teclado.
//   cordas:  braço desenhado · 6/7/8 cordas (guitarra) ou 4/5/6 (baixo) · acorde = "juntar" · microfone escreve a casa que você toca
//   bateria: pads do kit (simples, médio, completo) · mão D/E · acento > · fantasma ( ) · "juntar" = ao mesmo tempo
// Som: o MESMO do jogo (corda dedilhada e bateria gravada, ver js/pro/som.js). Tudo toca pelo relógio do áudio.
// Desempenho: o instrumento desenhado em baixo é montado UMA vez e só muda quando mudam as opções dele; um toque atualiza só a folha.
import { h } from '../util.js';
import * as store from '../store.js';
import { audio } from '../audio.js';
import { toast } from '../ui.js';
import * as NUV from '../partitura-nuvem.js';
import { baixarPdf } from '../partitura-pdf.js';
import { ouvirNotas } from '../jogos/vivo-ui.js';
import * as CONTAS from '../contas.js';
import * as R from './ritmo.js';
import * as Som from './som.js';
import * as E from './escrita.js';
import { icones } from './icones-kit.js';
import * as MB from './mic-bateria.js';
import * as T from './teoria.js';
import { diagramaSVG } from '../acordes.js';
import { corNota, notaClara } from '../cores-notas.js';
import { arte } from '../kids/kit-modelos.js';
import { svgEl } from '../kids/art.js';
import { pieceAt, flash } from '../kids/kit-theme.js';
import { toque, aoMudarLargura, iconeBtn, acaoBtn, ajustes, painelCorrige } from './editor-ui.js';
import { confirma } from './ui.js';
import { pedeDestino } from './guardar.js';
import { imagemDoEditor } from './exportar.js';
import { seta, cicla, nomeDur, quando } from '../views/partitura-palco.js';
import { IC, noteIcon, RESTIC, DURS } from '../views/editor-partitura.js';

const NOMES = { violao: 'violão', guitarra: 'guitarra', baixo: 'baixo', bateria: 'bateria' };
/** Rota do editor de cada instrumento (teclas é o editor de teclado). */
export const rotaDe = (inst) => (!inst || inst === 'teclas' ? '#/editor' : `#/editor/${inst}`);
const nomeAluno = () => { try { return (CONTAS.atual().nome || '').trim(); } catch { return ''; } };
const MAOS = [['', 'sem indicação'], ['D', 'mão direita (D)'], ['E', 'mão esquerda (E)']];
export { somBateria } from './som.js';

export function mount(host, opts = {}) {
  const inst = NOMES[opts.inst] ? opts.inst : 'violao'; const bat = inst === 'bateria'; const VOLTA = opts.voltar || '#/estudio';
  const CHAVE = `setting-pro-${bat ? 'bateria' : 'cordas'}`; const padrao = inst === 'baixo' ? 4 : 6;
  const lerSalvo = () => { try { const r = store.get(CHAVE); return r && r.data && r.data.inst === inst ? r.data : {}; } catch { return {}; } };
  let novo = false; let nc = 0; try { novo = !!sessionStorage.getItem('pm-novo'); sessionStorage.removeItem('pm-novo'); nc = +sessionStorage.getItem('pm-cordas') || 0; sessionStorage.removeItem('pm-cordas'); } catch { /* sem sessionStorage */ }
  const s = { evs: [], bpm: 100, cor: false, fig: 2, pont: false, titulo: '', nuvemId: null, ncord: padrao, kit: 'medio', modelo: 'acustica', timbre: Som.timbrePadrao(inst), mao: '', acc: false, fan: false, juntar: false, pasta: '', escrita: bat ? 'pauta' : 'tab', visual: bat ? 'kit' : (inst === 'baixo' ? 'notas' : 'acordes'), canhota: false, res: 2, escala: 'todas', tonica: 0, clique: false, repetir: false, batidaOn: false, batidaId: 'pop', batida: null, ...(novo ? {} : lerSalvo()) };
  s.evs = R.normaliza(s.evs); if (novo) { s.evs = []; s.titulo = ''; s.nuvemId = null; }
  if (!bat) { if (nc && R.INSTRUMENTOS[inst].opcoes[nc]) s.ncord = nc; if (!R.INSTRUMENTOS[inst].opcoes[s.ncord]) s.ncord = padrao; if (!Som.TIMBRES[inst].some((t) => t[0] === s.timbre)) s.timbre = Som.timbrePadrao(inst); }
  if (!Som.MODELOS_BATERIA.some((m) => m[0] === s.modelo)) s.modelo = 'acustica';
  if (!E.ESCRITAS[bat ? 'bateria' : 'cordas'].some((x) => x[0] === s.escrita)) s.escrita = bat ? 'pauta' : 'tab';
  if (!(bat ? ['kit', 'grade', 'pads'] : ['acordes', 'notas']).includes(s.visual) || (!bat && inst === 'baixo')) s.visual = bat ? 'kit' : (inst === 'baixo' ? 'notas' : 'acordes'); if (![1, 2, 4].includes(s.res)) s.res = 2;
  if (!Array.isArray(s.batida) || ![8, 16].includes(s.batida.length) || !s.batida.every((v) => ['', 'b', 'c', 'x'].includes(v))) { s.batida = [...T.BATIDAS[0][2]]; s.batidaId = 'pop'; }
  if (!T.ESCALAS.some((e) => e[0] === s.escala)) s.escala = 'todas'; if (!(s.tonica >= 0 && s.tonica < 12)) s.tonica = 0;
  const LS = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  let slots = (() => { const a = LS('pro-acordes', null); return Array.isArray(a) && a.length === 8 && a.every((id) => T.acharAcorde(id)) ? a.map(T.acharAcorde) : T.PADRAO.map(T.acharAcorde); })(); let editando = false; let selSlot = 0; let acorde = 0; let strum = null;
  let sel = -1; let hist = []; let cursor = R.fim(s.evs); let ultimo = null; let casa0 = 0; let modo = 'toque'; let mic = null; let grav = null; let nGrav = 0; let barra = 0; let run = null; let msg = ''; let gone = false;
  const cordas = () => R.cordasDe(inst, s.ncord);
  const salvar = () => store.upsert('setting', CHAVE, { inst, evs: s.evs, bpm: s.bpm, cor: s.cor, fig: s.fig, pont: s.pont, titulo: s.titulo, pasta: s.pasta || '', nuvemId: s.nuvemId || null, ncord: s.ncord, kit: s.kit, modelo: s.modelo, timbre: s.timbre, mao: s.mao, escrita: s.escrita, visual: s.visual, canhota: s.canhota, res: s.res, escala: s.escala, tonica: s.tonica, clique: s.clique, repetir: s.repetir, batidaOn: s.batidaOn, batidaId: s.batidaId, batida: s.batida }).catch(() => {});
  const muda = (novas, { guarda = true } = {}) => { if (guarda) { hist.push(JSON.stringify(s.evs)); if (hist.length > 40) hist.shift(); } s.evs = novas; salvar(); };
  const dur = () => s.fig * (s.pont && s.fig >= 2 ? 1.5 : 1);
  const passo = () => 2;
  const rend = (largura, cor = s.cor, selecao = -1) => (bat
    ? E.bateriaEscrita(s.evs, { escrita: s.escrita, largura, cor, sel: selecao, icones: icones(s.modelo), pecas: s.modelo === 'cajon' ? ['sn', 'bd'] : R.pecasDoKit(s.kit) })
    : E.cordas(s.evs, { cordas: cordas(), inst, escrita: s.escrita, largura, cor, sel: selecao }));

  /* ---------- som (o do jogo) ---------- */
  const tocaAgora = (e) => { if (bat) Som.somBateria(s.modelo, e.p, Som.velDe(e)); else Som.somCorda(s.timbre, R.midiDe(cordas(), e.c, e.f), 0.85); };
  const parar = () => { if (run) { run.stop(); run = null; } Som.silence(); if (mic) mic.surdo(false); };
  const ouvir = () => {
    if (run) { parar(); desenhaTopo(); return; } if (!s.evs.length) return; Som.acorda(); if (mic) mic.surdo(true); // o microfone não escuta o próprio alto-falante
    run = Som.tocaTudo({ evs: s.evs, bpm: s.bpm, bat, modelo: s.modelo, kind: s.timbre, cordas: cordas(), clique: s.clique, repetir: s.repetir, onFim: () => { run = null; if (mic) mic.surdo(false); if (!gone) desenhaTopo(); } }); desenhaTopo();
  };

  /* ---------- entrada ---------- */
  const adiciona = (novoEv) => {
    if (run) parar(); // tocar com a partitura rolando soa por cima: para a reprodução
    const unir = s.juntar && (ultimo || s.evs.length); if (s.juntar && !ultimo && s.evs.length) { const u = s.evs[s.evs.length - 1]; ultimo = { ini: u.ini, d: u.d }; }
    const ini = unir ? ultimo.ini : cursor; const d = unir ? ultimo.d : dur();
    const r = R.poe(s.evs, { ...novoEv, ini, d }); tocaAgora(r.evs[r.i]); // o som primeiro: nada atrasa a batida
    muda(r.evs); sel = -1; ultimo = { ini, d }; if (!unir) cursor = ini + d; msg = ''; atualiza();
  };
  /** Escreve um acorde do violão (ou só as cordas `sub`, índices 0 = mi grave … 5 = mi agudo) no cursor. `semSom` = já soou ao vivo (passando o dedo). */
  const escreveAcorde = (ac, sub = null, semSom = false, dir = 'b') => {
    if (run) parar(); const ini = cursor; const d = dur(); let evs = T.acordeEmEventos(ac, ini, d, s.ncord, dir);
    if (sub) { const cs = sub.map((j) => 5 - j); evs = evs.filter((e) => cs.includes(e.c)); if (evs.length < 4) evs = evs.map((e) => { const { cif, ...r } = e; return r; }); }
    if (!evs.length) return;
    if (!semSom) [...evs].sort((a, b) => (dir === 'c' ? a.c - b.c : b.c - a.c)).forEach((e, i) => Som.somCorda(s.timbre, R.midiDe(cordas(), e.c, e.f), 0.8, audio().currentTime + 0.005 + i * 0.012));
    let l = s.evs; evs.forEach((e) => { l = R.poe(l, e).evs; }); muda(l); cursor = ini + d; ultimo = null; sel = -1; msg = ''; atualiza();
  };
  let previa = null;
  /** Escreve UM compasso com a batida escolhida (↓ ↑ ✕) no acorde, a partir do próximo compasso inteiro, e toca pra você ouvir. */
  const escreveBatida = (ac) => {
    if (run) parar(); if (previa) { previa.stop(); previa = null; }
    const base = Math.ceil(cursor / 16) * 16; const evs = T.batidaEmEventos(ac, s.batida, base, 16 / s.batida.length, s.ncord);
    if (!evs.length) { toast('a batida está vazia: toque nos quadradinhos pra pôr ↓ ↑ ou ✕', { id: 'er', ms: 2400 }); return; }
    Som.acorda(); let l = s.evs; evs.forEach((e) => { l = R.poe(l, e).evs; }); muda(l); cursor = base + 16; ultimo = null; sel = -1; msg = `batida escrita no compasso ${base / 16 + 1}`;
    previa = Som.tocaTudo({ evs: evs.map((e) => ({ ...e, ini: e.ini - base })), bpm: s.bpm, bat: false, kind: s.timbre, cordas: cordas(), clique: false, repetir: false, onFim: () => { previa = null; } }); atualiza();
  };
  const casaTap = (c, f) => adiciona({ c, f });
  const padTap = (p) => adiciona({ p, mao: (R.PECAS[p].pe ? '' : s.mao), acc: s.acc, fan: s.fan });
  const ligaMic = async () => {
    try { mic = await ouvirNotas((m) => { if (gone || modo !== 'mic') return; const pos = R.posicaoDe(cordas(), m); if (!pos) { msg = 'ouvi uma nota que não cabe no braço'; atualiza(); return; } adiciona(pos); msg = `o microfone ouviu: corda ${cordas()[pos.c][0]}, casa ${pos.f}`; atualiza(); }, { instrumento: 'violao' }); msg = 'ouvindo… toque uma nota por vez no seu instrumento'; }
    catch { mic = null; modo = 'toque'; msg = ''; toast('não consegui abrir o microfone. veja se o navegador deixou usar.', { id: 'er', ms: 3600 }); }
    atualiza(); desenhaDir();
  };
  const desligaMic = () => { if (mic) { try { mic.stop(); } catch { /* já parou */ } mic = null; } };
  const pararGrav = () => { if (grav) { try { grav.stop(); } catch { /* ok */ } grav = null; cursor = R.fim(s.evs); msg = nGrav ? `gravei ${nGrav} batida${nGrav > 1 ? 's' : ''}. confira e corrija tocando na nota.` : 'não ouvi nenhuma batida. chegue mais perto do microfone.'; atualiza(); desenhaDir(); } };
  /** Bateria + microfone: conta 4, e cada batida entra com a peça adivinhada pelo som (grave = bumbo, médio = caixa, agudo = chimbal). */
  const gravaBat = async () => {
    if (grav) { pararGrav(); return; } if (run) parar(); Som.acorda(); nGrav = 0; const base0 = Math.ceil(cursor / 16) * 16;
    try {
      hist.push(JSON.stringify(s.evs)); if (hist.length > 40) hist.shift();
      grav = await MB.gravar({ bpm: s.bpm, grade: s.res, onConta: (i) => { msg = `conta ${i}… toque depois do 4`; atualiza(); },
        onBatida: ({ p, ini }) => { if (gone || !grav) return; nGrav++; s.evs = R.poe(s.evs, { p, ini: base0 + ini, d: s.res, mao: '', acc: false, fan: false }).evs; msg = `gravando… ${nGrav} batida${nGrav > 1 ? 's' : ''}`; salvar(); atualiza(); } });
      msg = `contando… (${s.bpm} bpm)`; atualiza(); desenhaDir();
    } catch { grav = null; toast('não consegui abrir o microfone. veja se o navegador deixou usar.', { id: 'er', ms: 3600 }); desenhaDir(); }
  };
  const trocaModo = (m) => { if (modo === m) return; if (grav) pararGrav(); modo = m; if (m === 'mic' && !bat) ligaMic(); else { desligaMic(); msg = ''; } atualiza(); desenhaDir(); };

  /* ---------- pasta online e PDF ---------- */
  const pdf = async (b) => {
    b.disabled = true;
    try { const r = await baixarPdf({ render: (larg) => rend(larg, s.cor, -1), titulo: (s.titulo || '').trim() || `Minha partitura de ${NOMES[inst]}`, aluno: nomeAluno(), bpm: s.bpm, data: new Date().toLocaleDateString('pt-BR'), rodape: opts.rodape, semPapel: !!opts.semPapel, perfil: opts.perfil }); toast(r.shared ? 'pronto! escolha onde salvar' : `PDF salvo: ${r.name}`, { id: 'er', ms: 2600 }); }
    catch { toast('não consegui gerar o PDF agora', { id: 'er', ms: 2600 }); }
    b.disabled = false;
  };
  const dadosNuvem = () => ({ versao: 2, tipo: bat ? 'bateria' : 'tab', inst, escrita: s.escrita, modelo: s.modelo, cor: s.cor, ncord: s.ncord, kit: s.kit, evs: s.evs, bpm: s.bpm, cor: s.cor, titulo: s.titulo });
  const carrega = (row) => {
    const d = row.dados || {}; if (row.instrumento !== inst) { try { sessionStorage.setItem('pm-abrir', row.id); } catch { /* ok */ } location.hash = rotaDe(row.instrumento); return; }
    s.evs = R.normaliza(d.evs); s.bpm = d.bpm || 100; s.cor = !!d.cor; if (!bat && R.INSTRUMENTOS[inst].opcoes[d.ncord]) s.ncord = d.ncord; if (bat && d.kit) s.kit = d.kit; if (d.escrita && E.ESCRITAS[bat ? 'bateria' : 'cordas'].some((x) => x[0] === d.escrita)) s.escrita = d.escrita;
    s.titulo = row.nome; s.pasta = row.pasta || ''; s.nuvemId = row.id; hist = []; cursor = R.fim(s.evs); ultimo = null; sel = -1; msg = `aberta da pasta online: ${row.nome}`; salvar(); atualiza(); desenhaDir(); desenhaTopo();
  };
  const pastasNuvem = async () => { try { return NUV.pastasDe(await NUV.listar()); } catch { return []; } };
  const guardaOnline = async (b) => {
    const dest = await pedeDestino({ nome: s.titulo, pasta: s.pasta || '', jaGuardada: !!s.nuvemId, pastas: await pastasNuvem() }); if (!dest) return;
    s.titulo = dest.nome; s.pasta = dest.pasta; if (nomeInput) nomeInput.value = s.titulo; b.disabled = true;
    try { const r = await NUV.salvar({ id: dest.copia ? null : s.nuvemId, nome: dest.nome, instrumento: inst, dados: dadosNuvem(), pasta: dest.pasta }); s.nuvemId = r.id; salvar(); msg = `${dest.copia ? 'cópia ' : ''}guardada na pasta online${dest.pasta ? ` (pasta ${dest.pasta})` : ''}: ${r.nome} (${quando(r.atualizado_em)})`; }
    catch (e) { toast(NUV.textoErro(e), { id: 'er', ms: 3200 }); }
    b.disabled = false; atualiza(); desenhaTopo();
  };
  /** Duplicar: guarda uma cópia nova (nome "… (cópia)", mesma pasta) e passa a editar a cópia. */
  const duplicar = async (b) => {
    const nome = `${(s.titulo || 'Minha partitura').trim()} (cópia)`.slice(0, 60); b.disabled = true;
    try { const r = await NUV.salvar({ id: null, nome, instrumento: inst, dados: dadosNuvem(), pasta: s.pasta || '' }); s.nuvemId = r.id; s.titulo = r.nome; if (nomeInput) nomeInput.value = s.titulo; salvar(); msg = `cópia criada: ${r.nome}. você está editando a cópia.`; }
    catch (e) { toast(NUV.textoErro(e), { id: 'er', ms: 3200 }); }
    b.disabled = false; atualiza(); desenhaTopo();
  };
  const imagem = async (b) => {
    b.disabled = true;
    try { const r = await imagemDoEditor((larg) => rend(larg, s.cor, -1), { titulo: (s.titulo || '').trim() || 'Minha partitura', aluno: '', bpm: s.bpm, data: new Date().toLocaleDateString('pt-BR'), rodape: opts.rodape, perfil: opts.perfil }); toast(r.shared ? 'pronto! escolha onde salvar' : `imagem salva: ${r.name}${r.paginas > 1 ? ` (+${r.paginas - 1} página${r.paginas > 2 ? 's' : ''})` : ''}`, { id: 'er', ms: 2800 }); }
    catch { toast('não consegui gerar a imagem agora', { id: 'er', ms: 2600 }); }
    b.disabled = false;
  };
  const publicarBanco = () => opts.publicar && opts.publicar({ titulo: (s.titulo || '').trim(), instrumento: inst, dados: dadosNuvem(), bpm: s.bpm });

  /* ---------- peças fixas da tela ---------- */
  const folha = h('div', { class: 'ep-folha er-folha', role: 'group', 'aria-label': 'Partitura. Toque numa nota para corrigir.' });
  folha.addEventListener('click', (e) => { const n = e.target.closest && e.target.closest('.pm-n'); const i = n ? +n.dataset.ev : -1; if (i >= 0 && s.evs[i]) { sel = sel === i ? -1 : i; if (sel >= 0) tocaAgora(s.evs[sel]); } else sel = -1; atualiza(); });
  const topo = h('div', { class: 'ep-bar' }); const acoes = h('div', { class: 'ep-acoes' }); const barraEl = h('div', { class: 'ep-barra' }); const meio = h('div', { class: 'ep-meio' }); const dir = h('div', { class: 'ep-dir' });
  const modoEl = h('div', {}); const ajEl = h('div', {}); const instEl = h('div', {});
  dir.append(modoEl, ajEl, instEl);
  const tg = (rot, on, fn, dis = false) => h('button', { type: 'button', class: 'er-tg', 'aria-pressed': String(!!on), disabled: dis, onclick: fn }, rot);

  const correcao = () => {
    const e = s.evs[sel]; if (!e) return null; const nomeSel = bat ? R.nomePeca(e.p) : `corda ${cordas()[e.c][0]} · casa ${e.f}`;
    const aplica = (parte, tocar = false) => { const novo = R.muda(s.evs, sel, parte); if (novo === s.evs) { toast('já tem uma nota ali', { id: 'er', ms: 1500 }); return; } muda(novo); if (tocar) tocaAgora(novo[sel]); atualiza(); };
    const setas = [
      seta('posição', `compasso ${Math.floor(e.ini / 16) + 1} · tempo ${Math.floor((e.ini % 16) / 4) + 1}`, () => aplica({ ini: e.ini - passo() }), () => aplica({ ini: e.ini + passo() }), { dis: [e.ini === 0, false] }),
      seta('duração', nomeDur(e.d), () => aplica({ d: e.d - passo() }), () => aplica({ d: e.d + passo() }), { dis: [e.d <= 1, e.d >= 16] }),
    ]; const botoes = [];
    if (bat) {
      const ids = Object.keys(R.PECAS); setas.push(cicla('peça', ids.map((p) => [p, R.nomePeca(p)]), e.p, (p) => aplica({ p, mao: R.PECAS[p].pe ? '' : e.mao }, true)));
      if (!R.PECAS[e.p].pe) setas.push(cicla('mão', MAOS, e.mao || '', (mao) => aplica({ mao })));
      botoes.push(tg('acento >', e.acc, () => aplica({ acc: !e.acc, fan: e.acc ? e.fan : false })), tg('fantasma ( )', e.fan, () => aplica({ fan: !e.fan, acc: e.fan ? e.acc : false })));
    } else {
      setas.push(seta('casa', `casa ${e.f}`, () => aplica({ f: e.f - 1 }, true), () => aplica({ f: e.f + 1 }, true), { dis: [e.f <= 0, e.f >= R.MAX_CASA] }), seta('corda', cordas()[e.c][0], () => aplica({ c: e.c - 1 }, true), () => aplica({ c: e.c + 1 }, true), { dis: [e.c <= 0, e.c >= cordas().length - 1] }));
    }
    botoes.push(h('button', { type: 'button', class: 'er-tg perigo', onclick: () => { muda(R.remover(s.evs, sel)); sel = -1; atualiza(); } }, 'apagar nota'));
    return painelCorrige(`corrigir: ${nomeSel}`, () => { sel = -1; atualiza(); }, setas, botoes);
  };
  const palette = () => {
    const bt = (ico, lab, on, fn, dis = false) => { const b = h('button', { type: 'button', class: 'ep-pb', 'aria-pressed': String(!!on), 'aria-label': lab, title: lab, disabled: dis }); b.innerHTML = ico; b.addEventListener('click', fn); return b; };
    return h('div', { class: 'ep-pal', role: 'group', 'aria-label': 'Duração da próxima nota' },
      ...DURS.map(([d, n]) => bt(noteIcon(d), n, s.fig === d, () => { s.fig = d; if (d === 1) s.pont = false; salvar(); atualiza(); })),
      bt('<span class="ep-t">•</span>', 'pontuada', s.pont, () => { s.pont = !s.pont; salvar(); atualiza(); }, s.fig === 1), h('span', { class: 'ep-sep' }),
      bt(RESTIC, 'pausa (pula um tempo)', false, () => { cursor += dur(); ultimo = null; msg = `pausa de ${nomeDur(dur())}. a próxima nota vem depois dela.`; atualiza(); }),
      bt(`<span class="ep-t" style="color:${s.cor ? '#fff' : '#e0262f'}">●</span>`, 'notas coloridas', s.cor, () => { s.cor = !s.cor; salvar(); atualiza(); }));
  };
  const extras = () => (bat
    ? h('div', { class: 'er-tgs' }, tg('acento >', s.acc, () => { s.acc = !s.acc; if (s.acc) s.fan = false; atualiza(); }), tg('fantasma ( )', s.fan, () => { s.fan = !s.fan; if (s.fan) s.acc = false; atualiza(); }), tg('juntar', s.juntar, () => { s.juntar = !s.juntar; atualiza(); }))
    : h('div', { class: 'er-tgs' }, tg('acorde: juntar com a anterior', s.juntar, () => { s.juntar = !s.juntar; atualiza(); })));

  /* ---------- o instrumento desenhado (montado só quando as opções mudam) ---------- */
  const braco = () => {
    const cs = cordas(); const n = 6; const cab = ['', ...Array.from({ length: n }, (_, k) => (casa0 + k === 0 ? 'solta' : `${casa0 + k}ª`))];
    const g = h('div', { class: 'er-braco', role: 'group', 'aria-label': 'Braço do instrumento', style: `--n:${n}` }, ...cab.map((t) => h('span', { class: 'er-fr' }, t)));
    cs.forEach(([nome], c) => { g.append(h('span', { class: 'er-cd' }, nome)); for (let k = 0; k < n; k++) { const f = casa0 + k; const m = R.midiDe(cs, c, f); const dentro = T.naEscala(m, s.tonica, s.escala);
      g.append(toque(h('button', { type: 'button', class: `er-casa${f === 0 ? ' solta' : ''}${dentro ? '' : ' fora'}${s.escala !== 'todas' && T.ehTonica(m, s.tonica) ? ' raiz' : ''}`, 'aria-label': `corda ${nome}, casa ${f}`, style: `--nc:${corNota(m)}` }, f), () => casaTap(c, f))); } });
    return g;
  };
  /** Acordes como no jogo: 8 cartas com o desenho de onde apertar, "trocar" pelos 24, e as cordas pra passar o dedo. */
  const carta = (ac, i, onclick) => { const b = toque(h('button', { type: 'button', class: `er-carta${i === (editando ? selSlot : acorde) ? ' on' : ''}`, 'aria-label': `${ac.nome} ${ac.tipo}` }, h('b', {}, ac.nome), h('em', {}, ac.tipo), h('span', { class: 'er-mao' })), onclick); b.querySelector('.er-mao').innerHTML = diagramaSVG(ac); return b; };
  const GROSS = [4, 3.6, 3, 2.3, 1.7, 1.2];
  const cordasStrum = () => {
    const el = h('div', { class: 'er-strum', role: 'group', 'aria-label': 'Cordas: passe o dedo pra baixo e pra cima, ou toque numa só' });
    const linhas = GROSS.map((w, i) => { const l = h('div', { class: `er-str${i < 3 ? ' grave' : ''}`, style: `--w:${w}px` }, h('i', {})); el.append(l); return l; });
    const ys = () => linhas.map((l) => { const r = l.getBoundingClientRect(); return r.top + r.height / 2; });
    const toca1 = (j, vel, atraso = 0) => { const ac = slots[acorde]; const m = ac.notas[j]; const li = linhas[j].firstChild; if (m == null) return false; Som.somCorda(s.timbre, m, vel, audio().currentTime + 0.005 + atraso); const amp = 2 + vel * 6; setTimeout(() => li.animate([{ transform: `translateY(${amp}px)` }, { transform: `translateY(${-amp * 0.7}px)` }, { transform: 'translateY(0)' }], { duration: 420, easing: 'ease-out' }), atraso * 1000); return true; };
    el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); Som.acorda(); try { el.setPointerCapture(e.pointerId); } catch { /* ok */ } const yy = ys(); let bi = 0; let bd = 1e9; yy.forEach((y, i) => { const d = Math.abs(y - e.clientY); if (d < bd) { bd = d; bi = i; } });
      strum = { id: e.pointerId, y: e.clientY, t: e.timeStamp, hit: [], dir: 'b' }; if (bd <= 26 && toca1(bi, 0.85)) strum.hit.push(bi); });
    el.addEventListener('pointermove', (e) => { if (!strum || strum.id !== e.pointerId) return; const y = e.clientY; const dy = y - strum.y; if (!dy) return; const vel = Math.max(0.45, Math.min(1, 0.45 + (Math.abs(dy) / Math.max(1, e.timeStamp - strum.t)) * 0.5)); const yy = ys(); const novos = []; strum.dir = dy > 0 ? 'b' : 'c';
      yy.forEach((sy, i) => { if (((strum.y < sy && y >= sy) || (strum.y > sy && y <= sy)) && !strum.hit.includes(i)) novos.push(i); }); if (dy < 0) novos.reverse();
      novos.forEach((i, k) => { if (toca1(i, vel, k * 0.009)) strum.hit.push(i); }); strum.y = y; strum.t = e.timeStamp; });
    const fim = (e) => { if (!strum || strum.id !== e.pointerId) return; const hit = [...strum.hit].sort((a, b) => a - b); const dir = strum.dir; strum = null; if (hit.length) escreveAcorde(slots[acorde], hit, true, hit.length > 1 ? dir : 'b'); };
    el.addEventListener('pointerup', fim); el.addEventListener('pointercancel', () => { strum = null; });
    return el;
  };
  const salvaSlots = () => { try { localStorage.setItem('pro-acordes', JSON.stringify(slots.map((a) => a.id))); } catch { /* sem armazenamento */ } };
  const painelAcordes = () => {
    const cartas = h('div', { class: 'er-cartas', role: 'group', 'aria-label': 'Acordes' }, ...slots.map((ac, i) => carta(ac, i, () => { if (editando) { selSlot = i; desenhaDir(); return; } acorde = i; if (s.batidaOn) escreveBatida(ac); else escreveAcorde(ac); desenhaDir(); })));
    const trocar = h('button', { type: 'button', class: 'er-tg', 'aria-pressed': String(editando), onclick: () => { editando = !editando; selSlot = acorde; desenhaDir(); } }, editando ? 'pronto' : '✎ trocar acordes');
    const bandeja = editando ? h('div', { class: 'er-bandeja' }, h('small', {}, `trocando o ${selSlot + 1}º: escolha o novo (ou toque numa carta de cima)`), ...['maior', 'menor'].map((tipo) => h('div', { class: 'er-bsec' }, h('small', {}, `${tipo}es`), h('div', { class: 'er-bgrade' }, ...T.ACORDES.filter((a) => a.tipo === tipo).map((ac) => toque(h('button', { type: 'button', class: `er-peq${slots[selSlot].id === ac.id ? ' atual' : ''}`, 'aria-label': `${ac.nome} ${ac.tipo}` }, ac.nome), () => { slots[selSlot] = ac; salvaSlots(); Som.aquece({ bat: false, kind: s.timbre, midis: ac.notas.filter((m) => m != null) }); Som.somCorda(s.timbre, ac.notas.find((m) => m != null), 0.8); selSlot = (selSlot + 1) % 8; desenhaDir(); }))))), h('button', { type: 'button', class: 'er-tg', onclick: () => { slots = T.PADRAO.map(T.acharAcorde); salvaSlots(); desenhaDir(); } }, 'voltar aos de sempre')) : null;
    const BT = T.BATIDAS; const expande = (p) => p.flatMap((v) => [v, '']); const reduz = (p) => p.filter((_, i) => i % 2 === 0);
    const aplicaPreset = (id) => { const b = BT.find((x) => x[0] === id); if (!b) return; s.batidaId = id; s.batida = s.batida.length === 16 ? expande(b[2]) : [...b[2]]; salvar(); desenhaDir(); };
    const painelBatida = h('div', { class: 'er-batida' },
      tg('escrever o compasso inteiro com a batida', s.batidaOn, () => { s.batidaOn = !s.batidaOn; salvar(); desenhaDir(); }),
      ...(s.batidaOn ? [cicla('batida', [...BT.map((b) => [b[0], b[1]]), ['minha', 'minha batida']], s.batidaId, (id) => { if (id === 'minha') { s.batidaId = 'minha'; salvar(); desenhaDir(); } else aplicaPreset(id); }),
        h('div', { class: 'er-bt', role: 'group', 'aria-label': 'Batida: toque num quadradinho pra mudar', style: `--n:${s.batida.length}` }, ...s.batida.map((v, i) => { const res = 16 / s.batida.length; const b = h('button', { type: 'button', class: `er-btc${v ? ' on' : ''}${(i * res) % 4 === 0 ? ' t' : ''}`, 'aria-label': `passo ${E.contagem(i * res)}: ${{ b: 'pra baixo', c: 'pra cima', x: 'abafado', '': 'vazio' }[v]}` }, h('i', {}, T.SIMBOLO[v]), h('small', {}, E.contagem(i * res))); return toque(b, () => { s.batida[i] = T.proximoSimbolo(s.batida[i]); s.batidaId = 'minha'; salvar(); desenhaDir(); }); })),
        cicla('passos', [[8, 'colcheias (8)'], [16, 'semicolcheias (16)']], s.batida.length, (n) => { s.batida = n === 16 ? expande(s.batida) : reduz(s.batida); salvar(); desenhaDir(); }),
        h('p', { class: 'ep-dica' }, '↓ pra baixo · ↑ pra cima (só as 4 cordas agudas) · ✕ abafada · · segura o som. toque numa carta de acorde: ele escreve o compasso inteiro e toca.')] : []));
    return [cartas, trocar, painelBatida, bandeja, editando ? null : h('p', { class: 'ep-dica' }, 'toque numa carta pra escrever o acorde (com a cifra). ou passe o dedo nas cordas: pra baixo e pra cima, ou numa só.'), editando ? null : cordasStrum()];
  };
  const pads = () => h('div', { class: 'er-pads', role: 'group', 'aria-label': 'Peças da bateria' }, ...R.pecasDoKit(s.kit).map((p) => toque(h('button', { type: 'button', class: `er-pad${R.PECAS[p].pe ? ' pedal' : ''}`, 'data-p': p }, h('b', {}, R.nomePeca(p)), h('small', {}, R.PECAS[p].pe ? 'pé' : R.PECAS[p].x ? 'cabeça X' : 'cabeça normal')), () => padTap(p))));
  /** O kit ilustrado do jogo (Toque): cada peça é um toque. Peças fora do kit escolhido ficam apagadas. */
  const kitArt = () => {
    const wrap = h('div', { class: `er-kit${s.canhota ? ' canhota' : ''}` }); const art = svgEl(arte(s.modelo), `er-art modelo-${s.modelo}`);
    const ok = s.modelo === 'cajon' ? ['bd', 'sn'] : R.pecasDoKit(s.kit);
    art.querySelectorAll('.kp').forEach((g) => { if (!ok.includes(g.dataset.p)) g.classList.add('apagada'); });
    art.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; const g = pieceAt(art, e, 36); if (!g || g.classList.contains('apagada')) return; e.preventDefault(); flash(g); padTap(g.dataset.p); });
    art.addEventListener('contextmenu', (e) => e.preventDefault());
    wrap.append(art);
    const extras = ['ho', 'hf'].filter((p) => ok.includes(p) && s.modelo !== 'cajon');
    if (extras.length) wrap.append(h('div', { class: 'er-extras' }, ...extras.map((p) => toque(h('button', { type: 'button', class: 'er-mini', 'data-p': p }, R.nomePeca(p)), () => padTap(p)))));
    return wrap;
  };
  /** Grade como o Beat Lab: linhas = peças, colunas = tempos do compasso; tocar numa casa liga/desliga a batida. */
  const gradeBeat = () => {
    const pecas = s.modelo === 'cajon' ? ['sn', 'bd'] : R.pecasDoKit(s.kit); const passos = 16 / s.res; const nBars = R.nCompassos(s.evs); if (barra > nBars) barra = nBars; const base = barra * 16;
    const g = h('div', { class: 'er-grade', role: 'group', 'aria-label': `Grade do compasso ${barra + 1}`, style: `--n:${passos}` }, h('span', {}), ...Array.from({ length: passos }, (_, k) => h('span', { class: `er-gh${(k * s.res) % 4 === 0 ? ' t' : ''}` }, E.contagem(k * s.res))));
    pecas.forEach((p) => {
      g.append(h('span', { class: 'er-gl', style: `--c:${R.PECAS[p].cor}` }, R.nomePeca(p)));
      for (let k = 0; k < passos; k++) {
        const ini = base + k * s.res; const ach = () => s.evs.findIndex((e) => e.p === p && e.ini === ini); const b = h('button', { type: 'button', class: `er-gc${(k * s.res) % 4 === 0 ? ' t' : ''}`, 'aria-label': `${R.nomePeca(p)}, ${E.contagem(k * s.res)}`, 'aria-pressed': String(ach() >= 0), style: `--c:${R.PECAS[p].cor}` });
        toque(b, () => { if (run) parar(); const i = ach();
          if (i >= 0) { muda(R.remover(s.evs, i)); b.setAttribute('aria-pressed', 'false'); }
          else { const ev = { p, ini, d: s.res, mao: R.PECAS[p].pe ? '' : s.mao, acc: s.acc, fan: s.fan }; tocaAgora(ev); muda(R.poe(s.evs, ev).evs); b.setAttribute('aria-pressed', 'true'); }
          sel = -1; cursor = R.fim(s.evs); ultimo = null; msg = ''; atualiza(); });
        g.append(b);
      }
    });
    const ctl = h('div', { class: 'er-gctl' }, seta('compasso', `${barra + 1} de ${Math.max(nBars, barra + 1)}`, () => { barra = Math.max(0, barra - 1); desenhaDir(); }, () => { barra = Math.min(nBars, barra + 1); desenhaDir(); }, { dis: [barra <= 0, barra >= nBars] }),
      cicla('passos', [[2, 'colcheias (8)'], [1, 'semicolcheias (16)']], s.res === 4 ? 2 : s.res, (r) => { s.res = r; salvar(); desenhaDir(); }),
      barra > 0 ? h('button', { type: 'button', class: 'er-tg', onclick: () => { const ant = s.evs.filter((e) => e.ini >= (barra - 1) * 16 && e.ini < barra * 16).map((e) => ({ ...e, ini: e.ini + 16 })); if (!ant.length) { toast('o compasso anterior está vazio', { id: 'er', ms: 1800 }); return; } let l = s.evs.filter((e) => !(e.ini >= base && e.ini < base + 16)); ant.forEach((e) => { l = R.poe(l, e).evs; }); muda(l); cursor = R.fim(s.evs); atualiza(); desenhaDir(); } }, 'copiar o compasso anterior pra este') : null);
    return h('div', { class: 'er-gwrap' }, ctl, g);
  };
  const instrumentoCordas = (faixa) => {
    const seg = inst === 'baixo' ? null : h('div', { class: 'er-visual dois', role: 'group', 'aria-label': 'Como mostrar o instrumento' }, ...[['acordes', 'Acordes'], ['notas', 'Notas']].map(([v, t]) => h('button', { type: 'button', 'aria-pressed': String(s.visual === v), onclick: () => { s.visual = v; salvar(); desenhaDir(); } }, t)));
    if (s.visual === 'acordes' && inst !== 'baixo') return [seg, ...painelAcordes()];
    const esc = [seta('destacar', T.nomeEscala(s.escala), () => { const i = T.ESCALAS.findIndex((e) => e[0] === s.escala); s.escala = T.ESCALAS[(i + T.ESCALAS.length - 1) % T.ESCALAS.length][0]; salvar(); desenhaDir(); }, () => { const i = T.ESCALAS.findIndex((e) => e[0] === s.escala); s.escala = T.ESCALAS[(i + 1) % T.ESCALAS.length][0]; salvar(); desenhaDir(); })];
    if (s.escala !== 'todas') esc.push(seta('tônica', T.RAIZES[s.tonica], () => { s.tonica = (s.tonica + 11) % 12; salvar(); desenhaDir(); }, () => { s.tonica = (s.tonica + 1) % 12; salvar(); desenhaDir(); }));
    return [seg, faixa, ...esc, braco()];
  };
  const instrumentoBat = () => {
    const op = [['kit', 'Kit'], ['grade', 'Grade'], ['pads', 'Pads']];
    return [h('div', { class: 'er-visual', role: 'group', 'aria-label': 'Como mostrar a bateria' }, ...op.map(([v, t]) => h('button', { type: 'button', 'aria-pressed': String(s.visual === v), onclick: () => { s.visual = v; salvar(); desenhaDir(); } }, t))), s.visual === 'kit' ? kitArt() : s.visual === 'grade' ? gradeBeat() : pads()];
  };
  const painelGravar = () => [seta('precisão', { 4: 'semínima', 2: 'colcheia', 1: 'semicolcheia' }[s.res], () => { s.res = s.res === 1 ? 1 : s.res === 2 ? 1 : 2; salvar(); desenhaDir(); }, () => { s.res = s.res === 4 ? 4 : s.res === 2 ? 4 : 2; salvar(); desenhaDir(); }, { dis: [s.res === 1 || !!grav, s.res === 4 || !!grav] }),
    h('button', { type: 'button', class: `pm2-go${grav ? ' on' : ''}`, onclick: gravaBat }, grav ? '■ parar de gravar' : '● gravar (conta 4)'),
    h('p', { class: 'ep-dica' }, 'bata na bateria, na mesa ou em um pad: o microfone separa pelo som (grave = bumbo, médio = caixa, agudo = chimbal). Tem que conferir e corrigir depois. Use fone na conta pra o clique não entrar.')];
  const aquecer = () => Som.aquece({ bat, modelo: s.modelo, kind: s.timbre, midis: bat ? [] : cordas().flatMap(([, base]) => Array.from({ length: 6 }, (_, k) => base + casa0 + k)) });

  function desenhaDir() {
    if (gone) return; const micOk = bat || inst !== 'baixo'; const opcoesCordas = bat ? null : Object.keys(R.INSTRUMENTOS[inst].opcoes).map(Number);
    modoEl.replaceChildren(micOk ? h('div', { class: 'ep-modo', role: 'group', 'aria-label': 'Como montar' }, h('button', { type: 'button', 'aria-pressed': String(modo === 'toque'), onclick: () => trocaModo('toque') }, 'tocar no desenho'), h('button', { type: 'button', 'aria-pressed': String(modo === 'mic'), onclick: () => trocaModo('mic') }, bat ? 'gravar com o microfone' : 'tocar de verdade (microfone)')) : '');
    const aj = [cicla('escrita', E.ESCRITAS[bat ? 'bateria' : 'cordas'], s.escrita, (e) => { s.escrita = e; sel = -1; salvar(); atualiza(); desenhaDir(); })];
    const ferr = [h('div', { class: 'er-tgs' }, tg('metrônomo junto', s.clique, () => { s.clique = !s.clique; salvar(); desenhaDir(); }), tg('repetir (loop)', s.repetir, () => { s.repetir = !s.repetir; salvar(); desenhaDir(); }))];
    if (!bat) ferr.push(seta('transpor', `${trans > 0 ? '+' : ''}${trans} semitons`, () => transpor(-1), () => transpor(1)), seta('transpor oitava', `${trans12 > 0 ? '+' : ''}${trans12} oitava${Math.abs(trans12) === 1 ? '' : 's'}`, () => transpor(-12), () => transpor(12)));
    ferr.push(h('button', { type: 'button', class: 'er-tg perigo', onclick: async () => { if (!s.evs.length) return; if (await confirma('Limpar tudo?', 'Todas as notas somem desta partitura. Dá para desfazer logo depois.', 'Limpar')) { muda([]); cursor = 0; ultimo = null; sel = -1; msg = ''; atualiza(); desenhaDir(); } } }, 'limpar tudo'));
    if (!bat) {
      if (opcoesCordas.length > 1) aj.push(cicla('cordas', opcoesCordas.map((n) => [n, `${n} cordas`]), s.ncord, (n) => { const de = cordas(); s.ncord = n; const evs2 = R.remapeia(s.evs, de, cordas()); const perdeu = s.evs.length - evs2.length; muda(evs2); sel = -1; msg = perdeu ? `${perdeu} nota${perdeu > 1 ? 's' : ''} ficou fora das cordas novas e saiu` : ''; atualiza(); desenhaDir(); aquecer(); }));
      if (Som.TIMBRES[inst].length > 1) aj.push(cicla('som', Som.TIMBRES[inst], s.timbre, (t) => { s.timbre = t; salvar(); desenhaDir(); aquecer(); }));
    } else {
      aj.push(cicla('kit', R.KITS.map((k) => [k[0], k[1]]), s.kit, (k) => { s.kit = k; salvar(); atualiza(); desenhaDir(); }), cicla('som do kit', Som.MODELOS_BATERIA, s.modelo, (m) => { s.modelo = m; salvar(); atualiza(); desenhaDir(); aquecer(); }));
      if (s.visual === 'kit') aj.push(tg(s.canhota ? 'canhota ✓' : 'canhota', s.canhota, () => { s.canhota = !s.canhota; salvar(); desenhaDir(); }));
    }
    aj.push(...ferr);
    aj.push(seta('andamento', `${s.bpm} bpm`, () => { s.bpm = Math.max(40, s.bpm - 5); salvar(); desenhaDir(); }, () => { s.bpm = Math.min(220, s.bpm + 5); salvar(); desenhaDir(); }, { dis: [!!grav, !!grav] }));
    const nomeEsc = (E.ESCRITAS[bat ? 'bateria' : 'cordas'].find((x) => x[0] === s.escrita) || [, ''])[1];
    const resumo = bat ? `${nomeEsc} · ${s.bpm} bpm` : `${nomeEsc} · ${s.ncord} cordas`;
    const abertos = ajEl.querySelector('details') ? ajEl.querySelector('details').open : false; const d = ajustes(resumo, ...aj); d.open = abertos; ajEl.replaceChildren(d);
    const faixa = bat ? cicla('mão', MAOS, s.mao, (m) => { s.mao = m; salvar(); desenhaDir(); }) : seta('casas', `${casa0 === 0 ? 'solta' : casa0} a ${casa0 + 5}`, () => { casa0 = Math.max(0, casa0 - 6); desenhaDir(); aquecer(); }, () => { casa0 = Math.min(18, casa0 + 6); desenhaDir(); aquecer(); }, { dis: [casa0 <= 0, casa0 >= 18] });
    if (modo === 'mic' && micOk) instEl.replaceChildren(...(bat ? painelGravar() : [h('p', { class: 'ep-dica' }, mic ? 'ouvindo o microfone… toque uma nota por vez e ela aparece na tablatura.' : 'abrindo o microfone…')]));
    else if (bat) instEl.replaceChildren(faixa, ...instrumentoBat());
    else instEl.replaceChildren(...instrumentoCordas(faixa));
  }

  let trans = 0; let trans12 = 0;
  const transpor = (d) => {
    if (!s.evs.length) { toast('escreva alguma coisa antes', { id: 'er', ms: 1800 }); return; }
    const r = T.transpoeCordas(s.evs, cordas(), d); muda(r.evs); sel = -1; if (Math.abs(d) === 12) trans12 += d / 12; else trans += d; msg = r.perdeu ? `${r.perdeu} nota${r.perdeu > 1 ? 's' : ''} não coube no braço e saiu` : `transposto ${d > 0 ? '+' : ''}${d} semitom${Math.abs(d) === 1 ? '' : 's'}`; atualiza(); desenhaDir();
  };
  /* ---------- redesenhos pequenos ---------- */
  let nomeInput = null;
  function desenhaTopo() {
    if (gone) return;
    if (!nomeInput) { nomeInput = h('input', { class: 'ep-nm', type: 'text', maxlength: 40, value: s.titulo, placeholder: `nome da partitura (${NOMES[inst]})`, 'aria-label': 'Nome da partitura', enterkeyhint: 'done', autocomplete: 'off' }); nomeInput.addEventListener('input', () => { s.titulo = nomeInput.value; }); nomeInput.addEventListener('change', salvar); }
    else if (document.activeElement !== nomeInput) nomeInput.value = s.titulo;
    topo.replaceChildren(iconeBtn(IC.volta, 'Voltar', () => { parar(); location.hash = VOLTA; }), nomeInput,
      iconeBtn(IC.undo, 'Desfazer', () => { if (!hist.length) return; s.evs = JSON.parse(hist.pop()); cursor = R.fim(s.evs); ultimo = null; sel = -1; salvar(); atualiza(); }, { dis: !hist.length }),
      run ? iconeBtn(IC.stop, 'Parar', () => { parar(); desenhaTopo(); }, { on: true }) : iconeBtn(IC.play, 'Ouvir a partitura', ouvir, { dis: !s.evs.length }));
    acoes.replaceChildren(acaoBtn(IC.pdf, 'Baixar PDF', pdf, { dis: !s.evs.length }), acaoBtn(IC.img, 'Salvar imagem', imagem, { dis: !s.evs.length }), acaoBtn(IC.save, s.nuvemId ? 'Guardar de novo' : 'Guardar online', guardaOnline, { dis: !s.evs.length, rotulo: s.nuvemId ? 'Guardar de novo na pasta online' : 'Guardar na pasta online' }), acaoBtn(IC.copia, 'Duplicar', duplicar, { dis: !s.evs.length }), ...(opts.publicar ? [acaoBtn(IC.banco, 'Publicar no banco', publicarBanco, { dis: !s.evs.length || !(s.titulo || '').trim() })] : []));
  }
  function desenhaFolha() {
    const larg = Math.max(300, Math.min(760, (folha.clientWidth || host.clientWidth || 380) - 22)); const r = rend(larg, s.cor, sel);
    folha.innerHTML = s.evs.length ? r.svg : `<p class="ep-vazio">a partitura aparece aqui, nota por nota, enquanto você ${modo === 'mic' ? 'toca no seu instrumento' : bat ? 'toca nos pads aí embaixo' : 'toca no braço aí embaixo'}.</p>`;
  }
  function atualiza() {
    if (gone) return; desenhaFolha(); desenhaTopo();
    const c = correcao(); // com a correção aberta a barra de durações some (ela é pra próxima nota, não pra esta)
    barraEl.replaceChildren(...(c ? [] : [palette(), extras()]));
    meio.replaceChildren(...(c ? [c] : []), s.evs.length && !c ? h('p', { class: 'ep-dica' }, 'toque numa nota da folha para corrigir.') : null, msg ? h('p', { class: 'ep-dica', role: 'status' }, msg) : null);
  }

  const raiz = h('div', { class: 'ep bmr er' }, topo, acoes, h('div', { class: 'ep-corpo' }, h('div', { class: 'ep-esq' }, h('div', { class: 'ep-fixo' }, folha, barraEl), meio), dir)); host.append(raiz);
  desenhaDir(); atualiza(); aquecer(); requestAnimationFrame(() => { desenhaFolha(); });
  const parou = aoMudarLargura(folha, () => { if (!gone) desenhaFolha(); });
  // 1º toque na tela destrava o áudio (iPhone/iPad/Safari só deixam dentro de um toque)
  const destrava = () => { Som.acorda(); raiz.removeEventListener('pointerdown', destrava, true); }; raiz.addEventListener('pointerdown', destrava, true);
  // veio do "Áudio → partitura": abre a sugestão como rascunho (ainda não guardada), pra professora corrigir
  try { const imp = sessionStorage.getItem('pm-importar'); if (imp) { sessionStorage.removeItem('pm-importar'); const row = JSON.parse(imp); if (row && row.instrumento === inst) { carrega({ ...row, id: null, pasta: '' }); msg = 'sugestão do áudio — confira e corrija as notas'; atualiza(); } } } catch { /* sem sessionStorage */ }
  try { const id = sessionStorage.getItem('pm-abrir'); if (id) { sessionStorage.removeItem('pm-abrir'); NUV.abrir(id).then(carrega).catch((e) => toast(NUV.textoErro(e), { id: 'er', ms: 3200 })); } } catch { /* sem sessionStorage */ }
  return () => { gone = true; parar(); desligaMic(); if (grav) { try { grav.stop(); } catch { /* ok */ } grav = null; } parou(); };
}
