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
/** Como funciona uma aula, em 3 passos (aparece na lista e antes de jogar). */
const passosCard = () => h('div', { class: 'au-como' },
  h('b', { class: 'au-como-t' }, 'como funciona'),
  h('ol', { class: 'au-passos' },
    h('li', { class: 'paul' }, h('i', {}, '1'), h('span', {}, h('b', {}, 'ouvir'), ': o Paul toca 1 compasso e acende as peças da bateria. só escute e olhe.')),
    h('li', { class: 'vez' }, h('i', {}, '2'), h('span', {}, h('b', {}, 'tocar'), ': sua vez! toque o mesmo ritmo nas peças, no mesmo compasso.')),
    h('li', { class: 'cont' }, h('i', {}, '3'), h('span', {}, h('b', {}, 'contagem'), ': 1 · 2 · 3 · 4 pra se preparar. aí volta pro 1: ouvir de novo.'))),
  h('p', { class: 'au-como-r' }, 'a ordem é sempre ', h('b', {}, 'ouvir, tocar, contagem'), ', 3 vezes (começa com uma contagem). no fim aparece a nota: 60% = 1 ★, 80% = 2 ★, 100% = 3 ★.'));

export function aulasPainel(kit, { voltar } = {}) {
  const el = h('section', { class: 'card pad tk-panel bmr au-painel' });
  let estado = 'lista'; let timers = []; let gone = false; const taps = [];
  const limpa = () => { timers.forEach(clearTimeout); timers = []; kit.aoBater(null); };
  const em = (t, fn) => { timers.push(setTimeout(() => { if (!gone && estado === 'play') fn(); }, Math.max(0, (t - audio(false).currentTime) * 1000))); };

  function lista() {
    limpa(); if (kit.jogando) kit.jogando(false); estado = 'lista'; const e = est();
    el.replaceChildren(
      h('div', { class: 'au-topo' }, h('b', {}, 'aulas da bateria'), voltar ? h('button', { type: 'button', class: 'btn small ghost', onclick: () => { limpa(); voltar(); } }, 'fechar') : null),
      passosCard(),
      h('p', { class: 'au-escolha' }, 'escolha uma aula:'),
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
    const quem = h('b', { class: 'au-quem' }, 'pronto?');
    const dots = h('div', { class: 'au-dots', 'aria-hidden': 'true' }, ...Array.from({ length: RODADAS }, (_, k) => h('span', { class: 'au-dot' }, h('i', { class: 'ouvir' }, 'O'), h('i', { class: 'tocar' }, 'T'), h('i', { class: 'conta' }, 'C'))));
    const conta = h('div', { class: 'au-conta', 'aria-hidden': 'true' }, ...[1, 2, 3, 4].map((n) => h('i', {}, String(n))));
    const banner = h('div', { class: 'au-banner' }, quem, dots, h('small', { class: 'au-dots-leg' }, 'O ouvir · T tocar · C contagem'), conta);
    const marca = (k, fase) => { [...dots.children].forEach((d, i) => { d.classList.toggle('on', i === k); d.classList.toggle('feito', i < k); [...d.children].forEach((x) => x.classList.remove('agora')); }); if (k >= 0 && dots.children[k]) dots.children[k].querySelector(`.${fase}`).classList.add('agora'); };
    const bat = (i) => [...conta.children].forEach((x, k) => x.classList.toggle('on', k === i));
    marca(-1);
    const msg = h('p', { class: 'au-msg', role: 'status', 'aria-live': 'polite' }, 'toque nas peças da bateria. pra duas peças juntas, use dois dedos.');
    const res = h('div', { class: 'au-fim' }); const go = h('button', { type: 'button', class: 'btn primary tk-big au-go' }, '▶ jogar');
    const bpmOut = h('output', { class: 'bl-bpm' }, String(bpm));
    const troca = (d) => { bpm = Math.max(50, Math.min(180, bpm + d)); bpmOut.textContent = String(bpm); const m = { ...(getGame('aulabat').bpm || {}) }; m[a.id] = bpm; setGame('aulabat', { bpm: m }); };
    const tempo = h('div', { class: 'bl-tempo au-tempo' }, h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => troca(-5) }, '−'), bpmOut, h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => troca(5) }, '+'), h('span', { class: 'tp-lab' }, 'BPM'));
    const topo = h('div', { class: 'au-topo' }, h('button', { type: 'button', class: 'btn small ghost', onclick: () => { parar(); lista(); } }, '‹ aulas'), h('span', { class: 'au-est' }, txtEst(estrelas(meu()))));
    const ouvirBtn = h('button', { type: 'button', class: 'btn tk-big au-ouvir' }, '👂 só ouvir o Paul (sem nota)');
    el.replaceChildren(topo, banner, grade, passosCard(), msg, tempo, h('div', { class: 'au-acoes' }, ouvirBtn, go), res);

    const som = (id, t) => { const s = kitSom(kit.modelo()); if (s[id]) s[id](t, velAt(0.3), 0.3); };
    const parar = () => { marca(-1); bat(-1); if (estado === 'play') { try { silence(); } catch { /* sem áudio */ } } timers.forEach(clearTimeout); timers = []; kit.aoBater(null); if (kit.jogando) kit.jogando(false); estado = 'aula'; };
    const fim = (porBar) => {
      estado = 'aula'; kit.aoBater(null); if (kit.jogando) kit.jogando(false); agora(-1); marca(-1); bat(-1);
      const pct = nota(porBar); const n = estrelas(pct); const e = { ...est() }; if (pct > (e[a.id] || 0)) e[a.id] = pct; setGame('aulabat', { est: e });
      if (n > 0) ganhou('aulabat', n, `aulabat:${a.id}`);
      quem.textContent = 'resultado'; quem.className = 'au-quem'; topo.querySelector('.au-est').textContent = txtEst(estrelas(e[a.id] || 0));
      res.replaceChildren(h('div', { class: 'au-res', role: 'status' }, h('b', { class: 'au-res-n' }, `${pct}%`), h('span', { class: 'au-res-est', 'aria-label': `${n} de 3 estrelas` }, txtEst(n)),
        h('p', {}, pct >= 100 ? 'perfeito!' : pct >= 60 ? 'você devolveu o ritmo!' : 'precisa de 60% pra ganhar estrela. tenta de novo.'),
        h('small', {}, `certos por compasso: ${porBar.map((r) => `${r.hits}/${r.esperado}`).join(' · ')}${porBar.some((r) => r.extras) ? ` · toques sobrando: ${porBar.reduce((s, r) => s + r.extras, 0)}` : ''}`),
        h('small', {}, '60% = 1 ★ · 80% = 2 ★ · 100% = 3 ★')));
      go.textContent = '↻ jogar de novo'; go.hidden = false; ouvirBtn.hidden = false; tempo.hidden = false; msg.textContent = pct >= 80 ? 'muito bom!' : 'dica: conte 1, 2, 3, 4 em voz alta junto com o Paul.';
    };
    go.addEventListener('click', () => {
      go.hidden = true; ouvirBtn.hidden = true; tempo.hidden = true; res.replaceChildren(); taps.length = 0; estado = 'play'; if (kit.jogando) kit.jogando(true); if (kit.ver) kit.ver(); // jogando: some a linha de opções e a bateria + a partitura cabem juntas na tela
      const c = audio(); const q = 60 / bpm; const s = passoSeg(a, bpm); const t0 = c.currentTime + 0.4 + 4 * q; const bs = batidas(a, bpm); const vezes = [];
      for (let i = 0; i < 4; i++) { click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5); em(t0 - (4 - i) * q, () => { quem.textContent = `conta: ${i + 1}`; quem.className = 'au-quem conta'; marca(-1); bat(i); msg.textContent = 'prepare-se… o Paul começa já'; }); }
      for (let k = 0; k < RODADAS; k++) { // cada rodada: ouvir (o Paul) - tocar (você) - contagem (1 2 3 4, menos depois da última)
        const paul = t0 + k * 12 * q; const vez = paul + 4 * q; const cont = vez + 4 * q; vezes.push(vez);
        em(paul - 0.05, () => { quem.textContent = `ouça o Paul · ${k + 1} de ${RODADAS}`; quem.className = 'au-quem paul'; marca(k, 'ouvir'); msg.textContent = 'só escute e olhe as peças que acendem. ainda não toque!'; kit.aoBater(null); });
        for (let i = 0; i < 4; i++) { click(paul + i * q, i === 0 ? 2 : 1, 0.16); click(vez + i * q, i === 0 ? 2 : 1, 0.16); em(paul + i * q, () => bat(i)); em(vez + i * q, () => bat(i)); }
        for (let i = 0; i < a.n; i++) { em(paul + i * s, () => agora(i)); em(vez + i * s, () => agora(i)); }
        for (const b of bs) { for (const id of PECA_DO_KIT[b.p].slice(0, 1)) { som(id, paul + b.t); em(paul + b.t - 0.02, () => kit.luz(id)); } }
        em(vez - 0.05, () => { quem.textContent = `sua vez: toque! · ${k + 1} de ${RODADAS}`; quem.className = 'au-quem vez'; marca(k, 'tocar'); msg.textContent = 'agora toque o mesmo ritmo na bateria!'; kit.aoBater((id, t) => taps.push({ t, p: AULA_DO_KIT[id] || '?' })); });
        em(vez + 4 * q + 0.05, () => { kit.aoBater(null); agora(-1); });
        if (k < RODADAS - 1) for (let i = 0; i < 4; i++) { click(cont + i * q, i === 0 ? 2 : 1, 0.5); em(cont + i * q - 0.02, () => { quem.textContent = `contagem: ${i + 1}`; quem.className = 'au-quem conta'; marca(k, 'conta'); bat(i); msg.textContent = 'prepare-se: o Paul vai tocar de novo'; }); }
      }
      if (window.__aulaBat) { window.__aulaBat.vezes = vezes; window.__aulaBat.q = q; } // só pra teste
      const total = t0 + ((RODADAS - 1) * 12 + 8) * q + 0.3;
      timers.push(setTimeout(() => {
        if (gone || estado !== 'play') return;
        const porBar = vezes.map((vez) => julga(a, taps.map((x) => ({ t: x.t - vez, p: x.p })).filter((x) => x.t > -0.5 * s && x.t < 4 * q), bpm));
        fim(porBar);
      }, Math.max(0, (total - c.currentTime) * 1000)));
    });
    ouvirBtn.addEventListener('click', () => { // ensaio: o Paul toca 1 compasso, sem nota e sem a sua vez
      go.hidden = true; ouvirBtn.hidden = true; tempo.hidden = true; res.replaceChildren(); estado = 'play'; if (kit.jogando) kit.jogando(true); if (kit.ver) kit.ver();
      const c = audio(); const q = 60 / bpm; const s = passoSeg(a, bpm); const t0 = c.currentTime + 0.4 + 4 * q; const bs = batidas(a, bpm);
      for (let i = 0; i < 4; i++) { click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5); em(t0 - (4 - i) * q, () => { quem.textContent = `conta: ${i + 1}`; quem.className = 'au-quem conta'; bat(i); }); }
      em(t0 - 0.05, () => { quem.textContent = 'o Paul toca'; quem.className = 'au-quem paul'; msg.textContent = 'só escute e olhe as peças que acendem.'; });
      for (let i = 0; i < 4; i++) { click(t0 + i * q, i === 0 ? 2 : 1, 0.16); em(t0 + i * q, () => bat(i)); }
      for (let i = 0; i < a.n; i++) em(t0 + i * s, () => agora(i));
      for (const b of bs) for (const id of PECA_DO_KIT[b.p].slice(0, 1)) { som(id, t0 + b.t); em(t0 + b.t - 0.02, () => kit.luz(id)); }
      timers.push(setTimeout(() => { if (gone || estado !== 'play') return; estado = 'aula'; if (kit.jogando) kit.jogando(false); agora(-1); bat(-1); quem.textContent = 'pronto?'; quem.className = 'au-quem'; msg.textContent = 'agora é com você: toque em “jogar” quando quiser valer nota.'; go.hidden = false; ouvirBtn.hidden = false; tempo.hidden = false; }, Math.max(0, (t0 + 4 * q + 0.3 - c.currentTime) * 1000)));
    });
    window.__aulaBat = { aula: a, get estado() { return estado; }, inject: (t, p) => taps.push({ t, p }) }; // só pra teste
  }
  lista();
  return { el, destroy() { gone = true; if (kit.jogando) kit.jogando(false); if (estado === 'play') { try { silence(); } catch { /* sem áudio */ } } limpa(); delete window.__aulaBat; } };
}
