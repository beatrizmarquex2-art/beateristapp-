// Detetive Note: a criança OUVE um ritmo de 1 compasso e MONTA ele com cartas (4 tempos). Abre direto no CAMINHO (mapa de 12 fases por modo, igual ao pauLta);
// cada fase tem 3 ritmos e a dificuldade sobe. Modos: figuras (primeiro), comida, parque, corpo e animal (cartas com desenhos).
import { h } from '../util.js';
import { getGame, setGame } from './base.js';
import { audio } from '../audio.js';
import { voz } from '../toca-som.js';
import { session } from '../session.js';
import * as N from '../notation.js';
import { layoutRhythm } from '../reading.js';
import { click } from '../audio.js';
import { mapSfx } from '../kids/mapa-sfx.js';
import { foodOf } from '../kids-logic.js';
import { svgEl } from '../kids/art.js';
import * as FB from '../feedback.js';
import { mountProgressionMap } from '../kids/mapa.js';
import { musicaPausa, musicaVolta } from './musica.js';
import { temaDoMundo } from './mundos-tema.js';
import { TEMAS, MODOS, ESTILOS, estiloDe, FASES, RODADAS, COM_CONTAGEM, ouvidasMax, bpmFase, baseDe, temFlam, cartas, sortear, conferir, acertou, estrelas } from './detetive-logic.js';

const EMOJI_MODO = { figuras: '🎼', comida: '🍞', parque: '🚲', corpo: '✋', animal: '🐶' };
/** Ícones do Detetive Note (desenhados pela Bea): um por palavra das cartas; sem ícone (ex.: pausa "shh") cai no emoji. */
const ICONES = ['shh', 'shh-som', 'pao', 'bolo', 'chocolate', 'cao', 'pato', 'borboleta', 'mao', 'braco', 'esqueleto', 'ceu', 'bola', 'bicicleta'];
const ICONE_MODO = { comida: 'pao', parque: 'bicicleta', corpo: 'mao', animal: 'cao' };
const ico = (id, fallback) => (ICONES.includes(id) ? h('img', { class: 'dn-ico', src: `assets/jogos/detetive/${id}.webp`, alt: '', draggable: 'false', decoding: 'async' }) : h('i', { 'aria-hidden': 'true' }, fallback));
const NOME = (m) => `mundo ${m.slice(1)}`;

// figuras SEM pauta: só as notas, hastes, barras e pausas (tira a linha, a clave e o travessão)
const semPauta = (L) => ({ ...L, ops: L.ops.filter((o) => !(o.t === 'line' && (o.y1 === o.y2 || (o.x1 === o.x2 && o.w === 2)))) });
const figura = (cell) => { const L = semPauta(layoutRhythm([baseDe(cell)], { width: 84, count: false, clef: false })); const hd = L.ops.find((o) => o.t === 'head');
  if (temFlam(cell) && hd) L.ops.push({ t: 'grace', x: hd.x - 11, y: hd.y, mx: hd.x, my: hd.y }); return svgEl(N.toSVG(L), 'dn-face-fig'); }; // flam = notinha de ornamento antes da nota
const face = (card, estilo) => (!TEMAS[estilo] ? figura(card.cell)
  : card.cell === '0010' ? h('span', { class: 'dn-face' }, ico('shh-som', '🤫'), h('small', {}, `shh-${foodOf(TEMAS[estilo]['1000']).syl.join('-')}`)) // pausa de colcheia + colcheia
  : h('span', { class: 'dn-face' }, ico(card.id, foodOf(card.id).emoji), h('small', {}, foodOf(card.id).syl.join('-'))));
/** Cada fase toca num som diferente (caixa, tambor, bumbo, chimbal) pra uma fase não se confundir com a outra. */
const SONS_FASE = ['caixa', 'tambor', 'bumbo', 'chimbal'];
const somDaFase = (n) => SONS_FASE[(n - 1) % SONS_FASE.length];
const soa = (cell, bpm, som) => { const c = audio(); const q = 60 / bpm; const t = c.currentTime + 0.03; [...baseDe(cell)].forEach((x, k) => { if (x === '1') { if (temFlam(cell)) voz(t + (k * q) / 4 - 0.05, 0.4, som); voz(t + (k * q) / 4, 0.85, som); } }); };
/** Toca o compasso (4 tempos) com o som da fase: conta 4 antes (a 120 BPM começa tocando direto, sem a contagem). */
function tocaCompasso(cells, bpm, som) {
  const c = audio(); const q = 60 / bpm; const conta = COM_CONTAGEM(bpm); const t0 = c.currentTime + (conta ? 0.25 + 4 * q : 0.15);
  if (conta) for (let i = 0; i < 4; i++) click(t0 - (4 - i) * q, i === 0 ? 2 : 1);
  cells.forEach((cell, b) => [...baseDe(cell)].forEach((x, k) => { if (x === '1') { if (temFlam(cell)) voz(t0 + b * q + (k * q) / 4 - 0.05, 0.4, som); voz(t0 + b * q + (k * q) / 4, 0.85, som); } }));
  return t0;
}

const MUNDOS_DET = {
  m1: { tema: 'espaco', nome: 'Espaço do Pulso', regioes: [['orbita', 'Órbita da Semínima', 'o pulso e as colcheias'], ['estacao', 'Estação das Pausas', 'pausa de semínima'], ['cinturao', 'Cinturão do Silêncio', 'pausa de colcheia'], ['lua', 'Lua dos Contrastes', 'tudo misturado'], ['nebulosa', 'Nebulosa Veloz', 'mais rápido'], ['planeta', 'Planeta Final', 'o último caso']] },
  m2: { tema: 'floresta', nome: 'Floresta das Semicolcheias', regioes: [['gramado', 'Gramado das Semis', '4 por tempo'], ['trilha', 'Trilha das Pausas', 'pausa no 1, 2, 3 ou 4'], ['bosque', 'Bosque Vazio', 'o silêncio escondido'], ['riacho', 'Riacho Veloz', 'mais rápido'], ['clareira', 'Clareira Escura', 'tudo misturado'], ['topo', 'Topo da Floresta', 'o último caso']] },
  m3: { tema: 'vulcao', nome: 'Vulcão das Pontuadas', regioes: [['cratera', 'Cratera do Ponto', 'colcheia pontuada'], ['forja', 'Forja do Flam', 'nota com flam'], ['lava', 'Rio de Lava', 'pontuadas rápidas'], ['gruta', 'Gruta do Ornamento', 'flam e pausas'], ['pico', 'Pico Ardente', 'bem rápido'], ['coracao', 'Coração do Vulcão', 'o último caso']] },
};

export function mount(host) {
  const saved = getGame('detetive'); let modo = MODOS.includes(saved.modo) ? saved.modo : 'm1'; let estiloEsc = ESTILOS.includes(saved.estilo) ? saved.estilo : 'figuras';
  const estilo = () => estiloDe(modo, estiloEsc); let rapido = false; let bpm = bpmFase(modo, 1, rapido); // sempre abre NORMAL (70 → 100 bpm); o ⚡ 100 bpm é um clique opcional e NÃO fica salvo // o andamento sobe a cada fase (ou 100 bpm direto no mundo 1, opção pra adultos)
  const root = h('div', { class: 'jg jg-detetive' }); host.replaceChildren(root);
  // S = tempos da tela (próxima rodada); Au = só o som (ouvir de novo não cancela nada da tela)
  const S = session(); const Au = session(); const sfx = mapSfx(); let off = null; let ultimo = null; // ultimo = o compasso anterior (o novo nunca repete)
  let fase = 1; let secreto = null; let slots = []; let rodada = 0; let primeira = 0; let errou = false; let gone = false; let jogando = false; let marcas = null; let ouvidas = 0;
  const estOf = (m, n) => ((getGame('detetive').est || {})[`${m}:${n}`] || 0);
  const guardaEst = (m, n, v) => { const g = getGame('detetive'); setGame('detetive', { ...g, est: { ...(g.est || {}), [`${m}:${n}`]: v } }); };
  const limpa = () => { if (off) { try { off(); } catch { /* ok */ } off = null; } S.reset(); Au.reset(); };

  /* ---------- mapa (abre aqui) ---------- */
  const mapa = () => {
    limpa(); jogando = false; musicaVolta(); // música só no mapa; nas fases precisa ouvir o ritmo
    const box = h('div', { class: 'tm-map' });
    const levels = Array.from({ length: FASES }, (_, i) => ({ id: `det:${modo}:${i + 1}`, index: i + 1, label: String(i + 1), tag: '', boss: i === FASES - 1 }));
    const have = levels.reduce((s, l) => s + estOf(modo, l.index), 0);
    const tabs = h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': 'Modo' }, ...MODOS.map((m) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(modo === m), class: modo === m ? 'on' : '', onclick: () => { modo = m; setGame('detetive', { ...getGame('detetive'), modo }); mapa(); } }, NOME(m))));
    root.replaceChildren(h('p', { class: 'tm-dica' }, `${MUNDOS_DET[modo].nome} · escute o ritmo e monte ele com as cartas, na ordem certa.`), box);
    off = mountProgressionMap(box, {
      gameId: `detetive-${modo}`, levels, profileId: 'detetive', unitName: 'Fase', tier: 0, stars: { have, max: FASES * 3 }, theme: temaDoMundo(MUNDOS_DET[modo].tema, MUNDOS_DET[modo].nome, MUNDOS_DET[modo].regioes),
      starsOf: (id) => estOf(modo, Number(id.split(':')[2])), unlockedOf: () => true, lockedMsg: '', onOpen: (lv) => comeca(lv.index),
    });
    const hd = box.querySelector('.mp-head'); const bar = h('div', { class: 'tm-bar' }, tabs); if (hd) hd.append(bar); else box.prepend(bar);
  };

  /* ---------- uma fase: 3 ritmos ---------- */
  const comeca = (n) => { limpa(); musicaPausa(); fase = n; bpm = bpmFase(modo, n, rapido); rodada = 0; primeira = 0; jogando = true; nova(); };
  /* marcador do tempo (só nos modos de desenho): as casas acendem uma de cada vez no tempo do ritmo e os números 1 2 3 4 acompanham (escolha da Bea) */
  const limparTempo = () => { const w = root.querySelector('.dn-wrap'); if (w) w.querySelectorAll('.agora,.conta').forEach((e) => e.classList.remove('agora', 'conta')); };
  const marca = (i, tipo) => {
    const w = root.querySelector('.dn-wrap'); if (!w) return; w.querySelectorAll('.dn-nums span').forEach((e, k) => { e.classList.toggle(tipo, k === i); if (k !== i) e.classList.remove('agora', 'conta'); });
    if (tipo === 'agora') w.querySelectorAll('.dn-slot').forEach((e, k) => e.classList.toggle('agora', k === i));
  };
  const anima = (t0, q, conta) => {
    if (!TEMAS[estilo()]) return; limparTempo(); const c = audio(); const espera = (t) => Math.max(0, (t - c.currentTime) * 1000);
    if (conta) for (let i = 0; i < 4; i++) Au.later(() => marca(i, 'conta'), espera(t0 - (4 - i) * q));
    for (let b = 0; b < 4; b++) Au.later(() => marca(b, 'agora'), espera(t0 + b * q));
    Au.later(limparTempo, espera(t0 + 4 * q + 0.1));
  };
  const restam = () => ouvidasMax(fase) - ouvidas;
  const ouvir = () => { if (restam() <= 0) return; ouvidas++; Au.reset(); limparTempo(); audio(); const q = 60 / bpm; const t0 = tocaCompasso(secreto, bpm, somDaFase(fase)); anima(t0, q, COM_CONTAGEM(bpm)); };
  const nova = () => { S.reset(); secreto = sortear(fase, Math.random, ultimo, modo); ultimo = secreto; slots = []; errou = false; marcas = null; ouvidas = 0; desenha(); Au.later(() => { ouvir(); desenha(); }, 400); };
  const topo = () => h('div', { class: 'tr-fasehead' }, h('button', { class: 'btn small ghost', type: 'button', onclick: mapa }, '‹ mapa'),
    h('span', { class: 'dn-dots', role: 'img', 'aria-label': `ritmo ${Math.min(rodada + 1, RODADAS)} de ${RODADAS}` }, ...Array.from({ length: RODADAS }, (_, i) => h('i', { class: i < rodada ? 'on' : i === rodada && jogando ? 'now' : '' }))));
  const desenha = () => {
    const cs = cartas(modo, fase, estilo()); const est = estilo(); const cheio = slots.length === 4;
    const casas = Array.from({ length: 4 }, (_, i) => { const c = slots[i] != null ? cs.find((x) => x.cell === slots[i]) : null; const m = marcas ? marcas[i] : null;
      return h('button', { type: 'button', class: `dn-slot${c ? ' cheia' : ''}${m === true ? ' ok' : m === false ? ' no' : ''}`, 'aria-label': c ? `tempo ${i + 1}: tirar` : `tempo ${i + 1} vazio`, onclick: () => { if (c) { slots = slots.slice(0, i); marcas = null; desenha(); } } },
        c ? face(c, est) : h('small', {}, String(i + 1))); });
    const baralho = cs.map((c) => h('button', { type: 'button', class: 'dn-card', disabled: cheio, 'aria-label': c.cell === '0000' ? 'pausa' : c.cell === '0010' ? 'pausa de colcheia e colcheia' : c.id ? foodOf(c.id).word : temFlam(c.cell) ? `${baseDe(c.cell)} com flam` : c.cell, onclick: () => { if (slots.length < 4) { soa(c.cell, bpm, somDaFase(fase)); slots = [...slots, c.cell]; marcas = null; desenha(); } } }, face(c, est)));
    const rest = restam(); const vezes = rest === Infinity ? '' : rest > 0 ? ` · ${rest} ${rest === 1 ? 'vez' : 'vezes'}` : ' · acabou, confie no ouvido!';
    root.replaceChildren(h('div', { class: 'dn-caderno' }, topo(),
      h('h2', { class: 'dn-caso' }, 'caso ', h('em', {}, String(fase).padStart(2, '0'))), h('p', { class: 'dn-sub' }, `${MUNDOS_DET[modo].nome} · fase ${fase} de ${FASES}`),
      modo === 'm1' ? h('div', { class: 'dn-estilos', role: 'radiogroup', 'aria-label': 'Cartas' }, ...ESTILOS.map((e) => h('button', { type: 'button', role: 'radio', 'aria-checked': String(est === e), class: est === e ? 'on' : '', onclick: () => { estiloEsc = e; setGame('detetive', { ...getGame('detetive'), estilo: e }); desenha(); } }, ico(ICONE_MODO[e], EMOJI_MODO[e]), h('span', {}, e)))) : null,
      modo === 'm1' ? h('button', { type: 'button', class: `dn-rapido${rapido ? ' on' : ''}`, 'aria-pressed': String(rapido), onclick: () => { rapido = !rapido; bpm = bpmFase(modo, fase, rapido); desenha(); } }, h('b', {}, '⚡ 100 bpm'), h('small', {}, rapido ? 'ligado: o mundo 1 já toca rápido' : 'pra adultos: já ouvir no andamento rápido')) : null,
      h('button', { class: 'dn-ouvir', type: 'button', disabled: rest <= 0, onclick: () => { ouvir(); desenha(); } }, h('span', { class: 'dn-vinil', 'aria-hidden': 'true' }), h('span', { class: 'dn-ouvir-t' }, 'ouvir a pista', h('small', {}, `${somDaFase(fase)} · ${bpm} bpm${vezes}`))),
      h('p', { class: 'jg-msg', 'aria-live': 'polite' }, errou ? 'quase! os vermelhos estão errados: ouça de novo e troque.' : 'monte na ordem que você ouviu:'),
      h('div', { class: `dn-wrap${!TEMAS[est] ? ' sem' : ''}` }, !TEMAS[est] ? null : h('div', { class: 'dn-nums', 'aria-hidden': 'true' }, ...[1, 2, 3, 4].map((n) => h('span', {}, String(n)))), h('div', { class: 'dn-slots' }, ...casas)),
      h('p', { class: 'dn-lab' }, 'suas pistas'),
      h('div', { class: 'dn-baralho', style: `--n:${cs.length > 4 ? 3 : cs.length}` }, ...baralho),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary dn-conferir', type: 'button', disabled: !cheio, onclick: confere }, 'conferir'), slots.length ? h('button', { class: 'btn ghost', type: 'button', onclick: () => { slots = []; marcas = null; desenha(); } }, 'limpar') : null)));
  };
  const confere = () => {
    if (acertou(slots, secreto)) {
      if (!errou) primeira++; marcas = secreto.map(() => true); desenha(); FB.win(root.querySelector('.dn-slots')); Au.reset();
      S.later(() => { rodada++; if (rodada >= RODADAS) fim(); else nova(); }, 1200);
    } else { errou = true; marcas = conferir(slots, secreto); desenha(); FB.lose(root.querySelector('.dn-slots')); }
  };
  const fim = () => {
    S.reset(); Au.reset(); jogando = false; const est = estrelas(primeira); const antes = estOf(modo, fase);
    if (est === 0) { // menos de 60% de ritmos de primeira: não conclui, tenta de novo
      root.replaceChildren(topo(), h('h2', { class: 'jg-h hand' }, 'quase lá!'), h('p', { class: 'jg-p' }, `${primeira} de ${RODADAS} ritmos de primeira. com 60% ou mais você ganha a primeira estrela.`),
        h('div', { class: 'jg-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => comeca(fase) }, 'tentar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: mapa }, 'ver o mapa'))); return;
    }
    sfx.play('win'); S.later(() => sfx.play('star'), 450); if (est === 3) S.later(() => sfx.play('medal'), 950); // som de fase concluída (mais festa com 3 estrelas)
    if (fase === FASES) import('../figurinhas/mundos-premio.js').then((X) => X.premiarMundo(`detetive:${modo}`)).catch(() => {}); // mundo concluído = pacote de bandas e artistas
    if (fase === FASES) setTimeout(() => import('../conquista.js').then((C) => C.festaCaminho({ jogo: 'Detetive Note', caminho: MUNDOS_DET[modo] ? MUNDOS_DET[modo].nome : 'todas as fases', chave: `detetive:${modo}`, pose: 'ouvindo' })).catch(() => {}), 700); // terminou o caminho: festa + postar
    if (est > antes) { guardaEst(modo, fase, est); import('../figurinhas/mesa.js').then((M) => M.vitoria('detetive', est - antes)).catch(() => {}); } // só ganha a diferença sobre o melhor da fase
    root.replaceChildren(topo(), h('h2', { class: 'jg-h hand' }, `fase ${fase} concluída!`), h('p', { class: 'dn-estrelas', 'aria-label': `${est} de 3 estrelas` }, '★'.repeat(est), '☆'.repeat(3 - est)),
      h('p', { class: 'jg-p' }, `${primeira} de ${RODADAS} ritmos de primeira.${est < 3 ? ' acertando todos de primeira, são 3 estrelas.' : ' perfeito!'}`),
      h('div', { class: 'jg-actions' }, fase < FASES ? h('button', { class: 'btn primary', type: 'button', onclick: () => comeca(fase + 1) }, 'próxima fase ▶') : null, h('button', { class: 'btn', type: 'button', onclick: () => comeca(fase) }, 'jogar de novo'), h('button', { class: 'btn ghost', type: 'button', onclick: mapa }, 'ver o mapa')));
  };
  window.__detetive = { get secreto() { return secreto; } }; // só pros testes automáticos
  mapa();
  return { inProgress: () => jogando, restart: () => { if (!gone) mapa(); }, destroy() { gone = true; limpa(); S.dispose(); Au.dispose(); sfx.dispose(); delete window.__detetive; } };
}
