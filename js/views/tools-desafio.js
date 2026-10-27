// Desafio da semana: um groove + um rudimento de aquecimento + uma "pegadinha", iguais a semana toda (mudam na segunda).
// Toca na hora, abre no Beat Lab e gera um card 1080×1350 na identidade Beaterista pra postar.
import { h, icon, todayKey } from '../util.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import * as T from '../tools-logic.js';
import { PRESETS as RUDS } from '../rudiments.js';
import { playBeat, stopBeat, playingId } from './beatlab.js';
import { banner, toast } from '../ui.js';
import { back } from './tools-common.js';

const KEY = 'setting-desafio';
const conf = () => ({ salt: {}, done: {}, ...(store.get(KEY) ? store.get(KEY).data : {}) });
const grooves = () => B.PRESETS.filter((p) => p.kind === 'groove' && B.levelOf(p) <= 2);
const pools = () => ({ grooves: grooves(), ruds: RUDS });
const fmtD = (k) => k.split('-').reverse().slice(0, 2).join('/');
const addDays = (k, n) => { const d = new Date(`${k}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

async function card(ch, beat) {
  // fontes que a tela talvez ainda não usou: carrega antes de desenhar (senão o canvas cai na fonte padrão)
  if (document.fonts && document.fonts.load) await Promise.all(['400 120px "Anton"', '400 82px "Permanent Marker"', '400 54px "Gochi Hand"', '400 40px "Special Elite"', '700 76px "Hanken Grotesk"'].map((f) => document.fonts.load(f).catch(() => null)));
  const W = 1080, H = 1350; const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const ink = '#1b1818', red = '#b5162b', paper = '#f3eee4';
  g.fillStyle = paper; g.fillRect(0, 0, W, H);
  // grão do papel
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
  // fita vermelha com o título
  g.save(); g.translate(70, 150); g.rotate(-0.035); g.fillStyle = red; g.fillRect(0, 0, 760, 120);
  g.fillStyle = '#fff'; g.font = '400 82px "Permanent Marker", "Marker Felt", cursive'; g.fillText('DESAFIO', 30, 92); g.restore();
  g.fillStyle = ink; g.font = '400 54px "Gochi Hand", cursive'; g.fillText(`da semana · ${fmtD(ch.wk)} a ${fmtD(addDays(ch.wk, 6))}`, 90, 340);
  g.font = '700 76px "Hanken Grotesk", Arial, sans-serif'; const words = ch.groove.split(' '); let line = ''; let y = 480;
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (g.measureText(t).width > 900 && line) { g.fillText(line, 90, y); y += 86; line = w; } else line = t; }
  g.fillText(line, 90, y);
  g.fillStyle = red; g.font = '400 120px "Anton", Impact, sans-serif'; g.fillText(`${ch.bpm} BPM`, 90, y + 150);
  // pauta do groove
  const lay = N.layout(beat, { width: 450, full: false }); const sc = 900 / 450;
  g.save(); g.translate(90, y + 200); g.fillStyle = '#fff'; g.fillRect(-20, -20, 940, lay.h * sc + 40); N.draw(g, lay, { scale: sc, ink }); g.restore();
  const y2 = y + 200 + lay.h * sc + 90;
  g.fillStyle = ink; g.font = '400 50px "Gochi Hand", cursive'; g.fillText(`+ ${ch.twist}`, 90, y2);
  g.font = '400 40px "Special Elite", "Courier New", monospace'; g.fillStyle = '#444'; g.fillText(ch.warm, 90, y2 + 64);
  g.fillStyle = ink; g.fillRect(0, H - 120, W, 120); g.fillStyle = '#fff'; g.font = '700 46px "Hanken Grotesk", Arial, sans-serif'; g.fillText('@beaterista', 90, H - 46);
  g.font = '400 34px "Gochi Hand", cursive'; g.textAlign = 'right'; g.fillText('posta e me marca!', W - 90, H - 48); g.textAlign = 'left';
  const logo = await loadImg('assets/logo-512.png'); if (logo) g.drawImage(logo, W - 250, 60, 170, 170);
  return c;
}

export function mountDesafio(host) {
  const body = h('div');
  const wk = T.weekKey(todayKey());
  const current = () => { const c = conf(); return T.weekChallenge(wk, pools(), c.salt[wk] || 0); };
  const beatOf = (ch) => { const b = grooves().find((x) => x.name === ch.groove) || B.PRESETS[0]; return { ...B.clone(b), bpm: ch.bpm, id: 'desafio', pid: b.id }; };
  const draw = () => {
    const ch = current(); const c = conf(); const done = !!c.done[wk]; const beat = beatOf(ch); const playing = playingId() === 'desafio';
    const mini = h('figure', { class: 'tr-bar' }); mini.innerHTML = N.toSVG(N.layout(beat, { width: 360, full: false }));
    body.replaceChildren(
      h('section', { class: 'card pad dz-card' },
        h('p', { class: 'lib-kicker' }, `semana de ${fmtD(wk)} a ${fmtD(addDays(wk, 6))}`),
        h('h2', { class: 'dz-title' }, ch.groove), h('p', { class: 'dz-bpm' }, `${ch.bpm} BPM`), mini,
        h('p', { class: 'dz-twist' }, `+ ${ch.twist}`), h('p', { class: 'muted' }, ch.warm),
        h('div', { class: 'row ft-row' },
          h('button', { class: `bl-play${playing ? ' on' : ''}`, type: 'button', 'aria-label': playing ? 'Parar' : 'Tocar o groove', onclick: () => { if (playing) stopBeat(); else playBeat(beat, { onStop: draw, withClick: false }); draw(); } }, icon(playing ? 'stop' : 'play', 28)),
          h('button', { class: 'btn', type: 'button', onclick: async () => { stopBeat(); await store.upsert('setting', 'setting-beatlab', { beat: { ...beat, id: beat.pid } }); location.hash = '#/beatlab'; } }, 'abrir no Beat Lab'),
          h('button', { class: `btn${done ? ' st-paid' : ''}`, type: 'button', 'aria-pressed': String(done), onclick: () => store.upsert('setting', KEY, { done: { ...c.done, [wk]: !done } }).then(draw) }, done ? 'feito ✓' : 'marcar feito'))),
      h('div', { class: 'row pad-x ft-row' },
        h('button', { class: 'btn primary', type: 'button', onclick: async (e) => {
          const btn = e.currentTarget; btn.disabled = true;
          try {
            const cv = await card(ch, beat); const blob = await new Promise((ok) => cv.toBlob(ok, 'image/png'));
            const file = new File([blob], `desafio-beaterista-${wk}.png`, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia('(pointer: coarse)').matches) { try { await navigator.share({ files: [file] }); btn.disabled = false; return; } catch { /* cancelou: baixa */ } }
            const u = URL.createObjectURL(file); const a = h('a', { href: u, download: file.name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 30000);
            toast('card baixado ✓', { ms: 1500 });
          } catch (err) { toast(`não consegui gerar: ${err.message || 'erro'}`); }
          btn.disabled = false;
        } }, 'gerar card pra postar'),
        h('button', { class: 'btn ghost', type: 'button', onclick: () => { stopBeat(); const c = conf(); store.upsert('setting', KEY, { salt: { ...c.salt, [wk]: (c.salt[wk] || 0) + 1 } }).then(draw); } }, 'sortear outro')),
      h('p', { class: 'pad-x lib-note' }, 'o desafio é o mesmo a semana toda e muda sozinho na segunda. "sortear outro" troca só o desta semana. o card sai em 1080×1350 (feed do Instagram).'));
  };
  host.append(banner('Desafio da semana', 'um groove, um aquecimento e uma pegadinha'), back(), body);
  draw();
  return () => { if (playingId() === 'desafio') stopBeat(); };
}
