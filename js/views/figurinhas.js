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
import * as LEND from '../figurinhas/lendarias.js';
import * as RS from '../resgate.js';
import * as CODE from '../codigo.js';
import * as D from '../figurinhas/dono.js';
import { rufo } from '../figurinhas/roleta-sfx.js';

const LENDARIAS_ON = true; // aba Lendárias liberada (pedido da Bea): por enquanto os espaços ficam trancados até as figurinhas chegarem
const TABS = [...L.SECOES, ...(LENDARIAS_ON ? ['Lendárias'] : []), 'Minhas', 'Pacotes'];
const NOTE = { Comum: 'o mundo da música: bandas, bateristas e ídolos', Beatlemania: 'edição psicodélica dos quatro de Liverpool', Beaterista: 'as figurinhas da própria Bea e do Paul — todas exclusivas', Raras: 'as mais difíceis de achar, incluindo as duplas' };
let catalog = null;
// catálogo completo = as 125 originais + as figurinhas do Paul (arquivo separado, pra não mexer no catálogo original)
const loadCatalog = async () => (catalog ||= (await Promise.all([fetch('assets/figurinhas/catalogo.json').then((r) => r.json()), fetch('assets/figurinhas/catalogo-paul.json').then((r) => (r.ok ? r.json() : [])).catch(() => [])])).flat());
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
  let semanaFesta = false; let rsLista = [];
  /** Resgates por print aprovados pela Bea: entrega a recompensa neste aparelho (uma vez; o servidor confirma). Também atualiza os status mostrados. */
  async function resgatesDoAluno() {
    if (!CODE.saved()) return;
    try { rsLista = await RS.minhas(); } catch { return; }
    for (const r of rsLista) {
      if (r.status !== 'aprovado' || r.entregue) continue;
      let ok = false; try { ok = await RS.entregar(r.id); } catch { /* tenta na próxima */ } if (!ok) continue; r.entregue = true;
      if (r.tipo === 'lendaria') continue; // a entrega das lendárias é o "completar" logo abaixo (1 produto = 1 · 2 = 3 · 3 = 5)
      else { try { const M = await import('../figurinhas/mesa.js'); await M.vitoria('missao', RS.ESTRELAS_MISSAO); } catch { /* sem perfil */ } toast(`a Bea aprovou: +${RS.ESTRELAS_MISSAO} ★ pela missão!`); }
    }
    // lendárias: vale a maior compra aprovada; completa até esse total (sem repetir) e festeja só as novas
    const alvo = Math.max(0, ...rsLista.filter((r) => r.tipo === 'lendaria' && r.status === 'aprovado').map((r) => LEND.totalPorProdutos(LEND.produtosDoResgate(r.obs))));
    const comp = LEND.completarLendarias(state, alvo);
    if (comp.novas.length) {
      save(comp.state); const nomes = comp.novas.map((c) => LEND.LENDARIAS.find((x) => x.codigo === c).nome);
      import('../paulta/festa.js').then((F) => F.festa({ titulo: comp.novas.length > 1 ? 'figurinhas lendárias!' : 'figurinha lendária!', sub: `a Bea aprovou: você ganhou ${nomes.map((n) => `"${n}"`).join(' e ')}` })).catch(() => {});
    }
    if (alive) draw();
  }
  const statusRs = (tipo) => { const r = rsLista.find((x) => x.tipo === tipo && x.status !== 'recusado'); return r ? (r.status === 'aprovado' ? 'aprovado' : 'esperando a Bea') : ''; };
  function enviarPrint(tipo) {
    const inp = h('input', { type: 'file', accept: 'image/*', hidden: true }); document.body.append(inp);
    inp.addEventListener('change', async () => {
      const f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
      if (!CODE.saved()) { toast('precisa do código de aluno pra mandar o print.'); return; }
      toast('enviando o print…', { id: 'rs-env', ms: 1500 });
      try { const r = await RS.enviar(tipo, f, (P.active() || {}).name || ''); toast(r === 'ok' ? 'print enviado! a Bea vai conferir.' : r === 'ja_enviado' ? 'esse resgate já foi enviado.' : r === 'codigo' ? 'seu código não está ativo.' : 'não consegui enviar esse print.'); if (r === 'ok') { try { rsLista = await RS.minhas(); } catch { /* ok */ } draw(); } } catch { toast('sem internet agora. tente de novo.'); }
    });
    inp.click();
  }
  async function semanaPremio() {
    try { const me = P.active(); if (me) { const M = await import('../figurinhas/mesa.js'); await M.vitoria('checkin', L.SEMANA_ESTRELAS); } } catch { /* sem perfil: ganha só o pacote */ }
    try { const F = await import('../paulta/festa.js'); F.festa({ titulo: '7 dias seguidos!', sub: `você ganhou ${L.SEMANA_ESTRELAS} ★ e um pacote com uma figurinha exclusiva da Bea` }); } catch { /* sem animação */ }
  }
  load();
  async function load() {
    wrap.append(h('p', { class: 'fig-note' }, 'carregando álbum…'));
    try { await loadCatalog(); } catch { wrap.replaceChildren(h('p', { class: 'fig-note' }, 'não consegui abrir o catálogo agora. tente de novo com internet.')); return; }
    if (!alive) return;
    // sem pacote de boas-vindas. Check-in: 1 giro grátis da roleta por dia (id do dia, então abrir de novo não entrega outro); o resto vem jogando (roleta a cada 30 ★ e prêmio de jogo completo).
    let s = L.grantPack(state, L.checkinId(todayKey()));
    if (s !== state) { state = s; store.upsert('figurinhas', ID, state); }
    // check-in de 7 dias seguidos: pacote com 1 exclusiva da Bea + 10 ★ + festa (só 1x por dia entra na conta)
    { const r = L.checkinSemana(state.sem, todayKey()); if (r.sem !== state.sem && JSON.stringify(r.sem) !== JSON.stringify(state.sem)) { state = { ...state, sem: r.sem }; if (r.completou) { state = L.grantPack(state, L.semanaPackId(r.sem.ciclo)); semanaFesta = true; } store.upsert('figurinhas', ID, state); } }
    if (nuvem && (!opts.estado || !L.sameProgress(state, opts.estado))) guardarNaNuvem(); // o aparelho tinha coisa que o servidor ainda não tem
    if (semanaFesta) { semanaFesta = false; semanaPremio(); }
    resgatesDoAluno();
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
    const aviso = pend && tab !== 'Pacotes' ? h('button', { type: 'button', class: 'btn fig-giro', onclick: () => { tab = 'Pacotes'; draw(); } }, '🎡 você tem cartas para resgatar') : null;
    wrap.replaceChildren(
      h('p', { class: 'fig-total' }, h('b', {}, `${all.got}/${all.total}`), ' coladas no total · ', `${all.missing} faltam · ${hand} na mão`),
      h('p', { class: 'fig-vaimudar', role: 'note' }, '✨ o álbum ainda vai mudar: vão chegar figurinhas novas e, pra completar de verdade, serão ', h('b', { class: 'fig-300' }, '300 figurinhas!')),
      tabs, aviso, tab === 'Pacotes' ? packsView() : tab === 'Minhas' ? minhasView() : tab === 'Lendárias' ? lendariasView() : collectionView());
    if (tab !== 'Pacotes' && tab !== 'Minhas' && tab !== 'Lendárias') requestAnimationFrame(() => { const b = books[tab]; if (!b) return; if (b.novo) { b.novo = false; b.jump(b.firstTarget()); } else b.go(b.current(), false); }); // reanexar o livro zera a rolagem: volta pra mesma página
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

  /* ---------- lendárias: exclusivas de quem compra na Lojinha (as figurinhas chegam depois; por enquanto os espaços ficam trancados) ---------- */
  function lendariasView() {
    const tem = (c) => LEND.temLendaria(state, c.codigo);
    const slot = (c) => h('button', { type: 'button', class: `ld-slot ld-card${tem(c) ? ' on' : ''}`, 'aria-label': `${c.nome}, lendária${tem(c) ? '' : ', trancada'}`, onclick: () => verLendaria(c) },
      h('img', { src: c.img, alt: '', loading: 'lazy', draggable: 'false' }), tem(c) ? null : h('span', { class: 'ld-cad', 'aria-hidden': 'true' }, '🔒'), h('i', { class: 'ld-brilho', 'aria-hidden': 'true' }));
    const n = LEND.LENDARIAS.filter(tem).length;
    return h('section', { class: 'fig-col ld' },
      h('h2', { class: 'tag' }, '✨ Lendárias'),
      h('p', { class: 'muted' }, `figurinhas exclusivas de quem compra na Lojinha da Beaterista. não saem na roleta. você tem ${n} de ${LEND.LENDARIAS.length}.`),
      h('div', { class: 'ld-grid' }, ...LEND.LENDARIAS.map(slot)),
      h('p', { class: 'fig-note' }, 'quanto mais produtos da Lojinha, mais lendárias: 1 produto libera 1 · 2 produtos liberam 3 · 3 produtos liberam as 5.'),
      rsLista.some((x) => x.tipo === 'lendaria' && x.status === 'pendente') ? h('p', { class: 'fig-note' }, 'seu resgate: esperando a Bea') : n >= LEND.LENDARIAS.length ? h('p', { class: 'fig-note' }, 'você já tem as 5 lendárias! 🎉')
        : h('button', { type: 'button', class: 'btn primary wide', onclick: () => enviarPrint('lendaria') }, n ? 'comprei mais produtos (mandar outro print)' : 'resgatar por print (mostre suas compras)'),
      h('a', { class: 'btn wide', href: '#/lojinha' }, 'ver a Lojinha'));
  }
  function verLendaria(c) {
    sheet(c.nome, (close) => h('div', { class: 'ld-ver' }, h('img', { class: LEND.temLendaria(state, c.codigo) ? '' : 'ld-bloq', src: c.img, alt: c.nome }),
      h('p', { class: 'muted' }, LEND.temLendaria(state, c.codigo) ? 'lendária sua!' : 'trancada: 1 produto da Lojinha libera 1 lendária, 2 liberam 3 e 3 liberam as 5.'), h('button', { type: 'button', class: 'btn wide', onclick: close }, 'fechar')));
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
    const prog = me ? `faltam ${EST.faltamParaRoleta(EST.estrelasTotais(me.id))} ★ pra próxima roleta (${EST.estrelasTotais(me.id)} ★ no total)` : 'junte 15 ★ nos jogos pra liberar uma roleta de figurinhas';
    return h('section', { class: 'fig-packs' },
      h('div', { class: 'fig-pack-card' },
        h('div', { class: 'fig-pack-art', 'aria-hidden': 'true' }, h('b', {}, next === 'roleta' ? '🎡' : next === 'jogo' ? '🏆' : 'beaterista'), h('span', {}, next === 'roleta' ? '1 a 3 figurinhas' : next === 'jogo' ? '1 pacote com uma rara' : `${next === 'pacote' ? L.packSize(pend[0]) : L.PACK_SIZE} figurinhas`)),
        h('p', {}, partes.length ? `${partes.join(' · ')} pra abrir` : 'nada pra abrir agora.'),
        h('p', { class: 'fig-note' }, `${prog}. 1 giro grátis por dia (check-in) e, ao terminar um jogo inteiro, 1 pacote com uma rara!`),
        h('button', { type: 'button', class: 'btn primary wide', disabled: pend.length ? null : true, onclick: () => openIt(pend[0]) }, next === 'roleta' ? 'girar a roleta' : next === 'jogo' ? 'abrir o prêmio' : 'abrir pacote'),
        h('details', { class: 'fig-mais' }, h('summary', {}, 'ganhe mais ★ (missões com print e check-in)'),
          h('div', {}, 
        h('div', { class: 'fig-missoes' }, h('b', {}, `missões com print: +${RS.ESTRELAS_MISSAO} ★ cada`), h('small', {}, 'faça, tire um print e envie. a professora Bea confere e a estrela chega.'),
          ...RS.MISSOES.map((m) => h('div', { class: 'fig-missao' }, h('span', {}, h('b', {}, m.titulo), h('small', {}, m.dica)),
            h('span', { class: 'fig-missao-bt' }, m.tipo === 'amigo' ? h('button', { type: 'button', class: 'btn small ghost', onclick: async () => { try { await navigator.clipboard.writeText(m.link); toast('link copiado: cole e mande pro amigo!'); } catch { toast(m.link); } } }, m.rotulo) : h('a', { class: 'btn small ghost', href: m.link, target: '_blank', rel: 'noopener noreferrer' }, m.rotulo), ...(m.extras || []).map(([t, u]) => h('a', { class: 'btn small ghost', href: u, target: '_blank', rel: 'noopener noreferrer' }, t)),
              statusRs(m.tipo) ? h('em', { class: 'fig-missao-st' }, statusRs(m.tipo)) : h('button', { type: 'button', class: 'btn small', onclick: () => enviarPrint(m.tipo) }, 'enviar print'))))),
          h('div', { class: 'fig-semana', 'aria-label': `check-in: ${(state.sem && state.sem.seq) || 0} de 7 dias seguidos` }, h('b', {}, 'check-in da semana'), h('span', { class: 'fig-semana-dias' }, ...Array.from({ length: L.SEMANA_DIAS }, (_, k) => h('i', { class: k < ((state.sem && state.sem.seq) || 0) ? 'on' : k === L.SEMANA_DIAS - 1 ? 'premio' : '' }, k === L.SEMANA_DIAS - 1 ? '🎁' : String(k + 1)))), h('small', {}, `entre 7 dias seguidos e ganhe ${L.SEMANA_ESTRELAS} ★ + 1 figurinha exclusiva da Bea`))
          ))),
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
      const el = h('button', { type: 'button', class: `fig-flip${less ? ' open' : ''}`, style: `--d:${i * 180}ms`, 'aria-label': less ? `${e.artista_banda}, ${L.nomeRaridade(e)}` : `carta ${i + 1}, virar` });
      el.innerHTML = `<span class="back"><b>beaterista</b></span><span class="front">${svgOf(e, `o${i}${e.codigo}`)}</span>`;
      const flip = () => { if (el.classList.contains('open')) { detail(e); return; } el.classList.add('open'); el.setAttribute('aria-label', `${e.artista_banda}, ${L.nomeRaridade(e)}${dup ? ', repetida' : ', nova'}`); live.textContent = `${e.artista_banda} · ${L.nomeRaridade(e)}${dup ? ' · repetida' : ' · nova'}`; };
      el.addEventListener('click', flip); row.append(el);
    });
    const nomes = cards.map((e) => `${e.artista_banda} (${L.nomeRaridade(e)})`).join(', ');
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
      sheet('seu pacote', (close) => revealUI(r.codes, close, true)); return; // as figurinhas já aparecem viradas: ninguém precisa tocar pra descobrir
    }
    const roleta = kind === 'roleta';
    sheet(roleta ? '🎡 roleta de figurinhas' : '🏆 prêmio do jogo completo', (close) => {
      const box = h('div', { class: 'fig-open fig-wheelbox' });
      const disc = h('div', { class: 'fig-wheel-disc' + (roleta ? '' : ' prize'), 'aria-hidden': 'true' }, h('span', { class: 'fig-wheel-hub' }, roleta ? '🎡' : '🏆'));
      // 3 desenhos de roleta, sorteados a cada vez (e cores sempre diferentes): disco de vinil, roleta néon e pele de tambor
      const skin = roleta ? ['vinil', 'neon', 'tambor'][Math.floor(Math.random() * 3)] : 'premio'; box.classList.add(`sk-${skin}`); const extras = [];
      if (roleta) {
        const hue = Math.floor(Math.random() * 360);
        if (skin === 'vinil') { disc.style.background = ''; disc.querySelector('.fig-wheel-hub').style.background = coresRoleta(); extras.push(h('i', { class: 'fig-arm', 'aria-hidden': 'true' })); }
        else if (skin === 'neon') {
          const neon = ['#ff2d95', '#ffd23f', '#2dd4ff', '#7cff6b', '#b388ff', '#ff7a2d'].sort(() => Math.random() - 0.5).slice(0, 4);
          disc.style.background = `conic-gradient(${Array.from({ length: 8 }, (_, k) => `${k % 2 ? '#14111a' : neon[(k / 2) % 4]} 0 ${(k + 1) * 12.5}%`).join(', ')})`;
          for (let k = 0; k < 12; k++) disc.append(h('i', { class: 'fig-luz', style: `--a:${k * 30}deg`, 'aria-hidden': 'true' }));
        } else {
          const c1 = ['#d3122f', '#EBA332', '#17365B', '#2a9d8f'].sort(() => Math.random() - 0.5);
          disc.style.background = `conic-gradient(${Array.from({ length: 8 }, (_, k) => `${k % 2 ? '#fff8e6' : c1[(k / 2) % 4]} 0 ${(k + 1) * 12.5}%`).join(', ')})`;
          for (let k = 0; k < 8; k++) disc.append(h('i', { class: 'fig-parafuso', style: `--a:${k * 45}deg`, 'aria-hidden': 'true' }));
          extras.push(h('i', { class: 'fig-stick l', 'aria-hidden': 'true' }), h('i', { class: 'fig-stick r', 'aria-hidden': 'true' }));
        }
        disc.querySelector('.fig-wheel-hub').textContent = skin === 'tambor' ? '🥁' : skin === 'vinil' ? '🎵' : '🎡'; void hue;
      }
      const go = h('button', { type: 'button', class: 'btn primary wide', onclick: () => {
        go.disabled = true; const r = L.openPack(state, catalog, packId); if (!r.fresh) { close(); return; }
        save(r.state); const mostra = () => box.replaceChildren(revealUI(r.codes, close, true));
        if (wantsLess(state)) { mostra(); return; }
        disc.style.transform = `rotate(${1440 + Math.floor(Math.random() * 360)}deg)`; disc.classList.add('spin'); rufo(3.2); setTimeout(mostra, 3300);
      } }, roleta ? 'girar!' : 'abrir o prêmio');
      box.append(h('p', { class: 'fig-note' }, roleta ? 'gire pra ganhar de 1 a 3 figurinhas. com sorte, vem uma rara, uma dos Beatles… ou uma exclusiva!' : 'você terminou um jogo inteiro! é um pacote de 3 com uma rara garantida.'), h('div', { class: 'fig-wheel' }, disc, ...extras, h('i', { class: 'fig-wheel-pin', 'aria-hidden': 'true' })), go);
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
      const box = h('div', { class: 'fig-detail' }, view, h('p', { class: 'fig-note' }, `${L.nomeRaridade(e)} · seção ${e.secao} · nº ${L.slotNumber(catalog, e)}`), btn, share);
      box.cleanup = () => share.cleanup();
      return box;
    });
  }

  return () => { alive = false; clearTimeout(tSave); if (mcView) mcView.cleanup(); if (nuvem) opts.salvar(state); };
}
