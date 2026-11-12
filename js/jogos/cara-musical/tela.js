// Cara a Cara Musical: telas. Regras em regras.js (puras), elenco em elenco.js, perguntas em perguntas.js, falas do Paul em falas.js.
// Fluxo: menu (Kids ou Clássico, Solo com Paul / Contra Paul / Dupla) → (tutorial Kids) → partida → ficha da rodada → placar (melhor de 3 nos duelos).
// Não dá figurinha, pacote nem recompensa; não mexe em ranking nem estrelas.
import { h } from '../../util.js';
import { bq } from '../bonequinhos.js';
import { sheet, confirmSheet, toast } from '../../ui.js';
import { getGame, setGame, sfx } from '../base.js';
import { BY_ID } from './elenco.js';
import { BY_Q, textoDe } from './perguntas.js';
import * as R from './regras.js';
import { falador } from './falas.js';
import { fatosDe } from './fichas.js';
import { lobby, reenter, salaAutoPara } from '../online.js';
import * as O from './online-regras.js';
import { mountOnline, ULTIMA } from './online-tela.js';
import * as Contestar from './contestar.js';

const GID = 'cara';
import { mini, grande, loadCat, enquadreFoto, nomeCls } from './midia.js';
import { ganhou } from '../estrelas-jogo.js';

export function mountMusical(host, { onTema } = {}) {
  const fala = falador(); const timers = new Set(); let gone = false;
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!gone) fn(); }, ms); timers.add(t); return t; };
  const saved = getGame(GID).musical || {};
  const cfg = { modo: saved.modo === 'classico' ? 'classico' : 'kids', jogo: ['solo', 'paul', 'dupla', 'online'].includes(saved.jogo) ? saved.jogo : 'solo', tamanho: saved.tamanho || 0, nivel: saved.nivel === 'desafio' ? 'desafio' : 'iniciante', auto: saved.auto !== false, tutorialVisto: saved.tutorialVisto === true };
  const salvar = () => setGame(GID, { musical: { ...cfg } });
  let st = null; // partida
  const root = h('div', { class: 'jg jg-cara cm-root' }); host.replaceChildren(root);
  const tamanhoPadrao = () => (cfg.tamanho && R.TAMANHOS[cfg.modo].includes(cfg.tamanho) ? cfg.tamanho : R.TAMANHOS[cfg.modo][0]);
  const nomeJ = (i) => (cfg.jogo === 'dupla' ? `Jogador ${i + 1}` : i === 0 ? 'você' : 'Paul');

  /* ---------------- componentes ---------------- */
  const seg = (lista, atual, onPick, rotulo) => h('div', { class: 'jg-seg', role: 'radiogroup', 'aria-label': rotulo }, ...lista.map(([v, l, ic]) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(atual === v), 'aria-label': ic ? l : null, title: ic ? l : null, class: `${atual === v ? 'on' : ''}${ic ? ' jg-ic' : ''}`, onclick: () => onPick(v) }, ic ? bq(ic) : l)));
  const temaRow = () => seg([['instrumentos', 'instrumentos'], ['musical', 'cara a cara musical']], 'musical', (v) => { if (v !== 'musical' && onTema) onTema(v); }, 'tema');
  const paulFala = (txt) => (txt ? h('div', { class: 'cm-paul', role: 'status', 'aria-live': 'polite' }, h('img', { src: 'assets/paul/e02.webp', alt: '', width: 44, height: 36, draggable: 'false' }), h('p', {}, txt)) : null);
  function zoom(carta) {
    const e = BY_ID[carta.id]; sheet(e.curto, () => h('div', { class: 'sheet-body cm-zoom' }, h('img', { src: grande(carta.foto), alt: `foto de ${e.curto}`, onerror: (ev) => { ev.target.src = mini(carta.foto); } }), h('b', {}, e.curto), h('small', {}, 'toque fora pra fechar. a ficha completa aparece no fim da rodada.')));
  }

  /* ---------------- contestar uma resposta do Paul ---------------- */
  function contestar(q, a, segredoId) {
    const carta = st.mesa.cartas.find((c) => c.id === segredoId); const nome = BY_ID[segredoId].curto; const texto = textoDe(q, cfg.modo);
    sheet('contestar resposta', (close) => {
      const nota = h('input', { class: 'field', type: 'text', maxlength: '140', placeholder: 'quer explicar? (opcional)', 'aria-label': 'explicação' });
      const enviar = (parecer) => { Contestar.registrar({ q, carta, nomeCarta: nome, texto, resposta: a.sim, parecer, nota: nota.value }); close(); sfx('tap'); toast('anotado! essa pergunta some dessa carta neste aparelho até a Bea revisar.', { ms: 3600 }); };
      return h('div', { class: 'sheet-body cm-contesta-sheet' }, h('p', {}, `a carta secreta é ${nome}. você perguntou "${texto}" e o Paul respondeu `, h('b', {}, a.sim ? 'SIM' : 'NÃO'), '.'),
        h('p', { class: 'muted' }, 'o que você acha dessa resposta?'), nota,
        h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => enviar('errado') }, 'acho que está errado'), h('button', { class: 'btn', type: 'button', onclick: () => enviar('duvida') }, 'não tenho certeza')));
    });
  }
  /** Todas as respostas da rodada, pra contestar depois que ela acabou. */
  function contestarDaRodada() {
    const itens = st.lados.flatMap((l) => l.perguntas.map((a) => ({ a, segredo: l.segredo })));
    sheet('contestar uma resposta', (close) => h('div', { class: 'sheet-body cm-contesta-sheet' }, h('p', { class: 'muted' }, 'toque na resposta que você acha que está errada.'),
      h('ol', { class: 'cm-contesta-lista' }, ...itens.map(({ a, segredo }) => h('li', {}, h('button', { class: 'cm-contesta-item', type: 'button', onclick: () => { close(); contestar(BY_Q[a.id], a, segredo); } }, h('b', {}, a.sim ? 'SIM' : 'NÃO'), ` · ${textoDe(BY_Q[a.id], cfg.modo)} `, h('small', {}, `(${BY_ID[segredo].curto})`)))))));
  }
  function contestacoes() {
    const lista = Contestar.listar();
    sheet(`respostas contestadas (${lista.length})`, (close) => h('div', { class: 'sheet-body cm-contesta-sheet' },
      lista.length ? h('ol', { class: 'cm-contesta-lista' }, ...lista.map((r) => h('li', {}, h('b', {}, r.carta), ` · "${r.pergunta}" · Paul: ${r.paul} · ${r.parecer === 'errado' ? 'acho errado' : 'em dúvida'}`, r.nota ? h('small', {}, ` (${r.nota})`) : null))) : h('p', { class: 'muted' }, 'nenhuma por enquanto.'),
      h('div', { class: 'jg-actions' }, lista.length ? h('button', { class: 'btn', type: 'button', onclick: async () => { const t = Contestar.textoParaCopiar(); try { await navigator.clipboard.writeText(t); toast('copiado! manda pra Bea.', { ms: 2200 }); } catch { toast('não deu pra copiar neste aparelho.', { ms: 2600 }); } } }, 'copiar a lista pra Bea') : null,
        lista.length ? h('button', { class: 'btn ghost', type: 'button', onclick: async () => { if (await confirmSheet('limpar a lista?', 'as respostas voltam a valer neste aparelho.', 'limpar')) { Contestar.limpar(); close(); menu(); } } }, 'limpar') : null)));
  }

  /* ---------------- menu ---------------- */
  function menu() {
    st = null;
    const tam = tamanhoPadrao(); const kids = cfg.modo === 'kids';
    root.replaceChildren(...[
      h('h2', { class: 'jg-h hand' }, 'cara a cara musical'), 
      h('p', { class: 'jg-p' }, 'Faça uma pergunta. O Paul responde. Vire as cartas que não combinam. Descubra o artista!'),
      h('p', { class: 'jg-lab' }, 'modo'), seg([['kids', 'kids (cartas grandes)'], ['classico', 'clássico']], cfg.modo, (v) => { cfg.modo = v; cfg.tamanho = 0; salvar(); menu(); }, 'modo'),
      h('p', { class: 'jg-lab' }, 'como jogar'), seg([['solo', 'solo com o Paul', 'um'], ['paul', 'contra o Paul', 'paul'], ['dupla', 'dupla (mesmo aparelho)', 'dois'], ['online', '2 celulares (código)', 'celular']], cfg.jogo, (v) => { cfg.jogo = v; salvar(); menu(); }, 'jogo'),
      h('p', { class: 'jg-lab' }, 'cartas na mesa'), seg(R.TAMANHOS[cfg.modo].map((n) => [n, `${n} cartas`]), tam, (v) => { cfg.tamanho = v; salvar(); menu(); }, 'tamanho'),
      cfg.jogo === 'paul' ? h('div', {}, h('p', { class: 'jg-lab' }, 'nível do Paul'), seg([['iniciante', 'iniciante'], ['desafio', 'desafio']], cfg.nivel, (v) => { cfg.nivel = v; salvar(); menu(); }, 'nível')) : null,
      kids ? null : h('div', {}, h('p', { class: 'jg-lab' }, 'eliminar cartas'), seg([[true, 'automático'], [false, 'manual']], cfg.auto, (v) => { cfg.auto = v; salvar(); menu(); }, 'eliminar'), cfg.auto ? null : h('p', { class: 'jg-p muted' }, 'manual: depois da resposta, toque no ✕ das cartas que não combinam (toca de novo pra desvirar) e então em "pronto".')),
      h('p', { class: 'jg-p muted' }, kids ? `kids: perguntas prontas num toque, ${cfg.jogo === 'solo' ? 'o Paul ajuda você' : 'duelo com melhor de 3'}, 2 palpites e dica depois do primeiro erro.` : `clássico: ${tam} artistas, todas as perguntas, 1 palpite${cfg.jogo === 'solo' ? ' e contador de perguntas' : ' e melhor de 3 (menos perguntas vence)'}.`),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: cfg.jogo === 'online' ? salaOnline : iniciar }, cfg.jogo === 'online' ? 'criar ou entrar numa sala' : 'jogar'), voltarSala(), kids ? h('button', { class: 'btn ghost', type: 'button', onclick: tutorial }, 'como jogar (20s)') : null),
      Contestar.listar().length ? h('div', { class: 'jg-actions' }, h('button', { class: 'btn small ghost', type: 'button', onclick: contestacoes }, `respostas contestadas (${Contestar.listar().length})`)) : null,
    ].filter(Boolean));
  }

  /* ---------------- 2 celulares (sala com código) ---------------- */
  let online = null;
  const iniciarOnline = async (conn, estado) => { if (gone) { conn.close(); return; } online = await mountOnline(root, { conn, estado, sair: (limpar) => { if (limpar) { try { localStorage.removeItem(ULTIMA); } catch { /* */ } } online = null; menu(); } }); };
  async function salaOnline() {
    await loadCat(); if (gone) return; const modo = cfg.modo; const tam = tamanhoPadrao();
    const lob = lobby({ jogo: 'cara-musical', makeState: () => O.novoEstado({ modo, mesa: R.novaMesa({ modo, tamanho: tam }) }), onStart: iniciarOnline });
    root.replaceChildren(h('h2', { class: 'jg-h hand' }, '2 celulares'), h('p', { class: 'jg-p muted' }, `quem cria a sala escolhe o modo (${modo === 'kids' ? 'kids' : 'clássico'}, ${tam} cartas). a sua carta secreta fica só no seu celular.`), lob.el, h('div', { class: 'jg-actions' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => { lob.close(); menu(); } }, 'voltar')));
  }
  /** botão pra voltar a uma sala em que este celular já estava (caiu a internet ou fechou o app) */
  function voltarSala() {
    let ult = null; try { ult = JSON.parse(localStorage.getItem(ULTIMA)); } catch { /* */ }
    if (!ult || cfg.jogo !== 'online') return null;
    return h('button', { class: 'btn', type: 'button', onclick: async (ev) => { ev.target.disabled = true; try { const r = await reenter(ult.code, ult.me); if (!r) { try { localStorage.removeItem(ULTIMA); } catch { /* */ } ev.target.textContent = 'a sala não existe mais'; return; } await loadCat(); iniciarOnline(r.conn, r.estado); } catch { ev.target.disabled = false; ev.target.textContent = 'sem internet, tente de novo'; } } }, `voltar pra sala ${ult.code}`);
  }

  /* ---------------- tutorial (Kids, ~25 s, perguntas visuais) ---------------- */
  async function tutorial() {
    await loadCat(); if (gone) return; cfg.tutorialVisto = true; salvar();
    const ids = ['the-beatles', 'charlie-brown-jr', 'eloy-casagrande', 'bad-bunny'].filter((i) => BY_ID[i]); const cartas = ids.map((id) => ({ id, foto: BY_ID[id].fotos[0] }));
    const passos = [
      { fala: 'Vou escolher uma carta em segredo. Você descobre qual é!', fora: [], dest: null, pergunta: null },
      { fala: 'Toque numa pergunta. Eu respondo SIM ou NÃO.', fora: [], dest: null, pergunta: '🎸 É uma banda?' },
      { fala: 'SIM! Vamos virar as que não são.', fora: ['eloy-casagrande', 'bad-bunny'], dest: null, pergunta: '🎸 É uma banda?' },
      { fala: 'Agora sobraram duas. Pergunte: É do Brasil?', fora: ['eloy-casagrande', 'bad-bunny'], dest: null, pergunta: '🇧🇷 É do Brasil?' },
      { fala: 'NÃO! Então é esta! Toque em Adivinhar e escolha a carta.', fora: ['eloy-casagrande', 'bad-bunny', 'charlie-brown-jr'], dest: 'the-beatles', pergunta: '🇧🇷 É do Brasil?' },
    ];
    let k = 0; const box = h('div', { class: 'cm-tut' });
    const draw = () => { const p = passos[k];
      box.replaceChildren(paulFala(p.fala), h('div', { class: 'cm-grade cm-g2' }, ...cartas.map((c) => h('div', { class: `cm-card${p.fora.includes(c.id) ? ' out' : ''}${p.dest === c.id ? ' dest' : ''}` }, h('img', { src: mini(c.foto), alt: '', style: enquadreFoto(c.foto) }), h('small', {}, BY_ID[c.id].curto), p.fora.includes(c.id) ? h('i', { class: 'cm-x' }, '✕') : null))),
        p.pergunta ? h('div', { class: 'cm-q big' }, p.pergunta) : null, h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => { if (k < passos.length - 1) { k++; draw(); } else menu(); } }, k < passos.length - 1 ? 'próximo' : 'entendi!'), h('button', { class: 'btn ghost', type: 'button', onclick: menu }, 'pular')));
      sfx('tap'); };
    root.replaceChildren(h('h2', { class: 'jg-h hand' }, 'como jogar'), box); draw();
    const auto = () => { if (gone || !box.isConnected) return; if (k < passos.length - 1) { k++; draw(); later(auto, 4500); } }; later(auto, 4500);
  }

  /* ---------------- iniciar partida ---------------- */
  async function iniciar() {
    await loadCat(); if (gone) return;
    if (cfg.modo === 'kids' && !cfg.tutorialVisto) { await tutorial(); return; }
    const mesa = R.novaMesa({ modo: cfg.modo, tamanho: tamanhoPadrao() });
    const palpites = cfg.modo === 'kids' ? 2 : 1; const ids = mesa.cartas.map((c) => c.id); const sortear = (excl) => R.shuffle(ids.filter((i) => !excl.includes(i)))[0];
    st = { mesa, palpites, serie: cfg.jogo === 'solo' ? null : R.novaSerie(), turno: 0, sel: null, palpitando: false, descartadas: false, fala: fala('abertura'), msg: '', dica: '', evitar: [...ids], fim: null, secretos: [] };
    if (cfg.jogo === 'solo') { st.lados = [R.novoLado({ mesa, segredo: sortear([]), palpites })]; comecar(); }
    else if (cfg.jogo === 'paul') { escolherSegredo(0, (meu) => { const pS = sortear([meu]); st.lados = [R.novoLado({ mesa, segredo: pS, palpites }), R.novoLado({ mesa, segredo: meu, palpites })]; comecar(); }); }
    else { escolherSegredo(0, (s1) => passe(1, `${nomeJ(1)}, escolha sua carta secreta`, () => escolherSegredo(1, (s2) => { st.lados = [R.novoLado({ mesa, segredo: s2, palpites }), R.novoLado({ mesa, segredo: s1, palpites })]; passe(0, `vez de ${nomeJ(0)}`, comecar); }))); }
  }
  function comecar() { st.turno = 0; sfx('tap'); jogo(); }
  /** Tela privada pra quem escolhe a própria carta secreta (a outra pessoa não olha). */
  function escolherSegredo(quem, depois) {
    root.replaceChildren(h('h2', { class: 'jg-h hand' }, cfg.jogo === 'dupla' ? `${nomeJ(quem)}: escolha sua carta secreta` : 'escolha a sua carta secreta'), h('p', { class: 'jg-p' }, cfg.jogo === 'dupla' ? 'só você olha a tela agora. toque na carta que o outro vai tentar descobrir.' : 'o Paul vai tentar descobrir qual é a sua carta.'),
      grade(st.mesa.cartas.map((c) => c.id), { aoToque: (id) => { const c = st.mesa.cartas.find((x) => x.id === id); sheet(`é esta, ${BY_ID[id].curto}?`, (close) => h('div', { class: 'sheet-body cm-zoom' }, h('img', { src: mini(c.foto), alt: '' }), h('button', { class: 'btn primary', type: 'button', onclick: () => { close(); depois(id); } }, 'esta é a minha carta secreta'))); } }));
  }
  function passe(quem, titulo, depois) {
    root.replaceChildren(h('div', { class: 'cm-passe', role: 'dialog', 'aria-label': 'passe o aparelho' }, h('h2', { class: 'jg-h hand' }, fala('passe', { n: nomeJ(quem) })), h('p', { class: 'jg-p' }, titulo), h('button', { class: 'btn primary big', type: 'button', onclick: depois }, `sou ${nomeJ(quem)}`)));
  }

  /* ---------------- mesa ---------------- */
  const classeG = () => `cm-grade ${st.mesa.cartas.length <= 6 ? 'cm-g3' : 'cm-g4'}`;
  function grade(ids, { aoToque, fora = [], selecionada = null, manual = null } = {}) {
    return h('div', { class: ids.length <= 6 ? 'cm-grade cm-g3' : 'cm-grade cm-g4', role: 'group', 'aria-label': 'cartas' }, ...ids.map((id) => {
      const c = (st ? st.mesa : { cartas: [] }).cartas.find((x) => x.id === id) || { id, foto: BY_ID[id].fotos[0] }; const e = BY_ID[id]; const out = fora.includes(id);
      return h('div', { class: `cm-cell${out ? ' out' : ''}${selecionada === id ? ' sel' : ''}` },
        h('button', { type: 'button', class: 'cm-card', 'aria-pressed': String(selecionada === id), 'aria-label': `${e.curto}${out ? ', virada' : ''}`, onclick: () => aoToque(id) },
          h('img', { src: mini(c.foto), alt: '', loading: 'lazy', draggable: 'false', style: enquadreFoto(c.foto), onerror: (ev) => { ev.target.style.visibility = 'hidden'; } }), h('small', { class: nomeCls(e.curto) }, e.curto), out ? h('i', { class: 'cm-x', 'aria-hidden': 'true' }, '✕') : null),
        manual ? h('button', { type: 'button', class: 'jg-flip', 'aria-pressed': String(out), 'aria-label': out ? 'desvirar a carta' : 'virar a carta', onclick: () => manual(id) }, out ? '✅' : '✕') : null);
    }));
  }
  const ladoAtual = () => st.lados[cfg.jogo === 'solo' ? 0 : st.turno];
  const kids = () => cfg.modo === 'kids';

  function jogo() {
    const lado = ladoAtual(); const mesa = st.mesa; const cand = R.candidatosDo(mesa, lado); const ids = mesa.cartas.map((c) => c.id);
    const emPalpite = st.palpitando && !lado.terminou;
    const sug = R.sugestoes(mesa, lado, kids() ? 3 : 5, () => 0); const todas = R.disponiveis(mesa, lado); const semPergunta = !todas.length || (!R.informativas(mesa, lado).length && cand.length > 1);
    const podeMostrar = st.descartadas ? ids : ids.filter((id) => !lado.fora.includes(id) && !lado.erros.includes(id)); // "ver descartadas" mostra todas; senão só as vivas ficam em destaque
    const meu = cfg.jogo === 'solo' ? null : st.lados[cfg.jogo === 'dupla' ? 1 - st.turno : 1].segredo; // minha carta (o que o outro procura)
    const placar = st.serie ? h('div', { class: 'cm-placar', 'aria-label': 'placar' }, h('b', {}, `${nomeJ(0)} ${st.serie.vitorias[0]} × ${st.serie.vitorias[1]} ${nomeJ(1)}`), st.serie.empates ? h('small', {}, `${st.serie.empates} empate${st.serie.empates > 1 ? 's' : ''}`) : null, h('small', {}, 'melhor de 3')) : null;
    const quem = cfg.jogo === 'dupla' ? h('p', { class: 'cm-vez' }, `vez de ${nomeJ(st.turno)}`) : null;
    root.replaceChildren(...[
      placar, quem,
      h('div', { class: 'jg-bar' }, h('div', { class: 'jg-who' }, h('b', {}, 'perguntas'), h('span', {}, String(lado.perguntas.length))), h('div', { class: 'jg-who' }, h('b', {}, 'palpites'), h('span', { 'aria-label': `${lado.palpites} restantes` }, '♥'.repeat(lado.palpites) + '♡'.repeat(Math.max(0, st.palpites - lado.palpites)))), h('div', { class: 'jg-who' }, h('b', {}, 'cartas'), h('span', {}, String(cand.length)))),
      meu ? h('p', { class: 'cm-minha' }, h('img', { src: mini(st.mesa.cartas.find((c) => c.id === meu).foto), alt: '' }), h('span', {}, `sua carta secreta: ${BY_ID[meu].curto}`)) : null,
      paulFala(st.fala), st.dica ? h('p', { class: 'cm-dica', role: 'status' }, st.dica) : null,
      st.aguardaVirar != null && !emPalpite ? h('div', { class: 'cm-acoes' }, h('button', { class: 'btn primary big', type: 'button', onclick: () => { const i = st.aguardaVirar; st.aguardaVirar = null; sfx('tap'); fimDeAcao(i); } }, cfg.jogo === 'paul' ? 'pronto, já virei! ▶' : 'pronto, já virei! passar a vez ▶')) : null,
      st.aguardaVirar == null && !emPalpite && !lado.terminou ? perguntasUI(lado, sug, todas, semPergunta) : null,
      grade(ids, { fora: st.descartadas ? [] : [...lado.fora, ...lado.erros], selecionada: st.sel, aoToque: (id) => tocar(id), manual: !kids() && !cfg.auto && !lado.terminou && !emPalpite ? (id) => { st.lados[st.turno === undefined ? 0 : (cfg.jogo === 'solo' ? 0 : st.turno)] = R.virar(lado, id); sfx('tap'); jogo(); } : null }),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, st.msg),
      emPalpite ? h('div', { class: 'jg-pick', role: 'group', 'aria-label': 'confirmar palpite' }, st.sel ? h('b', {}, `é ${BY_ID[st.sel].curto}?`) : h('b', {}, 'toque na carta que você acha que é'), st.sel ? h('button', { class: 'btn small primary', type: 'button', onclick: () => palpitar(st.sel) }, 'sim, adivinhar!') : null, h('button', { class: 'btn small ghost', type: 'button', onclick: () => { st.palpitando = false; st.sel = null; jogo(); } }, 'voltar às perguntas')) : null,
      st.aguardaVirar == null && !emPalpite && !lado.terminou ? h('div', { class: 'cm-acoes' }, h('button', { class: 'btn primary big', type: 'button', onclick: () => { st.palpitando = true; st.sel = null; sfx('tap'); jogo(); } }, 'Adivinhar!'),
        h('button', { class: 'btn small ghost', type: 'button', 'aria-pressed': String(st.descartadas), onclick: () => { st.descartadas = !st.descartadas; jogo(); } }, st.descartadas ? 'esconder descartadas' : 'ver descartadas'),
        !kids() && !cfg.auto ? h('button', { class: 'btn small ghost', type: 'button', disabled: !lado.fora.length, onclick: () => { st.lados[cfg.jogo === 'solo' ? 0 : st.turno] = R.desfazerUltimaVirada(lado); jogo(); } }, 'desfazer última virada') : null) : null,
      h('div', { class: 'cm-acoes' }, h('button', { class: 'btn small ghost', type: 'button', onclick: async () => { if (await confirmSheet('recomeçar?', 'a rodada atual será perdida.', 'recomeçar')) iniciar(); } }, 'Recomeçar'), h('button', { class: 'btn small ghost', type: 'button', onclick: async () => { if (await confirmSheet('sair da partida?', 'a partida atual será perdida.', 'sair')) menu(); } }, 'Sair')),
      lado.perguntas.length ? h('div', { class: 'jg-hist2', 'aria-label': 'histórico' }, h('b', {}, 'perguntas feitas'), h('ol', { reversed: true }, ...lado.perguntas.slice().reverse().map((a) => h('li', {}, h('b', {}, a.sim ? 'SIM' : 'NÃO'), ` · ${textoDe(BY_Q[a.id], cfg.modo)} `, h('button', { class: 'cm-contesta', type: 'button', 'aria-label': `contestar a resposta de: ${textoDe(BY_Q[a.id], cfg.modo)}`, onclick: () => contestar(BY_Q[a.id], a, lado.segredo) }, '⚑ contestar'))))) : null,
    ].filter(Boolean));
  }
  /** Perguntas em cima, num carrossel: arrasta pro lado e aparecem umas 3 por vez (ícone grande + texto curto). */
  function perguntasUI(lado, sug, todas, semPergunta) {
    if (semPergunta) return h('p', { class: 'jg-msg' }, fala('semPergunta'));
    const feitas = (q) => lado.perguntas.some((x) => x.id === q.id); const ordem = [...sug, ...todas.filter((q) => !sug.includes(q))].filter((q) => !feitas(q));
    const card = (q) => h('button', { type: 'button', class: 'cm-qc', onclick: () => perguntar(q.id) }, h('span', {}, q.kids));
    return h('div', { class: 'cm-qbox', role: 'group', 'aria-label': 'perguntas' }, h('b', {}, `pergunte (arraste →)  ${ordem.length}`), h('div', { class: 'cm-carro' }, ...ordem.map(card)));
  }
  function tocar(id) { const c = st.mesa.cartas.find((x) => x.id === id); const lado = ladoAtual();
    if (st.palpitando && !lado.terminou) { st.sel = st.sel === id ? null : id; sfx('tap'); jogo(); return; } zoom(c); }

  /* ---------------- perguntar / palpitar ---------------- */
  function perguntar(qid) {
    const i = cfg.jogo === 'solo' ? 0 : st.turno; const lado = st.lados[i]; const q = BY_Q[qid];
    const r = R.perguntar(st.mesa, lado, qid, { automatico: kids() || cfg.auto }); st.lados[i] = r.lado; const left = R.candidatosDo(st.mesa, r.lado).length;
    st.msg = `${r.sim ? 'SIM' : 'NÃO'}. ${q.porque}${kids() || cfg.auto ? (r.tirou.length ? ` saíram ${r.tirou.length} carta${r.tirou.length === 1 ? '' : 's'}.` : '') : ' toque no ✕ das cartas que não combinam e depois em "pronto".'}`;
    st.fala = (kids() || cfg.auto) && left === 1 ? fala('uma') : (kids() || cfg.auto) && left <= 3 ? fala('poucas', { k: left }) : fala(r.sim ? 'sim' : 'nao'); st.dica = ''; sfx(r.sim ? 'place' : 'tap');
    if (!kids() && !cfg.auto && cfg.jogo !== 'solo') { st.aguardaVirar = i; return jogo(); } // manual: primeiro vira as cartas, depois toca em "pronto" pra passar a vez
    fimDeAcao(i);
  }
  function palpitar(id) {
    const i = cfg.jogo === 'solo' ? 0 : st.turno; const lado = st.lados[i]; const r = R.palpitar(lado, id); st.lados[i] = r.lado; st.sel = null; st.palpitando = false;
    if (r.acertou) { st.fala = fala('acerto', { n: BY_ID[id].curto }); st.msg = ''; sfx('win'); }
    else if (r.lado.terminou) { st.fala = kids() ? fala('revela', { n: BY_ID[lado.segredo].curto }) : fala('errou', { n: BY_ID[id].curto }); st.msg = ''; sfx('lose'); }
    else { const d = kids() ? R.dicaPara(st.mesa, lado, id) : null; st.fala = r.lado.palpites === 1 ? fala('ultima') : fala('errou', { n: BY_ID[id].curto }); st.dica = d ? `${fala('dica')} ${textoDe(BY_Q[d.id], 'kids')} → ${d.sim ? 'SIM' : 'NÃO'}` : ''; st.msg = `não era ${BY_ID[id].curto}. ele(a) sai do jogo.`; sfx('bad'); }
    fimDeAcao(i, true);
  }
  /** Depois de uma ação: decide de quem é a próxima vez (Paul joga sozinho; dupla pede pra passar o aparelho) ou fecha a rodada. */
  function fimDeAcao(i, foiPalpite = false) {
    const lados = st.lados; const todosTerminaram = lados.every((l) => l.terminou);
    if (todosTerminaram) { return later(fecharRodada, 900); }
    if (cfg.jogo === 'solo') return jogo();
    const outro = 1 - i;
    if (cfg.jogo === 'paul') { jogo(); return later(() => vezDoPaul(), 1100); }
    // dupla: se o outro ainda joga, passa o aparelho (se eu terminei e ele não, ele segue sozinho)
    if (!lados[outro].terminou) { st.turno = outro; return later(() => passe(outro, `vez de ${nomeJ(outro)}`, () => { st.msg = ''; st.dica = ''; st.fala = ''; jogo(); }), 700); }
    jogo();
  }
  function vezDoPaul() {
    const lado = st.lados[1]; if (lado.terminou) { if (!st.lados[0].terminou) { jogo(); } return; }
    const pal = R.paulPalpita(st.mesa, lado) || (R.disponiveis(st.mesa, lado).length === 0 ? R.shuffle(R.candidatosDo(st.mesa, lado))[0] : null);
    if (pal) { const r = R.palpitar(lado, pal); st.lados[1] = r.lado; st.msg = r.acertou ? '' : `o Paul chutou ${BY_ID[pal].curto}.`; st.fala = r.acertou ? fala('paulAcertou', { n: BY_ID[pal].curto }) : fala('paulErrou', { n: BY_ID[lado.segredo].curto }); sfx(r.acertou ? 'lose' : 'win'); }
    else { const qid = R.paulEscolhe(st.mesa, lado, cfg.nivel); const r = R.perguntar(st.mesa, lado, qid, { automatico: true }); st.lados[1] = r.lado; st.msg = `Paul perguntou: ${textoDe(BY_Q[qid], cfg.modo)} → ${r.sim ? 'SIM' : 'NÃO'}`; st.fala = fala('paulPergunta', { q: textoDe(BY_Q[qid], cfg.modo) }); sfx('tap'); }
    if (st.lados.every((l) => l.terminou)) { jogo(); return later(fecharRodada, 1100); }
    jogo();
    if (st.lados[0].terminou) later(vezDoPaul, 1300); // o jogador acabou: o Paul termina a dedução dele
  }

  /* ---------------- fim da rodada / série ---------------- */
  function fecharRodada() {
    const lados = st.lados; const solo = cfg.jogo === 'solo'; let res = null; let serie = st.serie;
    if (!solo) { res = R.resultadoRodada(lados[0], lados[1]); serie = R.fecharRodada(st.serie, res); st.serie = serie; }
    sfx(solo ? (lados[0].acertou ? 'win' : 'lose') : res.vencedor === 0 ? 'win' : res.vencedor === 1 ? 'lose' : 'tie');
    if (solo ? lados[0].acertou : cfg.jogo === 'paul' && res.vencedor === 0) ganhou('cara'); // acertou / ganhou a rodada do Paul: 3 ★
    const secreto = (l) => st.mesa.cartas.find((c) => c.id === l.segredo);
    const bloco = (l, titulo) => { const c = secreto(l); const e = BY_ID[c.id]; const fatos = fatosDe(c.id);
      return h('div', { class: 'cm-ficha' }, h('small', {}, titulo), h('img', { src: grande(c.foto), alt: `foto de ${e.curto}`, onerror: (ev) => { ev.target.src = mini(c.foto); } }), h('b', {}, e.nome === 'Beaterista' ? 'Beaterista' : e.curto),
        fatos.length ? h('ul', {}, ...fatos.map((f) => h('li', {}, f))) : null, h('small', {}, `foto ${c.foto} · ${l.perguntas.length} pergunta${l.perguntas.length === 1 ? '' : 's'}${l.acertou ? ' · acertou' : ' · não acertou'}`)); };
    let titulo; let fala$ = '';
    if (solo) { titulo = lados[0].acertou ? 'acertou! 🤘' : 'não foi dessa vez'; fala$ = lados[0].acertou ? fala('acerto', { n: BY_ID[lados[0].segredo].curto }) : fala('revela', { n: BY_ID[lados[0].segredo].curto }); }
    else if (serie.fim) { titulo = serie.vencedor === 0 ? (cfg.jogo === 'dupla' ? `${nomeJ(0)} venceu o duelo!` : 'você venceu o duelo!') : (cfg.jogo === 'dupla' ? `${nomeJ(1)} venceu o duelo!` : 'o Paul venceu o duelo'); fala$ = cfg.jogo === 'paul' ? fala(serie.vencedor === 0 ? 'serieGanha' : 'seriePerde') : ''; }
    else { titulo = res.vencedor === null ? 'rodada empatada' : `${nomeJ(res.vencedor)} ${cfg.jogo === 'dupla' ? 'venceu' : res.vencedor === 0 ? 'venceu' : 'venceu'} a rodada`; fala$ = cfg.jogo === 'paul' ? fala(res.vencedor === 0 ? 'rodadaGanha' : res.vencedor === 1 ? 'rodadaPerde' : 'rodadaEmpate') : ''; }
    const fichas = solo ? [bloco(lados[0], 'o Paul tinha escolhido')] : cfg.jogo === 'paul' ? [bloco(lados[0], 'carta do Paul'), bloco(lados[1], 'sua carta')] : [bloco(lados[0], `carta de ${nomeJ(1)}`), bloco(lados[1], `carta de ${nomeJ(0)}`)];
    const proxima = !solo && !serie.fim;
    root.replaceChildren(...[
      h('h3', { class: 'hand' }, titulo), paulFala(fala$),
      !solo ? h('div', { class: 'cm-placar' }, h('b', {}, `${nomeJ(0)} ${serie.vitorias[0]} × ${serie.vitorias[1]} ${nomeJ(1)}`), res ? h('small', {}, `${res.motivo} (${res.perguntas[0]} × ${res.perguntas[1]} perguntas)`) : null, serie.empates ? h('small', {}, `${serie.empates} empate${serie.empates > 1 ? 's' : ''}`) : null) : null,
      h('div', { class: 'cm-fichas' }, ...fichas),
      h('div', { class: 'jg-actions row' }, h('button', { class: 'btn small ghost', type: 'button', onclick: contestarDaRodada }, '⚑ contestar uma resposta'), proxima ? h('button', { class: 'btn primary', type: 'button', onclick: proximaRodada }, 'próxima rodada') : h('button', { class: 'btn primary', type: 'button', onclick: () => { iniciar(); } }, solo ? 'jogar de novo' : 'novo duelo'), h('button', { class: 'btn ghost', type: 'button', onclick: menu }, 'voltar às opções')),
    ].filter(Boolean));
  }
  function proximaRodada() {
    const serie = st.serie; const mesa = R.novaMesa({ modo: cfg.modo, tamanho: tamanhoPadrao() }); const palpites = st.palpites; const ids = mesa.cartas.map((c) => c.id); const sortear = (excl) => R.shuffle(ids.filter((i) => !excl.includes(i)))[0];
    st = { ...st, mesa, serie, turno: 0, sel: null, palpitando: false, descartadas: false, fala: fala('novaRodada'), msg: '', dica: '' };
    if (cfg.jogo === 'paul') escolherSegredo(0, (meu) => { st.lados = [R.novoLado({ mesa, segredo: sortear([meu]), palpites }), R.novoLado({ mesa, segredo: meu, palpites })]; comecar(); });
    else escolherSegredo(0, (s1) => passe(1, `${nomeJ(1)}, escolha sua carta secreta`, () => escolherSegredo(1, (s2) => { st.lados = [R.novoLado({ mesa, segredo: s2, palpites }), R.novoLado({ mesa, segredo: s1, palpites })]; passe(0, `vez de ${nomeJ(0)}`, comecar); })));
  }

  if (salaAutoPara('cara-musical')) { cfg.jogo = 'online'; salaOnline(); } else menu(); // veio de "tenho um código de sala"
  return {
    inProgress: () => !!(st && st.lados && st.lados.some((l) => l.perguntas.length || l.erros.length) && !st.lados.every((l) => l.terminou)),
    restart: async () => { if (st && st.lados && st.lados.some((l) => l.perguntas.length) && !(await confirmSheet('começar de novo?', 'a partida atual será perdida.', 'recomeçar'))) return; menu(); },
    destroy() { gone = true; if (online) online.destroy(); for (const t of timers) clearTimeout(t); timers.clear(); },
  };
}
