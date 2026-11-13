// Mapa de fases "Turnê do Vinil": discos de vinil numerados num caminho pixel art, com regiões, Paul, estrelas e sons curtinhos.
// Componente reutilizável: recebe as fases e o progresso (funções) e devolve a função de limpeza. A lógica fica em mapa-logic.js.
//
//   mountProgressionMap(host, {
//     gameId, title, levels: [{ id, index, label, tag }],           // fases em ordem, ids estáveis (os mesmos do progresso salvo)
//     starsOf(id), bestOf(id), unlockedOf(id),                      // progresso que o jogo já tem
//     tier, profileId, stars: { have, max },                        // enfeite do Paul, quem joga, total de estrelas
//     regions?, onOpen(level), onBack?()                            // abrir fase / voltar ao jogo
//   }) → dispose()
import { h } from '../util.js';
import { toast } from '../ui.js';
import { session } from '../session.js';
import { corSrc, poseDe, poseDoJogo, stkSrc, ELEMENTOS } from '../paul-cor.js';
import { temaButton } from '../campanha/tema.js';
import { sprite, DECOR } from './mapa-art.js';
import { mapSfx, soundOn, setSound } from './mapa-sfx.js';
import { ST, REGIONS, computeNodes, chaptersFor, layoutMap, pathThrough, newlyDone, doneIds, regionOf, checkLevels } from './mapa-logic.js';

const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const store = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } return null; };
const sess = (k, v) => { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k)); sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } return null; };
const pct = (v, total) => `${(v / total) * 100}%`;
const SAY = { start: 'bora!', cheer: 'mandou bem!', next: 'próxima!', done: 'turnê completa!' };

export function mountProgressionMap(host, cfg) {
  const { gameId, levels, profileId = 'x', onOpen, onBack, theme = null, unitName = 'Fase' } = cfg; const regions = (theme && theme.regions) || cfg.regions || REGIONS;
  const S = session({ quiet: false }); const sfx = mapSfx(); const motion = !reduced();
  const decorOf = (c) => c.decor || DECOR[c.id] || [];
  const bad = checkLevels(levels); if (!bad.ok) console.warn('mapa: fases com problema', bad.errors);
  const { nodes, current, allDone } = computeNodes(levels, cfg);
  const chapters = chaptersFor(nodes.length, regions); const L = layoutMap(nodes.length);
  const seenKey = `beaterista-mapa-vistos:${profileId}:${gameId}`; const lastKey = `beaterista-mapa-ultima:${profileId}:${gameId}`;
  const fresh = newlyDone(store(seenKey), nodes); const celebrate = fresh.length ? fresh[fresh.length - 1] : null;
  const pos$ = (i) => L.pts[i];

  /* ---- cabeçalho ---- */
  const doneN = nodes.filter((n) => n.state === ST.DONE).length;
  const snd = h('button', { type: 'button', class: 'mp-snd', 'aria-pressed': String(!soundOn()), 'aria-label': 'Sons do mapa' });
  const paintSnd = () => { snd.setAttribute('aria-pressed', String(!soundOn())); snd.textContent = soundOn() ? '🔊' : '🔇'; snd.title = soundOn() ? 'silenciar os sons do mapa' : 'ligar os sons do mapa'; };
  paintSnd();
  snd.addEventListener('click', () => { setSound(!soundOn()); paintSnd(); sfx.play('click'); });
  const regionName = h('b', { class: 'mp-rname' }); const regionSub = h('small', {});
  const head = h('div', { class: 'mp-head' },
    onBack ? h('button', { type: 'button', class: 'mp-back', onclick: () => onBack() }, '‹ jogo') : null,
    h('div', { class: 'mp-reg', 'aria-live': 'polite' }, regionName, regionSub),
    h('span', { class: 'mp-prog', title: 'discos concluídos' }, h('span', { class: 'mp-vinyl-ico', 'aria-hidden': 'true' }), `${doneN}/${nodes.length}`),
    cfg.stars ? h('span', { class: 'mp-prog star', title: 'estrelas' }, `★ ${cfg.stars.have}/${cfg.stars.max}`) : null, temaButton(), snd);

  /* ---- mundo ---- */
  const world = h('div', { class: `mp-world${motion ? ' mp-anim' : ''}`, style: `aspect-ratio:${L.W} / ${L.H}` });
  const at = (x, y) => `left:${pct(x, L.W)};top:${pct(y, L.H)}`;
  const decorEls = []; // { el, side, y }: o que fica embaixo do Paul some enquanto ele está ali
  chapters.forEach((c, ci) => {
    const b = L.bands[ci];
    const col = ''; // as cores das faixas vêm do tema da escola (css/aventura-tema.css), escuro ou claro
    const band = h('section', { class: 'mp-band', 'data-r': c.id, 'data-i': ci, style: `top:${pct(b.y0, L.H)};height:${pct(b.y1 - b.y0, L.H)}${col}`, 'aria-label': c.name });
    const sign = h('div', { class: 'mp-sign', style: `top:${pct(b.y0 + 14, L.H)}` }, h('small', {}, `região ${ci + 1}`), h('b', {}, c.name));
    world.append(band, sign);
    // adesivos da Bea (notas, estrelas, vinil, fones…) pelas bordas de cada região, longe do caminho e dos desenhos pixel (sem encostar neles)
    const ocupados = decorOf(c).map(([, sd, f]) => [sd === 'l' ? 'l' : 'r', b.y0 + 84 + (b.y1 - b.y0 - 84) * f]);
    for (let k = 0; k < 6; k++) {
      const name = ELEMENTOS[(ci * 5 + k * 3 + gameId.length) % ELEMENTOS.length]; const side = (ci + k) % 2 ? 'l' : 'r'; let y = b.y0 + 110 + (b.y1 - b.y0 - 150) * ((k * 0.17 + 0.06 + ci * 0.11) % 0.95);
      for (let t = 0; t < 8 && ocupados.some(([sd, yy]) => sd === side && Math.abs(yy - y) < 52); t++) y += 34; // empurra pra baixo até achar um vão
      if (y > b.y1 - 30) continue; ocupados.push([side, y]);
      const d = h('img', { class: `mp-stk ${side}${k % 2 ? ' b' : ''}`, src: stkSrc(name), alt: '', 'aria-hidden': 'true', draggable: 'false', style: `top:${pct(y, L.H)};--rot:${(k % 2 ? 1 : -1) * (6 + k * 3)}deg` }); world.append(d); decorEls.push({ el: d, side, y });
    }
    decorOf(c).forEach(([name, side, f], k) => {
      const span = b.y1 - b.y0 - 84; const y = b.y0 + 84 + span * f;
      const d = h('span', { class: `mp-deco ${side}${k % 2 ? ' b' : ''}`, 'data-s': name, style: `top:${pct(y, L.H)}` }); d.innerHTML = sprite(name); world.append(d); decorEls.push({ el: d, side: side === 'l' ? 'l' : 'r', y });
    });
  });
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('class', 'mp-path'); svg.setAttribute('viewBox', `0 0 ${L.W} ${L.H}`); svg.setAttribute('aria-hidden', 'true');
  const mk = (cls, d) => { const p = document.createElementNS(svgNS, 'path'); p.setAttribute('class', cls); p.setAttribute('d', d); p.setAttribute('pathLength', '1'); return p; };
  const litTo = allDone ? nodes.length - 1 : current; // caminho aceso até o disco atual
  const full = pathThrough(L.pts); const lit = pathThrough(L.pts.slice(0, litTo + 1));
  svg.append(mk('mp-road', full), mk('mp-edge', full), lit ? mk('mp-lit', lit) : '');
  world.append(svg);

  const nodeEls = [];
  const aria = (n) => `${unitName} ${n.label}, ${n.state === ST.LOCKED ? 'trancada' : n.state === ST.DONE ? `concluída, ${n.stars} de 3 estrelas` : n.state === ST.CURRENT ? 'fase atual' : 'liberada'}`;
  nodes.forEach((n, i) => {
    const p = pos$(i); const locked = n.state === ST.LOCKED;
    const el = h('button', { type: 'button', class: `mp-node st-${n.state}${n.boss ? ' boss' : ''}`, style: `${at(p.x, p.y)};--i:${i}`, 'data-id': n.id, 'data-pos': i, 'aria-label': aria(n), 'aria-disabled': locked ? 'true' : null, 'aria-current': n.state === ST.CURRENT ? 'step' : null },
      h('span', { class: 'mp-disc' }, h('span', { class: 'mp-lab' }, String(n.label))),
      n.state === ST.DONE ? h('span', { class: 'mp-stars', 'aria-hidden': 'true' }, ...[1, 2, 3].map((s) => h('i', { class: s <= n.stars ? 'on' : '', style: `--d:${s * 0.12}s` }, '★'))) : null,
      h('span', { class: 'mp-tag' }, locked ? '' : (n.tag || ''), n.best != null && !locked ? ` ${typeof n.best === 'number' ? `${n.best}%` : n.best}` : ''));
    if (locked) { const l = h('span', { class: 'mp-lock' }); l.innerHTML = sprite('lock'); el.querySelector('.mp-disc').append(l); }
    nodeEls.push(el); world.append(el);
  });

  /* ---- Paul ---- */
  const paul = h('div', { class: 'mp-paul' }); const say = h('span', { class: 'mp-say', hidden: true });
  const paulImg = h('span', { class: 'mp-pimg' }); const setMood = (m) => { paulImg.innerHTML = `<img class="mp-cor" src="${corSrc(poseDe(m, poseDoJogo(gameId)))}" alt="Paul" draggable="false">`; };
  paul.append(paulImg, say); world.append(paul);
  let saidT = 0; const speak = (t, ms = 2400) => { say.textContent = t; say.hidden = false; S.cancel(saidT); saidT = S.later(() => { say.hidden = true; }, ms); };
  const place = (i) => { const w = world.clientWidth || 360; const k = w / L.W; const p = pos$(i); const side = p.x > 180 ? -1 : 1; const lado = side < 0 ? 'l' : 'r'; for (const d of decorEls) d.el.style.visibility = d.side === lado && Math.abs(d.y - p.y) < 64 ? 'hidden' : ''; paul.style.transform = `translate(${(p.x + side * 62) * k}px, ${(p.y - 40) * k}px)`; paul.dataset.at = String(i); paul.classList.toggle('flip', side < 0); };
  const startAt = celebrate ? Math.max(0, celebrate.pos) : current; // se acabou de concluir, o Paul sai do disco concluído e anda até o próximo
  setMood(celebrate ? 'cheer' : 'happy'); place(startAt);
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => place(Number(paul.dataset.at))) : null; if (ro) { ro.observe(world); S.add(() => ro.disconnect()); }

  const root = h('div', { class: 'mp bmr', 'data-game': gameId, 'data-theme': theme ? theme.id : null, style: null }, head, world);
  host.replaceChildren(root); // bmr: fora da regra global de cantos retos (os discos são redondos)
  const tw = document.querySelector('.topwrap'); if (tw) head.style.top = `${Math.round(tw.getBoundingClientRect().height)}px`; // o cabeçalho do mapa gruda logo abaixo do topo do app

  /* ---- regiões ---- */
  let regI = -1; let armed = false;
  const setRegion = (ci, sound) => {
    if (ci === regI || !chapters[ci]) return; regI = ci; const c = chapters[ci];
    regionName.textContent = c.name; regionSub.textContent = c.sub; root.dataset.region = c.id;
    if (motion) { const r = head.querySelector('.mp-reg'); r.classList.remove('flip'); void r.offsetWidth; r.classList.add('flip'); }
    if (sound && armed) sfx.play('region');
  };
  const nodeRegion = (i) => regionOf(chapters, i);
  setRegion(nodeRegion(current), false);
  if (typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) setRegion(Number(e.target.dataset.i), true); }); }, { rootMargin: '-45% 0px -45% 0px' });
    world.querySelectorAll('.mp-band').forEach((b) => io.observe(b)); S.add(() => io.disconnect());
  }

  /* ---- foco: abre já no disco certo (nunca no começo) ---- */
  const lastO = sess(lastKey); const recent = lastO && Date.now() - lastO.t < 180000 && lastO.pos >= 0 && lastO.pos < nodes.length;
  const focusPos = celebrate ? current : recent ? lastO.pos : current;
  const center = (i, smooth) => { const el = nodeEls[i]; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: smooth && motion ? 'smooth' : 'auto' }); };
  S.raf(() => S.raf(() => { center(focusPos, false); S.later(() => { armed = true; }, 900); }));

  /* ---- toques ---- */
  let busy = false;
  const open = (i) => {
    const n = nodes[i]; if (!n || busy) return;
    if (n.state === ST.LOCKED) {
      const el = nodeEls[i]; el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); sfx.play('locked'); speak('ainda trancada!', 1800);
      toast(cfg.lockedMsg || 'ganha 1 estrela na fase anterior pra abrir', { ms: 2200, id: 'mp-lock' }); return;
    }
    busy = true; sess(lastKey, { pos: i, t: Date.now() }); sfx.play('disc');
    const el = nodeEls[i]; el.classList.add('press');
    const go = () => { sfx.dispose(); onOpen(n); };
    if (motion) S.later(go, 110); else go();
  };
  S.on(world, 'click', (e) => { const b = e.target.closest('.mp-node'); if (b) open(Number(b.dataset.pos)); });
  S.on(world, 'keydown', (e) => {
    const b = e.target.closest('.mp-node'); if (!b) return; const i = Number(b.dataset.pos);
    const to = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? i - 1 : null;
    if (to !== null && nodeEls[to]) { e.preventDefault(); nodeEls[to].focus(); center(to, true); }
  });
  S.on(world, 'pointerdown', (e) => { const b = e.target.closest('.mp-node'); if (b && b.getAttribute('aria-disabled') !== 'true') b.classList.add('down'); });
  S.on(window, 'pointerup', () => world.querySelectorAll('.mp-node.down').forEach((b) => b.classList.remove('down')));
  S.on(window, 'pointercancel', () => world.querySelectorAll('.mp-node.down').forEach((b) => b.classList.remove('down')));

  /* ---- comemoração (só quando uma fase foi concluída desde a última vez que o mapa foi visto) ---- */
  const burst = (el) => {
    if (!motion) return; const n = 12;
    for (let k = 0; k < n; k++) { const s = h('i', { class: 'mp-part', style: `--a:${(360 / n) * k}deg;--r:${34 + (k % 3) * 10}px` }); el.append(s); s.addEventListener('animationend', () => s.remove(), { once: true }); }
  };
  if (celebrate) {
    const fromEl = nodeEls[celebrate.pos]; const toEl = nodeEls[current]; fromEl.classList.add('pop');
    S.later(() => { sfx.play('star'); burst(fromEl); fromEl.querySelectorAll('.mp-stars i.on').forEach((s) => s.classList.add('shine')); speak(SAY.cheer); }, 350);
    S.later(() => {
      world.classList.add('lighting'); sfx.play(celebrate.pos === current ? 'win' : 'unlock'); place(current); setMood(allDone ? 'cheer' : 'happy');
      if (celebrate.pos !== current) { toEl.classList.add('unlocked'); burst(toEl); speak(allDone ? SAY.done : SAY.next); } else speak(SAY.done);
      center(current, true);
    }, 1100);
  } else {
    S.later(() => speak(allDone ? SAY.done : SAY.start, 2000), 700);
  }
  // guarda o que já foi visto só DEPOIS de montar (nunca grava lista vazia por carregamento)
  if (nodes.length) store(seenKey, doneIds(nodes));

  return () => { S.dispose(); sfx.dispose(); };
}
