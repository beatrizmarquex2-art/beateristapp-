// Álbum de figurinhas da Beaterista: coleções, espaços numerados, pacotes, colar, detalhe com zoom.
// Progresso salvo no registro 'figurinhas-album' do app (IndexedDB; sincroniza pela conta como o resto, quando há login).
import { h, todayKey } from '../util.js';
import { banner, sheet, toast } from '../ui.js';
import * as store from '../store.js';
import { cardSVG } from '../figurinhas/card.js';
import * as L from '../figurinhas/album-logic.js';
import * as EST from '../figurinhas/estrelas.js';
import * as P from '../kids/progress.js';
import { createBook } from '../figurinhas/livro.js';
import { shareUI } from '../figurinhas/share-ui.js';
import * as Minhas from '../figurinhas/minhas.js';
import * as D from '../figurinhas/dono.js';
import { rufo } from '../figurinhas/roleta-sfx.js';

const TABS = [...L.SECOES, 'Minhas', 'Pacotes'];
const NOTE = { Comum: 'o mundo da música: bandas, bateristas e ídolos', Beatlemania: 'edição psicodélica dos quatro de Liverpool', Beaterista: 'as figurinhas da própria Bea — todas exclusivas', Raras: 'as mais difíceis de achar, incluindo as duplas' };
let catalog = null;
const loadCatalog = async () => (catalog ||= await (await fetch('assets/figurinhas/catalogo.json')).json());
const aspectOf = (e) => e.largura_px / e.altura_px;
const svgOf = (e, uid) => cardSVG(e, { url: e.foto, aspect: aspectOf(e), uid });
const wantsLess = (s) => !!s.reduzir || matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mount(host, parts = [], opts = {}) {
  const wrap = h('div', { class: 'fig' });
  host.append(banner('Álbum', 'cole todas as figurinhas'), wrap);
  const ID = D.albumId(); // o álbum é de quem está com o nome agora
  let state = { ...L.emptyState(), ...D.albumDados() };
  const nuvem = typeof opts.salvar === 'function'; let tSave = null;
  const guardarNaNuvem = () => { if (!nuvem) return; clearTimeout(tSave); tSave = setTimeout(() => opts.salvar(state), 700); };
  if (opts.estado) state = L.mergeStates(state, opts.estado); // junta o que está salvo no Supabase com o deste aparelho
  const explicita = TABS.includes(parts[0]) || !!L.SECAO_ANTIGA[parts[0]];
  let tab = TABS.includes(parts[0]) ? parts[0] : L.SECAO_ANTIGA[parts[0]] || TABS[0], artist = '';
  let alive = true; let io = null; let justPasted = null;

  const save = (next) => { state = next; store.upsert('figurinhas', ID, state); guardarNaNuvem(); draw(); };
  load();
  async function load() {
    wrap.append(h('p', { class: 'fig-note' }, 'carregando álbum…'));
    try { await loadCatalog(); } catch { wrap.replaceChildren(h('p', { class: 'fig-note' }, 'não consegui abrir o catálogo agora. tente de novo com internet.')); return; }
    if (!alive) return;
    // sem pacote de boas-vindas. Check-in: 1 giro grátis da roleta por dia (id do dia, então abrir de novo não entrega outro); o resto vem jogando (roleta a cada 30 ★ e prêmio de jogo completo).
    let s = L.grantPack(state, L.checkinId(todayKey()));
    if (s !== state) { state = s; store.upsert('figurinhas', ID, state); }
    if (nuvem && (!opts.estado || !L.sameProgress(state, opts.estado))) guardarNaNuvem(); // o aparelho tinha coisa que o servidor ainda não tem
    if (!explicita) tab = abaInicial(); // abre direto na coleção/página onde tem o que colar, não na capa
    draw();
  }
  /** Coleção onde tem figurinha na mão pra colar; senão a primeira com buraco; senão a primeira. */
  function abaInicial() {
    for (const sec of L.SECOES) if (catalog.some((c) => c.secao === sec && L.canPaste(state, c.codigo))) return sec;
    for (const sec of L.SECOES) if (L.stats(state, catalog, sec).missing > 0) return sec;
    return L.SECOES[0];
  }

  function draw() {
    if (!catalog) return;
    const pend = L.pendingPacks(state).length, hand = L.inHand(state), all = L.stats(state, catalog);
    const tabs = h('div', { class: 'fig-tabs', role: 'tablist' }, TABS.map((t) => {
      const badge = t === 'Pacotes' ? (pend ? ` ${pend}` : '') : '';
      return h('button', { type: 'button', role: 'tab', class: `chip-btn${t === tab ? ' on' : ''}`, 'aria-selected': String(t === tab), onclick: () => { tab = t; artist = ''; draw(); } }, t.toLowerCase() + badge);
    }));
    const aviso = pend && tab !== 'Pacotes' ? h('button', { type: 'button', class: 'btn fig-giro', onclick: () => { tab = 'Pacotes'; draw(); } }, `🎡 você tem ${pend} pra abrir (giro grátis do dia, roleta ou prêmio) — toque aqui`) : null;
    wrap.replaceChildren(
      h('p', { class: 'fig-total' }, h('b', {}, `${all.got}/${all.total}`), ' coladas no total · ', `${all.missing} faltam · ${hand} na mão`),
      tabs, aviso, tab === 'Pacotes' ? packsView() : tab === 'Minhas' ? minhasView() : collectionView());
    if (tab !== 'Pacotes' && tab !== 'Minhas') requestAnimationFrame(() => { const b = books[tab]; if (!b) return; if (b.novo) { b.novo = false; b.jump(b.firstTarget()); } else b.go(b.current(), false); }); // reanexar o livro zera a rolagem: volta pra mesma página
  }

  /* ---------- coleção: o livro ---------- */
  const books = {};
  function collectionView() {
    const st = L.stats(state, catalog, tab);
    let bk = books[tab];
    if (!bk) { bk = books[tab] = createBook({ catalog, colecao: tab, state, onPaste: doPaste, onDetail: detail, reduzir: wantsLess(state) }); bk.novo = true; }
    else bk.update(state, justPasted);
    justPasted = null;
    const sel = h('select', { class: 'fig-filter', 'aria-label': 'Ir para um artista', onchange: (e) => { const i = bk.pageOfArtist(e.target.value); if (i >= 0) bk.go(i); e.target.value = ''; } },
      h('option', { value: '' }, 'ir para um artista…'), L.artistsOf(catalog, tab).map((a) => h('option', { value: a }, a)));
    const pct = Math.round((st.got / st.total) * 100);
    return h('section', { class: 'fig-col' },
      h('div', { class: 'fig-prog' }, h('div', { class: 'fig-bar', role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i', { style: { width: `${pct}%` } })), h('span', {}, `${st.got} de ${st.total} · faltam ${st.missing}`)),
      sel, bk.el, h('p', { class: 'fig-note' }, NOTE[tab]));
  }

  function doPaste(e) {
    justPasted = e.codigo;
    save(L.paste(state, e.codigo));
    toast(`${e.artista_banda} colada no álbum`);
  }

  /* ---------- minhas: as cartinhas criadas com foto e nome (o mesmo que a coleção do Perfil) ---------- */
  let mcView = null;
  function minhasView() {
    if (mcView) mcView.cleanup(); mcView = Minhas.colecao({ titulo: 'minhas cartinhas', vazio: 'nenhuma ainda. crie a sua na aba Perfil e toque em "guardar na minha coleção".' });
    return h('section', { class: 'fig-col' }, mcView.el, h('a', { class: 'btn wide', href: '#/perfil' }, 'criar uma cartinha (Perfil)'));
  }

  /* ---------- pacotes ---------- */
  function packsView() {
    const ordem = { jogo: 0, roleta: 1, pacote: 2 }; // prêmio de jogo e roleta primeiro, depois os pacotes
    const pend = [...L.pendingPacks(state)].sort((a, b) => ordem[L.packKind(a)] - ordem[L.packKind(b)]), hand = Object.keys(state.inv).map((c) => catalog.find((x) => x.codigo === c)).filter(Boolean);
    const pastable = hand.filter((e) => L.canPaste(state, e.codigo));
    const rep = L.repeated(state);
    const n = (k) => pend.filter((id) => L.packKind(id) === k).length, next = pend[0] ? L.packKind(pend[0]) : null;
    const partes = [n('roleta') ? `🎡 ${n('roleta')} roleta${n('roleta') > 1 ? 's' : ''}` : '', n('jogo') ? `🏆 ${n('jogo')} prêmio${n('jogo') > 1 ? 's' : ''} de jogo` : '', n('pacote') ? `🎁 ${n('pacote')} pacote${n('pacote') > 1 ? 's' : ''}` : ''].filter(Boolean);
    const me = (() => { try { return P.active(); } catch { return null; } })();
    const prog = me ? `faltam ${EST.faltamParaRoleta(EST.estrelasTotais(me.id))} ★ pra próxima roleta (${EST.estrelasTotais(me.id)} ★ no total)` : 'junte 30 ★ nos jogos pra liberar uma roleta de figurinhas';
    return h('section', { class: 'fig-packs' },
      h('div', { class: 'fig-pack-card' },
        h('div', { class: 'fig-pack-art', 'aria-hidden': 'true' }, h('b', {}, next === 'roleta' ? '🎡' : next === 'jogo' ? '🏆' : 'beaterista'), h('span', {}, next === 'roleta' ? '1 a 3 figurinhas' : next === 'jogo' ? '1 pacote com uma rara' : `${next === 'pacote' ? L.packSize(pend[0]) : L.PACK_SIZE} figurinhas`)),
        h('p', {}, partes.length ? `${partes.join(' · ')} pra abrir` : 'nada pra abrir agora.'),
        h('p', { class: 'fig-note' }, `${prog}. 1 giro grátis por dia (check-in) e, ao terminar um jogo inteiro, 1 pacote com uma rara!`),
        h('button', { type: 'button', class: 'btn primary wide', disabled: pend.length ? null : true, onclick: () => openIt(pend[0]) }, next === 'roleta' ? 'girar a roleta' : next === 'jogo' ? 'abrir o prêmio' : 'abrir pacote')),
      h('div', { class: 'fig-hand' },
        h('h2', {}, `na mão (${L.inHand(state)})`),
        h('p', { class: 'fig-note' }, `${pastable.length} pra colar · ${rep} repetida${rep === 1 ? '' : 's'}`),
        pastable.length ? h('button', { type: 'button', class: 'btn primary', onclick: () => { save(L.pasteAll(state)); toast('tudo colado!'); } }, `colar tudo (${pastable.length})`) : null,
        h('div', { class: 'fig-hand-list' }, hand.map((e) => h('button', { type: 'button', class: 'fig-chip', onclick: () => (L.canPaste(state, e.codigo) ? doPaste(e) : detail(e)) }, h('b', {}, e.codigo), ` ${e.artista_banda}`, h('em', {}, state.pasted[e.codigo] ? ' · repetida' : ' · colar'))))),
      h('label', { class: 'fig-opt' }, h('input', { type: 'checkbox', checked: state.reduzir ? true : null, onchange: (e) => save({ ...state, reduzir: e.target.checked }) }), ' animações reduzidas (sem giros ao abrir pacote)'));
  }

  /** Cartas reveladas (viradas uma a uma, ou já abertas) + botões de colar. */
  function revealUI(codes, close, aberto = false) {
    const less = wantsLess(state) || aberto;
    const cards = codes.map((c) => catalog.find((x) => x.codigo === c));
    const row = h('div', { class: `fig-reveal fig-n${cards.length}` });
    const live = h('p', { class: 'fig-note', 'aria-live': 'polite' }, less ? '' : 'toque em cada carta pra virar');
    cards.forEach((e, i) => {
      const dup = state.pasted[e.codigo] || cards.findIndex((x) => x.codigo === e.codigo) < i;
      const el = h('button', { type: 'button', class: `fig-flip${less ? ' open' : ''}`, style: `--d:${i * 180}ms`, 'aria-label': less ? `${e.artista_banda}, ${e.raridade}` : `carta ${i + 1}, virar` });
      el.innerHTML = `<span class="back"><b>beaterista</b></span><span class="front">${svgOf(e, `o${i}${e.codigo}`)}</span>`;
      const flip = () => { if (el.classList.contains('open')) { detail(e); return; } el.classList.add('open'); el.setAttribute('aria-label', `${e.artista_banda}, ${e.raridade}${dup ? ', repetida' : ', nova'}`); live.textContent = `${e.artista_banda} · ${e.raridade}${dup ? ' · repetida' : ' · nova'}`; };
      el.addEventListener('click', flip); row.append(el);
    });
    const nomes = cards.map((e) => `${e.artista_banda} (${e.raridade})`).join(', ');
    return h('div', { class: 'fig-open' }, aberto ? h('p', { class: 'fig-note', role: 'status' }, `você ganhou: ${nomes}`) : live, row,
      h('button', { type: 'button', class: 'btn primary wide', onclick: () => { save(L.pasteAll(state)); close(); toast('coladas no álbum'); } }, 'colar tudo no álbum'),
      h('button', { type: 'button', class: 'btn wide', onclick: close }, 'colar depois'));
  }
  /** Paleta aleatória da roleta (nunca igual de uma vez pra outra): 8 fatias, 2 a 4 cores vivas combinadas com o creme e o azul-marinho da marca. */
  function coresRoleta() {
    const base = Math.floor(Math.random() * 360); const passo = [30, 60, 90, 120, 150][Math.floor(Math.random() * 5)]; const n = 2 + Math.floor(Math.random() * 3);
    const vivas = Array.from({ length: n }, (_, k) => `hsl(${(base + k * passo) % 360} ${70 + Math.floor(Math.random() * 20)}% ${48 + Math.floor(Math.random() * 12)}%)`);
    const neutras = ['#efe2c6', '#17224a', '#fff6e0', '#14111a'];
    const fatias = Array.from({ length: 8 }, (_, k) => (k % 2 === 0 ? vivas[(k / 2) % vivas.length] : neutras[Math.floor(Math.random() * neutras.length)]));
    return `conic-gradient(${fatias.map((c, k) => `${c} 0 ${(k + 1) * 12.5}%`).join(', ')})`;
  }
  /** Pacote comum abre direto; roleta e prêmio de jogo têm a sua cena (girar / abrir o prêmio) e só gastam quando a pessoa gira. */
  function openIt(packId) {
    const kind = L.packKind(packId);
    if (kind === 'pacote') {
      const r = L.openPack(state, catalog, packId); if (!r.fresh) return; save(r.state);
      sheet('seu pacote', (close) => revealUI(r.codes, close)); return;
    }
    const roleta = kind === 'roleta';
    sheet(roleta ? '🎡 roleta de figurinhas' : '🏆 prêmio do jogo completo', (close) => {
      const box = h('div', { class: 'fig-open fig-wheelbox' });
      const disc = h('div', { class: 'fig-wheel-disc' + (roleta ? '' : ' prize'), 'aria-hidden': 'true' }, h('span', { class: 'fig-wheel-hub' }, roleta ? '🎡' : '🏆'));
      if (roleta) disc.style.background = coresRoleta(); // cores diferentes a cada vez
      const go = h('button', { type: 'button', class: 'btn primary wide', onclick: () => {
        go.disabled = true; const r = L.openPack(state, catalog, packId); if (!r.fresh) { close(); return; }
        save(r.state); const mostra = () => box.replaceChildren(revealUI(r.codes, close, true));
        if (wantsLess(state)) { mostra(); return; }
        disc.style.transform = `rotate(${1440 + Math.floor(Math.random() * 360)}deg)`; disc.classList.add('spin'); rufo(3.2); setTimeout(mostra, 3300);
      } }, roleta ? 'girar!' : 'abrir o prêmio');
      box.append(h('p', { class: 'fig-note' }, roleta ? 'gire pra ganhar de 1 a 3 figurinhas. com sorte, vem uma rara, uma dos Beatles… ou uma exclusiva!' : 'você terminou um jogo inteiro! é um pacote de 5 com uma rara garantida.'), h('div', { class: 'fig-wheel' }, disc, h('i', { class: 'fig-wheel-pin', 'aria-hidden': 'true' })), go);
      return box;
    });
  }
  /* ---------- detalhe com zoom ---------- */
  function detail(e) {
    sheet(`${e.codigo} · ${e.artista_banda}`, () => {
      let big = false;
      const view = h('div', { class: 'fig-zoom' }); view.innerHTML = svgOf(e, `d${e.codigo}`);
      const btn = h('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', onclick: () => { big = !big; view.classList.toggle('big', big); btn.setAttribute('aria-pressed', String(big)); btn.textContent = big ? 'diminuir' : 'ampliar'; } }, 'ampliar');
      const share = shareUI(e);
      const box = h('div', { class: 'fig-detail' }, view, h('p', { class: 'fig-note' }, `${e.raridade} · seção ${e.secao} · nº ${L.slotNumber(catalog, e)}`), btn, share);
      box.cleanup = () => share.cleanup();
      return box;
    });
  }

  return () => { alive = false; clearTimeout(tSave); if (mcView) mcView.cleanup(); if (nuvem) opts.salvar(state); };
}
