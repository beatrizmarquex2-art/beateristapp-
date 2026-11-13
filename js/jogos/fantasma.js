// Clique Fantasma: o metrônomo toca 2 compassos, some por 1, 2 ou 4 compassos e volta. O aluno continua tocando no silêncio
// e o app mostra, batida por batida, se ele correu, atrasou ou cravou. Serve pra bateria, violão, teclado ou palma.
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { audio, click, tom, perfToCtx, silence } from '../audio.js';
import { toast } from '../ui.js';
import { micToast } from '../mic-access.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { TEMPOS_FANTASMA, NIVEIS_FANTASMA, JUNTO, VOLTA, folgaFantasma, julgaFantasma, estrelasPct } from './vivo-logic.js';
import { chips, ouvirBatidas, premiar, quadro, estrelasTxt } from './vivo-ui.js';

const FRASE = { cravou: 'cravou! seu relógio interno está firme.', correu: 'você correu: no silêncio o tempo ficou mais rápido.', atrasou: 'você atrasou: no silêncio o tempo ficou mais lento.', parou: 'você parou de tocar no silêncio. continue mesmo sem ouvir o clique!' };

export function mount(host) {
  const root = h('div', { class: 'jg vv vv-fantasma' }); host.replaceChildren(root);
  let gone = false; let mic = null; let timers = []; let estado = 'menu'; let parar = () => {};
  const limpa = () => { timers.forEach(clearTimeout); timers = []; if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } delete window.__vivo; };
  const cfg = () => { const s = getGame('fantasma'); return { bpm: TEMPOS_FANTASMA.includes(s.bpm) ? s.bpm : 80, nivel: NIVEIS_FANTASMA.some((n) => n.id === s.nivel) ? s.nivel : 'f4', mic: s.entrada === 'mic' }; };
  const muda = (patch) => { setGame('fantasma', patch); tela(); };

  function tela() {
    limpa(); musicaVolta(); estado = 'menu'; const c = cfg(); const nivel = NIVEIS_FANTASMA.find((n) => n.id === c.nivel); const q = 60 / c.bpm; const win = folgaFantasma(c.bpm); const chave = `${nivel.id}:${c.bpm}`; const best = getGame('fantasma').best || {};
    const onsets = []; let t0 = 0;
    const luz = h('div', { class: 'vv-luz', 'aria-hidden': 'true' }, h('i', {})); const fase = h('b', { class: 'vv-quem' }, best[chave] != null ? `seu melhor aqui: ${best[chave]}% ${estrelasTxt(estrelasPct(best[chave]))}` : 'toque junto com o clique e não pare quando ele sumir');
    const msg = h('p', { class: 'vv-msg', role: 'status', 'aria-live': 'polite' }, `o clique toca ${JUNTO} tempos, some por ${nivel.mudo} e volta.`);
    const pad = h('button', { type: 'button', class: 'vv-padzao', 'aria-label': 'toque aqui no tempo' }, 'toque aqui'); const res = h('div', { class: 'vv-fim' }); const go = h('button', { type: 'button', class: 'vv-go' }, '▶ jogar');
    const ops = h('div', { class: 'vv-ops' },
      chips('andamento', TEMPOS_FANTASMA.map((b) => [b, `${b} BPM`]), c.bpm, (v) => muda({ bpm: v })),
      chips('o clique some por', NIVEIS_FANTASMA.map((n) => [n.id, n.nome]), c.nivel, (v) => muda({ nivel: v })),
      chips('como tocar', [[false, 'na tela'], [true, 'no instrumento']], c.mic, (v) => muda({ entrada: v ? 'mic' : 'tela' })));
    root.replaceChildren(ops, luz, fase, msg, c.mic ? h('p', { class: 'vv-mic' }, h('b', {}, 'microfone'), ' toque uma batida por tempo: na bateria, numa corda do violão, numa tecla ou batendo palma.') : pad, go, res);

    const bate = (ts) => { const a = audio(); tom(a.currentTime + 0.005, 220, 0.55); if (estado !== 'play') return; const t = ts ? perfToCtx(ts) : a.currentTime; onsets.push(Math.abs(t - a.currentTime) > 0.25 ? a.currentTime : t); };
    pad.addEventListener('pointerdown', (e) => { e.preventDefault(); bate(e.timeStamp); pad.classList.add('hit'); setTimeout(() => pad.classList.remove('hit'), 90); });
    const em = (t, fn) => { timers.push(setTimeout(() => { if (!gone && estado === 'play') fn(); }, Math.max(0, (t - audio(false).currentTime) * 1000))); };
    const pisca = () => { luz.classList.remove('bate'); void luz.offsetWidth; luz.classList.add('bate'); };
    function fim() {
      estado = 'fim'; if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } musicaVolta(); luz.className = 'vv-luz';
      const r = julgaFantasma(onsets.map((t) => t - t0), { q, mudo: nivel.mudo, win }); const n = estrelasPct(r.pct); const b = { ...(getGame('fantasma').best || {}) }; if (r.pct > (b[chave] ?? -1)) b[chave] = r.pct; setGame('fantasma', { best: b }); premiar('fantasma', n, `fa:${chave}`);
      const lim = Math.round(win * 1000); const faixa = Math.max(150, lim * 1.5);
      const linha = h('div', { class: 'vv-pontos', role: 'img', 'aria-label': `batidas no silêncio: ${r.pontos.map((p) => (p == null ? 'faltou' : `${p > 0 ? '+' : ''}${p} ms`)).join(', ')}` },
        ...r.pontos.map((p, i) => h('span', { class: `vv-ponto${p == null ? ' falta' : Math.abs(p) <= lim ? ' ok' : ' bad'}${i % 4 === 0 ? ' um' : ''}` }, h('i', { style: { left: `${50 + (p == null ? 0 : Math.max(-1, Math.min(1, p / faixa)) * 46)}%` } }))));
      res.replaceChildren(quadro(`${r.pct}%`, n, FRASE[r.veredito], linha, h('small', { class: 'vv-leg' }, '◀ adiantou · no meio = no tempo · atrasou ▶'),
        h('small', {}, r.veredito === 'parou' ? '' : `média no silêncio: ${r.media > 0 ? '+' : ''}${r.media} ms · folga: ${lim} ms`)));
      fase.textContent = 'resultado'; fase.className = 'vv-quem'; msg.textContent = r.veredito === 'correu' ? 'dica: respire e conte os tempos em voz alta.' : r.veredito === 'atrasou' ? 'dica: mexa o pé ou a cabeça no pulso.' : r.veredito === 'parou' ? '' : 'tente agora com o clique sumindo por mais tempo.';
      go.textContent = '↻ jogar de novo'; go.hidden = false; ops.hidden = false; try { res.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch { /* sem rolagem */ }
    }
    async function comeca() {
      go.hidden = true; ops.hidden = true; res.replaceChildren(); musicaPausa(); onsets.length = 0;
      if (c.mic) { msg.textContent = 'abrindo o microfone…'; try { mic = await ouvirBatidas((t) => { if (estado === 'play') onsets.push(t); }); } catch (e) { if (gone) return; toast(`${micToast(e)} vou usar a tela`); setGame('fantasma', { entrada: 'tela' }); tela(); return; } if (gone || estado !== 'menu') { if (mic) { mic.stop(); mic = null; } return; } }
      const a = audio(); estado = 'play'; t0 = a.currentTime + 0.35 + 4 * q; const fimMudo = t0 + (JUNTO + nivel.mudo) * q;
      for (let i = 0; i < 4; i++) { click(t0 - (4 - i) * q, i === 0 ? 2 : 1, 0.5); em(t0 - (4 - i) * q, () => { fase.textContent = `conta: ${i + 1}`; pisca(); }); }
      for (let k = 0; k < JUNTO; k++) { click(t0 + k * q, k % 4 === 0 ? 2 : 1, 0.45); em(t0 + k * q, pisca); }
      for (let k = 0; k < VOLTA; k++) { click(fimMudo + k * q, k % 4 === 0 ? 2 : 1, 0.45); em(fimMudo + k * q, pisca); }
      em(t0 - 0.05, () => { fase.textContent = 'toque junto com o clique'; fase.className = 'vv-quem paul'; msg.textContent = 'uma batida por tempo.'; });
      em(t0 + JUNTO * q - 0.05, () => { fase.textContent = 'o clique sumiu: continue!'; fase.className = 'vv-quem vez'; luz.classList.add('mudo'); msg.textContent = 'segura o tempo sozinho…'; });
      em(fimMudo - 0.05, () => { fase.textContent = 'voltou! você ainda está junto?'; fase.className = 'vv-quem paul'; luz.classList.remove('mudo'); msg.textContent = ''; });
      timers.push(setTimeout(() => { if (!gone && estado === 'play') fim(); }, Math.max(0, (fimMudo + VOLTA * q + 0.3 - a.currentTime) * 1000)));
      window.__vivo.t0 = t0;
    }
    go.addEventListener('click', comeca);
    parar = () => { if (estado === 'play') { try { silence(); } catch { /* sem áudio */ } tela(); } };
    window.__vivo = { jogo: 'fantasma', q, mudo: nivel.mudo, inject: (t) => onsets.push(t), get estado() { return estado; }, t0: 0 }; // só pra teste
  }
  tela();
  return {
    inProgress: () => estado === 'play',
    pause: () => parar(),
    restart: () => { if (!gone) { if (estado === 'play') { try { silence(); } catch { /* sem áudio */ } } tela(); } },
    destroy() { gone = true; if (estado === 'play') { try { silence(); } catch { /* sem áudio */ } } limpa(); musicaVolta(); },
  };
}
