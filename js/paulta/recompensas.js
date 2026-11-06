// pauLta: pacotinhos de figurinhas da Bateria. TUDO que dá carta está nesta tabela (é só mudar os números pra ajustar).
// Um pacote = { id, n (cartas), bea (chance em % de cada carta ser uma exclusiva da Beaterista), onde (texto) }.
// Os ids são fixos por jogador + modo + marco, então o mesmo marco nunca entrega duas vezes (mesmo jogando a fase de novo).
import * as S from './score.js';

export const TABELA = {
  // fácil: 1 carta a cada 3 fases concluídas; no fim 2 pacotinhos (3 cartas — pode vir Beaterista — e 2 cartas)
  drumF: { meio: { cada: 3, n: 1, bea: 0 }, fim: [{ k: 'a', n: 3, bea: 18 }, { k: 'b', n: 2, bea: 0 }] },
  // intermediário: 2 cartas a cada 5 fases (exclusivas também no meio); no fim 3 pacotinhos somando 7 cartas
  drumI: { meio: { cada: 5, n: 2, bea: 10 }, fim: [{ k: 'a', n: 3, bea: 20 }, { k: 'b', n: 2, bea: 12 }, { k: 'c', n: 2, bea: 12 }] },
  // difícil: 3 cartas a cada 5 fases concluídas com 3 estrelas; no fim 1 pacote de 4 (fecha as 10 figurinhas do modo se todas forem 3★)
  drumD: { meio3: { cada: 5, n: 3, bea: 15 }, fim: [{ k: 'a', n: 4, bea: 25 }] },
};
export const REVISAO = { n: 3, bea: 15 }; // 3 figurinhas por dia ao acertar as 10 da revisão

const id = (n, bea, pid, ...rest) => `pl:${n}:${bea}:${pid}:${rest.join(':')}`;
/** Todos os pacotes que o progresso `p` já mereceu (inclui os antigos: a entrega ignora os que já foram dados). */
export function merecidos(p, pid) {
  const out = [];
  for (const w of S.DRUMS) {
    const t = TABELA[w]; const lv = w.slice(-1); const done = (k) => !!p.done[`${w}:${k}`];
    if (t.meio) for (let k = t.meio.cada; k <= 12; k += t.meio.cada) if (done(k)) out.push({ id: id(t.meio.n, t.meio.bea, pid, lv, 'm', k), n: t.meio.n, bea: t.meio.bea, onde: `fase ${k} (${w})` });
    if (t.meio3) {
      let tres = 0; for (let k = 1; k <= 12; k++) if (done(k) && Math.max(...['nomes', 'imagens'].map((m) => (p.ph[S.phKey(w, k, m)] || {}).s || 0)) >= 3) tres++;
      for (let m = 1; m <= Math.floor(tres / t.meio3.cada); m++) out.push({ id: id(t.meio3.n, t.meio3.bea, pid, lv, 'm3', m), n: t.meio3.n, bea: t.meio3.bea, onde: `${m * t.meio3.cada} fases com 3 estrelas` });
    }
    if (S.worldDone(p, w)) for (const f of t.fim) out.push({ id: id(f.n, f.bea, pid, lv, 'fim', f.k), n: f.n, bea: f.bea, onde: 'modo concluído' });
  }
  return out;
}
export const totalDoModo = (w) => { const t = TABELA[w]; const meio = t.meio ? Math.floor(12 / t.meio.cada) * t.meio.n : 0; return { meio, fim: t.fim.reduce((a, f) => a + f.n, 0) }; };
export const revisaoId = (pid, dia) => id(REVISAO.n, REVISAO.bea, pid, 'rev', dia);

const PAD = ['peca:bd', 'peca:sn', 'peca:hh', 'peca:rd', 'combo:hh+bd', 'fig:colcheia', 'peca:tt', 'combo:rd+sn'];
/** 10 tags sem repetir seguidas: primeiro o que a pessoa mais errou, completando com revisão leve. */
export function ordemRevisao(tags, total = 10) {
  const base = tags.slice(0, 5); const pad = PAD.filter((t) => !base.includes(t)); const out = [];
  for (let i = 0; i < total; i++) {
    const pool = i % 2 === 0 || !pad.length ? base : pad; const src = pool.length ? pool : base.length ? base : pad;
    let t = src[Math.floor(i / 2) % src.length]; let k = 0;
    while (t === out[out.length - 1] && k++ < 12) t = [...base, ...pad][(i + k) % (base.length + pad.length)];
    out.push(t);
  }
  return out;
}
