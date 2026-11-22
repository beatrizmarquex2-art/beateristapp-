// Motor dos jogos de ouvido (3ª e 5ª, que acorde é, maior ou menor): o Paul toca, a pessoa escolhe a resposta.
// Cada jogo entrega: rodadas, como tocar uma rodada, as opções e a resposta certa. Visual da família "vv" (Copia Aí).
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { audio, silence } from '../audio.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { tocaNota, somErro, chips, premiar, quadro } from './vivo-ui.js';
import { estrelasAcertos, RODADAS } from './ouvido-logic.js';

/** Toca uma lista de notas (MIDI): `junto` = acorde (com um leve arrastar), senão uma depois da outra. Devolve a duração em ms. */
export function toca(midis, { junto = false, passo = 0.8, dur = 0.8, vol = 0.5 } = {}) {
  const t0 = audio().currentTime + 0.05;
  midis.forEach((m, i) => tocaNota(m, t0 + (junto ? i * 0.045 : i * passo), junto ? 1.5 : dur, junto ? vol * 0.7 : vol));
  return junto ? 1600 : (midis.length - 1) * passo * 1000 + dur * 1000;
}

/**
 * def = { id, titulo, intro, padrao: {...}, ops(cfg, muda) -> [linhas de chips], chave(cfg), gera(cfg) -> rodadas,
 *         ouvir(r, cfg) -> ms, opcoes(r, cfg) -> [[valor, texto]], certa(r) -> valor, explica(r, cfg) -> texto, pergunta(cfg) -> texto }
 */
export function montaQuiz(host, def) {
  const root = h('div', { class: `jg vv vv-ouvido vv-${def.id}` }); host.replaceChildren(root);
  let gone = false; let timers = []; let estado = 'menu';
  const depois = (fn, ms) => { timers.push(setTimeout(() => { if (!gone) fn(); }, ms)); };
  const limpa = () => { timers.forEach(clearTimeout); timers = []; delete window.__ouvido; };
  const cfg = () => { const s = getGame(def.id); return { ...def.padrao, ...Object.fromEntries(Object.keys(def.padrao).filter((k) => s[k] !== undefined).map((k) => [k, s[k]])) }; };
  const muda = (patch) => { setGame(def.id, patch); tela(); };

  function tela() {
    limpa(); musicaVolta(); estado = 'menu'; const c = cfg(); const chave = def.chave(c); const melhor = (getGame(def.id).best || {})[chave] || 0;
    const msg = h('p', { class: 'vv-msg', role: 'status', 'aria-live': 'polite' }, def.intro);
    const placarEl = h('div', { class: 'vv-placar' }, h('span', { class: 'vv-rod' }), h('span', { class: 'vv-vidas' }), h('span', { class: 'vv-best' }, melhor ? `recorde: ${melhor} de ${RODADAS}` : ''));
    const opcEl = h('div', { class: 'vv-opcoes', role: 'group', 'aria-label': 'respostas' });
    const res = h('div', { class: 'vv-fim' }); const go = h('button', { type: 'button', class: 'vv-go' }, '▶ jogar');
    const de = h('button', { type: 'button', class: 'vv-chip vv-de', hidden: true }, '🔊 ouvir de novo');
    const ops = h('div', { class: 'vv-ops' }, ...def.ops(c, muda));
    root.replaceChildren(ops, placarEl, msg, de, opcEl, go, res);
    let rodadas = []; let i = 0; let certas = 0; let travado = true;
    const placar = () => { placarEl.firstChild.textContent = estado === 'menu' ? '' : `${Math.min(i + 1, rodadas.length)} de ${rodadas.length}`; placarEl.children[1].textContent = estado === 'menu' ? '' : `certas: ${certas}`; };
    const ouvir = () => { if (estado !== 'jogo' || !rodadas[i]) return; musicaPausa(); const ms = def.ouvir(rodadas[i], c); travado = true; depois(() => { travado = false; }, Math.min(ms, 900)); };
    const rodada = () => {
      const r = rodadas[i]; estado = 'jogo'; placar(); msg.textContent = def.pergunta(c, r); de.hidden = false; travado = true;
      opcEl.replaceChildren(...def.opcoes(r, c).map(([v, txt]) => h('button', { type: 'button', class: 'vv-opcao', 'data-v': String(v), onclick: (e) => responde(v, e.currentTarget) }, txt)));
      depois(ouvir, 350);
    };
    function responde(v, el) {
      if (estado !== 'jogo' || travado) return; const r = rodadas[i]; const ok = String(v) === String(def.certa(r)); estado = 'pausa'; travado = true;
      opcEl.querySelectorAll('.vv-opcao').forEach((b) => { b.disabled = true; if (b.dataset.v === String(def.certa(r))) b.classList.add('ok'); });
      if (ok) { certas++; msg.textContent = 'isso! 🤘'; } else { somErro(); const mau = el || opcEl.querySelector(`[data-v="${v}"]`); if (mau) mau.classList.add('bad'); msg.textContent = def.explica(r, c); }
      placar(); i++;
      if (i >= rodadas.length) depois(fim, ok ? 900 : 2200); else depois(rodada, ok ? 900 : 2200);
    }
    function fim() {
      estado = 'fim'; de.hidden = true; opcEl.replaceChildren(); musicaVolta();
      const est = estrelasAcertos(certas, rodadas.length); const best = { ...(getGame(def.id).best || {}) }; if (certas > (best[chave] || 0)) best[chave] = certas; setGame(def.id, { best });
      premiar(def.id, est, `${def.id}:${chave}`);
      res.replaceChildren(quadro(`${certas} de ${rodadas.length}`, est, certas === rodadas.length ? 'ouvido de ouro!' : certas >= rodadas.length * 0.6 ? 'boa! seu ouvido tá afinando.' : 'bora de novo: ouve com calma.', h('small', {}, 'todas certas = 3 ★ · 80% = 2 ★ · 60% = 1 ★')));
      msg.textContent = ''; go.textContent = '↻ jogar de novo'; go.hidden = false; ops.hidden = false; placarEl.hidden = true; try { res.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch { /* sem rolagem */ }
    }
    go.addEventListener('click', () => { go.hidden = true; res.replaceChildren(); ops.hidden = true; placarEl.hidden = false; rodadas = def.gera(c); i = 0; certas = 0; rodada(); });
    de.addEventListener('click', () => { if (estado === 'jogo') ouvir(); });
    window.__ouvido = { jogo: def.id, responde: (v) => { travado = false; responde(v); }, get rodada() { return rodadas[i]; }, get certa() { return rodadas[i] ? def.certa(rodadas[i]) : null; }, get estado() { return estado; } }; // só pra teste
  }
  tela();
  return {
    inProgress: () => estado === 'jogo' || estado === 'pausa',
    pause: () => { if (estado === 'jogo' || estado === 'pausa') { try { silence(); } catch { /* sem áudio */ } tela(); } },
    restart: () => { if (!gone) tela(); },
    destroy() { gone = true; limpa(); musicaVolta(); try { silence(); } catch { /* sem áudio */ } },
  };
}
export { chips };
