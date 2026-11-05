// Álbum de figurinhas da Beaterista: coleções, espaços numerados, pacotes, colar, detalhe com zoom.
// Progresso salvo no registro 'figurinhas-album' do app (IndexedDB; sincroniza pela conta como o resto, quando há login).
import { h, todayKey } from '../util.js';
import { banner, sheet, toast } from '../ui.js';
import * as store from '../store.js';
import { cardSVG } from '../figurinhas/card.js';
import * as L from '../figurinhas/album-logic.js';
import { createBook } from '../figurinhas/livro.js';
import * as Postar from '../figurinhas/postar.js';

const ID = 'figurinhas-album';
const TABS = [...L.SECOES, 'Pacotes'];
const NOTE = { Comum: 'o mundo da música: bandas, bateristas e ídolos', Beatlemania: 'edição psicodélica dos quatro de Liverpool', Beaterista: 'as figurinhas da própria Bea — todas exclusivas', Raras: 'as mais difíceis de achar, incluindo as duplas' };
let catalog = null;
const loadCatalog = async () => (catalog ||= await (await fetch('assets/figurinhas/catalogo.json')).json());
const aspectOf = (e) => e.largura_px / e.altura_px;
const svgOf = (e, uid) => cardSVG(e, { url: e.foto, aspect: aspectOf(e), uid });
const wantsLess = (s) => !!s.reduzir || matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mount(host, parts = [], opts = {}) {
  const wrap = h('div', { class: 'fig' });
  host.append(banner('Álbum', 'cole todas as figurinhas'), wrap);
  let state = { ...L.emptyState(), ...(store.get(ID)?.data || {}) };
  const nuvem = typeof opts.salvar === 'function'; let tSave = null;
  const guardarNaNuvem = () => { if (!nuvem) return; clearTimeout(tSave); tSave = setTimeout(() => opts.salvar(state), 700); };
  if (opts.estado) state = L.mergeStates(state, opts.estado); // junta o que está salvo no Supabase com o deste aparelho
  let tab = TABS.includes(parts[0]) ? parts[0] : L.SECAO_ANTIGA[parts[0]] || TABS[0], artist = '';
  let alive = true; let io = null; let justPasted = null;

  const save = (next) => { state = next; store.upsert('figurinhas', ID, state); guardarNaNuvem(); draw(); };
  load();
  async function load() {
    wrap.append(h('p', { class: 'fig-note' }, 'carregando álbum…'));
    try { await loadCatalog(); } catch { wrap.replaceChildren(h('p', { class: 'fig-note' }, 'não consegui abrir o catálogo agora. tente de novo com internet.')); return; }
    if (!alive) return;
    // pacotes de presente: 1 de boas-vindas e 1 por dia. Cada um tem id próprio, então abrir o app de novo não entrega em dobro.
    let s = L.grantPack(state, L.WELCOME_PACK); s = L.grantPack(s, L.dailyPackId(todayKey()));
    if (s !== state) { state = s; store.upsert('figurinhas', ID, state); }
    if (nuvem && (!opts.estado || !L.sameProgress(state, opts.estado))) guardarNaNuvem(); // o aparelho tinha coisa que o servidor ainda não tem
    draw();
  }

  function draw() {
    if (!catalog) return;
    const pend = L.pendingPacks(state).length, hand = L.inHand(state), all = L.stats(state, catalog);
    const tabs = h('div', { class: 'fig-tabs', role: 'tablist' }, TABS.map((t) => {
      const badge = t === 'Pacotes' ? (pend ? ` ${pend}` : '') : '';
      return h('button', { type: 'button', role: 'tab', class: `chip-btn${t === tab ? ' on' : ''}`, 'aria-selected': String(t === tab), onclick: () => { tab = t; artist = ''; draw(); } }, t.toLowerCase() + badge);
    }));
    wrap.replaceChildren(
      h('p', { class: 'fig-total' }, h('b', {}, `${all.got}/${all.total}`), ' coladas no total · ', `${all.missing} faltam · ${hand} na mão`),
      tabs, tab === 'Pacotes' ? packsView() : collectionView());
    if (tab !== 'Pacotes') requestAnimationFrame(() => { const b = books[tab]; if (b) b.go(b.current(), false); }); // reanexar o livro zera a rolagem: volta pra mesma página
  }

  /* ---------- coleção: o livro ---------- */
  const books = {};
  function collectionView() {
    const st = L.stats(state, catalog, tab);
    let bk = books[tab];
    if (!bk) bk = books[tab] = createBook({ catalog, colecao: tab, state, onPaste: doPaste, onDetail: detail, reduzir: wantsLess(state) });
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

  /* ---------- pacotes ---------- */
  function packsView() {
    const pend = L.pendingPacks(state), hand = Object.keys(state.inv).map((c) => catalog.find((x) => x.codigo === c)).filter(Boolean);
    const pastable = hand.filter((e) => L.canPaste(state, e.codigo));
    const rep = L.repeated(state);
    return h('section', { class: 'fig-packs' },
      h('div', { class: 'fig-pack-card' },
        h('div', { class: 'fig-pack-art', 'aria-hidden': 'true' }, h('b', {}, 'beaterista'), h('span', {}, `${L.PACK_SIZE} figurinhas`)),
        h('p', {}, pend.length ? `${pend.length} pacote${pend.length > 1 ? 's' : ''} pra abrir` : 'nenhum pacote agora — volte amanhã, tem um novo todo dia.'),
        h('button', { type: 'button', class: 'btn primary wide', disabled: pend.length ? null : true, onclick: () => openIt(pend[0]) }, 'abrir pacote')),
      h('div', { class: 'fig-hand' },
        h('h2', {}, `na mão (${L.inHand(state)})`),
        h('p', { class: 'fig-note' }, `${pastable.length} pra colar · ${rep} repetida${rep === 1 ? '' : 's'}`),
        pastable.length ? h('button', { type: 'button', class: 'btn primary', onclick: () => { save(L.pasteAll(state)); toast('tudo colado!'); } }, `colar tudo (${pastable.length})`) : null,
        h('div', { class: 'fig-hand-list' }, hand.map((e) => h('button', { type: 'button', class: 'fig-chip', onclick: () => (L.canPaste(state, e.codigo) ? doPaste(e) : detail(e)) }, h('b', {}, e.codigo), ` ${e.artista_banda}`, h('em', {}, state.pasted[e.codigo] ? ' · repetida' : ' · colar'))))),
      h('label', { class: 'fig-opt' }, h('input', { type: 'checkbox', checked: state.reduzir ? true : null, onchange: (e) => save({ ...state, reduzir: e.target.checked }) }), ' animações reduzidas (sem giros ao abrir pacote)'));
  }

  function openIt(packId) {
    const r = L.openPack(state, catalog, packId); if (!r.fresh) return;
    save(r.state);
    const less = wantsLess(state);
    sheet('seu pacote', (close) => {
      const cards = r.codes.map((c) => catalog.find((x) => x.codigo === c));
      const seen = new Set(); let shown = 0;
      const row = h('div', { class: 'fig-reveal' });
      const live = h('p', { class: 'fig-note', 'aria-live': 'polite' }, less ? '' : 'toque em cada carta pra virar');
      cards.forEach((e, i) => {
        const dup = state.pasted[e.codigo] || cards.findIndex((x) => x.codigo === e.codigo) < i;
        const el = h('button', { type: 'button', class: `fig-flip${less ? ' open' : ''}`, 'aria-label': less ? `${e.artista_banda}, ${e.raridade}` : `carta ${i + 1}, virar` });
        el.innerHTML = `<span class="back"><b>beaterista</b></span><span class="front">${svgOf(e, `o${i}${e.codigo}`)}</span>`;
        const flip = () => { if (el.classList.contains('open')) { detail(e); return; } el.classList.add('open'); el.setAttribute('aria-label', `${e.artista_banda}, ${e.raridade}${dup ? ', repetida' : ', nova'}`); live.textContent = `${e.artista_banda} · ${e.raridade}${dup ? ' · repetida' : ' · nova'}`; shown++; };
        el.addEventListener('click', flip); row.append(el);
      });
      return h('div', { class: 'fig-open' }, live, row,
        h('button', { type: 'button', class: 'btn primary wide', onclick: () => { save(L.pasteAll(state)); close(); toast('coladas no álbum'); } }, 'colar tudo no álbum'),
        h('button', { type: 'button', class: 'btn wide', onclick: close }, 'colar depois'));
    });
  }

  /* ---------- detalhe com zoom ---------- */
  function detail(e) {
    sheet(`${e.codigo} · ${e.artista_banda}`, () => {
      let big = false;
      const view = h('div', { class: 'fig-zoom' }); view.innerHTML = svgOf(e, `d${e.codigo}`);
      const btn = h('button', { type: 'button', class: 'btn', 'aria-pressed': 'false', onclick: () => { big = !big; view.classList.toggle('big', big); btn.setAttribute('aria-pressed', String(big)); btn.textContent = big ? 'diminuir' : 'ampliar'; } }, 'ampliar');
      const msg = h('p', { class: 'fig-note', 'aria-live': 'polite' });
      const bt = (formato, rotulo) => h('button', { type: 'button', class: 'btn', onclick: async (ev) => {
        const b = ev.currentTarget; b.disabled = true; msg.textContent = 'gerando a imagem…';
        try { const r = await Postar.compartilhar(e, formato); msg.textContent = r === 'baixado' ? 'imagem baixada! é só postar 🎉' : r === 'compartilhado' ? 'pronto!' : ''; } catch { msg.textContent = 'não consegui gerar agora. tente de novo.'; }
        b.disabled = false; } }, rotulo);
      return h('div', { class: 'fig-detail' }, view, h('p', { class: 'fig-note' }, `${e.raridade} · seção ${e.secao} · nº ${L.slotNumber(catalog, e)}`), btn,
        h('div', { class: 'fig-share' }, h('b', {}, 'baixar pra postar'), h('div', { class: 'fig-share-btns' }, bt('post', 'post (feed)'), bt('story', 'story'), bt('carta', 'só a cartinha')), msg));
    });
  }

  return () => { alive = false; clearTimeout(tSave); if (nuvem) opts.salvar(state); };
}
