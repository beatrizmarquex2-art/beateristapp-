// Uma fase dos jogos de ouvido (3ª ou 5ª, que acorde é, maior ou menor): o Paul toca, a pessoa escolhe a resposta.
// O jogo entrega: gera(fase) -> rodadas, ouvir, opções, resposta certa e explicação. Quem mostra mapa, estrelas e resultado é o ouvido-mundo.js.
import { h } from '../util.js';
import { silence } from '../audio.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { somErro } from './vivo-ui.js';
import { estrelasAcertos } from './ouvido-logic.js';

/** Joga uma fase. `def` = { id, gera(f), ouvir(r, f), opcoes(r, f), certa(r), explica(r, f), pergunta(r, f) }. `fim({ est, certas, total })` quando acaba. */
export function jogaQuiz(host, def, f, fim) {
  const root = h('div', { class: `jg vv vv-ouvido vv-${def.id}` }); host.replaceChildren(root);
  let gone = false; let timers = []; let estado = 'jogo'; let i = 0; let certas = 0; let travado = true; const rodadas = def.gera(f);
  const depois = (fn, ms) => { timers.push(setTimeout(() => { if (!gone) fn(); }, ms)); };
  const msg = h('p', { class: 'vv-msg', role: 'status', 'aria-live': 'polite' });
  const placarEl = h('div', { class: 'vv-placar' }, h('span', { class: 'vv-rod' }), h('span', { class: 'vv-vidas' }));
  const opcEl = h('div', { class: 'vv-opcoes', role: 'group', 'aria-label': 'respostas' });
  const de = h('button', { type: 'button', class: 'vv-chip vv-de' }, '🔊 ouvir de novo');
  root.replaceChildren(placarEl, msg, de, opcEl);
  const placar = () => { placarEl.firstChild.textContent = `${Math.min(i + 1, rodadas.length)} de ${rodadas.length}`; placarEl.children[1].textContent = `certas: ${certas}`; };
  const ouvir = () => { if (estado !== 'jogo' || !rodadas[i]) return; musicaPausa(); const ms = def.ouvir(rodadas[i], f); travado = true; depois(() => { travado = false; }, Math.min(ms, 1000)); };
  const rodada = () => {
    const r = rodadas[i]; estado = 'jogo'; placar(); msg.textContent = def.pergunta(r, f); travado = true;
    opcEl.replaceChildren(...def.opcoes(r, f).map(([v, txt]) => h('button', { type: 'button', class: 'vv-opcao', 'data-v': String(v), onclick: (e) => responde(v, e.currentTarget) }, txt)));
    depois(ouvir, 350);
  };
  function responde(v, el) {
    if (estado !== 'jogo' || travado) return; const r = rodadas[i]; const ok = String(v) === String(def.certa(r)); estado = 'pausa'; travado = true;
    opcEl.querySelectorAll('.vv-opcao').forEach((b) => { b.disabled = true; if (b.dataset.v === String(def.certa(r))) b.classList.add('ok'); });
    if (ok) { certas++; msg.textContent = 'isso! 🤘'; } else { somErro(); const mau = el || opcEl.querySelector(`[data-v="${v}"]`); if (mau) mau.classList.add('bad'); msg.textContent = def.explica(r, f); }
    placar(); i++;
    if (i >= rodadas.length) depois(acabou, ok ? 900 : 2300); else depois(rodada, ok ? 900 : 2300);
  }
  function acabou() { estado = 'fim'; musicaVolta(); fim({ est: estrelasAcertos(certas, rodadas.length), certas, total: rodadas.length }); }
  de.addEventListener('click', () => { if (estado === 'jogo') ouvir(); });
  window.__ouvido = { jogo: def.id, responde: (v) => { travado = false; responde(v); }, get rodada() { return rodadas[i]; }, get certa() { return rodadas[i] ? def.certa(rodadas[i]) : null; }, get estado() { return estado; } }; // só pra teste
  rodada();
  return { destroy() { gone = true; timers.forEach(clearTimeout); try { silence(); } catch { /* sem áudio */ } musicaVolta(); delete window.__ouvido; } };
}
