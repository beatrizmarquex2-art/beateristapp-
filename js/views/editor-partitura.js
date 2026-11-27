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
import { seta, FIGS, nomeDur, oit, quando } from './partitura-palco.js';

const CHAVE = 'setting-partitura-teclas'; // a mesma do painel das Teclas: o que se monta num aparece no outro
const lerSalvo = () => { try { const r = store.get(CHAVE); return r && r.data ? r.data : {}; } catch { return {}; } };
const nomeAluno = () => { try { return (CONTAS.atual().nome || '').trim(); } catch { return ''; } };
const svg = (inner, vb = '0 0 24 26') => `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${inner}</svg>`;
const ICO = (inner) => svg(inner, '0 0 24 24');
const IC = {
  volta: ICO('<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  undo: ICO('<path d="M9 7 4 12l5 5M4 12h10a6 6 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  play: ICO('<path d="M7 4v16l13-8z" fill="currentColor"/>'), stop: ICO('<rect x="6" y="6" width="12" height="12" fill="currentColor"/>'),
  pdf: ICO('<path d="M7 3h7l4 4v14H7zM14 3v4h4M10 13h5M10 17h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  save: ICO('<path d="M5 4h12l2 2v14H5zM8 4v5h7V4M8 20v-6h8v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
};
const noteIcon = (d) => {
  let o = `<ellipse cx="9" cy="19" rx="5.2" ry="3.8" transform="rotate(-20 9 19)" ${d >= 8 ? 'fill="none" stroke="currentColor" stroke-width="2"' : 'fill="currentColor"'}/>`;
  if (d < 16) o += '<line x1="13.6" y1="18" x2="13.6" y2="4" stroke="currentColor" stroke-width="2"/>';
  if (d <= 2) o += '<path d="M13.6 4c2 3 6 3.5 5 9" stroke="currentColor" stroke-width="2" fill="none"/>';
  if (d === 1) o += '<path d="M13.6 9c2 3 6 3.5 5 9" stroke="currentColor" stroke-width="2" fill="none"/>';
  return svg(o);
};
const RESTIC = svg('<path d="M10 3l6 7-5 5 6 8c-5-3-8 0-4 4" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/>');
const DURS = [[16, 'semibreve'], [8, 'mínima'], [4, 'semínima'], [2, 'colcheia'], [1, 'semicolcheia']];

export function mount(host, opts = {}) {
  const VOLTA = opts.voltar || '#/ferramentas-prof';
  const novo = (() => { try { const v = sessionStorage.getItem('pm-novo'); sessionStorage.removeItem('pm-novo'); return !!v; } catch { return false; } })();
  const salvoLocal = novo ? {} : lerSalvo();
  const s = { evs: [], take: [], bpm: 100, grade: 2, clave: 'auto', cor: false, fig: 4, pont: false, titulo: '', nuvemId: null, ...salvoLocal };
  s.evs = P.normalizar(Array.isArray(s.evs) ? s.evs : []); s.take = Array.isArray(s.take) ? s.take : [];
  if (novo) { s.evs = []; s.take = []; s.titulo = ''; s.nuvemId = null; }
  let sel = -1; let hist = []; let cursor = P.fim(s.evs); let oct = s.oct || (innerWidth < 640 ? 4 : 3); const octaves = innerWidth < 640 ? 1 : 2;
  let modo = 'toque'; let mic = null; let tocando = false; let timers = []; let msg = ''; let gone = false;
  const live = new Map();
  const salvar = () => store.upsert('setting', CHAVE, { evs: s.evs, take: s.take.slice(0, 300), bpm: s.bpm, grade: s.grade, clave: s.clave, cor: s.cor, fig: s.fig, pont: s.pont, modo: 'clicar', titulo: s.titulo, nuvemId: s.nuvemId || null, oct }).catch(() => {});
  const muda = (novas, { guarda = true } = {}) => { if (guarda) { hist.push(JSON.stringify(s.evs)); if (hist.length > 40) hist.shift(); } s.evs = novas; cursor = P.fim(novas); salvar(); };
  const dur = () => s.fig * (s.pont && s.fig >= 2 ? 1.5 : 1);
  const parar = () => { timers.forEach(clearTimeout); timers = []; tocando = false; };

  /* ---------- a partitura ---------- */
  const folha = h('div', { class: 'ep-folha', role: 'group', 'aria-label': 'Partitura. Toque numa nota para corrigir.' });
  folha.addEventListener('click', (e) => { const n = e.target.closest && e.target.closest('.pm-n'); const i = n ? +n.dataset.ev : -1; if (i >= 0 && s.evs[i]) { sel = sel === i ? -1 : i; if (sel >= 0) toca(s.evs[sel].m, 0.4); } else sel = -1; desenha(); });
  const toca = (m, d = 0.35) => { const v = voice(m, 'piano'); setTimeout(() => v.off(false), d * 1000); };
  const nota = (m) => { if (gone) return; const ev = P.anexarEm(s.evs, m, cursor, dur()); muda(ev); sel = ev.findIndex((x) => x.m === m && x.ini + x.d === cursor); msg = ''; desenha(); };

  /* ---------- o teclado desenhado ---------- */
  const kbWrap = h('div', { class: 'ep-kb', role: 'group', 'aria-label': 'Teclado' });
  const desenhaKb = () => {
    const L = layout(oct, octaves); const w = 100 / L.whites.length;
    kbWrap.replaceChildren(
      ...L.whites.map((m) => h('button', { type: 'button', class: 'ep-w', 'data-m': m, 'aria-label': nameOf(m, 'pt') }, h('span', {}, m % 12 === 0 ? nameOf(m, 'pt') : nameOf(m, 'pt').replace(/\d+$/, '')))),
      ...L.blacks.map((b) => { const el = h('button', { type: 'button', class: 'ep-b', 'data-m': b.midi, 'aria-label': nameOf(b.midi, 'pt') }); el.style.left = `${b.at * w - w * 0.3}%`; el.style.width = `${w * 0.6}%`; return el; }));
    for (const el of kbWrap.querySelectorAll('[data-m]')) {
      const m = +el.dataset.m;
      el.addEventListener('pointerdown', (e) => { e.preventDefault(); const v = voice(m, 'piano'); live.set(e.pointerId, v); el.classList.add('on'); nota(m); });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(ev, (e) => { const v = live.get(e.pointerId); if (v) { v.off(false); live.delete(e.pointerId); } el.classList.remove('on'); });
    }
  };

  /* ---------- microfone: escuta e escreve ---------- */
  const ligaMic = async () => {
    try { mic = await ouvirNotas((m) => { if (!gone && modo === 'mic') { nota(m); msg = `o microfone ouviu ${P.nomeCurto(m)} ${oit(m)}`; desenha(); } }, { instrumento: 'teclado' }); msg = 'ouvindo… toque uma nota no seu instrumento'; }
    catch { mic = null; modo = 'toque'; msg = ''; toast('não consegui abrir o microfone. veja se o navegador deixou usar.', { id: 'ep', ms: 3600 }); }
    desenha();
  };
  const desligaMic = () => { if (mic) { try { mic.stop(); } catch { /* já parou */ } mic = null; } };
  const trocaModo = (m) => { if (modo === m) return; modo = m; if (m === 'mic') ligaMic(); else { desligaMic(); msg = ''; } desenha(); };

  /* ---------- ouvir, PDF, pasta online ---------- */
  const ouvir = () => {
    parar(); if (!s.evs.length) return; tocando = true; const sx = P.semicolcheia(s.bpm) * 1000;
    s.evs.forEach((e) => timers.push(setTimeout(() => { const v = voice(e.m, 'piano'); setTimeout(() => v.off(false), Math.max(150, e.d * sx * 0.9)); }, e.ini * sx)));
    timers.push(setTimeout(() => { tocando = false; desenha(); }, P.fim(s.evs) * sx + 300)); desenha();
  };
  const pdf = async (b) => {
    b.disabled = true;
    try { const r = await baixarPdf({ evs: s.evs, clave: s.clave, cor: s.cor, titulo: (s.titulo || '').trim() || 'Minha partitura', aluno: nomeAluno(), bpm: s.bpm, data: new Date().toLocaleDateString('pt-BR'), rodape: opts.rodape, semPapel: !!opts.semPapel }); toast(r.shared ? 'pronto! escolha onde salvar' : `PDF salvo: ${r.name}`, { id: 'ep', ms: 2600 }); }
    catch { toast('não consegui gerar o PDF agora', { id: 'ep', ms: 2600 }); }
    b.disabled = false;
  };
  const carrega = (row) => {
    const d = row.dados || {}; s.evs = P.normalizar(Array.isArray(d.evs) ? d.evs : []); s.bpm = d.bpm || 100; s.grade = d.grade || 2; s.clave = d.clave || 'auto'; s.cor = !!d.cor; s.take = [];
    s.titulo = row.nome; s.nuvemId = row.id; hist = []; cursor = P.fim(s.evs); sel = -1; msg = `aberta da pasta online: ${row.nome}`; salvar(); desenha();
  };
  const guardaOnline = async (b) => {
    const t = (s.titulo || '').trim(); if (!t) { toast('dê um nome para a partitura (no alto da tela) antes de guardar', { id: 'ep', ms: 2600 }); return; }
    b.disabled = true;
    try { const r = await NUV.salvar({ id: s.nuvemId, nome: t, instrumento: 'teclas', dados: { versao: 1, evs: s.evs, bpm: s.bpm, grade: s.grade, clave: s.clave, cor: s.cor, titulo: s.titulo } }); s.nuvemId = r.id; salvar(); msg = `guardada na pasta online: ${r.nome} (${quando(r.atualizado_em)})`; }
    catch (e) { toast(NUV.textoErro(e), { id: 'ep', ms: 3200 }); }
    b.disabled = false; desenha();
  };

  /* ---------- as peças da tela ---------- */
  const barra = h('div', { class: 'ep-bar' });
  const esq = h('div', { class: 'ep-esq' }); const dir = h('div', { class: 'ep-dir' });
  const ib = (ico, lab, fn, { on = false, dis = false } = {}) => { const b = h('button', { type: 'button', class: `ep-ib${on ? ' on' : ''}`, 'aria-label': lab, disabled: dis }); b.innerHTML = ico; b.addEventListener('click', (e) => fn(e.currentTarget)); return b; };
  const passo = () => Math.max(1, s.grade);
  const correcao = () => {
    const e = s.evs[sel]; if (!e) return null;
    const mexe = (d) => () => { const novo = P.mover(s.evs, sel, d * passo()); if (novo === s.evs) { toast('já tem uma nota ali', { id: 'ep', ms: 1500 }); return; } muda(novo); sel = novo.findIndex((x) => x.m === e.m && x.ini === Math.max(0, e.ini + d * passo())); desenha(); };
    const dura = (d) => () => { const novo = P.alongar(s.evs, sel, d * passo()); muda(novo); sel = novo.findIndex((x) => x.m === e.m && x.ini === e.ini); desenha(); };
    const tom = (d) => () => { const novo = P.subir(s.evs, sel, d); muda(novo); toca(novo[sel].m, 0.3); desenha(); };
    return h('div', { class: 'ep-corrige', role: 'group', 'aria-label': 'Corrigir a nota escolhida' },
      h('b', {}, `nota escolhida: ${P.nomeCurto(e.m)} ${oit(e.m)}`),
      seta('posição', `compasso ${Math.floor(e.ini / 16) + 1} · tempo ${Math.floor((e.ini % 16) / 4) + 1}`, mexe(-1), mexe(1), { dis: [e.ini === 0, false] }),
      seta('duração', nomeDur(e.d), dura(-1), dura(1), { dis: [e.d <= 1, false] }),
      seta('altura', `${P.nomeCurto(e.m)} ${oit(e.m)}`, tom(-1), tom(1)),
      h('button', { type: 'button', class: 'btn small ghost', onclick: () => { muda(P.remover(s.evs, sel)); sel = -1; desenha(); } }, 'apagar essa nota'));
  };
  const palette = () => {
    const bt = (ico, lab, on, fn, dis = false) => { const b = h('button', { type: 'button', class: 'ep-pb', 'aria-pressed': String(!!on), 'aria-label': lab, disabled: dis }); b.innerHTML = ico; b.addEventListener('click', fn); return b; };
    return h('div', { class: 'ep-pal', role: 'group', 'aria-label': 'Duração da nota' },
      ...DURS.map(([d, n]) => bt(noteIcon(d), n, s.fig === d && !s.pont || s.fig === d && s.pont, () => { s.fig = d; if (d === 1) s.pont = false; salvar(); desenha(); })),
      bt('<span class="ep-t">•</span>', 'pontuada', s.pont, () => { s.pont = !s.pont; salvar(); desenha(); }, s.fig === 1),
      h('span', { class: 'ep-sep' }),
      bt(RESTIC, 'pausa', false, () => { const ev = P.anexarEm(s.evs, 60, cursor, dur()); /* a pausa só adianta o cursor */ cursor += dur(); msg = `pausa de ${nomeDur(dur())}. a próxima nota vem depois dela.`; desenha(); void ev; }),
      bt(`<span class="ep-t" style="color:${s.cor ? '#fff' : '#e0262f'}">●</span>`, 'notas coloridas', s.cor, () => { s.cor = !s.cor; salvar(); desenha(); }));
  };

  function desenha() {
    if (gone) return;
    const r = P.pauta(s.evs, { clave: s.clave, largura: Math.max(300, Math.min(760, (host.clientWidth || 380) - 56)), cor: s.cor, sel });
    folha.innerHTML = s.evs.length ? r.svg : `<p class="ep-vazio">a partitura aparece aqui, nota por nota, enquanto você ${modo === 'mic' ? 'toca no seu instrumento' : 'toca no teclado aí embaixo'}.</p>`;
    const nome = h('input', { class: 'ep-nm', type: 'text', maxlength: 40, value: s.titulo, placeholder: 'nome da partitura', 'aria-label': 'Nome da partitura' });
    nome.addEventListener('input', () => { s.titulo = nome.value; }); nome.addEventListener('change', salvar);
    barra.replaceChildren(
      ib(IC.volta, 'Voltar para as ferramentas', () => { location.hash = VOLTA; }), nome,
      ib(IC.undo, 'Desfazer', () => { if (!hist.length) return; s.evs = JSON.parse(hist.pop()); cursor = P.fim(s.evs); sel = -1; salvar(); desenha(); }, { dis: !hist.length }),
      tocando ? ib(IC.stop, 'Parar', () => { parar(); desenha(); }, { on: true }) : ib(IC.play, 'Ouvir', ouvir, { dis: !s.evs.length }),
      ib(IC.pdf, 'Baixar PDF no papel timbrado', pdf, { dis: !s.evs.length }),
      ib(IC.save, s.nuvemId ? 'Guardar de novo na pasta online' : 'Guardar na pasta online', guardaOnline, { dis: !s.evs.length }));
    esq.replaceChildren(folha, palette(), correcao() || h('p', { class: 'ep-dica' }, s.evs.length ? 'toque numa nota da folha para corrigir.' : ''), msg ? h('p', { class: 'ep-dica', role: 'status' }, msg) : null);
    const mic$ = h('div', { class: 'ep-mic' }, h('p', { class: 'ep-dica' }, mic ? 'ouvindo o microfone… toque a nota no instrumento de verdade e ela aparece na partitura.' : 'abrindo o microfone…'));
    dir.replaceChildren(
      h('div', { class: 'ep-modo', role: 'group', 'aria-label': 'Como montar' },
        h('button', { type: 'button', 'aria-pressed': String(modo === 'toque'), onclick: () => trocaModo('toque') }, 'tocar no desenho'),
        h('button', { type: 'button', 'aria-pressed': String(modo === 'mic'), onclick: () => trocaModo('mic') }, 'tocar de verdade (microfone)')),
      seta('clave', { auto: 'automática', sol: 'clave de sol', fa: 'clave de fá' }[s.clave], () => { const o = ['auto', 'sol', 'fa']; s.clave = o[(o.indexOf(s.clave) + 2) % 3]; salvar(); desenha(); }, () => { const o = ['auto', 'sol', 'fa']; s.clave = o[(o.indexOf(s.clave) + 1) % 3]; salvar(); desenha(); }),
      modo === 'mic' ? mic$ : h('div', {}, seta('oitava', `${nameOf((oct + 1) * 12, 'pt')} em diante`, () => { oct = Math.max(1, oct - 1); desenhaKb(); salvar(); desenha(); }, () => { oct = Math.min(7 - octaves, oct + 1); desenhaKb(); salvar(); desenha(); }, { dis: [oct <= 1, oct >= 7 - octaves] }), kbWrap));
  }

  const raiz = h('div', { class: 'ep bmr' }, barra, h('div', { class: 'ep-corpo' }, esq, dir));
  host.append(raiz); desenhaKb(); desenha(); requestAnimationFrame(desenha);
  const aoRedimensionar = () => desenha(); window.addEventListener('resize', aoRedimensionar);
  // veio da aba Professores (ou da pasta online): abre a partitura que a pessoa escolheu
  try { const id = sessionStorage.getItem('pm-abrir'); if (id) { sessionStorage.removeItem('pm-abrir'); NUV.abrir(id).then(carrega).catch((e) => toast(NUV.textoErro(e), { id: 'ep', ms: 3200 })); } } catch { /* sem sessionStorage */ }
  return () => { gone = true; parar(); desligaMic(); for (const v of live.values()) { try { v.off(false); } catch { /* ok */ } } window.removeEventListener('resize', aoRedimensionar); };
}
