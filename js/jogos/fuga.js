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
import { carregaBanco } from '../banco.js';
import { MUNDOS, FASES, NOME_TIPO, NOME_NIVEL, MIN_QUIZ, minQuiz, BONUS, portasDaFase, estrelasPorta, estrelasFase, estrelasDesafio, bonusAberto, bonusFeito, estOf, estMundo, faseAberta, mundoLiberado, idFase, idPorta, proximaFase, qtdPortas, DESAFIOS } from './fuga-logic.js';
import { mountFugaMapa } from './fuga-mapa.js';
import { trilhaInfo, trilhaCfg, estDaTrilha, paraTrilha, fasesFeitas, FASES_TRILHA, trilhaCompleta, trilhaLiberada, motivoTrilha, reiniciar, pagaPorPorta, estrelasDaTrilha, chavePorta, chaveTrilha, concluirTrilha, filtraAssunto, semVistos, registraVistos } from './fuga-trilhas-logic.js';
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

/** As portas da fase em fileira de cadeados (visual do laboratório do Paul): fechada = cadeado âmbar, a da vez = âmbar brilhando, aberta = cadeado verde aberto. `abertas` = quantas já abriu. */
const cena = (abertas, N, alarme) => {
  const cad = (aberta) => `<svg viewBox="0 0 24 28" width="26" height="30" aria-hidden="true"><rect x="3" y="12" width="18" height="14" rx="2" fill="currentColor"/><path d="M7 12V8a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" stroke-width="3" ${aberta ? 'transform="translate(5 -3) rotate(18 12 10)"' : ''}/><circle cx="12" cy="19" r="2.2" fill="#0b1020"/></svg>`;
  const pronto = abertas >= N;
  const el = h('div', { class: `bmr fg-cena fg-locks${alarme ? ' alarme' : ''}${pronto ? ' livre' : ''}`, role: 'img', 'aria-label': `${abertas} de ${N} portas abertas` });
  el.innerHTML = Array.from({ length: N }, (_, i) => { const st = i < abertas ? 'a' : i === abertas ? 'v' : 't'; return `<div class="fg-lk ${st}">${cad(st === 'a')}<small>porta ${i + 1}</small></div>`; }).join('');
  return el;
};
const seg = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const estTxt = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

export function mount(host) {
  let gone = false; let off = null; let mundo = getGame('fuga').mundo || MUNDOS[0].id;
  const wrap = h('div', { class: 'jg jg-wrap dc-wrap escuro fg-wrap' });
  host.append(banner('A Fuga do Estúdio', 'abra as portas, mundo por mundo'), wrap);
  // TRILHAS: o mesmo mapa jogado de novo com outro assunto. O progresso de cada trilha fica no mesmo bloco, com prefixo (trilha 1 = chaves de sempre, sem prefixo).
  const todas = () => getGame('fuga').est || {}; let trilha = Math.max(1, Math.floor(Number(getGame('fuga').trilha) || 1)); let TR = trilhaCfg(trilha);
  const est = () => estDaTrilha(todas(), trilha); const salva = (patch, mais) => setGame('fuga', { est: { ...todas(), ...paraTrilha(patch, trilha) }, ...(mais || {}) });
  // regra dos alunos: o próximo mundo só abre com 1 ★ em todas as fases do anterior (e a próxima trilha, com a anterior completa). No app da Bea fica tudo aberto.
  const REGRA = document.documentElement.classList.contains('aluno-on'); const aberto = (id) => !REGRA || mundoLiberado(est(), id); const trilhaAberta = (n) => !REGRA || trilhaLiberada(todas(), n);
  const mudaTrilha = (n) => { trilha = n; TR = trilhaCfg(n); setGame('fuga', { trilha: n }); };
  if (!trilhaAberta(trilha)) mudaTrilha(1);
  if (!aberto(mundo)) mundo = MUNDOS[0].id;
  /** Terminou as 36 fases da trilha? Dá o título (e 1 ★ da trilha 4 em diante), uma vez só. Devolve { novos, pagar } ou null. */
  const checaTrilha = () => {
    const g = getGame('fuga'); if (!trilhaCompleta(g.est, trilha)) return null; const r = concluirTrilha(g, trilha); if (!r.nova) return null;
    setGame('fuga', { trilhasFeitas: r.g.trilhasFeitas, titulos: r.g.titulos }); const pagar = estrelasDaTrilha(trilha);
    if (pagar) import('./estrelas-jogo.js').then((E) => E.ganhou('fuga', pagar, chaveTrilha(trilha))).catch(() => {});
    return { novos: r.novos, pagar };
  };
  const avisoTrilha = (r) => (r ? `🏅 trilha ${trilha} completa! ${r.novos.length ? `título${r.novos.length > 1 ? 's' : ''}: ${r.novos.map((t) => t.nome).join(' · ')}` : ''}${r.pagar ? ` · +${r.pagar} ★` : ''}` : '');
  let relogio = 0; // contagem regressiva dos desafios (some ao sair da tela)
  const limpa = () => { clearInterval(relogio); relogio = 0; if (off) { try { off(); } catch { /* ok */ } off = null; } };
  const topo = (extra) => h('div', { class: 'jg-top' }, h('a', { class: 'jg-link', href: '#/jogos' }, '‹ jogos'), extra || null);

  /* ---------- mapa ---------- */
  const mapa = () => {
    limpa(); const M = MUNDOS.find((m) => m.id === mundo) || MUNDOS[0]; const mi = MUNDOS.indexOf(M);
    const feitaAgora = checaTrilha(); if (feitaAgora) toast(avisoTrilha(feitaAgora), { ms: 4200 });
    const box = h('div', { class: M.mapa === 'lab' ? 'fm bmr' : 'tm-map' });
    const levels = Array.from({ length: FASES }, (_, i) => ({ id: idFase(M.id, i + 1), index: i + 1, label: String(i + 1), tag: '', boss: i === FASES - 1 }));
    const tabs = h('div', { class: 'tm-tabs', role: 'radiogroup', 'aria-label': 'Mundo' }, ...MUNDOS.map((m, i) => { const ok = aberto(m.id);
      return h('button', { type: 'button', role: 'radio', 'aria-checked': String(m.id === mundo), class: `${m.id === mundo ? 'on' : ''}${ok ? '' : ' lock'}`, 'data-mundo': m.id, onclick: () => { if (!ok) { toast(`mundo trancado: abra todas as portas do mundo anterior (1 ★ em cada)`, { ms: 3400 }); return; } mundo = m.id; setGame('fuga', { mundo }); mapa(); } }, `${ok ? '' : '🔒 '}${i + 1} · ${m.curto}`); }));
    const ultima = Math.max(0, ...((getGame('fuga').trilhasFeitas) || [])); const ate = Math.min(12, Math.max(5, ultima + 2));
    const nomeT = (n) => { const t = trilhaInfo(n); return n < 5 ? `${n} · ${t.nome}` : `${n} · ∞ ${t.volta}`; };
    const trilhas = h('div', { class: 'tm-tabs fg-trilhas', role: 'radiogroup', 'aria-label': 'Trilha' }, ...Array.from({ length: ate }, (_, i) => i + 1).map((n) => { const ok = trilhaAberta(n);
      return h('button', { type: 'button', role: 'radio', 'aria-checked': String(n === trilha), class: `${n === trilha ? 'on' : ''}${ok ? '' : ' lock'}`, 'data-trilha': String(n), onclick: () => { if (!ok) { toast(`trilha trancada: ${motivoTrilha(n)}`, { ms: 3600 }); return; } mudaTrilha(n); mapa(); } }, `${ok ? '' : '🔒 '}${nomeT(n)}`); }));
    const tinfo = trilhaInfo(trilha); const feitas = fasesFeitas(todas(), trilha);
    const reinicia = h('button', { type: 'button', class: 'btn small ghost fg-reiniciar', 'data-acao': 'reiniciar', onclick: () => { if (!window.confirm(`recomeçar a trilha ${trilha} (${tinfo.nome})? o mapa dela volta ao começo, com conteúdo novo. as estrelas que você já ganhou continuam suas.`)) return; const g = getGame('fuga'); setGame('fuga', { est: reiniciar(g.est, trilha), vistos: { ...(g.vistos || {}), [trilha]: [] } }); toast(`trilha ${trilha} recomeçada!`, { ms: 2400 }); mapa(); } }, '↻ recomeçar esta trilha');
    wrap.replaceChildren(topo(), h('div', { class: 'tm-bar fg-abas' }, trilhas), h('p', { class: 'tm-dica fg-trilha-info' }, h('b', {}, `trilha ${trilha} · ${tinfo.nome}`), ` · ${tinfo.sub} · ${feitas}/${FASES_TRILHA} fases${tinfo.paga === 'trilha' ? ' · as portas só contam no mapa; terminar a trilha dá 1 ★' : ''}`, ' ', reinicia), h('div', { class: 'tm-bar fg-abas' }, tabs), h('p', { class: 'tm-dica' }, `${M.nome} · ${M.sub}. cada disco é uma fase com várias portas!`), box);
    if (M.mapa === 'lab') {
      const fases = Array.from({ length: FASES }, (_, i) => { const n = i + 1; const e = estOf(est(), M.id, n); return { n, portas: qtdPortas(n), desafio: !!DESAFIOS[n], stars: e, state: e > 0 ? 'done' : faseAberta(est(), M.id, n) ? 'open' : 'locked' }; });
      const bonus = { state: bonusFeito(est(), M.id) ? 'done' : bonusAberto(est(), M.id) ? 'open' : 'locked' };
      mountFugaMapa(box, { titulo: 'Escape Room', subtitulo: M.nome, fases, bonus, lastKey: `beaterista-fuga-paul:${M.id}${trilha > 1 ? `:t${trilha}` : ''}`, onOpen: (n) => joga(M, mi, n), onBonus: () => joga(M, mi, 'B'), onLocked: (n) => toast(n === 'B' ? 'a porta B abre quando você terminar a fase 12' : 'abra a fase anterior primeiro (1 ★ nela)', { ms: 2800 }) });
      return;
    }
    off = mountProgressionMap(box, { gameId: `fuga-${M.id}`, levels, profileId: 'fuga', unitName: 'Fase', tier: 0, stars: { have: estMundo(est(), M.id), max: FASES * 3 }, theme: temaDoMundo(M.tema, M.nome, [['a', M.regioes[0].name, M.regioes[0].sub], ['b', M.regioes[1].name, M.regioes[1].sub]]),
      starsOf: (id) => estOf(est(), M.id, Number(id.split(':')[1])), unlockedOf: (id) => faseAberta(est(), M.id, Number(id.split(':')[1])), lockedMsg: 'abra a porta anterior primeiro', onOpen: (lv) => joga(M, mi, lv.index) });
    const hd = box.querySelector('.mp-head'); const bar = h('div', { class: 'tm-bar' }, tabs); if (hd) hd.append(bar); else box.prepend(bar);
  };

  /* ---------- uma fase: várias portas em sequência (ou 1 só, nos desafios 6 e 7) · n = 1..12 ou 'B' (porta bônus) ---------- */
  async function joga(M, mi, n) {
    limpa(); if (gone) return; const bonusB = n === 'B'; const portas = bonusB ? [{ ...BONUS, desafio: true, assuntos: TR.assuntos, extra: TR.extra }] : portasDaFase(mi, n, TR); const N = portas.length;
    const mod = (await import('../views/dicas.js'))._duelo; const T = await import('../tips.js'); if (gone) return;
    await carregaBanco(); if (gone) return; const todasDicas = mod.items(); const fa = filtraAssunto(todasDicas, TR.assuntos); const vistosG = (getGame('fuga').vistos || {})[trilha] || []; const its = semVistos(fa.itens, vistosG); let usados = []; const caixa = h('div', { class: 'dc-box' }); let k = 0; let api = null; let feito = false; const t0 = Date.now(); let tentativas = 0; const ganhos = []; let tPorta = 0;
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
      usados = []; if (cfg.tipo === 'quiz') { const kinds = cfg.kinds || ['blank', 'continua']; const qs = []; const vistos = new Set(); for (let q = 0; q < 120 && qs.length < Math.min(cfg.perguntas, its.length); q++) { const it = T.question(its, kinds[q % kinds.length]); if (!vistos.has(it.item.n)) { vistos.add(it.item.n); qs.push(it); } } usados = qs.map((q) => q.item.n); api = mod.quiz(caixa, kinds, 'fuga', { qs, fim, ajuda: !cfg.desafio, maxErros: cfg.maxErros, minimo: minQuiz(qs.length) }); }
      else if (cfg.tipo === 'caca') { const pk = T.easyPick(its, cfg.palavras); usados = pk.map((x) => x.n); api = mod.caca(caixa, { pick: pk, mk: () => Math.random, fim, dica: !cfg.desafio, size: cfg.grade, dirs: cfg.dirs }); }
      else if (cfg.tipo === 'cruz') { const pk = T.easyPick(its, cfg.cruz, { min: 4, max: cfg.cruzMax || 8 }); usados = pk.map((x) => x.n); api = mod.cruzadinha(caixa, { pick: pk, mk: () => Math.random, fim }); }
      else if (MINI[cfg.tipo]) api = MINI[cfg.tipo](caixa, { nivel: cfg.nivel, area: cfg.area, fim, extra: cfg.extra || 0, assuntos: cfg.assuntos }); // jogos de toque (genius, caminho 3×3, memória): fuga-mini.js
    };
    const resolve = () => {
      const cfg = portas[k]; const s = api && api.stats ? api.stats() : {}; const seg1 = (Date.now() - tPorta) / 1000; paraRelogio();
      if (cfg.maxErros != null) { if (s.erros > cfg.maxErros) { falha(cfg.maxErros === 0 ? 'você errou: nesse desafio não pode errar nenhuma! tente de novo.' : `você errou ${s.erros}: aqui só pode errar ${cfg.maxErros}. tente de novo!`); return; } }
      else if (cfg.tipo === 'quiz' && s.found < minQuiz(s.total)) { falha(s.puladas >= 2 ? `você pulou ${s.puladas} perguntas: a porta precisa de ${minQuiz(s.total)} certas de ${s.total}. sem ★ e a porta não abriu, tente de novo!` : `só ${s.found} certa${s.found === 1 ? '' : 's'}: a porta precisa de ${minQuiz(s.total)} de ${s.total}. tenta de novo!`); return; }
      const ganho = bonusB ? (s.erros === 0 ? 3 : 2) : cfg.limite ? estrelasDesafio(seg1, cfg) : estrelasPorta(cfg.tipo, s); ganhos[k] = ganho;
      const kp = bonusB ? idFase(M.id, 'B') : idPorta(M.id, n, k + 1); const antes = Number(est()[kp]) || 0; const chave = bonusB ? chavePorta(trilha, M.id, 'B') : chavePorta(trilha, M.id, n, k + 1);
      if (usados.length) setGame('fuga', { vistos: registraVistos(getGame('fuga'), trilha, usados).vistos }); // as dicas desta porta não voltam tão cedo nesta trilha
      if (ganho > antes) { salva({ [kp]: ganho }, { mundo: M.id }); if (pagaPorPorta(trilha)) import('./estrelas-jogo.js').then((E) => E.ganhou('fuga', ganho, chave)).catch(() => {}); } // trilhas 1-3: cada porta paga as suas ★ uma vez (só a melhora conta); da 4 em diante quem paga é a trilha inteira
      k++; sfx('porta');
      if (k < N) { wrap.replaceChildren(voltar(), cena(k, N, false), fala(`porta aberta! 🔓 ${estTxt(ganho)} · agora: porta ${k + 1} de ${N} (${NOME_TIPO[portas[k].tipo]}).`, h('button', { class: 'btn primary wide', type: 'button', onclick: comeca }, 'próxima porta ▶'))); return; }
      if (bonusB) { // porta bônus: ★ + a moldura do perfil
        const aviso = avisoTrilha(checaTrilha()); if (trilha > 1) { const t2 = fala(`🏆 você abriu a SAÍDA da trilha ${trilha}! ${estTxt(ganho)}${aviso ? ` ${aviso}` : ''}`, h('p', { class: 'muted' }, 'a moldura do perfil é só da primeira trilha.'), h('button', { class: 'btn primary wide', type: 'button', onclick: mapa }, 'voltar ao mapa')); wrap.replaceChildren(voltar(), cena(N, N, false), t2); FB.great(t2); sfx('vitoria'); return; }
        const nova = MOLD.dar(BONUS.moldura); const m = MOLD.MOLDURAS.find((x) => x.id === BONUS.moldura);
        const tela = fala(`🏆 você abriu a SAÍDA! ${estTxt(ganho)} ${nova ? '· você ganhou uma moldura pro seu perfil!' : '· (a moldura você já tinha)'}${aviso ? ` ${aviso}` : ''}`, h('img', { class: 'fg-molduraimg', src: m.img, alt: `moldura ${m.nome}`, width: 160, height: 160 }),
          h('p', { class: 'muted' }, `moldura "${m.nome}": ela já aparece em volta da sua foto. dá pra tirar ou pôr de novo na aba Perfil.`), h('button', { class: 'btn primary wide', type: 'button', onclick: mapa }, 'voltar ao mapa'));
        wrap.replaceChildren(voltar(), cena(N, N, false), tela); FB.great(tela); sfx('vitoria'); return;
      }
      // abriu todas: a fase conta no mapa (1 a 3 ★ = média das portas) e o Paul anda quando você voltar pro mapa
      const fase = estrelasFase(ganhos); const antesFase = estOf(est(), M.id, n); if (fase > antesFase) salva({ [idFase(M.id, n)]: fase }, { mundo: M.id }); const trilhaNova = avisoTrilha(checaTrilha());
      const soma = ganhos.reduce((a, b) => a + b, 0); const prox = proximaFase(n); const mundoFeito = Array.from({ length: FASES }, (_, q) => estOf(est(), M.id, q + 1)).every((x) => x >= 1);
      const tela = fala(`💥 fase ${n} completa! ${N === 1 ? 'desafio vencido' : `${N} portas abertas`} · ${estTxt(Math.max(fase, antesFase))} no mapa ${pagaPorPorta(trilha) ? ` · +${soma} ★ nas portas` : ''} · ${seg(Date.now() - t0)}${tentativas ? ` · ${tentativas} tentativa${tentativas === 1 ? '' : 's'}` : ''}`,
        trilhaNova ? h('p', { class: 'fg-trilha-nova' }, trilhaNova) : null, h('button', { class: 'btn primary wide', type: 'button', onclick: mapa }, 'voltar ao mapa (o Paul anda!)'), prox ? h('button', { class: 'btn ghost wide', type: 'button', onclick: () => joga(M, mi, prox) }, `próxima fase ▶ (${prox})`) : h('p', { class: 'muted' }, mundoFeito ? `🏆 você terminou o ${M.nome}! ${M.mapa === 'lab' ? (trilha === 1 ? 'a SAÍDA (porta bônus B) abriu: toque nela no mapa pra ganhar a moldura!' : 'a SAÍDA (porta bônus B) abriu!') : mi < MUNDOS.length - 1 ? 'o próximo mundo abriu.' : 'último mundo concluído!'}` : 'faltam fases com 1 ★ neste mundo.'));
      wrap.replaceChildren(voltar(), cena(N, N, false), tela); FB.great(tela); if (ganho === 3) sfx('vitoria');
    };
    comeca();
  }
  const fala = (txt, ...extra) => h('section', { class: 'card pad fg-fala' }, h('img', { src: corSrc('professor'), alt: '', draggable: 'false', width: 84, height: 84 }), h('p', {}, txt), ...extra);

  if (alunoSemCodigo()) wrap.replaceChildren(topo(), avisoCodigo('a Fuga do Estúdio é pra alunos da Beaterista: usa as dicas do método. peça seu código pra professora Bea!'));
  else import('../views/dicas.js').then((m) => { if (gone) return; if (m._duelo.items().length < 6) wrap.replaceChildren(topo(), h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'as dicas ainda não chegaram.'), h('p', { class: 'muted' }, 'abre o app com internet uma vez e volta aqui.'))); else mapa(); });
  return () => { gone = true; limpa(); };
}
