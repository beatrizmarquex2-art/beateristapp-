// "Aulas" da bateria de toque: o Paul toca um compasso acendendo as peças da bateria de verdade (a da tela) e o aluno repete tocando nelas.
// 3 rodadas por aula (o Paul toca, você repete). Nota = acertos de peça e de tempo; 60 / 80 / 100% = 1 / 2 / 3 ★ (cada aula paga até 3 ★ na vida, sem repetir).
// A regra (ritmos, tempos, nota) está em js/jogos/aulas-bateria.js; aqui só a tela e o relógio.
import { h } from '../util.js';
import { audio, click, silence } from '../audio.js';
import { kitSom, velAt } from '../instruments.js';
import { getGame, setGame } from '../jogos/base.js';
import { ganhou } from '../jogos/estrelas-jogo.js';
import * as N from '../notation.js';
import { AULAS, RODADAS, PECA_DO_KIT, AULA_DO_KIT, batidas, passoSeg, julga, nota, estrelas, paraBeat, xDoPasso } from '../jogos/aulas-bateria.js';

const est = () => getGame('aulabat').est || {};
const bpmDe = (a) => { const b = (getGame('aulabat').bpm || {})[a.id]; return Number.isFinite(b) && b >= 50 && b <= 180 ? b : a.bpm; };
const txtEst = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

/**
 * `kit` = { modelo(): id do modelo da bateria, luz(idPecaDoKit): acende a peça na tela (e o nome dela),
 *           aoBater(fn|null): registra quem recebe os toques do aluno (fn(idPecaDoKit, tempoNoRelogioDoSom)) }.
 * Devolve { el, destroy }.
 */
export function aulasPainel(kit, { voltar } = {}) {
  const el = h('section', { class: 'card pad tk-panel bmr au-painel' });
  let estado = 'lista'; let timers = []; let gone = false; const taps = [];
  const limpa = () => { timers.forEach(clearTimeout); timers = []; kit.aoBater(null); };
  const em = (t, fn) => { timers.push(setTimeout(() => { if (!gone && estado === 'play') fn(); }, Math.max(0, (t - audio(false).currentTime) * 1000))); };

  function lista() {
    limpa(); if (kit.jogando) kit.jogando(false); estado = 'lista'; const e = est();
    el.replaceChildren(
      h('div', { class: 'au-topo' }, h('b', {}, 'aulas da bateria'), voltar ? h('button', { type: 'button', class: 'btn small ghost', onclick: () => { limpa(); voltar(); } }, 'fechar') : null),
      h('p', { class: 'muted au-intro' }, 'o Paul toca um compasso e acende as peças da bateria; no compasso seguinte é a sua vez. escolha uma aula:'),
      h('div', { class: 'au-lista', role: 'group', 'aria-label': 'Aulas' },
        ...AULAS.map((a) => h('button', { type: 'button', class: 'kd-chip au-item', onclick: () => aula(a) }, h('span', {}, a.nome), h('small', {}, `${bpmDe(a)} bpm`), h('i', { class: 'au-est', 'aria-label': `${estrelas(e[a.id] || 0)} de 3 estrelas` }, txtEst(estrelas(e[a.id] || 0)))))));
  }

  function aula(a) {
    limpa(); if (kit.jogando) kit.jogando(false); estado = 'aula'; let bpm = bpmDe(a); const meu = () => est()[a.id] || 0;
    // a música na partitura de verdade (a do app): a normal (preto) e a colorida (cada peça na sua cor), com um cursor que anda
    const W = 340; const beat = paraBeat(a); const cursores = [];
    const pauta = (cor, rotulo) => { const f = h('figure', { class: `au-pauta${cor ? ' cor' : ''}` }); f.innerHTML = N.toSVG(N.layout(beat, { width: W, color: cor, full: true })); const c = h('i', { class: 'au-cursor', 'aria-hidden': 'true' }); f.append(c); cursores.push(c); return h('div', { class: 'au-bloco' }, h('span', { class: 'au-rotulo' }, rotulo), f); };
    const leg = h('div', { class: 'au-leg', 'aria-label': 'Cores das peças' }, ...N.legend(beat).map(([nome, cor]) => h('span', {}, h('i', { style: { background: cor } }), nome)));
    const grade = h('div', { class: 'au-pautas' }, h('h3', { class: 'au-nome' }, a.nome), h('p', { class: 'au-info' }, `${bpmDe(a)} bpm · 4/4 · ${a.n === 8 ? 'colcheias' : 'semicolcheias'}`), pauta(false, 'partitura'), pauta(true, 'partitura colorida'), leg);
    const agora = (i) => cursores.forEach((c) => { c.hidden = i < 0; if (i >= 0) c.style.left = `${xDoPasso(a, i, W) * 100}%`; });
    agora(-1);
    const quem = h('b', { class: 'au-quem' }, 'pronto?'); const msg = h('p', { class: 'au-msg', role: 'status', 'aria-live': 'polite' }, 'toque nas peças da bateria. pra duas peças juntas, use dois dedos.');
    const res = h('div', { class: 'au-fim' }); const go = h('button', { type: 'button', class: 'btn primary tk-big au-go' }, '▶ jogar');
    const bpmOut = h('output', { class: 'bl-bpm' }, String(bpm));
    const troca = (d) => { bpm = Math.max(50, Math.min(180, bpm + d)); bpmOut.textContent = String(bpm); const m = { ...(getGame('aulabat').bpm || {}) }; m[a.id] = bpm; setGame('aulabat', { bpm: m }); };
    const tempo = h('div', { class: 'bl-tempo au-tempo' }, h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => troca(-5) }, '−'), bpmOut, h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => troca(5) }, '+'), h('span', { class: 'tp-lab' }, 'BPM'));
    const topo = h('div', { class: 'au-topo' }, h('button', { type: 'button', class: 'btn small ghost', onclick: () => { parar(); lista(); } }, '‹ aulas'), quem, h('span', { class: 'au-est' }, txtEst(estrelas(meu()))));
    el.replaceChildren(topo, grade, msg, tempo, go, res);

    const som = (id, t) => { const s = kitSom(kit.modelo()); if (s[id]) s[id](t, velAt(0.3), 0.3); };
    const parar = () => { if (estado === 'play') { try { silence(); } catch { /* sem áudio */ } } timers.forEach(clearTimeout); timers = []; kit.aoBater(null); if (kit.jogando) kit.jogando(false); estado = 'aula'; };
    const fim = (porBar) => {
      estado = 'aula'; kit.aoBater(null); if (kit.jogando) kit.jogando(false); agora(-1);
      const pct = nota(porBar); const n = estrelas(pct); const e = { ...est() }; if (pct > (e[a.id] || 0)) e[a.id] = pct; setGame('aulabat', { est: e });
      if (n > 0) ganhou('aulabat', n, `aulabat:${a.id}`);
      quem.textContent = 'resultado'; quem.className = 'au-quem'; topo.querySelector('.au-est').textContent = txtEst(estrelas(e[a.id] || 0));
      res.replaceChildren(h('div', { class: 'au-res', role: 'status' }, h('b', { class: 'au-res-n' }, `${pct}%`), h('span', { class: 'au-res-est', 'aria-label': `${n} de 3 estrelas` }, txtEst(n)),
        h('p', {}, pct >= 100 ? 'perfeito!' : pct >= 60 ? 'você devolveu o ritmo!' : 'precisa de 60% pra ganhar estrela. tenta de novo.'),
        h('small', {}, `certos por compasso: ${porBar.map((r) => `${r.hits}/${r.esperado}`).join(' · ')}${porBar.some((r) => r.extras) ? ` · toques sobrando: ${porBar.reduce((s, r) => s + r.extras, 0)}` : ''}`),
        h('small', {}, '60% = 1 ★ · 80% = 2 ★ · 100% = 3 ★')));
      go.textContent = '↻ jogar de novo'; go.hidden = false; tempo.hidden = false; msg.textContent = pct >= 80 ? 'muito bom!' : 'dica: conte 1, 2, 3, 4 em voz alta junto com o Paul.';
    };
    go.addEventListener('click', () => {
      go.hidden = true; tempo.hidden = true; res.replaceChildren(); taps.length = 0; estado = 'play'; if (kit.jogando) kit.jogando(true); if (kit.ver) kit.ver(); // jogando: some a linha de opções e a bateria + a partitura cabem juntas na tela
      const c = audio(); const q = 60 / bpm; const s = passoSeg(a, bpm); const t0 = c.currentTime + 0.4 + 4 * q; const bs = batidas(a, bpm); const vezes = [];
      for (let i = 0; i < 4; i++) { click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5); em(t0 - (4 - i) * q, () => { quem.textContent = `conta: ${i + 1}`; quem.className = 'au-quem'; }); }
      for (let k = 0; k < RODADAS; k++) {
        const paul = t0 + k * 8 * q; const vez = paul + 4 * q; vezes.push(vez);
        em(paul - 0.05, () => { quem.textContent = `${k + 1} de ${RODADAS}: o Paul toca`; quem.className = 'au-quem paul'; msg.textContent = 'escuta e olha a bateria…'; kit.aoBater(null); });
        for (let i = 0; i < 4; i++) { click(paul + i * q, i === 0 ? 2 : 1, 0.16); click(vez + i * q, i === 0 ? 2 : 1, 0.16); }
        for (let i = 0; i < a.n; i++) { em(paul + i * s, () => agora(i)); em(vez + i * s, () => agora(i)); }
        for (const b of bs) { for (const id of PECA_DO_KIT[b.p].slice(0, 1)) { som(id, paul + b.t); em(paul + b.t - 0.02, () => kit.luz(id)); } }
        em(vez - 0.05, () => { quem.textContent = `${k + 1} de ${RODADAS}: sua vez`; quem.className = 'au-quem vez'; msg.textContent = 'agora você, na bateria!'; kit.aoBater((id, t) => taps.push({ t, p: AULA_DO_KIT[id] || '?' })); });
        em(vez + 4 * q + 0.05, () => kit.aoBater(null));
      }
      if (window.__aulaBat) { window.__aulaBat.vezes = vezes; window.__aulaBat.q = q; } // só pra teste
      const total = t0 + RODADAS * 8 * q + 0.3;
      timers.push(setTimeout(() => {
        if (gone || estado !== 'play') return;
        const porBar = vezes.map((vez) => julga(a, taps.map((x) => ({ t: x.t - vez, p: x.p })).filter((x) => x.t > -0.5 * s && x.t < 4 * q), bpm));
        fim(porBar);
      }, Math.max(0, (total - c.currentTime) * 1000)));
    });
    window.__aulaBat = { aula: a, get estado() { return estado; }, inject: (t, p) => taps.push({ t, p }) }; // só pra teste
  }
  lista();
  return { el, destroy() { gone = true; if (kit.jogando) kit.jogando(false); if (estado === 'play') { try { silence(); } catch { /* sem áudio */ } } limpa(); delete window.__aulaBat; } };
}
