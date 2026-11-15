// Copia Aí: o Paul toca uma melodia curtinha e o aluno copia; a cada rodada a melodia cresce.
// Tipos: "sorteio" (notas sorteadas, +1 por rodada) e "música" (uma melodia de verdade que vai aparecendo aos poucos).
// Ajuda: "com nomes" (as notas ficam escritas: dó dó mi…) ou "de ouvido" (só o som). Tocar na tela (teclado) ou no instrumento de verdade (microfone).
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { silence } from '../audio.js';
import { toast } from '../ui.js';
import { micToast } from '../mic-access.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { NIVEIS_COPIA, MELODIAS, MAX_SORTEIO, VIDAS, sorteio, tamanhoRodada, estrelasCopia, nomeNota, mesmaNota } from './vivo-logic.js';
import { tocaNota, somErro, chips, teclado, ouvirNotas, premiar, quadro, estrelasTxt } from './vivo-ui.js';

const PASSO = 0.56; // s entre as notas do exemplo
const OITO = NIVEIS_COPIA[2].notas;

export function mount(host) {
  const root = h('div', { class: 'jg vv vv-copia' }); host.replaceChildren(root);
  let gone = false; let mic = null; let timers = []; let estado = 'menu'; let parar = () => {};
  const depois = (fn, ms) => { timers.push(setTimeout(() => { if (!gone) fn(); }, ms)); };
  const limpa = () => { timers.forEach(clearTimeout); timers = []; if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } delete window.__vivo; };
  const cfg = () => { const s = getGame('copia'); return { tipo: s.tipo === 'melodia' ? 'melodia' : 'sorteio', nivel: NIVEIS_COPIA.some((n) => n.id === s.nivel) ? s.nivel : 'n3', mel: MELODIAS.some((m) => m.id === s.mel) ? s.mel : MELODIAS[0].id, nomes: s.nomes !== false, mic: s.entrada === 'mic' }; };
  const muda = (patch) => { setGame('copia', patch); tela(); };

  function tela() {
    limpa(); musicaVolta(); estado = 'menu'; const c = cfg(); const melodia = MELODIAS.find((m) => m.id === c.mel); const nivel = NIVEIS_COPIA.find((n) => n.id === c.nivel);
    const chave = c.tipo === 'melodia' ? `m:${melodia.id}` : `s:${nivel.id}`; const melhor = (getGame('copia').best || {})[chave] || 0;
    const notasTeclado = c.tipo === 'melodia' ? OITO : nivel.notas;
    const seq = h('p', { class: 'vv-seq', 'aria-live': 'polite' }); const msg = h('p', { class: 'vv-msg', role: 'status', 'aria-live': 'polite' }, 'o Paul toca, você copia. cada rodada tem mais notas.');
    const vidasEl = h('span', { class: 'vv-vidas' }); const rodEl = h('span', { class: 'vv-rod' });
    const res = h('div', { class: 'vv-fim' }); const go = h('button', { type: 'button', class: 'vv-go' }, '▶ jogar');
    let alvo = []; let len = 0; let pos = 0; let rodada = 1; let vidas = VIDAS; let erros = 0; let feitas = 0; let spans = [];
    const kb = teclado({ notas: notasTeclado, nomes: true, onNota: (m) => { tocaNota(m); nota(m); } });
    const ops = h('div', { class: 'vv-ops' },
      chips('jogo', [['sorteio', 'sorteio'], ['melodia', 'música']], c.tipo, (v) => muda({ tipo: v })),
      c.tipo === 'melodia' ? chips('música', MELODIAS.map((m) => [m.id, m.nome]), c.mel, (v) => muda({ mel: v })) : chips('notas', NIVEIS_COPIA.map((n) => [n.id, n.nome]), c.nivel, (v) => muda({ nivel: v })),
      chips('ajuda', [[true, 'com nomes'], [false, 'de ouvido']], c.nomes, (v) => muda({ nomes: v })),
      chips('como tocar', [[false, 'na tela'], [true, 'no instrumento']], c.mic, (v) => muda({ entrada: v ? 'mic' : 'tela' })));
    const placar = h('div', { class: 'vv-placar' }, rodEl, vidasEl, h('span', { class: 'vv-best' }, melhor ? `recorde: ${melhor} notas` : ''));
    root.replaceChildren(ops, placar, seq, msg, h('div', { class: 'vv-kbwrap' }, kb.el), c.mic ? h('p', { class: 'vv-mic' }, h('b', {}, 'microfone'), ' toque no violão, na guitarra ou no teclado, uma nota por vez. vale a nota em qualquer oitava.') : null, go, res);

    const placarTxt = () => { rodEl.textContent = estado === 'menu' ? '' : `${len} de ${alvo.length} notas`; vidasEl.textContent = estado === 'menu' ? '' : `vidas: ${vidas}`; };
    const escreve = () => {
      spans = alvo.slice(0, len).map((m) => h('i', { class: 'vv-n' }, c.nomes ? nomeNota(m) : '•'));
      seq.replaceChildren(...spans); seq.setAttribute('aria-label', c.nomes ? `notas: ${alvo.slice(0, len).map(nomeNota).join(' ')}` : `${len} notas`);
    };
    const exemplo = () => {
      estado = 'paul'; kb.trava(true); if (mic) mic.surdo(true); pos = 0; escreve(); placarTxt(); msg.textContent = 'escuta o Paul…';
      alvo.slice(0, len).forEach((m, i) => depois(() => { tocaNota(m, 0, PASSO * 0.85); spans.forEach((s, k) => s.classList.toggle('now', k === i)); if (c.nomes) kb.acende(m, 'on', PASSO * 700); }, 350 + i * PASSO * 1000));
      depois(() => { spans.forEach((s) => s.classList.remove('now')); estado = 'vez'; kb.trava(c.mic); if (mic) mic.surdo(false); if (spans[0]) spans[0].classList.add('vez'); msg.textContent = c.mic ? 'sua vez: toque no instrumento' : 'sua vez!'; }, 350 + len * PASSO * 1000 + 200);
    };
    const fim = (ganhou) => {
      estado = 'fim'; kb.trava(true); if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } musicaVolta();
      const est = estrelasCopia(c.tipo, feitas, alvo.length, erros); const best = { ...(getGame('copia').best || {}) }; if (feitas > (best[chave] || 0)) best[chave] = feitas; setGame('copia', { best });
      premiar('copia', est, `copia:${chave}`);
      res.replaceChildren(quadro(`${feitas} notas`, est, ganhou ? (c.tipo === 'melodia' ? `você tocou ${melodia.nome} inteira!` : 'chegou ao fim: memória de ouro!') : feitas ? 'boa! na próxima vai mais longe.' : 'bora de novo: escuta com calma e canta as notas.',
        h('small', {}, c.tipo === 'melodia' ? 'metade da música = 1 ★ · inteira = 2 ★ · inteira sem errar = 3 ★' : '4 notas = 1 ★ · 6 = 2 ★ · 8 = 3 ★')));
      go.textContent = '↻ jogar de novo'; go.hidden = false; msg.textContent = ''; try { res.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch { /* sem rolagem */ }
    };
    function nota(m) {
      if (estado !== 'vez') return; const certa = alvo[pos]; const ok = c.mic ? mesmaNota(m, certa) : m === certa;
      if (c.mic) kb.acende(m, ok ? 'ok' : 'bad', 300);
      if (ok) {
        if (!c.mic) kb.acende(m, 'ok', 240); spans[pos].classList.remove('vez'); spans[pos].classList.add('ok'); if (!c.nomes) spans[pos].textContent = nomeNota(certa); pos++;
        if (pos < len) { spans[pos].classList.add('vez'); return; }
        feitas = len; estado = 'pausa';
        if (len >= alvo.length) { depois(() => fim(true), 500); return; }
        rodada++; len = tamanhoRodada(c.tipo, rodada, alvo.length); msg.textContent = 'isso! agora com mais notas…'; depois(exemplo, 900); return;
      }
      somErro(); vidas--; erros++; spans[pos].classList.add('bad'); kb.acende(certa, 'certa', 800); placarTxt(); estado = 'pausa';
      if (vidas <= 0) { msg.textContent = `era ${nomeNota(certa)}.`; depois(() => fim(false), 900); return; }
      msg.textContent = `era ${nomeNota(certa)}. escuta de novo…`; depois(exemplo, 1300);
    }
    async function comeca() {
      go.hidden = true; res.replaceChildren(); musicaPausa(); ops.hidden = true;
      if (c.mic) { msg.textContent = 'abrindo o microfone…'; try { mic = await ouvirNotas((m) => nota(m)); } catch (e) { if (gone) return; toast(`${micToast(e)} vou usar a tela`); setGame('copia', { entrada: 'tela' }); tela(); return; } if (gone || estado !== 'menu') { if (mic) { mic.stop(); mic = null; } return; } }
      alvo = c.tipo === 'melodia' ? melodia.notas.slice() : sorteio(nivel.notas, MAX_SORTEIO); rodada = 1; vidas = VIDAS; erros = 0; feitas = 0; len = tamanhoRodada(c.tipo, 1, alvo.length);
      exemplo();
    }
    go.addEventListener('click', comeca);
    parar = () => { if (estado === 'paul' || estado === 'vez' || estado === 'pausa') { try { silence(); } catch { /* sem áudio */ } tela(); } };
    window.__vivo = { jogo: 'copia', nota, get alvo() { return alvo.slice(0, len); }, get estado() { return estado; }, get vidas() { return vidas; } }; // só pra teste
  }
  tela();
  return {
    inProgress: () => estado === 'paul' || estado === 'vez' || estado === 'pausa',
    pause: () => parar(),
    restart: () => { if (!gone) tela(); },
    destroy() { gone = true; limpa(); musicaVolta(); },
  };
}
