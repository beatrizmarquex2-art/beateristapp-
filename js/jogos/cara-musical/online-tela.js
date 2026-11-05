// Cara a Cara Musical em 2 celulares: tela da partida. Protocolo em online-regras.js; canal = sala do Supabase (js/jogos/online.js).
// Cada celular guarda a PRÓPRIA carta secreta só no aparelho (localStorage, por sala e rodada) e responde às perguntas do outro sozinho.
import { h } from '../../util.js';
import { sheet, confirmSheet } from '../../ui.js';
import { sfx } from '../base.js';
import { linkBadge } from '../online.js';
import { BY_ID } from './elenco.js';
import { BY_Q, textoDe } from './perguntas.js';
import * as R from './regras.js';
import * as O from './online-regras.js';
import { fatosDe } from './fichas.js';
import { mini, grande, posOf, loadCat } from './midia.js';

const guardar = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } };
const ler = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
export const ULTIMA = 'cm-online-ultima';

/** Monta a partida online dentro de `root`. `conn` já conectada, `estado` = estado atual da sala, `sair()` volta ao menu. */
export async function mountOnline(root, { conn, estado, sair }) {
  await loadCat();
  const me = conn.me; const eu = (p) => (p === me ? 'você' : 'o outro'); const code = conn.code;
  guardar(ULTIMA, { code, me });
  let e = estado; let msg = ''; let sel = null; let palpitando = false; let respondendo = false; let revelando = false; let gone = false; let conferencia = null;
  const chave = () => `cm-online-${code}-${e.rodada}`;
  const meu = () => ler(chave()); // { segredo, sal } só neste aparelho
  const badge = linkBadge(); conn.on.link = (v) => badge.set(v);
  conn.on.state = (novo) => { e = novo; msg = ''; sel = null; palpitando = false; render(); reagir(); };

  async function agir(fn) { let novo; try { novo = fn(e); } catch { return; } const ok = await conn.push(novo); if (ok && !gone) { e = novo; render(); reagir(); } }
  /** Respostas automáticas: quem foi perguntado responde do próprio aparelho; no fim cada um revela a sua carta. */
  async function reagir() {
    if (gone) return; const m = meu(); const pend = O.pendente(e);
    if (pend && pend.p !== me && m && !respondendo) { respondendo = true; await agir((s) => O.responder(s, me, m.segredo)); respondendo = false; sfx('tap'); }
    if (O.fase(e) === 'fim' && !e.reveal[me] && m && !revelando) { revelando = true; await agir((s) => O.revelar(s, me, m.segredo, m.sal)); revelando = false; }
    if (O.fase(e) === 'fim' && e.reveal[1 - me] && !conferencia) { conferencia = O.conferir(e, 1 - me); conferencia.then(() => { if (!gone) render(); }); }
  }
  const celula = (id, { fora = false, aoToque, selecionada = false } = {}) => { const c = O.cartaDe(e, id); const ent = BY_ID[id];
    return h('div', { class: `cm-cell${fora ? ' out' : ''}${selecionada ? ' sel' : ''}` }, h('button', { type: 'button', class: 'cm-card', 'aria-pressed': String(selecionada), 'aria-label': `${ent.curto}${fora ? ', virada' : ''}`, onclick: () => aoToque(id) },
      h('img', { src: mini(c.foto), alt: '', loading: 'lazy', draggable: 'false', style: `object-position:${posOf(c.foto)}` }), h('small', { class: ent.curto.split(' ').some((w) => w.length > 10) ? 'long' : '' }, ent.curto), fora ? h('i', { class: 'cm-x', 'aria-hidden': 'true' }, '✕') : null)); };
  const grade = (ids, opt) => h('div', { class: `cm-grade ${e.mesa.cartas.length <= 6 ? 'cm-g3' : 'cm-g4'}`, role: 'group', 'aria-label': 'cartas' }, ...ids.map((id) => celula(id, { fora: typeof opt.fora === 'function' ? opt.fora(id) : false, selecionada: opt.selecionada === id, aoToque: opt.aoToque })));
  const zoom = (id) => { const c = O.cartaDe(e, id); sheet(BY_ID[id].curto, () => h('div', { class: 'sheet-body cm-zoom' }, h('img', { src: grande(c.foto), alt: `foto de ${BY_ID[id].curto}`, onerror: (ev) => { ev.target.src = mini(c.foto); } }), h('b', {}, BY_ID[id].curto)));
  };
  const topo = () => [badge.el, h('div', { class: 'cm-placar', 'aria-label': 'placar' }, h('b', {}, `você ${e.serie.vitorias[me]} × ${e.serie.vitorias[1 - me]} o outro`), e.serie.empates ? h('small', {}, `${e.serie.empates} empate${e.serie.empates > 1 ? 's' : ''}`) : null, h('small', {}, `melhor de 3 · rodada ${e.rodada} · sala ${code}`))];
  const botaoSair = () => h('div', { class: 'cm-acoes' }, h('button', { class: 'btn small ghost', type: 'button', onclick: async () => { if (await confirmSheet('sair da sala?', 'você pode voltar depois com o mesmo aparelho, pelo botão “voltar pra sala”.', 'sair')) { gone = true; conn.close(); sair(true); } } }, 'Sair'));

  function render() {
    if (gone) return; const f = O.fase(e); const m = meu();
    if (f === 'escolha') return telaEscolha(m);
    if (f === 'fim') return telaFim();
    return telaJogo(m);
  }
  function telaEscolha(m) {
    const jaEscolhi = !!e.selos[me];
    if (jaEscolhi && !m) return root.replaceChildren(...topo(), h('p', { class: 'jg-p' }, 'este aparelho perdeu a sua carta secreta (os dados do navegador foram apagados). recomece a rodada.'), h('button', { class: 'btn primary', type: 'button', onclick: () => agir((s) => O.proxima({ ...s, serie: { ...s.serie, fim: false }, rodada: s.rodada - 1 }, R.novaMesa({ modo: s.modo, tamanho: s.mesa.cartas.length }))) }, 'recomeçar rodada'), botaoSair());
    if (jaEscolhi) return root.replaceChildren(...topo(), h('p', { class: 'jg-p' }, `sua carta secreta já está guardada. esperando o outro celular escolher…`), h('div', { class: 'cm-minha' }, h('img', { src: mini(O.cartaDe(e, m.segredo).foto), alt: '' }), h('span', {}, `sua carta: ${BY_ID[m.segredo].curto}`)), botaoSair());
    root.replaceChildren(...topo(), h('h2', { class: 'jg-h hand' }, 'escolha a sua carta secreta'), h('p', { class: 'jg-p' }, 'só você vê esta tela. o outro celular vai tentar descobrir qual é.'),
      grade(e.mesa.cartas.map((c) => c.id), { aoToque: (id) => sheet(`é esta, ${BY_ID[id].curto}?`, (close) => h('div', { class: 'sheet-body cm-zoom' }, h('img', { src: mini(O.cartaDe(e, id).foto), alt: '' }), h('button', { class: 'btn primary', type: 'button', onclick: async () => { close(); const sal = O.novoSal(); guardar(chave(), { segredo: id, sal }); const sel$ = await O.selo(id, sal); agir((s) => O.escolher(s, me, sel$)); } }, 'esta é a minha carta secreta'))) }), botaoSair());
  }
  function telaJogo(m) {
    const lado = O.ladoDe(e, me); const minhaVez = e.turno === me && !O.pendente(e) && !lado.terminou; const pend = O.pendente(e);
    const cand = R.candidatosDo(e.mesa, lado); const kids = e.modo === 'kids';
    const ultimaA = [...e.log].reverse().find((x) => x.p === me && (x.t === 'a' || x.t === 'v')); const ultimaDoOutro = [...e.log].reverse().find((x) => x.p !== me && (x.t === 'a' || x.t === 'v'));
    const frase = pend ? (pend.p === me ? 'esperando o outro responder…' : 'respondendo…') : lado.terminou ? 'você já terminou. esperando o outro acabar…' : minhaVez ? 'sua vez!' : 'vez do outro. espere…';
    const lastOutro = ultimaDoOutro && ultimaDoOutro.t === 'a' ? `o outro perguntou: ${textoDe(BY_Q[ultimaDoOutro.qid], e.modo)} → você respondeu ${ultimaDoOutro.sim ? 'SIM' : 'NÃO'}` : ultimaDoOutro ? `o outro palpitou ${BY_ID[ultimaDoOutro.id].curto}: ${ultimaDoOutro.ok ? 'acertou!' : 'errou'}` : '';
    const sug = kids ? R.sugestoes(e.mesa, { ...lado, segredo: null }, 3) : null; const todas = O.perguntasLivres(e, me);
    const botao = (q, grande$) => h('button', { type: 'button', class: grande$ ? 'cm-q big' : 'jg-qbtn', onclick: () => { sfx('tap'); agir((s) => O.perguntar(s, me, q.id)); } }, grande$ ? h('span', { 'aria-hidden': 'true' }, q.icone) : null, grande$ ? ` ${q.kids}` : textoDe(q, e.modo));
    root.replaceChildren(...topo(),
      h('p', { class: minhaVez ? 'cm-vez' : 'jg-p', role: 'status', 'aria-live': 'polite' }, frase),
      h('div', { class: 'jg-bar' }, h('div', { class: 'jg-who' }, h('b', {}, 'perguntas'), h('span', {}, String(lado.perguntas.length))), h('div', { class: 'jg-who' }, h('b', {}, 'palpites'), h('span', { 'aria-label': `${lado.palpites} restantes` }, '♥'.repeat(lado.palpites) + '♡'.repeat(Math.max(0, e.palpites - lado.palpites)))), h('div', { class: 'jg-who' }, h('b', {}, 'cartas'), h('span', {}, String(cand.length)))),
      m ? h('p', { class: 'cm-minha' }, h('img', { src: mini(O.cartaDe(e, m.segredo).foto), alt: '' }), h('span', {}, `sua carta secreta: ${BY_ID[m.segredo].curto}`)) : null,
      ultimaA && ultimaA.t === 'a' ? h('div', { class: 'cm-paul', role: 'status' }, h('img', { src: 'assets/paul/e02.webp', alt: '', width: 44, height: 36 }), h('p', {}, `${ultimaA.sim ? 'SIM' : 'NÃO'}! ${BY_Q[ultimaA.qid].porque}`)) : null,
      lado.dica ? h('p', { class: 'cm-dica', role: 'status' }, `dica: ${textoDe(BY_Q[lado.dica.id], 'kids')} → ${lado.dica.sim ? 'SIM' : 'NÃO'}`) : null,
      lastOutro ? h('p', { class: 'jg-p muted' }, lastOutro) : null,
      grade(e.mesa.cartas.map((c) => c.id), { fora: id => lado.fora.includes(id) || lado.erros.includes(id), selecionada: sel, aoToque: (id) => { if (palpitando) { sel = sel === id ? null : id; sfx('tap'); render(); } else zoom(id); } }),
      palpitando ? h('div', { class: 'jg-pick', role: 'group' }, sel ? h('b', {}, `é ${BY_ID[sel].curto}?`) : h('b', {}, 'toque na carta que você acha que é'), sel ? h('button', { class: 'btn small primary', type: 'button', onclick: () => { const id = sel; palpitando = false; agir((s) => O.palpitar(s, me, id)); } }, 'sim, adivinhar!') : null, h('button', { class: 'btn small ghost', type: 'button', onclick: () => { palpitando = false; sel = null; render(); } }, 'voltar às perguntas'))
        : minhaVez ? h('div', {}, kids ? h('div', { class: 'cm-qs', role: 'group', 'aria-label': 'perguntas' }, h('b', {}, 'pergunte:'), ...sug.map((q) => botao(q, true)), todas.length > sug.length ? h('button', { class: 'btn small ghost', type: 'button', onclick: () => sheet('mais perguntas', (close) => h('div', { class: 'sheet-body cm-mais' }, ...todas.filter((q) => !lado.perguntas.some((x) => x.id === q.id)).map((q) => h('button', { type: 'button', class: 'cm-q big', onclick: () => { close(); agir((s) => O.perguntar(s, me, q.id)); } }, h('span', { 'aria-hidden': 'true' }, q.icone), ` ${q.kids}`)))) }, 'mais perguntas') : null)
          : h('div', { class: 'jg-qs', role: 'group', 'aria-label': 'perguntas' }, h('b', {}, 'pergunte:'), ...todas.map((q) => botao(q, false))),
          h('div', { class: 'cm-acoes' }, h('button', { class: 'btn primary big', type: 'button', onclick: () => { palpitando = true; sel = null; render(); } }, 'Adivinhar!'))) : null,
      botaoSair());
  }
  function telaFim() {
    const l = [O.ladoDe(e, 0), O.ladoDe(e, 1)]; const r = e.fim; const venceu = r.vencedor === me; const outro = e.reveal[1 - me]; const meuReveal = meu();
    const titulo = e.serie.fim ? (e.serie.vencedor === me ? 'você venceu o duelo! 🤘' : 'o outro venceu o duelo') : r.vencedor === null ? 'rodada empatada' : venceu ? 'você venceu a rodada!' : 'o outro venceu a rodada';
    const bloco = (rev, tit, p) => { if (!rev) return h('div', { class: 'cm-ficha' }, h('small', {}, tit), h('p', {}, 'esperando a revelação…')); const c = O.cartaDe(e, rev.segredo); const ent = BY_ID[rev.segredo]; const fatos = fatosDe(rev.segredo);
      return h('div', { class: 'cm-ficha' }, h('small', {}, tit), h('img', { src: grande(c.foto), alt: `foto de ${ent.curto}`, onerror: (ev) => { ev.target.src = mini(c.foto); } }), h('b', {}, ent.curto), fatos.length ? h('ul', {}, ...fatos.map((x) => h('li', {}, x))) : null, h('small', {}, `${l[p].perguntas.length} pergunta${l[p].perguntas.length === 1 ? '' : 's'} · ${l[p].acertou ? 'acertou' : 'não acertou'}`)); };
    root.replaceChildren(...topo(), h('h3', { class: 'hand' }, titulo), h('p', { class: 'jg-p' }, `${r.motivo} (você ${r.perguntas[me]} × ${r.perguntas[1 - me]} o outro, em perguntas)`),
      h('div', { class: 'cm-fichas' }, bloco(outro, 'carta do outro', 1 - me), bloco(e.reveal[me] || (meuReveal ? { segredo: meuReveal.segredo } : null), 'sua carta', me)),
      outro && conferencia ? h('p', { class: 'jg-p muted', id: 'cm-conferencia' }, 'conferindo…') : null,
      h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { conferencia = null; agir((s) => O.proxima(s, R.novaMesa({ modo: s.modo, tamanho: s.mesa.cartas.length }))); } }, e.serie.fim ? 'novo duelo' : 'próxima rodada'), h('button', { class: 'btn ghost', type: 'button', onclick: () => { gone = true; conn.close(); sair(true); } }, 'sair da sala')));
    if (conferencia) conferencia.then((c) => { const el = root.querySelector('#cm-conferencia'); if (el) el.textContent = c.ok ? '✓ cartas conferidas: o outro jogou limpo' : `⚠ ${c.problemas.join('; ')}`; });
  }
  render(); reagir();
  return { destroy() { gone = true; conn.close(); }, inProgress: () => !gone && O.fase(e) === 'jogo' };
}
