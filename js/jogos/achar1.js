// Achar o 1: o Paul solta o groove no meio do compasso, sem contar. Toque no botão toda vez que sentir o 1.
// 5 rodadas de 4 compassos. No fim de cada uma aparece a régua: onde o 1 estava e onde você tocou.
import { h } from '../util.js';
import * as B from '../beats.js';
import { audio, click, perfToCtx, scheduler, silence } from '../audio.js';
import { getGame, setGame } from './base.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { chips, premiar, quadro } from './vivo-ui.js';
import { NIVEIS_ACHAR1, RODADAS, COMPASSOS, nivelDe, sorteiaRodada, julgaRodada, estrelasAchar1, fraseRodada } from './achar1-logic.js';

const pool = (lv) => B.PRESETS.filter((p) => p.kind === 'groove' && p.steps !== 12 && B.levelOf(p) === lv);
const FRASE_FIM = ['o Paul perdeu o groove… tente de novo!', 'achar o 1 é treino de ouvido: tente de novo!', 'quase lá! mais uma partida e você pega.', 'muito bem! você já sente o 1.', 'show! você acha o 1 de olhos fechados.', 'perfeito! o 1 não escapa de você.'];

export function mount(host) {
  const root = h('div', { class: 'jg vv vv-achar1' }); host.replaceChildren(root);
  let gone = false; let estado = 'menu'; let run = null;
  const cfg = () => { const s = getGame('achar1'); return { nivel: nivelDe(s.nivel).id }; };
  const stop = () => { if (run) { try { run.stop(); } catch { /* ok */ } run = null; } };
  const muda = (patch) => { setGame('achar1', patch); menu(); };

  /* ---------- menu ---------- */
  function menu() {
    stop(); musicaVolta(); estado = 'menu'; const c = cfg(); const best = getGame('achar1').best || {};
    root.replaceChildren(
      h('div', { class: 'vv-ops' }, chips('nível', NIVEIS_ACHAR1.map((n) => [n.id, n.nome]), c.nivel, (v) => muda({ nivel: v }))),
      h('b', { class: 'vv-quem' }, best[c.nivel] != null ? `seu melhor aqui: ${best[c.nivel]} de ${RODADAS}` : 'o Paul começa a tocar sem avisar'),
      h('p', { class: 'vv-msg' }, 'o groove entra no meio do compasso e ninguém conta. ouça, sinta onde o ciclo recomeça e toque no 1.'),
      h('button', { type: 'button', class: 'vv-go', onclick: () => jogo(c.nivel) }, '▶ jogar'));
  }

  /* ---------- partida ---------- */
  function jogo(nivelId) {
    let rodada = 0; let pontos = 0; let ultimo = null; let q = null; let toques = []; let startT = 0; let comMarca = false;
    const nv = nivelDe(nivelId); const lista = pool(nv.lv);
    const topo = h('b', { class: 'vv-quem' }); const msg = h('p', { class: 'vv-msg', role: 'status', 'aria-live': 'polite' });
    const barra = h('div', { class: 'a1-tempo', 'aria-hidden': 'true' }, h('i', {}));
    const pad = h('button', { type: 'button', class: 'vv-padzao a1-pad bmr', 'aria-label': 'toque no 1' }, '1');
    const res = h('div', { class: 'a1-res' });
    const placar = () => { topo.textContent = `rodada ${Math.min(rodada + 1, RODADAS)} de ${RODADAS} · pontos ${pontos}`; };
    root.replaceChildren(topo, barra, msg, pad, res); placar();

    const toca = async (marcado) => {
      stop(); toques = []; comMarca = marcado; if (marcado) { const b = res.querySelector('.a1-botoes'); if (b) b.remove(); } else res.replaceChildren(); estado = 'play'; pad.disabled = marcado; pad.hidden = false;
      let beat; try { beat = await import('../views/beatlab.js'); } catch { beat = null; } if (gone || estado !== 'play') return;
      const VOICE = beat && beat.VOICE; const velOf = beat && beat.velOf; if (!VOICE) { msg.textContent = 'não consegui carregar o som da bateria.'; return; }
      audio(); const { g, offset, bpm } = q; const passo = 60 / bpm / (g.steps / 4); const total = COMPASSOS * g.steps;
      msg.textContent = marcado ? 'o 1 aparece com um clique e uma piscada' : 'toque no 1 sempre que sentir!';
      barra.style.setProperty('--dur', `${COMPASSOS * passo * g.steps}s`); barra.classList.remove('vai'); void barra.offsetWidth; barra.classList.add('vai');
      run = scheduler((i) => {
        if (i >= total) return null; const s = (i + offset) % g.steps;
        return { at: i * passo, play: (t) => { if (i === 0) startT = t; B.hitsAt(g, s).forEach((r) => VOICE[r](t, velOf(g, s))); if (marcado && s === 0) click(t, 2, 0.9); },
          ui: () => { if (marcado && s === 0) piscar(); } };
      }, { onEnd: () => { run = null; if (marcado) { estado = 'rodada'; pad.disabled = false; msg.textContent = 'viu? o 1 é onde o ciclo recomeça.'; botoes(true); } else fimRodada(); } });
    };

    const piscar = () => { pad.classList.remove('um'); void pad.offsetWidth; pad.classList.add('um'); };

    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault(); if (estado !== 'play' || comMarca || !run) return; toques.push(perfToCtx(e.timeStamp) - startT);
      pad.classList.add('hit'); setTimeout(() => pad.classList.remove('hit'), 90);
    });

    function regua(r) {
      const x = (t) => `${Math.max(0, Math.min(100, (t / r.total) * 100))}%`;
      return h('div', { class: 'a1-regua', role: 'img', 'aria-label': `os 1 estavam nos segundos ${r.uns.map((t) => t.toFixed(1)).join(', ')}; você tocou ${r.toques.length} vez(es), ${r.hits} no 1` },
        ...r.uns.map((t) => h('span', { class: 'a1-um', style: { left: x(t) } }, h('b', {}, '1'))),
        ...r.toques.map((p) => h('i', { class: `a1-toque bmr${p.ok ? ' ok' : ' bad'}`, style: { left: x(Math.max(0, p.t)) } })));
    }

    function botoes(depoisDaMarca) {
      const ultima = rodada >= RODADAS;
      const velho = res.querySelector('.a1-botoes'); if (velho) velho.remove();
      res.append(h('div', { class: 'vv-linha a1-botoes' },
        depoisDaMarca ? null : h('button', { type: 'button', class: 'vv-chip', onclick: () => toca(true) }, 'ouvir com o 1 marcado'),
        h('button', { type: 'button', class: 'vv-go', onclick: () => (ultima ? fimPartida() : proxima()) }, ultima ? 'ver resultado' : 'próxima ›')));
    }

    function fimRodada() {
      estado = 'rodada'; const r = julgaRodada(toques, q); if (r.acertou) pontos++; placar(); rodada++;
      barra.classList.remove('vai'); pad.hidden = true;
      msg.textContent = fraseRodada(r);
      const ond = onde(); res.replaceChildren(h('div', { class: `a1-veredito ${r.acertou ? 'ok' : 'bad'}` }, r.acertou ? '✓ achou o 1' : '✗ não foi dessa vez'),
        regua(r), h('small', { class: 'vv-leg' }, `número vermelho = onde o 1 estava · bolinha verde = você acertou · bolinha vermelha = fora${r.avg != null ? ` · média ${r.avg > 0 ? '+' : ''}${r.avg} ms` : ''}`),
        h('small', { class: 'vv-leg' }, `${q.g.name} a ${q.bpm} BPM, o groove entrou ${ond}.`));
      botoes(false);
    }
    const onde = () => { const per = q.g.steps / 4; const beat = Math.floor(q.offset / per) + 1; const sub = q.offset % per; return sub === 0 ? `no tempo ${beat}` : `no "${['', 'e', '&', 'a'][per === 4 ? sub : sub * 2]}" do ${beat}`; };

    function proxima() { q = sorteiaRodada(nivelId, lista, { ultimo }); ultimo = q.g.id || q.g.name; placar(); toca(false); }

    function fimPartida() {
      stop(); estado = 'fim'; const n = estrelasAchar1(pontos); const best = { ...(getGame('achar1').best || {}) }; if (pontos > (best[nivelId] ?? -1)) best[nivelId] = pontos; setGame('achar1', { best });
      premiar('achar1', n, `a1:${nivelId}`); musicaVolta();
      root.replaceChildren(quadro(`${pontos} de ${RODADAS}`, n, FRASE_FIM[Math.min(5, Math.max(0, pontos))]),
        h('div', { class: 'vv-linha a1-botoes' }, h('button', { type: 'button', class: 'vv-go', onclick: () => jogo(nivelId) }, '↻ jogar de novo'), h('button', { type: 'button', class: 'vv-chip', onclick: menu }, 'mudar nível')));
    }

    window.__achar1 = { rodada: () => q, inicio: () => startT, agora: () => audio().currentTime }; // só pra teste
    musicaPausa(); proxima();
  }

  menu();
  return {
    inProgress: () => estado === 'play' || estado === 'rodada',
    pause: () => { if (estado === 'play') { try { silence(); } catch { /* sem áudio */ } stop(); menu(); } },
    restart: () => { if (!gone) { try { silence(); } catch { /* sem áudio */ } menu(); } },
    destroy() { gone = true; delete window.__achar1; stop(); try { silence(); } catch { /* sem áudio */ } musicaVolta(); },
  };
}
