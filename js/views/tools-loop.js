// Play-along em loop: um vídeo do YouTube repetindo o trecho A–B, mais lento se precisar.
// Conversa com o player pelo protocolo de mensagens do próprio YouTube (enablejsapi), sem carregar script de fora.
import { h, icon } from '../util.js';
import * as store from '../store.js';
import * as T from '../tools-logic.js';
import { banner, sheet, toast, confirmSheet } from '../ui.js';
import { back } from './tools-common.js';

const YT = 'https://www.youtube.com';
const loops = () => store.list('ytloop').sort((a, b) => (b.data.at || 0) - (a.data.at || 0));

export function mountLoop(host) {
  let frame = null, id = null, info = { currentTime: 0, duration: 0, playerState: -1, playbackRate: 1 }, infoAt = 0;
  let A = null, B = null, rate = 1, looping = true, pre = 0, guard = 0, timer = 0;
  const send = (func, args = []) => frame && frame.contentWindow && frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args, id: 1, channel: 'widget' }), YT);
  const now = () => info.currentTime + (info.playerState === 1 ? ((performance.now() - infoAt) / 1000) * (info.playbackRate || 1) : 0);
  const onMsg = (e) => {
    if (e.origin !== YT || !frame || e.source !== frame.contentWindow) return;
    let m; try { m = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
    if (m && m.event === 'onReady') { send('setPlaybackRate', [rate]); paint(); }
    if (m && m.event === 'infoDelivery' && m.info) { Object.assign(info, m.info); infoAt = performance.now(); paint(); }
    if (m && m.event === 'onStateChange') { info.playerState = m.info; infoAt = performance.now(); paint(); }
  };
  window.addEventListener('message', onMsg);
  // confere o fim do trecho com folga (o player só manda a posição ~4x por segundo)
  timer = setInterval(() => {
    if (!looping || A == null || B == null || B <= A || info.playerState !== 1) return;
    if (now() >= B && performance.now() > guard) { send('seekTo', [Math.max(0, A - pre), true]); info.currentTime = Math.max(0, A - pre); infoAt = performance.now(); guard = performance.now() + 400; }
  }, 50);

  const url = h('input', { type: 'url', inputmode: 'url', placeholder: 'link do YouTube', 'aria-label': 'Link do YouTube' });
  const box = h('div', { class: 'lp-video' }, h('p', { class: 'muted' }, 'cola um link e toca em carregar.'));
  const clock = h('output', { class: 'lp-clock' }, '0:00');
  const aIn = h('input', { type: 'text', inputmode: 'numeric', placeholder: '0:00', 'aria-label': 'Início do trecho' });
  const bIn = h('input', { type: 'text', inputmode: 'numeric', placeholder: '0:00', 'aria-label': 'Fim do trecho' });
  aIn.addEventListener('change', () => { A = T.parseTime(aIn.value); paint(); });
  bIn.addEventListener('change', () => { B = T.parseTime(bIn.value); paint(); });
  const speeds = h('div', { class: 'chips lib-tabs', role: 'radiogroup', 'aria-label': 'Velocidade' },
    ...T.SPEEDS.map((sp) => h('button', { type: 'button', role: 'radio', class: 'lib-tab', onclick: () => { rate = sp; send('setPlaybackRate', [sp]); paint(); } }, sp === 1 ? 'normal' : `${Math.round(sp * 100)}%`)));
  const loopBtn = h('button', { type: 'button', class: 'lib-tab on', 'aria-pressed': 'true', onclick: () => { looping = !looping; paint(); } }, 'loop');
  const preBtn = h('button', { type: 'button', class: 'lib-tab', 'aria-pressed': 'false', onclick: () => { pre = pre ? 0 : 2; paint(); } }, 'volta 2 s antes');
  const playBtn = h('button', { class: 'bl-play', type: 'button', 'aria-label': 'Tocar', onclick: () => { if (!frame) return; if (info.playerState === 1) send('pauseVideo'); else { if (A != null && (now() < A - pre - 0.5 || (B != null && now() >= B))) send('seekTo', [Math.max(0, A - pre), true]); send('playVideo'); } } }, icon('play', 28));
  const paint = () => {
    clock.textContent = `${T.fmtTime(now())}${info.duration ? ` / ${T.fmtTime(info.duration)}` : ''}`;
    if (document.activeElement !== aIn) aIn.value = A != null ? T.fmtTime(A) : '';
    if (document.activeElement !== bIn) bIn.value = B != null ? T.fmtTime(B) : '';
    // só troca o destaque (recriar os botões a cada meio segundo engoliria toques)
    [...speeds.children].forEach((b, i) => { const on = T.SPEEDS[i] === rate; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    loopBtn.classList.toggle('on', looping); loopBtn.setAttribute('aria-pressed', String(looping));
    preBtn.classList.toggle('on', !!pre); preBtn.setAttribute('aria-pressed', String(!!pre));
    const playing = info.playerState === 1; if (playBtn.classList.contains('on') !== playing) { playBtn.classList.toggle('on', playing); playBtn.replaceChildren(icon(playing ? 'stop' : 'play', 28)); playBtn.setAttribute('aria-label', playing ? 'Pausar' : 'Tocar'); }
  };
  const load = (link, keep) => {
    const v = T.ytId(link); if (!v) { toast('esse link não parece de vídeo do YouTube'); return false; }
    id = v; url.value = link;
    if (!keep) { A = null; B = null; rate = 1; }
    info = { currentTime: 0, duration: 0, playerState: -1, playbackRate: 1 };
    frame = h('iframe', { src: `${YT}/embed/${v}?enablejsapi=1&playsinline=1&rel=0&origin=${encodeURIComponent(location.origin)}`, title: 'Vídeo do YouTube', allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', referrerpolicy: 'strict-origin-when-cross-origin' });
    frame.addEventListener('load', () => { frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), YT); setTimeout(() => send('setPlaybackRate', [rate]), 600); });
    box.replaceChildren(frame); paint(); return true;
  };
  const saveLoop = async () => {
    if (!id) { toast('carrega um vídeo primeiro'); return; }
    sheet('Salvar trecho', (close) => {
      const name = h('input', { type: 'text', maxlength: 60, placeholder: 'ex.: refrão de Billie Jean', 'aria-label': 'Nome do trecho' });
      return h('div', { class: 'sheet-body' }, h('label', { class: 'field' }, h('span', {}, 'nome'), name), h('button', { class: 'btn primary', type: 'button', onclick: async () => {
        await store.upsert('ytloop', null, { url: url.value.trim(), name: name.value.trim() || 'trecho', a: A, b: B, rate, at: Date.now() }); close(); toast('trecho salvo ✓', { ms: 1400 });
      } }, 'salvar'));
    });
  };
  const saved = h('section', { class: 'card pad' });
  const drawSaved = () => {
    const l = loops(); const songs = store.list('song').filter((r) => r.data.link && T.ytId(r.data.link));
    saved.replaceChildren(h('h2', { class: 'tag' }, 'trechos salvos'),
      l.length ? h('ul', { class: 'rp-list' }, ...l.map((r) => h('li', { class: 'rm-item' }, h('span', { class: 'rm-time' }, `${Math.round((r.data.rate || 1) * 100)}%`),
        h('button', { type: 'button', class: 'rp-t', onclick: () => { A = r.data.a; B = r.data.b; rate = r.data.rate || 1; load(r.data.url, true); } }, h('strong', {}, r.data.name), h('small', {}, `${r.data.a != null ? T.fmtTime(r.data.a) : '0:00'}–${r.data.b != null ? T.fmtTime(r.data.b) : 'fim'}`)),
        h('button', { class: 'btn small ghost', type: 'button', 'aria-label': `Apagar ${r.data.name}`, onclick: async () => { if (await confirmSheet('Apagar trecho?', r.data.name, 'Apagar')) store.remove(r.id); } }, 'apagar')))) : h('p', { class: 'muted' }, 'nenhum ainda. marca um trecho e toca em "salvar trecho".'),
      songs.length ? h('div', {}, h('p', { class: 'tp-lab' }, 'do repertório (com link)'), h('div', { class: 'chips lib-tabs' }, ...songs.map((r) => h('button', { type: 'button', class: 'lib-tab', onclick: () => load(r.data.link) }, r.data.title)))) : null);
  };
  host.append(banner('Play-along em loop', 'repete o trecho difícil até sair'), back(),
    h('div', { class: 'row pad-x ft-row' }, url, h('button', { class: 'btn primary', type: 'button', onclick: () => load(url.value.trim()) }, 'carregar')),
    box,
    h('section', { class: 'card pad lp-ctrl' },
      h('div', { class: 'row ft-row' }, playBtn, clock),
      h('div', { class: 'lp-ab' },
        h('label', { class: 'field' }, h('span', {}, 'início (A)'), aIn), h('button', { class: 'btn small', type: 'button', onclick: () => { A = Math.floor(now() * 10) / 10; paint(); } }, 'marcar A agora'),
        h('label', { class: 'field' }, h('span', {}, 'fim (B)'), bIn), h('button', { class: 'btn small', type: 'button', onclick: () => { B = Math.floor(now() * 10) / 10; paint(); } }, 'marcar B agora')),
      h('div', { class: 'tr-line' }, h('span', { class: 'tp-lab' }, 'velocidade'), speeds),
      h('div', { class: 'chips lib-tabs' }, loopBtn, preBtn, h('button', { type: 'button', class: 'lib-tab', onclick: saveLoop }, 'salvar trecho'))),
    saved,
    h('p', { class: 'pad-x lib-note' }, 'precisa de internet. a velocidade muda sem mudar o tom (é o próprio YouTube). no iPhone, toque no play do vídeo na primeira vez.'),
    h('p', { class: 'pad-x lib-note' }, 'anúncio aqui? o Premium só vale no app do YouTube (o login não passa pro player embutido).  ', h('a', { class: 'link', href: 'https://www.youtube.com/', target: '_blank', rel: 'noopener noreferrer', onclick: (e) => { if (id) e.currentTarget.href = `https://www.youtube.com/watch?v=${id}`; } }, 'abrir esse vídeo no app ↗')));
  paint(); drawSaved();
  const off = store.subscribe((i) => { if (!i.kind || i.kind === 'ytloop' || i.kind === 'song') drawSaved(); });
  const tick = setInterval(paint, 500);
  return () => { off(); clearInterval(timer); clearInterval(tick); window.removeEventListener('message', onMsg); };
}
