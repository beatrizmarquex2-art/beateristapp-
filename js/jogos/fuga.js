// A Fuga do Estúdio: o Paul ficou trancado no estúdio e só sai abrindo 3 portas em ordem.
//  porta 1 · sala de controle = quiz (5 perguntas, precisa de 3 certas) · porta 2 · cabine = caça-palavras · porta 3 · sala de ensaio = cruzadinha.
// Reaproveita os três jogos de palavras (modo "D" do duelo: sem estrela e sem recorde próprios); no fim paga 3 ★ (limite de 30 ★ por dia, como todo jogo).
import { h } from '../util.js';
import { banner } from '../ui.js';
import * as FB from '../feedback.js';
import { alunoSemCodigo, avisoCodigo } from '../amostra.js';
import { corSrc } from '../paul-cor.js';
import { ganhou } from './estrelas-jogo.js';
import { audio, out } from '../audio.js';

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
export const PORTAS = [
  { id: 'quiz', nome: 'sala de controle', ic: '🎛️', fala: 'acerte 3 de 5 perguntas pra destravar a mesa de som!' },
  { id: 'caca', nome: 'cabine de gravação', ic: '🎙️', fala: 'ache todas as palavras escondidas na grade!' },
  { id: 'cruz', nome: 'sala de ensaio', ic: '🥁', fala: 'complete a cruzadinha pra abrir a última porta!' },
];
export const MIN_QUIZ = 3;
const KB = 'beaterista-fuga-melhor';
const melhor = () => { try { return Number(localStorage.getItem(KB)) || 0; } catch { return 0; } };
const seg = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

export function mount(host) {
  const box = h('div', { class: 'dc-box' }); let gone = false; let t0 = 0; let abertas = 0; let tentativas = 0;
  const wrap = h('div', { class: 'jg jg-wrap dc-wrap escuro fg-wrap' });
  host.append(banner('A Fuga do Estúdio', 'o Paul está trancado!'), wrap);
  /** A cena: corredor escuro do estúdio com 3 portas. Trancada = cadeado + lasers; a da vez = lâmpada ON AIR acesa; aberta = luz saindo pela porta e sem laser. */
  const cena = (alarme = false) => {
    const D = [{ x: 22 }, { x: 132 }, { x: 242 }];
    const porta = (p, i) => {
      const { x } = D[i]; const st = i < abertas ? 'a' : i === abertas ? 'v' : 't'; const cor = st === 'a' ? '#3cff9a' : st === 'v' ? '#ffd23f' : '#ff3b5c';
      const painel = st === 'a'
        ? `<polygon points="${x + 8},34 ${x + 36},26 ${x + 36},128 ${x + 8},126" fill="#171233" stroke="${cor}" stroke-width="2"/><polygon class="fg-luz" points="${x + 40},30 ${x + 98},4 ${x + 98},150 ${x + 40},124" fill="url(#fgLuz)"/>`
        : `<rect x="${x + 8}" y="30" width="72" height="98" rx="4" fill="#241c4a" stroke="${cor}" stroke-width="2"/><rect x="${x + 16}" y="40" width="56" height="30" rx="3" fill="#150f33" stroke="#5b4fa8"/><rect x="${x + 16}" y="78" width="56" height="42" rx="3" fill="#150f33" stroke="#5b4fa8"/>`;
      const cad = st === 'a' ? '' : `<g class="fg-cad ${st}" transform="translate(${x + 44} 86)"><path d="M-9 -2v-8a9 9 0 0118 0v8" fill="none" stroke="${cor}" stroke-width="3.5" stroke-linecap="round"/><rect x="-13" y="-3" width="26" height="22" rx="4" fill="${cor}"/><circle cx="0" cy="7" r="3" fill="#150f33"/><rect x="-1.4" y="8" width="2.8" height="7" fill="#150f33"/></g>`;
      const onair = st === 'v' ? `<g class="fg-onair"><rect x="${x + 22}" y="6" width="44" height="14" rx="3" fill="#ff3b5c"/><text x="${x + 44}" y="16.5" text-anchor="middle" font-size="8.5" font-weight="900" fill="#fff" font-family="Anton,sans-serif" letter-spacing="1.5">ON AIR</text></g>` : st === 'a' ? `<text x="${x + 44}" y="16" text-anchor="middle" font-size="9" font-weight="900" fill="#3cff9a" font-family="sans-serif">ABERTA</text>` : '';
      const lasers = st === 'a' ? '' : [0, 1, 2].map((k) => `<line class="fg-lz l${k}" x1="${x - 4}" x2="${x + 92}" y1="${44 + k * 30}" y2="${44 + k * 30}"/>`).join('');
      return `<rect x="${x}" y="22" width="88" height="112" rx="6" fill="#0e0a24" stroke="#4a3d9a" stroke-width="3"/>${painel}${cad}${onair}${lasers}<text x="${x + 44}" y="150" text-anchor="middle" font-size="9.5" font-weight="800" fill="${st === 't' ? '#8a85b8' : '#fff6e0'}" font-family="sans-serif">${i + 1} · ${p.nome}</text>`;
    };
    const pronto = abertas >= PORTAS.length;
    const el = h('div', { class: `fg-cena${alarme ? ' alarme' : ''}${pronto ? ' livre' : ''}`, role: 'img', 'aria-label': `${abertas} de ${PORTAS.length} portas abertas` });
    el.innerHTML = `<svg viewBox="0 0 352 158" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fgLuz" x1="0" x2="1"><stop offset="0" stop-color="#b8ffd8" stop-opacity=".95"/><stop offset="1" stop-color="#3cff9a" stop-opacity="0"/></linearGradient><linearGradient id="fgChao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1450"/><stop offset="1" stop-color="#07041a"/></linearGradient></defs>
<rect width="352" height="158" fill="url(#fgChao)"/>${Array.from({ length: 12 }, (_, k) => `<line x1="${k * 32}" y1="134" x2="${176 + (k - 5.5) * 80}" y2="158" stroke="#5b4fa8" stroke-opacity=".35"/>`).join('')}
${PORTAS.map(porta).join('')}${pronto ? '' : '<line class="fg-varre" x1="0" x2="352" y1="0" y2="0"/>'}</svg>`;
    return el;
  };
  const portas = (alarme) => cena(alarme);
  const topo = () => h('div', { class: 'jg-top' }, h('a', { class: 'jg-link', href: '#/jogos' }, '‹ jogos'));
  const fala = (txt, ...extra) => h('section', { class: 'card pad fg-fala' }, h('img', { src: corSrc('professor'), alt: '', draggable: 'false', width: 84, height: 84 }), h('p', {}, txt), ...extra);
  const comeca = () => { abertas = 0; tentativas = 0; t0 = Date.now(); fase(); };
  const intro = () => wrap.replaceChildren(topo(), portas(), fala('socorro! a porta do estúdio trancou comigo aqui dentro 😱 só saio se você abrir as 3 portas: quiz, caça-palavras e cruzadinha. bora?',
    h('button', { class: 'btn primary wide', type: 'button', onclick: comeca }, 'abrir as portas'), melhor() ? h('p', { class: 'muted' }, `seu recorde: ${seg(melhor())}`) : null));
  const fase = async () => {
    if (gone) return; const P = PORTAS[abertas]; const mod = (await import('../views/dicas.js'))._duelo; const T = await import('../tips.js'); if (gone) return;
    const its = mod.items(); box.replaceChildren(); let api = null; let feito = false; sfx('laser');
    const fim = () => setTimeout(() => { if (gone || feito) return; feito = true; resolve(); }, 700);
    const resolve = () => {
      if (P.id === 'quiz' && api && api.stats().found < MIN_QUIZ) { tentativas++; sfx('alarme'); wrap.replaceChildren(topo(), portas(true), fala(`só ${api.stats().found} certa${api.stats().found === 1 ? '' : 's'}: a mesa de som precisa de ${MIN_QUIZ}. tenta de novo!`, h('button', { class: 'btn primary wide', type: 'button', onclick: fase }, 'tentar outra vez'))); return; }
      abertas++; sfx('porta'); if (abertas >= PORTAS.length) { setTimeout(() => sfx('vitoria'), 700); vitoria(); return; }
      wrap.replaceChildren(topo(), portas(), fala(`porta aberta! 🔓 agora: ${PORTAS[abertas].nome}. ${PORTAS[abertas].fala}`, h('button', { class: 'btn primary wide', type: 'button', onclick: fase }, 'próxima porta')));
    };
    wrap.replaceChildren(topo(), portas(), h('p', { class: 'tr-count' }, `${P.nome} · ${P.fala}`), box);
    if (P.id === 'quiz') { const qs = []; const vistos = new Set(); for (let k = 0; k < 80 && qs.length < Math.min(5, its.length); k++) { const q = T.question(its, ['blank', 'continua'][k % 2]); if (!vistos.has(q.item.n)) { vistos.add(q.item.n); qs.push(q); } } api = mod.quiz(box, ['blank', 'continua'], 'fuga', { qs, fim }); }
    else if (P.id === 'caca') api = mod.caca(box, { pick: T.easyPick(its, 6), mk: () => Math.random, fim });
    else api = mod.cruzadinha(box, { pick: T.easyPick(its, 5, { min: 4, max: 8 }), mk: () => Math.random, fim });
  };
  const vitoria = () => {
    const ms = Date.now() - t0; const rec = melhor(); const novo = !rec || ms < rec; if (novo) { try { localStorage.setItem(KB, String(ms)); } catch { /* sem armazenamento */ } }
    ganhou('fuga', 3).catch(() => {});
    const tela = fala(`💥 você abriu as 3 portas e libertou o Paul! tempo: ${seg(ms)}${tentativas ? ` · ${tentativas} tentativa${tentativas === 1 ? '' : 's'} na mesa de som` : ''}`, h('p', { class: 'muted' }, novo ? '🏆 novo recorde!' : `seu recorde: ${seg(rec)}`), h('p', { class: 'muted' }, '+ até 3 ★ (limite de 30 por dia)'),
      h('button', { class: 'btn primary wide', type: 'button', onclick: comeca }, 'fugir de novo'), h('a', { class: 'btn ghost wide', href: '#/jogos' }, 'voltar pros jogos'));
    wrap.replaceChildren(topo(), portas(), tela); FB.great(tela);
  };
  if (alunoSemCodigo()) wrap.replaceChildren(topo(), avisoCodigo('a Fuga do Estúdio é pra alunos da Beaterista: usa as dicas do método. peça seu código pra professora Bea!'));
  else import('../views/dicas.js').then((m) => { if (gone) return; if (m._duelo.items().length < 6) wrap.replaceChildren(topo(), h('div', { class: 'empty' }, h('p', { class: 'hand' }, 'as dicas ainda não chegaram.'), h('p', { class: 'muted' }, 'abre o app com internet uma vez e volta aqui.'))); else intro(); });
  return () => { gone = true; };
}
