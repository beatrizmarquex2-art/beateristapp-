// STOP musical "ao mesmo tempo" em 2 a 4 celulares: tela. Regras do estado em stop-sim-logic.js; pontuação em stop-logic.js.
// Os dois ficam prontos, a contagem 3-2-1 roda nos dois, cada um preenche no próprio aparelho e quem bate STOP primeiro para o outro também.
// Texto digitado só entra na tela como texto (textContent / value), nunca como HTML. Respostas e tempo ficam também no localStorage (por sala e rodada) pra poder voltar.
import { h } from '../util.js';
import { placar, poseDisponivel } from './placar.js';
import { sheet } from '../ui.js';
import * as S from './stop-logic.js';
import * as Q from './stop-sim-logic.js';
import * as FX from './stop-sfx.js';
import { ganhou } from './estrelas-jogo.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
const STATUS = { valida: ['válida', '✔'], invalida: ['inválida', '✖'], pendente: ['aguardando revisão', '?'] };
const ler = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const guardar = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify({ ...v, at: Date.now() })); } catch { /* sem armazenamento */ } };
function podarAntigos() { // guarda de rodadas velhas (mais de 1 dia) de outras salas
  try { for (const k of Object.keys(localStorage)) if (k.startsWith('stop-sim-')) { const v = ler(k); if (!v || Date.now() - (v.at || 0) > 864e5) localStorage.removeItem(k); } } catch { /* ok */ }
}
export const garantirCss = () => { try { if (!document.getElementById('stop-sim-css')) document.head.append(h('link', { id: 'stop-sim-css', rel: 'stylesheet', href: new URL('../../css/stop-simultaneo.css', import.meta.url).href })); } catch { /* ok */ } };

/** Caixa 'pausado' (a mesma pro STOP de um aparelho só e pro ao mesmo tempo). */
export const caixaPausa = (onResume, nota = 'o relógio parou. as respostas ficam escondidas até continuar.') => h('div', { class: 'ss-pausa', role: 'status' }, h('b', { class: 'hand' }, 'pausado'), h('small', { class: 'muted' }, nota), h('button', { class: 'btn primary', type: 'button', onclick: onResume }, 'continuar'));

/**
 * root = onde desenhar; conn = conexão da sala (online.js); estado = estado da sala; badge = linkBadge(); sair() = volta às opções (quem chama fecha a conexão).
 * Devolve { pause, resume, inProgress, destroy }.
 */
export function montarSimultaneo({ root, conn, estado, badge, sair }) {
  garantirCss(); podarAntigos();
  const me = conn.me; const N = Q.jogadoresDe(estado); const todos = Array.from({ length: N }, (_, i) => i); const outros = todos.filter((i) => i !== me); const outro = outros[0]; let latest = estado; let gone = false; let ph = 'sala'; let round = estado.round;
  const timers = new Set(); let clk = 0; let deadline = 0; let paused = false; let remain = 0; let locked = false; let tickFn = null; let lastSec = -1;
  let inputs = []; let answers = []; let live = null; let esperaDesde = 0; let semOutro = false; let somRodada = 0; let meuPronto = false; let saveT = 0;
  const key = () => Q.chaveLocal(conn.code, round);
  const motion = () => !FX.reducedMotion();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); if (!gone) fn(); }, ms); timers.add(id); return id; };
  const stopClock = () => { clearInterval(clk); clk = 0; };
  const sr = (t) => { if (live) live.textContent = t; };
  const quem = (i) => (conn.nomeDe ? conn.nomeDe(i) : (i === me ? 'você' : 'o outro'));
  const avisoEl = conn.avisoSaida ? conn.avisoSaida() : null; // aviso de saída de jogador (sinal de vida + votação), igual pra todos; só liga o sinal de vida quando o jogo pede
  const av = () => (avisoEl ? [avisoEl] : []);
  const rot = (i) => `${quem(i)}${Q.foraDe(latest).includes(i) ? ' (saiu)' : ''}`;
  
  const vitoriasTxt = (e) => `vitórias: ${[me, ...outros].map((i) => `${rot(i)} ${e.wins[i]}`).join(' · ')}${e.empates ? ` · empates ${e.empates}` : ''}`;
  conn.on.state = (novo) => { if (Q.estadoValido(novo)) { latest = novo; aoMudar(); aplicaSaida(); } };
  conn.on.saiu = () => aplicaSaida();
  conn.on.link = (ok) => badge.set(ok);

  /** Grava só o que é meu. Se o outro gravou na frente a versão não bate: espera o estado dele chegar e tenta de novo (fn roda sobre o estado novo). Sem rede, continua tentando. */
  async function gravar(fn, { vezes = 200 } = {}) {
    const r0 = latest.round;
    for (let i = 0; i < vezes && !gone; i++) {
      if (latest.round !== r0) return false;
      const base = clone(latest); if (fn(base) === false) return false;
      if (await conn.push(base)) { latest = base; return true; }
      await sleep(i < 3 ? 450 : 1500);
    }
    return false;
  }
  /** a maioria decidiu continuar sem alguém: só um celular (o menor lugar que ficou) escreve `fora` no estado; os outros recebem */
  function aplicaSaida() {
    if (gone || !conn.saiu) return; const novos = conn.saiu().filter((s) => s < N && !Q.foraDe(latest).includes(s));
    if (novos.length && conn.souSindico()) gravar((s) => Q.tirar(s, novos)).then(() => aoMudar());
  }
  function renderFora() { // eu fui tirado da partida: guardo o que ganhei e posso sair
    ph = 'fora'; stopClock(); timers.forEach(clearTimeout); timers.clear();
    root.replaceChildren(...[badge.el, ...av(), h('div', { class: 'jg-cover2', role: 'status' }, h('p', { class: 'hand' }, 'a partida seguiu sem você'), h('p', { class: 'muted' }, 'você ficou um tempo sem responder e os outros decidiram continuar. as ★ que você já ganhou ficam com você 🌟')), h('div', { class: 'jg-actions' }, h('button', { class: 'btn', type: 'button', onclick: sairDaSala }, 'sair da sala'))]);
  }
  function aoMudar() {
    if (gone) return;
    if (Q.foraDe(latest).includes(me)) { if (ph !== 'fora') renderFora(); return; }
    if (latest.round !== round) return novaRodada();
    if (ph === 'sala' && Q.todosProntos(latest) && !latest.res[me]) return contagem();
    if (ph === 'sala') return renderSala();
    if (ph === 'jogando') { if (!locked && Q.stopDoOutro(latest, me)) return pararForcado(); return avisoOutro(); }
    if (ph === 'resultado') return renderResultado();
  }
  function novaRodada() {
    guardar(Q.chaveLocal(conn.code, round), null); round = latest.round; semOutro = false; meuPronto = false; locked = false; paused = false; stopClock(); timers.forEach(clearTimeout); timers.clear();
    root.classList.remove('ss-pausado'); ph = 'sala'; aoMudar();
  }

  /* ================= sala: "estou pronto" ================= */
  function renderSala() {
    const e = latest; const jaPronto = e.ready[me] || meuPronto; const v = e.wins.reduce((t, x) => t + x, 0) + (e.empates || 0) > 0;
    root.replaceChildren(...[badge.el, ...av(),
      h('section', { class: 'card pad ss-cab' }, h('b', {}, 'ao mesmo tempo'), h('small', { class: 'muted' }, `${e.cats.length} categorias · ${clock(e.seconds)} · a letra aparece na contagem`),
        v ? h('small', { class: 'ss-wins', role: 'status' }, vitoriasTxt(e)) : null,
        h('ul', { class: 'ss-cats' }, ...e.cats.map((c) => h('li', {}, S.CAT[c].label)))),
      h('div', { class: `ss-pl n${N}` }, ...[me, ...outros].map((i) => h('div', { class: `ss-j${i === me ? ' eu' : ''}` }, h('small', {}, quem(i)), h('b', { class: e.ready[i] || (i === me && meuPronto) ? '' : 'muted' }, e.ready[i] || (i === me && meuPronto) ? 'pronto ✓' : 'esperando…')))),
      jaPronto ? h('p', { class: 'jg-p', role: 'status' }, (N > 2 ? 'você está pronto. esperando os outros celulares…' : 'você está pronto. esperando o outro celular…')) : h('button', { class: 'btn primary jo-go', type: 'button', onclick: pronto }, 'estou pronto'),
      h('p', { class: 'muted ss-nota' }, (N > 2 ? 'quando todos estiverem prontos, começa a contagem. quem apertar STOP primeiro para todo mundo.' : 'quando os dois estiverem prontos, começa a contagem. quem apertar STOP primeiro para o outro também.')),
      h('div', { class: 'jg-actions' }, h('button', { class: 'btn small ghost', type: 'button', onclick: sairDaSala }, 'sair da sala'))].filter(Boolean));
  }
  function pronto() { FX.play('tap'); meuPronto = true; renderSala(); gravar((s) => Q.pronto(s, me)).then(aoMudar); }
  function sairDaSala() { guardar(key(), null); sair(); }

  /* ================= contagem 3-2-1 (nos dois celulares) ================= */
  function contagem() {
    ph = 'contagem'; FX.stopMusic(); const L = latest.letter;
    const num = h('div', { class: 'st-count', role: 'status', 'aria-live': 'assertive' }, '3');
    root.replaceChildren(...[badge.el, ...av(), h('div', { class: 'st-drawbox' }, h('p', { class: 'hand' }, `letra ${L}`), h('div', { class: 'st-reel land' }, L), num)]);
    const my = round;
    const step = (n) => { if (gone || ph !== 'contagem' || round !== my) return; if (n === 0) { FX.play('count', 'go'); num.textContent = 'valendo!'; return later(() => { if (ph === 'contagem' && round === my) jogar(null); }, 350); }
      num.textContent = String(n); num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop'); FX.play('count'); later(() => step(n - 1), motion() ? 750 : 500); };
    step(3);
  }

  /* ================= jogar ================= */
  /** `sv` = o que este celular tinha guardado (voltou pra sala no meio da rodada). */
  function jogar(sv) {
    ph = 'jogando'; locked = false; paused = false; semOutro = false; const e = latest; const L = e.letter; const nc = e.cats.length;
    answers = Q.limparTexto(sv && sv.answers, nc); inputs = []; live = h('p', { class: 'sr-only', 'aria-live': 'polite' }); lastSec = -1;
    const bar = h('i', { class: 'st-bar-in' }); const count = h('b', {}, '0');
    const upd = () => { const f = answers.filter((a) => a.trim()).length; count.textContent = String(f); bar.style.width = `${(f / nc) * 100}%`; };
    const salvar = () => { clearTimeout(saveT); saveT = setTimeout(() => guardar(key(), { answers, deadline: paused ? null : deadline, pausadoRest: paused ? remain : null }), 250); };
    const fields = e.cats.map((cid, c) => {
      const inp = h('input', { type: 'text', value: answers[c], autocomplete: 'off', autocapitalize: 'words', autocorrect: 'off', spellcheck: 'false', maxlength: 80, enterkeyhint: c === nc - 1 ? 'done' : 'next', 'data-c': c, 'aria-label': `${S.CAT[cid].label}, letra ${L}`,
        oninput: (ev) => { if (locked) return; answers[c] = ev.target.value; row.classList.toggle('done', !!ev.target.value.trim()); upd(); salvar(); },
        onkeydown: (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); const n = inputs[c + 1]; if (n) n.focus(); else inp.blur(); } },
        onfocus: () => { inp.scrollIntoView({ block: 'center', behavior: motion() ? 'smooth' : 'auto' }); } });
      const row = h('label', { class: `jg-field st-field${answers[c].trim() ? ' done' : ''}` }, h('span', {}, S.CAT[cid].label, h('em', { 'aria-hidden': 'true' }, ' ✔')), inp);
      inputs.push(inp); return row;
    });
    const timeEl = h('b', { class: 'st-time', role: 'timer', 'aria-label': 'tempo restante' }, clock(e.seconds));
    const stopBtn = h('button', { class: 'st-stop', type: 'button', onclick: () => stopPress(stopBtn) }, 'STOP!');
    root.replaceChildren(...[badge.el, ...av(), live,
      h('div', { class: 'st-top' }, h('div', { class: 'jg-who' }, h('b', {}, 'você'), h('span', {}, `ao mesmo tempo`)), h('div', { class: 'st-letter', 'aria-label': `letra ${L}` }, L), h('div', { class: 'jg-who st-timebox' }, h('b', {}, 'tempo'), timeEl)),
      h('p', { class: 'ss-aviso', role: 'status', 'aria-live': 'assertive' }),
      h('div', { class: 'st-progress' }, h('span', {}, count, ` de ${nc} preenchidos`), h('div', { class: 'st-bar' }, bar)),
      caixaPausa(() => resume(), 'o relógio parou só aqui. os outros celulares continuam jogando.'),
      h('div', { class: 'jg-fields st-fields' }, ...fields),
      h('div', { class: 'st-stopbar' }, stopBtn)].filter(Boolean));
    upd(); if (!sv && inputs[0]) inputs[0].focus({ preventScroll: true });
    const rest = Q.restanteMs(sv); // voltando: continua de onde parou
    remain = rest != null ? rest : e.seconds * 1000; deadline = Date.now() + remain;
    if (sv && typeof sv.pausadoRest === 'number') { paused = true; root.classList.add('ss-pausado'); }
    guardar(key(), { answers, deadline: paused ? null : deadline, pausadoRest: paused ? remain : null });
    tickFn = () => { if (ph !== 'jogando' || locked) return; const rem = deadline - Date.now(); const sec = Math.max(0, Math.ceil(rem / 1000));
      timeEl.textContent = clock(sec); const box = root.querySelector('.st-timebox');
      if (box) { box.classList.toggle('warn', sec <= 10 && sec > 5); box.classList.toggle('hot', sec <= 5); box.classList.toggle('last', sec <= 3); }
      if (sec !== lastSec) { lastSec = sec; if (sec > 0 && sec <= 3) FX.play('last3'); else if (sec > 0 && sec <= 10) FX.play('metro'); if (sec === 10 || sec === 5) sr(`${sec} segundos`); }
      if (rem <= 0) timeUp(); };
    stopClock(); if (!paused) clk = setInterval(tickFn, 200); tickFn();
    avisoOutro();
    if (Q.stopDoOutro(latest, me)) pararForcado(); // o outro já tinha apertado STOP antes deste celular começar
  }
  const usedSec = () => Math.min(latest.seconds, Math.max(0, latest.seconds - (paused ? remain : deadline - Date.now()) / 1000));
  const lerCampos = () => { if (inputs.length) inputs.forEach((i) => { answers[Number(i.dataset.c)] = i.value; }); return answers.slice(); };
  const aviso = (t) => { const el = root.querySelector('.ss-aviso'); if (el) { el.textContent = t; el.classList.toggle('on', !!t); } };
  function avisoOutro() { // o outro pausou: só informa, nunca trava este celular
    if (ph !== 'jogando' || locked) return; const el = root.querySelector('.ss-aviso'); if (!el || el.dataset.fixo) return;
    const quemP = outros.filter((i) => latest.pausa[i]); el.textContent = quemP.length ? (N > 2 ? `${quemP.map(quem).join(', ')} pausou` : 'o outro pausou') : ''; el.classList.toggle('on', quemP.length > 0);
  }
  function freeze() { locked = true; stopClock(); inputs.forEach((i) => { i.readOnly = true; i.blur(); }); const b = root.querySelector('.st-stop'); if (b) b.disabled = true; }
  function fixarAviso(t) { const el = root.querySelector('.ss-aviso'); if (el) { el.dataset.fixo = '1'; el.textContent = t; el.classList.add('on'); } }

  /** Fecha a rodada aqui: guarda no aparelho, manda pra sala (insiste até conseguir) e mostra o resultado. */
  function encerrar(como, usado) {
    const resp = lerCampos(); const quando = round;
    guardar(key(), { answers: resp, fin: { como, usado }, deadline: null });
    ph = 'encerrando'; esperaDesde = Date.now();
    gravar((s) => Q.finalizar(s, me, resp, usado, como)).then(() => { if (!gone && round === quando) { if (ph === 'resultado') renderResultado(); else if (Q.quemParou(latest) !== null && Q.quemParou(latest) !== me && como === 'stop') fixarAviso(`${N > 2 ? quem(Q.quemParou(latest)) : 'o outro'} apertou STOP primeiro!`); } });
    later(() => { if (round === quando && ph === 'encerrando') { ph = 'resultado'; esperaDesde = Date.now(); renderResultado(); } }, como === 'tempo' ? (motion() ? 1000 : 300) : (motion() ? 1100 : 300));
  }
  function stopPress(btn) {
    if (locked || ph !== 'jogando' || paused) return; const usado = usedSec(); freeze(); // um toque só: trava na hora
    FX.play('stop'); FX.duck(2500); FX.vibrate([40, 30, 70]); sr('stop!');
    if (motion()) { btn.classList.add('hit'); root.classList.add('shake'); const ov = h('div', { class: 'st-stopword', 'aria-hidden': 'true' }, 'STOP!'); root.append(ov); later(() => { ov.remove(); root.classList.remove('shake'); }, 900); }
    fixarAviso('você apertou STOP!'); encerrar('stop', usado);
  }
  function pararForcado() { // o outro apertou STOP: trava na hora e manda as respostas como estão
    if (locked || ph !== 'jogando') return; const usado = usedSec(); paused = false; root.classList.remove('ss-pausado'); freeze();
    FX.play('stop'); FX.duck(2500); FX.vibrate([60, 40, 60]); sr(`${N > 2 ? quem(Q.quemParou(latest)) : 'o outro'} apertou stop`);
    if (motion()) { root.classList.add('shake'); later(() => root.classList.remove('shake'), 600); }
    fixarAviso(`${N > 2 && Q.quemParou(latest) !== null ? quem(Q.quemParou(latest)) : 'o outro'} apertou STOP!`); encerrar('forcado', usado);
  }
  function timeUp() {
    if (locked || ph !== 'jogando') return; freeze(); FX.play('timeup'); FX.vibrate(180); sr('tempo esgotado'); fixarAviso('tempo! suas respostas foram guardadas.'); encerrar('tempo', latest.seconds);
  }

  /* ================= pausa (só neste celular) ================= */
  function pause() {
    if (ph !== 'jogando' || locked || paused) return false;
    paused = true; remain = Math.max(0, deadline - Date.now()); stopClock(); root.classList.add('ss-pausado'); inputs.forEach((i) => i.blur());
    guardar(key(), { answers: lerCampos(), deadline: null, pausadoRest: remain }); gravar((s) => Q.pausar(s, me, true), { vezes: 3 }); return true;
  }
  function resume() {
    if (!paused) return false;
    paused = false; deadline = Date.now() + remain; root.classList.remove('ss-pausado'); stopClock(); clk = setInterval(tickFn, 200); tickFn();
    guardar(key(), { answers: lerCampos(), deadline, pausadoRest: null }); gravar((s) => Q.pausar(s, me, false), { vezes: 3 }); return true;
  }

  /* ================= resultado ================= */
  function renderResultado() {
    if (gone) return; const e = latest; const faltam = Q.faltam(e).filter((i) => i !== me); const faltaOutro = faltam.length > 0;
    if (faltaOutro && !semOutro) {
      const passou = Date.now() - esperaDesde >= Q.SEM_RESPOSTA_MS;
      root.replaceChildren(...[badge.el, ...av(), h('div', { class: 'jg-cover2', role: 'status' }, h('p', { class: 'hand' }, 'suas respostas foram enviadas'), h('p', { class: 'muted' }, N > 2 ? `esperando ${faltam.map(quem).join(', ')} mandar${faltam.length > 1 ? 'em' : ''} as respostas…` : 'esperando o outro celular mandar as dele…'),
        passou ? h('div', { class: 'jg-actions' }, h('button', { class: 'btn', type: 'button', onclick: () => { semOutro = true; renderResultado(); } }, N > 2 ? 'alguém sumiu? ver o placar assim mesmo' : 'o outro sumiu? ver o placar assim mesmo')) : null)].filter(Boolean));
      if (!passou) later(() => { if (ph === 'resultado' && Q.faltam(latest).some((i) => i !== me)) renderResultado(); }, Q.SEM_RESPOSTA_MS - (Date.now() - esperaDesde) + 100);
      return;
    }
    const R = Q.resultado(e, { semOutro }); const RO = me !== Q.revisorDe(e); const p0 = quemParouTxt(e);
    const cards = e.cats.map((cid, c) => {
      const rows = [me, ...outros].map((p) => {
        const r = R.sc.res[p][c]; const pt = R.sc.points[p][c]; const txt = R.g.cur.answers[p][c].trim(); const [lab, ico] = STATUS[r.status];
        return h('div', { class: `st-ans ${r.status}`, 'data-st': r.status, 'data-pt': pt == null ? '' : String(pt) },
          h('span', { class: 'st-who' }, rot(p)), h('span', { class: 'st-txt' }, r.empty ? '(vazio)' : txt),
          h('span', { class: 'st-badge', role: 'status' }, h('i', { 'aria-hidden': 'true' }, ico), ` ${r.empty ? 'vazia' : lab}`, h('b', {}, pt == null ? ' ?' : ` +${pt}`.replace('+0', '0'))),
          h('small', { class: 'muted' }, r.manual ? `decisão da revisão: ${r.why}` : r.status === 'valida' ? '' : r.why),
          r.suggest && !r.manual && !RO ? h('button', { class: 'btn small', type: 'button', onclick: () => aplicar(p, c, 'valida', { why: `grafia corrigida pra “${r.suggest}”`, by: 'quem criou a sala', canon: r.suggestId }) }, `era “${r.suggest}”`) : null,
          !RO && !r.empty ? h('button', { class: 'btn small ghost st-contest', type: 'button', onclick: () => contestar(p, c, R) }, 'contestar resposta') : null);
      });
      return h('div', { class: 'jg-rv st-card' }, h('b', {}, S.CAT[cid].label), ...rows,
        h('label', { class: 'jg-chk' }, h('input', { type: 'checkbox', disabled: RO ? true : null, checked: e.rev.equiv[c] ? true : null, onchange: (ev) => aplicarEquiv(c, ev.target.checked) }), ' as respostas válidas são equivalentes (valem 5)'));
    });
    const v = R.vencedor; const euVenci = v === me;
    const titulo = v === -1 ? 'empate!' : euVenci ? 'você venceu! 🏆' : `${quem(v)} venceu desta vez`;
    root.replaceChildren(...[badge.el, ...av(),
      placar({ classe: `jg-result st-final${v === -1 ? ' tie' : ''}`, estado: v === -1 ? 'tie' : euVenci ? 'win' : 'lose', pose: v === -1 ? poseDisponivel('agua', 'ouvindo') : euVenci ? poseDisponivel('gravando', 'microfone') : poseDisponivel('meditando', 'ouvindo'), titulo, sub: p0,
        quadros: [me, ...outros].map((i) => ({ n: R.sc.sums[i], l: rot(i), win: v === i })),
        extra: [R.pend ? h('p', { class: 'jg-p muted' }, `${R.pend} resposta${R.pend > 1 ? 's' : ''} aguardando revisão (valem 0 por enquanto). ${RO ? `${quem(Q.revisorDe(e))}${Q.revisorDe(e) === 0 ? ' (quem criou a sala)' : ''} decide.` : 'toque em “contestar resposta” pra aprovar ou rejeitar.'}`) : null,
          semOutro && faltaOutro ? h('p', { class: 'jg-p muted' }, N > 2 ? 'alguém não mandou as respostas. placar só com as que chegaram.' : 'o outro celular não mandou as respostas. placar só com as suas.') : null,
          e.wins.reduce((t, x) => t + x, 0) + (e.empates || 0) > 0 ? h('p', { class: 'ss-wins' }, vitoriasTxt(e)) : null],
        acoes: [e.fim ? null : h('button', { class: 'btn primary jo-go', type: 'button', onclick: revanche }, 'revanche'), h('button', { class: 'btn ghost', type: 'button', onclick: sairDaSala }, 'voltar às opções')].filter(Boolean) }),
      h('h3', { class: 'hand' }, `rodada com a letra ${e.letter}`), ...cards,
      RO ? h('p', { class: 'jg-p muted' }, `${N > 2 ? `${quem(Q.revisorDe(e))}${Q.revisorDe(e) === 0 ? ', que criou a sala,' : ''}` : 'quem criou a sala'} aprova ou rejeita as respostas. as marcas aparecem aqui.`) : null].filter(Boolean));
    if (v != null && somRodada !== round) { somRodada = round; FX.play(v === -1 ? 'tie' : euVenci ? 'win' : 'bad'); }
    if (N > 2 && !R.pend && (euVenci || R.sc.sums[me] > 0)) { const k = `beaterista-stop-estrela:${conn.code}:${round}`; let ja = false; try { ja = !!localStorage.getItem(k); if (!ja) localStorage.setItem(k, '1'); } catch { /* sem armazenamento */ } if (!ja) ganhou('stop', euVenci ? 3 : 1); } // 3 e 4 jogadores: quem ganha a rodada leva 3 ★ (3 rodadas = 9); quem não ganhou mas não zerou leva 1 ★. Paga uma vez por rodada e só quando não falta revisar resposta
  }
  function quemParouTxt(e) {
    const q = Q.quemParou(e); if (q === me) return 'você apertou STOP primeiro';
    if (q !== null) return `${N > 2 ? quem(q) : 'o outro'} apertou STOP primeiro`;
    return 'acabou o tempo';
  }
  async function aplicar(p, c, d, opts) { await gravar((s) => Q.decidir(s, p, c, d, opts)); renderResultado(); }
  async function aplicarEquiv(c, on) { await gravar((s) => Q.equivalente(s, c, on)); renderResultado(); }
  function contestar(p, c, R) {
    const r = R.sc.res[p][c]; const txt = R.g.cur.answers[p][c].trim();
    sheet('contestar resposta', (close) => {
      const why = h('input', { type: 'text', maxlength: 160, placeholder: 'motivo (opcional)', 'aria-label': 'motivo da decisão' });
      const apply = (d) => { close(); FX.play(d === 'valida' ? 'ok' : 'bad'); aplicar(p, c, d, { why: why.value.trim() || (d === 'valida' ? 'aprovada na revisão' : d === 'invalida' ? 'rejeitada na revisão' : 'voltou ao automático'), by: 'quem criou a sala' }); };
      return h('div', { class: 'sheet-body st-contest' },
        h('p', {}, h('b', {}, txt), ` · ${S.CAT[latest.cats[c]].label} · letra ${latest.letter}`), h('p', { class: 'muted' }, `agora: ${STATUS[r.status][0]}${r.why ? ` (${r.why})` : ''}`), why,
        h('div', { class: 'jg-actions row' }, h('button', { class: 'btn primary', type: 'button', onclick: () => apply('valida') }, 'aprovar'), h('button', { class: 'btn', type: 'button', onclick: () => apply('invalida') }, 'rejeitar'),
          r.manual ? h('button', { class: 'btn ghost', type: 'button', onclick: () => apply(null) }, 'voltar ao automático') : null));
    });
  }
  function revanche() { FX.play('tap'); gravar((s) => Q.proximaRodada(s, me)).then(() => aoMudar()); }

  /* ================= ciclo de vida ================= */
  const onVis = () => { if (!document.hidden && ph === 'jogando' && !locked && !paused && deadline - Date.now() <= 0) timeUp(); };
  document.addEventListener('visibilitychange', onVis);
  function entrar() { // decide em que ponto a pessoa está (vale também pra quem volta pra sala no meio da rodada)
    const e = latest; if (Q.foraDe(e).includes(me)) return renderFora(); const sv = ler(key());
    if (e.res[me]) { ph = 'resultado'; esperaDesde = Date.now(); return renderResultado(); }
    if (sv && sv.fin) { // fechou a rodada mas a gravação não chegou: manda de novo
      ph = 'resultado'; esperaDesde = Date.now(); gravar((s) => Q.finalizar(s, me, sv.answers, sv.fin.usado, sv.fin.como)).then(() => aoMudar()); return renderResultado();
    }
    if (Q.todosProntos(e)) { if (sv && (sv.deadline != null || sv.pausadoRest != null)) return jogar(sv); return contagem(); }
    ph = 'sala'; renderSala();
  }
  root.className = 'jg jg-stop st ss'; entrar(); aplicaSaida();
  return {
    pause, resume, isPaused: () => paused,
    inProgress: () => ph === 'contagem' || ph === 'jogando' || ph === 'encerrando',
    destroy() { gone = true; root.className = 'jg jg-stop st'; clearTimeout(saveT); stopClock(); timers.forEach(clearTimeout); timers.clear(); document.removeEventListener('visibilitychange', onVis); },
  };
}
