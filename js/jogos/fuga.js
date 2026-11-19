// A Fuga do Estúdio: um mapa de mundos (como Figurix e Toca Aqui). Cada fase é uma PORTA trancada com lasers; o aluno abre resolvendo um quiz, uma caça-palavras ou uma cruzadinha.
// 3 mundos (Estúdio dos Lasers · Vulcão · Estação Espacial) × 12 fases × 3 ★ = 36 ★ por mundo. Regras e números em fuga-logic.js. Reaproveita os 3 jogos de palavras (modo "D": sem estrela própria).
import { h } from '../util.js';
import { banner, toast } from '../ui.js';
import * as FB from '../feedback.js';
import { alunoSemCodigo, avisoCodigo } from '../amostra.js';
import { corSrc } from '../paul-cor.js';
import { audio, out } from '../audio.js';
import { getGame, setGame } from './base.js';
import { mountProgressionMap } from '../kids/mapa.js';
import { temaDoMundo } from './mundos-tema.js';
import { MINI } from './fuga-mini.js';
import { MUNDOS, FASES, NOME_TIPO, NOME_NIVEL, MIN_QUIZ, BONUS, portasDaFase, estrelasPorta, estrelasFase, estrelasDesafio, bonusAberto, bonusFeito, estOf, estMundo, faseAberta, mundoLiberado, idFase, idPorta, proximaFase, qtdPortas, DESAFIOS } from './fuga-logic.js';
import { mountFugaMapa } from './fuga-mapa.js';
import * as MOLD from '../molduras.js';
export { MIN_QUIZ, estrelasPorta };

/** Efeitos sintetizados na hora (sem arquivo): laser, alarme, porta abrindo e fanfarra de vitória. Respeitam o botão de som do app. */
export function sfx(tipo) {
  try {
    const c = audio(); const o = out(); const t = c.currentTime + 0.02;
    const voz = (tp, f0, f1, ini, dur, vol, filtro) => { const x = c.createOscillator(); const g = c.createGain(); x.type = tp; x.frequency.setValueAtTime(f0, t + ini); x.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + ini + dur); g.gain.setValueAtTime(0.0001, t + ini); g.gain.exponentialRampToValueAtTime(vol, t + ini + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + ini + dur); let n = x; if (filtro) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filtro; x.connect(f); n = f; } n.connect(g); g.connect(o); x.start(t + ini); x.stop(t + ini + dur + 0.05); };
    if (tipo === 'laser') { voz('sawtooth', 1500, 180, 0, 0.22, 0.12, 4000); voz('square', 3000, 400, 0.02, 0.15, 0.04); }
    else if (tipo === 'alarme') { for (let k = 0; k < 4; k++) voz('square', k % 2 ? 520 : 780, k % 2 ? 500 : 760, k * 0.16, 0.15, 0.1, 2500); }
    else if (tipo === 'porta') { voz('sawtooth', 110, 55, 0, 0.55, 0.16, 500); voz('triangle', 70, 40, 0.05, 0.5, 0.2); [659, 880, 1319].forEach((f, k) => voz('sine', f, f, 0.5 + k * 0.1, 0.35, 0.12)); }
    else if (tipo === 'vitoria') { [523, 659, 784, 1047, 1319].forEach((f, k) => { voz('triangle', f, f, k * 0.11, 0.45, 0.14); voz('sine', f * 2, f * 2, k * 0.11, 0.3, 0.04); }); }
  } catch { /* sem áudio */ }
}

/** O corredor da fase: N portas lado a lado. Aberta = luz verde; a da vez = lâmpada ON AIR e lasers; as próximas = cadeado e lasers (como no estúdio de verdade). `abertas` = quantas já abriu. */
const cena = (abertas, N, alarme) => {
  const GAP = 22; const DW = 88; const total = N * DW + (N - 1) * GAP; const W = Math.max(352, total + 32); const x0 = (W - total) / 2;
  const porta = (i) => {
    const x = x0 + i * (DW + GAP); const st = i < abertas ? 'a' : i === abertas ? 'v' : 't'; const cor = st === 'a' ? '#4fd8ff' : st === 'v' ? '#ffd23f' : '#ff3b5c';
    const painel = st === 'a'
      ? `<polygon points="${x + 8},34 ${x + 36},26 ${x + 36},128 ${x + 8},126" fill="#171233" stroke="${cor}" stroke-width="2"/><polygon class="fg-luz" points="${x + 40},30 ${x + 98},4 ${x + 98},150 ${x + 40},124" fill="url(#fgLuz)"/>`
      : `<rect x="${x + 8}" y="30" width="72" height="98" rx="4" fill="#241c4a" stroke="${cor}" stroke-width="2"/><rect x="${x + 16}" y="40" width="56" height="30" rx="3" fill="#150f33" stroke="#5b4fa8"/><rect x="${x + 16}" y="78" width="56" height="42" rx="3" fill="#150f33" stroke="#5b4fa8"/>`;
    const cad = st === 'a' ? '' : `<g class="fg-cad ${st}" transform="translate(${x + 44} 86)"><path d="M-9 -2v-8a9 9 0 0118 0v8" fill="none" stroke="${cor}" stroke-width="3.5" stroke-linecap="round"/><rect x="-13" y="-3" width="26" height="22" rx="4" fill="${cor}"/><circle cx="0" cy="7" r="3" fill="#150f33"/><rect x="-1.4" y="8" width="2.8" height="7" fill="#150f33"/></g>`;
    const onair = st === 'v' ? `<g class="fg-onair"><rect x="${x + 22}" y="6" width="44" height="14" rx="3" fill="#ff3b5c"/><text x="${x + 44}" y="16.5" text-anchor="middle" font-size="8.5" font-weight="900" fill="#fff" font-family="Anton,sans-serif" letter-spacing="1.5">ON AIR</text></g>` : st === 'a' ? `<text x="${x + 44}" y="16" text-anchor="middle" font-size="9" font-weight="900" fill="#4fd8ff" font-family="sans-serif">ABERTA</text>` : '';
    const lasers = st === 'a' ? '' : [0, 1, 2].map((k) => `<line class="fg-lz l${k}" x1="${x - 4}" x2="${x + 92}" y1="${44 + k * 30}" y2="${44 + k * 30}"/>`).join('');
    return `<rect x="${x}" y="22" width="88" height="112" rx="6" fill="#0e0a24" stroke="#4a3d9a" stroke-width="3"/>${painel}${cad}${onair}${lasers}<text x="${x + 44}" y="150" text-anchor="middle" font-size="9.5" font-weight="800" fill="${st === 't' ? '#8a85b8' : '#fff6e0'}" font-family="sans-serif">porta ${i + 1}</text>`;
  };
  const pronto = abertas >= N;
  const el = h('div', { class: `bmr fg-cena${alarme ? ' alarme' : ''}${pronto ? ' livre' : ''}`, role: 'img', 'aria-label': `${abertas} de ${N} portas abertas` });
  el.innerHTML = `<svg viewBox="0 0 ${W} 158" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgLuz" x1="0" x2="1"><stop offset="0" stop-color="#d6f6ff" stop-opacity=".95"/><stop offset="1" stop-color="#4fd8ff" stop-opacity="0"/></linearGradient><linearGradient id="fgChao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1450"/><stop offset="1" stop-color="#07041a"/></linearGradient></defs><rect width="${W}" height="158" fill="url(#fgChao)"/>${Array.from({ length: 12 }, (_, k) => `<line x1="${k * (W / 11)}" y1="134" x2="${W / 2 + (k - 5.5) * (W / 4.4)}" y2="158" stroke="#5b4fa8" stroke-opacity=".35"/>`).join('')}${Array.from({ length: N }, (_, i) => porta(i)).join('')}${pronto ? '' : `<line class="fg-varre" x1="0" x2="${W}" y1="0" y2="0"/>`}</svg>`;
  return el;
};
const seg = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const estTxt = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

export function mount(host) {
  let gone = false; let off = null; let mundo = getGame('fuga').mundo || MUNDOS[0].id;
  const wrap = h('div', { class: 'jg jg-wrap dc-wrap escuro fg-wrap' });
  host.append(banner('A Fuga do Estúdio', 'abra as portas, mundo por mundo'), wrap);
  const est = () => getGame('fuga').est || {};
  // regra dos alunos: o próximo mundo só abre com 1 ★ em todas as fases do anterior. No app da Bea fica tudo aberto.
  const REGRA = document.documentElement.classList.contains('aluno-on'); const aberto = (id) => !REGRA || mundoLiberado(est(), id);
  if (!aberto(mundo)) mundo = MUNDOS[0].id;
  let relogio = 0; // contagem regressiva dos desafios (some ao sair da tela)
  const limpa = () => { clearInterval(relogio); relogio = 0; if (off) { try { off(); } catch { /* ok */ } off = null; } };
  const topo = (extra) => h('div', { class: 'jg-top' }, h('a', { class: 'jg-link', href: '#/jogos' }, '‹ jogos'), extra || null);

  /* ---------- mapa ---------- */
  const mapa = () => {
    limpa(); const M = MUNDOS.find((m) => m.id === mundo) || MUNDOS[0]; const mi = MUNDOS.indexOf(M);
    const box = h('div', { class: M.mapa === 'lab' ? 'fm bmr' : 'tm-map' });
    const levels = Array.from({ length: FASES }, (_, i) => ({ id: idFase(M.id, i + 1), index: i + 1, label: String(i + 1), tag: '', boss: i === FASES - 1 }));
    const tabs = h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': 'Mundo' }, ...MUNDOS.map((m, i) => { const ok = aberto(m.id);
      return h('button', { type: 'button', role: 'radio', 'aria-checked': String(m.id === mundo), class: `${m.id === mundo ? 'on' : ''}${ok ? '' : ' lock'}`, 'data-mundo': m.id, onclick: () => { if (!ok) { toast(`mundo trancado: abra todas as portas do mundo anterior (1 ★ em cada)`, { ms: 3400 }); return; } mundo = m.id; setGame('fuga', { mundo }); mapa(); } }, `${ok ? '' : '🔒 '}${i + 1} · ${m.curto}`); }));
    wrap.replaceChildren(topo(), h('div', { class: 'tm-bar fg-abas' }, tabs), h('p', { class: 'tm-dica' }, `${M.nome} · ${M.sub}. cada disco é uma fase com várias portas!`), box);
    if (M.mapa === 'lab') {
      const fases = Array.from({ length: FASES }, (_, i) => { const n = i + 1; const e = estOf(est(), M.id, n); return { n, portas: qtdPortas(n), desafio: !!DESAFIOS[n], stars: e, state: e > 0 ? 'done' : faseAberta(est(), M.id, n) ? 'open' : 'locked' }; });
      const bonus = { state: bonusFeito(est(), M.id) ? 'done' : bonusAberto(est(), M.id) ? 'open' : 'locked' };
      mountFugaMapa(box, { titulo: 'Escape Room', subtitulo: M.nome, fases, bonus, lastKey: `beaterista-fuga-paul:${M.id}`, onOpen: (n) => joga(M, mi, n), onBonus: () => joga(M, mi, 'B'), onLocked: (n) => toast(n === 'B' ? 'a porta B abre quando você terminar a fase 12' : 'abra a fase anterior primeiro (1 ★ nela)', { ms: 2800 }) });
      return;
    }
    off = mountProgressionMap(box, { gameId: `fuga-${M.id}`, levels, profileId: 'fuga', unitName: 'Fase', tier: 0, stars: { have: estMundo(est(), M.id), max: FASES * 3 }, theme: temaDoMundo(M.tema, M.nome, [['a', M.regioes[0].name, M.regioes[0].sub], ['b', M.regioes[1].name, M.regioes[1].sub]]),
      starsOf: (id) => estOf(est(), M.id, Number(id.split(':')[1])), unlockedOf: (id) => faseAberta(est(), M.id, Number(id.split(':')[1])), lockedMsg: 'abra a porta anterior primeiro', onOpen: (lv) => joga(M, mi, lv.index) });
    const hd = box.querySelector('.mp-head'); const bar = h('div', { class: 'tm-bar' }, tabs); if (hd) hd.append(bar); else box.prepend(bar);
  };

  /* ---------- uma fase: várias portas em sequência (ou 1 só, nos desafios 6 e 7) · n = 1..12 ou 'B' (porta bônus) ---------- */
  async function joga(M, mi, n) {
    limpa(); if (gone) return; const bonusB = n === 'B'; const portas = bonusB ? [{ ...BONUS, desafio: true }] : portasDaFase(mi, n); const N = portas.length;
    const mod = (await import('../views/dicas.js'))._duelo; const T = await import('../tips.js'); if (gone) return;
    const its = mod.items(); const caixa = h('div', { class: 'dc-box' }); let k = 0; let api = null; let feito = false; const t0 = Date.now(); let tentativas = 0; const ganhos = []; let tPorta = 0;
    const rel = h('p', { class: 'fg-rel', role: 'timer', hidden: true });
    const paraRelogio = () => { clearInterval(relogio); relogio = 0; };
    const sair = () => { paraRelogio(); mapa(); };
    const voltar = () => topo(h('button', { type: 'button', class: 'btn small ghost', onclick: sair }, '‹ mapa'));
    const rotulo = () => (bonusB ? `${M.curto} · porta B · ${BONUS.titulo}` : portas[k].desafio ? `${M.curto} · fase ${n} · ${portas[k].titulo}` : `${M.curto} · fase ${n} · porta ${k + 1} de ${N} · ${NOME_TIPO[portas[k].tipo]} · ${NOME_NIVEL[portas[k].nivel] || ''}`);
    const cab = (alarme) => [voltar(), cena(k, N, alarme), h('p', { class: 'tr-count' }, rotulo()), rel];
    const falha = (msg) => { paraRelogio(); feito = true; tentativas++; sfx('alarme'); wrap.replaceChildren(voltar(), cena(k, N, true), fala(msg, h('button', { class: 'btn primary wide', type: 'button', onclick: comeca }, 'tentar outra vez'))); };
    const fim = () => setTimeout(() => { if (gone || feito) return; feito = true; resolve(); }, 700);
    const comeca = () => {
      const cfg = portas[k]; feito = false; api = null; caixa.replaceChildren(); rel.hidden = !cfg.limite; wrap.replaceChildren(...cab(false), caixa); sfx('laser'); tPorta = Date.now(); paraRelogio();
      if (cfg.limite) { const pinta = () => { const s = (Date.now() - tPorta) / 1000; const resta = Math.max(0, Math.ceil(cfg.limite - s)); rel.textContent = `⏱ ${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`; rel.classList.toggle('pouco', resta <= 10); if (s >= cfg.limite && !feito) falha('o tempo acabou! ⏱ tente de novo, mais rápido.'); }; pinta(); relogio = setInterval(pinta, 250); }
      if (cfg.tipo === 'quiz') { const kinds = cfg.kinds || ['blank', 'continua']; const qs = []; const vistos = new Set(); for (let q = 0; q < 120 && qs.length < Math.min(cfg.perguntas, its.length); q++) { const it = T.question(its, kinds[q % kinds.length]); if (!vistos.has(it.item.n)) { vistos.add(it.item.n); qs.push(it); } } api = mod.quiz(caixa, kinds, 'fuga', { qs, fim, ajuda: !cfg.desafio, maxErros: cfg.maxErros }); }
      else if (cfg.tipo === 'caca') api = mod.caca(caixa, { pick: T.easyPick(its, cfg.palavras), mk: () => Math.random, fim, dica: !cfg.desafio, size: cfg.grade, dirs: cfg.dirs });
      else if (cfg.tipo === 'cruz') api = mod.cruzadinha(caixa, { pick: T.easyPick(its, cfg.cruz, { min: 4, max: cfg.cruzMax || 8 }), mk: () => Math.random, fim });
      else if (MINI[cfg.tipo]) api = MINI[cfg.tipo](caixa, { nivel: cfg.nivel, area: cfg.area, fim }); // jogos de toque (genius, caminho 3×3, memória): fuga-mini.js
    };
    const resolve = () => {
      const cfg = portas[k]; const s = api && api.stats ? api.stats() : {}; const seg1 = (Date.now() - tPorta) / 1000; paraRelogio();
      if (cfg.maxErros != null) { if (s.erros > cfg.maxErros) { falha(cfg.maxErros === 0 ? 'você errou: nesse desafio não pode errar nenhuma! tente de novo.' : `você errou ${s.erros}: aqui só pode errar ${cfg.maxErros}. tente de novo!`); return; } }
      else if (cfg.tipo === 'quiz' && s.found < MIN_QUIZ) { falha(`só ${s.found} certa${s.found === 1 ? '' : 's'}: a porta precisa de ${MIN_QUIZ}. tenta de novo!`); return; }
      const ganho = bonusB ? (s.erros === 0 ? 3 : 2) : cfg.limite ? estrelasDesafio(seg1, cfg) : estrelasPorta(cfg.tipo, s); ganhos[k] = ganho;
      const kp = bonusB ? idFase(M.id, 'B') : idPorta(M.id, n, k + 1); const antes = Number(est()[kp]) || 0; const chave = bonusB ? `fuga|${M.id}|B` : `fuga|${M.id}|${n}|${k + 1}`;
      if (ganho > antes) { setGame('fuga', { est: { ...est(), [kp]: ganho }, mundo: M.id }); import('./estrelas-jogo.js').then((E) => E.ganhou('fuga', ganho, chave)).catch(() => {}); } // cada porta paga as suas ★ uma vez (só a melhora conta)
      k++; sfx('porta');
      if (k < N) { wrap.replaceChildren(voltar(), cena(k, N, false), fala(`porta aberta! 🔓 ${estTxt(ganho)} · agora: porta ${k + 1} de ${N} (${NOME_TIPO[portas[k].tipo]}).`, h('button', { class: 'btn primary wide', type: 'button', onclick: comeca }, 'próxima porta ▶'))); return; }
      if (bonusB) { // porta bônus: ★ + a moldura do perfil
        const nova = MOLD.dar(BONUS.moldura); const m = MOLD.MOLDURAS.find((x) => x.id === BONUS.moldura);
        const tela = fala(`🏆 você abriu a SAÍDA! ${estTxt(ganho)} ${nova ? '· você ganhou uma moldura pro seu perfil!' : '· (a moldura você já tinha)'}`, h('img', { class: 'fg-molduraimg', src: m.img, alt: `moldura ${m.nome}`, width: 160, height: 160 }),
          h('p', { class: 'muted' }, `moldura "${m.nome}": ela já aparece em volta da sua foto. dá pra tirar ou pôr de novo na aba Perfil.`), h('button', { class: 'btn primary wide', type: 'button', onclick: mapa }, 'voltar ao mapa'));
        wrap.replaceChildren(voltar(), cena(N, N, false), tela); FB.great(tela); sfx('vitoria'); return;
      }
      // abriu todas: a fase conta no mapa (1 a 3 ★ = média das portas) e o Paul anda quando você voltar pro mapa
      const fase = estrelasFase(ganhos); const antesFase = estOf(est(), M.id, n); if (fase > antesFase) setGame('fuga', { est: { ...est(), [idFase(M.id, n)]: fase }, mundo: M.id });
      const soma = ganhos.reduce((a, b) => a + b, 0); const prox = proximaFase(n); const mundoFeito = Array.from({ length: FASES }, (_, q) => estOf(est(), M.id, q + 1)).every((x) => x >= 1);
      const tela = fala(`💥 fase ${n} completa! ${N === 1 ? 'desafio vencido' : `${N} portas abertas`} · ${estTxt(Math.max(fase, antesFase))} no mapa · +${soma} ★ nas portas · ${seg(Date.now() - t0)}${tentativas ? ` · ${tentativas} tentativa${tentativas === 1 ? '' : 's'}` : ''}`,
        h('button', { class: 'btn primary wide', type: 'button', onclick: mapa }, 'voltar ao mapa (o Paul anda!)'), prox ? h('button', { class: 'btn ghost wide', type: 'button', onclick: () => joga(M, mi, prox) }, `próxima fase ▶ (${prox})`) : h('p', { class: 'muted' }, mundoFeito ? `🏆 você terminou o ${M.nome}! ${M.mapa === 'lab' ? 'a SAÍDA (porta bônus B) abriu: toque nela no mapa pra ganhar a moldura!' : mi < MUNDOS.length - 1 ? 'o próximo mundo abriu.' : 'último mundo concluído!'}` : 'faltam fases com 1 ★ neste mundo.'));
      wrap.replaceChildren(voltar(), cena(N, N, false), tela); FB.great(tela); if (ganho === 3) sfx('vitoria');
    };
    comeca();
  }
  const fala = (txt, ...extra) => h('section', { class: 'card pad fg-fala' }, h('img', { src: corSrc('professor'), alt: '', draggable: 'false', width: 84, height: 84 }), h('p', {}, txt), ...extra);

  if (alunoSemCodigo()) wrap.replaceChildren(topo(), avisoCodigo('a Fuga do Estúdio é pra alunos da Beaterista: usa as dicas do método. peça seu código pra professora Bea!'));
  else import('../views/dicas.js').then((m) => { if (gone) return; if (m._duelo.items().length < 6) wrap.replaceChildren(topo(), h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'as dicas ainda não chegaram.'), h('p', { class: 'muted' }, 'abre o app com internet uma vez e volta aqui.'))); else mapa(); });
  return () => { gone = true; limpa(); };
}
