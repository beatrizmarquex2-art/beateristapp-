// pauLta ao Vivo: a nota aparece na pauta (clave de sol) e o aluno responde TOCANDO: no teclado da tela ou no instrumento de verdade (microfone).
// 10 notas por rodada. Vale ponto a nota acertada de primeira; 60% = 1 ★, 80% = 2 ★, 100% = 3 ★.
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { toast } from '../ui.js';
import { micToast } from '../mic-access.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { clefStaff } from '../paulta/draw.js';
import { NIVEIS_PAUTA, NOTAS_RODADA, rodadaPauta, diatonica, nomeNota, mesmaNota, estrelasPct } from './vivo-logic.js';
import { tocaNota, somErro, chips, teclado, ouvirNotas, premiar, quadro, estrelasTxt } from './vivo-ui.js';

export function mount(host) {
  const root = h('div', { class: 'jg vv vv-pv' }); host.replaceChildren(root);
  let gone = false; let mic = null; let timers = []; let estado = 'menu'; let parar = () => {};
  const depois = (fn, ms) => { timers.push(setTimeout(() => { if (!gone) fn(); }, ms)); };
  const limpa = () => { timers.forEach(clearTimeout); timers = []; if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } delete window.__vivo; };
  const cfg = () => { const s = getGame('paultavivo'); return { nivel: NIVEIS_PAUTA.some((n) => n.id === s.nivel) ? s.nivel : 'p3', nomes: s.nomes !== false, mic: s.entrada === 'mic' }; };
  const muda = (patch) => { setGame('paultavivo', patch); tela(); };

  function tela() {
    limpa(); musicaVolta(); estado = 'menu'; const c = cfg(); const nivel = NIVEIS_PAUTA.find((n) => n.id === c.nivel); const best = getGame('paultavivo').best || {};
    const pauta = h('div', { class: 'vv-pauta', 'aria-live': 'polite' }); const msg = h('p', { class: 'vv-msg', role: 'status', 'aria-live': 'polite' }, 'leia a nota na pauta e toque ela.');
    const conta = h('span', { class: 'vv-rod' }); const res = h('div', { class: 'vv-fim' }); const go = h('button', { type: 'button', class: 'vv-go' }, '▶ jogar');
    let seq = []; let i = 0; let primeira = 0; let tentativas = 0;
    const kb = teclado({ notas: nivel.notas, nomes: c.nomes, onNota: (m) => { tocaNota(m); nota(m); } });
    const ops = h('div', { class: 'vv-ops' },
      chips('notas', NIVEIS_PAUTA.map((n) => [n.id, `${n.nome}${best[n.id] != null ? ` ${estrelasTxt(estrelasPct(best[n.id]))}` : ''}`]), c.nivel, (v) => muda({ nivel: v })),
      chips('nomes nas teclas', [[true, 'sim'], [false, 'não']], c.nomes, (v) => muda({ nomes: v })),
      chips('como tocar', [[false, 'na tela'], [true, 'no instrumento']], c.mic, (v) => muda({ entrada: v ? 'mic' : 'tela' })));
    const desenha = (m) => { pauta.innerHTML = clefStaff('sol', diatonica(m)); };
    pauta.innerHTML = clefStaff('sol', []);
    root.replaceChildren(ops, h('div', { class: 'vv-placar' }, conta), pauta, msg, h('div', { class: 'vv-kbwrap' }, kb.el), c.mic ? h('p', { class: 'vv-mic' }, h('b', {}, 'microfone'), ' toque a nota no violão, na guitarra ou no teclado. vale em qualquer oitava.') : null, go, res);
    kb.trava(true);

    const proxima = () => { if (i >= seq.length) return fim(); tentativas = 0; estado = 'vez'; desenha(seq[i]); conta.textContent = `nota ${i + 1} de ${seq.length}`; msg.textContent = c.mic ? 'toque essa nota no instrumento' : 'que nota é essa? toque no teclado'; kb.trava(c.mic); };
    const fim = () => {
      estado = 'fim'; kb.trava(true); if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } musicaVolta();
      const pct = Math.round((primeira / seq.length) * 100); const est = estrelasPct(pct); const b = { ...(getGame('paultavivo').best || {}) }; if (pct > (b[nivel.id] ?? -1)) b[nivel.id] = pct; setGame('paultavivo', { best: b });
      premiar('paultavivo', est, `pv:${nivel.id}`); conta.textContent = ''; pauta.innerHTML = clefStaff('sol', []);
      res.replaceChildren(quadro(`${pct}%`, est, `${primeira} de ${seq.length} notas de primeira`, h('small', {}, '60% = 1 ★ · 80% = 2 ★ · 100% = 3 ★')));
      go.textContent = '↻ jogar de novo'; go.hidden = false; msg.textContent = est ? 'muito bom!' : 'bora de novo: dó fica na linha de baixo, fora da pauta.';
    };
    function nota(m) {
      if (estado !== 'vez') return; const certa = seq[i]; const ok = c.mic ? mesmaNota(m, certa) : m === certa;
      if (ok) { kb.acende(certa, 'ok', 380); if (!tentativas) primeira++; msg.textContent = `isso: ${nomeNota(certa)}!`; i++; estado = 'pausa'; depois(proxima, 520); return; }
      tentativas++; somErro(); kb.acende(m, 'bad', 380);
      if (tentativas >= 2) { kb.acende(certa, 'certa', 900); msg.textContent = `essa é ${nomeNota(certa)}. toque ela.`; } else msg.textContent = `você tocou ${nomeNota(m)}. tenta de novo.`;
    }
    async function comeca() {
      go.hidden = true; res.replaceChildren(); musicaPausa(); ops.hidden = true;
      if (c.mic) { msg.textContent = 'abrindo o microfone…'; try { mic = await ouvirNotas((m) => nota(m)); } catch (e) { if (gone) return; toast(`${micToast(e)} vou usar a tela`); setGame('paultavivo', { entrada: 'tela' }); tela(); return; } if (gone || estado !== 'menu') { if (mic) { mic.stop(); mic = null; } return; } }
      seq = rodadaPauta(nivel.notas, NOTAS_RODADA); i = 0; primeira = 0; proxima();
    }
    go.addEventListener('click', comeca);
    parar = () => { if (estado === 'vez' || estado === 'pausa') tela(); };
    window.__vivo = { jogo: 'paultavivo', nota, get certa() { return seq[i]; }, get estado() { return estado; } }; // só pra teste
  }
  tela();
  return {
    inProgress: () => estado === 'vez' || estado === 'pausa',
    pause: () => parar(),
    restart: () => { if (!gone) tela(); },
    destroy() { gone = true; limpa(); musicaVolta(); },
  };
}
