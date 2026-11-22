// Escalas: o app mostra a escala e a pessoa toca as notas em sequência, na tela (teclado) ou no instrumento (microfone).
// Cada nota certa acende e vai pra próxima; errou, o app mostra qual era. Subir, ou subir e descer.
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { silence } from '../audio.js';
import { toast } from '../ui.js';
import { micToast } from '../mic-access.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { nomeNota, faixa } from './vivo-logic.js';
import { tocaNota, somErro, chips, teclado, ouvirNotas, premiar, quadro } from './vivo-ui.js';
import { ESCALAS, achaEscala, escalaNotas, tonicasBrancas, confere, estrelasEscala } from './ouvido-logic.js';

const TONICAS = ['dó', 'dó#', 'ré', 'ré#', 'mi', 'fá', 'fá#', 'sol', 'sol#', 'lá', 'lá#', 'si'];

export function mount(host) {
  const root = h('div', { class: 'jg vv vv-escala' }); host.replaceChildren(root);
  let gone = false; let mic = null; let estado = 'menu'; let timers = [];
  const depois = (fn, ms) => { timers.push(setTimeout(() => { if (!gone) fn(); }, ms)); };
  const limpa = () => { timers.forEach(clearTimeout); timers = []; if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } delete window.__escala; };
  const cfg = () => {
    const s = getGame('escala'); const tipo = ESCALAS.some((e) => e.id === s.tipo) ? s.tipo : 'maior'; const mic_ = s.entrada === 'mic';
    const lista = mic_ ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : tonicasBrancas(tipo); // na tela só as escalas de teclas brancas
    const pc = lista.includes(s.pc) ? s.pc : lista[0];
    return { tipo, pc, lista, mic: mic_, descer: s.descer === true };
  };
  const muda = (patch) => { setGame('escala', patch); tela(); };

  function tela() {
    limpa(); musicaVolta(); estado = 'menu'; const c = cfg(); const alvo = escalaNotas(c.pc, c.tipo, c.descer); const esc = achaEscala(c.tipo);
    const chave = `${c.pc}:${c.tipo}:${c.descer ? 'sd' : 's'}`; const melhor = (getGame('escala').best || {})[chave] || 0;
    const kb = teclado({ notas: faixa(Math.min(...alvo), Math.max(...alvo)), nomes: true, onNota: (m) => { tocaNota(m); nota(m); } });
    const seq = h('p', { class: 'vv-seq', 'aria-live': 'polite' }, ...alvo.map((m) => h('i', { class: 'vv-n' }, nomeNota(m))));
    const spans = [...seq.children]; const msg = h('p', { class: 'vv-msg', role: 'status', 'aria-live': 'polite' }, `escala de ${TONICAS[c.pc]} ${esc.nome}: toque as notas em ordem.`);
    const placarEl = h('div', { class: 'vv-placar' }, h('span', { class: 'vv-rod' }), h('span', { class: 'vv-vidas' }), h('span', { class: 'vv-best' }, melhor ? `recorde: ${melhor === 3 ? '3 ★' : melhor === 2 ? '2 ★' : '1 ★'}` : ''));
    const res = h('div', { class: 'vv-fim' }); const go = h('button', { type: 'button', class: 'vv-go' }, '▶ começar');
    const ops = h('div', { class: 'vv-ops' },
      chips('escala', ESCALAS.map((e) => [e.id, e.nome]), c.tipo, (v) => muda({ tipo: v })),
      chips('começa em', c.lista.map((pc) => [pc, TONICAS[pc]]), c.pc, (v) => muda({ pc: v })),
      chips('percurso', [[false, 'só subir'], [true, 'subir e descer']], c.descer, (v) => muda({ descer: v })),
      chips('como tocar', [[false, 'na tela'], [true, 'no instrumento']], c.mic, (v) => muda({ entrada: v ? 'mic' : 'tela', pc: undefined })));
    root.replaceChildren(ops, placarEl, seq, msg, h('div', { class: 'vv-kbwrap' }, kb.el), c.mic ? h('p', { class: 'vv-mic' }, h('b', {}, 'microfone'), ' toque no violão, na guitarra, no teclado ou na flauta, uma nota por vez. vale a nota em qualquer oitava.') : null, go, res);
    kb.trava(true);
    let pos = 0; let erros = 0;
    const placar = () => { placarEl.firstChild.textContent = estado === 'menu' ? '' : `${pos} de ${alvo.length} notas`; placarEl.children[1].textContent = estado === 'menu' ? '' : `erros: ${erros}`; };
    const marca = () => { spans.forEach((s, k) => s.classList.toggle('vez', k === pos)); };
    const fim = () => {
      estado = 'fim'; kb.trava(true); if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } musicaVolta();
      const est = estrelasEscala(erros, true); const best = { ...(getGame('escala').best || {}) }; if (est > (best[chave] || 0)) best[chave] = est; setGame('escala', { best }); premiar('escala', est, `escala:${chave}`);
      res.replaceChildren(quadro(erros ? `${erros} ${erros === 1 ? 'erro' : 'erros'}` : 'sem erros!', est, erros === 0 ? 'escala perfeita! 🤘' : 'concluiu a escala! tenta de novo sem errar.', h('small', {}, 'sem erros = 3 ★ · até 2 erros = 2 ★ · concluir = 1 ★')));
      msg.textContent = ''; go.textContent = '↻ de novo'; go.hidden = false; ops.hidden = false; try { res.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch { /* sem rolagem */ }
    };
    function nota(m) {
      if (estado !== 'jogo') return; const certa = alvo[pos]; const ok = confere(m, certa, c.mic);
      if (c.mic) kb.acende(m, ok ? 'ok' : 'bad', 300);
      if (ok) { if (!c.mic) kb.acende(m, 'ok', 240); spans[pos].classList.remove('vez'); spans[pos].classList.add('ok'); pos++; msg.textContent = ''; placar(); if (pos >= alvo.length) { estado = 'pausa'; depois(fim, 500); return; } marca(); return; }
      somErro(); erros++; spans[pos].classList.add('bad'); depois(() => spans[pos] && spans[pos].classList.remove('bad'), 500); kb.acende(certa, 'certa', 700); msg.textContent = `essa não é da escala agora: a próxima é ${nomeNota(certa)}.`; placar();
    }
    async function comeca() {
      go.hidden = true; res.replaceChildren(); musicaPausa(); ops.hidden = true; spans.forEach((s) => s.classList.remove('ok', 'bad', 'vez'));
      if (c.mic) { msg.textContent = 'abrindo o microfone…'; try { mic = await ouvirNotas((m) => nota(m)); } catch (e) { if (gone) return; toast(`${micToast(e)} vou usar a tela`); setGame('escala', { entrada: 'tela', pc: undefined }); tela(); return; } if (gone || estado !== 'menu') { if (mic) { mic.stop(); mic = null; } return; } }
      pos = 0; erros = 0; estado = 'jogo'; kb.trava(c.mic); marca(); placar(); msg.textContent = c.mic ? `toque ${nomeNota(alvo[0])} no instrumento` : `comece em ${nomeNota(alvo[0])}`; kb.acende(alvo[0], 'certa', 900);
    }
    go.addEventListener('click', comeca);
    window.__escala = { nota, get alvo() { return alvo.slice(); }, get estado() { return estado; }, get erros() { return erros; } }; // só pra teste
  }
  tela();
  return {
    inProgress: () => estado === 'jogo' || estado === 'pausa',
    pause: () => { if (estado === 'jogo' || estado === 'pausa') { try { silence(); } catch { /* sem áudio */ } tela(); } },
    restart: () => { if (!gone) tela(); },
    destroy() { gone = true; limpa(); musicaVolta(); },
  };
}
