// Partitura no Palco: o aluno clica nas teclas (ou toca) e a partitura aparece na hora, com a clave certa, pronta pra imprimir no papel timbrado.
// Dois jeitos de montar: "clicar" (cada tecla entra com a figura escolhida) e "tocar" (conta 4, grava com o metrônomo e arruma na grade).
// Dá pra corrigir: tocar na nota na folha e mover, alongar, subir meio tom ou apagar; mudar o andamento ou a grade acerta o tempo de novo.
// Serve a qualquer instrumento de nota única: `inst` = { toca(midi, quando, duração), aoTocar(fn|null), aoSoltar(fn|null) } (as teclas ligam o delas).
import { h } from '../util.js';
import * as store from '../store.js';
import { audio, click } from '../audio.js';
import { toast } from '../ui.js';
import * as P from '../partitura-melodica.js';
import { baixarPdf } from '../partitura-pdf.js';
import * as CONTAS from '../contas.js';

const chave = (nome) => `setting-partitura-${nome}`;
const lerSalvo = (nome) => { try { const r = store.get(chave(nome)); return r && r.data ? r.data : {}; } catch { return {}; } };
const nomeAluno = () => { try { return (CONTAS.atual().nome || '').trim(); } catch { return ''; } };
const hoje = () => new Date().toLocaleDateString('pt-BR');

/** Linha com setinhas ‹ valor ›: toca nas setas, arrasta o dedo (ou o mouse) pro lado, ou usa as setas do teclado. */
function seta(rotulo, texto, menos, mais, { dis = [false, false] } = {}) {
  const out = h('output', { class: 'pm-val', 'aria-live': 'polite', tabindex: '0', 'aria-label': `${rotulo}: ${texto}` }, texto);
  const box = h('div', { class: 'pm-seta', role: 'group', 'aria-label': rotulo },
    h('button', { type: 'button', class: 'pm-sb', 'aria-label': `${rotulo}: anterior`, disabled: dis[0], onclick: menos }, '‹'), out,
    h('button', { type: 'button', class: 'pm-sb', 'aria-label': `${rotulo}: próximo`, disabled: dis[1], onclick: mais }, '›'));
  let x0 = null;
  box.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) x0 = e.clientX; });
  box.addEventListener('pointerup', (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (dx > 28 && !dis[0]) menos(); else if (dx < -28 && !dis[1]) mais(); });
  box.addEventListener('pointercancel', () => { x0 = null; });
  out.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft' && !dis[0]) { e.preventDefault(); menos(); } else if (e.key === 'ArrowRight' && !dis[1]) { e.preventDefault(); mais(); } });
  return h('div', { class: 'row tk-line pm-linha' }, h('span', { class: 'tp-lab' }, rotulo), box);
}
/** Escolha entre poucas opções: as setinhas dão a volta (a última volta pra primeira). */
const cicla = (rotulo, ops, atual, set) => { const i = Math.max(0, ops.findIndex((o) => o[0] === atual)); const vai = (d) => () => set(ops[(i + d + ops.length) % ops.length][0]); return seta(rotulo, ops[i][1], vai(-1), vai(1)); };
const FIGS = [[16, false, 'semibreve'], [8, true, 'mínima pontuada'], [8, false, 'mínima'], [4, true, 'semínima pontuada'], [4, false, 'semínima'], [2, true, 'colcheia pontuada'], [2, false, 'colcheia'], [1, false, 'semicolcheia']];
const nomeDur = (d) => { const f = FIGS.find((x) => (x[1] ? x[0] * 1.5 : x[0]) === d); return f ? f[2] : `${d}/16`; };
const oit = (m) => Math.floor(m / 12) - 1;

export function painelPartitura(inst, { nome = 'teclas', fechar } = {}) {
  const s = { evs: [], take: [], bpm: 100, grade: 2, clave: 'auto', cor: false, fig: 4, pont: false, modo: 'clicar', titulo: '', ...lerSalvo(nome) };
  s.evs = P.normalizar(Array.isArray(s.evs) ? s.evs : []); s.take = Array.isArray(s.take) ? s.take : [];
  let cursor = P.fim(s.evs); let sel = -1; let hist = []; let editado = s.evs.length > 0 && !s.take.length; let timers = []; let rec = null; let tocando = false; let gone = false; let msg = '';
  const el = h('section', { class: 'card pad tk-panel bmr pm-painel', 'aria-label': 'Partitura' });
  const salvar = () => { store.upsert('setting', chave(nome), { evs: s.evs, take: s.take.slice(0, 300), bpm: s.bpm, grade: s.grade, clave: s.clave, cor: s.cor, fig: s.fig, pont: s.pont, modo: s.modo, titulo: s.titulo }).catch(() => {}); };
  const mudou = (novo, { guarda = true } = {}) => { if (guarda) { hist.push(JSON.stringify(s.evs)); if (hist.length > 40) hist.shift(); } s.evs = novo; salvar(); };
  const chip = (txt, on, fn, extra = {}) => h('button', { type: 'button', class: `kd-chip${on ? ' on' : ''}`, 'aria-pressed': String(!!on), ...(extra.dis ? { disabled: true } : {}), ...(extra.lab ? { 'aria-label': extra.lab } : {}), onclick: fn }, txt);
  const linha = (rotulo, ...kids) => h('div', { class: 'row tk-line pm-linha' }, h('span', { class: 'tp-lab' }, rotulo), h('div', { class: 'pn-chips' }, ...kids));
  const parar = () => { timers.forEach(clearTimeout); timers = []; tocando = false; };

  const dur = () => s.fig * (s.pont && s.fig >= 2 ? 1.5 : 1);
  const nota = (midi) => {
    if (gone) return;
    if (rec && rec.fase === 'grava') { const at = (performance.now() - rec.t0) / 1000; if (at < -0.2 || rec.take.length >= 300) return; const n = { midi, at: Math.max(0, at), len: 0.2 }; rec.take.push(n); rec.abertas.set(midi, n); return; }
    if (s.modo !== 'clicar' || rec) return;
    const ev = P.anexarEm(s.evs, midi, cursor, dur()); mudou(ev); cursor = P.fim(ev); editado = true; sel = ev.findIndex((x) => x.m === midi && x.ini + x.d === cursor); msg = ''; desenha();
  };
  const solta = (midi) => { if (rec && rec.abertas.has(midi)) { const n = rec.abertas.get(midi); n.len = Math.max(0.08, (performance.now() - rec.t0) / 1000 - n.at); rec.abertas.delete(midi); } };
  inst.aoTocar(nota); if (inst.aoSoltar) inst.aoSoltar(solta);

  /* ---- gravar: conta 4 e grava com o metrônomo ---- */
  const gravar = () => {
    parar(); const beat = 60 / s.bpm; const t0 = performance.now() + 150; rec = { fase: 'conta', t0: t0 + 4 * beat * 1000, take: [], abertas: new Map() }; let n = 0;
    const tick = () => { if (!rec || gone) return; const t = t0 + n * beat * 1000; click(audio().currentTime + Math.max(0, (t - performance.now()) / 1000), n % 4 === 0 ? 2 : 1); if (n === 4 && rec.fase === 'conta') { rec.fase = 'grava'; msg = 'gravando… toque a melodia'; desenha(); } n++; if (n < 4 + 16 * 4) timers.push(setTimeout(tick, Math.max(0, t0 + n * beat * 1000 - performance.now() - 20))); else parou(); };
    msg = 'contando… 1 2 3 4'; desenha(); tick();
  };
  const parou = () => {
    if (!rec) return; const r = rec; rec = null; parar();
    if (!r.take.length) { msg = 'não ouvi nenhuma nota. toque de novo.'; desenha(); return; }
    s.take = r.take; mudou(P.quantizar(s.take, { bpm: s.bpm, grade: s.grade })); editado = false; cursor = P.fim(s.evs); sel = -1; msg = `${s.evs.length} nota${s.evs.length === 1 ? '' : 's'} na partitura. se o tempo ficou torto, mude a grade ou o andamento.`; desenha();
  };
  const requantizar = () => { if (!s.take.length) return; mudou(P.quantizar(s.take, { bpm: s.bpm, grade: s.grade })); editado = false; cursor = P.fim(s.evs); sel = -1; desenha(); };
  const andamento = (d) => { s.bpm = Math.max(50, Math.min(180, s.bpm + d)); salvar(); if (s.take.length && !editado) requantizar(); else desenha(); };
  const grade = (g) => { s.grade = g; salvar(); if (s.take.length && !editado) requantizar(); else desenha(); };

  /* ---- ouvir ---- */
  const ouvir = () => {
    parar(); if (!s.evs.length) return; const sx = P.semicolcheia(s.bpm) * 1000; tocando = true; const c = audio();
    s.evs.forEach((e) => timers.push(setTimeout(() => inst.toca(e.m, c.currentTime + 0.02, Math.max(0.12, e.d * sx / 1000 * 0.92)), e.ini * sx)));
    timers.push(setTimeout(() => { tocando = false; desenha(); }, P.fim(s.evs) * sx + 300)); desenha();
  };
  const tocaUma = (e) => { inst.toca(e.m, audio().currentTime + 0.02, Math.max(0.2, e.d * P.semicolcheia(s.bpm) * 0.9)); };

  /* ---- correção da nota escolhida ---- */
  const passo = () => Math.max(1, s.grade);
  const barra = () => {
    const e = s.evs[sel]; if (!e) return null;
    const reacha = (novo, m, ini) => { sel = novo.findIndex((x) => x.m === m && x.ini === ini); mudou(novo); editado = true; };
    const mexe = (d) => () => { const novo = P.mover(s.evs, sel, d * passo()); if (novo === s.evs) { toast('já tem uma nota ali', { id: 'pm', ms: 1500 }); return; } hist.push(JSON.stringify(s.evs)); s.evs = novo; sel = novo.findIndex((x) => x.m === e.m && x.ini === Math.max(0, e.ini + d * passo())); salvar(); editado = true; desenha(); };
    const dura = (d) => () => { const novo = P.alongar(s.evs, sel, d * passo()); mudou(novo); editado = true; sel = novo.findIndex((x) => x.m === e.m && x.ini === e.ini); desenha(); };
    const tom = (d) => () => { const novo = P.subir(s.evs, sel, d); mudou(novo); editado = true; tocaUma(novo[sel]); desenha(); };
    return h('div', { class: 'pm-corrige', role: 'group', 'aria-label': 'Corrigir a nota escolhida' },
      seta('posição', `compasso ${Math.floor(e.ini / 16) + 1} · tempo ${Math.floor((e.ini % 16) / 4) + 1}`, mexe(-1), mexe(1), { dis: [e.ini === 0, false] }),
      seta('duração', nomeDur(e.d), dura(-1), dura(1), { dis: [e.d <= 1, false] }),
      seta('altura', `${P.nomeCurto(e.m)} ${oit(e.m)}`, tom(-1), tom(1)),
      h('div', { class: 'row tk-line' }, h('button', { type: 'button', class: 'btn small ghost', onclick: () => { mudou(P.remover(s.evs, sel)); editado = true; sel = -1; cursor = P.fim(s.evs); desenha(); } }, 'apagar essa nota')));
  };

  const pdf = async (b) => {
    if (!s.evs.length) { toast('monte alguma nota primeiro', { id: 'pm', ms: 1800 }); return; }
    b.disabled = true; const t = b.textContent; b.textContent = 'gerando…';
    try { const r = await baixarPdf({ evs: s.evs, clave: s.clave, cor: s.cor, titulo: s.titulo.trim() || 'Minha partitura', aluno: nomeAluno(), bpm: s.bpm, data: hoje() }); toast(r.shared ? 'pronto! escolha onde salvar' : `PDF salvo: ${r.name}`, { id: 'pm', ms: 2600 }); }
    catch { toast('não consegui gerar o PDF agora', { id: 'pm', ms: 2600 }); }
    b.disabled = false; b.textContent = t;
  };

  const folha = h('div', { class: 'pm-folha', role: 'group', 'aria-label': 'Partitura. Toque numa nota para corrigir.' });
  folha.addEventListener('click', (e) => { const n = e.target.closest && e.target.closest('.pm-n'); const i = n ? +n.dataset.ev : -1; if (i >= 0 && s.evs[i]) { sel = sel === i ? -1 : i; if (sel >= 0) tocaUma(s.evs[sel]); } else sel = -1; desenha(); });

  function desenha() {
    if (gone) return;
    const r = P.pauta(s.evs, { clave: s.clave, largura: Math.max(280, Math.min(720, (el.clientWidth || 360) - 32)), cor: s.cor, sel });
    folha.innerHTML = s.evs.length ? r.svg : '<p class="pm-vazio">a partitura aparece aqui. ' + (s.modo === 'clicar' ? 'toque numa tecla do piano: cada tecla vira uma nota.' : 'toque em gravar e toque a melodia.') + '</p>';
    const gravando = !!rec;
    const modo = cicla('montar', [['clicar', 'clicar nas teclas'], ['tocar', 'tocar e gravar']], s.modo, (v) => { rec = null; parar(); s.modo = v; salvar(); desenha(); });
    const figAtual = FIGS.find((x) => x[0] === s.fig && x[1] === !!s.pont) || FIGS.find((x) => x[0] === s.fig) || FIGS[4];
    const figuras = s.modo === 'clicar'
      ? [seta('figura', figAtual[2], () => { const i = FIGS.indexOf(figAtual); const n = FIGS[(i - 1 + FIGS.length) % FIGS.length]; s.fig = n[0]; s.pont = n[1]; salvar(); desenha(); }, () => { const i = FIGS.indexOf(figAtual); const n = FIGS[(i + 1) % FIGS.length]; s.fig = n[0]; s.pont = n[1]; salvar(); desenha(); }),
        h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, 'pausa'), h('button', { type: 'button', class: 'btn small', onclick: () => { cursor += dur(); msg = `pausa de ${figAtual[2]}. a próxima nota vem depois dela.`; desenha(); } }, '+ pausa'),
          h('button', { type: 'button', class: 'btn small ghost', disabled: !hist.length, onclick: () => { if (!hist.length) return; s.evs = JSON.parse(hist.pop()); cursor = P.fim(s.evs); sel = -1; salvar(); desenha(); } }, '↶ desfazer'))]
      : [seta('andamento', `${s.bpm} bpm`, () => andamento(-5), () => andamento(5), { dis: [s.bpm <= 50, s.bpm >= 180] }),
        cicla('grade', [[4, 'semínima'], [2, 'colcheia'], [1, 'semicolcheia']], s.grade, (v) => grade(v)),
        h('div', { class: 'row tk-line' }, h('span', { class: 'tp-lab' }, 'gravar'),
          gravando ? h('button', { type: 'button', class: 'btn primary', onclick: parou }, '■ parar') : h('button', { type: 'button', class: 'btn', onclick: gravar }, '● gravar (conta 4)'),
          h('button', { type: 'button', class: 'btn small ghost', disabled: !s.take.length || gravando, title: 'Refaz a partitura a partir da gravação (as correções manuais se perdem)', onclick: requantizar }, 'alinhar de novo'))];
    const ver = [cicla('clave', [['auto', 'automática'], ['sol', 'clave de sol'], ['fa', 'clave de fá']], s.clave, (v) => { s.clave = v; salvar(); desenha(); }),
      cicla('notas', [[false, 'pretas'], [true, 'coloridas']], !!s.cor, (v) => { s.cor = v; salvar(); desenha(); })];
    const titulo = h('input', { class: 'field pm-titulo', type: 'text', maxlength: 40, value: s.titulo, placeholder: 'nome da partitura (para o PDF)', 'aria-label': 'Nome da partitura' }); titulo.addEventListener('input', () => { s.titulo = titulo.value; }); titulo.addEventListener('change', salvar);
    el.replaceChildren(
      h('div', { class: 'au-topo' }, h('b', {}, 'partitura'), fechar ? h('button', { type: 'button', class: 'btn small ghost', onclick: () => fechar() }, 'fechar') : null),
      modo, ...figuras, folha, barra() || h('p', { class: 'muted pm-dica' }, s.evs.length ? 'toque numa nota da folha para corrigir.' : ''),
      msg ? h('p', { class: 'muted pm-msg', role: 'status' }, msg) : null,
      h('div', { class: 'row tk-line pm-acoes' },
        tocando ? h('button', { type: 'button', class: 'btn primary', onclick: () => { parar(); desenha(); } }, '■ parar') : h('button', { type: 'button', class: 'btn', disabled: !s.evs.length || gravando, onclick: ouvir }, '▶ ouvir'),
        h('button', { type: 'button', class: 'btn ghost', disabled: !s.evs.length || gravando, onclick: () => { hist.push(JSON.stringify(s.evs)); mudou([], { guarda: false }); s.take = []; cursor = 0; sel = -1; editado = false; msg = 'folha limpa. dá pra desfazer.'; salvar(); desenha(); } }, 'limpar')),
      ...ver, titulo,
      h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn primary', disabled: !s.evs.length || gravando, onclick: (e) => pdf(e.currentTarget) }, 'baixar PDF no papel timbrado')),
      h('p', { class: 'muted pm-nota' }, 'o PDF sai no papel timbrado, com Beaterista Play e o endereço do site. a partitura fica guardada só neste aparelho.'));
  }
  const aoRedimensionar = () => desenha(); window.addEventListener('resize', aoRedimensionar);
  desenha(); requestAnimationFrame(desenha); // 2º desenho: já com a largura real depois de entrar na tela
  return { el, destroy() { gone = true; rec = null; parar(); window.removeEventListener('resize', aoRedimensionar); inst.aoTocar(null); if (inst.aoSoltar) inst.aoSoltar(null); } };
}
