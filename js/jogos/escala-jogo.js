// Escalas: o app mostra a escala (colorida: cada nota tem a sua cor) e a pessoa toca as notas em sequência, na tela (teclado) ou no instrumento (microfone).
// Cada nota certa acende e vai pra próxima; errou, o app mostra qual era. Fases no ouvido-mundo.js; aqui mora a fase e o modo livre.
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { silence } from '../audio.js';
import { toast } from '../ui.js';
import { micToast } from '../mic-access.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { faixa } from './vivo-logic.js';
import { tocaNota, somErro, chips, teclado, ouvirNotas, quadro } from './vivo-ui.js';
import { linhaRolar } from './ouvido-ui.js';
import { ESCALAS, achaEscala, escalaNotas, temPreta, confere, estrelasEscala, nomeEm, corNota } from './ouvido-logic.js';

const TONICAS = ['dó', 'dó#', 'ré', 'ré#', 'mi', 'fá', 'fá#', 'sol', 'sol#', 'lá', 'lá#', 'si'];
const nomeTom = (pc, tipo) => nomeEm(pc, pc, tipo);

/** Uma escala. `f` = { pc, tipo, descer }. `fim({ est, erros })` quando acaba (se vier). `livre` = sem estrelas: mostra o próprio resultado. */
export function jogaEscala(host, f, fim, { livre = false } = {}) {
  const root = h('div', { class: 'jg vv vv-escala vv-colorido' }); host.replaceChildren(root);
  let gone = false; let mic = null; let estado = 'menu'; let timers = [];
  const depois = (fn, ms) => { timers.push(setTimeout(() => { if (!gone) fn(); }, ms)); };
  const para = () => { timers.forEach(clearTimeout); timers = []; if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } };
  const alvo = escalaNotas(f.pc, f.tipo, f.descer); const esc = achaEscala(f.tipo); const usaMic = getGame('escala').entrada === 'mic'; const pretas = temPreta(alvo) && !usaMic;
  const nome = (m) => nomeEm(m, f.pc, f.tipo);
  const kb = teclado({ notas: faixa(Math.min(...alvo), Math.max(...alvo)), nomes: true, pretas, onNota: (m) => { tocaNota(m); nota(m); } });
  kb.el.querySelectorAll('[data-midi]').forEach((b) => { const m = Number(b.dataset.midi); b.style.setProperty('--nc', corNota(m)); if (!alvo.includes(m)) b.classList.add('apagada'); }); // teclas que não são da escala ficam apagadas
  kb.el.querySelectorAll('.vv-tecla span').forEach((s) => { s.textContent = nome(Number(s.parentNode.dataset.midi)); });
  const seq = h('p', { class: 'vv-seq', 'aria-live': 'polite' }, ...alvo.map((m) => h('i', { class: 'vv-n', style: `--nc:${corNota(m)}` }, nome(m))));
  const spans = [...seq.children]; const msg = h('p', { class: 'vv-msg', role: 'status', 'aria-live': 'polite' }, `escala de ${nomeTom(f.pc, f.tipo)} ${esc.nome}${f.descer ? ', subindo e descendo' : ''}: toque as notas em ordem.`);
  const placarEl = h('div', { class: 'vv-placar' }, h('span', { class: 'vv-rod' }), h('span', { class: 'vv-vidas' }));
  const res = h('div', { class: 'vv-fim' }); const go = h('button', { type: 'button', class: 'vv-go' }, '▶ começar');
  const como = h('div', { class: 'vv-ops' }, chips('como tocar', [[false, 'na tela'], [true, 'no instrumento']], usaMic, (v) => { setGame('escala', { entrada: v ? 'mic' : 'tela' }); jogaEscala(host, f, fim, { livre }); }));
  root.replaceChildren(como, placarEl, seq, msg, h('div', { class: 'vv-kbwrap' }, kb.el), usaMic ? h('p', { class: 'vv-mic' }, h('b', {}, 'microfone'), ' toque no violão, na guitarra, no teclado ou na flauta, uma nota por vez. vale a nota em qualquer oitava.') : null, go, res);
  kb.trava(true);
  let pos = 0; let erros = 0;
  const placar = () => { placarEl.firstChild.textContent = estado === 'menu' ? '' : `${pos} de ${alvo.length} notas`; placarEl.children[1].textContent = estado === 'menu' ? '' : `erros: ${erros}`; };
  const marca = () => { spans.forEach((s, k) => s.classList.toggle('vez', k === pos)); };
  const acabou = () => {
    estado = 'fim'; kb.trava(true); para(); musicaVolta(); const est = estrelasEscala(erros, true);
    if (!livre) { fim({ est, erros }); return; }
    res.replaceChildren(quadro(erros ? `${erros} ${erros === 1 ? 'erro' : 'erros'}` : 'sem erros!', est, erros === 0 ? 'escala perfeita! 🤘' : 'concluiu a escala! tenta de novo sem errar.', h('small', {}, 'modo livre: sem estrelas')));
    msg.textContent = ''; go.textContent = '↻ de novo'; go.hidden = false; como.hidden = false; try { res.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch { /* sem rolagem */ }
  };
  function nota(m) {
    if (estado !== 'jogo') return; const certa = alvo[pos]; const ok = confere(m, certa, usaMic);
    if (usaMic) kb.acende(m, ok ? 'ok' : 'bad', 300);
    if (ok) { if (!usaMic) kb.acende(m, 'ok', 240); spans[pos].classList.remove('vez'); spans[pos].classList.add('ok'); pos++; msg.textContent = ''; placar(); if (pos >= alvo.length) { estado = 'pausa'; depois(acabou, 500); return; } marca(); return; }
    somErro(); erros++; spans[pos].classList.add('bad'); depois(() => spans[pos] && spans[pos].classList.remove('bad'), 500); kb.acende(certa, 'certa', 700); msg.textContent = `essa não é da escala agora: a próxima é ${nome(certa)}.`; placar();
  }
  async function comeca() {
    go.hidden = true; res.replaceChildren(); musicaPausa(); como.hidden = true; spans.forEach((s) => s.classList.remove('ok', 'bad', 'vez'));
    if (usaMic) { msg.textContent = 'abrindo o microfone…'; try { mic = await ouvirNotas((m) => nota(m)); } catch (e) { if (gone) return; toast(`${micToast(e)} vou usar a tela`); setGame('escala', { entrada: 'tela' }); jogaEscala(host, f, fim, { livre }); return; } if (gone || estado !== 'menu') { if (mic) { mic.stop(); mic = null; } return; } }
    pos = 0; erros = 0; estado = 'jogo'; kb.trava(usaMic); marca(); placar(); msg.textContent = usaMic ? `toque ${nome(alvo[0])} no instrumento` : `comece em ${nome(alvo[0])}`; kb.acende(alvo[0], 'certa', 900);
  }
  go.addEventListener('click', comeca);
  window.__escala = { nota, get alvo() { return alvo.slice(); }, get estado() { return estado; }, get erros() { return erros; } }; // só pra teste
  return { destroy() { gone = true; para(); musicaVolta(); try { silence(); } catch { /* sem áudio */ } delete window.__escala; } };
}

/** Modo livre: escolhe escala, tônica e percurso (fileiras que arrastam pro lado, com setinhas) e toca à vontade, sem estrelas. */
export function escalaLivre(host) {
  let ativo = null; const root = h('div', { class: 'vv-livre' }); host.replaceChildren(root);
  const cfg = () => { const s = getGame('escala').livre || {}; return { tipo: ESCALAS.some((e) => e.id === s.tipo) ? s.tipo : 'maior', pc: Number.isInteger(s.pc) && s.pc >= 0 && s.pc < 12 ? s.pc : 0, descer: s.descer === true }; };
  const muda = (patch) => { setGame('escala', { livre: { ...(getGame('escala').livre || {}), ...patch } }); tela(); };
  function tela() {
    if (ativo) { ativo.destroy(); ativo = null; } const c = cfg(); const jogo = h('div', {});
    root.replaceChildren(h('div', { class: 'vv-ops' },
      linhaRolar('escala', ESCALAS.map((e) => [e.id, e.nome]), c.tipo, (v) => muda({ tipo: v })),
      linhaRolar('começa em', TONICAS.map((t, pc) => [pc, t]), c.pc, (v) => muda({ pc: v })),
      linhaRolar('percurso', [[false, 'só subir'], [true, 'subir e descer']], c.descer, (v) => muda({ descer: v }))), jogo);
    ativo = jogaEscala(jogo, { pc: c.pc, tipo: c.tipo, descer: c.descer }, () => {}, { livre: true });
  }
  tela();
  return { destroy() { if (ativo) ativo.destroy(); } };
}
