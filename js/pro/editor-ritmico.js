// Editor de violão, guitarra, baixo (tablatura) e bateria (pauta). Mesma tela do editor de teclado: barra, folha, durações, correção da nota escolhida e o instrumento desenhado embaixo.
//   cordas:  braço desenhado (cordas × casas) · escolhe 6/7/8 cordas (guitarra) ou 4/5/6 (baixo) · acorde = "juntar" · microfone escreve a nota que você toca
//   bateria: pads do kit (simples, médio, completo) · mão D/E · acento > · fantasma ( ) · "juntar" = ao mesmo tempo (ex.: chimbal + bumbo)
import { h } from '../util.js';
import * as store from '../store.js';
import { audio, snare, kick, hihat, cymbal, tom, later, silence } from '../audio.js';
import { guitar, bass } from '../synth.js';
import { toast } from '../ui.js';
import * as NUV from '../partitura-nuvem.js';
import { baixarPdf } from '../partitura-pdf.js';
import { ouvirNotas } from '../jogos/vivo-ui.js';
import * as CONTAS from '../contas.js';
import * as R from './ritmo.js';
import { seta, cicla, nomeDur, quando } from '../views/partitura-palco.js';
import { IC, noteIcon, RESTIC, DURS } from '../views/editor-partitura.js';

const NOMES = { violao: 'violão', guitarra: 'guitarra', baixo: 'baixo', bateria: 'bateria' };
/** Rota do editor de cada instrumento (teclas é o editor de teclado). */
export const rotaDe = (inst) => (!inst || inst === 'teclas' ? '#/editor' : `#/editor/${inst}`);
const nomeAluno = () => { try { return (CONTAS.atual().nome || '').trim(); } catch { return ''; } };
const MAOS = [['', 'sem indicação'], ['D', 'mão direita (D)'], ['E', 'mão esquerda (E)']];

/** O som de cada peça da bateria (vel 0–1). */
export function somBateria(p, t, vel = 0.75) {
  if (p === 'sn') snare(t, vel); else if (p === 'bd') kick(t, vel); else if (p === 'hh') hihat(t, vel, false); else if (p === 'hf') hihat(t, vel * 0.6, false);
  else if (p === 'tt') tom(t, 200, vel); else if (p === 'mt') tom(t, 150, vel); else if (p === 'ft') tom(t, 105, vel);
  else if (p === 'cr') cymbal(t, false, vel); else if (p === 'rd') cymbal(t, true, vel * 0.6);
}
const velDe = (e) => (e.fan ? 0.35 : e.acc ? 1 : 0.75);

export function mount(host, opts = {}) {
  const inst = NOMES[opts.inst] ? opts.inst : 'violao'; const bat = inst === 'bateria'; const VOLTA = opts.voltar || '#/estudio';
  const CHAVE = `setting-pro-${bat ? 'bateria' : 'cordas'}`; const padrao = inst === 'baixo' ? 4 : 6;
  const lerSalvo = () => { try { const r = store.get(CHAVE); return r && r.data && r.data.inst === inst ? r.data : {}; } catch { return {}; } };
  let novo = false; let nc = 0; try { novo = !!sessionStorage.getItem('pm-novo'); sessionStorage.removeItem('pm-novo'); nc = +sessionStorage.getItem('pm-cordas') || 0; sessionStorage.removeItem('pm-cordas'); } catch { /* sem sessionStorage */ }
  const s = { evs: [], bpm: 100, cor: false, fig: 2, pont: false, titulo: '', nuvemId: null, ncord: padrao, kit: 'medio', mao: '', acc: false, fan: false, juntar: false, ...(novo ? {} : lerSalvo()) };
  s.evs = R.normaliza(s.evs); if (novo) { s.evs = []; s.titulo = ''; s.nuvemId = null; }
  if (!bat && nc && R.INSTRUMENTOS[inst].opcoes[nc]) s.ncord = nc; if (!R.INSTRUMENTOS[inst] && !bat) s.ncord = padrao;
  if (!bat && !R.INSTRUMENTOS[inst].opcoes[s.ncord]) s.ncord = padrao;
  let sel = -1; let hist = []; let cursor = R.fim(s.evs); let ultimo = null; let casa0 = 0; let modo = 'toque'; let mic = null; let tocando = false; let msg = ''; let gone = false;
  const cordas = () => R.cordasDe(inst, s.ncord);
  const salvar = () => store.upsert('setting', CHAVE, { inst, evs: s.evs, bpm: s.bpm, cor: s.cor, fig: s.fig, pont: s.pont, titulo: s.titulo, nuvemId: s.nuvemId || null, ncord: s.ncord, kit: s.kit, mao: s.mao }).catch(() => {});
  const muda = (novas, { guarda = true } = {}) => { if (guarda) { hist.push(JSON.stringify(s.evs)); if (hist.length > 40) hist.shift(); } s.evs = novas; salvar(); };
  const dur = () => s.fig * (s.pont && s.fig >= 2 ? 1.5 : 1);
  const passo = () => 2;
  const rend = (largura, cor = s.cor, selecao = -1) => (bat ? R.bateria(s.evs, { largura, cor, sel: selecao }) : R.tablatura(s.evs, { cordas: cordas(), largura, cor, sel: selecao }));

  /* ---------- som ---------- */
  const tocaAgora = (e) => { const t = audio().currentTime + 0.01; if (bat) somBateria(e.p, t, velDe(e)); else if (inst === 'baixo') bass(t, R.midiDe(cordas(), e.c, e.f), 0.4); else guitar(t, [R.midiDe(cordas(), e.c, e.f)], 0.5); };
  const ouvir = () => {
    silence(); if (!s.evs.length) return; tocando = true; const sx = (60 / s.bpm / 4) * 1000;
    R.grupos(s.evs).forEach((g) => later(() => { const t = audio().currentTime + 0.01; const l = g.idx.map((i) => s.evs[i]);
      if (bat) l.forEach((e) => somBateria(e.p, t, velDe(e))); else if (inst === 'baixo') l.forEach((e) => bass(t, R.midiDe(cordas(), e.c, e.f), 0.4)); else guitar(t, l.map((e) => R.midiDe(cordas(), e.c, e.f)), 0.6); }, g.ini * sx));
    later(() => { tocando = false; desenha(); }, R.fim(s.evs) * sx + 300); desenha();
  };
  const parar = () => { silence(); tocando = false; };

  /* ---------- entrada ---------- */
  const adiciona = (novoEv) => {
    const unir = s.juntar && (ultimo || s.evs.length); if (s.juntar && !ultimo && s.evs.length) { const u = s.evs[s.evs.length - 1]; ultimo = { ini: u.ini, d: u.d }; }
    const ini = unir ? ultimo.ini : cursor; const d = unir ? ultimo.d : dur();
    const r = R.poe(s.evs, { ...novoEv, ini, d }); muda(r.evs); sel = r.i; ultimo = { ini, d }; if (!unir) cursor = ini + d; msg = ''; tocaAgora(r.evs[r.i]); desenha();
  };
  const casaTap = (c, f) => adiciona({ c, f });
  const padTap = (p) => adiciona({ p, mao: (R.PECAS[p].pe ? '' : s.mao), acc: s.acc, fan: s.fan });
  const ligaMic = async () => {
    try { mic = await ouvirNotas((m) => { if (gone || modo !== 'mic') return; const pos = R.posicaoDe(cordas(), m); if (!pos) { msg = 'ouvi uma nota que não cabe no braço'; desenha(); return; } adiciona(pos); msg = `o microfone ouviu: corda ${cordas()[pos.c][0]}, casa ${pos.f}`; desenha(); }, { instrumento: 'violao' }); msg = 'ouvindo… toque uma nota por vez no seu instrumento'; }
    catch { mic = null; modo = 'toque'; msg = ''; toast('não consegui abrir o microfone. veja se o navegador deixou usar.', { id: 'er', ms: 3600 }); }
    desenha();
  };
  const desligaMic = () => { if (mic) { try { mic.stop(); } catch { /* já parou */ } mic = null; } };
  const trocaModo = (m) => { if (modo === m) return; modo = m; if (m === 'mic') ligaMic(); else { desligaMic(); msg = ''; } desenha(); };

  /* ---------- pasta online, PDF ---------- */
  const pdf = async (b) => {
    b.disabled = true;
    try { const r = await baixarPdf({ render: (larg) => rend(larg, s.cor, -1), titulo: (s.titulo || '').trim() || `Minha partitura de ${NOMES[inst]}`, aluno: nomeAluno(), bpm: s.bpm, data: new Date().toLocaleDateString('pt-BR'), rodape: opts.rodape, semPapel: !!opts.semPapel }); toast(r.shared ? 'pronto! escolha onde salvar' : `PDF salvo: ${r.name}`, { id: 'er', ms: 2600 }); }
    catch { toast('não consegui gerar o PDF agora', { id: 'er', ms: 2600 }); }
    b.disabled = false;
  };
  const dadosNuvem = () => ({ versao: 2, tipo: bat ? 'bateria' : 'tab', inst, ncord: s.ncord, kit: s.kit, evs: s.evs, bpm: s.bpm, cor: s.cor, titulo: s.titulo });
  const carrega = (row) => {
    const d = row.dados || {}; if (row.instrumento !== inst) { try { sessionStorage.setItem('pm-abrir', row.id); } catch { /* ok */ } location.hash = rotaDe(row.instrumento); return; }
    s.evs = R.normaliza(d.evs); s.bpm = d.bpm || 100; s.cor = !!d.cor; if (!bat && R.INSTRUMENTOS[inst].opcoes[d.ncord]) s.ncord = d.ncord; if (bat && d.kit) s.kit = d.kit;
    s.titulo = row.nome; s.nuvemId = row.id; hist = []; cursor = R.fim(s.evs); ultimo = null; sel = -1; msg = `aberta da pasta online: ${row.nome}`; salvar(); desenha();
  };
  const guardaOnline = async (b) => {
    const t = (s.titulo || '').trim(); if (!t) { toast('dê um nome para a partitura (no alto da tela) antes de guardar', { id: 'er', ms: 2600 }); return; }
    b.disabled = true;
    try { const r = await NUV.salvar({ id: s.nuvemId, nome: t, instrumento: inst, dados: dadosNuvem() }); s.nuvemId = r.id; salvar(); msg = `guardada na pasta online: ${r.nome} (${quando(r.atualizado_em)})`; }
    catch (e) { toast(NUV.textoErro(e), { id: 'er', ms: 3200 }); }
    b.disabled = false; desenha();
  };

  /* ---------- peças da tela ---------- */
  const folha = h('div', { class: 'ep-folha er-folha', role: 'group', 'aria-label': 'Partitura. Toque numa nota para corrigir.' });
  folha.addEventListener('click', (e) => { const n = e.target.closest && e.target.closest('.pm-n'); const i = n ? +n.dataset.ev : -1; if (i >= 0 && s.evs[i]) { sel = sel === i ? -1 : i; if (sel >= 0) tocaAgora(s.evs[sel]); } else sel = -1; desenha(); });
  const barra = h('div', { class: 'ep-bar' }); const esq = h('div', { class: 'ep-esq' }); const dir = h('div', { class: 'ep-dir' });
  const ib = (ico, lab, fn, { on = false, dis = false } = {}) => { const b = h('button', { type: 'button', class: `ep-ib${on ? ' on' : ''}`, 'aria-label': lab, disabled: dis }); b.innerHTML = ico; b.addEventListener('click', (e) => fn(e.currentTarget)); return b; };
  const tg = (rot, on, fn, dis = false) => h('button', { type: 'button', class: 'er-tg', 'aria-pressed': String(!!on), disabled: dis, onclick: fn }, rot);

  const correcao = () => {
    const e = s.evs[sel]; if (!e) return null; const nomeSel = bat ? R.nomePeca(e.p) : `corda ${cordas()[e.c][0]} · casa ${e.f}`;
    const aplica = (parte, tocar = false) => { const novo = R.muda(s.evs, sel, parte); if (novo === s.evs) { toast('já tem uma nota ali', { id: 'er', ms: 1500 }); return; } muda(novo); if (tocar) tocaAgora(novo[sel]); desenha(); };
    const lista = [
      seta('posição', `compasso ${Math.floor(e.ini / 16) + 1} · tempo ${Math.floor((e.ini % 16) / 4) + 1}`, () => aplica({ ini: e.ini - passo() }), () => aplica({ ini: e.ini + passo() }), { dis: [e.ini === 0, false] }),
      seta('duração', nomeDur(e.d), () => aplica({ d: e.d - passo() }), () => aplica({ d: e.d + passo() }), { dis: [e.d <= 1, e.d >= 16] }),
    ];
    if (bat) {
      const ids = Object.keys(R.PECAS); lista.push(cicla('peça', ids.map((p) => [p, R.nomePeca(p)]), e.p, (p) => aplica({ p, mao: R.PECAS[p].pe ? '' : e.mao }, true)));
      if (!R.PECAS[e.p].pe) lista.push(cicla('mão', MAOS, e.mao || '', (mao) => aplica({ mao })));
      lista.push(h('div', { class: 'er-tgs' }, tg('acento >', e.acc, () => aplica({ acc: !e.acc })), tg('fantasma ( )', e.fan, () => aplica({ fan: !e.fan }))));
    } else {
      lista.push(seta('casa', `casa ${e.f}`, () => aplica({ f: e.f - 1 }, true), () => aplica({ f: e.f + 1 }, true), { dis: [e.f <= 0, e.f >= R.MAX_CASA] }), seta('corda', cordas()[e.c][0], () => aplica({ c: e.c - 1 }, true), () => aplica({ c: e.c + 1 }, true), { dis: [e.c <= 0, e.c >= cordas().length - 1] }));
    }
    return h('div', { class: 'ep-corrige', role: 'group', 'aria-label': 'Corrigir a nota escolhida' }, h('b', {}, `nota escolhida: ${nomeSel}`), ...lista, h('button', { type: 'button', class: 'btn small ghost', onclick: () => { muda(R.remover(s.evs, sel)); sel = -1; desenha(); } }, 'apagar essa nota'));
  };
  const palette = () => {
    const bt = (ico, lab, on, fn, dis = false) => { const b = h('button', { type: 'button', class: 'ep-pb', 'aria-pressed': String(!!on), 'aria-label': lab, disabled: dis }); b.innerHTML = ico; b.addEventListener('click', fn); return b; };
    const DUR = DURS.filter((x) => x[0] !== 16 || true);
    return h('div', { class: 'ep-pal', role: 'group', 'aria-label': 'Duração da nota' },
      ...DUR.map(([d, n]) => bt(noteIcon(d), n, s.fig === d, () => { s.fig = d; if (d === 1) s.pont = false; salvar(); desenha(); })),
      bt('<span class="ep-t">•</span>', 'pontuada', s.pont, () => { s.pont = !s.pont; salvar(); desenha(); }, s.fig === 1), h('span', { class: 'ep-sep' }),
      bt(RESTIC, 'pausa', false, () => { cursor += dur(); ultimo = null; msg = `pausa de ${nomeDur(dur())}. a próxima nota vem depois dela.`; desenha(); }),
      bt(`<span class="ep-t" style="color:${s.cor ? '#fff' : '#e0262f'}">●</span>`, 'colorido', s.cor, () => { s.cor = !s.cor; salvar(); desenha(); }));
  };

  const braco = () => {
    const cs = cordas(); const n = 6; const cab = ['', ...Array.from({ length: n }, (_, k) => (casa0 + k === 0 ? 'solta' : `${casa0 + k}ª`))];
    const g = h('div', { class: 'er-braco', role: 'group', 'aria-label': 'Braço do instrumento', style: { '--n': n } }, ...cab.map((t) => h('span', { class: 'er-fr' }, t)));
    cs.forEach(([nome], c) => { g.append(h('span', { class: 'er-cd' }, nome)); for (let k = 0; k < n; k++) { const f = casa0 + k; g.append(h('button', { type: 'button', class: `er-casa${f === 0 ? ' solta' : ''}`, 'aria-label': `corda ${nome}, casa ${f}`, onclick: () => casaTap(c, f) }, f)); } });
    return g;
  };
  const pads = () => h('div', { class: 'er-pads', role: 'group', 'aria-label': 'Peças da bateria' }, ...R.pecasDoKit(s.kit).map((p) => { const b = h('button', { type: 'button', class: `er-pad${R.PECAS[p].pe ? ' pe' : ''}`, 'data-p': p, onclick: () => padTap(p) }, h('b', {}, R.nomePeca(p)), h('small', {}, R.PECAS[p].pe ? 'pé' : R.PECAS[p].x ? 'cabeça X' : 'cabeça normal')); return b; }));

  function desenha() {
    if (gone) return;
    const larg = Math.max(300, Math.min(760, (host.clientWidth || 380) - 56)); const r = rend(larg, s.cor, sel);
    folha.innerHTML = s.evs.length ? r.svg : `<p class="ep-vazio">a partitura aparece aqui, nota por nota, enquanto você ${modo === 'mic' ? 'toca no seu instrumento' : bat ? 'toca nos pads aí embaixo' : 'toca no braço aí embaixo'}.</p>`;
    const nome = h('input', { class: 'ep-nm', type: 'text', maxlength: 40, value: s.titulo, placeholder: `nome da partitura (${NOMES[inst]})`, 'aria-label': 'Nome da partitura' });
    nome.addEventListener('input', () => { s.titulo = nome.value; }); nome.addEventListener('change', salvar);
    barra.replaceChildren(
      ib(IC.volta, 'Voltar', () => { location.hash = VOLTA; }), nome,
      ib(IC.undo, 'Desfazer', () => { if (!hist.length) return; s.evs = JSON.parse(hist.pop()); cursor = R.fim(s.evs); ultimo = null; sel = -1; salvar(); desenha(); }, { dis: !hist.length }),
      tocando ? ib(IC.stop, 'Parar', () => { parar(); desenha(); }, { on: true }) : ib(IC.play, 'Ouvir', ouvir, { dis: !s.evs.length }),
      ib(IC.pdf, 'Baixar PDF', pdf, { dis: !s.evs.length }), ib(IC.save, s.nuvemId ? 'Guardar de novo na pasta online' : 'Guardar na pasta online', guardaOnline, { dis: !s.evs.length }));
    const extras = bat ? h('div', { class: 'er-tgs' }, tg('acento >', s.acc, () => { s.acc = !s.acc; if (s.acc) s.fan = false; desenha(); }), tg('fantasma ( )', s.fan, () => { s.fan = !s.fan; if (s.fan) s.acc = false; desenha(); }), tg('juntar (ao mesmo tempo)', s.juntar, () => { s.juntar = !s.juntar; desenha(); }))
      : h('div', { class: 'er-tgs' }, tg('acorde: juntar com a nota anterior', s.juntar, () => { s.juntar = !s.juntar; desenha(); }));
    esq.replaceChildren(folha, palette(), extras, correcao() || h('p', { class: 'ep-dica' }, s.evs.length ? 'toque numa nota da folha para corrigir.' : ''), msg ? h('p', { class: 'ep-dica', role: 'status' }, msg) : null);
    const opcoesCordas = bat ? null : Object.keys(R.INSTRUMENTOS[inst].opcoes).map(Number);
    const ctl = [];
    if (!bat) {
      if (opcoesCordas.length > 1) ctl.push(cicla('cordas', opcoesCordas.map((n) => [n, `${n} cordas`]), s.ncord, (n) => { const de = cordas(); s.ncord = n; const evs2 = R.remapeia(s.evs, de, cordas()); const perdeu = s.evs.length - evs2.length; muda(evs2); sel = -1; msg = perdeu ? `${perdeu} nota${perdeu > 1 ? 's' : ''} ficou fora das cordas novas e saiu` : ''; desenha(); }));
      ctl.push(seta('casas', `${casa0 === 0 ? 'solta' : casa0}–${casa0 + 5}`, () => { casa0 = Math.max(0, casa0 - 6); desenha(); }, () => { casa0 = Math.min(18, casa0 + 6); desenha(); }, { dis: [casa0 <= 0, casa0 >= 18] }));
    } else {
      ctl.push(cicla('kit', R.KITS.map((k) => [k[0], k[1]]), s.kit, (k) => { s.kit = k; salvar(); desenha(); }), cicla('mão', MAOS, s.mao, (m) => { s.mao = m; salvar(); desenha(); }));
    }
    const micOk = !bat && inst !== 'baixo';
    dir.replaceChildren(
      micOk ? h('div', { class: 'ep-modo', role: 'group', 'aria-label': 'Como montar' }, h('button', { type: 'button', 'aria-pressed': String(modo === 'toque'), onclick: () => trocaModo('toque') }, 'tocar no desenho'), h('button', { type: 'button', 'aria-pressed': String(modo === 'mic'), onclick: () => trocaModo('mic') }, 'tocar de verdade (microfone)')) : null,
      ...ctl, seta('andamento', `${s.bpm} bpm`, () => { s.bpm = Math.max(40, s.bpm - 5); salvar(); desenha(); }, () => { s.bpm = Math.min(220, s.bpm + 5); salvar(); desenha(); }),
      modo === 'mic' && micOk ? h('p', { class: 'ep-dica' }, mic ? 'ouvindo o microfone… toque uma nota por vez e ela aparece na tablatura.' : 'abrindo o microfone…') : bat ? pads() : braco());
  }

  const raiz = h('div', { class: 'ep bmr er' }, barra, h('div', { class: 'ep-corpo' }, esq, dir)); host.append(raiz); desenha(); requestAnimationFrame(desenha);
  const aoRedim = () => desenha(); window.addEventListener('resize', aoRedim);
  try { const id = sessionStorage.getItem('pm-abrir'); if (id) { sessionStorage.removeItem('pm-abrir'); NUV.abrir(id).then(carrega).catch((e) => toast(NUV.textoErro(e), { id: 'er', ms: 3200 })); } } catch { /* sem sessionStorage */ }
  return () => { gone = true; parar(); desligaMic(); window.removeEventListener('resize', aoRedim); };
}
