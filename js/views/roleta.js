// Roleta Musical (aba Tocar): sorteia um ARTISTA ou BANDA pra tocar uma música. Visual de caça-níquel (3 rolos), mas NÃO é aposta:
// sem dinheiro, moedas, créditos nem prêmios. NÃO concede figurinhas. O resultado é decidido ANTES da animação (imparcial, por artista, não por foto)
// e os 3 rolos terminam exatamente nele. Sons originais sintetizados (nada de música comercial). Histórico e filtros só neste aparelho.
import { h } from '../util.js';
import { audio } from '../audio.js';
import { banner } from '../ui.js';
import { getGame, setGame } from '../jogos/base.js';
import { ENTIDADES } from '../jogos/cara-musical/elenco.js';
import { mini, grande, loadCat, enquadreFoto } from '../jogos/cara-musical/midia.js';
import { agrupar, elegiveis, contagens, sortearUm, embaralhar, FILTROS } from '../jogos/artistas-logic.js';
import { tocarTabs } from './tocar-nav.js';

const FILTROS_ROLETA = ['tudo', 'geral', 'beatles', 'beaterista', 'especial', 'solo', 'banda', 'dupla'];
const DURS = [2200, 2900, 3600];
const TIPO = { solo: 'artista solo', banda: 'banda', dupla: 'dupla / colaboração' };
const reduz = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

export function mount(host) {
  const g0 = getGame('roleta');
  let filtro = FILTROS_ROLETA.includes(g0.filtro) ? g0.filtro : 'tudo';
  let evitar = g0.evitar !== false; let som = g0.som !== false;
  let hist = Array.isArray(g0.hist) ? g0.hist.filter((x) => typeof x === 'string').slice(0, 10) : [];
  let artistas = []; let gone = false; let girando = false; const timers = new Set(); let atual = null; let ocioso = [];
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!gone) fn(); }, ms); timers.add(id); return id; };

  /* ---------- sons originais (curtos) ---------- */
  const blip = (f, dur = 0.04, vol = 0.07, type = 'square', t0 = 0) => {
    if (!som) return; try { const c = audio(); const t = c.currentTime + t0; const o = c.createOscillator(); const g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02); } catch { /* sem áudio */ }
  };
  const somInicio = () => [330, 440, 587].forEach((f, i) => blip(f, 0.09, 0.08, 'triangle', i * 0.07));
  const somParada = () => [523, 659, 784].forEach((f) => blip(f, 0.35, 0.07, 'triangle'));
  const somReel = () => blip(620, 0.05, 0.05, 'triangle');

  const root = h('div', { class: 'pad-x rl-root' });
  const machine = h('div', { class: 'rl-machine', 'aria-hidden': 'false' });
  const reels = [0, 1, 2].map(() => ({ win: h('div', { class: 'rl-win' }), strip: h('div', { class: 'rl-strip' }) }));
  reels.forEach((r) => r.win.append(r.strip));
  machine.append(h('div', { class: 'rl-reels' }, ...reels.map((r) => r.win)), h('i', { class: 'rl-line', 'aria-hidden': 'true' }));
  const resultado = h('div', { class: 'rl-result', 'aria-live': 'polite' });
  const spin = h('button', { type: 'button', class: 'btn primary rl-spin' }, 'Girar');
  const painel = h('div', { class: 'rl-pop', hidden: true, role: 'dialog' });
  const filtrosEl = h('div', { class: 'jg jg-seg sm rl-filtros', role: 'radiogroup', 'aria-label': 'filtro de artistas' });
  const histEl = h('div', { class: 'rl-hist' });
  const nota = h('p', { class: 'muted rl-nota', role: 'status' });
  const somBtn = h('button', { type: 'button', class: 'btn small ghost', 'aria-pressed': String(som), onclick: () => { som = !som; setGame('roleta', { som }); somBtn.setAttribute('aria-pressed', String(som)); somBtn.textContent = som ? '🔊 som' : '🔇 mudo'; } }, som ? '🔊 som' : '🔇 mudo');

  const img = (a, cls = '') => {
    const c = a.fotoPrincipal; const im = h('img', { src: mini(c), alt: `foto de ${a.nome}`, class: cls, draggable: 'false', style: enquadreFoto(c) });
    im.addEventListener('error', () => { const f = h('span', { class: 'rl-fb' }, a.curto); im.replaceWith(f); console.warn('roleta: foto ausente', c); });
    return im;
  };
  const item = (a) => h('div', { class: 'rl-it' }, img(a), h('span', { class: 'rl-nm' }, a.curto));
  const lista = () => elegiveis(artistas, filtro);

  /* ---------- rolos ---------- */
  const preparar = (inicial) => { reels.forEach((r, i) => { r.strip.style.transition = 'none'; r.strip.style.transform = 'translateY(0)'; r.strip.style.height = '100%'; r.strip.replaceChildren(item(inicial[i])); }); };
  const mostrarOcioso = () => { const base = lista().length ? lista() : artistas; const e = embaralhar(base); ocioso = [e[0], e[1 % e.length], e[2 % e.length]]; preparar(ocioso); };

  function girar() {
    if (girando || gone) return; const pool = lista(); if (!pool.length) return;
    const s = sortearUm(pool, { recentes: hist, evitar }); const alvo = s.artista; // resultado decidido ANTES da animação
    girando = true; spin.disabled = true; painel.hidden = true; resultado.replaceChildren(); nota.textContent = '';
    if (evitar && s.esgotou) nota.textContent = 'poucos artistas neste filtro: a lista de “evitar repetidos” encolheu.';
    const antes = reels.map((r, i) => (atual && i === 1 ? atual : (ocioso[i] || alvo)));
    const L = 22; const rapido = reduz(); somInicio();
    reels.forEach((r, i) => {
      const mix = embaralhar(pool.length > 1 ? pool : artistas); const itens = [antes[i], ...Array.from({ length: L - 2 }, (_, k) => mix[k % mix.length]), alvo];
      r.strip.style.transition = 'none'; r.strip.style.transform = 'translateY(0)'; r.strip.replaceChildren(...itens.map(item));
      r.strip.querySelectorAll('.rl-it').forEach((e) => { e.style.height = `${100 / itens.length}%`; });
      r.strip.style.height = `${itens.length * 100}%`; void r.strip.offsetHeight;
      const alvoY = -((itens.length - 1) / itens.length) * 100;
      if (rapido) { r.strip.style.transform = `translateY(${alvoY}%)`; return; }
      r.strip.style.transition = `transform ${DURS[i]}ms cubic-bezier(.12,.62,.18,1)`; r.strip.style.transform = `translateY(${alvoY}%)`;
    });
    if (!rapido) { let t = 0; let gap = 70; while (t < DURS[2] - 150) { later(somReel, t); t += gap; gap *= 1.07; } DURS.slice(0, 2).forEach((d) => later(() => blip(780, 0.12, 0.08, 'triangle'), d)); }
    later(() => { girando = false; spin.disabled = false; atual = alvo; somParada(); fim(alvo); }, rapido ? 50 : DURS[2] + 120);
  }

  function fim(a) {
    hist = [a.id, ...hist.filter((x) => x !== a.id)].slice(0, 10); setGame('roleta', { hist });
    resultado.replaceChildren(
      h('div', { class: 'rl-card' }, h('div', { class: 'rl-foto' }, img(a, 'rl-big')),
        h('div', { class: 'rl-txt' }, h('p', { class: 'rl-frase hand' }, `Hoje é dia de tocar uma música de ${a.nome}!`),
          h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap' },
            h('button', { type: 'button', class: 'btn primary', onclick: () => tocarAgora(a) }, 'Tocar agora'),
            h('button', { type: 'button', class: 'btn', onclick: () => ver(a) }, 'Ver artista'),
            h('button', { type: 'button', class: 'btn ghost', onclick: girar }, 'Sortear novamente')))));
    desenhaHist(); resultado.scrollIntoView?.({ block: 'nearest', behavior: reduz() ? 'auto' : 'smooth' });
  }

  const abre = (...filhos) => { painel.replaceChildren(h('div', { class: 'rl-pop-in' }, ...filhos, h('button', { type: 'button', class: 'btn wide', onclick: () => { painel.hidden = true; spin.focus(); } }, 'fechar'))); painel.hidden = false; painel.querySelector('button')?.focus(); };
  function ver(a) {
    const big = h('img', { src: grande(a.fotoPrincipal), alt: `foto de ${a.nome}`, class: 'rl-pop-img' }); big.addEventListener('error', () => { big.src = mini(a.fotoPrincipal); }, { once: true });
    abre(h('h3', { class: 'hand' }, a.nome), big,
      h('p', { class: 'muted' }, [a.tipo ? TIPO[a.tipo] : null, `coleção: ${a.colecoes.join(', ')}`, `${a.fotos.length} ${a.fotos.length === 1 ? 'foto' : 'fotos'} no catálogo`].filter(Boolean).join(' · ')));
  }
  function tocarAgora(a) {
    abre(h('h3', { class: 'hand' }, `Escolha uma música de ${a.nome} para tocar`), h('p', {}, 'escolha o seu instrumento e toque uma música deste artista que você já conheça. a roleta não toca nenhuma gravação.'),
      h('div', { class: 'rl-inst' }, ...[['toque', '🥁 bateria'], ['violao', '🎸 violão'], ['piano', '🎹 piano'], ['xilofone', '🎶 xilofone']].map(([r, l]) => h('a', { class: 'btn', href: `#/${r}` }, l))));
  }

  /* ---------- filtros e histórico ---------- */
  const desenhaFiltros = () => {
    const cont = contagens(artistas);
    filtrosEl.replaceChildren(...FILTROS_ROLETA.map((id) => { const f = FILTROS.find((x) => x[0] === id); const n = cont[id]; const on = id === filtro;
      return h('button', { type: 'button', role: 'radio', 'aria-checked': String(on), class: on ? 'on' : '', disabled: n < 1 || null, onclick: () => { filtro = id; setGame('roleta', { filtro }); desenhaFiltros(); mostrarOcioso(); resultado.replaceChildren(); atual = null; elegDesenha(); } }, `${f[1]} (${n})`); }));
  };
  const elegDesenha = () => { const n = lista().length; nota.textContent = `${n} ${n === 1 ? 'artista elegível' : 'artistas elegíveis'} neste filtro`; spin.disabled = girando || n < 1; };
  const desenhaHist = () => {
    const por = new Map(artistas.map((a) => [a.id, a]));
    histEl.replaceChildren(h('b', {}, 'últimos sorteios'), hist.length ? h('ol', { class: 'rl-hl' }, ...hist.map((id) => por.get(id)).filter(Boolean).map((a) => h('li', {}, a.curto))) : h('p', { class: 'muted' }, 'nada sorteado ainda.'),
      hist.length ? h('button', { type: 'button', class: 'btn small ghost', onclick: () => { hist = []; setGame('roleta', { hist }); desenhaHist(); } }, 'limpar') : null);
  };

  spin.addEventListener('click', girar);
  const evCk = h('input', { type: 'checkbox', checked: evitar || null, onchange: (e) => { evitar = e.target.checked; setGame('roleta', { evitar }); } });
  root.append(h('div', { class: 'card pad rl-card-main' },
    h('h2', { class: 'tag' }, 'Roleta Musical'), h('p', { class: 'muted' }, 'vamos tocar e conhecer mais sobre:'),
    machine, spin, h('div', { class: 'row', style: 'justify-content:space-between;gap:8px;flex-wrap:wrap' }, somBtn),
    resultado, painel),
    h('div', { class: 'card pad' }, h('b', {}, 'quais artistas'), filtrosEl, nota, h('label', { class: 'rl-chk' }, evCk, ' evitar repetir os últimos sorteados'), histEl));
  host.append(banner('Roleta Musical', 'sorteia um artista pra você tocar'), tocarTabs('roleta'), root);
  spin.disabled = true;

  (async () => {
    let cat = []; try { cat = await (await fetch('assets/figurinhas/catalogo.json')).json(); await loadCat(); } catch { /* sem catálogo */ }
    if (gone) return; const r = agrupar(ENTIDADES, cat); artistas = r.artistas; if (r.faltando.length) console.warn('roleta: fotos fora do catálogo', r.faltando);
    if (!artistas.length) { nota.textContent = 'não consegui carregar os artistas agora.'; return; }
    if (!lista().length) filtro = 'tudo';
    desenhaFiltros(); mostrarOcioso(); elegDesenha(); desenhaHist();
  })();
  return { destroy() { gone = true; for (const id of timers) clearTimeout(id); timers.clear(); } };
}
