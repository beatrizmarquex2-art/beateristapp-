// Editor de partitura: uma tela própria só pra montar (como nos apps de partitura). De cima pra baixo: voltar · nome · desfazer · ouvir · PDF · guardar na pasta,
// a partitura, a barra de durações (e pausa), a correção da nota escolhida, e o instrumento desenhado embaixo (teclado) onde a pessoa toca.
// "tocar de verdade" liga o microfone: ele escuta a nota e escreve. Tudo guardado neste aparelho e, se quiser, na pasta online (supabase/022_partituras.sql).
// Hoje: teclado. (Violão/tablatura e bateria entram nas próximas etapas.)
import { h } from '../util.js';
import * as store from '../store.js';
import { audio } from '../audio.js';
import { toast } from '../ui.js';
import * as P from '../partitura-melodica.js';
import * as NUV from '../partitura-nuvem.js';
import { baixarPdf } from '../partitura-pdf.js';
import * as CONTAS from '../contas.js';
import { layout, nameOf } from '../piano-logic.js';
import { voice } from './piano.js';
import { ouvirNotas } from '../jogos/vivo-ui.js';
import { seta, cicla, FIGS, nomeDur, oit, quando } from './partitura-palco.js';
import { aoMudarLargura, iconeBtn, acaoBtn, ajustes, painelCorrige, toque } from '../pro/editor-ui.js';
import { scheduler, silence } from '../audio.js';
import { mallet, MALLETS } from '../instruments.js';
import { tocaEventos } from '../pro/som.js';
import * as T from '../pro/teoria.js';
import { corNota, notaClara } from '../cores-notas.js';
import { confirma } from '../pro/ui.js';

const TIMBRES = [['piano', 'piano'], ['epiano', 'elétrico'], ['organ', 'órgão'], ['pad', 'cordas']]; // os mesmos sons da aba Teclas do jogo

const CHAVE = 'setting-partitura-teclas'; // a mesma do painel das Teclas: o que se monta num aparece no outro
const lerSalvo = () => { try { const r = store.get(CHAVE); return r && r.data ? r.data : {}; } catch { return {}; } };
const nomeAluno = () => { try { return (CONTAS.atual().nome || '').trim(); } catch { return ''; } };
const svg = (inner, vb = '0 0 24 26') => `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${inner}</svg>`;
const ICO = (inner) => svg(inner, '0 0 24 24');
export const IC = {
  volta: ICO('<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  undo: ICO('<path d="M9 7 4 12l5 5M4 12h10a6 6 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  play: ICO('<path d="M7 4v16l13-8z" fill="currentColor"/>'), stop: ICO('<rect x="6" y="6" width="12" height="12" fill="currentColor"/>'),
  pdf: ICO('<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 13h5M10 17h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  save: ICO('<path d="M5 4h12l2 2v14H5zM8 4v5h7V4M8 20v-6h8v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
};
export const noteIcon = (d) => {
  let o = `<ellipse cx="9" cy="19" rx="5.2" ry="3.8" transform="rotate(-20 9 19)" ${d >= 8 ? 'fill="none" stroke="currentColor" stroke-width="2"' : 'fill="currentColor"'}/>`;
  if (d < 16) o += '<line x1="13.6" y1="18" x2="13.6" y2="4" stroke="currentColor" stroke-width="2"/>';
  if (d <= 2) o += '<path d="M13.6 4c2 3 6 3.5 5 9" stroke="currentColor" stroke-width="2" fill="none"/>';
  if (d === 1) o += '<path d="M13.6 9c2 3 6 3.5 5 9" stroke="currentColor" stroke-width="2" fill="none"/>';
  return svg(o);
};
export const RESTIC = svg('<path d="M10 3l6 7-5 5 6 8c-5-3-8 0-4 4" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/>');
export const DURS = [[16, 'semibreve'], [8, 'mínima'], [4, 'semínima'], [2, 'colcheia'], [1, 'semicolcheia']];

export function mount(host, opts = {}) {
  const VOLTA = opts.voltar || '#/ferramentas-prof';
  const novo = (() => { try { const v = sessionStorage.getItem('pm-novo'); sessionStorage.removeItem('pm-novo'); return !!v; } catch { return false; } })();
  const salvoLocal = novo ? {} : lerSalvo();
  const s = { evs: [], take: [], bpm: 100, grade: 2, clave: 'auto', cor: false, fig: 4, pont: false, titulo: '', nuvemId: null, visual: 'teclado', timbre: 'piano', mallet: 'xilofone', barras: 'maior', escala: 'todas', tonica: 0, clique: false, repetir: false, ...salvoLocal };
  if (!['teclado', 'barras'].includes(s.visual)) s.visual = 'teclado'; if (!TIMBRES.some((t) => t[0] === s.timbre)) s.timbre = 'piano'; if (!MALLETS.some((m) => m[0] === s.mallet)) s.mallet = 'xilofone'; if (!T.BARRAS.some((b) => b[0] === s.barras)) s.barras = 'maior'; if (!T.ESCALAS.some((e) => e[0] === s.escala)) s.escala = 'todas'; if (!(s.tonica >= 0 && s.tonica < 12)) s.tonica = 0;
  s.evs = P.normalizar(Array.isArray(s.evs) ? s.evs : []); s.take = Array.isArray(s.take) ? s.take : [];
  if (novo) { s.evs = []; s.take = []; s.titulo = ''; s.nuvemId = null; }
  let sel = -1; let hist = []; let cursor = P.fim(s.evs); let oct = s.oct || (innerWidth < 640 ? 4 : 3); const octaves = innerWidth < 640 ? 1 : 2;
  let modo = 'toque'; let mic = null; let run = null; let msg = ''; let gone = false;
  const live = new Map();
  const salvar = () => store.upsert('setting', CHAVE, { evs: s.evs, take: s.take.slice(0, 300), bpm: s.bpm, grade: s.grade, clave: s.clave, cor: s.cor, fig: s.fig, pont: s.pont, modo: 'clicar', titulo: s.titulo, nuvemId: s.nuvemId || null, oct, visual: s.visual, timbre: s.timbre, mallet: s.mallet, barras: s.barras, escala: s.escala, tonica: s.tonica, clique: s.clique, repetir: s.repetir }).catch(() => {});
  const muda = (novas, { guarda = true } = {}) => { if (guarda) { hist.push(JSON.stringify(s.evs)); if (hist.length > 40) hist.shift(); } s.evs = novas; cursor = P.fim(novas); salvar(); };
  const dur = () => s.fig * (s.pont && s.fig >= 2 ? 1.5 : 1);
  const parar = () => { if (run) { run.stop(); run = null; } silence(); if (mic) mic.surdo(false); };

  /* ---------- a partitura ---------- */
  const folha = h('div', { class: 'ep-folha', role: 'group', 'aria-label': 'Partitura. Toque numa nota para corrigir.' });
  folha.addEventListener('click', (e) => { const n = e.target.closest && e.target.closest('.pm-n'); const i = n ? +n.dataset.ev : -1; if (i >= 0 && s.evs[i]) { sel = sel === i ? -1 : i; if (sel >= 0) toca(s.evs[sel].m, 0.4); } else sel = -1; atualiza(); });
  /** Uma nota no som escolhido (teclado: piano/elétrico/órgão/cordas; barras: xilofone etc.). Devolve { off } pra segurar enquanto o dedo está na tecla. */
  const soa = (m, t) => { if (s.visual === 'barras') { mallet(m, 0.9, s.mallet, t); return { off() {} }; } return voice(m, s.timbre, t); };
  const toca = (m, d = 0.35) => { const v = soa(m); setTimeout(() => v.off(false), d * 1000); };
  const nota = (m) => { if (gone) return; if (run) parar(); const ev = P.anexarEm(s.evs, m, cursor, dur()); muda(ev); sel = -1; msg = ''; atualiza(); };

  /* ---------- o teclado desenhado (montado uma vez; um toque não refaz ele) ---------- */
  const kbWrap = h('div', { class: 'ep-kb', role: 'group', 'aria-label': 'Teclado' });
  const desenhaKb = () => {
    for (const v of live.values()) { try { v.off(false); } catch { /* ok */ } } live.clear();
    const L = layout(oct, octaves); const w = 100 / L.whites.length;
    kbWrap.replaceChildren(
      ...L.whites.map((m) => h('button', { type: 'button', class: 'ep-w', 'data-m': m, 'aria-label': nameOf(m, 'pt') }, h('span', {}, m % 12 === 0 ? nameOf(m, 'pt') : nameOf(m, 'pt').replace(/\d+$/, '')))),
      ...L.blacks.map((b) => { const el = h('button', { type: 'button', class: 'ep-b', 'data-m': b.midi, 'aria-label': nameOf(b.midi, 'pt') }); el.style.left = `${b.at * w - w * 0.3}%`; el.style.width = `${w * 0.6}%`; return el; }));
    for (const el of kbWrap.querySelectorAll('[data-m]')) {
      const m = +el.dataset.m; let tocouEm = 0;
      if (s.escala !== 'todas') { if (!T.naEscala(m, s.tonica, s.escala)) el.classList.add('fora'); else if (T.ehTonica(m, s.tonica)) el.classList.add('raiz'); }
      el.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); tocouEm = performance.now(); try { el.setPointerCapture(e.pointerId); } catch { /* ok */ } const v = soa(m); live.set(e.pointerId, v); el.classList.add('on'); nota(m); });
      for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(ev, (e) => { const v = live.get(e.pointerId); if (v) { v.off(false); live.delete(e.pointerId); } el.classList.remove('on'); });
      el.addEventListener('contextmenu', (e) => e.preventDefault());
      el.addEventListener('click', (e) => { if (e.detail > 0 || performance.now() - tocouEm < 700) return; const v = soa(m); nota(m); setTimeout(() => v.off(false), 350); }); // teclado do computador / leitor de tela
    }
  };

  /* ---------- microfone: escuta e escreve ---------- */
  const ligaMic = async () => {
    try { mic = await ouvirNotas((m) => { if (!gone && modo === 'mic') { nota(m); msg = `o microfone ouviu ${P.nomeCurto(m)} ${oit(m)}`; atualiza(); } }, { instrumento: 'teclado' }); msg = 'ouvindo… toque uma nota no seu instrumento'; }
    catch { mic = null; modo = 'toque'; msg = ''; toast('não consegui abrir o microfone. veja se o navegador deixou usar.', { id: 'ep', ms: 3600 }); }
    atualiza(); desenhaDir();
  };
  const desligaMic = () => { if (mic) { try { mic.stop(); } catch { /* já parou */ } mic = null; } };
  const trocaModo = (m) => { if (modo === m) return; modo = m; if (m === 'mic') ligaMic(); else { desligaMic(); msg = ''; } atualiza(); desenhaDir(); };

  /* ---------- ouvir (relógio do áudio), PDF, pasta online ---------- */
  const ouvir = () => {
    if (run) { parar(); desenhaTopo(); return; } if (!s.evs.length) return; if (mic) mic.surdo(true); const sx = P.semicolcheia(s.bpm);
    const eventos = s.evs.map((e) => ({ at: e.ini * sx, play: (t) => { const v = soa(e.m, t); setTimeout(() => v.off(false), Math.max(120, (e.d * sx * 0.9 - (t - audio().currentTime)) * 1000)); } }));
    run = tocaEventos({ eventos, fim: P.fim(s.evs), bpm: s.bpm, clique: s.clique, repetir: s.repetir, onFim: () => { run = null; if (mic) mic.surdo(false); if (!gone) desenhaTopo(); } }); desenhaTopo();
  };
  const pdf = async (b) => {
    b.disabled = true;
    try { const r = await baixarPdf({ evs: s.evs, clave: s.clave, cor: s.cor, titulo: (s.titulo || '').trim() || 'Minha partitura', aluno: nomeAluno(), bpm: s.bpm, data: new Date().toLocaleDateString('pt-BR'), rodape: opts.rodape, semPapel: !!opts.semPapel, perfil: opts.perfil }); toast(r.shared ? 'pronto! escolha onde salvar' : `PDF salvo: ${r.name}`, { id: 'ep', ms: 2600 }); }
    catch { toast('não consegui gerar o PDF agora', { id: 'ep', ms: 2600 }); }
    b.disabled = false;
  };
  const carrega = (row) => {
    const d = row.dados || {}; s.evs = P.normalizar(Array.isArray(d.evs) ? d.evs : []); s.bpm = d.bpm || 100; s.grade = d.grade || 2; s.clave = d.clave || 'auto'; s.cor = !!d.cor; s.take = [];
    s.titulo = row.nome; s.nuvemId = row.id; hist = []; cursor = P.fim(s.evs); sel = -1; msg = `aberta da pasta online: ${row.nome}`; salvar(); atualiza(); desenhaDir();
  };
  const guardaOnline = async (b) => {
    const t = (s.titulo || '').trim(); if (!t) { toast('dê um nome para a partitura (no alto da tela) antes de guardar', { id: 'ep', ms: 2600 }); return; }
    b.disabled = true;
    try { const r = await NUV.salvar({ id: s.nuvemId, nome: t, instrumento: 'teclas', dados: { versao: 1, evs: s.evs, bpm: s.bpm, grade: s.grade, clave: s.clave, cor: s.cor, titulo: s.titulo } }); s.nuvemId = r.id; salvar(); msg = `guardada na pasta online: ${r.nome} (${quando(r.atualizado_em)})`; }
    catch (e) { toast(NUV.textoErro(e), { id: 'ep', ms: 3200 }); }
    b.disabled = false; atualiza();
  };

  /* ---------- as peças da tela ---------- */
  const topo = h('div', { class: 'ep-bar' }); const acoes = h('div', { class: 'ep-acoes' }); const barraEl = h('div', { class: 'ep-barra' }); const meio = h('div', { class: 'ep-meio' });
  const esq = h('div', { class: 'ep-esq' }); const dir = h('div', { class: 'ep-dir' }); const modoEl = h('div', {}); const ajEl = h('div', {}); const kbEl = h('div', {});
  dir.append(modoEl, ajEl, kbEl);
  const passo = () => Math.max(1, s.grade);
  const correcao = () => {
    const e = s.evs[sel]; if (!e) return null;
    const mexe = (d) => () => { const novo = P.mover(s.evs, sel, d * passo()); if (novo === s.evs) { toast('já tem uma nota ali', { id: 'ep', ms: 1500 }); return; } muda(novo); sel = novo.findIndex((x) => x.m === e.m && x.ini === Math.max(0, e.ini + d * passo())); atualiza(); };
    const dura = (d) => () => { const novo = P.alongar(s.evs, sel, d * passo()); muda(novo); sel = novo.findIndex((x) => x.m === e.m && x.ini === e.ini); atualiza(); };
    const tom = (d) => () => { const novo = P.subir(s.evs, sel, d); muda(novo); toca(novo[sel].m, 0.3); atualiza(); };
    return painelCorrige(`corrigir: ${P.nomeCurto(e.m)} ${oit(e.m)}`, () => { sel = -1; atualiza(); },
      [seta('posição', `compasso ${Math.floor(e.ini / 16) + 1} · tempo ${Math.floor((e.ini % 16) / 4) + 1}`, mexe(-1), mexe(1), { dis: [e.ini === 0, false] }), seta('duração', nomeDur(e.d), dura(-1), dura(1), { dis: [e.d <= 1, false] }), seta('altura', `${P.nomeCurto(e.m)} ${oit(e.m)}`, tom(-1), tom(1))],
      [h('button', { type: 'button', class: 'er-tg perigo', onclick: () => { muda(P.remover(s.evs, sel)); sel = -1; atualiza(); } }, 'apagar nota')]);
  };
  const palette = () => {
    const bt = (ico, lab, on, fn, dis = false) => { const b = h('button', { type: 'button', class: 'ep-pb', 'aria-pressed': String(!!on), 'aria-label': lab, title: lab, disabled: dis }); b.innerHTML = ico; b.addEventListener('click', fn); return b; };
    return h('div', { class: 'ep-pal', role: 'group', 'aria-label': 'Duração da próxima nota' },
      ...DURS.map(([d, n]) => bt(noteIcon(d), n, s.fig === d, () => { s.fig = d; if (d === 1) s.pont = false; salvar(); atualiza(); })),
      bt('<span class="ep-t">•</span>', 'pontuada', s.pont, () => { s.pont = !s.pont; salvar(); atualiza(); }, s.fig === 1),
      h('span', { class: 'ep-sep' }),
      bt(RESTIC, 'pausa (pula um tempo)', false, () => { cursor += dur(); msg = `pausa de ${nomeDur(dur())}. a próxima nota vem depois dela.`; atualiza(); }),
      bt(`<span class="ep-t" style="color:${s.cor ? '#fff' : '#e0262f'}">●</span>`, 'notas coloridas', s.cor, () => { s.cor = !s.cor; salvar(); atualiza(); }));
  };

  let nomeInput = null;
  function desenhaTopo() {
    if (gone) return;
    if (!nomeInput) { nomeInput = h('input', { class: 'ep-nm', type: 'text', maxlength: 40, value: s.titulo, placeholder: 'nome da partitura', 'aria-label': 'Nome da partitura', enterkeyhint: 'done', autocomplete: 'off' }); nomeInput.addEventListener('input', () => { s.titulo = nomeInput.value; }); nomeInput.addEventListener('change', salvar); }
    else if (document.activeElement !== nomeInput) nomeInput.value = s.titulo;
    topo.replaceChildren(iconeBtn(IC.volta, 'Voltar', () => { parar(); location.hash = VOLTA; }), nomeInput,
      iconeBtn(IC.undo, 'Desfazer', () => { if (!hist.length) return; s.evs = JSON.parse(hist.pop()); cursor = P.fim(s.evs); sel = -1; salvar(); atualiza(); }, { dis: !hist.length }),
      run ? iconeBtn(IC.stop, 'Parar', () => { parar(); desenhaTopo(); }, { on: true }) : iconeBtn(IC.play, 'Ouvir a partitura', ouvir, { dis: !s.evs.length }));
    acoes.replaceChildren(acaoBtn(IC.pdf, 'Baixar PDF', pdf, { dis: !s.evs.length }), acaoBtn(IC.save, s.nuvemId ? 'Guardar de novo' : 'Guardar online', guardaOnline, { dis: !s.evs.length, rotulo: s.nuvemId ? 'Guardar de novo na pasta online' : 'Guardar na pasta online' }));
  }
  function desenhaFolha() {
    const larg = Math.max(300, Math.min(760, (folha.clientWidth || host.clientWidth || 380) - 22)); const r = P.pauta(s.evs, { clave: s.clave, largura: larg, cor: s.cor, sel });
    folha.innerHTML = s.evs.length ? r.svg : `<p class="ep-vazio">a partitura aparece aqui, nota por nota, enquanto você ${modo === 'mic' ? 'toca no seu instrumento' : 'toca no teclado aí embaixo'}.</p>`;
  }
  function atualiza() {
    if (gone) return; desenhaFolha(); desenhaTopo(); const c = correcao();
    barraEl.replaceChildren(...(c ? [] : [palette()]));
    meio.replaceChildren(...(c ? [c] : []), s.evs.length && !c ? h('p', { class: 'ep-dica' }, 'toque numa nota da folha para corrigir.') : null, msg ? h('p', { class: 'ep-dica', role: 'status' }, msg) : null);
  }
  let trans = 0; let trans12 = 0;
  const transpor = (d) => {
    if (!s.evs.length) { toast('escreva alguma coisa antes', { id: 'ep', ms: 1800 }); return; }
    const r = T.transpoeTeclas(s.evs, d); muda(r.evs); sel = -1; if (Math.abs(d) === 12) trans12 += d / 12; else trans += d; msg = r.perdeu ? `${r.perdeu} nota${r.perdeu > 1 ? 's' : ''} passou do piano e saiu` : `transposto ${d > 0 ? '+' : ''}${d} semitom${Math.abs(d) === 1 ? '' : 's'}`; atualiza(); desenhaDir();
  };
  const tg = (rot, on, fn) => h('button', { type: 'button', class: 'er-tg', 'aria-pressed': String(!!on), onclick: fn }, rot);
  /** Barras coloridas como o xilofone do jogo: cada nota na sua cor, mais curtas pro agudo. */
  const barrasEl = () => {
    const ms = T.BARRAS.find((b) => b[0] === s.barras)[2]; const n = ms.length; const wrap = h('div', { class: 'er-barras', role: 'group', 'aria-label': 'Barras do xilofone' });
    ms.forEach((m, i) => wrap.append(toque(h('button', { type: 'button', class: `er-barra${notaClara(m) ? ' clara' : ''}`, 'aria-label': nameOf(m, 'pt'), style: `--bc:${corNota(m)};height:${(96 - (i / Math.max(1, n - 1)) * 46).toFixed(0)}%` }, h('span', {}, nameOf(m, 'pt').replace(/\d+$/, ''))), (e) => { const el = e.currentTarget; const v = soa(m); void v; nota(m); el.classList.add('hit'); setTimeout(() => el.classList.remove('hit'), 160); })));
    return wrap;
  };
  function desenhaDir() {
    if (gone) return;
    modoEl.replaceChildren(h('div', { class: 'ep-modo', role: 'group', 'aria-label': 'Como montar' },
      h('button', { type: 'button', 'aria-pressed': String(modo === 'toque'), onclick: () => trocaModo('toque') }, 'tocar no desenho'),
      h('button', { type: 'button', 'aria-pressed': String(modo === 'mic'), onclick: () => trocaModo('mic') }, 'tocar de verdade (microfone)')));
    const O = ['auto', 'sol', 'fa']; const nomeClave = { auto: 'automática', sol: 'clave de sol', fa: 'clave de fá' };
    const abertos = ajEl.querySelector('details') ? ajEl.querySelector('details').open : false;
    const aj = [seta('clave', nomeClave[s.clave], () => { s.clave = O[(O.indexOf(s.clave) + 2) % 3]; salvar(); atualiza(); desenhaDir(); }, () => { s.clave = O[(O.indexOf(s.clave) + 1) % 3]; salvar(); atualiza(); desenhaDir(); }),
      s.visual === 'barras' ? cicla('modelo', MALLETS.map((m) => [m[0], m[1]]), s.mallet, (m) => { s.mallet = m; salvar(); desenhaDir(); }) : cicla('som', TIMBRES, s.timbre, (t) => { s.timbre = t; salvar(); desenhaDir(); }),
      h('div', { class: 'er-tgs' }, tg('metrônomo junto', s.clique, () => { s.clique = !s.clique; salvar(); desenhaDir(); }), tg('repetir (loop)', s.repetir, () => { s.repetir = !s.repetir; salvar(); desenhaDir(); })),
      seta('transpor', `${trans > 0 ? '+' : ''}${trans} semitons`, () => transpor(-1), () => transpor(1)), seta('transpor oitava', `${trans12 > 0 ? '+' : ''}${trans12} oitava${Math.abs(trans12) === 1 ? '' : 's'}`, () => transpor(-12), () => transpor(12)),
      h('button', { type: 'button', class: 'er-tg perigo', onclick: async () => { if (!s.evs.length) return; if (await confirma('Limpar tudo?', 'Todas as notas somem desta partitura. Dá para desfazer logo depois.', 'Limpar')) { muda([]); sel = -1; msg = ''; atualiza(); desenhaDir(); } } }, 'limpar tudo'),
      seta('andamento', `${s.bpm} bpm`, () => { s.bpm = Math.max(40, s.bpm - 5); salvar(); desenhaDir(); }, () => { s.bpm = Math.min(220, s.bpm + 5); salvar(); desenhaDir(); })];
    const d = ajustes(`${nomeClave[s.clave]} · ${s.bpm} bpm`, ...aj); d.open = abertos; ajEl.replaceChildren(d);
    const seg = h('div', { class: 'er-visual dois', role: 'group', 'aria-label': 'Como mostrar o instrumento' }, ...[['teclado', 'Teclado'], ['barras', 'Barras']].map(([v, t]) => h('button', { type: 'button', 'aria-pressed': String(s.visual === v), onclick: () => { s.visual = v; salvar(); desenhaKb(); desenhaDir(); } }, t)));
    let corpo;
    if (modo === 'mic') corpo = [h('p', { class: 'ep-dica' }, mic ? 'ouvindo o microfone… toque a nota no instrumento de verdade e ela aparece na partitura.' : 'abrindo o microfone…')];
    else if (s.visual === 'barras') corpo = [seg, cicla('escala', T.BARRAS.map((b) => [b[0], b[1]]), s.barras, (b) => { s.barras = b; salvar(); desenhaDir(); }), barrasEl()];
    else {
      const esc = [seta('destacar', T.nomeEscala(s.escala), () => { const i = T.ESCALAS.findIndex((e) => e[0] === s.escala); s.escala = T.ESCALAS[(i + T.ESCALAS.length - 1) % T.ESCALAS.length][0]; salvar(); desenhaKb(); desenhaDir(); }, () => { const i = T.ESCALAS.findIndex((e) => e[0] === s.escala); s.escala = T.ESCALAS[(i + 1) % T.ESCALAS.length][0]; salvar(); desenhaKb(); desenhaDir(); })];
      if (s.escala !== 'todas') esc.push(seta('tônica', T.RAIZES[s.tonica], () => { s.tonica = (s.tonica + 11) % 12; salvar(); desenhaKb(); desenhaDir(); }, () => { s.tonica = (s.tonica + 1) % 12; salvar(); desenhaKb(); desenhaDir(); }));
      corpo = [seg, ...esc, seta('oitava', `${nameOf((oct + 1) * 12, 'pt')} em diante`, () => { oct = Math.max(1, oct - 1); desenhaKb(); salvar(); desenhaDir(); }, () => { oct = Math.min(7 - octaves, oct + 1); desenhaKb(); salvar(); desenhaDir(); }, { dis: [oct <= 1, oct >= 7 - octaves] }), kbWrap];
    }
    kbEl.replaceChildren(...corpo);
  }

  const raiz = h('div', { class: 'ep bmr' }, topo, acoes, h('div', { class: 'ep-corpo' }, h('div', { class: 'ep-esq' }, h('div', { class: 'ep-fixo' }, folha, barraEl), meio), dir)); void esq;
  host.append(raiz); desenhaKb(); desenhaDir(); atualiza(); requestAnimationFrame(desenhaFolha);
  const parou = aoMudarLargura(folha, () => { if (!gone) desenhaFolha(); });
  const destrava = () => { try { audio(); } catch { /* sem áudio */ } raiz.removeEventListener('pointerdown', destrava, true); }; raiz.addEventListener('pointerdown', destrava, true);
  // veio da aba Professores (ou da pasta online): abre a partitura que a pessoa escolheu
  try { const id = sessionStorage.getItem('pm-abrir'); if (id) { sessionStorage.removeItem('pm-abrir'); NUV.abrir(id).then((row) => { if (row.instrumento && row.instrumento !== 'teclas') { try { sessionStorage.setItem('pm-abrir', row.id); } catch { /* ok */ } location.hash = `#/editor/${row.instrumento}`; return; } carrega(row); }).catch((e) => toast(NUV.textoErro(e), { id: 'ep', ms: 3200 })); } } catch { /* sem sessionStorage */ }
  return () => { gone = true; parar(); desligaMic(); for (const v of live.values()) { try { v.off(false); } catch { /* ok */ } } parou(); };
}
