// "Aulas" de melodia nas abas Teclas e Percussão (xilofone): o Paul toca uma frase de uma música fácil, acendendo as teclas, e o aluno repete.
// Na tela (toca nas teclas) ou no instrumento de verdade (microfone: piano, teclado, xilofone, violão uma nota por vez; vale em qualquer oitava).
// Mostra o nome da música e a frase na partitura normal e na colorida (cada nota na cor do app). Regra e nota em js/jogos/aulas-melodia.js.
// `inst` = { mic: 'teclado'|'sinos' (faixa de notas do microfone), preparar(musica), sair(), luz(midi, ligada, classe?), toca(midi, quando, duracao), aoTocar(fn|null) } (cada instrumento liga as suas teclas).
import { h } from '../util.js';
import { audio, silence } from '../audio.js';
import { getGame, setGame } from '../jogos/base.js';
import { ganhou } from '../jogos/estrelas-jogo.js';
import { toast } from '../ui.js';
import { micToast } from '../mic-access.js';
import { ouvirNotas } from '../jogos/vivo-ui.js';
import { SYM_SVG } from '../jogos/cartas-simbolos.js';
import { corNota } from '../cores-notas.js';
import { MUSICAS, novaSessao, estrelas, nomeNota, mesmaNota, posPauta } from '../jogos/aulas-melodia.js';

const est = () => getGame('aulamel').est || {};
const txtEst = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
const Y = (p) => 64 - p * 5; // y da posição p na pauta (0 = 1ª linha)
/** A frase na pauta de sol. `cor` pinta cada nota com a cor dela e escreve o nome embaixo. Cada nota fica num <g class="pn" data-k> pra marcar (agora / certa / errada). */
export function pautaSVG(frase, { cor = false } = {}) {
  const n = frase.length; const passo = 32; const x0 = 52; const W = Math.max(250, x0 + n * passo + 14); let s = '';
  for (let l = 0; l < 5; l++) s += `<line x1="4" x2="${W - 4}" y1="${Y(l * 2)}" y2="${Y(l * 2)}" stroke="currentColor" stroke-width="1.6"/>`;
  s += `<svg x="2" y="8" width="42" height="72" viewBox="0 0 48 64">${SYM_SVG.clave_sol}</svg>`;
  frase.forEach(([m, d], i) => {
    const p = posPauta(m); const cx = x0 + i * passo + 10; const y = Y(p); const c = cor ? corNota(m) : 'currentColor'; const oca = d >= 2; let g = `<rect class="pn-bg" x="${cx - 15}" y="14" width="30" height="${cor ? 84 : 68}" rx="7"/>`;
    for (let q = -2; q >= p; q -= 2) g += `<line x1="${cx - 13}" x2="${cx + 13}" y1="${Y(q)}" y2="${Y(q)}" stroke="currentColor" stroke-width="1.6"/>`;
    for (let q = 10; q <= p; q += 2) g += `<line x1="${cx - 13}" x2="${cx + 13}" y1="${Y(q)}" y2="${Y(q)}" stroke="currentColor" stroke-width="1.6"/>`;
    const sobe = p < 4; const sx = sobe ? cx + 7 : cx - 7; const fim = sobe ? y - 30 : y + 30;
    g += `<line x1="${sx}" x2="${sx}" y1="${y}" y2="${fim}" stroke="currentColor" stroke-width="2"/>`;
    if (d < 1) g += sobe ? `<path d="M${sx} ${fim}c7 3 10 9 6 17" fill="none" stroke="currentColor" stroke-width="2"/>` : `<path d="M${sx} ${fim}c-7 -3 -10 -9 -6 -17" fill="none" stroke="currentColor" stroke-width="2"/>`;
    g += `<ellipse cx="${cx}" cy="${y}" rx="7.8" ry="5.4" transform="rotate(-20 ${cx} ${y})" ${oca ? `fill="none" stroke="${c}" stroke-width="2.8"` : `fill="${c}" stroke="${cor ? '#1b1818' : 'none'}" stroke-width="1.2"`}/>`;
    if (d !== Math.floor(d) && d >= 0.75) g += `<circle cx="${cx + 13}" cy="${y - (p % 2 === 0 ? 4 : 0)}" r="1.9" fill="currentColor"/>`;
    if (cor) g += `<text x="${cx}" y="95" font-size="12" font-weight="800" text-anchor="middle" fill="currentColor">${nomeNota(m)}</text>`;
    s += `<g class="pn" data-k="${i}">${g}</g>`;
  });
  return `<svg viewBox="0 0 ${W} ${cor ? 102 : 86}" width="100%" role="img" aria-label="${cor ? 'Partitura colorida' : 'Partitura'}: ${frase.map((x) => nomeNota(x[0])).join(' ')}">${s}</svg>`;
}

export function melodiaPainel(inst, { voltar } = {}) {
  const el = h('section', { class: 'card pad tk-panel bmr am-painel' });
  let estado = 'lista'; let timers = []; let gone = false; let mic = null; let sess = null; let idle = null;
  const aluno = () => document.documentElement.classList.contains('aluno-on');
  const limpa = () => { timers.forEach(clearTimeout); timers = []; clearTimeout(idle); if (mic) { try { mic.stop(); } catch { /* ok */ } mic = null; } inst.aoTocar(null); };
  const em = (t, fn) => { timers.push(setTimeout(() => { if (!gone && (estado === 'paul' || estado === 'vez' || estado === 'pausa')) fn(); }, Math.max(0, (t - audio(false).currentTime) * 1000))); };

  function lista() {
    limpa(); el.classList.remove('am-jogando'); inst.sair(); estado = 'lista'; const e = est();
    el.replaceChildren(
      h('div', { class: 'au-topo' }, h('b', {}, 'aulas de música'), voltar ? h('button', { type: 'button', class: 'btn small ghost', onclick: () => { limpa(); inst.sair(); voltar(); } }, 'fechar') : null),
      h('p', { class: 'muted au-intro' }, 'o Paul toca uma frase e acende as teclas; depois é a sua vez. escolha uma música:'),
      h('div', { class: 'au-lista', role: 'group', 'aria-label': 'Músicas' },
        ...MUSICAS.map((m) => h('button', { type: 'button', class: 'kd-chip au-item', onclick: () => musica(m) }, h('span', {}, m.nome), h('small', {}, `${m.frases.length} frases`), h('i', { class: 'au-est', 'aria-label': `${estrelas(e[m.id] || 0)} de 3 estrelas` }, txtEst(estrelas(e[m.id] || 0)))))));
  }

  function musica(m) {
    limpa(); estado = 'musica'; inst.preparar(m); const usaMic = () => getGame('aulamel').entrada === 'mic';
    const quem = h('b', { class: 'au-quem' }, 'pronto?'); const msg = h('p', { class: 'au-msg', role: 'status', 'aria-live': 'polite' }, usaMic() ? 'toque no seu instrumento, uma nota por vez.' : 'toque nas teclas.');
    const pautas = h('div', { class: 'am-pautas' }); const res = h('div', { class: 'au-fim' }); const go = h('button', { type: 'button', class: 'btn primary tk-big au-go' }, '▶ jogar');
    const desenhaFrase = (fi) => { const fr = m.frases[fi]; pautas.replaceChildren(h('div', { class: 'au-bloco' }, h('span', { class: 'au-rotulo' }, `frase ${fi + 1} de ${m.frases.length} · partitura`), h('figure', { class: 'au-pauta' })), h('div', { class: 'au-bloco' }, h('span', { class: 'au-rotulo' }, 'partitura colorida'), h('figure', { class: 'au-pauta cor' })));
      const [a, b] = pautas.querySelectorAll('figure'); a.innerHTML = pautaSVG(fr, { cor: false }); b.innerHTML = pautaSVG(fr, { cor: true }); };
    const marca = (k, cls, on = true) => pautas.querySelectorAll(`.pn[data-k="${k}"]`).forEach((g) => g.classList.toggle(cls, on));
    const limpaMarcas = () => pautas.querySelectorAll('.pn').forEach((g) => g.classList.remove('now', 'ok', 'esp', 'bad'));
    const topo = h('div', { class: 'au-topo' }, h('button', { type: 'button', class: 'btn small ghost', onclick: () => { parar(); lista(); } }, '‹ músicas'), quem, h('span', { class: 'au-est' }, txtEst(estrelas(est()[m.id] || 0))));
    const modo = h('div', { class: 'au-linha', role: 'radiogroup', 'aria-label': 'Como tocar' }, h('span', { class: 'au-lab' }, 'como tocar'),
      ...[[false, 'na tela'], [true, 'no instrumento']].map(([v, t]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(usaMic() === v), class: `kd-chip${usaMic() === v ? ' on' : ''}`, onclick: () => { setGame('aulamel', { entrada: v ? 'mic' : 'tela' }); musica(m); } }, t)));
    el.replaceChildren(topo, h('h3', { class: 'au-nome' }, m.nome), h('p', { class: 'au-info' }, `${m.bpm} bpm · ${m.frases.length} frases${!aluno() && m.confere ? ' · melodia a conferir' : ''}`), modo, pautas, msg, go, res);
    desenhaFrase(0);

    const parar = () => { el.classList.remove('am-jogando'); if (estado === 'paul' || estado === 'vez' || estado === 'pausa') { try { silence(); } catch { /* sem áudio */ } } limpa(); if (inst.apagaTudo) inst.apagaTudo(); estado = 'musica'; };
    const vez = (fi) => {
      estado = 'vez'; limpaMarcas(); marca(sess.pos, 'esp'); quem.textContent = `frase ${fi + 1} de ${m.frases.length}: sua vez`; quem.className = 'au-quem vez'; msg.textContent = usaMic() ? 'agora você, no instrumento!' : 'agora você!';
      if (mic) mic.surdo(false); inst.aoTocar(usaMic() ? null : tap);
      clearTimeout(idle); idle = setTimeout(() => { if (estado === 'vez' && !gone) { toast('vou tocar de novo pra você 😉', { ms: 1800 }); sess.refaz(); paul(fi); } }, 16000);
    };
    const paul = (fi) => {
      estado = 'paul'; inst.aoTocar(null); if (mic) mic.surdo(true); clearTimeout(idle); desenhaFrase(fi); quem.textContent = `frase ${fi + 1} de ${m.frases.length}: o Paul toca`; quem.className = 'au-quem paul'; msg.textContent = 'escuta e olha as teclas…';
      const q = 60 / m.bpm; let t = audio().currentTime + 0.5;
      m.frases[fi].forEach(([nota, d], k) => { inst.toca(nota, t, d * q * 0.92); const ini = t; em(ini, () => { limpaMarcas(); marca(k, 'now'); inst.luz(nota, true); }); em(ini + d * q * 0.88, () => { inst.luz(nota, false); marca(k, 'now', false); }); t += d * q; });
      em(t + 0.2, () => vez(fi));
    };
    function tap(midi) {
      if (estado !== 'vez') return; const pos = sess.pos; const fi = sess.frase; const r = sess.toca(midi); clearTimeout(idle);
      if (r.tipo === 'erro') { marca(pos, 'bad'); setTimeout(() => marca(pos, 'bad', false), 450); msg.textContent = 'quase! olha a tecla acesa.'; inst.luz(r.certa, true, 'au-certa'); setTimeout(() => inst.luz(r.certa, false, 'au-certa'), 900); idle = setTimeout(() => { if (estado === 'vez' && !gone) { sess.refaz(); paul(fi); } }, 16000); return; }
      marca(pos, 'ok'); marca(pos, 'esp', false);
      if (r.tipo === 'ok') { marca(sess.pos, 'esp'); idle = setTimeout(() => { if (estado === 'vez' && !gone) { sess.refaz(); paul(fi); } }, 16000); return; }
      if (r.tipo === 'frase') { estado = 'pausa'; inst.aoTocar(null); msg.textContent = 'isso! próxima frase…'; timers.push(setTimeout(() => { if (!gone) paul(sess.frase); }, 1100)); return; }
      if (r.tipo === 'fim') { estado = 'pausa'; timers.push(setTimeout(() => { if (!gone) fim(); }, 600)); }
    }
    const fim = () => {
      const pct = sess.pct(); const n = estrelas(pct); const e = { ...est() }; if (pct > (e[m.id] || 0)) e[m.id] = pct; setGame('aulamel', { est: e }); if (n > 0) ganhou('aulamel', n, `aulamel:${m.id}`);
      limpa(); el.classList.remove('am-jogando'); if (inst.apagaTudo) inst.apagaTudo(); estado = 'musica'; limpaMarcas(); quem.textContent = 'resultado'; quem.className = 'au-quem'; topo.querySelector('.au-est').textContent = txtEst(estrelas(e[m.id] || 0));
      res.replaceChildren(h('div', { class: 'au-res', role: 'status' }, h('b', { class: 'au-res-n' }, `${pct}%`), h('span', { class: 'au-res-est', 'aria-label': `${n} de 3 estrelas` }, txtEst(n)),
        h('p', {}, pct >= 100 ? 'perfeito, sem errar nenhuma!' : pct >= 60 ? 'você tocou a música!' : 'precisa de 60% pra ganhar estrela. tenta de novo.'),
        h('small', {}, `${sess.acertos} notas certas · ${sess.erros} ${sess.erros === 1 ? 'erro' : 'erros'}`), h('small', {}, '60% = 1 ★ · 80% = 2 ★ · 100% = 3 ★')));
      go.textContent = '↻ jogar de novo'; go.hidden = false; modo.hidden = false; msg.textContent = pct >= 80 ? 'muito bom!' : 'dica: olha a cor de cada nota, ela é a mesma da tecla.'; desenhaFrase(m.frases.length - 1);
    };
    go.addEventListener('click', async () => {
      go.hidden = true; modo.hidden = true; res.replaceChildren(); sess = novaSessao(m, usaMic() ? mesmaNota : (a, b) => a === b); estado = 'paul';
      if (usaMic()) { msg.textContent = 'abrindo o microfone…'; try { mic = await ouvirNotas((nota) => tap(nota), inst.mic ? { instrumento: inst.mic } : undefined); } catch (err) { if (gone) return; toast(`${micToast(err)} vou usar a tela`); setGame('aulamel', { entrada: 'tela' }); musica(m); return; } if (gone || estado !== 'paul') { if (mic) { mic.stop(); mic = null; } return; } }
      el.classList.add('am-jogando'); if (inst.ver) inst.ver(); paul(0);
    });
    window.__aulaMel = { musica: m, tap: (n) => tap(n), get estado() { return estado; }, get sess() { return sess; } }; // só pra teste
  }
  lista();
  return { el, destroy() { gone = true; if (estado === 'paul' || estado === 'vez') { try { silence(); } catch { /* sem áudio */ } } limpa(); inst.sair(); if (inst.apagaTudo) inst.apagaTudo(); delete window.__aulaMel; } };
}
