// Álbum de figurinhas da Beaterista: coleções, espaços numerados, pacotes, colar, detalhe com zoom.
// Progresso salvo no registro 'figurinhas-album' do app (IndexedDB; sincroniza pela conta como o resto, quando há login).
import { ultimoJogo } from '../ultimo-jogo.js';
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
const TABS = ['Na mão', ...L.SECOES, ...(LENDARIAS_ON ? ['Lendárias'] : []), 'Pacotes']; // "minhas figurinhas" é a primeira aba: as da mão (pra colar) e, embaixo, as que a pessoa criou (pedido da Bea: uma aba só, sem repetir)
const ROTULO = { 'Na mão': 'minhas figurinhas', Beaterista: 'exclusivas' }; // nome na aba (o resto usa o próprio nome)
const ABA_ANTIGA = { Minhas: 'Na mão' }; // a aba "criadas por mim" foi pra dentro de "minhas figurinhas"
const NOTE = { Bandas: 'os grupos: todas comuns, pra encher o álbum rápido', Beatlemania: 'os quatro de Liverpool, a banda que deu nome ao Paul', Beaterista: 'as figurinhas da própria Bea e do Paul — todas exclusivas', Artistas: 'cantores são comuns; os músicos e alguns ídolos são raros (★)' };
let catalog = null;
// catálogo completo = as 125 originais + as figurinhas do Paul (arquivo separado, pra não mexer no catálogo original)
const loadCatalog = async () => (catalog ||= (await Promise.all([fetch('assets/figurinhas/catalogo.json').then((r) => r.json()), fetch('assets/figurinhas/catalogo-paul.json').then((r) => (r.ok ? r.json() : [])).catch(() => []), fetch('assets/figurinhas/catalogo-bea.json').then((r) => (r.ok ? r.json() : [])).catch(() => [])])).flat());
const aspectOf = (e) => e.largura_px / e.altura_px;
const svgOf = (e, uid) => cardSVG(e, { url: e.foto, aspect: aspectOf(e), uid });
const wantsLess = (s) => !!s.reduzir || matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mount(host, parts = [], opts = {}) {
  const wrap = h('div', { class: 'fig' });
  const ult = ultimoJogo(); // pra ninguém se perder: o Álbum mostra o caminho de volta pro jogo em que o aluno estava
  host.append(parts[0] === 'Pacotes' ? banner('Stars', 'suas estrelas, a roleta e o baú') : banner('Álbum', 'cole todas as figurinhas'), ult ? h('div', { class: 'pad-x fig-volta' }, h('a', { class: 'btn primary wide fig-volta-btn', href: ult.href }, `‹ voltar pro jogo: ${ult.nome}`)) : null, wrap);
  const ID = D.albumId(); // o álbum é de quem está com o nome agora
  let state = { ...L.emptyState(), ...D.albumDados() };
  const nuvem = typeof opts.salvar === 'function'; let tSave = null;
  const guardarNaNuvem = () => { if (!nuvem) return; clearTimeout(tSave); tSave = setTimeout(() => opts.salvar(state), 700); };
  if (opts.estado) state = L.mergeStates(state, opts.estado); // junta o que está salvo no Supabase com o deste aparelho
  const explicita = TABS.includes(parts[0]) || !!L.SECAO_ANTIGA[parts[0]] || !!ABA_ANTIGA[parts[0]];
  let tab = TABS.includes(parts[0]) ? parts[0] : ABA_ANTIGA[parts[0]] || L.SECAO_ANTIGA[parts[0]] || L.SECOES[0], artist = '';
  /** Troca de aba. Na área do aluno a roleta tem endereço próprio (#/album/Pacotes, a aba "roleta" lá de cima): entrar e sair dela muda o endereço,
   *  senão o botão "álbum" apontava pro endereço em que a pessoa já estava e não fazia nada. */
  const irAba = (t) => {
    const noAluno = /^#\/album(\/|$)/.test(location.hash), naRoleta = /^#\/album\/Pacotes/.test(location.hash);
    if (noAluno && t === 'Pacotes' && !naRoleta) { location.hash = '#/album/Pacotes'; return; }
    if (noAluno && t !== 'Pacotes' && naRoleta) { location.hash = `#/album/${encodeURIComponent(t)}`; return; }
    tab = t; artist = ''; draw();
  };
  let alive = true; let io = null; let justPasted = null;

  const save = (next) => { state = next; store.upsert('figurinhas', ID, state); guardarNaNuvem(); draw(); };
  let semanaFesta = false; let rsLista = [];
  let area = null; // área aberta da aba roleta: null = automática (segue o que tem pra abrir) | 'roleta' | 'bau' | 'resgate'
  /** Resgates por print aprovados pela Bea: entrega a recompensa neste aparelho (uma vez; o servidor confirma). Também atualiza os status mostrados. */
  async function resgatesDoAluno() {
    if (!CODE.saved()) return;
    try { rsLista = await RS.minhas(); } catch { return; }
    for (const r of rsLista) {
      if (r.status !== 'aprovado' || r.entregue) continue;
      let ok = false; try { ok = await RS.entregar(r.id); } catch { /* tenta na próxima */ } if (!ok) continue; r.entregue = true;
      if (r.tipo === RS.TIPO_DESAFIO) { // Desafio do Paul aprovado: 2 giros ÉPICOS (ids do resgate, então nunca entrega em dobro)
        const s2 = L.grantPack(L.grantPack(state, `epico:${r.id}:1`), `epico:${r.id}:2`); if (s2 !== state) save(s2);
        toast('a Bea aprovou o Desafio do Paul: GIRO DUPLO ÉPICO liberado!', { ms: 5000 }); import('../paulta/festa.js').then((F) => F.festa({ titulo: 'giro duplo épico!', sub: 'você ganhou 2 giros especiais. olha em Stars › roleta' })).catch(() => {}); continue;
      }
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
    { const t = L.trocarRepetidas(state, catalog); if (t.trocadas) { state = t.state; store.upsert('figurinhas', ID, state); guardarNaNuvem(); toast(`suas ${t.trocadas} repetida${t.trocadas === 1 ? ' virou carta nova' : 's viraram cartas novas'}! olha em minhas figurinhas`, { ms: 5000 }); } } // as repetidas de antes viram cartas que faltam
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
    const tabs = h('div', { class: 'fig-tabs', role: 'tablist' }, TABS.filter((t) => t !== 'Pacotes').map((t) => { // a roleta/baú/resgate moram na aba STARS (não é mais uma aba do álbum)
      const badge = t === 'Pacotes' ? (pend ? ` ${pend}` : '') : t === 'Na mão' ? (L.inHand(state) ? ` ${L.inHand(state)}` : '') : '';
      return h('button', { type: 'button', role: 'tab', class: `chip-btn${t === tab ? ' on' : ''}`, 'aria-selected': String(t === tab), onclick: () => irAba(t) }, (ROTULO[t] || t.toLowerCase()) + badge);
    }));
    const aviso = pend && tab !== 'Pacotes' ? h('button', { type: 'button', class: 'btn fig-giro', onclick: () => irAba('Pacotes') }, '🎡 você tem cartas para resgatar') : null;
    if (tab === 'Pacotes') { wrap.replaceChildren(starsHeader(), packsView()); return; }
    wrap.replaceChildren(
      h('p', { class: 'fig-total' }, h('b', {}, `${all.got}/${all.total}`), ' coladas no total · ', `${all.missing} faltam · ${hand} na mão`),
      h('p', { class: 'fig-vaimudar', role: 'note' }, '✨ o álbum ainda vai mudar: vão chegar figurinhas novas e, pra completar de verdade, serão ', h('b', { class: 'fig-300' }, '300 figurinhas!')),
      tabs, aviso, tab === 'Pacotes' ? packsView() : tab === 'Na mão' ? maoView() : tab === 'Lendárias' ? lendariasView() : collectionView());
    if (tab !== 'Pacotes' && tab !== 'Lendárias' && tab !== 'Na mão') requestAnimationFrame(() => { const b = books[tab]; if (!b) return; if (b.novo) { b.novo = false; b.jump(b.firstTarget()); } else b.go(b.current(), false); }); // reanexar o livro zera a rolagem: volta pra mesma página
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

  /* ---------- minhas figurinhas: as que estão na mão, pra colar no álbum ---------- */
  function maoView() {
    const hand = Object.keys(state.inv).map((c) => catalog.find((x) => x.codigo === c)).filter(Boolean);
    const pastable = hand.filter((e) => L.canPaste(state, e.codigo)), rep = hand.length - pastable.length;
    const cell = (e) => {
      const pode = L.canPaste(state, e.codigo); const th = h('button', { type: 'button', class: 'fig-mao-img', 'aria-label': `ver ${e.artista_banda}`, onclick: () => detail(e) }); th.innerHTML = svgOf(e, `m${e.codigo}`);
      return h('div', { class: `fig-mao-it${pode ? '' : ' rep'}` }, th, h('b', {}, e.artista_banda),
        pode ? h('button', { type: 'button', class: 'btn small primary', onclick: () => doPaste(e) }, 'colar no álbum') : h('em', {}, 'repetida · já está no álbum'));
    };
    return h('section', { class: 'fig-col fig-mao' },
      h('h2', { class: 'tag' }, `minhas figurinhas (${hand.length})`),
      h('p', { class: 'muted' }, hand.length ? `${pastable.length} pra colar · ${rep} repetida${rep === 1 ? '' : 's'}. toque na figurinha pra ver grande.` : 'nenhuma figurinha na mão. ganhe estrelas nos jogos e gire a roleta pra pegar mais!'),
      pastable.length ? h('button', { type: 'button', class: 'btn primary wide', onclick: () => { save(L.pasteAll(state)); toast('tudo colado!'); } }, `colar tudo no álbum (${pastable.length})`) : null,
      hand.length ? h('div', { class: 'fig-mao-grid' }, ...hand.map(cell)) : h('button', { type: 'button', class: 'btn wide', onclick: () => irAba('Pacotes') }, 'ir pra roleta'),
      h('h2', { class: 'tag fig-mao-sep' }, 'criadas por mim'), minhasView());
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
    if (mcView) mcView.cleanup(); let nomeAluno = ''; try { nomeAluno = (localStorage.getItem('beaterista-aluno-nome') || '').trim(); } catch { /* sem nome */ } mcView = Minhas.album({ nome: nomeAluno }); // álbum de verdade só do aluno, só neste aparelho
    return h('section', { class: 'fig-col' }, mcView.el, h('a', { class: 'btn wide', href: '#/perfil' }, 'criar uma cartinha (Perfil)'));
  }

  /* ---------- STARS: quantas estrelas você tem e quantas faltam pra próxima roleta (fica no topo, antes de tudo) ---------- */
  function starsHeader() {
    const me = (() => { try { return P.active(); } catch { return null; } })();
    if (!me) return h('section', { class: 'fig-stars' }, h('p', { class: 'fig-stars-sem' }, 'jogue com o seu nome pra juntar estrelas ★ e girar a roleta'));
    const tot = EST.estrelasTotais(me.id), falta = EST.faltamParaRoleta(tot), feito = L.ESTRELAS_POR_ROLETA - falta;
    return h('section', { class: 'fig-stars', 'aria-label': `${tot} estrelas, faltam ${falta} pra próxima roleta` },
      h('div', { class: 'fig-stars-n' }, h('b', {}, String(tot)), h('span', {}, '★ estrelas')),
      h('div', { class: 'fig-stars-meio' }, h('div', { class: 'fig-stars-bar', role: 'progressbar', 'aria-valuenow': feito, 'aria-valuemin': 0, 'aria-valuemax': L.ESTRELAS_POR_ROLETA }, h('i', { style: { width: `${Math.round((feito / L.ESTRELAS_POR_ROLETA) * 100)}%` } })), h('p', {}, h('b', {}, `faltam ${falta} ★`), ' pra próxima roleta')));
  }

  /* ---------- pacotes ---------- */
  function packsView() {
    const ordem = { epico: 0, jogo: 1, roleta: 2, pacote: 3 }; // prêmio de jogo e roleta primeiro, depois os pacotes
    const pend = [...L.pendingPacks(state)].sort((a, b) => ordem[L.packKind(a)] - ordem[L.packKind(b)]), hand = Object.keys(state.inv).map((c) => catalog.find((x) => x.codigo === c)).filter(Boolean);
    const pastable = hand.filter((e) => L.canPaste(state, e.codigo));
    const rep = L.repeated(state);
    const n = (k) => pend.filter((id) => L.packKind(id) === k).length, next = pend[0] ? (L.packKind(pend[0]) === 'epico' ? 'roleta' : L.packKind(pend[0])) : null;
    const partes = [n('epico') ? `⚡ ${n('epico')} giro${n('epico') > 1 ? 's' : ''} épico${n('epico') > 1 ? 's' : ''}` : '', n('roleta') ? `🎡 ${n('roleta')} roleta${n('roleta') > 1 ? 's' : ''}` : '', n('jogo') ? `🏆 ${n('jogo')} prêmio${n('jogo') > 1 ? 's' : ''} de jogo` : '', n('pacote') ? `🎁 ${n('pacote')} pacote${n('pacote') > 1 ? 's' : ''}` : ''].filter(Boolean);
    const me = (() => { try { return P.active(); } catch { return null; } })();
    const prog = me ? `faltam ${EST.faltamParaRoleta(EST.estrelasTotais(me.id))} ★ pra próxima roleta (${EST.estrelasTotais(me.id)} ★ no total)` : 'junte 15 ★ nos jogos pra liberar uma roleta de figurinhas';
    // 3 áreas (pedido da Bea, 15/nov/2026): ROLETA (girar) · BAÚ (abrir pacotinho, com o porquê de cada um) · RESGATE (★ com print)
    const giros = pend.filter((id) => ['roleta', 'epico'].includes(L.packKind(id))); const bau = pend.filter((id) => !['roleta', 'epico'].includes(L.packKind(id)));
    const auto = next === 'roleta' ? 'roleta' : next ? 'bau' : 'roleta'; const qual = area || auto;
    const chip = (id, txt, qtd) => h('button', { type: 'button', role: 'tab', class: `fig-area${qual === id ? ' on' : ''}`, 'aria-selected': String(qual === id), onclick: () => { area = id; draw(); } }, txt, qtd ? h('i', {}, String(qtd)) : null);
    const resumo = h('p', {}, partes.length ? `${partes.join(' · ')} pra abrir` : 'nada pra abrir agora.');
    const porque = (lista) => (lista.length ? h('ul', { class: 'fig-porque' }, ...lista.slice(0, 6).map((id) => h('li', {}, h('b', {}, L.packKind(id) === 'epico' ? '⚡ giro épico' : L.packKind(id) === 'roleta' ? '🎡 giro' : L.packKind(id) === 'jogo' ? '🏆 prêmio' : '🎁 pacotinho'), ` ${L.motivoDoPacote(id)}`)), lista.length > 6 ? h('li', {}, `e mais ${lista.length - 6}…`) : null) : null);
    const semana = h('div', { class: 'fig-semana', 'aria-label': `check-in: ${(state.sem && state.sem.seq) || 0} de 7 dias seguidos` }, h('b', {}, 'check-in da semana'), h('span', { class: 'fig-semana-dias' }, ...Array.from({ length: L.SEMANA_DIAS }, (_, k) => h('i', { class: k < ((state.sem && state.sem.seq) || 0) ? 'on' : k === L.SEMANA_DIAS - 1 ? 'premio' : '' }, k === L.SEMANA_DIAS - 1 ? '🎁' : String(k + 1)))), h('small', {}, `entre 7 dias seguidos e ganhe ${L.SEMANA_ESTRELAS} ★ + 1 figurinha exclusiva da Bea`));
    let corpo;
    if (qual === 'roleta') {
      corpo = h('div', { class: 'fig-pack-card' },
        h('div', { class: 'fig-pack-art', 'aria-hidden': 'true' }, h('b', {}, '🎡'), h('span', {}, '1 a 3 figurinhas por giro')),
        resumo,
        h('p', { class: 'fig-note' }, `${prog}. você também ganha 1 giro grátis por dia (check-in) e 1 giro a cada 4 fases concluídas.`),
        h('button', { type: 'button', class: 'btn primary wide', disabled: giros.length ? null : true, onclick: () => openIt(giros[0]) }, giros.length && L.packKind(giros[0]) === 'epico' ? (L.epicoPack(giros[0]).n === 1 ? 'girar · 3 figurinhas garantidas' : 'girar · de 1 a 5 figurinhas') : 'girar a roleta'),
        giros.length ? h('div', { class: 'fig-mais fig-explica' }, h('b', {}, 'por que você ganhou'), porque(giros)) : h('div', { class: 'fig-mais fig-explica' }, h('b', {}, 'como ganhar giros'), h('small', {}, `junte ${L.ESTRELAS_POR_ROLETA} ★ jogando, conclua 4 fases ou entre no app todo dia.`)),
        semana);
    } else if (qual === 'bau') {
      const prox = bau[0]; const k = prox ? L.packKind(prox) : null;
      corpo = h('div', { class: 'fig-pack-card' },
        h('div', { class: 'fig-pack-art', 'aria-hidden': 'true' }, h('b', {}, k === 'jogo' ? '🏆' : '🎁'), h('span', {}, k === 'jogo' ? '1 pacote com uma rara' : `${prox ? L.packSize(prox) : L.PACK_SIZE} figurinhas`)),
        resumo,
        h('p', { class: 'fig-note' }, 'o baú guarda os pacotinhos que você conquistou. cada pacotinho é um prêmio por terminar um jogo, um mundo ou uma semana de check-in.'),
        h('button', { type: 'button', class: 'btn primary wide', disabled: prox ? null : true, onclick: () => openIt(prox) }, k === 'jogo' ? 'abrir o prêmio' : 'abrir pacotinho'),
        bau.length ? h('div', { class: 'fig-mais fig-explica' }, h('b', {}, 'por que você ganhou'), porque(bau)) : h('div', { class: 'fig-mais fig-explica' }, h('b', {}, 'como ganhar pacotinhos'), h('small', {}, 'termine todas as fases de um jogo, um mundo da pauLta ou 7 dias seguidos de check-in.'))),
      corpo = h('div', {}, corpo, h('div', { class: 'fig-hand' },
        h('h2', {}, `guardadas no baú (${L.inHand(state)})`),
        h('p', { class: 'fig-note' }, `${pastable.length} pra colar · ${rep} repetida${rep === 1 ? '' : 's'}`),
        pastable.length ? h('button', { type: 'button', class: 'btn primary', onclick: () => { save(L.pasteAll(state)); toast('tudo colado!'); } }, `colar tudo (${pastable.length})`) : null,
        h('div', { class: 'fig-hand-list' }, hand.map((e) => h('button', { type: 'button', class: 'fig-chip', onclick: () => (L.canPaste(state, e.codigo) ? doPaste(e) : detail(e)) }, h('b', {}, e.codigo), ` ${e.artista_banda}`, h('em', {}, state.pasted[e.codigo] ? ' · repetida' : ' · colar'))))));
    } else {
      const sel = h('select', { class: 'fig-post-sel', 'aria-label': 'qual jogo você postou' }, ...RS.JOGOS_POST.map(([id, nome]) => h('option', { value: id, disabled: statusRs(RS.tipoPost(id)) ? true : null }, statusRs(RS.tipoPost(id)) ? `${nome} (${statusRs(RS.tipoPost(id))})` : nome)));
      const primeiro = RS.JOGOS_POST.find(([id]) => !statusRs(RS.tipoPost(id))); if (primeiro) sel.value = primeiro[0];
      const postados = RS.JOGOS_POST.filter(([id]) => statusRs(RS.tipoPost(id)));
      const stD = statusRs(RS.TIPO_DESAFIO); const jaGanhou = rsLista.some((x) => x.tipo === RS.TIPO_DESAFIO && x.status === 'aprovado');
      const desafio = h('section', { class: 'fig-desafio' }, h('h3', {}, '⚡ Desafio do Paul'),
        h('p', {}, 'Cole sua figurinha no álbum e escolha se aceita o Desafio do Paul!'),
        h('p', { class: 'fig-note' }, 'Vale uma nova carta de perfil colada, uma pontuação recorde, um selo por completar um mundo musical ou um Estudo do Paul.'),
        h('p', { class: 'fig-note' }, `Poste sua conquista e marque @beaterista.escolademusica, ${RS.ARROBA} ou @jogos.beaterista. Depois toque em “importar foto” e mande o print pra professora aprovar.`),
        h('p', {}, h('b', {}, 'Depois de aprovado: GIRO DUPLO ÉPICO!'), ' São 2 giros especiais: o primeiro dá 3 figurinhas garantidas e o segundo pode liberar até 5. Boa sorte! Aceita o desafio?'),
        jaGanhou ? h('p', { class: 'fig-desafio-st ok' }, '✓ aprovado · giro duplo épico liberado (olha na roleta)') : stD ? h('p', { class: 'fig-desafio-st' }, `⏳ ${stD}`) : h('button', { type: 'button', class: 'btn primary wide', onclick: () => enviarPrint(RS.TIPO_DESAFIO) }, '📷 importar foto e aceitar o desafio'));
      corpo = h('div', { class: 'fig-pack-card fig-resgate' }, desafio,
        h('div', { class: 'fig-pack-art', 'aria-hidden': 'true' }, h('b', {}, '★'), h('span', {}, `+${RS.ESTRELAS_MISSAO} ★ por print`)),
        h('p', {}, h('b', {}, 'resgate estrelas com print')),
        h('p', { class: 'fig-note' }, 'faça a missão, tire um print e envie. a professora Bea confere e as estrelas chegam aqui. precisa do código de aluno.'),
        h('div', { class: 'fig-post' }, h('b', {}, `postei meu jogo e marquei a escola: +${RS.ESTRELAS_MISSAO} ★ por jogo`),
          h('small', {}, `no fim de cada jogo tem o botão "compartilhar". poste nos stories ou no feed, marque ${RS.ARROBA} e mande aqui o print do post. vale 1 vez por jogo.`),
          h('div', { class: 'fig-post-linha' }, sel, h('button', { type: 'button', class: 'btn small', disabled: primeiro ? null : true, onclick: () => enviarPrint(RS.tipoPost(sel.value)) }, 'enviar print do post')),
          postados.length ? h('small', { class: 'fig-post-st' }, postados.map(([id, nome]) => `${nome}: ${statusRs(RS.tipoPost(id))}`).join(' · ')) : null),
        h('div', { class: 'fig-missoes' }, h('b', {}, `outras missões: +${RS.ESTRELAS_MISSAO} ★ cada`),
          ...RS.MISSOES.map((m) => h('div', { class: 'fig-missao' }, h('span', {}, h('b', {}, m.titulo), h('small', {}, m.dica)),
            h('span', { class: 'fig-missao-bt' }, m.tipo === 'amigo' ? h('button', { type: 'button', class: 'btn small ghost', onclick: async () => { try { await navigator.clipboard.writeText(m.link); toast('link copiado: cole e mande pro amigo!'); } catch { toast(m.link); } } }, m.rotulo) : h('a', { class: 'btn small ghost', href: m.link, target: '_blank', rel: 'noopener noreferrer' }, m.rotulo), ...(m.extras || []).map(([t, u]) => h('a', { class: 'btn small ghost', href: u, target: '_blank', rel: 'noopener noreferrer' }, t)),
              statusRs(m.tipo) ? h('em', { class: 'fig-missao-st' }, statusRs(m.tipo)) : h('button', { type: 'button', class: 'btn small', onclick: () => enviarPrint(m.tipo) }, 'enviar print'))))));
    }
    const ico = { roleta: '<svg viewBox="0 0 64 64"><defs><linearGradient id="irc" x1="0" x2="1"><stop offset="0" stop-color="#7d0c1e"/><stop offset=".5" stop-color="#e53950"/><stop offset="1" stop-color="#7d0c1e"/></linearGradient><linearGradient id="irm" x1="0" x2="1"><stop offset="0" stop-color="#9aa0ad"/><stop offset=".5" stop-color="#f4f6fa"/><stop offset="1" stop-color="#8a909e"/></linearGradient></defs><path d="M12 7l18 16M52 7L34 23" stroke="#14111a" stroke-width="7" stroke-linecap="round"/><path d="M12 7l18 16M52 7L34 23" stroke="#fff6e0" stroke-width="3.4" stroke-linecap="round"/><circle cx="11" cy="6" r="3.8" fill="#fff6e0" stroke="#14111a" stroke-width="2"/><circle cx="53" cy="6" r="3.8" fill="#fff6e0" stroke="#14111a" stroke-width="2"/><path d="M7 28v20c0 5.5 11 9.5 25 9.5s25-4 25-9.5V28" fill="url(#irc)" stroke="#14111a" stroke-width="3"/><path d="M10 33l8 17M22 36l5 18M42 36l-5 18M54 33l-8 17" stroke="#ffd23f" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="32" cy="28" rx="25" ry="9.5" fill="url(#irm)" stroke="#14111a" stroke-width="3"/><ellipse cx="32" cy="28" rx="20" ry="6.8" fill="#fff6e0" stroke="#14111a" stroke-width="1.6"/><ellipse cx="24" cy="26" rx="8" ry="2" fill="#fff" opacity=".8"/></svg>', bau: '<svg viewBox="0 0 64 64"><defs><linearGradient id="ibw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e09a45"/><stop offset="1" stop-color="#8a4a17"/></linearGradient><linearGradient id="ibg" x1="0" x2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset="1" stop-color="#d99a14"/></linearGradient></defs><path d="M52 3l1.7 4.3 4.3 1.7-4.3 1.7L52 15l-1.7-4.3-4.3-1.7 4.3-1.7zM11 8l1.2 3 3 1.2-3 1.2L11 16.4l-1.2-3-3-1.2 3-1.2z" fill="#ffe27a" stroke="#14111a" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 32C6 19 17 13 32 13s26 6 26 19z" fill="url(#ibw)" stroke="#14111a" stroke-width="3"/><rect x="6" y="32" width="52" height="24" rx="3" fill="url(#ibw)" stroke="#14111a" stroke-width="3"/><path d="M6 43h52" stroke="#14111a" stroke-width="2" opacity=".45"/><path d="M17 14v42M47 14v42" stroke="#14111a" stroke-width="7.5"/><path d="M17 14v42M47 14v42" stroke="url(#ibg)" stroke-width="4.4"/><rect x="25" y="28" width="14" height="17" rx="3" fill="url(#ibg)" stroke="#14111a" stroke-width="2.6"/><circle cx="32" cy="35.5" r="2.6" fill="#14111a"/><path d="M32 36v5" stroke="#14111a" stroke-width="2.6" stroke-linecap="round"/></svg>', resgate: '<svg viewBox="0 0 64 64"><defs><radialGradient id="irg" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff4b0"/><stop offset=".6" stop-color="#f6c93b"/><stop offset="1" stop-color="#c88a0b"/></radialGradient></defs><path d="M19 36l-9 22 10-4 5 8 6-24z" fill="#c4182c" stroke="#14111a" stroke-width="2.6" stroke-linejoin="round"/><path d="M45 36l9 22-10-4-5 8-6-24z" fill="#17224a" stroke="#14111a" stroke-width="2.6" stroke-linejoin="round"/><circle cx="32" cy="26" r="21" fill="url(#irg)" stroke="#14111a" stroke-width="3.2"/><circle cx="32" cy="26" r="15.5" fill="none" stroke="#14111a" stroke-width="1.6" stroke-dasharray="2.4 3"/><polygon points="32.0,15.5 34.7,22.8 42.5,23.1 36.4,27.9 38.5,35.4 32.0,31.1 25.5,35.4 27.6,27.9 21.5,23.1 29.3,22.8" fill="#fff6e0" stroke="#14111a" stroke-width="2.4" stroke-linejoin="round"/><circle cx="52" cy="11" r="9.5" fill="#c4182c" stroke="#14111a" stroke-width="2.6"/><path d="M53.5 5l-6 7.5h4l-1.5 6 6.5-8h-4.2z" fill="#ffe27a" stroke="#14111a" stroke-width="1.3" stroke-linejoin="round"/></svg>' };
    const bloco = (id, titulo, sub, qtd) => { const b = h('button', { type: 'button', role: 'tab', class: `fig-bloco b-${id}${qual === id ? ' on' : ''}`, 'aria-selected': String(qual === id), onclick: () => { area = id; draw(); } }, h('span', { class: 'fig-bloco-ic', 'aria-hidden': 'true' }), h('b', {}, titulo), h('small', {}, sub), qtd ? h('i', {}, String(qtd)) : null); b.querySelector('.fig-bloco-ic').innerHTML = ico[id]; return b; };
    return h('section', { class: 'fig-packs' },
      h('div', { class: 'fig-blocos', role: 'tablist', 'aria-label': 'roleta, baú e resgate' }, bloco('roleta', 'roleta', 'gire e ganhe', giros.length), bloco('bau', 'baú', 'pacotinhos e guardadas', bau.length + (hand.length ? 0 : 0)), bloco('resgate', 'resgatar', 'print + desafio', 0)),
      corpo,
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
      h('button', { type: 'button', class: 'btn primary wide', onclick: () => { save(L.pasteAll(state)); close(); toast('coladas no álbum'); } }, 'colar automaticamente'),
      h('button', { type: 'button', class: 'btn wide', onclick: () => { const q = cards.filter((e) => L.canPaste(state, e.codigo)).length; close(); toast(q ? `${q} figurinha${q > 1 ? 's' : ''} guardada${q > 1 ? 's' : ''} no baú` : 'tudo certo, nada novo pra guardar'); } }, 'guardar no baú'));
  }
  /** Paleta aleatória da roleta (nunca igual de uma vez pra outra): 8 fatias, 2 a 4 cores vivas combinadas com o creme e o azul-marinho da marca. */
  function coresRoleta() {
    const base = Math.floor(Math.random() * 360); const passo = [30, 60, 90, 120, 150][Math.floor(Math.random() * 5)]; const n = 2 + Math.floor(Math.random() * 3);
    const vivas = Array.from({ length: n }, (_, k) => `hsl(${(base + k * passo) % 360} ${70 + Math.floor(Math.random() * 20)}% ${48 + Math.floor(Math.random() * 12)}%)`);
    const neutras = ['#efe2c6', '#17224a', '#fff6e0', '#14111a'];
    const fatias = Array.from({ length: 8 }, (_, k) => (k % 2 === 0 ? vivas[(k / 2) % vivas.length] : neutras[Math.floor(Math.random() * neutras.length)]));
    return `conic-gradient(${fatias.map((c, k) => `${c} 0 ${(k + 1) * 12.5}%`).join(', ')})`;
  }
  /** Máquina caça-níquel do GIRO ÉPICO (pedido da Bea): 3 rolos que param um depois do outro em 7 · 7 · 7. Devolve { el, girar(aoFim) }. */
  function maquinaEpica() {
    const SIMB = ['⭐', '🥁', '🎸', '🎵', '🎹', '🎤', '💿'], N = 24, ALT = 84;
    const rolos = [0, 1, 2].map(() => { const tira = h('div', { class: 'sl-tira' }); for (let i = 0; i < N; i++) { const sete = i === N - 1; tira.append(h('div', { class: `sl-sim${sete ? ' sete' : ''}`, 'aria-hidden': 'true' }, sete ? '7' : SIMB[Math.floor(Math.random() * SIMB.length)])); } return { tira, janela: h('div', { class: 'sl-janela' }, tira) }; });
    const luzes = h('div', { class: 'sl-luzes', 'aria-hidden': 'true' }, ...Array.from({ length: 14 }, (_, k) => h('i', { style: `--k:${k}` })));
    const placa = h('div', { class: 'sl-placa', role: 'status', 'aria-live': 'polite' }, 'girando…');
    const el = h('div', { class: 'sl-maq', 'aria-label': 'máquina do giro épico' }, h('div', { class: 'sl-topo' }, '⚡ GIRO ÉPICO ⚡'), luzes, h('div', { class: 'sl-rolos' }, ...rolos.map((x) => x.janela)), placa);
    return { el, girar(aoFim) {
      const dur = [1.7, 2.5, 3.3];
      requestAnimationFrame(() => requestAnimationFrame(() => rolos.forEach((x, i) => { x.tira.style.transition = `transform ${dur[i]}s cubic-bezier(.12,.72,.18,1)`; x.tira.style.transform = `translateY(-${(N - 1) * ALT}px)`; })));
      setTimeout(() => { el.classList.add('jackpot'); placa.textContent = '7 · 7 · 7  JACKPOT!'; }, dur[2] * 1000 + 100);
      setTimeout(aoFim, dur[2] * 1000 + 1500);
    } };
  }
  /** Pacote comum abre direto; roleta e prêmio de jogo têm a sua cena (girar / abrir o prêmio) e só gastam quando a pessoa gira. */
  function openIt(packId) {
    const kind = L.packKind(packId);
    if (kind === 'pacote') {
      const r = L.openPack(state, catalog, packId); if (!r.fresh) return; save(r.state);
      sheet('seu pacote', (close) => revealUI(r.codes, close, true)); return; // as figurinhas já aparecem viradas: ninguém precisa tocar pra descobrir
    }
    const roleta = kind === 'roleta' || kind === 'epico'; const ep = L.epicoPack(packId);
    sheet(kind === 'epico' ? '⚡ giro épico' : roleta ? '🎡 roleta de figurinhas' : '🏆 prêmio do jogo completo', (close) => {
      const box = h('div', { class: 'fig-open fig-wheelbox' });
      if (kind === 'epico') { // caça-níquel: 7 7 7 e as cartas (1º giro: clássica + exclusiva + rara · 2º giro: até 5, mais comuns e raras)
        const maq = maquinaEpica();
        box.append(h('p', { class: 'fig-note' }, ep.n === 1 ? 'giro épico 1 de 2: sempre 3 figurinhas, uma clássica, uma exclusiva e uma rara!' : 'giro épico 2 de 2: de 1 a 5 figurinhas. se vier só uma, é exclusiva!'), maq.el);
        const girar = () => { const r = L.openPack(state, catalog, packId); if (!r.fresh) { close(); return; } save(r.state); const mostra = () => box.replaceChildren(revealUI(r.codes, close, true)); if (wantsLess(state)) { mostra(); return; } rufo(3.4); maq.girar(mostra); };
        setTimeout(() => { if (box.isConnected) girar(); }, 450); // um toque só: abre e já gira
        return box;
      }
      const disc = h('div', { class: 'fig-wheel-disc' + (roleta ? '' : ' prize'), 'aria-hidden': 'true' }, h('span', { class: 'fig-wheel-hub' }, roleta ? h('img', { class: 'fig-hub-paul', src: 'assets/paul/colorido/paul-ouvindo.webp', alt: '', draggable: 'false' }) : '🏆'));
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
        void hue; // no meio da roleta fica o rosto do Paul (pedido da Bea), em qualquer desenho
      }
      const go = h('button', { type: 'button', class: 'btn primary wide', onclick: () => {
        go.disabled = true; const r = L.openPack(state, catalog, packId); if (!r.fresh) { close(); return; }
        save(r.state); const mostra = () => box.replaceChildren(revealUI(r.codes, close, true));
        if (wantsLess(state)) { mostra(); return; }
        disc.style.transform = `rotate(${1440 + Math.floor(Math.random() * 360)}deg)`; disc.classList.add('spin'); rufo(3.2); setTimeout(mostra, 3300);
      } }, roleta ? 'girando…' : 'abrir o prêmio');
      if (roleta) setTimeout(() => { if (go.isConnected && !go.disabled) go.click(); }, 450); // um toque só: abre e já gira
      box.append(h('p', { class: 'fig-note' }, kind === 'epico' ? (ep.n === 1 ? 'giro épico 1 de 2: 3 figurinhas garantidas!' : 'giro épico 2 de 2: de 1 a 5 figurinhas. se vier só uma, é exclusiva!') : roleta ? 'de 1 a 3 figurinhas. com sorte, vem uma rara, uma dos Beatles… ou uma exclusiva!' : 'você terminou um jogo inteiro! é um pacote de 3 com uma rara garantida.'), h('div', { class: 'fig-wheel' }, disc, ...extras, h('i', { class: 'fig-wheel-pin', 'aria-hidden': 'true' })), go);
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
