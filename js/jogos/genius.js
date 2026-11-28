// Eco do Paul (Genius infinito): o Paul toca uma sequência, você repete; a cada rodada ela ganha 1 nota e fica mais rápida. Errou, acabou: "você decorou N notas".
// 4 instrumentos (xilofone, piano, bateria com as peças do kit acústico do app, violão); recorde de cada um. Sem estrela e sem figurinha: é treino pra decorar.
// Tela "fluida" (se redistribui sozinha pra caber em qualquer aparelho, como o quebra-cabeça e o cara a cara). Lógica em genius-logic.js.
import { h } from '../util.js';
import { audio } from '../audio.js';
import { epiano } from '../synth.js';
import { mallet, pluck, kitSom, warmKit } from '../instruments.js';
import { arte } from '../kids/kit-modelos.js';
import { getGame, setGame } from './base.js';
import { ico } from './fluido-ui.js';
import * as L from './genius-logic.js';
import { soRobo } from '../amostra.js';
import { pedir } from '../tocar-plano.js';

const ID = 'genius';
export function mount(host) {
  const saved = getGame(ID);
  let inst = soRobo() ? 'xilofone' : L.instrumentoValido(saved.inst); /* plano grátis: só o xilofone */ let recs = saved.recs && typeof saved.recs === 'object' ? saved.recs : {};
  let seq = []; let rodada = 0; let pos = 0; let vez = false; let jogando = false; let over = false; let ouvirRest = L.OUVIR_DE_NOVO; let gone = false; let batido = false; // batido: já bateu o recorde nesta partida
  const timers = []; const later = (fn, ms) => { const t = setTimeout(() => { if (!gone) fn(); }, ms); timers.push(t); return t; };
  const limpa = () => { timers.splice(0).forEach(clearTimeout); };
  const root = h('div', { class: 'jg jg-genius jg-fluido-root cm-fluido' }); host.replaceChildren(root);

  /* ---------- som ---------- */
  const soa = (i, t) => {
    try {
      const c = audio(); const tt = t ?? c.currentTime + 0.02; const p = L.INSTRUMENTOS[inst].pads[i];
      if (inst === 'xilofone') mallet(p.midi, 0.9, 'xilofone', tt);
      else if (inst === 'piano') epiano(tt, [p.midi], 0.7, 1);
      else if (inst === 'violao') pluck(p.midi, 0.85, tt, 'acoustic');
      else { const k = kitSom('acustica')[p.id]; if (k) k(tt, 1, 0.3); }
    } catch { /* sem áudio */ }
  };
  const erroSom = () => { try { epiano(audio().currentTime + 0.02, [43], 0.4, 0.9); } catch { /* sem áudio */ } };

  /* ---------- peças da tela ---------- */
  let els = []; // um elemento por pad (o que acende)
  const stats = {}; const pill = (k, icone, rotulo) => { const b = h('b', {}, '0'); stats[k] = b; return h('div', { class: 'qz-st', 'aria-label': rotulo }, ico(icone), b, h('small', {}, rotulo)); };
  const msg = h('p', { class: 'qz-msg gn-msg', role: 'status', 'aria-live': 'polite' }, 'escolha o instrumento e toque em começar');
  const stage = h('div', { class: 'cm-stage gn-stage' });
  const tabs = h('div', { class: 'gn-tabs', role: 'radiogroup', 'aria-label': 'instrumento' });
  const bOuvir = h('button', { type: 'button', class: 'qz-b', 'aria-label': 'ouvir de novo', onclick: () => ouvirDeNovo() }, ico('ouvir'), h('span', {}, 'ouvir de novo'));
  const bMain = h('button', { type: 'button', class: 'qz-b qz-main', 'aria-label': 'começar', onclick: () => comecar() }, ico('play'), h('span', {}, 'começar'));
  const bRec = h('button', { type: 'button', class: 'qz-b', 'aria-label': 'recomeçar', onclick: () => restart() }, ico('recomecar'), h('span', {}, 'recomeçar'));
  const dock = h('div', { class: 'qz-dock' }, bOuvir, bMain, bRec);
  root.append(tabs, h('div', { class: 'qz-stats' }, pill('rodada', 'alvo', 'rodada'), pill('notas', 'historico', 'notas'), pill('rec', 'trofeu', 'recorde')), msg, stage, dock);

  const pinta = () => {
    stats.rodada.textContent = String(Math.max(rodada, 0)); stats.notas.textContent = String(seq.length); stats.rec.textContent = String(recs[inst] || 0);
    bOuvir.disabled = !(jogando && !over && ouvirRest > 0 && seq.length > 0); bOuvir.querySelector('span').textContent = jogando && !over ? `ouvir de novo (${ouvirRest})` : 'ouvir de novo';
    bMain.disabled = jogando && !over; bMain.querySelector('span').textContent = over ? 'jogar de novo' : 'começar'; bMain.setAttribute('aria-label', over ? 'jogar de novo' : 'começar');
    tabs.querySelectorAll('button').forEach((b) => { const on = b.dataset.i === inst; b.setAttribute('aria-checked', String(on)); b.classList.toggle('on', on); b.disabled = jogando && !over; });
  };
  const acende = (i, ms = 260) => { const e = els[i]; if (!e) return; e.classList.add('gn-on'); later(() => e.classList.remove('gn-on'), ms); };
  const travaPads = (v) => stage.classList.toggle('gn-trava', v);

  function desenhaInstrumento() {
    const pads = L.INSTRUMENTOS[inst].pads; stage.className = `cm-stage gn-stage gn-i-${inst}`; stage.replaceChildren(); els = [];
    const ligar = (el, i) => { el.addEventListener('pointerdown', (e) => { e.preventDefault(); toque(i); }); el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toque(i); } }); els[i] = el; return el; };
    if (inst === 'xilofone') {
      stage.append(h('div', { class: 'gn-xilo' }, ...pads.map((p, i) => ligar(h('button', { type: 'button', class: 'gn-bar', style: `--c:${p.cor};--h:${100 - i * 5.5}%`, 'aria-label': p.nome }, h('span', {}, p.nome)), i))));
    } else if (inst === 'piano') {
      const pretas = [0, 1, 3, 4, 5].map((k) => h('i', { class: 'gn-preta', 'aria-hidden': 'true', style: `left:calc(${(k + 1) * 12.5}% - 3.4%)` }));
      stage.append(h('div', { class: 'gn-piano' }, ...pads.map((p, i) => ligar(h('button', { type: 'button', class: 'gn-key', style: `--c:${p.cor}`, 'aria-label': p.nome }, h('span', {}, p.nome)), i)), ...pretas));
    } else if (inst === 'violao') {
      stage.append(h('div', { class: 'gn-violao' }, h('i', { class: 'gn-traste', 'aria-hidden': 'true' }), ...pads.map((p, i) => ligar(h('button', { type: 'button', class: 'gn-corda', style: `--c:${p.cor};--e:${3.8 - i * 0.5}px`, 'aria-label': `corda ${p.nome}` }, h('span', {}, p.nome)), i))));
    } else {
      const t = document.createElement('template'); t.innerHTML = arte('acustica').trim(); const svg = t.content.firstChild; svg.classList.add('gn-kit'); svg.removeAttribute('role');
      pads.forEach((p, i) => { const g = svg.querySelector(`[data-p="${p.id}"]`); if (g) { g.setAttribute('aria-label', p.nome); ligar(g, i); } });
      stage.append(svg); warmKit('acustica');
    }
    travaPads(!vez);
  }
  function desenhaTabs() {
    tabs.replaceChildren(...L.ORDEM.map((k) => h('button', { type: 'button', role: 'radio', class: `gn-tab${soRobo() && k !== 'xilofone' ? ' jg-trav' : ''}`, 'data-i': k, 'aria-checked': String(k === inst), onclick: () => { if (jogando && !over) return; if (soRobo() && k !== 'xilofone') { pedir(`o ${L.INSTRUMENTOS[k].nome} no Eco do Paul`); return; } inst = k; setGame(ID, { inst, recs }); fimLimpa(); desenhaInstrumento(); pinta(); } }, L.INSTRUMENTOS[k].nome)));
  }

  /* ---------- a partida ---------- */
  function fimLimpa() { limpa(); seq = []; rodada = 0; pos = 0; vez = false; jogando = false; over = false; batido = false; ouvirRest = L.OUVIR_DE_NOVO; msg.textContent = 'toque em começar e ouça a sequência'; travaPads(true); }
  function mostra() {
    limpa(); vez = false; pos = 0; travaPads(true); msg.textContent = 'ouça…'; pinta(); const ms = L.msPorNota(rodada);
    seq.forEach((v, k) => later(() => { acende(v, ms * 0.7); soa(v); }, 600 + k * ms));
    later(() => { vez = true; travaPads(false); msg.textContent = 'sua vez!'; pinta(); }, 600 + seq.length * ms);
  }
  function proxima() { rodada++; seq = L.proximaNota(seq, L.INSTRUMENTOS[inst].pads.length); mostra(); }
  function comecar() { if (jogando && !over) return; audio(); fimLimpa(); jogando = true; ouvirRest = L.OUVIR_DE_NOVO; proxima(); }
  function ouvirDeNovo() { if (!jogando || over || ouvirRest <= 0 || !seq.length) return; ouvirRest--; mostra(); }
  function acabou(esperado) {
    vez = false; over = true; travaPads(true); erroSom(); limpa(); acende(esperado, 900); // mostra a que era
    const n = L.decoradas(rodada, true); const r = L.atualizaRecorde(recs, inst, n); recs = r.recs; if (r.novo && n > 0) { setGame(ID, { inst, recs }); try { window.dispatchEvent(new Event('bt-rank-sujo')); } catch { /* sem janela */ } }
    msg.textContent = `você decorou ${n} nota${n === 1 ? '' : 's'}! ${(r.novo || batido) && n > 0 ? '🏆 novo recorde! ' : ''}${L.elogio(n)}`; pinta();
  }
  function toque(i) {
    audio(); if (!vez || over || !jogando) return; acende(i, 200); soa(i);
    const r = L.confere(seq, pos, i);
    if (r === 'erro') { acabou(seq[pos]); return; }
    pos++;
    if (r === 'fim') {
      vez = false; travaPads(true); const rr = L.atualizaRecorde(recs, inst, rodada); recs = rr.recs; if (rr.novo) { batido = true; setGame(ID, { inst, recs }); try { window.dispatchEvent(new Event('bt-rank-sujo')); } catch { /* sem janela */ } }
      msg.textContent = rr.novo && rodada > 1 ? `isso! ${rodada} notas · novo recorde 🏆` : `isso! ${rodada} nota${rodada === 1 ? '' : 's'} certas`; pinta(); later(proxima, 900);
    }
  }
  function restart() { fimLimpa(); pinta(); }

  desenhaTabs(); desenhaInstrumento(); pinta();
  return {
    inProgress: () => jogando && !over && rodada > 1,
    restart: () => restart(),
    pause: () => { limpa(); if (jogando && !over) { vez = false; travaPads(true); } },
    resume: () => { if (jogando && !over) mostra(); },
    destroy() { gone = true; limpa(); },
  };
}
