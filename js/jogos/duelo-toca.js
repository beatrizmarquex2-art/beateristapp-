// Duelo do Toca Aqui: dois celulares, o MESMO compasso na pauta e o MESMO andamento (BPM). Cada um toca no seu aparelho (na tela ou no microfone) e, no fim, a precisão é comparada.
// A sala, a contagem e o placar vêm de duelo-base.js; o compasso e a nota vêm do próprio Toca Aqui (reading.js e leitura-missao.js).
import { h } from '../util.js';
import { PATH, TIERS } from '../reading.js';
import { linha, passo, ajuda } from './opcoes.js';
import { mountDueloBase } from './duelo-base.js';

const BPMS = Array.from({ length: 25 }, (_, i) => 40 + i * 5).map((b) => [b, `${b} bpm`]);
const tierNome = (id) => (TIERS.find((t) => t.id === id) || { name: id }).name;
/** Os 20 compassos do caminho do Toca Aqui (iguais nos dois celulares). */
export const EXERCICIOS = PATH.map((p, i) => ({ i, rot: `${tierNome(p.tier)} ${p.n}/${p.of}`, bar: p.bar }));
/** Quem ganhou no Toca Aqui: maior precisão; empate desempata por notas acertadas. */
export const notaToca = (r) => [r.score | 0, r.hits | 0];

export function mountDueloToca(host) {
  let L = null; let A0 = null; const cfg = { step: 0, bpm: 70 };
  return mountDueloBase(host, {
    jogo: 'tocaaqui', titulo: 'Duelo', sub: 'o mesmo ritmo, ao mesmo tempo, em dois celulares', voltar: ['#/jogos', '‹ jogos'], semCabecalho: true,
    async carregar() { L = await import('../views/leitura-missao.js'); A0 = await import('../audio.js'); },
    config({ redraw }) {
      const sel = h('select', { class: 'dl-sel', 'aria-label': 'Exercício', onchange: (e) => { cfg.step = +e.target.value; redraw(); } }, ...EXERCICIOS.map((x) => h('option', { value: x.i, selected: x.i === cfg.step || null }, x.rot)));
      return { cfg: () => ({ step: cfg.step, bpm: cfg.bpm }), nodes: [
        linha('exercício', sel), linha('andamento', passo(BPMS, cfg.bpm, (v) => { cfg.bpm = v; redraw(); }, 'andamento')),
        linha('regras', ajuda('Como funciona', 'os dois celulares leem o mesmo compasso e tocam no mesmo andamento (na tela ou no microfone). vence quem tocar mais no tempo. quem entra na sala toca o que o criador escolheu.'))] };
    },
    resumo: (c) => [EXERCICIOS[c.step] ? EXERCICIOS[c.step].rot : 'exercício', `${c.bpm} bpm`],
    desbloquear() { try { A0.audio(); } catch { /* ok */ } },
    nota: notaToca,
    aoVencer() { import('./estrelas-jogo.js').then((E) => E.ganhou('toca', 3)).catch(() => {}); }, // ganhou o duelo: 3 ★
    placar: (r) => [`${r.score}%`, `${r.hits}/${r.total} notas · média ${r.avgMs > 0 ? '+' : ''}${r.avgMs} ms`],
    jogar(box, c, fim) {
      const ex = EXERCICIOS[c.step] || EXERCICIOS[0]; let off = null; let tm = 0;
      const ctl = L.mountLeituraMissao(box, { bar: ex.bar, bpm: c.bpm, onResult: (r) => { off = setTimeout(() => fim({ score: r.score | 0, hits: r.hits | 0, total: r.total | 0, avgMs: r.avgMs | 0 }), r.delay || 1600); } });
      tm = setTimeout(() => { const b = box.querySelector('.tr-actions .btn.primary'); if (b) b.click(); }, 500); // a vez de tocar começa junto nos dois celulares
      return () => { clearTimeout(tm); clearTimeout(off); try { ctl.destroy(); } catch { /* ok */ } };
    },
  });
}
