// Jogo da memória (entrada única): escolha entre FIGURAS E INSTRUMENTOS (o jogo dos Kids, #/kids/memoria) e ARTISTAS (este). Não existe modo misturado.
// Memória de Artistas: pares de ARTISTAS/BANDAS sorteados do catálogo de fotos (1 artista = 1 par, nunca repete entidade).
// Jogo livre: NÃO concede figurinhas, pacotes, moedas nem prêmios. Recordes ficam só neste aparelho (localStorage).
import { h } from '../util.js';
import { getGame, setGame, sfx } from './base.js';
import { ENTIDADES } from './cara-musical/elenco.js';
import { mini, loadCat, posOf } from './cara-musical/midia.js';
import { agrupar, elegiveis, contagens, sortearPares, montarCartas, FILTROS, NIVEIS } from './artistas-logic.js';

const FALAS = ['bora achar os pares!', 'lembra onde ficou cada um?', 'quase lá, continua!', 'cada artista aparece duas vezes.', 'sem pressa, o tempo não conta contra você.'];
const reduz = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function mount(host) {
  const saved = getGame('memart');
  let nivel = NIVEIS.some((n) => n[0] === saved.nivel) ? saved.nivel : 'kids';
  let filtro = FILTROS.some((f) => f[0] === saved.filtro) ? saved.filtro : 'tudo';
  let diferentes = !!saved.diferentes; let dicaOn = saved.dica !== false;
  let gone = false; const timers = new Set(); let tick = null;
  let artistas = []; let faltando = []; let ultimos = []; let G = null; let msgI = 0;
  const root = h('div', { class: 'jg jg-memart' }); host.replaceChildren(root);
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!gone) fn(); }, ms); timers.add(id); return id; };
  const stopTick = () => { if (tick) { clearInterval(tick); tick = null; } };

  const foto = (c, cls = '') => {
    const img = h('img', { src: mini(c), alt: '', loading: 'lazy', draggable: 'false', class: cls, style: `object-position:${posOf(c)}` });
    img.addEventListener('error', () => { const f = h('span', { class: 'ma-fb' }); img.replaceWith(f); f.dataset.fb = '1'; console.warn('memória de artistas: foto ausente', c); });
    return img;
  };

  /* ---------- entrada: dois jogos separados (sem modo misturado) ---------- */
  const inicio = () => {
    stopTick(); G = null;
    root.replaceChildren(h('h2', { class: 'jg-h hand' }, 'jogo da memória'), h('p', { class: 'jg-p' }, 'escolha com o que você quer jogar:'),
      h('div', { class: 'ma-esc' },
        h('a', { class: 'ma-esc-b', href: '#/kids/memoria' }, h('span', { class: 'ma-esc-i', 'aria-hidden': 'true' }, '🥁'), h('b', {}, 'figuras e instrumentos'), h('small', {}, '4, 8 ou 12 pares · 1 ou 2 jogadores')),
        h('button', { type: 'button', class: 'ma-esc-b', onclick: menu }, h('span', { class: 'ma-esc-i', 'aria-hidden': 'true' }, '🎤'), h('b', {}, 'artistas e bandas'), h('small', {}, '4 a 12 pares · sorteia artistas novos a cada partida'))));
  };
  /* ---------- seleção ---------- */
  const menu = () => {
    stopTick(); G = null;
    const cont = contagens(artistas); const lvl = NIVEIS.find((n) => n[0] === nivel); const pool = elegiveis(artistas, filtro);
    const falta = pool.length < lvl[2];
    const chip = (on, label, fn, dis, extra) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(on), class: on ? 'on' : '', disabled: dis || null, onclick: fn }, label, extra || null);
    root.replaceChildren(
      h('button', { type: 'button', class: 'btn small ghost', onclick: inicio }, '‹ outro jogo da memória'), h('h2', { class: 'jg-h hand' }, 'memória de artistas'),
      h('p', { class: 'jg-p' }, 'ache os dois cartões do mesmo artista ou banda. a cada partida os artistas são sorteados de novo. não ganha figurinha: é só pra se divertir!'),
      h('div', { class: 'ma-sec' }, h('b', {}, 'dificuldade'), h('div', { class: 'jg-seg', role: 'radiogroup', 'aria-label': 'dificuldade' },
        ...NIVEIS.map(([v, l, n]) => chip(nivel === v, `${l} · ${n} pares`, () => { nivel = v; setGame('memart', { nivel }); menu(); })))),
      h('div', { class: 'ma-sec' }, h('b', {}, 'quais artistas'), h('div', { class: 'jg-seg sm', role: 'radiogroup', 'aria-label': 'coleção' },
        ...FILTROS.map(([v, l]) => chip(filtro === v, `${l} (${cont[v]})`, () => { filtro = v; setGame('memart', { filtro }); menu(); }, cont[v] < 2)))),
      h('label', { class: 'ma-chk' }, h('input', { type: 'checkbox', checked: diferentes || null, onchange: (e) => { diferentes = e.target.checked; setGame('memart', { diferentes }); menu(); } }), ' modo avançado: duas fotos diferentes do mesmo artista (quando houver)'),
      h('label', { class: 'ma-chk' }, h('input', { type: 'checkbox', checked: dicaOn || null, onchange: (e) => { dicaOn = e.target.checked; setGame('memart', { dica: dicaOn }); } }), ' mostrar o botão de dica'),
      falta ? h('p', { class: 'ma-aviso', role: 'status' }, `com “${(FILTROS.find((f) => f[0] === filtro) || [])[1]}” só dá pra montar ${pool.length} pares. escolha um nível menor ou amplie a coleção.`) : null,
      falta && pool.length >= 2 ? h('button', { type: 'button', class: 'btn wide', onclick: () => iniciar(pool.length) }, `jogar com ${pool.length} pares`) : null,
      h('button', { type: 'button', class: 'btn primary wide ma-go', disabled: falta || null, onclick: () => iniciar(lvl[2]) }, 'jogar'),
      recordesEl());
  };
  const recKey = (n) => `${nivel}|${filtro}|${diferentes ? 'd' : 'p'}|${n}`;
  const recordesEl = () => { const r = (getGame('memart').rec || {})[recKey(NIVEIS.find((n) => n[0] === nivel)[2])]; return r ? h('p', { class: 'muted ma-rec' }, `seu recorde aqui: ${r.tent} tentativas · ${fmt(r.seg)}`) : null; };

  /* ---------- partida ---------- */
  function iniciar(n) {
    stopTick(); for (const id of timers) clearTimeout(id); timers.clear();
    const sorteio = sortearPares(elegiveis(artistas, filtro), n, { evitar: ultimos });
    if (!sorteio) { menu(); return; }
    ultimos = sorteio.map((a) => a.id);
    const cartas = montarCartas(sorteio, { diferentes });
    G = { n, cartas, abertas: [], achados: new Set(), tent: 0, trava: false, t0: Date.now(), seg: 0, fim: false };
    const grade = h('div', { class: `ma-grid ma-n${n}`, role: 'group', 'aria-label': 'cartas da memória' });
    const placar = h('p', { class: 'ma-placar', role: 'status' });
    const fala = h('p', { class: 'ma-paul' }); const nome = h('p', { class: 'ma-nome', 'aria-live': 'polite' }, ' ');
    const els = cartas.map((c, i) => {
      const b = h('button', { type: 'button', class: 'ma-card', 'aria-label': `carta ${i + 1}, virada para baixo` },
        h('span', { class: 'ma-in' }, h('span', { class: 'ma-back' }, h('span', { class: 'ma-bolt', 'aria-hidden': 'true' }, '⚡'), h('small', {}, 'Beaterista')), h('span', { class: 'ma-front' }, foto(c.foto), h('span', { class: 'ma-cap' }, c.artista.curto))));
      b.addEventListener('click', () => virar(i)); return b;
    });
    grade.append(...els);
    const desenha = () => { placar.textContent = `${G.achados.size} de ${G.n} pares · ${G.tent} tentativas · ${fmt(G.seg)}`; };
    G.ui = { els, nome, fala, desenha, grade };
    root.replaceChildren(
      h('div', { class: 'ma-top' }, h('button', { type: 'button', class: 'btn small ghost', onclick: menu }, '‹ mudar'), placar,
        dicaOn ? h('button', { type: 'button', class: 'btn small', onclick: dica }, '💡 dica') : null,
        null),
      grade, nome, fala);
    fala.textContent = `Paul: ${FALAS[0]}`; desenha();
    tick = setInterval(() => { if (G && !G.fim) { G.seg = Math.floor((Date.now() - G.t0) / 1000); G.ui.desenha(); } }, 1000);
  }
  function marca(i, aberta) { const e = G.ui.els[i]; e.classList.toggle('open', aberta); const c = G.cartas[i]; e.setAttribute('aria-label', aberta ? `carta ${i + 1}: ${c.artista.nome}` : `carta ${i + 1}, virada para baixo`); }
  function virar(i) {
    if (!G || G.fim || G.trava || G.abertas.includes(i) || G.achados.has(G.cartas[i].par)) return;
    G.abertas.push(i); marca(i, true); sfx('tap');
    if (G.abertas.length < 2) return;
    G.trava = true; G.tent++; const [a, b] = G.abertas; const ca = G.cartas[a], cb = G.cartas[b];
    if (ca.par === cb.par) {
      later(() => {
        G.achados.add(ca.par); G.ui.els[a].classList.add('ok'); G.ui.els[b].classList.add('ok'); sfx('place');
        G.ui.nome.textContent = ca.artista.nome; G.abertas = []; G.trava = false; G.ui.fala.textContent = `Paul: ${FALAS[1 + (msgI++ % 4)]}`; G.ui.desenha();
        if (G.achados.size === G.n) fim();
      }, reduz() ? 0 : 350);
    } else {
      later(() => { sfx('bad'); }, 250);
      later(() => { marca(a, false); marca(b, false); G.abertas = []; G.trava = false; G.ui.desenha(); }, 1000);
    }
    G.ui.desenha();
  }
  function dica() {
    if (!G || G.fim || G.trava) return;
    const livre = G.cartas.map((c, i) => i).filter((i) => !G.achados.has(G.cartas[i].par) && !G.abertas.includes(i));
    if (!livre.length) return;
    const par = G.cartas[livre[0]].par; const dois = livre.filter((i) => G.cartas[i].par === par);
    dois.forEach((i) => G.ui.els[i].classList.add('dica')); G.ui.fala.textContent = 'Paul: olha só estes dois, brilhando!';
    later(() => { dois.forEach((i) => G.ui.els[i].classList.remove('dica')); }, 1600);
  }
  function fim() {
    G.fim = true; stopTick(); G.seg = Math.floor((Date.now() - G.t0) / 1000); sfx('win');
    const key = recKey(G.n); const rec = { ...(getGame('memart').rec || {}) }; const old = rec[key];
    const novo = !old || G.tent < old.tent || (G.tent === old.tent && G.seg < old.seg);
    if (novo) { rec[key] = { tent: G.tent, seg: G.seg }; setGame('memart', { rec }); }
    const n = G.n;
    G.ui.fala.textContent = 'Paul: você achou todos os pares! 🎉';
    const painel = h('div', { class: 'ma-fim', role: 'dialog', 'aria-label': 'partida concluída' },
      h('h3', { class: 'hand' }, 'todos os pares!'), h('p', {}, `${G.tent} tentativas · ${fmt(G.seg)}${novo ? ' · novo recorde!' : ''}`),
      h('p', { class: 'muted' }, 'artistas desta partida: ' + [...new Set(G.cartas.map((c) => c.artista.curto))].join(', ')),
      h('div', { class: 'row', style: 'gap:8px;flex-wrap:wrap;justify-content:center' },
        h('button', { type: 'button', class: 'btn primary', onclick: () => iniciar(n) }, 'jogar de novo'),
        h('button', { type: 'button', class: 'btn', onclick: menu }, 'mudar dificuldade'),
        h('button', { type: 'button', class: 'btn ghost', onclick: () => { history.length > 1 ? history.back() : (location.hash = '#/jogos'); } }, 'voltar')));
    root.append(painel);
    if (!reduz()) { const c = h('div', { class: 'ma-conf', 'aria-hidden': 'true' }, ...Array.from({ length: 24 }, (_, k) => h('i', { style: `--x:${(k * 37) % 100}%;--d:${(k % 6) * 0.12}s;--c:${['#b5162b', '#e8a92c', '#1d3566', '#f5ead2'][k % 4]}` }))); root.append(c); later(() => c.remove(), 2600); }
  }

  root.replaceChildren(h('p', { class: 'muted' }, 'carregando os artistas…'));
  (async () => {
    let cat = []; try { cat = await (await fetch('assets/figurinhas/catalogo.json')).json(); await loadCat(); } catch { /* sem catálogo: lista vazia */ }
    if (gone) return; const r = agrupar(ENTIDADES, cat); artistas = r.artistas; faltando = r.faltando; if (faltando.length) console.warn('memória de artistas: fotos fora do catálogo', faltando);
    if (!artistas.length) { root.replaceChildren(h('p', { class: 'ma-aviso' }, 'não consegui carregar os artistas agora. tente de novo mais tarde.')); return; }
    inicio();
  })();
  return {
    inProgress: () => !!(G && !G.fim && G.achados.size > 0),
    restart: () => { if (gone || !artistas.length) return; if (G) iniciar(G.n); else inicio(); },
    destroy() { gone = true; stopTick(); for (const id of timers) clearTimeout(id); timers.clear(); },
  };
}
