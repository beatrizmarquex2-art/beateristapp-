// Eco de Groove: o Paul toca 1 compasso de semínimas (bumbo, caixa, chimbal, juntos ou com pausa) e o aluno repete no compasso seguinte.
// 10 fases, 3 compassos por fase. Na tela: 3 pads (confere peça e tempo). No microfone: bateria de verdade (confere o tempo e a pausa; não separa as peças).
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { audio, click, kick, snare, hihat, perfToCtx, silence } from '../audio.js';
import { drumSvg } from '../kids/drum-art.js';
import { toast } from '../ui.js';
import { micToast } from '../mic-access.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { FASES_GROOVE, TEMPOS_GROOVE, PECAS, MIN_GROOVE, folgaGroove, julgaGroove, julgaGrooveMic, notaGroove, grooveLiberada, estrelasPct } from './vivo-logic.js';
import { chips, ouvirBatidas, premiar, quadro, estrelasTxt } from './vivo-ui.js';

const SOM = { b: (t) => kick(t, 0.95), c: (t) => snare(t, 0.9), h: (t) => hihat(t, 0.9) };
const ORDEM = ['h', 'c', 'b']; // de cima pra baixo, como na bateria

export function mount(host) {
  const root = h('div', { class: 'jg vv vv-groove' }); host.replaceChildren(root);
  let gone = false; let mic = null; let timers = []; let estado = 'lista'; let parar = () => {};
  const limpa = () => { timers.forEach(clearTimeout); timers = []; if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } delete window.__vivo; };
  const est = () => getGame('groove').est || {};

  function lista() {
    limpa(); musicaVolta(); estado = 'lista'; const e = est();
    root.replaceChildren(
      h('p', { class: 'vv-intro' }, 'o Paul toca um compasso, você repete no seguinte. só semínimas: uma batida por tempo.'),
      h('div', { class: 'vv-fases' }, ...FASES_GROOVE.map((f) => {
        const lock = !grooveLiberada(e, f.n); const n = estrelasPct(e[f.n] || 0);
        return h('button', { type: 'button', class: `vv-fase${lock ? ' lock' : ''}`, disabled: lock, 'data-fase': String(f.n), 'aria-label': `fase ${f.n}, ${f.nome}${lock ? ', trancada' : `, ${n} de 3 estrelas`}`, onclick: () => fase(f) },
          h('i', { class: 'vv-num' }, String(f.n)), h('span', { class: 'vv-nome' }, f.nome), h('span', { class: 'vv-est' }, lock ? 'ganhe 1 ★ na anterior' : estrelasTxt(n)));
      })));
  }

  function fase(f) {
    limpa(); estado = 'fase'; const sv = getGame('groove'); const bpm = TEMPOS_GROOVE.includes(sv.bpm) ? sv.bpm : 80; const usaMic = sv.entrada === 'mic'; const q = 60 / bpm; const win = folgaGroove(bpm);
    const muda = (patch) => { setGame('groove', patch); fase(f); };
    const caixas = [0, 1, 2, 3].map((i) => h('div', { class: 'vv-tempo', 'data-i': String(i) }, h('small', {}, String(i + 1)), h('div', { class: 'vv-pecas' })));
    const quem = h('b', { class: 'vv-quem' }, 'compasso 1 de 3'); const msg = h('p', { class: 'vv-msg', role: 'status', 'aria-live': 'polite' }, usaMic ? 'toque na sua bateria: o app escuta o tempo de cada batida.' : 'toque nos pads. pra tocar duas peças juntas, use dois dedos.');
    const res = h('div', { class: 'vv-fim' }); const go = h('button', { type: 'button', class: 'vv-go' }, '▶ jogar'); const taps = []; let t0 = 0;
    const mostra = (bar) => bar.forEach((s, i) => { const box = caixas[i].lastChild; box.replaceChildren(...(s ? ORDEM.filter((p) => s.includes(p)).map((p) => h('span', { class: `vv-peca ${p}` }, PECAS[p])) : [h('span', { class: 'vv-peca pausa' }, 'pausa')])); caixas[i].classList.remove('ok', 'bad', 'now'); });
    const pads = ORDEM.map((p) => { const b = h('button', { type: 'button', class: `vv-pad ${p}`, 'data-p': p, 'aria-label': PECAS[p] }, drumSvg(PECAS[p], 'vv-drum'), h('span', {}, PECAS[p])); b.addEventListener('pointerdown', (e) => { e.preventDefault(); toca(p, e.timeStamp); b.classList.add('hit'); setTimeout(() => b.classList.remove('hit'), 90); }); return b; });
    const ops = h('div', { class: 'vv-ops' }, chips('andamento', TEMPOS_GROOVE.map((b) => [b, `${b} BPM`]), bpm, (v) => muda({ bpm: v })), chips('como tocar', [[false, 'na tela'], [true, 'bateria de verdade']], usaMic, (v) => muda({ entrada: v ? 'mic' : 'tela' })));
    root.replaceChildren(h('div', { class: 'vv-topo' }, h('button', { type: 'button', class: 'btn small ghost vv-volta', onclick: () => { para(); lista(); } }, '‹ fases'), h('b', {}, `${f.n} · ${f.nome}`), h('span', { class: 'vv-est' }, estrelasTxt(estrelasPct(est()[f.n] || 0)))),
      ops, quem, h('div', { class: 'vv-compasso' }, ...caixas), msg, usaMic ? h('p', { class: 'vv-mic' }, h('b', {}, 'microfone'), ' ele confere se você tocou em cada tempo e ficou em silêncio na pausa. as peças ele não separa.') : h('div', { class: 'vv-pads' }, ...pads), go, res);
    mostra(f.bars[0]);

    function toca(p, ts) { const c = audio(); SOM[p](c.currentTime + 0.005); if (estado === 'play') { const t = ts ? perfToCtx(ts) : c.currentTime; taps.push({ t: Math.abs(t - c.currentTime) > 0.25 ? c.currentTime : t, p }); } }
    const em = (t, fn) => { timers.push(setTimeout(() => { if (!gone && estado === 'play') fn(); }, Math.max(0, (t - audio(false).currentTime) * 1000))); };
    const para = () => { if (estado === 'play') { try { silence(); } catch { /* sem áudio */ } } timers.forEach(clearTimeout); timers = []; if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } };
    function fim() {
      estado = 'fase'; if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } musicaVolta();
      const porBar = f.bars.map((bar, k) => { const ini = t0 + k * 8 * q + 4 * q; const meus = taps.map((x) => ({ t: x.t - ini, p: x.p })).filter((x) => x.t > -0.5 * q && x.t < 3.5 * q); return usaMic ? julgaGrooveMic(bar, meus.map((x) => x.t), q, win) : julgaGroove(bar, meus, q, win); });
      const pct = notaGroove(porBar); const n = estrelasPct(pct); const e = { ...est() }; if (pct > (e[f.n] || 0)) e[f.n] = pct; setGame('groove', { est: e }); premiar('groove', n, `gv:${f.n}`);
      mostra(f.bars[f.bars.length - 1]); porBar[porBar.length - 1].tempos.forEach((ok, i) => caixas[i].classList.add(ok ? 'ok' : 'bad')); quem.textContent = 'resultado';
      const prox = FASES_GROOVE.find((x) => x.n === f.n + 1);
      res.replaceChildren(quadro(`${pct}%`, n, pct >= MIN_GROOVE ? 'você devolveu o groove!' : `precisa de ${MIN_GROOVE}% pra ganhar estrela`, h('small', {}, `certos por compasso: ${porBar.map((r) => `${r.hits}/${r.esperado}`).join(' · ')}${porBar.some((r) => r.extras) ? ` · toques sobrando: ${porBar.reduce((s, r) => s + r.extras, 0)}` : ''}`),
        pct >= MIN_GROOVE && prox ? h('button', { type: 'button', class: 'btn small', onclick: () => fase(prox) }, 'próxima fase ▶') : null));
      go.textContent = '↻ jogar de novo'; go.hidden = false; ops.hidden = false; msg.textContent = pct >= 80 ? 'muito bom!' : 'dica: conte 1, 2, 3, 4 em voz alta junto com o Paul.';
      root.querySelector('.vv-topo .vv-est').textContent = estrelasTxt(estrelasPct(e[f.n] || 0));
    }
    async function comeca() {
      go.hidden = true; ops.hidden = true; res.replaceChildren(); musicaPausa(); taps.length = 0;
      if (usaMic) { msg.textContent = 'abrindo o microfone…'; try { mic = await ouvirBatidas((t) => { if (estado === 'play') taps.push({ t, p: '?' }); }); } catch (e) { if (gone) return; toast(`${micToast(e)} vou usar a tela`); setGame('groove', { entrada: 'tela' }); fase(f); return; } if (gone || estado !== 'fase') { if (mic) { mic.stop(); mic = null; } return; } }
      const c = audio(); estado = 'play'; t0 = c.currentTime + 0.35 + 4 * q;
      for (let i = 0; i < 4; i++) { click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5); em(t0 - (4 - i) * q, () => { quem.textContent = `conta: ${i + 1}`; }); }
      f.bars.forEach((bar, k) => {
        const paul = t0 + k * 8 * q; const vez = paul + 4 * q;
        em(paul - 0.05, () => { mostra(bar); quem.textContent = `compasso ${k + 1} de ${f.bars.length}: o Paul toca`; quem.className = 'vv-quem paul'; msg.textContent = 'escuta…'; });
        bar.forEach((s, i) => { for (const p of s) SOM[p](paul + i * q); click(paul + i * q, i === 0 ? 2 : 1, 0.16); em(paul + i * q, () => caixas.forEach((x, j) => x.classList.toggle('now', j === i))); });
        em(vez - 0.05, () => { quem.textContent = `compasso ${k + 1} de ${f.bars.length}: sua vez`; quem.className = 'vv-quem vez'; msg.textContent = 'agora você!'; });
        for (let i = 0; i < 4; i++) { if (!usaMic) click(vez + i * q, i === 0 ? 2 : 1, 0.16); em(vez + i * q, () => caixas.forEach((x, j) => x.classList.toggle('now', j === i))); } // no microfone não tem clique na sua vez: ele ouviria o próprio alto-falante
      });
      const total = t0 + f.bars.length * 8 * q + 0.35; timers.push(setTimeout(() => { if (!gone && estado === 'play') fim(); }, Math.max(0, (total - c.currentTime) * 1000)));
      window.__vivo.t0 = t0;
    }
    go.addEventListener('click', comeca);
    parar = () => { if (estado === 'play') { para(); estado = 'fase'; fase(f); } };
    window.__vivo = { jogo: 'groove', fase: f.n, q, toca, inject: (t, p) => taps.push({ t, p }), get estado() { return estado; }, t0: 0 }; // só pra teste
  }
  lista();
  return {
    inProgress: () => estado === 'play',
    pause: () => parar(),
    restart: () => { if (!gone) { if (estado === 'play') { try { silence(); } catch { /* sem áudio */ } } lista(); } },
    destroy() { gone = true; if (estado === 'play') { try { silence(); } catch { /* sem áudio */ } } limpa(); musicaVolta(); },
  };
}
