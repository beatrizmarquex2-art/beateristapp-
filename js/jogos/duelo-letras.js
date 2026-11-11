// Duelo de Letras (caça-palavras, cruzadinha e quiz) em 2 celulares: o MESMO jogo nos dois (mesmas palavras, mesma grade), começando juntos depois da contagem.
// Dois jeitos de vencer: "quem termina primeiro" ou "por tempo" (quem faz mais no tempo escolhido). A sala, a contagem e o placar vêm de duelo-base.js.
import { h } from '../util.js';
import { linha, chips } from './opcoes.js';
import { mountDueloBase } from './duelo-base.js';
import { ganhou } from './estrelas-jogo.js';

const NOMES = { caca: 'caça-palavras', cruzadinha: 'cruzadinha', quiz: 'quiz' };
const TEMPOS = [[60, '1 min'], [120, '2 min'], [180, '3 min']];
const LIMITE_RAPIDO = 6 * 60; // no "quem termina primeiro", ninguém espera mais que 6 minutos
/** Sorteio com semente: os dois celulares geram a mesma grade. */
export const sementeRnd = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
/** Quem ganhou (maior vence): "primeiro" = quem terminou e com menos tempo (ninguém terminou: quem achou mais); "tempo" = quem achou mais, depois menos erros e menos tempo. */
export const notaLetras = (modo) => (r) => (modo === 'tempo' ? [r.found | 0, -(r.erros | 0), -(r.ms | 0)] : [r.done ? 1 : 0, r.done ? 1e7 - (r.ms | 0) : (r.found | 0), -(r.erros | 0)]);
const seg = (ms) => `${(ms / 1000).toFixed(1)} s`;

export function mountDueloLetras(host) {
  let D = null; let T = null; const cfg = { jogo: 'caca', modo: 'primeiro', seg: 120 };
  return mountDueloBase(host, {
    jogo: 'letras', titulo: 'Letras', sub: 'duelo em 2 celulares', voltar: ['#/dicas', '‹ letras'], semCabecalho: true,
    async carregar() { D = (await import('../views/dicas.js'))._duelo; T = await import('../tips.js'); },
    config({ redraw }) {
      return { cfg: () => {
        const its = D.items(); const seed = Math.floor(Math.random() * 2147483646) + 1; const c = { jogo: cfg.jogo, modo: cfg.modo, seg: cfg.seg, seed };
        if (cfg.jogo === 'caca') c.pick = T.easyPick(its, 6, undefined, sementeRnd(seed));
        else if (cfg.jogo === 'cruzadinha') c.pick = T.easyPick(its, 5, { min: 4, max: 8 }, sementeRnd(seed));
        else { const rnd = sementeRnd(seed); const qs = []; const vistos = new Set(); for (let k = 0; k < 60 && qs.length < Math.min(10, its.length); k++) { const q = T.question(its, ['blank', 'continua'][Math.floor(rnd() * 2)], rnd); if (!vistos.has(q.item.n)) { vistos.add(q.item.n); qs.push(q); } } c.qs = qs; }
        return c;
      }, nodes: [
        linha('jogo', chips(Object.entries(NOMES), cfg.jogo, (v) => { cfg.jogo = v; redraw(); }, 'Jogo')),
        linha('quem vence', chips([['primeiro', 'quem termina primeiro'], ['tempo', 'por tempo']], cfg.modo, (v) => { cfg.modo = v; redraw(); }, 'Como vence')),
        cfg.modo === 'tempo' ? linha('tempo', chips(TEMPOS, cfg.seg, (v) => { cfg.seg = v; redraw(); }, 'Tempo')) : null,
        h('p', { class: 'jg-p muted' }, cfg.modo === 'tempo' ? 'os dois jogam o mesmo tempo. vence quem achar mais (empate: menos erros).' : 'começam juntos e vence quem terminar primeiro (até 6 min).')] };
    },
    resumo: (c) => [`${NOMES[c.jogo] || c.jogo} · ${c.modo === 'tempo' ? `por tempo (${c.seg / 60} min)` : 'quem termina primeiro'}`, 'mesmas palavras nos dois celulares'],
    desbloquear() { /* nada a liberar */ },
    nota: (r) => notaLetras(r.modo || 'primeiro')(r),
    placar: (r) => [`${r.found}/${r.total}`, r.done ? `terminou em ${seg(r.ms)}` : `${r.erros} erro${r.erros === 1 ? '' : 's'} · ${seg(r.ms)}`],
    aoVencer() { ganhou(cfg.jogo === 'quiz' ? 'quiz' : cfg.jogo, 3); },
    jogar(box, c, fim) {
      cfg.jogo = c.jogo; // pra dar a estrela do jogo certo quem entrou na sala
      const t0 = Date.now(); let acabou = false; let tick = 0; let api = null;
      const timer = h('p', { class: 'tr-count dl-timer', role: 'timer' }); const inner = h('div'); box.replaceChildren(timer, inner);
      const termina = (done) => { if (acabou) return; acabou = true; clearInterval(tick); const s = api ? api.stats() : { found: 0, total: 0, erros: 0 }; fim({ modo: c.modo, done, found: s.found, total: s.total, erros: s.erros, ms: Date.now() - t0 }); };
      const mk = () => sementeRnd(c.seed);
      const opts = { pick: c.pick, qs: c.qs, mk, fim: () => setTimeout(() => termina(true), 700) };
      api = c.jogo === 'caca' ? D.caca(inner, opts) : c.jogo === 'cruzadinha' ? D.cruzadinha(inner, opts) : D.quiz(inner, ['blank', 'continua'], 'duelo', opts);
      const limite = (c.modo === 'tempo' ? c.seg : LIMITE_RAPIDO) * 1000;
      const pinta = () => { const dec = Date.now() - t0; const resta = Math.max(0, Math.ceil((limite - dec) / 1000)); timer.textContent = c.modo === 'tempo' ? `⏱ faltam ${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}` : `⏱ ${Math.floor(dec / 1000)} s`; if (dec >= limite) termina(false); };
      pinta(); tick = setInterval(pinta, 250);
      return () => { acabou = true; clearInterval(tick); };
    },
  });
}
