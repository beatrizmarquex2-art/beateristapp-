// Figurix: jogos novos (a Bea escolheu no mockup `prototipos/figurix-novos-opcoes.html`): 1) atenção/memória em 3 formatos (toque nos pares, olhe e vire, quem sumiu),
// 2) Detetive Note (ouça e monte, versão A) e 3) quiz "de quem é esse som?" (instrumentos, versão C). Cada função recebe `c` = o contexto do Figurix:
// { root, S, sfx, topo, acerto, erro, fim, fig, pausa, nomeFig, beatsLabel, aoLimpar }. As regras puras estão em figurix-logic.js (testadas).
import { h } from '../util.js';
import { audio, kick, snare, hihat, silence } from '../audio.js';
import { bass, epiano, guitar, voice } from '../synth.js';
import { pluck, mallet, percHit } from '../instruments.js';
import * as FB from '../feedback.js';
import { FIG_BY } from '../kids/figs.js';
import { ouvidasMax, bpmFase, cartas, sortear, conferir, acertou } from './detetive-logic.js';
import { face as faceDetetive, tocaCompasso, soa } from './detetive-note.js';
import { paresMem, memCfg, mesmoParN, sumiuRodada, previaSeg, detFase } from './figurix-logic.js';

/** Conta regressiva em texto (3… 2… 1…) usando os tempos da sessão da tela. */
function contagem(S, el, seg, aoFim) { let r = seg; el.textContent = String(r); const passo = () => { r--; if (r <= 0) { el.textContent = ''; aoFim(); } else { el.textContent = String(r); S.later(passo, 1000); } }; S.later(passo, 1000); }

/* ---------- 1a e 1b: memória (toque nos pares / olhe e vire) ---------- */
export function memoria(c, p, modo) {
  const { root, S, sfx, topo, acerto, erro, fim, fig, pausa, nomeFig, beatsLabel } = c;
  const cfg = memCfg(p.nivel); const cartasM = paresMem(cfg.k, cfg.modo); window.__figurix.cartas = cartasM; let aberta = null; let trava = modo === 'espiada'; const feitos = new Set();
  const face = (x) => (x.tipo === 'fig' ? fig(x.id, 'fx-fig sm') : x.tipo === 'pausa' ? pausa(x.id, 'fx-fig sm') : h('b', { class: 'fx-txt' }, x.tipo === 'valor' ? beatsLabel(FIG_BY[x.id].beats) : nomeFig(x.id)));
  const B = cartasM.map((x) => h('button', { type: 'button', class: `fx-card${modo === 'pares' ? ' aberta' : ' aberta previa'}`, 'data-k': x.k, 'aria-label': 'carta', onclick: () => toca(x, B[x.k]) }, face(x)));
  const msg = h('p', { class: 'fx-q' }, modo === 'pares' ? 'toque nas duas iguais' : 'decore onde cada uma está'); const cont = h('div', { class: 'fx-cont', 'aria-live': 'polite' });
  function toca(x, b) {
    if (trava || feitos.has(x.k) || (aberta && aberta.x.k === x.k)) return; sfx.play('click');
    if (modo === 'espiada') b.classList.add('aberta'); else b.classList.add('sel');
    if (!aberta) { aberta = { x, b }; return; }
    const a = aberta; aberta = null;
    if (mesmoParN(a.x, x)) { feitos.add(a.x.k); feitos.add(x.k); for (const e of [a.b, b]) { e.classList.remove('sel'); e.classList.add('ok'); } acerto(b); if (feitos.size === cartasM.length) S.later(fim, 900); }
    else { try { FB.lose(b); } catch { /* ok */ } erro(b); trava = true; S.later(() => { for (const e of [a.b, b]) { e.classList.remove('sel', 'no'); if (modo === 'espiada') e.classList.remove('aberta'); } trava = false; }, 800); }
  }
  root.replaceChildren(topo(0, 0), msg, cont, h('div', { class: 'fx-mem' }, ...B));
  if (modo === 'espiada') contagem(S, cont, previaSeg(p.nivel), () => { B.forEach((b) => b.classList.remove('aberta', 'previa')); trava = false; msg.textContent = 'agora ache os pares!'; });
}

/* ---------- 1c: quem sumiu? ---------- */
export function sumiu(c, p) {
  const { root, S, sfx, topo, acerto, erro, fim, fig, nomeFig } = c; const total = 5; let i = 0;
  const rodada = () => {
    const q = sumiuRodada(p.nivel); const k = q.mostradas.indexOf(q.sumiu);
    const grade = h('div', { class: `fx-sumiu n${q.mostradas.length}` }, ...q.mostradas.map((f) => h('div', { class: 'fx-sc' }, fig(f, 'fx-fig sm'), h('small', {}, nomeFig(f)))));
    const msg = h('p', { class: 'fx-q' }, 'olhe bem as figuras'); const cont = h('div', { class: 'fx-cont', 'aria-live': 'polite' }); const ops = h('div', { class: `fx-ops n${q.opcoes.length}` });
    root.replaceChildren(topo(i, total), msg, cont, grade, ops);
    contagem(S, cont, previaSeg(p.nivel), () => {
      const alvo = grade.children[k]; alvo.replaceChildren(h('b', { class: 'fx-qm' }, '?')); alvo.classList.add('vazio'); msg.textContent = 'qual figura sumiu?'; window.__figurix.certa = nomeFig(q.sumiu);
      let fechada = false;
      ops.replaceChildren(...q.opcoes.map((f) => { const b = h('button', { type: 'button', class: 'fx-op', 'aria-label': nomeFig(f), 'data-certo': f === q.sumiu ? '1' : null, onclick: () => {
        if (fechada || b.disabled) return; sfx.play('click');
        if (f === q.sumiu) { fechada = true; b.classList.add('ok'); acerto(b); alvo.classList.remove('vazio'); alvo.replaceChildren(fig(f, 'fx-fig sm'), h('small', {}, nomeFig(f))); S.later(() => { i++; if (i >= total) fim(); else rodada(); }, 900); } else { erro(b); b.disabled = true; } } }, fig(f), h('small', {}, nomeFig(f))); return b; }));
    });
  };
  rodada();
}

/* ---------- 2: Detetive Note (ouça e monte) ---------- */
export function detetive(c, p) {
  const { root, S, sfx, topo, acerto, erro, fim } = c; const fase = detFase(p.nivel); const bpm = bpmFase('m1', fase); const total = 3; c.aoLimpar(() => silence());
  let rodada = 0; let slots = []; let secreto = null; let errou = false; let marcas = null; let ouvidas = 0; let ultimo = null; const cs = cartas('m1', fase, 'figuras');
  const restam = () => ouvidasMax(fase) - ouvidas;
  const ouvir = () => { if (restam() <= 0) return; ouvidas++; silence(); audio(); tocaCompasso(secreto, bpm, 'caixa'); };
  const nova = () => { secreto = sortear(fase, Math.random, ultimo, 'm1'); ultimo = secreto; slots = []; errou = false; marcas = null; ouvidas = 0; window.__figurix.secreto = secreto; desenha(); S.later(() => { ouvir(); desenha(); }, 400); };
  const desenha = () => {
    const cheio = slots.length === 4;
    const casas = Array.from({ length: 4 }, (_, i) => { const x = slots[i] != null ? cs.find((y) => y.cell === slots[i]) : null; const m = marcas ? marcas[i] : null;
      return h('button', { type: 'button', class: `dn-slot${x ? ' cheia' : ''}${m === true ? ' ok' : m === false ? ' no' : ''}`, 'aria-label': x ? `tempo ${i + 1}: tirar` : `tempo ${i + 1} vazio`, onclick: () => { if (x) { slots = slots.slice(0, i); marcas = null; desenha(); } } }, x ? faceDetetive(x, 'figuras') : h('small', {}, String(i + 1))); });
    const baralho = cs.map((x) => h('button', { type: 'button', class: 'dn-card', disabled: cheio, 'data-cell': x.cell, 'aria-label': x.cell === '0000' ? 'pausa' : x.cell, onclick: () => { if (slots.length < 4) { soa(x.cell, bpm, 'caixa'); slots = [...slots, x.cell]; marcas = null; desenha(); } } }, faceDetetive(x, 'figuras')));
    const rest = restam(); const vezes = rest === Infinity ? '' : rest > 0 ? ` · ${rest} ${rest === 1 ? 'vez' : 'vezes'}` : ' · acabou, confie no ouvido!';
    root.replaceChildren(h('div', { class: 'jg-detetive fx-det' }, h('div', { class: 'dn-caderno' }, topo(rodada, total),
      h('h2', { class: 'dn-caso' }, 'caso ', h('em', {}, String(rodada + 1).padStart(2, '0'))),
      h('button', { class: 'dn-ouvir', type: 'button', disabled: rest <= 0, onclick: () => { ouvir(); desenha(); } }, h('span', { class: 'dn-vinil', 'aria-hidden': 'true' }), h('span', { class: 'dn-ouvir-t' }, 'ouvir a pista', h('small', {}, `caixa · ${bpm} bpm${vezes}`))),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, errou ? 'quase! os vermelhos estão errados: ouça de novo e troque.' : 'monte na ordem que você ouviu:'),
      h('div', { class: 'dn-wrap sem' }, h('div', { class: 'dn-slots' }, ...casas)), h('p', { class: 'dn-lab' }, 'suas pistas'), h('div', { class: 'dn-baralho', style: `--n:${cs.length > 4 ? 3 : cs.length}` }, ...baralho),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary dn-conferir', type: 'button', disabled: !cheio, onclick: confere }, 'conferir'), slots.length ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { slots = []; marcas = null; desenha(); } }, 'limpar') : null))));
  };
  const confere = () => {
    if (acertou(slots, secreto)) { marcas = secreto.map(() => true); desenha(); acerto(root.querySelector('.dn-slots')); silence(); S.later(() => { rodada++; if (rodada >= total) fim(); else nova(); }, 1100); }
    else { errou = true; marcas = conferir(slots, secreto); desenha(); erro(root.querySelector('.dn-slots')); }
  };
  nova();
}

/* ---------- 3: de quem é esse som? ---------- */
/** Toca um trechinho curto de cada instrumento (tudo sintetizado no próprio app). */
export function tocaInstr(id) {
  try {
    silence(); const ct = audio(); const t = ct.currentTime + 0.05; const q = 0.28;
    if (id === 'bateria') { [0, 2].forEach((k) => kick(t + k * q, 1)); [1, 3].forEach((k) => snare(t + k * q, 1)); for (let k = 0; k < 8; k++) hihat(t + k * q / 2, 0.6); }
    else if (id === 'violao') { [48, 52, 55, 60, 64].forEach((m, k) => pluck(m, 0.8, t + k * 0.07, 'acoustic')); }
    else if (id === 'guitarra') { guitar(t, [52, 55, 59], 0.9, 1); guitar(t + 0.5, [55, 59, 62], 0.9, 1); }
    else if (id === 'piano') { [60, 64, 67, 72].forEach((m, k) => epiano(t + k * 0.22, [m], 0.7, 1)); }
    else if (id === 'baixo') { [36, 36, 43, 41].forEach((m, k) => bass(t + k * 0.28, m, 0.26, 1)); }
    else if (id === 'voz') { [60, 64, 67].forEach((m, k) => voice(t + k * 0.4, m, 0.5, 1)); }
    else if (id === 'pandeiro') { for (let k = 0; k < 6; k++) setTimeout(() => percHit('pd', k % 2 ? 0.55 : 0.9), k * 140); }
    else if (id === 'xilofone') { [72, 76, 79, 84].forEach((m, k) => mallet(m, 0.9, 'xilofone', t + k * 0.18)); }
  } catch { /* sem áudio */ }
}


export const paraSom = () => { try { silence(); } catch { /* sem áudio */ } };
