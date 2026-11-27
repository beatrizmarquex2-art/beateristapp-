// Bateria de toque: kit na tela com vários dedos ao mesmo tempo (e teclado no computador).
// Modo gravar: conta 4, você toca N compassos com o clique e o app arredonda pra grade de semicolcheias
// (vira ritmo do Beat Lab ou partitura). É um rascunho do que você tocou, não transcrição perfeita.
import * as SEG from '../figurinhas/segredos-palco.js';
import { h, icon } from '../util.js';
import { iconePaul } from '../icone-paul.js';
import * as store from '../store.js';
import * as B from '../beats.js';
import * as N from '../notation.js';
import { clampBpm } from '../music.js';
import { audio, click, perfToCtx } from '../audio.js';
import { banner, toast, stars } from '../ui.js';
import { kitSom, warmKit, MODELOS_BATERIA, velAt, backing } from '../instruments.js';
import { arte, NOME_PECA } from '../kids/kit-modelos.js';
import { pago, GRATIS, pedir, faixaPlano, aoLiberar, cadeado } from '../tocar-plano.js';
import { tocarTabs } from './tocar-nav.js';
import { rolar } from './rolar-opcoes.js';
import { playDoc, stopAll } from './partitura.js';
import { quantize, countNotes } from '../touchkit.js';
import { svgEl } from '../kids/art.js';
import * as FB from '../feedback.js';
import { tipBox } from '../tipbox.js';
import { scheduler } from '../audio.js';
import { flash, pieceAt } from '../kids/kit-theme.js';
import { MARCAS } from '../marcas-links.js';
import { aulasPainel } from './toque-aulas.js';
import { SEM_AULA } from '../jogos/aulas-bateria.js';

/** O logo da Beaterista e a marca do instrumento ficam na "tela", fora da bateria (PNG sem fundo). */
const logoFora = (art, modelo) => {
  const svg = art.querySelector('svg') || art;
  // `marca` = chave em js/marcas-links.js: com endereço, o logo vira link (abre o site da marca em outra aba); sem endereço fica só desenhado. Só os logos de FORA da bateria viram link, pra um toque na bateria nunca abrir site sem querer.
  // (endereço do app, que começa com #/, abre na mesma aba; site de fora abre em outra)
  const img = (src, x, y, w, h, cls = '', marca = '') => { const NS = 'http://www.w3.org/2000/svg'; const url = marca ? MARCAS[marca] : ''; const im = document.createElementNS(NS, 'image'); for (const [k, v] of Object.entries({ href: src, x, y, width: w, height: h, class: `marca-img ${cls}`.trim(), 'pointer-events': url ? 'all' : 'none', preserveAspectRatio: 'xMidYMid meet' })) im.setAttribute(k, String(v));
    if (!url) { svg.append(im); return; } const a = document.createElementNS(NS, 'a'); a.setAttribute('href', url); if (!url.startsWith('#')) { a.setAttribute('target', '_blank'); a.setAttribute('rel', 'noopener noreferrer'); } a.setAttribute('aria-label', `abrir o site: ${marca}`); a.style.cursor = 'pointer'; a.append(im); svg.append(a); };
  img('assets/marcas/beaterista.png', 4, 2, 44, 44, '', 'beaterista');
  if (modelo === 'acustica') img('assets/marcas/nagano.png', 190, 0, 40, 40, 'claro', 'nagano');
  if (modelo === 'eletronica') img('assets/marcas/nagano.png', 378, 4, 34, 34, 'claro', 'nagano');
  // cajón: sem o logo branco da Spark na tela (pedido da Bea, 17/nov/2026); fica só o logo preto desenhado na frente do cajón (kit-modelos.js)
};
const KEY = 'setting-toque';
const conf0 = () => ({ bpm: 80, left: false, count: true, click: false, grid: true, modelo: 'acustica', ...(store.get(KEY) ? store.get(KEY).data : {}) });
// sem código só a bateria acústica (a escolha antiga guardada no aparelho não vale)
const conf = () => { const c = conf0(); return pago() || GRATIS.bateria.modelos.includes(c.modelo) ? c : { ...c, modelo: 'acustica' }; };
const setConf = (p) => store.upsert('setting', KEY, p);
// teclas do computador (no iPhone é só tocar na bateria): cada letra uma peça
const KEYS = { u: 'cr', i: 'rd', j: 'hh', h: 'ho', k: 'tt', o: 'mt', f: 'sn', l: 'ft', ' ': 'bd' };

export function mount(host) {
  let aulasCtl = null; let aulaTap = null; let rec = null; let take = null; let loop = null; let last = null; let metro = null; let tempoRun = null; let loopOn = true; let listening = false; const timers = [];
  const kit = h('div', { class: 'tk-kit tk-svgkit', role: 'group', 'aria-label': 'Bateria' });
  const panel = h('div');
  const status = h('p', { class: 'tr-status', 'aria-live': 'polite' });
  const nomeEl = h('div', { class: 'tk-nome', 'aria-live': 'off' }); // o nome da peça só aparece quando toca

  /** `dr` = onde o dedo caiu na peça (0 = no meio, 1 = na borda): no meio bate mais forte; na borda da caixa vira aro; no meio da condução, sino. */
  const hit = (id, perfMs, dr = 0.3, pt) => {
    const c = audio(); const v = velAt(dr); const som = kitSom(modeloAtual); if (som[id]) som[id](c.currentTime, v, dr); // o som primeiro: nada pode atrasar a batida
    try { if (navigator.vibrate) navigator.vibrate(5); } catch { /* sem vibração (iPhone) */ } // um tiquinho de vibração no Android: dá a sensação de bater
    SEG.bateria(modeloAtual, id); // segredos do Palco
    const el = kit.querySelector(`[data-p="${id}"]`); flash(el); if (pt) spark(pt.x, pt.y, el);
    nomeEl.textContent = (modeloAtual === 'cajon' && { bd: 'grave', sn: 'agudo' }[id]) || NOME_PECA[id] || (id === 'ho' ? 'chimbal aberto' : ''); nomeEl.style.background = (el && el.style.getPropertyValue('--c')) || '#b5162b'; nomeEl.classList.remove('on'); void nomeEl.offsetWidth; nomeEl.classList.add('on');
    if (rec) rec.hits.push({ t: perfToCtx(perfMs) - rec.t0, id, v, dr });
    if (aulaTap) { let tc = perfMs ? perfToCtx(perfMs) : c.currentTime; if (!(Math.abs(tc - c.currentTime) < 0.25)) tc = c.currentTime; aulaTap(id, tc); } // aula: guarda o toque do aluno
  };
  /** O Paul tocando na aula: acende a peça e mostra o nome dela (sem som: o som já foi agendado). */
  const luz = (id) => {
    const el = kit.querySelector(`[data-p="${id}"]`); flash(el); if (el) { el.classList.add('au-luz'); setTimeout(() => el.classList.remove('au-luz'), 190); }
    nomeEl.textContent = (modeloAtual === 'cajon' && { bd: 'grave', sn: 'agudo' }[id]) || NOME_PECA[id] || ''; nomeEl.style.background = (el && el.style.getPropertyValue('--c')) || '#b5162b'; nomeEl.classList.remove('on'); void nomeEl.offsetWidth; nomeEl.classList.add('on');
  };
  const abreAulas = () => {
    if (aulasCtl) return;
    if (SEM_AULA.includes(modeloAtual)) { toast('as aulas usam a bateria acústica ou a eletrônica'); setConf({ modelo: 'acustica' }).then(() => { drawKit(); abreAulas(); }); return; } // o cajón só tem agudo e grave
    cancel(); stopAll(); aulasCtl = aulasPainel({ modelo: () => modeloAtual, luz, aoBater: (fn) => { aulaTap = fn; }, ver: () => { try { kit.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch { /* sem rolagem */ } }, jogando: (v) => kit.classList.toggle('au-jogando', !!v) }, { voltar: fechaAulas }); kit.classList.add('aulas'); drawKit(); drawPanel(); };
  const fechaAulas = () => { if (!aulasCtl) return; aulasCtl.destroy(); aulasCtl = null; aulaTap = null; kit.classList.remove('aulas'); drawKit(); drawPanel(); };
  /** Onda que sai do ponto do toque, na cor da peça. */
  const spark = (x, y, el) => {
    const r = kit.getBoundingClientRect(); const d = h('i', { class: 'ti-rip' }); d.style.left = `${x - r.left}px`; d.style.top = `${y - r.top}px`; d.style.borderColor = (el && el.style.getPropertyValue('--c')) || '#b5162b'; kit.append(d);
    const a = d.animate([{ transform: 'scale(.6)', opacity: 0.8 }, { transform: 'scale(3.4)', opacity: 0 }], { duration: 440, easing: 'ease-out' }); a.onfinish = () => d.remove();
  };
  /** Distância do toque ao centro da peça (pelo desenho do "tampo": elipse da pele ou do prato). */
  const drOf = (g, e) => {
    const t = g.querySelector('[data-head]') || g.querySelector('ellipse[fill-opacity], circle[fill-opacity]'); if (!t) return 0.4;
    const r = t.getBoundingClientRect(); if (!r.width || !r.height) return 0.4;
    const q = Math.hypot((e.clientX - (r.left + r.width / 2)) / (r.width / 2), (e.clientY - (r.top + r.height / 2)) / (r.height / 2));
    return q > 1.15 ? 0.55 : Math.min(1, q); // fora do tampo (no casco ou no pé) vale como toque médio
  };
  // a bateria é o mesmo desenho do "explorar a bateria": cada dedo vale um toque, então dá pra tocar com vários ao mesmo tempo
  let modeloAtual = conf().modelo;
  const drawKit = () => {
    const c = conf(); modeloAtual = c.modelo; warmKit(c.modelo);
    kit.classList.toggle('left', !!c.left);
    const art = svgEl(arte(c.modelo), `tk-art modelo-${c.modelo}`);
    { const svg = art.querySelector('svg'); if (svg) { const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'kit-espelho'); while (svg.firstChild) g.append(svg.firstChild); svg.append(g); } } // a bateria vai num grupo só: a canhota espelha esse grupo e os logos de fora não viram
    logoFora(art, c.modelo);
    kit.dataset.kitTheme = 'colagem'; // um fundo só (a Bea não quer escolher tema na bateria de toque)
    art.addEventListener('pointerdown', (e) => { const g = pieceAt(art, e, 58); if (!g) return; e.preventDefault(); hit(g.dataset.p, e.timeStamp || performance.now(), drOf(g, e), { x: e.clientX, y: e.clientY }); });
    const modelos = h('div', { class: 'row kd-modes kd-modelos', role: 'radiogroup', 'aria-label': 'Modelo da bateria' }, h('small', {}, 'modelo'),
      ...MODELOS_BATERIA.map(([v, l]) => { const trav = !pago() && !GRATIS.bateria.modelos.includes(v); return h('button', { type: 'button', class: `kd-chip${c.modelo === v ? ' on' : ''}${trav ? ' travado' : ''}`, role: 'radio', 'aria-checked': String(c.modelo === v), onclick: () => { if (trav) { pedir(`a bateria ${l}`); return; } if (aulasCtl && SEM_AULA.includes(v)) { toast('o cajón não tem tom, surdo nem pratos: feche as aulas pra usar'); return; } setConf({ modelo: v }).then(() => { drawKit(); drawPanel(); }); } }, l, trav ? cadeado() : null); }));
    // mão: destro ou canhota (inverte o lado da bateria). Fica numa linha com nome, não mais em cima do desenho
    const maoRow = h('div', { class: 'row kd-modes kd-mao', role: 'radiogroup', 'aria-label': 'Mão' }, h('small', {}, 'mão'),
      ...[[false, 'destro'], [true, 'canhota']].map(([v, l]) => h('button', { type: 'button', role: 'radio', class: `kd-chip${!!c.left === v ? ' on' : ''}${v ? ' kd-canhota' : ''}`, 'aria-checked': String(!!c.left === v), 'aria-pressed': String(!!c.left === v), onclick: () => { if (!!c.left === v) return; setConf({ left: v }).then(() => { drawKit(); drawPanel(); }); } }, l)));
    const aulasBtn = h('button', { type: 'button', class: `kd-aulas kd-aulas-big${aulasCtl ? ' on' : ''}${!pago() ? ' travado' : ''}`, 'aria-pressed': String(!!aulasCtl), onclick: () => { if (!pago()) { pedir('as aulas da bateria'); return; } aulasCtl ? fechaAulas() : abreAulas(); } },
      h('span', { class: 'kab-ic', 'aria-hidden': 'true' }, '🎓'), h('span', { class: 'kab-t' }, h('b', {}, aulasCtl ? 'aulas abertas' : 'aulas da bateria'), h('small', {}, aulasCtl ? 'toque pra fechar' : 'o Paul toca, você repete · 16 ritmos')), !pago() ? cadeado() : h('span', { class: 'kab-go', 'aria-hidden': 'true' }, aulasCtl ? '✓' : '▶'));
    kit.replaceChildren(h('div', { class: 'tk-palco' }, art), nomeEl, rolar(modelos), rolar(maoRow), h('div', { class: 'kd-aulas-linha' }, aulasBtn));
  };
  const onKey = (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test(e.target.tagName)) return;
    const id = KEYS[e.key.toLowerCase()]; if (!id) return;
    e.preventDefault(); hit(id, e.timeStamp || performance.now(), 0.15);
  };
  document.addEventListener('keydown', onKey);

  const MAX = 30; // segundos de gravação, no máximo
  const stopMetro = () => { if (metro) { metro.forEach((o) => { try { o.stop(); } catch { /* já parou */ } }); metro = null; } };
  const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
  const prog = h('i', { class: 'tk-prog' }); const progBox = h('div', { class: 'tk-progress', 'aria-hidden': 'true' }, prog);
  const stopLoop = () => { if (loop) { loop.run.stop(); cancelAnimationFrame(loop.raf); loop = null; prog.style.width = '0'; } };
  const cancelRec = () => { if (rec) { clearTimeout(rec.timer); clearInterval(rec.tick); rec = null; } kit.classList.remove('rec'); };

  /** Gravar: conta 4 (se ligado) e grava até 30 s com o clique. Parou (ou deu 30 s)? Já toca em loop, sem esperar. */
  const record = () => {
    stopAll(); stopMetro(); stopTempo(); stopLoop(); cancelRec(); listening = false; timers.forEach(clearTimeout); timers.length = 0; take = null; last = null;
    const c = { ...conf(), click: false }; const ac = audio(); const q = 60 / c.bpm; const lead = c.count ? 4 * q : 0.2;
    const t0 = ac.currentTime + 0.3 + lead;
    metro = [];
    if (c.count) for (let i = 0; i < 4; i++) metro.push(click(t0 - (4 - i) * q, i === 0 ? 2 : 1));
    if (c.click) for (let b = 0; b * q < MAX + q; b++) metro.push(click(t0 + b * q, b % 4 === 0 ? 2 : 1, 0.5));
    rec = { t0, hits: [] };
    kit.clock = () => perfToCtx(performance.now()) - t0; // segundos desde o 1º tempo (para quem testa tocando por script)
    status.className = 'tr-status tk-count';
    if (c.count) for (let i = 0; i < 4; i++) timers.push(setTimeout(() => { status.textContent = String(i + 1); }, (t0 - (4 - i) * q - ac.currentTime) * 1000));
    status.textContent = c.count ? '…' : `● gravando 0:00 / ${fmt(MAX)}`;
    prog.style.width = '0';
    rec.tick = setInterval(() => { let el = perfToCtx(performance.now()) - t0; if (el < 0) { if (c.count) return; el = 0; } status.className = 'tr-status'; status.textContent = `● gravando ${fmt(el)} / ${fmt(MAX)}`; prog.style.width = `${Math.min(100, (el / MAX) * 100)}%`; }, 120);
    rec.timer = setTimeout(finishRec, (t0 - ac.currentTime + MAX) * 1000);
    kit.classList.add('rec'); drawPanel();
  };
  /** Parou a gravação (botão ou 30 s): ajusta ao compasso (se ligado) e começa o loop na hora. */
  function finishRec() {
    const r = rec; if (!r) return;
    clearTimeout(r.timer); clearInterval(r.tick); rec = null; stopMetro(); kit.classList.remove('rec'); timers.forEach(clearTimeout); timers.length = 0; prog.style.width = '0';
    const c = conf(); const q = 60 / c.bpm; const bar4 = 4 * q; const el = Math.min(MAX, perfToCtx(performance.now()) - r.t0);
    const hits = r.hits.filter((x) => x.t > -0.08 && x.t <= MAX).map((x) => ({ ...x, t: Math.max(0, x.t) }));
    status.className = 'tr-status';
    if (!hits.length || el <= 0.2) { status.textContent = el <= 0.2 ? 'gravação cancelada.' : 'não peguei nenhum toque. tenta de novo!'; drawPanel(); return; }
    let len; let bars = 0;
    if (c.grid) { const maxBars = Math.max(1, Math.floor(MAX / bar4)); bars = Math.min(maxBars, Math.max(1, Math.ceil((el - 0.05) / bar4))); len = bars * bar4; } else len = Math.max(0.5, el);
    const kept = hits.filter((x) => x.t < len);
    take = c.grid && [1, 2, 4].includes(bars) ? { ...quantize(kept, { bpm: c.bpm, bars }), bpm: c.bpm, raw: kept.length } : null; // partitura só quando cabe em 1, 2 ou 4 compassos
    last = { len, hits: kept };
    FB.win(kit, { paul: false });
    startLoop();
  }
  /** Toca o que você gravou em loop (as peças acendem junto). */
  const startLoop = () => {
    if (!last) return; stopLoop(); stopAll(); stopTempo(); listening = false;
    const c = { ...conf(), click: false }; const ac = audio(); const q = 60 / c.bpm; const { len, hits } = last;
    const evs = hits.map((x) => ({ t: x.t, id: x.id, v: x.v, dr: x.dr }));
    if (c.click) for (let b = 0; b * q < len - 0.01; b++) evs.push({ t: b * q, click: b % 4 === 0 ? 2 : 1 });
    evs.sort((x, y) => x.t - y.t); const n = evs.length; const start = ac.currentTime + 0.12;
    const run = scheduler((i) => { const e = evs[i % n]; return { at: Math.floor(i / n) * len + e.t, play: (t) => { if (e.click) click(t, e.click, 0.5); else if (kitSom(modeloAtual)[e.id]) kitSom(modeloAtual)[e.id](t, e.v ?? 1, e.dr ?? 0.3); }, ui: e.id ? () => flash(kit.querySelector(`[data-p="${e.id}"]`)) : undefined }; });
    loop = { run, len, raf: 0 };
    const frame = () => { if (!loop) return; prog.style.width = `${((((ac.currentTime - start) % len) + len) % len / len) * 100}%`; loop.raf = requestAnimationFrame(frame); }; frame();
    status.className = 'tr-status'; status.textContent = `em loop · ${fmt(len)} · ${hits.length} toques`;
    drawPanel();
  };
  const cancel = () => { cancelRec(); stopMetro(); stopTempo(); stopLoop(); timers.forEach(clearTimeout); timers.length = 0; status.className = 'tr-status'; };
  /** "Ouvir o tempo": o clique do andamento escolhido em loop (1 mais forte), pra sentir antes de gravar. */
  const stopTempo = () => { if (tempoRun) { tempoRun.stop(); tempoRun = null; } };
  const toggleTempo = () => {
    if (tempoRun) { stopTempo(); drawPanel(); return; }
    if (rec) return; stopAll(); stopLoop(); audio(); const bpm = conf().bpm;
    tempoRun = scheduler((i) => ({ at: (i * 60) / bpm, play: (t) => click(t, i % 4 === 0 ? 2 : 1, 0.7) }));
    drawPanel();
  };

  const drawPanel = () => {
    if (aulasCtl) { panel.replaceChildren(aulasCtl.el); return; } // aulas abertas: o painel é o delas
    const c = conf();
    const setBpm = (v) => setConf({ bpm: clampBpm(v) }).then(drawPanel);
    const doc = take && { title: 'Toquei na bateria de toque', bpm: take.bpm, bars: take.bars };
    const chip = (key, label) => h('button', { type: 'button', class: `lib-tab${c[key] ? ' on' : ''}`, 'aria-pressed': String(!!c[key]), onclick: () => setConf({ [key]: !c[key] }).then(drawPanel) }, label);
    const mainBtns = rec ? [h('button', { class: 'btn primary tk-big', type: 'button', onclick: finishRec }, icon('stop', 16), ' parar'), h('button', { class: 'btn', type: 'button', onclick: () => { cancel(); status.textContent = 'gravação cancelada.'; drawPanel(); } }, 'cancelar')]
      : loop ? [h('button', { class: 'btn primary tk-big', type: 'button', onclick: () => { stopLoop(); status.textContent = 'parado.'; drawPanel(); } }, icon('stop', 16), ' parar'), h('button', { class: 'btn tk-big', type: 'button', onclick: record }, '↺ recomeçar')]
      : last ? [h('button', { class: 'btn primary tk-big', type: 'button', onclick: startLoop }, icon('play', 16), ' tocar em loop'), h('button', { class: 'btn tk-big', type: 'button', onclick: record }, '↺ recomeçar')]
      : [h('button', { class: 'btn primary tk-big tk-rec', type: 'button', onclick: () => { if (!pago()) { pedir('gravar'); return; } record(); } }, h('i', { class: 'tk-dot' }), ` gravar (até ${MAX} s)`, pago() ? null : cadeado())];
    panel.replaceChildren(...[
      h('section', { class: 'card pad tk-panel bmr' },
        h('div', { class: 'row tk-line tk-ctrls' }, ...mainBtns),
        rec || loop ? progBox : null,
        h('div', { class: 'bl-tempo' },
          h('button', { class: 'bl-step', type: 'button', 'aria-label': 'menos 5 BPM', onclick: () => setBpm(c.bpm - 5) }, '−'), h('output', { class: 'bl-bpm' }, String(c.bpm)),
          h('button', { class: 'bl-step', type: 'button', 'aria-label': 'mais 5 BPM', onclick: () => setBpm(c.bpm + 5) }, '+'),
          h('span', { class: 'tp-lab' }, 'BPM')),
        h('div', { class: 'chips lib-tabs tk-opts', role: 'group', 'aria-label': 'Opções da gravação' }, chip('count', h('span', { class: 'ic-lbl' }, iconePaul('contagem-quatro-tempos', 22), 'contagem ao gravar')), chip('grid', 'ao compasso')),
        ),
      status,
      take ? h('section', { class: 'card pad tk-take' },
        h('p', { class: 'muted' }, `${countNotes(take.bars)} notas em ${take.bars.length === 1 ? '1 compasso' : `${take.bars.length} compassos`} · ${take.bpm} BPM`),
        ...take.bars.map((b) => { const f = h('figure', { class: 'cb-bar' }); f.innerHTML = N.toSVG(N.layout(b, { width: 340, full: true })); return f; }),
        h('div', { class: 'row tk-actions' },
          h('button', { class: `btn${listening ? ' primary' : ''}`, type: 'button', onclick: () => { if (listening) { stopAll(); listening = false; drawPanel(); return; } stopLoop(); listening = true; playDoc(doc, { loop: loopOn, withClick: true, onEnd: () => { listening = false; drawPanel(); } }); drawPanel(); } }, icon(listening ? 'stop' : 'play', 14), listening ? ' parar' : ' ouvir na partitura'),
          h('button', { class: 'btn small', type: 'button', 'aria-pressed': String(loopOn), onclick: () => { loopOn = !loopOn; drawPanel(); } }, h('span', { class: 'ic-lbl' }, iconePaul('loop-reproducao', 20), loopOn ? 'em loop ✓' : 'em loop')),
          take.bars.length === 1 && !document.documentElement.classList.contains('aluno-on') ? h('button', { class: 'btn', type: 'button', onclick: async (e) => { // o Beat Lab só existe no app da Bea
            const btn = e.currentTarget; const b = take.bars[0]; const beat = { id: 'novo', name: 'Toquei na bateria', style: 'Meus', bpm: take.bpm, steps: 16, kind: 'groove', rows: b.rows, mine: true };
            const r = await store.upsert('beat', null, { beat }); await store.upsert('beat', r.id, { beat: { ...beat, id: r.id, recId: r.id } });
            stars(btn); toast('salvo em Meus ritmos ✓', { action: 'abrir', onAction: () => { location.hash = '#/beatlab/meus'; } });
          } }, 'salvar em meus ritmos') : null,
          document.documentElement.classList.contains('aluno-on') ? null : h('button', { class: 'btn primary', type: 'button', onclick: async () => { stopAll(); const r = await store.upsert('partitura', null, { ...doc, created: Date.now() }); location.hash = `#/partitura/${r.id}`; } }, 'abrir na partitura'))) : null,
    ].filter(Boolean));
  };

  const raiz = host.appendChild(h('div', { class: 'bmr tocar-raiz', 'data-skin': (() => { try { return localStorage.getItem('beaterista-palco-skin') || 'c'; } catch { return 'c'; } })() })); raiz.append(banner('Bateria de Toque', 'acústica, eletrônica e cajón'), tocarTabs('toque'), ...(faixaPlano(GRATIS.bateria.texto) ? [faixaPlano(GRATIS.bateria.texto)] : []), kit, panel,
    h('p', { class: 'pad-x lib-note' }, 'dá pra tocar com vários dedos ao mesmo tempo. “gravar” conta 4 e grava até 30 segundos; ao parar, o que você tocou fica em loop (parar / recomeçar). no computador: U prato, I condução, J chimbal, H aberto, K tom 1, O tom 2, F caixa, L surdo, espaço bumbo. no iPhone o som pode atrasar um pouquinho: é do aparelho. o loop toca do jeitinho que você tocou; a partitura (quando cabe em 1, 2 ou 4 compassos) arredonda pra semicolcheia mais perto: confere antes de usar em aula.'));
  drawKit(); drawPanel(); tipBox(host, 'toque');
  const solta = aoLiberar(() => { drawKit(); drawPanel(); document.querySelectorAll('.tp-faixa').forEach((x) => x.remove()); });
  return () => { solta(); if (aulasCtl) { aulasCtl.destroy(); aulasCtl = null; aulaTap = null; } cancel(); stopAll(); stopTempo(); document.removeEventListener('keydown', onKey); backing.leave(); };
}
